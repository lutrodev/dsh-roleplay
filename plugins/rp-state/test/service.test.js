import assert from 'node:assert/strict'
import test from 'node:test'
import { Context } from '@deepseek-ai/cordis'
import { RP_SESSION_APPLY_COMMAND, encodeSessionCommand } from 'dsh-roleplay-rp-session/protocol'
import { STATE_ACTIVITY_PROJECTION_KEY, RpState, createStateLoreActivation } from '../src/index.js'

test('State lore gate supports cross-namespace expressions and fails closed with diagnostics', () => {
  const adapter = createStateLoreActivation({
    revision: 8,
    namespaces: {
      story: { value: { affection: 51, object: { nested: true } } },
      world: { value: { danger: 2 } },
    },
  })
  assert.equal(adapter.revision, 8)
  assert.deepEqual(adapter.gateEntry({ entry: { stateCondition: 'state("story", "/affection") > 50 && state("world", "/danger") <= 2' } }), { active: true, diagnostics: [] })
  const missing = adapter.gateEntry({ entry: { stateCondition: 'state("story", "/missing") == 1' } })
  assert.equal(missing.active, false)
  assert.equal(missing.diagnostics[0].code, 'STATE_CONDITION_MISSING')
  const wrongType = adapter.gateEntry({ entry: { stateCondition: 'state("story", "/object") == true' } })
  assert.equal(wrongType.active, false)
  assert.equal(wrongType.diagnostics[0].code, 'STATE_CONDITION_INVALID')
  const invalid = adapter.gateEntry({ entry: { stateCondition: 'state.story.affection > 50' } })
  assert.equal(invalid.active, false)
  assert.equal(invalid.diagnostics[0].reason, 'state-condition-invalid')
})

test('registers State v2 context, semantic effect, diagnostics, and Chat-readable tools', async () => {
  const harness = createHarness()
  const rules = [{
    id: 'hp-turn', target: '/hp', when: '每回合核对生命值', effect: { op: 'set' }, guidance: [], cadence: 'every-turn',
  }]
  const agent = seededAgent({ hp: 10 }, definition('rules-required', rules))
  const state = new RpState(harness.ctx, { maxNamespacesInContext: 32 })
  await new Promise(resolve => setImmediate(resolve))

  assert.equal(harness.contextSource.id, 'rp.state')
  assert.equal(harness.contextSource.parentDelivery, 'commit')
  assert.equal(harness.contextSource.required, true)
  assert.deepEqual(harness.projections.map(projection => projection.key), ['rp/state', STATE_ACTIVITY_PROJECTION_KEY])
  assert.equal(harness.projections.find(projection => projection.key === STATE_ACTIVITY_PROJECTION_KEY).stateVersion, 1)
  assert.deepEqual(harness.chatReadable, ['rp_state_read'])
  assert.deepEqual(harness.tools.map(tool => tool.name).sort(), ['rp_state', 'rp_state_read'])
  assert.equal(harness.effectType.schema.additionalProperties, false)
  assert.equal(harness.effectType.schema.properties.kind.const, 'state.update')
  assert.equal(harness.effectType.schema.properties.payload.additionalProperties, false)
  assert.equal(harness.effectType.schema.properties.payload.properties.changes.items.oneOf.length, 4)
  const readSchema = harness.tools.find(tool => tool.name === 'rp_state_read').parameters
  assert.deepEqual(readSchema.properties.action.enum, ['list', 'get'])
  const mutationSchema = harness.tools.find(tool => tool.name === 'rp_state').parameters
  assert.deepEqual(mutationSchema.properties.action.enum, ['create', 'update', 'reset', 'delete'])
  assert.equal(mutationSchema.properties.definition.additionalProperties, false)
  assert.deepEqual(mutationSchema.properties.definition.required, ['title', 'updateMode', 'schema', 'rules'])
  assert.deepEqual(mutationSchema.properties.definition.properties.updateMode.enum, ['rules-required', 'schema-only', 'disabled'])
  assert.equal(mutationSchema.properties.definition.properties.rules.type, 'array')
  const prepared = harness.contextSource.prepare({ agent })
  const visible = JSON.parse(prepared.text)
  assert.deepEqual(Object.keys(visible), ['namespaces'])
  assert.equal(visible.namespaces[0].namespace, 'story')
  assert.equal(visible.namespaces[0].title, '故事状态')
  assert.deepEqual(visible.namespaces[0].value, { hp: 10 })
  for (const field of ['initialValue', 'expectedRevision', 'updateMode', 'schema', 'rules', 'diagnostics']) {
    assert.equal(Object.hasOwn(visible.namespaces[0], field), false)
  }
  assert.equal(Object.hasOwn(visible, 'protocolVersion'), false)
  assert.equal(Object.hasOwn(visible, 'updateProtocol'), false)

  const commitVisible = JSON.parse(prepared.parentText)
  const contract = commitVisible.state_commit_contract
  assert.equal(contract.version, 1)
  assert.equal(contract.stateProtocolVersion, 2)
  assert.equal(contract.effectKind, 'state.update')
  assert.equal(contract.namespaces[0].namespace, 'story')
  assert.equal(contract.namespaces[0].updateMode, 'rules-required')
  assert.equal(contract.namespaces[0].expectedRevision, 1)
  assert.deepEqual(contract.namespaces[0].currentValue, { hp: 10 })
  assert.deepEqual(contract.namespaces[0].rules, [{
    ruleId: 'hp-turn',
    target: '/hp',
    op: 'set',
    when: '每回合核对生命值',
    cadence: 'every-turn',
    valueSchema: { type: 'integer', minimum: 0, maximum: 100 },
  }])
  assert.equal(Object.hasOwn(contract.namespaces[0], 'schema'), false)
  assert.equal(Object.hasOwn(contract.namespaces[0], 'initialValue'), false)
  assert.equal(Object.hasOwn(contract.namespaces[0], 'diagnostics'), false)
  assert.match(contract.constraints.join('\n'), /increment uses by/)
  assert.equal(/\n\s+"/.test(prepared.parentText), false)
  assert.ok([...prepared.text].length < [...prepared.parentText].length)
  assert.deepEqual(harness.effectType.diagnoseArguments({
    kind: 'state.update', namespace: 'story', expectedRevision: 1,
    payload: { changes: [{ op: 'increment', path: '/hp', value: -2, reason: '生命值下降' }] },
  }, { path: 'effects[0]' }), [
    '"effects[0].payload.changes[0]" uses op "increment": rename field "value" to "by" without changing its value.',
  ])

  assert.equal(harness.diagnostic.inspect({ effects: [] }, { agent })[0].code, 'STATE_EVERY_TURN_MISSED')
  assert.deepEqual(harness.diagnostic.inspect({ effects: [{
    kind: 'state.update', namespace: 'story', payload: { changes: [{ path: '/hp', ruleId: 'hp-turn' }] },
  }] }, { agent }), [])
  assert.deepEqual(state.read(agent, { action: 'get', namespace: 'story' }).initialValue, { hp: 10 })
  await harness.ctx.fiber.dispose()
})

test('commit context omits unwritable State payloads and non-actionable diagnostics', async () => {
  const harness = createHarness()
  const agent = seededAgent({ hp: 10 }, definition('disabled'), {
    setup: [
      { code: 'STATE_NOTE', severity: 'info', message: '仅供界面展示。' },
      { code: 'STATE_DISABLED', severity: 'error', message: '此命名空间不能安全更新。' },
    ],
    lastCommit: [],
  })
  new RpState(harness.ctx, { maxNamespacesInContext: 32 })
  await new Promise(resolve => setImmediate(resolve))

  const commitVisible = JSON.parse(harness.contextSource.prepare({ agent }).parentText)
  assert.deepEqual(commitVisible.state_commit_contract.namespaces, [{
    namespace: 'story',
    expectedRevision: 1,
    updateMode: 'disabled',
    title: '故事状态',
    currentValue: { hp: 10 },
    diagnostics: { setup: [{ code: 'STATE_DISABLED', severity: 'error', message: '此命名空间不能安全更新。' }] },
  }])
  assert.doesNotMatch(JSON.stringify(commitVisible), /仅供界面展示|"schema"|"rules"/)
  await harness.ctx.fiber.dispose()
})

test('validates semantic effects with CAS and returns canonical full result snapshots', async () => {
  const harness = createHarness()
  const state = new RpState(harness.ctx, { maxNamespacesInContext: 32 })
  const agent = seededAgent({ hp: 10 })
  const accepted = harness.effectType.validate({
    kind: 'state.update', namespace: 'story', expectedRevision: 1,
    payload: { changes: [{ op: 'increment', path: '/hp', by: -2, reason: '角色受到轻伤' }] },
  }, { agent, acceptedEffects: [] })
  assert.equal(accepted.kind, 'state.update')
  assert.equal(accepted.payload.result.revision, 2)
  assert.deepEqual(accepted.payload.result.value, { hp: 8 })
  assert.deepEqual(accepted.payload.result.initialValue, { hp: 10 })
  assert.throws(() => harness.effectType.validate({
    kind: 'state.update', namespace: 'story', expectedRevision: 0,
    payload: { changes: [{ op: 'set', path: '/hp', value: 8, reason: 'wrong revision' }] },
  }, { agent, acceptedEffects: [] }), error => error.code === 'REVISION_CONFLICT'
    && error.issues[0].path === '/expectedRevision'
    && error.issues[0].namespace === 'story'
    && error.issues[0].changeIndex === null
    && error.issues[0].ruleId === null)
  assert.throws(() => harness.effectType.validate({
    kind: 'state.update', namespace: 'story', expectedRevision: 1,
    payload: { changes: [{ op: 'set', path: '/hp', value: 8, reason: 'duplicate namespace' }] },
  }, { agent, acceptedEffects: [accepted] }), error => /Only one/.test(error.message)
    && error.issues[0].path === '/namespace')
  assert.throws(() => harness.effectType.validate({
    kind: 'state.update', target: 'story', expectedRevision: 1,
    payload: { changes: [{ op: 'set', path: '/hp', value: 8, reason: 'wrong field' }] },
  }, { agent, acceptedEffects: [] }), error => /unknown field|requires namespace/.test(error.message)
    && error.issues[0].path === '/target'
    && error.issues[0].namespace === null
    && error.issues[0].changeIndex === null
    && error.issues[0].ruleId === null)
  assert.deepEqual(state.get(agent).namespaces.story.value, { hp: 10 })
  await harness.ctx.fiber.dispose()
})

test('create, update, reset, and delete are durable configuration commands with schema replacement requirements', async () => {
  const harness = createHarness()
  const state = new RpState(harness.ctx, { maxNamespacesInContext: 32 })
  const agent = emptyAgent()
  const baseDefinition = definition()
  await configureState(state, agent, 'create', {
    action: 'create', namespace: 'story', expectedRevision: 0,
    definition: baseDefinition, initialValue: { hp: 10 },
  })
  assert.equal(state.get(agent).namespaces.story.revision, 1)
  const expandedDefinition = {
    title: '故事状态', updateMode: 'schema-only', rules: [],
    schema: {
      type: 'object',
      properties: { hp: { type: 'integer', minimum: 0, maximum: 100 }, mood: { type: 'string' } },
      required: ['hp', 'mood'], additionalProperties: false,
    },
  }
  const commandsBeforeFailure = agent.session.snapshotEvents().filter(event => event.type === 'command/run').length
  await assert.rejects(configureState(state, agent, 'invalid-update', {
    action: 'update', namespace: 'story', expectedRevision: 1, definition: expandedDefinition,
  }), /missing required property "mood"/)
  assert.equal(agent.session.snapshotEvents().filter(event => event.type === 'command/run').length, commandsBeforeFailure)
  await configureState(state, agent, 'update', {
    action: 'update', namespace: 'story', expectedRevision: 1, definition: expandedDefinition,
    initialValue: { hp: 10, mood: 'calm' }, value: { hp: 8, mood: 'hurt' },
  })
  assert.deepEqual(state.get(agent).namespaces.story.value, { hp: 8, mood: 'hurt' })
  await assert.rejects(configureState(state, agent, 'stale-reset', {
    action: 'reset', namespace: 'story', expectedRevision: 1,
  }), error => error.code === 'REVISION_CONFLICT')
  await configureState(state, agent, 'reset', { action: 'reset', namespace: 'story', expectedRevision: 2 })
  assert.deepEqual(state.get(agent).namespaces.story.value, { hp: 10, mood: 'calm' })
  await configureState(state, agent, 'delete', { action: 'delete', namespace: 'story', expectedRevision: 3 })
  assert.deepEqual(state.get(agent).namespaces, {})
  assert.equal(agent.session.snapshotEvents().filter(event => event.type === 'command/run').length, 4)
  await assert.rejects(state.configure(agent, {
    action: 'create', namespace: 'other', expectedRevision: 0,
    definition: baseDefinition, initialValue: { hp: 1 },
  }), /owner must be an object/)
  await harness.ctx.fiber.dispose()
})

test('rp_state_read works in either mode while rp_state requires Agent mode and refreshes run context', async () => {
  const harness = createHarness({ executionMode: 'chat' })
  const state = new RpState(harness.ctx, { maxNamespacesInContext: 32 })
  const agent = emptyAgent()
  const readTool = harness.tools.find(tool => tool.name === 'rp_state_read')
  const mutationTool = harness.tools.find(tool => tool.name === 'rp_state')
  assert.deepEqual(await readTool.execute({ action: 'list' }, { agent }), { protocolVersion: 2, revision: 0, namespaces: [] })
  await assert.rejects(mutationTool.execute({
    action: 'create', namespace: 'story', expectedRevision: 0, definition: definition(), initialValue: { hp: 10 },
  }, { agent }), error => error.code === 'AGENT_MODE_REQUIRED')
  harness.profile.runtime.executionMode = 'agent'
  appendStateToolCall(agent, 'tool-create')
  const result = await mutationTool.execute({
    action: 'create', namespace: 'story', expectedRevision: 0, definition: definition(), initialValue: { hp: 10 },
  }, { agent, callId: 'tool-create' })
  assert.equal(result.ok, true)
  assert.equal(result.phases.contextRefresh.status, 'succeeded')
  assert.equal(result.runContext.commitContextReplacement, '<commit_context_replacement context_epoch="1" />')
  assert.equal(harness.refreshes.length, 1)
  assert.equal(harness.refreshes[0].kind, 'state-configuration')
  harness.failRefresh = true
  appendStateToolCall(agent, 'tool-update', 1, 2)
  const partial = await mutationTool.execute({
    action: 'update', namespace: 'story', expectedRevision: 1, definition: definition(),
  }, { agent, callId: 'tool-update' })
  assert.equal(partial.ok, false)
  assert.equal(partial.phases.stateWrite.durable, true)
  assert.equal(partial.phases.contextRefresh.status, 'failed')
  assert.equal(state.get(agent).namespaces.story.revision, 2)
  await harness.ctx.fiber.dispose()
})

test('serializes concurrent configuration calls before applying namespace CAS', async () => {
  const harness = createHarness()
  const state = new RpState(harness.ctx, { maxNamespacesInContext: 32 })
  const agent = emptyAgent()
  const createOwner = appendStateToolCall(agent, 'parallel-create')
  const updateOwner = appendStateToolCall(agent, 'parallel-update')
  await Promise.all([
    state.configure(agent, {
      action: 'create', namespace: 'story', expectedRevision: 0,
      definition: definition(), initialValue: { hp: 10 },
    }, createOwner),
    state.configure(agent, {
      action: 'update', namespace: 'story', expectedRevision: 1,
      definition: definition(), value: { hp: 8 },
    }, updateOwner),
  ])
  assert.equal(state.get(agent).namespaces.story.revision, 2)
  assert.deepEqual(state.get(agent).namespaces.story.value, { hp: 8 })
  await harness.ctx.fiber.dispose()
})

function createHarness(options = {}) {
  const ctx = new Context()
  const harness = {
    ctx,
    tools: [],
    projections: [],
    chatReadable: [],
    refreshes: [],
    profile: { runtime: { executionMode: options.executionMode ?? 'agent' } },
  }
  const runtime = {
    registerContextSource(definition) { harness.contextSource = definition; return () => {} },
    registerEffectType(definition) { harness.effectType = definition; return () => {} },
    registerCommitDiagnosticProvider(definition) { harness.diagnostic = definition; return () => {} },
    registerChatReadableTool(definition) { harness.chatReadable.push(definition.name); return () => {} },
    decodeCommitEvent(event) { return event.data?.error === undefined ? event.data?.meta : undefined },
    async refreshRunContext(_agent, request) {
      harness.refreshes.push(request)
      if (harness.failRefresh) throw new Error('refresh failed')
      return {
        contextEpoch: harness.refreshes.length,
        commitContextReplacement: `<commit_context_replacement context_epoch="${harness.refreshes.length}" />`,
      }
    },
  }
  ctx.provide('rpRuntime', runtime)
  ctx.provide('commands', fakeCommands())
  ctx.provide('tools', { register(definition) { harness.tools.push(definition); return () => {} } })
  ctx.provide('sessionProjections', {
    register(definition) { harness.projections.push(definition); return () => {} },
    stateOf() { return undefined },
  })
  ctx.provide('rpSessions', { get() { return harness.profile } })
  return harness
}

function definition(updateMode = 'schema-only', rules = []) {
  return {
    title: '故事状态', updateMode, rules,
    schema: { type: 'object', properties: { hp: { type: 'integer', minimum: 0, maximum: 100 } }, required: ['hp'], additionalProperties: false },
  }
}

function seededAgent(initialValue, stateDefinition = definition(), diagnostics = { setup: [], lastCommit: [] }) {
  const profile = {
    revision: 1,
    stateBootstrap: { version: 2, namespaces: [{ namespace: 'story', initialValue, definition: stateDefinition, diagnostics }] },
  }
  return agentWithEvents([
    { seq: 0, type: 'command/run', data: { commandId: 'profile', name: RP_SESSION_APPLY_COMMAND, args: encodeSessionCommand(0, profile) } },
    { seq: 1, type: 'command/done', data: { commandId: 'profile', kind: 'success' } },
  ])
}

function emptyAgent() {
  return agentWithEvents([])
}

function agentWithEvents(events) {
  return {
    session: {
      get seq() { return events.length },
      snapshotEvents(from = 0, to = events.length) { return events.slice(from, to) },
      eventAt(seq) { return events[seq] },
      append(type, data, options = {}) {
        const event = { seq: events.length, type, data, ...options }
        events.push(event)
        return event
      },
    },
  }
}

function appendStateToolCall(agent, callId, turn = 1, step = 1) {
  const assistant = agent.session.append('assistant/message', {
    turn,
    step,
    message: {
      id: `assistant-${callId}`,
      role: 'assistant',
      source: { kind: 'model' },
      content: [{ type: 'tool-call', id: callId, name: 'rp_state', arguments: '{}' }],
    },
  }, { surfaceOp: 'append' })
  agent.session.append('tool/call', { turn, step, callId, name: 'rp_state', arguments: '{}' })
  return {
    kind: 'assistant-tool',
    tool: 'rp_state',
    callId,
    assistant: { seq: assistant.seq, messageId: assistant.data.message.id, turn, step },
  }
}

function configureState(state, agent, callId, request) {
  return state.configure(agent, request, appendStateToolCall(agent, callId))
}

function fakeCommands() {
  let definition
  let sequence = 0
  return {
    register(value) { definition = value; return () => {} },
    async execute(agent, line, images, signal) {
      assert.deepEqual(images, [])
      const rawInput = line.slice(definition.name.length + 1)
      const commandId = `state-${++sequence}`
      agent.session.append('command/run', { commandId, name: definition.name, args: rawInput })
      try {
        const result = await definition.handler({ agent, rawInput, signal })
        agent.session.append('command/done', { commandId, kind: result.kind })
        return { commandId, result }
      } catch (error) {
        agent.session.append('command/done', { commandId, kind: 'error' })
        throw error
      }
    },
  }
}
