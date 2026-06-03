'use client'

import { AuthProvider } from '@/hooks/useAuth'
import { SWRProvider } from '@/lib/swr-provider'
import { AppShell } from '@/components/layout/AppShell'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <SWRProvider>
        <AppShell>
          {children}
        </AppShell>
      </SWRProvider>
    </AuthProvider>
  )
}
