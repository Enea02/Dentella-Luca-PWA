import { NextResponse, type NextRequest } from 'next/server'
import { and, asc, eq, inArray, isNotNull, ne, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/lib/db/client'
import { customers, panettoneFlavors, panettoneOrderItems, panettoneOrders } from '@/lib/db/schema'
import { withAuth, parseJson } from '@/lib/api/handler'
import { notify } from '@/lib/realtime/notify'
import { syncStatusWithItems } from '@/lib/panettoni/server'
import { seasonForDate, type PanettoniForCustomer } from '@/lib/panettoni/types'
import { IsoDate, customerBelongsTo, flavorsBelongTo } from '@/lib/panettoni/validation'

// Panettoni of customers LINKED to the gestionale, for one delivery day: shown
// inside that customer's order in Ordini. Kept out of GET /api/orders on
// purpose, so Totali / Produzione / Foglio / Statistiche never count them.
// "Entro il" orders show on their deadline day.
export const GET = withAuth(
  async (req: NextRequest, { auth }) => {
    const date = IsoDate.parse(req.nextUrl.searchParams.get('date'))
    const orders = await db
      .select({
        orderId: panettoneOrders.id,
        customerId: panettoneOrders.customerId,
        customerName: customers.name,
        deliveryKind: panettoneOrders.deliveryKind,
        status: panettoneOrders.status,
      })
      .from(panettoneOrders)
      .innerJoin(customers, eq(customers.id, panettoneOrders.customerId))
      .where(
        and(
          eq(panettoneOrders.bakeryId, auth.bakeryId),
          isNotNull(panettoneOrders.customerId),
          eq(panettoneOrders.deliveryDate, date),
        ),
      )
      .orderBy(asc(panettoneOrders.createdAt))
    if (orders.length === 0) return NextResponse.json([])

    const items = await db
      .select({
        orderId: panettoneOrderItems.orderId,
        flavorId: panettoneOrderItems.flavorId,
        name: panettoneFlavors.name,
        color: panettoneFlavors.color,
        qty: panettoneOrderItems.qty,
        state: panettoneOrderItems.state,
      })
      .from(panettoneOrderItems)
      .innerJoin(panettoneFlavors, eq(panettoneFlavors.id, panettoneOrderItems.flavorId))
      .where(inArray(panettoneOrderItems.orderId, orders.map((o) => o.orderId)))
      .orderBy(asc(panettoneFlavors.sortOrder))

    const result: PanettoniForCustomer[] = orders.map((o) => ({
      orderId: o.orderId,
      customerId: o.customerId!,
      customerName: o.customerName, // current name in the gestionale
      deliveryKind: o.deliveryKind,
      status: o.status,
      items: items.filter((i) => i.orderId === o.orderId).map(({ orderId: _o, ...i }) => i),
    }))
    return NextResponse.json(result)
  },
  { require: 'orders:read' },
)

// "Aggiungi panettone" from a customer's day in Ordini: adds the flavor to that
// customer's open panettoni order for that day, creating it if needed — so it
// shows up in the Panettoni table too. Adding to a flavor already there sums
// the pieces (and the new pieces are still "da fare").
const AddSchema = z.object({
  customerId: z.string().uuid(),
  date: IsoDate,
  flavorId: z.string().uuid(),
  qty: z.number().int().min(1).max(10_000),
})

export const POST = withAuth(
  async (req: NextRequest, { auth }) => {
    const { customerId, date, flavorId, qty } = await parseJson(req, AddSchema)
    if (!(await flavorsBelongTo(auth.bakeryId, [flavorId]))) {
      return NextResponse.json({ error: 'Gusto non valido' }, { status: 400 })
    }
    if (!(await customerBelongsTo(auth.bakeryId, customerId))) {
      return NextResponse.json({ error: 'Cliente non valido' }, { status: 400 })
    }

    const orderId = await db.transaction(async (tx) => {
      const [open] = await tx
        .select({ id: panettoneOrders.id })
        .from(panettoneOrders)
        .where(
          and(
            eq(panettoneOrders.bakeryId, auth.bakeryId),
            eq(panettoneOrders.customerId, customerId),
            eq(panettoneOrders.deliveryDate, date),
            ne(panettoneOrders.status, 'done'),
          ),
        )
        .orderBy(asc(panettoneOrders.createdAt))
        .limit(1)

      let id = open?.id
      if (id) {
        await tx.update(panettoneOrders).set({ updatedAt: new Date() }).where(eq(panettoneOrders.id, id))
      } else {
        const [customer] = await tx.select({ name: customers.name }).from(customers).where(eq(customers.id, customerId))
        const [created] = await tx
          .insert(panettoneOrders)
          .values({
            bakeryId: auth.bakeryId,
            season: seasonForDate(date),
            customerId,
            customerName: customer.name,
            deliveryKind: 'preciso',
            deliveryDate: date,
          })
          .returning({ id: panettoneOrders.id })
        id = created.id
      }

      await tx
        .insert(panettoneOrderItems)
        .values({ orderId: id, flavorId, qty })
        .onConflictDoUpdate({
          target: [panettoneOrderItems.orderId, panettoneOrderItems.flavorId],
          set: { qty: sql`${panettoneOrderItems.qty} + ${qty}`, state: 'todo' },
        })
      await syncStatusWithItems(tx, id)
      return id
    })

    await notify(auth.bakeryId, { type: 'panettoni.updated' })
    return NextResponse.json({ orderId }, { status: 201 })
  },
  { require: 'orders:edit' },
)
