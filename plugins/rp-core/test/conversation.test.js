import assert from 'node:assert/strict'
import test from 'node:test'
import { createAssistantMessage, createUserMessage } from '@deepseek-ai/dsh-llm'
import { Session, SessionId } from '@deepseek-ai/dsh-session'
import {
  roleplayAssistantReplyKind,
  roleplayTranscriptMessages,
} from '../src/conversation.js'

test('transcript keeps only settled users and the canonical closing model message of completed turns', () => {
  const session = Session.create(SessionId('rp-transcript-completed-only'))

  session.append('turn/start', { turn: 1 })
  appendAssistant(session, 1, 1, '开场白')
  session.append('turn/end', { turn: 1, reason: { kind: 'completed' } })

  session.append('turn/start', { turn: 2 })
  session.append('user/message', createUserMessage({
    content: [{ type: 'text', text: '完成轮输入' }], source: { kind: 'user' },
  }), { surfaceOp: 'append' })
  appendAssistant(session, 2, 1, '工具前言')
  appendAssistant(session, 2, 2, '最终正文')
  session.append('turn/end', { turn: 2, reason: { kind: 'completed' } })

  session.append('turn/start', { turn: 3 })
  session.append('user/message', createUserMessage({
    content: [{ type: 'text', text: '失败轮输入' }], source: { kind: 'user' },
  }), { surfaceOp: 'append' })
  appendAssistant(session, 3, 1, '失败轮部分回复')
  session.append('turn/end', { turn: 3, reason: { kind: 'error', error: { message: 'boom' } } })

  session.append('turn/start', { turn: 4 })
  session.append('user/message', createUserMessage({
    content: [{ type: 'text', text: '尚未结束的输入' }], source: { kind: 'user' },
  }), { surfaceOp: 'append' })
  appendAssistant(session, 4, 1, '尚未结束的中间回复')

  session.append('turn/start', { turn: 5 })
  session.append('user/message', createUserMessage({
    content: [{ type: 'text', text: '工具终止轮输入' }], source: { kind: 'user' },
  }), { surfaceOp: 'append' })
  appendAssistant(session, 5, 1, '不应冒充最终正文')
  session.append('assistant/message', {
    turn: 5,
    step: 2,
    message: createAssistantMessage({
      content: [{ type: 'tool-call', id: 'call-final', name: 'noop', arguments: '{}' }],
      source: { provider: 'mock', model: 'mock' },
    }),
  }, { surfaceOp: 'append' })
  session.append('turn/end', { turn: 5, reason: { kind: 'completed' } })

  session.append('turn/start', { turn: 6 })
  session.append('user/message', createUserMessage({
    content: [{ type: 'text', text: '提交失败轮输入' }], source: { kind: 'user' },
  }), { surfaceOp: 'append' })
  session.append('assistant/message', {
    turn: 6,
    step: 2,
    message: createAssistantMessage({
      content: [
        { type: 'text', text: '提交时已经展示的完整正文' },
        { type: 'tool-call', id: 'commit-invalid', name: 'rp_commit_turn', arguments: '{}' },
      ],
      source: { provider: 'mock', model: 'mock' },
    }),
  }, { surfaceOp: 'append' })
  appendAssistant(session, 6, 3, '—')
  session.append('turn/end', { turn: 6, reason: { kind: 'completed' } })

  assert.deepEqual(roleplayTranscriptMessages(session).flatMap(message => (
    message.content.filter(block => block.type === 'text').map(block => block.text)
  )), [
    '开场白', '完成轮输入', '最终正文', '失败轮输入', '工具终止轮输入',
    '提交失败轮输入', '提交时已经展示的完整正文',
  ])
})

test('reply classification trusts successful commits and selected opening provenance', () => {
  const session = Session.create(SessionId('rp-transcript-reply-kinds'))

  session.append('turn/start', { turn: 1 })
  const opening = session.append('assistant/message', {
    turn: 1,
    step: 1,
    message: createAssistantMessage({
      content: [{ type: 'text', text: '雨港开场。' }],
      source: { provider: 'rp-session', model: 'selected-opening' },
    }),
  }, { surfaceOp: 'append' })
  session.append('turn/end', { turn: 1, reason: { kind: 'completed' } })

  session.append('turn/start', { turn: 2 })
  session.append('user/message', createUserMessage({
    content: [{ type: 'text', text: '继续故事。' }], source: { kind: 'user' },
  }), { surfaceOp: 'append' })
  const narrative = appendAssistant(session, 2, 1, '潮门打开了。')
  session.append('tool/result', {
    turn: 2,
    step: 1,
    meta: {
      kind: 'rp-agent/turn-commit', version: 2, runId: 'run-writing', turn: 2,
      assistant: { seq: narrative.seq, messageId: narrative.data.message.id },
    },
  }, { surfaceOp: 'append' })
  session.append('turn/end', { turn: 2, reason: { kind: 'completed' } })

  session.append('turn/start', { turn: 3 })
  session.append('user/message', createUserMessage({
    content: [{ type: 'text', text: '讨论后续剧情。' }], source: { kind: 'user' },
  }), { surfaceOp: 'append' })
  const discussion = appendAssistant(session, 3, 1, '可以先让反派暴露破绽。')
  session.append('tool/result', {
    turn: 3,
    step: 1,
    error: { code: 'INVALID_ARGS' },
    meta: {
      kind: 'rp-agent/turn-commit', version: 2, runId: 'run-failed', turn: 3,
      assistant: { seq: discussion.seq, messageId: discussion.data.message.id },
    },
  }, { surfaceOp: 'append' })
  session.append('turn/end', { turn: 3, reason: { kind: 'completed' } })

  assert.equal(roleplayAssistantReplyKind(session, opening.data.message), 'writing')
  assert.equal(roleplayAssistantReplyKind(session, narrative.data.message), 'writing')
  assert.equal(roleplayAssistantReplyKind(session, discussion.data.message), 'non-writing')
  assert.equal(roleplayAssistantReplyKind(session, createUserMessage({
    content: [{ type: 'text', text: '用户消息' }], source: { kind: 'user' },
  })), undefined)
})

function appendAssistant(session, turn, step, text) {
  return session.append('assistant/message', {
    turn,
    step,
    message: createAssistantMessage({
      content: [{ type: 'text', text }],
      source: { provider: 'mock', model: 'mock' },
    }),
  }, { surfaceOp: 'append' })
}
