import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { Context } from '@deepseek-ai/cordis'
import { apply, RpSubagentManager } from '../src/index.js'

const CONFIG = {
  maxSubagents: 3,
  maxNameCharacters: 24,
  maxDescriptionCharacters: 240,
  maxInstructionsCharacters: 1000,
  exposeBrowser: false,
}

async function fixture(overrides = {}) {
  const root = await mkdtemp(join(tmpdir(), 'rp-subagents-'))
  const ctx = new Context()
  const resolutions = []
  ctx.provide('llm', {
    async resolveModelInfo(provider, model) {
      resolutions.push({ provider, model })
      if (provider === 'missing') throw Object.assign(new Error('adapter missing'), { code: 'NO_ADAPTER' })
      return { provider, id: model, name: model }
    },
  })
  const config = { ...CONFIG, catalogDir: join(root, 'subagents'), ...overrides }
  const manager = new RpSubagentManager(ctx, config)
  await manager.initialize()
  return { root, ctx, config, manager, resolutions, async close() { await ctx.fiber.dispose(); await rm(root, { recursive: true, force: true }) } }
}

const role = (name, extra = {}) => ({
  name,
  description: `Use ${name} for bounded support work.`,
  instructions: `Return concise ${name} findings only.`,
  route: { kind: 'inherit' },
  tools: [],
  ...extra,
})

test('initialization can be disposed while runtime and browser consumers wait for readiness', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-subagents-lifecycle-'))
  const ctx = new Context()
  const gate = Promise.withResolvers()
  const started = Promise.withResolvers()
  const browserRegistered = Promise.withResolvers()
  const providerRegistered = Promise.withResolvers()
  const originalInitialize = RpSubagentManager.prototype.initialize
  let handler
  let provider
  let browserDisposed = false
  let providerDisposed = false
  let fiber
  RpSubagentManager.prototype.initialize = async function () {
    started.resolve()
    await gate.promise
    return originalInitialize.call(this)
  }
  ctx.provide('connection', {
    rpc: {
      handle(path, next) {
        assert.equal(path, '/rp-subagents')
        handler = next
        browserRegistered.resolve()
        return () => { browserDisposed = true }
      },
    },
  })
  ctx.provide('rpRuntime', {
    registerSubagentProfileProvider(value) {
      provider = value
      providerRegistered.resolve()
      return () => { providerDisposed = true }
    },
  })
  try {
    fiber = ctx.plugin({ name: 'rp-subagent-manager-lifecycle-test', apply }, {
      ...CONFIG,
      catalogDir: join(root, 'subagents'),
      exposeBrowser: true,
      initialSubagents: [],
    })
    await Promise.all([started.promise, browserRegistered.promise, providerRegistered.promise])
    let browserSettled = false
    let providerSettled = false
    const request = handler('list', {}).then(value => {
      browserSettled = true
      return value
    })
    const prepared = provider.prepare().then(value => {
      providerSettled = true
      return value
    })
    await Promise.resolve()
    assert.equal(browserSettled, false, 'RPC must wait for catalog initialization')
    assert.equal(providerSettled, false, 'runtime provider must wait for catalog initialization')

    const disposal = fiber.dispose()
    gate.resolve()
    const [response, profile] = await Promise.all([request, prepared])
    assert.equal(response.value.value.writer.id, 'writer')
    assert.deepEqual(profile.subagents, [])
    await disposal
    await fiber.await()
    assert.equal(browserDisposed, true)
    assert.equal(providerDisposed, true)
  } finally {
    RpSubagentManager.prototype.initialize = originalInitialize
    gate.resolve()
    if (fiber?.uid !== null) await fiber.dispose()
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('first initialization creates fixed Writer with an empty task-subagent catalog', async () => {
  const f = await fixture()
  try {
    const catalog = await f.manager.list()
    assert.equal(catalog.version, 3)
    assert.deepEqual(catalog.writer, { id: 'writer', fixed: true, revision: 1, route: { kind: 'inherit' } })
    const stored = JSON.parse(await readFile(join(f.config.catalogDir, 'catalog.json'), 'utf8'))
    assert.deepEqual(stored.writer, { revision: 1, route: { kind: 'inherit' } })
    assert.deepEqual(stored.subagents, [])
    assert.deepEqual(catalog.subagents, [])
    const second = new Context()
    second.provide('llm', f.ctx.get('llm'))
    const reopened = new RpSubagentManager(second, f.config)
    await reopened.initialize()
    assert.deepEqual((await reopened.list()).subagents, [])
    await second.fiber.dispose()
  } finally { await f.close() }
})

test('v1 role catalogs migrate atomically to v3 enabled task subagents without changing identity', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-subagents-v1-'))
  const catalogDir = join(root, 'subagents')
  const ctx = new Context()
  ctx.provide('llm', { async resolveModelInfo(provider, model) { return { provider, id: model } } })
  const legacy = {
    version: 1,
    writer: { revision: 2, route: { kind: 'inherit' } },
    roles: [{
      id: '11111111-1111-4111-8111-111111111111', revision: 3,
      ...role('Existing custom task'),
      createdAt: '2026-08-21T00:00:00.000Z', updatedAt: '2026-08-22T00:00:00.000Z',
    }],
  }
  await mkdir(catalogDir, { recursive: true })
  await writeFile(join(catalogDir, 'catalog.json'), `${JSON.stringify(legacy, null, 2)}\n`)
  const manager = new RpSubagentManager(ctx, { ...CONFIG, catalogDir })
  try {
    await manager.initialize()
    const catalog = await manager.list()
    assert.equal(catalog.version, 3)
    assert.equal(catalog.subagents[0].name, 'Existing custom task')
    assert.equal(catalog.subagents[0].revision, 3)
    assert.equal(catalog.subagents[0].enabled, true)
    const stored = JSON.parse(await readFile(join(catalogDir, 'catalog.json'), 'utf8'))
    assert.equal(stored.version, 3)
    assert.equal(stored.roles, undefined)
    assert.equal(stored.subagents[0].id, legacy.roles[0].id)
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('v2 task catalogs migrate missing enabled state to true', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-subagents-v2-'))
  const catalogDir = join(root, 'subagents')
  const ctx = new Context()
  const legacy = {
    version: 2,
    writer: { revision: 1, route: { kind: 'inherit' } },
    subagents: [{
      id: '22222222-2222-4222-8222-222222222222', revision: 4,
      ...role('Existing v2 task'),
      createdAt: '2026-08-21T00:00:00.000Z', updatedAt: '2026-08-22T00:00:00.000Z',
    }],
  }
  await mkdir(catalogDir, { recursive: true })
  await writeFile(join(catalogDir, 'catalog.json'), `${JSON.stringify(legacy, null, 2)}\n`)
  const manager = new RpSubagentManager(ctx, { ...CONFIG, catalogDir })
  try {
    await manager.initialize()
    const catalog = await manager.list()
    assert.equal(catalog.version, 3)
    assert.equal(catalog.subagents[0].enabled, true)
    assert.equal(catalog.subagents[0].revision, 4)
    assert.equal(JSON.parse(await readFile(join(catalogDir, 'catalog.json'), 'utf8')).subagents[0].enabled, true)
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('configured initial subagents seed only a missing catalog and never reappear after deletion', async () => {
  const initialSubagents = [
    role('Outline'),
    role('Polishing'),
  ]
  const f = await fixture({ initialSubagents })
  try {
    const first = await f.manager.list()
    assert.deepEqual(first.subagents.map(item => item.name), ['Outline', 'Polishing'])
    assert.deepEqual(first.subagents.map(item => item.tools), [[], []])
    assert.deepEqual(first.subagents.map(item => item.enabled), [true, true])
    assert.equal(first.subagents.every(item => item.revision === 1 && /^[0-9a-f-]{36}$/.test(item.id)), true)

    await f.manager.delete(first.subagents[0].id, first.subagents[0].revision)
    const secondContext = new Context()
    secondContext.provide('llm', f.ctx.get('llm'))
    const reopened = new RpSubagentManager(secondContext, {
      ...f.config,
      initialSubagents: [role('A different future example')],
    })
    await reopened.initialize()
    assert.deepEqual((await reopened.list()).subagents.map(item => item.name), ['Polishing'])
    await secondContext.fiber.dispose()
  } finally { await f.close() }
})

test('initial fixed-model validation fails before the first catalog is persisted', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-subagents-seed-model-'))
  const ctx = new Context()
  ctx.provide('llm', {
    async resolveModelInfo() { throw new Error('missing model') },
  })
  const config = {
    ...CONFIG,
    catalogDir: join(root, 'subagents'),
    initialSubagents: [role('Unavailable', { route: { kind: 'fixed', provider: 'missing', model: 'gone' } })],
  }
  const manager = new RpSubagentManager(ctx, config)
  try {
    await assert.rejects(manager.initialize(), error => error.code === 'MODEL_UNAVAILABLE')
    await assert.rejects(readFile(join(config.catalogDir, 'catalog.json'), 'utf8'), error => error.code === 'ENOENT')
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('CRUD preserves stable ids, applies revision CAS, validates names and keeps Writer fixed', async () => {
  const f = await fixture()
  try {
    const created = await f.manager.create(role('Continuity'))
    assert.match(created.id, /^[0-9a-f-]{36}$/)
    assert.equal(created.revision, 1)
    assert.equal(created.enabled, true)
    const updated = await f.manager.update(created.id, role('Continuity audit', { tools: ['skill'] }), 1)
    assert.equal(updated.id, created.id)
    assert.equal(updated.revision, 2)
    assert.deepEqual(updated.tools, ['skill'])
    await assert.rejects(f.manager.update(created.id, role('Stale'), 1), error => error.code === 'REVISION_CONFLICT')
    await assert.rejects(f.manager.create(role('CONTINUITY AUDIT')), error => error.code === 'NAME_CONFLICT')
    await assert.rejects(f.manager.delete('writer', 1), error => error.code === 'WRITER_FIXED')
    await assert.rejects(f.manager.update('writer', role('Writer'), 1), error => error.code === 'WRITER_FIXED')
    assert.deepEqual(await f.manager.delete(created.id, 2), { id: created.id })
    await assert.rejects(f.manager.get(created.id), error => error.code === 'SUBAGENT_NOT_FOUND')
  } finally { await f.close() }
})

test('enabled state uses revision CAS, survives ordinary edits and filters the next runtime snapshot', async () => {
  const f = await fixture()
  try {
    const first = await f.manager.create(role('Outline'))
    const second = await f.manager.create(role('Polishing'))
    const disabled = await f.manager.setEnabled(first.id, false, first.revision)
    assert.equal(disabled.enabled, false)
    assert.equal(disabled.revision, 2)
    await assert.rejects(f.manager.setEnabled(first.id, true, 1), error => error.code === 'REVISION_CONFLICT')
    await assert.rejects(f.manager.setEnabled(first.id, 'yes', 2), error => error.code === 'INVALID_REQUEST')
    await assert.rejects(f.manager.setEnabled('writer', false, 1), error => error.code === 'WRITER_FIXED')

    const edited = await f.manager.update(first.id, role('Outline revised'), disabled.revision)
    assert.equal(edited.enabled, false)
    const listed = await f.manager.list()
    assert.deepEqual(listed.subagents.map(item => [item.name, item.enabled]), [['Outline revised', false], ['Polishing', true]])

    const runtime = await f.manager.prepareRuntimeProfile()
    assert.deepEqual(runtime.subagents.map(item => item.id), [second.id])
    assert.deepEqual(runtime.revisions.subagents, { [second.id]: second.revision })

    const enabled = await f.manager.setEnabled(first.id, true, edited.revision)
    assert.equal(enabled.enabled, true)
    assert.deepEqual((await f.manager.prepareRuntimeProfile()).subagents.map(item => item.id), [first.id, second.id])
  } finally { await f.close() }
})

test('field, count and tool boundaries reject invalid data without changing the catalog', async () => {
  const f = await fixture({ maxSubagents: 1 })
  try {
    const exactName = '123456789012345678901234'
    const exact = await f.manager.create({ name: exactName, description: 'd'.repeat(240), instructions: 'i'.repeat(1000), route: { kind: 'inherit' }, tools: ['web_search', 'skill'] })
    assert.equal(exact.name, exactName)
    await assert.rejects(f.manager.create({ ...role('1234567890123456789012345'), description: 'short', instructions: 'short' }), error => error.code === 'LIMIT_EXCEEDED')
    await assert.rejects(f.manager.update(exact.id, { ...role('Good'), description: 'short', instructions: 'short', tools: ['rp_asset'] }, 1), error => error.code === 'INVALID_REQUEST')
    await assert.rejects(f.manager.update(exact.id, { ...role('Good'), description: 'short', instructions: 'short', tools: ['skill', 'skill'] }, 1), error => error.code === 'INVALID_REQUEST')
    await assert.rejects(f.manager.create({ ...role('More'), description: 'short', instructions: 'short' }), error => error.code === 'LIMIT_EXCEEDED')
    assert.deepEqual((await f.manager.list()).subagents.map(item => item.id), [exact.id])
  } finally { await f.close() }
})

test('fixed model validation succeeds before persistence and failures leave revisions unchanged', async () => {
  const f = await fixture()
  try {
    const writer = await f.manager.updateWriter({ kind: 'fixed', provider: 'openai', model: 'gpt-test' }, 1)
    assert.equal(writer.revision, 2)
    assert.deepEqual(writer.route, { kind: 'fixed', provider: 'openai', model: 'gpt-test' })
    assert.deepEqual(f.resolutions, [{ provider: 'openai', model: 'gpt-test' }])
    await assert.rejects(f.manager.updateWriter({ kind: 'fixed', provider: 'missing', model: 'gone' }, 2), error => error.code === 'MODEL_UNAVAILABLE')
    assert.equal((await f.manager.get('writer')).revision, 2)
    await assert.rejects(f.manager.create(role('Broken', { route: { kind: 'fixed', provider: 'missing', model: 'gone' } })), error => error.code === 'MODEL_UNAVAILABLE')
    assert.equal((await f.manager.list()).subagents.length, 0)
  } finally { await f.close() }
})

test('concurrent instances serialize atomic writes and only one stale update can commit', async () => {
  const f = await fixture()
  const secondContext = new Context()
  secondContext.provide('llm', f.ctx.get('llm'))
  const second = new RpSubagentManager(secondContext, f.config)
  try {
    await second.initialize()
    const [left, right] = await Promise.all([f.manager.create(role('Left')), second.create(role('Right'))])
    assert.deepEqual(new Set((await f.manager.list()).subagents.map(item => item.id)), new Set([left.id, right.id]))
    const results = await Promise.allSettled([
      f.manager.update(left.id, role('Left A'), 1),
      second.update(left.id, role('Left B'), 1),
    ])
    assert.equal(results.filter(item => item.status === 'fulfilled').length, 1)
    assert.equal(results.filter(item => item.status === 'rejected' && item.reason?.code === 'REVISION_CONFLICT').length, 1)
    const stored = await readFile(join(f.config.catalogDir, 'catalog.json'), 'utf8')
    assert.doesNotThrow(() => JSON.parse(stored))
  } finally { await secondContext.fiber.dispose(); await f.close() }
})

test('damaged catalog fails closed and is never replaced by initialization', async () => {
  const f = await fixture()
  try {
    const path = join(f.config.catalogDir, 'catalog.json')
    await writeFile(path, '{not-json\n', 'utf8')
    await assert.rejects(f.manager.list(), error => error.code === 'ASSET_CORRUPT')
    const secondContext = new Context()
    const reopened = new RpSubagentManager(secondContext, f.config)
    await assert.rejects(reopened.initialize(), error => error.code === 'ASSET_CORRUPT')
    assert.equal(await readFile(path, 'utf8'), '{not-json\n')
    await secondContext.fiber.dispose()
  } finally { await f.close() }
})

test('runtime projection uses the user-defined instructions as the complete System persona and stays detached', async () => {
  const f = await fixture()
  try {
    await f.manager.updateWriter({ kind: 'fixed', provider: 'p', model: 'writer' }, 1)
    await f.manager.create(role('Continuity', { tools: ['web_search', 'skill'] }))
    const snapshot = await f.manager.prepareRuntimeProfile()
    assert.deepEqual(snapshot.writer, { provider: 'p', model: 'writer' })
    assert.deepEqual(snapshot.subagents[0].inputSchema, { type: 'object', properties: {}, additionalProperties: true })
    assert.equal(snapshot.subagents[0].persona, 'Return concise Continuity findings only.')
    assert.deepEqual(snapshot.subagents[0].toolFilter, { allow: ['web_search', 'skill'] })
    snapshot.subagents[0].toolFilter.allow.length = 0
    assert.deepEqual((await f.manager.prepareRuntimeProfile()).subagents[0].toolFilter, { allow: ['web_search', 'skill'] })
  } finally { await f.close() }
})
