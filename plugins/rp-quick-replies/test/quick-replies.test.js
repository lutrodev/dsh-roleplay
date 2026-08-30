import assert from 'node:assert/strict'
import test from 'node:test'
import { Context } from '@deepseek-ai/cordis'
import { SettingsProvider } from '@deepseek-ai/dsh-settings'
import * as QuickRepliesPlugin from '../src/index.js'
import {
  DEFAULT_QUICK_REPLIES,
  MAX_QUICK_REPLIES,
  normalizeQuickReplies,
  insertQuickReply,
  planQuickReplyEdits,
} from '../src/protocol.js'

class MemorySettings extends SettingsProvider {
  constructor(ctx, config = {}) {
    super(ctx)
    this.document = structuredClone(config.document ?? {})
  }

  get writable() { return true }
  async load() { return structuredClone(this.document) }
  async persist(namespace, section) { this.document[namespace] = structuredClone(section) }
}

test('validates the complete reply collection at exact and over-limit boundaries', () => {
  const twelve = Array.from({ length: MAX_QUICK_REPLIES }, (_, index) => ({
    id: `reply-${index}`,
    label: `回复${index}`,
    content: 'x',
  }))
  assert.equal(normalizeQuickReplies(twelve).length, MAX_QUICK_REPLIES)
  assert.throws(() => normalizeQuickReplies([...twelve, { id: 'overflow', label: '超限', content: 'x' }]), error => error.code === 'LIMIT_EXCEEDED')

  const exactTotal = Array.from({ length: 5 }, (_, index) => ({
    id: `total-${index}`,
    label: `总量${index}`,
    content: '字'.repeat(1600),
  }))
  assert.equal(normalizeQuickReplies(exactTotal).reduce((sum, reply) => sum + [...reply.content].length, 0), 8000)
  exactTotal[4] = { ...exactTotal[4], content: '字'.repeat(1601) }
  assert.throws(() => normalizeQuickReplies(exactTotal), error => error.code === 'LIMIT_EXCEEDED')
  assert.throws(() => normalizeQuickReplies([
    { id: 'same-a', label: '继续', content: 'A' },
    { id: 'same-b', label: '继续', content: 'B' },
  ]), error => error.code === 'DUPLICATE_LABEL')
  assert.throws(() => normalizeQuickReplies([
    { id: 'invalid-cursor', label: '无效', content: '内容', cursorPosition: 'start' },
  ]), error => error.code === 'INVALID_REQUEST')
  assert.deepEqual(normalizeQuickReplies([
    { id: 'legacy-pair', label: '旧括号', content: '（）' },
    { id: 'legacy-text', label: '旧文本', content: '继续' },
  ]), [
    { id: 'legacy-pair', label: '旧括号', content: '（）', cursorPosition: 'middle' },
    { id: 'legacy-text', label: '旧文本', content: '继续', cursorPosition: 'end' },
  ])
})

test('places the caret in the configured middle or end and preserves paired selection text', () => {
  assert.deepEqual(DEFAULT_QUICK_REPLIES.slice(0, 2), [
    { id: 'double-quote', label: '“”', content: '“”', cursorPosition: 'middle' },
    { id: 'parentheses', label: '（）', content: '（）', cursorPosition: 'middle' },
  ])
  assert.deepEqual(insertQuickReply('港口', '继续', { start: 2, end: 2 }, 'end'), {
    text: '港口继续', selection: { start: 4, end: 4 },
  })
  assert.deepEqual(insertQuickReply('港口', '（）', { start: 2, end: 2 }, 'middle'), {
    text: '港口（）', selection: { start: 3, end: 3 },
  })
  assert.deepEqual(insertQuickReply('港口', '（）', { start: 2, end: 2 }, 'end'), {
    text: '港口（）', selection: { start: 4, end: 4 },
  })
  assert.deepEqual(insertQuickReply('hello', '“”', { start: 1, end: 4 }, 'middle'), {
    text: 'h“ell”o', selection: { start: 2, end: 2 },
  })
  assert.deepEqual(insertQuickReply('hello', '“”', { start: 1, end: 4 }, 'end'), {
    text: 'h“”o', selection: { start: 3, end: 3 },
  })
  assert.deepEqual(insertQuickReply('hello', '()', { start: 5, end: 5 }, 'middle'), {
    text: 'hello()', selection: { start: 6, end: 6 },
  })
  assert.deepEqual(insertQuickReply('', '🙂🙂', { start: 0, end: 0 }, 'middle'), {
    text: '🙂🙂', selection: { start: 2, end: 2 },
  })
  assert.deepEqual(planQuickReplyEdits('“”', { start: 1, end: 4 }, 'middle'), [
    { start: 4, end: 4, text: '”' },
    { start: 1, end: 1, text: '“' },
  ])
  assert.deepEqual(planQuickReplyEdits('🙂继续', { start: 3, end: 3 }, 'middle'), [
    { start: 3, end: 3, text: '🙂继续' },
    { start: 5, end: 5, text: '' },
  ])
})

test('publishes defaults and persists edits through the typed Remote boundary', async () => {
  const ctx = new Context()
  let handler
  let route
  ctx.provide('rpRemote', {
      register(path, next) {
        handler = next
        route = { path }
        return () => {}
      },
  })
  try {
    await ctx.plugin(MemorySettings)
    await ctx.plugin(QuickRepliesPlugin, {})
    assert.deepEqual(route, { path: '/rp-quick-replies' })

    const initial = await handler('list', {})
    assert.deepEqual(initial.value.value.replies, DEFAULT_QUICK_REPLIES)
    assert.equal(initial.value.value.writable, true)
    assert.equal(initial.value.value.revision, 0)

    const replies = [{ id: 'nod', label: '点头', content: '*轻轻点头*', cursorPosition: 'end' }]
    const updated = await handler('replace', { replies, expectedRevision: 0 })
    assert.equal(updated.value.ok, true)
    assert.deepEqual(updated.value.value.replies, replies)
    assert.equal(updated.value.value.revision, 1)
    assert.deepEqual(ctx.settings.get('rp-quick-replies').replies, replies)

    const stale = await handler('replace', { replies: DEFAULT_QUICK_REPLIES, expectedRevision: 0 })
    assert.deepEqual(stale.value, {
      ok: false,
      error: { code: 'REVISION_CONFLICT', message: '快捷回复刚刚在其他页面更新，请重新打开后再保存。' },
    })
    assert.deepEqual(ctx.settings.get('rp-quick-replies').replies, replies)
  } finally {
    await ctx.fiber.dispose()
  }
})
