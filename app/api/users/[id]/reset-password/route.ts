import { NextResponse } from 'next/server'
import { randomBytes } from 'node:crypto'
import { and, eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db/client'
import { users } from '@/lib/db/schema'
import { withAuth } from '@/lib/api/handler'
import { notify } from '@/lib/realtime/notify'

// Readable alphabet: no ambiguous characters (0/O, 1/l/I) to make the
// one-time temporary password easy to dictate/copy.
const TEMP_PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
const TEMP_PASSWORD_LENGTH = 12

function generateTempPassword(): string {
  const bytes = randomBytes(TEMP_PASSWORD_LENGTH)
  let out = ''
  for (let i = 0; i < TEMP_PASSWORD_LENGTH; i++) {
    out += TEMP_PASSWORD_ALPHABET[bytes[i] % TEMP_PASSWORD_ALPHABET.length]
  }
  return out
}

export const POST = withAuth<{ id: string }>(
  async (_req, { params, auth }) => {
    const { id } = await params

    const tempPassword = generateTempPassword()
    const passwordHash = await bcrypt.hash(tempPassword, 12)

    // Tenant isolation: the bakeryId guard means a user from another bakery
    // matches no row → treated as "not found" below.
    const [updated] = await db
      .update(users)
      .set({ passwordHash, mustChangePassword: true })
      .where(and(eq(users.id, id), eq(users.bakeryId, auth.bakeryId)))
      .returning({ id: users.id })

    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Shown to the admin exactly once; never logged or persisted in clear text.
    await notify(auth.bakeryId, { type: 'users.updated' })
    return NextResponse.json({ tempPassword })
  },
  { require: 'users:manage' },
)
