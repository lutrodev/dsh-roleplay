import assert from 'node:assert/strict'
import test from 'node:test'
import { apply as applyBridge } from '../src/bridge.js'
import {
  activeConversationSummaries,
  conversationSummaryContext,
} from '../src/summary-source.js'

test('summary Slot follows active checkpoint order and ignores inactive summary events', () => {
  const session = fixture([
    checkpoint(1, 'second'),
    checkpoint(3, 'first'),
  ], [
    summary(0, 'first', '第一份总结'),
    summary(2, 'second', '第二份总结'),
    summary(4, 'inactive', '不应出现'),
  ], [1, 3])
  const active = activeConversationSummaries(session)
  assert.deepEqual(active.map(item => item.compactionId), ['second', 'first'])
  assert.deepEqual(active.map(item => item.summarySeq), [2, 0])
  const context = conversationSummaryContext(session)
  assert.equal(context.text, '第二份总结\n\n---\n\n第一份总结')
  assert.deepEqual(context.diagnostics.checkpoints.map(item => item.checkpointSeq), [1, 3])
})

test('summary Slot is absent with no active checkpoint and fails closed on broken correlation', () => {
  assert.equal(conversationSummaryContext(fixture([], [], [])), undefined)
  assert.throws(
    () => conversationSummaryContext(fixture([checkpoint(0, 'missing')], [], [0])),
    /no matching summary event/,
  )
})

test('bridge registers one movable required factual native-history source immediately before conversation history', () => {
  let definition
  applyBridge({
    rpRuntime: { registerContextSource(value) { definition = value } },
  })
  assert.equal(definition.id, 'rp.conversation-summary')
  assert.equal(definition.promptCategory, 'factual')
  assert.equal(definition.delivery, 'native-history')
  assert.equal(definition.required, true)
  assert.equal(definition.pretransformed, true)
  assert.equal(definition.idleAllowed, false)
  assert.deepEqual(definition.defaultSlot, {
    id: 'conversation-summary', label: '会话总结', order: -1,
  })
  assert.equal(definition.prepare({ agent: { session: fixture([], [], []) } }), undefined)
  const prepared = definition.prepare({ agent: { session: fixture(
    [checkpoint(1, 'active')],
    [summary(0, 'active', '较早剧情。')],
    [1],
  ) } })
  assert.equal(prepared.text, '[Context note: A compressed record of earlier conversation for continuity. Newer Conversation History takes precedence.]\n\n较早剧情。')
})

function fixture(checkpoints, summaries, nodes) {
  const events = []
  for (const event of [...checkpoints, ...summaries]) events[event.seq] = event
  return {
    surface: { nodes },
    get seq() { return events.length },
    snapshotEvents() { return events },
    eventAt(seq) { return events[seq] },
  }
}

function checkpoint(seq, compactionId) {
  return {
    seq,
    type: 'user/message',
    data: {
      role: 'user', id: `checkpoint-${compactionId}`, content: [{ type: 'text', text: 'framed' }],
      source: { kind: 'plugin', plugin: 'compact', compactionId },
    },
  }
}

function summary(seq, compactionId, text) {
  return {
    seq,
    type: 'compaction/summary',
    data: { compactionId, summary: [{ type: 'text', text }] },
  }
}
