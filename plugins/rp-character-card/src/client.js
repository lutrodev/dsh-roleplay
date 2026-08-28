import React, { useEffect, useState } from 'react'
import { AnimatePresence, Reorder, m } from 'motion/react'
import { IconChevronLeftOutline14, IconSearchOutline16, Modal } from '@deepseek-ai/dsh-client-ui-primitives'
import { domainValue, normalizedMime, relatedLorebookNames } from './client-state.js'
import { css, ensureStyles } from './client-styles.generated.js'
import { ContentTransition, DirtyBar, IconCharacterCardOutline16, LoadingSpinner, RpMotionProvider } from 'dsh-roleplay-rp-ui'

export const inject = ['slots', 'rpRemote', 'rpAssetEditors']
const h = React.createElement
const MODAL_SCROLL_LOCK = Symbol.for('dsh-roleplay.asset-modal-scroll-lock')

export function apply(ctx) {
  ctx.effect(ensureStyles)
  ctx.effect(() => ctx.rpAssetEditors.register('character', CharacterSessionEditor), 'rp-character-card: canonical session editor')
  ctx.slots.inject('rp-assets.character-entry', () => ctx.slots.register({
    name: 'rp-assets.character-entry', inject: () => ({ connection: ctx.rpRemote }),
  }, CharacterLibraryEntry))
}

function CharacterLibraryEntry({ wide, connection }) {
  const [open, setOpen] = useState(false)
  return h(RpMotionProvider, null,
    h('button', { type: 'button', className: wide ? css.trigger : `${css.trigger} ${css.rail}`, onClick: () => setOpen(true), 'aria-label': '角色卡' },
      h(IconCharacterCardOutline16, { size: wide ? 16 : 18 }), wide ? h('span', null, '角色卡') : null),
    h(CharacterLibrary, { open, onClose: () => setOpen(false), connection }))
}

function CharacterLibrary({ open, onClose, connection }) {
  const [query, setQuery] = useState('')
  const [items, setItems] = useState([])
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const [refresh, setRefresh] = useState(0)
  const [importing, setImporting] = useState(false)
  useModalScrollLock(open)

  useEffect(() => {
    if (!open) { setSelected(null); setDetail(null); setError(null) }
  }, [open])

  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => {
      setStatus('loading'); setError(null)
      void rpc(connection, 'list', { query, limit: 100 }).then(page => {
        setItems(page.items)
        setSelected(current => current === null || page.items.some(item => item.id === current) ? current : null)
        setStatus('ready')
      }).catch(reason => { setError(reason); setStatus('error') })
    }, 160)
    return () => clearTimeout(timer)
  }, [connection, open, query, refresh])

  useEffect(() => {
    if (!open || selected === null) { setDetail(null); return }
    let live = true
    setDetail(null)
    void rpc(connection, 'get', { id: selected }).then(value => { if (live) setDetail(value) }).catch(reason => { if (live) setError(reason) })
    return () => { live = false }
  }, [connection, open, selected])

  const importFiles = async files => {
    if (importing || files.length === 0) return
    setImporting(true)
    setError(null)
    try {
      for (const file of files) {
        if (file.size > 8 * 1024 * 1024) throw Object.assign(new Error('文件超过 8 MiB'), { code: 'LIMIT_EXCEEDED' })
        await rpc(connection, 'import', { name: file.name, mimeType: normalizedMime(file), base64: bytesToBase64(new Uint8Array(await file.arrayBuffer())) })
        setRefresh(value => value + 1)
      }
    } catch (reason) { setError(reason) } finally { setImporting(false) }
  }

  return h(Modal, { open, onClose, title: '角色卡', closeLabel: '关闭角色卡', className: css.dialog, contentClassName: css.content },
    h('div', { className: css.shell, 'aria-busy': importing },
      selected === null ? h('div', { className: css.toolbar },
        h('label', { className: css.search }, h(IconSearchOutline16, { size: 15 }), h('span', { className: css.srOnly }, '搜索角色卡'), h('input', { value: query, onChange: event => setQuery(event.target.value), placeholder: '搜索角色卡' })),
        h('label', { className: css.importButton, 'aria-disabled': importing, 'aria-busy': importing },
          h('span', { className: css.importContent, 'aria-hidden': true }, importing ? h(LoadingSpinner, { size: 13 }) : null, importing ? '导入中…' : '导入 PNG / JSON'),
          h('span', { className: css.srOnly, role: 'status', 'aria-live': 'polite' }, importing ? '正在导入角色卡，请稍候。' : ''),
          h('input', { className: css.fileInput, type: 'file', multiple: true, disabled: importing, accept: '.png,.json,image/png,application/json', 'aria-label': '导入角色卡 PNG 或 JSON', onChange: event => { const files = [...(event.target.files ?? [])]; event.target.value = ''; void importFiles(files) } }))) : h(DetailNavigation, { label: '返回角色卡列表', onBack: () => { setSelected(null); setDetail(null); setError(null) } }),
      error ? h('div', { className: css.error, role: 'alert' }, characterActionErrorMessage(error)) : null,
      h('div', { className: css.view }, h(ContentTransition, { viewKey: selected ?? 'list', className: css.viewTransition },
        selected === null ? h(CharacterList, { items, status, onSelect: setSelected, connection }) : h(CharacterDetail, { detail, connection,
          onChanged: value => { setDetail(value); setRefresh(current => current + 1) },
          onDeleted: () => { setSelected(null); setDetail(null); setRefresh(current => current + 1) },
        })))))
}

function CharacterSessionEditor({ mode, id, libraryOnly = false, connection, disabled, onCancel, onSaved }) {
  const [detail, setDetail] = useState(() => mode === 'create' ? emptyCharacterDetail() : null)
  const [error, setError] = useState(null)
  useEffect(() => {
    if (mode !== 'edit') return
    let live = true
    setDetail(null); setError(null)
    void rpc(connection, 'get', { id })
      .then(value => { if (live) setDetail(value) })
      .catch(reason => { if (live) setError(reason) })
    return () => { live = false }
  }, [connection, id, mode])
  if (detail === null) return h(State, { text: error === null ? '正在加载角色卡…' : characterActionErrorMessage(error) })
  return h(CharacterEditForm, {
    key: `${mode}:${detail.id ?? 'new'}`,
    detail,
    mode,
    libraryOnly,
    connection,
    disabled,
    error,
    onCancel,
    onSaved,
    onError: setError,
  })
}

function DetailNavigation({ label, onBack }) {
  return h('div', { className: css.detailNavigation }, h('button', { type: 'button', className: css.backButton, onClick: onBack }, h(IconChevronLeftOutline14, { size: 16 }), h('span', null, label)))
}

function CharacterList({ items, status, onSelect, connection }) {
  if (status === 'loading' && items.length === 0) return h(State, { text: '正在加载角色卡…' })
  if (status === 'error' && items.length === 0) return h(State, { text: '暂时无法加载角色卡，请稍后重试。' })
  if (items.length === 0) return h(State, { text: '还没有角色卡，可从上方导入 PNG 或 JSON。' })
  return h('div', { className: css.list, role: 'navigation', 'aria-label': '角色卡列表' }, ...items.map(item => h('button', {
    key: item.id, type: 'button', disabled: item.status === 'corrupt', className: css.row, onClick: () => onSelect(item.id),
  }, h(Avatar, { item, connection }), h('span', { className: css.rowText }, h('strong', null, item.name), h('small', null, item.status === 'corrupt' ? '内容无法读取' : `${characterFormatLabel(item.format)} · ${linkedLorebookLabel(item.lorebookEntries)}`)))))
}

function Avatar({ item, connection }) {
  const [source, setSource] = useState(null)
  useEffect(() => {
    setSource(null)
    if (!item.hasAvatar) return
    let live = true
    void rpc(connection, 'avatar', { id: item.id }).then(value => { if (live) setSource(`data:${value.mimeType};base64,${value.base64}`) }).catch(() => {})
    return () => { live = false }
  }, [connection, item.hasAvatar, item.id])
  return source
    ? h('img', { className: css.avatar, src: source, alt: `${item.name}头像` })
    : h('span', { className: `${css.avatar} ${css.avatarFallback}`, 'aria-label': `${item.name}无头像` }, (item.name?.trim()?.[0] ?? '卡').toLocaleUpperCase())
}

function CharacterDetail({ detail, connection, onChanged, onDeleted }) {
  const [editing, setEditing] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleteLinkedLorebooks, setDeleteLinkedLorebooks] = useState(true)
  const [deletePreview, setDeletePreview] = useState({ status: 'idle', sessions: [], lorebooks: [], sessionScanComplete: true })
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState(null)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState(null)
  const [exportNotice, setExportNotice] = useState(null)
  useEffect(() => {
    setEditing(false); setConfirmingDelete(false); setDeleteLinkedLorebooks(true)
    setDeletePreview({ status: 'idle', sessions: [], lorebooks: [], sessionScanComplete: true }); setActionError(null)
    setExporting(false); setExportError(null); setExportNotice(null)
  }, [detail?.id])
  useEffect(() => {
    if (!confirmingDelete || detail === null) return
    let live = true
    setDeletePreview({ status: 'loading', sessions: [], lorebooks: [], sessionScanComplete: true })
    void assetRpc(connection, 'character/delete-preview', { id: detail.id })
      .then(value => { if (live) setDeletePreview({ status: 'ready', sessions: value.sessions, lorebooks: value.lorebooks, sessionScanComplete: value.sessionScanComplete !== false }) })
      .catch(reason => { if (live) { setDeletePreview({ status: 'error', sessions: [], lorebooks: [], sessionScanComplete: false }); setActionError(reason) } })
    return () => { live = false }
  }, [confirmingDelete, connection, detail?.id])
  if (detail === null) return h(State, { text: '正在加载详情…' })
  const character = detail.character ?? {}
  const lorebookNames = relatedLorebookNames(detail)
  const fields = [
    ['角色设定', character.description], ['性格', character.personality], ['场景', character.scenario],
    ['默认开场', character.firstMessage],
    ...((character.alternateGreetings ?? []).map((value, index) => [`备用开场 ${index + 1}`, value])),
    ['消息示例', character.messageExample], ['作者备注', character.creatorNotes],
  ]
  const remove = async () => {
    setSaving(true); setActionError(null)
    try {
      await assetRpc(connection, 'character/delete', { id: detail.id, deleteLinkedLorebooks })
      onDeleted()
    } catch (reason) { setActionError(reason) } finally { setSaving(false) }
  }
  const exportCard = async () => {
    setExporting(true); setExportError(null); setExportNotice(null); setConfirmingDelete(false)
    try {
      const value = await rpc(connection, 'export', { id: detail.id })
      downloadExport(value)
      const lorebookCount = Array.isArray(value.lorebooks) ? value.lorebooks.length : 0
      setExportNotice(lorebookCount > 0
        ? `Character Card V3 PNG 已开始下载，包含 ${lorebookCount} 本关联世界书、${value.lorebookEntries} 条设定。`
        : 'Character Card V3 PNG 已开始下载。')
    } catch (reason) { setExportError(reason) } finally { setExporting(false) }
  }
  if (editing) return h(CharacterEditForm, {
    detail,
    connection,
    error: actionError,
    onCancel: () => { setEditing(false); setActionError(null) },
    onSaved: value => { setEditing(false); onChanged(value) },
    onError: setActionError,
  })
  return h('article', { className: css.detail },
    h('header', null,
      h('div', null, h('h3', null, detail.name), h('p', null, characterFormatLabel(detail.format))),
      h('div', { className: css.headerActions },
        h('span', { className: css.badge }, linkedLorebookLabel(detail.lorebookEntries)),
        h('button', { type: 'button', disabled: exporting || saving, 'aria-label': '导出 Character Card V3 PNG', onClick: () => void exportCard() }, exporting ? '导出中…' : '导出'),
        h('button', { type: 'button', disabled: exporting || saving, onClick: () => { setEditing(true); setConfirmingDelete(false); setActionError(null); setExportError(null); setExportNotice(null) } }, '编辑'),
        h('button', { type: 'button', disabled: exporting || saving, className: css.dangerText, onClick: () => { setConfirmingDelete(true); setDeleteLinkedLorebooks(true); setActionError(null); setExportError(null); setExportNotice(null) } }, '删除'))),
    actionError ? h('div', { className: css.error, role: 'alert' }, characterActionErrorMessage(actionError)) : null,
    exportError ? h('div', { className: css.error, role: 'alert' }, characterExportErrorMessage(exportError)) : null,
    exportNotice ? h('div', { className: css.notice, role: 'status' }, exportNotice) : null,
    confirmingDelete ? h('div', { className: css.deleteConfirm, role: 'alertdialog', 'aria-label': `删除 ${detail.name}` },
      h('div', { className: css.deleteSummary },
        h('strong', null, '确认删除这张角色卡？'),
        h('span', null, deletePreview.status === 'loading'
          ? '删除不会中断或改写相关对话，已有消息会继续保留。'
          : deletePreview.status === 'error'
            ? '暂时无法列出全部关联内容，但仍可删除角色卡；相关对话会自动将它视为已移除。'
          : deletePreview.sessionScanComplete === false
            ? '未能列出全部相关对话，但这不会阻止删除；已有消息会保留，相关对话会自动将它视为已移除。'
          : deletePreview.sessions.length === 0
            ? '没有对话正在使用这张角色卡。删除后仍可重新导入。'
            : `有 ${deletePreview.sessions.length} 个对话正在使用这张角色卡。删除不会改写已有消息；这些对话会自动将它视为已移除，之后也可重新关联其他角色卡。`)),
      h('label', { className: css.deleteOption },
        h('input', { type: 'checkbox', checked: deleteLinkedLorebooks, onChange: event => setDeleteLinkedLorebooks(event.target.checked), disabled: saving }),
        h('span', null, deletePreview.status === 'ready' ? `同时删除相关世界书（${deletePreview.lorebooks.length}）` : '同时删除相关世界书')),
      h('div', { className: css.deleteActions },
        h('button', { type: 'button', onClick: () => setConfirmingDelete(false), disabled: saving }, '取消'),
        h('button', { type: 'button', className: css.dangerButton, onClick: () => void remove(), disabled: saving }, saving ? '删除中…' : '删除角色卡')))
      : null,
    detail.tags?.length ? h('div', { className: css.tags }, ...detail.tags.map(tag => h('span', { key: tag }, tag))) : null,
    h('dl', { className: css.facts },
      character.nickname ? h(React.Fragment, null, h('dt', null, '昵称'), h('dd', null, character.nickname)) : null,
      character.creator ? h(React.Fragment, null, h('dt', null, '作者'), h('dd', null, character.creator)) : null,
      character.characterVersion ? h(React.Fragment, null, h('dt', null, '版本'), h('dd', null, character.characterVersion)) : null),
    ...fields.filter(([, value]) => typeof value === 'string' && value.trim()).map(([label, value]) => h(Section, { key: label, label, value })),
    character.groupOnlyGreetings?.length ? h(Section, { label: '群聊开场（只读）', value: character.groupOnlyGreetings.join('\n\n') }) : null,
    lorebookNames.length ? h(Section, { label: '关联世界书', value: lorebookNames.join('、') }) : null,
    h('section', { className: css.advanced }, h('h4', null, '原始数据（只读）'),
      h('details', null, h('summary', null, '导入信息'), h('pre', null, JSON.stringify(detail.source, null, 2))),
      character.extensions ? h('details', null, h('summary', null, '附加数据'), h('pre', null, JSON.stringify(character.extensions, null, 2))) : null),
    detail.quarantinedPrompts?.length ? h('section', { className: css.quarantine }, h('h4', null, `未启用的提示内容 · ${detail.quarantinedPrompts.length}`), h('p', null, '为了安全，这些内容不会用于生成回复。'), ...detail.quarantinedPrompts.map(item => h('details', { key: item.path }, h('summary', null, '查看原文'), h('pre', null, String(item.value))))) : null)
}

function CharacterEditForm({ detail, mode = 'edit', libraryOnly = false, connection, disabled = false, error, onCancel, onSaved, onError }) {
  const creating = mode === 'create'
  const [original] = useState(() => editableValues(detail))
  const [form, setForm] = useState(() => cloneForm(original))
  const [saving, setSaving] = useState(false)
  const character = detail.character ?? {}
  const lorebookNames = relatedLorebookNames(detail)
  const save = async () => {
    setSaving(true); onError(null)
    try {
      const patch = { ...form, alternateGreetings: form.alternateGreetings.map(item => item.value), tags: form.tags.split(/[,，]/).map(value => value.trim()).filter(Boolean) }
      const value = await rpc(connection, creating ? 'create' : 'update', creating
        ? { character: patch }
        : { id: detail.id, expectedRevision: detail.revision, patch })
      await onSaved(value)
    } catch (reason) { onError(reason) } finally { setSaving(false) }
  }
  const dirty = JSON.stringify(form) !== JSON.stringify(original)
  const addGreeting = () => setForm(current => ({ ...current, alternateGreetings: [...current.alternateGreetings, { id: crypto.randomUUID(), value: '' }] }))
  const removeGreeting = index => setForm(current => ({ ...current, alternateGreetings: current.alternateGreetings.filter((_, itemIndex) => itemIndex !== index) }))
  const updateField = key => event => setForm(current => ({ ...current, [key]: event.target.value }))
  return h('form', { className: `${css.detail} ${css.detailEditing}`, onSubmit: event => { event.preventDefault(); void save() } },
    h('header', null,
      h('div', null,
        h('input', { className: css.titleInput, value: form.name, required: true, disabled: disabled || saving, 'aria-label': '角色卡名称', onChange: updateField('name') }),
        h('p', null, creating ? libraryOnly ? '创建后保存到资料库，不替换当前故事角色' : '创建后用于当前对话' : characterFormatLabel(detail.format))),
      h('div', { className: css.headerActions },
        creating ? null : h('span', { className: css.badge }, linkedLorebookLabel(detail.lorebookEntries)),
        h('button', { type: 'button', onClick: onCancel, disabled: saving }, '取消'),
        h('button', { type: 'submit', className: css.primaryButton, disabled: disabled || saving || !dirty || form.name.trim().length === 0 }, saving ? '保存中…' : creating ? libraryOnly ? '创建角色卡' : '创建并使用' : '保存修改'))),
    error ? h('div', { className: css.error, role: 'alert' }, characterActionErrorMessage(error)) : null,
    h('label', { className: css.tagEditor }, h('span', null, '标签'), h('input', { value: form.tags, disabled: disabled || saving, placeholder: '用逗号分隔多个标签', onChange: updateField('tags') })),
    h('dl', { className: css.facts },
      character.nickname ? h(React.Fragment, null, h('dt', null, '昵称'), h('dd', null, character.nickname)) : null,
      character.creator ? h(React.Fragment, null, h('dt', null, '作者'), h('dd', null, character.creator)) : null,
      character.characterVersion ? h(React.Fragment, null, h('dt', null, '版本'), h('dd', null, character.characterVersion)) : null),
    h(SectionEditor, { label: '角色设定', value: form.description, rows: 6, disabled: disabled || saving, onChange: updateField('description') }),
    h(SectionEditor, { label: '性格', value: form.personality, rows: 4, disabled: disabled || saving, onChange: updateField('personality') }),
    h(SectionEditor, { label: '场景', value: form.scenario, rows: 5, disabled: disabled || saving, onChange: updateField('scenario') }),
    h(SectionEditor, { label: '默认开场', value: form.firstMessage, rows: 7, disabled: disabled || saving, onChange: updateField('firstMessage') }),
    h('section', { className: css.openingEditor },
      h('div', { className: css.sectionEditorHeader },
        h('span', null, h('h4', null, '备用开场'), h('small', null, '拖动可以排序；保存后可在故事开始时选择。')),
        h('button', { type: 'button', className: css.inlineButton, disabled: disabled || saving, onClick: addGreeting }, '新增开场')),
      form.alternateGreetings.length === 0 ? h('p', { className: css.emptyHint }, '还没有备用开场。') : null,
      h(Reorder.Group, { className: css.greetingList, axis: 'y', values: form.alternateGreetings, onReorder: alternateGreetings => setForm(current => ({ ...current, alternateGreetings })) },
        h(AnimatePresence, { initial: false }, ...form.alternateGreetings.map((greeting, index) => h(Reorder.Item, {
          className: css.greetingItem, key: greeting.id, value: greeting, layout: true,
        },
        h('span', { className: css.dragHandle, 'aria-hidden': true }, '⠿'),
        h('label', null, h('span', null, `备用开场 ${index + 1}`), h('textarea', { value: greeting.value, rows: 5, disabled: disabled || saving, onChange: event => setForm(current => ({ ...current, alternateGreetings: current.alternateGreetings.map((value, itemIndex) => itemIndex === index ? { ...value, value: event.target.value } : value) })) })),
        h(m.button, { type: 'button', className: css.inlineButton, disabled: disabled || saving, onClick: () => removeGreeting(index), exit: { opacity: 0 } }, '删除')))))),
    h(SectionEditor, { label: '消息示例', value: form.messageExample, rows: 5, disabled: disabled || saving, onChange: updateField('messageExample') }),
    h(SectionEditor, { label: '作者备注', value: form.creatorNotes, rows: 4, disabled: disabled || saving, onChange: updateField('creatorNotes') }),
    character.groupOnlyGreetings?.length ? h(Section, { label: '群聊开场（只读）', value: character.groupOnlyGreetings.join('\n\n') }) : null,
    lorebookNames.length ? h(Section, { label: '关联世界书', value: lorebookNames.join('、') }) : null,
    !creating ? h('section', { className: css.advanced }, h('h4', null, '原始数据（只读）'),
      h('details', null, h('summary', null, '导入信息'), h('pre', null, JSON.stringify(detail.source, null, 2))),
      character.extensions ? h('details', null, h('summary', null, '附加数据'), h('pre', null, JSON.stringify(character.extensions, null, 2))) : null) : null,
    detail.quarantinedPrompts?.length ? h('section', { className: css.quarantine }, h('h4', null, `未启用的提示内容 · ${detail.quarantinedPrompts.length}`), h('p', null, '为了安全，这些内容不会用于生成回复。'), ...detail.quarantinedPrompts.map(item => h('details', { key: item.path }, h('summary', null, '查看原文'), h('pre', null, String(item.value))))) : null,
    h(DirtyBar, { dirty, saving, disabled, message: creating ? '新角色卡尚未创建' : '角色卡修改尚未保存', onDiscard: () => { setForm(cloneForm(original)); onError(null) }, onSave: () => void save(), saveLabel: creating ? libraryOnly ? '创建角色卡' : '创建并使用' : '保存修改' }))
}

function emptyCharacterDetail() {
  return {
    id: null,
    revision: 0,
    name: '',
    format: 'native',
    lorebookEntries: 0,
    tags: [],
    source: { kind: 'created' },
    quarantinedPrompts: [],
    character: {
      description: '', personality: '', scenario: '', firstMessage: '', messageExample: '',
      alternateGreetings: [], creatorNotes: '',
    },
  }
}

function editableValues(detail) {
  const character = detail.character ?? {}
  return { name: detail.name ?? '', description: character.description ?? '', personality: character.personality ?? '', scenario: character.scenario ?? '', firstMessage: character.firstMessage ?? '', messageExample: character.messageExample ?? '', alternateGreetings: (character.alternateGreetings ?? []).map(value => ({ id: crypto.randomUUID(), value })), creatorNotes: character.creatorNotes ?? '', tags: Array.isArray(detail.tags) ? detail.tags.join(', ') : '' }
}
function cloneForm(value) { return { ...value, alternateGreetings: value.alternateGreetings.map(item => ({ ...item })) } }

function characterActionErrorMessage(reason) {
  const code = reason?.code
  if (code === 'ASSET_CORRUPT') return '暂时无法读取这张角色卡的必要信息，角色卡没有删除。请返回列表刷新后重试。'
  if (code === 'ASSET_NOT_FOUND') return '这张角色卡已不存在，请返回列表后刷新。'
  if (code === 'REVISION_CONFLICT') return '相关对话的资料刚刚发生变化，角色卡没有删除。请重试。'
  if (code === 'LIMIT_EXCEEDED') return '文件太大，请选择不超过 8 MiB 的文件。'
  if (code === 'DUPLICATE_CARD' || code === 'DUPLICATE_ASSET') return '这张角色卡已经导入过了。'
  if (code === 'UNSUPPORTED_FORMAT') return '请选择 PNG 或 JSON 格式的角色卡文件。'
  if (code === 'INVALID_CHARACTER_DATA' || code === 'INVALID_PNG' || code === 'INVALID_PNG_TEXT' || code === 'INVALID_REQUEST') return '无法识别这张角色卡，请检查文件后再试。'
  return '暂时无法更新角色卡，请稍后再试。'
}

function characterExportErrorMessage(reason) {
  const code = reason?.code
  if (code === 'ASSET_SERVICE_UNAVAILABLE') return '关联世界书暂时不可用，未生成文件。请确认世界书功能已启用后重试。'
  if (code === 'ASSET_NOT_FOUND') return '这张角色卡已不存在，未生成文件。请返回列表后刷新。'
  if (code === 'ASSET_CORRUPT') return '暂时无法读取角色卡或关联世界书，未生成文件。请检查资料后重试。'
  if (code === 'LIMIT_EXCEEDED') return '角色卡与关联世界书内容过大，未生成文件。'
  return '暂时无法导出角色卡，未生成文件。请稍后再试。'
}

function characterFormatLabel() { return '角色卡' }
function linkedLorebookLabel(entries) { return entries > 0 ? `关联世界书 · ${entries} 条设定` : '未关联世界书' }

function Section({ label, value }) { return h('section', { className: css.section }, h('h4', null, label), h('p', null, value)) }
function SectionEditor({ label, value, rows, disabled = false, onChange }) { return h('label', { className: css.sectionEditor }, h('span', null, label), h('textarea', { value, rows, disabled, onChange })) }
function State({ text }) { return h('div', { className: css.state }, text) }
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
async function rpc(connection, endpoint, payload) { return domainValue(await connection.call('/rp-character-cards', endpoint, payload)) }
async function assetRpc(connection, endpoint, payload) { return domainValue(await connection.call('/rp-assets', endpoint, payload)) }
function bytesToBase64(bytes) { let binary = ''; for (let offset = 0; offset < bytes.length; offset += 0x8000) binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000)); return btoa(binary) }
function downloadExport(value) {
  if (value?.mimeType !== 'image/png' || typeof value.fileName !== 'string' || !value.fileName.toLocaleLowerCase().endsWith('.png')
    || value.fileName.includes('/') || value.fileName.includes('\\') || typeof value.base64 !== 'string'
    || value.base64.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(value.base64)) {
    throw Object.assign(new Error('export response is invalid'), { code: 'INVALID_EXPORT' })
  }
  const binary = atob(value.base64)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  const url = URL.createObjectURL(new Blob([bytes], { type: value.mimeType }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = value.fileName
  anchor.hidden = true
  document.body.append(anchor)
  try {
    anchor.click()
  } catch (error) {
    URL.revokeObjectURL(url)
    throw error
  } finally {
    anchor.remove()
  }
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
