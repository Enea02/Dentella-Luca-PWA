import type { Role } from '@/lib/types'

export const ROLES = ['admin', 'owner', 'staff'] as const

// Single source of truth: who can do what (defaults).
// Per-bakery / per-user overrides live in role_permission_overrides
// and user_permission_overrides tables.
export const PERMISSIONS = {
  // Admin only (infrastructure)
  'products:write': ['admin'],
  'sections:write': ['admin'],
  'divisors:write': ['admin'],
  'production-groups:write': ['admin'],
  'users:manage': ['admin'],
  'bakery:edit': ['admin'],
  'statistics:view': ['admin'],
  'permissions:manage': ['admin'],

  // Admin + owner (operational)
  'customers:write': ['admin', 'owner'],
  'orders:edit': ['admin', 'owner'],

  // All authenticated users
  'orders:read': ['admin', 'owner', 'staff'],
  'orders:toggle': ['admin', 'owner', 'staff'],
} as const satisfies Record<string, readonly Role[]>

export type PermissionKey = keyof typeof PERMISSIONS

export const PERMISSION_KEYS = Object.keys(PERMISSIONS) as PermissionKey[]

type CanInput = Role | { role: Role; permissions?: Record<string, boolean> } | undefined | null

export function can(input: CanInput, action: PermissionKey): boolean {
  if (!input) return false
  const role = typeof input === 'string' ? input : input.role
  const overrides = typeof input === 'object' ? input.permissions : undefined
  if (overrides && action in overrides) return overrides[action]
  return (PERMISSIONS[action] as readonly Role[]).includes(role)
}

// Compute the effective permissions map for a user, given the role and the override rows from DB.
export function computeEffectivePermissions(
  role: Role,
  roleOverrides: { role: Role; permission: string; allowed: boolean }[],
  userOverrides: { permission: string; allowed: boolean }[],
): Record<string, boolean> {
  const result: Record<string, boolean> = {}
  for (const key of PERMISSION_KEYS) {
    result[key] = (PERMISSIONS[key] as readonly Role[]).includes(role)
  }
  for (const r of roleOverrides) {
    if (r.role === role && r.permission in result) {
      result[r.permission] = r.allowed
    }
  }
  for (const u of userOverrides) {
    if (u.permission in result) {
      result[u.permission] = u.allowed
    }
  }
  return result
}
