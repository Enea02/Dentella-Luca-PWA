'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { Calendar, LogOut, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { useAuth } from '@/hooks/useAuth'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { RoleBadge } from './RoleBadge'

const navLinks = [
  { href: '/orders', label: 'Ordini' },
  { href: '/totals', label: 'Totali' },
  { href: '/production', label: 'Produzione' },
  { href: '/product-lists', label: 'Liste' },
]

const ownerLinks = [
  { href: '/manage', label: 'Gestione' },
]

export function TopNav() {
  const pathname = usePathname()
  const { role, logout, user } = useAuth()
  const { selectedDate, setSelectedDate } = useAppStore()

  const allLinks = role === 'owner' ? [...navLinks, ...ownerLinks] : navLinks

  const handlePrevDay = () => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() - 1)
    setSelectedDate(date.toISOString().split('T')[0])
  }

  const handleNextDay = () => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() + 1)
    setSelectedDate(date.toISOString().split('T')[0])
  }

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200">
      <div className="flex items-center justify-between px-4 py-3 max-w-7xl mx-auto">
        {/* Logo */}
        <Link href="/orders" className="font-bold text-lg text-slate-900 shrink-0">
          Panificio
        </Link>

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
                  className="h-8 px-2 text-xs font-medium rounded-lg gap-1"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">
                    {format(new Date(selectedDate), 'EEE d MMM', { locale: it })}
                  </span>
                  <span className="sm:hidden">
                    {format(new Date(selectedDate), 'd/M', { locale: it })}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  mode="single"
                  selected={new Date(selectedDate)}
                  onSelect={(date) => {
                    if (date) {
                      setSelectedDate(date.toISOString().split('T')[0])
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
  )
}
