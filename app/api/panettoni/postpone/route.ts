import { NextResponse, type NextRequest } from 'next/server'
import { and, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { panettoneOrderItems, panettoneOrders } from '@/lib/db/schema'
import { withAuth, parseJson } from '@/lib/api/handler'
import { notify } from '@/lib/realtime/notify'
import { findOrCreateOpenOrder, syncStatusWithItems } from '@/lib/panettoni/server'
import { IsoDate } from '@/lib/panettoni/validation'

// "Posticipa" on a panettone line in Ordini: moves ONLY that flavor of a linked
// customer's order to a later day (decided with the bakery). The flavor joins
// the customer's open order of that day (created if missing, same kind/phone/
// notes); the source order is deleted if it ends up empty.
const Schema = z.object({
  orderId: z.string().uuid(),
  flavorId: z.string().uuid(),
  toDate: IsoDate,
})

export const POST = withAuth(
  async (req: NextRequest, { auth }) => {
    const { orderId, flavorId, toDate } = await parseJson(req, Schema)

    const result = await db.transaction(async (tx) => {
      const [source] = await tx
        .select({
          customerId: panettoneOrders.customerId,
          deliveryDate: panettoneOrders.deliveryDate,
          deliveryKind: panettoneOrders.deliveryKind,
          phone: panettoneOrders.phone,
          notes: panettoneOrders.notes,
        })
        .from(panettoneOrders)
        .where(and(eq(panettoneOrders.id, orderId), eq(panettoneOrders.bakeryId, auth.bakeryId)))
      if (!source) return { error: 'Not found', status: 404 } as const
      if (!source.customerId) return { error: 'Ordine non collegato a un cliente del gestionale', status: 400 } as const
      if (toDate <= source.deliveryDate) {
        return { error: 'Il nuovo giorno deve essere dopo quello attuale', status: 400 } as const
      }

      const [moved] = await tx
        .delete(panettoneOrderItems)
        .where(and(eq(panettoneOrderItems.orderId, orderId), eq(panettoneOrderItems.flavorId, flavorId)))
        .returning({
          qty: panettoneOrderItems.qty,
          producedQty: panettoneOrderItems.producedQty,
          state: panettoneOrderItems.state,
        })
      if (!moved) return { error: 'Not found', status: 404 } as const

      // Source: drop it if empty, otherwise its status follows the remaining flavors.
      const [left] = await tx
        .select({ n: sql<number>`count(*)::int` })
        .from(panettoneOrderItems)
        .where(eq(panettoneOrderItems.orderId, orderId))
      if (left.n === 0) {
        await tx.delete(panettoneOrders).where(eq(panettoneOrders.id, orderId))
      } else {
        await tx.update(panettoneOrders).set({ updatedAt: new Date() }).where(eq(panettoneOrders.id, orderId))
        await syncStatusWithItems(tx, orderId)
      }

      const targetId = await findOrCreateOpenOrder(tx, auth.bakeryId, source.customerId, toDate, source)
      await tx
        .insert(panettoneOrderItems)
        .values({ orderId: targetId, flavorId, ...moved })
        .onConflictDoUpdate({
          target: [panettoneOrderItems.orderId, panettoneOrderItems.flavorId],
          set: {
            qty: sql`${panettoneOrderItems.qty} + ${moved.qty}`,
            producedQty: sql`${panettoneOrderItems.producedQty} + ${moved.producedQty}`,
            // Same state on both sides → keep it; mixed pieces start over as "da fare".
            state: sql`case when ${panettoneOrderItems.state} = ${moved.state} then ${panettoneOrderItems.state} else 'todo'::panettone_item_state end`,
          },
        })
      await syncStatusWithItems(tx, targetId)
      return { orderId: targetId } as const
    })

    if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })
    await notify(auth.bakeryId, { type: 'panettoni.updated' })
    return NextResponse.json(result)
  },
  { require: 'orders:toggle' },
)
