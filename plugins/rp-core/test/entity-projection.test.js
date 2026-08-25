import assert from 'node:assert/strict'
import test from 'node:test'
import { foldCommitBackedEntities, foldSurfaceOwnedEntities } from '../src/entity-projection.js'
import { createRpMessageActionMetadata } from '../src/conversation.js'

function actionCarrier(seq, operation, sources, target, content = [], extra = {}) {
  return {
    seq,
    type: 'assistant/message',
    surfaceOp: { op: 'replace', start: sources[0], end: sources.at(-1) },
    sourceEventSeqs: sources,
    data: {
      turn: 1,
      step: 1,
      message: {
        id: 'assistant-1', role: 'assistant', content,
        source: {
          kind: 'model', provider: 'mock', model: 'mock',
          rpMessageAction: createRpMessageActionMetadata(operation, [target], extra),
        },
      },
    },
  }
}

function commitEvent() {
  return {
    seq: 9,
    type: 'tool/result',
    surfaceOp: 'append',
    data: {
      message: { source: { callId: 'commit-call' }, content: [] },
      meta: {
        kind: 'rp-agent/turn-commit',
        version: 2,
        runId: 'run-1',
        assistant: { seq: 7, messageId: 'assistant-1' },
        extensions: { 'test.extension': { artifactId: 'artifact-1' } },
      },
    },
  }
}

const testExtension = {
  select(commit) {
    return commit.extensions?.['test.extension']
  },
}

test('exposes a reusable commit-backed extension projection lifecycle', () => {
  const committed = foldCommitBackedEntities([], commitEvent(), testExtension)
  assert.equal(committed.changed, true)
  assert.equal(committed.valueChanged, true)
  assert.deepEqual(committed.entities, [{
    rootSeq: 9,
    currentSeq: 9,
    value: { artifactId: 'artifact-1' },
  }])

  const assistantEdit = foldCommitBackedEntities(committed.entities, actionCarrier(
    10,
    'edit',
    [7],
    { kind: 'message', role: 'assistant', messageId: 'assistant-1', turn: 1, step: 1 },
    [{ type: 'text', text: 'edited' }],
  ), testExtension)
  assert.equal(assistantEdit.entities, committed.entities)
  assert.equal(assistantEdit.changed, false)
  assert.equal(assistantEdit.valueChanged, false)

  const pruned = foldCommitBackedEntities(assistantEdit.entities, {
    seq: 11,
    type: 'tool/result',
    surfaceOp: { op: 'replace', start: 9, end: 9 },
    sourceEventSeqs: [9],
    data: commitEvent().data,
  }, testExtension)
  assert.equal(pruned.changed, true)
  assert.equal(pruned.valueChanged, false)
  assert.deepEqual(pruned.entities, [{
    rootSeq: 9,
    currentSeq: 11,
    value: { artifactId: 'artifact-1' },
  }])

  const compacted = foldCommitBackedEntities(pruned.entities, {
    seq: 12,
    type: 'assistant/message',
    surfaceOp: { op: 'replace', start: 10, end: 11 },
    sourceEventSeqs: [10, 11],
    data: {
      turn: 1,
      step: 2,
      message: { id: 'summary', source: { kind: 'model' }, content: [{ type: 'text', text: 'summary' }] },
    },
  }, testExtension)
  assert.equal(compacted.valueChanged, false)
  assert.equal(compacted.entities[0].currentSeq, 12)

  const deleted = foldCommitBackedEntities(compacted.entities, actionCarrier(
    13,
    'delete',
    [12],
    { kind: 'message', role: 'assistant', messageId: 'assistant-1', turn: 1, step: 1 },
  ), testExtension)
  assert.deepEqual(deleted.entities, [])
  assert.deepEqual(deleted.removed, compacted.entities)
  assert.equal(deleted.changed, true)
  assert.equal(deleted.valueChanged, true)

  const rerolled = foldCommitBackedEntities(committed.entities, actionCarrier(
    14,
    'reroll',
    [9],
    { kind: 'turn', turn: 1 },
    [],
    { replay: [{ id: 'replay-1', role: 'user', source: { kind: 'user' }, content: [{ type: 'text', text: 'again' }] }] },
  ), testExtension)
  assert.deepEqual(rerolled.entities, [])
  assert.equal(rerolled.valueChanged, true)
})

test('surface-owned entities can attach later business events to an earlier owner', () => {
  const select = event => event.type === 'command/done' && event.data?.kind === 'success'
    ? { currentSeq: 2, value: { commandId: event.data.commandId } }
    : undefined
  let fold = foldSurfaceOwnedEntities([], {
    seq: 5, type: 'command/done', data: { commandId: 'one', kind: 'success' },
  }, { select })
  fold = foldSurfaceOwnedEntities(fold.entities, {
    seq: 6, type: 'command/done', data: { commandId: 'two', kind: 'success' },
  }, { select })
  assert.deepEqual(fold.entities, [
    { rootSeq: 5, currentSeq: 2, value: { commandId: 'one' } },
    { rootSeq: 6, currentSeq: 2, value: { commandId: 'two' } },
  ])

  const moved = foldSurfaceOwnedEntities(fold.entities, {
    seq: 7,
    type: 'assistant/message',
    surfaceOp: { op: 'replace', start: 2, end: 2 },
    sourceEventSeqs: [2],
    data: { message: { source: { kind: 'model' } } },
  }, { select })
  assert.deepEqual(moved.entities.map(entity => entity.currentSeq), [7, 7])
  assert.equal(moved.valueChanged, false)

  const removed = foldSurfaceOwnedEntities(moved.entities, actionCarrier(
    8,
    'delete',
    [7],
    { kind: 'message', role: 'assistant', messageId: 'assistant-1', turn: 1, step: 1 },
  ), { select })
  assert.deepEqual(removed.entities, [])
  assert.equal(removed.removed.length, 2)
  assert.equal(removed.valueChanged, true)
})
