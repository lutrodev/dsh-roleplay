import React, { useId, useState } from 'react'
import { AnimatePresence, m, useReducedMotion } from 'motion/react'
import { Button, Modal } from '@deepseek-ai/dsh-client-ui-primitives'
import {
  DEFAULT_REPLY_OPTIONS_COUNT,
  normalizeReplyOptionKeywords,
  REPLY_OPTION_KEYWORD_MAX_CHARACTERS,
  REPLY_OPTIONS_MAX_ITEMS,
  REPLY_OPTIONS_MIN_ITEMS,
} from 'dsh-roleplay-rp-reply-options/protocol'
import { css } from './client-styles.generated.js'

const h = React.createElement
const MotionForm = m.form
const KEYWORD_PLACEHOLDERS = Object.freeze(['例如：试探', '例如：反抗', '例如：暂时退让', '例如：寻求帮助', '例如：离开现场'])

/** Configure the exact option count and one optional main-model direction per option. */
export function ReplyOptionsSettingsDialog({ open, count, keywords, writable, saving, onSave, onClose }) {
  const reduced = useReducedMotion()
  const countHelpId = useId()
  const directionHelpId = useId()
  const errorId = useId()
  const currentCount = validCount(count) ? count : DEFAULT_REPLY_OPTIONS_COUNT
  const currentKeywords = normalizeReplyOptionKeywords(keywords, currentCount)
  const [countDraft, setCountDraft] = useState(String(currentCount))
  const [keywordDrafts, setKeywordDrafts] = useState(() => keywordSlots(currentKeywords))
  const [saveError, setSaveError] = useState('')
  const parsedCount = parseCountDraft(countDraft)
  const visibleCount = parsedCount ?? currentCount
  const keywordErrorIndex = keywordDrafts
    .slice(0, visibleCount)
    .findIndex(value => [...normalizeKeywordDraft(value)].length > REPLY_OPTION_KEYWORD_MAX_CHARACTERS)
  const validationError = parsedCount === undefined
    ? '请输入 1 到 5 之间的整数。'
    : keywordErrorIndex >= 0
      ? `选项 ${keywordErrorIndex + 1} 的方向关键词最多 ${REPLY_OPTION_KEYWORD_MAX_CHARACTERS} 个字符。`
      : ''
  const nextKeywords = parsedCount === undefined || keywordErrorIndex >= 0
    ? undefined
    : normalizeReplyOptionKeywords(keywordDrafts.slice(0, parsedCount), parsedCount)
  const changed = parsedCount !== undefined
    && nextKeywords !== undefined
    && (parsedCount !== currentCount || !sameStrings(nextKeywords, currentKeywords))

  if (!open) return null

  const save = async () => {
    if (!writable || saving || parsedCount === undefined || nextKeywords === undefined || !changed) return
    setSaveError('')
    try {
      if (await onSave({ count: parsedCount, keywords: nextKeywords })) onClose()
      else setSaveError('回复选项设置没有保存，请稍后重试。')
    } catch {
      setSaveError('回复选项设置没有保存，请稍后重试。')
    }
  }
  const footer = h('div', { className: css.replyOptionsSettingsFooter },
    h(Button, { type: 'button', variant: 'outline', disabled: saving, onClick: onClose }, '取消'),
    h(Button, {
      type: 'button',
      variant: 'primary',
      disabled: !writable || saving || validationError.length > 0 || !changed,
      onClick: () => { void save() },
    }, saving ? '正在保存…' : '保存设置'))

  return h(Modal, {
    open: true,
    onClose: saving ? () => {} : onClose,
    title: '设置回复选项',
    closeLabel: '关闭回复选项设置',
    description: '设置主模型生成的选项数量，并为每个编号指定可选的剧情方向。',
    className: css.replyOptionsDialog,
    contentClassName: css.replyOptionsDialogContent,
    footer,
  }, h(MotionForm, {
    className: css.replyOptionsSettingsForm,
    onSubmit: event => { event.preventDefault(); void save() },
    initial: reduced ? false : { opacity: 0, y: 4 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduced ? 0 : 0.14 },
  },
  h('div', { className: css.replyOptionsCountSection },
    h('label', { className: css.replyOptionsCountField },
      h('span', null, '回复条数'),
      h('input', {
        type: 'number',
        inputMode: 'numeric',
        min: REPLY_OPTIONS_MIN_ITEMS,
        max: REPLY_OPTIONS_MAX_ITEMS,
        step: 1,
        value: countDraft,
        autoFocus: true,
        disabled: saving,
        'aria-invalid': parsedCount === undefined ? 'true' : 'false',
        'aria-describedby': `${countHelpId} ${errorId}`,
        onInput: event => { setCountDraft(event.currentTarget.value); setSaveError('') },
      })),
    h('p', { id: countHelpId, className: css.replyOptionsSettingsHint },
      '可填写 1–5；下方方向输入框会与条数同步。')),
  h('section', { className: css.replyOptionsKeywordSection, 'aria-labelledby': 'rp-reply-options-keywords-title' },
    h('header', { className: css.replyOptionsKeywordHeader },
      h('div', null,
        h('h3', { id: 'rp-reply-options-keywords-title' }, '方向关键词'),
        h('p', { id: directionHelpId }, '每条选项对应一个方向；留空时由模型自行决定。')),
      h('span', null, '可选')),
    h('div', { className: css.replyOptionsKeywordList },
      h(AnimatePresence, { initial: false }, ...Array.from({ length: visibleCount }, (_, index) => {
        const value = keywordDrafts[index] ?? ''
        const characters = [...normalizeKeywordDraft(value)].length
        const invalid = characters > REPLY_OPTION_KEYWORD_MAX_CHARACTERS
        return h(m.label, {
          key: index,
          className: css.replyOptionsKeywordRow,
          layout: !reduced,
          initial: reduced ? false : { opacity: 0, y: -4 },
          animate: { opacity: 1, y: 0 },
          exit: reduced ? { opacity: 1 } : { opacity: 0, y: -4 },
          transition: { duration: reduced ? 0 : 0.12 },
        },
        h('span', { className: css.replyOptionsKeywordNumber, 'aria-hidden': true }, index + 1),
        h('span', { className: css.replyOptionsKeywordField },
          h('span', null, `选项 ${index + 1} 的方向关键词`),
          h('input', {
            type: 'text',
            value,
            placeholder: KEYWORD_PLACEHOLDERS[index],
            autoComplete: 'off',
            disabled: saving,
            'aria-label': `选项 ${index + 1} 的方向关键词`,
            'aria-invalid': invalid ? 'true' : 'false',
            'aria-describedby': `${directionHelpId} ${errorId}`,
            onChange: event => {
              const next = [...keywordDrafts]
              next[index] = event.currentTarget.value
              setKeywordDrafts(next)
              setSaveError('')
            },
          })),
        h('span', {
          className: css.replyOptionsKeywordCount,
          'data-invalid': invalid ? 'true' : 'false',
          'aria-hidden': true,
        }, `${characters}/${REPLY_OPTION_KEYWORD_MAX_CHARACTERS}`))
      }))),
    h('p', { className: css.replyOptionsKeywordNote },
      '关键词只指导对应编号的生成方向，不会作为标题或标签拼入发送消息。')),
  h('p', {
    id: errorId,
    className: css.replyOptionsSettingsError,
    role: validationError.length > 0 || saveError.length > 0 ? 'alert' : undefined,
  }, validationError || saveError)))
}

export function parseCountDraft(value) {
  if (typeof value !== 'string' || !/^[1-5]$/u.test(value.trim())) return undefined
  return Number(value.trim())
}

function keywordSlots(value) {
  return Array.from({ length: REPLY_OPTIONS_MAX_ITEMS }, (_, index) => value[index] ?? '')
}

function normalizeKeywordDraft(value) {
  return typeof value === 'string' ? value.replaceAll(/\s+/gu, ' ').trim() : ''
}

function validCount(value) {
  return Number.isSafeInteger(value)
    && value >= REPLY_OPTIONS_MIN_ITEMS
    && value <= REPLY_OPTIONS_MAX_ITEMS
}

function sameStrings(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index])
}
