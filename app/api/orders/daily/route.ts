import { NextResponse, type NextRequest } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { customers, dailyOrderItems, dailyOrders, products } from '@/lib/db/schema'
import { withAuth, parseJson } from '@/lib/api/handler'
import { notify } from '@/lib/realtime/notify'

const ItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().positive(),
  unit: z.enum(['pieces', 'kg']),
  done: z.boolean().optional().default(false),
  variant: z.string().nullable().optional(),
})

const Schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  customerId: z.string().uuid(),
  items: z.array(ItemSchema),
})

export const POST = withAuth(
  async (req: NextRequest, { auth }) => {
    const body = await parseJson(req, Schema)

    // Verify customer belongs to this bakery
    const [customer] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(and(eq(customers.id, body.customerId), eq(customers.bakeryId, auth.bakeryId)))
      .limit(1)
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })

    // Verify all products belong to this bakery
    if (body.items.length > 0) {
      const owned = await db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.bakeryId, auth.bakeryId))
      const ownedSet = new Set(owned.map((p) => p.id))
      if (body.items.some((i) => !ownedSet.has(i.productId))) {
        return NextResponse.json({ error: 'Invalid product IDs' }, { status: 400 })
      }
    }

    await db.transaction(async (tx) => {
      const [order] = await tx
        .insert(dailyOrders)
        .values({ bakeryId: auth.bakeryId, date: body.date, customerId: body.customerId })
        .onConflictDoNothing({
          target: [dailyOrders.bakeryId, dailyOrders.date, dailyOrders.customerId],
        })
        .returning({ id: dailyOrders.id })

      let orderId = order?.id
      if (!orderId) {
        // Daily order already existed — fetch it
        const [existing] = await tx
          .select({ id: dailyOrders.id })
          .from(dailyOrders)
          .where(
            and(
              eq(dailyOrders.bakeryId, auth.bakeryId),
              eq(dailyOrders.date, body.date),
              eq(dailyOrders.customerId, body.customerId),
            ),
          )
          .limit(1)
        orderId = existing.id
        // Replace items
        await tx.delete(dailyOrderItems).where(eq(dailyOrderItems.dailyOrderId, orderId))
      }

      if (body.items.length > 0) {
        await tx.insert(dailyOrderItems).values(
          body.items.map((it) => ({
            dailyOrderId: orderId!,
            productId: it.productId,
            quantity: String(it.quantity),
            unit: it.unit,
            done: it.done ?? false,
            variant: it.variant ?? null,
          })),
        )
      }
    })

    await notify(auth.bakeryId, { type: 'orders.updated', date: body.date })
    return new NextResponse(null, { status: 204 })
  },
  { require: 'orders:edit' },
)
