import { randomUUID } from 'node:crypto'
import { mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { Service } from '@deepseek-ai/cordis'
import Schema from '@deepseek-ai/schemastery'

const CATALOG_VERSION = 3
const CATALOG_FILE = 'catalog.json'
const WRITER_ID = 'writer'
const MANAGED_TOOLS = Object.freeze(['web_search', 'skill'])
const OPEN_INPUT_SCHEMA = Object.freeze({ type: 'object', properties: Object.freeze({}), additionalProperties: true })
const INITIAL_SUBAGENT_CONFIG = Schema.object({
  name: Schema.string().required(),
  description: Schema.string().required(),
  instructions: Schema.string().required(),
  enabled: Schema.boolean().default(true),
  route: Schema.object({
    kind: Schema.union(['inherit', 'fixed']).required(),
    provider: Schema.string(),
    model: Schema.string(),
  }).required(),
  tools: Schema.array(Schema.union(MANAGED_TOOLS)).default([]),
})

export const name = 'rp-subagent-manager'
export const inject = []
export const Config = Schema.object({
  catalogDir: Schema.string().required(),
  maxSubagents: Schema.number().default(32),
  maxNameCharacters: Schema.number().default(80),
  maxDescriptionCharacters: Schema.number().default(240),
  maxInstructionsCharacters: Schema.number().default(20000),
  initialSubagents: Schema.array(INITIAL_SUBAGENT_CONFIG).default([]),
  exposeBrowser: Schema.boolean().default(true),
})

/** Versioned global Writer and isolated task-subagent catalog. */
export class RpSubagentManager extends Service {
  /** @param {import('@deepseek-ai/cordis').Context} ctx @param {Record<string, unknown>} config */
  constructor(ctx, config) {
    super(ctx, 'rpSubagentManager')
    this.config = { ...config, catalogDir: resolve(config.catalogDir) }
    this.catalogPath = resolve(this.config.catalogDir, CATALOG_FILE)
  }

  async initialize() {
    await withCatalogMutation(this.catalogPath, async () => {
      try {
        const catalog = await this.readCatalog()
        if (catalog.migratedFrom !== undefined) await this.writeCatalog(catalog)
      } catch (error) {
        if (error?.code !== 'ENOENT') throw error
        const catalog = seedCatalog(this.config)
        for (const subagent of catalog.subagents) await validateRouteModel(this.ctx, subagent.route)
        await this.writeCatalog(catalog)
      }
    })
  }

  async list() {
    const catalog = await this.readCatalog()
    return detached({
      version: catalog.version,
      writer: writerView(catalog.writer),
      subagents: catalog.subagents,
      limits: {
        subagents: this.config.maxSubagents,
        name: this.config.maxNameCharacters,
        description: this.config.maxDescriptionCharacters,
        instructions: this.config.maxInstructionsCharacters,
      },
    })
  }

  async get(id) {
    const catalog = await this.readCatalog()
    if (id === WRITER_ID) return detached(writerView(catalog.writer))
    const subagent = catalog.subagents.find(item => item.id === id)
    if (subagent === undefined) throw coded('SUBAGENT_NOT_FOUND', `Task subagent ${String(id)} does not exist.`)
    return detached(subagent)
  }

  async create(input, signal) {
    const subagentInput = { ...normalizeSubagentInput(input, this.config), enabled: normalizeEnabled(input.enabled, true) }
    await validateRouteModel(this.ctx, subagentInput.route, signal)
    return withCatalogMutation(this.catalogPath, async () => {
      const catalog = await this.readCatalog()
      if (catalog.subagents.length >= this.config.maxSubagents) throw coded('LIMIT_EXCEEDED', `At most ${this.config.maxSubagents} task subagents can be stored.`)
      assertUniqueName(catalog.subagents, subagentInput.name)
      const now = new Date().toISOString()
      const subagent = { id: randomUUID(), revision: 1, ...subagentInput, createdAt: now, updatedAt: now }
      catalog.subagents.push(subagent)
      await this.writeCatalog(catalog)
      return detached(subagent)
    })
  }

  async update(id, input, expectedRevision, signal) {
    assertSubagentId(id)
    if (id === WRITER_ID) throw coded('WRITER_FIXED', 'Writer can only update its model route.')
    const subagentInput = normalizeSubagentInput(input, this.config)
    await validateRouteModel(this.ctx, subagentInput.route, signal)
    return withCatalogMutation(this.catalogPath, async () => {
      const catalog = await this.readCatalog()
      const index = catalog.subagents.findIndex(item => item.id === id)
      if (index < 0) throw coded('SUBAGENT_NOT_FOUND', `Task subagent ${id} does not exist.`)
      const current = catalog.subagents[index]
      assertRevision(expectedRevision, current.revision)
      assertUniqueName(catalog.subagents, subagentInput.name, id)
      const subagent = { ...current, ...subagentInput, revision: current.revision + 1, updatedAt: new Date().toISOString() }
      catalog.subagents[index] = subagent
      await this.writeCatalog(catalog)
      return detached(subagent)
    })
  }

  async delete(id, expectedRevision) {
    assertSubagentId(id)
    if (id === WRITER_ID) throw coded('WRITER_FIXED', 'Writer cannot be deleted.')
    return withCatalogMutation(this.catalogPath, async () => {
      const catalog = await this.readCatalog()
      const index = catalog.subagents.findIndex(item => item.id === id)
      if (index < 0) throw coded('SUBAGENT_NOT_FOUND', `Task subagent ${id} does not exist.`)
      assertRevision(expectedRevision, catalog.subagents[index].revision)
      catalog.subagents.splice(index, 1)
      await this.writeCatalog(catalog)
      return { id }
    })
  }

  async setEnabled(id, enabled, expectedRevision) {
    assertSubagentId(id)
    if (id === WRITER_ID) throw coded('WRITER_FIXED', 'Writer is always enabled.')
    if (typeof enabled !== 'boolean') throw coded('INVALID_REQUEST', 'Subagent enabled state must be a boolean.')
    return withCatalogMutation(this.catalogPath, async () => {
      const catalog = await this.readCatalog()
      const index = catalog.subagents.findIndex(item => item.id === id)
      if (index < 0) throw coded('SUBAGENT_NOT_FOUND', `Task subagent ${id} does not exist.`)
      const current = catalog.subagents[index]
      assertRevision(expectedRevision, current.revision)
      if (current.enabled === enabled) return detached(current)
      const subagent = { ...current, enabled, revision: current.revision + 1, updatedAt: new Date().toISOString() }
      catalog.subagents[index] = subagent
      await this.writeCatalog(catalog)
      return detached(subagent)
    })
  }

  async updateWriter(routeInput, expectedRevision, signal) {
    const route = normalizeRoute(routeInput)
    await validateRouteModel(this.ctx, route, signal)
    return withCatalogMutation(this.catalogPath, async () => {
      const catalog = await this.readCatalog()
      assertRevision(expectedRevision, catalog.writer.revision)
      catalog.writer = { revision: catalog.writer.revision + 1, route }
      await this.writeCatalog(catalog)
      return detached(writerView(catalog.writer))
    })
  }

  /** Read once for one runtime preparation and project immutable child definitions. */
  async prepareRuntimeProfile() {
    const catalog = await this.readCatalog()
    const enabledSubagents = catalog.subagents.filter(subagent => subagent.enabled)
    return detached({
      writer: fixedRoute(catalog.writer.route),
      subagents: enabledSubagents.map((subagent, order) => ({
        id: subagent.id,
        label: subagent.name,
        description: subagent.description,
        persona: renderTaskPersona(subagent),
        inputSchema: OPEN_INPUT_SCHEMA,
        toolFilter: { allow: subagent.tools },
        ...(fixedRoute(subagent.route) === undefined ? {} : { route: fixedRoute(subagent.route) }),
        order,
      })),
      revisions: {
        writer: catalog.writer.revision,
        subagents: Object.fromEntries(enabledSubagents.map(subagent => [subagent.id, subagent.revision])),
      },
    })
  }

  async readCatalog() {
    try {
      const file = await stat(this.catalogPath)
      if (!file.isFile() || file.size > maxCatalogBytes(this.config)) throw coded('ASSET_CORRUPT', 'Subagent catalog has an invalid size or file type.')
      return normalizeStoredCatalog(JSON.parse(await readFile(this.catalogPath, 'utf8')), this.config)
    } catch (error) {
      if (error?.code === 'ENOENT') throw error
      if (error?.code === 'ASSET_CORRUPT') throw error
      throw coded('ASSET_CORRUPT', `Subagent catalog is damaged: ${error instanceof Error ? error.message : String(error)}`, error)
    }
  }

  async writeCatalog(catalog) {
    const normalized = normalizeStoredCatalog(catalog, this.config)
    await mkdir(this.config.catalogDir, { recursive: true, mode: 0o700 })
    const temporary = resolve(this.config.catalogDir, `.${CATALOG_FILE}.${randomUUID()}.tmp`)
    try {
      await writeFile(temporary, `${JSON.stringify(normalized, null, 2)}\n`, { encoding: 'utf8', mode: 0o600, flag: 'wx' })
      await rename(temporary, this.catalogPath)
    } finally {
      await rm(temporary, { force: true })
    }
  }
}

/** The user's work instructions are the complete System persona for this task. */
function renderTaskPersona(subagent) {
  return subagent.instructions
}

/** @param {import('@deepseek-ai/cordis').Context} ctx @param {Record<string, unknown>} config */
export async function apply(ctx, config) {
  validateConfig(config)
  const manager = new RpSubagentManager(ctx, config)
  const ready = manager.initialize()
  ctx.inject(['rpRuntime'], runtimeCtx => runtimeCtx.rpRuntime.registerSubagentProfileProvider({
    id: 'rp-subagent-manager',
    prepare: async () => {
      await ready
      return manager.prepareRuntimeProfile()
    },
  }))
  if (config.exposeBrowser !== false) {
    ctx.inject(['connection'], browserCtx => registerBrowser(browserCtx, manager, ready))
  }
  await ready
}

function registerBrowser(ctx, manager, ready) {
  const endpoints = new Set(['list', 'get', 'create', 'update', 'delete', 'set-enabled', 'writer/update'])
  const dispose = ctx.connection.rpc.handle('/rp-subagents', async (endpoint, payload, signal) => {
    if (!endpoints.has(endpoint)) return transportSuccess(failure('INVALID_REQUEST', `Unknown subagent endpoint: ${endpoint}`))
    try {
      await ready
      return transportSuccess(success(await dispatchBrowser(manager, endpoint, payload, signal)))
    } catch (error) {
      return transportSuccess(failure(codeFor(error), error instanceof Error ? error.message : String(error)))
    }
  }, { authority: 'trusted-host' })
  ctx.effect(() => dispose, 'rp-subagent-manager: /rp-subagents RPC')
}

export async function dispatchBrowser(manager, endpoint, payload, signal) {
  const input = object(payload)
  switch (endpoint) {
    case 'list': return manager.list()
    case 'get': return manager.get(requiredId(input.id))
    case 'create': return manager.create(input.subagent, signal)
    case 'update': return manager.update(requiredId(input.id), input.subagent, input.expectedRevision, signal)
    case 'delete': return manager.delete(requiredId(input.id), input.expectedRevision)
    case 'set-enabled': return manager.setEnabled(requiredId(input.id), input.enabled, input.expectedRevision)
    case 'writer/update': return manager.updateWriter(input.route, input.expectedRevision, signal)
    default: throw coded('INVALID_REQUEST', `Unknown subagent endpoint: ${endpoint}`)
  }
}

function seedCatalog(config) {
  const now = new Date().toISOString()
  return {
    version: CATALOG_VERSION,
    writer: { revision: 1, route: { kind: 'inherit' } },
    subagents: normalizeInitialSubagents(config.initialSubagents ?? [], config).map(subagent => ({
      id: randomUUID(),
      revision: 1,
      ...subagent,
      createdAt: now,
      updatedAt: now,
    })),
  }
}

/** Validate optional first-catalog task-subagent examples without coupling them to runtime order. */
export function normalizeInitialSubagents(value, config) {
  if (!Array.isArray(value)) throw coded('INVALID_REQUEST', 'Initial task subagents must be an array.')
  if (value.length > config.maxSubagents) throw coded('LIMIT_EXCEEDED', `At most ${config.maxSubagents} initial task subagents can be stored.`)
  const subagents = value.map(subagent => ({
    ...normalizeSubagentInput(subagent, config),
    enabled: normalizeEnabled(subagent.enabled, true),
  }))
  const names = new Set()
  for (const subagent of subagents) {
    const key = nameKey(subagent.name)
    if (names.has(key)) throw coded('NAME_CONFLICT', `Initial task subagent name ${subagent.name} is duplicated.`)
    names.add(key)
  }
  return subagents
}

function normalizeStoredCatalog(value, config) {
  if (!objectLike(value) || !objectLike(value.writer)) {
    throw coded('ASSET_CORRUPT', 'Subagent catalog shape is invalid.')
  }
  const storedSubagents = (value.version === CATALOG_VERSION || value.version === 2) && Array.isArray(value.subagents)
    ? value.subagents
    : value.version === 1 && Array.isArray(value.roles)
      ? value.roles
      : undefined
  if (storedSubagents === undefined) throw coded('ASSET_CORRUPT', 'Subagent catalog shape is invalid.')
  if (storedSubagents.length > config.maxSubagents) throw coded('ASSET_CORRUPT', 'Subagent catalog exceeds the configured task-subagent limit.')
  const writer = normalizeStoredWriter(value.writer)
  const ids = new Set()
  const names = new Set()
  const subagents = storedSubagents.map(subagent => {
    const normalized = normalizeStoredSubagent(subagent, config, value.version)
    if (ids.has(normalized.id)) throw coded('ASSET_CORRUPT', `Duplicate task subagent id ${normalized.id}.`)
    const key = nameKey(normalized.name)
    if (names.has(key)) throw coded('ASSET_CORRUPT', `Duplicate task subagent name ${normalized.name}.`)
    ids.add(normalized.id)
    names.add(key)
    return normalized
  })
  return {
    version: CATALOG_VERSION,
    writer,
    subagents,
    ...(value.version === CATALOG_VERSION ? {} : { migratedFrom: value.version }),
  }
}

function normalizeStoredWriter(value) {
  if (Object.keys(value).some(key => !['revision', 'route'].includes(key)) || !validRevision(value.revision)) {
    throw coded('ASSET_CORRUPT', 'Writer storage metadata is invalid.')
  }
  return { revision: value.revision, route: normalizeRoute(value.route, 'ASSET_CORRUPT') }
}

function normalizeStoredSubagent(value, config, catalogVersion) {
  if (!objectLike(value)) throw coded('ASSET_CORRUPT', 'Stored task subagent must be an object.')
  assertSubagentId(value.id, 'ASSET_CORRUPT')
  if (value.id === WRITER_ID || !validRevision(value.revision) || !validTimestamp(value.createdAt) || !validTimestamp(value.updatedAt)) {
    throw coded('ASSET_CORRUPT', 'Task subagent storage metadata is invalid.')
  }
  return {
    id: value.id,
    revision: value.revision,
    ...normalizeSubagentInput(value, config, 'ASSET_CORRUPT'),
    enabled: normalizeEnabled(value.enabled, catalogVersion === CATALOG_VERSION ? undefined : true, 'ASSET_CORRUPT'),
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  }
}

function normalizeSubagentInput(value, config, code = 'INVALID_REQUEST') {
  if (!objectLike(value)) throw coded(code, 'Task subagent must be an object.')
  return {
    name: requiredText(value.name, 'name', config.maxNameCharacters, code),
    description: requiredText(value.description, 'description', config.maxDescriptionCharacters, code),
    instructions: requiredText(value.instructions, 'instructions', config.maxInstructionsCharacters, code),
    route: normalizeRoute(value.route, code),
    tools: normalizeTools(value.tools, code),
  }
}

function normalizeRoute(value, code = 'INVALID_REQUEST') {
  if (!objectLike(value)) throw coded(code, 'Model route must be an object.')
  if (value.kind === 'inherit') {
    if (Object.keys(value).some(key => key !== 'kind')) throw coded(code, 'Inherited model route cannot contain fixed-model fields.')
    return { kind: 'inherit' }
  }
  if (value.kind !== 'fixed') throw coded(code, 'Model route kind must be inherit or fixed.')
  const provider = requiredText(value.provider, 'provider', 256, code)
  const model = requiredText(value.model, 'model', 256, code)
  if (Object.keys(value).some(key => !['kind', 'provider', 'model'].includes(key))) throw coded(code, 'Fixed model route contains unsupported fields.')
  return { kind: 'fixed', provider, model }
}

function normalizeTools(value, code) {
  if (!Array.isArray(value) || value.some(tool => typeof tool !== 'string')) throw coded(code, 'Subagent tools must be an array.')
  if (new Set(value).size !== value.length || value.some(tool => !MANAGED_TOOLS.includes(tool))) {
    throw coded(code, 'Subagent tools may contain web_search and skill only, without duplicates.')
  }
  return MANAGED_TOOLS.filter(tool => value.includes(tool))
}

function normalizeEnabled(value, fallback, code = 'INVALID_REQUEST') {
  if (value === undefined && fallback !== undefined) return fallback
  if (typeof value !== 'boolean') throw coded(code, 'Subagent enabled state must be a boolean.')
  return value
}

async function validateRouteModel(ctx, route, signal) {
  if (route.kind === 'inherit') return
  const llm = ctx.get('llm')
  if (llm === undefined || typeof llm.resolveModelInfo !== 'function') throw coded('MODEL_UNAVAILABLE', 'Model routing is unavailable.')
  try {
    const resolved = await llm.resolveModelInfo(route.provider, route.model, signal)
    if (resolved.provider !== route.provider || resolved.id !== route.model) throw new Error('resolved model identity differs')
  } catch (error) {
    throw coded('MODEL_UNAVAILABLE', `Model ${route.provider}/${route.model} is unavailable.`, error)
  }
}

function fixedRoute(route) { return route.kind === 'fixed' ? { provider: route.provider, model: route.model } : undefined }
function writerView(writer) { return { id: WRITER_ID, fixed: true, revision: writer.revision, route: writer.route } }
function assertUniqueName(subagents, name, ignoreId) { const key = nameKey(name); if (subagents.some(subagent => subagent.id !== ignoreId && nameKey(subagent.name) === key)) throw coded('NAME_CONFLICT', `Task subagent name ${name} is already in use.`) }
function nameKey(value) { return value.normalize('NFKC').toLocaleLowerCase('en-US') }
function assertRevision(expected, current) { if (!Number.isSafeInteger(expected) || expected !== current) throw coded('REVISION_CONFLICT', `Subagent revision conflict: expected ${String(expected)}, current ${current}.`) }
function validRevision(value) { return Number.isSafeInteger(value) && value >= 1 }
function validTimestamp(value) { return typeof value === 'string' && Number.isFinite(Date.parse(value)) }
function requiredText(value, field, limit, code) { if (typeof value !== 'string') throw coded(code, `Subagent ${field} must be a string.`); const text = value.replaceAll('\r\n', '\n').replaceAll('\r', '\n').trim(); if (text.length === 0) throw coded(code, `Subagent ${field} cannot be empty.`); if ([...text].length > limit) throw coded(code === 'ASSET_CORRUPT' ? code : 'LIMIT_EXCEEDED', `Subagent ${field} exceeds ${limit} characters.`); return text }
function assertSubagentId(id, code = 'INVALID_REQUEST') { if (typeof id !== 'string' || (id !== WRITER_ID && !/^[0-9a-f-]{36}$/.test(id))) throw coded(code, 'Invalid subagent id.') }
function requiredId(id) { assertSubagentId(id); return id }
function maxCatalogBytes(config) { return 16384 + config.maxSubagents * (4096 + 4 * (config.maxNameCharacters + config.maxDescriptionCharacters + config.maxInstructionsCharacters)) }
function object(value) { if (!objectLike(value)) throw coded('INVALID_REQUEST', 'Request payload must be an object.'); return value }
function objectLike(value) { return typeof value === 'object' && value !== null && !Array.isArray(value) }
function detached(value) { return JSON.parse(JSON.stringify(value)) }
function success(value) { return { ok: true, value } }
function failure(code, message) { return { ok: false, error: { code, message } } }
function transportSuccess(value) { return { ok: true, value } }
function coded(code, message, cause) { const error = new Error(message, { cause }); error.code = code; return error }
function codeFor(error) { return ['INVALID_REQUEST', 'LIMIT_EXCEEDED', 'ASSET_CORRUPT', 'SUBAGENT_NOT_FOUND', 'REVISION_CONFLICT', 'NAME_CONFLICT', 'WRITER_FIXED', 'MODEL_UNAVAILABLE'].includes(error?.code) ? error.code : 'ASSET_CORRUPT' }
function validateConfig(config) {
  if (typeof config.catalogDir !== 'string' || config.catalogDir.trim().length === 0) throw new Error('rp-subagent-manager: catalogDir must be a non-empty path')
  for (const field of ['maxSubagents', 'maxNameCharacters', 'maxDescriptionCharacters', 'maxInstructionsCharacters']) {
    if (!Number.isSafeInteger(config[field]) || config[field] < 1) throw new Error(`rp-subagent-manager: ${field} must be a positive safe integer`)
  }
  normalizeInitialSubagents(config.initialSubagents ?? [], config)
}

const catalogMutations = new Map()
async function withCatalogMutation(path, operation) {
  const previous = catalogMutations.get(path) ?? Promise.resolve()
  let release
  const current = new Promise(resolvePromise => { release = resolvePromise })
  catalogMutations.set(path, current)
  await previous
  try { return await operation() } finally { release(); if (catalogMutations.get(path) === current) catalogMutations.delete(path) }
}
