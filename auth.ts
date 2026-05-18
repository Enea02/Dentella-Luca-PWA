import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { authConfig } from './auth.config'
import { db } from '@/lib/db/client'
import { bakeries, rolePermissionOverrides, userPermissionOverrides, users } from '@/lib/db/schema'
import { computeEffectivePermissions } from '@/lib/auth/permissions'
import type { Role } from '@/lib/types'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? '').trim().toLowerCase()
        const password = String(credentials?.password ?? '')
        if (!email || !password) return null

        const rows = await db
          .select({
            id: users.id,
            email: users.email,
            passwordHash: users.passwordHash,
            role: users.role,
            name: users.name,
            bakeryId: users.bakeryId,
            bakeryName: bakeries.name,
          })
          .from(users)
          .innerJoin(bakeries, eq(bakeries.id, users.bakeryId))
          .where(eq(users.email, email))
          .limit(1)

        const user = rows[0]
        if (!user) return null

        const ok = await bcrypt.compare(password, user.passwordHash)
        if (!ok) return null

        // Load permission overrides
        const roleOverrideRows = await db
          .select({
            role: rolePermissionOverrides.role,
            permission: rolePermissionOverrides.permission,
            allowed: rolePermissionOverrides.allowed,
          })
          .from(rolePermissionOverrides)
          .where(eq(rolePermissionOverrides.bakeryId, user.bakeryId))

        const userOverrideRows = await db
          .select({
            permission: userPermissionOverrides.permission,
            allowed: userPermissionOverrides.allowed,
          })
          .from(userPermissionOverrides)
          .where(eq(userPermissionOverrides.userId, user.id))

        const permissions = computeEffectivePermissions(
          user.role as Role,
          roleOverrideRows.map((r) => ({ ...r, role: r.role as Role })),
          userOverrideRows,
        )

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? user.email,
          role: user.role,
          bakeryId: user.bakeryId,
          bakeryName: user.bakeryName,
          permissions,
        }
      },
    }),
  ],
})
