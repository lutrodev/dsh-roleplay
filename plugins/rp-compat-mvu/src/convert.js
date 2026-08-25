import { decodeMvuInitialValue, mergeMvuInitialValues } from './initial-value.js'
import {
  collectMvuOperationBlocks,
  replaceMvuOperationBlocks,
  stripResidualMvuControlTags,
} from './mvu-control.js'
import {
  parseMvuOpeningOperations,
} from './opening-command-parser.js'
import { applyMvuOpeningOperations } from './opening-operations.js'

const INIT_BLOCK = /<initvar\b[^>]*>([\s\S]*?)<\/initvar>/gi
const INIT_MARKER = /\[InitVar\]/i
const CARD_TEXT_FIELDS = Object.freeze([
  ['description', undefined, 'description'],
  ['personality', undefined, 'personality'],
  ['scenario', 'world_scenario', 'scenario'],
  ['mes_example', undefined, 'messageExample'],
])

/**
 * Sanitize model-visible card fields at the import boundary. MVU data remains
 * in the preserved source payload and is never added to the character entity.
 */
export function convertMvuImport(parsed) {
  const character = structuredClone(parsed.character)
  const quarantinedPrompts = [...(parsed.quarantinedPrompts ?? [])]
  for (const field of ['description', 'personality', 'scenario', 'messageExample']) {
    if (typeof character[field] !== 'string') continue
    character[field] = stripMvuControlBlocks(character[field], `/character/${field}`, quarantinedPrompts).text
  }
  const openings = [character.firstMessage, ...(Array.isArray(character.alternateGreetings) ? character.alternateGreetings : [])]
    .map((value, index) => typeof value === 'string'
      ? stripMvuControlBlocks(value, index === 0 ? '/character/firstMessage' : `/character/alternateGreetings/${index - 1}`, quarantinedPrompts).text
      : '')
    .filter(value => value.length > 0)
  character.firstMessage = openings[0] ?? ''
  character.alternateGreetings = openings.slice(1)
  collectBookQuarantine(character.characterBook, quarantinedPrompts)
  return { ...parsed, character, quarantinedPrompts }
}

/** Inspect preserved V1/V2/V3 card data without changing the native card. */
export function inspectMvuSource(source, fallbackCharacter) {
  const payload = record(source) ? source : {}
  const data = record(payload.data) ? payload.data : {}
  const get = key => data[key] ?? payload[key]
  const getText = (key, alternate) => firstString(data[key], payload[key], alternate === undefined ? undefined : data[alternate], alternate === undefined ? undefined : payload[alternate])
  const diagnostics = []
  const candidates = []
  for (const [field, alternate, normalizedField] of CARD_TEXT_FIELDS) {
    const sourceText = getText(field, alternate)
    collectInitBlocks(sourceText, `/source/${field}`, candidates)
    const currentText = fallbackCharacter?.[normalizedField]
    if (typeof currentText === 'string' && currentText !== sourceText) {
      // Imported cards retain their original payload so stripped controls can
      // still be adapted. The current entity is inspected as a later layer as
      // well, otherwise a live card edit could never add or override state.
      collectInitBlocks(currentText, `/character/${normalizedField}`, candidates)
    }
  }
  // Older imports may have removed disabled compatibility entries from the
  // materialized lorebook. The preserved role-card payload remains the only
  // lossless source for those initializers, so inspect its embedded book here.
  collectBookInitializerCandidates(get('character_book'), '/source/character_book', candidates)
  const extensions = record(get('extensions'))
    ? get('extensions')
    : record(fallbackCharacter?.extensions) ? fallbackCharacter.extensions : {}
  if (extensions.stat_data !== undefined) candidates.push({ path: '/source/extensions/stat_data', value: extensions.stat_data })
  if (extensions.display_data !== undefined) diagnostics.push({ code: 'MVU_DISPLAY_DATA_RUNTIME_ALIAS', severity: 'info', path: '/source/extensions/display_data' })
  collectUpdateRuleDiagnostics(extensions, diagnostics)

  const openings = inspectCurrentOpenings(sourceOpeningTexts(payload), currentOpeningTexts(fallbackCharacter))
  const normalizedOpenings = openings.filter(opening => opening.text.length > 0)
  const stats = { converted: 0 }
  const initialValue = decodeCandidates(candidates, diagnostics, stats)
  return {
    detected: candidates.length > 0 || openings.some(opening => opening.detected) || diagnostics.length > 0,
    initializerDetected: candidates.length > 0,
    initializationDetected: stats.converted > 0,
    initialValue,
    openings,
    normalizedOpenings,
    diagnostics,
  }
}

/** Parse and remove opening-only initialization and declarative update blocks. */
export function inspectMvuOpening(value, path = '/opening') {
  const text = typeof value === 'string' ? value : ''
  const diagnostics = []
  const candidates = []
  const updates = []
  let detected = false
  let cleaned = text.replace(INIT_BLOCK, (_whole, body) => {
    detected = true
    candidates.push({ path, value: body })
    return ''
  })
  cleaned = replaceMvuOperationBlocks(cleaned, block => {
    detected = true
    if (block.kind === 'update') {
      const parsed = parseOpeningUpdateBlock(block.whole)
      if (parsed.ok) updates.push(...parsed.updates)
      else diagnostics.push({
        code: 'MVU_OPERATION_LOGIC_IGNORED',
        severity: 'info',
        path,
        message: `已忽略无法安全转换的开场变量更新；该控制块中的变量命令均未生效。${parsed.message}`,
      })
    } else diagnostics.push({
      code: 'MVU_OPERATION_LOGIC_IGNORED',
      severity: 'info',
      path,
      message: '已移除开场中的 JSON Patch；其中的变量操作未执行。',
    })
    return ''
  })
  const residual = stripResidualMvuControlTags(cleaned)
  if (residual.fragments.length > 0) {
    detected = true
    cleaned = residual.text
    diagnostics.push({
      code: 'MVU_CONTROL_BLOCK_MALFORMED',
      severity: 'warning',
      path,
      message: '检测到未闭合的 MVU 控制块；已在不执行其中内容的情况下移除。',
    })
  }
  const stats = { converted: 0 }
  const initialValue = decodeCandidates(candidates, diagnostics, stats)
  return {
    detected,
    initializerDetected: candidates.length > 0 || updates.length > 0,
    initializationDetected: stats.converted > 0 || updates.length > 0,
    valueInitializerDetected: candidates.length > 0,
    valueInitializationDetected: stats.converted > 0,
    text: normalizeText(cleaned),
    initialValue,
    updates,
    diagnostics,
  }
}

/** Collect every bound lorebook initializer in binding and entry order. */
export function collectMvuLoreInitialValues(books) {
  let initialValue = {}
  let detected = false
  const stats = { converted: 0 }
  const diagnostics = []
  for (const [bookIndex, book] of (Array.isArray(books) ? books : []).entries()) {
    const candidates = []
    if (collectBookInitializerCandidates(book, `/books/${bookIndex}`, candidates)) detected = true
    initialValue = mergeMvuInitialValues(initialValue, decodeCandidates(candidates, diagnostics, stats))
  }
  return { detected, initializationDetected: stats.converted > 0, initialValue, diagnostics }
}

/** Resolve the selected opening against preserved source after card sanitizing/reordering. */
export function selectMvuOpening(inspection, openingIndex, selectedText) {
  if (!record(inspection)) return undefined
  const normalized = Array.isArray(inspection.normalizedOpenings) ? inspection.normalizedOpenings : []
  const selected = typeof selectedText === 'string' ? inspectMvuOpening(selectedText).text : undefined
  if (selected !== undefined) {
    const exact = normalized.filter(opening => opening.text === selected)
    if (exact.length === 1) return exact[0]
  }
  const index = Number.isSafeInteger(openingIndex) && openingIndex >= 0 ? openingIndex : 0
  return normalized[index] ?? (Array.isArray(inspection.openings) ? inspection.openings[index] : undefined)
}

/** Merge card, lore and selected-opening initializers, then atomically apply its literal commands. */
export function materializeMvuInitialValue(sourceInspection, opening, loreInitialValue = {}, options = {}) {
  let value = record(sourceInspection?.initialValue) ? structuredClone(sourceInspection.initialValue) : {}
  if (record(loreInitialValue)) value = mergeMvuInitialValues(value, loreInitialValue)
  if (record(opening?.initialValue)) value = mergeMvuInitialValues(value, opening.initialValue)
  if (options.applyOpeningUpdates === false || !Array.isArray(opening?.updates) || opening.updates.length === 0) return value
  return applyMvuOpeningOperations(value, opening.updates).value
}

/** Native State namespace chosen by the adapter; it carries no MVU identity. */
export function mvuStateNamespace() {
  return 'story'
}

/** Remove MVU control blocks without executing them. */
export function stripMvuControlBlocks(value, path = '/text', quarantine = []) {
  let detected = false
  let text = String(value ?? '').replace(INIT_BLOCK, () => {
    detected = true
    return ''
  })
  text = replaceMvuOperationBlocks(text, block => {
    detected = true
    quarantine.push({ kind: block.kind === 'patch' ? 'mvu-json-patch' : 'mvu-update', path, value: block.whole })
    return ''
  })
  const residual = stripResidualMvuControlTags(text)
  for (const fragment of residual.fragments) {
    detected = true
    quarantine.push({ kind: 'mvu-control-malformed', path, value: fragment })
  }
  return { detected, text: normalizeText(residual.text) }
}

/** Parse the literal-only MVU/Zod command set used by MVU greetings. */
export function parseOpeningUpdateBlock(block) {
  const parsed = parseMvuOpeningOperations(block)
  return parsed.ok ? { ok: true, updates: parsed.operations } : parsed
}

function collectInitBlocks(text, path, candidates) {
  if (typeof text !== 'string') return
  for (const match of text.matchAll(INIT_BLOCK)) candidates.push({ path, value: match[1] })
}

function collectBookInitializerCandidates(book, path, candidates) {
  const entries = Array.isArray(book?.entries)
    ? book.entries
    : record(book?.entries) ? Object.values(book.entries) : []
  let detected = false
  for (const [entryIndex, entry] of entries.entries()) {
    if (!record(entry)) continue
    const entryPath = `${path}/entries/${entryIndex}`
    const content = typeof entry.content === 'string' ? entry.content : ''
    if (INIT_MARKER.test(String(entry.name ?? entry.comment ?? ''))) {
      candidates.push({ path: entryPath, value: content.replace(INIT_MARKER, '') })
      detected = true
      continue
    }
    const before = candidates.length
    collectInitBlocks(content, `${entryPath}/content`, candidates)
    if (candidates.length > before) detected = true
  }
  return detected
}

function decodeCandidates(candidates, diagnostics, stats = { converted: 0 }) {
  let value = {}
  for (const candidate of candidates) {
    const decoded = decodeMvuInitialValue(candidate.value)
    if (decoded.ok) {
      stats.converted += 1
      value = mergeMvuInitialValues(value, decoded.value)
      for (const diagnostic of decoded.diagnostics ?? []) diagnostics.push({ ...diagnostic, path: candidate.path })
    }
    else diagnostics.push({ code: 'MVU_INIT_UNCONVERTED', severity: 'warning', path: candidate.path, message: decoded.message })
  }
  return value
}

function collectUpdateRuleDiagnostics(extensions, diagnostics) {
  const values = [extensions.rules, extensions.update_rules, extensions.variable_rules, record(extensions.mvu) ? extensions.mvu.rules : undefined].filter(value => value !== undefined)
  values.forEach((value, index) => {
    const rules = Array.isArray(value) && value.every(item => record(item) && typeof item.op === 'string') ? [value] : Array.isArray(value) ? value : [value]
    for (const _rule of rules) {
      diagnostics.push({
        code: 'MVU_OPERATION_LOGIC_IGNORED',
        severity: 'info',
        path: `/source/extensions/rules/${index}`,
        message: '已忽略角色卡扩展中的脚本操作或触发逻辑；后续变化仍由当前对话的会话变量规则管理。',
      })
    }
  })
}

function sourceOpeningTexts(source) {
  const data = record(source.data) ? source.data : {}
  const first = firstString(data.first_mes, source.first_mes, data.char_greeting, source.char_greeting)
  const alternate = firstArray(data.alternate_greetings, source.alternate_greetings)
  return [first, ...alternate].filter(value => typeof value === 'string' && value.trim().length > 0)
}

function currentOpeningTexts(character) {
  if (!record(character)) return []
  return [character.firstMessage, ...(Array.isArray(character.alternateGreetings) ? character.alternateGreetings : [])]
    .filter(value => typeof value === 'string' && value.trim().length > 0)
}

/**
 * Keep the current card's visible opening order authoritative while recovering
 * controls stripped from an otherwise unchanged imported opening.
 */
function inspectCurrentOpenings(sourceTexts, currentTexts) {
  const source = sourceTexts.map((text, sourceIndex) => ({
    sourceIndex,
    ...inspectMvuOpening(text, `/source/openings/${sourceIndex}`),
  }))
  if (currentTexts.length === 0) return source
  const visibleSource = source.filter(opening => opening.text.length > 0)
  return currentTexts.map((text, openingIndex) => {
    const current = inspectMvuOpening(text, `/character/openings/${openingIndex}`)
    if (current.detected) return { sourceIndex: openingIndex, ...current }
    const positional = visibleSource[openingIndex]
    if (positional?.text === current.text) return { ...positional, text: current.text }
    const matches = visibleSource.filter(opening => opening.text === current.text)
    return matches.length === 1 ? { ...matches[0], text: current.text } : { sourceIndex: openingIndex, ...current }
  })
}

function collectBookQuarantine(book, quarantine) {
  const entries = Array.isArray(book?.entries) ? book.entries : record(book?.entries) ? Object.values(book.entries) : []
  entries.forEach((entry, index) => {
    if (!record(entry) || typeof entry.content !== 'string') return
    for (const block of collectMvuOperationBlocks(entry.content)) {
      quarantine.push({ kind: block.kind === 'patch' ? 'mvu-json-patch' : 'mvu-update', path: `/character/characterBook/entries/${index}/content`, value: block.whole })
    }
  })
}

function firstString(...values) { return values.find(value => typeof value === 'string') ?? '' }
function firstArray(...values) { return values.find(Array.isArray) ?? [] }
function normalizeText(value) { return value.replaceAll('\r\n', '\n').replaceAll('\r', '\n').trim() }
function record(value) { return typeof value === 'object' && value !== null && !Array.isArray(value) }
