import { NextResponse, type NextRequest } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { panettoneOrderItems, panettoneOrders } from '@/lib/db/schema'
import { withAuth, parseJson } from '@/lib/api/handler'
import { notify } from '@/lib/realtime/notify'
import { ITEM_STATE_FOR_STATUS } from '@/lib/panettoni/helpers'

// Whole row (tap on the customer, "Ripristina"): every flavor takes the matching
// state — todo → da fare, stock → in magazzino, done → consegnato.
// The client sends the TARGET status (not "advance"), so the request is
// idempotent and safe to replay from the service worker's background-sync queue.
const Schema = z.object({ status: z.enum(['todo', 'stock', 'done']) })

export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, { params, auth }) => {
    const { id } = await params
    const { status } = await parseJson(req, Schema)

    const found = await db.transaction(async (tx) => {
      const updated = await tx
        .update(panettoneOrders)
        .set({ status, doneAt: status === 'done' ? new Date() : null })
        .where(and(eq(panettoneOrders.id, id), eq(panettoneOrders.bakeryId, auth.bakeryId)))
        .returning({ id: panettoneOrders.id })
      if (updated.length === 0) return false
      await tx
        .update(panettoneOrderItems)
        .set({ state: ITEM_STATE_FOR_STATUS[status] })
        .where(eq(panettoneOrderItems.orderId, id))
      return true
    })
    if (!found) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await notify(auth.bakeryId, { type: 'panettoni.updated' })
    return new NextResponse(null, { status: 204 })
  },
  { require: 'orders:toggle' },
)
