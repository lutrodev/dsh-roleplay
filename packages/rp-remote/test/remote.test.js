import assert from 'node:assert/strict'
import test from 'node:test'
import { Context } from '@deepseek-ai/cordis'
import RoleplayRemoteHost from '../lib/index.js'

test('registers, dispatches, and disposes one typed Roleplay route', async () => {
  const ctx = new Context()
  const remote = new RoleplayRemoteHost(ctx)
  const dispose = remote.register('/rp-assets', async (endpoint, payload, signal) => ({
    ok: true,
    value: { ok: true, value: { endpoint, payload, aborted: signal.aborted } },
  }))

  assert.deepEqual(await remote.assets('list', { kind: 'character' }, new AbortController().signal), {
    ok: true,
    value: { ok: true, value: { endpoint: 'list', payload: { kind: 'character' }, aborted: false } },
  })

  dispose()
  await assert.rejects(() => remote.assets('list', {}, new AbortController().signal), /no handler/)
})

test('rejects duplicate handlers without replacing the first owner', () => {
  const ctx = new Context()
  const remote = new RoleplayRemoteHost(ctx)
  remote.register('/rp-features', () => ({ ok: true, value: { ok: true } }))
  assert.throws(
    () => remote.register('/rp-features', () => ({ ok: true, value: { ok: true } })),
    /duplicate handler/,
  )
})
