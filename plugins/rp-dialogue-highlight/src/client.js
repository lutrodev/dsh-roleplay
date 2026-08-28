import React, { useLayoutEffect, useRef } from 'react'
import { isRoleplaySessionSummary } from 'dsh-roleplay-rp-ui/session-summary'
import { mountDialogueHighlight } from './dom-highlight.js'
import { css, ensureStyles } from './client-styles.generated.js'

export const inject = ['slots', 'uiConversation']

const h = React.createElement
const NODE_KIND = 'rp-dialogue-highlight'
const NODE_OFFSET = 0.01

export const dialogueHighlightNodeDefinition = {
  kind: NODE_KIND,
  target: 'chat',
  match: event => {
    const turn = event?.data?.turn
    const step = event?.data?.step
    if (!Number.isSafeInteger(turn) || !Number.isSafeInteger(step)) return null
    const id = `${turn}:${step}`
    if (event.type === 'step/start') return { id, role: 'start' }
    if (event.type === 'assistant/chunk'
      || event.type === 'assistant/message'
      || event.type === 'step/end'
      || event.type === 'llm/retry') return { id, role: 'update' }
    return null
  },
  start: (_context, match) => initialHighlightState(match.event),
  update: (context, match) => updateHighlightState(context.state, match.event),
  publication: match => match.event.type === 'assistant/chunk' ? 'animation-frame' : 'immediate',
  buildViewNode: context => {
    const state = highlightState(context)
    if (!Number.isFinite(state?.anchorSeq)) return null
    return {
      key: context.key,
      kind: NODE_KIND,
      id: context.id,
      target: 'chat',
      anchorSeq: state.anchorSeq + NODE_OFFSET,
      location: context.start?.location ?? context.matches?.[0]?.location ?? { kind: 'unresolved' },
      visibility: 'visible',
      data: { streaming: state.streaming },
    }
  },
}

export function apply(ctx) {
  ctx.effect(ensureStyles)
  ctx.uiConversation.events.register(dialogueHighlightNodeDefinition)
  ctx.slots.inject('conversation.chat.node', () => ctx.slots.register({
    name: 'conversation.chat.node',
    key: NODE_KIND,
  }, DialogueHighlightAnchor))
}

function initialHighlightState(event) {
  return {
    turn: event.data.turn,
    step: event.data.step,
    anchorSeq: undefined,
    streaming: true,
  }
}

export function updateHighlightState(state, event) {
  const current = state ?? initialHighlightState(event)
  if (event.type === 'llm/retry') return { ...current, anchorSeq: undefined, streaming: true }
  if (event.type === 'assistant/chunk') {
    if (current.anchorSeq !== undefined || !visibleTextChunk(event.data.chunk)) return current
    return { ...current, anchorSeq: event.seq }
  }
  if (event.type === 'assistant/message') {
    return {
      ...current,
      anchorSeq: event.surfaceOp === 'append' || current.anchorSeq === undefined
        ? event.seq
        : current.anchorSeq,
      streaming: false,
    }
  }
  if (event.type === 'step/end' && current.streaming) {
    return { ...current, anchorSeq: event.seq, streaming: false }
  }
  return current
}

function highlightState(context) {
  if (context.state !== undefined) return context.state
  let state
  for (const match of context.matches ?? []) {
    state = match.event.type === 'step/start'
      ? initialHighlightState(match.event)
      : updateHighlightState(state, match.event)
  }
  return state
}

function visibleTextChunk(chunk) {
  if (chunk?.type === 'text-delta') return chunk.text.trim().length > 0
  return chunk?.type === 'block-end'
    && chunk.block?.type === 'text'
    && chunk.block.text.trim().length > 0
}

function DialogueHighlightAnchor({ node, sessionId, useSessions }) {
  const anchorRef = useRef(null)
  const entryRef = useRef(Symbol(String(node.id)))
  const roleplay = useSessions(state => isRoleplaySessionSummary(state.byId?.[sessionId]))

  useLayoutEffect(() => {
    if (!roleplay) return undefined
    const assistant = findAssistantRow(anchorRef.current)
    if (assistant === null) return undefined
    return mountDialogueHighlight(assistant, entryRef.current, { streaming: node.data.streaming === true })
  }, [node.data.streaming, roleplay])

  return h('span', {
    ref: anchorRef,
    className: css.anchor,
    hidden: true,
    'aria-hidden': true,
    'data-rp-dialogue-highlight-anchor': String(node.id),
  })
}

/** Resolve the assistant row immediately owned by this projection node. */
export function findAssistantRow(anchor) {
  const host = anchor?.closest?.(`[data-chat-flow-kind="${NODE_KIND}"]`)
  if (typeof HTMLElement !== 'undefined' && !(host instanceof HTMLElement)) return null
  if (host === null || host === undefined) return null
  for (let row = host.previousElementSibling; row !== null; row = row.previousElementSibling) {
    const kind = row.dataset?.chatFlowKind
    if (kind === 'assistant-step') return row
    if (kind === 'turn-tail' || kind === 'user' || kind === 'steering') return null
  }
  return null
}
