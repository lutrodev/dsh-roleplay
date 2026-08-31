import assert from 'node:assert/strict'
import test from 'node:test'
import { Context } from '@deepseek-ai/cordis'
import ToolRuntime from '@deepseek-ai/dsh-tools'
import { apply } from '../src/index.js'

const KINDS = [
  ['character', 'rpCharacterCards'],
  ['lorebook', 'rpLoreBooks'],
  ['persona', 'rpPersonas'],
  ['preset', 'rpPresets'],
  ['writingStyle', 'rpWritingStyles'],
]

test('read and mutation tools cover all five asset types without sharing actions', async () => {
  const harness = createHarness()
  for (const [kind, serviceName] of KINDS) {
    assert.equal((await harness.readTool.execute({ action: 'list', kind }, harness.exec)).page.items[0].id, `${serviceName}-id`)
    assert.equal((await harness.readTool.execute({ action: 'get', kind, id: 'asset-id' }, harness.exec)).asset.id, 'asset-id')
    const created = await harness.tool.execute({ action: 'create', kind, value: { name: `${kind} name` } }, harness.exec)
    assert.equal(created.meta.kind, 'rp-agent/asset-mutation')
    assert.equal(created.meta.version, 2)
    assert.equal(created.asset.id, `${serviceName}-created`)
    assert.deepEqual(created.binding, { requested: false, applied: false })
    assert.equal(created.runContext.refreshed, true)
    assert.equal(created.runContext.commitContextReplacement, `<commit_context_replacement context_epoch="${harness.refreshes}" />`)
    assert.equal(created.ok, true)
    assert.equal(created.phases.assetWrite.durable, true)
    const updated = await harness.tool.execute({ action: 'update', kind, id: 'asset-id', expectedRevision: 3, value: { name: 'updated' } }, harness.exec)
    assert.equal(updated.asset.revision, 4)
  }
  assert.equal(harness.refreshes, 10)
})

test('read-only output projects lossless empty presentation metadata', async () => {
  const harness = createHarness()
  assert.match(harness.readTool.description, /action list returns only assets bound to this conversation/)
  assert.match(harness.readTool.description, /Agent mode, list\/get may inspect the full shared library/)
  assert.match(harness.readTool.description, /switch to Agent mode/)
  assert.equal(Object.hasOwn(harness.readTool.parameters.properties, 'value'), false)
  assert.equal(Object.hasOwn(harness.readTool.parameters.properties, 'changes'), false)
  assert.match(harness.tool.description, /Inspect assets.*rp_asset_read first/)
  assert.match(harness.tool.description, /Omit fields that do not belong to the chosen action/)
  assert.match(harness.tool.parameters.properties.value.description, /every entry requires a non-empty human-readable name, explicit level, non-empty content/)
  assert.match(harness.tool.parameters.properties.value.description, /preset update: exact \{name,description,fields:/)
  assert.match(harness.tool.parameters.properties.value.description, /writingStyle: exact \{name,description\?,content\}/)
  const listed = await harness.readTool.execute({ action: 'list', kind: 'writingStyle' }, harness.exec)
  const detail = await harness.readTool.execute({ action: 'get', kind: 'writingStyle', id: 'asset-id' }, harness.exec)
  assert.deepEqual(harness.readTool.output.presentationMeta({}, listed), {})
  assert.deepEqual(harness.readTool.output.presentationMeta({}, detail), {})
  const created = await harness.tool.execute({
    action: 'create', kind: 'writingStyle', value: { name: 'Style' },
  }, harness.exec)
  assert.deepEqual(harness.tool.output.presentationMeta({}, created), created.meta)
})

test('Chat reads expose only current conversation bindings and reject unrelated ids', async () => {
  const harness = createHarness({ executionMode: 'chat' })
  const characterList = await harness.readTool.execute({ action: 'list', kind: 'character' }, harness.exec)
  assert.equal(characterList.scope, 'current_session')
  assert.deepEqual(characterList.page.items, [{ id: 'card-1', revision: 3, status: 'ready' }])

  const loreList = await harness.readTool.execute({ action: 'list', kind: 'lorebook', query: 'lore' }, harness.exec)
  assert.equal(loreList.scope, 'current_session')
  assert.deepEqual(loreList.page.items.map(item => item.id), ['lore-1'])
  assert.equal(loreList.page.total, 1)

  const detail = await harness.readTool.execute({ action: 'get', kind: 'persona', id: 'persona-1' }, harness.exec)
  assert.equal(detail.scope, 'current_session')
  assert.equal(detail.asset.id, 'persona-1')
  await assert.rejects(
    harness.readTool.execute({ action: 'get', kind: 'persona', id: 'persona-from-other-story' }, harness.exec),
    error => error.code === 'RP_ASSET_NOT_BOUND',
  )
})

test('Chat scoped list reports unbound kinds as empty without browsing the library', async () => {
  const harness = createHarness({ executionMode: 'chat', resources: { lorebooks: [], writingStyles: [] } })
  const listed = await harness.readTool.execute({ action: 'list', kind: 'character' }, harness.exec)
  assert.equal(listed.scope, 'current_session')
  assert.deepEqual(listed.page, { items: [], nextCursor: null, total: 0 })
})

test('read and mutation tools reject actions from the other capability', async () => {
  const harness = createHarness()
  await assert.rejects(
    harness.readTool.execute({ action: 'create', kind: 'character', value: { name: 'x' } }, harness.exec),
    error => error.code === 'INVALID_REQUEST',
  )
  await assert.rejects(
    harness.tool.execute({ action: 'get', kind: 'character', id: 'asset-id' }, harness.exec),
    error => error.code === 'INVALID_REQUEST',
  )
})

test('character reads keep quarantined prompt contents out of model output', async () => {
  const harness = createHarness()
  const detail = await harness.readTool.execute({ action: 'get', kind: 'character', id: 'asset-id' }, harness.exec)
  assert.deepEqual(detail.asset.quarantinedPrompts, [{ path: 'system_prompt', status: 'quarantined' }])
  assert.doesNotMatch(JSON.stringify(detail), /hidden executable instruction/)
})

test('canonical ToolRuntime accepts read-only queries, durable writes, and non-durable bind failures', async () => {
  const harness = createHarness({ bindError: Object.assign(new Error('busy'), { code: 'SESSION_RUNNING' }) })
  const tools = await canonicalTools(harness.readTool, harness.tool)
  const list = await tools.execute({
    signal: new AbortController().signal, callId: 'asset-list', name: 'rp_asset_read',
    arguments: { action: 'list', kind: 'writingStyle' },
    agent: harness.exec.agent,
  })
  assert.equal(list.isError, false)
  assert.deepEqual(list.meta, {})

  const created = await tools.execute({
    signal: new AbortController().signal,
    callId: 'asset-create', name: 'rp_asset',
    arguments: { action: 'create', kind: 'writingStyle', value: { name: 'Style' } },
    agent: harness.exec.agent,
  })
  assert.equal(created.isError, false)
  assert.equal(created.meta.kind, 'rp-agent/asset-mutation')

  const failedBind = await tools.execute({
    signal: new AbortController().signal,
    callId: 'asset-bind', name: 'rp_asset',
    arguments: { action: 'bind', changes: { personaId: 'persona-2' } },
    agent: harness.exec.agent,
  })
  assert.equal(failedBind.isError, false)
  assert.deepEqual(failedBind.meta, {})
})

test('canonical ToolRuntime preserves a durable write when context refresh fails', async () => {
  const harness = createHarness({
    refreshError: Object.assign(new Error('context failed'), { code: 'RP_CONTEXT_FAILED' }),
  })
  const tools = await canonicalTools(harness.tool)
  const result = await tools.execute({
    signal: new AbortController().signal,
    callId: 'asset-refresh-failure', name: 'rp_asset',
    arguments: { action: 'create', kind: 'lorebook', value: { name: 'Lore' } },
    agent: harness.exec.agent,
  })
  assert.equal(result.isError, false)
  assert.equal(result.value.ok, false)
  assert.equal('runContext' in result.value, false)
  assert.equal(result.meta.kind, 'rp-agent/asset-mutation')
  assert.equal(result.meta.assetId, 'rpLoreBooks-created')
})

test('bind applies partial ordered changes and preserves omitted fields', async () => {
  const harness = createHarness()
  const result = await harness.tool.execute({
    action: 'bind',
    changes: { lorebookIds: ['lore-2', 'lore-1', 'lore-2'], writingStyleIds: ['style-2', 'style-1'] },
  }, harness.exec)
  assert.equal(result.binding.applied, true)
  assert.deepEqual(harness.binds[0].changes, {
    lorebookIds: ['lore-2', 'lore-1'],
    writingStyleIds: ['style-2', 'style-1'],
  })
})

test('bind clears only explicitly nulled singleton fields', async () => {
  const harness = createHarness()
  await harness.tool.execute({
    action: 'bind',
    changes: { personaId: null },
  }, harness.exec)
  assert.deepEqual(harness.binds[0].changes, { personaId: null })
})

test('create reports a durable asset when requested binding fails', async () => {
  const harness = createHarness({ bindError: Object.assign(new Error('session is busy'), { code: 'SESSION_RUNNING' }) })
  const result = await harness.tool.execute({
    action: 'create', kind: 'character', value: { name: 'New card' }, bindToCurrentSession: true,
  }, harness.exec)
  assert.equal(result.asset.id, 'rpCharacterCards-created')
  assert.equal(result.binding.applied, false)
  assert.equal(result.binding.error.code, 'SESSION_RUNNING')
  assert.equal(result.meta.operation, 'create')
  assert.equal(result.ok, false)
  assert.equal(harness.outcomes.at(-1).ok, false)
})

test('create-and-bind applies the correct singleton or ordered-list semantics for every asset kind', async () => {
  for (const [kind, serviceName] of KINDS) {
    const harness = createHarness()
    const result = await harness.tool.execute({
      action: 'create', kind, value: { name: 'new' }, bindToCurrentSession: true,
    }, harness.exec)
    const id = `${serviceName}-created`
    const request = harness.binds[0].changes
    assert.equal(result.binding.applied, true)
    if (kind === 'character') assert.deepEqual(request, { cardId: id })
    if (kind === 'persona') assert.deepEqual(request, { personaId: id })
    if (kind === 'preset') assert.deepEqual(request, { presetId: id })
    if (kind === 'lorebook') assert.deepEqual(request, { lorebookIds: ['lore-1', id] })
    if (kind === 'writingStyle') assert.deepEqual(request, { writingStyleIds: ['style-1', id] })
  }
})

test('writing-style binding delegates the ordered quantity limit to the owning service', async () => {
  const harness = createHarness({ maxStyles: 2 })
  const result = await harness.tool.execute({ action: 'bind', changes: { writingStyleIds: ['style-1', 'style-2', 'style-3'] } }, harness.exec)
  assert.equal(result.ok, false)
  assert.equal(result.binding.error.code, 'LIMIT_EXCEEDED')
  assert.equal(result.meta, undefined)
  assert.equal(harness.binds.length, 0)
})

test('durable writes keep their id and mutation metadata when context refresh fails', async () => {
  const harness = createHarness({ refreshError: Object.assign(new Error('context failed'), { code: 'RP_CONTEXT_FAILED' }) })
  const result = await harness.tool.execute({
    action: 'create', kind: 'lorebook', value: { name: 'New lorebook' },
  }, harness.exec)
  assert.equal(result.ok, false)
  assert.equal(result.asset.id, 'rpLoreBooks-created')
  assert.equal(result.meta.assetId, 'rpLoreBooks-created')
  assert.equal(result.phases.contextRefresh.error.code, 'RP_CONTEXT_FAILED')
  assert.equal(harness.outcomes.at(-1).ok, false)
})

test('normalizes character and lorebook create envelopes returned by their real service API', async () => {
  const harness = createHarness({ nestedCreateServices: new Set(['rpCharacterCards', 'rpLoreBooks']) })
  for (const kind of ['character', 'lorebook']) {
    const result = await harness.tool.execute({ action: 'create', kind, value: { name: 'nested' } }, harness.exec)
    assert.equal(result.asset.id, kind === 'character' ? 'rpCharacterCards-created' : 'rpLoreBooks-created')
    assert.equal(result.asset.detailMarker, true)
  }
})

test('update requires an explicit positive revision', async () => {
  const harness = createHarness()
  await assert.rejects(
    harness.tool.execute({ action: 'update', kind: 'persona', id: 'persona-1', value: { name: 'x' } }, harness.exec),
    error => error.code === 'INVALID_REQUEST',
  )
})

test('reports a disabled asset capability without preventing the core tools from loading', async () => {
  const harness = createHarness({ omittedServices: new Set(['rpPersonas']) })
  await assert.rejects(
    harness.readTool.execute({ action: 'list', kind: 'persona' }, harness.exec),
    error => error.code === 'ASSET_SERVICE_UNAVAILABLE' && /not enabled/.test(error.message),
  )
  const character = await harness.readTool.execute({ action: 'list', kind: 'character' }, harness.exec)
  assert.equal(character.page.items[0].id, 'rpCharacterCards-id')
})

function createHarness(options = {}) {
  const tools = new Map()
  let refreshes = 0
  const binds = []
  const outcomes = []
  const profile = {
    revision: 7,
    runtime: { executionMode: options.executionMode ?? 'agent' },
    scene: { openingText: 'Opening' },
    resources: options.resources ?? {
      card: { id: 'card-1' }, lorebooks: [{ id: 'lore-1' }], persona: { id: 'persona-1' },
      preset: { id: 'preset-1' }, writingStyles: [{ id: 'style-1' }],
    },
  }
  const ctx = {
    tools: { register(value) { tools.set(value.name, value) } },
    rpRuntime: {
      async refreshRunContext() {
        refreshes += 1
        if (options.refreshError) throw options.refreshError
        return {
          refreshed: true,
          contextEpoch: refreshes,
          contextText: 'refreshed context',
          commitContextReplacement: `<commit_context_replacement context_epoch="${refreshes}" />`,
        }
      },
      recordAssetMutationOutcome(_agent, outcome) { outcomes.push(outcome) },
    },
    rpSessions: {
      get() { return profile },
      async bindAssetChangesDuringRun(_agent, request) {
        if (request.changes?.writingStyleIds?.length > (options.maxStyles ?? 16)) {
          throw Object.assign(new Error('too many styles'), { code: 'LIMIT_EXCEEDED' })
        }
        if (options.bindError) throw options.bindError
        binds.push(request)
        return { ...profile, revision: profile.revision + 1, resources: profile.resources }
      },
    },
  }
  for (const [, serviceName] of KINDS) {
    if (!options.omittedServices?.has(serviceName)) ctx[serviceName] = fakeService(serviceName, options)
  }
  apply(ctx)
  return {
    tool: tools.get('rp_asset'),
    readTool: tools.get('rp_asset_read'),
    exec: { agent: { id: 'agent' }, callId: 'asset-call', concludeTurn() {} },
    binds,
    outcomes,
    get refreshes() { return refreshes },
  }
}

function fakeService(name, options) {
  return {
    async list() { return { items: [{ id: `${name}-id` }], nextCursor: null, total: 1 } },
    async detail(id) {
      return name === 'rpCharacterCards'
        ? {
            id, revision: 3, character: { firstMessage: 'Card opening' },
            quarantinedPrompts: [{ path: 'system_prompt', value: 'hidden executable instruction' }],
          }
        : { id, revision: 3 }
    },
    async create() {
      const summary = { id: `${name}-created`, revision: 1 }
      return options.nestedCreateServices?.has(name)
        ? { created: summary, detail: { ...summary, detailMarker: true } }
        : summary
    },
    async update(id, _value, expectedRevision) { return { id, revision: expectedRevision + 1 } },
    async resolveBindings(ids) {
      if (name !== 'rpWritingStyles') throw new Error('resolveBindings is only available for writing styles')
      if (ids.length > (options.maxStyles ?? 16)) throw Object.assign(new Error('too many styles'), { code: 'LIMIT_EXCEEDED' })
      return ids.map(id => ({ id }))
    },
  }
}

async function canonicalTools(...definitions) {
  const ctx = new Context()
  ctx.provide('systemPrompt', { tools() {}, section() {} })
  await ctx.plugin(ToolRuntime)
  for (const definition of definitions) ctx.tools.register(definition)
  return ctx.tools
}
