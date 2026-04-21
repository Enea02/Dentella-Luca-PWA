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

  const handleToggle = () => {
    if (!isDev) return
    setDemoRole(demoRole === 'owner' ? 'staff' : demoRole === 'staff' ? null : 'owner')
  }

  return (
    <button
      onClick={handleToggle}
      disabled={!isDev}
      className={cn(
        'px-2 py-1 rounded-lg text-xs font-medium transition-colors',
        roleColors[role],
        isDev && 'cursor-pointer hover:opacity-80',
        !isDev && 'cursor-default'
      )}
      title={isDev ? 'Click per cambiare ruolo (solo dev)' : undefined}
    >
      {roleLabels[role]}
      {demoRole && isDev && (
        <span className="ml-1 opacity-60">(demo)</span>
      )}
    </button>
  )
}
