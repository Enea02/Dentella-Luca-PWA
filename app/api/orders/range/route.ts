import { NextResponse, type NextRequest } from 'next/server'
import { and, asc, between, eq, inArray } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import {
  customers,
  dailyItemStatus,
  dailyOrderItems,
  dailyOrders,
  recurringOrderItems,
  recurringOrders,
} from '@/lib/db/schema'
import { withAuth, jsonWithCache } from '@/lib/api/handler'
import { dayOfWeek, getOrderStatus } from '@/lib/utils'
import { effectiveRecurringItems, type RawRecurringItem } from '@/lib/orders/recurring'
import type { ComputedDayOrder, OrderItem } from '@/lib/types'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
// Up to a full year (with buffer for leap years / inclusive bounds), so the
// statistics view can quantify a whole year of production — past or future.
// Future dates for fixed customers are computed from the recurring templates.
const MAX_DAYS = 367

// Inclusive list of ISO dates from `from` to `to`, clamped to MAX_DAYS.
function datesInRange(from: string, to: string): string[] {
  const dates: string[] = []
  const cur = new Date(from + 'T00:00:00')
  const end = new Date(to + 'T00:00:00')
  while (cur <= end && dates.length < MAX_DAYS) {
    const y = cur.getFullYear()
    const m = String(cur.getMonth() + 1).padStart(2, '0')
    const d = String(cur.getDate()).padStart(2, '0')
    dates.push(`${y}-${m}-${d}`)
    cur.setDate(cur.getDate() + 1)
  }
  return dates
}

export const GET = withAuth(async (req: NextRequest, { auth }) => {
  const from = req.nextUrl.searchParams.get('from')
  const to = req.nextUrl.searchParams.get('to')
  if (!from || !to || !ISO_DATE.test(from) || !ISO_DATE.test(to)) {
    return NextResponse.json({ error: 'Invalid or missing ?from / ?to' }, { status: 400 })
  }
  if (from > to) {
    return NextResponse.json({ error: '?from must be <= ?to' }, { status: 400 })
  }

  const dates = datesInRange(from, to)
  // The effective upper bound after clamping to MAX_DAYS.
  const effectiveTo = dates.length > 0 ? dates[dates.length - 1] : to

  // 4 parallel queries for the whole range.
  const [allCustomers, recurringRows, dailyRows, statusRows] = await Promise.all([
    db
      .select({ id: customers.id, name: customers.name, type: customers.type })
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
      .select({ id: dailyOrders.id, date: dailyOrders.date, customerId: dailyOrders.customerId })
      .from(dailyOrders)
      .where(
        and(
          eq(dailyOrders.bakeryId, auth.bakeryId),
          between(dailyOrders.date, from, effectiveTo),
        ),
      ),
    db
      .select({
        date: dailyItemStatus.date,
        customerId: dailyItemStatus.customerId,
        productId: dailyItemStatus.productId,
        done: dailyItemStatus.done,
        variant: dailyItemStatus.variant,
      })
      .from(dailyItemStatus)
      .where(
        and(
          eq(dailyItemStatus.bakeryId, auth.bakeryId),
          between(dailyItemStatus.date, from, effectiveTo),
        ),
      ),
  ])

  const customerById = new Map(allCustomers.map((c) => [c.id, c]))

  // Recurring items keyed by recurring order id (one fetch for all active recurring).
  const recItems =
    recurringRows.length > 0
      ? await db
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
          .where(
            inArray(
              recurringOrderItems.recurringOrderId,
              recurringRows.map((r) => r.id),
            ),
          )
          .orderBy(asc(recurringOrderItems.position))
      : []

  // Raw template rows grouped per recurring order; resolved to the effective set
  // per date's weekday below (base rows + per-weekday overrides).
  const rawByOrder = new Map<string, RawRecurringItem[]>()
  for (const it of recItems) {
    const arr = rawByOrder.get(it.recurringOrderId) ?? []
    arr.push({
      productId: it.productId,
      quantity: Number(it.quantity),
      unit: it.unit,
      position: it.position,
      weekday: it.weekday,
      removed: it.removed,
    })
    rawByOrder.set(it.recurringOrderId, arr)
  }

  // Daily order items keyed by daily order id (one fetch for the whole range).
  const dailyItemsRows =
    dailyRows.length > 0
      ? await db
          .select({
            dailyOrderId: dailyOrderItems.dailyOrderId,
            productId: dailyOrderItems.productId,
            quantity: dailyOrderItems.quantity,
            unit: dailyOrderItems.unit,
            done: dailyOrderItems.done,
            variant: dailyOrderItems.variant,
            position: dailyOrderItems.position,
          })
          .from(dailyOrderItems)
          .where(
            inArray(
              dailyOrderItems.dailyOrderId,
              dailyRows.map((d) => d.id),
            ),
          )
          .orderBy(asc(dailyOrderItems.position))
      : []

  const itemsByDaily = new Map<string, OrderItem[]>()
  for (const it of dailyItemsRows) {
    const arr = itemsByDaily.get(it.dailyOrderId) ?? []
    arr.push({
      productId: it.productId,
      quantity: Number(it.quantity),
      unit: it.unit,
      done: it.done,
      ...(it.variant != null ? { variant: it.variant } : {}),
    })
    itemsByDaily.set(it.dailyOrderId, arr)
  }

  // Group daily orders by date.
  const dailyByDate = new Map<string, { id: string; customerId: string }[]>()
  for (const d of dailyRows) {
    const arr = dailyByDate.get(d.date) ?? []
    arr.push({ id: d.id, customerId: d.customerId })
    dailyByDate.set(d.date, arr)
  }

  // Status overrides keyed by `date|customerId|productId`.
  const statusByKey = new Map<string, { done: boolean; variant: string | null }>()
  for (const s of statusRows) {
    statusByKey.set(`${s.date}|${s.customerId}|${s.productId}`, { done: s.done, variant: s.variant })
  }

  // Assemble per-date, mirroring app/api/orders/route.ts merge semantics.
  const result: { date: string; orders: ComputedDayOrder[] }[] = dates.map((date) => {
    const weekday = dayOfWeek(date)
    const activeRecurring = recurringRows.filter((r) => (r.weekdays ?? []).includes(weekday))
    const orderMap = new Map<string, ComputedDayOrder>()

    // 1. Recurring orders for this weekday.
    for (const r of activeRecurring) {
      const customer = customerById.get(r.customerId)
      if (!customer) continue
      const items: OrderItem[] = effectiveRecurringItems(rawByOrder.get(r.id) ?? [], weekday).map(
        (it) => {
          const status = statusByKey.get(`${date}|${r.customerId}|${it.productId}`)
          return {
            productId: it.productId,
            quantity: it.quantity,
            unit: it.unit,
            done: status?.done ?? false,
            ...(status?.variant != null ? { variant: status.variant } : {}),
          }
        },
      )
      orderMap.set(r.customerId, {
        customerId: r.customerId,
        customerName: customer.name,
        customerType: customer.type,
        items,
        status: getOrderStatus(items),
      })
    }

    // 2. Daily orders for this date — override recurring entirely.
    for (const d of dailyByDate.get(date) ?? []) {
      const customer = customerById.get(d.customerId)
      if (!customer) continue
      const hadRecurring = orderMap.has(d.customerId)
      const items = itemsByDaily.get(d.id) ?? []
      orderMap.set(d.customerId, {
        customerId: d.customerId,
        customerName: customer.name,
        customerType: hadRecurring ? customer.type : 'single',
        items,
        status: getOrderStatus(items),
      })
    }

    return { date, orders: Array.from(orderMap.values()) }
  })

  return jsonWithCache(result, 60, 300)
})
