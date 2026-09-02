import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { Context } from '@deepseek-ai/cordis'
import { RpRuntime } from 'dsh-roleplay-rp-core'
import * as ReplyOptionsPlugin from '../src/index.js'
import {
  assertReplyOptionKeywords,
  DEFAULT_REPLY_OPTION_MAX_CHARACTERS,
  DEFAULT_REPLY_OPTIONS_COUNT,
  decodeStoredReplyOptions,
  normalizeReplyOptionKeywords,
  normalizeReplyOptionMaxCharacters,
  normalizeReplyOptionsCount,
  normalizeReplyOptionsInput,
  REPLY_OPTION_KEYWORD_MAX_CHARACTERS,
  REPLY_OPTION_MAX_CHARACTERS,
  REPLY_OPTIONS_EXTENSION_NAMESPACE,
  renderReplyOptionsPrompt,
  replyOptionsExtensionSchema,
  replyOptionsOutputSchema,
} from '../src/protocol.js'

const three = ['林岚靠近门边，低声问：“外面是谁？”', '林岚走到窗边，俯身检查留下的脚印。', '她退回走廊，快步去找同伴。']
const five = [...three, '她暂时保持沉默，留意四周。', '林岚转身离开这里。']

test('normalizes usable messages up to the configured target without blocking on count or annotations', () => {
  assert.deepEqual(normalizeReplyOptionsInput({
    options: ['  林岚靠近门边，低声问：“外面是谁？”\r\n', '林岚走到窗边，俯身检查留下的脚印。', '她退回走廊，快步去找同伴。'],
  }), {
    version: 1,
    options: three,
  })
  assert.deepEqual(normalizeReplyOptionsInput({ options: [three[0]] }, 1).options, [three[0]])
  assert.equal(normalizeReplyOptionsInput({ options: five }, 5).options.length, 5)
  assert.deepEqual(normalizeReplyOptionsInput({
    description: 'model-added annotation',
    options: [three[0], '', ` ${three[0]} `, three[1]],
  }).options, [three[0], three[1]])
  assert.deepEqual(normalizeReplyOptionsInput({ options: five }, 3).options, three)
  const longOption = '界'.repeat(REPLY_OPTION_MAX_CHARACTERS * 10)
  assert.deepEqual(normalizeReplyOptionsInput({
    options: [longOption, three[1], three[2]],
  }).options, [longOption, three[1], three[2]])
})

test('rejects unusable structures while treating configured count and length as guidance', () => {
  assert.equal(normalizeReplyOptionsCount(), DEFAULT_REPLY_OPTIONS_COUNT)
  assert.equal(normalizeReplyOptionsCount(1), 1)
  assert.equal(normalizeReplyOptionsCount(5), 5)
  for (const invalid of [0, 6, 1.5, '3']) {
    assert.throws(() => normalizeReplyOptionsCount(invalid), /integer|between 1 and 5/)
  }
  assert.equal(normalizeReplyOptionMaxCharacters(), DEFAULT_REPLY_OPTION_MAX_CHARACTERS)
  assert.equal(normalizeReplyOptionMaxCharacters(1), 1)
  assert.equal(normalizeReplyOptionMaxCharacters(REPLY_OPTION_MAX_CHARACTERS), REPLY_OPTION_MAX_CHARACTERS)
  for (const invalid of [0, REPLY_OPTION_MAX_CHARACTERS + 1, 1.5, '30']) {
    assert.throws(() => normalizeReplyOptionMaxCharacters(invalid), /integer|between 1 and 200/)
  }
  assert.deepEqual(normalizeReplyOptionsInput({ options: three.slice(0, 2) }).options, three.slice(0, 2))
  assert.deepEqual(normalizeReplyOptionsInput({ options: three }, 1).options, [three[0]])
  assert.deepEqual(normalizeReplyOptionsInput({ options: three }, 5).options, three)
  assert.deepEqual(normalizeReplyOptionsInput({ options: ['', three[1], three[2]] }).options, three.slice(1))
  assert.throws(() => normalizeReplyOptionsInput({ options: [1, three[1], three[2]] }), /must be a string/)
  assert.doesNotThrow(() => normalizeReplyOptionsInput({
    options: ['界'.repeat(REPLY_OPTION_MAX_CHARACTERS + 1), three[1], three[2]],
  }))
  assert.deepEqual(
    normalizeReplyOptionsInput({ options: [three[0], ` ${three[0]} `, three[2]] }).options,
    [three[0], three[2]],
  )
  assert.deepEqual(normalizeReplyOptionsInput({ options: three, title: 'ignored annotation' }).options, three)
  assert.throws(() => normalizeReplyOptionsInput({ options: ['', ' '] }), /at least one usable item/)
})

test('normalizes one optional direction keyword per configured option', () => {
  assert.deepEqual(
    normalizeReplyOptionKeywords([' 试探\n对方 ', '反抗'], 5),
    ['试探 对方', '反抗', '', '', ''],
  )
  assert.deepEqual(normalizeReplyOptionKeywords(['试探', '反抗', '离开'], 1), ['试探'])
  assert.deepEqual(assertReplyOptionKeywords(['试探', '', '离开'], 3), ['试探', '', '离开'])
  assert.throws(() => assertReplyOptionKeywords(['试探', '离开'], 3), /exactly 3 items/)
  assert.throws(() => normalizeReplyOptionKeywords('试探', 3), /must be an array/)
  assert.throws(
    () => normalizeReplyOptionKeywords(['界'.repeat(REPLY_OPTION_KEYWORD_MAX_CHARACTERS + 1)], 1),
    /exceeds 40 Unicode/,
  )
  assert.throws(() => normalizeReplyOptionKeywords(['', '', '', '', '', ''], 5), /at most 5 items/)
})

test('decodes only canonical versioned event values and exposes model-facing guidance', () => {
  const stored = { version: 1, options: three }
  const longStored = { version: 1, options: ['界'.repeat(REPLY_OPTION_MAX_CHARACTERS * 10)] }
  assert.deepEqual(decodeStoredReplyOptions(stored), stored)
  assert.deepEqual(decodeStoredReplyOptions(longStored), longStored)
  assert.deepEqual(decodeStoredReplyOptions({ version: 1, options: [three[0]] }), { version: 1, options: [three[0]] })
  assert.deepEqual(decodeStoredReplyOptions({ version: 1, options: five }), { version: 1, options: five })
  assert.equal(decodeStoredReplyOptions({ version: 1, options: [] }), undefined)
  assert.equal(decodeStoredReplyOptions({ version: 1, options: [...five, '第六项'] }), undefined)
  assert.equal(decodeStoredReplyOptions({ version: 2, options: three }), undefined)
  assert.equal(decodeStoredReplyOptions({ version: 1, options: [` ${three[0]}`, three[1], three[2]] }), undefined)
  assert.equal(decodeStoredReplyOptions({ version: 1, options: three, hidden: true }), undefined)
  const schema = replyOptionsExtensionSchema(5, ['试探', '直接反抗', '', '寻求帮助', ''], 48)
  assert.equal(schema.additionalProperties, true)
  assert.deepEqual(schema.required, ['options'])
  assert.equal(Object.hasOwn(schema.properties.options, 'minItems'), false)
  assert.equal(Object.hasOwn(schema.properties.options, 'maxItems'), false)
  assert.equal(schema.properties.options.items.type, 'string')
  assert.equal(Object.hasOwn(schema.properties.options.items, 'minLength'), false)
  assert.equal(Object.hasOwn(schema.properties.options.items, 'maxLength'), false)
  assert.match(schema.description, /distinct, directly sendable roleplay continuations/)
  assert.match(schema.description, /identified from the surrounding roleplay_context context_guide/)
  assert.match(schema.description, /otherwise infer the protagonist from the remaining context and conversation/)
  assert.match(schema.description, /complete, concrete next move grounded in the current scene and led by the protagonist/)
  assert.match(schema.description, /Narration uses third person/)
  assert.match(schema.description, /dialogue uses the protagonist's natural voice/)
  assert.match(schema.description, /option 1: "试探"/)
  assert.match(schema.description, /option 2: "直接反抗"/)
  assert.match(schema.description, /option 4: "寻求帮助"/)
  assert.match(schema.description, /Shape the matching options with these directions/)
  assert.match(schema.description, /Options without a configured direction follow a plausible path suggested by the scene/)
  assert.doesNotMatch(schema.description, /established name|pronoun as the narrative subject|Do not write/)
  assert.doesNotMatch(schema.description, /option 3:/)
  assert.match(schema.properties.options.description, /distinct, directly sendable roleplay continuations/)
  assert.match(schema.properties.options.description, /within 48 Unicode characters/)
  assert.match(schema.properties.options.items.description, /complete, concrete next move by the protagonist/)
  assert.match(schema.properties.options.items.description, /ready to send as the next message/)
  assert.doesNotMatch(schema.properties.options.items.description, /established name|pronoun/)
  const outputSchema = replyOptionsOutputSchema(5, ['试探', '直接反抗', '', '寻求帮助', ''], 48)
  assert.equal(outputSchema.additionalProperties, false)
  assert.deepEqual(outputSchema.required, ['options'])
})

test('builds a bounded final-narrative-first structured generation prompt', () => {
  const prompt = renderReplyOptionsPrompt({
    narrative: '林岚推开门，发现走廊空无一人。',
    roleplayContext: `旧上下文${'界'.repeat(5000)}最近上下文`,
    count: 3,
    keywords: ['试探', '', '离开'],
    maxCharacters: 40,
    maxPromptCharacters: 1800,
  })
  assert.ok([...prompt].length <= 1800)
  assert.match(prompt, /<final_narrative>\n林岚推开门/)
  assert.match(prompt, /Option 1 direction: 试探/)
  assert.match(prompt, /Option 3 direction: 离开/)
  assert.match(prompt, /Generate 3 distinct, directly sendable roleplay continuations/)
  assert.match(prompt, /Keep each option within 40 Unicode characters/)
  assert.match(prompt, /complete, concrete next move that meaningfully continues the interaction/)
  assert.match(prompt, /Use the available space to ground it in the current scene/)
  assert.match(prompt, /specific action, dialogue, intention, or observation/)
  assert.match(prompt, /combining elements when natural/)
  assert.match(prompt, /Use third-person narration when narration is present/)
  assert.doesNotMatch(prompt, /concise length target|established name|pronoun as the subject|Do not include/)
  assert.doesNotMatch(prompt, /旧上下文/)
  assert.match(prompt, /最近上下文/)
})

test('returns positive natural-language correction guidance when model input is invalid', () => {
  assert.throws(
    () => normalizeReplyOptionsInput({ options: ['', ' '] }),
    error => error.feedback?.correction.includes('directly sendable roleplay continuations')
      && error.feedback.correction.includes('Identify the protagonist from the surrounding roleplay_context context_guide')
      && error.feedback.correction.includes('otherwise infer the protagonist from the remaining context and conversation')
      && error.feedback.correction.includes('complete, concrete next move grounded in the current scene')
      && error.feedback.correction.includes("protagonist's specific action, dialogue, intention, or observation")
      && error.feedback.correction.includes('third-person narration when narration is present')
      && error.feedback.correction.includes("protagonist's natural voice in dialogue")
      && !error.feedback.correction.includes('established name or pronoun')
      && !error.feedback.correction.includes('omit numbers and labels')
      && !error.feedback.correction.includes('Unicode characters'),
  )
})

test('registers one optional runtime generator only for the preset instance', async () => {
  const definitions = []
  const ctx = {
    inject(dependencies, callback) {
      assert.deepEqual(dependencies, ['rpRuntime'])
      return callback({ rpRuntime: { registerArtifactGenerator(definition) { definitions.push(definition); return () => {} } } })
    },
  }
  ReplyOptionsPlugin.apply(ctx, { registerRuntime: false })
  assert.equal(definitions.length, 0)
  ReplyOptionsPlugin.apply(ctx, {
    registerRuntime: true,
    count: 5,
    maxCharacters: 30,
    keywords: ['试探', '反抗', '', '求助', '离开'],
  })
  assert.equal(definitions.length, 1)
  assert.equal(definitions[0].namespace, REPLY_OPTIONS_EXTENSION_NAMESPACE)
  assert.equal(definitions[0].order, 100)
  let request
  const generated = await definitions[0].generate({
    artifact: { narrative: '林岚推开门。' },
    parentContextText: '林岚是用户控制的主角。',
    maxPromptCharacters: 5000,
    async runStructuredSubagent(value) {
      request = value
      return { id: 'reply-child', result: { stopReason: 'completed', structured: { options: five } } }
    },
  })
  assert.deepEqual(generated, { options: five })
  assert.equal(request.timeoutMs, 30000)
  assert.equal(request.outputSchema.additionalProperties, false)
  assert.match(request.outputSchema.description, /exactly 5/)
  assert.match(request.outputSchema.description, /option 2: "反抗"/)
  assert.match(request.outputSchema.properties.options.description, /within 30 Unicode characters/)
  assert.match(request.persona, /natural, substantive, directly sendable roleplay continuations/)
  assert.doesNotMatch(request.persona, /concise|quick/)
  assert.match(request.prompt[0].text, /林岚推开门/)
  assert.deepEqual(definitions[0].validate({ options: five }), { version: 1, options: five })
  const aboveGuidance = ['界'.repeat(31), ...five.slice(1)]
  assert.deepEqual(definitions[0].validate({ options: aboveGuidance }).options, aboveGuidance)
  assert.deepEqual(definitions[0].validate({ options: three }).options, three)
})

test('registers through real Cordis and RpRuntime schema validation', async () => {
  const ctx = new Context()
  const tools = new Map()
  ctx.provide('systemPrompt', { section() {} })
  ctx.provide('tools', { register(tool) { tools.set(tool.name, tool) } })
  ctx.provide('agents', { get() { return undefined } })
  const runtime = new RpRuntime(ctx, {
    chatMaxStepsPerRun: 3,
    agentMaxStepsPerRun: 8,
    maxEffectsPerCommit: 2,
    maxArtifactBytes: 4096,
  })
  const options = [
    '林岚压低声音，先问清楚门外是谁。',
    '她握紧手边的东西，悄悄退到窗边。',
    '林岚直接推门出去，看看对方究竟想做什么。',
  ]

  try {
    await ctx.plugin(ReplyOptionsPlugin, {
      registerRuntime: true,
      count: 3,
      maxCharacters: 30,
      keywords: ['试探', '', '正面应对'],
    })

    const registered = runtime.artifactGenerators.get(REPLY_OPTIONS_EXTENSION_NAMESPACE)
    assert.ok(registered)
    assert.equal(runtime.artifactExtensions.has(REPLY_OPTIONS_EXTENSION_NAMESPACE), false)
    assert.equal(registered.order, 100)

    const commitSchema = tools.get('rp_commit_turn').parameters
    assert.equal(commitSchema.oneOf.length, 2)
    const [fullCommitSchema, retryCommitSchema] = commitSchema.oneOf
    assert.equal(fullCommitSchema.required, undefined)
    assert.equal(fullCommitSchema.properties.extensions.additionalProperties, true)
    assert.equal(fullCommitSchema.properties.extensions.properties, undefined)
    assert.deepEqual(retryCommitSchema.properties.retry.required, ['token', 'patches'])
    assert.deepEqual(registered.validate({ options }), { version: 1, options })
    const aboveGuidance = ['界'.repeat(31), ...options.slice(1)]
    assert.deepEqual(registered.validate({ options: aboveGuidance }).options, aboveGuidance)
    assert.deepEqual(registered.validate({ options: options.slice(0, 2) }).options, options.slice(0, 2))
    assert.deepEqual(
      registered.validate({ options, description: 'model-added annotation' }),
      { version: 1, options },
    )
  } finally {
    await ctx.fiber.dispose()
  }
})

test('keeps the package Host instance browser-only by default', async () => {
  const patch = await readFile(new URL('../cordis.patch.yml', import.meta.url), 'utf8')
  assert.match(patch, /id: rp-reply-options[\s\S]*?registerRuntime: false/)
})
