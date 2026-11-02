// Panettoni (seasonal Christmas orders) — shared client/server types.
import type { PlanResult } from './plan'

export type PanettoneStatus = 'todo' | 'stock' | 'done'
// One flavor of an order (one cell of the orders table).
export type PanettoneItemState = 'todo' | 'stock' | 'delivered'
export type DeliveryKind = 'preciso' | 'entro'

export interface PanettoneFlavor {
  id: string
  key: string
  name: string
  color: string
  sortOrder: number
  active: boolean
}

export interface PanettoneOrderItem {
  flavorId: string
  qty: number
  producedQty: number
  state: PanettoneItemState // da fare / in magazzino / consegnato (tap on the cell)
}

export interface PanettoneOrder {
  id: string
  season: number
  customerId: string | null // linked customer of the gestionale (null = walk-in, name only)
  customerName: string
  phone: string | null
  deliveryKind: DeliveryKind
  deliveryDate: string // YYYY-MM-DD
  pickupTime: string | null
  deposit: number | null
  notes: string | null
  status: PanettoneStatus
  doneAt: string | null
  createdAt: string
  updatedAt: string
  items: PanettoneOrderItem[]
}

export interface NewPanettoneOrder {
  customerId?: string | null
  customerName: string
  phone?: string | null
  deliveryKind: DeliveryKind
  deliveryDate: string
  pickupTime?: string | null
  deposit?: number | null
  notes?: string | null
  items: { flavorId: string; qty: number }[]
}

export type PlanStrategy = 'tardi' | 'bilanciato' | 'presto'
export type PlanPriority = 'preciso' | 'entro' | 'nessuna'

export interface PlanParams {
  cap: number
  lead: number
  maxG: number
  sunClosed: boolean
  strategy: PlanStrategy
  prio: PlanPriority
  group: boolean
}

export const DEFAULT_PLAN_PARAMS: PlanParams = {
  cap: 20,
  lead: 1,
  maxG: 4,
  sunClosed: true,
  strategy: 'tardi',
  prio: 'preciso',
  group: true,
}

export interface PlanSettings extends PlanParams {
  season: number
  startDate: string | null // null = defaultPlanStart() (today, not before 14/12)
  confirmedAt: string | null
  // Snapshot written by "Conferma piano", read by the Produzione tab.
  confirmedPlan: PlanResult | null
}

// Campaign year shown by default. January still belongs to the previous
// Christmas (archive / end-of-season review).
export function currentSeason(now: Date = new Date()): number {
  return now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
}

/** Campaign of a delivery date (same rule: a 6 January delivery belongs to the previous Christmas). */
export function seasonForDate(iso: string): number {
  const year = Number(iso.slice(0, 4))
  return iso.slice(5, 7) === '01' ? year - 1 : year
}

/** A linked customer's panettoni for one day, shown inside Ordini (gestionale). */
export interface PanettoniForCustomer {
  orderId: string
  customerId: string
  customerName: string
  deliveryKind: DeliveryKind
  status: PanettoneStatus
  items: { flavorId: string; name: string; color: string; qty: number; state: PanettoneItemState }[]
}
