import { HarnessError } from '@deepseek-ai/dsh-llm'

export const MAX_COMMIT_RETRY_PATCHES = 64

const UNSAFE_JSON_POINTER_SEGMENTS = new Set(['__proto__', 'prototype', 'constructor'])

/** Return the model-facing correction-only branch for rp_commit_turn. */
export function commitRetryParameterSchema() {
  const patchBase = {
    path: { type: 'string', description: 'RFC 6901 JSON Pointer into the cached full commit draft.' },
  }
  return {
    type: 'object',
    description: 'Use only after a failed commit returns this retry token. Apply the smallest corrections to the cached draft; unrelated fields remain unchanged.',
    additionalProperties: false,
    properties: {
      token: { type: 'string', description: 'Opaque token copied exactly from the latest failed commit result.' },
      patches: {
        type: 'array',
        description: `One to ${MAX_COMMIT_RETRY_PATCHES} ordered JSON Pointer add, replace, or remove operations against the cached full draft.`,
        items: {
          oneOf: [
            {
              type: 'object',
              additionalProperties: false,
              properties: {
                op: { type: 'string', const: 'add' },
                ...patchBase,
                value: { description: 'Complete JSON value to add.' },
              },
              required: ['op', 'path', 'value'],
            },
            {
              type: 'object',
              additionalProperties: false,
              properties: {
                op: { type: 'string', const: 'replace' },
                ...patchBase,
                value: { description: 'Complete replacement JSON value.' },
              },
              required: ['op', 'path', 'value'],
            },
            {
              type: 'object',
              additionalProperties: false,
              properties: { op: { type: 'string', const: 'remove' }, ...patchBase },
              required: ['op', 'path'],
            },
          ],
        },
      },
    },
    required: ['token', 'patches'],
  }
}

export function isRetryCommitArguments(value) {
  return isRecord(value) && Object.hasOwn(value, 'retry')
}

/** Apply a safe bounded RFC 6901-addressed patch set to one cached draft. */
export function applyCommitPatches(source, patches) {
  let output = jsonClone(source)
  for (const [index, patch] of patches.entries()) {
    if (!isRecord(patch) || !['add', 'replace', 'remove'].includes(patch.op)) {
      throw retryError(`retry.patches[${index}] must use add, replace, or remove.`)
    }
    const segments = parsePointer(patch.path, index)
    if (segments.length === 0) {
      if (patch.op === 'remove') throw retryError(`retry.patches[${index}] cannot remove the complete commit draft.`)
      output = clonePatchValue(patch.value, index)
      continue
    }
    let parent = output
    for (const [depth, segment] of segments.slice(0, -1).entries()) {
      if (Array.isArray(parent)) {
        const childIndex = arrayIndex(segment, parent.length, false, index)
        parent = parent[childIndex]
      } else if (isRecord(parent) && Object.hasOwn(parent, segment)) {
        parent = parent[segment]
      } else {
        throw retryError(`retry.patches[${index}] path does not exist at segment ${depth + 1}.`)
      }
      if (!Array.isArray(parent) && !isRecord(parent)) {
        throw retryError(`retry.patches[${index}] cannot traverse a scalar value.`)
      }
    }
    const key = segments.at(-1)
    if (Array.isArray(parent)) {
      if (patch.op === 'add') {
        const childIndex = arrayIndex(key, parent.length, true, index)
        parent.splice(childIndex, 0, clonePatchValue(patch.value, index))
      } else {
        const childIndex = arrayIndex(key, parent.length, false, index)
        if (patch.op === 'replace') parent[childIndex] = clonePatchValue(patch.value, index)
        else parent.splice(childIndex, 1)
      }
      continue
    }
    if (!isRecord(parent)) throw retryError(`retry.patches[${index}] parent is not an object or array.`)
    if (patch.op !== 'add' && !Object.hasOwn(parent, key)) {
      throw retryError(`retry.patches[${index}] path does not exist.`)
    }
    if (patch.op === 'remove') delete parent[key]
    else parent[key] = clonePatchValue(patch.value, index)
  }
  return output
}

function parsePointer(value, patchIndex) {
  if (typeof value !== 'string' || (value.length > 0 && !value.startsWith('/'))) {
    throw retryError(`retry.patches[${patchIndex}].path must be an RFC 6901 JSON Pointer.`)
  }
  if (value.length === 0) return []
  return value.slice(1).split('/').map((encoded) => {
    if (/~(?![01])/u.test(encoded)) throw retryError(`retry.patches[${patchIndex}].path contains an invalid escape.`)
    const segment = encoded.replaceAll('~1', '/').replaceAll('~0', '~')
    if (UNSAFE_JSON_POINTER_SEGMENTS.has(segment)) {
      throw retryError(`retry.patches[${patchIndex}].path contains an unsafe object key.`)
    }
    return segment
  })
}

function arrayIndex(value, length, allowEnd, patchIndex) {
  if (allowEnd && value === '-') return length
  if (!/^(?:0|[1-9][0-9]*)$/u.test(value)) {
    throw retryError(`retry.patches[${patchIndex}] contains an invalid array index.`)
  }
  const index = Number(value)
  if (!Number.isSafeInteger(index) || index < 0 || index > length || (!allowEnd && index === length)) {
    throw retryError(`retry.patches[${patchIndex}] array index is out of bounds.`)
  }
  return index
}

function clonePatchValue(value, patchIndex) {
  try {
    return jsonClone(value)
  } catch {
    throw retryError(`retry.patches[${patchIndex}].value must be lossless JSON.`)
  }
}

function retryError(message) {
  return new HarnessError(message, 'RP_COMMIT_RETRY_PATCH_INVALID')
}

function jsonClone(value) {
  return JSON.parse(JSON.stringify(value))
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
