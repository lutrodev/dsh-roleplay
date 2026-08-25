import assert from 'node:assert/strict'
import test from 'node:test'
import { AssetEditorRegistry } from '../src/asset-editor-registry.js'

test('canonical asset editor registrations are unique, observable, and disposable', () => {
  const registry = new AssetEditorRegistry()
  const versions = []
  const unsubscribe = registry.subscribe(() => versions.push(registry.getVersion()))
  const Editor = () => null
  const dispose = registry.register('character', Editor)

  assert.equal(registry.get('character'), Editor)
  assert.deepEqual(versions, [1])
  assert.throws(() => registry.register('character', () => null), /already registered/)

  dispose()
  dispose()
  assert.equal(registry.get('character'), undefined)
  assert.deepEqual(versions, [1, 2])
  unsubscribe()
})

test('canonical asset editor registry rejects unknown kinds and non-components', () => {
  const registry = new AssetEditorRegistry()
  assert.throws(() => registry.register('unknown', () => null), /Unknown Roleplay asset editor kind/)
  assert.throws(() => registry.register('persona', {}), /must be a component/)
})
