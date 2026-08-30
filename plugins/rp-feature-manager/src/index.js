import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { dirname, parse, resolve } from 'node:path'
import { Service } from '@deepseek-ai/cordis'
import Schema from '@deepseek-ai/schemastery'
import { buildRoleplayPromptPreview } from 'dsh-roleplay-rp-core/prompts'
import {
  CORE_PACKAGES,
  DEFAULT_ENABLED_FEATURES,
  DEFAULT_ENABLED_SKILLS,
  FEATURE_CATALOG,
  ROLEPLAY_SKILL_CATALOG,
  ROLEPLAY_SUITE_VERSION,
  SETTINGS_NAMESPACE,
  SKILL_IDS,
  SUPPORTED_DSH_RANGE,
  guidanceSkillsFor,
  hasEnabledAssetProvider,
} from './catalog.js'
import {
  assertFeatureSelection,
  assertSkillSelection,
  migrateLegacyFeatureSelection,
  normalizeFeatureSelection,
  normalizeSkillSelection,
} from './selection.js'
import { satisfiesVersion } from './version.js'

export * from './catalog.js'
export * from './selection.js'
export * from './version.js'

const require = createRequire(import.meta.url)
const FEATURE_IDS = FEATURE_CATALOG.map(item => item.id)
const RP_PACKAGE_RANGE = ROLEPLAY_SUITE_VERSION
const ROLEPLAY_SETTINGS_NAMESPACE = SETTINGS_NAMESPACE

/** Maximum length of the Roleplay-wide Harness identity override. */
export const MAX_HARNESS_IDENTITY_CHARACTERS = 4000

export const name = 'rp-feature-manager'
export const inject = ['loader', 'systemPrompt', 'rpRemote']
export const Config = Schema.object({
  enabledFeatures: Schema.array(Schema.union(FEATURE_IDS)).default(DEFAULT_ENABLED_FEATURES),
  enabledSkills: Schema.array(Schema.union(SKILL_IDS)).default(DEFAULT_ENABLED_SKILLS),
  harnessIdentity: Schema.string().default(''),
})

/** Settings-backed activation authority for the bundled Roleplay capabilities. */
export class RpFeatureManager extends Service {
  constructor(ctx, config, harnessSections) {
    super(ctx, 'rpFeatures')
    this.source = () => config
    this.enabled = normalizeFeatureSelection(config.enabledFeatures)
    this.enabledSkills = normalizeSkillSelection(config.enabledSkills ?? DEFAULT_ENABLED_SKILLS)
    this.harnessSections = harnessSections
    this.defaultHarnessIdentity = requiredHarnessIdentity(harnessSections)
    this.identityOverride = normalizeHarnessIdentityOverride(config.harnessIdentity)
    this.identity = this.identityOverride ?? this.defaultHarnessIdentity
    this.listeners = new Set()
    this.reconcileTail = Promise.resolve()
    this.listenerTail = Promise.resolve()
    this.migrationTail = Promise.resolve()
    this.environment = inspectEnvironment()

    ctx.inject(['settings'], settingsCtx => {
      settingsCtx.settings.installSection(ctx, ROLEPLAY_SETTINGS_NAMESPACE, Config, config, {
        setSource: source => { this.source = source },
        validate: value => {
          migrateLegacyFeatureSelection(value.enabledFeatures)
          assertSkillSelection(value.enabledSkills ?? DEFAULT_ENABLED_SKILLS)
          normalizeHarnessIdentityOverride(value.harnessIdentity)
        },
        onChange: () => { this.refresh() },
      })
      this.migrationTail = this.migrationTail.then(() => migratePersistedSelection(settingsCtx.settings))
    })

    ctx.on('loader/entry-init', entry => {
      queueMicrotask(() => { void this.reconcileEntry(entry).catch(error => ctx.logger.warn(error)) })
    }, { global: true })
    // App-owned profile startup can reapply the immutable --patch layer after
    // this provider has enabled a managed row. That replacement reuses the
    // Entry (so entry-init does not fire) and reports the disposal instead.
    // Reconcile once more after the replacement commits so settings remain the
    // final authority over both startup and live profile refreshes.
    ctx.on('loader/partial-dispose', entry => {
      if (!FEATURE_CATALOG.some(item => item.hostEntryIds.some(id => matchesLoaderEntry(entry, id)))) return
      queueMicrotask(() => { this.scheduleReconcile() })
    }, { global: true })
    registerBrowserApi(ctx, this)
    this.scheduleReconcile()
  }

  snapshot() {
    return Object.freeze({
      enabledFeatures: Object.freeze([...this.enabled]),
      enabledSkills: Object.freeze([...this.enabledSkills]),
      harnessIdentity: this.identity,
      compatible: this.environment.compatible,
      dshVersion: this.environment.dsh.version,
      roleplayVersion: ROLEPLAY_SUITE_VERSION,
    })
  }

  isEnabled(id) {
    return this.enabled.includes(id)
  }

  guidanceSkills() {
    return guidanceSkillsFor(this.enabled, this.enabledSkills)
  }

  hasAssetProvider() {
    return hasEnabledAssetProvider(this.enabled)
  }

  /** Return the live identity shadowed into every Roleplay Agent scope. */
  harnessIdentity() {
    return this.identity
  }

  assertCompatible() {
    if (this.environment.compatible) return
    const problems = this.environment.problems.join('; ')
    throw new Error(`rp-feature-manager: Roleplay 与当前 DSH 或插件版本不兼容：${problems}`)
  }

  subscribe(listener) {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  async settled() {
    // Settings injection and its watchers activate on microtasks. Re-read the
    // tails until no callback scheduled more migration or reconciliation work
    // while the previous snapshot was settling.
    await Promise.resolve()
    while (true) {
      const migrationTail = this.migrationTail
      const reconcileTail = this.reconcileTail
      const listenerTail = this.listenerTail
      await Promise.all([migrationTail, reconcileTail, listenerTail])
      await Promise.resolve()
      if (migrationTail === this.migrationTail
        && reconcileTail === this.reconcileTail
        && listenerTail === this.listenerTail) return
    }
  }

  status() {
    const loaderEntries = loaderEntriesFor(this.ctx)
    return {
      roleplay: { version: ROLEPLAY_SUITE_VERSION },
      dsh: this.environment.dsh,
      compatible: this.environment.compatible,
      problems: this.environment.problems,
      enabledFeatures: [...this.enabled],
      enabledSkills: [...this.enabledSkills],
      settings: this.settingsStatus(),
      core: this.environment.core,
      features: FEATURE_CATALOG.map(item => ({
        id: item.id,
        category: item.category,
        label: item.label,
        description: item.description,
        requires: [...item.requires],
        recommends: [...item.recommends],
        enabled: this.enabled.includes(item.id),
        packageVersion: this.environment.packages[item.packageName]?.version ?? null,
        versionCompatible: this.environment.packages[item.packageName]?.compatible === true,
        active: this.enabled.includes(item.id) && (item.hostEntryIds.length === 0 || item.hostEntryIds.every(id => {
          const entry = loaderEntries.find(candidate => matchesLoaderEntry(candidate, id))
          return entry !== undefined && !entry.disabled && entry.fiber !== undefined
        })),
      })),
      skills: ROLEPLAY_SKILL_CATALOG.map(item => ({
        id: item.id,
        label: item.label,
        description: item.description,
        featureId: item.featureId,
        featureLabel: item.featureLabel,
        selected: this.enabledSkills.includes(item.id),
        featureEnabled: this.enabled.includes(item.featureId),
        enabled: this.enabledSkills.includes(item.id) && this.enabled.includes(item.featureId),
        packageVersion: this.environment.packages[item.packageName]?.version ?? null,
        versionCompatible: this.environment.packages[item.packageName]?.compatible === true,
      })),
    }
  }

  /** Project the current runtime-owned prompt composition for read-only settings inspection. */
  async promptPreview() {
    const subagentManager = this.ctx.get('rpSubagentManager')
    const subagentProfile = this.isEnabled('subagent-manager') && subagentManager?.prepareRuntimeProfile !== undefined
      ? await subagentManager.prepareRuntimeProfile()
      : undefined
    this.updateHarnessSections(await resolveHarnessPromptSections(this.ctx))
    return buildRoleplayPromptPreview({
      stateEnabled: this.isEnabled('state'),
      subagentsEnabled: this.isEnabled('subagent-manager'),
      assetToolsEnabled: this.hasAssetProvider(),
      harnessSections: this.effectiveHarnessSections(),
      harnessIdentity: this.identityView(),
      writerRoute: subagentProfile?.writer,
      taskSubagents: subagentProfile?.subagents ?? [],
    })
  }

  /** Persist one Roleplay-owned setting through the Host settings provider. */
  async setSetting(payload) {
    const { field, value, expectedRevision } = parseSettingWrite(payload)
    const settings = this.requireWritableSettings()
    await settings.update(ROLEPLAY_SETTINGS_NAMESPACE, { [field]: value }, expectedRevision)
    this.refresh()
    await this.settled()
    return this.status()
  }

  /** Remove one Roleplay-owned override so it inherits its composed default. */
  async unsetSetting(payload) {
    const { field, expectedRevision } = parseSettingReset(payload)
    const settings = this.requireWritableSettings()
    await settings.mutate(ROLEPLAY_SETTINGS_NAMESPACE, [{ op: 'unset', path: [field] }], expectedRevision)
    this.refresh()
    await this.settled()
    return this.status()
  }

  settingsStatus() {
    const settings = this.ctx.get('settings')
    const descriptor = settings?.describe().find(item => item.ns === SETTINGS_NAMESPACE)
    return {
      writable: settings?.writable === true && descriptor !== undefined,
      revision: descriptor?.revision ?? null,
    }
  }

  requireWritableSettings() {
    const settings = this.ctx.get('settings')
    const registered = settings?.describe().some(item => item.ns === SETTINGS_NAMESPACE) === true
    if (settings?.writable !== true || !registered) {
      throw new Error('rp-feature-manager: Roleplay settings are not writable')
    }
    return settings
  }

  refresh() {
    const source = this.source()
    const next = normalizeFeatureSelection(source.enabledFeatures)
    const nextSkills = normalizeSkillSelection(source.enabledSkills ?? DEFAULT_ENABLED_SKILLS)
    const nextOverride = normalizeHarnessIdentityOverride(source.harnessIdentity)
    const nextIdentity = nextOverride ?? this.defaultHarnessIdentity
    const selectionChanged = !sameSelection(next, this.enabled) || !sameSelection(nextSkills, this.enabledSkills)
    const identityChanged = nextIdentity !== this.identity || nextOverride !== this.identityOverride
    this.enabled = next
    this.enabledSkills = nextSkills
    this.identityOverride = nextOverride
    this.identity = nextIdentity
    if (selectionChanged) this.scheduleReconcile()
    if (!selectionChanged && !identityChanged) return
    const snapshot = this.snapshot()
    const listeners = [...this.listeners]
    this.listenerTail = this.listenerTail.then(async () => {
      for (const listener of listeners) {
        try { await listener(snapshot) } catch (error) { this.ctx.logger.warn(error) }
      }
    })
  }

  scheduleReconcile() {
    this.reconcileTail = this.reconcileTail
      .then(async () => {
        for (const entry of loaderEntriesFor(this.ctx)) await this.reconcileEntry(entry)
      })
      .catch(error => { this.ctx.logger.warn(error) })
  }

  async reconcileEntry(entry) {
    const feature = FEATURE_CATALOG.find(item => item.hostEntryIds.some(id => matchesLoaderEntry(entry, id)))
    if (feature === undefined) return
    const shouldEnable = this.environment.compatible && this.enabled.includes(feature.id)
    if (Boolean(entry.options.disabled) === !shouldEnable) return
    await entry.update({ disabled: !shouldEnable })
  }

  updateHarnessSections(sections) {
    this.harnessSections = sections
    this.defaultHarnessIdentity = requiredHarnessIdentity(sections)
    this.identity = this.identityOverride ?? this.defaultHarnessIdentity
  }

  effectiveHarnessSections() {
    return this.harnessSections.map(section => section.name === 'harness:identity'
      ? { ...section, text: this.identity }
      : { ...section })
  }

  identityView() {
    return {
      sectionName: 'harness:identity',
      value: this.identity,
      defaultValue: this.defaultHarnessIdentity,
      customized: this.identityOverride !== undefined,
      maxCharacters: MAX_HARNESS_IDENTITY_CHARACTERS,
    }
  }
}

/**
 * Match both a row's authored id and its public Loader-tree id. DSH profiles
 * now mount bundle rows below an Include tree, so the runtime id is namespaced
 * (for example `include:rp-quick-replies`) even though the bundle patch still
 * authors `rp-quick-replies`. Depending on which Loader boundary owns the
 * caller, `options.id` may expose either form; the tree id is the stable
 * fallback without accepting unrelated suffixes.
 */
export function matchesLoaderEntry(entry, hostEntryId) {
  if (entry?.options?.id === hostEntryId || entry?.id === hostEntryId) return true
  return typeof entry?.id === 'string' && entry.id.endsWith(`:${hostEntryId}`)
}

/**
 * Read the owning Include tree as well as the injected root Loader. Current
 * profile startup mounts third-party bundle rows inside an Include subtree;
 * a plugin-scoped Loader view does not necessarily enumerate its siblings,
 * while the entry's owning tree is the authoritative local roster.
 */
export function loaderEntriesFor(ctx) {
  const entries = []
  const seen = new Set()
  const trees = [ctx?.fiber?.entry?.parent?.tree, ctx?.loader]
  for (const tree of trees) {
    if (typeof tree?.entries !== 'function') continue
    for (const entry of tree.entries()) {
      if (seen.has(entry)) continue
      seen.add(entry)
      entries.push(entry)
    }
  }
  return entries
}

/** Read the exact Harness-owned System sections from the active Web runtime. */
async function resolveHarnessPromptSections(ctx) {
  const harnessPromptSections = new Map([
    ['harness:identity', { id: 'harness-identity', order: ctx.systemPrompt.getSectionOrder('HARNESS_IDENTITY'), source: 'dsh-system-prompt' }],
    ['harness:source', { id: 'harness-source', order: ctx.systemPrompt.getSectionOrder('HARNESS_SOURCE'), source: 'dsh-app-boot' }],
    ['app:web-surface', { id: 'app-web-surface', order: ctx.systemPrompt.getSectionOrder('WEB_SURFACE'), source: 'dsh-web-app' }],
  ])
  const assembly = await ctx.systemPrompt.assemble()
  const sections = []
  for (const section of assembly.sections) {
    const metadata = harnessPromptSections.get(section.name)
    if (metadata === undefined || typeof section.text !== 'string' || section.text.length === 0) continue
    sections.push({ ...metadata, name: section.name, text: section.text })
  }
  requiredHarnessIdentity(sections)
  return sections
}

export async function apply(ctx, config) {
  normalizeHarnessIdentityOverride(config.harnessIdentity)
  const manager = new RpFeatureManager(ctx, config, await resolveHarnessPromptSections(ctx))
  // Keep the provider fiber pending until the persisted selection has loaded
  // and every managed Loader row reflects that final selection. This prevents
  // client discovery from publishing a bundle during the default-config
  // window and leaving its browser contribution mounted after settings load.
  await manager.settled()
}

function registerBrowserApi(ctx, manager) {
  const dispose = ctx.rpRemote.register('/rp-features', async (endpoint, payload) => {
    try {
      await manager.settled()
      if (endpoint === 'status') return transportSuccess(success(manager.status()))
      if (endpoint === 'prompts') return transportSuccess(success(await manager.promptPreview()))
      if (endpoint === 'settings/set') return transportSuccess(success(await manager.setSetting(payload)))
      if (endpoint === 'settings/unset') return transportSuccess(success(await manager.unsetSetting(payload)))
      return transportSuccess(failure('INVALID_REQUEST', 'Unknown Roleplay feature endpoint.'))
    } catch {
      if (endpoint === 'settings/set' || endpoint === 'settings/unset') {
        return transportSuccess(failure('ROLEPLAY_SETTINGS_UPDATE_FAILED', 'Roleplay 设置没有保存，请稍后重试。'))
      }
      return endpoint === 'prompts'
        ? transportSuccess(failure('PROMPT_PREVIEW_UNAVAILABLE', '暂时无法读取代理提示词预览。'))
        : transportSuccess(failure('ROLEPLAY_STATUS_UNAVAILABLE', '暂时无法读取 Roleplay 设置。'))
    }
  })
  ctx.effect(() => dispose, 'rp-feature-manager: /rp-features Remote')
}

async function migratePersistedSelection(settings) {
  const current = settings.get(ROLEPLAY_SETTINGS_NAMESPACE)
  if (current === undefined) return
  const migrated = migrateLegacyFeatureSelection(current.enabledFeatures)
  const skills = assertSkillSelection(current.enabledSkills ?? DEFAULT_ENABLED_SKILLS)
  const descriptor = settings.describe().find(item => item.ns === SETTINGS_NAMESPACE)
  const user = descriptor?.user
  const missingSkills = user !== undefined && !Object.hasOwn(user, 'enabledSkills')
  if (sameSelection(current.enabledFeatures, migrated) && !missingSkills) return
  await settings.replace(ROLEPLAY_SETTINGS_NAMESPACE, {
    ...(user ?? {}),
    enabledFeatures: migrated,
    enabledSkills: skills,
  })
}

function inspectEnvironment() {
  const packages = {}
  const problems = []
  const packageRows = [...CORE_PACKAGES, ...FEATURE_CATALOG.map(item => ({ packageName: item.packageName, label: item.label }))]
  for (const row of packageRows) {
    if (packages[row.packageName] !== undefined) continue
    const version = packageVersion(row.packageName)
    const compatible = version !== undefined && satisfiesVersion(version, RP_PACKAGE_RANGE)
    packages[row.packageName] = { version: version ?? null, compatible }
    if (version === undefined) problems.push(`${row.label}不可用`)
    else if (!compatible) problems.push(`${row.label}版本 ${version} 不属于 ${RP_PACKAGE_RANGE}`)
  }
  const dshVersion = packageVersion('@deepseek-ai/dsh-settings')
  const dshCompatible = dshVersion !== undefined && satisfiesVersion(dshVersion, SUPPORTED_DSH_RANGE)
  if (dshVersion === undefined) problems.push('无法读取 DSH 版本')
  else if (!dshCompatible) problems.push(`DSH ${dshVersion} 不属于 ${SUPPORTED_DSH_RANGE}`)
  return {
    compatible: problems.length === 0,
    problems,
    packages,
    dsh: { version: dshVersion ?? null, supportedRange: SUPPORTED_DSH_RANGE, compatible: dshCompatible },
    core: CORE_PACKAGES.map(row => ({
      label: row.label,
      description: row.description,
      packageVersion: packages[row.packageName]?.version ?? null,
      versionCompatible: packages[row.packageName]?.compatible === true,
    })),
  }
}

function packageVersion(packageName) {
  try {
    const value = require(`${packageName}/package.json`)
    return typeof value.version === 'string' ? value.version : undefined
  } catch {
    try {
      let directory = dirname(require.resolve(packageName))
      const root = parse(directory).root
      while (directory !== root) {
        try {
          const value = JSON.parse(readFileSync(resolve(directory, 'package.json'), 'utf8'))
          if (value.name === packageName && typeof value.version === 'string') return value.version
        } catch (error) {
          if (error?.code !== 'ENOENT') throw error
        }
        directory = dirname(directory)
      }
    } catch {
      return undefined
    }
    return undefined
  }
}

function success(value) { return { ok: true, value } }
function failure(code, message) { return { ok: false, error: { code, message } } }
function transportSuccess(value) { return { ok: true, value } }
function sameSelection(left, right) {
  return Array.isArray(left) && left.length === right.length && left.every((value, index) => value === right[index])
}

function requiredHarnessIdentity(sections) {
  const identity = sections.find(section => section.name === 'harness:identity')?.text
  if (typeof identity !== 'string' || identity.trim().length === 0) {
    throw new Error('rp-feature-manager: Harness identity section is unavailable')
  }
  return identity
}

function normalizeHarnessIdentityOverride(value) {
  if (value === undefined || value === '') return undefined
  if (typeof value !== 'string') throw new TypeError('rp-feature-manager: harnessIdentity must be a string')
  const normalized = value.trim()
  if (normalized.length === 0) return undefined
  if ([...normalized].length > MAX_HARNESS_IDENTITY_CHARACTERS) {
    throw new RangeError(`rp-feature-manager: harnessIdentity exceeds ${MAX_HARNESS_IDENTITY_CHARACTERS} characters`)
  }
  return normalized
}

function parseSettingWrite(payload) {
  if (!isPlainObject(payload)) throw new TypeError('rp-feature-manager: setting write payload must be an object')
  const field = payload.field
  const expectedRevision = parseExpectedRevision(payload.expectedRevision)
  if (field === 'enabledFeatures') {
    return { field, value: assertFeatureSelection(payload.value), expectedRevision }
  }
  if (field === 'enabledSkills') {
    return { field, value: assertSkillSelection(payload.value), expectedRevision }
  }
  if (field === 'harnessIdentity') {
    const value = normalizeHarnessIdentityOverride(payload.value)
    return { field, value: value ?? '', expectedRevision }
  }
  throw new TypeError(`rp-feature-manager: unknown Roleplay setting ${String(field)}`)
}

function parseSettingReset(payload) {
  if (!isPlainObject(payload)) throw new TypeError('rp-feature-manager: setting reset payload must be an object')
  const field = payload.field
  if (field !== 'enabledFeatures' && field !== 'enabledSkills' && field !== 'harnessIdentity') {
    throw new TypeError(`rp-feature-manager: unknown Roleplay setting ${String(field)}`)
  }
  return { field, expectedRevision: parseExpectedRevision(payload.expectedRevision) }
}

function parseExpectedRevision(value) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new TypeError('rp-feature-manager: expectedRevision must be a non-negative safe integer')
  }
  return value
}

function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}
