import assert from 'node:assert/strict'
import test from 'node:test'
import { Context } from '@deepseek-ai/cordis'
import { createMessage, createToolResultMessage, ToolCallId } from '@deepseek-ai/dsh-llm'
import { Session, SessionId } from '@deepseek-ai/dsh-session'
import SystemPrompt from '@deepseek-ai/dsh-system-prompt'
import ToolRuntime, { defineTool, ToolArgsError, validateJsonSchemaValue } from '@deepseek-ai/dsh-tools'
import { resolveSessionToolCall, snapshotSessionEvents } from '../src/session-runtime.js'

const dshSignal = new AbortController().signal

test('pinned DSH Session keeps snapshot and native tool-call correlation semantics', () => {
  const session = Session.create(SessionId('rp-harness-session-contract'))
  session.append('turn/start', { turn: 1 })
  session.append('step/start', { turn: 1, step: 1 })
  const callId = ToolCallId('rp-commit-contract')
  session.append('assistant/message', {
    turn: 1,
    step: 1,
    message: createMessage({
      role: 'assistant',
      content: [{ type: 'tool-call', id: callId, name: 'rp_commit_turn', arguments: '{}' }],
      source: { kind: 'model', provider: 'contract', model: 'contract' },
    }),
  }, { surfaceOp: 'append' })
  session.append('tool/call', {
    turn: 1,
    step: 1,
    callId,
    name: 'rp_commit_turn',
    arguments: '{}',
  })

  const first = snapshotSessionEvents(session)
  assert.equal(first, snapshotSessionEvents(session))
  assert.equal(Object.isFrozen(first), true)
  assert.equal(Object.isFrozen(first.at(-1)), true)
  const resolved = resolveSessionToolCall(session, {
    name: 'rp_commit_turn',
    callId: String(callId),
    turn: 1,
  })
  assert.equal(resolved.call?.type, 'tool/call')
  assert.equal(resolved.assistants.length, 1)
  assert.equal(resolved.assistants[0]?.type, 'assistant/message')

  session.append('tool/result', {
    turn: 1,
    step: 1,
    message: createToolResultMessage({ callId, content: [], isError: false }),
  }, { surfaceOp: 'append' })
  assert.notEqual(snapshotSessionEvents(session), first)
  assert.equal(first.length, 4)
})

test('pinned DSH ToolRuntime preserves static registration, validation, errors, and finalization', async () => {
  const ctx = new Context()
  await ctx.plugin(SystemPrompt)
  await ctx.plugin(ToolRuntime)
  let finalizations = 0
  ctx.tools.register(defineTool({
    name: 'rp_contract_tool',
    description: 'DSH behavior contract fixture',
    parameters: { value: { type: 'integer', required: true } },
    output: {
      schema: { type: 'integer' },
      render: (_args, value) => [{ type: 'text', text: String(value) }],
    },
    finalizeContent(_exec, result) {
      finalizations += 1
      return result.isError ? [{ type: 'text', text: 'contract-error' }] : undefined
    },
    async execute(args) {
      if (args.value === 13) throw new Error('contract body failed')
      return args.value * 2
    },
  }))

  const schema = ctx.tools.schemas().find(item => item.name === 'rp_contract_tool')
  assert.equal(schema?.parameters?.properties?.value?.type, 'integer')
  assert.deepEqual(schema?.parameters?.required, ['value'])
  assert.notEqual(schema, ctx.tools.schemas().find(item => item.name === 'rp_contract_tool'))

  const valid = await ctx.tools.execute({
    signal: dshSignal,
    callId: ToolCallId('rp-contract-valid'),
    name: 'rp_contract_tool',
    arguments: { value: 3 },
  })
  assert.deepEqual(valid, {
    content: [{ type: 'text', text: '6' }],
    isError: false,
    value: 6,
  })

  const invalid = await ctx.tools.execute({
    signal: dshSignal,
    callId: ToolCallId('rp-contract-invalid'),
    name: 'rp_contract_tool',
    arguments: { value: '3' },
  })
  assert.equal(invalid.isError, true)
  assert.deepEqual(invalid.content, [{ type: 'text', text: 'contract-error' }])
  assert.equal(invalid.error?.info?.code, 'INVALID_ARGS')

  const failed = await ctx.tools.execute({
    signal: dshSignal,
    callId: ToolCallId('rp-contract-failed'),
    name: 'rp_contract_tool',
    arguments: { value: 13 },
  })
  assert.equal(failed.isError, true)
  assert.equal(failed.error?.message, 'contract body failed')
  assert.deepEqual(failed.content, [{ type: 'text', text: 'contract-error' }])
  assert.equal(finalizations, 3)
  await ctx.fiber.dispose()
})

test('pinned DSH ToolRuntime preserves a raw static oneOf argument contract', async () => {
  const ctx = new Context()
  await ctx.plugin(SystemPrompt)
  await ctx.plugin(ToolRuntime)
  const parameters = {
    oneOf: [
      {
        type: 'object',
        additionalProperties: false,
        properties: { value: { type: 'integer' } },
        required: ['value'],
      },
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          retry: {
            type: 'object',
            additionalProperties: false,
            properties: { token: { type: 'string' } },
            required: ['token'],
          },
        },
        required: ['retry'],
      },
    ],
  }
  ctx.tools.register({
    name: 'rp_contract_oneof',
    description: 'Static full-or-retry behavior contract fixture',
    parameters,
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: value }],
    },
    async execute(args) {
      const violations = validateJsonSchemaValue(parameters, args, '')
      if (violations.length > 0) throw new ToolArgsError(violations)
      return Object.hasOwn(args, 'retry') ? 'retry' : 'full'
    },
  })

  const schema = ctx.tools.schemas().find(item => item.name === 'rp_contract_oneof')
  assert.deepEqual(schema?.parameters, parameters)
  const mixed = await ctx.tools.execute({
    signal: dshSignal,
    callId: ToolCallId('rp-contract-oneof-mixed'),
    name: 'rp_contract_oneof',
    arguments: { value: 1, retry: { token: 'token' } },
  })
  assert.equal(mixed.isError, true)
  assert.equal(mixed.error?.info?.code, 'INVALID_ARGS')
  const retry = await ctx.tools.execute({
    signal: dshSignal,
    callId: ToolCallId('rp-contract-oneof-retry'),
    name: 'rp_contract_oneof',
    arguments: { retry: { token: 'token' } },
  })
  assert.equal(retry.isError, false)
  assert.equal(retry.value, 'retry')
  await ctx.fiber.dispose()
})
