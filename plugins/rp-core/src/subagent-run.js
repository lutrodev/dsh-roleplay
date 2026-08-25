/** Fresh one-shot execution helpers for the fixed Writer and isolated task subagents. */

/**
 * Run one fresh child and always dispose its resources after settlement.
 *
 * @param {object} ctx Harness context carrying `subagents`.
 * @param {string} provider Subagent transport provider.
 * @param {object} request One-shot start request.
 * @returns {Promise<{ id: string, result: Record<string, unknown> }>} Child identity and terminal result.
 */
export async function runFreshSubagent(ctx, provider, request) {
  const run = await ctx.subagents.start(provider, request)
  let result
  let resultError
  try {
    result = await run.result
  } catch (error) {
    resultError = error
  }
  let disposeError
  try {
    await run.dispose()
  } catch (error) {
    disposeError = error
  }
  if (resultError !== undefined && disposeError !== undefined) {
    throw new AggregateError([resultError, disposeError], 'subagent result and disposal both failed')
  }
  if (resultError !== undefined) throw resultError
  if (disposeError !== undefined) throw disposeError
  return { id: String(run.id), result }
}

/**
 * Require a cleanly completed child result.
 *
 * @param {Record<string, unknown>} result Child result.
 * @param {string} label User-facing role label.
 */
export function assertCompletedSubagent(result, label) {
  if (result.stopReason === 'completed') return
  const diagnostic = typeof result.diagnostic === 'string' && result.diagnostic.length > 0
    ? `: ${result.diagnostic}`
    : ''
  throw new Error(`${label} ended with ${String(result.stopReason)}${diagnostic}`)
}

/**
 * Extract visible assistant text while allowing private reasoning blocks only.
 *
 * @param {Record<string, unknown>} result Completed child result.
 * @param {string} label User-facing role label.
 * @returns {string} Concatenated visible text.
 */
export function subagentVisibleText(result, label) {
  if (!Array.isArray(result.output)) throw new Error(`${label} returned no assistant content`)
  const unsupported = result.output.find(block => block?.type !== 'text' && block?.type !== 'reasoning')
  if (unsupported !== undefined) throw new Error(`${label} returned unsupported non-text content`)
  const text = result.output
    .filter(block => block?.type === 'text' && typeof block.text === 'string')
    .map(block => block.text)
    .join('')
    .trim()
  if (text.length === 0) throw new Error(`${label} returned no visible text`)
  return text
}
