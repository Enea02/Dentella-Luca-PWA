import { NextResponse, type NextRequest } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { userPermissionOverrides, users } from '@/lib/db/schema'
import { withAuth, parseJson } from '@/lib/api/handler'
import { notify } from '@/lib/realtime/notify'
import { PERMISSION_KEYS } from '@/lib/auth/permissions'
import { wouldLockOut } from '@/lib/auth/lockout'

const Schema = z.object({
  permission: z.string().refine((p) => PERMISSION_KEYS.includes(p as never), {
    message: 'Unknown permission',
  }),
  allowed: z.boolean().nullable(),
})

export const PUT = withAuth<{ userId: string }>(
  async (req: NextRequest, { params, auth }) => {
    const { userId } = await params
    const { permission, allowed } = await parseJson(req, Schema)

    // Verify the target user belongs to this bakery
    const [target] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, userId), eq(users.bakeryId, auth.bakeryId)))
      .limit(1)
    if (!target) return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 })

    // Lock-out check on permissions:manage
    if (permission === 'permissions:manage') {
      const simulated =
        allowed === null
          ? { userOverrides: [{ userId, permission, remove: true as const }] }
          : { userOverrides: [{ userId, permission, allowed }] }
      const lock = await wouldLockOut(auth.bakeryId, simulated)
      if (lock) {
        return NextResponse.json(
          { error: 'Operazione bloccata: rimarrebbe nessun utente con gestione permessi' },
          { status: 400 },
        )
      }
    }

    if (allowed === null) {
      await db
        .delete(userPermissionOverrides)
        .where(
          and(
            eq(userPermissionOverrides.userId, userId),
            eq(userPermissionOverrides.permission, permission),
          ),
        )
    } else {
      await db
        .insert(userPermissionOverrides)
        .values({ userId, permission, allowed })
        .onConflictDoUpdate({
          target: [userPermissionOverrides.userId, userPermissionOverrides.permission],
          set: { allowed },
        })
    }

    await notify(auth.bakeryId, { type: 'permissions.updated' })
    return new NextResponse(null, { status: 204 })
  },
  { require: 'permissions:manage' },
)
