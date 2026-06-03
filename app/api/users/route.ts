import { NextResponse, type NextRequest } from 'next/server'
import { asc, eq } from 'drizzle-orm'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db/client'
import { bakeries, users } from '@/lib/db/schema'
import { withAuth, parseJson } from '@/lib/api/handler'
import { notify } from '@/lib/realtime/notify'

export const GET = withAuth(async (_req, { auth }) => {
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      bakeryId: users.bakeryId,
      bakeryName: bakeries.name,
    })
    .from(users)
    .innerJoin(bakeries, eq(bakeries.id, users.bakeryId))
    .where(eq(users.bakeryId, auth.bakeryId))
    .orderBy(asc(users.email))
  const res = NextResponse.json(rows)
  res.headers.set('Cache-Control', 'private, no-store')
  return res
})

const CreateSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(100),
  role: z.enum(['admin', 'owner', 'staff']),
  name: z.string().trim().max(120).optional().nullable(),
})

export const POST = withAuth(
  async (req: NextRequest, { auth }) => {
    const body = await parseJson(req, CreateSchema)

    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, body.email)).limit(1)
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(body.password, 12)
    const [created] = await db
      .insert(users)
      .values({
        bakeryId: auth.bakeryId,
        email: body.email,
        passwordHash,
        role: body.role,
        name: body.name ?? null,
      })
      .returning({
        id: users.id,
        email: users.email,
        role: users.role,
        bakeryId: users.bakeryId,
      })

    const [{ name: bakeryName }] = await db
      .select({ name: bakeries.name })
      .from(bakeries)
      .where(eq(bakeries.id, auth.bakeryId))

    await notify(auth.bakeryId, { type: 'users.updated' })
    return NextResponse.json({ ...created, bakeryName }, { status: 201 })
  },
  { require: 'users:manage' },
)
