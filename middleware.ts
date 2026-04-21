import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that require authentication
const protectedRoutes = ['/orders', '/totals', '/production', '/product-lists', '/manage']
// Routes that should redirect to app if already logged in
const authRoutes = ['/login']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check for auth cookie (in production, this would be a session cookie)
  // For mock mode, we simulate always being logged in
  const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true'
  const hasAuthCookie = request.cookies.has('auth-session') || useMock

  // Redirect unauthenticated users from protected routes to login
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!hasAuthCookie) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Redirect authenticated users from auth routes to app
  if (authRoutes.some(route => pathname.startsWith(route))) {
    if (hasAuthCookie) {
      return NextResponse.redirect(new URL('/orders', request.url))
    }
  }

  // Redirect root to orders
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/orders', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/orders/:path*',
    '/totals/:path*',
    '/production/:path*',
    '/product-lists/:path*',
    '/manage/:path*',
  ],
}
