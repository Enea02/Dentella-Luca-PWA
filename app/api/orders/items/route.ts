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
import { dayOfWeek } from '@/lib/utils'

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
    const body = await parseJson(req, AddSchema)
    const { date, customerId, item } = body

    await db.transaction(async (tx) => {
      // Look for an existing daily order for (bakery, date, customer)
      const existingDaily = await tx
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

      let dailyId: string
      if (existingDaily.length > 0) {
        dailyId = existingDaily[0].id
      } else {
        // No daily order yet — check if a recurring covers this weekday; if yes, seed daily with its items
        const weekday = dayOfWeek(date)
        const [recurring] = await tx
          .select({ id: recurringOrders.id, weekdays: recurringOrders.weekdays })
          .from(recurringOrders)
          .where(
            and(
              eq(recurringOrders.bakeryId, auth.bakeryId),
              eq(recurringOrders.customerId, customerId),
            ),
          )
          .limit(1)

        const [created] = await tx
          .insert(dailyOrders)
          .values({ bakeryId: auth.bakeryId, date, customerId })
          .returning({ id: dailyOrders.id })
        dailyId = created.id

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
            await tx.insert(dailyOrderItems).values(
              recItems.map((it) => ({
                dailyOrderId: dailyId,
                productId: it.productId,
                quantity: it.quantity,
                unit: it.unit,
                done: false,
              })),
            )
          }
        }
      }

      await tx.insert(dailyOrderItems).values({
        dailyOrderId: dailyId,
        productId: item.productId,
        quantity: String(item.quantity),
        unit: item.unit,
        done: item.done ?? false,
        variant: item.variant ?? null,
      })
    })

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

    // Try update on the daily order first
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
      const patch: Record<string, unknown> = {}
      if (updates.quantity !== undefined) patch.quantity = String(updates.quantity)
      if (updates.unit !== undefined) patch.unit = updates.unit
      if (updates.done !== undefined) patch.done = updates.done
      if (updates.variant !== undefined) patch.variant = updates.variant

      const updated = await db
        .update(dailyOrderItems)
        .set(patch)
        .where(and(eq(dailyOrderItems.dailyOrderId, daily[0].id), eq(dailyOrderItems.productId, productId)))
        .returning({ id: dailyOrderItems.id })

      if (updated.length > 0) return new NextResponse(null, { status: 204 })
    }

    // Otherwise — this is a recurring-order item: persist override into daily_item_status
    // (only fields that make sense for an override are done + variant)
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

    return new NextResponse(null, { status: 204 })
  },
  { require: 'orders:edit' },
)
