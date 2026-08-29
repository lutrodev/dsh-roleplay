const JSON_STRING = '"(?:\\\\.|[^"\\\\])*"'
const JSON_NUMBER = '-?(?:0|[1-9][0-9]*)(?:\\.[0-9]+)?(?:[eE][+-]?[0-9]+)?'
const SIMPLE_CONDITION = new RegExp(`^\\s*state\\(\\s*(${JSON_STRING})\\s*,\\s*(${JSON_STRING})\\s*\\)\\s*(==|!=|>=|<=|>|<)\\s*(${JSON_STRING}|${JSON_NUMBER}|true|false|null)\\s*$`, 'u')
const OPERATORS = new Set(['==', '!=', '>', '>=', '<', '<='])
const NAMESPACE_PATTERN = /^[a-z0-9][a-z0-9._:-]{0,127}$/u

export const CONDITION_OPERATORS = Object.freeze([
  { value: '>=', label: '大于或等于' },
  { value: '>', label: '大于' },
  { value: '==', label: '等于' },
  { value: '!=', label: '不等于' },
  { value: '<', label: '小于' },
  { value: '<=', label: '小于或等于' },
])

export function parseCommonStateCondition(source) {
  if (typeof source !== 'string' || source.trim().length === 0) return null
  const match = SIMPLE_CONDITION.exec(source)
  if (match === null) return null
  try {
    const namespace = JSON.parse(match[1])
    const pointer = JSON.parse(match[2])
    const value = JSON.parse(match[4])
    if (typeof namespace !== 'string' || !NAMESPACE_PATTERN.test(namespace) || typeof pointer !== 'string' || !validCommonPath(pointer)) return null
    if (value === '') return null
    if (value !== null && typeof value === 'object') return null
    return {
      namespace,
      path: pointer,
      operator: match[3],
      valueText: typeof value === 'boolean' ? (value ? '是' : '否') : value === null ? 'null' : String(value),
      valueType: value === null ? 'null' : typeof value,
    }
  } catch {
    return null
  }
}

export function serializeCommonStateCondition(condition) {
  const namespace = String(condition?.namespace ?? '').trim()
  const path = String(condition?.path ?? '').trim()
  const valueText = String(condition?.valueText ?? '').trim()
  if (namespace === 'story' && path.length === 0 && valueText.length === 0 && (condition?.operator === undefined || condition.operator === '>=')) return undefined
  if (commonStateConditionIssue(condition) !== null) return undefined
  const operator = OPERATORS.has(condition?.operator) ? condition.operator : '>='
  return `state(${JSON.stringify(namespace)}, ${JSON.stringify(path)}) ${operator} ${serializeValue(valueText, condition?.valueType)}`
}

export function commonStateConditionIssue(condition) {
  const namespace = String(condition?.namespace ?? '').trim()
  const path = String(condition?.path ?? '').trim()
  const valueText = String(condition?.valueText ?? '').trim()
  const untouched = namespace === 'story' && path.length === 0 && valueText.length === 0 && (condition?.operator === undefined || condition.operator === '>=')
  if (untouched) return null
  if (!NAMESPACE_PATTERN.test(namespace)) return '变量分组需使用小写字母或数字开头，可包含点、横线、下划线或冒号。'
  if (path.length === 0) return '请填写完整路径，例如 /plot/progress。'
  if (!path.startsWith('/')) return '完整路径必须以 / 开头，例如 /plot/progress。'
  if (!validCommonPath(path)) return '完整路径中的 ~ 只能写成 ~0 或 ~1。'
  if (valueText.length === 0) return '请填写用于比较的值。'
  return null
}

function serializeValue(input, type) {
  const value = String(input ?? '').trim()
  if (type === 'string') return JSON.stringify(value)
  if (type === 'boolean' && (value === '是' || value === '否' || value === 'true' || value === 'false')) return value === '是' ? 'true' : value === '否' ? 'false' : value
  if (type === 'null' && value === 'null') return 'null'
  if (type === 'number' && isJsonNumber(value)) return value
  if (value === '是' || value === '否') return value === '是' ? 'true' : 'false'
  if (value === 'true' || value === 'false' || value === 'null') return value
  if (isJsonNumber(value)) return value
  return JSON.stringify(value)
}

function isJsonNumber(value) {
  return new RegExp(`^(?:${JSON_NUMBER})$`, 'u').test(value) && Number.isFinite(Number(value))
}

function validCommonPath(value) {
  return value.startsWith('/') && !/~(?:[^01]|$)/u.test(value)
}
