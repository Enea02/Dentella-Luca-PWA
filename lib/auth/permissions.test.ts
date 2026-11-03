import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PERMISSION_KEYS, can, computeEffectivePermissions } from './permissions'

test('admin can always do everything, even with overrides that say no', () => {
  const allNo = Object.fromEntries(PERMISSION_KEYS.map((k) => [k, false]))
  for (const key of PERMISSION_KEYS) {
    assert.equal(can('admin', key), true, key)
    assert.equal(can({ role: 'admin', permissions: allNo }, key), true, key)
  }
})

test('admin effective permissions ignore role and user overrides', () => {
  const roleOv = PERMISSION_KEYS.map((permission) => ({ role: 'admin' as const, permission, allowed: false }))
  const userOv = PERMISSION_KEYS.map((permission) => ({ permission, allowed: false }))
  const eff = computeEffectivePermissions('admin', roleOv, userOv)
  assert.ok(PERMISSION_KEYS.every((k) => eff[k] === true))
})

test('other roles still follow defaults and overrides', () => {
  assert.equal(can('staff', 'orders:edit'), false)
  assert.equal(can({ role: 'staff', permissions: { 'orders:edit': true } }, 'orders:edit'), true)
  assert.equal(can({ role: 'owner', permissions: { 'orders:postpone': false } }, 'orders:postpone'), false)
  const eff = computeEffectivePermissions('staff', [{ role: 'staff', permission: 'orders:toggle', allowed: false }], [])
  assert.equal(eff['orders:toggle'], false)
})
