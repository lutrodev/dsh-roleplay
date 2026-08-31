import assert from 'node:assert/strict'
import test from 'node:test'
import { Context } from '@deepseek-ai/cordis'
import { SettingsProvider } from '@deepseek-ai/dsh-settings'
import * as ManagerPlugin from '../src/index.js'
import { loaderEntriesFor, matchesLoaderEntry } from '../src/index.js'
import { DEFAULT_ENABLED_FEATURES, DEFAULT_ENABLED_SKILLS } from '../src/catalog.js'

const DEFAULT_IDENTITY = 'You are an AI agent powered by DeepSeek Harness.'
const HARNESS_SECTIONS = [
  { name: 'harness:identity', text: DEFAULT_IDENTITY },
  { name: 'harness:source', text: 'The Harness checkout is available at /source.' },
  { name: 'app:web-surface', text: 'You are using the Harness Web GUI.' },
  { name: 'deployment:persona', text: 'Host persona outside the Harness preamble.' },
]
const HARNESS_SECTION_ORDERS = {
  HARNESS_IDENTITY: -1000,
  HARNESS_SOURCE: -900,
  WEB_SURFACE: -800,
}

class MemorySettings extends SettingsProvider {
  constructor(ctx, config = {}) {
    super(ctx)
    this.document = structuredClone(config.document ?? {})
  }

  get writable() { return true }

  async load() { return structuredClone(this.document) }

  async persist(namespace, section) {
    this.document[namespace] = structuredClone(section)
  }
}

function provideSystemPrompt(ctx, rpRemote = { register: () => () => {} }) {
  ctx.provide('systemPrompt', {
    getSectionOrder(name) { return HARNESS_SECTION_ORDERS[name] },
    async assemble() {
      return { sections: structuredClone(HARNESS_SECTIONS), contexts: [], tools: [], variables: {} }
    },
  })
  ctx.provide('rpRemote', rpRemote)
}

function loaderEntry(id, disabled = false) {
  return {
    id,
    options: { id, disabled },
    fiber: disabled ? undefined : {},
    get disabled() { return Boolean(this.options.disabled) },
    async update(patch) {
      Object.assign(this.options, patch)
      this.fiber = this.disabled ? undefined : {}
    },
  }
}

test('matches managed rows through the namespaced Include tree id', () => {
  assert.equal(matchesLoaderEntry({ id: 'include:rp-quick-replies', options: { id: 'include:rp-quick-replies' } }, 'rp-quick-replies'), true)
  assert.equal(matchesLoaderEntry({ id: 'include:rp-quick-replies', options: { id: 'rp-quick-replies' } }, 'rp-quick-replies'), true)
  assert.equal(matchesLoaderEntry({ id: 'include:not-rp-quick-replies', options: { id: 'other' } }, 'rp-quick-replies'), false)
})

test('reads sibling entries from the owning Include tree before the root Loader view', () => {
  const local = loaderEntry('include:rp-quick-replies', true)
  const root = loaderEntry('root-only')
  assert.deepEqual(loaderEntriesFor({
    fiber: { entry: { parent: { tree: { entries: () => [local] } } } },
    loader: { entries: () => [root, local] },
  }), [local, root])
})

test('manager reconciles namespaced Include rows used by current DSH profiles', async () => {
  const ctx = new Context()
  provideSystemPrompt(ctx)
  const entry = loaderEntry('include:rp-compact-access-mode', true)
  ctx.provide('loader', { entries: () => [entry] })
  try {
    await ctx.plugin(ManagerPlugin, {
      enabledFeatures: ['compact-access-mode'],
      enabledSkills: [],
    })
    const manager = ctx.get('rpFeatures')
    await manager.settled()
    assert.equal(entry.disabled, false)
    assert.equal(manager.status().features.find(item => item.id === 'compact-access-mode').active, true)
  } finally {
    await ctx.fiber.dispose()
  }
})

test('manager reasserts settings after the profile patch replaces an active entry', async () => {
  const ctx = new Context()
  provideSystemPrompt(ctx)
  const entry = loaderEntry('include:rp-compact-access-mode', true)
  ctx.provide('loader', { entries: () => [entry] })
  try {
    await ctx.plugin(ManagerPlugin, {
      enabledFeatures: ['compact-access-mode'],
      enabledSkills: [],
    })
    const manager = ctx.get('rpFeatures')
    await manager.settled()
    assert.equal(entry.disabled, false)

    const previous = { ...entry.options }
    entry.options.disabled = true
    entry.fiber = undefined
    ctx.emit('loader/partial-dispose', entry, previous, true)
    await manager.settled()

    assert.equal(entry.disabled, false)
    assert.equal(entry.fiber !== undefined, true)
  } finally {
    await ctx.fiber.dispose()
  }
})

test('manager reconciles independently selectable Host entries from one validated selection', async () => {
  const ctx = new Context()
  provideSystemPrompt(ctx)
  const entries = [
    loaderEntry('rp-character-library'),
    loaderEntry('rp-lore-library'),
    loaderEntry('rp-message-actions'),
    loaderEntry('rp-state-display'),
  ]
  ctx.provide('loader', {
    entries: () => entries,
    async await() {},
  })
  try {
    await ctx.plugin(ManagerPlugin, {
      enabledFeatures: ['lore-book', 'message-actions'],
      enabledSkills: ['rp-guide-lorebook'],
    })
    const manager = ctx.get('rpFeatures')
    await manager.reconcileTail
    assert.equal(entries[0].options.disabled, true)
    assert.equal(entries[1].options.disabled, false)
    assert.equal(entries[2].options.disabled, false)
    assert.equal(entries[3].options.disabled, true)
    assert.equal(manager.status().compatible, true)
    assert.deepEqual(manager.status().settings, { writable: false, revision: null })
    assert.deepEqual(manager.guidanceSkills().map(item => item.skillName), ['rp-guide-lorebook'])
    assert.deepEqual(
      manager.status().core.find(item => item.label === '会话总结'),
      { label: '会话总结', description: '压缩较早的对话，并向 Writer 提供独立的会话总结。', packageVersion: '0.1.7', versionCompatible: true },
    )
    assert.equal(manager.status().core.some(item => item.label === '会话变量'), false)
    assert.equal(manager.status().features.find(item => item.id === 'state').active, false)
    assert.equal(manager.status().features.find(item => item.id === 'state-display').enabled, false)
    assert.equal(manager.status().skills.find(item => item.id === 'rp-guide-lorebook').enabled, true)
    assert.equal(manager.status().skills.find(item => item.id === 'rp-guide-state').featureEnabled, false)
  } finally {
    await ctx.fiber.dispose()
  }
})

test('manager enables the display entry from the persisted feature selection', async () => {
  const ctx = new Context()
  provideSystemPrompt(ctx)
  const entry = loaderEntry('rp-state-display')
  entry.options.disabled = true
  entry.fiber = undefined
  entry.update = async function update(patch) {
    Object.assign(this.options, patch)
    this.fiber = this.options.disabled ? undefined : {}
  }
  ctx.provide('loader', {
    entries: () => [entry],
    async await() {},
  })
  try {
    await ctx.plugin(ManagerPlugin, {
      enabledFeatures: ['state', 'state-display'],
      enabledSkills: [],
    })
    const manager = ctx.get('rpFeatures')
    await manager.settled()
    assert.equal(entry.options.disabled, false)
    assert.equal(manager.status().features.find(item => item.id === 'state-display').active, true)
  } finally {
    await ctx.fiber.dispose()
  }
})

test('manager settles parked browser entries without changing stored old-feature switches', async () => {
  const ctx = new Context()
  provideSystemPrompt(ctx)
  const newEntries = new Set(['rp-quick-replies', 'rp-reply-options', 'rp-state-display', 'rp-compact-access-mode'])
  const entries = [
    'rp-character-library',
    'rp-message-actions',
    ...newEntries,
  ].map(id => loaderEntry(id, newEntries.has(id)))
  ctx.provide('loader', { entries: () => entries })
  try {
    await ctx.plugin(MemorySettings, {
      document: {
        'roleplay-features': {
          enabledFeatures: ['character-card'],
          enabledSkills: [],
          harnessIdentity: '',
        },
      },
    })
    await ctx.plugin(ManagerPlugin, { enabledFeatures: DEFAULT_ENABLED_FEATURES })
    const byId = Object.fromEntries(entries.map(entry => [entry.options.id, entry]))
    assert.equal(byId['rp-character-library'].options.disabled, false)
    assert.equal(byId['rp-message-actions'].options.disabled, true)
    assert.equal(byId['rp-quick-replies'].options.disabled, true)
    assert.equal(byId['rp-reply-options'].options.disabled, true)
    assert.equal(byId['rp-state-display'].options.disabled, true)
    assert.equal(byId['rp-compact-access-mode'].options.disabled, true)
    assert.deepEqual(ctx.settings.get('roleplay-features').enabledFeatures, ['character-card'])
    assert.deepEqual(ctx.get('rpFeatures').snapshot().enabledFeatures, ['character-card'])
    for (const id of ['quick-replies', 'reply-options', 'state-display', 'compact-access-mode']) {
      const status = ctx.get('rpFeatures').status().features.find(feature => feature.id === id)
      assert.equal(status.enabled, false)
      assert.equal(status.active, false)
    }
  } finally {
    await ctx.fiber.dispose()
  }
})

test('fresh defaults activate every parked browser entry before reporting it enabled', async () => {
  const ctx = new Context()
  provideSystemPrompt(ctx)
  const entries = [
    loaderEntry('rp-quick-replies', true),
    loaderEntry('rp-reply-options', true),
    loaderEntry('rp-state-display', true),
    loaderEntry('rp-compact-access-mode', true),
  ]
  ctx.provide('loader', { entries: () => entries })
  try {
    await ctx.plugin(MemorySettings)
    await ctx.plugin(ManagerPlugin, { enabledFeatures: DEFAULT_ENABLED_FEATURES })
    for (const entry of entries) assert.equal(entry.disabled, false)
    for (const id of ['quick-replies', 'reply-options', 'state-display', 'compact-access-mode']) {
      const status = ctx.get('rpFeatures').status().features.find(feature => feature.id === id)
      assert.equal(status.enabled, true)
      assert.equal(status.active, true)
    }
  } finally {
    await ctx.fiber.dispose()
  }
})

test('manager publishes its enabled selection through the shared settings namespace', async () => {
  const ctx = new Context()
  provideSystemPrompt(ctx)
  ctx.provide('loader', { entries: () => [], async await() {} })
  try {
    await ctx.plugin(MemorySettings)
    await ctx.plugin(ManagerPlugin, { enabledFeatures: ['lore-book', 'state'] })
    const namespace = ctx.settings.describe().find(item => item.ns === 'roleplay-features')
    assert.deepEqual(namespace?.value, {
      enabledFeatures: ['lore-book', 'state'],
      enabledSkills: DEFAULT_ENABLED_SKILLS,
      replyOptionsCount: 3,
      replyOptionsKeywords: ['', '', ''],
      harnessIdentity: '',
    })
    assert.equal(namespace?.applies, 'live')
    assert.deepEqual(ctx.get('rpFeatures').status().settings, { writable: true, revision: 0 })
  } finally {
    await ctx.fiber.dispose()
  }
})

test('manager keeps settings writable through a caller context without the settings service', async () => {
  const ctx = new Context()
  provideSystemPrompt(ctx)
  ctx.provide('loader', { entries: () => [], async await() {} })
  try {
    await ctx.plugin(MemorySettings)
    await ctx.plugin(ManagerPlugin, { enabledFeatures: ['lore-book'] })

    const callerCtx = ctx.isolate('settings')
    assert.equal(callerCtx.get('settings'), undefined)
    const manager = callerCtx.get('rpFeatures')
    assert.deepEqual(manager.status().settings, { writable: true, revision: 0 })

    const updated = await manager.setSetting({
      field: 'enabledFeatures', value: ['state'], expectedRevision: 0,
    })
    assert.deepEqual(updated.enabledFeatures, ['state'])
    assert.deepEqual(updated.settings, { writable: true, revision: 1 })
    assert.deepEqual(ctx.settings.get('roleplay-features').enabledFeatures, ['state'])
  } finally {
    await ctx.fiber.dispose()
  }
})

test('browser API follows the typed Remote boundary and persists Roleplay settings remotely', async () => {
  const ctx = new Context()
  let handler
  let route
  provideSystemPrompt(ctx, {
      register(path, next) {
        handler = next
        route = { path }
        return () => {}
      },
  })
  ctx.provide('loader', { entries: () => [], async await() {} })
  try {
    await ctx.plugin(MemorySettings)
    await ctx.plugin(ManagerPlugin, {
      enabledFeatures: ['lore-book'],
      enabledSkills: ['rp-guide-lorebook'],
    })
    await ctx.get('rpFeatures').settled()
    assert.deepEqual(route, { path: '/rp-features' })

    const initial = await handler('status', {})
    assert.deepEqual(initial.value.value.settings, { writable: true, revision: 0 })

    const updated = await handler('settings/set', {
      field: 'enabledFeatures', value: ['state'], expectedRevision: 0,
    })
    assert.equal(updated.value.ok, true)
    assert.deepEqual(updated.value.value.enabledFeatures, ['state'])
    assert.deepEqual(updated.value.value.settings, { writable: true, revision: 1 })
    assert.deepEqual(ctx.settings.get('roleplay-features').enabledFeatures, ['state'])

    const count = await handler('settings/reply-options', {
      count: 5,
      keywords: ['试探', '反抗', '', '求助', '离开'],
      expectedRevision: 1,
    })
    assert.equal(count.value.ok, true)
    assert.equal(count.value.value.replyOptionsCount, 5)
    assert.deepEqual(count.value.value.replyOptionsKeywords, ['试探', '反抗', '', '求助', '离开'])
    assert.equal(count.value.value.settings.revision, 2)
    assert.equal(ctx.get('rpFeatures').replyOptionsCount(), 5)
    assert.deepEqual(ctx.get('rpFeatures').replyOptionsKeywords(), ['试探', '反抗', '', '求助', '离开'])

    const identity = await handler('settings/set', {
      field: 'harnessIdentity', value: 'Remote Roleplay identity.', expectedRevision: 2,
    })
    assert.equal(identity.value.value.settings.revision, 3)
    assert.equal(ctx.get('rpFeatures').harnessIdentity(), 'Remote Roleplay identity.')

    const reset = await handler('settings/unset', {
      field: 'harnessIdentity', expectedRevision: 3,
    })
    assert.equal(reset.value.value.settings.revision, 4)
    assert.equal(ctx.get('rpFeatures').harnessIdentity(), DEFAULT_IDENTITY)

    const stale = await handler('settings/set', {
      field: 'enabledSkills', value: [], expectedRevision: 0,
    })
    assert.deepEqual(stale.value, {
      ok: false,
      error: { code: 'ROLEPLAY_SETTINGS_UPDATE_FAILED', message: 'Roleplay 设置没有保存，请稍后重试。' },
    })
    assert.deepEqual(ctx.settings.get('roleplay-features').enabledSkills, ['rp-guide-lorebook'])
  } finally {
    await ctx.fiber.dispose()
  }
})

test('manager atomically validates reply option count and index-aligned direction keywords', async () => {
  const ctx = new Context()
  provideSystemPrompt(ctx)
  ctx.provide('loader', { entries: () => [], async await() {} })
  try {
    await ctx.plugin(MemorySettings)
    await ctx.plugin(ManagerPlugin, { enabledFeatures: ['reply-options'] })
    const manager = ctx.get('rpFeatures')
    const snapshots = []
    manager.subscribe(snapshot => { snapshots.push(snapshot) })

    for (const value of [0, 6, 1.5]) {
      await assert.rejects(
        manager.setReplyOptionsSettings({ count: value, keywords: [], expectedRevision: 0 }),
        /integer|between 1 and 5/,
      )
    }
    assert.equal(manager.replyOptionsCount(), 3)
    assert.deepEqual(manager.replyOptionsKeywords(), ['', '', ''])
    await assert.rejects(
      manager.setReplyOptionsSettings({ count: 3, keywords: ['试探'], expectedRevision: 0 }),
      /exactly 3 items/,
    )
    await assert.rejects(
      manager.setReplyOptionsSettings({ count: 1, keywords: ['界'.repeat(41)], expectedRevision: 0 }),
      /exceeds 40 Unicode/,
    )
    const status = await manager.setReplyOptionsSettings({ count: 1, keywords: [' 试探\n对方 '], expectedRevision: 0 })
    assert.equal(status.replyOptionsCount, 1)
    assert.deepEqual(status.replyOptionsKeywords, ['试探 对方'])
    assert.equal(manager.snapshot().replyOptionsCount, 1)
    assert.deepEqual(manager.snapshot().replyOptionsKeywords, ['试探 对方'])
    assert.equal(snapshots.at(-1).replyOptionsCount, 1)
    assert.deepEqual(snapshots.at(-1).replyOptionsKeywords, ['试探 对方'])
    await assert.rejects(ctx.settings.update('roleplay-features', { replyOptionsCount: 6 }), /<= 5|between 1 and 5/)
  } finally {
    await ctx.fiber.dispose()
  }
})

test('manager pads legacy keyword settings to the configured option count', async () => {
  const ctx = new Context()
  provideSystemPrompt(ctx)
  ctx.provide('loader', { entries: () => [], async await() {} })
  try {
    await ctx.plugin(MemorySettings)
    await ctx.plugin(ManagerPlugin, {
      enabledFeatures: ['reply-options'],
      replyOptionsCount: 5,
      replyOptionsKeywords: ['试探'],
    })
    const manager = ctx.get('rpFeatures')
    assert.equal(manager.replyOptionsCount(), 5)
    assert.deepEqual(manager.replyOptionsKeywords(), ['试探', '', '', '', ''])
    assert.deepEqual(manager.status().replyOptionsKeywords, ['试探', '', '', '', ''])
  } finally {
    await ctx.fiber.dispose()
  }
})

test('manager persists the legacy implicit-State MVU selection as an explicit dependency', async () => {
  const ctx = new Context()
  provideSystemPrompt(ctx)
  ctx.provide('loader', { entries: () => [], async await() {} })
  try {
    await ctx.plugin(MemorySettings, {
      document: {
        'roleplay-features': {
          enabledFeatures: ['character-card', 'lore-book', 'compat-mvu'],
        },
      },
    })
    await ctx.plugin(ManagerPlugin, { enabledFeatures: [] })
    const manager = ctx.get('rpFeatures')
    await manager.settled()
    const namespace = ctx.settings.describe().find(item => item.ns === 'roleplay-features')
    assert.deepEqual(namespace?.value, {
      enabledFeatures: ['character-card', 'lore-book', 'state', 'compat-mvu'],
      enabledSkills: DEFAULT_ENABLED_SKILLS,
      replyOptionsCount: 3,
      replyOptionsKeywords: ['', '', ''],
      harnessIdentity: '',
    })
    assert.deepEqual(manager.snapshot().enabledFeatures, ['character-card', 'lore-book', 'state', 'compat-mvu'])
    assert.deepEqual(manager.snapshot().enabledSkills, DEFAULT_ENABLED_SKILLS)
  } finally {
    await ctx.fiber.dispose()
  }
})

test('manager persists compact access mode without changing the saved display choice', async () => {
  const ctx = new Context()
  provideSystemPrompt(ctx)
  ctx.provide('loader', { entries: () => [], async await() {} })
  try {
    const previousDefaults = DEFAULT_ENABLED_FEATURES.filter(id => id !== 'state-display' && id !== 'compact-access-mode' && id !== 'reply-options')
    const migratedDefaults = DEFAULT_ENABLED_FEATURES.filter(id => id !== 'state-display' && id !== 'reply-options')
    await ctx.plugin(MemorySettings, {
      document: {
        'roleplay-features': {
          enabledFeatures: previousDefaults,
          enabledSkills: DEFAULT_ENABLED_SKILLS,
          harnessIdentity: '',
        },
      },
    })
    await ctx.plugin(ManagerPlugin, { enabledFeatures: [] })
    const manager = ctx.get('rpFeatures')
    await manager.settled()
    assert.deepEqual(ctx.settings.get('roleplay-features').enabledFeatures, migratedDefaults)
    assert.deepEqual(manager.snapshot().enabledFeatures, migratedDefaults)
  } finally {
    await ctx.fiber.dispose()
  }
})

test('manager registers writable settings and removes the retired writer history id', async () => {
  const ctx = new Context()
  provideSystemPrompt(ctx)
  ctx.provide('loader', { entries: () => [], async await() {} })
  try {
    await ctx.plugin(MemorySettings, {
      document: {
        'roleplay-features': {
          enabledFeatures: ['lore-book', 'writer-history', 'message-actions'],
          enabledSkills: [],
          harnessIdentity: '',
        },
      },
    })
    await ctx.plugin(ManagerPlugin, { enabledFeatures: [] })
    const manager = ctx.get('rpFeatures')
    await manager.settled()

    assert.deepEqual(ctx.settings.get('roleplay-features').enabledFeatures, ['lore-book', 'message-actions'])
    assert.deepEqual(manager.status().settings, { writable: true, revision: 1 })

    const callerCtx = ctx.isolate('settings')
    const updated = await callerCtx.get('rpFeatures').setSetting({
      field: 'enabledFeatures', value: ['state'], expectedRevision: 1,
    })
    assert.deepEqual(updated.enabledFeatures, ['state'])
    assert.deepEqual(updated.settings, { writable: true, revision: 2 })
  } finally {
    await ctx.fiber.dispose()
  }
})

test('manager rebuild notifications and guidance follow Skill selection independently from plugins', async () => {
  const ctx = new Context()
  provideSystemPrompt(ctx)
  ctx.provide('loader', { entries: () => [], async await() {} })
  try {
    await ctx.plugin(MemorySettings)
    await ctx.plugin(ManagerPlugin, {
      enabledFeatures: ['lore-book', 'state'],
      enabledSkills: ['rp-guide-lorebook', 'rp-guide-state'],
    })
    const manager = ctx.get('rpFeatures')
    const snapshots = []
    manager.subscribe(snapshot => { snapshots.push(snapshot) })
    await ctx.settings.update('roleplay-features', { enabledSkills: ['rp-guide-state'] })
    await manager.settled()
    assert.deepEqual(manager.guidanceSkills().map(item => item.skillName), ['rp-guide-state'])
    assert.deepEqual(manager.status().enabledFeatures, ['lore-book', 'state'])
    assert.deepEqual(manager.status().enabledSkills, ['rp-guide-state'])
    assert.equal(manager.status().skills.find(item => item.id === 'rp-guide-lorebook').enabled, false)
    assert.equal(manager.status().skills.find(item => item.id === 'rp-guide-state').enabled, true)
    assert.equal(snapshots.at(-1).enabledSkills.includes('rp-guide-lorebook'), false)
  } finally {
    await ctx.fiber.dispose()
  }
})

test('manager projects live Writer and custom subagent prompt composition from the runtime catalog', async () => {
  const ctx = new Context()
  provideSystemPrompt(ctx)
  ctx.provide('loader', { entries: () => [], async await() {} })
  ctx.provide('rpSubagentManager', {
    async prepareRuntimeProfile() {
      return {
        writer: { provider: 'openai', model: 'writer-model' },
        subagents: [{
          id: 'continuity',
          label: '连续性检查',
          description: '核对本轮事实。',
          persona: 'Only list continuity issues.',
          route: { provider: 'openai', model: 'review-model' },
          toolFilter: { allow: ['web_search'] },
        }],
      }
    },
  })
  try {
    await ctx.plugin(ManagerPlugin, { enabledFeatures: ['state', 'subagent-manager'] })
    const preview = await ctx.get('rpFeatures').promptPreview()
    assert.deepEqual(preview.profiles.map(profile => profile.kind), ['parent-chat', 'parent-agent', 'writer'])
    assert.equal(preview.profiles.find(profile => profile.kind === 'writer').route.model, 'writer-model')
    assert.deepEqual(preview.profiles[0].layers.slice(0, 3).map(layer => layer.id), ['harness-identity', 'harness-source', 'app-web-surface'])
    assert.equal(preview.profiles[0].layers.find(layer => layer.id === 'harness-identity').text, DEFAULT_IDENTITY)
    assert.equal(preview.profiles[0].layers.find(layer => layer.id === 'harness-identity').contentKind, 'exact')
    assert.equal(preview.profiles[0].layers.find(layer => layer.id === 'harness-source').text, HARNESS_SECTIONS[1].text)
    assert.equal(preview.profiles[0].layers.find(layer => layer.id === 'app-web-surface').sectionName, 'app:web-surface')
    assert.deepEqual(preview.harnessIdentity, {
      sectionName: 'harness:identity', value: DEFAULT_IDENTITY, defaultValue: DEFAULT_IDENTITY,
      customized: false, maxCharacters: 4000,
    })
    assert.equal(preview.taskSubagents[0].label, '连续性检查')
    assert.match(preview.taskSubagents[0].layers.find(layer => layer.id === 'task-persona').text, /Only list continuity issues/)
    assert.deepEqual(preview.taskSubagents[0].layers.find(layer => layer.id === 'tool-schema').tools, ['web_search'])
  } finally {
    await ctx.fiber.dispose()
  }
})

test('manager persists one identity override and projects it across every Roleplay agent kind', async () => {
  const ctx = new Context()
  provideSystemPrompt(ctx)
  ctx.provide('loader', { entries: () => [], async await() {} })
  ctx.provide('rpSubagentManager', {
    async prepareRuntimeProfile() {
      return {
        subagents: [{
          id: 'fact-check', label: '事实核对', description: '核对明确提供的事实。',
          persona: 'Return only concrete factual conflicts.', toolFilter: { allow: [] },
        }],
      }
    },
  })
  try {
    await ctx.plugin(MemorySettings)
    await ctx.plugin(ManagerPlugin, { enabledFeatures: ['subagent-manager'] })
    const manager = ctx.get('rpFeatures')
    const snapshots = []
    manager.subscribe(snapshot => { snapshots.push(snapshot) })
    const custom = 'You are the shared identity for every Roleplay agent.'
    await ctx.settings.update('roleplay-features', { harnessIdentity: custom })
    await manager.settled()
    assert.equal(manager.harnessIdentity(), custom)
    assert.equal(snapshots.at(-1).harnessIdentity, custom)
    const preview = await manager.promptPreview()
    assert.equal(preview.harnessIdentity.customized, true)
    assert.equal(preview.harnessIdentity.value, custom)
    for (const profile of preview.profiles) {
      assert.equal(profile.layers.find(layer => layer.id === 'harness-identity').text, custom)
    }
    for (const profile of preview.taskSubagents) {
      assert.equal(profile.layers.find(layer => layer.id === 'harness-identity').text, custom)
    }
    assert.equal(preview.taskSubagents.length, 1)
    await ctx.settings.update('roleplay-features', { harnessIdentity: '' })
    await manager.settled()
    assert.equal(manager.harnessIdentity(), DEFAULT_IDENTITY)
    assert.equal((await manager.promptPreview()).harnessIdentity.customized, false)
  } finally {
    await ctx.fiber.dispose()
  }
})

test('manager accepts the identity limit exactly and rejects an over-limit override', async () => {
  const ctx = new Context()
  provideSystemPrompt(ctx)
  ctx.provide('loader', { entries: () => [], async await() {} })
  try {
    await ctx.plugin(MemorySettings)
    await ctx.plugin(ManagerPlugin, { enabledFeatures: [] })
    const exact = '界'.repeat(ManagerPlugin.MAX_HARNESS_IDENTITY_CHARACTERS)
    await ctx.settings.update('roleplay-features', { harnessIdentity: exact })
    await ctx.get('rpFeatures').settled()
    assert.equal(ctx.get('rpFeatures').harnessIdentity(), exact)
    await assert.rejects(
      ctx.settings.update('roleplay-features', { harnessIdentity: `${exact}界` }),
      /exceeds 4000 characters/,
    )
    assert.equal(ctx.get('rpFeatures').harnessIdentity(), exact)
  } finally {
    await ctx.fiber.dispose()
  }
})
