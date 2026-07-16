import { NextResponse, type NextRequest } from 'next/server'
import { and, asc, eq, inArray } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import {
  customers,
  dailyItemStatus,
  dailyOrderItems,
  dailyOrders,
  recurringOrderItems,
  recurringOrders,
} from '@/lib/db/schema'
import { withAuth } from '@/lib/api/handler'
import { dayOfWeek, getOrderStatus } from '@/lib/utils'
import { effectiveRecurringItems, type RawRecurringItem } from '@/lib/orders/recurring'
import type { ComputedDayOrder, OrderItem } from '@/lib/types'

export const GET = withAuth(async (req: NextRequest, { auth }) => {
  const date = req.nextUrl.searchParams.get('date')
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Invalid or missing ?date' }, { status: 400 })
  }

  const weekday = dayOfWeek(date)

  // These three queries are independent — run them in parallel.
  const [allCustomers, recurringRows, dailyRows] = await Promise.all([
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
      .select({ id: dailyOrders.id, customerId: dailyOrders.customerId })
      .from(dailyOrders)
      .where(and(eq(dailyOrders.bakeryId, auth.bakeryId), eq(dailyOrders.date, date))),
  ])

  const customerById = new Map(allCustomers.map((c) => [c.id, c]))
  const orderMap = new Map<string, ComputedDayOrder>()

  // 1. Recurring orders for this weekday
  const activeRecurring = recurringRows.filter((r) => (r.weekdays ?? []).includes(weekday))

  if (activeRecurring.length > 0) {
    // Recurring items and daily overrides are independent — run in parallel.
    const [recItems, statusRows] = await Promise.all([
      db
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
            activeRecurring.map((r) => r.id),
          ),
        )
        .orderBy(asc(recurringOrderItems.position)),
      db
        .select({
          customerId: dailyItemStatus.customerId,
          productId: dailyItemStatus.productId,
          done: dailyItemStatus.done,
          variant: dailyItemStatus.variant,
        })
        .from(dailyItemStatus)
        .where(and(eq(dailyItemStatus.bakeryId, auth.bakeryId), eq(dailyItemStatus.date, date))),
    ])
    const statusMap = new Map<string, { done: boolean; variant: string | null }>()
    for (const s of statusRows) {
      statusMap.set(`${s.customerId}|${s.productId}`, { done: s.done, variant: s.variant })
    }

    // Group raw template rows per recurring order, then resolve the effective set for
    // this weekday (base rows merged with per-weekday overrides).
    const rawByRecurring = new Map<string, RawRecurringItem[]>()
    for (const it of recItems) {
      const arr = rawByRecurring.get(it.recurringOrderId) ?? []
      arr.push({
        productId: it.productId,
        quantity: Number(it.quantity),
        unit: it.unit,
        position: it.position,
        weekday: it.weekday,
        removed: it.removed,
      })
      rawByRecurring.set(it.recurringOrderId, arr)
    }

    for (const r of activeRecurring) {
      const customer = customerById.get(r.customerId)
      if (!customer) continue
      const effective = effectiveRecurringItems(rawByRecurring.get(r.id) ?? [], weekday)
      const items: OrderItem[] = effective.map((it) => {
        const status = statusMap.get(`${r.customerId}|${it.productId}`)
        return {
          productId: it.productId,
          quantity: it.quantity,
          unit: it.unit,
          done: status?.done ?? false,
          ...(status?.variant != null ? { variant: status.variant } : {}),
        }
      })
      orderMap.set(r.customerId, {
        customerId: r.customerId,
        customerName: customer.name,
        customerType: customer.type,
        items,
        status: getOrderStatus(items),
      })
    }
  }

  // 2. Daily orders for this date — override recurring entirely.
  // (dailyRows was fetched above in the parallel batch.)
  if (dailyRows.length > 0) {
    const dailyItemsRows = await db
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

    for (const d of dailyRows) {
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
  }

  const res = NextResponse.json(Array.from(orderMap.values()))
  res.headers.set('Cache-Control', 'private, no-store')
  return res
})
