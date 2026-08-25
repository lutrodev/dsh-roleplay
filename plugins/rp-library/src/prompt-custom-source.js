export const CUSTOM_PROMPT_SOURCE_PREFIX = 'rp.custom:'

/** @param {string} slotId @returns {string} */
export function customPromptSourceId(slotId) {
  return `${CUSTOM_PROMPT_SOURCE_PREFIX}${slotId}`
}

/** @param {Record<string, unknown>} slot @returns {boolean} */
export function isCustomPromptSlot(slot) {
  return String(slot?.id ?? '').startsWith('custom-')
    || slot?.sourceIds?.some(sourceId => String(sourceId).startsWith(CUSTOM_PROMPT_SOURCE_PREFIX)) === true
}

/** @param {Record<string, unknown>} source @returns {boolean} */
export function isCustomPromptSource(source) {
  return String(source?.id ?? '').startsWith(CUSTOM_PROMPT_SOURCE_PREFIX)
}

/**
 * Attach persisted custom content to editable workbench slots.
 *
 * @param {readonly Record<string, unknown>[]} slots Persisted slots.
 * @param {readonly Record<string, unknown>[]} customSources Persisted custom content.
 * @returns {Record<string, unknown>[]} Editable slot drafts.
 */
export function hydratePromptSlots(slots, customSources = []) {
  const contents = new Map(customSources.map(source => [source.slotId, source.content]))
  return (slots ?? []).map(slot => ({
    ...slot,
    sourceIds: [...(slot.sourceIds ?? [])],
    sectionTag: slot.sectionTag !== false,
    ...(isCustomPromptSlot(slot) ? { customContent: contents.get(slot.id) ?? '' } : {}),
  }))
}

/**
 * Convert editable slot drafts into the canonical Session context build.
 *
 * @param {readonly Record<string, unknown>[]} slots Editable slot drafts.
 * @returns {{ version: 1, slots: Record<string, unknown>[], customSources?: Array<{ slotId: string, content: string }> }} Persistable context build.
 */
export function serializePromptContextBuild(slots) {
  const customSources = []
  const persistedSlots = slots.map(slot => {
    const custom = isCustomPromptSlot(slot)
    const content = custom && typeof slot.customContent === 'string' ? slot.customContent.trim() : ''
    const sourceId = customPromptSourceId(slot.id)
    const sourceIds = slot.sourceIds.filter(id => !String(id).startsWith(CUSTOM_PROMPT_SOURCE_PREFIX))
    if (content.length > 0) {
      sourceIds.push(sourceId)
      customSources.push({ slotId: slot.id, content })
    }
    return {
      id: slot.id,
      label: slot.label,
      sourceIds,
      ...(slot.locked === true ? { locked: true } : {}),
      ...(slot.idle === true ? { idle: true } : {}),
      sectionTag: slot.sectionTag !== false,
    }
  })
  return {
    version: 1,
    slots: persistedSlots,
    ...(customSources.length === 0 ? {} : { customSources }),
  }
}

/**
 * Project one custom slot draft as a preview source.
 *
 * @param {Record<string, unknown>} slot Editable custom slot.
 * @returns {Record<string, unknown> | undefined} Draft preview source.
 */
export function customPromptSource(slot) {
  const text = typeof slot.customContent === 'string' ? slot.customContent.trim() : ''
  if (!isCustomPromptSlot(slot) || text.length === 0) return undefined
  return {
    id: customPromptSourceId(slot.id),
    label: slot.label,
    description: '当前对话中手动添加的回复资料。',
    kind: 'runtime',
    available: true,
    characters: [...text].length,
    defaultSlot: { id: slot.id, label: slot.label },
    text,
  }
}
