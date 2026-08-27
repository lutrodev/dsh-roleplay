import assert from 'node:assert/strict'
import test from 'node:test'
import {
  STATE_DISPLAY_ANCHOR_KIND,
  STATE_DISPLAY_RETRACTION_KIND,
  countStateActivity,
  countStateLeaves,
  latestStateDisplayAnchorKey,
  orderedStateEntries,
  presentStatePrimitive,
  stateActivityTransition,
  stateDisplayAnchorNodeDefinition,
  stateDisplayAnchorStart,
  stateDisplayAnchorUpdate,
  stateDisplayRetractionStart,
} from '../src/client-state.js'

test('publishes a completed readable reply after the native turn tail', () => {
  let state = stateDisplayAnchorStart({ data: { turn: 2 } })
  state = stateDisplayAnchorUpdate(state, assistantEvent(12, '门在雨声中打开。'))
  state = stateDisplayAnchorUpdate(state, { type: 'turn/end', seq: 14, data: { turn: 2, reason: { kind: 'completed' } } })
  const node = stateDisplayAnchorNodeDefinition.buildViewNode({ key: 'anchor:2', id: '2', state })
  assert.deepEqual(node, {
    key: 'anchor:2', kind: STATE_DISPLAY_ANCHOR_KIND, id: '2', target: 'chat',
    anchorSeq: 12.11, location: { kind: 'session' }, visibility: 'visible',
    data: { turn: 2, assistantSeq: 12, endSeq: 14 },
  })
})

test('does not publish failed, interrupted, or uncommitted atomic replies', () => {
  let failed = stateDisplayAnchorStart({ data: { turn: 3 } })
  failed = stateDisplayAnchorUpdate(failed, assistantEvent(20, '尚未提交', [{ type: 'tool-call', id: 'commit-3', name: 'rp_commit_turn', arguments: '{}' }]))
  failed = stateDisplayAnchorUpdate(failed, {
    type: 'tool/result', seq: 22, surfaceOp: 'append',
    data: { turn: 3, message: { source: { callId: 'commit-3' }, isError: true } },
  })
  failed = stateDisplayAnchorUpdate(failed, { type: 'turn/end', seq: 23, data: { turn: 3, reason: { kind: 'completed' } } })
  assert.equal(failed.successful, false)
  assert.equal(stateDisplayAnchorNodeDefinition.buildViewNode({ key: 'failed', id: '3', state: failed }), null)

  let interrupted = stateDisplayAnchorStart({ data: { turn: 4 } })
  interrupted = stateDisplayAnchorUpdate(interrupted, assistantEvent(30, '被中断的回复'))
  interrupted = stateDisplayAnchorUpdate(interrupted, { type: 'turn/end', seq: 31, data: { turn: 4, reason: { kind: 'aborted' } } })
  assert.equal(interrupted.successful, false)
})

test('uses the committed assistant as the durable display anchor', () => {
  let state = stateDisplayAnchorStart({ data: { turn: 5 } })
  state = stateDisplayAnchorUpdate(state, assistantEvent(40, '最终正文', [{ type: 'tool-call', id: 'commit-5', name: 'rp_commit_turn', arguments: '{}' }]))
  state = stateDisplayAnchorUpdate(state, {
    type: 'tool/result', seq: 42, surfaceOp: 'append',
    data: { turn: 5, meta: { kind: 'rp-agent/turn-commit', assistant: { seq: 40 } } },
  })
  state = stateDisplayAnchorUpdate(state, { type: 'turn/end', seq: 44, data: { turn: 5, reason: { kind: 'completed' } } })
  assert.equal(state.successful, true)
  assert.equal(state.canonicalAssistantSeq, 40)
})

test('selects one latest anchor and rolls back through delete/reroll carriers', () => {
  const first = anchor('first', 1, 8)
  const second = anchor('second', 2, 18)
  const retraction = {
    key: 'delete-second', kind: STATE_DISPLAY_RETRACTION_KIND,
    data: { seq: 24, replacementStart: 15, removedTurns: [2] },
  }
  const third = anchor('third', 3, 30)
  const nodes = new Map([first, second, retraction, third].map(node => [node.key, node]))
  assert.equal(latestStateDisplayAnchorKey({ order: ['first', 'second'], nodes }), 'second')
  assert.equal(latestStateDisplayAnchorKey({ order: ['first', 'second', 'delete-second'], nodes }), 'first')
  assert.equal(latestStateDisplayAnchorKey({ order: ['first', 'second', 'delete-second', 'third'], nodes }), 'third')
})

test('extracts rollback boundaries from public message-action metadata', () => {
  const state = stateDisplayRetractionStart({
    type: 'assistant/message', seq: 50,
    surfaceOp: { op: 'replace', start: 21, end: 48 },
    data: { message: { source: { rpMessageAction: {
      kind: 'rp-agent/message-action', version: 1, operation: 'delete',
      targets: [{ kind: 'message', role: 'assistant', messageId: 'a', turn: 4 }, { kind: 'turn', turn: 5 }],
    } } } },
  })
  assert.deepEqual(state, { seq: 50, replacementStart: 21, removedTurns: [4, 5] })
})

test('orders and formats the complete State tree from its schema', () => {
  const value = { hp: 7, name: '旅人', extra: true, nested: { mood: '谨慎' } }
  const schema = { properties: { name: {}, nested: {}, hp: {} } }
  assert.deepEqual(orderedStateEntries(value, schema).map(([key]) => key), ['name', 'nested', 'hp', 'extra'])
  assert.equal(countStateLeaves(value), 4)
  assert.deepEqual(presentStatePrimitive(null), { text: '未设置', kind: 'empty', empty: true, long: false })
  assert.deepEqual(presentStatePrimitive(false), { text: '否', kind: 'boolean', empty: false, long: false })
  assert.equal(presentStatePrimitive('长'.repeat(121)).long, true)
})

test('counts activity and derives exact before/after transitions', () => {
  const activity = { available: true, namespaces: { story: [
    { op: 'set', path: '/profile/mood', reason: '情绪变化', before: { exists: true, value: '平静' }, after: { exists: true, value: '谨慎' } },
    { op: 'increment', path: '/hp', reason: '受到伤害', before: { exists: true, value: 10 }, after: { exists: true, value: 7 } },
  ] } }
  assert.equal(countStateActivity(activity), 2)
  assert.deepEqual(stateActivityTransition(activity, 'story', '/hp'), {
    op: 'increment', path: '/hp', reason: '受到伤害',
    before: { exists: true, value: 10 }, after: { exists: true, value: 7 },
  })
  assert.equal(stateActivityTransition(activity, 'story', '/name'), undefined)
  assert.equal(stateActivityTransition({ available: false, namespaces: activity.namespaces }, 'story', '/hp'), undefined)
})

test('maps parent object and array changes only to leaves whose values differ', () => {
  const activity = { available: true, namespaces: { story: [
    {
      op: 'set', path: '/profile', reason: '人物状态更新',
      before: { exists: true, value: { mood: '平静', level: 1 } },
      after: { exists: true, value: { mood: '谨慎', level: 1 } },
    },
    {
      op: 'append', path: '/tags', reason: '添加标签',
      before: { exists: true, value: ['known'] },
      after: { exists: true, value: ['known', 'injured'] },
    },
  ] } }
  assert.deepEqual(stateActivityTransition(activity, 'story', '/profile/mood'), {
    op: 'set', path: '/profile', reason: '人物状态更新',
    before: { exists: true, value: '平静' }, after: { exists: true, value: '谨慎' },
  })
  assert.equal(stateActivityTransition(activity, 'story', '/profile/level'), undefined)
  assert.equal(stateActivityTransition(activity, 'story', '/tags/0'), undefined)
  assert.deepEqual(stateActivityTransition(activity, 'story', '/tags/1'), {
    op: 'append', path: '/tags', reason: '添加标签',
    before: { exists: false }, after: { exists: true, value: 'injured' },
  })
})

function assistantEvent(seq, text, extra = []) {
  return {
    type: 'assistant/message', seq, surfaceOp: 'append',
    data: {
      turn: 1,
      message: { source: { kind: 'model' }, content: [{ type: 'text', text }, ...extra] },
    },
  }
}

function anchor(key, turn, assistantSeq) {
  return { key, kind: STATE_DISPLAY_ANCHOR_KIND, data: { turn, assistantSeq } }
}
