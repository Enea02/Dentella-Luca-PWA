import { NextResponse, type NextRequest } from 'next/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'
import { withAuth, parseJson } from '@/lib/api/handler'

const ChangeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(100),
})

export const POST = withAuth(async (req: NextRequest, { auth }) => {
  const body = await parseJson(req, ChangeSchema)

  const [user] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, auth.userId))
    .limit(1)

  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const ok = await bcrypt.compare(body.currentPassword, user.passwordHash)
  if (!ok) {
    return NextResponse.json({ error: 'Password attuale non corretta' }, { status: 400 })
  }

  const passwordHash = await bcrypt.hash(body.newPassword, 12)
  await db
    .update(users)
    .set({ passwordHash, mustChangePassword: false })
    .where(eq(users.id, auth.userId))

  return new NextResponse(null, { status: 204 })
})
