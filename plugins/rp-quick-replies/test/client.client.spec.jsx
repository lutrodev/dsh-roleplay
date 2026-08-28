// @vitest-environment jsdom
import React from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@deepseek-ai/dsh-client-ui-primitives', () => ({
  Button: ({ children, ...props }) => React.createElement('button', props, children),
  Tooltip: ({ children }) => children,
  Modal: ({ open, title, children, footer }) => open
    ? React.createElement('div', { role: 'dialog', 'aria-label': title }, children, footer)
    : null,
  Menu: ({ open, anchor, items, footer = [], onSelect }) => React.createElement(React.Fragment, null,
    anchor,
    open ? [...items, ...footer].map(item => React.createElement('button', {
      key: item.id, type: 'button', disabled: item.disabled, onClick: () => onSelect(item.id),
    }, item.label)) : null),
  IconChevronDownOutline14: () => null,
  IconChevronUpOutline14: () => null,
  IconEditOutline16: () => null,
  IconEllipsisOutline16: () => null,
  IconPlusOutline16: () => null,
  IconRefreshOutline14: () => null,
  IconTrashOutline16: () => null,
}))

vi.mock('motion/react', async () => {
  const ReactModule = await vi.importActual('react')
  return {
    AnimatePresence: ({ children }) => children,
    LazyMotion: ({ children }) => children,
    MotionConfig: ({ children }) => children,
    domAnimation: {},
    useReducedMotion: () => true,
    m: new Proxy({}, {
      get: (_target, tag) => ({ children, whileHover: _hover, whileTap: _tap, layout: _layout, initial: _initial, animate: _animate, exit: _exit, transition: _transition, ...props }) => ReactModule.createElement(tag, props, children),
    }),
  }
})

import { QuickReplyControl } from '../src/client.js'
import { createQuickReplyStore } from '../src/client-store.js'
import { DEFAULT_QUICK_REPLIES } from '../src/protocol.js'

afterEach(cleanup)
beforeEach(() => { vi.stubGlobal('requestAnimationFrame', callback => window.setTimeout(callback, 0)) })

function readyState(overrides = {}) {
  return {
    phase: 'ready',
    replies: DEFAULT_QUICK_REPLIES.map(reply => ({ ...reply })),
    writable: true,
    revision: 0,
    limits: { replies: 12, labelCharacters: 12, contentCharacters: 2000, totalCharacters: 8000 },
    error: null,
    ...overrides,
  }
}

function fixedStore(snapshot = readyState()) {
  return {
    subscribe: () => () => {},
    getSnapshot: () => snapshot,
    load: vi.fn(async () => snapshot),
    replace: vi.fn(async () => snapshot),
  }
}

function sessionProps(store, draft = '港口') {
  return {
    store,
    sessionId: 'session-1',
    input: { draft, phase: 'plain' },
    inputActions: { setDraft: vi.fn() },
    useSessions: selector => selector({ byId: { 'session-1': { projectionValues: { agentPreset: 'roleplay' }, origin: 'user' } } }),
    useSession: selector => selector({ removed: false }),
  }
}

function renderComposer(store, initialDraft = '港口') {
  const setDraft = vi.fn()
  function ComposerHarness() {
    const [draft, updateDraft] = React.useState(initialDraft)
    const props = sessionProps(store, draft)
    props.inputActions.setDraft = value => { setDraft(value); updateDraft(value) }
    return React.createElement('div', { 'data-composer-card': true },
      React.createElement('textarea', {
        value: draft,
        onChange: event => updateDraft(event.target.value),
        'aria-label': '消息',
      }),
      React.createElement(QuickReplyControl, props))
  }
  render(React.createElement(ComposerHarness))
  return { setDraft, textarea: screen.getByLabelText('消息') }
}

describe('快捷回复输入栏', () => {
  it('loads and saves the shared Host catalog through one client store', async () => {
    let current = readyState()
    const connection = { call: vi.fn(async (_path, endpoint, payload) => {
      if (endpoint === 'replace') current = { ...current, replies: payload.replies, revision: 1 }
      return { ok: true, value: { ok: true, value: current } }
    }) }
    const store = createQuickReplyStore(connection)
    await store.load()
    expect(store.getSnapshot().replies).toHaveLength(3)
    await store.replace([{ id: 'nod', label: '点头', content: '*点头*' }])
    expect(store.getSnapshot().replies[0].label).toBe('点头')
    expect(connection.call).toHaveBeenLastCalledWith('/rp-quick-replies', 'replace', expect.objectContaining({ expectedRevision: 0 }))
  })

  it('inserts a visible quick reply at the textarea caret without sending', async () => {
    const store = fixedStore()
    const { setDraft, textarea } = renderComposer(store)
    textarea.setSelectionRange(2, 2)
    fireEvent.click(screen.getByRole('button', { name: '插入快捷回复：继续' }))
    expect(setDraft).toHaveBeenCalledWith('港口继续')
    await waitFor(() => expect(textarea.selectionStart).toBe(4))
  })

  it('appends on the first quick-reply click when the composer has never been focused', async () => {
    const store = fixedStore()
    const { setDraft, textarea } = renderComposer(store)
    const button = screen.getByRole('button', { name: '插入快捷回复：继续' })
    fireEvent.mouseDown(button)
    fireEvent.click(button)
    expect(setDraft).toHaveBeenCalledWith('港口继续')
    await waitFor(() => expect(textarea.selectionStart).toBe(4))
  })

  it('does not render in ordinary non-Roleplay conversations', () => {
    const store = fixedStore()
    const props = sessionProps(store)
    props.useSessions = selector => selector({ byId: { 'session-1': { projectionValues: { agentPreset: 'default' } } } })
    const { container } = render(React.createElement(QuickReplyControl, props))
    expect(container.innerHTML).toBe('')
  })

  it('keeps the more menu visually compact for three replies and exposes it for overflow replies', () => {
    const compact = render(React.createElement(QuickReplyControl, sessionProps(fixedStore())))
    expect(screen.getByRole('button', { name: '更多快捷回复' }).className).toContain('compactOnly')
    compact.unmount()

    const replies = [...DEFAULT_QUICK_REPLIES, { id: 'aside', label: '旁白', content: '请从旁白视角继续。' }]
    render(React.createElement(QuickReplyControl, sessionProps(fixedStore(readyState({ replies })))))
    expect(screen.getByRole('button', { name: '更多快捷回复' }).className).not.toContain('compactOnly')
  })

  it('does not repeat identical reply content and keeps custom content as secondary copy', () => {
    const replies = [...DEFAULT_QUICK_REPLIES, { id: 'aside', label: '旁白', content: '请从旁白视角继续。' }]
    render(React.createElement(QuickReplyControl, sessionProps(fixedStore(readyState({ replies })))))
    fireEvent.click(screen.getByRole('button', { name: '更多快捷回复' }))

    const quote = screen.getByRole('button', { name: '“”' })
    expect(quote.textContent).toBe('“”')
    expect(quote.querySelector('small')).toBeNull()

    const aside = screen.getByRole('button', { name: '旁白请从旁白视角继续。' })
    expect(aside.querySelector('strong')?.textContent).toBe('旁白')
    expect(aside.querySelector('small')?.textContent).toBe('请从旁白视角继续。')
  })
})
