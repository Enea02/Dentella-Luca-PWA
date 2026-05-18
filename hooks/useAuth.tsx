'use client'

import { createContext, useCallback, useContext, type ReactNode } from 'react'
import { signIn, signOut, useSession, SessionProvider } from 'next-auth/react'
import type { Role, User } from '@/lib/types'

interface AuthContextType {
  user: User | null
  role: Role
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

function AuthContextProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()

  const login = useCallback(async (email: string, password: string) => {
    const res = await signIn('credentials', { email, password, redirect: false })
    if (!res || res.error) {
      throw new Error('Credenziali non valide')
    }
  }, [])

  const logout = useCallback(async () => {
    await signOut({ callbackUrl: '/login' })
  }, [])

  const sessionUser = session?.user
  const user: User | null = sessionUser
    ? {
        id: sessionUser.id,
        email: sessionUser.email ?? '',
        role: sessionUser.role,
        bakeryId: sessionUser.bakeryId ?? '',
        bakeryName: sessionUser.bakeryName ?? '',
        permissions: sessionUser.permissions,
      }
    : null

  const value: AuthContextType = {
    user,
    role: user?.role ?? 'staff',
    isLoading: status === 'loading',
    isAuthenticated: !!user,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AuthContextProvider>{children}</AuthContextProvider>
    </SessionProvider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
