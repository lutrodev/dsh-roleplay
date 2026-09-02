import { compileStateCondition, evaluateStateCondition } from './condition.js'
import { jsonPointersConflict, parseJsonPointer, readJsonPointer, requiredArrayIndex, resolveJsonPointerParent } from './json-pointer.js'
import { cloneJson, normalizeJson, stateSchemaAtPointer, validateStateValue } from './schema.js'

const CHANGE_BASE_FIELDS = Object.freeze(['op', 'path', 'reason', 'ruleId'])
const MIN_STATE_UPDATE_CHANGES = 1
const OPERATION_SPECS = Object.freeze({
  set: Object.freeze({ argument: 'value', forbidden: Object.freeze(['by']), description: 'Replace the value at one path. Pass the new value in "value"; never use "by". Use append instead when adding one item to an existing array.' }),
  increment: Object.freeze({ argument: 'by', forbidden: Object.freeze(['value']), description: 'Add one finite numeric delta to the number at one path. Pass the delta in "by"; never use "value".' }),
  append: Object.freeze({ argument: 'value', forbidden: Object.freeze(['by']), description: 'Append exactly one JSON item to an existing array without repeating its current contents. Pass that one item in "value"; never use "by".' }),
  remove: Object.freeze({ forbidden: Object.freeze(['value', 'by']), description: 'Remove one existing non-root path. Do not pass "value" or "by".' }),
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

/** Derive the compact live prompt contract from the authoritative effect schema. */
export function stateUpdateEffectProtocol() {
  const schema = stateUpdateEffectSchema()
  const payload = schema.properties.payload
  return {
    required: [...schema.required],
    additionalProperties: schema.additionalProperties,
    payload: {
      required: [...payload.required],
      additionalProperties: payload.additionalProperties,
      changes: {
        minItems: MIN_STATE_UPDATE_CHANGES,
        operations: stateUpdateOperationProtocol(),
      },
    },
  }
}

/** Return the compact operation table embedded in the live State context. */
export function stateUpdateOperationProtocol() {
  return Object.fromEntries(Object.entries(OPERATION_SPECS).map(([operation, spec]) => [operation, {
    description: spec.description,
    required: ['op', 'path', ...(spec.argument === undefined ? [] : [spec.argument]), 'reason'],
    optional: ['ruleId'],
    forbidden: [...spec.forbidden],
    ...(operation === 'remove' ? { rootAllowed: false } : {}),
  }]))
}

/**
 * Return concise model-facing corrections for a malformed raw state.update
 * effect. The live JSON Schema remains authoritative; these messages explain
 * nested oneOf failures without weakening any operation branch.
 */
export function stateUpdateArgumentCorrections(effect, context = {}) {
  if (!object(effect) || !object(effect.payload) || !Array.isArray(effect.payload.changes)) return []
  const effectPath = typeof context.path === 'string' && context.path.length > 0 ? context.path : 'effect'
  const corrections = []
  for (const [index, change] of effect.payload.changes.entries()) {
    const path = `${effectPath}.payload.changes[${index}]`
    if (!object(change)) {
      corrections.push(`"${path}" must be an object matching one State operation.`)
      continue
    }
    const spec = typeof change.op === 'string' && Object.hasOwn(OPERATION_SPECS, change.op)
      ? OPERATION_SPECS[change.op]
      : undefined
    if (spec === undefined) {
      corrections.push(`"${path}.op" must be exactly one of ${Object.keys(OPERATION_SPECS).map(value => `"${value}"`).join(', ')}.`)
      continue
    }
    if (typeof change.path !== 'string') corrections.push(`"${path}.path" must be a JSON Pointer string.`)
    if (typeof change.reason !== 'string' || change.reason.trim().length === 0) {
      corrections.push(`"${path}.reason" must be a non-empty factual reason.`)
    }
    if (change.ruleId !== undefined && (typeof change.ruleId !== 'string' || change.ruleId.length === 0)) {
      corrections.push(`"${path}.ruleId" must be a non-empty string when supplied.`)
    }
    if (spec.argument !== undefined && !Object.hasOwn(change, spec.argument)) {
      const mistaken = spec.forbidden.find(field => Object.hasOwn(change, field))
      corrections.push(mistaken === undefined
        ? `"${path}.${spec.argument}" is required when op is "${change.op}".`
        : `"${path}" uses op "${change.op}": rename field "${mistaken}" to "${spec.argument}" without changing its value.`)
    }
    if (spec.argument === 'by' && Object.hasOwn(change, 'by')
      && (typeof change.by !== 'number' || !Number.isFinite(change.by))) {
      corrections.push(`"${path}.by" must be a finite number.`)
    }
    const allowed = new Set([...CHANGE_BASE_FIELDS, ...(spec.argument === undefined ? [] : [spec.argument])])
    const unsupported = Object.keys(change).filter(field => !allowed.has(field))
    if (unsupported.length > 0 && !(spec.argument !== undefined
      && !Object.hasOwn(change, spec.argument)
      && unsupported.length === 1
      && spec.forbidden.includes(unsupported[0]))) {
      corrections.push(`"${path}" does not allow ${unsupported.map(field => `"${field}"`).join(', ')} when op is "${change.op}".`)
    }
  }
  return corrections
}

/** Apply one complete semantic change list without mutating the source projection. */
export function applyStateChanges({ state, namespace, snapshot, changes }) {
  if (!Array.isArray(changes) || changes.length === 0) {
    throwStateIssues([stateIssue({
      path: '/payload/changes',
      code: 'STATE_CHANGES_REQUIRED',
      message: 'state.update changes must be a non-empty array.',
      details: { namespace },
    })])
  }
  const issues = []
  const normalized = changes.map((change, index) => {
    try {
      return normalizeChange(change, index)
    } catch (error) {
      issues.push(normalizationIssue(error, index, namespace))
      return undefined
    }
  })
  for (let left = 0; left < normalized.length; left += 1) {
    if (normalized[left] === undefined) continue
    for (let right = left + 1; right < normalized.length; right += 1) {
      if (normalized[right] === undefined || !jsonPointersConflict(normalized[left].segments, normalized[right].segments)) continue
      issues.push(stateIssue({
        path: `/payload/changes/${right}/path`,
        code: 'STATE_CHANGE_PATH_CONFLICT',
        message: `State paths "${normalized[left].path}" and "${normalized[right].path}" conflict in one update.`,
        details: {
          namespace,
          changeIndex: right,
          conflictingChangeIndex: left,
          path: normalized[right].path,
          conflictingPath: normalized[left].path,
        },
      }))
    }
  }
  if (snapshot.definition.updateMode === 'disabled') {
    issues.push(stateIssue({
      path: '/namespace',
      code: 'STATE_NAMESPACE_UPDATE_DISABLED',
      message: `State namespace "${namespace}" does not allow model updates.`,
      details: { namespace },
    }))
  } else {
    for (const [index, change] of normalized.entries()) {
      if (change !== undefined) issues.push(...staticChangeIssues(snapshot.definition, change, index, namespace))
    }
  }
  if (issues.length > 0) throwStateIssues(issues)

  let value = cloneJson(snapshot.value)
  const workingState = cloneJson(state)
  workingState.namespaces[namespace] = { ...cloneJson(snapshot), value }
  for (const [index, change] of normalized.entries()) {
    const rule = change.ruleId === undefined
      ? undefined
      : snapshot.definition.rules.find(candidate => candidate.id === change.ruleId)
    if (rule?.condition !== undefined) {
      const evaluated = evaluateStateCondition(compileStateCondition(rule.condition), workingState)
      if (!evaluated.value) {
        throwStateIssues([stateIssue({
          path: `/payload/changes/${index}/ruleId`,
          code: 'STATE_RULE_CONDITION_UNSATISFIED',
          message: `State rule "${rule.id}" condition is not satisfied: ${evaluated.diagnostics[0]?.message ?? rule.condition}`,
          details: { namespace, changeIndex: index, ruleId: rule.id, condition: rule.condition },
        })])
      }
    }
    try {
      value = applyChange(value, change)
    } catch (error) {
      throwStateIssues([stateIssue({
        path: `/payload/changes/${index}/path`,
        code: typeof error?.code === 'string' ? error.code : 'STATE_CHANGE_APPLICATION_FAILED',
        message: error instanceof Error ? error.message : String(error),
        details: {
          namespace,
          changeIndex: index,
          ...(change.ruleId === undefined ? {} : { ruleId: change.ruleId }),
          path: change.path,
          operation: change.op,
        },
      })])
    }
    workingState.namespaces[namespace] = { ...workingState.namespaces[namespace], value }
  }
  let canonical
  try {
    canonical = validateStateValue(snapshot.definition.schema, value, `${namespace}.value`)
  } catch (error) {
    const statePath = typeof error?.path === 'string' ? error.path : ''
    const changeIndex = findResponsibleChange(normalized, statePath)
    const change = changeIndex === undefined ? undefined : normalized[changeIndex]
    throwStateIssues([stateIssue({
      path: change === undefined
        ? '/payload'
        : `/payload/changes/${changeIndex}/${changeArgumentField(change)}`,
      code: 'STATE_RESULT_SCHEMA_INVALID',
      message: error instanceof Error ? error.message : String(error),
      details: {
        namespace,
        statePath,
        ...(changeIndex === undefined ? {} : { changeIndex }),
        ...(change?.ruleId === undefined ? {} : { ruleId: change.ruleId }),
      },
    })])
  }
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
  let segments
  try {
    segments = parseJsonPointer(input.path, { allowRoot: input.op !== 'remove' })
  } catch (error) {
    throw new StateUpdateError('STATE_CHANGE_PATH_INVALID', error instanceof Error ? error.message : String(error), {
      changeIndex: index,
      operation: input.op,
      field: 'path',
    })
  }
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
  if (input.op === 'set' || input.op === 'append') {
    try {
      output.value = normalizeJson(input.value, `changes[${index}].value`)
    } catch (error) {
      throw new StateUpdateError('STATE_CHANGE_VALUE_INVALID', error instanceof Error ? error.message : String(error), {
        changeIndex: index,
        operation: input.op,
        field: 'value',
      })
    }
  }
  return output
}

function staticChangeIssues(definition, change, index, namespace) {
  const issues = []
  const ruleRequired = definition.updateMode === 'rules-required'
  if (change.ruleId === undefined && ruleRequired) {
    issues.push(stateIssue({
      path: `/payload/changes/${index}/ruleId`,
      code: 'STATE_RULE_ID_REQUIRED',
      message: `State change at "${change.path}" requires ruleId.`,
      details: { namespace, changeIndex: index, path: change.path, allowedRuleIds: definition.rules.map(rule => rule.id) },
    }))
    return issues
  }
  const rule = change.ruleId === undefined
    ? undefined
    : definition.rules.find(candidate => candidate.id === change.ruleId)
  if (change.ruleId !== undefined && rule === undefined) {
    issues.push(stateIssue({
      path: `/payload/changes/${index}/ruleId`,
      code: 'STATE_RULE_UNKNOWN',
      message: `Unknown State rule "${change.ruleId}".`,
      details: { namespace, changeIndex: index, ruleId: change.ruleId, allowedRuleIds: definition.rules.map(candidate => candidate.id) },
    }))
    return issues
  }
  if (rule !== undefined && rule.target !== change.path) {
    issues.push(stateIssue({
      path: `/payload/changes/${index}/path`,
      code: 'STATE_RULE_TARGET_MISMATCH',
      message: `State rule "${rule.id}" targets "${rule.target}", not "${change.path}".`,
      details: { namespace, changeIndex: index, ruleId: rule.id, path: change.path, expectedPath: rule.target },
    }))
  }
  if (rule !== undefined && rule.effect.op !== change.op) {
    issues.push(stateIssue({
      path: `/payload/changes/${index}/op`,
      code: 'STATE_RULE_OPERATION_MISMATCH',
      message: `State rule "${rule.id}" requires ${rule.effect.op}, not ${change.op}.`,
      details: { namespace, changeIndex: index, ruleId: rule.id, operation: change.op, expectedOperation: rule.effect.op },
    }))
  }
  if (rule !== undefined && change.op === 'increment' && rule.effect.op === 'increment') {
    if (rule.effect.minimum !== undefined && change.by < rule.effect.minimum) {
      issues.push(stateIssue({
        path: `/payload/changes/${index}/by`,
        code: 'STATE_RULE_INCREMENT_BELOW_MINIMUM',
        message: `State change by ${change.by} is below rule "${rule.id}" minimum ${rule.effect.minimum}.`,
        details: { namespace, changeIndex: index, ruleId: rule.id, value: change.by, minimum: rule.effect.minimum },
      }))
    }
    if (rule.effect.maximum !== undefined && change.by > rule.effect.maximum) {
      issues.push(stateIssue({
        path: `/payload/changes/${index}/by`,
        code: 'STATE_RULE_INCREMENT_ABOVE_MAXIMUM',
        message: `State change by ${change.by} exceeds rule "${rule.id}" maximum ${rule.effect.maximum}.`,
        details: { namespace, changeIndex: index, ruleId: rule.id, value: change.by, maximum: rule.effect.maximum },
      }))
    }
  }
  if (issues.length > 0) return issues
  const valueSchema = change.op === 'set'
    ? stateSchemaAtPointer(definition.schema, change.segments)
    : change.op === 'append'
      ? stateSchemaAtPointer(definition.schema, change.segments)?.items
      : undefined
  if (valueSchema !== undefined) {
    try {
      validateStateValue(valueSchema, change.value, `changes[${index}].value`)
    } catch (error) {
      issues.push(stateIssue({
        path: `/payload/changes/${index}/value`,
        code: 'STATE_CHANGE_VALUE_SCHEMA_INVALID',
        message: error instanceof Error ? error.message : String(error),
        details: {
          namespace,
          changeIndex: index,
          ...(change.ruleId === undefined ? {} : { ruleId: change.ruleId }),
          statePath: change.path,
        },
      }))
    }
  }
  return issues
}

function normalizationIssue(error, index, namespace) {
  const feedback = object(error?.feedback) ? error.feedback : {}
  const field = feedback.field
    ?? feedback.requiredField
    ?? feedback.unexpectedField
    ?? (error?.code === 'STATE_CHANGE_UNSUPPORTED_OPERATION' ? 'op' : undefined)
  return stateIssue({
    path: field === undefined ? `/payload/changes/${index}` : `/payload/changes/${index}/${encodePointerSegment(field)}`,
    code: typeof error?.code === 'string' ? error.code : 'STATE_CHANGE_INVALID',
    message: error instanceof Error ? error.message : String(error),
    details: {
      namespace,
      changeIndex: index,
      ...feedback,
    },
  })
}

function stateIssue({ path, code, message, details }) {
  const source = object(details) ? details : {}
  const namespace = typeof source.namespace === 'string' ? source.namespace : null
  const changeIndex = Number.isSafeInteger(source.changeIndex) ? source.changeIndex : null
  const ruleId = typeof source.ruleId === 'string' ? source.ruleId : null
  return {
    path,
    code,
    message,
    namespace,
    changeIndex,
    ruleId,
    details: { ...source, namespace, changeIndex, ruleId },
  }
}

function throwStateIssues(issues) {
  const bounded = issues.slice(0, 64)
  const error = new StateUpdateError(
    bounded.length === 1 ? bounded[0].code : 'STATE_UPDATE_VALIDATION_FAILED',
    bounded.length === 1
      ? bounded[0].message
      : `state.update has ${bounded.length} independently correctable errors.`,
    bounded.length === 1 ? bounded[0].details : {},
    bounded,
  )
  throw error
}

function findResponsibleChange(changes, statePath) {
  let segments
  try {
    segments = parseJsonPointer(statePath, { allowRoot: true })
  } catch {
    return undefined
  }
  for (let index = changes.length - 1; index >= 0; index -= 1) {
    if (changes[index] !== undefined && jsonPointersConflict(changes[index].segments, segments)) return index
  }
  return undefined
}

function changeArgumentField(change) {
  if (change.op === 'set' || change.op === 'append') return 'value'
  if (change.op === 'increment') return 'by'
  return 'path'
}

function encodePointerSegment(value) {
  return String(value).replaceAll('~', '~0').replaceAll('/', '~1')
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
  constructor(code, message, feedback = {}, issues) {
    if (message === undefined) {
      message = code
      code = 'STATE_UPDATE_INVALID'
    }
    super(message)
    this.name = 'StateUpdateError'
    this.code = code
    this.feedback = feedback
    if (Array.isArray(issues)) this.issues = issues
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

function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}
