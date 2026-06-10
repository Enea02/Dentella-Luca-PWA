import { NextResponse, type NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { bakeries } from '@/lib/db/schema'
import { withAuth, parseJson, jsonWithCache } from '@/lib/api/handler'
import { notify } from '@/lib/realtime/notify'

export const GET = withAuth(async (_req, { auth }) => {
  const [row] = await db
    .select({ id: bakeries.id, name: bakeries.name, orderCutoffHour: bakeries.orderCutoffHour })
    .from(bakeries)
    .where(eq(bakeries.id, auth.bakeryId))
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return jsonWithCache(row, 300)
})

const UpdateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  orderCutoffHour: z.number().int().min(0).max(23).nullable().optional(),
})

export const PATCH = withAuth(
  async (req: NextRequest, { auth }) => {
    const body = await parseJson(req, UpdateSchema)
    const [updated] = await db
      .update(bakeries)
      .set(body)
      .where(eq(bakeries.id, auth.bakeryId))
      .returning({ id: bakeries.id, name: bakeries.name, orderCutoffHour: bakeries.orderCutoffHour })
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await notify(auth.bakeryId, { type: 'bakery.updated' })
    return NextResponse.json(updated)
  },
  { require: 'bakery:edit' },
)
