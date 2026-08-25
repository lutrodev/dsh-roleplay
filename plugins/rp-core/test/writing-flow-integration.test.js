import assert from 'node:assert/strict'
import test from 'node:test'
import { Context } from '@deepseek-ai/cordis'
import AgentRegistry from '@deepseek-ai/dsh-agent'
import AgentLoop from '@deepseek-ai/dsh-agent-loop'
import LlmRuntime, { CallId, LlmAdapter, createUserMessage } from '@deepseek-ai/dsh-llm'
import SessionStore, { SessionId } from '@deepseek-ai/dsh-session'
import SystemPrompt from '@deepseek-ai/dsh-system-prompt'
import ToolRuntime from '@deepseek-ai/dsh-tools'
import * as RpCore from '../src/index.js'

test('real Agent Loop streams Writer unchanged in Chat and keeps parent revision in Agent mode', async t => {
  const chatWriter = '雨声沿着门缝漫进来，门锁随即轻响一声。'
  const chatParentRewrite = '父代理擅自改写的版本。'
  const agentWriter = 'Writer 提供的初稿。'
  const agentRevision = '父代理基于 Writer 完成的修改稿。'
  const adapter = new ScriptedAdapter([
    toolResponse('chat-write', 'rp_write_turn', { action: 'write' }),
    narrativeCommitResponse(chatParentRewrite, 'chat-commit', { runSummary: '门锁在雨中打开。' }),
    toolResponse('agent-write', 'rp_write_turn', { action: 'write' }),
    narrativeCommitResponse(agentRevision, 'agent-commit', { runSummary: '修改后的正文被采用。' }),
  ])
  const writerOutputs = [chatWriter, agentWriter]
  const ctx = await loopContext(adapter, writerOutputs)
  t.after(async () => ctx.fiber.dispose())

  const chatHandle = await ctx.agents.create({
    sessionId: SessionId('rp-chat-writer-stream-integration'),
    meta: { agentPreset: 'roleplay' },
    agentOptions: { provider: 'mock', model: 'mock' },
  })
  t.after(async () => chatHandle.dispose())
  chatHandle.agent.followup(userMessage('打开门。'))
  await chatHandle.agent.whenIdle()

  const chatFinal = finalNarrativeMessage(chatHandle.agent.session)
  assert.equal(messageText(chatFinal.data.message), chatWriter)
  assert.doesNotMatch(JSON.stringify(chatHandle.agent.session.events), new RegExp(chatParentRewrite))
  assert.equal(streamedText(chatHandle.agent.session, chatFinal.data.turn, chatFinal.data.step), chatWriter)
  assert.equal(successfulCommit(chatHandle.agent.session)?.executionMode, 'chat')
  assert.equal(ctx.rpRuntime.inspectRun(chatHandle.agent).status, 'committed')

  const agentHandle = await ctx.agents.create({
    sessionId: SessionId('rp-writer-revision-integration'),
    meta: { agentPreset: 'roleplay' },
    agentOptions: { provider: 'mock', model: 'mock' },
  })
  t.after(async () => agentHandle.dispose())
  agentHandle.agent.followup(userMessage('继续。'))
  await agentHandle.agent.whenIdle()

  const agentFinal = finalNarrativeMessage(agentHandle.agent.session)
  assert.equal(messageText(agentFinal.data.message), agentRevision)
  assert.notEqual(messageText(agentFinal.data.message), agentWriter)
  assert.equal(successfulCommit(agentHandle.agent.session)?.executionMode, 'agent')
  assert.equal(ctx.rpRuntime.inspectRun(agentHandle.agent).status, 'committed')
})

async function loopContext(adapter, writerOutputs) {
  const ctx = new Context()
  await ctx.plugin(LlmRuntime)
  await ctx.plugin(SessionStore)
  await ctx.plugin(SystemPrompt, { includeHarnessIdentity: false })
  await ctx.plugin(ToolRuntime)
  await ctx.plugin(AgentRegistry)
  await ctx.plugin(AgentLoop, { agents: [] })
  ctx.provide('subagents', {
    async start() {
      const narrative = writerOutputs.shift()
      if (narrative === undefined) throw new Error('Writer response script exhausted')
      return {
        id: SessionId(`writer-${writerOutputs.length}`),
        localAgent: undefined,
        result: Promise.resolve({ stopReason: 'completed', output: [{ type: 'text', text: narrative }] }),
        async dispose() {},
      }
    },
  })
  ctx.provide('rpFeatures', { harnessIdentity: () => 'You are the Roleplay test identity.' })
  await ctx.plugin(RpCore, {
    chatMaxStepsPerRun: 5,
    agentMaxStepsPerRun: 8,
    maxContextCharacters: 4000,
    maxEffectsPerCommit: 4,
    maxArtifactBytes: 8192,
    maxNarrativeCharacters: 2000,
    maxWriterBriefCharacters: 1000,
    maxSubagentPromptCharacters: 2000,
    subagentProvider: 'spawn',
    writerPersona: 'Return prose only.',
  })
  ctx.rpRuntime.registerSessionProfileProvider(agent => ({
    runtime: {
      executionMode: agent.session.id === 'rp-chat-writer-stream-integration' ? 'chat' : 'agent',
    },
  }))
  ctx.llm.registerAdapter(['mock'], adapter)
  return ctx
}

function userMessage(text) {
  return createUserMessage({ content: [{ type: 'text', text }], source: { kind: 'user' } })
}

function toolResponse(callId, name, args) {
  const id = CallId(callId)
  const argumentsText = JSON.stringify(args)
  return [
    { type: 'block-start', index: 0, blockType: 'tool-call' },
    { type: 'tool-call-delta', index: 0, id, name, argumentsDelta: argumentsText },
    { type: 'block-end', index: 0, block: { type: 'tool-call', id, name, arguments: argumentsText } },
    { type: 'usage', usage: { inputTokens: 10, outputTokens: 2 } },
    { type: 'finish', reason: { kind: 'tool-calls' } },
  ]
}

function narrativeCommitResponse(text, callId, args) {
  const id = CallId(callId)
  const argumentsText = JSON.stringify(args)
  return [
    { type: 'block-start', index: 0, blockType: 'text' },
    { type: 'text-delta', index: 0, text },
    { type: 'block-end', index: 0, block: { type: 'text', text } },
    { type: 'block-start', index: 1, blockType: 'tool-call' },
    { type: 'tool-call-delta', index: 1, id, name: 'rp_commit_turn', argumentsDelta: argumentsText },
    { type: 'block-end', index: 1, block: { type: 'tool-call', id, name: 'rp_commit_turn', arguments: argumentsText } },
    { type: 'usage', usage: { inputTokens: 10, outputTokens: [...text].length } },
    { type: 'finish', reason: { kind: 'tool-calls' } },
  ]
}

class ScriptedAdapter extends LlmAdapter {
  constructor(script) {
    super()
    this.script = script
  }

  resolveModel(provider, model) {
    return Promise.resolve({ provider, id: model, name: model })
  }

  async * stream() {
    const response = this.script.shift()
    if (response === undefined) throw new Error('Parent response script exhausted')
    for (const chunk of response) yield chunk
  }
}

function finalNarrativeMessage(session) {
  const event = session.events.findLast(item => item.type === 'assistant/message'
    && item.data.message.content.some(block => block.type === 'tool-call' && block.name === 'rp_commit_turn'))
  assert.ok(event)
  return event
}

function messageText(message) {
  return message.content.filter(block => block.type === 'text').map(block => block.text).join('')
}

function streamedText(session, turn, step) {
  return session.events.flatMap(event => event.type === 'assistant/chunk'
    && event.data.turn === turn
    && event.data.step === step
    && event.data.chunk.type === 'text-delta'
    ? [event.data.chunk.text]
    : []).join('')
}

function successfulCommit(session) {
  return session.events.findLast(event => event.type === 'tool/result'
    && event.data.meta?.kind === 'rp-agent/turn-commit')?.data.meta
}
