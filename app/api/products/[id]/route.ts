import { NextResponse, type NextRequest } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { products, sections } from '@/lib/db/schema'
import { withAuth, parseJson } from '@/lib/api/handler'

const UpdateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  section: z.string().trim().min(1).optional(),
  unit: z.enum(['pieces', 'kg']).optional(),
  piecesPerKg: z.number().int().positive().nullable().optional(),
})

export const PATCH = withAuth<{ id: string }>(
  async (req: NextRequest, { params, auth }) => {
    const { id } = await params
    const body = await parseJson(req, UpdateSchema)

    const patch: Record<string, unknown> = {}
    if (body.name !== undefined) patch.name = body.name
    if (body.unit !== undefined) patch.unit = body.unit
    if (body.piecesPerKg !== undefined) patch.piecesPerKg = body.piecesPerKg

    if (body.section !== undefined) {
      const [section] = await db
        .select({ id: sections.id })
        .from(sections)
        .where(and(eq(sections.bakeryId, auth.bakeryId), eq(sections.name, body.section)))
        .limit(1)
      if (!section) return NextResponse.json({ error: 'Section not found' }, { status: 400 })
      patch.sectionId = section.id
    }

    const [updated] = await db
      .update(products)
      .set(patch)
      .where(and(eq(products.id, id), eq(products.bakeryId, auth.bakeryId)))
      .returning({
        id: products.id,
        name: products.name,
        sectionId: products.sectionId,
        unit: products.unit,
        piecesPerKg: products.piecesPerKg,
      })

    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const [{ name: sectionName }] = await db
      .select({ name: sections.name })
      .from(sections)
      .where(eq(sections.id, updated.sectionId))
    return NextResponse.json({ ...updated, section: sectionName })
  },
  { require: 'products:write' },
)

export const DELETE = withAuth<{ id: string }>(
  async (_req, { params, auth }) => {
    const { id } = await params
    const deleted = await db
      .delete(products)
      .where(and(eq(products.id, id), eq(products.bakeryId, auth.bakeryId)))
      .returning({ id: products.id })
    if (deleted.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return new NextResponse(null, { status: 204 })
  },
  { require: 'products:write' },
)
