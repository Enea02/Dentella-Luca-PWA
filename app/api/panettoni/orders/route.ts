import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { panettoneOrderItems, panettoneOrders } from '@/lib/db/schema'
import { withAuth, parseJson } from '@/lib/api/handler'
import { notify } from '@/lib/realtime/notify'
import { loadOrders } from '@/lib/panettoni/server'
import { OrderFieldsSchema, flavorsBelongTo, seasonParam } from '@/lib/panettoni/validation'

export const GET = withAuth(
  async (req: NextRequest, { auth }) => {
    const season = seasonParam(req.url)
    return NextResponse.json(await loadOrders(auth.bakeryId, { season }))
  },
  { require: 'orders:read' },
)

const CreateSchema = OrderFieldsSchema.extend({
  // Defaults to the year of the delivery date.
  season: z.number().int().min(2000).max(2100).optional(),
  items: z
    .array(z.object({ flavorId: z.string().uuid(), qty: z.number().int().min(1).max(10_000) }))
    .min(1),
})

export const POST = withAuth(
  async (req: NextRequest, { auth }) => {
    const { items, season, ...fields } = await parseJson(req, CreateSchema)
    if (!(await flavorsBelongTo(auth.bakeryId, items.map((i) => i.flavorId)))) {
      return NextResponse.json({ error: 'Gusto non valido' }, { status: 400 })
    }

    // Same flavor twice in the payload → one row with the summed quantity.
    const merged = new Map<string, number>()
    for (const i of items) merged.set(i.flavorId, (merged.get(i.flavorId) ?? 0) + i.qty)

    const id = await db.transaction(async (tx) => {
      const [order] = await tx
        .insert(panettoneOrders)
        .values({
          bakeryId: auth.bakeryId,
          season: season ?? Number(fields.deliveryDate.slice(0, 4)),
          ...fields,
          deposit: fields.deposit === null ? null : String(fields.deposit),
        })
        .returning({ id: panettoneOrders.id })
      await tx
        .insert(panettoneOrderItems)
        .values([...merged].map(([flavorId, qty]) => ({ orderId: order.id, flavorId, qty })))
      return order.id
    })

    await notify(auth.bakeryId, { type: 'panettoni.updated' })
    const [created] = await loadOrders(auth.bakeryId, { orderId: id })
    return NextResponse.json(created, { status: 201 })
  },
  { require: 'orders:edit' },
)
