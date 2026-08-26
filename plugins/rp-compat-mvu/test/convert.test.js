import assert from 'node:assert/strict'
import test from 'node:test'
import {
  collectMvuLoreInitialValues,
  convertMvuImport,
  inspectMvuOpening,
  inspectMvuSource,
  materializeMvuInitialValue,
  mvuStateNamespace,
  parseOpeningUpdateBlock,
  selectMvuOpening,
} from '../src/convert.js'
import { decodeMvuInitialValue } from '../src/initial-value.js'
import { createMvuLoreActivation } from '../src/lore-adapter.js'
import { materializeMvuProfile } from '../src/materialize.js'
import { createMvuCompatibilityView, isMvuControlEntry, materializeNativeMvuState, splitMvuValue } from '../src/native-state.js'
import { parseMvuDeclaredType } from '../src/mvu-type.js'
import { apply as applyMvuPlugin } from '../src/index.js'
import { applyStateChanges } from 'dsh-roleplay-rp-state/update'

test('sanitizes visible card text without adding compatibility fields or changing embedded lore', () => {
  const sourcePayload = {
    spec: 'chara_card_v3',
    data: {
      first_mes: '<initvar>{"hp":10}</initvar> Hello <UpdateVariable>set hp</UpdateVariable>',
      character_book: { entries: [{ comment: '[InitVar]', content: '{"mood":"calm"}' }] },
    },
  }
  const result = convertMvuImport({
    sourcePayload,
    character: {
      firstMessage: sourcePayload.data.first_mes,
      alternateGreetings: [],
      characterBook: structuredClone(sourcePayload.data.character_book),
    },
    quarantinedPrompts: [],
  })
  assert.equal(result.character.firstMessage, 'Hello')
  assert.equal(Object.hasOwn(result.character, 'nativeState'), false)
  assert.equal(Object.hasOwn(result.character, 'compatibility'), false)
  assert.deepEqual(result.character.characterBook, sourcePayload.data.character_book)
  assert.equal(result.sourcePayload, sourcePayload)
  assert.equal(result.quarantinedPrompts[0].kind, 'mvu-update')
})

test('decodes portable YAML and rejects unsafe or excessive initial values', () => {
  const yaml = decodeMvuInitialValue('User:\n  年龄: 22\n世界:\n  时间: 周五 下午')
  assert.equal(yaml.ok, true)
  assert.deepEqual(yaml.value, { User: { 年龄: 22 }, 世界: { 时间: '周五 下午' } })
  const pairs = decodeMvuInitialValue('player.gold = 100\nactive = true')
  assert.deepEqual(pairs.value, { player: { gold: 100 }, active: true })
  const mixedPairs = decodeMvuInitialValue('hp=10\nmood: calm')
  assert.deepEqual(mixedPairs, { ok: true, value: { hp: 10, mood: 'calm' } })
  assert.match(decodeMvuInitialValue('hp=10\nmood: calm\nbroken line').message, /line 3/)
  assert.match(decodeMvuInitialValue('player=ready\nplayer.gold=100').message, /Conflicting variable path/)
  assert.equal(decodeMvuInitialValue('{"__proto__":{"polluted":true}}').ok, false)
  const aliases = decodeMvuInitialValue('base: &base [1]\ncopies: [' + Array.from({ length: 101 }, () => '*base').join(', ') + ']')
  assert.equal(aliases.ok, false)
  let nested = 'value'
  for (let index = 0; index < 65; index += 1) nested = { next: nested }
  assert.match(decodeMvuInitialValue(nested).message, /nesting levels/)
})

test('normalizes common loose MVU JSON and maps metadata without leaking compatibility markers', () => {
  const decoded = decodeMvuInitialValue(`{
    // Community cards commonly omit separators around object boundaries.
    '全局': {
      '$meta': { 'extensible': true, 'required': ['日期', '星期', '时间'], 'template': {} },
      '日期': '2024年9月16日',
      '星期': '星期一'
      '时间': '17:30',
    }
    '角色': {
      '性经历': {
        '$meta': { 'extensible': false, 'required': ['记录'], 'template': {} },
        '记录': ['$__META_EXTENSIBLE__$', '第一条记录', '第二条记录',],
      },
    },
  }`)
  assert.equal(decoded.ok, true)
  assert.deepEqual(decoded.diagnostics?.map(item => item.code), ['MVU_INIT_LOOSE_JSON_NORMALIZED'])

  const split = splitMvuValue(decoded.value)
  assert.deepEqual(split.value, {
    全局: { 日期: '2024年9月16日', 星期: '星期一', 时间: '17:30' },
    角色: { 性经历: { 记录: ['第一条记录', '第二条记录'] } },
  })
  assert.equal(split.schema.properties['全局'].additionalProperties, true)
  assert.deepEqual(split.schema.properties['全局'].required, ['日期', '星期', '时间'])
  assert.equal(split.schema.properties['角色'].properties['性经历'].additionalProperties, false)
  assert.equal(split.schema.properties['角色'].properties['性经历'].properties['记录'].type, 'array')
  assert.doesNotMatch(JSON.stringify(split), /\$meta|__META_EXTENSIBLE__/)
})

test('discovers semantic rules by content and repairs common MVU YAML formatting only as declarations', () => {
  const semanticEntry = {
    name: '变量规则 1',
    content: `---
# 变量更新规则:
  核心:
    信任值:
      type: number
      range: capped in 0-100, an integer.
      check:
      - 普通正向互动增加 +1 到 +3。
  所在位置:
    type: string
    range: "一级地点 - 二级地点" 的格式。
    check:
      - 角色移动后更新。
  性经历:
    type: array
    range: 包含最近5次记录的数组。
    check:
      - 每次事件结束后更新记录。`,
  }
  const state = materializeNativeMvuState({
    initialValue: {
      核心: { 信任值: 20 },
      所在位置: '学校 - 教室',
      性经历: { 记录: ['初始记录'] },
    },
    books: [{ entries: [semanticEntry] }],
  }).namespaces[0]
  assert.equal(state.definition.updateMode, 'schema-only')
  assert.equal(state.definition.rules.length, 3)
  assert.deepEqual(state.definition.schema.properties['核心'].properties['信任值'], {
    type: 'number',
    description: '取值说明：capped in 0-100, an integer.',
    minimum: 0,
    maximum: 100,
  })
  assert.match(state.definition.schema.properties['所在位置'].description, /一级地点/)
  assert.equal(state.definition.rules.find(rule => rule.target.includes('性经历')).target, '/性经历/记录')
  assert.equal(state.diagnostics.setup.some(item => item.severity === 'error'), false)
  assert.equal(isMvuControlEntry(semanticEntry), true)
  assert.equal(isMvuControlEntry({ name: '变量更新指令集', content: '<UpdateVariable><JSONPatch>[]</JSONPatch></UpdateVariable>' }), true)
})

test('normalizes dotted MVU paths and expands a closed wildcard into exact native rules', () => {
  const initialValue = {
    世界: { 日期: '8月15日', 具体时间: '10:00', 当前地点: '大门前' },
    莎夏: {
      脸部特写: '神情自然',
      衣着状态: '穿着外套',
      身材概述: '固定特征',
    },
  }
  const story = materializeNativeMvuState({
    initialValue,
    source: { data: { character_book: { entries: [{
      comment: '[mvu_update]变量更新规则',
      content: [
        '变量更新规则:',
        '  世界.具体时间:',
        '    check: 剧情经过后更新时间',
        '  莎夏.*:',
        '    check: 根据本轮可见事实更新',
        '  莎夏.身材概述:',
        '    check: 固定特征不得随意修改',
      ].join('\n'),
    }] } } },
  }).namespaces[0]
  assert.equal(story.definition.updateMode, 'rules-required')
  assert.deepEqual(story.definition.rules.map(rule => rule.target), [
    '/世界/具体时间',
    '/莎夏/脸部特写',
    '/莎夏/衣着状态',
    '/莎夏/身材概述',
  ])
  assert.equal(story.definition.rules[1].id, 'mvu-rule-002')
  assert.match(story.definition.rules.at(-1).when, /固定特征/)
  assert.equal(Object.hasOwn(story.definition.schema.properties, '莎夏.*'), false)
  assert.equal(Object.hasOwn(story.definition.schema.properties, '世界.具体时间'), false)

  const snapshot = {
    revision: 1,
    initialValue: structuredClone(story.initialValue),
    value: structuredClone(story.initialValue),
    definition: story.definition,
    diagnostics: story.diagnostics,
  }
  const applied = applyStateChanges({
    state: { revision: 1, namespaces: { story: snapshot } },
    namespace: 'story',
    snapshot,
    changes: [{
      op: 'set',
      path: '/莎夏/脸部特写',
      value: '视线转向门内',
      ruleId: 'mvu-rule-002',
      reason: '本轮明确描写了视线移动',
    }],
  })
  assert.equal(applied.result.value['莎夏']['脸部特写'], '视线转向门内')
})

test('supports MVU Zod path groups, duplicate YAML sections and nullable placeholders safely', () => {
  const story = materializeNativeMvuState({
    initialValue: {
      主角: {
        能力: { 力量: null, 敏捷: 2 },
        生命值: { 当前值: null, 最大值: null },
        魔力值: { 当前值: 5, 最大值: 10 },
        职业: {},
        技能列表: {},
      },
    },
    source: { data: { character_book: { entries: [{
      comment: '[mvu_update]变量更新规则',
      content: [
        '变量更新规则:',
        '  核心规则:',
        '    - `description` 只记录客观效果。',
        '  主角:',
        '    能力.${七维}:',
        '      type: number',
        '      check: 对应历练完成时更新',
        '    生命值 | 魔力值:',
        '      type: |-',
        '        { 当前值: number; 最大值: number; }',
        '      check: 当前值不得超过最大值',
        '    职业.${职业名}:',
        '      type: |-',
        '        { 当前等级: number; 当前经验: number; }',
        '      check: 获得经验时更新',
        '  主角:',
        '    技能列表.${技能名}:',
        '      type: |-',
        "        { type: '主动' | '被动'; tags: string[]; flags: Record<string, true>; }",
        '      check: 学会新技能时完整录入',
      ].join('\n'),
    }] } } },
  }).namespaces[0]
  assert.equal(story.definition.updateMode, 'schema-only')
  assert.equal(story.diagnostics.setup.some(item => item.severity === 'error'), false)
  assert.deepEqual(story.definition.rules.map(rule => rule.target), [
    '',
    '/主角/能力/力量',
    '/主角/能力/敏捷',
    '/主角/生命值',
    '/主角/魔力值',
    '/主角/职业',
    '/主角/技能列表',
  ])
  assert.deepEqual(story.definition.schema.properties['主角'].properties['能力'].properties['力量'].type, ['number', 'null'])
  assert.deepEqual(story.definition.schema.properties['主角'].properties['生命值'].properties['当前值'].type, ['number', 'null'])
  assert.equal(story.definition.schema.properties['主角'].properties['职业'].additionalProperties.type, 'object')
  const skill = story.definition.schema.properties['主角'].properties['技能列表'].additionalProperties
  assert.equal(skill.properties.tags.type, 'array')
  assert.equal(skill.properties.tags.items.type, 'string')
  assert.deepEqual(skill.properties.flags.additionalProperties, { type: 'boolean', const: true })
})

test('keeps bracket paths and array wildcards schema-only without inventing pointer wildcards', () => {
  const story = materializeNativeMvuState({
    initialValue: {
      '事件.记录': {
        条目: [{ 状态: '进行中' }, { 状态: '已结束' }],
      },
    },
    source: { data: { character_book: { entries: [{
      comment: '[mvu_update]变量更新规则',
      content: [
        '变量更新规则:',
        '  \'["事件.记录"].条目.*.状态\':',
        '    type: string',
        '    check: 条目状态发生变化时更新',
      ].join('\n'),
    }] } } },
  }).namespaces[0]
  assert.equal(story.definition.updateMode, 'schema-only')
  assert.deepEqual(story.definition.rules.map(rule => rule.target), ['/事件.记录/条目'])
  assert.match(story.definition.rules[0].guidance[0], /\["事件\.记录"\]\.条目\.\*\.状态/u)
  assert.equal(story.definition.schema.properties['事件.记录'].properties['条目'].items.properties['状态'].type, 'string')
})

test('parses safe TypeScript-style MVU Zod collection declarations', () => {
  assert.deepEqual(parseMvuDeclaredType('Array<{ emotion: string; intensity: "高" | "低"; }>'), {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        emotion: { type: 'string' },
        intensity: { type: 'string', enum: ['高', '低'] },
      },
      required: ['emotion', 'intensity'],
      additionalProperties: false,
    },
  })
  assert.deepEqual(parseMvuDeclaredType('{ 姓名, 职业: string; 标签: Record<string, true>; 技能: string[]; }'), {
    type: 'object',
    properties: {
      姓名: { type: 'string' },
      职业: { type: 'string' },
      标签: { type: 'object', additionalProperties: { type: 'boolean', const: true } },
      技能: { type: 'array', items: { type: 'string' } },
    },
    required: ['姓名', '职业', '标签', '技能'],
    additionalProperties: false,
  })
  assert.deepEqual(parseMvuDeclaredType('{ 名称：string；标签：Record<string， string[]>； }'), {
    type: 'object',
    properties: {
      名称: { type: 'string' },
      标签: { type: 'object', additionalProperties: { type: 'array', items: { type: 'string' } } },
    },
    required: ['名称', '标签'],
    additionalProperties: false,
  })
})

test('extracts an indented semantic rule section without treating every mvu_update entry as one', () => {
  const state = materializeNativeMvuState({
    initialValue: { hp: 10 },
    source: { data: { character_book: { entries: [{
      comment: 'COT[mvu_update]',
      content: '<must>分析变量并输出旧格式命令</must>',
    }, {
      comment: '混合控制器[mvu_update]',
      content: [
        '<status_current_variables><% unsafe_status_script() %></status_current_variables>',
        '<description>',
        '变量更新规则:',
        '  hp:',
        '    type: number',
        '    check:',
        '      - 单次变化范围为【-1, +2】。',
        '</description>',
        '变量输出格式:',
        '  command: <UpdateVariable>',
      ].join('\n'),
    }] } } },
  })
  assert.equal(state.namespaces[0].definition.updateMode, 'rules-required')
  assert.deepEqual(state.namespaces[0].definition.rules[0].effect, { op: 'increment', minimum: -1, maximum: 2 })
  assert.equal(state.namespaces[0].diagnostics.setup.some(item => item.code === 'MVU_UPDATE_RULE_UNCONVERTED'), false)
})

test('persists a disabled diagnostic namespace when an initializer is detected but cannot be converted', () => {
  const result = materializeMvuProfile({
    profile: { resources: { lorebooks: [{ id: 'broken' }] }, scene: { openingSource: 'skip' } },
    books: [{ id: 'broken', entries: [{ name: '[InitVar]', content: '{ "hp": [1, }' }] }],
  })
  const story = result.stateBootstrap.namespaces[0]
  assert.deepEqual(story.initialValue, {})
  assert.equal(story.definition.updateMode, 'disabled')
  assert.ok(story.diagnostics.setup.some(item => item.code === 'MVU_INIT_UNCONVERTED'))
  assert.ok(story.diagnostics.setup.some(item => item.code === 'MVU_STATE_DISABLED'))
})

test('reads card, bound lore and only the selected alternate opening in deterministic order', () => {
  const source = {
    spec: 'chara_card_v3',
    data: {
      extensions: { stat_data: { hp: [10, 'current health'], shared: 'card' } },
      first_mes: '<initvar>route: first\nshared: greeting</initvar>First',
      alternate_greetings: [
        'Second\n<UpdateVariable>_.set("hp", 10, 7);_.set("location", "harbor", "cliff");</UpdateVariable>',
      ],
    },
  }
  const inspection = inspectMvuSource(source)
  const lore = collectMvuLoreInitialValues([
    { entries: [{ name: '[InitVar] base', enabled: false, content: 'shared: lore\nweather: rain' }] },
    { entries: [{ name: '[initvar] override', enabled: false, content: 'weather: wind' }] },
  ])
  const opening = selectMvuOpening(inspection, 1, 'Second')
  assert.deepEqual(materializeMvuInitialValue(inspection, opening, lore.initialValue), {
    hp: [7, 'current health'],
    shared: 'lore',
    weather: 'wind',
    location: 'cliff',
  })
  assert.equal(selectMvuOpening(inspection, 0, 'First').initialValue.route, 'first')
})

test('recovers a disabled initializer from the preserved embedded role-card book', () => {
  const cardId = '33333333-3333-4333-8333-333333333333'
  const source = { data: {
    character_book: { entries: [{
      comment: '[initvar]变量初始化勿开',
      content: 'User:\n  年龄: 22\n世界:\n  地点: 御龙湾',
      enabled: false,
    }] },
    first_mes: 'Visible opening',
  } }
  const result = materializeMvuProfile({
    profile: {
      resources: { card: { id: cardId }, lorebooks: [{ id: 'managed-book' }] },
      scene: { openingIndex: 0, openingSource: 'card', openingText: 'Visible opening' },
    },
    character: { id: cardId, firstMessage: 'Visible opening', alternateGreetings: [] },
    source,
    // Reproduces an older materialized book that lost the disabled control entry.
    books: [{ id: 'managed-book', entries: [] }],
  })
  assert.equal(result.stateBootstrap.namespaces[0].namespace, 'story')
  assert.deepEqual(result.stateBootstrap.namespaces[0].initialValue, {
    User: { 年龄: 22 },
    世界: { 地点: '御龙湾' },
  })
})

test('falls back to the current native card for authored MVU fields without creating adapter entities', () => {
  const inspection = inspectMvuSource(
    { type: 'rp-authored-character', name: 'Author card' },
    {
      description: '<initvar>profile:\n  trust: 2</initvar>Visible description',
      extensions: { stat_data: { hp: 10 } },
      firstMessage: '<initvar>route: authored</initvar>Current opening',
      alternateGreetings: [],
    },
  )
  assert.deepEqual(inspection.initialValue, { profile: { trust: 2 }, hp: 10 })
  assert.deepEqual(selectMvuOpening(inspection, 0, 'Current opening').initialValue, { route: 'authored' })
})

test('keeps live card edits authoritative while recovering controls from unchanged imported openings', () => {
  const source = { data: {
    description: '<initvar>profile: imported</initvar>Visible description',
    personality: '<initvar>temperament: calm</initvar>Calm',
    world_scenario: '<initvar>location: harbor</initvar>At the harbor',
    mes_example: '<initvar>exampleSeen: true</initvar>Example',
    first_mes: '<initvar>route: imported</initvar>Original opening',
    alternate_greetings: ['<initvar>route: alternate</initvar>Alternate opening'],
  } }
  const unchanged = inspectMvuSource(source, {
    description: 'Visible description',
    personality: 'Calm',
    scenario: 'At the harbor',
    messageExample: 'Example',
    firstMessage: 'Original opening',
    alternateGreetings: ['Alternate opening'],
  })
  assert.deepEqual(unchanged.initialValue, {
    profile: 'imported', temperament: 'calm', location: 'harbor', exampleSeen: true,
  })
  assert.deepEqual(selectMvuOpening(unchanged, 1, 'Alternate opening').initialValue, { route: 'alternate' })

  const edited = inspectMvuSource(source, {
    description: 'Visible description\n<initvar>profile: edited</initvar>',
    personality: 'Calm',
    scenario: 'At the harbor',
    messageExample: 'Example',
    firstMessage: '<initvar>route: edited</initvar>Rewritten opening',
    alternateGreetings: [],
  })
  assert.deepEqual(edited.initialValue, {
    profile: 'edited', temperament: 'calm', location: 'harbor', exampleSeen: true,
  })
  assert.deepEqual(selectMvuOpening(edited, 0, '<initvar>route: edited</initvar>Rewritten opening').initialValue, { route: 'edited' })
  assert.equal(selectMvuOpening(edited, 0, 'Rewritten opening').text, 'Rewritten opening')

  const replacedWithoutControls = inspectMvuSource(source, {
    description: 'Visible description',
    personality: 'Calm',
    scenario: 'At the harbor',
    messageExample: 'Example',
    firstMessage: 'A completely new opening',
    alternateGreetings: [],
  })
  assert.equal(selectMvuOpening(replacedWithoutControls, 0, 'A completely new opening').initializationDetected, false)
})

test('materializes a complete native State v2 bootstrap for card, custom and skipped openings', () => {
  const cardId = '11111111-1111-4111-8111-111111111111'
  const character = { id: cardId, firstMessage: 'Card opening', alternateGreetings: [] }
  const source = { data: { extensions: { stat_data: { route: 'base' } }, first_mes: '<initvar>route: card</initvar>Card opening' } }
  const base = {
    resources: { card: { id: cardId }, lorebooks: [] },
    scene: { openingIndex: 0, openingSource: 'card', openingText: 'Card opening' },
  }
  const card = materializeMvuProfile({ profile: base, character, source, books: [] })
  assert.equal(card.stateBootstrap.version, 2)
  assert.equal(card.stateBootstrap.namespaces[0].namespace, 'story')
  assert.equal(card.stateBootstrap.namespaces[0].definition.updateMode, 'schema-only')
  assert.equal(Object.hasOwn(card.stateBootstrap.namespaces[0].definition, 'description'), false)
  assert.deepEqual(card.stateBootstrap.namespaces[0].initialValue, { route: 'card' })
  assert.equal(card.openingMessageText, 'Card opening')
  assert.doesNotMatch(card.stateBootstrap.namespaces[0].namespace, /mvu/i)
  assert.doesNotMatch(JSON.stringify(card.stateBootstrap), /MVU 初始化素材/)

  const custom = materializeMvuProfile({
    profile: { ...base, scene: { openingIndex: 0, openingSource: 'custom', openingText: '<initvar>route: custom</initvar>Custom' } },
    character, source, books: [],
  })
  assert.deepEqual(custom.stateBootstrap.namespaces[0].initialValue, { route: 'custom' })
  assert.equal(custom.openingMessageText, 'Custom')
  const customAgain = materializeMvuProfile({
    profile: { ...base, scene: { openingIndex: 0, openingSource: 'custom', openingText: '<initvar>route: custom</initvar>Custom' } },
    previousProfile: base,
    character,
    source,
    books: [],
  })
  assert.deepEqual(customAgain.stateBootstrap.namespaces[0].initialValue, { route: 'custom' })

  const skipped = materializeMvuProfile({
    profile: { ...base, scene: { openingIndex: 0, openingSource: 'skip' } },
    character, source, books: [],
  })
  assert.deepEqual(skipped.stateBootstrap.namespaces[0].initialValue, { route: 'base' })
  assert.equal(Object.hasOwn(skipped, 'openingMessageText'), false)
  assert.equal(mvuStateNamespace(), 'story')
})

test('does not apply unselected card openings and still handles a control-only selected opening', () => {
  const cardId = '22222222-2222-4222-8222-222222222222'
  const source = { data: { first_mes: '<initvar>route: hidden</initvar>' } }
  const skipped = materializeMvuProfile({
    profile: { resources: { card: { id: cardId }, lorebooks: [] }, scene: { openingIndex: 0, openingSource: 'skip' } },
    character: { id: cardId, firstMessage: '', alternateGreetings: [] },
    source,
    books: [],
  })
  assert.equal(skipped, undefined)
  const selected = materializeMvuProfile({
    profile: { resources: { card: { id: cardId }, lorebooks: [] }, scene: { openingIndex: 0, openingSource: 'card' } },
    character: { id: cardId, firstMessage: '', alternateGreetings: [] },
    source,
    books: [],
  })
  assert.deepEqual(selected.stateBootstrap.namespaces[0].initialValue, { route: 'hidden' })
  assert.equal(selected.openingMessageText, null)
})

test('uses story for lore-only initialization and replaces a previous bootstrap on blank reconfiguration', () => {
  const profile = { resources: { lorebooks: [{ id: 'book' }] }, scene: { openingIndex: 0, openingSource: 'skip' } }
  const books = [{ entries: [{ name: '[InitVar]', enabled: false, content: 'weather: rain' }] }]
  const result = materializeMvuProfile({ profile, books })
  assert.equal(result.stateBootstrap.namespaces[0].namespace, 'story')
  assert.deepEqual(result.stateBootstrap.namespaces[0].initialValue, { weather: 'rain' })

  const previousProfile = { resources: { card: { id: 'old' } }, scene: {}, stateBootstrap: { version: 2, namespaces: [{ namespace: 'story' }] } }
  const changed = materializeMvuProfile({
    profile,
    previousProfile,
    books,
  })
  assert.deepEqual(changed.stateBootstrap.namespaces[0].initialValue, { weather: 'rain' })
  const unchanged = materializeMvuProfile({
    profile: { ...profile, runtime: { executionMode: 'agent' } },
    previousProfile: { ...profile, stateBootstrap: result.stateBootstrap, runtime: { executionMode: 'chat' } },
    books,
  })
  assert.equal(unchanged, undefined)
  const cleared = materializeMvuProfile({ profile: { ...profile, resources: { lorebooks: [] } }, previousProfile, books: [] })
  assert.deepEqual(cleared.stateBootstrap, { version: 2, namespaces: [] })
})

test('parses literal-only MVU/Zod opening commands before native ValueWithDescription splitting', () => {
  const parsed = inspectMvuOpening('Hi<UpdateVariable>_.set("hp", 10, 9)</UpdateVariable>')
  assert.equal(parsed.text, 'Hi')
  assert.deepEqual(materializeMvuInitialValue({ initialValue: { hp: [10, 'range'] } }, parsed), { hp: [9, 'range'] })
  const analyzed = inspectMvuOpening('Hi<UpdateVariable><Analysis>Check old value; keep description.</Analysis>_.set("stat_data.hp", 10, 8)</UpdateVariable>')
  assert.deepEqual(materializeMvuInitialValue({ initialValue: { hp: [10, 'range'] } }, analyzed), { hp: [8, 'range'] })
  const malformed = inspectMvuOpening('Visible<UpdateVariable>_.set("hp", 10, 1)')
  assert.equal(malformed.text, 'Visible')
  assert.equal(malformed.diagnostics[0].code, 'MVU_CONTROL_BLOCK_MALFORMED')
  const ignoredOperation = inspectMvuOpening('Visible<UpdateVariable>window.alert(1)</UpdateVariable>')
  assert.equal(ignoredOperation.text, 'Visible')
  assert.equal(ignoredOperation.diagnostics[0].code, 'MVU_OPERATION_LOGIC_IGNORED')
  const ignoredOperationState = materializeNativeMvuState({ initialValue: { hp: 10 }, diagnostics: ignoredOperation.diagnostics })
  assert.equal(ignoredOperationState.namespaces[0].definition.updateMode, 'schema-only')
  assert.equal(parseOpeningUpdateBlock('<UpdateVariable>_.add("hp", 1)</UpdateVariable>').ok, true)
  assert.equal(parseOpeningUpdateBlock('<UpdateVariable>window.alert(1)</UpdateVariable>').ok, false)
  assert.equal(parseOpeningUpdateBlock('<UpdateVariable>_.set("hp", Math.max(1, 2))</UpdateVariable>').ok, false)
  const url = inspectMvuOpening('Hi<UpdateVariable>_.set("url", "https://example.com/a//b");// keep URL</UpdateVariable>')
  assert.equal(materializeMvuInitialValue({ initialValue: { url: 'old' } }, url).url, 'https://example.com/a//b')
  const alias = inspectMvuOpening('Hi<update>_.set("hp", 7)</update><json_patch>[{"op":"replace","path":"/hp","value":1}]</json_patch>')
  assert.equal(alias.text, 'Hi')
  assert.deepEqual(materializeMvuInitialValue({ initialValue: { hp: 10 } }, alias), { hp: 7 })
  assert.deepEqual(alias.diagnostics.map(item => item.code), ['MVU_OPERATION_LOGIC_IGNORED'])
  const malformedAlias = inspectMvuOpening('Visible<update>_.set("hp", 1)')
  assert.equal(malformedAlias.text, 'Visible')
  assert.equal(malformedAlias.diagnostics[0].code, 'MVU_CONTROL_BLOCK_MALFORMED')
  const split = splitMvuValue({ hp: [8, '当前生命值'], score: [5, null], nested: { trust: [20, '信任程度'] } })
  assert.deepEqual(split.value, { hp: 8, score: 5, nested: { trust: 20 } })
  assert.equal(split.schema.properties.hp.description, '当前生命值')
  assert.equal(Object.hasOwn(split.schema.properties.score, 'description'), false)
  assert.equal(split.schema.properties.nested.properties.trust.description, '信任程度')
  assert.deepEqual(createMvuCompatibilityView(split.value, split.schema), { hp: [8, '当前生命值'], score: 5, nested: { trust: [20, '信任程度'] } })
})

test('applies the current MVU Zod command set and legacy aliases against one fixed schema', () => {
  const opening = [
    'Hello',
    '<UpdateVariable>',
    "_.set('score', 10, 12);",
    "_.add('score', 3);",
    "_.insert('tags', 1, 'middle');",
    "_.assign('history', 'second');",
    "_.insert('profile', 'nickname', 'N');",
    "_.delete('profile', 'obsolete');",
    "_.unset('profile.temp');",
    "_.remove('tags', 'first');",
    "_.move('profile.nickname', 'profile.alias');",
    '</UpdateVariable>',
  ].join('\n')
  const source = { data: {
    extensions: { stat_data: {
      score: [10, '积分'],
      tags: ['$__META_EXTENSIBLE__$', 'first', 'last'],
      history: ['$__META_EXTENSIBLE__$', 'first'],
      profile: {
        $meta: { extensible: true, required: ['name'], template: {} },
        name: 'A',
        obsolete: 'remove me',
        temp: 'remove me too',
      },
    } },
    first_mes: opening,
  } }
  const result = materializeMvuProfile({
    profile: {
      resources: { card: { id: 'zod-commands' }, lorebooks: [] },
      scene: { openingSource: 'card', openingIndex: 0, openingText: 'Hello' },
    },
    character: { id: 'zod-commands', firstMessage: 'Hello', alternateGreetings: [] },
    source,
    books: [],
  })
  const story = result.stateBootstrap.namespaces[0]
  assert.deepEqual(story.initialValue, {
    score: 15,
    tags: ['middle', 'last'],
    history: ['first', 'second'],
    profile: { name: 'A', alias: 'N' },
  })
  assert.equal(story.definition.schema.properties.score.description, '积分')
  assert.equal(story.diagnostics.setup.some(item => item.code === 'MVU_OPERATION_LOGIC_IGNORED'), false)
})

test('rejects a schema-invalid opening command list atomically', () => {
  const opening = [
    'Hello',
    '<UpdateVariable>',
    "_.set('hp', 10, 9);",
    "_.insert('tags', {'invalid': true});",
    '</UpdateVariable>',
  ].join('\n')
  const result = materializeMvuProfile({
    profile: {
      resources: { card: { id: 'atomic-zod' }, lorebooks: [] },
      scene: { openingSource: 'card', openingIndex: 0, openingText: 'Hello' },
    },
    character: { id: 'atomic-zod', firstMessage: 'Hello', alternateGreetings: [] },
    source: { data: {
      extensions: { stat_data: {
        hp: [10, '生命值'],
        tags: ['$__META_EXTENSIBLE__$', 'known'],
      } },
      first_mes: opening,
    } },
    books: [],
  })
  const story = result.stateBootstrap.namespaces[0]
  assert.deepEqual(story.initialValue, { hp: 10, tags: ['known'] })
  assert.match(
    story.diagnostics.setup.find(item => item.code === 'MVU_OPERATION_LOGIC_IGNORED').message,
    /第 2 条 _\.insert 未生效/,
  )
})

test('supports safe Lodash-style paths and caps their complete depth', () => {
  const bracket = parseOpeningUpdateBlock(`<UpdateVariable>_.set('角色["名字.带点"].数值', 2)</UpdateVariable>`)
  assert.deepEqual(bracket.updates[0].segments, ['角色', '名字.带点', '数值'])
  const createdArray = inspectMvuOpening(`<UpdateVariable>_.set('列表[0].值', 1)</UpdateVariable>`)
  assert.deepEqual(materializeMvuInitialValue({ initialValue: {} }, createdArray), { 列表: [{ 值: 1 }] })
  const exact = Array.from({ length: 64 }, (_, index) => `p${index}`).join('.')
  const excessive = `${exact}.p64`
  assert.equal(parseOpeningUpdateBlock(`<UpdateVariable>_.set('${exact}', 1)</UpdateVariable>`).ok, true)
  assert.equal(parseOpeningUpdateBlock(`<UpdateVariable>_.set('${excessive}', 1)</UpdateVariable>`).ok, false)
  assert.equal(parseOpeningUpdateBlock(`<UpdateVariable>_.set('_private.value', 1)</UpdateVariable>`).ok, false)
})

test('renders the safe EJS subset, dynamic values and literal getwi references in the adapter', () => {
  const controller = [
    '<%_',
    "if (typeof score === 'undefined') var score = getvar('stat_data.角色.数值', { defaults: 0 });",
    '_%>',
    '<%_ if (score >= 80) { _%>',
    "<%- await getwi(null, '角色_高阶段') %>",
    '<%_ } else if (score >= 20) { _%>',
    "<%- await getwi(null, '角色_中阶段') %>",
    '<%_ } else { _%>',
    "<%- await getwi(null, '角色_低阶段') %>",
    '<%_ } _%>',
  ].join('\n')
  const entries = [
    { id: 'init', name: '[InitVar] seed', content: '{"score":0}', keys: [], secondaryKeys: [] },
    { id: 'controller', name: '阶段控制器', content: controller, keys: [], secondaryKeys: [] },
    { id: 'high', name: '角色高阶段', content: '高阶段正文', keys: [], secondaryKeys: [] },
    { id: 'middle', name: '角色中阶段', content: '中阶段正文 {{getvar::stat_data.角色.数值}}', keys: [], secondaryKeys: [] },
    { id: 'low', name: '角色低阶段', content: '低阶段正文', keys: [], secondaryKeys: [] },
  ]
  const book = { id: 'stages', entries }
  const adapter = createMvuLoreActivation({
    revision: 4,
    namespaces: { story: { revision: 2, value: { 角色: { 数值: 40 } }, definition: { schema: {} } } },
  }, 'story')
  const rendered = renderWithAdapter(book, entries[1], adapter)
  assert.equal(rendered.content.trim(), '中阶段正文 40')
  const initializer = renderWithAdapter(book, entries[0], adapter)
  assert.equal(initializer.exclude, true)
  assert.equal(initializer.diagnostics[0].reason, 'compat-control-entry')

  const aliases = {
    id: 'aliases',
    name: '只读别名',
    content: [
      "<% const hp = _.get(stat_data, '角色.数值', 0); %>",
      "<% if (_.has(display_data, '角色.数值')) { %>",
      "<%= hp %>/<%= getvar('state.不存在', 6) %>/<%= state.角色.数值 %>",
      '<% } %>',
    ].join(''),
    keys: [],
    secondaryKeys: [],
  }
  assert.equal(renderWithAdapter(book, aliases, adapter).content, '40/6/40')

  const communitySyntax = {
    id: 'community-syntax',
    name: '社区 EJS 外壳',
    content: [
      "<% const score = getvar('state.角色.数值', 0); %>",
      '<%# 这是一条只读模板注释 %>',
      '<% if (score >= 20) { %><% if (score < 80) { %>nested<% } } %>',
      '<% if (score === null) { %>null<% } else { /* score is available */ %>ok<% } %>',
    ].join(''),
    keys: [],
    secondaryKeys: [],
  }
  assert.equal(renderWithAdapter(book, communitySyntax, adapter).content, 'nestedok')
})

test('fails closed for executable or malformed templates and leaves unrelated macros literal', () => {
  const book = { id: 'unsafe', entries: [
    { id: 'exec', name: 'exec', content: '<% setvar("score", 10) %>unsafe', keys: [], secondaryKeys: [] },
    { id: 'broken', name: 'broken', content: '<% if (true) { %>broken', keys: [], secondaryKeys: [] },
    { id: 'literal', name: 'literal', content: '{{setvar::score::10}} {{random::A::B}}', keys: [], secondaryKeys: [] },
  ] }
  const adapter = createMvuLoreActivation({ revision: 0, namespaces: {} }, 'story')
  assert.throws(() => renderWithAdapter(book, book.entries[0], adapter), /unsupported/)
  assert.throws(() => renderWithAdapter(book, book.entries[1], adapter), /unclosed/)
  assert.equal(renderWithAdapter(book, book.entries[2], adapter).content, '{{setvar::score::10}} {{random::A::B}}')
})

test('classifies all legacy MVU operation and variable-output dialects as compatibility controls', () => {
  assert.equal(isMvuControlEntry({ name: 'legacy update', content: '<update>_.add("hp", 1)</update>' }), true)
  assert.equal(isMvuControlEntry({ name: 'legacy patch', content: '<json_patch>[]</json_patch>' }), true)
  assert.equal(isMvuControlEntry({ name: 'standalone operation', content: '_.set("hp", 10)' }), true)
  assert.equal(isMvuControlEntry({ name: 'standalone insert', content: '_.insert("tags", "new")' }), true)
  assert.equal(isMvuControlEntry({ name: 'standalone move', content: '_.move("old", "next")' }), true)
  assert.equal(isMvuControlEntry({ name: '变量列表', content: '{{format_message_variable::stat_data}}' }), true)
})

test('selects schema-only, rules-required, or disabled based on conversion safety', () => {
  const plain = materializeNativeMvuState({ initialValue: { hp: [10, '当前生命值'] } })
  assert.equal(plain.namespaces[0].definition.updateMode, 'schema-only')
  assert.deepEqual(plain.namespaces[0].initialValue, { hp: 10 })

  const safe = materializeNativeMvuState({
    initialValue: { hp: 10 },
    source: { data: { character_book: { entries: [{
      comment: '[mvu_update]变量更新规则',
      content: '变量更新规则:\n  hp:\n    type: number\n    range: 0~20\n    check:\n      - 单次变化范围为【-2, +3】。',
    }, {
      comment: '[mvu_update]变量输出格式',
      content: '变量输出格式:\n  format: <UpdateVariable><JSONPatch>RFC 6902</JSONPatch></UpdateVariable>',
    }] } } },
  })
  assert.equal(safe.namespaces[0].definition.updateMode, 'rules-required')
  assert.equal(safe.namespaces[0].definition.rules[0].effect.op, 'increment')

  const operationOnly = materializeNativeMvuState({
    initialValue: { hp: 10 },
    source: { data: { character_book: { entries: [{
      comment: '[mvu_update]变量更新规则',
      content: '变量更新规则:\n  hp:\n    script: _.set("hp", 1)',
    }] } } },
  })
  assert.equal(operationOnly.namespaces[0].definition.updateMode, 'schema-only')
  assert.deepEqual(operationOnly.namespaces[0].definition.rules, [])
  assert.ok(operationOnly.namespaces[0].diagnostics.setup.some(item => item.code === 'MVU_OPERATION_LOGIC_IGNORED'))

  const unsafe = materializeNativeMvuState({
    initialValue: { hp: 10 },
    source: { data: { character_book: { entries: [{
      comment: '[mvu_update]变量更新规则',
      content: '变量更新规则:\n  hp:\n    check: 根据剧情变化\n    unknownSemanticField: true',
    }] } } },
  })
  assert.equal(unsafe.namespaces[0].definition.updateMode, 'disabled')
  assert.ok(unsafe.namespaces[0].diagnostics.setup.some(item => item.code === 'MVU_STATE_DISABLED'))
})

test('reconstructs ValueWithDescription only inside the temporary MVU template view', () => {
  const adapter = createMvuLoreActivation({
    revision: 2,
    namespaces: { story: {
      revision: 1,
      value: { hp: 8 },
      definition: { schema: { type: 'object', properties: { hp: { type: 'integer', description: '当前生命值' } } } },
    } },
  }, 'story')
  const book = { id: 'pair', entries: [] }
  const entry = { id: 'pair-view', name: 'pair view', content: '{{getvar::stat_data.hp[0]}} / {{getvar::display_data.hp[1]}}', keys: [], secondaryKeys: [] }
  assert.equal(renderWithAdapter(book, entry, adapter).content, '8 / 当前生命值')
})

test('registers only public adapters and never scans conversation output for control blocks', () => {
  const dependencies = []
  let transformer
  let loreAdapter
  applyMvuPlugin({
    inject(names, callback) {
      dependencies.push(names)
      if (names.length === 1 && names[0] === 'rpLoreBooks') {
        callback({
          rpLoreBooks: { registerActivationAdapter(definition) { loreAdapter = definition; return () => {} } },
          get() { return undefined },
        })
      }
      if (names.length === 1 && names[0] === 'rpRuntime') {
        callback({
          rpRuntime: {
            registerTextTransformer(definition) {
              transformer = definition
              return () => {}
            },
          },
        })
      }
    },
  })
  assert.deepEqual(dependencies, [
    ['rpCharacterCards'],
    ['rpSessionBootstrap'],
    ['rpSessions'],
    ['rpLoreBooks'],
    ['rpRuntime'],
  ])
  assert.equal(typeof loreAdapter.prepare({ agent: {}, profile: { resources: { lorebooks: [] } } }).transformEntry, 'function')
  const controlled = 'Hello <UpdateVariable>_.set("hp", 10, 9)</UpdateVariable>'
  assert.equal(transformer.transform(controlled, { phase: 'opening' }), 'Hello')
  assert.equal(transformer.transform(controlled, { phase: 'context', sourceId: 'rp.card' }), 'Hello')
  assert.equal(transformer.transform(controlled, { phase: 'context', sourceId: 'rp.persona' }), controlled)
  assert.equal(transformer.transform(controlled, { phase: 'output' }), controlled)
})

function renderWithAdapter(book, entry, adapter, ancestors = []) {
  return adapter.transformEntry({
    book,
    entry,
    content: entry.content,
    keys: entry.keys,
    secondaryKeys: entry.secondaryKeys,
    resolveEntry(name) {
      const target = book.entries.find(candidate => candidate.name.replace(/[\s_-]+/g, '') === name.replace(/[\s_-]+/g, ''))
      if (target === undefined || ancestors.includes(target.id)) return ''
      return renderWithAdapter(book, target, adapter, [...ancestors, entry.id]).content
    },
  })
}
