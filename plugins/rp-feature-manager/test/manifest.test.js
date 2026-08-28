import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import test from 'node:test'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CORE_PACKAGES, DEFAULT_ENABLED_FEATURES, FEATURE_CATALOG, ROLEPLAY_SKILL_CATALOG, ROLEPLAY_SUITE_VERSION, SUPPORTED_DSH_RANGE } from '../src/catalog.js'

const pluginDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pluginsDirectory = resolve(pluginDirectory, '..')
const packagesDirectory = resolve(pluginsDirectory, '..', 'packages')
const V0_1_5_NEW_ENTRY_IDS = ['rp-quick-replies', 'rp-state-display', 'rp-compact-access-mode']

function patchEntry(patch, id) {
  const marker = `    - id: ${id}\n`
  const start = patch.indexOf(marker)
  assert.notEqual(start, -1, `missing patch entry ${id}`)
  const end = patch.indexOf('\n    - id: ', start + marker.length)
  return patch.slice(start, end === -1 ? patch.length : end)
}

test('feature manager is the suite bundle and carries every managed Roleplay package', async () => {
  const manifest = JSON.parse(await readFile(resolve(pluginDirectory, 'package.json'), 'utf8'))
  const standard = JSON.parse(await readFile(resolve(pluginsDirectory, 'rp-standard/package.json'), 'utf8'))
  const patch = await readFile(resolve(pluginDirectory, 'cordis.patch.yml'), 'utf8')

  assert.equal(manifest.dsh.bundle.patch, './cordis.patch.yml')
  assert.equal(manifest.dsh.roleplay.suiteVersion, ROLEPLAY_SUITE_VERSION)
  assert.equal(manifest.dsh.roleplay.requiresDsh, SUPPORTED_DSH_RANGE)
  assert.equal(standard.dsh?.bundle, undefined)
  assert.match(patch, /id: rp-feature-manager[\s\S]*?id: rp-standard/)
  assert.match(patch, /id: rp-standard[\s\S]*?inject:\s+- rpFeatures/)
  assert.match(patchEntry(patch, 'rp-feature-manager'), /inject:\s+- settings/)
  const stateDisplayEntry = patchEntry(patch, 'rp-state-display')
  assert.match(stateDisplayEntry, /name: dsh-roleplay-rp-state-display/)
  assert.match(stateDisplayEntry, /disabled: true/)
  assert.equal(DEFAULT_ENABLED_FEATURES.includes('state-display'), true)
  assert.match(patch.match(/enabledFeatures:([\s\S]*?)enabledSkills:/)?.[1] ?? '', /- state-display/)
  for (const entryId of V0_1_5_NEW_ENTRY_IDS) {
    assert.match(patchEntry(patch, entryId), /disabled: true/, `${entryId} must start parked`)
  }
  for (const entryId of FEATURE_CATALOG
    .flatMap(feature => feature.hostEntryIds)
    .filter(entryId => !V0_1_5_NEW_ENTRY_IDS.includes(entryId))) {
    assert.doesNotMatch(patchEntry(patch, entryId), /disabled:/, `${entryId} must keep its existing activation path`)
  }

  const managedPackages = new Set([
    ...CORE_PACKAGES.map(item => item.packageName),
    ...FEATURE_CATALOG.map(item => item.packageName),
  ])
  managedPackages.delete(manifest.name)
  for (const packageName of managedPackages) {
    assert.equal(typeof manifest.dependencies[packageName], 'string', `${packageName} must ship with the suite bundle`)
  }
  assert.deepEqual(
    CORE_PACKAGES.find(item => item.packageName === 'dsh-roleplay-rp-conversation-summary'),
    { packageName: 'dsh-roleplay-rp-conversation-summary', label: '会话总结', description: '压缩较早的对话，并向 Writer 提供独立的会话总结。' },
  )
})

test('all Roleplay packages stay on the declared suite version', async () => {
  for (const workspaceDirectory of [packagesDirectory, pluginsDirectory]) {
    for (const entry of await readdir(workspaceDirectory, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      let manifest
      try {
        manifest = JSON.parse(await readFile(resolve(workspaceDirectory, entry.name, 'package.json'), 'utf8'))
      } catch (error) {
        if (error?.code === 'ENOENT') continue
        throw error
      }
      assert.equal(manifest.version, ROLEPLAY_SUITE_VERSION, `${manifest.name} version drifted from the suite`)
    }
  }
})

test('every Roleplay browser API uses the shared typed Remote boundary', async () => {
  let registrations = 0
  for (const entry of await readdir(pluginsDirectory, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    let source
    try {
      source = await readFile(resolve(pluginsDirectory, entry.name, 'src/index.js'), 'utf8')
    } catch (error) {
      if (error?.code === 'ENOENT') continue
      throw error
    }
    assert.doesNotMatch(source, /\.rpc\.handle\(/, `${entry.name} must not use the removed browser RPC API`)
    assert.doesNotMatch(source, /authority:\s*['"](?:loopback|trusted-host)['"]/, `${entry.name} must not carry legacy RPC authority options`)
    registrations += source.match(/ctx\.rpRemote\.register\(/g)?.length ?? 0
  }
  assert.equal(registrations, 10)
})

test('settings UI presents activation instead of package acquisition', async () => {
  const client = await readFile(resolve(pluginDirectory, 'src/client.js'), 'utf8')
  assert.match(client, /启用只控制是否加载/)
  assert.match(client, /role: 'switch'/)
  assert.match(client, /`\$\{checked \? '停用' : '启用'\}/)
  assert.match(client, /ctx\.slots\.inject\('settings\.section'/)
  assert.match(client, /id: 'roleplay'/)
  assert.match(client, /order: 25/)
  assert.doesNotMatch(client, /settings\.plugins\.tab/)
  assert.match(client, /role: 'tablist'/)
  assert.match(client, /TAB_IDS = Object\.freeze\(\['features', 'skills', 'prompts'\]\)/)
  assert.match(client, /promptsTab: '系统提示词'/)
  assert.match(client, /parentChatPrompt: 'Chat 父代理'/)
  assert.match(client, /customPrompt: '自定义子代理'/)
  assert.match(client, /可见性预览/)
  assert.match(client, /writerVisibility: '始终不可见[^']*Writer。'/)
  assert.doesNotMatch(client, /安装|卸载|下载/)
})

test('every declared Roleplay Skill belongs to one independently selectable feature', () => {
  assert.equal(ROLEPLAY_SKILL_CATALOG.length, 6)
  assert.equal(new Set(ROLEPLAY_SKILL_CATALOG.map(item => item.id)).size, ROLEPLAY_SKILL_CATALOG.length)
  for (const skill of ROLEPLAY_SKILL_CATALOG) {
    assert.equal(FEATURE_CATALOG.some(feature => feature.id === skill.featureId && feature.packageName === skill.packageName), true)
  }
})
