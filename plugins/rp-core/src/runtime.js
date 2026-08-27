import { createHash, randomUUID } from 'node:crypto'
import { Service } from '@deepseek-ai/cordis'
import { createUserMessage, HarnessError } from '@deepseek-ai/dsh-llm'
import { assertObjectJsonSchema, defineTool, ToolArgsError, validateJsonSchemaValue } from '@deepseek-ai/dsh-tools'
import { assertCompletedSubagent, runFreshSubagent, subagentVisibleText } from './subagent-run.js'
import { roleplayTranscriptMessages } from './conversation.js'
import {
  compileContextBuild,
  contextBuildCustomDefinitions,
  contextSourceCatalog,
  normalizeContextSource,
  reconcileChatContextBuild,
  resolveChatContextBuild,
} from './context-build.js'
import {
  decodeRpCommitEvent,
  decodeRpWriterEvent,
  isRecord,
  jsonByteLength,
  RP_COMMIT_META_KIND,
  RP_COMMIT_META_VERSION,
  RP_COMMIT_TOOL,
  RP_ASSET_TOOL,
  RP_ASSET_READ_TOOL,
  rpCurrentAssetBindingManifest,
  RP_SUBAGENT_META_KIND,
  RP_SUBAGENT_META_VERSION,
  RP_SUBAGENT_TOOL,
  RP_WRITE_ACTION,
  RP_WRITE_TOOL,
  RP_WRITER_META_KIND,
  RP_WRITER_META_VERSION,
} from './protocol.js'
import {
  AGENT_WRITER_TOOL_DESCRIPTION,
  CHAT_WRITER_TOOL_DESCRIPTION,
  COMMIT_TOOL_DESCRIPTION,
  DEFAULT_WRITER_PERSONA,
  filterUnavailableToolPromptSections,
  renderRoleplayRequest,
  renderTaskSubagentPrompt,
  renderWriterPrompt,
  roleplayRuntimeContractText,
  TASK_SUBAGENT_TOOL_DESCRIPTION,
} from './prompts.js'

const CONVERSATION_HISTORY_CONTEXT_NOTE = '[Context note: Original dialogue text, including the latest events and wording. It takes precedence over Conversation Summary.]'

const WRITER_ACTION_PARAMETER = Object.freeze({
  type: 'string',
  enum: Object.freeze([RP_WRITE_ACTION]),
  description: `Required operation. Use "${RP_WRITE_ACTION}" to generate narrative from the prepared context.`,
})

const WRITER_BRIEF_PARAMETER = Object.freeze({
  type: 'string',
  description: 'Agent mode only. Optional concise writing instruction appended after the prepared context.',
})

const AGENT_WRITER_PARAMETER_SPEC = Object.freeze({
  action: Object.freeze({ ...WRITER_ACTION_PARAMETER, required: true }),
  brief: WRITER_BRIEF_PARAMETER,
})

const AGENT_WRITER_PARAMETERS = Object.freeze({
  type: 'object',
  properties: Object.freeze({
    action: WRITER_ACTION_PARAMETER,
    brief: WRITER_BRIEF_PARAMETER,
  }),
  required: Object.freeze(['action']),
  additionalProperties: false,
})

const CHAT_WRITER_PARAMETERS = Object.freeze({
  type: 'object',
  properties: Object.freeze({ action: WRITER_ACTION_PARAMETER }),
  required: Object.freeze(['action']),
  additionalProperties: false,
})

const TASK_SUBAGENT_INPUT_PARAMETER = Object.freeze({
  type: 'object',
  additionalProperties: true,
  description: 'Optional supporting material required by the usageContract, such as a draft, outline, constraints, or selected context. Pass this object directly; never pass a JSON-encoded string. Use {} when no supporting material is needed.',
})

/** @param {object} agent @returns {boolean} Whether Harness created this Agent as a delegated child. */
function isDelegatedAgent(agent) {
  return agent?.session?.header?.origin === 'subagent'
}

/** Error with a stable roleplay runtime code. */
export class RpRuntimeError extends HarnessError {
  /**
   * @param {string} code Stable failure code.
   * @param {string} message Human-readable failure.
   */
  constructor(code, message) {
    super(message, code)
    this.name = 'RpRuntimeError'
  }
}

/** Tool argument failure enriched by capability-owned, non-mutating corrections. */
class RpCommitToolArgsError extends ToolArgsError {
  constructor(violations, corrections) {
    super(violations)
    this.corrections = corrections
  }
}

/** Roleplay orchestration service backed by the Harness Agent and Session APIs. */
export class RpRuntime extends Service {
  /**
   * @param {import('@deepseek-ai/cordis').Context} ctx Harness context.
   * @param {{ chatMaxStepsPerRun: number, agentMaxStepsPerRun: number, maxEffectsPerCommit: number, maxArtifactBytes: number, maxNarrativeCharacters: number }} config Resolved limits.
   */
  constructor(ctx, config) {
    super(ctx, 'rpRuntime')
    this.config = {
      ...config,
      maxNarrativeCharacters: config.maxNarrativeCharacters ?? 200000,
      maxWriterBriefCharacters: config.maxWriterBriefCharacters ?? 4096,
      maxSubagentPromptCharacters: config.maxSubagentPromptCharacters ?? 20000,
      subagentProvider: config.subagentProvider ?? 'spawn',
      writerPersona: config.writerPersona ?? DEFAULT_WRITER_PERSONA,
    }
    this.inputAdapters = new Map()
    this.textTransformers = new Map()
    this.contextSources = new Map()
    this.effectTypes = new Map()
    this.runGuards = new Map()
    this.commitDiagnosticProviders = new Map()
    this.artifactExtensions = new Map()
    this.chatReadableTools = new Map()
    this.taskSubagents = new Map()
    this.subagentProfileProvider = undefined
    this.runs = new WeakMap()
    this.modeRestrictions = new WeakMap()
    this.chatWriterRegistrations = new WeakMap()
    this.commitErrorFeedback = new WeakMap()
    this.sessionProfileProvider = undefined

    this.registerContextSource({
      id: 'rp.conversation',
      label: '对话历史',
      description: '当前对话中用户可见的消息、开场白与每轮最终回复；运行过程和工具结果不进入预览。',
      kind: 'conversation',
      promptCategory: 'factual',
      delivery: 'native-history',
      order: 0,
      budgetPriority: -1000,
      idleAllowed: false,
      defaultSlot: { id: 'conversation-history', label: '对话历史', order: 0 },
      prepare: ({ agent }) => renderConversationHistory(agent.session),
    })
    this.registerContextSource({
      id: 'rp.current-input',
      label: '当前输入',
      description: '触发本轮运行的用户输入；Writer Prompt 中必须恰好出现一次，但可以移动到任意 Slot。',
      kind: 'runtime',
      promptCategory: 'factual',
      order: 35,
      budgetPriority: -2000,
      required: true,
      idleAllowed: false,
      pretransformed: true,
      defaultSlot: { id: 'current-input', label: '当前输入', order: 35 },
      prepare: ({ messages }) => (messages ?? []).some(message => message?.role === 'user' && message?.source?.kind === 'user' && messageText(message).length > 0)
        ? renderCurrentInput(messages)
        : undefined,
    })

    ctx.systemPrompt.section({
      name: 'rp-agent:runtime-contract',
      order: 30,
      text: context => {
        const executionMode = this.sessionProfile(context.agent)?.runtime?.executionMode === 'agent' ? 'agent' : 'chat'
        return roleplayRuntimeContractText({
          executionMode,
          delegated: isDelegatedAgent(context.agent),
        })
      },
    })

    ctx.on('system-prompt/assemble', async (_assembly, _context, next) => {
      return filterUnavailableToolPromptSections(await next())
    })

    ctx.tools.register(this.writerTool())
    ctx.tools.register(this.subagentTool())
    ctx.tools.register(this.commitTool())
    ctx.on('session/event', (session, event) => {
      const artifact = decodeRpCommitEvent(event)
      const writerArtifact = decodeRpWriterEvent(event)
      const agent = ctx.agents.get(session.id)
      if (agent === undefined) return
      const run = this.runs.get(agent)
      if (writerArtifact !== undefined && run !== undefined && run.runId === writerArtifact.runId) {
        run.writerArtifact = writerArtifact
        run.writerCallId = undefined
        run.chatWriterRelayed = false
        return
      }
      if (artifact !== undefined && run !== undefined && run.runId === artifact.runId) {
        run.status = 'committed'
        run.artifact = artifact
        return
      }
      const failedCallId = failedToolResultCallId(event)
      if (run !== undefined && failedCallId !== undefined && failedCallId === run.commitCallId) {
        run.commitCallId = undefined
      }
      if (run !== undefined && failedCallId !== undefined && failedCallId === run.writerCallId) {
        run.writerCallId = undefined
      }
    })
    ctx.on('agent/session-start', ({ agent }) => {
      this.runs.delete(agent)
      this.syncExecutionMode(agent)
    })
    ctx.on('agent/pre-step', async (payload, next) => {
      const decision = await next()
      if (decision.kind === 'reject' || isDelegatedAgent(payload.agent)) return decision
      let run = this.runs.get(payload.agent)
      if (run === undefined || run.turn !== payload.turn) {
        run = await this.prepareRun(payload.agent, payload.turn, decision.messages)
      }
      if (payload.step > run.maxSteps) {
        this.failRun(run, 'RP_STEP_LIMIT', `Roleplay run exceeded ${run.maxSteps} model steps.`)
        return { kind: 'reject' }
      }
      const messages = await this.transformMessages(decision.messages, {
        agent: payload.agent,
        run,
        prepared: run.textTransforms,
        phase: 'input',
      })
      if (payload.step !== 1) return { ...decision, messages }
      const snapshot = this.writerReadyMessage(run)
      if (snapshot === undefined) return { ...decision, messages }
      return {
        kind: 'enter',
        messages: [...messages, snapshot],
      }
    })
    ctx.on('llm/stream', (options, next) => {
      if (options.sessionId === undefined || options.purpose !== undefined) return next()
      const agent = ctx.agents.get(options.sessionId)
      const run = agent === undefined ? undefined : this.runs.get(agent)
      if (run === undefined || run.status !== 'running') return next()
      if (run.executionMode === 'chat' && run.writerArtifact !== undefined && !run.chatWriterRelayed) {
        return this.relayChatWriterStream(next(), run)
      }
      if (run.textTransforms.length === 0 || run.writerArtifact !== undefined) return next()
      return this.transformAssistantStream(next(), { agent, run, prepared: run.textTransforms, phase: 'assistant' })
    })
    ctx.on('session/event', (session, event) => {
      if (event.type !== 'step/start') return
      const agent = ctx.agents.get(session.id)
      if (agent === undefined) return
      const run = this.runs.get(agent)
      if (run !== undefined && run.turn === event.data.turn) run.stepsObserved += 1
    })
  }

  /** @param {{ id: string, order?: number, normalize(messages: readonly unknown[], context: object): unknown | Promise<unknown> }} definition */
  registerInputAdapter(definition) {
    return this.register(this.inputAdapters, definition, 'input adapter')
  }

  /**
   * Register one ordered text transformer. `prepare` runs once for each Run;
   * `transform` then receives that frozen value for every text surface.
   * `createStream` is optional; transformers without it are safely buffered
   * until the current assistant text block closes.
   *
   * @param {{ id: string, order?: number, prepare?(context: object): unknown | Promise<unknown>, transform(text: string, context: object): string | Promise<string>, createStream?(context: object): { push(text: string): string, finish(): string } }} definition
   */
  registerTextTransformer(definition) {
    if (!isRecord(definition) || typeof definition.id !== 'string' || definition.id.length === 0
      || typeof definition.transform !== 'function') {
      throw new RpRuntimeError('RP_INVALID_REGISTRATION', 'text transformer requires a non-empty id and transform function')
    }
    if (definition.prepare !== undefined && typeof definition.prepare !== 'function') {
      throw new RpRuntimeError('RP_INVALID_REGISTRATION', `text transformer "${definition.id}" prepare must be a function`)
    }
    if (definition.createStream !== undefined && typeof definition.createStream !== 'function') {
      throw new RpRuntimeError('RP_INVALID_REGISTRATION', `text transformer "${definition.id}" createStream must be a function`)
    }
    return this.register(this.textTransformers, definition, 'text transformer')
  }

  /**
   * Expand text outside an active Run (opening messages, edits, previews).
   * A supplied profile is used instead of the currently folded Session profile.
   *
   * @param {string} text Source text.
   * @param {{ agent?: object, profile?: Record<string, unknown>, phase?: string }} context Expansion context.
   * @returns {Promise<string>} Expanded text.
   */
  async transformText(text, context = {}) {
    if (typeof text !== 'string') throw new TypeError('text must be a string')
    const profile = context.profile ?? (context.agent === undefined ? undefined : this.sessionProfile(context.agent))
    const prepared = await this.prepareTextTransforms({ ...context, profile, run: undefined })
    return this.applyTextTransforms(text, { ...context, profile, prepared })
  }

  /** @param {{ id: string, order?: number, dependsOn?: string[], legacySlotIds?: string[], legacySourceIds?: string[], prepare(context: object): unknown | Promise<unknown> }} definition */
  registerContextSource(definition) {
    const normalized = normalizeContextSource(definition)
    return this.register(this.contextSources, normalized, 'context source')
  }

  /** @param {{ kind: string, schema: object, diagnoseArguments?(effect: object, context: { path: string }): string[], validate(effect: object, context: object): unknown | Promise<unknown> }} definition */
  registerEffectType(definition) {
    if (!isRecord(definition) || typeof definition.kind !== 'string' || definition.kind.length === 0
      || typeof definition.validate !== 'function' || !isRecord(definition.schema)) {
      throw new RpRuntimeError('RP_INVALID_REGISTRATION', 'effect type requires a non-empty kind, object schema, and validate function')
    }
    if (definition.diagnoseArguments !== undefined && typeof definition.diagnoseArguments !== 'function') {
      throw new RpRuntimeError('RP_INVALID_REGISTRATION', `effect type "${definition.kind}" diagnoseArguments must be a function`)
    }
    const schema = jsonClone(definition.schema)
    assertObjectJsonSchema(schema)
    if (schema.additionalProperties !== false
      || !Array.isArray(schema.required) || !schema.required.includes('kind')
      || schema.properties?.kind?.type !== 'string' || schema.properties.kind.const !== definition.kind) {
      throw new RpRuntimeError(
        'RP_INVALID_REGISTRATION',
        `effect type "${definition.kind}" schema must be a closed object requiring kind with the same string const`,
      )
    }
    if (this.effectTypes.has(definition.kind)) {
      throw new RpRuntimeError('RP_DUPLICATE_REGISTRATION', `effect type "${definition.kind}" is already registered`)
    }
    const normalized = { ...definition, schema }
    this.effectTypes.set(definition.kind, normalized)
    this.ctx.emit('tools/change')
    const dispose = this.ctx.effect(() => () => {
      if (this.effectTypes.get(definition.kind) !== normalized) return
      this.effectTypes.delete(definition.kind)
      this.ctx.emit('tools/change')
    }, `rpRuntime.register(effect type:${definition.kind})`)
    return () => void dispose()
  }

  /** Return the live closed commit schema assembled from registered effect schemas. */
  commitParametersSchema() {
    return commitParametersSchema([...this.effectTypes.values()].map(definition => definition.schema))
  }

  /** Collect bounded capability-owned hints for otherwise opaque nested schema failures. */
  commitArgumentCorrections(args) {
    if (!isRecord(args) || !Array.isArray(args.effects)) return []
    const corrections = new Set()
    const limit = Math.min(args.effects.length, this.config.maxEffectsPerCommit)
    for (let index = 0; index < limit; index += 1) {
      const effect = args.effects[index]
      if (!isRecord(effect) || typeof effect.kind !== 'string') continue
      const diagnose = this.effectTypes.get(effect.kind)?.diagnoseArguments
      if (typeof diagnose !== 'function') continue
      let supplied
      try {
        supplied = diagnose(effect, { path: `effects[${index}]` })
      } catch {
        continue
      }
      if (!Array.isArray(supplied)) continue
      for (const correction of supplied) {
        if (typeof correction !== 'string' || correction.trim().length === 0) continue
        corrections.add([...correction.trim()].slice(0, 1000).join(''))
        if (corrections.size >= 32) return [...corrections]
      }
    }
    return [...corrections]
  }

  /** Store one model-facing correction payload until the tool pipeline finalizes the failed call. */
  recordCommitErrorFeedback(agent, callId, error) {
    if (!isRecord(agent) || typeof callId !== 'string' || callId.length === 0) return
    let calls = this.commitErrorFeedback.get(agent)
    if (calls === undefined) {
      calls = new Map()
      this.commitErrorFeedback.set(agent, calls)
    }
    calls.set(callId, commitErrorFeedback(error))
  }

  /** Consume the correction payload for one settled commit call. */
  takeCommitErrorFeedback(agent, callId) {
    if (!isRecord(agent) || typeof callId !== 'string' || callId.length === 0) return undefined
    const calls = this.commitErrorFeedback.get(agent)
    const feedback = calls?.get(callId)
    if (calls === undefined) return undefined
    calls.delete(callId)
    if (calls.size === 0) this.commitErrorFeedback.delete(agent)
    return feedback
  }

  /** @param {{ id: string, validate(artifact: object, context: object): void | Promise<void> }} definition */
  registerRunGuard(definition) {
    return this.register(this.runGuards, definition, 'run guard')
  }

  /** Register a non-blocking diagnostic producer evaluated after artifact validation. */
  registerCommitDiagnosticProvider(definition) {
    if (!isRecord(definition) || typeof definition.id !== 'string' || typeof definition.inspect !== 'function') {
      throw new RpRuntimeError('RP_INVALID_REGISTRATION', 'commit diagnostic provider requires a stable id and inspect function')
    }
    return this.register(this.commitDiagnosticProviders, definition, 'commit diagnostic provider')
  }

  /** Allow one read-only tool to remain available in Chat execution mode. */
  registerChatReadableTool(definition) {
    if (!isRecord(definition) || typeof definition.name !== 'string' || definition.name.length === 0) {
      throw new RpRuntimeError('RP_INVALID_REGISTRATION', 'Chat-readable tool requires a non-empty name')
    }
    return this.registerNamed(this.chatReadableTools, definition.name, definition, 'Chat-readable tool')
  }

  /** @param {{ namespace: string, validate(value: unknown, context: object): unknown | Promise<unknown> }} definition */
  registerArtifactExtension(definition) {
    if (!isRecord(definition) || typeof definition.namespace !== 'string' || typeof definition.validate !== 'function') {
      throw new RpRuntimeError('RP_INVALID_REGISTRATION', 'artifact extension requires a namespace and validate function')
    }
    return this.registerNamed(this.artifactExtensions, definition.namespace, definition, 'artifact extension')
  }

  /**
   * Register one fresh, isolated task subagent exposed through `rp_run_subagent`.
   *
   * @param {{ id: string, label: string, description: string, persona: string, inputSchema: object, outputSchema?: object, toolFilter?: { allow: string[] }, route?: { provider?: string, model?: string, maxTokens?: number }, order?: number }} definition Task subagent definition.
   * @returns {() => void} Registration disposer.
   */
  registerTaskSubagent(definition) {
    return this.register(this.taskSubagents, normalizeTaskSubagent(definition), 'task subagent')
  }

  /**
   * Register the sole global Writer/task-subagent source. Its `prepare`
   * result is read once and frozen for each Run.
   *
   * @param {{ id: string, prepare(context: object): { writer?: object, subagents: object[], revisions?: object } | Promise<{ writer?: object, subagents: object[], revisions?: object }> }} definition
   * @returns {() => void} Registration disposer.
   */
  registerSubagentProfileProvider(definition) {
    if (!isRecord(definition) || typeof definition.id !== 'string' || definition.id.length === 0 || typeof definition.prepare !== 'function') {
      throw new RpRuntimeError('RP_INVALID_REGISTRATION', 'subagent profile provider requires a non-empty id and prepare function')
    }
    if (this.subagentProfileProvider !== undefined) {
      throw new RpRuntimeError('RP_DUPLICATE_REGISTRATION', 'subagent profile provider is already registered')
    }
    this.subagentProfileProvider = definition
    const dispose = this.ctx.effect(() => () => {
      if (this.subagentProfileProvider === definition) this.subagentProfileProvider = undefined
    }, `rpRuntime.register(subagent-profile-provider:${definition.id})`)
    return () => void dispose()
  }

  /**
   * Bind the Session projection reader without making rp-core depend on
   * the later-loaded rpSessions Cordis service. The provider remains the sole
   * reader of the event-sourced Session profile; the runtime does not cache it.
   *
   * @param {(agent: object) => Record<string, unknown>} provider
   */
  registerSessionProfileProvider(provider) {
    if (typeof provider !== 'function') {
      throw new RpRuntimeError('RP_INVALID_REGISTRATION', 'session profile provider must be a function')
    }
    if (this.sessionProfileProvider !== undefined) {
      throw new RpRuntimeError('RP_DUPLICATE_REGISTRATION', 'session profile provider is already registered')
    }
    this.sessionProfileProvider = provider
    const dispose = this.ctx.effect(() => () => {
      if (this.sessionProfileProvider === provider) this.sessionProfileProvider = undefined
    }, 'rpRuntime.register(session-profile-provider)')
    return () => void dispose()
  }

  /** Apply the Session's persisted execution capability mask to a live Agent scope. */
  syncExecutionMode(agent) {
    const previous = this.modeRestrictions.get(agent)
    if (previous !== undefined) {
      previous()
      this.modeRestrictions.delete(agent)
    }
    const previousWriter = this.chatWriterRegistrations.get(agent)
    if (previousWriter !== undefined) {
      previousWriter()
      this.chatWriterRegistrations.delete(agent)
    }
    if (isDelegatedAgent(agent)) return
    const executionMode = this.sessionProfile(agent)?.runtime?.executionMode ?? 'chat'
    if (executionMode !== 'chat') return
    const disposeWriter = agent.ctx.tools.register(this.chatWriterTool())
    this.chatWriterRegistrations.set(agent, disposeWriter)
    try {
      this.modeRestrictions.set(agent, agent.ctx.tools.restrict({
        allow: [RP_WRITE_TOOL, RP_COMMIT_TOOL, RP_ASSET_READ_TOOL, ...this.chatReadableTools.keys()],
      }))
    } catch (error) {
      disposeWriter()
      this.chatWriterRegistrations.delete(agent)
      throw error
    }
  }

  /**
   * Return the registered ingredient catalog without reading Session data.
   *
   * @returns {Array<Record<string, unknown>>} Detached source descriptions.
   */
  describeContextSources() {
    return JSON.parse(JSON.stringify(contextSourceCatalog(ordered(this.contextSources.values()))))
  }

  /**
   * Validate and complete a persisted deterministic Chat layout.
   *
   * @param {unknown} value Candidate Session layout.
   * @param {object} [agent] Live Agent whose sources should be prepared.
   * @param {Record<string, unknown>} [profileOverride] Pending profile used while validating an update.
   * @returns {Record<string, unknown>} Canonical complete layout.
   */
  async resolveContextBuild(value, agent, profileOverride) {
    if (agent === undefined) return resolveChatContextBuild(value, ordered(this.contextSources.values()))
    const runId = `layout:${randomUUID()}`
    const profile = profileOverride ?? this.sessionProfile(agent)
    const settings = this.runSettings(agent, profile)
    const textTransforms = await this.prepareTextTransforms({ agent, profile, runId, turn: null, phase: 'context' })
    const ingredients = await this.prepareIngredients({ agent, profile, runId, turn: null, messages: [], input: {}, textTransforms, ...settings })
    return reconcileChatContextBuild(value, ingredients.definitions)
  }

  /**
   * Build a read-only next-turn preview from the current Session and optional draft messages.
   *
   * @param {object} agent Live Agent.
   * @param {readonly unknown[]} messages Prospective user messages.
   * @returns {Promise<Record<string, unknown>>} Detached preview.
   */
  async previewContextBuild(agent, messages = []) {
    const profile = this.sessionProfile(agent)
    const settings = this.runSettings(agent, profile)
    const runId = `preview:${randomUUID()}`
    const textTransforms = await this.prepareTextTransforms({ agent, profile, runId, turn: null, phase: 'preview' })
    const transformedMessages = await this.transformMessages(messages, { agent, profile, runId, turn: null, prepared: textTransforms, phase: 'input' })
    const input = await this.normalizeInput(transformedMessages, { agent, profile, runId, turn: null, messages: transformedMessages })
    const ingredients = await this.prepareIngredients({ agent, profile, runId, turn: null, messages: transformedMessages, input, textTransforms, ...settings })
    const layout = reconcileChatContextBuild(profile?.contextBuild, ingredients.definitions)
    const build = compileContextBuild({ layout, candidates: ingredients.candidates, unavailable: ingredients.unavailable })
    return this.buildView({ ...settings, runId, layout, build, ingredients, owner: 'session' })
  }

  /**
   * Return a detached read-only snapshot for Canvas and diagnostics.
   *
   * @param {object} agent Live Agent.
   * @returns {Record<string, unknown> | undefined} Current run snapshot.
   */
  inspectRun(agent) {
    const run = this.runs.get(agent)
    if (run === undefined) return undefined
    return JSON.parse(JSON.stringify({
      runId: run.runId,
      turn: run.turn,
      executionMode: run.executionMode,
      status: run.status,
      startedAt: run.startedAt,
      stepsObserved: run.stepsObserved,
      corrections: run.corrections,
      input: run.input,
      catalog: run.catalog,
      contextBuild: run.contextBuild,
      contextBuilds: run.contextBuilds,
      textTransforms: publicTextTransformSnapshots(run.textTransforms),
      fragments: run.fragments.map(({ id, revision, characters }) => ({ id, revision, characters })),
      excludedFragments: run.excludedFragments,
      artifact: run.artifact,
      writerArtifact: run.writerArtifact,
      subagents: {
        writerRoute: run.writerRoute,
        available: taskSubagentCatalog(run.taskSubagents),
        revisions: run.subagentRevisions,
      },
      failure: run.failure,
      contextEpoch: run.contextEpoch,
      commitGate: run.commitGate,
      lastAssetMutation: run.lastAssetMutation,
      commitInFlight: run.commitCallId !== undefined,
    }))
  }

  /** Record whether the most recent shared-asset command permits a narrative commit. */
  recordAssetMutationOutcome(agent, outcome) {
    const run = this.runs.get(agent)
    if (run === undefined || run.status !== 'running') {
      throw new RpRuntimeError('RP_RUN_NOT_ACTIVE', 'Shared asset mutations require an active roleplay run.')
    }
    const snapshot = assetMutationSnapshot(outcome)
    run.lastAssetMutation = snapshot
    if (snapshot.ok) {
      if (run.commitGate?.kind === 'asset-mutation') run.commitGate = undefined
      return
    }
    const failed = Object.entries(snapshot.phases ?? {}).find(([, phase]) => phase?.status === 'failed')
    const error = failed?.[1]?.error
    run.commitGate = {
      kind: 'asset-mutation',
      code: 'RP_ASSET_MUTATION_INCOMPLETE',
      message: typeof error?.message === 'string'
        ? `The ${failed[0]} phase failed: ${error.message}`
        : 'The requested shared-asset mutation did not complete. Retry it successfully before committing story prose.',
    }
  }

  /**
   * Re-read live context sources after an accepted shared-asset mutation.
   *
   * @param {object} agent Live Roleplay Agent.
   * @returns {Promise<Record<string, unknown>>} Refreshed run summary.
   */
  async refreshRunContext(agent, options = {}) {
    const run = this.runs.get(agent)
    if (run === undefined || run.status !== 'running') {
      throw new RpRuntimeError('RP_RUN_NOT_ACTIVE', 'Roleplay context can only refresh during an active run.')
    }
    const contextEpoch = run.refreshEpoch + 1
    run.refreshEpoch = contextEpoch
    const gateKind = typeof options.kind === 'string' ? options.kind : 'asset-mutation'
    try {
      const profile = this.sessionProfile(agent)
      const sourceMessages = agent.session?.deriveMessages?.() ?? []
      const messages = await this.transformMessages(sourceMessages, { agent, run, prepared: run.textTransforms, phase: 'input' })
      const input = await this.normalizeInput(messages, { agent, runId: run.runId, turn: run.turn, messages })
      const ingredients = await this.prepareIngredients({
        agent, runId: run.runId, turn: run.turn, contextEpoch, messages, input,
        profile, textTransforms: run.textTransforms,
        executionMode: run.executionMode,
      })
      const catalog = this.catalogEntries(ingredients)
      const layout = reconcileChatContextBuild(profile?.contextBuild, ingredients.definitions)
      const build = compileContextBuild({ layout, candidates: ingredients.candidates, unavailable: ingredients.unavailable })
      assignIngredients(run, { profile, input, messages, ingredients, catalog, contextEpoch })
      this.acceptBuild(run, build, 'session')
      if (run.writerArtifact !== undefined) {
        run.writerArtifact = undefined
        run.writerCallId = undefined
        run.chatWriterRelayed = false
      }
      if (run.commitGate?.kind === gateKind) run.commitGate = undefined
      return JSON.parse(JSON.stringify({
        executionMode: run.executionMode,
        owner: 'session',
        refreshed: true,
        contextEpoch,
        writerContextReady: true,
        usedCharacters: [...run.contextText].length,
        sourceCount: run.fragments.length,
        excludedSourceCount: run.excludedFragments.length,
        ...(run.executionMode === 'agent' ? { contextText: run.contextText } : {}),
      }))
    } catch (error) {
      run.commitGate = {
        kind: gateKind,
        code: typeof options.code === 'string' ? options.code : 'RP_ASSET_MUTATION_INCOMPLETE',
        message: `${typeof options.messagePrefix === 'string' ? options.messagePrefix : 'The refreshed roleplay context could not be built'}: ${error instanceof Error ? error.message : String(error)}`,
      }
      throw error
    }
  }

  /** @param {unknown} event @returns {Record<string, unknown> | undefined} */
  decodeCommitEvent(event) {
    return decodeRpCommitEvent(event)
  }

  /** @param {Map<string, unknown>} table @param {object} definition @param {string} label */
  register(table, definition, label) {
    if (!isRecord(definition) || typeof definition.id !== 'string' || definition.id.length === 0) {
      throw new RpRuntimeError('RP_INVALID_REGISTRATION', `${label} requires a non-empty id`)
    }
    return this.registerNamed(table, definition.id, definition, label)
  }

  /** @param {Map<string, unknown>} table @param {string} key @param {object} definition @param {string} label */
  registerNamed(table, key, definition, label) {
    if (table.has(key)) throw new RpRuntimeError('RP_DUPLICATE_REGISTRATION', `${label} "${key}" is already registered`)
    table.set(key, definition)
    const dispose = this.ctx.effect(() => () => {
      if (table.get(key) === definition) table.delete(key)
    }, `rpRuntime.register(${label}:${key})`)
    return () => void dispose()
  }

  /** @param {object} agent @param {number} turn @param {readonly unknown[]} messages */
  async prepareRun(agent, turn, messages) {
    const runId = randomUUID()
    const startedAt = Date.now()
    const profile = this.sessionProfile(agent)
    const settings = this.runSettings(agent, profile)
    const textTransforms = await this.prepareTextTransforms({ agent, profile, runId, turn, phase: 'run' })
    const transformedMessages = await this.transformMessages(messages, { agent, profile, runId, turn, prepared: textTransforms, phase: 'input' })
    const run = {
      runId,
      turn,
      profile,
      textTransforms,
      messages: transformedMessages,
      ...settings,
      status: 'assembling',
      startedAt,
      stepsObserved: 0,
      corrections: 0,
      input: {},
      contextMessages: transformedMessages,
      fragments: [],
      excludedFragments: [],
      contextBuild: null,
      contextBuilds: [],
      contextText: '',
      catalog: [],
      contextEpoch: 0,
      refreshEpoch: 0,
      commitGate: undefined,
      lastAssetMutation: undefined,
      artifact: undefined,
      failure: undefined,
      commitCallId: undefined,
      writerCallId: undefined,
      writerArtifact: undefined,
      chatWriterRelayed: false,
      parentRouteCandidate: undefined,
      subagentRoutesFrozen: false,
      writerRouteOverride: undefined,
      writerRoute: undefined,
      taskSubagents: new Map(),
      subagentRevisions: {},
      subagentCallIds: new Set(),
    }
    this.runs.set(agent, run)
    try {
      const subagents = await this.prepareSubagentProfile({ agent, profile, runId, turn, phase: 'run' })
      const parentRoute = parentChildRouteSnapshot(agent, profile)
      run.parentRouteCandidate = parentRoute
      run.writerRouteOverride = subagents.writer
      run.taskSubagents = new Map([...subagents.available].map(([id, subagent]) => [id, {
        ...subagent,
        resolvedRoute: undefined,
      }]))
      run.subagentRevisions = subagents.revisions
      run.input = await this.normalizeInput(transformedMessages, { agent, profile, runId, turn, messages: transformedMessages })
      const ingredients = await this.prepareIngredients({ agent, profile, runId, turn, contextEpoch: run.contextEpoch, messages: transformedMessages, input: run.input, textTransforms, executionMode: run.executionMode })
      run.excludedFragments = ingredients.unavailable
      run.catalog = this.catalogEntries(ingredients)
      const layout = reconcileChatContextBuild(profile?.contextBuild, ingredients.definitions)
      const build = compileContextBuild({ layout, candidates: ingredients.candidates, unavailable: ingredients.unavailable })
      this.acceptBuild(run, build, 'session')
      run.status = 'running'
      return run
    } catch (error) {
      this.failRun(run, error?.code ?? 'RP_CONTEXT_PREPARATION_FAILED', error instanceof Error ? error.message : String(error))
      throw error
    }
  }

  /** @param {object} agent */
  runSettings(agent, profile = this.sessionProfile(agent)) {
    const sessionRuntime = profile?.runtime ?? {}
    const executionMode = sessionRuntime.executionMode === 'agent' ? 'agent' : 'chat'
    const policyMaxSteps = executionMode === 'agent' ? this.config.agentMaxStepsPerRun : this.config.chatMaxStepsPerRun
    return {
      executionMode,
      maxSteps: Math.min(policyMaxSteps, sessionRuntime.maxSteps ?? policyMaxSteps),
    }
  }

  /** @param {object} agent @returns {Record<string, unknown> | undefined} */
  sessionProfile(agent) {
    return this.sessionProfileProvider?.(agent) ?? this.ctx.get('rpSessions')?.get(agent)
  }

  /** @param {object} base */
  async prepareTextTransforms(base) {
    const prepared = []
    for (const definition of ordered(this.textTransformers.values())) {
      const value = definition.prepare === undefined ? undefined : await definition.prepare(base)
      const publicSnapshot = isRecord(value?.public) ? jsonClone(value.public) : {}
      prepared.push({
        definition,
        value,
        snapshot: {
          id: definition.id,
          revision: validRevision(value?.revision),
          ...publicSnapshot,
        },
      })
    }
    return prepared
  }

  /** @param {object} base */
  async prepareSubagentProfile(base) {
    const available = new Map(this.taskSubagents)
    const provider = this.subagentProfileProvider
    if (provider === undefined) return { writer: undefined, available, revisions: {} }
    const snapshot = await provider.prepare(base)
    if (!isRecord(snapshot) || !Array.isArray(snapshot.subagents) || (snapshot.revisions !== undefined && !isRecord(snapshot.revisions))) {
      throw new RpRuntimeError('RP_INVALID_SUBAGENT_PROFILE', `subagent profile provider "${provider.id}" returned an invalid snapshot`)
    }
    for (const definition of snapshot.subagents) {
      const subagent = normalizeTaskSubagent(definition)
      if (available.has(subagent.id)) throw new RpRuntimeError('RP_DUPLICATE_REGISTRATION', `task subagent "${subagent.id}" is already registered`)
      available.set(subagent.id, subagent)
    }
    return {
      writer: normalizeProviderWriterRoute(snapshot.writer),
      available,
      revisions: snapshot.revisions === undefined ? {} : jsonClone(snapshot.revisions),
    }
  }

  /** @param {string} text @param {object} context */
  async applyTextTransforms(text, context) {
    let transformed = text
    for (const item of context.prepared ?? []) {
      transformed = await item.definition.transform(transformed, { ...context, prepared: item.value })
      if (typeof transformed !== 'string') {
        throw new RpRuntimeError('RP_INVALID_TEXT_TRANSFORM', `text transformer "${item.definition.id}" returned a non-string value`)
      }
    }
    return transformed
  }

  /** @param {readonly unknown[]} messages @param {object} context */
  async transformMessages(messages, context) {
    const transformed = []
    for (const message of messages) transformed.push(await transformMessageText(message, text => this.applyTextTransforms(text, context)))
    return transformed
  }

  /** @param {AsyncIterable<object>} source @param {object} context */
  async * transformAssistantStream(source, context) {
    const streams = new Map()
    const streamFor = (index) => {
      let stream = streams.get(index)
      if (stream === undefined) {
        stream = createTransformPipeline(context.prepared, context)
        streams.set(index, stream)
      }
      return stream
    }
    for await (const chunk of source) {
      if (chunk.type === 'text-delta') {
        const text = streamFor(chunk.index).push(chunk.text)
        if (text.length > 0) yield { ...chunk, text }
        continue
      }
      if (chunk.type === 'block-end' && chunk.block?.type === 'text') {
        const tail = streamFor(chunk.index).finish()
        if (tail.length > 0) yield { type: 'text-delta', index: chunk.index, text: tail }
        streams.delete(chunk.index)
        const text = await this.applyTextTransforms(chunk.block.text, context)
        yield { ...chunk, block: { ...chunk.block, text } }
        continue
      }
      if (chunk.type === 'finish') {
        for (const [index, stream] of streams) {
          const tail = stream.finish()
          if (tail.length > 0) yield { type: 'text-delta', index, text: tail }
        }
        streams.clear()
      }
      yield chunk
    }
  }

  /**
   * Make the fixed Writer the only Chat-mode prose producer. Parent text and
   * reasoning are discarded; its commit call is retained so the parent still
   * authors the atomic State and extension effects. Harness assembles these
   * native chunks into one assistant message containing Writer prose followed
   * by the commit call.
   *
   * @param {AsyncIterable<object>} source Parent model stream.
   * @param {object} run Active Chat run.
   */
  async * relayChatWriterStream(source, run) {
    const narrative = run.writerArtifact.narrative
    let outputIndex = 0
    yield { type: 'block-start', index: outputIndex, blockType: 'text' }
    for (const text of streamTextChunks(narrative)) {
      yield { type: 'text-delta', index: outputIndex, text }
    }
    yield { type: 'block-end', index: outputIndex, block: { type: 'text', text: narrative } }
    outputIndex += 1

    let commit
    let usage
    let finish
    for await (const chunk of source) {
      if (chunk.type === 'block-end' && chunk.block?.type === 'tool-call'
        && chunk.block.name === RP_COMMIT_TOOL && commit === undefined) {
        commit = chunk.block
      } else if (chunk.type === 'usage') {
        usage = chunk
      } else if (chunk.type === 'finish') {
        finish = chunk
      }
    }

    if (commit !== undefined) {
      yield { type: 'block-start', index: outputIndex, blockType: 'tool-call' }
      yield {
        type: 'tool-call-delta',
        index: outputIndex,
        id: commit.id,
        name: commit.name,
        argumentsDelta: commit.arguments,
      }
      yield { type: 'block-end', index: outputIndex, block: commit }
    }
    if (usage !== undefined) yield usage
    if (finish !== undefined) {
      if (finish.reason?.kind === 'stop' || finish.reason?.kind === 'tool-calls') {
        run.chatWriterRelayed = true
      }
      yield {
        type: 'finish',
        reason: commit !== undefined && (finish.reason?.kind === 'stop' || finish.reason?.kind === 'tool-calls')
          ? { kind: 'tool-calls' }
          : finish.reason,
      }
    }
  }

  /** @param {readonly unknown[]} messages @param {object} base */
  async normalizeInput(messages, base) {
    const input = {}
    for (const adapter of ordered(this.inputAdapters.values())) input[adapter.id] = await adapter.normalize(messages, base)
    return input
  }

  /** @param {object} base */
  async prepareIngredients(base) {
    const definitions = topologicalSources(this.contextSources)
    const resolvedDefinitions = []
    const resolvedIds = new Set()
    const candidates = []
    const unavailable = []
    for (const definition of definitions) {
      const candidate = await definition.prepare(base)
      if (candidate === undefined || candidate === null) {
        addResolvedDefinition(resolvedDefinitions, resolvedIds, definition)
        const common = contextDefinitionMetadata(definition)
        unavailable.push({ ...common, reason: 'not-applicable', characters: 0 })
        continue
      }
      if (isRecord(candidate) && Array.isArray(candidate.sources)) {
        if (candidate.sources.length === 0) {
          addResolvedDefinition(resolvedDefinitions, resolvedIds, definition)
          unavailable.push({ ...contextDefinitionMetadata(definition), reason: 'not-applicable', characters: 0 })
          continue
        }
        for (const expanded of candidate.sources) {
          if (!isRecord(expanded) || typeof expanded.text !== 'string') {
            throw new RpRuntimeError('RP_INVALID_CONTEXT', `context source "${definition.id}" returned an invalid expanded source`)
          }
          const expandedDefinition = normalizeContextSource({
            ...definition,
            ...expanded,
            prepare: definition.prepare,
            dependsOn: definition.dependsOn,
          })
          addResolvedDefinition(resolvedDefinitions, resolvedIds, expandedDefinition)
          const text = expandedDefinition.delivery === 'native-history' || expandedDefinition.pretransformed
            ? expanded.text
            : await this.applyTextTransforms(expanded.text, { ...base, prepared: base.textTransforms ?? [], phase: 'context', sourceId: expandedDefinition.id })
          candidates.push(contextCandidate(expandedDefinition, { ...expanded, text, characters: [...text].length }))
        }
        continue
      }
      if (!isRecord(candidate) || typeof candidate.text !== 'string') {
        throw new RpRuntimeError('RP_INVALID_CONTEXT', `context source "${definition.id}" returned no text`)
      }
      addResolvedDefinition(resolvedDefinitions, resolvedIds, definition)
      const text = definition.delivery === 'native-history' || definition.pretransformed
        ? candidate.text
        : await this.applyTextTransforms(candidate.text, { ...base, prepared: base.textTransforms ?? [], phase: 'context', sourceId: definition.id })
      candidates.push(contextCandidate(definition, { ...candidate, text, characters: [...text].length }))
    }
    const customContents = new Map((base.profile?.contextBuild?.customSources ?? []).map(source => [source.slotId, source.content]))
    for (const definition of contextBuildCustomDefinitions(base.profile?.contextBuild)) {
      addResolvedDefinition(resolvedDefinitions, resolvedIds, definition)
      const sourceText = customContents.get(definition.defaultSlot.id)
      const text = await this.applyTextTransforms(sourceText, { ...base, prepared: base.textTransforms ?? [], phase: 'context', sourceId: definition.id })
      candidates.push(contextCandidate(definition, {
        text,
        revision: base.profile?.revision ?? null,
        characters: [...text].length,
        diagnostics: { owner: 'session' },
      }))
    }
    return { definitions: resolvedDefinitions, candidates, unavailable }
  }

  /** @param {object} run @param {object} build @param {'session' | 'agent'} owner */
  acceptBuild(run, build, owner) {
    run.fragments = build.fragments
    run.excludedFragments = build.excluded
    run.contextText = build.contextText
    run.contextBuild = { version: 1, owner, slots: build.slots }
    run.contextBuilds.push(run.contextBuild)
  }

  /** @param {{ definitions: readonly object[], candidates: readonly object[], unavailable: readonly object[] }} ingredients */
  catalogEntries(ingredients) {
    const candidates = new Map(ingredients.candidates.map(item => [item.id, item]))
    const unavailable = new Map(ingredients.unavailable.map(item => [item.id, item]))
    return contextSourceCatalog(ingredients.definitions).map(source => {
      const candidate = candidates.get(source.id)
      const excluded = unavailable.get(source.id)
      return {
        ...source,
        available: candidate !== undefined,
        characters: candidate?.characters ?? 0,
        revision: candidate?.revision ?? null,
        diagnostics: candidate?.diagnostics ?? null,
        reason: excluded?.reason ?? null,
      }
    })
  }

  /** @param {object} run */
  writerReadyMessage(run) {
    const preparedAt = Date.now()
    const availableSubagents = run.executionMode === 'agent' ? taskSubagentCatalog(run.taskSubagents) : []
    const parentCommitFragments = run.executionMode === 'chat'
      ? run.fragments.filter(fragment => fragment.parentDelivery === 'commit')
      : []
    const commitContext = parentCommitFragments.length === 0
      ? ''
      : parentCommitFragments.map(fragment => `<item source="${escapeAttribute(fragment.id)}">\n${fragment.text}\n</item>`).join('\n')
    const text = renderRoleplayRequest({
      executionMode: run.executionMode,
      assetBindings: rpCurrentAssetBindingManifest(run.profile),
      specialists: availableSubagents,
      roleplayContext: run.contextText,
      commitContext,
    })
    return createUserMessage({
      content: [{ type: 'text', text }],
      source: {
        kind: 'plugin',
        plugin: 'rp-core',
        form: 'writer-ready',
        rpRun: this.runMessageMetadata(run, preparedAt),
        contextBuild: run.contextBuild,
      },
    })
  }

  /** @param {object} run @param {number} preparedAt */
  runMessageMetadata(run, preparedAt) {
    return {
      version: 1,
      runId: run.runId,
      turn: run.turn,
      executionMode: run.executionMode,
      contextOwner: 'session',
      maxSteps: run.maxSteps,
      usedCharacters: [...run.contextText].length,
      inputAdapters: ordered(this.inputAdapters.values()).map(adapter => adapter.id),
      textTransforms: publicTextTransformSnapshots(run.textTransforms),
      sourceOrder: run.fragments.map(fragment => fragment.id),
      contextMeta: run.fragments.map(contextMetadata),
      contextEpoch: run.contextEpoch,
      excludedContexts: run.excludedFragments,
      startedAt: run.startedAt,
      preparedAt,
    }
  }

  /** @param {object} input */
  buildView({ executionMode, maxSteps, runId, layout, build, ingredients, owner }) {
    return JSON.parse(JSON.stringify({
      version: 1,
      runId,
      executionMode,
      contextOwner: owner,
      maxSteps,
      usedCharacters: build.usedCharacters,
      slots: build.slots,
      layoutSlots: layout.slots,
      customSources: build.customSources,
      sources: this.catalogEntries(ingredients),
      contexts: build.fragments.map(fragment => ({ ...contextMetadata(fragment), text: fragment.text, slotId: fragment.slotId, slotLabel: fragment.slotLabel })),
      excludedContexts: build.excluded,
      contextText: build.contextText,
    }))
  }

  /** @param {object} run @param {string} code @param {string} message */
  failRun(run, code, message) {
    if (run.status === 'failed') return
    run.status = 'failed'
    run.failure = { code, message }
  }

  writerTool() {
    const runtime = this
    const writer = defineTool({
      name: RP_WRITE_TOOL,
      description: AGENT_WRITER_TOOL_DESCRIPTION,
      parameters: AGENT_WRITER_PARAMETER_SPEC,
      output: {
        schema: { type: 'json' },
        render: (_args, value) => [{ type: 'text', text: value.narrative }],
        presentationMeta: (_args, value) => value.meta,
      },
      async execute(args, exec) {
        if (exec.agent === undefined) throw new RpRuntimeError('RP_AGENT_REQUIRED', 'rp_write_turn requires an agent-owned tool execution')
        const run = runtime.runs.get(exec.agent)
        if (run === undefined || run.status !== 'running') {
          throw new RpRuntimeError('RP_RUN_NOT_ACTIVE', 'No active roleplay run is available for Writer generation.')
        }
        if (run.commitGate !== undefined) {
          throw new RpRuntimeError(run.commitGate.code, run.commitGate.message)
        }
        if (run.writerArtifact !== undefined) {
          throw new RpRuntimeError('RP_WRITER_ALREADY_COMPLETED', 'This roleplay run already has its sole completed Writer result.')
        }
        if (run.writerCallId !== undefined) throw new RpRuntimeError('RP_WRITER_IN_FLIGHT', 'A Writer subagent is already running for this roleplay run.')
        if (run.executionMode === 'chat' && args.brief !== undefined) {
          throw new RpRuntimeError('RP_CHAT_WRITER_BRIEF_NOT_ALLOWED', 'Chat mode rp_write_turn does not accept a writing brief.')
        }
        const brief = optionalText(args.brief)
        if (brief !== undefined && [...brief].length > runtime.config.maxWriterBriefCharacters) {
          throw new RpRuntimeError('RP_WRITER_BRIEF_LIMIT', `Writer brief exceeds ${runtime.config.maxWriterBriefCharacters} characters.`)
        }
        const prompt = renderWriterPrompt(run.contextText, brief)
        const callId = String(exec.callId ?? '')
        if (callId.length === 0) throw new RpRuntimeError('RP_WRITER_CALL_REQUIRED', 'rp_write_turn requires a durable model tool call id.')
        run.writerCallId = callId
        try {
          const route = runtime.writerRoute(run, exec.agent)
          const child = await runFreshSubagent(runtime.ctx, runtime.config.subagentProvider, {
            label: '写作',
            prompt: [{ type: 'text', text: prompt }],
            parent: exec.agent,
            signal: exec.signal,
            agentOptions: route,
            persona: runtime.config.writerPersona,
            toolFilter: { allow: [] },
            maxDepth: 1,
          })
          assertCompletedSubagent(child.result, 'Writer subagent')
          const sourceNarrative = subagentVisibleText(child.result, 'Writer subagent')
          const narrative = await runtime.applyTextTransforms(sourceNarrative, {
            agent: exec.agent,
            run,
            prepared: run.textTransforms,
            phase: 'assistant',
          })
          if (narrative.trim().length === 0) throw new RpRuntimeError('RP_WRITER_EMPTY', 'Writer subagent returned no visible narrative.')
          if ([...narrative].length > runtime.config.maxNarrativeCharacters) {
            throw new RpRuntimeError('RP_NARRATIVE_LIMIT', `Writer prose exceeds ${runtime.config.maxNarrativeCharacters} characters.`)
          }
          const meta = {
            kind: RP_WRITER_META_KIND,
            version: RP_WRITER_META_VERSION,
            runId: run.runId,
            turn: run.turn,
            executionMode: run.executionMode,
            writerSessionId: child.id,
            provider: route.provider,
            model: route.model,
            promptHash: createHash('sha256').update(prompt).digest('hex'),
            promptCharacters: [...prompt].length,
            contextBuild: jsonClone(run.contextBuild),
            sourceOrder: run.fragments.map(fragment => fragment.id),
            contextMeta: run.fragments.map(contextMetadata),
            sections: run.fragments.map(fragment => ({
              name: fragment.id, slotId: fragment.slotId, slotLabel: fragment.slotLabel, text: fragment.text,
            })),
            excludedContexts: run.excludedFragments,
            brief: brief ?? null,
            narrative,
            completedAt: Date.now(),
          }
          return { narrative, meta }
        } catch (error) {
          run.writerCallId = undefined
          throw error
        }
      },
      presentCall: () => ({ card: 'generic', title: 'Writer 正在生成正文', kind: 'read' }),
      presentResult: (_args, result) => ({
        card: 'generic',
        title: result.isError ? 'Writer 生成失败' : 'Writer 已生成初稿',
        kind: 'read',
        rawOutput: result.content,
      }),
    })
    return {
      ...writer,
      parameters: AGENT_WRITER_PARAMETERS,
      async execute(args, exec) {
        const violations = validateJsonSchemaValue(AGENT_WRITER_PARAMETERS, args, '')
        if (violations.length > 0) throw new ToolArgsError(violations)
        return writer.execute(args, exec)
      },
    }
  }

  /** Chat-scoped Writer definition whose model-visible schema accepts only the write action. */
  chatWriterTool() {
    const writer = this.writerTool()
    return {
      ...writer,
      description: CHAT_WRITER_TOOL_DESCRIPTION,
      parameters: CHAT_WRITER_PARAMETERS,
      async execute(args, exec) {
        const violations = validateJsonSchemaValue(CHAT_WRITER_PARAMETERS, args, '')
        if (violations.length > 0) throw new ToolArgsError(violations)
        return writer.execute(args, exec)
      },
    }
  }

  subagentTool() {
    const runtime = this
    return defineTool({
      name: RP_SUBAGENT_TOOL,
      description: TASK_SUBAGENT_TOOL_DESCRIPTION,
      parameters: {
        subagent: { type: 'string', required: true, description: 'Stable id from <specialist_catalog>.' },
        task: { type: 'string', required: true, description: 'Complete, specific objective that satisfies the selected usageContract.' },
        input: TASK_SUBAGENT_INPUT_PARAMETER,
      },
      output: {
        schema: { type: 'json' },
        render: (_args, value) => [{
          type: 'text',
          text: value.text ?? JSON.stringify(value.structured),
        }],
        presentationMeta: (_args, value) => value.meta,
      },
      isConcurrencySafe: () => true,
      async execute(args, exec) {
        if (exec.agent === undefined) throw new RpRuntimeError('RP_AGENT_REQUIRED', 'rp_run_subagent requires an agent-owned tool execution')
        const run = runtime.runs.get(exec.agent)
        if (run === undefined || run.status !== 'running' || run.executionMode !== 'agent') {
          throw new RpRuntimeError('RP_SUBAGENT_NOT_AVAILABLE', 'rp_run_subagent is available only during an active Agent-mode roleplay run.')
        }
        const subagent = run.taskSubagents.get(args.subagent)
        if (subagent === undefined) throw new RpRuntimeError('RP_SUBAGENT_NOT_FOUND', `Task subagent "${String(args.subagent)}" is not registered.`)
        const task = requiredText(args.task, 'task')
        const subagentInput = args.input === undefined ? {} : args.input
        const violations = validateJsonSchemaValue(subagent.inputSchema, subagentInput, 'input')
        if (violations.length > 0) throw new RpRuntimeError('RP_SUBAGENT_INPUT_INVALID', violations.join('; '))
        const prompt = renderTaskSubagentPrompt({ task, input: subagentInput })
        if ([...prompt].length > runtime.config.maxSubagentPromptCharacters) {
          throw new RpRuntimeError('RP_SUBAGENT_PROMPT_LIMIT', `Task subagent prompt exceeds ${runtime.config.maxSubagentPromptCharacters} characters.`)
        }
        const callId = String(exec.callId ?? randomUUID())
        if (run.subagentCallIds.has(callId)) throw new RpRuntimeError('RP_SUBAGENT_IN_FLIGHT', 'This task subagent call is already running.')
        run.subagentCallIds.add(callId)
        try {
          const route = runtime.taskSubagentRoute(run, subagent, exec.agent)
          const child = await runFreshSubagent(runtime.ctx, runtime.config.subagentProvider, {
            label: subagent.label,
            prompt: [{ type: 'text', text: prompt }],
            parent: exec.agent,
            signal: exec.signal,
            agentOptions: route,
            persona: subagent.persona,
            toolFilter: subagent.toolFilter,
            maxDepth: 1,
            ...(subagent.outputSchema === undefined ? {} : { outputSchema: subagent.outputSchema }),
          })
          assertCompletedSubagent(child.result, `${subagent.label} subagent`)
          const text = child.result.output?.some(block => block?.type === 'text')
            ? subagentVisibleText(child.result, `${subagent.label} subagent`)
            : undefined
          const structured = child.result.structured
          if (text === undefined && structured === undefined) {
            throw new RpRuntimeError('RP_SUBAGENT_EMPTY', `${subagent.label} subagent returned no result.`)
          }
          const meta = {
            kind: RP_SUBAGENT_META_KIND,
            version: RP_SUBAGENT_META_VERSION,
            runId: run.runId,
            turn: run.turn,
            subagent: subagent.id,
            label: subagent.label,
            subagentSessionId: child.id,
            provider: route.provider,
            model: route.model,
            completedAt: Date.now(),
          }
          return { subagent: subagent.id, label: subagent.label, ...(text === undefined ? {} : { text }), ...(structured === undefined ? {} : { structured }), meta }
        } finally {
          run.subagentCallIds.delete(callId)
        }
      },
      finalizeContent(_exec, result) {
        if (!result.isError) return undefined
        const feedback = subagentArgumentFeedback(result.error)
        return feedback === undefined
          ? undefined
          : [{ type: 'text', text: JSON.stringify({ status: 'error', error: feedback }) }]
      },
      presentCall: () => ({ card: 'generic', title: '独立子代理正在处理任务', kind: 'read' }),
      presentResult: (_args, result) => ({
        card: 'generic',
        title: result.isError ? '独立子代理执行失败' : '独立子代理已返回结果',
        kind: 'read',
        rawOutput: result.content,
      }),
    })
  }

  freezeSubagentRoutes(run, agent) {
    if (run.subagentRoutesFrozen) return
    const loggedRoute = loggedParentChildRouteSnapshot(agent)
    const parentRoute = completeChildRoute(loggedRoute) ? loggedRoute : run.parentRouteCandidate
    if (!completeChildRoute(parentRoute)) return
    run.writerRoute = freezeChildRoute(parentRoute, run.writerRouteOverride)
    for (const subagent of run.taskSubagents.values()) {
      subagent.resolvedRoute = freezeChildRoute(parentRoute, subagent.route)
    }
    run.subagentRoutesFrozen = true
  }

  writerRoute(run, agent) {
    this.freezeSubagentRoutes(run, agent)
    return requiredFrozenChildRoute(run.writerRoute)
  }

  taskSubagentRoute(run, subagent, agent) {
    this.freezeSubagentRoutes(run, agent)
    return requiredFrozenChildRoute(subagent.resolvedRoute)
  }

  commitTool() {
    const runtime = this
    const tool = defineTool({
      name: RP_COMMIT_TOOL,
      description: COMMIT_TOOL_DESCRIPTION,
      parameters: {
        runSummary: { type: 'string', description: 'Optional concise factual summary of the beat and immediate continuation state. Omit it to use a short excerpt of the visible prose.' },
        effects: {
          type: 'array',
          description: 'Optional persistent changes from effect kinds registered in the current Roleplay capability set. Omit when nothing changes, and follow the active capability context or guidance for each effect payload.',
          items: { type: 'json' },
        },
        references: {
          type: 'array',
          description: 'Optional precise source citations for diagnostics. Omit rather than guess. Every supplied reference must copy an active source id and its exact revision.',
          items: {
            type: 'object',
            additionalProperties: true,
            properties: {
              source: { type: 'string', required: true, description: 'Exact id of one source used by the active context build.' },
              id: { type: 'string', required: true, description: 'Stable entry or asset id within that source.' },
              revision: { oneOf: [{ type: 'string' }, { type: 'integer' }], required: true, description: 'Exact revision copied from the active context source.' },
            },
          },
        },
        extensions: { type: 'object', description: 'Optional registered extension results keyed by extension namespace. Omit when none are used.', additionalProperties: true },
      },
      output: {
        schema: { type: 'json' },
        render: () => [{ type: 'text', text: 'Roleplay turn committed.' }],
        presentationMeta: (_args, value) => value.meta,
      },
      async execute(args, exec) {
        if (exec.agent === undefined) throw new RpRuntimeError('RP_AGENT_REQUIRED', 'rp_commit_turn requires an agent-owned tool execution')
        const run = runtime.runs.get(exec.agent)
        if (run === undefined || run.status !== 'running') {
          throw new RpRuntimeError('RP_RUN_NOT_ACTIVE', 'No active roleplay run is available for this commit.')
        }
        if (run.commitGate !== undefined) {
          throw new RpRuntimeError(run.commitGate.code, run.commitGate.message)
        }
        if (run.writerArtifact === undefined) {
          throw new RpRuntimeError('RP_WRITER_REQUIRED', 'Narrative commits require one successful rp_write_turn result.')
        }
        if (run.commitCallId !== undefined) throw new RpRuntimeError('RP_COMMIT_IN_FLIGHT', 'This roleplay run already has a commit in flight.')
        const callId = String(exec.callId ?? '')
        if (callId.length === 0) throw new RpRuntimeError('RP_COMMIT_CALL_REQUIRED', 'rp_commit_turn requires a durable model tool call id.')
        run.commitCallId = callId
        let artifact
        let assistant
        let context
        try {
          assistant = runtime.resolveCommitAssistant(exec.agent, run, callId)
          context = runtime.captureCommitContext(run)
          artifact = await runtime.validateDraft(args, exec.agent, run, assistant.narrative, context)
        } catch (error) {
          run.commitCallId = undefined
          throw error
        }
        exec.concludeTurn()
        return {
          committed: true,
          meta: {
            kind: RP_COMMIT_META_KIND,
            version: RP_COMMIT_META_VERSION,
            runId: context.runId,
            turn: context.turn,
            assistant: { seq: assistant.event.seq, messageId: assistant.message.id },
            executionMode: context.executionMode,
            mode: artifact.mode,
            runSummary: artifact.runSummary,
            effects: artifact.effects,
            references: artifact.references,
            extensions: artifact.extensions,
            diagnostics: artifact.diagnostics,
            contextSources: context.fragments.map(fragment => ({ id: fragment.id, revision: fragment.revision })),
            contextBuild: context.contextBuild,
            writer: {
              writerSessionId: run.writerArtifact.writerSessionId,
              provider: run.writerArtifact.provider,
              model: run.writerArtifact.model,
              promptHash: run.writerArtifact.promptHash,
            },
            committedAt: Date.now(),
          },
        }
      },
      finalizeContent(exec, result) {
        const feedback = runtime.takeCommitErrorFeedback(exec.agent, String(exec.callId ?? ''))
        if (!result.isError || feedback === undefined) return undefined
        return [{ type: 'text', text: JSON.stringify({ status: 'error', error: feedback }) }]
      },
      presentCall: () => ({ card: 'generic', title: 'Commit roleplay turn', kind: 'other' }),
      presentResult: (_args, result) => ({
        card: 'generic',
        title: result.isError ? 'Roleplay commit failed' : 'Roleplay turn committed',
        kind: 'other',
        rawOutput: result.content,
      }),
    })
    const execute = tool.execute
    tool.execute = async (args, exec) => {
      try {
        const violations = validateJsonSchemaValue(runtime.commitParametersSchema(), args, '')
        if (violations.length > 0) {
          throw new RpCommitToolArgsError(violations, runtime.commitArgumentCorrections(args))
        }
        return await execute(args, exec)
      } catch (error) {
        runtime.recordCommitErrorFeedback(exec.agent, String(exec.callId ?? ''), error)
        throw error
      }
    }
    Object.defineProperty(tool, 'parameters', {
      enumerable: true,
      get: () => runtime.commitParametersSchema(),
    })
    return tool
  }

  /** @param {object} agent @param {object} run @param {string} callId */
  resolveCommitAssistant(agent, run, callId) {
    const events = agent.session?.events
    if (!Array.isArray(events)) throw new RpRuntimeError('RP_COMMIT_MESSAGE_MISSING', 'The Session Event Log is unavailable for this commit.')
    const call = events.findLast(event => event?.type === 'tool/call'
      && String(event.data?.callId) === callId
      && event.data?.name === RP_COMMIT_TOOL)
    if (call === undefined || call.data?.turn !== run.turn) {
      throw new RpRuntimeError('RP_COMMIT_CALL_MISMATCH', 'The commit call does not belong to the active roleplay turn.')
    }
    const candidates = events.filter(event => Number.isSafeInteger(event?.seq) && event.seq < call.seq
      && event?.type === 'assistant/message'
      && event.data?.turn === call.data.turn
      && event.data?.step === call.data.step
      && event.data?.message?.source?.kind === 'model'
      && Array.isArray(event.data?.message?.content)
      && event.data.message.content.some(block => block?.type === 'tool-call' && String(block.id) === callId))
    if (candidates.length !== 1) throw new RpRuntimeError('RP_COMMIT_MESSAGE_MISSING', 'The commit must correlate to exactly one model assistant message.')
    const event = candidates[0]
    const message = event.data.message
    const calls = message.content.filter(block => block?.type === 'tool-call')
    if (calls.length !== 1) {
      throw new RpRuntimeError('RP_COMMIT_MESSAGE_INVALID', 'Call rp_commit_turn separately from every other tool.')
    }
    const narrative = assistantNarrative(message)
    if (narrative.length > 0) return { event, message, narrative }
    const retry = latestFailedCommitNarrative(events, call, event)
    if (retry !== undefined) return retry
    throw new RpRuntimeError(
      'RP_NARRATIVE_REQUIRED',
      run.executionMode === 'chat'
        ? 'The Writer prose was not present in the Chat assistant stream. Retry rp_commit_turn so the runtime can pair it with the completed Writer narrative.'
        : 'The rp_write_turn result is internal and is not visible to the user. Emit the complete intended final narrative itself as ordinary text, not an acknowledgement, plan, preface, or rewrite description; then place rp_commit_turn after that text in the same assistant message. Do not send a tool-only commit.',
    )
  }

  /** Freeze the context identity that produced the assistant prose before commit validation awaits. */
  captureCommitContext(run) {
    return {
      runId: run.runId,
      turn: run.turn,
      executionMode: run.executionMode,
      contextEpoch: run.contextEpoch,
      buildIndex: run.contextBuilds.length,
      contextMessages: run.contextMessages,
      input: run.input,
      textTransforms: run.textTransforms,
      fragments: run.fragments.map(fragment => jsonClone(fragment)),
      contextBuild: run.contextBuild === null ? null : jsonClone(run.contextBuild),
      mode: run.profile?.mode ?? 'director',
      writerArtifact: run.writerArtifact === undefined ? undefined : jsonClone(run.writerArtifact),
    }
  }

  /** @param {unknown} draft @param {object} agent @param {object} run @param {string} narrative @param {object} context */
  async validateDraft(draft, agent, run, narrative, context = this.captureCommitContext(run)) {
    if (!isRecord(draft)) throw new RpRuntimeError('RP_INVALID_ARTIFACT', 'Roleplay artifact must be an object.')
    // Model narrative has already crossed the Run-frozen assistant stream
    // transformer before its native assistant/message was assembled. Applying
    // again here would corrupt replacement names that themselves resemble a macro.
    const transformedNarrative = narrative
    if ([...transformedNarrative].length > this.config.maxNarrativeCharacters) {
      throw new RpRuntimeError('RP_NARRATIVE_LIMIT', `Roleplay prose exceeds ${this.config.maxNarrativeCharacters} characters.`)
    }
    const sourceRunSummary = optionalText(draft.runSummary)
    const runSummary = sourceRunSummary === undefined
      ? narrativeExcerpt(transformedNarrative)
      : requiredText(await this.applyTextTransforms(
        sourceRunSummary,
        { agent, run, prepared: context.textTransforms, phase: 'commit-summary' },
      ), 'runSummary')
    const sourceEffects = draft.effects === undefined ? [] : Array.isArray(draft.effects) ? draft.effects : undefined
    if (sourceEffects === undefined) throw new RpRuntimeError('RP_INVALID_EFFECTS', 'effects must be an array when provided')
    if (sourceEffects.length > this.config.maxEffectsPerCommit) {
      throw new RpRuntimeError('RP_EFFECT_LIMIT', `effects contains ${sourceEffects.length} items; maximum is ${this.config.maxEffectsPerCommit}`)
    }
    const references = validateReferences(draft.references ?? [], context)
    const sourceExtensions = draft.extensions === undefined ? {} : isRecord(draft.extensions) ? draft.extensions : undefined
    if (sourceExtensions === undefined) throw new RpRuntimeError('RP_INVALID_EXTENSIONS', 'extensions must be an object when provided')
    const effects = []
    for (const candidate of sourceEffects) {
      if (!isRecord(candidate) || typeof candidate.kind !== 'string') {
        throw new RpRuntimeError('RP_INVALID_EFFECT', 'every effect requires a string kind')
      }
      const handler = this.effectTypes.get(candidate.kind)
      if (handler === undefined) throw new RpRuntimeError('RP_UNKNOWN_EFFECT', `effect kind "${candidate.kind}" is not registered`)
      const normalized = await handler.validate(candidate, { agent, run, acceptedEffects: effects })
      if (!isRecord(normalized)) throw new RpRuntimeError('RP_INVALID_EFFECT', `effect handler "${candidate.kind}" returned no canonical object`)
      effects.push(normalized)
    }
    const extensions = {}
    for (const [namespace, value] of Object.entries(sourceExtensions)) {
      const handler = this.artifactExtensions.get(namespace)
      if (handler === undefined) throw new RpRuntimeError('RP_UNKNOWN_EXTENSION', `artifact extension "${namespace}" is not registered`)
      extensions[namespace] = await handler.validate(value, { agent, run, effects })
    }
    const mode = context.mode
    const artifact = { narrative: transformedNarrative, runSummary, effects, references, extensions, diagnostics: [], mode }
    for (const guard of ordered(this.runGuards.values())) await guard.validate(artifact, { agent, run })
    for (const provider of ordered(this.commitDiagnosticProviders.values())) {
      try {
        const supplied = await provider.inspect(artifact, { agent, run })
        if (supplied === undefined) continue
        if (!Array.isArray(supplied) || supplied.some(item => !isRecord(item))) {
          artifact.diagnostics.push({
            source: provider.id,
            code: 'RP_COMMIT_DIAGNOSTIC_INVALID',
            severity: 'warning',
            message: '提交诊断未能生成有效结果；本轮其他内容仍正常提交。',
          })
          continue
        }
        artifact.diagnostics.push(...supplied.map(item => ({ source: provider.id, ...jsonClone(item) })))
      } catch {
        artifact.diagnostics.push({
          source: provider.id,
          code: 'RP_COMMIT_DIAGNOSTIC_FAILED',
          severity: 'warning',
          message: '提交诊断暂时不可用；本轮其他内容仍正常提交。',
        })
      }
    }
    // v2 transports prose in the native assistant message, so the commit
    // payload byte budget applies only to the tool-owned side-effect record.
    const bytes = jsonByteLength({ runSummary, effects, references, extensions, diagnostics: artifact.diagnostics, mode })
    if (bytes > this.config.maxArtifactBytes) {
      throw new RpRuntimeError('RP_ARTIFACT_LIMIT', `roleplay artifact is ${bytes} bytes; maximum is ${this.config.maxArtifactBytes}`)
    }
    await this.validateLiveContext(agent, run, context)
    if (this.runs.get(agent) !== run || run.status !== 'running') {
      throw new RpRuntimeError('RP_RUN_NOT_ACTIVE', 'The roleplay run ended while its commit was being validated.')
    }
    if (run.commitGate !== undefined) {
      throw new RpRuntimeError(run.commitGate.code, run.commitGate.message)
    }
    if (run.contextEpoch !== context.contextEpoch || run.contextBuilds.length !== context.buildIndex) {
      throw new RpRuntimeError('RP_CONTEXT_STALE', 'The active roleplay context was refreshed while this commit was being validated. Rebuild the response from the refreshed context before committing.')
    }
    return artifact
  }

  async validateLiveContext(agent, run, context = this.captureCommitContext(run)) {
    const validationEpoch = run.refreshEpoch + 1
    run.refreshEpoch = validationEpoch
    const profile = this.sessionProfile(agent)
    let ingredients
    try {
      ingredients = await this.prepareIngredients({
        agent,
        runId: context.runId,
        turn: context.turn,
        contextEpoch: validationEpoch,
        messages: context.contextMessages,
        input: context.input,
        profile,
        textTransforms: context.textTransforms,
        executionMode: context.executionMode,
      })
    } catch {
      throw new RpRuntimeError(
        'RP_CONTEXT_STALE',
        'Roleplay context could not be revalidated after its shared sources changed. Refresh the shared material context before committing.',
      )
    }
    const current = new Map(ingredients.candidates.map(fragment => [fragment.id, fragment]))
    for (const fragment of snapshotFragments(context.fragments)) {
      const live = current.get(fragment.id)
      if (live === undefined || live.revision !== fragment.revision) {
        throw new RpRuntimeError(
          'RP_CONTEXT_STALE',
          `Roleplay context source "${fragment.id}" changed after this run was built. Refresh the shared material context before committing.`,
        )
      }
    }
  }
}

function assignIngredients(run, { profile, input, messages, ingredients, catalog, contextEpoch }) {
  run.profile = profile
  run.input = input
  run.contextMessages = messages
  run.excludedFragments = ingredients.unavailable
  run.catalog = catalog
  run.contextEpoch = contextEpoch
}

function assetMutationSnapshot(outcome) {
  if (!isRecord(outcome) || !isRecord(outcome.phases)) {
    return {
      operation: typeof outcome?.operation === 'string' ? outcome.operation : 'unknown',
      ok: false,
      phases: { mutation: { status: 'failed', error: { message: 'The asset tool returned an invalid mutation outcome.' } } },
    }
  }
  return jsonClone({
    operation: typeof outcome.operation === 'string' ? outcome.operation : 'unknown',
    ...(typeof outcome.kind === 'string' ? { kind: outcome.kind } : {}),
    ok: outcome.ok === true,
    phases: outcome.phases,
    ...(isRecord(outcome.meta) ? { meta: outcome.meta } : {}),
  })
}

/** @param {Iterable<object>} values */
function ordered(values) {
  return [...values].sort((left, right) => (left.order ?? 0) - (right.order ?? 0) || String(left.id ?? left.kind).localeCompare(String(right.id ?? right.kind)))
}

/** @param {unknown} value */
function validRevision(value) {
  return typeof value === 'string' || Number.isSafeInteger(value) ? value : null
}

/** @param {unknown} value */
function jsonClone(value) {
  return JSON.parse(JSON.stringify(value))
}

/** Build the closed live rp_commit_turn parameter schema. */
function commitParametersSchema(effectSchemas) {
  const effectItems = effectSchemas.length === 0
    ? undefined
    : effectSchemas.length === 1
      ? jsonClone(effectSchemas[0])
      : { oneOf: effectSchemas.map(jsonClone) }
  const schema = {
    type: 'object',
    additionalProperties: false,
    properties: {
      runSummary: { type: 'string', description: 'Optional concise factual summary of the beat and immediate continuation state. Omit it to use a short excerpt of the visible prose.' },
      effects: {
        type: 'array',
        description: 'Optional persistent changes. Every item must match one currently registered effect schema; omit the array when nothing changes.',
        ...(effectItems === undefined ? {} : { items: effectItems }),
      },
      references: {
        type: 'array',
        description: 'Optional precise source citations for diagnostics. Omit rather than guess.',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            source: { type: 'string', description: 'Exact id of one source used by the active context build.' },
            id: { type: 'string', description: 'Stable entry or asset id within that source.' },
            revision: { oneOf: [{ type: 'string' }, { type: 'integer' }], description: 'Exact revision copied from the active context source.' },
          },
          required: ['source', 'id', 'revision'],
        },
      },
      extensions: { type: 'object', description: 'Optional registered extension results keyed by extension namespace.', additionalProperties: true },
    },
  }
  assertObjectJsonSchema(schema)
  return schema
}

/** Convert one thrown commit failure into stable model-correctable JSON fields. */
function commitErrorFeedback(error) {
  const message = error instanceof Error ? error.message : String(error)
  if (error instanceof ToolArgsError) {
    const corrections = Array.isArray(error.corrections)
      ? error.corrections.filter(item => typeof item === 'string' && item.length > 0)
      : []
    return {
      category: 'invalid_arguments',
      code: error.code,
      retryable: true,
      message: corrections.length === 0
        ? 'The commit arguments do not match the active tool schema. Correct only the reported fields and retry the commit.'
        : 'The commit arguments do not match the active tool schema. Apply every precise correction and remaining violation, preserve unrelated fields, and retry the commit.',
      ...(corrections.length === 0 ? {} : { corrections }),
      violations: [...error.violations],
    }
  }
  const code = typeof error?.code === 'string' && error.code.length > 0 ? error.code : 'RP_COMMIT_VALIDATION_FAILED'
  const details = isRecord(error?.feedback) ? jsonClone(error.feedback) : undefined
  return {
    category: 'commit_validation',
    code,
    retryable: true,
    message,
    ...(details === undefined ? {} : { details }),
  }
}

/** Convert a rejected subagent call into stable model-correctable JSON fields. */
function subagentArgumentFeedback(error) {
  const code = typeof error?.info?.code === 'string' ? error.info.code : undefined
  if (code !== 'INVALID_ARGS' && code !== 'RP_SUBAGENT_INPUT_INVALID') return undefined
  const details = typeof error?.message === 'string' && error.message.length > 0 ? error.message : undefined
  return {
    category: 'invalid_arguments',
    code,
    retryable: true,
    message: 'The subagent call was not started because its arguments do not match the active schema. Pass input directly as a JSON object, not as a JSON-encoded string; use {} when no supporting material is needed. Correct the reported fields and retry.',
    ...(details === undefined ? {} : { details }),
  }
}

/** @param {readonly object[]} prepared */
function publicTextTransformSnapshots(prepared) {
  return prepared.map(item => jsonClone(item.snapshot))
}

/**
 * Clone one model message while applying a transform only to text blocks.
 * @param {unknown} message
 * @param {(text: string) => Promise<string>} transform
 */
async function transformMessageText(message, transform) {
  if (!isRecord(message) || !Array.isArray(message.content)) return message
  const content = []
  for (const block of message.content) {
    content.push(isRecord(block) && block.type === 'text' && typeof block.text === 'string'
      ? { ...block, text: await transform(block.text) }
      : block)
  }
  return { ...message, content }
}

/**
 * Compose per-transformer incremental stages. A transformer without a
 * streaming implementation buffers its block and emits on `finish()`.
 * @param {readonly object[]} prepared
 * @param {object} context
 */
function createTransformPipeline(prepared, context) {
  const stages = prepared.map((item) => {
    if (typeof item.definition.createStream === 'function') {
      const stream = item.definition.createStream({ ...context, prepared: item.value })
      if (!isRecord(stream) || typeof stream.push !== 'function' || typeof stream.finish !== 'function') {
        throw new RpRuntimeError('RP_INVALID_TEXT_TRANSFORM', `text transformer "${item.definition.id}" returned an invalid stream transformer`)
      }
      return stream
    }
    let buffer = ''
    return {
      push(text) {
        buffer += text
        return ''
      },
      finish() {
        const value = item.definition.transform(buffer, { ...context, prepared: item.value })
        if (value instanceof Promise) {
          throw new RpRuntimeError('RP_INVALID_TEXT_TRANSFORM', `text transformer "${item.definition.id}" requires createStream for asynchronous assistant output`)
        }
        if (typeof value !== 'string') {
          throw new RpRuntimeError('RP_INVALID_TEXT_TRANSFORM', `text transformer "${item.definition.id}" returned a non-string value`)
        }
        buffer = ''
        return value
      },
    }
  })
  const pushFrom = (start, text) => {
    let output = text
    for (let index = start; index < stages.length; index += 1) output = stages[index].push(output)
    return output
  }
  return {
    push(text) {
      return pushFrom(0, text)
    },
    finish() {
      let output = ''
      for (let index = 0; index < stages.length; index += 1) {
        const tail = stages[index].finish()
        if (tail.length > 0) output += pushFrom(index + 1, tail)
      }
      return output
    },
  }
}

/** @param {Map<string, object>} sources */
function topologicalSources(sources) {
  const result = []
  const visiting = new Set()
  const visited = new Set()
  const visit = (id) => {
    if (visited.has(id)) return
    if (visiting.has(id)) throw new RpRuntimeError('RP_CONTEXT_CYCLE', `context-source dependency cycle includes "${id}"`)
    const source = sources.get(id)
    if (source === undefined) throw new RpRuntimeError('RP_CONTEXT_DEPENDENCY', `unknown context-source dependency "${id}"`)
    visiting.add(id)
    for (const dependency of source.dependsOn ?? []) visit(dependency)
    visiting.delete(id)
    visited.add(id)
    result.push(source)
  }
  for (const source of ordered(sources.values())) visit(source.id)
  return result
}

/** @param {unknown} value @param {string} field */
function requiredText(value, field) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new RpRuntimeError('RP_INVALID_ARTIFACT', `${field} must be a non-empty string`)
  }
  return value.trim()
}

/** @param {unknown} value */
function optionalText(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
}

/** @param {string} narrative */
function narrativeExcerpt(narrative) {
  const characters = [...narrative.replaceAll(/\s+/g, ' ').trim()]
  const excerpt = characters.slice(0, 200).join('')
  return characters.length > 200 ? `${excerpt}…` : excerpt
}

/** Preserve Unicode code points while exposing a real incremental native stream. */
function streamTextChunks(text) {
  const characters = [...text]
  const chunks = []
  for (let index = 0; index < characters.length; index += 64) {
    chunks.push(characters.slice(index, index + 64).join(''))
  }
  return chunks
}

/** @param {object} message */
function assistantNarrative(message) {
  if (!Array.isArray(message?.content)) return ''
  return message.content
    .filter(block => block?.type === 'text' && typeof block.text === 'string' && block.text.trim().length > 0)
    .map(block => block.text)
    .join('')
    .trim()
}

/** Return the call id only when a native tool/result represents a failure. */
function failedToolResultCallId(event) {
  if (event?.type !== 'tool/result' || !isRecord(event.data) || !isRecord(event.data.message)) return undefined
  const content = event.data.message.content
  const failedBlock = Array.isArray(content)
    ? content.find(block => block?.type === 'tool-result' && block.isError === true)
    : undefined
  if (event.data.error === undefined && failedBlock === undefined) return undefined
  const callId = event.data.message.source?.callId ?? failedBlock?.toolCallId
  return typeof callId === 'string' && callId.length > 0 ? callId : undefined
}

/**
 * Resolve prose from the latest failed commit attempt in the same turn.
 * A tool-only correction can reuse only prose that was already paired with a
 * failed rp_commit_turn, never an arbitrary intermediate assistant message.
 *
 * @param {readonly object[]} events Complete Session Event Log.
 * @param {object} retryCall Current tool/call event.
 * @param {object} retryAssistant Current model assistant event.
 */
function latestFailedCommitNarrative(events, retryCall, retryAssistant) {
  const failedCallIds = new Set(events.flatMap(event => {
    if (!Number.isSafeInteger(event?.seq) || event.seq >= retryCall.seq) return []
    const callId = failedToolResultCallId(event)
    return callId === undefined ? [] : [callId]
  }))
  if (failedCallIds.size === 0) return undefined
  const candidates = events.filter(event => Number.isSafeInteger(event?.seq) && event.seq < retryAssistant.seq
    && event.type === 'assistant/message'
    && event.data?.turn === retryCall.data?.turn
    && event.data?.message?.source?.kind === 'model'
    && Array.isArray(event.data?.message?.content))
  for (const event of candidates.reverse()) {
    const message = event.data.message
    const calls = message.content.filter(block => block?.type === 'tool-call')
    if (calls.length !== 1 || calls[0].name !== RP_COMMIT_TOOL || !failedCallIds.has(String(calls[0].id))) continue
    const narrative = assistantNarrative(message)
    if (narrative.length > 0) return { event, message, narrative }
  }
  return undefined
}

/** @param {unknown} value @param {object} run */
function validateReferences(value, run) {
  if (!Array.isArray(value)) throw new RpRuntimeError('RP_INVALID_REFERENCES', 'references must be an array')
  const activeSources = new Map(snapshotFragments(run.fragments).map(fragment => [fragment.id, fragment]))
  return value.map((reference) => {
    if (!isRecord(reference) || typeof reference.source !== 'string' || reference.source.length === 0
      || typeof reference.id !== 'string' || reference.id.length === 0) {
      throw new RpRuntimeError('RP_INVALID_REFERENCE', 'every reference requires non-empty string source and id fields')
    }
    if (typeof reference.revision !== 'string' && !Number.isSafeInteger(reference.revision)) {
      throw new RpRuntimeError('RP_INVALID_REFERENCE', 'every reference requires a string or safe-integer revision')
    }
    const source = activeSources.get(reference.source)
    if (source === undefined) {
      throw new RpRuntimeError('RP_REFERENCE_SOURCE_NOT_ACTIVE', `reference source "${reference.source}" is not used by the active context build`)
    }
    if (source.revision !== reference.revision) {
      throw new RpRuntimeError('RP_REFERENCE_REVISION_MISMATCH', `reference source "${reference.source}" revision does not match the active context build`)
    }
    return { source: reference.source, id: reference.id, revision: reference.revision }
  })
}

function contextMetadata(fragment) {
  return {
    id: fragment.id,
    label: fragment.label,
    kind: fragment.kind,
    promptCategory: fragment.promptCategory,
    delivery: fragment.delivery,
    parentDelivery: fragment.parentDelivery,
    revision: fragment.revision,
    characters: fragment.characters,
    diagnostics: fragment.diagnostics,
    dependsOn: fragment.dependsOn,
    order: fragment.order,
    budgetPriority: fragment.budgetPriority,
    required: fragment.required,
    slotId: fragment.slotId,
    slotLabel: fragment.slotLabel,
  }
}

function taskSubagentCatalog(subagents) {
  return ordered(subagents.values()).map(subagent => ({
    id: subagent.id,
    label: subagent.label,
    usageContract: subagent.description,
    inputSchema: subagent.inputSchema,
    structuredOutput: subagent.outputSchema !== undefined,
    model: subagent.route?.provider === undefined
      ? { kind: 'inherit' }
      : { kind: 'fixed', provider: subagent.route.provider, model: subagent.route.model },
  }))
}

function normalizeTaskSubagent(definition) {
  if (!isRecord(definition)
    || typeof definition.id !== 'string'
    || !/^[a-z0-9][a-z0-9._:-]*$/.test(definition.id)
    || definition.id === 'writer'
    || typeof definition.label !== 'string'
    || definition.label.trim().length === 0
    || typeof definition.description !== 'string'
    || definition.description.trim().length === 0
    || typeof definition.persona !== 'string'
    || definition.persona.trim().length === 0
    || !isRecord(definition.inputSchema)) {
    throw new RpRuntimeError('RP_INVALID_REGISTRATION', 'task subagent requires a stable non-writer id, label, description, persona and inputSchema')
  }
  if (definition.outputSchema !== undefined && !isRecord(definition.outputSchema)) {
    throw new RpRuntimeError('RP_INVALID_REGISTRATION', `task subagent "${definition.id}" outputSchema must be an object`)
  }
  try {
    assertObjectJsonSchema(definition.inputSchema)
    if (definition.outputSchema !== undefined) assertObjectJsonSchema(definition.outputSchema)
  } catch (error) {
    throw new RpRuntimeError('RP_INVALID_REGISTRATION', `task subagent "${definition.id}" has an invalid schema: ${error instanceof Error ? error.message : String(error)}`)
  }
  const toolFilter = normalizeTaskSubagentToolFilter(definition.toolFilter)
  const route = normalizeTaskSubagentRoute(definition.route, definition.id)
  return {
    ...definition,
    label: definition.label.trim(),
    description: definition.description.trim(),
    persona: definition.persona.trim(),
    toolFilter,
    ...(route === undefined ? {} : { route }),
  }
}

function normalizeProviderWriterRoute(value) {
  if (value === undefined) return undefined
  const route = normalizeTaskSubagentRoute(value, 'writer')
  if (route?.maxTokens !== undefined) {
    throw new RpRuntimeError('RP_INVALID_SUBAGENT_PROFILE', 'global Writer route cannot override maxTokens')
  }
  return route
}

function normalizeTaskSubagentToolFilter(filter) {
  if (filter !== undefined && !isRecord(filter)) {
    throw new RpRuntimeError('RP_INVALID_REGISTRATION', 'task subagent toolFilter must be an object')
  }
  if (filter?.deny !== undefined) {
    throw new RpRuntimeError('RP_INVALID_REGISTRATION', 'task subagents require an explicit allow-list; deny-lists cannot guarantee read-only isolation')
  }
  if (filter?.allow !== undefined && (!Array.isArray(filter.allow) || filter.allow.some(name => typeof name !== 'string' || name.length === 0))) {
    throw new RpRuntimeError('RP_INVALID_REGISTRATION', 'task subagent toolFilter.allow must contain tool names')
  }
  const forbidden = [RP_WRITE_TOOL, RP_COMMIT_TOOL, RP_SUBAGENT_TOOL, RP_ASSET_TOOL, RP_ASSET_READ_TOOL, 'subagent']
  const allow = [...new Set(filter?.allow ?? [])]
  if (allow.some(name => forbidden.includes(name))) throw new RpRuntimeError('RP_INVALID_REGISTRATION', 'task subagents cannot allow parent-session RP, Writer, nested task-subagent or generic subagent tools')
  return { allow }
}

function normalizeTaskSubagentRoute(value, subagentId) {
  if (value === undefined) return undefined
  if (!isRecord(value)) throw new RpRuntimeError('RP_INVALID_REGISTRATION', `task subagent "${subagentId}" route must be an object`)
  const provider = optionalText(value.provider)
  const model = optionalText(value.model)
  if ((provider === undefined) !== (model === undefined)) {
    throw new RpRuntimeError('RP_INVALID_REGISTRATION', `task subagent "${subagentId}" route.provider and route.model must be configured together`)
  }
  if (value.maxTokens !== undefined && (!Number.isSafeInteger(value.maxTokens) || value.maxTokens < 1)) {
    throw new RpRuntimeError('RP_INVALID_REGISTRATION', `task subagent "${subagentId}" route.maxTokens must be a positive safe integer`)
  }
  if (provider === undefined && value.maxTokens === undefined) return undefined
  return { ...(provider === undefined ? {} : { provider, model }), ...(value.maxTokens === undefined ? {} : { maxTokens: value.maxTokens }) }
}

function parentChildRouteSnapshot(agent, profile) {
  const header = loggedParentChildRouteSnapshot(agent)
  const options = agent?.options ?? {}
  const runtime = profile?.runtime ?? {}
  const provider = runtime.provider ?? header.provider ?? options.provider
  const model = runtime.model ?? header.model ?? options.model
  const maxTokens = header.maxTokens ?? options.maxTokens
  return {
    ...(typeof provider === 'string' && provider.length > 0 ? { provider } : {}),
    ...(typeof model === 'string' && model.length > 0 ? { model } : {}),
    ...(maxTokens === undefined ? {} : { maxTokens }),
  }
}

function loggedParentChildRouteSnapshot(agent) {
  const header = agent?.session?.requestHeader?.()?.config ?? {}
  return {
    ...(typeof header.provider === 'string' && header.provider.length > 0 ? { provider: header.provider } : {}),
    ...(typeof header.model === 'string' && header.model.length > 0 ? { model: header.model } : {}),
    ...(header.maxTokens === undefined ? {} : { maxTokens: header.maxTokens }),
  }
}

function completeChildRoute(route) {
  return typeof route?.provider === 'string' && route.provider.length > 0
    && typeof route?.model === 'string' && route.model.length > 0
}

function freezeChildRoute(parent, override) {
  const provider = override?.provider ?? parent.provider
  const model = override?.model ?? parent.model
  if (typeof provider !== 'string' || provider.length === 0 || typeof model !== 'string' || model.length === 0) return undefined
  const maxTokens = override?.maxTokens ?? parent.maxTokens
  return { provider, model, ...(maxTokens === undefined ? {} : { maxTokens }) }
}

function requiredFrozenChildRoute(route) {
  if (route === undefined) {
    throw new RpRuntimeError('RP_WRITER_ROUTE_REQUIRED', 'The child model route could not be inherited; configure provider and model for this Session.')
  }
  return { ...route }
}

function renderCurrentInput(messages) {
  const texts = (messages ?? []).flatMap(message => {
    if (message?.role !== 'user' || message?.source?.kind !== 'user') return []
    const text = messageText(message)
    return text.length === 0 ? [] : [text]
  })
  if (texts.length === 0) throw new RpRuntimeError('RP_CURRENT_INPUT_REQUIRED', 'The active roleplay run has no non-empty current user input.')
  const text = texts.join('\n\n')
  return {
    revision: 'current-turn',
    text,
    characters: [...text].length,
    diagnostics: { messages: texts.length },
  }
}

function escapeAttribute(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

function contextDefinitionMetadata(definition) {
  return {
    id: definition.id,
    label: definition.label,
    description: definition.description,
    kind: definition.kind,
    promptCategory: definition.promptCategory,
    delivery: definition.delivery,
    parentDelivery: definition.parentDelivery,
    defaultSlot: definition.defaultSlot,
    budgetPriority: definition.budgetPriority,
    required: definition.required,
    pretransformed: definition.pretransformed,
    dependsOn: definition.dependsOn,
    order: definition.order,
  }
}

function contextCandidate(definition, candidate) {
  const characters = Number.isSafeInteger(candidate.characters) && candidate.characters >= 0
    ? candidate.characters
    : [...candidate.text].length
  return {
    ...contextDefinitionMetadata(definition),
    text: candidate.text,
    revision: candidate.revision ?? null,
    characters,
    diagnostics: candidate.diagnostics ?? null,
  }
}

function addResolvedDefinition(definitions, ids, definition) {
  if (ids.has(definition.id)) throw new RpRuntimeError('RP_DUPLICATE_CONTEXT', `context source "${definition.id}" was prepared more than once`)
  ids.add(definition.id)
  definitions.push(definition)
}

function snapshotFragments(fragments) {
  return fragments.filter(fragment => fragment.delivery !== 'native-history')
}

function renderConversationHistory(session) {
  const visible = roleplayTranscriptMessages(session).flatMap((message) => {
    if (!isRecord(message)) return []
    const text = messageText(message)
    if (text.length === 0) return []
    return [{ role: message.role === 'assistant' ? '回复' : '用户', text }]
  })
  if (visible.length === 0) return undefined
  const dialogue = visible.map(item => `${item.role}：${item.text}`).join('\n\n')
  const text = `${CONVERSATION_HISTORY_CONTEXT_NOTE}\n\n${dialogue}`
  return {
    revision: `messages:${visible.length}`,
    text,
    characters: [...text].length,
    diagnostics: { messages: visible.length, truncated: false },
  }
}

function messageText(message) {
  if (!Array.isArray(message.content)) return ''
  return message.content.flatMap(block => {
    if (!isRecord(block)) return []
    if (block.type === 'text' && typeof block.text === 'string' && block.text.trim().length > 0) return [block.text.trim()]
    return []
  }).join('\n')
}
