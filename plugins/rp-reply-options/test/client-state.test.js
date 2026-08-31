import assert from 'node:assert/strict'
import test from 'node:test'
import {
  latestReplyOptionsAnchorKey,
  REPLY_OPTIONS_ANCHOR_KIND,
  REPLY_OPTIONS_RETRACTION_KIND,
  replyOptionsAnchorMatch,
  replyOptionsAnchorNodeDefinition,
  replyOptionsAnchorStart,
  replyOptionsAnchorUpdate,
  replyOptionsRetractionStart,
} from '../src/client-state.js'

const options = ['熙雯伸手推开门，谨慎地走进去。', '她先从窗边观察里面的动静。', '熙雯回头寻找能帮忙的同伴。']

test('publishes canonical options below the variable card after one successful committed turn', () => {
  let state = replyOptionsAnchorStart({ data: { turn: 2 } })
  state = replyOptionsAnchorUpdate(state, assistantEvent(12, [{ type: 'tool-call', id: 'commit-2', name: 'rp_commit_turn', arguments: '{}' }]))
  state = replyOptionsAnchorUpdate(state, commitEvent(14, 12, { version: 1, options }))
  state = replyOptionsAnchorUpdate(state, { type: 'turn/end', seq: 15, data: { turn: 2, reason: { kind: 'completed' } } })
  assert.deepEqual(replyOptionsAnchorNodeDefinition.buildViewNode({ key: 'choices:2', id: '2', state }), {
    key: 'choices:2', kind: REPLY_OPTIONS_ANCHOR_KIND, id: '2', target: 'chat',
    anchorSeq: 12.12, location: { kind: 'session' }, visibility: 'visible',
    data: { version: 1, turn: 2, assistantSeq: 12, endSeq: 15, options },
  })
})

test('publishes a single configured option without changing the event projection shape', () => {
  const one = [options[0]]
  let state = replyOptionsAnchorStart({ data: { turn: 7 } })
  state = replyOptionsAnchorUpdate(state, commitEvent(52, 50, { version: 1, options: one }))
  state = replyOptionsAnchorUpdate(state, { type: 'turn/end', seq: 53, data: { turn: 7, reason: { kind: 'completed' } } })
  assert.deepEqual(replyOptionsAnchorNodeDefinition.buildViewNode({ key: 'choices:7', id: '7', state })?.data.options, one)
})

test('hides failed, interrupted, missing, and malformed extension results', () => {
  for (const stored of [undefined, { version: 2, options }, { version: 1, options: [] }, { version: 1, options: [...options, '四', '五', '六'] }]) {
    let state = replyOptionsAnchorStart({ data: { turn: 3 } })
    state = replyOptionsAnchorUpdate(state, assistantEvent(20, [{ type: 'tool-call', id: 'commit-3', name: 'rp_commit_turn', arguments: '{}' }]))
    state = replyOptionsAnchorUpdate(state, commitEvent(22, 20, stored))
    state = replyOptionsAnchorUpdate(state, { type: 'turn/end', seq: 23, data: { turn: 3, reason: { kind: 'completed' } } })
    assert.equal(replyOptionsAnchorNodeDefinition.buildViewNode({ key: 'invalid', id: '3', state }), null)
  }

  let failed = replyOptionsAnchorStart({ data: { turn: 4 } })
  failed = replyOptionsAnchorUpdate(failed, {
    type: 'tool/result', seq: 30, surfaceOp: 'append',
    data: { turn: 4, message: { isError: true }, meta: { kind: 'rp-agent/turn-commit' } },
  })
  failed = replyOptionsAnchorUpdate(failed, { type: 'turn/end', seq: 31, data: { turn: 4, reason: { kind: 'completed' } } })
  assert.equal(failed.successful, false)

  let interrupted = replyOptionsAnchorStart({ data: { turn: 5 } })
  interrupted = replyOptionsAnchorUpdate(interrupted, commitEvent(40, 38, { version: 1, options }))
  interrupted = replyOptionsAnchorUpdate(interrupted, { type: 'turn/end', seq: 41, data: { turn: 5, reason: { kind: 'aborted' } } })
  assert.equal(interrupted.successful, false)

  let ordinary = replyOptionsAnchorStart({ data: { turn: 6 } })
  ordinary = replyOptionsAnchorUpdate(ordinary, assistantEvent(44, []))
  ordinary = replyOptionsAnchorUpdate(ordinary, { type: 'turn/end', seq: 45, data: { turn: 6, reason: { kind: 'completed' } } })
  assert.equal(replyOptionsAnchorNodeDefinition.buildViewNode({ key: 'ordinary', id: '6', state: ordinary }), null)
  assert.equal(replyOptionsAnchorMatch({
    type: 'assistant/message', seq: 1,
    data: { message: { source: { kind: 'model' }, content: [{ type: 'text', text: '开场白' }] } },
  }), null)
})

test('keeps only the latest actionable anchor and clears choices after a user or steering message', () => {
  const first = anchor('first', 1, 8)
  const user = { key: 'user-2', kind: 'user' }
  const second = anchor('second', 2, 18)
  const steering = { key: 'steering-3', kind: 'steering' }
  const nodes = new Map([first, user, second, steering].map(node => [node.key, node]))
  assert.equal(latestReplyOptionsAnchorKey({ order: ['first'], nodes }), 'first')
  assert.equal(latestReplyOptionsAnchorKey({ order: ['first', 'user-2'], nodes }), undefined)
  assert.equal(latestReplyOptionsAnchorKey({ order: ['first', 'user-2', 'second'], nodes }), 'second')
  assert.equal(latestReplyOptionsAnchorKey({ order: ['first', 'user-2', 'second', 'steering-3'], nodes }), undefined)
})

test('retracts edited, deleted, and rerolled reply owners and can reveal the prior valid anchor', () => {
  for (const operation of ['edit', 'delete', 'reroll']) {
    const state = replyOptionsRetractionStart({
      type: 'assistant/message', seq: 50,
      surfaceOp: { op: 'replace', start: 21, end: 48 },
      data: { message: { source: { rpMessageAction: {
        kind: 'rp-agent/message-action', version: 1, operation,
        targets: [{ kind: 'message', role: 'assistant', messageId: 'a', turn: 4 }],
      } } } },
    })
    assert.deepEqual(state, { seq: 50, replacementStart: 21, removedTurns: [4] })
  }

  const first = anchor('first', 1, 8)
  const second = anchor('second', 4, 24)
  const retraction = {
    key: 'edit-second', kind: REPLY_OPTIONS_RETRACTION_KIND,
    data: { seq: 50, replacementStart: 21, removedTurns: [4] },
  }
  const nodes = new Map([first, second, retraction].map(node => [node.key, node]))
  assert.equal(latestReplyOptionsAnchorKey({ order: ['first', 'second', 'edit-second'], nodes }), 'first')
  assert.equal(latestReplyOptionsAnchorKey({ order: ['first'], nodes }), 'first')
})

function assistantEvent(seq, extra) {
  return {
    type: 'assistant/message', seq, surfaceOp: 'append',
    data: { turn: 2, message: { source: { kind: 'model' }, content: [{ type: 'text', text: '正文' }, ...extra] } },
  }
}

function commitEvent(seq, assistantSeq, stored) {
  return {
    type: 'tool/result', seq, surfaceOp: 'append',
    data: {
      turn: 2,
      message: { isError: false },
      meta: {
        kind: 'rp-agent/turn-commit', assistant: { seq: assistantSeq },
        extensions: stored === undefined ? {} : { 'rp.reply-options': stored },
      },
    },
  }
}

function anchor(key, turn, assistantSeq) {
  return { key, kind: REPLY_OPTIONS_ANCHOR_KIND, data: { turn, assistantSeq } }
}
