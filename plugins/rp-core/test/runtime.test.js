import assert from 'node:assert/strict'
import test from 'node:test'
import { Context } from '@deepseek-ai/cordis'
import { ToolCallId, createAssistantMessage, createToolResultMessage, createUserMessage } from '@deepseek-ai/dsh-llm'
import { Session, SessionId } from '@deepseek-ai/dsh-session'
import { createRpMessageActionMetadata } from '../src/conversation.js'
import { RpRuntime } from '../src/runtime.js'

test('collects ordered context, validates effects and produces the sole commit metadata', async () => {
  const ctx = new Context()
  let commitTool
  let writerTool
  let runtimeContract
  ctx.provide('systemPrompt', { section(definition) { runtimeContract = definition } })
  ctx.provide('tools', { register(tool) {
    if (tool.name === 'rp_write_turn') writerTool = tool
    if (tool.name === 'rp_commit_turn') commitTool = tool
  } })
  ctx.provide('agents', { get() { return undefined } })
  const runtime = new RpRuntime(ctx, { chatMaxStepsPerRun: 3, agentMaxStepsPerRun: 8, maxEffectsPerCommit: 2, maxArtifactBytes: 4096 })
  assert.equal(Object.hasOwn(commitTool.parameters.properties, 'narrative'), false)
  assert.equal(commitTool.parameters.additionalProperties, false)
  assert.equal(commitTool.parameters.properties.effects.items, undefined)
  const contractText = runtimeContract.text({ agent: { session: { header: {} } } })
  assert.match(contractText, /adaptive mode.*infer from each user message/i)
  assert.match(contractText, /completed prose is inserted into the next assistant message/i)
  assert.match(contractText, /do not reproduce, quote, summarize, or revise it/i)
  assert.doesNotMatch(contractText, /required starting draft/i)
  assert.match(contractText, /call exactly one rp_commit_turn/i)
  assert.match(contractText, /call rp_write_turn exactly once/i)
  assert.match(contractText, /\{"action":"write"\}/)
  assert.deepEqual(writerTool.parameters.required, ['action'])
  assert.deepEqual(writerTool.parameters.properties.action.enum, ['write'])
  assert.deepEqual(Object.keys(writerTool.parameters.properties), ['action', 'brief'])
  assert.equal(writerTool.parameters.additionalProperties, false)
  assert.match(contractText, /narrative was already inserted and must not be repeated/i)
  assert.match(contractText, /apply every correction exactly/i)
  assert.match(writerTool.description, /Review and revise the returned draft/i)
  assert.match(commitTool.description, /generated prose is already the complete visible narrative/i)
  assert.equal(runtimeContract.text({ agent: { session: { header: { origin: 'subagent' } } } }), '')
  runtime.registerContextSource({ id: 'later', dependsOn: ['first'], prepare: () => ({ revision: 2, text: 'later' }) })
  runtime.registerContextSource({ id: 'first', prepare: () => ({ revision: 1, text: 'first' }) })
  runtime.registerEffectType({
    kind: 'test.effect',
    schema: testEffectSchema(),
    validate: effect => ({ kind: effect.kind, target: effect.target, payload: { accepted: true } }),
  })
  const effectSchema = commitTool.parameters.properties.effects.items
  assert.equal(effectSchema.additionalProperties, false)
  assert.equal(effectSchema.properties.kind.const, 'test.effect')
  assert.deepEqual(effectSchema.required, ['kind', 'target', 'payload'])
  runtime.registerCommitDiagnosticProvider({ id: 'test.diagnostic', inspect: () => [{ code: 'TEST_NOTICE', severity: 'info', message: 'recorded' }] })
  runtime.registerCommitDiagnosticProvider({ id: 'test.failed-diagnostic', inspect: () => { throw new Error('diagnostics must not block') } })

  const events = []
  const agent = { session: { events, append(type, data, opts) { const event = { seq: events.length, type, data, ...opts }; events.push(event); return event } } }
  const run = await runtime.prepareRun(agent, 1, [{ role: 'user', source: { kind: 'user' }, content: [{ type: 'text', text: 'Open the gate.' }] }])
  assert.equal(events.length, 0)
  assert.deepEqual(run.fragments.map(fragment => fragment.id), ['first', 'later', 'rp.current-input'])
  let concluded = false
  seedWriter(run, 'The gate opens.')
  appendCommitCall(events, 1, 1, 'commit-1', 'The gate opens.')
  const result = await commitTool.execute({
    effects: [{ kind: 'test.effect', target: 'gate', payload: {} }],
  }, { agent, callId: 'commit-1', concludeTurn() { concluded = true } })
  assert.equal(concluded, true)
  assert.equal(result.meta.kind, 'rp-agent/turn-commit')
  assert.equal(result.meta.executionMode, 'chat')
  assert.equal(result.meta.effects[0].payload.accepted, true)
  assert.equal(result.meta.runSummary, 'The gate opens.')
  assert.deepEqual(result.meta.references, [])
  assert.deepEqual(result.meta.extensions, {})
  assert.deepEqual(result.meta.diagnostics.map(item => item.code), ['TEST_NOTICE', 'RP_COMMIT_DIAGNOSTIC_FAILED'])
  assert.equal(result.narrative, undefined)
  assert.deepEqual(result.meta.assistant, { seq: 0, messageId: 'assistant-commit-1' })
  await assert.rejects(commitTool.execute({ runSummary: 'again', effects: [], references: [], extensions: {} }, { agent, callId: 'second', concludeTurn() {} }), /commit in flight/)
  await ctx.fiber.dispose()
})

test('commit exposes registered effect schemas and returns structured correction feedback', async () => {
  const ctx = new Context()
  const tools = new Map()
  ctx.provide('systemPrompt', { section() {} })
  ctx.provide('tools', { register(tool) { tools.set(tool.name, tool) } })
  ctx.provide('agents', { get() { return undefined } })
  const runtime = new RpRuntime(ctx, {
    chatMaxStepsPerRun: 5, agentMaxStepsPerRun: 8,
    maxEffectsPerCommit: 2, maxArtifactBytes: 4096,
  })
  assert.throws(() => runtime.registerEffectType({
    kind: 'open.effect',
    schema: { type: 'object', properties: { kind: { type: 'string', const: 'open.effect' } }, required: ['kind'] },
    validate: effect => effect,
  }), /closed object/)
  assert.throws(() => runtime.registerEffectType({
    kind: 'bad.diagnostic', schema: testEffectSchema('bad.diagnostic'), diagnoseArguments: 'invalid', validate: effect => effect,
  }), /diagnoseArguments must be a function/)
  runtime.registerEffectType({
    kind: 'test.effect',
    schema: testEffectSchema(),
    diagnoseArguments: (effect, { path }) => effect.target === 'bounded'
      ? Array.from({ length: 40 }, (_value, index) => `${index}:${'x'.repeat(1100)}`)
      : [`"${path}.value" is not accepted by test.effect; remove it.`],
    validate: effect => effect,
  })
  const boundedCorrections = runtime.commitArgumentCorrections({
    effects: [{ kind: 'test.effect', target: 'bounded', payload: {} }],
  })
  assert.equal(boundedCorrections.length, 32)
  assert.equal([...boundedCorrections[0]].length, 1000)

  const commit = tools.get('rp_commit_turn')
  const agent = { session: { events: [] } }
  const exec = { agent, callId: 'invalid-effect', concludeTurn() { throw new Error('invalid arguments must not conclude') } }
  let failure
  await assert.rejects(
    commit.execute({ effects: [{ kind: 'test.effect', target: 'gate', payload: {}, value: 2 }] }, exec),
    error => {
      failure = error
      return error.code === 'INVALID_ARGS' && error.violations.some(item => item.includes('effects[0].value'))
    },
  )
  const content = commit.finalizeContent(exec, {
    isError: true,
    error: { message: failure.message, info: { name: failure.name, code: failure.code } },
    content: [{ type: 'text', text: `Error: ${failure.message}` }],
  })
  const feedback = JSON.parse(content[0].text)
  assert.equal(feedback.status, 'error')
  assert.equal(feedback.error.category, 'invalid_arguments')
  assert.equal(feedback.error.retryable, true)
  assert.match(feedback.error.message, /precise correction/)
  assert.deepEqual(feedback.error.corrections, [
    '"effects[0].value" is not accepted by test.effect; remove it.',
  ])
  assert.ok(feedback.error.violations.some(item => item.includes('effects[0].value')))
  assert.equal(commit.finalizeContent(exec, {
    isError: true,
    error: { message: failure.message },
    content: [],
  }), undefined)
  await ctx.fiber.dispose()
})

test('Writer receives narrative context while both parent modes receive separate commit-delivery context', async () => {
  const ctx = new Context()
  ctx.provide('systemPrompt', { section() {} })
  ctx.provide('tools', { register() {} })
  ctx.provide('agents', { get() { return undefined } })
  const runtime = new RpRuntime(ctx, {
    chatMaxStepsPerRun: 3, agentMaxStepsPerRun: 8,
    maxEffectsPerCommit: 2, maxArtifactBytes: 4096,
  })
  runtime.registerContextSource({
    id: 'rp.state', label: '会话变量', parentDelivery: 'commit',
    defaultSlot: { id: 'state', label: '状态' },
    prepare: () => ({ revision: 3, text: 'current state: gate open', parentText: 'state revision 3 and update rules' }),
  })
  runtime.registerContextSource({
    id: 'rp.lore', label: '世界书', defaultSlot: { id: 'lore', label: '世界书' },
    prepare: () => ({ revision: 7, text: 'secret lore text' }),
  })
  assert.throws(() => runtime.registerContextSource({ id: 'invalid', parentDelivery: 'full', prepare: () => ({ text: 'x' }) }), /parentDelivery/)

  const input = currentInput()
  const chatAgent = { session: { events: [], append() {} } }
  const chatRun = await runtime.prepareRun(chatAgent, 1, [input])
  const chatReady = runtime.writerReadyMessage(chatRun).content.map(block => block.text ?? '').join('')
  assert.match(chatReady, /<commit_context read_only="true">/)
  assert.match(chatReady, /state revision 3 and update rules/)
  assert.doesNotMatch(chatReady, /current state: gate open|secret lore text|<roleplay_context/)
  assert.match(chatRun.contextText, /current state: gate open/)
  assert.doesNotMatch(chatRun.contextText, /state revision 3 and update rules/)
  assert.match(chatRun.contextText, /secret lore text/)

  ctx.provide('rpSessions', { get: () => ({
    runtime: { executionMode: 'agent' }, resources: { lorebooks: [], writingStyles: [] },
    contextBuild: { version: 1, slots: [
      { id: 'state', label: '状态', sourceIds: ['rp.state'] },
      { id: 'lore', label: '世界书', sourceIds: ['rp.lore'] },
      { id: 'current-input', label: '当前输入', sourceIds: ['rp.current-input'] },
    ] },
  }) })
  const agentRun = await runtime.prepareRun({ session: { events: [], append() {} } }, 2, [input])
  const agentReady = runtime.writerReadyMessage(agentRun).content.map(block => block.text ?? '').join('')
  assert.match(agentReady, /<roleplay_context read_only="true">/)
  assert.match(agentReady, /current state: gate open/)
  assert.match(agentReady, /secret lore text/)
  assert.match(agentReady, /<commit_context read_only="true">/)
  assert.match(agentReady, /state revision 3 and update rules/)
  assert.doesNotMatch(agentRun.contextText, /state revision 3 and update rules/)

  runtime.registerContextSource({ id: 'orphan-parent-text', prepare: () => ({ text: 'visible', parentText: 'hidden' }) })
  await assert.rejects(
    runtime.prepareRun({ session: { events: [], append() {} } }, 3, [input]),
    /returned parentText without parent delivery/,
  )
  await ctx.fiber.dispose()
})

test('rejects unknown effects without creating a commit', async () => {
  const ctx = new Context()
  let commitTool
  ctx.provide('systemPrompt', { section() {} })
  ctx.provide('tools', { register(tool) { commitTool = tool } })
  ctx.provide('agents', { get() { return undefined } })
  const runtime = new RpRuntime(ctx, { chatMaxStepsPerRun: 2, agentMaxStepsPerRun: 8, maxEffectsPerCommit: 1, maxArtifactBytes: 1024 })
  const events = []
  const agent = { session: { events, append() {} } }
  const run = await runtime.prepareRun(agent, 1, [currentInput()])
  seedWriter(run, 'x')
  appendCommitCall(events, 1, 1, 'unknown-1', 'x')
  await assert.rejects(commitTool.execute({ runSummary: 'x', effects: [{ kind: 'unknown', payload: {} }], references: [], extensions: {} }, { agent, callId: 'unknown-1', concludeTurn() { throw new Error('must not conclude') } }), /not registered/)
  await ctx.fiber.dispose()
})

test('rejects missing prose, oversized prose, mismatched calls, duplicate commits, and sibling tools', async () => {
  const ctx = new Context()
  const tools = new Map()
  ctx.provide('systemPrompt', { section() {} })
  ctx.provide('tools', { register(tool) { tools.set(tool.name, tool) } })
  ctx.provide('agents', { get() { return undefined } })
  const runtime = new RpRuntime(ctx, {
    chatMaxStepsPerRun: 2, agentMaxStepsPerRun: 8,
    maxEffectsPerCommit: 1, maxArtifactBytes: 4096, maxNarrativeCharacters: 4,
  })
  const commit = tools.get('rp_commit_turn')
  const attempt = async (callId, text, extraBlocks = [], execCallId = callId) => {
    const events = []
    const agent = { session: { events, append() {} } }
    const run = await runtime.prepareRun(agent, 1, [currentInput()])
    seedWriter(run, text)
    appendCommitCall(events, 1, 1, callId, text, extraBlocks)
    return commit.execute(
      { runSummary: 'summary', effects: [], references: [], extensions: {} },
      { agent, callId: execCallId, concludeTurn() { throw new Error('invalid commits must not conclude') } },
    )
  }
  await assert.rejects(attempt('empty', '   '), error => error.code === 'RP_NARRATIVE_REQUIRED' && /Writer prose was not present in the Chat assistant stream/i.test(error.message))
  await assert.rejects(attempt('large', '12345'), error => error.code === 'RP_NARRATIVE_LIMIT')
  await assert.rejects(attempt('actual', 'text', [], 'wrong'), error => error.code === 'RP_COMMIT_CALL_MISMATCH')
  await assert.rejects(attempt('duplicate', 'text', [{ type: 'tool-call', id: 'duplicate-2', name: 'rp_commit_turn', arguments: '{}' }]), error => error.code === 'RP_COMMIT_MESSAGE_INVALID')
  await assert.rejects(attempt('sibling', 'text', [{ type: 'tool-call', id: 'lookup', name: 'lookup', arguments: '{}' }]), error => error.code === 'RP_COMMIT_MESSAGE_INVALID')
  await ctx.fiber.dispose()
})

test('accepts harmless content blocks, blank text, and a commit block before later prose', async () => {
  const ctx = new Context()
  const tools = new Map()
  ctx.provide('systemPrompt', { section() {} })
  ctx.provide('tools', { register(tool) { tools.set(tool.name, tool) } })
  ctx.provide('agents', { get() { return undefined } })
  const runtime = new RpRuntime(ctx, {
    chatMaxStepsPerRun: 2, agentMaxStepsPerRun: 8,
    maxEffectsPerCommit: 1, maxArtifactBytes: 4096, maxNarrativeCharacters: 20,
  })
  const events = []
  const callId = 'tolerant-commit'
  const agent = { session: { events, append() {} } }
  const run = await runtime.prepareRun(agent, 1, [currentInput()])
  seedWriter(run, 'visible prose')
  events.push({
    seq: 0,
    type: 'assistant/message',
    data: {
      turn: 1,
      step: 1,
      message: {
        id: 'assistant-tolerant',
        source: { kind: 'model' },
        content: [
          { type: 'reasoning', text: 'private' },
          { type: 'text', text: '   ' },
          { type: 'image', url: 'https://example.invalid/image.png' },
          { type: 'tool-call', id: callId, name: 'rp_commit_turn', arguments: '{}' },
          { type: 'text', text: 'visible prose' },
        ],
      },
    },
  })
  events.push({ seq: 1, type: 'tool/call', data: { turn: 1, step: 1, callId, name: 'rp_commit_turn', arguments: '{}' } })
  let concluded = false
  const result = await tools.get('rp_commit_turn').execute({}, { agent, callId, concludeTurn() { concluded = true } })
  assert.equal(concluded, true)
  assert.equal(result.meta.runSummary, 'visible prose')
  assert.deepEqual(result.meta.assistant, { seq: 0, messageId: 'assistant-tolerant' })
  await ctx.fiber.dispose()
})

test('tool-only retry reuses prose from the latest failed commit in the same turn', async () => {
  const ctx = new Context()
  const tools = new Map()
  ctx.provide('systemPrompt', { section() {} })
  ctx.provide('tools', { register(tool) { tools.set(tool.name, tool) } })
  ctx.provide('agents', { get() { return undefined } })
  const runtime = new RpRuntime(ctx, {
    chatMaxStepsPerRun: 2, agentMaxStepsPerRun: 8,
    maxEffectsPerCommit: 1, maxArtifactBytes: 4096, maxNarrativeCharacters: 20,
  })
  const events = []
  const agent = { session: { events, append() {} } }
  const run = await runtime.prepareRun(agent, 1, [currentInput()])
  seedWriter(run, 'original prose')
  appendCommitCall(events, 1, 1, 'failed-commit', 'original prose')
  events.push({
    seq: events.length,
    type: 'tool/result',
    surfaceOp: 'append',
    data: {
      turn: 1,
      step: 1,
      message: createToolResultMessage({
        callId: ToolCallId('failed-commit'),
        content: [{ type: 'text', text: 'Error: invalid State update' }],
        isError: true,
      }),
    },
  })
  events.push({
    seq: events.length,
    type: 'assistant/message',
    data: {
      turn: 1,
      step: 2,
      message: {
        id: 'assistant-retry',
        source: { kind: 'model' },
        content: [{ type: 'tool-call', id: 'retry-commit', name: 'rp_commit_turn', arguments: '{}' }],
      },
    },
  })
  events.push({ seq: events.length, type: 'tool/call', data: { turn: 1, step: 2, callId: 'retry-commit', name: 'rp_commit_turn', arguments: '{}' } })
  let concluded = false
  const result = await tools.get('rp_commit_turn').execute({}, { agent, callId: 'retry-commit', concludeTurn() { concluded = true } })
  assert.equal(concluded, true)
  assert.equal(result.meta.runSummary, 'original prose')
  assert.deepEqual(result.meta.assistant, { seq: 0, messageId: 'assistant-failed-commit' })
  await ctx.fiber.dispose()
})

test('accepts the native thinking-model reasoning, prose, and final commit shape', async () => {
  const ctx = new Context()
  const tools = new Map()
  ctx.provide('systemPrompt', { section() {} })
  ctx.provide('tools', { register(tool) { tools.set(tool.name, tool) } })
  ctx.provide('agents', { get() { return undefined } })
  const runtime = new RpRuntime(ctx, {
    chatMaxStepsPerRun: 2, agentMaxStepsPerRun: 8,
    maxEffectsPerCommit: 1, maxArtifactBytes: 4096, maxNarrativeCharacters: 4,
  })
  const events = []
  const agent = { session: { events, append() {} } }
  const run = await runtime.prepareRun(agent, 1, [currentInput()])
  seedWriter(run, 'text')
  appendCommitCall(events, 1, 1, 'reasoning-commit', 'text', [], [
    { type: 'reasoning', text: 'Private reasoning is deliberately longer than the narrative limit.' },
  ])
  let concluded = false
  const result = await tools.get('rp_commit_turn').execute(
    { runSummary: 'summary', effects: [], references: [], extensions: {} },
    { agent, callId: 'reasoning-commit', concludeTurn() { concluded = true } },
  )
  assert.equal(concluded, true)
  assert.deepEqual(result.meta.assistant, { seq: 0, messageId: 'assistant-reasoning-commit' })

  const siblingEvents = []
  const siblingAgent = { session: { events: siblingEvents, append() {} } }
  const siblingRun = await runtime.prepareRun(siblingAgent, 1, [currentInput()])
  seedWriter(siblingRun, 'text')
  appendCommitCall(siblingEvents, 1, 1, 'reasoning-sibling', 'text', [
    { type: 'tool-call', id: 'lookup', name: 'lookup', arguments: '{}' },
  ], [{ type: 'reasoning', text: 'Private reasoning.' }])
  await assert.rejects(
    tools.get('rp_commit_turn').execute(
      { runSummary: 'summary', effects: [], references: [], extensions: {} },
      { agent: siblingAgent, callId: 'reasoning-sibling', concludeTurn() { throw new Error('must not conclude') } },
    ),
    error => error.code === 'RP_COMMIT_MESSAGE_INVALID',
  )
  await ctx.fiber.dispose()
})

test('allows an ordinary completed assistant response without forcing a commit', async () => {
  const ctx = new Context()
  let liveAgent
  ctx.provide('systemPrompt', { section() {} })
  ctx.provide('tools', { register() {} })
  ctx.provide('agents', { get(id) { return id === 'bounded' ? liveAgent : undefined } })
  const runtime = new RpRuntime(ctx, { chatMaxStepsPerRun: 2, agentMaxStepsPerRun: 8, maxEffectsPerCommit: 1, maxArtifactBytes: 1024 })
  runtime.registerSessionProfileProvider(() => ({
    runtime: { executionMode: 'chat' },
    resources: {
      card: { id: 'card-current' },
      lorebooks: [{ id: 'lore-first' }, { id: 'lore-second' }],
      persona: undefined,
      preset: { id: 'preset-current' },
      writingStyles: [{ id: 'style-current' }],
    },
  }))
  runtime.registerContextSource({ id: 'test', prepare: () => ({ text: 'context' }) })
  const events = []
  const steering = []
  const session = { id: 'bounded', events, append(type, data, opts) { events.push({ type, data, ...opts }) } }
  liveAgent = { session, steer(message) { steering.push(message) } }
  const payload = { agent: liveAgent, turn: 1, step: 1, signal: new AbortController().signal, messages: [currentInput()] }
  const decision = await ctx.waterfall('agent/pre-step', payload, () => Promise.resolve({ kind: 'enter', messages: payload.messages }))
  assert.equal(decision.kind, 'enter')
  const snapshot = decision.messages.at(-1)
  assert.equal(snapshot?.source?.rpRun.executionMode, 'chat')
  assert.deepEqual(snapshot?.source?.rpRun.sourceOrder, ['test', 'rp.current-input'])
  const snapshotText = snapshot.content.map(block => block.text ?? '').join('')
  assert.match(snapshotText, /<roleplay_request mode="chat">/)
  assert.match(snapshotText, /For narrative continuation, call rp_write_turn/)
  assert.match(snapshotText, /For discussion, clarification, or material inspection, reply normally/)
  assert.match(snapshotText, /<current_asset_bindings format="json">\n\{"characterId":"card-current","lorebookIds":\["lore-first","lore-second"\],"personaId":null,"presetId":"preset-current","writingStyleIds":\["style-current"\]\}/)
  assert.doesNotMatch(snapshotText, /selected_sources|used_characters|"status"|"scope"/)
  assert.doesNotMatch(snapshotText, /context_slot|The gate|context<\/source>/)
  assert.equal(snapshot.source.sections, undefined)
  ctx.emit('session/event', session, { type: 'step/start', data: { turn: 1 } })
  await ctx.serial('agent/turn-stopping', { agent: liveAgent, turn: 1, signal: payload.signal })
  assert.equal(steering.length, 0)
  ctx.emit('session/event', session, { type: 'step/start', data: { turn: 1 } })
  await ctx.serial('agent/turn-stopping', { agent: liveAgent, turn: 1, signal: payload.signal })
  assert.equal(events.length, 0)
  assert.equal(runtime.inspectRun(liveAgent).failure, undefined)
  assert.equal(steering.length, 0)
  await ctx.fiber.dispose()
})

test('chat refresh keeps full material hidden from the parent and returns a compact monotonic epoch', async () => {
  const ctx = new Context()
  ctx.provide('systemPrompt', { section() {} })
  ctx.provide('tools', { register() {} })
  ctx.provide('agents', { get() { return undefined } })
  const profile = { runtime: { executionMode: 'chat' } }
  ctx.provide('rpSessions', { get: () => profile })
  const runtime = new RpRuntime(ctx, { chatMaxStepsPerRun: 3, agentMaxStepsPerRun: 8, maxEffectsPerCommit: 1, maxArtifactBytes: 1024 })
  let facts = { revision: 1, text: '旧资料。' }
  runtime.registerContextSource({ id: 'facts', label: '资料', defaultSlot: { id: 'facts', label: '资料' }, prepare: () => facts })
  const input = currentInput()
  const agent = { session: { events: [], deriveMessages: () => [input], append() {} } }
  const run = await runtime.prepareRun(agent, 1, [input])
  seedWriter(run, '旧资料下的草稿。')
  run.writerCallId = 'old-writer'
  facts = { revision: 2, text: '新资料已经生效。' }

  const refreshed = await runtime.refreshRunContext(agent)

  assert.equal(refreshed.executionMode, 'chat')
  assert.equal(refreshed.contextEpoch, 1)
  assert.equal(refreshed.owner, 'session')
  assert.equal(refreshed.writerContextReady, true)
  assert.equal(refreshed.sourceCount > 0, true)
  assert.equal('contextText' in refreshed, false)
  assert.equal('contexts' in refreshed, false)
  assert.equal(runtime.inspectRun(agent).fragments.find(item => item.id === 'facts').revision, 2)
  assert.equal(runtime.inspectRun(agent).contextEpoch, 1)
  assert.equal(run.writerArtifact, undefined)
  assert.equal(run.writerCallId, undefined)
  await ctx.fiber.dispose()
})

test('a failed configuration refresh gates Writer and commit until the same refresh kind succeeds', async () => {
  const ctx = new Context()
  const tools = new Map()
  ctx.provide('systemPrompt', { section() {} })
  ctx.provide('tools', { register(tool) { tools.set(tool.name, tool) } })
  ctx.provide('agents', { get() { return undefined } })
  const runtime = new RpRuntime(ctx, { chatMaxStepsPerRun: 3, agentMaxStepsPerRun: 8, maxEffectsPerCommit: 1, maxArtifactBytes: 1024 })
  let fail = false
  runtime.registerContextSource({
    id: 'facts', label: '资料', defaultSlot: { id: 'facts', label: '资料' },
    prepare() {
      if (fail) throw new Error('State source unavailable')
      return { revision: 1, text: '当前资料。' }
    },
  })
  const input = currentInput()
  const agent = { session: { events: [], deriveMessages: () => [input], append() {} } }
  await runtime.prepareRun(agent, 1, [input])
  const refreshOptions = {
    kind: 'state-configuration',
    code: 'RP_STATE_CONFIGURATION_INCOMPLETE',
    messagePrefix: 'The refreshed State context could not be built',
  }

  fail = true
  await assert.rejects(runtime.refreshRunContext(agent, refreshOptions), /State source unavailable/)
  assert.equal(runtime.inspectRun(agent).commitGate.code, 'RP_STATE_CONFIGURATION_INCOMPLETE')
  await assert.rejects(
    tools.get('rp_write_turn').execute({ action: 'write' }, { agent, callId: 'blocked-writer' }),
    error => error.code === 'RP_STATE_CONFIGURATION_INCOMPLETE',
  )
  await assert.rejects(
    tools.get('rp_commit_turn').execute({}, { agent, callId: 'blocked', concludeTurn() {} }),
    error => error.code === 'RP_STATE_CONFIGURATION_INCOMPLETE',
  )

  fail = false
  await runtime.refreshRunContext(agent, refreshOptions)
  assert.equal(runtime.inspectRun(agent).commitGate, undefined)
  await assert.rejects(
    tools.get('rp_commit_turn').execute({}, { agent, callId: 'no-writer', concludeTurn() {} }),
    error => error.code === 'RP_WRITER_REQUIRED',
  )
  await ctx.fiber.dispose()
})

test('failed asset phases gate commit until a later mutation succeeds', async () => {
  const ctx = new Context()
  const tools = new Map()
  ctx.provide('systemPrompt', { section() {} })
  ctx.provide('tools', { register(tool) { tools.set(tool.name, tool) } })
  ctx.provide('agents', { get() { return undefined } })
  const runtime = new RpRuntime(ctx, { chatMaxStepsPerRun: 3, agentMaxStepsPerRun: 8, maxEffectsPerCommit: 1, maxArtifactBytes: 1024 })
  const events = []
  const input = currentInput()
  const agent = { session: { events, deriveMessages: () => [input], append() {} } }
  const run = await runtime.prepareRun(agent, 1, [input])
  runtime.recordAssetMutationOutcome(agent, {
    operation: 'bind', ok: false,
    phases: { binding: { status: 'failed', error: { code: 'BIND_FAILED', message: 'binding failed' } } },
  })
  appendCommitCall(events, 1, 1, 'blocked-commit', '不应提交。')
  seedWriter(run, '不应提交。')
  await assert.rejects(
    tools.get('rp_commit_turn').execute({ runSummary: 'x', effects: [], references: [], extensions: {} }, { agent, callId: 'blocked-commit', concludeTurn() {} }),
    error => error.code === 'RP_ASSET_MUTATION_INCOMPLETE',
  )
  assert.equal(runtime.inspectRun(agent).commitGate.kind, 'asset-mutation')

  runtime.recordAssetMutationOutcome(agent, {
    operation: 'bind', ok: true,
    phases: { binding: { status: 'succeeded', durable: true }, contextRefresh: { status: 'succeeded' } },
  })
  appendCommitCall(events, 1, 1, 'allowed-commit', '现在可以提交。')
  seedWriter(run, '现在可以提交。')
  let concluded = false
  await tools.get('rp_commit_turn').execute(
    { runSummary: '资料应用后继续。', effects: [], references: [], extensions: {} },
    { agent, callId: 'allowed-commit', concludeTurn() { concluded = true } },
  )
  assert.equal(concluded, true)
  assert.equal(runtime.inspectRun(agent).commitGate, undefined)
  await ctx.fiber.dispose()
})

test('commit rejects a selected live source whose revision changed after context assembly', async () => {
  const ctx = new Context()
  const tools = new Map()
  ctx.provide('systemPrompt', { section() {} })
  ctx.provide('tools', { register(tool) { tools.set(tool.name, tool) } })
  ctx.provide('agents', { get() { return undefined } })
  const runtime = new RpRuntime(ctx, { chatMaxStepsPerRun: 3, agentMaxStepsPerRun: 8, maxEffectsPerCommit: 1, maxArtifactBytes: 1024 })
  let revision = 1
  runtime.registerContextSource({
    id: 'facts', label: '资料', kind: 'shared-reference', defaultSlot: { id: 'facts', label: '资料' },
    prepare: () => ({ revision, text: `revision ${revision}` }),
  })
  const events = []
  const agent = { session: { events, append() {} } }
  const run = await runtime.prepareRun(agent, 1, [currentInput()])
  revision = 2
  appendCommitCall(events, 1, 1, 'stale-source', '旧资料下的续写。')
  seedWriter(run, '旧资料下的续写。')
  await assert.rejects(
    tools.get('rp_commit_turn').execute(
      { runSummary: 'stale', effects: [], references: [], extensions: {} },
      { agent, callId: 'stale-source', concludeTurn() {} },
    ),
    error => error.code === 'RP_CONTEXT_STALE',
  )
  await ctx.fiber.dispose()
})

test('commit revalidates live context after asynchronous effect and guard validation', async () => {
  const ctx = new Context()
  const tools = new Map()
  ctx.provide('systemPrompt', { section() {} })
  ctx.provide('tools', { register(tool) { tools.set(tool.name, tool) } })
  ctx.provide('agents', { get() { return undefined } })
  const runtime = new RpRuntime(ctx, {
    chatMaxStepsPerRun: 3, agentMaxStepsPerRun: 8,
    maxEffectsPerCommit: 1, maxArtifactBytes: 1024,
  })
  let revision = 1
  runtime.registerContextSource({
    id: 'facts', label: '资料', kind: 'shared-reference', defaultSlot: { id: 'facts', label: '资料' },
    prepare: () => ({ revision, text: `revision ${revision}` }),
  })
  runtime.registerEffectType({
    kind: 'test.effect',
    schema: testEffectSchema(),
    async validate(effect) {
      await Promise.resolve()
      revision = 2
      return effect
    },
  })
  runtime.registerRunGuard({
    id: 'test.guard',
    async validate() { await Promise.resolve() },
  })
  const events = []
  const agent = { session: { events, append() {} } }
  const run = await runtime.prepareRun(agent, 1, [currentInput()])
  appendCommitCall(events, 1, 1, 'late-stale-source', '旧资料下的续写。')
  seedWriter(run, '旧资料下的续写。')

  await assert.rejects(
    tools.get('rp_commit_turn').execute(
      {
        runSummary: 'stale',
        effects: [{ kind: 'test.effect', target: 'facts', payload: {} }],
        references: [],
        extensions: {},
      },
      { agent, callId: 'late-stale-source', concludeTurn() { throw new Error('stale commit must not conclude') } },
    ),
    error => error.code === 'RP_CONTEXT_STALE',
  )
  await ctx.fiber.dispose()
})

test('commit reports an unavailable live source as stale context', async () => {
  const ctx = new Context()
  const tools = new Map()
  ctx.provide('systemPrompt', { section() {} })
  ctx.provide('tools', { register(tool) { tools.set(tool.name, tool) } })
  ctx.provide('agents', { get() { return undefined } })
  const runtime = new RpRuntime(ctx, { chatMaxStepsPerRun: 3, agentMaxStepsPerRun: 8, maxEffectsPerCommit: 1, maxArtifactBytes: 1024 })
  let available = true
  runtime.registerContextSource({
    id: 'facts', label: '资料', kind: 'shared-reference', defaultSlot: { id: 'facts', label: '资料' },
    prepare() {
      if (!available) throw new Error('asset was deleted')
      return { revision: 1, text: 'facts' }
    },
  })
  const events = []
  const agent = { session: { events, append() {} } }
  const run = await runtime.prepareRun(agent, 1, [currentInput()])
  available = false
  appendCommitCall(events, 1, 1, 'unavailable-source', '旧资料下的续写。')
  seedWriter(run, '旧资料下的续写。')

  await assert.rejects(
    tools.get('rp_commit_turn').execute(
      { runSummary: 'stale', effects: [], references: [], extensions: {} },
      { agent, callId: 'unavailable-source', concludeTurn() {} },
    ),
    error => error.code === 'RP_CONTEXT_STALE' && /Refresh the shared material context/.test(error.message),
  )
  await ctx.fiber.dispose()
})

test('references require one active source and its exact assembled revision', async () => {
  const ctx = new Context()
  const tools = new Map()
  ctx.provide('systemPrompt', { section() {} })
  ctx.provide('tools', { register(tool) { tools.set(tool.name, tool) } })
  ctx.provide('agents', { get() { return undefined } })
  const runtime = new RpRuntime(ctx, { chatMaxStepsPerRun: 3, agentMaxStepsPerRun: 8, maxEffectsPerCommit: 1, maxArtifactBytes: 1024 })
  runtime.registerContextSource({
    id: 'facts', label: '资料', kind: 'shared-reference', defaultSlot: { id: 'facts', label: '资料' },
    prepare: () => ({ revision: 'asset:4', text: 'facts' }),
  })
  const attempt = async (callId, reference) => {
    const events = []
    const agent = { session: { events, append() {} } }
    const run = await runtime.prepareRun(agent, 1, [currentInput()])
    appendCommitCall(events, 1, 1, callId, '引用资料。')
    seedWriter(run, '引用资料。')
    return tools.get('rp_commit_turn').execute(
      { runSummary: 'reference', effects: [], references: [reference], extensions: {} },
      { agent, callId, concludeTurn() {} },
    )
  }
  await assert.rejects(attempt('missing-revision', { source: 'facts', id: 'entry' }), /missing required property "references\[0\]\.revision"/)
  await assert.rejects(attempt('inactive-source', { source: 'other', id: 'entry', revision: 'asset:4' }), error => error.code === 'RP_REFERENCE_SOURCE_NOT_ACTIVE')
  await assert.rejects(attempt('wrong-revision', { source: 'facts', id: 'entry', revision: 'asset:3' }), error => error.code === 'RP_REFERENCE_REVISION_MISMATCH')
  await ctx.fiber.dispose()
})

test('derives the step budget from the persisted execution mode and session cap', async () => {
  const ctx = new Context()
  ctx.provide('systemPrompt', { section() {} })
  ctx.provide('tools', { register() {} })
  ctx.provide('agents', { get() { return undefined } })
  const runtime = new RpRuntime(ctx, { chatMaxStepsPerRun: 2, agentMaxStepsPerRun: 8, maxEffectsPerCommit: 1, maxArtifactBytes: 1024 })
  const agent = { session: { events: [], append() {} } }
  ctx.provide('rpSessions', { get: () => ({ runtime: { executionMode: 'agent', maxSteps: 5 } }) })
  const run = await runtime.prepareRun(agent, 1, [currentInput()])
  assert.equal(run.executionMode, 'agent')
  assert.equal(run.maxSteps, 5)
  await ctx.fiber.dispose()
})

test('reads Session settings through the registered profile provider across Cordis scopes', async () => {
  const ctx = new Context()
  ctx.provide('systemPrompt', { section() {} })
  ctx.provide('tools', { register() {} })
  ctx.provide('agents', { get() { return undefined } })
  const runtime = new RpRuntime(ctx, { chatMaxStepsPerRun: 2, agentMaxStepsPerRun: 8, maxEffectsPerCommit: 1, maxArtifactBytes: 1024 })
  runtime.registerSessionProfileProvider(() => ({ mode: 'adaptive', runtime: { executionMode: 'agent', maxSteps: 6 } }))
  const agent = { session: { events: [], append() {} } }

  const run = await runtime.prepareRun(agent, 1, [currentInput()])

  assert.equal(run.executionMode, 'agent')
  assert.equal(run.maxSteps, 6)
  assert.equal((await runtime.previewContextBuild(agent)).executionMode, 'agent')
  await ctx.fiber.dispose()
})

test('previews only settled visible dialogue bodies without changing native model history', async () => {
  const ctx = new Context()
  ctx.provide('systemPrompt', { section() {} })
  ctx.provide('tools', { register() {} })
  ctx.provide('agents', { get() { return undefined } })
  const runtime = new RpRuntime(ctx, { chatMaxStepsPerRun: 2, agentMaxStepsPerRun: 8, maxEffectsPerCommit: 1, maxArtifactBytes: 1024 })
  runtime.registerSessionProfileProvider(() => ({
    runtime: { executionMode: 'chat' },
    contextBuild: { version: 1, slots: [{ id: 'prompt-top', label: '顶部', sourceIds: ['rp.preset:one', 'rp.preset:two'] }] },
  }))
  runtime.registerContextSource({
    id: 'rp.preset', label: '创作预设', legacySlotIds: ['prompt-top', 'prompt-bottom'], prepare: () => ({ sources: [
      { id: 'rp.preset:one', label: '栏位一', defaultSlot: { id: 'rp.preset:one', label: '栏位一', order: 30 }, text: '第一项' },
      { id: 'rp.preset:two', label: '栏位二', defaultSlot: { id: 'rp.preset:two', label: '栏位二', order: 31 }, text: '第二项' },
    ] }),
  })
  const session = Session.create(SessionId('rp-conversation-preview'))
  session.append('turn/start', { turn: 1 })
  session.append('assistant/message', {
    turn: 1,
    step: 1,
    message: createAssistantMessage({
      content: [{ type: 'text', text: '开场正文' }],
      source: { provider: 'rp-session', model: 'selected-opening' },
    }),
  }, { surfaceOp: 'append' })
  session.append('turn/end', { turn: 1, reason: { kind: 'completed' } })

  session.append('turn/start', { turn: 2 })
  const user = createUserMessage({ content: [{ type: 'text', text: '继续故事' }], source: { kind: 'user' } })
  const userEvent = session.append('user/message', user, { surfaceOp: 'append' })
  session.append('user/message', createUserMessage({
    content: [{ type: 'text', text: '<roleplay_request>中间上下文</roleplay_request>' }],
    source: { kind: 'plugin', plugin: 'rp-core' },
  }), { surfaceOp: 'append' })
  session.append('assistant/message', {
    turn: 2,
    step: 1,
    message: createAssistantMessage({
      content: [
        { type: 'text', text: '不应进入对话的中间文字' },
        { type: 'tool-call', id: ToolCallId('build-failed'), name: 'legacy_context_tool', arguments: '{}' },
      ],
      source: { provider: 'mock', model: 'mock' },
    }),
  }, { surfaceOp: 'append' })
  session.append('tool/result', {
    turn: 2,
    step: 1,
    message: createToolResultMessage({
      callId: ToolCallId('build-failed'),
      content: [{ type: 'text', text: 'Error: invalid arguments' }],
      isError: true,
    }),
  }, { surfaceOp: 'append' })
  session.append('assistant/message', {
    turn: 2,
    step: 2,
    message: createAssistantMessage({
      content: [{ type: 'tool-call', id: ToolCallId('build-success'), name: 'legacy_context_tool', arguments: '{}' }],
      source: { provider: 'mock', model: 'mock' },
    }),
  }, { surfaceOp: 'append' })
  session.append('tool/result', {
    turn: 2,
    step: 2,
    message: createToolResultMessage({
      callId: ToolCallId('build-success'),
      content: [{ type: 'text', text: '<rp_runtime_context>工具上下文</rp_runtime_context>' }],
      isError: false,
    }),
  }, { surfaceOp: 'append' })
  const finalMessage = createAssistantMessage({
    content: [
      { type: 'reasoning', text: '不应进入对话的推理' },
      { type: 'text', text: '最终正文第一段' },
      { type: 'text', text: '最终正文第二段' },
      { type: 'tool-call', id: ToolCallId('commit-success'), name: 'rp_commit_turn', arguments: '{}' },
    ],
    source: { provider: 'mock', model: 'mock' },
  })
  const final = session.append('assistant/message', { turn: 2, step: 3, message: finalMessage }, { surfaceOp: 'append' })
  session.append('tool/result', {
    turn: 2,
    step: 3,
    message: createToolResultMessage({
      callId: ToolCallId('commit-success'),
      content: [{ type: 'text', text: 'Committed.' }],
      isError: false,
    }),
  }, { surfaceOp: 'append' })
  session.append('turn/end', { turn: 2, reason: { kind: 'completed' } })
  const agent = { session }

  const nativeHistory = session.deriveMessages()
  assert.equal(nativeHistory.length, 9)
  assert.match(JSON.stringify(nativeHistory), /Error: invalid arguments/)
  assert.match(JSON.stringify(nativeHistory), /rp_runtime_context/)

  const preview = await runtime.previewContextBuild(agent)
  const history = preview.contexts.find(source => source.id === 'rp.conversation')
  assert.deepEqual(preview.slots.map(slot => slot.id), ['rp.preset:one', 'rp.preset:two', 'conversation-history', 'current-input'])
  assert.deepEqual(preview.layoutSlots.map(slot => slot.id), ['rp.preset:one', 'rp.preset:two', 'conversation-history', 'current-input'])
  assert.deepEqual(preview.slots.find(slot => slot.id === 'current-input').sourceIds, [])
  assert.deepEqual(preview.layoutSlots.find(slot => slot.id === 'current-input').sourceIds, ['rp.current-input'])
  assert.equal(preview.slots.find(slot => slot.id === 'conversation-history').locked, false)
  assert.equal(preview.sources.find(source => source.id === 'rp.conversation').idleAllowed, false)
  assert.equal(preview.sources.find(source => source.id === 'rp.current-input').idleAllowed, false)
  assert.equal(history.diagnostics.messages, 3)
  assert.equal(history.text, '[Context note: Original dialogue text, including the latest events and wording. It takes precedence over Conversation Summary.]\n\n回复：开场正文\n\n用户：继续故事\n\n回复：最终正文第一段\n最终正文第二段')
  assert.doesNotMatch(history.text, /中间上下文|中间文字|invalid arguments|rp_runtime_context|推理|Committed/)
  assert.deepEqual(session.deriveMessages(), nativeHistory)
  assert.match(preview.contextText, /开场正文|继续故事|最终正文/)
  assert.match(preview.contextText, /第一项/)
  assert.match(preview.contextText, /第二项/)
  const draftPreview = await runtime.previewContextBuild(agent, [currentInput('这就是当前输入。')])
  const current = draftPreview.contexts.find(source => source.id === 'rp.current-input')
  assert.equal(current.text, '这就是当前输入。')
  assert.equal(draftPreview.contextText.split('这就是当前输入。').length - 1, 1)

  const target = {
    kind: 'message', role: 'assistant', messageId: finalMessage.id, turn: 2, step: 3,
  }
  const editedMessage = {
    ...finalMessage,
    content: [
      { type: 'text', text: '编辑后的最终正文' },
      ...finalMessage.content.filter(block => block.type !== 'text'),
    ],
  }
  editedMessage.source = {
    ...editedMessage.source,
    rpMessageAction: createRpMessageActionMetadata('edit', [target]),
  }
  delete editedMessage.source.replayState
  const editedEvent = session.append('assistant/message', {
    turn: 2,
    step: 3,
    message: editedMessage,
  }, {
    surfaceOp: { op: 'replace', start: final.seq, end: final.seq },
    sourceEventSeqs: [final.seq],
  })
  const edited = await runtime.previewContextBuild(agent)
  assert.match(edited.contexts.find(source => source.id === 'rp.conversation').text, /回复：编辑后的最终正文/)
  assert.doesNotMatch(edited.contexts.find(source => source.id === 'rp.conversation').text, /最终正文第一段/)

  const shadowed = session.surface.nodes.slice(session.surface.nodes.indexOf(userEvent.seq))
  const deletion = createRpMessageActionMetadata('delete', [
    { kind: 'message', role: 'user', messageId: user.id },
    target,
  ])
  session.append('assistant/message', {
    turn: 2,
    step: 3,
    message: {
      ...structuredClone(editedMessage),
      content: [],
      source: { ...editedMessage.source, rpMessageAction: deletion },
    },
  }, {
    surfaceOp: { op: 'replace', start: shadowed[0], end: shadowed.at(-1) },
    sourceEventSeqs: shadowed,
  })
  assert.equal(session.surface.nodes.includes(editedEvent.seq), false)
  const deleted = await runtime.previewContextBuild(agent)
  const remainingHistory = deleted.contexts.find(source => source.id === 'rp.conversation')
  assert.equal(remainingHistory.diagnostics.messages, 1)
  assert.equal(remainingHistory.text, '[Context note: Original dialogue text, including the latest events and wording. It takes precedence over Conversation Summary.]\n\n回复：开场正文')

  const saved = await runtime.resolveContextBuild({ version: 1, slots: preview.slots }, agent)
  assert.deepEqual(saved.slots.map(slot => slot.sourceIds), [
    ['rp.preset:one'], ['rp.preset:two'], ['rp.conversation'], ['rp.current-input'],
  ])
  await ctx.fiber.dispose()
})

test('previews Session custom Prompt content and preserves it while resolving the layout', async () => {
  const ctx = new Context()
  ctx.provide('systemPrompt', { section() {} })
  ctx.provide('tools', { register() {} })
  ctx.provide('agents', { get() { return undefined } })
  const runtime = new RpRuntime(ctx, { chatMaxStepsPerRun: 2, agentMaxStepsPerRun: 8, maxEffectsPerCommit: 1, maxArtifactBytes: 1024 })
  const contextBuild = {
    version: 1,
    slots: [{ id: 'custom-2', label: '叙事约束', sourceIds: ['rp.custom:custom-2'] }],
    customSources: [{ slotId: 'custom-2', content: '避免替用户决定行动。' }],
  }
  const profile = { revision: 4, runtime: { executionMode: 'chat' }, contextBuild }
  runtime.registerSessionProfileProvider(() => profile)
  const agent = { session: Session.create(SessionId('rp-custom-prompt-preview')) }

  const preview = await runtime.previewContextBuild(agent)
  assert.deepEqual(preview.customSources, contextBuild.customSources)
  assert.equal(preview.sources.find(source => source.id === 'rp.custom:custom-2').available, true)
  assert.equal(preview.contexts.find(source => source.id === 'rp.custom:custom-2').text, '避免替用户决定行动。')
  assert.match(preview.contextText, /避免替用户决定行动。/)
  const resolved = await runtime.resolveContextBuild(contextBuild, agent, profile)
  assert.deepEqual(resolved.customSources, contextBuild.customSources)
  assert.deepEqual(resolved.slots.find(slot => slot.id === 'custom-2').sourceIds, ['rp.custom:custom-2'])
  await ctx.fiber.dispose()
})

test('keeps idle Session slots editable without exposing them to the effective Prompt', async () => {
  const ctx = new Context()
  ctx.provide('systemPrompt', { section() {} })
  ctx.provide('tools', { register() {} })
  ctx.provide('agents', { get() { return undefined } })
  const runtime = new RpRuntime(ctx, { chatMaxStepsPerRun: 2, agentMaxStepsPerRun: 8, maxEffectsPerCommit: 1, maxArtifactBytes: 1024 })
  const contextBuild = {
    version: 1,
    slots: [{ id: 'custom-3', label: '暂时不用', sourceIds: ['rp.custom:custom-3'], idle: true }],
    customSources: [{ slotId: 'custom-3', content: '这段内容不应参与生成。' }],
  }
  const profile = { revision: 2, runtime: { executionMode: 'chat' }, contextBuild }
  runtime.registerSessionProfileProvider(() => profile)
  const agent = { session: Session.create(SessionId('rp-idle-prompt-preview')) }

  const preview = await runtime.previewContextBuild(agent)
  assert.equal(preview.layoutSlots.find(slot => slot.id === 'custom-3').idle, true)
  assert.equal(preview.slots.some(slot => slot.id === 'custom-3'), false)
  assert.equal(preview.sources.find(source => source.id === 'rp.custom:custom-3').available, true)
  assert.equal(preview.contexts.some(source => source.id === 'rp.custom:custom-3'), false)
  assert.doesNotMatch(preview.contextText, /这段内容不应参与生成/)
  await ctx.fiber.dispose()
})

test('chat mode masks optional tools and agent mode lifts the mask', async () => {
  const ctx = new Context()
  let executionMode = 'chat'
  let restrictions = 0
  let lifts = 0
  let chatWriter
  let writerLifts = 0
  let runtimeContract
  ctx.provide('systemPrompt', { section(definition) { runtimeContract = definition } })
  ctx.provide('tools', { register() {} })
  ctx.provide('agents', { get() { return undefined } })
  ctx.provide('rpSessions', { get: () => ({ runtime: { executionMode } }) })
  const runtime = new RpRuntime(ctx, { chatMaxStepsPerRun: 2, agentMaxStepsPerRun: 8, maxEffectsPerCommit: 1, maxArtifactBytes: 1024 })
  const agent = { ctx: { tools: {
    register(tool) {
      assert.equal(tool.name, 'rp_write_turn')
      chatWriter = tool
      return () => { writerLifts += 1; chatWriter = undefined }
    },
    restrict(filter) {
      restrictions += 1
      assert.deepEqual(filter, { allow: ['rp_write_turn', 'rp_commit_turn', 'rp_asset_read'] })
      return () => { lifts += 1 }
    },
  } } }
  runtime.syncExecutionMode(agent)
  assert.equal(restrictions, 1)
  assert.deepEqual(chatWriter.parameters.required, ['action'])
  assert.deepEqual(chatWriter.parameters.properties.action.enum, ['write'])
  assert.deepEqual(Object.keys(chatWriter.parameters.properties), ['action'])
  assert.equal(chatWriter.parameters.additionalProperties, false)
  assert.match(chatWriter.description, /\{"action":"write"\}/)
  assert.match(runtimeContract.text({ agent }), /Chat mode is the direct narrative path/)
  assert.match(runtimeContract.text({ agent }), /cannot persist shared-material or State-definition changes/)
  assert.match(runtimeContract.text({ agent }), /switch to Agent mode/)
  await assert.rejects(
    chatWriter.execute({ brief: '不应暴露' }, { agent, callId: 'chat-schema-reject' }),
    error => error.code === 'INVALID_ARGS',
  )
  await assert.rejects(
    chatWriter.execute({}, { agent, callId: 'chat-action-required' }),
    error => error.code === 'INVALID_ARGS',
  )
  await assert.rejects(
    chatWriter.execute({ action: '{}' }, { agent, callId: 'chat-action-enum' }),
    error => error.code === 'INVALID_ARGS',
  )
  await assert.rejects(
    chatWriter.execute({ '{}': {} }, { agent, callId: 'chat-literal-property' }),
    error => error.code === 'INVALID_ARGS',
  )
  executionMode = 'agent'
  runtime.syncExecutionMode(agent)
  assert.equal(lifts, 1)
  assert.equal(writerLifts, 1)
  assert.equal(chatWriter, undefined)
  assert.equal(restrictions, 1)
  assert.match(runtimeContract.text({ agent }), /Agent mode supports discussion, planning, editing, shared-material operations/)
  assert.match(runtimeContract.text({ agent }), /returned prose as a starting draft/)
  assert.match(runtimeContract.text({ agent }), /revise it when useful/i)
  assert.match(runtimeContract.text({ agent }), /complete intended final narrative/i)
  assert.match(runtimeContract.text({ agent }), /Make tool calls directly without announcing them/i)
  assert.match(runtimeContract.text({ agent }), /rp_run_subagent/)
  assert.match(runtimeContract.text({ agent }), /usageContract/)
  assert.doesNotMatch(runtimeContract.text({ agent }), /task-subagent tools/)
  assert.doesNotMatch(runtimeContract.text({ agent }), /complete Writer narrative verbatim/i)
  await ctx.fiber.dispose()
})

test('isolated task subagents bypass RP context assembly, tool masking and commit enforcement', async () => {
  const ctx = new Context()
  let restrictions = 0
  ctx.provide('systemPrompt', { section() {} })
  ctx.provide('tools', { register() {} })
  ctx.provide('agents', { get() { return undefined } })
  const runtime = new RpRuntime(ctx, { chatMaxStepsPerRun: 2, agentMaxStepsPerRun: 8, maxEffectsPerCommit: 1, maxArtifactBytes: 1024 })
  const steering = []
  const agent = {
    ctx: { tools: { restrict() { restrictions += 1; return () => {} } } },
    session: { header: { origin: 'subagent' }, events: [], append() {} },
    steer(message) { steering.push(message) },
  }

  runtime.syncExecutionMode(agent)
  const messages = [{ role: 'user', content: [{ type: 'text', text: 'Check continuity.' }] }]
  const decision = await ctx.waterfall(
    'agent/pre-step',
    { agent, turn: 1, step: 1, signal: new AbortController().signal, messages },
    () => Promise.resolve({ kind: 'enter', messages }),
  )
  await ctx.serial('agent/turn-stopping', { agent, turn: 1, signal: new AbortController().signal })

  assert.equal(restrictions, 0)
  assert.deepEqual(decision, { kind: 'enter', messages })
  assert.equal(runtime.inspectRun(agent), undefined)
  assert.deepEqual(steering, [])
  await ctx.fiber.dispose()
})

test('agent mode preassembles the saved Session slots and exposes no context-build tool', async () => {
  const ctx = new Context()
  const tools = new Map()
  ctx.provide('systemPrompt', { section() {} })
  ctx.provide('tools', { register(tool) { tools.set(tool.name, tool) } })
  ctx.provide('agents', { get() { return undefined } })
  ctx.provide('rpSessions', { get: () => ({
    runtime: { executionMode: 'agent' },
    contextBuild: { version: 1, slots: [
      { id: 'continuity', label: '连续性', sourceIds: ['state'] },
      { id: 'facts', label: '事实', sourceIds: ['facts'] },
      { id: 'current-input', label: '当前输入', sourceIds: ['rp.current-input'] },
    ] },
    resources: {
      card: { id: 'agent-card' }, lorebooks: [{ id: 'agent-lore' }],
      persona: undefined, preset: { id: 'agent-preset' }, writingStyles: [],
    },
  }) })
  const runtime = new RpRuntime(ctx, { chatMaxStepsPerRun: 2, agentMaxStepsPerRun: 8, maxEffectsPerCommit: 1, maxArtifactBytes: 4096 })
  let facts = { revision: 2, text: 'The gate is sealed.' }
  runtime.registerContextSource({ id: 'facts', label: '引用事实', kind: 'shared-reference', promptCategory: 'factual', defaultSlot: { id: 'facts', label: '事实' }, prepare: () => facts })
  runtime.registerContextSource({
    id: 'state', label: '会话状态', kind: 'session-projection', promptCategory: 'factual', defaultSlot: { id: 'continuity', label: '连续性' },
    prepare: () => ({ revision: 4, text: 'Gate: locked' }),
  })
  const events = []
  const input = currentInput()
  const agent = { session: { events, deriveMessages: () => [input], append() {} } }
  const run = await runtime.prepareRun(agent, 1, [input])

  assert.match(run.contextText, /The gate is sealed/)
  assert.match(run.contextText, /Gate: locked/)
  assert.equal(run.catalog.length, 4)
  assert.deepEqual(run.fragments.map(fragment => fragment.id), ['state', 'facts', 'rp.current-input'])
  assert.equal(run.contextBuild.owner, 'session')
  assert.equal(tools.has('rp_build_context'), false)
  const ready = runtime.writerReadyMessage(run)
  const readyText = ready.content.map(block => block.text ?? '').join('')
  assert.equal(ready.source.rpRun.contextOwner, 'session')
  assert.match(readyText, /complete prepared input for this Roleplay request/)
  assert.match(readyText, /\{"action":"write"\}/)
  assert.match(readyText, /top-level "brief" string/)
  assert.match(readyText, /classify the request as discussion or clarification, shared-material work, narrative continuation, or a mixture/)
  assert.match(readyText, /usageContract/)
  assert.doesNotMatch(readyText, /internal calls/)
  assert.doesNotMatch(readyText, /available_specialists/)
  assert.match(readyText, /<specialist_catalog format="json">\n\[\]\n<\/specialist_catalog>/)
  assert.match(readyText, /<roleplay_context read_only="true">/)
  assert.match(readyText, /<roleplay_content>/)
  assert.match(readyText, /<section name="连续性">\n<item name="会话状态">\nGate: locked\n<\/item>\n<\/section>/)
  assert.match(readyText, /<section name="事实">\n<item name="引用事实">\nThe gate is sealed\.\n<\/item>\n<\/section>/)
  assert.match(readyText, /<section name="当前输入">\nContinue the story\.\n<\/section>/)
  assert.match(readyText, /<current_asset_bindings format="json">\n\{"characterId":"agent-card","lorebookIds":\["agent-lore"\],"personaId":null,"presetId":"agent-preset","writingStyleIds":\[\]\}/)
  assert.doesNotMatch(readyText, /rp_build_context|sourceIds/)

  const preview = await runtime.previewContextBuild(agent)
  assert.equal(preview.contextOwner, 'session')
  assert.deepEqual(preview.slots.map(slot => slot.id).slice(0, 3), ['continuity', 'facts', 'current-input'])
  assert.equal(preview.contexts.find(item => item.id === 'facts').text, 'The gate is sealed.')
  assert.equal(preview.contexts.find(item => item.id === 'state').text, 'Gate: locked')
  assert.equal(preview.contexts.every(item => typeof item.text === 'string'), true)

  const commit = tools.get('rp_commit_turn')
  await assert.rejects(
    commit.execute({ runSummary: 'x', effects: [], references: [], extensions: {} }, { agent, callId: 'no-writer', concludeTurn() {} }),
    error => error.code === 'RP_WRITER_REQUIRED',
  )

  facts = { revision: 3, text: 'The gate has opened.' }
  const refreshed = await runtime.refreshRunContext(agent)
  assert.equal(refreshed.writerContextReady, true)
  assert.equal(refreshed.owner, 'session')
  assert.match(refreshed.contextText, /The gate has opened\./)
  assert.equal(run.contextBuilds.length, 2)
  assert.equal(run.contextBuild.owner, 'session')
  assert.equal(run.catalog.find(item => item.id === 'facts')?.revision, 3)
  assert.match(run.contextText, /The gate has opened/)

  let concluded = false
  appendCommitCall(events, 1, 1, 'commit-1', 'The gate stays shut.')
  seedWriter(run, 'The gate stays shut.')
  const committed = await commit.execute({ runSummary: 'Blocked at the gate.', effects: [], references: [], extensions: {} }, { agent, callId: 'commit-1', concludeTurn() { concluded = true } })
  assert.equal(concluded, true)
  assert.equal(committed.meta.contextBuild.owner, 'session')
  assert.deepEqual(committed.meta.contextSources.map(item => item.id), ['state', 'facts', 'rp.current-input'])
  await ctx.fiber.dispose()
})

test('an unavailable optional Wiki source is skipped without blocking Agent output or asset repair', async () => {
  const ctx = new Context()
  ctx.provide('systemPrompt', { section() {} })
  ctx.provide('tools', { register() {} })
  ctx.provide('agents', { get() { return undefined } })
  ctx.provide('rpSessions', { get: () => ({
    revision: 8,
    runtime: { executionMode: 'agent' },
    resources: {
      card: undefined,
      lorebooks: [],
      persona: undefined,
      preset: { id: 'missing-preset' },
      writingStyles: [],
    },
    contextBuild: { version: 1, slots: [
      { id: 'facts', label: '资料', sourceIds: ['facts'] },
      { id: 'current-input', label: '当前输入', sourceIds: ['rp.current-input'] },
    ] },
  }) })
  const runtime = new RpRuntime(ctx, {
    chatMaxStepsPerRun: 2,
    agentMaxStepsPerRun: 8,
    maxEffectsPerCommit: 1,
    maxArtifactBytes: 4096,
  })
  runtime.registerContextSource({
    id: 'facts',
    label: '已失效资料',
    kind: 'shared-reference',
    defaultSlot: { id: 'facts', label: '资料' },
    prepare() { throw Object.assign(new Error('gone'), { code: 'ASSET_NOT_FOUND' }) },
  })
  const input = currentInput()
  const agent = { session: { events: [], deriveMessages: () => [input], append() {} } }

  const run = await runtime.prepareRun(agent, 1, [input])

  assert.deepEqual(run.fragments.map(fragment => fragment.id), ['rp.current-input'])
  assert.match(run.contextText, /Continue the story\./)
  const facts = run.catalog.find(item => item.id === 'facts')
  assert.equal(facts.available, false)
  assert.equal(facts.reason, 'asset-unavailable')
  assert.deepEqual(facts.diagnostics, { error: { code: 'ASSET_NOT_FOUND' } })
  const readyText = runtime.writerReadyMessage(run).content.map(block => block.text ?? '').join('')
  assert.match(readyText, /"presetId":"missing-preset"/)
  assert.match(readyText, /<section name="当前输入">/)
  assert.doesNotMatch(readyText, /已失效资料/)
  await ctx.fiber.dispose()
})

test('Chat Writer receives one flat Prompt and its prose replaces the parent stream before commit', async () => {
  const ctx = new Context()
  const tools = new Map()
  const starts = []
  let agent
  ctx.provide('systemPrompt', { section() {} })
  ctx.provide('tools', { register(tool) { tools.set(tool.name, tool) } })
  ctx.provide('agents', { get(id) { return id === agent?.session.id ? agent : undefined } })
  ctx.provide('subagents', {
    async start(provider, request) {
      starts.push({ provider, request })
      return {
        id: 'writer-child-1',
        localAgent: undefined,
        result: Promise.resolve({ stopReason: 'completed', output: [{ type: 'text', text: '门在雨声里缓缓开启。' }] }),
        async dispose() {},
      }
    },
  })
  const runtime = new RpRuntime(ctx, {
    chatMaxStepsPerRun: 3, agentMaxStepsPerRun: 8,
    maxEffectsPerCommit: 1, maxArtifactBytes: 4096, maxNarrativeCharacters: 1000,
  })
  runtime.registerSessionProfileProvider(() => ({
    runtime: { executionMode: 'chat', writer: { provider: 'ignored-session-writer', model: 'ignored-session-model', maxTokens: 777 } },
  }))
  runtime.registerSubagentProfileProvider({
    id: 'global-subagents',
    prepare: () => ({ writer: { provider: 'writer-provider', model: 'writer-model' }, subagents: [], revisions: { writer: 3, subagents: {} } }),
  })
  const events = []
  const attachment = testImageAttachment('a')
  const input = currentInput(null, [attachment])
  agent = {
    options: { provider: 'parent-provider', model: 'parent-model', maxTokens: 123 },
    session: { id: 'writer-parent', events, append() {} },
  }
  const run = await runtime.prepareRun(agent, 1, [input])
  const write = tools.get('rp_write_turn')
  await assert.rejects(write.execute({ action: 'write', brief: '偷偷加要求' }, { agent, callId: 'writer-bad', signal: new AbortController().signal }), error => error.code === 'RP_CHAT_WRITER_BRIEF_NOT_ALLOWED')
  await assert.rejects(write.execute({ action: 'write', ignored: true }, { agent, callId: 'writer-extra', signal: new AbortController().signal }), error => error.code === 'INVALID_ARGS')

  const result = await write.execute({ action: 'write' }, { agent, callId: 'writer-1', signal: new AbortController().signal })
  assert.equal(result.narrative, '门在雨声里缓缓开启。')
  assert.equal(starts.length, 1)
  assert.equal(starts[0].provider, 'spawn')
  assert.deepEqual(starts[0].request.agentOptions, { provider: 'writer-provider', model: 'writer-model', maxTokens: 123 })
  assert.deepEqual(starts[0].request.toolFilter, { allow: [] })
  assert.equal(starts[0].request.maxDepth, 1)
  assert.equal(starts[0].request.prompt.length, 2)
  assert.equal(starts[0].request.prompt[0].type, 'text')
  assert.equal(starts[0].request.prompt[0].text.split('本轮用户输入包含 1 张图片附件。').length - 1, 1)
  assert.deepEqual(starts[0].request.prompt[1], { type: 'image', attachment })
  assert.doesNotMatch(starts[0].request.prompt[0].text, /rp\.conversation|对话历史/)
  assert.match(result.meta.promptHash, /^[a-f0-9]{64}$/)
  assert.equal(run.writerArtifact, undefined)

  ctx.emit('session/event', agent.session, { type: 'tool/result', data: { meta: result.meta } })
  assert.equal(run.writerArtifact.narrative, result.narrative)
  await assert.rejects(write.execute({ action: 'write' }, { agent, callId: 'writer-2', signal: new AbortController().signal }), error => error.code === 'RP_WRITER_ALREADY_COMPLETED')

  const commitId = ToolCallId('chat-stream-commit')
  const parentStream = (async function* () {
    yield { type: 'block-start', index: 0, blockType: 'reasoning' }
    yield { type: 'reasoning-delta', index: 0, text: '父代理正在重写' }
    yield { type: 'block-end', index: 0, block: { type: 'reasoning', text: '父代理正在重写' } }
    yield { type: 'block-start', index: 1, blockType: 'text' }
    yield { type: 'text-delta', index: 1, text: '这是父代理改写后、绝不能展示的正文。' }
    yield { type: 'block-end', index: 1, block: { type: 'text', text: '这是父代理改写后、绝不能展示的正文。' } }
    yield { type: 'block-start', index: 2, blockType: 'tool-call' }
    yield { type: 'tool-call-delta', index: 2, id: commitId, name: 'rp_commit_turn', argumentsDelta: '{"runSummary":"门打开"}' }
    yield { type: 'block-end', index: 2, block: { type: 'tool-call', id: commitId, name: 'rp_commit_turn', arguments: '{"runSummary":"门打开"}' } }
    yield { type: 'usage', usage: { inputTokens: 10, outputTokens: 5 } }
    yield { type: 'finish', reason: { kind: 'tool-calls' } }
  })()
  const chunks = []
  const relayed = ctx.waterfall('llm/stream', { sessionId: agent.session.id }, () => parentStream)
  for await (const chunk of relayed) chunks.push(chunk)
  assert.equal(chunks.filter(chunk => chunk.type === 'text-delta').map(chunk => chunk.text).join(''), result.narrative)
  assert.doesNotMatch(JSON.stringify(chunks), /父代理正在重写|父代理改写后/)
  assert.deepEqual(chunks.filter(chunk => chunk.type === 'block-end').map(chunk => chunk.block.type), ['text', 'tool-call'])
  assert.equal(chunks.find(chunk => chunk.type === 'block-end' && chunk.block.type === 'tool-call').block.id, commitId)
  assert.equal(run.chatWriterRelayed, true)

  const content = chunks.filter(chunk => chunk.type === 'block-end').map(chunk => chunk.block)
  events.push({
    seq: events.length,
    type: 'assistant/message',
    data: {
      turn: 1,
      step: 2,
      message: { id: 'assistant-chat-stream', source: { kind: 'model', provider: 'parent-provider', model: 'parent-model' }, content },
    },
  })
  events.push({ seq: events.length, type: 'tool/call', data: { turn: 1, step: 2, callId: commitId, name: 'rp_commit_turn', arguments: '{"runSummary":"门打开"}' } })
  let concluded = false
  const committed = await tools.get('rp_commit_turn').execute({ runSummary: '门打开' }, { agent, callId: commitId, concludeTurn() { concluded = true } })
  assert.equal(concluded, true)
  assert.deepEqual(committed.meta.assistant, { seq: 0, messageId: 'assistant-chat-stream' })
  assert.equal(committed.meta.writer.writerSessionId, 'writer-child-1')
  assert.equal(committed.meta.writer.promptHash, result.meta.promptHash)
  await ctx.fiber.dispose()
})

test('Agent Writer uses the preassembled Slot context, accepts a bounded brief, retries failures, and keeps delegation independent', async () => {
  const ctx = new Context()
  const tools = new Map()
  const starts = []
  let writerAttempt = 0
  ctx.provide('systemPrompt', { section() {} })
  ctx.provide('tools', { register(tool) { tools.set(tool.name, tool) } })
  ctx.provide('agents', { get() { return undefined } })
  ctx.provide('subagents', {
    async start(provider, request) {
      starts.push({ provider, request })
      if (request.label === '写作') {
        writerAttempt += 1
        return {
          id: `writer-child-${writerAttempt}`, localAgent: undefined,
          result: Promise.resolve(writerAttempt === 1
            ? { stopReason: 'max-tokens', diagnostic: 'limit', output: [{ type: 'text', text: 'partial' }] }
            : { stopReason: 'completed', output: [{ type: 'text', text: '最终正文' }] }),
          async dispose() {},
        }
      }
      return {
        id: `support-child-${starts.length}`, localAgent: undefined,
        result: Promise.resolve({ stopReason: 'completed', output: [{ type: 'text', text: '建议保持门锁状态。' }] }),
        async dispose() {},
      }
    },
  })
  const runtime = new RpRuntime(ctx, {
    chatMaxStepsPerRun: 2, agentMaxStepsPerRun: 8,
    maxEffectsPerCommit: 1, maxArtifactBytes: 4096, maxNarrativeCharacters: 1000,
    maxWriterBriefCharacters: 8,
  })
  runtime.registerSessionProfileProvider(() => ({ runtime: { executionMode: 'agent' } }))
  const subagentBase = {
    label: 'Support', description: 'Read-only advice.', persona: 'Return advice only.',
    inputSchema: { type: 'object', additionalProperties: false, properties: {} },
  }
  assert.throws(
    () => runtime.registerTaskSubagent({ id: 'unsafe-deny', ...subagentBase, toolFilter: { deny: ['rp_asset'] } }),
    error => error.code === 'RP_INVALID_REGISTRATION',
  )
  assert.throws(
    () => runtime.registerTaskSubagent({ id: 'unsafe-parent-read', ...subagentBase, toolFilter: { allow: ['rp_asset_read'] } }),
    error => error.code === 'RP_INVALID_REGISTRATION',
  )
  assert.throws(
    () => runtime.registerTaskSubagent({ id: 'half-route', ...subagentBase, route: { provider: 'only-provider' } }),
    error => error.code === 'RP_INVALID_REGISTRATION',
  )
  runtime.registerTaskSubagent({
    id: 'research', label: 'Research', description: 'Read-only continuity advice.',
    persona: 'Return advice only.',
    inputSchema: { type: 'object', additionalProperties: false, properties: { focus: { type: 'string' } } },
    toolFilter: { allow: ['web_search'] },
  })
  const attachment = testImageAttachment('b')
  const input = currentInput('继续。', [attachment])
  const agent = { options: { provider: 'parent-provider', model: 'parent-model', maxTokens: 456 }, session: { id: 'agent-parent', events: [], append() {} } }
  const run = await runtime.prepareRun(agent, 1, [input])
  const write = tools.get('rp_write_turn')
  await assert.rejects(
    tools.get('rp_commit_turn').execute({}, { agent, callId: 'no-writer', concludeTurn() {} }),
    error => error.code === 'RP_WRITER_REQUIRED',
  )
  await assert.rejects(write.execute({ action: 'write', brief: '123456789' }, { agent, callId: 'long', signal: new AbortController().signal }), error => error.code === 'RP_WRITER_BRIEF_LIMIT')
  await assert.rejects(write.execute({ action: 'write', brief: '近景' }, { agent, callId: 'failed', signal: new AbortController().signal }), /max-tokens/)
  assert.equal(run.writerArtifact, undefined)
  assert.equal(run.writerCallId, undefined)
  const written = await write.execute({ action: 'write', brief: '近景' }, { agent, callId: 'retry', signal: new AbortController().signal })
  assert.equal(written.narrative, '最终正文')
  assert.equal(starts.at(-1).request.label, '写作')
  assert.match(starts.at(-1).request.prompt[0].text, /<writing_brief>\n近景\n<\/writing_brief>/)
  assert.deepEqual(starts.at(-1).request.agentOptions, { provider: 'parent-provider', model: 'parent-model', maxTokens: 456 })

  const subagent = tools.get('rp_run_subagent')
  assert.equal(subagent.parameters.properties.input.type, 'object')
  assert.equal(subagent.parameters.properties.input.additionalProperties, true)
  assert.match(subagent.parameters.properties.input.description, /never pass a JSON-encoded string/)
  assert.match(subagent.description, /Pass input directly as one JSON object/)
  const startsBeforeInvalidInput = starts.length
  let invalidInputFailure
  const invalidInputExec = { agent, callId: 'invalid-input', signal: new AbortController().signal }
  await assert.rejects(
    subagent.execute({ subagent: 'research', task: '检查连续性', input: '{"focus":"门"}' }, invalidInputExec),
    error => {
      invalidInputFailure = error
      return error.code === 'INVALID_ARGS' && error.violations.some(item => item.includes('input'))
    },
  )
  assert.equal(starts.length, startsBeforeInvalidInput)
  const invalidInputContent = subagent.finalizeContent(invalidInputExec, {
    isError: true,
    error: {
      message: invalidInputFailure.message,
      info: { name: invalidInputFailure.name, code: invalidInputFailure.code },
    },
    content: [{ type: 'text', text: `Error: ${invalidInputFailure.message}` }],
  })
  const invalidInputFeedback = JSON.parse(invalidInputContent[0].text)
  assert.equal(invalidInputFeedback.status, 'error')
  assert.equal(invalidInputFeedback.error.category, 'invalid_arguments')
  assert.equal(invalidInputFeedback.error.code, 'INVALID_ARGS')
  assert.equal(invalidInputFeedback.error.retryable, true)
  assert.match(invalidInputFeedback.error.message, /JSON object, not as a JSON-encoded string/)
  let specialistSchemaFailure
  const specialistSchemaExec = { agent, callId: 'invalid-specialist-input', signal: new AbortController().signal }
  await assert.rejects(
    subagent.execute({ subagent: 'research', task: '检查连续性', input: { focus: 42 } }, specialistSchemaExec),
    error => {
      specialistSchemaFailure = error
      return error.code === 'RP_SUBAGENT_INPUT_INVALID' && error.message.includes('input.focus')
    },
  )
  assert.equal(starts.length, startsBeforeInvalidInput)
  const specialistSchemaContent = subagent.finalizeContent(specialistSchemaExec, {
    isError: true,
    error: {
      message: specialistSchemaFailure.message,
      info: { name: specialistSchemaFailure.name, code: specialistSchemaFailure.code },
    },
    content: [{ type: 'text', text: `Error: ${specialistSchemaFailure.message}` }],
  })
  const specialistSchemaFeedback = JSON.parse(specialistSchemaContent[0].text)
  assert.equal(specialistSchemaFeedback.error.code, 'RP_SUBAGENT_INPUT_INVALID')
  assert.match(specialistSchemaFeedback.error.details, /input\.focus/)
  assert.equal(subagent.finalizeContent(invalidInputExec, {
    isError: true,
    error: { message: 'provider failed', info: { name: 'Error', code: 'UPSTREAM_ERROR' } },
    content: [],
  }), undefined)

  const subagent1 = await subagent.execute({ subagent: 'research', task: '检查连续性', input: { focus: '门' } }, { agent, callId: 'd1', signal: new AbortController().signal })
  const subagent2 = await subagent.execute({ subagent: 'research', task: '再次检查' }, { agent, callId: 'd2', signal: new AbortController().signal })
  assert.equal(subagent1.text, '建议保持门锁状态。')
  assert.equal(subagent2.text, '建议保持门锁状态。')
  assert.equal(starts.at(-1).request.prompt[0].text.includes('<roleplay_context>'), false)
  assert.ok(starts.every(start => start.request.prompt.length === 2))
  assert.ok(starts.every(start => start.request.prompt[1].type === 'image'))
  for (const start of starts) assert.deepEqual(start.request.prompt[1].attachment, attachment)
  assert.deepEqual(starts.at(-1).request.toolFilter, { allow: ['web_search'] })
  assert.equal(run.writerArtifact, undefined)

  run.writerArtifact = written.meta
  appendCommitCall(agent.session.events, 1, 3, 'agent-revised-commit', '父代理采用的修改后正文')
  let concluded = false
  const committed = await tools.get('rp_commit_turn').execute({}, {
    agent,
    callId: 'agent-revised-commit',
    concludeTurn() { concluded = true },
  })
  assert.equal(concluded, true)
  assert.equal(committed.meta.runSummary, '父代理采用的修改后正文')
  assert.equal(committed.meta.writer.writerSessionId, written.meta.writerSessionId)
  await ctx.fiber.dispose()
})

test('global Writer and managed task subagents are shared by Chat and Agent, then frozen per Run', async () => {
  const ctx = new Context()
  const tools = new Map()
  const starts = []
  ctx.provide('systemPrompt', { section() {} })
  ctx.provide('tools', { register(tool) { tools.set(tool.name, tool) } })
  ctx.provide('agents', { get() { return undefined } })
  ctx.provide('subagents', {
    async start(provider, request) {
      starts.push({ provider, request })
      return {
        id: `child-${starts.length}`,
        localAgent: undefined,
        result: Promise.resolve({ stopReason: 'completed', output: [{ type: 'text', text: request.label === '写作' ? `正文 ${starts.length}` : `结果 ${request.label}` }] }),
        async dispose() {},
      }
    },
  })
  const runtime = new RpRuntime(ctx, {
    chatMaxStepsPerRun: 2, agentMaxStepsPerRun: 8,
    maxEffectsPerCommit: 1, maxArtifactBytes: 4096, maxNarrativeCharacters: 1000,
  })
  runtime.registerSessionProfileProvider(agent => ({ runtime: { executionMode: agent.mode } }))
  const managedSubagent = (id, label, tools, route) => ({
    id, label, description: `${label} purpose.`, persona: `${label} instructions.`,
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    toolFilter: { allow: tools },
    ...(route === undefined ? {} : { route }),
  })
  let globalProfile = {
    writer: { provider: 'writer-provider-a', model: 'writer-model-a', reasoningEffort: 'high' },
    subagents: [managedSubagent('research', 'Research A', ['web_search'])],
    revisions: { writer: 1, subagents: { research: 1 } },
  }
  runtime.registerSubagentProfileProvider({ id: 'global', prepare: () => structuredClone(globalProfile) })

  const chatAgent = { mode: 'chat', options: { provider: 'parent', model: 'parent-model', reasoningEffort: 'medium', maxTokens: 111 }, session: { id: 'chat-global', events: [], append() {} } }
  const agent = { mode: 'agent', options: { provider: 'parent', model: 'parent-model', reasoningEffort: 'medium', maxTokens: 222 }, session: { id: 'agent-global', events: [], append() {} } }
  const chatRun = await runtime.prepareRun(chatAgent, 1, [currentInput('Chat 继续。')])
  const agentRun = await runtime.prepareRun(agent, 1, [currentInput('Agent 继续。')])
  globalProfile = {
    writer: { provider: 'writer-provider-b', model: 'writer-model-b' },
    subagents: [managedSubagent('audit', 'Audit B', ['skill'], {
      provider: 'audit-provider-b', model: 'audit-model-b', reasoningEffort: 'low',
    })],
    revisions: { writer: 2, subagents: { audit: 1 } },
  }
  chatAgent.options = { provider: 'changed-parent', model: 'changed-model', maxTokens: 333 }
  agent.options = { provider: 'changed-parent', model: 'changed-model', maxTokens: 444 }

  await tools.get('rp_write_turn').execute({ action: 'write' }, { agent: chatAgent, callId: 'chat-write-a', signal: new AbortController().signal })
  await tools.get('rp_write_turn').execute({ action: 'write' }, { agent, callId: 'agent-write-a', signal: new AbortController().signal })
  await tools.get('rp_run_subagent').execute({ subagent: 'research', task: '旧配置仍应可用' }, { agent, callId: 'subagent-a', signal: new AbortController().signal })
  assert.equal(starts[0].request.label, '写作')
  assert.equal(starts[1].request.label, '写作')
  assert.deepEqual(starts[0].request.agentOptions, { provider: 'writer-provider-a', model: 'writer-model-a', reasoningEffort: 'high', maxTokens: 111 })
  assert.deepEqual(starts[1].request.agentOptions, { provider: 'writer-provider-a', model: 'writer-model-a', reasoningEffort: 'high', maxTokens: 222 })
  assert.equal(starts[2].request.label, 'Research A')
  assert.deepEqual(starts[2].request.toolFilter, { allow: ['web_search'] })
  assert.deepEqual(chatRun.subagentRevisions, { writer: 1, subagents: { research: 1 } })
  assert.deepEqual(agentRun.subagentRevisions, { writer: 1, subagents: { research: 1 } })

  const nextRun = await runtime.prepareRun(agent, 2, [currentInput('下一轮。')])
  const nextReadyText = runtime.writerReadyMessage(nextRun).content.map(block => block.text ?? '').join('')
  assert.doesNotMatch(nextReadyText, /Research A/)
  assert.match(nextReadyText, /Audit B/)
  assert.match(nextReadyText, /"usageContract":"Audit B purpose\."/)
  assert.doesNotMatch(nextReadyText, /"description":"Audit B purpose\."/)
  await assert.rejects(
    tools.get('rp_run_subagent').execute({ subagent: 'research', task: '已删除子代理' }, { agent, callId: 'deleted', signal: new AbortController().signal }),
    error => error.code === 'RP_SUBAGENT_NOT_FOUND',
  )
  const delegated = await tools.get('rp_run_subagent').execute({ subagent: 'audit', task: '新子代理' }, { agent, callId: 'subagent-b', signal: new AbortController().signal })
  assert.equal(delegated.text, '结果 Audit B')
  assert.deepEqual(starts.at(-1).request.agentOptions, { provider: 'audit-provider-b', model: 'audit-model-b', reasoningEffort: 'low', maxTokens: 444 })
  assert.deepEqual(starts.at(-1).request.toolFilter, { allow: ['skill'] })
  await ctx.fiber.dispose()
})

test('inherit routes resolve from the first logged parent request before child execution', async () => {
  const ctx = new Context()
  const tools = new Map()
  const starts = []
  ctx.provide('systemPrompt', { section() {} })
  ctx.provide('tools', { register(tool) { tools.set(tool.name, tool) } })
  ctx.provide('agents', { get() { return undefined } })
  ctx.provide('subagents', {
    async start(provider, request) {
      starts.push({ provider, request })
      return {
        id: `late-route-child-${starts.length}`,
        result: Promise.resolve({ stopReason: 'completed', output: [{ type: 'text', text: request.label === '写作' ? '正文' : '审稿建议' }] }),
        async dispose() {},
      }
    },
  })
  const runtime = new RpRuntime(ctx, {
    chatMaxStepsPerRun: 2, agentMaxStepsPerRun: 8,
    maxEffectsPerCommit: 1, maxArtifactBytes: 4096, maxNarrativeCharacters: 1000,
  })
  runtime.registerSessionProfileProvider(() => ({ runtime: { executionMode: 'agent' } }))
  runtime.registerTaskSubagent({
    id: 'audit', label: '审稿', description: '检查候选正文。', persona: '返回审稿建议。',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    toolFilter: { allow: [] },
  })
  let requestHeader
  const agent = {
    options: {},
    session: { id: 'late-parent-route', events: [], append() {}, requestHeader: () => requestHeader },
  }
  const run = await runtime.prepareRun(agent, 1, [currentInput('继续。')])
  assert.equal(run.writerRoute, undefined)
  requestHeader = { config: { provider: 'selected-provider', model: 'selected-model', reasoningEffort: 'high', maxTokens: 789 } }

  await tools.get('rp_write_turn').execute({ action: 'write' }, { agent, callId: 'late-writer', signal: new AbortController().signal })
  requestHeader = { config: { provider: 'later-provider', model: 'later-model', maxTokens: 999 } }
  await tools.get('rp_run_subagent').execute({ subagent: 'audit', task: '检查连续性' }, { agent, callId: 'late-audit', signal: new AbortController().signal })

  assert.deepEqual(starts.map(start => start.request.agentOptions), [
    { provider: 'selected-provider', model: 'selected-model', reasoningEffort: 'high', maxTokens: 789 },
    { provider: 'selected-provider', model: 'selected-model', reasoningEffort: 'high', maxTokens: 789 },
  ])
  assert.equal(run.subagentRoutesFrozen, true)
  await ctx.fiber.dispose()
})

function testEffectSchema(kind = 'test.effect') {
  return {
    type: 'object',
    additionalProperties: false,
    properties: {
      kind: { type: 'string', const: kind },
      target: { type: 'string' },
      payload: { type: 'object', additionalProperties: true },
    },
    required: ['kind', 'target', 'payload'],
  }
}

function appendCommitCall(events, turn, step, callId, text, extraBlocks = [], leadingBlocks = []) {
  events.push({
    seq: events.length,
    type: 'assistant/message',
    surfaceOp: 'append',
    data: {
      turn,
      step,
      message: {
        id: `assistant-${callId}`,
        source: { kind: 'model', provider: 'mock', model: 'mock' },
        content: [...leadingBlocks, { type: 'text', text }, ...extraBlocks, { type: 'tool-call', id: callId, name: 'rp_commit_turn', arguments: '{}' }],
      },
    },
  })
  events.push({ seq: events.length, type: 'tool/call', data: { turn, step, callId, name: 'rp_commit_turn', arguments: '{}' } })
}

function currentInput(text = 'Continue the story.', images = []) {
  return createUserMessage({
    content: [
      ...(typeof text === 'string' ? [{ type: 'text', text }] : []),
      ...images.map(attachment => ({ type: 'image', attachment })),
    ],
    source: { kind: 'user' },
  })
}

function testImageAttachment(marker) {
  return {
    attachmentId: `sha256:${marker.repeat(64)}`,
    mediaType: 'image/png',
    bytes: 67,
    width: 1,
    height: 1,
    name: `${marker}.png`,
  }
}

function seedWriter(run, narrative) {
  run.writerArtifact = {
    kind: 'rp-agent/writer-result',
    version: 1,
    runId: run.runId,
    writerSessionId: 'writer-test',
    provider: 'mock',
    model: 'mock',
    promptHash: 'test-prompt-hash',
    narrative,
  }
}
