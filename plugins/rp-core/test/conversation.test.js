import assert from 'node:assert/strict'
import test from 'node:test'
import { createAssistantMessage, createUserMessage } from '@deepseek-ai/dsh-llm'
import { Session, SessionId } from '@deepseek-ai/dsh-session'
import { roleplayTranscriptMessages } from '../src/conversation.js'

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

  assert.deepEqual(roleplayTranscriptMessages(session).flatMap(message => (
    message.content.filter(block => block.type === 'text').map(block => block.text)
  )), ['开场白', '完成轮输入', '最终正文', '失败轮输入', '工具终止轮输入'])
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
