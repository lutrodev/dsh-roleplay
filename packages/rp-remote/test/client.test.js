import assert from 'node:assert/strict'
import test from 'node:test'
import { Context, Service } from '@deepseek-ai/cordis'
import { apply, inject } from '../src/client.js'

class StubRoleplayNamespace extends Service {
  constructor(ctx) {
    super(ctx, 'remote.roleplay')
  }

  async assets(endpoint, payload, signal) {
    return {
      ok: true,
      value: { endpoint, payload, aborted: signal.aborted },
    }
  }
}

class StubRemote extends Service {
  constructor(ctx) {
    super(ctx, 'remote')
    this.owner = ctx
  }

  async $mount() {
    const fiber = this.owner.plugin({
      name: 'remote.roleplay',
      apply: ctx => { new StubRoleplayNamespace(ctx) },
    })
    await fiber
    return fiber.dispose
  }
}

test('captures the mounted namespace without requiring a circular remote.roleplay inject', async () => {
  const ctx = new Context()
  const remoteFiber = ctx.plugin({
    name: 'remote',
    apply: scope => { new StubRemote(scope) },
  })
  await remoteFiber

  const clientFiber = ctx.plugin(Object.assign(apply, { inject }))
  await clientFiber
  const connection = ctx.get('rpRemote')
  assert.ok(connection)
  assert.deepEqual(
    await connection.call('/rp-assets', 'list', { kind: 'character' }, new AbortController().signal),
    { endpoint: 'list', payload: { kind: 'character' }, aborted: false },
  )

  await clientFiber.dispose()
  assert.equal(ctx.get('rpRemote'), undefined)
  assert.equal(ctx.get('remote.roleplay'), undefined)
  await remoteFiber.dispose()
})
