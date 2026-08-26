import { isAlias, isMap, isScalar, isSeq, parseDocument } from 'yaml'
import {
  applyMvuDeclaredSchema,
  matchesMvuDeclaredType,
  parseMvuDeclaredType,
} from './mvu-type.js'
import { hasMvuLegacyOperationSyntax, hasMvuLegacyOutputSyntax } from './mvu-control.js'
import {
  ensureMvuSemanticSchemaTargets,
  renderMvuSemanticPattern,
  resolveMvuSemanticRulePath,
} from './semantic-path.js'

const UPDATE_MARKER = /\[mvu_update\]/i
const OUTPUT_MARKER = /变量输出格式/i
const OUTPUT_DOCUMENT = /^\s*(?:#\s*)?变量输出格式\s*:/mu
const SEMANTIC_RULE_DOCUMENT = /^\s*(?:#\s*)?变量更新规则\s*:/mu
const RULE_FIELDS = new Set(['type', 'range', 'check', 'format'])
const OPERATION_FIELDS = new Set(['script', 'patch', 'patches', 'operation', 'operations', 'command', 'commands', 'output'])
const UNSAFE_KEYS = new Set(['__proto__', 'prototype', 'constructor'])
const GLOBAL_RULE_KEYS = new Set(['核心规则', '全局规则', '通用规则'])
const MAX_RULE_DOCUMENT_DEPTH = 64
const MAX_RULE_DOCUMENT_NODES = 100_000

/** True for an MVU lore entry that defines semantic rules or a legacy output protocol. */
export function isMvuUpdateControlEntry(entry) {
  const label = String(entry?.name ?? entry?.comment ?? '')
  const content = String(entry?.content ?? '')
  return UPDATE_MARKER.test(label)
    || OUTPUT_MARKER.test(label)
    || OUTPUT_DOCUMENT.test(content)
    || SEMANTIC_RULE_DOCUMENT.test(content)
    || hasMvuLegacyOperationSyntax(content)
    || hasMvuLegacyOutputSyntax(content)
}

/** Inspect declarative MVU semantic entries without executing operation protocols. */
export function inspectMvuUpdateRules(source, character, books) {
  const candidates = []
  const payload = record(source) ? source : {}
  const data = record(payload.data) ? payload.data : {}
  collectRuleCandidates(data.character_book ?? payload.character_book, '/source/character_book', candidates)
  collectRuleCandidates(character?.characterBook, '/character/characterBook', candidates)
  for (const [index, book] of (Array.isArray(books) ? books : []).entries()) {
    collectRuleCandidates(book, `/books/${index}`, candidates)
  }
  const seen = new Set()
  const documents = []
  const diagnostics = []
  for (const candidate of candidates) {
    const signature = candidate.content.trim()
    if (seen.has(signature)) continue
    seen.add(signature)
    const parsed = parseRuleDocument(candidate.content)
    if (parsed.ok) documents.push({ path: candidate.path, value: parsed.value })
    else diagnostics.push({
      code: 'MVU_UPDATE_RULE_UNCONVERTED',
      severity: 'error',
      path: candidate.path,
      message: `MVU 更新规则无法安全转换：${parsed.message}`,
    })
  }
  return { detected: candidates.length > 0, documents, diagnostics }
}

/** Convert inspected MVU semantics into native schema and rule records. */
export function convertMvuSemanticRules(documents, initialValue, sourceSchema) {
  const schema = structuredClone(sourceSchema)
  const leafByPath = new Map()
  const diagnostics = []
  let unsupported = false
  let machineEnforceable = true
  for (const document of documents) {
    walkRuleTree(document.value, [], document.path, (segments, leaf, path) => {
      const resolved = segments.length === 0
        ? { ok: true, targets: [{ segments: [], group: true, pattern: [] }] }
        : resolveMvuSemanticRulePath(segments, initialValue, sourceSchema)
      if (!resolved.ok) {
        diagnostics.push({
          code: 'MVU_UPDATE_RULE_UNCONVERTED',
          severity: 'error',
          path,
          message: resolved.message,
        })
        return
      }
      for (const target of resolved.targets) {
        const key = toPointer(target.segments)
        const candidate = {
          ...target,
          leaf,
          path,
          wildcardCount: target.pattern.filter(segment => segment.kind !== 'literal').length,
        }
        const previous = leafByPath.get(key)
        if (previous === undefined || candidate.wildcardCount <= previous.wildcardCount) leafByPath.set(key, candidate)
      }
    }, diagnostics)
  }
  if (diagnostics.some(item => item.severity === 'error')) unsupported = true
  const rules = []
  let ruleIndex = 0
  for (const [declaredTarget, entry] of leafByPath) {
    let segments = entry.segments
    let target = declaredTarget
    let nodes = ensureMvuSemanticSchemaTargets(schema, entry)
    let current = valueAt(initialValue, segments)
    if (nodes.length === 0) {
      unsupported = true
      diagnostics.push({
        code: 'MVU_UPDATE_RULE_UNCONVERTED',
        severity: 'error',
        path: entry.path,
        message: `MVU 语义规则目标 ${target || '<root>'} 与已初始化的容器类型不兼容。`,
      })
      continue
    }
    const concrete = entry.group
      ? (entry.concreteSegments ?? []).map(candidate => valueAt(initialValue, candidate)).filter(candidate => candidate.found)
      : [current].filter(candidate => candidate.found)
    if (!entry.group && !current.found) diagnostics.push({
      code: 'MVU_RULE_TARGET_NOT_INITIALIZED',
      severity: 'warning',
      path: entry.path,
      message: `MVU 语义规则目标 ${target} 没有初始值；已保留为可选变量，请检查初始化路径是否一致。`,
    })
    if (entry.group) {
      machineEnforceable = false
      diagnostics.push({
        code: 'MVU_RULE_GROUP_NORMALIZED',
        severity: 'info',
        path: entry.path,
        message: `MVU 分组路径 ${renderMvuSemanticPattern(entry.pattern)} 已关联到原生变量组 ${target || '<root>'}；子变量写入由 Schema 校验。`,
      })
    }
    if (entry.leaf.type !== undefined) {
      const declared = parseMvuDeclaredType(entry.leaf.type)
      const redirected = entry.group || declared === undefined ? undefined : redirectSingleChildTarget(declared, current, segments)
      if (redirected !== undefined) {
        segments = redirected.segments
        target = toPointer(segments)
        current = redirected.current
        nodes = ensureMvuSemanticSchemaTargets(schema, { ...entry, group: false, segments })
        diagnostics.push({
          code: 'MVU_RULE_TARGET_NORMALIZED',
          severity: 'info',
          path: entry.path,
          message: `MVU 规则 ${declaredTarget} 的声明类型与其唯一子变量一致；已将语义规则关联到 ${target}。`,
        })
      }
      const typeValues = entry.group
        ? concrete
        : [current].filter(candidate => candidate.found)
      const mismatched = declared !== undefined
        && typeValues.some(candidate => !matchesMvuDeclaredType(declared, candidate.value))
      if (declared === undefined || mismatched) {
        unsupported = true
        diagnostics.push({
          code: 'MVU_RULE_TYPE_UNCONVERTED',
          severity: 'error',
          path: `${entry.path}/type`,
          message: declared === undefined
            ? `不支持 MVU 变量类型“${String(entry.leaf.type)}”。`
            : `MVU 声明类型 ${declared.type} 与初始值不一致。`,
        })
      } else for (const node of nodes) applyMvuDeclaredSchema(node, declared)
    }
    if (entry.leaf.range !== undefined) {
      const range = parseRange(entry.leaf.range)
      const description = normalizeRangeDescription(entry.leaf.range)
      if (description === undefined) {
        unsupported = true
        diagnostics.push({
          code: 'MVU_RULE_RANGE_UNCONVERTED',
          severity: 'error',
          path: `${entry.path}/range`,
          message: 'MVU range 必须是非空文本或两个有限数值。',
        })
      } else for (const node of nodes) {
        const types = Array.isArray(node.type) ? node.type : [node.type]
        if (range !== undefined && types.some(type => ['number', 'integer'].includes(type))) {
          node.minimum = range.minimum
          node.maximum = range.maximum
          if (!isPlainNumericRange(entry.leaf.range)) appendSchemaDescription(node, `取值说明：${description}`)
        } else appendSchemaDescription(node, `取值说明：${description}`)
      }
    }
    const checks = normalizeChecks(entry.leaf.check, `${entry.path}/check`, diagnostics)
    if (entry.leaf.check !== undefined && checks === undefined) {
      unsupported = true
      continue
    }
    const format = normalizeFormat(entry.leaf.format, `${entry.path}/format`, diagnostics)
    if (entry.leaf.format !== undefined && format === undefined) {
      unsupported = true
      continue
    }
    if (format !== undefined) for (const node of nodes) if (node.type === undefined) node.type = 'string'
    const guidance = [
      ...(checks ?? []),
      ...(format === undefined ? [] : [`值格式：${format}`]),
    ]
    if (guidance.length === 0) continue
    ruleIndex += 1
    const numericTarget = !entry.group && current.found
      ? typeof current.value === 'number' && Number.isFinite(current.value)
      : !entry.group && nodes.some(node => (Array.isArray(node.type) ? node.type : [node.type]).some(type => ['number', 'integer'].includes(type)))
    const delta = numericTarget ? deriveDeltaRange(guidance) : undefined
    const cadence = guidance.some(isEveryTurnGuidance) ? 'every-turn' : 'when-applicable'
    const when = guidance.find(text => !isEveryTurnGuidance(text) && parseDeltaRange(text) === undefined) ?? guidance[0]
    const condition = entry.group ? undefined : deriveCondition(guidance, segments, target)
    if (current.found && (record(current.value) || Array.isArray(current.value))) machineEnforceable = false
    rules.push({
      id: `mvu-rule-${String(ruleIndex).padStart(3, '0')}`,
      target,
      when,
      ...(condition === undefined ? {} : { condition }),
      effect: delta === undefined
        ? { op: 'set' }
        : { op: 'increment', minimum: delta.minimum, maximum: delta.maximum },
      guidance: [
        ...(entry.group ? [`适用 MVU 路径模式：${renderMvuSemanticPattern(entry.pattern)}`] : []),
        ...guidance.filter(text => text !== when),
      ],
      cadence,
    })
  }
  return { schema, rules, diagnostics, unsupported, machineEnforceable }
}

function redirectSingleChildTarget(declared, current, segments) {
  if (!current.found || !record(current.value)) return undefined
  const entries = Object.entries(current.value)
  if (entries.length !== 1 || !matchesMvuDeclaredType(declared, entries[0][1])) return undefined
  return {
    segments: [...segments, entries[0][0]],
    current: { found: true, value: entries[0][1] },
  }
}

function walkRuleTree(node, segments, path, emit, diagnostics) {
  if (Array.isArray(node)
    && GLOBAL_RULE_KEYS.has(segments.at(-1))
    && node.length > 0
    && node.every(item => typeof item === 'string' && item.trim().length > 0)) {
    emit([], { check: node }, path)
    return
  }
  if (!record(node)) {
    diagnostics.push({ code: 'MVU_UPDATE_RULE_UNCONVERTED', severity: 'error', path, message: 'MVU 更新规则节点必须是对象。' })
    return
  }
  const keys = Object.keys(node)
  const ruleKeys = keys.filter(key => RULE_FIELDS.has(key))
  const operationKeys = keys.filter(key => OPERATION_FIELDS.has(key))
  if (ruleKeys.length > 0) {
    if (segments.length === 0) {
      diagnostics.push({
        code: 'MVU_UPDATE_RULE_UNCONVERTED',
        severity: 'error',
        path,
        message: 'MVU 更新规则缺少变量路径。',
      })
      return
    }
    if (operationKeys.length > 0) diagnostics.push(operationLogicDiagnostic(path, operationKeys))
    emit(segments, Object.fromEntries(Object.entries(node).filter(([key]) => RULE_FIELDS.has(key))), path)
    for (const [key, child] of Object.entries(node)) {
      if (RULE_FIELDS.has(key) || OPERATION_FIELDS.has(key)) continue
      if (UNSAFE_KEYS.has(key)) {
        diagnostics.push({ code: 'MVU_UPDATE_RULE_UNCONVERTED', severity: 'error', path, message: `MVU 更新规则包含不安全字段“${key}”。` })
        continue
      }
      walkRuleTree(child, [...segments, key], `${path}/${escapePointer(key)}`, emit, diagnostics)
    }
    return
  }
  if (operationKeys.length > 0) {
    const unknown = keys.find(key => !OPERATION_FIELDS.has(key))
    if (unknown === undefined) {
      diagnostics.push(operationLogicDiagnostic(path, operationKeys))
      return
    }
  }
  for (const [key, child] of Object.entries(node)) {
    if (UNSAFE_KEYS.has(key)) {
      diagnostics.push({ code: 'MVU_UPDATE_RULE_UNCONVERTED', severity: 'error', path, message: `MVU 更新规则包含不安全字段“${key}”。` })
      continue
    }
    walkRuleTree(child, [...segments, key], `${path}/${escapePointer(key)}`, emit, diagnostics)
  }
}

function deriveCondition(checks, segments, target) {
  const conditions = []
  const parent = segments.slice(0, -1)
  for (const check of checks) {
    const only = /仅在【([^】]+)】/u.exec(check)
    if (only !== null) {
      const equal = /^(.+?)为\s*([+-]?\d+(?:\.\d+)?)$/u.exec(only[1].trim())
      const threshold = /^(.+?)达到\s*([+-]?\d+(?:\.\d+)?)以上$/u.exec(only[1].trim())
      if (equal !== null) conditions.push(stateComparison([...parent, equal[1].trim()], '==', Number(equal[2])))
      else if (threshold !== null) conditions.push(stateComparison([...parent, threshold[1].trim()], '>=', Number(threshold[2])))
    }
    const immutable = /一旦更新为\s*([+-]?\d+(?:\.\d+)?)，?则?不再变动/u.exec(check)
    if (immutable !== null) conditions.push(`state("story", ${JSON.stringify(target)}) != ${Number(immutable[1])}`)
  }
  return conditions.length === 0 ? undefined : [...new Set(conditions)].join(' && ')
}

function stateComparison(segments, operator, value) {
  return `state("story", ${JSON.stringify(toPointer(segments))}) ${operator} ${value}`
}

function parseDeltaRange(value) {
  if (typeof value !== 'string' || !/单次[^。；\n]*(?:变化|调整)/u.test(value)) return undefined
  const match = /(?:范围(?:为)?\s*)?[【\[]?\s*([+-]?\d+(?:\.\d+)?)\s*[,，~～至]\s*([+-]?\d+(?:\.\d+)?)\s*[】\]]?/u.exec(value)
  if (match === null) return undefined
  const minimum = Number(match[1])
  const maximum = Number(match[2])
  return Number.isFinite(minimum) && Number.isFinite(maximum) && minimum <= maximum ? { minimum, maximum } : undefined
}

function deriveDeltaRange(guidance) {
  const declared = guidance.map(parseDeltaRange).find(Boolean)
  if (declared !== undefined) return declared
  if (guidance.some(text => /(?:超过|达到)[^。；\n]*(?:归|重置|恢复为)/u.test(text))) return undefined
  const deltas = []
  for (const text of guidance) {
    for (const match of text.matchAll(/(?:^|[^\d.])([+-]\d+(?:\.\d+)?)(?![\d.])/gu)) {
      const value = Number(match[1])
      if (Number.isFinite(value)) deltas.push(value)
    }
  }
  return deltas.length === 0 ? undefined : { minimum: Math.min(...deltas), maximum: Math.max(...deltas) }
}

function parseRange(value) {
  if (Array.isArray(value) && value.length === 2) {
    const minimum = Number(value[0])
    const maximum = Number(value[1])
    return Number.isFinite(minimum) && Number.isFinite(maximum) && minimum <= maximum ? { minimum, maximum } : undefined
  }
  if (typeof value !== 'string') return undefined
  const match = /^\s*[【\[]?\s*([+-]?\d+(?:\.\d+)?)\s*(?:~|～|至|,|，)\s*([+-]?\d+(?:\.\d+)?)\s*[】\]]?\s*$/u.exec(value)
    ?? /(?:capped\s+in|取值范围(?:为)?|范围(?:为)?)\s*[【\[]?\s*([+-]?\d+(?:\.\d+)?)\s*(?:-|~|～|至|,|，)\s*([+-]?\d+(?:\.\d+)?)/iu.exec(value)
  if (match === null) return undefined
  const minimum = Number(match[1])
  const maximum = Number(match[2])
  return Number.isFinite(minimum) && Number.isFinite(maximum) && minimum <= maximum ? { minimum, maximum } : undefined
}

function normalizeRangeDescription(value) {
  if (typeof value === 'string') return value.trim().length === 0 ? undefined : value.trim()
  if (!Array.isArray(value) || value.length !== 2) return undefined
  const minimum = Number(value[0])
  const maximum = Number(value[1])
  return Number.isFinite(minimum) && Number.isFinite(maximum) && minimum <= maximum
    ? `${minimum}～${maximum}`
    : undefined
}

function isPlainNumericRange(value) {
  return Array.isArray(value)
    || (typeof value === 'string' && /^\s*[【\[]?\s*[+-]?\d+(?:\.\d+)?\s*(?:~|～|至|,|，)\s*[+-]?\d+(?:\.\d+)?\s*[】\]]?\s*$/u.test(value))
}

function appendSchemaDescription(node, description) {
  node.description = typeof node.description === 'string' && node.description.length > 0
    ? `${node.description}\n${description}`
    : description
}

function normalizeChecks(value, path, diagnostics) {
  if (value === undefined) return undefined
  const values = typeof value === 'string' ? [value] : value
  if (!Array.isArray(values) || values.length === 0 || values.some(item => typeof item !== 'string' || item.trim().length === 0)) {
    diagnostics.push({ code: 'MVU_UPDATE_RULE_UNCONVERTED', severity: 'error', path, message: 'MVU check 必须是非空文本或非空文本数组。' })
    return undefined
  }
  return values.map(item => item.trim())
}

function normalizeFormat(value, path, diagnostics) {
  if (value === undefined) return undefined
  if (typeof value !== 'string' || value.trim().length === 0) {
    diagnostics.push({ code: 'MVU_UPDATE_RULE_UNCONVERTED', severity: 'error', path, message: 'MVU format 必须是非空文本。' })
    return undefined
  }
  return value.trim()
}

function collectRuleCandidates(book, path, candidates) {
  const entries = Array.isArray(book?.entries) ? book.entries : record(book?.entries) ? Object.values(book.entries) : []
  for (const [index, entry] of entries.entries()) {
    if (!record(entry)) continue
    const content = String(entry.content ?? '')
    const semantic = extractSemanticRuleDocument(content)
    if (semantic === undefined) continue
    candidates.push({ path: `${path}/entries/${index}`, content: semantic })
  }
}

function extractSemanticRuleDocument(content) {
  const source = String(content).replaceAll('\r\n', '\n').replaceAll('\r', '\n')
  const heading = /^(\s*)(?:#\s*)?变量更新规则\s*:\s*$/mu.exec(source)
  if (heading === null) return undefined
  const baseIndent = indentation(heading[1])
  const lines = source.slice(heading.index + heading[0].length).split('\n')
  const body = []
  for (const line of lines) {
    if (line.trim().length === 0) {
      body.push(line)
      continue
    }
    if (indentation(/^\s*/u.exec(line)[0]) <= baseIndent) break
    body.push(line)
  }
  return `变量更新规则:\n${body.join('\n')}`.trim()
}

function parseRuleDocument(content) {
  const source = normalizeSemanticRuleHeading(String(content).replace(UPDATE_MARKER, ''))
  const text = normalizeSemanticGlobalRuleLists(normalizeSemanticCheckBlocks(normalizeSemanticScalarFields(quotePlaceholderKeys(source)))).trim()
  if (text.length === 0) return { ok: false, message: '规则内容为空。' }
  try {
    const document = parseDocument(text, {
      schema: 'core',
      merge: false,
      prettyErrors: false,
      strict: true,
      uniqueKeys: false,
    })
    if (document.errors.length > 0) throw document.errors[0]
    const parsed = convertRuleYamlNode(document.contents, '$', 0, { nodes: 0 })
    if (!record(parsed)) return { ok: false, message: '规则根节点必须是对象。' }
    const value = record(parsed['变量更新规则']) ? parsed['变量更新规则'] : parsed
    return record(value) ? { ok: true, value } : { ok: false, message: '“变量更新规则”必须是对象。' }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) }
  }
}

function normalizeSemanticGlobalRuleLists(value) {
  const lines = value.split('\n')
  for (let index = 0; index < lines.length; index += 1) {
    const heading = /^(\s*)(核心规则|全局规则|通用规则):\s*$/u.exec(lines[index])
    if (heading === null) continue
    const baseIndent = indentation(heading[1])
    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const line = lines[cursor]
      if (line.trim().length === 0) continue
      const lineIndent = indentation(/^\s*/u.exec(line)[0])
      if (lineIndent <= baseIndent) break
      const item = /^(\s*)-\s*(.*?)\s*$/u.exec(line)
      if (item !== null && item[2].length > 0) lines[cursor] = `${item[1]}- ${JSON.stringify(unquoteSemanticText(item[2]))}`
    }
  }
  return lines.join('\n')
}

function convertRuleYamlNode(node, path, depth, state) {
  state.nodes += 1
  if (state.nodes > MAX_RULE_DOCUMENT_NODES) throw new Error(`MVU 规则超过 ${MAX_RULE_DOCUMENT_NODES} 个节点。`)
  if (depth > MAX_RULE_DOCUMENT_DEPTH) throw new Error(`MVU 规则超过 ${MAX_RULE_DOCUMENT_DEPTH} 层。`)
  if (node === null || node === undefined) return null
  if (isAlias(node)) throw new Error('MVU 规则不支持 YAML 锚点或别名。')
  if (node.tag !== undefined) throw new Error(`MVU 规则不支持 YAML 标签“${node.tag}”。`)
  if (isScalar(node)) return normalizeRuleScalar(node.value, path)
  if (isSeq(node)) return node.items.map((item, index) => convertRuleYamlNode(item, `${path}[${index}]`, depth + 1, state))
  if (!isMap(node)) throw new Error(`MVU 规则节点 ${path} 不是声明式值。`)
  const output = {}
  for (const pair of node.items) {
    if (!isScalar(pair.key) || typeof pair.key.value !== 'string' || pair.key.value.length === 0) {
      throw new Error(`MVU 规则字段 ${path} 必须是非空文本。`)
    }
    const key = pair.key.value
    if (UNSAFE_KEYS.has(key)) throw new Error(`MVU 规则包含不安全字段“${key}”。`)
    const childPath = `${path}/${escapePointer(key)}`
    const value = convertRuleYamlNode(pair.value, childPath, depth + 1, state)
    output[key] = Object.hasOwn(output, key)
      ? mergeDuplicateRuleValue(output[key], value, childPath)
      : value
  }
  return output
}

function mergeDuplicateRuleValue(left, right, path) {
  if (record(left) && record(right)) {
    const output = structuredClone(left)
    for (const [key, value] of Object.entries(right)) {
      const childPath = `${path}/${escapePointer(key)}`
      output[key] = Object.hasOwn(output, key)
        ? mergeDuplicateRuleValue(output[key], value, childPath)
        : structuredClone(value)
    }
    return output
  }
  if (Array.isArray(left) && Array.isArray(right)) return [...structuredClone(left), ...structuredClone(right)]
  if (Object.is(left, right)) return structuredClone(left)
  throw new Error(`MVU 规则重复字段 ${path} 的定义不一致。`)
}

function normalizeRuleScalar(value, path) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value
  if (typeof value === 'number' && Number.isFinite(value)) return value
  throw new Error(`MVU 规则字段 ${path} 不是 JSON 兼容的标量。`)
}

function normalizeSemanticRuleHeading(value) {
  return value.replace(/^(\s*)#\s*变量更新规则\s*:\s*$/mu, '$1变量更新规则:')
}

function normalizeSemanticScalarFields(value) {
  return value.split('\n').map(line => {
    const match = /^(\s*)(range|format):\s*(.*?)\s*$/u.exec(line)
    if (match === null || match[3].length === 0 || /^\[\s*[+-]?\d+(?:\.\d+)?\s*,\s*[+-]?\d+(?:\.\d+)?\s*\]$/u.test(match[3])) return line
    return `${match[1]}${match[2]}: ${JSON.stringify(unquoteSemanticText(match[3]))}`
  }).join('\n')
}

function normalizeSemanticCheckBlocks(value) {
  const lines = value.replaceAll('\r\n', '\n').replaceAll('\r', '\n').split('\n')
  const output = []
  for (let index = 0; index < lines.length; index += 1) {
    const match = /^(\s*)check:\s*(.*)$/u.exec(lines[index])
    if (match === null) {
      output.push(lines[index])
      continue
    }
    const indent = indentation(match[1])
    const inline = match[2].trim()
    if (inline.length > 0) {
      output.push(`${match[1]}check: ${JSON.stringify(unquoteSemanticText(inline))}`)
      continue
    }
    const block = []
    let cursor = index + 1
    while (cursor < lines.length) {
      const line = lines[cursor]
      if (line.trim().length === 0) {
        cursor += 1
        continue
      }
      const lineIndent = indentation(/^\s*/u.exec(line)[0])
      if (lineIndent < indent || (lineIndent === indent && !/^\s*-\s+/u.test(line))) break
      block.push(line)
      cursor += 1
    }
    const checks = flattenSemanticCheckBlock(block)
    output.push(`${match[1]}check:${checks.length === 0 ? ' []' : ''}`)
    for (const check of checks) output.push(`${match[1]}  - ${JSON.stringify(check)}`)
    index = cursor - 1
  }
  return output.join('\n')
}

function flattenSemanticCheckBlock(lines) {
  const output = []
  const headings = []
  for (const line of lines) {
    const match = /^(\s*)-\s*(.*?)\s*$/u.exec(line)
    if (match === null || match[2].length === 0) continue
    const indent = indentation(match[1])
    while (headings.length > 0 && headings.at(-1).indent >= indent) headings.pop()
    const text = unquoteSemanticText(match[2])
    if (/[:：]$/u.test(text)) {
      headings.push({ indent, text: text.replace(/[:：]+$/u, '').trim() })
      continue
    }
    const prefix = headings.map(item => item.text).filter(Boolean)
    output.push(prefix.length === 0 ? text : `${prefix.join(' / ')}：${text}`)
  }
  return output
}

function unquoteSemanticText(value) {
  if (value.length < 2) return value
  if (value.startsWith('"') && value.endsWith('"')) {
    try { return JSON.parse(value) } catch { return value }
  }
  if (value.startsWith("'") && value.endsWith("'")) return value.slice(1, -1).replaceAll("''", "'")
  return value
}

function operationLogicDiagnostic(path, fields) {
  return {
    code: 'MVU_OPERATION_LOGIC_IGNORED',
    severity: 'info',
    path,
    message: `已忽略 MVU 操作字段：${fields.join('、')}；变量写入仅使用 rp.state 原生协议。`,
  }
}

function isEveryTurnGuidance(value) {
  return /(?:每(?:一)?回合[^。；\n]*必须更新|每次对话[^。；\n]*(?:都要|必须)更新)/u.test(value)
}

function quotePlaceholderKeys(value) {
  return value.split('\n').map(line => {
    if (!line.includes('${')) return line
    const match = /^(\s*)(.*\$\{[^}\r\n]+\}.*):(\s*)$/u.exec(line)
    if (match === null) return line
    const key = match[2].trim()
    if (/^-\s/u.test(key) || /^(?:type|range|check|format|script|patch(?:es)?|operation(?:s)?|command(?:s)?|output)\s*:/u.test(key)) return line
    return `${match[1]}${JSON.stringify(key)}:${match[3]}`
  }).join('\n')
}

function indentation(value) {
  return [...value].reduce((count, character) => count + (character === '\t' ? 2 : 1), 0)
}

function valueAt(value, segments) {
  let current = value
  for (const segment of segments) {
    if (Array.isArray(current) && /^(?:0|[1-9]\d*)$/u.test(segment)) {
      const index = Number(segment)
      if (index >= current.length) return { found: false }
      current = current[index]
    } else {
      if (!record(current) || !Object.prototype.hasOwnProperty.call(current, segment)) return { found: false }
      current = current[segment]
    }
  }
  return { found: true, value: current }
}

function toPointer(segments) {
  return segments.length === 0 ? '' : `/${segments.map(escapePointer).join('/')}`
}

function escapePointer(value) {
  return String(value).replaceAll('~', '~0').replaceAll('/', '~1')
}

function record(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
