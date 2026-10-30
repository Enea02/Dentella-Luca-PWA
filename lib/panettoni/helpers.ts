// Small shared helpers for the Panettoni section (client + server safe).
import { seasonEnd, weekday } from './plan'
import type { PanettoneFlavor, PanettoneOrder, PanettoneStatus, PlanSettings } from './types'

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

/** Tap cycle on a table row. */
export const NEXT_STATUS: Record<PanettoneStatus, PanettoneStatus> = { todo: 'stock', stock: 'done', done: 'todo' }

/**
 * The confirmed plan no longer reflects the orders: an order was created or
 * its items/delivery changed after the confirmation (see updatedAt in schema).
 */
export function isPlanStale(orders: PanettoneOrder[], settings: PlanSettings | undefined): boolean {
  if (!settings?.confirmedAt) return false
  return orders.some((o) => o.status !== 'done' && o.updatedAt > settings.confirmedAt!)
}

// ---- Per-flavor delivery (mirrors syncStatusWithDeliveries on the server) ----

/** Order status implied by its deliveries: all flavors delivered → done; a flavor taken back → stock. */
export function statusAfterDeliveries(o: Pick<PanettoneOrder, 'status' | 'items'>): PanettoneStatus {
  const allDelivered = o.items.length > 0 && o.items.every((i) => i.delivered)
  if (allDelivered) return 'done'
  return o.status === 'done' ? 'stock' : o.status
}

/** Applies a cell delivery locally (optimistic UI), including the resulting status. */
export function withDelivery(o: PanettoneOrder, flavorId: string, delivered: boolean): PanettoneOrder {
  const next = { ...o, items: o.items.map((i) => (i.flavorId === flavorId ? { ...i, delivered } : i)) }
  return withStatusFromDeliveries(next)
}

export function withStatusFromDeliveries(o: PanettoneOrder): PanettoneOrder {
  const status = statusAfterDeliveries(o)
  if (status === o.status) return o
  return { ...o, status, doneAt: status === 'done' ? new Date().toISOString() : null }
}

/** Applies a row status change locally: `done` delivers everything, leaving `done` resets deliveries. */
export function withRowStatus(o: PanettoneOrder, status: PanettoneStatus): PanettoneOrder {
  const items =
    status === 'done'
      ? o.items.map((i) => ({ ...i, delivered: true }))
      : o.status === 'done'
        ? o.items.map((i) => ({ ...i, delivered: false }))
        : o.items
  return { ...o, status, items, doneAt: status === 'done' ? new Date().toISOString() : null }
}

/** Pieces still to hand over (flavors not yet delivered). */
export const pendingQty = (o: Pick<PanettoneOrder, 'items'>) =>
  o.items.reduce((a, i) => a + (i.delivered ? 0 : i.qty), 0)

/**
 * Flavor columns to show: active flavors plus hidden ones still present in an
 * open order (hiding a flavor must never make ordered pieces disappear).
 */
export function shownFlavors(flavors: PanettoneFlavor[], orders: PanettoneOrder[]): PanettoneFlavor[] {
  const used = new Set(orders.filter((o) => o.status !== 'done').flatMap((o) => o.items.map((i) => i.flavorId)))
  return flavors.filter((f) => f.active || used.has(f.id))
}
