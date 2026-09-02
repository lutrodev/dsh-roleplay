export const REPLY_OPTIONS_EXTENSION_NAMESPACE = 'rp.reply-options'
export const REPLY_OPTIONS_PROTOCOL_VERSION = 1
export const REPLY_OPTIONS_MIN_ITEMS = 1
export const REPLY_OPTIONS_MAX_ITEMS = 5
export const DEFAULT_REPLY_OPTIONS_COUNT = 3
export const REPLY_OPTION_MAX_CHARACTERS = 200
export const DEFAULT_REPLY_OPTION_MAX_CHARACTERS = 50
export const REPLY_OPTION_KEYWORD_MAX_CHARACTERS = 40
export const DEFAULT_REPLY_OPTION_KEYWORDS = Object.freeze(
  Array.from({ length: DEFAULT_REPLY_OPTIONS_COUNT }, () => ''),
)

const STORED_KEYS = new Set(['version', 'options'])

/** Model-facing schema whose advisory fields are canonicalized by the extension owner. */
export function replyOptionsExtensionSchema(
  count = DEFAULT_REPLY_OPTIONS_COUNT,
  keywords = DEFAULT_REPLY_OPTION_KEYWORDS,
  maxCharacters = DEFAULT_REPLY_OPTION_MAX_CHARACTERS,
) {
  const normalizedCount = normalizeReplyOptionsCount(count)
  const normalizedKeywords = normalizeReplyOptionKeywords(keywords, normalizedCount)
  const normalizedMaxCharacters = normalizeReplyOptionMaxCharacters(maxCharacters)
  const directionGuidance = configuredDirectionGuidance(normalizedKeywords)
  return {
    type: 'object',
    // Reply options are advisory UI material. The canonical validator owns the
    // stored shape, so harmless model-added annotations must not make the
    // narrative transaction retry.
    additionalProperties: true,
    description: `Generate exactly ${normalizedCount} distinct, directly sendable roleplay ${normalizedCount === 1 ? 'continuation' : 'continuations'} for the user-controlled protagonist identified from the surrounding roleplay_context context_guide when present; otherwise infer the protagonist from the remaining context and conversation.${directionGuidance} Let each message form a complete, concrete next move grounded in the current scene and led by the protagonist. Narration uses third person, and dialogue uses the protagonist's natural voice.`,
    properties: {
      options: {
        type: 'array',
        description: `Exactly ${normalizedCount} distinct, directly sendable roleplay ${normalizedCount === 1 ? 'continuation' : 'continuations'}, each within ${normalizedMaxCharacters} Unicode characters.`,
        items: {
          type: 'string',
          description: 'One complete, concrete next move by the protagonist, ready to send as the next message.',
        },
      },
    },
    required: ['options'],
  }
}

/** Closed structured-output schema used only by the internal generator. */
export function replyOptionsOutputSchema(
  count = DEFAULT_REPLY_OPTIONS_COUNT,
  keywords = DEFAULT_REPLY_OPTION_KEYWORDS,
  maxCharacters = DEFAULT_REPLY_OPTION_MAX_CHARACTERS,
) {
  return { ...replyOptionsExtensionSchema(count, keywords, maxCharacters), additionalProperties: false }
}

/** Render one bounded, final-narrative-first generator request. */
export function renderReplyOptionsPrompt({
  narrative,
  roleplayContext = '',
  count = DEFAULT_REPLY_OPTIONS_COUNT,
  keywords = DEFAULT_REPLY_OPTION_KEYWORDS,
  maxCharacters = DEFAULT_REPLY_OPTION_MAX_CHARACTERS,
  maxPromptCharacters = 20000,
}) {
  const normalizedCount = normalizeReplyOptionsCount(count)
  const normalizedKeywords = normalizeReplyOptionKeywords(keywords, normalizedCount)
  const normalizedMaxCharacters = normalizeReplyOptionMaxCharacters(maxCharacters)
  if (typeof narrative !== 'string' || narrative.trim().length === 0) throw new TypeError('reply options narrative must be non-empty')
  if (typeof roleplayContext !== 'string') throw new TypeError('reply options roleplayContext must be a string')
  if (!Number.isSafeInteger(maxPromptCharacters) || maxPromptCharacters < 1) throw new TypeError('reply options maxPromptCharacters must be positive')
  const keywordGuidance = normalizedKeywords.flatMap((keyword, index) => keyword.length === 0
    ? []
    : [`Option ${index + 1} direction: ${keyword}`]).join('\n')
  const prefix = `${[
    `Generate ${normalizedCount} distinct, directly sendable roleplay continuations the user could choose next.`,
    `Keep each option within ${normalizedMaxCharacters} Unicode characters.`,
    'Write each option as a complete, concrete next move that meaningfully continues the interaction. Use the available space to ground it in the current scene through the user-controlled protagonist\'s specific action, dialogue, intention, or observation, combining elements when natural. Use third-person narration when narration is present, and use the protagonist\'s natural voice in dialogue.',
    keywordGuidance.length === 0 ? undefined : keywordGuidance,
    '<final_narrative>',
    narrative.trim(),
    '</final_narrative>',
    '<roleplay_context>',
  ].filter(Boolean).join('\n')}\n`
  const suffix = '\n</roleplay_context>\nUse the context to identify the protagonist, preserve continuity, and choose plausible next moves. Return the structured options object.'
  const fixedCharacters = [...prefix].length + [...suffix].length
  if (fixedCharacters > maxPromptCharacters) {
    const error = new RangeError(`reply options fixed prompt exceeds ${maxPromptCharacters} characters`)
    error.code = 'RP_REPLY_OPTIONS_PROMPT_LIMIT'
    throw error
  }
  const contextBudget = maxPromptCharacters - fixedCharacters
  const contextCharacters = [...roleplayContext]
  const selectedContext = contextCharacters.length <= contextBudget
    ? roleplayContext
    : contextCharacters.slice(contextCharacters.length - contextBudget).join('')
  return `${prefix}${selectedContext}${suffix}`
}

/**
 * Normalize optional per-option direction keywords for runtime configuration.
 * Older settings may have fewer or more slots than the current count, so this
 * boundary pads missing values and drops slots that are no longer visible.
 */
export function normalizeReplyOptionKeywords(value = DEFAULT_REPLY_OPTION_KEYWORDS, count = DEFAULT_REPLY_OPTIONS_COUNT) {
  const normalizedCount = normalizeReplyOptionsCount(count)
  if (!Array.isArray(value)) throw new TypeError('reply option keywords must be an array')
  if (value.length > REPLY_OPTIONS_MAX_ITEMS) {
    throw new RangeError(`reply option keywords must contain at most ${REPLY_OPTIONS_MAX_ITEMS} items`)
  }
  const normalized = value.map((candidate, index) => normalizeKeyword(candidate, index))
  return Array.from({ length: normalizedCount }, (_, index) => normalized[index] ?? '')
}

/** Validate an atomic settings write where one keyword slot must exist per option. */
export function assertReplyOptionKeywords(value, count = DEFAULT_REPLY_OPTIONS_COUNT) {
  const normalizedCount = normalizeReplyOptionsCount(count)
  if (!Array.isArray(value) || value.length !== normalizedCount) {
    throw new RangeError(`reply option keywords must contain exactly ${normalizedCount} ${normalizedCount === 1 ? 'item' : 'items'}`)
  }
  return normalizeReplyOptionKeywords(value, normalizedCount)
}

/** Normalize the user-configurable exact option count. */
export function normalizeReplyOptionsCount(value = DEFAULT_REPLY_OPTIONS_COUNT) {
  if (!Number.isSafeInteger(value)) {
    throw new TypeError('reply options count must be a safe integer')
  }
  if (value < REPLY_OPTIONS_MIN_ITEMS || value > REPLY_OPTIONS_MAX_ITEMS) {
    throw new RangeError(`reply options count must be between ${REPLY_OPTIONS_MIN_ITEMS} and ${REPLY_OPTIONS_MAX_ITEMS}`)
  }
  return value
}

/** Normalize the user-configurable model guidance for each option's length. */
export function normalizeReplyOptionMaxCharacters(value = DEFAULT_REPLY_OPTION_MAX_CHARACTERS) {
  if (!Number.isSafeInteger(value)) {
    throw new TypeError('reply option maximum characters must be a safe integer')
  }
  if (value < 1 || value > REPLY_OPTION_MAX_CHARACTERS) {
    throw new RangeError(`reply option maximum characters must be between 1 and ${REPLY_OPTION_MAX_CHARACTERS}`)
  }
  return value
}

/** Validate model input and return the versioned canonical value persisted in commit metadata. */
export function normalizeReplyOptionsInput(
  value,
  count = DEFAULT_REPLY_OPTIONS_COUNT,
) {
  const normalizedCount = normalizeReplyOptionsCount(count)
  if (!record(value)) {
    throw invalidReplyOptions(
      'reply options must be an object containing options',
      normalizedCount,
    )
  }
  return {
    version: REPLY_OPTIONS_PROTOCOL_VERSION,
    options: normalizeOptions(value.options, normalizedCount),
  }
}

/** Decode one persisted extension without throwing across the browser event boundary. */
export function decodeStoredReplyOptions(value) {
  if (!record(value) || value.version !== REPLY_OPTIONS_PROTOCOL_VERSION
    || Object.keys(value).some(key => !STORED_KEYS.has(key))) return undefined
  try {
    // Persisted events remain readable after the configured target count changes.
    const options = normalizeOptions(value.options, REPLY_OPTIONS_MAX_ITEMS)
    if (options.length !== value.options.length
      || !options.every((option, index) => option === value.options[index])) return undefined
    return { version: REPLY_OPTIONS_PROTOCOL_VERSION, options }
  } catch {
    return undefined
  }
}

function normalizeOptions(value, preferredCount) {
  if (!Array.isArray(value)) throw invalidReplyOptions('options must be an array', preferredCount)
  const limit = normalizeReplyOptionsCount(preferredCount)
  const options = []
  const seen = new Set()
  for (const [index, candidate] of value.entries()) {
    if (typeof candidate !== 'string') {
      throw invalidReplyOptions(`options[${index}] must be a string`, limit)
    }
    const normalized = candidate.replaceAll(/\r\n?/gu, '\n').trim()
    if (normalized === '' || seen.has(normalized)) continue
    seen.add(normalized)
    options.push(normalized)
    if (options.length === limit) break
  }
  if (options.length === 0) throw invalidReplyOptions('options must contain at least one usable item', limit)
  return options
}

function invalidReplyOptions(message, expectedCount) {
  const error = new Error(message)
  error.name = 'ReplyOptionsValidationError'
  error.code = 'RP_REPLY_OPTIONS_INVALID'
  error.feedback = {
    extension: REPLY_OPTIONS_EXTENSION_NAMESPACE,
    correction: `Provide at least one usable and preferably exactly ${expectedCount} distinct, directly sendable roleplay ${expectedCount === 1 ? 'continuation' : 'continuations'} for the user-controlled protagonist. Identify the protagonist from the surrounding roleplay_context context_guide when present; otherwise infer the protagonist from the remaining context and conversation. Let each message form a complete, concrete next move grounded in the current scene through the protagonist's specific action, dialogue, intention, or observation, use third-person narration when narration is present, use the protagonist's natural voice in dialogue, and let configured directions shape their matching options.`,
  }
  return error
}

function configuredDirectionGuidance(keywords) {
  const configured = keywords.flatMap((keyword, index) => keyword.length === 0
    ? []
    : [`option ${index + 1}: ${JSON.stringify(keyword)}`])
  if (configured.length === 0) return ''
  return ` Shape the matching options with these directions: ${configured.join('; ')}. Options without a configured direction follow a plausible path suggested by the scene.`
}

function normalizeKeyword(candidate, index) {
  if (typeof candidate !== 'string') throw new TypeError(`reply option keywords[${index}] must be a string`)
  const normalized = candidate.replaceAll(/\s+/gu, ' ').trim()
  if ([...normalized].length > REPLY_OPTION_KEYWORD_MAX_CHARACTERS) {
    throw new RangeError(`reply option keywords[${index}] exceeds ${REPLY_OPTION_KEYWORD_MAX_CHARACTERS} Unicode characters`)
  }
  return normalized
}

function record(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}
