import assert from 'node:assert/strict'
import test from 'node:test'
import { Context } from '@deepseek-ai/cordis'
import * as Core from 'dsh-roleplay-rp-core'
import * as Macro from 'dsh-roleplay-rp-macro'

test('the standard runtime expands both identities across every model text surface', async () => {
  const ctx = new Context()
  const profile = {
    resources: { card: { id: 'card-1' }, persona: { id: 'persona-1' } },
    runtime: { executionMode: 'chat' },
  }
  let agent
  ctx.provide('systemPrompt', { section() {} })
  ctx.provide('tools', { register() {} })
  ctx.provide('agents', { get(id) { return agent?.session.id === id ? agent : undefined } })
  ctx.provide('rpSessions', { get() { return profile } })
  ctx.provide('rpPersonas', { async get() { return { id: 'persona-1', revision: 3, name: '林澈' } } })
  ctx.provide('rpCharacterCards', { async get() { return { id: 'card-1', revision: 7, name: '莱安娜' } } })
  const runtime = new Core.RpRuntime(ctx, {
    chatMaxStepsPerRun: 2,
    agentMaxStepsPerRun: 8,
    maxEffectsPerCommit: 2,
    maxArtifactBytes: 4096,
    maxNarrativeCharacters: 1000,
  })
  runtime.registerSessionProfileProvider(() => profile)
  runtime.registerContextSource({
    id: 'test.identities',
    prepare: () => ({ text: '{{char}}正在等待{{user}}。', revision: 1 }),
  })
  agent = {
    session: {
      id: 'session-1',
      events: [],
      deriveMessages() { return [] },
    },
  }
  Macro.apply(ctx)

  try {
    assert.equal(
      await runtime.transformText('{{char}}向{{user}}打招呼。', { agent, profile, phase: 'opening' }),
      '莱安娜向林澈打招呼。',
    )
    const sourceMessage = {
      role: 'user',
      source: { kind: 'user' },
      content: [{ type: 'text', text: '{{user}}走向{{char}}。' }],
    }
    const run = await runtime.prepareRun(agent, 1, [sourceMessage])
    assert.equal(run.messages[0].content[0].text, '林澈走向莱安娜。')
    assert.equal(run.fragments.find(item => item.id === 'test.identities').text, '莱安娜正在等待林澈。')

    const source = (async function* () {
      yield { type: 'block-start', index: 0, blockType: 'text' }
      yield { type: 'text-delta', index: 0, text: '“{{ch' }
      yield { type: 'text-delta', index: 0, text: 'ar}}看见{{us' }
      yield { type: 'text-delta', index: 0, text: 'er}}了。”' }
      yield { type: 'block-end', index: 0, block: { type: 'text', text: '“{{char}}看见{{user}}了。”' } }
      yield { type: 'finish', reason: { kind: 'stop' } }
    })()
    const chunks = []
    const transformed = ctx.waterfall('llm/stream', { sessionId: 'session-1' }, () => source)
    for await (const chunk of transformed) chunks.push(chunk)
    assert.equal(
      chunks.filter(chunk => chunk.type === 'text-delta').map(chunk => chunk.text).join(''),
      '“莱安娜看见林澈了。”',
    )
    assert.equal(chunks.find(chunk => chunk.type === 'block-end').block.text, '“莱安娜看见林澈了。”')
  } finally {
    await ctx.fiber.dispose()
  }
})
