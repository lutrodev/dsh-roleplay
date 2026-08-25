import { compileStateCondition, evaluateStateCondition } from './condition.js'
import { jsonPointersConflict, parseJsonPointer, readJsonPointer, requiredArrayIndex, resolveJsonPointerParent } from './json-pointer.js'
import { cloneJson, normalizeJson, validateStateValue } from './schema.js'

const CHANGE_BASE_FIELDS = Object.freeze(['op', 'path', 'reason', 'ruleId'])
const OPERATION_SPECS = Object.freeze({
  set: Object.freeze({ argument: 'value', description: 'Replace the value at one path. Use append instead when adding one item to an existing array.' }),
  increment: Object.freeze({ argument: 'by', description: 'Add one finite numeric delta to the number at one path.' }),
  append: Object.freeze({ argument: 'value', description: 'Append exactly one JSON item to an existing array without repeating its current contents.' }),
  remove: Object.freeze({ description: 'Remove one existing non-root path.' }),
})

/** Return the strict model-facing schema for one atomic state.update effect. */
export function stateUpdateEffectSchema() {
  return {
    type: 'object',
    additionalProperties: false,
    properties: {
      kind: { type: 'string', const: 'state.update', description: 'State update effect discriminator.' },
      namespace: { type: 'string', description: 'Exact active State namespace.' },
      expectedRevision: { type: 'integer', description: 'Exact current revision of the namespace.' },
      payload: {
        type: 'object',
        additionalProperties: false,
        properties: {
          changes: {
            type: 'array',
            description: 'Non-empty ordered semantic changes. Submit only paths that changed.',
            items: { oneOf: Object.entries(OPERATION_SPECS).map(([operation, spec]) => changeSchema(operation, spec)) },
          },
        },
        required: ['changes'],
      },
    },
    required: ['kind', 'namespace', 'expectedRevision', 'payload'],
  }
}

/** Return the compact operation table embedded in the live State context. */
export function stateUpdateOperationProtocol() {
  return Object.fromEntries(Object.entries(OPERATION_SPECS).map(([operation, spec]) => [operation, {
    required: ['op', 'path', ...(spec.argument === undefined ? [] : [spec.argument]), 'reason'],
    optional: ['ruleId'],
    ...(operation === 'remove' ? { rootAllowed: false } : {}),
  }]))
}

/** Apply one complete semantic change list without mutating the source projection. */
export function applyStateChanges({ state, namespace, snapshot, changes }) {
  if (!Array.isArray(changes) || changes.length === 0) throw new StateUpdateError('state.update changes must be a non-empty array.')
  const normalized = changes.map((change, index) => normalizeChange(change, index))
  for (let left = 0; left < normalized.length; left += 1) {
    for (let right = left + 1; right < normalized.length; right += 1) {
      if (jsonPointersConflict(normalized[left].segments, normalized[right].segments)) {
        throw new StateUpdateError(`State paths "${normalized[left].path}" and "${normalized[right].path}" conflict in one update.`)
      }
    }
  }
  if (snapshot.definition.updateMode === 'disabled') throw new StateUpdateError(`State namespace "${namespace}" does not allow model updates.`)
  let value = cloneJson(snapshot.value)
  const workingState = cloneJson(state)
  workingState.namespaces[namespace] = { ...cloneJson(snapshot), value }
  for (const change of normalized) {
    validateRule(snapshot.definition, change, workingState)
    value = applyChange(value, change)
    workingState.namespaces[namespace] = { ...workingState.namespaces[namespace], value }
  }
  const canonical = validateStateValue(snapshot.definition.schema, value, `${namespace}.value`)
  return {
    changes: normalized.map(({ segments: _segments, ...change }) => change),
    result: {
      ...cloneJson(snapshot),
      revision: snapshot.revision + 1,
      value: canonical,
      diagnostics: { setup: cloneJson(snapshot.diagnostics.setup), lastCommit: [] },
    },
  }
}

function normalizeChange(input, index) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new StateUpdateError('STATE_CHANGE_NOT_OBJECT', `State change ${index} must be an object.`, { changeIndex: index })
  }
  const spec = typeof input.op === 'string' && Object.hasOwn(OPERATION_SPECS, input.op)
    ? OPERATION_SPECS[input.op]
    : undefined
  if (spec === undefined) {
    throw new StateUpdateError('STATE_CHANGE_UNSUPPORTED_OPERATION', `State change ${index} has unsupported operation "${String(input.op)}".`, {
      changeIndex: index,
      operation: input.op,
      allowedOperations: Object.keys(OPERATION_SPECS),
    })
  }
  const allowedFields = [...CHANGE_BASE_FIELDS, ...(spec.argument === undefined ? [] : [spec.argument])]
  const allowed = new Set(allowedFields)
  const unknown = Object.keys(input).find(key => !allowed.has(key))
  if (unknown !== undefined) {
    throw new StateUpdateError('STATE_CHANGE_UNKNOWN_FIELD', `State change ${index} contains unknown field "${unknown}".`, {
      changeIndex: index,
      operation: input.op,
      unexpectedField: unknown,
      allowedFields,
    })
  }
  if (typeof input.reason !== 'string' || input.reason.trim().length === 0) {
    throw new StateUpdateError('STATE_CHANGE_REASON_REQUIRED', `State change ${index} requires a non-empty reason.`, {
      changeIndex: index,
      operation: input.op,
      requiredField: 'reason',
    })
  }
  if (input.ruleId !== undefined && (typeof input.ruleId !== 'string' || input.ruleId.length === 0)) {
    throw new StateUpdateError('STATE_CHANGE_RULE_ID_INVALID', `State change ${index} ruleId must be a non-empty string.`, {
      changeIndex: index,
      operation: input.op,
      field: 'ruleId',
    })
  }
  const segments = parseJsonPointer(input.path, { allowRoot: input.op !== 'remove' })
  const output = {
    op: input.op,
    path: input.path,
    segments,
    ...(input.ruleId === undefined ? {} : { ruleId: input.ruleId }),
    reason: input.reason.trim(),
  }
  if (input.op === 'increment') {
    if (!Number.isFinite(input.by)) {
      throw new StateUpdateError('STATE_CHANGE_INCREMENT_BY_INVALID', `State change ${index} increment requires finite by.`, {
        changeIndex: index,
        operation: input.op,
        requiredField: 'by',
      })
    }
    output.by = input.by
  }
  if (input.op === 'set' || input.op === 'append') output.value = normalizeJson(input.value, `changes[${index}].value`)
  return output
}

function validateRule(definition, change, state) {
  if (definition.updateMode === 'schema-only' && change.ruleId === undefined) return
  if (change.ruleId === undefined) throw new StateUpdateError(`State change at "${change.path}" requires ruleId.`)
  const rule = definition.rules.find(candidate => candidate.id === change.ruleId)
  if (rule === undefined) throw new StateUpdateError(`Unknown State rule "${change.ruleId}".`)
  if (rule.target !== change.path) throw new StateUpdateError(`State rule "${rule.id}" targets "${rule.target}", not "${change.path}".`)
  if (rule.effect.op !== change.op) throw new StateUpdateError(`State rule "${rule.id}" requires ${rule.effect.op}, not ${change.op}.`)
  if (change.op === 'increment') {
    if (rule.effect.minimum !== undefined && change.by < rule.effect.minimum) throw new StateUpdateError(`State change by ${change.by} is below rule "${rule.id}" minimum ${rule.effect.minimum}.`)
    if (rule.effect.maximum !== undefined && change.by > rule.effect.maximum) throw new StateUpdateError(`State change by ${change.by} exceeds rule "${rule.id}" maximum ${rule.effect.maximum}.`)
  }
  if (rule.condition !== undefined) {
    const evaluated = evaluateStateCondition(compileStateCondition(rule.condition), state)
    if (!evaluated.value) throw new StateUpdateError(`State rule "${rule.id}" condition is not satisfied: ${evaluated.diagnostics[0]?.message ?? rule.condition}`)
  }
}

function applyChange(source, change) {
  if (change.segments.length === 0) {
    if (change.op === 'set') return cloneJson(change.value)
    if (change.op === 'increment') {
      if (typeof source !== 'number' || !Number.isFinite(source)) throw new StateUpdateError('State namespace root is not a finite number.')
      const next = source + change.by
      if (!Number.isFinite(next)) throw new StateUpdateError('State increment at the namespace root is not finite.')
      return next
    }
    if (!Array.isArray(source)) throw new StateUpdateError('State namespace root is not an array.')
    const value = cloneJson(source)
    value.push(cloneJson(change.value))
    return value
  }
  const value = cloneJson(source)
  const { parent, key } = resolveJsonPointerParent(value, change.segments)
  if (change.op === 'set') {
    if (Array.isArray(parent)) parent[requiredArrayIndex(key, parent.length)] = cloneJson(change.value)
    else parent[key] = cloneJson(change.value)
    return value
  }
  if (change.op === 'remove') {
    if (Array.isArray(parent)) parent.splice(requiredArrayIndex(key, parent.length), 1)
    else {
      if (!Object.prototype.hasOwnProperty.call(parent, key)) throw new StateUpdateError(`State path "${change.path}" does not exist.`)
      delete parent[key]
    }
    return value
  }
  const current = readJsonPointer(value, change.segments)
  if (!current.found) throw new StateUpdateError(`State path "${change.path}" does not exist.`)
  if (change.op === 'increment') {
    if (typeof current.value !== 'number' || !Number.isFinite(current.value)) throw new StateUpdateError(`State path "${change.path}" is not a finite number.`)
    const next = current.value + change.by
    if (!Number.isFinite(next)) throw new StateUpdateError(`State increment at "${change.path}" is not finite.`)
    if (Array.isArray(parent)) parent[requiredArrayIndex(key, parent.length)] = next
    else parent[key] = next
    return value
  }
  if (!Array.isArray(current.value)) throw new StateUpdateError(`State path "${change.path}" is not an array.`)
  current.value.push(cloneJson(change.value))
  return value
}

export class StateUpdateError extends Error {
  constructor(code, message, feedback = {}) {
    if (message === undefined) {
      message = code
      code = 'STATE_UPDATE_INVALID'
    }
    super(message)
    this.name = 'StateUpdateError'
    this.code = code
    this.feedback = feedback
  }
}

function changeSchema(operation, spec) {
  const properties = {
    op: { type: 'string', const: operation, description: spec.description },
    path: { type: 'string', description: 'RFC 6901 JSON Pointer within the namespace; an empty string targets the root when the operation allows it.' },
    reason: { type: 'string', description: 'Non-empty factual reason for this exact change.' },
    ruleId: { type: 'string', description: 'Required only when the namespace update mode requires a matching rule.' },
  }
  if (spec.argument === 'value') properties.value = { description: 'One complete JSON value for this operation.' }
  if (spec.argument === 'by') properties.by = { type: 'number', description: 'Finite numeric delta; use a negative number to decrement.' }
  return {
    type: 'object',
    description: spec.description,
    additionalProperties: false,
    properties,
    required: ['op', 'path', ...(spec.argument === undefined ? [] : [spec.argument]), 'reason'],
  }
}
