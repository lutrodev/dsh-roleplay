import {
  decodeStoredReplyOptions,
  REPLY_OPTIONS_EXTENSION_NAMESPACE,
} from './protocol.js'

export const REPLY_OPTIONS_ANCHOR_KIND = 'rp-reply-options-anchor'
export const REPLY_OPTIONS_RETRACTION_KIND = 'rp-reply-options-retraction'

const latestAnchorCache = new WeakMap()

/** Match one Turn lifecycle that can end in a committed Roleplay reply. */
export function replyOptionsAnchorMatch(event) {
  const turn = event?.data?.turn
  if (!Number.isSafeInteger(turn)) return null
  if (event.type === 'turn/start') return { id: String(turn), role: 'start' }
  if (event.type === 'tool/result' || event.type === 'turn/end') {
    return { id: String(turn), role: 'update' }
  }
  return null
}

export function replyOptionsAnchorStart(event) {
  return {
    turn: event.data.turn,
    committed: false,
    assistantSeq: undefined,
    options: undefined,
    successful: false,
    endSeq: undefined,
  }
}

/** Fold only successful commit evidence and its canonical extension payload. */
export function replyOptionsAnchorUpdate(state, event) {
  if (event.type === 'tool/result' && successfulCommitResult(event)) {
    const stored = decodeStoredReplyOptions(
      event.data?.meta?.extensions?.[REPLY_OPTIONS_EXTENSION_NAMESPACE],
    )
    return {
      ...state,
      committed: true,
      assistantSeq: Number.isSafeInteger(event.data?.meta?.assistant?.seq)
        ? event.data.meta.assistant.seq
        : undefined,
      options: stored?.options,
    }
  }
  if (event.type === 'turn/end') {
    return {
      ...state,
      successful: event.data?.reason?.kind === 'completed'
        && state.committed === true
        && Number.isSafeInteger(state.assistantSeq)
        && Array.isArray(state.options),
      endSeq: event.seq,
    }
  }
  return state
}

export const replyOptionsAnchorNodeDefinition = {
  kind: REPLY_OPTIONS_ANCHOR_KIND,
  target: 'chat',
  match: replyOptionsAnchorMatch,
  start: (_context, match) => replyOptionsAnchorStart(match.event),
  update: (context, match) => replyOptionsAnchorUpdate(context.state, match.event),
  publication: match => match.event.type === 'turn/end' ? 'immediate' : 'none',
  buildViewNode: context => {
    const state = context.state
    if (state?.successful !== true || !Number.isSafeInteger(state.assistantSeq)) return null
    return {
      key: context.key,
      kind: REPLY_OPTIONS_ANCHOR_KIND,
      id: context.id,
      target: 'chat',
      anchorSeq: state.assistantSeq + 0.12,
      location: { kind: 'session' },
      visibility: 'visible',
      data: {
        version: 1,
        turn: state.turn,
        assistantSeq: state.assistantSeq,
        endSeq: state.endSeq,
        options: [...state.options],
      },
    }
  },
}

/** Match message mutations so choices never outlive the prose that produced them. */
export function replyOptionsRetractionMatch(event) {
  const action = messageAction(event)
  return action !== undefined
    ? { id: String(event.seq), role: 'start' }
    : null
}

export function replyOptionsRetractionStart(event) {
  const action = messageAction(event)
  return {
    seq: event.seq,
    replacementStart: event.surfaceOp?.op === 'replace' && Number.isSafeInteger(event.surfaceOp.start)
      ? event.surfaceOp.start
      : undefined,
    removedTurns: [...new Set((action?.targets ?? [])
      .map(target => target?.turn)
      .filter(Number.isSafeInteger))],
  }
}

export const replyOptionsRetractionNodeDefinition = {
  kind: REPLY_OPTIONS_RETRACTION_KIND,
  target: 'chat',
  match: replyOptionsRetractionMatch,
  start: (_context, match) => replyOptionsRetractionStart(match.event),
  update: context => context.state,
  buildViewNode: context => !Number.isSafeInteger(context.state?.seq) ? null : ({
    key: context.key,
    kind: REPLY_OPTIONS_RETRACTION_KIND,
    id: context.id,
    target: 'chat',
    anchorSeq: context.state.seq + 0.115,
    location: { kind: 'session' },
    visibility: 'visible',
    data: context.state,
  }),
}

/** Select the latest valid choices only while no later user/steering message exists. */
export function latestReplyOptionsAnchorKey(chat) {
  const order = chat?.order
  const nodes = chat?.nodes
  if (!Array.isArray(order) || typeof nodes?.get !== 'function') return undefined
  const cached = latestAnchorCache.get(order)
  if (cached?.nodes === nodes) return cached.key
  let anchors = []
  for (const key of order) {
    const node = nodes.get(key)
    if (node?.kind === REPLY_OPTIONS_ANCHOR_KIND) {
      anchors.push(node)
      continue
    }
    if (node?.kind === REPLY_OPTIONS_RETRACTION_KIND) {
      anchors = anchors.filter(anchor => !retractionRemovesAnchor(node.data, anchor.data))
      continue
    }
    if (node?.kind === 'user' || node?.kind === 'steering') anchors = []
  }
  const key = anchors.at(-1)?.key
  latestAnchorCache.set(order, { nodes, key })
  return key
}

function retractionRemovesAnchor(retraction, anchor) {
  if (retraction?.removedTurns?.includes(anchor?.turn)) return true
  if (!Number.isSafeInteger(retraction?.replacementStart)
    || !Number.isSafeInteger(retraction?.seq)
    || !Number.isSafeInteger(anchor?.assistantSeq)) return false
  return anchor.assistantSeq >= retraction.replacementStart
    && anchor.assistantSeq < retraction.seq
}

function successfulCommitResult(event) {
  return event.surfaceOp === 'append'
    && event.data?.meta?.kind === 'rp-agent/turn-commit'
    && event.data?.message?.isError !== true
}

function messageAction(event) {
  if (event?.type !== 'assistant/message' && event?.type !== 'user/message') return undefined
  const source = event.type === 'assistant/message' ? event.data?.message?.source : event.data?.source
  const action = source?.rpMessageAction
  if (action?.kind !== 'rp-agent/message-action'
    || action.version !== 1
    || !['edit', 'delete', 'reroll'].includes(action.operation)
    || !Array.isArray(action.targets)) return undefined
  return action
}
