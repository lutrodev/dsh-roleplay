import { Service } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import Schema from '@deepseek-ai/schemastery'
import { foldSurfaceOwnedEntities } from 'dsh-roleplay-rp-core/entity-projection'
import { resolveRpToolCallAssistant } from 'dsh-roleplay-rp-core/protocol'
import { applySessionCommandEvent, emptySessionCommandState } from 'dsh-roleplay-rp-session/protocol'
import { compileStateCondition, evaluateStateCondition } from './condition.js'
import {
  createNamespaceSnapshot,
  normalizeNamespaceId,
  normalizeSetupDiagnostics,
  normalizeStateBootstrap,
  normalizeStateDefinition,
  RP_STATE_PROTOCOL_VERSION,
} from './definition.js'
import { parseJsonPointer, readJsonPointer } from './json-pointer.js'
import { cloneJson, normalizeJson, validateStateValue } from './schema.js'
import {
  applyStateChanges,
  stateUpdateArgumentCorrections,
  stateUpdateEffectSchema,
  stateUpdateOperationProtocol,
} from './update.js'
import {
  applyStateCommandEvent,
  decodeStateCommandInput,
  emptyStateCommandState,
  encodeStateCommand,
  normalizeStateCommandOwner,
  normalizeStateConfigurationMutation,
  RP_STATE_CONFIGURE_COMMAND,
  RP_STATE_READ_TOOL,
  RP_STATE_TOOL,
} from './protocol.js'

export * from './condition.js'
export * from './definition.js'
export * from './json-pointer.js'
export * from './protocol.js'
export * from './schema.js'
export * from './update.js'

export const name = 'rp-state'
export const inject = ['commands', 'rpRuntime', 'tools']
export const Config = Schema.object({ maxNamespacesInContext: Schema.number().default(32) })
export const STATE_CONTEXT_SOURCE_ID = 'rp.state'
export const STATE_ACTIVITY_PROJECTION_KEY = 'rp/state/activity'

/** Session-owned event-sourced roleplay State service. */
export class RpState extends Service {
  constructor(ctx, config) {
    super(ctx, 'rpState')
    this.config = config
    this.authorizedCommandInputs = new WeakMap()
    this.configurationTails = new WeakMap()
    ctx.commands.register({
      name: RP_STATE_CONFIGURE_COMMAND,
      description: 'Apply one validated Session State configuration mutation.',
      handler: invocation => this.applyConfigureCommand(invocation),
    })
    ctx.rpRuntime.registerEffectType({
      kind: 'state.update',
      schema: stateUpdateEffectSchema(),
      diagnoseArguments: (effect, context) => stateUpdateArgumentCorrections(effect, context),
      validate: (effect, validation) => this.validateEffect(effect, validation),
    })
    ctx.rpRuntime.registerCommitDiagnosticProvider({ id: STATE_CONTEXT_SOURCE_ID, inspect: (artifact, context) => this.commitDiagnostics(artifact, context) })
    ctx.rpRuntime.registerChatReadableTool({ name: RP_STATE_READ_TOOL })
    ctx.rpRuntime.registerContextSource({
      id: STATE_CONTEXT_SOURCE_ID,
      label: '会话变量',
      description: '当前对话拥有的变量值、结构与语义更新规则。',
      kind: 'session-projection',
      promptCategory: 'factual',
      parentDelivery: 'commit',
      required: true,
      order: 11,
      budgetPriority: -30,
      defaultSlot: { id: STATE_CONTEXT_SOURCE_ID, label: '会话变量', order: 11 },
      legacySlotIds: ['continuity'],
      prepare: ({ agent }) => this.prepareContext(agent),
    })
    ctx.tools.register(stateReadTool(this))
    ctx.tools.register(stateMutationTool(ctx, this))
    ctx.inject(['sessionProjections'], projectionCtx => {
      projectionCtx.sessionProjections.register({
        key: 'rp/state',
        stateSchema: { parse: validateStateProjection },
        init: emptyStateProjection,
        apply: (state, event) => applyStateProjectionEvent(state, event, ctx.rpRuntime),
        wire: { viewSchema: { parse: validateStateView }, view: state => state.value },
        stateVersion: 8,
      })
      projectionCtx.sessionProjections.register({
        key: STATE_ACTIVITY_PROJECTION_KEY,
        stateSchema: { parse: validateStateProjection },
        init: emptyStateProjection,
        apply: (state, event) => applyStateProjectionEvent(state, event, ctx.rpRuntime),
        wire: { viewSchema: { parse: validateStateActivityView }, view: stateActivityView },
        stateVersion: 1,
      })
    })
    ctx.inject(['rpLoreBooks'], loreCtx => {
      const disposeActivation = loreCtx.rpLoreBooks.registerActivationAdapter({
        id: 'rp.state.conditions',
        order: 100,
        prepare: ({ agent }) => createStateLoreActivation(this.get(agent)),
      })
      const disposeValidation = loreCtx.rpLoreBooks.registerEntryValidator({
        id: 'rp.state.conditions',
        validate(entry) {
          if (entry.stateCondition !== undefined) compileStateCondition(entry.stateCondition)
        },
      })
      return () => { disposeValidation(); disposeActivation() }
    })
  }

  /** Return the current detached State projection for one Agent Session. */
  get(agent) {
    const projection = this.ctx.get('sessionProjections')?.stateOf(agent.session, 'rp/state')
    return cloneJson(projection === undefined ? this.rebuild(agent.session.events) : projection.value)
  }

  /** Rebuild the complete State projection from an explicit event sequence. */
  rebuild(events) {
    return events.reduce(
      (state, event) => applyStateProjectionEvent(state, event, this.ctx.rpRuntime),
      emptyStateProjection(),
    ).value
  }

  /** Return a model-readable list or complete namespace definition. */
  read(agent, request) {
    if (!record(request) || (request.action !== 'list' && request.action !== 'get')) throw new RpStateError('INVALID_REQUEST', 'State read action must be list or get.')
    const state = this.get(agent)
    if (request.action === 'list') {
      if (request.namespace !== undefined) throw new RpStateError('INVALID_REQUEST', 'State list does not accept namespace.')
      return {
        protocolVersion: state.protocolVersion,
        revision: state.revision,
        namespaces: Object.entries(state.namespaces).map(([namespace, snapshot]) => ({
          namespace,
          title: snapshot.definition.title,
          revision: snapshot.revision,
          updateMode: snapshot.definition.updateMode,
          diagnostics: snapshot.diagnostics,
        })),
      }
    }
    const namespace = normalizeNamespaceId(request.namespace)
    const snapshot = state.namespaces[namespace]
    if (snapshot === undefined) throw new RpStateError('NAMESPACE_NOT_FOUND', `State namespace "${namespace}" does not exist.`)
    return { protocolVersion: state.protocolVersion, stateRevision: state.revision, namespace, ...cloneJson(snapshot) }
  }

  /** Persist one explicit State configuration mutation through a native Session command. */
  async configure(agent, request, owner) {
    const previous = this.configurationTails.get(agent) ?? Promise.resolve()
    const execution = previous.then(
      () => this.configureOwned(agent, request, owner),
      () => this.configureOwned(agent, request, owner),
    )
    const tail = execution.then(() => undefined, () => undefined)
    this.configurationTails.set(agent, tail)
    try {
      return await execution
    } finally {
      if (this.configurationTails.get(agent) === tail) this.configurationTails.delete(agent)
    }
  }

  async configureOwned(agent, request, owner) {
    const commandOwner = validateStateToolOwner(agent, owner)
    const mutation = prepareConfigurationMutation(this.get(agent), request)
    const rawInput = encodeStateCommand(mutation, commandOwner)
    let authorized = this.authorizedCommandInputs.get(agent)
    if (authorized === undefined) {
      authorized = new Set()
      this.authorizedCommandInputs.set(agent, authorized)
    }
    authorized.add(rawInput)
    try {
      const execution = await this.ctx.commands.execute(agent, `/${RP_STATE_CONFIGURE_COMMAND}${rawInput}`, [], new AbortController().signal)
      if (execution?.result.kind !== 'success') throw new RpStateError('COMMAND_FAILED', 'State configuration did not complete successfully.')
    } finally {
      authorized.delete(rawInput)
      if (authorized.size === 0) this.authorizedCommandInputs.delete(agent)
    }
    return { mutation: { action: mutation.action, namespace: mutation.namespace }, state: this.get(agent) }
  }

  applyConfigureCommand(invocation) {
    const authorized = this.authorizedCommandInputs.get(invocation.agent)
    if (authorized?.has(invocation.rawInput) !== true) throw new RpStateError('COMMAND_NOT_AUTHORIZED', 'State can only be configured through the validated State service.')
    const mutation = decodeStateCommandInput(invocation.rawInput)
    const current = this.get(invocation.agent).namespaces[mutation.namespace]
    const revision = current?.revision ?? 0
    if (revision !== mutation.expectedRevision) {
      throw new RpStateError('REVISION_CONFLICT', `State revision conflict for "${mutation.namespace}": expected ${mutation.expectedRevision}, current ${revision}.`)
    }
    if (mutation.action === 'create' && current !== undefined) throw new RpStateError('NAMESPACE_EXISTS', `State namespace "${mutation.namespace}" already exists.`)
    if (mutation.action !== 'create' && current === undefined) throw new RpStateError('NAMESPACE_NOT_FOUND', `State namespace "${mutation.namespace}" does not exist.`)
    return { kind: 'success', text: `State namespace ${mutation.namespace} ${mutation.action} saved.` }
  }

  validateEffect(effect, validation) {
    exactFields(effect, ['kind', 'namespace', 'expectedRevision', 'payload'], 'state.update')
    if (effect.kind !== 'state.update') throw new RpStateError('INVALID_EFFECT', 'State effect kind must be state.update.')
    const namespace = normalizeNamespaceId(effect.namespace)
    if (!record(effect.payload)) throw new RpStateError('INVALID_EFFECT', 'state.update payload must be an object.')
    exactFields(effect.payload, ['changes'], 'state.update payload')
    const base = this.get(validation.agent)
    const working = applyAcceptedEffects(base, validation.acceptedEffects)
    if (validation.acceptedEffects.some(candidate => candidate.kind === 'state.update' && candidate.namespace === namespace)) {
      throw new RpStateError('INVALID_EFFECT', `Only one state.update effect may target "${namespace}" in one commit.`)
    }
    const snapshot = working.namespaces[namespace]
    if (snapshot === undefined) throw new RpStateError('NAMESPACE_NOT_FOUND', `State namespace "${namespace}" does not exist.`)
    if (!Number.isSafeInteger(effect.expectedRevision) || effect.expectedRevision !== snapshot.revision) {
      throw new RpStateError('REVISION_CONFLICT', `State revision conflict for "${namespace}": expected ${String(effect.expectedRevision)}, current ${snapshot.revision}.`)
    }
    const prepared = applyStateChanges({ state: working, namespace, snapshot, changes: effect.payload.changes })
    return {
      kind: 'state.update',
      namespace,
      expectedRevision: snapshot.revision,
      payload: { changes: prepared.changes, result: prepared.result },
    }
  }

  commitDiagnostics(artifact, { agent }) {
    const state = this.get(agent)
    const effects = artifact.effects.filter(effect => effect.kind === 'state.update')
    const diagnostics = []
    for (const [namespace, snapshot] of Object.entries(state.namespaces)) {
      if (snapshot.definition.updateMode === 'disabled') continue
      const changes = effects.find(effect => effect.namespace === namespace)?.payload?.changes ?? []
      for (const rule of snapshot.definition.rules.filter(candidate => candidate.cadence === 'every-turn')) {
        if (rule.condition !== undefined) {
          const evaluated = evaluateStateCondition(compileStateCondition(rule.condition), state)
          if (!evaluated.value) {
            if (evaluated.diagnostics.length > 0) diagnostics.push(...evaluated.diagnostics.map(item => ({ ...item, namespace, ruleId: rule.id, path: rule.target })))
            continue
          }
        }
        const applied = changes.some(change => change.path === rule.target
          && (snapshot.definition.updateMode === 'schema-only' || change.ruleId === rule.id))
        if (!applied) diagnostics.push({
          code: 'STATE_EVERY_TURN_MISSED',
          severity: 'warning',
          namespace,
          ruleId: rule.id,
          path: rule.target,
          message: `本轮未检查规则“${rule.when}”对应的变量。`,
        })
      }
    }
    return diagnostics
  }

  prepareContext(agent) {
    const state = this.get(agent)
    const entries = Object.entries(state.namespaces)
    if (entries.length === 0) return undefined
    if (entries.length > this.config.maxNamespacesInContext) {
      throw new RpStateError('NAMESPACE_LIMIT', `State contains ${entries.length} namespaces; maximum complete context is ${this.config.maxNamespacesInContext}.`)
    }
    const text = JSON.stringify({
      protocolVersion: RP_STATE_PROTOCOL_VERSION,
      updateProtocol: {
        kind: 'state.update',
        effect: { kind: 'state.update', namespace: '<exact namespace>', expectedRevision: '<exact namespace revision>', payload: { changes: '<non-empty ordered array>' } },
        operations: stateUpdateOperationProtocol(),
        modes: {
          'rules-required': 'Every change must include the matching ruleId.',
          'schema-only': 'ruleId is optional; every operation and the final value must still pass validation.',
          disabled: 'Do not submit State changes for this namespace.',
        },
        constraints: [
          'submit only paths that changed',
          'increment uses by and never value; set and append use value and never by; remove uses neither field',
          'when adding to an array, append only the new item; never copy or set the complete current array',
          'one effect per namespace',
          'non-empty reason per change',
          'no duplicate or ancestor/descendant paths',
          'all changes commit atomically',
        ],
        atomic: true,
      },
      namespaces: entries.map(([namespace, snapshot]) => ({
        namespace,
        expectedRevision: snapshot.revision,
        updateMode: snapshot.definition.updateMode,
        title: snapshot.definition.title,
        ...(snapshot.definition.description === undefined ? {} : { description: snapshot.definition.description }),
        value: snapshot.value,
        schema: snapshot.definition.schema,
        rules: snapshot.definition.rules,
        diagnostics: snapshot.diagnostics,
      })),
    }, null, 2)
    return {
      revision: state.revision,
      text,
      diagnostics: { namespaces: entries.map(([namespace]) => namespace) },
    }
  }
}

export function apply(ctx, config) {
  if (!Number.isSafeInteger(config.maxNamespacesInContext) || config.maxNamespacesInContext < 1) throw new Error('rp-state: maxNamespacesInContext must be positive')
  new RpState(ctx, config)
}

/** Return an empty public State projection. */
export function emptyState() {
  return { protocolVersion: RP_STATE_PROTOCOL_VERSION, revision: 0, namespaces: {} }
}

/** Return an empty complete projection fold state. */
export function emptyStateProjection() {
  return {
    value: emptyState(),
    session: emptySessionCommandState(),
    commands: emptyStateCommandState(),
    mutations: [],
    entities: [],
  }
}

/** Fold one Session event into State configuration, values, and diagnostics. */
export function applyStateProjectionEvent(state, event, runtime) {
  if (event?.type === 'command/run' && event?.data?.name === 'rp-state-patch') {
    throw new Error('rp.state v1 rp-state-patch commands are unsupported.')
  }
  const session = applySessionCommandEvent(state.session, event)
  const commandFold = applyStateCommandEvent(state.commands, event)
  let mutations = state.mutations
  if (session.profile !== state.session.profile && record(session.profile)) {
    if (Object.prototype.hasOwnProperty.call(session.profile, 'initialStateSeeds') || Object.prototype.hasOwnProperty.call(session.profile, 'initialStateRemovals')) {
      throw new Error('rp.state v1 Session data is unsupported; recreate the State bootstrap.')
    }
    if (Object.prototype.hasOwnProperty.call(session.profile, 'stateBootstrap')) {
      if (!Number.isSafeInteger(event?.seq)) throw new Error('State bootstrap event requires a Session sequence.')
      mutations = [...mutations, { seq: event.seq, kind: 'bootstrap', value: normalizeStateBootstrap(session.profile.stateBootstrap) }]
    }
  }
  const entityFold = foldSurfaceOwnedEntities(state.entities, event, {
    select: candidate => {
      if (commandFold.committed !== undefined) {
        return {
          currentSeq: commandFold.committed.owner.assistant.seq,
          value: {
            kind: 'state.configuration',
            commandId: commandFold.committed.commandId,
            mutation: commandFold.committed.mutation,
          },
        }
      }
      if (candidate?.type !== 'tool/result' || candidate.surfaceOp !== 'append') return undefined
      const commit = runtime.decodeCommitEvent(candidate)
      if (commit === undefined) return undefined
      const effects = Array.isArray(commit.effects) ? commit.effects : []
      if (effects.some(effect => record(effect) && effect.kind === 'state.patch')) throw new Error('rp.state v1 state.patch events are unsupported.')
      return {
        currentSeq: candidate.seq,
        value: {
          kind: 'state.turn-commit',
          effects: effects.filter(effect => record(effect) && effect.kind === 'state.update'),
          diagnostics: Array.isArray(commit.diagnostics) ? commit.diagnostics.filter(item => record(item) && item.source === STATE_CONTEXT_SOURCE_ID) : [],
          turn: Number.isSafeInteger(commit.turn) ? commit.turn : null,
        },
      }
    },
  })
  const replay = mutations !== state.mutations || entityFold.valueChanged
  const value = replay ? replayStateMutations(mutations, entityFold.entities) : state.value
  if (session === state.session && commandFold.state === state.commands && mutations === state.mutations && entityFold.entities === state.entities && value === state.value) return state
  return { value, session, commands: commandFold.state, mutations, entities: entityFold.entities }
}

/** Build one lore activation adapter over an immutable State snapshot. */
export function createStateLoreActivation(state) {
  const cache = new Map()
  return {
    revision: state.revision,
    gateEntry({ entry }) {
      if (entry.stateCondition === undefined) return undefined
      let compiled = cache.get(entry.stateCondition)
      if (compiled === undefined) {
        try { compiled = compileStateCondition(entry.stateCondition) } catch (error) {
          return {
            active: false,
            diagnostics: [{ status: 'excluded', reason: 'state-condition-invalid', message: error instanceof Error ? error.message : String(error) }],
          }
        }
        cache.set(entry.stateCondition, compiled)
      }
      const evaluated = evaluateStateCondition(compiled, state)
      return {
        active: evaluated.value,
        diagnostics: evaluated.diagnostics.map(item => ({ status: 'excluded', reason: 'state-condition', ...item })),
      }
    },
  }
}

function stateReadTool(service) {
  return defineTool({
    name: RP_STATE_READ_TOOL,
    description: 'Read State owned by the current Roleplay conversation without changing it. Use action list for namespace summaries or get with an exact namespace id for the complete definition, initial value, current value, rules, revision, and diagnostics.',
    parameters: {
      action: { type: 'string', required: true, enum: ['list', 'get'], description: 'Exactly list or get.' },
      namespace: { type: 'string', description: 'Required only for get; use an exact id returned by list or rp.state context.' },
    },
    output: stateToolOutput(),
    execute(args, exec) {
      if (exec.agent === undefined) throw new RpStateError('RP_AGENT_REQUIRED', 'rp_state_read requires an active Roleplay Agent.')
      return service.read(exec.agent, args)
    },
    presentCall: () => ({ card: 'generic', title: '读取故事状态', kind: 'read' }),
    presentResult: (_args, result) => ({ card: 'generic', title: result.isError ? '故事状态未能读取' : '故事状态已读取', kind: 'read', rawOutput: result.content }),
  })
}

function stateMutationTool(ctx, service) {
  return defineTool({
    name: RP_STATE_TOOL,
    description: 'Agent mode only. Configure a complete State namespace after the user explicitly asks and after loading rp-guide-state. A namespace such as story normally contains variables as JSON fields; there is no field-level add or delete action. Read the latest namespace revision first. create requires namespace, expectedRevision:0, a complete definition, and initialValue. update replaces the complete definition and may replace complete initialValue/value. reset and delete target the complete namespace. Ordinary story value changes must use state.update in rp_commit_turn instead.',
    parameters: {
      action: { type: 'string', required: true, enum: ['create', 'update', 'reset', 'delete'], description: 'Exactly create, update, reset, or delete.' },
      namespace: { type: 'string', required: true, description: 'Stable Session-local namespace id such as story.' },
      expectedRevision: { type: 'integer', required: true, description: '0 for create; otherwise the exact latest namespace revision.' },
      definition: {
        type: 'object',
        additionalProperties: false,
        description: 'Required for create/update. This is the complete replacement definition, never a patch.',
        properties: {
          title: { type: 'string', required: true, description: 'Non-empty user-facing title for this namespace.' },
          description: { type: 'string', description: 'Optional non-empty explanation of what this namespace tracks.' },
          updateMode: { type: 'string', required: true, enum: ['rules-required', 'schema-only', 'disabled'], description: 'Use schema-only with rules:[] for an ordinary variable unless explicit semantic rules are required.' },
          schema: { type: 'json', required: true, description: 'Complete restricted JSON Schema for the namespace value. Object-field variable definitions belong in schema.properties.' },
          rules: { type: 'array', required: true, items: { type: 'json' }, description: 'Complete semantic rule array. Pass [] when there are no rules; never omit it.' },
        },
      },
      initialValue: { type: 'json', description: 'Required complete schema-valid value for create; optional complete replacement reset baseline for update.' },
      value: { type: 'json', description: 'Optional complete schema-valid current-value replacement for update only.' },
    },
    output: stateToolOutput(),
    async execute(args, exec) {
      if (exec.agent === undefined) throw new RpStateError('RP_AGENT_REQUIRED', 'rp_state requires an active Roleplay Agent.')
      const profile = ctx.get('rpSessions')?.get(exec.agent)
      if (profile?.runtime?.executionMode !== 'agent') throw new RpStateError('AGENT_MODE_REQUIRED', '请切换到 Agent 模式后再修改故事状态结构。')
      const owner = stateToolOwner(exec.agent, exec.callId)
      const durable = await service.configure(exec.agent, args, owner)
      try {
        const runContext = await ctx.rpRuntime.refreshRunContext(exec.agent, {
          kind: 'state-configuration',
          code: 'RP_STATE_CONFIGURATION_INCOMPLETE',
          messagePrefix: 'The refreshed State context could not be built',
        })
        return { ok: true, ...durable, runContext, phases: { stateWrite: { status: 'succeeded', durable: true }, contextRefresh: { status: 'succeeded', durable: false, contextEpoch: runContext.contextEpoch } } }
      } catch (error) {
        return {
          ok: false,
          ...durable,
          phases: {
            stateWrite: { status: 'succeeded', durable: true },
            contextRefresh: { status: 'failed', durable: false, error: { message: error instanceof Error ? error.message : String(error) } },
          },
        }
      }
    },
    presentCall: () => ({ card: 'generic', title: '更新故事状态结构', kind: 'write' }),
    presentResult: (_args, result) => ({ card: 'generic', title: result.isError ? '故事状态未能更新' : '故事状态结构已更新', kind: 'read', rawOutput: result.content }),
  })
}

function stateToolOutput() {
  return { schema: { type: 'json' }, render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }] }
}

function stateToolOwner(agent, callId) {
  const resolved = resolveRpToolCallAssistant(agent.session?.events, callId, RP_STATE_TOOL)
  if (resolved === undefined) {
    throw new RpStateError('RP_STATE_OWNER_MISSING', 'rp_state requires one durable model assistant tool call in the current turn and step.')
  }
  return normalizeStateCommandOwner({
    kind: 'assistant-tool',
    tool: RP_STATE_TOOL,
    callId,
    assistant: {
      seq: resolved.event.seq,
      messageId: resolved.message.id,
      turn: resolved.call.data.turn,
      step: resolved.call.data.step,
    },
  })
}

function validateStateToolOwner(agent, owner) {
  const canonical = normalizeStateCommandOwner(owner)
  const actual = stateToolOwner(agent, canonical.callId)
  if (!sameJson(canonical, actual)) {
    throw new RpStateError('RP_STATE_OWNER_MISMATCH', 'The State configuration owner does not match its durable model assistant tool call.')
  }
  return canonical
}

function prepareConfigurationMutation(state, request) {
  if (!record(request) || !['create', 'update', 'reset', 'delete'].includes(request.action)) throw new RpStateError('INVALID_REQUEST', 'State action must be create, update, reset, or delete.')
  const namespace = normalizeNamespaceId(request.namespace)
  if (!Number.isSafeInteger(request.expectedRevision) || request.expectedRevision < 0) throw new RpStateError('INVALID_REQUEST', 'State expectedRevision must be a non-negative safe integer.')
  const current = state.namespaces[namespace]
  const allowed = new Set(['action', 'namespace', 'expectedRevision', ...(request.action === 'create' ? ['definition', 'initialValue'] : request.action === 'update' ? ['definition', 'initialValue', 'value'] : [])])
  const unknown = Object.keys(request).find(key => !allowed.has(key))
  if (unknown !== undefined) throw new RpStateError('INVALID_REQUEST', `State ${request.action} contains unsupported field "${unknown}".`)
  if (request.action === 'create') {
    if (request.expectedRevision !== 0 || current !== undefined) throw new RpStateError('REVISION_CONFLICT', `State namespace "${namespace}" must not exist when created.`)
    const result = createNamespaceSnapshot({ definition: request.definition, initialValue: request.initialValue })
    return { action: 'create', namespace, expectedRevision: 0, result }
  }
  if (current === undefined) throw new RpStateError('NAMESPACE_NOT_FOUND', `State namespace "${namespace}" does not exist.`)
  if (request.expectedRevision !== current.revision) throw new RpStateError('REVISION_CONFLICT', `State revision conflict for "${namespace}": expected ${request.expectedRevision}, current ${current.revision}.`)
  if (request.action === 'delete') return { action: 'delete', namespace, expectedRevision: current.revision }
  if (request.action === 'reset') {
    return { action: 'reset', namespace, expectedRevision: current.revision, result: { ...cloneJson(current), revision: current.revision + 1, value: cloneJson(current.initialValue), diagnostics: { setup: cloneJson(current.diagnostics.setup), lastCommit: [] } } }
  }
  const definition = normalizeStateDefinition(request.definition)
  const initialValue = validateStateValue(definition.schema, request.initialValue === undefined ? current.initialValue : normalizeJson(request.initialValue, 'initialValue'), 'initialValue')
  const value = validateStateValue(definition.schema, request.value === undefined ? current.value : normalizeJson(request.value, 'value'), 'value')
  return {
    action: 'update',
    namespace,
    expectedRevision: current.revision,
    result: {
      revision: current.revision + 1,
      initialValue,
      value,
      definition,
      diagnostics: { setup: cloneJson(current.diagnostics.setup), lastCommit: [] },
    },
  }
}

function applyAcceptedEffects(state, effects) {
  const next = cloneJson(state)
  for (const effect of effects) {
    if (effect.kind !== 'state.update') continue
    next.namespaces[effect.namespace] = cloneJson(effect.payload.result)
  }
  return next
}

function replayStateMutations(mutations, entities) {
  return replayStateTimeline(mutations, entities).value
}

/** Project the latest active successful reply's canonical State changes for read-only UI. */
export function stateActivityView(projection) {
  return replayStateTimeline(projection.mutations, projection.entities).activity
}

function replayStateTimeline(mutations, entities) {
  const timeline = [
    ...mutations,
    ...entities.map(entity => ({ seq: entity.rootSeq, kind: 'entity', value: entity.value })),
  ].sort((left, right) => left.seq - right.seq || mutationRank(left.kind) - mutationRank(right.kind))
  let value = emptyState()
  let activity = emptyStateActivity()
  for (const mutation of timeline) {
    if (mutation.kind === 'bootstrap') {
      value = applyBootstrapMutation(value, mutation.value)
      activity = emptyStateActivity()
      continue
    }
    if (mutation.value.kind === 'state.configuration') {
      value = applyConfigurationMutation(value, mutation.value.mutation)
      activity = emptyStateActivity()
      continue
    }
    activity = activityForAssistantMutation(value, mutation.value)
    value = applyAssistantMutation(value, mutation.value)
  }
  return { value, activity }
}

function emptyStateActivity() {
  return { available: false, namespaces: {} }
}

function activityForAssistantMutation(state, value) {
  if (value.kind !== 'state.turn-commit') throw new Error('State entity kind is invalid.')
  const namespaces = {}
  for (const effect of value.effects) {
    if (!record(effect) || effect.kind !== 'state.update' || typeof effect.namespace !== 'string' || !record(effect.payload?.result)) continue
    const snapshot = state.namespaces[effect.namespace]
    if (snapshot === undefined) continue
    namespaces[effect.namespace] = effect.payload.changes.map(change => {
      const segments = parseJsonPointer(change.path)
      return {
        op: change.op,
        path: change.path,
        reason: change.reason,
        before: activityValue(snapshot.value, segments),
        after: activityValue(effect.payload.result.value, segments),
      }
    })
  }
  return { available: true, namespaces }
}

function activityValue(value, segments) {
  const result = readJsonPointer(value, segments)
  return result.found ? { exists: true, value: cloneJson(result.value) } : { exists: false }
}

function applyBootstrapMutation(state, bootstrap) {
  const namespaces = Object.fromEntries(bootstrap.namespaces.map(item => [item.namespace, createNamespaceSnapshot(item)]))
  return { protocolVersion: RP_STATE_PROTOCOL_VERSION, revision: state.revision + 1, namespaces }
}

function applyConfigurationMutation(state, mutation) {
  const current = state.namespaces[mutation.namespace]
  const revision = current?.revision ?? 0
  if (revision !== mutation.expectedRevision) {
    throw new Error(`State configuration history has a revision conflict for "${mutation.namespace}".`)
  }
  if (mutation.action === 'create' && current !== undefined) {
    throw new Error(`State configuration history recreates existing namespace "${mutation.namespace}".`)
  }
  if (mutation.action !== 'create' && current === undefined) {
    throw new Error(`State configuration history targets missing namespace "${mutation.namespace}".`)
  }
  const namespaces = { ...state.namespaces }
  if (mutation.action === 'delete') delete namespaces[mutation.namespace]
  else namespaces[mutation.namespace] = cloneJson(mutation.result)
  return { ...state, revision: state.revision + 1, namespaces }
}

function applyAssistantMutation(state, value) {
  if (value.kind !== 'state.turn-commit') throw new Error('State entity kind is invalid.')
  let namespaces = { ...state.namespaces }
  let changed = false
  for (const effect of value.effects) {
    if (!record(effect) || effect.kind !== 'state.update' || typeof effect.namespace !== 'string' || !record(effect.payload?.result)) continue
    const snapshot = namespaces[effect.namespace]
    if (snapshot === undefined || effect.expectedRevision !== snapshot.revision) {
      throw new Error(`State update history has a revision conflict for "${effect.namespace}".`)
    }
    const working = { ...state, namespaces }
    const replayed = applyStateChanges({
      state: working,
      namespace: effect.namespace,
      snapshot,
      changes: effect.payload.changes,
    })
    if (!sameJson(replayed.result, effect.payload.result)) {
      throw new Error(`State update history contains a non-canonical result for "${effect.namespace}".`)
    }
    namespaces = { ...namespaces, [effect.namespace]: replayed.result }
    changed = true
  }
  if (Object.keys(namespaces).length === 0) return state
  const diagnostics = value.diagnostics.filter(item => typeof item.namespace === 'string')
  const withDiagnostics = Object.fromEntries(Object.entries(namespaces).map(([namespace, snapshot]) => [namespace, {
    ...snapshot,
    diagnostics: {
      setup: snapshot.diagnostics.setup,
      lastCommit: diagnostics.filter(item => item.namespace === namespace).map(({ source: _source, ...item }) => cloneJson(item)),
    },
  }]))
  if (!sameJson(withDiagnostics, namespaces)) changed = true
  return changed ? { ...state, revision: state.revision + 1, namespaces: withDiagnostics } : state
}

function validateStateProjection(value) {
  if (!record(value)
    || !exactKeys(value, ['value', 'session', 'commands', 'mutations', 'entities'])
    || !validStateValue(value.value)
    || !record(value.session)
    || !Array.isArray(value.session.pending)
    || !validStateCommandProjection(value.commands)
    || !Array.isArray(value.mutations)
    || !Array.isArray(value.entities)) throw new Error('rp/state projection state is invalid')
  try {
    if (!value.mutations.every(validBootstrapMutation)
      || !value.entities.every(validStateEntity)
      || !sameJson(replayStateMutations(value.mutations, value.entities), value.value)) {
      throw new Error('rp/state projection state is invalid')
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'rp/state projection state is invalid') throw error
    throw new Error('rp/state projection state is invalid', { cause: error })
  }
  return value
}

function validStateCommandProjection(value) {
  if (!record(value)
    || !exactKeys(value, ['owners', 'pending'])
    || !Array.isArray(value.owners)
    || !Array.isArray(value.pending)) return false
  try {
    const ownerIds = new Set()
    for (const item of value.owners) {
      if (!record(item) || !exactKeys(item, ['owner', 'confirmed']) || typeof item.confirmed !== 'boolean') return false
      const owner = normalizeStateCommandOwner(item.owner)
      if (!sameJson(owner, item.owner) || ownerIds.has(owner.callId)) return false
      ownerIds.add(owner.callId)
    }
    const commandIds = new Set()
    for (const item of value.pending) {
      if (!record(item)
        || typeof item.commandId !== 'string'
        || item.commandId.length === 0
        || commandIds.has(item.commandId)) return false
      if (item.rejected === true) {
        if (!exactKeys(item, ['commandId', 'rejected'])) return false
        commandIds.add(item.commandId)
        continue
      }
      if (!exactKeys(item, ['commandId', 'owner', 'mutation'])) return false
      const owner = normalizeStateCommandOwner(item.owner)
      const mutation = normalizeStateConfigurationMutation(item.mutation)
      if (!sameJson(owner, item.owner)
        || !sameJson(mutation, item.mutation)
        || ownerIds.has(owner.callId)) return false
      ownerIds.add(owner.callId)
      commandIds.add(item.commandId)
    }
    return true
  } catch {
    return false
  }
}

function validBootstrapMutation(value) {
  if (!record(value)
    || !exactKeys(value, ['seq', 'kind', 'value'])
    || !Number.isSafeInteger(value.seq)
    || value.seq < 0
    || value.kind !== 'bootstrap') return false
  try { return sameJson(normalizeStateBootstrap(value.value), value.value) } catch { return false }
}

function validStateEntity(entity) {
  if (!record(entity)
    || !exactKeys(entity, ['rootSeq', 'currentSeq', 'value'])
    || !Number.isSafeInteger(entity.rootSeq)
    || entity.rootSeq < 0
    || !Number.isSafeInteger(entity.currentSeq)
    || entity.currentSeq < 0
    || !record(entity.value)) return false
  const value = entity.value
  try {
    if (value.kind === 'state.configuration') {
      if (!exactKeys(value, ['kind', 'commandId', 'mutation'])
        || typeof value.commandId !== 'string'
        || value.commandId.length === 0) return false
      return sameJson(normalizeStateConfigurationMutation(value.mutation), value.mutation)
    }
    if (value.kind !== 'state.turn-commit'
      || !exactKeys(value, ['kind', 'effects', 'diagnostics', 'turn'])
      || !Array.isArray(value.effects)
      || !Array.isArray(value.diagnostics)
      || (value.turn !== null && !Number.isSafeInteger(value.turn))) return false
    if (!value.effects.every(validStateUpdateEffect)) return false
    return value.diagnostics.every(item => record(item)
      && item.source === STATE_CONTEXT_SOURCE_ID
      && sameJson(normalizeJson(item, 'State commit diagnostic'), item))
  } catch {
    return false
  }
}

function validStateUpdateEffect(effect) {
  if (!record(effect)
    || !exactKeys(effect, ['kind', 'namespace', 'expectedRevision', 'payload'])
    || effect.kind !== 'state.update'
    || normalizeNamespaceId(effect.namespace) !== effect.namespace
    || !Number.isSafeInteger(effect.expectedRevision)
    || effect.expectedRevision < 1
    || !record(effect.payload)
    || !exactKeys(effect.payload, ['changes', 'result'])
    || !Array.isArray(effect.payload.changes)
    || effect.payload.changes.length === 0
    || !validNamespaceSnapshot(effect.payload.result)) return false
  normalizeJson(effect.payload.changes, 'State update changes')
  return true
}

function validateStateView(value) {
  if (!validStateValue(value)) throw new Error('rp/state projection is invalid')
  return value
}

function validateStateActivityView(value) {
  if (!record(value)
    || !exactKeys(value, ['available', 'namespaces'])
    || typeof value.available !== 'boolean'
    || !record(value.namespaces)) throw new Error('rp/state activity projection is invalid')
  try {
    for (const [namespace, changes] of Object.entries(value.namespaces)) {
      if (normalizeNamespaceId(namespace) !== namespace
        || !Array.isArray(changes)
        || !changes.every(validStateActivityChange)) throw new Error('rp/state activity projection is invalid')
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'rp/state activity projection is invalid') throw error
    throw new Error('rp/state activity projection is invalid', { cause: error })
  }
  return value
}

function validStateActivityChange(value) {
  if (!record(value)
    || !exactKeys(value, ['op', 'path', 'reason', 'before', 'after'])
    || !['set', 'increment', 'append', 'remove'].includes(value.op)
    || typeof value.path !== 'string'
    || typeof value.reason !== 'string'
    || value.reason.length === 0
    || !validStateActivityValue(value.before)
    || !validStateActivityValue(value.after)) return false
  parseJsonPointer(value.path)
  return true
}

function validStateActivityValue(value) {
  if (!record(value) || typeof value.exists !== 'boolean') return false
  if (!value.exists) return exactKeys(value, ['exists'])
  if (!exactKeys(value, ['exists', 'value'])) return false
  return sameJson(normalizeJson(value.value, 'State activity value'), value.value)
}

function validStateValue(value) {
  if (!record(value)
    || !exactKeys(value, ['protocolVersion', 'revision', 'namespaces'])
    || value.protocolVersion !== RP_STATE_PROTOCOL_VERSION
    || !Number.isSafeInteger(value.revision)
    || value.revision < 0
    || !record(value.namespaces)) return false
  try {
    for (const [namespace, snapshot] of Object.entries(value.namespaces)) {
      if (normalizeNamespaceId(namespace) !== namespace || !validNamespaceSnapshot(snapshot)) return false
    }
    return true
  } catch {
    return false
  }
}

function validNamespaceSnapshot(value) {
  if (!record(value)
    || !exactKeys(value, ['revision', 'initialValue', 'value', 'definition', 'diagnostics'])
    || !Number.isSafeInteger(value.revision)
    || value.revision < 1
    || !record(value.definition)
    || !record(value.diagnostics)
    || !exactKeys(value.diagnostics, ['setup', 'lastCommit'])
    || !Array.isArray(value.diagnostics.setup)
    || !Array.isArray(value.diagnostics.lastCommit)) return false
  const definition = normalizeStateDefinition(value.definition)
  const initialValue = validateStateValue(definition.schema, normalizeJson(value.initialValue, 'initialValue'), 'initialValue')
  const currentValue = validateStateValue(definition.schema, normalizeJson(value.value, 'value'), 'value')
  const setup = normalizeSetupDiagnostics(value.diagnostics.setup)
  const lastCommit = value.diagnostics.lastCommit.map((item, index) => normalizeJson(item, `diagnostics.lastCommit[${index}]`))
  return sameJson(value, {
    revision: value.revision,
    initialValue,
    value: currentValue,
    definition,
    diagnostics: { setup, lastCommit },
  })
}

function mutationRank(kind) {
  return kind === 'bootstrap' ? 0 : 1
}

function exactFields(value, fields, label) {
  if (!record(value)) throw new RpStateError('INVALID_REQUEST', `${label} must be an object.`)
  const allowed = new Set(fields)
  const unknown = Object.keys(value).find(key => !allowed.has(key))
  if (unknown !== undefined) throw new RpStateError('INVALID_REQUEST', `${label} contains unknown field "${unknown}".`)
  for (const field of fields) if (!Object.prototype.hasOwnProperty.call(value, field)) throw new RpStateError('INVALID_REQUEST', `${label} requires ${field}.`)
}

function record(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function exactKeys(value, keys) {
  return Object.keys(value).length === keys.length && keys.every(key => Object.prototype.hasOwnProperty.call(value, key))
}

function sameJson(left, right) {
  return canonicalJson(left) === canonicalJson(right)
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  if (record(value)) return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`
  return JSON.stringify(value)
}

export class RpStateError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'RpStateError'
    this.code = code
  }
}
