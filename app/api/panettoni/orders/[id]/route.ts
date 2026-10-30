import { NextResponse, type NextRequest } from 'next/server'
import { and, eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { panettoneOrders } from '@/lib/db/schema'
import { withAuth, parseJson } from '@/lib/api/handler'
import { notify } from '@/lib/realtime/notify'
import { loadOrders } from '@/lib/panettoni/server'
import { OrderFieldsSchema } from '@/lib/panettoni/validation'

const UpdateSchema = OrderFieldsSchema.partial()

export const PATCH = withAuth<{ id: string }>(
  async (req: NextRequest, { params, auth }) => {
    const { id } = await params
    const { deposit, ...fields } = await parseJson(req, UpdateSchema)
    // Only delivery changes move the order in the plan (see updatedAt in schema).
    const affectsPlan = fields.deliveryKind !== undefined || fields.deliveryDate !== undefined
    const updated = await db
      .update(panettoneOrders)
      .set({
        ...fields,
        ...(deposit !== undefined && { deposit: deposit === null ? null : String(deposit) }),
        ...(affectsPlan && { updatedAt: new Date() }),
      })
      .where(and(eq(panettoneOrders.id, id), eq(panettoneOrders.bakeryId, auth.bakeryId)))
      .returning({ id: panettoneOrders.id })
    if (updated.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await notify(auth.bakeryId, { type: 'panettoni.updated' })
    const [order] = await loadOrders(auth.bakeryId, { orderId: id })
    return NextResponse.json(order)
  },
  { require: 'orders:edit' },
)

export const DELETE = withAuth<{ id: string }>(
  async (_req, { params, auth }) => {
    const { id } = await params
    const deleted = await db
      .delete(panettoneOrders)
      .where(and(eq(panettoneOrders.id, id), eq(panettoneOrders.bakeryId, auth.bakeryId)))
      .returning({ id: panettoneOrders.id })
    if (deleted.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await notify(auth.bakeryId, { type: 'panettoni.updated' })
    return new NextResponse(null, { status: 204 })
  },
  { require: 'orders:edit' },
)
