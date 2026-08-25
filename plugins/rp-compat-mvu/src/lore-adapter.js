import { stripMvuControlBlocks } from './convert.js'
import { createMvuCompatibilityView, isMvuControlEntry } from './native-state.js'
import { compileStateTemplate, renderStateTemplate } from './state-template.js'

/** Build one run-scoped adapter over an immutable native State snapshot. */
export function createMvuLoreActivation(state, namespace) {
  const snapshot = state?.namespaces?.[namespace]
  const value = snapshot?.value ?? {}
  const compatibilityValue = createMvuCompatibilityView(value, snapshot?.definition?.schema)
  const variables = { stat_data: compatibilityValue, display_data: compatibilityValue, state: compatibilityValue }
  const compiled = new Map()
  return {
    revision: `${state?.revision ?? 0}:${snapshot?.revision ?? 0}`,
    transformEntry({ book, entry, content, keys, secondaryKeys, resolveEntry }) {
      if (isMvuControlEntry(entry)) {
        return {
          exclude: true,
          diagnostics: [{ status: 'excluded', reason: 'compat-control-entry' }],
        }
      }
      const cleaned = stripMvuControlBlocks(content).text
      const identity = `${book.id}:${entry.id}`
      let template = compiled.get(identity)
      if (!compiled.has(identity)) {
        template = compileStateTemplate(cleaned)
        compiled.set(identity, template)
      }
      const options = { resolveWorldInfo: resolveEntry }
      return {
        content: renderStateTemplate(cleaned, template, variables, options),
        keys: keys.map(key => renderStateTemplate(key, compileStateTemplate(key), variables, options)),
        secondaryKeys: secondaryKeys.map(key => renderStateTemplate(key, compileStateTemplate(key), variables, options)),
      }
    },
  }
}
