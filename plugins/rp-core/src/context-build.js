/** Current persisted and model-selected context-build format. */
export const RP_CONTEXT_BUILD_VERSION = 1
export const MAX_CONTEXT_SLOTS = 64
export const CUSTOM_CONTEXT_SOURCE_PREFIX = 'rp.custom:'

const SOURCE_KINDS = new Set(['shared-reference', 'session-projection', 'conversation', 'runtime'])
const SOURCE_DELIVERIES = new Set(['snapshot', 'native-history'])
const PARENT_DELIVERIES = new Set(['none', 'commit'])
const PROMPT_CATEGORIES = new Set(['factual', 'instructional'])
const ID_PATTERN = /^[a-z0-9][a-z0-9._:-]*$/
const RESERVED_CONTEXT_TAG_PATTERN = /<\s*\/?\s*(?:section|item)(?=[\s/>])[^>]*>/giu

/**
 * Return the reserved source id for custom content owned by one Session slot.
 *
 * @param {string} slotId Custom slot id.
 * @returns {string} Stable custom source id.
 */
export function customContextSourceId(slotId) {
  if (typeof slotId !== 'string' || !ID_PATTERN.test(slotId)) {
    throw coded('RP_INVALID_CONTEXT_BUILD', 'custom context requires a stable slot id')
  }
  return `${CUSTOM_CONTEXT_SOURCE_PREFIX}${slotId}`
}

/**
 * Validate Session-owned custom Prompt content against its containing slots.
 * The complete serialized profile remains subject to the Session command byte limit.
 *
 * @param {unknown} value Candidate context build.
 * @returns {Array<{ slotId: string, content: string }>} Canonical custom sources.
 */
export function normalizeCustomContextSources(value) {
  if (!record(value) || value.customSources === undefined) return []
  if (!Array.isArray(value.customSources) || value.customSources.length > MAX_CONTEXT_SLOTS || !Array.isArray(value.slots)) {
    throw coded('RP_INVALID_CONTEXT_BUILD', `customSources must contain at most ${MAX_CONTEXT_SLOTS} items`)
  }
  const slots = new Map(value.slots.flatMap(slot => record(slot) && typeof slot.id === 'string' ? [[slot.id, slot]] : []))
  const seen = new Set()
  return value.customSources.map((candidate, index) => {
    if (!record(candidate) || typeof candidate.slotId !== 'string' || !ID_PATTERN.test(candidate.slotId) || seen.has(candidate.slotId)) {
      throw coded('RP_INVALID_CONTEXT_BUILD', `customSources item ${index} requires a unique stable slotId`)
    }
    seen.add(candidate.slotId)
    const slot = slots.get(candidate.slotId)
    const sourceId = customContextSourceId(candidate.slotId)
    if (slot === undefined || !Array.isArray(slot.sourceIds) || !slot.sourceIds.includes(sourceId)) {
      throw coded('RP_INVALID_CONTEXT_BUILD', `custom source "${sourceId}" must remain in slot "${candidate.slotId}"`)
    }
    if (typeof candidate.content !== 'string' || candidate.content.trim().length === 0) {
      throw coded('RP_INVALID_CONTEXT_BUILD', `custom source "${sourceId}" requires non-empty content`)
    }
    return { slotId: candidate.slotId, content: candidate.content.trim() }
  })
}

/**
 * Materialize Session-owned custom Prompt content as ordinary runtime definitions.
 *
 * @param {unknown} value Canonical context build.
 * @returns {Record<string, unknown>[]} Custom context definitions.
 */
export function contextBuildCustomDefinitions(value) {
  const customSources = normalizeCustomContextSources(value)
  if (customSources.length === 0) return []
  const slots = new Map(value.slots.map((slot, index) => [slot.id, { slot, index }]))
  return customSources.map(source => {
    const { slot, index } = slots.get(source.slotId)
    return normalizeContextSource({
      id: customContextSourceId(source.slotId),
      label: slot.label,
      description: '当前对话中手动添加的回复资料。',
      kind: 'runtime',
      promptCategory: 'instructional',
      order: index,
      budgetPriority: index,
      defaultSlot: { id: source.slotId, label: slot.label, order: index },
      sessionCustom: true,
      prepare() {},
    })
  })
}

/**
 * Validate and complete one context-source registration.
 *
 * @param {unknown} value Context-source definition.
 * @returns {Record<string, unknown>} Canonical definition.
 */
export function normalizeContextSource(value) {
  if (!record(value) || typeof value.id !== 'string' || !ID_PATTERN.test(value.id) || typeof value.prepare !== 'function') {
    throw coded('RP_INVALID_REGISTRATION', 'context source requires a stable id and prepare function')
  }
  const slot = record(value.defaultSlot) ? value.defaultSlot : {}
  const slotId = typeof slot.id === 'string' && ID_PATTERN.test(slot.id) ? slot.id : value.id
  const slotLabel = text(slot.label, sourceLabel(value.id), 80, 'context source slot label')
  if (slot.sectionTag !== undefined && typeof slot.sectionTag !== 'boolean') {
    throw coded('RP_INVALID_REGISTRATION', `context source "${value.id}" default slot sectionTag must be a boolean`)
  }
  const label = text(value.label, sourceLabel(value.id), 80, 'context source label')
  const description = text(value.description, label, 240, 'context source description')
  const kind = value.kind ?? 'runtime'
  if (!SOURCE_KINDS.has(kind)) throw coded('RP_INVALID_REGISTRATION', `context source "${value.id}" has an invalid kind`)
  const promptCategory = value.promptCategory ?? 'instructional'
  if (!PROMPT_CATEGORIES.has(promptCategory)) throw coded('RP_INVALID_REGISTRATION', `context source "${value.id}" has an invalid promptCategory`)
  const delivery = value.delivery ?? 'snapshot'
  if (!SOURCE_DELIVERIES.has(delivery)) throw coded('RP_INVALID_REGISTRATION', `context source "${value.id}" has an invalid delivery`)
  const parentDelivery = value.parentDelivery ?? 'none'
  if (!PARENT_DELIVERIES.has(parentDelivery)) throw coded('RP_INVALID_REGISTRATION', `context source "${value.id}" has an invalid parentDelivery`)
  const order = finite(value.order, 0, `context source "${value.id}" order`)
  const slotOrder = finite(slot.order, order, `context source "${value.id}" slot order`)
  const budgetPriority = finite(value.budgetPriority, order, `context source "${value.id}" budgetPriority`)
  const dependsOn = value.dependsOn === undefined ? [] : stringIds(value.dependsOn, `context source "${value.id}" dependsOn`)
  const legacySlotIds = value.legacySlotIds === undefined ? [] : stringIds(value.legacySlotIds, `context source "${value.id}" legacySlotIds`)
  const legacySourceIds = value.legacySourceIds === undefined ? [] : stringIds(value.legacySourceIds, `context source "${value.id}" legacySourceIds`)
  return {
    ...value,
    id: value.id,
    label,
    description,
    kind,
    promptCategory,
    delivery,
    parentDelivery,
    order,
    budgetPriority,
    required: value.required === true,
    idleAllowed: value.idleAllowed !== false,
    pretransformed: value.pretransformed === true,
    dependsOn,
    legacySlotIds,
    legacySourceIds,
    defaultSlot: {
      id: slotId,
      label: slotLabel,
      order: slotOrder,
      locked: slot.locked === true,
      ...(slot.sectionTag === undefined ? {} : { sectionTag: slot.sectionTag }),
    },
  }
}

/**
 * Reconcile a stored live-source layout with the definitions available for this run.
 * Removed dynamic sources are pruned, newly available sources are appended to defaults,
 * retired aggregate sources can expand in place through legacySourceIds, and user-created
 * empty slots are preserved.
 */
export function reconcileChatContextBuild(value, definitions) {
  if (value === undefined || value === null) return defaultContextBuild(definitions)
  if (!record(value) || value.version !== RP_CONTEXT_BUILD_VERSION || !Array.isArray(value.slots)) {
    return resolveChatContextBuild(value, definitions)
  }
  const availableDefinitions = withCustomContextDefinitions(value, definitions)
  const known = new Map(availableDefinitions.map(definition => [definition.id, definition]))
  const legacySlotIds = new Set(availableDefinitions.flatMap(definition => definition.legacySlotIds ?? []))
  const legacySourceReplacements = new Map()
  for (const definition of availableDefinitions) {
    for (const sourceId of definition.legacySourceIds ?? []) {
      const replacements = legacySourceReplacements.get(sourceId) ?? []
      replacements.push(definition)
      legacySourceReplacements.set(sourceId, replacements)
    }
  }
  const preservedSourceIds = new Set(value.slots.flatMap(slot => record(slot) && Array.isArray(slot.sourceIds)
    ? slot.sourceIds.filter(sourceId => known.has(sourceId))
    : []))
  const migratedSourceIds = new Set(preservedSourceIds)
  const reconciled = []
  for (const slot of value.slots) {
    if (!record(slot) || !Array.isArray(slot.sourceIds)) {
      reconciled.push(slot)
      continue
    }
    const sourceIds = [...new Set(slot.sourceIds.filter(sourceId => known.has(sourceId)))]
    const replacementDefinitions = []
    let firstReplacementIndex = -1
    for (const [index, sourceId] of slot.sourceIds.entries()) {
      if (known.has(sourceId)) continue
      for (const definition of legacySourceReplacements.get(sourceId) ?? []) {
        if (migratedSourceIds.has(definition.id)) continue
        migratedSourceIds.add(definition.id)
        replacementDefinitions.push(definition)
        if (firstReplacementIndex < 0) firstReplacementIndex = index
      }
    }
    if (legacySlotIds.has(slot.id)) {
      const flattened = []
      const flattenedIds = new Set()
      for (const sourceId of slot.sourceIds) {
        const sourceDefinitions = known.has(sourceId)
          ? [known.get(sourceId)]
          : replacementDefinitions.filter(definition => (definition.legacySourceIds ?? []).includes(sourceId))
        for (const definition of sourceDefinitions) {
          if (flattenedIds.has(definition.id)) continue
          flattenedIds.add(definition.id)
          flattened.push(migratedContextSlot(definition, slot))
        }
      }
      reconciled.push(...flattened)
      continue
    }
    const replacementSlots = replacementDefinitions.map(definition => migratedContextSlot(definition, slot))
    if (sourceIds.length === 0) {
      if (replacementSlots.length > 0 || slot.sourceIds.length > 0) reconciled.push(...replacementSlots)
      else reconciled.push({ ...slot, sourceIds })
      continue
    }
    const defaultDefinition = sourceIds.length === 1 ? known.get(sourceIds[0]) : undefined
    const label = defaultDefinition?.defaultSlot?.id === slot.id ? defaultDefinition.defaultSlot.label : slot.label
    const residual = { ...slot, label, sourceIds }
    if (replacementSlots.length === 0) {
      reconciled.push(residual)
      continue
    }
    const firstKnownIndex = slot.sourceIds.findIndex(sourceId => known.has(sourceId))
    if (firstReplacementIndex >= 0 && firstReplacementIndex < firstKnownIndex) reconciled.push(...replacementSlots, residual)
    else reconciled.push(residual, ...replacementSlots)
  }
  const slots = mergeDuplicateSlots(reconciled)
  return resolveChatContextBuild({
    version: RP_CONTEXT_BUILD_VERSION,
    ...(value.sectionTags === undefined ? {} : { sectionTags: normalizeLegacySectionTags(value) }),
    slots,
    customSources: normalizeCustomContextSources(value),
  }, availableDefinitions)
}

function migratedContextSlot(definition, sourceSlot) {
  return {
    id: definition.defaultSlot.id,
    label: definition.defaultSlot.label,
    sourceIds: [definition.id],
    locked: definition.defaultSlot.locked,
    ...(sourceSlot.sectionTag === undefined ? {} : { sectionTag: sourceSlot.sectionTag }),
    ...(sourceSlot.idle === true ? { idle: true } : {}),
  }
}

/**
 * Resolve the deterministic Chat layout, adding newly registered sources to their declared default slots.
 * A newly introduced required slot enters at its semantic default position;
 * optional registrations remain appended so an existing user arrangement is not reshuffled.
 *
 * @param {unknown} value Persisted Session layout or undefined for defaults.
 * @param {readonly Record<string, unknown>[]} definitions Registered sources.
 * @returns {{ version: 1, slots: Array<{ id: string, label: string, sourceIds: string[], locked: boolean, sectionTag: boolean, idle?: true }> }} Canonical complete layout.
 */
export function resolveChatContextBuild(value, definitions) {
  const availableDefinitions = withCustomContextDefinitions(value, definitions)
  const defaults = defaultContextBuild(availableDefinitions)
  if (value === undefined || value === null) return defaults
  const customSources = normalizeCustomContextSources(value)
  const requested = normalizeLayout(value, availableDefinitions, true)
  const legacySectionTag = record(value) && typeof value.sectionTags === 'boolean' ? value.sectionTags : undefined
  const definitionById = new Map(availableDefinitions.map(definition => [definition.id, definition]))
  const placed = new Set(requested.slots.flatMap(slot => slot.sourceIds))
  const slots = requested.slots.map(slot => ({ ...slot, sourceIds: [...slot.sourceIds] }))
  for (const defaultSlot of defaults.slots) {
    const missing = defaultSlot.sourceIds.filter(id => !placed.has(id))
    if (missing.length === 0) continue
    const target = slots.find(slot => slot.id === defaultSlot.id)
    if (target === undefined && missing.some(id => definitionById.get(id)?.required === true)) {
      const defaultIndex = defaults.slots.findIndex(slot => slot.id === defaultSlot.id)
      const nextDefaultIds = new Set(defaults.slots.slice(defaultIndex + 1).map(slot => slot.id))
      const insertionIndex = slots.findIndex(slot => nextDefaultIds.has(slot.id))
      slots.splice(insertionIndex < 0 ? slots.length : insertionIndex, 0, {
        ...defaultSlot,
        sourceIds: missing,
        sectionTag: legacySectionTag ?? defaultSlot.sectionTag,
      })
    } else if (target === undefined) slots.push({
      ...defaultSlot,
      sourceIds: missing,
      sectionTag: legacySectionTag ?? defaultSlot.sectionTag,
    })
    else target.sourceIds.push(...missing)
  }
  enforceLockedSources(slots, availableDefinitions)
  enforceActiveSources(slots, availableDefinitions)
  return {
    version: RP_CONTEXT_BUILD_VERSION,
    slots,
    ...(customSources.length === 0 ? {} : { customSources }),
  }
}

/**
 * Produce the default layout from source metadata.
 *
 * @param {readonly Record<string, unknown>[]} definitions Registered sources.
 * @returns {{ version: 1, slots: Array<{ id: string, label: string, sourceIds: string[], locked: boolean, sectionTag: boolean, idle?: true }> }} Default layout.
 */
export function defaultContextBuild(definitions) {
  const slots = []
  const ordered = [...definitions].sort((left, right) => left.defaultSlot.order - right.defaultSlot.order || left.order - right.order || left.id.localeCompare(right.id))
  for (const definition of ordered) {
    let slot = slots.find(item => item.id === definition.defaultSlot.id)
    if (slot === undefined) {
      slot = {
        id: definition.defaultSlot.id,
        label: definition.defaultSlot.label,
        sourceIds: [],
        locked: definition.defaultSlot.locked,
        sectionTag: definition.defaultSlot.sectionTag !== false,
      }
      slots.push(slot)
    }
    slot.sourceIds.push(definition.id)
    slot.locked ||= definition.defaultSlot.locked
  }
  return { version: RP_CONTEXT_BUILD_VERSION, slots }
}

/**
 * Serialize every available source in the active Slot layout. Model providers
 * remain the authority for the final context-window validation.
 *
 * @param {{ layout: { slots: Array<Record<string, unknown>> }, candidates: readonly Record<string, unknown>[], unavailable?: readonly Record<string, unknown>[] }} input Build inputs.
 * @returns {{ slots: Array<Record<string, unknown>>, fragments: Array<Record<string, unknown>>, excluded: Array<Record<string, unknown>>, contextText: string, usedCharacters: number }} Compiled build.
 */
export function compileContextBuild({ layout, candidates, unavailable = [] }) {
  const activeSlots = layout.slots.filter(slot => slot.idle !== true)
  const selectedIds = activeSlots.flatMap(slot => slot.sourceIds)
  const candidateById = new Map(candidates.map(candidate => [candidate.id, candidate]))
  const admitted = new Set(selectedIds.filter(id => candidateById.has(id)))
  const fragments = []
  const slots = activeSlots.map((slot, slotIndex) => {
    const sourceIds = []
    for (const [sourceIndex, sourceId] of slot.sourceIds.entries()) {
      const candidate = candidateById.get(sourceId)
      if (candidate === undefined || !admitted.has(sourceId)) continue
      sourceIds.push(sourceId)
      fragments.push({ ...candidate, slotId: slot.id, slotLabel: slot.label, slotIndex, sourceIndex })
    }
    return { ...slot, sourceIds }
  })
  const unavailableSelected = unavailable.filter(item => selectedIds.includes(item.id))
  const contextText = renderContextText(slots, candidateById, admitted)
  return {
    slots,
    customSources: layout.customSources ?? [],
    fragments,
    excluded: unavailableSelected,
    contextText,
    usedCharacters: [...contextText].length,
  }
}

function withCustomContextDefinitions(value, definitions) {
  if (value === undefined || value === null) return definitions
  const custom = contextBuildCustomDefinitions(value)
  if (custom.length === 0) return definitions
  const known = new Map(definitions.map(definition => [definition.id, definition]))
  for (const definition of custom) {
    const existing = known.get(definition.id)
    if (existing !== undefined && existing.sessionCustom !== true) {
      throw coded('RP_DUPLICATE_CONTEXT', `context source "${definition.id}" conflicts with Session custom content`)
    }
    if (existing === undefined) known.set(definition.id, definition)
  }
  return [...known.values()]
}

/** @param {readonly Record<string, unknown>[]} definitions */
export function contextSourceCatalog(definitions) {
  return definitions.map(definition => ({
    id: definition.id,
    label: definition.label,
    description: definition.description,
    kind: definition.kind,
    promptCategory: definition.promptCategory,
    delivery: definition.delivery,
    parentDelivery: definition.parentDelivery,
    defaultSlot: definition.defaultSlot,
    budgetPriority: definition.budgetPriority,
    required: definition.required,
    idleAllowed: definition.idleAllowed,
  }))
}

function normalizeLayout(value, definitions, allowSubset) {
  if (!record(value) || value.version !== RP_CONTEXT_BUILD_VERSION || !Array.isArray(value.slots)) {
    throw coded('RP_INVALID_CONTEXT_BUILD', `context build must contain version ${RP_CONTEXT_BUILD_VERSION} and slots`)
  }
  if (value.slots.length > MAX_CONTEXT_SLOTS) throw coded('RP_CONTEXT_SLOT_LIMIT', `context build contains more than ${MAX_CONTEXT_SLOTS} slots`)
  const legacySectionTags = normalizeLegacySectionTags(value)
  const known = new Map(definitions.map(definition => [definition.id, definition]))
  const slotIds = new Set()
  const sourceIds = new Set()
  const slots = value.slots.map((candidate, index) => {
    if (!record(candidate)) throw coded('RP_INVALID_CONTEXT_BUILD', `context slot ${index} must be an object`)
    const id = typeof candidate.id === 'string' && ID_PATTERN.test(candidate.id) ? candidate.id : undefined
    if (id === undefined || slotIds.has(id)) throw coded('RP_INVALID_CONTEXT_BUILD', `context slot ${index} has an invalid or duplicate id`)
    slotIds.add(id)
    const label = text(candidate.label, id, 80, `context slot "${id}" label`)
    const ids = stringIds(candidate.sourceIds, `context slot "${id}" sourceIds`)
    if (candidate.idle !== undefined && typeof candidate.idle !== 'boolean') {
      throw coded('RP_INVALID_CONTEXT_BUILD', `context slot "${id}" idle must be a boolean`)
    }
    if (candidate.sectionTag !== undefined && typeof candidate.sectionTag !== 'boolean') {
      throw coded('RP_INVALID_CONTEXT_BUILD', `context slot "${id}" sectionTag must be a boolean`)
    }
    for (const sourceId of ids) {
      if (!known.has(sourceId)) throw coded('RP_CONTEXT_SOURCE_NOT_FOUND', `context source "${sourceId}" is not registered`)
      if (sourceIds.has(sourceId)) throw coded('RP_INVALID_CONTEXT_BUILD', `context source "${sourceId}" appears more than once`)
      sourceIds.add(sourceId)
    }
    // Locking is source metadata, not user-owned layout state. Re-derive it below
    // so removed locks do not survive forever in previously saved Session layouts.
    return {
      id,
      label,
      sourceIds: ids,
      locked: false,
      sectionTag: candidate.sectionTag ?? legacySectionTags,
      ...(candidate.idle === true ? { idle: true } : {}),
    }
  })
  if (!allowSubset && slots.length === 0 && definitions.length > 0) throw coded('RP_INVALID_CONTEXT_BUILD', 'Chat context build requires at least one slot')
  if (!allowSubset) enforceLockedSources(slots, definitions)
  return { version: RP_CONTEXT_BUILD_VERSION, slots }
}

function normalizeLegacySectionTags(value) {
  if (value.sectionTags === undefined) return true
  if (typeof value.sectionTags !== 'boolean') {
    throw coded('RP_INVALID_CONTEXT_BUILD', 'context build sectionTags must be a boolean')
  }
  return value.sectionTags
}

function mergeDuplicateSlots(slots) {
  const merged = []
  for (const slot of slots) {
    if (!record(slot) || typeof slot.id !== 'string' || !Array.isArray(slot.sourceIds)) {
      merged.push(slot)
      continue
    }
    const existing = merged.find(candidate => record(candidate) && candidate.id === slot.id && Array.isArray(candidate.sourceIds))
    if (existing === undefined) merged.push({ ...slot, sourceIds: [...slot.sourceIds] })
    else {
      existing.sourceIds.push(...slot.sourceIds)
      existing.locked ||= slot.locked === true
    }
  }
  return merged
}

function enforceLockedSources(slots, definitions) {
  for (const definition of definitions.filter(item => item.defaultSlot.locked)) {
    const slot = slots.find(item => item.sourceIds.includes(definition.id))
    if (slot === undefined || slot.id !== definition.defaultSlot.id) {
      throw coded('RP_CONTEXT_SOURCE_LOCKED', `context source "${definition.id}" must remain in slot "${definition.defaultSlot.id}"`)
    }
    slot.locked = true
  }
}

function enforceActiveSources(slots, definitions) {
  for (const definition of definitions.filter(item => item.idleAllowed === false)) {
    const slot = slots.find(item => item.sourceIds.includes(definition.id))
    if (slot?.idle === true) {
      throw coded('RP_CONTEXT_SOURCE_REQUIRED', `context source "${definition.id}" cannot be idle`)
    }
  }
}

function renderContextText(slots, candidateById, admitted) {
  const renderedSlots = slots.map(slot => ({
    ...slot,
    sourceIds: slot.sourceIds.filter(sourceId => admitted.has(sourceId)),
  })).filter(slot => slot.sourceIds.length > 0).map(slot => {
    const fragments = slot.sourceIds.map(sourceId => candidateById.get(sourceId))
    if (slot.sectionTag === false) return fragments.map(fragment => fragment.text).join('\n')
    const body = fragments.length === 1 && fragments[0].label === slot.label
      ? protectContextBoundaries(fragments[0].text)
      : fragments.map(fragment => `<item name="${escapeAttribute(fragment.label)}">\n${protectContextBoundaries(fragment.text)}\n</item>`).join('\n')
    return `<section name="${escapeAttribute(slot.label)}">\n${body}\n</section>`
  })
  return renderedSlots.join('\n')
}

function stringIds(value, field) {
  if (!Array.isArray(value) || value.length > 128 || value.some(item => typeof item !== 'string' || !ID_PATTERN.test(item))) {
    throw coded('RP_INVALID_CONTEXT_BUILD', `${field} must be an array of at most 128 stable ids`)
  }
  if (new Set(value).size !== value.length) throw coded('RP_INVALID_CONTEXT_BUILD', `${field} contains duplicates`)
  return [...value]
}

function finite(value, fallback, field) {
  if (value === undefined) return fallback
  if (!Number.isFinite(value)) throw coded('RP_INVALID_REGISTRATION', `${field} must be finite`)
  return value
}

function text(value, fallback, limit, field) {
  const result = typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback
  if ([...result].length > limit) throw coded('RP_INVALID_CONTEXT_BUILD', `${field} exceeds ${limit} characters`)
  return result
}

function sourceLabel(id) {
  return id.split(/[.:_-]/).filter(Boolean).map(part => part[0].toLocaleUpperCase() + part.slice(1)).join(' ')
}

function escapeAttribute(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

function protectContextBoundaries(value) {
  return String(value).replace(RESERVED_CONTEXT_TAG_PATTERN, tag => tag
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;'))
}

function record(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function coded(code, message) {
  const error = new Error(message)
  error.code = code
  return error
}
