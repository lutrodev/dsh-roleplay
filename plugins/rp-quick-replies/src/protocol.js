export const QUICK_REPLIES_SETTINGS_NAMESPACE = 'rp-quick-replies'
export const QUICK_REPLIES_RPC_PATH = '/rp-quick-replies'

export const MAX_QUICK_REPLIES = 12
export const MAX_QUICK_REPLY_LABEL_CHARACTERS = 12
export const MAX_QUICK_REPLY_CONTENT_CHARACTERS = 2000
export const MAX_QUICK_REPLY_TOTAL_CHARACTERS = 8000

export const DEFAULT_QUICK_REPLIES = Object.freeze([
  Object.freeze({ id: 'double-quote', label: '“”', content: '“”' }),
  Object.freeze({ id: 'parentheses', label: '（）', content: '（）' }),
  Object.freeze({ id: 'continue', label: '继续', content: '继续' }),
])

const PAIRS = new Map([
  ['""', ['"', '"']],
  ["''", ["'", "'"]],
  ['“”', ['“', '”']],
  ['‘’', ['‘', '’']],
  ['()', ['(', ')']],
  ['（）', ['（', '）']],
  ['[]', ['[', ']']],
  ['【】', ['【', '】']],
  ['{}', ['{', '}']],
])

/** Validate and detach the complete global quick-reply list. */
export function normalizeQuickReplies(value) {
  if (!Array.isArray(value)) throw coded('INVALID_REQUEST', 'Quick replies must be an array.')
  if (value.length > MAX_QUICK_REPLIES) {
    throw coded('LIMIT_EXCEEDED', `At most ${MAX_QUICK_REPLIES} quick replies can be stored.`)
  }
  const ids = new Set()
  const labels = new Set()
  let totalCharacters = 0
  const replies = value.map((item, index) => {
    if (!record(item)) throw coded('INVALID_REQUEST', `Quick reply ${index + 1} must be an object.`)
    const id = text(item.id)?.trim()
    const label = text(item.label)?.trim()
    const content = text(item.content)?.replace(/\r\n?/g, '\n')
    if (id === undefined || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(id)) {
      throw coded('INVALID_REQUEST', `Quick reply ${index + 1} has an invalid id.`)
    }
    if (ids.has(id)) throw coded('DUPLICATE_REPLY', 'Quick reply ids must be unique.')
    ids.add(id)
    if (label === undefined || label.length === 0) {
      throw coded('INVALID_REQUEST', `Quick reply ${index + 1} needs a label.`)
    }
    if (characters(label) > MAX_QUICK_REPLY_LABEL_CHARACTERS) {
      throw coded('LIMIT_EXCEEDED', `Quick reply labels cannot exceed ${MAX_QUICK_REPLY_LABEL_CHARACTERS} characters.`)
    }
    const normalizedLabel = label.toLocaleLowerCase()
    if (labels.has(normalizedLabel)) throw coded('DUPLICATE_LABEL', 'Quick reply labels must be unique.')
    labels.add(normalizedLabel)
    if (content === undefined || content.trim().length === 0) {
      throw coded('INVALID_REQUEST', `Quick reply ${index + 1} needs content.`)
    }
    const contentCharacters = characters(content)
    if (contentCharacters > MAX_QUICK_REPLY_CONTENT_CHARACTERS) {
      throw coded('LIMIT_EXCEEDED', `Quick reply content cannot exceed ${MAX_QUICK_REPLY_CONTENT_CHARACTERS} characters.`)
    }
    totalCharacters += contentCharacters
    return { id, label, content }
  })
  if (totalCharacters > MAX_QUICK_REPLY_TOTAL_CHARACTERS) {
    throw coded('LIMIT_EXCEEDED', `Quick replies cannot exceed ${MAX_QUICK_REPLY_TOTAL_CHARACTERS} total characters.`)
  }
  return replies
}

/** Insert one reply at the current textarea selection, wrapping selected text for paired delimiters. */
export function insertQuickReply(draft, content, selection) {
  const source = typeof draft === 'string' ? draft : ''
  const insertion = typeof content === 'string' ? content : ''
  const start = coordinate(selection?.start, source.length)
  const end = Math.max(start, coordinate(selection?.end, source.length))
  const pair = PAIRS.get(insertion)
  if (pair !== undefined) {
    const [open, close] = pair
    const selected = source.slice(start, end)
    return {
      text: `${source.slice(0, start)}${open}${selected}${close}${source.slice(end)}`,
      selection: selected.length === 0
        ? { start: start + open.length, end: start + open.length }
        : { start: start + open.length, end: start + open.length + selected.length },
    }
  }
  const caret = start + insertion.length
  return {
    text: `${source.slice(0, start)}${insertion}${source.slice(end)}`,
    selection: { start: caret, end: caret },
  }
}

function coordinate(value, maximum) {
  if (!Number.isSafeInteger(value)) return maximum
  return Math.min(Math.max(value, 0), maximum)
}

function characters(value) { return [...value].length }
function text(value) { return typeof value === 'string' ? value : undefined }
function record(value) { return typeof value === 'object' && value !== null && !Array.isArray(value) }
function coded(code, message) { return Object.assign(new Error(message), { code }) }
