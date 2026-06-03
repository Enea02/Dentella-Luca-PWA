import { NextResponse, type NextRequest } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { dailyItemStatus, dailyOrderItems, dailyOrders } from '@/lib/db/schema'
import { withAuth, parseJson } from '@/lib/api/handler'
import { notify } from '@/lib/realtime/notify'

const Schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  customerId: z.string().uuid(),
  productId: z.string().uuid(),
  done: z.boolean(),
})

export const POST = withAuth(
  async (req: NextRequest, { auth }) => {
    const { date, customerId, productId, done } = await parseJson(req, Schema)

    // Try daily order first
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
        .set({ done })
        .where(and(eq(dailyOrderItems.dailyOrderId, daily[0].id), eq(dailyOrderItems.productId, productId)))
        .returning({ id: dailyOrderItems.id })
      if (updated.length > 0) {
        await notify(auth.bakeryId, { type: 'orders.updated', date })
        return new NextResponse(null, { status: 204 })
      }
    }

    // Otherwise upsert into daily_item_status (recurring item override)
    await db
      .insert(dailyItemStatus)
      .values({ bakeryId: auth.bakeryId, date, customerId, productId, done })
      .onConflictDoUpdate({
        target: [
          dailyItemStatus.bakeryId,
          dailyItemStatus.date,
          dailyItemStatus.customerId,
          dailyItemStatus.productId,
        ],
        set: { done },
      })

    await notify(auth.bakeryId, { type: 'orders.updated', date })
    return new NextResponse(null, { status: 204 })
  },
  { require: 'orders:toggle' },
)
