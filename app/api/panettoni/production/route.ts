import { NextResponse, type NextRequest } from 'next/server'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { panettoneOrderItems, panettoneOrders, panettonePlanSettings } from '@/lib/db/schema'
import { withAuth, parseJson } from '@/lib/api/handler'
import { notify } from '@/lib/realtime/notify'
import type { PlanResult } from '@/lib/panettoni/plan'
import { syncStatusWithItems } from '@/lib/panettoni/server'
import { IsoDate, seasonParam } from '@/lib/panettoni/validation'

// Marks one flavor of one day of the CONFIRMED plan as baked ("fatto"), or
// un-marks it. Baked pieces are added to each destination order's producedQty;
// a cell fully produced goes "in magazzino", and the row status follows.
// Idempotent: re-sending the same state is a no-op.
const Schema = z.object({
  date: IsoDate,
  flavorId: z.string().uuid(),
  done: z.boolean(),
})

export const POST = withAuth(
  async (req: NextRequest, { auth }) => {
    const season = seasonParam(req.url)
    const { date, flavorId, done } = await parseJson(req, Schema)

    const result = await db.transaction(async (tx) => {
      const [row] = await tx
        .select({ plan: panettonePlanSettings.confirmedPlan })
        .from(panettonePlanSettings)
        .where(and(eq(panettonePlanSettings.bakeryId, auth.bakeryId), eq(panettonePlanSettings.season, season)))
        .for('update')
      const plan = row?.plan as PlanResult | null | undefined
      if (!plan) return 'no-plan' as const
      const item = plan.days.find((d) => d.date === date)?.items[flavorId]
      if (!item) return 'not-found' as const
      if (!!item.done === done) return 'ok' as const

      // Only orders of this bakery (the snapshot ids are trusted, but keep the tenant guard).
      const orderIds = [...new Set(item.orders.map((o) => o.orderId))]
      const owned = await tx
        .select({ id: panettoneOrders.id })
        .from(panettoneOrders)
        .where(and(eq(panettoneOrders.bakeryId, auth.bakeryId), inArray(panettoneOrders.id, orderIds)))
      const ownedIds = new Set(owned.map((o) => o.id))

      for (const ref of item.orders) {
        if (!ownedIds.has(ref.orderId)) continue
        const cell = and(eq(panettoneOrderItems.orderId, ref.orderId), eq(panettoneOrderItems.flavorId, flavorId))
        await tx
          .update(panettoneOrderItems)
          .set({
            producedQty: done
              ? sql`least(${panettoneOrderItems.qty}, ${panettoneOrderItems.producedQty} + ${ref.qty})`
              : sql`greatest(0, ${panettoneOrderItems.producedQty} - ${ref.qty})`,
          })
          .where(cell)
        // That cell goes "in magazzino" once all its pieces are baked (and back
        // to "da fare" on undo). Delivered cells are never touched.
        if (done) {
          await tx
            .update(panettoneOrderItems)
            .set({ state: 'stock' })
            .where(and(cell, eq(panettoneOrderItems.state, 'todo'), sql`${panettoneOrderItems.producedQty} >= ${panettoneOrderItems.qty}`))
        } else {
          await tx
            .update(panettoneOrderItems)
            .set({ state: 'todo' })
            .where(and(cell, eq(panettoneOrderItems.state, 'stock'), sql`${panettoneOrderItems.producedQty} < ${panettoneOrderItems.qty}`))
        }
      }
      for (const orderId of ownedIds) await syncStatusWithItems(tx, orderId)

      item.done = done
      await tx
        .update(panettonePlanSettings)
        .set({ confirmedPlan: plan })
        .where(and(eq(panettonePlanSettings.bakeryId, auth.bakeryId), eq(panettonePlanSettings.season, season)))
      return 'ok' as const
    })

    if (result === 'no-plan') return NextResponse.json({ error: 'Piano non confermato' }, { status: 409 })
    if (result === 'not-found') return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await notify(auth.bakeryId, { type: 'panettoni.updated' })
    return new NextResponse(null, { status: 204 })
  },
  { require: 'orders:toggle' },
)
