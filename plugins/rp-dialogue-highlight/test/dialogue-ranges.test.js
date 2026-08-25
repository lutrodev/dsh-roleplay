import assert from 'node:assert/strict'
import test from 'node:test'
import {
  apply,
  dialogueHighlightNodeDefinition,
  findAssistantRow,
  updateHighlightState,
} from '../src/client.js'
import { dialogueBoundary, findDialogueRanges } from '../src/dialogue-ranges.js'
import { highlightSlices } from '../src/dom-highlight.js'

function selected(text) {
  return findDialogueRanges(text).map(range => text.slice(range.start, range.end))
}

test('locates the supported Chinese and straight quote pairs', () => {
  const text = '她说：“留下。” 又补充「别回头」。最后是 "okay"。'
  assert.deepEqual(selected(text), ['“留下。”', '「别回头」', '"okay"'])
})

test('keeps nested quotation ranges and spans line breaks', () => {
  const text = '“她问：‘现在走吗？’\n我点了头。”'
  assert.deepEqual(selected(text), [text, '‘现在走吗？’'])
})

test('ignores unmatched quotes and never pairs across excluded content', () => {
  assert.deepEqual(selected('前文“没有结束'), [])
  assert.deepEqual(selected(`“正文${dialogueBoundary}代码”`), [])
})

test('temporarily extends unclosed quotes to the streaming text end', () => {
  const text = '前文“她问：‘现在走吗'
  const ranges = findDialogueRanges(text, { includeUnclosed: true })
  assert.deepEqual(ranges.map(range => text.slice(range.start, range.end)), [
    '“她问：‘现在走吗',
    '‘现在走吗',
  ])
  assert.deepEqual(findDialogueRanges(`“正文${dialogueBoundary}代码`, { includeUnclosed: true }), [])
})

test('treats repeated straight quotes as independent pairs', () => {
  const text = '她说"一"，又说"二"。'
  assert.deepEqual(selected(text), ['"一"', '"二"'])
})

test('partitions clone text nodes against nested and cross-node ranges', () => {
  assert.deepEqual(highlightSlices(4, 12, [
    { start: 1, end: 7 },
    { start: 6, end: 10 },
    { start: 11, end: 20 },
  ]), [
    { start: 4, end: 10, highlighted: true },
    { start: 10, end: 11, highlighted: false },
    { start: 11, end: 12, highlighted: true },
  ])
})

test('projects a stable streaming anchor and settles it with the assistant message', () => {
  const start = { type: 'step/start', seq: 10, time: 100, data: { turn: 2, step: 3 } }
  let state = dialogueHighlightNodeDefinition.start({}, { event: start })
  assert.equal(dialogueHighlightNodeDefinition.buildViewNode({ state, key: 'k', id: '2:3', matches: [] }), null)

  state = updateHighlightState(state, {
    type: 'assistant/chunk', seq: 12, time: 120,
    data: { turn: 2, step: 3, chunk: { type: 'text-delta', index: 0, text: '“你好' } },
  })
  state = updateHighlightState(state, {
    type: 'assistant/chunk', seq: 13, time: 130,
    data: { turn: 2, step: 3, chunk: { type: 'text-delta', index: 0, text: '。”' } },
  })
  let node = dialogueHighlightNodeDefinition.buildViewNode({ state, key: 'k', id: '2:3', matches: [] })
  assert.equal(node.anchorSeq, 12.01)
  assert.deepEqual(node.data, { streaming: true })

  state = updateHighlightState(state, {
    type: 'assistant/message', surfaceOp: 'append', seq: 20, time: 200,
    data: { turn: 2, step: 3, message: { content: [] } },
  })
  node = dialogueHighlightNodeDefinition.buildViewNode({ state, key: 'k', id: '2:3', matches: [] })
  assert.equal(node.anchorSeq, 20.01)
  assert.deepEqual(node.data, { streaming: false })

  state = updateHighlightState(state, {
    type: 'assistant/message', surfaceOp: 'replace', seq: 30, time: 300,
    data: { turn: 2, step: 3, message: { content: [] } },
  })
  assert.equal(state.anchorSeq, 20)
})

test('resets the streaming anchor on retry and settles interrupted output', () => {
  let state = updateHighlightState(undefined, {
    type: 'assistant/chunk', seq: 4, data: {
      turn: 1, step: 1,
      chunk: { type: 'block-end', index: 0, block: { type: 'text', text: '“片段' } },
    },
  })
  assert.equal(state.anchorSeq, 4)
  state = updateHighlightState(state, { type: 'llm/retry', seq: 5, data: { turn: 1, step: 1 } })
  assert.equal(state.anchorSeq, undefined)
  assert.equal(state.streaming, true)
  state = updateHighlightState(state, {
    type: 'assistant/chunk', seq: 6, data: {
      turn: 1, step: 1,
      chunk: { type: 'text-delta', index: 0, text: '“重试' },
    },
  })
  state = updateHighlightState(state, { type: 'step/end', seq: 9, data: { turn: 1, step: 1 } })
  assert.equal(state.anchorSeq, 9)
  assert.equal(state.streaming, false)
})

test('resolves the assistant row across other projection nodes', () => {
  const assistant = { dataset: { chatFlowKind: 'assistant-step' }, previousElementSibling: null }
  const avatar = { dataset: { chatFlowKind: 'rp-message-avatar-assistant' }, previousElementSibling: assistant }
  const host = { previousElementSibling: avatar }
  const anchor = { closest: () => host }
  assert.equal(findAssistantRow(anchor), assistant)

  const user = { dataset: { chatFlowKind: 'user' }, previousElementSibling: assistant }
  host.previousElementSibling = user
  assert.equal(findAssistantRow(anchor), null)
})

test('keeps styles, projection, and node registration active until unload', () => {
  const previousDocument = globalThis.document
  let styleAppends = 0
  let styleRemovals = 0
  let slotRegistrations = 0
  let slotDisposals = 0
  let projectionRegistrations = 0
  const effectCleanups = []
  const style = {
    dataset: {},
    remove() { styleRemovals += 1 },
  }
  globalThis.document = {
    getElementById: () => null,
    createElement: () => style,
    head: { append() { styleAppends += 1 } },
  }
  const ctx = {
    effect(execute) {
      effectCleanups.push(execute())
    },
    conversationEvents: {
      register() {
        projectionRegistrations += 1
        let disposed = false
        const dispose = () => {
          if (disposed) return
          disposed = true
          projectionRegistrations -= 1
        }
        effectCleanups.push(dispose)
        return dispose
      },
    },
    slots: {
      inject(_name, register) {
        const disposeRegistration = register()
        let disposed = false
        const dispose = () => {
          if (disposed) return
          disposed = true
          slotDisposals += 1
          disposeRegistration?.()
        }
        effectCleanups.push(dispose)
        return dispose
      },
      register() {
        slotRegistrations += 1
        return () => { slotRegistrations -= 1 }
      },
    },
  }

  try {
    apply(ctx)
    assert.equal(styleAppends, 1)
    assert.equal(styleRemovals, 0)
    assert.equal(slotRegistrations, 1)
    assert.equal(slotDisposals, 0)
    assert.equal(projectionRegistrations, 1)

    for (const cleanup of effectCleanups.reverse()) cleanup?.()
    assert.equal(styleRemovals, 1)
    assert.equal(slotRegistrations, 0)
    assert.equal(slotDisposals, 1)
    assert.equal(projectionRegistrations, 0)
  } finally {
    globalThis.document = previousDocument
  }
})

test('client entry mounts from a public streaming conversation node', async () => {
  const fs = await import('node:fs/promises')
  const source = await fs.readFile(new URL('../src/client.js', import.meta.url), 'utf8')
  const styles = await fs.readFile(new URL('../src/client.module.css', import.meta.url), 'utf8')
  assert.match(source, /conversation\.chat\.node/)
  assert.match(source, /conversationEvents\.register/)
  assert.match(source, /slots\.inject/)
  assert.match(source, /slots\.register/)
  assert.match(source, /mountDialogueHighlight/)
  assert.match(source, /rp-dialogue-highlight/)
  assert.doesNotMatch(source, /conversation\.chat\.assistant-actions|querySelector/)
  const domSource = await fs.readFile(new URL('../src/dom-highlight.js', import.meta.url), 'utf8')
  assert.match(domSource, /CSS\?\.highlights/)
  assert.match(domSource, /cloneNode\(true\)/)
  assert.match(domSource, /ResizeObserver/)
  assert.match(domSource, /data-rp-dialogue-overlay/)
  assert.match(domSource, /pre, code, button/)
  assert.doesNotMatch(domSource, /innerHTML|root\.append|root\.replaceChildren/)
  assert.match(styles, /::highlight\(rp-dialogue\)[^{]*\{[^}]*color:/)
  assert.match(styles, /\.anchor\s*\{[^}]*display:\s*none/)
  assert.match(styles, /data-chat-flow-kind="rp-dialogue-highlight"/)
  assert.match(styles, /\[data-rp-dialogue-overlay\]/)
  assert.doesNotMatch(styles, /\[data-rp-dialogue-span\][^{]*\{[^}]*(?:background|background-color):/)
})
