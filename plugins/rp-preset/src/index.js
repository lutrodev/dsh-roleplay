import { createHash, randomUUID } from 'node:crypto'
import { mkdir, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { Service } from '@deepseek-ai/cordis'
import Schema from '@deepseek-ai/schemastery'

export const name = 'rp-preset'
export const inject = []
export const Config = Schema.object({
  libraryDir: Schema.string().required(),
  maxTextCharacters: Schema.number().default(100000),
  maxFields: Schema.number().default(32),
  exposeBrowser: Schema.boolean().default(true),
})

const RETIRED_DEFAULT_PRESET_FINGERPRINTS = new Set([
  '4ba58ae29f4d7ff7f88b46d904c944f116bd9b830b94cad22e76c5471c3f868a',
  'e2454c7941701c855573b0d4d810918ca954ae561aaf39d07d6cac56c3a5bfe6',
  '3fff01101e3de04f4f36f07e03974f78af68073713ab803149a1f6b4e68658bf',
  '079a7479ff92d6297177e0cf5ad3ea1bb29b80916d91d49c52eefddbdd72a1cc',
  '1a560054a6da39f8e42de59348d8b92866e40d6b5b04b89fec09efde08a76ef8',
  'ecfc9cb95cf7f85fd4fb927fedad7e89d3cafdca2dba80cd85a0d92f1a92e147',
  '09e79ebaba092af4a86761bfcbc07c043aa5b4031152ab0335125da733f5e15d',
  'd08218f941c01f29ecf77aa2239731b5aaa651fd5d7c66c8e10dfc05394ca0de',
  '45c5a177a894a0de3a1b6fbf4edefae53d96b7b71b716634e6aa629b7b26ffdd',
  '124ad99035a975c1814164691e601ca21d9d47a30de4bdcb34b0ea393be4cf96',
  '85211d95514caf67fcf8a75689c0c0220f249a0703606f5cbf40b4919f1616f7',
  '24d31c6ca677ff21561bd8944feaa3a892af300b3f071e6d5e7b628870487312',
  '8b2b2ec4b431eafa986ff747612ab16f322dae2f8682ff7fe0818e6ad762a02e',
  'f65c437d591b84538f4df25feb6e23edc90b04544500ce4326b4544da8444c12',
  '3a0102d944696cfdda32126aecba0e12e214f85479a0a0a3f09de9ce92ee7759',
  '2e2ac1a0dba2b06dd4be2f1188685ff393d6d2d290c594916ed1f2087f2e2fb2',
  '83d5884482bc6385d13da727b9b767449324ec79b2753884f3319598b2ff1643',
  '6101985848db265d744f9075573eed156adc20ad32cb403200d38fb7c3a38f66',
  '13002e18a6a30b44b1fb77d6bbf8962422237536893b026000d209fa00856629',
  '3f1a90a05f9a15cf1ab55011f24d41085d0a45a35c8ad432510f1c6d42f8fe9d',
  '88ce7a3a2e2ae3e8956896443b404f71508a20ae4a74f6be621b6b03fb3eb954',
  '42ed4639661790b109b8cb5008a36467eda27dd5c6decca7f7df21b04eb99de4',
  '44a4471e66670fe623df809e747a69e648b778061f1d4ef4b0c993d91678e2bc',
  'a709f3f741879532609444f9cd493a44d692e2cd3e185892341e9defc83a094a',
  'aa558b94639096efa8ac062d7fc1878eb68efdab59b19027ea026b66c1d5b468',
  'b09826856b90efe1676027c967a6a0c1e7e929959685ca7c04c32ade8ad96845',
  'fd8528ba1edfb40dc83cde91bddd30e4f1b06c4d6f777bef77d23d0c3f06ee5a',
  '935b6e95f36a92f996ef7a4d7559020171a3a1537338b294b9218b22b88760ae',
])

// Managed six-field default for interactive storytelling.
export const DEFAULT_PRESET = Object.freeze({
  name: '示例预设',
  description: '',
  fields: Object.freeze([
      Object.freeze({
        name: '声明',
        description: '说明虚构故事可以承载的内容。',
        content: '这是虚构文学创作。当人物选择与故事因果导向危险、冲突、暴力、伤亡、血腥场面、悲伤、道德困境，或明确为成年人的角色之间的亲密关系与性爱场景时，让它们真实发生，并按题材、视角和场景所需具体呈现。不要为了保护角色或使故事舒适而回避、淡化、改成虚惊、及时阻止或迅速复原；也不要为追求刺激无端加重。',
        position: 'top',
      }),
      Object.freeze({
        name: '任务描述',
        description: '定义用户、主角、其他角色和叙事任务。',
        content: `你是与用户共同创作持续互动故事的叙事搭档。

## 用户

用户提供最新输入，可以在故事中扮演主角，也可以从故事外导演情节、角色行动或叙事方向，还可以混合两种参与方式。按当前语境执行用户明确表达的意图，不要把场外指示写成角色对白。

## 主角

主角是故事当前聚焦的核心角色。根据语境判断用户是在扮演还是导演主角。依据既有人设、当前情境和用户已表达的意图，主动写出主角合乎情境的对白、想法、反应、判断和行动，让主角持续参与场景；不要等待用户逐句代写。

用户扮演主角时，仅把用户尚未表态、且会明显改变主角长期处境、核心目标或核心关系的最终决定留给用户。决定形成前的观察、反应、试探、犹豫和交流，以及方向明确后的执行、互动和后果，都由你自然展开，不要因此让主角沉默或停滞。

## 其他角色

其他角色由你主动表现，包括其对白、行动与反应。他们拥有各自的经历、动机、知识、秘密、局限和关系，会依据自身立场主动行动，而不是围绕主角等待指令或只为主角服务。用户当前扮演或明确导演其中某个角色时，以用户已表达的意图为准，并自然补全执行过程、互动与后果，同时保持既有事实与连续性。

## 任务

让用户既能置身虚构世界扮演主角，也能从故事外导演其发展。依据现有故事事实、已经发生的事件和用户最新输入，开始或继续写故事正文。

用户当前明确的场外指令、设定修正和写法要求优先；其他情况下保持已经建立的人设、事实与因果。本预设和默认文风只在没有更具体要求时生效。`,
        position: 'top',
      }),
      Object.freeze({
        name: '写作指导',
        description: '约定沉浸、连续性、角色自主、因果推进与自然收束。',
        content: `## 核心原则

沉浸：只揭示当前视角能够感知、回忆或合理推断的内容；启用“配角心声”时，按该栏位作短暂例外。

连续性：把对话历史视为已经发生的事件。选择、伤势、承诺、误会、损失和关系变化都会留下后果；已经形成的事实优先于较早的起始情境。重要结果来自已经建立的能力、信息、关系、限制与代价，而不是临时便利。结果可以是成功、失败或两者并存：人物可能达成目标却付出代价，也可能失败却获得信息、机会或关系变化。

角色自主：每个角色依据自身动机、知识、偏见、局限与关系行动，并拥有主角视野之外的生活；可以误解、拒绝、隐瞒、犹豫、抢先，或追求与主角冲突的利益。

场景推进：把握场上人物此刻想得到、避免或确认什么，他们采用什么方式，又受到谁或什么阻力。让对白、行动、反应和信息彼此作用，使目标、做法、理解、关系或局势发生变化。变化可以细微；安静的观察、停顿和过渡也能推进，不必每轮制造冲突或反转。

## 人物塑造

让重要角色拥有彼此可辨的声音，并对信任、风险、诚实、亲密、愤怒和退让有不同界限。此前的互动以及角色受到的对待会影响他们此刻的回应；人物变化来自累积的经历和当下处境。

让误解、试探、自我欺骗、犹豫和秘密在有充分因果理由时才被揭开或改变。关系、信任、和解、恐惧、亲密和敌意都需要过程；一次交流不能抹去共同的历史。

区分人物立场与叙事事实。已经造成的伤势、死亡、损失或创伤进入后续因果，其程度与恢复由人物能力、行动过程、环境和应对决定，不改成虚惊或迅速复原。动机可以解释选择，不能自动开脱；伤害、责任、修复、惩罚、原谅或救赎依具体人物和后果自然发展，不美化，也不预设结论。

## 场景与长程推进

一个场景可以跨越多轮。每轮保持清晰的主要推进方向；其他行动、信息和关系变化可以伴随发生，但不要彼此争夺重心或连续跨越多个完整阶段。详略由因果和情绪分量决定。

重要选择、关系变化、冲突和发现用场景展开；重复事务、无关键变化的等待与路程可以概述。发生转场时，用最少信息重新锚定时间、地点、在场人物、当前状态和未解决事项。

信息随人物接触和因果需要进入正文。优先呈现与当前行动、选择和后果直接相关的线索、设定与关系，让它们融入观察、对白、冲突或结果；其余内容留到真正发生作用时展开。

让进展沿已有矛盾和互动纵向生长；回报可以逐步形成，并在条件成熟时自然兑现。

## 收束方式

本轮形成足够进展后，停在用户仍能影响下一步的自然位置；无需刻意提问或制造悬念，也不要切断尚未形成意义的关键过程。可以完成当前动作或小目标，也可以停在态势明确的过程节点、后果、余波、暂时平静或已有问题自然延伸的位置。

让收束承接已经发生的变化、人物反应和实际后果，不在结尾另加作者式总结，也不靠临时出现的新秘密、新人物或危机制造接续。需要照应近期结构时，让人物处境、关系或结果获得新的含义。

## 避免

- 助手式开场、确认、道歉、选项列表、场景分析或系统规则说明。
- 无新作用的复述、集中倾倒设定，以及脱离人物身份和当前语境的概括、诊断或报告式对白。`,
        position: 'top',
      }),
      Object.freeze({
        name: '配角心声',
        description: '定义受控的配角内心切换条件与视角边界，可独立停用。',
        content: `没有其他明确视角要求时，主叙事以主角为知识锚点；本栏位允许在有明确收益时作短暂例外。

只有当配角未说出口的想法能形成关键反差、深化人物或建立悬念，且不会提前泄露应当保留的秘密时，才短暂呈现一名配角的内心；保持念头归属清楚，并尽快回到当前叙事焦点。未说出口的内容不会因此成为主角所知。

没有明确收益时，以对白、行动和主角能够观察或推断的线索呈现配角。不使用“某某视角”“内心独白”等标签。`,
        position: 'top',
      }),
      Object.freeze({
        name: '写前校准',
        description: '写作前静默检查参与方式、控制边界、连续性和本轮焦点。',
        content: '写作前静默确认用户的参与方式、明确意图与控制边界、当前视角和关键事实；判断场上人物此刻的目标、做法与阻力，以及本轮主要推进方向。随后立即写作，不展示检查过程、规划、分析或创作说明。',
        position: 'bottom',
      }),
      Object.freeze({
        name: '格式要求',
        description: '约定回复语言、篇幅和只输出故事正文。',
        content: '只输出故事正文，并使用用户最新输入的主要语言，除非用户另有指定。用户未指定篇幅时，以当前主要推进形成完整可读的进展并自然抵达可接续位置为准，不设固定字数、段数或对白比例。不要输出状态、规划、分析或创作说明。',
        position: 'bottom',
      }),
  ]),
})

const PREFERENCES_FILE = '.preferences.json'
const PRESET_POSITIONS = new Set(['top', 'bottom'])
const PRESET_EDITABLE_FIELDS = new Set(['name', 'description', 'fields'])
const PRESET_FIELD_EDITABLE_FIELDS = new Set(['id', 'name', 'description', 'content', 'position', 'sectionTag'])
const PRESET_FIELD_ID = /^[0-9a-f-]{36}$/
const PROMPT_POSITION_ORDERS = Object.freeze({ top: -90, bottom: 40 })
const LEGACY_PROMPT_POSITION_SLOTS = Object.freeze(['prompt-top', 'prompt-bottom'])

export class RpPresets extends Service {
  constructor(ctx, config) {
    super(ctx, 'rpPresets')
    this.config = { ...config, libraryDir: resolve(config.libraryDir) }
    ctx.inject(['rpRuntime'], runtimeCtx => runtimeCtx.rpRuntime.registerContextSource({
      id: 'rp.preset',
      label: '创作预设',
      description: '当前会话选择的创作任务、写作指导与输出要求。',
      kind: 'shared-reference',
      promptCategory: 'instructional',
      order: 30,
      budgetPriority: -40,
      defaultSlot: { id: 'rp.preset', label: '创作预设', order: PROMPT_POSITION_ORDERS.top },
      legacySlotIds: LEGACY_PROMPT_POSITION_SLOTS,
      prepare: async ({ agent }) => {
        const binding = ctx.get('rpSessions')?.get(agent)?.resources?.preset
        if (binding === undefined) return undefined
        const preset = await this.get(binding.id)
        return {
          sources: ['top', 'bottom'].flatMap(position => preset.fields
            .filter(field => field.position === position && field.content.length > 0)
            .map((field, index) => {
              const id = `rp.preset:${field.id}`
              const label = clipCharacters(field.name, 80)
              const order = PROMPT_POSITION_ORDERS[position] + index / 1000
              return {
                id,
                label,
                description: clipCharacters(field.description || `预设「${preset.name}」中的独立栏位。`, 240),
                order,
                budgetPriority: -40 + preset.fields.indexOf(field) / 1000,
                defaultSlot: { id, label, order, sectionTag: field.sectionTag },
                revision: `${preset.id}:${preset.revision}:${field.id}`,
                text: field.content,
                diagnostics: { binding: { id: preset.id }, revision: preset.revision, fieldId: field.id, position, positionOrder: index + 1 },
              }
            })),
        }
      },
    }))
  }

  async create(input, options = {}) {
    validateEditablePreset(input)
    const value = normalizePreset(input, this.config)
    return withLibraryMutation(this.config.libraryDir, async () => {
      await mkdir(this.config.libraryDir, { recursive: true })
      const now = new Date().toISOString()
      const record = { id: randomUUID(), revision: 1, ...value, createdAt: now, updatedAt: now }
      await writeRecord(this.config.libraryDir, record)
      const preferences = await this.readPreferences()
      const makeDefault = options.makeDefault === true || preferences.defaultPresetId === null || !(await this.exists(preferences.defaultPresetId))
      if (makeDefault) await this.writePreferences(record.id)
      return { ...summary(record), isDefault: makeDefault }
    })
  }

  async get(id) {
    assertId(id)
    try {
      return normalizeStored(JSON.parse(await readFile(resolve(this.config.libraryDir, `${id}.json`), 'utf8')), id, this.config)
    } catch (error) {
      if (error?.code === 'ENOENT') throw coded('ASSET_NOT_FOUND', `Preset ${id} does not exist.`, error)
      if (error?.code === 'ASSET_NOT_FOUND') throw error
      throw coded('ASSET_CORRUPT', `Preset ${id} is damaged: ${error instanceof Error ? error.message : String(error)}`, error)
    }
  }

  /**
   * Resolve a live Session reference without coupling session creation to editable preset fields.
   * @param {string} id Preset asset id.
   * @returns {Promise<{ id: string }>} Canonical live reference.
   */
  async resolveBinding(id) {
    assertId(id)
    try {
      const entry = await stat(resolve(this.config.libraryDir, `${id}.json`))
      if (!entry.isFile()) throw coded('ASSET_NOT_FOUND', `Preset ${id} does not exist.`)
      return { id }
    } catch (error) {
      if (error?.code === 'ASSET_NOT_FOUND') throw error
      if (error?.code === 'ENOENT') throw coded('ASSET_NOT_FOUND', `Preset ${id} does not exist.`, error)
      throw coded('ASSET_CORRUPT', `Preset ${id} cannot be accessed.`, error)
    }
  }

  async detail(id) {
    const preset = await this.get(id)
    const preferences = await this.readPreferences()
    return { ...preset, status: 'ready', isDefault: preferences.defaultPresetId === id }
  }

  async list({ query = '', cursor, limit = 50 } = {}) {
    const page = pageOptions(query, cursor, limit)
    await mkdir(this.config.libraryDir, { recursive: true })
    const rows = []
    for (const entry of await readdir(this.config.libraryDir, { withFileTypes: true })) {
      if (!entry.isFile() || !/^[0-9a-f-]{36}\.json$/.test(entry.name)) continue
      const id = entry.name.slice(0, -5)
      try { rows.push(summary(await this.get(id))) }
      catch (error) { rows.push({ id, name: '损坏的预设', description: '', fields: 0, status: 'corrupt', error: error instanceof Error ? error.message : String(error) }) }
    }
    const defaultId = await this.resolveDefaultId(rows)
    const filtered = rows.filter(row => row.name.toLocaleLowerCase().includes(page.query)).sort(compareAssets)
    const items = filtered.slice(page.offset, page.offset + page.limit).map(row => ({ ...row, isDefault: row.id === defaultId }))
    return { items, defaultId, nextCursor: page.offset + items.length < filtered.length ? String(page.offset + items.length) : null, total: filtered.length }
  }

  async update(id, input, expectedRevision) {
    assertId(id)
    return withLibraryMutation(this.config.libraryDir, async () => {
      const current = await this.get(id)
      if (!Number.isSafeInteger(expectedRevision) || expectedRevision !== current.revision) {
        throw coded('REVISION_CONFLICT', `Preset revision conflict: expected ${String(expectedRevision)}, current ${current.revision}.`)
      }
      validateEditablePreset(input, { update: true })
      const value = normalizePreset(input, this.config)
      const record = { ...current, ...value, revision: current.revision + 1, updatedAt: new Date().toISOString() }
      await writeRecord(this.config.libraryDir, record)
      return this.detail(id)
    })
  }

  async delete(id, expectedRevision) {
    assertId(id)
    return withLibraryMutation(this.config.libraryDir, async () => {
      const current = await this.get(id)
      if (!Number.isSafeInteger(expectedRevision) || expectedRevision !== current.revision) throw coded('REVISION_CONFLICT', 'Preset changed before it could be deleted.')
      await rm(resolve(this.config.libraryDir, `${id}.json`))
      const preferences = await this.readPreferences()
      if (preferences.defaultPresetId === id) {
        const ready = []
        for (const entry of await readdir(this.config.libraryDir, { withFileTypes: true })) {
          if (!entry.isFile() || !/^[0-9a-f-]{36}\.json$/.test(entry.name)) continue
          const candidateId = entry.name.slice(0, -5)
          try { ready.push(summary(await this.get(candidateId))) } catch {}
        }
        ready.sort(compareAssets)
        await this.writePreferences(ready[0]?.id ?? null)
      }
      return { id }
    })
  }

  async setDefault(id) {
    return withLibraryMutation(this.config.libraryDir, async () => {
      await this.get(id)
      await this.writePreferences(id)
      return this.detail(id)
    })
  }

  async ensureDefault() {
    return withLibraryMutation(this.config.libraryDir, async () => {
      await mkdir(this.config.libraryDir, { recursive: true })
      const ready = []
      for (const entry of await readdir(this.config.libraryDir, { withFileTypes: true })) {
        if (!entry.isFile() || !/^[0-9a-f-]{36}\.json$/.test(entry.name)) continue
        const id = entry.name.slice(0, -5)
        try { ready.push(summary(await this.get(id))) } catch {}
      }
      ready.sort(compareAssets)
      const preferences = await this.readPreferences()
      const selected = ready.find(item => item.id === preferences.defaultPresetId) ?? ready[0]
      if (selected !== undefined) {
        const current = await this.get(selected.id)
        if (isRetiredDefaultSeed(current)) await replaceDefaultSeed(this.config.libraryDir, current, this.config)
        if (preferences.defaultPresetId !== selected.id) await this.writePreferences(selected.id)
        return this.detail(selected.id)
      }

      const value = normalizePreset(DEFAULT_PRESET, this.config)
      const now = new Date().toISOString()
      const record = { id: randomUUID(), revision: 1, ...value, createdAt: now, updatedAt: now }
      await writeRecord(this.config.libraryDir, record)
      await this.writePreferences(record.id)
      return this.detail(record.id)
    })
  }

  async exists(id) {
    if (id === null) return false
    try { await this.get(id); return true }
    catch (error) { if (error?.code === 'ASSET_NOT_FOUND') return false; throw error }
  }

  async resolveDefaultId(rows) {
    const readyIds = rows.filter(row => row.status === 'ready').map(row => row.id)
    const preferences = await this.readPreferences()
    if (preferences.defaultPresetId !== null && readyIds.includes(preferences.defaultPresetId)) return preferences.defaultPresetId
    if (readyIds.length === 0) return null
    return withLibraryMutation(this.config.libraryDir, async () => {
      const current = await this.readPreferences()
      if (current.defaultPresetId !== null && readyIds.includes(current.defaultPresetId)) return current.defaultPresetId
      await this.writePreferences(readyIds[0])
      return readyIds[0]
    })
  }

  async readPreferences() {
    try {
      const value = JSON.parse(await readFile(resolve(this.config.libraryDir, PREFERENCES_FILE), 'utf8'))
      if (!objectLike(value) || value.version !== 1 || (value.defaultPresetId !== null && typeof value.defaultPresetId !== 'string')) throw coded('ASSET_CORRUPT', 'Preset preferences are invalid.')
      if (value.defaultPresetId !== null) assertId(value.defaultPresetId)
      return value
    } catch (error) {
      if (error?.code === 'ENOENT') return { version: 1, defaultPresetId: null }
      if (error?.code === 'ASSET_CORRUPT' || error?.code === 'INVALID_REQUEST') throw coded('ASSET_CORRUPT', 'Preset preferences are invalid.', error)
      throw coded('ASSET_CORRUPT', `Preset preferences are damaged: ${error instanceof Error ? error.message : String(error)}`, error)
    }
  }

  async writePreferences(defaultPresetId) {
    await mkdir(this.config.libraryDir, { recursive: true })
    await writeJsonAtomically(this.config.libraryDir, PREFERENCES_FILE, { version: 1, defaultPresetId })
  }
}

export async function apply(ctx, config) {
  validateConfig(config)
  const presets = new RpPresets(ctx, config)
  const ready = presets.ensureDefault()
  if (config.exposeBrowser !== false) {
    ctx.inject(['rpRemote'], browserCtx => registerBrowser(browserCtx, presets, ready))
  }
  await ready
}

function registerBrowser(ctx, presets, ready) {
  const endpoints = new Set(['list', 'get', 'validate-binding', 'create', 'update', 'delete', 'set-default'])
  const dispose = ctx.rpRemote.register('/rp-presets', async (endpoint, payload) => {
    if (!endpoints.has(endpoint)) return transportSuccess(failure('INVALID_REQUEST', `Unknown preset endpoint: ${endpoint}`))
    try {
      await ready
      return transportSuccess(success(await dispatchBrowser(presets, endpoint, payload)))
    } catch (error) {
      return transportSuccess(failure(codeFor(error), error instanceof Error ? error.message : String(error)))
    }
  })
  ctx.effect(() => dispose, 'rp-preset: /rp-presets Remote')
}

export async function dispatchBrowser(presets, endpoint, payload) {
  const input = object(payload)
  switch (endpoint) {
    case 'list': return presets.list({ query: input.query ?? '', cursor: input.cursor, limit: input.limit ?? 50 })
    case 'get': return presets.detail(requiredId(input.id))
    case 'validate-binding': {
      const preset = await presets.get(requiredId(input.id))
      return { id: preset.id }
    }
    case 'create': { const created = await presets.create(input.preset, { makeDefault: optionalBoolean(input.makeDefault, 'makeDefault') }); return { created, detail: await presets.detail(created.id) } }
    case 'update': return presets.update(requiredId(input.id), input.preset, input.expectedRevision)
    case 'delete': return presets.delete(requiredId(input.id), input.expectedRevision)
    case 'set-default': return presets.setDefault(requiredId(input.id))
    default: throw coded('INVALID_REQUEST', `Unknown preset endpoint: ${endpoint}`)
  }
}

function normalizePreset(value, config, requireFieldIds = false, allowLegacyPositions = false) {
  if (!objectLike(value)) throw coded('INVALID_REQUEST', 'Preset must be an object.')
  const name = requiredText(value.name, 'name', 120)
  const description = optionalText(value.description, 'description', 2000)
  const sourceFields = value.fields ?? []
  if (!Array.isArray(sourceFields) || sourceFields.length > config.maxFields) throw coded('INVALID_REQUEST', `Preset fields must contain between 0 and ${config.maxFields} entries.`)
  const fields = sourceFields.map((field, index) => normalizeField(field, index, requireFieldIds, allowLegacyPositions))
  if (new Set(fields.map(field => field.id)).size !== fields.length) throw coded('INVALID_REQUEST', 'Preset field ids must be unique.')
  const total = [name, description, ...fields.flatMap(field => [field.name, field.description, field.content])].reduce((sum, text) => sum + [...text].length, 0)
  if (total > config.maxTextCharacters) throw coded('LIMIT_EXCEEDED', `Preset text exceeds the ${config.maxTextCharacters} character limit.`)
  return { name, description, fields }
}

function validateEditablePreset(value, { update = false } = {}) {
  if (!objectLike(value)) throw coded('INVALID_REQUEST', 'Preset must be an object.')
  const unknownField = Object.keys(value).find(key => !PRESET_EDITABLE_FIELDS.has(key))
  if (unknownField !== undefined) throw coded('INVALID_REQUEST', `Preset contains unknown field "${unknownField}".`)
  if (update) {
    for (const field of ['name', 'description', 'fields']) {
      if (!Object.hasOwn(value, field)) throw coded('INVALID_REQUEST', `Preset update requires the complete editable body, including ${field}.`)
    }
    if (typeof value.description !== 'string') throw coded('INVALID_REQUEST', 'Preset update description must be a string.')
  }
  if (!Object.hasOwn(value, 'fields')) return
  if (!Array.isArray(value.fields)) throw coded('INVALID_REQUEST', 'Preset fields must be an array.')
  for (const [index, field] of value.fields.entries()) {
    if (!objectLike(field)) throw coded('INVALID_REQUEST', `Preset field ${index + 1} must be an object.`)
    const unknownField = Object.keys(field).find(key => !PRESET_FIELD_EDITABLE_FIELDS.has(key))
    if (unknownField !== undefined) throw coded('INVALID_REQUEST', `Preset field ${index + 1} contains unknown field "${unknownField}".`)
    if ((field.id !== undefined || update) && (typeof field.id !== 'string' || !PRESET_FIELD_ID.test(field.id))) {
      throw coded('INVALID_REQUEST', `Preset field ${index + 1} id must be a valid UUID.`)
    }
    if (!update) continue
    for (const requiredField of PRESET_FIELD_EDITABLE_FIELDS) {
      if (!Object.hasOwn(field, requiredField)) throw coded('INVALID_REQUEST', `Preset update field ${index + 1} requires ${requiredField}.`)
    }
    if (typeof field.description !== 'string' || typeof field.content !== 'string') throw coded('INVALID_REQUEST', `Preset update field ${index + 1} description and content must be strings.`)
    if (typeof field.sectionTag !== 'boolean') throw coded('INVALID_REQUEST', `Preset field ${index + 1} sectionTag must be a boolean.`)
  }
}

function normalizeField(value, index, requireFieldId, allowLegacyPosition) {
  if (!objectLike(value)) throw coded('INVALID_REQUEST', `Preset field ${index + 1} must be an object.`)
  if (requireFieldId && (typeof value.id !== 'string' || !PRESET_FIELD_ID.test(value.id))) throw coded('ASSET_CORRUPT', `Preset field ${index + 1} has invalid storage metadata.`)
  const position = allowLegacyPosition && value.position === undefined ? legacyFieldPosition(value.name) : value.position
  if (!PRESET_POSITIONS.has(position)) throw coded(requireFieldId ? 'ASSET_CORRUPT' : 'INVALID_REQUEST', `Preset field ${index + 1} position must be top or bottom.`)
  return {
    id: typeof value.id === 'string' && PRESET_FIELD_ID.test(value.id) ? value.id : randomUUID(),
    name: requiredText(value.name, `field ${index + 1} name`, 120),
    description: optionalText(value.description, `field ${index + 1} description`, 1000),
    content: optionalText(value.content, `field ${index + 1} content`, 100000),
    position,
    sectionTag: defaultBoolean(value.sectionTag, `Preset field ${index + 1} sectionTag`),
  }
}

function normalizeStored(value, id, config) {
  if (!objectLike(value) || value.id !== id || !Number.isSafeInteger(value.revision) || value.revision < 1 || typeof value.createdAt !== 'string' || typeof value.updatedAt !== 'string') throw coded('ASSET_CORRUPT', 'Preset storage metadata is invalid.')
  return { id, revision: value.revision, ...normalizePreset(value, config, true, true), createdAt: value.createdAt, updatedAt: value.updatedAt }
}

function legacyFieldPosition(name) { return ['思维链', '思维链指导', '格式要求'].includes(name) ? 'bottom' : 'top' }

function summary(value) { return { id: value.id, name: value.name, description: value.description, revision: value.revision, fields: value.fields.length, updatedAt: value.updatedAt, status: 'ready' } }
function clipCharacters(value, limit) { const characters = [...value]; return characters.length <= limit ? value : `${characters.slice(0, limit - 1).join('')}…` }
function presetFingerprint(value) { return createHash('sha256').update(JSON.stringify([value.name, value.description, value.fields.map(field => [field.name, field.description, field.content, field.position])])).digest('hex') }
function isRetiredDefaultSeed(value) { return RETIRED_DEFAULT_PRESET_FINGERPRINTS.has(presetFingerprint(value)) }
async function replaceDefaultSeed(libraryDir, current, config) {
  const value = normalizePreset(DEFAULT_PRESET, config)
  const previousFields = new Map(current.fields.map(field => [field.name, field]))
  const renamedFields = new Map([['写前校准', '思维链指导']])
  const fields = value.fields.map(field => {
    const previous = previousFields.get(field.name) ?? previousFields.get(renamedFields.get(field.name))
    return previous === undefined ? field : { ...field, id: previous.id, sectionTag: previous.sectionTag }
  })
  const record = { ...current, ...value, fields, revision: current.revision + 1, updatedAt: new Date().toISOString() }
  await writeRecord(libraryDir, record)
  return record
}
function requiredText(value, field, limit) { if (typeof value !== 'string' || value.trim().length === 0) throw coded('INVALID_REQUEST', `Preset ${field} must be a non-empty string.`); const text = value.trim(); if ([...text].length > limit) throw coded('LIMIT_EXCEEDED', `Preset ${field} exceeds ${limit} characters.`); return text }
function optionalText(value, field, limit) { if (value === undefined || value === null || value === '') return ''; if (typeof value !== 'string') throw coded('INVALID_REQUEST', `Preset ${field} must be a string.`); const text = value.replaceAll('\r\n', '\n').replaceAll('\r', '\n').trim(); if ([...text].length > limit) throw coded('LIMIT_EXCEEDED', `Preset ${field} exceeds ${limit} characters.`); return text }
function optionalBoolean(value, field) { if (value === undefined) return false; if (typeof value !== 'boolean') throw coded('INVALID_REQUEST', `${field} must be a boolean.`); return value }
function defaultBoolean(value, field) { if (value === undefined) return true; if (typeof value !== 'boolean') throw coded('INVALID_REQUEST', `${field} must be a boolean.`); return value }
function pageOptions(query, cursor, limit) { if (typeof query !== 'string') throw coded('INVALID_REQUEST', 'query must be a string'); if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) throw coded('INVALID_REQUEST', 'limit must be between 1 and 100'); const offset = cursor == null ? 0 : Number(cursor); if (!Number.isSafeInteger(offset) || offset < 0 || (cursor != null && String(offset) !== String(cursor))) throw coded('INVALID_REQUEST', 'cursor is invalid'); return { query: query.trim().toLocaleLowerCase(), limit, offset } }
function compareAssets(left, right) { return left.name.localeCompare(right.name, undefined, { sensitivity: 'base' }) || left.id.localeCompare(right.id) }
function object(value) { if (!objectLike(value)) throw coded('INVALID_REQUEST', 'request payload must be an object'); return value }
function objectLike(value) { return typeof value === 'object' && value !== null && !Array.isArray(value) }
function assertId(id) { if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/.test(id)) throw coded('INVALID_REQUEST', 'invalid preset id') }
function requiredId(id) { assertId(id); return id }
function success(value) { return { ok: true, value } }
function failure(code, message) { return { ok: false, error: { code, message } } }
function transportSuccess(value) { return { ok: true, value } }
function coded(code, message, cause) { const error = new Error(message, { cause }); error.code = code; return error }
function codeFor(error) { return ['INVALID_REQUEST', 'LIMIT_EXCEEDED', 'ASSET_CORRUPT', 'ASSET_NOT_FOUND', 'REVISION_CONFLICT'].includes(error?.code) ? error.code : 'ASSET_CORRUPT' }
function validateConfig(config) { for (const field of ['maxTextCharacters', 'maxFields']) if (!Number.isSafeInteger(config[field]) || config[field] < 1) throw new Error(`rp-preset: ${field} must be a positive safe integer`) }

async function writeRecord(libraryDir, record) {
  await mkdir(libraryDir, { recursive: true })
  const temporary = resolve(libraryDir, `.${record.id}.${randomUUID()}.tmp`)
  await writeFile(temporary, `${JSON.stringify(record, null, 2)}\n`, 'utf8')
  await rename(temporary, resolve(libraryDir, `${record.id}.json`))
}

async function writeJsonAtomically(libraryDir, filename, value) {
  const temporary = resolve(libraryDir, `.${filename}.${randomUUID()}.tmp`)
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
  await rename(temporary, resolve(libraryDir, filename))
}

const libraryMutations = new Map()
async function withLibraryMutation(libraryDir, operation) {
  const previous = libraryMutations.get(libraryDir) ?? Promise.resolve()
  let release
  const current = new Promise(resolvePromise => { release = resolvePromise })
  libraryMutations.set(libraryDir, current)
  await previous
  try { return await operation() } finally { release(); if (libraryMutations.get(libraryDir) === current) libraryMutations.delete(libraryDir) }
}
