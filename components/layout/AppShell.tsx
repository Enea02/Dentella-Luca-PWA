'use client'

import { TopNav } from './TopNav'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  useRealtimeSync()
  return (
    <div className="min-h-screen bg-slate-100">
      <TopNav />
      <main className="max-w-7xl mx-auto px-3 py-4 md:px-4 md:py-6">
        {children}
      </main>
    </div>
  )
}
