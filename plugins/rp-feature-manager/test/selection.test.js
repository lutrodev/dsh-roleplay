import assert from 'node:assert/strict'
import test from 'node:test'
import { DEFAULT_ENABLED_FEATURES, DEFAULT_ENABLED_SKILLS, FEATURE_IDS, guidanceSkillsFor } from '../src/catalog.js'
import {
  assertFeatureSelection,
  assertSkillSelection,
  migrateLegacyFeatureSelection,
  normalizeFeatureSelection,
  normalizeSkillSelection,
  toggleFeature,
  toggleSideEffects,
  toggleSkill,
} from '../src/selection.js'

test('enabling MVU closes over character card, lore book, and State prerequisites', () => {
  assert.deepEqual(normalizeFeatureSelection(['compat-mvu']), ['character-card', 'lore-book', 'state', 'compat-mvu'])
  assert.deepEqual(toggleFeature([], 'compat-mvu', true), ['character-card', 'lore-book', 'state', 'compat-mvu'])
})

test('disabling a prerequisite also disables dependants without touching independent features', () => {
  const current = ['character-card', 'lore-book', 'state', 'compat-mvu', 'message-actions']
  assert.deepEqual(toggleFeature(current, 'character-card', false), ['lore-book', 'state', 'message-actions'])
  assert.deepEqual(toggleSideEffects(current, 'character-card', false), ['compat-mvu'])
  assert.deepEqual(toggleFeature(current, 'state', false), ['character-card', 'lore-book', 'message-actions'])
  assert.deepEqual(toggleSideEffects(current, 'state', false), ['compat-mvu'])
})

test('the reply variable card is known, requires State, and is on by default', () => {
  assert.equal(FEATURE_IDS.includes('state-display'), true)
  assert.equal(DEFAULT_ENABLED_FEATURES.includes('state-display'), true)
  assert.deepEqual(normalizeFeatureSelection(['state-display']), ['state', 'state-display'])
  assert.deepEqual(toggleFeature([], 'state-display', true), ['state', 'state-display'])
  assert.deepEqual(toggleFeature(['state', 'state-display'], 'state', false), [])
  assert.deepEqual(toggleSideEffects(['state', 'state-display'], 'state', false), ['state-display'])
})

test('main-model reply options are independent, on for fresh installs, and off for saved old selections', () => {
  assert.equal(FEATURE_IDS.includes('reply-options'), true)
  assert.equal(DEFAULT_ENABLED_FEATURES.includes('reply-options'), true)
  assert.deepEqual(normalizeFeatureSelection(['reply-options']), ['reply-options'])
  assert.deepEqual(toggleFeature([], 'reply-options', true), ['reply-options'])
  const previousDefaults = FEATURE_IDS.filter(id => id !== 'reply-options')
  assert.deepEqual(migrateLegacyFeatureSelection(previousDefaults), previousDefaults)
})

test('selection validation rejects unknown, duplicate, and incomplete input', () => {
  assert.throws(() => assertFeatureSelection(['unknown']), /unknown feature/)
  assert.throws(() => assertFeatureSelection(['persona', 'persona']), /duplicates/)
  assert.throws(() => assertFeatureSelection(['compat-mvu']), /missing required features/)
  assert.deepEqual(assertFeatureSelection(DEFAULT_ENABLED_FEATURES), DEFAULT_ENABLED_FEATURES)
})

test('the pre-optional-State MVU selection migrates without accepting other incomplete selections', () => {
  assert.deepEqual(
    migrateLegacyFeatureSelection(['character-card', 'lore-book', 'compat-mvu']),
    ['character-card', 'lore-book', 'state', 'compat-mvu'],
  )
  assert.throws(() => migrateLegacyFeatureSelection(['lore-book', 'compat-mvu']), /missing required features/)
  assert.throws(() => migrateLegacyFeatureSelection(['compat-mvu']), /missing required features/)
})

test('the previous full feature set adopts compact access mode without changing the saved display choice', () => {
  const previousDefaults = FEATURE_IDS.filter(id => id !== 'state-display' && id !== 'compact-access-mode' && id !== 'reply-options')
  const migratedDefaults = FEATURE_IDS.filter(id => id !== 'state-display' && id !== 'reply-options')
  assert.deepEqual(migrateLegacyFeatureSelection(previousDefaults), migratedDefaults)
  assert.deepEqual(migrateLegacyFeatureSelection(migratedDefaults), migratedDefaults)
  assert.deepEqual(migrateLegacyFeatureSelection(['dialogue-highlight']), ['dialogue-highlight'])
})

test('the retired writer history id is removed without accepting arbitrary unknown features', () => {
  assert.deepEqual(
    migrateLegacyFeatureSelection(['lore-book', 'writer-history', 'message-actions']),
    ['lore-book', 'message-actions'],
  )
  assert.throws(() => migrateLegacyFeatureSelection(['future-feature']), /unknown feature/)
  assert.throws(() => migrateLegacyFeatureSelection(['writer-history', 'writer-history']), /duplicates/)
})

test('Roleplay Skills are independently selected in catalog order', () => {
  assert.deepEqual(normalizeSkillSelection(['rp-guide-state', 'rp-guide-character-card']), [
    'rp-guide-character-card',
    'rp-guide-state',
  ])
  assert.deepEqual(toggleSkill(DEFAULT_ENABLED_SKILLS, 'rp-guide-state', false), DEFAULT_ENABLED_SKILLS.filter(id => id !== 'rp-guide-state'))
  assert.deepEqual(toggleSkill([], 'rp-guide-state', true), ['rp-guide-state'])
})

test('the selected preset guide installs its model-only SillyTavern support guide as one unit', () => {
  assert.deepEqual(guidanceSkillsFor(['preset'], ['rp-guide-preset']), [
    { packageName: 'dsh-roleplay-rp-preset', skillName: 'rp-guide-preset' },
    { packageName: 'dsh-roleplay-rp-preset', skillName: 'rp-guide-preset-sillytavern' },
  ])
  assert.deepEqual(guidanceSkillsFor(['preset'], []), [])
  assert.equal(DEFAULT_ENABLED_SKILLS.includes('rp-guide-preset-sillytavern'), false)
})

test('Roleplay Skill validation rejects unknown and duplicate input', () => {
  assert.throws(() => assertSkillSelection(['unknown']), /unknown Skill/)
  assert.throws(() => assertSkillSelection(['rp-guide-state', 'rp-guide-state']), /duplicates/)
  assert.deepEqual(assertSkillSelection(DEFAULT_ENABLED_SKILLS), DEFAULT_ENABLED_SKILLS)
})
