import { NextResponse, type NextRequest } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { panettoneOrderItems, panettoneOrders } from '@/lib/db/schema'
import { withAuth, parseJson } from '@/lib/api/handler'
import { notify } from '@/lib/realtime/notify'

// The client sends the TARGET status (not "advance"), so the request is
// idempotent and safe to replay from the service worker's background-sync queue.
// Per-flavor deliveries follow the row: `done` delivers every flavor, and an
// order taken out of the archive ("Ripristina") starts undelivered again.
const Schema = z.object({ status: z.enum(['todo', 'stock', 'done']) })

export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, { params, auth }) => {
    const { id } = await params
    const { status } = await parseJson(req, Schema)

    const found = await db.transaction(async (tx) => {
      const [prev] = await tx
        .select({ status: panettoneOrders.status })
        .from(panettoneOrders)
        .where(and(eq(panettoneOrders.id, id), eq(panettoneOrders.bakeryId, auth.bakeryId)))
      if (!prev) return false
      await tx
        .update(panettoneOrders)
        .set({ status, doneAt: status === 'done' ? new Date() : null })
        .where(eq(panettoneOrders.id, id))
      if (status === 'done') {
        await tx.update(panettoneOrderItems).set({ delivered: true }).where(eq(panettoneOrderItems.orderId, id))
      } else if (prev.status === 'done') {
        await tx.update(panettoneOrderItems).set({ delivered: false }).where(eq(panettoneOrderItems.orderId, id))
      }
      return true
    })
    if (!found) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await notify(auth.bakeryId, { type: 'panettoni.updated' })
    return new NextResponse(null, { status: 204 })
  },
  { require: 'orders:toggle' },
)
