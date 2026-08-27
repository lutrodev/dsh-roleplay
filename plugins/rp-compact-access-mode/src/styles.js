export const STYLE_ID = 'dsh-roleplay-rp-compact-access-mode-styles'
export const STYLE_OWNER = 'dsh-roleplay-rp-compact-access-mode'

/**
 * Match the public accessibility names instead of CSS-module class names.
 * Harness currently ships Chinese and English composer locales. The glyph
 * guard preserves a text label for host-defined permission modes that have no
 * icon.
 */
export const STYLE_TEXT = `
[data-composer-card] button:is(
  [aria-label^='访问模式，当前：'],
  [aria-label^='Access mode, current:']
):has(> span:first-child > svg[viewBox='0 0 16 16']) {
  box-sizing: border-box;
  width: 28px;
  padding-inline: 0;
  justify-content: center;
  gap: 0;
}

[data-composer-card] button:is(
  [aria-label^='访问模式，当前：'],
  [aria-label^='Access mode, current:']
):has(> span:first-child > svg[viewBox='0 0 16 16']) > span:not(:first-child) {
  display: none;
}
`

export function ensureStyles(documentObject = document) {
  documentObject.getElementById(STYLE_ID)?.remove()
  const style = documentObject.createElement('style')
  style.id = STYLE_ID
  style.dataset.plugin = STYLE_OWNER
  style.textContent = STYLE_TEXT
  documentObject.head.append(style)
  return () => { style.remove() }
}
