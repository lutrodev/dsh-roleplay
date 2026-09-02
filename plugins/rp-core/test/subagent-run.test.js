import assert from 'node:assert/strict'
import test from 'node:test'
import {
  runFreshStructuredSubagent,
  StructuredSubagentError,
  subagentProviderSupportsOutputSchema,
} from '../src/subagent-run.js'

test('capability-gates structured children and disposes completed runs', async () => {
  let disposed = false
  const ctx = {
    subagents: {
      getProvider(name) {
        return name === 'spawn' ? { capabilities: { outputSchema: true } } : undefined
      },
      async start(provider, request) {
        assert.equal(provider, 'spawn')
        assert.deepEqual(request.outputSchema.required, ['answer'])
        return {
          id: 'child-1',
          result: Promise.resolve({ stopReason: 'completed', structured: { answer: 42 } }),
          async dispose() { disposed = true },
        }
      },
    },
  }
  assert.equal(subagentProviderSupportsOutputSchema(ctx, 'spawn'), true)
  assert.equal(subagentProviderSupportsOutputSchema(ctx, 'missing'), false)
  const child = await runFreshStructuredSubagent(ctx, 'spawn', {
    prompt: [{ type: 'text', text: 'answer' }],
    signal: new AbortController().signal,
    outputSchema: {
      type: 'object', additionalProperties: false,
      properties: { answer: { type: 'integer' } }, required: ['answer'],
    },
  })
  assert.equal(child.id, 'child-1')
  assert.deepEqual(child.result.structured, { answer: 42 })
  assert.equal(disposed, true)
  await assert.rejects(
    runFreshStructuredSubagent(ctx, 'missing', {
      prompt: [], signal: new AbortController().signal,
      outputSchema: { type: 'object', properties: {} },
    }),
    error => error instanceof StructuredSubagentError && error.code === 'SUBAGENT_OUTPUT_SCHEMA_UNSUPPORTED',
  )
})

test('structured child timeout remains distinguishable from parent cancellation', async () => {
  const ctx = {
    subagents: {
      getProvider() { return { capabilities: { outputSchema: true } } },
      async start(_provider, request) {
        return {
          id: 'slow-child',
          result: new Promise((_resolve, reject) => {
            request.signal.addEventListener('abort', () => reject(request.signal.reason), { once: true })
          }),
          async dispose() {},
        }
      },
    },
  }
  await assert.rejects(
    runFreshStructuredSubagent(ctx, 'spawn', {
      prompt: [], signal: new AbortController().signal,
      outputSchema: { type: 'object', properties: {} },
    }, { timeoutMs: 5 }),
    error => error.code === 'SUBAGENT_TIMEOUT',
  )

  const parent = new AbortController()
  const execution = runFreshStructuredSubagent(ctx, 'spawn', {
    prompt: [], signal: parent.signal,
    outputSchema: { type: 'object', properties: {} },
  }, { timeoutMs: 1000 })
  const reason = new Error('parent cancelled')
  parent.abort(reason)
  await assert.rejects(execution, error => error === reason)
})
