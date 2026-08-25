import assert from 'node:assert/strict'
import test from 'node:test'
import { createStatePatch, escapeJsonPointer } from '../src/json-patch.js'

test('diffs object paths deterministically with tests before destructive operations', () => {
  assert.deepEqual(createStatePatch({ b: 2, a: { x: 1 }, remove: true }, { b: 3, a: { x: 1, y: 2 }, add: 'yes' }), [
    { op: 'test', path: '/remove', value: true },
    { op: 'remove', path: '/remove' },
    { op: 'add', path: '/a/y', value: 2 },
    { op: 'add', path: '/add', value: 'yes' },
    { op: 'test', path: '/b', value: 2 },
    { op: 'replace', path: '/b', value: 3 },
  ])
})

test('replaces arrays and roots atomically and escapes JSON Pointer tokens', () => {
  assert.deepEqual(createStatePatch({ list: [1, 2] }, { list: [2] }), [
    { op: 'test', path: '/list', value: [1, 2] },
    { op: 'replace', path: '/list', value: [2] },
  ])
  assert.deepEqual(createStatePatch(1, 2), [{ op: 'test', path: '', value: 1 }, { op: 'replace', path: '', value: 2 }])
  assert.equal(escapeJsonPointer('a~/b'), 'a~0~1b')
})

test('rejects dangerous paths and returns no operations for equal values', () => {
  assert.deepEqual(createStatePatch({ safe: true }, { safe: true }), [])
  assert.throws(() => createStatePatch({}, JSON.parse('{"__proto__":{"polluted":true}}')), /unsafe/)
})
