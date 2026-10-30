import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/handler'
import { ensureFlavors } from '@/lib/panettoni/server'

export const GET = withAuth(
  async (_req, { auth }) => NextResponse.json(await ensureFlavors(auth.bakeryId)),
  { require: 'orders:read' },
)
