import React, { useEffect, useMemo, useState } from 'react'
import {
  Button,
  DisclosureRow,
  IconChevronLeftOutline14,
  IconGlobeOutline14,
  IconPlusOutline16,
  IconSkillOutline16,
  IconTrashOutline16,
  Modal,
  Pill,
  StateDot,
} from '@deepseek-ai/dsh-client-ui-primitives'
import { AnimatePresence, domMax, LazyMotion, m, MotionConfig, useReducedMotion } from 'motion/react'
import {
  emptySubagentDraft,
  modelCatalogValue,
  subagentDraft,
  routeAvailable,
  routeFromKey,
  routeKey,
  routeLabel,
  rpc,
  userMessage,
  validateDraft,
} from './client-state.js'
import { css, ensureStyles } from './client-styles.generated.js'

export const inject = ['slots', 'rpRemote', 'remote', 'remote.session']
const h = React.createElement
const transition = { duration: 0.18, ease: [0.2, 0, 0, 1] }
const RP_SUBAGENT_TOOL = 'rp_run_subagent'
const RP_SUBAGENT_RESULT_KIND = 'rp-agent/subagent-result'

export function IconSubagentRobotOutline16({ size = 16, className }) {
  return h('svg', {
    width: size,
    height: size,
    viewBox: '0 0 16 16',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    className,
    'aria-hidden': true,
    'data-icon': 'subagent-robot',
  },
  h('path', { d: 'M8 1.5V3.25', stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round' }),
  h('circle', { cx: 8, cy: 1.5, r: 0.65, fill: 'currentColor' }),
  h('rect', { x: 2.5, y: 3.75, width: 11, height: 9, rx: 2.25, stroke: 'currentColor', strokeWidth: 1.3 }),
  h('path', { d: 'M2.5 7H1.25V9H2.5M13.5 7H14.75V9H13.5M5.5 10.25H10.5', stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round', strokeLinejoin: 'round' }),
  h('circle', { cx: 5.75, cy: 7.25, r: 0.75, fill: 'currentColor' }),
  h('circle', { cx: 10.25, cy: 7.25, r: 0.75, fill: 'currentColor' }))
}

export function apply(ctx) {
  ctx.effect(ensureStyles)
  ctx.slots.inject('conversation.session.header.utilities', () => ctx.slots.register({
    name: 'conversation.session.header.utilities',
    id: 'rp-session-writer-settings',
    order: 100,
    inject: () => ({ connection: ctx.rpRemote, modelCatalog: ctx.remote.session }),
  }, SessionWriterSettingsEntry))
  ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
    name: 'sidebar.footer.action',
    id: 'rp-subagents-navigation',
    order: 0,
    inject: () => ({ connection: ctx.rpRemote, modelCatalog: ctx.remote.session }),
  }, SubagentManagerEntry))
  ctx.slots.inject('tool.call.toolview', () => ctx.slots.register({
    name: 'tool.call.toolview',
    key: RP_SUBAGENT_TOOL,
    inject: () => ({ connection: ctx.rpRemote }),
  }, SubagentToolView))
}

export function SubagentToolView({ block, connection, inspect }) {
  const [expanded, setExpanded] = useState(false)
  const settled = 'kind' in block
  const failed = settled && block.isError === true
  const notStarted = failed && (block.error?.code === 'INVALID_ARGS' || block.error?.code === 'RP_SUBAGENT_INPUT_INVALID')
  const args = subagentCallArgs(block)
  const subagentId = typeof args.subagent === 'string' && args.subagent.length > 0 ? args.subagent : undefined
  const durableLabel = settled
    && block.meta?.kind === RP_SUBAGENT_RESULT_KIND
    && typeof block.meta.label === 'string'
    && block.meta.label.trim().length > 0
    ? block.meta.label.trim()
    : undefined
  const label = useSubagentLabel(connection, subagentId, durableLabel)
  const task = typeof args.task === 'string' && args.task.trim().length > 0 ? args.task.trim() : null
  const input = explicitInputText(args.input)
  const result = settled && !failed ? toolResultText(block.content) : null
  const expandable = task !== null || input !== null || result !== null || failed || inspect !== undefined
  const status = notStarted ? '未启动' : failed ? '未完成' : settled ? null : '正在处理'
  const summary = status === null ? label : `${label} · ${status}`
  const stateText = notStarted
    ? `子代理“${label}”没有启动，因为任务或资料格式不正确。`
    : failed
    ? `子代理“${label}”未能完成任务。`
    : settled
      ? `子代理“${label}”已返回结果。`
      : `子代理“${label}”正在处理任务。`
  const leading = failed
    ? h(StateDot, { state: 'error' })
    : settled
      ? h(IconSubagentRobotOutline16, { size: 14 })
      : h(StateDot, { state: 'ongoing' })
  const liveRole = failed ? 'alert' : settled ? undefined : 'status'

  return h(MotionConfig, { reducedMotion: 'user', transition }, h(LazyMotion, { features: domMax, strict: true },
    h('div', {
      className: css.toolRoot,
      'data-rp-subagent-tool-state': failed ? 'failed' : settled ? 'succeeded' : 'running',
    },
    h('span', { className: css.srOnly, role: liveRole }, stateText),
    h(DisclosureRow, {
      rowClassName: css.toolRow,
      leadingClassName: css.toolLeading,
      titleClassName: css.toolTitle,
      chevronClassName: css.toolChevron,
      icon: leading,
      title: '子代理',
      open: expanded,
      expandable,
      expandOnRowClick: true,
      keepContentWhenOpen: true,
      onToggle: () => setExpanded(value => !value),
      collapsedContent: h(React.Fragment, null,
        h('span', { className: css.toolSeparator, 'aria-hidden': true }),
        h('span', { className: css.toolSummary, 'data-error': failed || undefined }, summary)),
    }, h(m.div, {
      className: css.toolBody,
      initial: { opacity: 0, y: -4 },
      animate: { opacity: 1, y: 0 },
    },
    task === null ? null : h(ToolDetailSection, { label: '任务', text: task }),
    input === null ? null : h(ToolDetailSection, { label: '输入', text: input }),
    failed
      ? h(ToolDetailSection, {
        label: '结果',
        text: notStarted
          ? '任务或资料格式不正确，因此没有启动子代理；后续可以按正确格式重新调用。'
          : '这个子代理没有完成任务。可查看执行记录了解详情。',
        error: true,
      })
      : result === null ? null : h(ToolDetailSection, { label: '结果', text: result }),
    inspect === undefined ? null : h('button', {
      type: 'button',
      className: css.toolInspect,
      onClick: inspect,
    }, '查看执行记录'))))))
}

function ToolDetailSection({ label, text, error = false }) {
  return h('div', { className: css.toolSection },
    h('span', null, label),
    h('pre', { 'data-error': error || undefined }, text))
}

function useSubagentLabel(connection, id, durableLabel) {
  const [loadedLabel, setLoadedLabel] = useState(null)
  useEffect(() => {
    setLoadedLabel(null)
    if (durableLabel !== undefined || id === undefined) return undefined
    let active = true
    void rpc(connection, 'get', { id })
      .then(subagent => {
        if (!active) return
        const name = typeof subagent?.name === 'string' ? subagent.name.trim() : ''
        setLoadedLabel(name.length > 0 ? name : false)
      })
      .catch(() => { if (active) setLoadedLabel(false) })
    return () => { active = false }
  }, [connection, durableLabel, id])
  if (durableLabel !== undefined) return durableLabel
  if (id === undefined) return '未能识别的子代理'
  if (loadedLabel === null) return '正在读取名称…'
  return loadedLabel === false ? '子代理名称暂不可用' : loadedLabel
}

function subagentCallArgs(block) {
  const raw = 'kind' in block ? block.call?.argsRaw : block.argsRaw
  if (typeof raw !== 'string' || raw.length === 0) return {}
  try {
    const value = JSON.parse(raw)
    return typeof value === 'object' && value !== null && !Array.isArray(value) ? value : {}
  } catch {
    return {}
  }
}

function explicitInputText(value) {
  if (value === undefined) return null
  if (typeof value === 'object' && value !== null && !Array.isArray(value) && Object.keys(value).length === 0) return null
  try { return JSON.stringify(value, null, 2) }
  catch { return null }
}

function toolResultText(content) {
  if (!Array.isArray(content)) return null
  const text = content.map(block => block?.type === 'text' && typeof block.text === 'string'
    ? block.text
    : JSON.stringify(block, null, 2)).join('\n').trim()
  return text.length > 0 ? text : null
}

export function SubagentManagerEntry({ wide, connection, modelCatalog }) {
  const [open, setOpen] = useState(false)
  return h(MotionConfig, { reducedMotion: 'user', transition }, h(LazyMotion, { features: domMax, strict: true }, h(React.Fragment, null,
    h(m.button, {
      type: 'button',
      className: wide ? css.trigger : `${css.trigger} ${css.rail}`,
      whileHover: { y: -1 },
      whileTap: { scale: 0.98 },
      onClick: () => setOpen(true),
      'aria-label': '子代理',
      title: wide ? undefined : '子代理',
    }, h(IconSubagentRobotOutline16, { size: wide ? 16 : 18 }), wide ? h('span', { className: css.triggerLabel }, '子代理') : null),
    h(SubagentManagerModal, { open, onClose: () => setOpen(false), connection, modelCatalog }))))
}

export function SessionWriterSettingsEntry({ sessionId, useProjection, useSession, connection, modelCatalog }) {
  const profile = useProjection('rp/session')
  const session = useSession(state => ({ running: state.running }))
  const [open, setOpen] = useState(false)
  if (profile === null || profile === undefined) return null
  return h(MotionConfig, { reducedMotion: 'user', transition }, h(LazyMotion, { features: domMax, strict: true }, h(React.Fragment, null,
    h(m.button, {
      type: 'button',
      className: css.sessionTrigger,
      whileHover: { y: -1 },
      whileTap: { scale: 0.98 },
      onClick: () => setOpen(true),
      'aria-label': '设置当前对话的 Writer 模型',
      title: '设置当前对话的 Writer 模型与推理强度',
    }, h(IconSubagentRobotOutline16, { size: 15 }), h('strong', null, 'Writer')),
    h(SessionWriterSettingsModal, {
      open,
      onClose: () => setOpen(false),
      connection,
      modelCatalog,
      sessionId,
      profile,
      running: session.running,
    }))))
}

export function SessionWriterSettingsModal({ open, onClose, connection, modelCatalog, sessionId, profile, running = false }) {
  const [catalog, setCatalog] = useState(null)
  const [models, setModels] = useState({ groups: [], failures: [] })
  const [route, setRoute] = useState(null)
  const [loading, setLoading] = useState(false)
  const [modelLoadFailed, setModelLoadFailed] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open) return
    let active = true
    setCatalog(null)
    setRoute(profile?.runtime?.writerRoute ?? null)
    setLoading(true)
    setSaving(false)
    setError(null)
    setModelLoadFailed(false)
    void rpc(connection, 'list', {})
      .then(value => { if (active) setCatalog(value) })
      .catch(reason => { if (active) setError(sessionUserMessage(reason, 'load')) })
      .finally(() => { if (active) setLoading(false) })
    void modelCatalog.modelCatalog()
      .then(value => { if (active) setModels(modelCatalogValue(value)) })
      .catch(() => { if (active) { setModelLoadFailed(true); setModels({ groups: [], failures: [] }) } })
    return () => { active = false }
  }, [connection, modelCatalog, open])

  const save = async () => {
    if (saving || loading || profile == null || catalog === null || running) return
    setSaving(true)
    setError(null)
    try {
      await rpc(connection, 'writer/session-update', {
        sessionId,
        expectedRevision: profile.revision,
        route,
      })
      onClose()
    } catch (reason) {
      setError(sessionUserMessage(reason))
    } finally {
      setSaving(false)
    }
  }
  const close = () => { if (!saving) onClose() }
  const disabled = saving || loading || catalog === null || running
  return h(Modal, {
    open,
    onClose: close,
    closeLabel: '关闭当前对话 Writer 设置',
    title: 'Writer 设置',
    description: '仅影响当前对话，从下一次回复开始生效。',
    className: css.sessionDialog,
    footer: h(React.Fragment, null,
      h(Button, { variant: 'outline', disabled: saving, onClick: close }, '取消'),
      h(Button, { disabled, onClick: () => void save() }, saving ? '保存中…' : '保存')),
  },
  error === null ? null : h('div', { className: css.sessionError, role: 'alert' }, error),
  running ? h('div', { className: css.sessionNotice, role: 'status' }, h('strong', null, '当前回复正在生成'), h('span', null, '回复结束后即可修改 Writer 设置。')) : null,
  loading && catalog === null
    ? h('div', { className: css.sessionState, role: 'status' }, '正在加载…')
    : catalog === null
      ? h('div', { className: css.sessionState }, '暂时无法加载设置。')
      : h('div', { className: css.sessionEditor },
        h(SessionModelField, {
          route,
          defaultRoute: catalog.writer.route,
          onChange: setRoute,
          models,
          modelLoadFailed,
        })))
}

export function SubagentManagerModal({ open, onClose, connection, modelCatalog }) {
  const reduced = useReducedMotion()
  const [catalog, setCatalog] = useState(null)
  const [models, setModels] = useState({ groups: [], failures: [] })
  const [modelLoadFailed, setModelLoadFailed] = useState(false)
  const [view, setView] = useState('list')
  const [draft, setDraft] = useState(null)
  const [writerDraft, setWriterDraft] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  const [togglingId, setTogglingId] = useState(null)

  const reload = async () => {
    setLoading(true); setError(null)
    try { setCatalog(await rpc(connection, 'list', {})) }
    catch (reason) { setError(userMessage(reason, 'load')) }
    finally { setLoading(false) }
  }
  const loadModels = async () => {
    setModelLoadFailed(false)
    try { setModels(modelCatalogValue(await modelCatalog.modelCatalog())) }
    catch { setModelLoadFailed(true); setModels({ groups: [], failures: [] }) }
  }
  useEffect(() => {
    if (!open) return
    setView('list'); setDraft(null); setWriterDraft(null); setDeleteTarget(null); setTogglingId(null); setError(null)
    void reload(); void loadModels()
  }, [connection, modelCatalog, open])

  const editWriter = () => {
    if (catalog === null) return
    setWriterDraft({ revision: catalog.writer.revision, route: catalog.writer.route })
    setView('writer'); setError(null)
  }
  const createSubagent = () => { setDraft(emptySubagentDraft()); setView('subagent'); setError(null) }
  const editSubagent = async id => {
    setLoading(true); setError(null)
    try { setDraft(subagentDraft(await rpc(connection, 'get', { id }))); setView('subagent') }
    catch (reason) { setError(userMessage(reason, 'load')) }
    finally { setLoading(false) }
  }
  const saveWriter = async () => {
    if (writerDraft === null) return
    setSaving(true); setError(null)
    try {
      await rpc(connection, 'writer/update', { expectedRevision: writerDraft.revision, route: writerDraft.route })
      await reload(); setView('list'); setWriterDraft(null)
    } catch (reason) { setError(userMessage(reason)) }
    finally { setSaving(false) }
  }
  const saveSubagent = async () => {
    if (draft === null) return
    const validation = validateDraft(draft)
    if (validation !== null) { setError(validation); return }
    setSaving(true); setError(null)
    const subagent = { name: draft.name, description: draft.description, instructions: draft.instructions, route: draft.route, tools: draft.tools }
    try {
      if (draft.id === null) await rpc(connection, 'create', { subagent })
      else await rpc(connection, 'update', { id: draft.id, expectedRevision: draft.revision, subagent })
      await reload(); setView('list'); setDraft(null)
    } catch (reason) { setError(userMessage(reason)) }
    finally { setSaving(false) }
  }
  const toggleSubagent = async subagent => {
    if (togglingId !== null) return
    setTogglingId(subagent.id); setError(null)
    try {
      const updated = await rpc(connection, 'set-enabled', {
        id: subagent.id,
        expectedRevision: subagent.revision,
        enabled: subagent.enabled === false,
      })
      setCatalog(current => current === null ? current : {
        ...current,
        subagents: current.subagents.map(item => item.id === updated.id ? updated : item),
      })
    } catch (reason) { setError(userMessage(reason, 'toggle')) }
    finally { setTogglingId(null) }
  }
  const requestDelete = subagent => { setDeleteTarget({ id: subagent.id, revision: subagent.revision, name: subagent.name }); setDeleteError(null) }
  const closeDelete = () => { if (!deleting) { setDeleteTarget(null); setDeleteError(null) } }
  const remove = async () => {
    if (deleteTarget === null) return
    setDeleting(true); setDeleteError(null)
    try {
      await rpc(connection, 'delete', { id: deleteTarget.id, expectedRevision: deleteTarget.revision })
      setDeleteTarget(null); setDraft(null); setView('list'); await reload()
    } catch (reason) { setDeleteError(userMessage(reason, 'delete')) }
    finally { setDeleting(false) }
  }
  const back = () => { if (!saving) { setView('list'); setDraft(null); setWriterDraft(null); setError(null) } }
  const motion = reduced ? { initial: false, animate: { opacity: 1 }, exit: { opacity: 1 } } : { initial: { opacity: 0, x: 10 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -8 } }

  return h(React.Fragment, null,
    h(Modal, {
      open,
      onClose: deleteTarget === null ? onClose : () => {},
      title: '子代理',
      description: '设置 Writer 默认模型，管理任务子代理。',
      closeLabel: '关闭子代理管理',
      className: css.dialog,
      contentClassName: css.content,
    }, h('div', { className: css.shell },
      error === null ? null : h('div', { className: css.error, role: 'alert' }, error),
      h(AnimatePresence, { mode: 'wait', initial: false },
        view === 'writer' && writerDraft !== null
          ? h(m.div, { key: 'writer', className: css.view, ...motion }, h(WriterEditor, { draft: writerDraft, onDraft: setWriterDraft, models, modelLoadFailed, saving, onBack: back, onSave: () => void saveWriter() }))
          : view === 'subagent' && draft !== null
            ? h(m.div, { key: 'subagent', className: css.view, ...motion }, h(SubagentEditor, { draft, onDraft: setDraft, limits: catalog?.limits, models, modelLoadFailed, saving, onBack: back, onSave: () => void saveSubagent(), onDelete: draft.id === null ? undefined : () => requestDelete(draft) }))
            : h(m.div, { key: 'list', className: css.view, ...motion }, h(SubagentList, { catalog, models, loading, reduced, togglingId, onWriter: editWriter, onCreate: createSubagent, onEdit: id => void editSubagent(id), onToggle: subagent => void toggleSubagent(subagent), onDelete: requestDelete }))))),
    h(DeleteSubagentDialog, { target: deleteTarget, pending: deleting, error: deleteError, onCancel: closeDelete, onConfirm: () => void remove() }))
}

function SubagentList({ catalog, models, loading, reduced, togglingId, onWriter, onCreate, onEdit, onToggle, onDelete }) {
  if (loading && catalog === null) return h('div', { className: css.state, role: 'status' }, '正在读取子代理配置…')
  if (catalog === null) return h('div', { className: css.state }, '暂时没有可显示的子代理配置。')
  const enabledCount = catalog.subagents.filter(subagent => subagent.enabled !== false).length
  return h('div', { className: css.list },
    h('div', { className: css.listToolbar },
      h('div', null, h('strong', null, 'Writer 与任务子代理'), h('span', null, `${catalog.subagents.length} 个任务子代理 · ${enabledCount} 个已启用`)),
      h(m.button, { type: 'button', className: css.primaryButton, whileTap: { scale: 0.98 }, disabled: catalog.subagents.length >= catalog.limits.subagents, onClick: onCreate }, h(IconPlusOutline16, { size: 16 }), '新增子代理')),
    h('section', { className: css.section, 'aria-labelledby': 'rp-subagent-writer-heading' },
      h('h3', { id: 'rp-subagent-writer-heading' }, 'Writer 默认设置'),
      h(SubagentCard, { subagent: { ...catalog.writer, name: 'Writer', description: '所有对话默认使用此设置，也可在对话中单独调整。', tools: [] }, fixed: true, models, onEdit: onWriter })),
    h('section', { className: css.section, 'aria-labelledby': 'rp-subagent-tasks-heading' },
      h('div', { className: css.sectionHeading }, h('h3', { id: 'rp-subagent-tasks-heading' }, '任务子代理'), h('span', null, '启用后可在 Agent 模式中使用')),
      catalog.subagents.length === 0
        ? h('div', { className: css.empty }, h(IconSubagentRobotOutline16, { size: 24 }), h('strong', null, '还没有任务子代理'), h('span', null, '可用于大纲、润色等独立任务。'))
        : catalog.subagents.map(subagent => h(SubagentCard, { key: subagent.id, subagent, models, reduced, pending: togglingId === subagent.id, toggleDisabled: togglingId !== null, onEdit: () => onEdit(subagent.id), onToggle: () => onToggle(subagent), onDelete: () => onDelete(subagent) }))))
}

function SubagentCard({ subagent, fixed = false, models, reduced = false, pending = false, toggleDisabled = false, onEdit, onToggle, onDelete }) {
  const available = routeAvailable(subagent.route, models.groups)
  const enabled = fixed || subagent.enabled !== false
  const modelLabel = fixed && subagent.route?.kind !== 'fixed' ? '跟随当前对话' : routeLabel(subagent.route, models.groups)
  return h(m.article, { className: css.card, layout: true, transition, whileHover: { y: -1 }, 'data-enabled': enabled ? 'true' : 'false' },
    h('button', { type: 'button', className: css.cardMain, onClick: onEdit, 'aria-label': `编辑${subagent.name}` },
      h('span', { className: css.cardIcon }, h(IconSubagentRobotOutline16, { size: 18 })),
      h('span', { className: css.cardCopy },
        h('span', { className: css.cardTitle }, h('strong', null, subagent.name), fixed ? h(Pill, null, '全局默认') : h('span', { className: css.statusTag, 'data-enabled': enabled ? 'true' : 'false' }, pending ? '正在更新' : enabled ? '已启用' : '已停用')),
        h('span', { className: css.cardDescription }, subagent.description),
        h('span', { className: css.tags },
          h('span', { className: available ? css.modelTag : `${css.modelTag} ${css.unavailable}` }, available ? modelLabel : `${modelLabel} · 当前不可用`),
          ...(subagent.tools ?? []).map(tool => h('span', { className: css.toolTag, key: tool }, tool === 'web_search' ? 'Web 搜索' : 'Skills'))))),
    fixed ? null : h('span', { className: css.cardActions },
      h(AvailabilitySwitch, { checked: enabled, disabled: toggleDisabled, pending, reduced, label: `${enabled ? '停用' : '启用'}${subagent.name}`, onClick: onToggle }),
      onDelete === undefined ? null : h('button', { type: 'button', className: css.deleteButton, onClick: onDelete, 'aria-label': `删除${subagent.name}` }, h(IconTrashOutline16, { size: 16 }))))
}

function AvailabilitySwitch({ checked, disabled, pending, reduced, label, onClick }) {
  return h('button', {
    type: 'button',
    className: css.availabilitySwitch,
    role: 'switch',
    'aria-checked': checked,
    'aria-label': label,
    'aria-busy': pending || undefined,
    disabled,
    onClick,
  }, h(m.span, {
    'aria-hidden': true,
    animate: { x: checked ? 18 : 2 },
    transition: reduced ? { duration: 0 } : { type: 'spring', stiffness: 560, damping: 38, mass: 0.6 },
  }))
}

function WriterEditor({ draft, onDraft, models, modelLoadFailed, saving, onBack, onSave }) {
  return h(EditorShell, { title: 'Writer', subtitle: '默认设置', description: '未单独设置的对话将使用此配置。', saving, onBack, onSave, saveLabel: '保存' },
    h(ModelField, { route: draft.route, onChange: route => onDraft(current => ({ ...current, route })), models, modelLoadFailed, writer: true }))
}

function SubagentEditor({ draft, onDraft, limits, models, modelLoadFailed, saving, onBack, onSave, onDelete }) {
  const toggleTool = tool => onDraft(current => ({ ...current, tools: current.tools.includes(tool) ? current.tools.filter(item => item !== tool) : [...current.tools, tool] }))
  return h(EditorShell, { title: draft.id === null ? '新增子代理' : `编辑 ${draft.name}`, subtitle: '独立任务子代理', saving, onBack, onSave, saveLabel: '保存子代理', onDelete },
    h('label', { className: css.field }, h('span', null, '名称'), h('input', { value: draft.name, maxLength: limits?.name, disabled: saving, placeholder: '例如：连续性校对', onChange: event => onDraft(current => ({ ...current, name: event.target.value })) })),
    h('label', { className: css.field }, h('span', null, '调用契约'), h('small', null, '这是父代理选择和排序本节点的完整依据。请写明适用范围、是否必须调用、相对 Writer 或其他工具的顺序、每次所需输入，以及结果如何使用。'), h('textarea', { rows: 5, value: draft.description, maxLength: limits?.description, disabled: saving, placeholder: '例如：适用于叙事续写。本节点必须在 Writer 前调用；传入本轮目标与场景资料；将返回大纲整理进 Writer brief。', onChange: event => onDraft(current => ({ ...current, description: event.target.value })) })),
    h('label', { className: css.field }, h('span', null, '工作指令'), h('small', null, '这里的内容会原样作为 System 提示词；只写它要做什么、关注重点、输出形式与任务边界。具体任务和资料会在每次调用时另行传入。'), h('textarea', { rows: 9, value: draft.instructions, maxLength: limits?.instructions, disabled: saving, placeholder: '例如：根据场景目标列出情节节拍、连续性事实和角色行动边界，返回紧凑分点大纲', onChange: event => onDraft(current => ({ ...current, instructions: event.target.value })) })),
    h(ModelField, { route: draft.route, onChange: route => onDraft(current => ({ ...current, route })), models, modelLoadFailed }),
    h('fieldset', { className: css.capabilities },
      h('legend', null, '只读能力'),
      h('p', null, '可不选择。子代理可以产出大纲或候选改写，但不能替代 Writer、提交回复、修改资料或再次调用子代理。'),
      h('label', null, h('input', { type: 'checkbox', checked: draft.tools.includes('web_search'), disabled: saving, onChange: () => toggleTool('web_search') }), h(IconGlobeOutline14, { size: 14 }), h('span', null, h('strong', null, 'Web 搜索'), h('small', null, '查询公开网页信息'))),
      h('label', null, h('input', { type: 'checkbox', checked: draft.tools.includes('skill'), disabled: saving, onChange: () => toggleTool('skill') }), h(IconSkillOutline16, { size: 14 }), h('span', null, h('strong', null, 'Skills'), h('small', null, '读取并执行已安装的只读工作指南')))))
}

function EditorShell({ title, subtitle, description = '更改从下一次回复开始生效。', saving, onBack, onSave, saveLabel, onDelete, children }) {
  return h('div', { className: css.editor },
    h('div', { className: css.editorNav },
      h('button', { type: 'button', disabled: saving, onClick: onBack }, h(IconChevronLeftOutline14, { size: 14 }), '返回'),
      h('div', { className: css.editorActions },
        onDelete === undefined ? null : h('button', { type: 'button', className: css.deleteEditorAction, disabled: saving, onClick: onDelete }, h(IconTrashOutline16, { size: 14 }), '删除'),
        h('button', { type: 'button', className: css.primaryButton, disabled: saving, onClick: onSave }, saving ? '保存中…' : saveLabel))),
    h('div', { className: css.editorBody },
      h('header', null, h('span', { className: css.editorMark }, h(IconSubagentRobotOutline16, { size: 22 })), h('div', null, h('small', null, subtitle), h('h3', null, title), h('p', null, description))),
      children))
}

function ModelField({ route, onChange, models, modelLoadFailed, writer = false }) {
  const key = routeKey(route)
  const available = routeAvailable(route, models.groups)
  const selectedModel = route.kind === 'fixed'
    ? models.groups.find(group => group.id === route.provider)?.models?.find(model => model.id === route.model)
    : undefined
  const efforts = selectedModel?.reasoning?.efforts ?? []
  const defaultEffort = selectedModel?.reasoning?.defaultEffort
  const explicitEffort = typeof route.reasoningEffort === 'string' ? route.reasoningEffort : ''
  const effortAvailable = explicitEffort === '' || efforts.some(effort => effort.id === explicitEffort)
  const defaultEffortName = efforts.find(effort => effort.id === defaultEffort)?.name
  const failures = models.failures ?? []
  return h(React.Fragment, null,
    h('label', { className: css.field },
      h('span', null, '模型'),
      h('small', null, writer ? '选择“跟随当前对话”时，使用对话当前的模型设置。' : '跟随父代理时，使用当前对话的模型设置。'),
      h('select', { value: key, onChange: event => onChange(routeFromKey(event.target.value)), 'aria-label': writer ? 'Writer 全局默认模型' : '子代理模型' },
        h('option', { value: 'inherit' }, writer ? '跟随当前对话' : '跟随父代理'),
        !available && route.kind === 'fixed' && selectedModel === undefined ? h('option', { value: key, disabled: true }, `${route.provider} · ${route.model}（当前不可用）`) : null,
        ...models.groups.map(group => h('optgroup', { key: group.id, label: group.name }, ...group.models.map(model => h('option', { key: model.id, value: JSON.stringify([group.id, model.id]) }, model.name))))),
      !available && route.kind === 'fixed' && selectedModel === undefined ? h('span', { className: css.fieldWarning, role: 'status' }, `已保存的模型当前不可用。请选择其他模型或${writer ? '跟随当前对话' : '跟随父代理'}。`) : null,
      modelLoadFailed ? h('span', { className: css.fieldWarning, role: 'status' }, '模型目录暂时无法读取。稍后重新打开即可重试。') : null,
      ...failures.map(failure => h('span', { className: css.catalogFailure, key: failure.id }, `${failure.name} 的模型目录暂时不可用，其他提供方仍可选择。`))),
    route.kind !== 'fixed' || selectedModel === undefined || efforts.length === 0 ? null : h('label', { className: css.field },
      h('span', null, '推理强度'),
      h('small', null, '默认使用模型推荐值。'),
      h('select', {
        value: explicitEffort,
        onChange: event => onChange({
          kind: 'fixed', provider: route.provider, model: route.model,
          ...(event.target.value === '' ? {} : { reasoningEffort: event.target.value }),
        }),
        'aria-label': writer ? 'Writer 全局默认推理强度' : '子代理推理强度',
      },
      h('option', { value: '' }, defaultEffortName === undefined ? '使用模型默认值' : `使用模型默认值（${defaultEffortName}）`),
      !effortAvailable ? h('option', { value: explicitEffort, disabled: true }, `${explicitEffort}（当前不可用）`) : null,
      ...efforts.map(effort => h('option', { key: effort.id, value: effort.id }, effort.name))),
      !effortAvailable ? h('span', { className: css.fieldWarning, role: 'status' }, '已保存的推理强度不再受此模型支持。请选择其他强度或使用模型默认值。') : null))
}

function SessionModelField({ route, defaultRoute, onChange, models, modelLoadFailed }) {
  const key = route === null ? 'default' : routeKey(route)
  const available = route === null || routeAvailable(route, models.groups)
  const defaultAvailable = routeAvailable(defaultRoute, models.groups)
  const selectedModel = route?.kind === 'fixed'
    ? models.groups.find(group => group.id === route.provider)?.models?.find(model => model.id === route.model)
    : undefined
  const efforts = selectedModel?.reasoning?.efforts ?? []
  const defaultEffort = selectedModel?.reasoning?.defaultEffort
  const explicitEffort = typeof route?.reasoningEffort === 'string' ? route.reasoningEffort : ''
  const effortAvailable = explicitEffort === '' || efforts.some(effort => effort.id === explicitEffort)
  const defaultEffortName = efforts.find(effort => effort.id === defaultEffort)?.name
  const failures = models.failures ?? []
  const globalLabel = defaultRoute?.kind === 'fixed' ? routeLabel(defaultRoute, models.groups) : '跟随当前对话'
  const modelOptions = [
    h('option', { key: 'default', value: 'default' }, `使用全局默认（${globalLabel}）`),
    h('option', { key: 'inherit', value: 'inherit' }, '跟随当前对话'),
    !available && route?.kind === 'fixed' && selectedModel === undefined
      ? h('option', { key: 'unavailable', value: key, disabled: true }, `${route.provider} · ${route.model}（当前不可用）`)
      : null,
    ...models.groups.map(group => h('optgroup', { key: group.id, label: group.name },
      ...group.models.map(model => h('option', { key: model.id, value: JSON.stringify([group.id, model.id]) }, model.name)))),
  ]
  const modelField = h('label', { className: css.field },
    h('span', null, '模型'),
    h('small', null, '使用全局默认会自动同步；其他选择只影响当前对话。'),
    h('select', {
      value: key,
      onChange: event => onChange(event.target.value === 'default' ? null : routeFromKey(event.target.value)),
      'aria-label': '当前对话 Writer 模型',
    }, ...modelOptions),
    route === null && !defaultAvailable ? h('span', { className: css.fieldWarning, role: 'status' }, '全局默认模型当前不可用。可以为当前对话选择其他模型，或稍后修改全局默认值。') : null,
    !available && route?.kind === 'fixed' && selectedModel === undefined ? h('span', { className: css.fieldWarning, role: 'status' }, '当前对话保存的模型已不可用。请选择其他模型、跟随当前对话或恢复全局默认。') : null,
    modelLoadFailed ? h('span', { className: css.fieldWarning, role: 'status' }, '模型目录暂时无法读取。稍后重新打开即可重试。') : null,
    ...failures.map(failure => h('span', { className: css.catalogFailure, key: failure.id }, `${failure.name} 的模型目录暂时不可用，其他提供方仍可选择。`)))
  const effortField = route?.kind !== 'fixed' || selectedModel === undefined || efforts.length === 0
    ? null
    : h('label', { className: css.field },
      h('span', null, '推理强度'),
      h('small', null, '默认使用模型推荐值。'),
      h('select', {
        value: explicitEffort,
        onChange: event => onChange({
          kind: 'fixed', provider: route.provider, model: route.model,
          ...(event.target.value === '' ? {} : { reasoningEffort: event.target.value }),
        }),
        'aria-label': '当前对话 Writer 推理强度',
      },
      h('option', { value: '' }, defaultEffortName === undefined ? '使用模型默认值' : `使用模型默认值（${defaultEffortName}）`),
      !effortAvailable ? h('option', { value: explicitEffort, disabled: true }, `${explicitEffort}（当前不可用）`) : null,
      ...efforts.map(effort => h('option', { key: effort.id, value: effort.id }, effort.name))),
      !effortAvailable ? h('span', { className: css.fieldWarning, role: 'status' }, '当前对话保存的推理强度已不受此模型支持。请选择其他强度或使用模型默认值。') : null)
  return h(React.Fragment, null, modelField, effortField)
}

function sessionUserMessage(error, action = 'save') {
  if (error?.code === 'REVISION_CONFLICT') return '当前对话的设置刚刚发生了变化，请关闭并重新打开后再保存。'
  if (error?.code === 'SESSION_RUNNING') return '当前回复正在生成，结束后再修改 Writer 设置。'
  if (error?.code === 'MODEL_UNAVAILABLE') return '所选模型当前不可用，请选择其他模型、跟随当前对话或恢复全局默认。'
  if (error?.code === 'NOT_RP_SESSION' || error?.code === 'ASSET_NOT_FOUND') return '当前对话已经不可用，请刷新页面后重试。'
  if (action === 'load') return '暂时无法读取 Writer 的全局默认值，请稍后重试。'
  return '暂时无法保存当前对话的 Writer 设置，请检查选择后重试。'
}

function DeleteSubagentDialog({ target, pending, error, onCancel, onConfirm }) {
  return h(Modal, {
    open: target !== null,
    onClose: onCancel,
    closeLabel: '关闭删除子代理确认',
    title: target === null ? '删除子代理' : `删除“${target.name}”？`,
    description: '删除后，这个子代理不会再出现在后续 Agent 可用列表中。',
    className: css.deleteDialog,
    footer: h(React.Fragment, null,
      h(Button, { variant: 'outline', autoFocus: true, disabled: pending, onClick: onCancel }, '取消'),
      h(Button, { variant: 'outline', className: css.deleteConfirmAction, disabled: pending, onClick: onConfirm }, pending ? '正在删除…' : '删除子代理')),
  },
  h('div', { className: css.deleteSummary },
    h('strong', null, '已经开始的任务和历史记录不受影响'),
    h('span', null, '正在运行的独立任务会继续使用启动时的配置；删除只影响之后的新回复。')),
  error === null ? null : h('div', { className: css.deleteError, role: 'alert' }, error))
}
