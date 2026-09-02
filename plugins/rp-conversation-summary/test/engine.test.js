import assert from 'node:assert/strict'
import test from 'node:test'
import { Context } from '@deepseek-ai/cordis'
import LlmRuntime, {
  createMessage,
  createUserMessage,
  LlmAdapter,
} from '@deepseek-ai/dsh-llm'
import SessionStore, { SessionId } from '@deepseek-ai/dsh-session'
import SessionProjectionRegistry from '@deepseek-ai/dsh-session-projection'
import TokenMeter from '@deepseek-ai/dsh-token-meter'
import { isCompactCheckpointSource } from '@deepseek-ai/dsh-compaction'
import {
  createRpMessageActionMetadata,
  roleplayTranscriptMessages,
} from 'dsh-roleplay-rp-core/conversation'
import RpConversationSummaryEngine from '../src/index.js'
import { conversationSummaryContext } from '../src/summary-source.js'

const VALID_SUMMARY = [
  '## 剧情进展', '- 潮门已经开启。',
  '## 角色与关系', '- 林澈仍然信任守门人。',
  '## 场景与世界事实', '- 当前在雨夜港口。',
  '## 未解决线索与约束', '- 钟声来源未知。',
  '## 最近状态与续写锚点', '- 两人正要进入潮门。',
].join('\n')

test('pressure below 80% is a strict no-op', async (t) => {
  const adapter = new DeferredSummaryAdapter({ response: VALID_SUMMARY })
  const ctx = await createContext(adapter)
  t.after(() => ctx.fiber.dispose())
  const session = ctx.sessions.create(SessionId('rp-below-summary-threshold'))
  appendCompletedTurn(session, 1, '短历史', true, 10)
  session.append('turn/start', { turn: 2 })
  const before = [...session.surface.nodes]

  assert.equal(await ctx.compaction.compactIfNeeded(
    { session, options: { provider: 'mock', model: 'mock' } },
    'pressure',
    new AbortController().signal,
  ), null)
  assert.equal(adapter.requests.length, 0)
  assert.deepEqual(session.surface.nodes, before)
  assert.equal(session.snapshotEvents().some(event => event.type.startsWith('compaction/')), false)
  assert.equal(conversationSummaryContext(session), undefined)
})

test('pressure summary overlaps turn N and lands one native checkpoint before turn N+1', async (t) => {
  const gate = Promise.withResolvers()
  const started = Promise.withResolvers()
  const adapter = new DeferredSummaryAdapter({ gate: gate.promise, started, response: VALID_SUMMARY })
  const ctx = await createContext(adapter)
  t.after(() => ctx.fiber.dispose())
  const session = ctx.sessions.create(SessionId('rp-deferred-summary'))
  appendCompletedTurn(session, 1, '第一轮旧历史', true)
  session.append('turn/start', { turn: 2 })
  const agent = { session, options: { provider: 'mock', model: 'mock' } }
  const signal = new AbortController().signal
  const frozenPrefix = [...session.surface.nodes]

  assert.equal(await ctx.compaction.compactIfNeeded(agent, 'pressure', signal), null)
  await started.promise
  assert.equal(adapter.requests.length, 1)
  assert.deepEqual(session.surface.nodes, frozenPrefix)
  assert.equal(session.snapshotEvents().some(event => event.type.startsWith('compaction/')), false)

  appendTurnBody(session, 2, '第二轮近期原文')
  session.append('turn/start', { turn: 3 })
  let settled = false
  const landing = ctx.compaction.compactIfNeeded(agent, 'pressure', signal)
    .then(result => { settled = true; return result })
  await Promise.resolve()
  assert.equal(settled, false)
  assert.equal(session.snapshotEvents().some(event => event.type.startsWith('compaction/')), false)

  gate.resolve()
  const result = await landing
  assert.ok(result)
  assert.deepEqual(result.shadowedSeqs, frozenPrefix)
  assert.equal(adapter.requests.length, 1, 'landing must reuse the deferred result')

  const summaryEvent = session.snapshotEvents().findLast(event => event.type === 'compaction/summary')
  assert.ok(summaryEvent)
  assert.equal(Object.hasOwn(summaryEvent.data, 'llmStreamCall'), false)
  const active = session.surface.nodes.map(seq => session.snapshotEvents()[seq])
  assert.equal(active.length, 3)
  assert.equal(active[0].type, 'user/message')
  assert.equal(isCompactCheckpointSource(active[0].data.source), true)
  assert.match(messageText(active[1].data), /^第二轮近期原文（用户）/u)
  assert.match(messageText(active[2].data.message), /^第二轮近期原文（回复）/u)

  const writerHistory = roleplayTranscriptMessages(session).map(messageText)
  assert.equal(writerHistory.length, 2)
  assert.match(writerHistory[0], /^第二轮近期原文（用户）/u)
  assert.match(writerHistory[1], /^第二轮近期原文（回复）/u)
  assert.equal(conversationSummaryContext(session).text, VALID_SUMMARY)
  const summarizedRequest = adapter.requests[0].messages.map(messageText).join('\n')
  assert.match(summarizedRequest, /第一轮旧历史/)
  assert.doesNotMatch(summarizedRequest, /第二轮近期原文/)
})

test('a failed deferred summary preserves the surface and never opens a compaction transaction', async (t) => {
  const adapter = new DeferredSummaryAdapter({
    response: VALID_SUMMARY,
    finish: { kind: 'max-tokens' },
  })
  const ctx = await createContext(adapter)
  t.after(() => ctx.fiber.dispose())
  const session = ctx.sessions.create(SessionId('rp-failed-summary'))
  appendCompletedTurn(session, 1, '不能丢失的旧历史', true)
  session.append('turn/start', { turn: 2 })
  const agent = { session, options: { provider: 'mock', model: 'mock' } }
  const signal = new AbortController().signal
  const originalSurface = [...session.surface.nodes]

  assert.equal(await ctx.compaction.compactIfNeeded(agent, 'pressure', signal), null)
  appendTurnBody(session, 2, '失败后仍保留的近期原文')
  session.append('turn/start', { turn: 3 })
  assert.equal(await ctx.compaction.compactIfNeeded(agent, 'pressure', signal), null)

  assert.deepEqual(session.surface.nodes.slice(0, originalSurface.length), originalSurface)
  assert.equal(session.snapshotEvents().some(event => event.type.startsWith('compaction/')), false)
  assert.equal(conversationSummaryContext(session), undefined)
})

test('a completed candidate is discarded when its frozen surface prefix has changed', async (t) => {
  const adapter = new DeferredSummaryAdapter({ response: VALID_SUMMARY })
  const ctx = await createContext(adapter)
  t.after(() => ctx.fiber.dispose())
  const session = ctx.sessions.create(SessionId('rp-stale-summary'))
  appendCompletedTurn(session, 1, '随后会被改写的历史', true)
  session.append('turn/start', { turn: 2 })
  const agent = { session, options: { provider: 'mock', model: 'mock' } }
  const signal = new AbortController().signal

  assert.equal(await ctx.compaction.compactIfNeeded(agent, 'pressure', signal), null)
  appendTurnBody(session, 2, '第二轮原文')
  const head = session.surface.nodes[0]
  const original = session.snapshotEvents()[head].data
  const replacement = session.append('user/message', {
    ...original,
    content: [{ type: 'text', text: '历史已由另一项操作改写' }],
  }, {
    surfaceOp: { op: 'replace', start: head, end: head },
    sourceEventSeqs: [head],
  })
  session.append('turn/start', { turn: 3 })

  assert.equal(await ctx.compaction.compactIfNeeded(agent, 'pressure', signal), null)
  assert.equal(session.surface.nodes.includes(replacement.seq), true)
  assert.equal(session.surface.nodes.includes(head), false)
  assert.equal(session.snapshotEvents().some(event => event.type.startsWith('compaction/')), false)
  assert.equal(conversationSummaryContext(session), undefined)
})

test('disposing the plugin aborts a deferred candidate and removes its automatic service', async (t) => {
  const gate = Promise.withResolvers()
  const started = Promise.withResolvers()
  const adapter = new DeferredSummaryAdapter({ gate: gate.promise, started, response: VALID_SUMMARY })
  const ctx = await createContext(adapter)
  t.after(() => ctx.fiber.dispose())
  const session = ctx.sessions.create(SessionId('rp-summary-dispose'))
  appendCompletedTurn(session, 1, '卸载前的历史', true)
  session.append('turn/start', { turn: 2 })
  const agent = { session, options: { provider: 'mock', model: 'mock' } }

  assert.equal(await ctx.compaction.compactIfNeeded(
    agent,
    'pressure',
    new AbortController().signal,
  ), null)
  await started.promise
  assert.equal(adapter.requests[0].signal.aborted, false)

  await ctx.summaryFiber.dispose()
  assert.equal(adapter.requests[0].signal.aborted, true)
  assert.equal(ctx.get('compaction'), undefined)
  gate.resolve()
  await Promise.resolve()
  assert.equal(session.snapshotEvents().some(event => event.type.startsWith('compaction/')), false)
})

test('overflow recovery and manual compact stay synchronous native Roleplay transactions', async (t) => {
  const adapter = new DeferredSummaryAdapter({ response: VALID_SUMMARY })
  const ctx = await createContext(adapter)
  t.after(() => ctx.fiber.dispose())
  const signal = new AbortController().signal

  const overflowSession = ctx.sessions.create(SessionId('rp-overflow-summary'))
  appendCompletedTurn(overflowSession, 1, '溢出旧历史', true)
  appendCompletedTurn(overflowSession, 2, '溢出近期原文')
  overflowSession.append('turn/start', { turn: 3 })
  const overflow = await ctx.compaction.compactIfNeeded({
    session: overflowSession,
    options: { provider: 'mock', model: 'mock' },
  }, 'context-overflow', signal)
  assert.ok(overflow)
  assert.equal(conversationSummaryContext(overflowSession).text, VALID_SUMMARY)
  assert.equal(
    overflowSession.snapshotEvents().findLast(event => event.type === 'compaction/summary').data.llmStreamCall,
    true,
  )

  const manualSession = ctx.sessions.create(SessionId('rp-manual-summary'))
  appendCompletedTurn(manualSession, 1, '手动压缩历史', true)
  const manualAgent = {
    session: manualSession,
    options: { provider: 'mock', model: 'mock' },
    runMaintenance(task) { return task(new AbortController().signal) },
  }
  const manual = await ctx.compaction.compactNow(manualAgent, signal)
  assert.ok(manual)
  assert.equal(conversationSummaryContext(manualSession).text, VALID_SUMMARY)
  assert.equal(
    manualSession.snapshotEvents().findLast(event => event.type === 'compaction/summary').data.llmStreamCall,
    true,
  )
  assert.equal(adapter.requests.length, 2)
  assert.ok(adapter.requests.every(request => request.purpose === 'compaction'))
})

test('overflow recovery keeps the latest completed Roleplay exchange verbatim', async (t) => {
  const adapter = new DeferredSummaryAdapter({ response: VALID_SUMMARY })
  const ctx = await createContext(adapter)
  t.after(() => ctx.fiber.dispose())
  const session = ctx.sessions.create(SessionId('rp-overflow-retains-latest-reply'))
  appendCompletedTurn(session, 1, '应当总结的旧历史', true)
  const latestExchangeStart = session.surface.nodes.length
  appendCompletedTurn(session, 2, '必须保留的近期原文')
  const latestExchange = session.surface.nodes.slice(latestExchangeStart)
  const latestAssistant = latestExchange.findLast(seq => session.snapshotEvents()[seq]?.type === 'assistant/message')
  session.append('turn/start', { turn: 3 })
  session.append('step/start', { turn: 3, step: 1 })
  const currentInput = session.append('user/message', createUserMessage({
    content: [{ type: 'text', text: '触发溢出的当前输入' }],
    source: { kind: 'user' },
  }), { surfaceOp: 'append' })

  const result = await ctx.compaction.compactIfNeeded({
    session,
    options: { provider: 'mock', model: 'mock' },
  }, 'context-overflow', new AbortController().signal)

  assert.ok(result)
  assert.ok(latestAssistant !== undefined)
  assert.equal(result.shadowedSeqs.includes(latestAssistant), false)
  assert.ok(latestExchange.every(seq => session.surface.nodes.includes(seq)))
  assert.equal(session.surface.nodes.includes(currentInput.seq), true)
  assert.equal(conversationSummaryContext(session).text, VALID_SUMMARY)
  assert.match(
    roleplayTranscriptMessages(session).map(messageText).join('\n'),
    /必须保留的近期原文（回复）/u,
  )
})

test('overflow recovery does not consume the only completed model reply', async (t) => {
  const adapter = new DeferredSummaryAdapter({ response: VALID_SUMMARY })
  const ctx = await createContext(adapter)
  t.after(() => ctx.fiber.dispose())
  const session = ctx.sessions.create(SessionId('rp-overflow-keeps-only-reply'))
  appendCompletedTurn(session, 1, '唯一的近期原文', true)
  session.append('turn/start', { turn: 2 })
  session.append('step/start', { turn: 2, step: 1 })
  session.append('user/message', createUserMessage({
    content: [{ type: 'text', text: '触发溢出的当前输入' }],
    source: { kind: 'user' },
  }), { surfaceOp: 'append' })
  const before = [...session.surface.nodes]

  const result = await ctx.compaction.compactIfNeeded({
    session,
    options: { provider: 'mock', model: 'mock' },
  }, 'context-overflow', new AbortController().signal)

  assert.equal(result, null)
  assert.deepEqual(session.surface.nodes, before)
  assert.equal(session.snapshotEvents().some(event => event.type === 'compaction/start'), false)
  assert.equal(adapter.requests.length, 0)
})

test('manual compact meters an existing idle reroll carrier without changing the Session log', async (t) => {
  const adapter = new DeferredSummaryAdapter({ response: VALID_SUMMARY })
  const ctx = await createContext(adapter)
  t.after(() => ctx.fiber.dispose())
  const signal = new AbortController().signal
  const session = ctx.sessions.create(SessionId('rp-manual-summary-after-reroll'))
  appendCompletedTurn(session, 1, '仍然活跃的第一轮', true)
  const secondStart = session.surface.nodes.length
  appendCompletedTurn(session, 2, '被重新生成的第二轮')
  const shadowed = session.surface.nodes.slice(secondStart)
  const assistant = session.snapshotEvents()[shadowed.findLast(seq => (
    session.snapshotEvents()[seq]?.type === 'assistant/message'
  ))]
  const replay = createUserMessage({
    content: [{ type: 'text', text: '重新生成第二轮' }],
    source: { kind: 'user' },
  })
  const carrierData = structuredClone(assistant.data)
  carrierData.message.content = []
  carrierData.message.source = {
    ...carrierData.message.source,
    rpMessageAction: createRpMessageActionMetadata('reroll', [{
      kind: 'message',
      role: 'assistant',
      messageId: assistant.data.message.id,
      turn: assistant.data.turn,
      step: assistant.data.step,
    }], { replay: [replay] }),
  }
  const carrier = session.append('assistant/message', carrierData, {
    surfaceOp: { op: 'replace', start: shadowed[0], end: shadowed.at(-1) },
    sourceEventSeqs: shadowed,
  })
  assert.throws(
    () => ctx.tokenMeter.measure(session),
    new RegExp(`assistant/message at seq ${carrier.seq} has no matching step/start event`, 'u'),
  )

  const eventCount = session.snapshotEvents().length
  const result = await ctx.compaction.compactNow({
    session,
    options: { provider: 'mock', model: 'mock' },
    runMaintenance(task) { return task(new AbortController().signal) },
  }, signal)

  assert.ok(result)
  assert.equal(result.shadowedSeqs.includes(carrier.seq), false)
  assert.equal(session.snapshotEvents()[eventCount].type, 'compaction/start', 'compatibility metering must not append repair events')
  assert.equal(session.surface.nodes.includes(carrier.seq), true)
  assert.equal(conversationSummaryContext(session).text, VALID_SUMMARY)
  assert.equal(adapter.requests.length, 1)
})

test('overflow recovery uses the same scoped meter for an existing reroll carrier', async (t) => {
  const adapter = new DeferredSummaryAdapter({ response: VALID_SUMMARY })
  const ctx = await createContext(adapter)
  t.after(() => ctx.fiber.dispose())
  const session = ctx.sessions.create(SessionId('rp-overflow-summary-after-reroll'))
  appendCompletedTurn(session, 1, '溢出前应总结的第一轮', true)
  appendCompletedTurn(session, 2, '溢出前保留的第二轮')
  const retainedAssistant = session.surface.nodes.findLast(seq => session.snapshotEvents()[seq]?.type === 'assistant/message')
  const rerollStart = session.surface.nodes.length
  appendCompletedTurn(session, 3, '溢出前重新生成的第三轮')
  const shadowed = session.surface.nodes.slice(rerollStart)
  const assistant = session.snapshotEvents()[shadowed.findLast(seq => (
    session.snapshotEvents()[seq]?.type === 'assistant/message'
  ))]
  const data = structuredClone(assistant.data)
  data.message.content = []
  data.message.source = {
    ...data.message.source,
    rpMessageAction: createRpMessageActionMetadata('reroll', [{
      kind: 'message', role: 'assistant', messageId: assistant.data.message.id,
      turn: assistant.data.turn, step: assistant.data.step,
    }], {
      replay: [createUserMessage({
        content: [{ type: 'text', text: '重新生成溢出前第三轮' }],
        source: { kind: 'user' },
      })],
    }),
  }
  const carrier = session.append('assistant/message', data, {
    surfaceOp: { op: 'replace', start: shadowed[0], end: shadowed.at(-1) },
    sourceEventSeqs: shadowed,
  })
  session.append('turn/start', { turn: 4 })

  const result = await ctx.compaction.compactIfNeeded({
    session,
    options: { provider: 'mock', model: 'mock' },
  }, 'context-overflow', new AbortController().signal)

  assert.ok(result)
  assert.ok(retainedAssistant !== undefined)
  assert.equal(result.shadowedSeqs.includes(retainedAssistant), false)
  assert.equal(session.surface.nodes.includes(retainedAssistant), true)
  assert.equal(result.shadowedSeqs.includes(carrier.seq), false)
  assert.equal(session.surface.nodes.includes(carrier.seq), true)
  assert.equal(conversationSummaryContext(session).text, VALID_SUMMARY)
  assert.equal(adapter.requests.length, 1)
})

async function createContext(adapter) {
  const ctx = new Context()
  await ctx.plugin(LlmRuntime)
  await ctx.plugin(SessionStore)
  await ctx.plugin(SessionProjectionRegistry)
  await ctx.plugin(TokenMeter)
  ctx.llm.registerAdapter(['mock'], adapter)
  ctx.summaryFiber = await ctx.plugin(RpConversationSummaryEngine)
  return ctx
}

function appendCompletedTurn(session, turn, label, withHeader = false, padding = 10000) {
  session.append('turn/start', { turn })
  if (withHeader) {
    session.append('request/header', {
      header: { config: { provider: 'mock', model: 'mock' } },
      reason: 'initial',
    })
  }
  appendTurnBody(session, turn, label, padding)
}

function appendTurnBody(session, turn, label, padding = 10000) {
  session.append('step/start', { turn, step: 1 })
  session.append('user/message', createUserMessage({
    content: [{ type: 'text', text: `${label}（用户）${'旧'.repeat(padding)}` }],
    source: { kind: 'user' },
  }), { surfaceOp: 'append' })
  session.append('assistant/message', {
    turn,
    step: 1,
    message: createMessage({
      role: 'assistant',
      content: [{ type: 'text', text: `${label}（回复）${'事'.repeat(padding)}` }],
      source: { kind: 'model', provider: 'mock', model: 'mock' },
    }),
  }, { surfaceOp: 'append' })
  session.append('step/end', { turn, step: 1 })
  session.append('turn/end', { turn, reason: { kind: 'completed' } })
}

class DeferredSummaryAdapter extends LlmAdapter {
  constructor({ gate, started, response, finish = { kind: 'stop' } }) {
    super()
    this.gate = gate
    this.started = started
    this.response = response
    this.finish = finish
    this.requests = []
  }

  resolveModel(provider, model) {
    return Promise.resolve({
      provider,
      id: model,
      name: model,
      context: { contextWindow: 4000 },
      defaultMaxTokens: 512,
    })
  }

  async * stream(options) {
    this.requests.push(options)
    this.started?.resolve()
    if (this.gate !== undefined) await this.gate
    if (this.finish.kind !== 'max-tokens') {
      yield { type: 'block-start', index: 0, blockType: 'text' }
      yield { type: 'text-delta', index: 0, text: this.response }
      yield { type: 'block-end', index: 0, block: { type: 'text', text: this.response } }
      yield { type: 'usage', usage: { inputTokens: 1000, outputTokens: 100 } }
    }
    yield { type: 'finish', reason: this.finish }
  }
}

function messageText(message) {
  return message.content
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('\n')
}
