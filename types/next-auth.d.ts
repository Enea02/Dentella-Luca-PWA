import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface User {
    id: string
    role: 'admin' | 'owner' | 'staff'
    bakeryId?: string
    bakeryName?: string
    permissions?: Record<string, boolean>
    mustChangePassword?: boolean
  }

  interface Session {
    user: {
      id: string
      role: 'admin' | 'owner' | 'staff'
      bakeryId?: string
      bakeryName?: string
      permissions?: Record<string, boolean>
      mustChangePassword?: boolean
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    role?: 'admin' | 'owner' | 'staff'
    bakeryId?: string
    bakeryName?: string
    permissions?: Record<string, boolean>
    mustChangePassword?: boolean
  }
}

export {}
