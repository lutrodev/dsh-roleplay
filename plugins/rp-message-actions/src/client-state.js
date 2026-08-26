import { isSelectedOpeningMessage } from 'dsh-roleplay-rp-session/protocol'
import { decodeRpMessageActionEvent, rpMessageActionTargetKey } from './protocol.js'

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
  return summary?.agentPreset === 'roleplay' && summary.origin !== 'subagent'
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
    content: node.data.text ?? state?.finalAssistantText ?? '',
    canEdit: true,
    canDelete: true,
    canReroll: false,
    canSaveAndReroll: false,
    edited: node.data.edited === true || state?.finalAssistantEdited === true,
    failed: state?.failed === true,
    failureKind: state?.endReasonKind,
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
      && nodeTargetKey === safeTargetKey(state?.finalAssistantTarget),
    forkSeq: Number.isSafeInteger(state?.commitSeq) ? state.commitSeq : node.data.seq,
  }
}

function projectFailedTurnDetail(snapshot, nodes, target) {
  const node = nodes.find(candidate => candidate.kind === 'rp-floor-failed-assistant'
    && candidate.data?.turn === target.turn)
  const state = node?.data ?? roleplayTurnState(nodes, target.turn)
  if (state?.failed !== true || state.deleted === true) return null
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
    failureKind: state.endReasonKind,
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
  return node?.kind === 'rp-floor-failed-assistant'
    ? safeTargetKey(node.data?.finalAssistantTarget)
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
  return location.turn.data?.get?.('rp-floor-failed-assistant')
    ?? location.turn.data?.get?.('rp-message-failed-assistant')
}

function roleplayTurnState(nodes, turn) {
  const failed = nodes.find(node => node?.kind === 'rp-floor-failed-assistant'
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
    if (node?.kind === 'rp-floor-failed-assistant' && node.data?.failed === true) {
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
  if (typeof event === 'string') return { ...state, text: event, deleted: event.trim().length === 0 }
  const action = decodeRpMessageActionEvent(event)
  if (action?.operation === 'delete' || action?.operation === 'reroll') {
    return { ...state, deleted: true }
  }
  const text = assistantMessageText(event?.data?.message)
  return action?.operation === 'edit'
    ? { ...state, text, edited: true, deleted: false }
    : { ...state, text, deleted: text.trim().length === 0 }
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
  return { id: String(event.data.message?.id ?? event.seq), role: 'start' }
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

/** Match events that determine whether a completed turn owns a failed reply. */
export function failedAssistantMatch(event) {
  if (event?.type === 'turn/start') return { id: String(event.data.turn), role: 'start' }
  if (event?.type === 'turn/end') return { id: String(event.data.turn), role: 'update' }
  if (event?.type === 'tool/result' && ['rp-agent/turn-commit', 'rp-agent/asset-mutation'].includes(event.data?.meta?.kind)) {
    return { id: String(event.data?.meta?.turn ?? event.data.turn), role: 'update' }
  }
  if (event?.type === 'assistant/message' && Number.isSafeInteger(event.data?.turn)) {
    const action = decodeRpMessageActionEvent(event)
    const failed = action?.targets?.find(target => target.kind === 'turn')
    return { id: String(failed?.turn ?? event.data.turn), role: 'update' }
  }
  return null
}

export function failedAssistantStart(event) {
  return {
    turn: event.data.turn,
    failed: false,
    deleted: false,
    committed: false,
    commitAttempted: false,
    commitSeq: undefined,
    finalAssistantSeq: undefined,
    finalAssistantTarget: undefined,
    finalAssistantText: '',
    finalAssistantTime: undefined,
    finalAssistantEdited: false,
    finalAssistantInterrupted: false,
    finalAssistantOwnsCommit: false,
    hostOpeningSeq: undefined,
    sharedAssetMutation: false,
    endReasonKind: undefined,
    endCancelKind: undefined,
  }
}

export function failedAssistantUpdate(state, event) {
  if (isSelectedOpeningMessage(event)) return { ...state, hostOpeningSeq: event.seq }
  const action = decodeRpMessageActionEvent(event)
  if ((action?.operation === 'delete' || action?.operation === 'reroll')
    && action.targets.some(target => target.kind === 'turn' && target.turn === state.turn)) {
    return { ...state, deleted: true }
  }
  const editedAssistant = action?.operation === 'edit'
    ? action.targets.find(target => target.kind === 'message'
      && target.role === 'assistant'
      && target.messageId === state.finalAssistantTarget?.messageId)
    : undefined
  if (editedAssistant !== undefined) {
    return {
      ...state,
      finalAssistantText: assistantMessageText(event.data?.message),
      finalAssistantEdited: true,
    }
  }
  if (event.type === 'assistant/message'
    && event.surfaceOp === 'append'
    && event.data?.message?.source?.kind === 'model') {
    const text = assistantMessageText(event.data.message)
    const ownsCommit = assistantCallsTool(event.data.message, 'rp_commit_turn')
    if (text.trim().length === 0) {
      return ownsCommit ? {
        ...state,
        commitAttempted: true,
        // A tool-only commit belongs to the readable prose already emitted in
        // this turn, so protect that prose from later acknowledgement rows.
        finalAssistantOwnsCommit: Number.isSafeInteger(state.finalAssistantSeq)
          || state.finalAssistantOwnsCommit === true,
      } : state
    }
    // Once prose has crossed the atomic commit boundary, a later placeholder
    // or acknowledgement must not replace it as the recoverable failed reply.
    if (state.finalAssistantOwnsCommit === true && !ownsCommit) return state
    return {
      ...state,
      commitAttempted: state.commitAttempted === true || ownsCommit,
      finalAssistantSeq: event.seq,
      finalAssistantTarget: {
        kind: 'message',
        role: 'assistant',
        messageId: event.data.message.id,
        turn: event.data.turn,
        step: event.data.step,
      },
      finalAssistantText: text,
      finalAssistantTime: event.time,
      finalAssistantEdited: false,
      finalAssistantInterrupted: event.data.interrupted === true,
      finalAssistantOwnsCommit: ownsCommit,
    }
  }
  if (event.type === 'tool/result'
    && event.surfaceOp === 'append'
    && event.data?.meta?.kind === 'rp-agent/asset-mutation') {
    return { ...state, sharedAssetMutation: true }
  }
  if (event.type === 'tool/result'
    && event.surfaceOp === 'append'
    && event.data?.meta?.kind === 'rp-agent/turn-commit') {
    return {
      ...state,
      committed: true,
      commitAttempted: true,
      commitSeq: event.seq,
      failed: false,
      finalAssistantSeq: event.data.meta.assistant?.seq ?? state.finalAssistantSeq,
      finalAssistantOwnsCommit: true,
    }
  }
  if (event.type === 'turn/end') {
    return {
      ...state,
      failed: !state.committed && (state.commitAttempted === true || event.data.reason?.kind !== 'completed'),
      endReasonKind: event.data.reason?.kind,
      endCancelKind: event.data.reason?.kind === 'aborted'
        ? event.data.reason.reason?.kind
        : undefined,
      seq: event.seq,
    }
  }
  return state
}

export function selectFailedAssistant(owner) {
  const state = owner?.turn?.data?.get?.('rp-floor-failed-assistant')
    ?? owner?.turn?.data?.get?.('rp-message-failed-assistant')
  if (state?.failed !== true || state.deleted === true) return null
  const hasAssistant = state.finalAssistantTarget?.kind === 'message'
    && state.finalAssistantTarget.role === 'assistant'
    && typeof state.finalAssistantTarget.messageId === 'string'
    && typeof state.finalAssistantText === 'string'
    && state.finalAssistantText.trim().length > 0
  return {
    turn: owner.turn,
    state,
    target: hasAssistant
      ? state.finalAssistantTarget
      : { kind: 'turn', turn: state.turn },
    copyText: hasAssistant ? state.finalAssistantText : '',
    canEdit: hasAssistant,
    edited: hasAssistant && state.finalAssistantEdited === true,
    messageTime: hasAssistant ? state.finalAssistantTime : undefined,
    nativeStatusVisible: state.endReasonKind === 'max-tokens'
      || (['aborted', 'interrupted'].includes(state.endReasonKind)
        && nativeInterruptedAssistantVisible(owner.turn, state)),
  }
}

function nativeInterruptedAssistantVisible(turn, state) {
  if (state.finalAssistantInterrupted === true) return true
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

function assistantCallsTool(message, name) {
  return Array.isArray(message?.content)
    && message.content.some(part => part?.type === 'tool-call' && part.name === name)
}
