import { randomUUID } from 'node:crypto'
import { Service } from '@deepseek-ai/cordis'
import { createAssistantMessage } from '@deepseek-ai/dsh-llm/message'
import { SessionId } from '@deepseek-ai/dsh-session'
import { expandRoleplayMacros } from 'dsh-roleplay-rp-macro/syntax'
import { normalizeProfile } from 'dsh-roleplay-rp-session'
import {
  MAX_OPENING_CHARACTERS,
  OPENING_MESSAGE_MODEL,
  OPENING_MESSAGE_PROVIDER,
  RP_SESSION_APPLY_COMMAND,
  encodeSessionCommand,
} from 'dsh-roleplay-rp-session/protocol'

const PLAYER_CHARACTER_ID = 'rp.player'

/** Ordered Host-side materializers for the profile and opening committed before Agent construction. */
export class RpSessionBootstrap extends Service {
  constructor(ctx) {
    super(ctx, 'rpSessionBootstrap')
    this.materializers = new Map()
  }

  registerMaterializer(definition) {
    if (!definition || typeof definition !== 'object' || typeof definition.id !== 'string' || definition.id.length === 0 || typeof definition.prepare !== 'function') {
      throw new Error('session bootstrap materializer requires a non-empty id and prepare function')
    }
    if (this.materializers.has(definition.id)) throw new Error(`session bootstrap materializer "${definition.id}" is already registered`)
    this.materializers.set(definition.id, definition)
    const dispose = this.ctx.effect(() => () => {
      if (this.materializers.get(definition.id) === definition) this.materializers.delete(definition.id)
    }, `rpSessionBootstrap.registerMaterializer(${definition.id})`)
    return () => void dispose()
  }

  async materialize(context) {
    let profile = context.profile
    let openingMessageText = profile.scene.openingText
    const stateBootstrapNamespaces = []
    let stateBootstrapVersion
    let stateBootstrapRequested = false
    for (const definition of [...this.materializers.values()].sort((left, right) => (left.order ?? 0) - (right.order ?? 0) || left.id.localeCompare(right.id))) {
      const value = await definition.prepare({ ...context, profile, openingMessageText })
      if (value === undefined) continue
      if (Object.prototype.hasOwnProperty.call(value, 'stateBootstrap')) {
        if (!record(value.stateBootstrap) || value.stateBootstrap.version !== 2 || !Array.isArray(value.stateBootstrap.namespaces)) {
          throw new Error(`session bootstrap materializer "${definition.id}" returned an invalid stateBootstrap`)
        }
        if (stateBootstrapVersion !== undefined && stateBootstrapVersion !== value.stateBootstrap.version) {
          throw new Error('session bootstrap materializers returned incompatible State versions')
        }
        stateBootstrapVersion = value.stateBootstrap.version
        stateBootstrapNamespaces.push(...value.stateBootstrap.namespaces)
        stateBootstrapRequested = true
      }
      if (Object.prototype.hasOwnProperty.call(value, 'openingMessageText')) {
        openingMessageText = normalizeOpeningMessageText(value.openingMessageText)
      }
    }
    if (stateBootstrapRequested) validateStateBootstrapPartitions(stateBootstrapNamespaces)
    return {
      profile: {
        ...profile,
        ...(stateBootstrapRequested ? { stateBootstrap: { version: stateBootstrapVersion, namespaces: stateBootstrapNamespaces } } : {}),
      },
      openingMessageText,
    }
  }
}

/**
 * Resolve live RP assets and create a complete Session seed before the Agent
 * exists. This is the only supported source of a session's first opening
 * message; later profile writes may edit that message but never create it.
 */
export async function createRoleplaySession(ctx, input, config, signal) {
  const sourceSessionId = requiredSourceSessionId(input.sourceSessionId)
  const workspace = sourceWorkspace(ctx, sourceSessionId)
  const prepared = await prepareRoleplaySeed(ctx, input, config)
  const sessionId = SessionId(`session-${randomUUID()}`)
  await ctx.agents.create({
    sessionId,
    seed: prepared.seed,
    meta: {
      agentPreset: config.agentPreset,
      ...(workspace === undefined ? {} : { cwd: workspace.path }),
    },
    signal,
    setup: agentCtx => ctx.agentPresets.mount(agentCtx, config.agentPreset).then(() => undefined),
  })
  if (workspace !== undefined) {
    try {
      await workspace.attachSession(sessionId)
    } catch (error) {
      throw coded('WORKSPACE_ATTACH_FAILED', `Roleplay session ${sessionId} was created but could not join its source workspace.`, error)
    }
  }
  return { sessionId, profile: prepared.profile }
}

/** Resolve user selections and build the immutable initial Session event log. */
export async function prepareRoleplaySeed(ctx, input, config) {
  input = normalizeCreateInput(input)
  validateCreateInput(input)
  const cards = service(ctx, 'rpCharacterCards', input.cardId !== null)
  const lorebooks = service(ctx, 'rpLoreBooks', input.lorebookIds.length > 0)
  const personas = service(ctx, 'rpPersonas', input.personaId !== null)
  const presets = service(ctx, 'rpPresets', input.presetId !== null)
  const styles = service(ctx, 'rpWritingStyles', input.writingStyleIds !== undefined)

  const character = input.cardId === null ? undefined : await cards.get(input.cardId)
  const books = []
  for (const id of input.lorebookIds) books.push(await lorebooks.get(id))
  const persona = input.personaId === null ? undefined : await personas.get(input.personaId)
  const preset = input.presetId === null ? undefined : await presets.resolveBinding(input.presetId)
  const writingStyles = input.writingStyleIds === undefined ? [] : await styles.resolveBindings(input.writingStyleIds)

  const scene = { openingIndex: input.openingIndex, openingSource: input.openingSource }
  if (typeof input.openingText === 'string') {
    scene.openingText = input.openingText
    scene.openingAnchorRevision = 1
  }
  const participant = config.defaultMode === 'director'
    ? {}
    : {
        playerCharacterId: PLAYER_CHARACTER_ID,
        cast: [{ characterId: PLAYER_CHARACTER_ID, controller: 'user' }],
      }
  let profile = normalizeProfile({
    mode: config.defaultMode,
    ...participant,
    scene,
    resources: {
      ...(character === undefined ? {} : { card: { id: character.id } }),
      lorebooks: books.map(book => ({ id: book.id })),
      ...(persona === undefined ? {} : { persona: { id: persona.id } }),
      ...(preset === undefined ? {} : { preset }),
      writingStyles,
    },
    runtime: { executionMode: config.defaultExecutionMode },
  }, 0, config.defaultExecutionMode)

  const bootstrap = ctx.get?.('rpSessionBootstrap') ?? ctx.rpSessionBootstrap
  const materialized = bootstrap === undefined
    ? {
        profile,
        openingMessageText: profile.scene.openingText,
      }
    : await bootstrap.materialize({ character, books, profile })
  profile = materialized.profile
  const rawInput = encodeSessionCommand(0, profile)
  if (Buffer.byteLength(rawInput, 'utf8') > config.maxProfileCommandBytes) {
    throw coded('PROFILE_TOO_LARGE', `Roleplay session profile command exceeds ${config.maxProfileCommandBytes} UTF-8 bytes.`)
  }
  const expandedOpening = materialized.openingMessageText === undefined
    ? undefined
    : expandRoleplayMacros(materialized.openingMessageText, {
        userName: persona?.name,
        characterName: character?.name,
      })
  return { profile, seed: buildRoleplaySessionSeed(profile, rawInput, expandedOpening) }
}

function normalizeCreateInput(input) {
  if (!record(input)) return input
  return {
    ...input,
    cardId: input.cardId ?? null,
    lorebookIds: input.lorebookIds ?? [],
    personaId: input.personaId ?? null,
    presetId: input.presetId ?? null,
    openingIndex: input.openingIndex ?? 0,
    openingSource: input.openingSource ?? 'skip',
    openingText: input.openingText ?? null,
  }
}

/** Build one balanced, contiguous seed accepted by the Harness Session boundary. */
export function buildRoleplaySessionSeed(profile, rawInput, expandedOpening, startTime = Date.now()) {
  const commandId = `cmd-rp-bootstrap-${randomUUID()}`
  const seed = [
    envelope('command/run', 0, startTime, {
      commandId,
      name: RP_SESSION_APPLY_COMMAND,
      args: rawInput,
      source: { kind: 'user' },
    }),
    envelope('command/done', 1, startTime + 1, {
      commandId,
      kind: 'success',
      text: `Roleplay session revision ${profile.revision} configured.`,
    }),
  ]
  if (expandedOpening === undefined) return seed
  const message = createAssistantMessage({
    content: [{ type: 'text', text: expandedOpening }],
    source: {
      provider: OPENING_MESSAGE_PROVIDER,
      model: OPENING_MESSAGE_MODEL,
      profileRevision: profile.revision,
      openingAnchorRevision: profile.scene.openingAnchorRevision ?? profile.revision,
    },
  })
  seed.push(
    envelope('turn/start', 2, startTime + 2, { turn: 1 }),
    envelope('step/start', 3, startTime + 3, { turn: 1, step: 1 }),
    {
      ...envelope('assistant/message', 4, startTime + 4, { turn: 1, step: 1, message }),
      surfaceOp: 'append',
      sourceEventSeqs: [],
    },
    envelope('step/end', 5, startTime + 5, { turn: 1, step: 1 }),
    envelope('turn/end', 6, startTime + 6, { turn: 1, reason: { kind: 'completed' } }),
  )
  return seed
}

function validateCreateInput(input) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) throw coded('INVALID_REQUEST', 'request payload must be an object')
  for (const field of ['cardId', 'personaId', 'presetId']) {
    if (input[field] !== null && typeof input[field] !== 'string') throw coded('INVALID_REQUEST', `${field} must be a string or null`)
  }
  if (!Array.isArray(input.lorebookIds) || input.lorebookIds.some(id => typeof id !== 'string')) throw coded('INVALID_REQUEST', 'lorebookIds must be a string array')
  if (new Set(input.lorebookIds).size !== input.lorebookIds.length) throw coded('INVALID_REQUEST', 'lorebookIds contains duplicates')
  if (input.writingStyleIds !== undefined && (!Array.isArray(input.writingStyleIds) || input.writingStyleIds.some(id => typeof id !== 'string'))) throw coded('INVALID_REQUEST', 'writingStyleIds must be a string array')
  if (input.writingStyleIds !== undefined && new Set(input.writingStyleIds).size !== input.writingStyleIds.length) throw coded('INVALID_REQUEST', 'writingStyleIds contains duplicates')
  if (!Number.isSafeInteger(input.openingIndex) || input.openingIndex < 0) throw coded('INVALID_REQUEST', 'openingIndex must be a non-negative integer')
  if (!['card', 'custom', 'skip'].includes(input.openingSource)) throw coded('INVALID_REQUEST', 'openingSource must be card, custom, or skip')
  if (input.openingText !== null && typeof input.openingText !== 'string') throw coded('INVALID_REQUEST', 'openingText must be a string or null')
  if (input.openingSource === 'skip' && input.openingText !== null) throw coded('INVALID_REQUEST', 'skipped openings require null openingText')
  if (input.openingSource !== 'skip' && typeof input.openingText !== 'string') throw coded('INVALID_REQUEST', 'card and custom openings require openingText')
  if (typeof input.openingText === 'string') {
    const characters = [...input.openingText.trim()].length
    if (characters < 1) throw coded('INVALID_REQUEST', 'openingText must not be empty')
    if (characters > MAX_OPENING_CHARACTERS) throw coded('LIMIT_EXCEEDED', `openingText must not exceed ${MAX_OPENING_CHARACTERS} characters`)
  }
}

function normalizeOpeningMessageText(value) {
  if (value === null || value === undefined || (typeof value === 'string' && value.trim().length === 0)) {
    return undefined
  }
  if (typeof value !== 'string') throw new Error('session bootstrap materializer openingMessageText must be a string or null')
  const openingText = value.replaceAll('\r\n', '\n').replaceAll('\r', '\n').trim()
  if ([...openingText].length > MAX_OPENING_CHARACTERS) throw coded('LIMIT_EXCEEDED', `openingText must not exceed ${MAX_OPENING_CHARACTERS} characters`)
  return openingText
}

function requiredSourceSessionId(value) {
  if (typeof value !== 'string' || value.length === 0) throw coded('INVALID_REQUEST', 'sourceSessionId is required')
  return value
}

function sourceWorkspace(ctx, sourceSessionId) {
  const registry = ctx.get?.('workspaceRegistry') ?? ctx.workspaceRegistry
  if (registry === undefined) throw new Error('workspaceRegistry is unavailable')
  return registry.list().find(workspace => workspace.sessionIds.includes(sourceSessionId))
}

function service(ctx, name, required) {
  const value = ctx.get?.(name) ?? ctx[name]
  if (value === undefined && required) throw coded('ASSET_SERVICE_UNAVAILABLE', `${name} is unavailable`)
  return value
}

function record(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function validateStateBootstrapPartitions(namespaces) {
  const ids = new Set()
  for (const item of namespaces) {
    if (!record(item) || typeof item.namespace !== 'string' || !/^[a-z0-9][a-z0-9._:-]{0,127}$/u.test(item.namespace) || ids.has(item.namespace)) {
      throw new Error(`State bootstrap contains an invalid or duplicate namespace "${String(item?.namespace)}".`)
    }
    ids.add(item.namespace)
  }
}

function envelope(type, seq, time, data) {
  return { type, seq, time, data }
}

function coded(code, message, cause) {
  const error = new Error(message, { cause })
  error.code = code
  return error
}
