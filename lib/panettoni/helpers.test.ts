import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeTime } from './helpers'

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
