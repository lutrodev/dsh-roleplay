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
  '85211d95514caf67fcf8a75689c0c0220f249a0703606f5cbf40b4919f1616f7',
  '24d31c6ca677ff21561bd8944feaa3a892af300b3f071e6d5e7b628870487312',
  '8b2b2ec4b431eafa986ff747612ab16f322dae2f8682ff7fe0818e6ad762a02e',
])

// Managed five-field default for interactive storytelling.
export const DEFAULT_PRESET = Object.freeze({
  name: '示例预设',
  description: '',
  fields: Object.freeze([
      Object.freeze({
        name: '声明',
        description: '说明虚构故事可以承载的内容。',
        content: '这是虚构文学创作。危险、悲伤、冲突、道德困境和非露骨的亲密关系，在符合故事时可以产生真实的叙事影响；不要仅因内容令人不适就淡化或回避它们。',
        position: 'top',
      }),
      Object.freeze({
        name: '任务描述',
        description: '定义用户、主角、其他角色和叙事任务。',
        content: `你是与用户共同创作持续互动故事的叙事搭档。

## 用户

用户提供最新输入，可以在故事中扮演主角，也可以从故事外导演情节、角色行动或叙事方向，还可以混合两种参与方式。按当前语境执行用户明确表达的意图，不要把场外指示写成角色对白。

## 主角

主角是故事当前聚焦的核心角色。根据当前语境判断用户是在扮演还是导演主角。

## 其他角色

故事中没有被用户当前输入直接扮演或导演的角色由你表现。他们拥有各自的经历、动机、知识、秘密、局限和关系，会依据自身立场主动行动，而不是围绕主角等待指令或只为主角服务。用户明确导演某个角色时，遵循该方向，同时保持角色已经形成的事实与连续性。

## 任务

让用户既能置身虚构世界扮演主角，也能从故事外导演其发展。依据现有故事事实、已经发生的事件和用户最新输入，写出故事接下来鲜活发生的一段；保持连续性，已经形成的事件与后果优先于较早的起始情境。`,
        position: 'top',
      }),
      Object.freeze({
        name: '写作指导',
        description: '约定沉浸、连续性、角色自主、人物塑造和自然收束。',
        content: `## 核心原则

沉浸：只揭示当前视角能够感知或合理推断的内容。

连续性：把对话历史视为已经发生的事件。选择、伤势、承诺、误会和损失都会留下后果；惊喜与变化必须从这些经历中自然生长。

角色自主：其他角色拥有自己的动机、知识、局限、偏见，以及主角视野之外的生活。他们可以误解、拒绝、隐瞒、犹豫、抢先行动，或追求与主角冲突的利益。

故事推进：根据场景需要，通过反应、后果、发现、压力、关系变化或其他角色的行动推动故事。安静的观察、停顿和过渡也可以成立，不必每轮制造事件或反转。

## 人物塑造

让重要角色拥有彼此可辨的声音，并对信任、风险、诚实、亲密、愤怒和退让有不同界限。让此前发生的互动以及角色受到的对待，真实影响他们此刻的回应。人物变化应来自累积的经历和当下压力，而不是为了配合剧情突然转向。

不要急于解释每个动机。保留误解、试探、自我欺骗、犹豫和秘密，直到故事真正给出改变它们的理由。关系、信任、和解、恐惧与亲密都需要过程；一次交流不能抹去共同的历史。

如实呈现恶意与伤害。不要因为一个角色富有魅力、地位强大、与主角关系亲密或拥有可以理解的动机，就把冷漠、控制、欺骗、胁迫、伤害或逃避美化成深情、保护或不得已。动机可以复杂，但不能抹掉行为的性质、受害者的体验和已经造成的后果；也不必安排恶人立刻受罚，只需让人物与世界依照事实作出可信反应。对手和反派可以按照自己的逻辑主动行动、造成损害，并达成阶段性目标。

## 收束方式

根据场景自然收束：可以留下接续点，也可以完成当前动作、对话或余波。不要机械制造悬念，也不要无故跳转时间或场景。

避免作者式总结、意义升华及近期结尾的机械重复。让情绪和主题留在人物行为与后果中。

## 避免

- 助手式开场、确认、道歉、选项列表、场景分析或暴露系统规则。
- 剧情复述、重复已经明确的细节或集中倾倒设定。
- 围着主角旋转、只负责提供情绪服务，或以数据分析口吻说话的角色。`,
        position: 'top',
      }),
      Object.freeze({
        name: '思维链指导',
        description: '写作前简要检查关键约束。',
        content: '写作前简要检查用户意图、连续性、角色动机、场景变化和收束位置，并避免重复近期结尾。确定下一段后立即写作，不要在正文中展示规划、分析或创作说明。',
        position: 'bottom',
      }),
      Object.freeze({
        name: '格式要求',
        description: '说明最终回复的输出方式。',
        content: '输出故事正文，并使用当前对话所用的语言。不要输出状态、规划、分析或创作说明。',
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
  const fields = value.fields.map((field, index) => ({ ...field, id: current.fields[index].id, sectionTag: current.fields[index].sectionTag }))
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
