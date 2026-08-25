import React, { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { AnimatePresence, LazyMotion, MotionConfig, domAnimation, m, useReducedMotion } from 'motion/react'
import {
  IconCheckOutline16,
  IconChevronDownOutline14,
  IconCodeOutline16,
  IconDataOutline16,
  IconEditOutline16,
  IconRefreshOutline16,
  IconSkillOutline16,
} from '@deepseek-ai/dsh-client-ui-primitives'
import { SETTINGS_NAMESPACE } from './catalog.js'
import {
  dependencyLabels,
  featureStatus,
  groupedFeatures,
  planFeatureToggle,
  planSkillToggle,
  promptPreview,
  skillToggleAnnouncement,
  toggleAnnouncement,
} from './client-state.js'
import { css, ensureStyles } from './client-styles.generated.js'

export const inject = ['slots', 'locale', 'connection', 'settingsScope']
const h = React.createElement
const NS = 'settings.roleplayFeatures'
const TAB_IDS = Object.freeze(['features', 'skills', 'prompts'])
const CATEGORY_COPY = {
  materials: ['资料', '选择故事使用的共享资料类型。停用后资料文件和已有对话绑定仍会保留。'],
  creation: ['创作能力', '管理会话变量、兼容转换和 Agent 写作增强。'],
  conversation: ['对话体验', '控制消息区域中的附加交互与呈现。'],
}

const zh = {
  nav: 'Roleplay',
  title: 'Roleplay',
  description: '管理 Roleplay 功能、Skills 与代理提示词。',
  featuresTab: '功能',
  skillsTab: 'Skills',
  promptsTab: '系统提示词',
  featuresTitle: 'Roleplay 功能',
  featuresDescription: '这些功能已随 Roleplay 组合提供。启用只控制是否加载，不会改变已提供的代码，也不会删除资料。',
  coreTitle: '核心运行时',
  coreDescription: '回复运行、对话配置、名称宏和故事设置始终启用。',
  alwaysEnabled: '始终启用',
  enabled: '已启用',
  disabled: '未启用',
  enabling: '正在更新…',
  loading: '正在读取 Roleplay 设置…',
  loadError: '暂时无法读取 Roleplay 设置。',
  retry: '重试',
  compatible: '版本兼容',
  incompatible: '版本不兼容',
  versionProblem: '当前版本组合不兼容。请先对齐 Roleplay 与 DSH 版本，再调整功能或 Skills。',
  roleplayVersion: 'Roleplay',
  dshVersion: 'DSH',
  versionDetails: '查看核心组件版本',
  applies: '资料入口会立即调整；Roleplay 运行能力从下一次新建或重新打开对话开始生效。',
  saveError: '启用状态没有保存，请稍后重试。',
  skillsTitle: 'Roleplay Skills',
  skillsDescription: '逐项选择 Roleplay 插件向 Agent 提供的工作指南。停用 Skill 不会停用插件，也不会删除资料。',
  skillsScope: '这里只管理 Roleplay 插件贡献的 Skills；项目目录和用户目录中的其他 Skills 不受影响。',
  visibilityTitle: '可见性预览',
  parentAgent: 'Agent 模式父代理',
  parentAgentVisibility: '可以看到当前已启用的 Roleplay Skills。',
  customSubagents: '自定义子代理',
  customSubagentsVisibility: '仅当“子代理”功能已启用，且该子代理允许使用 Skills 时可见。',
  writer: 'Writer',
  writerVisibility: '始终不可见。启用或停用“子代理”功能都不会改变 Writer。',
  pluginDisabled: '插件未启用',
  waitingForPlugin: '等待插件启用',
  sourcePlugin: '来自',
  visibleParent: '当前可见：Agent 模式父代理',
  visibleSubagents: '、允许 Skills 的自定义子代理',
  subagentsUnavailable: '；“子代理”功能当前未启用',
  invisibleSkill: '当前不可见：此 Skill 未启用。',
  invisiblePlugin: '当前不可见：请先在“功能”中启用对应插件。',
  promptsTitle: '代理提示词',
  promptsDescription: '查看主对话、Writer 与自定义子代理最终接收哪些指令，以及它们按什么顺序进入模型。',
  promptsScope: 'Harness 身份、源码位置和 Web 运行环境会从当前版本读取并分别展示；Roleplay 规则与实际运行共用同一套渲染器。当前对话、资料、Skills 和工具清单仍按每次请求生成，因此这里只展示模板或来源，不读取某次对话的私有内容。',
  promptsLoading: '正在读取代理提示词…',
  promptsLoadError: '暂时无法读取代理提示词。',
  identityTitle: 'Roleplay 统一身份',
  identityDescription: '覆盖所有 Roleplay 预设中 Chat、Agent、Writer 和自定义子代理的 harness:identity；其他 Agent 预设继续使用 Harness 默认身份。',
  identityDefault: '使用 Harness 默认值',
  identityCustomized: '已自定义',
  identityEdit: '编辑统一身份',
  identityField: '统一身份 System 提示词',
  identityHelper: '保存后，从下一次模型请求开始统一生效。Harness 源码位置和 Web 运行环境不会被修改。',
  identityCharacters: '字符',
  identityRequired: '统一身份不能为空。',
  identityTooLong: '统一身份超过允许的最大长度。',
  identityCancel: '取消',
  identitySave: '保存统一身份',
  identitySaving: '正在保存…',
  identityReset: '恢复 Harness 默认值',
  identitySaved: '已更新 Roleplay 统一身份；下一次模型请求开始使用。',
  identityResetDone: '已恢复 Harness 默认身份。',
  identitySaveError: '统一身份没有保存，请稍后重试。',
  promptRoles: '选择代理',
  parentChatPrompt: 'Chat 父代理',
  parentChatHint: 'Writer 直接交付正文',
  parentAgentPrompt: 'Agent 父代理',
  parentAgentHint: '规划并审阅正文',
  writerPrompt: 'Writer',
  writerPromptHint: '只负责本轮正文',
  customPrompt: '自定义子代理',
  customPromptHint: '独立完成一个任务',
  customPromptSelect: '选择自定义子代理',
  noCustomPrompts: '当前没有可预览的自定义子代理。启用“子代理”功能并创建一个子代理后，这里会显示它的实际工作指令。',
  promptOrder: '模型接收顺序',
  modelRoute: '模型',
  sessionModel: '当前对话模型',
  inheritedModel: '继承父代理模型',
  systemRole: 'System',
  userRole: 'User',
  toolsRole: 'Tools',
  exactPrompt: '完整内容',
  templatePrompt: '动态模板',
  dynamicPrompt: '运行时生成',
  externalPrompt: 'Harness 提供',
  derivedPrompt: '按权限筛选',
  promptSource: '来源',
  externalPromptBody: '当前设置上下文无法展开这部分 Harness 内容；实际模型请求仍由 Harness 按运行配置生成。',
  dynamicPromptBody: '从当前对话的消息与实时资料生成；预览不会读取或展示某次对话的内容。',
  derivedPromptBody: '只保留这个代理在当前模式下真正可见、可调用的工具说明。',
  noTools: '不向这个代理提供工具。',
  promptTools: '可见工具',
  promptLayerHarness: 'Harness 身份',
  promptLayerHarnessSource: 'Harness 源码环境',
  promptLayerWebSurface: 'Web 运行环境',
  promptLayerParentPersona: 'Roleplay 通用规则',
  promptLayerRuntime: '当前模式工作流',
  promptLayerToolGuidance: '可用工具规则',
  promptLayerConversation: '当前对话输入',
  promptLayerWriterReady: 'Roleplay 运行上下文',
  promptLayerToolSchema: '工具清单',
  promptLayerWriterPersona: '正文写作规则',
  promptLayerWriterSlots: 'Writer 写作材料',
  promptLayerTaskPersona: '自定义工作指令',
  promptLayerTaskCall: '本次独立任务',
  sourceHarness: 'Harness',
  sourceHarnessBoot: 'Harness App Boot',
  sourceHarnessWeb: 'Harness Web',
  sourceParent: 'Roleplay 通用模板',
  sourceRuntime: 'Roleplay 运行时',
  sourceTools: '当前可用工具',
  sourceConversation: '当前对话',
  sourceSubagent: '自定义子代理设置',
  noteChatRelay: '生成的正文会直接接入当前回复；之后只提交本轮效果。',
  noteAgentRevision: '生成的正文作为初稿，可在提交前审阅和修改。',
  noteFreshChild: '每次调用都使用独立上下文。',
  notePersonaShadowed: '这里只注入本项写作或工作规则，不叠加主对话的 Roleplay 通用规则。',
  noteRuntimeSkipped: 'Chat／Agent 的模式工作流不会注入这里。',
  noteNoTools: 'Writer 不接收任何工具。',
  noteExplicitInput: '只接收本次任务和明确传入的资料。',
}

const en = {
  ...zh,
  nav: 'Roleplay', title: 'Roleplay', description: 'Manage Roleplay features, Skills, and agent prompts.',
  featuresTab: 'Features', skillsTab: 'Skills', promptsTab: 'System prompts', featuresTitle: 'Roleplay features',
  featuresDescription: 'These features are already included. Enabling only controls loading; it never changes the provided code or deletes data.',
  coreTitle: 'Core runtime', coreDescription: 'Reply runtime, conversation configuration, name macros, and story setup stay enabled.',
  alwaysEnabled: 'Always enabled', enabled: 'Enabled', disabled: 'Not enabled', enabling: 'Updating…',
  loading: 'Reading Roleplay settings…', loadError: 'Roleplay settings are temporarily unavailable.', retry: 'Retry',
  compatible: 'Versions compatible', incompatible: 'Versions incompatible',
  versionProblem: 'This version set is incompatible. Align Roleplay and DSH versions before changing features or Skills.',
  roleplayVersion: 'Roleplay', dshVersion: 'DSH', versionDetails: 'View core component versions',
  applies: 'Material entries update immediately. Runtime changes apply to newly created or reopened conversations.',
  saveError: 'The enabled state was not saved. Try again.',
  skillsTitle: 'Roleplay Skills',
  skillsDescription: 'Select the guides Roleplay plugins expose to agents. Disabling a Skill does not disable its plugin or delete data.',
  skillsScope: 'This page only manages Skills contributed by Roleplay plugins. Project and user Skills are unaffected.',
  visibilityTitle: 'Visibility preview', parentAgent: 'Agent-mode parent',
  parentAgentVisibility: 'Can see the currently enabled Roleplay Skills.', customSubagents: 'Custom subagents',
  customSubagentsVisibility: 'Visible only when Subagents is enabled and that subagent is allowed to use Skills.',
  writer: 'Writer', writerVisibility: 'Never visible. Enabling or disabling Subagents does not change Writer.',
  pluginDisabled: 'Plugin not enabled', waitingForPlugin: 'Waiting for plugin', sourcePlugin: 'From',
  visibleParent: 'Currently visible: Agent-mode parent', visibleSubagents: ', custom subagents allowed to use Skills',
  subagentsUnavailable: '; Subagents is not enabled', invisibleSkill: 'Currently hidden: this Skill is not enabled.',
  invisiblePlugin: 'Currently hidden: enable the matching plugin under Features first.',
  promptsTitle: 'Agent prompts',
  promptsDescription: 'See which instructions reach the main conversation, Writer, and each custom subagent, in model input order.',
  promptsScope: 'Harness identity, source-checkout context, and Web runtime context are read from the running version and shown separately. Roleplay rules share their renderers with the live runtime. Conversation content, materials, Skills, and tool schemas are generated per request, so private conversation content appears only as a labeled source or template.',
  promptsLoading: 'Reading agent prompts…', promptsLoadError: 'Agent prompts are temporarily unavailable.',
  identityTitle: 'Shared Roleplay identity',
  identityDescription: 'Overrides harness:identity for Chat, Agent, Writer, and custom subagents in every Roleplay preset. Other agent presets keep the Harness default.',
  identityDefault: 'Using Harness default', identityCustomized: 'Customized', identityEdit: 'Edit shared identity',
  identityField: 'Shared identity System prompt', identityHelper: 'After saving, every Roleplay agent uses it from the next model request. Harness source and Web runtime context are unchanged.',
  identityCharacters: 'characters', identityRequired: 'The shared identity cannot be empty.',
  identityTooLong: 'The shared identity exceeds the maximum length.', identityCancel: 'Cancel',
  identitySave: 'Save shared identity', identitySaving: 'Saving…', identityReset: 'Restore Harness default',
  identitySaved: 'The shared Roleplay identity is updated for the next model request.',
  identityResetDone: 'The Harness default identity is restored.', identitySaveError: 'The shared identity was not saved. Try again.',
  promptRoles: 'Choose an agent', parentChatPrompt: 'Chat parent', parentChatHint: 'Writer delivers prose directly',
  parentAgentPrompt: 'Agent parent', parentAgentHint: 'Plans and reviews prose', writerPrompt: 'Writer',
  writerPromptHint: 'Writes this turn only', customPrompt: 'Custom subagent', customPromptHint: 'Runs one isolated task',
  customPromptSelect: 'Choose a custom subagent',
  noCustomPrompts: 'No custom subagent is available to preview. Enable Subagents and create one to see its actual work instructions here.',
  promptOrder: 'Model input order', modelRoute: 'Model', sessionModel: 'Current conversation model', inheritedModel: 'Inherit parent model',
  systemRole: 'System', userRole: 'User', toolsRole: 'Tools', exactPrompt: 'Full content', templatePrompt: 'Dynamic template',
  dynamicPrompt: 'Generated at runtime', externalPrompt: 'Provided by Harness', derivedPrompt: 'Permission-filtered',
  promptSource: 'Source', externalPromptBody: 'This Harness content cannot be expanded from the current settings context; the actual model request is still generated by Harness.',
  dynamicPromptBody: 'Generated from live conversation messages and materials; this preview does not read or reveal a conversation.',
  derivedPromptBody: 'Only guidance for tools that this agent can actually see and call in the current mode is retained.',
  noTools: 'No tools are exposed to this agent.', promptTools: 'Visible tools',
  promptLayerHarness: 'Harness identity', promptLayerHarnessSource: 'Harness source context', promptLayerWebSurface: 'Web runtime context',
  promptLayerParentPersona: 'Shared Roleplay rules', promptLayerRuntime: 'Current mode workflow',
  promptLayerToolGuidance: 'Visible-tool guidance', promptLayerConversation: 'Conversation input',
  promptLayerWriterReady: 'Roleplay run context', promptLayerToolSchema: 'Tool schemas', promptLayerWriterPersona: 'Narrative writing rules',
  promptLayerWriterSlots: 'Writer material', promptLayerTaskPersona: 'Custom work instructions', promptLayerTaskCall: 'Isolated task input',
  sourceHarness: 'Harness', sourceHarnessBoot: 'Harness App Boot', sourceHarnessWeb: 'Harness Web',
  sourceParent: 'Shared Roleplay template', sourceRuntime: 'Roleplay runtime',
  sourceTools: 'Visible tools', sourceConversation: 'Current conversation', sourceSubagent: 'Custom subagent settings',
  noteChatRelay: 'Generated prose is inserted into the current reply; only this turn’s effects are committed afterward.',
  noteAgentRevision: 'Generated prose is a draft that can be reviewed and revised before commit.',
  noteFreshChild: 'Every call uses an isolated context.',
  notePersonaShadowed: 'Only these writing or work rules are injected; the main conversation’s shared Roleplay rules are not added.', noteRuntimeSkipped: 'Chat and Agent mode workflows are not injected here.',
  noteNoTools: 'Writer receives no tools.', noteExplicitInput: 'Only this task and its explicitly supplied material are visible.',
}

export function apply(ctx) {
  ctx.effect(ensureStyles)
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'rp-feature-manager: dictionaries')
  const scope = ctx.settingsScope.bind({ namespace: SETTINGS_NAMESPACE })
  const t = ctx.locale.bind(NS)
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'roleplay',
    order: 25,
    label: () => t('nav'),
    locale: NS,
    inject: () => ({ scope, connection: ctx.connection }),
  }, RoleplaySettingsSection))
}

export function RoleplaySettingsSection({ scope, connection, t }) {
  const reduced = useReducedMotion()
  const settings = useSyncExternalStore(
    listener => scope.subscribe(listener),
    () => scope.getSnapshot(),
  )
  const [status, setStatus] = useState({ phase: 'loading' })
  const [activeTab, setActiveTab] = useState('features')
  const [pending, setPending] = useState(null)
  const [notice, setNotice] = useState('')
  const [request, setRequest] = useState(0)
  const [promptStatus, setPromptStatus] = useState({ phase: 'idle' })
  const [promptRequest, setPromptRequest] = useState(0)

  useEffect(() => {
    let live = true
    setStatus({ phase: 'loading' })
    void featureStatus(connection).then(
      value => { if (live) setStatus({ phase: 'ready', value }) },
      () => { if (live) setStatus({ phase: 'error' }) },
    )
    return () => { live = false }
  }, [connection, request, settings.revision])

  useEffect(() => {
    if (activeTab !== 'prompts') return undefined
    let live = true
    setPromptStatus({ phase: 'loading' })
    void promptPreview(connection).then(
      value => { if (live) setPromptStatus({ phase: 'ready', value }) },
      () => { if (live) setPromptStatus({ phase: 'error' }) },
    )
    return () => { live = false }
  }, [activeTab, connection, promptRequest, settings.revision])

  const enabledFeatures = status.phase === 'ready' && Array.isArray(status.value.enabledFeatures)
    ? status.value.enabledFeatures
    : []
  const enabledSkills = status.phase === 'ready' && Array.isArray(status.value.enabledSkills)
    ? status.value.enabledSkills
    : []
  const enabled = useMemo(() => new Set(enabledFeatures), [enabledFeatures])
  const selectedSkills = useMemo(() => new Set(enabledSkills), [enabledSkills])
  const compatible = status.phase === 'ready' && status.value.compatible === true
  const canWrite = settings.status === 'ready' && settings.writable && compatible && pending === null

  const toggleFeature = async feature => {
    if (!canWrite) return
    const nextEnabled = !enabled.has(feature.id)
    const plan = planFeatureToggle(enabledFeatures, feature.id, nextEnabled)
    setPending(`feature:${feature.id}`)
    setNotice('')
    try {
      await scope.set('enabledFeatures', plan.enabledFeatures)
      const saved = scope.getSnapshot().value?.enabledFeatures
      if (!sameSelection(saved, plan.enabledFeatures)) throw new Error('Roleplay feature selection was not persisted')
      const nextStatus = await featureStatus(connection)
      if (!sameSelection(nextStatus.enabledFeatures, plan.enabledFeatures)) throw new Error('Roleplay feature selection was not applied')
      setStatus({ phase: 'ready', value: nextStatus })
      setNotice(toggleAnnouncement(feature, nextEnabled, plan.sideEffects))
    } catch {
      setNotice(t('saveError'))
    } finally {
      setPending(null)
      setRequest(value => value + 1)
    }
  }

  const toggleSkill = async skill => {
    if (!canWrite || !skill.featureEnabled) return
    const nextEnabled = !selectedSkills.has(skill.id)
    const nextSkills = planSkillToggle(enabledSkills, skill.id, nextEnabled)
    setPending(`skill:${skill.id}`)
    setNotice('')
    try {
      await scope.set('enabledSkills', nextSkills)
      const saved = scope.getSnapshot().value?.enabledSkills
      if (!sameSelection(saved, nextSkills)) throw new Error('Roleplay Skill selection was not persisted')
      const nextStatus = await featureStatus(connection)
      if (!sameSelection(nextStatus.enabledSkills, nextSkills)) throw new Error('Roleplay Skill selection was not applied')
      setStatus({ phase: 'ready', value: nextStatus })
      setNotice(skillToggleAnnouncement(skill, nextEnabled))
    } catch {
      setNotice(t('saveError'))
    } finally {
      setPending(null)
      setRequest(value => value + 1)
    }
  }

  const updateHarnessIdentity = async (value, reset = false) => {
    if (!canWrite) return false
    const normalized = typeof value === 'string' ? value.trim() : undefined
    setPending('harness-identity')
    setNotice('')
    try {
      if (reset) await scope.unset('harnessIdentity')
      else await scope.set('harnessIdentity', normalized)
      const nextPreview = await promptPreview(connection)
      if (reset) {
        if (nextPreview.harnessIdentity?.customized !== false) throw new Error('Roleplay identity reset was not applied')
      } else if (nextPreview.harnessIdentity?.value !== normalized || nextPreview.harnessIdentity?.customized !== true) {
        throw new Error('Roleplay identity update was not applied')
      }
      setPromptStatus({ phase: 'ready', value: nextPreview })
      setNotice(t(reset ? 'identityResetDone' : 'identitySaved'))
      return true
    } catch {
      setNotice(t('identitySaveError'))
      return false
    } finally {
      setPending(null)
    }
  }

  if (status.phase === 'loading' || settings.status === 'loading') {
    return h('div', { className: css.state, role: 'status' }, t('loading'))
  }
  if (status.phase === 'error' || settings.status !== 'ready') {
    return h('div', { className: css.failure },
      h('p', { role: 'alert' }, t('loadError')),
      h('button', { type: 'button', onClick: () => setRequest(value => value + 1) }, t('retry')))
  }

  const tabLabel = id => t({ features: 'featuresTab', skills: 'skillsTab', prompts: 'promptsTab' }[id])
  return h(MotionConfig, { reducedMotion: 'user' }, h(LazyMotion, { features: domAnimation, strict: true },
    h('div', { className: css.page },
      h('header', { className: css.header },
        h('div', null, h('h2', null, t('title')), h('p', null, t('description'))),
        h(VersionSummary, { status: status.value, t })),
      h('div', { className: css.tabs, role: 'tablist', 'aria-label': t('title') },
        ...TAB_IDS.map(id => h('button', {
          key: id,
          id: `rp-settings-tab-${id}`,
          type: 'button',
          role: 'tab',
          'aria-selected': activeTab === id,
          'aria-controls': `rp-settings-panel-${id}`,
          tabIndex: activeTab === id ? 0 : -1,
          onClick: () => setActiveTab(id),
          onKeyDown: event => moveTabFocus(event, id, setActiveTab),
        }, h('span', null, tabLabel(id)), activeTab === id ? h(m.span, { className: css.tabIndicator, layoutId: 'rp-settings-tab-indicator' }) : null))),
      compatible ? null : h('div', { className: css.versionWarning, role: 'alert' }, t('versionProblem')),
      h(AnimatePresence, { mode: 'wait', initial: false },
        h(m.div, {
          key: activeTab,
          id: `rp-settings-panel-${activeTab}`,
          className: css.tabPanel,
          role: 'tabpanel',
          'aria-labelledby': `rp-settings-tab-${activeTab}`,
          initial: reduced ? false : { opacity: 0, y: 4 },
          animate: { opacity: 1, y: 0 },
          exit: reduced ? { opacity: 1 } : { opacity: 0, y: -4 },
          transition: { duration: reduced ? 0 : 0.16 },
        }, activeTab === 'features'
          ? h(FeaturesPanel, {
              status: status.value,
              enabled,
              pending,
              canWrite,
              reduced,
              onToggle: feature => { void toggleFeature(feature) },
              t,
            })
          : activeTab === 'skills'
            ? h(SkillsPanel, {
                skills: status.value.skills,
                subagentsEnabled: enabled.has('subagent-manager'),
                pending,
                canWrite,
                reduced,
                onToggle: skill => { void toggleSkill(skill) },
                t,
              })
            : h(PromptsPanel, {
                status: promptStatus,
                reduced,
                canWrite,
                identitySaving: pending === 'harness-identity',
                onSaveIdentity: value => updateHarnessIdentity(value),
                onResetIdentity: () => updateHarnessIdentity(undefined, true),
                onRetry: () => setPromptRequest(value => value + 1),
                t,
              }))),
      h('div', { className: css.liveNotice, 'aria-live': 'polite' }, notice))))
}

function FeaturesPanel({ status, enabled, pending, canWrite, reduced, onToggle, t }) {
  return h(React.Fragment, null,
    h('div', { className: css.panelIntro }, h('h3', null, t('featuresTitle')), h('p', null, t('featuresDescription'))),
    h('p', { className: css.applies }, t('applies')),
    h(CoreSummary, { status, t }),
    ...groupedFeatures().map(group => h('section', { className: css.section, key: group.category, 'aria-labelledby': `rp-features-${group.category}` },
      h('div', { className: css.sectionHeading },
        h('h3', { id: `rp-features-${group.category}` }, CATEGORY_COPY[group.category][0]),
        h('p', null, CATEGORY_COPY[group.category][1])),
      h('ul', { className: css.featureList }, ...group.features.map(feature => h(FeatureRow, {
        key: feature.id,
        feature,
        checked: enabled.has(feature.id),
        pending: pending === `feature:${feature.id}`,
        disabled: !canWrite,
        status: status.features.find(item => item.id === feature.id),
        reduced,
        onToggle: () => onToggle(feature),
        t,
      }))))))
}

function SkillsPanel({ skills, subagentsEnabled, pending, canWrite, reduced, onToggle, t }) {
  return h(React.Fragment, null,
    h('div', { className: css.panelIntro }, h('h3', null, t('skillsTitle')), h('p', null, t('skillsDescription'))),
    h('p', { className: css.skillScope }, t('skillsScope')),
    h('section', { className: css.visibility, 'aria-labelledby': 'rp-skills-visibility' },
      h('div', { className: css.visibilityIcon }, h(IconSkillOutline16, { size: 18, 'aria-hidden': true })),
      h('div', { className: css.visibilityBody },
        h('h3', { id: 'rp-skills-visibility' }, t('visibilityTitle')),
        h('dl', null,
          h('div', null, h('dt', null, t('parentAgent')), h('dd', null, t('parentAgentVisibility'))),
          h('div', null, h('dt', null, t('customSubagents')), h('dd', null, t('customSubagentsVisibility'))),
          h('div', null, h('dt', null, t('writer')), h('dd', null, t('writerVisibility')))))),
    h('ul', { className: css.skillList }, ...skills.map(skill => h(SkillRow, {
      key: skill.id,
      skill,
      subagentsEnabled,
      pending: pending === `skill:${skill.id}`,
      disabled: !canWrite || !skill.featureEnabled,
      reduced,
      onToggle: () => onToggle(skill),
      t,
    }))))
}

function PromptsPanel({ status, reduced, canWrite, identitySaving, onSaveIdentity, onResetIdentity, onRetry, t }) {
  const [selectedKind, setSelectedKind] = useState('parent-chat')
  const [selectedTaskId, setSelectedTaskId] = useState('')
  const preview = status.phase === 'ready' ? status.value : undefined
  const taskProfiles = Array.isArray(preview?.taskSubagents) ? preview.taskSubagents : []

  useEffect(() => {
    if (taskProfiles.length === 0) {
      setSelectedTaskId('')
      return
    }
    if (!taskProfiles.some(profile => profile.taskId === selectedTaskId)) setSelectedTaskId(taskProfiles[0].taskId)
  }, [selectedTaskId, taskProfiles])

  const roles = [
    { id: 'parent-chat', label: t('parentChatPrompt'), hint: t('parentChatHint') },
    { id: 'parent-agent', label: t('parentAgentPrompt'), hint: t('parentAgentHint') },
    { id: 'writer', label: t('writerPrompt'), hint: t('writerPromptHint') },
    { id: 'task-subagent', label: t('customPrompt'), hint: t('customPromptHint') },
  ]
  const selectedProfile = selectedKind === 'task-subagent'
    ? taskProfiles.find(profile => profile.taskId === selectedTaskId)
    : preview?.profiles?.find(profile => profile.kind === selectedKind)

  return h(React.Fragment, null,
    h('div', { className: css.panelIntro }, h('h3', null, t('promptsTitle')), h('p', null, t('promptsDescription'))),
    h('div', { className: css.promptScope },
      h('div', { className: css.promptScopeIcon }, h(IconCodeOutline16, { size: 18, 'aria-hidden': true })),
      h('p', null, t('promptsScope'))),
    status.phase === 'loading' || status.phase === 'idle'
      ? h('div', { className: css.state, role: 'status' }, t('promptsLoading'))
      : status.phase === 'error'
        ? h('div', { className: css.failure },
            h('p', { role: 'alert' }, t('promptsLoadError')),
            h('button', { type: 'button', onClick: onRetry }, t('retry')))
        : h(React.Fragment, null,
            h(HarnessIdentitySetting, {
              setting: preview.harnessIdentity,
              canWrite,
              saving: identitySaving,
              reduced,
              onSave: onSaveIdentity,
              onReset: onResetIdentity,
              t,
            }),
            h('div', { className: css.promptWorkspace },
              h('nav', { className: css.promptRoleNav, 'aria-label': t('promptRoles') },
                ...roles.map(role => h('button', {
                  key: role.id,
                  type: 'button',
                  className: css.promptRoleButton,
                  'data-selected': selectedKind === role.id ? 'true' : 'false',
                  'aria-pressed': selectedKind === role.id,
                  onClick: () => setSelectedKind(role.id),
                }, h('strong', null, role.label), h('span', null, role.hint)))),
              h('section', { className: css.promptDetail, 'aria-live': 'polite' },
                selectedKind === 'task-subagent' && taskProfiles.length === 0
                  ? h('div', { className: css.promptEmpty }, t('noCustomPrompts'))
                  : h(React.Fragment, null,
                      selectedKind === 'task-subagent'
                        ? h('label', { className: css.promptSelect },
                            h('span', null, t('customPromptSelect')),
                            h('select', { value: selectedTaskId, onChange: event => setSelectedTaskId(event.target.value) },
                              ...taskProfiles.map(profile => h('option', { key: profile.taskId, value: profile.taskId }, profile.label))))
                        : null,
                      selectedProfile === undefined ? null : h(PromptProfile, {
                        key: selectedProfile.id,
                        profile: selectedProfile,
                        reduced,
                        t,
                      }))))))
}

function HarnessIdentitySetting({ setting, canWrite, saving, reduced, onSave, onReset, t }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(setting?.value ?? '')
  const value = setting?.value ?? ''
  const maximum = setting?.maxCharacters ?? 4000
  const normalized = draft.trim()
  const characters = [...normalized].length
  const invalid = normalized.length === 0
    ? t('identityRequired')
    : characters > maximum
      ? t('identityTooLong')
      : ''
  const changed = normalized !== value

  useEffect(() => {
    if (!editing) setDraft(value)
  }, [editing, value])

  const cancel = () => {
    setDraft(value)
    setEditing(false)
  }
  const save = async event => {
    event.preventDefault()
    if (!canWrite || saving || invalid.length > 0 || !changed) return
    if (await onSave(normalized)) setEditing(false)
  }
  const reset = async () => {
    if (!canWrite || saving) return
    if (await onReset()) setEditing(false)
  }

  return h('section', { className: css.identityPanel, 'aria-labelledby': 'rp-prompts-identity-title' },
    h('header', { className: css.identityHeader },
      h('div', { className: css.identityTitle },
        h('div', null,
          h('h4', { id: 'rp-prompts-identity-title' }, t('identityTitle')),
          h('code', null, setting?.sectionName ?? 'harness:identity')),
        h('span', { 'data-customized': setting?.customized === true ? 'true' : 'false' },
          t(setting?.customized === true ? 'identityCustomized' : 'identityDefault'))),
      editing ? null : h('button', {
        type: 'button',
        className: css.identityEdit,
        disabled: !canWrite,
        onClick: () => setEditing(true),
      }, h(IconEditOutline16, { size: 14, 'aria-hidden': true }), t('identityEdit'))),
    h('p', { className: css.identityDescription }, t('identityDescription')),
    h(AnimatePresence, { mode: 'wait', initial: false }, editing
      ? h(m.form, {
          key: 'identity-editor',
          className: css.identityEditor,
          onSubmit: event => { void save(event) },
          initial: reduced ? false : { opacity: 0, y: 4 },
          animate: { opacity: 1, y: 0 },
          exit: reduced ? { opacity: 1 } : { opacity: 0, y: -4 },
          transition: { duration: reduced ? 0 : 0.14 },
        },
        h('label', { className: css.identityField },
          h('span', null, t('identityField')),
          h('textarea', {
            value: draft,
            autoFocus: true,
            rows: 5,
            disabled: saving,
            'aria-invalid': invalid.length > 0,
            'aria-describedby': 'rp-prompts-identity-help rp-prompts-identity-error',
            onChange: event => setDraft(event.target.value),
          })),
        h('div', { className: css.identityMeta },
          h('span', { id: 'rp-prompts-identity-help' }, t('identityHelper')),
          h('span', { 'data-invalid': characters > maximum ? 'true' : 'false' }, `${characters} / ${maximum} ${t('identityCharacters')}`)),
        h('div', { id: 'rp-prompts-identity-error', className: css.identityError, role: invalid.length > 0 ? 'alert' : undefined }, invalid),
        h('div', { className: css.identityEditorActions },
          setting?.customized === true
            ? h('button', { type: 'button', className: css.identityReset, disabled: !canWrite || saving, onClick: () => { void reset() } },
                h(IconRefreshOutline16, { size: 14, 'aria-hidden': true }), t('identityReset'))
            : h('span', null),
          h('span', null,
            h('button', { type: 'button', className: css.identityCancel, disabled: saving, onClick: cancel }, t('identityCancel')),
            h('button', { type: 'submit', className: css.identitySave, disabled: !canWrite || saving || invalid.length > 0 || !changed },
              saving ? t('identitySaving') : t('identitySave')))))
      : h(m.div, {
          key: 'identity-preview',
          className: css.identityPreview,
          initial: reduced ? false : { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
          transition: { duration: reduced ? 0 : 0.12 },
        }, h('pre', null, h('code', null, value)))))
}

function PromptProfile({ profile, reduced, t }) {
  const title = promptProfileTitle(profile, t)
  return h(AnimatePresence, { mode: 'wait', initial: false },
    h(m.div, {
      key: profile.id,
      className: css.promptProfile,
      initial: reduced ? false : { opacity: 0, x: 5 },
      animate: { opacity: 1, x: 0 },
      exit: reduced ? { opacity: 1 } : { opacity: 0, x: -5 },
      transition: { duration: reduced ? 0 : 0.14 },
    },
    h('header', { className: css.promptProfileHeader },
      h('div', null,
        h('h4', null, title),
        profile.description === undefined ? null : h('p', null, profile.description)),
      h('div', { className: css.promptRoute },
        h('span', null, t('modelRoute')),
        h('strong', null, routeLabel(profile.route, t)))),
    h('ul', { className: css.promptNotes }, ...profile.notes.map(note => h('li', { key: note }, promptNote(note, t)))),
    h('div', { className: css.promptOrderHeading }, t('promptOrder')),
    h('ol', { className: css.promptLayerList }, ...profile.layers.map((layer, index) => h(PromptLayer, {
      key: layer.id,
      layer,
      index,
      t,
    })))))
}

function PromptLayer({ layer, index, t }) {
  const hasText = typeof layer.text === 'string' && layer.text.length > 0
  const tools = Array.isArray(layer.tools) ? layer.tools : []
  return h('li', null,
    h('details', { className: css.promptLayer },
      h('summary', null,
        h('span', { className: css.promptLayerIndex }, index + 1),
        h('span', { className: css.promptLayerTitle },
          h('strong', null, promptLayerLabel(layer.id, t)),
          h('small', null,
            h('span', null, `${t('promptSource')}：${promptSourceLabel(layer.source, t)}`),
            layer.sectionName === undefined ? null : h('code', null, layer.sectionName))),
        h('span', { className: css.promptRole, 'data-role': layer.role }, t(`${layer.role}Role`)),
        h('span', { className: css.promptKind }, t(`${layer.contentKind}Prompt`)),
        h(IconChevronDownOutline14, { size: 12, 'aria-hidden': true })),
      h('div', { className: css.promptLayerBody },
        hasText
          ? h('pre', null, h('code', null, layer.text))
          : layer.role === 'tools' ? null : h('p', null, promptLayerPlaceholder(layer.contentKind, t)),
        tools.length > 0
          ? h('div', { className: css.promptToolBlock },
              h('span', null, t('promptTools')),
              h('div', { className: css.promptTools }, ...tools.map(tool => h('code', { key: tool }, tool))))
          : layer.role === 'tools' ? h('p', { className: css.promptNoTools }, t('noTools')) : null)))
}

function promptProfileTitle(profile, t) {
  if (profile.kind === 'parent-chat') return t('parentChatPrompt')
  if (profile.kind === 'parent-agent') return t('parentAgentPrompt')
  if (profile.kind === 'writer') return t('writerPrompt')
  return profile.label ?? t('customPrompt')
}

function routeLabel(route, t) {
  if (route?.kind === 'session') return t('sessionModel')
  if (route?.kind === 'fixed') return `${route.provider} / ${route.model}`
  return t('inheritedModel')
}

function promptLayerLabel(id, t) {
  const keys = {
    'harness-identity': 'promptLayerHarness',
    'harness-source': 'promptLayerHarnessSource',
    'app-web-surface': 'promptLayerWebSurface',
    'roleplay-rules': 'promptLayerParentPersona',
    'runtime-contract': 'promptLayerRuntime',
    'tool-guidance': 'promptLayerToolGuidance',
    'conversation-input': 'promptLayerConversation',
    'writer-ready': 'promptLayerWriterReady',
    'tool-schema': 'promptLayerToolSchema',
    'writer-persona': 'promptLayerWriterPersona',
    'writer-slot-prompt': 'promptLayerWriterSlots',
    'task-persona': 'promptLayerTaskPersona',
    'task-call-prompt': 'promptLayerTaskCall',
  }
  return t(keys[id] ?? id)
}

function promptSourceLabel(source, t) {
  const keys = {
    'dsh-system-prompt': 'sourceHarness',
    'dsh-app-boot': 'sourceHarnessBoot',
    'dsh-web-app': 'sourceHarnessWeb',
    'rp-standard': 'sourceParent',
    'rp-core': 'sourceRuntime',
    'visible tool plugins': 'sourceTools',
    'Harness Session Log': 'sourceConversation',
    'dsh-tools': 'sourceTools',
    'rp-subagent-manager': 'sourceSubagent',
  }
  return t(keys[source] ?? 'sourceHarness')
}

function promptLayerPlaceholder(kind, t) {
  if (kind === 'external') return t('externalPromptBody')
  if (kind === 'derived') return t('derivedPromptBody')
  return t('dynamicPromptBody')
}

function promptNote(note, t) {
  const keys = {
    'chat-direct-delivery': 'noteChatRelay',
    'agent-editable-draft': 'noteAgentRevision',
    'isolated-context': 'noteFreshChild',
    'shared-rules-omitted': 'notePersonaShadowed',
    'mode-workflow-omitted': 'noteRuntimeSkipped',
    'no-tools': 'noteNoTools',
    'explicit-task-input': 'noteExplicitInput',
  }
  return t(keys[note] ?? note)
}

function moveTabFocus(event, currentId, setActiveTab) {
  const current = TAB_IDS.indexOf(currentId)
  let next
  if (event.key === 'ArrowRight') next = (current + 1) % TAB_IDS.length
  else if (event.key === 'ArrowLeft') next = (current - 1 + TAB_IDS.length) % TAB_IDS.length
  else if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = TAB_IDS.length - 1
  else return
  event.preventDefault()
  const id = TAB_IDS[next]
  setActiveTab(id)
  queueMicrotask(() => document.getElementById(`rp-settings-tab-${id}`)?.focus())
}

function sameSelection(left, right) {
  return Array.isArray(left) && left.length === right.length && left.every((value, index) => value === right[index])
}

function VersionSummary({ status, t }) {
  return h('div', { className: css.versionSummary, 'data-compatible': status.compatible ? 'true' : 'false' },
    h('span', { className: css.versionState }, status.compatible ? t('compatible') : t('incompatible')),
    h('span', null, `${t('roleplayVersion')} ${status.roleplay.version}`),
    h('span', null, `${t('dshVersion')} ${status.dsh.version ?? '—'}`))
}

function CoreSummary({ status, t }) {
  return h('section', { className: css.core, 'aria-labelledby': 'rp-features-core' },
    h('div', { className: css.coreIcon }, h(IconDataOutline16, { size: 18, 'aria-hidden': true })),
    h('div', { className: css.coreCopy },
      h('div', { className: css.coreTitle }, h('h3', { id: 'rp-features-core' }, t('coreTitle')), h('span', null, h(IconCheckOutline16, { size: 13 }), t('alwaysEnabled'))),
      h('p', null, t('coreDescription')),
      h('details', { className: css.coreVersions },
        h('summary', null, t('versionDetails'), h(IconChevronDownOutline14, { size: 12, 'aria-hidden': true })),
        h('ul', null, ...status.core.map(item => h('li', { key: item.label }, h('span', null, item.label), h('code', null, item.packageVersion ?? '—')))))))
}

function FeatureRow({ feature, checked, pending, disabled, status, reduced, onToggle, t }) {
  const requires = dependencyLabels(feature)
  const recommends = dependencyLabels(feature, 'recommends')
  return h(m.li, { className: css.feature, layout: !reduced },
    h('div', { className: css.featureCopy },
      h('div', { className: css.featureTitle },
        h('strong', null, feature.label),
        h('span', { 'data-enabled': checked ? 'true' : 'false' }, pending ? t('enabling') : checked ? t('enabled') : t('disabled'))),
      h('p', null, feature.description),
      requires.length === 0 && recommends.length === 0 ? null : h('div', { className: css.dependencies },
        requires.length === 0 ? null : h('span', null, `需要：${requires.join('、')}`),
        recommends.length === 0 ? null : h('span', null, `建议搭配：${recommends.join('、')}`)),
      h('code', { className: css.featureVersion }, `v${status?.packageVersion ?? '—'}`)),
    h(Switch, { checked, disabled, reduced, label: `${checked ? '停用' : '启用'}${feature.label}`, onClick: onToggle }))
}

function SkillRow({ skill, subagentsEnabled, pending, disabled, reduced, onToggle, t }) {
  const selected = skill.selected === true
  const status = pending
    ? t('enabling')
    : !skill.featureEnabled
      ? selected ? t('waitingForPlugin') : t('pluginDisabled')
      : selected ? t('enabled') : t('disabled')
  const visibility = !skill.featureEnabled
    ? t('invisiblePlugin')
    : !selected
      ? t('invisibleSkill')
      : `${t('visibleParent')}${subagentsEnabled ? t('visibleSubagents') : t('subagentsUnavailable')}。`
  return h(m.li, { className: css.skill, layout: !reduced, 'data-available': skill.featureEnabled ? 'true' : 'false' },
    h('div', { className: css.skillMark }, h(IconSkillOutline16, { size: 16, 'aria-hidden': true })),
    h('div', { className: css.skillCopy },
      h('div', { className: css.featureTitle },
        h('strong', null, skill.label),
        h('span', { 'data-enabled': skill.enabled ? 'true' : 'false' }, status)),
      h('p', null, skill.description),
      h('div', { className: css.skillMeta },
        h('span', null, `${t('sourcePlugin')}：${skill.featureLabel}`),
        h('code', null, skill.id)),
      h('p', { className: css.skillVisibility }, visibility)),
    h(Switch, { checked: selected, disabled, reduced, label: `${selected ? '停用' : '启用'}${skill.label} Skill`, onClick: onToggle }))
}

function Switch({ checked, disabled, reduced, label, onClick }) {
  return h('button', {
    type: 'button',
    className: css.switch,
    role: 'switch',
    'aria-checked': checked,
    'aria-label': label,
    disabled,
    onClick,
  }, h(m.span, {
    animate: { x: checked ? 18 : 2 },
    transition: reduced ? { duration: 0 } : { type: 'spring', stiffness: 560, damping: 38, mass: 0.6 },
  }))
}
