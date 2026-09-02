import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveSessionToolCall, snapshotSessionEvents } from '../src/session-runtime.js'

test('snapshots Session events and correlates one native model tool owner', () => {
  const events = [
    {
      seq: 0,
      type: 'assistant/message',
      data: {
        turn: 2,
        step: 1,
        message: {
          source: { kind: 'model' },
          content: [{ type: 'tool-call', id: 'commit-1', name: 'rp_commit_turn', arguments: '{}' }],
        },
      },
    },
    { seq: 1, type: 'tool/call', data: { turn: 2, step: 1, callId: 'commit-1', name: 'rp_commit_turn' } },
  ]
  const session = { snapshotEvents: () => events }
  assert.equal(snapshotSessionEvents(session), events)
  const resolved = resolveSessionToolCall(session, {
    name: 'rp_commit_turn', callId: 'commit-1', turn: 2,
  })
  assert.equal(resolved.call, events[1])
  assert.deepEqual(resolved.assistants, [events[0]])
  assert.deepEqual(resolveSessionToolCall(session, {
    name: 'rp_commit_turn', callId: 'missing', turn: 2,
  }).assistants, [])
})

test('fails loudly when the pinned Session event surface changes shape', () => {
  assert.throws(() => snapshotSessionEvents({}), /snapshotEvents/)
  assert.throws(() => snapshotSessionEvents({ snapshotEvents: () => ({}) }), /must return an array/)
})
