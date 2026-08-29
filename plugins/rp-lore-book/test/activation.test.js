import assert from 'node:assert/strict'
import test from 'node:test'
import { activateLore, classifyLoreEntry, groupActivatedLore, LORE_SLOT_DEFINITIONS, normalizeLoreBook, serializeLoreBookV3 } from '../src/activation.js'

test('classifies imported entries into the three semantic lore slots', () => {
  assert.equal(LORE_SLOT_DEFINITIONS[1].label, '扮演指导')
  const book = normalizeLoreBook({ id: 'three-slots', entries: [
    { id: 'world', position: 0, insertion_order: 20, constant: true, content: 'World' },
    { id: 'character', position: 1, insertion_order: 10, constant: true, content: 'Character' },
    { id: 'rule', position: 4, depth: 1, insertion_order: 5, constant: true, content: 'Rule' },
    { id: 'deep', position: 4, depth: 3, insertion_order: 7, constant: true, content: 'Deep character' },
    { id: 'explicit', level: 'importantRules', position: 0, insertion_order: 3, constant: true, content: 'Explicit rule' },
  ] })
  assert.deepEqual(book.entries.map(entry => [entry.id, entry.level, entry.order]), [
    ['world', 'worldDescription', 20],
    ['character', 'roleplayGuide', 3010],
    ['rule', 'importantRules', 1005],
    ['deep', 'roleplayGuide', 3977],
    ['explicit', 'importantRules', 3],
  ])
  assert.deepEqual(classifyLoreEntry({ position: undefined, depth: 4, order: 2 }), { level: 'roleplayGuide', order: 5002 })
  const grouped = groupActivatedLore(activateLore({ books: [book], corpus: '', runId: 'r', maxDepth: 0, maxEntries: 10, maxTokens: 100 }))
  assert.deepEqual(grouped.worldDescription.map(entry => entry.id), ['world'])
  assert.deepEqual(grouped.roleplayGuide.map(entry => entry.id), ['character', 'deep'])
  assert.deepEqual(grouped.importantRules.map(entry => entry.id), ['explicit', 'rule'])
})

test('keeps every imported entry and contains no format-specific extraction', () => {
  const book = normalizeLoreBook({ id: 'portable', entries: [
    { uid: 1, comment: '[InitVar]基础变量', disable: true, content: '{"hp":10}' },
    { uid: 2, constant: true, content: '<% format_specific() %>' },
  ] })
  assert.deepEqual(book.entries.map(entry => [entry.id, entry.name, entry.enabled]), [
    ['1', '[InitVar]基础变量', false],
    ['2', 'Entry 2', true],
  ])
  assert.equal(Object.hasOwn(book, 'nativeState'), false)
  const result = activateLore({ books: [book], corpus: '', runId: 'literal', maxDepth: 0, maxEntries: 10, maxTokens: 100 })
  assert.equal(result.entries[0].content, '<% format_specific() %>')
})

test('serializes normalized entries into the required CCv3 lorebook fields', () => {
  const book = normalizeLoreBook({
    name: '可携带世界书',
    scan_depth: 3,
    recursive_scanning: false,
    entries: [{
      id: 'gate', name: '潮门', keys: ['潮门'], secondary_keys: ['夜晚'], selective: true,
      content: '潮门只在夜晚开启。', position: 4, depth: 1, insertion_order: 7,
      probability: 50, state_condition: 'story.open === true', prevent_recursion: true,
    }],
  })
  const exported = serializeLoreBookV3(book)
  assert.equal(exported.name, '可携带世界书')
  assert.equal(exported.scan_depth, 3)
  assert.equal(exported.recursive_scanning, false)
  assert.deepEqual(exported.extensions, {})
  assert.deepEqual(exported.entries[0], {
    keys: ['潮门'],
    content: '潮门只在夜晚开启。',
    extensions: {
      level: 'importantRules', position: 4, depth: 1, prevent_recursion: true,
      state_condition: 'story.open === true', use_probability: true, probability: 50,
    },
    enabled: true,
    insertion_order: 1007,
    case_sensitive: false,
    use_regex: false,
    constant: false,
    name: '潮门',
    id: 'gate',
    selective: true,
    secondary_keys: ['夜晚'],
    position: 'in_chat',
  })
})

test('round-trips canonical secondaryKeys and gives insertionPosition precedence over legacy position', () => {
  const first = normalizeLoreBook({ id: 'canonical', entries: [{
    id: 'gate', name: '潮门', level: 'importantRules', keys: ['潮门'], secondaryKeys: ['夜晚'],
    content: '潮门只在夜晚开启。', position: 4, insertionPosition: 'before_char',
  }] })
  assert.deepEqual(first.entries[0].secondaryKeys, ['夜晚'])
  assert.equal(first.entries[0].insertionPosition, 'before_char')
  assert.equal(first.entries[0].position, 0)

  const second = normalizeLoreBook(first)
  assert.deepEqual(second.entries[0].secondaryKeys, ['夜晚'])
  assert.equal(second.entries[0].insertionPosition, 'before_char')
  assert.equal(second.entries[0].position, 0)
})

test('activates constant, keyword and recursive entries deterministically', () => {
  const book = normalizeLoreBook({ id: 'b', entries: [
    { id: 1, constant: true, content: 'The moon reveals a gate.', order: 0 },
    { id: 2, keys: ['gate'], content: 'The gate leads below.', order: 1 },
    { id: 3, keys: ['below'], content: 'A city sleeps there.', probability: 50, order: 2 },
    { id: 4, enabled: false, constant: true, content: 'Kept for editing but not activated.', order: 3 },
  ] })
  const args = { books: [book], corpus: 'Night falls.', runId: 'same', maxDepth: 3, maxEntries: 10, maxTokens: 100 }
  assert.deepEqual(activateLore(args), activateLore(args))
  assert.deepEqual(activateLore(args).entries.slice(0, 2).map(entry => entry.id), ['1', '2'])
  assert.equal(book.entries.length, 4)
  assert.ok(!activateLore(args).entries.some(entry => entry.id === '4'))
})

test('preserves per-book scan settings and keeps recursive scanning inside each book', () => {
  const recursive = normalizeLoreBook({
    id: 'recursive',
    scan_depth: '2',
    recursive_scanning: 'true',
    entries: [
      { id: 'seed', constant: true, content: 'same-book-key' },
      { id: 'same-book', keys: ['same-book-key'], content: 'same book result' },
    ],
  })
  const nonRecursive = normalizeLoreBook({
    id: 'non-recursive',
    scanDepth: 0,
    recursiveScanning: false,
    entries: [
      { id: 'seed', constant: true, content: 'blocked-key cross-book-key' },
      { id: 'blocked', keys: ['blocked-key'], content: 'must not activate recursively' },
    ],
  })
  const other = normalizeLoreBook({
    id: 'other',
    entries: [{ id: 'cross-book', keys: ['cross-book-key'], content: 'must not activate from another book' }],
  })
  assert.equal(recursive.scanDepth, 2)
  assert.equal(recursive.recursiveScanning, true)
  assert.equal(nonRecursive.scanDepth, 0)
  assert.equal(nonRecursive.recursiveScanning, false)

  const result = activateLore({
    books: [recursive, nonRecursive, other],
    corpus: '',
    bookCorpora: new Map([['recursive', ''], ['non-recursive', ''], ['other', '']]),
    runId: 'book-local-recursion',
    maxDepth: 3,
    maxEntries: 20,
    maxTokens: 200,
  })
  assert.deepEqual(result.entries.map(entry => `${entry.bookId}:${entry.id}`), [
    'recursive:seed',
    'non-recursive:seed',
    'recursive:same-book',
  ])
  assert.throws(() => normalizeLoreBook({ scan_depth: -1, entries: [] }), /scan depth/)
  assert.throws(() => normalizeLoreBook({ recursive_scanning: 'sometimes', entries: [] }), /recursive scanning/)
})

test('combines keyword or constant activation with State gates using AND semantics', () => {
  const book = normalizeLoreBook({ id: 'conditions', entries: [
    { id: 'constant-off', constant: true, stateCondition: 'off', content: 'disabled by state' },
    { id: 'keyword-on', keys: ['gate'], stateCondition: 'on', content: 'keyword and state' },
    { id: 'keyword-miss', keys: ['absent'], stateCondition: 'on', content: 'state alone is insufficient' },
    { id: 'invalid', constant: true, stateCondition: 'invalid', content: 'invalid condition' },
  ] })
  const transformed = []
  const adapters = [{
    id: 'state',
    gateEntry({ entry }) {
      if (entry.stateCondition === undefined) return undefined
      if (entry.stateCondition === 'invalid') return { active: false, diagnostics: [{ reason: 'state-condition-invalid', message: 'invalid expression' }] }
      return { active: entry.stateCondition === 'on', diagnostics: entry.stateCondition === 'on' ? [] : [{ reason: 'state-condition' }] }
    },
    transformEntry({ entry }) { transformed.push(entry.id); return undefined },
  }]
  const result = activateLore({ books: [book], corpus: 'the gate opens', runId: 'state-and', adapters, maxDepth: 0, maxEntries: 10, maxTokens: 100 })
  assert.deepEqual(result.entries.map(entry => entry.id), ['keyword-on'])
  assert.deepEqual(transformed.sort(), ['keyword-miss', 'keyword-on'])
  assert.ok(result.diagnostics.some(item => item.entryId === 'constant-off' && item.reason === 'state-condition'))
  assert.ok(result.diagnostics.some(item => item.entryId === 'invalid' && item.reason === 'state-condition-invalid'))
})

test('fails closed for State-conditioned entries when no State gate is registered', () => {
  const book = normalizeLoreBook({ id: 'state-disabled', entries: [
    { id: 'conditional', constant: true, stateCondition: 'story.hp > 0', content: 'must stay hidden' },
    { id: 'plain', constant: true, content: 'still available' },
  ] })
  const result = activateLore({ books: [book], corpus: '', runId: 'state-disabled', maxDepth: 0, maxEntries: 10, maxTokens: 100 })
  assert.deepEqual(result.entries.map(entry => entry.id), ['plain'])
  assert.ok(result.diagnostics.some(item => item.entryId === 'conditional' && item.reason === 'state-condition-unavailable'))
})

test('applies the same State gate to explicit recursive references', () => {
  const book = normalizeLoreBook({ id: 'reference-state', entries: [
    { id: 'controller', name: 'Controller', constant: true, content: 'Hidden' },
    { id: 'hidden', name: 'Hidden', enabled: false, stateCondition: 'off', content: 'secret' },
  ] })
  const result = activateLore({
    books: [book], corpus: '', runId: 'reference-state', maxDepth: 0, maxEntries: 10, maxTokens: 100,
    adapters: [{
      id: 'state-reference',
      gateEntry: ({ entry }) => entry.stateCondition === undefined ? undefined : { active: false, diagnostics: [{ reason: 'state-condition' }] },
      transformEntry: ({ content, resolveEntry }) => ({ content: content === 'Hidden' ? resolveEntry('Hidden') : content }),
    }],
  })
  assert.deepEqual(result.entries, [])
  assert.ok(result.diagnostics.some(item => item.entryId === 'hidden' && item.reference === 'Hidden' && item.reason === 'state-condition'))
})

test('applies complete token and result bounds including exact boundary', () => {
  const book = normalizeLoreBook({ entries: [{ constant: true, content: '12345678' }, { constant: true, content: 'abcdefgh' }] })
  const exact = activateLore({ books: [book], corpus: '', runId: 'r', maxDepth: 0, maxEntries: 1, maxTokens: 2 })
  assert.equal(exact.entries.length, 1)
  assert.equal(exact.usedTokens, 2)
  assert.ok(exact.diagnostics.some(item => item.reason === 'entry-budget'))
})

test('applies ordered generic adapters and resolves disabled named fragments', () => {
  const book = normalizeLoreBook({ id: 'adapter', entries: [
    { id: 'controller', name: 'Controller', constant: true, content: 'include:fragment name' },
    { id: 'fragment', name: 'Fragment-Name', enabled: false, content: 'fragment body' },
  ] })
  const adapters = [{
    id: 'test.format',
    transformEntry({ content, resolveEntry }) {
      return { content: content.replace('include:fragment name', resolveEntry('fragment_name').toUpperCase()) }
    },
  }]
  const result = activateLore({ books: [book], corpus: '', runId: 'adapter', adapters, maxDepth: 0, maxEntries: 10, maxTokens: 100 })
  assert.deepEqual(result.entries.map(entry => [entry.id, entry.content]), [['controller', 'FRAGMENT BODY']])
})

test('reports generic missing references, cycles and adapter failures', () => {
  const missing = normalizeLoreBook({ id: 'missing', entries: [{ id: 'a', name: 'A', constant: true, content: 'Missing' }] })
  const missingResult = activateLore({
    books: [missing], corpus: '', runId: 'missing', maxDepth: 0, maxEntries: 10, maxTokens: 100,
    adapters: [{ id: 'include', transformEntry: ({ resolveEntry }) => ({ content: resolveEntry('B') }) }],
  })
  assert.deepEqual(missingResult.entries, [])
  assert.ok(missingResult.diagnostics.some(item => item.reason === 'reference-missing' && item.adapterId === 'include'))

  const cyclic = normalizeLoreBook({ id: 'cycle', entries: [
    { id: 'a', name: 'A', constant: true, content: 'B' },
    { id: 'b', name: 'B', enabled: false, content: 'A' },
  ] })
  const cycleResult = activateLore({
    books: [cyclic], corpus: '', runId: 'cycle', maxDepth: 0, maxEntries: 10, maxTokens: 100,
    adapters: [{ id: 'include', transformEntry: ({ content, resolveEntry }) => ({ content: resolveEntry(content) }) }],
  })
  assert.ok(cycleResult.diagnostics.some(item => item.reason === 'reference-cycle'))

  const failed = activateLore({
    books: [missing], corpus: '', runId: 'failed', maxDepth: 0, maxEntries: 10, maxTokens: 100,
    adapters: [{ id: 'broken', transformEntry() { throw new Error('nope') } }],
  })
  assert.deepEqual(failed.entries, [])
  assert.ok(failed.diagnostics.some(item => item.reason === 'adapter-error' && item.adapterId === 'broken'))
})

test('rejects duplicate normalized entry ids', () => {
  assert.throws(() => normalizeLoreBook({ entries: [
    { id: 'same', content: 'first' },
    { uid: 'same', content: 'second' },
  ] }), /duplicate entry id/)
})
