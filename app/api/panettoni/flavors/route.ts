import { NextResponse, type NextRequest } from 'next/server'
import { eq, max } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { panettoneFlavors } from '@/lib/db/schema'
import { withAuth, parseJson } from '@/lib/api/handler'
import { notify } from '@/lib/realtime/notify'
import { ensureFlavors, flavorColumns } from '@/lib/panettoni/server'
import { FlavorColorSchema, FlavorNameSchema, flavorNameKey, flavorNameTaken } from '@/lib/panettoni/validation'

// All flavors, hidden ones included (the client decides what to show).
export const GET = withAuth(
  async (_req, { auth }) => NextResponse.json(await ensureFlavors(auth.bakeryId)),
  { require: 'orders:read' },
)

const CreateSchema = z.object({ name: FlavorNameSchema, color: FlavorColorSchema })

export const POST = withAuth(
  async (req: NextRequest, { auth }) => {
    const { name, color } = await parseJson(req, CreateSchema)
    if (await flavorNameTaken(auth.bakeryId, name)) {
      return NextResponse.json({ error: 'Esiste già un gusto con questo nome' }, { status: 409 })
    }

    const existing = await db
      .select({ key: panettoneFlavors.key })
      .from(panettoneFlavors)
      .where(eq(panettoneFlavors.bakeryId, auth.bakeryId))
    const keys = new Set(existing.map((r) => r.key))
    // Stable slug, unique per bakery (a deleted flavor's slug may come back).
    const base = flavorNameKey(name) || 'gusto'
    let key = base
    for (let n = 2; keys.has(key); n++) key = `${base}-${n}`

    const [{ maxOrder }] = await db
      .select({ maxOrder: max(panettoneFlavors.sortOrder) })
      .from(panettoneFlavors)
      .where(eq(panettoneFlavors.bakeryId, auth.bakeryId))

    const [created] = await db
      .insert(panettoneFlavors)
      .values({ bakeryId: auth.bakeryId, key, name, color, sortOrder: (maxOrder ?? -1) + 1 })
      .returning(flavorColumns)

    await notify(auth.bakeryId, { type: 'panettoni.updated' })
    return NextResponse.json(created, { status: 201 })
  },
  { require: 'orders:edit' },
)
