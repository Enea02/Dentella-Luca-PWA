import { NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { panettoneOrders } from '@/lib/db/schema'
import { withAuth } from '@/lib/api/handler'
import { currentSeason } from '@/lib/panettoni/types'

// Campaigns that have orders (newest first), always including the current one.
// Feeds the season picker of the archive.
export const GET = withAuth(
  async (_req, { auth }) => {
    const rows = await db
      .selectDistinct({ season: panettoneOrders.season })
      .from(panettoneOrders)
      .where(eq(panettoneOrders.bakeryId, auth.bakeryId))
      .orderBy(desc(panettoneOrders.season))
    const seasons = new Set([currentSeason(), ...rows.map((r) => r.season)])
    return NextResponse.json([...seasons].sort((a, b) => b - a))
  },
  { require: 'orders:read' },
)
