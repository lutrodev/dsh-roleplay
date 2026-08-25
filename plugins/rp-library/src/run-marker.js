import React, { useLayoutEffect, useMemo, useRef } from 'react'

const RP_RUN_MARKER_KIND = 'rp-run-marker'
const HIDDEN_TRACE_ATTRIBUTE = 'data-rp-library-inactive-open-trace'
const HIDDEN_REASONING_ATTRIBUTE = 'data-rp-library-inactive-open-reasoning'
const PROCESS_NODE_KINDS = new Set([
  'compaction',
  'context',
  'manual-compaction',
  'model-retry',
  'tool-call',
  'workflow-run',
])

function roleplayRunMetadata(event) {
  if (event?.type !== 'user/message') return null
  const source = event.data?.source
  const run = source?.kind === 'plugin' && source.plugin === 'rp-core'
    ? source.rpRun
    : undefined
  if (run?.version !== 1 || !Number.isSafeInteger(run.turn) || run.turn < 0) return null
  const runId = typeof run.runId === 'string' && run.runId.length > 0
    ? run.runId
    : `turn:${run.turn}`
  return {
    runId,
    turn: run.turn,
    executionMode: run.executionMode === 'agent' ? 'agent' : 'chat',
  }
}

/**
 * Latest open Turn in engine order. Several open Turns can coexist after an
 * interrupted reload or HMR; only the last one can own live trajectory UI.
 */
export function latestOpenTurn(timeline) {
  if (timeline?.turns === undefined) return null
  let latest = null
  const order = Array.isArray(timeline.turnOrder)
    ? timeline.turnOrder
    : [...timeline.turns.keys()]
  for (const turn of order) {
    if (timeline.turns.get(turn)?.status === 'open') latest = turn
  }
  return latest
}

/** Compute the marker's role without accepting every historical open Turn. */
export function roleplayRunActivity({ running, timeline, turn }) {
  const status = timeline?.turns?.get(turn)?.status ?? 'unknown'
  const active = running === true && status === 'open' && latestOpenTurn(timeline) === turn
  return {
    active,
    status,
    inactiveOpen: status === 'open' && !active,
  }
}

function readableAssistant(node) {
  if (node?.kind !== 'assistant-step' || !Array.isArray(node.data?.blocks)) return false
  return node.data.blocks.some((block) => {
    if (block?.kind === 'text') return typeof block.text === 'string' && block.text.trim().length > 0
    return block?.kind === 'image' || block?.kind === 'unknown'
  })
}

function hasReasoning(node) {
  return node?.kind === 'assistant-step'
    && Array.isArray(node.data?.blocks)
    && node.data.blocks.some(block => block?.kind === 'reasoning')
}

/**
 * Rows to collapse for one inactive-but-open Roleplay Turn. The last readable
 * Assistant remains the recovery surface; its reasoning disclosure is still
 * trajectory and is hidden independently from the answer body.
 */
export function inactiveOpenTracePlan(nodes) {
  const assistants = nodes.filter(node => node?.kind === 'assistant-step')
  const readable = assistants.filter(readableAssistant)
  const preservedAssistant = readable.at(-1)
  const hiddenKeys = []
  for (const node of nodes) {
    if (typeof node?.key !== 'string') continue
    if (PROCESS_NODE_KINDS.has(node.kind)) {
      hiddenKeys.push(node.key)
      continue
    }
    if (node.kind === 'assistant-step' && node.key !== preservedAssistant?.key) {
      hiddenKeys.push(node.key)
    }
  }
  return {
    hiddenKeys,
    reasoningKeys: preservedAssistant !== undefined && hasReasoning(preservedAssistant)
      ? [preservedAssistant.key]
      : [],
  }
}

function setOwnedAttribute(row, attribute, owner, touched) {
  row.setAttribute(attribute, owner)
  touched.push([row, attribute])
}

/**
 * Apply an exact key plan inside the current Chat flow and return an
 * ownership-safe cleanup. No ancestor/session-wide running class is used.
 */
export function applyInactiveOpenTrace(marker, plan, owner) {
  const root = marker?.closest?.('[data-chat-flow]')
  if (root === null || root === undefined) return () => {}
  const hidden = new Set(plan.hiddenKeys)
  const reasoning = new Set(plan.reasoningKeys)
  const touched = []
  for (const row of root.querySelectorAll('[data-chat-flow-key]')) {
    const key = row.getAttribute('data-chat-flow-key')
    if (key !== null && hidden.has(key)) {
      setOwnedAttribute(row, HIDDEN_TRACE_ATTRIBUTE, owner, touched)
    }
    if (key !== null && reasoning.has(key)) {
      setOwnedAttribute(row, HIDDEN_REASONING_ATTRIBUTE, owner, touched)
    }
  }
  return () => {
    for (const [row, attribute] of touched) {
      if (row.getAttribute(attribute) === owner) row.removeAttribute(attribute)
    }
  }
}

/** Roleplay-run boundary derived from the logged native context message. */
export const roleplayRunMarkerDefinition = {
  kind: RP_RUN_MARKER_KIND,
  target: 'chat',
  match(event) {
    const run = roleplayRunMetadata(event)
    return run === null ? null : { id: run.runId, role: 'start' }
  },
  start(_context, match) {
    const run = roleplayRunMetadata(match.event)
    if (run === null) throw new Error('rp-run-marker start requires an rp-core context message')
    return { ...run, seq: match.event.seq }
  },
  update(context) {
    return context.state
  },
  buildViewNode(context) {
    if (context.state === undefined) return null
    return {
      key: context.key,
      kind: RP_RUN_MARKER_KIND,
      id: context.id,
      target: 'chat',
      anchorSeq: context.state.seq - 0.05,
      location: context.start?.location ?? { kind: 'unresolved' },
      visibility: 'visible',
      data: {
        runId: context.state.runId,
        turn: context.state.turn,
        executionMode: context.state.executionMode,
      },
    }
  },
}

/** Invisible renderer that scopes orphan-open trajectory cleanup to one Turn. */
export function RpRunMarker({ node, useSession }) {
  const markerRef = useRef(null)
  const running = useSession(snapshot => snapshot.running)
  const timeline = useSession(snapshot => snapshot.chat.timeline)
  const locationKeys = useSession(snapshot => snapshot.chat.locations.getTurn(node.data.turn))
  const nodeStore = useSession(snapshot => snapshot.chat.nodes)
  const activity = roleplayRunActivity({ running, timeline, turn: node.data.turn })
  const plan = useMemo(() => {
    if (!activity.inactiveOpen) return { hiddenKeys: [], reasoningKeys: [] }
    return inactiveOpenTracePlan(locationKeys.map(key => nodeStore.get(key)).filter(Boolean))
  }, [activity.inactiveOpen, locationKeys, nodeStore])

  useLayoutEffect(() => {
    if (!activity.inactiveOpen) return undefined
    return applyInactiveOpenTrace(markerRef.current, plan, node.data.runId)
  }, [activity.inactiveOpen, node.data.runId, plan])

  return React.createElement('span', {
    ref: markerRef,
    hidden: true,
    'aria-hidden': true,
    'data-rp-run': node.data.runId,
    'data-rp-run-turn': node.data.turn,
    'data-rp-run-active': activity.active ? 'true' : 'false',
    'data-rp-run-status': activity.status,
  })
}

