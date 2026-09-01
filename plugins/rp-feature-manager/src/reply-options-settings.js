import React, { useId, useState } from 'react'
import { Button, Modal } from '@deepseek-ai/dsh-client-ui-primitives'
import {
  DEFAULT_REPLY_OPTION_MAX_CHARACTERS,
  DEFAULT_REPLY_OPTIONS_COUNT,
  normalizeReplyOptionKeywords,
  REPLY_OPTION_MAX_CHARACTERS,
  REPLY_OPTION_KEYWORD_MAX_CHARACTERS,
  REPLY_OPTIONS_MAX_ITEMS,
  REPLY_OPTIONS_MIN_ITEMS,
} from 'dsh-roleplay-rp-reply-options/protocol'
import { css } from './client-styles.generated.js'

const h = React.createElement
const KEYWORD_PLACEHOLDERS = Object.freeze(['例如：试探', '例如：反抗', '例如：暂时退让', '例如：寻求帮助', '例如：离开现场'])

/** Configure count, maximum length, and one optional main-model direction per option. */
export function ReplyOptionsSettingsDialog({
  open,
  count,
  maxCharacters,
  keywords,
  writable,
  saving,
  onSave,
  onClose,
}) {
  const basicsHelpId = useId()
  const directionHelpId = useId()
  const errorId = useId()
  const currentCount = validCount(count) ? count : DEFAULT_REPLY_OPTIONS_COUNT
  const currentMaxCharacters = validMaxCharacters(maxCharacters)
    ? maxCharacters
    : DEFAULT_REPLY_OPTION_MAX_CHARACTERS
  const currentKeywords = normalizeReplyOptionKeywords(keywords, currentCount)
  const [countDraft, setCountDraft] = useState(String(currentCount))
  const [maxCharactersDraft, setMaxCharactersDraft] = useState(String(currentMaxCharacters))
  const [keywordDrafts, setKeywordDrafts] = useState(() => keywordSlots(currentKeywords))
  const [saveError, setSaveError] = useState('')
  const parsedCount = parseCountDraft(countDraft)
  const parsedMaxCharacters = parseMaxCharactersDraft(maxCharactersDraft)
  const visibleCount = parsedCount ?? currentCount
  const keywordErrorIndex = keywordDrafts
    .slice(0, visibleCount)
    .findIndex(value => [...normalizeKeywordDraft(value)].length > REPLY_OPTION_KEYWORD_MAX_CHARACTERS)
  const validationError = parsedCount === undefined
    ? '请输入 1 到 5 之间的整数。'
    : parsedMaxCharacters === undefined
      ? `请输入 1 到 ${REPLY_OPTION_MAX_CHARACTERS} 之间的整数。`
    : keywordErrorIndex >= 0
      ? `选项 ${keywordErrorIndex + 1} 的方向关键词最多 ${REPLY_OPTION_KEYWORD_MAX_CHARACTERS} 个字符。`
      : ''
  const nextKeywords = parsedCount === undefined || keywordErrorIndex >= 0
    ? undefined
    : normalizeReplyOptionKeywords(keywordDrafts.slice(0, parsedCount), parsedCount)
  const changed = parsedCount !== undefined
    && parsedMaxCharacters !== undefined
    && nextKeywords !== undefined
    && (parsedCount !== currentCount
      || parsedMaxCharacters !== currentMaxCharacters
      || !sameStrings(nextKeywords, currentKeywords))

  if (!open) return null

  const save = async () => {
    if (!writable || saving || parsedCount === undefined || parsedMaxCharacters === undefined
      || nextKeywords === undefined || !changed) return
    setSaveError('')
    try {
      if (await onSave({
        count: parsedCount,
        maxCharacters: parsedMaxCharacters,
        keywords: nextKeywords,
      })) onClose()
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
    description: '设置主模型生成的选项数量、每条字数上限和可选方向。',
    className: css.replyOptionsDialog,
    contentClassName: css.replyOptionsDialogContent,
    footer,
  }, h('form', {
    className: css.replyOptionsSettingsForm,
    onSubmit: event => { event.preventDefault(); void save() },
  },
  h('div', { className: css.replyOptionsBasicSection },
    h('div', { className: css.replyOptionsBasicFields },
      h('label', { className: css.replyOptionsBasicField },
        h('span', null, '回复条数'),
        h('span', { className: css.replyOptionsNumberInput },
          h('input', {
            type: 'number',
            inputMode: 'numeric',
            min: REPLY_OPTIONS_MIN_ITEMS,
            max: REPLY_OPTIONS_MAX_ITEMS,
            step: 1,
            value: countDraft,
            autoFocus: true,
            disabled: saving,
            'aria-label': '回复条数',
            'aria-invalid': parsedCount === undefined ? 'true' : 'false',
            'aria-describedby': `${basicsHelpId} ${errorId}`,
            onInput: event => { setCountDraft(event.currentTarget.value); setSaveError('') },
          }),
          h('span', { 'aria-hidden': true }, '条'))),
      h('label', { className: css.replyOptionsBasicField },
        h('span', null, '每条最多字数'),
        h('span', { className: css.replyOptionsNumberInput },
          h('input', {
            type: 'number',
            inputMode: 'numeric',
            min: 1,
            max: REPLY_OPTION_MAX_CHARACTERS,
            step: 1,
            value: maxCharactersDraft,
            disabled: saving,
            'aria-label': '每条最多字数',
            'aria-invalid': parsedMaxCharacters === undefined ? 'true' : 'false',
            'aria-describedby': `${basicsHelpId} ${errorId}`,
            onInput: event => { setMaxCharactersDraft(event.currentTarget.value); setSaveError('') },
          }),
          h('span', { 'aria-hidden': true }, '字')))),
    h('p', { id: basicsHelpId, className: css.replyOptionsSettingsHint },
      `回复条数可填写 1–5；每条最多字数可填写 1–${REPLY_OPTION_MAX_CHARACTERS}，默认 ${DEFAULT_REPLY_OPTION_MAX_CHARACTERS} 字以内。`)),
  h('section', { className: css.replyOptionsKeywordSection, 'aria-labelledby': 'rp-reply-options-keywords-title' },
    h('header', { className: css.replyOptionsKeywordHeader },
      h('div', null,
        h('h3', { id: 'rp-reply-options-keywords-title' }, '方向关键词'),
        h('p', { id: directionHelpId }, '每条选项对应一个方向；留空时由模型自行决定。')),
      h('span', null, '可选')),
    h('div', { className: css.replyOptionsKeywordList },
      ...Array.from({ length: visibleCount }, (_, index) => {
        const value = keywordDrafts[index] ?? ''
        const characters = [...normalizeKeywordDraft(value)].length
        const invalid = characters > REPLY_OPTION_KEYWORD_MAX_CHARACTERS
        return h('label', {
          key: index,
          className: css.replyOptionsKeywordRow,
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
      })),
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

export function parseMaxCharactersDraft(value) {
  if (typeof value !== 'string' || !/^\d{1,3}$/u.test(value.trim())) return undefined
  const parsed = Number(value.trim())
  return validMaxCharacters(parsed) ? parsed : undefined
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

function validMaxCharacters(value) {
  return Number.isSafeInteger(value) && value >= 1 && value <= REPLY_OPTION_MAX_CHARACTERS
}

function sameStrings(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index])
}
