import Schema from '@deepseek-ai/schemastery'
import { RpRuntime } from './runtime.js'
import { DEFAULT_WRITER_PERSONA } from './prompts.js'

export { RpRuntime, RpRuntimeError } from './runtime.js'
export * from './protocol.js'
export * from './context-build.js'
export * from './conversation.js'
export * from './subagent-run.js'
export * from './prompts.js'

export const name = 'rp-core'
export const inject = ['agents', 'tools', 'systemPrompt', 'subagents', 'rpFeatures']

export const Config = Schema.object({
  chatMaxStepsPerRun: Schema.number().default(5),
  agentMaxStepsPerRun: Schema.number().default(20),
  maxEffectsPerCommit: Schema.number().default(64),
  maxArtifactBytes: Schema.number().default(262144),
  maxNarrativeCharacters: Schema.number().default(200000),
  maxWriterBriefCharacters: Schema.number().default(4096),
  maxSubagentPromptCharacters: Schema.number().default(20000),
  subagentProvider: Schema.string().default('spawn'),
  writerPersona: Schema.string().default(DEFAULT_WRITER_PERSONA),
})

/**
 * Mount the roleplay runtime service and its Agent hooks.
 *
 * @param {import('@deepseek-ai/cordis').Context} ctx Harness context.
 * @param {{ chatMaxStepsPerRun: number, agentMaxStepsPerRun: number, maxEffectsPerCommit: number, maxArtifactBytes: number, maxNarrativeCharacters: number, maxWriterBriefCharacters: number, maxSubagentPromptCharacters: number, subagentProvider: string, writerPersona: string }} config Runtime limits and Writer configuration.
 */
export function apply(ctx, config) {
  for (const key of ['chatMaxStepsPerRun', 'agentMaxStepsPerRun', 'maxEffectsPerCommit', 'maxArtifactBytes', 'maxNarrativeCharacters', 'maxWriterBriefCharacters', 'maxSubagentPromptCharacters']) {
    if (!Number.isSafeInteger(config[key]) || config[key] < 1) throw new Error(`rp-core: ${key} must be a positive safe integer`)
  }
  if (config.chatMaxStepsPerRun < 5) throw new Error('rp-core: chatMaxStepsPerRun must be at least 5 so Writer and commit failures both have recovery room')
  if (typeof config.subagentProvider !== 'string' || config.subagentProvider.trim().length === 0) throw new Error('rp-core: subagentProvider must be a non-empty string')
  if (typeof config.writerPersona !== 'string' || config.writerPersona.trim().length === 0) throw new Error('rp-core: writerPersona must be a non-empty string')
  const features = ctx.get('rpFeatures')
  if (typeof features?.harnessIdentity !== 'function') throw new Error('rp-core: Roleplay identity provider is unavailable')
  ctx.systemPrompt.section({
    name: 'harness:identity',
    order: ctx.systemPrompt.getSectionOrder('HARNESS_IDENTITY'),
    text: () => features.harnessIdentity(),
  })
  new RpRuntime(ctx, config)
}
