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
  assert.equal(satisfiesVersion('0.1.2-alpha.1', '^0.1.2-alpha.1'), true)
  assert.equal(satisfiesVersion('0.1.2-alpha.2', '^0.1.2-alpha.1'), true)
  assert.equal(satisfiesVersion('0.1.2', '^0.1.2-alpha.1'), true)
  assert.equal(satisfiesVersion('0.1.3-beta.1', '^0.1.2-alpha.1'), false)
  assert.equal(satisfiesVersion('0.1.9', '^0.1.2-alpha.1'), true)
  assert.equal(satisfiesVersion('0.2.0', '^0.1.2-alpha.1'), false)
  assert.equal(satisfiesVersion('0.1.1', '^0.1.2-alpha.1'), false)
  assert.equal(satisfiesVersion('0.1.2', 'not-a-range'), false)
})

test('exact prerelease compatibility admits only the pinned Harness build', () => {
  assert.equal(satisfiesVersion('0.1.2-alpha.1', '0.1.2-alpha.1'), true)
  assert.equal(satisfiesVersion('0.1.2-alpha.2', '0.1.2-alpha.1'), false)
  assert.equal(satisfiesVersion('0.1.2', '0.1.2-alpha.1'), false)
})
