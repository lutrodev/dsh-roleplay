import React, { useEffect, useRef } from 'react'
import { AnimatePresence, LazyMotion, MotionConfig, domMax, m, useReducedMotion } from 'motion/react'

const h = React.createElement
const ROLEPLAY_ICON_STROKE = Object.freeze({ fill: 'none', stroke: 'currentColor', strokeWidth: 1.25, strokeLinecap: 'round', strokeLinejoin: 'round' })
const PROMPT_SOURCE_ICON_SHAPES = Object.freeze({
  conversation: [
    ['path', { d: 'M2 2.75h12v8.5H7.1l-3.35 2.5v-2.5H2z' }],
    ['path', { d: 'M5 6h6M5 8.5h4' }],
  ],
  state: [
    ['ellipse', { cx: 8, cy: 3.5, rx: 5.25, ry: 1.75 }],
    ['path', { d: 'M2.75 3.5v4c0 .97 2.35 1.75 5.25 1.75s5.25-.78 5.25-1.75v-4M2.75 7.5v4c0 .97 2.35 1.75 5.25 1.75s5.25-.78 5.25-1.75v-4' }],
  ],
  lore: [
    ['circle', { cx: 8, cy: 8, r: 5.75 }],
    ['path', { d: 'M2.5 8h11M8 2.25c1.65 1.55 2.5 3.47 2.5 5.75S9.65 12.2 8 13.75C6.35 12.2 5.5 10.28 5.5 8S6.35 3.8 8 2.25z' }],
  ],
  persona: [
    ['circle', { cx: 8, cy: 5.15, r: 2.6 }],
    ['path', { d: 'M2.75 13.25c.7-2.65 2.45-4 5.25-4s4.55 1.35 5.25 4' }],
  ],
  preset: [
    ['rect', { x: 2.5, y: 2.25, width: 11, height: 11.5, rx: 1.6 }],
    ['path', { d: 'm4.5 6 .8.8 1.45-1.65M8.5 6h2.75M4.5 10l.8.8 1.45-1.65M8.5 10h2.75' }],
  ],
  'writing-style': [
    ['path', { d: 'M3 2.25h8.5v5.5M3 5h5M3 7.5h3.75M3 10h2' }],
    ['path', { d: 'm7 12.75.45-2.15 4.85-4.85 1.95 1.95-4.85 4.85z' }],
  ],
  session: [
    ['path', { d: 'M2.5 4h3M8.5 4h5M2.5 8h6M11.5 8h2M2.5 12h2M7.5 12h6' }],
    ['circle', { cx: 7, cy: 4, r: 1.5 }],
    ['circle', { cx: 10, cy: 8, r: 1.5 }],
    ['circle', { cx: 6, cy: 12, r: 1.5 }],
  ],
  mixed: [
    ['path', { d: 'm8 2 5.5 3L8 8 2.5 5z' }],
    ['path', { d: 'm2.5 8 5.5 3 5.5-3M2.5 11l5.5 3 5.5-3' }],
  ],
  attachment: [['path', { d: 'm6 8.75 4.35-4.35a2.2 2.2 0 0 1 3.1 3.1L8 12.95a3.25 3.25 0 0 1-4.6-4.6l5.1-5.1M5.75 10.5l4.9-4.9' }]],
})

export const workbenchTransition = { duration: 0.16, ease: [0.2, 0, 0, 1] }
export const inspectorTransition = { duration: 0.22, ease: [0.2, 0, 0, 1] }
export const layoutTransition = { type: 'spring', stiffness: 420, damping: 34, mass: 0.8 }

/** Character profile card: deliberately distinct from Harness's agent-node glyph. */
export function IconCharacterCardOutline16({ size = 16, className }) {
  return h('svg', { width: size, height: size, className, viewBox: '0 0 16 16', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' },
    h('rect', { ...ROLEPLAY_ICON_STROKE, x: 1.25, y: 1.75, width: 13.5, height: 12.5, rx: 2 }),
    h('circle', { ...ROLEPLAY_ICON_STROKE, cx: 5.1, cy: 5.7, r: 1.4 }),
    h('path', { ...ROLEPLAY_ICON_STROKE, d: 'M2.95 10.15C3.27 8.72 4.02 8 5.1 8s1.83.72 2.15 2.15' }),
    h('path', { ...ROLEPLAY_ICON_STROKE, d: 'M9.3 5.1h2.8M9.3 7.65h2.8M9.3 10.2h2.8' }))
}

/** Semantic Prompt-source glyphs sharing the Roleplay UI outline language. */
export function IconPromptSourceOutline16({ type = 'attachment', size = 16, className }) {
  if (type === 'character-card') return h(IconCharacterCardOutline16, { size, className })
  const shapes = PROMPT_SOURCE_ICON_SHAPES[type] ?? PROMPT_SOURCE_ICON_SHAPES.attachment
  return h('svg', { width: size, height: size, className, viewBox: '0 0 16 16', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' },
    ...shapes.map(([element, props], index) => h(element, { ...ROLEPLAY_ICON_STROKE, ...props, key: index })))
}

export function LoadingSpinner({ size = 14, className = '' }) {
  ensureWorkbenchStyles()
  const reduced = useReducedMotion()
  return h(m.span, {
    className: `rpui-loadingSpinner ${className}`.trim(),
    style: { '--rpui-loading-spinner-size': `${size}px` },
    initial: false,
    animate: reduced ? undefined : { rotate: 360 },
    transition: reduced ? undefined : { duration: 0.8, repeat: Infinity, ease: 'linear' },
    'aria-hidden': true,
  })
}

export function RpMotionProvider({ children }) {
  ensureWorkbenchStyles()
  return h(MotionConfig, { reducedMotion: 'user', transition: workbenchTransition },
    h(LazyMotion, { features: domMax, strict: true }, children))
}

export function WorkbenchTabs({ items, value, onChange, label = '工作台导航', layoutId = 'rp-workbench-tab' }) {
  ensureWorkbenchStyles()
  const reducedMotion = useReducedMotion()
  const listRef = useRef(null)
  const tabRefs = useRef(new Map())
  const itemIds = items.map(item => item.id).join('\u0000')
  useEffect(() => {
    const list = listRef.current
    const selected = tabRefs.current.get(value)
    if (!list || !selected) return undefined
    const revealSelected = () => {
      const left = selected.offsetLeft
      const right = left + selected.offsetWidth
      const visibleLeft = list.scrollLeft
      const visibleRight = visibleLeft + list.clientWidth
      if (left >= visibleLeft && right <= visibleRight) return
      const centered = left - (list.clientWidth - selected.offsetWidth) / 2
      const maximum = Math.max(0, list.scrollWidth - list.clientWidth)
      list.scrollTo({ left: Math.max(0, Math.min(centered, maximum)), behavior: reducedMotion ? 'auto' : 'smooth' })
    }
    revealSelected()
    if (typeof ResizeObserver !== 'function') return undefined
    const observer = new ResizeObserver(revealSelected)
    observer.observe(list)
    return () => observer.disconnect()
  }, [itemIds, reducedMotion, value])
  const focusTab = index => {
    const item = items[index]
    if (!item) return
    onChange(item.id)
    tabRefs.current.get(item.id)?.focus()
  }
  return h('div', { ref: listRef, className: 'rpui-tabs', role: 'tablist', 'aria-label': label }, ...items.map((item, index) => h(m.button, {
    key: item.id,
    ref: node => {
      if (node) tabRefs.current.set(item.id, node)
      else tabRefs.current.delete(item.id)
    },
    type: 'button',
    role: 'tab',
    'aria-selected': value === item.id,
    tabIndex: value === item.id ? 0 : -1,
    className: 'rpui-tab',
    onClick: () => onChange(item.id),
    onKeyDown: event => {
      let nextIndex
      if (event.key === 'ArrowRight') nextIndex = (index + 1) % items.length
      else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + items.length) % items.length
      else if (event.key === 'Home') nextIndex = 0
      else if (event.key === 'End') nextIndex = items.length - 1
      else return
      event.preventDefault()
      focusTab(nextIndex)
    },
    whileTap: { scale: 0.98 },
  },
  item.icon ? h('span', { className: 'rpui-tab-icon', 'aria-hidden': true }, item.icon) : null,
  h('span', null, item.label),
  item.meta ? h('small', null, item.meta) : null,
  value === item.id ? h(m.span, { className: 'rpui-tab-indicator', layoutId, transition: layoutTransition }) : null)))
}

export function ContentTransition({ viewKey, children, className = '' }) {
  return h(m.div, {
    key: viewKey,
    className: `rpui-content ${className}`.trim(),
    initial: false,
    animate: { opacity: 1, y: 0 },
    transition: workbenchTransition,
  }, children)
}

export function DocumentOutline({ items, active, onSelect, label = '文档目录' }) {
  if (!Array.isArray(items) || items.length === 0) return null
  return h('nav', { className: 'rpui-outline', 'aria-label': label }, ...items.map(item => h('button', {
    key: item.id,
    type: 'button',
    className: active === item.id ? 'is-active' : undefined,
    onClick: () => onSelect(item.id),
  }, item.label)))
}

export function DirtyBar({ dirty, message = '有未保存的修改', error, saving, disabled = false, onDiscard, onSave, saveLabel = '保存' }) {
  const reduced = useReducedMotion()
  return h(AnimatePresence, null, dirty || error ? h(m.div, {
    className: 'rpui-dirtybar',
    role: error ? 'alert' : 'status',
    initial: { opacity: 0, ...(reduced ? {} : { y: 8 }) },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, ...(reduced ? {} : { y: 8 }) },
  },
  h('span', null, h('strong', null, error ? '没有保存成功' : message), error ? h('small', null, error) : null),
  dirty && onDiscard ? h('button', { type: 'button', onClick: onDiscard, disabled: saving || disabled }, '撤销修改') : null,
  dirty && onSave ? h('button', { type: 'button', className: 'rpui-primary', onClick: onSave, disabled: saving || disabled }, saving ? '正在保存…' : saveLabel) : null) : null)
}

export function Inspector({ open, title, description, onClose, children, footer }) {
  const reduced = useReducedMotion()
  const panelRef = useRef(null)
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement
    panelRef.current?.focus()
    return () => { if (previous instanceof HTMLElement) previous.focus() }
  }, [open])
  return h(AnimatePresence, null, open ? h(React.Fragment, null,
    h(m.button, { className: 'rpui-inspector-scrim', type: 'button', 'aria-label': '关闭编辑面板', onClick: onClose, initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }),
    h(m.aside, {
      ref: panelRef,
      tabIndex: -1,
      className: 'rpui-inspector',
      role: 'dialog',
      'aria-modal': true,
      'aria-label': title,
      initial: { opacity: 0, ...(reduced ? {} : { x: 24 }) },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, ...(reduced ? {} : { x: 24 }) },
      transition: inspectorTransition,
    },
    h('header', null, h('span', null, h('h3', null, title), description ? h('p', null, description) : null), h('button', { type: 'button', onClick: onClose, 'aria-label': '关闭' }, '×')),
    h('div', { className: 'rpui-inspector-body' }, children),
    footer ? h('footer', null, footer) : null)) : null)
}

export function useWorkbenchModal(open) {
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement
    const scrollRoots = [...new Set([
      document.documentElement,
      document.body,
      ...document.querySelectorAll('[data-conversation-scroll]'),
    ])]
    const unlock = scrollRoots.map(lockScrollRoot)
    const root = ref.current?.closest('[role="dialog"]')
    const timer = window.setTimeout(() => {
      const initial = ref.current?.querySelector(FOCUSABLE_SELECTOR)
      if (initial instanceof HTMLElement) initial.focus()
      else ref.current?.focus()
    }, 0)
    const trap = event => {
      if (event.key !== 'Tab' || !root) return
      const focusable = [...root.querySelectorAll(FOCUSABLE_SELECTOR)]
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable.at(-1)
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', trap)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('keydown', trap)
      unlock.forEach(release => release())
      if (previous instanceof HTMLElement) previous.focus()
    }
  }, [open])
  return ref
}

const FOCUSABLE_SELECTOR = 'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), summary, [tabindex]:not([tabindex="-1"])'
const scrollLocks = new Map()

function lockScrollRoot(element) {
  const active = scrollLocks.get(element)
  if (active) {
    active.count += 1
  } else {
    scrollLocks.set(element, {
      count: 1,
      overflow: element.style.overflow,
      overscrollBehavior: element.style.overscrollBehavior,
    })
    element.style.overflow = 'hidden'
    element.style.overscrollBehavior = 'none'
  }
  return () => {
    const current = scrollLocks.get(element)
    if (!current) return
    current.count -= 1
    if (current.count > 0) return
    element.style.overflow = current.overflow
    element.style.overscrollBehavior = current.overscrollBehavior
    scrollLocks.delete(element)
  }
}

let styleMounted = false
export function ensureWorkbenchStyles() {
  if (styleMounted || typeof document === 'undefined') return
  styleMounted = true
  const style = document.createElement('style')
  style.dataset.rpAgentUi = 'true'
  style.textContent = `
.rpui-loadingSpinner{display:inline-block;width:var(--rpui-loading-spinner-size,14px);height:var(--rpui-loading-spinner-size,14px);box-sizing:border-box;flex:0 0 auto;border:2px solid currentColor;border-top-color:transparent;border-radius:50%}.rpui-tabs{display:flex;gap:3px;padding:3px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-1,#f5f5f5) 82%,transparent);border-radius:13px;width:max-content;max-width:100%;overflow:auto;overscroll-behavior-inline:contain;scroll-snap-type:x proximity;scrollbar-width:none}.rpui-tabs::-webkit-scrollbar{display:none}.rpui-tab{position:relative;isolation:isolate;display:grid;grid-template-columns:16px minmax(0,auto);grid-template-areas:"icon label" "icon meta";align-items:center;gap:0 7px;min-width:104px;padding:6px 10px;border:0;background:transparent;color:var(--dsw-alias-label-secondary,#666);border-radius:10px;cursor:pointer;text-align:left;scroll-snap-align:center}.rpui-tab[aria-selected="true"]{color:var(--dsw-alias-label-primary,#111)}.rpui-tab>span:not(.rpui-tab-indicator):not(.rpui-tab-icon){grid-area:label;font-size:12px;line-height:17px;font-weight:600}.rpui-tab>span.rpui-tab-icon:not(.rpui-tab-indicator){display:grid;grid-area:icon;place-items:center}.rpui-tab small{grid-area:meta;color:var(--dsw-alias-label-tertiary,#8a8a8a);font-size:10px;line-height:14px}.rpui-tab-indicator{position:absolute;z-index:-1;inset:0;border-radius:10px;background:var(--dsw-alias-bg-base,#fff);box-shadow:0 1px 5px rgba(0,0,0,.08)}.rpui-content{display:flex;min-height:0;flex:1;flex-direction:column}.rpui-outline{display:flex;flex-direction:column;gap:2px;position:sticky;top:0}.rpui-outline button{border:0;border-left:2px solid transparent;background:transparent;padding:8px 10px;color:var(--dsw-alias-text-secondary,#666);text-align:left;cursor:pointer}.rpui-outline button.is-active{border-color:var(--dsw-alias-brand-primary,#111);color:var(--dsw-alias-text-primary,#111);font-weight:650}.rpui-dirtybar{position:absolute;z-index:20;left:50%;bottom:18px;transform:translateX(-50%);display:flex;align-items:center;gap:10px;max-width:min(720px,calc(100% - 32px));padding:9px 10px 9px 14px;border:1px solid var(--dsw-alias-border-secondary,#ddd);border-radius:14px;background:var(--dsw-alias-bg-base,#fff);box-shadow:0 12px 36px rgba(0,0,0,.14)}.rpui-dirtybar>span{display:flex;flex-direction:column;min-width:180px;margin-right:auto}.rpui-dirtybar small{color:var(--dsw-alias-text-error,#b42318)}.rpui-dirtybar button,.rpui-inspector button{border:1px solid var(--dsw-alias-border-secondary,#ddd);border-radius:9px;background:transparent;padding:7px 11px;cursor:pointer}.rpui-dirtybar .rpui-primary{border-color:#111;background:#111;color:#fff}.rpui-inspector-scrim{position:fixed;z-index:90;inset:0;border:0;background:rgba(0,0,0,.16)}.rpui-inspector{position:fixed;z-index:91;inset:0 0 0 auto;width:min(480px,100%);display:flex;flex-direction:column;background:var(--dsw-alias-bg-base,#fff);box-shadow:-16px 0 42px rgba(0,0,0,.16);outline:0}.rpui-inspector>header{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:20px 22px;border-bottom:1px solid var(--dsw-alias-border-secondary,#e5e5e5)}.rpui-inspector h3,.rpui-inspector p{margin:0}.rpui-inspector p{margin-top:4px;color:var(--dsw-alias-text-secondary,#666);font-size:13px}.rpui-inspector>header button{border:0;font-size:23px;padding:0 5px}.rpui-inspector-body{overflow:auto;flex:1;padding:22px}.rpui-inspector>footer{display:flex;justify-content:flex-end;gap:8px;padding:14px 22px;border-top:1px solid var(--dsw-alias-border-secondary,#e5e5e5)}
@media(max-width:720px){.rpui-tabs{width:100%}.rpui-tab{min-width:96px;flex:1}.rpui-inspector{width:100%}.rpui-outline{position:static;flex-direction:row;overflow:auto}.rpui-dirtybar{bottom:10px}.rpui-dirtybar>span{min-width:0}}
@media(prefers-reduced-motion:reduce){.rpui-tab,.rpui-outline button{scroll-behavior:auto}}
`
  document.head.append(style)
}
