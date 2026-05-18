import { NextResponse } from 'next/server'
import { eq, inArray } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { rolePermissionOverrides, userPermissionOverrides, users } from '@/lib/db/schema'
import { withAuth } from '@/lib/api/handler'
import { PERMISSIONS } from '@/lib/auth/permissions'

export const GET = withAuth(
  async (_req, { auth }) => {
    const roleOv = await db
      .select({
        role: rolePermissionOverrides.role,
        permission: rolePermissionOverrides.permission,
        allowed: rolePermissionOverrides.allowed,
      })
      .from(rolePermissionOverrides)
      .where(eq(rolePermissionOverrides.bakeryId, auth.bakeryId))

    const bakeryUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.bakeryId, auth.bakeryId))

    const userOvRows = bakeryUsers.length
      ? await db
          .select({
            userId: userPermissionOverrides.userId,
            permission: userPermissionOverrides.permission,
            allowed: userPermissionOverrides.allowed,
          })
          .from(userPermissionOverrides)
          .where(
            inArray(
              userPermissionOverrides.userId,
              bakeryUsers.map((u) => u.id),
            ),
          )
      : []

    const userOverrides: Record<string, { permission: string; allowed: boolean }[]> = {}
    for (const r of userOvRows) {
      const arr = userOverrides[r.userId] ?? []
      arr.push({ permission: r.permission, allowed: r.allowed })
      userOverrides[r.userId] = arr
    }

    return NextResponse.json({
      defaults: PERMISSIONS,
      roleOverrides: roleOv,
      userOverrides,
    })
  },
  { require: 'permissions:manage' },
)
