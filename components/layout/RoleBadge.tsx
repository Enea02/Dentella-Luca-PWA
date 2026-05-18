'use client'

import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import type { Role } from '@/lib/types'

const roleLabels: Record<Role, string> = {
  admin: 'Admin',
  owner: 'Titolare',
  staff: 'Staff',
}

const roleColors: Record<Role, string> = {
  admin: 'bg-purple-100 text-purple-800',
  owner: 'bg-amber-100 text-amber-800',
  staff: 'bg-slate-100 text-slate-700',
}

export function RoleBadge() {
  const { role } = useAuth()
  return (
    <span className={cn('px-2 py-1 rounded-lg text-xs font-medium', roleColors[role])}>
      {roleLabels[role]}
    </span>
  )
}
