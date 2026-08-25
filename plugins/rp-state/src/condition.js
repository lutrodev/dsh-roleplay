import { parseJsonPointer, readJsonPointer } from './json-pointer.js'

const MAX_CONDITION_CHARACTERS = 4096
const MAX_CONDITION_TOKENS = 1024
const NAMESPACE_PATTERN = /^[a-z0-9][a-z0-9._:-]{0,127}$/u

/** Compile one safe rp.state boolean expression. */
export function compileStateCondition(source) {
  if (typeof source !== 'string' || source.trim().length === 0) throw new StateConditionError('State condition must be a non-empty string.')
  if ([...source].length > MAX_CONDITION_CHARACTERS) throw new StateConditionError(`State condition exceeds ${MAX_CONDITION_CHARACTERS} characters.`)
  const tokens = tokenize(source)
  if (tokens.length > MAX_CONDITION_TOKENS) throw new StateConditionError(`State condition exceeds ${MAX_CONDITION_TOKENS - 1} tokens.`)
  const parser = new Parser(tokens)
  const expression = parser.parseExpression()
  parser.expect('eof')
  return Object.freeze({ source: source.trim(), expression })
}

/** Evaluate a compiled condition against one rp.state projection. */
export function evaluateStateCondition(compiled, state) {
  const program = typeof compiled === 'string' ? compileStateCondition(compiled) : compiled
  if (!program || typeof program !== 'object' || !program.expression) throw new StateConditionError('State condition is not compiled.')
  try {
    const value = evaluate(program.expression, state)
    if (typeof value !== 'boolean') throw new StateConditionError('State condition must evaluate to a boolean.')
    return { value, diagnostics: [] }
  } catch (error) {
    return {
      value: false,
      diagnostics: [{
        code: error instanceof MissingStateValueError ? 'STATE_CONDITION_MISSING' : 'STATE_CONDITION_INVALID',
        severity: 'warning',
        message: error instanceof Error ? error.message : 'State condition could not be evaluated.',
      }],
    }
  }
}

function evaluate(node, state) {
  if (node.kind === 'literal') return node.value
  if (node.kind === 'call') return evaluateCall(node, state)
  if (node.kind === 'not') {
    const value = evaluate(node.value, state)
    if (typeof value !== 'boolean') throw new StateConditionError('The ! operator requires a boolean operand.')
    return !value
  }
  if (node.kind === 'logical') {
    const left = evaluate(node.left, state)
    if (typeof left !== 'boolean') throw new StateConditionError(`${node.operator} requires boolean operands.`)
    if (node.operator === '&&' && !left) return false
    if (node.operator === '||' && left) return true
    const right = evaluate(node.right, state)
    if (typeof right !== 'boolean') throw new StateConditionError(`${node.operator} requires boolean operands.`)
    return right
  }
  if (node.kind === 'compare') return compare(node.operator, evaluate(node.left, state), evaluate(node.right, state))
  throw new StateConditionError('State condition contains an unknown expression.')
}

function evaluateCall(node, state) {
  const namespace = node.arguments[0]
  const pointer = node.arguments[1]
  const snapshot = state?.namespaces?.[namespace]
  if (snapshot === undefined) {
    if (node.name === 'exists') return false
    throw new MissingStateValueError(`State namespace "${namespace}" does not exist.`)
  }
  const result = readJsonPointer(snapshot.value, pointer)
  if (node.name === 'exists') return result.found
  if (!result.found) throw new MissingStateValueError(`State path "${pointer}" does not exist in namespace "${namespace}".`)
  if (result.value !== null && typeof result.value === 'object') {
    throw new StateConditionError(`state("${namespace}", "${pointer}") must resolve to a JSON scalar.`)
  }
  return result.value
}

function compare(operator, left, right) {
  if (operator === '==' || operator === '!=') {
    const equal = typeof left === typeof right && left === right
    return operator === '==' ? equal : !equal
  }
  if ((typeof left !== 'number' && typeof left !== 'string') || typeof left !== typeof right) {
    throw new StateConditionError(`${operator} requires two numbers or two strings of the same type.`)
  }
  if (operator === '>') return left > right
  if (operator === '>=') return left >= right
  if (operator === '<') return left < right
  if (operator === '<=') return left <= right
  throw new StateConditionError(`Unsupported comparison operator "${operator}".`)
}

class Parser {
  constructor(tokens) {
    this.tokens = tokens
    this.index = 0
  }

  parseExpression() { return this.parseOr() }

  parseOr() {
    let left = this.parseAnd()
    while (this.match('operator', '||')) left = { kind: 'logical', operator: '||', left, right: this.parseAnd() }
    return left
  }

  parseAnd() {
    let left = this.parseEquality()
    while (this.match('operator', '&&')) left = { kind: 'logical', operator: '&&', left, right: this.parseEquality() }
    return left
  }

  parseEquality() {
    let left = this.parseComparison()
    while (this.peek('operator', '==') || this.peek('operator', '!=')) {
      const operator = this.take().value
      left = { kind: 'compare', operator, left, right: this.parseComparison() }
    }
    return left
  }

  parseComparison() {
    let left = this.parseUnary()
    while (['>', '>=', '<', '<='].some(operator => this.peek('operator', operator))) {
      const operator = this.take().value
      left = { kind: 'compare', operator, left, right: this.parseUnary() }
    }
    return left
  }

  parseUnary() {
    if (this.match('operator', '!')) return { kind: 'not', value: this.parseUnary() }
    return this.parsePrimary()
  }

  parsePrimary() {
    if (this.match('punctuation', '(')) {
      const expression = this.parseExpression()
      this.expect('punctuation', ')')
      return expression
    }
    const token = this.take()
    if (token.type === 'literal') return { kind: 'literal', value: token.value }
    if (token.type !== 'identifier' || (token.value !== 'state' && token.value !== 'exists')) {
      throw new StateConditionError(`Unexpected token "${token.raw}" in State condition.`)
    }
    this.expect('punctuation', '(')
    const namespace = this.expect('literal').value
    this.expect('punctuation', ',')
    const pointer = this.expect('literal').value
    this.expect('punctuation', ')')
    if (typeof namespace !== 'string' || !NAMESPACE_PATTERN.test(namespace)) {
      throw new StateConditionError(`${token.value}() requires an exact lowercase State namespace id.`)
    }
    if (typeof pointer !== 'string') throw new StateConditionError(`${token.value}() requires a JSON Pointer string.`)
    parseJsonPointer(pointer)
    return { kind: 'call', name: token.value, arguments: [namespace, pointer] }
  }

  match(type, value) {
    if (!this.peek(type, value)) return false
    this.index += 1
    return true
  }

  peek(type, value) {
    const token = this.tokens[this.index]
    return token?.type === type && (value === undefined || token.value === value)
  }

  take() {
    const token = this.tokens[this.index]
    if (token === undefined) throw new StateConditionError('State condition ended unexpectedly.')
    this.index += 1
    return token
  }

  expect(type, value) {
    const token = this.take()
    if (token.type !== type || (value !== undefined && token.value !== value)) {
      throw new StateConditionError(`Expected ${value ?? type}, received "${token.raw}".`)
    }
    return token
  }
}

function tokenize(source) {
  const tokens = []
  let index = 0
  while (index < source.length) {
    const whitespace = /^[\s]+/u.exec(source.slice(index))
    if (whitespace) { index += whitespace[0].length; continue }
    const rest = source.slice(index)
    const operator = /^(?:&&|\|\||==|!=|>=|<=|>|<|!)/u.exec(rest)
    if (operator) { tokens.push({ type: 'operator', value: operator[0], raw: operator[0] }); index += operator[0].length; continue }
    const punctuation = /^[(),]/u.exec(rest)
    if (punctuation) { tokens.push({ type: 'punctuation', value: punctuation[0], raw: punctuation[0] }); index += 1; continue }
    if (rest[0] === '"') {
      const string = readJsonString(source, index)
      tokens.push({ type: 'literal', value: string.value, raw: string.raw })
      index = string.end
      continue
    }
    const number = /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/u.exec(rest)
    if (number) {
      const value = Number(number[0])
      if (!Number.isFinite(value)) throw new StateConditionError('State condition number must be finite.')
      tokens.push({ type: 'literal', value, raw: number[0] }); index += number[0].length; continue
    }
    const identifier = /^[A-Za-z_][A-Za-z0-9_]*/u.exec(rest)
    if (identifier) {
      const raw = identifier[0]
      if (raw === 'true' || raw === 'false' || raw === 'null') tokens.push({ type: 'literal', value: raw === 'null' ? null : raw === 'true', raw })
      else tokens.push({ type: 'identifier', value: raw, raw })
      index += raw.length
      continue
    }
    throw new StateConditionError(`Unexpected character "${rest[0]}" in State condition.`)
  }
  tokens.push({ type: 'eof', value: undefined, raw: 'end of expression' })
  return tokens
}

function readJsonString(source, start) {
  let escaped = false
  for (let index = start + 1; index < source.length; index += 1) {
    const character = source[index]
    if (escaped) { escaped = false; continue }
    if (character === '\\') { escaped = true; continue }
    if (character !== '"') continue
    const raw = source.slice(start, index + 1)
    try { return { raw, value: JSON.parse(raw), end: index + 1 } } catch { throw new StateConditionError('State condition contains an invalid JSON string.') }
  }
  throw new StateConditionError('State condition contains an unterminated string.')
}

export class StateConditionError extends Error {
  constructor(message) {
    super(message)
    this.name = 'StateConditionError'
  }
}

class MissingStateValueError extends StateConditionError {}
