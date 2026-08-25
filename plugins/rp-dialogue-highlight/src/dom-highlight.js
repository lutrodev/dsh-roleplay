import { dialogueBoundary, findDialogueRanges } from './dialogue-ranges.js'

const HIGHLIGHT_NAME = 'rp-dialogue'
const OVERLAY_ATTRIBUTE = 'data-rp-dialogue-overlay'
const SPAN_ATTRIBUTE = 'data-rp-dialogue-span'
const EXCLUDED = 'pre, code, button, textarea, input, select, script, style, svg, [contenteditable="true"], [aria-hidden="true"], [data-variant="think"]'
const BLOCK_TAGS = new Set(['ADDRESS', 'ARTICLE', 'BLOCKQUOTE', 'DIV', 'FIGCAPTION', 'FIGURE', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'OL', 'P', 'SECTION', 'TABLE', 'UL'])
const nativeEntries = new Map()

/** Mount one non-invasive annotation against the DSH-owned assistant root. */
export function mountDialogueHighlight(root, entry, { streaming = false } = {}) {
  const native = nativeCapability(root)
  if (native !== undefined) {
    try {
      return mountNativeHighlight(root, entry, native, streaming)
    } catch {
      discardNativeEntry(entry, native.registry)
    }
  }
  return mountFallbackOverlay(root, streaming)
}

function mountNativeHighlight(root, entry, capability, streaming) {
  const refresh = () => publishNative(entry, capability, rangesForElement(root, streaming))
  refresh()
  const Observer = root.ownerDocument.defaultView?.MutationObserver
  const observer = typeof Observer === 'function' ? new Observer(refresh) : undefined
  observer?.observe(root, { childList: true, characterData: true, subtree: true })
  return () => {
    observer?.disconnect()
    removeNativeEntry(entry)
  }
}

function mountFallbackOverlay(root, streaming) {
  const document = root.ownerDocument
  const view = document.defaultView
  let overlay
  let frame
  let disposed = false
  const requestFrame = typeof view?.requestAnimationFrame === 'function'
    ? callback => view.requestAnimationFrame(callback)
    : callback => view?.setTimeout(callback, 16)
  const cancelFrame = typeof view?.cancelAnimationFrame === 'function'
    ? value => view.cancelAnimationFrame(value)
    : value => view?.clearTimeout(value)
  const position = () => {
    if (overlay === undefined) return
    const rect = root.getBoundingClientRect()
    overlay.hidden = rect.width <= 0 || rect.height <= 0
    overlay.style.top = `${rect.top}px`
    overlay.style.left = `${rect.left}px`
    overlay.style.width = `${rect.width}px`
    overlay.style.height = `${rect.height}px`
  }
  const rebuild = () => {
    frame = undefined
    if (disposed) return
    overlay?.remove()
    overlay = createFallbackOverlay(root, streaming)
    position()
  }
  const schedule = () => {
    if (disposed || frame !== undefined) return
    frame = requestFrame(rebuild)
  }
  rebuild()
  const Observer = view?.MutationObserver
  const observer = typeof Observer === 'function' ? new Observer(schedule) : undefined
  observer?.observe(root, { attributes: true, childList: true, characterData: true, subtree: true })
  const ResizeObserver = view?.ResizeObserver
  const resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(schedule) : undefined
  resizeObserver?.observe(root)
  view?.addEventListener('scroll', position, true)
  view?.addEventListener('resize', schedule)
  void document.fonts?.ready?.then?.(schedule)
  return () => {
    disposed = true
    observer?.disconnect()
    resizeObserver?.disconnect()
    view?.removeEventListener('scroll', position, true)
    view?.removeEventListener('resize', schedule)
    if (frame !== undefined) cancelFrame(frame)
    overlay?.remove()
  }
}

function createFallbackOverlay(root, streaming) {
  const document = root.ownerDocument
  if (document.body === null) return undefined
  const overlay = root.cloneNode(true)
  if (overlay.nodeType !== 1) return undefined
  overlay.querySelectorAll(`[${OVERLAY_ATTRIBUTE}]`).forEach(node => node.remove())
  overlay.removeAttribute('id')
  overlay.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'))
  const segments = textSegments(overlay)
  const text = segments.map(segment => segment.text).join('')
  const ranges = findDialogueRanges(text, { includeUnclosed: streaming })
  if (ranges.length === 0) return undefined
  decorateSegments(segments, ranges, document)
  overlay.setAttribute(OVERLAY_ATTRIBUTE, '')
  overlay.setAttribute('aria-hidden', 'true')
  overlay.setAttribute('role', 'presentation')
  overlay.querySelectorAll('a, button, input, select, textarea, [tabindex]').forEach(node => {
    node.removeAttribute('href')
    node.setAttribute('tabindex', '-1')
  })
  document.body.append(overlay)
  return overlay
}

function decorateSegments(segments, ranges, document) {
  for (const segment of segments) {
    if (segment.node === null) continue
    const slices = highlightSlices(segment.start, segment.end, ranges)
    if (!slices.some(slice => slice.highlighted)) continue
    const fragment = document.createDocumentFragment()
    for (const slice of slices) {
      const value = segment.text.slice(slice.start - segment.start, slice.end - segment.start)
      if (!slice.highlighted) {
        fragment.append(document.createTextNode(value))
        continue
      }
      const span = document.createElement('span')
      span.setAttribute(SPAN_ATTRIBUTE, '')
      span.textContent = value
      fragment.append(span)
    }
    segment.node.replaceWith(fragment)
  }
}

/** Return a complete, non-overlapping partition for one text-node interval. */
export function highlightSlices(start, end, ranges) {
  const intersections = ranges
    .map(range => ({ start: Math.max(start, range.start), end: Math.min(end, range.end) }))
    .filter(range => range.start < range.end)
    .sort((left, right) => left.start - right.start || left.end - right.end)
  const merged = []
  for (const range of intersections) {
    const tail = merged.at(-1)
    if (tail !== undefined && range.start <= tail.end) tail.end = Math.max(tail.end, range.end)
    else merged.push({ ...range })
  }
  const slices = []
  let cursor = start
  for (const range of merged) {
    if (cursor < range.start) slices.push({ start: cursor, end: range.start, highlighted: false })
    slices.push({ start: range.start, end: range.end, highlighted: true })
    cursor = range.end
  }
  if (cursor < end) slices.push({ start: cursor, end, highlighted: false })
  return slices
}

function nativeCapability(root) {
  const view = root.ownerDocument.defaultView
  const registry = view?.CSS?.highlights
  const Highlight = view?.Highlight
  return registry !== undefined && typeof Highlight === 'function' ? { registry, Highlight } : undefined
}

function publishNative(entry, capability, ranges) {
  nativeEntries.set(entry, { ...capability, ranges })
  syncNativeRegistry(capability.registry)
}

function removeNativeEntry(entry) {
  const current = nativeEntries.get(entry)
  if (current === undefined) return
  nativeEntries.delete(entry)
  syncNativeRegistry(current.registry)
}

function discardNativeEntry(entry, registry) {
  nativeEntries.delete(entry)
  try {
    syncNativeRegistry(registry)
  } catch {
    try {
      registry.delete(HIGHLIGHT_NAME)
    } catch {
      // A partially implemented Custom Highlight registry is unusable; the
      // caller immediately switches this surface to the DOM-overlay path.
    }
  }
}

function syncNativeRegistry(registry) {
  const entries = [...nativeEntries.values()].filter(item => item.registry === registry)
  const ranges = entries.flatMap(item => item.ranges)
  if (ranges.length === 0) {
    registry.delete(HIGHLIGHT_NAME)
    return
  }
  registry.set(HIGHLIGHT_NAME, new entries[0].Highlight(...ranges))
}

function rangesForElement(root, streaming = false) {
  if (typeof root.ownerDocument?.createRange !== 'function') return []
  const segments = textSegments(root)
  const text = segments.map(segment => segment.text).join('')
  return findDialogueRanges(text, { includeUnclosed: streaming }).flatMap(range => {
    const start = textPosition(segments, range.start)
    const end = textPosition(segments, range.end - 1)
    if (start === null || end === null) return []
    const domRange = root.ownerDocument.createRange()
    domRange.setStart(start.node, start.offset)
    domRange.setEnd(end.node, end.offset + 1)
    return [domRange]
  })
}

function textSegments(root) {
  const segments = []
  let cursor = 0
  const append = (text, node = null) => {
    if (text.length === 0) return
    segments.push({ text, node, start: cursor, end: cursor + text.length })
    cursor += text.length
  }
  const visit = node => {
    if (node.nodeType === 3) {
      append(node.data ?? '', node)
      return
    }
    if (node.nodeType !== 1) return
    const element = node
    if (element !== root && element.matches(EXCLUDED)) {
      append(dialogueBoundary)
      return
    }
    if (element.tagName === 'BR') {
      append('\n')
      return
    }
    for (const child of element.childNodes) visit(child)
    if (element !== root && BLOCK_TAGS.has(element.tagName)) append('\n')
  }
  visit(root)
  return segments
}

function textPosition(segments, offset) {
  for (const segment of segments) {
    if (segment.node !== null && offset >= segment.start && offset < segment.end) {
      return { node: segment.node, offset: offset - segment.start }
    }
  }
  return null
}

export const dialogueHighlightInternals = { rangesForElement, textSegments }
