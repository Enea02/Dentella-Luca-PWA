import { NextResponse, type NextRequest } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { panettoneFlavors } from '@/lib/db/schema'
import { withAuth, parseJson } from '@/lib/api/handler'
import { notify } from '@/lib/realtime/notify'

// Column order of the orders table (and of every flavor list).
const Schema = z.object({ orderedIds: z.array(z.string().uuid()).min(1) })

export const POST = withAuth(
  async (req: NextRequest, { auth }) => {
    const { orderedIds } = await parseJson(req, Schema)

    await db.transaction(async (tx) => {
      for (let i = 0; i < orderedIds.length; i++) {
        await tx
          .update(panettoneFlavors)
          .set({ sortOrder: i })
          .where(and(eq(panettoneFlavors.id, orderedIds[i]), eq(panettoneFlavors.bakeryId, auth.bakeryId)))
      }
    })

    await notify(auth.bakeryId, { type: 'panettoni.updated' })
    return new NextResponse(null, { status: 204 })
  },
  { require: 'orders:edit' },
)
