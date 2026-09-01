import assert from 'node:assert/strict'
import test from 'node:test'

import {
  findHarnessLockfileProblems,
  parseDshDependencyPath,
  resolvedRegistryVersion,
} from './check-harness-compat.mjs'

const dshVersion = '0.1.2-alpha.3'

test('extracts registry versions without peer suffixes and rejects local links', () => {
  assert.equal(resolvedRegistryVersion({ version: `${dshVersion}(@deepseek-ai/cordis@4.0.2)` }), dshVersion)
  assert.equal(resolvedRegistryVersion({ version: 'link:../../../deepseek-harness/packages/core/tools' }), undefined)
})

test('parses DSH package identities from pnpm dependency paths', () => {
  assert.deepEqual(
    parseDshDependencyPath(`@deepseek-ai/dsh-tools@${dshVersion}(@deepseek-ai/cordis@4.0.2)`),
    { name: '@deepseek-ai/dsh-tools', version: dshVersion },
  )
  assert.equal(parseDshDependencyPath('zod@4.4.3'), undefined)
})

test('accepts a lockfile whose importer and transitive DSH graph use the required version', () => {
  const result = findHarnessLockfileProblems({
    exactDshVersion: dshVersion,
    lockfile: fixtureLockfile(),
    manifestRecords: fixtureManifests(),
  })
  assert.deepEqual(result.problems, [])
  assert.equal(result.lockedDshPackageCount, 2)
})

test('reports stale direct, linked, and transitive DSH resolutions', () => {
  const lockfile = fixtureLockfile()
  lockfile.importers['plugins/example'].devDependencies['@deepseek-ai/dsh-tools'].version = 'link:../../../deepseek-harness/packages/core/tools'
  lockfile.packages[`@deepseek-ai/dsh-tools@${dshVersion}`] = undefined
  lockfile.packages['@deepseek-ai/dsh-tools@0.1.2-alpha.1'] = {}

  const result = findHarnessLockfileProblems({
    exactDshVersion: dshVersion,
    lockfile,
    manifestRecords: fixtureManifests(),
  })
  assert.ok(result.problems.some(problem => problem.includes('当前为 link:')))
  assert.ok(result.problems.some(problem => problem.includes('当前为 0.1.2-alpha.1')))
})

function fixtureManifests() {
  return [
    {
      importerId: '.',
      label: 'package.json',
      manifest: { devDependencies: { '@deepseek-ai/dsh': dshVersion } },
    },
    {
      importerId: 'plugins/example',
      label: 'plugins/example/package.json',
      manifest: { devDependencies: { '@deepseek-ai/dsh-tools': dshVersion } },
    },
  ]
}

function fixtureLockfile() {
  return {
    importers: {
      '.': {
        devDependencies: {
          '@deepseek-ai/dsh': { specifier: dshVersion, version: `${dshVersion}(fixture)` },
        },
      },
      'plugins/example': {
        devDependencies: {
          '@deepseek-ai/dsh-tools': { specifier: dshVersion, version: `${dshVersion}(fixture)` },
        },
      },
    },
    packages: {
      [`@deepseek-ai/dsh@${dshVersion}`]: {},
      [`@deepseek-ai/dsh-tools@${dshVersion}`]: {},
      'zod@4.4.3': {},
    },
  }
}
