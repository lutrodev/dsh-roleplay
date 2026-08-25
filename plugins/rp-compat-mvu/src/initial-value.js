import { parseDocument } from 'yaml'

const INIT_MARKER = /\[InitVar\]/gi
const FENCED_BLOCK = /```(?:[\w-]+)?\s*\n?([\s\S]*?)\n?```/i
const UNSAFE_KEYS = new Set(['__proto__', 'prototype', 'constructor'])
const MAX_INITIAL_VALUE_DEPTH = 64
const MAX_INITIAL_VALUE_NODES = 100000
const MAX_YAML_ALIASES = 100

/** Decode a portable MVU InitVar object from JSON, YAML or simple key/value text. */
export function decodeMvuInitialValue(value) {
  if (record(value)) return normalizeRoot(value)
  if (typeof value !== 'string') return failure('Initial value is neither an object nor text.')
  const text = unwrap(value).replace(INIT_MARKER, '').trim()
  if (text.length === 0) return failure('Initial value is empty.')

  const json = parseJsonObject(text)
  if (json !== undefined) {
    const normalized = normalizeRoot(json.value)
    return normalized.ok && json.loose
      ? {
          ...normalized,
          diagnostics: [{
            code: 'MVU_INIT_LOOSE_JSON_NORMALIZED',
            severity: 'info',
            message: '已安全修正常见的 MVU 初始化 JSON 格式问题（缺失逗号、尾逗号、注释或单引号）。',
          }],
        }
      : normalized
  }

  try {
    const document = parseDocument(text, {
      schema: 'core',
      merge: false,
      prettyErrors: false,
      strict: true,
      uniqueKeys: true,
    })
    if (document.errors.length > 0) throw document.errors[0]
    const parsed = document.toJS({ maxAliasCount: MAX_YAML_ALIASES, mapAsMap: false })
    if (record(parsed)) return normalizeRoot(parsed)
  } catch {
    // Invalid or non-mapping YAML may still be a supported key/value list.
  }

  const pairs = parseKeyValuePairs(text)
  if (pairs !== undefined) return pairs.ok ? normalizeRoot(pairs.value) : pairs
  return failure('Unsupported MVU initialization. Expected a JSON object, YAML mapping, or key/value lines.')
}

/** Decode one JSON-compatible MVU command literal without evaluating code. */
export function decodeMvuLiteral(value) {
  if (typeof value !== 'string' || value.trim().length === 0) return failure('MVU command literal is empty.')
  const text = value.trim()
  try {
    return { ok: true, value: normalize(JSON.parse(text), 0, { nodes: 0 }) }
  } catch {
    try {
      return { ok: true, value: normalize(parseLooseJson(text), 0, { nodes: 0 }) }
    } catch (error) {
      return failure(error instanceof Error ? error.message : String(error))
    }
  }
}

/** Deep-merge portable MVU initialization objects with later values winning. */
export function mergeMvuInitialValues(left, right) {
  const result = structuredClone(left)
  for (const [key, value] of Object.entries(right)) {
    result[key] = record(value) && record(result[key])
      ? mergeMvuInitialValues(result[key], value)
      : structuredClone(value)
  }
  return result
}

function unwrap(value) {
  const text = value.trim()
  const match = FENCED_BLOCK.exec(text)
  return match === null ? text : match[1].trim()
}

function parseJsonObject(text) {
  const candidates = [text]
  const embedded = /\{[\s\S]*\}/.exec(text)?.[0]
  if (embedded !== undefined && embedded !== text) candidates.push(embedded)
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate)
      if (record(parsed) && (candidate === text || Object.keys(parsed).length > 0)) return { value: parsed, loose: false }
    } catch {
      try {
        const parsed = parseLooseJson(candidate)
        if (record(parsed) && (candidate === text || Object.keys(parsed).length > 0)) return { value: parsed, loose: true }
      } catch {
        // The next candidate or a non-JSON initializer format may still be valid.
      }
    }
  }
  return undefined
}

/**
 * Parse a small declarative JSON superset used by community MVU cards.
 * It accepts comments, single-quoted strings, trailing commas and an omitted
 * comma between object members separated by trivia. It never evaluates names,
 * expressions, functions or JavaScript literals.
 */
function parseLooseJson(source) {
  let index = 0
  let nodes = 0
  const fail = message => { throw new Error(`${message} at character ${index}.`) }
  const countNode = depth => {
    nodes += 1
    if (nodes > MAX_INITIAL_VALUE_NODES) fail(`Initial value exceeds ${MAX_INITIAL_VALUE_NODES} values`)
    if (depth > MAX_INITIAL_VALUE_DEPTH) fail(`Initial value exceeds ${MAX_INITIAL_VALUE_DEPTH} nesting levels`)
  }
  const skipTrivia = () => {
    const start = index
    while (index < source.length) {
      if (/\s/u.test(source[index])) {
        index += 1
        continue
      }
      if (source[index] === '/' && source[index + 1] === '/') {
        index += 2
        while (index < source.length && !['\n', '\r'].includes(source[index])) index += 1
        continue
      }
      if (source[index] === '/' && source[index + 1] === '*') {
        const end = source.indexOf('*/', index + 2)
        if (end < 0) fail('Unterminated block comment')
        index = end + 2
        continue
      }
      break
    }
    return index > start
  }
  const parseString = () => {
    const quote = source[index]
    if (!['"', "'"].includes(quote)) fail('Expected a quoted string')
    index += 1
    let result = ''
    while (index < source.length) {
      const character = source[index]
      index += 1
      if (character === quote) return result
      if (character === '\n' || character === '\r' || character < ' ') fail('Unescaped control character in string')
      if (character !== '\\') {
        result += character
        continue
      }
      if (index >= source.length) fail('Unterminated string escape')
      const escaped = source[index]
      index += 1
      const simple = { '"': '"', "'": "'", '\\': '\\', '/': '/', b: '\b', f: '\f', n: '\n', r: '\r', t: '\t' }
      if (Object.hasOwn(simple, escaped)) {
        result += simple[escaped]
        continue
      }
      if (escaped !== 'u') fail(`Unsupported string escape \\${escaped}`)
      const hexadecimal = source.slice(index, index + 4)
      if (!/^[0-9a-f]{4}$/iu.test(hexadecimal)) fail('Invalid Unicode escape')
      result += String.fromCharCode(Number.parseInt(hexadecimal, 16))
      index += 4
    }
    fail('Unterminated string')
  }
  const parseNumber = () => {
    const match = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:e[+-]?\d+)?/iu.exec(source.slice(index))
    if (match === null) fail('Invalid number')
    index += match[0].length
    const value = Number(match[0])
    if (!Number.isFinite(value)) fail('Non-finite number')
    return value
  }
  const parseValue = depth => {
    skipTrivia()
    countNode(depth)
    const character = source[index]
    if (character === '{') return parseObject(depth)
    if (character === '[') return parseArray(depth)
    if (character === '"' || character === "'") return parseString()
    if (source.startsWith('true', index)) {
      index += 4
      return true
    }
    if (source.startsWith('false', index)) {
      index += 5
      return false
    }
    if (source.startsWith('null', index)) {
      index += 4
      return null
    }
    if (character === '-' || /\d/u.test(character ?? '')) return parseNumber()
    fail('Unsupported JSON value')
  }
  const parseObject = depth => {
    index += 1
    const result = {}
    skipTrivia()
    if (source[index] === '}') {
      index += 1
      return result
    }
    while (index < source.length) {
      const key = parseString()
      if (UNSAFE_KEYS.has(key)) fail(`Initial value contains unsafe key "${key}"`)
      if (Object.hasOwn(result, key)) fail(`Duplicate object key "${key}"`)
      skipTrivia()
      if (source[index] !== ':') fail('Expected a colon after object key')
      index += 1
      result[key] = parseValue(depth + 1)
      const separated = skipTrivia()
      if (source[index] === '}') {
        index += 1
        return result
      }
      if (source[index] === ',') {
        index += 1
        skipTrivia()
        if (source[index] === '}') {
          index += 1
          return result
        }
      } else if (!separated || !['"', "'"].includes(source[index])) fail('Expected a comma between object members')
    }
    fail('Unterminated object')
  }
  const parseArray = depth => {
    index += 1
    const result = []
    skipTrivia()
    if (source[index] === ']') {
      index += 1
      return result
    }
    while (index < source.length) {
      result.push(parseValue(depth + 1))
      skipTrivia()
      if (source[index] === ']') {
        index += 1
        return result
      }
      if (source[index] !== ',') fail('Expected a comma between array items')
      index += 1
      skipTrivia()
      if (source[index] === ']') {
        index += 1
        return result
      }
    }
    fail('Unterminated array')
  }
  const result = parseValue(0)
  skipTrivia()
  if (index !== source.length) fail('Unexpected content after JSON value')
  return result
}

function parseKeyValuePairs(text) {
  const result = {}
  let parsed = 0
  const assigned = new Set()
  for (const [index, line] of text.split(/\r?\n/).entries()) {
    const trimmed = line.trim()
    if (trimmed.length === 0 || trimmed.startsWith('#') || trimmed.startsWith('//')) continue
    const separator = findPairSeparator(trimmed)
    if (separator < 1) return failure(`Invalid key/value initializer at line ${index + 1}.`)
    const path = parsePath(trimmed.slice(0, separator))
    if (path === undefined) return failure(`Invalid variable path at line ${index + 1}.`)
    const signature = path.join('\u0000')
    if (assigned.has(signature)) return failure(`Duplicate variable path at line ${index + 1}.`)
    const conflict = [...assigned].find(other => other.startsWith(`${signature}\u0000`) || signature.startsWith(`${other}\u0000`))
    if (conflict !== undefined) return failure(`Conflicting variable path at line ${index + 1}.`)
    assigned.add(signature)
    const scalar = trimmed.slice(separator + 1).trim()
    if (/(?:^|[\s[,])(?:[&*][^\s,\]]+|!\S+)/u.test(scalar)) {
      return failure(`Unsupported YAML anchor, alias or tag at line ${index + 1}.`)
    }
    setPath(result, path, parseScalar(scalar))
    parsed += 1
  }
  return parsed === 0 ? undefined : { ok: true, value: result }
}

function findPairSeparator(value) {
  let quote
  let escaped = false
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index]
    if (quote !== undefined) {
      if (escaped) escaped = false
      else if (character === '\\') escaped = true
      else if (character === quote) quote = undefined
      continue
    }
    if (character === '"' || character === "'") quote = character
    else if (character === '=' || character === ':') return index
  }
  return -1
}

function parsePath(value) {
  const segments = value.split('.').map(segment => segment.trim()).filter(Boolean)
  return segments.length > 0 && segments.every(segment => /^[\p{L}\p{N}_$-]+$/u.test(segment) && !UNSAFE_KEYS.has(segment)) ? segments : undefined
}

function setPath(target, path, value) {
  let current = target
  for (const segment of path.slice(0, -1)) {
    if (!record(current[segment])) current[segment] = {}
    current = current[segment]
  }
  current[path.at(-1)] = value
}

function parseScalar(value) {
  if (value.length === 0) return ''
  try { return JSON.parse(value) } catch {
    // Plain quoted, numeric and boolean values are accepted below.
  }
  if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) return value.slice(1, -1)
  if (/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(value)) {
    const number = Number(value)
    if (Number.isFinite(number)) return number
  }
  if (/^true$/i.test(value)) return true
  if (/^false$/i.test(value)) return false
  if (/^(?:null|~)$/i.test(value)) return null
  return value
}

function normalizeRoot(value) {
  const state = { nodes: 0 }
  try {
    const normalized = normalize(value, 0, state)
    return record(normalized)
      ? { ok: true, value: normalized }
      : failure('Initial value must be an object.')
  } catch (error) {
    return failure(error instanceof Error ? error.message : String(error))
  }
}

function normalize(value, depth, state) {
  state.nodes += 1
  if (state.nodes > MAX_INITIAL_VALUE_NODES) throw new Error(`Initial value exceeds ${MAX_INITIAL_VALUE_NODES} values.`)
  if (depth > MAX_INITIAL_VALUE_DEPTH) throw new Error(`Initial value exceeds ${MAX_INITIAL_VALUE_DEPTH} nesting levels.`)
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('Initial value contains a non-finite number.')
    return value
  }
  if (Array.isArray(value)) return value.map(item => normalize(item, depth + 1, state))
  if (!record(value)) throw new Error('Initial value contains a non-JSON value.')
  const result = {}
  for (const [key, item] of Object.entries(value)) {
    if (UNSAFE_KEYS.has(key)) throw new Error(`Initial value contains unsafe key "${key}".`)
    result[key] = normalize(item, depth + 1, state)
  }
  return result
}

function failure(message) { return { ok: false, message } }
function record(value) { return typeof value === 'object' && value !== null && !Array.isArray(value) }
