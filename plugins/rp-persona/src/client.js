import React, { useEffect, useRef, useState } from 'react'
import { Button, IconChevronLeftOutline14, IconEditOutline16, IconEllipsisOutline16, IconPlusOutline16, IconTrashOutline16, IconUserOutline16, Menu, Modal } from '@deepseek-ai/dsh-client-ui-primitives'
import { domAnimation, LazyMotion, m, MotionConfig } from 'motion/react'
import { domainValue } from './client-state.js'
import { css, ensureStyles } from './client-styles.generated.js'

export const inject = ['slots', 'connection', 'rpAssetEditors']
const h = React.createElement
const MODAL_SCROLL_LOCK = Symbol.for('dsh-roleplay.asset-modal-scroll-lock')
const QUICK_DESCRIPTION_LABELS = ['性别', '外貌', '年龄', '身份', '说话方式', '背景故事', '爱好']
const DESCRIPTION_LIMIT = 4000

export function apply(ctx) {
  ctx.effect(ensureStyles)
  ctx.effect(() => ctx.rpAssetEditors.register('persona', PersonaSessionEditor), 'rp-persona: canonical session editor')
  ctx.slots.inject('rp-assets.persona-entry', () => ctx.slots.register({ name: 'rp-assets.persona-entry', inject: () => ({ connection: ctx.connection }) }, PersonaLibraryEntry))
}

function PersonaLibraryEntry({ wide, connection }) {
  const [open, setOpen] = useState(false)
  return h(MotionConfig, { reducedMotion: 'user', transition: { duration: 0.18, ease: 'easeOut' } }, h(LazyMotion, { features: domAnimation, strict: true }, h(React.Fragment, null,
    h('button', {
      type: 'button',
      className: wide ? css.trigger : `${css.trigger} ${css.rail}`,
      style: wide ? { width: 'calc(100% + 8px)', margin: '4px -4px 4px', padding: '6px 2px 6px 10px', borderRadius: 12 } : { margin: '8px 0 10px' },
      onClick: () => setOpen(true),
      'aria-label': '我的人设',
      title: wide ? undefined : '我的人设',
    }, h(IconUserOutline16, { size: wide ? 16 : 18 }), wide ? h('span', { className: css.triggerLabel }, '我的人设') : null),
    h(PersonaLibrary, { open, onClose: () => setOpen(false), connection }))))
}

function PersonaLibrary({ open, onClose, connection }) {
  const [items, setItems] = useState([])
  const [view, setView] = useState('list')
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const [limits, setLimits] = useState(null)
  const [refresh, setRefresh] = useState(0)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  useModalScrollLock(open)

  useEffect(() => {
    if (!open) { setView('list'); setSelected(null); setDetail(null); setError(null) }
  }, [open])

  useEffect(() => {
    if (!open) return
    let live = true
    setStatus('loading')
    setError(null)
    void rpc(connection, 'list', { limit: 100 }).then(page => {
      if (!live) return
      setItems(page.items)
      setLimits(page.limits ?? null)
      setSelected(current => current === null || page.items.some(item => item.id === current) ? current : null)
      setStatus('ready')
    }).catch(reason => { if (live) { setError(reason); setStatus('error') } })
    return () => { live = false }
  }, [connection, open, refresh])

  useEffect(() => {
    if (!open || view !== 'edit' || selected === null) { setDetail(null); return }
    let live = true
    setDetail(null)
    void rpc(connection, 'get', { id: selected }).then(value => { if (live) setDetail(value) }).catch(reason => { if (live) setError(reason) })
    return () => { live = false }
  }, [connection, open, selected, view, refresh])

  const showList = () => { setView('list'); setSelected(null); setDetail(null); setError(null) }
  const showEdit = id => { setSelected(id); setView('edit'); setError(null) }
  const saved = value => {
    const item = value.updated ?? value.created
    setItems(current => [...current.filter(currentItem => currentItem.id !== item.id), item].sort(compareItems))
    showList()
    setRefresh(current => current + 1)
  }
  const setDefault = async id => {
    setError(null)
    try {
      const value = await rpc(connection, 'set-default', { id })
      setItems(current => current.map(item => ({ ...item, isDefault: item.id === id })))
      if (selected === id) setDetail(value)
    } catch (reason) { setError(reason) }
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
      setDeleteTarget(null); showList(); setRefresh(current => current + 1)
    } catch (reason) { setDeleteError(personaErrorMessage(reason, 'delete')) } finally { setDeleting(false) }
  }

  const navigation = view === 'list' ? null : h(DetailNavigation, { label: '返回我的人设列表', onBack: showList, onDelete: view === 'edit' && detail !== null ? () => requestDelete(detail) : undefined })
  const compact = view === 'list' && items.length > 0
  return h(React.Fragment, null,
    h(Modal, { open, onClose: deleteTarget === null ? onClose : () => {}, title: '我的人设', closeLabel: '关闭我的人设', className: compact ? `${css.dialog} ${css.compactDialog}` : css.dialog, contentClassName: css.content },
      h('div', { className: css.shell },
        navigation,
        error ? h('div', { className: css.error, role: 'alert' }, personaErrorMessage(error)) : null,
        h('div', { className: css.view },
          view === 'list' ? h(PersonaList, { items, status, connection, onSelect: showEdit, onCreate: () => { setView('create'); setError(null) }, onSetDefault: setDefault, onDelete: requestDelete })
            : view === 'create' ? h(PersonaForm, { key: 'create', detail: null, connection, limits, onSaved: saved, onCancel: showList })
              : detail === null ? h(State, { text: '正在加载人设…' }) : h(PersonaForm, { key: detail.id, detail, connection, limits, onSaved: saved, onCancel: showList })))),
    h(DeletePersonaDialog, { target: deleteTarget, pending: deleting, error: deleteError, onCancel: closeDelete, onConfirm: () => void remove() }))
}

function PersonaSessionEditor({ mode, id, connection, disabled, onCancel, onSaved }) {
  const [state, setState] = useState({ loading: true, detail: null, limits: null, error: null })
  useEffect(() => {
    let live = true
    setState(current => ({ ...current, loading: true, error: null }))
    void Promise.all([
      rpc(connection, 'list', { limit: 1 }),
      mode === 'edit' ? rpc(connection, 'get', { id }) : Promise.resolve(null),
    ]).then(([page, detail]) => {
      if (live) setState({ loading: false, detail, limits: page.limits ?? null, error: null })
    }).catch(error => { if (live) setState({ loading: false, detail: null, limits: null, error }) })
    return () => { live = false }
  }, [connection, id, mode])
  if (state.loading) return h(State, { text: '正在准备我的人设编辑器…' })
  if (state.error !== null) return h('div', { className: css.state }, personaErrorMessage(state.error), h('button', { type: 'button', onClick: onCancel }, '返回'))
  return h(PersonaForm, {
    key: `${mode}:${state.detail?.id ?? 'new'}`,
    detail: state.detail,
    connection,
    limits: state.limits,
    disabled,
    onSaved,
    onCancel,
  })
}

function DetailNavigation({ label, onBack, onDelete }) {
  return h('div', { className: css.detailNavigation },
    h('button', { type: 'button', className: css.backButton, onClick: onBack }, h(IconChevronLeftOutline14, { size: 16 }), h('span', null, label)),
    onDelete === undefined ? null : h('button', { type: 'button', className: css.deleteEditorAction, onClick: onDelete }, h(IconTrashOutline16, { size: 14 }), '删除人设'))
}

function PersonaList({ items, status, connection, onSelect, onCreate, onSetDefault, onDelete }) {
  if (status === 'loading' && items.length === 0) return h(State, { text: '正在加载人设…' })
  if (status === 'error' && items.length === 0) return h(State, { text: '暂时无法加载人设，请稍后重试。' })
  if (items.length === 0) {
    return h('div', { className: css.empty }, h('div', { className: css.emptyAvatar }, h(IconUserOutline16, { size: 24 })), h('h3', null, '创建你的第一个人设'), h('p', null, '描述你在故事中的身份。创建后，它会自动成为默认人设。'), h('button', { type: 'button', className: css.primaryButton, onClick: onCreate }, h(IconPlusOutline16, { size: 16 }), '新建人设'))
  }
  return h('div', { className: css.list, role: 'navigation', 'aria-label': '我的人设列表' },
    h('div', { className: css.listToolbar }, h('span', null, `${items.length} 个人设`), h(m.button, { type: 'button', className: css.createRow, whileTap: { scale: 0.98 }, onClick: onCreate }, h(IconPlusOutline16, { size: 16 }), h('span', null, '新建人设'))),
    ...items.map(item => h(PersonaRow, { key: item.id, item, connection, onSelect, onSetDefault, onDelete })))
}

function PersonaRow({ item, connection, onSelect, onSetDefault, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const actions = item.status === 'corrupt' ? [] : [
    ...(item.isDefault ? [] : [{ id: 'set-default', label: '设为默认' }]),
    { id: 'delete', label: '删除人设', danger: true },
  ]
  return h('div', { className: css.rowWrap, 'data-default': item.isDefault ? 'true' : undefined },
    h(m.button, { type: 'button', disabled: item.status === 'corrupt', className: css.row, whileHover: { y: -1 }, whileTap: { scale: 0.99 }, onClick: () => onSelect(item.id) },
      h(PersonaAvatar, { connection, persona: item, className: css.avatar }),
      h('span', { className: css.rowText }, h('span', { className: css.nameLine }, h('strong', null, item.name), item.isDefault ? h('span', { className: css.defaultBadge }, '默认') : null), h('small', null, item.status === 'corrupt' ? '内容无法读取' : item.description || '尚未填写描述'))),
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

function DeletePersonaDialog({ target, pending, error, onCancel, onConfirm }) {
  return h(Modal, {
    open: target !== null,
    onClose: onCancel,
    closeLabel: '关闭删除人设确认',
    title: target === null ? '删除人设' : `删除“${target.name}”？`,
    description: '删除后，这个人设会从资料库中移除。',
    className: css.deleteDialog,
    footer: h(React.Fragment, null,
      h(Button, { variant: 'outline', autoFocus: true, disabled: pending, onClick: onCancel }, '取消'),
      h(Button, { variant: 'outline', className: css.deleteConfirmAction, disabled: pending, onClick: onConfirm }, pending ? '正在删除…' : '删除人设')),
  },
  h('div', { className: css.deleteSummary },
    h('strong', null, '仍在使用它的对话可能无法继续生成回复'),
    h('span', null, '已有消息会保留。需要继续时，可以在会话设置中改选其他人设。'),
    target?.isDefault ? h('span', null, '它是当前默认人设；如果还有其他人设，会自动改用其中一个。') : null),
  error === null ? null : h('div', { className: css.deleteError, role: 'alert' }, error))
}

function PersonaForm({ detail, connection, limits, disabled = false, onSaved, onCancel }) {
  const editing = detail !== null
  const [name, setName] = useState(detail?.name ?? '')
  const [description, setDescription] = useState(detail?.description ?? '')
  const [avatar, setAvatar] = useState(null)
  const [makeDefault, setMakeDefault] = useState(detail?.isDefault ?? false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const avatarInput = useRef(null)
  const descriptionInput = useRef(null)

  useEffect(() => () => { if (avatar?.preview) URL.revokeObjectURL(avatar.preview) }, [avatar])

  const chooseAvatar = event => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file === undefined) return
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) { setError({ code: 'UNSUPPORTED_FORMAT' }); return }
    if (limits?.maxAvatarInputBytes && file.size > limits.maxAvatarInputBytes) { setError({ code: 'AVATAR_TOO_LARGE', maxBytes: limits.maxAvatarInputBytes }); return }
    setError(null)
    setAvatar({ file, preview: URL.createObjectURL(file) })
  }

  const insertDescriptionLabel = label => {
    const textarea = descriptionInput.current
    const start = textarea?.selectionStart ?? description.length
    const end = textarea?.selectionEnd ?? start
    const prefix = start > 0 && description[start - 1] !== '\n' ? '\n' : ''
    const insertion = `${prefix}${label}：\n`
    const next = `${description.slice(0, start)}${insertion}${description.slice(end)}`
    if ([...next].length > DESCRIPTION_LIMIT) { setError({ code: 'DESCRIPTION_TOO_LONG' }); return }
    setDescription(next)
    setError(null)
    requestAnimationFrame(() => {
      const caret = start + insertion.length
      descriptionInput.current?.focus()
      descriptionInput.current?.setSelectionRange(caret, caret)
    })
  }

  const submit = async event => {
    event.preventDefault()
    if (disabled) return
    setSaving(true)
    setError(null)
    try {
      const persona = editing
        ? { name, description, personality: detail.personality, scenario: detail.scenario, firstMessage: detail.firstMessage, tags: detail.tags }
        : { name, description }
      const payload = editing ? { id: detail.id, expectedRevision: detail.revision, persona } : { persona, makeDefault }
      if (avatar !== null) payload.avatar = { name: avatar.file.name, mimeType: avatar.file.type, base64: await fileToBase64(avatar.file) }
      const value = await rpc(connection, editing ? 'update' : 'create', payload)
      if (editing && makeDefault && !detail.isDefault) await rpc(connection, 'set-default', { id: detail.id })
      await onSaved(value)
    } catch (reason) { setError(reason); setSaving(false) }
  }

  return h('form', { className: css.personaForm, onSubmit: submit },
    h('header', null,
      h(m.button, { type: 'button', className: css.avatarPicker, disabled: disabled || saving, whileHover: { y: -2 }, whileTap: { scale: 0.97 }, onClick: () => avatarInput.current?.click(), 'aria-label': avatar === null ? '上传人设头像' : '更换人设头像', title: avatar === null ? '上传头像' : '更换头像' },
        avatar === null ? (editing ? h(PersonaAvatar, { connection, persona: detail, className: css.formAvatar }) : h('span', { className: css.formAvatar }, initialOf(name))) : h('img', { className: css.avatarPreview, src: avatar.preview, alt: '' }),
        h('span', { className: css.avatarEditBadge, 'aria-hidden': true }, h(IconEditOutline16, { size: 12 }))),
      h('input', { ref: avatarInput, className: css.fileInput, type: 'file', accept: 'image/png,image/jpeg,image/webp', tabIndex: -1, 'aria-hidden': true, disabled: disabled || saving, onChange: chooseAvatar }),
      h('div', null, h('h3', null, editing ? '编辑人设' : '新建人设'), h('p', null, editing ? '修改会从下一条回复开始应用。点击头像可以更换。' : '创建后，可以在故事中选择使用。点击头像可上传或更换。'))),
    error ? h('div', { className: css.formError, role: 'alert' }, personaErrorMessage(error)) : null,
    h('label', { className: css.field }, h('span', null, '名称'), h('input', { value: name, required: true, maxLength: 80, autoFocus: true, placeholder: '例如：林澈', disabled: disabled || saving, onChange: event => setName(event.target.value) })),
    h('label', { className: css.field }, h('span', null, '描述（可选）'), h('textarea', { ref: descriptionInput, value: description, maxLength: DESCRIPTION_LIMIT, rows: 6, placeholder: '写下你的身份、经历、性格或希望如何参与故事。', disabled: disabled || saving, onChange: event => setDescription(event.target.value) })),
    h('div', { className: css.quickInputs, 'aria-label': '描述快捷项' }, h('span', null, '快捷添加'), h('div', null, ...QUICK_DESCRIPTION_LABELS.map(label => h(m.button, { key: label, type: 'button', disabled: disabled || saving, whileHover: { y: -1 }, whileTap: { scale: 0.97 }, onClick: () => insertDescriptionLabel(label) }, label)))),
    h('label', { className: css.defaultOption }, h('span', null, h('strong', null, editing && detail.isDefault ? '当前默认人设' : '设为默认人设'), h('small', null, editing && detail.isDefault ? '用户消息旁正在使用这个人设的头像。' : '用户消息旁会使用这个人设的头像。')), h('input', { type: 'checkbox', checked: makeDefault, disabled: disabled || saving || (editing && detail.isDefault), onChange: event => setMakeDefault(event.target.checked) })),
    h('div', { className: css.formActions }, h('button', { type: 'button', className: css.secondaryButton, disabled: saving, onClick: onCancel }, '取消'), h('button', { type: 'submit', className: css.primaryButton, disabled: disabled || saving || name.trim().length === 0 }, saving ? '保存中…' : editing ? '保存修改' : '创建人设')))
}

function State({ text }) { return h('div', { className: css.state }, text) }
function initialOf(name) { return name?.trim()?.[0]?.toLocaleUpperCase() ?? '我' }
function compareItems(left, right) { return left.name.localeCompare(right.name, undefined, { sensitivity: 'base' }) || left.id.localeCompare(right.id) }
function PersonaAvatar({ connection, persona, className }) {
  const [source, setSource] = useState(null)
  useEffect(() => {
    if (!persona?.hasAvatar) { setSource(null); return }
    let live = true
    void rpc(connection, 'avatar', { id: persona.id }).then(value => { if (live) setSource(`data:${value.mimeType};base64,${value.base64}`) }).catch(() => { if (live) setSource(null) })
    return () => { live = false }
  }, [connection, persona?.hasAvatar, persona?.id])
  return h('span', { className, 'aria-hidden': true }, source === null ? initialOf(persona?.name) : h('img', { src: source, alt: '' }))
}
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject({ code: 'INVALID_IMAGE' })
    reader.onload = () => resolve(String(reader.result).slice(String(reader.result).indexOf(',') + 1))
    reader.readAsDataURL(file)
  })
}
function personaErrorMessage(reason, action = 'save') {
  const code = reason?.code
  if (code === 'ASSET_NOT_FOUND') return action === 'delete' ? '这个人设已经被删除，请关闭确认后刷新列表。' : '这个人设已不存在，请返回列表后刷新。'
  if (code === 'ASSET_CORRUPT') return '这个人设的内容无法读取。'
  if (code === 'REVISION_CONFLICT') return action === 'delete' ? '这个人设刚刚发生了变化，请关闭确认后重新打开。' : '这个人设刚刚发生了变化，请刷新后再试。'
  if (code === 'UNSUPPORTED_FORMAT') return '头像仅支持 PNG、JPEG 或 WebP 格式。'
  if (code === 'INVALID_IMAGE') return '无法读取这张图片，请选择有效的 PNG、JPEG 或 WebP 图片。'
  if (code === 'AVATAR_TOO_LARGE') return `头像不能超过 ${formatBytes(reason.maxBytes)}。`
  if (code === 'DESCRIPTION_TOO_LONG') return `描述不能超过 ${DESCRIPTION_LIMIT} 个字。`
  if (code === 'LIMIT_EXCEEDED' || code === 'PROFILE_TOO_LARGE') return '头像或人设内容超过限制，请缩小头像或缩短描述后再试。'
  if (code === 'INVALID_REQUEST') return '请检查人设名称和描述后再试。'
  return action === 'delete' ? '暂时无法删除人设，请稍后重试。' : '暂时无法保存人设，请稍后再试。'
}
function formatBytes(value) { return value >= 1048576 ? `${Math.floor(value / 1048576)} MB` : `${Math.floor(value / 1024)} KB` }
function useModalScrollLock(open) {
  useEffect(() => {
    if (!open) return
    let state = globalThis[MODAL_SCROLL_LOCK]
    if (state === undefined) {
      const root = document.documentElement
      const body = document.body
      state = { count: 0, root, body, rootOverflow: root.style.overflow, bodyOverflow: body.style.overflow, bodyOverscroll: body.style.overscrollBehavior }
      globalThis[MODAL_SCROLL_LOCK] = state
      root.style.overflow = 'hidden'
      body.style.overflow = 'hidden'
      body.style.overscrollBehavior = 'none'
    }
    state.count += 1
    return () => {
      state.count -= 1
      if (state.count !== 0) return
      state.root.style.overflow = state.rootOverflow
      state.body.style.overflow = state.bodyOverflow
      state.body.style.overscrollBehavior = state.bodyOverscroll
      delete globalThis[MODAL_SCROLL_LOCK]
    }
  }, [open])
}
async function rpc(connection, endpoint, payload) { return domainValue(await connection.rpc.call('/rp-personas', endpoint, payload)) }
