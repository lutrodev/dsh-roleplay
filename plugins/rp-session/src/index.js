import { Service } from '@deepseek-ai/cordis'
import Schema from '@deepseek-ai/schemastery'
import { MAX_CONTEXT_SLOTS, normalizeCustomContextSources, RP_CONTEXT_BUILD_VERSION } from 'dsh-roleplay-rp-core'
import { createRpMessageActionMetadata } from 'dsh-roleplay-rp-core/conversation'
import {
  RP_SESSION_APPLY_COMMAND,
  MAX_OPENING_CHARACTERS,
  OPENING_MESSAGE_MODEL,
  OPENING_MESSAGE_PROVIDER,
  applySessionCommandEvent,
  decodeSessionCommandInput,
  emptySessionCommandState,
  encodeSessionCommand,
  isSelectedOpeningMessage,
  profileFromEvents,
} from './protocol.js'

export * from './protocol.js'
export { MAX_CONTEXT_SLOTS } from 'dsh-roleplay-rp-core'

export const name = 'rp-session'
export const inject = ['commands', 'rpRuntime']

export const Config = Schema.object({
  defaultMode: Schema.union(['adaptive', 'actor', 'director']).default('adaptive'),
  defaultExecutionMode: Schema.union(['chat', 'agent']).default('chat'),
  maxProfileCommandBytes: Schema.number().default(262144),
})

const PLAYER_CHARACTER_ID = 'rp.player'
const MAX_PLAYER_NAME_CHARACTERS = 80

/** Roleplay session profile service; the Harness session remains the only transcript store. */
export class RpSessions extends Service {
  /** @param {import('@deepseek-ai/cordis').Context} ctx @param {{ defaultMode: 'adaptive' | 'actor' | 'director', defaultExecutionMode: 'chat' | 'agent', maxProfileCommandBytes: number }} config */
  constructor(ctx, config) {
    super(ctx, 'rpSessions')
    this.defaultMode = config.defaultMode
    this.defaultExecutionMode = config.defaultExecutionMode ?? 'chat'
    this.maxProfileCommandBytes = config.maxProfileCommandBytes
    this.materializers = new Map()
    this.authorizedCommandInputs = new WeakMap()
    ctx.commands.register({
      name: RP_SESSION_APPLY_COMMAND,
      description: 'Apply a validated roleplay session profile snapshot.',
      handler: invocation => this.applyProfileCommand(invocation),
    })
    ctx.rpRuntime.registerSessionProfileProvider(agent => this.get(agent))
    ctx.on('agent/request', async ({ agent }, next) => {
      const proposed = await next()
      const runtime = this.get(agent).runtime
      return runtime.provider === undefined ? proposed : { ...proposed, provider: runtime.provider, model: runtime.model }
    })
    ctx.on('system-prompt/assemble', async (_assembly, context, next) => {
      const assembled = await next()
      const agent = context.agent
      if (agent === undefined) return assembled
      const runtime = this.get(agent).runtime
      return runtime.provider === undefined ? assembled : {
        ...assembled,
        variables: { ...assembled.variables, provider: runtime.provider, model: runtime.model },
      }
    })
    ctx.rpRuntime.registerRunGuard({
      id: 'rp.session.revision',
      validate: (_artifact, { agent, run }) => {
        if (run.profile?.revision !== this.get(agent).revision) throw new Error('roleplay session configuration changed during the active run')
      },
    })
    ctx.inject(['sessionProjections'], projectionCtx => {
      projectionCtx.sessionProjections.register({
        key: 'rp/session',
        stateSchema: { parse: validateSessionProjectionState },
        init: emptySessionCommandState,
        apply: applySessionProjection,
        wire: {
          viewSchema: { parse: validateSessionProjectionView },
          view: state => state.profile,
        },
        stateVersion: 2,
      })
    })
  }

  /**
   * Append a complete roleplay session profile with compare-and-set revision checking.
   *
   * @param {object} agent Live Harness Agent.
   * @param {unknown} request Profile request.
   * @returns {Record<string, unknown>} Committed profile.
   */
  async configure(agent, request) {
    const current = this.get(agent)
    let profile = normalizeProfile(request, current.revision, this.defaultExecutionMode)
    let materializedOpeningText = profile.scene.openingText
    const stateBootstrapNamespaces = []
    let stateBootstrapVersion
    let stateBootstrapRequested = false
    for (const definition of [...this.materializers.values()].sort((left, right) => (left.order ?? 0) - (right.order ?? 0) || left.id.localeCompare(right.id))) {
      const value = await definition.prepare({ agent, profile, openingMessageText: materializedOpeningText })
      if (value === undefined) continue
      if (Object.prototype.hasOwnProperty.call(value, 'stateBootstrap')) {
        if (!record(value.stateBootstrap) || value.stateBootstrap.version !== 2 || !Array.isArray(value.stateBootstrap.namespaces)) {
          throw new RpSessionError('INVALID_MATERIALIZATION', `Profile materializer "${definition.id}" returned an invalid stateBootstrap.`)
        }
        if (stateBootstrapVersion !== undefined && stateBootstrapVersion !== value.stateBootstrap.version) {
          throw new RpSessionError('INVALID_MATERIALIZATION', 'Profile materializers returned incompatible State bootstrap versions.')
        }
        stateBootstrapVersion = value.stateBootstrap.version
        stateBootstrapNamespaces.push(...value.stateBootstrap.namespaces)
        stateBootstrapRequested = true
      }
      if (Object.prototype.hasOwnProperty.call(value, 'openingMessageText')) {
        materializedOpeningText = normalizeMaterializedOpeningMessage(value.openingMessageText)
      }
    }
    if (stateBootstrapRequested) validateStateBootstrapPartitions(stateBootstrapNamespaces)
    profile = {
      ...profile,
      ...(stateBootstrapRequested ? { stateBootstrap: { version: stateBootstrapVersion, namespaces: stateBootstrapNamespaces } } : {}),
    }
    const expandedOpening = materializedOpeningText === undefined
      ? undefined
      : normalizeOpeningText(await this.ctx.rpRuntime.transformText(materializedOpeningText, {
          agent,
          profile,
          phase: 'opening',
        }))
    const activeOpening = findActiveOpeningMessage(agent.session)
    if (expandedOpening !== undefined && activeOpening === undefined) {
      throw new RpSessionError(
        'OPENING_REQUIRES_SEEDED_CREATE',
        'The first roleplay opening must be included in the Session seed before the Agent is constructed.',
      )
    }
    const rawInput = encodeSessionCommand(current.revision, profile)
    if (Buffer.byteLength(rawInput, 'utf8') > this.maxProfileCommandBytes) {
      throw new RpSessionError('PROFILE_TOO_LARGE', `Roleplay session profile command exceeds ${this.maxProfileCommandBytes} UTF-8 bytes.`)
    }
    let authorized = this.authorizedCommandInputs.get(agent)
    if (authorized === undefined) {
      authorized = new Set()
      this.authorizedCommandInputs.set(agent, authorized)
    }
    authorized.add(rawInput)
    try {
      const execution = await this.ctx.commands.execute(
        agent,
        `/${RP_SESSION_APPLY_COMMAND}${rawInput}`,
        [],
        new AbortController().signal,
      )
      if (execution?.result.kind !== 'success') throw new RpSessionError('COMMAND_FAILED', 'Roleplay session profile command did not complete successfully.')
      this.ctx.rpRuntime.syncExecutionMode(agent)
      const currentOpening = current.scene.openingText
      const nextOpening = profile.scene.openingText
      const setupExpansionChanged = !hasUserMessage(agent.session.events)
        && openingMessageText(activeOpening?.message) !== expandedOpening
      if (currentOpening !== nextOpening || activeOpening === undefined || setupExpansionChanged) {
        synchronizeOpeningMessage(agent.session, expandedOpening, profile)
      }
    } finally {
      authorized.delete(rawInput)
      if (authorized.size === 0) this.authorizedCommandInputs.delete(agent)
    }
    return profile
  }

  /** @param {{ agent: object, rawInput: string }} invocation */
  applyProfileCommand(invocation) {
    const authorized = this.authorizedCommandInputs.get(invocation.agent)
    if (authorized?.has(invocation.rawInput) !== true) {
      throw new RpSessionError('COMMAND_NOT_AUTHORIZED', 'Roleplay session profiles can only be applied through the validated session service.')
    }
    if (Buffer.byteLength(invocation.rawInput, 'utf8') > this.maxProfileCommandBytes) {
      throw new RpSessionError('PROFILE_TOO_LARGE', `Roleplay session profile command exceeds ${this.maxProfileCommandBytes} UTF-8 bytes.`)
    }
    const payload = decodeSessionCommandInput(invocation.rawInput)
    const current = this.get(invocation.agent)
    if (payload.expectedRevision !== current.revision) {
      throw new RpSessionError('REVISION_CONFLICT', `Roleplay session revision conflict: expected ${String(payload.expectedRevision)}, current ${current.revision}.`)
    }
    return { kind: 'success', text: `Roleplay session revision ${payload.profile.revision} configured.` }
  }

  /**
   * Atomically replace the setup and asset bindings with an adaptive
   * participation profile. The runtime interprets each user turn;
   * the reserved user-controlled member remains a stable safety boundary.
   *
   * @param {object} agent Live Harness Agent.
   * @param {{ expectedRevision: number, card?: object, lorebooks?: object[], persona?: object, preset?: object, writingStyles?: object[], openingIndex?: number, openingSource?: 'card' | 'custom' | 'skip', openingText?: string | null }} request Canonical setup and live asset references. A null opening explicitly omits the opening message.
   */
  async bindResources(agent, request) {
    return this.bindResourcesInternal(agent, request, false)
  }

  /** Trusted model-tool entry: change bindings only while this Agent owns an active RpRun. */
  async bindResourcesDuringRun(agent, request) {
    if (this.ctx.rpRuntime.inspectRun(agent)?.status !== 'running') {
      throw new RpSessionError('RP_RUN_NOT_ACTIVE', 'Roleplay assets can only be changed during an active run.')
    }
    return this.bindResourcesInternal(agent, request, true)
  }

  /** Resolve and apply one partial shared-asset selection while the Agent is idle. */
  async bindAssetChanges(agent, request) {
    return this.bindAssetChangesInternal(agent, request, false)
  }

  /** Trusted model-tool entry for resolving and applying partial shared-asset changes. */
  async bindAssetChangesDuringRun(agent, request) {
    if (this.ctx.rpRuntime.inspectRun(agent)?.status !== 'running') {
      throw new RpSessionError('RP_RUN_NOT_ACTIVE', 'Roleplay assets can only be changed during an active run.')
    }
    return this.bindAssetChangesInternal(agent, request, true)
  }

  async bindAssetChangesInternal(agent, request, allowRunning) {
    if (!record(request) || !record(request.changes)) {
      throw new RpSessionError('INVALID_REQUEST', 'asset binding changes must be an object')
    }
    const current = this.get(agent)
    const expectedRevision = request.expectedRevision ?? current.revision
    if (!Number.isSafeInteger(expectedRevision) || expectedRevision !== current.revision) {
      throw new RpSessionError('REVISION_CONFLICT', `Roleplay session revision conflict: expected ${String(expectedRevision)}, current ${current.revision}.`)
    }
    const storyStarted = hasUserMessage(agent.session.events)
    const resolved = await resolveAssetChanges(this.ctx, current, request.changes, request.openingIndex, has(request, 'openingText'))
    if (has(request, 'openingText')) resolved.openingText = request.openingText
    else if (storyStarted) {
      delete resolved.openingText
      delete resolved.openingSource
      if (request.openingIndex === undefined) resolved.openingIndex = current.scene.openingIndex ?? 0
    }
    if (has(request, 'openingSource')) resolved.openingSource = request.openingSource
    return this.bindResourcesInternal(agent, { expectedRevision, ...resolved }, allowRunning)
  }

  async bindResourcesInternal(agent, request, allowRunning) {
    if (!record(request)) throw new RpSessionError('INVALID_REQUEST', 'session/bind payload must be an object')
    if (!allowRunning && agent.status !== 'idle') throw new RpSessionError('SESSION_RUNNING', 'Roleplay assets can only be changed while the Agent is idle.')
    const current = this.get(agent)
    if (request.expectedRevision !== current.revision) {
      throw new RpSessionError('REVISION_CONFLICT', `Roleplay session revision conflict: expected ${String(request.expectedRevision)}, current ${current.revision}.`)
    }
    const agentControlled = current.cast.filter(member => member.controller === 'agent' && member.characterId !== PLAYER_CHARACTER_ID)
    const nextCast = [...agentControlled, { characterId: PLAYER_CHARACTER_ID, controller: 'user' }]
    const nextResources = normalizeResources({
      card: request.card,
      lorebooks: request.lorebooks,
      persona: request.persona,
      preset: request.preset,
      writingStyles: request.writingStyles ?? current.resources.writingStyles,
    })
    const nextOpeningIndex = normalizeOpeningIndex(request.openingIndex ?? current.scene.openingIndex ?? 0)
    const openingRequested = has(request, 'openingText')
    const requestedOpening = request.openingText === null || request.openingText === undefined
      ? undefined
      : normalizeOpeningText(request.openingText)
    const requestedOpeningSource = has(request, 'openingSource')
      ? normalizeOpeningSource(request.openingSource)
      : openingRequested
        ? requestedOpening === undefined ? 'skip' : 'custom'
        : current.scene.openingSource
    const storyStarted = hasUserMessage(agent.session.events)
    const openingChanged = (!storyStarted && !sameBinding(current.resources.card, nextResources.card))
      || nextOpeningIndex !== (current.scene.openingIndex ?? 0)
      || requestedOpeningSource !== current.scene.openingSource
    if (storyStarted) {
      if (nextOpeningIndex !== (current.scene.openingIndex ?? 0)) {
        throw new RpSessionError('OPENING_LOCKED', 'The selected opening cannot be changed after the first user message.')
      }
      if (openingRequested && requestedOpening !== current.scene.openingText) {
        throw new RpSessionError('OPENING_LOCKED', 'The selected opening cannot be changed after the first user message.')
      }
      if (requestedOpeningSource !== current.scene.openingSource) {
        throw new RpSessionError('OPENING_LOCKED', 'The selected opening source cannot be changed after the first user message.')
      }
    }
    const nextScene = { ...current.scene, openingIndex: nextOpeningIndex }
    if (openingRequested) {
      if (requestedOpening === undefined) {
        delete nextScene.openingText
        delete nextScene.openingAnchorRevision
        nextScene.openingSource = 'skip'
      } else {
        nextScene.openingText = requestedOpening
        nextScene.openingSource = requestedOpeningSource ?? 'custom'
        nextScene.openingAnchorRevision = current.scene.openingAnchorRevision ?? current.revision + 1
      }
    } else if (openingChanged) {
      delete nextScene.openingText
      delete nextScene.openingAnchorRevision
      nextScene.openingSource = 'skip'
    } else if (requestedOpeningSource !== undefined) {
      nextScene.openingSource = requestedOpeningSource
    }
    return this.configure(agent, {
      expectedRevision: current.revision,
      mode: 'adaptive',
      playerCharacterId: PLAYER_CHARACTER_ID,
      cast: nextCast,
      scene: nextScene,
      resources: nextResources,
      runtime: current.runtime,
      ...(current.contextBuild === undefined ? {} : { contextBuild: current.contextBuild }),
    })
  }

  /** Replace the current conversation's opening copy without creating a model turn. */
  async setOpeningText(agent, request) {
    if (!record(request)) throw new RpSessionError('INVALID_REQUEST', 'opening edit payload must be an object')
    if (agent.status !== 'idle') throw new RpSessionError('SESSION_RUNNING', 'The opening can only be edited while the Agent is idle.')
    const current = this.get(agent)
    if (request.expectedRevision !== current.revision) {
      throw new RpSessionError('REVISION_CONFLICT', `Roleplay session revision conflict: expected ${String(request.expectedRevision)}, current ${current.revision}.`)
    }
    const openingText = normalizeOpeningText(request.openingText)
    if (current.scene.openingText === openingText) return current
    return this.configure(agent, {
      expectedRevision: current.revision,
      mode: current.mode,
      ...(current.playerCharacterId === undefined ? {} : { playerCharacterId: current.playerCharacterId }),
      cast: current.cast,
      scene: { ...current.scene, openingSource: 'custom', openingText },
      resources: current.resources,
      runtime: current.runtime,
      ...(current.contextBuild === undefined ? {} : { contextBuild: current.contextBuild }),
    })
  }

  /** Change the execution capability policy for the next turn without changing RP state or assets. */
  async setExecutionMode(agent, request) {
    if (!record(request)) throw new RpSessionError('INVALID_REQUEST', 'session/execution-mode payload must be an object')
    if (agent.status !== 'idle') throw new RpSessionError('SESSION_RUNNING', 'Roleplay execution mode can only be changed while the Agent is idle.')
    const current = this.get(agent)
    if (request.expectedRevision !== current.revision) {
      throw new RpSessionError('REVISION_CONFLICT', `Roleplay session revision conflict: expected ${String(request.expectedRevision)}, current ${current.revision}.`)
    }
    if (request.executionMode !== 'chat' && request.executionMode !== 'agent') {
      throw new RpSessionError('INVALID_REQUEST', 'executionMode must be chat or agent')
    }
    if (current.runtime.executionMode === request.executionMode) return current
    return this.configure(agent, {
      expectedRevision: current.revision,
      mode: current.mode,
      ...(current.playerCharacterId === undefined ? {} : { playerCharacterId: current.playerCharacterId }),
      cast: current.cast,
      scene: current.scene,
      resources: current.resources,
      runtime: { ...current.runtime, executionMode: request.executionMode },
      ...(current.contextBuild === undefined ? {} : { contextBuild: current.contextBuild }),
    })
  }

  /** Change only this conversation's Writer route, or resume the live global default. */
  async setWriterRoute(agent, request) {
    if (!record(request)) throw new RpSessionError('INVALID_REQUEST', 'session/writer-route payload must be an object')
    if (agent.status !== 'idle') throw new RpSessionError('SESSION_RUNNING', 'The Writer model can only be changed while the Agent is idle.')
    const current = this.get(agent)
    if (request.expectedRevision !== current.revision) {
      throw new RpSessionError('REVISION_CONFLICT', `Roleplay session revision conflict: expected ${String(request.expectedRevision)}, current ${current.revision}.`)
    }
    if (!has(request, 'route')) throw new RpSessionError('INVALID_REQUEST', 'session/writer-route requires route')
    const writerRoute = request.route === null ? undefined : normalizeWriterRoute(request.route)
    if (sameWriterRoute(current.runtime.writerRoute, writerRoute)) return current
    const runtime = { ...current.runtime }
    if (writerRoute === undefined) delete runtime.writerRoute
    else runtime.writerRoute = writerRoute
    return this.configure(agent, {
      expectedRevision: current.revision,
      mode: current.mode,
      ...(current.playerCharacterId === undefined ? {} : { playerCharacterId: current.playerCharacterId }),
      cast: current.cast,
      scene: current.scene,
      resources: current.resources,
      runtime,
      ...(current.contextBuild === undefined ? {} : { contextBuild: current.contextBuild }),
    })
  }

  /** Replace the deterministic Chat Slot layout while keeping every other Session setting. */
  async setContextBuild(agent, request) {
    if (!record(request)) throw new RpSessionError('INVALID_REQUEST', 'session/context-build payload must be an object')
    if (agent.status !== 'idle') throw new RpSessionError('SESSION_RUNNING', 'Roleplay context layout can only be changed while the Agent is idle.')
    const current = this.get(agent)
    if (request.expectedRevision !== current.revision) {
      throw new RpSessionError('REVISION_CONFLICT', `Roleplay session revision conflict: expected ${String(request.expectedRevision)}, current ${current.revision}.`)
    }
    const requestedContextBuild = normalizeContextBuild(request.contextBuild)
    const contextBuild = await this.ctx.rpRuntime.resolveContextBuild(
      requestedContextBuild,
      agent,
      { ...current, contextBuild: requestedContextBuild },
    )
    return this.configure(agent, {
      expectedRevision: current.revision,
      mode: current.mode,
      ...(current.playerCharacterId === undefined ? {} : { playerCharacterId: current.playerCharacterId }),
      cast: current.cast,
      scene: current.scene,
      resources: current.resources,
      runtime: current.runtime,
      contextBuild,
    })
  }

  registerProfileMaterializer(definition) {
    if (!record(definition) || typeof definition.id !== 'string' || typeof definition.prepare !== 'function') throw new Error('profile materializer requires id and prepare')
    if (this.materializers.has(definition.id)) throw new Error(`profile materializer "${definition.id}" is already registered`)
    this.materializers.set(definition.id, definition)
    const dispose = this.ctx.effect(() => () => {
      if (this.materializers.get(definition.id) === definition) this.materializers.delete(definition.id)
    }, `rpSessions.registerProfileMaterializer(${definition.id})`)
    return () => void dispose()
  }

  /** @param {object} agent @returns {Record<string, unknown>} */
  get(agent) {
    const projection = this.ctx.get('sessionProjections')?.stateOf(agent.session, 'rp/session')
    const profile = projection === undefined ? profileFromEvents(agent.session.events) : projection.profile
    return profile ?? defaultProfile(this.defaultMode, this.defaultExecutionMode)
  }

  /**
   * Whether the director Agent may mutate state owned by one character.
   *
   * @param {object} agent Live Agent.
   * @param {string | undefined} characterId Optional owner.
   * @returns {boolean} Permission decision.
   */
  canAgentMutate(agent, characterId) {
    if (characterId === undefined) return true
    const profile = this.get(agent)
    if (profile.mode === 'director') return true
    return profile.cast.find(member => member.characterId === characterId)?.controller !== 'user'
  }
}

/** @param {import('@deepseek-ai/cordis').Context} ctx @param {{ defaultMode: 'adaptive' | 'actor' | 'director', defaultExecutionMode: 'chat' | 'agent', maxProfileCommandBytes: number }} config */
export function apply(ctx, config) {
  if (!Number.isSafeInteger(config.maxProfileCommandBytes) || config.maxProfileCommandBytes < 1) {
    throw new Error('rp-session: maxProfileCommandBytes must be a positive safe integer')
  }
  new RpSessions(ctx, config)
}

/** @param {unknown} request @param {number} currentRevision @param {'chat' | 'agent'} [defaultExecutionMode] */
export function normalizeProfile(request, currentRevision, defaultExecutionMode = 'chat') {
  if (!record(request)) throw new Error('roleplay session profile must be an object')
  const expectedRevision = request.expectedRevision ?? currentRevision
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision !== currentRevision) {
    throw new Error(`roleplay session revision conflict: expected ${String(expectedRevision)}, current ${currentRevision}`)
  }
  if (!['adaptive', 'actor', 'director'].includes(request.mode)) throw new Error('roleplay session mode must be adaptive, actor or director')
  const cast = normalizeCast(request.cast)
  const playerCharacterId = optionalString(request.playerCharacterId)
  if (request.mode === 'actor' || request.mode === 'adaptive') {
    const userControlled = cast.filter(member => member.controller === 'user')
    if (userControlled.length !== 1 || playerCharacterId !== userControlled[0].characterId) {
      throw new Error(`${request.mode} mode requires exactly one user-controlled cast member matching playerCharacterId`)
    }
  }
  return {
    revision: currentRevision + 1,
    mode: request.mode,
    ...(playerCharacterId === undefined ? {} : { playerCharacterId }),
    cast,
    scene: normalizeScene(request.scene),
    resources: normalizeResources(request.resources),
    runtime: normalizeRuntime(request.runtime, defaultExecutionMode),
    ...(request.contextBuild === undefined ? {} : { contextBuild: normalizeContextBuild(request.contextBuild) }),
  }
}

/** @param {unknown} state @param {unknown} event */
export function applySessionProjection(state, event) {
  return applySessionCommandEvent(state, event)
}

/** Validate the complete host fold state restored from a projection checkpoint. */
function validateSessionProjectionState(value) {
  if (!record(value) || (value.profile !== null && !record(value.profile)) || !Array.isArray(value.pending)) {
    throw new Error('rp/session projection state is invalid')
  }
  for (const pending of value.pending) {
    if (!record(pending) || typeof pending.commandId !== 'string' || !record(pending.profile)) {
      throw new Error('rp/session projection state is invalid')
    }
  }
  return value
}

/** Validate the client-visible profile view. */
function validateSessionProjectionView(value) {
  if (value !== null && !record(value)) throw new Error('rp/session projection must be an object or null')
  return value
}

/** @param {'adaptive' | 'actor' | 'director'} mode @param {'chat' | 'agent'} executionMode */
function defaultProfile(mode, executionMode) {
  return { revision: 0, mode, cast: [], scene: {}, resources: { lorebooks: [], writingStyles: [] }, runtime: { executionMode } }
}

function synchronizeOpeningMessage(session, openingText, profile) {
  const current = findActiveOpeningMessage(session)
  if (current !== undefined) {
    const target = {
      kind: 'message', role: 'assistant', messageId: current.message.id,
      turn: current.event.data.turn, step: current.event.data.step,
    }
    if (openingText === undefined) {
      if (openingMessageText(current.message).length === 0) return
      const data = structuredClone(current.event.data)
      data.message.content = []
      data.message.source = openingReplacementSource(
        data.message.source, profile, createRpMessageActionMetadata('delete', [target]),
      )
      session.append('assistant/message', data, {
        surfaceOp: { op: 'replace', start: current.event.seq, end: current.event.seq },
        sourceEventSeqs: [current.event.seq],
      })
      return
    }
    if (openingMessageText(current.message) === openingText) return
    const data = structuredClone(current.event.data)
    data.message = replaceOpeningText(current.message, openingText)
    data.message.source = openingReplacementSource(
      data.message.source, profile, createRpMessageActionMetadata('edit', [target]),
    )
    session.append('assistant/message', data, {
      surfaceOp: { op: 'replace', start: current.event.seq, end: current.event.seq },
      sourceEventSeqs: [current.event.seq],
    })
    return
  }
  if (openingText === undefined) return
  throw new RpSessionError(
    'OPENING_REQUIRES_SEEDED_CREATE',
    'The first roleplay opening must be included in the Session seed before the Agent is constructed.',
  )
}

function openingReplacementSource(source, profile, rpMessageAction) {
  const next = {
    ...source,
    profileRevision: profile?.revision ?? null,
    openingAnchorRevision: profile?.scene?.openingAnchorRevision ?? profile?.revision ?? null,
    rpMessageAction,
  }
  delete next.replayState
  return next
}

function findOpeningMessage(events) {
  return events.findLast(isSelectedOpeningMessage)
}

function findActiveOpeningMessage(session) {
  for (let index = session.surface.nodes.length - 1; index >= 0; index -= 1) {
    const event = session.events[session.surface.nodes[index]]
    const message = eventMessage(event)
    if (message?.source?.provider !== OPENING_MESSAGE_PROVIDER || message.source.model !== OPENING_MESSAGE_MODEL) continue
    const original = session.events.find(candidate => isSelectedOpeningMessage(candidate)
      && candidate.data.message.id === message.id)
    if (original !== undefined) return { event, message, original }
  }
  return undefined
}

function eventMessage(event) {
  if (event?.type === 'assistant/message') return event.data?.message
  return undefined
}

function openingMessageText(message) {
  if (message === undefined) return undefined
  return message.content
    .filter(block => block?.type === 'text' && typeof block.text === 'string')
    .map(block => block.text)
    .join('')
}

function replaceOpeningText(message, openingText) {
  const next = structuredClone(message)
  const content = []
  let inserted = false
  for (const block of next.content) {
    if (block?.type === 'text') {
      if (!inserted) {
        content.push({ ...block, text: openingText })
        inserted = true
      }
      continue
    }
    content.push(block)
  }
  if (!inserted) content.unshift({ type: 'text', text: openingText })
  next.content = content
  return next
}

/** @param {unknown} value */
function normalizeCast(value) {
  if (value === undefined) return []
  if (!Array.isArray(value)) throw new Error('roleplay cast must be an array')
  const ids = new Set()
  return value.map(member => {
    if (!record(member) || typeof member.characterId !== 'string' || member.characterId.length === 0
      || (member.controller !== 'user' && member.controller !== 'agent')) {
      throw new Error('each cast member requires characterId and user|agent controller')
    }
    if (ids.has(member.characterId)) throw new Error(`duplicate cast character ${member.characterId}`)
    ids.add(member.characterId)
    const name = optionalString(member.name)
    if (name !== undefined && [...name].length > MAX_PLAYER_NAME_CHARACTERS) throw new Error(`cast member name must not exceed ${MAX_PLAYER_NAME_CHARACTERS} characters`)
    return { characterId: member.characterId, ...(name === undefined ? {} : { name }), controller: member.controller }
  })
}

/** @param {unknown} value */
function normalizeScene(value) {
  if (value === undefined) return {}
  if (!record(value)) throw new Error('scene must be an object')
  const id = optionalString(value.id)
  const title = optionalString(value.title)
  const openingIndex = value.openingIndex === undefined ? undefined : normalizeOpeningIndex(value.openingIndex)
  const openingSource = value.openingSource === undefined ? undefined : normalizeOpeningSource(value.openingSource)
  const openingText = value.openingText === undefined ? undefined : normalizeOpeningText(value.openingText)
  const openingAnchorRevision = value.openingAnchorRevision === undefined
    ? undefined
    : optionalPositiveInteger(value.openingAnchorRevision, 'scene.openingAnchorRevision')
  return {
    ...(id === undefined ? {} : { id }),
    ...(title === undefined ? {} : { title }),
    ...(openingIndex === undefined ? {} : { openingIndex }),
    ...(openingSource === undefined ? {} : { openingSource }),
    ...(openingText === undefined ? {} : { openingText }),
    ...(openingAnchorRevision === undefined ? {} : { openingAnchorRevision }),
  }
}

function normalizeOpeningIndex(value) {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error('scene.openingIndex must be a non-negative safe integer')
  return value
}

function normalizeOpeningSource(value) {
  if (!['card', 'custom', 'skip'].includes(value)) throw new Error('scene.openingSource must be card, custom, or skip')
  return value
}

function normalizeOpeningText(value) {
  if (typeof value !== 'string') throw new RpSessionError('INVALID_REQUEST', 'openingText must be a string')
  const normalized = value.replaceAll('\r\n', '\n').replaceAll('\r', '\n').trim()
  const characters = [...normalized].length
  if (characters < 1) throw new RpSessionError('INVALID_REQUEST', 'openingText must not be empty')
  if (characters > MAX_OPENING_CHARACTERS) {
    throw new RpSessionError('LIMIT_EXCEEDED', `openingText exceeds ${MAX_OPENING_CHARACTERS} characters`)
  }
  return normalized
}

function normalizeMaterializedOpeningMessage(value) {
  if (value === null || value === undefined || (typeof value === 'string' && value.trim().length === 0)) {
    return undefined
  }
  if (typeof value !== 'string') throw new RpSessionError('INVALID_REQUEST', 'openingMessageText must be a string or null')
  return normalizeOpeningText(value)
}

/** @param {unknown} value */
function normalizeResources(value) {
  if (value === undefined) return { lorebooks: [], writingStyles: [] }
  if (!record(value)) throw new Error('resources must be an object')
  if (Object.prototype.hasOwnProperty.call(value, 'characters')) {
    throw new Error('resources.characters is no longer supported; use the singular resources.card binding')
  }
  const card = value.card === undefined ? undefined : resourceBinding(value.card, 'card')
  const persona = value.persona === undefined ? undefined : resourceBinding(value.persona, 'persona')
  const preset = value.preset === undefined ? undefined : resourceBinding(value.preset, 'preset')
  return {
    ...(card === undefined ? {} : { card }),
    lorebooks: bindingArray(value.lorebooks, 'lorebooks'),
    ...(persona === undefined ? {} : { persona }),
    ...(preset === undefined ? {} : { preset }),
    writingStyles: bindingArray(value.writingStyles, 'writingStyles'),
  }
}

function normalizeRuntime(value, defaultExecutionMode) {
  if (value === undefined) return { executionMode: defaultExecutionMode }
  if (!record(value)) throw new Error('runtime must be an object')
  const executionMode = value.executionMode ?? defaultExecutionMode
  if (executionMode !== 'chat' && executionMode !== 'agent') throw new Error('runtime.executionMode must be chat or agent')
  const provider = optionalString(value.provider)
  const model = optionalString(value.model)
  if ((provider === undefined) !== (model === undefined)) throw new Error('runtime.provider and runtime.model must be configured together')
  const maxSteps = optionalPositiveInteger(value.maxSteps, 'runtime.maxSteps')
  const writerRoute = value.writerRoute === undefined ? undefined : normalizeWriterRoute(value.writerRoute)
  return {
    executionMode,
    ...(model === undefined ? {} : { provider, model }),
    ...(maxSteps === undefined ? {} : { maxSteps }),
    ...(writerRoute === undefined ? {} : { writerRoute }),
  }
}

function normalizeWriterRoute(value) {
  if (!record(value)) throw new Error('runtime.writerRoute must be an object')
  if (value.kind === 'inherit') {
    if (Object.keys(value).some(key => key !== 'kind')) throw new Error('runtime.writerRoute inherit mode cannot contain fixed model fields')
    return { kind: 'inherit' }
  }
  if (value.kind !== 'fixed') throw new Error('runtime.writerRoute kind must be inherit or fixed')
  const provider = optionalString(value.provider)
  const model = optionalString(value.model)
  const reasoningEffort = optionalString(value.reasoningEffort)
  if (provider === undefined || model === undefined) throw new Error('runtime.writerRoute fixed mode requires provider and model')
  if (Object.keys(value).some(key => !['kind', 'provider', 'model', 'reasoningEffort'].includes(key))) {
    throw new Error('runtime.writerRoute contains unsupported fields')
  }
  return {
    kind: 'fixed', provider, model,
    ...(reasoningEffort === undefined ? {} : { reasoningEffort }),
  }
}

function sameWriterRoute(left, right) {
  if (left === undefined || right === undefined) return left === right
  return left.kind === right.kind
    && left.provider === right.provider
    && left.model === right.model
    && left.reasoningEffort === right.reasoningEffort
}

/** @param {Record<string, unknown>} profile */
/** @param {unknown} value @param {string} field */
function bindingArray(value, field) {
  if (value === undefined) return []
  if (!Array.isArray(value)) throw new Error(`${field} must be a resource binding array`)
  const ids = new Set()
  return value.map(binding => {
    const normalized = resourceBinding(binding, `${field} entries`)
    if (ids.has(normalized.id)) throw new Error(`duplicate ${field} binding ${normalized.id}`)
    ids.add(normalized.id)
    return normalized
  })
}

/** @param {unknown} binding @param {string} field */
function resourceBinding(binding, field) {
  if (!record(binding) || typeof binding.id !== 'string' || binding.id.length === 0) throw new Error(`${field} require an id`)
  if (Object.keys(binding).some(key => key !== 'id')) throw new Error(`${field} must contain only a live asset id`)
  return { id: binding.id }
}

function hasUserMessage(events) {
  return events.some(event => event?.type === 'user/message')
}

function sameBinding(left, right) {
  return left === undefined ? right === undefined : right !== undefined && left.id === right.id
}

async function resolveAssetChanges(ctx, current, changes, requestedOpeningIndex, allowEmpty = false) {
  const allowed = new Set(['cardId', 'lorebookIds', 'personaId', 'presetId', 'writingStyleIds'])
  if ((!allowEmpty && Object.keys(changes).length === 0) || Object.keys(changes).some(key => !allowed.has(key))) {
    throw new RpSessionError('INVALID_REQUEST', 'asset binding changes contain no supported field or an unknown field')
  }
  const currentResources = current.resources
  const cardRequested = has(changes, 'cardId')
  const lorebooksRequested = has(changes, 'lorebookIds')
  const personaRequested = has(changes, 'personaId')
  const presetRequested = has(changes, 'presetId')
  const writingStylesRequested = has(changes, 'writingStyleIds')
  const cardId = cardRequested ? nullableId(changes.cardId, 'cardId') : currentResources.card?.id
  const lorebookIds = lorebooksRequested
    ? uniqueIds(changes.lorebookIds, 'lorebookIds')
    : currentResources.lorebooks.map(item => item.id)
  const personaId = personaRequested ? nullableId(changes.personaId, 'personaId') : currentResources.persona?.id
  const presetId = presetRequested ? nullableId(changes.presetId, 'presetId') : currentResources.preset?.id
  const writingStyleIds = writingStylesRequested
    ? uniqueIds(changes.writingStyleIds, 'writingStyleIds')
    : currentResources.writingStyles.map(item => item.id)

  const cardNeedsResolution = cardId !== undefined
    && (cardRequested || (requestedOpeningIndex !== undefined && !allowEmpty))
  const cards = service(ctx, 'rpCharacterCards', cardNeedsResolution)
  const lorebooks = service(ctx, 'rpLoreBooks', lorebooksRequested && lorebookIds.length > 0)
  const personas = service(ctx, 'rpPersonas', personaRequested && personaId !== undefined)
  const presets = service(ctx, 'rpPresets', presetRequested && presetId !== undefined)
  const writingStyles = service(ctx, 'rpWritingStyles', writingStylesRequested && writingStyleIds.length > 0)
  let cardValue
  let card = currentResources.card
  if (cardRequested && cardId === undefined) card = undefined
  else if (cardNeedsResolution) {
    cardValue = await cards.get(cardId)
    card = { id: cardValue.id }
  }
  let resolvedLorebooks = currentResources.lorebooks
  if (lorebooksRequested) {
    resolvedLorebooks = []
    for (const id of lorebookIds) resolvedLorebooks.push({ id: (await lorebooks.get(id)).id })
  }
  let persona = currentResources.persona
  if (personaRequested) persona = personaId === undefined ? undefined : { id: (await personas.get(personaId)).id }
  let preset = currentResources.preset
  if (presetRequested) preset = presetId === undefined ? undefined : await presets.resolveBinding(presetId)
  const resolvedStyles = writingStylesRequested
    ? writingStyleIds.length === 0 ? [] : await writingStyles.resolveBindings(writingStyleIds)
    : currentResources.writingStyles

  const cardChanged = card?.id !== currentResources.card?.id
  const openingIndex = requestedOpeningIndex === undefined
    ? cardChanged ? 0 : current.scene.openingIndex ?? 0
    : normalizeOpeningIndex(requestedOpeningIndex)
  let openingText
  if (cardValue !== undefined && (cardChanged || openingIndex !== (current.scene.openingIndex ?? 0))) {
    openingText = openingFromCharacter(cardValue, openingIndex)
  }
  return {
    ...(card === undefined ? {} : { card }),
    lorebooks: resolvedLorebooks,
    ...(persona === undefined ? {} : { persona }),
    ...(preset === undefined ? {} : { preset }),
    writingStyles: resolvedStyles,
    openingIndex,
    ...(openingText === undefined ? cardChanged && cardValue === undefined ? { openingSource: 'skip' } : {} : { openingText, openingSource: 'card' }),
  }
}

function openingFromCharacter(character, openingIndex) {
  const openings = [character.firstMessage, ...(Array.isArray(character.alternateGreetings) ? character.alternateGreetings : [])]
  if (openingIndex >= openings.length) {
    throw new RpSessionError('INVALID_REQUEST', `openingIndex ${openingIndex} exceeds the card's ${openings.length} openings`)
  }
  const opening = openings[openingIndex]
  return typeof opening === 'string' && opening.trim().length > 0
    ? opening.trim()
    : '故事舞台已经准备好。写下你的第一个行动、对白或问题。'
}

function service(ctx, name, required) {
  const value = ctx.get?.(name) ?? ctx[name]
  if (value === undefined && required) throw new RpSessionError('ASSET_SERVICE_UNAVAILABLE', `${name} is unavailable`)
  return value
}

function nullableId(value, field) {
  if (value === null) return undefined
  if (typeof value !== 'string' || value.length === 0) throw new RpSessionError('INVALID_REQUEST', `${field} must be a non-empty asset id or null`)
  return value
}

function uniqueIds(value, field) {
  if (!Array.isArray(value) || value.some(id => typeof id !== 'string' || id.length === 0)) {
    throw new RpSessionError('INVALID_REQUEST', `${field} must be an asset id array`)
  }
  if (new Set(value).size !== value.length) throw new RpSessionError('INVALID_REQUEST', `${field} contains duplicate ids`)
  return value
}

function has(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key)
}

export class RpSessionError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'RpSessionError'
    this.code = code
  }
}

function optionalPositiveInteger(value, field) {
  if (value === undefined) return undefined
  if (!Number.isSafeInteger(value) || value < 1) throw new Error(`${field} must be a positive integer`)
  return value
}

/** @param {unknown} value */
function optionalString(value) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
}

function normalizeContextBuild(value) {
  if (!record(value) || value.version !== RP_CONTEXT_BUILD_VERSION || !Array.isArray(value.slots) || value.slots.length > MAX_CONTEXT_SLOTS) {
    throw new Error(`contextBuild must contain version ${RP_CONTEXT_BUILD_VERSION} and at most ${MAX_CONTEXT_SLOTS} slots`)
  }
  if (value.sectionTags !== undefined && typeof value.sectionTags !== 'boolean') {
    throw new Error('contextBuild sectionTags must be a boolean')
  }
  const legacySectionTag = value.sectionTags ?? true
  const slotIds = new Set()
  const sourceIds = new Set()
  const slots = value.slots.map((slot, index) => {
    if (!record(slot) || typeof slot.id !== 'string' || !/^[a-z0-9][a-z0-9._:-]*$/.test(slot.id) || slotIds.has(slot.id)) {
      throw new Error(`contextBuild slot ${index} has an invalid or duplicate id`)
    }
    slotIds.add(slot.id)
    if (typeof slot.label !== 'string' || slot.label.trim().length === 0 || [...slot.label.trim()].length > 80) {
      throw new Error(`contextBuild slot "${slot.id}" requires a label of at most 80 characters`)
    }
    if (slot.idle !== undefined && typeof slot.idle !== 'boolean') throw new Error(`contextBuild slot "${slot.id}" idle must be a boolean`)
    if (slot.sectionTag !== undefined && typeof slot.sectionTag !== 'boolean') throw new Error(`contextBuild slot "${slot.id}" sectionTag must be a boolean`)
    if (!Array.isArray(slot.sourceIds) || slot.sourceIds.length > 128) throw new Error(`contextBuild slot "${slot.id}" sourceIds is invalid`)
    for (const sourceId of slot.sourceIds) {
      if (typeof sourceId !== 'string' || sourceIds.has(sourceId)) throw new Error(`contextBuild source "${String(sourceId)}" is invalid or duplicated`)
      sourceIds.add(sourceId)
    }
    return {
      id: slot.id,
      label: slot.label.trim(),
      sourceIds: [...slot.sourceIds],
      ...(slot.locked === true ? { locked: true } : {}),
      ...(slot.idle === true ? { idle: true } : {}),
      sectionTag: slot.sectionTag ?? legacySectionTag,
    }
  })
  const customSources = normalizeCustomContextSources({ ...value, slots })
  return {
    version: RP_CONTEXT_BUILD_VERSION,
    slots,
    ...(customSources.length === 0 ? {} : { customSources }),
  }
}

/** @param {unknown} value */
function record(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function validateStateBootstrapPartitions(namespaces) {
  const ids = new Set()
  for (const item of namespaces) {
    if (!record(item) || typeof item.namespace !== 'string' || !/^[a-z0-9][a-z0-9._:-]{0,127}$/u.test(item.namespace) || ids.has(item.namespace)) {
      throw new RpSessionError('INVALID_MATERIALIZATION', `State bootstrap contains an invalid or duplicate namespace "${String(item?.namespace)}".`)
    }
    ids.add(item.namespace)
  }
}
