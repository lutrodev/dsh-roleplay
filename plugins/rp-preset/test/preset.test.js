import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { Context } from '@deepseek-ai/cordis'
import { apply, DEFAULT_PRESET, RpPresets, dispatchBrowser } from '../src/index.js'

const configFor = libraryDir => ({ libraryDir, maxTextCharacters: 100000, maxFields: 32, exposeBrowser: false })

function previousDefaultPreset() {
  const preset = structuredClone(DEFAULT_PRESET)
  replaceFieldText(preset, '任务描述',
    '主角是故事当前聚焦的核心角色。根据当前语境判断用户是在扮演还是导演主角。',
    '主角是故事当前聚焦的核心角色。用户代入主角时，不要替其决定同意、承诺、关系、目标等重大或不可逆选择；可以依据既有人设、当前情境和用户意图，补写合理的简短对白、即时反应、日常动作和已开始行动的自然延续。用户从故事外导演时，按其明确指示描写主角，不擅自增加重大决定。')
  replaceFieldText(preset, '写作指导',
    '连续性：把对话历史视为已经发生的事件。选择、伤势、承诺、误会和损失都会留下后果；惊喜与变化必须从这些经历中自然生长。\n\n角色自主：',
    '连续性：把对话历史视为已经发生的事件。选择、伤势、承诺、误会和损失都会留下后果；惊喜与变化必须从这些经历中自然生长。\n\n用户主权：按用户当前参与方式行动；可以补写合乎人设、情境与用户意图的对白和动作，但重大或不可逆决定留给用户。\n\n角色自主：')
  replaceFieldText(preset, '写作指导',
    '故事推进：根据场景需要，通过反应、后果、发现、压力、关系变化或其他角色的行动推动故事。安静的观察、停顿和过渡也可以成立，不必每轮制造事件或反转。',
    '故事推进：每次回复都应通过反应、后果、发现、压力、关系变化或其他角色的行动，使场景发生有意义的变化。安静而细微的变化同样有效；如果当前场景已有足够张力，不要为推进而强行制造反转或打断。')
  replaceFieldText(preset, '写作指导',
    '根据场景自然收束：可以留下接续点，也可以完成当前动作、对话或余波。不要机械制造悬念，也不要无故跳转时间或场景。\n\n避免作者式总结、意义升华及近期结尾的机械重复。让情绪和主题留在人物行为与后果中。',
    '在场景仍有行动惯性、用户能自然介入的位置结束。主角可以有符合既有意图的短句、即时反应或日常动作，但不要替用户作出重大决定，也不要擅自跳转时间或场景。以反应、局势变化、压力或进行中的动作留下接续点，不写尽余波。\n\n避免作者式总结、意义升华及近期结尾的机械重复。情绪和主题留在人物行为与后果中；结尾既要保持因果连续，也要为用户保留多种合理回应空间。')
  preset.fields.find(field => field.name === '思维链指导').content = '使用正文语言在内部简要检查用户最新意图、连续性、主要角色动机、场景变化和自然停笔位置。确认补写的主角对白、反应和行动合乎人设、情境与用户意图，且不代替重大决定。对照当前可见对话历史中的近期结尾，检查当前计划是否重复无法产生新作用的形式或内容。不要复述上下文或探索无关分支，形成清晰的下一段场景后立即开始写作。不要在正文中展示规划、分析或创作说明。'
  return preset
}

function replaceFieldText(preset, name, current, previous) {
  const field = preset.fields.find(item => item.name === name)
  assert.ok(field)
  const replaced = field.content.replace(current, previous)
  assert.notEqual(replaced, field.content)
  field.content = replaced
}

test('creates a blank preset or the managed example preset', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-preset-'))
  const ctx = new Context()
  const presets = new RpPresets(ctx, configFor(root))
  try {
    const blank = await presets.create({ name: '空白预设' })
    assert.deepEqual((await presets.get(blank.id)).fields, [])

    const created = await presets.create(DEFAULT_PRESET)
    const initial = await presets.get(created.id)
    assert.deepEqual(initial.fields.map(field => [field.name, field.position, field.sectionTag]), [
      ['声明', 'top', true], ['任务描述', 'top', true], ['写作指导', 'top', true], ['思维链指导', 'bottom', true], ['格式要求', 'bottom', true],
    ])
    assert.ok(initial.fields.every(field => field.content.length > 0))
    assert.equal(DEFAULT_PRESET.name, '示例预设')
    assert.equal(DEFAULT_PRESET.description, '')
    const taskDescription = initial.fields.find(field => field.name === '任务描述').content
    for (const heading of ['## 用户', '## 主角', '## 其他角色', '## 任务']) assert.match(taskDescription, new RegExp(heading))
    assert.match(taskDescription, /用户提供最新输入/)
    assert.match(taskDescription, /可以在故事中扮演主角，也可以从故事外导演/)
    assert.match(taskDescription, /主角是故事当前聚焦的核心角色/)
    assert.match(taskDescription, /根据当前语境判断用户是在扮演还是导演主角/)
    assert.doesNotMatch(taskDescription, /只能完成用户最新输入已经明确开始的直接动作/)
    assert.doesNotMatch(taskDescription, /同意|重大或不可逆|补写合理的简短对白/)
    assert.match(taskDescription, /没有被用户当前输入直接扮演或导演的角色由你表现/)
    assert.match(taskDescription, /写出故事接下来鲜活发生的一段/)
    assert.doesNotMatch(taskDescription, /询问故事中的事物|不回答关于故事的问题|只输出故事本身/)
    assert.doesNotMatch(taskDescription, /「我的人设」|「角色卡」|「世界设定」|「扮演指导」|「重要规则」|「会话变量」|「对话历史」|「当前输入」/)
    const writingGuidance = initial.fields.find(field => field.name === '写作指导').content
    assert.match(writingGuidance, /其他角色拥有自己的动机、知识、局限、偏见/)
    assert.doesNotMatch(writingGuidance, /用户主权|重大或不可逆|替用户作出重大决定/)
    assert.match(writingGuidance, /人物变化应来自累积的经历和当下压力，而不是为了配合剧情突然转向/)
    assert.match(writingGuidance, /不要因为一个角色富有魅力、地位强大、与主角关系亲密或拥有可以理解的动机/)
    assert.match(writingGuidance, /不能抹掉行为的性质、受害者的体验和已经造成的后果/)
    assert.match(writingGuidance, /也不必安排恶人立刻受罚/)
    assert.match(writingGuidance, /安静的观察、停顿和过渡也可以成立，不必每轮制造事件或反转/)
    assert.match(writingGuidance, /可以留下接续点，也可以完成当前动作、对话或余波/)
    assert.match(writingGuidance, /不要机械制造悬念，也不要无故跳转时间或场景/)
    assert.match(writingGuidance, /避免作者式总结、意义升华及近期结尾的机械重复/)
    assert.match(writingGuidance, /情绪和主题留在人物行为与后果中/)
    assert.doesNotMatch(writingGuidance, /不写尽余波|每次回复都应|保持因果连续，也要为用户保留多种合理回应空间/)
    assert.match(writingGuidance, /围着主角旋转、只负责提供情绪服务/)
    assert.doesNotMatch(writingGuidance, /第三人称叙事|对白使用双引号|先让意义通过对白|成段倾倒设定|套话式情绪标签|模板化网络表达/)
    const chainOfThought = initial.fields.find(field => field.name === '思维链指导').content
    assert.match(chainOfThought, /写作前简要检查用户意图、连续性、角色动机、场景变化和收束位置/)
    assert.match(chainOfThought, /避免重复近期结尾/)
    assert.doesNotMatch(chainOfThought, /主角对白|重大决定/)
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

test('seeds one managed default and preserves an explicit default across service instances', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-preset-default-'))
  const firstCtx = new Context()
  const secondCtx = new Context()
  const first = new RpPresets(firstCtx, configFor(root))
  const second = new RpPresets(secondCtx, configFor(root))
  try {
    const seeded = await first.ensureDefault()
    assert.equal(seeded.name, DEFAULT_PRESET.name)
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

test('migrates the untouched previous default without replacing field identities or later user edits', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-preset-migrate-'))
  const ctx = new Context()
  const presets = new RpPresets(ctx, configFor(root))
  try {
    const previous = previousDefaultPreset()
    previous.fields[0].sectionTag = false
    const created = await presets.create(previous)
    const before = await presets.get(created.id)
    const migrated = await presets.ensureDefault()
    assert.equal(migrated.id, before.id)
    assert.equal(migrated.revision, before.revision + 1)
    assert.deepEqual(migrated.fields.map(field => field.id), before.fields.map(field => field.id))
    assert.deepEqual(migrated.fields.map(field => field.sectionTag), before.fields.map(field => field.sectionTag))
    assert.deepEqual(
      migrated.fields.map(field => [field.name, field.description, field.content, field.position]),
      DEFAULT_PRESET.fields.map(field => [field.name, field.description, field.content, field.position]),
    )

    const fields = migrated.fields.map(field => field.name === '任务描述' ? { ...field, content: '保留用户修改后的控制边界。' } : field)
    const customized = await presets.update(migrated.id, { name: migrated.name, description: migrated.description, fields }, migrated.revision)
    const kept = await presets.ensureDefault()
    assert.equal(kept.revision, customized.revision)
    assert.equal(kept.fields.find(field => field.name === '任务描述').content, '保留用户修改后的控制边界。')
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('browser Remote creates blank presets and can select a default preset', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-preset-browser-'))
  const ctx = new Context()
  const presets = new RpPresets(ctx, configFor(root))
  try {
    const first = await dispatchBrowser(presets, 'create', { preset: { name: '空白甲' } })
    const second = await dispatchBrowser(presets, 'create', { preset: { name: '空白乙' }, makeDefault: true })
    assert.deepEqual(first.detail.fields, [])
    assert.equal(second.detail.isDefault, true)
    assert.equal((await dispatchBrowser(presets, 'set-default', { id: first.created.id })).isDefault, true)
    await assert.rejects(dispatchBrowser(presets, 'templates', {}), error => error.code === 'INVALID_REQUEST')
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('validates a bound preset without depending on library default preferences', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-preset-binding-'))
  const ctx = new Context()
  const presets = new RpPresets(ctx, configFor(root))
  try {
    const created = await presets.create({ name: '会话使用的预设' })
    await writeFile(join(root, '.preferences.json'), '{invalid json', 'utf8')
    assert.deepEqual(
      await dispatchBrowser(presets, 'validate-binding', { id: created.id }),
      { id: created.id },
    )
    await rm(join(root, `${created.id}.json`))
    await assert.rejects(
      dispatchBrowser(presets, 'validate-binding', { id: created.id }),
      error => error.code === 'ASSET_NOT_FOUND',
    )
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

    const updated = await presets.update(second.id, { name: '保留预设（已更新）', description: '', fields: [] }, second.revision)
    await assert.rejects(dispatchBrowser(presets, 'delete', { id: second.id, expectedRevision: second.revision }), error => error.code === 'REVISION_CONFLICT')
    await dispatchBrowser(presets, 'delete', { id: second.id, expectedRevision: updated.revision })
    assert.deepEqual(await presets.list({ limit: 10 }), { items: [], defaultId: null, nextCursor: null, total: 0 })
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('preserves preset field identity and rejects incomplete or unknown native fields', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-preset-native-schema-'))
  const ctx = new Context()
  const presets = new RpPresets(ctx, configFor(root))
  try {
    const created = await presets.create({
      name: '严格预设',
      fields: [{ name: '任务', description: '任务说明', content: '保持悬念。', position: 'top', sectionTag: false }],
    })
    const before = await presets.get(created.id)
    const updated = await presets.update(created.id, {
      name: before.name,
      description: before.description,
      fields: [{ ...before.fields[0], content: '逐步揭示线索。' }],
    }, before.revision)
    assert.equal(updated.fields[0].id, before.fields[0].id)
    assert.equal(updated.fields[0].sectionTag, false)

    await assert.rejects(presets.create({ name: '错字段', instructions: '会被丢弃' }), error => error.code === 'INVALID_REQUEST' && /unknown field "instructions"/.test(error.message))
    await assert.rejects(presets.create({ name: '错栏位', fields: [{ name: '任务', position: 'top', instructions: '会被丢弃' }] }), error => error.code === 'INVALID_REQUEST' && /unknown field "instructions"/.test(error.message))
    await assert.rejects(presets.update(created.id, { name: '遗漏', description: '' }, updated.revision), error => error.code === 'INVALID_REQUEST' && /including fields/.test(error.message))
    await assert.rejects(presets.update(created.id, {
      name: updated.name,
      description: updated.description,
      fields: [{ ...updated.fields[0], id: undefined }],
    }, updated.revision), error => error.code === 'INVALID_REQUEST' && /id must be a valid UUID/.test(error.message))
    const { sectionTag: _sectionTag, ...withoutSectionTag } = updated.fields[0]
    await assert.rejects(presets.update(created.id, {
      name: updated.name,
      description: updated.description,
      fields: [withoutSectionTag],
    }, updated.revision), error => error.code === 'INVALID_REQUEST' && /requires sectionTag/.test(error.message))
    assert.equal((await presets.get(created.id)).revision, updated.revision)
  } finally {
    await ctx.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})

test('agent preset guidance distinguishes create defaults from complete update fields', async () => {
  const guidance = await readFile(new URL('../skills/rp-guide-preset/SKILL.md', import.meta.url), 'utf8')
  assert.match(guidance, /For `create`/)
  assert.match(guidance, /send exactly `\{ name, description, fields \}`/)
  assert.match(guidance, /preserve every returned stable UUID `id` and boolean `sectionTag`/)
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
      { name: '段落收束', description: '底部第一项', content: '两段。', position: 'bottom', sectionTag: false },
      { name: '连续性自检', description: '底部第二项', content: '检查连续性。', position: 'bottom' },
      { name: '长'.repeat(120), description: '说明'.repeat(500), content: '保留完整正文。', position: 'top' },
    ] })
    const value = await source.prepare({ agent: {} })
    assert.equal(value.sources.length, 4)
    assert.deepEqual(value.sources.map(item => item.diagnostics.position), ['top', 'top', 'bottom', 'bottom'])
    assert.deepEqual(value.sources.filter(item => [...item.label].length < 80).map(item => item.label), ['镜头调度', '段落收束', '连续性自检'])
    assert.deepEqual(value.sources.map(item => item.defaultSlot.id), value.sources.map(item => item.id))
    assert.deepEqual(value.sources.map(item => item.defaultSlot.label), value.sources.map(item => item.label))
    assert.deepEqual(value.sources.map(item => item.defaultSlot.sectionTag), [true, true, false, true])
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
    await assert.rejects(presets.create({ name: '甲', fields: [{ name: '乙', position: 'top', sectionTag: 'yes' }] }), error => error.code === 'INVALID_REQUEST')
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
    const request = handler('list', { limit: 10 }).then(value => {
      requestSettled = true
      return value
    })
    await Promise.resolve()
    assert.equal(requestSettled, false, 'RPC must wait for preset initialization')

    const disposal = fiber.dispose()
    gate.resolve()
    const response = await request
    assert.equal(response.value.value.items.length, 1)
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
    assert.deepEqual((await presets.get(id)).fields.map(field => [field.position, field.sectionTag]), [['top', true], ['bottom', true]])
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

test('preset editor opens one blank creation flow without client-side fixed fields', async () => {
  const client = await readFile(new URL('../src/client.js', import.meta.url), 'utf8')
  const styles = await readFile(new URL('../src/client.module.css', import.meta.url), 'utf8')
  for (const label of ['声明', '任务描述', '写作指导', '思维链指导', '格式要求']) assert.doesNotMatch(client, new RegExp(label))
  assert.doesNotMatch(client, /DEFAULT_FIELDS/)
  assert.doesNotMatch(client, /rpc\(connection, 'templates', \{\}\)/)
  assert.doesNotMatch(client, /function PresetCreateChooser|createChooser|templateCard|空白预设/)
  assert.match(client, /const create = \(\) => \{ setDraft\(newPresetDraft\(\)\); setView\('edit'\)/)
  assert.match(client, /mode === 'create' \? newPresetDraft\(\) : null/)
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
  assert.doesNotMatch(styles, /createChooser|templateCard/)
  assert.match(client, /function SectionTagSwitch/)
  assert.match(client, /role: 'switch'/)
  assert.match(client, /'分组标签'/)
  assert.match(client, /className: css\.sectionTagCompact/)
  assert.match(client, /控制新会话是否默认添加分组标签；会话内仍可单独调整。/)
  assert.doesNotMatch(client, /className: css\.sectionTagControl/)
  assert.match(client, /onUpdate\(field\.id, 'sectionTag', value\)/)
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
  assert.match(styles, /\.moreAction\{/)
  assert.match(styles, /\.rowWrap\{display:grid;grid-template-columns:minmax\(0,1fr\) 36px;align-items:center;box-sizing:border-box;border:1px solid transparent;/)
  assert.match(styles, /\.rowWrap\[data-default="true"\]\{border-color:/)
  assert.doesNotMatch(styles, /\.rowWrap\[data-default="true"\]\{box-shadow:/)
  assert.match(styles, /\.deleteDialog\{/)
  assert.match(styles, /\.deleteSummary\{/)
  assert.match(styles, /\.positionGroup \.fieldGrid\{grid-template-columns:minmax\(92px,\.55fr\) 1fr 1\.5fr\}/)
  assert.match(styles, /\.sectionTagCompact\{/)
  assert.match(styles, /\.fieldCardHeader \.sectionTagSwitch\[aria-checked="true"\]/)
  assert.match(styles, /@media\(prefers-reduced-motion:reduce\)\{\.fieldCardHeader \.sectionTagSwitch\{transition:none\}\}/)
  assert.match(client, /export const inject = \['slots', 'rpRemote', 'rpAssetEditors'\]/)
  assert.match(client, /ctx\.rpAssetEditors\.register\('preset', PresetSessionEditor\)/)
  assert.match(client, /function PresetSessionEditor/)
  assert.match(client, /h\(PresetEditor/)
})
