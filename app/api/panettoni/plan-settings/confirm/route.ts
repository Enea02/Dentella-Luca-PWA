import { NextResponse, type NextRequest } from 'next/server'
import { db } from '@/lib/db/client'
import { panettonePlanSettings } from '@/lib/db/schema'
import { withAuth } from '@/lib/api/handler'
import { notify } from '@/lib/realtime/notify'
import { loadOrders, loadPlanSettings } from '@/lib/panettoni/server'
import { buildPlan, plannableOrders } from '@/lib/panettoni/plan'
import { planHorizon } from '@/lib/panettoni/helpers'
import { seasonParam } from '@/lib/panettoni/validation'

// "Conferma piano": the plan is recomputed HERE from the current orders and
// settings (never trusted from the client) and stored as the snapshot the
// Produzione tab works from.
export const POST = withAuth(
  async (req: NextRequest, { auth }) => {
    const season = seasonParam(req.url)
    const [settings, orders] = await Promise.all([
      loadPlanSettings(auth.bakeryId, season),
      loadOrders(auth.bakeryId, { season }),
    ])
    const plan = buildPlan(plannableOrders(orders), settings, planHorizon(settings))
    const patch = { confirmedAt: new Date(), confirmedPlan: plan }
    await db
      .insert(panettonePlanSettings)
      .values({ bakeryId: auth.bakeryId, season, ...patch })
      .onConflictDoUpdate({
        target: [panettonePlanSettings.bakeryId, panettonePlanSettings.season],
        set: patch,
      })
    await notify(auth.bakeryId, { type: 'panettoni.updated' })
    return NextResponse.json(await loadPlanSettings(auth.bakeryId, season))
  },
  { require: 'orders:edit' },
)
