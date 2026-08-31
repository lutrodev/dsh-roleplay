export const REPLY_OPTIONS_EXTENSION_NAMESPACE = 'rp.reply-options'
export const REPLY_OPTIONS_PROTOCOL_VERSION = 1
export const REPLY_OPTIONS_MIN_ITEMS = 1
export const REPLY_OPTIONS_MAX_ITEMS = 5
export const DEFAULT_REPLY_OPTIONS_COUNT = 3
export const REPLY_OPTION_MAX_CHARACTERS = 200
export const REPLY_OPTION_KEYWORD_MAX_CHARACTERS = 40
export const DEFAULT_REPLY_OPTION_KEYWORDS = Object.freeze(
  Array.from({ length: DEFAULT_REPLY_OPTIONS_COUNT }, () => ''),
)

const INPUT_KEYS = new Set(['options'])
const STORED_KEYS = new Set(['version', 'options'])

/** Closed model-facing schema; exact-count semantic validation is performed by the extension owner. */
export function replyOptionsExtensionSchema(count = DEFAULT_REPLY_OPTIONS_COUNT, keywords = DEFAULT_REPLY_OPTION_KEYWORDS) {
  const normalizedCount = normalizeReplyOptionsCount(count)
  const normalizedKeywords = normalizeReplyOptionKeywords(keywords, normalizedCount)
  const directionGuidance = configuredDirectionGuidance(normalizedKeywords)
  return {
    type: 'object',
    additionalProperties: false,
    description: `Generate exactly ${normalizedCount} different, directly sendable third-person next ${normalizedCount === 1 ? 'message' : 'messages'} for the user-controlled protagonist.${directionGuidance} In every option, use the protagonist's established name or third-person pronoun as the narrative subject and write only what the protagonist says and/or does next. First-person wording may appear only inside the protagonist's quoted dialogue, never in narration or action. Do not write director instructions, other characters' reactions, guaranteed outcomes, option numbers, labels, keywords, or analysis.`,
    properties: {
      options: {
        type: 'array',
        description: `Exactly ${normalizedCount} distinct third-person protagonist ${normalizedCount === 1 ? 'message' : 'messages'}, each no longer than 200 Unicode characters.`,
        items: {
          type: 'string',
          description: 'One complete, directly sendable third-person message using the protagonist\'s established name or pronoun to describe what the protagonist says and/or does next.',
        },
      },
    },
    required: ['options'],
  }
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

/** Validate model input and return the versioned canonical value persisted in commit metadata. */
export function normalizeReplyOptionsInput(value, count = DEFAULT_REPLY_OPTIONS_COUNT) {
  const normalizedCount = normalizeReplyOptionsCount(count)
  if (!record(value) || Object.keys(value).some(key => !INPUT_KEYS.has(key))) {
    throw invalidReplyOptions('reply options must be a closed object containing only options', normalizedCount)
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
    // Persisted events remain readable after the configured exact count changes.
    const options = normalizeOptions(value.options)
    if (!options.every((option, index) => option === value.options[index])) return undefined
    return { version: REPLY_OPTIONS_PROTOCOL_VERSION, options }
  } catch {
    return undefined
  }
}

function normalizeOptions(value, expectedCount) {
  if (!Array.isArray(value)) throw invalidReplyOptions('options must be an array', expectedCount)
  if (expectedCount !== undefined && value.length !== expectedCount) {
    throw invalidReplyOptions(`options must contain exactly ${expectedCount} ${expectedCount === 1 ? 'item' : 'items'}`, expectedCount)
  }
  if (expectedCount === undefined && (value.length < REPLY_OPTIONS_MIN_ITEMS || value.length > REPLY_OPTIONS_MAX_ITEMS)) {
    throw invalidReplyOptions(`options must contain ${REPLY_OPTIONS_MIN_ITEMS} to ${REPLY_OPTIONS_MAX_ITEMS} items`)
  }
  const options = value.map((candidate, index) => {
    if (typeof candidate !== 'string') throw invalidReplyOptions(`options[${index}] must be a string`, expectedCount)
    const normalized = candidate.replaceAll(/\r\n?/gu, '\n').trim()
    const characters = [...normalized].length
    if (characters === 0) throw invalidReplyOptions(`options[${index}] must not be empty`, expectedCount)
    if (characters > REPLY_OPTION_MAX_CHARACTERS) {
      throw invalidReplyOptions(`options[${index}] exceeds ${REPLY_OPTION_MAX_CHARACTERS} Unicode characters`, expectedCount)
    }
    return normalized
  })
  if (new Set(options).size !== options.length) throw invalidReplyOptions('options must not contain duplicates', expectedCount)
  return options
}

function invalidReplyOptions(message, expectedCount) {
  const error = new Error(message)
  error.name = 'ReplyOptionsValidationError'
  error.code = 'RP_REPLY_OPTIONS_INVALID'
  error.feedback = {
    extension: REPLY_OPTIONS_EXTENSION_NAMESPACE,
    correction: expectedCount === undefined
      ? `Replace only rp.reply-options with ${REPLY_OPTIONS_MIN_ITEMS} to ${REPLY_OPTIONS_MAX_ITEMS} distinct, directly sendable third-person protagonist messages. Use the protagonist's established name or pronoun as the narrative subject in every option; first-person is allowed only inside quoted dialogue. Describe only what the protagonist says or does next, follow any option direction guidance, omit numbers and labels, then retry.`
      : `Replace only rp.reply-options with exactly ${expectedCount} distinct, directly sendable third-person protagonist ${expectedCount === 1 ? 'message' : 'messages'}. Use the protagonist's established name or pronoun as the narrative subject in every option; first-person is allowed only inside quoted dialogue. Describe only what the protagonist says or does next, follow any option direction guidance, omit numbers and labels, then retry.`,
  }
  return error
}

function configuredDirectionGuidance(keywords) {
  const configured = keywords.flatMap((keyword, index) => keyword.length === 0
    ? []
    : [`option ${index + 1}: ${JSON.stringify(keyword)}`])
  if (configured.length === 0) return ''
  return ` Follow this option direction mapping: ${configured.join('; ')}. Use each phrase only to guide its matching option; do not copy it as a label. Unspecified options are model-chosen.`
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
