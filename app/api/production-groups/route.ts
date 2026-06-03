import { NextResponse, type NextRequest } from 'next/server'
import { asc, eq, inArray, max } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { productionGroupSections, productionGroups, sections } from '@/lib/db/schema'
import { withAuth, parseJson, jsonWithCache } from '@/lib/api/handler'
import { notify } from '@/lib/realtime/notify'

async function listGroups(bakeryId: string) {
  const groups = await db
    .select({
      id: productionGroups.id,
      name: productionGroups.name,
      order: productionGroups.order,
      displayMode: productionGroups.displayMode,
    })
    .from(productionGroups)
    .where(eq(productionGroups.bakeryId, bakeryId))
    .orderBy(asc(productionGroups.order))

  if (groups.length === 0) return []

  const links = await db
    .select({
      groupId: productionGroupSections.groupId,
      sectionId: productionGroupSections.sectionId,
    })
    .from(productionGroupSections)
    .where(
      inArray(
        productionGroupSections.groupId,
        groups.map((g) => g.id),
      ),
    )

  const map = new Map<string, string[]>()
  for (const l of links) {
    const arr = map.get(l.groupId) ?? []
    arr.push(l.sectionId)
    map.set(l.groupId, arr)
  }

  return groups.map((g) => ({
    ...g,
    sectionIds: map.get(g.id) ?? [],
  }))
}

export const GET = withAuth(async (_req, { auth }) => {
  return jsonWithCache(await listGroups(auth.bakeryId), 60)
})

const CreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  sectionIds: z.array(z.string().uuid()).default([]),
})

export const POST = withAuth(
  async (req: NextRequest, { auth }) => {
    const body = await parseJson(req, CreateSchema)
    const sectionIds: string[] = body.sectionIds ?? []

    // Verify all section IDs belong to this bakery
    if (sectionIds.length > 0) {
      const found = await db
        .select({ id: sections.id })
        .from(sections)
        .where(eq(sections.bakeryId, auth.bakeryId))
      const owned = new Set(found.map((s) => s.id))
      if (sectionIds.some((id) => !owned.has(id))) {
        return NextResponse.json({ error: 'Invalid section IDs' }, { status: 400 })
      }
    }

    const [{ maxOrder }] = await db
      .select({ maxOrder: max(productionGroups.order) })
      .from(productionGroups)
      .where(eq(productionGroups.bakeryId, auth.bakeryId))

    const created = await db.transaction(async (tx) => {
      const [group] = await tx
        .insert(productionGroups)
        .values({
          bakeryId: auth.bakeryId,
          name: body.name,
          order: (maxOrder ?? -1) + 1,
        })
        .returning()

      if (sectionIds.length > 0) {
        await tx
          .insert(productionGroupSections)
          .values(sectionIds.map((sid) => ({ groupId: group.id, sectionId: sid })))
      }
      return group
    })

    await notify(auth.bakeryId, { type: 'production-groups.updated' })
    return NextResponse.json(
      {
        id: created.id,
        name: created.name,
        order: created.order,
        displayMode: created.displayMode,
        sectionIds: sectionIds,
      },
      { status: 201 },
    )
  },
  { require: 'production-groups:write' },
)
