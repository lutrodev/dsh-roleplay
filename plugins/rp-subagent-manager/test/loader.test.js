import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import test from 'node:test'
import { Context } from '@deepseek-ai/cordis'
import Group from '@deepseek-ai/cordis-plugin-group'
import Include from '@deepseek-ai/cordis-plugin-include'
import Loader from '@deepseek-ai/cordis-plugin-loader'
import * as Manager from '../src/index.js'

test('Loader gives Host and preset managers isolated service realms over one live catalog', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-subagent-loader-'))
  const catalogDir = join(root, 'shared-subagents')
  const configPath = join(root, 'cordis.yml')
  const context = new Context()
  let presetManager
  const probe = {
    name: 'preset-manager-probe',
    inject: ['rpSubagentManager'],
    apply(ctx) { presetManager = ctx.rpSubagentManager },
  }
  await writeFile(configPath, [
    '- id: host-manager',
    '  name: manager',
    '  config:',
    `    catalogDir: ${JSON.stringify(catalogDir)}`,
    '    maxSubagents: 8',
    '    maxNameCharacters: 80',
    '    maxDescriptionCharacters: 240',
    '    maxInstructionsCharacters: 20000',
    '    initialSubagents: &starter_subagents',
    '      - name: Starter outline',
    '        description: Example isolated outline task.',
    '        instructions: Return a bounded outline.',
    '        route: { kind: inherit }',
    '        tools: []',
    '    exposeBrowser: false',
    '- id: preset-realm',
    '  name: cordis:group',
    '  isolate:',
    '    rpSubagentManager: true',
    '  config:',
    '    - id: preset-manager',
    '      name: manager',
    '      config:',
    `        catalogDir: ${JSON.stringify(catalogDir)}`,
    '        maxSubagents: 8',
    '        maxNameCharacters: 80',
    '        maxDescriptionCharacters: 240',
    '        maxInstructionsCharacters: 20000',
    '        initialSubagents: *starter_subagents',
    '        exposeBrowser: false',
    '    - id: probe',
    '      name: probe',
    '',
  ].join('\n'))
  try {
    context.baseUrl = `${pathToFileURL(root).href}/`
    await context.plugin(Loader)
    context.loader.builtins.include = Include
    context.loader.builtins.group = Group
    const modules = new Map([['manager', Manager], ['probe', probe]])
    context.loader.internal = {
      version: 'v2',
      async import(specifier) {
        if (!modules.has(specifier)) throw new Error(`unexpected Loader import: ${specifier}`)
        return modules.get(specifier)
      },
    }
    await context.loader.create({ name: 'cordis:include', config: { path: pathToFileURL(configPath).href } })
    await context.loader.await()

    const hostManager = context.rpSubagentManager
    assert.ok(hostManager)
    assert.ok(presetManager)
    assert.notEqual(hostManager, presetManager)
    assert.equal(hostManager.catalogPath, presetManager.catalogPath)
    assert.deepEqual((await hostManager.list()).subagents.map(subagent => subagent.name), ['Starter outline'])
    const created = await hostManager.create({
      name: 'Proofreader',
      description: 'Check wording and continuity.',
      instructions: 'Return concise corrections only.',
      route: { kind: 'inherit' },
      tools: [],
    })
    assert.deepEqual((await presetManager.list()).subagents.map(subagent => subagent.id), [(await hostManager.list()).subagents[0].id, created.id])
  } finally {
    await context.fiber.dispose()
    await rm(root, { recursive: true, force: true })
  }
})
