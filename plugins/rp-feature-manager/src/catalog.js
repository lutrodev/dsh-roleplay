/** Product-facing Roleplay feature catalog and release compatibility contract. */

export const ROLEPLAY_SUITE_VERSION = '0.1.7'
export const SUPPORTED_DSH_RANGE = '0.1.2-alpha.1'
export const SETTINGS_NAMESPACE = 'roleplay-features'

// Every always-on core package must also remain a direct dependency of
// rp-feature-manager so runtime compatibility inspection can resolve it.
export const CORE_PACKAGES = Object.freeze([
  Object.freeze({ packageName: 'dsh-roleplay-rp-feature-manager', label: '功能管理', description: '管理 Roleplay 功能、Skills、版本兼容状态和设置入口。' }),
  Object.freeze({ packageName: 'dsh-roleplay-rp-standard', label: 'Roleplay 模式', description: '组合 Roleplay 核心运行时、工具与默认工作流。' }),
  Object.freeze({ packageName: 'dsh-roleplay-rp-core', label: '回复运行时', description: '协调父代理、Writer、上下文与每轮写作流程。' }),
  Object.freeze({ packageName: 'dsh-roleplay-rp-conversation-summary', label: '会话总结', description: '压缩较早的对话，并向 Writer 提供独立的会话总结。' }),
  Object.freeze({ packageName: 'dsh-roleplay-rp-session', label: '对话配置', description: '保存当前会话的模式、资料绑定与故事设置。' }),
  Object.freeze({ packageName: 'dsh-roleplay-rp-macro', label: '名称宏', description: '在提示词中展开当前角色与用户的名称。' }),
  Object.freeze({ packageName: 'dsh-roleplay-rp-asset-tools', label: '资料工具', description: '为 Agent 提供统一、精简的共享资料操作入口。' }),
  Object.freeze({ packageName: 'dsh-roleplay-rp-library', label: '故事设置', description: '提供资料导航、会话绑定与 Prompt 编辑界面。' }),
])

export const FEATURE_CATALOG = Object.freeze([
  feature({
    id: 'character-card', category: 'materials', label: '角色卡',
    description: '管理角色设定、开场白和角色卡导入。',
    packageName: 'dsh-roleplay-rp-character-card',
    hostEntryIds: ['rp-character-library'], runtimeKey: 'characterCard',
    recommends: ['lore-book'], skillName: 'rp-guide-character-card',
    skillLabel: '角色卡指南',
    skillDescription: '在应用、检查或按明确要求修改角色卡时，提供安全边界与操作步骤。',
  }),
  feature({
    id: 'lore-book', category: 'materials', label: '世界书',
    description: '按当前对话激活世界设定、人物知识和重要规则。',
    packageName: 'dsh-roleplay-rp-lore-book',
    hostEntryIds: ['rp-lore-library'], runtimeKey: 'loreBook',
    skillName: 'rp-guide-lorebook', skillLabel: '世界书指南',
    skillDescription: '在使用、检查或按明确要求修改世界书时，维护连续性、激活规则与用户控制权。',
  }),
  feature({
    id: 'persona', category: 'materials', label: '我的人设',
    description: '保存用户在故事中的身份，并可作为当前对话的人设。',
    packageName: 'dsh-roleplay-rp-persona',
    hostEntryIds: ['rp-persona'], runtimeKey: 'persona',
    skillName: 'rp-guide-persona', skillLabel: '我的人设指南',
    skillDescription: '在使用或按明确要求修改“我的人设”时，保持身份内容由用户决定。',
  }),
  feature({
    id: 'preset', category: 'materials', label: '创作预设',
    description: '组合任务说明、写作指导和输出要求。',
    packageName: 'dsh-roleplay-rp-preset',
    hostEntryIds: ['rp-preset'], runtimeKey: 'preset',
    skillName: 'rp-guide-preset', skillLabel: '创作预设指南',
    skillDescription: '在应用、修改或从 SillyTavern 迁移创作预设时，解释栏位作用与叙事优先级。',
    supportingSkillNames: ['rp-guide-preset-sillytavern'],
  }),
  feature({
    id: 'writing-style', category: 'materials', label: '文风',
    description: '为当前对话叠加有序的叙事语言与节奏要求。',
    packageName: 'dsh-roleplay-rp-writing-style',
    hostEntryIds: ['rp-writing-style'], runtimeKey: 'writingStyle',
    skillName: 'rp-guide-writing-style', skillLabel: '文风指南',
    skillDescription: '在应用或按明确要求修改文风时，协调多项文风的顺序、语言与节奏。',
  }),
  feature({
    id: 'state', category: 'creation', label: '会话变量',
    description: '在当前对话中维护可回放的数值、关系和故事状态。',
    packageName: 'dsh-roleplay-rp-state',
    runtimeKey: 'state', skillName: 'rp-guide-state', skillLabel: '会话变量指南',
    skillDescription: '在用户明确要求变量工作时，设计、检查、配置或诊断会话变量。',
  }),
  feature({
    id: 'compat-mvu', category: 'creation', label: 'MVU 兼容',
    description: '转换受支持的社区 MVU 变量与条件规则安全子集。',
    packageName: 'dsh-roleplay-rp-compat-mvu',
    hostEntryIds: ['rp-mvu-import'], runtimeKey: 'compatMvu',
    requires: ['character-card', 'lore-book', 'state'],
  }),
  feature({
    id: 'subagent-manager', category: 'creation', label: '子代理',
    description: '配置固定 Writer，以及按各自调用契约运行的可插拔独立任务子代理。',
    packageName: 'dsh-roleplay-rp-subagent-manager',
    hostEntryIds: ['rp-subagent-manager'], runtimeKey: 'subagentManager',
  }),
  feature({
    id: 'quick-replies', category: 'conversation', label: '快捷回复',
    description: '在输入栏插入可自定义的常用回复与成对符号，不会自动发送。',
    packageName: 'dsh-roleplay-rp-quick-replies',
    hostEntryIds: ['rp-quick-replies'],
  }),
  feature({
    id: 'message-actions', category: 'conversation', label: '消息操作',
    description: '提供编辑、删除、重新生成和失败恢复等消息能力。',
    packageName: 'dsh-roleplay-rp-message-actions',
    hostEntryIds: ['rp-message-actions'],
  }),
  feature({
    id: 'state-display', category: 'conversation', label: '会话变量卡片',
    description: '在最新助手回复下方，以易读结构展示当前会话变量。',
    packageName: 'dsh-roleplay-rp-state-display',
    hostEntryIds: ['rp-state-display'],
    requires: ['state'],
  }),
  feature({
    id: 'message-avatar', category: 'conversation', label: '消息头像',
    description: '在用户、开场和最终回复旁显示相应角色头像。',
    packageName: 'dsh-roleplay-rp-message-avatar',
    hostEntryIds: ['rp-message-avatar'],
    recommends: ['character-card', 'persona'],
  }),
  feature({
    id: 'dialogue-highlight', category: 'conversation', label: '对白高亮',
    description: '在助手正文中突出显示成对引号内的对白。',
    packageName: 'dsh-roleplay-rp-dialogue-highlight',
    hostEntryIds: ['rp-dialogue-highlight'],
  }),
  feature({
    id: 'compact-access-mode', category: 'conversation', label: '访问模式仅图标',
    description: '在所有输入栏宽度下仅显示当前访问模式图标。',
    packageName: 'dsh-roleplay-rp-compact-access-mode',
    hostEntryIds: ['rp-compact-access-mode'],
  }),
])

export const FEATURE_IDS = Object.freeze(FEATURE_CATALOG.map(item => item.id))
export const DEFAULT_ENABLED_FEATURES = FEATURE_IDS

/** Roleplay-owned Skills that can be selected independently from their plugin. */
export const ROLEPLAY_SKILL_CATALOG = Object.freeze(FEATURE_CATALOG.flatMap(item => item.skillName === undefined
  ? []
  : [Object.freeze({
      id: item.skillName,
      label: item.skillLabel,
      description: item.skillDescription,
      featureId: item.id,
      featureLabel: item.label,
      packageName: item.packageName,
      skillName: item.skillName,
    })]))
export const SKILL_IDS = Object.freeze(ROLEPLAY_SKILL_CATALOG.map(item => item.id))
export const DEFAULT_ENABLED_SKILLS = SKILL_IDS

const byId = new Map(FEATURE_CATALOG.map(item => [item.id, item]))
const skillById = new Map(ROLEPLAY_SKILL_CATALOG.map(item => [item.id, item]))

/** Resolve one known feature definition. */
export function featureById(id) {
  return byId.get(id)
}

/** Resolve one known Roleplay Skill definition. */
export function roleplaySkillById(id) {
  return skillById.get(id)
}

/** Selected guidance Skills and their model-only supporting Skills whose contributing plugins are enabled. */
export function guidanceSkillsFor(enabledFeatures, enabledSkills = DEFAULT_ENABLED_SKILLS) {
  const enabled = new Set(enabledFeatures)
  const selected = new Set(enabledSkills)
  return ROLEPLAY_SKILL_CATALOG.flatMap(item => {
    if (!enabled.has(item.featureId) || !selected.has(item.id)) return []
    const feature = byId.get(item.featureId)
    return [item.skillName, ...feature.supportingSkillNames]
      .map(skillName => ({ packageName: item.packageName, skillName }))
  })
}

/** Whether the generic asset tools have at least one enabled provider. */
export function hasEnabledAssetProvider(enabledFeatures) {
  const enabled = new Set(enabledFeatures)
  return ['character-card', 'lore-book', 'persona', 'preset', 'writing-style']
    .some(id => enabled.has(id))
}

function feature(input) {
  return Object.freeze({
    ...input,
    requires: Object.freeze([...(input.requires ?? [])]),
    recommends: Object.freeze([...(input.recommends ?? [])]),
    hostEntryIds: Object.freeze([...(input.hostEntryIds ?? [])]),
    supportingSkillNames: Object.freeze([...(input.supportingSkillNames ?? [])]),
  })
}
