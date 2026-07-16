import { NextResponse, type NextRequest } from 'next/server'
import { and, eq, asc } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { products, sections } from '@/lib/db/schema'
import { withAuth, parseJson, jsonWithCache } from '@/lib/api/handler'
import { notify } from '@/lib/realtime/notify'

export const GET = withAuth(async (_req, { auth }) => {
  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      section: sections.name,
      sectionId: products.sectionId,
      unit: products.unit,
      piecesPerKg: products.piecesPerKg,
      additionsWatch: products.additionsWatch,
    })
    .from(products)
    .innerJoin(sections, eq(sections.id, products.sectionId))
    .where(eq(products.bakeryId, auth.bakeryId))
    .orderBy(asc(products.name))
  return jsonWithCache(rows, 60)
})

const CreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  section: z.string().trim().min(1), // section name (current frontend contract)
  unit: z.enum(['pieces', 'kg']),
  piecesPerKg: z.number().int().positive().optional().nullable(),
})

export const POST = withAuth(
  async (req: NextRequest, { auth }) => {
    const body = await parseJson(req, CreateSchema)

    // Resolve section by name within this bakery
    const [section] = await db
      .select({ id: sections.id })
      .from(sections)
      .where(and(eq(sections.bakeryId, auth.bakeryId), eq(sections.name, body.section)))
      .limit(1)
    if (!section) return NextResponse.json({ error: 'Section not found' }, { status: 400 })

    const [created] = await db
      .insert(products)
      .values({
        bakeryId: auth.bakeryId,
        name: body.name,
        sectionId: section.id,
        unit: body.unit,
        piecesPerKg: body.piecesPerKg ?? null,
      })
      .returning({
        id: products.id,
        name: products.name,
        sectionId: products.sectionId,
        unit: products.unit,
        piecesPerKg: products.piecesPerKg,
        additionsWatch: products.additionsWatch,
      })

    await notify(auth.bakeryId, { type: 'products.updated' })
    return NextResponse.json({ ...created, section: body.section }, { status: 201 })
  },
  { require: 'products:write' },
)
