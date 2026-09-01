import { FEATURE_CATALOG, featureById } from './catalog.js'
import { toggleFeature, toggleSideEffects, toggleSkill } from './selection.js'

export const CATEGORY_ORDER = Object.freeze(['materials', 'creation', 'conversation'])

export function groupedFeatures() {
  return CATEGORY_ORDER.map(category => ({
    category,
    features: FEATURE_CATALOG.filter(item => item.category === category),
  }))
}

export function planFeatureToggle(current, id, enabled) {
  return {
    enabledFeatures: toggleFeature(current, id, enabled),
    sideEffects: toggleSideEffects(current, id, enabled),
  }
}

export function dependencyLabels(feature, relation = 'requires') {
  return feature[relation].map(id => featureById(id).label)
}

export function toggleAnnouncement(feature, enabled, sideEffects) {
  const action = enabled ? '启用' : '停用'
  if (sideEffects.length === 0) return `已${action}${feature.label}。`
  const related = sideEffects.map(id => featureById(id).label).join('、')
  return enabled
    ? `已启用${feature.label}，并同时启用${related}。`
    : `已停用${feature.label}，并同时停用依赖它的${related}。`
}

export function planSkillToggle(current, id, enabled) {
  return toggleSkill(current, id, enabled)
}

export function skillAvailability(skill, enabledFeatures, enabledSkills) {
  if (!enabledFeatures.includes(skill.featureId)) return 'plugin-disabled'
  return enabledSkills.includes(skill.id) ? 'enabled' : 'disabled'
}

export function skillToggleAnnouncement(skill, enabled) {
  return `已${enabled ? '启用' : '停用'}${skill.label}。`
}

export async function featureStatus(connection) {
  return roleplayFeatureRequest(connection, 'status', 'Roleplay 功能状态读取失败')
}

export async function promptPreview(connection) {
  return roleplayFeatureRequest(connection, 'prompts', '代理提示词预览读取失败')
}

export async function setRoleplaySetting(connection, field, value, expectedRevision) {
  return roleplayFeatureRequest(connection, 'settings/set', 'Roleplay 设置保存失败', {
    field,
    value,
    expectedRevision,
  })
}

export async function setReplyOptionsSettings(connection, count, maxCharacters, keywords, expectedRevision) {
  return roleplayFeatureRequest(connection, 'settings/reply-options', '回复选项设置保存失败', {
    count,
    maxCharacters,
    keywords,
    expectedRevision,
  })
}

export async function unsetRoleplaySetting(connection, field, expectedRevision) {
  return roleplayFeatureRequest(connection, 'settings/unset', 'Roleplay 设置重置失败', {
    field,
    expectedRevision,
  })
}

async function roleplayFeatureRequest(connection, endpoint, fallbackMessage, payload = {}) {
  const response = await connection.call('/rp-features', endpoint, payload)
  const domain = response?.ok === true && response.value?.ok !== undefined ? response.value : response
  if (domain?.ok !== true) throw Object.assign(new Error(domain?.error?.message ?? fallbackMessage), { code: domain?.error?.code })
  return domain.value
}
