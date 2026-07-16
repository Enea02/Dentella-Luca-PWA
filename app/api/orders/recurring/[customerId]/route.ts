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

  const rows = await db
    .select({
      productId: recurringOrderItems.productId,
      quantity: recurringOrderItems.quantity,
      unit: recurringOrderItems.unit,
      weekday: recurringOrderItems.weekday,
      removed: recurringOrderItems.removed,
    })
    .from(recurringOrderItems)
    .where(eq(recurringOrderItems.recurringOrderId, recurring.id))
    .orderBy(asc(recurringOrderItems.position))

  // Split base rows (weekday null) from per-weekday override rows.
  const base = rows
    .filter((r) => r.weekday === null)
    .map((r) => ({ productId: r.productId, quantity: Number(r.quantity), unit: r.unit }))

  const overrides: Record<number, { productId: string; quantity: number; unit: 'pieces' | 'kg'; removed: boolean }[]> = {}
  for (const r of rows) {
    if (r.weekday === null) continue
    ;(overrides[r.weekday] ??= []).push({
      productId: r.productId,
      quantity: Number(r.quantity),
      unit: r.unit,
      removed: r.removed,
    })
  }

  return NextResponse.json({
    id: recurring.id,
    customerId: recurring.customerId,
    weekdays: recurring.weekdays ?? [],
    base,
    overrides,
  })
})

const BaseItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().positive(),
  unit: z.enum(['pieces', 'kg']),
})

const OverrideItemSchema = BaseItemSchema.extend({
  removed: z.boolean().optional().default(false),
})

const PutSchema = z.object({
  weekdays: z.array(z.number().int().min(1).max(7)),
  base: z.array(BaseItemSchema),
  // Keyed by weekday ("1".."7"); JSON object keys are strings.
  overrides: z.record(z.string().regex(/^[1-7]$/), z.array(OverrideItemSchema)).optional().default({}),
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

      // Build the flat row set: base rows first (position 0..b-1, weekday null), then
      // per-weekday override rows (positions continue after base so added-for-day items
      // sort below the base list). Overridden base products keep their base position at
      // read time (see lib/orders/recurring.ts).
      const values: {
        recurringOrderId: string
        productId: string
        quantity: string
        unit: 'pieces' | 'kg'
        position: number
        weekday: number | null
        removed: boolean
      }[] = []

      let position = 0
      for (const it of body.base) {
        values.push({
          recurringOrderId: recurringId,
          productId: it.productId,
          quantity: String(it.quantity),
          unit: it.unit,
          position: position++,
          weekday: null,
          removed: false,
        })
      }
      for (const [wdStr, items] of Object.entries(body.overrides ?? {})) {
        const weekday = Number(wdStr)
        for (const it of items) {
          values.push({
            recurringOrderId: recurringId,
            productId: it.productId,
            quantity: String(it.quantity),
            unit: it.unit,
            position: position++,
            weekday,
            removed: it.removed ?? false,
          })
        }
      }

      if (values.length > 0) {
        await tx.insert(recurringOrderItems).values(values)
      }
    })

    await notify(auth.bakeryId, { type: 'orders.updated' })
    return new NextResponse(null, { status: 204 })
  },
  { require: 'customers:write' },
)
