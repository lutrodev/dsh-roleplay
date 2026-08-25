import assert from 'node:assert/strict'
import test from 'node:test'
import { createRoleplayMacroStream, expandRoleplayMacros } from '../src/syntax.js'

test('expands user and character identity macros case-insensitively', () => {
  assert.equal(
    expandRoleplayMacros('{{user}} / {{ user }} / <USER> / {{char}} / {{ ChAr }} / <CHAR>', {
      userName: '林澈', characterName: '莱安娜',
    }),
    '林澈 / 林澈 / 林澈 / 莱安娜 / 莱安娜 / 莱安娜',
  )
})

test('uses literal replacement names and supports adjacent macros', () => {
  assert.equal(
    expandRoleplayMacros('{{user}}{{char}}<user><char>', { userName: '$&', characterName: '$`' }),
    '$&$`$&$`',
  )
})

test('preserves malformed, similar, and unbound macro source', () => {
  const source = '{{username}} {{ user } < user > <user/> {user} {{character}} <char/>'
  assert.equal(expandRoleplayMacros(source, { userName: '阿月', characterName: '莱安娜' }), source)
  assert.equal(
    expandRoleplayMacros('{{user}} + {{char}}', { characterName: '莱安娜' }),
    '{{user}} + 莱安娜',
  )
})

test('stream expansion is identical across arbitrary chunk boundaries', () => {
  const identities = { userName: '洛$1', characterName: '莱安娜' }
  const stream = createRoleplayMacroStream(identities)
  const chunks = ['你好 {', '{  U', 's', 'Er ', '}}，<c', 'har', '>。{{ ch', 'ar }}，{{broken']
  const output = chunks.map(chunk => stream.push(chunk)).join('') + stream.finish()
  assert.equal(output, expandRoleplayMacros(chunks.join(''), identities))
})

test('stream expansion is invariant at every pair of chunk boundaries', () => {
  const source = 'A{{ user }}B<CHAR>C{{char}}D<user>E'
  const identities = { userName: '林澈', characterName: '莱安娜' }
  const expected = expandRoleplayMacros(source, identities)
  for (let first = 0; first <= source.length; first += 1) {
    for (let second = first; second <= source.length; second += 1) {
      const stream = createRoleplayMacroStream(identities)
      const output = stream.push(source.slice(0, first))
        + stream.push(source.slice(first, second))
        + stream.push(source.slice(second))
        + stream.finish()
      assert.equal(output, expected, `boundaries ${first}/${second}`)
    }
  }
})
