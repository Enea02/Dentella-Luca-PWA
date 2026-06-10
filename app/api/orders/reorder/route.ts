import { NextResponse, type NextRequest } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import {
  dailyOrderItems,
  dailyOrders,
  recurringOrderItems,
  recurringOrders,
} from '@/lib/db/schema'
import { withAuth, parseJson } from '@/lib/api/handler'
import { notify } from '@/lib/realtime/notify'

const Schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  customerId: z.string().uuid(),
  orderedProductIds: z.array(z.string()).min(1),
})

export const POST = withAuth(
  async (req: NextRequest, { auth }) => {
    const { date, customerId, orderedProductIds } = await parseJson(req, Schema)

    await db.transaction(async (tx) => {
      // A daily order for this date overrides the recurring template entirely,
      // so when one exists we reorder its items (this day only). Otherwise the
      // customer is served from their recurring template, so we reorder that
      // (the new arrangement then applies to every day it's served).
      const daily = await tx
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
        const dailyId = daily[0].id
        for (let i = 0; i < orderedProductIds.length; i++) {
          await tx
            .update(dailyOrderItems)
            .set({ position: i })
            .where(
              and(
                eq(dailyOrderItems.dailyOrderId, dailyId),
                eq(dailyOrderItems.productId, orderedProductIds[i]),
              ),
            )
        }
        return
      }

      // Recurring customer with no daily order — reorder the recurring template.
      const recurring = await tx
        .select({ id: recurringOrders.id })
        .from(recurringOrders)
        .where(
          and(
            eq(recurringOrders.bakeryId, auth.bakeryId),
            eq(recurringOrders.customerId, customerId),
          ),
        )
        .limit(1)

      if (recurring.length > 0) {
        const recurringId = recurring[0].id
        for (let i = 0; i < orderedProductIds.length; i++) {
          await tx
            .update(recurringOrderItems)
            .set({ position: i })
            .where(
              and(
                eq(recurringOrderItems.recurringOrderId, recurringId),
                eq(recurringOrderItems.productId, orderedProductIds[i]),
              ),
            )
        }
      }
    })

    await notify(auth.bakeryId, { type: 'orders.updated', date })
    return new NextResponse(null, { status: 204 })
  },
  { require: 'orders:edit' },
)
