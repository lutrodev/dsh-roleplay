import assert from 'node:assert/strict'
import test from 'node:test'
import * as Plugin from '../src/index.js'

test('exports only the standard function-plugin interface', () => {
  assert.deepEqual(Object.keys(Plugin).sort(), ['Config', 'apply', 'inject', 'name'])
  assert.deepEqual(Plugin.inject, ['rpRuntime', 'rpSessions'])
})

test('freezes card and persona identities for one prepared run', async () => {
  let definition
  let persona = { id: 'persona-1', revision: 4, name: '林澈' }
  let character = { id: 'card-1', revision: 2, name: '莱安娜' }
  const ctx = {
    rpRuntime: { registerTextTransformer(value) { definition = value } },
    rpSessions: { get() { return { resources: { persona: { id: 'persona-1' }, card: { id: 'card-1' } } } } },
    rpPersonas: { async get() { return persona } },
    rpCharacterCards: { async get() { return character } },
  }
  Plugin.apply(ctx)
  const prepared = await definition.prepare({ agent: {} })
  persona = { ...persona, revision: 5, name: '新名字' }
  character = { ...character, revision: 3, name: '新角色' }

  assert.equal(definition.transform('{{user}}与{{char}}', { prepared }), '林澈与莱安娜')
  assert.deepEqual(prepared.public, {
    cardId: 'card-1', cardRevision: 2, characterName: '莱安娜',
    personaId: 'persona-1', personaRevision: 4, userName: '林澈',
  })
  assert.equal(prepared.revision, 'card:card-1:2|persona:persona-1:4')
})

test('expands the pending card while preserving an unbound user identity', async () => {
  let definition
  Plugin.apply({
    rpRuntime: { registerTextTransformer(value) { definition = value } },
    rpSessions: { get() { throw new Error('supplied profile should win') } },
    rpPersonas: { async get() { throw new Error('persona should not be read') } },
    rpCharacterCards: { async get(id) { return { id, revision: 1, name: '莱安娜' } } },
  })
  const prepared = await definition.prepare({ profile: { resources: { card: { id: 'card-1' } } } })
  assert.equal(definition.transform('{{user}} / {{char}}', { prepared }), '{{user}} / 莱安娜')
})

test('keeps identity macros untouched when optional asset providers are not enabled', async () => {
  let definition
  Plugin.apply({
    rpRuntime: { registerTextTransformer(value) { definition = value } },
    rpSessions: { get() { return { resources: { persona: { id: 'persona-1' }, card: { id: 'card-1' } } } } },
  })
  const prepared = await definition.prepare({ agent: {} })
  assert.equal(definition.transform('{{user}} / {{char}}', { prepared }), '{{user}} / {{char}}')
  assert.equal(prepared.revision, 'card:unbound|persona:unbound')
})

test('treats a deleted bound character card as an unbound identity', async () => {
  let definition
  Plugin.apply({
    rpRuntime: { registerTextTransformer(value) { definition = value } },
    rpSessions: { get() { return { resources: { card: { id: 'deleted-card' } } } } },
    rpCharacterCards: {
      async get() { throw Object.assign(new Error('gone'), { code: 'ASSET_NOT_FOUND' }) },
    },
  })
  const prepared = await definition.prepare({ agent: {} })
  assert.equal(definition.transform('{{char}}', { prepared }), '{{char}}')
  assert.equal(prepared.revision, 'card:unbound|persona:unbound')
  assert.equal(prepared.public.cardId, null)
})
