import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import {
  avatarNodeVisibility,
  assistantAvatarStart,
  assistantAvatarUpdate,
  messageAvatarTarget,
  openingAvatarMatch,
  updateMessageAvatarState,
  userAvatarMatch,
} from '../src/client-state.js'

test('matches users and the selected opening at durable message ids', () => {
  const user = event('user/message', { id: 'user-1', source: { kind: 'user' }, content: [{ type: 'text', text: '你好' }] })
  const opening = event('assistant/message', {
    message: { id: 'opening-1', source: { kind: 'model', provider: 'rp-session', model: 'selected-opening' }, content: [{ type: 'text', text: '开场' }] },
  })
  const intermediate = event('assistant/message', {
    turn: 2,
    message: { id: 'assistant-1', source: { kind: 'model' }, content: [{ type: 'text', text: '中间内容' }] },
  })
  assert.deepEqual(userAvatarMatch(user), { id: 'user-1', role: 'start' })
  assert.deepEqual(openingAvatarMatch(opening), { id: 'opening-1', role: 'start' })
  assert.equal(openingAvatarMatch(intermediate), null)
})

test('shows the last readable prose after either a successful or failed turn closes', () => {
  let state = assistantAvatarStart({ data: { turn: 2 } })
  state = assistantAvatarUpdate(state, event('assistant/message', {
    turn: 2,
    message: { id: 'mid', source: { kind: 'model' }, content: [{ type: 'text', text: 'tool preface' }] },
  }))
  state = assistantAvatarUpdate(state, event('assistant/message', {
    turn: 2,
    message: { id: 'final', source: { kind: 'model' }, content: [{ type: 'text', text: '最终中文正文' }] },
  }, 9))
  assert.equal(state.visible, false)
  assert.equal(state.messageId, 'final')
  state = assistantAvatarUpdate(state, event('turn/end', { turn: 2, reason: { kind: 'completed' } }, 10))
  assert.equal(state.visible, true)
  assert.equal(state.seq, 9)

  let failed = assistantAvatarStart({ data: { turn: 3 } })
  failed = assistantAvatarUpdate(failed, event('assistant/message', {
    turn: 3,
    message: { id: 'partial', source: { kind: 'model' }, content: [{ type: 'text', text: 'partial' }] },
  }, 12))
  failed = assistantAvatarUpdate(failed, event('turn/end', { turn: 3, reason: { kind: 'error' } }, 13))
  assert.equal(failed.visible, true)
  assert.equal(failed.seq, 12)
})

test('keeps the original anchor and folds native action carriers', () => {
  const state = { seq: 8, messageId: 'user-1', side: 'user', visible: true }
  assert.deepEqual(updateMessageAvatarState(state, actionCarrier('user', 'user-1', 'delete')), { ...state, visible: false })
  assert.deepEqual(updateMessageAvatarState(state, actionCarrier('user', 'user-1', 'edit')), state)
})

test('editing a closed assistant keeps its canonical avatar visible and anchored', () => {
  const original = { turn: 1, side: 'assistant', seq: 8, messageId: 'assistant-1', visible: true, closed: true }
  const edited = assistantAvatarUpdate(original, actionCarrier('assistant', 'assistant-1', 'edit', 1, 14))
  assert.deepEqual(edited, original)
  const deleted = assistantAvatarUpdate(original, actionCarrier('assistant', 'assistant-1', 'delete', 1, 15))
  assert.deepEqual(deleted, { ...original, visible: false })
})

test('withdraws an already materialized avatar through hidden visibility', () => {
  assert.equal(avatarNodeVisibility({ state: { visible: true }, current: new Map() }), 'visible')
  assert.equal(avatarNodeVisibility({ state: { visible: false }, current: new Map() }), undefined)
  assert.equal(avatarNodeVisibility({
    state: { visible: false },
    current: new Map([['chat', { key: 'avatar' }]]),
  }), 'hidden')
})

test('finds native assistant and opening rows without crossing a user boundary', () => {
  const user = row('user')
  const assistant = row('assistant-step', user)
  const opening = row('rp-opening', user)
  assert.equal(messageAvatarTarget(row('rp-message-avatar-assistant', assistant), 'assistant'), assistant)
  assert.equal(messageAvatarTarget(row('rp-message-avatar-opening', opening), 'assistant'), opening)
  assert.equal(messageAvatarTarget(row('rp-message-avatar-assistant', user), 'assistant'), null)
  assert.equal(messageAvatarTarget(row('rp-message-avatar-user', user), 'user'), user)
})

test('uses only public Conversation Node and asset RPC extensions', async () => {
  const client = await readFile(new URL('../src/client.js', import.meta.url), 'utf8')
  const state = await readFile(new URL('../src/client-state.js', import.meta.url), 'utf8')
  const styles = await readFile(new URL('../src/client.module.css', import.meta.url), 'utf8')
  assert.match(client, /conversationEvents\.register/)
  assert.match(client, /conversation\.chat\.node/)
  assert.match(client, /createPortal\(h\(MessageAvatar/)
  assert.doesNotMatch(client, /conversation\.chat\.(user-avatar|assistant-avatar)/)
  assert.doesNotMatch(state, /conversation\/revision|source\.revision|revisionPayload/)
  assert.match(client, /profile\?\.resources\?\.card\?\.id/)
  assert.match(client, /profile\?\.resources\?\.persona\?\.id/)
  assert.match(styles, /\.assistantAvatar \{ right: calc\(100% \+ 11px\); \}/)
  assert.match(styles, /@container rp-conversation \(max-width: 843px\)/)
})

function event(type, data, seq = 4) { return { seq, type, surfaceOp: 'append', data } }
function row(kind, previousElementSibling = null) { return { dataset: { chatFlowKind: kind }, previousElementSibling } }
function actionCarrier(role, messageId, operation, turn = 1, seq = 20) {
  const rpMessageAction = {
    kind: 'rp-agent/message-action', version: 1, operation,
    targets: [{ kind: 'message', role, messageId, ...(role === 'assistant' ? { turn, step: 1 } : {}) }],
  }
  if (role === 'user') {
    return {
      seq, type: 'user/message', surfaceOp: { op: 'replace', start: 1, end: 1 },
      data: {
        id: messageId,
        source: { kind: 'user', rpMessageAction },
        content: operation === 'edit' ? [{ type: 'text', text: '改写' }] : [],
      },
    }
  }
  return {
    seq, type: 'assistant/message', surfaceOp: { op: 'replace', start: 1, end: 1 },
    data: {
      turn, step: 1,
      message: {
        id: messageId,
        source: { kind: 'model', rpMessageAction },
        content: operation === 'edit' ? [{ type: 'text', text: '改写' }] : [],
      },
    },
  }
}
