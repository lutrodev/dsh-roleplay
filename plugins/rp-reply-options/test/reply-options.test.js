import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { Context } from '@deepseek-ai/cordis'
import { RpRuntime } from 'dsh-roleplay-rp-core'
import * as ReplyOptionsPlugin from '../src/index.js'
import {
  assertReplyOptionKeywords,
  DEFAULT_REPLY_OPTIONS_COUNT,
  decodeStoredReplyOptions,
  normalizeReplyOptionKeywords,
  normalizeReplyOptionsCount,
  normalizeReplyOptionsInput,
  REPLY_OPTION_KEYWORD_MAX_CHARACTERS,
  REPLY_OPTION_MAX_CHARACTERS,
  REPLY_OPTIONS_EXTENSION_NAMESPACE,
  replyOptionsExtensionSchema,
} from '../src/protocol.js'

const three = ['林岚靠近门边，低声问：“外面是谁？”', '林岚走到窗边，俯身检查留下的脚印。', '她退回走廊，快步去找同伴。']
const five = [...three, '她暂时保持沉默，留意四周。', '林岚转身离开这里。']

test('normalizes exactly the configured number of complete messages into the persisted protocol', () => {
  assert.deepEqual(normalizeReplyOptionsInput({
    options: ['  林岚靠近门边，低声问：“外面是谁？”\r\n', '林岚走到窗边，俯身检查留下的脚印。', '她退回走廊，快步去找同伴。'],
  }), {
    version: 1,
    options: three,
  })
  assert.deepEqual(normalizeReplyOptionsInput({ options: [three[0]] }, 1).options, [three[0]])
  assert.equal(normalizeReplyOptionsInput({ options: five }, 5).options.length, 5)
  assert.doesNotThrow(() => normalizeReplyOptionsInput({
    options: ['界'.repeat(REPLY_OPTION_MAX_CHARACTERS), three[1], three[2]],
  }))
})

test('rejects count mismatches, text violations, duplicates, and invalid count settings', () => {
  assert.equal(normalizeReplyOptionsCount(), DEFAULT_REPLY_OPTIONS_COUNT)
  assert.equal(normalizeReplyOptionsCount(1), 1)
  assert.equal(normalizeReplyOptionsCount(5), 5)
  for (const invalid of [0, 6, 1.5, '3']) {
    assert.throws(() => normalizeReplyOptionsCount(invalid), /integer|between 1 and 5/)
  }
  assert.throws(() => normalizeReplyOptionsInput({ options: three.slice(0, 2) }), /exactly 3 items/)
  assert.throws(() => normalizeReplyOptionsInput({ options: three }, 1), /exactly 1 item/)
  assert.throws(() => normalizeReplyOptionsInput({ options: three }, 5), /exactly 5 items/)
  assert.throws(() => normalizeReplyOptionsInput({ options: ['', three[1], three[2]] }), /must not be empty/)
  assert.throws(() => normalizeReplyOptionsInput({ options: [1, three[1], three[2]] }), /must be a string/)
  assert.throws(() => normalizeReplyOptionsInput({
    options: ['界'.repeat(REPLY_OPTION_MAX_CHARACTERS + 1), three[1], three[2]],
  }), /exceeds 200 Unicode/)
  assert.throws(() => normalizeReplyOptionsInput({ options: [three[0], ` ${three[0]} `, three[2]] }), /duplicates/)
  assert.throws(() => normalizeReplyOptionsInput({ options: three, title: 'hidden' }), /closed object/)
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
  assert.deepEqual(decodeStoredReplyOptions(stored), stored)
  assert.deepEqual(decodeStoredReplyOptions({ version: 1, options: [three[0]] }), { version: 1, options: [three[0]] })
  assert.deepEqual(decodeStoredReplyOptions({ version: 1, options: five }), { version: 1, options: five })
  assert.equal(decodeStoredReplyOptions({ version: 1, options: [] }), undefined)
  assert.equal(decodeStoredReplyOptions({ version: 1, options: [...five, '第六项'] }), undefined)
  assert.equal(decodeStoredReplyOptions({ version: 2, options: three }), undefined)
  assert.equal(decodeStoredReplyOptions({ version: 1, options: [` ${three[0]}`, three[1], three[2]] }), undefined)
  assert.equal(decodeStoredReplyOptions({ version: 1, options: three, hidden: true }), undefined)
  const schema = replyOptionsExtensionSchema(5, ['试探', '直接反抗', '', '寻求帮助', ''])
  assert.equal(schema.additionalProperties, false)
  assert.deepEqual(schema.required, ['options'])
  assert.equal(Object.hasOwn(schema.properties.options, 'minItems'), false)
  assert.equal(Object.hasOwn(schema.properties.options, 'maxItems'), false)
  assert.equal(schema.properties.options.items.type, 'string')
  assert.match(schema.description, /directly sendable third-person next messages/)
  assert.match(schema.description, /use the protagonist's established name or third-person pronoun as the narrative subject/)
  assert.match(schema.description, /what the protagonist says and\/or does next/)
  assert.match(schema.description, /First-person wording may appear only inside the protagonist's quoted dialogue/)
  assert.match(schema.description, /Do not write director instructions, other characters' reactions/)
  assert.match(schema.description, /option numbers, labels, keywords, or analysis/)
  assert.match(schema.description, /option 1: "试探"/)
  assert.match(schema.description, /option 2: "直接反抗"/)
  assert.match(schema.description, /option 4: "寻求帮助"/)
  assert.match(schema.description, /Unspecified options are model-chosen/)
  assert.match(schema.description, /do not copy it as a label/)
  assert.doesNotMatch(schema.description, /option 3:/)
  assert.match(schema.properties.options.description, /distinct third-person protagonist messages/)
  assert.match(schema.properties.options.items.description, /established name or pronoun/)
})

test('returns concise third-person correction guidance when model input is invalid', () => {
  assert.throws(
    () => normalizeReplyOptionsInput({ options: three.slice(0, 2) }),
    error => error.feedback?.correction.includes('third-person protagonist messages')
      && error.feedback.correction.includes("protagonist's established name or pronoun as the narrative subject")
      && error.feedback.correction.includes('first-person is allowed only inside quoted dialogue')
      && error.feedback.correction.includes('what the protagonist says or does next'),
  )
})

test('registers the required runtime extension only for the preset instance', () => {
  const definitions = []
  const ctx = {
    inject(dependencies, callback) {
      assert.deepEqual(dependencies, ['rpRuntime'])
      return callback({ rpRuntime: { registerArtifactExtension(definition) { definitions.push(definition); return () => {} } } })
    },
  }
  ReplyOptionsPlugin.apply(ctx, { registerRuntime: false })
  assert.equal(definitions.length, 0)
  ReplyOptionsPlugin.apply(ctx, { registerRuntime: true, count: 5, keywords: ['试探', '反抗', '', '求助', '离开'] })
  assert.equal(definitions.length, 1)
  assert.equal(definitions[0].namespace, REPLY_OPTIONS_EXTENSION_NAMESPACE)
  assert.equal(definitions[0].required, true)
  assert.match(definitions[0].schema.description, /exactly 5/)
  assert.match(definitions[0].schema.description, /option 2: "反抗"/)
  assert.deepEqual(definitions[0].validate({ options: five }), { version: 1, options: five })
  assert.throws(() => definitions[0].validate({ options: three }), /exactly 5 items/)
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
      keywords: ['试探', '', '正面应对'],
    })

    const registered = runtime.artifactExtensions.get(REPLY_OPTIONS_EXTENSION_NAMESPACE)
    assert.ok(registered)
    assert.equal(registered.required, true)

    const commitSchema = tools.get('rp_commit_turn').parameters
    assert.deepEqual(commitSchema.required, ['extensions'])
    assert.equal(commitSchema.properties.extensions.additionalProperties, false)
    assert.deepEqual(commitSchema.properties.extensions.required, [REPLY_OPTIONS_EXTENSION_NAMESPACE])

    const extensionSchema =
      commitSchema.properties.extensions.properties[REPLY_OPTIONS_EXTENSION_NAMESPACE]
    assert.ok(extensionSchema)
    assert.equal(Object.hasOwn(extensionSchema.properties.options, 'minItems'), false)
    assert.equal(Object.hasOwn(extensionSchema.properties.options, 'maxItems'), false)
    assert.deepEqual(registered.validate({ options }), { version: 1, options })
    assert.throws(
      () => registered.validate({ options: options.slice(0, 2) }),
      /exactly 3 options|exactly 3 items/,
    )
  } finally {
    await ctx.fiber.dispose()
  }
})

test('keeps the package Host instance browser-only by default', async () => {
  const patch = await readFile(new URL('../cordis.patch.yml', import.meta.url), 'utf8')
  assert.match(patch, /id: rp-reply-options[\s\S]*?registerRuntime: false/)
})
