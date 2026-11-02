import { NextResponse, type NextRequest } from 'next/server'
import { and, desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { dailyItemStatus, dailyOrderItems, dailyOrders } from '@/lib/db/schema'
import { withAuth, parseJson } from '@/lib/api/handler'
import { notify } from '@/lib/realtime/notify'
import { getOrCreateDailyOrder } from '@/lib/orders/daily'

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
      // New items go to the bottom of the order.
      const [last] = await tx
        .select({ position: dailyOrderItems.position })
        .from(dailyOrderItems)
        .where(eq(dailyOrderItems.dailyOrderId, dailyId))
        .orderBy(desc(dailyOrderItems.position))
        .limit(1)
      const nextPosition = last ? last.position + 1 : 0
      // Upsert: if the product is already on this daily order (e.g. seeded from the
      // recurring template by getOrCreateDailyOrder), update it instead of appending a
      // second row. The unique (dailyOrderId, productId) constraint guarantees no dupes.
      await tx
        .insert(dailyOrderItems)
        .values({
          dailyOrderId: dailyId,
          productId: item.productId,
          quantity: String(item.quantity),
          unit: item.unit,
          done: item.done ?? false,
          variant: item.variant ?? null,
          position: nextPosition,
        })
        .onConflictDoUpdate({
          target: [dailyOrderItems.dailyOrderId, dailyOrderItems.productId],
          set: {
            quantity: String(item.quantity),
            unit: item.unit,
            done: item.done ?? false,
            variant: item.variant ?? null,
          },
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
          // Upsert-guard against the unique (dailyOrderId, productId) constraint.
          await tx
            .insert(dailyOrderItems)
            .values({
              dailyOrderId: dailyId,
              productId,
              quantity: updates.quantity !== undefined ? String(updates.quantity) : '1',
              unit: updates.unit ?? 'pieces',
              done: updates.done ?? false,
              variant: updates.variant ?? null,
            })
            .onConflictDoUpdate({
              target: [dailyOrderItems.dailyOrderId, dailyOrderItems.productId],
              set: buildPatch(),
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

const DeleteSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  customerId: z.string().uuid(),
  productId: z.string().uuid(),
})

export const DELETE = withAuth(
  async (req: NextRequest, { auth }) => {
    const { date, customerId, productId } = await parseJson(req, DeleteSchema)

    // Removing an item is a structural edit: it must land on a real daily_order
    // item. For a recurring customer with no daily order yet, materialize the
    // template first so the deletion applies only to this date.
    await db.transaction(async (tx) => {
      const dailyId = await getOrCreateDailyOrder(tx, auth.bakeryId, date, customerId)
      await tx
        .delete(dailyOrderItems)
        .where(
          and(eq(dailyOrderItems.dailyOrderId, dailyId), eq(dailyOrderItems.productId, productId)),
        )
    })

    await notify(auth.bakeryId, { type: 'orders.updated', date })
    return new NextResponse(null, { status: 204 })
  },
  { require: 'orders:edit' },
)
