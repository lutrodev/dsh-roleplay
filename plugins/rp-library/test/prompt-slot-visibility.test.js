import assert from 'node:assert/strict'
import test from 'node:test'
import { previewIncludedSourceIds, selectPreviewSlots, selectWorkbenchSlots } from '../src/prompt-slot-visibility.js'

const slots = [
  { id: 'persona', label: '人设信息', sourceIds: [], locked: false },
  { id: 'rp.state', label: '会话变量', sourceIds: [], locked: false },
  { id: 'custom-4', label: '自定义 4', sourceIds: [], locked: false },
  { id: 'conversation', label: '对话历史', sourceIds: ['rp.conversation'], locked: false },
]
const sources = [
  { id: 'rp.persona', available: false, defaultSlot: { id: 'persona' } },
  { id: 'rp.state', available: false, defaultSlot: { id: 'rp.state' } },
  { id: 'rp.conversation', available: true, defaultSlot: { id: 'conversation' } },
  { id: 'rp.current-input', required: true, available: false, defaultSlot: { id: 'current-input' } },
]

test('Prompt workbench hides empty registered slots without hiding editable custom slots', () => {
  assert.deepEqual(
    selectWorkbenchSlots(slots, sources, false).map(slot => slot.id),
    ['rp.state', 'custom-4', 'conversation'],
  )
})

test('Prompt workbench hides the State slot when the State capability is not registered', () => {
  assert.deepEqual(
    selectWorkbenchSlots(slots, sources.filter(source => source.id !== 'rp.state'), false).map(slot => slot.id),
    ['custom-4', 'conversation'],
  )
})

test('Prompt workbench reveals empty registered slots while dragging', () => {
  assert.deepEqual(selectWorkbenchSlots(slots, sources, true), slots)
})

test('Prompt workbench keeps the required current input position visible while it is waiting for text', () => {
  const waiting = [...slots, { id: 'current-input', label: '当前输入', sourceIds: ['rp.current-input'], locked: false }]
  assert.deepEqual(selectWorkbenchSlots(waiting, sources, false).map(slot => slot.id), ['rp.state', 'custom-4', 'conversation', 'current-input'])
})

test('Prompt preview omits every slot that contributes no content', () => {
  assert.deepEqual(selectPreviewSlots(slots).map(slot => slot.id), ['conversation'])
})

test('Prompt preview adds required generation-time placeholders to the effective source set', () => {
  const restored = [...slots, { id: 'current-input', label: '当前输入', sourceIds: ['rp.current-input'], locked: false }]
  const included = previewIncludedSourceIds(sources, [sources[2]])
  assert.deepEqual(selectPreviewSlots(restored, included).map(slot => slot.id), ['conversation', 'current-input'])
})

test('Prompt preview excludes idle slots even when their sources have content', () => {
  const parked = [
    ...slots,
    { id: 'parked', label: '闲置资料', sourceIds: ['rp.persona'], idle: true },
  ]
  assert.deepEqual(selectPreviewSlots(parked).map(slot => slot.id), ['conversation'])
  assert.deepEqual(selectPreviewSlots(parked, new Set(['rp.conversation', 'rp.persona'])).map(slot => slot.id), ['conversation'])
})
