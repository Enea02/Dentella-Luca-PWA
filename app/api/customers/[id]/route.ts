import { NextResponse, type NextRequest } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { customers } from '@/lib/db/schema'
import { withAuth, parseJson } from '@/lib/api/handler'
import { notify } from '@/lib/realtime/notify'

const UpdateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  type: z.enum(['fixed', 'single']).optional(),
})

export const PATCH = withAuth<{ id: string }>(
  async (req: NextRequest, { params, auth }) => {
    const { id } = await params
    const body = await parseJson(req, UpdateSchema)
    const [updated] = await db
      .update(customers)
      .set(body)
      .where(and(eq(customers.id, id), eq(customers.bakeryId, auth.bakeryId)))
      .returning({ id: customers.id, name: customers.name, type: customers.type })
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await notify(auth.bakeryId, { type: 'customers.updated' })
    return NextResponse.json(updated)
  },
  { require: 'customers:write' },
)

export const DELETE = withAuth<{ id: string }>(
  async (_req, { params, auth }) => {
    const { id } = await params
    const deleted = await db
      .delete(customers)
      .where(and(eq(customers.id, id), eq(customers.bakeryId, auth.bakeryId)))
      .returning({ id: customers.id })
    if (deleted.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await notify(auth.bakeryId, { type: 'customers.updated' })
    return new NextResponse(null, { status: 204 })
  },
  { require: 'customers:write' },
)
