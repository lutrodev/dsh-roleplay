// @vitest-environment jsdom
import React from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('motion/react', async () => {
  const ReactModule = await vi.importActual('react')
  return {
    LazyMotion: ({ children }) => children,
    MotionConfig: ({ children }) => children,
    domAnimation: {},
    useReducedMotion: () => false,
    m: new Proxy({}, {
      get: (_target, tag) => ({
        children, initial: _initial, animate: _animate, transition: _transition,
        whileTap: _whileTap, ...props
      }) => ReactModule.createElement(tag, props, children),
    }),
  }
})

import {
  apply,
  createReplySender,
  inject as clientInject,
  ReplyOptionsAnchor,
  ReplyOptionsCard,
  replyOptionsMotion,
} from '../src/client.js'
import { ensureStyles } from '../src/client-styles.generated.js'

afterEach(cleanup)

const options = ['熙雯伸手推开门，谨慎地走进去。', '她先从窗边观察里面的动静。', '熙雯回头寻找能帮忙的同伴。']

describe('Roleplay reply options', () => {
  it('registers its public conversation nodes and declares every client service it reads', () => {
    expect(clientInject).toEqual(['slots', 'uiConversation', 'sessions', 'conversation'])
    const definitions = []
    const slots = []
    const send = vi.fn()
    const ctx = {
      effect: cleanupEffect => cleanupEffect,
      uiConversation: { events: { register: definition => definitions.push(definition) } },
      sessions: { scope: () => ({ get: () => ({ send }) }) },
      conversation: {},
      slots: {
        inject: (_name, callback) => callback(),
        register: (config, component) => { slots.push({ config, component }); return () => {} },
      },
    }
    apply(ctx)
    expect(definitions.map(item => item.kind)).toEqual(['rp-reply-options-anchor', 'rp-reply-options-retraction'])
    expect(slots.map(item => item.config.key)).toEqual(['rp-reply-options-anchor', 'rp-reply-options-retraction'])
    expect(typeof slots[0].config.inject().sendReply).toBe('function')
  })

  it('renders only the active non-subagent Roleplay choices and sends the exact selected text', async () => {
    const sendReply = vi.fn(async () => {})
    const setDraft = vi.fn()
    const node = { key: 'reply-anchor', data: { options } }
    const chat = { order: [node.key], nodes: new Map([[node.key, { ...node, kind: 'rp-reply-options-anchor' }]]) }
    const props = {
      node,
      sessionId: 'session-1',
      useChat: selector => selector(chat),
      useSessions: selector => selector({
        byId: { 'session-1': { projectionValues: { agentPreset: 'roleplay' }, origin: 'user' } },
      }),
      useSession: selector => selector({ removed: false }),
      useInput: selector => selector({ phase: 'plain', draft: '保留这段草稿' }),
      inputActions: { setDraft },
      sendReply,
    }
    render(React.createElement(ReplyOptionsAnchor, props))
    expect(screen.getByRole('heading', { name: '接下来想怎么做？' })).toBeTruthy()
    expect(screen.getByRole('list').querySelectorAll('li')).toHaveLength(3)
    expect(screen.getByText('1').getAttribute('aria-hidden')).toBe('true')
    expect(screen.getByText('2').getAttribute('aria-hidden')).toBe('true')
    expect(screen.getByText('3').getAttribute('aria-hidden')).toBe('true')
    fireEvent.click(screen.getByRole('button', { name: options[1] }))
    await waitFor(() => expect(sendReply).toHaveBeenCalledWith('session-1', options[1]))
    expect(sendReply).toHaveBeenCalledTimes(1)
    expect(setDraft).not.toHaveBeenCalled()

    cleanup()
    props.useSessions = selector => selector({
      byId: { 'session-1': { projectionValues: { agentPreset: 'roleplay' }, origin: 'subagent' } },
    })
    render(React.createElement(ReplyOptionsAnchor, props))
    expect(screen.queryByRole('heading', { name: '接下来想怎么做？' })).toBeNull()

    cleanup()
    props.useSessions = selector => selector({
      byId: { 'session-1': { projectionValues: { agentPreset: 'minimal' }, origin: 'user' } },
    })
    render(React.createElement(ReplyOptionsAnchor, props))
    expect(screen.queryByRole('heading', { name: '接下来想怎么做？' })).toBeNull()
  })

  it('prevents duplicate sends, disables every option while pending, and keeps exact copy visible', async () => {
    let resolveSend
    const sendReply = vi.fn(() => new Promise(resolve => { resolveSend = resolve }))
    render(React.createElement(ReplyOptionsCard, { options, sessionId: 'session-1', sendReply }))
    const first = screen.getByRole('button', { name: options[0] })
    expect(first.tagName).toBe('BUTTON')
    expect(first.getAttribute('type')).toBe('button')
    first.focus()
    expect(document.activeElement).toBe(first)
    fireEvent.click(first)
    fireEvent.click(screen.getByRole('button', { name: options[1] }))
    expect(sendReply).toHaveBeenCalledTimes(1)
    expect(sendReply).toHaveBeenCalledWith('session-1', options[0])
    expect(screen.getByText(options[0])).toBeTruthy()
    expect(screen.getByRole('status').textContent).toBe('正在发送…')
    screen.getAllByRole('button').forEach(button => expect(button.disabled).toBe(true))
    resolveSend()
  })

  it('renders and sends one configured option', async () => {
    const sendReply = vi.fn(async () => {})
    render(React.createElement(ReplyOptionsCard, { options: [options[0]], sessionId: 'session-1', sendReply }))
    fireEvent.click(screen.getByRole('button', { name: options[0] }))
    await waitFor(() => expect(sendReply).toHaveBeenCalledWith('session-1', options[0]))
    expect(screen.getAllByRole('button')).toHaveLength(1)
  })

  it('numbers every configured option from one through five without changing its message text', () => {
    const fiveOptions = [...options, '她暂时保持沉默，留意四周。', '熙雯转身离开，去找能帮忙的人。']
    render(React.createElement(ReplyOptionsCard, {
      options: fiveOptions,
      sessionId: 'session-1',
      sendReply: vi.fn(async () => {}),
    }))
    expect(screen.getAllByRole('listitem')).toHaveLength(5)
    for (const number of ['1', '2', '3', '4', '5']) {
      expect(screen.getByText(number).getAttribute('aria-hidden')).toBe('true')
    }
    expect(screen.getByRole('button', { name: fiveOptions[4] })).toBeTruthy()
  })

  it('restores every choice with a friendly retry message after a send failure', async () => {
    const sendReply = vi.fn(async () => { throw new Error('internal transport details') })
    render(React.createElement(ReplyOptionsCard, { options, sessionId: 'session-1', sendReply }))
    fireEvent.click(screen.getByRole('button', { name: options[2] }))
    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toBe('这条回复没能发送，请再试一次。')
    expect(screen.getByRole('alert').textContent).not.toContain('internal transport')
    screen.getAllByRole('button').forEach(button => expect(button.disabled).toBe(false))
  })

  it('addresses conversation.send through the scoped Session and preserves reduced-motion feedback', async () => {
    const send = vi.fn(async () => {})
    const sessions = { scope: vi.fn(() => ({ get: vi.fn(() => ({ send })) })) }
    await createReplySender(sessions)('session-7', options[0])
    expect(sessions.scope).toHaveBeenCalledWith('session-7')
    expect(send).toHaveBeenCalledWith(options[0])
    expect(replyOptionsMotion(false)).toEqual({
      initial: { opacity: 0, y: 4 }, animate: { opacity: 1, y: 0 },
      transition: { duration: 0.16, ease: [0.2, 0, 0, 1] }, whileTap: { scale: 0.985 },
    })
    expect(replyOptionsMotion(true)).toEqual({
      initial: { opacity: 0, y: 0 }, animate: { opacity: 1, y: 0 },
      transition: { duration: 0, ease: [0.2, 0, 0, 1] }, whileTap: undefined,
    })
  })

  it('replaces stale generated styles and disposes its owned tag', () => {
    const stale = document.createElement('style')
    stale.id = 'dsh-roleplay-rp-reply-options-styles'
    stale.textContent = 'stale'
    document.head.append(stale)
    const dispose = ensureStyles()
    const current = document.getElementById('dsh-roleplay-rp-reply-options-styles')
    expect(stale.isConnected).toBe(false)
    expect(current?.dataset.plugin).toBe('dsh-roleplay-rp-reply-options')
    dispose()
    expect(document.getElementById('dsh-roleplay-rp-reply-options-styles')).toBeNull()
  })
})
