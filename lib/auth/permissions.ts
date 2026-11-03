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
  // Long press → "Posticipa" a product (or a panettone flavor) to a later day.
  'orders:postpone': ['admin', 'owner', 'staff'],
} as const satisfies Record<string, readonly Role[]>

export type PermissionKey = keyof typeof PERMISSIONS

export const PERMISSION_KEYS = Object.keys(PERMISSIONS) as PermissionKey[]

type CanInput = Role | { role: Role; permissions?: Record<string, boolean> } | undefined | null

// The admin can ALWAYS do everything: no override (role or user, even one already
// stored in the DB) can take a permission away from it. Enforced here, in
// computeEffectivePermissions (baked into the JWT at login) and by the
// permissions API, which refuses to set overrides on admins.
export const isAdminRole = (role: Role | undefined | null) => role === 'admin'

export function can(input: CanInput, action: PermissionKey): boolean {
  if (!input) return false
  const role = typeof input === 'string' ? input : input.role
  if (isAdminRole(role)) return true
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
  if (isAdminRole(role)) {
    for (const key of PERMISSION_KEYS) result[key] = true
    return result // overrides never apply to the admin
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
