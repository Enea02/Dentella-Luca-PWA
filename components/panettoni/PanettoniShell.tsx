'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { Calendar, ChevronLeft, Plus, User } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { usePanettoneOrders } from '@/hooks/usePanettoni'
import { can } from '@/lib/auth/permissions'
import { currentSeason } from '@/lib/panettoni/types'
import { cn } from '@/lib/utils'
import type { Role } from '@/lib/types'
import { NewOrderDialog } from './NewOrderDialog'

const TABS = [
  { href: '/panettoni/tabella', label: 'Tabella ordini' },
  { href: '/panettoni/totali', label: 'Totali per gusto' },
  { href: '/panettoni/produzione', label: 'Produzione' },
  { href: '/panettoni/pianificazione', label: 'Pianificazione' },
  { href: '/panettoni/archivio', label: 'Archivio' },
]

const roleLabels: Record<Role, string> = { admin: 'Admin', owner: 'Titolare', staff: 'Staff' }

export function PanettoniShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, role } = useAuth()
  const season = currentSeason()
  const { orders } = usePanettoneOrders(season)
  const [dialogOpen, setDialogOpen] = useState(false)

  const archived = orders.filter((o) => o.status === 'done').length

  // Tabs navigate with `replace`, so "back" leaves the section instead of
  // stepping through the tabs. Opened directly (no history) → Ordini.
  const goBack = () => {
    if (window.history.length > 1) router.back()
    else router.push('/orders')
  }

  return (
    <div className="min-h-dvh bg-slate-50">
      <header className="sticky top-0 z-50 bg-slate-900 text-white pt-[env(safe-area-inset-top)]">
        <div className="flex items-center justify-between gap-2 px-4 py-2.5 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={goBack}
              aria-label="Torna al gestionale"
              className="h-10 w-10 shrink-0 inline-flex items-center justify-center rounded-xl bg-white/8 hover:bg-white/18 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <div className="font-bold text-lg leading-tight">Panettoni</div>
              <div className="text-[11px] text-slate-400">Campagna Natale {season}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/8 text-xs font-medium text-slate-200">
              <Calendar className="h-3.5 w-3.5" />
              {format(new Date(), 'EEE d MMM', { locale: it })}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/15 bg-white/8 text-[11px] font-semibold text-slate-200">
              <User className="h-3 w-3" />
              {roleLabels[role]}
            </span>
            {can(user, 'orders:edit') && (
              <button
                type="button"
                onClick={() => setDialogOpen(true)}
                className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 text-sm font-bold transition-colors"
              >
                <Plus className="h-[18px] w-[18px]" strokeWidth={2.5} />
                <span className="hidden min-[380px]:inline">Aggiungi cliente</span>
              </button>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-3">
          <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide pb-2">
            {TABS.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                replace
                className={cn(
                  'shrink-0 px-3.5 py-2 rounded-[10px] text-[13px] font-semibold whitespace-nowrap transition-colors',
                  pathname === t.href ? 'bg-white text-slate-900' : 'bg-white/8 text-slate-300 hover:bg-white/15',
                )}
              >
                {t.href === '/panettoni/archivio' ? `${t.label} (${archived})` : t.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pt-4 pb-24">{children}</main>

      {can(user, 'orders:edit') && (
        <NewOrderDialog open={dialogOpen} onOpenChange={setDialogOpen} season={season} />
      )}
    </div>
  )
}
