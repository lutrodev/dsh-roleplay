import assert from 'node:assert/strict'
import test from 'node:test'
import { Context } from '@deepseek-ai/cordis'
import { createAssistantMessage } from '@deepseek-ai/dsh-llm'
import { Session, SessionId } from '@deepseek-ai/dsh-session'
import TokenMeter from '@deepseek-ai/dsh-token-meter'
import { createRpMessageActionMetadata } from 'dsh-roleplay-rp-core/conversation'
import { roleplayCompactionTokenMeter } from '../src/token-meter.js'

test('compatibility metering is limited to validated Roleplay message-action assistants', () => {
  const native = new TokenMeter(new Context())
  const meter = roleplayCompactionTokenMeter(native)
  const session = completedAssistantSession('rp-meter-action', '原始正文')
  const original = session.events.find(event => event.type === 'assistant/message')
  const data = structuredClone(original.data)
  data.message.content = [{ type: 'text', text: '编辑后的正文' }]
  data.message.source = {
    ...data.message.source,
    rpMessageAction: createRpMessageActionMetadata('edit', [{
      kind: 'message', role: 'assistant', messageId: data.message.id,
      turn: data.turn, step: data.step,
    }]),
  }
  const replacement = session.append('assistant/message', data, {
    surfaceOp: { op: 'replace', start: original.seq, end: original.seq },
    sourceEventSeqs: [original.seq],
  })

  assert.throws(() => native.measure(session), /has no matching step\/start event/u)
  const measured = meter.measure(session)
  assert.equal(measured.logRevision, session.events.length)
  assert.deepEqual(measured.nodes.map(node => node.seq), [replacement.seq])
  assert.equal(measured.nodes[0].tokens, native.estimateMessage(data.message))

  session.append('turn/start', { turn: 2 })
  session.append('step/start', { turn: 2, step: 1 })
  const later = session.append('assistant/message', {
    turn: 2,
    step: 1,
    message: createAssistantMessage({
      content: [{ type: 'text', text: '编辑之后的新回复' }],
      source: { provider: 'mock', model: 'mock' },
    }),
  }, { surfaceOp: 'append', sourceEventSeqs: [] })
  session.append('step/end', { turn: 2, step: 1 })
  session.append('turn/end', { turn: 2, reason: { kind: 'completed' } })
  const advanced = meter.measure(session)
  assert.equal(advanced.logRevision, session.events.length)
  assert.deepEqual(advanced.nodes.map(node => node.seq), [replacement.seq, later.seq])

  const laterData = structuredClone(later.data)
  laterData.message.content = [{ type: 'text', text: '再次编辑的新回复' }]
  laterData.message.source = {
    ...laterData.message.source,
    rpMessageAction: createRpMessageActionMetadata('edit', [{
      kind: 'message', role: 'assistant', messageId: laterData.message.id,
      turn: laterData.turn, step: laterData.step,
    }]),
  }
  const laterReplacement = session.append('assistant/message', laterData, {
    surfaceOp: { op: 'replace', start: later.seq, end: later.seq },
    sourceEventSeqs: [later.seq],
  })
  const readvanced = meter.measure(session)
  assert.equal(readvanced.logRevision, session.events.length)
  assert.deepEqual(readvanced.nodes.map(node => node.seq), [replacement.seq, laterReplacement.seq])

  const malformed = completedAssistantSession('rp-meter-unrelated', '正常正文')
  const unrelated = structuredClone(malformed.events.find(event => event.type === 'assistant/message').data)
  malformed.append('assistant/message', unrelated, {
    surfaceOp: 'append', sourceEventSeqs: [],
  })
  assert.throws(
    () => meter.measure(malformed),
    /has no matching step\/start event/u,
    'unrelated malformed model events must not be hidden',
  )
})

function completedAssistantSession(id, text) {
  const session = Session.create(SessionId(id))
  session.append('turn/start', { turn: 1 })
  session.append('step/start', { turn: 1, step: 1 })
  session.append('assistant/message', {
    turn: 1,
    step: 1,
    message: createAssistantMessage({
      content: [{ type: 'text', text }],
      source: { provider: 'mock', model: 'mock' },
    }),
  }, { surfaceOp: 'append', sourceEventSeqs: [] })
  session.append('step/end', { turn: 1, step: 1 })
  session.append('turn/end', { turn: 1, reason: { kind: 'completed' } })
  return session
}
