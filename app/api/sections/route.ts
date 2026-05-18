import { NextResponse, type NextRequest } from 'next/server'
import { asc, eq, max } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { sections } from '@/lib/db/schema'
import { withAuth, parseJson } from '@/lib/api/handler'
import { SECTION_COLOR_PALETTE } from '@/lib/constants'

export const GET = withAuth(async (_req, { auth }) => {
  const rows = await db
    .select({ id: sections.id, name: sections.name, color: sections.color, order: sections.order })
    .from(sections)
    .where(eq(sections.bakeryId, auth.bakeryId))
    .orderBy(asc(sections.order))
  return NextResponse.json(rows)
})

const CreateSchema = z.object({ name: z.string().trim().min(1).max(80) })

export const POST = withAuth(
  async (req: NextRequest, { auth }) => {
    const { name } = await parseJson(req, CreateSchema)

    const existing = await db
      .select({ color: sections.color, order: sections.order })
      .from(sections)
      .where(eq(sections.bakeryId, auth.bakeryId))
    const usedColors = new Set(existing.map((r) => r.color))
    const color = SECTION_COLOR_PALETTE.find((c) => !usedColors.has(c)) ?? SECTION_COLOR_PALETTE[0]

    const [{ maxOrder }] = await db
      .select({ maxOrder: max(sections.order) })
      .from(sections)
      .where(eq(sections.bakeryId, auth.bakeryId))
    const nextOrder = (maxOrder ?? -1) + 1

    const [created] = await db
      .insert(sections)
      .values({ bakeryId: auth.bakeryId, name, color, order: nextOrder })
      .returning({ id: sections.id, name: sections.name, color: sections.color, order: sections.order })

    return NextResponse.json(created, { status: 201 })
  },
  { require: 'sections:write' },
)
