import assert from 'node:assert/strict'
import test from 'node:test'
import { currentSessionBindingIds, readyBindingItems, sessionBindingRequest, sessionBindingSpec } from '../src/session-binding.js'

const profile = {
  resources: {
    card: { id: 'card-a' },
    lorebooks: [{ id: 'lore-a' }, { id: 'lore-b' }],
    persona: { id: 'persona-a' },
    preset: { id: 'preset-a' },
    writingStyles: [{ id: 'style-a' }, { id: 'style-b' }],
  },
}

test('Session Wiki binding requests update only the selected resource field', () => {
  assert.deepEqual(sessionBindingRequest('character', ['card-b']), { cardId: 'card-b' })
  assert.deepEqual(sessionBindingRequest('lorebooks', ['lore-b', 'lore-a']), { lorebookIds: ['lore-b', 'lore-a'] })
  assert.deepEqual(sessionBindingRequest('persona', ['persona-b']), { personaId: 'persona-b' })
  assert.deepEqual(sessionBindingRequest('preset', ['preset-b']), { presetId: 'preset-b' })
  assert.deepEqual(sessionBindingRequest('writingStyles', ['style-b']), { writingStyleIds: ['style-b'] })
  assert.throws(() => sessionBindingRequest('preset', []), /exactly one selection/)
  assert.throws(() => sessionBindingRequest('writingStyles', ['style-b', 'style-b']), /duplicate/)
})

test('Session Wiki reads current bindings without resolving or removing stale ids', () => {
  assert.deepEqual(currentSessionBindingIds(profile, 'character'), ['card-a'])
  assert.deepEqual(currentSessionBindingIds(profile, 'lorebooks'), ['lore-a', 'lore-b'])
  assert.deepEqual(currentSessionBindingIds(profile, 'persona'), ['persona-a'])
  assert.deepEqual(currentSessionBindingIds(profile, 'preset'), ['preset-a'])
  assert.deepEqual(currentSessionBindingIds(profile, 'writingStyles'), ['style-a', 'style-b'])
})

test('Session Wiki does not offer corrupt library rows for binding', () => {
  assert.equal(sessionBindingSpec('preset').listEndpoint, 'presets/list')
  assert.deepEqual(readyBindingItems([
    { id: 'ready', name: '可用' },
    { id: 'broken', name: '损坏', status: 'corrupt' },
    null,
  ]).map(item => item.id), ['ready'])
})
