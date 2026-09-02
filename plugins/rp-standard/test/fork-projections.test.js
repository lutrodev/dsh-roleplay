import assert from 'node:assert/strict'
import test from 'node:test'
import { Context } from '@deepseek-ai/cordis'
import SessionStore, { SessionId } from '@deepseek-ai/dsh-session'
import { createAssistantMessage, createToolResultMessage } from '@deepseek-ai/dsh-llm'
import {
  decodeRpCommitEvent,
  decodeRpWriterEvent,
  RP_COMMIT_META_KIND,
  RP_COMMIT_META_VERSION,
  RP_WRITER_META_KIND,
  RP_WRITER_META_VERSION,
} from 'dsh-roleplay-rp-core'
import { createRpMessageActionMetadata } from 'dsh-roleplay-rp-core/conversation'
import { RP_SESSION_APPLY_COMMAND, encodeSessionCommand, profileFromEvents } from 'dsh-roleplay-rp-session/protocol'
import * as StatePlugin from 'dsh-roleplay-rp-state'
import { applyStateProjectionEvent, emptyStateProjection } from 'dsh-roleplay-rp-state'

const runtime = { decodeCommitEvent: decodeRpCommitEvent }

test('Harness Session fork restores profile and state at the selected turn boundary', async () => {
  const ctx = new Context()
  const contextSources = new Map()
  ctx.provide('rpRuntime', {
    ...runtime,
    registerEffectType() {},
    registerContextSource(definition) { contextSources.set(definition.id, definition) },
    registerCommitDiagnosticProvider() {},
    registerChatReadableTool() {},
  })
  ctx.provide('tools', { register() {} })
  ctx.provide('commands', {
    register() { return () => {} },
    async execute() { throw new Error('commands are not executed by this projection-only test') },
  })
  await ctx.plugin(SessionStore)
  await ctx.plugin(StatePlugin, { maxNamespacesInContext: 32 })
  try {
    const parent = ctx.sessions.create(SessionId('rp-turn-parent'))
    const writer1 = ctx.sessions.create(SessionId('rp-writer-1'), {
      meta: { parentSession: parent.id, origin: 'subagent', delegationDepth: 1 },
    })
    writer1.append('user/message', {
      turn: 1,
      message: { id: 'writer-prompt-1', role: 'user', source: { kind: 'user' }, content: [{ type: 'text', text: '<rp_writer_prompt>第一楼层资料</rp_writer_prompt>' }] },
    }, { surfaceOp: 'append' })
    writer1.append('assistant/message', {
      turn: 1,
      step: 1,
      message: createAssistantMessage({ source: { provider: 'writer-provider', model: 'writer-model' }, content: [{ type: 'text', text: '第 1 楼层正文。' }] }),
    }, { surfaceOp: 'append' })
    const profile1 = profile(1, '潮汐港', 10)
    appendProfile(parent, 'profile-1', 0, profile1)
    const turn1End = appendTurn(parent, 1, {
      stateRevision: 2,
      hp: 9,
    })

    const profile2 = profile(2, '雾海塔', 10)
    appendProfile(parent, 'profile-2', 1, profile2)
    appendTurn(parent, 2, {
      stateRevision: 3,
      hp: 5,
    })

    const child = ctx.sessions.fork(parent, turn1End.seq, SessionId('rp-turn-child'))

    assert.equal(child.header.parentSession, parent.id)
    assert.equal(child.header.isSeeded, true)
    assert.equal(child.inheritedEventCount, turn1End.seq + 1)
    assert.deepEqual(profileFromEvents(child.snapshotEvents()), profile1)
    assert.deepEqual(projectState(child.snapshotEvents()), {
      protocolVersion: 2,
      revision: 2,
      namespaces: { story: stateSnapshot(2, 9) },
    })
    const childWriter = child.snapshotEvents().map(decodeRpWriterEvent).find(Boolean)
    assert.equal(childWriter?.writerSessionId, writer1.id)
    assert.equal(childWriter?.promptHash, 'prompt-hash-1')
    assert.equal(childWriter?.narrative, '第 1 楼层正文。')
    assert.equal(writer1.header.parentSession, parent.id)
    assert.equal(writer1.header.origin, 'subagent')

    const childAgent = { session: child }
    const stateContext = await contextSources.get('rp.state').prepare({ agent: childAgent })
    assert.match(stateContext.text, /"hp": 9/)
    assert.doesNotMatch(stateContext.text, /"hp": 5/)

    assert.deepEqual(profileFromEvents(parent.snapshotEvents()), profile2)
    assert.equal(projectState(parent.snapshotEvents()).namespaces.story.value.hp, 5)

    const secondCommit = parent.snapshotEvents().find(event => decodeRpCommitEvent(event)?.runId === 'run-2')
    const secondAssistant = parent.eventAt(secondCommit.data.meta.assistant.seq)
    const target = {
      kind: 'message', role: 'assistant', messageId: secondAssistant.data.message.id,
      turn: secondAssistant.data.turn, step: secondAssistant.data.step,
    }
    parent.append('assistant/message', {
      turn: secondAssistant.data.turn,
      step: secondAssistant.data.step,
      message: createAssistantMessage({
        content: [],
        source: {
          ...secondAssistant.data.message.source,
          rpMessageAction: createRpMessageActionMetadata('delete', [target]),
        },
      }),
    }, {
      surfaceOp: { op: 'replace', start: secondAssistant.seq, end: secondCommit.seq },
      sourceEventSeqs: [secondAssistant.seq, secondCommit.seq],
    })
    assert.equal(projectState(parent.snapshotEvents()).namespaces.story.value.hp, 9)
  } finally {
    await ctx.fiber.dispose()
  }
})

function profile(revision, title, hp) {
  return {
    revision,
    mode: 'director',
    cast: [],
    scene: { title },
    resources: { card: { id: 'card-live' }, lorebooks: [] },
    runtime: { executionMode: 'chat' },
    ...(revision === 1 ? {
      stateBootstrap: {
        version: 2,
        namespaces: [{ namespace: 'story', initialValue: { hp }, definition: stateDefinition(), diagnostics: { setup: [], lastCommit: [] } }],
      },
    } : {}),
  }
}

function appendProfile(session, commandId, expectedRevision, value) {
  session.append('command/run', {
    commandId,
    name: RP_SESSION_APPLY_COMMAND,
    args: encodeSessionCommand(expectedRevision, value),
    source: { kind: 'user' },
  })
  session.append('command/done', { commandId, kind: 'success' })
}

function appendTurn(session, turn, input) {
  session.append('turn/start', { turn })
  session.append('tool/result', {
    turn,
    step: 1,
    message: createToolResultMessage({
      callId: `rp-write-${turn}`,
      content: [{ type: 'text', text: `第 ${turn} 楼层正文。` }],
      isError: false,
    }),
    meta: {
      kind: RP_WRITER_META_KIND,
      version: RP_WRITER_META_VERSION,
      runId: `run-${turn}`,
      turn,
      executionMode: 'chat',
      writerSessionId: `rp-writer-${turn}`,
      provider: 'writer-provider',
      model: 'writer-model',
      contextBuild: { version: 1, slots: [{ id: 'current-input', sourceIds: ['rp.current-input'] }] },
      promptHash: `prompt-hash-${turn}`,
      promptCharacters: [...`<rp_writer_prompt>第 ${turn} 楼层资料</rp_writer_prompt>`].length,
      prompt: `<rp_writer_prompt>第 ${turn} 楼层资料</rp_writer_prompt>`,
      sections: [],
      narrative: `第 ${turn} 楼层正文。`,
    },
  }, { surfaceOp: 'append' })
  const assistant = session.append('assistant/message', {
    turn,
    step: 1,
    message: createAssistantMessage({
      source: { provider: 'test-provider', model: 'test-model' },
      content: [
        { type: 'text', text: `第 ${turn} 楼层正文。` },
        { type: 'tool-call', id: `rp-commit-${turn}`, name: 'rp_commit_turn', arguments: '{}' },
      ],
    }),
  }, { surfaceOp: 'append' })
  const commit = session.append('tool/result', {
    turn,
    step: 1,
    message: createToolResultMessage({
      callId: `rp-commit-${turn}`,
      content: [{ type: 'text', text: 'Roleplay turn committed.' }],
      isError: false,
    }),
    meta: {
      kind: RP_COMMIT_META_KIND,
      version: RP_COMMIT_META_VERSION,
      runId: `run-${turn}`,
      assistant: { seq: assistant.seq, messageId: assistant.data.message.id },
      writer: {
        writerSessionId: `rp-writer-${turn}`,
        provider: 'writer-provider',
        model: 'writer-model',
        promptHash: `prompt-hash-${turn}`,
      },
      effects: [
        {
          kind: 'state.update',
          namespace: 'story',
          expectedRevision: input.stateRevision - 1,
          payload: {
            changes: [{ op: 'set', path: '/hp', value: input.hp, reason: `第 ${turn} 次剧情变化` }],
            result: stateSnapshot(input.stateRevision, input.hp),
          },
        },
      ],
    },
  }, { surfaceOp: 'append' })
  const turnEnd = session.append('turn/end', { turn, reason: { kind: 'completed' } })
  assert.equal(commit.seq < turnEnd.seq, true)
  return turnEnd
}

function stateDefinition() {
  return {
    title: '故事状态', updateMode: 'schema-only',
    schema: { type: 'object', properties: { hp: { type: 'integer', minimum: 0, maximum: 100 } }, required: ['hp'], additionalProperties: false },
    rules: [],
  }
}

function stateSnapshot(revision, hp) {
  return {
    revision,
    initialValue: { hp: 10 },
    value: { hp },
    definition: stateDefinition(),
    diagnostics: { setup: [], lastCommit: [] },
  }
}

function projectState(events) {
  return events.reduce((state, event) => applyStateProjectionEvent(state, event, runtime), emptyStateProjection()).value
}
