import { NextResponse, type NextRequest } from 'next/server'
import { asc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { customers } from '@/lib/db/schema'
import { withAuth, parseJson, jsonWithCache } from '@/lib/api/handler'
import { notify } from '@/lib/realtime/notify'

export const GET = withAuth(async (_req, { auth }) => {
  const rows = await db
    .select({ id: customers.id, name: customers.name, type: customers.type, active: customers.active })
    .from(customers)
    .where(eq(customers.bakeryId, auth.bakeryId))
    .orderBy(asc(customers.name))
  return jsonWithCache(rows, 60)
})

const CreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  type: z.enum(['fixed', 'single']),
})

export const POST = withAuth(
  async (req: NextRequest, { auth }) => {
    const body = await parseJson(req, CreateSchema)
    const [created] = await db
      .insert(customers)
      .values({ bakeryId: auth.bakeryId, name: body.name, type: body.type })
      .returning({ id: customers.id, name: customers.name, type: customers.type, active: customers.active })
    await notify(auth.bakeryId, { type: 'customers.updated' })
    return NextResponse.json(created, { status: 201 })
  },
  { require: 'customers:write' },
)
