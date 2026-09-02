import { createHash } from 'node:crypto'

export const LORE_LEVELS = Object.freeze({
  worldDescription: 'worldDescription',
  roleplayGuide: 'roleplayGuide',
  importantRules: 'importantRules',
})

export const LORE_SLOT_DEFINITIONS = Object.freeze([
  Object.freeze({
    level: LORE_LEVELS.worldDescription,
    id: 'rp.lore.world-description',
    label: '世界设定',
  }),
  Object.freeze({
    level: LORE_LEVELS.roleplayGuide,
    id: 'rp.lore.character-descriptions',
    label: '扮演指导',
  }),
  Object.freeze({
    level: LORE_LEVELS.importantRules,
    id: 'rp.lore.important-rules',
    label: '重要规则',
  }),
])

/** Normalize common lorebook shapes into the Roleplay representation. */
export function normalizeLoreBook(input, fallbackId = 'embedded') {
  if (!record(input)) throw new Error('lorebook must be an object')
  const rawEntries = Array.isArray(input.entries) ? input.entries : record(input.entries) ? Object.values(input.entries) : []
  const normalized = rawEntries.map((entry, index) => normalizeEntry(entry, index)).filter(Boolean)
  const entryIds = new Set()
  for (const entry of normalized) {
    if (entryIds.has(entry.id)) throw new Error(`lorebook contains duplicate entry id "${entry.id}"`)
    entryIds.add(entry.id)
  }
  const scanDepth = optionalNonNegativeInteger(input.scanDepth ?? input.scan_depth, 'scan depth')
  const recursiveScanning = optionalBoolean(input.recursiveScanning ?? input.recursive_scanning, 'recursive scanning')
  return {
    schemaVersion: 3,
    id: string(input.id) ?? fallbackId,
    name: string(input.name) ?? 'Untitled lorebook',
    ...(scanDepth === undefined ? {} : { scanDepth }),
    ...(recursiveScanning === undefined ? {} : { recursiveScanning }),
    entries: normalized,
  }
}

/** Serialize one normalized lorebook into the Character Card V3 Lorebook shape. */
export function serializeLoreBookV3(book) {
  if (!record(book) || !Array.isArray(book.entries)) throw new Error('normalized lorebook must contain an entries array')
  const entries = book.entries.map((entry, index) => {
    if (!record(entry) || typeof entry.content !== 'string') throw new Error(`normalized lorebook entry ${index} is invalid`)
    const secondaryKeys = strings(entry.secondaryKeys)
    const extensions = {
      ...(typeof entry.level === 'string' ? { level: entry.level } : {}),
      ...(Number.isSafeInteger(entry.position) ? { position: entry.position } : {}),
      ...(Number.isSafeInteger(entry.depth) ? { depth: entry.depth } : {}),
      ...(entry.recursive === false ? { prevent_recursion: true } : {}),
      ...(typeof entry.semanticKey === 'string' && entry.semanticKey.length > 0 ? { semantic_key: entry.semanticKey } : {}),
      ...(typeof entry.stateCondition === 'string' && entry.stateCondition.length > 0 ? { state_condition: entry.stateCondition } : {}),
      ...(typeof entry.probability === 'number' && entry.probability < 1
        ? { use_probability: true, probability: Math.round(Math.max(0, entry.probability) * 100) }
        : {}),
    }
    return {
      keys: strings(entry.keys),
      content: entry.content,
      extensions,
      enabled: entry.enabled !== false,
      insertion_order: Number.isSafeInteger(entry.order) ? entry.order : index,
      case_sensitive: entry.caseSensitive === true,
      use_regex: false,
      constant: entry.constant === true,
      ...(typeof entry.name === 'string' && entry.name.length > 0 ? { name: entry.name } : {}),
      ...(entry.id === undefined ? {} : { id: String(entry.id) }),
      selective: secondaryKeys.length > 0,
      ...(secondaryKeys.length === 0 ? {} : { secondary_keys: secondaryKeys }),
      position: typeof entry.insertionPosition === 'string'
        ? entry.insertionPosition
        : entry.level === LORE_LEVELS.worldDescription ? 'before_char' : 'after_char',
    }
  })
  return {
    ...(typeof book.name === 'string' && book.name.length > 0 ? { name: book.name } : {}),
    ...(Number.isSafeInteger(book.scanDepth) && book.scanDepth >= 0 ? { scan_depth: book.scanDepth } : {}),
    ...(typeof book.recursiveScanning === 'boolean' ? { recursive_scanning: book.recursiveScanning } : {}),
    extensions: {},
    entries,
  }
}

/** Deterministically activate one or more normalized lorebooks. */
export function activateLore({ books, corpus, bookCorpora, runId, maxDepth, maxEntries, maxTokens, adapters = [] }) {
  const renderDiagnostics = []
  const report = diagnostic => renderDiagnostics.push(diagnostic)
  const gateEntry = createLoreGate(adapters, report)
  const renderEntry = createLoreRenderer(books, adapters, report, gateEntry)
  const entries = books.flatMap((book, bookIndex) => book.entries.filter(entry => entry.enabled !== false && entry.content.length > 0).map(entry => {
    const gate = gateEntry(book, entry)
    if (!gate.active) {
      report({
        bookId: book.id,
        entryId: entry.id,
        level: entry.level,
        status: 'excluded',
        reason: 'activation-gate',
        depth: 0,
        match: { reason: 'state-condition', keywords: [] },
        ...gate.diagnostic,
      })
      return undefined
    }
    const rendered = renderEntry(book, entry)
    return rendered === undefined ? undefined : {
      ...entry,
      content: rendered.content.trim(),
      keys: rendered.keys.map(key => key.trim()).filter(Boolean),
      secondaryKeys: rendered.secondaryKeys.map(key => key.trim()).filter(Boolean),
      bookId: book.id,
      bookPriority: book.priority ?? bookIndex,
    }
  }).filter(entry => entry !== undefined && entry.content.length > 0))
    .sort((a, b) => levelRank(a.level) - levelRank(b.level) || a.bookPriority - b.bookPriority || a.order - b.order || `${a.bookId}:${a.id}`.localeCompare(`${b.bookId}:${b.id}`))
  const active = []
  const diagnostics = renderDiagnostics
  const activated = new Set()
  const searchTextByBook = new Map(books.map(book => [book.id, corpusForBook(bookCorpora, book.id, corpus)]))
  let usedTokens = 0

  for (let depth = 0; depth <= maxDepth; depth += 1) {
    let addedThisDepth = 0
    for (const entry of entries) {
      const identity = `${entry.bookId}:${entry.id}`
      if (activated.has(identity)) continue
      const match = activationReason(entry, searchTextByBook.get(entry.bookId) ?? corpus)
      if (match === undefined) continue
      if (!passesProbability(runId, identity, entry.probability)) {
        activated.add(identity)
        diagnostics.push({ bookId: entry.bookId, entryId: entry.id, level: entry.level, status: 'excluded', reason: 'probability', depth, match })
        continue
      }
      const tokens = estimateTokens(entry.content)
      if (active.length >= maxEntries) {
        activated.add(identity)
        diagnostics.push({ bookId: entry.bookId, entryId: entry.id, level: entry.level, status: 'excluded', reason: 'entry-budget', depth, tokens, match })
        continue
      }
      if (usedTokens + tokens > maxTokens) {
        activated.add(identity)
        diagnostics.push({ bookId: entry.bookId, entryId: entry.id, level: entry.level, status: 'excluded', reason: 'token-budget', depth, tokens, match })
        continue
      }
      activated.add(identity)
      active.push({ bookId: entry.bookId, ...entry, depth, match, tokens })
      diagnostics.push({ bookId: entry.bookId, entryId: entry.id, level: entry.level, status: 'active', reason: match.reason, keywords: match.keywords, depth, tokens })
      usedTokens += tokens
      addedThisDepth += 1
    }
    if (addedThisDepth === 0 || depth === maxDepth) break
    let expanded = false
    for (const book of books) {
      if (book.recursiveScanning === false) continue
      const additions = active.filter(entry => entry.bookId === book.id && entry.depth === depth && entry.recursive).map(entry => entry.content)
      if (additions.length === 0) continue
      searchTextByBook.set(book.id, `${searchTextByBook.get(book.id) ?? corpus}\n${additions.join('\n')}`)
      expanded = true
    }
    if (!expanded) break
  }
  return { entries: active, diagnostics, usedTokens, maxTokens }
}

/** Group activated entries into the three semantic prompt slots. */
export function groupActivatedLore(result) {
  const groups = Object.fromEntries(LORE_SLOT_DEFINITIONS.map(slot => [slot.level, []]))
  for (const entry of result.entries) groups[entry.level]?.push(entry)
  for (const entries of Object.values(groups)) {
    entries.sort((left, right) => left.bookPriority - right.bookPriority || left.order - right.order || `${left.bookId}:${left.id}`.localeCompare(`${right.bookId}:${right.id}`))
  }
  return groups
}

function normalizeEntry(value, index) {
  if (!record(value)) return undefined
  const extensions = record(value.extensions) ? value.extensions : {}
  const field = (key, alternate) => extensions[key] ?? (alternate === undefined ? undefined : extensions[alternate]) ?? value[key] ?? (alternate === undefined ? undefined : value[alternate])
  const contentValue = field('content')
  const content = typeof contentValue === 'string' ? contentValue.trim() : undefined
  if (content === undefined) return undefined
  const keys = strings(field('keys', 'key'))
  const secondaryKeys = strings(field('secondary_keys', 'secondaryKeys') ?? field('keysecondary'))
  const rawPosition = field('insertionPosition') ?? field('position', 'insertion_position')
  const position = positionInteger(rawPosition)
  const depth = integer(field('depth'), 4)
  const originalOrder = integer(field('insertion_order', 'order') ?? field('priority'), index)
  const classified = classifyLoreEntry({ position, depth, order: originalOrder })
  const rawLevel = field('level')
  const explicitLevel = loreLevel(rawLevel)
  if (rawLevel !== undefined && explicitLevel === undefined) throw new Error(`lorebook entry ${String(field('id', 'uid') ?? index)} has invalid level ${String(rawLevel)}`)
  const insertionPosition = normalizeInsertionPosition(rawPosition)
  const semanticKey = string(field('semantic_key', 'semanticKey'))
  const condition = stateCondition(field('state_condition', 'stateCondition'), field('id', 'uid') ?? index)
  return {
    id: String(field('id', 'uid') ?? index),
    name: string(field('name', 'comment')) ?? `Entry ${index + 1}`,
    ...(semanticKey === undefined ? {} : { semanticKey }),
    level: explicitLevel ?? classified.level,
    keys,
    secondaryKeys,
    content,
    enabled: field('enabled') !== false && field('disable') !== true,
    constant: field('constant') === true || field('always_active', 'alwaysActive') === true,
    caseSensitive: field('case_sensitive', 'caseSensitive') === true,
    recursive: field('prevent_recursion', 'preventRecursion') !== true && field('recursive') !== false,
    order: explicitLevel === undefined ? classified.order : originalOrder,
    position: position ?? 1,
    insertionPosition,
    depth,
    probability: field('use_probability', 'useProbability') === false ? 1 : probability(field('probability') ?? field('chance')),
    ...(condition === undefined ? {} : { stateCondition: condition }),
  }
}

/**
 * Classify SillyTavern entries into the three semantic prompt slots.
 * 0 is world context; shallow in-chat/author-note entries are important rules;
 * every other placement is character/relationship context.
 */
export function classifyLoreEntry({ position, depth, order }) {
  if (position === 0) return { level: LORE_LEVELS.worldDescription, order }
  if (position !== undefined && position >= 4 && (depth === 0 || depth === 1)) {
    return { level: LORE_LEVELS.importantRules, order: (depth === 1 ? 1000 : 2000) + order }
  }
  if (position === 2) return { level: LORE_LEVELS.roleplayGuide, order: 1000 + order }
  if (position === 3) return { level: LORE_LEVELS.roleplayGuide, order: 2000 + order }
  if (position === 1) return { level: LORE_LEVELS.roleplayGuide, order: 3000 + order }
  if (position !== undefined && position >= 4 && depth >= 2) return { level: LORE_LEVELS.roleplayGuide, order: 4000 - depth * 10 + order }
  return { level: LORE_LEVELS.roleplayGuide, order: 5000 + order }
}

function activationReason(entry, corpus) {
  if (entry.constant) return { reason: 'constant', keywords: [] }
  const haystack = entry.caseSensitive ? corpus : corpus.toLocaleLowerCase()
  const primary = entry.keys.filter(key => haystack.includes(entry.caseSensitive ? key : key.toLocaleLowerCase()))
  if (primary.length === 0) return undefined
  const secondary = entry.secondaryKeys.filter(key => haystack.includes(entry.caseSensitive ? key : key.toLocaleLowerCase()))
  if (entry.secondaryKeys.length > 0 && secondary.length === 0) return undefined
  return { reason: 'keyword', keywords: [...primary, ...secondary] }
}

function corpusForBook(bookCorpora, bookId, fallback) {
  if (bookCorpora instanceof Map) return typeof bookCorpora.get(bookId) === 'string' ? bookCorpora.get(bookId) : fallback
  if (record(bookCorpora) && typeof bookCorpora[bookId] === 'string') return bookCorpora[bookId]
  return fallback
}

function createLoreRenderer(books, adapters, report, gateEntry) {
  const localEntries = new Map()
  const localAliases = new Map()
  const globalEntries = new Map()
  const globalAliases = new Map()
  const cache = new Map()
  for (const book of books) {
    const byName = new Map()
    const byAlias = new Map()
    localEntries.set(book.id, byName)
    localAliases.set(book.id, byAlias)
    for (const entry of book.entries) {
      addExact(byName, entry.name, { book, entry })
      addExact(globalEntries, entry.name, { book, entry })
      addAlias(byAlias, entry.name, { book, entry })
      addAlias(globalAliases, entry.name, { book, entry })
    }
  }
  const render = (book, entry, ancestors = [], referenceContext) => {
    const identity = `${book.id}:${entry.id}`
    if (ancestors.includes(identity)) {
      report({
        bookId: book.id,
        entryId: entry.id,
        level: entry.level,
        status: 'excluded',
        reason: 'reference-cycle',
        path: [...ancestors, identity],
        ...(referenceContext === undefined ? {} : referenceContext),
      })
      return undefined
    }
    if (cache.has(identity)) return cache.get(identity)
    const nextAncestors = [...ancestors, identity]
    let rendered = { content: entry.content, keys: [...entry.keys], secondaryKeys: [...entry.secondaryKeys] }
    for (const adapter of adapters) {
      if (typeof adapter.transformEntry !== 'function') continue
      let result
      try {
        result = adapter.transformEntry({
          book,
          entry,
          ...rendered,
          resolveEntry(name) {
            if (typeof name !== 'string' || name.length === 0) throw new Error('entry reference must be a non-empty string')
            const target = exactTarget(localEntries.get(book.id), name)
              ?? aliasTarget(localAliases.get(book.id), name)
              ?? exactTarget(globalEntries, name)
              ?? aliasTarget(globalAliases, name)
            if (target === undefined) {
              report({
                bookId: book.id,
                entryId: entry.id,
                level: entry.level,
                status: 'excluded',
                reason: 'reference-missing',
                adapterId: adapter.id,
                reference: name,
              })
              return ''
            }
            const gate = gateEntry(target.book, target.entry, { adapterId: adapter.id, reference: name })
            if (!gate.active) return ''
            return render(target.book, target.entry, nextAncestors, { adapterId: adapter.id, reference: name })?.content ?? ''
          },
        })
      } catch (error) {
        report({
          bookId: book.id,
          entryId: entry.id,
          level: entry.level,
          status: 'excluded',
          reason: 'adapter-error',
          adapterId: adapter.id,
          message: error instanceof Error ? error.message : String(error),
        })
        cache.set(identity, undefined)
        return undefined
      }
      if (result === undefined) continue
      if (!record(result)) throw new Error(`lore activation adapter "${adapter.id}" returned an invalid result`)
      for (const diagnostic of Array.isArray(result.diagnostics) ? result.diagnostics : []) {
        report({ bookId: book.id, entryId: entry.id, level: entry.level, adapterId: adapter.id, ...diagnostic })
      }
      if (result.exclude === true) {
        cache.set(identity, undefined)
        return undefined
      }
      rendered = {
        content: result.content ?? rendered.content,
        keys: result.keys ?? rendered.keys,
        secondaryKeys: result.secondaryKeys ?? rendered.secondaryKeys,
      }
      if (typeof rendered.content !== 'string' || !Array.isArray(rendered.keys) || !rendered.keys.every(value => typeof value === 'string')
        || !Array.isArray(rendered.secondaryKeys) || !rendered.secondaryKeys.every(value => typeof value === 'string')) {
        throw new Error(`lore activation adapter "${adapter.id}" returned invalid rendered entry fields`)
      }
    }
    cache.set(identity, rendered)
    return rendered
  }
  return render
}

function createLoreGate(adapters, report) {
  const cache = new Map()
  return (book, entry, referenceContext) => {
    const identity = `${book?.id ?? 'unknown'}:${entry.id}`
    if (cache.has(identity)) return cache.get(identity)
    let handled = entry.stateCondition === undefined
    for (const adapter of adapters) {
      if (typeof adapter.gateEntry !== 'function') continue
      let result
      try { result = adapter.gateEntry({ book, entry }) } catch (error) {
        result = { active: false, diagnostics: [{ reason: 'adapter-error', message: error instanceof Error ? error.message : String(error) }] }
      }
      if (result === undefined) continue
      handled = true
      if (!record(result) || typeof result.active !== 'boolean') throw new Error(`lore activation adapter "${adapter.id}" returned an invalid gate result`)
      for (const diagnostic of Array.isArray(result.diagnostics) ? result.diagnostics : []) {
        report({ bookId: book?.id, entryId: entry.id, level: entry.level, adapterId: adapter.id, ...diagnostic, ...(referenceContext ?? {}) })
      }
      if (!result.active) {
        const gate = { active: false, diagnostic: { adapterId: adapter.id, reason: result.diagnostics?.[0]?.reason ?? 'adapter-gate' } }
        cache.set(identity, gate)
        return gate
      }
    }
    if (!handled) {
      const gate = { active: false, diagnostic: { reason: 'state-condition-unavailable', ...(referenceContext ?? {}) } }
      cache.set(identity, gate)
      return gate
    }
    const gate = { active: true }
    cache.set(identity, gate)
    return gate
  }
}

function stateCondition(value, entryId) {
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value !== 'string' || value.trim().length === 0) throw new Error(`lorebook entry ${String(entryId)} stateCondition must be a non-empty string`)
  return value.trim()
}

function addExact(index, name, target) {
  if (!index.has(name)) index.set(name, target)
  else if (index.get(name)?.entry !== target.entry) index.set(name, null)
}

function exactTarget(index, name) {
  const target = index?.get(name)
  return target === null ? undefined : target
}

function addAlias(index, name, target) {
  const alias = worldInfoAlias(name)
  if (!index.has(alias)) index.set(alias, target)
  else if (index.get(alias)?.entry !== target.entry) index.set(alias, null)
}

function aliasTarget(index, name) {
  const target = index?.get(worldInfoAlias(name))
  return target === null ? undefined : target
}

function worldInfoAlias(name) { return name.toLocaleLowerCase().replace(/[\s_-]+/g, '') }

function passesProbability(runId, identity, probabilityValue) {
  if (probabilityValue >= 1) return true
  if (probabilityValue <= 0) return false
  const digest = createHash('sha256').update(`${runId}:${identity}`).digest()
  return digest.readUInt32BE(0) / 0x100000000 < probabilityValue
}

export function estimateTokens(text) {
  return Math.ceil([...text].length / 4)
}

function probability(value) {
  if (value === false) return 1
  const number = Number(value)
  if (!Number.isFinite(number)) return 1
  return Math.max(0, Math.min(1, number > 1 ? number / 100 : number))
}

function loreLevel(value) { return Object.values(LORE_LEVELS).includes(value) ? value : undefined }
function levelRank(level) { return LORE_SLOT_DEFINITIONS.findIndex(slot => slot.level === level) }
function positionInteger(value) {
  if (value === undefined || value === null || value === '') return undefined
  const numeric = Number(value)
  if (Number.isSafeInteger(numeric)) return numeric
  return ({ before_char: 0, after_char: 1, before_examples: 2, after_examples: 3, in_chat: 4, before_an: 5, after_an: 6 })[value]
}

function optionalNonNegativeInteger(value, label) {
  if (value === undefined || value === null || value === '') return undefined
  const parsed = typeof value === 'string' && /^\d+$/.test(value.trim()) ? Number(value.trim()) : value
  if (!Number.isSafeInteger(parsed) || parsed < 0) throw new Error(`lorebook ${label} must be a non-negative integer`)
  return parsed
}

function optionalBoolean(value, label) {
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value === 'boolean') return value
  if (value === 0 || value === 1) return value === 1
  if (typeof value === 'string' && ['true', 'false'].includes(value.trim().toLocaleLowerCase())) return value.trim().toLocaleLowerCase() === 'true'
  throw new Error(`lorebook ${label} must be a boolean`)
}
function normalizeInsertionPosition(value) {
  const position = positionInteger(value)
  return ({ 0: 'before_char', 1: 'after_char', 2: 'before_examples', 3: 'after_examples', 4: 'in_chat', 5: 'before_an', 6: 'after_an' })[position] ?? (typeof value === 'string' && value.trim() ? value.trim() : 'after_char')
}

function strings(value) {
  if (Array.isArray(value)) return value.map(item => String(item).trim()).filter(Boolean)
  return typeof value === 'string' ? value.split(',').map(item => item.trim()).filter(Boolean) : []
}
function string(value) { return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined }
function integer(value, fallback) { if (value === undefined || value === null || value === '') return fallback; const n = Number(value); return Number.isSafeInteger(n) ? n : fallback }
function record(value) { return typeof value === 'object' && value !== null && !Array.isArray(value) }
