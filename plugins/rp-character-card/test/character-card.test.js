import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { deflateSync } from 'node:zlib'
import {
  assertPngPath,
  CharacterCardImportError,
  encodeCharacterCardV3Png,
  parseCharacterCard,
  parseCharacterCardFile,
  serializeCharacterCardV3,
} from '../src/character-card.js'
import { persistCharacterCard } from '../src/library.js'

test('imports V2 tEXt cards, sanitizes prompt fields, and strips private metadata', () => {
  const card = pngCharacterCard({
    spec: 'chara_card_v2',
    spec_version: '2.0',
    data: {
      name: '港湾守望者',
      description: 'Observes the midnight tide.',
      personality: 'Patient',
      first_mes: 'Welcome to the harbor.',
      tags: ['mystery', 'harbor'],
      system_prompt: 'discard me',
      character_book: {
        entries: [{ keys: ['harbor'], content: 'The harbor closes at midnight.' }],
      },
      extensions: {
        nested: { post_history_instructions: 'discard this too', safe: true },
      },
    },
  }, 'tEXt', true)

  const parsed = parseCharacterCard(card, { maxTextCharacters: 150000 })
  assert.equal(parsed.format, 'character_card_v2')
  assert.equal(parsed.specVersion, '2.0')
  assert.equal(parsed.character.name, '港湾守望者')
  assert.deepEqual(parsed.character.tags, ['mystery', 'harbor'])
  assert.equal(parsed.lorebookEntries, 1)
  assert.equal(parsed.sourceHash.length, 64)
  assert.equal(parsed.sourcePayload.data.system_prompt, undefined)
  assert.equal(parsed.sourcePayload.data.extensions.nested.post_history_instructions, undefined)
  assert.equal(parsed.sourcePayload.data.extensions.nested.safe, true)
  assert.equal(parsed.quarantinedPrompts.length, 2)

  const retainedTypes = chunkTypes(parsed.avatarBytes)
  assert.deepEqual(retainedTypes, ['IHDR', 'IDAT', 'IEND'])
  assert.equal(Buffer.from(parsed.avatarBytes).includes(Buffer.from('discard me')), false)
})

test('imports standalone JSON cards without creating an avatar', () => {
  const bytes = Buffer.from(JSON.stringify({ spec: 'chara_card_v3', spec_version: '3.0', data: { name: 'JSON Card', first_mes: 'Hi' } }))
  const parsed = parseCharacterCardFile(bytes, 'card.json', { maxTextCharacters: 150000 })
  assert.equal(parsed.format, 'character_card_v3')
  assert.equal(parsed.character.name, 'JSON Card')
  assert.equal(parsed.avatarBytes, undefined)
})

test('imports compressed iTXt and zTXt character payloads', () => {
  const value = { spec: 'chara_card_v2', data: { name: 'Compressed' } }
  const encoded = Buffer.from(JSON.stringify(value), 'utf8').toString('base64')
  const itxt = Buffer.concat([Buffer.from('chara\0'), Buffer.from([1, 0]), Buffer.from('\0\0'), deflateSync(Buffer.from(encoded, 'latin1'))])
  const ztxt = Buffer.concat([Buffer.from('chara\0'), Buffer.from([0]), deflateSync(Buffer.from(encoded, 'latin1'))])
  assert.equal(parseCharacterCard(buildPng([pngChunk('iTXt', itxt)]), { maxTextCharacters: 150000 }).character.name, 'Compressed')
  assert.equal(parseCharacterCard(buildPng([pngChunk('zTXt', ztxt)]), { maxTextCharacters: 150000 }).character.name, 'Compressed')
})

test('imports uncompressed V3 iTXt and normalizes empty tag-only openings', () => {
  const card = pngCharacterCard({
    spec: 'chara_card_v3',
    spec_version: '3.0',
    data: {
      name: 'Vee',
      first_mes: '<start_screen></start_screen>',
      alternate_greetings: ['The gate opens.', '<scene_loader />'],
      nickname: 'V',
      group_only_greetings: ['Hello, group'],
      assets: [{ type: 'icon', uri: 'https://example.com/icon.png' }],
      extensions: { theme: 'night' },
    },
  }, 'iTXt')

  const parsed = parseCharacterCard(card, { maxTextCharacters: 150000 })
  assert.equal(parsed.format, 'character_card_v3')
  assert.equal(parsed.character.firstMessage, 'The gate opens.')
  assert.deepEqual(parsed.character.alternateGreetings, [])
  assert.equal(parsed.character.nickname, 'V')
  assert.deepEqual(parsed.character.groupOnlyGreetings, ['Hello, group'])
  assert.equal(parsed.character.externalAssetsImported, false)
  assert.equal(parsed.sourcePayload.data.assets.length, 1)
})

test('prefers the official ccv3 PNG payload over a legacy chara backfill', () => {
  const png = buildPng([
    characterTextChunk('chara', { spec: 'chara_card_v2', spec_version: '2.0', data: { name: 'Legacy copy' } }),
    characterTextChunk('ccv3', { spec: 'chara_card_v3', spec_version: '3.0', data: { name: 'Current V3' } }),
  ])
  const parsed = parseCharacterCard(png, { maxTextCharacters: 150000 })
  assert.equal(parsed.format, 'character_card_v3')
  assert.equal(parsed.character.name, 'Current V3')
})

test('serializes current edits and an associated lorebook into a valid CCv3 PNG', () => {
  const characterBook = {
    name: '更新后的世界',
    extensions: {},
    entries: [{ keys: ['潮门'], content: '潮门现在每天开启两次。', extensions: {}, enabled: true, insertion_order: 1, use_regex: false, constant: false }],
  }
  const payload = serializeCharacterCardV3({
    name: '改名后的守望者',
    description: '更新后的角色设定。',
    personality: '沉着',
    scenario: '新的港口',
    firstMessage: '潮声响起。',
    alternateGreetings: ['晨雾散开。'],
    messageExample: '守望者：潮门已开。',
    creatorNotes: '已修改',
    creator: '作者',
    characterVersion: '2.1',
    tags: ['港口'],
    nickname: '守望者',
    groupOnlyGreetings: ['诸位，晚上好。'],
    extensions: { safe: true },
  }, {
    sourcePayload: { spec: 'chara_card_v3', data: { source: ['https://example.com/card'], system_prompt: 'must not return' } },
    characterBook,
    modificationDate: 1234567890,
    maxTextCharacters: 150000,
  })
  assert.equal(payload.spec, 'chara_card_v3')
  assert.equal(payload.spec_version, '3.0')
  assert.equal(payload.data.name, '改名后的守望者')
  assert.equal(payload.data.system_prompt, '')
  assert.equal(payload.data.post_history_instructions, '')
  assert.equal(payload.data.modification_date, 1234567890)
  assert.deepEqual(payload.data.character_book, characterBook)
  assert.deepEqual(payload.data.source, ['https://example.com/card'])

  const png = encodeCharacterCardV3Png(payload)
  assert.deepEqual(textKeywords(png), ['ccv3'])
  assertValidChunkChecksums(png)
  const reparsed = parseCharacterCard(png, { maxTextCharacters: 150000 })
  assert.equal(reparsed.format, 'character_card_v3')
  assert.equal(reparsed.character.name, '改名后的守望者')
  assert.equal(reparsed.character.firstMessage, '潮声响起。')
  assert.equal(reparsed.sourcePayload.data.character_book.entries[0].content, '潮门现在每天开启两次。')
  assert.deepEqual(chunkTypes(reparsed.avatarBytes), ['IHDR', 'IDAT', 'IEND'])
})

test('applies the export text limit to the complete V3 payload at the exact boundary', () => {
  const character = { name: '边界角色', description: '完整导出内容', tags: [], alternateGreetings: [], groupOnlyGreetings: [] }
  const options = { modificationDate: 1234567890 }
  const complete = serializeCharacterCardV3(character, options)
  const exactLimit = textCharacters(complete)
  assert.deepEqual(serializeCharacterCardV3(character, { ...options, maxTextCharacters: exactLimit }), complete)
  assert.throws(
    () => serializeCharacterCardV3(character, { ...options, maxTextCharacters: exactLimit - 1 }),
    error => error instanceof CharacterCardImportError && error.code === 'CARD_TEXT_LIMIT_EXCEEDED',
  )
})

test('imports V1 field aliases', () => {
  const parsed = parseCharacterCard(pngCharacterCard({
    char_name: 'Legacy',
    description: 'Old card',
    world_scenario: 'Old world',
    char_greeting: 'Hello from V1',
  }), { maxTextCharacters: 150000 })

  assert.equal(parsed.format, 'character_card_v1')
  assert.equal(parsed.character.name, 'Legacy')
  assert.equal(parsed.character.scenario, 'Old world')
  assert.equal(parsed.character.firstMessage, 'Hello from V1')
})

test('rejects unsupported extensions and text over the complete-card limit', () => {
  assert.throws(
    () => assertPngPath('character.json'),
    (error) => error instanceof CharacterCardImportError && error.code === 'UNSUPPORTED_FORMAT',
  )
  const card = pngCharacterCard({ name: 'Too large', description: '你好世界' })
  assert.throws(
    () => parseCharacterCard(card, { maxTextCharacters: 5 }),
    (error) => error instanceof CharacterCardImportError && error.code === 'CARD_TEXT_LIMIT_EXCEEDED',
  )
})

test('rejects PNGs without a chara payload', () => {
  const png = buildPng([
    pngChunk('tEXt', Buffer.from(`author\0${'nobody'.repeat(12)}`, 'latin1')),
  ])
  assert.throws(
    () => parseCharacterCard(png, { maxTextCharacters: 150000 }),
    (error) => error instanceof CharacterCardImportError && error.code === 'CHARACTER_DATA_NOT_FOUND',
  )
})

test('persists source, normalized character, manifest, and clean avatar atomically', async () => {
  const libraryDir = await mkdtemp(join(tmpdir(), 'dsh-roleplay-card-'))
  try {
    const parsed = parseCharacterCard(pngCharacterCard({
      spec: 'chara_card_v2',
      spec_version: '2.0',
      data: { name: 'Stored Character', tags: ['stored'] },
    }), { maxTextCharacters: 150000 })
    const result = await persistCharacterCard(parsed, {
      libraryDir,
      sourcePath: '/workspace/stored.png',
    })

    assert.equal(result.name, 'Stored Character')
    assert.deepEqual(result.tags, ['stored'])
    const source = JSON.parse(await readFile(result.sourcePath, 'utf8'))
    const character = JSON.parse(await readFile(result.characterPath, 'utf8'))
    const manifest = JSON.parse(await readFile(join(result.characterDirectory, 'manifest.json'), 'utf8'))
    assert.equal(source.data.name, 'Stored Character')
    assert.equal(character.id, result.id)
    assert.equal(character.avatarPath, result.avatarPath)
    assert.equal(manifest.originalPath, '/workspace/stored.png')
    assert.deepEqual(chunkTypes(await readFile(result.avatarPath)), ['IHDR', 'IDAT', 'IEND'])
  } finally {
    await rm(libraryDir, { recursive: true, force: true })
  }
})

function pngCharacterCard(value, textType = 'tEXt', addPrivateMetadata = false) {
  const payload = Buffer.from(JSON.stringify(value), 'utf8').toString('base64')
  const text = textType === 'tEXt'
    ? Buffer.concat([Buffer.from('chara\0', 'latin1'), Buffer.from(payload, 'latin1')])
    : Buffer.concat([
        Buffer.from('chara\0', 'latin1'),
        Buffer.from([0, 0]),
        Buffer.from('\0\0', 'latin1'),
        Buffer.from(payload, 'latin1'),
      ])
  const extra = addPrivateMetadata
    ? [pngChunk('zTXt', Buffer.from('private')), pngChunk('eXIf', Buffer.from('location'))]
    : []
  return buildPng([pngChunk(textType, text), ...extra])
}

function characterTextChunk(keyword, value) {
  const payload = Buffer.from(JSON.stringify(value), 'utf8').toString('base64')
  return pngChunk('tEXt', Buffer.from(`${keyword}\0${payload}`, 'latin1'))
}

function buildPng(extraChunks) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(1, 0)
  ihdr.writeUInt32BE(1, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  const scanline = Buffer.from([0, 0, 0, 0, 255])
  return Buffer.concat([
    signature,
    pngChunk('IHDR', ihdr),
    ...extraChunks,
    pngChunk('IDAT', deflateSync(scanline)),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii')
  const result = Buffer.alloc(12 + data.length)
  result.writeUInt32BE(data.length, 0)
  typeBytes.copy(result, 4)
  data.copy(result, 8)
  result.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 8 + data.length)
  return result
}

function chunkTypes(bytes) {
  const view = Buffer.from(bytes)
  const types = []
  let offset = 8
  while (offset + 12 <= view.length) {
    const length = view.readUInt32BE(offset)
    const type = view.toString('ascii', offset + 4, offset + 8)
    types.push(type)
    offset += 12 + length
    if (type === 'IEND') break
  }
  return types
}

function textKeywords(bytes) {
  const view = Buffer.from(bytes)
  const keywords = []
  let offset = 8
  while (offset + 12 <= view.length) {
    const length = view.readUInt32BE(offset)
    const type = view.toString('ascii', offset + 4, offset + 8)
    if (type === 'tEXt') {
      const data = view.subarray(offset + 8, offset + 8 + length)
      const separator = data.indexOf(0)
      if (separator >= 0) keywords.push(data.toString('latin1', 0, separator))
    }
    offset += 12 + length
    if (type === 'IEND') break
  }
  return keywords
}

function assertValidChunkChecksums(bytes) {
  const view = Buffer.from(bytes)
  let offset = 8
  while (offset + 12 <= view.length) {
    const length = view.readUInt32BE(offset)
    const expected = view.readUInt32BE(offset + 8 + length)
    assert.equal(expected, crc32(view.subarray(offset + 4, offset + 8 + length)))
    const type = view.toString('ascii', offset + 4, offset + 8)
    offset += 12 + length
    if (type === 'IEND') break
  }
}

function crc32(bytes) {
  let crc = 0xffffffff
  for (const byte of bytes) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ ((crc & 1) === 1 ? 0xedb88320 : 0)
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

function textCharacters(value) {
  if (typeof value === 'string') return [...value].length
  if (Array.isArray(value)) return value.reduce((total, item) => total + textCharacters(item), 0)
  if (value && typeof value === 'object') return Object.values(value).reduce((total, item) => total + textCharacters(item), 0)
  return 0
}
