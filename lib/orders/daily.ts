// Daily-order materialization, shared by the order routes (items, postpone).
import { and, asc, eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import {
  customers,
  dailyItemStatus,
  dailyOrderItems,
  dailyOrders,
  recurringOrderItems,
  recurringOrders,
} from '@/lib/db/schema'
import { dayOfWeek } from '@/lib/utils'
import { effectiveRecurringItems, isSuspendedOn, type RawRecurringItem } from '@/lib/orders/recurring'

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

/**
 * Return the daily order id for (bakery, date, customer), creating it if needed.
 * When created, it is seeded from the customer's recurring order for that weekday,
 * carrying over any per-day done/variant overrides (from daily_item_status) so a
 * materialization doesn't wipe items already marked done — then those now-redundant
 * override rows are deleted (the daily order supersedes them for this date).
 *
 * Used whenever a STRUCTURAL edit (add item / change quantity or unit) must land
 * on a real daily_order item — daily_item_status can only hold done/variant.
 */
export async function getOrCreateDailyOrder(
  tx: Tx,
  bakeryId: string,
  date: string,
  customerId: string,
): Promise<string> {
  const existing = await tx
    .select({ id: dailyOrders.id })
    .from(dailyOrders)
    .where(
      and(
        eq(dailyOrders.bakeryId, bakeryId),
        eq(dailyOrders.date, date),
        eq(dailyOrders.customerId, customerId),
      ),
    )
    .limit(1)
  if (existing.length > 0) return existing[0].id

  const [created] = await tx
    .insert(dailyOrders)
    .values({ bakeryId, date, customerId })
    .returning({ id: dailyOrders.id })
  const dailyId = created.id

  // Seed from the recurring order if it covers this weekday.
  const weekday = dayOfWeek(date)
  const [recurring] = await tx
    .select({
      id: recurringOrders.id,
      weekdays: recurringOrders.weekdays,
      dayOrders: recurringOrders.dayOrders,
      suspendedFrom: customers.suspendedFrom,
      suspendedTo: customers.suspendedTo,
    })
    .from(recurringOrders)
    .innerJoin(customers, eq(customers.id, recurringOrders.customerId))
    .where(and(eq(recurringOrders.bakeryId, bakeryId), eq(recurringOrders.customerId, customerId)))
    .limit(1)

  // A suspended customer has no template order on this date: nothing to seed.
  if (recurring && (recurring.weekdays ?? []).includes(weekday) && !isSuspendedOn(recurring, date)) {
    const rawRows = await tx
      .select({
        productId: recurringOrderItems.productId,
        quantity: recurringOrderItems.quantity,
        unit: recurringOrderItems.unit,
        position: recurringOrderItems.position,
        weekday: recurringOrderItems.weekday,
        removed: recurringOrderItems.removed,
      })
      .from(recurringOrderItems)
      .where(eq(recurringOrderItems.recurringOrderId, recurring.id))
      .orderBy(asc(recurringOrderItems.position))

    // Resolve base + per-weekday overrides into the effective set for this date.
    const recItems: RawRecurringItem[] = rawRows.map((it) => ({
      productId: it.productId,
      quantity: Number(it.quantity),
      unit: it.unit,
      position: it.position,
      weekday: it.weekday,
      removed: it.removed,
    }))
    const effective = effectiveRecurringItems(recItems, weekday, recurring.dayOrders?.[String(weekday)])

    if (effective.length > 0) {
      // Carry over per-day done/variant overrides so they survive materialization.
      const statusRows = await tx
        .select({
          productId: dailyItemStatus.productId,
          done: dailyItemStatus.done,
          productionDone: dailyItemStatus.productionDone,
          variant: dailyItemStatus.variant,
        })
        .from(dailyItemStatus)
        .where(
          and(
            eq(dailyItemStatus.bakeryId, bakeryId),
            eq(dailyItemStatus.date, date),
            eq(dailyItemStatus.customerId, customerId),
          ),
        )
      const statusByProduct = new Map(statusRows.map((s) => [s.productId, s]))

      await tx
        .insert(dailyOrderItems)
        .values(
          effective.map((it, i) => {
            const s = statusByProduct.get(it.productId)
            return {
              dailyOrderId: dailyId,
              productId: it.productId,
              quantity: String(it.quantity),
              unit: it.unit,
              done: s?.done ?? false,
              productionDone: s?.productionDone ?? false,
              variant: s?.variant ?? null,
              position: i,
            }
          }),
        )
        // A malformed template with the same product twice must not break seeding.
        .onConflictDoNothing({
          target: [dailyOrderItems.dailyOrderId, dailyOrderItems.productId],
        })

      // The daily order now governs this date for this customer.
      await tx
        .delete(dailyItemStatus)
        .where(
          and(
            eq(dailyItemStatus.bakeryId, bakeryId),
            eq(dailyItemStatus.date, date),
            eq(dailyItemStatus.customerId, customerId),
          ),
        )
    }
  }

  return dailyId
}
