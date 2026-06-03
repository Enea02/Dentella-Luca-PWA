'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Loader2, RotateCcw, ChevronDown, X, Check, Minus, KeyRound } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useUsers } from '@/hooks/useData'
import { useAuth } from '@/hooks/useAuth'
import { can, PERMISSION_KEYS, type PermissionKey } from '@/lib/auth/permissions'
import type { Role } from '@/lib/types'

const ROLE_ORDER: Role[] = ['admin', 'owner', 'staff']
const ROLE_LABEL: Record<Role, string> = { admin: 'Admin', owner: 'Titolare', staff: 'Staff' }

interface RoleOverride {
  role: Role
  permission: string
  allowed: boolean
}

interface UserOverrideRow {
  permission: string
  allowed: boolean
}

interface PermissionsData {
  defaults: Record<string, readonly Role[]>
  roleOverrides: RoleOverride[]
  userOverrides: Record<string, UserOverrideRow[]>
}

const PERMISSION_LABEL: Partial<Record<PermissionKey, string>> = {
  'products:write': 'Modifica prodotti',
  'sections:write': 'Modifica sezioni',
  'divisors:write': 'Modifica divisori',
  'production-groups:write': 'Modifica gruppi produzione',
  'users:manage': 'Gestione utenti',
  'bakery:edit': 'Modifica panetteria',
  'statistics:view': 'Vedere statistiche',
  'permissions:manage': 'Gestione permessi',
  'customers:write': 'Gestione clienti',
  'orders:edit': 'Modifica ordini',
  'orders:read': 'Lettura ordini',
  'orders:toggle': 'Toggle "fatto"',
}

export function PermissionsManager() {
  const [data, setData] = useState<PermissionsData | null>(null)
  const [loading, setLoading] = useState(true)

  async function refresh() {
    setLoading(true)
    try {
      const res = await fetch('/api/permissions')
      if (!res.ok) throw new Error('Errore caricamento')
      setData(await res.json())
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Errore')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500 bg-amber-50 rounded-xl px-3 py-2 border border-amber-100">
        ⚠️ Le modifiche si applicano dopo che l&apos;utente coinvolto fa logout e nuovo login.
      </p>

      <Tabs defaultValue="role">
        <TabsList className="w-full rounded-xl bg-slate-100 p-1">
          <TabsTrigger value="role" className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Per ruolo
          </TabsTrigger>
          <TabsTrigger value="user" className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Per utente
          </TabsTrigger>
        </TabsList>

        <TabsContent value="role" className="mt-4">
          <RoleMatrix data={data} onChange={refresh} />
        </TabsContent>

        <TabsContent value="user" className="mt-4">
          <UserMatrix data={data} onChange={refresh} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ─── Per ruolo ─────────────────────────────────────────────────────────────

function RoleMatrix({ data, onChange }: { data: PermissionsData; onChange: () => void }) {
  const overrideMap = useMemo(() => {
    const m = new Map<string, boolean>()
    for (const o of data.roleOverrides) m.set(`${o.role}|${o.permission}`, o.allowed)
    return m
  }, [data.roleOverrides])

  function effective(role: Role, permission: PermissionKey): boolean {
    const ov = overrideMap.get(`${role}|${permission}`)
    if (ov !== undefined) return ov
    return (data.defaults[permission] as readonly Role[]).includes(role)
  }

  function isOverridden(role: Role, permission: PermissionKey): boolean {
    return overrideMap.has(`${role}|${permission}`)
  }

  async function setRole(role: Role, permission: PermissionKey, allowed: boolean | null) {
    const res = await fetch('/api/permissions/role', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, permission, allowed }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Errore' }))
      toast.error(err.error)
      return
    }
    onChange()
  }

  async function toggle(role: Role, permission: PermissionKey) {
    const curr = effective(role, permission)
    const def = (data.defaults[permission] as readonly Role[]).includes(role)
    const newVal = !curr
    // If new value matches default, remove the override; otherwise set it
    await setRole(role, permission, newVal === def ? null : newVal)
  }

  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden">
      <table className="w-full text-xs md:text-sm table-fixed md:table-auto">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="text-left px-2 md:px-4 py-2.5 font-medium text-slate-700">Permesso</th>
            {ROLE_ORDER.map((r) => (
              <th key={r} className="px-1 md:px-3 py-2.5 font-medium text-slate-700 w-12 md:w-20 text-center">
                {ROLE_LABEL[r]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PERMISSION_KEYS.map((perm) => (
            <tr key={perm} className="border-b border-slate-100 last:border-0">
              <td className="px-2 md:px-4 py-2.5 text-slate-700">
                <span className="font-medium">{PERMISSION_LABEL[perm] ?? perm}</span>
                <span className="hidden md:inline ml-2 text-xs text-slate-400 font-mono">{perm}</span>
              </td>
              {ROLE_ORDER.map((role) => {
                const eff = effective(role, perm)
                const overridden = isOverridden(role, perm)
                return (
                  <td key={role} className="text-center px-1 md:px-3 py-2.5">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => toggle(role, perm)}
                        className={cn(
                          'w-7 h-7 rounded-md flex items-center justify-center transition-colors',
                          eff
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200',
                          overridden && 'ring-2 ring-blue-300',
                        )}
                        title={overridden ? 'Override attivo (clicca per cambiare)' : 'Default'}
                      >
                        {eff ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                      </button>
                      {overridden && (
                        <button
                          type="button"
                          onClick={() => setRole(role, perm, null)}
                          className="text-slate-300 hover:text-slate-500"
                          title="Ripristina default"
                        >
                          <RotateCcw className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Per utente ────────────────────────────────────────────────────────────

function UserMatrix({ data, onChange }: { data: PermissionsData; onChange: () => void }) {
  const { users } = useUsers()
  const { user: currentUser } = useAuth()
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null)
  const [resettingId, setResettingId] = useState<string | null>(null)

  const canManageUsers = can(currentUser, 'users:manage')

  async function resetPassword(userId: string, email: string) {
    setResettingId(userId)
    try {
      const res = await fetch(`/api/users/${userId}/reset-password`, { method: 'POST' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Errore' }))
        toast.error(err.error ?? 'Errore durante il reset')
        return
      }
      const { tempPassword } = (await res.json()) as { tempPassword: string }
      toast.success('Password temporanea generata', {
        description: `${email}: ${tempPassword} — mostrata una sola volta, copiala ora.`,
        duration: Infinity,
        closeButton: true,
        action: {
          label: 'Copia',
          onClick: () => {
            navigator.clipboard?.writeText(tempPassword)
            toast.success('Password copiata')
          },
        },
      })
    } catch {
      toast.error('Errore durante il reset')
    } finally {
      setResettingId(null)
    }
  }

  return (
    <div className="space-y-2">
      {users.map((u) => {
        const overrides = data.userOverrides[u.id] ?? []
        const isOpen = expandedUserId === u.id
        return (
          <div key={u.id} className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setExpandedUserId(isOpen ? null : u.id)}
                className="flex-1 min-w-0 flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="text-left min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{u.email}</p>
                    <p className="text-xs text-slate-500">
                      {ROLE_LABEL[u.role]}
                      {overrides.length > 0 && ` · ${overrides.length} override`}
                    </p>
                  </div>
                </div>
                <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform shrink-0', isOpen && 'rotate-180')} />
              </button>

              {canManageUsers && (
                <button
                  type="button"
                  onClick={() => resetPassword(u.id, u.email)}
                  disabled={resettingId === u.id}
                  className="shrink-0 px-3 py-3 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                  title="Reimposta password"
                  aria-label={`Reimposta password di ${u.email}`}
                >
                  {resettingId === u.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <KeyRound className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>

            {isOpen && (
              <UserPermissionRows
                userId={u.id}
                role={u.role}
                overrides={overrides}
                defaults={data.defaults}
                onChange={onChange}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function UserPermissionRows({
  userId,
  role,
  overrides,
  defaults,
  onChange,
}: {
  userId: string
  role: Role
  overrides: UserOverrideRow[]
  defaults: Record<string, readonly Role[]>
  onChange: () => void
}) {
  const overrideMap = useMemo(() => {
    const m = new Map<string, boolean>()
    for (const o of overrides) m.set(o.permission, o.allowed)
    return m
  }, [overrides])

  async function setUser(permission: PermissionKey, allowed: boolean | null) {
    const res = await fetch(`/api/permissions/user/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permission, allowed }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Errore' }))
      toast.error(err.error)
      return
    }
    onChange()
  }

  return (
    <div className="border-t border-slate-100 bg-slate-50/50 divide-y divide-slate-100">
      {PERMISSION_KEYS.map((perm) => {
        const ov = overrideMap.get(perm)
        const def = (defaults[perm] as readonly Role[]).includes(role)
        const eff = ov !== undefined ? ov : def
        const state: 'default' | 'forced-on' | 'forced-off' =
          ov === undefined ? 'default' : ov ? 'forced-on' : 'forced-off'

        return (
          <div key={perm} className="flex flex-col gap-2 px-3 md:px-4 py-2 md:flex-row md:items-center md:justify-between">
            <div className="text-sm min-w-0">
              <span className="text-slate-700">{PERMISSION_LABEL[perm] ?? perm}</span>
              <span className="hidden md:inline ml-2 text-xs text-slate-400 font-mono">{perm}</span>
              <span className={cn('ml-2 text-xs', eff ? 'text-emerald-600' : 'text-slate-400')}>
                {eff ? '✓ permesso' : '✗ negato'}
              </span>
            </div>
            <div className="inline-flex self-end md:self-auto rounded-lg border border-slate-200 overflow-hidden shrink-0">
              <button
                type="button"
                onClick={() => setUser(perm, null)}
                className={cn(
                  'px-2.5 py-1 text-xs flex items-center gap-1 transition-colors',
                  state === 'default' ? 'bg-slate-200 text-slate-900' : 'bg-white text-slate-500 hover:bg-slate-50',
                )}
                title="Eredita dal ruolo"
              >
                <Minus className="h-3 w-3" /> Default
              </button>
              <button
                type="button"
                onClick={() => setUser(perm, true)}
                className={cn(
                  'px-2.5 py-1 text-xs flex items-center gap-1 transition-colors border-l border-slate-200',
                  state === 'forced-on' ? 'bg-emerald-100 text-emerald-800' : 'bg-white text-slate-500 hover:bg-slate-50',
                )}
              >
                <Check className="h-3 w-3" /> Sì
              </button>
              <button
                type="button"
                onClick={() => setUser(perm, false)}
                className={cn(
                  'px-2.5 py-1 text-xs flex items-center gap-1 transition-colors border-l border-slate-200',
                  state === 'forced-off' ? 'bg-red-100 text-red-700' : 'bg-white text-slate-500 hover:bg-slate-50',
                )}
              >
                <X className="h-3 w-3" /> No
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
