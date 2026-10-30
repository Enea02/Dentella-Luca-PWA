import { test } from 'node:test'
import assert from 'node:assert/strict'
import { addDays, buildPlan, plannableOrders, weekday } from './plan'
import { DEFAULT_PLAN_PARAMS, type PanettoneOrder, type PlanParams } from './types'

// 2026-12-14 is a Monday; 2026-12-20 is a Sunday.
const H = { start: '2026-12-14', end: '2026-12-23' }

let seq = 0
function order(
  deliveryDate: string,
  items: Record<string, number>,
  kind: 'preciso' | 'entro' = 'preciso',
  extra: Partial<PanettoneOrder> = {},
): PanettoneOrder {
  seq++
  return {
    id: `o${seq}`,
    season: 2026,
    customerName: `Cliente ${seq}`,
    phone: null,
    deliveryKind: kind,
    deliveryDate,
    pickupTime: null,
    deposit: null,
    notes: null,
    status: 'todo',
    doneAt: null,
    createdAt: '',
    updatedAt: '',
    items: Object.entries(items).map(([flavorId, qty]) => ({ flavorId, qty, producedQty: 0, delivered: false })),
    ...extra,
  }
}

const params = (p: Partial<PlanParams> = {}): PlanParams => ({ ...DEFAULT_PLAN_PARAMS, ...p })
const day = (plan: ReturnType<typeof buildPlan>, date: string) => plan.days.find((d) => d.date === date)!
const planned = (plan: ReturnType<typeof buildPlan>) => plan.days.reduce((a, d) => a + d.total, 0)

test('date helpers', () => {
  assert.equal(addDays('2026-12-31', 1), '2027-01-01')
  assert.equal(addDays('2026-03-29', 1), '2026-03-30') // DST change in Europe
  assert.equal(weekday('2026-12-20'), 0)
})

test('horizon has one day per calendar day, Sundays closed', () => {
  const plan = buildPlan([], params(), H)
  assert.equal(plan.days.length, 10)
  assert.deepEqual(plan.days.filter((d) => d.closed).map((d) => d.date), ['2026-12-20'])
  assert.equal(buildPlan([], params({ sunClosed: false }), H).days.filter((d) => d.closed).length, 0)
})

test('tardi: bakes on the latest useful day (due - lead)', () => {
  const plan = buildPlan([order('2026-12-24', { a: 5 })], params(), H)
  assert.equal(day(plan, '2026-12-23').total, 5)
  assert.equal(day(plan, '2026-12-23').items.a.orders[0].moved, false)
  assert.equal(planned(plan), 5)

  const lead2 = buildPlan([order('2026-12-24', { a: 5 })], params({ lead: 2 }), H)
  assert.equal(day(lead2, '2026-12-22').total, 5)
})

test('tardi: overflow moves to the previous day and is flagged as moved', () => {
  const plan = buildPlan([order('2026-12-24', { a: 30 })], params({ cap: 20 }), H)
  assert.equal(day(plan, '2026-12-23').total, 20)
  assert.equal(day(plan, '2026-12-22').total, 10)
  assert.equal(day(plan, '2026-12-22').items.a.orders[0].moved, true)
  assert.equal(plan.left.length, 0)
})

test('tardi: skips closed Sundays', () => {
  // Due Monday 21 → latest Sunday 20 (closed) → baked Saturday 19.
  const plan = buildPlan([order('2026-12-21', { a: 3 })], params(), H)
  assert.equal(day(plan, '2026-12-20').total, 0)
  assert.equal(day(plan, '2026-12-19').total, 3)
})

test('presto: fills forward from the first day, earliest deadlines first', () => {
  const late = order('2026-12-24', { a: 15 })
  const early = order('2026-12-16', { b: 10 })
  const plan = buildPlan([late, early], params({ strategy: 'presto', cap: 20 }), H)
  const first = day(plan, '2026-12-14')
  assert.equal(first.total, 20)
  assert.equal(first.items.b.qty, 10) // earliest deadline first
  assert.equal(first.items.a.qty, 10)
  assert.equal(day(plan, '2026-12-15').items.a.qty, 5)
  // "moved" is never reported by the forward strategy.
  assert.ok(plan.days.every((d) => Object.values(d.items).every((i) => i.orders.every((r) => !r.moved))))
})

test('bilanciato: spreads the load evenly', () => {
  // 40 pz due 24/12 (latest 23): 9 open days (Sunday closed) → target ceil(40/9) = 5.
  const plan = buildPlan([order('2026-12-24', { a: 40 })], params({ strategy: 'bilanciato' }), H)
  const open = plan.days.filter((d) => !d.closed)
  assert.ok(open.every((d) => d.total <= 5))
  assert.equal(planned(plan), 40)
})

test('prio: on equal latest day the preferred kind goes first', () => {
  const entro = order('2026-12-24', { a: 10 }, 'entro')
  const preciso = order('2026-12-24', { b: 10 }, 'preciso')
  const cap = params({ cap: 10 })

  const p1 = buildPlan([entro, preciso], { ...cap, prio: 'preciso' }, H)
  assert.deepEqual(Object.keys(day(p1, '2026-12-23').items), ['b'])

  const p2 = buildPlan([entro, preciso], { ...cap, prio: 'entro' }, H)
  assert.deepEqual(Object.keys(day(p2, '2026-12-23').items), ['a'])
})

test('group: at most maxG distinct flavors per day', () => {
  const o = order('2026-12-24', { a: 1, b: 1, c: 1, d: 1, e: 1, f: 1 })
  const grouped = buildPlan([o], params({ maxG: 4 }), H)
  assert.equal(Object.keys(day(grouped, '2026-12-23').items).length, 4)
  assert.equal(Object.keys(day(grouped, '2026-12-22').items).length, 2)

  const free = buildPlan([o], params({ maxG: 4, group: false }), H)
  assert.equal(Object.keys(day(free, '2026-12-23').items).length, 6)
})

test('group: second pass tops up flavors already open that day', () => {
  // Two orders of the same flavor share the day without counting twice towards maxG.
  const plan = buildPlan(
    [order('2026-12-24', { a: 3 }), order('2026-12-24', { a: 4 }), order('2026-12-24', { b: 2 })],
    params({ maxG: 1 }),
    H,
  )
  const d23 = day(plan, '2026-12-23')
  assert.deepEqual(Object.keys(d23.items).length, 1)
  assert.equal(planned(plan), 9)
})

test('left: pieces that cannot fit are reported', () => {
  // Due 15/12 → latest 14/12 (first day): only cap pieces fit.
  const plan = buildPlan([order('2026-12-15', { a: 25 })], params({ cap: 20 }), H)
  assert.equal(planned(plan), 20)
  assert.equal(plan.left.length, 1)
  assert.equal(plan.left[0].qty, 5)
})

test('deliveries after the horizon are baked by its last day', () => {
  const plan = buildPlan([order('2027-01-06', { a: 2 })], params(), H)
  assert.equal(day(plan, '2026-12-23').total, 2)
})

test('plannableOrders: only todo orders, minus what is produced or already delivered', () => {
  const orders = [
    order('2026-12-24', { a: 5 }, 'preciso', { status: 'stock' }),
    order('2026-12-24', { a: 5 }, 'preciso', { status: 'done' }),
    {
      ...order('2026-12-24', {}),
      items: [
        { flavorId: 'a', qty: 5, producedQty: 2, delivered: false },
        { flavorId: 'b', qty: 3, producedQty: 3, delivered: false },
        { flavorId: 'c', qty: 4, producedQty: 0, delivered: true },
      ],
    },
  ]
  const result = plannableOrders(orders)
  assert.equal(result.length, 1)
  assert.deepEqual(result[0].items, [{ flavorId: 'a', qty: 3, producedQty: 0, delivered: false }])
})

// ---- Parity with the design prototype ----
// Verbatim port of `buildPlan` from design_handoff_panettoni/Panettoni.dc.html
// (days of December 2026, 14..23), used as the reference implementation.
/* eslint-disable @typescript-eslint/no-explicit-any */
function prototypeBuildPlan(rows: any[], o: any) {
  const PLAN_START = 14, PLAN_END = 23
  const closed = (d: number) => o.sunClosed && new Date(2026, 11, d).getDay() === 0
  const lines: any[] = []
  rows.forEach((r) => {
    Object.keys(r.q).forEach((g) => {
      lines.push({ name: r.name, gusto: g, qty: r.q[g], due: r.due, kind: r.kind, latest: r.due - o.lead })
    })
  })
  const days: any = {}
  const asc: number[] = []
  for (let d = PLAN_START; d <= PLAN_END; d++) {
    days[d] = { d, closed: closed(d), items: {}, total: 0, flavors: new Set() }
    asc.push(d)
  }
  const desc = asc.slice().reverse()
  const maxG = o.group ? o.maxG : 99
  const prio = (l: any) => (o.prio === 'nessuna' ? 0 : l.kind === o.prio ? 0 : 1)
  const order = o.strategy === 'presto'
    ? (a: any, b: any) => (a.latest - b.latest) || (prio(a) - prio(b))
    : (a: any, b: any) => (b.latest - a.latest) || (prio(a) - prio(b))
  const fill = (d: number, limit: number) => {
    const day = days[d]
    if (day.closed) return
    let cap = limit - day.total
    if (cap <= 0) return
    const cand = lines.filter((l) => l.qty > 0 && l.latest >= d).sort(order)
    for (let pass = 0; pass < 2 && cap > 0; pass++) {
      cand.forEach((l) => {
        if (cap <= 0 || l.qty <= 0) return
        const inDay = day.flavors.has(l.gusto)
        if (pass === 0 && !inDay && day.flavors.size >= maxG) return
        if (pass === 1 && !inDay) return
        const take = Math.min(l.qty, cap)
        l.qty -= take; cap -= take; day.flavors.add(l.gusto)
        const it = day.items[l.gusto] || (day.items[l.gusto] = { gusto: l.gusto, qty: 0, orders: [] })
        it.qty += take
        it.orders.push({ name: l.name, qty: take, moved: o.strategy !== 'presto' && d < l.latest })
        day.total += take
      })
    }
  }
  if (o.strategy === 'presto') {
    asc.forEach((d) => fill(d, o.cap))
  } else if (o.strategy === 'bilanciato') {
    const total = lines.reduce((a, l) => a + l.qty, 0)
    const lastNeeded = Math.max(PLAN_START, ...lines.map((l) => Math.min(PLAN_END, l.latest)))
    const open = asc.filter((d) => !days[d].closed && d <= lastNeeded).length || 1
    const target = Math.min(o.cap, Math.ceil(total / open))
    desc.forEach((d) => fill(d, target))
    desc.forEach((d) => fill(d, o.cap))
  } else {
    desc.forEach((d) => fill(d, o.cap))
  }
  return { days, left: lines.filter((l) => l.qty > 0) }
}

test('matches the prototype on random scenarios', () => {
  let s = 42
  const rnd = (n: number) => {
    s = (s * 1103515245 + 12345) % 2 ** 31
    return s % n
  }
  const flavors = ['a', 'b', 'c', 'd', 'e', 'f', 'g']
  for (let run = 0; run < 300; run++) {
    const p: PlanParams = {
      cap: 5 + rnd(6) * 5,
      lead: rnd(4),
      maxG: 1 + rnd(5),
      sunClosed: rnd(2) === 0,
      strategy: (['tardi', 'bilanciato', 'presto'] as const)[rnd(3)],
      prio: (['preciso', 'entro', 'nessuna'] as const)[rnd(3)],
      group: rnd(3) !== 0,
    }
    const rows = Array.from({ length: 1 + rnd(8) }, (_, i) => {
      const q: Record<string, number> = {}
      for (let k = 0, n = 1 + rnd(3); k < n; k++) q[flavors[rnd(flavors.length)]] = 1 + rnd(12)
      return { name: `C${i}`, due: 15 + rnd(10), kind: rnd(2) ? 'preciso' : 'entro', q }
    })
    const ours = buildPlan(
      rows.map((r) => order(`2026-12-${r.due}`, r.q, r.kind as 'preciso' | 'entro', { customerName: r.name })),
      p,
      H,
    )
    const ref = prototypeBuildPlan(rows, p)
    for (const d of ours.days) {
      const refDay = ref.days[Number(d.date.slice(8))]
      assert.equal(d.total, refDay.total, `run ${run} ${d.date} total`)
      for (const [flavorId, it] of Object.entries(d.items)) {
        assert.equal(it.qty, refDay.items[flavorId].qty, `run ${run} ${d.date} ${flavorId}`)
        assert.deepEqual(
          it.orders.map((r) => [r.name, r.qty, r.moved]),
          refDay.items[flavorId].orders.map((r: any) => [r.name, r.qty, r.moved]),
        )
      }
    }
    assert.equal(ours.left.reduce((a, l) => a + l.qty, 0), ref.left.reduce((a: number, l: any) => a + l.qty, 0))
  }
})
