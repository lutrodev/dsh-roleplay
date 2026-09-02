import { Session } from '@deepseek-ai/dsh-session'
import { decodeRpMessageActionEvent } from 'dsh-roleplay-rp-core/conversation'

const METER_SOURCE = Object.freeze({
  kind: 'plugin',
  plugin: 'rp-conversation-summary',
})

/**
 * Give Roleplay compaction an isolated meter view of maintenance replacements.
 *
 * DSH 0.1.1 validates every assistant/message as model-step output. Roleplay
 * message edits, suffix deletes and rerolls deliberately use native assistant
 * surface replacements while the Agent is idle, so older and current logs can
 * contain a valid surface replacement outside step/start..step/end. The native
 * meter rejects that event before compaction can select a range.
 *
 * Ordinary sessions still use the singleton meter directly. A Session that
 * contains a validated Roleplay action event is replayed through a detached,
 * meter-only view in which action carriers have user-role envelopes. Their
 * content and surface lineage stay identical, sequence ids do not change, and
 * the authoritative Session is never mutated. Empty carriers cost one
 * conservative role frame in this compatibility view instead of zero.
 */
export function roleplayCompactionTokenMeter(baseMeter) {
  const shadows = new WeakMap()
  return Object.freeze({
    estimateMessage(message) {
      return baseMeter.estimateMessage(message)
    },
    measure(session, requestHeader) {
      if (!shadows.has(session) && !session.snapshotEvents().some(isRoleplayActionAssistant)) {
        return baseMeter.measure(session, requestHeader)
      }
      const shadow = meterShadowSession(session, shadows)
      const measured = baseMeter.measure(shadow, requestHeader)
      return Object.freeze({ ...measured, logRevision: session.seq })
    },
  })
}

function isRoleplayActionAssistant(event) {
  return event?.type === 'assistant/message'
    && decodeRpMessageActionEvent(event) !== undefined
}

function meterShadowSession(session, shadows) {
  let cached = shadows.get(session)
  if (cached === undefined) {
    cached = { revision: 0, session: Session.create(session.id) }
    shadows.set(session, cached)
  }
  while (cached.revision < session.seq) {
    const source = session.eventAt(cached.revision)
    if (source === undefined) {
      throw new Error(`conversation summary: Session event ${cached.revision} is unavailable`)
    }
    const event = meterShadowEvent(source)
    const appended = event.surfaceOp === undefined
      ? cached.session.append(event.type, event.data)
      : cached.session.append(event.type, event.data, {
        surfaceOp: event.surfaceOp,
        ...(event.sourceEventSeqs === undefined ? {} : { sourceEventSeqs: event.sourceEventSeqs }),
      })
    if (appended.seq !== source.seq) {
      throw new Error('conversation summary: meter shadow lost Session sequence alignment')
    }
    cached.revision += 1
  }
  return cached.session
}

function meterShadowEvent(event) {
  if (!isRoleplayActionAssistant(event)) return event
  return {
    ...event,
    type: 'user/message',
    data: {
      role: 'user',
      id: event.data.message.id,
      content: event.data.message.content,
      source: METER_SOURCE,
    },
  }
}
