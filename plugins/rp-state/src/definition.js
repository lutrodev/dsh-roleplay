import { compileStateCondition } from './condition.js'
import { parseJsonPointer } from './json-pointer.js'
import { cloneJson, normalizeJson, normalizeStateSchema, validateStateValue } from './schema.js'

export const RP_STATE_PROTOCOL_VERSION = 2
export const RP_STATE_DEFAULT_NAMESPACE = 'story'

const NAMESPACE_PATTERN = /^[a-z0-9][a-z0-9._:-]{0,127}$/u
const UPDATE_MODES = new Set(['rules-required', 'schema-only', 'disabled'])
const RULE_CADENCES = new Set(['when-applicable', 'every-turn'])
const OPERATIONS = new Set(['set', 'increment', 'append', 'remove'])

/** Normalize a complete Session-owned State namespace definition. */
export function normalizeStateDefinition(input) {
  exactRecord(input, ['title', 'description', 'updateMode', 'schema', 'rules'], 'State definition')
  if (typeof input.title !== 'string' || input.title.trim().length === 0) throw new StateDefinitionError('State definition title is required.')
  if (!UPDATE_MODES.has(input.updateMode)) throw new StateDefinitionError('State definition updateMode must be rules-required, schema-only, or disabled.')
  if (input.description !== undefined && (typeof input.description !== 'string' || input.description.trim().length === 0)) {
    throw new StateDefinitionError('State definition description must be a non-empty string when provided.')
  }
  if (!Array.isArray(input.rules)) throw new StateDefinitionError('State definition rules must be an array.')
  const rules = input.rules.map((rule, index) => normalizeStateRule(rule, index))
  if (new Set(rules.map(rule => rule.id)).size !== rules.length) throw new StateDefinitionError('State definition contains duplicate rule ids.')
  return {
    title: input.title.trim(),
    ...(input.description === undefined ? {} : { description: input.description.trim() }),
    updateMode: input.updateMode,
    schema: normalizeStateSchema(input.schema),
    rules,
  }
}

/** Normalize one Session bootstrap payload into canonical namespace records. */
export function normalizeStateBootstrap(input) {
  exactRecord(input, ['version', 'namespaces'], 'stateBootstrap')
  if (input.version !== RP_STATE_PROTOCOL_VERSION) throw new StateDefinitionError(`stateBootstrap version must be ${RP_STATE_PROTOCOL_VERSION}.`)
  if (!Array.isArray(input.namespaces)) throw new StateDefinitionError('stateBootstrap namespaces must be an array.')
  const ids = new Set()
  return {
    version: RP_STATE_PROTOCOL_VERSION,
    namespaces: input.namespaces.map((namespace, index) => {
      exactRecord(namespace, ['namespace', 'initialValue', 'definition', 'diagnostics'], `stateBootstrap namespace ${index}`)
      const id = normalizeNamespaceId(namespace.namespace)
      if (ids.has(id)) throw new StateDefinitionError(`stateBootstrap contains duplicate namespace "${id}".`)
      ids.add(id)
      const definition = normalizeStateDefinition(namespace.definition)
      const initialValue = validateStateValue(definition.schema, normalizeJson(namespace.initialValue, `${id}.initialValue`), `${id}.initialValue`)
      return {
        namespace: id,
        initialValue,
        definition,
        diagnostics: normalizeBootstrapDiagnostics(namespace.diagnostics),
      }
    }),
  }
}

/** Create a revision-one namespace snapshot from a canonical bootstrap item. */
export function createNamespaceSnapshot(input) {
  const definition = normalizeStateDefinition(input.definition)
  const initialValue = validateStateValue(definition.schema, normalizeJson(input.initialValue, 'initialValue'), 'initialValue')
  const value = input.value === undefined
    ? cloneJson(initialValue)
    : validateStateValue(definition.schema, normalizeJson(input.value, 'value'), 'value')
  const diagnostics = input.diagnostics === undefined
    ? { setup: [], lastCommit: [] }
    : normalizeBootstrapDiagnostics(input.diagnostics)
  return {
    revision: 1,
    initialValue,
    value,
    definition,
    diagnostics,
  }
}

/** Normalize a stable Session-local namespace id. */
export function normalizeNamespaceId(value) {
  if (typeof value !== 'string' || !NAMESPACE_PATTERN.test(value)) {
    throw new StateDefinitionError('State namespace must be a stable lowercase id containing only letters, digits, dot, colon, underscore, or hyphen.')
  }
  return value
}

/** Normalize setup diagnostics persisted with one namespace. */
export function normalizeSetupDiagnostics(value) {
  if (value === undefined) return []
  if (!Array.isArray(value)) throw new StateDefinitionError('State setup diagnostics must be an array.')
  return value.map((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) throw new StateDefinitionError(`State diagnostic ${index} must be an object.`)
    const code = typeof item.code === 'string' && item.code.length > 0 ? item.code : 'STATE_SETUP_NOTICE'
    const severity = ['info', 'warning', 'error'].includes(item.severity) ? item.severity : 'warning'
    const message = typeof item.message === 'string' && item.message.trim().length > 0
      ? item.message.trim()
      : typeof item.reason === 'string' && item.reason.trim().length > 0
        ? item.reason.trim()
        : code
    const path = typeof item.path === 'string' && item.path.length > 0 ? item.path : undefined
    return { code, severity, message, ...(path === undefined ? {} : { path }) }
  })
}

function normalizeBootstrapDiagnostics(value) {
  exactRecord(value, ['setup', 'lastCommit'], 'State bootstrap diagnostics')
  if (!Array.isArray(value.lastCommit) || value.lastCommit.length !== 0) {
    throw new StateDefinitionError('State bootstrap diagnostics lastCommit must be an empty array.')
  }
  return { setup: normalizeSetupDiagnostics(value.setup), lastCommit: [] }
}

function normalizeStateRule(input, index) {
  exactRecord(input, ['id', 'target', 'when', 'condition', 'effect', 'guidance', 'cadence'], `State rule ${index}`)
  if (typeof input.id !== 'string' || !NAMESPACE_PATTERN.test(input.id)) throw new StateDefinitionError(`State rule ${index} requires a stable lowercase id.`)
  const target = typeof input.target === 'string' ? input.target : undefined
  if (target === undefined) throw new StateDefinitionError(`State rule "${input.id}" requires target.`)
  if (typeof input.when !== 'string' || input.when.trim().length === 0) throw new StateDefinitionError(`State rule "${input.id}" requires when guidance.`)
  if (input.condition !== undefined) compileStateCondition(input.condition)
  const effect = normalizeRuleEffect(input.effect, input.id)
  parseJsonPointer(target, { allowRoot: effect.op !== 'remove' })
  if (input.guidance !== undefined && (!Array.isArray(input.guidance) || input.guidance.some(item => typeof item !== 'string' || item.trim().length === 0))) {
    throw new StateDefinitionError(`State rule "${input.id}" guidance must be an array of non-empty strings.`)
  }
  const cadence = input.cadence ?? 'when-applicable'
  if (!RULE_CADENCES.has(cadence)) throw new StateDefinitionError(`State rule "${input.id}" has an invalid cadence.`)
  return {
    id: input.id,
    target,
    when: input.when.trim(),
    ...(input.condition === undefined ? {} : { condition: input.condition.trim() }),
    effect,
    guidance: (input.guidance ?? []).map(item => item.trim()),
    cadence,
  }
}

function normalizeRuleEffect(input, ruleId) {
  if (!input || typeof input !== 'object' || Array.isArray(input) || !OPERATIONS.has(input.op)) {
    throw new StateDefinitionError(`State rule "${ruleId}" requires a supported effect operation.`)
  }
  const allowed = input.op === 'increment' ? ['op', 'minimum', 'maximum'] : ['op']
  exactRecord(input, allowed, `State rule "${ruleId}" effect`)
  const output = { op: input.op }
  if (input.op === 'increment') {
    for (const key of ['minimum', 'maximum']) {
      if (input[key] === undefined) continue
      if (!Number.isFinite(input[key])) throw new StateDefinitionError(`State rule "${ruleId}" ${key} must be finite.`)
      output[key] = input[key]
    }
    if (output.minimum !== undefined && output.maximum !== undefined && output.minimum > output.maximum) {
      throw new StateDefinitionError(`State rule "${ruleId}" minimum cannot exceed maximum.`)
    }
  }
  return output
}

function exactRecord(value, allowedKeys, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new StateDefinitionError(`${label} must be an object.`)
  const allowed = new Set(allowedKeys)
  const unknown = Object.keys(value).find(key => !allowed.has(key))
  if (unknown !== undefined) throw new StateDefinitionError(`${label} contains unknown field "${unknown}".`)
}

export class StateDefinitionError extends Error {
  constructor(message) {
    super(message)
    this.name = 'StateDefinitionError'
  }
}
