'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { Calendar, LogOut, ChevronLeft, ChevronRight, Store, Maximize2, Minimize2, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet'
import { useAuth } from '@/hooks/useAuth'
import { useAppStore } from '@/lib/store'
import { can } from '@/lib/auth/permissions'
import { cn } from '@/lib/utils'
import { RoleBadge } from './RoleBadge'
import { BakeryDialog } from './BakeryDialog'

const navLinks = [
  { href: '/orders', label: 'Ordini' },
  { href: '/totals', label: 'Totali' },
  { href: '/production', label: 'Produzione' },
  { href: '/product-lists', label: 'Liste' },
]

export function TopNav() {
  const pathname = usePathname()
  const { logout, user } = useAuth()
  const { selectedDate, setSelectedDate, workMode, setWorkMode } = useAppStore()
  const [bakeryOpen, setBakeryOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const canManage =
    can(user, 'customers:write') || can(user, 'products:write') || can(user, 'permissions:manage')
  const canStats = can(user, 'statistics:view')

  const allLinks = [
    ...navLinks,
    ...(canManage ? [{ href: '/manage', label: 'Gestione' }] : []),
    ...(canStats ? [{ href: '/statistics', label: 'Statistiche' }] : []),
  ]

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
      <div className="flex items-center justify-between gap-2 px-3 py-2 md:px-4 md:py-3 max-w-7xl mx-auto">
        {/* Mobile: hamburger + logo */}
        <div className="flex items-center gap-1 shrink-0">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 md:hidden text-slate-700"
                aria-label="Apri menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" aria-describedby={undefined} className="w-72 p-0">
              <SheetHeader className="border-b border-slate-100">
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 p-3">
                {allLinks.map((link) => (
                  <SheetClose asChild key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        'px-4 py-3 rounded-xl text-base font-medium transition-colors',
                        pathname === link.href
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-700 hover:bg-slate-100'
                      )}
                    >
                      {link.label}
                    </Link>
                  </SheetClose>
                ))}
              </nav>
              <div className="mt-auto border-t border-slate-100 p-3 flex items-center justify-between">
                <RoleBadge />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 gap-2 text-slate-600"
                  onClick={() => { setMobileMenuOpen(false); logout() }}
                >
                  <LogOut className="h-4 w-4" />
                  Esci
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          <Link href="/orders" className="font-bold text-lg text-slate-900">
            Panificio
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 md:h-8 md:w-8 text-slate-400 hover:text-slate-700"
            onClick={() => setBakeryOpen(true)}
            title="Dettagli panetteria"
          >
            <Store className="h-4 w-4" />
          </Button>
        </div>

        {/* Nav links - desktop only */}
        <nav className="hidden md:flex items-center gap-1 overflow-x-auto scrollbar-hide mx-4">
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
        <div className="flex items-center gap-1 md:gap-2 shrink-0">
          {/* Date navigation */}
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 md:h-8 md:w-8"
              onClick={handlePrevDay}
              aria-label="Giorno precedente"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="h-10 md:h-8 px-2 text-xs font-medium rounded-lg gap-1 w-[5.5rem] md:w-[7rem] justify-center"
                >
                  <Calendar className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">
                    {format(new Date(selectedDate + 'T00:00:00'), 'EEE d MMM', { locale: it })}
                  </span>
                  <span className="md:hidden">
                    {format(new Date(selectedDate + 'T00:00:00'), 'EEE d/M', { locale: it })}
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
              className="h-10 w-10 md:h-8 md:w-8"
              onClick={handleNextDay}
              aria-label="Giorno successivo"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Work mode toggle */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-10 w-10 md:h-8 md:w-8 transition-colors',
              workMode
                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                : 'text-slate-500 hover:text-slate-900'
            )}
            onClick={() => setWorkMode(!workMode)}
            title={workMode ? 'Disattiva modalità lavoro' : 'Attiva modalità lavoro'}
          >
            {workMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>

          {/* Role badge - desktop only (mobile shows it in the menu sheet) */}
          <div className="hidden md:inline-flex">
            <RoleBadge />
          </div>

          {/* Logout - desktop only (mobile uses sheet) */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:inline-flex h-8 w-8 text-slate-500 hover:text-slate-900"
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
