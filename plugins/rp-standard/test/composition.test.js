import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { Context } from '@deepseek-ai/cordis'
import {
  createAssistantMessage,
  createToolResultMessage,
  createUserMessage,
} from '@deepseek-ai/dsh-llm'
import {
  Session as HarnessSession,
  SessionId,
} from '@deepseek-ai/dsh-session'
import * as Core from 'dsh-roleplay-rp-core'
import * as ConversationSummaryBridge from 'dsh-roleplay-rp-conversation-summary/bridge'
import * as ReplyOptions from 'dsh-roleplay-rp-reply-options'
import * as SubagentManager from 'dsh-roleplay-rp-subagent-manager'
import * as Session from 'dsh-roleplay-rp-session'
import * as Character from 'dsh-roleplay-rp-character-card'
import * as Persona from 'dsh-roleplay-rp-persona'
import * as Macro from 'dsh-roleplay-rp-macro'
import * as State from 'dsh-roleplay-rp-state'
import * as CompatMvu from 'dsh-roleplay-rp-compat-mvu'
import * as Lore from 'dsh-roleplay-rp-lore-book'
import * as Preset from 'dsh-roleplay-rp-preset'
import * as WritingStyle from 'dsh-roleplay-rp-writing-style'
import * as AssetTools from 'dsh-roleplay-rp-asset-tools'
import { buildRoleplaySessionSeed, prepareRoleplaySeed, RpSessionBootstrap } from 'dsh-roleplay-rp-library/session-bootstrap'

const CHAT_WRITER_PARAMETERS = {
  type: 'object',
  properties: {
    action: {
      type: 'string',
      enum: ['write'],
      description: 'Required operation. Use "write" to generate narrative from the prepared context.',
    },
  },
  required: ['action'],
  additionalProperties: false,
}

test('imports synthetic assets through the production asset boundaries', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-test-assets-'))
  const ctx = new Context()
  ctx.provide('rpRuntime', { registerContextSource() {} })
  const cards = new Character.RpCharacterCards(ctx, {
    libraryDir: join(root, 'characters'), maxInputBytes: 8 * 1024 * 1024, maxTextCharacters: 150000,
  })
  const books = new Lore.RpLoreBooks(ctx, {
    libraryDir: join(root, 'lorebooks'), maxInputBytes: 2 * 1024 * 1024,
    maxTokens: 4096, maxEntries: 128, maxRecursiveDepth: 3,
  })

  try {
    const cardBytes = Buffer.from(JSON.stringify({
      spec: 'chara_card_v3',
      spec_version: '3.0',
      data: {
        name: 'Synthetic Harbor Guide',
        description: 'A repository-owned test character.',
        first_mes: 'The harbor wakes.',
      },
    }))
    const loreBytes = Buffer.from(JSON.stringify({
      name: 'Synthetic Harbor Lore',
      entries: [{ id: 1, keys: ['harbor'], content: 'The harbor bell rings at dawn.' }],
    }))
    const card = await cards.import(cardBytes, { path: 'synthetic-card.json' })
    const lore = await books.importBytes(loreBytes, { sourceName: 'synthetic-lore.json' })

    assert.ok(card.id && card.name)
    assert.equal((await cards.detail(card.id)).source.originalName, 'synthetic-card.json')
    assert.equal((await books.detail(lore.id)).source.originalName, 'synthetic-lore.json')
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('imports an MVU+lore card, creates an Actor session and commits atomically', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-composition-'))
  const ctx = new Context()
  const tools = new Map()
  const projections = new Map()
  const sourceCard = Buffer.from(JSON.stringify({
    spec: 'chara_card_v3', spec_version: '3.0', data: {
      name: 'Harbor Hero', description: 'A cautious traveler.',
      first_mes: '<initvar>{"hp":[10,"current health"],"location":["harbor","current location"]}</initvar> The harbor wakes.\n<UpdateVariable>_.set("hp", 10, 9);</UpdateVariable>',
      alternate_greetings: ['<initvar>{"hp":[10,"current health"],"location":["harbor","current location"]}</initvar> The cliff road wakes.\n<UpdateVariable>_.set("hp", 10, 7);_.set("location", "harbor", "cliff");</UpdateVariable>'],
      character_book: { entries: [
        { id: 1, position: 0, constant: true, content: 'The harbor stands on a tidal shelf.' },
        { id: 2, position: 1, constant: true, content: '<% if (getvar("stat_data").hp[0] === 7) { %>The cliff bell rings at dawn for wounded travelers. Current HP={{getvar::stat_data.hp[0]}}.<% } %>' },
        { id: 3, position: 4, depth: 1, constant: true, content: 'The tide gate only opens once per dawn.' },
      ] },
    },
  }))
  ctx.provide('systemPrompt', {
    getSectionOrder(name) {
      assert.equal(name, 'HARNESS_IDENTITY')
      return -1000
    },
    section() {},
  })
  ctx.provide('tools', { register(tool) { tools.set(tool.name, tool) } })
  ctx.provide('fs', {
    async resolve(path) { return { displayPath: path } },
    async readBytes() { return sourceCard },
  })
  ctx.provide('agents', { get() { return undefined }, list() { return [] } })
  ctx.provide('subagents', { async start() { throw new Error('subagent execution is outside this composition test') } })
  ctx.provide('rpFeatures', { harnessIdentity: () => 'You are the Roleplay test identity.' })
  ctx.provide('sessionProjections', {
    register(definition) { projections.set(definition.key, definition) },
    stateOf(session, key) {
      const definition = projections.get(key)
      return definition === undefined
        ? undefined
        : session.events.reduce(definition.apply, definition.init())
    },
  })
  ctx.provide('commands', fakeCommands())
  new RpSessionBootstrap(ctx)

  try {
    await ctx.plugin(Core, { chatMaxStepsPerRun: 5, agentMaxStepsPerRun: 8, maxEffectsPerCommit: 64, maxArtifactBytes: 262144, maxNarrativeCharacters: 200000 })
    await ctx.plugin(ConversationSummaryBridge)
    await ctx.plugin(ReplyOptions, {
      registerRuntime: true,
      count: 3,
      keywords: ['调查线索', '', '离开现场'],
    })
    await ctx.plugin(SubagentManager, {
      catalogDir: join(root, 'subagents'),
      maxSubagents: 32,
      maxNameCharacters: 80,
      maxDescriptionCharacters: 240,
      maxInstructionsCharacters: 20000,
      initialSubagents: [
        { name: '规划', description: '叙事续写时必须在 Writer 前调用。传入本轮目标、已有剧情和人物信息，将返回的大纲整理进 rp_write_turn 的 brief；纯讨论或资料操作时不调用。', instructions: '只根据显式输入返回大纲。', route: { kind: 'inherit' }, tools: [], enabled: true },
        { name: '润色', description: '适用范围：叙事续写。调用要求：必需。本节点必须在 Writer 后、最终正文与 rp_commit_turn 前通过 rp_run_subagent 调用。输入要求：传入完整初稿及明确修正要求。结果用途：审阅返回的完整候选稿，并据此确定最终正文。不适用于纯讨论或仅资料操作。', instructions: '返回润色稿。', route: { kind: 'inherit' }, tools: [], enabled: true },
      ],
      exposeBrowser: false,
    })
    const initialSubagents = (await ctx.rpSubagentManager.list()).subagents
    const outlineSubagent = initialSubagents.find(subagent => subagent.name === '规划')
    assert.equal(outlineSubagent.description, '叙事续写时必须在 Writer 前调用。传入本轮目标、已有剧情和人物信息，将返回的大纲整理进 rp_write_turn 的 brief；纯讨论或资料操作时不调用。')
    assert.equal(initialSubagents.find(subagent => subagent.name === '润色').description, '适用范围：叙事续写。调用要求：必需。本节点必须在 Writer 后、最终正文与 rp_commit_turn 前通过 rp_run_subagent 调用。输入要求：传入完整初稿及明确修正要求。结果用途：审阅返回的完整候选稿，并据此确定最终正文。不适用于纯讨论或仅资料操作。')
    assert.equal(initialSubagents.every(subagent => subagent.enabled), true)
    await ctx.plugin(Session, { defaultMode: 'director', defaultExecutionMode: 'chat', maxProfileCommandBytes: 262144 })
    await ctx.plugin(Character, { libraryDir: join(root, 'characters'), maxInputBytes: 1024 * 1024, maxTextCharacters: 150000 })
    await ctx.plugin(Persona, { libraryDir: join(root, 'personas'), exposeBrowser: false })
    await ctx.plugin(Macro, {})
    await ctx.plugin(State, { maxNamespacesInContext: 32 })
    await ctx.plugin(CompatMvu, {})
    await ctx.plugin(Lore, { libraryDir: join(root, 'lorebooks'), maxInputBytes: 1024 * 1024, maxTokens: 1024, maxEntries: 32, maxRecursiveDepth: 3 })
    await ctx.plugin(Preset, { libraryDir: join(root, 'presets'), maxTextCharacters: 100000, maxFields: 32, exposeBrowser: false })
    await ctx.plugin(WritingStyle, { libraryDir: join(root, 'writing-styles'), maxTextCharacters: 30000, maxStylesPerSession: 16, exposeBrowser: false })
    await ctx.plugin(AssetTools, {})
    assert.ok(tools.has('rp_asset_read'))
    assert.ok(tools.has('rp_asset'))
    assert.equal(tools.has('rp_build_context'), false)
    const commitSchema = tools.get('rp_commit_turn').parameters
    assert.deepEqual(commitSchema.required, ['extensions'])
    assert.equal(commitSchema.properties.extensions.additionalProperties, false)
    assert.deepEqual(commitSchema.properties.extensions.required, ['rp.reply-options'])
    const replyOptionsSchema = commitSchema.properties.extensions.properties['rp.reply-options']
    assert.ok(replyOptionsSchema)
    assert.equal(replyOptionsSchema.additionalProperties, false)
    assert.match(replyOptionsSchema.description, /option 1: "调查线索"/)
    assert.match(replyOptionsSchema.description, /option 3: "离开现场"/)
    assert.equal(Object.hasOwn(replyOptionsSchema.properties.options, 'minItems'), false)
    assert.equal(Object.hasOwn(replyOptionsSchema.properties.options, 'maxItems'), false)

    const stateEffectSchema = commitSchema.properties.effects.items
    assert.equal(stateEffectSchema.properties.kind.const, 'state.update')
    assert.equal(stateEffectSchema.additionalProperties, false)
    assert.equal(stateEffectSchema.properties.payload.additionalProperties, false)
    const stateChanges = stateEffectSchema.properties.payload.properties.changes.items.oneOf
    const incrementChange = stateChanges.find(branch => branch.properties.op.const === 'increment')
    assert.deepEqual(incrementChange.required, ['op', 'path', 'by', 'reason'])
    assert.equal(Object.hasOwn(incrementChange.properties, 'value'), false)
    assert.equal(incrementChange.additionalProperties, false)

    const emptySession = HarnessSession.create(SessionId('s-empty'))
    const emptyAgentTools = fakeAgentTools()
    const emptyAgent = { status: 'idle', session: emptySession, ctx: { tools: emptyAgentTools } }
    const emptyProfile = await ctx.rpSessions.bindResources(emptyAgent, { expectedRevision: 0, lorebooks: [], writingStyles: [] })
    assert.deepEqual(emptyProfile.resources, { lorebooks: [], writingStyles: [] })
    assert.deepEqual(emptyAgentTools.registered?.parameters, CHAT_WRITER_PARAMETERS)
    assert.deepEqual(emptyAgentTools.allowed, ['rp_write_turn', 'rp_commit_turn', 'rp_asset_read', 'rp_state_read'])
    emptySession.append('turn/start', { turn: 1 })
    const emptyRun = await ctx.rpRuntime.prepareRun(emptyAgent, 1, [{ role: 'user', source: { kind: 'user' }, content: [{ type: 'text', text: '先从一片空白开始。' }] }])
    assert.equal(emptyRun.fragments.some(fragment => fragment.id === 'rp.session' || fragment.id === 'rp.card' || fragment.id === 'rp.persona' || fragment.id.startsWith('rp.writing-style:') || fragment.id.startsWith('rp.preset:') || fragment.id.startsWith('rp.lore.')), false)
    ctx.rpRuntime.failRun(emptyRun, 'TEST_COMPLETE', 'empty-asset composition verified')

    const imported = await tools.get('import_character_card').execute({ path: '/workspace/hero.json' }, { signal: new AbortController().signal })
    const importedCharacter = await ctx.rpCharacterCards.get(imported.id)
    assert.equal(Object.hasOwn(importedCharacter, 'nativeState'), false)
    assert.equal(Object.hasOwn(importedCharacter, 'compatibility'), false)
    const preset = await ctx.rpPresets.create({ name: '镜头叙事', fields: [
      { name: '声明', description: '', content: '以下内容均为虚构创作。', position: 'top' },
      { name: '任务描述', description: '仅供预设管理时说明用途。', content: '保持港口谜团持续推进。', position: 'top' },
      { name: '写作指导', description: '', content: '保持场景行动清晰。', position: 'top' },
      { name: '思维链指导', description: '', content: '先检查连续性再组织回复。', position: 'bottom' },
      { name: '格式要求', description: '', content: '每次回复使用两段。', position: 'bottom' },
    ] })
    const writingStyle = await ctx.rpWritingStyles.create({ name: '冷峻电影感', description: '适合悬疑场景。', content: '使用短句、近景和克制的对白。' })
    const secondaryWritingStyle = await ctx.rpWritingStyles.create({ name: '测试文风', description: '验证多文风独立排列。', content: '环境描写保持疏离，并减少修辞。' })
    const prepared = await prepareRoleplaySeed(ctx, {
      cardId: imported.id,
      lorebookIds: (importedCharacter.embeddedLorebooks ?? []).filter(item => item.status === 'managed').map(item => item.id),
      personaId: null,
      presetId: preset.id,
      writingStyleIds: [writingStyle.id, secondaryWritingStyle.id],
      openingIndex: 1,
      openingSource: 'card',
      openingText: importedCharacter.alternateGreetings[0],
    }, { agentPreset: 'roleplay', defaultMode: 'adaptive', defaultExecutionMode: 'chat', maxProfileCommandBytes: 262144 })
    const profile = {
      ...prepared.profile,
      mode: 'actor',
      playerCharacterId: imported.id,
      cast: [{ characterId: imported.id, controller: 'user' }],
      runtime: { executionMode: 'agent', provider: 'rp-test-provider', model: 'rp-test-model', maxSteps: 6 },
    }
    const seed = buildRoleplaySessionSeed(profile, Session.encodeSessionCommand(0, profile), prepared.profile.scene.openingText, 1)
    const harnessSession = HarnessSession.create(SessionId('s1'), seed)
    const agentTools = fakeAgentTools()
    const agent = { status: 'idle', session: harnessSession, ctx: { tools: agentTools } }
    const openingMessage = agent.session.events.find(event => event.type === 'assistant/message')
    assert.equal(openingMessage?.data.message.content[0].text, 'The cliff road wakes.')
    assert.equal(openingMessage?.surfaceOp, 'append')
    const routed = await ctx.waterfall('agent/request', { agent, turn: 2, step: 1, signal: new AbortController().signal }, () => Promise.resolve({ provider: 'default', model: 'default', temperature: 0.4 }))
    assert.deepEqual(routed, { provider: 'rp-test-provider', model: 'rp-test-model', temperature: 0.4 })
    const assembled = await ctx.waterfall('system-prompt/assemble', { sections: [], contexts: [], tools: [], variables: {} }, { agent }, () => Promise.resolve({ sections: [], contexts: [], tools: [], variables: {} }))
    assert.deepEqual(assembled.variables, { provider: 'rp-test-provider', model: 'rp-test-model' })
    const namespace = 'story'
    assert.deepEqual(ctx.rpState.get(agent).namespaces[namespace].value, { hp: 7, location: 'cliff' })
    assert.equal(ctx.rpState.get(agent).namespaces[namespace].definition.schema.properties.hp.description, 'current health')
    const linkedLorebookId = importedCharacter.embeddedLorebooks[0].id
    const gatedLorebook = await ctx.rpLoreBooks.detail(linkedLorebookId)
    await ctx.rpLoreBooks.update(linkedLorebookId, {
      entries: [...gatedLorebook.entries, {
        id: 'low-stamina', name: '低体力医务室', level: 'worldDescription', content: 'Low stamina unlocks the cliff infirmary.',
        enabled: true, constant: true, keys: [], secondaryKeys: [], position: 0,
        stateCondition: 'state("story", "/hp") <= 6',
      }],
    }, gatedLorebook.revision)
    const presetFields = await ctx.rpPresets.get(preset.id)
    const defaultLayout = await ctx.rpRuntime.resolveContextBuild(undefined, agent)
    const presetSlots = defaultLayout.slots.filter(slot => slot.sourceIds.some(id => id.startsWith('rp.preset:')))
    assert.deepEqual(presetSlots.map(slot => slot.sourceIds), presetFields.fields.map(field => [`rp.preset:${field.id}`]))
    assert.ok(presetSlots.every(slot => slot.id === slot.sourceIds[0]))
    const semanticOrder = defaultLayout.slots.map(slot => slot.label)
    assert.deepEqual(semanticOrder, [
      '声明', '任务描述', '写作指导', '角色卡信息', '人设信息', '世界设定',
      '扮演指导', '会话总结', '对话历史', '会话变量', '冷峻电影感', '测试文风', '重要规则', '当前输入', '思维链指导', '格式要求',
    ])
    const topPresetIds = presetFields.fields.slice(0, 3).map(field => `rp.preset:${field.id}`)
    const bottomPresetIds = presetFields.fields.slice(3).map(field => `rp.preset:${field.id}`)
    const writingStyleSourceIds = [writingStyle, secondaryWritingStyle].map(style => `rp.writing-style:${style.id}`)
    const migratedLayout = await ctx.rpRuntime.resolveContextBuild({ version: 1, slots: [
      { id: 'prompt-top', label: '顶部', sourceIds: topPresetIds },
      { id: 'prompt-bottom', label: '底部', sourceIds: ['rp.writing-style', ...bottomPresetIds] },
      { id: 'continuity', label: '连续性', sourceIds: ['rp.state'] },
    ] }, agent)
    assert.equal(migratedLayout.slots.some(slot => ['prompt-top', 'prompt-bottom', 'continuity'].includes(slot.id)), false)
    assert.deepEqual(
      migratedLayout.slots.filter(slot => slot.sourceIds.some(id => id.startsWith('rp.preset:'))).map(slot => slot.sourceIds),
      presetFields.fields.map(field => [`rp.preset:${field.id}`]),
    )
    assert.deepEqual(
      migratedLayout.slots.filter(slot => slot.sourceIds.some(id => id.startsWith('rp.writing-style:'))).map(slot => slot.sourceIds),
      writingStyleSourceIds.map(id => [id]),
    )
    assert.deepEqual(migratedLayout.slots.find(slot => slot.id === 'rp.state')?.sourceIds, ['rp.state'])

    const customSourceId = 'rp.custom:custom-1'
    const reorderedSlots = [...migratedLayout.slots]
    const firstStyleSlotIndex = reorderedSlots.findIndex(slot => slot.sourceIds.includes(writingStyleSourceIds[0]))
    ;[reorderedSlots[firstStyleSlotIndex], reorderedSlots[firstStyleSlotIndex + 1]] = [reorderedSlots[firstStyleSlotIndex + 1], reorderedSlots[firstStyleSlotIndex]]
    const withCustom = await ctx.rpSessions.setContextBuild(agent, {
      expectedRevision: ctx.rpSessions.get(agent).revision,
      contextBuild: {
        ...migratedLayout,
        slots: [...reorderedSlots, { id: 'custom-1', label: '港口气氛', sourceIds: [customSourceId] }],
        customSources: [{ slotId: 'custom-1', content: '雾气让所有远处灯火都显得模糊。' }],
      },
    })
    await ctx.rpSessions.setExecutionMode(agent, { expectedRevision: withCustom.revision, executionMode: 'chat' })
    assert.deepEqual(agentTools.registered?.parameters, CHAT_WRITER_PARAMETERS)
    const customPreview = await ctx.rpRuntime.previewContextBuild(agent)
    assert.deepEqual(customPreview.customSources, [{ slotId: 'custom-1', content: '雾气让所有远处灯火都显得模糊。' }])
    assert.equal(customPreview.sources.find(source => source.id === customSourceId).label, '港口气氛')
    const categories = new Map(customPreview.sources.map(source => [source.id, source.promptCategory]))
    for (const id of ['rp.card', 'rp.persona', 'rp.state', 'rp.conversation-summary', 'rp.conversation', 'rp.current-input']) assert.equal(categories.get(id), 'factual')
    assert.equal(customPreview.sources.find(source => source.id === 'rp.conversation-summary').available, false)
    assert.equal(customPreview.contexts.some(source => source.id === 'rp.conversation-summary'), false)
    assert.doesNotMatch(customPreview.contextText, /会话总结/)
    assert.ok(customPreview.sources.filter(source => source.id.startsWith('rp.lore.')).every(source => source.promptCategory === 'factual'))
    assert.ok(customPreview.sources.filter(source => source.id.startsWith('rp.preset:')).every(source => source.promptCategory === 'instructional'))
    assert.ok(writingStyleSourceIds.every(id => categories.get(id) === 'instructional'))
    assert.deepEqual(
      customPreview.layoutSlots.filter(slot => slot.sourceIds.some(id => id.startsWith('rp.writing-style:'))).map(slot => slot.sourceIds[0]),
      [writingStyleSourceIds[1], writingStyleSourceIds[0]],
    )
    assert.equal(categories.get(customSourceId), 'instructional')
    assert.equal(customPreview.contexts.find(source => source.id === customSourceId).text, '雾气让所有远处灯火都显得模糊。')
    assert.match(customPreview.contextText, /雾气让所有远处灯火都显得模糊。/)
    assert.equal(customPreview.sources.some(source => source.id === 'rp.session'), false)
    await ctx.rpSessions.setExecutionMode(agent, { expectedRevision: ctx.rpSessions.get(agent).revision, executionMode: 'agent' })
    await ctx.rpSessions.setWriterRoute(agent, {
      expectedRevision: ctx.rpSessions.get(agent).revision,
      route: { kind: 'fixed', provider: 'writer-provider', model: 'writer-model', reasoningEffort: 'high' },
    })
    assert.equal(agentTools.registered, undefined)

    agent.session.append('turn/start', { turn: 2 })
    const run = await ctx.rpRuntime.prepareRun(agent, 2, [{ role: 'user', source: { kind: 'user' }, content: [{ type: 'text', text: 'I listen at the harbor.' }] }])
    const stateRevisionBeforeCommit = ctx.rpState.get(agent).revision
    assert.deepEqual(run.writerRouteOverride, { provider: 'writer-provider', model: 'writer-model', reasoningEffort: 'high' })
    assert.equal(run.taskSubagents.size, 2)
    assert.deepEqual([...run.taskSubagents.values()].map(subagent => subagent.label), ['规划', '润色'])
    assert.equal(run.taskSubagents.get(outlineSubagent.id)?.toolFilter.allow.includes('rp_run_subagent'), false)
    assert.deepEqual(run.taskSubagents.get(outlineSubagent.id).toolFilter.allow, [])
    assert.equal(run.taskSubagents.get(outlineSubagent.id).route, undefined)
    assert.equal(run.taskSubagents.get(outlineSubagent.id).inputSchema.additionalProperties, true)
    const firstCardFragment = run.fragments.find(fragment => fragment.id === 'rp.card')
    assert.ok(firstCardFragment?.text.includes('Harbor Hero'))
    assert.ok(!firstCardFragment?.text.includes('The cliff road wakes.'))
    assert.equal(run.fragments.some(fragment => fragment.id === 'rp.session'), false)
    assert.ok(!firstCardFragment?.text.includes('The harbor wakes.'))
    const firstPresetFragments = run.fragments.filter(fragment => fragment.id.startsWith('rp.preset:'))
    assert.equal(firstPresetFragments.length, 5)
    assert.deepEqual(firstPresetFragments.map(fragment => fragment.defaultSlot.id), firstPresetFragments.map(fragment => fragment.id))
    assert.ok(firstPresetFragments.some(fragment => fragment.text.includes('保持港口谜团持续推进。') && !fragment.text.includes('每次回复使用两段。')))
    assert.ok(firstPresetFragments.every(fragment => !fragment.text.includes('仅供预设管理时说明用途。')))
    assert.ok(firstPresetFragments.some(fragment => fragment.text.includes('每次回复使用两段。') && !fragment.text.includes('保持港口谜团持续推进。')))
    const firstWritingStyleFragments = run.fragments.filter(fragment => fragment.id.startsWith('rp.writing-style:'))
    assert.deepEqual(firstWritingStyleFragments.map(fragment => fragment.id), [writingStyleSourceIds[1], writingStyleSourceIds[0]])
    assert.deepEqual(firstWritingStyleFragments.map(fragment => fragment.defaultSlot.id), firstWritingStyleFragments.map(fragment => fragment.id))
    assert.ok(firstWritingStyleFragments.some(fragment => fragment.id === writingStyleSourceIds[0] && fragment.text.includes('使用短句、近景和克制的对白。')))
    assert.ok(firstWritingStyleFragments.some(fragment => fragment.id === writingStyleSourceIds[1] && fragment.text.includes('环境描写保持疏离，并减少修辞。')))
    assert.ok(firstWritingStyleFragments.every(fragment => !fragment.text.includes('冷峻电影感') && !fragment.text.includes('适合悬疑场景。')))
    assert.ok(
      run.fragments.some(fragment => fragment.id === 'rp.lore.character-descriptions' && !fragment.text.includes('<character_descriptions>') && fragment.text.includes('Current HP=7')),
      JSON.stringify({ fragments: run.fragments, excludedFragments: run.excludedFragments }),
    )
    assert.ok(run.fragments.some(fragment => fragment.id === 'rp.lore.world-description' && !fragment.text.includes('<world_description>') && fragment.text.includes('tidal shelf')))
    assert.ok(run.fragments.every(fragment => !fragment.text.includes('Low stamina unlocks the cliff infirmary.')))
    assert.ok(run.fragments.some(fragment => fragment.id === 'rp.lore.important-rules' && !fragment.text.includes('<in_world_rules>') && fragment.text.includes('tide gate')))
    const fragmentOrder = run.fragments.map(fragment => fragment.id)
    assert.ok(fragmentOrder.indexOf('rp.card') < fragmentOrder.indexOf('rp.lore.world-description'))
    assert.ok(fragmentOrder.indexOf('rp.lore.world-description') < fragmentOrder.indexOf('rp.lore.character-descriptions'))
    assert.ok(fragmentOrder.indexOf('rp.lore.character-descriptions') < fragmentOrder.indexOf('rp.lore.important-rules'))
    agent.session.append('step/start', { turn: 2, step: 1 })
    agent.session.append('user/message', createUserMessage({
      source: { kind: 'user' },
      content: [{ type: 'text', text: 'I listen at the harbor.' }],
    }), { surfaceOp: 'append' })
    agent.session.append('request/header', {
      header: { config: { provider: 'rp-test-provider', model: 'rp-test-model' } },
      reason: 'initial',
    })
    const replyOptionExtensions = {
      'rp.reply-options': {
        options: [
          'The hero listens at the door and asks who is outside.',
          'She steps back toward the window and looks for another way out.',
          'The hero opens the door and faces whoever is waiting there.',
        ],
      },
    }
    const invalidArgs = {
      runSummary: 'x', references: [], extensions: replyOptionExtensions,
      effects: [{ kind: 'state.update', namespace, expectedRevision: 0, payload: { changes: [{ op: 'set', path: '/hp', value: 9, reason: '错误的版本号' }] } }],
    }
    agent.session.append('assistant/message', {
      turn: 2, step: 1, message: createAssistantMessage({
        source: { provider: 'rp-test-provider', model: 'rp-test-model' }, content: [
        { type: 'text', text: 'An invalid stale-state attempt.' },
        { type: 'tool-call', id: 'commit-invalid', name: 'rp_commit_turn', arguments: JSON.stringify(invalidArgs) },
      ] }),
    }, { surfaceOp: 'append' })
    agent.session.append('tool/call', { turn: 2, step: 1, callId: 'commit-invalid', name: 'rp_commit_turn', arguments: JSON.stringify(invalidArgs) })
    seedWriter(run, 'An invalid stale-state attempt.')
    await assert.rejects(tools.get('rp_commit_turn').execute(invalidArgs, { agent, callId: 'commit-invalid', turn: 2, step: 1, concludeTurn() {} }), /revision conflict/i)
    assert.deepEqual(ctx.rpState.get(agent).namespaces[namespace].value, { hp: 7, location: 'cliff' })

    let concluded = false
    const loreRevision = run.fragments.find(fragment => fragment.id === 'rp.lore.character-descriptions').revision
    const commitArgs = {
      runSummary: 'The hero heard the dawn bell.', references: [{ source: 'rp.lore.character-descriptions', id: '1', revision: loreRevision }], extensions: replyOptionExtensions,
      effects: [{
        kind: 'state.update', namespace, expectedRevision: 1,
        payload: { changes: [{ op: 'set', path: '/hp', value: 6, reason: '赶路让旧伤继续消耗体力' }] },
      }],
    }
    const assistantEvent = agent.session.append('assistant/message', {
      turn: 2, step: 1, message: createAssistantMessage({
        source: { provider: 'rp-test-provider', model: 'rp-test-model' }, content: [
        { type: 'text', text: 'The dawn bell rolls across the water.' },
        { type: 'tool-call', id: 'commit', name: 'rp_commit_turn', arguments: JSON.stringify(commitArgs) },
      ] }),
    }, { surfaceOp: 'append' })
    const commitCall = agent.session.append('tool/call', { turn: 2, step: 1, callId: 'commit', name: 'rp_commit_turn', arguments: JSON.stringify(commitArgs) })
    seedWriter(run, 'The dawn bell rolls across the water.')
    const committed = await tools.get('rp_commit_turn').execute(commitArgs, { agent, callId: 'commit', turn: 2, step: 1, concludeTurn() { concluded = true } })
    assert.equal(concluded, true)
    assert.deepEqual(committed.meta.assistant, { seq: assistantEvent.seq, messageId: assistantEvent.data.message.id })
    assert.deepEqual(committed.meta.extensions['rp.reply-options'], {
      version: 1,
      options: replyOptionExtensions['rp.reply-options'].options,
    })
    assert.equal('narrative' in committed, false)
    agent.session.append('tool/result', {
      turn: 2,
      step: 1,
      message: createToolResultMessage({
        callId: 'commit', content: [{ type: 'text', text: 'Roleplay turn committed.' }], isError: false,
      }),
      meta: committed.meta,
    }, { surfaceOp: 'append', sourceEventSeqs: [commitCall.seq] })
    assert.equal(ctx.rpState.get(agent).namespaces[namespace].value.hp, 6)

    const stateBeforeModeRoundTrip = ctx.rpState.get(agent)
    const profileBeforeModeRoundTrip = ctx.rpSessions.get(agent)
    const chatProfile = await ctx.rpSessions.setExecutionMode(agent, {
      expectedRevision: profileBeforeModeRoundTrip.revision,
      executionMode: 'chat',
    })
    assert.equal(chatProfile.runtime.executionMode, 'chat')
    assert.deepEqual(chatProfile.resources, profileBeforeModeRoundTrip.resources)
    assert.deepEqual(chatProfile.contextBuild, profileBeforeModeRoundTrip.contextBuild)
    assert.deepEqual(ctx.rpState.get(agent), stateBeforeModeRoundTrip)
    assert.deepEqual(agentTools.registered?.parameters, CHAT_WRITER_PARAMETERS)
    const agentProfileAfterRoundTrip = await ctx.rpSessions.setExecutionMode(agent, {
      expectedRevision: chatProfile.revision,
      executionMode: 'agent',
    })
    assert.equal(agentProfileAfterRoundTrip.runtime.executionMode, 'agent')
    assert.deepEqual(agentProfileAfterRoundTrip.resources, profileBeforeModeRoundTrip.resources)
    assert.deepEqual(agentProfileAfterRoundTrip.contextBuild, profileBeforeModeRoundTrip.contextBuild)
    assert.deepEqual(ctx.rpState.get(agent), stateBeforeModeRoundTrip)
    assert.equal(agentTools.registered, undefined)

    const stateRefreshedLore = await ctx.rpLoreBooks.assembleLore({
      agent, runId: 'state-revision-check',
      messages: [{ role: 'user', content: [{ type: 'text', text: 'I look for help.' }] }],
    })
    assert.notEqual(ctx.rpState.get(agent).revision, stateRevisionBeforeCommit)
    assert.match(stateRefreshedLore.revision, new RegExp(`rp\\.state\\.conditions:${ctx.rpState.get(agent).revision}(?:,|$)`))
    assert.ok(Object.values(stateRefreshedLore.groups).flat().some(entry => entry.content.includes('Low stamina unlocks the cliff infirmary.')))

    const currentLorebook = await ctx.rpLoreBooks.detail(linkedLorebookId)
    await ctx.rpCharacterCards.update(imported.id, { name: 'Harbor Hero Revised' }, imported.revision)
    await ctx.rpLoreBooks.update(linkedLorebookId, {
      entries: currentLorebook.entries.map((entry, index) => index === 1 ? { ...entry, content: 'The revised harbor bell rings at midnight.' } : entry),
    }, currentLorebook.revision)
    await ctx.rpWritingStyles.update(writingStyle.id, { name: '冷峻电影感', description: '', content: '使用短句和远景，删去解释性对白。' }, writingStyle.revision)
    const presetDetail = await ctx.rpPresets.get(preset.id)
    await ctx.rpPresets.update(preset.id, {
      name: presetDetail.name,
      description: presetDetail.description,
      fields: presetDetail.fields.map(field => field.name === '任务描述' ? { ...field, content: '把港口谜团推进到午夜钟声。' } : field),
    }, preset.revision)
    agent.session.append('step/end', { turn: 2, step: 1 })
    agent.session.append('turn/end', { turn: 2, reason: { kind: 'completed' } })
    agent.session.append('turn/start', { turn: 3 })
    const nextRun = await ctx.rpRuntime.prepareRun(agent, 3, [{ role: 'user', source: { kind: 'user' }, content: [{ type: 'text', text: 'I wait for the revised harbor bell.' }] }])
    const nextCardFragment = nextRun.fragments.find(fragment => fragment.id === 'rp.card')
    assert.ok(nextCardFragment?.text.includes('Harbor Hero Revised'))
    assert.notEqual(nextCardFragment.revision, firstCardFragment.revision)
    assert.ok(nextRun.fragments.some(fragment => fragment.id === 'rp.lore.character-descriptions' && fragment.text.includes('revised harbor bell')))
    const stateFragment = nextRun.fragments.find(fragment => fragment.id === 'rp.state')
    assert.match(stateFragment?.text ?? '', /"hp": 6/)
    assert.doesNotMatch(stateFragment.text, /current health|expectedRevision|state\.update|schema|rules|diagnostics|initialValue/)
    assert.match(stateFragment.parentText, /"description":"current health"/)
    assert.match(stateFragment.parentText, /"expectedRevision":2/)
    assert.match(stateFragment.parentText, /"effectKind":"state\.update"/)
    assert.doesNotMatch(stateFragment.parentText, /initialValue|ValueWithDescription|state\.patch|payload\.namespace|writable/)
    assert.equal(Object.hasOwn(stateFragment, 'directorText'), false)
    assert.ok(nextRun.fragments.some(fragment => fragment.id.startsWith('rp.preset:') && fragment.text.includes('把港口谜团推进到午夜钟声。')))
    assert.ok(nextRun.fragments.every(fragment => !fragment.id.startsWith('rp.preset:') || !fragment.text.includes('保持港口谜团持续推进。')))
    assert.ok(nextRun.fragments.some(fragment => fragment.id === writingStyleSourceIds[0] && fragment.text.includes('使用短句和远景，删去解释性对白。')))
    assert.deepEqual(nextRun.fragments.filter(fragment => fragment.id.startsWith('rp.writing-style:')).map(fragment => fragment.id), [writingStyleSourceIds[1], writingStyleSourceIds[0]])
    const historicalCard = firstCardFragment
    assert.match(historicalCard.text, /Harbor Hero/)
    assert.doesNotMatch(historicalCard.text, /Harbor Hero Revised/)
    assert.deepEqual(ctx.rpSessions.get(agent).resources, {
      card: { id: imported.id },
      lorebooks: [{ id: linkedLorebookId }],
      preset: { id: preset.id },
      writingStyles: [{ id: writingStyle.id }, { id: secondaryWritingStyle.id }],
    })

    for (const key of ['rp/session', 'rp/state']) {
      const definition = projections.get(key)
      assert.ok(definition)
      assert.equal(typeof definition.stateSchema?.parse, 'function')
      assert.equal(typeof definition.wire?.viewSchema?.parse, 'function')
      assert.equal(typeof definition.wire?.view, 'function')
      assert.equal(Object.hasOwn(definition, 'schema'), false)
      assert.equal(Object.hasOwn(definition, 'view'), false)
    }
    assert.equal(agent.session.events.some(event => event.type.startsWith('rp/')), false)
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

function seedWriter(run, narrative) {
  run.writerArtifact = {
    kind: 'rp-agent/writer-result', version: 1, runId: run.runId,
    writerSessionId: 'composition-writer', provider: 'rp-test-provider', model: 'rp-test-model',
    promptHash: 'composition-prompt', narrative,
  }
}

function fakeAgentTools() {
  let registered
  let allowed
  return {
    get registered() { return registered },
    get allowed() { return allowed },
    register(tool) {
      registered = tool
      return () => {
        if (registered === tool) registered = undefined
      }
    },
    restrict(value) {
      allowed = value.allow
      return () => { allowed = undefined }
    },
  }
}

function fakeCommands() {
  const definitions = new Map()
  let sequence = 0
  return {
    register(value) {
      definitions.set(value.name, value)
      return () => { definitions.delete(value.name) }
    },
    async execute(agent, line, signal) {
      const commandName = line.slice(1).split(/\s/, 1)[0]
      const definition = definitions.get(commandName)
      if (definition === undefined) throw new Error(`unknown command: ${commandName}`)
      const rawInput = line.slice(definition.name.length + 1)
      const commandId = `command-${++sequence}`
      agent.session.append('command/run', { commandId, name: definition.name, args: rawInput, source: { kind: 'user' } })
      try {
        const result = await definition.handler({ agent, commandId, rawInput, signal })
        agent.session.append('command/done', { commandId, kind: result.kind, ...(result.text === undefined ? {} : { text: result.text }) })
        return { commandId, result }
      } catch (error) {
        agent.session.append('command/done', { commandId, kind: 'error', text: error.message })
        throw error
      }
    },
  }
}
