'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { Calendar, LogOut, ChevronLeft, ChevronRight, Store, Maximize2, Minimize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { useAuth } from '@/hooks/useAuth'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { RoleBadge } from './RoleBadge'
import { BakeryDialog } from './BakeryDialog'

const navLinks = [
  { href: '/orders', label: 'Ordini' },
  { href: '/totals', label: 'Totali' },
  { href: '/production', label: 'Produzione' },
  { href: '/product-lists', label: 'Liste' },
]

const ownerLinks = [
  { href: '/manage', label: 'Gestione' },
  { href: '/statistics', label: 'Statistiche' },
]

export function TopNav() {
  const pathname = usePathname()
  const { role, logout, user } = useAuth()
  const { selectedDate, setSelectedDate, workMode, setWorkMode } = useAppStore()
  const [bakeryOpen, setBakeryOpen] = useState(false)

  const allLinks = role === 'owner' ? [...navLinks, ...ownerLinks] : navLinks

  const handlePrevDay = () => {
    const date = new Date(selectedDate + 'T00:00:00')
    date.setDate(date.getDate() - 1)
    setSelectedDate(format(date, 'yyyy-MM-dd'))
  }

  const handleNextDay = () => {
    const date = new Date(selectedDate + 'T00:00:00')
    date.setDate(date.getDate() + 1)
    setSelectedDate(format(date, 'yyyy-MM-dd'))
  }

  return (
    <>
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200">
      <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
        {/* Logo + bakery button */}
        <div className="flex items-center gap-1 shrink-0">
          <Link href="/orders" className="font-bold text-lg text-slate-900">
            Panificio
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-slate-700"
            onClick={() => setBakeryOpen(true)}
            title="Dettagli panetteria"
          >
            <Store className="h-4 w-4" />
          </Button>
        </div>

        {/* Nav links - scrollable on mobile */}
        <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide mx-4">
          {allLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'px-3 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors',
                pathname === link.href
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side: Date picker, role badge, logout */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Date navigation */}
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handlePrevDay}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="h-8 px-2 text-xs font-medium rounded-lg gap-1 w-[7rem] justify-center"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">
                    {format(new Date(selectedDate + 'T00:00:00'), 'EEE d MMM', { locale: it })}
                  </span>
                  <span className="sm:hidden">
                    {format(new Date(selectedDate + 'T00:00:00'), 'd/M', { locale: it })}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  mode="single"
                  selected={new Date(selectedDate + 'T00:00:00')}
                  onSelect={(date) => {
                    if (date) {
                      setSelectedDate(format(date, 'yyyy-MM-dd'))
                    }
                  }}
                  locale={it}
                />
              </PopoverContent>
            </Popover>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleNextDay}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Work mode toggle */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-8 w-8 transition-colors',
              workMode
                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                : 'text-slate-500 hover:text-slate-900'
            )}
            onClick={() => setWorkMode(!workMode)}
            title={workMode ? 'Disattiva modalità lavoro' : 'Attiva modalità lavoro'}
          >
            {workMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>

          {/* Role badge */}
          <RoleBadge />

          {/* Logout */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-500 hover:text-slate-900"
            onClick={logout}
            title="Esci"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>

      <BakeryDialog open={bakeryOpen} onClose={() => setBakeryOpen(false)} />
    </>
  )
}
