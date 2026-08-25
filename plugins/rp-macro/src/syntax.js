const ROLEPLAY_IDENTITY_MACRO = /\{\{\s*(user|char)\s*\}\}|<(user|char)>/giu

/**
 * Expand the two identity macros Roleplay owns. An absent identity
 * deliberately preserves its source token so an incomplete profile remains
 * editable and reversible.
 *
 * @param {string} text Source text.
 * @param {{ userName?: string | null, characterName?: string | null }} identities Frozen names.
 */
export function expandRoleplayMacros(text, identities = {}) {
  if (typeof text !== 'string') throw new TypeError('text must be a string')
  return text.replace(ROLEPLAY_IDENTITY_MACRO, (source, braceName, angleName) => {
    const name = String(braceName ?? angleName).toLocaleLowerCase()
    const replacement = name === 'user' ? identities.userName : identities.characterName
    return typeof replacement === 'string' && replacement.length > 0 ? replacement : source
  })
}

/**
 * Incremental counterpart used for transient assistant output. It retains
 * only a suffix that can still become a valid macro, including arbitrarily
 * spaced `{{ user }}` spellings.
 *
 * @param {{ userName?: string | null, characterName?: string | null }} identities Frozen names.
 */
export function createRoleplayMacroStream(identities = {}) {
  let buffer = ''
  const drain = (final) => {
    let output = ''
    while (buffer.length > 0) {
      const candidate = classifyPrefix(buffer)
      if (candidate.kind === 'match') {
        const source = buffer.slice(0, candidate.length)
        const replacement = candidate.name === 'user' ? identities.userName : identities.characterName
        output += typeof replacement === 'string' && replacement.length > 0 ? replacement : source
        buffer = buffer.slice(candidate.length)
        continue
      }
      if (!final && candidate.kind === 'prefix') break
      output += buffer[0]
      buffer = buffer.slice(1)
    }
    return output
  }
  return {
    push(text) {
      buffer += text
      return drain(false)
    },
    finish() {
      return drain(true)
    },
  }
}

/** @param {string} value */
function classifyPrefix(value) {
  if (value[0] === '<') return classifyAngle(value)
  if (value[0] === '{') return classifyBraces(value)
  return { kind: 'none' }
}

/** @param {string} value */
function classifyAngle(value) {
  return classifyFixedTokens(value, [['user', '<user>'], ['char', '<char>']])
}

/** @param {string} value */
function classifyBraces(value) {
  let index = 0
  for (const expected of ['{', '{']) {
    if (index >= value.length) return { kind: 'prefix' }
    if (value[index] !== expected) return { kind: 'none' }
    index += 1
  }
  while (index < value.length && /\s/u.test(value[index])) index += 1
  const identity = classifyIdentity(value.slice(index))
  if (identity.kind !== 'match') return identity
  index += identity.length
  while (index < value.length && /\s/u.test(value[index])) index += 1
  for (const expected of ['}', '}']) {
    if (index >= value.length) return { kind: 'prefix' }
    if (value[index] !== expected) return { kind: 'none' }
    index += 1
  }
  return { kind: 'match', length: index, name: identity.name }
}

/** @param {string} value */
function classifyIdentity(value) {
  return classifyFixedTokens(value, [['user', 'user'], ['char', 'char']])
}

/** @param {string} value @param {Array<[string, string]>} tokens */
function classifyFixedTokens(value, tokens) {
  const lower = value.toLocaleLowerCase()
  const possible = tokens.filter(([, token]) => token.startsWith(lower) || lower.startsWith(token))
  const matched = possible.find(([, token]) => lower.startsWith(token))
  if (matched !== undefined) return { kind: 'match', length: matched[1].length, name: matched[0] }
  return possible.length > 0 ? { kind: 'prefix' } : { kind: 'none' }
}
