import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { Context } from '@deepseek-ai/cordis'
import { RpCharacterCards } from 'dsh-roleplay-rp-character-card'
import { RpLoreBooks } from 'dsh-roleplay-rp-lore-book'
import { RpPersonas } from 'dsh-roleplay-rp-persona'
import { RpPresets } from 'dsh-roleplay-rp-preset'
import { RpWritingStyles } from 'dsh-roleplay-rp-writing-style'
import { apply } from '../src/index.js'

const CASES = [
  {
    kind: 'character', service: 'rpCharacterCards',
    create: { name: '秦昼', firstMessage: '门外传来脚步声。' },
    update: { name: '秦昼·更新' },
  },
  {
    kind: 'lorebook', service: 'rpLoreBooks',
    create: { name: '雾港', entries: [] },
    update: { name: '雾港·更新' },
  },
  {
    kind: 'persona', service: 'rpPersonas',
    create: { name: '旅人' },
    update: { name: '旅人·更新' },
  },
  {
    kind: 'preset', service: 'rpPresets',
    create: { name: '悬疑', fields: [{ name: '任务', position: 'top', content: '保持悬念。' }] },
    update: { name: '悬疑·更新', fields: [{ name: '任务', position: 'top', content: '逐步揭示线索。' }] },
  },
  {
    kind: 'writingStyle', service: 'rpWritingStyles',
    create: { name: '冷峻', content: '使用克制、简短的句子。' },
    update: { name: '冷峻·更新', content: '使用克制、简短且具象的句子。' },
  },
]

test('rp_asset_read and rp_asset use all five real owning services', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-asset-real-services-'))
  const ctx = new Context()
  const tools = new Map()
  const outcomes = []
  try {
    ctx.provide('tools', { register(value) { tools.set(value.name, value) } })
    ctx.provide('rpRuntime', {
      registerContextSource() { return () => {} },
      async refreshRunContext() { return { refreshed: true, contextEpoch: 1, contextText: '最新资料上下文' } },
      recordAssetMutationOutcome(_agent, outcome) { outcomes.push(outcome) },
    })
    ctx.provide('rpSessions', {
      get() { return { revision: 0, runtime: { executionMode: 'agent' }, scene: {}, resources: { lorebooks: [], writingStyles: [] } } },
      async bindAssetChangesDuringRun() { throw new Error('binding is not used by this test') },
    })
    new RpCharacterCards(ctx, { libraryDir: join(root, 'characters'), maxInputBytes: 1048576, maxTextCharacters: 100000 })
    new RpLoreBooks(ctx, { libraryDir: join(root, 'lorebooks'), maxInputBytes: 1048576, maxTokens: 512, maxEntries: 32, maxRecursiveDepth: 2 })
    new RpPersonas(ctx, {
      libraryDir: join(root, 'personas'), maxTextCharacters: 30000,
      maxAvatarInputBytes: 5242880, maxAvatarPixels: 16777216,
      avatarMaxEdgePixels: 512, avatarWebpQuality: 85,
    })
    new RpPresets(ctx, { libraryDir: join(root, 'presets'), maxTextCharacters: 100000, maxFields: 32 })
    new RpWritingStyles(ctx, { libraryDir: join(root, 'styles'), maxTextCharacters: 30000, maxStylesPerSession: 16 })
    apply(ctx)
    const exec = { agent: { id: 'agent' }, callId: 'asset-call', concludeTurn() {} }
    const readTool = tools.get('rp_asset_read')
    const tool = tools.get('rp_asset')

    for (const item of CASES) {
      const created = await tool.execute({ action: 'create', kind: item.kind, value: item.create }, exec)
      assert.match(created.asset.id, /^[0-9a-f-]{36}$/)
      assert.equal(created.asset.revision, 1)
      assert.equal(created.meta.assetId, created.asset.id)
      assert.equal(created.ok, true)
      const stored = await ctx[item.service].detail(created.asset.id)
      assert.equal(stored.id, created.asset.id)
      const listed = await readTool.execute({ action: 'list', kind: item.kind }, exec)
      assert.ok(listed.page.items.some(asset => asset.id === created.asset.id))
      assert.equal((await readTool.execute({ action: 'get', kind: item.kind, id: created.asset.id }, exec)).asset.id, created.asset.id)

      const updateValue = item.kind === 'preset'
        ? {
            name: item.update.name,
            description: stored.description,
            fields: item.update.fields.map((field, index) => ({ ...stored.fields[index], ...field })),
          }
        : item.update
      const updated = await tool.execute({
        action: 'update', kind: item.kind, id: created.asset.id,
        expectedRevision: 1, value: updateValue,
      }, exec)
      assert.equal(updated.asset.id, created.asset.id)
      assert.equal(updated.asset.revision, 2)
      assert.equal(updated.ok, true)
    }
    assert.equal(outcomes.length, CASES.length * 2)
    assert.equal(outcomes.every(outcome => outcome.meta?.kind === 'rp-agent/asset-mutation'), true)
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})
