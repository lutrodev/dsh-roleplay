import assert from 'node:assert/strict'
import test from 'node:test'
import { Context } from '@deepseek-ai/cordis'
import { SettingsProvider } from '@deepseek-ai/dsh-settings'
import * as ManagerPlugin from '../src/index.js'
import { DEFAULT_ENABLED_SKILLS } from '../src/catalog.js'

const DEFAULT_IDENTITY = 'You are an AI agent powered by DeepSeek Harness.'
const HARNESS_SECTIONS = [
  { name: 'harness:identity', text: DEFAULT_IDENTITY },
  { name: 'harness:source', text: 'The Harness checkout is available at /source.' },
  { name: 'app:web-surface', text: 'You are using the Harness Web GUI.' },
  { name: 'deployment:persona', text: 'Host persona outside the Harness preamble.' },
]

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

function provideSystemPrompt(ctx) {
  ctx.provide('systemPrompt', {
    async assemble() {
      return { sections: structuredClone(HARNESS_SECTIONS), contexts: [], tools: [], variables: {} }
    },
  })
}

function loaderEntry(id) {
  return {
    options: { id, disabled: false },
    fiber: {},
    async update(patch) { Object.assign(this.options, patch) },
  }
}

test('manager reconciles independently selectable Host entries from one validated selection', async () => {
  const ctx = new Context()
  provideSystemPrompt(ctx)
  const entries = [
    loaderEntry('rp-character-library'),
    loaderEntry('rp-lore-library'),
    loaderEntry('rp-message-actions'),
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
    assert.equal(manager.status().compatible, true)
    assert.deepEqual(manager.guidanceSkills().map(item => item.skillName), ['rp-guide-lorebook'])
    assert.equal(manager.status().core.some(item => item.label === '会话变量'), false)
    assert.equal(manager.status().features.find(item => item.id === 'state').active, false)
    assert.equal(manager.status().skills.find(item => item.id === 'rp-guide-lorebook').enabled, true)
    assert.equal(manager.status().skills.find(item => item.id === 'rp-guide-state').featureEnabled, false)
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
      harnessIdentity: '',
    })
    assert.equal(namespace?.applies, 'live')
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
      harnessIdentity: '',
    })
    assert.deepEqual(manager.snapshot().enabledFeatures, ['character-card', 'lore-book', 'state', 'compat-mvu'])
    assert.deepEqual(manager.snapshot().enabledSkills, DEFAULT_ENABLED_SKILLS)
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
