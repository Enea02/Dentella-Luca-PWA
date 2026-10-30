import { NextResponse, type NextRequest } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { panettoneOrderItems, panettoneOrders } from '@/lib/db/schema'
import { withAuth, parseJson } from '@/lib/api/handler'
import { notify } from '@/lib/realtime/notify'
import { syncStatusWithDeliveries } from '@/lib/panettoni/server'

// Marks ONE flavor of an order as delivered (or not): a tap on a number in the
// orders table. When every flavor is delivered the order moves to the archive.
// Sends the TARGET state → idempotent, safe to replay from background sync.
const Schema = z.object({
  flavorId: z.string().uuid(),
  delivered: z.boolean(),
})

export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, { params, auth }) => {
    const { id } = await params
    const { flavorId, delivered } = await parseJson(req, Schema)

    const status = await db.transaction(async (tx) => {
      const [order] = await tx
        .select({ id: panettoneOrders.id })
        .from(panettoneOrders)
        .where(and(eq(panettoneOrders.id, id), eq(panettoneOrders.bakeryId, auth.bakeryId)))
      if (!order) return null
      const updated = await tx
        .update(panettoneOrderItems)
        .set({ delivered })
        .where(and(eq(panettoneOrderItems.orderId, id), eq(panettoneOrderItems.flavorId, flavorId)))
        .returning({ id: panettoneOrderItems.id })
      if (updated.length === 0) return null
      return syncStatusWithDeliveries(tx, id)
    })
    if (!status) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await notify(auth.bakeryId, { type: 'panettoni.updated' })
    return NextResponse.json({ status })
  },
  { require: 'orders:toggle' },
)
