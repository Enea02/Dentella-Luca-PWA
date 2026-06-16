import { NextResponse, type NextRequest } from 'next/server'
import { and, asc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { customers, recurringOrderItems, recurringOrders } from '@/lib/db/schema'
import { withAuth, parseJson } from '@/lib/api/handler'
import { notify } from '@/lib/realtime/notify'

export const GET = withAuth<{ customerId: string }>(async (_req, { params, auth }) => {
  const { customerId } = await params

  const [recurring] = await db
    .select({
      id: recurringOrders.id,
      customerId: recurringOrders.customerId,
      weekdays: recurringOrders.weekdays,
    })
    .from(recurringOrders)
    .where(and(eq(recurringOrders.bakeryId, auth.bakeryId), eq(recurringOrders.customerId, customerId)))
    .limit(1)

  if (!recurring) return NextResponse.json(null)

  const items = await db
    .select({
      productId: recurringOrderItems.productId,
      quantity: recurringOrderItems.quantity,
      unit: recurringOrderItems.unit,
    })
    .from(recurringOrderItems)
    .where(eq(recurringOrderItems.recurringOrderId, recurring.id))
    .orderBy(asc(recurringOrderItems.position))

  return NextResponse.json({
    id: recurring.id,
    customerId: recurring.customerId,
    weekdays: recurring.weekdays ?? [],
    items: items.map((it) => ({
      productId: it.productId,
      quantity: Number(it.quantity),
      unit: it.unit,
      done: false,
    })),
  })
})

const PutSchema = z.object({
  weekdays: z.array(z.number().int().min(1).max(7)),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().positive(),
      unit: z.enum(['pieces', 'kg']),
    }),
  ),
})

export const PUT = withAuth<{ customerId: string }>(
  async (req: NextRequest, { params, auth }) => {
    const { customerId } = await params
    const body = await parseJson(req, PutSchema)

    const [customer] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(and(eq(customers.id, customerId), eq(customers.bakeryId, auth.bakeryId)))
      .limit(1)
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })

    await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({ id: recurringOrders.id })
        .from(recurringOrders)
        .where(
          and(eq(recurringOrders.bakeryId, auth.bakeryId), eq(recurringOrders.customerId, customerId)),
        )
        .limit(1)

      let recurringId: string
      if (existing) {
        recurringId = existing.id
        await tx
          .update(recurringOrders)
          .set({ weekdays: body.weekdays })
          .where(eq(recurringOrders.id, recurringId))
        await tx.delete(recurringOrderItems).where(eq(recurringOrderItems.recurringOrderId, recurringId))
      } else {
        const [created] = await tx
          .insert(recurringOrders)
          .values({ bakeryId: auth.bakeryId, customerId, weekdays: body.weekdays })
          .returning({ id: recurringOrders.id })
        recurringId = created.id
      }

      if (body.items.length > 0) {
        await tx.insert(recurringOrderItems).values(
          body.items.map((it, index) => ({
            recurringOrderId: recurringId,
            productId: it.productId,
            quantity: String(it.quantity),
            unit: it.unit,
            position: index,
          })),
        )
      }
    })

    await notify(auth.bakeryId, { type: 'orders.updated' })
    return new NextResponse(null, { status: 204 })
  },
  { require: 'customers:write' },
)
