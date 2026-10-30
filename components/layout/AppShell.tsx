'use client'

import { usePathname } from 'next/navigation'
import { TopNav } from './TopNav'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'
import { useBusinessDay } from '@/hooks/useBusinessDay'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  useRealtimeSync()
  useBusinessDay()
  const pathname = usePathname()
  // The seasonal Panettoni section has its own full-width dark header
  // (app/(app)/panettoni/layout.tsx) in place of the TopNav.
  if (pathname?.startsWith('/panettoni')) return <>{children}</>
  return (
    <div className="min-h-dvh bg-slate-100">
      <TopNav />
      <main className="max-w-7xl mx-auto px-3 py-4 md:px-4 md:py-6">
        {children}
      </main>
    </div>
  )
}
