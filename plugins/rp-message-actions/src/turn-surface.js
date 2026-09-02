import { isSelectedOpeningMessage } from 'dsh-roleplay-rp-session/protocol'
import { decodeRpMessageActionEvent } from './protocol.js'

export const RP_TURN_SURFACE_KEY = 'rp-turn-surface'

/** Match the durable events that determine one Roleplay turn's visible reply. */
export function turnSurfaceMatch(event) {
  if (event?.type === 'turn/start') return { id: String(event.data.turn), role: 'start' }
  if (event?.type === 'turn/end') return { id: String(event.data.turn), role: 'update' }
  if (event?.type === 'tool/result'
    && ['rp-agent/turn-commit', 'rp-agent/asset-mutation'].includes(event.data?.meta?.kind)) {
    return { id: String(event.data?.meta?.turn ?? event.data.turn), role: 'update' }
  }
  if (event?.type === 'assistant/message' && Number.isSafeInteger(event.data?.turn)) {
    const action = decodeRpMessageActionEvent(event)
    const target = action?.targets?.find(candidate => candidate.kind === 'turn')
    return { id: String(target?.turn ?? event.data.turn), role: 'update' }
  }
  return null
}

/** Start the deterministic read model for one turn. Session events remain the source of truth. */
export function startTurnSurface(event) {
  return {
    turn: event.data.turn,
    outcome: { kind: 'running' },
    replies: [],
    reply: undefined,
    commit: { kind: 'none' },
    hostOpeningSeq: undefined,
    sharedAssetMutation: false,
    end: undefined,
    seq: event.seq,
  }
}

/**
 * Fold one Session event into the semantic surface for a turn.
 *
 * Empty model messages are protocol activity, not deletion. Only a durable
 * rpMessageAction can retire a reply. Once a commit attempt claims readable
 * prose, later acknowledgements cannot replace that prose.
 */
export function updateTurnSurface(state, event) {
  if (isSelectedOpeningMessage(event)) return { ...state, hostOpeningSeq: event.seq }

  const action = decodeRpMessageActionEvent(event)
  if (action !== undefined) return updateFromMessageAction(state, event, action)

  if (event.type === 'assistant/message'
    && event.surfaceOp === 'append'
    && event.data?.message?.source?.kind === 'model') {
    return updateFromModelMessage(state, event)
  }
  if (event.type === 'tool/result'
    && event.surfaceOp === 'append'
    && event.data?.meta?.kind === 'rp-agent/asset-mutation') {
    return { ...state, sharedAssetMutation: true }
  }
  if (event.type === 'tool/result'
    && event.surfaceOp === 'append'
    && event.data?.meta?.kind === 'rp-agent/turn-commit') {
    return updateFromCommit(state, event)
  }
  if (event.type === 'turn/end') return closeTurnSurface(state, event)
  return state
}

export function turnSurfaceIsFailed(state) {
  return ['uncommitted', 'partial', 'failed'].includes(state?.outcome?.kind)
}

export function turnSurfaceIsRetired(state) {
  return state?.outcome?.kind === 'retired'
}

export function turnSurfaceIsCommitted(state) {
  return state?.outcome?.kind === 'committed'
}

export function turnSurfaceCommitAttempted(state) {
  return state?.commit?.kind === 'attempted' || state?.commit?.kind === 'committed'
}

export function turnSurfaceReply(state) {
  return state?.reply
}

export function turnSurfaceCommitSeq(state) {
  return state?.commit?.kind === 'committed' ? state.commit.resultSeq : undefined
}

export function turnSurfaceEndReasonKind(state) {
  return state?.end?.reasonKind
}

export function turnSurfaceEndCancelKind(state) {
  return state?.end?.cancelKind
}

function updateFromMessageAction(state, event, action) {
  if (action.operation === 'delete' || action.operation === 'reroll') {
    const retiresTurn = action.targets.some(target => target.kind === 'turn' && target.turn === state.turn)
    const retiresReply = action.targets.some(target => target.kind === 'message'
      && target.role === 'assistant'
      && state.replies.some(reply => reply.target.messageId === target.messageId))
    return retiresTurn || retiresReply
      ? { ...state, outcome: { kind: 'retired', operation: action.operation }, seq: event.seq }
      : state
  }
  if (action.operation !== 'edit') return state
  const target = action.targets.find(candidate => candidate.kind === 'message'
    && candidate.role === 'assistant'
    && state.replies.some(reply => reply.target.messageId === candidate.messageId))
  if (target === undefined) return state
  const text = assistantMessageText(event.data?.message)
  const update = reply => reply.target.messageId === target.messageId
    ? { ...reply, text, edited: true }
    : reply
  return {
    ...state,
    replies: state.replies.map(update),
    reply: state.reply?.target?.messageId === target.messageId ? update(state.reply) : state.reply,
    seq: event.seq,
  }
}

function updateFromModelMessage(state, event) {
  const text = assistantMessageText(event.data.message)
  const ownsCommit = assistantCallsTool(event.data.message, 'rp_commit_turn')
  if (text.trim().length === 0) {
    if (!ownsCommit) return state
    return {
      ...state,
      commit: {
        kind: 'attempted',
        ownerSeq: state.reply?.seq,
        attemptSeq: event.seq,
      },
      seq: event.seq,
    }
  }

  const reply = {
    seq: event.seq,
    target: {
      kind: 'message',
      role: 'assistant',
      messageId: event.data.message.id,
      turn: event.data.turn,
      step: event.data.step,
    },
    text,
    time: event.time,
    edited: false,
    interrupted: event.data.interrupted === true,
  }
  const replies = upsertReply(state.replies, reply)
  const hasClaimedReply = Number.isSafeInteger(state.commit?.ownerSeq)
  const selected = ownsCommit || !hasClaimedReply ? reply : state.reply
  return {
    ...state,
    replies,
    reply: selected,
    commit: ownsCommit
      ? { kind: 'attempted', ownerSeq: event.seq, attemptSeq: event.seq }
      : state.commit,
    seq: event.seq,
  }
}

function updateFromCommit(state, event) {
  const ownerSeq = event.data.meta.assistant?.seq ?? state.commit?.ownerSeq ?? state.reply?.seq
  const selected = state.replies.find(reply => reply.seq === ownerSeq) ?? state.reply
  return {
    ...state,
    reply: selected,
    commit: { kind: 'committed', ownerSeq, resultSeq: event.seq },
    seq: event.seq,
  }
}

function closeTurnSurface(state, event) {
  const reasonKind = event.data.reason?.kind
  const end = {
    seq: event.seq,
    reasonKind,
    cancelKind: reasonKind === 'aborted' ? event.data.reason.reason?.kind : undefined,
  }
  if (turnSurfaceIsRetired(state)) return { ...state, end, seq: event.seq }
  let outcome
  if (state.commit.kind === 'committed') outcome = { kind: 'committed' }
  else if (state.commit.kind === 'attempted') outcome = { kind: 'uncommitted' }
  else if (reasonKind === 'completed') outcome = { kind: 'completed' }
  else if (state.reply !== undefined) outcome = { kind: 'partial' }
  else outcome = { kind: 'failed' }
  return { ...state, outcome, end, seq: event.seq }
}

function upsertReply(replies, reply) {
  const index = replies.findIndex(candidate => candidate.seq === reply.seq)
  if (index === -1) return [...replies, reply]
  const next = replies.slice()
  next[index] = reply
  return next
}

function assistantMessageText(message) {
  return Array.isArray(message?.content)
    ? message.content
      .filter(part => part?.type === 'text' && typeof part.text === 'string')
      .map(part => part.text)
      .join('')
    : ''
}

function assistantCallsTool(message, name) {
  return Array.isArray(message?.content)
    && message.content.some(part => part?.type === 'tool-call' && part.name === name)
}
