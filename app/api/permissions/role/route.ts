import { NextResponse, type NextRequest } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { rolePermissionOverrides } from '@/lib/db/schema'
import { withAuth, parseJson } from '@/lib/api/handler'
import { PERMISSION_KEYS } from '@/lib/auth/permissions'
import { wouldLockOut } from '@/lib/auth/lockout'

const Schema = z.object({
  role: z.enum(['admin', 'owner', 'staff']),
  permission: z.string().refine((p) => PERMISSION_KEYS.includes(p as never), {
    message: 'Unknown permission',
  }),
  allowed: z.boolean().nullable(),
})

export const PUT = withAuth(
  async (req: NextRequest, { auth }) => {
    const { role, permission, allowed } = await parseJson(req, Schema)

    // Lock-out check: would this leave the bakery with zero permissions:manage holders?
    if (permission === 'permissions:manage') {
      const simulated =
        allowed === null
          ? { roleOverrides: [{ role, permission, remove: true as const }] }
          : { roleOverrides: [{ role, permission, allowed }] }
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
        .delete(rolePermissionOverrides)
        .where(
          and(
            eq(rolePermissionOverrides.bakeryId, auth.bakeryId),
            eq(rolePermissionOverrides.role, role),
            eq(rolePermissionOverrides.permission, permission),
          ),
        )
    } else {
      await db
        .insert(rolePermissionOverrides)
        .values({ bakeryId: auth.bakeryId, role, permission, allowed })
        .onConflictDoUpdate({
          target: [
            rolePermissionOverrides.bakeryId,
            rolePermissionOverrides.role,
            rolePermissionOverrides.permission,
          ],
          set: { allowed },
        })
    }

    return new NextResponse(null, { status: 204 })
  },
  { require: 'permissions:manage' },
)
