import Schema from '@deepseek-ai/schemastery'
import { assertCompletedSubagent } from 'dsh-roleplay-rp-core/subagent-run'
import {
  DEFAULT_REPLY_OPTION_MAX_CHARACTERS,
  DEFAULT_REPLY_OPTIONS_COUNT,
  normalizeReplyOptionKeywords,
  normalizeReplyOptionMaxCharacters,
  normalizeReplyOptionsCount,
  normalizeReplyOptionsInput,
  REPLY_OPTION_MAX_CHARACTERS,
  REPLY_OPTIONS_EXTENSION_NAMESPACE,
  renderReplyOptionsPrompt,
  replyOptionsOutputSchema,
} from './protocol.js'

export * from './protocol.js'

export const name = 'rp-reply-options'
export const inject = []
export const Config = Schema.object({
  registerRuntime: Schema.boolean().default(true),
  count: Schema.number().min(1).max(5).step(1).default(DEFAULT_REPLY_OPTIONS_COUNT),
  maxCharacters: Schema.number().min(1).max(REPLY_OPTION_MAX_CHARACTERS).step(1).default(DEFAULT_REPLY_OPTION_MAX_CHARACTERS),
  keywords: Schema.array(Schema.string()).default([]),
})

const REPLY_OPTIONS_GENERATOR_TIMEOUT_MS = 30000
const REPLY_OPTIONS_GENERATOR_PERSONA = 'Generate natural, substantive, directly sendable roleplay continuations from the supplied final narrative and context. Respond with the requested structured output.'

export function apply(ctx, config) {
  if (config.registerRuntime !== true) return
  const count = normalizeReplyOptionsCount(config.count)
  const maxCharacters = normalizeReplyOptionMaxCharacters(config.maxCharacters)
  const keywords = normalizeReplyOptionKeywords(config.keywords, count)
  ctx.inject(['rpRuntime'], runtimeCtx => runtimeCtx.rpRuntime.registerArtifactGenerator({
    namespace: REPLY_OPTIONS_EXTENSION_NAMESPACE,
    order: 100,
    async generate(context) {
      const prompt = renderReplyOptionsPrompt({
        narrative: context.artifact.narrative,
        roleplayContext: context.parentContextText,
        count,
        keywords,
        maxCharacters,
        maxPromptCharacters: context.maxPromptCharacters,
      })
      const child = await context.runStructuredSubagent({
        label: '回复选项',
        prompt: [{ type: 'text', text: prompt }],
        persona: REPLY_OPTIONS_GENERATOR_PERSONA,
        outputSchema: replyOptionsOutputSchema(count, keywords, maxCharacters),
        timeoutMs: REPLY_OPTIONS_GENERATOR_TIMEOUT_MS,
      })
      assertCompletedSubagent(child.result, 'Reply options subagent')
      if (child.result.structured === undefined) {
        const error = new Error('Reply options subagent returned no structured result.')
        error.code = 'RP_REPLY_OPTIONS_STRUCTURED_OUTPUT_MISSING'
        throw error
      }
      return child.result.structured
    },
    validate: value => normalizeReplyOptionsInput(value, count),
  }))
}
