import assert from 'node:assert/strict'
import test from 'node:test'
import { Context } from '@deepseek-ai/cordis'
import { createAssistantMessage } from '@deepseek-ai/dsh-llm'
import SessionProjectionRegistry from '@deepseek-ai/dsh-session-projection'
import { decodeRpMessageActionEvent } from '../../rp-core/src/conversation.js'
import { Session, SessionId } from '@deepseek-ai/dsh-session'
import {
  MAX_CONTEXT_SLOTS,
  MAX_OPENING_CHARACTERS,
  RP_SESSION_APPLY_COMMAND,
  RpSessions,
  applySessionProjection,
  emptySessionCommandState,
  encodeSessionCommand,
  isSelectedOpeningMessage,
  normalizeProfile,
} from '../src/index.js'

test('selected opening provenance is a stable native assistant-message discriminator', () => {
  const opening = {
    type: 'assistant/message',
    data: { message: { source: { kind: 'model', provider: 'rp-session', model: 'selected-opening' } } },
  }
  assert.equal(isSelectedOpeningMessage(opening), true)
  assert.equal(isSelectedOpeningMessage({ ...opening, type: 'user/message' }), false)
  assert.equal(isSelectedOpeningMessage({ ...opening, data: { message: { source: { kind: 'model', provider: 'mock', model: 'selected-opening' } } } }), false)
  assert.equal(isSelectedOpeningMessage({ ...opening, data: { message: { source: { kind: 'model', provider: 'rp-session', model: 'mock' } } } }), false)
})

test('normalizes actor profiles with one user-controlled character', () => {
  const profile = normalizeProfile({
    mode: 'actor',
    playerCharacterId: 'hero',
    cast: [{ characterId: 'hero', name: '林默', controller: 'user' }, { characterId: 'npc', controller: 'agent' }],
    resources: { card: { id: 'card-info' }, lorebooks: [{ id: 'world' }], persona: { id: 'persona-info' }, preset: { id: 'preset-info' }, writingStyles: [{ id: 'style-a' }, { id: 'style-b' }] },
    runtime: {
      executionMode: 'agent', provider: 'deepseek-official', model: 'deepseek-chat', maxSteps: 6,
      writer: { provider: 'writer-provider', model: 'writer-model', maxTokens: 8192 },
    },
  }, 0)
  assert.equal(profile.revision, 1)
  assert.equal(profile.mode, 'actor')
  assert.equal(profile.cast[0].name, '林默')
  assert.deepEqual(profile.resources, { card: { id: 'card-info' }, lorebooks: [{ id: 'world' }], persona: { id: 'persona-info' }, preset: { id: 'preset-info' }, writingStyles: [{ id: 'style-a' }, { id: 'style-b' }] })
  assert.throws(() => normalizeProfile({ mode: 'director', resources: { writingStyles: [{ id: 'style-a' }, { id: 'style-a' }] } }, 0), /duplicate writingStyles/)
  assert.equal(profile.runtime.maxSteps, 6)
  assert.equal(profile.runtime.executionMode, 'agent')
  assert.equal(profile.runtime.provider, 'deepseek-official')
  assert.equal(Object.hasOwn(profile.runtime, 'writer'), false)
  assert.deepEqual(normalizeProfile({ mode: 'director', runtime: { writer: { maxTokens: 4096 } } }, 0).runtime, { executionMode: 'chat' })
  assert.throws(() => normalizeProfile({ mode: 'director', runtime: { model: 'orphan' } }, 0), /configured together/)
  assert.throws(() => normalizeProfile({ mode: 'director', resources: { card: { id: 'pinned', revision: 1 } } }, 0), /only a live asset id/)
  assert.throws(() => normalizeProfile({ mode: 'director', resources: { characters: [] } }, 0), /no longer supported/)
  assert.throws(() => normalizeProfile({ mode: 'actor', cast: [] }, 0), /exactly one/)
  assert.equal(normalizeProfile({ mode: 'adaptive', playerCharacterId: 'rp.player', cast: [{ characterId: 'rp.player', controller: 'user' }] }, 0).mode, 'adaptive')
})

test('profile accepts exactly the context slot limit and rejects one more', () => {
  const slots = Array.from({ length: MAX_CONTEXT_SLOTS }, (_, index) => ({ id: `custom-${index}`, label: `分组 ${index}`, sourceIds: [`rp.custom:custom-${index}`] }))
  const customSources = slots.map(slot => ({ slotId: slot.id, content: `资料 ${slot.id}` }))
  const exact = normalizeProfile({ mode: 'director', contextBuild: { version: 1, slots, customSources } }, 0).contextBuild
  assert.equal(exact.slots.length, MAX_CONTEXT_SLOTS)
  assert.equal(exact.customSources.length, MAX_CONTEXT_SLOTS)
  assert.throws(
    () => normalizeProfile({ mode: 'director', contextBuild: { version: 1, slots: [...slots, { id: 'overflow', label: '超限', sourceIds: [] }] } }, 0),
    new RegExp(`at most ${MAX_CONTEXT_SLOTS} slots`),
  )
  assert.throws(
    () => normalizeProfile({ mode: 'director', contextBuild: { version: 1, slots, customSources: [...customSources, customSources[0]] } }, 0),
    new RegExp(`at most ${MAX_CONTEXT_SLOTS} items`),
  )
})

test('profile persists validated custom Prompt content with its owning slot', () => {
  const contextBuild = {
    version: 1,
    slots: [{ id: 'custom-1', label: '背景补充', sourceIds: ['rp.custom:custom-1'] }],
    customSources: [{ slotId: 'custom-1', content: '  城门将在午夜关闭。  ' }],
  }
  assert.deepEqual(normalizeProfile({ mode: 'director', contextBuild }, 0).contextBuild, {
    ...contextBuild,
    slots: [{ ...contextBuild.slots[0], sectionTag: true }],
    customSources: [{ slotId: 'custom-1', content: '城门将在午夜关闭。' }],
  })
  assert.throws(
    () => normalizeProfile({ mode: 'director', contextBuild: { ...contextBuild, customSources: [{ slotId: 'custom-1', content: '' }] } }, 0),
    /requires non-empty content/,
  )
})

test('profile persists per-slot Prompt tag and idle settings and rejects invalid booleans', () => {
  const contextBuild = {
    version: 1,
    slots: [
      { id: 'active', label: '正在使用', sourceIds: [], sectionTag: false },
      { id: 'parked', label: '闲置资料', sourceIds: [], idle: true, sectionTag: true },
    ],
  }
  assert.deepEqual(normalizeProfile({ mode: 'director', contextBuild }, 0).contextBuild, contextBuild)
  assert.throws(
    () => normalizeProfile({ mode: 'director', contextBuild: { version: 1, slots: [{ id: 'bad', label: '错误', sourceIds: [], idle: 'yes' }] } }, 0),
    /idle must be a boolean/,
  )
  assert.throws(
    () => normalizeProfile({ mode: 'director', contextBuild: { version: 1, slots: [{ id: 'bad', label: '错误', sourceIds: [], sectionTag: 'no' }] } }, 0),
    /sectionTag must be a boolean/,
  )
  assert.deepEqual(
    normalizeProfile({ mode: 'director', contextBuild: { version: 1, sectionTags: false, slots: [{ id: 'old', label: '旧设置', sourceIds: [] }] } }, 0).contextBuild,
    { version: 1, slots: [{ id: 'old', label: '旧设置', sourceIds: [], sectionTag: false }] },
  )
})

test('session projection applies only a successfully paired native command', () => {
  const profile = normalizeProfile({ mode: 'director' }, 0)
  const run = { type: 'command/run', data: { commandId: 'c1', name: RP_SESSION_APPLY_COMMAND, args: encodeSessionCommand(0, profile), source: { kind: 'user' } } }
  const pending = applySessionProjection(emptySessionCommandState(), run)
  assert.equal(pending.profile, null)
  assert.deepEqual(applySessionProjection(pending, { type: 'command/done', data: { commandId: 'c1', kind: 'success' } }).profile, profile)
  assert.equal(applySessionProjection(pending, { type: 'command/done', data: { commandId: 'c1', kind: 'error' } }).profile, null)
})

test('publishes the session view and host state through the current Harness projection registry', async () => {
  const ctx = new Context()
  new SessionProjectionRegistry(ctx)
  ctx.provide('commands', fakeCommands())
  ctx.provide('rpRuntime', { registerSessionProfileProvider() {}, registerRunGuard() {} })
  const sessions = new RpSessions(ctx, { defaultMode: 'director', defaultExecutionMode: 'chat', maxProfileCommandBytes: 262144 })
  await new Promise(resolve => setImmediate(resolve))
  const profile = normalizeProfile({ mode: 'director' }, 0)
  const events = [
    { seq: 0, type: 'command/run', data: { commandId: 'projection', name: RP_SESSION_APPLY_COMMAND, args: encodeSessionCommand(0, profile) } },
    { seq: 1, type: 'command/done', data: { commandId: 'projection', kind: 'success' } },
  ]
  const session = { events, seq: events.length }

  assert.deepEqual(ctx.sessionProjections.snapshot(session), { asOfSeq: 1, values: { 'rp/session': profile } })
  assert.deepEqual(ctx.sessionProjections.stateOf(session, 'rp/session'), { profile, pending: [] })
  assert.deepEqual(sessions.get({ session }), profile)
  const checkpoint = ctx.sessionProjections.checkpoint(session)
  assert.deepEqual(ctx.sessionProjections.viewCheckpoint(checkpoint), { 'rp/session': profile })
  checkpoint['rp/session'].val.pending = [{}]
  assert.deepEqual(ctx.sessionProjections.viewCheckpoint(checkpoint), {})
  await ctx.fiber.dispose()
})

test('profile command byte limit accepts an exact hit and rejects one byte over', async () => {
  const request = { mode: 'director' }
  const profile = normalizeProfile(request, 0)
  const exactBytes = Buffer.byteLength(encodeSessionCommand(0, profile), 'utf8')

  const exact = createSessionHarness(exactBytes)
  assert.equal((await exact.sessions.configure(exact.agent, request)).revision, 1)
  await exact.ctx.fiber.dispose()

  const tooSmall = createSessionHarness(exactBytes - 1)
  await assert.rejects(
    tooSmall.sessions.configure(tooSmall.agent, request),
    error => error.code === 'PROFILE_TOO_LARGE',
  )
  assert.deepEqual(tooSmall.events, [])
  await tooSmall.ctx.fiber.dispose()
})

test('profile materializers persist one complete State v2 bootstrap while keeping opening source separate from its visible message', async () => {
  const harness = createSessionHarness(262144)
  seedOpening(harness.agent.session, '原始开场。')
  harness.sessions.registerProfileMaterializer({
    id: 'test-seeds',
    prepare: ({ openingMessageText }) => ({
      stateBootstrap: {
        version: 2,
        namespaces: [{
          namespace: 'story', initialValue: { hp: 10 }, diagnostics: { setup: [], lastCommit: [] },
          definition: {
            title: '故事状态', updateMode: 'schema-only', rules: [],
            schema: { type: 'object', properties: { hp: { type: 'integer' } }, required: ['hp'], additionalProperties: false },
          },
        }],
      },
      openingMessageText: openingMessageText.replace('原始', '适配后的'),
    }),
  })
  const profile = await harness.sessions.configure(harness.agent, { mode: 'director', scene: { openingText: '原始开场。' } })
  assert.equal(profile.stateBootstrap.version, 2)
  assert.equal(profile.stateBootstrap.namespaces[0].namespace, 'story')
  assert.deepEqual(profile.stateBootstrap.namespaces[0].initialValue, { hp: 10 })
  assert.equal(profile.scene.openingText, '原始开场。')
  assert.equal(harness.agent.session.deriveMessages()[0].content[0].text, '适配后的开场。')
  assert.equal(Object.hasOwn(profile, 'materialized'), false)
  assert.deepEqual(profileFromCommandEvents(harness.events), profile)
  await harness.ctx.fiber.dispose()
})

test('profile materializers reject legacy State versions and duplicate namespace partitions before writing the profile', async () => {
  const legacy = createSessionHarness(262144)
  legacy.sessions.registerProfileMaterializer({
    id: 'legacy-state',
    prepare: () => ({ stateBootstrap: { version: 1, namespaces: [] } }),
  })
  await assert.rejects(
    legacy.sessions.configure(legacy.agent, { mode: 'director' }),
    error => error.code === 'INVALID_MATERIALIZATION' && /stateBootstrap/.test(error.message),
  )
  assert.deepEqual(legacy.events, [])
  await legacy.ctx.fiber.dispose()

  const duplicate = createSessionHarness(262144)
  for (const id of ['state-a', 'state-b']) {
    duplicate.sessions.registerProfileMaterializer({
      id,
      prepare: () => ({ stateBootstrap: { version: 2, namespaces: [{ namespace: 'story' }] } }),
    })
  }
  await assert.rejects(
    duplicate.sessions.configure(duplicate.agent, { mode: 'director' }),
    error => error.code === 'INVALID_MATERIALIZATION' && /duplicate namespace/.test(error.message),
  )
  assert.deepEqual(duplicate.events, [])
  await duplicate.ctx.fiber.dispose()
})

test('roleplay can start without shared assets and bind the first card from an active conversation', async () => {
  const ctx = new Context()
  let active = false
  ctx.provide('rpRuntime', {
    registerContextSource() {},
    registerRunGuard() {}, registerSessionProfileProvider() {}, syncExecutionMode() {},
    transformText: async text => text,
    inspectRun() { return active ? { status: 'running' } : undefined },
  })
  ctx.provide('commands', fakeCommands())
  ctx.provide('agents', { list: () => [] })
  ctx.provide('rpCharacterCards', { async get(id) { return { id, firstMessage: '后来补上的开场。', alternateGreetings: [] } } })
  const sessions = new RpSessions(ctx, { defaultMode: 'director', defaultExecutionMode: 'chat', maxProfileCommandBytes: 262144 })
  const events = []
  const agent = { status: 'idle', session: fakeSession(events) }

  const initial = await sessions.bindResources(agent, { expectedRevision: 0, lorebooks: [], writingStyles: [] })
  assert.deepEqual(initial.resources, { lorebooks: [], writingStyles: [] })
  assert.deepEqual(events.map(event => event.type), ['command/run', 'command/done'])

  events.push({ type: 'user/message', seq: events.length, data: { message: { content: [{ type: 'text', text: '帮我创建一个角色。' }] } } })
  agent.status = 'running'
  active = true
  const updated = await sessions.bindAssetChangesDuringRun(agent, { changes: { cardId: 'card-later' } })
  assert.deepEqual(updated.resources.card, { id: 'card-later' })
  assert.equal(updated.scene.openingText, undefined)
  await ctx.fiber.dispose()
})

test('binds an adaptive setup with CAS and allows later card replacement without rewriting history', async () => {
  const ctx = new Context()
  ctx.provide('rpRuntime', { registerContextSource() {}, registerRunGuard() {}, registerSessionProfileProvider() {}, syncExecutionMode() {}, transformText: async text => text })
  ctx.provide('commands', fakeCommands())
  ctx.provide('agents', { list: () => [] })
  ctx.provide('rpLoreBooks', { async get(id) { return { id } } })
  const sessions = new RpSessions(ctx, { defaultMode: 'director', maxProfileCommandBytes: 262144 })
  const events = []
  const agent = { status: 'idle', session: fakeSession(events) }
  seedOpening(agent.session, '港口醒来。')
  const initial = await sessions.bindResources(agent, { expectedRevision: 0, card: { id: 'card-a' }, lorebooks: [], writingStyles: [{ id: 'style-a' }, { id: 'style-b' }], openingIndex: 0, openingText: '港口醒来。' })
  assert.deepEqual(events.map(event => event.type), [
    'turn/start', 'step/start', 'assistant/message', 'step/end', 'turn/end', 'command/run', 'command/done',
  ])
  assert.equal(events.some(event => event.type.startsWith('rp/')), false)
  assert.equal(agent.session.deriveMessages()[0].content[0].text, '港口醒来。')
  assert.equal(initial.scene.openingText, '港口醒来。')
  assert.equal(initial.scene.openingAnchorRevision, 1)
  assert.deepEqual(initial.resources.writingStyles, [{ id: 'style-a' }, { id: 'style-b' }])
  const adaptive = await sessions.bindResources(agent, { expectedRevision: 1, card: { id: 'card-b' }, lorebooks: [{ id: 'lore-a' }], openingIndex: 1, openingText: '悬崖路醒来。' })
  assert.equal(adaptive.mode, 'adaptive')
  assert.equal(adaptive.playerCharacterId, 'rp.player')
  assert.deepEqual(adaptive.cast, [{ characterId: 'rp.player', controller: 'user' }])
  assert.equal(adaptive.scene.openingText, '悬崖路醒来。')
  assert.equal(adaptive.scene.openingAnchorRevision, 1)
  assert.deepEqual(agent.session.deriveMessages().map(message => message.content[0].text), ['悬崖路醒来。'])
  const openingEvents = events.filter(event => event.type === 'assistant/message')
  assert.equal(openingEvents.length, 2)
  const openingEdit = openingEvents.at(-1)
  assert.equal(decodeRpMessageActionEvent(openingEdit).operation, 'edit')
  assert.deepEqual(decodeRpMessageActionEvent(openingEdit).targets, [{
    kind: 'message', role: 'assistant', messageId: openingEvents[0].data.message.id, turn: 1, step: 1,
  }])
  assert.deepEqual(openingEdit.sourceEventSeqs, [openingEvents[0].seq])
  events.push({ type: 'user/message', data: {} })
  const rebound = await sessions.bindResources(agent, { expectedRevision: 2, card: { id: 'card-a' }, lorebooks: [] })
  assert.deepEqual(rebound.resources.card, { id: 'card-a' })
  assert.equal(rebound.scene.openingText, '悬崖路醒来。')
  assert.deepEqual(agent.session.deriveMessages().map(message => message.content[0].text), ['悬崖路醒来。'])
  await assert.rejects(
    sessions.bindResources(agent, { expectedRevision: 3, card: { id: 'card-b' }, lorebooks: [], openingIndex: 0 }),
    error => error.code === 'OPENING_LOCKED',
  )
  const updated = await sessions.bindResources(agent, { expectedRevision: 3, card: { id: 'card-b' }, lorebooks: [{ id: 'lore-b' }], openingIndex: 1 })
  assert.equal(updated.resources.lorebooks[0].id, 'lore-b')
  await assert.rejects(sessions.bindResources(agent, { expectedRevision: 3, card: updated.resources.card, lorebooks: [] }), error => error.code === 'REVISION_CONFLICT')
  agent.status = 'running'
  await assert.rejects(sessions.bindResources(agent, { expectedRevision: 4, card: updated.resources.card, lorebooks: [] }), error => error.code === 'SESSION_RUNNING')
  await ctx.fiber.dispose()
})

test('asset binding can detach a card after the story starts while preserving the selected opening', async () => {
  const ctx = new Context()
  ctx.provide('rpRuntime', { registerContextSource() {}, registerRunGuard() {}, registerSessionProfileProvider() {}, syncExecutionMode() {}, transformText: async text => text })
  ctx.provide('commands', fakeCommands())
  ctx.provide('agents', { list: () => [] })
  ctx.provide('rpLoreBooks', { async get(id) { return { id } } })
  const sessions = new RpSessions(ctx, { defaultMode: 'director', maxProfileCommandBytes: 262144 })
  const events = []
  const agent = { status: 'idle', session: fakeSession(events) }
  seedOpening(agent.session, '旧角色的开场。')
  const initial = await sessions.bindResources(agent, {
    expectedRevision: 0,
    card: { id: 'card-a' },
    lorebooks: [{ id: 'lore-a' }],
    openingIndex: 0,
    openingText: '旧角色的开场。',
  })
  events.push({ type: 'user/message', data: { message: { content: [{ type: 'text', text: '继续。' }] } } })

  const detached = await sessions.bindAssetChanges(agent, {
    expectedRevision: initial.revision,
    changes: { cardId: null },
  })

  assert.equal(detached.resources.card, undefined)
  assert.deepEqual(detached.resources.lorebooks, [{ id: 'lore-a' }])
  assert.equal(detached.scene.openingText, '旧角色的开场。')
  assert.equal(detached.scene.openingSource, 'custom')
  assert.deepEqual(agent.session.deriveMessages().map(message => message.content[0].text), ['旧角色的开场。'])
  assert.equal(events.some(event => event.type === 'user/message' && event.data.message.content[0].text === '继续。'), true)
  await ctx.fiber.dispose()
})

test('the next profile change prunes deleted inherited card and lorebook bindings', async () => {
  const ctx = new Context()
  ctx.provide('rpRuntime', { registerContextSource() {}, registerRunGuard() {}, registerSessionProfileProvider() {}, syncExecutionMode() {}, transformText: async text => text })
  ctx.provide('commands', fakeCommands())
  ctx.provide('agents', { list: () => [] })
  ctx.provide('rpCharacterCards', {
    async get() { throw Object.assign(new Error('deleted card'), { code: 'ASSET_NOT_FOUND' }) },
  })
  ctx.provide('rpLoreBooks', {
    async get() { throw Object.assign(new Error('deleted lorebook'), { code: 'ASSET_NOT_FOUND' }) },
  })
  ctx.provide('rpPersonas', { async get(id) { return { id } } })
  const sessions = new RpSessions(ctx, { defaultMode: 'director', maxProfileCommandBytes: 262144 })
  const events = []
  const agent = { status: 'idle', session: fakeSession(events) }
  seedOpening(agent.session, '已删除角色留下的开场。')
  const initial = await sessions.bindResources(agent, {
    expectedRevision: 0,
    card: { id: 'deleted-card' },
    lorebooks: [{ id: 'deleted-lorebook' }],
    openingIndex: 0,
    openingText: '已删除角色留下的开场。',
  })
  events.push({ type: 'user/message', data: { message: { content: [{ type: 'text', text: '继续。' }] } } })

  const updated = await sessions.bindAssetChanges(agent, {
    expectedRevision: initial.revision,
    changes: { personaId: 'persona-new' },
  })

  assert.equal(updated.resources.card, undefined)
  assert.deepEqual(updated.resources.lorebooks, [])
  assert.deepEqual(updated.resources.persona, { id: 'persona-new' })
  assert.equal(updated.scene.openingText, '已删除角色留下的开场。')
  await ctx.fiber.dispose()
})

test('trusted asset tools can bind during an active RpRun but not outside one', async () => {
  const ctx = new Context()
  let active = false
  ctx.provide('rpRuntime', {
    registerContextSource() {}, registerRunGuard() {}, registerSessionProfileProvider() {},
    syncExecutionMode() {}, transformText: async text => text,
    inspectRun() { return active ? { status: 'running' } : undefined },
  })
  ctx.provide('commands', fakeCommands())
  ctx.provide('agents', { list: () => [] })
  const sessions = new RpSessions(ctx, { defaultMode: 'director', defaultExecutionMode: 'chat', maxProfileCommandBytes: 262144 })
  const events = []
  const agent = { status: 'idle', session: fakeSession(events) }
  seedOpening(agent.session, '港口醒来。')
  const initial = await sessions.bindResources(agent, {
    expectedRevision: 0, card: { id: 'card-a' }, lorebooks: [], openingText: '港口醒来。',
  })
  agent.status = 'running'
  await assert.rejects(
    sessions.bindResourcesDuringRun(agent, { expectedRevision: initial.revision, card: { id: 'card-a' }, lorebooks: [{ id: 'lore-a' }] }),
    error => error.code === 'RP_RUN_NOT_ACTIVE',
  )
  active = true
  const updated = await sessions.bindResourcesDuringRun(agent, {
    expectedRevision: initial.revision, card: { id: 'card-a' }, lorebooks: [{ id: 'lore-a' }],
  })
  assert.deepEqual(updated.resources.lorebooks, [{ id: 'lore-a' }])
  await ctx.fiber.dispose()
})

test('canonical asset binding resolves five live services, preserves partial fields and owns opening selection', async () => {
  const ctx = new Context()
  let active = false
  ctx.provide('rpRuntime', {
    registerContextSource() {}, registerRunGuard() {}, registerSessionProfileProvider() {},
    syncExecutionMode() {}, transformText: async text => text,
    inspectRun() { return active ? { status: 'running' } : undefined },
  })
  ctx.provide('commands', fakeCommands())
  ctx.provide('agents', { list: () => [] })
  ctx.provide('rpCharacterCards', { async get(id) {
    return id === 'card-b'
      ? { id, firstMessage: '新卡默认开场。', alternateGreetings: ['新卡第二开场。'] }
      : { id, firstMessage: '旧卡开场。', alternateGreetings: [] }
  } })
  ctx.provide('rpLoreBooks', { async get(id) { return { id } } })
  ctx.provide('rpPersonas', { async get(id) { return { id } } })
  let resolvedPreset
  ctx.provide('rpPresets', {
    async resolveBinding(id) { resolvedPreset = id; return { id } },
    async get() { throw new Error('session binding must not inspect preset fields') },
  })
  ctx.provide('rpWritingStyles', {
    async resolveBindings(ids) {
      if (ids.length > 2) throw Object.assign(new Error('too many styles'), { code: 'LIMIT_EXCEEDED' })
      return ids.map(id => ({ id }))
    },
  })
  const sessions = new RpSessions(ctx, { defaultMode: 'director', defaultExecutionMode: 'chat', maxProfileCommandBytes: 262144 })
  const events = []
  const agent = { status: 'idle', session: fakeSession(events) }
  seedOpening(agent.session, '旧卡开场。')
  const initial = await sessions.bindResources(agent, {
    expectedRevision: 0,
    card: { id: 'card-a' },
    lorebooks: [{ id: 'lore-a' }],
    persona: { id: 'persona-a' },
    preset: { id: 'preset-a' },
    writingStyles: [{ id: 'style-a' }],
    openingIndex: 0,
    openingText: '旧卡开场。',
  })

  const replaced = await sessions.bindAssetChanges(agent, {
    expectedRevision: initial.revision,
    changes: { cardId: 'card-b' },
    openingIndex: 1,
  })
  assert.equal(replaced.resources.card.id, 'card-b')
  assert.deepEqual(replaced.resources.lorebooks, [{ id: 'lore-a' }])
  assert.equal(replaced.resources.persona.id, 'persona-a')
  assert.equal(replaced.resources.preset.id, 'preset-a')
  assert.equal(resolvedPreset, 'preset-a')
  assert.deepEqual(replaced.resources.writingStyles, [{ id: 'style-a' }])
  assert.equal(replaced.scene.openingIndex, 1)
  assert.equal(replaced.scene.openingSource, 'card')
  assert.equal(replaced.scene.openingText, '新卡第二开场。')

  agent.status = 'running'
  active = true
  const updated = await sessions.bindAssetChangesDuringRun(agent, {
    changes: { lorebookIds: ['lore-b', 'lore-a'], personaId: null, writingStyleIds: ['style-b', 'style-a'] },
  })
  assert.equal(updated.resources.card.id, 'card-b')
  assert.deepEqual(updated.resources.lorebooks, [{ id: 'lore-b' }, { id: 'lore-a' }])
  assert.equal(updated.resources.persona, undefined)
  assert.equal(updated.resources.preset.id, 'preset-a')
  assert.deepEqual(updated.resources.writingStyles, [{ id: 'style-b' }, { id: 'style-a' }])
  assert.equal(updated.scene.openingIndex, 1)
  assert.equal(updated.scene.openingText, '新卡第二开场。')
  await assert.rejects(
    sessions.bindAssetChangesDuringRun(agent, { changes: { writingStyleIds: ['style-a', 'style-b', 'style-c'] } }),
    error => error.code === 'LIMIT_EXCEEDED',
  )
  await ctx.fiber.dispose()
})

test('a live Agent cannot create its first opening after construction', async () => {
  const ctx = new Context()
  ctx.provide('rpRuntime', { registerContextSource() {}, registerRunGuard() {}, registerSessionProfileProvider() {}, syncExecutionMode() {}, transformText: async text => text, inspectRun: () => undefined })
  ctx.provide('commands', fakeCommands())
  ctx.provide('agents', { list: () => [] })
  ctx.provide('rpCharacterCards', { async get(id) { return { id, firstMessage: '默认开场。', alternateGreetings: ['第二开场。'] } } })
  const sessions = new RpSessions(ctx, { defaultMode: 'director', defaultExecutionMode: 'chat', maxProfileCommandBytes: 262144 })
  const agent = { status: 'idle', session: fakeSession([]) }
  await assert.rejects(
    sessions.bindAssetChanges(agent, { changes: { cardId: 'card-a' } }),
    error => error.code === 'OPENING_REQUIRES_SEEDED_CREATE',
  )
  await ctx.fiber.dispose()
})

test('post-construction setup rejects a first custom opening but supports explicitly skipping one', async () => {
  const ctx = new Context()
  ctx.provide('rpRuntime', { registerContextSource() {}, registerRunGuard() {}, registerSessionProfileProvider() {}, syncExecutionMode() {}, transformText: async text => text, inspectRun: () => undefined })
  ctx.provide('commands', fakeCommands())
  ctx.provide('agents', { list: () => [] })
  ctx.provide('rpCharacterCards', { async get(id) { return { id, firstMessage: '角色卡开场。', alternateGreetings: [] } } })
  const sessions = new RpSessions(ctx, { defaultMode: 'director', defaultExecutionMode: 'chat', maxProfileCommandBytes: 262144 })
  const agent = { status: 'idle', session: fakeSession([]) }

  await assert.rejects(
    sessions.bindAssetChanges(agent, { changes: {}, openingIndex: 0, openingText: '完全自定义的开场。' }),
    error => error.code === 'OPENING_REQUIRES_SEEDED_CREATE',
  )
  const skipped = await sessions.bindAssetChanges(agent, { changes: { cardId: 'card-a' }, openingIndex: 0, openingText: null })
  assert.deepEqual(skipped.resources.card, { id: 'card-a' })
  assert.equal(skipped.scene.openingText, undefined)
  assert.equal(skipped.scene.openingAnchorRevision, undefined)
  assert.deepEqual(agent.session.deriveMessages(), [])
  await ctx.fiber.dispose()
})

test('edits the persisted opening with CAS and enforces the complete character limit', async () => {
  const harness = createSessionHarness(1048576)
  seedOpening(harness.agent.session, '旧开场')
  const configured = await harness.sessions.bindResources(harness.agent, {
    expectedRevision: 0,
    card: { id: 'card-a' },
    lorebooks: [],
    openingIndex: 0,
    openingText: '旧开场',
  })
  const exact = '界'.repeat(MAX_OPENING_CHARACTERS)
  const updated = await harness.sessions.setOpeningText(harness.agent, { expectedRevision: configured.revision, openingText: exact })
  assert.equal(updated.scene.openingText, exact)
  assert.equal(updated.scene.openingAnchorRevision, configured.scene.openingAnchorRevision)
  assert.deepEqual(harness.agent.session.deriveMessages().map(message => message.content[0].text), [exact])
  const replacement = harness.events.findLast(event => decodeRpMessageActionEvent(event)?.operation === 'edit')
  assert.equal(replacement.data.message.id, harness.events.find(event => event.type === 'assistant/message').data.message.id)
  assert.equal(replacement.data.message.source.replayState, undefined)
  await assert.rejects(
    harness.sessions.setOpeningText(harness.agent, { expectedRevision: updated.revision, openingText: `${exact}界` }),
    error => error.code === 'LIMIT_EXCEEDED',
  )
  await assert.rejects(
    harness.sessions.setOpeningText(harness.agent, { expectedRevision: updated.revision, openingText: '   ' }),
    error => error.code === 'INVALID_REQUEST',
  )
  await assert.rejects(
    harness.sessions.setOpeningText(harness.agent, { expectedRevision: configured.revision, openingText: '冲突' }),
    error => error.code === 'REVISION_CONFLICT',
  )
  harness.agent.status = 'running'
  await assert.rejects(
    harness.sessions.setOpeningText(harness.agent, { expectedRevision: updated.revision, openingText: '运行中' }),
    error => error.code === 'SESSION_RUNNING',
  )
  await harness.ctx.fiber.dispose()
})

test('opening edits replay as native assistant replacements on the Session surface', async () => {
  const ctx = new Context()
  ctx.provide('rpRuntime', {
    registerContextSource() {}, registerRunGuard() {}, registerSessionProfileProvider() {},
    syncExecutionMode() {}, transformText: async text => text,
  })
  ctx.provide('commands', fakeCommands())
  ctx.provide('agents', { list: () => [] })
  const sessions = new RpSessions(ctx, { defaultMode: 'director', defaultExecutionMode: 'chat', maxProfileCommandBytes: 262144 })
  const session = Session.create(SessionId('native-opening-revision'))
  const agent = { status: 'idle', session }
  seedOpening(session, '原生开场。')
  const configured = await sessions.bindResources(agent, {
    expectedRevision: 0, card: { id: 'card-a' }, lorebooks: [], openingText: '原生开场。',
  })
  const opening = session.events.find(event => event.type === 'assistant/message')
  session.append('user/message', {
    role: 'user',
    id: 'before-opening-edit',
    content: [{ type: 'text', text: '已经开始的对话。' }],
    source: { kind: 'user' },
  }, { surfaceOp: 'append' })
  const updated = await sessions.setOpeningText(agent, {
    expectedRevision: configured.revision,
    openingText: '修改后的原生开场。',
  })
  const replacement = session.events.findLast(event => decodeRpMessageActionEvent(event)?.operation === 'edit')

  assert.equal(sessions.get(agent).revision, updated.revision)
  assert.equal(sessions.get(agent).scene.openingText, '修改后的原生开场。')
  assert.equal(replacement.data.message.id, opening.data.message.id)
  assert.deepEqual(replacement.sourceEventSeqs, [opening.seq])
  assert.deepEqual(session.deriveMessages().map(message => message.content[0].text), [
    '修改后的原生开场。',
    '已经开始的对话。',
  ])
  session.append('user/message', {
    role: 'user',
    id: 'after-opening-edit',
    content: [{ type: 'text', text: '从这里开始。' }],
    source: { kind: 'user' },
  }, { surfaceOp: 'append' })
  assert.deepEqual(session.deriveMessages().map(message => message.content[0].text), [
    '修改后的原生开场。',
    '已经开始的对话。',
    '从这里开始。',
  ])
  const replay = Session.create(SessionId('native-opening-revision-replay'), structuredClone(session.events))
  assert.deepEqual(replay.deriveMessages(), session.deriveMessages())
  assert.deepEqual(sessions.get({ session: replay }), updated)
  await ctx.fiber.dispose()
})

test('stores opening macro source while persisting only the expanded assistant message', async () => {
  const transformText = async (text, { profile }) => text.replaceAll('{{user}}', profile.resources.persona?.id === 'persona-a' ? '林澈' : '{{user}}')
  const harness = createSessionHarness(1048576, value => value, transformText)
  seedOpening(harness.agent.session, '欢迎，林澈。')
  const profile = await harness.sessions.bindResources(harness.agent, {
    expectedRevision: 0,
    card: { id: 'card-a' },
    persona: { id: 'persona-a' },
    lorebooks: [],
    openingText: '欢迎，{{user}}。',
  })
  assert.equal(profile.scene.openingText, '欢迎，{{user}}。')
  assert.equal(harness.agent.session.deriveMessages()[0].content[0].text, '欢迎，林澈。')
  const edited = await harness.sessions.setOpeningText(harness.agent, {
    expectedRevision: profile.revision,
    openingText: '再见，{{user}}。',
  })
  assert.equal(edited.scene.openingText, '再见，{{user}}。')
  assert.equal(harness.agent.session.deriveMessages()[0].content[0].text, '再见，林澈。')

  const over = createSessionHarness(1048576, value => value, async text => text.replace('{{user}}', '界'.repeat(MAX_OPENING_CHARACTERS + 1)))
  await assert.rejects(over.sessions.bindResources(over.agent, {
    expectedRevision: 0,
    card: { id: 'card-a' },
    persona: { id: 'persona-a' },
    lorebooks: [],
    openingText: '{{user}}',
  }), error => error.code === 'LIMIT_EXCEEDED')
  assert.deepEqual(over.events, [])
  await harness.ctx.fiber.dispose()
  await over.ctx.fiber.dispose()
})

test('switches execution mode with CAS while preserving the roleplay profile', async () => {
  const harness = createSessionHarness(262144)
  const configured = await harness.sessions.configure(harness.agent, { mode: 'director', runtime: { executionMode: 'chat' } })
  const switched = await harness.sessions.setExecutionMode(harness.agent, { expectedRevision: configured.revision, executionMode: 'agent' })
  assert.equal(switched.runtime.executionMode, 'agent')
  assert.equal(switched.mode, configured.mode)
  assert.deepEqual(switched.resources, configured.resources)
  await assert.rejects(
    harness.sessions.setExecutionMode(harness.agent, { expectedRevision: configured.revision, executionMode: 'chat' }),
    error => error.code === 'REVISION_CONFLICT',
  )
  harness.agent.status = 'running'
  await assert.rejects(
    harness.sessions.setExecutionMode(harness.agent, { expectedRevision: switched.revision, executionMode: 'chat' }),
    error => error.code === 'SESSION_RUNNING',
  )
  await harness.ctx.fiber.dispose()
})

test('persists a validated Session context layout with CAS and rejects edits while running', async () => {
  let profileOverride
  const harness = createSessionHarness(262144, (value, _agent, profile) => {
    profileOverride = profile
    return { ...value, version: 1 }
  })
  const configured = await harness.sessions.configure(harness.agent, { mode: 'director' })
  const contextBuild = {
    version: 1,
    slots: [
      { id: 'custom-2', label: '回复要求', sourceIds: ['rp.custom:custom-2'], sectionTag: true },
    ],
    customSources: [{ slotId: 'custom-2', content: '保持第一人称。' }],
  }
  const updated = await harness.sessions.setContextBuild(harness.agent, { expectedRevision: configured.revision, contextBuild })
  assert.deepEqual(updated.contextBuild, contextBuild)
  assert.deepEqual(profileOverride.contextBuild, contextBuild)
  assert.equal(updated.mode, configured.mode)
  await assert.rejects(
    harness.sessions.setContextBuild(harness.agent, { expectedRevision: configured.revision, contextBuild }),
    error => error.code === 'REVISION_CONFLICT',
  )
  harness.agent.status = 'running'
  await assert.rejects(
    harness.sessions.setContextBuild(harness.agent, { expectedRevision: updated.revision, contextBuild }),
    error => error.code === 'SESSION_RUNNING',
  )
  await harness.ctx.fiber.dispose()
})

function fakeCommands() {
  let definition
  let sequence = 0
  return {
    register(value) { definition = value; return () => {} },
    async execute(agent, line, images, signal) {
      assert.deepEqual(images, [])
      assert.equal(line.startsWith(`/${definition.name}`), true)
      const rawInput = line.slice(definition.name.length + 1)
      const commandId = `command-${++sequence}`
      agent.session.append('command/run', { commandId, name: definition.name, args: rawInput, source: { kind: 'user' } })
      try {
        const result = await definition.handler({ agent, commandId, rawInput, signal })
        agent.session.append('command/done', { commandId, kind: result.kind, ...(result.text === undefined ? {} : { text: result.text }) })
        return { commandId, result }
      } catch (error) {
        agent.session.append('command/done', { commandId, kind: 'error', text: error.message })
        throw error
      }
    },
  }
}

function createSessionHarness(maxProfileCommandBytes, resolveContextBuild = value => value, transformText = async text => text) {
  const ctx = new Context()
  ctx.provide('rpRuntime', { registerContextSource() {}, registerRunGuard() {}, registerSessionProfileProvider() {}, syncExecutionMode() {}, resolveContextBuild, transformText })
  ctx.provide('commands', fakeCommands())
  ctx.provide('agents', { list: () => [] })
  const sessions = new RpSessions(ctx, { defaultMode: 'director', defaultExecutionMode: 'chat', maxProfileCommandBytes })
  const events = []
  const agent = { status: 'idle', session: fakeSession(events) }
  return { ctx, sessions, events, agent }
}

function fakeSession(events = []) {
  const surface = { nodes: [] }
  return {
    events,
    surface,
    append(type, data, options = {}) {
      const event = { type, seq: events.length, data, ...options }
      events.push(event)
      if (options.surfaceOp === 'append') surface.nodes.push(event.seq)
      else if (options.surfaceOp?.op === 'replace') {
        const start = surface.nodes.indexOf(options.surfaceOp.start)
        const end = surface.nodes.indexOf(options.surfaceOp.end)
        if (start < 0 || end < start) throw new Error('invalid fake surface replacement')
        surface.nodes.splice(start, end - start + 1, event.seq)
      }
      return event
    },
    deriveMessages() {
      return surface.nodes.map(seq => events[seq]).flatMap(event => {
        const message = event.type === 'assistant/message' ? event.data.message : undefined
        if (message === undefined || message.content.length === 0) return []
        return [message]
      })
    },
  }
}

function seedOpening(session, text) {
  const message = createAssistantMessage({
    content: [{ type: 'text', text }],
    source: {
      provider: 'rp-session',
      model: 'selected-opening',
      profileRevision: 1,
      openingAnchorRevision: 1,
    },
  })
  session.append('turn/start', { turn: 1 })
  session.append('step/start', { turn: 1, step: 1 })
  session.append('assistant/message', { turn: 1, step: 1, message }, { surfaceOp: 'append', sourceEventSeqs: [] })
  session.append('step/end', { turn: 1, step: 1 })
  session.append('turn/end', { turn: 1, reason: { kind: 'completed' } })
}

function profileFromCommandEvents(events) {
  const run = events.find(event => event.type === 'command/run')
  return JSON.parse(run.data.args).profile
}
