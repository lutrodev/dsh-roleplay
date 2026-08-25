import assert from 'node:assert/strict'
import test from 'node:test'
import { compileStateCondition, evaluateStateCondition } from '../src/condition.js'
import { normalizeStateBootstrap, normalizeStateDefinition } from '../src/definition.js'
import { normalizeStateSchema, validateStateValue } from '../src/schema.js'

test('accepts the restricted schema subset, nullable values, and exact boundaries', () => {
  const schema = normalizeStateSchema({
    type: 'object',
    title: 'Story',
    properties: {
      score: { type: ['integer', 'null'], minimum: -100, maximum: 100 },
      tags: { type: 'array', items: { type: 'string', minLength: 1, maxLength: 4 }, minItems: 1, maxItems: 2 },
      phase: { type: 'string', enum: ['new', 'known'] },
      locked: { const: true },
    },
    required: ['score', 'tags', 'phase', 'locked'],
    additionalProperties: false,
  })
  assert.deepEqual(validateStateValue(schema, { score: null, tags: ['四字以内'], phase: 'new', locked: true }), {
    score: null, tags: ['四字以内'], phase: 'new', locked: true,
  })
  assert.equal(validateStateValue(schema, { score: -100, tags: ['a', '四字以内'], phase: 'known', locked: true }).score, -100)
  assert.equal(validateStateValue(schema, { score: 100, tags: ['a'], phase: 'known', locked: true }).score, 100)
  assert.throws(() => validateStateValue(schema, { score: 101, tags: ['a'], phase: 'known', locked: true }), /above/)
  assert.throws(() => validateStateValue(schema, { score: 1, tags: [], phase: 'known', locked: true }), /fewer/)
  assert.throws(() => validateStateValue(schema, { score: 1, tags: ['abcde'], phase: 'known', locked: true }), /longer/)
  assert.throws(() => validateStateValue(schema, { score: 1, tags: ['a'], phase: 'other', locked: true }), /allowed/)
  assert.throws(() => validateStateValue(schema, { score: 1, tags: ['a'], phase: 'new', locked: false }), /constant/)
})

test('rejects unsupported and unknown schema keywords and inconsistent required fields', () => {
  for (const schema of [
    { $ref: '#/$defs/value' },
    { oneOf: [{ type: 'string' }] },
    { if: { type: 'string' } },
    { type: 'string', pattern: '^x' },
    { type: 'number', multipleOf: 2 },
    { type: 'object', properties: {}, required: ['missing'] },
    { type: 'object', properties: { constructor: { type: 'string' } } },
    { type: 'object', required: ['__proto__'] },
  ]) assert.throws(() => normalizeStateSchema(schema), /unsupported|undefined property|unsafe|unique strings/)
  assert.throws(() => normalizeStateSchema({ type: ['string', 'string'] }), /unique/)
  assert.throws(() => normalizeStateSchema({ type: 'number', minimum: 2, maximum: 1 }), /cannot exceed/)
})

test('validates complete definitions, rules, initial values, and bootstrap version', () => {
  const definition = normalizeStateDefinition({
    title: '故事状态',
    description: '持续变量',
    updateMode: 'rules-required',
    schema: { type: 'object', properties: { hp: { type: 'integer', minimum: 0, maximum: 10 } }, required: ['hp'], additionalProperties: false },
    rules: [{
      id: 'hp-change', target: '/hp', when: '生命值发生变化',
      effect: { op: 'increment', minimum: -3, maximum: 2 }, guidance: ['按剧情判断'], cadence: 'when-applicable',
    }],
  })
  assert.equal(definition.rules[0].id, 'hp-change')
  assert.deepEqual(normalizeStateBootstrap({
    version: 2,
    namespaces: [{ namespace: 'story', initialValue: { hp: 10 }, definition, diagnostics: { setup: [], lastCommit: [] } }],
  }).namespaces[0].initialValue, { hp: 10 })
  assert.throws(() => normalizeStateBootstrap({ version: 1, namespaces: [] }), /version must be 2/)
  assert.throws(() => normalizeStateBootstrap({
    version: 2,
    namespaces: [{ namespace: 'story', initialValue: { hp: 11 }, definition, diagnostics: { setup: [], lastCommit: [] } }],
  }), /above/)
  assert.throws(() => normalizeStateDefinition({ ...definition, rules: [...definition.rules, definition.rules[0]] }), /duplicate/)
  assert.throws(() => normalizeStateDefinition({ ...definition, updateMode: 'automatic' }), /updateMode/)
})

test('parses and evaluates only the safe State condition language', () => {
  const state = {
    namespaces: {
      story: { value: { characters: { '李/钰': { affection: 51 } }, route: 'known', flag: true } },
      combat: { value: { danger: 2 } },
    },
  }
  const expression = compileStateCondition('state("story", "/characters/李~1钰/affection") > 50 && exists("combat", "/danger") && !exists("story", "/missing")')
  assert.deepEqual(evaluateStateCondition(expression, state), { value: true, diagnostics: [] })
  assert.equal(evaluateStateCondition('state("story", "/route") == "known" || state("combat", "/danger") >= 3', state).value, true)
  assert.equal(evaluateStateCondition('state("story", "/flag") != false', state).value, true)
  const missing = evaluateStateCondition('state("story", "/missing") == 1', state)
  assert.equal(missing.value, false)
  assert.equal(missing.diagnostics[0].code, 'STATE_CONDITION_MISSING')
  const wrongType = evaluateStateCondition('state("story", "/route") > 1', state)
  assert.equal(wrongType.value, false)
  assert.equal(wrongType.diagnostics[0].code, 'STATE_CONDITION_INVALID')
  for (const invalid of [
    'state.story.affection > 50',
    'Math.max(1, 2) > 1',
    'state("story", "/route") + 1 > 2',
    'state("story", "/route").length > 2',
    'unknown("story", "/route")',
    'state("Story", "/route") == "known"',
    'exists("__proto__", "")',
  ]) assert.throws(() => compileStateCondition(invalid))
})

test('bounds complete State conditions', () => {
  assert.throws(() => compileStateCondition('true || '.repeat(600) + 'false'), /exceeds/)
})
