/**
 * Select the slots that need controls in the Prompt workbench.
 * Empty registered slots stay hidden until a drag needs them as drop targets;
 * user-created empty slots remain visible so they can be filled or removed.
 *
 * @param {readonly Record<string, unknown>[]} slots Current Session slots.
 * @param {Iterable<Record<string, unknown>>} sources Registered Prompt sources.
 * @param {boolean} revealEmpty Whether a source drag is active.
 * @returns {Record<string, unknown>[]} Visible workbench slots.
 */
export function selectWorkbenchSlots(slots, sources, revealEmpty) {
  if (revealEmpty) return [...slots]
  const sourceById = new Map()
  const registeredSlotIds = new Set()
  for (const source of sources) {
    sourceById.set(source.id, source)
    const id = source?.defaultSlot?.id
    if (typeof id === 'string') registeredSlotIds.add(id)
  }
  return slots.filter(slot => {
    const placedSources = slot.sourceIds.map(id => sourceById.get(id)).filter(Boolean)
    if (slot.id === 'rp.state') return sourceById.has('rp.state')
    return placedSources.some(source => source.available === true || source.required === true)
      || slot.sourceIds.some(id => !sourceById.has(id))
      || !registeredSlotIds.has(slot.id)
  })
}

/**
 * Select only slots that contribute content to the next reply preview.
 *
 * @param {readonly Record<string, unknown>[]} slots Current Session slots.
 * @param {ReadonlySet<string>} [includedSourceIds] Sources admitted to the effective Prompt.
 * @returns {Record<string, unknown>[]} Non-empty preview slots.
 */
export function selectPreviewSlots(slots, includedSourceIds) {
  const activeSlots = slots.filter(slot => slot.idle !== true)
  if (includedSourceIds === undefined) return activeSlots.filter(slot => slot.sourceIds.length > 0)
  return activeSlots
    .map(slot => ({ ...slot, sourceIds: slot.sourceIds.filter(id => includedSourceIds.has(id)) }))
    .filter(slot => slot.sourceIds.length > 0)
}

/**
 * Keep effective Prompt sources plus the current-input generation placeholder.
 * Other unavailable required sources, such as a conversation summary before
 * any checkpoint exists, must not appear in the effective Prompt preview.
 *
 * @param {Iterable<Record<string, unknown>>} sources Registered Prompt sources.
 * @param {readonly Record<string, unknown>[]} contexts Sources materialized for this preview.
 * @returns {Set<string>} Source ids shown in the Prompt document.
 */
export function previewIncludedSourceIds(sources, contexts) {
  const ids = new Set(contexts.map(source => source.id))
  for (const source of sources) {
    if (source.id === 'rp.current-input' && source.required === true) ids.add(source.id)
  }
  return ids
}
