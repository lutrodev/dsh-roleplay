import assert from 'node:assert/strict'
import test from 'node:test'
import { Context } from '@deepseek-ai/cordis'
import { RpRuntime } from '../src/runtime.js'

function runtimeHarness(profile = {}) {
  const ctx = new Context()
  let agent
  ctx.provide('llm', {
    async resolveModelInfo(provider, id) {
      return { provider, id, name: id, context: { contextWindow: 64000 }, defaultMaxTokens: 4096 }
    },
  })
  ctx.provide('tokenMeter', {
    estimateMessage(message) {
      const text = message.content?.filter(block => block.type === 'text').map(block => block.text).join('') ?? ''
      return Math.ceil(text.length / 4) + 8
    },
  })
  ctx.provide('systemPrompt', { section() {} })
  ctx.provide('tools', { register() {} })
  ctx.provide('agents', { get() { return agent } })
  const runtime = new RpRuntime(ctx, {
    chatMaxStepsPerRun: 2,
    agentMaxStepsPerRun: 8,
    maxEffectsPerCommit: 2,
    maxArtifactBytes: 4096,
    maxNarrativeCharacters: 1000,
  })
  runtime.registerSessionProfileProvider(() => profile)
  agent = { id: 'session-1', options: { provider: 'mock', model: 'mock' }, session: { ...sessionMethods(), id: 'session-1', events: [], deriveMessages: () => [] } }
  return { ctx, runtime, agent }
}

test('transforms input before adapters and context before character budgets', async () => {
  const { ctx, runtime, agent } = runtimeHarness({ runtime: { executionMode: 'chat' } })
  let name = '林澈'
  let adapterText
  runtime.registerTextTransformer({
    id: 'test.user',
    prepare: () => ({ revision: 1, name, public: { userName: name } }),
    transform: (text, { prepared }) => text.replaceAll('{{user}}', prepared.name),
  })
  runtime.registerInputAdapter({
    id: 'capture',
    normalize(messages) {
      adapterText = messages[0].content[0].text
      return adapterText
    },
  })
  runtime.registerContextSource({
    id: 'macro-context',
    parentDelivery: 'commit',
    prepare: () => ({ text: '你好，{{user}}', parentText: '为{{user}}提交状态' }),
  })
  const message = { role: 'user', source: { kind: 'user' }, content: [{ type: 'text', text: '{{user}}来了' }] }
  const run = await runtime.prepareRun(agent, 1, [message])

  assert.equal(adapterText, '林澈来了')
  assert.equal(run.fragments.find(item => item.id === 'macro-context').text, '你好，林澈')
  assert.equal(run.fragments.find(item => item.id === 'macro-context').parentText, '为林澈提交状态')
  assert.equal(run.fragments.find(item => item.id === 'macro-context').characters, 5)
  assert.deepEqual(runtime.inspectRun(agent).textTransforms, [{ id: 'test.user', revision: 1, userName: '林澈' }])

  const preview = await runtime.previewContextBuild(agent, [message])
  assert.equal(preview.contexts.find(item => item.id === 'macro-context').text, '你好，林澈')
  assert.equal(Object.hasOwn(preview.contexts.find(item => item.id === 'macro-context'), 'parentText'), false)
  assert.match(runtime.writerReadyMessage(run).content[0].text, /为林澈提交状态/)

  const artifact = await runtime.validateDraft({
    runSummary: '{{user}}抵达门前', effects: [], references: [], extensions: {},
  }, agent, run, '林澈推开门。')
  assert.equal(artifact.narrative, '林澈推开门。')
  assert.equal(artifact.runSummary, '林澈抵达门前')

  name = '后来改名'
  assert.equal(await runtime.applyTextTransforms('{{user}}', { prepared: run.textTransforms }), '林澈')
  await ctx.fiber.dispose()
})

test('chat and agent runs expose identical transformed model inputs', async () => {
  const message = { role: 'user', source: { kind: 'user' }, content: [{ type: 'text', text: '{{user}}推开门' }] }
  const contextText = '门后站着{{user}}。'
  const observed = []

  for (const executionMode of ['chat', 'agent']) {
    const { ctx, runtime, agent } = runtimeHarness({ runtime: { executionMode } })
    let adapterText
    runtime.registerTextTransformer({
      id: 'test.user',
      prepare: () => ({ revision: 1, name: '林澈', public: { userName: '林澈' } }),
      transform: (text, { prepared }) => text.replaceAll('{{user}}', prepared.name),
    })
    runtime.registerInputAdapter({
      id: 'capture',
      normalize(messages) {
        adapterText = messages[0].content[0].text
        return adapterText
      },
    })
    runtime.registerContextSource({ id: 'macro-context', prepare: () => ({ text: contextText }) })

    const run = await runtime.prepareRun(agent, 1, [message])
    observed.push({
      adapterText,
      contextText: run.fragments.find(item => item.id === 'macro-context').text,
    })
    await ctx.fiber.dispose()
  }

  assert.deepEqual(observed, [
    { adapterText: '林澈推开门', contextText: '门后站着林澈。' },
    { adapterText: '林澈推开门', contextText: '门后站着林澈。' },
  ])
})

test('one-shot transforms use a supplied pending profile', async () => {
  const { ctx, runtime, agent } = runtimeHarness({ resources: {} })
  runtime.registerTextTransformer({
    id: 'test.profile',
    prepare: ({ profile }) => ({ revision: profile?.revision ?? 0, value: profile?.label, public: {} }),
    transform: (text, { prepared }) => text.replaceAll('[name]', prepared.value ?? '[name]'),
  })
  assert.equal(await runtime.transformText('Hi [name]', { agent, profile: { revision: 2, label: '阿月' } }), 'Hi 阿月')
  await ctx.fiber.dispose()
})

test('assistant stream deltas and authoritative block text share one frozen transform', async () => {
  const { ctx, runtime, agent } = runtimeHarness({ runtime: { executionMode: 'chat' } })
  runtime.registerTextTransformer({
    id: 'test.stream',
    prepare: () => ({ revision: 'one', public: { userName: '洛' } }),
    transform: text => text.replaceAll('{{user}}', '洛'),
    createStream() {
      let buffer = ''
      return {
        push(text) { buffer += text; return buffer.includes('}}') ? buffer.replaceAll('{{user}}', '洛') : '' },
        finish() { const tail = buffer.includes('}}') ? '' : buffer; buffer = ''; return tail },
      }
    },
  })
  const run = await runtime.prepareRun(agent, 1, [{
    role: 'user', source: { kind: 'user' }, content: [{ type: 'text', text: '继续。' }],
  }])
  const source = (async function* () {
    yield { type: 'block-start', index: 0, blockType: 'text' }
    yield { type: 'text-delta', index: 0, text: '{{us' }
    yield { type: 'text-delta', index: 0, text: 'er}}' }
    yield { type: 'block-end', index: 0, block: { type: 'text', text: '{{user}}' } }
    yield { type: 'finish', reason: { kind: 'stop' } }
  })()
  const chunks = []
  const transformed = ctx.waterfall('llm/stream', { sessionId: 'session-1' }, () => source)
  for await (const chunk of transformed) chunks.push(chunk)
  assert.equal(chunks.filter(chunk => chunk.type === 'text-delta').map(chunk => chunk.text).join(''), '洛')
  assert.equal(chunks.find(chunk => chunk.type === 'block-end').block.text, '洛')
  await ctx.fiber.dispose()
})

function sessionMethods() {
  return {
    snapshotEvents() { return this.events ?? [] },
    eventAt(seq) { return this.events?.[seq] },
  }
}
