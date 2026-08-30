import assert from 'node:assert/strict'
import test from 'node:test'
import { Context } from '@deepseek-ai/cordis'
import { apply } from '../src/index.js'

test('Chat reserves recovery steps for both Writer and commit failures', async () => {
  const ctx = new Context()
  try {
    assert.throws(() => apply(ctx, {
      chatMaxStepsPerRun: 4,
      agentMaxStepsPerRun: 8,
      maxEffectsPerCommit: 64,
      maxArtifactBytes: 262144,
      maxNarrativeCharacters: 200000,
      maxWriterBriefCharacters: 4096,
      maxSubagentPromptCharacters: 20000,
      subagentProvider: 'spawn',
      writerPersona: 'Return prose only.',
    }), /chatMaxStepsPerRun must be at least 5/)
  } finally {
    await ctx.fiber.dispose()
  }
})

test('Roleplay shadows harness:identity from the shared live identity provider', async () => {
  const ctx = new Context()
  const sections = []
  let identity = 'You are the shared Roleplay identity.'
  ctx.provide('systemPrompt', {
    getSectionOrder(name) {
      assert.equal(name, 'HARNESS_IDENTITY')
      return -1000
    },
    section(definition) { sections.push(definition) },
  })
  ctx.provide('tools', { register() {} })
  ctx.provide('agents', { get() { return undefined } })
  ctx.provide('subagents', { async start() { throw new Error('not used') } })
  ctx.provide('rpFeatures', { harnessIdentity: () => identity })
  try {
    apply(ctx, {
      chatMaxStepsPerRun: 5,
      agentMaxStepsPerRun: 8,
      maxEffectsPerCommit: 64,
      maxArtifactBytes: 262144,
      maxNarrativeCharacters: 200000,
      maxWriterBriefCharacters: 4096,
      maxSubagentPromptCharacters: 20000,
      subagentProvider: 'spawn',
      writerPersona: 'Return prose only.',
    })
    const layer = sections.find(section => section.name === 'harness:identity')
    assert.equal(layer.order, -1000)
    assert.equal(layer.text(), identity)
    identity = 'You are the updated shared Roleplay identity.'
    assert.equal(layer.text(), identity)
  } finally {
    await ctx.fiber.dispose()
  }
})
