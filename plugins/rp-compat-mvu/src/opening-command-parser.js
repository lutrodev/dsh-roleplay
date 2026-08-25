import { decodeMvuLiteral } from './initial-value.js'

const MAX_MVU_PATH_SEGMENTS = 64
const MVU_ARRAY_EXTENSIBLE_MARKER = '$__META_EXTENSIBLE__$'
const PATH_PREFIXES = new Set([
  'stat_data',
  'display_data',
  'state',
  'status_current_variable',
  'status_current_variables',
])
const RESERVED_KEYS = new Set([
  '__proto__',
  'prototype',
  'constructor',
  '$meta',
  '$arrayMeta',
  '$internal',
])
const COMMAND_ALIASES = Object.freeze({
  assign: 'insert',
  remove: 'delete',
  unset: 'delete',
})
const COMMANDS = new Set(['set', 'add', 'insert', 'delete', 'move'])

/** Parse the literal-only MVU/Zod opening command set without evaluating code. */
export function parseMvuOpeningOperations(block) {
  const body = String(block)
    .replace(/^<(?:UpdateVariable|update)\b[^>]*>/i, '')
    .replace(/<\/(?:UpdateVariable|update)\s*>$/i, '')
    .replace(/<Analysis>[\s\S]*?<\/Analysis>/gi, '')
  const uncommented = stripComments(body)
  if (!uncommented.ok) return failure(uncommented.message)
  const statements = splitTopLevel(uncommented.value, ';')
  if (!statements.ok) return failure('开场变量命令包含未闭合的引号、括号或数组。')
  const operations = []
  for (const statement of statements.parts) {
    const text = statement.trim()
    if (text.length === 0) continue
    const match = /^_\.([A-Za-z]+)\s*\(([\s\S]*)\)$/u.exec(text)
    if (match === null) return failure('开场变量更新包含无法识别的脚本或命令。')
    const sourceCommand = match[1].toLowerCase()
    const command = COMMAND_ALIASES[sourceCommand] ?? sourceCommand
    if (!COMMANDS.has(command)) return failure(`开场变量命令 _.${sourceCommand} 不在安全兼容范围内。`)
    const split = splitTopLevel(match[2], ',')
    if (!split.ok) return failure(`开场变量命令 _.${sourceCommand} 的参数没有完整闭合。`)
    const parsed = parseOperation(command, sourceCommand, split.parts)
    if (!parsed.ok) return parsed
    operations.push(parsed.operation)
  }
  return operations.length === 0
    ? failure('开场更新中没有可转换的变量命令。')
    : { ok: true, operations }
}

function parseOperation(command, sourceCommand, args) {
  if (command === 'set') {
    if (![2, 3].includes(args.length)) return failure('开场 _.set 必须包含路径和新值，也可以在两者之间保留旧值。')
    const path = decodePath(args[0], { allowRoot: true, command: sourceCommand })
    if (!path.ok) return path
    const value = decodeValue(args.at(-1), sourceCommand)
    return value.ok ? success({ op: 'set', sourceCommand, ...path.path, value: value.value }) : value
  }
  if (command === 'add') {
    if (args.length !== 2) return failure('开场 _.add 必须包含路径和增量。')
    const path = decodePath(args[0], { allowRoot: true, command: sourceCommand })
    if (!path.ok) return path
    const decoded = decodeValue(args[1], sourceCommand)
    if (!decoded.ok) return decoded
    const by = typeof decoded.value === 'number'
      ? decoded.value
      : typeof decoded.value === 'string' && /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/iu.test(decoded.value)
        ? Number(decoded.value)
        : Number.NaN
    if (!Number.isFinite(by)) return failure('开场 _.add 的增量必须是有限数字字面量。')
    return success({ op: 'add', sourceCommand, ...path.path, by })
  }
  if (command === 'insert') {
    if (![2, 3].includes(args.length)) return failure(`开场 _.${sourceCommand} 必须包含路径和值，也可以指定数组索引或对象键。`)
    const path = decodePath(args[0], { allowRoot: true, command: sourceCommand })
    if (!path.ok) return path
    const value = decodeValue(args.at(-1), sourceCommand)
    if (!value.ok) return value
    if (args.length === 2) return success({ op: 'insert', sourceCommand, ...path.path, value: value.value })
    const selector = decodeValue(args[1], sourceCommand)
    if (!selector.ok) return selector
    if (!isKeyOrIndex(selector.value)) return failure(`开场 _.${sourceCommand} 的索引或对象键必须是字符串或安全整数。`)
    if (typeof selector.value === 'string' && !safeKey(selector.value, { allowDash: true })) {
      return failure(`开场 _.${sourceCommand} 的索引或对象键不安全。`)
    }
    return success({ op: 'insert', sourceCommand, ...path.path, selector: selector.value, value: value.value })
  }
  if (command === 'delete') {
    if (![1, 2].includes(args.length)) return failure(`开场 _.${sourceCommand} 必须包含路径，也可以指定数组索引、数组值或对象键。`)
    const path = decodePath(args[0], { allowRoot: args.length === 2, command: sourceCommand })
    if (!path.ok) return path
    if (args.length === 1) return success({ op: 'delete', sourceCommand, ...path.path })
    const selector = decodeValue(args[1], sourceCommand)
    if (!selector.ok) return selector
    return success({ op: 'delete', sourceCommand, ...path.path, selector: selector.value })
  }
  if (args.length !== 2) return failure('开场 _.move 必须包含来源路径和目标路径。')
  const from = decodePath(args[0], { allowRoot: false, command: sourceCommand })
  if (!from.ok) return from
  const to = decodePath(args[1], { allowRoot: true, command: sourceCommand })
  if (!to.ok) return to
  if (isProperPrefix(from.path.segments, to.path.segments)) return failure('开场 _.move 不能把变量移动到自身的下级路径。')
  return success({
    op: 'move',
    sourceCommand,
    fromPath: from.path.path,
    fromSegments: from.path.segments,
    path: to.path.path,
    segments: to.path.segments,
  })
}

function decodePath(input, { allowRoot, command }) {
  const decoded = decodeMvuLiteral(input)
  if (!decoded.ok || typeof decoded.value !== 'string') {
    return failure(`开场 _.${command} 的变量路径必须是字符串字面量。`)
  }
  const segments = parseMvuPath(decoded.value, allowRoot)
  if (segments === undefined) return failure(`开场变量路径不安全：${decoded.value}`)
  return { ok: true, path: { path: decoded.value, segments } }
}

function decodeValue(input, command) {
  const decoded = decodeMvuLiteral(input)
  if (!decoded.ok || containsReservedMetadata(decoded.value)) {
    return failure(`开场 _.${command} 的值必须是安全且与 JSON 兼容的字面量。`)
  }
  return decoded
}

function parseMvuPath(value, allowRoot) {
  const text = value.trim()
  if (text.length === 0) return allowRoot ? [] : undefined
  const segments = []
  let index = 0
  let needsSegment = true
  while (index < text.length) {
    while (/\s/u.test(text[index] ?? '')) index += 1
    if (!needsSegment && !['.', '['].includes(text[index])) return undefined
    if (text[index] === '.') {
      if (needsSegment) return undefined
      needsSegment = true
      index += 1
      continue
    }
    if (text[index] === '[') {
      index += 1
      while (/\s/u.test(text[index] ?? '')) index += 1
      let segment
      if (text[index] === '"' || text[index] === "'") {
        const quote = text[index]
        const start = index
        index += 1
        let escaped = false
        while (index < text.length) {
          const character = text[index]
          index += 1
          if (escaped) escaped = false
          else if (character === '\\') escaped = true
          else if (character === quote) break
        }
        const literal = decodeMvuLiteral(text.slice(start, index))
        if (!literal.ok || typeof literal.value !== 'string') return undefined
        segment = literal.value
      } else {
        const end = text.indexOf(']', index)
        if (end < 0) return undefined
        segment = text.slice(index, end).trim()
        index = end
      }
      while (/\s/u.test(text[index] ?? '')) index += 1
      if (text[index] !== ']') return undefined
      index += 1
      if (!pushPathSegment(segments, String(segment))) return undefined
      needsSegment = false
      continue
    }
    const start = index
    while (index < text.length && text[index] !== '.' && text[index] !== '[') index += 1
    const segment = text.slice(start, index).trim()
    if (!pushPathSegment(segments, segment)) return undefined
    needsSegment = false
  }
  if (needsSegment) return undefined
  const normalized = PATH_PREFIXES.has(segments[0]) ? segments.slice(1) : segments
  if (normalized.length === 0) return allowRoot ? [] : undefined
  return normalized.length <= MAX_MVU_PATH_SEGMENTS ? normalized : undefined
}

function pushPathSegment(segments, segment) {
  if (!safeKey(segment)) return false
  segments.push(segment)
  return true
}

function safeKey(value, { allowDash = false } = {}) {
  return typeof value === 'string'
    && value.length > 0
    && !/[\u0000-\u001f\u007f]/u.test(value)
    && !RESERVED_KEYS.has(value)
    && !value.startsWith('_')
    && (allowDash || value !== '-')
}

function containsReservedMetadata(value) {
  if (value === MVU_ARRAY_EXTENSIBLE_MARKER) return true
  if (Array.isArray(value)) return value.some(containsReservedMetadata)
  if (!record(value)) return false
  return Object.entries(value).some(([key, child]) => !safeKey(key) || containsReservedMetadata(child))
}

function stripComments(value) {
  let result = ''
  let quote
  let escaped = false
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index]
    if (quote !== undefined) {
      result += character
      if (escaped) escaped = false
      else if (character === '\\') escaped = true
      else if (character === quote) quote = undefined
      continue
    }
    if (character === '"' || character === "'" || character === '`') {
      quote = character
      result += character
      continue
    }
    if (character === '/' && value[index + 1] === '/') {
      index += 2
      while (index < value.length && !['\n', '\r'].includes(value[index])) index += 1
      if (index < value.length) result += value[index]
      continue
    }
    if (character === '/' && value[index + 1] === '*') {
      const end = value.indexOf('*/', index + 2)
      if (end < 0) return failure('开场变量命令包含未闭合的注释。')
      index = end + 1
      continue
    }
    result += character
  }
  return { ok: true, value: result }
}

function splitTopLevel(value, delimiter) {
  const parts = []
  const stack = []
  let start = 0
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
    if (character === '"' || character === "'" || character === '`') {
      quote = character
      continue
    }
    if ('([{'.includes(character)) stack.push(character)
    else if (')]}'.includes(character)) {
      const expected = { ')': '(', ']': '[', '}': '{' }[character]
      if (stack.pop() !== expected) return { ok: false }
    } else if (character === delimiter && stack.length === 0) {
      parts.push(value.slice(start, index).trim())
      start = index + 1
    }
  }
  if (quote !== undefined || stack.length > 0) return { ok: false }
  parts.push(value.slice(start).trim())
  return { ok: true, parts: parts.filter(Boolean) }
}

function isKeyOrIndex(value) {
  return typeof value === 'string' || Number.isSafeInteger(value)
}

function isProperPrefix(left, right) {
  return left.length < right.length && left.every((segment, index) => segment === right[index])
}

function success(operation) { return { ok: true, operation } }
function failure(message) { return { ok: false, message } }
function record(value) { return typeof value === 'object' && value !== null && !Array.isArray(value) }
