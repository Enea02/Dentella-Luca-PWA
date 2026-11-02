import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ITEM_STATE_FOR_STATUS, normalizeTime, statusFromItems } from './helpers'
import { seasonForDate } from './types'

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
