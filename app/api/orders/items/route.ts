import { NextResponse, type NextRequest } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import {
  dailyItemStatus,
  dailyOrderItems,
  dailyOrders,
  recurringOrderItems,
  recurringOrders,
} from '@/lib/db/schema'
import { withAuth, parseJson } from '@/lib/api/handler'
import { notify } from '@/lib/realtime/notify'
import { dayOfWeek } from '@/lib/utils'

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
async function getOrCreateDailyOrder(
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
    .select({ id: recurringOrders.id, weekdays: recurringOrders.weekdays })
    .from(recurringOrders)
    .where(and(eq(recurringOrders.bakeryId, bakeryId), eq(recurringOrders.customerId, customerId)))
    .limit(1)

  if (recurring && (recurring.weekdays ?? []).includes(weekday)) {
    const recItems = await tx
      .select({
        productId: recurringOrderItems.productId,
        quantity: recurringOrderItems.quantity,
        unit: recurringOrderItems.unit,
      })
      .from(recurringOrderItems)
      .where(eq(recurringOrderItems.recurringOrderId, recurring.id))

    if (recItems.length > 0) {
      // Carry over per-day done/variant overrides so they survive materialization.
      const statusRows = await tx
        .select({
          productId: dailyItemStatus.productId,
          done: dailyItemStatus.done,
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

      await tx.insert(dailyOrderItems).values(
        recItems.map((it) => {
          const s = statusByProduct.get(it.productId)
          return {
            dailyOrderId: dailyId,
            productId: it.productId,
            quantity: it.quantity,
            unit: it.unit,
            done: s?.done ?? false,
            variant: s?.variant ?? null,
          }
        }),
      )

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

const AddSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  customerId: z.string().uuid(),
  item: z.object({
    productId: z.string().uuid(),
    quantity: z.number().positive(),
    unit: z.enum(['pieces', 'kg']),
    done: z.boolean().optional().default(false),
    variant: z.string().nullable().optional(),
  }),
})

export const POST = withAuth(
  async (req: NextRequest, { auth }) => {
    const { date, customerId, item } = await parseJson(req, AddSchema)

    await db.transaction(async (tx) => {
      const dailyId = await getOrCreateDailyOrder(tx, auth.bakeryId, date, customerId)
      await tx.insert(dailyOrderItems).values({
        dailyOrderId: dailyId,
        productId: item.productId,
        quantity: String(item.quantity),
        unit: item.unit,
        done: item.done ?? false,
        variant: item.variant ?? null,
      })
    })

    await notify(auth.bakeryId, { type: 'orders.updated', date })
    return new NextResponse(null, { status: 204 })
  },
  { require: 'orders:edit' },
)

const PatchSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  customerId: z.string().uuid(),
  productId: z.string().uuid(),
  updates: z
    .object({
      quantity: z.number().positive().optional(),
      unit: z.enum(['pieces', 'kg']).optional(),
      done: z.boolean().optional(),
      variant: z.string().nullable().optional(),
    })
    .refine((u) => Object.keys(u).length > 0, { message: 'No updates provided' }),
})

export const PATCH = withAuth(
  async (req: NextRequest, { auth }) => {
    const { date, customerId, productId, updates } = await parseJson(req, PatchSchema)
    const isStructural = updates.quantity !== undefined || updates.unit !== undefined

    const buildPatch = () => {
      const patch: Record<string, unknown> = {}
      if (updates.quantity !== undefined) patch.quantity = String(updates.quantity)
      if (updates.unit !== undefined) patch.unit = updates.unit
      if (updates.done !== undefined) patch.done = updates.done
      if (updates.variant !== undefined) patch.variant = updates.variant
      return patch
    }

    // Structural edits (quantity/unit) must live on a real daily_order item.
    // For a recurring customer with no daily order yet, materialize it first.
    if (isStructural) {
      await db.transaction(async (tx) => {
        const dailyId = await getOrCreateDailyOrder(tx, auth.bakeryId, date, customerId)
        const updated = await tx
          .update(dailyOrderItems)
          .set(buildPatch())
          .where(
            and(eq(dailyOrderItems.dailyOrderId, dailyId), eq(dailyOrderItems.productId, productId)),
          )
          .returning({ id: dailyOrderItems.id })

        if (updated.length === 0) {
          // Product wasn't part of the (materialized) daily order — add it.
          await tx.insert(dailyOrderItems).values({
            dailyOrderId: dailyId,
            productId,
            quantity: updates.quantity !== undefined ? String(updates.quantity) : '1',
            unit: updates.unit ?? 'pieces',
            done: updates.done ?? false,
            variant: updates.variant ?? null,
          })
        }
      })
      await notify(auth.bakeryId, { type: 'orders.updated', date })
      return new NextResponse(null, { status: 204 })
    }

    // Non-structural (done/variant only): update the daily item if present,
    // otherwise persist a lightweight override into daily_item_status.
    const daily = await db
      .select({ id: dailyOrders.id })
      .from(dailyOrders)
      .where(
        and(
          eq(dailyOrders.bakeryId, auth.bakeryId),
          eq(dailyOrders.date, date),
          eq(dailyOrders.customerId, customerId),
        ),
      )
      .limit(1)

    if (daily.length > 0) {
      const updated = await db
        .update(dailyOrderItems)
        .set(buildPatch())
        .where(
          and(eq(dailyOrderItems.dailyOrderId, daily[0].id), eq(dailyOrderItems.productId, productId)),
        )
        .returning({ id: dailyOrderItems.id })
      if (updated.length > 0) {
        await notify(auth.bakeryId, { type: 'orders.updated', date })
        return new NextResponse(null, { status: 204 })
      }
    }

    await db
      .insert(dailyItemStatus)
      .values({
        bakeryId: auth.bakeryId,
        date,
        customerId,
        productId,
        done: updates.done ?? false,
        variant: updates.variant ?? null,
      })
      .onConflictDoUpdate({
        target: [
          dailyItemStatus.bakeryId,
          dailyItemStatus.date,
          dailyItemStatus.customerId,
          dailyItemStatus.productId,
        ],
        set: {
          ...(updates.done !== undefined ? { done: updates.done } : {}),
          ...(updates.variant !== undefined ? { variant: updates.variant } : {}),
        },
      })

    await notify(auth.bakeryId, { type: 'orders.updated', date })
    return new NextResponse(null, { status: 204 })
  },
  { require: 'orders:edit' },
)
