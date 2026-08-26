import { decodeMvuLiteral } from './initial-value.js'

const MAX_MVU_PATH_SEGMENTS = 64
const MAX_MVU_PATH_EXPANSIONS = 512
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

/**
 * Resolve one MVU semantic-rule path into exact native targets when the
 * wildcard domain is closed, or one guidance-only group target otherwise.
 */
export function resolveMvuSemanticRulePath(rawSegments, initialValue, schema) {
  const parsed = parseRulePath(rawSegments)
  if (!parsed.ok) return parsed
  const targets = []
  for (const pattern of parsed.patterns) {
    const wildcard = pattern.findIndex(segment => segment.kind !== 'literal')
    if (wildcard < 0) {
      targets.push({ segments: pattern.map(segment => segment.value), group: false, pattern })
      continue
    }
    const enumerated = enumeratePattern(pattern, initialValue, schema)
    if (enumerated.closed && enumerated.paths.length > 0) {
      for (const segments of enumerated.paths) targets.push({ segments, group: false, pattern })
      continue
    }
    targets.push({
      segments: pattern.slice(0, wildcard).map(segment => segment.value),
      group: true,
      pattern,
      concreteSegments: enumerated.paths,
    })
  }
  return { ok: true, targets: deduplicateTargets(targets) }
}

/** Return every schema node governed by one resolved exact or group rule. */
export function ensureMvuSemanticSchemaTargets(schema, target) {
  if (!target.group) {
    const node = ensureExactSchemaPath(schema, target.segments)
    return node === undefined ? [] : [node]
  }
  const nodes = ensurePatternSchemaTargets(schema, target.pattern, 0)
  return [...new Set(nodes)]
}

/** Render a parsed path pattern for diagnostics without claiming JSON Pointer wildcard support. */
export function renderMvuSemanticPattern(pattern) {
  if (pattern.length === 0) return '<root>'
  let output = ''
  for (const segment of pattern) {
    if (segment.kind === 'literal' && !/[.\[\]\s]/u.test(segment.value) && segment.value !== '*') {
      output += `${output.length === 0 ? '' : '.'}${segment.value}`
    } else if (segment.kind === 'literal') output += `[${JSON.stringify(segment.value)}]`
    else output += `${output.length === 0 ? '' : '.'}${segment.kind === 'glob' ? '*' : `\${${segment.label}}`}`
  }
  return output
}

function parseRulePath(rawSegments) {
  let patterns = [[]]
  for (const rawSegment of rawSegments) {
    if (typeof rawSegment !== 'string' || rawSegment.trim().length === 0) {
      return failure('MVU 规则路径必须由非空文本组成。')
    }
    const alternatives = splitTopLevelAlternatives(rawSegment)
    if (!alternatives.ok) return alternatives
    const parsedAlternatives = []
    for (const alternative of alternatives.values) {
      const parsed = parsePathAlternative(alternative)
      if (!parsed.ok) return parsed
      parsedAlternatives.push(...parsed.patterns)
    }
    patterns = crossProduct(patterns, parsedAlternatives)
    if (patterns.length > MAX_MVU_PATH_EXPANSIONS) return failure(`MVU 规则路径展开超过 ${MAX_MVU_PATH_EXPANSIONS} 项。`)
  }
  patterns = patterns.map(pattern => {
    const normalized = pattern[0]?.kind === 'literal' && PATH_PREFIXES.has(pattern[0].value)
      ? pattern.slice(1)
      : pattern
    return normalized
  })
  if (patterns.some(pattern => pattern.length === 0 || pattern.length > MAX_MVU_PATH_SEGMENTS)) {
    return failure(`MVU 规则路径必须包含 1～${MAX_MVU_PATH_SEGMENTS} 段。`)
  }
  return { ok: true, patterns }
}

function parsePathAlternative(value) {
  const text = value.trim()
  if (text.length === 0) return failure('MVU 规则路径并集包含空路径。')
  let patterns = [[]]
  let index = 0
  let needsSegment = true
  while (index < text.length) {
    while (/\s/u.test(text[index] ?? '')) index += 1
    if (!needsSegment && !['.', '['].includes(text[index])) return failure(`无法安全解析 MVU 规则路径“${value}”。`)
    if (text[index] === '.') {
      if (needsSegment) return failure(`无法安全解析 MVU 规则路径“${value}”。`)
      needsSegment = true
      index += 1
      continue
    }
    let options
    if (text[index] === '[') {
      const bracket = readBracketSegment(text, index)
      if (!bracket.ok) return bracket
      options = [{ kind: 'literal', value: bracket.value }]
      index = bracket.index
    } else if (text.startsWith('${', index)) {
      const placeholder = readPlaceholder(text, index)
      if (!placeholder.ok) return placeholder
      options = placeholder.options
      index = placeholder.index
    } else {
      const start = index
      while (index < text.length && text[index] !== '.' && text[index] !== '[') index += 1
      const segment = text.slice(start, index).trim()
      if (segment === '*') options = [{ kind: 'glob' }]
      else {
        if (segment.includes('${') || !safeKey(segment)) return failure(`MVU 规则路径包含不安全字段“${segment}”。`)
        options = [{ kind: 'literal', value: segment }]
      }
    }
    patterns = crossProduct(patterns, options.map(option => [option]))
    if (patterns.length > MAX_MVU_PATH_EXPANSIONS) return failure(`MVU 规则路径展开超过 ${MAX_MVU_PATH_EXPANSIONS} 项。`)
    needsSegment = false
  }
  return needsSegment ? failure(`无法安全解析 MVU 规则路径“${value}”。`) : { ok: true, patterns }
}

function readBracketSegment(text, start) {
  let index = start + 1
  while (/\s/u.test(text[index] ?? '')) index += 1
  let value
  if (text[index] === '"' || text[index] === "'") {
    const quoteStart = index
    const quote = text[index]
    let escaped = false
    index += 1
    while (index < text.length) {
      const character = text[index]
      index += 1
      if (escaped) escaped = false
      else if (character === '\\') escaped = true
      else if (character === quote) break
    }
    const decoded = decodeMvuLiteral(text.slice(quoteStart, index))
    if (!decoded.ok || typeof decoded.value !== 'string') return failure(`MVU 规则路径包含无效的括号字段：${text.slice(start)}`)
    value = decoded.value
  } else {
    const end = text.indexOf(']', index)
    if (end < 0) return failure(`MVU 规则路径包含未闭合的括号：${text.slice(start)}`)
    value = text.slice(index, end).trim()
    index = end
  }
  while (/\s/u.test(text[index] ?? '')) index += 1
  if (text[index] !== ']' || !safeKey(value)) return failure(`MVU 规则路径包含不安全的括号字段“${String(value)}”。`)
  return { ok: true, value, index: index + 1 }
}

function readPlaceholder(text, start) {
  const end = text.indexOf('}', start + 2)
  if (end < 0) return failure(`MVU 规则路径包含未闭合的占位符：${text.slice(start)}`)
  const source = text.slice(start + 2, end).trim()
  const separator = source.indexOf(':')
  const label = (separator < 0 ? source : source.slice(0, separator)).trim()
  if (!safePlaceholderLabel(label)) return failure(`MVU 规则路径占位符名称“${label}”无效。`)
  if (separator < 0) return { ok: true, options: [{ kind: 'placeholder', label }], index: end + 1 }
  const alternatives = source.slice(separator + 1).split('|').map(candidate => candidate.trim()).filter(Boolean)
  if (alternatives.length === 0) return failure(`MVU 规则路径占位符“${label}”没有候选值。`)
  const values = alternatives.map(decodePlaceholderAlternative)
  if (values.some(value => value === undefined)) return failure(`MVU 规则路径占位符“${label}”包含不安全候选值。`)
  return {
    ok: true,
    options: values.map(value => ({ kind: 'literal', value })),
    index: end + 1,
  }
}

function decodePlaceholderAlternative(value) {
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    const decoded = decodeMvuLiteral(value)
    return decoded.ok && typeof decoded.value === 'string' && safeKey(decoded.value) ? decoded.value : undefined
  }
  return safeKey(value) && !/[.\[\]]/u.test(value) ? value : undefined
}

function splitTopLevelAlternatives(value) {
  const values = []
  let start = 0
  let braceDepth = 0
  let bracketDepth = 0
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
    if (character === '"' || character === "'") {
      quote = character
      continue
    }
    if (character === '$' && value[index + 1] === '{') {
      braceDepth += 1
      index += 1
      continue
    }
    if (character === '}' && braceDepth > 0) braceDepth -= 1
    else if (character === '[' && braceDepth === 0) bracketDepth += 1
    else if (character === ']' && braceDepth === 0) bracketDepth -= 1
    else if (character === '|' && braceDepth === 0 && bracketDepth === 0) {
      values.push(value.slice(start, index).trim())
      start = index + 1
    }
    if (braceDepth < 0 || bracketDepth < 0) return failure(`MVU 规则路径“${value}”括号不匹配。`)
  }
  if (quote !== undefined || braceDepth !== 0 || bracketDepth !== 0) return failure(`MVU 规则路径“${value}”没有完整闭合。`)
  values.push(value.slice(start).trim())
  return values.some(item => item.length === 0) ? failure(`MVU 规则路径“${value}”包含空并集项。`) : { ok: true, values }
}

function enumeratePattern(pattern, initialValue, schema) {
  const paths = []
  let completelyClosed = true
  const visit = (index, value, currentSchema, segments) => {
    if (paths.length > MAX_MVU_PATH_EXPANSIONS) return
    if (index === pattern.length) {
      paths.push(segments)
      return
    }
    const token = pattern[index]
    if (token.kind === 'literal') {
      visit(index + 1, childValue(value, token.value), childSchema(currentSchema, token.value), [...segments, token.value])
      return
    }
    const domain = wildcardDomain(value, currentSchema)
    if (!domain.closed || domain.keys.length === 0) completelyClosed = false
    for (const key of domain.keys) {
      visit(index + 1, childValue(value, key), childSchema(currentSchema, key), [...segments, key])
    }
  }
  visit(0, initialValue, schema, [])
  return { paths: deduplicatePaths(paths), closed: completelyClosed && paths.length <= MAX_MVU_PATH_EXPANSIONS }
}

function wildcardDomain(value, schema) {
  const keys = new Set()
  if (record(value)) for (const key of Object.keys(value)) if (safeKey(key)) keys.add(key)
  if (record(schema?.properties)) for (const key of Object.keys(schema.properties)) if (safeKey(key)) keys.add(key)
  if (Array.isArray(value)) for (let index = 0; index < value.length; index += 1) keys.add(String(index))
  const closedObject = schema?.type === 'object' && schema.additionalProperties === false
  const closedArray = schema?.type === 'array'
    && Number.isSafeInteger(schema.maxItems)
    && schema.maxItems === value?.length
  return { keys: [...keys], closed: closedObject || closedArray }
}

function ensurePatternSchemaTargets(schema, pattern, index) {
  if (index === pattern.length) return [schema]
  const token = pattern[index]
  if (schemaTypes(schema).includes('array')) {
    if (token.kind === 'literal' && !arrayIndex(token.value)) return []
    const item = ensureArrayItem(schema)
    return item === undefined ? [] : ensurePatternSchemaTargets(item, pattern, index + 1)
  }
  if (token.kind === 'literal') {
    const child = ensureObjectProperty(schema, token.value)
    return child === undefined ? [] : ensurePatternSchemaTargets(child, pattern, index + 1)
  }
  if (!ensureObjectSchema(schema)) return []
  const nodes = []
  for (const child of Object.values(schema.properties)) nodes.push(...ensurePatternSchemaTargets(child, pattern, index + 1))
  const shouldMaterializeAdditional = record(schema.additionalProperties)
    || schema.additionalProperties === true
    || (token.kind === 'placeholder' && Object.keys(schema.properties).length === 0)
  if (shouldMaterializeAdditional) {
    if (!record(schema.additionalProperties)) schema.additionalProperties = {}
    nodes.push(...ensurePatternSchemaTargets(schema.additionalProperties, pattern, index + 1))
  }
  return nodes
}

function ensureExactSchemaPath(schema, segments) {
  let current = schema
  for (const segment of segments) {
    if (schemaTypes(current).includes('array')) {
      if (!arrayIndex(segment)) return undefined
      current = ensureArrayItem(current)
    } else current = ensureObjectProperty(current, segment)
    if (current === undefined) return undefined
  }
  return current
}

function ensureObjectProperty(schema, key) {
  if (!ensureObjectSchema(schema)) return undefined
  if (!record(schema.properties[key])) schema.properties[key] = {}
  return schema.properties[key]
}

function ensureObjectSchema(schema) {
  const types = schemaTypes(schema)
  if (types.length > 0 && !types.includes('object') && !types.every(type => type === 'null')) return false
  if (schema.type === 'null') schema.type = ['object', 'null']
  else if (schema.type === undefined) schema.type = 'object'
  if (!record(schema.properties)) schema.properties = {}
  if (schema.additionalProperties === undefined) schema.additionalProperties = false
  return true
}

function ensureArrayItem(schema) {
  const types = schemaTypes(schema)
  if (!types.includes('array')) return undefined
  if (!record(schema.items)) schema.items = {}
  return schema.items
}

function schemaTypes(schema) {
  if (schema.type === undefined) return []
  return Array.isArray(schema.type) ? schema.type : [schema.type]
}

function arrayIndex(value) {
  return /^(?:0|[1-9]\d*)$/u.test(value)
}

function childValue(value, key) {
  if (record(value) && Object.prototype.hasOwnProperty.call(value, key)) return value[key]
  if (Array.isArray(value) && /^(?:0|[1-9]\d*)$/u.test(key)) return value[Number(key)]
  return undefined
}

function childSchema(schema, key) {
  if (!record(schema)) return undefined
  if (schema.type === 'array') return schema.items
  return schema.properties?.[key] ?? (record(schema.additionalProperties) ? schema.additionalProperties : undefined)
}

function crossProduct(prefixes, suffixes) {
  return prefixes.flatMap(prefix => suffixes.map(suffix => [...prefix, ...suffix]))
}

function deduplicatePaths(paths) {
  return [...new Map(paths.map(path => [JSON.stringify(path), path])).values()]
}

function deduplicateTargets(targets) {
  return [...new Map(targets.map(target => [`${target.group ? 'group' : 'exact'}:${JSON.stringify(target.segments)}`, target])).values()]
}

function safePlaceholderLabel(value) {
  return value.length > 0 && !/[\u0000-\u001f\u007f{}]/u.test(value)
}

function safeKey(value) {
  return typeof value === 'string'
    && value.length > 0
    && !/[\u0000-\u001f\u007f]/u.test(value)
    && !RESERVED_KEYS.has(value)
    && !value.startsWith('_')
    && value !== '-'
}

function failure(message) { return { ok: false, message } }
function record(value) { return typeof value === 'object' && value !== null && !Array.isArray(value) }
