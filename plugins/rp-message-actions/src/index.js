import Schema from '@deepseek-ai/schemastery'
import { createAssistantMessage, createUserMessage } from '@deepseek-ai/dsh-llm'
import {
  createRpMessageActionMetadata,
  currentSurfaceDescendant,
  decodeRpMessageActionEvent,
  deletedRpMessageActionTargets,
  rpMessageActionTargetKey,
  surfaceDescendsFromRange,
} from 'dsh-roleplay-rp-core/conversation'
import { decodeRpCommitEvent } from 'dsh-roleplay-rp-core/protocol'
import { isSelectedOpeningMessage } from 'dsh-roleplay-rp-session/protocol'

export const name = 'rp-message-actions'
export const inject = ['connection', 'typert', 'agentPresets', 'agents']
export const Config = Schema.object({
  maxNarrativeCharacters: Schema.number().default(200000),
  maxUserMessageCharacters: Schema.number().default(50000),
})

const ENDPOINTS = new Set(['get', 'edit', 'delete', 'reroll'])
const RP_ASSET_MUTATION_META_KIND = 'rp-agent/asset-mutation'

export function apply(ctx, config) {
  validateConfig(config)
  ctx.on('agent/session-start', ({ agent }) => {
    if (roleplayPreset(agent.session) === 'roleplay') recoverPendingRerolls(agent)
  })
  for (const agent of ctx.agents.list()) {
    if (roleplayPreset(agent.session) === 'roleplay') recoverPendingRerolls(agent)
  }
  const dispose = ctx.connection.rpc.handle('/rp-message-actions', async (endpoint, payload) => {
    if (!ENDPOINTS.has(endpoint)) {
      return transportSuccess(failure('INVALID_REQUEST', `Unknown message action endpoint: ${String(endpoint)}`))
    }
    try {
      return transportSuccess(success(await dispatchMessageAction(ctx, endpoint, payload, config)))
    } catch (error) {
      return transportSuccess(failure(codeFor(error), error instanceof Error ? error.message : String(error)))
    }
  }, { authority: 'trusted-host' })
  ctx.effect(() => dispose, 'rp-message-actions: /rp-message-actions RPC')
}

/** Execute one operation against a stable user message, assistant message, or failed turn. */
export async function dispatchMessageAction(
  ctx,
  endpoint,
  payload,
  config = { maxNarrativeCharacters: 200000, maxUserMessageCharacters: 50000 },
) {
  validateConfig(config)
  const input = object(payload)
  const sessionId = requiredString(input.sessionId, 'sessionId')
  const target = messageActionTarget(input.target)
  const agent = await resolveRoleplayAgent(ctx, sessionId)
  if (endpoint === 'get') {
    // The Chat projection can publish a closed Turn a few milliseconds before
    // the Agent flips back to idle. The requested append-origin message is not
    // actionable until turn/end is in the authoritative Session Log, so join
    // that existing run instead of returning a sticky MESSAGE_NOT_FOUND to the
    // newly mounted toolbar.
    if (agent.status !== 'idle') await agent.whenIdle()
    return performAction(ctx, endpoint, input, config, agent, target)
  }
  // Chat publishes a closed Turn from the Session Log before the Agent driver
  // finishes its final microtask and flips to idle. A toolbar mounted from
  // that authoritative closed tail is already valid, so join only that
  // quiescing driver. Never wait through a genuinely open/generating tail.
  if (agent.status !== 'idle' && !hasClosedSessionTail(agent.session)) {
    throw coded('SESSION_RUNNING', 'Message actions require an idle Roleplay session.')
  }
  await agent.whenIdle()
  if (agent.status !== 'idle') throw coded('SESSION_RUNNING', 'Message actions require an idle Roleplay session.')

  let maintenance
  try {
    maintenance = agent.runMaintenance(
      signal => performAction(ctx, endpoint, input, config, agent, target, signal),
    )
  } catch (error) {
    if (error?.code !== undefined) throw error
    throw coded('SESSION_RUNNING', 'Another Roleplay operation is still finishing.', error)
  }
  try {
    return await maintenance
  } catch (error) {
    if (error?.code !== undefined) throw error
    throw coded(
      'MESSAGE_OPERATION_FAILED',
      error instanceof Error ? error.message : 'The requested message action was rejected.',
      error,
    )
  }
}

/** Whether the latest native turn already has its durable closing boundary. */
function hasClosedSessionTail(session) {
  const start = session.events.findLast(event => event?.type === 'turn/start')
  if (start === undefined) return true
  return session.events.some(event => event?.seq > start.seq
    && event?.type === 'turn/end'
    && event.data?.turn === start.data?.turn)
}

async function performAction(ctx, endpoint, input, config, agent, target, signal) {
  signal?.throwIfAborted()
  const resolved = locateMessageTarget(agent.session, target)
  if (resolved.kind === 'opening') {
    const sessions = ctx.agentPresets.serviceFor(agent, 'rpSessions')
    if (sessions === undefined) throw coded('NOT_RP_SESSION', 'The selected session has no Roleplay session service.')
    if (endpoint === 'get') return actionSummary(agent.session, resolved, sessions.get(agent))
    if (endpoint === 'edit') return editOpening(agent, resolved, input, sessions, signal)
    throw coded('UNSUPPORTED_MESSAGE', 'The selected opening does not support this operation.')
  }
  if (endpoint === 'get') return actionSummary(agent.session, resolved)
  if (endpoint === 'edit') return editMessage(agent, resolved, input, config, signal)
  if (endpoint === 'delete') return deleteMessage(agent, resolved, signal)
  return rerollMessage(agent, resolved, input, config, signal)
}

async function editOpening(agent, resolved, input, sessions, signal) {
  const content = editableContent(input.content)
  signal?.throwIfAborted()
  const current = sessions.get(agent)
  const profile = await sessions.setOpeningText(agent, {
    expectedRevision: current.revision,
    openingText: content,
  })
  return {
    sessionId: agent.id,
    target: resolved.target,
    turn: resolved.original.data.turn,
    content: profile.scene.openingText,
    opening: true,
  }
}

function editMessage(agent, resolved, input, config, signal) {
  if (resolved.kind !== 'message') {
    throw coded('UNSUPPORTED_MESSAGE', 'A failed reply has no editable message body.')
  }
  const content = editableContent(input.content)
  const limit = resolved.role === 'user'
    ? config.maxUserMessageCharacters
    : config.maxNarrativeCharacters
  if ([...content].length > limit) {
    throw coded('LIMIT_EXCEEDED', `Message content exceeds ${limit} characters.`)
  }
  signal?.throwIfAborted()
  const action = createRpMessageActionMetadata('edit', [resolved.target])
  const data = resolved.role === 'user'
    ? replaceUserText(resolved.current, content, action)
    : replaceAssistantText(resolved.current, content, action)
  const event = appendReplacement(agent.session, resolved.current, resolved.current.type, data)
  return {
    sessionId: agent.id,
    target: resolved.target,
    turn: resolved.turn.start.data.turn,
    seq: event.seq,
    content,
  }
}

function deleteMessage(agent, resolved, signal) {
  signal?.throwIfAborted()
  const plan = deletionSuffix(agent.session, resolved)
  const action = createRpMessageActionMetadata('delete', plan.targets)
  const event = appendEmptyActionCarrier(agent, resolved, action, plan.shadowed)
  appendAdditionalFailedTurnMarkers(agent, action)
  return {
    sessionId: agent.id,
    target: resolved.target,
    turn: resolved.turn.start.data.turn,
    seq: event.seq,
    removedTargets: plan.targets.length,
  }
}

function rerollMessage(agent, resolved, input, config, signal) {
  const detail = actionSummary(agent.session, resolved)
  if (!detail.canReroll && !detail.canSaveAndReroll) {
    throw coded('REROLL_UNAVAILABLE', 'Only the last recoverable Roleplay reply or user message can be regenerated.')
  }
  if (resolved.turn.sharedAssetMutation) {
    throw coded('REROLL_UNAVAILABLE', 'This reply changed shared Roleplay material and cannot be regenerated safely.')
  }
  const users = currentTurnUserMessages(agent.session, resolved.turn)
  if (users.length === 0 || users.some(unsupportedUserContent)) {
    throw coded('UNSUPPORTED_MESSAGE', 'This message contains non-text content and cannot be regenerated automatically.')
  }
  const replay = users.map(user => {
    const text = resolved.kind === 'message'
      && resolved.role === 'user'
      && user.id === resolved.current.data.id
      && input.content !== undefined
      ? editableContent(input.content)
      : messageText(user.content)
    if (text.trim().length === 0) {
      throw coded('UNSUPPORTED_MESSAGE', 'The source message has no text to regenerate.')
    }
    if ([...text].length > config.maxUserMessageCharacters) {
      throw coded('LIMIT_EXCEEDED', `Message content exceeds ${config.maxUserMessageCharacters} characters.`)
    }
    return createUserMessage({ content: [{ type: 'text', text }], source: { kind: 'user' } })
  })
  signal?.throwIfAborted()
  const plan = rerollSuffix(agent.session, resolved)
  const action = createRpMessageActionMetadata('reroll', plan.targets, { replay })
  const event = appendEmptyActionCarrier(agent, resolved, action, plan.shadowed)
  queueRerollReplay(agent, event)
  return {
    sessionId: agent.id,
    target: resolved.target,
    turn: resolved.turn.start.data.turn,
    seq: event.seq,
    sameSession: true,
  }
}

/** Locate one current Roleplay operation target by stable identity. */
export function locateMessageTarget(session, target) {
  if (target.kind === 'message' && target.role === 'assistant') {
    const opening = activeOpening(session, target.messageId)
    if (opening !== undefined) {
      return {
        kind: 'opening', role: 'assistant', target,
        original: opening.original, current: opening.current,
        message: opening.current.data.message,
      }
    }
  }
  const item = visibleRoleplayItems(session)
    .find(candidate => rpMessageActionTargetKey(candidate.target) === rpMessageActionTargetKey(target))
  if (item === undefined) throw coded('MESSAGE_NOT_FOUND', 'The selected message no longer exists.')
  return item
}

/** Locate one completed Roleplay turn and its append-origin business evidence. */
export function locateRoleplayTurn(session, turnNumber) {
  const start = session.events.find(event => event?.type === 'turn/start' && event.data?.turn === turnNumber)
  const end = session.events.find(event => event?.type === 'turn/end' && event.data?.turn === turnNumber)
  if (start === undefined || end === undefined) {
    throw coded('MESSAGE_NOT_FOUND', 'The selected Roleplay turn does not exist.')
  }
  const events = session.events.slice(start.seq + 1, end.seq)
  const users = events.filter(event => event?.type === 'user/message'
    && event.surfaceOp === 'append'
    && event.data?.source?.kind === 'user')
  const claimedUsers = claimedUserMessages(session.events, turnNumber)
  if (users.length === 0 && claimedUsers.length === 0) {
    throw coded('MESSAGE_NOT_FOUND', 'The selected turn is not a user-authored Roleplay exchange.')
  }
  const legacyCommit = events.find(event => event?.type === 'tool/result'
    && successfulToolResult(event)
    && event.data?.meta?.kind === 'rp-agent/turn-commit'
    && decodeRpCommitEvent(event) === undefined)
  if (legacyCommit !== undefined) {
    throw coded('UNSUPPORTED_MESSAGE', 'Legacy Roleplay commit logs are not supported by message operations.')
  }
  const commit = events.findLast(event => decodeRpCommitEvent(event) !== undefined)
  const committed = commit === undefined ? undefined : decodeRpCommitEvent(commit)
  const committedSeq = committed?.assistant?.seq
  const committedAssistant = Number.isSafeInteger(committedSeq) ? session.events[committedSeq] : undefined
  const finalAssistant = events.findLast(event => event?.type === 'assistant/message'
    && event.surfaceOp === 'append'
    && event.data?.message?.source?.kind === 'model')
  const finalReadableAssistant = events.findLast(event => event?.type === 'assistant/message'
    && event.surfaceOp === 'append'
    && event.data?.message?.source?.kind === 'model'
    && assistantText(event).trim().length > 0)
  const assistant = committedAssistant?.type === 'assistant/message'
    ? committedAssistant
    : finalReadableAssistant
  return {
    start, end, events, users, user: users[0], claimedUsers,
    assistant, finalAssistant, commit,
    sharedAssetMutation: events.some(event => event?.type === 'tool/result'
      && event.surfaceOp === 'append'
      && successfulToolResult(event)
      && event.data?.meta?.kind === RP_ASSET_MUTATION_META_KIND),
  }
}

/** Recover a reroll whose replacement committed before its inbox replay. */
export function recoverPendingRerolls(agent) {
  const replayIds = new Set()
  let queued = false
  for (const seq of agent.session.surface.nodes) {
    const event = agent.session.events[seq]
    const action = decodeRpMessageActionEvent(event)
    if (action?.operation !== 'reroll') continue
    for (const message of action.replay) replayIds.add(message.id)
    queued = queueRerollReplay(agent, event) || queued
  }
  // A hard stop can happen after followup() durably splices its message but
  // before its in-memory wake reaches the driver. Re-arm that already-pending
  // batch without changing its order. If the process stops between remove and
  // reinsert, the next recovery sees neither a pending nor an append-origin
  // user message and reconstructs the replay from the active carrier.
  if (!queued) rearmPendingReplay(agent, replayIds)
}

function queueRerollReplay(agent, event) {
  const action = decodeRpMessageActionEvent(event)
  if (action?.operation !== 'reroll') return false
  const delivered = appendOriginUserMessageIds(agent.session.events)
  const pending = pendingInboxMessageIds(agent.session.events)
  const missing = action.replay.filter(message => !delivered.has(message.id) && !pending.has(message.id))
  if (missing.length === 0) return false
  for (const message of missing.slice(0, -1)) agent.inject(message)
  agent.followup(missing.at(-1))
  return true
}

function rearmPendingReplay(agent, replayIds) {
  if (replayIds.size === 0 || agent.inbox === undefined) return
  const nextTurn = Array.from(agent.inbox.nextTurn ?? [])
  const nextStep = Array.from(agent.inbox.nextStep ?? [])
  if (![...nextTurn, ...nextStep].some(message => replayIds.has(message.id))) return

  // Moving the last message of one queue to the same tail is order-neutral and
  // uses only the public Inbox + Agent delivery APIs. Prefer next-turn because
  // it is the normal waking boundary for a reroll batch.
  const message = nextTurn.at(-1) ?? nextStep.at(-1)
  if (message === undefined || agent.inbox.remove(message.id) !== true) return
  if (nextTurn.length > 0) agent.followup(message)
  else agent.steer(message)
}

function deletionSuffix(session, resolved) {
  const items = visibleRoleplayItems(session)
  const selected = items.findIndex(item => rpMessageActionTargetKey(item.target) === rpMessageActionTargetKey(resolved.target))
  if (selected < 0) throw coded('MESSAGE_NOT_FOUND', 'The selected message no longer exists.')
  const targets = items.slice(selected).map(item => item.target)
  const start = resolved.kind !== 'message' || resolved.role === 'assistant'
    ? firstTurnOutputSurfaceIndex(session, resolved.turn, items.slice(selected + 1))
    : session.surface.nodes.indexOf(resolved.current.seq)
  return {
    targets,
    shadowed: start < 0 ? [] : session.surface.nodes.slice(start),
  }
}

function rerollSuffix(session, resolved) {
  const items = visibleRoleplayItems(session)
  const selectedTurn = resolved.turn.start.data.turn
  const first = items.findIndex(item => item.turn.start.data.turn === selectedTurn)
  if (first < 0) throw coded('MESSAGE_NOT_FOUND', 'The selected Roleplay turn no longer exists.')
  const targets = items.slice(first).map(item => item.target)
  const active = session.surface.nodes.filter(seq => surfaceDescendsFromRange(
    session.events, seq, resolved.turn.start.seq, resolved.turn.end.seq,
  ))
  const start = active.length === 0
    ? firstLaterSurfaceIndex(session, items.slice(first + 1))
    : session.surface.nodes.indexOf(active[0])
  return {
    targets,
    shadowed: start < 0 ? [] : session.surface.nodes.slice(start),
  }
}

function appendEmptyActionCarrier(agent, resolved, action, shadowed) {
  const base = carrierAssistant(agent, resolved)
  const data = structuredClone(base.data)
  data.message.content = []
  data.message.source = { ...data.message.source, rpMessageAction: action }
  delete data.message.source.replayState
  if (shadowed.length === 0) {
    return agent.session.append('assistant/message', data, {
      surfaceOp: 'append', sourceEventSeqs: [],
    })
  }
  return agent.session.append('assistant/message', data, {
    surfaceOp: { op: 'replace', start: shadowed[0], end: shadowed.at(-1) },
    sourceEventSeqs: shadowed,
  })
}

function appendAdditionalFailedTurnMarkers(agent, action) {
  const failed = action.targets.filter(target => target.kind === 'turn')
  for (const target of failed.slice(1)) {
    const message = createAssistantMessage({
      content: [],
      source: {
        provider: typeof agent.options?.provider === 'string' ? agent.options.provider : 'roleplay',
        model: typeof agent.options?.model === 'string' ? agent.options.model : 'roleplay',
        rpMessageAction: createRpMessageActionMetadata('delete', [target]),
      },
    })
    agent.session.append('assistant/message', {
      turn: target.turn,
      step: 1,
      message,
    }, { surfaceOp: 'append', sourceEventSeqs: [] })
  }
}

function carrierAssistant(agent, resolved) {
  const original = resolved.turn.finalAssistant ?? resolved.turn.assistant
  if (original?.type === 'assistant/message') return original
  const message = createAssistantMessage({
    content: [],
    source: {
      provider: typeof agent.options?.provider === 'string' ? agent.options.provider : 'roleplay',
      model: typeof agent.options?.model === 'string' ? agent.options.model : 'roleplay',
    },
  })
  return {
    type: 'assistant/message',
    data: {
      turn: resolved.turn.start.data.turn,
      step: lastTurnStep(resolved.turn.events) ?? 1,
      message,
    },
  }
}

function appendReplacement(session, current, type, data) {
  return session.append(type, data, {
    surfaceOp: { op: 'replace', start: current.seq, end: current.seq },
    sourceEventSeqs: [current.seq],
  })
}

function replaceUserText(current, content, action) {
  const data = structuredClone(current.data)
  data.content = replaceTextBlocks(data.content, content)
  data.source = { ...data.source, rpMessageAction: action }
  return data
}

function replaceAssistantText(current, content, action) {
  const data = structuredClone(current.data)
  data.message.content = replaceTextBlocks(data.message.content, content)
  data.message.source = { ...data.message.source, rpMessageAction: action }
  delete data.message.source.replayState
  return data
}

function replaceTextBlocks(blocks, content) {
  const next = []
  let inserted = false
  for (const block of Array.isArray(blocks) ? blocks : []) {
    if (block?.type === 'text') {
      if (!inserted) {
        next.push({ ...block, text: content })
        inserted = true
      }
      continue
    }
    if (!inserted && block?.type === 'tool-call') {
      next.push({ type: 'text', text: content })
      inserted = true
    }
    next.push(structuredClone(block))
  }
  if (!inserted) next.unshift({ type: 'text', text: content })
  return next
}

function visibleRoleplayItems(session) {
  const items = []
  const deleted = deletedRpMessageActionTargets(session.events)
  for (const start of session.events.filter(event => event?.type === 'turn/start')) {
    let turn
    try {
      turn = locateRoleplayTurn(session, start.data.turn)
    } catch (error) {
      if (error?.code === 'MESSAGE_NOT_FOUND') continue
      throw error
    }
    for (const original of turn.users) {
      const target = { kind: 'message', role: 'user', messageId: original.data.id }
      if (deleted.has(rpMessageActionTargetKey(target))) continue
      const current = currentSurfaceDescendant(session, original.seq)
      if (current?.type !== 'user/message'
        || current.data?.source?.kind !== 'user'
        || current.data.id !== original.data.id
        || !hasVisibleUserContent(current.data.content)) continue
      items.push({ kind: 'message', role: 'user', target, original, current, message: current.data, turn })
    }
    if (turn.assistant !== undefined) {
      const target = {
        kind: 'message', role: 'assistant', messageId: turn.assistant.data.message.id,
        turn: start.data.turn, step: turn.assistant.data.step,
      }
      if (!deleted.has(rpMessageActionTargetKey(target))) {
        const current = currentSurfaceDescendant(session, turn.assistant.seq)
        if (current?.type === 'assistant/message'
          && current.data?.message?.source?.kind === 'model'
          && current.data.message.id === turn.assistant.data.message.id
          && assistantText(current).trim().length > 0) {
          items.push({ kind: 'message', role: 'assistant', target, original: turn.assistant, current, message: current.data.message, turn })
        }
      }
    }
    if (turn.end.data.reason?.kind !== 'completed') {
      const target = { kind: 'turn', turn: start.data.turn }
      if (!deleted.has(rpMessageActionTargetKey(target))) {
        items.push({ kind: 'failed-turn', target, turn })
      }
    }
  }
  return items
}

function actionSummary(session, resolved, profile) {
  if (resolved.kind === 'opening') {
    return {
      target: resolved.target,
      turn: resolved.original.data.turn,
      role: 'assistant',
      content: typeof profile?.scene?.openingText === 'string'
        ? profile.scene.openingText
        : assistantText(resolved.current),
      canEdit: true,
      canDelete: false,
      canReroll: false,
      canSaveAndReroll: false,
      opening: true,
      forkSeq: resolved.original.seq,
      forkEditRequired: forkEditRequired(session, resolved),
      sharedAssetMutation: false,
      deleteIncludesSharedAssetMutation: false,
    }
  }
  const items = visibleRoleplayItems(session)
  const last = items.at(-1)
  const previous = items.at(-2)
  const failedTailBelongsToAssistant = resolved.kind === 'message'
    && resolved.role === 'assistant'
    && last?.kind === 'failed-turn'
    && last.turn.start.data.turn === resolved.turn.start.data.turn
    && rpMessageActionTargetKey(previous?.target ?? {}) === rpMessageActionTargetKey(resolved.target)
  const lastActionable = failedTailBelongsToAssistant ? previous : last
  const sameTurn = lastActionable?.turn?.start?.data?.turn === resolved.turn.start.data.turn
  const replayable = currentTurnUserMessages(session, resolved.turn).length > 0
    && currentTurnUserMessages(session, resolved.turn).every(message => (
      !unsupportedUserContent(message) && messageText(message.content).trim().length > 0
  ))
  const isLast = sameTurn
    && rpMessageActionTargetKey(lastActionable?.target ?? {}) === rpMessageActionTargetKey(resolved.target)
  const canReroll = isLast && replayable && !resolved.turn.sharedAssetMutation
  const lastUser = items.findLast(item => item.role === 'user')
  const isLastUser = resolved.kind === 'message'
    && resolved.role === 'user'
    && sameTurn
    && lastUser?.turn?.start?.data?.turn === resolved.turn.start.data.turn
    && rpMessageActionTargetKey(lastUser.target) === rpMessageActionTargetKey(resolved.target)
  const canSaveAndReroll = isLastUser && replayable && !resolved.turn.sharedAssetMutation
  if (resolved.kind === 'failed-turn') {
    return {
      target: resolved.target,
      turn: resolved.turn.start.data.turn,
      role: 'assistant',
      content: '',
      canEdit: false,
      canDelete: true,
      canReroll,
      canSaveAndReroll: false,
      failed: true,
      sharedAssetMutation: resolved.turn.sharedAssetMutation,
      deleteIncludesSharedAssetMutation: deletionIncludesSharedAssetMutation(session, resolved),
    }
  }
  return {
    target: resolved.target,
    turn: resolved.turn.start.data.turn,
    role: resolved.role,
    content: resolved.role === 'assistant' ? assistantText(resolved.current) : messageText(resolved.current.data.content),
    canEdit: true,
    canDelete: true,
    canReroll,
    canSaveAndReroll,
    forkSeq: resolved.turn.commit?.seq ?? resolved.original.seq,
    forkEditRequired: forkEditRequired(session, resolved),
    sharedAssetMutation: resolved.turn.sharedAssetMutation,
    deleteIncludesSharedAssetMutation: deletionIncludesSharedAssetMutation(session, resolved),
  }
}

/** Whether Host's completed-turn fork cut excludes this message's active edit carrier. */
function forkEditRequired(session, resolved) {
  if (resolved.current.seq === resolved.original.seq) return false
  const turn = resolved.kind === 'opening'
    ? resolved.original.data.turn
    : resolved.turn.start.data.turn
  const end = session.events.find(event => event?.type === 'turn/end' && event.data?.turn === turn)
  if (end === undefined) return false
  let cut = end.seq + 1
  while (cut < session.events.length && session.events[cut]?.type !== 'turn/start') cut++
  return resolved.current.seq >= cut
}

function deletionIncludesSharedAssetMutation(session, resolved) {
  return session.events.some(event => event.seq >= resolved.turn.start.seq
    && event?.type === 'tool/result'
    && successfulToolResult(event)
    && event.data?.meta?.kind === RP_ASSET_MUTATION_META_KIND)
}

function currentTurnUserMessages(session, turn) {
  const messages = []
  const seen = new Set()
  for (const original of turn.users) {
    const current = currentSurfaceDescendant(session, original.seq)
    if (current?.type !== 'user/message' || current.data?.source?.kind !== 'user') continue
    messages.push(current.data)
    seen.add(current.data.id)
  }
  for (const claimed of turn.claimedUsers) {
    if (seen.has(claimed.id)) continue
    messages.push(claimed)
    seen.add(claimed.id)
  }
  return messages
}

function claimedUserMessages(events, targetTurn) {
  const pending = { 'next-turn': [], 'next-step': [] }
  let openTurn
  const claimed = []
  for (const event of events) {
    if (event?.type === 'turn/start') {
      openTurn = event.data.turn
      continue
    }
    if (event?.type === 'turn/end') {
      if (openTurn === event.data.turn) openTurn = undefined
      continue
    }
    if (event?.type !== 'agent/inbox/spliced' || !objectLike(event.data)) continue
    const { target, start, inserted, outcome } = event.data
    const removedCount = event.data.removedCount ?? 0
    if ((target !== 'next-turn' && target !== 'next-step')
      || !Number.isSafeInteger(start)
      || !Number.isSafeInteger(removedCount)
      || !Array.isArray(inserted)) continue
    const removed = pending[target].splice(start, removedCount, ...inserted)
    if (openTurn !== targetTurn || outcome === 'canceled') continue
    claimed.push(...removed.filter(message => message?.source?.kind === 'user'))
  }
  return claimed
}

function appendOriginUserMessageIds(events) {
  const ids = new Set()
  for (const event of events) {
    if (event?.type === 'user/message'
      && event.surfaceOp === 'append'
      && event.data?.source?.kind === 'user'
      && typeof event.data.id === 'string') ids.add(event.data.id)
  }
  return ids
}

function pendingInboxMessageIds(events) {
  const pending = { 'next-turn': [], 'next-step': [] }
  for (const event of events) {
    if (event?.type !== 'agent/inbox/spliced') continue
    const target = event.data?.target
    const start = event.data?.start
    const removedCount = event.data?.removedCount ?? 0
    const inserted = event.data?.inserted
    if ((target !== 'next-turn' && target !== 'next-step')
      || !Number.isSafeInteger(start)
      || !Number.isSafeInteger(removedCount)
      || !Array.isArray(inserted)) continue
    pending[target].splice(start, removedCount, ...inserted)
  }
  return new Set([...pending['next-step'], ...pending['next-turn']]
    .flatMap(message => typeof message?.id === 'string' ? [message.id] : []))
}

function activeOpening(session, messageId) {
  for (let index = session.surface.nodes.length - 1; index >= 0; index -= 1) {
    const current = session.events[session.surface.nodes[index]]
    if (!isSelectedOpeningMessage(current) || current.data.message.id !== messageId) continue
    if (assistantText(current).trim().length === 0) return undefined
    const original = session.events.find(event => event?.surfaceOp === 'append'
      && isSelectedOpeningMessage(event)
      && event.data.message.id === messageId)
    if (original !== undefined) return { original, current }
  }
  return undefined
}

function firstTurnOutputSurfaceIndex(session, turn, laterItems) {
  const userSeqs = new Set(turn.users.flatMap(original => {
    const current = currentSurfaceDescendant(session, original.seq)
    return current === undefined ? [] : [current.seq]
  }))
  const own = session.surface.nodes.findIndex(seq => !userSeqs.has(seq)
    && surfaceDescendsFromRange(session.events, seq, turn.start.seq, turn.end.seq))
  return own >= 0 ? own : firstLaterSurfaceIndex(session, laterItems)
}

function firstLaterSurfaceIndex(session, items) {
  for (const item of items) {
    if (item.kind !== 'message') continue
    const index = session.surface.nodes.indexOf(item.current.seq)
    if (index >= 0) return index
  }
  return -1
}

function lastTurnStep(events) {
  return events.findLast(event => event?.type === 'step/start')?.data?.step
}

function assistantText(event) {
  return messageText(event?.data?.message?.content)
}

function messageText(content) {
  return Array.isArray(content)
    ? content
        .filter(block => block?.type === 'text' && typeof block.text === 'string')
        .map(block => block.text)
        .join('\n')
    : ''
}

/** A direct user message may be image-only; non-text blocks are still visible and actionable. */
function hasVisibleUserContent(content) {
  return Array.isArray(content) && content.some(block => block?.type === 'text'
    ? typeof block.text === 'string' && block.text.trim().length > 0
    : block !== null && typeof block === 'object')
}

function unsupportedUserContent(message) {
  return !Array.isArray(message?.content) || message.content.some(block => block?.type !== 'text')
}

function successfulToolResult(event) {
  return event.data?.error === undefined || event.data.error === null
}

async function resolveRoleplayAgent(ctx, sessionId) {
  const live = ctx.agents.get(sessionId)
  if (live !== undefined) {
    if (roleplayPreset(live.session) !== 'roleplay') throw coded('NOT_RP_SESSION', 'The selected session is not Roleplay.')
    return live
  }
  const provider = ctx.typert.lookups.get('agent')
  if (provider === undefined) throw coded('NOT_RP_SESSION', 'Agent lookup is unavailable.')
  let agent
  try {
    agent = await provider.resolve(sessionId)
  } catch (error) {
    throw coded('SESSION_NOT_FOUND', `Session ${sessionId} was not found.`, error)
  }
  if (roleplayPreset(agent.session) !== 'roleplay') {
    throw coded('NOT_RP_SESSION', 'The selected session is not Roleplay.')
  }
  return agent
}

function roleplayPreset(session) {
  let selected = session.header?.agentPreset
  for (const event of session.events ?? []) {
    if (event?.type === 'agent-preset/selected') selected = event.data?.agentPreset
  }
  return selected
}

function validateConfig(config) {
  if (!Number.isSafeInteger(config.maxNarrativeCharacters) || config.maxNarrativeCharacters < 1) {
    throw new Error('rp-message-actions: maxNarrativeCharacters must be positive')
  }
  if (!Number.isSafeInteger(config.maxUserMessageCharacters) || config.maxUserMessageCharacters < 1) {
    throw new Error('rp-message-actions: maxUserMessageCharacters must be positive')
  }
}

function messageActionTarget(value) {
  const target = object(value)
  if (target.kind === 'turn') {
    return { kind: 'turn', turn: nonNegativeInteger(target.turn, 'target.turn') }
  }
  if (target.kind !== 'message' || (target.role !== 'user' && target.role !== 'assistant')) {
    throw coded('INVALID_REQUEST', 'target must identify a user message, assistant message, or failed turn')
  }
  return {
    kind: 'message', role: target.role,
    messageId: requiredString(target.messageId, 'target.messageId'),
  }
}

function object(value) {
  if (!objectLike(value)) throw coded('INVALID_REQUEST', 'request payload must be an object')
  return value
}
function objectLike(value) { return typeof value === 'object' && value !== null && !Array.isArray(value) }
function requiredString(value, field) { if (typeof value !== 'string' || value.trim().length === 0) throw coded('INVALID_REQUEST', `${field} is required`); return value }
function editableContent(value) { if (typeof value !== 'string' || value.trim().length === 0) throw coded('INVALID_CONTENT', 'content must not be blank'); return value }
function nonNegativeInteger(value, field) { if (!Number.isSafeInteger(value) || value < 0) throw coded('INVALID_REQUEST', `${field} must be a non-negative integer`); return value }
function success(value) { return { ok: true, value } }
function failure(code, message) { return { ok: false, error: { code, message } } }
function transportSuccess(value) { return { ok: true, value } }
function coded(code, message, cause) { const error = new Error(message, { cause }); error.code = code; return error }
function codeFor(error) {
  return [
    'INVALID_REQUEST', 'INVALID_CONTENT', 'LIMIT_EXCEEDED', 'UNSUPPORTED_MESSAGE',
    'SESSION_RUNNING', 'SESSION_NOT_FOUND', 'NOT_RP_SESSION', 'MESSAGE_NOT_FOUND',
    'REROLL_UNAVAILABLE', 'SERVICE_UNAVAILABLE', 'MESSAGE_OPERATION_FAILED',
    'REVISION_CONFLICT', 'CARD_REQUIRED', 'PROFILE_TOO_LARGE', 'COMMAND_FAILED',
  ].includes(error?.code) ? error.code : 'MESSAGE_OPERATION_FAILED'
}
