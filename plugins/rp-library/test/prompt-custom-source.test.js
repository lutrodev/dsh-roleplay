import assert from 'node:assert/strict'
import test from 'node:test'
import {
  customPromptSource,
  customPromptSourceId,
  hydratePromptSlots,
  serializePromptContextBuild,
} from '../src/prompt-custom-source.js'

test('custom Prompt content hydrates, edits its label and serializes into the same Session slot', () => {
  const sourceId = customPromptSourceId('custom-3')
  const [slot] = hydratePromptSlots(
    [{ id: 'custom-3', label: '补充背景', sourceIds: [sourceId] }],
    [{ slotId: 'custom-3', content: '  雨夜持续了三天。  ' }],
  )
  slot.label = '天气背景'
  assert.equal(slot.customContent, '  雨夜持续了三天。  ')
  assert.deepEqual(serializePromptContextBuild([slot]), {
    version: 1,
    slots: [{ id: 'custom-3', label: '天气背景', sourceIds: [sourceId], sectionTag: true }],
    customSources: [{ slotId: 'custom-3', content: '雨夜持续了三天。' }],
  })
  assert.deepEqual(customPromptSource(slot), {
    id: sourceId,
    label: '天气背景',
    description: '当前对话中手动添加的回复资料。',
    kind: 'runtime',
    available: true,
    characters: 8,
    defaultSlot: { id: 'custom-3', label: '天气背景' },
    text: '雨夜持续了三天。',
  })
})

test('blank custom Prompt content stays editable without creating a model-visible source', () => {
  const [slot] = hydratePromptSlots([{ id: 'custom-1', label: '自定义 1', sourceIds: [], idle: true }])
  slot.customContent = '  '
  assert.deepEqual(serializePromptContextBuild([slot]), {
    version: 1,
    slots: [{ id: 'custom-1', label: '自定义 1', sourceIds: [], idle: true, sectionTag: true }],
  })
  slot.sectionTag = false
  assert.equal(serializePromptContextBuild([slot]).slots[0].sectionTag, false)
  assert.equal(customPromptSource(slot), undefined)
})
