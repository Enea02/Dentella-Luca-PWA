import { NextResponse, type NextRequest } from 'next/server'
import { and, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { panettoneOrderItems, panettoneOrders } from '@/lib/db/schema'
import { withAuth, parseJson } from '@/lib/api/handler'
import { notify } from '@/lib/realtime/notify'
import { syncStatusWithDeliveries } from '@/lib/panettoni/server'
import { flavorsBelongTo } from '@/lib/panettoni/validation'

// Sets one cell of the orders table. qty 0 removes the flavor from the order.
const Schema = z.object({
  flavorId: z.string().uuid(),
  qty: z.number().int().min(0).max(10_000),
})

export const PUT = withAuth<{ id: string }>(
  async (req: NextRequest, { params, auth }) => {
    const { id } = await params
    const { flavorId, qty } = await parseJson(req, Schema)
    if (!(await flavorsBelongTo(auth.bakeryId, [flavorId]))) {
      return NextResponse.json({ error: 'Gusto non valido' }, { status: 400 })
    }

    const status = await db.transaction(async (tx) => {
      const touched = await tx
        .update(panettoneOrders)
        .set({ updatedAt: new Date() })
        .where(and(eq(panettoneOrders.id, id), eq(panettoneOrders.bakeryId, auth.bakeryId)))
        .returning({ id: panettoneOrders.id })
      if (touched.length === 0) return null

      if (qty === 0) {
        await tx
          .delete(panettoneOrderItems)
          .where(and(eq(panettoneOrderItems.orderId, id), eq(panettoneOrderItems.flavorId, flavorId)))
      } else {
        await tx
          .insert(panettoneOrderItems)
          .values({ orderId: id, flavorId, qty })
          .onConflictDoUpdate({
            target: [panettoneOrderItems.orderId, panettoneOrderItems.flavorId],
            // Keep producedQty <= qty when the quantity is lowered.
            set: { qty, producedQty: sql`least(${panettoneOrderItems.producedQty}, ${qty})` },
          })
      }
      // Removing the last undelivered flavor completes the order.
      return syncStatusWithDeliveries(tx, id)
    })
    if (!status) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await notify(auth.bakeryId, { type: 'panettoni.updated' })
    return NextResponse.json({ status })
  },
  { require: 'orders:edit' },
)
