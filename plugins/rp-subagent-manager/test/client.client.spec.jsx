// @vitest-environment jsdom
import React from 'react'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@deepseek-ai/dsh-client-ui-primitives', () => ({
  Button: ({ children, ...props }) => React.createElement('button', props, children),
  DisclosureRow: ({ title, collapsedContent, children, open, expandable, onToggle }) => React.createElement('section', null,
    React.createElement(expandable ? 'button' : 'div', expandable ? { type: 'button', onClick: onToggle } : {}, title, collapsedContent),
    open ? children : null),
  IconChevronLeftOutline14: () => null,
  IconGlobeOutline14: () => null,
  IconPlusOutline16: () => null,
  IconSkillOutline16: () => null,
  IconTrashOutline16: () => null,
  Pill: ({ children }) => React.createElement('span', null, children),
  StateDot: ({ state }) => React.createElement('span', { 'data-state-dot': state }),
  Modal: ({ open, title, description, footer, children, closeLabel, onClose }) => open ? React.createElement('section', { role: 'dialog', 'aria-label': title },
    React.createElement('button', { type: 'button', 'aria-label': closeLabel, onClick: onClose }),
    React.createElement('h2', null, title),
    description ? React.createElement('p', null, description) : null,
    children,
    footer) : null,
}))

vi.mock('motion/react', async () => {
  const ReactModule = await vi.importActual('react')
  return {
    AnimatePresence: ({ children }) => children,
    LazyMotion: ({ children }) => children,
    MotionConfig: ({ children }) => children,
    domMax: {},
    useReducedMotion: () => true,
    m: new Proxy({}, {
      get: (_target, tag) => ({ children, layout: _layout, transition: _transition, whileHover: _whileHover, whileTap: _whileTap, initial: _initial, animate: _animate, exit: _exit, ...props }) => ReactModule.createElement(tag, props, children),
    }),
  }
})

import { apply, SubagentManagerModal, SubagentToolView } from '../src/client.js'
import { ensureStyles } from '../src/client-styles.generated.js'

afterEach(cleanup)

const NOW = '2026-08-21T00:00:00.000Z'
const baseCatalog = {
  version: 3,
  writer: { id: 'writer', fixed: true, revision: 1, route: { kind: 'inherit' } },
  subagents: [{
    id: '11111111-1111-4111-8111-111111111111', revision: 1, name: '事实核对',
    description: '需要核对事实与连续性时使用。', instructions: '只返回核对结果。',
    enabled: true, route: { kind: 'inherit' }, tools: ['web_search', 'skill'], createdAt: NOW, updatedAt: NOW,
  }],
  limits: { subagents: 32, name: 80, description: 240, instructions: 20000 },
}
const models = {
  groups: [{ id: 'openai', name: 'OpenAI', models: [{ id: 'gpt-5', name: 'GPT-5' }] }],
  failures: [{ id: 'broken', name: '暂不可用提供方', message: 'internal details must stay hidden' }],
}

function ok(value) { return { ok: true, value: { ok: true, value } } }
function connection({ catalog = baseCatalog, handler } = {}) {
  const calls = []
  return {
    calls,
    api: { llm: { models: vi.fn(async () => ({ result: { ok: true, value: models } })) } },
    rpc: { call: vi.fn(async (_route, endpoint, payload) => {
      calls.push({ endpoint, payload })
      if (handler !== undefined) {
        const result = await handler(endpoint, payload)
        if (result !== undefined) return result
      }
      if (endpoint === 'list') return ok(catalog)
      if (endpoint === 'get') return ok(catalog.subagents.find(item => item.id === payload.id))
      if (endpoint === 'delete') return ok({ id: payload.id })
      return ok({})
    }) },
  }
}

describe('全局子代理管理界面', () => {
  it('注册侧栏入口和语义化子代理工具行', () => {
    const registrations = []
    const ctx = {
      connection: {},
      effect: vi.fn(),
      slots: {
        inject: vi.fn((_name, setup) => setup()),
        register: vi.fn(config => { registrations.push(config) }),
      },
    }
    apply(ctx)
    expect(registrations).toContainEqual(expect.objectContaining({
      name: 'sidebar.footer.action', id: 'rp-subagents-navigation', order: 0,
    }))
    expect(registrations).toContainEqual(expect.objectContaining({
      name: 'tool.call.toolview', key: 'rp_run_subagent',
    }))
  })

  it('历史调用使用当次结果冻结的名称，并可展开任务与结果', () => {
    const c = connection()
    const inspect = vi.fn()
    const id = baseCatalog.subagents[0].id
    render(React.createElement(SubagentToolView, {
      connection: c,
      inspect,
      block: {
        kind: 'tool-result', isError: false,
        call: { name: 'rp_run_subagent', argsRaw: JSON.stringify({ subagent: id, task: '检查门锁状态', input: { focus: '连续性' } }) },
        content: [{ type: 'text', text: '门锁状态前后一致。' }],
        meta: { kind: 'rp-agent/subagent-result', label: '当次事实核对' },
      },
    }))

    expect(screen.getByText('当次事实核对')).toBeTruthy()
    expect(document.body.textContent).not.toContain('rp_run_subagent')
    expect(document.body.textContent).not.toContain(id)
    expect(c.rpc.call).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: /子代理当次事实核对/ }))
    expect(screen.getByText('检查门锁状态')).toBeTruthy()
    expect(screen.getByText('门锁状态前后一致。')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '查看执行记录' }))
    expect(inspect).toHaveBeenCalledOnce()
  })

  it('运行中的调用从目录解析名称，不展示稳定 ID', async () => {
    const c = connection()
    const id = baseCatalog.subagents[0].id
    render(React.createElement(SubagentToolView, {
      connection: c,
      block: {
        callId: 'call-1', name: 'rp_run_subagent',
        argsRaw: JSON.stringify({ subagent: id, task: '检查门锁状态' }),
      },
    }))

    expect(await screen.findByText('事实核对 · 正在处理')).toBeTruthy()
    expect(document.body.textContent).not.toContain(id)
    expect(c.calls).toContainEqual({ endpoint: 'get', payload: { id } })
  })

  it('失败调用使用产品文案，不直接展示内部异常', async () => {
    const c = connection()
    const id = baseCatalog.subagents[0].id
    render(React.createElement(SubagentToolView, {
      connection: c,
      block: {
        kind: 'tool-result', isError: true,
        call: { name: 'rp_run_subagent', argsRaw: JSON.stringify({ subagent: id, task: '检查门锁状态' }) },
        content: [{ type: 'text', text: 'InternalSubagentError: transport failed' }],
      },
    }))

    expect(await screen.findByText('事实核对 · 未完成')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /子代理事实核对 · 未完成/ }))
    expect(screen.getByText('这个子代理没有完成任务。可查看执行记录了解详情。')).toBeTruthy()
    expect(document.body.textContent).not.toContain('InternalSubagentError')
  })

  it.each(['INVALID_ARGS', 'RP_SUBAGENT_INPUT_INVALID'])('参数错误 %s 显示为未启动，不计作子代理执行失败', async code => {
    const c = connection()
    const id = baseCatalog.subagents[0].id
    render(React.createElement(SubagentToolView, {
      connection: c,
      block: {
        kind: 'tool-result', isError: true,
        error: { name: 'ToolArgsError', code },
        call: {
          name: 'rp_run_subagent',
          argsRaw: JSON.stringify({ subagent: id, task: '检查门锁状态', input: '{"focus":"连续性"}' }),
        },
        content: [{ type: 'text', text: 'internal schema details must stay hidden' }],
      },
    }))

    expect(await screen.findByText('事实核对 · 未启动')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /子代理事实核对 · 未启动/ }))
    expect(screen.getByText('任务或资料格式不正确，因此没有启动子代理；后续可以按正确格式重新调用。')).toBeTruthy()
    expect(document.body.textContent).not.toContain('internal schema details')
  })

  it('侧栏入口纵向排列，并与资料入口保持一致的行高和间距', () => {
    const dispose = ensureStyles()
    const style = document.getElementById('dsh-roleplay-rp-subagent-manager-styles')
    expect(style.textContent).toContain('[data-slot^="sidebar"][data-slot*="footer"][data-slot*="action"]:has(>.rp-subagent-manager-trigger){display:flex!important')
    expect(style.textContent).toMatch(/\.rp-subagent-manager-trigger\{[^}]*height:34px[^}]*margin:0 -4px 2px/)
    dispose()
  })

  it('固定展示 Writer、任务子代理能力与 provider 局部目录失败', async () => {
    const c = connection()
    render(React.createElement(SubagentManagerModal, { open: true, onClose: () => {}, connection: c }))
    expect(await screen.findByRole('button', { name: '编辑Writer' })).toBeTruthy()
    expect(document.querySelector('[data-icon="subagent-robot"]')).toBeTruthy()
    expect(screen.getByText('固定')).toBeTruthy()
    expect(screen.getByText('Web 搜索')).toBeTruthy()
    expect(screen.getByText('Skills')).toBeTruthy()
    expect(screen.getByRole('switch', { name: '停用事实核对' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '编辑Writer' }))
    expect(screen.getByText('暂不可用提供方 的模型目录暂时不可用，其他提供方仍可选择。')).toBeTruthy()
    expect(screen.queryByText(/internal details/)).toBeNull()
  })

  it('可直接停用自定义子代理，并同步目录计数与可见状态', async () => {
    const c = connection({ handler: (endpoint, payload) => endpoint === 'set-enabled'
      ? ok({ ...baseCatalog.subagents[0], enabled: payload.enabled, revision: 2 })
      : undefined })
    render(React.createElement(SubagentManagerModal, { open: true, onClose: () => {}, connection: c }))
    const toggle = await screen.findByRole('switch', { name: '停用事实核对' })
    expect(toggle.getAttribute('aria-checked')).toBe('true')
    expect(screen.getByText('固定 Writer + 1 个独立任务子代理，其中 1 个已启用')).toBeTruthy()
    fireEvent.click(toggle)
    await waitFor(() => expect(c.calls).toContainEqual({
      endpoint: 'set-enabled',
      payload: { id: baseCatalog.subagents[0].id, expectedRevision: 1, enabled: false },
    }))
    expect(await screen.findByRole('switch', { name: '启用事实核对' })).toBeTruthy()
    expect(screen.getByText('已停用')).toBeTruthy()
    expect(screen.getByText('固定 Writer + 1 个独立任务子代理，其中 0 个已启用')).toBeTruthy()
  })

  it('Writer 编辑页只允许选择模型并保留固定职责说明', async () => {
    const c = connection()
    render(React.createElement(SubagentManagerModal, { open: true, onClose: () => {}, connection: c }))
    fireEvent.click(await screen.findByRole('button', { name: '编辑Writer' }))
    expect(screen.getByText('Writer 的职责与上下文由 Roleplay 固定')).toBeTruthy()
    expect(screen.getByText('用户子代理不能替换它。', { exact: false })).toBeTruthy()
    expect(screen.getByLabelText('子代理模型').value).toBe('inherit')
    expect(screen.queryByLabelText('名称')).toBeNull()
    fireEvent.change(screen.getByLabelText('子代理模型'), { target: { value: JSON.stringify(['openai', 'gpt-5']) } })
    fireEvent.click(screen.getByRole('button', { name: '保存 Writer 模型' }))
    await waitFor(() => expect(c.calls.some(call => call.endpoint === 'writer/update' && call.payload.route.model === 'gpt-5')).toBe(true))
  })

  it('新增独立任务子代理可填写三项内容、选择模型与两项受控能力', async () => {
    const c = connection()
    render(React.createElement(SubagentManagerModal, { open: true, onClose: () => {}, connection: c }))
    fireEvent.click(await screen.findByRole('button', { name: '新增子代理' }))
    expect(screen.getByText(/原样作为 System 提示词/)).toBeTruthy()
    fireEvent.change(screen.getByLabelText('名称'), { target: { value: '史实核对' } })
    expect(screen.getByText(/适用范围、是否必须调用、相对 Writer 或其他工具的顺序/)).toBeTruthy()
    fireEvent.change(screen.getByLabelText(/调用契约/), { target: { value: '需要核对历史事实时使用。' } })
    fireEvent.change(screen.getByLabelText(/工作指令/), { target: { value: '只返回可核验的事实与来源。' } })
    fireEvent.change(screen.getByLabelText('子代理模型'), { target: { value: JSON.stringify(['openai', 'gpt-5']) } })
    fireEvent.click(screen.getByLabelText(/Web 搜索/))
    fireEvent.click(screen.getByLabelText(/Skills/))
    fireEvent.click(screen.getByRole('button', { name: '保存子代理' }))
    await waitFor(() => {
      const call = c.calls.find(item => item.endpoint === 'create')
      expect(call?.payload.subagent).toEqual({
        name: '史实核对', description: '需要核对历史事实时使用。', instructions: '只返回可核验的事实与来源。',
        route: { kind: 'fixed', provider: 'openai', model: 'gpt-5' }, tools: ['web_search', 'skill'],
      })
    })
  })

  it('不可用旧模型保留为当前值，删除确认说明运行中任务与历史不受影响', async () => {
    const stale = {
      ...baseCatalog,
      writer: { ...baseCatalog.writer, route: { kind: 'fixed', provider: 'gone', model: 'retired' } },
    }
    const c = connection({ catalog: stale })
    render(React.createElement(SubagentManagerModal, { open: true, onClose: () => {}, connection: c }))
    fireEvent.click(await screen.findByRole('button', { name: '编辑Writer' }))
    expect(screen.getByRole('option', { name: 'gone · retired（当前不可用）' }).selected).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: '返回' }))
    fireEvent.click(screen.getByRole('button', { name: '删除事实核对' }))
    const dialog = screen.getByRole('dialog', { name: '删除“事实核对”？' })
    expect(within(dialog).getByText('已经开始的任务和历史记录不受影响')).toBeTruthy()
    fireEvent.click(within(dialog).getByRole('button', { name: '删除子代理' }))
    await waitFor(() => expect(c.calls.some(call => call.endpoint === 'delete')).toBe(true))
  })

  it('保存冲突转译为可执行中文反馈', async () => {
    const c = connection({ handler: endpoint => endpoint === 'writer/update'
      ? { ok: true, value: { ok: false, error: { code: 'REVISION_CONFLICT', message: 'internal conflict' } } }
      : undefined })
    render(React.createElement(SubagentManagerModal, { open: true, onClose: () => {}, connection: c }))
    fireEvent.click(await screen.findByRole('button', { name: '编辑Writer' }))
    fireEvent.click(screen.getByRole('button', { name: '保存 Writer 模型' }))
    expect((await screen.findByRole('alert')).textContent).toContain('配置已在其他位置更新，请返回列表并重新打开后再保存。')
    expect(screen.queryByText(/internal conflict/)).toBeNull()
  })
})
