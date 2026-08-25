const UNSAFE_KEYS = new Set(['__proto__', 'prototype', 'constructor'])
const TYPE_ALIASES = Object.freeze({
  number: 'number',
  integer: 'integer',
  string: 'string',
  boolean: 'boolean',
  array: 'array',
  object: 'object',
  null: 'null',
  数值: 'number',
  整数: 'integer',
  字符串: 'string',
  布尔: 'boolean',
  数组: 'array',
  对象: 'object',
  空值: 'null',
})

/** Parse the safe declarative subset of MVU scalar and object type expressions. */
export function parseMvuDeclaredType(value) {
  const raw = String(value).trim()
  const alias = typeAlias(raw)
  if (alias !== undefined) return { type: alias }
  if (raw.length === 0 || raw.length > 20_000) return undefined
  const tokens = tokenizeTypeExpression(raw)
  if (tokens === undefined || tokens.length > 2_000) return undefined
  let index = 0
  const consume = expected => {
    const token = tokens[index]
    if (token?.value !== expected) return false
    index += 1
    return true
  }
  const parsePrimary = depth => {
    if (depth > 16) return undefined
    const token = tokens[index]
    if (token === undefined) return undefined
    if (token.value === '{') {
      index += 1
      const properties = {}
      const required = []
      let additionalProperties = false
      while (tokens[index]?.value !== '}') {
        while ([',', ';'].includes(tokens[index]?.value)) index += 1
        if (tokens[index] === undefined) return undefined
        if (consume('[')) {
          const name = tokens[index]
          index += 1
          if (!['word', 'string'].includes(name?.kind) || !consume(':')) return undefined
          const keyType = tokens[index]
          index += 1
          if (keyType?.kind !== 'word' || typeAlias(keyType.value) !== 'string' || !consume(']') || !consume(':')) return undefined
          const child = parseType(depth + 1)
          if (child === undefined || additionalProperties !== false) return undefined
          additionalProperties = child
        } else {
          const key = tokens[index]
          index += 1
          if (!['word', 'string'].includes(key?.kind) || UNSAFE_KEYS.has(key.value)) return undefined
          const optional = consume('?')
          if (!consume(':')) return undefined
          const child = parseType(depth + 1)
          if (child === undefined || Object.hasOwn(properties, key.value)) return undefined
          properties[key.value] = child
          if (!optional) required.push(key.value)
        }
        while ([',', ';'].includes(tokens[index]?.value)) index += 1
      }
      index += 1
      return {
        type: 'object',
        ...(Object.keys(properties).length === 0 ? {} : { properties }),
        ...(required.length === 0 ? {} : { required }),
        additionalProperties,
      }
    }
    index += 1
    if (token.kind === 'string') return { type: 'string', const: token.value }
    if (token.kind !== 'word') return undefined
    const type = typeAlias(token.value)
    return type === undefined ? undefined : { type }
  }
  const parseType = depth => {
    const alternatives = [parsePrimary(depth)]
    if (alternatives[0] === undefined) return undefined
    while (consume('|')) {
      const alternative = parsePrimary(depth)
      if (alternative === undefined) return undefined
      alternatives.push(alternative)
    }
    if (alternatives.length === 1) return alternatives[0]
    if (alternatives.every(item => item.type === 'string' && Object.hasOwn(item, 'const'))) {
      return { type: 'string', enum: alternatives.map(item => item.const) }
    }
    if (alternatives.every(item => Object.keys(item).length === 1 && typeof item.type === 'string')) {
      return { type: [...new Set(alternatives.map(item => item.type))] }
    }
    return undefined
  }
  const schema = parseType(0)
  return schema !== undefined && index === tokens.length ? schema : undefined
}

/** Add a safe MVU declaration without replacing schemas inferred for existing keys. */
export function applyMvuDeclaredSchema(target, declared) {
  target.type = structuredClone(declared.type)
  if (declared.enum !== undefined) target.enum = structuredClone(declared.enum)
  if (declared.const !== undefined) target.const = structuredClone(declared.const)
  if (declared.type !== 'object') return
  if (!record(target.properties)) target.properties = {}
  for (const [key, child] of Object.entries(declared.properties ?? {})) {
    if (!record(target.properties[key])) target.properties[key] = structuredClone(child)
  }
  if (declared.additionalProperties !== undefined) target.additionalProperties = structuredClone(declared.additionalProperties)
}

/** Check a declared MVU type against an initialized JSON value. */
export function matchesMvuDeclaredType(schema, value) {
  const types = Array.isArray(schema.type) ? schema.type : [schema.type]
  if (!types.some(type => matchesType(type, value))) return false
  if (Array.isArray(schema.enum) && !schema.enum.some(item => Object.is(item, value))) return false
  if (Object.hasOwn(schema, 'const') && !Object.is(schema.const, value)) return false
  return true
}

function typeAlias(value) {
  return TYPE_ALIASES[value.toLowerCase()] ?? TYPE_ALIASES[value]
}

function tokenizeTypeExpression(value) {
  const source = value.split('\n').map(stripTypeComment).join('\n')
  const tokens = []
  const punctuation = new Set(['{', '}', '[', ']', ':', ';', '|', '?', ','])
  for (let index = 0; index < source.length;) {
    const character = source[index]
    if (/\s/u.test(character)) {
      index += 1
      continue
    }
    if (punctuation.has(character)) {
      tokens.push({ kind: 'punctuation', value: character })
      index += 1
      continue
    }
    if (character === "'" || character === '"') {
      const quote = character
      let result = ''
      let escaped = false
      index += 1
      for (; index < source.length; index += 1) {
        const current = source[index]
        if (escaped) {
          result += current
          escaped = false
        } else if (current === '\\') escaped = true
        else if (current === quote) break
        else result += current
      }
      if (index >= source.length || escaped) return undefined
      tokens.push({ kind: 'string', value: result })
      index += 1
      continue
    }
    let end = index
    while (end < source.length && !/\s/u.test(source[end]) && !punctuation.has(source[end]) && source[end] !== "'" && source[end] !== '"') end += 1
    if (end === index) return undefined
    tokens.push({ kind: 'word', value: source.slice(index, end) })
    index = end
  }
  return tokens
}

function stripTypeComment(line) {
  let quote
  let escaped = false
  for (let index = 0; index < line.length - 1; index += 1) {
    const character = line[index]
    if (quote !== undefined) {
      if (escaped) escaped = false
      else if (character === '\\') escaped = true
      else if (character === quote) quote = undefined
      continue
    }
    if (character === "'" || character === '"') quote = character
    else if (character === '/' && line[index + 1] === '/') return line.slice(0, index)
  }
  return line
}

function matchesType(type, value) {
  if (type === 'null') return value === null
  if (type === 'array') return Array.isArray(value)
  if (type === 'object') return record(value)
  if (type === 'integer') return Number.isSafeInteger(value)
  if (type === 'number') return typeof value === 'number' && Number.isFinite(value)
  return typeof value === type
}

function record(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
