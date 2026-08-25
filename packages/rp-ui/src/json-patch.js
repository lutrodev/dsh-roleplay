const DANGEROUS = new Set(['__proto__', 'prototype', 'constructor'])

/** Create a deterministic strict JSON Patch for one namespace draft. */
export function createStatePatch(original, draft) {
  assertSafe(original)
  assertSafe(draft)
  return diff(original, draft, '')
}

export function escapeJsonPointer(value) {
  return String(value).replaceAll('~', '~0').replaceAll('/', '~1')
}

function diff(original, draft, path) {
  if (equal(original, draft)) return []
  if (Array.isArray(original) || Array.isArray(draft) || !object(original) || !object(draft)) {
    return [{ op: 'test', path, value: clone(original) }, { op: path === '' && original === undefined ? 'add' : 'replace', path, value: clone(draft) }]
  }
  const operations = []
  const originalKeys = Object.keys(original).sort()
  const draftKeys = Object.keys(draft).sort()
  for (const key of originalKeys.filter(key => !Object.hasOwn(draft, key))) {
    const child = `${path}/${escapeJsonPointer(key)}`
    operations.push({ op: 'test', path: child, value: clone(original[key]) }, { op: 'remove', path: child })
  }
  for (const key of draftKeys) {
    const child = `${path}/${escapeJsonPointer(key)}`
    if (!Object.hasOwn(original, key)) operations.push({ op: 'add', path: child, value: clone(draft[key]) })
    else operations.push(...diff(original[key], draft[key], child))
  }
  return operations
}

function assertSafe(value) {
  if (Array.isArray(value)) return value.forEach(assertSafe)
  if (!object(value)) return
  for (const [key, child] of Object.entries(value)) {
    if (DANGEROUS.has(key)) throw new Error(`unsafe state key "${key}"`)
    assertSafe(child)
  }
}

function equal(left, right) {
  return JSON.stringify(left) === JSON.stringify(right)
}

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value))
}

function object(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
