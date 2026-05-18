import { eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { rolePermissionOverrides, userPermissionOverrides, users } from '@/lib/db/schema'
import { computeEffectivePermissions, type PermissionKey } from './permissions'
import type { Role } from '@/lib/types'

interface SimulatedRoleOverride {
  role: Role
  permission: string
  allowed: boolean
}

interface SimulatedUserOverride {
  userId: string
  permission: string
  allowed: boolean
}

/**
 * Check whether removing/setting `permissions:manage` to false would leave the
 * bakery with zero effective admins (lock-out). Returns true if it would.
 *
 * `simulated` describes the pending change(s) you're about to apply — we apply
 * them on top of the current DB state and recompute permissions for everyone.
 */
export async function wouldLockOut(
  bakeryId: string,
  simulated: {
    roleOverrides?: Array<SimulatedRoleOverride | { role: Role; permission: string; remove: true }>
    userOverrides?: Array<SimulatedUserOverride | { userId: string; permission: string; remove: true }>
  },
): Promise<boolean> {
  const key: PermissionKey = 'permissions:manage'

  // Load current DB state for this bakery
  const allUsers = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.bakeryId, bakeryId))

  const currentRoleOv = await db
    .select({
      role: rolePermissionOverrides.role,
      permission: rolePermissionOverrides.permission,
      allowed: rolePermissionOverrides.allowed,
    })
    .from(rolePermissionOverrides)
    .where(eq(rolePermissionOverrides.bakeryId, bakeryId))

  const userOvByUser = new Map<string, { permission: string; allowed: boolean }[]>()
  for (const u of allUsers) {
    userOvByUser.set(u.id, [])
  }
  for (const u of allUsers) {
    const rows = await db
      .select({
        permission: userPermissionOverrides.permission,
        allowed: userPermissionOverrides.allowed,
      })
      .from(userPermissionOverrides)
      .where(eq(userPermissionOverrides.userId, u.id))
    userOvByUser.set(u.id, rows)
  }

  // Apply simulated role overrides on top of current
  const effectiveRoleOv = [...currentRoleOv.map((r) => ({ ...r, role: r.role as Role }))]
  for (const sim of simulated.roleOverrides ?? []) {
    const idx = effectiveRoleOv.findIndex(
      (r) => r.role === sim.role && r.permission === sim.permission,
    )
    if ('remove' in sim) {
      if (idx >= 0) effectiveRoleOv.splice(idx, 1)
    } else {
      if (idx >= 0) effectiveRoleOv[idx] = sim
      else effectiveRoleOv.push(sim)
    }
  }

  // Same for user overrides
  for (const sim of simulated.userOverrides ?? []) {
    const list = userOvByUser.get(sim.userId) ?? []
    const idx = list.findIndex((r) => r.permission === sim.permission)
    if ('remove' in sim) {
      if (idx >= 0) list.splice(idx, 1)
    } else {
      if (idx >= 0) list[idx] = { permission: sim.permission, allowed: sim.allowed }
      else list.push({ permission: sim.permission, allowed: sim.allowed })
    }
    userOvByUser.set(sim.userId, list)
  }

  // Re-compute for each user and count who still has permissions:manage
  let activeManagers = 0
  for (const u of allUsers) {
    const perms = computeEffectivePermissions(
      u.role as Role,
      effectiveRoleOv,
      userOvByUser.get(u.id) ?? [],
    )
    if (perms[key]) activeManagers++
  }

  return activeManagers === 0
}
