import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { Context } from '@deepseek-ai/cordis'
import { DEFAULT_WRITING_STYLE, dispatchBrowser, RpWritingStyles } from '../src/index.js'

const configFor = libraryDir => ({ libraryDir, maxTextCharacters: 30000, maxStylesPerSession: 3, exposeBrowser: false })

test('seeds one default general style and preserves it across service instances', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-writing-style-default-'))
  const firstCtx = new Context()
  const secondCtx = new Context()
  const first = new RpWritingStyles(firstCtx, configFor(root))
  const second = new RpWritingStyles(secondCtx, configFor(root))
  try {
    const [seeded, same] = await Promise.all([first.ensureDefault(), second.ensureDefault()])
    assert.equal(seeded.name, DEFAULT_WRITING_STYLE.name)
    assert.equal(seeded.description, DEFAULT_WRITING_STYLE.description)
    assert.equal(seeded.isDefault, true)
    assert.match(seeded.content, /第三人称限知叙事/)
    assert.match(seeded.content, /对白使用双引号/)
    assert.match(seeded.content, /句子长短随动作速度、观察深度和情绪压力变化/)
    assert.match(seeded.content, /动作写清主体、顺序、方向、距离与可见结果/)
    assert.match(seeded.content, /不必给每句话配表情、语气标签和内心解释/)
    assert.match(seeded.content, /一种有分量的迹象通常胜过/)
    assert.match(seeded.content, /不要预设明快、甜美、幽默、抒情或沉重等固定基调/)
    assert.doesNotMatch(`${seeded.description}\n${seeded.content}`, /轻小说|Light Novel/i)
    assert.doesNotMatch(seeded.content, /结尾应停在|世界信息只在|角色拥有自己的动机|真实后果/)
    assert.equal(same.id, seeded.id)
    const listed = await first.list()
    assert.equal(listed.total, 1)
    assert.equal(listed.defaultId, seeded.id)
    assert.equal(listed.items[0].isDefault, true)
  } finally {
    await firstCtx.fiber.dispose()
    await secondCtx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('migrates the untouched previous default without overwriting later user edits', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-writing-style-migrate-'))
  const ctx = new Context()
  const styles = new RpWritingStyles(ctx, configFor(root))
  try {
    const legacy = await styles.create({
      name: '通用叙事',
      description: '清晰、贴近角色、对白有层次，具有轻小说式的可读性。',
      content: `没有其他明确要求时，采用贴近主角所见所闻的第三人称叙事。叙述范围跟随当前视角和用户明确指示，不随意跳入其他角色内心。对白使用双引号，段落自然紧凑。

## 语言与节奏

整体保持清晰、贴近角色、轻盈而有推动力的小说叙事。以日常、易读的语言和短至中等长度的句子为主，根据场景的重要性放慢或加快；不要为了轻快而把危险、悲伤或严肃的边界写得轻浮。

## 场景呈现

让叙述、动作、环境与对白共同推进场景，不要把正文写成聊天记录。优先使用直接的动词和具体细节；细节应承载情绪、线索、关系、身份、场所质感或行为后果。描写保持选择性和功能性，避免对外貌、物件或环境做清单式堆砌。

## 对白与人物

让对白承载压力、个性和潜台词。角色可以回避、打断、间接回答、误解或留下未说出口的部分；重要角色的声音应彼此可辨。轻松感可以来自时机、反差、尴尬、误解或人物性格，但不要强塞笑话、密集抖机灵或网络梗，也不要用幽默抹平真实后果。

## 情绪与信息

先通过选择、停顿、目光、距离、沉默、物件和行为变化呈现情绪与意义，再考虑是否需要直接点明。让吸引、难堪、受伤、不信任与释然通过事件逐步累积，不用套话式情绪标签替代过程。世界信息只在与当前场景相关时，通过正在发生的事情自然显露，避免成段说明。

## 修辞与避免

比喻保持简短、具体、自然；不要为普通动作强加只求深刻的华丽句子。避免重复俏皮话、为推进而制造的误会、作者说教、模板化网络表达、堆叠抽象概念、对称口号、励志总结、反复使用的修辞对照，以及解释自身意义的文字。

成稿应亲近、鲜活、流畅：有轻小说式的可读性和人物感，但不浅薄、仓促、过度活跃、甜腻、煽情或故作深沉。`,
    })
    await writeFile(join(root, '.preferences.json'), `${JSON.stringify({ version: 1, defaultWritingStyleId: legacy.id, initialized: true }, null, 2)}\n`)

    const migrated = await styles.ensureDefault()
    assert.equal(migrated.id, legacy.id)
    assert.equal(migrated.revision, 2)
    assert.equal(migrated.description, DEFAULT_WRITING_STYLE.description)
    assert.equal(migrated.content, DEFAULT_WRITING_STYLE.content)

    const customized = await styles.update(migrated.id, { name: '通用叙事', description: '用户已调整', content: '保留用户自己的文风要求。' }, migrated.revision)
    const kept = await styles.ensureDefault()
    assert.equal(kept.id, customized.id)
    assert.equal(kept.revision, customized.revision)
    assert.equal(kept.content, '保留用户自己的文风要求。')
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('continues to migrate the first untouched managed default', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-writing-style-first-migrate-'))
  const ctx = new Context()
  const styles = new RpWritingStyles(ctx, configFor(root))
  try {
    const legacy = await styles.create({
      name: '通用叙事',
      description: '贴近角色视角、对白清晰，适合多数互动故事。',
      content: `没有其他明确要求时，采用贴近主角所见所闻的第三人称叙事。

对白使用双引号，段落保持自然。使用能够承载情绪、线索、关系或场所质感的具体细节推进场景。`,
    })
    await writeFile(join(root, '.preferences.json'), `${JSON.stringify({ version: 1, defaultWritingStyleId: legacy.id, initialized: true }, null, 2)}\n`)

    const migrated = await styles.ensureDefault()
    assert.equal(migrated.id, legacy.id)
    assert.equal(migrated.revision, 2)
    assert.equal(migrated.content, DEFAULT_WRITING_STYLE.content)
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('adds the initial style once to an existing library and does not recreate it after deletion', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-writing-style-existing-'))
  const ctx = new Context()
  const styles = new RpWritingStyles(ctx, configFor(root))
  try {
    const custom = await styles.create({ name: '已有文风', content: '保留已有写法。' })
    const seeded = await styles.ensureDefault()
    assert.equal(seeded.name, DEFAULT_WRITING_STYLE.name)
    assert.notEqual(seeded.id, custom.id)
    assert.equal((await styles.list()).total, 2)
    assert.equal((await styles.ensureDefault()).id, seeded.id)
    await styles.delete(seeded.id, seeded.revision)
    const remaining = await styles.ensureDefault()
    assert.equal(remaining.id, custom.id)
    assert.equal((await styles.list()).total, 1)
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('creates, updates and lists reusable writing styles', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-writing-style-'))
  const ctx = new Context()
  const styles = new RpWritingStyles(ctx, configFor(root))
  try {
    const created = await styles.create({ name: '电影感', description: '悬疑场景', content: '使用克制的近景描写。' })
    const stored = await styles.get(created.id)
    assert.equal(stored.content, '使用克制的近景描写。')
    const updated = await styles.update(created.id, { name: '电影感', description: '悬疑与动作场景', content: '使用近景描写，减少解释。' }, stored.revision)
    assert.equal(updated.revision, 2)
    assert.deepEqual((await styles.list()).items.map(item => item.name), ['电影感'])
    await assert.rejects(styles.update(created.id, { name: '冲突', content: '内容' }, 1), error => error.code === 'REVISION_CONFLICT')
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('deletes a writing style through the service and browser RPC', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-writing-style-delete-'))
  const ctx = new Context()
  const styles = new RpWritingStyles(ctx, configFor(root))
  try {
    const direct = await styles.create({ name: '待删除', content: '这项内容将被删除。' })
    assert.deepEqual(await styles.delete(direct.id, direct.revision), { id: direct.id })
    await assert.rejects(styles.get(direct.id), error => error.code === 'ASSET_NOT_FOUND')

    const throughRpc = await styles.create({ name: '通过接口删除', content: '确认后删除。' })
    const updated = await styles.update(throughRpc.id, { name: '通过接口删除', content: '内容刚刚更新。' }, throughRpc.revision)
    await assert.rejects(dispatchBrowser(styles, 'delete', { id: throughRpc.id, expectedRevision: throughRpc.revision }), error => error.code === 'REVISION_CONFLICT')
    assert.deepEqual(await dispatchBrowser(styles, 'delete', { id: throughRpc.id, expectedRevision: updated.revision }), { id: throughRpc.id })
    assert.equal((await styles.list()).total, 0)
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('expands selected live styles in Session order into independently movable prompt sources', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-writing-style-source-'))
  const ctx = new Context()
  let source
  let bindings = []
  ctx.provide('rpRuntime', { registerContextSource(value) { source = value; return () => {} } })
  ctx.provide('rpSessions', { get() { return { resources: { writingStyles: bindings } } } })
  const styles = new RpWritingStyles(ctx, configFor(root))
  try {
    const first = await styles.create({ name: '冷峻', description: '适合悬疑场景。', content: '短句，少解释。' })
    const second = await styles.create({ name: '诗性', description: '适合抒情场景。', content: '使用具象意象。' })
    bindings = [{ id: second.id }, { id: first.id }]
    const value = await source.prepare({ agent: {} })
    assert.deepEqual(value.sources.map(item => item.label), ['诗性', '冷峻'])
    assert.deepEqual(value.sources.map(item => item.text), ['使用具象意象。', '短句，少解释。'])
    assert.deepEqual(value.sources.map(item => item.id), [`rp.writing-style:${second.id}`, `rp.writing-style:${first.id}`])
    assert.deepEqual(value.sources.map(item => item.defaultSlot.id), value.sources.map(item => item.id))
    assert.deepEqual(value.sources.map(item => item.defaultSlot.label), ['诗性', '冷峻'])
    assert.deepEqual(value.sources.map(item => item.defaultSlot.order), [20, 20.001])
    assert.deepEqual(value.sources.map(item => item.diagnostics.selectionOrder), [1, 2])
    assert.ok(value.sources.every(item => !/适合悬疑场景|适合抒情场景|revision|position|count/.test(item.text)))
    assert.equal(source.defaultSlot.locked, undefined)
    assert.equal(source.id, 'rp.writing-style')
    assert.deepEqual(source.defaultSlot, { id: 'writing-style', label: '文风', order: 20 })
    assert.deepEqual(source.legacySlotIds, ['writing-style', 'prompt-bottom'])
    assert.deepEqual(source.legacySourceIds, ['rp.writing-style'])
    assert.equal(source.order, 20)
    assert.deepEqual(await styles.resolveBindings([first.id, second.id]), [{ id: first.id }, { id: second.id }])
    await assert.rejects(styles.resolveBindings([first.id, first.id]), error => error.code === 'INVALID_REQUEST')
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('enforces complete text and per-session selection limits', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-writing-style-limit-'))
  const ctx = new Context()
  const styles = new RpWritingStyles(ctx, { libraryDir: root, maxTextCharacters: 8, maxStylesPerSession: 1, exposeBrowser: false })
  try {
    const exact = await styles.create({ name: '甲', content: '1234567' })
    await assert.rejects(styles.create({ name: '甲', content: '12345678' }), error => error.code === 'LIMIT_EXCEEDED')
    await assert.rejects(styles.resolveBindings([exact.id, '00000000-0000-0000-0000-000000000001']), error => error.code === 'LIMIT_EXCEEDED')
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('browser entry provides creation, editing and reduced-motion behavior', async () => {
  const client = await readFile(new URL('../src/client.js', import.meta.url), 'utf8')
  const styles = await readFile(new URL('../src/client.module.css', import.meta.url), 'utf8')
  assert.match(client, /'aria-label': '文风'/)
  assert.match(client, /'创建你的第一种文风'/)
  assert.match(client, /'新建文风'/)
  assert.match(client, /reducedMotion: 'user'/)
  assert.match(client, /rp-assets\.writing-style-entry/)
  assert.match(client, /className: css\.listToolbar/)
  assert.match(client, /className: compact \? `\$\{css\.dialog\} \$\{css\.compactDialog\}`/)
  assert.match(styles, /\.content>:last-child\{flex:1;min-width:0;min-height:0;overflow:hidden;/)
  assert.match(styles, /\.empty,\.state\{[^}]*height:100%;[^}]*flex:1;[^}]*justify-content:center;/)
  assert.match(styles, /\.list\{width:min\(680px,100%\);gap:6px;/)
  assert.match(styles, /\.row\{grid-template-columns:36px minmax\(0,1fr\) auto;gap:10px;min-height:60px;/)
  assert.match(styles, /\.compactDialog\{width:min\(760px,calc\(100vw - 48px\)\);height:min\(520px,/)
  assert.match(client, /export const inject = \['slots', 'connection', 'rpAssetEditors'\]/)
  assert.match(client, /ctx\.rpAssetEditors\.register\('writingStyle', WritingStyleSessionEditor\)/)
  assert.match(client, /function WritingStyleSessionEditor/)
  assert.match(client, /h\(WritingStyleEditor/)
  assert.match(client, /'删除文风'/)
  assert.match(client, /function WritingStyleRow/)
  assert.match(client, /h\(Menu, \{/)
  assert.match(client, /\{ id: 'delete', label: '删除文风', danger: true \}/)
  assert.match(client, /IconEllipsisOutline16/)
  assert.match(client, /IconTrashOutline16/)
  assert.match(client, /function DeleteWritingStyleDialog/)
  assert.match(client, /rpc\(connection, 'delete', \{ id: target\.id, expectedRevision: target\.revision \}\)/)
  assert.match(client, /仍在使用它的对话可能无法继续生成回复/)
  assert.match(client, /onDelete: draft\.id === null \? undefined/)
  assert.match(client, /function WritingStyleEditor\(\{ draft, onDraft, onBack, onSave, onDelete/)
  assert.match(styles, /\.rowWrap\{display:grid;grid-template-columns:minmax\(0,1fr\) 36px;/)
  assert.match(styles, /\.moreAction\{display:inline-flex;width:32px;height:32px;/)
  assert.match(styles, /\.deleteDialog\{width:min\(460px,/)
  assert.match(styles, /\.deleteSummary\{display:flex;flex-direction:column;/)
})
