import { randomUUID } from 'node:crypto'
import { lstat, mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import Schema from '@deepseek-ai/schemastery'
import { roleplayPersonaText } from 'dsh-roleplay-rp-core/prompts'
import { normalizeInitialSubagents } from 'dsh-roleplay-rp-subagent-manager'

const PRESET_ID = 'roleplay'
const PRESET_OWNER = 'dsh-roleplay-rp-standard'
// Bump whenever managed composition or bundled guidance Skill files change.
const PRESET_VERSION = 36
const MARKER_FILE = '.rp-standard.json'
const COMPOSITION_FILE = 'agent.cordis.yml'
const METADATA_FILE = 'preset.yml'
const TEMPLATE_URL = new URL('../presets/roleplay/agent.cordis.yml', import.meta.url)
const METADATA_URL = new URL('../presets/roleplay/preset.yml', import.meta.url)
const require = createRequire(import.meta.url)

const INITIAL_SUBAGENT_CONFIG = Schema.object({
  name: Schema.string().required(),
  description: Schema.string().required(),
  instructions: Schema.string().required(),
  enabled: Schema.boolean().default(true),
  route: Schema.object({
    kind: Schema.union(['inherit', 'fixed']).required(),
    provider: Schema.string(),
    model: Schema.string(),
  }).required(),
  tools: Schema.array(Schema.union(['web_search', 'skill'])).default([]),
})

const MODULES = {
  '__RP_CONVERSATION_SUMMARY_MODULE__': 'dsh-roleplay-rp-conversation-summary',
  '__RP_CONVERSATION_SUMMARY_BRIDGE_MODULE__': 'dsh-roleplay-rp-conversation-summary/bridge',
  '__COMMAND_COMPACT_MODULE__': '@deepseek-ai/dsh-command-compact',
  '__SKILL_FILESYSTEM_MODULE__': '@deepseek-ai/dsh-skill-filesystem',
  '__TERMINAL_MODULE__': '@deepseek-ai/dsh-terminal',
  '__TERMINAL_BASH_MODULE__': '@deepseek-ai/dsh-terminal-bash',
  '__TOOL_ASK_USER_MODULE__': '@deepseek-ai/dsh-tool-ask-user',
  '__TOOL_BASH_PERSISTENT_MODULE__': '@deepseek-ai/dsh-tool-bash-persistent',
  '__TOOL_PWSH_PERSISTENT_MODULE__': '@deepseek-ai/dsh-tool-pwsh-persistent',
  '__TOOL_RESULT_PRUNER_MODULE__': '@deepseek-ai/dsh-compaction-tool-result-pruner',
  '__TOOL_SKILL_MODULE__': '@deepseek-ai/dsh-tool-skill',
  '__TOOL_STR_REPLACE_EDITOR_MODULE__': '@deepseek-ai/dsh-tool-str-replace-editor',
  '__TOOL_WEB_MODULE__': '@deepseek-ai/dsh-tool-web',
  '__TOOL_PRESENTATION_MODULE__': '@deepseek-ai/dsh-agent-tool-presentation',
  '__RP_CORE_MODULE__': 'dsh-roleplay-rp-core',
  '__RP_SUBAGENT_MANAGER_MODULE__': 'dsh-roleplay-rp-subagent-manager',
  '__RP_SESSION_MODULE__': 'dsh-roleplay-rp-session',
  '__RP_CHARACTER_CARD_MODULE__': 'dsh-roleplay-rp-character-card',
  '__RP_STATE_MODULE__': 'dsh-roleplay-rp-state',
  '__RP_COMPAT_MVU_MODULE__': 'dsh-roleplay-rp-compat-mvu',
  '__RP_LORE_BOOK_MODULE__': 'dsh-roleplay-rp-lore-book',
  '__RP_PERSONA_MODULE__': 'dsh-roleplay-rp-persona',
  '__RP_MACRO_MODULE__': 'dsh-roleplay-rp-macro',
  '__RP_PROMPT_PRESET_MODULE__': 'dsh-roleplay-rp-preset',
  '__RP_WRITING_STYLE_MODULE__': 'dsh-roleplay-rp-writing-style',
  '__RP_ASSET_TOOLS_MODULE__': 'dsh-roleplay-rp-asset-tools',
}

export const name = 'rp-standard'
export const inject = ['dshHomePath', 'rpFeatures']

export const Config = Schema.object({
  dataDir: Schema.string().required(),
  defaultMode: Schema.union(['adaptive', 'actor', 'director']).default('adaptive'),
  defaultExecutionMode: Schema.union(['chat', 'agent']).default('chat'),
  chatMaxStepsPerRun: Schema.number().default(5),
  agentMaxStepsPerRun: Schema.number().default(20),
  maxEffectsPerCommit: Schema.number().default(64),
  maxArtifactBytes: Schema.number().default(262144),
  maxNarrativeCharacters: Schema.number().default(200000),
  maxWriterBriefCharacters: Schema.number().default(4096),
  maxSubagentPromptCharacters: Schema.number().default(20000),
  maxSessionProfileBytes: Schema.number().default(262144),
  maxCardInputBytes: Schema.number().default(20971520),
  maxCardTextCharacters: Schema.number().default(2000000),
  maxStateNamespacesInContext: Schema.number().default(32),
  maxLoreInputBytes: Schema.number().default(2097152),
  maxLoreTokens: Schema.number().default(4096),
  maxLoreEntries: Schema.number().default(128),
  maxLoreRecursiveDepth: Schema.number().default(3),
  maxPersonaTextCharacters: Schema.number().default(30000),
  maxPresetTextCharacters: Schema.number().default(100000),
  maxPresetFields: Schema.number().default(32),
  maxWritingStyleTextCharacters: Schema.number().default(30000),
  maxWritingStylesPerSession: Schema.number().default(16),
  maxSubagents: Schema.number().default(32),
  maxSubagentNameCharacters: Schema.number().default(80),
  maxSubagentDescriptionCharacters: Schema.number().default(240),
  maxSubagentInstructionsCharacters: Schema.number().default(20000),
  initialSubagents: Schema.array(INITIAL_SUBAGENT_CONFIG).default([]),
})

/**
 * Install the managed Roleplay preset into the Harness user-preset roster.
 *
 * The Harness Web picker already owns preset selection. This host-side plugin
 * contributes the Roleplay composition through that existing boundary instead
 * of adding a second mode selector or making the runtime global.
 *
 * @param {import('@deepseek-ai/cordis').Context} ctx Harness context.
 * @param {Record<string, unknown>} config Standard Roleplay limits and storage.
 */
export async function apply(ctx, config) {
  validateConfig(config)
  const dshHomePath = ctx.get('dshHomePath')
  if (typeof dshHomePath !== 'function') throw new Error('rp-standard: dshHomePath is unavailable')
  const features = ctx.get('rpFeatures')
  if (features === undefined) throw new Error('rp-standard: Roleplay feature manager is unavailable')
  const presetDirectory = dshHomePath('.agent-presets', PRESET_ID)
  const install = async () => {
    features.assertCompatible()
    const files = await buildPresetFiles(config, presetDirectory, features)
    await installManagedPreset(presetDirectory, files)
  }
  let update = install()
  const dispose = features.subscribe(() => {
    update = update.then(install).catch(error => { ctx.logger.warn(error) })
    return update
  })
  ctx.effect(() => dispose, 'rp-standard: feature selection subscription')
  await update
}

/** @param {Record<string, unknown>} config */
function validateConfig(config) {
  if (typeof config.dataDir !== 'string' || config.dataDir.trim().length === 0) {
    throw new Error('rp-standard: dataDir must be a non-empty path')
  }
  const positive = [
    'chatMaxStepsPerRun', 'agentMaxStepsPerRun', 'maxEffectsPerCommit', 'maxArtifactBytes', 'maxNarrativeCharacters', 'maxWriterBriefCharacters', 'maxSubagentPromptCharacters', 'maxSessionProfileBytes',
    'maxCardInputBytes', 'maxCardTextCharacters', 'maxStateNamespacesInContext',
    'maxLoreInputBytes', 'maxLoreTokens', 'maxLoreEntries',
    'maxPersonaTextCharacters', 'maxPresetTextCharacters', 'maxPresetFields', 'maxWritingStyleTextCharacters', 'maxWritingStylesPerSession',
    'maxSubagents', 'maxSubagentNameCharacters', 'maxSubagentDescriptionCharacters', 'maxSubagentInstructionsCharacters',
  ]
  for (const key of positive) {
    if (!Number.isSafeInteger(config[key]) || config[key] < 1) {
      throw new Error(`rp-standard: ${key} must be a positive safe integer`)
    }
  }
  if (config.chatMaxStepsPerRun < 5) {
    throw new Error('rp-standard: chatMaxStepsPerRun must be at least 5 so Writer and commit failures both have recovery room')
  }
  if (!Number.isSafeInteger(config.maxLoreRecursiveDepth) || config.maxLoreRecursiveDepth < 0) {
    throw new Error('rp-standard: maxLoreRecursiveDepth must be a non-negative safe integer')
  }
  normalizeInitialSubagents(config.initialSubagents ?? [], {
    maxSubagents: config.maxSubagents,
    maxNameCharacters: config.maxSubagentNameCharacters,
    maxDescriptionCharacters: config.maxSubagentDescriptionCharacters,
    maxInstructionsCharacters: config.maxSubagentInstructionsCharacters,
  })
}

/**
 * Build a managed preset whose module rows remain stable across installations.
 * Bare package names are resolved by the Harness preset mount from the active profile.
 * @param {Record<string, unknown>} config
 */
async function buildPresetFiles(config, presetDirectory, features) {
  let composition = await readFile(TEMPLATE_URL, 'utf8')
  for (const [placeholder, packageName] of Object.entries(MODULES)) {
    if (!composition.includes(placeholder)) throw new Error(`rp-standard: preset template is missing ${placeholder}`)
    composition = composition.replaceAll(placeholder, JSON.stringify(packageName))
  }
  const dataDir = resolve(config.dataDir)
  const values = {
    '__RP_PERSONA_TEXT__': roleplayPersonaText({
      stateEnabled: features.isEnabled('state'),
    }),
    '__DEFAULT_MODE__': config.defaultMode,
    '__DEFAULT_EXECUTION_MODE__': config.defaultExecutionMode,
    '__CHARACTER_LIBRARY_DIR__': resolve(dataDir, 'characters'),
    '__LORE_LIBRARY_DIR__': resolve(dataDir, 'lorebooks'),
    '__PERSONA_LIBRARY_DIR__': resolve(dataDir, 'personas'),
    '__PROMPT_PRESET_LIBRARY_DIR__': resolve(dataDir, 'presets'),
    '__WRITING_STYLE_LIBRARY_DIR__': resolve(dataDir, 'writing-styles'),
    '__SUBAGENT_CATALOG_DIR__': resolve(dataDir, 'subagents'),
    '__ROLEPLAY_SKILL_DIR__': resolve(presetDirectory, 'skills'),
    '__CHAT_MAX_STEPS__': config.chatMaxStepsPerRun,
    '__AGENT_MAX_STEPS__': config.agentMaxStepsPerRun,
    '__MAX_EFFECTS__': config.maxEffectsPerCommit,
    '__MAX_ARTIFACT_BYTES__': config.maxArtifactBytes,
    '__MAX_NARRATIVE_CHARACTERS__': config.maxNarrativeCharacters,
    '__MAX_WRITER_BRIEF_CHARACTERS__': config.maxWriterBriefCharacters,
    '__MAX_SUBAGENT_PROMPT_CHARACTERS__': config.maxSubagentPromptCharacters,
    '__MAX_SESSION_PROFILE_BYTES__': config.maxSessionProfileBytes,
    '__MAX_CARD_INPUT_BYTES__': config.maxCardInputBytes,
    '__MAX_CARD_TEXT_CHARACTERS__': config.maxCardTextCharacters,
    '__MAX_STATE_NAMESPACES__': config.maxStateNamespacesInContext,
    '__MAX_LORE_INPUT_BYTES__': config.maxLoreInputBytes,
    '__MAX_LORE_TOKENS__': config.maxLoreTokens,
    '__MAX_LORE_ENTRIES__': config.maxLoreEntries,
    '__MAX_LORE_DEPTH__': config.maxLoreRecursiveDepth,
    '__MAX_PERSONA_TEXT_CHARACTERS__': config.maxPersonaTextCharacters,
    '__MAX_PRESET_TEXT_CHARACTERS__': config.maxPresetTextCharacters,
    '__MAX_PRESET_FIELDS__': config.maxPresetFields,
    '__MAX_WRITING_STYLE_TEXT_CHARACTERS__': config.maxWritingStyleTextCharacters,
    '__MAX_WRITING_STYLES_PER_SESSION__': config.maxWritingStylesPerSession,
    '__MAX_SUBAGENTS__': config.maxSubagents,
    '__MAX_SUBAGENT_NAME_CHARACTERS__': config.maxSubagentNameCharacters,
    '__MAX_SUBAGENT_DESCRIPTION_CHARACTERS__': config.maxSubagentDescriptionCharacters,
    '__MAX_SUBAGENT_INSTRUCTIONS_CHARACTERS__': config.maxSubagentInstructionsCharacters,
    '__INITIAL_SUBAGENTS__': config.initialSubagents ?? [],
    '__RP_SUBAGENT_MANAGER_DISABLED__': !features.isEnabled('subagent-manager'),
    '__RP_CHARACTER_CARD_DISABLED__': !features.isEnabled('character-card'),
    '__RP_STATE_DISABLED__': !features.isEnabled('state'),
    '__RP_COMPAT_MVU_DISABLED__': !features.isEnabled('compat-mvu'),
    '__RP_LORE_BOOK_DISABLED__': !features.isEnabled('lore-book'),
    '__RP_PERSONA_DISABLED__': !features.isEnabled('persona'),
    '__RP_PRESET_DISABLED__': !features.isEnabled('preset'),
    '__RP_WRITING_STYLE_DISABLED__': !features.isEnabled('writing-style'),
    '__RP_ASSET_TOOLS_DISABLED__': !features.hasAssetProvider(),
  }
  for (const [placeholder, value] of Object.entries(values)) {
    if (!composition.includes(placeholder)) throw new Error(`rp-standard: preset template is missing ${placeholder}`)
    composition = composition.replaceAll(placeholder, JSON.stringify(value))
  }
  if (!composition.endsWith('\n')) composition += '\n'
  const metadata = await readFile(METADATA_URL, 'utf8')
  return {
    [COMPOSITION_FILE]: composition,
    [METADATA_FILE]: metadata.endsWith('\n') ? metadata : `${metadata}\n`,
    [MARKER_FILE]: `${JSON.stringify({ owner: PRESET_OWNER, version: PRESET_VERSION }, null, 2)}\n`,
    ...await guidanceSkillFiles(features.guidanceSkills()),
  }
}

async function guidanceSkillFiles(skills) {
  const files = {}
  for (const { packageName, skillName } of skills) {
    const packageDirectory = dirname(require.resolve(`${packageName}/package.json`))
    const skillDirectory = resolve(packageDirectory, 'skills', skillName)
    for (const filename of await relativeFiles(skillDirectory)) {
      const content = await readFile(resolve(skillDirectory, filename), 'utf8')
      files[`skills/${skillName}/${filename}`] = content.endsWith('\n') ? content : `${content}\n`
    }
  }
  return files
}

async function relativeFiles(directory, prefix = '') {
  const output = []
  const entries = await readdir(resolve(directory, prefix), { withFileTypes: true })
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const relative = prefix.length === 0 ? entry.name : `${prefix}/${entry.name}`
    if (entry.isDirectory()) output.push(...await relativeFiles(directory, relative))
    else if (entry.isFile()) output.push(relative)
    else throw new Error(`rp-standard: guidance skill contains an unsupported entry: ${relative}`)
  }
  return output
}

/** @param {string} directory @param {Record<string, string>} files */
async function installManagedPreset(directory, files) {
  const parent = dirname(directory)
  await mkdir(parent, { recursive: true, mode: 0o700 })
  const existing = await pathKind(directory)
  if (existing !== 'missing') {
    if (existing !== 'directory') throw new Error(`rp-standard: preset path is not a managed directory: ${directory}`)
    const marker = await readMarker(directory)
    if (marker?.owner !== PRESET_OWNER) {
      throw new Error(`rp-standard: preset id "${PRESET_ID}" is occupied by an unmanaged preset at ${directory}`)
    }
    if (await filesMatch(directory, files)) return
  }

  const nonce = randomUUID()
  const temporary = resolve(parent, `.${PRESET_ID}.${nonce}.tmp`)
  const backup = resolve(parent, `.${PRESET_ID}.${nonce}.bak`)
  await mkdir(temporary, { mode: 0o700 })
  try {
    for (const [filename, content] of Object.entries(files)) {
      const target = resolve(temporary, filename)
      await mkdir(dirname(target), { recursive: true, mode: 0o700 })
      await writeFile(target, content, { encoding: 'utf8', mode: 0o600, flag: 'wx' })
    }
    if (existing === 'missing') {
      await rename(temporary, directory)
      return
    }
    await rename(directory, backup)
    try {
      await rename(temporary, directory)
    } catch (error) {
      await rename(backup, directory)
      throw error
    }
    await rm(backup, { recursive: true, force: true })
  } finally {
    await rm(temporary, { recursive: true, force: true })
  }
}

/** @param {string} path */
async function pathKind(path) {
  try {
    const stat = await lstat(path)
    return stat.isDirectory() && !stat.isSymbolicLink() ? 'directory' : 'other'
  } catch (error) {
    if (error?.code === 'ENOENT') return 'missing'
    throw error
  }
}

/** @param {string} directory */
async function readMarker(directory) {
  try {
    return JSON.parse(await readFile(resolve(directory, MARKER_FILE), 'utf8'))
  } catch (error) {
    if (error?.code === 'ENOENT' || error instanceof SyntaxError) return undefined
    throw error
  }
}

/** @param {string} directory @param {Record<string, string>} files */
async function filesMatch(directory, files) {
  for (const [filename, content] of Object.entries(files)) {
    try {
      if (await readFile(resolve(directory, filename), 'utf8') !== content) return false
    } catch (error) {
      if (error?.code === 'ENOENT') return false
      throw error
    }
  }
  return true
}
