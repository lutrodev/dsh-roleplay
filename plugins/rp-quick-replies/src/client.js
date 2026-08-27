import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { LazyMotion, MotionConfig, domAnimation, m } from 'motion/react'
import {
  IconEllipsisOutline16,
  IconRefreshOutline14,
  Menu,
  Tooltip,
} from '@deepseek-ai/dsh-client-ui-primitives'
import { insertQuickReply } from './protocol.js'
import { createQuickReplyStore } from './client-store.js'
import { css, ensureStyles } from './client-styles.generated.js'

export const inject = ['slots', 'connection']
const h = React.createElement

export function apply(ctx) {
  ctx.effect(ensureStyles)
  const store = createQuickReplyStore(ctx.connection)
  ctx.slots.inject('conversation.input.right', () => ctx.slots.register({
    name: 'conversation.input.right',
    id: 'rp-quick-replies',
    order: 70,
    inject: () => ({ store }),
  }, QuickReplyControl))
}

export function QuickReplyControl(props) {
  const { input, inputActions, sessionId, useSession, useSessions, store } = props
  const roleplay = useSessions(state => {
    const summary = state.byId?.[sessionId]
    return summary?.agentPreset === 'roleplay' && summary.origin !== 'subagent'
  })
  const removed = useSession(state => state.removed === true)
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot)
  const controlRef = useRef(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const busy = removed || input.phase === 'adjudicating' || input.phase === 'submitting'

  useEffect(() => {
    if (!roleplay || state.phase !== 'idle') return
    void store.load().catch(() => {})
  }, [roleplay, state.phase, store])

  if (!roleplay) return null
  const ready = state.phase === 'ready' || state.phase === 'saving'
  const inlineReplies = ready ? state.replies.slice(0, 3) : []
  const selectReply = (reply, target) => {
    if (busy) return
    applyReplyToComposer(inputActions, input.draft, reply.content, target)
    setMenuOpen(false)
  }
  const menuItems = ready
    ? state.replies.map(reply => ({
        id: `reply:${reply.id}`,
        label: renderMenuReply(reply),
        disabled: busy,
      }))
    : state.phase === 'error'
      ? [{ id: 'load-error', label: '快捷回复暂时无法读取', disabled: true }]
      : [{ id: 'loading', label: '正在读取快捷回复…', disabled: true }]
  const menuFooter = state.phase === 'error'
    ? [{ id: 'retry', label: '重新加载', icon: h(IconRefreshOutline14, { size: 14 }) }]
    : []
  const onMenuSelect = id => {
    if (id === 'retry') {
      setMenuOpen(false)
      void store.load().catch(() => {})
      return
    }
    const reply = state.replies.find(item => `reply:${item.id}` === id)
    if (reply !== undefined) selectReply(reply, controlRef.current)
  }
  const menuVisibleOnWideScreens = ready && state.replies.length > 3
  const hasMenu = state.phase === 'error' || (ready && state.replies.length > 0)
  const triggerLabel = state.phase === 'error' ? '重新加载快捷回复' : '更多快捷回复'
  const triggerClass = menuVisibleOnWideScreens || state.phase === 'error'
    ? css.menuTrigger
    : `${css.menuTrigger} ${css.compactOnly}`
  const trigger = h(Tooltip, { key: 'quick-reply-menu-trigger', label: triggerLabel, side: 'top', delayMs: 500 },
    h(m.button, {
      key: 'quick-reply-menu-trigger-button',
      type: 'button',
      className: triggerClass,
      'aria-label': triggerLabel,
      'aria-haspopup': 'menu',
      'aria-expanded': menuOpen,
      disabled: removed,
      whileTap: { scale: 0.94 },
      onMouseDown: event => keepComposerFocus(event, input.draft),
      onClick: () => setMenuOpen(open => !open),
    }, h(IconEllipsisOutline16, { size: 16 })))

  return h(MotionConfig, { reducedMotion: 'user' },
    h(LazyMotion, { features: domAnimation, strict: true },
      h('div', { ref: controlRef, className: css.control, 'data-rp-quick-replies': true },
        ...inlineReplies.map(reply => h(Tooltip, {
          key: reply.id, label: `插入快捷回复：${reply.label}`, side: 'top', delayMs: 500,
        }, h(m.button, {
          key: `quick-reply-button:${reply.id}`,
          type: 'button',
          className: css.quickButton,
          disabled: busy,
          'aria-label': `插入快捷回复：${reply.label}`,
          whileHover: { y: -1 },
          whileTap: { scale: 0.96 },
          onMouseDown: event => keepComposerFocus(event, input.draft),
          onClick: event => selectReply(reply, event.currentTarget),
        }, h('span', null, reply.label)))),
        hasMenu ? h(Menu, {
          key: 'quick-reply-menu',
          open: menuOpen,
          anchor: trigger,
          items: menuItems,
          footer: menuFooter,
          onSelect: onMenuSelect,
          onClose: () => setMenuOpen(false),
          align: 'end',
          side: 'top',
          portal: true,
          compact: true,
          className: css.menu,
        }) : null)))
}

function renderMenuReply(reply) {
  const label = reply.label.replace(/\s+/g, ' ').trim()
  const content = reply.content.replace(/\s+/g, ' ').trim()
  const hasPreview = content !== label
  return h('span', { className: css.menuCopy, 'data-has-preview': hasPreview ? 'true' : 'false' },
    h('strong', null, reply.label),
    hasPreview ? h('small', null, content) : null)
}

export function applyReplyToComposer(inputActions, draft, content, target) {
  const textarea = findComposerTextarea(target)
  const selection = textarea === null
    ? { start: draft.length, end: draft.length }
    : { start: textarea.selectionStart ?? draft.length, end: textarea.selectionEnd ?? draft.length }
  const next = insertQuickReply(draft, content, selection)
  inputActions.setDraft(next.text)
  if (textarea !== null) {
    requestAnimationFrame(() => {
      textarea.focus({ preventScroll: true })
      textarea.setSelectionRange(next.selection.start, next.selection.end)
    })
  }
  return next
}

function findComposerTextarea(target) {
  if (!(target instanceof Element)) return null
  const textarea = target.closest('[data-composer-card]')?.querySelector('textarea')
  return textarea instanceof HTMLTextAreaElement ? textarea : null
}

function keepComposerFocus(event, draft) {
  event.preventDefault()
  const textarea = findComposerTextarea(event.currentTarget)
  if (textarea === null || document.activeElement === textarea) return
  if (textarea.selectionStart === 0 && textarea.selectionEnd === 0 && draft.length > 0) {
    textarea.setSelectionRange(draft.length, draft.length)
  }
}
export { createQuickReplyStore } from './client-store.js'
