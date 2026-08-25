const OPENING_PROVIDER = 'rp-session'
const OPENING_MODEL = 'selected-opening'

/** Keep a materialized avatar key and withdraw it through hidden visibility. */
export function avatarNodeVisibility(context) {
  if (context.state?.visible === true) return 'visible'
  const current = context.current?.get?.('chat')
  return current === undefined || current === null ? undefined : 'hidden'
}

/** Match one visible user message while preserving its original transcript anchor. */
export function userAvatarMatch(event) {
  const action = messageAction(event)
  if (action !== undefined) {
    const target = action.targets.find(candidate => candidate?.kind === 'message' && candidate.role === 'user')
    return target === undefined ? null : { id: String(target.messageId), role: 'update', target }
  }
  if (event?.type === 'user/message' && event.data?.source?.kind === 'user') {
    return { id: String(event.data.id ?? event.seq), role: event.surfaceOp === 'append' ? 'start' : 'update' }
  }
  return null
}

/** Match the host-selected opening independently from model turn output. */
export function openingAvatarMatch(event) {
  if (isOpening(event)) {
    return { id: String(event.data.message.id ?? event.seq), role: event.surfaceOp === 'append' ? 'start' : 'update' }
  }
  return null
}

/** Start one assistant-avatar projection per native turn. */
export function assistantAvatarStart(event) {
  return { turn: event.data.turn, side: 'assistant', seq: undefined, messageId: undefined, visible: false, closed: false }
}

/** Attach identity to the last readable prose once its turn closes. */
export function assistantAvatarUpdate(state, event) {
  const action = messageAction(event)
  if (action !== undefined) {
    const target = action.targets.find(candidate => candidate?.kind === 'message'
      && candidate.role === 'assistant' && candidate.messageId === state.messageId)
    if (target === undefined) return state
    return {
      ...state,
      visible: action.operation === 'edit'
        && state.closed === true
        && hasVisibleContent(event.data?.message?.content),
    }
  }
  if (event?.type === 'assistant/message'
    && event.data?.message?.source?.kind === 'model'
    && !isOpening(event)
    && messageText(event.data.message).trim().length > 0) {
    return { ...state, seq: event.seq, messageId: event.data.message.id, visible: false }
  }
  if (event?.type === 'turn/end') {
    return { ...state, closed: true, visible: Number.isSafeInteger(state.seq) }
  }
  return state
}

/** Fold a message replacement without moving its avatar away from the original row. */
export function updateMessageAvatarState(state, event) {
  const action = messageAction(event)
  if (action !== undefined) {
    return {
      ...state,
      visible: action.operation === 'edit' && hasVisibleContent(messageContent(event)),
    }
  }
  const content = state.side === 'assistant' ? event?.data?.message?.content : event?.data?.content
  return { ...state, visible: hasVisibleContent(content) }
}

/** Find the resident transcript row immediately owned by an avatar projection. */
export function messageAvatarTarget(host, side) {
  const accepted = side === 'user' ? new Set(['user']) : new Set(['assistant-step', 'rp-opening'])
  for (let row = host?.previousElementSibling ?? null; row !== null; row = row.previousElementSibling) {
    const kind = row?.dataset?.chatFlowKind
    if (accepted.has(kind)) return row
    if (kind === 'user' || kind === 'steering') return null
  }
  return null
}

function messageAction(event) {
  const action = event?.type === 'user/message'
    ? event.data?.source?.rpMessageAction
    : event?.type === 'assistant/message'
      ? event.data?.message?.source?.rpMessageAction
      : undefined
  return action?.kind === 'rp-agent/message-action'
    && action.version === 1
    && ['edit', 'delete', 'reroll'].includes(action.operation)
    && Array.isArray(action.targets)
    ? action
    : undefined
}

function isOpening(event) {
  return event?.type === 'assistant/message'
    && event.data?.message?.source?.provider === OPENING_PROVIDER
    && event.data?.message?.source?.model === OPENING_MODEL
}

function messageText(message) {
  return Array.isArray(message?.content)
    ? message.content.filter(block => block?.type === 'text' && typeof block.text === 'string').map(block => block.text).join('')
    : ''
}

function messageContent(event) {
  return event?.type === 'assistant/message' ? event.data?.message?.content : event?.data?.content
}

function hasVisibleContent(content) {
  return Array.isArray(content)
    && content.some(block => block?.type === 'text' && typeof block.text === 'string' && block.text.trim().length > 0)
}
