import Schema from '@deepseek-ai/schemastery'
import {
  DEFAULT_REPLY_OPTIONS_COUNT,
  normalizeReplyOptionKeywords,
  normalizeReplyOptionsCount,
  normalizeReplyOptionsInput,
  REPLY_OPTIONS_EXTENSION_NAMESPACE,
  replyOptionsExtensionSchema,
} from './protocol.js'

export * from './protocol.js'

export const name = 'rp-reply-options'
export const inject = []
export const Config = Schema.object({
  registerRuntime: Schema.boolean().default(true),
  count: Schema.number().min(1).max(5).step(1).default(DEFAULT_REPLY_OPTIONS_COUNT),
  keywords: Schema.array(Schema.string()).default([]),
})

export function apply(ctx, config) {
  if (config.registerRuntime !== true) return
  const count = normalizeReplyOptionsCount(config.count)
  const keywords = normalizeReplyOptionKeywords(config.keywords, count)
  ctx.inject(['rpRuntime'], runtimeCtx => runtimeCtx.rpRuntime.registerArtifactExtension({
    namespace: REPLY_OPTIONS_EXTENSION_NAMESPACE,
    schema: replyOptionsExtensionSchema(count, keywords),
    required: true,
    validate: value => normalizeReplyOptionsInput(value, count),
  }))
}
