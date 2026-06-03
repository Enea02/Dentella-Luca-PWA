import { NextResponse, type NextRequest } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { divisors, products } from '@/lib/db/schema'
import { withAuth, parseJson } from '@/lib/api/handler'
import { notify } from '@/lib/realtime/notify'

const Schema = z.object({ value: z.number().int().positive() })

export const PATCH = withAuth<{ productId: string }>(
  async (req: NextRequest, { params, auth }) => {
    const { productId } = await params
    const { value } = await parseJson(req, Schema)

    // Verify product belongs to this bakery
    const [product] = await db
      .select({ id: products.id })
      .from(products)
      .where(and(eq(products.id, productId), eq(products.bakeryId, auth.bakeryId)))
      .limit(1)
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

    await db
      .insert(divisors)
      .values({ bakeryId: auth.bakeryId, productId, value })
      .onConflictDoUpdate({
        target: [divisors.bakeryId, divisors.productId],
        set: { value },
      })

    await notify(auth.bakeryId, { type: 'divisors.updated' })
    return NextResponse.json({ productId, value })
  },
  { require: 'divisors:write' },
)
