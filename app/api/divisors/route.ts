import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { divisors } from '@/lib/db/schema'
import { withAuth } from '@/lib/api/handler'

export const GET = withAuth(async (_req, { auth }) => {
  const rows = await db
    .select({ productId: divisors.productId, value: divisors.value })
    .from(divisors)
    .where(eq(divisors.bakeryId, auth.bakeryId))
  return NextResponse.json(rows)
})
