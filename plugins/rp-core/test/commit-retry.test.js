import assert from 'node:assert/strict'
import test from 'node:test'
import {
  applyCommitPatches,
  commitRetryParameterSchema,
  isRetryCommitArguments,
  MAX_COMMIT_RETRY_PATCHES,
} from '../src/commit-retry.js'

test('commit retry schema exposes one bounded correction-only protocol', () => {
  const schema = commitRetryParameterSchema()
  assert.deepEqual(schema.required, ['token', 'patches'])
  assert.equal(schema.additionalProperties, false)
  assert.equal(schema.properties.patches.items.oneOf.length, 3)
  assert.match(schema.properties.patches.description, new RegExp(String(MAX_COMMIT_RETRY_PATCHES)))
  assert.equal(isRetryCommitArguments({ retry: { token: 'x', patches: [] } }), true)
  assert.equal(isRetryCommitArguments({}), false)
  assert.equal(isRetryCommitArguments([]), false)
})

test('commit retry patches clone the draft and support object and array corrections', () => {
  const source = {
    effects: [{ payload: { approved: false, untouched: 'keep' } }],
    labels: ['first'],
    obsolete: true,
  }
  const result = applyCommitPatches(source, [
    { op: 'replace', path: '/effects/0/payload/approved', value: true },
    { op: 'add', path: '/labels/-', value: 'second' },
    { op: 'add', path: '/effects/0/payload/new~1key', value: 2 },
    { op: 'remove', path: '/obsolete' },
  ])
  assert.deepEqual(result, {
    effects: [{ payload: { approved: true, untouched: 'keep', 'new/key': 2 } }],
    labels: ['first', 'second'],
  })
  assert.deepEqual(source, {
    effects: [{ payload: { approved: false, untouched: 'keep' } }],
    labels: ['first'],
    obsolete: true,
  })
})

test('commit retry patches reject unsafe, ambiguous, and out-of-bounds paths', () => {
  const rejects = (patch, pattern) => assert.throws(
    () => applyCommitPatches({ list: ['first'] }, [patch]),
    error => error.code === 'RP_COMMIT_RETRY_PATCH_INVALID' && pattern.test(error.message),
  )
  rejects({ op: 'add', path: '/__proto__/polluted', value: true }, /unsafe object key/i)
  rejects({ op: 'replace', path: '/list/01', value: 'x' }, /invalid array index/i)
  rejects({ op: 'remove', path: '/list/1' }, /out of bounds/i)
  rejects({ op: 'add', path: '/bad~2escape', value: true }, /invalid escape/i)
  rejects({ op: 'remove', path: '' }, /complete commit draft/i)
  rejects({ op: 'add', path: '/value', value: undefined }, /lossless JSON/i)
})
