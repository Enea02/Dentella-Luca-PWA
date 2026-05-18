import './load-env'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { count, eq } from 'drizzle-orm'
import readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import {
  bakeries,
  customers,
  dailyItemStatus,
  dailyOrderItems,
  dailyOrders,
  divisors,
  productionGroupSections,
  productionGroups,
  products,
  recurringOrderItems,
  recurringOrders,
  sections,
} from '../lib/db/schema'

// ─── Seeded PRNG for reproducibility ──────────────────────────────────────
function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(42)
const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)]
const chance = (p: number) => rand() < p

// ─── Date helpers ─────────────────────────────────────────────────────────
function isoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
function dayOfWeek(d: Date): number {
  const day = d.getDay()
  return day === 0 ? 7 : day
}
function addDays(base: Date, n: number): Date {
  const d = new Date(base)
  d.setDate(d.getDate() + n)
  return d
}

const TODAY = new Date()
TODAY.setHours(0, 0, 0, 0)
const DAYS_BACK = 30
const DAYS_FORWARD = 7

// ─── Mock data (recovered from old lib/mockData.ts) ───────────────────────

const SECTION_DEFS = [
  { name: 'Dolci', color: 'bg-amber-100 text-amber-800' },
  { name: 'Pane comune', color: 'bg-orange-100 text-orange-800' },
  { name: 'Salati', color: 'bg-red-100 text-red-800' },
  { name: 'Pizze farcite', color: 'bg-rose-100 text-rose-800' },
  { name: 'Focacce farcite', color: 'bg-pink-100 text-pink-800' },
  { name: 'Specialità', color: 'bg-emerald-100 text-emerald-800' },
]

interface SeedProduct {
  mockId: string
  name: string
  section: string
  unit: 'pieces' | 'kg'
  piecesPerKg?: number
}

const PRODUCTS: SeedProduct[] = [
  // Dolci
  { mockId: 'p1', name: 'Cornetto vuoto', section: 'Dolci', unit: 'pieces' },
  { mockId: 'p2', name: 'Cornetto cioccolato', section: 'Dolci', unit: 'pieces' },
  { mockId: 'p3', name: 'Cornetto crema', section: 'Dolci', unit: 'pieces' },
  { mockId: 'p4', name: 'Cornetto albicocca', section: 'Dolci', unit: 'pieces' },
  { mockId: 'p5', name: 'Veneziana', section: 'Dolci', unit: 'pieces' },
  { mockId: 'p6', name: 'Bombolone', section: 'Dolci', unit: 'pieces' },
  { mockId: 'p7', name: 'Sfogliatella', section: 'Dolci', unit: 'pieces' },
  // Pane comune
  { mockId: 'p8', name: 'Filone', section: 'Pane comune', unit: 'pieces' },
  { mockId: 'p9', name: 'Pagnotta', section: 'Pane comune', unit: 'kg', piecesPerKg: 4 },
  { mockId: 'p10', name: 'Rosetta', section: 'Pane comune', unit: 'pieces' },
  { mockId: 'p11', name: 'Ciabatta', section: 'Pane comune', unit: 'pieces' },
  // Salati
  { mockId: 'p12', name: 'Pizza bianca', section: 'Salati', unit: 'pieces' },
  { mockId: 'p13', name: 'Pizza rossa', section: 'Salati', unit: 'pieces' },
  { mockId: 'p14', name: 'Focaccia semplice', section: 'Salati', unit: 'pieces' },
  { mockId: 'p15', name: 'Pala romana', section: 'Salati', unit: 'pieces' },
  // Pizze farcite
  { mockId: 'p16', name: 'Pizza prosciutto', section: 'Pizze farcite', unit: 'pieces' },
  { mockId: 'p17', name: 'Pizza tonno', section: 'Pizze farcite', unit: 'pieces' },
  { mockId: 'p18', name: 'Pizza vegetariana', section: 'Pizze farcite', unit: 'pieces' },
  // Focacce farcite
  { mockId: 'p19', name: 'Focaccia mortadella', section: 'Focacce farcite', unit: 'pieces' },
  { mockId: 'p20', name: 'Focaccia prosciutto crudo', section: 'Focacce farcite', unit: 'pieces' },
  { mockId: 'p21', name: 'Focaccia porchetta', section: 'Focacce farcite', unit: 'pieces' },
  // Specialità
  { mockId: 'p22', name: 'Torta della nonna', section: 'Specialità', unit: 'pieces' },
  { mockId: 'p23', name: 'Crostata frutta', section: 'Specialità', unit: 'pieces' },
  { mockId: 'p24', name: 'Tiramisù', section: 'Specialità', unit: 'kg', piecesPerKg: 8 },
]

interface SeedCustomer {
  mockId: string
  name: string
  type: 'fixed' | 'single'
}

const CUSTOMERS: SeedCustomer[] = [
  { mockId: 'c1', name: 'Bar Roma', type: 'fixed' },
  { mockId: 'c2', name: 'Ristorante Da Luigi', type: 'fixed' },
  { mockId: 'c3', name: 'Hotel Centrale', type: 'fixed' },
  { mockId: 'c4', name: 'Caffè Italia', type: 'fixed' },
  { mockId: 'c5', name: 'Cliente Giornaliero 1', type: 'single' },
  { mockId: 'c6', name: 'Cliente Giornaliero 2', type: 'single' },
  { mockId: 'c7', name: 'Pasticceria Dolce Vita', type: 'fixed' },
]

interface SeedRecurringItem {
  productId: string
  quantity: number
  unit: 'pieces' | 'kg'
}

interface SeedRecurring {
  customerMockId: string
  weekdays: number[]
  items: SeedRecurringItem[]
}

const RECURRING: SeedRecurring[] = [
  {
    customerMockId: 'c1',
    weekdays: [1, 2, 3, 4, 5, 6],
    items: [
      { productId: 'p1', quantity: 10, unit: 'pieces' },
      { productId: 'p2', quantity: 8, unit: 'pieces' },
      { productId: 'p5', quantity: 6, unit: 'pieces' },
      { productId: 'p12', quantity: 4, unit: 'pieces' },
    ],
  },
  {
    customerMockId: 'c2',
    weekdays: [1, 2, 3, 4, 5, 6, 7],
    items: [
      { productId: 'p8', quantity: 5, unit: 'pieces' },
      { productId: 'p9', quantity: 2, unit: 'kg' },
      { productId: 'p14', quantity: 10, unit: 'pieces' },
      { productId: 'p19', quantity: 6, unit: 'pieces' },
    ],
  },
  {
    customerMockId: 'c3',
    weekdays: [1, 2, 3, 4, 5],
    items: [
      { productId: 'p1', quantity: 20, unit: 'pieces' },
      { productId: 'p3', quantity: 15, unit: 'pieces' },
      { productId: 'p6', quantity: 12, unit: 'pieces' },
      { productId: 'p22', quantity: 2, unit: 'pieces' },
    ],
  },
  {
    customerMockId: 'c4',
    weekdays: [1, 2, 3, 4, 5, 6],
    items: [
      { productId: 'p1', quantity: 8, unit: 'pieces' },
      { productId: 'p4', quantity: 6, unit: 'pieces' },
      { productId: 'p7', quantity: 4, unit: 'pieces' },
    ],
  },
  {
    customerMockId: 'c7',
    weekdays: [2, 4, 6],
    items: [
      { productId: 'p24', quantity: 1.5, unit: 'kg' },
      { productId: 'p23', quantity: 3, unit: 'pieces' },
    ],
  },
]

const DIVISORS: { productMockId: string; value: number }[] = [
  { productMockId: 'p1', value: 6 },
  { productMockId: 'p2', value: 6 },
  { productMockId: 'p3', value: 6 },
  { productMockId: 'p4', value: 6 },
  { productMockId: 'p5', value: 4 },
  { productMockId: 'p6', value: 4 },
  { productMockId: 'p12', value: 1 },
  { productMockId: 'p13', value: 1 },
  { productMockId: 'p14', value: 1 },
]

const PRODUCTION_GROUPS: { name: string; sectionNames: string[] }[] = [
  { name: 'Dolci', sectionNames: ['Dolci', 'Specialità'] },
  { name: 'Pane', sectionNames: ['Pane comune'] },
  { name: 'Salati', sectionNames: ['Salati', 'Pizze farcite', 'Focacce farcite'] },
]

const PIZZA_VARIANTS = ['extra prosciutto', 'senza olive', 'più mozzarella', 'piccante', 'senza acciughe']

// ─── Bakery resolution ────────────────────────────────────────────────────

interface CliOptions {
  bakerySlug?: string
  force: boolean
}

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = { force: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--bakery') opts.bakerySlug = argv[++i]
    else if (a === '--force') opts.force = true
  }
  return opts
}

async function resolveBakery(
  db: ReturnType<typeof drizzle>,
  slug: string | undefined,
): Promise<{ id: string; name: string }> {
  if (slug) {
    const [b] = await db.select({ id: bakeries.id, name: bakeries.name }).from(bakeries).where(eq(bakeries.slug, slug)).limit(1)
    if (!b) throw new Error(`Nessun panificio con slug "${slug}"`)
    return b
  }
  const all = await db.select({ id: bakeries.id, name: bakeries.name, slug: bakeries.slug }).from(bakeries)
  if (all.length === 0) {
    throw new Error('Nessun panificio nel DB. Crea prima con: npm run bakery:create')
  }
  if (all.length === 1) {
    console.log(`→ Usando l'unico panificio: ${all[0].name} (${all[0].slug})`)
    return all[0]
  }
  const rl = readline.createInterface({ input, output })
  console.log('\nPanifici disponibili:')
  all.forEach((b, i) => console.log(`  [${i + 1}] ${b.name} (${b.slug})`))
  const ans = (await rl.question('\nScegli numero: ')).trim()
  rl.close()
  const idx = parseInt(ans, 10) - 1
  if (isNaN(idx) || idx < 0 || idx >= all.length) throw new Error('Scelta non valida')
  return all[idx]
}

// ─── Main ─────────────────────────────────────────────────────────────────

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('DATABASE_URL non impostato')
    process.exit(1)
  }

  const opts = parseArgs(process.argv.slice(2))
  const client = postgres(url, { max: 1, prepare: false })
  const db = drizzle(client)

  try {
    const bakery = await resolveBakery(db, opts.bakerySlug)

    const [{ existing }] = await db
      .select({ existing: count() })
      .from(products)
      .where(eq(products.bakeryId, bakery.id))

    if (Number(existing) > 0 && !opts.force) {
      console.log(`\n⚠️  Bakery già popolato (${existing} prodotti).`)
      console.log('   Usa --force per re-importare (i record verranno duplicati).')
      await client.end()
      process.exit(0)
    }

    console.log(`\nPopolamento di "${bakery.name}"...\n`)

    let counts = {
      sections: 0,
      products: 0,
      customers: 0,
      recurring: 0,
      divisors: 0,
      productionGroups: 0,
      dailyOrders: 0,
      itemStatuses: 0,
    }

    await db.transaction(async (tx) => {
      // 1. Sections — upsert (use existing if already there from bakery:create)
      const existingSections = await tx
        .select({ id: sections.id, name: sections.name })
        .from(sections)
        .where(eq(sections.bakeryId, bakery.id))
      const existingByName = new Map(existingSections.map((s) => [s.name, s.id]))

      const toInsert = SECTION_DEFS.filter((s) => !existingByName.has(s.name)).map((s, i) => ({
        bakeryId: bakery.id,
        name: s.name,
        color: s.color,
        order: existingSections.length + i,
      }))
      if (toInsert.length > 0) {
        const inserted = await tx.insert(sections).values(toInsert).returning({ id: sections.id, name: sections.name })
        for (const s of inserted) existingByName.set(s.name, s.id)
        counts.sections = inserted.length
      }
      const sectionByName = existingByName

      // 2. Products
      const productRows = await tx
        .insert(products)
        .values(
          PRODUCTS.map((p) => ({
            bakeryId: bakery.id,
            name: p.name,
            sectionId: sectionByName.get(p.section)!,
            unit: p.unit,
            piecesPerKg: p.piecesPerKg ?? null,
          })),
        )
        .returning({ id: products.id, name: products.name })
      counts.products = productRows.length

      const productIdByMock = new Map<string, string>()
      const productByName = new Map(productRows.map((p) => [p.name, p.id]))
      for (const p of PRODUCTS) productIdByMock.set(p.mockId, productByName.get(p.name)!)

      // 3. Customers
      const customerRows = await tx
        .insert(customers)
        .values(CUSTOMERS.map((c) => ({ bakeryId: bakery.id, name: c.name, type: c.type })))
        .returning({ id: customers.id, name: customers.name })
      counts.customers = customerRows.length

      const customerIdByMock = new Map<string, string>()
      const customerByName = new Map(customerRows.map((c) => [c.name, c.id]))
      for (const c of CUSTOMERS) customerIdByMock.set(c.mockId, customerByName.get(c.name)!)

      // 4. Recurring orders
      for (const r of RECURRING) {
        const customerId = customerIdByMock.get(r.customerMockId)!
        const [recurring] = await tx
          .insert(recurringOrders)
          .values({ bakeryId: bakery.id, customerId, weekdays: r.weekdays })
          .returning({ id: recurringOrders.id })
        await tx.insert(recurringOrderItems).values(
          r.items.map((it) => ({
            recurringOrderId: recurring.id,
            productId: productIdByMock.get(it.productId)!,
            quantity: String(it.quantity),
            unit: it.unit,
          })),
        )
        counts.recurring++
      }

      // 5. Divisors
      await tx.insert(divisors).values(
        DIVISORS.map((d) => ({
          bakeryId: bakery.id,
          productId: productIdByMock.get(d.productMockId)!,
          value: d.value,
        })),
      )
      counts.divisors = DIVISORS.length

      // 6. Production groups + links
      for (let i = 0; i < PRODUCTION_GROUPS.length; i++) {
        const g = PRODUCTION_GROUPS[i]
        const [group] = await tx
          .insert(productionGroups)
          .values({ bakeryId: bakery.id, name: g.name, order: i, displayMode: 'by-article' })
          .returning({ id: productionGroups.id })
        await tx.insert(productionGroupSections).values(
          g.sectionNames.map((n) => ({ groupId: group.id, sectionId: sectionByName.get(n)! })),
        )
        counts.productionGroups++
      }

      // ─── 7. Timeline: daily orders + statuses ──────────────────────────
      const todayIso = isoDate(TODAY)

      // Customer schedule for singles (which days they order in the range)
      const singleSchedule: Record<string, string[]> = { c5: [], c6: [] }
      for (let offset = -DAYS_BACK; offset <= DAYS_FORWARD; offset++) {
        const date = addDays(TODAY, offset)
        const iso = isoDate(date)
        if (chance(3 / 7)) singleSchedule['c5'].push(iso)
        if (chance(2 / 7)) singleSchedule['c6'].push(iso)
      }

      // Insert daily orders for singles
      for (const cMockId of ['c5', 'c6'] as const) {
        const cId = customerIdByMock.get(cMockId)!
        for (const iso of singleSchedule[cMockId]) {
          const [order] = await tx
            .insert(dailyOrders)
            .values({ bakeryId: bakery.id, date: iso, customerId: cId })
            .returning({ id: dailyOrders.id })

          // 2-4 items per order
          const nItems = 2 + Math.floor(rand() * 3)
          const usedMockIds = new Set<string>()
          const items: Array<{
            dailyOrderId: string
            productId: string
            quantity: string
            unit: 'pieces' | 'kg'
            done: boolean
            variant: string | null
          }> = []

          while (items.length < nItems) {
            const p = pick(PRODUCTS)
            if (usedMockIds.has(p.mockId)) continue
            usedMockIds.add(p.mockId)

            const qty = p.unit === 'kg' ? Number((0.5 + rand() * 2).toFixed(1)) : 1 + Math.floor(rand() * 6)
            const variant = p.section === 'Pizze farcite' && chance(0.5) ? pick(PIZZA_VARIANTS) : null
            const isPast = iso < todayIso
            const isToday = iso === todayIso
            const done = isPast ? true : isToday ? chance(0.6) : false

            items.push({
              dailyOrderId: order.id,
              productId: productIdByMock.get(p.mockId)!,
              quantity: String(qty),
              unit: p.unit,
              done,
              variant,
            })
          }
          await tx.insert(dailyOrderItems).values(items)
          counts.dailyOrders++
        }
      }

      // Daily_item_status for recurring items on past + today
      for (let offset = -DAYS_BACK; offset <= 0; offset++) {
        const date = addDays(TODAY, offset)
        const iso = isoDate(date)
        const wd = dayOfWeek(date)
        const isToday = offset === 0

        for (const r of RECURRING) {
          if (!r.weekdays.includes(wd)) continue
          const cId = customerIdByMock.get(r.customerMockId)!
          for (const it of r.items) {
            const done = isToday ? chance(0.6) : true
            // only insert overrides for done=true to keep table small (default is false)
            if (!done && !isToday) continue
            await tx
              .insert(dailyItemStatus)
              .values({
                bakeryId: bakery.id,
                date: iso,
                customerId: cId,
                productId: productIdByMock.get(it.productId)!,
                done,
              })
              .onConflictDoNothing({
                target: [
                  dailyItemStatus.bakeryId,
                  dailyItemStatus.date,
                  dailyItemStatus.customerId,
                  dailyItemStatus.productId,
                ],
              })
            counts.itemStatuses++
          }
        }
      }
    })

    console.log('✅ Seed completato:')
    console.log(`   - ${counts.sections} sezioni nuove (+ esistenti riusate)`)
    console.log(`   - ${counts.products} prodotti`)
    console.log(`   - ${counts.customers} clienti`)
    console.log(`   - ${counts.recurring} ordini ricorrenti`)
    console.log(`   - ${counts.divisors} divisori`)
    console.log(`   - ${counts.productionGroups} gruppi produzione`)
    console.log(`   - ${counts.dailyOrders} ordini giornalieri (singles)`)
    console.log(`   - ${counts.itemStatuses} stati item (per ricorrenti)`)
    console.log(`\nRange ordini: ${isoDate(addDays(TODAY, -DAYS_BACK))} → ${isoDate(addDays(TODAY, DAYS_FORWARD))}`)
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error('\nErrore:', err.message ?? err)
  process.exit(1)
})
