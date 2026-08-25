import assert from 'node:assert/strict'
import test from 'node:test'
import { createRpMessageActionMetadata } from '../../rp-core/src/conversation.js'
import { RP_SESSION_APPLY_COMMAND, encodeSessionCommand } from 'dsh-roleplay-rp-session/protocol'
import { createNamespaceSnapshot } from '../src/definition.js'
import { applyStateProjectionEvent, emptyStateProjection, stateActivityView } from '../src/index.js'
import { encodeStateCommand, RP_STATE_CONFIGURE_COMMAND } from '../src/protocol.js'
import { applyStateChanges } from '../src/update.js'

const runtime = {
  decodeCommitEvent(event) { return event.data?.error === undefined ? event.data?.meta : undefined },
}

test('replays v2 bootstrap and only successful canonical State updates', () => {
  const seed = bootstrapEvents(0, bootstrapProfile(1, { hp: 10 }))
  const initial = snapshotOf(10)
  const first = effectFrom(initial, [{ op: 'increment', path: '/hp', by: -2, reason: '受伤' }])
  const events = [
    ...seed,
    commitEvent(2, first),
    { seq: 3, type: 'tool/result', surfaceOp: 'append', data: { error: { message: 'failed' }, meta: { effects: [first] } } },
  ]
  const projection = fold(events)
  assert.equal(projection.value.protocolVersion, 2)
  assert.equal(projection.value.namespaces.story.revision, 2)
  assert.deepEqual(projection.value.namespaces.story.value, { hp: 8 })
  assert.deepEqual(projection.value.namespaces.story.initialValue, { hp: 10 })
  assert.equal(projection.entities.length, 1)
})

test('projects the latest active reply changes with before, after, operation, and reason', () => {
  const initialValue = { hp: 10, mood: 'calm', tags: ['known'], note: 'temporary' }
  const stateDefinition = {
    title: '故事状态', updateMode: 'schema-only', rules: [],
    schema: {
      type: 'object',
      properties: {
        hp: { type: 'integer' },
        mood: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        note: { type: 'string' },
      },
      required: ['hp', 'mood', 'tags'],
      additionalProperties: false,
    },
  }
  const snapshot = createNamespaceSnapshot({ initialValue, definition: stateDefinition })
  const profile = {
    revision: 1,
    stateBootstrap: {
      version: 2,
      namespaces: [{ namespace: 'story', initialValue, definition: stateDefinition, diagnostics: { setup: [], lastCommit: [] } }],
    },
  }
  const effect = effectFrom(snapshot, [
    { op: 'increment', path: '/hp', by: -2, reason: '角色受到轻伤' },
    { op: 'set', path: '/mood', value: 'hurt', reason: '疼痛改变了情绪' },
    { op: 'append', path: '/tags', value: 'injured', reason: '记录受伤状态' },
    { op: 'remove', path: '/note', reason: '临时备注已经失效' },
  ])
  const events = [...bootstrapEvents(0, profile), commitEvent(2, effect)]
  assert.deepEqual(stateActivityView(fold(events)), {
    available: true,
    namespaces: {
      story: [
        { op: 'increment', path: '/hp', reason: '角色受到轻伤', before: { exists: true, value: 10 }, after: { exists: true, value: 8 } },
        { op: 'set', path: '/mood', reason: '疼痛改变了情绪', before: { exists: true, value: 'calm' }, after: { exists: true, value: 'hurt' } },
        { op: 'append', path: '/tags', reason: '记录受伤状态', before: { exists: true, value: ['known'] }, after: { exists: true, value: ['known', 'injured'] } },
        { op: 'remove', path: '/note', reason: '临时备注已经失效', before: { exists: true, value: 'temporary' }, after: { exists: false } },
      ],
    },
  })
  assert.deepEqual(stateActivityView(fold([...events, commitEvent(3)])), { available: true, namespaces: {} })
})

test('ordinary Session profile changes do not replay or reset the frozen State bootstrap', () => {
  const first = effectFrom(snapshotOf(10), [{ op: 'increment', path: '/hp', by: -2, reason: '受伤' }])
  const events = [
    ...bootstrapEvents(0, bootstrapProfile(1, { hp: 10 })),
    commitEvent(2, first),
    ...bootstrapEvents(3, { revision: 2, resources: { lorebooks: [] } }, 1),
  ]

  const projection = fold(events)
  assert.equal(projection.value.namespaces.story.revision, 2)
  assert.deepEqual(projection.value.namespaces.story.value, { hp: 8 })
  assert.deepEqual(projection.value.namespaces.story.initialValue, { hp: 10 })
})

test('message delete and reroll retract assistant effects while ordinary replacements preserve them', () => {
  const first = effectFrom(snapshotOf(10), [{ op: 'increment', path: '/hp', by: -1, reason: '轻伤' }])
  const second = effectFrom(first.payload.result, [{ op: 'increment', path: '/hp', by: -4, reason: '重伤' }])
  const base = [...bootstrapEvents(0, bootstrapProfile(1, { hp: 10 })), commitEvent(2, first), commitEvent(3, second)]
  const edited = fold([...base, ordinaryReplacement(4, 3)])
  assert.equal(edited.value.namespaces.story.value.hp, 5)
  assert.deepEqual(edited.entities.map(entity => entity.currentSeq), [2, 4])
  assert.equal(stateActivityView(edited).namespaces.story[0].reason, '重伤')
  const deleted = fold([...base, deleteAction(4, [3], 2, 'delete')])
  assert.equal(deleted.value.namespaces.story.value.hp, 9)
  assert.deepEqual(deleted.entities.map(entity => entity.rootSeq), [2])
  assert.equal(stateActivityView(deleted).namespaces.story[0].reason, '轻伤')
  const rerolled = fold([...base, deleteAction(4, [2, 3], 1, 'reroll')])
  assert.equal(rerolled.value.namespaces.story.value.hp, 10)
  assert.deepEqual(rerolled.entities, [])
  assert.deepEqual(stateActivityView(rerolled), { available: false, namespaces: {} })
})

test('assistant-owned create survives edits, retracts on reroll, and can be recreated', () => {
  const created = createNamespaceSnapshot({ definition: definition(), initialValue: { hp: 10 } })
  const createMutation = { action: 'create', namespace: 'story', expectedRevision: 0, result: created }
  const configured = configurationEvents(0, 'create', createMutation)
  const initial = fold(configured)
  assert.deepEqual(initial.value.namespaces.story.value, { hp: 10 })
  assert.deepEqual(initial.entities, [{
    rootSeq: 3,
    currentSeq: 0,
    value: { kind: 'state.configuration', commandId: 'state-create', mutation: createMutation },
  }])

  const editedEvents = [...configured, ordinaryReplacement(5, 0)]
  const edited = fold(editedEvents)
  assert.deepEqual(edited.value.namespaces.story.value, { hp: 10 })
  assert.equal(edited.entities[0].currentSeq, 5)

  const rerolledEvents = [...editedEvents, deleteAction(6, [5], 1, 'reroll')]
  const rerolled = fold(rerolledEvents)
  assert.deepEqual(rerolled.value.namespaces, {})
  assert.deepEqual(rerolled.entities, [])

  const recreated = createNamespaceSnapshot({ definition: definition(), initialValue: { hp: 99 } })
  const recreatedMutation = { action: 'create', namespace: 'story', expectedRevision: 0, result: recreated }
  const reborn = fold([...rerolledEvents, ...configurationEvents(7, 'recreate', recreatedMutation, { turn: 2 })])
  assert.equal(reborn.value.namespaces.story.revision, 1)
  assert.deepEqual(reborn.value.namespaces.story.value, { hp: 99 })
})

test('update, reset, and delete restore their exact pre-message State when retracted', () => {
  const bootstrap = bootstrapEvents(0, bootstrapProfile(1, { hp: 10 }))
  const updatedSnapshot = { ...snapshotOf(10), revision: 2, value: { hp: 7 } }
  const update = configurationEvents(2, 'update', {
    action: 'update', namespace: 'story', expectedRevision: 1, result: updatedSnapshot,
  })
  assert.equal(fold([...bootstrap, ...update]).value.namespaces.story.value.hp, 7)
  const updateRolledBack = fold([...bootstrap, ...update, deleteAction(7, [2], 1, 'delete')])
  assert.equal(updateRolledBack.value.namespaces.story.revision, 1)
  assert.equal(updateRolledBack.value.namespaces.story.value.hp, 10)

  const injured = effectFrom(snapshotOf(10), [{ op: 'increment', path: '/hp', by: -2, reason: '受伤' }])
  const resetResult = {
    ...injured.payload.result,
    revision: 3,
    value: { hp: 10 },
    diagnostics: { setup: [], lastCommit: [] },
  }
  const reset = configurationEvents(3, 'reset', {
    action: 'reset', namespace: 'story', expectedRevision: 2, result: resetResult,
  })
  const resetBase = [...bootstrap, commitEvent(2, injured), ...reset]
  assert.equal(fold(resetBase).value.namespaces.story.value.hp, 10)
  const resetRolledBack = fold([...resetBase, deleteAction(8, [3], 2, 'delete')])
  assert.equal(resetRolledBack.value.namespaces.story.revision, 2)
  assert.equal(resetRolledBack.value.namespaces.story.value.hp, 8)

  const removed = configurationEvents(2, 'delete', {
    action: 'delete', namespace: 'story', expectedRevision: 1,
  })
  assert.deepEqual(fold([...bootstrap, ...removed]).value.namespaces, {})
  const deleteRolledBack = fold([...bootstrap, ...removed, deleteAction(7, [2], 1, 'delete')])
  assert.equal(deleteRolledBack.value.namespaces.story.revision, 1)
  assert.equal(deleteRolledBack.value.namespaces.story.value.hp, 10)
})

test('configuration and turn commits replay in root order and failed commands own no entity', () => {
  const bootstrap = bootstrapEvents(0, bootstrapProfile(1, { hp: 10 }))
  const injured = effectFrom(snapshotOf(10), [{ op: 'increment', path: '/hp', by: -1, reason: '轻伤' }])
  const configuredSnapshot = { ...injured.payload.result, revision: 3, value: { hp: 7 } }
  const configured = configurationEvents(3, 'update', {
    action: 'update', namespace: 'story', expectedRevision: 2, result: configuredSnapshot,
  })
  const afterConfiguration = fold([...bootstrap, commitEvent(2, injured), ...configured])
  assert.equal(afterConfiguration.value.namespaces.story.revision, 3)
  assert.equal(afterConfiguration.value.namespaces.story.value.hp, 7)
  assert.deepEqual(afterConfiguration.entities.map(entity => entity.value.kind), ['state.turn-commit', 'state.configuration'])

  const failedSnapshot = { ...configuredSnapshot, revision: 4, value: { hp: 6 } }
  const failed = configurationEvents(8, 'failed', {
    action: 'update', namespace: 'story', expectedRevision: 3, result: failedSnapshot,
  }, { kind: 'error', turn: 2 })
  const afterFailure = fold([...bootstrap, commitEvent(2, injured), ...configured, ...failed])
  assert.equal(afterFailure.value.namespaces.story.revision, 3)
  assert.equal(afterFailure.entities.length, 2)
})

test('multiple configurations from one assistant owner retract together', () => {
  const story = { action: 'create', namespace: 'story', expectedRevision: 0, result: snapshotOf(10) }
  const other = { action: 'create', namespace: 'other', expectedRevision: 0, result: snapshotOf(20) }
  const owner = (callId) => ({
    kind: 'assistant-tool', tool: 'rp_state', callId,
    assistant: { seq: 0, messageId: 'assistant-multi', turn: 1, step: 1 },
  })
  const events = [{
    seq: 0, type: 'assistant/message', surfaceOp: 'append',
    data: {
      turn: 1, step: 1,
      message: {
        id: 'assistant-multi', role: 'assistant', source: { kind: 'model' },
        content: [
          { type: 'tool-call', id: 'call-story', name: 'rp_state', arguments: '{}' },
          { type: 'tool-call', id: 'call-other', name: 'rp_state', arguments: '{}' },
        ],
      },
    },
  },
  { seq: 1, type: 'tool/call', data: { turn: 1, step: 1, callId: 'call-story', name: 'rp_state', arguments: '{}' } },
  { seq: 2, type: 'tool/call', data: { turn: 1, step: 1, callId: 'call-other', name: 'rp_state', arguments: '{}' } },
  { seq: 3, type: 'command/run', data: { commandId: 'state-story', name: RP_STATE_CONFIGURE_COMMAND, args: encodeStateCommand(story, owner('call-story')) } },
  { seq: 4, type: 'command/done', data: { commandId: 'state-story', kind: 'success' } },
  { seq: 5, type: 'command/run', data: { commandId: 'state-other', name: RP_STATE_CONFIGURE_COMMAND, args: encodeStateCommand(other, owner('call-other')) } },
  { seq: 6, type: 'command/done', data: { commandId: 'state-other', kind: 'success' } }]
  const configured = fold(events)
  assert.deepEqual(Object.keys(configured.value.namespaces), ['story', 'other'])
  assert.deepEqual(configured.entities.map(entity => entity.currentSeq), [0, 0])
  const removed = fold([...events, deleteAction(7, [0], 1, 'delete')])
  assert.deepEqual(removed.value.namespaces, {})
  assert.deepEqual(removed.entities, [])
})

test('a successful State tool call remains active after turn failure until its reply is removed', () => {
  const created = { action: 'create', namespace: 'story', expectedRevision: 0, result: snapshotOf(10) }
  const configured = configurationEvents(0, 'failed-turn', created)
  const failedTurn = { seq: 5, type: 'turn/end', data: { turn: 1, reason: { kind: 'failed' } } }
  assert.equal(fold([...configured, failedTurn]).value.namespaces.story.value.hp, 10)
  const removed = fold([...configured, failedTurn, failedTurnAction(6, [0], 1, 'reroll')])
  assert.deepEqual(removed.value.namespaces, {})
})

test('a later bootstrap replaces the complete namespace set and prevents old values from returning', () => {
  const first = effectFrom(snapshotOf(10), [{ op: 'increment', path: '/hp', by: -1, reason: '受伤' }])
  const events = [
    ...bootstrapEvents(0, bootstrapProfile(1, { hp: 10 })),
    commitEvent(2, first),
    ...bootstrapEvents(3, { revision: 2, stateBootstrap: { version: 2, namespaces: [] } }, 1),
  ]
  assert.deepEqual(fold(events).value.namespaces, {})
})

test('stores only the latest per-turn diagnostics and clears them on the next successful commit', () => {
  const diagnostic = {
    source: 'rp.state', code: 'STATE_EVERY_TURN_MISSED', severity: 'warning',
    namespace: 'story', ruleId: 'hp-turn', path: '/hp', message: '本轮未检查生命值。',
  }
  const events = [
    ...bootstrapEvents(0, bootstrapProfile(1, { hp: 10 })),
    commitEvent(2, undefined, [diagnostic]),
  ]
  const warned = fold(events)
  assert.deepEqual(warned.value.namespaces.story.diagnostics.lastCommit, [{
    code: 'STATE_EVERY_TURN_MISSED', severity: 'warning', namespace: 'story', ruleId: 'hp-turn', path: '/hp', message: '本轮未检查生命值。',
  }])
  const cleared = fold([...events, commitEvent(3, undefined, [])])
  assert.deepEqual(cleared.value.namespaces.story.diagnostics.lastCommit, [])
})

test('cold rebuild is deterministic and rejects v1 State data instead of migrating it', () => {
  const events = bootstrapEvents(0, bootstrapProfile(1, { hp: 10 }))
  assert.deepEqual(fold(events).value, fold(structuredClone(events)).value)
  const legacyProfile = { revision: 1, initialStateSeeds: [{ namespace: 'scene', value: { hp: 10 } }] }
  const legacy = bootstrapEvents(0, legacyProfile)
  assert.throws(() => fold(legacy), /v1 Session data is unsupported/)
  const patch = {
    kind: 'state.patch', namespace: 'story', expectedRevision: 1,
    payload: { result: { revision: 2, value: { hp: 9 } } },
  }
  assert.throws(() => fold([...events, commitEvent(2, patch)]), /v1 state\.patch events are unsupported/)
  assert.throws(() => fold([...events, {
    seq: 2,
    type: 'command/run',
    data: { commandId: 'legacy-patch', name: 'rp-state-patch', args: ' {}' },
  }]), /v1 rp-state-patch commands are unsupported/)

  const legacyCommand = configurationEvents(2, 'legacy-command', {
    action: 'update', namespace: 'story', expectedRevision: 1,
    result: { ...snapshotOf(10), revision: 2, value: { hp: 9 } },
  })
  legacyCommand[2].data.args = ` ${JSON.stringify({
    version: 2,
    action: 'update',
    namespace: 'story',
    expectedRevision: 1,
    result: { ...snapshotOf(10), revision: 2, value: { hp: 9 } },
  })}`
  const failedLegacyCommand = structuredClone(legacyCommand)
  failedLegacyCommand[3].data.kind = 'error'
  failedLegacyCommand[4].data.error = { code: 'COMMAND_FAILED' }
  assert.equal(fold([...events, ...failedLegacyCommand]).value.namespaces.story.revision, 1)
  assert.throws(() => fold([...events, ...legacyCommand]), /canonical v3 payload/)
})

function definition(updateMode = 'schema-only', rules = []) {
  return {
    title: '故事状态', updateMode,
    schema: { type: 'object', properties: { hp: { type: 'integer', minimum: 0, maximum: 100 } }, required: ['hp'], additionalProperties: false },
    rules,
  }
}

function snapshotOf(hp) {
  return createNamespaceSnapshot({ definition: definition(), initialValue: { hp } })
}

function bootstrapProfile(revision, initialValue) {
  return {
    revision,
    stateBootstrap: {
      version: 2,
      namespaces: [{ namespace: 'story', initialValue, definition: definition(), diagnostics: { setup: [], lastCommit: [] } }],
    },
  }
}

function effectFrom(snapshot, changes) {
  const state = { protocolVersion: 2, revision: 1, namespaces: { story: snapshot } }
  const prepared = applyStateChanges({ state, namespace: 'story', snapshot, changes })
  return {
    kind: 'state.update', namespace: 'story', expectedRevision: snapshot.revision,
    payload: { changes: prepared.changes, result: prepared.result },
  }
}

function bootstrapEvents(start, profile, expectedRevision = 0) {
  return [
    { seq: start, type: 'command/run', data: { commandId: `profile-${start}`, name: RP_SESSION_APPLY_COMMAND, args: encodeSessionCommand(expectedRevision, profile) } },
    { seq: start + 1, type: 'command/done', data: { commandId: `profile-${start}`, kind: 'success' } },
  ]
}

function configurationEvents(start, suffix, mutation, options = {}) {
  const callId = `call-${suffix}`
  const turn = options.turn ?? 1
  const step = options.step ?? 1
  const owner = {
    kind: 'assistant-tool',
    tool: 'rp_state',
    callId,
    assistant: { seq: start, messageId: `assistant-${suffix}`, turn, step },
  }
  return [
    {
      seq: start, type: 'assistant/message', surfaceOp: 'append',
      data: {
        turn, step,
        message: {
          id: `assistant-${suffix}`, role: 'assistant', source: { kind: 'model' },
          content: [{ type: 'tool-call', id: callId, name: 'rp_state', arguments: '{}' }],
        },
      },
    },
    { seq: start + 1, type: 'tool/call', data: { turn, step, callId, name: 'rp_state', arguments: '{}' } },
    { seq: start + 2, type: 'command/run', data: { commandId: `state-${suffix}`, name: RP_STATE_CONFIGURE_COMMAND, args: encodeStateCommand(mutation, owner) } },
    { seq: start + 3, type: 'command/done', data: { commandId: `state-${suffix}`, kind: options.kind ?? 'success' } },
    {
      seq: start + 4, type: 'tool/result', surfaceOp: 'append',
      data: {
        turn, step,
        message: { source: { callId }, content: [] },
        ...((options.kind ?? 'success') === 'success' ? {} : { error: { code: 'COMMAND_FAILED' } }),
      },
    },
  ]
}

function commitEvent(seq, effect, diagnostics = []) {
  return {
    seq, type: 'tool/result', surfaceOp: 'append',
    data: { meta: { effects: effect === undefined ? [] : [effect], diagnostics, turn: seq } },
  }
}

function ordinaryReplacement(seq, sourceSeq) {
  return {
    seq, type: 'tool/result',
    surfaceOp: { op: 'replace', start: sourceSeq, end: sourceSeq },
    sourceEventSeqs: [sourceSeq],
    data: {},
  }
}

function deleteAction(seq, sourceEventSeqs, turn, operation) {
  const targets = sourceEventSeqs.map((source, index) => ({
    kind: 'message', role: 'assistant', messageId: `assistant-${source}`, turn: turn + index, step: 1,
  }))
  const replay = operation === 'reroll'
    ? [{ role: 'user', id: `user-${turn}`, content: [{ type: 'text', text: 'retry' }], source: { kind: 'user' } }]
    : undefined
  return {
    seq, type: 'assistant/message',
    surfaceOp: { op: 'replace', start: sourceEventSeqs[0], end: sourceEventSeqs.at(-1) },
    sourceEventSeqs,
    data: {
      turn, step: 1,
      message: {
        role: 'assistant', id: `action-${seq}`, content: [],
        source: { kind: 'model', provider: 'mock', model: 'mock', rpMessageAction: createRpMessageActionMetadata(operation, targets, replay === undefined ? {} : { replay }) },
      },
    },
  }
}

function failedTurnAction(seq, sourceEventSeqs, turn, operation) {
  const replay = operation === 'reroll'
    ? [{ role: 'user', id: `user-${turn}`, content: [{ type: 'text', text: 'retry' }], source: { kind: 'user' } }]
    : undefined
  return {
    seq, type: 'assistant/message',
    surfaceOp: { op: 'replace', start: sourceEventSeqs[0], end: sourceEventSeqs.at(-1) },
    sourceEventSeqs,
    data: {
      turn, step: 1,
      message: {
        role: 'assistant', id: `failed-action-${seq}`, content: [],
        source: {
          kind: 'model', provider: 'mock', model: 'mock',
          rpMessageAction: createRpMessageActionMetadata(operation, [{ kind: 'turn', turn }], replay === undefined ? {} : { replay }),
        },
      },
    },
  }
}

function fold(events) {
  return events.reduce((state, event) => applyStateProjectionEvent(state, event, runtime), emptyStateProjection())
}
