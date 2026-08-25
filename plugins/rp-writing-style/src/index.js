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
const WRITING_STYLE_SLOT_ORDER = 20
// Exact fingerprints of retired managed seeds let untouched defaults migrate
// without retaining their obsolete prompt text or replacing user edits.
const RETIRED_WRITING_STYLE_FINGERPRINTS = new Set([
  'e7c326517affc730a32a2ca7e81447119bd90b2a76ea2322d00dcd30b0f8866f',
  '98b7515fa0eb726e5d36ab73d7b7a57915b58d576104fb9bba8218d75c2811b3',
])
export const DEFAULT_WRITING_STYLE = Object.freeze({
  name: '通用叙事',
  description: '清晰、具体、有节奏的近距离叙事，兼顾对白、动作与氛围。',
  content: `没有其他明确要求时，采用贴近主角感受的第三人称限知叙事；用户明确指定人称、视角或文体时随之调整。对白使用双引号，按说话人、动作变化或叙述焦点自然分段。

## 语言与节奏

使用准确、自然、易读的语言。句子长短随动作速度、观察深度和情绪压力变化：关键瞬间可以放慢，过渡与常规动作应利落带过。避免整段维持同一节拍、连续堆叠碎句、用逗号串起过多动作，或把每个动作拆成等重的步骤。

## 叙述焦点

每段围绕一个清晰的叙述焦点组织。优先写会改变读者理解或场面感受的细节，人物外貌、衣着、环境和物件只选当前有作用的部分。日常过程适度压缩，在发现、触碰、失言、迟疑或局势转折等关键瞬间展开；不要平均用力或逐项清点。

## 动作与空间

动作写清主体、顺序、方向、距离与可见结果。多人同场时，用站位、视线、遮挡和物件关系维持空间感，避免人物突然换位或动作互相冲突。感官描写选择场景最突出的少数线索，让声音、温度、触感、气味或光线参与当下动作；不要轮流罗列五感。

## 对白与段落

对白可以短促、含混、被打断或答非所问，让语气和用词承担潜台词。叙述只在动作改变对白含义、场面关系或节奏时穿插，不必给每句话配表情、语气标签和内心解释。避免反复使用“说完”“闻言”“不由得”、省略号和相同肢体反应维持节拍。

## 情绪与修辞

情绪先落在可观察的选择、身体反应、注意力变化或物件使用上，再决定是否直说；一种有分量的迹象通常胜过连续罗列心跳、呼吸、目光和指尖。比喻保持简短、具体并贴合人物经验，同一段落不要混用多个意象。避免套话式情绪标签、模板化网络表达、抽象概念堆叠、对称口号和解释句子自身意义的文字。

成稿应具体、流畅、层次清楚。不要预设明快、甜美、幽默、抒情或沉重等固定基调；让措辞、密度和节奏服从当前人物、场景与题材。`,
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
        for (const binding of bindings) styles.push(await this.get(binding.id))
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
  await styles.ensureDefault()
  if (config.exposeBrowser !== false) ctx.inject(['connection'], browserCtx => registerBrowser(browserCtx, styles))
}

function registerBrowser(ctx, styles) {
  const endpoints = new Set(['list', 'get', 'create', 'update', 'delete'])
  const dispose = ctx.connection.rpc.handle('/rp-writing-styles', async (endpoint, payload) => {
    if (!endpoints.has(endpoint)) return transportSuccess(failure('INVALID_REQUEST', `Unknown writing style endpoint: ${endpoint}`))
    try { return transportSuccess(success(await dispatchBrowser(styles, endpoint, payload))) }
    catch (error) { return transportSuccess(failure(codeFor(error), error instanceof Error ? error.message : String(error))) }
  }, { authority: 'loopback' })
  ctx.effect(() => dispose, 'rp-writing-style: /rp-writing-styles RPC')
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
