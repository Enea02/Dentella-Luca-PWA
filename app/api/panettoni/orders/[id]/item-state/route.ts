import { NextResponse, type NextRequest } from 'next/server'
import { and, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { panettoneOrderItems, panettoneOrders } from '@/lib/db/schema'
import { withAuth, parseJson } from '@/lib/api/handler'
import { notify } from '@/lib/realtime/notify'
import { syncStatusWithItems } from '@/lib/panettoni/server'

// Sets the state of ONE flavor of an order (a tap on a number in the orders
// table): da fare / in magazzino / consegnato. The order status follows (all
// delivered → archive). Sends the TARGET state → idempotent, safe to replay
// from background sync. Back to "da fare" from in magazzino / consegnato
// ("Togli dal magazzino") restarts the baked count from 0 so the planner
// schedules those pieces again (same rule as itemWithState on the client).
const Schema = z.object({
  flavorId: z.string().uuid(),
  state: z.enum(['todo', 'stock', 'delivered']),
})

export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, { params, auth }) => {
    const { id } = await params
    const { flavorId, state } = await parseJson(req, Schema)

    const status = await db.transaction(async (tx) => {
      const [order] = await tx
        .select({ id: panettoneOrders.id })
        .from(panettoneOrders)
        .where(and(eq(panettoneOrders.id, id), eq(panettoneOrders.bakeryId, auth.bakeryId)))
      if (!order) return null
      const cell = and(eq(panettoneOrderItems.orderId, id), eq(panettoneOrderItems.flavorId, flavorId))
      const [prev] = await tx.select({ state: panettoneOrderItems.state }).from(panettoneOrderItems).where(cell)
      if (!prev) return null
      const backToTodo = state === 'todo' && prev.state !== 'todo'
      await tx
        .update(panettoneOrderItems)
        .set(backToTodo ? { state, producedQty: 0 } : { state })
        .where(cell)
      // Pieces to bake again: the confirmed plan is out of date.
      if (backToTodo) await tx.update(panettoneOrders).set({ updatedAt: sql`now()` }).where(eq(panettoneOrders.id, id))
      return syncStatusWithItems(tx, id)
    })
    if (!status) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await notify(auth.bakeryId, { type: 'panettoni.updated' })
    return NextResponse.json({ status })
  },
  { require: 'orders:toggle' },
)
