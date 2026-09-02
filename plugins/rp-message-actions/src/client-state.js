import { isSelectedOpeningMessage } from 'dsh-roleplay-rp-session/protocol'
import { isRoleplaySessionSummary } from 'dsh-roleplay-rp-ui/session-summary'
import { decodeRpMessageActionEvent, rpMessageActionTargetKey } from './protocol.js'
import {
  RP_TURN_SURFACE_KEY,
  turnSurfaceCommitSeq,
  turnSurfaceEndReasonKind,
  turnSurfaceIsFailed,
  turnSurfaceIsRetired,
  turnSurfaceReply,
} from './turn-surface.js'

export {
  RP_TURN_SURFACE_KEY,
  startTurnSurface,
  turnSurfaceCommitAttempted,
  turnSurfaceCommitSeq,
  turnSurfaceEndCancelKind,
  turnSurfaceEndReasonKind,
  turnSurfaceIsCommitted,
  turnSurfaceIsFailed,
  turnSurfaceIsRetired,
  turnSurfaceMatch,
  turnSurfaceReply,
  updateTurnSurface,
} from './turn-surface.js'

/** Resolve the nested RPC envelope used by the Roleplay host plugins. */
export function messageActionValue(result) {
  if (!result?.ok) throw actionError('SERVICE_UNAVAILABLE')
  const domain = result.value
  if (!domain?.ok) throw actionError(domain?.error?.code ?? 'MESSAGE_OPERATION_FAILED')
  return domain.value
}

/** Translate stable domain codes into actionable product copy. */
export function messageActionError(reason) {
  const code = typeof reason?.code === 'string' ? reason.code : 'MESSAGE_OPERATION_FAILED'
  if (code === 'MESSAGE_NOT_FOUND') return '这条消息刚刚发生了变化，请关闭窗口后重新选择。'
  if (code === 'REROLL_UNAVAILABLE') return '只能重新生成当前对话中最后一条可恢复的消息。'
  if (code === 'SESSION_RUNNING') return '回复还在生成或收尾，请完成后再试。'
  if (code === 'UNSUPPORTED_MESSAGE') return '这条消息包含图片、附件或无法重放的内容，暂时不能重新生成。'
  if (code === 'INVALID_CONTENT') return '内容不能为空。'
  if (code === 'LIMIT_EXCEEDED') return '内容太长，请缩短后再保存。'
  if (code === 'NOT_RP_SESSION') return '这项操作只适用于角色扮演对话。'
  if (code === 'SESSION_NOT_FOUND') return '这个对话已经不可用，请返回列表后重新打开。'
  if (code === 'SERVICE_UNAVAILABLE') return '连接暂时不可用，请恢复连接后重试。'
  return '暂时无法完成这次更改，请稍后再试。'
}

export function actionError(code) {
  const error = new Error('roleplay message action failed')
  error.code = code
  return error
}

export function isRoleplaySession(listState, sessionId) {
  const summary = listState.byId?.[sessionId]
  return isRoleplaySessionSummary(summary) && summary.origin !== 'subagent'
}

/** Project one message toolbar entirely from the resident Conversation state. */
export function projectMessageActionDetail(snapshot, target, fallbackNode) {
  const nodes = conversationNodes(snapshot?.chat, fallbackNode)
  if (target?.kind === 'turn') return projectFailedTurnDetail(snapshot, nodes, target)
  const node = nodes.find(candidate => actionNodeTargetKey(candidate) === safeTargetKey(target))
    ?? nodes.find(candidate => failedAssistantTargetKey(candidate) === safeTargetKey(target))
  if (node === undefined || node.data?.deleted === true) return null
  if (node.kind === 'rp-floor-opening-actions') {
    return {
      target: node.data.target,
      turn: actionNodeTurn(node),
      role: 'assistant',
      content: node.data.text ?? '',
      canEdit: true,
      canDelete: false,
      canReroll: false,
      canSaveAndReroll: false,
      forkSeq: node.data.seq,
      opening: true,
      edited: node.data.edited === true,
      sharedAssetMutation: false,
      deleteIncludesSharedAssetMutation: false,
      sessionRunning: snapshot?.running === true,
    }
  }
  const turn = actionNodeTurn(node)
  if (!Number.isSafeInteger(turn)) return null
  const state = roleplayTurnState(nodes, turn)
  const sharedAssetMutation = state?.sharedAssetMutation === true
  const replayable = replayableTurn(nodes, turn)
  const currentTail = latestVisibleTurn(nodes) === turn
  const sessionRunning = snapshot?.running === true
  const nodeTargetKey = safeTargetKey(node.data?.target)
  const common = {
    target: node.data.target ?? target,
    turn,
    role: node.kind === 'rp-floor-user-actions' ? 'user' : 'assistant',
    content: node.data.text ?? turnSurfaceReply(state)?.text ?? '',
    canEdit: true,
    canDelete: true,
    canReroll: false,
    canSaveAndReroll: false,
    edited: node.data.edited === true || turnSurfaceReply(state)?.edited === true,
    failed: turnSurfaceIsFailed(state),
    failureKind: turnSurfaceEndReasonKind(state),
    sharedAssetMutation,
    deleteIncludesSharedAssetMutation: suffixHasSharedAssetMutation(nodes, turn),
    sessionRunning,
  }
  if (common.role === 'user') {
    return {
      ...common,
      canSaveAndReroll: currentTail
        && replayable
        && !sharedAssetMutation
        && nodeTargetKey === latestUserTargetKey(nodes, turn),
    }
  }
  return {
    ...common,
    canReroll: currentTail
      && replayable
      && !sharedAssetMutation
      && nodeTargetKey === safeTargetKey(turnSurfaceReply(state)?.target),
    forkSeq: turnSurfaceCommitSeq(state) ?? node.data.seq,
  }
}

function projectFailedTurnDetail(snapshot, nodes, target) {
  const node = nodes.find(candidate => candidate.kind === RP_TURN_SURFACE_KEY
    && candidate.data?.turn === target.turn)
  const state = node?.data ?? roleplayTurnState(nodes, target.turn)
  if (!turnSurfaceIsFailed(state) || turnSurfaceIsRetired(state)) return null
  const sessionRunning = snapshot?.running === true
  const replayable = replayableTurn(nodes, target.turn)
  const sharedAssetMutation = state.sharedAssetMutation === true
  return {
    target,
    turn: target.turn,
    role: 'assistant',
    content: '',
    canEdit: false,
    canDelete: true,
    canReroll: latestVisibleTurn(nodes) === target.turn
      && replayable
      && !sharedAssetMutation,
    canSaveAndReroll: false,
    edited: false,
    failed: true,
    failureKind: turnSurfaceEndReasonKind(state),
    sharedAssetMutation,
    deleteIncludesSharedAssetMutation: suffixHasSharedAssetMutation(nodes, target.turn),
    sessionRunning,
  }
}

function conversationNodes(chat, fallbackNode) {
  const nodes = Array.from(chat?.nodes?.values?.() ?? [])
  if (fallbackNode === undefined) return nodes
  const duplicate = nodes.some(node => node === fallbackNode
    || (node?.kind === fallbackNode.kind && node?.id === fallbackNode.id))
  return duplicate ? nodes : [...nodes, fallbackNode]
}

function safeTargetKey(target) {
  try {
    return rpMessageActionTargetKey(target)
  } catch {
    return undefined
  }
}

function actionNodeTargetKey(node) {
  if (!['rp-floor-user-actions', 'rp-floor-assistant-actions', 'rp-floor-opening-actions'].includes(node?.kind)) {
    return undefined
  }
  return safeTargetKey(node.data?.target)
}

function failedAssistantTargetKey(node) {
  return node?.kind === RP_TURN_SURFACE_KEY
    ? safeTargetKey(turnSurfaceReply(node.data)?.target)
    : undefined
}

function actionNodeTurn(node) {
  if (Number.isSafeInteger(node?.data?.turn)) return node.data.turn
  return node?.location?.kind === 'turn' || node?.location?.kind === 'step'
    ? node.location.turn.turn
    : undefined
}

function turnStateFromLocation(location) {
  if (location?.kind !== 'turn' && location?.kind !== 'step') return undefined
  return location.turn.data?.get?.(RP_TURN_SURFACE_KEY)
}

function roleplayTurnState(nodes, turn) {
  const failed = nodes.find(node => node?.kind === RP_TURN_SURFACE_KEY
    && node.data?.turn === turn)
  if (failed !== undefined) return failed.data
  for (const node of nodes) {
    if (actionNodeTurn(node) !== turn) continue
    const state = turnStateFromLocation(node.location)
    if (state !== undefined) return state
  }
  return undefined
}

function turnUserNodes(nodes, turn) {
  return nodes.filter(node => node?.kind === 'rp-floor-user-actions'
    && node.data?.deleted !== true
    && actionNodeTurn(node) === turn)
}

function replayableTurn(nodes, turn) {
  const users = turnUserNodes(nodes, turn)
  return users.length > 0 && users.every(node => node.data?.hasNonTextContent !== true
    && typeof node.data?.text === 'string'
    && node.data.text.trim().length > 0)
}

function latestUserTargetKey(nodes, turn) {
  let latest
  for (const node of turnUserNodes(nodes, turn)) {
    if (latest === undefined || (node.data?.seq ?? -1) >= (latest.data?.seq ?? -1)) latest = node
  }
  return safeTargetKey(latest?.data?.target)
}

function latestVisibleTurn(nodes) {
  const turns = []
  for (const node of nodes) {
    if (node?.kind === 'rp-floor-opening-actions' || node?.data?.deleted === true) continue
    if (node?.kind === 'rp-floor-user-actions' || node?.kind === 'rp-floor-assistant-actions') {
      const turn = actionNodeTurn(node)
      if (Number.isSafeInteger(turn)) turns.push(turn)
      continue
    }
    if (node?.kind === RP_TURN_SURFACE_KEY && turnSurfaceIsFailed(node.data)) {
      if (Number.isSafeInteger(node.data.turn)) turns.push(node.data.turn)
    }
  }
  return turns.length === 0 ? undefined : Math.max(...turns)
}

function suffixHasSharedAssetMutation(nodes, selectedTurn) {
  const turns = new Set(nodes.flatMap(node => {
    const turn = actionNodeTurn(node)
    return Number.isSafeInteger(turn) && turn >= selectedTurn ? [turn] : []
  }))
  for (const turn of turns) {
    if (roleplayTurnState(nodes, turn)?.sharedAssetMutation === true) return true
  }
  return false
}

/** Fold a native assistant edit/delete carrier into its original action row. */
export function updateAssistantActionState(state, event) {
  if (typeof event === 'string') return { ...state, text: event, deleted: false }
  const action = decodeRpMessageActionEvent(event)
  if (action?.operation === 'delete' || action?.operation === 'reroll') {
    return { ...state, deleted: true }
  }
  const text = assistantMessageText(event?.data?.message)
  return action?.operation === 'edit'
    ? { ...state, text, edited: true, deleted: false }
    : state
}

/** Match model replies and native Roleplay replacement carriers. */
export function assistantActionMatch(event) {
  if (event?.type !== 'assistant/message'
    || event.data?.message?.source?.kind !== 'model'
    || isSelectedOpeningMessage(event)) return null
  const action = decodeRpMessageActionEvent(event)
  if (action !== undefined) {
    const target = action.targets.find(candidate => candidate.kind === 'message' && candidate.role === 'assistant')
    return target === undefined ? null : { id: target.messageId, role: 'update' }
  }
  return event.surfaceOp === 'append' && assistantMessageText(event.data.message).trim().length > 0
    ? { id: String(event.data.message?.id ?? event.seq), role: 'start' }
    : null
}

/** Match the selected opening independently from ordinary model replies. */
export function openingActionMatch(event) {
  if (!isSelectedOpeningMessage(event)) return null
  const action = decodeRpMessageActionEvent(event)
  if (action !== undefined) {
    const target = action.targets.find(candidate => candidate.kind === 'message' && candidate.role === 'assistant')
    return target === undefined ? null : { id: target.messageId, role: 'update' }
  }
  return event.surfaceOp === 'append'
    ? { id: String(event.data.message?.id ?? event.seq), role: 'start' }
    : null
}

export function selectFailedAssistant(owner) {
  const state = owner?.turn?.data?.get?.(RP_TURN_SURFACE_KEY)
  if (!turnSurfaceIsFailed(state) || turnSurfaceIsRetired(state)) return null
  const reply = turnSurfaceReply(state)
  const hasAssistant = reply?.target?.kind === 'message'
    && reply.target.role === 'assistant'
    && typeof reply.target.messageId === 'string'
    && typeof reply.text === 'string'
    && reply.text.trim().length > 0
  return {
    turn: owner.turn,
    state,
    target: hasAssistant
      ? reply.target
      : { kind: 'turn', turn: state.turn },
    copyText: hasAssistant ? reply.text : '',
    canEdit: hasAssistant,
    edited: hasAssistant && reply.edited === true,
    messageTime: hasAssistant ? reply.time : undefined,
    nativeStatusVisible: turnSurfaceEndReasonKind(state) === 'max-tokens'
      || (['aborted', 'interrupted'].includes(turnSurfaceEndReasonKind(state))
        && nativeInterruptedAssistantVisible(owner.turn, state)),
  }
}

function nativeInterruptedAssistantVisible(turn, state) {
  if (turnSurfaceReply(state)?.interrupted === true) return true
  return Array.isArray(turn?.steps) && turn.steps.some(step => (
    step?.data?.get?.('assistant-step')?.status === 'interrupted'
  ))
}

/** Select the recovery controls needed when a failed turn has no durable reply. */
export function selectFailedTurnRecovery(owner) {
  const selected = selectFailedAssistant(owner)
  return selected?.target?.kind === 'turn' ? selected : null
}

function assistantMessageText(message) {
  return Array.isArray(message?.content)
    ? message.content.filter(part => part?.type === 'text' && typeof part.text === 'string').map(part => part.text).join('')
    : ''
}
