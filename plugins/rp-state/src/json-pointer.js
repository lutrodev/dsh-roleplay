/** Parse one RFC 6901 JSON Pointer into decoded path segments. */
export function parseJsonPointer(pointer, { allowRoot = true } = {}) {
  if (typeof pointer !== 'string') throw new StatePointerError('State path must be a string.')
  if (pointer === '') {
    if (!allowRoot) throw new StatePointerError('State updates cannot target the namespace root.')
    return []
  }
  if (!pointer.startsWith('/')) throw new StatePointerError('State path must be an RFC 6901 JSON Pointer.')
  return pointer.slice(1).split('/').map(segment => {
    if (/~(?:[^01]|$)/u.test(segment)) throw new StatePointerError(`State path "${pointer}" contains an invalid escape.`)
    const decoded = segment.replaceAll('~1', '/').replaceAll('~0', '~')
    if (decoded === '__proto__' || decoded === 'prototype' || decoded === 'constructor') {
      throw new StatePointerError(`State path "${pointer}" contains an unsafe segment.`)
    }
    return decoded
  })
}

/** Read an existing value at one JSON Pointer. */
export function readJsonPointer(value, pointer) {
  const segments = Array.isArray(pointer) ? pointer : parseJsonPointer(pointer)
  let current = value
  for (const segment of segments) {
    if (Array.isArray(current)) {
      const index = arrayIndex(segment, current.length, false)
      if (index === undefined) return { found: false }
      current = current[index]
      continue
    }
    if (!record(current) || !Object.prototype.hasOwnProperty.call(current, segment)) return { found: false }
    current = current[segment]
  }
  return { found: true, value: current }
}

/** Resolve the existing parent container for a non-root JSON Pointer. */
export function resolveJsonPointerParent(value, pointer) {
  const segments = Array.isArray(pointer) ? pointer : parseJsonPointer(pointer, { allowRoot: false })
  if (segments.length === 0) throw new StatePointerError('State updates cannot target the namespace root.')
  const key = segments.at(-1)
  const parent = readJsonPointer(value, segments.slice(0, -1))
  if (!parent.found || (!Array.isArray(parent.value) && !record(parent.value))) {
    throw new StatePointerError(`State path "${formatPointer(segments)}" has no existing parent container.`)
  }
  return { parent: parent.value, key, segments }
}

/** Return whether two non-root pointers write the same or nested locations. */
export function jsonPointersConflict(left, right) {
  const a = Array.isArray(left) ? left : parseJsonPointer(left, { allowRoot: false })
  const b = Array.isArray(right) ? right : parseJsonPointer(right, { allowRoot: false })
  const limit = Math.min(a.length, b.length)
  for (let index = 0; index < limit; index += 1) if (a[index] !== b[index]) return false
  return true
}

/** Resolve an exact existing array index, rejecting ambiguous numeric strings. */
export function requiredArrayIndex(segment, length) {
  const index = arrayIndex(segment, length, false)
  if (index === undefined) throw new StatePointerError(`Array index "${segment}" does not exist.`)
  return index
}

function arrayIndex(segment, length, allowEnd) {
  if (typeof segment !== 'string' || !/^(?:0|[1-9][0-9]*)$/u.test(segment)) return undefined
  const index = Number(segment)
  if (!Number.isSafeInteger(index) || index < 0 || index > length || (!allowEnd && index === length)) return undefined
  return index
}

function formatPointer(segments) {
  return `/${segments.map(segment => segment.replaceAll('~', '~0').replaceAll('/', '~1')).join('/')}`
}

function record(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export class StatePointerError extends Error {
  constructor(message) {
    super(message)
    this.name = 'StatePointerError'
  }
}
