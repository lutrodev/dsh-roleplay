import React, { useEffect, useState } from 'react'
import { Button, IconChevronLeftOutline14, IconEllipsisOutline16, IconListPenOutline16, IconPlusOutline16, IconTrashOutline16, Menu, Modal } from '@deepseek-ai/dsh-client-ui-primitives'
import { domMax, LazyMotion, m, MotionConfig } from 'motion/react'
import { css, ensureStyles } from './client-styles.generated.js'

export const inject = ['slots', 'rpRemote', 'rpAssetEditors']
const h = React.createElement

export function apply(ctx) {
  ctx.effect(ensureStyles)
  ctx.effect(() => ctx.rpAssetEditors.register('writingStyle', WritingStyleSessionEditor), 'rp-writing-style: canonical session editor')
  ctx.slots.inject('rp-assets.writing-style-entry', () => ctx.slots.register({ name: 'rp-assets.writing-style-entry', inject: () => ({ connection: ctx.rpRemote }) }, WritingStyleLibraryEntry))
}

function WritingStyleLibraryEntry({ wide, connection }) {
  const [open, setOpen] = useState(false)
  return h(MotionConfig, { reducedMotion: 'user' }, h(LazyMotion, { features: domMax, strict: true }, h(React.Fragment, null,
    h(m.button, {
      type: 'button', className: wide ? css.trigger : `${css.trigger} ${css.rail}`,
      whileHover: { y: -1 }, whileTap: { scale: 0.98 }, onClick: () => setOpen(true),
      'aria-label': '文风', title: wide ? undefined : '文风',
    }, h(IconListPenOutline16, { size: wide ? 16 : 18 }), wide ? h('span', { className: css.triggerLabel }, '文风') : null),
    h(WritingStyleLibrary, { open, onClose: () => setOpen(false), connection }))))
}

function WritingStyleLibrary({ open, onClose, connection }) {
  const [items, setItems] = useState([])
  const [view, setView] = useState('list')
  const [draft, setDraft] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  const reload = async () => {
    setLoading(true); setError(null)
    try { setItems((await rpc(connection, 'list', { limit: 100 })).items) }
    catch (reason) { setError(userMessage(reason, 'load')) } finally { setLoading(false) }
  }
  useEffect(() => { if (open) { setView('list'); setDraft(null); void reload() } }, [connection, open])

  const create = () => { setDraft(newWritingStyleDraft()); setView('edit'); setError(null) }
  const edit = async id => {
    setLoading(true); setError(null)
    try { setDraft(await rpc(connection, 'get', { id })); setView('edit') }
    catch (reason) { setError(userMessage(reason, 'load')) } finally { setLoading(false) }
  }
  const save = async () => {
    if (!draft?.name.trim() || !draft.content.trim()) { setError('请填写文风名称和写作要求。'); return }
    setSaving(true); setError(null)
    try {
      const style = { name: draft.name, description: draft.description, content: draft.content }
      if (draft.id === null) await rpc(connection, 'create', { style })
      else await rpc(connection, 'update', { id: draft.id, expectedRevision: draft.revision, style })
      await reload(); setView('list'); setDraft(null)
    } catch (reason) { setError(userMessage(reason)) } finally { setSaving(false) }
  }
  const requestDelete = target => {
    setDeleteTarget({ id: target.id, revision: target.revision, name: target.name })
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

  const compact = view === 'list' && items.length > 0
  return h(React.Fragment, null,
    h(Modal, { open, onClose: deleteTarget === null ? onClose : () => {}, title: '文风', closeLabel: '关闭文风资料库', className: compact ? `${css.dialog} ${css.compactDialog}` : css.dialog, contentClassName: css.content },
      h('div', { className: css.shell }, error ? h('div', { className: css.error, role: 'alert' }, error) : null,
        view === 'edit' && draft !== null
          ? h(WritingStyleEditor, { draft, onDraft: setDraft, onBack: () => { setView('list'); setError(null) }, onSave: () => void save(), onDelete: draft.id === null ? undefined : () => requestDelete(draft), saving })
          : h(WritingStyleList, { items, loading, onCreate: create, onEdit: id => void edit(id), onDelete: requestDelete }))),
    h(DeleteWritingStyleDialog, { target: deleteTarget, pending: deleting, error: deleteError, onCancel: closeDelete, onConfirm: () => void remove() }))
}

function WritingStyleSessionEditor({ mode, id, connection, disabled, onCancel, onSaved }) {
  const [draft, setDraft] = useState(() => mode === 'create' ? newWritingStyleDraft() : null)
  const [loading, setLoading] = useState(mode === 'edit')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  useEffect(() => {
    if (mode !== 'edit') return
    let live = true
    setLoading(true); setError(null); setDraft(null)
    void rpc(connection, 'get', { id })
      .then(value => { if (live) { setDraft(value); setLoading(false) } })
      .catch(reason => { if (live) { setError(userMessage(reason, 'load')); setLoading(false) } })
    return () => { live = false }
  }, [connection, id, mode])
  const save = async () => {
    if (disabled || !draft?.name.trim() || !draft.content.trim()) {
      setError('请填写文风名称和写作要求。')
      return
    }
    setSaving(true); setError(null)
    try {
      const style = { name: draft.name, description: draft.description, content: draft.content }
      const value = await rpc(connection, mode === 'create' ? 'create' : 'update', mode === 'create'
        ? { style }
        : { id: draft.id, expectedRevision: draft.revision, style })
      await onSaved(value)
    } catch (reason) { setError(userMessage(reason)) } finally { setSaving(false) }
  }
  if (loading) return h('div', { className: css.state }, '正在读取文风…')
  if (draft === null) return h('div', { className: css.state }, error ?? '暂时无法打开文风。', h('button', { type: 'button', onClick: onCancel }, '返回'))
  return h('div', { className: css.shell },
    error ? h('div', { className: css.error, role: 'alert' }, error) : null,
    h(WritingStyleEditor, { draft, onDraft: setDraft, onBack: onCancel, onSave: () => void save(), saving, disabled }))
}

function WritingStyleList({ items, loading, onCreate, onEdit, onDelete }) {
  if (loading && items.length === 0) return h('div', { className: css.state }, '正在读取文风…')
  if (items.length === 0) return h('div', { className: css.empty },
    h('div', { className: css.emptyIcon }, h(IconListPenOutline16, { size: 24 })),
    h('h3', null, '创建你的第一种文风'),
    h('p', null, '写下叙事语言、视角、节奏和表达偏好，开始故事时可以同时选择多种文风。'),
    h('button', { type: 'button', className: css.primaryButton, onClick: onCreate }, h(IconPlusOutline16, { size: 16 }), '新建文风'))
  return h('div', { className: css.list },
    h('div', { className: css.listToolbar }, h('span', null, `${items.length} 种文风`), h(m.button, { type: 'button', className: css.createRow, whileTap: { scale: 0.98 }, onClick: onCreate }, h(IconPlusOutline16, { size: 16 }), '新建文风')),
    ...items.map(item => h(WritingStyleRow, { key: item.id, item, onEdit, onDelete })))
}

function WritingStyleRow({ item, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const actions = item.status === 'corrupt' ? [] : [
    { id: 'delete', label: '删除文风', danger: true },
  ]
  return h('div', { className: css.rowWrap },
    h(m.button, { type: 'button', className: css.row, whileHover: { y: -1 }, whileTap: { scale: 0.99 }, disabled: item.status === 'corrupt', onClick: () => onEdit(item.id) },
      h('span', { className: css.rowIcon }, h(IconListPenOutline16, { size: 17 })),
      h('span', { className: css.rowCopy }, h('strong', null, item.name), h('small', null, item.status === 'corrupt' ? '内容无法读取' : item.description || '未填写适用说明')),
      h('span', { className: css.rowMeta }, `${item.characters} 字`)),
    actions.length === 0 ? null : h(Menu, {
      open: menuOpen,
      items: actions,
      align: 'end',
      portal: true,
      compact: true,
      onClose: () => setMenuOpen(false),
      onSelect: action => { setMenuOpen(false); if (action === 'delete') onDelete(item) },
      anchor: h('button', { type: 'button', className: css.moreAction, 'aria-label': `${item.name}的更多操作`, 'aria-expanded': menuOpen, onClick: event => { event.stopPropagation(); setMenuOpen(value => !value) } }, h(IconEllipsisOutline16, { size: 18 })),
    }))
}

function WritingStyleEditor({ draft, onDraft, onBack, onSave, onDelete, saving, disabled = false }) {
  return h('div', { className: css.editor },
    h('div', { className: css.editorNav },
      h('button', { type: 'button', disabled: saving, onClick: onBack }, h(IconChevronLeftOutline14, { size: 14 }), '返回'),
      h('div', { className: css.editorActions },
        onDelete ? h('button', { type: 'button', className: css.deleteEditorAction, disabled: saving, onClick: onDelete }, h(IconTrashOutline16, { size: 14 }), '删除文风') : null,
        h('button', { type: 'button', className: css.primaryButton, disabled: disabled || saving, onClick: onSave }, saving ? '保存中…' : '保存文风'))),
    h('div', { className: css.editorBody },
      h('header', null, h('span', { className: css.editorMark }, h(IconListPenOutline16, { size: 20 })), h('div', null, h('h3', null, draft.id === null ? '创建文风' : '编辑文风'), h('p', null, '保存后，所有使用这项文风的对话都会从下一条回复开始读取最新内容。'))),
      h('label', { className: css.field }, h('span', null, '文风名称'), h('input', { value: draft.name, disabled: disabled || saving, placeholder: '例如：克制的电影感叙事', onChange: event => onDraft(current => ({ ...current, name: event.target.value })) })),
      h('label', { className: css.field }, h('span', null, '适用说明'), h('textarea', { rows: 3, value: draft.description, disabled: disabled || saving, placeholder: '说明适合的题材、场景或氛围', onChange: event => onDraft(current => ({ ...current, description: event.target.value })) })),
      h('label', { className: css.field }, h('span', null, '写作要求'), h('textarea', { rows: 12, value: draft.content, disabled: disabled || saving, placeholder: '描述语言质感、叙事视角、句式节奏、对白方式，以及需要避免的表达', onChange: event => onDraft(current => ({ ...current, content: event.target.value })) }))))
}

function DeleteWritingStyleDialog({ target, pending, error, onCancel, onConfirm }) {
  return h(Modal, {
    open: target !== null,
    onClose: onCancel,
    closeLabel: '关闭删除文风确认',
    title: target === null ? '删除文风' : `删除“${target.name}”？`,
    description: '删除后，这项文风会从资料库中移除。',
    className: css.deleteDialog,
    footer: h(React.Fragment, null,
      h(Button, { variant: 'outline', autoFocus: true, disabled: pending, onClick: onCancel }, '取消'),
      h(Button, { variant: 'outline', className: css.deleteConfirmAction, disabled: pending, onClick: onConfirm }, pending ? '正在删除…' : '删除文风')),
  },
  h('div', { className: css.deleteSummary },
    h('strong', null, '仍在使用它的对话可能无法继续生成回复'),
    h('span', null, '已有消息会保留。需要继续时，可以在会话设置中移除或改选文风。')),
  error === null ? null : h('div', { className: css.deleteError, role: 'alert' }, error))
}

function newWritingStyleDraft() { return { id: null, revision: 0, name: '', description: '', content: '' } }

async function rpc(connection, endpoint, payload) {
  const response = await connection.call('/rp-writing-styles', endpoint, payload)
  const domain = response?.ok === true && response.value?.ok !== undefined ? response.value : response
  if (domain?.ok !== true) throw Object.assign(new Error(domain?.error?.message ?? '请求失败'), { code: domain?.error?.code })
  return domain.value
}
function userMessage(error, action = 'save') { if (error?.code === 'REVISION_CONFLICT') return action === 'delete' ? '这项文风刚刚发生了变化，请关闭确认后重新打开。' : '这项文风已在其他位置更新，请返回列表后重新打开。'; if (error?.code === 'LIMIT_EXCEEDED') return '文风内容太长，请精简后再保存。'; if (action === 'delete') return error?.code === 'ASSET_NOT_FOUND' ? '这项文风已经被删除，请关闭确认后刷新列表。' : '暂时无法删除文风，请稍后重试。'; if (action === 'load') return '暂时无法读取文风，请稍后重试。'; return '暂时无法保存文风，请检查内容后重试。' }
