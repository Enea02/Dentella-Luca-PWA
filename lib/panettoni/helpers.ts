// Small shared helpers for the Panettoni section (client + server safe).
import { seasonEnd, weekday } from './plan'
import type {
  PanettoneFlavor,
  PanettoneItemState,
  PanettoneOrder,
  PanettoneOrderItem,
  PanettoneStatus,
  PlanSettings,
} from './types'

/** Today in the bakery's timezone (the server runs in UTC). */
export function todayRome(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(now)
}

/** Default first planning day when none is configured: today, but not before 14/12. */
export function defaultPlanStart(season: number, today: string = todayRome()): string {
  const campaign = `${season}-12-14`
  return today > campaign ? today : campaign
}

export function planHorizon(settings: Pick<PlanSettings, 'season' | 'startDate'>) {
  return { start: settings.startDate ?? defaultPlanStart(settings.season), end: seasonEnd(settings.season) }
}

/** "24/12" */
export const shortDate = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`

const DOW = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab']
const DOW_LONG = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato']
const MONTHS = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre']
export const dowShort = (iso: string) => DOW[weekday(iso)]
/** "Mercoledì 23 dicembre" */
export const longDate = (iso: string) =>
  `${DOW_LONG[weekday(iso)]} ${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]}`

export const orderTotal = (o: Pick<PanettoneOrder, 'items'>) => o.items.reduce((a, i) => a + i.qty, 0)

/**
 * The confirmed plan no longer reflects the orders: an order was created or
 * its items/delivery changed after the confirmation (see updatedAt in schema).
 */
export function isPlanStale(orders: PanettoneOrder[], settings: PlanSettings | undefined): boolean {
  if (!settings?.confirmedAt) return false
  return orders.some((o) => o.status !== 'done' && o.updatedAt > settings.confirmedAt!)
}

// ---- Per-flavor state (one cell of the orders table) ----

/** Item state that a whole-row status implies (tap on the customer, "Ripristina"). */
export const ITEM_STATE_FOR_STATUS: Record<PanettoneStatus, PanettoneItemState> = {
  todo: 'todo',
  stock: 'stock',
  done: 'delivered',
}

/**
 * The order status follows its items — the ONE rule, used by the server
 * (syncStatusWithItems) and by the optimistic UI: all delivered → done;
 * all at least in stock → stock; otherwise todo. An order without items
 * keeps its current status.
 */
export function statusFromItems(
  items: Pick<PanettoneOrderItem, 'state'>[],
  current: PanettoneStatus,
): PanettoneStatus {
  if (items.length === 0) return current
  if (items.every((i) => i.state === 'delivered')) return 'done'
  if (items.every((i) => i.state !== 'todo')) return 'stock'
  return 'todo'
}

/** Re-derives the order status after its items changed (optimistic UI). */
export function withStatusFromItems(o: PanettoneOrder): PanettoneOrder {
  const status = statusFromItems(o.items, o.status)
  if (status === o.status) return o
  return { ...o, status, doneAt: status === 'done' ? new Date().toISOString() : null }
}

/** Applies one cell's new state locally, including the resulting order status. */
export function withItemState(o: PanettoneOrder, flavorId: string, state: PanettoneItemState): PanettoneOrder {
  return withStatusFromItems({ ...o, items: o.items.map((i) => (i.flavorId === flavorId ? { ...i, state } : i)) })
}

/** Applies a whole-row status locally: every cell takes the matching state. */
export function withRowStatus(o: PanettoneOrder, status: PanettoneStatus): PanettoneOrder {
  const state = ITEM_STATE_FOR_STATUS[status]
  return {
    ...o,
    status,
    items: o.items.map((i) => ({ ...i, state })),
    doneAt: status === 'done' ? new Date().toISOString() : null,
  }
}

/** Pieces still to hand over (flavors not yet delivered). */
export const pendingQty = (o: Pick<PanettoneOrder, 'items'>) =>
  o.items.reduce((a, i) => a + (i.state === 'delivered' ? 0 : i.qty), 0)

/**
 * Flavor columns to show: active flavors plus hidden ones still present in an
 * open order (hiding a flavor must never make ordered pieces disappear).
 */
export function shownFlavors(flavors: PanettoneFlavor[], orders: PanettoneOrder[]): PanettoneFlavor[] {
  const used = new Set(orders.filter((o) => o.status !== 'done').flatMap((o) => o.items.map((i) => i.flavorId)))
  return flavors.filter((f) => f.active || used.has(f.id))
}

/**
 * Normalizes a typed pickup time: "10.45" / "1045" / "10 45" / "9:5" / "9"
 * → "10:45" / "10:45" / "10:45" / "09:05" / "09:00". Text that isn't a valid
 * time (e.g. "in mattinata") is kept as typed, trimmed to 40 chars.
 */
export function normalizeTime(raw: string): string {
  const text = raw.trim()
  const parts =
    /^(\d{1,2})(?:\s*[:.,h ]\s*(\d{1,2}))?$/i.exec(text) ?? // 9 · 9:5 · 10.45 · 10h45
    /^(\d{1,2})(\d{2})$/.exec(text) // 945 · 1045
  if (parts) {
    const hh = Number(parts[1])
    const mm = parts[2] === undefined ? 0 : Number(parts[2])
    if (hh <= 23 && mm <= 59) return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
  }
  return text.slice(0, 40)
}
