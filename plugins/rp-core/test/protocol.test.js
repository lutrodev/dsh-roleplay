import assert from 'node:assert/strict'
import test from 'node:test'
import {
  decodeRpCommitEvent,
  decodeRpWriterEvent,
  jsonByteLength,
  rpAssistantText,
  rpSurfaceReplacementSources,
  resolveRpToolCallAssistant,
  RP_COMMIT_META_KIND,
  RP_WRITER_META_KIND,
} from '../src/protocol.js'
import { createRpMessageActionMetadata } from '../src/conversation.js'

test('decodes only successful versioned roleplay commit results', () => {
  const event = {
    type: 'tool/result',
    data: { meta: { kind: RP_COMMIT_META_KIND, version: 2, runId: 'run-1', effects: [], assistant: { seq: 4, messageId: 'assistant-1' } } },
  }
  assert.equal(decodeRpCommitEvent(event)?.runId, 'run-1')
  assert.equal(decodeRpCommitEvent({ ...event, data: { ...event.data, error: { code: 'x' } } }), undefined)
  assert.equal(decodeRpCommitEvent({ type: 'assistant/message', data: event.data }), undefined)
  assert.equal(decodeRpCommitEvent({ ...event, data: { meta: { ...event.data.meta, version: 1 } } }), undefined)
})

test('reads message content and ancestry from native Roleplay action carriers', () => {
  const edit = {
    type: 'assistant/message',
    surfaceOp: { op: 'replace', start: 3, end: 3 },
    sourceEventSeqs: [3],
    data: {
      turn: 1, step: 1,
      message: {
        id: 'a', role: 'assistant', content: [{ type: 'text', text: 'revised' }],
        source: {
          kind: 'model', provider: 'mock', model: 'mock',
          rpMessageAction: createRpMessageActionMetadata('edit', [{
            kind: 'message', role: 'assistant', messageId: 'a', turn: 1, step: 1,
          }]),
        },
      },
    },
  }
  assert.equal(rpAssistantText(edit), 'revised')
  assert.deepEqual(rpSurfaceReplacementSources(edit), [3])
  assert.deepEqual(rpSurfaceReplacementSources({
    type: 'user/message',
    surfaceOp: { op: 'replace', start: 3, end: 4 },
    sourceEventSeqs: [3, 4],
    data: { id: 'ordinary', role: 'user', content: [], source: { kind: 'plugin', plugin: 'other' } },
  }), [3, 4])
})

test('strictly resolves a native model tool call to its assistant owner', () => {
  const events = [{
    seq: 2,
    type: 'assistant/message',
    surfaceOp: 'append',
    data: {
      turn: 1,
      step: 2,
      message: {
        id: 'assistant-state',
        role: 'assistant',
        source: { kind: 'model' },
        content: [
          { type: 'tool-call', id: 'state-call', name: 'rp_state', arguments: '{}' },
          { type: 'tool-call', id: 'read-call', name: 'rp_state_read', arguments: '{}' },
        ],
      },
    },
  }, {
    seq: 3,
    type: 'tool/call',
    data: { turn: 1, step: 2, callId: 'state-call', name: 'rp_state', arguments: '{}' },
  }]
  const resolved = resolveRpToolCallAssistant(events, 'state-call', 'rp_state')
  assert.equal(resolved?.event.seq, 2)
  assert.equal(resolved?.message.id, 'assistant-state')
  assert.equal(resolved?.call.seq, 3)
  assert.equal(resolveRpToolCallAssistant(events, 'state-call', 'rp_state_read'), undefined)
  assert.equal(resolveRpToolCallAssistant([...events, structuredClone(events[1])], 'state-call', 'rp_state'), undefined)
  assert.equal(resolveRpToolCallAssistant([{ ...events[0], surfaceOp: { op: 'replace', start: 1, end: 1 } }, events[1]], 'state-call', 'rp_state'), undefined)
})

test('measures complete JSON output in UTF-8 bytes', () => {
  assert.equal(jsonByteLength({ text: '你好' }), Buffer.byteLength('{"text":"你好"}', 'utf8'))
})

test('decodes only durable successful Writer artifacts', () => {
  const event = {
    type: 'tool/result',
    data: { meta: {
      kind: RP_WRITER_META_KIND, version: 1, runId: 'run-3', writerSessionId: 'child-1',
      provider: 'provider', model: 'model', executionMode: 'chat', turn: 3,
      promptHash: 'abc', promptCharacters: 12, contextBuild: { version: 1, slots: [] }, sections: [], narrative: '原始正文',
    } },
  }
  assert.equal(decodeRpWriterEvent(event)?.writerSessionId, 'child-1')
  assert.equal(decodeRpWriterEvent({ ...event, data: { ...event.data, error: { code: 'x' } } }), undefined)
  assert.equal(decodeRpWriterEvent({ ...event, data: { meta: { ...event.data.meta, narrative: undefined } } }), undefined)
})
