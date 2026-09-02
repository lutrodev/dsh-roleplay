import { decodeRpCommitEvent, resolveRpCommitAssistant } from './protocol.js'
import { snapshotSessionEvents } from './session-runtime.js'

/** Durable metadata kind carried by native Roleplay message replacements. */
export const RP_MESSAGE_ACTION_META_KIND = 'rp-agent/message-action'

/** Current native Roleplay message-action metadata version. */
export const RP_MESSAGE_ACTION_META_VERSION = 1

/** Stable key for a user message, assistant message, or failed turn. */
export function rpMessageActionTargetKey(target) {
  return target.kind === 'turn'
    ? `turn:${String(target.turn)}`
    : `message:${target.role}:${String(target.messageId)}`
}

/** Build validated metadata for a native replacement carrier. */
export function createRpMessageActionMetadata(operation, targets, extra = {}) {
  if (!['edit', 'delete', 'reroll'].includes(operation)) {
    throw new TypeError('Roleplay message action operation must be edit, delete or reroll')
  }
  if (!Array.isArray(targets) || targets.length === 0) {
    throw new TypeError('Roleplay message action targets must be a non-empty array')
  }
  const normalized = targets.map(validateTarget)
  if (new Set(normalized.map(rpMessageActionTargetKey)).size !== normalized.length) {
    throw new TypeError('Roleplay message action targets must be unique')
  }
  const clonedExtra = structuredClone(extra)
  if (operation === 'reroll') validateReplay(clonedExtra.replay)
  return {
    ...clonedExtra,
    kind: RP_MESSAGE_ACTION_META_KIND,
    version: RP_MESSAGE_ACTION_META_VERSION,
    operation,
    targets: normalized,
  }
}

/** Decode Roleplay message-action metadata from a native user or assistant event. */
export function decodeRpMessageActionEvent(event) {
  const source = event?.type === 'user/message'
    ? event.data?.source
    : event?.type === 'assistant/message'
      ? event.data?.message?.source
      : undefined
  const action = source?.rpMessageAction
  if (action === undefined) return undefined
  if (!record(action)
    || action.kind !== RP_MESSAGE_ACTION_META_KIND
    || action.version !== RP_MESSAGE_ACTION_META_VERSION
    || !['edit', 'delete', 'reroll'].includes(action.operation)
    || !Array.isArray(action.targets)
    || action.targets.length === 0) {
    throw new TypeError('Roleplay message action metadata is invalid')
  }
  const targets = action.targets.map(validateTarget)
  if (new Set(targets.map(rpMessageActionTargetKey)).size !== targets.length) {
    throw new TypeError('Roleplay message action targets must be unique')
  }
  if (action.operation === 'reroll') validateReplay(action.replay)
  return { ...action, targets }
}

/** Whether a native surface replacement retracts commit-backed entities. */
export function rpMessageActionRetractsEntities(event) {
  const action = decodeRpMessageActionEvent(event)
  return action?.operation === 'delete' || action?.operation === 'reroll'
}

/** Return every message/failed-turn identity removed by durable action carriers. */
export function deletedRpMessageActionTargets(events) {
  const deleted = new Set()
  for (const event of events ?? []) {
    const action = decodeRpMessageActionEvent(event)
    if (action?.operation !== 'delete' && action?.operation !== 'reroll') continue
    for (const target of action.targets) deleted.add(rpMessageActionTargetKey(target))
  }
  return deleted
}

/**
 * Return the active Roleplay transcript without context injections, tool
 * results, reasoning, or intermediate model steps.
 */
export function roleplayTranscriptMessages(session) {
  const nodes = Array.isArray(session?.surface?.nodes) ? session.surface.nodes : []
  const events = snapshotSessionEvents(session)
  const active = nodes.map(seq => events[seq]).filter(Boolean)
  const endedTurns = new Map()
  const userTurns = new Map()
  let openTurn
  for (const event of events) {
    if (event?.type === 'turn/start') {
      openTurn = event.data.turn
      continue
    }
    if (event?.type === 'turn/end') {
      endedTurns.set(event.data.turn, event.data.reason?.kind)
      if (openTurn === event.data.turn) openTurn = undefined
      continue
    }
    if (openTurn !== undefined
      && event?.type === 'user/message'
      && event.surfaceOp === 'append'
      && event.data?.source?.kind === 'user') userTurns.set(event.data.id, openTurn)
  }
  const finalAssistants = new Map()
  const commitAssistants = new Map()
  for (const event of active) {
    if (event.type !== 'assistant/message'
      || event.data?.message?.source?.kind !== 'model'
      || endedTurns.get(event.data.turn) !== 'completed') continue
    finalAssistants.set(event.data.turn, event)
    if (messageText(event.data.message).trim().length > 0
      && assistantCallsTool(event.data.message, 'rp_commit_turn')) {
      commitAssistants.set(event.data.turn, event)
    }
  }
  for (const [turn, commitAssistant] of commitAssistants) finalAssistants.set(turn, commitAssistant)
  const messages = []
  for (const event of active) {
    if (event.type === 'user/message'
      && event.data?.source?.kind === 'user'
      && endedTurns.has(userTurns.get(event.data.id))
      && messageText(event.data).trim().length > 0) {
      messages.push(event.data)
      continue
    }
    if (event.type === 'assistant/message'
      && finalAssistants.get(event.data?.turn) === event
      && messageText(event.data.message).trim().length > 0) {
      messages.push(event.data.message)
    }
  }
  return messages
}

/**
 * Classify one visible model reply for prompt presentation.
 *
 * A writing reply must be backed by a durable successful narrative commit.
 * The selected opening is narrative prose created before the first commit and
 * therefore uses its stable native provenance as the only special case.
 *
 * @param {unknown} session Harness Session.
 * @param {unknown} message Native assistant message.
 * @returns {'writing' | 'non-writing' | undefined}
 */
export function roleplayAssistantReplyKind(session, message) {
  if (message?.role !== 'assistant'
    || message?.source?.kind !== 'model'
    || typeof message.id !== 'string'
    || message.id.length === 0) return undefined
  if (isSelectedOpeningMessage(message)) return 'writing'
  const events = snapshotSessionEvents(session)
  for (const event of events) {
    const commit = decodeRpCommitEvent(event)
    if (commit?.assistant?.messageId !== message.id) continue
    if (resolveRpCommitAssistant(events, commit)?.data?.message?.id === message.id) return 'writing'
  }
  return 'non-writing'
}

/** Return the active surface event descending from one append-origin event. */
export function currentSurfaceDescendant(session, originalSeq, events = snapshotSessionEvents(session)) {
  const seq = session?.surface?.nodes?.findLast(candidate => surfaceDescendsFrom(
    events, candidate, originalSeq,
  ))
  return seq === undefined ? undefined : events[seq]
}

/** Whether one current surface node descends from an original event. */
export function surfaceDescendsFrom(events, seq, target, visited = new Set()) {
  if (seq === target) return true
  if (visited.has(seq)) return false
  visited.add(seq)
  const event = events?.[seq]
  if (event?.surfaceOp?.op !== 'replace' || !Array.isArray(event.sourceEventSeqs)) return false
  return event.sourceEventSeqs.some(source => surfaceDescendsFrom(events, source, target, new Set(visited)))
}

/** Whether one current surface node descends from any event inside a turn. */
export function surfaceDescendsFromRange(events, seq, start, end, visited = new Set()) {
  if (visited.has(seq)) return false
  visited.add(seq)
  if (seq > start && seq < end) return true
  const event = events?.[seq]
  if (event?.surfaceOp?.op !== 'replace' || !Array.isArray(event.sourceEventSeqs)) return false
  return event.sourceEventSeqs.some(source => surfaceDescendsFromRange(
    events, source, start, end, new Set(visited),
  ))
}

function validateTarget(target) {
  if (!record(target)) throw new TypeError('Roleplay message action target must be an object')
  if (target.kind === 'turn') {
    if (!Number.isSafeInteger(target.turn) || target.turn < 0) {
      throw new TypeError('Roleplay failed-turn target requires a non-negative turn')
    }
    return { kind: 'turn', turn: target.turn }
  }
  if (target.kind !== 'message'
    || (target.role !== 'user' && target.role !== 'assistant')
    || typeof target.messageId !== 'string'
    || target.messageId.length === 0) {
    throw new TypeError('Roleplay message target is invalid')
  }
  return {
    kind: 'message', role: target.role, messageId: target.messageId,
    ...(Number.isSafeInteger(target.turn) ? { turn: target.turn } : {}),
    ...(Number.isSafeInteger(target.step) ? { step: target.step } : {}),
  }
}

function validateReplay(replay) {
  if (!Array.isArray(replay) || replay.length === 0) {
    throw new TypeError('Roleplay reroll metadata requires replay messages')
  }
  const ids = new Set()
  for (const message of replay) {
    if (!record(message)
      || message.role !== 'user'
      || typeof message.id !== 'string'
      || ids.has(message.id)
      || message.source?.kind !== 'user'
      || !Array.isArray(message.content)
      || message.content.length === 0
      || message.content.some(block => block?.type !== 'text' || typeof block.text !== 'string')) {
      throw new TypeError('Roleplay reroll replay message is invalid')
    }
    ids.add(message.id)
  }
}

function messageText(message) {
  return Array.isArray(message?.content)
    ? message.content
        .filter(block => block?.type === 'text' && typeof block.text === 'string')
        .map(block => block.text)
        .join('\n')
    : ''
}

function assistantCallsTool(message, name) {
  return Array.isArray(message?.content)
    && message.content.some(block => block?.type === 'tool-call' && block.name === name)
}

function isSelectedOpeningMessage(message) {
  return message?.source?.provider === 'rp-session'
    && message?.source?.model === 'selected-opening'
}

function record(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
