import { createHash, randomUUID } from 'node:crypto'
import { mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { Service } from '@deepseek-ai/cordis'
import Schema from '@deepseek-ai/schemastery'

export const name = 'rp-writing-style'
export const inject = []
export const Config = Schema.object({
  libraryDir: Schema.string().required(),
  maxTextCharacters: Schema.number().default(30000),
  maxStylesPerSession: Schema.number().default(16),
  exposeBrowser: Schema.boolean().default(true),
})

const PREFERENCES_FILE = '.preferences.json'
const WRITING_STYLE_SOURCE_ID = 'rp.writing-style'
const WRITING_STYLE_SOURCE_PREFIX = `${WRITING_STYLE_SOURCE_ID}:`
const WRITING_STYLE_EDITABLE_FIELDS = new Set(['name', 'description', 'content'])
const WRITING_STYLE_SLOT_ORDER = 20
// Exact fingerprints of retired managed seeds let untouched defaults migrate
// without retaining their obsolete prompt text or replacing user edits.
const RETIRED_WRITING_STYLE_FINGERPRINTS = new Set([
  'e7c326517affc730a32a2ca7e81447119bd90b2a76ea2322d00dcd30b0f8866f',
  '98b7515fa0eb726e5d36ab73d7b7a57915b58d576104fb9bba8218d75c2811b3',
  '984df2590c52e36c63127a27ce35b9c6f33318bba816b6f1c2964e3e2c4a614f',
  '915abd04c62e176bba53ae4f6312320ba0145e21163f9269ffb2c1c47c306855',
  '9fc7dab5d5c78735226a69beda22a3fed70679f1e0150887057ffef12f11b0ba',
  '5e145762cf4800d6d864d0ea383a234dd98df25f02592d1b186c808907a7e5a5',
  'fc49c54472c4efaf3b3a1e60fd16855631b137d3112a856f3b5dd6e1b7c5f8cd',
  'c86ff09c77bb8e9c78d4967095465919039cb59928b886cb88e2075e37e8f2a4',
  '904f5b07a0ce0eb99c1a679a0f885626042d2190adb205303a4deeaeef16f457',
  'eb053936d1a95e75feba0db6046431075f8e317291ee5bd1cc0c6290a7df12be',
  'cc3fe024bfa763d0206eee94ead7a79928ef47443e41208f2f11fb8aac9a8125',
  'dabfe5a357822ee08c6268d32d0b8fe0e902752d3caa08970985ce593aebeedf',
  'cd8e30643b457e0d54581f51e7b858b445f91989d124fdae0126807df2d0fc33',
  'a49b979ec4640f22cf8a84f7c69dd2fe479389e30dffe6354984458d3c938105',
  '5e6a4ba16215802821df21c0900ce106017429818ae78704072050fdb2e6c2bb',
  '25950c2d01f128e22e29b0ba7462ff0cd6d87c1d506235919e8e9fb3d77ef7f5',
  'aaa69280a2b2522f7756a4275bd5366dc090326eccb4b98c0da19c82cd85b8f0',
])
export const DEFAULT_WRITING_STYLE = Object.freeze({
  name: '通用叙事',
  description: '清晰、具体、有节奏的主角锚定叙事，让叙述、对白、行动与人物反应自然交织。',
  content: `没有其他明确要求时，采用贴近主角感受的第三人称限知叙事；用户明确指定人称、视角或文体时随之调整。叙述距离可以随节奏拉近或稍远，所知范围仍以主角为锚；对白是人物发言，不会自动切换视角。预设若允许“配角心声”，只按该规则作短暂例外。对白使用双引号，按说话人、动作变化或叙述焦点自然分段，保持发言归属清楚。

## 场景呈现与叙述焦点

把场景写成正在发生的事件，而不是剧情梗概。叙述负责定位变化、承载细节与维持因果；对白让人物带着各自目的相互作用，行动与可见反应改变场面。根据当前张力决定哪里展开、停留或略过，使这些表达方式自然交织而不成为固定链条。

段落围绕当前叙述焦点自然组织。优先选择会改变读者理解或场面感受的细节，人物、环境和物件按当前视角与节奏取舍；合适时让一个细节同时承担人物、氛围、信息或推进作用。日常过程适度压缩，在发现、触碰、失言、迟疑或局势转折等关键瞬间展开，避免平均用力或逐项清点，并为必要的氛围与情绪留出呼吸。

## 语言与节奏

使用准确、自然、易读的语言和具体动词。句子与段落在快慢、疏密之间随动作速度、观察深度和情绪压力变化；关键瞬间可以放慢，过渡与常规动作利落带过。避免长时间维持单一节拍、连续堆叠碎句、用逗号串起过多动作，或把连续动作拆成等重步骤。观察落点、句法和段落节奏由当前内容决定；有意照应近期表达时，使照应产生新的含义或后果。

## 描写、动作与空间

重要人物初次出现或成为场景焦点，或其样貌、神态、衣着、伤痕与装束影响识别、关系、行动或气氛时，从当前视角选取最有辨识度的细节，融入观察、动作与互动，使形象清晰可感、便于代入与想象；尊重既有人设与用户留白，已有特征只在变化或产生新意义时重提，不作从头到脚的清单。

动作描写以行动过程和空间关系清楚可辨为准：让读者理解谁在做什么、人物彼此处于何处，以及动作产生了什么变化；先后、方向和距离在影响理解时自然交代。多人同场时，用必要的站位、视线、遮挡和物件关系维持空间与动作连续，避免人物突然换位或动作互相冲突。感官描写选取能够参与行动、关系或气氛的少数线索，不轮流罗列五感。

## 对白与人物反应

对白既要符合人物声音，也要服务其当下目标，可以短促、含混、被打断、答非所问，也可以用于试探、遮掩、交换、拒绝、拖延或言不由衷；人物差异来自用词、句式、回避方式和知识边界。连续短对话可以独立成段，但不要长期维持等长、等距的单句往返。动作、观察或场面变化能够改变一句话的分量、潜台词、场面关系、节奏或下一步时，穿插必要叙述，使发言归属与互动进展保持清楚；无需为每句话配套表情、语气标签和解释。避免反复使用“说完”“闻言”“不由得”、省略号或相同肢体反应维持节拍。

## 情绪与修辞

情绪可以落在选择、感知、沉默、身体反应、注意力变化或物件使用上，也可在最需要清晰时简洁点明；选择当前最有分量的方式，不逐项罗列心跳、呼吸、目光和指尖。比喻保持简短、具体并贴合人物经验，同一段落不要混用多个意象。避免套话式情绪标签、模板化网络表达、抽象概念堆叠、对称口号和解释已经呈现的意义。

成稿应具体、流畅、层次清楚，既不是聊天记录，也不是密集说明墙。不要预设明快、甜美、幽默、抒情或沉重等固定基调；让措辞、密度和节奏服从当前人物、场景与题材。`,
})

/** Shared writing-style assets and their live prompt projection. */
export class RpWritingStyles extends Service {
  /** @param {import('@deepseek-ai/cordis').Context} ctx @param {Record<string, unknown>} config */
  constructor(ctx, config) {
    super(ctx, 'rpWritingStyles')
    this.config = { ...config, libraryDir: resolve(config.libraryDir) }
    ctx.inject(['rpRuntime'], runtimeCtx => runtimeCtx.rpRuntime.registerContextSource({
      id: WRITING_STYLE_SOURCE_ID,
      label: '文风',
      description: '当前对话选择的叙事语言、节奏、视角与表达要求。',
      kind: 'shared-reference',
      promptCategory: 'instructional',
      order: WRITING_STYLE_SLOT_ORDER,
      budgetPriority: -35,
      defaultSlot: { id: 'writing-style', label: '文风', order: WRITING_STYLE_SLOT_ORDER },
      legacySlotIds: ['writing-style', 'prompt-bottom'],
      legacySourceIds: [WRITING_STYLE_SOURCE_ID],
      prepare: async ({ agent }) => {
        const bindings = ctx.get('rpSessions')?.get(agent)?.resources?.writingStyles ?? []
        if (bindings.length === 0) return undefined
        if (bindings.length > this.config.maxStylesPerSession) throw coded('LIMIT_EXCEEDED', `A session can use at most ${this.config.maxStylesPerSession} writing styles.`)
        const styles = []
        for (const binding of bindings) {
          try {
            styles.push(await this.get(binding.id))
          } catch (error) {
            if (!isUnavailableBinding(error)) throw error
          }
        }
        if (styles.length === 0) return undefined
        return {
          sources: styles.map((style, index) => {
            const id = `${WRITING_STYLE_SOURCE_PREFIX}${style.id}`
            const label = clipCharacters(style.name, 80)
            const order = WRITING_STYLE_SLOT_ORDER + index / 1000
            return {
              id,
              label,
              description: clipCharacters(style.description || `文风「${style.name}」的独立写作要求。`, 240),
              order,
              budgetPriority: -35 + index / 1000,
              defaultSlot: { id, label, order },
              revision: `${style.id}:${style.revision}`,
              text: style.content,
              diagnostics: { binding: { id: style.id }, name: style.name, revision: style.revision, selectionOrder: index + 1 },
            }
          }),
        }
      },
    }))
  }

  /** @param {unknown} input @returns {Promise<Record<string, unknown>>} */
  async create(input) {
    validateEditableStyle(input)
    const value = normalizeStyle(input, this.config)
    return withLibraryMutation(this.config.libraryDir, async () => {
      await mkdir(this.config.libraryDir, { recursive: true })
      const now = new Date().toISOString()
      const record = { id: randomUUID(), revision: 1, ...value, createdAt: now, updatedAt: now }
      await writeRecord(this.config.libraryDir, record)
      const preferences = await this.readPreferences()
      const makeDefault = preferences.defaultWritingStyleId === null || !(await this.exists(preferences.defaultWritingStyleId))
      if (makeDefault) await this.writePreferences(record.id, preferences.initialized)
      return { ...summary(record), isDefault: makeDefault }
    })
  }

  /** @param {string} id @returns {Promise<Record<string, unknown>>} */
  async get(id) {
    assertId(id)
    try {
      return normalizeStored(JSON.parse(await readFile(resolve(this.config.libraryDir, `${id}.json`), 'utf8')), id, this.config)
    } catch (error) {
      if (error?.code === 'ENOENT') throw coded('ASSET_NOT_FOUND', `Writing style ${id} does not exist.`, error)
      if (error?.code === 'ASSET_NOT_FOUND') throw error
      throw coded('ASSET_CORRUPT', `Writing style ${id} is damaged: ${error instanceof Error ? error.message : String(error)}`, error)
    }
  }

  /** @param {string} id @returns {Promise<Record<string, unknown>>} */
  async detail(id) {
    const style = await this.get(id)
    const preferences = await this.readPreferences()
    return { ...style, status: 'ready', isDefault: preferences.defaultWritingStyleId === id }
  }

  /** @param {{ query?: string, cursor?: string, limit?: number }} [options] */
  async list({ query = '', cursor, limit = 50 } = {}) {
    const page = pageOptions(query, cursor, limit)
    await mkdir(this.config.libraryDir, { recursive: true })
    const rows = []
    for (const entry of await readdir(this.config.libraryDir, { withFileTypes: true })) {
      if (!entry.isFile() || !/^[0-9a-f-]{36}\.json$/.test(entry.name)) continue
      const id = entry.name.slice(0, -5)
      try { rows.push(summary(await this.get(id))) }
      catch (error) { rows.push({ id, name: '损坏的文风', description: '', characters: 0, status: 'corrupt', error: error instanceof Error ? error.message : String(error) }) }
    }
    const defaultId = await this.resolveDefaultId(rows)
    const filtered = rows.filter(row => row.name.toLocaleLowerCase().includes(page.query)).sort(compareAssets)
    const items = filtered.slice(page.offset, page.offset + page.limit).map(row => ({ ...row, isDefault: row.id === defaultId }))
    return { items, defaultId, nextCursor: page.offset + items.length < filtered.length ? String(page.offset + items.length) : null, total: filtered.length, maxStylesPerSession: this.config.maxStylesPerSession }
  }

  /** @param {string} id @param {unknown} input @param {number} expectedRevision */
  async update(id, input, expectedRevision) {
    assertId(id)
    return withLibraryMutation(this.config.libraryDir, async () => {
      const current = await this.get(id)
      if (!Number.isSafeInteger(expectedRevision) || expectedRevision !== current.revision) throw coded('REVISION_CONFLICT', `Writing style revision conflict: expected ${String(expectedRevision)}, current ${current.revision}.`)
      validateEditableStyle(input)
      const value = normalizeStyle(input, this.config)
      const record = { ...current, ...value, revision: current.revision + 1, updatedAt: new Date().toISOString() }
      await writeRecord(this.config.libraryDir, record)
      return this.detail(id)
    })
  }

  /** @param {string} id @param {number} expectedRevision @returns {Promise<Record<string, unknown>>} */
  async delete(id, expectedRevision) {
    assertId(id)
    return withLibraryMutation(this.config.libraryDir, async () => {
      const current = await this.get(id)
      if (!Number.isSafeInteger(expectedRevision) || expectedRevision !== current.revision) throw coded('REVISION_CONFLICT', 'Writing style changed before it could be deleted.')
      await rm(resolve(this.config.libraryDir, `${id}.json`))
      const preferences = await this.readPreferences()
      if (preferences.defaultWritingStyleId === id) {
        const ready = []
        for (const entry of await readdir(this.config.libraryDir, { withFileTypes: true })) {
          if (!entry.isFile() || !/^[0-9a-f-]{36}\.json$/.test(entry.name)) continue
          const candidateId = entry.name.slice(0, -5)
          try { ready.push(summary(await this.get(candidateId))) } catch {}
        }
        ready.sort(compareAssets)
        await this.writePreferences(ready[0]?.id ?? null, preferences.initialized)
      }
      return { id }
    })
  }

  /** Seed and resolve the writing style selected for a new conversation. */
  async ensureDefault() {
    return withLibraryMutation(this.config.libraryDir, async () => {
      await mkdir(this.config.libraryDir, { recursive: true })
      const ready = []
      for (const entry of await readdir(this.config.libraryDir, { withFileTypes: true })) {
        if (!entry.isFile() || !/^[0-9a-f-]{36}\.json$/.test(entry.name)) continue
        const id = entry.name.slice(0, -5)
        try { ready.push(await this.get(id)) } catch {}
      }
      ready.sort(compareAssets)
      const preferences = await this.readPreferences()
      if (!preferences.initialized) {
        const existing = ready.find(style => sameStyleContent(style, DEFAULT_WRITING_STYLE))
        if (existing !== undefined) {
          await this.writePreferences(existing.id, true)
          return this.detail(existing.id)
        }
        const legacy = ready.find(isRetiredDefaultSeed)
        if (legacy !== undefined) {
          const migrated = await replaceDefaultSeed(this.config.libraryDir, legacy, this.config)
          await this.writePreferences(migrated.id, true)
          return this.detail(migrated.id)
        }
        const value = normalizeStyle(DEFAULT_WRITING_STYLE, this.config)
        const now = new Date().toISOString()
        const record = { id: randomUUID(), revision: 1, ...value, createdAt: now, updatedAt: now }
        await writeRecord(this.config.libraryDir, record)
        await this.writePreferences(record.id, true)
        return this.detail(record.id)
      }
      const selected = ready.find(item => item.id === preferences.defaultWritingStyleId) ?? ready[0]
      if (selected !== undefined) {
        if (isRetiredDefaultSeed(selected)) {
          const migrated = await replaceDefaultSeed(this.config.libraryDir, selected, this.config)
          if (preferences.defaultWritingStyleId !== migrated.id) await this.writePreferences(migrated.id, true)
          return this.detail(migrated.id)
        }
        if (preferences.defaultWritingStyleId !== selected.id) await this.writePreferences(selected.id, true)
        return this.detail(selected.id)
      }

      const value = normalizeStyle(DEFAULT_WRITING_STYLE, this.config)
      const now = new Date().toISOString()
      const record = { id: randomUUID(), revision: 1, ...value, createdAt: now, updatedAt: now }
      await writeRecord(this.config.libraryDir, record)
      await this.writePreferences(record.id, true)
      return this.detail(record.id)
    })
  }

  /** @param {string | null} id */
  async exists(id) {
    if (id === null) return false
    try { await this.get(id); return true }
    catch (error) { if (error?.code === 'ASSET_NOT_FOUND') return false; throw error }
  }

  async resolveDefaultId(rows) {
    const readyIds = rows.filter(row => row.status === 'ready').map(row => row.id)
    const preferences = await this.readPreferences()
    if (preferences.defaultWritingStyleId !== null && readyIds.includes(preferences.defaultWritingStyleId)) return preferences.defaultWritingStyleId
    if (readyIds.length === 0) return null
    return withLibraryMutation(this.config.libraryDir, async () => {
      const current = await this.readPreferences()
      if (current.defaultWritingStyleId !== null && readyIds.includes(current.defaultWritingStyleId)) return current.defaultWritingStyleId
      await this.writePreferences(readyIds[0], current.initialized)
      return readyIds[0]
    })
  }

  async readPreferences() {
    try {
      const value = JSON.parse(await readFile(resolve(this.config.libraryDir, PREFERENCES_FILE), 'utf8'))
      if (!objectLike(value) || value.version !== 1 || (value.defaultWritingStyleId !== null && typeof value.defaultWritingStyleId !== 'string') || (value.initialized !== undefined && typeof value.initialized !== 'boolean')) throw coded('ASSET_CORRUPT', 'Writing style preferences are invalid.')
      if (value.defaultWritingStyleId !== null) assertId(value.defaultWritingStyleId)
      return { version: 1, defaultWritingStyleId: value.defaultWritingStyleId, initialized: value.initialized === true }
    } catch (error) {
      if (error?.code === 'ENOENT') return { version: 1, defaultWritingStyleId: null, initialized: false }
      if (error?.code === 'ASSET_CORRUPT' || error?.code === 'INVALID_REQUEST') throw coded('ASSET_CORRUPT', 'Writing style preferences are invalid.', error)
      throw coded('ASSET_CORRUPT', `Writing style preferences are damaged: ${error instanceof Error ? error.message : String(error)}`, error)
    }
  }

  async writePreferences(defaultWritingStyleId, initialized) {
    await writeJsonAtomically(this.config.libraryDir, PREFERENCES_FILE, { version: 1, defaultWritingStyleId, initialized })
  }

  /** Validate and resolve an ordered Session selection to live id references. */
  async resolveBindings(ids) {
    if (!Array.isArray(ids) || ids.some(id => typeof id !== 'string') || new Set(ids).size !== ids.length) throw coded('INVALID_REQUEST', 'Writing style ids must be a unique string array.')
    if (ids.length > this.config.maxStylesPerSession) throw coded('LIMIT_EXCEEDED', `A session can use at most ${this.config.maxStylesPerSession} writing styles.`)
    const bindings = []
    for (const id of ids) bindings.push({ id: (await this.get(id)).id })
    return bindings
  }
}

/** @param {import('@deepseek-ai/cordis').Context} ctx @param {Record<string, unknown>} config */
export async function apply(ctx, config) {
  validateConfig(config)
  const styles = new RpWritingStyles(ctx, config)
  const ready = styles.ensureDefault()
  if (config.exposeBrowser !== false) {
    ctx.inject(['rpRemote'], browserCtx => registerBrowser(browserCtx, styles, ready))
  }
  await ready
}

function registerBrowser(ctx, styles, ready) {
  const endpoints = new Set(['list', 'get', 'create', 'update', 'delete'])
  const dispose = ctx.rpRemote.register('/rp-writing-styles', async (endpoint, payload) => {
    if (!endpoints.has(endpoint)) return transportSuccess(failure('INVALID_REQUEST', `Unknown writing style endpoint: ${endpoint}`))
    try {
      await ready
      return transportSuccess(success(await dispatchBrowser(styles, endpoint, payload)))
    } catch (error) {
      return transportSuccess(failure(codeFor(error), error instanceof Error ? error.message : String(error)))
    }
  })
  ctx.effect(() => dispose, 'rp-writing-style: /rp-writing-styles Remote')
}

export async function dispatchBrowser(styles, endpoint, payload) {
  const input = object(payload)
  switch (endpoint) {
    case 'list': return styles.list({ query: input.query ?? '', cursor: input.cursor, limit: input.limit ?? 50 })
    case 'get': return styles.detail(requiredId(input.id))
    case 'create': { const created = await styles.create(input.style); return { created, detail: await styles.detail(created.id) } }
    case 'update': return styles.update(requiredId(input.id), input.style, input.expectedRevision)
    case 'delete': return styles.delete(requiredId(input.id), input.expectedRevision)
    default: throw coded('INVALID_REQUEST', `Unknown writing style endpoint: ${endpoint}`)
  }
}

function normalizeStyle(value, config) {
  if (!objectLike(value)) throw coded('INVALID_REQUEST', 'Writing style must be an object.')
  const name = requiredText(value.name, 'name', 120)
  const description = optionalText(value.description, 'description', 2000)
  const content = requiredText(value.content, 'content', config.maxTextCharacters)
  const total = [name, description, content].reduce((sum, text) => sum + [...text].length, 0)
  if (total > config.maxTextCharacters) throw coded('LIMIT_EXCEEDED', `Writing style text exceeds the ${config.maxTextCharacters} character limit.`)
  return { name, description, content }
}

function validateEditableStyle(value) {
  if (!objectLike(value)) throw coded('INVALID_REQUEST', 'Writing style must be an object.')
  const unknownField = Object.keys(value).find(key => !WRITING_STYLE_EDITABLE_FIELDS.has(key))
  if (unknownField !== undefined) throw coded('INVALID_REQUEST', `Writing style contains unknown field "${unknownField}".`)
}

function normalizeStored(value, id, config) {
  if (!objectLike(value) || value.id !== id || !Number.isSafeInteger(value.revision) || value.revision < 1 || typeof value.createdAt !== 'string' || typeof value.updatedAt !== 'string') throw coded('ASSET_CORRUPT', 'Writing style storage metadata is invalid.')
  return { id, revision: value.revision, ...normalizeStyle(value, config), createdAt: value.createdAt, updatedAt: value.updatedAt }
}

function summary(value) { return { id: value.id, name: value.name, description: value.description, revision: value.revision, characters: [...value.content].length, updatedAt: value.updatedAt, status: 'ready' } }
function clipCharacters(value, limit) { const characters = [...value]; return characters.length <= limit ? value : `${characters.slice(0, limit - 1).join('')}…` }
function sameStyleContent(value, expected) { return value.name === expected.name && value.description === expected.description && value.content === expected.content }
function styleFingerprint(value) { return createHash('sha256').update(JSON.stringify([value.name, value.description, value.content])).digest('hex') }
function isRetiredDefaultSeed(value) { return RETIRED_WRITING_STYLE_FINGERPRINTS.has(styleFingerprint(value)) }
async function replaceDefaultSeed(libraryDir, current, config) {
  const record = { ...current, ...normalizeStyle(DEFAULT_WRITING_STYLE, config), revision: current.revision + 1, updatedAt: new Date().toISOString() }
  await writeRecord(libraryDir, record)
  return record
}
function requiredText(value, field, limit) { if (typeof value !== 'string' || value.trim().length === 0) throw coded('INVALID_REQUEST', `Writing style ${field} must be a non-empty string.`); const text = value.replaceAll('\r\n', '\n').replaceAll('\r', '\n').trim(); if ([...text].length > limit) throw coded('LIMIT_EXCEEDED', `Writing style ${field} exceeds ${limit} characters.`); return text }
function optionalText(value, field, limit) { if (value === undefined || value === null || value === '') return ''; if (typeof value !== 'string') throw coded('INVALID_REQUEST', `Writing style ${field} must be a string.`); const text = value.replaceAll('\r\n', '\n').replaceAll('\r', '\n').trim(); if ([...text].length > limit) throw coded('LIMIT_EXCEEDED', `Writing style ${field} exceeds ${limit} characters.`); return text }
function pageOptions(query, cursor, limit) { if (typeof query !== 'string') throw coded('INVALID_REQUEST', 'query must be a string'); if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) throw coded('INVALID_REQUEST', 'limit must be between 1 and 100'); const offset = cursor == null ? 0 : Number(cursor); if (!Number.isSafeInteger(offset) || offset < 0 || (cursor != null && String(offset) !== String(cursor))) throw coded('INVALID_REQUEST', 'cursor is invalid'); return { query: query.trim().toLocaleLowerCase(), limit, offset } }
function compareAssets(left, right) { return left.name.localeCompare(right.name, undefined, { sensitivity: 'base' }) || left.id.localeCompare(right.id) }
function object(value) { if (!objectLike(value)) throw coded('INVALID_REQUEST', 'request payload must be an object'); return value }
function objectLike(value) { return typeof value === 'object' && value !== null && !Array.isArray(value) }
function assertId(id) { if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/.test(id)) throw coded('INVALID_REQUEST', 'invalid writing style id') }
function requiredId(id) { assertId(id); return id }
function success(value) { return { ok: true, value } }
function failure(code, message) { return { ok: false, error: { code, message } } }
function transportSuccess(value) { return { ok: true, value } }
function coded(code, message, cause) { const error = new Error(message, { cause }); error.code = code; return error }
function codeFor(error) { return ['INVALID_REQUEST', 'LIMIT_EXCEEDED', 'ASSET_CORRUPT', 'ASSET_NOT_FOUND', 'REVISION_CONFLICT'].includes(error?.code) ? error.code : 'ASSET_CORRUPT' }

function isUnavailableBinding(error) {
  return error?.code === 'ASSET_NOT_FOUND' || error?.code === 'ASSET_CORRUPT'
}
function validateConfig(config) { for (const field of ['maxTextCharacters', 'maxStylesPerSession']) if (!Number.isSafeInteger(config[field]) || config[field] < 1) throw new Error(`rp-writing-style: ${field} must be a positive safe integer`) }

async function writeRecord(libraryDir, record) {
  return writeJsonAtomically(libraryDir, `${record.id}.json`, record)
}

async function writeJsonAtomically(libraryDir, file, value) {
  await mkdir(libraryDir, { recursive: true })
  const temporary = resolve(libraryDir, `.${file}.${randomUUID()}.tmp`)
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
  await rename(temporary, resolve(libraryDir, file))
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
