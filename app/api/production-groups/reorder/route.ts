import { NextResponse, type NextRequest } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { productionGroups } from '@/lib/db/schema'
import { withAuth, parseJson } from '@/lib/api/handler'

const Schema = z.object({ orderedIds: z.array(z.string().uuid()).min(1) })

export const POST = withAuth(
  async (req: NextRequest, { auth }) => {
    const { orderedIds } = await parseJson(req, Schema)
    await db.transaction(async (tx) => {
      for (let i = 0; i < orderedIds.length; i++) {
        await tx
          .update(productionGroups)
          .set({ order: i })
          .where(
            and(eq(productionGroups.id, orderedIds[i]), eq(productionGroups.bakeryId, auth.bakeryId)),
          )
      }
    })
    return new NextResponse(null, { status: 204 })
  },
  { require: 'production-groups:write' },
)
