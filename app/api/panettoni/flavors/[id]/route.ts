import { NextResponse, type NextRequest } from 'next/server'
import { and, count, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { panettoneFlavors, panettoneOrderItems } from '@/lib/db/schema'
import { withAuth, parseJson } from '@/lib/api/handler'
import { notify } from '@/lib/realtime/notify'
import { flavorColumns } from '@/lib/panettoni/server'
import { FlavorColorSchema, FlavorNameSchema, flavorNameTaken } from '@/lib/panettoni/validation'

const UpdateSchema = z.object({
  name: FlavorNameSchema.optional(),
  color: FlavorColorSchema.optional(),
  // false = hidden: no longer offered for new orders, existing orders keep it.
  active: z.boolean().optional(),
})

export const PATCH = withAuth<{ id: string }>(
  async (req: NextRequest, { params, auth }) => {
    const { id } = await params
    const body = await parseJson(req, UpdateSchema)
    if (body.name && (await flavorNameTaken(auth.bakeryId, body.name, id))) {
      return NextResponse.json({ error: 'Esiste già un gusto con questo nome' }, { status: 409 })
    }
    const [updated] = await db
      .update(panettoneFlavors)
      .set(body)
      .where(and(eq(panettoneFlavors.id, id), eq(panettoneFlavors.bakeryId, auth.bakeryId)))
      .returning(flavorColumns)
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await notify(auth.bakeryId, { type: 'panettoni.updated' })
    return NextResponse.json(updated)
  },
  { require: 'orders:edit' },
)

// Removes a flavor. One that appears in any order (this or past seasons) can't be
// deleted without losing order history, so it is HIDDEN instead.
export const DELETE = withAuth<{ id: string }>(
  async (_req, { params, auth }) => {
    const { id } = await params
    const [flavor] = await db
      .select({ id: panettoneFlavors.id })
      .from(panettoneFlavors)
      .where(and(eq(panettoneFlavors.id, id), eq(panettoneFlavors.bakeryId, auth.bakeryId)))
    if (!flavor) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const [{ used }] = await db
      .select({ used: count() })
      .from(panettoneOrderItems)
      .where(eq(panettoneOrderItems.flavorId, id))
    if (used > 0) {
      await db.update(panettoneFlavors).set({ active: false }).where(eq(panettoneFlavors.id, id))
      await notify(auth.bakeryId, { type: 'panettoni.updated' })
      return NextResponse.json({ result: 'hidden' })
    }

    // Never leave the bakery with no flavors: the defaults would be re-seeded.
    const [{ total }] = await db
      .select({ total: count() })
      .from(panettoneFlavors)
      .where(eq(panettoneFlavors.bakeryId, auth.bakeryId))
    if (total <= 1) {
      return NextResponse.json({ error: 'Deve restare almeno un gusto' }, { status: 409 })
    }

    await db.delete(panettoneFlavors).where(eq(panettoneFlavors.id, id))
    await notify(auth.bakeryId, { type: 'panettoni.updated' })
    return NextResponse.json({ result: 'deleted' })
  },
  { require: 'orders:edit' },
)
