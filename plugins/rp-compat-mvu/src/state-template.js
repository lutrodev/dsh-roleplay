const TAG = /<%([_=#-]?)([\s\S]*?)([_-]?)%>/g
const GETVAR_MACRO = /\{\{getvar::([^}]+)\}\}|\{\{getvar\s+["']([^"']+)["']\}\}/gi
const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/

/** Compile the safe MVU/EJS condition subset used by variable-driven lore entries. */
export function compileStateTemplate(content) {
  if (typeof content !== 'string') throw new Error('state template content must be a string')
  if (!content.includes('<%')) return undefined
  const root = []
  const stack = [{ nodes: root }]
  let offset = 0
  for (const match of content.matchAll(TAG)) {
    let text = content.slice(offset, match.index)
    if (match[1] === '_') text = text.replace(/\s+$/, '')
    appendText(current(stack), text)
    const code = match[2].trim()
    if (match[1] === '#') {
      // EJS comments are deliberately ignored and never evaluated.
    } else if (match[1] === '=' || match[1] === '-') appendOutput(current(stack), code)
    else parseStatements(code, stack)
    offset = match.index + match[0].length
    if (match[3] === '_') offset += /^\s*/.exec(content.slice(offset))[0].length
    else if (match[3] === '-') offset += /^(?:\r?\n)?/.exec(content.slice(offset))[0].length
  }
  const tail = content.slice(offset)
  if (tail.includes('<%')) throw new Error('MVU template contains an unclosed tag')
  appendText(current(stack), tail)
  if (stack.length !== 1) throw new Error('MVU template has an unclosed if block')
  return { version: 2, nodes: root }
}

/** Render a compiled template and SillyTavern getvar macros from native state variables. */
export function renderStateTemplate(content, template, variables = {}, options = {}) {
  const locals = Object.create(null)
  const rendered = template === undefined ? content : renderNodes(template.nodes, variables, locals, options)
  return rendered.replace(GETVAR_MACRO, (_whole, colonName, quotedName) => stringify(getPath(variables, parseVariableName(colonName ?? quotedName) ?? [])))
}

function appendOutput(nodes, code) {
  const include = parseWorldInfoInclude(code)
  if (include !== undefined) {
    nodes.push({ type: 'include', name: include })
    return
  }
  const reference = parseReference(code)
  if (reference !== undefined) {
    nodes.push({ type: 'value', reference })
    return
  }
  if (IDENTIFIER.test(code)) {
    nodes.push({ type: 'local-value', name: code })
    return
  }
  throw new Error(`unsupported MVU template output: ${code}`)
}

function parseStatements(source, stack) {
  let code = stripBlockComments(source).replace(/(^|\n)\s*\/\/[^\n]*/g, '$1').trim()
  while (code.length > 0) {
    const declaration = parseDeclaration(code)
    if (declaration !== undefined) {
      current(stack).push(declaration.node)
      code = code.slice(declaration.length).trim()
      continue
    }
    const elseIf = /^\}\s*else\s+if\s*\(([\s\S]*)\)\s*\{$/.exec(code)
    if (elseIf !== null) {
      const frame = branchFrame(stack, 'else if')
      const branch = { condition: parseCondition(elseIf[1]), nodes: [] }
      frame.node.branches.push(branch)
      frame.nodes = branch.nodes
      return
    }
    if (/^\}\s*else\s*\{$/.test(code)) {
      const frame = branchFrame(stack, 'else')
      frame.nodes = frame.node.alternate
      return
    }
    const opening = /^if\s*\(([\s\S]*)\)\s*\{$/.exec(code)
    if (opening !== null) {
      const branch = { condition: parseCondition(opening[1]), nodes: [] }
      const node = { type: 'if', branches: [branch], alternate: [] }
      current(stack).push(node)
      stack.push({ nodes: branch.nodes, node })
      return
    }
    const closing = /^\}\s*/.exec(code)
    if (closing !== null) {
      if (stack.length === 1) throw new Error('MVU template closing brace has no matching if')
      stack.pop()
      code = code.slice(closing[0].length).trim()
      continue
    }
    throw new Error(`unsupported MVU template statement: ${code}`)
  }
}

function parseDeclaration(code) {
  const guarded = /^if\s*\(\s*typeof\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*={2,3}\s*(["'])undefined\2\s*\)\s*(?:var|let|const)\s+\1\s*=\s*(getvar\s*\([\s\S]*?\))\s*;/.exec(code)
  if (guarded !== null) {
    const reference = parseReference(guarded[3])
    if (reference === undefined) throw new Error(`unsupported MVU variable declaration: ${guarded[0]}`)
    return { length: guarded[0].length, node: { type: 'declare', name: guarded[1], reference } }
  }
  const direct = /^(?:var|let|const)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*([^;]+)\s*;/.exec(code)
  if (direct === null) return undefined
  const reference = parseReference(direct[2])
  if (reference === undefined) throw new Error(`unsupported MVU variable declaration: ${direct[0]}`)
  return { length: direct[0].length, node: { type: 'declare', name: direct[1], reference } }
}

function parseWorldInfoInclude(code) {
  const match = /^await\s+getwi\s*\(\s*null\s*,\s*((?:"(?:[^"\\]|\\.)*")|(?:'(?:[^'\\]|\\.)*'))\s*\)\s*;?$/.exec(code)
  if (match === null) return undefined
  const decoded = decodeLiteral(match[1])
  if (!decoded.ok || typeof decoded.value !== 'string' || decoded.value.length === 0) throw new Error(`unsupported getwi reference: ${code}`)
  return decoded.value
}

function renderNodes(nodes, variables, locals, options) {
  let output = ''
  for (const node of nodes) {
    if (node.type === 'text') output += node.value
    else if (node.type === 'declare') {
      if (!Object.hasOwn(locals, node.name)) locals[node.name] = referenceValue(node.reference, variables)
    } else if (node.type === 'value') output += stringify(referenceValue(node.reference, variables))
    else if (node.type === 'local-value') output += stringify(locals[node.name])
    else if (node.type === 'include') {
      if (typeof options.resolveWorldInfo !== 'function') throw new Error(`MVU template references unavailable world info "${node.name}"`)
      const included = options.resolveWorldInfo(node.name)
      if (typeof included !== 'string') throw new Error(`MVU world info "${node.name}" did not resolve to text`)
      output += included
    } else if (node.type === 'if') {
      const branch = node.branches.find(item => testCondition(item.condition, variables, locals))
      output += renderNodes(branch?.nodes ?? node.alternate, variables, locals, options)
    }
  }
  return output
}

function parseCondition(expression) {
  const or = splitLogical(expression, '||')
  if (or.length > 1) return { op: 'or', conditions: or.map(parseCondition) }
  const and = splitLogical(expression, '&&')
  if (and.length > 1) return { op: 'and', conditions: and.map(parseCondition) }
  const value = stripOuterParentheses(expression.trim())
  const exists = parseHasReference(value)
  if (exists !== undefined) return { op: 'exists', path: exists.path }
  const comparator = findComparator(value)
  if (comparator !== undefined) {
    const left = parseOperand(value.slice(0, comparator.index))
    const right = parseOperand(value.slice(comparator.index + comparator.operator.length))
    return { op: 'compare', operator: comparator.operator, left, right }
  }
  return { op: 'truthy', operand: parseOperand(value) }
}

function testCondition(condition, variables, locals) {
  if (condition.op === 'or') return condition.conditions.some(value => testCondition(value, variables, locals))
  if (condition.op === 'and') return condition.conditions.every(value => testCondition(value, variables, locals))
  if (condition.op === 'exists') return hasPath(variables, condition.path)
  if (condition.op === 'truthy') return Boolean(operandValue(condition.operand, variables, locals))
  const left = operandValue(condition.left, variables, locals)
  const right = operandValue(condition.right, variables, locals)
  switch (condition.operator) {
    case '>=': return left >= right
    case '<=': return left <= right
    case '>': return left > right
    case '<': return left < right
    case '==': case '===': return left === right
    case '!=': case '!==': return left !== right
    default: return false
  }
}

function parseOperand(value) {
  const trimmed = value.trim()
  const reference = parseReference(trimmed)
  if (reference !== undefined) return { kind: 'reference', reference }
  const literal = decodeLiteral(trimmed)
  if (literal.ok) return { kind: 'literal', value: literal.value }
  if (IDENTIFIER.test(trimmed)) return { kind: 'local', name: trimmed }
  throw new Error(`unsupported MVU condition operand: ${value}`)
}

function operandValue(operand, variables, locals) {
  if (operand.kind === 'reference') return referenceValue(operand.reference, variables)
  if (operand.kind === 'local') return locals[operand.name]
  return operand.value
}

function parseReference(value) {
  const source = value.trim()
  const getvar = /^getvar\s*\(\s*(["'])([^"']+)\1\s*(?:,\s*([\s\S]*?))?\s*\)([\s\S]*)$/.exec(source)
  if (getvar !== null) {
    const path = parseVariableName(getvar[2])
    if (path === undefined) return undefined
    const reference = referenceWithTail(path, getvar[4])
    if (reference === undefined) return undefined
    if (getvar[3] !== undefined) {
      const rawDefault = getvar[3].trim()
      const wrapped = /^\{\s*defaults\s*:\s*([\s\S]+)\}$/.exec(rawDefault)
      const fallback = decodeLiteral((wrapped?.[1] ?? rawDefault).trim())
      if (!fallback.ok) return undefined
      reference.defaultValue = fallback.value
      reference.hasDefault = true
    }
    return reference
  }
  const direct = /^(stat_data|display_data|state)([\s\S]*)$/.exec(source)
  if (direct !== null) return referenceWithTail([direct[1]], direct[2])
  const lodash = /^_\.get\s*\(([\s\S]*)\)$/.exec(source)
  if (lodash === null) return undefined
  const args = splitArguments(lodash[1])
  if (args.length < 2 || args.length > 3) return undefined
  const root = parseReference(args[0])
  const pathLiteral = decodeLiteral(args[1].trim())
  const tail = pathLiteral.ok && typeof pathLiteral.value === 'string' ? parseVariableName(pathLiteral.value) : undefined
  if (root === undefined || tail === undefined) return undefined
  const reference = { path: [...root.path, ...tail] }
  if (args.length === 3) {
    const fallback = decodeLiteral(args[2].trim())
    if (!fallback.ok) return undefined
    reference.defaultValue = fallback.value
    reference.hasDefault = true
  } else if (root.hasDefault === true) {
    reference.defaultValue = root.defaultValue
    reference.hasDefault = true
  }
  return reference
}

function parseHasReference(value) {
  const match = /^_\.has\s*\(([\s\S]*)\)$/.exec(value)
  if (match === null) return undefined
  const args = splitArguments(match[1])
  if (args.length !== 2) throw new Error(`unsupported MVU template condition: ${value}`)
  const root = parseReference(args[0])
  const pathLiteral = decodeLiteral(args[1].trim())
  const tail = pathLiteral.ok && typeof pathLiteral.value === 'string' ? parseVariableName(pathLiteral.value) : undefined
  if (root === undefined || tail === undefined) throw new Error(`unsupported MVU template condition: ${value}`)
  return { path: [...root.path, ...tail] }
}

function referenceWithTail(path, suffix) {
  let tail = suffix
  const segment = /^(?:\.([^.[\]\s]+)|\[\s*(?:"([^"]+)"|'([^']+)'|(\d+))\s*\])/
  while (tail.length > 0) {
    const next = segment.exec(tail)
    if (next === null) return undefined
    path.push(next[1] ?? next[2] ?? next[3] ?? Number(next[4]))
    tail = tail.slice(next[0].length)
  }
  return { path }
}

function referenceValue(reference, variables) {
  const value = getPath(variables, reference.path)
  return value === undefined && reference.hasDefault === true ? reference.defaultValue : value
}

function parseVariableName(value) {
  const segments = String(value).trim().replaceAll('.[', '[').split('.').flatMap(part => {
    const values = []
    const pattern = /([^\[\]]+)|\[(\d+)\]/g
    for (const match of part.matchAll(pattern)) values.push(match[1] ?? Number(match[2]))
    return values
  })
  return safePath(segments)
}

function safePath(segments) {
  return segments.length > 0 && segments.every(segment => typeof segment === 'number' || (typeof segment === 'string' && !['__proto__', 'prototype', 'constructor'].includes(segment))) ? segments : undefined
}

function getPath(value, path) {
  let selected = value
  for (const segment of path) {
    if (selected === null || selected === undefined || !Object.prototype.hasOwnProperty.call(Object(selected), segment)) return undefined
    selected = selected[segment]
  }
  return selected
}

function hasPath(value, path) { return getPath(value, path) !== undefined }
function current(stack) { return stack.at(-1).nodes }
function branchFrame(stack, label) { if (stack.length === 1) throw new Error(`MVU template ${label} has no matching if`); return stack.at(-1) }
function appendText(nodes, value) { if (value.length > 0) nodes.push({ type: 'text', value }) }
function stringify(value) { return value === undefined || value === null ? '' : typeof value === 'string' ? value : JSON.stringify(value) }

function splitLogical(value, operator) {
  const parts = []
  let start = 0
  let quote
  let depth = 0
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index]
    if (quote !== undefined) {
      if (character === quote && value[index - 1] !== '\\') quote = undefined
      continue
    }
    if (character === '"' || character === "'") quote = character
    else if (character === '(' || character === '[') depth += 1
    else if (character === ')' || character === ']') depth -= 1
    else if (depth === 0 && value.startsWith(operator, index)) {
      parts.push(value.slice(start, index).trim())
      start = index + operator.length
      index += operator.length - 1
    }
  }
  parts.push(value.slice(start).trim())
  return parts
}

function findComparator(value) {
  for (const operator of ['===', '!==', '>=', '<=', '==', '!=', '>', '<']) {
    const parts = splitLogical(value, operator)
    if (parts.length === 2) return { operator, index: value.indexOf(operator) }
  }
  return undefined
}

function stripOuterParentheses(value) {
  return value.startsWith('(') && value.endsWith(')') ? value.slice(1, -1).trim() : value
}

function splitArguments(value) {
  const parts = []
  let start = 0
  let quote
  let escaped = false
  let depth = 0
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index]
    if (quote !== undefined) {
      if (escaped) escaped = false
      else if (character === '\\') escaped = true
      else if (character === quote) quote = undefined
      continue
    }
    if (character === '"' || character === "'") quote = character
    else if ('([{'.includes(character)) depth += 1
    else if (')]}'.includes(character)) depth -= 1
    else if (character === ',' && depth === 0) {
      parts.push(value.slice(start, index).trim())
      start = index + 1
    }
  }
  parts.push(value.slice(start).trim())
  return parts.filter(part => part.length > 0)
}

function stripBlockComments(value) {
  let output = ''
  let quote
  let escaped = false
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index]
    if (quote !== undefined) {
      output += character
      if (escaped) escaped = false
      else if (character === '\\') escaped = true
      else if (character === quote) quote = undefined
      continue
    }
    if (character === '"' || character === "'") {
      quote = character
      output += character
      continue
    }
    if (character === '/' && value[index + 1] === '*') {
      const end = value.indexOf('*/', index + 2)
      if (end < 0) throw new Error('MVU template contains an unclosed block comment')
      output += ' '
      index = end + 1
      continue
    }
    output += character
  }
  return output
}

function decodeLiteral(value) {
  if (value.startsWith("'") && value.endsWith("'")) return { ok: true, value: value.slice(1, -1).replaceAll("\\'", "'").replaceAll('\\\\', '\\') }
  try { return { ok: true, value: JSON.parse(value) } } catch { return { ok: false } }
}
