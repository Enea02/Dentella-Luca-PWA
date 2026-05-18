import type { NextAuthConfig } from 'next-auth'

const PROTECTED_PREFIXES = ['/orders', '/totals', '/production', '/product-lists', '/manage', '/statistics']

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  session: { strategy: 'jwt' },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isProtected = PROTECTED_PREFIXES.some((p) => nextUrl.pathname.startsWith(p))

      if (isProtected) {
        if (isLoggedIn) return true
        const callbackUrl = encodeURIComponent(nextUrl.pathname + nextUrl.search)
        return Response.redirect(new URL(`/login?redirect=${callbackUrl}`, nextUrl))
      }

      // Redirect authenticated users away from /login
      if (nextUrl.pathname === '/login' && isLoggedIn) {
        return Response.redirect(new URL('/orders', nextUrl))
      }

      return true
    },
    async jwt({ token, user }) {
      if (user) {
        const u = user as {
          id?: string
          role?: 'admin' | 'owner' | 'staff'
          bakeryId?: string
          bakeryName?: string
          permissions?: Record<string, boolean>
        }
        token.id = u.id
        token.role = u.role ?? 'staff'
        token.bakeryId = u.bakeryId
        token.bakeryName = u.bakeryName
        token.permissions = u.permissions
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = (token.role as 'admin' | 'owner' | 'staff') ?? 'staff'
        session.user.bakeryId = token.bakeryId as string | undefined
        session.user.bakeryName = token.bakeryName as string | undefined
        session.user.permissions = token.permissions as Record<string, boolean> | undefined
      }
      return session
    },
  },
  providers: [], // populated in auth.ts (Node-only Credentials provider)
} satisfies NextAuthConfig
