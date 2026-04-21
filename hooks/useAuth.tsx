'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import useSWR from 'swr'
import { authApi } from '@/lib/api'
import { useAppStore } from '@/lib/store'
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loginError, setLoginError] = useState<string | null>(null)
  const demoRole = useAppStore(state => state.demoRole)

  const { data: user, isLoading, mutate } = useSWR<User | null>(
    'auth-user',
    async () => {
      try {
        return await authApi.me()
      } catch {
        return null
      }
    },
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    }
  )

  const login = useCallback(async (email: string, password: string) => {
    setLoginError(null)
    try {
      const loggedUser = await authApi.login(email, password)
      await mutate(loggedUser, false)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed'
      setLoginError(message)
      throw error
    }
  }, [mutate])

  const logout = useCallback(async () => {
    await authApi.logout()
    await mutate(null, false)
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }, [mutate])

  // Effective role: demo override or actual user role
  const role: Role = demoRole || user?.role || 'staff'

  const value: AuthContextType = {
    user: user ?? null,
    role,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
  }

  // Clear login error when user logs in successfully
  useEffect(() => {
    if (user) setLoginError(null)
  }, [user])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
