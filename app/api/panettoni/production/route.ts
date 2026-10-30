import { NextResponse, type NextRequest } from 'next/server'
import { and, eq, inArray, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { panettoneOrderItems, panettoneOrders, panettonePlanSettings } from '@/lib/db/schema'
import { withAuth, parseJson } from '@/lib/api/handler'
import { notify } from '@/lib/realtime/notify'
import type { PlanResult } from '@/lib/panettoni/plan'
import { IsoDate, seasonParam } from '@/lib/panettoni/validation'

// Marks one flavor of one day of the CONFIRMED plan as baked ("fatto"), or
// un-marks it. Baked pieces are added to each destination order's producedQty;
// an order whose every flavor is fully produced moves todo → stock.
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
        await tx
          .update(panettoneOrderItems)
          .set({
            producedQty: done
              ? sql`least(${panettoneOrderItems.qty}, ${panettoneOrderItems.producedQty} + ${ref.qty})`
              : sql`greatest(0, ${panettoneOrderItems.producedQty} - ${ref.qty})`,
          })
          .where(and(eq(panettoneOrderItems.orderId, ref.orderId), eq(panettoneOrderItems.flavorId, flavorId)))
      }

      if (ownedIds.size > 0) {
        const ids = [...ownedIds]
        // Fully produced?  = no item left with producedQty < qty.
        const pending = sql`exists (select 1 from ${panettoneOrderItems} where ${panettoneOrderItems.orderId} = ${panettoneOrders.id} and ${panettoneOrderItems.producedQty} < ${panettoneOrderItems.qty})`
        if (done) {
          await tx
            .update(panettoneOrders)
            .set({ status: 'stock' })
            .where(and(inArray(panettoneOrders.id, ids), eq(panettoneOrders.status, 'todo'), sql`not ${pending}`))
        } else {
          await tx
            .update(panettoneOrders)
            .set({ status: 'todo' })
            .where(and(inArray(panettoneOrders.id, ids), eq(panettoneOrders.status, 'stock'), pending))
        }
      }

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
