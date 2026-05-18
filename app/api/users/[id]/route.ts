import { NextResponse, type NextRequest } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db/client'
import { bakeries, users } from '@/lib/db/schema'
import { withAuth, parseJson } from '@/lib/api/handler'

const UpdateSchema = z.object({
  role: z.enum(['admin', 'owner', 'staff']).optional(),
  password: z.string().min(8).max(100).optional(),
  name: z.string().trim().max(120).nullable().optional(),
})

export const PATCH = withAuth<{ id: string }>(
  async (req: NextRequest, { params, auth }) => {
    const { id } = await params
    const body = await parseJson(req, UpdateSchema)

    const patch: Record<string, unknown> = {}
    if (body.role !== undefined) patch.role = body.role
    if (body.name !== undefined) patch.name = body.name
    if (body.password) patch.passwordHash = await bcrypt.hash(body.password, 12)

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    const [updated] = await db
      .update(users)
      .set(patch)
      .where(and(eq(users.id, id), eq(users.bakeryId, auth.bakeryId)))
      .returning({ id: users.id, email: users.email, role: users.role, bakeryId: users.bakeryId })
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const [{ name: bakeryName }] = await db
      .select({ name: bakeries.name })
      .from(bakeries)
      .where(eq(bakeries.id, auth.bakeryId))
    return NextResponse.json({ ...updated, bakeryName })
  },
  { require: 'users:manage' },
)

export const DELETE = withAuth<{ id: string }>(
  async (_req, { params, auth }) => {
    const { id } = await params
    if (id === auth.userId) {
      return NextResponse.json({ error: "Can't delete yourself" }, { status: 400 })
    }
    const deleted = await db
      .delete(users)
      .where(and(eq(users.id, id), eq(users.bakeryId, auth.bakeryId)))
      .returning({ id: users.id })
    if (deleted.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return new NextResponse(null, { status: 204 })
  },
  { require: 'users:manage' },
)
