import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { Context } from '@deepseek-ai/cordis'
import { parseCharacterCard, RpCharacterCards } from 'dsh-roleplay-rp-character-card'
import { RpLoreBooks, apply, dispatchBrowser, inject } from '../src/index.js'

test('imports, rejects duplicates, searches, pages and reads lorebook details', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-lore-library-'))
  const ctx = new Context()
  ctx.provide('rpRuntime', { registerContextSource() {} })
  const books = new RpLoreBooks(ctx, { libraryDir: root, maxInputBytes: 256, maxTokens: 128, maxEntries: 16, maxRecursiveDepth: 2 })
  try {
    const value = { name: '海港设定', entries: [{ id: 1, keys: ['海港'], content: '钟声在清晨响起。' }] }
    const bytes = new TextEncoder().encode(JSON.stringify(value))
    const imported = await books.importBytes(bytes, { sourceName: 'harbor.json' })
    assert.equal((await books.list({ query: '海港', limit: 1 })).items[0].id, imported.id)
    const detail = await books.detail(imported.id)
    assert.equal(detail.entries.length, 1)
    assert.equal(detail.source.originalName, 'harbor.json')
    await assert.rejects(books.importBytes(bytes), error => error.code === 'DUPLICATE_ASSET')
    await assert.rejects(books.importBytes(new Uint8Array(257)), error => error.code === 'LIMIT_EXCEEDED')
    await assert.rejects(books.importBytes(new TextEncoder().encode('{')), error => error.code === 'ASSET_CORRUPT')
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('lists imported world books by import time with the newest first', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-lore-import-order-'))
  const ctx = new Context()
  const books = new RpLoreBooks(ctx, { libraryDir: root, maxInputBytes: 4096, maxTokens: 128, maxEntries: 16, maxRecursiveDepth: 2 })
  try {
    const older = await books.import({ name: 'A 旧世界', entries: [] })
    const newer = await books.import({ name: 'Z 新世界', entries: [] })
    await setLorebookImportedAt(root, older.id, '2026-01-01T00:00:00.000Z')
    await setLorebookImportedAt(root, newer.id, '2026-02-01T00:00:00.000Z')
    await books.update(older.id, { name: 'A 旧世界（后来编辑）' }, 1)

    const firstPage = await books.list({ limit: 1 })
    const secondPage = await books.list({ cursor: firstPage.nextCursor, limit: 1 })
    assert.deepEqual(firstPage.items.map(item => item.id), [newer.id])
    assert.equal(firstPage.items[0].importedAt, '2026-02-01T00:00:00.000Z')
    assert.deepEqual(secondPage.items.map(item => item.id), [older.id])
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('uses each imported book scan depth and preserves it across native edits', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-lore-scan-depth-'))
  const ctx = new Context()
  let bindingId
  ctx.provide('rpSessions', {
    get() { return { resources: { lorebooks: [{ id: bindingId }], card: undefined } } },
  })
  const books = new RpLoreBooks(ctx, { libraryDir: root, maxInputBytes: 4096, maxTokens: 128, maxEntries: 16, maxRecursiveDepth: 2 })
  try {
    const imported = await books.import({
      name: '逐本扫描',
      scan_depth: 1,
      recursive_scanning: false,
      entries: [
        { id: 'old', keys: ['旧关键词'], content: '不应激活' },
        { id: 'recent', keys: ['新关键词'], content: '应当激活' },
      ],
    })
    bindingId = imported.id
    const stored = await books.get(imported.id)
    assert.equal(stored.scanDepth, 1)
    assert.equal(stored.recursiveScanning, false)
    const assembly = await books.assembleLore({
      agent: {},
      runId: 'scan-depth',
      messages: [
        { role: 'assistant', content: [{ type: 'text', text: '旧关键词' }] },
        { role: 'assistant', content: [{ type: 'text', text: '新关键词' }] },
        { role: 'user', content: [{ type: 'text', text: '当前输入' }] },
      ],
    })
    assert.deepEqual(assembly.result.entries.map(entry => entry.id), ['recent'])
    const edited = await books.update(imported.id, { name: '逐本扫描（已编辑）' }, 1)
    assert.equal(edited.scanDepth, 1)
    assert.equal(edited.recursiveScanning, false)
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

async function setLorebookImportedAt(root, id, importedAt) {
  const path = join(root, `${id}.json`)
  const book = JSON.parse(await readFile(path, 'utf8'))
  await writeFile(path, `${JSON.stringify({ ...book, importedAt }, null, 2)}\n`)
}

test('treats deleted bound cards and lorebooks as absent during context assembly', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-lore-deleted-bindings-'))
  const deletedCardId = '00000000-0000-0000-0000-000000000072'
  const deletedBookId = '00000000-0000-0000-0000-000000000073'
  const ctx = new Context()
  ctx.provide('rpSessions', {
    get() { return { resources: { card: { id: deletedCardId }, lorebooks: [{ id: deletedBookId }] } } },
  })
  ctx.provide('rpCharacterCards', {
    async get() { throw Object.assign(new Error('gone'), { code: 'ASSET_NOT_FOUND' }) },
  })
  const books = new RpLoreBooks(ctx, { libraryDir: root, maxInputBytes: 4096, maxTokens: 128, maxEntries: 16, maxRecursiveDepth: 2 })
  try {
    assert.equal(await books.assembleLore({ agent: {}, runId: 'deleted-bindings', messages: [] }), undefined)
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('rejects reading legacy standalone books but still allows explicit deletion', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-lore-slot-migration-'))
  const id = '00000000-0000-0000-0000-000000000123'
  const ctx = new Context()
  const books = new RpLoreBooks(ctx, { libraryDir: root, maxInputBytes: 4096, maxTokens: 128, maxEntries: 16, maxRecursiveDepth: 2 })
  try {
    await writeFile(join(root, `${id}.json`), JSON.stringify({
      schemaVersion: 1, id, name: '旧世界书', revision: 4, sourceHash: 'legacy',
      entries: [{ id: 'rule', position: 4, depth: 0, order: 9, constant: true, content: '潮门每天只能开启一次。' }],
    }))
    await assert.rejects(books.get(id), error => error.code === 'UNSUPPORTED_SCHEMA' && /删除后重新导入/.test(error.message))
    const removed = await books.delete(id)
    assert.equal(removed.id, id)
    assert.equal(removed.name, '旧世界书')
    assert.equal(removed.status, 'corrupt')
    await assert.rejects(books.get(id), error => error.code === 'ASSET_NOT_FOUND')
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('finds deletion candidates from raw source metadata without normalizing lorebook content', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-lore-delete-candidates-'))
  const characterId = '00000000-0000-0000-0000-000000000124'
  const relatedId = '00000000-0000-0000-0000-000000000125'
  const corruptId = '00000000-0000-0000-0000-000000000126'
  const unrelatedId = '00000000-0000-0000-0000-000000000127'
  const ctx = new Context()
  const books = new RpLoreBooks(ctx, { libraryDir: root, maxInputBytes: 4096, maxTokens: 128, maxEntries: 16, maxRecursiveDepth: 2 })
  try {
    await writeFile(join(root, `${relatedId}.json`), JSON.stringify({
      schemaVersion: 1,
      id: relatedId,
      name: '旧格式关联世界书',
      sourceCharacterId: characterId,
      entries: [],
    }))
    await writeFile(join(root, `${corruptId}.json`), '{')
    await writeFile(join(root, `${unrelatedId}.json`), JSON.stringify({
      schemaVersion: 3,
      id: unrelatedId,
      name: '无关世界书',
      sourceCharacterId: '00000000-0000-0000-0000-000000000128',
      entries: [],
    }))

    assert.deepEqual(await books.listDeletionCandidates(characterId), [{ id: relatedId, name: '旧格式关联世界书' }])
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('rebuilds a managed schema v2 embedded book from its source character card', async () => {
  const cardRoot = await mkdtemp(join(tmpdir(), 'rp-card-managed-lore-migration-'))
  const loreRoot = await mkdtemp(join(tmpdir(), 'rp-lore-managed-migration-'))
  const ctx = new Context()
  const cards = new RpCharacterCards(ctx, { libraryDir: cardRoot, maxInputBytes: 4096, maxTextCharacters: 4096 })
  const books = new RpLoreBooks(ctx, { libraryDir: loreRoot, maxInputBytes: 4096, maxTokens: 128, maxEntries: 16, maxRecursiveDepth: 2 })
  await new Promise(resolve => setImmediate(resolve))
  try {
    const source = {
      spec: 'chara_card_v2', spec_version: '2.0', data: {
        name: '旧版内嵌世界角色', description: '测试角色',
        character_book: { name: '角色世界', entries: [{ id: 1, keys: ['港口'], content: '港口终年有雾。' }] },
      },
    }
    const imported = await cards.import(new TextEncoder().encode(JSON.stringify(source)), { path: 'legacy-managed.json' })
    const character = await cards.detail(imported.id)
    const lorebookId = character.linkedLorebookIds[0]
    const path = join(loreRoot, `${lorebookId}.json`)
    const current = JSON.parse(await readFile(path, 'utf8'))
    await writeFile(path, `${JSON.stringify({
      ...current,
      schemaVersion: 2,
      revision: 4,
      embeddedNormalizationVersion: 6,
      entries: [{ ...current.entries[0], content: '过时的规范化内容。' }],
    }, null, 2)}\n`)

    const page = await books.list({ limit: 100 })
    assert.equal(page.items.find(item => item.id === lorebookId)?.status, 'ready')
    const migrated = await books.get(lorebookId)
    assert.equal(migrated.schemaVersion, 3)
    assert.equal(migrated.revision, 5)
    assert.equal(migrated.embeddedNormalizationVersion, 8)
    assert.equal(migrated.entries[0].content, '港口终年有雾。')
    assert.equal(migrated.sourceCharacterId, imported.id)
  } finally {
    await ctx.fiber.dispose()
    await rm(cardRoot, { recursive: true, force: true })
    await rm(loreRoot, { recursive: true, force: true })
  }
})

test('keeps an irrecoverably corrupt managed book reachable for explicit deletion', async () => {
  const cardRoot = await mkdtemp(join(tmpdir(), 'rp-card-corrupt-managed-lore-'))
  const loreRoot = await mkdtemp(join(tmpdir(), 'rp-lore-corrupt-managed-'))
  const ctx = new Context()
  const cards = new RpCharacterCards(ctx, { libraryDir: cardRoot, maxInputBytes: 4096, maxTextCharacters: 4096 })
  const books = new RpLoreBooks(ctx, { libraryDir: loreRoot, maxInputBytes: 4096, maxTokens: 128, maxEntries: 16, maxRecursiveDepth: 2 })
  await new Promise(resolve => setImmediate(resolve))
  try {
    const source = {
      spec: 'chara_card_v2', spec_version: '2.0', data: {
        name: '损坏世界书角色', description: '测试角色',
        character_book: { name: '待移除世界', entries: [{ id: 1, keys: ['港口'], content: '港口终年有雾。' }] },
      },
    }
    const imported = await cards.import(new TextEncoder().encode(JSON.stringify(source)), { path: 'corrupt-managed.json' })
    const character = await cards.detail(imported.id)
    const lorebookId = character.linkedLorebookIds[0]
    const path = join(loreRoot, `${lorebookId}.json`)
    const current = JSON.parse(await readFile(path, 'utf8'))
    await writeFile(path, `${JSON.stringify({ ...current, entries: [current.entries[0], current.entries[0]] }, null, 2)}\n`)

    const page = await books.list({ limit: 100 })
    assert.equal(page.items.find(item => item.id === lorebookId)?.status, 'corrupt')
    const removed = await books.delete(lorebookId)
    assert.equal(removed.id, lorebookId)
    await assert.rejects(books.get(lorebookId), error => error.code === 'ASSET_NOT_FOUND')
  } finally {
    await ctx.fiber.dispose()
    await rm(cardRoot, { recursive: true, force: true })
    await rm(loreRoot, { recursive: true, force: true })
  }
})

test('materializes embedded card lore, preserves its relationship, and supports editing and deletion', async () => {
  const cardRoot = await mkdtemp(join(tmpdir(), 'rp-card-related-lore-'))
  const loreRoot = await mkdtemp(join(tmpdir(), 'rp-lore-related-card-'))
  const ctx = new Context()
  const cards = new RpCharacterCards(ctx, { libraryDir: cardRoot, maxInputBytes: 4096, maxTextCharacters: 4096 })
  const books = new RpLoreBooks(ctx, { libraryDir: loreRoot, maxInputBytes: 4096, maxTokens: 128, maxEntries: 16, maxRecursiveDepth: 2 })
  await new Promise(resolve => setImmediate(resolve))
  try {
    const source = {
      spec: 'chara_card_v2', spec_version: '2.0', data: {
        name: '有关联的角色', description: '测试角色',
        character_book: { name: '角色的世界', entries: [{ id: 1, keys: ['港口'], content: '港口终年有雾。' }] },
      },
    }
    const imported = await cards.import(new TextEncoder().encode(JSON.stringify(source)), { path: 'related.json' })
    const character = await cards.detail(imported.id)
    assert.equal(character.linkedLorebookIds.length, 1)

    const lore = await books.detail(character.linkedLorebookIds[0])
    assert.equal(lore.source.characterId, imported.id)
    assert.equal(lore.source.characterName, '有关联的角色')
    assert.equal(lore.entries[0].content, '港口终年有雾。')
    assert.equal(lore.entries[0].level, 'roleplayGuide')
    assert.deepEqual(lore.slots, { worldDescription: 0, roleplayGuide: 1, importantRules: 0 })

    const editedCard = await cards.update(imported.id, { name: '改名后的角色', tags: ['已编辑'] }, 1)
    assert.equal(editedCard.revision, 2)
    assert.deepEqual(editedCard.tags, ['已编辑'])
    await assert.rejects(cards.update(imported.id, { name: '冲突' }, 1), error => error.code === 'REVISION_CONFLICT')

    const editedLore = await books.update(lore.id, { name: '改名后的世界', entries: lore.entries }, 1)
    assert.equal(editedLore.revision, 2)
    assert.equal(editedLore.name, '改名后的世界')
    await assert.rejects(books.update(lore.id, { entries: { one: lore.entries[0] } }, 2), error => error.code === 'INVALID_REQUEST')
    await assert.rejects(books.update(lore.id, { entries: [lore.entries[0], { ...lore.entries[0] }] }, 2), error => error.code === 'INVALID_REQUEST')
    const characterBeforeLoreDelete = await cards.detail(imported.id)
    await books.delete(lore.id)
    assert.deepEqual(await cards.detail(imported.id), characterBeforeLoreDelete)
    assert.equal((await books.list({ limit: 100 })).total, 0)
    const exportedWithoutDeletedLore = await cards.exportV3Png(imported.id, { modificationDate: 1234567890 })
    assert.deepEqual(exportedWithoutDeletedLore.lorebooks, [])
    assert.equal(parseCharacterCard(exportedWithoutDeletedLore.bytes, { maxTextCharacters: 4096 }).sourcePayload.data.character_book, undefined)

    await cards.delete(imported.id)
    await assert.rejects(cards.detail(imported.id), error => error.code === 'ASSET_NOT_FOUND')
  } finally {
    await ctx.fiber.dispose()
    await rm(cardRoot, { recursive: true, force: true })
    await rm(loreRoot, { recursive: true, force: true })
  }
})

test('character export embeds the latest associated lorebook revision in CCv3 format', async () => {
  const cardRoot = await mkdtemp(join(tmpdir(), 'rp-card-v3-export-'))
  const loreRoot = await mkdtemp(join(tmpdir(), 'rp-lore-v3-export-'))
  const ctx = new Context()
  const cards = new RpCharacterCards(ctx, { libraryDir: cardRoot, maxInputBytes: 8192, maxTextCharacters: 8192 })
  const books = new RpLoreBooks(ctx, { libraryDir: loreRoot, maxInputBytes: 8192, maxTokens: 128, maxEntries: 16, maxRecursiveDepth: 2 })
  await new Promise(resolve => setImmediate(resolve))
  try {
    const imported = await cards.import(new TextEncoder().encode(JSON.stringify({
      spec: 'chara_card_v2',
      spec_version: '2.0',
      data: {
        name: '港湾守望者',
        description: '旧角色设定。',
        system_prompt: '隔离后不可导出',
        character_book: {
          name: '旧港世界',
          scan_depth: 2,
          recursive_scanning: false,
          entries: [{ id: 1, keys: ['潮门'], content: '潮门每天开启一次。', position: 0, insertion_order: 3 }],
        },
      },
    })), { path: 'harbor.json' })
    await cards.update(imported.id, { name: '新港守望者', description: '保存后的角色设定。' }, 1)
    const cardDetail = await cards.detail(imported.id)
    const lore = await books.detail(cardDetail.linkedLorebookIds[0])
    const entries = lore.entries.map(entry => ({ ...entry, content: '潮门每天开启两次。' }))
    await books.update(lore.id, { name: '新港世界', entries }, 1)

    const exported = await cards.exportV3Png(imported.id, { modificationDate: 1234567890 })
    assert.deepEqual(exported.lorebooks, [{ id: lore.id, name: '新港世界', entries: 1 }])
    assert.equal(exported.lorebookEntries, 1)
    const parsed = parseCharacterCard(exported.bytes, { maxTextCharacters: 8192 })
    assert.equal(parsed.format, 'character_card_v3')
    assert.equal(parsed.character.name, '新港守望者')
    assert.equal(parsed.character.description, '保存后的角色设定。')
    assert.equal(parsed.sourcePayload.data.modification_date, 1234567890)
    assert.equal(parsed.sourcePayload.data.system_prompt, undefined)
    assert.equal(parsed.sourcePayload.data.character_book.name, '新港世界')
    assert.equal(parsed.sourcePayload.data.character_book.scan_depth, 2)
    assert.equal(parsed.sourcePayload.data.character_book.recursive_scanning, false)
    assert.equal(parsed.sourcePayload.data.character_book.entries[0].content, '潮门每天开启两次。')
    assert.equal(parsed.sourcePayload.data.character_book.entries[0].use_regex, false)
    assert.equal(parsed.sourcePayload.data.character_book.entries[0].position, 'before_char')
  } finally {
    await ctx.fiber.dispose()
    await rm(cardRoot, { recursive: true, force: true })
    await rm(loreRoot, { recursive: true, force: true })
  }
})

test('browser import enforces the complete Base64 byte boundary', async () => {
  const imported = []
  const books = {
    config: { maxInputBytes: 3 },
    async importBytes(bytes) { imported.push([...bytes]); return { id: '00000000-0000-0000-0000-000000000001' } },
    async detail(id) { return { id } },
  }
  const exact = await dispatchBrowser(books, 'import', { name: 'book.json', mimeType: 'application/json', base64: Buffer.from('abc').toString('base64') })
  assert.deepEqual(imported[0], [97, 98, 99])
  assert.equal(exact.detail.id, '00000000-0000-0000-0000-000000000001')
  await assert.rejects(dispatchBrowser(books, 'import', { name: 'book.json', mimeType: 'application/json', base64: Buffer.from('abcd').toString('base64') }), error => error.code === 'LIMIT_EXCEEDED')
})

test('creates an empty native world book and edits it through the existing CAS boundary', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-lore-native-'))
  const ctx = new Context()
  const books = new RpLoreBooks(ctx, { libraryDir: root, maxInputBytes: 4096, maxTokens: 128, maxEntries: 16, maxRecursiveDepth: 2 })
  try {
    const result = await dispatchBrowser(books, 'create', { book: { name: '新世界', entries: [] } })
    assert.equal(result.detail.name, '新世界')
    assert.deepEqual(result.detail.entries, [])
    const entry = { id: 'harbor', name: '港口', level: 'worldDescription', keys: ['港口'], content: '港口终年有雾。' }
    const updated = await books.update(result.detail.id, { name: '新世界', entries: [entry] }, 1)
    assert.equal(updated.revision, 2)
    assert.equal(updated.entries[0].content, '港口终年有雾。')
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('persists State conditions in schema v3 and rejects them through the generic validator extension', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-lore-state-condition-'))
  const ctx = new Context()
  const books = new RpLoreBooks(ctx, { libraryDir: root, maxInputBytes: 4096, maxTokens: 128, maxEntries: 16, maxRecursiveDepth: 2 })
  books.registerEntryValidator({
    id: 'test.state',
    validate(entry) { if (entry.stateCondition?.includes('invalid')) throw new Error('invalid condition') },
  })
  try {
    const created = await books.create({ name: '条件世界书', entries: [{
      id: 'stage', name: '关系阶段', content: '关系已经改变。', constant: true,
      stateCondition: 'state("story", "/affection") > 50',
    }] })
    assert.equal(created.detail.schemaVersion, undefined)
    const stored = await books.get(created.created.id)
    assert.equal(stored.schemaVersion, 3)
    assert.equal(stored.entries[0].stateCondition, 'state("story", "/affection") > 50')
    await assert.rejects(books.update(stored.id, { entries: [{ ...stored.entries[0], stateCondition: 'invalid()' }] }, 1), error => error.code === 'INVALID_REQUEST' && /变量启用条件无效/.test(error.message))
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('mounts the browser Remote when the transport becomes available after the plugin', async () => {
  const ctx = new Context()
  assert.deepEqual(inject, [])
  const mounted = []
  apply(ctx, {
    libraryDir: '.', maxInputBytes: 1024, maxTokens: 128, maxEntries: 16,
    maxRecursiveDepth: 2, registerTool: false, exposeBrowser: true,
  })
  assert.deepEqual(mounted, [])

  ctx.provide('rpRemote', { register(path, _handler) {
    mounted.push({ path })
    return () => {}
  } })
  await new Promise(resolve => setImmediate(resolve))

  assert.deepEqual(mounted, [{ path: '/rp-lore-books' }])
  await ctx.fiber.dispose()
})

test('model import tool explains its exact path input and separate binding step', async () => {
  const ctx = new Context()
  let registered
  ctx.provide('rpCharacterCards', { async get() {} })
  ctx.provide('tools', { register(tool) { registered = tool } })
  ctx.provide('fs', {})
  apply(ctx, {
    libraryDir: '.', maxInputBytes: 1024, maxTokens: 128, maxEntries: 16,
    maxRecursiveDepth: 2, registerTool: true, exposeBrowser: false,
  })
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(registered.name, 'import_lore_book')
  assert.match(registered.description, /does not bind it to the current conversation/)
  assert.match(registered.parameters.properties.path.description, /Pass only the path string/)
  await ctx.fiber.dispose()
})

test('registers the lore context source when the runtime becomes available later', async () => {
  const ctx = new Context()
  ctx.provide('rpCharacterCards', { async get() {} })
  const sources = []
  apply(ctx, {
    libraryDir: '.', maxInputBytes: 1024, maxTokens: 128, maxEntries: 16,
    maxRecursiveDepth: 2, registerTool: false, exposeBrowser: false,
  })
  ctx.provide('rpRuntime', { registerContextSource(source) { sources.push(source); return () => {} } })
  await new Promise(resolve => setImmediate(resolve))
  assert.deepEqual(sources.map(source => source.id), [
    'rp.lore.world-description',
    'rp.lore.character-descriptions',
    'rp.lore.important-rules',
  ])
  assert.deepEqual(sources.map(source => source.order), [-60, -50, 30])
  assert.deepEqual(sources.map(source => source.budgetPriority), [-10, 10, 40])
  await ctx.fiber.dispose()
})

test('lore assembly cache is scoped by refresh epoch and evicts rejected work', async () => {
  const ctx = new Context()
  ctx.provide('rpCharacterCards', { async get() {} })
  const books = new RpLoreBooks(ctx, { libraryDir: '.', maxInputBytes: 1024, maxTokens: 128, maxEntries: 16, maxRecursiveDepth: 2 })
  let calls = 0
  books.assembleLore = async ({ contextEpoch }) => {
    calls += 1
    if (contextEpoch === 2 && calls === 3) throw new Error('transient')
    return { revision: `epoch-${contextEpoch}` }
  }
  const base = { runId: 'run-1', contextEpoch: 0 }
  const [first, duplicate] = await Promise.all([books.loreAssembly(base), books.loreAssembly(base)])
  assert.equal(first.revision, 'epoch-0')
  assert.equal(duplicate.revision, 'epoch-0')
  assert.equal(calls, 1)
  assert.equal((await books.loreAssembly({ ...base, contextEpoch: 1 })).revision, 'epoch-1')
  assert.equal(calls, 2)
  await assert.rejects(books.loreAssembly({ ...base, contextEpoch: 2 }), /transient/)
  assert.equal((await books.loreAssembly({ ...base, contextEpoch: 2 })).revision, 'epoch-2')
  assert.equal(calls, 4)
  await ctx.fiber.dispose()
})

test('two service instances sharing a library serialize duplicate imports and revision CAS', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-lore-shared-'))
  const firstCtx = new Context()
  const secondCtx = new Context()
  const config = { libraryDir: root, maxInputBytes: 4096, maxTokens: 128, maxEntries: 16, maxRecursiveDepth: 2 }
  const first = new RpLoreBooks(firstCtx, config)
  const second = new RpLoreBooks(secondCtx, config)
  const value = { name: '共享世界', entries: [{ id: 1, constant: true, content: '初始规则。' }] }
  try {
    const imports = await Promise.allSettled([first.import(value), second.import(value)])
    assert.equal(imports.filter(result => result.status === 'fulfilled').length, 1)
    assert.equal(imports.filter(result => result.status === 'rejected' && result.reason?.code === 'DUPLICATE_ASSET').length, 1)
    const imported = imports.find(result => result.status === 'fulfilled').value
    const detail = await first.detail(imported.id)
    const updates = await Promise.allSettled([
      first.update(imported.id, { name: '实例一', entries: detail.entries }, 1),
      second.update(imported.id, { name: '实例二', entries: detail.entries }, 1),
    ])
    assert.equal(updates.filter(result => result.status === 'fulfilled').length, 1)
    assert.equal(updates.filter(result => result.status === 'rejected' && result.reason?.code === 'REVISION_CONFLICT').length, 1)
    assert.equal((await first.detail(imported.id)).revision, 2)
  } finally {
    await firstCtx.fiber.dispose()
    await secondCtx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})
