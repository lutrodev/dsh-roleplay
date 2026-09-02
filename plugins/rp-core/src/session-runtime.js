/** Thin compatibility boundary around the public Harness Session event API. */

/**
 * Return one stable snapshot of a Session Event Log.
 *
 * Roleplay packages use this helper instead of reaching into the Session
 * implementation directly, so a future Harness API migration remains local.
 *
 * @param {unknown} session Harness Session.
 * @returns {readonly object[]} Current immutable event snapshot.
 */
export function snapshotSessionEvents(session) {
  if (typeof session?.snapshotEvents !== 'function') {
    throw new TypeError('Harness Session does not expose snapshotEvents().')
  }
  const events = session.snapshotEvents()
  if (!Array.isArray(events)) throw new TypeError('Harness Session snapshotEvents() must return an array.')
  return events
}

/**
 * Resolve the native tool/call and model assistant message that owns it.
 *
 * The caller retains capability-specific policy such as whether other tool
 * calls are allowed in the same message.
 *
 * @param {unknown} session Harness Session.
 * @param {{ name: string, callId: string, turn?: number }} query Tool identity.
 * @returns {{ events: readonly object[], call?: object, assistants: object[] }} Correlated native records.
 */
export function resolveSessionToolCall(session, query) {
  const events = snapshotSessionEvents(session)
  const call = events.findLast(event => event?.type === 'tool/call'
    && String(event.data?.callId) === query.callId
    && event.data?.name === query.name
    && (query.turn === undefined || event.data?.turn === query.turn))
  if (call === undefined) return { events, assistants: [] }
  const assistants = events.filter(event => Number.isSafeInteger(event?.seq) && event.seq < call.seq
    && event?.type === 'assistant/message'
    && event.data?.turn === call.data?.turn
    && event.data?.step === call.data?.step
    && event.data?.message?.source?.kind === 'model'
    && Array.isArray(event.data?.message?.content)
    && event.data.message.content.some(block => block?.type === 'tool-call'
      && String(block.id) === query.callId
      && block.name === query.name))
  return { events, call, assistants }
}
