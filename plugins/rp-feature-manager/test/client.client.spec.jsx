// @vitest-environment jsdom
import React from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@deepseek-ai/dsh-client-ui-primitives', () => ({
  Button: ({ children, ...props }) => React.createElement('button', props, children),
  Tooltip: ({ children }) => children,
  Modal: ({ open, title, children, footer }) => open
    ? React.createElement('div', { role: 'dialog', 'aria-label': title }, children, footer)
    : null,
  IconCheckOutline16: () => null,
  IconChevronDownOutline14: () => null,
  IconChevronUpOutline14: () => null,
  IconCodeOutline16: () => null,
  IconDataOutline16: () => null,
  IconEditOutline16: () => null,
  IconPlusOutline16: () => null,
  IconRefreshOutline16: () => null,
  IconSettingsOutline14: () => null,
  IconSkillOutline16: () => null,
  IconTrashOutline16: () => null,
}))

vi.mock('motion/react', async () => {
  const ReactModule = await vi.importActual('react')
  return {
    AnimatePresence: ({ children }) => children,
    LazyMotion: ({ children }) => children,
    MotionConfig: ({ children }) => children,
    domAnimation: {},
    useReducedMotion: () => true,
    m: new Proxy({}, {
      get: (_target, tag) => ({
        children,
        layout: _layout,
        layoutId: _layoutId,
        transition: _transition,
        initial: _initial,
        animate: _animate,
        exit: _exit,
        ...props
      }) => ReactModule.createElement(tag, props, children),
    }),
  }
})

import { FEATURE_CATALOG, ROLEPLAY_SKILL_CATALOG } from '../src/catalog.js'
import { ReplyOptionsSettingsOverlay, RoleplaySettingsSection, apply } from '../src/client.js'
import { QuickReplyManager } from '../src/quick-reply-settings.js'
import { buildRoleplayPromptPreview } from 'dsh-roleplay-rp-core/prompts'
import { DEFAULT_QUICK_REPLIES } from 'dsh-roleplay-rp-quick-replies/protocol'

afterEach(cleanup)

const copy = {
  nav: 'Roleplay', title: 'Roleplay', description: '管理 Roleplay 功能及其向 Agent 提供的 Skills。',
  featuresTab: '功能', skillsTab: 'Skills', promptsTab: '系统提示词', featuresTitle: 'Roleplay 功能',
  featuresDescription: '这些功能已随 Roleplay 组合提供。启用只控制是否加载，不会改变已提供的代码，也不会删除资料。',
  coreTitle: '核心运行时', coreDescription: '核心能力', alwaysEnabled: '始终启用',
  enabled: '已启用', disabled: '未启用', enabling: '正在更新…', loading: '正在读取 Roleplay 设置…',
  loadError: '暂时无法读取 Roleplay 设置。', retry: '重试', compatible: '版本兼容', incompatible: '版本不兼容',
  versionProblem: '版本不兼容', roleplayVersion: 'Roleplay', dshVersion: 'DSH', versionDetails: '查看核心组件',
  applies: '下一次对话生效。', saveError: '启用状态没有保存，请稍后重试。',
  quickRepliesConfigure: '设置快捷回复', quickRepliesEnableFirst: '启用快捷回复后设置',
  replyOptionsConfigure: '设置回复选项', replyOptionsEnableFirst: '启用回复选项后设置',
  replyOptionsSettingsSaved: '回复条数、长度指导和方向关键词已保存；新建或重新打开对话后生效。',
  skillsTitle: 'Roleplay Skills', skillsDescription: '逐项选择 Roleplay 插件向 Agent 提供的工作指南。',
  skillsScope: '这里只管理 Roleplay 插件贡献的 Skills；项目目录和用户目录中的其他 Skills 不受影响。',
  visibilityTitle: '可见性预览', parentAgent: 'Agent 模式父代理',
  parentAgentVisibility: '可以看到当前已启用的 Roleplay Skills。', customSubagents: '自定义子代理',
  customSubagentsVisibility: '仅当“子代理”功能已启用，且该子代理允许使用 Skills 时可见。',
  writer: 'Writer', writerVisibility: '始终不可见。启用或停用“子代理”功能都不会改变 Writer。',
  pluginDisabled: '插件未启用', waitingForPlugin: '等待插件启用', sourcePlugin: '来自',
  visibleParent: '当前可见：Agent 模式父代理', visibleSubagents: '、允许 Skills 的自定义子代理',
  subagentsUnavailable: '；“子代理”功能当前未启用', invisibleSkill: '当前不可见：此 Skill 未启用。',
  invisiblePlugin: '当前不可见：请先在“功能”中启用对应插件。',
  promptsTitle: '代理提示词', promptsDescription: '查看提示词拼接顺序。', promptsScope: '这里显示运行时来源和模板。',
  promptsLoading: '正在读取代理提示词…', promptsLoadError: '暂时无法读取代理提示词。', promptRoles: '选择代理',
  identityTitle: 'Roleplay 统一身份', identityDescription: '所有 Roleplay 代理共用。', identityDefault: '使用 Harness 默认值',
  identityCustomized: '已自定义', identityEdit: '编辑统一身份', identityField: '统一身份 System 提示词',
  identityHelper: '下一次模型请求生效。', identityCharacters: '字符', identityRequired: '统一身份不能为空。',
  identityTooLong: '统一身份超过允许的最大长度。', identityCancel: '取消', identitySave: '保存统一身份',
  identitySaving: '正在保存…', identityReset: '恢复 Harness 默认值', identitySaved: '已更新 Roleplay 统一身份；下一次模型请求开始使用。',
  identityResetDone: '已恢复 Harness 默认身份。', identitySaveError: '统一身份没有保存，请稍后重试。',
  parentChatPrompt: 'Chat 父代理', parentChatHint: 'Writer 直接交付正文', parentAgentPrompt: 'Agent 父代理',
  parentAgentHint: '规划并审阅正文', writerPrompt: 'Writer', writerPromptHint: '只负责本轮正文',
  customPrompt: '自定义子代理', customPromptHint: '独立完成一个任务', customPromptSelect: '选择自定义子代理',
  noCustomPrompts: '当前没有可预览的自定义子代理。', promptOrder: '模型接收顺序', modelRoute: '模型',
  sessionModel: '当前对话模型', inheritedModel: '继承父代理模型', systemRole: 'System', userRole: 'User', toolsRole: 'Tools',
  exactPrompt: '完整内容', templatePrompt: '动态模板', dynamicPrompt: '运行时生成', externalPrompt: 'Harness 提供',
  derivedPrompt: '按权限筛选', promptSource: '来源', externalPromptBody: 'Harness 动态提供。',
  dynamicPromptBody: '当前对话动态生成。', derivedPromptBody: '只保留可用工具。', noTools: '不向这个代理提供工具。',
  promptTools: '可见工具', promptLayerHarness: 'Harness 身份', promptLayerHarnessSource: 'Harness 源码环境',
  promptLayerWebSurface: 'Web 运行环境', promptLayerParentPersona: 'Roleplay 通用规则',
  promptLayerRuntime: '当前模式工作流', promptLayerToolGuidance: '可用工具规则', promptLayerConversation: '当前对话输入',
  promptLayerWriterReady: 'Roleplay 运行上下文', promptLayerToolSchema: '工具清单', promptLayerWriterPersona: '正文写作规则',
  promptLayerWriterSlots: 'Writer 写作材料', promptLayerTaskPersona: '自定义工作指令', promptLayerTaskCall: '本次独立任务',
  sourceHarness: 'Harness', sourceHarnessBoot: 'Harness App Boot', sourceHarnessWeb: 'Harness Web',
  sourceParent: 'Roleplay 通用模板', sourceRuntime: 'Roleplay 运行时', sourceTools: '当前可用工具',
  sourceConversation: '当前对话', sourceSubagent: '自定义子代理设置', noteChatRelay: 'Writer 正文直接交付。',
  noteAgentRevision: '父代理审阅 Writer 初稿。', noteFreshChild: '每次创建全新上下文。', notePersonaShadowed: '替换父代理身份。',
  noteRuntimeSkipped: '不注入父代理模式规则。', noteNoTools: 'Writer 不接收工具。', noteExplicitInput: '只接收显式输入。',
}

function t(key) { return copy[key] ?? key }

function statusView(
  enabledFeatures,
  enabledSkills,
  revision = 0,
  replyOptionsCount = 3,
  replyOptionsKeywords = Array.from({ length: replyOptionsCount }, () => ''),
  replyOptionsMaxCharacters = 50,
) {
  return {
    roleplay: { version: '0.1.8' },
    dsh: { version: '0.1.2-alpha.5', compatible: true },
    compatible: true,
    problems: [],
    enabledFeatures: [...enabledFeatures],
    enabledSkills: [...enabledSkills],
    replyOptionsCount,
    replyOptionsMaxCharacters,
    replyOptionsKeywords: [...replyOptionsKeywords],
    settings: { writable: true, revision },
    core: [
      { label: '回复运行时', description: '协调父代理、Writer、上下文与每轮写作流程。', packageVersion: '0.1.8', versionCompatible: true },
      { label: '会话总结', description: '压缩较早的对话，并向 Writer 提供独立的会话总结。', packageVersion: '0.1.8', versionCompatible: true },
    ],
    features: FEATURE_CATALOG.map(item => ({
      ...item,
      enabled: enabledFeatures.includes(item.id),
      active: enabledFeatures.includes(item.id),
      packageVersion: '0.1.8',
      versionCompatible: true,
    })),
    skills: ROLEPLAY_SKILL_CATALOG.map(item => ({
      id: item.id,
      label: item.label,
      description: item.description,
      featureId: item.featureId,
      featureLabel: item.featureLabel,
      selected: enabledSkills.includes(item.id),
      featureEnabled: enabledFeatures.includes(item.featureId),
      enabled: enabledSkills.includes(item.id) && enabledFeatures.includes(item.featureId),
      packageVersion: '0.1.8',
      versionCompatible: true,
    })),
  }
}

function harness(
  enabledFeatures = ['lore-book'],
  enabledSkills = ['rp-guide-lorebook', 'rp-guide-state'],
  {
    remote = false,
    replyOptionsCount = 3,
    replyOptionsMaxCharacters = 50,
    replyOptionsKeywords = Array.from({ length: replyOptionsCount }, () => ''),
    failReplyOptionsSave = false,
  } = {},
) {
  let status = statusView(
    enabledFeatures,
    enabledSkills,
    0,
    replyOptionsCount,
    replyOptionsKeywords,
    replyOptionsMaxCharacters,
  )
  let quickReplies = readyQuickReplyState()
  let snapshot = {
    status: remote ? 'unavailable' : 'ready',
    writable: !remote,
    revision: 0,
    value: {
      enabledFeatures: [...enabledFeatures],
      enabledSkills: [...enabledSkills],
      replyOptionsCount,
      replyOptionsMaxCharacters,
      replyOptionsKeywords: [...replyOptionsKeywords],
      harnessIdentity: '',
    },
  }
  const listeners = new Set()
  const scope = {
    subscribe: listener => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getSnapshot: () => snapshot,
    set: vi.fn(async (field, value) => {
      const stored = Array.isArray(value) ? [...value] : value
      snapshot = {
        ...snapshot,
        revision: snapshot.revision + 1,
        value: { ...snapshot.value, [field]: stored },
      }
      status = statusView(
        snapshot.value.enabledFeatures,
        snapshot.value.enabledSkills,
        snapshot.revision,
        snapshot.value.replyOptionsCount ?? 3,
        snapshot.value.replyOptionsKeywords,
        snapshot.value.replyOptionsMaxCharacters ?? 50,
      )
      for (const listener of listeners) listener()
    }),
    unset: vi.fn(async field => {
      snapshot = {
        ...snapshot,
        revision: snapshot.revision + 1,
        value: { ...snapshot.value, [field]: field === 'harnessIdentity' ? '' : undefined },
      }
      for (const listener of listeners) listener()
    }),
  }
  const connection = {
      call: vi.fn(async (_path, endpoint, payload) => {
        if (_path === '/rp-quick-replies') {
          if (endpoint === 'replace') quickReplies = { ...quickReplies, replies: payload.replies, revision: quickReplies.revision + 1 }
          return { ok: true, value: { ok: true, value: structuredClone(quickReplies) } }
        }
        if (endpoint === 'settings/reply-options' && failReplyOptionsSave) {
          throw new Error('internal transport details')
        }
        if (endpoint === 'settings/reply-options') {
          snapshot = {
            ...snapshot,
            revision: snapshot.revision + 1,
            value: {
              ...snapshot.value,
              replyOptionsCount: payload.count,
              replyOptionsMaxCharacters: payload.maxCharacters,
              replyOptionsKeywords: [...payload.keywords],
            },
          }
          status = statusView(
            snapshot.value.enabledFeatures,
            snapshot.value.enabledSkills,
            snapshot.revision,
            snapshot.value.replyOptionsCount,
            snapshot.value.replyOptionsKeywords,
            snapshot.value.replyOptionsMaxCharacters,
          )
        } else if (endpoint === 'settings/set') {
          const stored = Array.isArray(payload.value) ? [...payload.value] : payload.value
          snapshot = {
            ...snapshot,
            revision: snapshot.revision + 1,
            value: { ...snapshot.value, [payload.field]: stored },
          }
          status = statusView(
            snapshot.value.enabledFeatures,
            snapshot.value.enabledSkills,
            snapshot.revision,
            snapshot.value.replyOptionsCount ?? 3,
            snapshot.value.replyOptionsKeywords,
            snapshot.value.replyOptionsMaxCharacters ?? 50,
          )
        } else if (endpoint === 'settings/unset') {
          snapshot = {
            ...snapshot,
            revision: snapshot.revision + 1,
            value: { ...snapshot.value, [payload.field]: payload.field === 'harnessIdentity' ? '' : undefined },
          }
          status = statusView(
            snapshot.value.enabledFeatures,
            snapshot.value.enabledSkills,
            snapshot.revision,
            snapshot.value.replyOptionsCount ?? 3,
            snapshot.value.replyOptionsKeywords,
            snapshot.value.replyOptionsMaxCharacters ?? 50,
          )
        }
        return {
          ok: true,
          value: {
            ok: true,
            value: structuredClone(endpoint === 'prompts'
              ? promptView(snapshot.value.enabledFeatures, snapshot.value.harnessIdentity)
              : status),
          },
        }
      }),
  }
  return { scope, connection }
}

function readyQuickReplyState(overrides = {}) {
  return {
    replies: DEFAULT_QUICK_REPLIES.map(reply => ({ ...reply })),
    writable: true,
    revision: 0,
    limits: { replies: 12, labelCharacters: 12, contentCharacters: 2000, totalCharacters: 8000 },
    ...overrides,
  }
}

function fixedQuickReplyStore(snapshot = { phase: 'ready', error: null, ...readyQuickReplyState() }) {
  return {
    subscribe: () => () => {},
    getSnapshot: () => snapshot,
    load: vi.fn(async () => snapshot),
    replace: vi.fn(async () => snapshot),
  }
}

function promptView(enabledFeatures, identityOverride = '') {
  const defaultIdentity = 'You are an AI agent powered by DeepSeek Harness.'
  const identity = identityOverride.trim() || defaultIdentity
  return buildRoleplayPromptPreview({
    stateEnabled: enabledFeatures.includes('state'),
    subagentsEnabled: true,
    assetToolsEnabled: true,
    harnessSections: [
      { id: 'harness-identity', name: 'harness:identity', order: -1000, source: 'dsh-system-prompt', text: identity },
      { id: 'harness-source', name: 'harness:source', order: -900, source: 'dsh-app-boot', text: 'The Harness checkout is available at /source.' },
      { id: 'app-web-surface', name: 'app:web-surface', order: -800, source: 'dsh-web-app', text: 'You are using the Harness Web GUI.' },
    ],
    harnessIdentity: {
      sectionName: 'harness:identity', value: identity, defaultValue: defaultIdentity,
      customized: identityOverride.trim().length > 0, maxCharacters: 4000,
    },
    taskSubagents: [{
      id: 'continuity',
      label: '连续性检查',
      description: '核对事实与角色知识边界。',
      persona: '只返回连续性问题。',
      toolFilter: { allow: ['web_search'] },
    }],
  })
}

describe('Roleplay 一级设置与 Skill 管理', () => {
  it('在 Agent 预设之后注册一级 Roleplay 入口，不再注册插件页签', () => {
    const registrations = []
    const services = new Map()
    const inject = vi.fn((_name, setup) => setup())
    const ctx = {
      rpRemote: {},
      effect: vi.fn(setup => setup()),
      reflect: { provide: vi.fn((name, value) => { services.set(name, value); return () => {} }) },
      locale: { register: vi.fn(), bind: () => t },
      settingsScope: { bind: vi.fn(() => ({})) },
      slots: {
        inject,
        register: vi.fn((options, component) => { registrations.push({ options, component }); return () => {} }),
      },
    }
    apply(ctx)
    expect(inject).toHaveBeenCalledWith('settings.section', expect.any(Function))
    expect(inject).toHaveBeenCalledWith('shell.overlay', expect.any(Function))
    const section = registrations.find(item => item.options.name === 'settings.section')
    const overlay = registrations.find(item => item.options.name === 'shell.overlay')
    expect(section.options).toMatchObject({ name: 'settings.section', id: 'roleplay', order: 25 })
    expect(section.options.label()).toBe('Roleplay')
    expect(overlay.options).toMatchObject({ name: 'shell.overlay', id: 'rp-reply-options-settings' })
    const settingsController = services.get('rpReplyOptionsSettings')
    expect(settingsController).toBeTruthy()
    expect(overlay.options.inject().controller).toBe(settingsController)
    settingsController.open()
    expect(settingsController.getSnapshot()).toMatchObject({ open: true, request: 1 })
  })

  it('用插件卡片展示核心组件的名称、版本和简介', async () => {
    const { scope, connection } = harness()
    render(React.createElement(RoleplaySettingsSection, { scope, connection, t }))

    fireEvent.click(await screen.findByText('查看核心组件'))
    const card = screen.getByText('会话总结').closest('li')
    expect(card).toBeTruthy()
    expect(card.textContent).toContain('v0.1.8')
    expect(card.textContent).toContain('压缩较早的对话，并向 Writer 提供独立的会话总结。')
  })

  it('会话卡片入口通过全局浮层读取并保存同一份回复选项设置', async () => {
    const { connection } = harness(['reply-options'], [], {
      replyOptionsCount: 3,
      replyOptionsMaxCharacters: 30,
      replyOptionsKeywords: ['试探', '', '离开'],
    })
    const command = { open: true, request: 1 }
    const controller = {
      subscribe: () => () => {},
      getSnapshot: () => command,
      open: vi.fn(),
      close: vi.fn(),
    }
    render(React.createElement(ReplyOptionsSettingsOverlay, { controller, connection }))

    expect(await screen.findByRole('dialog', { name: '设置回复选项' })).toBeTruthy()
    fireEvent.input(screen.getByRole('spinbutton', { name: '每条长度指导' }), { target: { value: '36' } })
    fireEvent.click(screen.getByRole('button', { name: '保存设置' }))
    await waitFor(() => expect(connection.call).toHaveBeenCalledWith('/rp-features', 'settings/reply-options', {
      count: 3,
      maxCharacters: 36,
      keywords: ['试探', '', '离开'],
      expectedRevision: 0,
    }))
    await waitFor(() => expect(controller.close).toHaveBeenCalledTimes(1))
  })

  it('在快捷回复功能卡中提供设置入口，并保存完整的自定义列表', async () => {
    const { scope, connection } = harness(['quick-replies'], [])
    render(React.createElement(RoleplaySettingsSection, { scope, connection, t }))

    const configureButton = await screen.findByRole('button', { name: '设置快捷回复' })
    expect(configureButton.textContent).toBe('')
    fireEvent.click(configureButton)
    expect(await screen.findByRole('dialog', { name: '设置快捷回复' })).toBeTruthy()
    await waitFor(() => expect(connection.call).toHaveBeenCalledWith('/rp-quick-replies', 'list', {}))

    fireEvent.change(await screen.findByLabelText('第 1 项按钮名称'), { target: { value: '旁白' } })
    fireEvent.change(screen.getByLabelText('第 1 项插入内容'), { target: { value: '请从旁白视角继续。' } })
    fireEvent.change(screen.getByLabelText('第 1 项光标位置'), { target: { value: 'end' } })
    fireEvent.click(screen.getByRole('button', { name: '保存快捷回复' }))

    await waitFor(() => expect(connection.call).toHaveBeenCalledWith('/rp-quick-replies', 'replace', expect.objectContaining({ expectedRevision: 0 })))
    const replaceCall = connection.call.mock.calls.find(([, endpoint]) => endpoint === 'replace')
    expect(replaceCall[2].replies[0]).toEqual({
      id: 'double-quote', label: '旁白', content: '请从旁白视角继续。', cursorPosition: 'end',
    })
  })

  it('在回复选项齿轮中按条数显示对应关键词并原子保存', async () => {
    const { scope, connection } = harness(['reply-options'], [], {
      replyOptionsCount: 3,
      replyOptionsKeywords: ['试探', '', '离开'],
    })
    render(React.createElement(RoleplaySettingsSection, { scope, connection, t }))

    fireEvent.click(await screen.findByRole('button', { name: '设置回复选项' }))
    expect(await screen.findByRole('dialog', { name: '设置回复选项' })).toBeTruthy()
    const input = screen.getByRole('spinbutton', { name: '回复条数' })
    const maxCharactersInput = screen.getByRole('spinbutton', { name: '每条长度指导' })
    expect(input.value).toBe('3')
    expect(maxCharactersInput.value).toBe('50')
    expect(screen.getByText('回复条数可填写 1–5；每条长度指导可填写 1–200，默认目标为 50 字以内。')).toBeTruthy()
    expect(screen.queryByText(/不会按此数值拦截提交/)).toBeNull()
    expect(input.disabled).toBe(false)
    expect(screen.getAllByRole('textbox')).toHaveLength(3)
    expect(screen.getByLabelText('选项 1 的方向关键词').value).toBe('试探')
    expect(screen.getByLabelText('选项 3 的方向关键词').value).toBe('离开')

    fireEvent.input(input, { target: { value: '5' } })
    fireEvent.input(maxCharactersInput, { target: { value: '48' } })
    expect(input.value).toBe('5')
    expect(screen.getAllByRole('textbox')).toHaveLength(5)
    fireEvent.change(screen.getByLabelText('选项 2 的方向关键词'), { target: { value: ' 直接反抗 ' } })
    fireEvent.change(screen.getByLabelText('选项 4 的方向关键词'), { target: { value: '寻求帮助' } })
    const saveButton = screen.getByRole('button', { name: '保存设置' })
    await waitFor(() => expect(saveButton.disabled).toBe(false))
    fireEvent.click(saveButton)
    await waitFor(() => expect(connection.call).toHaveBeenCalledWith('/rp-features', 'settings/reply-options', {
      count: 5,
      maxCharacters: 48,
      keywords: ['试探', '直接反抗', '离开', '寻求帮助', ''],
      expectedRevision: 0,
    }))
    expect(await screen.findByText('回复条数、长度指导和方向关键词已保存；新建或重新打开对话后生效。')).toBeTruthy()
    expect(screen.queryByRole('dialog', { name: '设置回复选项' })).toBeNull()
  })

  it('回复条数超出 1–5 时保留输入并阻止保存', async () => {
    const { scope, connection } = harness(['reply-options'], [])
    render(React.createElement(RoleplaySettingsSection, { scope, connection, t }))

    fireEvent.click(await screen.findByRole('button', { name: '设置回复选项' }))
    const input = await screen.findByRole('spinbutton', { name: '回复条数' })
    expect(input.disabled).toBe(false)
    fireEvent.input(input, { target: { value: '6' } })
    expect(input.value).toBe('6')
    expect(screen.getAllByRole('textbox')).toHaveLength(3)
    expect(screen.getByRole('alert').textContent).toBe('请输入 1 到 5 之间的整数。')
    expect(screen.getByRole('button', { name: '保存设置' }).disabled).toBe(true)
    expect(connection.call).not.toHaveBeenCalledWith('/rp-features', 'settings/reply-options', expect.anything())
  })

  it('每条长度指导超出 1–200 时保留输入并阻止保存', async () => {
    const { scope, connection } = harness(['reply-options'], [])
    render(React.createElement(RoleplaySettingsSection, { scope, connection, t }))

    fireEvent.click(await screen.findByRole('button', { name: '设置回复选项' }))
    const input = await screen.findByRole('spinbutton', { name: '每条长度指导' })
    fireEvent.input(input, { target: { value: '201' } })
    expect(input.value).toBe('201')
    expect(screen.getByRole('alert').textContent).toBe('请输入 1 到 200 之间的整数。')
    expect(screen.getByRole('button', { name: '保存设置' }).disabled).toBe(true)
    expect(connection.call).not.toHaveBeenCalledWith('/rp-features', 'settings/reply-options', expect.anything())
  })

  it('方向关键词超过 40 个字符时保留编辑并阻止保存', async () => {
    const { scope, connection } = harness(['reply-options'], [])
    render(React.createElement(RoleplaySettingsSection, { scope, connection, t }))
    fireEvent.click(await screen.findByRole('button', { name: '设置回复选项' }))
    fireEvent.change(screen.getByLabelText('选项 2 的方向关键词'), { target: { value: '界'.repeat(41) } })
    expect(screen.getByRole('alert').textContent).toBe('选项 2 的方向关键词最多 40 个字符。')
    expect(screen.getByRole('button', { name: '保存设置' }).disabled).toBe(true)
    expect(screen.getByLabelText('选项 2 的方向关键词').value).toBe('界'.repeat(41))
    expect(connection.call).not.toHaveBeenCalledWith('/rp-features', 'settings/reply-options', expect.anything())
  })

  it('回复条数保存失败时保留弹窗并显示友好错误', async () => {
    const { scope, connection } = harness(['reply-options'], [], { failReplyOptionsSave: true })
    render(React.createElement(RoleplaySettingsSection, { scope, connection, t }))
    fireEvent.click(await screen.findByRole('button', { name: '设置回复选项' }))
    fireEvent.input(screen.getByRole('spinbutton', { name: '回复条数' }), { target: { value: '4' } })
    fireEvent.change(screen.getByLabelText('选项 4 的方向关键词'), { target: { value: '主动离开' } })
    fireEvent.click(screen.getByRole('button', { name: '保存设置' }))
    expect((await screen.findByRole('alert')).textContent).toBe('回复选项设置没有保存，请稍后重试。')
    expect(screen.getByRole('dialog', { name: '设置回复选项' })).toBeTruthy()
    expect(screen.getByRole('spinbutton', { name: '回复条数' }).value).toBe('4')
    expect(screen.getByLabelText('选项 4 的方向关键词').value).toBe('主动离开')
  })

  it('功能未启用时保留可发现但不可点击的设置入口', async () => {
    const { scope, connection } = harness(['lore-book'])
    render(React.createElement(RoleplaySettingsSection, { scope, connection, t }))
    expect((await screen.findByRole('button', { name: '启用快捷回复后设置' })).disabled).toBe(true)
    expect(screen.getByRole('button', { name: '启用回复选项后设置' }).disabled).toBe(true)
  })

  it('快捷回复设置保留无效编辑并给出可执行错误', async () => {
    const store = fixedQuickReplyStore()
    render(React.createElement(QuickReplyManager, { open: true, store, onClose: vi.fn() }))
    fireEvent.change(screen.getByLabelText('第 2 项按钮名称'), { target: { value: '“”' } })
    fireEvent.click(screen.getByRole('button', { name: '保存快捷回复' }))
    expect((await screen.findByRole('alert')).textContent).toContain('每个快捷回复需要使用不同的名称。')
    expect(store.replace).not.toHaveBeenCalled()
  })

  it('通过顶部页签展示 Skill 精细选择和真实可见性', async () => {
    const { scope, connection } = harness()
    render(React.createElement(RoleplaySettingsSection, { scope, connection, t }))
    expect(await screen.findByRole('heading', { name: 'Roleplay' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: '功能' }).getAttribute('aria-selected')).toBe('true')

    fireEvent.click(screen.getByRole('tab', { name: 'Skills' }))
    expect(screen.getByRole('heading', { name: 'Roleplay Skills' })).toBeTruthy()
    expect(screen.getByText('始终不可见。启用或停用“子代理”功能都不会改变 Writer。')).toBeTruthy()
    expect(screen.getByText(/项目目录和用户目录中的其他 Skills 不受影响/)).toBeTruthy()

    const loreSwitch = screen.getByRole('switch', { name: '停用世界书指南 Skill' })
    const stateSwitch = screen.getByRole('switch', { name: '停用会话变量指南 Skill' })
    expect(loreSwitch.disabled).toBe(false)
    expect(stateSwitch.disabled).toBe(true)
    expect(screen.getByText('等待插件启用')).toBeTruthy()

    fireEvent.click(loreSwitch)
    await waitFor(() => expect(connection.call).toHaveBeenCalledWith('/rp-features', 'settings/set', {
      field: 'enabledSkills',
      value: ['rp-guide-state'],
      expectedRevision: 0,
    }))
    expect(await screen.findByText('已停用世界书指南。')).toBeTruthy()
  })

  it('非回环页面不依赖全局 settings scope，仍通过 Roleplay RPC 保存', async () => {
    const { scope, connection } = harness(undefined, undefined, { remote: true })
    render(React.createElement(RoleplaySettingsSection, { scope, connection, t }))

    const loreSwitch = await screen.findByRole('switch', { name: '停用世界书' })
    expect(loreSwitch.disabled).toBe(false)
    fireEvent.click(loreSwitch)

    await waitFor(() => expect(connection.call).toHaveBeenCalledWith('/rp-features', 'settings/set', {
      field: 'enabledFeatures',
      value: [],
      expectedRevision: 0,
    }))
    expect(scope.set).not.toHaveBeenCalled()
  })

  it('在系统提示词页签展示 Chat、Agent、Writer 与自定义子代理的真实拼接来源，且各层默认收起', async () => {
    const { scope, connection } = harness(['lore-book', 'state', 'subagent-manager'])
    const { container } = render(React.createElement(RoleplaySettingsSection, { scope, connection, t }))
    fireEvent.click(await screen.findByRole('tab', { name: '系统提示词' }))

    expect(await screen.findByRole('heading', { name: '代理提示词' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Roleplay 统一身份' })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Chat 父代理/ }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getAllByText('You are an AI agent powered by DeepSeek Harness.').length).toBeGreaterThan(1)
    expect(screen.getByText('The Harness checkout is available at /source.')).toBeTruthy()
    expect(screen.getByText('You are using the Harness Web GUI.')).toBeTruthy()
    expect(screen.getAllByText('harness:identity').length).toBeGreaterThan(1)
    expect(screen.getByText('harness:source')).toBeTruthy()
    expect(screen.getByText('app:web-surface')).toBeTruthy()
    expect(screen.getByText(/Handle the current request within an ongoing roleplay conversation/)).toBeTruthy()
    expect(screen.getByText(/Chat mode is the direct narrative path/)).toBeTruthy()
    const promptLayers = [...container.querySelectorAll('ol details')]
    expect(promptLayers.length).toBeGreaterThan(0)
    expect(promptLayers.every(layer => !layer.open)).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: /^Writer/ }))
    expect(await screen.findByText(/You are Writer\. Produce the requested user-visible output/)).toBeTruthy()
    expect(screen.getByText('不向这个代理提供工具。')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /自定义子代理/ }))
    expect(await screen.findByRole('combobox', { name: '选择自定义子代理' })).toBeTruthy()
    expect(screen.getByText(/只返回连续性问题/)).toBeTruthy()
    expect(screen.getAllByText('web_search').length).toBeGreaterThan(0)
  })

  it('在提示词页统一编辑并恢复所有 Roleplay 代理使用的 Harness 身份', async () => {
    const { scope, connection } = harness(['lore-book', 'subagent-manager'])
    render(React.createElement(RoleplaySettingsSection, { scope, connection, t }))
    fireEvent.click(await screen.findByRole('tab', { name: '系统提示词' }))
    await screen.findByRole('heading', { name: 'Roleplay 统一身份' })

    fireEvent.click(screen.getByRole('button', { name: '编辑统一身份' }))
    const field = screen.getByRole('textbox', { name: '统一身份 System 提示词' })
    fireEvent.change(field, { target: { value: 'You are the shared Roleplay identity.' } })
    fireEvent.click(screen.getByRole('button', { name: '保存统一身份' }))

    await waitFor(() => expect(connection.call).toHaveBeenCalledWith('/rp-features', 'settings/set', {
      field: 'harnessIdentity',
      value: 'You are the shared Roleplay identity.',
      expectedRevision: 0,
    }))
    expect(await screen.findByText('已更新 Roleplay 统一身份；下一次模型请求开始使用。')).toBeTruthy()
    expect(screen.getAllByText('You are the shared Roleplay identity.').length).toBeGreaterThan(1)
    expect(screen.getByText('已自定义')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: '编辑统一身份' }))
    fireEvent.click(screen.getByRole('button', { name: '恢复 Harness 默认值' }))
    await waitFor(() => expect(connection.call).toHaveBeenCalledWith('/rp-features', 'settings/unset', {
      field: 'harnessIdentity',
      expectedRevision: 1,
    }))
    expect(await screen.findByText('已恢复 Harness 默认身份。')).toBeTruthy()
    expect(screen.getByText('使用 Harness 默认值')).toBeTruthy()
  })
})
