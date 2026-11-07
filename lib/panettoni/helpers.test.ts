import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  ITEM_STATE_FOR_STATUS,
  archiveByCustomer,
  itemWithState,
  normalizeTime,
  statusFromItems,
  textKey,
  withRowStatus,
} from './helpers'
import { seasonForDate, type PanettoneOrder } from './types'

test('normalizeTime: typed times become HH:MM', () => {
  assert.equal(normalizeTime('10:45'), '10:45')
  assert.equal(normalizeTime('10.45'), '10:45')
  assert.equal(normalizeTime('10,45'), '10:45')
  assert.equal(normalizeTime('10 45'), '10:45')
  assert.equal(normalizeTime('10h45'), '10:45')
  assert.equal(normalizeTime('1045'), '10:45')
  assert.equal(normalizeTime('945'), '09:45')
  assert.equal(normalizeTime('9:5'), '09:05')
  assert.equal(normalizeTime(' 9 '), '09:00')
  assert.equal(normalizeTime('0'), '00:00')
})

test('normalizeTime: anything else is kept as typed', () => {
  assert.equal(normalizeTime('in mattinata'), 'in mattinata')
  assert.equal(normalizeTime('25:00'), '25:00')
  assert.equal(normalizeTime('10:75'), '10:75')
  assert.equal(normalizeTime(''), '')
  assert.equal(normalizeTime('x'.repeat(50)).length, 40)
})

test('statusFromItems: the row follows its cells', () => {
  const items = (...states: ('todo' | 'stock' | 'delivered')[]) => states.map((state) => ({ state }))
  assert.equal(statusFromItems(items('todo', 'stock'), 'todo'), 'todo')
  assert.equal(statusFromItems(items('todo', 'delivered'), 'todo'), 'todo')
  assert.equal(statusFromItems(items('stock', 'stock'), 'todo'), 'stock')
  assert.equal(statusFromItems(items('stock', 'delivered'), 'todo'), 'stock')
  assert.equal(statusFromItems(items('delivered', 'delivered'), 'stock'), 'done')
  // A delivered cell taken back reopens an archived order.
  assert.equal(statusFromItems(items('delivered', 'stock'), 'done'), 'stock')
  assert.equal(statusFromItems(items('delivered', 'todo'), 'done'), 'todo')
  // No items: keep what it was.
  assert.equal(statusFromItems([], 'stock'), 'stock')
})

test('row status → cell state mapping', () => {
  assert.deepEqual(ITEM_STATE_FOR_STATUS, { todo: 'todo', stock: 'stock', done: 'delivered' })
})

test('seasonForDate: January belongs to the previous Christmas', () => {
  assert.equal(seasonForDate('2026-12-24'), 2026)
  assert.equal(seasonForDate('2027-01-06'), 2026)
  assert.equal(seasonForDate('2027-02-01'), 2027)
})

test('itemWithState: taking pieces out of stock restarts the baked count', () => {
  const item = { flavorId: 'f', qty: 5, producedQty: 5, state: 'stock' as const }
  assert.deepEqual(itemWithState(item, 'todo'), { ...item, state: 'todo', producedQty: 0 })
  assert.deepEqual(itemWithState({ ...item, state: 'delivered' }, 'todo').producedQty, 0)
  // Other moves keep it.
  assert.equal(itemWithState(item, 'delivered').producedQty, 5)
  assert.equal(itemWithState({ ...item, state: 'delivered' }, 'stock').producedQty, 5)
  // Already da fare (partially baked, or a replayed request): untouched.
  assert.equal(itemWithState({ ...item, state: 'todo', producedQty: 2 }, 'todo').producedQty, 2)
})

const order = (over: Partial<PanettoneOrder>): PanettoneOrder => ({
  id: Math.random().toString(36).slice(2),
  season: 2026,
  customerId: null,
  customerName: 'Rossi',
  phone: null,
  deliveryKind: 'preciso',
  deliveryDate: '2026-12-24',
  pickupTime: null,
  deposit: null,
  notes: null,
  status: 'done',
  doneAt: '2026-12-24T10:00:00.000Z',
  createdAt: '2026-11-01T10:00:00.000Z',
  updatedAt: '2026-11-01T10:00:00.000Z',
  items: [],
  ...over,
})
const delivered = (flavorId: string, qty: number) => ({ flavorId, qty, producedQty: qty, state: 'delivered' as const })

test('withRowStatus: "Togli tutto dal magazzino" restarts the baked count of every cell', () => {
  const o = order({ status: 'stock', items: [{ ...delivered('a', 3), state: 'stock' }, delivered('b', 2)] })
  assert.deepEqual(
    withRowStatus(o, 'todo').items.map((i) => [i.state, i.producedQty]),
    [['todo', 0], ['todo', 0]],
  )
})

test('archiveByCustomer: groups by linked customer, then by name, with per-flavor totals', () => {
  const orders = [
    order({ customerId: 'c1', customerName: 'Bar Sport', doneAt: '2026-12-20T10:00:00.000Z', items: [delivered('a', 10)] }),
    order({ customerName: 'bar sport ', doneAt: '2026-12-22T10:00:00.000Z', items: [delivered('a', 2), delivered('b', 3)] }),
    order({ customerName: 'Caffè Rossi', doneAt: '2026-12-23T10:00:00.000Z', items: [delivered('b', 1)] }),
    order({ customerName: 'caffe rossi', season: 2025, doneAt: '2025-12-23T10:00:00.000Z', items: [delivered('b', 4)] }),
    order({ customerName: 'Aperto', status: 'todo', items: [{ ...delivered('a', 9), state: 'todo' }] }),
  ]
  const groups = archiveByCustomer(orders)
  assert.deepEqual(
    groups.map((g) => [g.name, g.orders.length, g.total, Object.fromEntries(g.byFlavor)]),
    [
      ['Caffè Rossi', 2, 5, { b: 5 }], // most recent delivery first; name from the latest order
      ['bar sport ', 2, 15, { a: 12, b: 3 }], // unlinked joins the linked customer by name
    ],
  )
  assert.equal(groups[1].customerId, 'c1')
  // Search ignores case and accents.
  assert.deepEqual(archiveByCustomer(orders, 'CAFFE').map((g) => g.name), ['Caffè Rossi'])
  assert.deepEqual(archiveByCustomer(orders, 'sport').map((g) => g.total), [15])
  assert.deepEqual(archiveByCustomer(orders, 'nessuno'), [])
})

test('textKey: case-, accent- and punctuation-insensitive', () => {
  assert.equal(textKey('  Caffè  Rossi! '), 'caffe-rossi')
  assert.equal(textKey('Caffe rossi'), textKey('CAFFÈ ROSSI'))
})
