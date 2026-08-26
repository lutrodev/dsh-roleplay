import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { Context } from '@deepseek-ai/cordis'
import sharp from 'sharp'
import { DEFAULT_PERSONA, RpPersonas, apply, dispatchBrowser } from '../src/index.js'

const CONFIG = {
  maxTextCharacters: 1000,
  maxAvatarInputBytes: 5 * 1024 * 1024,
  maxAvatarPixels: 16 * 1024 * 1024,
  avatarMaxEdgePixels: 512,
  avatarWebpQuality: 85,
}
const configFor = (libraryDir, overrides = {}) => ({ libraryDir, ...CONFIG, ...overrides })

test('creates personas and makes the first one default', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-persona-'))
  const ctx = new Context()
  const personas = new RpPersonas(ctx, configFor(root))
  try {
    const first = await personas.create({ name: '林澈', description: '旅行中的旧书修复师。' })
    const second = await personas.create({ name: '阿月' })
    const page = await personas.list({ limit: 10 })
    assert.equal(page.total, 2)
    assert.equal(page.defaultId, first.id)
    assert.equal(page.items.find(item => item.id === first.id)?.isDefault, true)
    assert.equal(page.items.find(item => item.id === second.id)?.description, '')
    const detail = await personas.detail(first.id)
    assert.equal(detail.description, '旅行中的旧书修复师。')
    assert.equal(detail.isDefault, true)
    assert.equal(detail.hasAvatar, false)
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('seeds one neutral default persona and does not duplicate it', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-persona-seed-'))
  const firstCtx = new Context()
  const secondCtx = new Context()
  const first = new RpPersonas(firstCtx, configFor(root))
  const second = new RpPersonas(secondCtx, configFor(root))
  try {
    const seeded = await first.ensureDefault()
    assert.equal(seeded.name, DEFAULT_PERSONA.name)
    assert.equal(seeded.description, DEFAULT_PERSONA.description)
    assert.equal(seeded.isDefault, true)
    assert.equal((await second.ensureDefault()).id, seeded.id)
    assert.equal((await first.list({ limit: 10 })).total, 1)
  } finally {
    await firstCtx.fiber.dispose()
    await secondCtx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('updates personas with revision CAS and exposes the latest content', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-persona-update-'))
  const ctx = new Context()
  const personas = new RpPersonas(ctx, configFor(root))
  try {
    const created = await personas.create({ name: '林澈', description: '旧描述' })
    const updated = await personas.update(created.id, { name: '林澈', description: '新描述' }, created.revision)
    assert.equal(updated.revision, 2)
    assert.equal((await personas.detail(created.id)).description, '新描述')
    await assert.rejects(personas.update(created.id, { name: '林澈', description: '过期修改' }, created.revision), error => error.code === 'REVISION_CONFLICT')
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('registers the selected live persona as user-controlled prompt context', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-persona-source-'))
  const ctx = new Context()
  let source
  let selectedId
  ctx.provide('rpRuntime', { registerContextSource(value) { source = value; return () => {} } })
  ctx.provide('rpSessions', { get() { return { resources: { persona: { id: selectedId } } } } })
  const personas = new RpPersonas(ctx, configFor(root))
  try {
    const created = await personas.create({ name: '林澈', description: '旧书修复师', personality: '谨慎而好奇', tags: ['资料库标签'] })
    selectedId = created.id
    const value = await source.prepare({ agent: {} })
    assert.match(value.text, /旧书修复师/)
    assert.doesNotMatch(value.text, /This persona is controlled|Never invent|资料库标签|revision|rp_persona/)
    assert.equal(value.revision, `${created.id}:1`)
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('persists an explicitly selected default across service instances', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-persona-default-'))
  const firstCtx = new Context()
  const secondCtx = new Context()
  const config = configFor(root)
  const first = new RpPersonas(firstCtx, config)
  const second = new RpPersonas(secondCtx, config)
  try {
    const alpha = await first.create({ name: '甲' })
    const beta = await first.create({ name: '乙' })
    await second.setDefault(beta.id)
    assert.equal((await first.list({ limit: 10 })).defaultId, beta.id)
    assert.equal((await second.detail(alpha.id)).isDefault, false)
    const preferences = JSON.parse(await readFile(join(root, '.preferences.json'), 'utf8'))
    assert.deepEqual(preferences, { version: 1, defaultPersonaId: beta.id })
  } finally {
    await firstCtx.fiber.dispose()
    await secondCtx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('deletes personas through revision CAS and promotes another default', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-persona-delete-'))
  const ctx = new Context()
  const personas = new RpPersonas(ctx, configFor(root))
  try {
    const first = await personas.create({ name: '待删除默认人设' })
    const second = await personas.create({ name: '保留人设' })
    const updated = await personas.update(first.id, { name: '待删除默认人设', description: '刚刚更新' }, first.revision)

    await assert.rejects(dispatchBrowser(personas, 'delete', { id: first.id, expectedRevision: first.revision }), error => error.code === 'REVISION_CONFLICT')
    assert.deepEqual(await dispatchBrowser(personas, 'delete', { id: first.id, expectedRevision: updated.revision }), { id: first.id })
    const afterDefaultDelete = await personas.list({ limit: 10 })
    assert.equal(afterDefaultDelete.total, 1)
    assert.equal(afterDefaultDelete.defaultId, second.id)
    assert.equal(afterDefaultDelete.items[0].isDefault, true)

    assert.deepEqual(await personas.delete(second.id, second.revision), { id: second.id })
    assert.deepEqual(await personas.list({ limit: 10 }), {
      items: [], defaultId: null, nextCursor: null, total: 0, limits: { maxAvatarInputBytes: CONFIG.maxAvatarInputBytes },
    })
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('browser RPC creates and selects a default without exposing import', async () => {
  const created = []
  const personas = {
    config: CONFIG,
    async create(persona, options) { created.push({ persona, options }); return { id: '00000000-0000-0000-0000-000000000001' } },
    async detail(id) { return { id, isDefault: true } },
    async setDefault(id) { return { id, isDefault: true } },
  }
  const value = await dispatchBrowser(personas, 'create', { persona: { name: '我', description: '' }, makeDefault: true, avatar: { name: 'me.png', mimeType: 'image/png', base64: 'AQID' } })
  assert.deepEqual(created, [{ persona: { name: '我', description: '' }, options: { makeDefault: true, avatar: { name: 'me.png', mimeType: 'image/png', bytes: Buffer.from([1, 2, 3]) } } }])
  assert.equal(value.detail.isDefault, true)
  await assert.rejects(dispatchBrowser(personas, 'create', { persona: { name: '我' }, makeDefault: 'yes' }), error => error.code === 'INVALID_REQUEST')
  await assert.rejects(dispatchBrowser(personas, 'import', {}), error => error.code === 'INVALID_REQUEST')
})

test('browser RPC updates an existing persona and returns editable detail', async () => {
  const id = '00000000-0000-0000-0000-000000000001'
  const calls = []
  const personas = {
    config: CONFIG,
    async update(valueId, persona, expectedRevision, options) { calls.push({ valueId, persona, expectedRevision, options }); return { id: valueId, revision: expectedRevision + 1 } },
    async detail(valueId) { return { id: valueId, revision: 2, name: '我', description: '更新后', isDefault: false } },
  }
  const value = await dispatchBrowser(personas, 'update', { id, expectedRevision: 1, persona: { name: '我', description: '更新后' } })
  assert.deepEqual(calls, [{ valueId: id, persona: { name: '我', description: '更新后' }, expectedRevision: 1, options: { avatar: undefined } }])
  assert.equal(value.detail.description, '更新后')
})

test('rejects invalid and over-limit persona content at the complete limit', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-persona-limit-'))
  const ctx = new Context()
  const personas = new RpPersonas(ctx, configFor(root, { maxTextCharacters: 4 }))
  try {
    await personas.create({ name: '我', description: '123' })
    await assert.rejects(personas.create({ name: '我', description: '1234' }), error => error.code === 'LIMIT_EXCEEDED')
    await assert.rejects(personas.create({ name: '' }), error => error.code === 'INVALID_REQUEST')
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('browser RPC registration is disposed with the plugin fiber', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-persona-rpc-'))
  const ctx = new Context()
  let handler
  let disposed = false
  ctx.provide('connection', { rpc: { handle(path, next, options) { assert.equal(path, '/rp-personas'); assert.deepEqual(options, { authority: 'trusted-host' }); handler = next; return () => { disposed = true } } } })
  try {
    await apply(ctx, configFor(root))
    const response = await handler('list', { limit: 10 })
    assert.equal(response.ok, true)
    assert.equal(response.value.ok, true)
    assert.equal(response.value.value.total, 1)
    assert.equal(response.value.value.items[0].name, DEFAULT_PERSONA.name)
    assert.equal(response.value.value.items[0].isDefault, true)
    assert.equal(response.value.value.defaultId, response.value.value.items[0].id)
    const rejected = await handler('import', {})
    assert.equal(rejected.value.error.code, 'INVALID_REQUEST')
    await ctx.fiber.dispose()
    assert.equal(disposed, true)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('two service instances serialize concurrent creation and choose one valid default', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-persona-shared-'))
  const firstCtx = new Context()
  const secondCtx = new Context()
  const config = configFor(root)
  const first = new RpPersonas(firstCtx, config)
  const second = new RpPersonas(secondCtx, config)
  try {
    const created = await Promise.all([first.create({ name: '甲' }), second.create({ name: '乙' })])
    const page = await first.list({ limit: 10 })
    assert.equal(page.total, 2)
    assert.ok(created.some(item => item.id === page.defaultId))
    assert.equal(page.items.filter(item => item.isDefault).length, 1)
  } finally {
    await firstCtx.fiber.dispose()
    await secondCtx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('sanitizes avatar metadata, resizes it, and stores it atomically with the persona', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-persona-avatar-'))
  const ctx = new Context()
  const personas = new RpPersonas(ctx, configFor(root, { avatarMaxEdgePixels: 32 }))
  try {
    const input = await sharp({ create: { width: 80, height: 40, channels: 3, background: '#4f74bd' } })
      .withMetadata({ exif: { IFD0: { Artist: 'private profile' } } })
      .png()
      .toBuffer()
    const created = await personas.create({ name: '有头像的人设' }, { avatar: { mimeType: 'image/png', bytes: input } })
    assert.equal(created.hasAvatar, true)
    assert.equal((await stat(join(root, created.id))).isDirectory(), true)
    const stored = JSON.parse(await readFile(join(root, created.id, 'persona.json'), 'utf8'))
    assert.deepEqual(stored.avatar, { file: 'avatar.webp', mimeType: 'image/webp', width: 32, height: 16 })
    const avatar = await personas.avatar(created.id)
    const metadata = await sharp(avatar.bytes).metadata()
    assert.equal(avatar.mimeType, 'image/webp')
    assert.equal(metadata.format, 'webp')
    assert.equal(metadata.width, 32)
    assert.equal(metadata.height, 16)
    assert.equal(metadata.exif, undefined)
    assert.equal(metadata.xmp, undefined)
    assert.equal(metadata.icc, undefined)
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('enforces complete avatar byte and pixel limits at the exact boundary', async () => {
  const fake = {
    config: { ...CONFIG, maxAvatarInputBytes: 3 },
    async create(persona, options) { return { id: '00000000-0000-0000-0000-000000000001', ...persona, hasAvatar: options.avatar !== undefined } },
    async detail(id) { return { id } },
  }
  await dispatchBrowser(fake, 'create', { persona: { name: '我' }, avatar: { name: 'me.webp', mimeType: 'image/webp', base64: Buffer.from([1, 2, 3]).toString('base64') } })
  await assert.rejects(dispatchBrowser(fake, 'create', { persona: { name: '我' }, avatar: { name: 'me.webp', mimeType: 'image/webp', base64: Buffer.from([1, 2, 3, 4]).toString('base64') } }), error => error.code === 'LIMIT_EXCEEDED')

  const root = await mkdtemp(join(tmpdir(), 'rp-persona-pixels-'))
  const ctx = new Context()
  const personas = new RpPersonas(ctx, configFor(root, { maxAvatarPixels: 16 }))
  try {
    const exact = await sharp({ create: { width: 4, height: 4, channels: 3, background: '#222222' } }).png().toBuffer()
    const over = await sharp({ create: { width: 5, height: 4, channels: 3, background: '#222222' } }).png().toBuffer()
    await personas.create({ name: '刚好' }, { avatar: { mimeType: 'image/png', bytes: exact } })
    await assert.rejects(personas.create({ name: '超出' }, { avatar: { mimeType: 'image/png', bytes: over } }), error => error.code === 'LIMIT_EXCEEDED')
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('rejects invalid avatar data and mismatched formats', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-persona-invalid-avatar-'))
  const ctx = new Context()
  const personas = new RpPersonas(ctx, configFor(root))
  try {
    await assert.rejects(personas.create({ name: '坏图片' }, { avatar: { mimeType: 'image/png', bytes: Buffer.from('not an image') } }), error => error.code === 'INVALID_IMAGE')
    const jpeg = await sharp({ create: { width: 2, height: 2, channels: 3, background: '#eeeeee' } }).jpeg().toBuffer()
    await assert.rejects(personas.create({ name: '格式不符' }, { avatar: { mimeType: 'image/png', bytes: jpeg } }), error => error.code === 'UNSUPPORTED_FORMAT')
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})
