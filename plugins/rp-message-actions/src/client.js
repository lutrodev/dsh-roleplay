import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { LazyMotion, MotionConfig, domAnimation, m } from 'motion/react'
import {
  Button,
  IconBranchOutline16,
  IconCheckOutline16,
  IconCopyOutline16,
  IconEditOutline16,
  IconRefreshOutline16,
  IconTrashOutline16,
  MarkdownText,
  MessageText,
  Modal,
  StateDot,
  Tooltip,
  writeClipboard,
} from '@deepseek-ai/dsh-client-ui-primitives'
import {
  actionError,
  assistantActionMatch,
  failedAssistantMatch,
  failedAssistantStart,
  failedAssistantUpdate,
  isRoleplaySession,
  messageActionError,
  messageActionValue,
  openingActionMatch,
  projectMessageActionDetail,
  selectFailedAssistant,
  updateAssistantActionState,
} from './client-state.js'
import { decodeRpMessageActionEvent, rpMessageActionTargetKey } from './protocol.js'
import { css, ensureStyles } from './client-styles.generated.js'

export const inject = ['slots', 'conversationEvents', 'connection', 'sessions']
const h = React.createElement
const motionTransition = { duration: 0.16, ease: [0.2, 0, 0, 1] }
const INLINE_EDITOR_LINE_HEIGHT = 24
const INLINE_EDITOR_MIN_HEIGHT = INLINE_EDITOR_LINE_HEIGHT * 3
const INLINE_EDITOR_MAX_HEIGHT = INLINE_EDITOR_LINE_HEIGHT * 6
const actionGestures = {
  whileTap: { scale: 0.96 },
  whileFocus: { boxShadow: '0 0 0 2px var(--dsw-alias-brand-primary)' },
  transition: motionTransition,
}

export const userFloorNodeDefinition = {
  kind: 'rp-floor-user-actions',
  target: 'chat',
  match: userActionMatch,
  start: (_context, match) => ({
    seq: match.event.seq,
    turn: turnNumber(match.location),
    time: match.event.time,
    text: messageText(match.event.data?.content),
    hadText: messageText(match.event.data?.content) !== '',
    hasNonTextContent: hasNonTextContent(match.event.data?.content),
    target: { kind: 'message', role: 'user', messageId: userMessageId(match.event) },
    edited: false,
    deleted: false,
  }),
  update: (context, match) => updateUserActionState(context.state, match.event),
  buildViewNode: context => context.state?.turn === undefined ? null : ({
    key: context.key,
    kind: 'rp-floor-user-actions',
    id: context.id,
    target: 'chat',
    anchorSeq: context.state.seq + 0.05,
    location: context.start?.location ?? { kind: 'unresolved' },
    visibility: 'visible',
    data: context.state,
  }),
}

export const assistantFloorNodeDefinition = {
  kind: 'rp-floor-assistant-actions',
  target: 'chat',
  match: assistantActionMatch,
  start: (_context, match) => ({
    seq: match.event.seq,
    turn: match.event.data.turn,
    time: match.event.time,
    text: messageText(match.event.data.message?.content),
    target: {
      kind: 'message', role: 'assistant', messageId: match.event.data.message.id,
      turn: match.event.data.turn, step: match.event.data.step,
    },
    edited: false,
    deleted: messageText(match.event.data.message?.content).trim().length === 0,
  }),
  update: (context, match) => updateAssistantActionState(context.state, match.event),
  buildViewNode: context => !Number.isSafeInteger(context.state?.turn) ? null : ({
    key: context.key,
    kind: 'rp-floor-assistant-actions',
    id: context.id,
    target: 'chat',
    anchorSeq: context.state.seq + 0.05,
    location: context.start?.location ?? { kind: 'unresolved' },
    visibility: 'visible',
    data: context.state,
  }),
}

export const openingFloorNodeDefinition = {
  kind: 'rp-floor-opening-actions',
  target: 'chat',
  match: openingActionMatch,
  start: (_context, match) => ({
    seq: match.event.seq,
    turn: match.event.data.turn,
    time: match.event.time,
    text: messageText(match.event.data.message?.content),
    target: {
      kind: 'message', role: 'assistant', messageId: match.event.data.message.id,
      turn: match.event.data.turn, step: match.event.data.step,
    },
    edited: false,
    deleted: false,
  }),
  update: (context, match) => updateAssistantActionState(context.state, match.event),
  buildViewNode: context => !Number.isSafeInteger(context.state?.turn) ? null : ({
    key: context.key,
    kind: 'rp-floor-opening-actions',
    id: context.id,
    target: 'chat',
    anchorSeq: context.state.seq + 0.05,
    location: context.start?.location ?? { kind: 'unresolved' },
    visibility: 'visible',
    data: context.state,
  }),
}

export const suffixActionNodeDefinition = {
  kind: 'rp-message-suffix-action',
  target: 'chat',
  match: event => {
    const action = decodeRpMessageActionEvent(event)
    return openingActionMatch(event) === null
      && (action?.operation === 'delete' || action?.operation === 'reroll')
      ? { id: String(event.seq), role: 'start' }
      : null
  },
  start: (_context, match) => ({
    seq: match.event.seq,
    action: decodeRpMessageActionEvent(match.event),
    replacementStart: match.event.surfaceOp?.op === 'replace'
      && Number.isSafeInteger(match.event.surfaceOp.start)
      ? match.event.surfaceOp.start
      : undefined,
  }),
  update: context => context.state,
  buildViewNode: context => context.state?.action === undefined ? null : ({
    key: context.key,
    kind: 'rp-message-suffix-action',
    id: context.id,
    target: 'chat',
    anchorSeq: context.state.seq + 0.09,
    location: context.start?.location ?? { kind: 'unresolved' },
    visibility: 'visible',
    data: context.state,
  }),
}

const RP_COMMIT_TOOL = 'rp_commit_turn'

export const failedAssistantNodeDefinition = {
  kind: 'rp-floor-failed-assistant',
  target: 'chat',
  match: failedAssistantMatch,
  start: (_context, match) => ({
    ...failedAssistantStart(match.event),
    target: { kind: 'turn', turn: match.event.data.turn },
  }),
  update: (context, match) => failedAssistantUpdate(context.state, match.event),
  buildLocationData: (context, scope) => scope !== 'turn' || context.state === undefined ? null : ({
    kind: 'turn',
    turn: context.state.turn,
    key: 'rp-floor-failed-assistant',
    value: context.state,
  }),
  buildViewNode: context => context.state?.failed !== true && context.state?.deleted !== true ? null : ({
    key: context.key,
    kind: 'rp-floor-failed-assistant',
    id: context.id,
    target: 'chat',
    anchorSeq: (context.state.seq ?? context.start?.event.seq ?? 0) + 0.05,
    location: context.start?.location ?? { kind: 'unresolved' },
    visibility: 'visible',
    data: context.state,
  }),
}

export function apply(ctx) {
  ctx.effect(ensureStyles)
  ctx.conversationEvents.register(userFloorNodeDefinition)
  ctx.conversationEvents.register(assistantFloorNodeDefinition)
  ctx.conversationEvents.register(openingFloorNodeDefinition)
  ctx.conversationEvents.register(failedAssistantNodeDefinition)
  ctx.conversationEvents.register(suffixActionNodeDefinition)
  const injectFloorUi = () => ({ connection: ctx.connection, sessions: ctx.sessions })
  ctx.slots.inject('conversation.chat.node', () => ctx.slots.register({
    name: 'conversation.chat.node',
    key: 'rp-floor-user-actions',
    inject: injectFloorUi,
  }, UserFloorActions))
  ctx.slots.inject('conversation.chat.node', () => ctx.slots.register({
    name: 'conversation.chat.node',
    key: 'rp-floor-assistant-actions',
    inject: injectFloorUi,
  }, AssistantFloorEffects))
  ctx.slots.inject('conversation.chat.node', () => ctx.slots.register({
    name: 'conversation.chat.node',
    key: 'rp-floor-opening-actions',
    inject: injectFloorUi,
  }, OpeningFloorEffects))
  ctx.slots.inject('conversation.chat.node', () => ctx.slots.register({
    name: 'conversation.chat.node',
    key: 'rp-floor-failed-assistant',
    inject: injectFloorUi,
  }, FailedAssistantEffects))
  ctx.slots.inject('conversation.chat.node', () => ctx.slots.register({
    name: 'conversation.chat.node',
    key: 'rp-message-suffix-action',
  }, SuffixActionEffect))
  ctx.slots.inject('conversation.chat.assistant-actions', () => ctx.slots.register({
    name: 'conversation.chat.assistant-actions',
    id: 'rp-message-actions',
    order: 20,
    inject: injectFloorUi,
  }, AssistantMessageActions))
  ctx.slots.inject('tool.call.toolview', () => ctx.slots.register({
    name: 'tool.call.toolview',
    key: RP_COMMIT_TOOL,
  }, RoleplayCommitToolView))
  ctx.slots.inject('conversation.chat.turnTail', () => ctx.slots.register({
    name: 'conversation.chat.turnTail',
    select: selectFailedAssistant,
    inject: injectFloorUi,
  }, FailedTurnRecoveryActions))
}

/**
 * Keep the internal transaction lifecycle out of the ordinary transcript.
 * A failed final commit remains visible in product language; once a later
 * retry succeeds, its effect hides every commit attempt from the same Turn.
 */
function RoleplayCommitToolView({ block }) {
  if (!('kind' in block)) {
    return h('span', {
      className: css.commitToolMarker,
      hidden: true,
      'aria-hidden': true,
      'data-rp-commit-tool-status': 'running',
    })
  }
  if (block.isError !== true) return h(SuccessfulCommitEffect)
  return h('div', {
    className: css.commitFailure,
    role: 'alert',
    'data-rp-commit-tool-status': 'failed',
  },
  h('strong', null, '回复未能完成保存'),
  h('span', null, '正文仍会保留，但本次会话变量变化没有生效。请重新生成这条回复。'))
}

function SuccessfulCommitEffect() {
  const ref = useRef(null)
  useLayoutEffect(() => {
    const host = ref.current?.closest('[data-chat-flow-kind="tool-call"]')
    if (!(host instanceof HTMLElement)) return undefined
    const hidden = successfulCommitRows(host)
    for (const row of hidden) row.setAttribute('data-rp-message-actions-hidden-commit', '')
    return () => {
      for (const row of hidden) row.removeAttribute('data-rp-message-actions-hidden-commit')
    }
  }, [])
  return h('span', {
    ref,
    className: css.commitToolMarker,
    hidden: true,
    'aria-hidden': true,
    'data-rp-commit-tool-status': 'succeeded',
  })
}

/** Return only rp_commit_turn rows at or before one successful attempt. */
export function successfulCommitRows(host) {
  const rows = []
  for (let row = host; row !== null; row = row.previousElementSibling) {
    const kind = row.dataset?.chatFlowKind
    if (kind === 'user' || kind === 'steering') break
    if (kind === 'tool-call' && row.querySelector?.('[data-rp-commit-tool-status]') !== null) rows.push(row)
  }
  return rows
}

function userActionMatch(event) {
  const action = decodeRpMessageActionEvent(event)
  const target = action?.targets.find(candidate => candidate.kind === 'message' && candidate.role === 'user')
  if (target !== undefined) return { id: String(target.messageId), role: 'update' }
  return event?.type === 'user/message'
    && event.surfaceOp === 'append'
    && event.data?.source?.kind === 'user'
    ? { id: userMessageId(event), role: 'start' }
    : null
}

function userMessageId(event) {
  return String(event.data?.id ?? event.seq)
}

function updateUserActionState(state, event) {
  const action = decodeRpMessageActionEvent(event)
  if (action !== undefined) {
    return action.operation === 'edit'
      ? { ...state, text: messageText(event.data?.content), edited: true, deleted: false }
      : { ...state, deleted: true }
  }
  return state
}

function turnNumber(location) {
  return location.kind === 'turn' || location.kind === 'step' ? location.turn.turn : undefined
}

function messageText(content) {
  return Array.isArray(content)
    ? content.filter(part => part?.type === 'text' && typeof part.text === 'string').map(part => part.text).join('')
    : ''
}

function hasNonTextContent(content) {
  return Array.isArray(content) && content.some(part => part?.type !== 'text')
}

function UserFloorActions(props) {
  const roleplay = props.useSessions(state => isRoleplaySession(state, props.sessionId))
  const detail = props.useSession(snapshot => projectMessageActionDetail(
    snapshot,
    props.node.data.target,
    props.node,
  ))
  if (!roleplay) return h(InactiveActionNodeMarker)
  if (props.node.data.deleted === true) return h(DeletedUserTraceMarker, { target: props.node.data.target })
  const location = props.node.location
  const closed = (location.kind === 'turn' || location.kind === 'step') && location.turn.status === 'closed'
  return closed ? h(FloorActions, {
    ...props,
    turn: location.turn,
    surface: 'user',
    target: props.node.data.target,
    edited: props.node.data.edited === true,
    copyText: props.node.data.text,
    userHadText: props.node.data.hadText === true,
    userHasNonTextContent: props.node.data.hasNonTextContent === true,
    messageTime: props.node.data.time,
    detail,
  }) : h(InactiveActionNodeMarker)
}

function AssistantFloorEffects(props) {
  const roleplay = props.useSessions(state => isRoleplaySession(state, props.sessionId))
  if (!roleplay) return h(InactiveActionNodeMarker)
  if (props.node.data.deleted === true) return h(DeletedAssistantTraceMarker, { target: props.node.data.target })
  if (!isCanonicalAssistantAction(props.node)) return h(InactiveActionNodeMarker)
  return h(React.Fragment, null,
    h(AssistantEffectNodeMarker),
    h(SettledAssistantTraceEffect),
    props.node.data.edited === true
      ? h(EditedMessagePortal, { surface: 'assistant', text: props.node.data.text })
      : null)
}

function OpeningFloorEffects(props) {
  const roleplay = props.useSessions(state => isRoleplaySession(state, props.sessionId))
  const location = props.node.location
  const closed = (location.kind === 'turn' || location.kind === 'step') && location.turn.status === 'closed'
  if (!roleplay || !closed) return h(InactiveActionNodeMarker)
  if (props.node.data.deleted === true) {
    return h(DeletedOpeningTraceMarker, { target: props.node.data.target })
  }
  return h(React.Fragment, null,
    h(AssistantEffectNodeMarker),
    h(SettledAssistantTraceEffect),
    props.node.data.edited === true
      ? h(EditedMessagePortal, { surface: 'assistant', text: props.node.data.text })
      : null)
}

/** Only the final prose event of a successfully settled turn owns reply actions. */
export function isCanonicalAssistantAction(node) {
  const location = node?.location
  if ((location?.kind !== 'turn' && location?.kind !== 'step') || location.turn.status !== 'closed') return false
  const state = location.turn.data?.get?.('rp-floor-failed-assistant')
    ?? location.turn.data?.get?.('rp-message-failed-assistant')
  return state?.failed !== true
    && Number.isSafeInteger(state?.finalAssistantSeq)
    && state.finalAssistantSeq === node.data?.seq
}

function InactiveActionNodeMarker() {
  return h('span', { className: css.inactiveActionNodeMarker, hidden: true, 'aria-hidden': true })
}

function AssistantEffectNodeMarker() {
  return h('span', { className: css.assistantEffectNodeMarker, hidden: true, 'aria-hidden': true })
}

function AssistantMessageActions(props) {
  const roleplay = props.useSessions(state => isRoleplaySession(state, props.sessionId))
  const target = { kind: 'message', role: 'assistant', messageId: props.messageId }
  const detail = props.useSession(snapshot => projectMessageActionDetail(snapshot, target))
  if (!roleplay || detail === null) return null
  return h(FloorActions, {
    ...props,
    turn: { turn: detail.turn },
    target,
    surface: 'assistant',
    nativeAssistant: true,
    edited: detail.edited === true,
    detail,
  })
}

function FailedTurnRecoveryActions(props) {
  const roleplay = props.useSessions(state => isRoleplaySession(state, props.sessionId))
  const fallbackNode = {
    kind: 'rp-floor-failed-assistant',
    id: String(props.matched.state.turn),
    location: { kind: 'turn', turn: props.matched.turn },
    data: { ...props.matched.state, target: props.matched.target },
  }
  const detail = props.useSession(snapshot => projectMessageActionDetail(
    snapshot,
    props.matched.target,
    fallbackNode,
  ))
  if (!roleplay || detail === null) return null
  const status = failedTurnStatus(props.matched, detail)
  if (props.matched.target.kind === 'message') {
    return status === null ? null : h(FailedTurnStatus, { status })
  }
  return h(FloorActions, {
    ...props,
    turn: props.matched.turn,
    target: props.matched.target,
    surface: 'assistant',
    canEdit: false,
    failedAssistant: true,
    failureStatus: status,
    detail,
  })
}

/** Prefer DSH's visible interruption and length-limit states; translate the remaining terminal outcomes. */
export function failedTurnStatus(matched, detail) {
  const kind = matched.state?.endReasonKind
  if (kind === 'max-tokens' || matched.nativeStatusVisible === true) return null
  const hasPartial = matched.target?.kind === 'message'
  const recoveryMessage = (base, retryable) => {
    if (detail?.sharedAssetMutation === true) {
      return `${base}本次已修改共享资料，不能直接重新生成。`
    }
    return detail?.canReroll === true ? retryable : `${base}你可以继续发送消息。`
  }
  if (kind === 'error') {
    return {
      state: 'error',
      title: '回复生成失败',
      message: hasPartial
        ? recoveryMessage('已生成的内容可能不完整。', '已生成的内容可能不完整。')
        : recoveryMessage('没有生成可用内容。', '没有生成可用内容，可以重新尝试。'),
    }
  }
  if (kind === 'aborted' && matched.state?.endCancelKind === 'user') {
    return {
      state: 'warning',
      title: '已停止生成',
      message: recoveryMessage('没有生成新的回复。', '没有生成新的回复，可以重新尝试。'),
    }
  }
  if (kind === 'blocked') {
    return {
      state: 'warning',
      title: hasPartial ? '回复未能完成' : '回复未能开始',
      message: hasPartial
        ? recoveryMessage('已生成的内容可能不完整。', '已生成的内容可能不完整。')
        : recoveryMessage('没有生成新的回复。', '没有生成新的回复，可以重新尝试。'),
    }
  }
  return {
    state: 'warning',
    title: '回复已中断',
    message: hasPartial
      ? recoveryMessage('已生成的内容可能不完整。', '已生成的内容可能不完整。')
      : recoveryMessage('没有生成可用内容。', '没有生成可用内容，可以重新尝试。'),
  }
}

function FailedTurnStatus({ status }) {
  return h(MotionConfig, { reducedMotion: 'user', transition: motionTransition },
    h(LazyMotion, { features: domAnimation, strict: true },
      h(FailedTurnStatusRow, { status })))
}

function FailedTurnStatusRow({ status, pending = false, actions = null }) {
  const current = pending
    ? { state: 'ongoing', title: '正在重新生成…', message: '正在使用刚才的消息重新生成回复。' }
    : status
  return h(m.div, {
    className: css.failedTurnStatus,
    role: 'status',
    initial: { opacity: 0, y: -4 },
    animate: { opacity: 1, y: 0 },
    transition: motionTransition,
  },
  h(StateDot, { state: current.state, className: css.failedTurnStatusDot }),
  h('div', { className: css.failedTurnStatusCopy },
    h('strong', { 'data-tone': current.state }, current.title),
    h('span', null, current.message)),
  actions)
}

function FailedAssistantEffects(props) {
  const roleplay = props.useSessions(state => isRoleplaySession(state, props.sessionId))
  if (!roleplay) return h(InactiveActionNodeMarker)
  if (props.node.data.deleted === true) {
    return h(DeletedAssistantTraceMarker, { target: props.node.data.target })
  }
  return h(React.Fragment, null,
    h(AssistantEffectNodeMarker),
    h(FailedAssistantTraceEffect, { endReasonKind: props.node.data.endReasonKind }),
    props.node.data.finalAssistantEdited === true
      ? h(EditedMessagePortal, { surface: 'assistant', text: props.node.data.finalAssistantText })
      : null)
}

function SettledAssistantTraceEffect() {
  const ref = useRef(null)
  useLayoutEffect(() => {
    const host = ref.current?.closest('[data-chat-flow-kind="rp-floor-assistant-actions"], [data-chat-flow-kind="rp-floor-opening-actions"]')
    if (!(host instanceof HTMLElement)) return undefined
    const hidden = settledAssistantTraceRows(host)
    for (const row of hidden) row.setAttribute('data-rp-message-actions-hidden-trace', '')
    return () => {
      for (const row of hidden) row.removeAttribute('data-rp-message-actions-hidden-trace')
    }
  }, [])
  return h('span', { ref, className: css.traceEffectAnchor, hidden: true, 'aria-hidden': true })
}

function FailedAssistantTraceEffect({ endReasonKind }) {
  const ref = useRef(null)
  useLayoutEffect(() => {
    const host = ref.current?.closest('[data-chat-flow-kind="rp-floor-failed-assistant"]')
    if (!(host instanceof HTMLElement)) return undefined
    const hidden = failedAssistantTraceRows(host, endReasonKind)
    for (const row of hidden) row.setAttribute('data-rp-message-actions-hidden-trace', '')
    return () => {
      for (const row of hidden) row.removeAttribute('data-rp-message-actions-hidden-trace')
    }
  }, [endReasonKind])
  return h('span', { ref, className: css.traceEffectAnchor, hidden: true, 'aria-hidden': true })
}

export function settledAssistantTraceRows(host) {
  const hidden = []
  let keptClosing = false
  for (let row = host?.previousElementSibling ?? null; row !== null; row = row.previousElementSibling) {
    const kind = row.dataset?.chatFlowKind
    if (kind === 'user' || kind === 'steering') break
    if (kind === 'assistant-step' && !keptClosing) {
      keptClosing = true
      continue
    }
    if (kind === 'rp-message-avatar-assistant'
      || kind === 'rp-message-avatar-opening'
      || kind === 'rp-message-avatar-user'
      || kind === 'rp-floor-user-actions') continue
    hidden.push(row)
  }
  return hidden
}

function DeletedOpeningTraceMarker({ target }) {
  const ref = useRef(null)
  useLayoutEffect(() => {
    const host = ref.current?.closest('[data-chat-flow-kind="rp-floor-opening-actions"]')
    if (!(host instanceof HTMLElement)) return undefined
    const message = messageRowForAction(host, 'assistant')
    const tail = settledTurnTailRow(host)
    message?.setAttribute('data-rp-message-actions-hidden-opening', '')
    tail?.setAttribute('data-rp-message-actions-hidden-opening', '')
    return () => {
      message?.removeAttribute('data-rp-message-actions-hidden-opening')
      tail?.removeAttribute('data-rp-message-actions-hidden-opening')
    }
  }, [])
  return h('span', {
    ref,
    className: css.deletedOpeningMarker,
    hidden: true,
    'aria-hidden': true,
    'data-rp-message-action-key': rpMessageActionTargetKey(target),
  })
}

/** Locate the same turn's native footer when an opening replacement must hide it. */
export function settledTurnTailRow(host) {
  for (let row = host?.nextElementSibling ?? null; row !== null; row = row.nextElementSibling) {
    const kind = row.dataset?.chatFlowKind
    if (kind === 'turn-tail') return row
    if (kind === 'user' || kind === 'steering') return null
  }
  return null
}

/** Collapse a closed failed turn while preserving its last readable partial. */
export function failedAssistantTraceRows(host, endReasonKind) {
  const hidden = []
  let keptReadablePartial = false
  for (let row = host?.previousElementSibling ?? null; row !== null; row = row.previousElementSibling) {
    const kind = row.dataset?.chatFlowKind
    if (kind === 'user' || kind === 'steering') break
    if (kind === 'turn-tail') continue
    if (endReasonKind === 'max-tokens' && kind === 'turn-max-tokens') continue
    if (kind === 'assistant-step' && !keptReadablePartial && readableAssistantRow(row)) {
      keptReadablePartial = true
      continue
    }
    if (kind === 'rp-message-avatar-user' || kind === 'rp-floor-user-actions') continue
    hidden.push(row)
  }
  return hidden
}

function readableAssistantRow(row) {
  const content = assistantMessageContent(row)
  return content !== null && (content.textContent ?? '').trim().length > 0
}

function DeletedAssistantTraceMarker({ target }) {
  const ref = useRef(null)
  useLayoutEffect(() => {
    const host = ref.current?.closest('[data-chat-flow-kind="rp-floor-assistant-actions"], [data-chat-flow-kind="rp-floor-failed-assistant"]')
    if (!(host instanceof HTMLElement)) return undefined
    return ownDynamicRows(
      host,
      () => deletedAssistantTraceRows(host),
      'data-rp-message-actions-hidden-deleted-assistant',
      `deleted-assistant-${rpMessageActionTargetKey(target)}`,
    )
  }, [target])
  return h('span', {
    ref,
    className: css.deletedAssistantMarker,
    hidden: true,
    'aria-hidden': true,
    'data-rp-message-action-key': target === undefined ? undefined : rpMessageActionTargetKey(target),
  })
}

function DeletedUserTraceMarker({ target }) {
  const ref = useRef(null)
  useLayoutEffect(() => {
    const host = ref.current?.closest('[data-chat-flow-kind="rp-floor-user-actions"]')
    if (!(host instanceof HTMLElement)) return undefined
    return ownDynamicRows(
      host,
      () => deletedUserRows(host),
      'data-rp-message-actions-hidden-deleted-user',
      `deleted-user-${rpMessageActionTargetKey(target)}`,
    )
  }, [target])
  return h('span', {
    ref,
    className: css.deletedUserMarker,
    hidden: true,
    'aria-hidden': true,
    'data-rp-message-action-key': target === undefined ? undefined : rpMessageActionTargetKey(target),
  })
}

function SuffixActionEffect({ node, useSession }) {
  const ref = useRef(null)
  const residentStartKey = useSession(snapshot => snapshot.hasMore === true
    ? suffixResidentStartKey(snapshot.chat, node.data.replacementStart, node.anchorSeq)
    : undefined)
  useLayoutEffect(() => {
    const host = ref.current?.closest('[data-chat-flow-kind="rp-message-suffix-action"]')
    if (!(host instanceof HTMLElement)) return undefined
    const first = node.data.action?.targets?.[0]
    if (first === undefined) return undefined
    return ownDynamicRows(
      host,
      () => suffixActionRows(host, first, residentStartKey),
      'data-rp-message-actions-hidden-suffix',
      `suffix-${String(node.id)}`,
    )
  }, [node.data.action, node.id, residentStartKey])
  return h('span', { ref, className: css.suffixEffectAnchor, hidden: true, 'aria-hidden': true })
}

/**
 * Return the first resident Chat Node inside a replacement whose original
 * target precedes the paged history window. The carrier's own native empty
 * assistant row is a valid start when no earlier replaced Node is resident.
 */
export function suffixResidentStartKey(chat, replacementStart, carrierAnchorSeq) {
  if (!Number.isSafeInteger(replacementStart)
    || typeof carrierAnchorSeq !== 'number'
    || !Array.isArray(chat?.order)
    || typeof chat?.nodes?.get !== 'function') return undefined
  for (const key of chat.order) {
    const anchorSeq = chat.nodes.get(key)?.anchorSeq
    if (typeof anchorSeq === 'number'
      && anchorSeq >= replacementStart
      && anchorSeq < carrierAnchorSeq) return key
  }
  return undefined
}

/** Return the exact resident Chat rows shadowed by one suffix delete/reroll carrier. */
export function suffixActionRows(host, firstTarget, residentStartKey) {
  const actionRow = findActionTargetRow(host, rpMessageActionTargetKey(firstTarget))
  let start
  if (actionRow === null) {
    start = findFlowRow(host, residentStartKey)
  } else if (firstTarget.kind === 'message' && firstTarget.role === 'user') {
    start = messageRowForAction(actionRow, firstTarget.role)
  } else {
    start = firstTurnOutputRow(actionRow)
    if (start === null && firstTarget.kind === 'message') {
      start = messageRowForAction(actionRow, firstTarget.role)
    }
  }
  if (start === null || start === undefined) return []
  const rows = []
  for (let row = start; row !== null && row !== host; row = row.nextElementSibling) rows.push(row)
  return rows
}

function firstTurnOutputRow(actionRow) {
  let boundary = null
  for (let row = actionRow.previousElementSibling; row !== null; row = row.previousElementSibling) {
    const kind = row.dataset?.chatFlowKind
    if (kind === 'user' || kind === 'steering') { boundary = row; break }
  }
  let start = boundary?.nextElementSibling ?? null
  while (start !== null && ['rp-floor-user-actions', 'rp-message-avatar-user'].includes(start.dataset?.chatFlowKind)) {
    start = start.nextElementSibling
  }
  return start
}

/** Return the original user row, intervening avatar nodes, and its retired action node. */
export function deletedUserRows(host) {
  return rowsFromMessageThroughHost(host, 'user')
}

/** Return the original assistant row, intervening avatar nodes, and its retired action node. */
export function deletedAssistantTraceRows(host) {
  return rowsFromMessageThroughHost(host, 'assistant')
}

function rowsFromMessageThroughHost(host, surface) {
  const message = messageRowForAction(host, surface)
  if (message === null) return []
  const rows = []
  for (let row = message; row !== null; row = row.nextElementSibling) {
    rows.push(row)
    if (row === host) return rows
  }
  return []
}

function findActionTargetRow(host, key) {
  for (let row = host?.previousElementSibling ?? null; row !== null; row = row.previousElementSibling) {
    if (row.getAttribute?.('data-rp-message-action-key') === key) return row
    const anchors = row.querySelectorAll?.('[data-rp-message-action-key]') ?? []
    for (const anchor of anchors) if (anchor.getAttribute('data-rp-message-action-key') === key) return row
  }
  return null
}

function findFlowRow(host, key) {
  if (typeof key !== 'string' || key.length === 0) return null
  for (let row = host?.previousElementSibling ?? null; row !== null; row = row.previousElementSibling) {
    if (row.getAttribute?.('data-chat-flow-key') === key) return row
  }
  return null
}

function ownDynamicRows(host, resolveRows, attribute, ownerSeed) {
  const owner = String(ownerSeed).replace(/[^A-Za-z0-9_-]/g, '-')
  let active = true
  let owned = new Set()
  const reconcile = () => {
    if (!active) return
    const next = new Set(resolveRows())
    for (const row of owned) if (!next.has(row)) removeAttributeOwner(row, attribute, owner)
    for (const row of next) if (!owned.has(row)) addAttributeOwner(row, attribute, owner)
    owned = next
  }
  reconcile()
  const Observer = host.ownerDocument.defaultView?.MutationObserver
  const observer = typeof Observer === 'function' ? new Observer(reconcile) : undefined
  observer?.observe(host.parentElement ?? host, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-chat-flow-kind', 'data-rp-message-action-key'],
  })
  queueMicrotask(reconcile)
  return () => {
    active = false
    observer?.disconnect()
    for (const row of owned) removeAttributeOwner(row, attribute, owner)
  }
}

function addAttributeOwner(row, name, owner) {
  const owners = new Set((row.getAttribute(name) ?? '').split(' ').filter(Boolean))
  owners.add(owner)
  row.setAttribute(name, [...owners].join(' '))
}

function removeAttributeOwner(row, name, owner) {
  const owners = new Set((row.getAttribute(name) ?? '').split(' ').filter(Boolean))
  owners.delete(owner)
  if (owners.size === 0) row.removeAttribute(name)
  else row.setAttribute(name, [...owners].join(' '))
}

function FloorActions({ sessionId, useSessions, turn, target, detail, edited = false, connection, sessions, surface = 'assistant', actionLabel, copyText = '', forkSeq, messageTime, canEdit = true, failedAssistant = false, failureStatus = null, nativeAssistant = false, userHadText = false, userHasNonTextContent = false }) {
  const roleplay = useSessions(state => isRoleplaySession(state, sessionId))
  const targetKey = rpMessageActionTargetKey(target)
  const [dialog, setDialog] = useState(null)
  const [editing, setEditing] = useState(false)
  const [body, setBody] = useState('')
  const [pending, setPending] = useState(null)
  const [error, setError] = useState(null)

  if (!roleplay || detail === null) return null

  const openDialog = value => { setEditing(false); setError(null); setPending(null); setDialog(value) }
  const closeDialog = () => {
    if (pending !== null) return
    setDialog(null); setError(null)
  }
  const openEditor = () => {
    if (detail === null) return
    setDialog(null); setBody(detail.content); setError(null); setPending(null); setEditing(true)
  }
  const closeEditor = () => {
    if (pending !== null) return
    setEditing(false); setBody(detail?.content ?? ''); setError(null)
  }
  const reroll = async content => {
    setPending('reroll'); setError(null)
    try {
      const value = await rpc(connection, 'reroll', {
        sessionId, target,
        ...(content === undefined ? {} : { content }),
      })
      if (value.sessionId !== sessionId) throw actionError('SESSION_CHANGED')
      setDialog(null)
      setEditing(false)
    } catch (reason) {
      setError(messageActionError(reason))
    } finally {
      setPending(null)
    }
  }
  const edit = async regenerate => {
    if (!regenerate && body === detail?.content) {
      closeEditor()
      return
    }
    setPending(regenerate ? 'save-reroll' : 'edit'); setError(null)
    try {
      if (regenerate && surface === 'user') {
        await reroll(body)
        return
      }
      await rpc(connection, 'edit', { sessionId, target, content: body })
      if (regenerate) {
        await reroll()
        return
      }
      setEditing(false)
    } catch (reason) {
      setError(messageActionError(reason))
    } finally {
      setPending(null)
    }
  }
  const remove = async () => {
    setPending('delete'); setError(null)
    try {
      await rpc(connection, 'delete', { sessionId, target })
      setDialog(null)
    } catch (reason) {
      setError(messageActionError(reason))
    } finally {
      setPending(null)
    }
  }
  const branch = async atSeq => {
    setPending('branch'); setError(null)
    try {
      const current = await rpc(connection, 'get', { sessionId, target })
      await forkMessageBranch({
        sessions, connection, sessionId,
        atSeq: Number.isSafeInteger(current.forkSeq) ? current.forkSeq : atSeq,
        target,
        replayEdit: edited && current.forkEditRequired === true,
        content: current.content,
      })
    } catch (reason) {
      setError(messageActionError(reason))
    } finally {
      setPending(null)
    }
  }

  const userSurface = surface === 'user'
  const failedTurnTarget = failedAssistant && target.kind === 'turn'
  const failedReply = detail?.failed === true
  const actionTurn = Number.isSafeInteger(detail?.turn) ? detail.turn : turn.turn
  const resolvedActionLabel = actionLabel ?? (detail?.opening === true ? '开场白' : undefined)
  const unitLabel = resolvedActionLabel ?? (userSurface ? '消息' : failedReply ? '未完成的回复' : '回复')
  const toolbarLabel = resolvedActionLabel === undefined
    ? userSurface ? `第 ${actionTurn} 条用户消息的操作` : `第 ${actionTurn} 条回复的操作`
    : `${resolvedActionLabel}的操作`
  const visibleText = copyText !== '' ? copyText : detail?.content ?? ''
  const branchSeq = detail?.forkSeq ?? forkSeq
  const actionsDisabled = pending !== null || detail.sessionRunning === true
  const branchAction = !userSurface && detail !== null && Number.isSafeInteger(branchSeq)
    ? h(FloorActionButton, {
        label: pending === 'branch' ? '正在新建对话…' : '从此处新建对话',
        ariaLabel: pending === 'branch' ? '正在新建对话' : resolvedActionLabel === undefined
          ? `从第 ${actionTurn} 条回复新建对话`
          : `从${resolvedActionLabel}新建对话`,
        icon: IconBranchOutline16,
        disabled: actionsDisabled,
        onClick: () => void branch(branchSeq),
      })
    : null
  const rerollAction = detail?.canReroll === true ? h(FloorActionButton, {
    label: pending === 'reroll' ? '正在重新生成…' : '重新生成',
    ariaLabel: pending === 'reroll'
      ? '正在重新生成回复'
      : userSurface ? `从第 ${actionTurn} 条消息重新生成` : `重新生成第 ${actionTurn} 条回复`,
    icon: IconRefreshOutline16,
    disabled: actionsDisabled,
    onClick: userSurface || failedTurnTarget ? () => void reroll() : () => openDialog('regenerate'),
  }) : null
  const editAction = canEdit && detail?.canEdit === true ? h(FloorActionButton, {
    label: `编辑${unitLabel}`,
    ariaLabel: resolvedActionLabel === undefined ? `编辑第 ${actionTurn} 条${unitLabel}` : `编辑${unitLabel}`,
    icon: IconEditOutline16,
    disabled: actionsDisabled,
    onClick: openEditor,
  }) : null
  const deleteAction = detail?.canDelete === true ? h(FloorActionButton, {
    label: `删除${unitLabel}`,
    ariaLabel: resolvedActionLabel === undefined ? `删除第 ${actionTurn} 条${unitLabel}` : `删除${unitLabel}`,
    icon: IconTrashOutline16,
    tone: 'danger',
    disabled: actionsDisabled,
    onClick: () => openDialog('delete'),
  }) : null
  const failedRecoveryActions = failedTurnTarget ? h(m.div, {
    className: css.failedTurnRecoveryActions,
    initial: failureStatus === null ? { opacity: 0, y: -4 } : false,
    animate: { opacity: 1, y: 0 },
    transition: motionTransition,
    role: 'toolbar',
    'aria-label': `第 ${actionTurn} 次未完成回复的恢复操作`,
  },
  detail?.canReroll === true ? h(Button, {
    variant: 'primary',
    size: 'sm',
    icon: h(IconRefreshOutline16, { size: 14 }),
    disabled: actionsDisabled,
    onClick: () => void reroll(),
  }, pending === 'reroll' ? '正在重新生成…' : '重新生成') : null,
  detail?.canDelete === true ? h(Button, {
    variant: 'ghost',
    size: 'sm',
    className: css.failedTurnDeleteAction,
    disabled: actionsDisabled,
    onClick: () => openDialog('delete'),
  }, '删除这次记录') : null) : null

  return h(MotionConfig, { reducedMotion: 'user', transition: motionTransition },
    h(LazyMotion, { features: domAnimation, strict: true },
      edited && detail !== null && !editing
        ? h(EditedMessagePortal, { surface, text: copyText, userHadText })
        : null,
      h('div', {
        className: nativeAssistant
          ? css.assistantActionHost
          : userSurface ? css.userFloorActionHost : css.floorActionHost,
        'data-rp-message-action-key': targetKey,
        ...(nativeAssistant && editing ? { 'data-rp-message-actions-editing-native': '' } : {}),
        ...(failedAssistant ? { 'data-rp-floor-failed-assistant-actions': '' } : {}),
      },
        userSurface ? h(NativeUserActionsEffect) : null,
        editing ? h(InlineMessageEditorPortal, {
          surface, unitLabel, detail, body, setBody, pending, error,
          userHadText, userHasNonTextContent,
          canSaveAndReroll: userSurface && detail?.canSaveAndReroll === true,
          onCancel: closeEditor,
          onSave: () => void edit(false),
          onSaveAndReroll: () => void edit(true),
        }) : failedTurnTarget ? (failureStatus === null
          ? failedRecoveryActions
          : h(FailedTurnStatusRow, {
              status: failureStatus,
              pending: pending === 'reroll',
              actions: failedRecoveryActions,
            })) : nativeAssistant ? h(React.Fragment, null,
          branchAction === null ? null : h(NativeAssistantBranchEffect),
          branchAction,
          rerollAction,
          editAction,
          deleteAction)
          : h('div', { className: css.floorActions, role: 'toolbar', 'aria-label': toolbarLabel },
          userSurface && Number.isFinite(messageTime) ? h('span', { className: css.userFloorTime }, formatMessageTime(messageTime)) : null,
          visibleText !== '' ? h(CopyActionButton, {
            text: visibleText, turn: actionTurn, surface, unitLabel, named: resolvedActionLabel !== undefined,
          }) : null,
          branchAction,
          rerollAction,
          editAction,
          deleteAction),
        error !== null && dialog === null && !editing
          ? h('div', { className: css.error, role: 'alert' }, error)
          : null,
        h(RegenerateDialog, {
          open: dialog === 'regenerate', close: closeDialog, surface, pending, error,
          failed: failedReply,
          onConfirm: () => void reroll(),
        }),
        h(DeleteDialog, {
          open: dialog === 'delete', close: closeDialog, surface, pending, error,
          failed: failedReply,
          sharedAssetMutation: detail?.deleteIncludesSharedAssetMutation === true,
          onConfirm: () => void remove(),
        }))))
}

/** Hide the native user footer by ownership, independent of intervening nodes. */
function NativeUserActionsEffect() {
  const ref = useRef(null)
  useLayoutEffect(() => {
    const host = actionNodeHost(ref.current)
    const message = messageRowForAction(host, 'user')
    if (!(message instanceof HTMLElement)) return undefined
    message.setAttribute('data-rp-message-actions-user-native-hidden', '')
    return () => { message.removeAttribute('data-rp-message-actions-user-native-hidden') }
  }, [])
  return h('span', { ref, className: css.nativeUserEffectAnchor, hidden: true, 'aria-hidden': true })
}

function NativeAssistantBranchEffect() {
  const ref = useRef(null)
  useLayoutEffect(() => {
    const branch = nativeAssistantBranchButton(ref.current)
    if (!(branch instanceof HTMLElement)) return undefined
    branch.setAttribute('data-rp-message-actions-hidden-native-branch', '')
    return () => { branch.removeAttribute('data-rp-message-actions-hidden-native-branch') }
  }, [])
  return h('span', { ref, className: css.nativeBranchEffectAnchor, hidden: true, 'aria-hidden': true })
}

/** Resolve the native branch control immediately following the assistant action slot. */
export function nativeAssistantBranchButton(anchor) {
  const outlet = anchor?.closest?.('[data-slot="conversation.chat.assistant-actions"]')
  const candidate = outlet?.nextElementSibling
  return candidate?.tagName === 'BUTTON' ? candidate : null
}

function EditedMessagePortal({ surface, text, userHadText = false }) {
  const anchorRef = useRef(null)
  const [target, setTarget] = useState(null)
  useLayoutEffect(() => {
    const host = actionNodeHost(anchorRef.current)
    const row = messageRowForAction(host, surface)
    if (!(row instanceof HTMLElement)) return undefined
    if (surface === 'user') {
      const stack = userMessageContentStack(row)
      if (!(stack instanceof HTMLElement)) return undefined
      const original = userHadText ? stack.lastElementChild : null
      const previousAriaHidden = original?.getAttribute('aria-hidden') ?? null
      original?.setAttribute('data-rp-message-actions-original-hidden', '')
      original?.setAttribute('aria-hidden', 'true')
      setTarget(stack)
      return () => {
        original?.removeAttribute('data-rp-message-actions-original-hidden')
        if (original instanceof HTMLElement) {
          if (previousAriaHidden === null) original.removeAttribute('aria-hidden')
          else original.setAttribute('aria-hidden', previousAriaHidden)
        }
        setTarget(null)
      }
    }
    const original = assistantMessageContent(row)
    if (!(original instanceof HTMLElement)) return undefined
    const previousAriaHidden = original.getAttribute('aria-hidden')
    original.setAttribute('data-rp-message-actions-original-hidden', '')
    original.setAttribute('aria-hidden', 'true')
    setTarget(row)
    return () => {
      original.removeAttribute('data-rp-message-actions-original-hidden')
      if (previousAriaHidden === null) original.removeAttribute('aria-hidden')
      else original.setAttribute('aria-hidden', previousAriaHidden)
      setTarget(null)
    }
  }, [surface])
  return h(React.Fragment, null,
    h('span', { ref: anchorRef, className: css.editedMessagePortalAnchor, hidden: true, 'aria-hidden': true }),
    target === null ? null : createPortal(surface === 'assistant'
      ? h('article', { className: css.editedAssistantMessage, 'data-rp-message-actions-edited-body': '' },
        h(MarkdownText, { text }))
      : h('div', { className: css.editedUserMessage, 'data-rp-message-actions-edited-body': '' },
        h(MessageText, { text })), target))
}

function InlineMessageEditorPortal({ surface, unitLabel, detail, body, setBody, pending, error, canSaveAndReroll, onCancel, onSave, onSaveAndReroll, userHadText = false, userHasNonTextContent = false }) {
  const anchorRef = useRef(null)
  const [target, setTarget] = useState(null)
  useLayoutEffect(() => {
    const host = actionNodeHost(anchorRef.current)
    const messageRow = messageRowForAction(host, surface)
    if (!(messageRow instanceof HTMLElement)) return undefined
    const portalTarget = surface === 'user'
      ? userMessageContentStack(messageRow)
      : messageRow
    if (!(portalTarget instanceof HTMLElement)) return undefined
    messageRow.setAttribute('data-rp-message-actions-editing', '')
    const original = surface === 'assistant'
      ? assistantMessageContent(messageRow)
      : userHadText
        ? portalTarget.lastElementChild
        : null
    if (original instanceof HTMLElement) original.setAttribute('data-rp-message-actions-original-hidden', '')
    setTarget(portalTarget)
    return () => {
      messageRow.removeAttribute('data-rp-message-actions-editing')
      original?.removeAttribute('data-rp-message-actions-original-hidden')
      setTarget(null)
    }
  }, [surface])
  return h(React.Fragment, null,
    h('span', { ref: anchorRef, className: css.inlineEditorPortalAnchor, 'aria-hidden': true }),
    target === null ? null : createPortal(h(InlineMessageEditor, {
      surface, unitLabel, detail, body, setBody, pending, error, canSaveAndReroll, onCancel, onSave, onSaveAndReroll,
      userHasNonTextContent,
    }), target))
}

/** Resolve the current Assistant renderer mounted inside the public Chat Node slot anchor. */
export function assistantMessageContent(messageRow) {
  const outlet = messageRow?.querySelector?.('[data-slot="conversation.chat.node"]')
  const content = outlet?.firstElementChild
  return content instanceof HTMLElement ? content : null
}

/** Resolve the native user stack so editing can replace text without hiding image attachments. */
export function userMessageContentStack(messageRow) {
  const hover = messageRow?.querySelector?.('[data-time-hover-root]')
  const stack = hover?.firstElementChild
  return stack instanceof HTMLElement ? stack : null
}

export function actionNodeHost(anchor) {
  return anchor?.closest?.('[data-chat-flow-kind="rp-floor-user-actions"], [data-chat-flow-kind="rp-floor-assistant-actions"], [data-chat-flow-kind="rp-floor-opening-actions"], [data-chat-flow-kind="turn-tail"]') ?? null
}

/** Locate the resident DSH message while allowing avatar and other plugin nodes between it and the action node. */
export function messageRowForAction(host, surface) {
  const accepted = surface === 'user' ? new Set(['user', 'steering']) : new Set(['assistant-step'])
  for (let row = host?.previousElementSibling ?? null; row !== null; row = row.previousElementSibling) {
    const kind = row.dataset?.chatFlowKind
    if (accepted.has(kind)) return row
    if (surface === 'assistant' && (kind === 'user' || kind === 'steering')) return null
  }
  return null
}

export function InlineMessageEditor({ surface, unitLabel, detail, body, setBody, pending, error, canSaveAndReroll, onCancel, onSave, onSaveAndReroll, userHasNonTextContent = false }) {
  const userSurface = surface === 'user'
  const showSaveAndReroll = userSurface && !userHasNonTextContent && canSaveAndReroll === true
  const textareaRef = useAutoSizeTextarea(body)
  useLayoutEffect(() => {
    textareaRef.current?.focus({ preventScroll: true })
  }, [textareaRef])
  const disabled = pending !== null || detail === null || body.trim().length === 0
  const keyDown = event => {
    if (event.key === 'Escape' && pending === null) {
      event.preventDefault(); onCancel()
      return
    }
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && !disabled) {
      event.preventDefault(); onSave()
    }
  }
  return h(m.div, {
    className: css.inlineEditor,
    'data-surface': surface,
    initial: { opacity: 0, y: -4 },
    animate: { opacity: 1, y: 0 },
    transition: motionTransition,
  },
  h('label', null,
    h('span', { className: css.srOnly }, `编辑${unitLabel}`),
    h('textarea', {
      ref: textareaRef,
      value: body,
      disabled: pending !== null,
      'aria-label': `${unitLabel}内容`,
      onChange: event => setBody(event.target.value),
      onKeyDown: keyDown,
    })),
  userSurface && userHasNonTextContent
    ? h('p', { className: css.editorNotice }, '只修改文字，图片会保留。')
    : null,
  detail?.sharedAssetMutation === true
    ? h('p', { className: css.assetNotice }, '这次回复创建或修改过共享资料。编辑回复不会撤销这些资料变更。')
    : null,
  h(DialogError, { error }),
  h('div', { className: css.inlineEditorFooter },
    h('div', null,
      h(m.button, { ...actionGestures, type: 'button', disabled: pending !== null, onClick: onCancel }, '取消'),
      h(m.button, { ...actionGestures, type: 'button', 'data-primary': showSaveAndReroll ? undefined : '', disabled, onClick: onSave }, pending === 'edit' ? '正在保存…' : '保存'),
      showSaveAndReroll ? h(m.button, { ...actionGestures, type: 'button', 'data-primary': '', disabled, onClick: onSaveAndReroll }, pending === 'save-reroll' || pending === 'reroll' ? '正在保存并重新生成…' : '保存并重新生成') : null)))
}

function useAutoSizeTextarea(value) {
  const textareaRef = useRef(null)
  useLayoutEffect(() => { sizeInlineEditor(textareaRef.current) }, [value])
  useEffect(() => {
    const resize = () => sizeInlineEditor(textareaRef.current)
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])
  return textareaRef
}

/** Size the editor from its rendered soft wraps, capped to three through six lines. */
export function sizeInlineEditor(textarea) {
  if (textarea === null) return
  textarea.style.height = '0px'
  const contentHeight = textarea.scrollHeight > 0 ? textarea.scrollHeight : INLINE_EDITOR_MIN_HEIGHT
  const nextHeight = Math.min(Math.max(contentHeight, INLINE_EDITOR_MIN_HEIGHT), INLINE_EDITOR_MAX_HEIGHT)
  textarea.style.height = `${nextHeight}px`
  textarea.style.overflowY = contentHeight > nextHeight ? 'auto' : 'hidden'
}

function formatMessageTime(time) {
  const value = new Date(time)
  const today = new Date()
  const sameDay = value.getFullYear() === today.getFullYear()
    && value.getMonth() === today.getMonth()
    && value.getDate() === today.getDate()
  const clock = `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`
  if (sameDay) return clock
  const date = value.getFullYear() === today.getFullYear()
    ? `${value.getMonth() + 1}月${value.getDate()}日`
    : `${value.getFullYear()}年${value.getMonth() + 1}月${value.getDate()}日`
  return `${date} ${clock}`
}

function CopyActionButton({ text, turn, surface, unitLabel, named = false }) {
  const [copied, setCopied] = useState(false)
  const copyPending = useRef(false)
  const copyEpoch = useRef(0)
  const copyTimer = useRef(null)
  useEffect(() => () => {
    copyEpoch.current += 1
    copyPending.current = false
    if (copyTimer.current !== null) window.clearTimeout(copyTimer.current)
  }, [])
  const copy = () => {
    if (copied || copyPending.current) return
    const epoch = copyEpoch.current
    copyPending.current = true
    void writeClipboard(text).then(ok => {
      if (epoch !== copyEpoch.current) return
      copyPending.current = false
      if (!ok) return
      setCopied(true)
      if (copyTimer.current !== null) window.clearTimeout(copyTimer.current)
      copyTimer.current = window.setTimeout(() => {
        copyTimer.current = null
        setCopied(false)
      }, 1000)
    })
  }
  const noun = unitLabel ?? (surface === 'assistant' ? '回复' : '消息')
  const targetLabel = named ? noun : `第 ${turn} 条${noun}`
  return h(FloorActionButton, {
    label: copied ? '复制成功' : `复制${noun}`,
    ariaLabel: copied ? `已复制${targetLabel}` : `复制${targetLabel}`,
    icon: copied ? IconCheckOutline16 : IconCopyOutline16,
    onClick: copy,
  })
}

function FloorActionButton({ label, ariaLabel, icon: Icon, tone = 'default', disabled = false, onClick }) {
  return h(Tooltip, { label, side: 'bottom', delayMs: 350 },
    h(m.button, {
      ...actionGestures,
      type: 'button',
      className: css.floorAction,
      'data-tone': tone,
      'aria-label': ariaLabel,
      disabled,
      onClick,
    }, h(Icon, { size: 15 })))
}

function RegenerateDialog({ open, close, surface, pending, error, failed = false, onConfirm }) {
  const userSurface = surface === 'user'
  return h(Modal, {
    open,
    onClose: close,
    closeLabel: '关闭重新生成确认',
    title: userSurface ? '从这条消息重新生成？' : failed ? '重新生成这条未完成的回复？' : '重新生成这条回复？',
    description: userSurface
      ? '会在当前对话中根据这条消息重新生成回复。'
      : failed
        ? '会移除当前未完成的内容，并根据刚才的消息重新生成。'
        : '会在当前对话中重新生成这条回复。',
    className: css.dialog,
    footer: h(React.Fragment, null,
      h(Button, { variant: 'outline', autoFocus: true, disabled: pending !== null, onClick: close }, '取消'),
      h(Button, { variant: 'primary', disabled: pending !== null, onClick: onConfirm }, pending === 'reroll' ? '正在重新生成…' : '重新生成')),
  },
  h(DialogError, { error }))
}

function DeleteDialog({ open, close, surface, pending, error, failed = false, sharedAssetMutation = false, onConfirm }) {
  const userSurface = surface === 'user'
  return h(Modal, {
    open,
    onClose: close,
    closeLabel: '关闭删除确认',
    title: userSurface
      ? '删除这条消息及之后的内容？'
      : failed ? '删除这次未完成的回复及之后的内容？' : '删除这条回复及之后的内容？',
    description: failed
      ? '会保留触发这次生成的消息，并移除未完成的回复以及之后的全部对话。'
      : '会从选中的内容开始，移除当前对话中之后的全部消息与回复。',
    className: css.dialog,
    footer: h(React.Fragment, null,
      h(Button, { variant: 'outline', autoFocus: true, disabled: pending !== null, onClick: close }, '取消'),
      h(Button, { variant: 'outline', className: css.deleteAction, disabled: pending !== null, onClick: onConfirm }, pending === 'delete' ? '正在删除…' : '确认删除')),
  },
  h('div', { className: css.deleteSummary },
    h('strong', null, failed ? '未完成回复之后的对话也会删除' : '选中内容之后的对话也会删除'),
    h('span', null, failed
      ? '触发这次生成的消息及之前的对话会保留；这次删除无法在当前界面撤销。'
      : '选中内容之前的对话会保留；这次删除无法在当前界面撤销。')),
  sharedAssetMutation ? h('p', { className: css.assetNotice }, '被移除的回复曾创建或修改共享资料。角色卡、世界书、人设、预设和文风不会随对话删除，也不会自动撤销。') : null,
  h(DialogError, { error }))
}

function DialogError({ error }) {
  return error === null ? null : h('div', { className: css.error, role: 'alert' }, error)
}

async function rpc(connection, endpoint, payload) {
  try {
    return messageActionValue(await connection.rpc.call('/rp-message-actions', endpoint, payload))
  } catch (reason) {
    if (reason?.code !== undefined) throw reason
    throw actionError('SERVICE_UNAVAILABLE')
  }
}

/**
 * Fork at the native message anchor, then replay an out-of-prefix edit into
 * the child before navigation. The source session remains untouched if either
 * phase fails, and a partially-created child is never opened as if complete.
 */
export async function forkMessageBranch({ sessions, connection, sessionId, atSeq, target, replayEdit, content }) {
  const childId = await sessions.fork({ sessionId, atSeq, increaseTitle: true })
  if (replayEdit) {
    await rpc(connection, 'edit', { sessionId: childId, target, content })
  }
  sessions.open(childId)
  return childId
}
