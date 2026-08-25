/** Durable metadata discriminator for one accepted roleplay turn. */
export const RP_COMMIT_META_KIND = 'rp-agent/turn-commit'

/** Current roleplay commit metadata version. */
export const RP_COMMIT_META_VERSION = 2

/** Stable tool name used as the roleplay transaction commit point. */
export const RP_COMMIT_TOOL = 'rp_commit_turn'

/** Stable Agent-mode mutation tool name for shared Roleplay assets. */
export const RP_ASSET_TOOL = 'rp_asset'

/** Stable read-only tool name for inspecting shared Roleplay assets. */
export const RP_ASSET_READ_TOOL = 'rp_asset_read'

/**
 * Return the ordered asset ids currently bound for one shared-material kind.
 * This is the common profile-to-authorization mapping used by the Chat prompt
 * manifest and the read-only tool boundary.
 *
 * @param {unknown} profile Roleplay Session profile.
 * @param {'character'|'lorebook'|'persona'|'preset'|'writingStyle'} kind Asset kind.
 * @returns {string[]} Ordered bound ids.
 */
export function rpAssetBindingIds(profile, kind) {
  const resources = isRecord(profile) && isRecord(profile.resources) ? profile.resources : {}
  if (kind === 'character') return singletonBindingId(resources.card)
  if (kind === 'persona') return singletonBindingId(resources.persona)
  if (kind === 'preset') return singletonBindingId(resources.preset)
  if (kind === 'lorebook') return orderedBindingIds(resources.lorebooks)
  if (kind === 'writingStyle') return orderedBindingIds(resources.writingStyles)
  return []
}

/** Return the compact authoritative binding manifest for one profile. */
export function rpCurrentAssetBindingManifest(profile) {
  const singleton = kind => rpAssetBindingIds(profile, kind)[0] ?? null
  return {
    characterId: singleton('character'),
    lorebookIds: rpAssetBindingIds(profile, 'lorebook'),
    personaId: singleton('persona'),
    presetId: singleton('preset'),
    writingStyleIds: rpAssetBindingIds(profile, 'writingStyle'),
  }
}

/** Stable tool name used to run the sole narrative Writer for one RP run. */
export const RP_WRITE_TOOL = 'rp_write_turn'

/** Required operation discriminator for every fixed Writer invocation. */
export const RP_WRITE_ACTION = 'write'

/** Stable tool name used to run one registered isolated task subagent. */
export const RP_SUBAGENT_TOOL = 'rp_run_subagent'

/** Durable metadata discriminator for one completed Writer run. */
export const RP_WRITER_META_KIND = 'rp-agent/writer-result'

/** Current Writer result metadata version. */
export const RP_WRITER_META_VERSION = 1

/** Durable metadata discriminator for one completed isolated task subagent. */
export const RP_SUBAGENT_META_KIND = 'rp-agent/subagent-result'

/** Current isolated task subagent metadata version. */
export const RP_SUBAGENT_META_VERSION = 1

/**
 * Return the accepted roleplay artifact carried by a successful tool result.
 *
 * @param {unknown} event Session event candidate.
 * @returns {Record<string, unknown> | undefined} Accepted artifact metadata.
 */
export function decodeRpCommitEvent(event) {
  if (!isRecord(event) || event.type !== 'tool/result') return undefined
  const data = event.data
  if (!isRecord(data) || data.error !== undefined) return undefined
  const meta = data.meta
  if (!isRecord(meta)
    || meta.kind !== RP_COMMIT_META_KIND
    || meta.version !== RP_COMMIT_META_VERSION
    || typeof meta.runId !== 'string'
    || !isRecord(meta.assistant)
    || !Number.isSafeInteger(meta.assistant.seq)
    || typeof meta.assistant.messageId !== 'string') return undefined
  return meta
}

/**
 * Return the model assistant event named by one accepted v2 commit.
 *
 * @param {readonly unknown[]} events Complete Session Event Log.
 * @param {unknown} commit Successful commit event or decoded commit metadata.
 * @returns {Record<string, unknown> | undefined} Correlated assistant event.
 */
export function resolveRpCommitAssistant(events, commit) {
  const meta = decodeRpCommitEvent(commit) ?? (isRecord(commit) ? commit : undefined)
  const assistant = isRecord(meta?.assistant) ? meta.assistant : undefined
  if (assistant === undefined || !Number.isSafeInteger(assistant.seq)) return undefined
  const event = events[assistant.seq]
  if (!isRecord(event) || event.type !== 'assistant/message') return undefined
  const message = event.data?.message
  if (!isRecord(message) || message.id !== assistant.messageId || message.source?.kind !== 'model') return undefined
  return event
}

/**
 * Return the unique append-origin model assistant message and native tool/call
 * event for one durable model tool invocation.
 *
 * The correlation is deliberately capability-neutral so optional plugins can
 * bind durable business records to the assistant surface without Core knowing
 * what those records mean.
 *
 * @param {readonly unknown[]} events Complete Session Event Log.
 * @param {unknown} callId Durable tool call id supplied by the tool executor.
 * @param {unknown} toolName Exact registered tool name.
 * @returns {{ event: Record<string, unknown>, message: Record<string, unknown>, call: Record<string, unknown> } | undefined}
 */
export function resolveRpToolCallAssistant(events, callId, toolName) {
  if (!Array.isArray(events)
    || typeof callId !== 'string' || callId.length === 0
    || typeof toolName !== 'string' || toolName.length === 0) return undefined
  const calls = events.filter(event => isRecord(event)
    && event.type === 'tool/call'
    && typeof event.data?.callId === 'string'
    && event.data.callId === callId)
  if (calls.length !== 1) return undefined
  const call = calls[0]
  if (call.data?.name !== toolName
    || !Number.isSafeInteger(call.seq)
    || !Number.isSafeInteger(call.data?.turn)
    || !Number.isSafeInteger(call.data?.step)) return undefined
  const candidates = events.filter(event => isRecord(event)
    && event.type === 'assistant/message'
    && event.surfaceOp === 'append'
    && Number.isSafeInteger(event.seq)
    && event.seq < call.seq
    && event.data?.turn === call.data.turn
    && event.data?.step === call.data.step
    && isRecord(event.data?.message)
    && event.data.message.role === 'assistant'
    && typeof event.data.message.id === 'string'
    && event.data.message.id.length > 0
    && event.data.message.source?.kind === 'model'
    && assistantOwnsToolCall(event.data.message, callId, toolName))
  if (candidates.length !== 1) return undefined
  return { event: candidates[0], message: candidates[0].data.message, call }
}

function assistantOwnsToolCall(message, callId, toolName) {
  if (!Array.isArray(message.content)) return false
  const calls = message.content.filter(block => block?.type === 'tool-call' && block.id === callId)
  return calls.length === 1 && calls[0].name === toolName
}

/**
 * Read visible text from a model assistant event without including reasoning or tool calls.
 *
 * @param {unknown} event Assistant event candidate.
 * @returns {string} Concatenated visible text blocks.
 */
export function rpAssistantText(event) {
  if (!isRecord(event) || event.type !== 'assistant/message') return ''
  const content = event.data?.message?.content
  if (!Array.isArray(content)) return ''
  return content.filter(block => block?.type === 'text' && typeof block.text === 'string').map(block => block.text).join('')
}

/**
 * Return current surface nodes cited by a positional replacement.
 *
 * @param {unknown} event Surface event candidate.
 * @returns {number[]} Replaced node sequences.
 */
export function rpSurfaceReplacementSources(event) {
  if (!isRecord(event)) return []
  if (!isRecord(event.surfaceOp) || event.surfaceOp.op !== 'replace') return []
  return Array.isArray(event.sourceEventSeqs) ? event.sourceEventSeqs.filter(Number.isSafeInteger) : []
}

/** Whether an event replaces or removes any model-surface range. */
export function rpIsSurfaceMutation(event) {
  if (!isRecord(event)) return false
  return isRecord(event.surfaceOp) && event.surfaceOp.op === 'replace'
}

/**
 * Resolve the active surface-owned entities cited by one surface mutation.
 * The generic entity projection decides whether those citations move the
 * entity to a normal replacement node or retract it for a canonical
 * conversation delete/reroll.
 *
 * @param {unknown} event Surface event candidate.
 * @param {Array<{ currentSeq?: unknown } | null | undefined>} entities Active entities.
 * @returns {number[]} Replaced active entity sequences.
 */
export function rpReplacedEntitySeqs(event, entities) {
  const sources = new Set(rpSurfaceReplacementSources(event))
  if (sources.size === 0 || !Array.isArray(entities)) return []
  return entities
    .map(entity => entity?.currentSeq)
    .filter(seq => Number.isSafeInteger(seq) && sources.has(seq))
}

/**
 * Return one successful Writer result carried by a tool result.
 *
 * @param {unknown} event Session event candidate.
 * @returns {Record<string, unknown> | undefined} Accepted Writer metadata.
 */
export function decodeRpWriterEvent(event) {
  if (!isRecord(event) || event.type !== 'tool/result' || event.data?.error !== undefined) return undefined
  const meta = event.data?.meta
  if (!isRecord(meta)
    || meta.kind !== RP_WRITER_META_KIND
    || meta.version !== RP_WRITER_META_VERSION
    || typeof meta.runId !== 'string' || meta.runId.length === 0
    || typeof meta.writerSessionId !== 'string' || meta.writerSessionId.length === 0
    || typeof meta.provider !== 'string' || meta.provider.length === 0
    || typeof meta.model !== 'string' || meta.model.length === 0
    || (meta.executionMode !== 'chat' && meta.executionMode !== 'agent')
    || !Number.isSafeInteger(meta.turn)
    || typeof meta.promptHash !== 'string' || meta.promptHash.length === 0
    || !Number.isSafeInteger(meta.promptCharacters) || meta.promptCharacters < 0
    || !isRecord(meta.contextBuild)
    || !Array.isArray(meta.sections)
    || typeof meta.narrative !== 'string') return undefined
  return meta
}

/**
 * Validate a lossless JSON-compatible record.
 *
 * @param {unknown} value Candidate value.
 * @returns {value is Record<string, unknown>} Whether the value is a record.
 */
export function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Return the UTF-8 byte length of a JSON value.
 *
 * @param {unknown} value JSON-compatible value.
 * @returns {number} Serialized UTF-8 byte length.
 */
export function jsonByteLength(value) {
  return Buffer.byteLength(JSON.stringify(value), 'utf8')
}

function singletonBindingId(value) {
  return isRecord(value) && typeof value.id === 'string' && value.id.length > 0 ? [value.id] : []
}

function orderedBindingIds(value) {
  return Array.isArray(value) ? value.flatMap(singletonBindingId) : []
}
