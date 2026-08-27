import assert from 'node:assert/strict'
import test from 'node:test'
import { apply } from '../src/client.js'
import { ensureStyles, STYLE_ID, STYLE_OWNER, STYLE_TEXT } from '../src/styles.js'

test('collapses glyph-backed access triggers at every composer width', () => {
  assert.doesNotMatch(STYLE_TEXT, /@container|@media/)
  assert.match(STYLE_TEXT, /aria-label\^='访问模式，当前：'/)
  assert.match(STYLE_TEXT, /aria-label\^='Access mode, current:'\]/)
  assert.match(STYLE_TEXT, /:has\(> span:first-child > svg\[viewBox='0 0 16 16'\]\)/)
  assert.match(STYLE_TEXT, /> span:not\(:first-child\)/)
  assert.match(STYLE_TEXT, /width: 28px/)
  assert.doesNotMatch(STYLE_TEXT, /class\*?=/)
})

test('owns one stylesheet for exactly the browser plugin lifecycle', () => {
  const previous = { removed: false, remove() { this.removed = true } }
  const appended = []
  const documentObject = {
    getElementById(id) { return id === STYLE_ID ? previous : null },
    createElement(tag) {
      assert.equal(tag, 'style')
      return { dataset: {}, removed: false, remove() { this.removed = true } }
    },
    head: { append(style) { appended.push(style) } },
  }

  const dispose = ensureStyles(documentObject)
  assert.equal(previous.removed, true)
  assert.equal(appended.length, 1)
  assert.equal(appended[0].id, STYLE_ID)
  assert.equal(appended[0].dataset.plugin, STYLE_OWNER)
  assert.equal(appended[0].textContent, STYLE_TEXT)
  assert.equal(appended[0].removed, false)
  dispose()
  assert.equal(appended[0].removed, true)
})

test('registers stylesheet setup through the Cordis effect lifecycle', () => {
  let effect
  apply({ effect(run) { effect = run } })
  assert.equal(effect, ensureStyles)
})
