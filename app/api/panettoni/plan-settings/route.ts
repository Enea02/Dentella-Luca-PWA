import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { panettonePlanSettings } from '@/lib/db/schema'
import { withAuth, parseJson } from '@/lib/api/handler'
import { notify } from '@/lib/realtime/notify'
import { loadPlanSettings } from '@/lib/panettoni/server'
import { IsoDate, seasonParam } from '@/lib/panettoni/validation'

export const GET = withAuth(
  async (req: NextRequest, { auth }) =>
    NextResponse.json(await loadPlanSettings(auth.bakeryId, seasonParam(req.url))),
  { require: 'orders:read' },
)

// Constraints and rules of the planner. Any change voids the confirmation
// ("qualsiasi modifica ai parametri annulla la conferma").
const UpdateSchema = z.object({
  startDate: IsoDate.nullable().optional(),
  cap: z.number().int().min(5).max(10_000).optional(),
  lead: z.number().int().min(0).max(5).optional(),
  maxG: z.number().int().min(1).max(12).optional(),
  sunClosed: z.boolean().optional(),
  strategy: z.enum(['tardi', 'bilanciato', 'presto']).optional(),
  prio: z.enum(['preciso', 'entro', 'nessuna']).optional(),
  group: z.boolean().optional(),
})

export const PUT = withAuth(
  async (req: NextRequest, { auth }) => {
    const season = seasonParam(req.url)
    const { group, ...rest } = await parseJson(req, UpdateSchema)
    const patch = {
      ...rest,
      ...(group !== undefined && { groupFlavors: group }),
      confirmedAt: null,
      confirmedPlan: null,
    }
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
