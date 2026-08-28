// @vitest-environment jsdom
import React from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@deepseek-ai/dsh-client-ui-primitives', () => ({
  IconChevronDownOutline14: () => null,
  IconDataOutline16: () => null,
}))
vi.mock('motion/react', async () => {
  const ReactModule = await vi.importActual('react')
  return {
    AnimatePresence: ({ children }) => children,
    LazyMotion: ({ children }) => children,
    MotionConfig: ({ children }) => children,
    domAnimation: {},
    m: new Proxy({}, {
      get: (_target, tag) => ({ children, initial: _initial, animate: _animate, exit: _exit, transition: _transition, ...props }) => ReactModule.createElement(tag, props, children),
    }),
  }
})

import {
  StateDisplayAnchor,
  StateVariableCard,
  apply,
} from '../src/client.js'
import { ensureStyles } from '../src/client-styles.generated.js'

afterEach(cleanup)

describe('Roleplay current variable card', () => {
  it('registers two public conversation nodes and their keyed renderers', () => {
    const definitions = []
    const slots = []
    const ctx = {
      effect: cleanup => cleanup,
      uiConversation: { events: { register: definition => definitions.push(definition) } },
      slots: {
        inject: (_name, callback) => callback(),
        register: (config, component) => { slots.push({ config, component }); return () => {} },
      },
    }
    apply(ctx)
    expect(definitions.map(item => item.kind)).toEqual(['rp-state-display-anchor', 'rp-state-display-retraction'])
    expect(slots.map(item => item.config.key)).toEqual(['rp-state-display-anchor', 'rp-state-display-retraction'])
  })

  it('reads the active card from the independent Chat view for a projected Roleplay summary', () => {
    const node = {
      key: 'state-anchor',
      kind: 'rp-state-display-anchor',
      data: { turn: 1, assistantSeq: 8 },
    }
    const chat = { order: [node.key], nodes: new Map([[node.key, node]]) }
    const projections = {
      'rp/state': {
        namespaces: {
          story: {
            value: { hp: 7 },
            definition: { title: '故事状态', schema: { type: 'object' } },
          },
        },
      },
      'rp/state/activity': { available: true, namespaces: {} },
    }
    render(React.createElement(StateDisplayAnchor, {
      node,
      sessionId: 'session-1',
      useChat: selector => selector(chat),
      useSessions: selector => selector({
        byId: { 'session-1': { projectionValues: { agentPreset: 'roleplay' } } },
      }),
      useProjection: key => projections[key],
    }))

    expect(screen.getByLabelText('当前会话变量')).toBeTruthy()
  })

  it('renders schema labels, all values, recent changes, and long-value disclosure', () => {
    const longText = '港口的雾沿着石阶漫上来。'.repeat(20)
    const projections = {
      'rp/state': {
        namespaces: {
          story: {
            value: { profile: { mood: '谨慎', note: longText }, hp: 7, flags: [true, false] },
            definition: {
              title: '故事状态',
              description: '当前剧情中的关键变量。',
              schema: {
                type: 'object',
                properties: {
                  profile: {
                    type: 'object', title: '人物状态', description: '角色目前的内在状态。',
                    properties: {
                      mood: { type: 'string', title: '情绪' },
                      note: { type: 'string', title: '备注' },
                    },
                  },
                  hp: { type: 'integer', title: '生命值', description: '当前生命值。' },
                  flags: { type: 'array', title: '标记', items: { type: 'boolean' } },
                },
              },
            },
          },
        },
      },
      'rp/state/activity': { available: true, namespaces: { story: [{
        op: 'increment', path: '/hp', reason: '受到伤害',
        before: { exists: true, value: 10 }, after: { exists: true, value: 7 },
      }] } },
    }
    render(React.createElement(StateVariableCard, { useProjection: key => projections[key] }))

    expect(screen.getByLabelText('当前会话变量')).toBeTruthy()
    const cardToggle = screen.getByRole('button', { name: '展开会话变量' })
    expect(cardToggle.getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByText('故事状态')).toBeNull()
    fireEvent.click(cardToggle)
    expect(screen.getByRole('button', { name: '折叠会话变量' }).getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByText('故事状态')).toBeTruthy()
    expect(screen.getByText('人物状态')).toBeTruthy()
    expect(screen.getByText('情绪')).toBeTruthy()
    expect(screen.getByText('谨慎')).toBeTruthy()
    expect(screen.getByText('生命值')).toBeTruthy()
    expect(screen.getByText('10')).toBeTruthy()
    expect(screen.getByText('7')).toBeTruthy()
    expect(screen.getByText('→')).toBeTruthy()
    expect(screen.getByText('之前值：')).toBeTruthy()
    expect(screen.getByText('当前值：')).toBeTruthy()
    expect(screen.getByText('第 1 项')).toBeTruthy()
    expect(screen.getByText('是')).toBeTruthy()
    expect(screen.getByText('本轮更新 1')).toBeTruthy()
    expect(document.querySelectorAll('[data-updated="true"]')).toHaveLength(1)
    expect(document.querySelectorAll('[class*="updatedDot"]')).toHaveLength(1)
    expect(document.querySelectorAll('[data-rp-state-display-transition="true"]')).toHaveLength(1)
    const disclosure = screen.getByRole('button', { name: '展开完整内容' })
    fireEvent.click(disclosure)
    expect(screen.getByRole('button', { name: '收起内容' })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: '折叠会话变量' }))
    expect(screen.queryByText('人物状态')).toBeNull()
    expect(screen.getByRole('button', { name: '展开会话变量' })).toBeTruthy()
  })

  it('folds container-only levels into breadcrumbs while preserving one key/value grid', () => {
    const projections = {
      'rp/state': {
        namespaces: {
          story: {
            value: {
              role: {
                heroine: {
                  core: { virtue: 70, fall: 35 },
                  status: { mood: '平静' },
                  location: '教室',
                },
              },
            },
            definition: {
              title: '故事状态',
              schema: {
                type: 'object',
                properties: {
                  role: {
                    type: 'object', title: '角色', properties: {
                      heroine: {
                        type: 'object', title: '王熙雯', properties: {
                          core: {
                            type: 'object', title: '核心', properties: {
                              virtue: { type: 'integer', title: '贞操值' },
                              fall: { type: 'integer', title: '堕落值' },
                            },
                          },
                          status: {
                            type: 'object', title: '状态', properties: {
                              mood: { type: 'string', title: '当前情绪' },
                            },
                          },
                          location: { type: 'string', title: '所在位置' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      'rp/state/activity': { available: true, namespaces: {} },
    }
    render(React.createElement(StateVariableCard, { useProjection: key => projections[key] }))
    fireEvent.click(screen.getByRole('button', { name: '展开会话变量' }))

    const paths = [...document.querySelectorAll('[data-rp-state-display-breadcrumb]')]
      .map(element => element.getAttribute('data-rp-state-display-breadcrumb'))
    expect(paths).toEqual([
      '角色 › 王熙雯 › 核心',
      '角色 › 王熙雯 › 状态',
      '角色 › 王熙雯',
    ])
    expect(screen.getByText('贞操值')).toBeTruthy()
    expect(screen.getByText('70')).toBeTruthy()
    expect(screen.getByText('当前情绪')).toBeTruthy()
    expect(screen.getByText('平静')).toBeTruthy()
    expect(screen.getByText('所在位置')).toBeTruthy()
    expect(screen.getByText('教室')).toBeTruthy()
    expect(document.querySelectorAll('[class*="groupChildren"]')).toHaveLength(3)
  })

  it('replaces stale generated styles and disposes its owned tag', () => {
    const stale = document.createElement('style')
    stale.id = 'dsh-roleplay-rp-state-display-styles'
    stale.textContent = 'stale'
    document.head.append(stale)
    const dispose = ensureStyles()
    const current = document.getElementById('dsh-roleplay-rp-state-display-styles')
    expect(stale.isConnected).toBe(false)
    expect(current?.dataset.plugin).toBe('dsh-roleplay-rp-state-display')
    dispose()
    expect(document.getElementById('dsh-roleplay-rp-state-display-styles')).toBeNull()
  })
})
