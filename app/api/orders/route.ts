import { NextResponse, type NextRequest } from 'next/server'
import { and, eq, inArray } from 'drizzle-orm'
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
import type { ComputedDayOrder, OrderItem } from '@/lib/types'

export const GET = withAuth(async (req: NextRequest, { auth }) => {
  const date = req.nextUrl.searchParams.get('date')
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Invalid or missing ?date' }, { status: 400 })
  }

  const weekday = dayOfWeek(date)

  const allCustomers = await db
    .select({ id: customers.id, name: customers.name, type: customers.type })
    .from(customers)
    .where(eq(customers.bakeryId, auth.bakeryId))

  const customerById = new Map(allCustomers.map((c) => [c.id, c]))
  const orderMap = new Map<string, ComputedDayOrder>()

  // 1. Recurring orders for this weekday
  const recurringRows = await db
    .select({
      id: recurringOrders.id,
      customerId: recurringOrders.customerId,
      weekdays: recurringOrders.weekdays,
    })
    .from(recurringOrders)
    .where(eq(recurringOrders.bakeryId, auth.bakeryId))

  const activeRecurring = recurringRows.filter((r) => (r.weekdays ?? []).includes(weekday))

  if (activeRecurring.length > 0) {
    const recItems = await db
      .select({
        recurringOrderId: recurringOrderItems.recurringOrderId,
        productId: recurringOrderItems.productId,
        quantity: recurringOrderItems.quantity,
        unit: recurringOrderItems.unit,
      })
      .from(recurringOrderItems)
      .where(
        inArray(
          recurringOrderItems.recurringOrderId,
          activeRecurring.map((r) => r.id),
        ),
      )

    // Daily overrides (done/variant) for these customers on this date
    const statusRows = await db
      .select({
        customerId: dailyItemStatus.customerId,
        productId: dailyItemStatus.productId,
        done: dailyItemStatus.done,
        variant: dailyItemStatus.variant,
      })
      .from(dailyItemStatus)
      .where(and(eq(dailyItemStatus.bakeryId, auth.bakeryId), eq(dailyItemStatus.date, date)))
    const statusMap = new Map<string, { done: boolean; variant: string | null }>()
    for (const s of statusRows) {
      statusMap.set(`${s.customerId}|${s.productId}`, { done: s.done, variant: s.variant })
    }

    const itemsByRecurring = new Map<string, OrderItem[]>()
    for (const it of recItems) {
      const arr = itemsByRecurring.get(it.recurringOrderId) ?? []
      const status = statusMap.get(`${activeRecurring.find((r) => r.id === it.recurringOrderId)!.customerId}|${it.productId}`)
      arr.push({
        productId: it.productId,
        quantity: Number(it.quantity),
        unit: it.unit,
        done: status?.done ?? false,
        ...(status?.variant != null ? { variant: status.variant } : {}),
      })
      itemsByRecurring.set(it.recurringOrderId, arr)
    }

    for (const r of activeRecurring) {
      const customer = customerById.get(r.customerId)
      if (!customer) continue
      const items = itemsByRecurring.get(r.id) ?? []
      orderMap.set(r.customerId, {
        customerId: r.customerId,
        customerName: customer.name,
        customerType: customer.type,
        items,
        status: getOrderStatus(items),
      })
    }
  }

  // 2. Daily orders for this date — override recurring entirely
  const dailyRows = await db
    .select({ id: dailyOrders.id, customerId: dailyOrders.customerId })
    .from(dailyOrders)
    .where(and(eq(dailyOrders.bakeryId, auth.bakeryId), eq(dailyOrders.date, date)))

  if (dailyRows.length > 0) {
    const dailyItemsRows = await db
      .select({
        dailyOrderId: dailyOrderItems.dailyOrderId,
        productId: dailyOrderItems.productId,
        quantity: dailyOrderItems.quantity,
        unit: dailyOrderItems.unit,
        done: dailyOrderItems.done,
        variant: dailyOrderItems.variant,
      })
      .from(dailyOrderItems)
      .where(
        inArray(
          dailyOrderItems.dailyOrderId,
          dailyRows.map((d) => d.id),
        ),
      )

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

  return NextResponse.json(Array.from(orderMap.values()))
})
