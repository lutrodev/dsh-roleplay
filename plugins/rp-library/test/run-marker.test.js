import assert from 'node:assert/strict'
import test from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  RpRunMarker,
  applyInactiveOpenTrace,
  inactiveOpenTracePlan,
  latestOpenTurn,
  roleplayRunActivity,
  roleplayRunMarkerDefinition,
} from '../src/run-marker.js'

function timeline(entries) {
  return {
    turnOrder: entries.map(([turn]) => turn),
    turns: new Map(entries.map(([turn, status]) => [turn, { turn, status }])),
  }
}

test('多个 open turn 只把 engine 顺序中的最后一个视为当前活动 turn', () => {
  const value = timeline([[1, 'closed'], [2, 'open'], [7, 'open'], [3, 'closed']])
  assert.equal(latestOpenTurn(value), 7)
  assert.deepEqual(roleplayRunActivity({ running: true, timeline: value, turn: 2 }), {
    active: false,
    status: 'open',
    inactiveOpen: true,
  })
  assert.deepEqual(roleplayRunActivity({ running: true, timeline: value, turn: 7 }), {
    active: true,
    status: 'open',
    inactiveOpen: false,
  })
})

test('Session 已空闲时遗留 open turn 不会重新展开轨迹', () => {
  const value = timeline([[4, 'open']])
  assert.deepEqual(roleplayRunActivity({ running: false, timeline: value, turn: 4 }), {
    active: false,
    status: 'open',
    inactiveOpen: true,
  })
  assert.deepEqual(roleplayRunActivity({ running: false, timeline: value, turn: 9 }), {
    active: false,
    status: 'unknown',
    inactiveOpen: false,
  })
})

test('run marker 从新版独立 Chat projection 读取时间线和节点', () => {
  const value = timeline([[4, 'closed']])
  const chatSnapshot = {
    timeline: value,
    locations: { getTurn: turn => turn === 4 ? [] : ['unexpected'] },
    nodes: new Map(),
  }
  let sessionReads = 0
  let chatReads = 0
  const useSession = (selector) => {
    sessionReads += 1
    return selector({ running: false })
  }
  const useChat = (selector) => {
    chatReads += 1
    return selector(chatSnapshot)
  }
  const originalError = console.error
  console.error = () => {}
  try {
    const html = renderToStaticMarkup(React.createElement(RpRunMarker, {
      node: { data: { runId: 'run-4', turn: 4 } },
      useSession,
      useChat,
    }))
    assert.match(html, /data-rp-run="run-4"/)
    assert.match(html, /data-rp-run-status="closed"/)
  } finally {
    console.error = originalError
  }
  assert.equal(sessionReads, 1)
  assert.equal(chatReads, 3)
})

test('inactive open turn 隐藏上下文、工具与中间推理，保留最后一条可读助手正文', () => {
  const plan = inactiveOpenTracePlan([
    { key: 'user', kind: 'user', data: {} },
    { key: 'context', kind: 'context', data: {} },
    { key: 'reasoning', kind: 'assistant-step', data: { blocks: [{ kind: 'reasoning', text: '分析' }] } },
    { key: 'tool', kind: 'tool-call', data: {} },
    { key: 'draft', kind: 'assistant-step', data: { blocks: [{ kind: 'text', text: '中间文字' }] } },
    { key: 'final', kind: 'assistant-step', data: { blocks: [{ kind: 'reasoning', text: '最终分析' }, { kind: 'text', text: '最终正文' }] } },
    { key: 'error', kind: 'turn-error', data: {} },
  ])
  assert.deepEqual(plan, {
    hiddenKeys: ['context', 'reasoning', 'tool', 'draft'],
    reasoningKeys: ['final'],
  })
})

test('run marker 只匹配 rp-core 的原生上下文消息并保留 run/turn 关联', () => {
  const event = {
    type: 'user/message',
    seq: 12,
    data: {
      source: {
        kind: 'plugin',
        plugin: 'rp-core',
        rpRun: { version: 1, runId: 'run-12', turn: 12, executionMode: 'agent' },
      },
    },
  }
  assert.deepEqual(roleplayRunMarkerDefinition.match(event), { id: 'run-12', role: 'start' })
  assert.equal(roleplayRunMarkerDefinition.match({ ...event, data: { source: { kind: 'user' } } }), null)

  const state = roleplayRunMarkerDefinition.start({}, { event })
  const location = { kind: 'turn', turn: { turn: 12, status: 'open' } }
  const node = roleplayRunMarkerDefinition.buildViewNode({
    key: 'marker-key',
    id: 'run-12',
    state,
    start: { location },
  })
  assert.deepEqual(node, {
    key: 'marker-key',
    kind: 'rp-run-marker',
    id: 'run-12',
    target: 'chat',
    anchorSeq: 11.95,
    location,
    visibility: 'visible',
    data: { runId: 'run-12', turn: 12, executionMode: 'agent' },
  })
})

function row(key) {
  const attributes = new Map([['data-chat-flow-key', key]])
  return {
    getAttribute: name => attributes.get(name) ?? null,
    setAttribute: (name, value) => { attributes.set(name, value) },
    removeAttribute: name => { attributes.delete(name) },
  }
}

test('DOM 标记严格按 turn key 应用，cleanup 不会移除后来接管的标记', () => {
  const context = row('context')
  const final = row('final')
  const other = row('other-turn')
  const root = { querySelectorAll: selector => selector === '[data-chat-flow-key]' ? [context, final, other] : [] }
  const marker = { closest: selector => selector === '[data-chat-flow]' ? root : null }
  const cleanup = applyInactiveOpenTrace(marker, {
    hiddenKeys: ['context'],
    reasoningKeys: ['final'],
  }, 'run-old')

  assert.equal(context.getAttribute('data-rp-library-inactive-open-trace'), 'run-old')
  assert.equal(final.getAttribute('data-rp-library-inactive-open-reasoning'), 'run-old')
  assert.equal(other.getAttribute('data-rp-library-inactive-open-trace'), null)

  final.setAttribute('data-rp-library-inactive-open-reasoning', 'run-new')
  cleanup()
  assert.equal(context.getAttribute('data-rp-library-inactive-open-trace'), null)
  assert.equal(final.getAttribute('data-rp-library-inactive-open-reasoning'), 'run-new')
})
