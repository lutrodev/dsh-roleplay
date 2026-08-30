import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { Context } from '@deepseek-ai/cordis'
import { parseCharacterCard, RpCharacterCards, apply, dispatchBrowser, inject } from '../src/index.js'

test('registers import_character_card and reads bytes through the Harness filesystem service', async () => {
  const libraryDir = await mkdtemp(join(tmpdir(), 'dsh-roleplay-tool-'))
  let registered
  let requestedMaxBytes
  const bytes = characterCardBytes({
    spec: 'chara_card_v2',
    spec_version: '2.0',
    data: {
      name: 'Tool Imported',
      description: 'A long enough description to make the synthetic PNG exceed its minimum size.',
    },
  })
  const ctx = new Context()
  ctx.provide('tools', {
      register(tool) {
        registered = tool
      },
    })
  ctx.provide('fs', {
      async resolve(path) {
        assert.equal(path, '/workspace/tool-card.PNG')
        return { targetKey: 'opaque-target', displayPath: path }
      },
      async readBytes(target, _signal, maxBytes) {
        assert.equal(target.targetKey, 'opaque-target')
        requestedMaxBytes = maxBytes
        return bytes
      },
    })
  ctx.provide('rpRuntime', { registerContextSource() { return () => {} } })

  try {
    apply(ctx, {
      libraryDir,
      maxInputBytes: 20 * 1024 * 1024,
      maxTextCharacters: 150000,
    })
    await new Promise(resolve => setImmediate(resolve))
    assert.equal(registered.name, 'import_character_card')
    assert.match(registered.description, /does not bind it to the current conversation/)
    assert.match(registered.parameters.properties.path.description, /Pass only the path string/)
    const result = await registered.execute(
      { path: '/workspace/tool-card.PNG' },
      { signal: new AbortController().signal },
    )
    assert.equal(requestedMaxBytes, 20 * 1024 * 1024)
    assert.equal(result.name, 'Tool Imported')
    assert.equal(result.format, 'character_card_v2')
    assert.equal(JSON.parse(await readFile(result.characterPath, 'utf8')).name, 'Tool Imported')
    const listed = await ctx.rpCharacterCards.list({ query: 'tool', limit: 50 })
    assert.equal(listed.total, 1)
    assert.equal(listed.items[0].hasAvatar, true)
    const detail = await ctx.rpCharacterCards.detail(result.id)
    assert.equal(detail.name, 'Tool Imported')
    assert.equal(detail.source.originalName, 'tool-card.PNG')
    assert.equal((await ctx.rpCharacterCards.getSource(result.id)).data.name, 'Tool Imported')
    assert.ok((await ctx.rpCharacterCards.avatar(result.id)).byteLength > 0)
    await assert.rejects(
      registered.execute({ path: '/workspace/tool-card.PNG' }, { signal: new AbortController().signal }),
      error => error?.code === 'DUPLICATE_CARD',
    )
  } finally {
    await ctx.fiber.dispose()
    await rm(libraryDir, { recursive: true, force: true })
  }
})

test('fails plugin activation for non-positive limits', () => {
  const ctx = new Context()
  assert.throws(
    () => apply(ctx, { libraryDir: '.', maxInputBytes: 0, maxTextCharacters: 1 }),
    /maxInputBytes must be a positive integer/,
  )
})

test('mounts the browser Remote when the transport becomes available after the plugin', async () => {
  const ctx = new Context()
  assert.deepEqual(inject, [])
  const mounted = []
  apply(ctx, {
    libraryDir: '.', maxInputBytes: 1024, maxTextCharacters: 1024,
    registerTool: false, exposeBrowser: true,
  })
  assert.deepEqual(mounted, [])

  ctx.provide('rpRemote', { register(path, _handler) {
    mounted.push({ path })
    return () => {}
  } })
  await new Promise(resolve => setImmediate(resolve))

  assert.deepEqual(mounted, [{ path: '/rp-character-cards' }])
  await ctx.fiber.dispose()
})

test('browser Remote admits export through the registered endpoint whitelist', async () => {
  const libraryDir = await mkdtemp(join(tmpdir(), 'dsh-roleplay-card-export-rpc-'))
  const ctx = new Context()
  let handler
  ctx.provide('rpRemote', { register(path, next) {
    assert.equal(path, '/rp-character-cards')
    handler = next
    return () => {}
  } })

  try {
    apply(ctx, {
      libraryDir,
      maxInputBytes: 4096,
      maxTextCharacters: 4096,
      registerTool: false,
      exposeBrowser: true,
    })
    await new Promise(resolve => setImmediate(resolve))
    const created = (await ctx.rpCharacterCards.create({ name: 'Remote 导出角色', description: '经过完整浏览器 Remote 路径。' })).created
    const response = await handler('export', { id: created.id })

    assert.equal(response.ok, true)
    assert.equal(response.value.ok, true)
    assert.equal(response.value.value.format, 'character_card_v3')
    assert.equal(response.value.value.mimeType, 'image/png')
    assert.equal(parseCharacterCard(Buffer.from(response.value.value.base64, 'base64'), { maxTextCharacters: 4096 }).character.name, 'Remote 导出角色')
  } finally {
    await ctx.fiber.dispose()
    await rm(libraryDir, { recursive: true, force: true })
  }
})

test('registers the card context source when the runtime becomes available later', async () => {
  const ctx = new Context()
  const sources = []
  apply(ctx, { libraryDir: '.', maxInputBytes: 1024, maxTextCharacters: 1024, registerTool: false, exposeBrowser: false })
  ctx.provide('rpRuntime', { registerContextSource(source) { sources.push(source); return () => {} } })
  await new Promise(resolve => setImmediate(resolve))
  assert.deepEqual(sources.map(source => source.id), ['rp.card'])
  await ctx.fiber.dispose()
})

test('card prompt selects characterization fields and excludes every greeting', async () => {
  const libraryDir = await mkdtemp(join(tmpdir(), 'dsh-roleplay-card-context-'))
  const ctx = new Context()
  let source
  let selected
  ctx.provide('rpRuntime', { registerContextSource(value) { source = value; return () => {} } })
  ctx.provide('rpSessions', { get() { return { resources: { card: { id: selected.id } } } } })
  const cards = new RpCharacterCards(ctx, { libraryDir, maxInputBytes: 4096, maxTextCharacters: 4096 })
  try {
    selected = (await cards.create({
      name: '旅人',
      description: '谨慎的旅人。',
      personality: '善于观察。',
      scenario: '身处雾港。',
      messageExample: '旅人：先听钟声。',
      firstMessage: '雾港醒来。',
      alternateGreetings: ['悬崖路醒来。'],
    })).created
    const prepared = await source.prepare({ agent: {} })
    assert.match(prepared.text, /谨慎的旅人|善于观察|身处雾港|旅人：先听钟声/)
    assert.doesNotMatch(prepared.text, /雾港醒来|悬崖路醒来|opening/)
    assert.doesNotMatch(prepared.text, new RegExp(`${selected.id}|revision|rp_card`))
    await cards.delete(selected.id)
    assert.equal(await source.prepare({ agent: {} }), undefined)
  } finally {
    await ctx.fiber.dispose()
    await rm(libraryDir, { recursive: true, force: true })
  }
})

test('browser library enforces the complete upload byte limit', async () => {
  const imported = []
  const cards = {
    maxInputBytes: 3,
    async import(bytes) { imported.push([...bytes]); return { id: '00000000-0000-0000-0000-000000000001' } },
    async detail(id) { return { id } },
  }
  const exact = await dispatchBrowser(cards, 'import', { name: 'card.json', mimeType: 'application/json', base64: Buffer.from('abc').toString('base64') })
  assert.deepEqual(imported[0], [97, 98, 99])
  assert.equal(exact.detail.id, '00000000-0000-0000-0000-000000000001')
  await assert.rejects(dispatchBrowser(cards, 'import', { name: 'card.json', mimeType: 'application/json', base64: Buffer.from('abcd').toString('base64') }), error => error.code === 'LIMIT_EXCEEDED')
})

test('explicit deletion removes a corrupt card directory', async () => {
  const libraryDir = await mkdtemp(join(tmpdir(), 'dsh-roleplay-corrupt-card-delete-'))
  const ctx = new Context()
  const cards = new RpCharacterCards(ctx, { libraryDir, maxInputBytes: 4096, maxTextCharacters: 4096 })
  try {
    const created = (await cards.create({ name: '可删除损坏角色卡' })).created
    await writeFile(join(libraryDir, created.id, 'manifest.json'), '{')
    const deleted = await cards.delete(created.id)
    assert.deepEqual(deleted, { id: created.id, name: '可删除损坏角色卡' })
    await assert.rejects(cards.detail(created.id), error => error.code === 'ASSET_NOT_FOUND')
  } finally {
    await ctx.fiber.dispose()
    await rm(libraryDir, { recursive: true, force: true })
  }
})

test('creates a native card without an import file and keeps it revision-editable', async () => {
  const libraryDir = await mkdtemp(join(tmpdir(), 'dsh-roleplay-native-card-'))
  const ctx = new Context()
  const cards = new RpCharacterCards(ctx, { libraryDir, maxInputBytes: 4096, maxTextCharacters: 4096 })
  try {
    const result = await dispatchBrowser(cards, 'create', { character: { name: '新建角色', description: '从对话中创建。', tags: ['原创'] } })
    assert.equal(result.detail.name, '新建角色')
    assert.equal(result.detail.format, 'rp_agent_authored')
    assert.equal(result.detail.source.originalName, 'created-in-roleplay')
    assert.deepEqual(result.detail.tags, ['原创'])
    const updated = await cards.update(result.detail.id, { personality: '冷静而敏锐。' }, 1)
    assert.equal(updated.revision, 2)
    assert.equal(updated.character.personality, '冷静而敏锐。')
  } finally {
    await ctx.fiber.dispose()
    await rm(libraryDir, { recursive: true, force: true })
  }
})

test('lists imported character cards by import time with the newest first', async () => {
  const libraryDir = await mkdtemp(join(tmpdir(), 'dsh-roleplay-card-import-order-'))
  const ctx = new Context()
  const cards = new RpCharacterCards(ctx, { libraryDir, maxInputBytes: 4096, maxTextCharacters: 4096 })
  try {
    const older = await cards.import(new TextEncoder().encode(JSON.stringify({ name: 'A 旧角色' })), { path: 'older.json' })
    const newer = await cards.import(new TextEncoder().encode(JSON.stringify({ name: 'Z 新角色' })), { path: 'newer.json' })
    await setCardImportedAt(libraryDir, older.id, '2026-01-01T00:00:00.000Z')
    await setCardImportedAt(libraryDir, newer.id, '2026-02-01T00:00:00.000Z')
    await cards.update(older.id, { description: '后来编辑，但不改变导入顺序。' }, 1)

    const firstPage = await cards.list({ limit: 1 })
    const secondPage = await cards.list({ cursor: firstPage.nextCursor, limit: 1 })
    assert.deepEqual(firstPage.items.map(item => item.id), [newer.id])
    assert.equal(firstPage.items[0].importedAt, '2026-02-01T00:00:00.000Z')
    assert.deepEqual(secondPage.items.map(item => item.id), [older.id])
  } finally {
    await ctx.fiber.dispose()
    await rm(libraryDir, { recursive: true, force: true })
  }
})

test('browser export downloads the latest saved native card as a re-importable V3 PNG', async () => {
  const libraryDir = await mkdtemp(join(tmpdir(), 'dsh-roleplay-native-card-export-'))
  const ctx = new Context()
  const cards = new RpCharacterCards(ctx, { libraryDir, maxInputBytes: 4096, maxTextCharacters: 4096 })
  try {
    const created = (await cards.create({ name: '初始角色', description: '旧设定。' })).created
    await cards.update(created.id, {
      name: '修改/后的:角色',
      description: '保存后的新设定。',
      firstMessage: '新的开场。',
      tags: ['已修改'],
    }, 1)
    const exported = await dispatchBrowser(cards, 'export', { id: created.id })
    assert.equal(exported.mimeType, 'image/png')
    assert.equal(exported.format, 'character_card_v3')
    assert.equal(exported.specVersion, '3.0')
    assert.equal(exported.fileName, '修改_后的_角色.png')
    assert.deepEqual(exported.lorebooks, [])
    assert.equal(exported.lorebookEntries, 0)
    const parsed = parseCharacterCard(Buffer.from(exported.base64, 'base64'), { maxTextCharacters: 4096 })
    assert.equal(parsed.character.name, '修改/后的:角色')
    assert.equal(parsed.character.description, '保存后的新设定。')
    assert.equal(parsed.character.firstMessage, '新的开场。')
    assert.deepEqual(parsed.character.tags, ['已修改'])
  } finally {
    await ctx.fiber.dispose()
    await rm(libraryDir, { recursive: true, force: true })
  }
})

test('browser library does not expose direct deletion outside the lifecycle coordinator', async () => {
  await assert.rejects(
    dispatchBrowser({}, 'delete', { id: '00000000-0000-0000-0000-000000000001' }),
    error => error.code === 'INVALID_REQUEST',
  )
})

test('updates alternate greetings as a normalized ordered array and counts them in the complete limit', async () => {
  const libraryDir = await mkdtemp(join(tmpdir(), 'dsh-roleplay-card-openings-'))
  const ctx = new Context()
  const cards = new RpCharacterCards(ctx, { libraryDir, maxInputBytes: 4096, maxTextCharacters: 200 })
  try {
    const imported = await cards.import(new TextEncoder().encode(JSON.stringify({ name: '角色', first_mes: '默认' })), { path: 'openings.json' })
    const updated = await cards.update(imported.id, { alternateGreetings: ['  第二幕\r\n开始  ', '', '第三幕'] }, 1)
    assert.deepEqual(updated.character.alternateGreetings, ['第二幕\n开始', '第三幕'])
    const reordered = await cards.update(imported.id, { alternateGreetings: ['第三幕', '第二幕\n开始'] }, 2)
    assert.deepEqual(reordered.character.alternateGreetings, ['第三幕', '第二幕\n开始'])
    await assert.rejects(cards.update(imported.id, { alternateGreetings: '非法' }, 3), error => error.code === 'INVALID_REQUEST')
    await assert.rejects(cards.update(imported.id, { alternateGreetings: ['x'.repeat(500)] }, 3), error => error.code === 'LIMIT_EXCEEDED')
  } finally {
    await ctx.fiber.dispose()
    await rm(libraryDir, { recursive: true, force: true })
  }
})

test('accepts a large complete import under the raised card text limit', async () => {
  const libraryDir = await mkdtemp(join(tmpdir(), 'dsh-roleplay-card-limit-'))
  const ctx = new Context()
  try {
    apply(ctx, {
      libraryDir,
      maxInputBytes: 20 * 1024 * 1024,
      maxTextCharacters: 2_000_000,
      registerTool: false,
      exposeBrowser: false,
    })
    const bytes = Buffer.from(JSON.stringify({ name: 'Limit Card', description: 'x'.repeat(800000) }))
    const result = await ctx.rpCharacterCards.import(bytes, { path: 'limit-card.json' })
    assert.equal(result.name, 'Limit Card')
  } finally {
    await ctx.fiber.dispose()
    await rm(libraryDir, { recursive: true, force: true })
  }
})

test('accepts a complete transformed import exactly at the text limit', async () => {
  const libraryDir = await mkdtemp(join(tmpdir(), 'dsh-roleplay-card-transform-exact-'))
  const ctx = new Context()
  try {
    apply(ctx, {
      libraryDir,
      maxInputBytes: 8 * 1024 * 1024,
      maxTextCharacters: 1000,
      registerTool: false,
      exposeBrowser: false,
    })
    ctx.rpCharacterCards.registerImportTransformer({
      id: 'test-exact-limit',
      transform(parsed) {
        return {
          ...parsed,
          sourcePayload: { text: 's'.repeat(400) },
          quarantinedPrompts: [],
          character: { name: 'n'.repeat(600) },
        }
      },
    })
    const bytes = Buffer.from(JSON.stringify({ name: 'Exact Card' }))
    const result = await ctx.rpCharacterCards.import(bytes, { path: 'exact-card.json' })
    assert.equal(result.name.length, 600)
  } finally {
    await ctx.fiber.dispose()
    await rm(libraryDir, { recursive: true, force: true })
  }
})

test('rejects a complete transformed import over the text limit', async () => {
  const libraryDir = await mkdtemp(join(tmpdir(), 'dsh-roleplay-card-transform-limit-'))
  const ctx = new Context()
  try {
    apply(ctx, {
      libraryDir,
      maxInputBytes: 8 * 1024 * 1024,
      maxTextCharacters: 1000,
      registerTool: false,
      exposeBrowser: false,
    })
    ctx.rpCharacterCards.registerImportTransformer({
      id: 'test-expansion',
      transform(parsed) {
        return {
          ...parsed,
          sourcePayload: { text: 's'.repeat(400) },
          quarantinedPrompts: [],
          character: { name: 'n'.repeat(601) },
        }
      },
    })
    const bytes = Buffer.from(JSON.stringify({ name: 'Expanded Card' }))
    await assert.rejects(
      ctx.rpCharacterCards.import(bytes, { path: 'expanded-card.json' }),
      error => error instanceof Error && error.code === 'CARD_TEXT_LIMIT_EXCEEDED' && /contains 1001 text characters/.test(error.message),
    )
  } finally {
    await ctx.fiber.dispose()
    await rm(libraryDir, { recursive: true, force: true })
  }
})

test('two service instances sharing a library serialize duplicate imports and revision CAS', async () => {
  const libraryDir = await mkdtemp(join(tmpdir(), 'dsh-roleplay-card-shared-'))
  const firstCtx = new Context()
  const secondCtx = new Context()
  const config = { libraryDir, maxInputBytes: 4096, maxTextCharacters: 4096 }
  const first = new RpCharacterCards(firstCtx, config)
  const second = new RpCharacterCards(secondCtx, config)
  const bytes = new TextEncoder().encode(JSON.stringify({ name: '共享角色', description: '并发测试' }))
  try {
    const imports = await Promise.allSettled([
      first.import(bytes, { path: 'shared.json' }),
      second.import(bytes, { path: 'shared.json' }),
    ])
    assert.equal(imports.filter(result => result.status === 'fulfilled').length, 1)
    assert.equal(imports.filter(result => result.status === 'rejected' && result.reason?.code === 'DUPLICATE_CARD').length, 1)
    const imported = imports.find(result => result.status === 'fulfilled').value

    const updates = await Promise.allSettled([
      first.update(imported.id, { name: '实例一' }, 1),
      second.update(imported.id, { name: '实例二' }, 1),
    ])
    assert.equal(updates.filter(result => result.status === 'fulfilled').length, 1)
    assert.equal(updates.filter(result => result.status === 'rejected' && result.reason?.code === 'REVISION_CONFLICT').length, 1)
    assert.equal((await first.detail(imported.id)).revision, 2)
  } finally {
    await firstCtx.fiber.dispose()
    await secondCtx.fiber.dispose()
    await rm(libraryDir, { recursive: true, force: true })
  }
})

function characterCardBytes(value) {
  const payload = Buffer.from(JSON.stringify(value), 'utf8').toString('base64')
  const text = Buffer.from(`chara\0${payload}`, 'latin1')
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('tEXt', text),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

async function setCardImportedAt(libraryDir, id, importedAt) {
  const path = join(libraryDir, id, 'manifest.json')
  const manifest = JSON.parse(await readFile(path, 'utf8'))
  await writeFile(path, `${JSON.stringify({ ...manifest, importedAt }, null, 2)}\n`)
}

function chunk(type, data) {
  const output = Buffer.alloc(12 + data.length)
  output.writeUInt32BE(data.length, 0)
  output.write(type, 4, 'ascii')
  data.copy(output, 8)
  return output
}
