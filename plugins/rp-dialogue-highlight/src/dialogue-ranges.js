const OPEN_TO_CLOSE = new Map([
  ['“', '”'],
  ['‘', '’'],
  ['「', '」'],
  ['『', '』'],
  ['«', '»'],
  ['‹', '›'],
  ['"', '"'],
  ['＂', '＂'],
])
const CLOSERS = new Set(OPEN_TO_CLOSE.values())
const BOUNDARY = '\0'

/**
 * Locate quoted spans in rendered prose. Offsets include both quote marks so
 * punctuation and delimiters receive one continuous treatment.
 */
export function findDialogueRanges(text, { includeUnclosed = false } = {}) {
  const ranges = []
  const stack = []
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    if (character === BOUNDARY) {
      stack.length = 0
      continue
    }
    const closing = OPEN_TO_CLOSE.get(character)
    if (closing !== undefined) {
      const top = stack.at(-1)
      if (closing === character && top?.closing === character) {
        stack.pop()
        if (index > top.start) ranges.push({ start: top.start, end: index + 1 })
      } else {
        stack.push({ start: index, closing })
      }
      continue
    }
    if (!CLOSERS.has(character)) continue
    const top = stack.at(-1)
    if (top?.closing !== character) continue
    stack.pop()
    if (index > top.start) ranges.push({ start: top.start, end: index + 1 })
  }
  if (includeUnclosed) {
    for (const opening of stack) {
      if (text.length > opening.start) ranges.push({ start: opening.start, end: text.length })
    }
  }
  return ranges.sort((left, right) => left.start - right.start || right.end - left.end)
}

export const dialogueBoundary = BOUNDARY
