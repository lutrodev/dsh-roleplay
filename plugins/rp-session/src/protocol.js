/** Stable native command name carrying roleplay session profile snapshots. */
export const RP_SESSION_APPLY_COMMAND = 'rp-session-apply'

/** Current roleplay session command payload version. */
export const RP_SESSION_COMMAND_VERSION = 1

/** Maximum editable opening size stored in one Session profile. */
export const MAX_OPENING_CHARACTERS = 100000

/** Stable provenance of a Host-selected opening stored as a native assistant message. */
export const OPENING_MESSAGE_PROVIDER = 'rp-session'
export const OPENING_MESSAGE_MODEL = 'selected-opening'

/** @param {unknown} event @returns {boolean} Whether this is a selected opening assistant event. */
export function isSelectedOpeningMessage(event) {
  return event?.type === 'assistant/message'
    && event.data?.message?.source?.provider === OPENING_MESSAGE_PROVIDER
    && event.data?.message?.source?.model === OPENING_MESSAGE_MODEL
}

/** @returns {{ profile: Record<string, unknown> | null, pending: Array<{ commandId: string, profile: Record<string, unknown> }> }} */
export function emptySessionCommandState() {
  return { profile: null, pending: [] }
}

/**
 * Encode one complete post-change profile for the native command log.
 *
 * @param {number} expectedRevision Current profile revision.
 * @param {Record<string, unknown>} profile Complete next profile.
 * @returns {string} Canonical JSON command input, including its separator.
 */
export function encodeSessionCommand(expectedRevision, profile) {
  return ` ${JSON.stringify({ version: RP_SESSION_COMMAND_VERSION, expectedRevision, profile })}`
}

/**
 * Decode and validate one native roleplay session command input.
 *
 * @param {unknown} value Exact `command/run.args` or command handler input.
 * @returns {{ version: 1, expectedRevision: number, profile: Record<string, unknown> }}
 */
export function decodeSessionCommandInput(value) {
  if (typeof value !== 'string') throw new Error('roleplay session command input must be a string')
  let decoded
  try {
    decoded = JSON.parse(value.trim())
  } catch {
    throw new Error('roleplay session command input must be valid JSON')
  }
  if (!record(decoded) || decoded.version !== RP_SESSION_COMMAND_VERSION) {
    throw new Error(`roleplay session command version must be ${RP_SESSION_COMMAND_VERSION}`)
  }
  const keys = Object.keys(decoded)
  if (keys.length !== 3 || !keys.includes('version') || !keys.includes('expectedRevision') || !keys.includes('profile')) {
    throw new Error('roleplay session command must contain only version, expectedRevision and profile')
  }
  if (!Number.isSafeInteger(decoded.expectedRevision) || decoded.expectedRevision < 0) {
    throw new Error('roleplay session command expectedRevision must be a non-negative safe integer')
  }
  if (!record(decoded.profile) || decoded.profile.revision !== decoded.expectedRevision + 1) {
    throw new Error('roleplay session command profile must be the complete next revision')
  }
  return decoded
}

/**
 * Fold native command lifecycle events into the latest committed profile.
 *
 * @param {ReturnType<typeof emptySessionCommandState>} state Previous fold state.
 * @param {unknown} event Session event.
 * @returns {ReturnType<typeof emptySessionCommandState>} Next fold state.
 */
export function applySessionCommandEvent(state, event) {
  if (!record(event) || !record(event.data)) return state
  if (event.type === 'command/run' && event.data.name === RP_SESSION_APPLY_COMMAND && typeof event.data.commandId === 'string') {
    let payload
    try {
      payload = decodeSessionCommandInput(event.data.args)
    } catch {
      return state
    }
    return {
      ...state,
      pending: [...state.pending.filter(item => item.commandId !== event.data.commandId), { commandId: event.data.commandId, profile: payload.profile }],
    }
  }
  if (event.type !== 'command/done' || typeof event.data.commandId !== 'string') return state
  const pending = state.pending.find(item => item.commandId === event.data.commandId)
  if (pending === undefined) return state
  return {
    profile: event.data.kind === 'success' ? pending.profile : state.profile,
    pending: state.pending.filter(item => item.commandId !== event.data.commandId),
  }
}

/** @param {readonly unknown[]} events @returns {Record<string, unknown> | null} */
export function profileFromEvents(events) {
  return events.reduce(applySessionCommandEvent, emptySessionCommandState()).profile
}

/** @param {unknown} value */
function record(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
