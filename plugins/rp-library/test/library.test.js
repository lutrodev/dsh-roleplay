import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { Context } from '@deepseek-ai/cordis'
import { Session, SessionId } from '@deepseek-ai/dsh-session'
import * as Library from '../src/index.js'
import { normalizeProfile } from 'dsh-roleplay-rp-session'
import { encodeSessionCommand } from 'dsh-roleplay-rp-session/protocol'
import { createRoleplaySession, prepareRoleplaySeed, RpSessionBootstrap } from '../src/session-bootstrap.js'
import { assetKindLabel, countStateItems, createdAssetBindingMessage, domainValue, isRoleplaySummary, moveItem, openingModeFromProfile, openingText, preferredStateDetailView, resetBlankRoleplaySession, selectCharacterLore, sessionBlockReason, sessionSectionCapability, sessionSurfaceState, shouldShowSkippedOpeningNotice, stateActivityChanges, stateActivityTotalCount, userErrorMessage } from '../src/client-state.js'

const { dispatch } = Library

const bootstrapConfig = {
  agentPreset: 'roleplay',
  defaultMode: 'adaptive',
  defaultExecutionMode: 'chat',
  maxProfileCommandBytes: 262144,
}

test('roleplay bootstrap resolves assets and builds a balanced opening seed before Agent construction', async () => {
  const cardId = '00000000-0000-0000-0000-000000000010'
  const loreId = '00000000-0000-0000-0000-000000000011'
  const personaId = '00000000-0000-0000-0000-000000000012'
  const host = new Context()
  const bootstrap = new RpSessionBootstrap(host)
  bootstrap.registerMaterializer({
    id: 'test.adapter',
    prepare: ({ openingMessageText }) => ({
      stateBootstrap: {
        version: 2,
        namespaces: [{
          namespace: 'story',
          initialValue: { hp: 12, weather: 'rain' },
          definition: {
            title: '故事状态',
            description: '测试状态',
            updateMode: 'schema-only',
            schema: { type: 'object', properties: { hp: { type: 'integer' }, weather: { type: 'string' } }, required: ['hp', 'weather'], additionalProperties: false },
            rules: [],
          },
          diagnostics: { setup: [], lastCommit: [] },
        }],
      },
      openingMessageText: openingMessageText.replace('身边', '港口'),
    }),
  })
  const ctx = {
    rpSessionBootstrap: bootstrap,
    rpCharacterCards: { get: async id => ({ id, name: '莱安娜', firstMessage: '{{user}}来到{{char}}身边。', alternateGreetings: [] }) },
    rpLoreBooks: { get: async id => ({ id, name: '港口世界书', entries: [] }) },
    rpPersonas: { get: async id => ({ id, name: '阿月' }) },
    rpPresets: {},
  }
  const prepared = await prepareRoleplaySeed(ctx, {
    cardId,
    lorebookIds: [loreId],
    personaId,
    presetId: null,
    openingIndex: 0,
    openingSource: 'card',
    openingText: '{{user}}来到{{char}}身边。',
  }, bootstrapConfig)

  assert.equal(prepared.profile.revision, 1)
  assert.equal(prepared.profile.scene.openingText, '{{user}}来到{{char}}身边。')
  assert.deepEqual(prepared.profile.resources.card, { id: cardId })
  assert.equal(prepared.profile.stateBootstrap.version, 2)
  assert.equal(prepared.profile.stateBootstrap.namespaces[0].namespace, 'story')
  assert.deepEqual(prepared.profile.stateBootstrap.namespaces[0].initialValue, { hp: 12, weather: 'rain' })
  assert.deepEqual(prepared.seed.map(event => event.type), [
    'command/run', 'command/done', 'turn/start', 'step/start', 'assistant/message', 'step/end', 'turn/end',
  ])
  assert.deepEqual(prepared.seed.map(event => event.seq), [0, 1, 2, 3, 4, 5, 6])
  assert.equal(prepared.seed[4].data.message.content[0].text, '阿月来到莱安娜港口。')
  const session = Session.create(SessionId('seeded-roleplay'), prepared.seed)
  assert.equal(session.events.findLast(event => event.type === 'turn/start').data.turn, 1)
  assert.equal(session.events.findLast(event => event.type === 'turn/end').data.reason.kind, 'completed')
  await host.fiber.dispose()
})

test('roleplay bootstrap rejects legacy State versions and duplicate namespace partitions', async () => {
  const legacyContext = new Context()
  const legacy = new RpSessionBootstrap(legacyContext)
  legacy.registerMaterializer({ id: 'legacy', prepare: () => ({ stateBootstrap: { version: 1, namespaces: [] } }) })
  await assert.rejects(
    legacy.materialize({ profile: normalizeProfile({ mode: 'director' }, 0) }),
    /invalid stateBootstrap/,
  )
  await legacyContext.fiber.dispose()

  const duplicateContext = new Context()
  const duplicate = new RpSessionBootstrap(duplicateContext)
  for (const id of ['state-a', 'state-b']) {
    duplicate.registerMaterializer({ id, prepare: () => ({ stateBootstrap: { version: 2, namespaces: [{ namespace: 'story' }] } }) })
  }
  await assert.rejects(
    duplicate.materialize({ profile: normalizeProfile({ mode: 'director' }, 0) }),
    /duplicate namespace/,
  )
  await duplicateContext.fiber.dispose()
})

test('roleplay bootstrap passes the complete seed to agents.create and mounts the preset in setup', async () => {
  let creation
  let mounted
  let attached
  const workspace = {
    path: '/workspace/roleplay',
    sessionIds: ['source-session'],
    async attachSession(sessionId) { attached = sessionId },
  }
  const ctx = {
    agents: {
      async create(options) {
        creation = options
        await options.setup({ scope: 'agent' })
        return { agent: {} }
      },
    },
    agentPresets: { async mount(agentCtx, preset) { mounted = { agentCtx, preset } } },
    workspaceRegistry: { list: () => [workspace] },
    rpCharacterCards: {}, rpLoreBooks: {}, rpPersonas: {}, rpPresets: {},
  }
  const result = await createRoleplaySession(ctx, {
    sourceSessionId: 'source-session',
    cardId: null,
    lorebookIds: [],
    personaId: null,
    presetId: null,
    openingIndex: 0,
    openingSource: 'skip',
    openingText: null,
  }, bootstrapConfig)
  assert.match(result.sessionId, /^session-/)
  assert.equal(creation.sessionId, result.sessionId)
  assert.deepEqual(creation.meta, { agentPreset: 'roleplay', cwd: '/workspace/roleplay' })
  assert.deepEqual(creation.seed.map(event => event.type), ['command/run', 'command/done'])
  assert.deepEqual(mounted, { agentCtx: { scope: 'agent' }, preset: 'roleplay' })
  assert.equal(attached, result.sessionId)
})

test('roleplay bootstrap keeps a story ungrouped when its source session is ungrouped', async () => {
  let creation
  const ctx = {
    agents: { async create(options) { creation = options; await options.setup({}) } },
    agentPresets: { async mount() {} },
    workspaceRegistry: { list: () => [] },
    rpCharacterCards: {}, rpLoreBooks: {}, rpPersonas: {}, rpPresets: {},
  }
  await createRoleplaySession(ctx, {
    sourceSessionId: 'ungrouped-source',
    cardId: null,
    lorebookIds: [],
    personaId: null,
    presetId: null,
    openingIndex: 0,
    openingSource: 'skip',
    openingText: null,
  }, bootstrapConfig)
  assert.deepEqual(creation.meta, { agentPreset: 'roleplay' })
})

test('roleplay bootstrap requires a source session before creating an Agent', async () => {
  let creations = 0
  const ctx = {
    agents: { async create() { creations += 1 } },
    agentPresets: {},
    workspaceRegistry: { list: () => [] },
    rpCharacterCards: {}, rpLoreBooks: {}, rpPersonas: {}, rpPresets: {},
  }
  await assert.rejects(
    createRoleplaySession(ctx, {
      cardId: null,
      lorebookIds: [],
      personaId: null,
      presetId: null,
      openingIndex: 0,
      openingSource: 'skip',
      openingText: null,
    }, bootstrapConfig),
    error => error.code === 'INVALID_REQUEST' && /sourceSessionId/.test(error.message),
  )
  assert.equal(creations, 0)
})

test('host coordinator activates without optional asset providers', async () => {
  const ctx = new Context()
  let route
  ctx.provide('rpRemote', { register(path, _handler) { route = { path }; return () => {} } })
  ctx.provide('typert', { lookups: { get: () => undefined } })
  ctx.provide('agentPresets', {})
  ctx.provide('agents', {})
  ctx.provide('sessions', {})
  ctx.provide('sessionPersistence', {})
  ctx.provide('workspaceRegistry', {})
  try {
    await ctx.plugin(Library, {})
    assert.deepEqual(route, { path: '/rp-assets' })
    assert.ok(ctx.get('rpSessionBootstrap'))
  } finally {
    await ctx.fiber.dispose()
  }
})

test('session binding delegates ids and opening selection to the canonical Session service', async () => {
  let captured
  const sessions = { bindAssetChanges: async (_agent, request) => { captured = request; return { revision: 7, resources: request.changes } } }
  const agent = { status: 'idle', ctx: {}, session: { header: { agentPreset: 'roleplay' }, events: [] } }
  const ctx = {
    typert: { lookups: { get: () => ({ resolve: async () => agent }) } },
    agentPresets: { serviceFor: (candidate, name) => candidate === agent && name === 'rpSessions' ? sessions : undefined },
    rpCharacterCards: { get: async id => ({ id, revision: 4, sourceHash: 'card-hash', firstMessage: '默认开场', alternateGreetings: ['另一个开场'] }) },
    rpLoreBooks: { get: async id => ({ id, revision: id.endsWith('1') ? 2 : 3, sourceHash: `hash-${id}` }) },
    rpPersonas: { get: async id => ({ id, revision: 1 }) },
    rpPresets: { resolveBinding: async id => ({ id }) },
    rpWritingStyles: { resolveBindings: async ids => ids.map(id => ({ id })) },
  }
  const cardId = '00000000-0000-0000-0000-000000000010'
  const lore1 = '00000000-0000-0000-0000-000000000011'
  const lore2 = '00000000-0000-0000-0000-000000000012'
  const personaId = '00000000-0000-0000-0000-000000000013'
  const presetId = '00000000-0000-0000-0000-000000000014'
  const style1 = '00000000-0000-0000-0000-000000000015'
  const style2 = '00000000-0000-0000-0000-000000000016'
  await dispatch(ctx, 'session/bind', { sessionId: 's', expectedRevision: 6, cardId, lorebookIds: [lore2, lore1], personaId, presetId, writingStyleIds: [style2, style1], openingIndex: 1, openingSource: 'custom', openingText: '自定义开场。' })
  assert.equal(captured.expectedRevision, 6)
  assert.deepEqual(captured.changes, {
    cardId,
    lorebookIds: [lore2, lore1],
    personaId,
    presetId,
    writingStyleIds: [style2, style1],
  })
  assert.equal(captured.openingIndex, 1)
  assert.equal(captured.openingSource, 'custom')
  assert.equal(captured.openingText, '自定义开场。')
})

test('session binding forwards an explicit skipped opening', async () => {
  let captured
  const sessions = { bindAssetChanges: async (_agent, request) => { captured = request; return { revision: 1 } } }
  const agent = { status: 'idle', ctx: {}, session: { header: { agentPreset: 'roleplay' }, events: [] } }
  const ctx = {
    typert: { lookups: { get: () => ({ resolve: async () => agent }) } },
    agentPresets: { serviceFor: () => sessions },
    rpCharacterCards: { get: async id => ({ id }) },
    rpLoreBooks: {}, rpPersonas: {}, rpPresets: {},
  }
  await dispatch(ctx, 'session/bind', { sessionId: 's', expectedRevision: 0, cardId: null, lorebookIds: [], openingIndex: 0, openingSource: 'skip', openingText: null })
  assert.equal(captured.openingSource, 'skip')
  assert.equal(captured.openingText, null)
})

test('capabilities expose every optional asset provider independently', async () => {
  assert.deepEqual(await dispatch({}, 'capabilities', {}), {
    characters: false, lorebooks: false, personas: false, presets: false, writingStyles: false, state: false,
  })
  assert.deepEqual(await dispatch({ rpCharacterCards: {}, rpWritingStyles: {}, rpFeatures: { isEnabled: id => id === 'state' } }, 'capabilities', {}), {
    characters: true, lorebooks: false, personas: false, presets: false, writingStyles: true, state: true,
  })
})

test('session Wiki resolves every section through the matching capability field', () => {
  assert.deepEqual(Object.fromEntries(['character', 'lorebooks', 'persona', 'preset', 'writingStyles', 'state']
    .map(section => [section, sessionSectionCapability(section)])), {
    character: 'characters',
    lorebooks: 'lorebooks',
    persona: 'personas',
    preset: 'presets',
    writingStyles: 'writingStyles',
    state: 'state',
  })
})

test('session binding preserves fields owned by disabled capabilities', async () => {
  let captured
  const sessions = { bindAssetChanges: async (_agent, request) => { captured = request; return { revision: 8 } } }
  const agent = { status: 'idle', session: { header: { agentPreset: 'roleplay' }, events: [] } }
  const ctx = {
    typert: { lookups: { get: () => ({ resolve: async () => agent }) } },
    agentPresets: { serviceFor: () => sessions },
  }
  await dispatch(ctx, 'session/bind', {
    sessionId: 's', expectedRevision: 7, lorebookIds: ['lore-2'],
  })
  assert.deepEqual(captured, {
    expectedRevision: 7,
    changes: { lorebookIds: ['lore-2'] },
  })
})

test('roleplay bootstrap defaults every omitted optional material to unbound', async () => {
  const prepared = await prepareRoleplaySeed({}, {}, bootstrapConfig)
  assert.deepEqual(prepared.profile.resources, { lorebooks: [], writingStyles: [] })
  assert.deepEqual(prepared.seed.map(event => event.type), ['command/run', 'command/done'])
})

test('session binding rejects a roleplay log when its isolated session service is not mounted', async () => {
  const agent = { status: 'idle', ctx: {}, session: { header: { agentPreset: 'roleplay' }, events: [] } }
  const ctx = {
    typert: { lookups: { get: () => ({ resolve: async () => agent }) } },
    agentPresets: { serviceFor: () => undefined },
    rpCharacterCards: {},
    rpLoreBooks: {},
  }
  await assert.rejects(
    dispatch(ctx, 'session/bind', { sessionId: 's', expectedRevision: 0, cardId: null, lorebookIds: [], writingStyleIds: [], openingIndex: 0, openingSource: 'skip' }),
    error => error.code === 'NOT_RP_SESSION',
  )
})

test('session execution mode dispatches through the isolated session service', async () => {
  let captured
  const sessions = { setExecutionMode: async (_agent, request) => { captured = request; return { revision: 4, runtime: { executionMode: request.executionMode } } } }
  const agent = { status: 'idle', session: { header: { agentPreset: 'roleplay' }, events: [] } }
  const ctx = {
    typert: { lookups: { get: () => ({ resolve: async () => agent }) } },
    agentPresets: { serviceFor: (candidate, name) => candidate === agent && name === 'rpSessions' ? sessions : undefined },
  }
  const result = await dispatch(ctx, 'session/execution-mode', { sessionId: 's', expectedRevision: 3, executionMode: 'agent' })
  assert.deepEqual(captured, { expectedRevision: 3, executionMode: 'agent' })
  assert.equal(result.runtime.executionMode, 'agent')
})

test('context build preview and persistence dispatch through Session-owned services', async () => {
  const agent = { status: 'idle', session: { header: { agentPreset: 'roleplay' }, events: [] } }
  let saved
  let messages
  const sessions = { setContextBuild: async (_agent, request) => { saved = request; return { revision: 5, contextBuild: request.contextBuild } } }
  const runtime = { previewContextBuild: async (_agent, value) => { messages = value; return { executionMode: 'chat', slots: [] } } }
  const ctx = {
    typert: { lookups: { get: () => ({ resolve: async () => agent }) } },
    agentPresets: { serviceFor: (candidate, name) => candidate !== agent ? undefined : name === 'rpSessions' ? sessions : name === 'rpRuntime' ? runtime : undefined },
  }
  const layout = { version: 1, slots: [{ id: 'conversation', label: '对话历史', sourceIds: ['rp.conversation'] }] }
  const stored = await dispatch(ctx, 'session/context-build', { sessionId: 's', expectedRevision: 4, contextBuild: layout })
  assert.deepEqual(saved, { expectedRevision: 4, contextBuild: layout })
  assert.equal(stored.revision, 5)
  const preview = await dispatch(ctx, 'session/context-build-preview', { sessionId: 's' })
  assert.equal(preview.executionMode, 'chat')
  assert.equal(messages, undefined)
})

test('character deletion preview reads optional asset services dynamically and does not normalize linked lorebook content', async () => {
  const cardId = '00000000-0000-0000-0000-000000000018'
  const linkedId = '00000000-0000-0000-0000-000000000019'
  const reverseId = '00000000-0000-0000-0000-00000000001a'
  const cards = {
    detail: async () => ({
      id: cardId,
      name: '可删除角色',
      revision: 1,
      embeddedLorebooks: [{ id: linkedId, name: '损坏但有关联的世界书', status: 'managed' }],
    }),
  }
  const lorebooks = {
    listDeletionCandidates: async id => {
      assert.equal(id, cardId)
      return [{ id: reverseId, name: '仅保留反向来源的世界书' }]
    },
  }
  const ctx = {
    get: name => name === 'rpCharacterCards' ? cards : name === 'rpLoreBooks' ? lorebooks : undefined,
    sessions: { list: () => [] },
    sessionPersistence: { list: async () => [] },
    agents: { get: () => undefined },
  }

  const preview = await dispatch(ctx, 'character/delete-preview', { id: cardId })

  assert.deepEqual(preview.lorebooks, [
    { id: reverseId, name: '仅保留反向来源的世界书' },
    { id: linkedId, name: '损坏但有关联的世界书' },
  ])
})

test('character deletion lists live and cold references but deletes assets without opening or rewriting sessions', async () => {
  const cardId = '00000000-0000-0000-0000-000000000020'
  const lorebookId = '00000000-0000-0000-0000-000000000021'
  const unrelatedCardId = '00000000-0000-0000-0000-000000000022'
  const live = { id: 'live-rp', events: profileEvents(cardId) }
  const deletedLorebooks = []
  const deletedCards = []
  const ctx = {
    sessions: { list: () => [live] },
    agents: { get: id => id === live.id ? { status: 'idle' } : undefined },
    sessionPersistence: {
      list: async () => [{ id: 'live-rp' }, { id: 'cold-rp' }, { id: 'other-rp' }],
      inspect: async id => ({ meta: { agentPreset: 'roleplay' }, events: profileEvents(id === 'cold-rp' ? cardId : unrelatedCardId) }),
    },
    workspaceRegistry: { archiveSession: async () => { throw new Error('must not be called') } },
    rpCharacterCards: {
      detail: async () => ({ id: cardId, name: 'Archive Hero', revision: 3, linkedLorebookIds: [lorebookId], embeddedLorebooks: [{ id: lorebookId, name: 'Hero Lore' }] }),
      delete: async id => { deletedCards.push(id); return { id, name: 'Archive Hero' } },
    },
    rpLoreBooks: {
      listDeletionCandidates: async () => [{ id: lorebookId, name: 'Hero Lore' }],
      delete: async id => { deletedLorebooks.push(id) },
    },
  }
  const preview = await dispatch(ctx, 'character/delete-preview', { id: cardId })
  assert.deepEqual(preview.sessions, [
    { id: 'cold-rp', live: false, running: false },
    { id: 'live-rp', live: true, running: false },
  ])
  assert.equal(preview.sessionScanComplete, true)
  assert.deepEqual(preview.lorebooks, [{ id: lorebookId, name: 'Hero Lore' }])

  const result = await dispatch(ctx, 'character/delete', { id: cardId, deleteLinkedLorebooks: true })
  assert.equal(Object.hasOwn(result, 'detachedSessionIds'), false)
  assert.deepEqual(deletedLorebooks, [lorebookId])
  assert.deepEqual(deletedCards, [cardId])
})

test('character deletion proceeds while a referencing session is running', async () => {
  const cardId = '00000000-0000-0000-0000-000000000030'
  const mutations = []
  const ctx = {
    sessions: { list: () => [{ id: 'running-rp', events: profileEvents(cardId) }] },
    agents: { get: () => ({ status: 'running' }) },
    sessionPersistence: { list: async () => [] },
    rpCharacterCards: {
      detail: async () => ({ id: cardId, name: 'Busy Hero', revision: 1, linkedLorebookIds: [], embeddedLorebooks: [] }),
      delete: async id => { mutations.push(`card:${id}`); return { id, name: 'Busy Hero' } },
    },
    rpLoreBooks: { listDeletionCandidates: async () => [], delete: async id => { mutations.push(`lore:${id}`) } },
  }
  const result = await dispatch(ctx, 'character/delete', { id: cardId, deleteLinkedLorebooks: true })
  assert.deepEqual(result.deletedCard, { id: cardId, name: 'Busy Hero' })
  assert.deepEqual(mutations, [`card:${cardId}`])
})

test('character deletion can preserve related lorebooks without loading cold sessions', async () => {
  const cardId = '00000000-0000-0000-0000-000000000040'
  let lorebookDeletes = 0
  const ctx = {
    sessions: { list: () => [] },
    agents: { get: () => undefined },
    sessionPersistence: { list: async () => [{ id: 'cold-only' }], inspect: async () => ({ meta: { agentPreset: 'roleplay' }, events: profileEvents(cardId) }) },
    rpCharacterCards: {
      detail: async () => ({ id: cardId, name: 'Keep Lore', revision: 1, linkedLorebookIds: [], embeddedLorebooks: [] }),
      delete: async id => ({ id, name: 'Keep Lore' }),
    },
    rpLoreBooks: {
      listDeletionCandidates: async () => [{ id: '00000000-0000-0000-0000-000000000041', name: 'Kept' }],
      delete: async () => { lorebookDeletes += 1 },
    },
  }
  const result = await dispatch(ctx, 'character/delete', { id: cardId, deleteLinkedLorebooks: false })
  assert.deepEqual(result.deletedLorebookIds, [])
  assert.deepEqual(result.retainedLorebookIds, [])
  assert.equal(lorebookDeletes, 0)
})

test('character deletion never resumes an archived referencing session', async () => {
  const cardId = '00000000-0000-0000-0000-000000000042'
  const id = 'archived-rp'
  const events = profileEvents(cardId)
  const calls = []
  const ctx = {
    sessions: { list: () => [] },
    sessionPersistence: {
      list: async () => [{ id }],
      inspect: async () => ({ meta: { agentPreset: 'roleplay' }, events }),
    },
    agents: {
      get: () => undefined,
      async resume() { calls.push(['resume']); throw new Error('must not be called') },
    },
    rpCharacterCards: {
      detail: async () => ({ id: cardId, name: 'Archived Hero', revision: 1, linkedLorebookIds: [], embeddedLorebooks: [] }),
      delete: async idToDelete => { calls.push(['delete-card', idToDelete]); return { id: idToDelete, name: 'Archived Hero' } },
    },
    rpLoreBooks: { listDeletionCandidates: async () => [], delete: async () => {} },
  }

  const result = await dispatch(ctx, 'character/delete', { id: cardId, deleteLinkedLorebooks: false })

  assert.deepEqual(result.deletedCard, { id: cardId, name: 'Archived Hero' })
  assert.deepEqual(calls, [['delete-card', cardId]])
})

test('a failed Session scan does not disable preview or asset deletion', async () => {
  const cardId = '00000000-0000-0000-0000-000000000050'
  const assetDeletes = []
  const ctx = {
    sessions: { list: () => [] },
    agents: { get: () => undefined },
    sessionPersistence: { list: async () => { throw new Error('persistence unavailable') } },
    rpCharacterCards: {
      detail: async () => ({ id: cardId, name: 'Retry Hero', revision: 1, linkedLorebookIds: [], embeddedLorebooks: [] }),
      delete: async id => { assetDeletes.push(`card:${id}`); return { id, name: 'Retry Hero' } },
    },
    rpLoreBooks: { listDeletionCandidates: async () => [], delete: async id => { assetDeletes.push(`lore:${id}`) } },
  }
  const preview = await dispatch(ctx, 'character/delete-preview', { id: cardId })
  assert.deepEqual(preview.sessions, [])
  assert.equal(preview.sessionScanComplete, false)
  const result = await dispatch(ctx, 'character/delete', { id: cardId, deleteLinkedLorebooks: true })
  assert.deepEqual(result.deletedCard, { id: cardId, name: 'Retry Hero' })
  assert.deepEqual(assetDeletes, [`card:${cardId}`])
})

test('related lorebook cleanup failures are reported but never roll back card deletion', async () => {
  const cardId = '00000000-0000-0000-0000-000000000060'
  const lorebookId = '00000000-0000-0000-0000-000000000061'
  const assetDeletes = []
  const ctx = {
    sessions: { list: () => [] },
    agents: { get: () => undefined },
    sessionPersistence: { list: async () => [] },
    rpCharacterCards: {
      detail: async () => ({ id: cardId, name: 'Cleanup Hero', revision: 1, linkedLorebookIds: [lorebookId], embeddedLorebooks: [] }),
      delete: async id => { assetDeletes.push(`card:${id}`); return { id, name: 'Cleanup Hero' } },
    },
    rpLoreBooks: {
      listDeletionCandidates: async () => [{ id: lorebookId, name: 'Cleanup Lore' }],
      delete: async id => { assetDeletes.push(`lore:${id}`); throw new Error('read-only filesystem') },
    },
  }
  const result = await dispatch(ctx, 'character/delete', { id: cardId, deleteLinkedLorebooks: true })
  assert.deepEqual(assetDeletes, [`card:${cardId}`, `lore:${lorebookId}`])
  assert.deepEqual(result.deletedLorebookIds, [])
  assert.deepEqual(result.retainedLorebookIds, [lorebookId])
})

test('client helpers preserve keyboard ordering and surface domain error codes', () => {
  assert.deepEqual(moveItem(['a', 'b', 'c'], 2, 0), ['c', 'a', 'b'])
  assert.equal(openingText({ character: { firstMessage: '  夜幕落下。  ' } }), '夜幕落下。')
  assert.equal(openingText({ character: { firstMessage: '一', alternateGreetings: ['二'] } }, 1), '二')
  assert.match(openingText({ character: {} }), /故事舞台/)
  assert.equal(openingModeFromProfile({ scene: { openingSource: 'card', openingText: '角色卡开场。' } }), 'card')
  assert.equal(openingModeFromProfile({ scene: { openingText: '旧版开场。' } }), 'custom')
  assert.equal(openingModeFromProfile({ scene: {} }), 'skip')
  assert.throws(() => domainValue({ ok: true, value: { ok: false, error: { code: 'OPENING_LOCKED', message: 'locked' } } }), error => error.code === 'OPENING_LOCKED')
})

test('状态详情优先展示有内容的本轮变化并按分组准确计数', () => {
  const activity = {
    available: true,
    namespaces: {
      story: [{ path: '/weather' }, { path: '/clock' }],
      affection: [{ path: '/leanna' }],
    },
  }
  assert.equal(stateActivityTotalCount(activity), 3)
  assert.equal(stateActivityChanges(activity, 'story').length, 2)
  assert.deepEqual(stateActivityChanges(activity, 'missing'), [])
  assert.equal(preferredStateDetailView(activity, 'affection'), 'changes')
  assert.equal(preferredStateDetailView(activity, 'missing'), 'current')
  assert.equal(stateActivityTotalCount({ namespaces: null }), 0)
})

test('当前状态按实际展示的末级变量计数', () => {
  assert.equal(countStateItems({
    world: { date: '8月15日', location: '港口' },
    character: { hp: 80, conditions: ['紧张', '疲惫'] },
  }), 5)
  assert.equal(countStateItems({ emptyObject: {}, emptyList: [] }), 0)
  assert.equal(countStateItems(null), 1)
})

test('会话界面只要求会话设置存在，不要求绑定任一共享资料', () => {
  const blank = { blank: true, composerPhase: 'blank' }
  const active = { blank: false, composerPhase: 'active' }
  const openingVisibleBeforeBlankMirror = { blank: true, composerPhase: 'active' }
  const profile = { resources: { card: { id: 'card-1' }, lorebooks: [] } }
  const emptyProfile = { resources: { lorebooks: [], writingStyles: [] } }
  assert.equal(sessionSurfaceState(false, blank, undefined), 'hidden')
  assert.equal(sessionSurfaceState(true, blank, undefined), 'setup')
  assert.equal(sessionSurfaceState(true, blank, null), 'setup')
  assert.equal(sessionSurfaceState(true, blank, profile), 'active')
  assert.equal(sessionSurfaceState(true, blank, emptyProfile), 'active')
  assert.equal(sessionSurfaceState(true, active, profile), 'active')
  assert.equal(sessionSurfaceState(true, active, emptyProfile), 'active')
  assert.equal(sessionSurfaceState(true, openingVisibleBeforeBlankMirror, profile), 'active')
  assert.equal(sessionSurfaceState(true, active, null), 'recover')
  assert.equal(shouldShowSkippedOpeningNotice(blank, { scene: { openingSource: 'skip' } }), true)
  assert.equal(shouldShowSkippedOpeningNotice(blank, { scene: {} }), true)
  assert.equal(shouldShowSkippedOpeningNotice(blank, null), false)
  assert.equal(shouldShowSkippedOpeningNotice(active, { scene: { openingSource: 'skip' } }), false)
  assert.equal(shouldShowSkippedOpeningNotice(blank, { scene: { openingSource: 'card', openingText: '开场。' } }), false)
  assert.equal(sessionBlockReason('setup'), '请先完成故事设置')
  assert.equal(sessionBlockReason('recover'), '请先恢复故事设置')
  assert.equal(sessionBlockReason('active'), undefined)
})

function resetFixture({ phase = 'blank', workspace = true, reusable = true } = {}) {
  const calls = []
  let composerPhase = phase
  const byId = {
    'rp-session': { id: 'rp-session', projectionValues: { agentPreset: 'roleplay' }, blank: true, cwd: '/workspace/roleplay' },
    ...(reusable ? { 'source-session': { id: 'source-session', projectionValues: { agentPreset: 'default' }, blank: true, cwd: '/workspace/roleplay' } } : {}),
  }
  const sessions = {
    list: { getSnapshot: () => ({ current: 'rp-session', ids: Object.keys(byId), byId }) },
    binding: id => id === 'rp-session' ? { session: { getSnapshot: () => ({ composerPhase, running: false }) } } : undefined,
    create: async input => { calls.push(['create', input]); return 'fresh-session' },
    open: id => { calls.push(['open', id]) },
    clear: () => { calls.push(['clear']) },
  }
  const workspaces = {
    list: { getSnapshot: () => ({
      baselinesReady: true,
      archivedSessionIds: [],
      items: workspace ? [{ workspaceId: 'workspace-1', path: '/workspace/roleplay', sessionIds: Object.keys(byId) }] : [],
    }) },
    archiveSession: async id => { calls.push(['archive', id]) },
  }
  return { sessions, workspaces, calls, setPhase: value => { composerPhase = value } }
}

test('重置空白 Roleplay 对话后复用同工作区的普通新对话', async () => {
  const fixture = resetFixture()
  const result = await resetBlankRoleplaySession({ sessionId: 'rp-session', sessions: fixture.sessions, workspaces: fixture.workspaces })
  assert.equal(result, 'source-session')
  assert.deepEqual(fixture.calls, [['archive', 'rp-session'], ['open', 'source-session']])
})

test('重置会在没有可复用空白对话时先准备新的工作区对话', async () => {
  const fixture = resetFixture({ reusable: false })
  const result = await resetBlankRoleplaySession({ sessionId: 'rp-session', sessions: fixture.sessions, workspaces: fixture.workspaces })
  assert.equal(result, 'fresh-session')
  assert.deepEqual(fixture.calls, [
    ['create', { workspaceId: 'workspace-1' }],
    ['archive', 'rp-session'],
    ['open', 'fresh-session'],
  ])
})

test('重置在异步准备期间检测到第一条消息后停止且不收起对话', async () => {
  const fixture = resetFixture({ reusable: false })
  fixture.sessions.create = async input => {
    fixture.calls.push(['create', input])
    fixture.setPhase('active')
    return 'fresh-session'
  }
  await assert.rejects(
    resetBlankRoleplaySession({ sessionId: 'rp-session', sessions: fixture.sessions, workspaces: fixture.workspaces }),
    error => error.code === 'RP_RESET_NOT_BLANK',
  )
  assert.deepEqual(fixture.calls, [['create', { workspaceId: 'workspace-1' }]])
  assert.equal(userErrorMessage({ code: 'RP_RESET_NOT_BLANK' }, 'reset'), '这个对话已经开始，不能再重置。请新建对话后重新选择。')
})

test('重置未分组空白对话后回到未选择对话的初始状态', async () => {
  const fixture = resetFixture({ workspace: false, reusable: false })
  const result = await resetBlankRoleplaySession({ sessionId: 'rp-session', sessions: fixture.sessions, workspaces: fixture.workspaces })
  assert.equal(result, undefined)
  assert.deepEqual(fixture.calls, [['archive', 'rp-session'], ['clear']])
})

test('用户界面错误文案不暴露服务端错误码和内部消息', () => {
  assert.equal(userErrorMessage({ code: 'ASSET_NOT_FOUND', message: 'uuid missing' }, 'save'), '所选资料已经不存在，请重新选择。')
  assert.equal(userErrorMessage({ code: 'REVISION_CONFLICT', message: 'expected 1 current 2' }, 'save'), '故事资料刚刚发生了变化，请重新确认后再保存。')
  assert.equal(userErrorMessage({ code: 'RP_CONTEXT_SOURCE_REQUIRED' }, 'save'), '这个分组必须参与回复，不能放入闲置区。')
  assert.equal(userErrorMessage({ code: 'DUPLICATE_CARD', message: 'hash abc' }, 'import'), '这份资料已经在资料库中。')
  assert.equal(userErrorMessage({ code: 'WORKSPACE_ATTACH_FAILED', message: 'storage failed' }, 'save'), '对话已创建，但未能加入当前工作区。请在“未分组”中打开它。')
  assert.equal(userErrorMessage({ code: 'ASSET_CORRUPT' }, 'context-preview'), '当前回复资料无法完整读取，请检查会话资料后重试。')
  assert.equal(userErrorMessage(new Error('socket failed'), 'detail'), '暂时无法读取这份资料，请重新选择。')
})

test('资料已创建但未绑定时明确报告部分成功且不会诱导重复创建', () => {
  assert.equal(assetKindLabel('writingStyle'), '文风')
  assert.equal(createdAssetBindingMessage('persona', { applied: true }), '我的人设已创建并用于当前对话。')
  assert.equal(
    createdAssetBindingMessage('preset', { applied: false, error: { code: 'REVISION_CONFLICT' } }),
    '创作预设已创建到资料库，但当前对话的资料刚刚发生变化，因此没有自动使用。请在“更换创作预设”中重新选择。',
  )
  assert.equal(
    createdAssetBindingMessage('writingStyle', { applied: false, error: { code: 'LIMIT_EXCEEDED' } }),
    '文风已创建到资料库，但当前对话已达到文风数量上限。请先移除一项，再选择这项文风。',
  )
})

function profileEvents(cardId) {
  const profile = {
    revision: 1,
    resources: { card: { id: cardId }, lorebooks: [] },
    mode: 'adaptive',
    cast: [],
  }
  return [
    { seq: 0, type: 'command/run', data: { commandId: `bind-${cardId}`, name: 'rp-session-apply', args: encodeSessionCommand(0, profile) } },
    { seq: 1, type: 'command/done', data: { commandId: `bind-${cardId}`, kind: 'success' } },
  ]
}

test('character selection defaults linked lorebooks while preserving additional choices', () => {
  const character = { id: 'card-2', linkedLorebookIds: ['linked-explicit', 'deleted-explicit'] }
  const lorebooks = [
    { id: 'linked-explicit', sourceCharacterId: null },
    { id: 'linked-origin', sourceCharacterId: 'card-2' },
    { id: 'old-linked', sourceCharacterId: 'card-1' },
    { id: 'extra', sourceCharacterId: null },
  ]
  assert.deepEqual(selectCharacterLore(['old-linked', 'extra'], ['old-linked'], character, lorebooks), {
    automaticLore: ['linked-explicit', 'linked-origin'],
    selectedLore: ['extra', 'linked-explicit', 'linked-origin'],
  })
})


test('会话设置与会话 Wiki 不承担资料创建、导入或编辑', async () => {
  const client = await readFile(new URL('../src/client.js', import.meta.url), 'utf8')
  const styles = await readFile(new URL('../src/client.module.css', import.meta.url), 'utf8')
  assert.doesNotMatch(client, /className: css\.fileInput|importFiles|SessionAssetEditorHost/)
  assert.doesNotMatch(client, /编辑当前角色卡|新建世界书|调整使用顺序|更换人设|更换预设|调整文风与顺序/)
  assert.doesNotMatch(styles, /\.fileInput|\.importButton|\.uploadStrip/)
  assert.match(client, /资料空缺或失效时可在这里重新绑定，内容编辑仍在侧栏资料库中完成/)
  assert.doesNotMatch(client, /附带 .*世界设定/)
  assert.match(client, /关联世界书 · \$\{item\.lorebookEntries\} 条设定/)
})

test('会话资料选择复用列表与详情请求，头像仅预取可见区', async () => {
  const client = await readFile(new URL('../src/client.js', import.meta.url), 'utf8')
  assert.match(client, /const listRequests = useRef\(new Map\(\)\)/)
  assert.match(client, /cachedListRequest\(listRequests\.current, connection/)
  assert.match(client, /cachedDetailRequest\(detailRequests\.current, connection/)
  assert.match(client, /useInView\(avatarRef, \{ margin: '200px 0px', once: true \}\)/)
  assert.match(client, /const RESOURCE_REQUEST_CACHE_LIMIT = 32/)
  assert.match(client, /while \(cache\.size > RESOURCE_REQUEST_CACHE_LIMIT\)/)
  assert.match(client, /const CHARACTER_AVATAR_CACHE_LIMIT = 16/)
})

test('资料导航、会话 Wiki 与 Prompt 入口清晰分工且不泄漏内部错误', async () => {
  const client = await readFile(new URL('../src/client.js', import.meta.url), 'utf8')
  const sessionWiki = await readFile(new URL('../src/session-wiki.js', import.meta.url), 'utf8')
  const contextCanvas = await readFile(new URL('../src/context-canvas.js', import.meta.url), 'utf8')
  const styles = await readFile(new URL('../src/client.module.css', import.meta.url), 'utf8')
  assert.match(client, /'aria-label': '角色扮演资料'/)
  assert.match(client, /renderSlot\('rp-assets\.preset-entry'/)
  assert.match(client, /renderSlot\('rp-assets\.preset-entry'.*renderSlot\('rp-assets\.writing-style-entry'.*renderSlot\('rp-assets\.character-entry'.*renderSlot\('rp-assets\.lore-entry'.*renderSlot\('rp-assets\.persona-entry'/s)
  assert.match(client, /function SessionResourceSelectors/)
  assert.match(client, /function SessionResourcePicker/)
  assert.match(client, /className: css\.sessionResourceHeader/)
  assert.match(client, /className: css\.sessionResourceFields/)
  assert.ok(client.indexOf("h('div', { className: css.libraryToolbar") < client.indexOf('h(SessionResourceSelectors'), '角色卡与世界书选择区应位于人设、预设和文风之前')
  assert.doesNotMatch(client, /tab === 'characters' \? '新建角色卡' : '新建世界书'/)
  assert.match(styles, /\.sessionResourceFields \{ display: grid; grid-template-columns: repeat\(auto-fit, minmax\(180px, 1fr\)\)/)
  assert.match(styles, /\.sessionResourcePicker:focus-visible/)
  assert.match(styles, /\.libraryGrid\[data-selection-only="true"\] \{ min-height: 220px; flex: 1 1 320px;/)
  assert.match(client, /cachedListRequest\(listRequests\.current, connection, 'personas\/list'/)
  assert.match(client, /cachedListRequest\(listRequests\.current, connection, 'presets\/list'/)
  assert.match(client, /cachedListRequest\(listRequests\.current, connection, 'writing-styles\/list'/)
  assert.match(client, /const defaultsApplied = useRef\(false\)/)
  assert.match(client, /setSelectedPersona\(personas\.defaultId \?\? null\)/)
  assert.match(client, /setSelectedPreset\(presets\.defaultId \?\? null\)/)
  assert.match(client, /setSelectedWritingStyles\(writingStyles\.defaultId == null \? \[\] : \[writingStyles\.defaultId\]\)/)
  assert.match(client, /defaultWritingStyleId: writingStyles\.defaultId \?\? null/)
  assert.match(client, /title: '恢复资料库中的默认人设、预设和文风'/)
  assert.match(client, /personaId: selectedPersona/)
  assert.match(client, /presetId: selectedPreset/)
  assert.match(client, /writingStyleIds: selectedWritingStyles/)
  assert.match(client, /const writingStyleOptions = \[\.\.\.writingStyles, \.\.\.unavailableWritingStyles\]/)
  assert.match(client, /const steps = \[\['assets', '1', '设置'\], \['opening', '2', '开场白'\]\]/)
  assert.doesNotMatch(client, /step === 'styles'|function WritingStyleStep|选择这次故事的文风/)
  assert.match(client, /step === 'opening'/)
  assert.match(client, /title: '从角色卡选择'/)
  assert.match(client, /title: '自定义'/)
  assert.match(client, /title: '跳过'/)
  assert.match(client, /setOpeningMode\(openingModeFromProfile\(profile\)\)/)
  assert.match(client, /openingMode === 'skip'[\s\S]*?openingText: selectedOpening/)
  assert.match(client, /customOpeningCharacters > MAX_OPENING_CHARACTERS/)
  assert.doesNotMatch(client, /新建角色卡|导入角色卡|新建人设|新建预设|新建文风/)
  assert.match(client, /'aria-label': `上移文风/)
  assert.match(client, /'文风应用顺序'/)
  assert.match(client, /'所选文风按顺序排列'/)
  assert.doesNotMatch(client, /靠前的文风先参与生成/)
  assert.match(client, /footer: multiple \? \[\{ id: FINISH_RESOURCE_SELECTION, label: '完成' \}\]/)
  assert.doesNotMatch(styles, /\.setupSteps:has\(li:nth-child\(3\)\)|\.writingStyleStep|\.writingStyleChoices/)
  assert.doesNotMatch(client, /sourceSectionLabel|>事实源<|'事实源'/)
  assert.match(client, /name: 'conversation\.input\.left', id: 'rp-session-context'/)
  assert.match(client, /name: 'conversation\.session\.header\.utilities', id: 'rp-story-library'/)
  assert.match(client, /export const inject = \['slots', 'rpRemote', 'conversation', 'uiConversation', 'sessions', 'workspaces'\]/)
  assert.match(client, /workspaces: ctx\.workspaces/)
  assert.doesNotMatch(client, /id: 'rp-story-create'|function RpStoryCreator|css\.storyCreate/)
  assert.match(client, /h\(SetupPrompt, \{ onClick: \(\) => setOpen\(true\), mode: 'setup' \}\)/)
  assert.match(client, /rpc\(connection, 'session\/create'/)
  assert.doesNotMatch(client, /chatPresentation|registerNodeVisibilityPolicy|registerAssistantBlockVisibilityPolicy/)
  assert.match(client, /name: 'conversation\.chat\.commandview', key: RP_SESSION_APPLY_COMMAND/)
  assert.doesNotMatch(client, /key: 'rp-state-patch'/)
  assert.doesNotMatch(styles, /hiddenSessionMutationCommand/)
  assert.match(client, /function RpStoryLibraryControl/)
  assert.doesNotMatch(client, /useProjection\('rp\/memory'\)/)
  assert.match(client, /useProjection\('rp\/state'\)/)
  assert.match(client, /sessionSurfaceState\(roleplay, session, profile\)/)
  assert.match(client, /composerPhase: state\.composerPhase/)
  assert.match(client, /surface === 'setup'/)
  assert.match(client, /surface === 'recover'/)
  assert.match(client, /surface !== 'active'/)
  assert.match(client, /id: 'character', label: '角色卡', icon: h\(IconCharacterCardOutline16/)
  assert.match(client, /id: 'lorebooks', label: '世界书'/)
  assert.match(client, /id: 'persona', label: '我的人设'/)
  assert.match(client, /id: 'preset', label: '创作预设'/)
  assert.match(client, /id: 'writingStyles', label: '文风'/)
  assert.doesNotMatch(client, /id: 'memory', label: '记忆'/)
  assert.match(client, /id: 'state', label: '状态'/)
  assert.match(client, /\.map\(item => \(\{ \.\.\.item, capability: sessionSectionCapability\(item\.id\) \}\)\)/)
  assert.match(client, /available: capabilities\?\.\[sessionSectionCapability\(section\)\] === true/)
  assert.match(client, /function StateValueView/)
  assert.match(client, /function StateRuleCatalog/)
  assert.match(client, /function StateDiagnostics/)
  assert.match(client, /schema\?\.description/)
  assert.match(client, /范围：\$\{schema\.minimum/)
  assert.match(client, /'rules-required': '按规则更新'/)
  assert.doesNotMatch(client, /stateRequired|必填字段/)
  assert.doesNotMatch(styles, /\.stateRequired/)
  assert.doesNotMatch(client, /value\.length === 2 && typeof value\[1\] === 'string'/)
  assert.doesNotMatch(client, /createStatePatch|session\/state-patch|DirtyBar|Inspector/)
  assert.match(client, /if \(!open\) return[\s\S]*?setPendingRevision\(null\)[\s\S]*?setSelectedCard/)
  assert.match(client, /if \(!open \|\| pendingRevision === null[\s\S]*?setPendingRevision\(null\)\s*onClose\(\)/)
  assert.match(client, /开始一段故事/)
  assert.match(client, /恢复故事设置/)
  assert.match(client, /资料不用一次备齐，开始后也能随时补充/)
  assert.match(client, /暂不使用角色卡/)
  assert.doesNotMatch(client, /const needsProfile = profile == null/)
  assert.doesNotMatch(client, /disabled: saving \|\| pendingRevision !== null \|\| selectedCard === null/)
  assert.doesNotMatch(client, /revision \$\{|按命名空间|Runtime 会/)
  assert.doesNotMatch(client, /label: '来源'|detail\.source\?\.format/)
  assert.doesNotMatch(client, /useDeferredAutoOpen|MutationObserver|shouldAutoOpenSetup/)
  assert.doesNotMatch(client, /\$\{error\.code|data\.failure\.code|item\.error/)
  assert.doesNotMatch(client, /function RpSessionContextControl\(props\)[\s\S]{0,180}blocks/)
  assert.doesNotMatch(client, /本轮已完成|故事回复|referenceCount|data\.contexts/)
  assert.match(client, /uiConversation\.events\.register\(roleplayRunMarkerDefinition\)/)
  assert.match(client, /name: 'conversation\.chat\.node', key: 'rp-run-marker'/)
  assert.doesNotMatch(client, /runNodeNarrative|streaming-narrative/)
  assert.match(styles, /\[data-chat-flow-kind="rp-run-marker"\] \{ display: none; \}/)
  assert.match(styles, /\[data-rp-library-inactive-open-trace\] \{ display: none; \}/)
  assert.doesNotMatch(styles, /:global\(/)
  assert.doesNotMatch(client, /useProjection\('rp\/canvas'\)/)
  assert.match(client, /function PromptTrigger/)
  assert.doesNotMatch(client, /function RuntimeTrigger|function RuntimeModal|Agent Canvas/)
  assert.match(client, /surface === 'active' && shouldShowSkippedOpeningNotice\(session, profile\)/)
  assert.match(client, /surface === 'hidden' \|\| \(surface === 'active' && !showSkippedOpeningNotice\)/)
  assert.match(client, /surface === 'setup'[\s\S]*?mode: 'setup'[\s\S]*?mode: 'recover'/)
  assert.doesNotMatch(client, /SessionSettingsTrigger|确认本次会话设置|检查会话设置/)
  assert.match(client, /function SkippedOpeningNotice/)
  assert.match(client, /会话已准备好/)
  assert.match(client, /已跳过开场白/)
  assert.match(client, /直接发送第一条消息即可开始/)
  assert.match(client, /重置这个空白对话/)
  assert.match(client, /重置后可以重新选择模式或角色卡/)
  assert.match(client, /角色卡、世界书、人设、预设和文风不会从资料库删除/)
  assert.match(client, /resetBlankRoleplaySession\(\{ sessionId, sessions, workspaces \}\)/)
  assert.doesNotMatch(client, /归档/)
  assert.match(client, /intent: surface === 'setup' \? 'create' : showSkippedOpeningNotice \? 'wiki' : 'settings'/)
  assert.match(client, /'session\/create', \{ sourceSessionId: sessionId, \.\.\.request \}/)
  assert.match(client, /function RpMobileWorkbenchControl[\s\S]*?className: css\.workbenchMobileControls[\s\S]*?h\(ExecutionModeSwitch, \{ connection, sessionId, session, profile, compact: true \}\)[\s\S]*?h\(SessionWikiTrigger/)
  assert.doesNotMatch(client, /revisitingSetup/)
  assert.match(client, /const guided = creating \|\| setup \|\| recovery/)
  assert.match(client, /const includesOpening = creating \|\| setup/)
  assert.match(client, /\.\.\.\(includesOpening \? \{[\s\S]*?openingIndex,[\s\S]*?openingSource: openingMode,[\s\S]*?openingText: selectedOpening,[\s\S]*?: \{\}\)/)
  assert.match(client, /onClick: includesOpening && step !== 'opening' \? onNext : onSave/)
  assert.doesNotMatch(client, /settingsMode|editingBindings|selectingAssets/)
  assert.doesNotMatch(client, /SessionSettingsIntro|选择这次对话要使用的资料/)
  assert.match(client, /'恢复默认'/)
  assert.match(client, /item\.isDefault \? '（默认）'/)
  assert.match(client, /title: creating \? '开始一段故事' : recovery \? '恢复会话设置' : '会话 Wiki'/)
  assert.match(client, /closeLabel: creating \? '关闭故事创建' : recovery \? '关闭恢复设置'/)
  assert.match(client, /'data-selection-only': 'true'/)
  assert.match(client, /function PromptModal/)
  assert.match(client, /'aria-label': '打开写作 prompt'/)
  assert.doesNotMatch(client, /自动选择/)
  assert.match(client, /'aria-label': '打开会话 Wiki'/)
  assert.equal(client.match(/className: css\.dockArrow, 'aria-hidden': true/g)?.length, 2)
  assert.doesNotMatch(client, /h\('span', null, status\)|h\('span', null, detail\)/)
  assert.match(styles, /\.dockArrow \{ color: var\(--dsw-alias-label-tertiary\); \}/)
  assert.doesNotMatch(styles, /\.workbenchDock > span:not/)
  assert.doesNotMatch(contextCanvas, /下次回复会参考什么/)
  assert.match(contextCanvas, /回复资料顺序/)
  assert.doesNotMatch(contextCanvas, /资料设置|更新预览|更新中…/)
  assert.match(contextCanvas, /return h\(ChatBuilder, \{ preview, profile, session, sessionId, connection \}\)/)
  assert.doesNotMatch(contextCanvas, /AgentIngredients|AgentSourceCard|selectContentSources/)
  assert.match(contextCanvas, /\['character', '角色卡'\].*\['conversation', '对话内容'\]/s)
  assert.match(contextCanvas, /id === 'rp\.current-input'/)
  assert.doesNotMatch(contextCanvas, /\['opening', '开场白'\]/)
  assert.match(contextCanvas, /\['state', '会话变量'\].*\['lore', '世界书'\]/s)
  assert.match(contextCanvas, /source\?\.id === 'rp\.state'\) return '尚未初始化'/)
  assert.match(contextCanvas, /\['persona', '我的人设'\].*\['preset', '创作预设'\].*\['writing-style', '文风'\]/s)
  assert.match(contextCanvas, /function SourceTypeIcon/)
  assert.match(contextCanvas, /IconPromptSourceOutline16/)
  assert.match(contextCanvas, /type: iconName/)
  assert.match(contextCanvas, /'aria-label': '回复资料类型说明'/)
  assert.match(styles, /\.sourceTypeIcon > svg \{ display: block; width: 14px; height: 14px; \}/)
  assert.match(styles, /data-tone="lore"[^}]*--prompt-tone: #047857;/)
  assert.match(styles, /data-tone="persona"[^}]*--prompt-tone: #c2410c;/)
  assert.match(contextCanvas, /function PromptPreview/)
  assert.match(contextCanvas, /function PreviewModeSwitch/)
  assert.match(contextCanvas, /function SectionTagSwitch/)
  assert.match(contextCanvas, /\['cards', '资料卡片'\], \['plain', '纯文本'\]/)
  assert.match(contextCanvas, /className: css\.promptPlainText/)
  assert.match(contextCanvas, /renderPlainPromptPreview\(visibleSlots, sources\)/)
  assert.match(contextCanvas, /renderPromptSlotPreview\(slot, sources\)/)
  assert.match(contextCanvas, /previewIncludedSourceIds\(sources\.values\(\), preview\.contexts \?\? \[\]\)/)
  assert.match(contextCanvas, /本轮用户消息会在开始生成时填入。/)
  assert.doesNotMatch(contextCanvas, /data-composer-card|draftText/)
  assert.match(contextCanvas, /function CustomPromptEditor/)
  assert.match(contextCanvas, /'分组名称'/)
  assert.match(contextCanvas, /'资料内容'/)
  assert.match(contextCanvas, /serializePromptContextBuild\(slots\)/)
  assert.match(contextCanvas, /为\$\{slot\.label\}保留分组标签/)
  assert.match(contextCanvas, /onSlotSectionTagChange\(slot\.id, value\)/)
  assert.match(contextCanvas, /<section name=/)
  assert.match(contextCanvas, /这里的内容只属于当前对话，保存后会从下一次回复开始生效。/)
  assert.doesNotMatch(contextCanvas, /事实性内容|指导性内容|辅助性内容/)
  assert.match(contextCanvas, /splitPromptPreview\(source\)/)
  assert.match(contextCanvas, /id === 'rp\.preset' \|\| id\.startsWith\('rp\.preset:'\)/)
  assert.match(contextCanvas, /拖动左侧手柄排序，拖动分组名称可移入闲置区；拖动资料可更换分组。会话总结、对话历史和当前输入始终启用。/)
  assert.match(contextCanvas, /function IdleSlotArea/)
  assert.match(contextCanvas, /拖动分组名称到这里/)
  assert.doesNotMatch(contextCanvas, /拖动分组左侧手柄到这里/)
  assert.match(contextCanvas, /application\/x-rp-prompt-slot/)
  assert.match(contextCanvas, /promptSlotCanIdle\(slot, sources\)/)
  assert.match(contextCanvas, /'始终使用'/)
  assert.match(contextCanvas, /const idleDragProps = canIdle && !disabled/)
  assert.match(contextCanvas, /'data-idle-draggable': 'true'/)
  assert.match(contextCanvas, /'data-idle-restore-active': restoringIdleSlot \? 'true' : 'false'/)
  assert.match(contextCanvas, /\$\{slot\.label\}，闲置；拖动回到回复资料区，或按回车键恢复使用/)
  assert.doesNotMatch(contextCanvas, /slotIdleAction|将\$\{slot\.label\}移到闲置区|恢复使用\$\{slot\.label\}/)
  assert.doesNotMatch(contextCanvas, /rp\.session|会话框架/)
  assert.doesNotMatch(contextCanvas, /条消息 · 固定/)
  assert.match(contextCanvas, /source\?\.id === 'rp\.conversation'/)
  assert.doesNotMatch(contextCanvas, /open: sourceIndex === 0/)
  assert.match(contextCanvas, /'data-tone': slotTone\(slot, sources\)/)
  assert.doesNotMatch(client, /'YOUR STORY'|'自适应叙事'|\['chat', '直接回复'\]|\['agent', '自主推进'\]/)
  assert.match(client, /role: 'switch'/)
  assert.match(client, /当前为\$\{current === 'chat' \? 'Chat，速度更快' : 'Agent，能力更强但消耗更多额度'\}/)
  assert.match(client, /className: css\.modeLabel, 'data-active': current === 'chat'[\s\S]*?\}, 'Chat'\)/)
  assert.match(client, /className: css\.modeLabel, 'data-active': current === 'agent'[\s\S]*?\}, 'Agent'\)/)
  assert.match(client, /h\(ModeEnergy, \{ key: current, mode: current \}\)/)
  assert.match(client, /const reduced = useReducedMotion\(\)/)
  assert.match(client, /if \(mode === 'chat' \|\| reduced\) return h\('span', \{ className: css\.modeEnergy, 'data-mode': mode \}\)/)
  assert.doesNotMatch(client, /feTurbulence|feColorMatrix|modeElectric|pathOffset|modeFireParticle|modeFlameTongue/)
  assert.match(client, /className: css\.modeFireAura[\s\S]*?duration: 8\.4[\s\S]*?className: css\.modeFireSweep[\s\S]*?duration: 5\.6[\s\S]*?className: css\.modeFireSurface/)
  assert.doesNotMatch(client, /ModeGlyph|modeGlyph/)
  assert.doesNotMatch(client, /这个 Session|下一楼层|运行中不可调整|角色绑定已锁定|正在同步|上下文画布|下一次构建|提交结果|Extensions（只读）|隔离提示词|模型上下文/)
  assert.doesNotMatch(client, /Prompt 拼接|Agent Runtime|运行时选择|区块顺序|发送结构/)
  assert.doesNotMatch(contextCanvas, /Prompt 拼接|Agent Runtime|运行时选择|Prompt 区块|当前 Session|Session Log|本楼层|会话投影|共享事实|运行时原料|PROMPT COMPOSER|DRAG TO REORDER|AVAILABLE SOURCES|COMPILED PREVIEW|发送给模型的结构|rp_runtime_context|context_slot/)
  assert.match(client, /h\('div', \{ className: css\.headerContextControls \},[\s\S]*?h\(PromptTrigger[\s\S]*?h\(SessionWikiTrigger/)
  assert.match(client, /h\('div', \{ className: css\.contextControls \},\s*h\(ExecutionModeSwitch/)
  assert.match(styles, /max-width: var\(--dsh-composer-card-max-width\)/)
  assert.match(styles, /\.modeThumb \{/)
  assert.doesNotMatch(styles, /\.modeElectric/)
  assert.match(styles, /\.modeFireAura,/)
  assert.match(styles, /\.modeFireSweep \{/)
  assert.match(styles, /\.modeFireSurface \{/)
  assert.doesNotMatch(styles, /\.modeGlyph/)
  assert.match(styles, /\.modeThumb\[data-mode="chat"\]/)
  assert.match(styles, /\.modeThumb\[data-mode="agent"\]/)
  assert.match(styles, /\.workbenchDock\[data-kind="wiki"\]/)
  assert.doesNotMatch(styles, /\.sessionSettingsCard|\.sessionSettingsStatus/)
  assert.match(styles, /\.skippedOpeningNotice \{[^}]*min-height: 72px;[^}]*grid-template-columns: 40px minmax\(0, 1fr\) auto;/)
  assert.match(styles, /\.skippedOpeningAction \{/)
  assert.match(styles, /\.skippedOpeningActions \{/)
  assert.match(styles, /\.skippedOpeningReset \{/)
  assert.match(styles, /\.resetDialog \{/)
  assert.match(styles, /\.resetConfirmAction:not\(:disabled\)/)
  assert.match(styles, /\.workbenchMobileControls \{ display: grid; grid-template-columns: minmax\(0, 1fr\) repeat\(2, 44px\); width: calc\(100% - var\(--dsh-composer-side-clearance\) - var\(--dsh-composer-side-clearance\)\); max-width: var\(--dsh-composer-card-max-width\); align-items: center; justify-content: end;/)
  assert.match(styles, /\.mobileWorkbenchDock \{ display: grid; width: 44px; height: 44px;/)
  assert.match(styles, /\.mobileWorkbenchDock > strong,[\s\S]*?\.mobileWorkbenchDock > span \{ display: none; \}/)
  assert.match(styles, /\.promptLegend \{/)
  assert.doesNotMatch(styles, /\.runtimeCanvas|\.runtimeNode|\.canvasEdges|\.nodeInspector/)
  assert.match(styles, /\.previewModeSwitch \{/)
  assert.match(styles, /\.promptSlotPreviewBody \{/)
  assert.match(styles, /\.promptSlotTagControl \{/)
  assert.match(styles, /\.sectionTagSwitch \{/)
  assert.match(styles, /\.promptPlainText \{/)
  assert.doesNotMatch(styles, /data-tone="opening"/)
  assert.doesNotMatch(styles, /\.sourceSectionLabel|\.guideButton|\.referenceIntro/)
  assert.doesNotMatch(styles, /\.contextTabs \{/)
  assert.match(styles, /\.stateBrowser \{/)
  assert.doesNotMatch(client, /function SessionAssetEditorHost/)
  assert.match(client, /new AssetEditorRegistry\(\)/)
  assert.match(client, /reflect\.provide\('rpAssetEditors'/)
  assert.doesNotMatch(client, /function SessionAssetEditor\(/)
  assert.doesNotMatch(client, /function AssetEditorFields/)
  assert.match(client, /function SessionSharedAssetPanel/)
  assert.match(client, /function SessionWikiOverview/)
  assert.match(sessionWiki, /function SessionDocumentBrowser/)
  assert.doesNotMatch(client, /function MemoryPanel\(/)
  assert.match(client, /const STATE_ACTIVITY_PROJECTION_KEY = 'rp\/state\/activity'/)
  assert.match(client, /function SessionStatePanel\(\{ state, activity, available \}\)/)
  assert.match(client, /function StateViewTabs\(\{ value, onChange, currentCount, changeCount \}\)/)
  assert.match(client, /preferredStateDetailView\(activity, selected\)/)
  assert.match(client, /role: 'tablist', 'aria-label': '状态详情'/)
  assert.match(client, /event\.key === 'ArrowRight'[\s\S]*?event\.key === 'ArrowLeft'[\s\S]*?event\.key === 'Home'[\s\S]*?event\.key === 'End'/)
  assert.match(client, /role: 'tabpanel', 'aria-label': '本轮变化'/)
  assert.match(client, /role: 'tabpanel', 'aria-label': '当前状态'/)
  assert.match(client, /function StateChangeSummary\(\{ namespace, snapshot, activity \}\)/)
  assert.match(client, /'本轮变量变化'/)
  assert.match(client, /'最近一次成功回复'/)
  assert.match(client, /`\$\{counts\.state\} 组 · 本轮 \$\{stateChanges\}`/)
  assert.match(client, /function stateChangeOperationLabel/)
  assert.match(client, /function stateChangePathLabel/)
  assert.match(styles, /\.stateViewTabs \{ display: grid;[^}]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/)
  assert.match(styles, /\.stateViewTabs \{ display: grid; width: min\(340px, calc\(100% - 40px\)\);/)
  assert.match(styles, /\.semanticStateRow \{ display: grid; grid-template-columns: minmax\(88px, 116px\) minmax\(0, 1fr\); align-items: start;/)
  assert.match(styles, /\.semanticStateRow strong \{[^}]*padding-top: 8px;/)
  assert.match(client, /'data-root': root \? 'true' : undefined/)
  assert.match(styles, /\.semanticStateGroup\[data-root="true"\] \{ padding-top: 0; \}/)
  assert.match(client, /function StateValueView\(\{ value, label, schema, rules = \[\], path = '', root = false, trail = \[\] \}\)/)
  assert.match(client, /const currentTrail = root \? trail : \[\.\.\.trail, label\]/)
  assert.match(client, /const flushDirectFields = \(\) => \{[\s\S]*?blocks\.push\(h\(StateValueGroup,[\s\S]*?directFields\.map\(childElement\)/)
  assert.match(client, /if \(!isComplex\(entry\[1\]\)\) \{[\s\S]*?directFields\.push\(entry\)[\s\S]*?flushDirectFields\(\)[\s\S]*?blocks\.push\(childElement\(entry\)/)
  assert.match(client, /function StateValueGroup\(\{ root = false, segments, description, empty = false, children \}\)/)
  assert.match(client, /function StateGroupPath\(\{ segments \}\)/)
  assert.match(styles, /\.stateGroupPath \{ display: flex; min-width: 0; flex-wrap: wrap;/)
  assert.match(styles, /\.stateGroupPath > span \+ span::before \{ content: '›';/)
  assert.match(styles, /\.stateViewTab:focus-visible \{/)
  assert.match(styles, /\.stateViewTab\[data-has-changes="true"\] small \{/)
  assert.match(styles, /\.stateChangeView \{/)
  assert.match(styles, /\.stateChangeValues \{ display: grid; grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/)
  assert.match(styles, /\.stateChangeReason \{/)
  assert.doesNotMatch(styles, /\.stateChangeSection \{|\.stateChangeTitle \{/)
  assert.match(client, /h\(Pill, \{ className: css\.statePill \}, rule\.cadence === 'every-turn'/)
  assert.match(styles, /\.statePill \{ flex: none; white-space: nowrap; \}/)
  assert.match(styles, /\.stateRuleList article > header \{ display: grid; grid-template-columns: minmax\(0, 1fr\) max-content; align-items: start;/)
  assert.match(styles, /\.stateRuleList article > header > strong \{ min-width: 0; overflow-wrap: anywhere;/)
  assert.doesNotMatch(client, /编辑当前角色卡|新建世界书|setAssetEditor|createdAssetBindingMessage/)
  assert.doesNotMatch(client, /assetEndpoint\(kind\)/)
  assert.doesNotMatch(styles, /\.sessionAssetEditor \{/)
})

test('会话 Wiki 用统一目录切换多份资料并把预设呈现为可读章节', async () => {
  const client = await readFile(new URL('../src/client.js', import.meta.url), 'utf8')
  const sessionWiki = await readFile(new URL('../src/session-wiki.js', import.meta.url), 'utf8')
  const styles = await readFile(new URL('../src/client.module.css', import.meta.url), 'utf8')
  assert.match(client, /h\(SessionDocumentBrowser, \{[\s\S]*?indexTitle: '世界书目录'/)
  assert.match(client, /indexTitle: kind === 'writingStyle' \? '文风目录'/)
  assert.doesNotMatch(client, /sharedAssetDocuments|boundLoreList|className: css\.entries/)
  assert.match(sessionWiki, /role: 'tablist'.*'aria-orientation': horizontalIndex \? 'horizontal' : 'vertical'/)
  assert.match(sessionWiki, /event\.key === 'ArrowDown'.*event\.key === 'ArrowRight'[\s\S]*?event\.key === 'ArrowUp'.*event\.key === 'ArrowLeft'[\s\S]*?event\.key === 'Home'[\s\S]*?event\.key === 'End'/)
  assert.match(sessionWiki, /scrollIntoView\(\{ block: 'nearest', inline: 'center' \}\)/)
  assert.match(sessionWiki, /documentRef\.current\?\.scrollTo\(\{ top: 0, behavior: 'auto' \}\)/)
  assert.match(sessionWiki, /label: '顶部'.*label: '底部'/s)
  assert.match(client, /normalizeLeadingHeading: label === '角色设定'/)
  assert.match(sessionWiki, /const source = normalizeLeadingHeading \? text\.replace/)
  assert.match(sessionWiki, /function PresetWikiDetail/)
  assert.match(sessionWiki, /h\(MarkdownText, \{ text: source\.replaceAll\('<', '&lt;'\) \}\)/)
  assert.match(styles, /\.sessionDocumentBrowser \{ display: grid;[^}]*grid-template-columns: minmax\(210px, 236px\) minmax\(0, 1fr\);/)
  assert.match(styles, /\.sessionDocumentIndexList button\[aria-selected="true"\]/)
  assert.match(styles, /\.stateBrowser \{ display: grid; grid-template-columns: minmax\(196px, 232px\) minmax\(360px, 1fr\);/)
  assert.match(styles, /\.presetDocument \{ display: flex; flex-direction: column; gap: 30px;/)
  assert.match(styles, /\.wikiRichText > div h2 \{/)
  assert.match(styles, /@media \(max-width: 720px\)[\s\S]*?\.sessionDocumentBrowser\[data-indexed="true"\] \{ grid-template-columns: 1fr; grid-template-rows: auto minmax\(0, 1fr\); \}/)
})

test('会话 Wiki 在资料空缺或失效时就地绑定且只提交当前资料类型', async () => {
  const client = await readFile(new URL('../src/client.js', import.meta.url), 'utf8')
  const binding = await readFile(new URL('../src/session-binding.js', import.meta.url), 'utf8')
  const styles = await readFile(new URL('../src/client.module.css', import.meta.url), 'utf8')
  assert.match(client, /function SessionWikiBindingPanel/)
  assert.match(client, /action: '选择并绑定', onAction: onBind/)
  assert.match(client, /title: '当前角色卡已不可用'/)
  assert.match(client, /action: '重新选择角色卡'/)
  assert.match(client, /已绑定世界书不可用，后续回复会跳过/)
  assert.match(client, /已绑定\$\{label\}不可用，后续回复会跳过/)
  assert.match(client, /rpc\(connection, 'session\/bind', \{[\s\S]*?expectedRevision: profile\?\.revision \?\? 0,[\s\S]*?\.\.\.sessionBindingRequest\(kind, selectedIds\)/)
  assert.match(client, /保存后仅更新这项资料，其他会话资料保持不变/)
  assert.match(binding, /character:[\s\S]*?requestField: 'cardId'/)
  assert.match(binding, /lorebooks:[\s\S]*?requestField: 'lorebookIds'/)
  assert.match(binding, /preset:[\s\S]*?requestField: 'presetId'/)
  assert.match(binding, /writingStyles:[\s\S]*?requestField: 'writingStyleIds'/)
  assert.match(styles, /\.sessionBindingPanel \{/)
  assert.match(styles, /\.sessionBindingOption\[aria-selected="true"\]/)
  assert.match(styles, /@media \(max-width: 720px\)[\s\S]*?\.sessionBindingList \{ grid-template-columns: 1fr; \}/)
})

test('会话工具弹窗只保留一个标题并修复 Prompt 拖拽接管', async () => {
  const client = await readFile(new URL('../src/client.js', import.meta.url), 'utf8')
  const contextCanvas = await readFile(new URL('../src/context-canvas.js', import.meta.url), 'utf8')
  const styles = await readFile(new URL('../src/client.module.css', import.meta.url), 'utf8')
  assert.equal(client.match(/useWorkbenchModal\(open\)/g)?.length, 2)
  assert.doesNotMatch(client, /function useModalFocus/)
  assert.match(styles, /\.libraryDialog \{ box-sizing: border-box;[^}]*100dvh/)
  assert.match(styles, /\.libraryContent > div:first-child \{[^}]*min-height: 48px;[^}]*padding: 10px 14px 8px 24px;/)
  assert.match(styles, /\.libraryContent > div:last-child \{[^}]*margin-top: 0;/)
  assert.match(styles, /\.workbenchDialog \{ box-sizing: border-box;[^}]*100dvh/)
  assert.match(styles, /\.workbenchContent > div:first-child \{[^}]*min-height: 48px;/)
  assert.match(styles, /\.workbenchContent > div:last-child \{[^}]*overflow: hidden;[^}]*margin-top: 0;/)
  assert.match(client, /title: '写作 prompt'/)
  assert.match(client, /closeLabel: '关闭写作 prompt'/)
  assert.match(client, /'会话 Wiki'/)
  assert.doesNotMatch(styles, /\.promptWorkbenchToolbar|\.promptHeaderActions|\.promptSourcesButton|\.previewRefresh/)
  assert.doesNotMatch(styles, /\.promptWorkbenchHeader|\.promptWorkbenchIdentity/)
  assert.match(styles, /\.contextBuildGrid \{[^}]*grid-template-areas: "idle builder preview";[^}]*grid-template-columns: clamp\(188px, 14vw, 224px\) minmax\(430px, \.9fr\) minmax\(520px, 1\.15fr\);/)
  assert.match(styles, /\.slotWorkbench \{ position: relative; grid-area: builder; display: flex; flex-direction: column; overflow: hidden;/)
  assert.match(styles, /\.slotWorkbench\[data-idle-restore-active="true"\]/)
  assert.match(styles, /\.idleSlotArea \{ grid-area: idle;[^}]*min-height: 0;[^}]*overflow: hidden;/)
  assert.match(styles, /\.idleSlotCard \{[^}]*grid-template-columns: 20px minmax\(0, 1fr\);[^}]*cursor: grab;/)
  assert.doesNotMatch(styles, /\.slotIdleAction|\.idleSlotActions/)
  assert.match(styles, /\.promptPreview \{ grid-area: preview; display: flex; flex-direction: column; overflow: hidden;/)
  assert.match(styles, /\.promptDocument \{[^}]*min-height: 0;[^}]*flex: 1;[^}]*overflow-y: auto;/)
  assert.match(styles, /\.promptDocument > section \{[^}]*flex: none;[^}]*overflow: hidden;/)
  assert.match(contextCanvas, /h\('details', null,\s*h\('summary'/)
  assert.match(styles, /\.slotStack \{[^}]*flex: 1;[^}]*overflow-y: auto;[^}]*overscroll-behavior: contain;/)
  assert.match(styles, /\.slotCard \{[^}]*flex: none;/)
  assert.match(styles, /\.slotStack \{[^}]*gap: 5px;/)
  assert.match(contextCanvas, /if \(displaySourceIds\.length === 1\)/)
  assert.match(contextCanvas, /function slotSourceIdsForDisplay\(slot, sources\)/)
  assert.match(contextCanvas, /className: css\.compactSlotRow/)
  assert.match(contextCanvas, /'data-single': 'true'/)
  assert.match(contextCanvas, /id === 'rp\.conversation' \|\| id === 'rp\.current-input' \? '会话'/)
  assert.match(contextCanvas, /id === 'rp\.writing-style' \|\| id\.startsWith\('rp\.writing-style:'\) \? '文风'/)
  assert.match(contextCanvas, /id === 'rp\.preset' \|\| id\.startsWith\('rp\.preset:'\) \? '预设'/)
  assert.match(contextCanvas, /id\.startsWith\('rp\.lore'\) \? '世界书'/)
  assert.match(contextCanvas, /return `\$\{category\} - \$\{detail\}`/)
  assert.match(contextCanvas, /id\.startsWith\('rp\.preset:'\) \|\| id\.startsWith\('rp\.writing-style:'\) \? source\.label/)
  assert.match(contextCanvas, /id === 'rp\.writing-style' && styleNames\.length > 0 \? styleNames\.join\('、'\)/)
  assert.match(styles, /\.compactSlotRow \{[^}]*grid-template-columns: 20px 24px minmax\(0, 1fr\) auto auto auto;[^}]*min-height: 38px;/)
  assert.match(styles, /\.slotCard > header \{[^}]*min-height: 27px;/)
  assert.match(styles, /\.slotDropzone \{[^}]*min-height: 30px;/)
  assert.match(styles, /\.slotWorkbench \.sourceIngredient small \{ display: none; \}/)
  assert.match(styles, /\.builderFooter \{[^}]*flex: none;[^}]*background: var\(--dsw-alias-bg-layer-2\);/)
  assert.match(contextCanvas, /className: css\.slotStack[\s\S]*?className: css\.builderFooter/)
  assert.match(contextCanvas, /useDragControls\(\)/)
  assert.match(contextCanvas, /dragListener: false/)
  assert.match(contextCanvas, /preserveVisibleSlots\(current, rows\)/)
  assert.match(contextCanvas, /moveUnlockedSlot\(current, slot\.id, direction, visibleSlotIds\)/)
  assert.match(contextCanvas, /application\/x-rp-prompt-source/)
  assert.match(contextCanvas, /application\/x-rp-prompt-slot/)
  assert.match(contextCanvas, /movePromptSlotToArea\(current, slotId, true, beforeSlotId, sources\)/)
  assert.match(contextCanvas, /movePromptSlotToArea\(current, slotId, false, location\.beforeSlotId, sources\)/)
  assert.match(contextCanvas, /function usePromptDragAutoScroll/)
  assert.match(contextCanvas, /layoutScroll: true/)
  assert.match(contextCanvas, /promptDragScrollDelta\(/)
  assert.match(contextCanvas, /'data-cross-drop-before': crossDropBefore \? 'true' : 'false'/)
  assert.match(contextCanvas, /'data-drop-active': dropTarget === slot\.id/)
  assert.match(styles, /\.idleSlotArea\[data-drop-active="true"\]/)
  assert.match(styles, /\.idleSlotArea\[data-drop-blocked="true"\]/)
  assert.match(styles, /\.slotCard\[data-cross-drop-before="true"\]::after/)
  assert.match(styles, /\.slotStack\[data-cross-drop-end="true"\]::after/)
  assert.match(contextCanvas, /'aria-label': `拖动\$\{source\.label \?\? source\.id\}；也可用上下方向键移动`/)
  assert.match(styles, /\.slotDropzone\[data-drop-active="true"\]/)
  assert.match(styles, /\.sourceIngredient\[data-dragging="true"\]/)
  assert.doesNotMatch(styles, /\.agentIngredients|\.agentSourceCard|\.agentOwnership/)
  assert.match(styles, /\.contextNav \{[^}]*border: 1px solid var\(--dsw-alias-border-l2\);[^}]*border-radius: 16px;/)
  assert.match(styles, /\.contextEmptyQuiet \{ min-height: 180px; margin: 12px; border: 0; background: transparent; \}/)
  assert.match(styles, /\.referenceWorkbench \{ overflow: auto; overscroll-behavior: contain; \}/)
  assert.match(client, /function SessionCharacterPanel/)
  assert.match(client, /function SessionLorebooksPanel/)
  assert.doesNotMatch(client, /function SessionReferencesPanel/)
})

test('世界书槽位在故事资料中使用扮演指导文案', async () => {
  const client = await readFile(new URL('../src/client.js', import.meta.url), 'utf8')
  assert.match(client, /扮演指导 \$\{book\.slots\?\.roleplayGuide/)
  assert.doesNotMatch(client, /人物设定/)
})

test('故事开场不再由资料库插件重复渲染或接管消息操作', async () => {
  const client = await readFile(new URL('../src/client.js', import.meta.url), 'utf8')
  const styles = await readFile(new URL('../src/client.module.css', import.meta.url), 'utf8')
  assert.doesNotMatch(client, /openingNodeDefinition|RpOpeningNode|rp-opening|session\/opening|useAutoSizeTextarea/)
  assert.match(client, /uiConversation\.events\.register\(roleplayRunMarkerDefinition\)/)
  assert.doesNotMatch(client, /runNodeNarrative|streaming-narrative/)
  assert.doesNotMatch(styles, /\.openingMessage|\.openingAvatarSeat|\.narrativeBody/)
})

test('Roleplay 会话正文隐藏 Harness 系统提示词但不影响普通会话', async () => {
  const styles = await readFile(new URL('../src/client.module.css', import.meta.url), 'utf8')
  assert.match(styles,
    /\[data-chat-flow\]:has\(\[data-chat-flow-kind="rp-run-marker"\]\)\s*> \[data-chat-flow-kind="system-prompt"\] \{ display: none; \}/)
  assert.doesNotMatch(styles, /^\[data-chat-flow-kind="system-prompt"\] \{ display: none; \}$/m)
})

test('Roleplay UI 只跟随当前会话的 roleplay preset', () => {
  const roleplay = { current: 'rp', byId: {
    rp: { projectionValues: { agentPreset: 'roleplay' } },
    standard: { projectionValues: { agentPreset: 'standard' } },
  } }
  assert.equal(isRoleplaySummary(roleplay, 'rp'), true)
  assert.equal(isRoleplaySummary({ ...roleplay, current: 'standard' }, 'rp'), false)
  assert.equal(isRoleplaySummary({ ...roleplay, current: 'standard' }, 'standard'), false)
})
