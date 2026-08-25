import React, { useEffect, useId, useRef, useState } from 'react'
import { MarkdownText, Pill } from '@deepseek-ai/dsh-client-ui-primitives'
import { m } from 'motion/react'
import { css } from './client-styles.generated.js'

const h = React.createElement
const viewTransition = { duration: 0.16, ease: [0.2, 0, 0, 1] }
const indexTransition = { type: 'spring', stiffness: 420, damping: 34, mass: 0.8 }
const PRESET_GROUPS = [
  { id: 'top', label: '顶部', description: '位于角色资料之前' },
  { id: 'bottom', label: '底部', description: '位于文风和重要规则之后' },
]

export function SessionDocumentBrowser({ items, selectedId, onSelect, indexTitle, countLabel, itemMeta, renderDocument }) {
  const browserId = useId().replaceAll(':', '')
  const documentRef = useRef(null)
  const tabRefs = useRef(new Map())
  const [horizontalIndex, setHorizontalIndex] = useState(false)
  const itemIds = items.map(item => item.id).join('\u0000')
  const activeIndex = Math.max(0, items.findIndex(item => item.id === selectedId))
  const active = items[activeIndex]
  const indexed = items.length > 1

  useEffect(() => {
    if (items.length > 0 && !items.some(item => item.id === selectedId)) onSelect(items[0].id)
  }, [itemIds, onSelect, selectedId])
  useEffect(() => {
    documentRef.current?.scrollTo({ top: 0, behavior: 'auto' })
  }, [selectedId])
  useEffect(() => {
    const media = window.matchMedia('(max-width: 720px)')
    const updateOrientation = () => setHorizontalIndex(media.matches)
    updateOrientation()
    media.addEventListener('change', updateOrientation)
    return () => media.removeEventListener('change', updateOrientation)
  }, [])

  const selectAndFocus = index => {
    const item = items[index]
    if (item === undefined) return
    onSelect(item.id)
    const tab = tabRefs.current.get(item.id)
    tab?.focus()
    tab?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }
  const handleKeyDown = (event, index) => {
    let next
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % items.length
    else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index - 1 + items.length) % items.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = items.length - 1
    else return
    event.preventDefault()
    selectAndFocus(next)
  }

  return h('div', { className: css.sessionDocumentBrowser, 'data-indexed': indexed ? 'true' : 'false' },
    indexed ? h('aside', { className: css.sessionDocumentIndex },
      h('header', null,
        h('strong', null, indexTitle),
        h('small', null, `${countLabel} · 按使用顺序排列`)),
      h('div', { className: css.sessionDocumentIndexList, role: 'tablist', 'aria-label': indexTitle, 'aria-orientation': horizontalIndex ? 'horizontal' : 'vertical' },
        ...items.map((item, index) => {
          const selected = item.id === active?.id
          return h(m.button, {
            key: item.id,
            ref: node => {
              if (node) tabRefs.current.set(item.id, node)
              else tabRefs.current.delete(item.id)
            },
            id: `${browserId}-tab-${index}`,
            type: 'button',
            role: 'tab',
            'aria-selected': selected,
            'aria-controls': `${browserId}-panel`,
            tabIndex: selected ? 0 : -1,
            onClick: () => selectAndFocus(index),
            onKeyDown: event => handleKeyDown(event, index),
            whileHover: { x: 2 },
            whileTap: { scale: 0.99 },
            transition: viewTransition,
          },
          h('span', { className: css.sessionDocumentIndexNumber }, String(index + 1).padStart(2, '0')),
          h('span', { className: css.sessionDocumentIndexCopy },
            h('strong', null, item.name),
            h('small', null, itemMeta(item, index))),
          selected ? h(m.span, { className: css.sessionDocumentIndexIndicator, layoutId: `${browserId}-active`, transition: indexTransition, 'aria-hidden': true }) : null)
        }))) : null,
    h('div', {
      ref: documentRef,
      id: `${browserId}-panel`,
      className: css.sessionDocumentPane,
      role: indexed ? 'tabpanel' : undefined,
      'aria-labelledby': indexed ? `${browserId}-tab-${activeIndex}` : undefined,
      tabIndex: indexed ? 0 : undefined,
    }, active ? h(m.div, {
      key: active.id,
      className: css.sessionDocumentTransition,
      initial: { opacity: 0, y: 5 },
      animate: { opacity: 1, y: 0 },
      transition: viewTransition,
    }, renderDocument(active, activeIndex)) : null))
}

export function WikiDocumentHeader({ eyebrow, title, description, badge }) {
  return h('header', { className: css.documentTitleRow },
    h('div', null,
      h('span', { className: css.eyebrow }, eyebrow),
      h('h3', null, title),
      description ? h('p', { className: css.documentLead }, description) : null),
    badge ? h(Pill, { className: css.documentPill }, badge) : null)
}

export function WikiDetailSection({ label, value, normalizeLeadingHeading = false }) {
  return h('section', { className: css.detailSection },
    h('h4', null, label),
    h(WikiMarkdown, { text: value, normalizeLeadingHeading }))
}

export function PresetWikiDetail({ detail }) {
  const visibleGroups = PRESET_GROUPS.map(group => ({
    ...group,
    fields: (detail.fields ?? []).filter(field => field.position === group.id),
  })).filter(group => group.fields.length > 0)
  if (visibleGroups.length === 0) return h('div', { className: css.wikiDocumentEmpty }, '这个创作预设还没有栏位。')
  return h('div', { className: css.presetDocument }, ...visibleGroups.map(group => h(PresetWikiGroup, { key: group.id, group })))
}

function PresetWikiGroup({ group }) {
  return h('section', { className: css.presetGroup },
    h('header', null,
      h('span', null, h('strong', null, group.label), h('small', null, group.description)),
      h('small', null, `${group.fields.length} 个栏位`)),
    h('div', { className: css.presetFieldList }, ...group.fields.map((field, index) => h('article', { key: field.id, className: css.presetField },
      h('header', null,
        h('span', { className: css.presetFieldNumber }, String(index + 1).padStart(2, '0')),
        h('span', null,
          h('strong', null, field.name),
          field.description ? h('small', null, field.description) : null)),
      h(WikiMarkdown, { text: field.content, empty: '尚未填写内容' })))))
}

export function LoreWikiDetail({ detail }) {
  if (!Array.isArray(detail.entries) || detail.entries.length === 0) return h('div', { className: css.wikiDocumentEmpty }, '这本世界书还没有设定。')
  return h('div', { className: css.loreEntryList }, ...detail.entries.map((entry, index) => h(LoreWikiEntry, { key: entry.id, entry, index })))
}

function LoreWikiEntry({ entry, index }) {
  const [open, setOpen] = useState(index === 0)
  const meta = entry.enabled === false ? '已停用' : entry.constant ? '始终使用' : entry.keys?.length ? `关键词：${entry.keys.slice(0, 3).join('、')}` : '没有触发关键词'
  return h('details', { className: css.loreEntry, open, onToggle: event => setOpen(event.currentTarget.open) },
    h('summary', null,
      h('span', { className: css.loreEntryNumber }, String(index + 1).padStart(2, '0')),
      h('span', null, h('strong', null, entry.name), h('small', null, meta)),
      h('span', { className: css.loreEntryToggle, 'aria-hidden': true }, open ? '−' : '+')),
    h('div', { className: css.loreEntryBody }, h(WikiMarkdown, { text: entry.content, empty: '尚未填写内容' })))
}

export function WikiMarkdown({ text, empty = '暂无内容', normalizeLeadingHeading = false }) {
  if (typeof text !== 'string' || text.trim().length === 0) return h('span', { className: css.wikiDocumentEmpty }, empty)
  const source = normalizeLeadingHeading ? text.replace(/^\s*#{1,6}[ \t]+/, '') : text
  return h('div', { className: css.wikiRichText }, h(MarkdownText, { text: source.replaceAll('<', '&lt;') }))
}
