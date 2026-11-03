import { NextResponse, type NextRequest } from 'next/server'
import { and, desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { customers, dailyOrderItems, products } from '@/lib/db/schema'
import { withAuth, parseJson } from '@/lib/api/handler'
import { notify } from '@/lib/realtime/notify'
import { getOrCreateDailyOrder } from '@/lib/orders/daily'

const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

// "Posticipa" (long press on a product in Ordini): a product that's missing
// today moves to a later day of the same customer. The source day is
// materialized (as any structural edit) and loses the item; the target day
// gets it — summed with the same product if already there — marked
// postponedFrom so the order shows "rimandato dal …".
const Schema = z
  .object({
    date: IsoDate,
    toDate: IsoDate,
    customerId: z.string().uuid(),
    productId: z.string().uuid(),
  })
  .refine((b) => b.toDate > b.date, { message: 'Il nuovo giorno deve essere dopo quello attuale', path: ['toDate'] })

class PostponeError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
  }
}

export const POST = withAuth(
  async (req: NextRequest, { auth }) => {
    const { date, toDate, customerId, productId } = await parseJson(req, Schema)

    // Tenant guard: customer and product must belong to this bakery.
    const [customer] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(and(eq(customers.id, customerId), eq(customers.bakeryId, auth.bakeryId)))
    const [product] = await db
      .select({ id: products.id })
      .from(products)
      .where(and(eq(products.id, productId), eq(products.bakeryId, auth.bakeryId)))
    if (!customer || !product) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    try {
      await db.transaction(async (tx) => {
        const fromId = await getOrCreateDailyOrder(tx, auth.bakeryId, date, customerId)
        const [moved] = await tx
          .delete(dailyOrderItems)
          .where(and(eq(dailyOrderItems.dailyOrderId, fromId), eq(dailyOrderItems.productId, productId)))
          .returning({
            quantity: dailyOrderItems.quantity,
            unit: dailyOrderItems.unit,
            variant: dailyOrderItems.variant,
            postponedFrom: dailyOrderItems.postponedFrom,
          })
        if (!moved) throw new PostponeError('Prodotto non presente in questo giorno', 404)

        const toId = await getOrCreateDailyOrder(tx, auth.bakeryId, toDate, customerId)
        // Postponed twice keeps the ORIGINAL day.
        const from = moved.postponedFrom ?? date
        const [existing] = await tx
          .select({ id: dailyOrderItems.id, quantity: dailyOrderItems.quantity, unit: dailyOrderItems.unit })
          .from(dailyOrderItems)
          .where(and(eq(dailyOrderItems.dailyOrderId, toId), eq(dailyOrderItems.productId, productId)))

        if (existing) {
          if (existing.unit !== moved.unit) {
            throw new PostponeError('Quel giorno il prodotto è già ordinato con un’altra unità (pz / kg)', 409)
          }
          await tx
            .update(dailyOrderItems)
            .set({
              quantity: String(Number(existing.quantity) + Number(moved.quantity)),
              done: false,
              postponedFrom: from,
            })
            .where(eq(dailyOrderItems.id, existing.id))
        } else {
          const [last] = await tx
            .select({ position: dailyOrderItems.position })
            .from(dailyOrderItems)
            .where(eq(dailyOrderItems.dailyOrderId, toId))
            .orderBy(desc(dailyOrderItems.position))
            .limit(1)
          await tx.insert(dailyOrderItems).values({
            dailyOrderId: toId,
            productId,
            quantity: moved.quantity,
            unit: moved.unit,
            variant: moved.variant,
            done: false,
            position: last ? last.position + 1 : 0,
            postponedFrom: from,
          })
        }
      })
    } catch (err) {
      if (err instanceof PostponeError) return NextResponse.json({ error: err.message }, { status: err.status })
      throw err
    }

    await notify(auth.bakeryId, { type: 'orders.updated', date })
    await notify(auth.bakeryId, { type: 'orders.updated', date: toDate })
    return new NextResponse(null, { status: 204 })
  },
  { require: 'orders:postpone' },
)
