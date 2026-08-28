import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { Context } from '@deepseek-ai/cordis'
import { apply, PRESET_TEMPLATES, RpPresets, dispatchBrowser } from '../src/index.js'

const configFor = libraryDir => ({ libraryDir, maxTextCharacters: 100000, maxFields: 32, exposeBrowser: false })

test('creates a truly blank preset or copies the example preset', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-preset-'))
  const ctx = new Context()
  const presets = new RpPresets(ctx, configFor(root))
  try {
    const blank = await presets.create({ name: '空白预设' })
    assert.deepEqual((await presets.get(blank.id)).fields, [])

    const created = await presets.create(PRESET_TEMPLATES[0].preset)
    const initial = await presets.get(created.id)
    assert.deepEqual(initial.fields.map(field => [field.name, field.position]), [
      ['声明', 'top'], ['任务描述', 'top'], ['写作指导', 'top'], ['思维链指导', 'bottom'], ['格式要求', 'bottom'],
    ])
    assert.ok(initial.fields.every(field => field.content.length > 0))
    assert.equal(PRESET_TEMPLATES[0].name, '示例预设')
    assert.equal(PRESET_TEMPLATES[0].description, '')
    assert.equal('source' in PRESET_TEMPLATES[0], false)
    const taskDescription = initial.fields.find(field => field.name === '任务描述').content
    for (const heading of ['## 用户', '## 主角', '## 其他角色', '## 任务']) assert.match(taskDescription, new RegExp(heading))
    assert.match(taskDescription, /用户提供最新输入/)
    assert.match(taskDescription, /可以在故事中扮演主角，也可以从故事外导演/)
    assert.match(taskDescription, /主角是故事当前聚焦的核心角色/)
    assert.match(taskDescription, /用户代入主角时/)
    assert.match(taskDescription, /用户从故事外导演时/)
    assert.match(taskDescription, /没有被用户当前输入直接扮演或导演的角色由你表现/)
    assert.match(taskDescription, /写出故事接下来鲜活发生的一段/)
    assert.doesNotMatch(taskDescription, /询问故事中的事物|不回答关于故事的问题|只输出故事本身/)
    assert.doesNotMatch(taskDescription, /「我的人设」|「角色卡」|「世界设定」|「扮演指导」|「重要规则」|「会话变量」|「对话历史」|「当前输入」/)
    const writingGuidance = initial.fields.find(field => field.name === '写作指导').content
    assert.match(writingGuidance, /其他角色拥有自己的动机、知识、局限、偏见/)
    assert.match(writingGuidance, /守住任务描述中的主角控制边界/)
    assert.match(writingGuidance, /人物变化应来自累积的经历和当下压力，而不是为了配合剧情突然转向/)
    assert.match(writingGuidance, /不要因为一个角色富有魅力、地位强大、与主角关系亲密或拥有可以理解的动机/)
    assert.match(writingGuidance, /不能抹掉行为的性质、受害者的体验和已经造成的后果/)
    assert.match(writingGuidance, /也不必安排恶人立刻受罚/)
    assert.match(writingGuidance, /在场景仍有行动惯性、用户能够自然介入的位置结束/)
    assert.match(writingGuidance, /不写尽余波，不预设用户行动，不擅自跳转时间或场景/)
    assert.match(writingGuidance, /避免作者式总结、意义升华及近期结尾的机械重复/)
    assert.match(writingGuidance, /情绪和主题留在人物行为与后果中/)
    assert.match(writingGuidance, /保持因果连续，也要为用户保留多种合理回应空间/)
    assert.match(writingGuidance, /围着主角旋转、只负责提供情绪服务/)
    assert.doesNotMatch(writingGuidance, /第三人称叙事|对白使用双引号|先让意义通过对白|成段倾倒设定|套话式情绪标签|模板化网络表达/)
    const chainOfThought = initial.fields.find(field => field.name === '思维链指导').content
    assert.match(chainOfThought, /任务描述中的主角控制边界/)
    assert.match(chainOfThought, /对照当前可见对话历史中的近期结尾/)
    assert.doesNotMatch(chainOfThought, /\d+\s*字|字数|输出空间|输出预算/)
    const outputRequirements = initial.fields.find(field => field.name === '格式要求').content
    assert.match(outputRequirements, /输出故事正文/)
    assert.match(outputRequirements, /不要输出状态、规划、分析或创作说明/)
    assert.doesNotMatch(outputRequirements, /状态栏|变量更新|结构化内容/)
    const moved = [initial.fields[2], initial.fields[0], initial.fields[1], initial.fields[4], initial.fields[3]]
      .map((field, index) => ({ ...field, content: index === 0 ? '使用近景。' : field.content }))
    const updated = await presets.update(created.id, { name: initial.name, description: '', fields: moved }, initial.revision)
    assert.deepEqual(updated.fields.map(field => field.name), ['写作指导', '声明', '任务描述', '格式要求', '思维链指导'])
    await assert.rejects(presets.update(created.id, { name: '冲突', fields: moved }, 1), error => error.code === 'REVISION_CONFLICT')
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('seeds one template-based default and preserves an explicit default across service instances', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-preset-default-'))
  const firstCtx = new Context()
  const secondCtx = new Context()
  const first = new RpPresets(firstCtx, configFor(root))
  const second = new RpPresets(secondCtx, configFor(root))
  try {
    const seeded = await first.ensureDefault()
    assert.equal(seeded.name, PRESET_TEMPLATES[0].preset.name)
    assert.equal(seeded.isDefault, true)
    assert.equal((await second.ensureDefault()).id, seeded.id)
    assert.equal((await first.list({ limit: 10 })).total, 1)

    const blank = await second.create({ name: '我的空白预设' }, { makeDefault: true })
    assert.equal((await first.list({ limit: 10 })).defaultId, blank.id)
    assert.deepEqual(JSON.parse(await readFile(join(root, '.preferences.json'), 'utf8')), { version: 1, defaultPresetId: blank.id })
  } finally {
    await firstCtx.fiber.dispose()
    await secondCtx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('browser Remote returns detached templates and can create or select a default preset', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-preset-browser-'))
  const ctx = new Context()
  const presets = new RpPresets(ctx, configFor(root))
  try {
    const templates = await dispatchBrowser(presets, 'templates', {})
    templates.items[0].preset.fields[0].content = '被调用方修改'
    assert.notEqual(PRESET_TEMPLATES[0].preset.fields[0].content, '被调用方修改')

    const first = await dispatchBrowser(presets, 'create', { preset: { name: '空白甲' } })
    const second = await dispatchBrowser(presets, 'create', { preset: { name: '空白乙' }, makeDefault: true })
    assert.deepEqual(first.detail.fields, [])
    assert.equal(second.detail.isDefault, true)
    assert.equal((await dispatchBrowser(presets, 'set-default', { id: first.created.id })).isDefault, true)
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('deletes presets through revision CAS and promotes another default', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-preset-delete-'))
  const ctx = new Context()
  const presets = new RpPresets(ctx, configFor(root))
  try {
    const first = await presets.create({ name: '待删除默认预设' })
    const second = await presets.create({ name: '保留预设' })
    assert.equal((await presets.list({ limit: 10 })).defaultId, first.id)

    assert.deepEqual(await dispatchBrowser(presets, 'delete', { id: first.id, expectedRevision: first.revision }), { id: first.id })
    const afterFirstDelete = await presets.list({ limit: 10 })
    assert.equal(afterFirstDelete.total, 1)
    assert.equal(afterFirstDelete.defaultId, second.id)
    assert.equal(afterFirstDelete.items[0].isDefault, true)

    const updated = await presets.update(second.id, { name: '保留预设（已更新）' }, second.revision)
    await assert.rejects(dispatchBrowser(presets, 'delete', { id: second.id, expectedRevision: second.revision }), error => error.code === 'REVISION_CONFLICT')
    await dispatchBrowser(presets, 'delete', { id: second.id, expectedRevision: updated.revision })
    assert.deepEqual(await presets.list({ limit: 10 }), { items: [], defaultId: null, nextCursor: null, total: 0 })
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('registers every non-empty field as an independently movable prompt slot', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-preset-source-'))
  const ctx = new Context()
  let source
  ctx.provide('rpRuntime', { registerContextSource(value) { source = value; return () => {} } })
  ctx.provide('rpSessions', { get() { return { resources: { preset: { id: selected.id } } } } })
  const presets = new RpPresets(ctx, configFor(root))
  let selected
  try {
    selected = await presets.create({ name: '测试', description: '仅供资料库展示的预设说明。', fields: [
      { name: '镜头调度', description: '顶部第一项', content: '使用近景。', position: 'top' },
      { name: '段落收束', description: '底部第一项', content: '两段。', position: 'bottom' },
      { name: '连续性自检', description: '底部第二项', content: '检查连续性。', position: 'bottom' },
      { name: '长'.repeat(120), description: '说明'.repeat(500), content: '保留完整正文。', position: 'top' },
    ] })
    const value = await source.prepare({ agent: {} })
    assert.equal(value.sources.length, 4)
    assert.deepEqual(value.sources.map(item => item.diagnostics.position), ['top', 'top', 'bottom', 'bottom'])
    assert.deepEqual(value.sources.filter(item => [...item.label].length < 80).map(item => item.label), ['镜头调度', '段落收束', '连续性自检'])
    assert.deepEqual(value.sources.map(item => item.defaultSlot.id), value.sources.map(item => item.id))
    assert.deepEqual(value.sources.map(item => item.defaultSlot.label), value.sources.map(item => item.label))
    assert.deepEqual(value.sources.map(item => item.diagnostics.positionOrder), [1, 2, 1, 2])
    assert.ok(value.sources.every(item => item.id.startsWith('rp.preset:')))
    assert.equal(new Set(value.sources.map(item => item.defaultSlot.id)).size, 4)
    assert.equal([...value.sources[1].label].length, 80)
    assert.ok([...value.sources[1].description].length <= 240)
    assert.match(value.sources[1].text, /保留完整正文。/)
    assert.match(value.sources[0].text, /使用近景。/)
    assert.doesNotMatch(value.sources[0].text, /两段。/)
    assert.doesNotMatch(value.sources[0].text, /顶部第一项|仅供资料库展示的预设说明/)
    assert.equal(value.sources[0].description, '顶部第一项')
    assert.equal(value.sources[2].description, '底部第一项')
    assert.doesNotMatch(value.sources[0].description, /仅供资料库展示的预设说明/)
    assert.equal(value.sources[0].text, '使用近景。')
    assert.doesNotMatch(value.sources[0].text, /position|revision|preset|镜头调度/)
    assert.ok(value.sources[0].order < value.sources[2].order)
    assert.equal(value.sources[0].revision, `${selected.id}:1:${(await presets.get(selected.id)).fields[0].id}`)
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('enforces complete preset field and text limits', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-preset-limit-'))
  const ctx = new Context()
  const presets = new RpPresets(ctx, { libraryDir: root, maxTextCharacters: 8, maxFields: 2, exposeBrowser: false })
  try {
    await presets.create({ name: '甲', description: '', fields: [{ name: '乙', description: '', content: '123456', position: 'top' }] })
    await assert.rejects(presets.create({ name: '甲', fields: [{ name: '乙', content: '1234567', position: 'top' }] }), error => error.code === 'LIMIT_EXCEEDED')
    await assert.rejects(presets.create({ name: '甲', fields: [{ name: '一', position: 'top' }, { name: '二', position: 'top' }, { name: '三', position: 'bottom' }] }), error => error.code === 'INVALID_REQUEST')
    await assert.rejects(presets.create({ name: '甲', fields: [{ name: '乙', position: 'middle' }] }), error => error.code === 'INVALID_REQUEST')
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('initialization can be disposed without registering effects on an inactive context', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-preset-lifecycle-'))
  const ctx = new Context()
  const gate = Promise.withResolvers()
  const started = Promise.withResolvers()
  const registered = Promise.withResolvers()
  const originalEnsureDefault = RpPresets.prototype.ensureDefault
  let handler
  let disposed = false
  let fiber
  RpPresets.prototype.ensureDefault = async function () {
    started.resolve()
    await gate.promise
    return originalEnsureDefault.call(this)
  }
  ctx.provide('rpRemote', {
      register(path, next) {
        assert.equal(path, '/rp-presets')
        handler = next
        registered.resolve()
        return () => { disposed = true }
      },
  })
  try {
    fiber = ctx.plugin({ name: 'rp-preset-lifecycle-test', apply }, { ...configFor(root), exposeBrowser: true })
    await Promise.all([started.promise, registered.promise])
    let requestSettled = false
    const request = handler('templates', {}).then(value => {
      requestSettled = true
      return value
    })
    await Promise.resolve()
    assert.equal(requestSettled, false, 'RPC must wait for preset initialization')

    const disposal = fiber.dispose()
    gate.resolve()
    const response = await request
    assert.equal(response.value.value.items.length, PRESET_TEMPLATES.length)
    await disposal
    await fiber.await()
    assert.equal(disposed, true)
  } finally {
    RpPresets.prototype.ensureDefault = originalEnsureDefault
    gate.resolve()
    if (fiber?.uid !== null) await fiber.dispose()
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('loads stored presets created before field positions were introduced', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-preset-legacy-'))
  const ctx = new Context()
  const presets = new RpPresets(ctx, configFor(root))
  const id = '00000000-0000-0000-0000-000000000123'
  try {
    await writeFile(join(root, `${id}.json`), `${JSON.stringify({
      id, revision: 1, name: '旧预设', description: '',
      fields: [
        { id: '00000000-0000-0000-0000-000000000124', name: '写作指定', description: '', content: '近景。' },
        { id: '00000000-0000-0000-0000-000000000125', name: '格式要求', description: '', content: '两段。' },
      ],
      createdAt: '2026-08-18T00:00:00.000Z', updatedAt: '2026-08-18T00:00:00.000Z',
    })}\n`)
    assert.deepEqual((await presets.get(id)).fields.map(field => field.position), ['top', 'bottom'])
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('resolves a Session binding without inspecting preset fields', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-preset-binding-'))
  const ctx = new Context()
  const presets = new RpPresets(ctx, configFor(root))
  const id = '00000000-0000-0000-0000-000000000126'
  try {
    await writeFile(join(root, `${id}.json`), '{"fields":"not-read-during-binding"}\n')
    assert.deepEqual(await presets.resolveBinding(id), { id })
    await assert.rejects(presets.get(id), error => error.code === 'ASSET_CORRUPT')
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('preset editor offers templates or a blank draft without client-side fixed fields', async () => {
  const client = await readFile(new URL('../src/client.js', import.meta.url), 'utf8')
  const styles = await readFile(new URL('../src/client.module.css', import.meta.url), 'utf8')
  for (const label of ['声明', '任务描述', '写作指导', '思维链指导', '格式要求']) assert.doesNotMatch(client, new RegExp(label))
  assert.doesNotMatch(client, /DEFAULT_FIELDS/)
  assert.match(client, /rpc\(connection, 'templates', \{\}\)/)
  assert.match(client, /function PresetCreateChooser/)
  assert.match(client, /'空白预设'/)
  assert.doesNotMatch(client, /h\('small', null, template\.description\)/)
  assert.match(client, /fields: \(preset\?\.fields \?\? \[\]\)/)
  assert.match(client, /id: 'set-default', label: '设为默认'/)
  assert.match(client, /\{ id: 'delete', label: '删除预设', danger: true \}/)
  assert.match(client, /rpc\(connection, 'delete', \{ id: target\.id, expectedRevision: target\.revision \}\)/)
  assert.match(client, /function DeletePresetDialog/)
  assert.match(client, /h\(Menu, \{/)
  assert.match(client, /IconEllipsisOutline16/)
  assert.match(client, /IconTrashOutline16/)
  assert.match(client, /'新增栏位'/)
  assert.match(client, /'创建你的第一个预设'/)
  assert.match(client, /className: css\.emptyIcon/)
  assert.match(client, /className: css\.primaryButton.*'新建预设'/)
  assert.match(client, /className: css\.listToolbar/)
  assert.match(client, /className: compact \? `\$\{css\.dialog\} \$\{css\.compactDialog\}`/)
  assert.match(client, /Reorder\.Group/)
  assert.match(client, /FIELD_POSITIONS/)
  assert.match(client, /'aria-label': `\$\{field\.name \|\| '新栏位'\}的位置`/)
  assert.match(client, /mergePositionOrder/)
  assert.match(client, /'aria-label': '上移栏位'/)
  assert.match(client, /'aria-label': '下移栏位'/)
  assert.match(client, /reducedMotion: 'user'/)
  assert.match(client, /useWorkbenchModal\(open\)/)
  assert.match(client, /ref: dialogRef, tabIndex: -1, className: css\.shell/)
  assert.match(client, /h\(IconChecklistOutline14, \{ size: wide \? 16 : 18 \}\), wide \? h\('span'/)
  assert.doesNotMatch(client, /IconListPenOutline16/)
  assert.doesNotMatch(client, /IconAgentPresetOutline16/)
  assert.doesNotMatch(client, /className: css\.triggerIcon/)
  assert.match(styles, /\.trigger\{display:flex;align-items:center;gap:8px;width:calc\(100% \+ 8px\);height:34px;/)
  assert.match(styles, /\.emptyIcon\{display:flex;width:56px;height:56px;/)
  assert.match(styles, /\.content>:last-child\{flex:1;min-width:0;min-height:0;overflow:hidden;/)
  assert.match(styles, /\.empty\{height:100%;box-sizing:border-box;flex:1;min-height:0;/)
  assert.match(styles, /\.list\{width:min\(680px,100%\);gap:6px;/)
  assert.match(styles, /\.row\{grid-template-columns:36px minmax\(0,1fr\) auto;gap:10px;min-height:60px;/)
  assert.match(styles, /\.compactDialog\{width:min\(760px,calc\(100vw - 48px\)\);height:min\(520px,/)
  assert.match(styles, /\.editorBody\{overscroll-behavior:contain\}/)
  assert.match(styles, /\.positionGroup\{margin-top:14px\}/)
  assert.match(styles, /\.templateCard\{/)
  assert.match(styles, /\.moreAction\{/)
  assert.match(styles, /\.rowWrap\{display:grid;grid-template-columns:minmax\(0,1fr\) 36px;align-items:center;box-sizing:border-box;border:1px solid transparent;/)
  assert.match(styles, /\.rowWrap\[data-default="true"\]\{border-color:/)
  assert.doesNotMatch(styles, /\.rowWrap\[data-default="true"\]\{box-shadow:/)
  assert.match(styles, /\.deleteDialog\{/)
  assert.match(styles, /\.deleteSummary\{/)
  assert.match(styles, /\.positionGroup \.fieldGrid\{grid-template-columns:minmax\(92px,\.55fr\) 1fr 1\.5fr\}/)
  assert.match(client, /export const inject = \['slots', 'rpRemote', 'rpAssetEditors'\]/)
  assert.match(client, /ctx\.rpAssetEditors\.register\('preset', PresetSessionEditor\)/)
  assert.match(client, /function PresetSessionEditor/)
  assert.match(client, /h\(PresetEditor/)
})
