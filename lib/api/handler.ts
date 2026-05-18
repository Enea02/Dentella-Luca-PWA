import { NextResponse, type NextRequest } from 'next/server'
import { ZodError, type ZodType } from 'zod'
import { auth } from '@/auth'
import { can, type PermissionKey } from '@/lib/auth/permissions'
import type { Role } from '@/lib/types'

export interface AuthContext {
  userId: string
  bakeryId: string
  role: Role
  permissions?: Record<string, boolean>
}

type RouteHandler<P> = (
  req: NextRequest,
  ctx: { params: Promise<P>; auth: AuthContext },
) => Promise<Response> | Response

interface WithAuthOptions {
  require?: PermissionKey
}

export function withAuth<P = Record<string, string>>(
  handler: RouteHandler<P>,
  { require }: WithAuthOptions = {},
) {
  return async (req: NextRequest, ctx: { params: Promise<P> }) => {
    try {
      const session = await auth()
      const user = session?.user
      if (!user?.id || !user.bakeryId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      if (require && !can({ role: user.role, permissions: user.permissions }, require)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      return await handler(req, {
        params: ctx.params,
        auth: {
          userId: user.id,
          bakeryId: user.bakeryId,
          role: user.role,
          permissions: user.permissions,
        },
      })
    } catch (err) {
      if (err instanceof ZodError) {
        return NextResponse.json(
          { error: 'Validation failed', issues: err.issues },
          { status: 400 },
        )
      }
      console.error('[api] unhandled error:', err)
      return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
  }
}

export async function parseJson<T>(req: NextRequest, schema: ZodType<T>): Promise<T> {
  const body = await req.json()
  return schema.parse(body)
}
