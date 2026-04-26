'use client'

import { useAuth } from '@/hooks/useAuth'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import type { Role } from '@/lib/types'

const roleLabels: Record<Role, string> = {
  owner: 'Titolare',
  staff: 'Staff',
}

const roleColors: Record<Role, string> = {
  owner: 'bg-amber-100 text-amber-800',
  staff: 'bg-slate-100 text-slate-700',
}

export function RoleBadge() {
  const { role, user } = useAuth()
  const { demoRole, setDemoRole } = useAppStore()
  const isDev = process.env.NODE_ENV === 'development'
  const isMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true'
  const canToggle = isDev || isMock

  const handleToggle = () => {
    if (!canToggle) return
    setDemoRole(demoRole === 'owner' ? 'staff' : demoRole === 'staff' ? null : 'owner')
  }

  return (
    <button
      onClick={handleToggle}
      disabled={!canToggle}
      className={cn(
        'px-2 py-1 rounded-lg text-xs font-medium transition-colors',
        roleColors[role],
        canToggle && 'cursor-pointer hover:opacity-80',
        !canToggle && 'cursor-default'
      )}
      title={canToggle ? 'Click per cambiare ruolo' : undefined}
    >
      {roleLabels[role]}
      {demoRole && canToggle && (
        <span className="ml-1 opacity-60">(demo)</span>
      )}
    </button>
  )
}
