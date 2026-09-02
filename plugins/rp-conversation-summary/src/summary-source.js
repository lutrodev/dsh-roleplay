import { isCompactCheckpointSource } from '@deepseek-ai/dsh-compaction'

/** Public Roleplay context source and slot identities. */
export const CONVERSATION_SUMMARY_SOURCE_ID = 'rp.conversation-summary'
export const CONVERSATION_SUMMARY_SLOT_ID = 'conversation-summary'

/**
 * Resolve summaries owned by checkpoints that are actually present on the
 * current surface. A newer but inactive summary event is deliberately ignored.
 */
export function activeConversationSummaries(session) {
  const events = session.snapshotEvents()
  const nodes = Array.isArray(session?.surface?.nodes) ? session.surface.nodes : []
  const summaries = new Map()
  for (const event of events) {
    if (event?.type !== 'compaction/summary') continue
    const id = event.data?.compactionId
    if (typeof id === 'string' && id.length > 0) summaries.set(id, event)
  }
  return nodes.flatMap((seq) => {
    const checkpoint = events[seq]
    const source = checkpoint?.type === 'user/message' ? checkpoint.data?.source : undefined
    if (!record(source) || !isCompactCheckpointSource(source)) return []
    const compactionId = source.compactionId
    if (typeof compactionId !== 'string' || compactionId.length === 0) {
      throw new Error(`conversation summary: active checkpoint at seq ${seq} has no compactionId`)
    }
    const summaryEvent = summaries.get(compactionId)
    if (summaryEvent === undefined) {
      throw new Error(`conversation summary: active checkpoint ${compactionId} has no matching summary event`)
    }
    const text = textBlocks(summaryEvent.data.summary)
    if (text.length === 0) {
      throw new Error(`conversation summary: active checkpoint ${compactionId} has no text summary`)
    }
    return [{
      compactionId,
      checkpointSeq: seq,
      summarySeq: summaryEvent.seq,
      text,
      blocks: summaryEvent.data.summary,
    }]
  })
}

/** Return one Slot payload, or undefined when no active checkpoint owns one. */
export function conversationSummaryContext(session) {
  const active = activeConversationSummaries(session)
  if (active.length === 0) return undefined
  return {
    text: active.map(item => item.text).join('\n\n---\n\n'),
    revision: active.map(item => item.compactionId).join(':'),
    diagnostics: {
      checkpoints: active.map(item => ({
        compactionId: item.compactionId,
        checkpointSeq: item.checkpointSeq,
        summarySeq: item.summarySeq,
      })),
    },
  }
}

function textBlocks(blocks) {
  if (!Array.isArray(blocks)) return ''
  return blocks
    .filter(block => block?.type === 'text' && typeof block.text === 'string')
    .map(block => block.text)
    .join('\n')
    .trim()
}

function record(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
