import assert from 'node:assert/strict'
import test from 'node:test'
import { compareVersions, parseVersion, satisfiesVersion } from '../src/version.js'

test('semantic versions compare prereleases before the stable release', () => {
  assert.ok(compareVersions('0.1.1-rc.2', '0.1.1') < 0)
  assert.ok(compareVersions('0.1.1-rc.10', '0.1.1-rc.2') > 0)
  assert.equal(compareVersions('0.1.1+build.1', '0.1.1+build.2'), 0)
  assert.equal(parseVersion('not-a-version'), undefined)
})

test('caret compatibility respects the narrow zero-major release line', () => {
  assert.equal(satisfiesVersion('0.1.1-rc.2', '^0.1.1-rc.2'), true)
  assert.equal(satisfiesVersion('0.1.1', '^0.1.1-rc.2'), true)
  assert.equal(satisfiesVersion('0.1.9', '^0.1.1-rc.2'), true)
  assert.equal(satisfiesVersion('0.2.0', '^0.1.1-rc.2'), false)
  assert.equal(satisfiesVersion('0.1.0', '^0.1.1-rc.2'), false)
  assert.equal(satisfiesVersion('0.1.1', 'not-a-range'), false)
})
