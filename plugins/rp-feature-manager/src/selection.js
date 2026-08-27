import {
  FEATURE_CATALOG,
  FEATURE_IDS,
  ROLEPLAY_SKILL_CATALOG,
  SKILL_IDS,
  featureById,
} from './catalog.js'

const KNOWN_IDS = new Set(FEATURE_IDS)
const KNOWN_SKILL_IDS = new Set(SKILL_IDS)
const LEGACY_DEFAULTS_BEFORE_COMPACT_ACCESS_MODE = Object.freeze(
  FEATURE_IDS.filter(id => id !== 'state-display' && id !== 'compact-access-mode'),
)
const LEGACY_DEFAULTS_BEFORE_STATE_DISPLAY_DEFAULT_ON = Object.freeze(
  FEATURE_IDS.filter(id => id !== 'state-display'),
)

/** Normalize, close over hard prerequisites, and return catalog order. */
export function normalizeFeatureSelection(value) {
  if (!Array.isArray(value)) throw new TypeError('enabledFeatures must be an array')
  const enabled = new Set()
  for (const id of value) {
    if (typeof id !== 'string' || !KNOWN_IDS.has(id)) {
      throw new TypeError(`enabledFeatures contains an unknown feature: ${String(id)}`)
    }
    enabled.add(id)
  }
  let changed = true
  while (changed) {
    changed = false
    for (const id of [...enabled]) {
      for (const required of featureById(id).requires) {
        if (enabled.has(required)) continue
        enabled.add(required)
        changed = true
      }
    }
  }
  return FEATURE_CATALOG.filter(item => enabled.has(item.id)).map(item => item.id)
}

/** Reject duplicates and selections that omit a selected feature's prerequisite. */
export function assertFeatureSelection(value) {
  const normalized = normalizeFeatureSelection(value)
  if (new Set(value).size !== value.length) throw new TypeError('enabledFeatures must not contain duplicates')
  const actual = new Set(value)
  const missing = normalized.filter(id => !actual.has(id))
  if (missing.length > 0) {
    throw new TypeError(`enabledFeatures is missing required features: ${missing.join(', ')}`)
  }
  return normalized
}

/**
 * Upgrade the one selection shape written before State became independently
 * selectable. MVU already implied State in that release, so adding it keeps
 * the user's effective capabilities unchanged while making the dependency
 * explicit. Every other incomplete selection still fails loud.
 */
export function migrateLegacyFeatureSelection(value) {
  const normalized = normalizeFeatureSelection(value)
  if (new Set(value).size !== value.length) throw new TypeError('enabledFeatures must not contain duplicates')
  if (sameSelection(normalized, LEGACY_DEFAULTS_BEFORE_COMPACT_ACCESS_MODE)) {
    return LEGACY_DEFAULTS_BEFORE_STATE_DISPLAY_DEFAULT_ON
  }
  const actual = new Set(value)
  const missing = normalized.filter(id => !actual.has(id))
  if (missing.length === 1
    && missing[0] === 'state'
    && actual.has('compat-mvu')
    && actual.has('character-card')
    && actual.has('lore-book')) {
    return normalized
  }
  return assertFeatureSelection(value)
}

function sameSelection(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

/** Plan one reversible UI toggle, enabling prerequisites or disabling dependants. */
export function toggleFeature(current, id, enabled) {
  if (!KNOWN_IDS.has(id)) throw new TypeError(`unknown Roleplay feature: ${String(id)}`)
  const selected = new Set(normalizeFeatureSelection(current))
  if (enabled) {
    selected.add(id)
    return normalizeFeatureSelection([...selected])
  }
  selected.delete(id)
  let changed = true
  while (changed) {
    changed = false
    for (const feature of FEATURE_CATALOG) {
      if (!selected.has(feature.id)) continue
      if (feature.requires.some(required => !selected.has(required))) {
        selected.delete(feature.id)
        changed = true
      }
    }
  }
  return FEATURE_CATALOG.filter(item => selected.has(item.id)).map(item => item.id)
}

/** Features changed indirectly by a requested toggle. */
export function toggleSideEffects(current, id, enabled) {
  const before = new Set(normalizeFeatureSelection(current))
  const next = toggleFeature(current, id, enabled)
  return next.filter(item => item !== id && !before.has(item)).concat(
    [...before].filter(item => item !== id && !next.includes(item)),
  )
}

/** Validate and return a Roleplay Skill selection in catalog order. */
export function normalizeSkillSelection(value) {
  if (!Array.isArray(value)) throw new TypeError('enabledSkills must be an array')
  const enabled = new Set()
  for (const id of value) {
    if (typeof id !== 'string' || !KNOWN_SKILL_IDS.has(id)) {
      throw new TypeError(`enabledSkills contains an unknown Skill: ${String(id)}`)
    }
    enabled.add(id)
  }
  return ROLEPLAY_SKILL_CATALOG.filter(item => enabled.has(item.id)).map(item => item.id)
}

/** Reject duplicate Roleplay Skill selections. */
export function assertSkillSelection(value) {
  const normalized = normalizeSkillSelection(value)
  if (new Set(value).size !== value.length) throw new TypeError('enabledSkills must not contain duplicates')
  return normalized
}

/** Plan one independent Roleplay Skill selection change. */
export function toggleSkill(current, id, enabled) {
  if (!KNOWN_SKILL_IDS.has(id)) throw new TypeError(`unknown Roleplay Skill: ${String(id)}`)
  const selected = new Set(normalizeSkillSelection(current))
  if (enabled) selected.add(id)
  else selected.delete(id)
  return ROLEPLAY_SKILL_CATALOG.filter(item => selected.has(item.id)).map(item => item.id)
}
