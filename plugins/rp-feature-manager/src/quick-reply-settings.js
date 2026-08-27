import React, { useEffect, useState, useSyncExternalStore } from 'react'
import { AnimatePresence, m, useReducedMotion } from 'motion/react'
import {
  Button,
  IconChevronDownOutline14,
  IconChevronUpOutline14,
  IconPlusOutline16,
  IconTrashOutline16,
  Modal,
  Tooltip,
} from '@deepseek-ai/dsh-client-ui-primitives'
import { createQuickReplyStore, friendlyQuickReplyRequestError } from 'dsh-roleplay-rp-quick-replies/client-store'
import { DEFAULT_QUICK_REPLIES, normalizeQuickReplies } from 'dsh-roleplay-rp-quick-replies/protocol'
import { css } from './client-styles.generated.js'

const h = React.createElement

export { createQuickReplyStore }

/** Roleplay Settings owns customization; the composer only inserts saved replies. */
export function QuickReplyManager({ open, store, onClose }) {
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot)

  useEffect(() => {
    if (!open || state.phase !== 'idle') return
    void store.load().catch(() => {})
  }, [open, state.phase, store])

  if (!open) return null
  const ready = state.phase === 'ready' || state.phase === 'saving'
  if (!ready) {
    const failed = state.phase === 'error'
    return h(Modal, {
      open: true,
      onClose,
      title: '设置快捷回复',
      closeLabel: '关闭快捷回复设置',
      description: '前三项会显示在输入栏；更多项目会收进“更多快捷回复”菜单。',
      className: css.quickDialog,
      contentClassName: css.quickDialogContent,
    }, h('div', { className: css.quickLoadState },
      h('p', { role: failed ? 'alert' : 'status' }, failed ? state.error : '正在读取快捷回复…'),
      failed ? h('button', { type: 'button', onClick: () => { void store.load().catch(() => {}) } }, '重新加载') : null))
  }
  return h(QuickReplyEditor, { state, store, onClose })
}

function QuickReplyEditor({ state, store, onClose }) {
  const reduced = useReducedMotion()
  const [draft, setDraft] = useState(() => state.replies.map(reply => ({ ...reply })))
  const [error, setError] = useState('')
  const saving = state.phase === 'saving'
  const changed = JSON.stringify(draft) !== JSON.stringify(state.replies)
  const totalCharacters = draft.reduce((total, reply) => total + characters(reply.content), 0)
  const update = (id, field, value) => setDraft(current => current.map(reply => reply.id === id ? { ...reply, [field]: value } : reply))
  const remove = id => setDraft(current => current.filter(reply => reply.id !== id))
  const move = (index, direction) => setDraft(current => moveReply(current, index, direction))
  const add = () => {
    if (draft.length >= state.limits.replies) return
    const used = new Set(draft.map(reply => reply.label))
    let ordinal = draft.length + 1
    while (used.has(`新回复 ${ordinal}`)) ordinal += 1
    setDraft(current => [...current, { id: createReplyId(), label: `新回复 ${ordinal}`, content: '' }])
  }
  const save = async event => {
    event.preventDefault()
    if (!state.writable || saving) return
    let normalized
    try { normalized = normalizeQuickReplies(draft) }
    catch (validationError) { setError(validationMessage(validationError)); return }
    try {
      await store.replace(normalized)
      onClose()
    } catch (requestError) {
      setError(friendlyQuickReplyRequestError(requestError, 'save'))
    }
  }
  const footer = h('div', { className: css.quickFooter },
    h('button', {
      type: 'button', className: css.quickResetButton, disabled: saving,
      onClick: () => { setDraft(DEFAULT_QUICK_REPLIES.map(reply => ({ ...reply }))); setError('') },
    }, '恢复默认'),
    h('span', null,
      h(Button, { variant: 'outline', disabled: saving, onClick: onClose }, '取消'),
      h(Button, { variant: 'primary', disabled: !state.writable || saving || !changed, onClick: event => { void save(event) } }, saving ? '正在保存…' : '保存快捷回复')))

  return h(Modal, {
    open: true,
    onClose: saving ? () => {} : onClose,
    title: '设置快捷回复',
    closeLabel: '关闭快捷回复设置',
    description: '前三项会显示在输入栏；更多项目会收进“更多快捷回复”菜单。点击后只会插入草稿，不会立即发送。',
    className: css.quickDialog,
    contentClassName: css.quickDialogContent,
    footer,
  }, h('form', { className: css.quickManager, onSubmit: event => { void save(event) } },
    h('div', { className: css.quickManagerToolbar },
      h('span', null, `${draft.length} / ${state.limits.replies} 项 · ${totalCharacters} / ${state.limits.totalCharacters} 字符`),
      h(m.button, {
        type: 'button', className: css.quickAddButton,
        disabled: saving || draft.length >= state.limits.replies,
        whileTap: { scale: 0.98 }, onClick: add,
      }, h(IconPlusOutline16, { size: 15 }), '新增快捷回复')),
    !state.writable
      ? h('div', { className: css.quickNotice, role: 'status' }, '当前环境可以使用已有快捷回复，但不能保存修改。')
      : null,
    error.length > 0 ? h('div', { className: css.quickError, role: 'alert' }, error) : null,
    draft.length === 0
      ? h('div', { className: css.quickEmpty }, h('strong', null, '还没有快捷回复'), h('span', null, '新增一项后，输入时就能一键插入常用内容。'))
      : h('ol', { className: css.quickReplyList },
          h(AnimatePresence, { initial: false },
            ...draft.map((reply, index) => h(ReplyEditorRow, {
              key: reply.id,
              reply,
              index,
              total: draft.length,
              limits: state.limits,
              saving,
              reduced,
              onUpdate: (field, value) => update(reply.id, field, value),
              onMove: direction => move(index, direction),
              onRemove: () => remove(reply.id),
            })))))
  )
}

function ReplyEditorRow({ reply, index, total, limits, saving, reduced, onUpdate, onMove, onRemove }) {
  return h(m.li, {
    className: css.quickReplyRow,
    layout: true,
    initial: reduced ? false : { opacity: 0, y: 5 },
    animate: { opacity: 1, y: 0 },
    exit: reduced ? { opacity: 0 } : { opacity: 0, x: 12 },
    transition: { duration: reduced ? 0 : 0.14 },
  },
  h('span', { className: css.quickOrder, 'aria-hidden': true }, index + 1),
  h('div', { className: css.quickFields },
    h('label', { className: css.quickLabelField },
      h('span', null, '按钮名称', h('small', null, `${characters(reply.label)} / ${limits.labelCharacters}`)),
      h('input', {
        value: reply.label, disabled: saving, placeholder: '例如：继续',
        'aria-label': `第 ${index + 1} 项按钮名称`,
        onChange: event => onUpdate('label', event.target.value),
      })),
    h('label', { className: css.quickContentField },
      h('span', null, '插入内容', h('small', null, `${characters(reply.content)} / ${limits.contentCharacters}`)),
      h('textarea', {
        rows: 2, value: reply.content, disabled: saving,
        placeholder: '填写点击后插入输入框的完整内容',
        'aria-label': `第 ${index + 1} 项插入内容`,
        onChange: event => onUpdate('content', event.target.value),
      }))),
  h('div', { className: css.quickRowActions },
    h(ActionButton, { label: '上移', disabled: saving || index === 0, onClick: () => onMove(-1) }, h(IconChevronUpOutline14, { size: 14 })),
    h(ActionButton, { label: '下移', disabled: saving || index === total - 1, onClick: () => onMove(1) }, h(IconChevronDownOutline14, { size: 14 })),
    h(ActionButton, { label: '删除', danger: true, disabled: saving, onClick: onRemove }, h(IconTrashOutline16, { size: 14 }))))
}

function ActionButton({ label, disabled, danger = false, onClick, children }) {
  return h(Tooltip, { label, side: 'top', delayMs: 400, disabled },
    h(m.button, {
      type: 'button', className: danger ? css.quickDangerAction : css.quickRowAction,
      disabled, 'aria-label': label, whileTap: { scale: 0.94 }, onClick,
    }, children))
}

export function moveReply(replies, index, direction) {
  const target = index + direction
  if (index < 0 || index >= replies.length || target < 0 || target >= replies.length) return replies
  const next = [...replies]
  ;[next[index], next[target]] = [next[target], next[index]]
  return next
}

function characters(value) { return [...value].length }

function createReplyId() {
  const uuid = globalThis.crypto?.randomUUID?.()
  return uuid === undefined
    ? `reply-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
    : `reply-${uuid}`
}

function validationMessage(error) {
  if (error?.code === 'DUPLICATE_LABEL' || error?.code === 'DUPLICATE_REPLY') return '每个快捷回复需要使用不同的名称。'
  if (error?.code === 'LIMIT_EXCEEDED') return '快捷回复数量或内容超过上限，请精简后再保存。'
  return '请填写每项快捷回复的按钮名称和插入内容。'
}
