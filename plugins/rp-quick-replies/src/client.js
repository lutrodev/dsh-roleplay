import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { LazyMotion, MotionConfig, domAnimation, m } from 'motion/react'
import { isRoleplaySessionSummary } from 'dsh-roleplay-rp-ui/session-summary'
import {
  IconEllipsisOutline16,
  IconRefreshOutline14,
  Menu,
  Tooltip,
} from '@deepseek-ai/dsh-client-ui-primitives'
import { insertQuickReply, planQuickReplyEdits } from './protocol.js'
import { createQuickReplyStore } from './client-store.js'
import { css, ensureStyles } from './client-styles.generated.js'

export const inject = ['slots', 'rpRemote', 'sessions', 'conversation']
const h = React.createElement

export function apply(ctx) {
  ctx.effect(ensureStyles)
  const store = createQuickReplyStore(ctx.rpRemote)
  const applyTextEdits = createScopedTextEditor(ctx.sessions, ctx.conversation)
  ctx.slots.inject('conversation.input.right', () => ctx.slots.register({
    name: 'conversation.input.right',
    id: 'rp-quick-replies',
    order: 70,
    inject: () => ({ store, applyTextEdits }),
  }, QuickReplyControl))
}

export function QuickReplyControl(props) {
  const { input, inputActions, sessionId, useSession, useSessions, store, applyTextEdits } = props
  const roleplay = useSessions(state => {
    const summary = state.byId?.[sessionId]
    return isRoleplaySessionSummary(summary) && summary.origin !== 'subagent'
  })
  const removed = useSession(state => state.removed === true)
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot)
  const controlRef = useRef(null)
  const selectionRef = useRef(null)
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
    applyReplyToComposer(inputActions, input.draft, reply.content, target, reply.cursorPosition, {
      applyTextEdits,
      inputState: input,
      selection: selectionRef.current,
      sessionId,
    })
    selectionRef.current = null
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
      onMouseDown: event => keepComposerFocus(event, input, selectionRef),
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
          onMouseDown: event => keepComposerFocus(event, input, selectionRef),
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

export function applyReplyToComposer(inputActions, draft, content, target, cursorPosition, options = {}) {
  const inputState = options.inputState ?? { draft, draftRev: 0, occurrences: [] }
  let selection = options.selection ?? captureComposerSelection(target, inputState)
  if (selection.kind === 'detect' && selection.draftRev !== inputState.draftRev) {
    const end = detectLength(inputState)
    selection = { kind: 'detect', start: end, end, draftRev: inputState.draftRev }
  }
  const clipboardSelection = selection.kind === 'detect'
    ? {
        start: detectToClipboardOffset(selection.start, inputState.occurrences),
        end: detectToClipboardOffset(selection.end, inputState.occurrences),
      }
    : { start: selection.start, end: selection.end }
  const next = insertQuickReply(draft, content, clipboardSelection, cursorPosition)
  if (selection.kind === 'detect' && typeof options.applyTextEdits === 'function') {
    const edits = planQuickReplyEdits(content, selection, cursorPosition)
    if (options.applyTextEdits(options.sessionId, edits, selection.draftRev, next) === true) return next
  }
  inputActions.setDraft(next.text)
  const textarea = findComposerTextarea(target)
  if (textarea !== null) {
    requestAnimationFrame(() => {
      textarea.focus({ preventScroll: true })
      textarea.setSelectionRange(next.selection.start, next.selection.end)
    })
  }
  return next
}

/** Apply an ordered edit plan through the scoped public input event, preserving Lexical nodes around the span. */
export function createScopedTextEditor(sessions, conversation) {
  return (sessionId, edits, expectedRevision, fallback) => {
    const actx = sessions.scope(sessionId)
    if (actx === undefined) return false
    const input = conversation.input.for(actx)
    let applied = 0
    for (const edit of edits) {
      const state = input.state.getSnapshot()
      if (applied === 0 && state.draftRev !== expectedRevision) return false
      const accepted = actx.bail(actx, 'slash/input-insert-text', {
        text: edit.text,
        span: { start: edit.start, end: edit.end, draftRev: state.draftRev },
      }) === true
      if (!accepted) {
        if (applied === 0) return false
        input.setDraft(fallback.text)
        const recovered = input.state.getSnapshot()
        actx.bail(actx, 'slash/input-insert-text', {
          text: '',
          span: {
            start: fallback.selection.start,
            end: fallback.selection.start,
            draftRev: recovered.draftRev,
          },
        })
        return true
      }
      applied += 1
    }
    return true
  }
}

/** Capture the native composer selection in the Lexical detect-coordinate plane. */
export function captureComposerSelection(target, inputState) {
  const end = detectLength(inputState)
  const textarea = findComposerTextarea(target)
  if (textarea !== null) {
    return {
      kind: 'clipboard',
      start: textarea.selectionStart ?? inputState.draft.length,
      end: textarea.selectionEnd ?? inputState.draft.length,
    }
  }
  const editor = findComposerEditor(target)
  const nativeSelection = document.getSelection()
  if (
    editor === null
    || nativeSelection === null
    || nativeSelection.anchorNode === null
    || nativeSelection.focusNode === null
    || !editor.contains(nativeSelection.anchorNode)
    || !editor.contains(nativeSelection.focusNode)
  ) {
    return { kind: 'detect', start: end, end, draftRev: inputState.draftRev }
  }
  const anchor = detectOffsetOfDomPoint(editor, nativeSelection.anchorNode, nativeSelection.anchorOffset, end)
  const focus = detectOffsetOfDomPoint(editor, nativeSelection.focusNode, nativeSelection.focusOffset, end)
  return {
    kind: 'detect',
    start: Math.min(anchor, focus),
    end: Math.max(anchor, focus),
    draftRev: inputState.draftRev,
  }
}

function findComposerTextarea(target) {
  if (!(target instanceof Element)) return null
  const textarea = target.closest('[data-composer-card]')?.querySelector('textarea')
  return textarea instanceof HTMLTextAreaElement ? textarea : null
}

function findComposerEditor(target) {
  if (!(target instanceof Element)) return null
  const editor = target.closest('[data-composer-card]')?.querySelector('[data-composer-input][contenteditable="true"]')
  return editor instanceof HTMLElement ? editor : null
}

function keepComposerFocus(event, inputState, selectionRef) {
  event.preventDefault()
  const textarea = findComposerTextarea(event.currentTarget)
  if (
    textarea !== null
    && document.activeElement !== textarea
    && textarea.selectionStart === 0
    && textarea.selectionEnd === 0
    && inputState.draft.length > 0
  ) {
    textarea.setSelectionRange(inputState.draft.length, inputState.draft.length)
  }
  selectionRef.current = captureComposerSelection(event.currentTarget, inputState)
}

function detectLength(inputState) {
  const draft = typeof inputState?.draft === 'string' ? inputState.draft : ''
  const occurrences = Array.isArray(inputState?.occurrences) ? inputState.occurrences : []
  return Math.max(0, draft.length - occurrences.reduce((total, occurrence) => (
    total + Math.max(0, safeLength(occurrence?.length) - 1)
  ), 0))
}

function detectToClipboardOffset(offset, occurrences) {
  let expansion = 0
  for (const occurrence of Array.isArray(occurrences) ? occurrences : []) {
    const length = safeLength(occurrence?.length)
    const clipboardStart = safeLength(occurrence?.offset)
    const detectStart = clipboardStart - expansion
    if (offset <= detectStart) break
    expansion += Math.max(0, length - 1)
  }
  return offset + expansion
}

function detectOffsetOfDomPoint(editor, node, offset, expectedLength) {
  try {
    const range = document.createRange()
    range.setStart(editor, 0)
    range.setEnd(node, offset)
    const complete = domMetrics(editor)
    const actualBreaks = Math.min(complete.breaks, Math.max(0, expectedLength - complete.base))
    const partial = domMetrics(range.cloneContents())
    let result = partial.base + Math.min(partial.breaks, actualBreaks)
    if (node === editor && offset > 0 && offset < editor.childNodes.length) {
      const before = [...editor.childNodes].slice(0, offset).some(child => child instanceof Element)
      const after = [...editor.childNodes].slice(offset).some(child => child instanceof Element)
      if (before && after) result += 1
    }
    return Math.min(Math.max(result, 0), expectedLength)
  } catch {
    return expectedLength
  }
}

function domMetrics(root) {
  let base = 0
  let breaks = 0
  const topLevelElements = [...root.childNodes].filter(child => child instanceof Element).length
  base += Math.max(0, topLevelElements - 1)
  const visit = node => {
    if (node.nodeType === Node.TEXT_NODE) {
      base += node.textContent?.length ?? 0
      return
    }
    if (!(node instanceof Element)) return
    if (node.matches('[data-composer-chip]')) {
      base += 1
      return
    }
    if (node.tagName === 'BR') {
      breaks += 1
      return
    }
    for (const child of node.childNodes) visit(child)
  }
  for (const child of root.childNodes) visit(child)
  return { base, breaks }
}

function safeLength(value) { return Number.isSafeInteger(value) && value > 0 ? value : 0 }
export { createQuickReplyStore } from './client-store.js'
