// Server-only data access for the Panettoni section (imports the DB client).
import { and, asc, eq, inArray } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import {
  panettoneFlavors,
  panettoneOrderItems,
  panettoneOrders,
  panettonePlanSettings,
} from '@/lib/db/schema'
import { DEFAULT_FLAVORS } from './flavors'
import type { PlanResult } from './plan'
import {
  DEFAULT_PLAN_PARAMS,
  type PanettoneFlavor,
  type PanettoneOrder,
  type PanettoneStatus,
  type PlanSettings,
} from './types'

const flavorColumns = {
  id: panettoneFlavors.id,
  key: panettoneFlavors.key,
  name: panettoneFlavors.name,
  color: panettoneFlavors.color,
  sortOrder: panettoneFlavors.sortOrder,
  active: panettoneFlavors.active,
}

/** Returns the bakery's flavors, seeding the defaults the first time. */
export async function ensureFlavors(bakeryId: string): Promise<PanettoneFlavor[]> {
  const existing = await db
    .select(flavorColumns)
    .from(panettoneFlavors)
    .where(eq(panettoneFlavors.bakeryId, bakeryId))
    .orderBy(asc(panettoneFlavors.sortOrder))
  if (existing.length > 0) return existing

  // ON CONFLICT DO NOTHING: two concurrent first loads must not fail.
  await db
    .insert(panettoneFlavors)
    .values(DEFAULT_FLAVORS.map((f, i) => ({ bakeryId, ...f, sortOrder: i })))
    .onConflictDoNothing()
  return db
    .select(flavorColumns)
    .from(panettoneFlavors)
    .where(eq(panettoneFlavors.bakeryId, bakeryId))
    .orderBy(asc(panettoneFlavors.sortOrder))
}

/** Loads orders (with items) for a season, or a single order when `orderId` is given. */
export async function loadOrders(
  bakeryId: string,
  { season, orderId }: { season?: number; orderId?: string },
): Promise<PanettoneOrder[]> {
  const conds = [eq(panettoneOrders.bakeryId, bakeryId)]
  if (season !== undefined) conds.push(eq(panettoneOrders.season, season))
  if (orderId) conds.push(eq(panettoneOrders.id, orderId))

  const rows = await db
    .select()
    .from(panettoneOrders)
    .where(and(...conds))
    .orderBy(asc(panettoneOrders.deliveryDate), asc(panettoneOrders.createdAt))
  if (rows.length === 0) return []

  const items = await db
    .select({
      orderId: panettoneOrderItems.orderId,
      flavorId: panettoneOrderItems.flavorId,
      qty: panettoneOrderItems.qty,
      producedQty: panettoneOrderItems.producedQty,
      delivered: panettoneOrderItems.delivered,
    })
    .from(panettoneOrderItems)
    .innerJoin(panettoneFlavors, eq(panettoneFlavors.id, panettoneOrderItems.flavorId))
    .where(inArray(panettoneOrderItems.orderId, rows.map((r) => r.id)))
    .orderBy(asc(panettoneFlavors.sortOrder)) // same order as the table columns

  const byOrder = new Map<string, PanettoneOrder['items']>()
  for (const { orderId: id, ...item } of items) {
    const list = byOrder.get(id) ?? []
    list.push(item)
    byOrder.set(id, list)
  }

  return rows.map((r) => ({
    id: r.id,
    season: r.season,
    customerName: r.customerName,
    phone: r.phone,
    deliveryKind: r.deliveryKind,
    deliveryDate: r.deliveryDate,
    pickupTime: r.pickupTime,
    deposit: r.deposit === null ? null : Number(r.deposit),
    notes: r.notes,
    status: r.status,
    doneAt: r.doneAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    items: byOrder.get(r.id) ?? [],
  }))
}

/** Plan settings for a season; defaults when never saved. */
export async function loadPlanSettings(bakeryId: string, season: number): Promise<PlanSettings> {
  const [row] = await db
    .select()
    .from(panettonePlanSettings)
    .where(and(eq(panettonePlanSettings.bakeryId, bakeryId), eq(panettonePlanSettings.season, season)))
    .limit(1)
  if (!row) {
    return { ...DEFAULT_PLAN_PARAMS, season, startDate: null, confirmedAt: null, confirmedPlan: null }
  }
  return {
    season,
    startDate: row.startDate,
    cap: row.cap,
    lead: row.lead,
    maxG: row.maxG,
    sunClosed: row.sunClosed,
    strategy: row.strategy,
    prio: row.prio,
    group: row.groupFlavors,
    confirmedAt: row.confirmedAt?.toISOString() ?? null,
    confirmedPlan: (row.confirmedPlan as PlanResult | null) ?? null,
  }
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

/**
 * Keeps the order status in step with its per-flavor deliveries:
 * every flavor delivered → `done` (archive); a flavor taken back on a `done`
 * order → `stock`. Returns the resulting status. Call inside the transaction
 * that changed the items.
 */
export async function syncStatusWithDeliveries(tx: Tx, orderId: string): Promise<PanettoneStatus> {
  const [order] = await tx
    .select({ status: panettoneOrders.status })
    .from(panettoneOrders)
    .where(eq(panettoneOrders.id, orderId))
  const items = await tx
    .select({ delivered: panettoneOrderItems.delivered })
    .from(panettoneOrderItems)
    .where(eq(panettoneOrderItems.orderId, orderId))
  const allDelivered = items.length > 0 && items.every((i) => i.delivered)

  if (allDelivered && order.status !== 'done') {
    await tx.update(panettoneOrders).set({ status: 'done', doneAt: new Date() }).where(eq(panettoneOrders.id, orderId))
    return 'done'
  }
  if (!allDelivered && order.status === 'done') {
    await tx.update(panettoneOrders).set({ status: 'stock', doneAt: null }).where(eq(panettoneOrders.id, orderId))
    return 'stock'
  }
  return order.status
}
