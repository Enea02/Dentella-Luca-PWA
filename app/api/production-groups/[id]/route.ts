import { NextResponse, type NextRequest } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { productionGroupSections, productionGroups, sections } from '@/lib/db/schema'
import { withAuth, parseJson } from '@/lib/api/handler'

const UpdateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  sectionIds: z.array(z.string().uuid()).optional(),
  displayMode: z.enum(['by-article', 'by-section']).optional(),
})

export const PATCH = withAuth<{ id: string }>(
  async (req: NextRequest, { params, auth }) => {
    const { id } = await params
    const body = await parseJson(req, UpdateSchema)

    const [group] = await db
      .select()
      .from(productionGroups)
      .where(and(eq(productionGroups.id, id), eq(productionGroups.bakeryId, auth.bakeryId)))
      .limit(1)
    if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (body.sectionIds) {
      const owned = await db
        .select({ id: sections.id })
        .from(sections)
        .where(eq(sections.bakeryId, auth.bakeryId))
      const ownedSet = new Set(owned.map((s) => s.id))
      if (body.sectionIds.some((sid) => !ownedSet.has(sid))) {
        return NextResponse.json({ error: 'Invalid section IDs' }, { status: 400 })
      }
    }

    const patch: Record<string, unknown> = {}
    if (body.name !== undefined) patch.name = body.name
    if (body.displayMode !== undefined) patch.displayMode = body.displayMode

    await db.transaction(async (tx) => {
      if (Object.keys(patch).length > 0) {
        await tx.update(productionGroups).set(patch).where(eq(productionGroups.id, id))
      }
      if (body.sectionIds) {
        await tx.delete(productionGroupSections).where(eq(productionGroupSections.groupId, id))
        if (body.sectionIds.length > 0) {
          await tx
            .insert(productionGroupSections)
            .values(body.sectionIds.map((sid) => ({ groupId: id, sectionId: sid })))
        }
      }
    })

    const [updated] = await db
      .select()
      .from(productionGroups)
      .where(eq(productionGroups.id, id))
      .limit(1)
    const links = await db
      .select({ sectionId: productionGroupSections.sectionId })
      .from(productionGroupSections)
      .where(eq(productionGroupSections.groupId, id))

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      order: updated.order,
      displayMode: updated.displayMode,
      sectionIds: links.map((l) => l.sectionId),
    })
  },
  { require: 'production-groups:write' },
)

export const DELETE = withAuth<{ id: string }>(
  async (_req, { params, auth }) => {
    const { id } = await params
    const deleted = await db
      .delete(productionGroups)
      .where(and(eq(productionGroups.id, id), eq(productionGroups.bakeryId, auth.bakeryId)))
      .returning({ id: productionGroups.id })
    if (deleted.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return new NextResponse(null, { status: 204 })
  },
  { require: 'production-groups:write' },
)
