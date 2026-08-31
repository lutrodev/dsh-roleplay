import assert from 'node:assert/strict'
import test from 'node:test'
import { createUserMessage } from '@deepseek-ai/dsh-llm'
import {
  SUMMARY_MAX_TOKENS,
  nativeSummaryInput,
  pressureSummaryInput,
  summarizeRoleplay,
} from '../src/summarizer.js'

const VALID_SUMMARY = [
  '## 剧情进展', '- 潮门已经开启。',
  '## 角色与关系', '- 林澈仍然信任守门人。',
  '## 场景与世界事实', '- 当前在雨夜港口。',
  '## 未解决线索与约束', '- 钟声来源未知。',
  '## 最近状态与续写锚点', '- 两人正要进入潮门。',
].join('\n')

test('pressure input snapshots only completed logical RP dialogue', () => {
  const user = createUserMessage({ content: [{ type: 'text', text: '打开潮门。' }], source: { kind: 'user' } })
  const assistant = {
    role: 'assistant', id: 'assistant-1', source: { kind: 'model', provider: 'mock', model: 'mock' },
    content: [{ type: 'text', text: '潮门缓缓开启。' }],
  }
  const events = [
    { seq: 0, type: 'turn/start', data: { turn: 1 } },
    { seq: 1, type: 'user/message', data: user, surfaceOp: 'append' },
    { seq: 2, type: 'step/start', data: { turn: 1, step: 1 } },
    { seq: 3, type: 'assistant/message', data: { turn: 1, step: 1, message: assistant }, surfaceOp: 'append' },
    { seq: 4, type: 'tool/result', data: { meta: commitMeta('run-1', 1, 3, assistant.id) }, surfaceOp: 'append' },
    { seq: 5, type: 'step/end', data: { turn: 1, step: 1 } },
    { seq: 6, type: 'turn/end', data: { turn: 1, reason: { kind: 'completed' } } },
  ]
  const input = pressureSummaryInput({ events, surface: { nodes: [1, 3, 4] } })
  assert.equal(input.newMessageCount, 2)
  assert.deepEqual(input.messages.map(message => [message.role, message.content[0].text]), [
    ['user', '打开潮门。'],
    ['assistant', '写作回复：潮门缓缓开启。'],
  ])
})

test('later pressure input merges the active checkpoint summary with only newer dialogue', () => {
  const recentUser = createUserMessage({
    content: [{ type: 'text', text: '继续进入潮门。' }],
    source: { kind: 'user' },
  })
  const recentAssistant = {
    role: 'assistant', id: 'assistant-recent', source: { kind: 'model', provider: 'mock', model: 'mock' },
    content: [{ type: 'text', text: '两人踏入潮门。' }],
  }
  const events = [
    { seq: 0, type: 'compaction/summary', data: { compactionId: 'old', summary: [{ type: 'text', text: '旧总结仍有效。' }] } },
    {
      seq: 1,
      type: 'user/message',
      data: { role: 'user', id: 'checkpoint-old', content: [{ type: 'text', text: '<compacted-summary>旧总结仍有效。</compacted-summary>' }], source: { kind: 'plugin', plugin: 'compact', compactionId: 'old' } },
      surfaceOp: { op: 'replace', start: 9, end: 10 },
      sourceEventSeqs: [9, 10],
    },
    { seq: 2, type: 'turn/start', data: { turn: 2 } },
    { seq: 3, type: 'user/message', data: recentUser, surfaceOp: 'append' },
    { seq: 4, type: 'step/start', data: { turn: 2, step: 1 } },
    { seq: 5, type: 'assistant/message', data: { turn: 2, step: 1, message: recentAssistant }, surfaceOp: 'append' },
    { seq: 6, type: 'tool/result', data: { meta: commitMeta('run-2', 2, 5, recentAssistant.id) }, surfaceOp: 'append' },
    { seq: 7, type: 'step/end', data: { turn: 2, step: 1 } },
    { seq: 8, type: 'turn/end', data: { turn: 2, reason: { kind: 'completed' } } },
  ]
  const input = pressureSummaryInput({ events, surface: { nodes: [1, 3, 5, 6] } })
  assert.equal(input.newMessageCount, 2)
  assert.deepEqual(input.messages.map(message => [message.role, message.content[0].text]), [
    ['user', '<已有会话总结>\n旧总结仍有效。\n</已有会话总结>'],
    ['user', '继续进入潮门。'],
    ['assistant', '写作回复：两人踏入潮门。'],
  ])
  assert.equal(input.messages.some(message => message.content[0].text.includes('<compacted-summary>')), false)
})

test('manual input labels an ordinary assistant response as non-writing', () => {
  const assistant = {
    role: 'assistant', id: 'assistant-discussion', source: { kind: 'model', provider: 'mock', model: 'mock' },
    content: [{ type: 'text', text: '可以先讨论反派的动机。' }],
  }
  const messages = nativeSummaryInput({ messages: [assistant] }, { events: [], surface: { nodes: [] } })
  assert.equal(messages[0].content[0].text, '非写作回复：可以先讨论反派的动机。')
})

test('manual and overflow input merges only checkpoints inside the selected native region', () => {
  const firstCheckpoint = checkpointMessage('first')
  const retainedCheckpoint = checkpointMessage('retained')
  const recent = createUserMessage({
    content: [{ type: 'text', text: '只和第一份总结一起压缩。' }],
    source: { kind: 'user' },
  })
  const session = {
    events: [
      { seq: 0, type: 'compaction/summary', data: { compactionId: 'first', summary: [{ type: 'text', text: '第一份总结。' }] } },
      { seq: 1, type: 'user/message', data: firstCheckpoint },
      { seq: 2, type: 'compaction/summary', data: { compactionId: 'retained', summary: [{ type: 'text', text: '范围外总结。' }] } },
      { seq: 3, type: 'user/message', data: retainedCheckpoint },
    ],
    surface: { nodes: [1, 3] },
  }

  const messages = nativeSummaryInput({ messages: [firstCheckpoint, recent] }, session)
  assert.deepEqual(messages.map(message => message.content[0].text), [
    '<已有会话总结>\n第一份总结。\n</已有会话总结>',
    '只和第一份总结一起压缩。',
  ])
})

test('summarizer uses the inherited parent route and returns an unmarked deferred result', async () => {
  let request
  const ctx = { llm: { async * stream(options) { request = options; yield* textResponse(VALID_SUMMARY) } } }
  const agent = summaryAgent()
  const result = await summarizeRoleplay(ctx, [createUserMessage({
    content: [{ type: 'text', text: '继续。' }], source: { kind: 'user' },
  })], agent, undefined, false)
  assert.deepEqual(result.summary, [{ type: 'text', text: VALID_SUMMARY }])
  assert.equal(Object.hasOwn(result, 'llmStreamCall'), false)
  assert.equal(request.provider, 'parent-provider')
  assert.equal(request.model, 'parent-model')
  assert.equal(request.maxTokens, SUMMARY_MAX_TOKENS)
  assert.equal(request.purpose, 'compaction')
  assert.equal(request.system, undefined)
  assert.equal(request.tools, undefined)
})

test('summarizer rejects truncation, non-text output, extra sections and hard-limit overflow', async () => {
  const message = createUserMessage({ content: [{ type: 'text', text: '继续。' }], source: { kind: 'user' } })
  await assert.rejects(
    summarizeRoleplay({ llm: { async * stream() { yield { type: 'finish', reason: { kind: 'max-tokens' } } } } }, [message], summaryAgent(), undefined, true),
    error => error.code === 'MAX_TOKENS',
  )
  await assert.rejects(
    summarizeRoleplay({ llm: { async * stream() {
      yield { type: 'block-end', index: 0, block: { type: 'reasoning', text: 'hidden' } }
      yield { type: 'finish', reason: { kind: 'stop' } }
    } } }, [message], summaryAgent(), undefined, true),
    error => error.code === 'UNSUPPORTED_CONTENT',
  )
  await assert.rejects(
    summarizeRoleplay({ llm: { async * stream() { yield* textResponse(`${VALID_SUMMARY}\n## 多余部分\n- 不允许`) } } }, [message], summaryAgent(), undefined, true),
    /required five Markdown sections/,
  )
  await assert.rejects(
    summarizeRoleplay({ llm: { async * stream() { yield* textResponse(VALID_SUMMARY.replace('## 角色与关系', '## 关系')) } } }, [message], summaryAgent(), undefined, true),
    /required five Markdown sections/,
  )
  await assert.rejects(
    summarizeRoleplay({ llm: { async * stream() { yield* textResponse(`${VALID_SUMMARY}\n${'界'.repeat(8000)}`) } } }, [message], summaryAgent(), undefined, true),
    /hard limit/,
  )
})

function summaryAgent() {
  return {
    options: { provider: 'fallback', model: 'fallback' },
    session: {
      id: 'rp-summary-test',
      requestHeader: () => ({ config: { provider: 'parent-provider', model: 'parent-model' } }),
    },
  }
}

function checkpointMessage(compactionId) {
  return createUserMessage({
    content: [{ type: 'text', text: `checkpoint:${compactionId}` }],
    source: { kind: 'plugin', plugin: 'compact', compactionId },
  })
}

function commitMeta(runId, turn, seq, messageId) {
  return {
    kind: 'rp-agent/turn-commit', version: 2, runId, turn,
    assistant: { seq, messageId },
  }
}

async function* textResponse(text) {
  yield { type: 'block-start', index: 0, blockType: 'text' }
  yield { type: 'text-delta', index: 0, text }
  yield { type: 'block-end', index: 0, block: { type: 'text', text } }
  yield { type: 'usage', usage: { inputTokens: 100, outputTokens: 50 } }
  yield { type: 'finish', reason: { kind: 'stop' } }
}
