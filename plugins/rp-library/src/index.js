import Schema from '@deepseek-ai/schemastery'
import { MAX_OPENING_CHARACTERS } from 'dsh-roleplay-rp-session/protocol'
import { deleteCharacter, previewCharacterDeletion, withCharacterLifecycle } from './deletion.js'
import { createRoleplaySession, RpSessionBootstrap } from './session-bootstrap.js'

export const name = 'rp-library'
export const inject = ['rpRemote', 'typert', 'agentPresets', 'agents', 'sessions', 'sessionPersistence', 'workspaceRegistry']
export const Config = Schema.object({
  agentPreset: Schema.string().default('roleplay'),
  defaultMode: Schema.union(['adaptive', 'actor', 'director']).default('adaptive'),
  defaultExecutionMode: Schema.union(['chat', 'agent']).default('chat'),
  maxProfileCommandBytes: Schema.number().default(262144),
})

const ENDPOINTS = new Set([
  'capabilities',
  'session/create',
  'session/bind',
  'session/execution-mode',
  'session/context-build',
  'session/context-build-preview',
  'character/delete-preview',
  'character/delete',
])

export function apply(ctx, config) {
  new RpSessionBootstrap(ctx)
  const dispose = ctx.rpRemote.register('/rp-assets', async (endpoint, payload, signal) => {
    if (!ENDPOINTS.has(endpoint)) return transportSuccess(failure('INVALID_REQUEST', `Unknown RP asset endpoint: ${endpoint}`))
    try {
      return transportSuccess(success(await dispatch(ctx, endpoint, payload, signal, config)))
    } catch (error) {
      return transportSuccess(failure(codeFor(error), error instanceof Error ? error.message : String(error)))
    }
  })
  ctx.effect(() => dispose, 'rp-library: /rp-assets Remote')
}

export async function dispatch(ctx, endpoint, payload, signal, config = defaultConfig()) {
  const input = object(payload)
  switch (endpoint) {
    case 'capabilities': return assetCapabilities(ctx)
    case 'session/create': {
      const operation = () => createRoleplaySession(ctx, input, config, signal)
      return input.cardId == null ? operation() : withCharacterLifecycle(input.cardId, operation)
    }
    case 'session/bind': return bindSession(ctx, input)
    case 'session/execution-mode': return setExecutionMode(ctx, input)
    case 'session/context-build': return setContextBuild(ctx, input)
    case 'session/context-build-preview': return previewContextBuild(ctx, input)
    case 'character/delete-preview':
      requireAssetService(ctx, 'rpCharacterCards')
      return previewCharacterDeletion(ctx, requiredId(input.id), signal)
    case 'character/delete':
      requireAssetService(ctx, 'rpCharacterCards')
      return deleteCharacter(ctx, requiredId(input.id), requiredBoolean(input.deleteLinkedLorebooks, 'deleteLinkedLorebooks'), signal)
    default: throw coded('INVALID_REQUEST', `Unknown RP asset endpoint: ${endpoint}`)
  }
}

async function setContextBuild(ctx, input) {
  sessionRequest(input)
  const agent = await resolveRoleplayAgent(ctx, input.sessionId)
  const sessions = ctx.agentPresets.serviceFor(agent, 'rpSessions')
  if (sessions === undefined) throw coded('NOT_RP_SESSION', 'The selected session has no Roleplay session service.')
  return sessions.setContextBuild(agent, { expectedRevision: input.expectedRevision, contextBuild: input.contextBuild })
}

async function previewContextBuild(ctx, input) {
  if (typeof input.sessionId !== 'string' || input.sessionId.length === 0) throw coded('INVALID_REQUEST', 'sessionId is required')
  const agent = await resolveRoleplayAgent(ctx, input.sessionId)
  const runtime = ctx.agentPresets.serviceFor(agent, 'rpRuntime')
  if (runtime === undefined) throw coded('NOT_RP_SESSION', 'The selected session has no Roleplay runtime service.')
  return runtime.previewContextBuild(agent)
}

async function setExecutionMode(ctx, input) {
  sessionRequest(input)
  if (input.executionMode !== 'chat' && input.executionMode !== 'agent') throw coded('INVALID_REQUEST', 'executionMode must be chat or agent')
  const agent = await resolveRoleplayAgent(ctx, input.sessionId)
  const sessions = ctx.agentPresets.serviceFor(agent, 'rpSessions')
  if (sessions === undefined) throw coded('NOT_RP_SESSION', 'The selected session has no Roleplay session service.')
  return sessions.setExecutionMode(agent, {
    expectedRevision: input.expectedRevision,
    executionMode: input.executionMode,
  })
}

function sessionRequest(input) {
  if (typeof input.sessionId !== 'string' || input.sessionId.length === 0) throw coded('INVALID_REQUEST', 'sessionId is required')
  if (!Number.isSafeInteger(input.expectedRevision) || input.expectedRevision < 0) throw coded('INVALID_REQUEST', 'expectedRevision must be a non-negative integer')
}

async function bindSession(ctx, input) {
  if (typeof input.sessionId !== 'string' || input.sessionId.length === 0) throw coded('INVALID_REQUEST', 'sessionId is required')
  if (!Number.isSafeInteger(input.expectedRevision) || input.expectedRevision < 0) throw coded('INVALID_REQUEST', 'expectedRevision must be a non-negative integer')
  if (input.cardId !== null && input.cardId !== undefined && typeof input.cardId !== 'string') throw coded('INVALID_REQUEST', 'cardId must be a string or null')
  if (input.personaId !== null && input.personaId !== undefined && typeof input.personaId !== 'string') throw coded('INVALID_REQUEST', 'personaId must be a string or null')
  if (input.presetId !== null && input.presetId !== undefined && typeof input.presetId !== 'string') throw coded('INVALID_REQUEST', 'presetId must be a string or null')
  if (input.writingStyleIds !== undefined && (!Array.isArray(input.writingStyleIds) || input.writingStyleIds.some(id => typeof id !== 'string'))) throw coded('INVALID_REQUEST', 'writingStyleIds must be a string array')
  if (input.writingStyleIds !== undefined && new Set(input.writingStyleIds).size !== input.writingStyleIds.length) throw coded('INVALID_REQUEST', 'writingStyleIds contains duplicates')
  if (input.openingText !== undefined && input.openingText !== null && typeof input.openingText !== 'string') throw coded('INVALID_REQUEST', 'openingText must be a string or null')
  if (typeof input.openingText === 'string' && [...input.openingText].length > MAX_OPENING_CHARACTERS) throw coded('LIMIT_EXCEEDED', `openingText must not exceed ${MAX_OPENING_CHARACTERS} characters`)
  if (input.openingSource !== undefined && !['card', 'custom', 'skip'].includes(input.openingSource)) throw coded('INVALID_REQUEST', 'openingSource must be card, custom, or skip')
  if (input.openingIndex !== undefined && (!Number.isSafeInteger(input.openingIndex) || input.openingIndex < 0)) throw coded('INVALID_REQUEST', 'openingIndex must be a non-negative integer')
  if (input.lorebookIds !== undefined && (!Array.isArray(input.lorebookIds) || input.lorebookIds.some(id => typeof id !== 'string'))) throw coded('INVALID_REQUEST', 'lorebookIds must be a string array')
  if (input.lorebookIds !== undefined && new Set(input.lorebookIds).size !== input.lorebookIds.length) throw coded('INVALID_REQUEST', 'lorebookIds contains duplicates')
  const operation = async () => {
    const agent = await resolveRoleplayAgent(ctx, input.sessionId)
    const sessions = ctx.agentPresets.serviceFor(agent, 'rpSessions')
    if (sessions === undefined) throw coded('NOT_RP_SESSION', 'The selected session has no Roleplay session service.')
    return sessions.bindAssetChanges(agent, {
      expectedRevision: input.expectedRevision,
      changes: {
        ...(has(input, 'cardId') ? { cardId: input.cardId } : {}),
        ...(has(input, 'lorebookIds') ? { lorebookIds: input.lorebookIds } : {}),
        ...(has(input, 'personaId') ? { personaId: input.personaId } : {}),
        ...(has(input, 'presetId') ? { presetId: input.presetId } : {}),
        ...(input.writingStyleIds === undefined ? {} : { writingStyleIds: input.writingStyleIds }),
      },
      ...(input.openingIndex === undefined ? {} : { openingIndex: input.openingIndex }),
      ...(input.openingSource === undefined ? {} : { openingSource: input.openingSource }),
      ...(input.openingText === undefined ? {} : { openingText: input.openingText }),
    })
  }
  return input.cardId == null ? operation() : withCharacterLifecycle(input.cardId, operation)
}

async function resolveRoleplayAgent(ctx, sessionId) {
  const provider = ctx.typert.lookups.get('agent')
  if (provider === undefined) throw coded('NOT_RP_SESSION', 'Agent lookup is unavailable.')
  let agent
  try { agent = await provider.resolve(sessionId) } catch (error) { throw coded('ASSET_NOT_FOUND', `Session ${sessionId} was not found.`, error) }
  if (roleplayPreset(agent.session) !== 'roleplay') throw coded('NOT_RP_SESSION', 'The selected session is not a Roleplay session.')
  return agent
}

function roleplayPreset(session) {
  let selected = session.header?.agentPreset
  for (const event of session.events ?? []) if (event?.type === 'agent-preset/selected') selected = event.data?.agentPreset
  return selected
}

function assetCapabilities(ctx) {
  return {
    characters: optionalService(ctx, 'rpCharacterCards') !== undefined,
    lorebooks: optionalService(ctx, 'rpLoreBooks') !== undefined,
    personas: optionalService(ctx, 'rpPersonas') !== undefined,
    presets: optionalService(ctx, 'rpPresets') !== undefined,
    writingStyles: optionalService(ctx, 'rpWritingStyles') !== undefined,
    state: optionalService(ctx, 'rpFeatures')?.isEnabled?.('state') === true,
  }
}

function optionalService(ctx, name) { return typeof ctx.get === 'function' ? ctx.get(name) : ctx[name] }
function requireAssetService(ctx, name) {
  const value = optionalService(ctx, name)
  if (value === undefined) throw coded('ASSET_SERVICE_UNAVAILABLE', 'The requested Roleplay material capability is not enabled.')
  return value
}
function has(value, key) { return Object.prototype.hasOwnProperty.call(value, key) }

function object(value) { if (typeof value !== 'object' || value === null || Array.isArray(value)) throw coded('INVALID_REQUEST', 'request payload must be an object'); return value }
function requiredId(value) { if (typeof value !== 'string' || !/^[0-9a-f-]{36}$/.test(value)) throw coded('INVALID_REQUEST', 'asset id is invalid'); return value }
function requiredBoolean(value, name) { if (typeof value !== 'boolean') throw coded('INVALID_REQUEST', `${name} must be a boolean`); return value }
function success(value) { return { ok: true, value } }
function failure(code, message) { return { ok: false, error: { code, message } } }
function transportSuccess(value) { return { ok: true, value } }
function coded(code, message, cause) { const error = new Error(message, { cause }); error.code = code; return error }

function codeFor(error) {
  const known = new Set(['INVALID_REQUEST', 'LIMIT_EXCEEDED', 'UNSUPPORTED_FORMAT', 'DUPLICATE_ASSET', 'ASSET_CORRUPT', 'ASSET_NOT_FOUND', 'NOT_RP_SESSION', 'SESSION_RUNNING', 'REVISION_CONFLICT', 'COMMAND_FAILED', 'PROFILE_TOO_LARGE', 'WORKSPACE_ATTACH_FAILED', 'OPENING_LOCKED', 'OPENING_REQUIRES_SEEDED_CREATE', 'CARD_REQUIRED', 'STYLE_PLUGIN_UNAVAILABLE', 'ASSET_SERVICE_UNAVAILABLE', 'RP_INVALID_CONTEXT_BUILD', 'RP_CONTEXT_SLOT_LIMIT', 'RP_CONTEXT_SOURCE_NOT_FOUND', 'RP_CONTEXT_SOURCE_LOCKED', 'RP_CONTEXT_SOURCE_REQUIRED'])
  if (known.has(error?.code)) return error.code
  if (error?.code === 'DUPLICATE_CARD') return 'DUPLICATE_ASSET'
  if (error?.code === 'CARD_TEXT_LIMIT_EXCEEDED') return 'LIMIT_EXCEEDED'
  if (['UNSUPPORTED_FORMAT', 'INVALID_PATH'].includes(error?.code)) return 'UNSUPPORTED_FORMAT'
  if (typeof error?.code === 'string' && (error.code.startsWith('INVALID_') || error.code.endsWith('_NOT_FOUND'))) return 'ASSET_CORRUPT'
  return 'ASSET_CORRUPT'
}

function defaultConfig() {
  return { agentPreset: 'roleplay', defaultMode: 'adaptive', defaultExecutionMode: 'chat', maxProfileCommandBytes: 262144 }
}
