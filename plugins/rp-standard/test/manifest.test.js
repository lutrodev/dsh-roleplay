import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import test from 'node:test'

const require = createRequire(import.meta.url)

test('feature manager bundle provides the preset and every independently owned browser capability', async () => {
  const patch = await readFile(new URL('../../rp-feature-manager/cordis.patch.yml', import.meta.url), 'utf8')
  assert.equal(patch.match(/id: rp-feature-manager/g)?.length, 1)
  assert.equal(patch.match(/id: rp-standard/g)?.length, 1)
  assert.equal(patch.match(/id: rp-library/g)?.length, 1)
  assert.equal(patch.match(/id: rp-character-library/g)?.length, 1)
  assert.equal(patch.match(/id: rp-lore-library/g)?.length, 1)
  assert.equal(patch.match(/id: rp-persona/g)?.length, 1)
  assert.equal(patch.match(/id: rp-preset/g)?.length, 1)
  assert.equal(patch.match(/id: rp-writing-style/g)?.length, 1)
  assert.equal(patch.match(/id: rp-mvu-import/g)?.length, 1)
  assert.equal(patch.match(/id: rp-message-actions/g)?.length, 1)
  assert.equal(patch.match(/id: rp-message-avatar/g)?.length, 1)
  assert.equal(patch.match(/id: rp-dialogue-highlight/g)?.length, 1)
  assert.equal(patch.match(/exposeBrowser: true/g)?.length, 6)
  assert.equal(patch.match(/registerTool: false/g)?.length, 2)
  assert.equal(patch.includes('id: rp-core'), false)
  for (const name of ['规划', '润色']) assert.match(patch, new RegExp(`name: ${name}`))
  assert.doesNotMatch(patch, /name: 大纲|name: 审稿/)
  assert.match(patch, /name: 规划[\s\S]*?description: \|-\n\s+叙事续写时必须在 Writer 前调用。传入本轮目标、已有剧情和人物信息/)
  assert.match(patch, /name: 润色[\s\S]*?description: \|-\n\s+适用范围：叙事续写。调用要求：必需。本节点必须在 Writer 后、最终正文与 rp_commit_turn 前通过 rp_run_subagent 调用。/)
  assert.equal(patch.match(/enabled: true/g)?.length, 2)
  assert.doesNotMatch(patch, /适合需要独立构思上下文|适合需要干净上下文/)
  assert.match(patch, /agentMaxStepsPerRun: 20/)
  assert.match(patch, /name: 规划[\s\S]*?给出约 150～250 字的剧情大纲[\s\S]*?剧情主线、关键转折和推进节奏[\s\S]*?情节从哪里走向哪里、停在哪里[\s\S]*?具体动作、对白、场景细节或描写[\s\S]*?交给 Writer/)
  assert.match(patch, /name: 润色[\s\S]*?只润色本次任务明确提供的初稿[\s\S]*?不是……而是……[\s\S]*?与其说……不如说……[\s\S]*?故事才刚刚开始/)
  assert.doesNotMatch(patch, /父代理|父对话|Writer 初稿/)
  assert.match(patch, /initialSubagents: \*rp_base_task_subagents/)
  assert.doesNotMatch(patch, /sample-character|sample-lore|seedAssets/)
})

test('browser asset packages expose package metadata for Harness client discovery', () => {
  const assetPackages = [
    'dsh-roleplay-rp-character-card',
    'dsh-roleplay-rp-lore-book',
    'dsh-roleplay-rp-persona',
    'dsh-roleplay-rp-preset',
    'dsh-roleplay-rp-writing-style',
  ]
  for (const packageName of assetPackages) {
    const packagePath = require.resolve(`${packageName}/package.json`)
    assert.match(packagePath, /package\.json$/)
    assert.ok(require(packagePath).files.includes('skills/**'))
  }
  for (const packageName of [
    'dsh-roleplay-rp-subagent-manager',
    'dsh-roleplay-rp-library',
    'dsh-roleplay-rp-message-actions',
    'dsh-roleplay-rp-message-avatar',
    'dsh-roleplay-rp-dialogue-highlight',
  ]) {
    assert.match(require.resolve(`${packageName}/package.json`), /package\.json$/)
  }
})

test('foundational plugins never depend on the optional MVU adapter', async () => {
  const adapter = 'dsh-roleplay-rp-compat-mvu'
  const foundations = [
    ['rp-character-card', 'dsh-roleplay-rp-character-card'],
    ['rp-lore-book', 'dsh-roleplay-rp-lore-book'],
    ['rp-library', 'dsh-roleplay-rp-library'],
    ['rp-state', 'dsh-roleplay-rp-state'],
    ['rp-session', 'dsh-roleplay-rp-session'],
  ]
  for (const [directory, packageName] of foundations) {
    const manifest = JSON.parse(await readFile(new URL(`../../${directory}/package.json`, import.meta.url), 'utf8'))
    for (const field of ['dependencies', 'peerDependencies', 'devDependencies']) {
      assert.equal(Object.hasOwn(manifest[field] ?? {}, adapter), false, `${packageName} must not depend on ${adapter}`)
    }
  }
  const compatibility = JSON.parse(await readFile(new URL('../../rp-compat-mvu/package.json', import.meta.url), 'utf8'))
  for (const [, packageName] of foundations) {
    assert.equal(typeof compatibility.peerDependencies?.[packageName], 'string')
  }
})

test('Roleplay preset composes every standard Roleplay capability once', async () => {
  const patch = await readFile(new URL('../presets/roleplay/agent.cordis.yml', import.meta.url), 'utf8')
  const ids = ['core', 'subagent-manager', 'session', 'character-card', 'lore-book', 'state', 'compat-mvu', 'persona', 'macro', 'preset', 'writing-style', 'asset-tools']
  for (const id of ids) assert.equal(patch.match(new RegExp(`id: rp-${id}`, 'g'))?.length, 1)
  assert.equal(patch.match(/exposeBrowser: false/g)?.length, 6)
  assert.equal(patch.match(/registerTool: true/g)?.length, 2)
  assert.equal(patch.match(/id: tool-web/g)?.length, 1)
  assert.equal(patch.match(/id: tool-presentation/g)?.length, 1)
  assert.match(patch, /id: tool-presentation[\s\S]*?mode: native/)
  assert.equal(patch.match(/id: tool-ask-user/g)?.length, 1)
  assert.equal(patch.match(/id: skill-filesystem/g)?.length, 1)
  assert.match(patch, /customSkillDirs:\s+- __ROLEPLAY_SKILL_DIR__/)
  assert.equal(patch.match(/id: tool-skill/g)?.length, 1)
  assert.equal(patch.match(/id: compaction-basic/g)?.length, 1)
  assert.equal(patch.match(/id: tool-result-pruner/g)?.length, 1)
  assert.equal(patch.match(/id: tool-subagent/g)?.length ?? 0, 0)
  assert.match(patch, /fetch: false/)
  assert.match(patch, /rpSubagentManager: true/)
  assert.match(patch, /id: rp-subagent-manager[\s\S]*?name: __RP_SUBAGENT_MANAGER_MODULE__[\s\S]*?exposeBrowser: false/)
  assert.match(patch, /initialSubagents: __INITIAL_SUBAGENTS__/)
  assert.match(patch, /text: __RP_PERSONA_TEXT__/)
  for (const tool of ['tool-bash', 'str-replace-editor', 'tool-fs', 'tool-goal', 'plan-mode', 'tool-todo', 'tool-workflow']) {
    assert.equal(patch.includes(tool), false)
  }
})
