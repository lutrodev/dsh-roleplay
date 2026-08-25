const OPERATION_BLOCK = /<(UpdateVariable|update|JSONPatch|json_patch)\b[^>]*>([\s\S]*?)<\/\1\s*>/gi
const RESIDUAL_CONTROL_TAG = /<\/?(?:initvar|UpdateVariable|update|JSONPatch|json_patch)\b[^>]*>/i
const LEGACY_OPERATION_SYNTAX = /(?:<\/?(?:UpdateVariable|update|JSONPatch|json_patch)\b|RFC\s*6902|update commands?|_\.(?:set|add|insert|assign|delete|remove|unset|move|sub|mul|div|del)\s*\()/i
const LEGACY_OUTPUT_SYNTAX = /\{\{\s*(?:format_message_variable|get_message_variable)\b/i

/** Replace every balanced MVU operation block without executing its contents. */
export function replaceMvuOperationBlocks(value, replacer) {
  return String(value ?? '').replace(OPERATION_BLOCK, (whole, tag, body, offset) => replacer({
    whole,
    tag,
    body,
    offset,
    kind: isPatchTag(tag) ? 'patch' : 'update',
  }))
}

/** Return balanced MVU operation blocks in source order. */
export function collectMvuOperationBlocks(value) {
  const blocks = []
  replaceMvuOperationBlocks(value, block => {
    blocks.push(block)
    return block.whole
  })
  return blocks
}

/** Remove malformed or unbalanced MVU control tags without executing trailing text. */
export function stripResidualMvuControlTags(value) {
  let text = String(value ?? '')
  const fragments = []
  while (true) {
    const match = RESIDUAL_CONTROL_TAG.exec(text)
    if (match === null) break
    const closing = text[match.index + 1] === '/'
    if (!closing) {
      fragments.push(text.slice(match.index))
      text = text.slice(0, match.index)
      break
    }
    fragments.push(match[0])
    text = text.slice(0, match.index) + text.slice(match.index + match[0].length)
  }
  return { text, fragments }
}

/** Detect legacy MVU write protocols so they can be quarantined, never executed. */
export function hasMvuLegacyOperationSyntax(value) {
  return LEGACY_OPERATION_SYNTAX.test(String(value ?? ''))
}

/** Detect legacy variable-output entries superseded by native rp.state context. */
export function hasMvuLegacyOutputSyntax(value) {
  return LEGACY_OUTPUT_SYNTAX.test(String(value ?? ''))
}

function isPatchTag(tag) {
  return ['jsonpatch', 'json_patch'].includes(String(tag).toLocaleLowerCase())
}
