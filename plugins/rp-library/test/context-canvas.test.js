import assert from 'node:assert/strict'
import test from 'node:test'
import {
  movePromptSlotToArea,
  movePromptSource,
  promptDragScrollDelta,
  promptSourceTone,
  promptToneIconName,
  promptSlotCanIdle,
  renderPlainPromptPreview,
  renderPromptSlotPreview,
  setPromptSlotIdle,
} from '../src/context-canvas.js'

test('独立文风来源沿用文风颜色分类', () => {
  assert.equal(promptSourceTone({ id: 'rp.writing-style:8aa0f7fd-38cc-4a37-aee5-c7ec33b8b12d' }), 'writing-style')
})

test('世界书和我的人设使用不同的颜色分类与语义图标', () => {
  const loreTone = promptSourceTone({ id: 'rp.lore.world-description' })
  const personaTone = promptSourceTone({ id: 'rp.persona' })
  assert.equal(loreTone, 'lore')
  assert.equal(personaTone, 'persona')
  assert.notEqual(loreTone, personaTone)
  assert.equal(promptToneIconName(loreTone), 'lore')
  assert.equal(promptToneIconName(personaTone), 'persona')
})

test('回复资料类型使用互不重复的图标', () => {
  const tones = ['character', 'conversation', 'state', 'lore', 'persona', 'preset', 'writing-style', 'session']
  const icons = tones.map(promptToneIconName)
  assert.equal(new Set(icons).size, tones.length)
  assert.equal(promptToneIconName('other'), 'attachment')
})

test('纯文本预览按当前分组顺序生成文档并保留资料原文', () => {
  const sources = new Map([
    ['card', { id: 'card', label: '角色卡', text: 'A < B & C' }],
    ['rule', { id: 'rule', label: '规则 "一"', text: '保持克制。' }],
    ['input', { id: 'rp.current-input', label: '当前输入', available: false, required: true }],
  ])
  const text = renderPlainPromptPreview([
    { id: 'character', label: '角色卡', sourceIds: ['card'] },
    { id: 'instructions', label: '重要规则', sourceIds: ['rule'] },
    { id: 'input', label: '当前输入', sourceIds: ['input'] },
  ], sources)

  assert.equal(text, `<section name="角色卡">
A < B & C
</section>
<section name="重要规则">
<item name="规则 &quot;一&quot;">
保持克制。
</item>
</section>
<section name="当前输入">
本轮用户消息会在开始生成时填入。
</section>`)
})

test('每个分组独立决定是否保留标签，展开内容与完整纯文本一致', () => {
  const sources = new Map([
    ['first', { id: 'first', label: '第一项', text: '保留 <section> 原文' }],
    ['second', { id: 'second', label: '第二项', text: '以及 & 符号' }],
  ])
  const slots = [
    { id: 'raw', label: '原文', sourceIds: ['first'], sectionTag: false },
    { id: 'tagged', label: '标签', sourceIds: ['second'], sectionTag: true },
  ]
  assert.equal(renderPromptSlotPreview(slots[0], sources), '保留 <section> 原文')
  assert.equal(renderPromptSlotPreview(slots[1], sources), `<section name="标签">
<item name="第二项">
以及 & 符号
</item>
</section>`)
  assert.equal(renderPlainPromptPreview(slots, sources), `${renderPromptSlotPreview(slots[0], sources)}\n${renderPromptSlotPreview(slots[1], sources)}`)
})

test('纯文本预览会跟随资料的当前顺序并处理空内容', () => {
  const sources = new Map([
    ['first', { id: 'first', label: '第一项', text: '一' }],
    ['second', { id: 'second', label: '第二项', text: '二' }],
  ])

  assert.equal(renderPlainPromptPreview([], sources), '')
  assert.match(renderPlainPromptPreview([
    { id: 'combined', label: '组合资料', sourceIds: ['second', 'first'] },
  ], sources), /第二项[\s\S]*二[\s\S]*第一项[\s\S]*一/)
})

test('闲置分组从预览中移除，并可在工作区与闲置区之间恢复', () => {
  const sources = new Map([
    ['optional', { id: 'optional', label: '可选资料', text: '暂时不用' }],
    ['rp.conversation', { id: 'rp.conversation', label: '对话历史', idleAllowed: false, text: '历史' }],
    ['rp.current-input', { id: 'rp.current-input', label: '当前输入', idleAllowed: false }],
  ])
  const slots = [
    { id: 'history', label: '对话历史', sourceIds: ['rp.conversation'] },
    { id: 'optional', label: '可选资料', sourceIds: ['optional'] },
    { id: 'input', label: '当前输入', sourceIds: ['rp.current-input'] },
  ]
  assert.equal(promptSlotCanIdle(slots[0], sources), false)
  assert.equal(promptSlotCanIdle(slots[1], sources), true)
  assert.equal(promptSlotCanIdle(slots[2], sources), false)
  assert.equal(setPromptSlotIdle(slots, 'history', true, sources), slots)

  const parked = setPromptSlotIdle(slots, 'optional', true, sources)
  assert.equal(parked.at(-1).idle, true)
  assert.doesNotMatch(renderPlainPromptPreview(parked, sources), /暂时不用/)

  const restored = setPromptSlotIdle(parked, 'optional', false, sources)
  assert.equal(restored[2].id, 'optional')
  assert.equal(Object.hasOwn(restored[2], 'idle'), false)
})

test('资料移动不会把闲置分组当作目标', () => {
  const sources = new Map([['source', { id: 'source', label: '资料' }]])
  const slots = [
    { id: 'active', label: '使用中', sourceIds: ['source'] },
    { id: 'idle', label: '闲置', sourceIds: [], idle: true },
  ]

  assert.equal(movePromptSource(slots, 'source', 'idle', sources), slots)
  assert.deepEqual(movePromptSource(slots, 'source', 'active', sources), slots)
})

test('会话总结可以更换分组但不能放入闲置区', () => {
  const sources = new Map([
    ['rp.conversation-summary', { id: 'rp.conversation-summary', label: '会话总结', idleAllowed: false, defaultSlot: { id: 'summary', label: '会话总结' } }],
    ['rp.conversation', { id: 'rp.conversation', label: '对话历史', idleAllowed: false, defaultSlot: { id: 'history', label: '对话历史' } }],
  ])
  const slots = [
    { id: 'summary', label: '会话总结', sourceIds: ['rp.conversation-summary'] },
    { id: 'history', label: '对话历史', sourceIds: ['rp.conversation'] },
  ]

  const moved = movePromptSource(slots, 'rp.conversation-summary', 'history', sources)
  assert.deepEqual(moved.map(slot => slot.sourceIds), [[], ['rp.conversation', 'rp.conversation-summary']])
  assert.equal(promptSlotCanIdle(moved[1], sources), false)
  assert.equal(setPromptSlotIdle(moved, 'history', true, sources), moved)
})

test('跨区域拖放按释放位置插入，并支持调整闲置区内顺序', () => {
  const sources = new Map([
    ['a', { id: 'a' }], ['b', { id: 'b' }], ['c', { id: 'c' }],
    ['i1', { id: 'i1' }], ['i2', { id: 'i2' }],
  ])
  const slots = [
    { id: 'a', label: 'A', sourceIds: ['a'] },
    { id: 'b', label: 'B', sourceIds: ['b'] },
    { id: 'c', label: 'C', sourceIds: ['c'] },
    { id: 'i1', label: 'I1', sourceIds: ['i1'], idle: true },
    { id: 'i2', label: 'I2', sourceIds: ['i2'], idle: true },
  ]

  const parked = movePromptSlotToArea(slots, 'b', true, 'i2', sources)
  assert.deepEqual(parked.map(slot => [slot.id, slot.idle === true]), [
    ['a', false], ['c', false], ['i1', true], ['b', true], ['i2', true],
  ])

  const restored = movePromptSlotToArea(parked, 'i2', false, 'c', sources)
  assert.deepEqual(restored.map(slot => [slot.id, slot.idle === true]), [
    ['a', false], ['i2', false], ['c', false], ['i1', true], ['b', true],
  ])

  const reordered = movePromptSlotToArea(restored, 'b', true, 'i1', sources)
  assert.deepEqual(reordered.filter(slot => slot.idle === true).map(slot => slot.id), ['b', 'i1'])
})

test('拖动到滚动区边缘时按距离产生连续滚动速度', () => {
  assert.equal(promptDragScrollDelta(200, 100, 200), 0)
  assert.equal(promptDragScrollDelta(100, 100, 200), -22)
  assert.equal(promptDragScrollDelta(300, 100, 200), 22)
  assert.equal(promptDragScrollDelta(100, 100, 200, true), -10)
  assert.equal(promptDragScrollDelta(Number.NaN, 100, 200), 0)
})
