// @vitest-environment jsdom
import { readFile } from 'node:fs/promises'
import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@deepseek-ai/dsh-client-ui-primitives', async () => {
  const ReactModule = await vi.importActual('react')
  return {
    Button: ({ children, icon, variant: _variant, size: _size, ...props }) => ReactModule.createElement('button', props, icon, children),
    IconBranchOutline16: () => null,
    IconCheckOutline16: () => null,
    IconCopyOutline16: () => null,
    IconEditOutline16: () => null,
    IconRefreshOutline16: () => null,
    IconTrashOutline16: () => null,
    MarkdownText: () => null,
    MessageText: () => null,
    Modal: () => null,
    StateDot: ({ state, className }) => ReactModule.createElement('span', { className, 'data-state': state }),
    Tooltip: ({ children }) => children,
    writeClipboard: async () => true,
  }
})
vi.mock('motion/react', async () => {
  const ReactModule = await vi.importActual('react')
  return {
    LazyMotion: ({ children }) => children,
    MotionConfig: ({ children }) => children,
    domAnimation: {},
    m: new Proxy({}, {
      get: (_target, tag) => ({ children, whileTap: _whileTap, whileFocus: _whileFocus, transition: _transition, ...props }) => ReactModule.createElement(tag, props, children),
    }),
  }
})
import {
  actionNodeHost,
  apply,
  assistantMessageContent,
  assistantFloorNodeDefinition,
  deletedAssistantTraceRows,
  deletedUserRows,
  failedAssistantNodeDefinition,
  failedAssistantTraceRows,
  failedTurnStatus,
  forkMessageBranch,
  inject,
  InlineMessageEditor,
  isCanonicalAssistantAction,
  messageRowForAction,
  nativeAssistantBranchButton,
  openingFloorNodeDefinition,
  settledAssistantTraceRows,
  settledTurnTailRow,
  sizeInlineEditor,
  successfulCommitRows,
  suffixActionNodeDefinition,
  suffixActionRows,
  suffixResidentStartKey,
  userFloorNodeDefinition,
  userMessageContentStack,
} from '../src/client.js'
import {
  projectMessageActionDetail,
  selectFailedAssistant,
  selectFailedTurnRecovery,
} from '../src/client-state.js'
import { rpMessageActionTargetKey } from '../src/protocol.js'
import { ensureStyles } from '../src/client-styles.generated.js'

describe('Roleplay message action presentation', () => {
  it('replaces stale styles with an HMR-owned tag and disposes it with the plugin fiber', () => {
    const id = 'dsh-roleplay-rp-message-actions-styles'
    const stale = document.createElement('style')
    stale.id = id
    stale.textContent = 'stale'
    document.head.append(stale)

    const dispose = ensureStyles()
    const current = document.getElementById(id)
    expect(stale.isConnected).toBe(false)
    expect(current).not.toBeNull()
    expect(current?.dataset.plugin).toBe('dsh-roleplay-rp-message-actions')
    expect(current?.textContent).not.toBe('stale')

    dispose()
    expect(document.getElementById(id)).toBeNull()
  })

  it('registers public Conversation Nodes, native assistant actions and turn recovery', () => {
    const definitions = []
    const slots = []
    const registrations = []
    const ctx = {
      connection: {},
      sessions: {},
      conversationEvents: { register: definition => definitions.push(definition) },
      effect: cleanup => cleanup,
      slots: {
        inject: (name, callback) => { slots.push(name); return callback() },
        register: (config, component) => { registrations.push({ config, component }); return { config, component } },
      },
    }
    apply(ctx)
    expect(inject).toEqual(['slots', 'conversationEvents', 'connection', 'sessions'])
    expect(definitions.map(item => item.kind)).toEqual([
      'rp-floor-user-actions',
      'rp-floor-assistant-actions',
      'rp-floor-opening-actions',
      'rp-floor-failed-assistant',
      'rp-message-suffix-action',
    ])
    expect(slots).toEqual([
      'conversation.chat.node',
      'conversation.chat.node',
      'conversation.chat.node',
      'conversation.chat.node',
      'conversation.chat.node',
      'conversation.chat.assistant-actions',
      'tool.call.toolview',
      'conversation.chat.turnTail',
    ])
    expect(registrations.find(item => item.config.name === 'conversation.chat.assistant-actions')?.config)
      .toMatchObject({ id: 'rp-message-actions', order: 20 })
    expect(registrations.find(item => item.config.name === 'tool.call.toolview')?.config)
      .toMatchObject({ key: 'rp_commit_turn' })
  })

  it('adds projected Roleplay operations without a render-time detail RPC', async () => {
    let AssistantActions
    const connection = {
      rpc: {
        call: vi.fn(async () => { throw new Error('render must not query message details') }),
      },
    }
    const sessions = { fork: vi.fn(), open: vi.fn() }
    const ctx = {
      connection,
      sessions,
      conversationEvents: { register: () => {} },
      effect: cleanup => cleanup,
      slots: {
        inject: (_name, callback) => callback(),
        register: (config, component) => {
          if (config.name === 'conversation.chat.assistant-actions') AssistantActions = component
          return { config, component }
        },
      },
    }
    apply(ctx)

    let sessionSnapshot = roleplayActionProjection({ turn: 2 }).snapshot
    const sessionsSnapshot = { byId: { 'session-1': { agentPreset: 'roleplay' } } }
    const props = {
      sessionId: 'session-1',
      messageId: 'assistant-1',
      connection,
      sessions,
      useSession: selector => selector(sessionSnapshot),
      useSessions: selector => selector(sessionsSnapshot),
    }
    const view = render(React.createElement(AssistantActions, props))

    await waitFor(() => expect(screen.getByRole('button', { name: '重新生成第 2 条回复' }).disabled).toBe(false))
    expect(screen.getByRole('button', { name: '从第 2 条回复新建对话' }).disabled).toBe(false)
    expect(screen.getByRole('button', { name: '编辑第 2 条回复' }).disabled).toBe(false)
    expect(screen.getByRole('button', { name: '删除第 2 条回复' }).disabled).toBe(false)
    expect(screen.queryByRole('button', { name: /复制/ })).toBeNull()
    expect(connection.rpc.call).not.toHaveBeenCalled()

    sessionSnapshot = { ...sessionSnapshot, running: true }
    view.rerender(React.createElement(AssistantActions, props))
    expect(screen.getByRole('button', { name: '重新生成第 2 条回复' }).disabled).toBe(true)
    expect(screen.getByRole('button', { name: '从第 2 条回复新建对话' }).disabled).toBe(true)
    expect(screen.getByRole('button', { name: '编辑第 2 条回复' }).disabled).toBe(true)
    expect(screen.getByRole('button', { name: '删除第 2 条回复' }).disabled).toBe(true)
    expect(connection.rpc.call).not.toHaveBeenCalled()
    view.unmount()
  })

  it('renders an actionable product status when native DSH has no visible failed reply', async () => {
    let TurnRecovery
    const sessionId = 'session-failed-empty'
    const target = { kind: 'turn', turn: 3 }
    const connection = {
      rpc: {
        call: vi.fn(async () => ({
          ok: true,
          value: { ok: true, value: { sessionId } },
        })),
      },
    }
    const ctx = {
      connection,
      sessions: {},
      conversationEvents: { register: () => {} },
      effect: cleanup => cleanup,
      slots: {
        inject: (_name, callback) => callback(),
        register: (config, component) => {
          if (config.name === 'conversation.chat.turnTail') TurnRecovery = component
          return { config, component }
        },
      },
    }
    apply(ctx)

    const state = {
      turn: 3,
      failed: true,
      deleted: false,
      committed: false,
      finalAssistantTarget: undefined,
      finalAssistantText: '',
      sharedAssetMutation: false,
      endReasonKind: 'error',
    }
    const turn = {
      turn: 3,
      status: 'closed',
      steps: [],
      data: new Map([['rp-floor-failed-assistant', state]]),
    }
    const matched = selectFailedAssistant({ turn })
    const location = { kind: 'turn', turn }
    const nodes = new Map([['user-3', {
      kind: 'rp-floor-user-actions',
      id: 'user-3',
      location,
      data: {
        seq: 30,
        turn: 3,
        text: '继续',
        target: { kind: 'message', role: 'user', messageId: 'user-3' },
        hasNonTextContent: false,
        deleted: false,
      },
    }]])
    const view = render(React.createElement(TurnRecovery, {
      sessionId,
      matched,
      connection,
      sessions: {},
      useSession: selector => selector({ running: false, chat: { nodes } }),
      useSessions: selector => selector({ byId: { [sessionId]: { agentPreset: 'roleplay' } } }),
    }))

    expect(view.getByText('回复生成失败')).not.toBeNull()
    expect(view.getByText('没有生成可用内容，可以重新尝试。')).not.toBeNull()
    expect(view.container.querySelector('[data-state="error"]')).not.toBeNull()
    expect(view.getByRole('button', { name: '重新生成' })).not.toBeNull()
    expect(view.getByRole('button', { name: '删除这次记录' })).not.toBeNull()

    fireEvent.click(view.getByRole('button', { name: '重新生成' }))
    await waitFor(() => expect(connection.rpc.call).toHaveBeenCalledWith(
      '/rp-message-actions',
      'reroll',
      { sessionId, target },
    ))
    view.unmount()
  })

  it('matches server tail rules from resident Conversation state', () => {
    const projected = roleplayActionProjection({ turn: 2, userTexts: ['先看这里', '再继续'] })
    const [firstUser, lastUser] = projected.userTargets

    expect(projectMessageActionDetail(projected.snapshot, firstUser)?.canSaveAndReroll).toBe(false)
    expect(projectMessageActionDetail(projected.snapshot, lastUser)?.canSaveAndReroll).toBe(true)
    expect(projectMessageActionDetail(projected.snapshot, projected.assistantTarget)?.canReroll).toBe(true)
    expect(projectMessageActionDetail(
      { ...projected.snapshot, running: true },
      projected.assistantTarget,
    )).toMatchObject({ canReroll: true, sessionRunning: true })

    const later = roleplayActionProjection({ turn: 3, sharedAssetMutation: true })
    const snapshot = {
      running: false,
      chat: { nodes: new Map([...projected.snapshot.chat.nodes, ...later.snapshot.chat.nodes]) },
    }
    expect(projectMessageActionDetail(snapshot, projected.assistantTarget)).toMatchObject({
      canReroll: false,
      deleteIncludesSharedAssetMutation: true,
    })
    expect(projectMessageActionDetail(snapshot, later.assistantTarget)?.canReroll).toBe(false)
  })

  it('leaves inherited one-shot subagent transcripts read-only', () => {
    let AssistantActions
    const connection = { rpc: { call: vi.fn() } }
    const ctx = {
      connection,
      sessions: {},
      conversationEvents: { register: () => {} },
      effect: cleanup => cleanup,
      slots: {
        inject: (_name, callback) => callback(),
        register: (config, component) => {
          if (config.name === 'conversation.chat.assistant-actions') AssistantActions = component
          return { config, component }
        },
      },
    }
    apply(ctx)

    const view = render(React.createElement(AssistantActions, {
      sessionId: 'writer-child',
      messageId: 'writer-output',
      connection,
      sessions: {},
      useSession: selector => selector({ chat: {} }),
      useSessions: selector => selector({
        byId: {
          'writer-child': {
            agentPreset: 'roleplay',
            origin: 'subagent',
            parentId: 'roleplay-root',
          },
        },
      }),
    }))

    expect(view.container.childElementCount).toBe(0)
    expect(connection.rpc.call).not.toHaveBeenCalled()
    view.unmount()
  })

  it('renders projected user actions without querying message details', () => {
    let UserActions
    const connection = {
      rpc: {
        call: vi.fn(async () => { throw new Error('connection replaced during HMR') }),
      },
    }
    const ctx = {
      connection,
      sessions: {},
      conversationEvents: { register: () => {} },
      effect: cleanup => cleanup,
      slots: {
        inject: (_name, callback) => callback(),
        register: (config, component) => {
          if (config.name === 'conversation.chat.node' && config.key === 'rp-floor-user-actions') UserActions = component
          return { config, component }
        },
      },
    }
    apply(ctx)

    const parent = document.createElement('div')
    const userRow = flowRow('user', parent)
    const hover = document.createElement('div')
    hover.dataset.timeHoverRoot = ''
    hover.append(document.createElement('div'), document.createElement('div'))
    userRow.append(hover)
    const actionRow = flowRow('rp-floor-user-actions', parent)
    const mount = document.createElement('div')
    actionRow.append(mount)
    document.body.append(parent)

    const location = turnLocation(1)
    const view = render(React.createElement(UserActions, {
      sessionId: 'session-user-fallback',
      node: {
        kind: 'rp-floor-user-actions',
        id: 'user-fallback',
        location,
        data: {
          seq: 1,
          turn: 1,
          target: { kind: 'message', role: 'user', messageId: 'user-fallback' },
          text: '继续', hadText: true, hasNonTextContent: false, time: Date.now(),
        },
      },
      connection,
      sessions: {},
      useSession: selector => selector({ running: false, chat: { nodes: new Map() } }),
      useSessions: selector => selector({ byId: { 'session-user-fallback': { agentPreset: 'roleplay' } } }),
    }), { container: mount })

    expect(screen.getByRole('button', { name: '复制第 1 条消息' }).disabled).toBe(false)
    expect(screen.getByRole('button', { name: '编辑第 1 条消息' }).disabled).toBe(false)
    expect(screen.getByRole('button', { name: '删除第 1 条消息' }).disabled).toBe(false)
    expect(connection.rpc.call).not.toHaveBeenCalled()
    expect(screen.queryByText('暂时无法完成这次更改，请稍后再试。')).toBeNull()
    expect(userRow.hasAttribute('data-rp-message-actions-user-native-hidden')).toBe(true)

    view.unmount()
    expect(userRow.hasAttribute('data-rp-message-actions-user-native-hidden')).toBe(false)
    parent.remove()
  })

  it('allows unchanged message text to be saved or regenerated', async () => {
    let UserActions
    const sessionId = 'session-unchanged-edit'
    const projection = roleplayActionProjection({ turn: 2, userTexts: ['继续'] })
    const target = projection.userTargets[0]
    const node = projection.snapshot.chat.nodes.get(target.messageId)
    const connection = {
      rpc: {
        call: vi.fn(async () => ({
          ok: true,
          value: { ok: true, value: { sessionId } },
        })),
      },
    }
    const ctx = {
      connection,
      sessions: {},
      conversationEvents: { register: () => {} },
      effect: cleanup => cleanup,
      slots: {
        inject: (_name, callback) => callback(),
        register: (config, component) => {
          if (config.name === 'conversation.chat.node' && config.key === 'rp-floor-user-actions') UserActions = component
          return { config, component }
        },
      },
    }
    apply(ctx)

    const parent = document.createElement('div')
    const userRow = flowRow('user', parent)
    const hover = document.createElement('div')
    hover.dataset.timeHoverRoot = ''
    const content = document.createElement('div')
    content.append(document.createElement('div'))
    hover.append(content, document.createElement('div'))
    userRow.append(hover)
    const actionRow = flowRow('rp-floor-user-actions', parent)
    const mount = document.createElement('div')
    actionRow.append(mount)
    document.body.append(parent)

    const view = render(React.createElement(UserActions, {
      sessionId,
      node,
      connection,
      sessions: {},
      useSession: selector => selector(projection.snapshot),
      useSessions: selector => selector({ byId: { [sessionId]: { agentPreset: 'roleplay' } } }),
    }), { container: mount })

    fireEvent.click(screen.getByRole('button', { name: '编辑第 2 条消息' }))
    expect(screen.getByRole('textbox', { name: '消息内容' }).value).toBe('继续')
    expect(screen.getByRole('button', { name: '保存' }).disabled).toBe(false)
    expect(screen.getByRole('button', { name: '保存并重新生成' }).disabled).toBe(false)

    fireEvent.click(screen.getByRole('button', { name: '保存' }))
    await waitFor(() => expect(screen.queryByRole('textbox', { name: '消息内容' })).toBeNull())
    expect(connection.rpc.call).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: '编辑第 2 条消息' }))
    fireEvent.click(screen.getByRole('button', { name: '保存并重新生成' }))
    await waitFor(() => expect(connection.rpc.call).toHaveBeenCalledWith(
      '/rp-message-actions',
      'reroll',
      { sessionId, target, content: '继续' },
    ))

    view.unmount()
    parent.remove()
  })

  it('keeps failed commits understandable while successful internal commits render no row body', () => {
    let CommitView
    const ctx = {
      connection: {},
      sessions: {},
      conversationEvents: { register: () => {} },
      effect: cleanup => cleanup,
      slots: {
        inject: (_name, callback) => callback(),
        register: (config, component) => {
          if (config.name === 'tool.call.toolview' && config.key === 'rp_commit_turn') CommitView = component
          return { config, component }
        },
      },
    }
    apply(ctx)

    const failed = render(React.createElement(CommitView, {
      block: { kind: 'tool-result', isError: true },
    }))
    expect(failed.getByText('回复未能完成保存')).not.toBeNull()
    expect(failed.getByText(/会话变量变化没有生效/)).not.toBeNull()
    failed.unmount()

    const running = render(React.createElement(CommitView, {
      block: { callId: 'commit-running', name: 'rp_commit_turn' },
    }))
    expect(running.container.querySelector('[data-rp-commit-tool-status="running"]')).not.toBeNull()
    expect(running.container.textContent).toBe('')
    running.unmount()
  })

  it('keeps opening edit actions on their own stable native message row', () => {
    const opening = openingEvent('opening-1', '原开场', 2)
    const match = openingFloorNodeDefinition.match(opening)
    let state = openingFloorNodeDefinition.start({}, { event: opening, ...match })
    expect(match).toEqual({ id: 'opening-1', role: 'start' })

    const edit = openingActionEvent('opening-1', '改写开场', 'edit', 20)
    const update = openingFloorNodeDefinition.match(edit)
    expect(update).toEqual({ id: 'opening-1', role: 'update' })
    state = openingFloorNodeDefinition.update({ state }, { event: edit, ...update })
    expect(state).toMatchObject({ seq: 2, text: '改写开场', edited: true, deleted: false })

    const remove = openingActionEvent('opening-1', '', 'delete', 21)
    expect(suffixActionNodeDefinition.match(remove)).toBeNull()

    const parent = document.createElement('div')
    const message = flowRow('assistant-step', parent)
    flowRow('rp-message-avatar-opening', parent)
    const host = flowRow('rp-floor-opening-actions', parent)
    const anchor = document.createElement('span')
    host.append(anchor)
    expect(actionNodeHost(anchor)).toBe(host)
    expect(messageRowForAction(host, 'assistant')).toBe(message)
  })

  it('resolves the current Assistant renderer through the public Chat Node slot anchor', () => {
    const row = flowRow('assistant-step', document.createElement('div'))
    const outlet = document.createElement('div')
    outlet.dataset.slot = 'conversation.chat.node'
    const content = document.createElement('div')
    content.textContent = '当前开场白正文'
    outlet.append(content)
    row.append(outlet)

    expect(assistantMessageContent(row)).toBe(content)
    expect(assistantMessageContent(flowRow('assistant-step', document.createElement('div')))).toBeNull()
  })

  it('keeps every inline editor on the shared borderless 3–6 line interaction', () => {
    const cancel = vi.fn()
    const save = vi.fn()
    const reroll = vi.fn()
    const setBody = vi.fn()
    const view = render(React.createElement(InlineMessageEditor, {
      surface: 'assistant',
      unitLabel: '开场白',
      detail: { content: '原开场白', sharedAssetMutation: false },
      body: '修改后的开场白',
      setBody,
      pending: null,
      error: null,
      canSaveAndReroll: true,
      onCancel: cancel,
      onSave: save,
      onSaveAndReroll: reroll,
    }))

    const openingEditor = view.getByRole('textbox', { name: '开场白内容' })
    expect(document.activeElement).toBe(openingEditor)
    expect(view.queryByText(/修改后只会更新|\d+ 字/)).toBeNull()
    expect(view.getByRole('button', { name: '保存' }).disabled).toBe(false)
    expect(view.queryByRole('button', { name: '保存并重新生成' })).toBeNull()
    fireEvent.keyDown(openingEditor, { key: 'Escape' })
    expect(cancel).toHaveBeenCalledOnce()
    fireEvent.keyDown(openingEditor, { key: 'Enter', ctrlKey: true })
    expect(save).toHaveBeenCalledOnce()

    view.rerender(React.createElement(InlineMessageEditor, {
      surface: 'user',
      unitLabel: '消息',
      detail: { content: '原消息', sharedAssetMutation: false },
      body: '修改后的消息',
      setBody,
      pending: null,
      error: null,
      canSaveAndReroll: true,
      onCancel: cancel,
      onSave: save,
      onSaveAndReroll: reroll,
      userHasNonTextContent: true,
    }))
    expect(view.getByRole('textbox', { name: '消息内容' })).not.toBeNull()
    expect(view.getByText('只修改文字，图片会保留。')).not.toBeNull()
    expect(view.queryByRole('button', { name: '保存并重新生成' })).toBeNull()

    view.rerender(React.createElement(InlineMessageEditor, {
      surface: 'user',
      unitLabel: '消息',
      detail: { content: '原消息', sharedAssetMutation: false },
      body: '修改后的消息',
      setBody,
      pending: null,
      error: null,
      canSaveAndReroll: true,
      onCancel: cancel,
      onSave: save,
      onSaveAndReroll: reroll,
    }))
    expect(view.queryByText('只修改文字，图片会保留。')).toBeNull()
    expect(view.getByRole('button', { name: '保存并重新生成' }).disabled).toBe(false)
  })

  it('sizes wrapped editor content from three through six rows', () => {
    const textarea = document.createElement('textarea')
    Object.defineProperty(textarea, 'scrollHeight', { configurable: true, value: 24 })
    sizeInlineEditor(textarea)
    expect(textarea.style.height).toBe('72px')
    expect(textarea.style.overflowY).toBe('hidden')

    Object.defineProperty(textarea, 'scrollHeight', { configurable: true, value: 120 })
    sizeInlineEditor(textarea)
    expect(textarea.style.height).toBe('120px')
    expect(textarea.style.overflowY).toBe('hidden')

    Object.defineProperty(textarea, 'scrollHeight', { configurable: true, value: 240 })
    sizeInlineEditor(textarea)
    expect(textarea.style.height).toBe('144px')
    expect(textarea.style.overflowY).toBe('auto')
  })

  it('folds native user and assistant edit carriers at the original stable message id', () => {
    const user = userEvent('user-1', '原消息', 3)
    const userMatch = userFloorNodeDefinition.match(user)
    let userState = userFloorNodeDefinition.start({}, { event: user, location: turnLocation(1), role: 'start' })
    expect(userState.target).toEqual({ kind: 'message', role: 'user', messageId: 'user-1' })
    const userEdit = actionEvent('edit', [{ kind: 'message', role: 'user', messageId: 'user-1' }], '改写用户消息', 20, 'user')
    const userUpdate = userFloorNodeDefinition.match(userEdit)
    expect(userUpdate).toEqual({ id: 'user-1', role: 'update' })
    userState = userFloorNodeDefinition.update({ state: userState }, { event: userEdit, ...userUpdate })
    expect(userState).toMatchObject({ seq: 3, text: '改写用户消息', edited: true, deleted: false })

    const assistant = assistantEvent('assistant-1', '原回复', 8)
    const assistantMatch = assistantFloorNodeDefinition.match(assistant)
    let assistantState = assistantFloorNodeDefinition.start({}, { event: assistant, ...assistantMatch })
    const assistantEdit = actionEvent('edit', [{
      kind: 'message', role: 'assistant', messageId: 'assistant-1', turn: 1, step: 1,
    }], '改写助手回复', 21, 'assistant')
    const assistantUpdate = assistantFloorNodeDefinition.match(assistantEdit)
    expect(assistantUpdate).toEqual({ id: 'assistant-1', role: 'update' })
    assistantState = assistantFloorNodeDefinition.update({ state: assistantState }, { event: assistantEdit, ...assistantUpdate })
    expect(assistantState).toMatchObject({ seq: 8, text: '改写助手回复', edited: true, deleted: false })
  })

  it('materializes actions for image-only users and resolves an edit target that preserves the gallery', () => {
    const user = userContentEvent('user-image', [{
      type: 'image',
      attachment: { attachmentId: `sha256:${'a'.repeat(64)}`, mediaType: 'image/png', bytes: 4, width: 1, height: 1 },
    }], 4)
    const match = userFloorNodeDefinition.match(user)
    expect(match).toEqual({ id: 'user-image', role: 'start' })
    const state = userFloorNodeDefinition.start({}, { event: user, location: turnLocation(1), role: 'start' })
    const node = userFloorNodeDefinition.buildViewNode({
      key: 'rp-floor-user-actions:user-image', id: 'user-image', state,
      start: { location: turnLocation(1) },
    })

    expect(state).toMatchObject({ text: '', hadText: false, hasNonTextContent: true, deleted: false })
    expect(node?.kind).toBe('rp-floor-user-actions')

    const row = document.createElement('div')
    const hover = document.createElement('div')
    hover.dataset.timeHoverRoot = ''
    const stack = document.createElement('div')
    const gallery = document.createElement('div')
    gallery.dataset.testGallery = ''
    stack.append(gallery)
    hover.append(stack, document.createElement('div'))
    row.append(hover)

    expect(userMessageContentStack(row)).toBe(stack)
    expect(userMessageContentStack(row)?.contains(gallery)).toBe(true)
  })

  it('replays an edited non-tail assistant into the fork before opening it', async () => {
    const order = []
    const target = {
      kind: 'message', role: 'assistant', messageId: 'assistant-1', turn: 2, step: 1,
    }
    const sessions = {
      fork: vi.fn(async options => { order.push(['fork', options]); return 'child-1' }),
      open: vi.fn(childId => { order.push(['open', childId]) }),
    }
    const connection = successfulConnection((endpoint, payload) => { order.push(['rpc', endpoint, payload]) })

    await forkMessageBranch({
      sessions, connection, sessionId: 'parent-1', atSeq: 24,
      target, replayEdit: true, content: '已编辑的非尾部回复',
    })

    expect(order).toEqual([
      ['fork', { sessionId: 'parent-1', atSeq: 24, increaseTitle: true }],
      ['rpc', 'edit', { sessionId: 'child-1', target, content: '已编辑的非尾部回复' }],
      ['open', 'child-1'],
    ])
  })

  it('replays an edited opening through the same stable-target branch path', async () => {
    const target = {
      kind: 'message', role: 'assistant', messageId: 'opening-1', turn: 1, step: 1,
    }
    const sessions = { fork: vi.fn(async () => 'child-opening'), open: vi.fn() }
    const connection = successfulConnection()

    await forkMessageBranch({
      sessions, connection, sessionId: 'parent-opening', atSeq: 2,
      target, replayEdit: true, content: '已编辑的开场白',
    })

    expect(connection.rpc.call).toHaveBeenCalledWith('/rp-message-actions', 'edit', {
      sessionId: 'child-opening', target, content: '已编辑的开场白',
    })
    expect(sessions.open).toHaveBeenCalledWith('child-opening')
  })

  it('opens a branch directly when its edit is already inside the fork prefix', async () => {
    const sessions = { fork: vi.fn(async () => 'child-plain'), open: vi.fn() }
    const connection = successfulConnection()
    await forkMessageBranch({
      sessions, connection, sessionId: 'parent-plain', atSeq: 8,
      target: { kind: 'message', role: 'assistant', messageId: 'assistant-plain', turn: 1, step: 1 },
      replayEdit: false, content: '已包含在截取前缀中的编辑',
    })
    expect(connection.rpc.call).not.toHaveBeenCalled()
    expect(sessions.open).toHaveBeenCalledWith('child-plain')
  })

  it('does not open a fork child when replaying its historical edit fails', async () => {
    const sessions = { fork: vi.fn(async () => 'child-incomplete'), open: vi.fn() }
    const connection = {
      rpc: {
        call: vi.fn(async () => ({
          ok: true,
          value: { ok: false, error: { code: 'MESSAGE_NOT_FOUND' } },
        })),
      },
    }
    await expect(forkMessageBranch({
      sessions, connection, sessionId: 'parent-incomplete', atSeq: 10,
      target: { kind: 'message', role: 'assistant', messageId: 'assistant-missing', turn: 1, step: 1 },
      replayEdit: true, content: '无法重放的编辑',
    })).rejects.toMatchObject({ code: 'MESSAGE_NOT_FOUND' })
    expect(sessions.open).not.toHaveBeenCalled()
  })

  it('publishes one suffix effect for delete and reroll carriers', () => {
    const event = actionEvent('delete', [{ kind: 'message', role: 'user', messageId: 'user-1' }], '', 22, 'assistant')
    expect(suffixActionNodeDefinition.match(event)).toEqual({ id: '22', role: 'start' })
    expect(suffixActionNodeDefinition.start({}, { event })).toMatchObject({
      seq: 22,
      replacementStart: 1,
      action: { operation: 'delete' },
    })
    expect(suffixActionNodeDefinition.match(assistantEvent('assistant-1', '正文', 8))).toBeNull()
  })

  it('hides a deleted assistant even when its turn start is outside the history window', () => {
    let AssistantEffects
    const ctx = {
      connection: {},
      sessions: {},
      conversationEvents: { register: () => {} },
      effect: cleanup => cleanup,
      slots: {
        inject: (_name, callback) => callback(),
        register: (config, component) => {
          if (config.name === 'conversation.chat.node' && config.key === 'rp-floor-assistant-actions') {
            AssistantEffects = component
          }
          return { config, component }
        },
      },
    }
    apply(ctx)

    const target = {
      kind: 'message', role: 'assistant', messageId: 'retired-assistant', turn: 2, step: 1,
    }
    const parent = document.createElement('div')
    const assistant = flowRow('assistant-step', parent)
    flowRow('rp-message-avatar-assistant', parent)
    const host = flowRow('rp-floor-assistant-actions', parent)
    const mount = document.createElement('div')
    host.append(mount)
    document.body.append(parent)

    const view = render(React.createElement(AssistantEffects, {
      sessionId: 'session-1',
      node: {
        location: { kind: 'unresolved' },
        data: { deleted: true, target },
      },
      useSessions: selector => selector({ byId: { 'session-1': { agentPreset: 'roleplay' } } }),
    }), { container: mount })

    expect(assistant.hasAttribute('data-rp-message-actions-hidden-deleted-assistant')).toBe(true)
    view.unmount()
    expect(assistant.hasAttribute('data-rp-message-actions-hidden-deleted-assistant')).toBe(false)
    parent.remove()
  })

  it('keeps only canonical closing prose while collapsing a settled turn trace', () => {
    const parent = document.createElement('div')
    const user = flowRow('user', parent)
    const userActions = flowRow('rp-floor-user-actions', parent)
    const context = flowRow('context', parent)
    const intermediate = flowRow('assistant-step', parent)
    const tool = flowRow('tool-call', parent)
    const intermediateActions = flowRow('rp-floor-assistant-actions', parent)
    const closing = flowRow('assistant-step', parent)
    const avatar = flowRow('rp-message-avatar-assistant', parent)
    const host = flowRow('rp-floor-assistant-actions', parent)
    const notice = flowRow('turn-max-tokens', parent)
    const nativeTail = flowRow('turn-tail', parent)

    expect(settledAssistantTraceRows(host)).toEqual([intermediateActions, tool, intermediate, context])
    expect(settledAssistantTraceRows(host)).not.toContain(user)
    expect(settledAssistantTraceRows(host)).not.toContain(userActions)
    expect(settledAssistantTraceRows(host)).not.toContain(closing)
    expect(settledAssistantTraceRows(host)).not.toContain(avatar)
    expect(settledTurnTailRow(host)).toBe(nativeTail)
    expect(settledTurnTailRow(host)).not.toBe(notice)
  })

  it('hides only internal commit attempts once the turn commits successfully', () => {
    const parent = document.createElement('div')
    flowRow('user', parent)
    const failedCommit = flowRow('tool-call', parent)
    const failedMarker = document.createElement('span')
    failedMarker.dataset.rpCommitToolStatus = 'failed'
    failedCommit.append(failedMarker)
    const ordinaryTool = flowRow('tool-call', parent)
    const ordinaryContent = document.createElement('span')
    ordinaryContent.textContent = 'ordinary tool'
    ordinaryTool.append(ordinaryContent)
    const successfulCommit = flowRow('tool-call', parent)
    const successMarker = document.createElement('span')
    successMarker.dataset.rpCommitToolStatus = 'succeeded'
    successfulCommit.append(successMarker)

    expect(successfulCommitRows(successfulCommit)).toEqual([successfulCommit, failedCommit])
    expect(successfulCommitRows(successfulCommit)).not.toContain(ordinaryTool)
  })

  it('declines every intermediate assistant action node in a multi-step turn', () => {
    const state = { failed: false, finalAssistantSeq: 12 }
    const location = {
      kind: 'turn',
      turn: { turn: 1, status: 'closed', data: new Map([['rp-floor-failed-assistant', state]]) },
    }
    expect(isCanonicalAssistantAction({ location, data: { seq: 8 } })).toBe(false)
    expect(isCanonicalAssistantAction({ location, data: { seq: 12 } })).toBe(true)
    state.failed = true
    expect(isCanonicalAssistantAction({ location, data: { seq: 12 } })).toBe(false)
    location.turn.status = 'open'
    state.failed = false
    expect(isCanonicalAssistantAction({ location, data: { seq: 12 } })).toBe(false)
  })

  it('settles a failed turn after its complete trace while preserving the native footer', () => {
    const parent = document.createElement('div')
    flowRow('user', parent)
    const context = flowRow('context', parent)
    const intermediate = readableAssistantRow(parent, '中间正文')
    const partial = readableAssistantRow(parent, '最后可读片段')
    const tail = flowRow('turn-tail', parent)
    const tool = flowRow('tool-call', parent)
    const emptyStep = flowRow('assistant-step', parent)
    const error = flowRow('turn-error', parent)
    const maxTokens = flowRow('turn-max-tokens', parent)
    const effect = flowRow('rp-floor-failed-assistant', parent)

    expect(failedAssistantTraceRows(effect)).toEqual([maxTokens, error, emptyStep, tool, intermediate, context])
    expect(failedAssistantTraceRows(effect)).not.toContain(tail)
    expect(failedAssistantTraceRows(effect)).not.toContain(partial)
    expect(failedAssistantTraceRows(effect, 'max-tokens')).not.toContain(maxTokens)
    expect(failedAssistantTraceRows(effect, 'max-tokens')).toContain(error)
  })

  it('targets a durable interrupted assistant for failed actions and falls back to the turn without one', () => {
    const start = { seq: 30, time: 1030, type: 'turn/start', data: { turn: 4 } }
    let state = failedAssistantNodeDefinition.start({}, {
      event: start,
      ...failedAssistantNodeDefinition.match(start),
    })
    const interrupted = {
      ...assistantEvent('assistant-interrupted', '生成到这里时被中断', 34),
      sourceEventSeqs: [32, 33],
      data: {
        ...assistantEvent('assistant-interrupted', '生成到这里时被中断', 34).data,
        turn: 4,
        step: 2,
        interrupted: true,
      },
    }
    state = failedAssistantNodeDefinition.update({ state }, {
      event: interrupted,
      ...failedAssistantNodeDefinition.match(interrupted),
    })
    const end = {
      seq: 36,
      time: 1036,
      type: 'turn/end',
      data: { turn: 4, reason: { kind: 'aborted', reason: { kind: 'user' } } },
    }
    state = failedAssistantNodeDefinition.update({ state }, {
      event: end,
      ...failedAssistantNodeDefinition.match(end),
    })
    const turn = {
      turn: 4,
      status: 'closed',
      start,
      end,
      data: new Map([['rp-floor-failed-assistant', state]]),
    }
    expect(selectFailedAssistant({ turn })).toMatchObject({
      target: {
        kind: 'message', role: 'assistant', messageId: 'assistant-interrupted', turn: 4, step: 2,
      },
      copyText: '生成到这里时被中断',
      canEdit: true,
      edited: false,
      messageTime: 1034,
      nativeStatusVisible: true,
    })
    expect(state).toMatchObject({
      endReasonKind: 'aborted', endCancelKind: 'user', finalAssistantInterrupted: true,
    })
    expect(selectFailedTurnRecovery({ turn })).toBeNull()
    expect(failedAssistantNodeDefinition.buildViewNode({
      key: 'rp-floor-failed-assistant:4', id: '4', state,
      start: { event: start, location: { kind: 'turn', turn } },
    })).toMatchObject({ kind: 'rp-floor-failed-assistant', anchorSeq: 36.05 })

    const edit = actionEvent('edit', [{
      kind: 'message', role: 'assistant', messageId: 'assistant-interrupted', turn: 4, step: 2,
    }], '人工补完后的中断回复', 40, 'assistant')
    state = failedAssistantNodeDefinition.update({ state }, {
      event: edit,
      ...failedAssistantNodeDefinition.match(edit),
    })
    turn.data.set('rp-floor-failed-assistant', state)
    expect(selectFailedAssistant({ turn })).toMatchObject({
      copyText: '人工补完后的中断回复', canEdit: true, edited: true,
    })

    const emptyStart = { seq: 50, time: 1050, type: 'turn/start', data: { turn: 5 } }
    let emptyState = failedAssistantNodeDefinition.start({}, {
      event: emptyStart,
      ...failedAssistantNodeDefinition.match(emptyStart),
    })
    const emptyEnd = {
      seq: 51,
      time: 1051,
      type: 'turn/end',
      data: { turn: 5, reason: { kind: 'error', error: { message: 'pre-step failed' } } },
    }
    emptyState = failedAssistantNodeDefinition.update({ state: emptyState }, {
      event: emptyEnd,
      ...failedAssistantNodeDefinition.match(emptyEnd),
    })
    const emptyTurn = {
      turn: 5,
      status: 'closed',
      start: emptyStart,
      end: emptyEnd,
      data: new Map([['rp-floor-failed-assistant', emptyState]]),
    }
    expect(selectFailedAssistant({ turn: emptyTurn })).toMatchObject({
      target: { kind: 'turn', turn: 5 }, copyText: '', canEdit: false, edited: false,
      nativeStatusVisible: false,
    })
    expect(selectFailedTurnRecovery({ turn: emptyTurn })).toMatchObject({
      target: { kind: 'turn', turn: 5 }, copyText: '', canEdit: false,
    })

    const parent = document.createElement('div')
    const partial = readableAssistantRow(parent, '生成到这里时被中断')
    const tail = flowRow('turn-tail', parent)
    const actionHost = document.createElement('div')
    actionHost.dataset.rpFloorFailedAssistantActions = ''
    const anchor = document.createElement('span')
    actionHost.append(anchor)
    tail.append(actionHost)
    expect(actionNodeHost(anchor)).toBe(tail)
    expect(messageRowForAction(tail, 'assistant')).toBe(partial)

    const errorStatus = failedTurnStatus(selectFailedAssistant({ turn: emptyTurn }), {
      canReroll: true, sharedAssetMutation: false,
    })
    expect(errorStatus).toEqual({
      state: 'error', title: '回复生成失败', message: '没有生成可用内容，可以重新尝试。',
    })

    const blockedState = {
      ...state,
      endReasonKind: 'blocked',
      endCancelKind: undefined,
      finalAssistantInterrupted: false,
    }
    const blockedTurn = {
      ...turn,
      data: new Map([['rp-floor-failed-assistant', blockedState]]),
    }
    expect(failedTurnStatus(selectFailedAssistant({ turn: blockedTurn }), {
      canReroll: false, sharedAssetMutation: false,
    })).toEqual({
      state: 'warning',
      title: '回复未能完成',
      message: '已生成的内容可能不完整。你可以继续发送消息。',
    })

    const maxTokenState = { ...emptyState, endReasonKind: 'max-tokens' }
    const maxTokenTurn = {
      ...emptyTurn,
      data: new Map([['rp-floor-failed-assistant', maxTokenState]]),
    }
    expect(failedTurnStatus(selectFailedAssistant({ turn: maxTokenTurn }), {
      canReroll: true, sharedAssetMutation: false,
    })).toBeNull()
  })

  it('replaces only the native branch control following the assistant action slot', () => {
    const actions = document.createElement('div')
    const copy = document.createElement('button')
    const outlet = document.createElement('div')
    outlet.dataset.slot = 'conversation.chat.assistant-actions'
    const anchor = document.createElement('span')
    outlet.append(anchor)
    const branch = document.createElement('button')
    const clock = document.createElement('span')
    actions.append(copy, outlet, branch, clock)

    expect(nativeAssistantBranchButton(anchor)).toBe(branch)
    branch.remove()
    expect(nativeAssistantBranchButton(anchor)).toBeNull()
  })

  it('resolves message rows through avatar nodes and returns the full delete suffix', () => {
    const parent = document.createElement('div')
    const firstUser = flowRow('user', parent)
    flowRow('rp-message-avatar-user', parent)
    const firstUserActions = actionRow({ kind: 'message', role: 'user', messageId: 'user-1' }, parent)
    flowRow('context', parent)
    const firstAssistant = flowRow('assistant-step', parent)
    flowRow('rp-message-avatar-assistant', parent)
    const firstAssistantActions = actionRow({
      kind: 'message', role: 'assistant', messageId: 'assistant-1', turn: 1, step: 1,
    }, parent, 'rp-floor-assistant-actions')
    const secondUser = flowRow('user', parent)
    actionRow({ kind: 'message', role: 'user', messageId: 'user-2' }, parent)
    const carrier = flowRow('rp-message-suffix-action', parent)

    expect(messageRowForAction(firstUserActions, 'user')).toBe(firstUser)
    expect(messageRowForAction(firstAssistantActions, 'assistant')).toBe(firstAssistant)
    expect(suffixActionRows(carrier, {
      kind: 'message', role: 'assistant', messageId: 'assistant-1', turn: 1, step: 1,
    })).toEqual([
      firstUserActions.nextElementSibling, firstAssistant, firstAssistant.nextElementSibling,
      firstAssistantActions, secondUser, secondUser.nextElementSibling,
    ])
    expect(suffixActionRows(carrier, { kind: 'message', role: 'user', messageId: 'user-1' })[0]).toBe(firstUser)
    expect(deletedUserRows(firstUserActions)).toEqual([
      firstUser, firstUser.nextElementSibling, firstUserActions,
    ])
    expect(deletedAssistantTraceRows(firstAssistantActions)).toEqual([
      firstAssistant, firstAssistant.nextElementSibling, firstAssistantActions,
    ])
  })

  it('reconciles a reroll suffix when the retired target marker lands after the carrier effect', async () => {
    let SuffixEffect
    const ctx = {
      connection: {},
      sessions: {},
      conversationEvents: { register: () => {} },
      effect: cleanup => cleanup,
      slots: {
        inject: (_name, callback) => callback(),
        register: (config, component) => {
          if (config.name === 'conversation.chat.node' && config.key === 'rp-message-suffix-action') {
            SuffixEffect = component
          }
          return { config, component }
        },
      },
    }
    apply(ctx)

    const target = { kind: 'message', role: 'user', messageId: 'retired-user' }
    const parent = document.createElement('div')
    const retiredUser = flowRow('user', parent)
    const retiredActions = flowRow('rp-floor-user-actions', parent)
    const lateMarker = document.createElement('span')
    retiredActions.append(lateMarker)
    const retiredAssistant = flowRow('assistant-step', parent)
    const carrier = flowRow('rp-message-suffix-action', parent)
    const mount = document.createElement('div')
    carrier.append(mount)
    const replayedUser = flowRow('user', parent)
    document.body.append(parent)

    const view = render(React.createElement(SuffixEffect, {
      node: {
        key: 'carrier-effect',
        id: 'carrier-1',
        anchorSeq: 30.09,
        data: { replacementStart: 1, action: { operation: 'reroll', targets: [target] } },
      },
      useSession: selector => selector({ hasMore: false, chat: { order: [], nodes: new Map() } }),
    }), { container: mount })
    expect(retiredUser.hasAttribute('data-rp-message-actions-hidden-suffix')).toBe(false)

    lateMarker.setAttribute('data-rp-message-action-key', rpMessageActionTargetKey(target))
    await waitFor(() => expect(retiredUser.hasAttribute('data-rp-message-actions-hidden-suffix')).toBe(true))
    expect(retiredActions.hasAttribute('data-rp-message-actions-hidden-suffix')).toBe(true)
    expect(retiredAssistant.hasAttribute('data-rp-message-actions-hidden-suffix')).toBe(true)
    expect(replayedUser.hasAttribute('data-rp-message-actions-hidden-suffix')).toBe(false)

    view.unmount()
    expect(retiredUser.hasAttribute('data-rp-message-actions-hidden-suffix')).toBe(false)
    parent.remove()
  })

  it('clips a reroll suffix to the resident page until its original target loads', async () => {
    let SuffixEffect
    const ctx = {
      connection: {},
      sessions: {},
      conversationEvents: { register: () => {} },
      effect: cleanup => cleanup,
      slots: {
        inject: (_name, callback) => callback(),
        register: (config, component) => {
          if (config.name === 'conversation.chat.node' && config.key === 'rp-message-suffix-action') {
            SuffixEffect = component
          }
          return { config, component }
        },
      },
    }
    apply(ctx)

    const target = { kind: 'message', role: 'user', messageId: 'retired-user' }
    const parent = document.createElement('div')
    const residentContext = flowRow('context', parent, 'context-27')
    const retiredAssistant = flowRow('assistant-step', parent, 'assistant-253')
    const nativeCarrier = flowRow('assistant-step', parent, 'assistant-259')
    const carrier = flowRow('rp-message-suffix-action', parent, 'suffix-259')
    const mount = document.createElement('div')
    carrier.append(mount)
    const replayedUser = flowRow('user', parent, 'user-260')
    document.body.append(parent)

    const residentNodes = new Map([
      ['context-27', { anchorSeq: 27 }],
      ['assistant-253', { anchorSeq: 253 }],
      ['assistant-259', { anchorSeq: 259 }],
      ['suffix-259', { anchorSeq: 259.09 }],
      ['user-260', { anchorSeq: 260 }],
    ])
    let snapshot = {
      hasMore: true,
      chat: {
        order: ['context-27', 'assistant-253', 'assistant-259', 'suffix-259', 'user-260'],
        nodes: { get: key => residentNodes.get(key) },
      },
    }
    const useSession = selector => selector(snapshot)
    const node = {
      key: 'suffix-259',
      id: '259',
      anchorSeq: 259.09,
      data: { replacementStart: 15, action: { operation: 'reroll', targets: [target] } },
    }

    expect(suffixResidentStartKey(snapshot.chat, 15, node.anchorSeq)).toBe('context-27')
    const view = render(React.createElement(SuffixEffect, { node, useSession }), { container: mount })
    expect(residentContext.hasAttribute('data-rp-message-actions-hidden-suffix')).toBe(true)
    expect(retiredAssistant.hasAttribute('data-rp-message-actions-hidden-suffix')).toBe(true)
    expect(nativeCarrier.hasAttribute('data-rp-message-actions-hidden-suffix')).toBe(true)
    expect(replayedUser.hasAttribute('data-rp-message-actions-hidden-suffix')).toBe(false)

    const retiredUser = flowRow('user', parent, 'user-15')
    const retiredActions = actionRow(target, parent)
    parent.insertBefore(retiredUser, residentContext)
    parent.insertBefore(retiredActions, residentContext)
    snapshot = {
      hasMore: false,
      chat: {
        order: ['user-15', 'context-27', 'assistant-253', 'assistant-259', 'suffix-259', 'user-260'],
        nodes: new Map(),
      },
    }
    view.rerender(React.createElement(SuffixEffect, { node, useSession }))

    await waitFor(() => expect(retiredUser.hasAttribute('data-rp-message-actions-hidden-suffix')).toBe(true))
    expect(residentContext.hasAttribute('data-rp-message-actions-hidden-suffix')).toBe(true)
    expect(retiredAssistant.hasAttribute('data-rp-message-actions-hidden-suffix')).toBe(true)
    expect(replayedUser.hasAttribute('data-rp-message-actions-hidden-suffix')).toBe(false)

    view.unmount()
    expect(retiredUser.hasAttribute('data-rp-message-actions-hidden-suffix')).toBe(false)
    expect(residentContext.hasAttribute('data-rp-message-actions-hidden-suffix')).toBe(false)
    parent.remove()
  })

  it('keeps inline editing, suffix copy, native compact styling and stable target RPC in the bundle source', async () => {
    const source = await readFile('src/client.js', 'utf8')
    const stateSource = await readFile('src/client-state.js', 'utf8')
    const styles = await readFile('src/client.module.css', 'utf8')
    expect(source).toMatch(/function InlineMessageEditorPortal/)
    expect(source).toMatch(/function EditedMessagePortal/)
    expect(source).toMatch(/function userMessageContentStack/)
    expect(source).toMatch(/function assistantMessageContent/)
    expect(source).toMatch(/MarkdownText/)
    expect(source).toMatch(/messageRowForAction/)
    expect(source).toMatch(/\/rp-message-actions/)
    expect(source).toMatch(/sessionId, target/)
    expect(source).toMatch(/IconBranchOutline16/)
    expect(source).toMatch(/sessions\.fork\(\{ sessionId, atSeq, increaseTitle: true \}\)/)
    expect(source).toMatch(/sessionId: childId, target, content/)
    expect(source).toMatch(/sessions\.open\(childId\)/)
    expect(source).toMatch(/current\.forkEditRequired === true/)
    expect(source).toMatch(/error !== null && dialog === null && !editing/)
    expect(source.match(/rpc\(connection, 'get'/g)).toHaveLength(1)
    expect(source).toMatch(/projectMessageActionDetail/)
    expect(source).not.toMatch(/loadRevision|loadAttempt|css\.loadError/)
    expect(source).toMatch(/writeClipboard\(text\)/)
    expect(source).toMatch(/保存并重新生成/)
    expect(source).toMatch(/focus\(\{ preventScroll: true \}\)/)
    expect(source).not.toMatch(/autoFocus: true,[\s\S]{0,200}aria-label.*内容/)
    expect(source).not.toMatch(/修改后只会更新.*字/)
    expect(source).toMatch(/选中内容之后的对话也会删除/)
    expect(source).toMatch(/共享资料.*不会随对话删除/)
    expect(source).toMatch(/function InactiveActionNodeMarker/)
    expect(source).toMatch(/rp-floor-opening-actions/)
    expect(source).toMatch(/conversation\.chat\.assistant-actions/)
    expect(source).toMatch(/tool\.call\.toolview/)
    expect(source).toMatch(/function RoleplayCommitToolView/)
    expect(source).toMatch(/function FailedTurnStatusRow/)
    expect(source).toMatch(/StateDot/)
    expect(source).toMatch(/没有生成可用内容，可以重新尝试/)
    expect(source).toMatch(/删除这次记录/)
    expect(source).not.toMatch(/chatPresentation|conversation\.chat\.(user-actions|assistant-body|user-body)/)
    expect(stateSource).not.toMatch(/roleplayMessageChatNodeVisible|roleplayFloorChatNodeVisible/)
    expect(styles).toMatch(/\.floorActions\s*\{[^}]*gap:\s*10px/s)
    expect(styles).toMatch(/\.floorAction\s*\{[^}]*width:\s*28px[^}]*height:\s*28px[^}]*border-radius:\s*28px/s)
    expect(styles).toMatch(/data-rp-message-actions-hidden-suffix/)
    expect(styles).toMatch(/data-rp-message-actions-hidden-commit/)
    expect(styles).toMatch(/data-rp-message-actions-hidden-native-branch/)
    expect(styles).toMatch(/assistantActionHost/)
    expect(styles).toMatch(/assistantEffectNodeMarker/)
    expect(styles).toMatch(/\.failedTurnStatus\s*\{[^}]*grid-template-columns:\s*10px minmax\(0, 1fr\) auto/s)
    expect(styles).toMatch(/\.failedTurnRecoveryActions/)
    expect(styles).toMatch(/data-rp-message-actions-original-hidden/)
    expect(styles).toMatch(/inactiveActionNodeMarker/)
    expect(styles).toMatch(/rp-message-avatar-user/)
    expect(styles).toMatch(/rp-floor-opening-actions[^}]*inlineEditorPortalAnchor/)
    expect(styles).toMatch(/\.inlineEditor\s*\{[^}]*background:\s*var\(--dsw-specific-tip\)/s)
    expect(styles).toMatch(/\.inlineEditor\[data-surface="user"\]\s*\{[^}]*background:\s*var\(--dsw-specific-bubble\)/s)
    expect(styles).toMatch(/\.inlineEditor textarea\s*\{[^}]*min-height:\s*72px[^}]*max-height:\s*144px[^}]*border:\s*none[^}]*background:\s*transparent/s)
    expect(styles).not.toMatch(/\.inlineEditor textarea:focus\s*\{[^}]*border-color|\.inlineEditorFooter > span/s)
    expect(styles).not.toMatch(/data-rp-message-actions-(?:editing|edited)-user/)
  })
})

function turnLocation(turn) {
  return { kind: 'turn', turn: { turn, status: 'closed', data: new Map() } }
}

function roleplayActionProjection({
  turn = 2,
  userTexts = ['继续'],
  sharedAssetMutation = false,
} = {}) {
  const assistantTarget = {
    kind: 'message', role: 'assistant', messageId: `assistant-${turn - 1}`, turn, step: 1,
  }
  const assistantSeq = turn * 10 + userTexts.length
  const state = {
    turn,
    failed: false,
    deleted: false,
    committed: true,
    commitSeq: assistantSeq + 1,
    finalAssistantSeq: assistantSeq,
    finalAssistantTarget: assistantTarget,
    finalAssistantText: '正文',
    finalAssistantEdited: false,
    sharedAssetMutation,
  }
  const turnState = {
    turn,
    status: 'closed',
    data: new Map([['rp-floor-failed-assistant', state]]),
  }
  const location = { kind: 'turn', turn: turnState }
  const userTargets = userTexts.map((_text, index) => ({
    kind: 'message', role: 'user', messageId: `user-${turn}-${index + 1}`,
  }))
  const nodes = new Map(userTexts.map((text, index) => [`user-${turn}-${index + 1}`, {
    kind: 'rp-floor-user-actions',
    id: `user-${turn}-${index + 1}`,
    location,
    data: {
      seq: turn * 10 + index,
      turn,
      text,
      target: userTargets[index],
      hasNonTextContent: false,
      edited: false,
      deleted: false,
    },
  }]))
  nodes.set(`assistant-${turn}`, {
    kind: 'rp-floor-assistant-actions',
    id: assistantTarget.messageId,
    location,
    data: {
      seq: assistantSeq,
      turn,
      text: '正文',
      target: assistantTarget,
      edited: false,
      deleted: false,
    },
  })
  return {
    snapshot: { running: false, chat: { nodes } },
    assistantTarget,
    userTargets,
  }
}

function userEvent(id, text, seq) {
  return userContentEvent(id, [{ type: 'text', text }], seq)
}

function userContentEvent(id, content, seq) {
  return {
    seq, time: 1000 + seq, type: 'user/message', surfaceOp: 'append',
    data: { id, source: { kind: 'user' }, content },
  }
}

function assistantEvent(id, text, seq) {
  return {
    seq, time: 1000 + seq, type: 'assistant/message', surfaceOp: 'append',
    data: {
      turn: 1, step: 1,
      message: { id, source: { kind: 'model', provider: 'mock', model: 'mock' }, content: [{ type: 'text', text }] },
    },
  }
}

function openingEvent(id, text, seq) {
  return {
    ...assistantEvent(id, text, seq),
    data: {
      ...assistantEvent(id, text, seq).data,
      turn: 1,
      message: {
        ...assistantEvent(id, text, seq).data.message,
        source: {
          kind: 'model', provider: 'rp-session', model: 'selected-opening',
        },
      },
    },
  }
}

function openingActionEvent(messageId, text, operation, seq) {
  const event = actionEvent('edit', [{
    kind: 'message', role: 'assistant', messageId, turn: 1, step: 1,
  }], text, seq, 'assistant')
  event.data.turn = 1
  event.data.message.id = messageId
  event.data.message.source.provider = 'rp-session'
  event.data.message.source.model = 'selected-opening'
  event.data.message.source.rpMessageAction.operation = operation
  return event
}

function actionEvent(operation, targets, text, seq, role) {
  const rpMessageAction = { kind: 'rp-agent/message-action', version: 1, operation, targets }
  return role === 'user'
    ? {
        seq, time: 1000 + seq, type: 'user/message', surfaceOp: { op: 'replace', start: 1, end: 1 },
        data: { id: targets[0].messageId, source: { kind: 'user', rpMessageAction }, content: [{ type: 'text', text }] },
      }
    : {
        seq, time: 1000 + seq, type: 'assistant/message', surfaceOp: { op: 'replace', start: 1, end: 1 },
        data: {
          turn: targets.find(target => Number.isSafeInteger(target.turn))?.turn ?? 1,
          step: 1,
          message: {
            id: `carrier-${seq}`,
            source: { kind: 'model', provider: 'mock', model: 'mock', rpMessageAction },
            content: text === '' ? [] : [{ type: 'text', text }],
          },
        },
      }
}

function flowRow(kind, parent, key) {
  const element = document.createElement('div')
  element.dataset.chatFlowKind = kind
  if (key !== undefined) element.dataset.chatFlowKey = key
  parent.append(element)
  return element
}

function readableAssistantRow(parent, text) {
  const element = flowRow('assistant-step', parent)
  const outlet = document.createElement('div')
  outlet.dataset.slot = 'conversation.chat.node'
  const content = document.createElement('div')
  content.textContent = text
  outlet.append(content)
  element.append(outlet)
  return element
}

function actionRow(target, parent, kind = 'rp-floor-user-actions') {
  const row = flowRow(kind, parent)
  const anchor = document.createElement('span')
  anchor.dataset.rpMessageActionKey = rpMessageActionTargetKey(target)
  row.append(anchor)
  return row
}

function successfulConnection(onCall = () => {}) {
  return {
    rpc: {
      call: vi.fn(async (_path, endpoint, payload) => {
        onCall(endpoint, payload)
        return { ok: true, value: { ok: true, value: {} } }
      }),
    },
  }
}
