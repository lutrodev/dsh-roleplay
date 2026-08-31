import React, { useId, useRef, useState } from 'react'
import { LazyMotion, MotionConfig, domAnimation, m, useReducedMotion } from 'motion/react'
import { isRoleplaySessionSummary } from 'dsh-roleplay-rp-ui/session-summary'
import {
  latestReplyOptionsAnchorKey,
  REPLY_OPTIONS_ANCHOR_KIND,
  REPLY_OPTIONS_RETRACTION_KIND,
  replyOptionsAnchorNodeDefinition,
  replyOptionsRetractionNodeDefinition,
} from './client-state.js'
import { css, ensureStyles } from './client-styles.generated.js'

export const inject = ['slots', 'uiConversation', 'sessions', 'conversation']
const h = React.createElement

export function apply(ctx) {
  ctx.effect(ensureStyles)
  ctx.uiConversation.events.register(replyOptionsAnchorNodeDefinition)
  ctx.uiConversation.events.register(replyOptionsRetractionNodeDefinition)
  const sendReply = createReplySender(ctx.sessions)
  ctx.slots.inject('conversation.chat.node', () => ctx.slots.register({
    name: 'conversation.chat.node',
    key: REPLY_OPTIONS_ANCHOR_KIND,
    inject: () => ({ sendReply }),
  }, ReplyOptionsAnchor))
  ctx.slots.inject('conversation.chat.node', () => ctx.slots.register({
    name: 'conversation.chat.node',
    key: REPLY_OPTIONS_RETRACTION_KIND,
  }, ReplyOptionsRetraction))
}

/** Render choices only for the latest actionable committed Roleplay reply. */
export function ReplyOptionsAnchor(props) {
  const { node, sessionId, useChat, useInput, useSession, useSessions, sendReply } = props
  const activeKey = useChat(latestReplyOptionsAnchorKey)
  const roleplay = useSessions(state => {
    const summary = state.byId?.[sessionId]
    return isRoleplaySessionSummary(summary) && summary.origin !== 'subagent'
  })
  const removed = useSession(state => state.removed === true)
  const inputPhase = useInput(state => state.phase)
  if (!roleplay || activeKey !== node.key) return h(HiddenMarker)
  return h(ReplyOptionsCard, {
    options: node.data.options,
    sessionId,
    disabled: removed || inputPhase !== 'plain',
    sendReply,
  })
}

export function ReplyOptionsRetraction() {
  return h(HiddenMarker)
}

function HiddenMarker() {
  return h('span', { className: css.hiddenMarker, hidden: true, 'aria-hidden': true })
}

export function ReplyOptionsCard({ options, sessionId, disabled = false, sendReply }) {
  const [sendingIndex, setSendingIndex] = useState(null)
  const [error, setError] = useState(false)
  const sending = useRef(false)
  const reducedMotion = useReducedMotion()
  const headingId = useId()
  const helpId = useId()
  if (!Array.isArray(options) || options.length < 1 || options.length > 5) return h(HiddenMarker)
  const busy = disabled || sendingIndex !== null
  const motion = replyOptionsMotion(reducedMotion)

  const choose = async (option, index) => {
    if (disabled || sending.current) return
    sending.current = true
    setSendingIndex(index)
    setError(false)
    try {
      await sendReply(sessionId, option)
    } catch {
      sending.current = false
      setSendingIndex(null)
      setError(true)
    }
  }

  return h(MotionConfig, { reducedMotion: 'user' },
    h(LazyMotion, { features: domAnimation },
      h(m.section, {
        className: css.card,
        'data-rp-reply-options-card': 'true',
        'aria-labelledby': headingId,
        'aria-describedby': helpId,
        initial: motion.initial,
        animate: motion.animate,
        transition: motion.transition,
      },
      h('header', { className: css.header },
        h('div', { className: css.titleGroup },
          h('h2', { id: headingId }, '接下来想怎么做？'),
          h('p', { id: helpId }, '选择一项将直接发送'))),
      h('ol', { className: css.options, role: 'list' }, ...options.map((option, index) => h('li', {
        key: `${index}:${option}`,
        className: css.optionItem,
      }, h(m.button, {
          type: 'button',
          className: css.option,
          disabled: busy,
          'data-sending': sendingIndex === index ? 'true' : undefined,
          'aria-busy': sendingIndex === index ? 'true' : undefined,
          onClick: () => void choose(option, index),
          whileTap: busy ? undefined : motion.whileTap,
        },
        h('span', { className: css.optionNumber, 'aria-hidden': true }, String(index + 1)),
        h('span', { className: css.optionText }, option),
        sendingIndex === index
          ? h('span', { className: css.sending, role: 'status' }, '正在发送…')
          : h('span', { className: css.optionAction, 'aria-hidden': true }, '发送'))))),
      error ? h('p', { className: css.error, role: 'alert' }, '这条回复没能发送，请再试一次。') : null)))
}

export function createReplySender(sessions) {
  return async (sessionId, text) => {
    const scoped = sessions.scope(sessionId)
    const conversation = scoped?.get('conversation')
    if (conversation === undefined) throw new Error('reply options could not resolve the scoped conversation')
    await conversation.send(text)
  }
}

export function replyOptionsMotion(reducedMotion) {
  return {
    initial: { opacity: 0, y: reducedMotion ? 0 : 4 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reducedMotion ? 0 : 0.16, ease: [0.2, 0, 0, 1] },
    whileTap: reducedMotion ? undefined : { scale: 0.985 },
  }
}
