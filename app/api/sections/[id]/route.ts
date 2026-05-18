import { NextResponse, type NextRequest } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { sections } from '@/lib/db/schema'
import { withAuth, parseJson } from '@/lib/api/handler'

const UpdateSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  color: z.string().min(1).optional(),
})

export const PATCH = withAuth<{ id: string }>(
  async (req: NextRequest, { params, auth }) => {
    const { id } = await params
    const updates = await parseJson(req, UpdateSchema)

    const [updated] = await db
      .update(sections)
      .set(updates)
      .where(and(eq(sections.id, id), eq(sections.bakeryId, auth.bakeryId)))
      .returning({ id: sections.id, name: sections.name, color: sections.color, order: sections.order })

    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(updated)
  },
  { require: 'sections:write' },
)

export const DELETE = withAuth<{ id: string }>(
  async (_req, { params, auth }) => {
    const { id } = await params
    const deleted = await db
      .delete(sections)
      .where(and(eq(sections.id, id), eq(sections.bakeryId, auth.bakeryId)))
      .returning({ id: sections.id })
    if (deleted.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return new NextResponse(null, { status: 204 })
  },
  { require: 'sections:write' },
)
