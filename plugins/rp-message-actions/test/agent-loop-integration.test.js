import assert from 'node:assert/strict'
import test from 'node:test'
import { Context } from '@deepseek-ai/cordis'
import AgentRegistry from '@deepseek-ai/dsh-agent'
import AgentLoop from '@deepseek-ai/dsh-agent-loop'
import Commands from '@deepseek-ai/dsh-commands'
import LlmRuntime, {
  LlmAdapter,
  createAssistantMessage,
  createToolResultMessage,
  createUserMessage,
} from '@deepseek-ai/dsh-llm'
import SessionStore, {
  SESSION_FORMAT_VERSION,
  Session,
  SessionId,
  SessionPreparation,
} from '@deepseek-ai/dsh-session'
import SessionProjectionRegistry from '@deepseek-ai/dsh-session-projection'
import SystemPrompt from '@deepseek-ai/dsh-system-prompt'
import ToolRuntime, { defineTool } from '@deepseek-ai/dsh-tools'
import * as RpCore from '../../rp-core/src/index.js'
import * as RpSession from '../../rp-session/src/index.js'
import {
  dispatchMessageAction,
  locateRoleplayTurn,
  recoverPendingRerolls,
} from '../src/index.js'

test('real Agent Loop regenerates in place and accepts new input after assistant deletion', async t => {
  const adapter = new ScriptedAdapter([
    textResponse('初次回复'),
    textResponse('重新生成的回复'),
    textResponse('删除后继续的回复'),
  ])
  const ctx = await loopContext(adapter)
  const handle = await ctx.agents.create({
    sessionId: SessionId('rp-message-actions-real-loop'),
    meta: { agentPreset: 'roleplay' },
    agentOptions: { provider: 'mock', model: 'mock' },
  })
  t.after(async () => {
    await handle.dispose()
    await ctx.fiber.dispose()
  })
  const agent = handle.agent
  const actionContext = { agents: ctx.agents }

  agent.followup(userMessage('原始输入'))
  await agent.whenIdle()
  const firstTurn = locateRoleplayTurn(agent.session, 1)

  const reroll = await dispatchMessageAction(actionContext, 'reroll', {
    sessionId: agent.id,
    target: assistantTarget(firstTurn),
  }, limits)
  assert.equal(reroll.sameSession, true)
  await agent.whenIdle()

  assert.equal(adapter.requests.length, 2)
  assert.deepEqual(requestText(adapter.requests[1]), ['原始输入'])
  const regeneratedTurn = locateRoleplayTurn(agent.session, 2)
  assert.equal(messageText(regeneratedTurn.assistant.data.message), '重新生成的回复')
  assert.deepEqual(activeText(agent.session), ['原始输入', '重新生成的回复'])

  await dispatchMessageAction(actionContext, 'delete', {
    sessionId: agent.id,
    target: assistantTarget(regeneratedTurn),
  }, limits)
  assert.deepEqual(activeText(agent.session), ['原始输入'])

  agent.followup(userMessage('删除后继续'))
  await agent.whenIdle()

  assert.equal(adapter.requests.length, 3)
  assert.deepEqual(requestText(adapter.requests[2]), ['原始输入', '删除后继续'])
  assert.deepEqual(activeText(agent.session), ['原始输入', '删除后继续', '删除后继续的回复'])
  assert.equal(agent.status, 'idle')
})

test('real Agent Loop exposes and rerolls its durable interrupted assistant message', async t => {
  const adapter = new ScriptedAdapter([
    {
      hangAfter: [
        { type: 'block-start', index: 0, blockType: 'text' },
        { type: 'text-delta', index: 0, text: '流式中断前的正文' },
      ],
    },
    textResponse('中断后的重新生成版本'),
  ])
  const ctx = await loopContext(adapter)
  const handle = await ctx.agents.create({
    sessionId: SessionId('rp-message-actions-interrupted-loop'),
    meta: { agentPreset: 'roleplay' },
    agentOptions: { provider: 'mock', model: 'mock' },
  })
  t.after(async () => {
    await handle.dispose()
    await ctx.fiber.dispose()
  })
  const agent = handle.agent
  const partialVisible = new Promise(resolve => {
    const dispose = ctx.on('session/event', (session, event) => {
      if (session !== agent.session
        || event.type !== 'assistant/chunk'
        || event.data.chunk.type !== 'text-delta') return
      dispose()
      resolve()
    })
  })

  agent.followup(userMessage('请继续这一段'))
  await partialVisible
  agent.cancel({ kind: 'user' })
  await agent.whenIdle()

  const interrupted = locateRoleplayTurn(agent.session, 1)
  const target = assistantTarget(interrupted)
  assert.equal(interrupted.assistant.data.interrupted, true)
  assert.equal(messageText(interrupted.assistant.data.message), '流式中断前的正文')
  const detail = await dispatchMessageAction({ agents: ctx.agents }, 'get', {
    sessionId: agent.id,
    target,
  }, limits)
  assert.equal(detail.canEdit, true)
  assert.equal(detail.canDelete, true)
  assert.equal(detail.canReroll, true)
  assert.equal(detail.forkSeq, interrupted.assistant.seq)

  await dispatchMessageAction({ agents: ctx.agents }, 'edit', {
    sessionId: agent.id,
    target,
    content: '编辑后的中断正文',
  }, limits)
  assert.deepEqual(activeText(agent.session), ['请继续这一段', '编辑后的中断正文'])

  await dispatchMessageAction({ agents: ctx.agents }, 'reroll', {
    sessionId: agent.id,
    target,
  }, limits)
  await agent.whenIdle()

  assert.equal(adapter.requests.length, 2)
  assert.deepEqual(requestText(adapter.requests[1]), ['请继续这一段'])
  assert.deepEqual(activeText(agent.session), ['请继续这一段', '中断后的重新生成版本'])
  assert.equal(agent.session.events.find(event => event.type === 'turn/end' && event.data.turn === 1)?.data.reason.kind, 'aborted')
})

test('real resumed Agent Loop rerolls a committed Roleplay turn without retaining its tool history', async t => {
  const adapter = new ScriptedAdapter([textResponse('提交回复的重新生成版本')])
  const ctx = await loopContext(adapter)
  const source = committedSession()
  const handle = await ctx.agents.create({
    sessionId: SessionId('rp-message-actions-committed-loop'),
    seed: source.events,
    meta: { agentPreset: 'roleplay', seedLength: source.events.length },
    agentOptions: { provider: 'mock', model: 'mock' },
  })
  t.after(async () => {
    await handle.dispose()
    await ctx.fiber.dispose()
  })
  const agent = handle.agent
  const original = locateRoleplayTurn(agent.session, 1)

  await dispatchMessageAction({ agents: ctx.agents }, 'reroll', {
    sessionId: agent.id,
    target: assistantTarget(original),
  }, limits)
  await agent.whenIdle()

  assert.equal(adapter.requests.length, 1)
  assert.deepEqual(requestText(adapter.requests[0]), ['已提交的原始输入'])
  assert.equal(adapter.requests[0].messages.some(message => message.content.some(block =>
    block.type === 'tool-call' || block.type === 'tool-result')), false)
  assert.deepEqual(activeText(agent.session), ['已提交的原始输入', '提交回复的重新生成版本'])
  assert.equal(locateRoleplayTurn(agent.session, 2).assistant.data.message.source.kind, 'model')
})

test('real Agent Loop accepts new input after deleting an earlier reply and its full suffix', async t => {
  const adapter = new ScriptedAdapter([
    textResponse('第一条回复'),
    textResponse('第二条回复'),
    textResponse('裁剪后继续的回复'),
  ])
  const ctx = await loopContext(adapter)
  const handle = await ctx.agents.create({
    sessionId: SessionId('rp-message-actions-delete-suffix-loop'),
    meta: { agentPreset: 'roleplay' },
    agentOptions: { provider: 'mock', model: 'mock' },
  })
  t.after(async () => {
    await handle.dispose()
    await ctx.fiber.dispose()
  })
  const agent = handle.agent
  agent.followup(userMessage('第一条输入'))
  await agent.whenIdle()
  const first = locateRoleplayTurn(agent.session, 1)
  agent.followup(userMessage('第二条输入'))
  await agent.whenIdle()

  await dispatchMessageAction({ agents: ctx.agents }, 'delete', {
    sessionId: agent.id,
    target: assistantTarget(first),
  }, limits)
  assert.deepEqual(activeText(agent.session), ['第一条输入'])

  agent.followup(userMessage('从这里继续'))
  await agent.whenIdle()

  assert.equal(adapter.requests.length, 3)
  assert.deepEqual(requestText(adapter.requests[2]), ['第一条输入', '从这里继续'])
  assert.deepEqual(activeText(agent.session), ['第一条输入', '从这里继续', '裁剪后继续的回复'])
})

test('real Agent Loop starts from the remaining history after deleting a user-message suffix', async t => {
  const adapter = new ScriptedAdapter([
    textResponse('将被删除的回复'),
    textResponse('全新输入的回复'),
  ])
  const ctx = await loopContext(adapter)
  const handle = await ctx.agents.create({
    sessionId: SessionId('rp-message-actions-delete-user-suffix-loop'),
    meta: { agentPreset: 'roleplay' },
    agentOptions: { provider: 'mock', model: 'mock' },
  })
  t.after(async () => {
    await handle.dispose()
    await ctx.fiber.dispose()
  })
  const agent = handle.agent
  agent.followup(userMessage('整轮都删除'))
  await agent.whenIdle()
  const first = locateRoleplayTurn(agent.session, 1)

  await dispatchMessageAction({ agents: ctx.agents }, 'delete', {
    sessionId: agent.id,
    target: { kind: 'message', role: 'user', messageId: first.user.data.id },
  }, limits)
  assert.deepEqual(activeText(agent.session), [])

  agent.followup(userMessage('删除后重新输入'))
  await agent.whenIdle()

  assert.equal(adapter.requests.length, 2)
  assert.deepEqual(requestText(adapter.requests[1]), ['删除后重新输入'])
  assert.deepEqual(activeText(agent.session), ['删除后重新输入', '全新输入的回复'])
})

test('Roleplay pre-step context survives consecutive rerolls in the same Agent', async t => {
  const adapter = new ScriptedAdapter([
    textResponse('初次回复'),
    textResponse('第一次重新生成'),
    textResponse('第二次重新生成'),
  ])
  const ctx = await loopContext(adapter)
  await ctx.plugin(Commands)
  ctx.provide('subagents', { async start() { throw new Error('subagent execution is outside this reroll test') } })
  ctx.provide('rpFeatures', { harnessIdentity: () => 'You are the Roleplay test identity.' })
  await ctx.plugin(RpCore, {
    chatMaxStepsPerRun: 5,
    agentMaxStepsPerRun: 8,
    maxEffectsPerCommit: 64,
    maxArtifactBytes: 262144,
    maxNarrativeCharacters: 200000,
  })
  await ctx.plugin(RpSession, {
    defaultMode: 'adaptive',
    defaultExecutionMode: 'chat',
    maxProfileCommandBytes: 262144,
  })
  for (const name of ['rp_asset', 'rp_asset_read']) {
    ctx.tools.register(defineTool({
      name,
      description: 'Test-only Roleplay asset boundary.',
      parameters: {},
      output: {
        schema: { type: 'object', additionalProperties: false, properties: {} },
        render: () => [{ type: 'text', text: '{}' }],
      },
      execute: async () => ({}),
    }))
  }
  const handle = await ctx.agents.create({
    sessionId: SessionId('rp-message-actions-consecutive-rerolls'),
    meta: { agentPreset: 'roleplay' },
    agentOptions: { provider: 'mock', model: 'mock' },
  })
  t.after(async () => {
    await handle.dispose()
    await ctx.fiber.dispose()
  })
  const agent = handle.agent
  const actionContext = { agents: ctx.agents }

  await ctx.rpSessions.configure(agent, {
    expectedRevision: 0,
    mode: 'adaptive',
    playerCharacterId: 'rp.player',
    cast: [{ characterId: 'rp.player', controller: 'user' }],
    scene: {},
    resources: { card: { id: 'test-card' }, lorebooks: [], writingStyles: [] },
    runtime: { executionMode: 'chat' },
  })

  agent.followup(userMessage('重复重新生成'))
  await agent.whenIdle()
  await dispatchMessageAction(actionContext, 'reroll', {
    sessionId: agent.id,
    target: assistantTarget(locateRoleplayTurn(agent.session, 1)),
  }, limits)
  await agent.whenIdle()
  await dispatchMessageAction(actionContext, 'reroll', {
    sessionId: agent.id,
    target: assistantTarget(locateRoleplayTurn(agent.session, 2)),
  }, limits)
  await agent.whenIdle()

  assert.equal(adapter.requests.length, 3)
  assert.equal(messageText(locateRoleplayTurn(agent.session, 3).assistant.data.message), '第二次重新生成')
  assert.equal(agent.session.events.find(event => event.type === 'turn/end' && event.data.turn === 3)?.data.reason.kind, 'completed')
})

test('real Agent Loop replays every user message from one turn in order during reroll', async t => {
  const adapter = new ScriptedAdapter([
    textResponse('合并输入后的初次回复'),
    textResponse('合并输入后的重新生成'),
  ])
  const ctx = await loopContext(adapter)
  const handle = await ctx.agents.create({
    sessionId: SessionId('rp-message-actions-multi-user-reroll'),
    meta: { agentPreset: 'roleplay' },
    agentOptions: { provider: 'mock', model: 'mock' },
  })
  t.after(async () => {
    await handle.dispose()
    await ctx.fiber.dispose()
  })
  const agent = handle.agent

  agent.inject(userMessage('同一轮第一条'))
  agent.followup(userMessage('同一轮第二条'))
  await agent.whenIdle()

  const original = locateRoleplayTurn(agent.session, 1)
  assert.equal(original.users.length, 2)
  assert.deepEqual(requestText(adapter.requests[0]), ['同一轮第一条', '同一轮第二条'])
  await dispatchMessageAction({ agents: ctx.agents }, 'reroll', {
    sessionId: agent.id,
    target: assistantTarget(original),
  }, limits)
  await agent.whenIdle()

  assert.equal(adapter.requests.length, 2)
  assert.deepEqual(requestText(adapter.requests[1]), ['同一轮第一条', '同一轮第二条'])
  const regenerated = locateRoleplayTurn(agent.session, 2)
  assert.equal(regenerated.users.length, 2)
  assert.equal(messageText(regenerated.assistant.data.message), '合并输入后的重新生成')
  assert.deepEqual(activeText(agent.session), [
    '同一轮第一条', '同一轮第二条', '合并输入后的重新生成',
  ])
})

test('resumed Agent Loop re-arms a fully persisted reroll inbox exactly once after the wake crash window', async t => {
  const sessionId = SessionId('rp-message-actions-reroll-wake-crash')
  const source = committedSession(sessionId, ['崩溃前第一条', '崩溃前第二条'])
  const inboxOnly = {
    id: sessionId,
    status: 'idle',
    options: { provider: 'mock', model: 'mock' },
    session: source,
    inject(message) { appendDurableInbox(source, 'next-step', message) },
    // Models the hard-stop boundary: the splice is durable, but no driver is woken.
    followup(message) { appendDurableInbox(source, 'next-turn', message) },
    whenIdle() { return Promise.resolve() },
    runMaintenance(task) { return task(new AbortController().signal) },
  }
  const original = locateRoleplayTurn(source, 1)
  await dispatchMessageAction({ agents: { get: () => inboxOnly } }, 'reroll', {
    sessionId,
    target: assistantTarget(original),
  }, limits)

  const adapter = new ScriptedAdapter([textResponse('恢复后的唯一回复')])
  const resumed = await resumableLoopContext(adapter, snapshot(source))
  resumed.on('agent/session-start', ({ agent }) => recoverPendingRerolls(agent))
  const handle = await resumed.agents.resume({
    resumeSessionId: sessionId,
    agentOptions: { provider: 'mock', model: 'mock' },
  })
  t.after(async () => {
    await handle.dispose()
    await resumed.fiber.dispose()
  })
  await handle.agent.whenIdle()

  assert.equal(adapter.requests.length, 1)
  assert.deepEqual(requestText(adapter.requests[0]), ['崩溃前第一条', '崩溃前第二条'])
  assert.equal(handle.agent.inbox.hasPending, false)
  assert.equal(messageText(locateRoleplayTurn(handle.agent.session, 2).assistant.data.message), '恢复后的唯一回复')

  const completed = snapshot(handle.agent.session)
  await handle.dispose()
  await resumed.fiber.dispose()

  const noReplayAdapter = new ScriptedAdapter([])
  const replayed = await resumableLoopContext(noReplayAdapter, completed)
  replayed.on('agent/session-start', ({ agent }) => recoverPendingRerolls(agent))
  const replayedHandle = await replayed.agents.resume({
    resumeSessionId: sessionId,
    agentOptions: { provider: 'mock', model: 'mock' },
  })
  await replayedHandle.agent.whenIdle()
  assert.equal(noReplayAdapter.requests.length, 0)
  assert.equal(replayedHandle.agent.inbox.hasPending, false)
  await replayedHandle.dispose()
  await replayed.fiber.dispose()
})

const limits = { maxNarrativeCharacters: 1000, maxUserMessageCharacters: 1000 }

function userMessage(text) {
  return createUserMessage({ content: [{ type: 'text', text }], source: { kind: 'user' } })
}

function assistantTarget(turn) {
  return {
    kind: 'message',
    role: 'assistant',
    messageId: turn.assistant.data.message.id,
  }
}

function activeText(session) {
  return session.deriveMessages().flatMap(message => message.content
    .filter(block => block.type === 'text')
    .map(block => block.text))
}

function requestText(request) {
  return request.messages.flatMap(message => message.content
    .filter(block => block.type === 'text')
    .map(block => block.text))
}

function messageText(message) {
  return message.content
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('')
}

function textResponse(text) {
  return [
    { type: 'block-start', index: 0, blockType: 'text' },
    { type: 'text-delta', index: 0, text },
    { type: 'block-end', index: 0, block: { type: 'text', text } },
    { type: 'usage', usage: { inputTokens: 10, outputTokens: [...text].length } },
    { type: 'finish', reason: { kind: 'stop' } },
  ]
}

class ScriptedAdapter extends LlmAdapter {
  constructor(script) {
    super()
    this.script = script
    this.requests = []
  }

  resolveModel(provider, model) {
    return Promise.resolve({
      provider,
      id: model,
      name: model,
      context: { contextWindow: 64000 },
      defaultMaxTokens: 4096,
    })
  }

  async * stream(options) {
    this.requests.push(options)
    const response = this.script.shift()
    if (response === undefined) throw new Error('ScriptedAdapter: response script exhausted')
    if (!Array.isArray(response) && response !== null && 'hangAfter' in response) {
      for (const chunk of response.hangAfter) yield chunk
      await new Promise((_resolve, reject) => {
        if (options.signal?.aborted) { reject(new Error('aborted')); return }
        options.signal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true })
      })
      return
    }
    for (const chunk of response) yield chunk
  }
}

async function loopContext(adapter) {
  const ctx = new Context()
  ctx.provide('tokenMeter', {
    estimateMessage(message) {
      const text = message.content?.filter(block => block.type === 'text').map(block => block.text).join('') ?? ''
      return Math.ceil(text.length / 4) + 8
    },
  })
  await ctx.plugin(LlmRuntime)
  await ctx.plugin(SessionStore)
  await ctx.plugin(SessionProjectionRegistry)
  await ctx.plugin(SystemPrompt, { includeHarnessIdentity: false })
  await ctx.plugin(ToolRuntime)
  await ctx.plugin(AgentRegistry)
  await ctx.plugin(AgentLoop, { agents: [] })
  ctx.llm.registerAdapter(['mock'], adapter)
  return ctx
}

async function resumableLoopContext(adapter, persisted) {
  const ctx = await loopContext(adapter)
  ctx.provide('sessionPersistence', {
    prepare(id, signal) {
      signal?.throwIfAborted()
      assert.equal(id, persisted.meta.id)
      return SessionPreparation.create(ctx.sessions.prepare(id, {
        seed: structuredClone(persisted.events),
        meta: structuredClone(persisted.meta),
        seedSource: 'persistence',
      }))
    },
  })
  return ctx
}

function snapshot(session) {
  return {
    meta: structuredClone(session.header),
    events: structuredClone(session.events),
  }
}

function committedSession(
  id = SessionId('rp-message-actions-committed-source'),
  userTexts = ['已提交的原始输入'],
) {
  const session = Session.create(id, undefined, {
    version: SESSION_FORMAT_VERSION,
    id,
    createdAt: 1,
    agentPreset: 'roleplay',
  })
  session.append('turn/start', { turn: 1 })
  session.append('step/start', { turn: 1, step: 1 })
  for (const [index, text] of userTexts.entries()) {
    session.append('user/message', {
      role: 'user', id: `committed-user-${index + 1}`,
      content: [{ type: 'text', text }], source: { kind: 'user' },
    }, { surfaceOp: 'append' })
  }
  const callId = 'committed-call'
  const assistant = session.append('assistant/message', {
    turn: 1,
    step: 1,
    message: createAssistantMessage({
      content: [
        { type: 'text', text: '已提交的原回复' },
        { type: 'tool-call', id: callId, name: 'rp_commit_turn', arguments: '{}' },
      ],
      source: { kind: 'model', provider: 'mock', model: 'mock' },
    }),
  }, { surfaceOp: 'append' })
  const call = session.append('tool/call', {
    turn: 1, step: 1, callId, name: 'rp_commit_turn', arguments: '{}',
  })
  session.append('tool/result', {
    turn: 1,
    step: 1,
    message: createToolResultMessage({
      callId,
      content: [{ type: 'text', text: 'Roleplay turn committed.' }],
      isError: false,
    }),
    meta: {
      kind: 'rp-agent/turn-commit', version: 2, runId: 'committed-run', turn: 1,
      assistant: { seq: assistant.seq, messageId: assistant.data.message.id }, effects: [],
    },
  }, { surfaceOp: 'append', sourceEventSeqs: [call.seq] })
  session.append('step/end', { turn: 1, step: 1 })
  session.append('turn/end', { turn: 1, reason: { kind: 'completed' } })
  return session
}

function appendDurableInbox(session, target, message) {
  const pending = { 'next-turn': [], 'next-step': [] }
  for (const event of session.events) {
    if (event.type !== 'agent/inbox/spliced') continue
    pending[event.data.target].splice(
      event.data.start,
      event.data.removedCount ?? 0,
      ...event.data.inserted,
    )
  }
  session.append('agent/inbox/spliced', {
    target,
    start: pending[target].length,
    inserted: [message],
  })
}
