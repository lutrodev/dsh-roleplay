import assert from 'node:assert/strict'
import test from 'node:test'
import { validateJsonSchemaValue } from '@deepseek-ai/dsh-tools'
import { createNamespaceSnapshot } from '../src/definition.js'
import {
  applyStateChanges,
  stateUpdateArgumentCorrections,
  stateUpdateEffectProtocol,
  stateUpdateEffectSchema,
  stateUpdateOperationProtocol,
  StateUpdateError,
} from '../src/update.js'

test('publishes one strict schema and operation table for all State update paths', () => {
  const schema = stateUpdateEffectSchema()
  assert.equal(schema.additionalProperties, false)
  assert.deepEqual(schema.required, ['kind', 'namespace', 'expectedRevision', 'payload'])
  assert.deepEqual(stateUpdateOperationProtocol(), {
    set: {
      description: 'Replace the value at one path. Pass the new value in "value"; never use "by". Use append instead when adding one item to an existing array.',
      required: ['op', 'path', 'value', 'reason'], optional: ['ruleId'], forbidden: ['by'],
    },
    increment: {
      description: 'Add one finite numeric delta to the number at one path. Pass the delta in "by"; never use "value".',
      required: ['op', 'path', 'by', 'reason'], optional: ['ruleId'], forbidden: ['value'],
    },
    append: {
      description: 'Append exactly one JSON item to an existing array without repeating its current contents. Pass that one item in "value"; never use "by".',
      required: ['op', 'path', 'value', 'reason'], optional: ['ruleId'], forbidden: ['by'],
    },
    remove: {
      description: 'Remove one existing non-root path. Do not pass "value" or "by".',
      required: ['op', 'path', 'reason'], optional: ['ruleId'], forbidden: ['value', 'by'], rootAllowed: false,
    },
  })
  assert.deepEqual(stateUpdateEffectProtocol(), {
    required: ['kind', 'namespace', 'expectedRevision', 'payload'],
    additionalProperties: false,
    payload: {
      required: ['changes'],
      additionalProperties: false,
      changes: { minItems: 1, operations: stateUpdateOperationProtocol() },
    },
  })
  const effect = change => ({
    kind: 'state.update', namespace: 'story', expectedRevision: 1,
    payload: { changes: [change] },
  })
  assert.deepEqual(validateJsonSchemaValue(schema, effect({
    op: 'increment', path: '/score', by: 1, reason: '目标完成',
  }), ''), [])
  assert.ok(validateJsonSchemaValue(schema, effect({
    op: 'increment', path: '/score', value: 1, reason: '错误字段',
  }), '').length > 0)
  assert.ok(validateJsonSchemaValue(schema, effect({
    op: 'append', path: '/history', value: '新增记录',
  }), '').length > 0)
})

test('explains operation-specific nested schema failures without accepting them', () => {
  const effect = {
    kind: 'state.update', namespace: 'story', expectedRevision: 1,
    payload: { changes: [
      { op: 'set', path: '/time', value: '17:40', reason: '时间推进' },
      { op: 'increment', path: '/score', value: 2, reason: '分数增加' },
    ] },
  }
  assert.deepEqual(stateUpdateArgumentCorrections(effect, { path: 'effects[0]' }), [
    '"effects[0].payload.changes[1]" uses op "increment": rename field "value" to "by" without changing its value.',
  ])
  assert.ok(validateJsonSchemaValue(stateUpdateEffectSchema(), effect, '').length > 0)
  assert.deepEqual(stateUpdateArgumentCorrections({
    ...effect,
    payload: { changes: [{ op: 'remove', path: '/obsolete', value: true, reason: '' }] },
  }, { path: 'effects[0]' }), [
    '"effects[0].payload.changes[0].reason" must be a non-empty factual reason.',
    '"effects[0].payload.changes[0]" does not allow "value" when op is "remove".',
  ])
  assert.match(stateUpdateArgumentCorrections({
    ...effect,
    payload: { changes: [{ op: '__proto__', path: '/score', reason: '非法操作名' }] },
  }, { path: 'effects[0]' })[0], /must be exactly one of/)
})

test('applies set, increment, append, and remove atomically without mutating the source', () => {
  const snapshot = makeSnapshot({
    profile: { name: '旧名' }, score: 20, tags: ['known'], obsolete: true,
  }, {
    type: 'object',
    properties: {
      profile: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'], additionalProperties: false },
      score: { type: 'integer', minimum: -100, maximum: 100 },
      tags: { type: 'array', items: { type: 'string' }, maxItems: 3 },
      obsolete: { type: 'boolean' },
    },
    required: ['profile', 'score', 'tags'],
    additionalProperties: false,
  })
  const state = stateOf(snapshot)
  const result = applyStateChanges({
    state, namespace: 'story', snapshot,
    changes: [
      { op: 'set', path: '/profile/name', value: '新名', reason: '角色正式改名' },
      { op: 'increment', path: '/score', by: 2, reason: '完成重要目标' },
      { op: 'append', path: '/tags', value: 'trusted', reason: '获得新的关系标签' },
      { op: 'remove', path: '/obsolete', reason: '旧标记已经失效' },
    ],
  })
  assert.deepEqual(result.result.value, { profile: { name: '新名' }, score: 22, tags: ['known', 'trusted'] })
  assert.equal(result.result.revision, 2)
  assert.deepEqual(snapshot.value, { profile: { name: '旧名' }, score: 20, tags: ['known'], obsolete: true })
  assert.equal(Object.hasOwn(result.changes[0], 'segments'), false)
})

test('supports RFC 6901 escaping and rejects unsafe, root, duplicate, and nested conflicts', () => {
  const snapshot = makeSnapshot({ 'a/b': { 'x~y': 1 }, list: [] }, {
    type: 'object',
    properties: {
      'a/b': { type: 'object', properties: { 'x~y': { type: 'integer' } }, required: ['x~y'], additionalProperties: false },
      list: { type: 'array', items: { type: 'string' } },
    },
    required: ['a/b', 'list'], additionalProperties: false,
  })
  assert.equal(applyStateChanges({
    state: stateOf(snapshot), namespace: 'story', snapshot,
    changes: [{ op: 'increment', path: '/a~1b/x~0y', by: 1, reason: 'escaped path' }],
  }).result.value['a/b']['x~y'], 2)
  for (const changes of [
    [{ op: 'remove', path: '', reason: 'root' }],
    [{ op: 'set', path: '/__proto__/polluted', value: true, reason: 'unsafe' }],
    [
      { op: 'set', path: '/a~1b', value: { 'x~y': 2 }, reason: 'parent' },
      { op: 'increment', path: '/a~1b/x~0y', by: 1, reason: 'child' },
    ],
    [
      { op: 'append', path: '/list', value: 'a', reason: 'first' },
      { op: 'append', path: '/list', value: 'b', reason: 'duplicate' },
    ],
  ]) assert.throws(() => applyStateChanges({ state: stateOf(snapshot), namespace: 'story', snapshot, changes }))
  assert.equal({}.polluted, undefined)
})

test('supports root set, increment, and append while rejecting root removal', () => {
  const numeric = makeSnapshot(2, { type: 'integer', minimum: 0, maximum: 5 })
  assert.equal(applyStateChanges({
    state: stateOf(numeric), namespace: 'story', snapshot: numeric,
    changes: [{ op: 'increment', path: '', by: 2, reason: '整体计数增加' }],
  }).result.value, 4)
  assert.equal(applyStateChanges({
    state: stateOf(numeric), namespace: 'story', snapshot: numeric,
    changes: [{ op: 'set', path: '', value: 5, reason: '整体计数重设' }],
  }).result.value, 5)

  const list = makeSnapshot(['known'], { type: 'array', items: { type: 'string' }, maxItems: 2 })
  assert.deepEqual(applyStateChanges({
    state: stateOf(list), namespace: 'story', snapshot: list,
    changes: [{ op: 'append', path: '', value: 'trusted', reason: '整体列表追加状态' }],
  }).result.value, ['known', 'trusted'])
  assert.throws(() => applyStateChanges({
    state: stateOf(list), namespace: 'story', snapshot: list,
    changes: [{ op: 'remove', path: '', reason: '不能删除整个分区' }],
  }), /root/)
})

test('enforces required reasons, exact operation fields, paths, and final schema as one transaction', () => {
  const snapshot = makeSnapshot({ hp: 2, tags: [] }, {
    type: 'object',
    properties: {
      hp: { type: 'integer', minimum: 0, maximum: 3 },
      tags: { type: 'array', items: { type: 'string' }, maxItems: 1 },
    },
    required: ['hp', 'tags'], additionalProperties: false,
  })
  const state = stateOf(snapshot)
  const cases = [
    [{ op: 'increment', path: '/hp', by: 1, reason: '' }],
    [{ op: 'increment', path: '/hp', by: 1, value: 2, reason: 'unknown field' }],
    [{ op: 'remove', path: '/missing', reason: 'missing' }],
    [{ op: 'append', path: '/hp', value: 1, reason: 'not array' }],
    [{ op: 'increment', path: '/tags', by: 1, reason: 'not number' }],
    [{ op: 'increment', path: '/hp', by: 2, reason: 'schema overflow' }],
    [
      { op: 'increment', path: '/hp', by: 1, reason: 'would pass' },
      { op: 'append', path: '/tags', value: { invalid: true }, reason: 'final schema fails' },
    ],
  ]
  for (const changes of cases) assert.throws(() => applyStateChanges({ state, namespace: 'story', snapshot, changes }))
  assert.throws(() => applyStateChanges({
    state, namespace: 'story', snapshot,
    changes: [{ op: 'increment', path: '/hp', value: 1, reason: '字段写错' }],
  }), error => error.code === 'STATE_CHANGE_UNKNOWN_FIELD'
    && error.feedback.changeIndex === 0
    && error.feedback.unexpectedField === 'value'
    && error.feedback.allowedFields.includes('by'))
  assert.throws(() => applyStateChanges({
    state, namespace: 'story', snapshot,
    changes: [{ op: 'append', path: '/tags', value: 'new' }],
  }), error => error.code === 'STATE_CHANGE_REASON_REQUIRED'
    && error.feedback.changeIndex === 0
    && error.feedback.requiredField === 'reason')
  assert.deepEqual(snapshot.value, { hp: 2, tags: [] })
})

test('enforces rules-required targets, operations, increment ranges, and machine conditions in order', () => {
  const schema = {
    type: 'object',
    properties: { gate: { type: 'boolean' }, score: { type: 'integer', minimum: 0, maximum: 10 } },
    required: ['gate', 'score'], additionalProperties: false,
  }
  const rules = [
    { id: 'open-gate', target: '/gate', when: '剧情打开门时', effect: { op: 'set' }, guidance: [], cadence: 'when-applicable' },
    { id: 'raise-score', target: '/score', when: '门已打开且表现良好时', condition: 'state("story", "/gate") == true', effect: { op: 'increment', minimum: 1, maximum: 3 }, guidance: [], cadence: 'when-applicable' },
  ]
  const snapshot = makeSnapshot({ gate: false, score: 1 }, schema, 'rules-required', rules)
  const state = stateOf(snapshot)
  const accepted = applyStateChanges({
    state, namespace: 'story', snapshot,
    changes: [
      { op: 'set', path: '/gate', value: true, ruleId: 'open-gate', reason: '门锁已经解除' },
      { op: 'increment', path: '/score', by: 2, ruleId: 'raise-score', reason: '完成门后的挑战' },
    ],
  })
  assert.deepEqual(accepted.result.value, { gate: true, score: 3 })
  for (const changes of [
    [{ op: 'increment', path: '/score', by: 1, reason: 'missing rule' }],
    [{ op: 'increment', path: '/score', by: 4, ruleId: 'raise-score', reason: 'too large' }],
    [{ op: 'set', path: '/score', value: 2, ruleId: 'raise-score', reason: 'wrong op' }],
    [{ op: 'increment', path: '/score', by: 1, ruleId: 'open-gate', reason: 'wrong target' }],
    [{ op: 'increment', path: '/score', by: 1, ruleId: 'raise-score', reason: 'condition false' }],
  ]) assert.throws(() => applyStateChanges({ state, namespace: 'story', snapshot, changes }), StateUpdateError)
})

test('reports all independent static rule failures at exact change paths', () => {
  const properties = Object.fromEntries(['a', 'b', 'c', 'd', 'e'].map(key => [key, { type: 'integer' }]))
  const rules = Object.keys(properties).map(key => ({
    id: `raise-${key}`,
    target: `/${key}`,
    when: `raise ${key}`,
    effect: { op: 'increment', minimum: 1, maximum: 3 },
    guidance: [],
    cadence: 'when-applicable',
  }))
  const snapshot = makeSnapshot(
    { a: 0, b: 0, c: 0, d: 0, e: 0 },
    { type: 'object', properties, required: Object.keys(properties), additionalProperties: false },
    'rules-required',
    rules,
  )
  const changes = Object.keys(properties).map((key, index) => ({
    op: 'increment',
    path: `/${key}`,
    by: index === 1 || index === 4 ? 9 : 1,
    ruleId: `raise-${key}`,
    reason: `raise ${key}`,
  }))
  assert.throws(() => applyStateChanges({
    state: stateOf(snapshot), namespace: 'story', snapshot, changes,
  }), error => {
    assert.equal(error.code, 'STATE_UPDATE_VALIDATION_FAILED')
    assert.deepEqual(error.issues.map(issue => issue.path), [
      '/payload/changes/1/by',
      '/payload/changes/4/by',
    ])
    assert.deepEqual(error.issues.map(issue => ({
      namespace: issue.namespace,
      changeIndex: issue.changeIndex,
      ruleId: issue.ruleId,
    })), [
      { namespace: 'story', changeIndex: 1, ruleId: 'raise-b' },
      { namespace: 'story', changeIndex: 4, ruleId: 'raise-e' },
    ])
    assert.deepEqual(error.issues[1].details, {
      namespace: 'story',
      changeIndex: 4,
      ruleId: 'raise-e',
      value: 9,
      maximum: 3,
    })
    return true
  })
})

test('schema-only permits ruleless changes while disabled rejects every model change', () => {
  const schema = { type: 'object', properties: { hp: { type: 'integer' } }, required: ['hp'], additionalProperties: false }
  const enabled = makeSnapshot({ hp: 1 }, schema)
  assert.equal(applyStateChanges({
    state: stateOf(enabled), namespace: 'story', snapshot: enabled,
    changes: [{ op: 'set', path: '/hp', value: 2, reason: 'changed' }],
  }).result.value.hp, 2)
  const disabled = makeSnapshot({ hp: 1 }, schema, 'disabled')
  assert.throws(() => applyStateChanges({
    state: stateOf(disabled), namespace: 'story', snapshot: disabled,
    changes: [{ op: 'set', path: '/hp', value: 2, reason: 'changed' }],
  }), /does not allow/)
})

function makeSnapshot(value, schema, updateMode = 'schema-only', rules = []) {
  return createNamespaceSnapshot({
    initialValue: value,
    definition: { title: '故事状态', updateMode, schema, rules },
  })
}

function stateOf(snapshot) {
  return { protocolVersion: 2, revision: 1, namespaces: { story: snapshot } }
}
