import { createHash, randomUUID } from 'node:crypto'
import { mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { Service } from '@deepseek-ai/cordis'
import Schema from '@deepseek-ai/schemastery'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { activateLore, groupActivatedLore, LORE_SLOT_DEFINITIONS, normalizeLoreBook, serializeLoreBookV3 } from './activation.js'

export { activateLore, classifyLoreEntry, groupActivatedLore, LORE_LEVELS, LORE_SLOT_DEFINITIONS, normalizeLoreBook, serializeLoreBookV3 } from './activation.js'
export const name = 'rp-lore-book'
export const inject = []
export const Config = Schema.object({
  libraryDir: Schema.string().required(),
  maxInputBytes: Schema.number().default(2 * 1024 * 1024),
  maxTokens: Schema.number().default(4096),
  maxEntries: Schema.number().default(128),
  maxRecursiveDepth: Schema.number().default(3),
  registerTool: Schema.boolean().default(true),
  exposeBrowser: Schema.boolean().default(false),
})

const EDITABLE_ENTRY_FIELDS = new Set([
  'id', 'name', 'semanticKey', 'level', 'keys', 'secondaryKeys', 'stateCondition', 'content',
  'enabled', 'constant', 'caseSensitive', 'recursive', 'order', 'position',
  'insertionPosition', 'depth', 'probability',
])
const EDITABLE_ENTRY_LEVELS = new Set(['worldDescription', 'roleplayGuide', 'importantRules'])
const EDITABLE_INSERTION_POSITIONS = new Set(['before_char', 'after_char', 'before_examples', 'after_examples', 'in_chat', 'before_an', 'after_an'])

export class RpLoreBooks extends Service {
  constructor(ctx, config) {
    super(ctx, 'rpLoreBooks')
    this.config = { ...config, libraryDir: resolve(config.libraryDir) }
    this.embeddedSync = undefined
    this.runAssemblies = new Map()
    this.activationAdapters = new Map()
    this.entryValidators = new Map()
    ctx.effect(() => () => invalidateLibraryListing(this.config.libraryDir), 'rp-lore-book: release derived library listing')
    ctx.inject(['rpCharacterCards'], cardsCtx => cardsCtx.effect(() => cardsCtx.rpCharacterCards.registerEmbeddedLoreManager({
      materialize: input => this.materializeEmbedded(input),
      rollback: id => this.delete(id),
      exportV3: input => this.exportEmbeddedV3(input),
    }), 'rp-lore-book: embedded character lore manager'))
    // Asset browsing can exist without a runtime. Waiting for the service keeps
    // preset startup order from silently dropping the lore context source.
    ctx.inject(['rpRuntime'], runtimeCtx => {
      const sources = [
        { ...LORE_SLOT_DEFINITIONS[0], order: -60, budgetPriority: -10, label: '世界设定', description: '根据本轮输入、会话状态和世界书规则激活的世界背景。', defaultSlot: { id: 'world', label: '世界设定', order: -60 } },
        { ...LORE_SLOT_DEFINITIONS[1], order: -50, budgetPriority: 10, label: '扮演指导', description: '根据本轮输入激活的人物关系、经历与人物知识。', defaultSlot: { id: 'character-lore', label: '扮演指导', order: -50 }, dependsOn: [LORE_SLOT_DEFINITIONS[0].id, 'rp.card'] },
        { ...LORE_SLOT_DEFINITIONS[2], order: 30, budgetPriority: 40, label: '重要规则', description: '本轮需要重点遵守的世界书规则与约束。', defaultSlot: { id: 'important-rules', label: '重要规则', order: 30 }, dependsOn: [LORE_SLOT_DEFINITIONS[0].id, 'rp.card', LORE_SLOT_DEFINITIONS[1].id] },
      ]
      const disposers = sources.map(slot => runtimeCtx.rpRuntime.registerContextSource({
        id: slot.id,
        label: slot.label,
        description: slot.description,
        kind: 'shared-reference',
        promptCategory: 'factual',
        order: slot.order,
        budgetPriority: slot.budgetPriority,
        defaultSlot: slot.defaultSlot,
        dependsOn: slot.dependsOn,
        prepare: context => this.prepareLoreSlot(context, slot),
      }))
      return () => disposers.reverse().forEach(dispose => dispose())
    })
  }

  async prepareLoreSlot(context, slot) {
    const assembly = await this.loreAssembly(context)
    const entries = assembly?.groups[slot.level] ?? []
    if (entries.length === 0) return undefined
    return {
      revision: assembly.revision,
      text: entries.map(entry => entry.content).join('\n\n'),
      diagnostics: {
        slot: { level: slot.level, label: slot.label },
        usedTokens: entries.reduce((total, entry) => total + entry.tokens, 0),
        totalUsedTokens: assembly.result.usedTokens,
        maxTokens: assembly.result.maxTokens,
        order: assembly.books.map(book => ({ id: book.id, name: book.name, embedded: book.embedded === true })),
        activation: assembly.result.diagnostics.filter(item => item.level === slot.level),
      },
    }
  }

  loreAssembly(context) {
    const epoch = Number.isSafeInteger(context.contextEpoch) && context.contextEpoch >= 0 ? context.contextEpoch : 0
    const key = `${context.runId}:${epoch}`
    let pending = this.runAssemblies.get(key)
    if (pending !== undefined) return pending
    pending = this.assembleLore(context).catch((error) => {
      if (this.runAssemblies.get(key) === pending) this.runAssemblies.delete(key)
      throw error
    })
    this.runAssemblies.set(key, pending)
    while (this.runAssemblies.size > 32) this.runAssemblies.delete(this.runAssemblies.keys().next().value)
    return pending
  }

  async assembleLore({ agent, runId, messages }) {
    const sessions = this.ctx.get('rpSessions')
    if (sessions === undefined) throw new Error('rp-lore-book: rpSessions is required by lore prompt slots')
    const profile = sessions.get(agent)
    const books = []
    for (const [index, binding] of profile.resources.lorebooks.entries()) {
      try {
        books.push({ ...(await this.get(binding.id)), priority: index })
      } catch (error) {
        if (!isUnavailableBinding(error)) throw error
      }
    }
    const cardBinding = profile.resources.card
    if (cardBinding !== undefined) {
      const cards = this.ctx.get('rpCharacterCards')
      if (cards === undefined) throw new Error('rp-lore-book: rpCharacterCards is required by a bound character card')
      let character
      try {
        character = await cards.get(cardBinding.id)
      } catch (error) {
        if (!isUnavailableBinding(error)) throw error
      }
      if (character !== undefined) {
        const managedByBoundBook = books.some(book => book.sourceCharacterId === cardBinding.id)
        const hasRecordedRelationship = Array.isArray(character.embeddedLorebooks)
        if (character.characterBook && !managedByBoundBook && !hasRecordedRelationship) books.push({ ...normalizeLoreBook(character.characterBook, `card:${cardBinding.id}`), priority: books.length, embedded: true })
      }
    }
    if (books.length === 0) return undefined
    const adapters = []
    for (const definition of [...this.activationAdapters.values()].sort((left, right) => (left.order ?? 0) - (right.order ?? 0) || left.id.localeCompare(right.id))) {
      const prepared = await definition.prepare({ agent, profile, books, runId, messages })
      if (prepared === undefined) continue
      if (typeof prepared.transformEntry !== 'function' && typeof prepared.gateEntry !== 'function') {
        throw new Error(`lore activation adapter "${definition.id}" returned neither transformEntry nor gateEntry`)
      }
      adapters.push({ id: definition.id, ...prepared })
    }
    const corpus = messageText(messages)
    const bookCorpora = new Map(books.map(book => [book.id, messageText(messages, book.scanDepth)]))
    const result = activateLore({ books, corpus, bookCorpora, runId, adapters, maxDepth: this.config.maxRecursiveDepth, maxEntries: this.config.maxEntries, maxTokens: this.config.maxTokens })
    const adapterRevision = adapters.map(adapter => `${adapter.id}:${String(adapter.revision ?? 'none')}`).join(',')
    return { books, result, groups: groupActivatedLore(result), revision: `${books.map(book => `${book.id}:${book.revision ?? 1}:${book.sourceHash ?? ''}`).join(',')}:adapters:${adapterRevision}` }
  }

  /** Register an ordered, run-scoped entry adapter without assigning its data model to the lorebook service. */
  registerActivationAdapter(definition) {
    if (!definition || typeof definition !== 'object' || typeof definition.id !== 'string' || definition.id.length === 0 || typeof definition.prepare !== 'function') {
      throw new Error('lore activation adapter requires a non-empty id and prepare function')
    }
    if (this.activationAdapters.has(definition.id)) throw new Error(`lore activation adapter "${definition.id}" is already registered`)
    this.activationAdapters.set(definition.id, definition)
    const dispose = this.ctx.effect(() => () => {
      if (this.activationAdapters.get(definition.id) === definition) this.activationAdapters.delete(definition.id)
    }, `rpLoreBooks.registerActivationAdapter(${definition.id})`)
    return () => void dispose()
  }

  /** Register one format-neutral validator for normalized lore entries. */
  registerEntryValidator(definition) {
    if (!definition || typeof definition !== 'object' || typeof definition.id !== 'string' || definition.id.length === 0 || typeof definition.validate !== 'function') {
      throw new Error('lore entry validator requires a non-empty id and validate function')
    }
    if (this.entryValidators.has(definition.id)) throw new Error(`lore entry validator "${definition.id}" is already registered`)
    this.entryValidators.set(definition.id, definition)
    const dispose = this.ctx.effect(() => () => {
      if (this.entryValidators.get(definition.id) === definition) this.entryValidators.delete(definition.id)
    }, `rpLoreBooks.registerEntryValidator(${definition.id})`)
    return () => void dispose()
  }

  validateEntries(entries) {
    for (const entry of entries) for (const definition of this.entryValidators.values()) {
      try { definition.validate(entry) } catch (error) {
        throw coded(
          'INVALID_REQUEST',
          `条目“${entry.name}”的变量启用条件无效，请检查函数名、路径、引号和比较符号。`,
          error,
        )
      }
    }
  }

  async import(value, options = {}) {
    return withLibraryMutation(this.config.libraryDir, () => this.importUnlocked(value, options))
  }

  async importUnlocked(value, options = {}) {
    const book = normalizeLoreBook(value, randomUUID())
    this.validateEntries(book.entries)
    book.id = randomUUID()
    book.revision = 1
    book.sourceHash = hashBook(book)
    book.importedAt = new Date().toISOString()
    if (typeof options.sourceName === 'string') book.sourceName = basename(options.sourceName)
    await mkdir(this.config.libraryDir, { recursive: true })
    if (await this.findByHash(book.sourceHash) !== undefined) throw coded('DUPLICATE_ASSET', `Lorebook with hash ${book.sourceHash} is already imported.`)
    const finalPath = resolve(this.config.libraryDir, `${book.id}.json`)
    const temporaryPath = resolve(this.config.libraryDir, `.${book.id}.${randomUUID()}.tmp`)
    await writeFile(temporaryPath, `${JSON.stringify(book, null, 2)}\n`, 'utf8')
    await rename(temporaryPath, finalPath)
    return { id: book.id, name: book.name, revision: book.revision, sourceHash: book.sourceHash, entries: book.entries.length, path: finalPath }
  }

  async create(input) {
    return withLibraryMutation(this.config.libraryDir, () => this.createUnlocked(input))
  }

  async createUnlocked(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw coded('INVALID_REQUEST', 'lorebook must be an object')
    if (Object.keys(input).some(key => !['name', 'entries'].includes(key))) throw coded('INVALID_REQUEST', 'lorebook contains an unknown field')
    if (typeof input.name !== 'string' || input.name.trim().length === 0) throw coded('INVALID_REQUEST', 'lorebook name is required')
    const entries = input.entries ?? []
    validateEditableEntries(entries)
    const id = randomUUID()
    const normalized = normalizeLoreBook({ name: input.name.trim(), entries }, id)
    this.validateEntries(normalized.entries)
    const now = new Date().toISOString()
    const book = { ...normalized, id, revision: 1, sourceHash: hashBook(normalized), importedAt: now, createdAt: now }
    if (Buffer.byteLength(JSON.stringify(book), 'utf8') > this.config.maxInputBytes) throw coded('LIMIT_EXCEEDED', `Lorebook exceeds the ${this.config.maxInputBytes} byte limit.`)
    await this.writeBook(book)
    return { created: summary(book), detail: await this.detail(id) }
  }

  /** Materialize a character card's embedded book as a first-class lore asset. */
  async materializeEmbedded({ characterId, characterName, characterBook, sourceName }) {
    return withLibraryMutation(this.config.libraryDir, () => this.materializeEmbeddedUnlocked({ characterId, characterName, characterBook, sourceName }))
  }

  async materializeEmbeddedUnlocked({ characterId, characterName, characterBook, sourceName }) {
    assertCharacterId(characterId)
    const existing = await this.findByCharacterId(characterId)
    const normalized = normalizeLoreBook(characterBook, existing?.id ?? randomUUID())
    this.validateEntries(normalized.entries)
    if (existing !== undefined) {
      const stored = await this.readStored(existing.id)
      if (stored.schemaVersion !== 3 || stored.embeddedNormalizationVersion !== 8) {
        const now = new Date().toISOString()
        const name = typeof stored.name === 'string' && stored.name.trim() ? stored.name : normalized.name
        const contents = { ...normalized, id: existing.id, name }
        const migrated = {
          ...contents,
          sourceEntryCount: rawEntryCount(characterBook),
          embeddedNormalizationVersion: 8,
          revision: Number.isSafeInteger(stored.revision) && stored.revision >= 1 ? stored.revision + 1 : 1,
          sourceHash: hashBook(contents),
          importedAt: typeof stored.importedAt === 'string' ? stored.importedAt : now,
          updatedAt: now,
          sourceName: typeof stored.sourceName === 'string' ? stored.sourceName : typeof sourceName === 'string' ? basename(sourceName) : null,
          sourceCharacterId: characterId,
          sourceCharacterName: typeof characterName === 'string' && characterName.trim() ? characterName.trim() : '未命名角色',
          embedded: true,
        }
        await this.writeBook(migrated)
        return summary(migrated)
      }
      const current = await this.get(existing.id)
      return summary(current)
    }
    const id = randomUUID()
    const book = {
      ...normalized,
      id,
      revision: 1,
      sourceHash: hashBook(normalized),
      importedAt: new Date().toISOString(),
      sourceName: typeof sourceName === 'string' ? basename(sourceName) : null,
      sourceCharacterId: characterId,
      sourceCharacterName: typeof characterName === 'string' && characterName.trim() ? characterName.trim() : '未命名角色',
      embedded: true,
      sourceEntryCount: rawEntryCount(characterBook),
      embeddedNormalizationVersion: 8,
    }
    await this.writeBook(book)
    return summary(book)
  }

  /** Resolve every live lorebook associated with a card and serialize it for CCv3 export. */
  async exportEmbeddedV3({ characterId, linkedLorebookIds = [] }) {
    assertCharacterId(characterId)
    if (!Array.isArray(linkedLorebookIds) || linkedLorebookIds.some(id => typeof id !== 'string' || !/^[0-9a-f-]{36}$/.test(id))) {
      throw coded('INVALID_REQUEST', 'linked lorebook ids must be an array of asset ids')
    }
    const ids = new Set(linkedLorebookIds)
    const reverseLinks = await this.listDeletionCandidates(characterId)
    reverseLinks.sort((left, right) => left.name.localeCompare(right.name) || left.id.localeCompare(right.id))
    for (const relation of reverseLinks) ids.add(relation.id)

    const books = []
    for (const id of ids) {
      try {
        books.push(await this.get(id))
      } catch (error) {
        if (error?.code !== 'ASSET_NOT_FOUND') throw error
      }
    }
    if (books.length === 0) return undefined
    const serialized = books.map(serializeLoreBookV3)
    return {
      characterBook: mergeSerializedLoreBooks(serialized, books),
      lorebooks: books.map(book => ({ id: book.id, name: book.name, entries: book.entries.length })),
    }
  }

  async get(id) {
    const raw = await this.readStored(id)
    if (raw.schemaVersion !== 3) throw coded('UNSUPPORTED_SCHEMA', '这个世界书使用旧版内部格式，请删除后重新导入。')
    try {
      const normalized = normalizeLoreBook(raw, id)
      this.validateEntries(normalized.entries)
      return {
        ...normalized, revision: raw.revision ?? 1, sourceHash: raw.sourceHash,
        importedAt: raw.importedAt, updatedAt: raw.updatedAt, sourceName: raw.sourceName,
        sourceCharacterId: raw.sourceCharacterId, sourceCharacterName: raw.sourceCharacterName,
        embedded: raw.embedded === true, sourceEntryCount: raw.sourceEntryCount, embeddedNormalizationVersion: raw.embeddedNormalizationVersion,
      }
    } catch (error) {
      throw coded('ASSET_CORRUPT', `Lorebook ${id} is damaged: ${error instanceof Error ? error.message : String(error)}`, error)
    }
  }

  async readStored(id) {
    assertId(id)
    try {
      const raw = JSON.parse(await readFile(resolve(this.config.libraryDir, `${id}.json`), 'utf8'))
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw coded('ASSET_CORRUPT', `Lorebook ${id} is not an object.`)
      if (raw.id !== id) throw coded('ASSET_CORRUPT', `Lorebook ${id} contains a mismatched id.`)
      return raw
    } catch (error) {
      if (error?.code === 'ENOENT') throw coded('ASSET_NOT_FOUND', `Lorebook ${id} does not exist.`, error)
      if (error?.code === 'ASSET_NOT_FOUND' || error?.code === 'ASSET_CORRUPT') throw error
      throw coded('ASSET_CORRUPT', `Lorebook ${id} is damaged: ${error instanceof Error ? error.message : String(error)}`, error)
    }
  }

  async importBytes(bytes, options = {}) {
    if (!(bytes instanceof Uint8Array)) throw coded('INVALID_REQUEST', 'lorebook bytes must be a Uint8Array')
    if (bytes.byteLength > this.config.maxInputBytes) throw coded('LIMIT_EXCEEDED', `Lorebook exceeds the ${this.config.maxInputBytes} byte limit.`)
    let value
    try { value = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) } catch (error) {
      throw coded('ASSET_CORRUPT', `Lorebook JSON is invalid: ${error instanceof Error ? error.message : String(error)}`, error)
    }
    return this.import(value, options)
  }

  async list({ query = '', cursor, limit = 50 } = {}) {
    const page = pageOptions(query, cursor, limit)
    await this.ensureEmbeddedLorebooks()
    const rows = await cachedLibraryListing(this.config.libraryDir, async () => {
      await mkdir(this.config.libraryDir, { recursive: true })
      const entries = (await readdir(this.config.libraryDir, { withFileTypes: true }))
        .filter(entry => entry.isFile() && /^[0-9a-f-]{36}\.json$/.test(entry.name))
      return mapWithConcurrency(entries, LISTING_READ_CONCURRENCY, async entry => {
        const id = entry.name.slice(0, -5)
        try { return summary(await this.get(id)) } catch (error) {
          return { id, name: '损坏的世界书', entries: 0, status: 'corrupt', error: error instanceof Error ? error.message : String(error) }
        }
      })
    })
    const filtered = rows.filter(row => row.name.toLocaleLowerCase().includes(page.query)).sort(compareAssets)
    const items = filtered.slice(page.offset, page.offset + page.limit)
    return { items, nextCursor: page.offset + items.length < filtered.length ? String(page.offset + items.length) : null, total: filtered.length }
  }

  /** Find raw stored books that declare one character as their source without normalizing their content. */
  async listDeletionCandidates(characterId, signal) {
    assertId(characterId)
    await mkdir(this.config.libraryDir, { recursive: true })
    const matches = []
    for (const entry of await readdir(this.config.libraryDir, { withFileTypes: true })) {
      signal?.throwIfAborted()
      if (!entry.isFile() || !/^[0-9a-f-]{36}\.json$/.test(entry.name)) continue
      const id = entry.name.slice(0, -5)
      let raw
      try {
        raw = JSON.parse(await readFile(resolve(this.config.libraryDir, entry.name), 'utf8'))
      } catch (error) {
        if (error?.code === 'ENOENT' || error instanceof SyntaxError) continue
        throw coded('ASSET_CORRUPT', `Lorebook ${id} cannot be inspected before character deletion.`, error)
      }
      if (raw?.sourceCharacterId !== characterId) continue
      const name = typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : '关联世界书'
      matches.push({ id, name })
    }
    return matches
  }

  async detail(id) {
    const book = await this.get(id)
    return {
      ...summary(book),
      ...(book.scanDepth === undefined ? {} : { scanDepth: book.scanDepth }),
      ...(book.recursiveScanning === undefined ? {} : { recursiveScanning: book.recursiveScanning }),
      entries: book.entries,
      source: { originalName: book.sourceName ?? null, importedAt: book.importedAt ?? null, hash: book.sourceHash, characterId: book.sourceCharacterId ?? null, characterName: book.sourceCharacterName ?? null },
    }
  }

  async update(id, patch, expectedRevision) {
    return withLibraryMutation(this.config.libraryDir, () => this.updateUnlocked(id, patch, expectedRevision))
  }

  async updateUnlocked(id, patch, expectedRevision) {
    assertId(id)
    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) throw coded('INVALID_REQUEST', 'lorebook patch must be an object')
    const keys = Object.keys(patch)
    if (keys.length === 0 || keys.some(key => !['name', 'entries'].includes(key))) throw coded('INVALID_REQUEST', 'lorebook patch contains no editable fields or an unknown field')
    if (patch.name !== undefined && (typeof patch.name !== 'string' || patch.name.trim().length === 0)) throw coded('INVALID_REQUEST', 'lorebook name must be a non-empty string')
    const current = await this.get(id)
    if (expectedRevision !== undefined && expectedRevision !== current.revision) throw coded('REVISION_CONFLICT', `Lorebook ${id} changed from revision ${expectedRevision} to ${current.revision}.`)
    if (patch.entries !== undefined) validateEditableEntries(patch.entries)
    const candidate = normalizeLoreBook({
      name: patch.name ?? current.name,
      entries: patch.entries ?? current.entries,
      scanDepth: current.scanDepth,
      recursiveScanning: current.recursiveScanning,
    }, id)
    this.validateEntries(candidate.entries)
    const next = {
      ...current,
      name: candidate.name,
      entries: candidate.entries,
      revision: current.revision + 1,
      sourceHash: hashBook(candidate),
      updatedAt: new Date().toISOString(),
    }
    if (Buffer.byteLength(JSON.stringify(next), 'utf8') > this.config.maxInputBytes) throw coded('LIMIT_EXCEEDED', `Lorebook exceeds the ${this.config.maxInputBytes} byte limit.`)
    await this.writeBook(next)
    return this.detail(id)
  }

  async delete(id) {
    return withLibraryMutation(this.config.libraryDir, () => this.deleteUnlocked(id))
  }

  async deleteUnlocked(id) {
    assertId(id)
    const path = resolve(this.config.libraryDir, `${id}.json`)
    let raw
    try {
      raw = JSON.parse(await readFile(path, 'utf8'))
    } catch (error) {
      if (error?.code === 'ENOENT') throw coded('ASSET_NOT_FOUND', `Lorebook ${id} does not exist.`, error)
      if (!(error instanceof SyntaxError)) throw coded('ASSET_CORRUPT', `Lorebook ${id} cannot be read before deletion.`, error)
    }
    await rm(path)
    return removalSummary(id, raw)
  }

  async writeBook(book) {
    await mkdir(this.config.libraryDir, { recursive: true })
    const finalPath = resolve(this.config.libraryDir, `${book.id}.json`)
    const temporaryPath = resolve(this.config.libraryDir, `.${book.id}.${randomUUID()}.tmp`)
    await writeFile(temporaryPath, `${JSON.stringify(book, null, 2)}\n`, 'utf8')
    await rename(temporaryPath, finalPath)
  }

  async findByCharacterId(characterId) {
    await mkdir(this.config.libraryDir, { recursive: true })
    for (const entry of await readdir(this.config.libraryDir, { withFileTypes: true })) {
      if (!entry.isFile() || !/^[0-9a-f-]{36}\.json$/.test(entry.name)) continue
      try {
        const raw = JSON.parse(await readFile(resolve(this.config.libraryDir, entry.name), 'utf8'))
        if (raw?.sourceCharacterId === characterId) return { id: entry.name.slice(0, -5), name: raw.name }
      } catch (error) { if (error?.code !== 'ENOENT' && !(error instanceof SyntaxError)) throw error }
    }
    return undefined
  }

  async ensureEmbeddedLorebooks() {
    if (this.embeddedSync === undefined) {
      this.embeddedSync = this.synchronizeEmbeddedLorebooks().catch(error => { this.embeddedSync = undefined; throw error })
    }
    await this.embeddedSync
  }

  async synchronizeEmbeddedLorebooks() {
    const cards = this.ctx.get('rpCharacterCards')
    if (cards === undefined) return
    let cursor
    do {
      const page = await cards.list({ cursor, limit: 100 })
      for (const row of page.items) {
        if (row.status !== 'ready' || row.lorebookEntries < 1) continue
        const detail = await cards.detail(row.id)
        if (detail.character?.characterBook === undefined) continue
        const relationships = detail.character.embeddedLorebooks
        const shouldCreateLegacy = !Array.isArray(relationships)
        const shouldMigrateManaged = Array.isArray(relationships) && relationships.some(item => item?.status === 'managed') && await this.findByCharacterId(row.id) !== undefined
        if (shouldCreateLegacy || shouldMigrateManaged) {
          try {
            await this.materializeEmbedded({ characterId: row.id, characterName: row.name, characterBook: detail.character.characterBook, sourceName: detail.source?.originalName })
          } catch (error) {
            if (error?.code !== 'ASSET_CORRUPT' && error?.code !== 'UNSUPPORTED_SCHEMA') throw error
            // list() reports the stored file as corrupt; it must remain reachable for explicit deletion.
          }
        }
      }
      cursor = page.nextCursor ?? undefined
    } while (cursor !== undefined)
  }

  async findByHash(hash) {
    await mkdir(this.config.libraryDir, { recursive: true })
    for (const entry of await readdir(this.config.libraryDir, { withFileTypes: true })) {
      if (!entry.isFile() || !entry.name.endsWith('.json') || entry.name.startsWith('.')) continue
      try {
        const raw = JSON.parse(await readFile(resolve(this.config.libraryDir, entry.name), 'utf8'))
        if (raw.sourceHash === hash) return { id: raw.id, name: raw.name, sourceHash: raw.sourceHash }
      } catch (error) { if (error?.code !== 'ENOENT' && !(error instanceof SyntaxError)) throw error }
    }
    return undefined
  }
}

function validateEditableEntries(entries) {
  if (!Array.isArray(entries)) throw coded('INVALID_REQUEST', 'lorebook entries must be a complete array')
  const ids = new Set()
  for (const [index, entry] of entries.entries()) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) throw coded('INVALID_REQUEST', `lorebook entry ${index} must be an object`)
    const unknownField = Object.keys(entry).find(key => !EDITABLE_ENTRY_FIELDS.has(key))
    if (unknownField !== undefined) throw coded('INVALID_REQUEST', `lorebook entry ${index} contains unknown field "${unknownField}"`)
    if (typeof entry.id !== 'string' || entry.id.trim().length === 0) throw coded('INVALID_REQUEST', `lorebook entry ${index} requires an id`)
    if (ids.has(entry.id)) throw coded('INVALID_REQUEST', `lorebook contains duplicate entry id "${entry.id}"`)
    ids.add(entry.id)
    if (typeof entry.name !== 'string' || entry.name.trim().length === 0) throw coded('INVALID_REQUEST', `lorebook entry "${entry.id}" requires a non-empty name`)
    if (typeof entry.content !== 'string' || entry.content.trim().length === 0) throw coded('INVALID_REQUEST', `lorebook entry "${entry.id}" requires non-empty string content`)
    if (!EDITABLE_ENTRY_LEVELS.has(entry.level)) throw coded('INVALID_REQUEST', `lorebook entry "${entry.id}" level must be worldDescription, roleplayGuide, or importantRules`)
    validateEntryStringArray(entry, 'keys')
    validateEntryStringArray(entry, 'secondaryKeys')
    const primaryKeys = entry.keys ?? []
    const secondaryKeys = entry.secondaryKeys ?? []
    for (const field of ['enabled', 'constant', 'caseSensitive', 'recursive']) {
      if (entry[field] !== undefined && typeof entry[field] !== 'boolean') throw coded('INVALID_REQUEST', `lorebook entry "${entry.id}" ${field} must be a boolean`)
    }
    if (secondaryKeys.length > 0 && primaryKeys.length === 0) throw coded('INVALID_REQUEST', `lorebook entry "${entry.id}" secondaryKeys require at least one primary key`)
    if (entry.enabled !== false && entry.constant !== true && primaryKeys.length === 0) throw coded('INVALID_REQUEST', `lorebook entry "${entry.id}" must be constant or have at least one primary key while enabled`)
    if (entry.semanticKey !== undefined && (typeof entry.semanticKey !== 'string' || entry.semanticKey.trim().length === 0)) {
      throw coded('INVALID_REQUEST', `lorebook entry "${entry.id}" semanticKey must be a non-empty string`)
    }
    if (entry.stateCondition !== undefined && (typeof entry.stateCondition !== 'string' || entry.stateCondition.trim().length === 0)) {
      throw coded('INVALID_REQUEST', `lorebook entry "${entry.id}" stateCondition must be a non-empty string`)
    }
    if (entry.order !== undefined && !Number.isSafeInteger(entry.order)) throw coded('INVALID_REQUEST', `lorebook entry "${entry.id}" order must be a safe integer`)
    if (entry.position !== undefined && (!Number.isSafeInteger(entry.position) || entry.position < 0)) throw coded('INVALID_REQUEST', `lorebook entry "${entry.id}" position must be a non-negative safe integer`)
    if (entry.insertionPosition !== undefined && !EDITABLE_INSERTION_POSITIONS.has(entry.insertionPosition)) {
      throw coded('INVALID_REQUEST', `lorebook entry "${entry.id}" insertionPosition is invalid`)
    }
    if (entry.depth !== undefined && (!Number.isSafeInteger(entry.depth) || entry.depth < 0)) throw coded('INVALID_REQUEST', `lorebook entry "${entry.id}" depth must be a non-negative safe integer`)
    if (entry.probability !== undefined && (typeof entry.probability !== 'number' || !Number.isFinite(entry.probability) || entry.probability < 0 || entry.probability > 1)) {
      throw coded('INVALID_REQUEST', `lorebook entry "${entry.id}" probability must be a number between 0 and 1`)
    }
  }
}

function validateEntryStringArray(entry, field) {
  if (entry[field] === undefined) return
  if (!Array.isArray(entry[field]) || entry[field].some(value => typeof value !== 'string' || value.trim().length === 0)) {
    throw coded('INVALID_REQUEST', `lorebook entry "${entry.id}" ${field} must be an array of non-empty strings`)
  }
}

export function apply(ctx, config) {
  for (const [key, value] of Object.entries(config)) if (!['libraryDir', 'registerTool', 'exposeBrowser'].includes(key) && (!Number.isSafeInteger(value) || value < (key === 'maxRecursiveDepth' ? 0 : 1))) throw new Error(`rp-lore-book: invalid ${key}`)
  const service = new RpLoreBooks(ctx, config)
  if (config.exposeBrowser) ctx.inject(['rpRemote'], browserCtx => registerBrowserLibrary(browserCtx, service))
  if (config.registerTool === false) return
  ctx.inject(['tools', 'fs'], toolCtx => registerImportTool(toolCtx, service, config))
}

function registerImportTool(ctx, service, config) {
  ctx.tools.register(defineTool({
    name: 'import_lore_book',
    description: 'Import one local community JSON world-book file. Call with {"path":"/absolute/or/workspace/book.json"}. This creates a shared lorebook asset but does not bind it to the current conversation; if the user also asked to apply it, call rp_asset with action:"bind" and pass the complete desired ordered lorebookIds list, preserving current ids and adding the returned id.',
    parameters: { path: { type: 'string', required: true, description: 'Required local .json path in the active filesystem execution world. Pass only the path string, not JSON contents or an asset id.' } },
    output: {
      schema: { type: 'object', additionalProperties: false, properties: {
        id: { type: 'string', required: true }, name: { type: 'string', required: true }, revision: { type: 'integer', required: true }, sourceHash: { type: 'string', required: true }, entries: { type: 'integer', required: true }, path: { type: 'string', required: true },
      } },
      render: (_args, value) => [{ type: 'text', text: `Imported lorebook ${value.name} with ${value.entries} entries.` }],
    },
    execute: async (args, exec) => {
      if (typeof args.path !== 'string' || !args.path.toLowerCase().endsWith('.json')) throw new Error('lorebook path must end in .json')
      const target = await ctx.fs.resolve(args.path, { signal: exec.signal })
      const bytes = await ctx.fs.readBytes(target, exec.signal, config.maxInputBytes)
      return service.importBytes(bytes, { sourceName: target.displayPath })
    },
    presentCall: args => ({ card: 'generic', title: 'Import lorebook', kind: 'read', rawInput: args.path, locations: [{ path: args.path }] }),
  }))
}

const BROWSER_ENDPOINTS = new Set(['list', 'get', 'import', 'create', 'update', 'delete'])

function registerBrowserLibrary(ctx, books) {
  const dispose = ctx.rpRemote.register('/rp-lore-books', async (endpoint, payload) => {
    if (!BROWSER_ENDPOINTS.has(endpoint)) return transportSuccess(failure('INVALID_REQUEST', `Unknown lore-book endpoint: ${endpoint}`))
    try { return transportSuccess(success(await dispatchBrowser(books, endpoint, payload))) }
    catch (error) { return transportSuccess(failure(codeFor(error), error instanceof Error ? error.message : String(error))) }
  })
  ctx.effect(() => dispose, 'rp-lore-book: /rp-lore-books Remote')
}

export async function dispatchBrowser(books, endpoint, payload) {
  const input = object(payload)
  switch (endpoint) {
    case 'list': return books.list(listRequest(input))
    case 'get': return books.detail(requiredId(input.id))
    case 'import': {
      const file = decodeUpload(input, books.config.maxInputBytes)
      const imported = await books.importBytes(file.bytes, { sourceName: file.name })
      return { imported, detail: await books.detail(imported.id) }
    }
    case 'create': return books.create(object(input.book))
    case 'update': return books.update(requiredId(input.id), object(input.patch), optionalRevision(input.expectedRevision))
    case 'delete': return books.delete(requiredId(input.id))
    default: throw coded('INVALID_REQUEST', `Unknown lore-book endpoint: ${endpoint}`)
  }
}

function decodeUpload(input, maxBytes) {
  if (typeof input.name !== 'string' || input.name.trim().length === 0 || input.name.length > 255 || input.name.includes('/') || input.name.includes('\\')) throw coded('INVALID_REQUEST', 'upload name is invalid')
  if (!input.name.toLocaleLowerCase().endsWith('.json') || !['application/json', 'text/json'].includes(String(input.mimeType).toLocaleLowerCase())) throw coded('UNSUPPORTED_FORMAT', 'Lorebook upload must be JSON.')
  if (typeof input.base64 !== 'string' || input.base64.length === 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(input.base64) || input.base64.length % 4 !== 0) throw coded('INVALID_REQUEST', 'base64 is invalid')
  if (input.base64.length > Math.ceil(maxBytes / 3) * 4) throw coded('LIMIT_EXCEEDED', `File exceeds the ${maxBytes} byte limit.`)
  const bytes = Buffer.from(input.base64, 'base64')
  if (bytes.byteLength > maxBytes) throw coded('LIMIT_EXCEEDED', `File exceeds the ${maxBytes} byte limit.`)
  if (bytes.toString('base64') !== input.base64) throw coded('INVALID_REQUEST', 'base64 is not canonical')
  return { name: input.name, bytes: new Uint8Array(bytes) }
}

function listRequest(input) { return { query: input.query ?? '', cursor: input.cursor, limit: input.limit ?? 50 } }
function optionalRevision(value) { if (value === undefined) return undefined; if (!Number.isSafeInteger(value) || value < 1) throw coded('INVALID_REQUEST', 'expectedRevision must be a positive integer'); return value }
function object(value) { if (typeof value !== 'object' || value === null || Array.isArray(value)) throw coded('INVALID_REQUEST', 'request payload must be an object'); return value }
function requiredId(value) { if (typeof value !== 'string' || !/^[0-9a-f-]{36}$/.test(value)) throw coded('INVALID_REQUEST', 'asset id is invalid'); return value }
function success(value) { return { ok: true, value } }
function failure(code, message) { return { ok: false, error: { code, message } } }
function transportSuccess(value) { return { ok: true, value } }
function codeFor(error) { return ['INVALID_REQUEST', 'LIMIT_EXCEEDED', 'UNSUPPORTED_FORMAT', 'DUPLICATE_ASSET', 'ASSET_CORRUPT', 'ASSET_NOT_FOUND', 'REVISION_CONFLICT'].includes(error?.code) ? error.code : 'ASSET_CORRUPT' }

function isUnavailableBinding(error) {
  return error?.code === 'ASSET_NOT_FOUND'
    || error?.code === 'ASSET_CORRUPT'
    || error?.code === 'UNSUPPORTED_SCHEMA'
}

function messageText(messages, scanDepth) {
  const selected = scanDepth === undefined
    ? messages
    : messages.filter(message => ['user', 'assistant'].includes(message?.role)).slice(-(scanDepth + 1))
  return selected.flatMap(message => Array.isArray(message?.content) ? message.content : [])
    .filter(part => part?.type === 'text' && typeof part.text === 'string').map(part => part.text).join('\n')
}
function mergeSerializedLoreBooks(serialized, books) {
  if (serialized.length === 1) return serialized[0]
  const scanDepths = serialized.map(book => book.scan_depth).filter(value => Number.isSafeInteger(value) && value >= 0)
  const recursion = serialized.map(book => book.recursive_scanning).filter(value => typeof value === 'boolean')
  return {
    name: books.map(book => book.name).join(' + '),
    ...(scanDepths.length === 0 ? {} : { scan_depth: Math.max(...scanDepths) }),
    ...(recursion.length === 0 ? {} : { recursive_scanning: recursion.every(Boolean) }),
    extensions: {
      dsh_roleplay: {
        merged_lorebooks: books.map(book => ({ id: book.id, name: book.name })),
      },
    },
    entries: serialized.flatMap((book, bookIndex) => book.entries.map((entry, entryIndex) => ({
      ...entry,
      id: `${books[bookIndex].id}:${entry.id ?? entryIndex}`,
      insertion_order: bookIndex * 1000000 + entry.insertion_order,
      extensions: { ...entry.extensions, dsh_roleplay_source_book: books[bookIndex].name },
    }))),
  }
}
function summary(book) { return { id: book.id, name: book.name, revision: book.revision, hash: book.sourceHash, importedAt: typeof book.importedAt === 'string' ? book.importedAt : null, entries: book.entries.length, slots: slotCounts(book.entries), status: 'ready', sourceCharacterId: book.sourceCharacterId ?? null, sourceCharacterName: book.sourceCharacterName ?? null, embedded: book.embedded === true } }
function removalSummary(id, raw) {
  const stored = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}
  const entries = Array.isArray(stored.entries) ? stored.entries : []
  return {
    id,
    name: typeof stored.name === 'string' && stored.name.trim() ? stored.name : '无法读取的世界书',
    revision: Number.isSafeInteger(stored.revision) && stored.revision >= 1 ? stored.revision : 1,
    hash: typeof stored.sourceHash === 'string' ? stored.sourceHash : null,
    entries: entries.length,
    slots: slotCounts(entries),
    status: stored.schemaVersion === 3 ? 'ready' : 'corrupt',
    sourceCharacterId: typeof stored.sourceCharacterId === 'string' ? stored.sourceCharacterId : null,
    sourceCharacterName: typeof stored.sourceCharacterName === 'string' ? stored.sourceCharacterName : null,
    embedded: stored.embedded === true,
  }
}
function hashBook(book) { return createHash('sha256').update(JSON.stringify({ name: book.name, scanDepth: book.scanDepth, recursiveScanning: book.recursiveScanning, entries: book.entries }), 'utf8').digest('hex') }
function rawEntryCount(book) { return Array.isArray(book?.entries) ? book.entries.length : book?.entries && typeof book.entries === 'object' ? Object.keys(book.entries).length : 0 }
function slotCounts(entries) {
  const counts = { worldDescription: 0, roleplayGuide: 0, importantRules: 0 }
  for (const entry of entries) if (Object.hasOwn(counts, entry.level)) counts[entry.level] += 1
  return counts
}
function pageOptions(query, cursor, limit) {
  if (typeof query !== 'string') throw coded('INVALID_REQUEST', 'query must be a string')
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) throw coded('INVALID_REQUEST', 'limit must be between 1 and 100')
  const offset = cursor === undefined || cursor === null ? 0 : Number(cursor)
  if (!Number.isSafeInteger(offset) || offset < 0 || (cursor !== undefined && cursor !== null && String(offset) !== String(cursor))) throw coded('INVALID_REQUEST', 'cursor is invalid')
  return { query: query.trim().toLocaleLowerCase(), limit, offset }
}
function compareAssets(left, right) {
  const leftImportedAt = importTimestamp(left.importedAt)
  const rightImportedAt = importTimestamp(right.importedAt)
  if (leftImportedAt !== rightImportedAt) return rightImportedAt > leftImportedAt ? 1 : -1
  return left.name.localeCompare(right.name, undefined, { sensitivity: 'base' }) || left.id.localeCompare(right.id)
}
function importTimestamp(value) {
  if (typeof value !== 'string') return Number.NEGATIVE_INFINITY
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? timestamp : Number.NEGATIVE_INFINITY
}
function assertId(id) { if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/.test(id)) throw coded('INVALID_REQUEST', 'invalid lorebook id') }
function assertCharacterId(id) { if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/.test(id)) throw coded('INVALID_REQUEST', 'invalid source character id') }
function coded(code, message, cause) { const error = new Error(message, { cause }); error.code = code; return error }

const libraryMutations = new Map()
const libraryListings = new Map()
const LISTING_READ_CONCURRENCY = 8

async function cachedLibraryListing(libraryDir, load) {
  const cached = libraryListings.get(libraryDir)
  if (cached !== undefined) return cached
  const pending = Promise.resolve().then(load)
  libraryListings.set(libraryDir, pending)
  try {
    return await pending
  } catch (error) {
    if (libraryListings.get(libraryDir) === pending) libraryListings.delete(libraryDir)
    throw error
  }
}

function invalidateLibraryListing(libraryDir) {
  libraryListings.delete(libraryDir)
}

async function mapWithConcurrency(items, limit, map) {
  const results = new Array(items.length)
  let nextIndex = 0
  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex
      nextIndex += 1
      results[index] = await map(items[index])
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()))
  return results
}

async function withLibraryMutation(libraryDir, operation) {
  const previous = libraryMutations.get(libraryDir) ?? Promise.resolve()
  let release
  const current = new Promise(resolve => { release = resolve })
  libraryMutations.set(libraryDir, current)
  await previous
  invalidateLibraryListing(libraryDir)
  try {
    return await operation()
  } finally {
    invalidateLibraryListing(libraryDir)
    release()
    if (libraryMutations.get(libraryDir) === current) libraryMutations.delete(libraryDir)
  }
}
