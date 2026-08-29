import { randomUUID } from 'node:crypto'
import { mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { Service } from '@deepseek-ai/cordis'
import Schema from '@deepseek-ai/schemastery'
import sharp from 'sharp'

export const name = 'rp-persona'
export const inject = []
export const Config = Schema.object({
  libraryDir: Schema.string().required(),
  maxTextCharacters: Schema.number().default(30000),
  maxAvatarInputBytes: Schema.number().default(5242880),
  maxAvatarPixels: Schema.number().default(16777216),
  avatarMaxEdgePixels: Schema.number().default(512),
  avatarWebpQuality: Schema.number().default(85),
  exposeBrowser: Schema.boolean().default(true),
})

const PREFERENCES_FILE = '.preferences.json'
const PERSONA_FILE = 'persona.json'
const AVATAR_FILE = 'avatar.webp'
export const DEFAULT_PERSONA = Object.freeze({
  name: '用户角色',
  description: '由用户在当前对话中逐步定义的参与者；未说明的身份、经历与外观保持开放。',
  personality: '',
  scenario: '',
  firstMessage: '',
  tags: [],
})
const AVATAR_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])
const AVATAR_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp'])
const PERSONA_EDITABLE_FIELDS = new Set(['name', 'description', 'personality', 'scenario', 'firstMessage', 'tags'])

export class RpPersonas extends Service {
  constructor(ctx, config) {
    super(ctx, 'rpPersonas')
    this.config = { ...config, libraryDir: resolve(config.libraryDir) }
    ctx.inject(['rpRuntime'], runtimeCtx => runtimeCtx.rpRuntime.registerContextSource({
      id: 'rp.persona',
      label: '我的人设',
      description: '当前会话中由用户扮演的身份、性格、背景与表达方式。',
      kind: 'shared-reference',
      promptCategory: 'factual',
      order: -70,
      budgetPriority: -70,
      defaultSlot: { id: 'persona', label: '人设信息', order: -70 },
      dependsOn: ['rp.card'],
      prepare: async ({ agent }) => {
        const binding = ctx.get('rpSessions')?.get(agent)?.resources?.persona
        if (binding === undefined) return undefined
        const persona = await this.get(binding.id)
        return {
          revision: `${persona.id}:${persona.revision}`,
          text: renderPersona(persona),
          diagnostics: { binding: { id: persona.id }, revision: persona.revision },
        }
      },
    }))
  }

  async create(input, options = {}) {
    validateEditablePersona(input)
    const persona = normalizePersona(input, this.config.maxTextCharacters)
    const avatar = options.avatar === undefined ? null : await sanitizeAvatar(options.avatar, this.config)
    return withLibraryMutation(this.config.libraryDir, async () => {
      await mkdir(this.config.libraryDir, { recursive: true })
      const id = randomUUID()
      const createdAt = new Date().toISOString()
      const record = { id, revision: 1, ...persona, createdAt, avatar: avatar?.metadata ?? null }
      await writePersonaAtomically(this.config.libraryDir, id, record, avatar?.bytes)

      const preferences = await this.readPreferences()
      const makeDefault = options.makeDefault === true || preferences.defaultPersonaId === null || !(await this.exists(preferences.defaultPersonaId))
      if (makeDefault) await this.writePreferences(id)
      return { ...summary(record), isDefault: makeDefault }
    })
  }

  async update(id, input, expectedRevision, options = {}) {
    assertId(id)
    if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 1) throw coded('INVALID_REQUEST', 'expectedRevision must be a positive safe integer.')
    validateEditablePersona(input)
    const persona = normalizePersona(input, this.config.maxTextCharacters)
    const avatar = options.avatar === undefined ? null : await sanitizeAvatar(options.avatar, this.config)
    return withLibraryMutation(this.config.libraryDir, async () => {
      const current = await this.get(id)
      if (current.revision !== expectedRevision) throw coded('REVISION_CONFLICT', `Persona ${id} changed before it could be saved.`)
      const record = {
        id,
        revision: current.revision + 1,
        ...persona,
        createdAt: current.createdAt,
        avatar: avatar?.metadata ?? current.avatar,
      }
      await updatePersonaAtomically(this.config.libraryDir, id, record, avatar?.bytes)
      const preferences = await this.readPreferences()
      return { ...summary(record), isDefault: preferences.defaultPersonaId === id }
    })
  }

  async delete(id, expectedRevision) {
    assertId(id)
    return withLibraryMutation(this.config.libraryDir, async () => {
      const current = await this.get(id)
      if (!Number.isSafeInteger(expectedRevision) || expectedRevision !== current.revision) throw coded('REVISION_CONFLICT', 'Persona changed before it could be deleted.')
      await rm(resolve(this.config.libraryDir, id), { recursive: true })
      const preferences = await this.readPreferences()
      if (preferences.defaultPersonaId === id) {
        const ready = []
        for (const entry of await readdir(this.config.libraryDir, { withFileTypes: true })) {
          if (!entry.isDirectory() || !/^[0-9a-f-]{36}$/.test(entry.name)) continue
          try { ready.push(summary(await this.get(entry.name))) } catch {}
        }
        ready.sort(compareAssets)
        await this.writePreferences(ready[0]?.id ?? null)
      }
      return { id }
    })
  }

  async get(id) {
    assertId(id)
    try { return normalizeStored(JSON.parse(await readFile(resolve(this.config.libraryDir, id, PERSONA_FILE), 'utf8')), id, this.config.maxTextCharacters) }
    catch (error) {
      if (error?.code === 'ENOENT') throw coded('ASSET_NOT_FOUND', `Persona ${id} does not exist.`, error)
      if (error?.code === 'ASSET_NOT_FOUND') throw error
      throw coded('ASSET_CORRUPT', `Persona ${id} is damaged: ${error instanceof Error ? error.message : String(error)}`, error)
    }
  }

  async list({ cursor, limit = 50 } = {}) {
    const page = pageOptions(cursor, limit)
    await mkdir(this.config.libraryDir, { recursive: true })
    const rows = []
    for (const entry of await readdir(this.config.libraryDir, { withFileTypes: true })) {
      if (!entry.isDirectory() || !/^[0-9a-f-]{36}$/.test(entry.name)) continue
      const id = entry.name
      try { rows.push(summary(await this.get(id))) }
      catch (error) { rows.push({ id, name: '损坏的人设', status: 'corrupt', error: error instanceof Error ? error.message : String(error), tags: [] }) }
    }
    rows.sort(compareAssets)
    const defaultId = await this.resolveDefaultId(rows)
    const items = rows.slice(page.offset, page.offset + page.limit).map(row => ({ ...row, isDefault: row.id === defaultId }))
    return {
      items,
      defaultId,
      nextCursor: page.offset + items.length < rows.length ? String(page.offset + items.length) : null,
      total: rows.length,
      limits: { maxAvatarInputBytes: this.config.maxAvatarInputBytes },
    }
  }

  async detail(id) {
    const persona = await this.get(id)
    const { avatar, ...content } = persona
    const preferences = await this.readPreferences()
    return {
      ...content,
      hasAvatar: avatar !== null,
      status: 'ready',
      isDefault: preferences.defaultPersonaId === id,
    }
  }

  async avatar(id) {
    const persona = await this.get(id)
    if (persona.avatar === null) throw coded('ASSET_NOT_FOUND', `Persona ${id} has no avatar.`)
    try {
      return { bytes: await readFile(resolve(this.config.libraryDir, id, AVATAR_FILE)), mimeType: 'image/webp' }
    } catch (error) {
      if (error?.code === 'ENOENT') throw coded('ASSET_CORRUPT', `Persona ${id} avatar is missing.`, error)
      throw error
    }
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
        if (!entry.isDirectory() || !/^[0-9a-f-]{36}$/.test(entry.name)) continue
        try { ready.push(summary(await this.get(entry.name))) } catch {}
      }
      ready.sort(compareAssets)
      const preferences = await this.readPreferences()
      const selected = ready.find(item => item.id === preferences.defaultPersonaId) ?? ready[0]
      if (selected !== undefined) {
        if (preferences.defaultPersonaId !== selected.id) await this.writePreferences(selected.id)
        return this.detail(selected.id)
      }

      const id = randomUUID()
      const createdAt = new Date().toISOString()
      const record = { id, revision: 1, ...normalizePersona(DEFAULT_PERSONA, this.config.maxTextCharacters), createdAt, avatar: null }
      await writePersonaAtomically(this.config.libraryDir, id, record)
      await this.writePreferences(id)
      return this.detail(id)
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
    if (preferences.defaultPersonaId !== null && readyIds.includes(preferences.defaultPersonaId)) return preferences.defaultPersonaId
    if (readyIds.length === 0) return null
    return withLibraryMutation(this.config.libraryDir, async () => {
      const current = await this.readPreferences()
      if (current.defaultPersonaId !== null && readyIds.includes(current.defaultPersonaId)) return current.defaultPersonaId
      await this.writePreferences(readyIds[0])
      return readyIds[0]
    })
  }

  async readPreferences() {
    try {
      const value = JSON.parse(await readFile(resolve(this.config.libraryDir, PREFERENCES_FILE), 'utf8'))
      if (!objectLike(value) || value.version !== 1 || (value.defaultPersonaId !== null && typeof value.defaultPersonaId !== 'string')) throw coded('ASSET_CORRUPT', 'Persona preferences are invalid.')
      if (value.defaultPersonaId !== null) assertId(value.defaultPersonaId)
      return value
    } catch (error) {
      if (error?.code === 'ENOENT') return { version: 1, defaultPersonaId: null }
      if (error?.code === 'ASSET_CORRUPT' || error?.code === 'INVALID_REQUEST') throw coded('ASSET_CORRUPT', 'Persona preferences are invalid.', error)
      throw coded('ASSET_CORRUPT', `Persona preferences are damaged: ${error instanceof Error ? error.message : String(error)}`, error)
    }
  }

  async writePreferences(defaultPersonaId) {
    await mkdir(this.config.libraryDir, { recursive: true })
    await writeJsonAtomically(this.config.libraryDir, PREFERENCES_FILE, { version: 1, defaultPersonaId })
  }
}

export async function apply(ctx, config) {
  validateConfig(config)
  const personas = new RpPersonas(ctx, config)
  const ready = personas.ensureDefault()
  if (config.exposeBrowser !== false) {
    ctx.inject(['rpRemote'], browserCtx => registerBrowser(browserCtx, personas, ready))
  }
  await ready
}

function registerBrowser(ctx, personas, ready) {
  const endpoints = new Set(['list', 'get', 'create', 'update', 'delete', 'avatar', 'set-default'])
  const dispose = ctx.rpRemote.register('/rp-personas', async (endpoint, payload) => {
    if (!endpoints.has(endpoint)) return transportSuccess(failure('INVALID_REQUEST', `Unknown persona endpoint: ${endpoint}`))
    try {
      await ready
      return transportSuccess(success(await dispatchBrowser(personas, endpoint, payload)))
    } catch (error) {
      return transportSuccess(failure(codeFor(error), error instanceof Error ? error.message : String(error)))
    }
  })
  ctx.effect(() => dispose, 'rp-persona: /rp-personas Remote')
}

export async function dispatchBrowser(personas, endpoint, payload) {
  const input = object(payload)
  switch (endpoint) {
    case 'list': return personas.list({ cursor: input.cursor, limit: input.limit ?? 50 })
    case 'get': return personas.detail(requiredId(input.id))
    case 'create': {
      const created = await personas.create(input.persona, {
        makeDefault: optionalBoolean(input.makeDefault, 'makeDefault'),
        avatar: input.avatar === undefined ? undefined : decodeAvatarUpload(input.avatar, personas.config.maxAvatarInputBytes),
      })
      return { created, detail: await personas.detail(created.id) }
    }
    case 'update': {
      const id = requiredId(input.id)
      const updated = await personas.update(id, input.persona, input.expectedRevision, {
        avatar: input.avatar === undefined ? undefined : decodeAvatarUpload(input.avatar, personas.config.maxAvatarInputBytes),
      })
      return { updated, detail: await personas.detail(id) }
    }
    case 'delete': return personas.delete(requiredId(input.id), input.expectedRevision)
    case 'avatar': {
      const avatar = await personas.avatar(requiredId(input.id))
      return { mimeType: avatar.mimeType, base64: avatar.bytes.toString('base64') }
    }
    case 'set-default': return personas.setDefault(requiredId(input.id))
    default: throw coded('INVALID_REQUEST', `Unknown persona endpoint: ${endpoint}`)
  }
}

function normalizePersona(value, maxTextCharacters) {
  if (!objectLike(value)) throw coded('INVALID_REQUEST', 'Persona must be an object.')
  const persona = {
    name: requiredText(value.name, 'name'),
    description: optionalText(value.description, 'description'),
    personality: optionalText(value.personality, 'personality'),
    scenario: optionalText(value.scenario, 'scenario'),
    firstMessage: optionalText(value.firstMessage, 'firstMessage'),
    tags: tags(value.tags),
  }
  const total = [persona.name, persona.description, persona.personality, persona.scenario, persona.firstMessage, ...persona.tags].reduce((sum, text) => sum + [...text].length, 0)
  if (total > maxTextCharacters) throw coded('LIMIT_EXCEEDED', `Persona text exceeds the ${maxTextCharacters} character limit.`)
  return persona
}
function validateEditablePersona(value) {
  if (!objectLike(value)) throw coded('INVALID_REQUEST', 'Persona must be an object.')
  const unknownField = Object.keys(value).find(key => !PERSONA_EDITABLE_FIELDS.has(key))
  if (unknownField !== undefined) throw coded('INVALID_REQUEST', `Persona contains unknown field "${unknownField}".`)
}
function normalizeStored(value, id, maxTextCharacters) {
  if (!objectLike(value) || value.id !== id || !Number.isSafeInteger(value.revision) || value.revision < 1) throw coded('ASSET_CORRUPT', 'Persona storage metadata is invalid.')
  if (typeof value.createdAt !== 'string') throw coded('ASSET_CORRUPT', 'Persona storage metadata is invalid.')
  return {
    id,
    revision: value.revision,
    ...normalizePersona(value, maxTextCharacters),
    createdAt: value.createdAt,
    avatar: normalizeStoredAvatar(value.avatar),
  }
}
function summary(value) { return { id: value.id, name: value.name, revision: value.revision, description: value.description, tags: value.tags, createdAt: value.createdAt, hasAvatar: value.avatar !== null, status: 'ready' } }
function renderPersona(value) {
  return [
    `name: ${value.name}`,
    value.description ? `description: ${value.description}` : '',
    value.personality ? `personality: ${value.personality}` : '',
    value.scenario ? `scenario: ${value.scenario}` : '',
    value.firstMessage ? `example_voice: ${value.firstMessage}` : '',
  ].filter(Boolean).join('\n')
}
function requiredText(value, field) { if (typeof value !== 'string' || value.trim().length === 0) throw coded('INVALID_REQUEST', `Persona ${field} must be a non-empty string.`); return value.trim() }
function optionalText(value, field) { if (value === undefined || value === null || value === '') return ''; if (typeof value !== 'string') throw coded('INVALID_REQUEST', `Persona ${field} must be a string.`); return value.trim() }
function optionalBoolean(value, field) { if (value === undefined) return false; if (typeof value !== 'boolean') throw coded('INVALID_REQUEST', `${field} must be a boolean.`); return value }
function tags(value) { if (value === undefined) return []; if (!Array.isArray(value) || value.length > 64 || value.some(item => typeof item !== 'string' || item.trim().length === 0)) throw coded('INVALID_REQUEST', 'Persona tags must be a string array with at most 64 entries.'); return [...new Set(value.map(item => item.trim()))] }
function pageOptions(cursor, limit) { if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) throw coded('INVALID_REQUEST', 'limit must be between 1 and 100'); const offset = cursor == null ? 0 : Number(cursor); if (!Number.isSafeInteger(offset) || offset < 0 || (cursor != null && String(offset) !== String(cursor))) throw coded('INVALID_REQUEST', 'cursor is invalid'); return { limit, offset } }
function compareAssets(left, right) { return left.name.localeCompare(right.name, undefined, { sensitivity: 'base' }) || left.id.localeCompare(right.id) }
function object(value) { if (!objectLike(value)) throw coded('INVALID_REQUEST', 'request payload must be an object'); return value }
function objectLike(value) { return typeof value === 'object' && value !== null && !Array.isArray(value) }
function assertId(id) { if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/.test(id)) throw coded('INVALID_REQUEST', 'invalid persona id') }
function requiredId(id) { assertId(id); return id }
function success(value) { return { ok: true, value } }
function failure(code, message) { return { ok: false, error: { code, message } } }
function transportSuccess(value) { return { ok: true, value } }
function coded(code, message, cause) { const error = new Error(message, { cause }); error.code = code; return error }
function codeFor(error) { return ['INVALID_REQUEST', 'INVALID_IMAGE', 'UNSUPPORTED_FORMAT', 'LIMIT_EXCEEDED', 'ASSET_CORRUPT', 'ASSET_NOT_FOUND', 'REVISION_CONFLICT'].includes(error?.code) ? error.code : 'ASSET_CORRUPT' }

function validateConfig(config) {
  for (const field of ['maxTextCharacters', 'maxAvatarInputBytes', 'maxAvatarPixels', 'avatarMaxEdgePixels']) {
    if (!Number.isSafeInteger(config[field]) || config[field] < 1) throw new Error(`rp-persona: ${field} must be a positive safe integer`)
  }
  if (!Number.isSafeInteger(config.avatarWebpQuality) || config.avatarWebpQuality < 1 || config.avatarWebpQuality > 100) throw new Error('rp-persona: avatarWebpQuality must be an integer between 1 and 100')
}

function decodeAvatarUpload(value, maxBytes) {
  if (!objectLike(value) || typeof value.name !== 'string' || typeof value.mimeType !== 'string' || typeof value.base64 !== 'string') throw coded('INVALID_REQUEST', 'Avatar upload is invalid.')
  const mimeType = value.mimeType.toLowerCase()
  const extension = value.name.split('.').at(-1)?.toLowerCase()
  if (!AVATAR_MIME_TYPES.has(mimeType) || !AVATAR_EXTENSIONS.has(extension)) throw coded('UNSUPPORTED_FORMAT', 'Avatar must be a PNG, JPEG, or WebP image.')
  if (value.base64.length === 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(value.base64) || value.base64.length % 4 !== 0) throw coded('INVALID_IMAGE', 'Avatar image data is invalid.')
  const bytes = Buffer.from(value.base64, 'base64')
  if (bytes.toString('base64') !== value.base64) throw coded('INVALID_IMAGE', 'Avatar image data is invalid.')
  if (bytes.length > maxBytes) throw coded('LIMIT_EXCEEDED', `Avatar exceeds the ${maxBytes} byte limit.`)
  return { name: value.name, mimeType, bytes }
}

async function sanitizeAvatar(upload, config) {
  if (!objectLike(upload) || !Buffer.isBuffer(upload.bytes) || typeof upload.mimeType !== 'string') throw coded('INVALID_REQUEST', 'Avatar upload is invalid.')
  if (upload.bytes.length > config.maxAvatarInputBytes) throw coded('LIMIT_EXCEEDED', `Avatar exceeds the ${config.maxAvatarInputBytes} byte limit.`)
  try {
    const image = sharp(upload.bytes, { failOn: 'error', limitInputPixels: config.maxAvatarPixels })
    const metadata = await image.metadata()
    if (!AVATAR_MIME_TYPES.has(`image/${metadata.format === 'jpg' ? 'jpeg' : metadata.format}`) || `image/${metadata.format === 'jpg' ? 'jpeg' : metadata.format}` !== upload.mimeType) throw coded('UNSUPPORTED_FORMAT', 'Avatar file content does not match its format.')
    if (!Number.isSafeInteger(metadata.width) || !Number.isSafeInteger(metadata.height) || metadata.width < 1 || metadata.height < 1 || metadata.width * metadata.height > config.maxAvatarPixels) throw coded('LIMIT_EXCEEDED', `Avatar exceeds the ${config.maxAvatarPixels} pixel limit.`)
    const result = await image.rotate().resize({ width: config.avatarMaxEdgePixels, height: config.avatarMaxEdgePixels, fit: 'inside', withoutEnlargement: true }).webp({ quality: config.avatarWebpQuality }).toBuffer({ resolveWithObject: true })
    return {
      bytes: result.data,
      metadata: { file: AVATAR_FILE, mimeType: 'image/webp', width: result.info.width, height: result.info.height },
    }
  } catch (error) {
    if (['LIMIT_EXCEEDED', 'UNSUPPORTED_FORMAT'].includes(error?.code)) throw error
    if (/pixel limit/i.test(error instanceof Error ? error.message : String(error))) throw coded('LIMIT_EXCEEDED', 'Avatar pixel limit exceeded.', error)
    throw coded('INVALID_IMAGE', 'Avatar image cannot be decoded.', error)
  }
}

function normalizeStoredAvatar(value) {
  if (value === null) return null
  if (!objectLike(value) || value.file !== AVATAR_FILE || value.mimeType !== 'image/webp' || !Number.isSafeInteger(value.width) || value.width < 1 || !Number.isSafeInteger(value.height) || value.height < 1) throw coded('ASSET_CORRUPT', 'Persona avatar metadata is invalid.')
  return { file: value.file, mimeType: value.mimeType, width: value.width, height: value.height }
}

async function writeJsonAtomically(libraryDir, filename, value) {
  const temporaryPath = resolve(libraryDir, `.${randomUUID()}.tmp`)
  await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
  await rename(temporaryPath, resolve(libraryDir, filename))
}

async function writePersonaAtomically(libraryDir, id, record, avatarBytes) {
  const temporaryDir = resolve(libraryDir, `.${id}.${randomUUID()}.tmp`)
  try {
    await mkdir(temporaryDir)
    await writeFile(resolve(temporaryDir, PERSONA_FILE), `${JSON.stringify(record, null, 2)}\n`, 'utf8')
    if (avatarBytes !== undefined) await writeFile(resolve(temporaryDir, AVATAR_FILE), avatarBytes)
    await rename(temporaryDir, resolve(libraryDir, id))
  } catch (error) {
    await rm(temporaryDir, { recursive: true, force: true })
    throw error
  }
}

async function updatePersonaAtomically(libraryDir, id, record, avatarBytes) {
  const personaDir = resolve(libraryDir, id)
  const temporaryPersona = resolve(personaDir, `.${PERSONA_FILE}.${randomUUID()}.tmp`)
  const temporaryAvatar = avatarBytes === undefined ? null : resolve(personaDir, `.${AVATAR_FILE}.${randomUUID()}.tmp`)
  try {
    if (temporaryAvatar !== null) {
      await writeFile(temporaryAvatar, avatarBytes)
      await rename(temporaryAvatar, resolve(personaDir, AVATAR_FILE))
    }
    await writeFile(temporaryPersona, `${JSON.stringify(record, null, 2)}\n`, 'utf8')
    await rename(temporaryPersona, resolve(personaDir, PERSONA_FILE))
  } catch (error) {
    await rm(temporaryPersona, { force: true })
    if (temporaryAvatar !== null) await rm(temporaryAvatar, { force: true })
    throw error
  }
}

const libraryMutations = new Map()

async function withLibraryMutation(libraryDir, operation) {
  const previous = libraryMutations.get(libraryDir) ?? Promise.resolve()
  let release
  const current = new Promise(resolve => { release = resolve })
  libraryMutations.set(libraryDir, current)
  await previous
  try {
    return await operation()
  } finally {
    release()
    if (libraryMutations.get(libraryDir) === current) libraryMutations.delete(libraryDir)
  }
}
