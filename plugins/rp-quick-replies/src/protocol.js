export const QUICK_REPLIES_SETTINGS_NAMESPACE = 'rp-quick-replies'
export const QUICK_REPLIES_RPC_PATH = '/rp-quick-replies'

export const MAX_QUICK_REPLIES = 12
export const MAX_QUICK_REPLY_LABEL_CHARACTERS = 12
export const MAX_QUICK_REPLY_CONTENT_CHARACTERS = 2000
export const MAX_QUICK_REPLY_TOTAL_CHARACTERS = 8000

export const QUICK_REPLY_CURSOR_POSITION_MIDDLE = 'middle'
export const QUICK_REPLY_CURSOR_POSITION_END = 'end'

export const DEFAULT_QUICK_REPLIES = Object.freeze([
  Object.freeze({
    id: 'double-quote', label: '“”', content: '“”', cursorPosition: QUICK_REPLY_CURSOR_POSITION_MIDDLE,
  }),
  Object.freeze({
    id: 'parentheses', label: '（）', content: '（）', cursorPosition: QUICK_REPLY_CURSOR_POSITION_MIDDLE,
  }),
  Object.freeze({
    id: 'continue', label: '继续', content: '继续', cursorPosition: QUICK_REPLY_CURSOR_POSITION_END,
  }),
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
    const cursorPosition = item.cursorPosition === undefined
      ? legacyCursorPosition(content)
      : text(item.cursorPosition)
    if (cursorPosition !== QUICK_REPLY_CURSOR_POSITION_MIDDLE && cursorPosition !== QUICK_REPLY_CURSOR_POSITION_END) {
      throw coded('INVALID_REQUEST', `Quick reply ${index + 1} has an invalid cursor position.`)
    }
    totalCharacters += contentCharacters
    return { id, label, content, cursorPosition }
  })
  if (totalCharacters > MAX_QUICK_REPLY_TOTAL_CHARACTERS) {
    throw coded('LIMIT_EXCEEDED', `Quick replies cannot exceed ${MAX_QUICK_REPLY_TOTAL_CHARACTERS} total characters.`)
  }
  return replies
}

/** Build the ordered editor edits that insert one reply and leave a collapsed caret at the requested position. */
export function planQuickReplyEdits(content, selection, cursorPosition) {
  const insertion = typeof content === 'string' ? content : ''
  const start = nonNegativeCoordinate(selection?.start)
  const end = Math.max(start, nonNegativeCoordinate(selection?.end))
  const resolvedCursorPosition = cursorPosition === undefined ? legacyCursorPosition(insertion) : cursorPosition
  if (resolvedCursorPosition === QUICK_REPLY_CURSOR_POSITION_END) {
    return [{ start, end, text: insertion }]
  }
  const pair = PAIRS.get(insertion)
  if (pair !== undefined && start < end) {
    const [open, close] = pair
    return [
      { start: end, end, text: close },
      { start, end: start, text: open },
    ]
  }
  const middle = pair?.[0].length ?? middleOffset(insertion)
  return [
    { start, end, text: insertion },
    { start: start + middle, end: start + middle, text: '' },
  ]
}

/** Insert one reply at the current plain-text selection and return its requested caret placement. */
export function insertQuickReply(draft, content, selection, cursorPosition) {
  const source = typeof draft === 'string' ? draft : ''
  const start = coordinate(selection?.start, source.length)
  const end = Math.max(start, coordinate(selection?.end, source.length))
  const edits = planQuickReplyEdits(content, { start, end }, cursorPosition)
  let text = source
  let caret = start
  for (const edit of edits) {
    text = `${text.slice(0, edit.start)}${edit.text}${text.slice(edit.end)}`
    caret = edit.start + edit.text.length
  }
  return {
    text,
    selection: { start: caret, end: caret },
  }
}

function legacyCursorPosition(content) {
  return PAIRS.has(content) ? QUICK_REPLY_CURSOR_POSITION_MIDDLE : QUICK_REPLY_CURSOR_POSITION_END
}

function middleOffset(value) {
  const characters = [...value]
  return characters.slice(0, Math.floor(characters.length / 2)).join('').length
}

function coordinate(value, maximum) {
  if (!Number.isSafeInteger(value)) return maximum
  return Math.min(Math.max(value, 0), maximum)
}

function nonNegativeCoordinate(value) {
  return Number.isSafeInteger(value) ? Math.max(value, 0) : 0
}

function characters(value) { return [...value].length }
function text(value) { return typeof value === 'string' ? value : undefined }
function record(value) { return typeof value === 'object' && value !== null && !Array.isArray(value) }
function coded(code, message) { return Object.assign(new Error(message), { code }) }
