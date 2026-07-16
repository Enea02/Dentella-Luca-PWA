import type { Unit } from '@/lib/types'

/**
 * Shared logic to resolve a fixed customer's recurring template into the effective
 * item list for a given weekday. Used by every read path that materializes/computes
 * a fixed customer's day: the single-date GET, the range GET, the daily-order seed,
 * and the Totals "Aggiunte" baseline.
 *
 * Rows carry a `weekday`:
 *   - `null`  = base row (applies to every weekday the customer is present);
 *   - `1..7`  = an override for that specific weekday.
 * A `removed` override (weekday 1..7) deletes a base product for that weekday.
 */
export interface RawRecurringItem {
  productId: string
  quantity: number
  unit: Unit
  position: number
  weekday: number | null
  removed: boolean
}

export interface EffectiveRecurringItem {
  productId: string
  quantity: number
  unit: Unit
  position: number
}

export function effectiveRecurringItems(
  rows: RawRecurringItem[],
  weekday: number,
): EffectiveRecurringItem[] {
  const effective = new Map<string, EffectiveRecurringItem>()

  // 1. Base rows first (order preserved by position later).
  for (const r of rows) {
    if (r.weekday === null) {
      effective.set(r.productId, {
        productId: r.productId,
        quantity: r.quantity,
        unit: r.unit,
        position: r.position,
      })
    }
  }

  // 2. Apply this weekday's overrides: remove tombstoned products, upsert the rest.
  // Overriding a base product preserves its base position (so editing a day's quantity
  // doesn't reorder it); products added only for this weekday keep the override position.
  for (const r of rows) {
    if (r.weekday === weekday) {
      if (r.removed) {
        effective.delete(r.productId)
      } else {
        const existing = effective.get(r.productId)
        effective.set(r.productId, {
          productId: r.productId,
          quantity: r.quantity,
          unit: r.unit,
          position: existing ? existing.position : r.position,
        })
      }
    }
  }

  return [...effective.values()].sort((a, b) => a.position - b.position)
}
