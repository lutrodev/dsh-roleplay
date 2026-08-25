import {
  normalizeStateDefinition,
  RP_STATE_DEFAULT_NAMESPACE,
  RP_STATE_PROTOCOL_VERSION,
} from 'dsh-roleplay-rp-state/definition'
import {
  convertMvuSemanticRules,
  inspectMvuUpdateRules,
  isMvuUpdateControlEntry,
} from './semantic-rules.js'

const UNSAFE_KEYS = new Set(['__proto__', 'prototype', 'constructor'])
const MVU_META_KEY = '$meta'
const MVU_ARRAY_EXTENSIBLE_MARKER = '$__META_EXTENSIBLE__$'
const MVU_META_FIELDS = new Set(['extensible', 'recursiveExtensible', 'required', 'template'])
const UNSAFE_CONVERSION_DIAGNOSTICS = new Set([
  'MVU_INIT_UNCONVERTED',
  'MVU_META_INVALID',
  'MVU_UPDATE_RULE_UNCONVERTED',
])

export { inspectMvuUpdateRules }

/** Convert one merged MVU value/rule set into the native Session State v2 bootstrap. */
export function materializeNativeMvuState({ initialValue, source, character, books, diagnostics = [] }) {
  const split = splitMvuValue(initialValue)
  const ruleInspection = inspectMvuUpdateRules(source, character, books)
  const setupDiagnostics = [...diagnostics, ...split.diagnostics, ...ruleInspection.diagnostics]
  const converted = convertMvuSemanticRules(ruleInspection.documents, split.value, split.schema)
  setupDiagnostics.push(...converted.diagnostics)
  const unsafeConversion = setupDiagnostics.some(item => UNSAFE_CONVERSION_DIAGNOSTICS.has(item.code)) || converted.unsupported
  const updateMode = unsafeConversion
    ? 'disabled'
    : converted.rules.length > 0 && converted.machineEnforceable ? 'rules-required' : 'schema-only'
  if (!unsafeConversion && converted.rules.length > 0 && !converted.machineEnforceable) {
    setupDiagnostics.push({
      code: 'MVU_SEMANTIC_RULES_MODEL_ENFORCED',
      severity: 'info',
      path: '/stateBootstrap/namespaces/story/definition/rules',
      message: '部分 MVU 语义规则作用于变量分组；规则已提供给模型理解，变量写入由原生操作协议与 Schema 校验。',
    })
  }
  if (unsafeConversion) {
    setupDiagnostics.push({
      code: 'MVU_STATE_DISABLED',
      severity: 'error',
      path: '/stateBootstrap/namespaces/story',
      message: '检测到无法安全解释的 MVU 初始化结构或变量语义规则；已保留可转换的变量值，但禁止模型更新该分区。',
    })
  }
  const definition = normalizeStateDefinition({
    title: '故事状态',
    updateMode,
    schema: converted.schema,
    rules: converted.rules,
  })
  return {
    version: RP_STATE_PROTOCOL_VERSION,
    namespaces: [{
      namespace: RP_STATE_DEFAULT_NAMESPACE,
      initialValue: split.value,
      definition,
      diagnostics: { setup: setupDiagnostics, lastCommit: [] },
    }],
  }
}

/** Split MVU [value, description] cells into pure JSON plus schema descriptions. */
export function splitMvuValue(input) {
  const diagnostics = []
  const visit = (value, path = '', inheritedExtensible = false) => {
    const extensibleArray = Array.isArray(value) && value.includes(MVU_ARRAY_EXTENSIBLE_MARKER)
    const arrayValue = extensibleArray ? value.filter(item => item !== MVU_ARRAY_EXTENSIBLE_MARKER) : value
    if (!extensibleArray && isDescriptionCell(arrayValue)) {
      const child = visit(arrayValue[0], path, inheritedExtensible)
      const description = typeof arrayValue[1] === 'string' ? arrayValue[1].trim() : ''
      return {
        value: child.value,
        schema: description.length === 0 ? child.schema : { ...child.schema, description },
      }
    }
    if (Array.isArray(arrayValue)) {
      const children = arrayValue.map((item, index) => visit(item, `${path}/${index}`, inheritedExtensible))
      return {
        value: children.map(child => child.value),
        schema: {
          type: 'array',
          ...(children.length === 0 ? {} : { items: commonSchema(children.map(child => child.schema)) }),
        },
      }
    }
    if (record(value)) {
      const meta = normalizeMvuMeta(value[MVU_META_KEY], value, path, diagnostics, inheritedExtensible)
      const entries = Object.entries(value).filter(([key]) => key !== MVU_META_KEY).map(([key, child]) => {
        if (UNSAFE_KEYS.has(key)) throw new Error(`MVU 变量包含不安全字段“${key}”。`)
        return [key, visit(child, `${path}/${escapePointer(key)}`, meta.recursiveExtensible)]
      })
      const required = meta.required ?? entries.map(([key]) => key)
      return {
        value: Object.fromEntries(entries.map(([key, child]) => [key, child.value])),
        schema: {
          type: 'object',
          properties: Object.fromEntries(entries.map(([key, child]) => [key, child.schema])),
          ...(required.length === 0 ? {} : { required }),
          additionalProperties: meta.extensible,
        },
      }
    }
    return { value: structuredClone(value), schema: inferredScalarSchema(value) }
  }
  const result = visit(input)
  return { ...result, diagnostics }
}

function normalizeMvuMeta(value, object, path, diagnostics, inheritedExtensible) {
  const defaults = {
    extensible: inheritedExtensible,
    recursiveExtensible: inheritedExtensible,
  }
  if (value === undefined) return defaults
  const metaPath = `${path}/${escapePointer(MVU_META_KEY)}`
  if (!record(value)) {
    diagnostics.push({
      code: 'MVU_META_INVALID',
      severity: 'error',
      path: metaPath,
      message: 'MVU $meta 必须是声明式对象。',
    })
    return defaults
  }
  for (const key of Object.keys(value)) {
    if (!MVU_META_FIELDS.has(key)) diagnostics.push({
      code: 'MVU_META_FIELD_IGNORED',
      severity: 'warning',
      path: `${metaPath}/${escapePointer(key)}`,
      message: `无法映射 MVU $meta 字段“${key}”；该字段未进入原生 State。`,
    })
  }
  const extensible = normalizeMetaBoolean(value.extensible, `${metaPath}/extensible`, diagnostics)
  const recursive = normalizeMetaBoolean(value.recursiveExtensible, `${metaPath}/recursiveExtensible`, diagnostics)
  const available = Object.keys(object).filter(key => key !== MVU_META_KEY)
  let required
  if (value.required !== undefined) {
    if (!Array.isArray(value.required)
      || new Set(value.required).size !== value.required.length
      || value.required.some(key => typeof key !== 'string' || !available.includes(key))) {
      diagnostics.push({
        code: 'MVU_META_INVALID',
        severity: 'error',
        path: `${metaPath}/required`,
        message: 'MVU $meta.required 必须是不重复且已存在的变量名数组。',
      })
    } else required = structuredClone(value.required)
  }
  if (value.template !== undefined && (!record(value.template) || Object.keys(value.template).length > 0)) diagnostics.push({
    code: record(value.template) ? 'MVU_META_TEMPLATE_IGNORED' : 'MVU_META_INVALID',
    severity: record(value.template) ? 'warning' : 'error',
    path: `${metaPath}/template`,
    message: record(value.template)
      ? 'MVU $meta.template 没有安全的原生等价语义；已保留现有值并忽略该模板。'
      : 'MVU $meta.template 必须是对象。',
  })
  const recursiveExtensible = recursive ?? inheritedExtensible
  return {
    required,
    recursiveExtensible,
    extensible: extensible ?? recursive ?? inheritedExtensible,
  }
}

function normalizeMetaBoolean(value, path, diagnostics) {
  if (value === undefined || typeof value === 'boolean') return value
  diagnostics.push({
    code: 'MVU_META_INVALID',
    severity: 'error',
    path,
    message: 'MVU 扩展性声明必须是布尔值。',
  })
  return undefined
}

/** Rebuild a read-only MVU ValueWithDescription view for getvar/getwi templates. */
export function createMvuCompatibilityView(value, schema = {}) {
  let rendered
  if (Array.isArray(value)) {
    rendered = value.map(item => createMvuCompatibilityView(item, record(schema.items) ? schema.items : {}))
  } else if (record(value)) {
    rendered = Object.fromEntries(Object.entries(value).map(([key, child]) => [
      key,
      createMvuCompatibilityView(child, record(schema.properties?.[key]) ? schema.properties[key] : {}),
    ]))
  } else rendered = structuredClone(value)
  return typeof schema.description === 'string' && schema.description.length > 0
    ? [rendered, schema.description]
    : rendered
}

/** True for lore entries that only configure or instruct MVU variables. */
export function isMvuControlEntry(entry) {
  const label = String(entry?.name ?? entry?.comment ?? '')
  return /\[initvar\]/i.test(label) || isMvuUpdateControlEntry(entry)
}

function commonSchema(schemas) {
  const first = JSON.stringify(schemas[0])
  return schemas.every(schema => JSON.stringify(schema) === first) ? structuredClone(schemas[0]) : {}
}

function inferredScalarSchema(value) {
  if (value === null) return { type: 'null' }
  if (typeof value === 'number') return { type: Number.isSafeInteger(value) ? 'integer' : 'number' }
  return { type: typeof value }
}

function isDescriptionCell(value) {
  return Array.isArray(value) && value.length === 2 && (value[1] === null || typeof value[1] === 'string')
}

function escapePointer(value) {
  return value.replaceAll('~', '~0').replaceAll('/', '~1')
}

function record(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
