import {
  normalizeNamespaceId,
  normalizeSetupDiagnostics,
  normalizeStateDefinition,
  RP_STATE_PROTOCOL_VERSION,
} from './definition.js'
import { normalizeJson, validateStateValue } from './schema.js'

/** Native command used for explicit Session-owned State configuration. */
export const RP_STATE_CONFIGURE_COMMAND = 'rp-state-configure'

/** Model-facing read-only State tool. */
export const RP_STATE_READ_TOOL = 'rp_state_read'

/** Agent-mode State configuration tool. */
export const RP_STATE_TOOL = 'rp_state'

/** Current State command payload version. */
export const RP_STATE_COMMAND_VERSION = 3

/** Return empty pending command state. */
export function emptyStateCommandState() {
  return { owners: [], pending: [] }
}

/** Encode one already validated canonical configuration mutation. */
export function encodeStateCommand(mutation, owner) {
  return ` ${JSON.stringify({
    version: RP_STATE_COMMAND_VERSION,
    owner: normalizeStateCommandOwner(owner),
    ...normalizeStateConfigurationMutation(mutation),
  })}`
}

/** Decode one durable State configuration command. */
export function decodeStateCommandInput(value) {
  if (typeof value !== 'string') throw new Error('State command input must be a string.')
  let decoded
  try { decoded = JSON.parse(value.trim()) } catch { throw new Error('State command input must be valid JSON.') }
  if (!record(decoded) || decoded.version !== RP_STATE_COMMAND_VERSION) throw new Error(`State command version must be ${RP_STATE_COMMAND_VERSION}.`)
  const allowed = ['version', 'owner', 'action', 'namespace', 'expectedRevision', ...(decoded.action === 'delete' ? [] : ['result'])]
  exactRecord(decoded, allowed, 'State command')
  const owner = normalizeStateCommandOwner(decoded.owner)
  const mutation = normalizeStateConfigurationMutation({
    action: decoded.action,
    namespace: decoded.namespace,
    expectedRevision: decoded.expectedRevision,
    ...(decoded.action === 'delete' ? {} : { result: decoded.result }),
  })
  return {
    version: RP_STATE_COMMAND_VERSION,
    owner,
    ...mutation,
  }
}

/** Validate and clone one canonical assistant-tool owner. */
export function normalizeStateCommandOwner(value) {
  exactRecord(value, ['kind', 'tool', 'callId', 'assistant'], 'State command owner')
  if (value.kind !== 'assistant-tool') throw new Error('State command owner kind must be assistant-tool.')
  if (value.tool !== RP_STATE_TOOL) throw new Error(`State command owner tool must be ${RP_STATE_TOOL}.`)
  if (typeof value.callId !== 'string' || value.callId.length === 0) throw new Error('State command owner callId must be non-empty.')
  exactRecord(value.assistant, ['seq', 'messageId', 'turn', 'step'], 'State command assistant owner')
  if (!Number.isSafeInteger(value.assistant.seq) || value.assistant.seq < 0) throw new Error('State command assistant seq must be a non-negative safe integer.')
  if (typeof value.assistant.messageId !== 'string' || value.assistant.messageId.length === 0) throw new Error('State command assistant messageId must be non-empty.')
  if (!Number.isSafeInteger(value.assistant.turn) || value.assistant.turn < 0) throw new Error('State command assistant turn must be a non-negative safe integer.')
  if (!Number.isSafeInteger(value.assistant.step) || value.assistant.step < 0) throw new Error('State command assistant step must be a non-negative safe integer.')
  return {
    kind: 'assistant-tool',
    tool: RP_STATE_TOOL,
    callId: value.callId,
    assistant: {
      seq: value.assistant.seq,
      messageId: value.assistant.messageId,
      turn: value.assistant.turn,
      step: value.assistant.step,
    },
  }
}

/** Validate and clone one canonical State configuration mutation. */
export function normalizeStateConfigurationMutation(value) {
  if (!record(value) || !['create', 'update', 'reset', 'delete'].includes(value.action)) throw new Error('State command action is invalid.')
  exactRecord(value, ['action', 'namespace', 'expectedRevision', ...(value.action === 'delete' ? [] : ['result'])], 'State configuration mutation')
  const namespace = normalizeNamespaceId(value.namespace)
  if (!Number.isSafeInteger(value.expectedRevision) || value.expectedRevision < 0) throw new Error('State command expectedRevision must be a non-negative safe integer.')
  if (value.action !== 'delete' && (!validNamespaceSnapshot(value.result) || value.result.revision !== value.expectedRevision + 1)) {
    throw new Error('State command result must be the complete next namespace revision.')
  }
  return {
    action: value.action,
    namespace,
    expectedRevision: value.expectedRevision,
    ...(value.action === 'delete' ? {} : { result: normalizeCommandResult(value.result) }),
  }
}

/** Fold State tool/command lifecycle and expose one mutation only after success. */
export function applyStateCommandEvent(state, event) {
  if (!record(event) || !record(event.data)) return { state }

  const discovered = stateToolCallOwners(event)
  if (discovered.length > 0) {
    const ids = new Set(state.owners.map(item => item.owner.callId))
    for (const item of discovered) {
      if (ids.has(item.owner.callId)) throw new Error(`State tool call ${JSON.stringify(item.owner.callId)} is duplicated.`)
      ids.add(item.owner.callId)
    }
    return { state: { ...state, owners: [...state.owners, ...discovered] } }
  }

  if (event.type === 'tool/call') {
    const callId = event.data.callId
    const index = typeof callId === 'string'
      ? state.owners.findIndex(item => item.owner.callId === callId)
      : -1
    if (event.data.name !== RP_STATE_TOOL) {
      if (index >= 0) throw new Error(`State tool/call ${JSON.stringify(callId)} has the wrong tool name.`)
      return { state }
    }
    if (typeof callId !== 'string' || callId.length === 0) throw new Error('State tool/call requires a non-empty callId.')
    if (index < 0) throw new Error(`State tool/call ${JSON.stringify(callId)} has no matching assistant owner.`)
    const current = state.owners[index]
    if (current.confirmed) throw new Error(`State tool/call ${JSON.stringify(callId)} is duplicated.`)
    if (current.owner.assistant.turn !== event.data.turn || current.owner.assistant.step !== event.data.step) {
      throw new Error(`State tool/call ${JSON.stringify(callId)} does not match its assistant turn and step.`)
    }
    const owners = state.owners.slice()
    owners[index] = { owner: current.owner, confirmed: true }
    return { state: { ...state, owners } }
  }

  if (event.type === 'command/run' && event.data.name === RP_STATE_CONFIGURE_COMMAND) {
    if (typeof event.data.commandId !== 'string' || event.data.commandId.length === 0) throw new Error('State configuration command requires a non-empty commandId.')
    if (state.pending.some(item => item.commandId === event.data.commandId)) throw new Error(`State configuration command ${JSON.stringify(event.data.commandId)} is duplicated.`)
    let command
    try {
      command = decodeStateCommandInput(event.data.args)
    } catch {
      return { state: rejectStateCommand(state, event.data.commandId) }
    }
    const index = state.owners.findIndex(item => item.confirmed && sameOwner(item.owner, command.owner))
    if (index < 0) return { state: rejectStateCommand(state, event.data.commandId) }
    const mutation = stateCommandMutation(command)
    return {
      state: {
        owners: state.owners.filter((_item, ownerIndex) => ownerIndex !== index),
        pending: [...state.pending, {
          commandId: event.data.commandId,
          owner: command.owner,
          mutation,
        }],
      },
    }
  }
  if (event.type === 'command/done' && typeof event.data.commandId === 'string') {
    const pending = state.pending.find(item => item.commandId === event.data.commandId)
    if (pending !== undefined) {
      const next = { ...state, pending: state.pending.filter(item => item.commandId !== event.data.commandId) }
      if (pending.rejected === true) {
        if (event.data.kind === 'success') {
          throw new Error(`Successful State configuration command ${JSON.stringify(event.data.commandId)} has no valid assistant tool owner and canonical v3 payload.`)
        }
        return { state: next }
      }
      return {
        state: next,
        ...(event.data.kind === 'success' ? { committed: pending } : {}),
      }
    }
  }

  if (event.type === 'tool/result' && event.surfaceOp === 'append') {
    const callId = event.data.message?.source?.callId
    const matches = state.owners.filter(item => item.owner.callId === callId)
    if (matches.length === 0) return { state }
    const owner = matches[0].owner
    if (owner.assistant.turn !== event.data.turn || owner.assistant.step !== event.data.step) {
      throw new Error(`State tool result ${JSON.stringify(callId)} does not match its assistant turn and step.`)
    }
    return { state: { ...state, owners: state.owners.filter(item => item.owner.callId !== callId) } }
  }

  return { state }
}

function stateToolCallOwners(event) {
  if (event.type !== 'assistant/message' || event.surfaceOp !== 'append') return []
  const calls = Array.isArray(event.data.message?.content)
    ? event.data.message.content.filter(block => block?.type === 'tool-call' && block.name === RP_STATE_TOOL)
    : []
  if (calls.length === 0) return []
  if (!Number.isSafeInteger(event.seq)
    || !Number.isSafeInteger(event.data.turn)
    || !Number.isSafeInteger(event.data.step)
    || event.data.message?.source?.kind !== 'model'
    || typeof event.data.message?.id !== 'string'
    || event.data.message.id.length === 0) {
    throw new Error('State assistant tool owner is invalid.')
  }
  return calls.map(call => ({
    owner: normalizeStateCommandOwner({
      kind: 'assistant-tool',
      tool: RP_STATE_TOOL,
      callId: call.id,
      assistant: {
        seq: event.seq,
        messageId: event.data.message.id,
        turn: event.data.turn,
        step: event.data.step,
      },
    }),
    confirmed: false,
  }))
}

function stateCommandMutation(command) {
  return normalizeStateConfigurationMutation({
    action: command.action,
    namespace: command.namespace,
    expectedRevision: command.expectedRevision,
    ...(command.action === 'delete' ? {} : { result: command.result }),
  })
}

function rejectStateCommand(state, commandId) {
  return { ...state, pending: [...state.pending, { commandId, rejected: true }] }
}

function sameOwner(left, right) {
  return left.kind === right.kind
    && left.tool === right.tool
    && left.callId === right.callId
    && left.assistant.seq === right.assistant.seq
    && left.assistant.messageId === right.assistant.messageId
    && left.assistant.turn === right.assistant.turn
    && left.assistant.step === right.assistant.step
}

function validNamespaceSnapshot(value) {
  return record(value)
    && Number.isSafeInteger(value.revision)
    && value.revision > 0
    && Object.prototype.hasOwnProperty.call(value, 'initialValue')
    && Object.prototype.hasOwnProperty.call(value, 'value')
    && record(value.definition)
    && record(value.diagnostics)
}

function normalizeCommandResult(value) {
  exactRecord(value, ['revision', 'initialValue', 'value', 'definition', 'diagnostics'], 'State command result')
  const definition = normalizeStateDefinition(value.definition)
  const initialValue = validateStateValue(definition.schema, normalizeJson(value.initialValue, 'initialValue'), 'initialValue')
  const currentValue = validateStateValue(definition.schema, normalizeJson(value.value, 'value'), 'value')
  if (!record(value.diagnostics) || !Array.isArray(value.diagnostics.setup) || !Array.isArray(value.diagnostics.lastCommit)) {
    throw new Error('State command result diagnostics must contain setup and lastCommit arrays.')
  }
  exactRecord(value.diagnostics, ['setup', 'lastCommit'], 'State command result diagnostics')
  const lastCommit = value.diagnostics.lastCommit.map((item, index) => {
    if (!record(item)) throw new Error(`State command lastCommit diagnostic ${index} must be an object.`)
    return structuredClone(item)
  })
  return {
    revision: value.revision,
    initialValue,
    value: currentValue,
    definition,
    diagnostics: { setup: normalizeSetupDiagnostics(value.diagnostics.setup), lastCommit },
  }
}

function record(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function exactRecord(value, allowedKeys, label) {
  if (!record(value)) throw new Error(`${label} must be an object.`)
  const allowed = new Set(allowedKeys)
  const unknown = Object.keys(value).find(key => !allowed.has(key))
  if (unknown !== undefined) throw new Error(`${label} contains unknown field "${unknown}".`)
}
