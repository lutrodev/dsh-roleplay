import React, { useEffect, useState } from 'react'
import { Button, IconChecklistOutline14, IconChevronLeftOutline14, IconEllipsisOutline16, IconPlusOutline16, IconTrashOutline16, Menu, Modal } from '@deepseek-ai/dsh-client-ui-primitives'
import { domMax, LazyMotion, m, MotionConfig, Reorder } from 'motion/react'
import { useWorkbenchModal } from 'dsh-roleplay-rp-ui'
import { css, ensureStyles } from './client-styles.generated.js'

export const inject = ['slots', 'rpRemote', 'rpAssetEditors']
const h = React.createElement
const FIELD_POSITIONS = [
  { id: 'top', label: '顶部', description: '位于角色资料之前' },
  { id: 'bottom', label: '底部', description: '位于文风和重要规则之后' },
]

export function apply(ctx) {
  ctx.effect(ensureStyles)
  ctx.effect(() => ctx.rpAssetEditors.register('preset', PresetSessionEditor), 'rp-preset: canonical session editor')
  ctx.slots.inject('rp-assets.preset-entry', () => ctx.slots.register({ name: 'rp-assets.preset-entry', inject: () => ({ connection: ctx.rpRemote }) }, PresetLibraryEntry))
}

function PresetLibraryEntry({ wide, connection }) {
  const [open, setOpen] = useState(false)
  return h(MotionConfig, { reducedMotion: 'user' }, h(LazyMotion, { features: domMax, strict: true }, h(React.Fragment, null,
    h(m.button, {
      type: 'button', className: wide ? css.trigger : `${css.trigger} ${css.rail}`,
      whileHover: { y: -1 }, whileTap: { scale: 0.98 }, onClick: () => setOpen(true),
      'aria-label': '预设', title: wide ? undefined : '预设',
    }, h(IconChecklistOutline14, { size: wide ? 16 : 18 }), wide ? h('span', { className: css.triggerLabel }, '预设') : null),
    h(PresetLibrary, { open, onClose: () => setOpen(false), connection }))))
}

function PresetLibrary({ open, onClose, connection }) {
  const [items, setItems] = useState([])
  const [templates, setTemplates] = useState([])
  const [view, setView] = useState('list')
  const [draft, setDraft] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  const dialogRef = useWorkbenchModal(open)

  const reload = async () => {
    setLoading(true); setError(null)
    try { setItems((await rpc(connection, 'list', { limit: 100 })).items) }
    catch (reason) { setError(userMessage(reason, 'load')) } finally { setLoading(false) }
  }
  useEffect(() => {
    if (!open) return
    setView('list'); setDraft(null); setDeleteTarget(null); setDeleteError(null); void reload()
  }, [connection, open])

  const create = async () => {
    setLoading(true); setError(null)
    try { setTemplates((await rpc(connection, 'templates', {})).items); setView('create') }
    catch (reason) { setError(userMessage(reason, 'load')) } finally { setLoading(false) }
  }
  const startCreate = preset => { setDraft(newPresetDraft(preset)); setView('edit'); setError(null) }
  const edit = async id => {
    setLoading(true); setError(null)
    try { setDraft(await rpc(connection, 'get', { id })); setView('edit') }
    catch (reason) { setError(userMessage(reason, 'load')) } finally { setLoading(false) }
  }
  const save = async () => {
    if (!draft?.name.trim() || draft.fields.some(field => !field.name.trim())) { setError('请填写预设名称和每个栏位的名称。'); return }
    setSaving(true); setError(null)
    try {
      const preset = { name: draft.name, description: draft.description, fields: draft.fields }
      if (draft.id === null) await rpc(connection, 'create', { preset })
      else await rpc(connection, 'update', { id: draft.id, expectedRevision: draft.revision, preset })
      await reload(); setView('list'); setDraft(null)
    } catch (reason) { setError(userMessage(reason)) } finally { setSaving(false) }
  }
  const setDefault = async id => {
    setError(null)
    try { await rpc(connection, 'set-default', { id }); setItems(current => current.map(item => ({ ...item, isDefault: item.id === id }))) }
    catch (reason) { setError(userMessage(reason, 'default')) }
  }
  const requestDelete = target => {
    setDeleteTarget({ id: target.id, revision: target.revision, name: target.name, isDefault: target.isDefault === true })
    setDeleteError(null)
  }
  const closeDelete = () => {
    if (deleting) return
    setDeleteTarget(null); setDeleteError(null)
  }
  const remove = async () => {
    if (deleteTarget === null) return
    const target = deleteTarget
    setDeleting(true); setDeleteError(null)
    try {
      await rpc(connection, 'delete', { id: target.id, expectedRevision: target.revision })
      setDeleteTarget(null); setDraft(null); setView('list')
      await reload()
    } catch (reason) { setDeleteError(userMessage(reason, 'delete')) } finally { setDeleting(false) }
  }

  const body = view === 'edit' && draft !== null
    ? h(PresetEditor, { draft, onDraft: setDraft, onBack: () => { setView('list'); setError(null) }, onSave: () => void save(), onDelete: draft.id === null ? undefined : () => requestDelete(draft), saving })
    : view === 'create'
      ? h(PresetCreateChooser, { templates, onBack: () => setView('list'), onBlank: () => startCreate(), onTemplate: template => startCreate(template.preset) })
      : h(PresetList, { items, loading, onCreate: () => void create(), onEdit: id => void edit(id), onSetDefault: id => void setDefault(id), onDelete: requestDelete })
  const compact = view === 'list' && items.length > 0
  return h(React.Fragment, null,
    h(Modal, { open, onClose: deleteTarget === null ? onClose : () => {}, title: '预设', closeLabel: '关闭预设资料库', className: compact ? `${css.dialog} ${css.compactDialog}` : css.dialog, contentClassName: css.content },
      h('div', { ref: dialogRef, tabIndex: -1, className: css.shell }, error ? h('div', { className: css.error, role: 'alert' }, error) : null, body)),
    h(DeletePresetDialog, { target: deleteTarget, pending: deleting, error: deleteError, onCancel: closeDelete, onConfirm: () => void remove() }))
}

function PresetSessionEditor({ mode, id, connection, disabled, onCancel, onSaved }) {
  const [draft, setDraft] = useState(null)
  const [templates, setTemplates] = useState([])
  const [view, setView] = useState(mode === 'create' ? 'create' : 'edit')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  useEffect(() => {
    if (mode === 'create') {
      let live = true
      setLoading(true); setError(null); setDraft(null); setView('create')
      void rpc(connection, 'templates', {})
        .then(value => { if (live) { setTemplates(value.items); setLoading(false) } })
        .catch(reason => { if (live) { setError(userMessage(reason, 'load')); setLoading(false) } })
      return () => { live = false }
    }
    let live = true
    setLoading(true); setError(null); setDraft(null)
    void rpc(connection, 'get', { id })
      .then(value => { if (live) { setDraft(value); setLoading(false) } })
      .catch(reason => { if (live) { setError(userMessage(reason, 'load')); setLoading(false) } })
    return () => { live = false }
  }, [connection, id, mode])
  const save = async () => {
    if (disabled || !draft?.name.trim() || draft.fields.some(field => !field.name.trim())) {
      setError('请填写预设名称和每个栏位的名称。')
      return
    }
    setSaving(true); setError(null)
    try {
      const preset = { name: draft.name, description: draft.description, fields: draft.fields }
      const value = await rpc(connection, mode === 'create' ? 'create' : 'update', mode === 'create'
        ? { preset }
        : { id: draft.id, expectedRevision: draft.revision, preset })
      await onSaved(value)
    } catch (reason) { setError(userMessage(reason)) } finally { setSaving(false) }
  }
  if (loading) return h('div', { className: css.state }, mode === 'create' ? '正在准备预设模板…' : '正在读取预设…')
  if (view === 'create') return h('div', { className: css.shell },
    error ? h('div', { className: css.error, role: 'alert' }, error) : null,
    h(PresetCreateChooser, { templates, onBack: onCancel, onBlank: () => { setDraft(newPresetDraft()); setView('edit') }, onTemplate: template => { setDraft(newPresetDraft(template.preset)); setView('edit') } }))
  if (draft === null) return h('div', { className: css.state }, error ?? '暂时无法打开预设。', h('button', { type: 'button', onClick: onCancel }, '返回'))
  return h('div', { className: css.shell },
    error ? h('div', { className: css.error, role: 'alert' }, error) : null,
    h(PresetEditor, { draft, onDraft: setDraft, onBack: mode === 'create' ? () => { setDraft(null); setView('create'); setError(null) } : onCancel, onSave: () => void save(), saving, disabled }))
}

function PresetList({ items, loading, onCreate, onEdit, onSetDefault, onDelete }) {
  if (loading && items.length === 0) return h('div', { className: css.state }, '正在读取预设…')
  if (items.length === 0) return h('div', { className: css.empty },
    h('div', { className: css.emptyIcon }, h(IconChecklistOutline14, { size: 24 })),
    h('h3', null, '创建你的第一个预设'),
    h('p', null, '可以从模板开始，也可以创建一个没有预设栏位的空白预设。'),
    h('button', { type: 'button', className: css.primaryButton, onClick: onCreate }, h(IconPlusOutline16, { size: 16 }), '新建预设'))
  return h('div', { className: css.list },
    h('div', { className: css.listToolbar }, h('span', null, `${items.length} 个预设`), h(m.button, { type: 'button', className: css.createRow, whileTap: { scale: 0.98 }, onClick: onCreate }, h(IconPlusOutline16, { size: 16 }), '新建预设')),
    ...items.map(item => h(PresetRow, { key: item.id, item, onEdit, onSetDefault, onDelete })))
}

function PresetRow({ item, onEdit, onSetDefault, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const actions = item.status === 'corrupt' ? [] : [
    ...(item.isDefault ? [] : [{ id: 'set-default', label: '设为默认' }]),
    { id: 'delete', label: '删除预设', danger: true },
  ]
  return h('div', { className: css.rowWrap, 'data-default': item.isDefault ? 'true' : undefined },
    h(m.button, { type: 'button', className: css.row, whileHover: { y: -1 }, whileTap: { scale: 0.99 }, disabled: item.status === 'corrupt', onClick: () => onEdit(item.id) },
      h('span', { className: css.rowIcon }, h(IconChecklistOutline14, { size: 17 })),
      h('span', { className: css.rowCopy }, h('span', { className: css.nameLine }, h('strong', null, item.name), item.isDefault ? h('span', { className: css.defaultBadge }, '默认') : null), h('small', null, item.status === 'corrupt' ? '内容无法读取' : item.description || `${item.fields} 个栏位`)),
      h('span', { className: css.rowMeta }, `${item.fields} 项`)),
    actions.length === 0 ? null : h(Menu, {
      open: menuOpen,
      items: actions,
      align: 'end',
      portal: true,
      compact: true,
      onClose: () => setMenuOpen(false),
      onSelect: action => {
        setMenuOpen(false)
        if (action === 'delete') onDelete(item)
        else if (action === 'set-default') void onSetDefault(item.id)
      },
      anchor: h('button', { type: 'button', className: css.moreAction, 'aria-label': `${item.name}的更多操作`, 'aria-expanded': menuOpen, onClick: event => { event.stopPropagation(); setMenuOpen(value => !value) } }, h(IconEllipsisOutline16, { size: 18 })),
    }))
}

function PresetCreateChooser({ templates, onBack, onBlank, onTemplate }) {
  return h('div', { className: css.createChooser },
    h('div', { className: css.editorNav }, h('button', { type: 'button', onClick: onBack }, h(IconChevronLeftOutline14, { size: 14 }), '返回')),
    h('div', { className: css.createChooserBody },
      h('header', null, h('h3', null, '新建预设'), h('p', null, '选择一个起点，进入编辑后可以修改全部内容。')),
      h('button', { type: 'button', className: css.templateCard, onClick: onBlank },
        h('strong', null, '空白预设'), h('span', null, '从空白创建 →')),
      ...templates.map(template => h('button', { key: template.id, type: 'button', className: css.templateCard, onClick: () => onTemplate(template) },
        h('strong', null, template.name), h('span', null, `${template.preset.fields.length} 个示例栏位 →`)))))
}

function PresetEditor({ draft, onDraft, onBack, onSave, onDelete, saving, disabled = false }) {
  const updateField = (id, key, value) => onDraft(current => ({ ...current, fields: current.fields.map(field => field.id === id ? { ...field, [key]: value } : field) }))
  const addField = () => onDraft(current => ({ ...current, fields: insertAtPositionEnd(current.fields, { id: crypto.randomUUID(), name: '', description: '', content: '', position: 'top' }, 'top') }))
  const removeField = id => onDraft(current => ({ ...current, fields: current.fields.filter(field => field.id !== id) }))
  const move = (position, index, offset) => onDraft(current => ({ ...current, fields: mergePositionOrder(current.fields, position, moveItem(current.fields.filter(field => field.position === position), index, index + offset)) }))
  const changePosition = (id, position) => onDraft(current => {
    const field = current.fields.find(item => item.id === id)
    if (field === undefined || field.position === position) return current
    return { ...current, fields: insertAtPositionEnd(current.fields.filter(item => item.id !== id), { ...field, position }, position) }
  })
  return h('div', { className: css.editor },
    h('div', { className: css.editorNav },
      h('button', { type: 'button', disabled: saving, onClick: onBack }, h(IconChevronLeftOutline14, { size: 14 }), '返回'),
      h('div', { className: css.editorActions },
        onDelete === undefined ? null : h('button', { type: 'button', className: css.deleteEditorAction, disabled: disabled || saving, onClick: onDelete }, h(IconTrashOutline16, { size: 14 }), '删除预设'),
        h('button', { type: 'button', className: css.primaryButton, disabled: disabled || saving, onClick: onSave }, saving ? '保存中…' : '保存预设'))),
    h('div', { className: css.editorBody },
      h('header', null, h('div', null, h('span', { className: css.editorMark }, h(IconChecklistOutline14, { size: 20 })), h('div', null, h('h3', null, draft.id === null ? '创建预设' : '编辑预设'), h('p', null, '顶部位于角色资料之前，底部位于重要规则之后')))),
      h('label', { className: css.field }, h('span', null, '预设名称'), h('input', { value: draft.name, disabled: disabled || saving, placeholder: '例如：电影感长篇叙事', onChange: event => onDraft(current => ({ ...current, name: event.target.value })) })),
      h('label', { className: css.field }, h('span', null, '预设说明'), h('textarea', { rows: 2, value: draft.description, disabled: disabled || saving, placeholder: '说明这套预设适合什么故事', onChange: event => onDraft(current => ({ ...current, description: event.target.value })) })),
      h('div', { className: css.fieldHeader }, h('div', null, h('strong', null, '预设栏位'), h('small', null, '先选择位置，再在位置内拖动或使用上下按钮排序')), h('button', { type: 'button', disabled: disabled || saving, onClick: addField }, h(IconPlusOutline16, { size: 14 }), '新增栏位')),
      ...FIELD_POSITIONS.map(position => h(PresetPositionGroup, {
        key: position.id,
        position,
        fields: draft.fields.filter(field => field.position === position.id),
        disabled: disabled || saving,
        onReorder: fields => onDraft(current => ({ ...current, fields: mergePositionOrder(current.fields, position.id, fields) })),
        onUpdate: updateField,
        onPosition: changePosition,
        onMove: move,
        onRemove: removeField,
      }))))
}

function DeletePresetDialog({ target, pending, error, onCancel, onConfirm }) {
  return h(Modal, {
    open: target !== null,
    onClose: onCancel,
    closeLabel: '关闭删除预设确认',
    title: target === null ? '删除预设' : `删除“${target.name}”？`,
    description: '删除后，这个预设会从资料库中移除。',
    className: css.deleteDialog,
    footer: h(React.Fragment, null,
      h(Button, { variant: 'outline', autoFocus: true, disabled: pending, onClick: onCancel }, '取消'),
      h(Button, { variant: 'outline', className: css.deleteConfirmAction, disabled: pending, onClick: onConfirm }, pending ? '正在删除…' : '删除预设')),
  },
  h('div', { className: css.deleteSummary },
    h('strong', null, '仍在使用它的对话可能无法继续生成回复'),
    h('span', null, '已有消息会保留。需要继续时，可以在会话设置中改选其他预设。'),
    target?.isDefault ? h('span', null, '它是当前默认预设；如果还有其他预设，会自动改用其中一个。') : null),
  error === null ? null : h('div', { className: css.deleteError, role: 'alert' }, error))
}

function PresetPositionGroup({ position, fields, disabled, onReorder, onUpdate, onPosition, onMove, onRemove }) {
  return h('section', { className: css.positionGroup, 'aria-labelledby': `preset-position-${position.id}` },
    h('header', { className: css.positionHeader }, h('div', null, h('strong', { id: `preset-position-${position.id}` }, position.label), h('small', null, position.description)), h('span', null, `${fields.length} 项`)),
    h(Reorder.Group, { axis: 'y', values: fields, onReorder, className: css.fields },
      ...fields.map((field, index) => h(Reorder.Item, { key: field.id, value: field, className: css.fieldCard, layout: true },
        h('div', { className: css.fieldCardHeader }, h('button', { type: 'button', disabled, className: css.drag, 'aria-label': `拖动${field.name || '新栏位'}调整${position.label}顺序` }, '⠿'), h('strong', null, field.name || '新栏位'), h('span', null, `${index + 1}/${fields.length}`),
          h('button', { type: 'button', disabled: disabled || index === 0, onClick: () => onMove(position.id, index, -1), 'aria-label': '上移栏位' }, '↑'),
          h('button', { type: 'button', disabled: disabled || index === fields.length - 1, onClick: () => onMove(position.id, index, 1), 'aria-label': '下移栏位' }, '↓'),
          h('button', { type: 'button', disabled, onClick: () => onRemove(field.id), 'aria-label': '删除栏位' }, '删除')),
        h('div', { className: css.fieldGrid },
          h('label', { className: css.field }, h('span', null, '位置'), h('select', { value: field.position, disabled, 'aria-label': `${field.name || '新栏位'}的位置`, onChange: event => onPosition(field.id, event.target.value) }, ...FIELD_POSITIONS.map(option => h('option', { key: option.id, value: option.id }, option.label)))),
          h('label', { className: css.field }, h('span', null, '名称'), h('input', { value: field.name, disabled, placeholder: '栏位名称', onChange: event => onUpdate(field.id, 'name', event.target.value) })),
          h('label', { className: css.field }, h('span', null, '描述'), h('input', { value: field.description, disabled, placeholder: '告诉模型这项内容的用途', onChange: event => onUpdate(field.id, 'description', event.target.value) }))),
        h('label', { className: css.field }, h('span', null, '内容'), h('textarea', { rows: 5, value: field.content, disabled, placeholder: '填写要在回复前参考的具体内容', onChange: event => onUpdate(field.id, 'content', event.target.value) }))))))
}

function newPresetDraft(preset) {
  return {
    id: null,
    revision: 0,
    name: preset?.name ?? '',
    description: preset?.description ?? '',
    fields: (preset?.fields ?? []).map(field => ({ ...field, id: crypto.randomUUID() })),
  }
}

function mergePositionOrder(fields, position, ordered) {
  const byPosition = { top: fields.filter(field => field.position === 'top'), bottom: fields.filter(field => field.position === 'bottom') }
  byPosition[position] = ordered
  return [...byPosition.top, ...byPosition.bottom]
}

function insertAtPositionEnd(fields, field, position) {
  const top = fields.filter(item => item.position === 'top')
  const bottom = fields.filter(item => item.position === 'bottom')
  return position === 'top' ? [...top, field, ...bottom] : [...top, ...bottom, field]
}

function moveItem(items, from, to) {
  if (to < 0 || to >= items.length) return items
  const next = [...items]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

async function rpc(connection, endpoint, payload) {
  const response = await connection.call('/rp-presets', endpoint, payload)
  const domain = response?.ok === true && response.value?.ok !== undefined ? response.value : response
  if (domain?.ok !== true) throw Object.assign(new Error(domain?.error?.message ?? '请求失败'), { code: domain?.error?.code })
  return domain.value
}
function userMessage(error, action = 'save') {
  if (error?.code === 'ASSET_NOT_FOUND') return '这个预设已不存在，请返回列表后刷新。'
  if (error?.code === 'ASSET_CORRUPT') return '这个预设的内容无法读取。'
  if (error?.code === 'REVISION_CONFLICT') return action === 'delete' ? '这个预设刚刚发生了变化，请关闭确认后重新打开。' : '这个预设已在其他位置更新，请返回列表后重新打开。'
  if (error?.code === 'LIMIT_EXCEEDED') return '预设内容太长，请精简后再保存。'
  if (action === 'delete') return '暂时无法删除预设，请稍后重试。'
  if (action === 'load') return '暂时无法读取预设，请稍后重试。'
  if (action === 'default') return '暂时无法设置默认预设，请稍后重试。'
  return '暂时无法保存预设，请检查内容后重试。'
}
