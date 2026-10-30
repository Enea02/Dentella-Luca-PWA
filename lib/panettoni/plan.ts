// Production planner for the Panettoni campaign. Pure and framework-free so it
// runs on the client (live preview) and on the server ("Conferma piano"), and
// can be unit-tested (plan.test.ts). Port of `buildPlan` from the design
// prototype, generalised from "days of December" to ISO dates.
import type { DeliveryKind, PanettoneOrder, PlanParams } from './types'

export interface PlanOrderRef {
  orderId: string
  name: string
  qty: number
  due: string // delivery date (YYYY-MM-DD)
  kind: DeliveryKind
  // Baked earlier than its latest useful day.
  moved: boolean
}

export interface PlanItem {
  flavorId: string
  qty: number
  orders: PlanOrderRef[]
  // Only on confirmed snapshots: marked "fatto" from the Produzione tab.
  done?: boolean
}

export interface PlanDay {
  date: string
  closed: boolean
  total: number
  items: Record<string, PlanItem> // by flavorId
}

export interface PlanLeftover {
  orderId: string
  name: string
  flavorId: string
  qty: number
  due: string
  kind: DeliveryKind
}

export interface PlanResult {
  start: string
  end: string
  days: PlanDay[] // ascending, one per calendar day of the horizon
  left: PlanLeftover[] // pieces that don't fit the constraints
}

interface Line {
  orderId: string
  name: string
  flavorId: string
  qty: number
  due: string
  kind: DeliveryKind
  latest: string // last useful baking day = due - lead
}

// ---- ISO date helpers (UTC-based: no DST/timezone drift) ----
const toUTC = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}
export const addDays = (iso: string, n: number) =>
  new Date(toUTC(iso) + n * 86_400_000).toISOString().slice(0, 10)
export const weekday = (iso: string) => new Date(toUTC(iso)).getUTCDay() // 0 = Sunday

/** Last day of the campaign horizon: 23 December of the season. */
export const seasonEnd = (season: number) => `${season}-12-23`

/**
 * Orders that still need baking: not delivered, not already in stock, with
 * the remaining (not yet produced) quantity per flavor. Flavors already handed
 * to the customer are skipped.
 */
export function plannableOrders(orders: PanettoneOrder[]): PanettoneOrder[] {
  return orders
    .filter((o) => o.status === 'todo')
    .map((o) => ({
      ...o,
      items: o.items
        .filter((i) => !i.delivered)
        .map((i) => ({ ...i, qty: i.qty - i.producedQty, producedQty: 0 }))
        .filter((i) => i.qty > 0),
    }))
    .filter((o) => o.items.length > 0)
}

export function buildPlan(
  orders: Pick<PanettoneOrder, 'id' | 'customerName' | 'deliveryDate' | 'deliveryKind' | 'items'>[],
  o: PlanParams,
  horizon: { start: string; end: string },
): PlanResult {
  const lines: Line[] = []
  for (const r of orders) {
    for (const it of r.items) {
      if (it.qty <= 0) continue
      lines.push({
        orderId: r.id,
        name: r.customerName,
        flavorId: it.flavorId,
        qty: it.qty,
        due: r.deliveryDate,
        kind: r.deliveryKind,
        latest: addDays(r.deliveryDate, -o.lead),
      })
    }
  }

  const days: PlanDay[] = []
  const flavorsOf = new Map<string, Set<string>>()
  for (let d = horizon.start; d <= horizon.end; d = addDays(d, 1)) {
    days.push({ date: d, closed: o.sunClosed && weekday(d) === 0, total: 0, items: {} })
    flavorsOf.set(d, new Set())
  }
  const asc = days
  const desc = days.slice().reverse()

  const maxG = o.group ? o.maxG : Infinity
  const prio = (l: Line) => (o.prio === 'nessuna' ? 0 : l.kind === o.prio ? 0 : 1)
  const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)
  const order =
    o.strategy === 'presto'
      ? (a: Line, b: Line) => cmp(a.latest, b.latest) || prio(a) - prio(b)
      : (a: Line, b: Line) => cmp(b.latest, a.latest) || prio(a) - prio(b)

  const fill = (day: PlanDay, limit: number) => {
    if (day.closed) return
    let cap = limit - day.total
    if (cap <= 0) return
    const flavors = flavorsOf.get(day.date)!
    const cand = lines.filter((l) => l.qty > 0 && l.latest >= day.date).sort(order)
    for (let pass = 0; pass < 2 && cap > 0; pass++) {
      for (const l of cand) {
        if (cap <= 0) break
        if (l.qty <= 0) continue
        const inDay = flavors.has(l.flavorId)
        // Pass 1 may open new flavors up to maxG; pass 2 only tops up open ones.
        if (pass === 0 && !inDay && flavors.size >= maxG) continue
        if (pass === 1 && !inDay) continue
        const take = Math.min(l.qty, cap)
        l.qty -= take
        cap -= take
        flavors.add(l.flavorId)
        const it = (day.items[l.flavorId] ??= { flavorId: l.flavorId, qty: 0, orders: [] })
        it.qty += take
        it.orders.push({
          orderId: l.orderId,
          name: l.name,
          qty: take,
          due: l.due,
          kind: l.kind,
          moved: o.strategy !== 'presto' && day.date < l.latest,
        })
        day.total += take
      }
    }
  }

  if (o.strategy === 'presto') {
    asc.forEach((d) => fill(d, o.cap))
  } else if (o.strategy === 'bilanciato') {
    const total = lines.reduce((a, l) => a + l.qty, 0)
    const lastNeeded = lines.reduce(
      (max, l) => {
        const capped = l.latest < horizon.end ? l.latest : horizon.end
        return capped > max ? capped : max
      },
      horizon.start,
    )
    const open = asc.filter((d) => !d.closed && d.date <= lastNeeded).length || 1
    const target = Math.min(o.cap, Math.ceil(total / open))
    desc.forEach((d) => fill(d, target))
    desc.forEach((d) => fill(d, o.cap))
  } else {
    desc.forEach((d) => fill(d, o.cap))
  }

  const left = lines
    .filter((l) => l.qty > 0)
    .map(({ orderId, name, flavorId, qty, due, kind }) => ({ orderId, name, flavorId, qty, due, kind }))
  return { start: horizon.start, end: horizon.end, days, left }
}
