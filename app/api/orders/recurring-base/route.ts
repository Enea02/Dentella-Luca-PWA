import { NextResponse, type NextRequest } from 'next/server'
import { and, asc, eq, inArray } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { customers, products, recurringOrderItems, recurringOrders } from '@/lib/db/schema'
import { withAuth } from '@/lib/api/handler'
import { dayOfWeek, toPieces } from '@/lib/utils'
import { effectiveRecurringItems, type RawRecurringItem } from '@/lib/orders/recurring'

/**
 * Baseline of the day: the "fixed" production if no manual edits were made — i.e. the
 * sum, over all active fixed customers present this weekday, of their recurring template
 * (resolved per weekday). Returned as total **pieces** per product so the Totals
 * "Aggiunte" board can compute delta = actual − base and then render in the product's
 * own unit. See docs/development-plan.md (A1).
 */
export const GET = withAuth(async (req: NextRequest, { auth }) => {
  const date = req.nextUrl.searchParams.get('date')
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Invalid or missing ?date' }, { status: 400 })
  }

  const weekday = dayOfWeek(date)

  const [activeCustomers, recurringRows, piecesRows] = await Promise.all([
    db
      .select({ id: customers.id })
      .from(customers)
      .where(and(eq(customers.bakeryId, auth.bakeryId), eq(customers.active, true))),
    db
      .select({
        id: recurringOrders.id,
        customerId: recurringOrders.customerId,
        weekdays: recurringOrders.weekdays,
      })
      .from(recurringOrders)
      .where(eq(recurringOrders.bakeryId, auth.bakeryId)),
    db
      .select({ id: products.id, piecesPerKg: products.piecesPerKg })
      .from(products)
      .where(eq(products.bakeryId, auth.bakeryId)),
  ])

  const activeIds = new Set(activeCustomers.map((c) => c.id))
  const piecesPerKgById = new Map(piecesRows.map((p) => [p.id, p.piecesPerKg]))

  // Only active customers present this weekday contribute to the base.
  const relevant = recurringRows.filter(
    (r) => activeIds.has(r.customerId) && (r.weekdays ?? []).includes(weekday),
  )

  const basePieces = new Map<string, number>()
  if (relevant.length > 0) {
    const itemRows = await db
      .select({
        recurringOrderId: recurringOrderItems.recurringOrderId,
        productId: recurringOrderItems.productId,
        quantity: recurringOrderItems.quantity,
        unit: recurringOrderItems.unit,
        position: recurringOrderItems.position,
        weekday: recurringOrderItems.weekday,
        removed: recurringOrderItems.removed,
      })
      .from(recurringOrderItems)
      .where(inArray(recurringOrderItems.recurringOrderId, relevant.map((r) => r.id)))
      .orderBy(asc(recurringOrderItems.position))

    const rowsByOrder = new Map<string, RawRecurringItem[]>()
    for (const it of itemRows) {
      const arr = rowsByOrder.get(it.recurringOrderId) ?? []
      arr.push({
        productId: it.productId,
        quantity: Number(it.quantity),
        unit: it.unit,
        position: it.position,
        weekday: it.weekday,
        removed: it.removed,
      })
      rowsByOrder.set(it.recurringOrderId, arr)
    }

    for (const r of relevant) {
      const items = effectiveRecurringItems(rowsByOrder.get(r.id) ?? [], weekday)
      for (const it of items) {
        const pieces = toPieces(it.quantity, it.unit, piecesPerKgById.get(it.productId) ?? undefined)
        basePieces.set(it.productId, (basePieces.get(it.productId) ?? 0) + pieces)
      }
    }
  }

  const result = [...basePieces.entries()].map(([productId, pieces]) => ({ productId, pieces }))
  const res = NextResponse.json(result)
  res.headers.set('Cache-Control', 'private, no-store')
  return res
})
