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

import {
  QuickReplyControl,
  captureComposerSelection,
  createScopedTextEditor,
  inject as clientInject,
} from '../src/client.js'
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
  const input = { draft, draftRev: 1, occurrences: [], phase: 'plain' }
  return {
    store,
    sessionId: 'session-1',
    inputActions: { setDraft: vi.fn() },
    useInput: selector => selector(input),
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

function renderLexicalComposer(store, initialDraft = '港口') {
  const applyTextEdits = vi.fn(() => true)
  const setDraft = vi.fn()
  const props = sessionProps(store, initialDraft)
  props.useInput = selector => selector({ draft: initialDraft, draftRev: 7, occurrences: [], phase: 'plain' })
  props.inputActions.setDraft = setDraft
  props.applyTextEdits = applyTextEdits
  render(React.createElement('div', { 'data-composer-card': true },
    React.createElement('div', {
      'aria-label': '富文本消息',
      contentEditable: true,
      'data-composer-input': true,
      suppressContentEditableWarning: true,
    }, React.createElement('p', null,
      React.createElement('span', { 'data-lexical-text': true }, initialDraft))),
    React.createElement(QuickReplyControl, props)))
  return { applyTextEdits, editor: screen.getByLabelText('富文本消息'), setDraft }
}

describe('快捷回复输入栏', () => {
  it('declares every Cordis service read during client apply', () => {
    expect(clientInject).toEqual(['slots', 'rpRemote', 'sessions', 'conversation'])
  })

  it('reads the composer state from the standard session hook without legacy owner props', () => {
    const props = sessionProps(fixedStore())
    expect(props).not.toHaveProperty('input')
    render(React.createElement(QuickReplyControl, props))
    expect(screen.getByRole('button', { name: '插入快捷回复：继续' })).toBeTruthy()
  })

  it('loads and saves the shared Host catalog through one client store', async () => {
    let current = readyState()
    const connection = { call: vi.fn(async (_path, endpoint, payload) => {
      if (endpoint === 'replace') current = { ...current, replies: payload.replies, revision: 1 }
      return { ok: true, value: { ok: true, value: current } }
    }) }
    const store = createQuickReplyStore(connection)
    await store.load()
    expect(store.getSnapshot().replies).toHaveLength(3)
    await store.replace([{ id: 'nod', label: '点头', content: '*点头*', cursorPosition: 'end' }])
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

  it('places the caret at the end when a paired reply is configured for the end', async () => {
    const replies = DEFAULT_QUICK_REPLIES.map(reply => reply.id === 'double-quote'
      ? { ...reply, cursorPosition: 'end' }
      : reply)
    const { setDraft, textarea } = renderComposer(fixedStore(readyState({ replies })))
    textarea.setSelectionRange(2, 2)
    fireEvent.click(screen.getByRole('button', { name: '插入快捷回复：“”' }))
    expect(setDraft).toHaveBeenCalledWith('港口“”')
    await waitFor(() => expect(textarea.selectionStart).toBe(4))
  })

  it('uses the scoped Lexical edit event and leaves the caret between paired content', () => {
    const { applyTextEdits, editor, setDraft } = renderLexicalComposer(fixedStore())
    const text = editor.querySelector('[data-lexical-text]').firstChild
    const range = document.createRange()
    range.setStart(text, 1)
    range.collapse(true)
    const selection = document.getSelection()
    selection.removeAllRanges()
    selection.addRange(range)

    const button = screen.getByRole('button', { name: '插入快捷回复：（）' })
    fireEvent.mouseDown(button)
    fireEvent.click(button)

    expect(applyTextEdits).toHaveBeenCalledWith('session-1', [
      { start: 1, end: 1, text: '（）' },
      { start: 2, end: 2, text: '' },
    ], 7, {
      text: '港（）口',
      selection: { start: 2, end: 2 },
    })
    expect(setDraft).not.toHaveBeenCalled()
  })

  it('uses one scoped Lexical edit and leaves the caret at the end when configured', () => {
    const { applyTextEdits, editor, setDraft } = renderLexicalComposer(fixedStore())
    const text = editor.querySelector('[data-lexical-text]').firstChild
    const range = document.createRange()
    range.setStart(text, 1)
    range.collapse(true)
    const selection = document.getSelection()
    selection.removeAllRanges()
    selection.addRange(range)

    const button = screen.getByRole('button', { name: '插入快捷回复：继续' })
    fireEvent.mouseDown(button)
    fireEvent.click(button)

    expect(applyTextEdits).toHaveBeenCalledWith('session-1', [
      { start: 1, end: 1, text: '继续' },
    ], 7, {
      text: '港继续口',
      selection: { start: 3, end: 3 },
    })
    expect(setDraft).not.toHaveBeenCalled()
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

    const replies = [...DEFAULT_QUICK_REPLIES, { id: 'aside', label: '旁白', content: '请从旁白视角继续。', cursorPosition: 'end' }]
    render(React.createElement(QuickReplyControl, sessionProps(fixedStore(readyState({ replies })))))
    expect(screen.getByRole('button', { name: '更多快捷回复' }).className).not.toContain('compactOnly')
  })

  it('does not repeat identical reply content and keeps custom content as secondary copy', () => {
    const replies = [...DEFAULT_QUICK_REPLIES, { id: 'aside', label: '旁白', content: '请从旁白视角继续。', cursorPosition: 'end' }]
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

describe('Lexical 输入坐标', () => {
  it('counts block gaps and reference chips in the editor detect plane', () => {
    const { container } = render(React.createElement('div', { 'data-composer-card': true },
      React.createElement('div', {
        contentEditable: true,
        'data-composer-input': true,
        suppressContentEditableWarning: true,
      },
      React.createElement('p', null, React.createElement('span', null, 'A')),
      React.createElement('p', null,
        React.createElement('span', { 'data-composer-chip': 'file', contentEditable: false }, '文件'),
        React.createElement('span', null, 'BC'))),
      React.createElement('button', { type: 'button' }, '快捷回复')))
    const editor = container.querySelector('[data-composer-input]')
    const target = container.querySelector('button')
    const text = editor.querySelector('p:last-child span:last-child').firstChild
    const range = document.createRange()
    range.setStart(text, 1)
    range.collapse(true)
    const selection = document.getSelection()
    selection.removeAllRanges()
    selection.addRange(range)

    expect(captureComposerSelection(target, {
      draft: 'A\n/@fileBC',
      draftRev: 9,
      occurrences: [{ offset: 2, length: 6 }],
    })).toEqual({ kind: 'detect', start: 4, end: 4, draftRev: 9 })
  })

  it('applies multi-step caret placement with a fresh revision for every scoped edit', () => {
    let revision = 4
    const requests = []
    const actx = {
      bail: vi.fn((_subject, event, request) => {
        expect(event).toBe('slash/input-insert-text')
        requests.push(request)
        revision += 1
        return true
      }),
    }
    const input = {
      state: { getSnapshot: () => ({ draftRev: revision }) },
      setDraft: vi.fn(),
    }
    const applyTextEdits = createScopedTextEditor(
      { scope: vi.fn(() => actx) },
      { input: { for: vi.fn(() => input) } },
    )

    expect(applyTextEdits('session-1', [
      { start: 2, end: 2, text: '”' },
      { start: 2, end: 2, text: '“' },
    ], 4, { text: '港口“”', selection: { start: 3, end: 3 } })).toBe(true)
    expect(requests).toEqual([
      { text: '”', span: { start: 2, end: 2, draftRev: 4 } },
      { text: '“', span: { start: 2, end: 2, draftRev: 5 } },
    ])
    expect(input.setDraft).not.toHaveBeenCalled()
  })
})
