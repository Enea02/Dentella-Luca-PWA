// Server-only data access for the Panettoni section (imports the DB client).
import { and, asc, eq, inArray, ne } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import {
  customers,
  panettoneFlavors,
  panettoneOrderItems,
  panettoneOrders,
  panettonePlanSettings,
} from '@/lib/db/schema'
import { DEFAULT_FLAVORS } from './flavors'
import { statusFromItems } from './helpers'
import type { PlanResult } from './plan'
import {
  DEFAULT_PLAN_PARAMS,
  seasonForDate,
  type DeliveryKind,
  type PanettoneFlavor,
  type PanettoneOrder,
  type PanettoneStatus,
  type PlanSettings,
} from './types'

export const flavorColumns = {
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
      state: panettoneOrderItems.state,
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
    customerId: r.customerId,
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
 * The order status follows its items (single rule, mirrored on the client by
 * statusFromItems): every flavor delivered → `done` (archive); every flavor at
 * least in stock → `stock`; otherwise `todo`. Call inside the transaction that
 * changed the items; returns the resulting status.
 */
export async function syncStatusWithItems(tx: Tx, orderId: string): Promise<PanettoneStatus> {
  const [order] = await tx
    .select({ status: panettoneOrders.status })
    .from(panettoneOrders)
    .where(eq(panettoneOrders.id, orderId))
  const items = await tx
    .select({ state: panettoneOrderItems.state })
    .from(panettoneOrderItems)
    .where(eq(panettoneOrderItems.orderId, orderId))
  const status = statusFromItems(items, order.status)
  if (status !== order.status) {
    await tx
      .update(panettoneOrders)
      .set({ status, doneAt: status === 'done' ? new Date() : null })
      .where(eq(panettoneOrders.id, orderId))
  }
  return status
}

/**
 * The open (not archived) panettoni order of a LINKED customer for a delivery
 * day, created if missing. Used by "+ Aggiungi panettone" and "Posticipa" in
 * Ordini. A new order copies `template` (kind, phone, notes) when given.
 * Bumps updatedAt (plan-relevant change). Returns its id.
 */
export async function findOrCreateOpenOrder(
  tx: Tx,
  bakeryId: string,
  customerId: string,
  date: string,
  template?: { deliveryKind: DeliveryKind; phone: string | null; notes: string | null },
): Promise<string> {
  const [open] = await tx
    .select({ id: panettoneOrders.id })
    .from(panettoneOrders)
    .where(
      and(
        eq(panettoneOrders.bakeryId, bakeryId),
        eq(panettoneOrders.customerId, customerId),
        eq(panettoneOrders.deliveryDate, date),
        ne(panettoneOrders.status, 'done'),
      ),
    )
    .orderBy(asc(panettoneOrders.createdAt))
    .limit(1)
  if (open) {
    await tx.update(panettoneOrders).set({ updatedAt: new Date() }).where(eq(panettoneOrders.id, open.id))
    return open.id
  }
  const [customer] = await tx.select({ name: customers.name }).from(customers).where(eq(customers.id, customerId))
  const [created] = await tx
    .insert(panettoneOrders)
    .values({
      bakeryId,
      season: seasonForDate(date),
      customerId,
      customerName: customer.name,
      deliveryKind: template?.deliveryKind ?? 'preciso',
      deliveryDate: date,
      phone: template?.phone ?? null,
      notes: template?.notes ?? null,
    })
    .returning({ id: panettoneOrders.id })
  return created.id
}
