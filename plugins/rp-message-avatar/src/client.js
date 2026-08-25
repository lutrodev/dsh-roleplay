import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  avatarNodeVisibility,
  assistantAvatarStart,
  assistantAvatarUpdate,
  messageAvatarTarget,
  openingAvatarMatch,
  updateMessageAvatarState,
  userAvatarMatch,
} from './client-state.js'
import { css, ensureStyles } from './client-styles.generated.js'

export const inject = ['slots', 'conversationEvents', 'connection']
const h = React.createElement
const fallbackUser = Object.freeze({ id: null, name: '我', hasAvatar: false })
const fallbackAssistant = Object.freeze({ id: null, name: '角色', hasAvatar: false })
const detailRequests = new WeakMap()
const avatarRequests = new WeakMap()

export const userAvatarNodeDefinition = {
  kind: 'rp-message-avatar-user',
  target: 'chat',
  match: userAvatarMatch,
  start: (_context, match) => ({
    seq: match.event.seq,
    messageId: match.id,
    side: 'user',
    visible: Array.isArray(match.event.data?.content) && match.event.data.content.length > 0,
  }),
  update: (context, match) => updateMessageAvatarState(context.state, match.event),
  buildViewNode: context => avatarNode(context, 'rp-message-avatar-user'),
}

function avatarNode(context, kind) {
  const visibility = avatarNodeVisibility(context)
  if (visibility === undefined || !Number.isSafeInteger(context.state?.seq)) return null
  return {
    key: context.key,
    kind,
    id: context.id,
    target: 'chat',
    anchorSeq: context.state.seq + 0.025,
    location: context.start?.location ?? { kind: 'unresolved' },
    visibility,
    data: context.state,
  }
}

export const assistantAvatarNodeDefinition = {
  kind: 'rp-message-avatar-assistant',
  target: 'chat',
  match: event => {
    const action = event?.type === 'assistant/message'
      ? event.data?.message?.source?.rpMessageAction
      : event?.type === 'user/message'
        ? event.data?.source?.rpMessageAction
        : undefined
    const target = action?.kind === 'rp-agent/message-action' && action.version === 1
      ? action.targets?.find?.(candidate => candidate?.kind === 'message'
        && candidate.role === 'assistant' && Number.isSafeInteger(candidate.turn))
      : undefined
    if (target !== undefined) return { id: String(target.turn), role: 'update' }
    if (event?.type === 'turn/start') return { id: String(event.data.turn), role: 'start' }
    if (event?.type === 'assistant/message' || event?.type === 'turn/end') {
      return Number.isSafeInteger(event.data?.turn)
        ? { id: String(event.data.turn), role: 'update' }
        : null
    }
    return null
  },
  start: (_context, match) => assistantAvatarStart(match.event),
  update: (context, match) => assistantAvatarUpdate(context.state, match.event),
  buildViewNode: context => avatarNode(context, 'rp-message-avatar-assistant'),
}

export const openingAvatarNodeDefinition = {
  kind: 'rp-message-avatar-opening',
  target: 'chat',
  match: openingAvatarMatch,
  start: (_context, match) => ({ seq: match.event.seq, messageId: match.id, side: 'assistant', visible: true }),
  update: (context, match) => updateMessageAvatarState(context.state, match.event),
  buildViewNode: context => avatarNode(context, 'rp-message-avatar-opening'),
}

export function apply(ctx) {
  ctx.effect(ensureStyles)
  ctx.conversationEvents.register(userAvatarNodeDefinition)
  ctx.conversationEvents.register(assistantAvatarNodeDefinition)
  ctx.conversationEvents.register(openingAvatarNodeDefinition)
  const injectUi = () => ({ connection: ctx.connection })
  for (const key of ['rp-message-avatar-user', 'rp-message-avatar-assistant', 'rp-message-avatar-opening']) {
    ctx.slots.inject('conversation.chat.node', () => ctx.slots.register({
      name: 'conversation.chat.node',
      key,
      inject: injectUi,
    }, MessageAvatarPortal))
  }
}

function MessageAvatarPortal({ node, sessionId, useProjection, useSessions, connection }) {
  const roleplay = useSessions(state => state.byId?.[sessionId]?.agentPreset === 'roleplay')
  const profile = useProjection('rp/session')
  const anchorRef = useRef(null)
  const [target, setTarget] = useState(null)
  const side = node.data.side
  useLayoutEffect(() => {
    if (!roleplay) { setTarget(null); return undefined }
    const host = anchorRef.current?.closest(`[data-chat-flow-kind="${node.kind}"]`)
    const row = messageAvatarTarget(host, side)
    if (!(row instanceof HTMLElement)) { setTarget(null); return undefined }
    row.setAttribute('data-rp-message-avatar-host', side)
    setTarget(row)
    return () => {
      if (row.getAttribute('data-rp-message-avatar-host') === side) row.removeAttribute('data-rp-message-avatar-host')
      setTarget(null)
    }
  }, [node.kind, roleplay, side])
  return h(React.Fragment, null,
    h('span', { ref: anchorRef, className: css.portalAnchor, 'aria-hidden': true }),
    roleplay && target !== null
      ? createPortal(h(MessageAvatar, { connection, profile, side }), target)
      : null)
}

function MessageAvatar({ connection, profile, side }) {
  const bindingId = side === 'assistant'
    ? profile?.resources?.card?.id
    : profile?.resources?.persona?.id
  const [identity, setIdentity] = useState(side === 'assistant' ? fallbackAssistant : fallbackUser)
  const [source, setSource] = useState(null)
  useEffect(() => {
    let live = true
    setIdentity(side === 'assistant' ? fallbackAssistant : fallbackUser)
    setSource(null)
    void resolveIdentity(connection, side, bindingId).then(value => {
      if (live) setIdentity(value)
    })
    return () => { live = false }
  }, [bindingId, connection, side])
  useEffect(() => {
    if (typeof identity.id !== 'string' || identity.hasAvatar !== true) { setSource(null); return undefined }
    let live = true
    void cachedAvatar(connection, side, identity.id).then(value => {
      if (live) setSource(value)
    })
    return () => { live = false }
  }, [connection, identity.hasAvatar, identity.id, side])
  const initial = identity.name?.trim()?.[0]?.toLocaleUpperCase() ?? (side === 'assistant' ? '角' : '我')
  return h('span', {
    className: `${css.messageAvatar} ${side === 'user' ? css.userAvatar : css.assistantAvatar}`,
    title: identity.name,
    'aria-hidden': true,
  }, source === null ? initial : h('img', { src: source, alt: '' }))
}

async function resolveIdentity(connection, side, bindingId) {
  const fallback = side === 'assistant' ? fallbackAssistant : fallbackUser
  const route = side === 'assistant' ? '/rp-character-cards' : '/rp-personas'
  if (typeof bindingId === 'string') {
    return cachedDetail(connection, `${route}:get:${bindingId}`, () => rpc(connection, route, 'get', { id: bindingId }))
      .catch(() => fallback)
  }
  if (side === 'assistant') return fallback
  return cachedDetail(connection, `${route}:default`, async () => {
    const page = await rpc(connection, route, 'list', { limit: 100 })
    return page.items.find(item => item.id === page.defaultId) ?? fallback
  }).catch(() => fallback)
}

function cachedDetail(connection, key, load) {
  let requests = detailRequests.get(connection)
  if (requests === undefined) {
    requests = new Map()
    detailRequests.set(connection, requests)
  }
  let request = requests.get(key)
  if (request === undefined) {
    request = load()
    requests.set(key, request)
  }
  return request
}

function cachedAvatar(connection, side, id) {
  let requests = avatarRequests.get(connection)
  if (requests === undefined) {
    requests = new Map()
    avatarRequests.set(connection, requests)
  }
  const route = side === 'assistant' ? '/rp-character-cards' : '/rp-personas'
  const key = `${route}:${id}`
  let request = requests.get(key)
  if (request === undefined) {
    request = rpc(connection, route, 'avatar', { id })
      .then(value => `data:${value.mimeType};base64,${value.base64}`)
      .catch(() => null)
    requests.set(key, request)
  }
  return request
}

async function rpc(connection, route, endpoint, payload) {
  const transport = await connection.rpc.call(route, endpoint, payload)
  if (!transport?.ok || !transport.value?.ok) throw new Error('ROLEPLAY_ASSET_UNAVAILABLE')
  return transport.value.value
}
