const MVU_ARRAY_EXTENSIBLE_MARKER = '$__META_EXTENSIBLE__$'
const RESERVED_KEYS = new Set([
  '__proto__',
  'prototype',
  'constructor',
  '$meta',
  '$arrayMeta',
  '$internal',
])

/** Apply one opening command list atomically, with optional fixed-schema validation after every command. */
export function applyMvuOpeningOperations(initialValue, operations, options = {}) {
  const original = structuredClone(initialValue)
  let value = structuredClone(initialValue)
  const descriptionCells = options.descriptionCells !== false
  for (const [index, operation] of operations.entries()) {
    try {
      value = applyOperation(value, operation, options.schema, descriptionCells)
      options.validate?.(value)
    } catch (error) {
      const reason = error instanceof MvuOpeningOperationError
        ? error.message
        : '执行结果不符合已有变量结构约束。'
      return {
        ok: false,
        value: original,
        message: `第 ${index + 1} 条 _.${operation.sourceCommand} 未生效：${reason}`,
      }
    }
  }
  return { ok: true, value }
}

function applyOperation(value, operation, schema, descriptionCells) {
  if (operation.op === 'set') return setLogicalAt(value, operation.segments, operation.value, descriptionCells)
  if (operation.op === 'add') {
    const current = readLogicalAt(value, operation.segments, descriptionCells)
    if (!current.found || typeof current.value !== 'number' || !Number.isFinite(current.value)) {
      throw operationError(`路径“${operation.path}”不是有限数字。`)
    }
    const next = current.value + operation.by
    if (!Number.isFinite(next)) throw operationError(`路径“${operation.path}”相加后不是有限数字。`)
    return setLogicalAt(value, operation.segments, next, descriptionCells)
  }
  if (operation.op === 'insert') {
    let current = readLogicalAt(value, operation.segments, descriptionCells)
    if (!current.found) {
      const targetSchema = schemaAt(schema, operation.segments)
      const type = singleType(targetSchema) ?? inferredCollectionType(operation)
      if (!['array', 'object'].includes(type)) throw operationError(`路径“${operation.path}”不存在或不是集合。`)
      value = setLogicalAt(value, operation.segments, type === 'array' ? [] : {}, descriptionCells)
      current = readLogicalAt(value, operation.segments, descriptionCells)
    }
    if (Array.isArray(current.value)) {
      const selector = typeof operation.selector === 'string' && /^-?\d+$/u.test(operation.selector)
        ? Number(operation.selector)
        : operation.selector
      const logicalIndex = selector === undefined || selector === '-'
        ? dataArrayLength(current.value)
        : selector
      if (!Number.isSafeInteger(logicalIndex)) throw operationError(`路径“${operation.path}”的数组索引必须是安全整数或“-”。`)
      current.value.splice(insertArrayIndex(current.value, logicalIndex), 0, structuredClone(operation.value))
      return value
    }
    if (record(current.value)) {
      if (operation.selector === undefined) {
        if (!record(operation.value)) throw operationError(`路径“${operation.path}”是对象，双参数插入值也必须是对象。`)
        for (const [key, child] of Object.entries(operation.value)) current.value[key] = structuredClone(child)
      } else {
        const key = String(operation.selector)
        if (!safeKey(key)) throw operationError(`路径“${operation.path}”的对象键不安全。`)
        current.value[key] = structuredClone(operation.value)
      }
      return value
    }
    throw operationError(`路径“${operation.path}”不是数组或对象。`)
  }
  if (operation.op === 'delete') {
    if (operation.selector === undefined) {
      deleteRawAt(value, operation.segments, descriptionCells)
      return value
    }
    const current = readLogicalAt(value, operation.segments, descriptionCells)
    if (!current.found) throw operationError(`路径“${operation.path}”不存在。`)
    if (Array.isArray(current.value)) {
      let index = typeof operation.selector === 'number'
        ? readArrayIndex(String(operation.selector), current.value)
        : dataArrayIndexes(current.value).find(index => deepEqual(current.value[index], operation.selector))
      if (index === undefined && typeof operation.selector === 'string' && /^\d+$/u.test(operation.selector)) {
        index = readArrayIndex(operation.selector, current.value)
      }
      if (index === undefined) throw operationError(`路径“${operation.path}”中没有可删除的数组元素。`)
      current.value.splice(index, 1)
      return value
    }
    if (record(current.value)) {
      if (!['number', 'string'].includes(typeof operation.selector)) {
        throw operationError(`路径“${operation.path}”的对象键必须是字符串或安全整数。`)
      }
      const key = typeof operation.selector === 'number'
        ? Object.keys(current.value)[operation.selector]
        : String(operation.selector)
      if (key === undefined || !safeKey(key) || !Object.hasOwn(current.value, key)) {
        throw operationError(`路径“${operation.path}”中没有可删除的对象键。`)
      }
      delete current.value[key]
      return value
    }
    throw operationError(`路径“${operation.path}”不是数组或对象。`)
  }
  if (samePath(operation.fromSegments, operation.segments)) return value
  const moved = readRawAt(value, operation.fromSegments, descriptionCells)
  if (!moved.found) throw operationError(`来源路径“${operation.fromPath}”不存在。`)
  deleteRawAt(value, operation.fromSegments, descriptionCells)
  return setRawAt(value, operation.segments, moved.value, descriptionCells)
}

function readLogicalAt(root, segments, descriptionCells) {
  const result = readRawAt(root, segments, descriptionCells)
  return result.found ? { found: true, value: logicalValue(result.value, descriptionCells) } : result
}

function readRawAt(root, segments, descriptionCells) {
  if (segments.length === 0) return { found: true, value: root }
  let current = logicalValue(root, descriptionCells)
  for (const [index, segment] of segments.entries()) {
    if (Array.isArray(current)) {
      const arrayIndex = readArrayIndex(segment, current)
      if (arrayIndex === undefined) return { found: false }
      current = current[arrayIndex]
    } else if (record(current) && Object.hasOwn(current, segment)) current = current[segment]
    else return { found: false }
    if (index < segments.length - 1) current = logicalValue(current, descriptionCells)
  }
  return { found: true, value: current }
}

function setLogicalAt(root, segments, next, descriptionCells) {
  if (segments.length === 0) return structuredClone(next)
  const location = resolveParent(root, segments, true, descriptionCells)
  const existing = location.parent[location.key]
  if (descriptionCells && isDescriptionCell(existing)) existing[0] = structuredClone(next)
  else location.parent[location.key] = structuredClone(next)
  return root
}

function setRawAt(root, segments, next, descriptionCells) {
  if (segments.length === 0) return structuredClone(next)
  const location = resolveParent(root, segments, true, descriptionCells)
  location.parent[location.key] = structuredClone(next)
  return root
}

function deleteRawAt(root, segments, descriptionCells) {
  if (segments.length === 0) throw operationError('不能删除整个变量分区。')
  const location = resolveParent(root, segments, false, descriptionCells)
  if (Array.isArray(location.parent)) location.parent.splice(location.key, 1)
  else {
    if (!Object.hasOwn(location.parent, location.key)) throw operationError(`路径“${segments.join('.')}”不存在。`)
    delete location.parent[location.key]
  }
}

function resolveParent(root, segments, create, descriptionCells) {
  let current = logicalValue(root, descriptionCells)
  const parentSegments = segments.slice(0, -1)
  for (const [position, segment] of parentSegments.entries()) {
    const nextValue = numericPathSegment(segments[position + 1]) ? [] : {}
    if (Array.isArray(current)) {
      let index = readArrayIndex(segment, current)
      if (index === undefined && create) {
        index = appendArrayIndex(segment, current)
      }
      if (index === current.length) {
        current.push(nextValue)
      }
      if (index === undefined) throw operationError(`数组路径“${segments.join('.')}”不存在。`)
      current = logicalValue(current[index], descriptionCells)
      continue
    }
    if (!record(current)) throw operationError(`路径“${segments.join('.')}”的上级不是对象或数组。`)
    if (!Object.hasOwn(current, segment)) {
      if (!create) throw operationError(`路径“${segments.join('.')}”不存在。`)
      current[segment] = nextValue
    }
    current = logicalValue(current[segment], descriptionCells)
  }
  const last = segments.at(-1)
  if (Array.isArray(current)) {
    const index = readArrayIndex(last, current)
      ?? (create ? appendArrayIndex(last, current) : undefined)
    if (index === undefined) throw operationError(`数组路径“${segments.join('.')}”不存在。`)
    return { parent: current, key: index }
  }
  if (!record(current)) throw operationError(`路径“${segments.join('.')}”的上级不是对象或数组。`)
  return { parent: current, key: last }
}

function logicalValue(value, descriptionCells) {
  return descriptionCells && isDescriptionCell(value) ? value[0] : value
}

function isDescriptionCell(value) {
  return Array.isArray(value)
    && !value.includes(MVU_ARRAY_EXTENSIBLE_MARKER)
    && value.length === 2
    && (value[1] === null || typeof value[1] === 'string')
}

function schemaAt(schema, segments) {
  let current = schema
  for (const segment of segments) {
    if (!record(current)) return undefined
    const type = singleType(current)
    if (type === 'array') current = current.items
    else if (type === 'object') current = current.properties?.[segment] ?? (record(current.additionalProperties) ? current.additionalProperties : undefined)
    else return undefined
  }
  return current
}

function singleType(schema) {
  return typeof schema?.type === 'string' ? schema.type : undefined
}

function inferredCollectionType(operation) {
  if (operation.selector === undefined) return record(operation.value) ? 'object' : 'array'
  return typeof operation.selector === 'number' || operation.selector === '-' ? 'array' : 'object'
}

function safeKey(value) {
  return typeof value === 'string'
    && value.length > 0
    && !/[\u0000-\u001f\u007f]/u.test(value)
    && !RESERVED_KEYS.has(value)
    && !value.startsWith('_')
    && value !== '-'
}

function readArrayIndex(segment, value) {
  if (!/^(?:0|[1-9]\d*)$/u.test(segment)) return undefined
  const index = Number(segment)
  return Number.isSafeInteger(index) ? dataArrayIndexes(value)[index] : undefined
}

function numericPathSegment(value) {
  return /^(?:0|[1-9]\d*)$/u.test(value)
}

function appendArrayIndex(segment, value) {
  if (!numericPathSegment(segment)) return undefined
  const index = Number(segment)
  return Number.isSafeInteger(index) && index === dataArrayLength(value) ? value.length : undefined
}

function insertArrayIndex(value, index) {
  const indexes = dataArrayIndexes(value)
  const normalized = index < 0
    ? Math.max(indexes.length + index, 0)
    : Math.min(index, indexes.length)
  return normalized === indexes.length ? value.length : indexes[normalized]
}

function dataArrayIndexes(value) {
  return value.flatMap((item, index) => item === MVU_ARRAY_EXTENSIBLE_MARKER ? [] : [index])
}

function dataArrayLength(value) {
  return dataArrayIndexes(value).length
}

function samePath(left, right) {
  return left.length === right.length && left.every((segment, index) => segment === right[index])
}

function deepEqual(left, right) {
  if (Object.is(left, right)) return true
  if (Array.isArray(left) && Array.isArray(right)) {
    return left.length === right.length && left.every((item, index) => deepEqual(item, right[index]))
  }
  if (!record(left) || !record(right)) return false
  const leftKeys = Object.keys(left)
  const rightKeys = Object.keys(right)
  return leftKeys.length === rightKeys.length
    && leftKeys.every(key => Object.hasOwn(right, key) && deepEqual(left[key], right[key]))
}

function operationError(message) { return new MvuOpeningOperationError(message) }
function record(value) { return typeof value === 'object' && value !== null && !Array.isArray(value) }

class MvuOpeningOperationError extends Error {}
