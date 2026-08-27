export const STATE_DISPLAY_ANCHOR_KIND = 'rp-state-display-anchor'
export const STATE_DISPLAY_RETRACTION_KIND = 'rp-state-display-retraction'
export const STATE_ACTIVITY_PROJECTION_KEY = 'rp/state/activity'

const RP_COMMIT_TOOL = 'rp_commit_turn'
const latestAnchorCache = new WeakMap()

/** Match one Turn lifecycle that can end in a durable assistant reply. */
export function stateDisplayAnchorMatch(event) {
  const turn = event?.data?.turn
  if (!Number.isSafeInteger(turn)) return null
  if (event.type === 'turn/start') return { id: String(turn), role: 'start' }
  if (event.type === 'assistant/message' || event.type === 'tool/result' || event.type === 'turn/end') {
    return { id: String(turn), role: 'update' }
  }
  return null
}

export function stateDisplayAnchorStart(event) {
  return {
    turn: event.data.turn,
    lastReadableAssistantSeq: undefined,
    commitAssistantSeq: undefined,
    canonicalAssistantSeq: undefined,
    commitAttempted: false,
    committed: false,
    successful: false,
    endSeq: undefined,
  }
}

/** Fold only the evidence needed to publish a successful reply anchor. */
export function stateDisplayAnchorUpdate(state, event) {
  if (event.type === 'assistant/message' && event.surfaceOp === 'append') {
    const message = event.data?.message
    if (!displayableAssistant(message) || state.committed) return state
    const ownsCommit = assistantCallsTool(message, RP_COMMIT_TOOL)
    const text = assistantText(message)
    return {
      ...state,
      lastReadableAssistantSeq: text.trim().length > 0 ? event.seq : state.lastReadableAssistantSeq,
      commitAssistantSeq: ownsCommit && text.trim().length > 0
        ? event.seq
        : state.commitAssistantSeq,
      commitAttempted: state.commitAttempted || ownsCommit,
    }
  }
  if (event.type === 'tool/result' && successfulCommitResult(state, event)) {
    return {
      ...state,
      committed: true,
      commitAttempted: true,
      canonicalAssistantSeq: Number.isSafeInteger(event.data?.meta?.assistant?.seq)
        ? event.data.meta.assistant.seq
        : state.commitAssistantSeq ?? state.lastReadableAssistantSeq,
    }
  }
  if (event.type === 'turn/end') {
    const assistantSeq = state.canonicalAssistantSeq
      ?? state.commitAssistantSeq
      ?? state.lastReadableAssistantSeq
    return {
      ...state,
      canonicalAssistantSeq: assistantSeq,
      successful: event.data?.reason?.kind === 'completed'
        && Number.isSafeInteger(assistantSeq)
        && (!state.commitAttempted || state.committed),
      endSeq: event.seq,
    }
  }
  return state
}

export const stateDisplayAnchorNodeDefinition = {
  kind: STATE_DISPLAY_ANCHOR_KIND,
  target: 'chat',
  match: stateDisplayAnchorMatch,
  start: (_context, match) => stateDisplayAnchorStart(match.event),
  update: (context, match) => stateDisplayAnchorUpdate(context.state, match.event),
  publication: match => match.event.type === 'turn/end' ? 'immediate' : 'none',
  buildViewNode: context => {
    const state = context.state
    if (state?.successful !== true || !Number.isSafeInteger(state.canonicalAssistantSeq)) return null
    return {
      key: context.key,
      kind: STATE_DISPLAY_ANCHOR_KIND,
      id: context.id,
      target: 'chat',
      anchorSeq: state.canonicalAssistantSeq + 0.11,
      location: { kind: 'session' },
      visibility: 'visible',
      data: {
        turn: state.turn,
        assistantSeq: state.canonicalAssistantSeq,
        endSeq: state.endSeq,
      },
    }
  },
}

/** Match a delete/reroll carrier so historical anchors follow surface rollback. */
export function stateDisplayRetractionMatch(event) {
  const action = messageAction(event)
  return action?.operation === 'delete' || action?.operation === 'reroll'
    ? { id: String(event.seq), role: 'start' }
    : null
}

export function stateDisplayRetractionStart(event) {
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

export const stateDisplayRetractionNodeDefinition = {
  kind: STATE_DISPLAY_RETRACTION_KIND,
  target: 'chat',
  match: stateDisplayRetractionMatch,
  start: (_context, match) => stateDisplayRetractionStart(match.event),
  update: context => context.state,
  buildViewNode: context => !Number.isSafeInteger(context.state?.seq) ? null : ({
    key: context.key,
    kind: STATE_DISPLAY_RETRACTION_KIND,
    id: context.id,
    target: 'chat',
    anchorSeq: context.state.seq + 0.105,
    location: { kind: 'session' },
    visibility: 'visible',
    data: context.state,
  }),
}

/** Select the sole reply anchor that should own the live current-State card. */
export function latestStateDisplayAnchorKey(chat) {
  const order = chat?.order
  const nodes = chat?.nodes
  if (!Array.isArray(order) || typeof nodes?.get !== 'function') return undefined
  const cached = latestAnchorCache.get(order)
  if (cached?.nodes === nodes) return cached.key
  let anchors = []
  for (const key of order) {
    const node = nodes.get(key)
    if (node?.kind === STATE_DISPLAY_ANCHOR_KIND) {
      anchors.push(node)
      continue
    }
    if (node?.kind !== STATE_DISPLAY_RETRACTION_KIND) continue
    anchors = anchors.filter(anchor => !retractionRemovesAnchor(node.data, anchor.data))
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

/** Schema-first object ordering, with unknown runtime keys retained afterwards. */
export function orderedStateEntries(value, schema) {
  if (Array.isArray(value)) return value.map((item, index) => [String(index), item])
  if (!isComplexStateValue(value)) return []
  const entries = Object.entries(value)
  const schemaKeys = Object.keys(schema?.properties ?? {})
  if (schemaKeys.length === 0) return entries
  const ordered = schemaKeys.filter(key => Object.hasOwn(value, key)).map(key => [key, value[key]])
  const known = new Set(schemaKeys)
  return ordered.concat(entries.filter(([key]) => !known.has(key)))
}

export function stateFieldSchema(schema, key, array = false) {
  return array ? schema?.items : schema?.properties?.[key]
}

export function stateFieldLabel(key, schema, array = false) {
  if (array) return `第 ${Number(key) + 1} 项`
  return typeof schema?.title === 'string' && schema.title.trim().length > 0
    ? schema.title
    : key
}

export function stateNamespaceTitle(id, snapshot) {
  if (typeof snapshot?.definition?.title === 'string' && snapshot.definition.title.trim().length > 0) {
    return snapshot.definition.title
  }
  const known = { variables: '故事变量', world: '世界状态', relationship: '关系状态' }
  if (known[id] !== undefined) return known[id]
  const tail = String(id).split(/[./:]/u).filter(Boolean).at(-1) ?? String(id)
  return tail.replaceAll(/[-_]+/gu, ' ').replace(/^./u, character => character.toLocaleUpperCase())
}

export function countStateLeaves(value) {
  if (!isComplexStateValue(value)) return 1
  return orderedStateEntries(value).reduce((total, [, child]) => total + countStateLeaves(child), 0)
}

export function countStateActivity(activity) {
  return Object.values(activity?.namespaces ?? {}).reduce(
    (total, changes) => total + (Array.isArray(changes) ? changes.length : 0),
    0,
  )
}

/** Resolve one leaf row's canonical before/after values from the latest reply activity. */
export function stateActivityTransition(activity, namespace, path) {
  if (activity?.available !== true || typeof path !== 'string') return undefined
  const changes = Array.isArray(activity.namespaces?.[namespace]) ? activity.namespaces[namespace] : []
  const rowSegments = parseActivityPointer(path)
  if (rowSegments === undefined) return undefined
  const candidates = changes.map(change => ({ change, segments: parseActivityPointer(change?.path) }))
    .filter(candidate => candidate.segments !== undefined
      && pointerStartsWith(rowSegments, candidate.segments))
    .sort((left, right) => right.segments.length - left.segments.length)
  for (const candidate of candidates) {
    const relative = rowSegments.slice(candidate.segments.length)
    const before = activityDescendant(candidate.change.before, relative)
    const after = activityDescendant(candidate.change.after, relative)
    if (before === undefined || after === undefined) continue
    if (relative.length > 0 && sameActivityValue(before, after)) continue
    return {
      before,
      after,
      op: candidate.change.op,
      path: candidate.change.path,
      reason: candidate.change.reason,
    }
  }
  return undefined
}

function parseActivityPointer(pointer) {
  if (pointer === '') return []
  if (typeof pointer !== 'string' || !pointer.startsWith('/')) return undefined
  return pointer.slice(1).split('/').map(segment => segment.replaceAll('~1', '/').replaceAll('~0', '~'))
}

function pointerStartsWith(value, prefix) {
  return prefix.length <= value.length && prefix.every((segment, index) => value[index] === segment)
}

function activityDescendant(snapshot, segments) {
  if (snapshot === null || typeof snapshot !== 'object' || typeof snapshot.exists !== 'boolean') return undefined
  if (!snapshot.exists) return { exists: false }
  let value = snapshot.value
  for (const segment of segments) {
    if (value === null || typeof value !== 'object' || !Object.hasOwn(value, segment)) return { exists: false }
    value = value[segment]
  }
  return { exists: true, value }
}

function sameActivityValue(left, right) {
  if (left.exists !== right.exists) return false
  if (!left.exists) return true
  return JSON.stringify(left.value) === JSON.stringify(right.value)
}

export function presentStatePrimitive(value) {
  if (value === null || value === undefined) return { text: '未设置', kind: 'empty', empty: true, long: false }
  if (value === '') return { text: '空文本', kind: 'empty', empty: true, long: false }
  if (typeof value === 'boolean') return { text: value ? '是' : '否', kind: 'boolean', empty: false, long: false }
  if (typeof value === 'number') return { text: String(value), kind: 'number', empty: false, long: false }
  const text = String(value)
  return {
    text,
    kind: 'text',
    empty: false,
    long: [...text].length > 120 || text.split(/\r?\n/u).length > 3,
  }
}

export function isComplexStateValue(value) {
  return value !== null && typeof value === 'object'
}

export function escapeStatePointer(segment) {
  return String(segment).replaceAll('~', '~0').replaceAll('/', '~1')
}

function displayableAssistant(message) {
  const source = message?.source
  if (source?.rpMessageAction !== undefined) return false
  return source?.kind === 'model'
    || (source?.provider === 'rp-session' && source?.model === 'selected-opening')
}

function assistantText(message) {
  return Array.isArray(message?.content)
    ? message.content
        .filter(block => block?.type === 'text' && typeof block.text === 'string')
        .map(block => block.text)
        .join('')
    : ''
}

function assistantCallsTool(message, name) {
  return Array.isArray(message?.content)
    && message.content.some(block => block?.type === 'tool-call' && block.name === name)
}

function successfulCommitResult(_state, event) {
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
