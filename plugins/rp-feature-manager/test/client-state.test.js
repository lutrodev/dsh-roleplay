import assert from 'node:assert/strict'
import test from 'node:test'
import {
  groupedFeatures,
  planFeatureToggle,
  planSkillToggle,
  promptPreview,
  setRoleplaySetting,
  skillAvailability,
  toggleAnnouncement,
  unsetRoleplaySetting,
} from '../src/client-state.js'
import { featureById, roleplaySkillById } from '../src/catalog.js'

test('settings catalog uses the three product categories without exposing package installation', () => {
  assert.deepEqual(groupedFeatures().map(group => group.category), ['materials', 'creation', 'conversation'])
  const plan = planFeatureToggle([], 'compat-mvu', true)
  assert.deepEqual(plan.enabledFeatures, ['character-card', 'lore-book', 'state', 'compat-mvu'])
  assert.match(toggleAnnouncement(featureById('compat-mvu'), true, plan.sideEffects), /同时启用角色卡、世界书、会话变量/)
})

test('Skill selection remains independent while availability follows its plugin', () => {
  const skill = roleplaySkillById('rp-guide-state')
  assert.deepEqual(planSkillToggle(['rp-guide-state'], 'rp-guide-state', false), [])
  assert.equal(skillAvailability(skill, [], ['rp-guide-state']), 'plugin-disabled')
  assert.equal(skillAvailability(skill, ['state'], []), 'disabled')
  assert.equal(skillAvailability(skill, ['state'], ['rp-guide-state']), 'enabled')
})

test('prompt preview uses the dedicated read-only Roleplay endpoint', async () => {
  const connection = {
      async call(path, endpoint, payload) {
        assert.equal(path, '/rp-features')
        assert.equal(endpoint, 'prompts')
        assert.deepEqual(payload, {})
        return { ok: true, value: { ok: true, value: { version: 1, profiles: [] } } }
      },
  }
  assert.deepEqual(await promptPreview(connection), { version: 1, profiles: [] })
})

test('Roleplay setting writes use the suite RPC with revision guards', async () => {
  const calls = []
  const connection = {
      async call(path, endpoint, payload) {
        calls.push({ path, endpoint, payload })
        return { ok: true, value: { ok: true, value: { settings: { writable: true, revision: 4 } } } }
      },
  }
  assert.deepEqual(
    await setRoleplaySetting(connection, 'enabledFeatures', ['state'], 2),
    { settings: { writable: true, revision: 4 } },
  )
  await unsetRoleplaySetting(connection, 'harnessIdentity', 4)
  assert.deepEqual(calls, [
    {
      path: '/rp-features', endpoint: 'settings/set',
      payload: { field: 'enabledFeatures', value: ['state'], expectedRevision: 2 },
    },
    {
      path: '/rp-features', endpoint: 'settings/unset',
      payload: { field: 'harnessIdentity', expectedRevision: 4 },
    },
  ])
})
