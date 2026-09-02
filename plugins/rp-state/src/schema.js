const TYPES = new Set(['object', 'array', 'string', 'number', 'integer', 'boolean', 'null'])
const UNSAFE_KEYS = new Set(['__proto__', 'prototype', 'constructor'])
const COMMON_KEYS = new Set(['type', 'title', 'description', 'enum', 'const'])
const TYPE_KEYS = Object.freeze({
  object: new Set(['properties', 'required', 'additionalProperties']),
  array: new Set(['items', 'minItems', 'maxItems']),
  string: new Set(['minLength', 'maxLength']),
  number: new Set(['minimum', 'maximum']),
  integer: new Set(['minimum', 'maximum']),
  boolean: new Set(),
  null: new Set(),
})

/** Validate and detach the restricted rp.state JSON Schema subset. */
export function normalizeStateSchema(input, path = '$') {
  if (!record(input)) throw new StateSchemaError(`${path} must be a JSON Schema object.`)
  const types = normalizeTypes(input.type, `${path}.type`)
  const allowed = new Set(COMMON_KEYS)
  for (const type of types.length === 0 ? TYPES : types) for (const key of TYPE_KEYS[type]) allowed.add(key)
  for (const key of Object.keys(input)) {
    if (!allowed.has(key)) throw new StateSchemaError(`${path} contains unsupported keyword "${key}".`)
  }
  const output = {}
  if (input.type !== undefined) output.type = Array.isArray(input.type) ? [...types] : types[0]
  for (const key of ['title', 'description']) {
    if (input[key] === undefined) continue
    if (typeof input[key] !== 'string' || input[key].trim().length === 0) throw new StateSchemaError(`${path}.${key} must be a non-empty string.`)
    output[key] = input[key].trim()
  }
  if (input.enum !== undefined) {
    if (!Array.isArray(input.enum) || input.enum.length === 0) throw new StateSchemaError(`${path}.enum must be a non-empty array.`)
    output.enum = input.enum.map((value, index) => normalizeJson(value, `${path}.enum[${index}]`))
    if (new Set(output.enum.map(stableJson)).size !== output.enum.length) throw new StateSchemaError(`${path}.enum contains duplicate values.`)
  }
  if (Object.prototype.hasOwnProperty.call(input, 'const')) output.const = normalizeJson(input.const, `${path}.const`)
  if (input.properties !== undefined) {
    if (!record(input.properties)) throw new StateSchemaError(`${path}.properties must be an object.`)
    output.properties = Object.fromEntries(Object.entries(input.properties).map(([key, schema]) => {
      if (UNSAFE_KEYS.has(key)) throw new StateSchemaError(`${path}.properties contains unsafe property "${key}".`)
      return [key, normalizeStateSchema(schema, `${path}.properties.${key}`)]
    }))
  }
  if (input.required !== undefined) {
    if (!Array.isArray(input.required) || input.required.some(key => typeof key !== 'string' || UNSAFE_KEYS.has(key)) || new Set(input.required).size !== input.required.length) {
      throw new StateSchemaError(`${path}.required must be an array of unique strings.`)
    }
    output.required = [...input.required]
    if (input.properties !== undefined) {
      const missing = output.required.find(key => !Object.prototype.hasOwnProperty.call(input.properties, key))
      if (missing !== undefined) throw new StateSchemaError(`${path}.required references undefined property "${missing}".`)
    }
  }
  if (input.additionalProperties !== undefined) {
    if (typeof input.additionalProperties === 'boolean') output.additionalProperties = input.additionalProperties
    else output.additionalProperties = normalizeStateSchema(input.additionalProperties, `${path}.additionalProperties`)
  }
  if (input.items !== undefined) output.items = normalizeStateSchema(input.items, `${path}.items`)
  for (const key of ['minItems', 'maxItems', 'minLength', 'maxLength']) {
    if (input[key] === undefined) continue
    if (!Number.isSafeInteger(input[key]) || input[key] < 0) throw new StateSchemaError(`${path}.${key} must be a non-negative safe integer.`)
    output[key] = input[key]
  }
  for (const key of ['minimum', 'maximum']) {
    if (input[key] === undefined) continue
    if (!Number.isFinite(input[key])) throw new StateSchemaError(`${path}.${key} must be finite.`)
    output[key] = input[key]
  }
  for (const [minimum, maximum] of [['minItems', 'maxItems'], ['minLength', 'maxLength'], ['minimum', 'maximum']]) {
    if (output[minimum] !== undefined && output[maximum] !== undefined && output[minimum] > output[maximum]) {
      throw new StateSchemaError(`${path}.${minimum} cannot exceed ${maximum}.`)
    }
  }
  return output
}

/** Validate one complete JSON value against a normalized restricted schema. */
export function validateStateValue(schema, value, path = '$') {
  normalizeJson(value, path)
  validateNode(schema, value, path, '')
  return cloneJson(value)
}

/** Return a detached JSON value and reject non-JSON input. */
export function normalizeJson(value, path = '$') {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new StateSchemaError(`${path} must contain only finite JSON numbers.`)
    return value
  }
  if (Array.isArray(value)) return value.map((item, index) => normalizeJson(item, `${path}[${index}]`))
  if (!record(value)) throw new StateSchemaError(`${path} must be JSON-compatible.`)
  const output = {}
  for (const [key, child] of Object.entries(value)) {
    if (key === '__proto__' || key === 'prototype' || key === 'constructor') throw new StateSchemaError(`${path} contains unsafe key "${key}".`)
    output[key] = normalizeJson(child, `${path}.${key}`)
  }
  return output
}

/** Deep-clone an already validated JSON value. */
export function cloneJson(value) {
  return structuredClone(value)
}

/** Resolve the restricted schema that governs one parsed JSON Pointer path. */
export function stateSchemaAtPointer(rootSchema, segments) {
  let current = rootSchema
  for (const segment of segments) {
    if (!record(current)) return undefined
    if (record(current.properties) && Object.hasOwn(current.properties, segment)) {
      current = current.properties[segment]
      continue
    }
    if (record(current.additionalProperties)) {
      current = current.additionalProperties
      continue
    }
    if (record(current.items) && /^(?:0|[1-9][0-9]*)$/u.test(segment)) {
      current = current.items
      continue
    }
    return undefined
  }
  return record(current) ? cloneJson(current) : undefined
}

function validateNode(schema, value, path, pointer) {
  const types = schema.type === undefined ? [] : Array.isArray(schema.type) ? schema.type : [schema.type]
  if (types.length > 0 && !types.some(type => matchesType(type, value))) {
    throw new StateSchemaError(`${path} must match type ${types.join(' or ')}.`, pointer)
  }
  if (schema.enum !== undefined && !schema.enum.some(candidate => stableJson(candidate) === stableJson(value))) {
    throw new StateSchemaError(`${path} is not one of the allowed values.`, pointer)
  }
  if (Object.prototype.hasOwnProperty.call(schema, 'const') && stableJson(schema.const) !== stableJson(value)) {
    throw new StateSchemaError(`${path} must equal the configured constant.`, pointer)
  }
  if (record(value)) validateObject(schema, value, path, pointer)
  if (Array.isArray(value)) validateArray(schema, value, path, pointer)
  if (typeof value === 'string') validateString(schema, value, path, pointer)
  if (typeof value === 'number') validateNumber(schema, value, path, pointer)
}

function validateObject(schema, value, path, pointer) {
  const properties = schema.properties ?? {}
  for (const key of schema.required ?? []) {
    if (!Object.prototype.hasOwnProperty.call(value, key)) {
      throw new StateSchemaError(`${path} is missing required property "${key}".`, appendPointer(pointer, key))
    }
  }
  for (const [key, child] of Object.entries(value)) {
    const childSchema = properties[key]
    const childPointer = appendPointer(pointer, key)
    if (childSchema !== undefined) validateNode(childSchema, child, `${path}.${key}`, childPointer)
    else if (schema.additionalProperties === false) throw new StateSchemaError(`${path} contains unknown property "${key}".`, childPointer)
    else if (record(schema.additionalProperties)) validateNode(schema.additionalProperties, child, `${path}.${key}`, childPointer)
  }
}

function validateArray(schema, value, path, pointer) {
  if (schema.minItems !== undefined && value.length < schema.minItems) throw new StateSchemaError(`${path} contains fewer than ${schema.minItems} items.`, pointer)
  if (schema.maxItems !== undefined && value.length > schema.maxItems) throw new StateSchemaError(`${path} contains more than ${schema.maxItems} items.`, pointer)
  if (schema.items !== undefined) {
    for (const [index, child] of value.entries()) validateNode(schema.items, child, `${path}[${index}]`, appendPointer(pointer, index))
  }
}

function validateString(schema, value, path, pointer) {
  const length = [...value].length
  if (schema.minLength !== undefined && length < schema.minLength) throw new StateSchemaError(`${path} is shorter than ${schema.minLength} characters.`, pointer)
  if (schema.maxLength !== undefined && length > schema.maxLength) throw new StateSchemaError(`${path} is longer than ${schema.maxLength} characters.`, pointer)
}

function validateNumber(schema, value, path, pointer) {
  if (schema.minimum !== undefined && value < schema.minimum) throw new StateSchemaError(`${path} is below ${schema.minimum}.`, pointer)
  if (schema.maximum !== undefined && value > schema.maximum) throw new StateSchemaError(`${path} is above ${schema.maximum}.`, pointer)
}

function appendPointer(pointer, segment) {
  return `${pointer}/${String(segment).replaceAll('~', '~0').replaceAll('/', '~1')}`
}

function normalizeTypes(value, path) {
  if (value === undefined) return []
  const values = Array.isArray(value) ? value : [value]
  if (values.length === 0 || values.some(type => typeof type !== 'string' || !TYPES.has(type)) || new Set(values).size !== values.length) {
    throw new StateSchemaError(`${path} must contain one or more unique supported JSON types.`)
  }
  return values
}

function matchesType(type, value) {
  if (type === 'null') return value === null
  if (type === 'array') return Array.isArray(value)
  if (type === 'object') return record(value)
  if (type === 'integer') return Number.isSafeInteger(value)
  if (type === 'number') return typeof value === 'number' && Number.isFinite(value)
  return typeof value === type
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`
  if (record(value)) return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`
  return JSON.stringify(value)
}

function record(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export class StateSchemaError extends Error {
  constructor(message, path) {
    super(message)
    this.name = 'StateSchemaError'
    if (typeof path === 'string') this.path = path
  }
}
