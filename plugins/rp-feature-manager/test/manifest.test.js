import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import test from 'node:test'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CORE_PACKAGES, FEATURE_CATALOG, ROLEPLAY_SKILL_CATALOG, ROLEPLAY_SUITE_VERSION, SUPPORTED_DSH_RANGE } from '../src/catalog.js'

const pluginDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pluginsDirectory = resolve(pluginDirectory, '..')

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

  const managedPackages = new Set([
    ...CORE_PACKAGES.map(item => item.packageName),
    ...FEATURE_CATALOG.map(item => item.packageName),
  ])
  managedPackages.delete(manifest.name)
  for (const packageName of managedPackages) {
    assert.equal(typeof manifest.dependencies[packageName], 'string', `${packageName} must ship with the suite bundle`)
  }
})

test('all Roleplay packages stay on the declared suite version', async () => {
  for (const entry of await readdir(pluginsDirectory, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    let manifest
    try {
      manifest = JSON.parse(await readFile(resolve(pluginsDirectory, entry.name, 'package.json'), 'utf8'))
    } catch (error) {
      if (error?.code === 'ENOENT') continue
      throw error
    }
    assert.equal(manifest.version, ROLEPLAY_SUITE_VERSION, `${manifest.name} version drifted from the suite`)
  }
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
