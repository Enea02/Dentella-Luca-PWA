import NextAuth from 'next-auth'
import { NextResponse } from 'next/server'
import { authConfig } from './auth.config'

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  // Root → /orders. Auth.js handles the rest (login redirect / protected routes).
  if (req.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/orders', req.nextUrl))
  }
})

export const config = {
  matcher: [
    '/',
    '/login',
    '/orders/:path*',
    '/totals/:path*',
    '/production/:path*',
    '/product-lists/:path*',
    '/manage/:path*',
    '/statistics/:path*',
  ],
}
