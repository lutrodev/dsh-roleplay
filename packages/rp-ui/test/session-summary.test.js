import assert from 'node:assert/strict'
import test from 'node:test'
import { isRoleplaySessionSummary } from '../src/session-summary.js'

test('reads the Roleplay preset from DSH projection-backed SessionSummary values', () => {
  assert.equal(isRoleplaySessionSummary({
    projectionValues: { agentPreset: 'roleplay' },
  }), true)
  assert.equal(isRoleplaySessionSummary({
    projectionValues: { agentPreset: 'standard' },
  }), false)
  assert.equal(isRoleplaySessionSummary({ agentPreset: 'roleplay' }), false)
  assert.equal(isRoleplaySessionSummary(undefined), false)
})
