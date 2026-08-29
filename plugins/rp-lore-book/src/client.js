import React, { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, Reorder, useDragControls } from 'motion/react'
import { IconBrowseOutline16, IconChevronLeftOutline14, IconEditOutline16, IconEllipsisOutline16, IconPlusOutline16, IconSearchOutline16, Menu, Modal } from '@deepseek-ai/dsh-client-ui-primitives'
import { domainValue } from './client-state.js'
import { CONDITION_OPERATORS, commonStateConditionIssue, parseCommonStateCondition, serializeCommonStateCondition } from './client-condition.js'
import { css, ensureStyles } from './client-styles.generated.js'
import { ContentTransition, DirtyBar, Inspector, LoadingSpinner, RpMotionProvider } from 'dsh-roleplay-rp-ui'

export const inject = ['slots', 'rpRemote', 'rpAssetEditors']
const h = React.createElement
const MODAL_SCROLL_LOCK = Symbol.for('dsh-roleplay.asset-modal-scroll-lock')
const LEVELS = [
  { id: 'worldDescription', label: '世界设定', short: '世界' },
  { id: 'roleplayGuide', label: '扮演指导', short: '指导' },
  { id: 'importantRules', label: '重要规则', short: '规则' },
]

export function apply(ctx) {
  ctx.effect(ensureStyles)
  ctx.effect(() => ctx.rpAssetEditors.register('lorebook', LoreSessionEditor), 'rp-lore-book: canonical session editor')
  ctx.slots.inject('rp-assets.lore-entry', () => ctx.slots.register({ name: 'rp-assets.lore-entry', inject: () => ({ connection: ctx.rpRemote }) }, LoreLibraryEntry))
}

function LoreLibraryEntry({ wide, connection }) {
  const [open, setOpen] = useState(false)
  return h(RpMotionProvider, null,
    h('button', { type: 'button', className: wide ? css.trigger : `${css.trigger} ${css.rail}`, onClick: () => setOpen(true), 'aria-label': '世界书' }, h(IconBrowseOutline16, { size: wide ? 16 : 18 }), wide ? h('span', null, '世界书') : null),
    h(LoreLibrary, { open, onClose: () => setOpen(false), connection }))
}

function LoreLibrary({ open, onClose, connection }) {
  const [query, setQuery] = useState('')
  const [items, setItems] = useState([])
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const [refresh, setRefresh] = useState(0)
  const [detailDirty, setDetailDirty] = useState(false)
  const [importing, setImporting] = useState(false)
  useModalScrollLock(open)
  useEffect(() => {
    if (!open) { setSelected(null); setDetail(null); setError(null); setDetailDirty(false) }
  }, [open])
  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => {
      setStatus('loading'); setError(null)
      void rpc(connection, 'list', { query, limit: 100 }).then(page => {
        setItems(page.items); setSelected(current => current === null || page.items.some(item => item.id === current) ? current : null); setStatus('ready')
      }).catch(reason => { setError(reason); setStatus('error') })
    }, 160)
    return () => clearTimeout(timer)
  }, [connection, open, query, refresh])
  useEffect(() => {
    if (!open || selected === null) { setDetail(null); return }
    let live = true; setDetail(null)
    void rpc(connection, 'get', { id: selected }).then(value => { if (live) setDetail(value) }).catch(reason => { if (live) setError(reason) })
    return () => { live = false }
  }, [connection, open, selected])
  const importFiles = async files => {
    if (importing || files.length === 0) return
    setImporting(true)
    setError(null)
    let lastImportedId = null
    try {
      for (const file of files) {
        if (file.size > 2 * 1024 * 1024) throw Object.assign(new Error('文件超过 2 MiB'), { code: 'LIMIT_EXCEEDED' })
        const value = await rpc(connection, 'import', { name: file.name, mimeType: 'application/json', base64: bytesToBase64(new Uint8Array(await file.arrayBuffer())) })
        lastImportedId = value.imported.id; setRefresh(value => value + 1)
      }
    } catch (reason) { setError(reason) } finally {
      setImporting(false)
      if (lastImportedId !== null) setSelected(lastImportedId)
    }
  }
  const guardedClose = () => { if (!detailDirty || window.confirm('修改还没有保存，要放弃这些修改吗？')) onClose() }
  const back = () => {
    if (detailDirty && !window.confirm('修改还没有保存，要放弃并返回列表吗？')) return
    setDetailDirty(false); setSelected(null); setDetail(null); setError(null)
  }
  return h(Modal, { open, onClose: guardedClose, title: '世界书', closeLabel: '关闭世界书', className: css.dialog, contentClassName: css.content },
    h('div', { className: css.shell, 'aria-busy': importing },
      selected === null ? h('div', { className: css.toolbar }, h('label', { className: css.search }, h(IconSearchOutline16, { size: 15 }), h('span', { className: css.srOnly }, '搜索世界书'), h('input', { value: query, onChange: event => setQuery(event.target.value), placeholder: '搜索世界书' })), h('label', { className: css.importButton, 'aria-disabled': importing, 'aria-busy': importing }, h('span', { className: css.importContent, 'aria-hidden': true }, importing ? h(LoadingSpinner, { size: 13 }) : null, importing ? '导入中…' : '导入 JSON'), h('span', { className: css.srOnly, role: 'status', 'aria-live': 'polite' }, importing ? '正在导入世界书，请稍候。' : ''), h('input', { className: css.fileInput, type: 'file', multiple: true, disabled: importing, accept: '.json,application/json', 'aria-label': '导入世界书 JSON', onChange: event => { const files = [...(event.target.files ?? [])]; event.target.value = ''; void importFiles(files) } }))) : h(DetailNavigation, { label: '返回世界书列表', onBack: back }),
      error ? h('div', { className: css.error, role: 'alert' }, loreBookErrorMessage(error)) : null,
      h('div', { className: css.view }, h(ContentTransition, { viewKey: selected ?? 'list', className: css.viewTransition }, selected === null ? h(LoreList, { items, status, onSelect: setSelected }) : h(LoreDetail, { detail, connection, onDirtyChange: setDetailDirty,
        onChanged: value => { setDetail(value); setRefresh(current => current + 1) },
        onDeleted: () => { setSelected(null); setDetail(null); setRefresh(current => current + 1) },
      })))))
}

function LoreSessionEditor({ mode, id, connection, disabled, onCancel, onSaved }) {
  const [detail, setDetail] = useState(() => mode === 'create' ? emptyLoreDetail() : null)
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
  if (detail === null) return h(State, { text: error === null ? '正在加载世界书…' : loreBookErrorMessage(error) })
  return h(LoreDetail, {
    key: `${mode}:${detail.id ?? 'new'}`,
    detail,
    mode,
    connection,
    disabled,
    allowDelete: false,
    onCancel,
    onChanged: onSaved,
  })
}

function DetailNavigation({ label, onBack }) {
  return h('div', { className: css.detailNavigation }, h('button', { type: 'button', className: css.backButton, onClick: onBack }, h(IconChevronLeftOutline14, { size: 16 }), h('span', null, label)))
}

function LoreList({ items, status, onSelect }) {
  if (status === 'loading' && items.length === 0) return h(State, { text: '正在加载世界书…' })
  if (status === 'error' && items.length === 0) return h(State, { text: '暂时无法加载世界书，请稍后重试。' })
  if (items.length === 0) return h(State, { text: '还没有世界书，可从上方导入 JSON。' })
  return h('div', { className: css.list, role: 'navigation', 'aria-label': '世界书列表' }, ...items.map(item => h('button', { key:item.id, type:'button', disabled:item.status==='corrupt', className:css.row, onClick:()=>onSelect(item.id) }, h('span', { className:css.book }, '文'), h('span', { className:css.rowText }, h('strong', null, item.name), h('small', null, item.status==='corrupt'?'内容无法读取':slotSummary(item.slots, item.entries))))))
}

function LoreDetail({ detail, mode = 'edit', connection, disabled = false, allowDelete = true, onCancel, onChanged, onDeleted, onDirtyChange }) {
  const creating = mode === 'create'
  const [draft, setDraft] = useState(null)
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [activeLevel, setActiveLevel] = useState(LEVELS[0].id)
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState(null)
  const [undo, setUndo] = useState(null)
  useEffect(() => {
    if (!detail) return
    setDraft({ name: detail.name, entries: cloneEntries(detail.entries ?? []) })
    setSelectedEntry(null); setHeaderMenuOpen(false); setConfirmingDelete(false); setActionError(null); setUndo(null); onDirtyChange?.(false)
  }, [detail?.id, detail?.revision])
  useEffect(() => { setActiveLevel(LEVELS[0].id) }, [detail?.id])
  const dirty = detail !== null && draft !== null && JSON.stringify(draft) !== JSON.stringify({ name: detail.name, entries: detail.entries ?? [] })
  useEffect(() => { onDirtyChange?.(dirty) }, [dirty, onDirtyChange])
  const counts = useMemo(() => Object.fromEntries(LEVELS.map(level => [level.id, draft?.entries.filter(entry => entry.level === level.id).length ?? 0])), [draft])
  if (detail === null || draft === null) return h(State, { text:'正在加载详情…' })
  const current = draft.entries.find(entry => entry.id === selectedEntry) ?? null
  const setEntry = patch => {
    setDraft(book => ({ ...book, entries: book.entries.map(entry => entry.id === selectedEntry ? { ...entry, ...patch } : entry) }))
    if (patch.level && LEVELS.some(level => level.id === patch.level)) setActiveLevel(patch.level)
  }
  const addEntry = level => {
    const entry = newLoreEntry(level, draft.entries)
    setDraft(book => ({ ...book, entries: [...book.entries, entry] })); setSelectedEntry(entry.id); setUndo(null)
  }
  const duplicateEntry = entry => {
    const copy = { ...cloneEntry(entry), id: crypto.randomUUID(), name: `${entry.name} 副本`, order: entry.order + 1 }
    setDraft(book => ({ ...book, entries: insertAfter(book.entries, entry.id, copy) })); setSelectedEntry(copy.id); setUndo(null)
  }
  const deleteEntry = entry => {
    const index = draft.entries.findIndex(item => item.id === entry.id)
    setUndo({ entry, index }); setDraft(book => ({ ...book, entries: book.entries.filter(item => item.id !== entry.id) })); setSelectedEntry(null)
  }
  const restore = () => { if (undo) { setDraft(book => ({ ...book, entries: insertAt(book.entries, undo.index, undo.entry) })); setUndo(null) } }
  const reorderLevel = (level, entries) => setDraft(book => {
    const visible = new Set(entries.map(entry => entry.id))
    const orders = book.entries.filter(entry => entry.level === level && visible.has(entry.id)).map(entry => entry.order)
    const queue = entries.map((entry, index) => ({ ...entry, order: orders[index] ?? index }))
    return { ...book, entries: book.entries.map(entry => entry.level === level && visible.has(entry.id) ? queue.shift() : entry) }
  })
  const save = async () => {
    if (disabled || !draft.name.trim() || draft.entries.some(entry => !entry.content.trim())) {
      setActionError({ code: 'INVALID_REQUEST' })
      return
    }
    setSaving(true); setActionError(null)
    try {
      const value = await rpc(connection, creating ? 'create' : 'update', creating
        ? { book: draft }
        : { id: detail.id, expectedRevision: detail.revision, patch: draft })
      await onChanged(value)
      onDirtyChange?.(false)
    }
    catch (reason) { setActionError(reason) } finally { setSaving(false) }
  }
  const remove = async () => {
    setSaving(true); setActionError(null)
    try { await rpc(connection, 'delete', { id: detail.id }); onDeleted() } catch (reason) { setActionError(reason) } finally { setSaving(false) }
  }
  const activeLevelDefinition = LEVELS.find(level => level.id === activeLevel) ?? LEVELS[0]
  const visibleEntries = draft.entries
    .filter(entry => entry.level === activeLevel)
    .filter(entry => entryMatches(entry, query, filter))
  return h('article', { className:css.detail },
    h('header', null,
      h('div', { className: css.bookIdentity }, h('input', { value: draft.name, 'aria-label': '世界书名称', onChange: event => setDraft(book => ({ ...book, name: event.target.value })) }), h('p', null, `${draft.entries.length} 条内容`)),
      h('div', { className: css.headerActions },
        onCancel ? h('button', { type: 'button', disabled: saving, onClick: onCancel }, '取消') : null,
        allowDelete ? h(Menu, {
          open: headerMenuOpen,
          items: [{ id: 'delete', label: '删除世界书', danger: true }],
          align: 'end', portal: true, compact: true,
          onClose: () => setHeaderMenuOpen(false),
          onSelect: action => { setHeaderMenuOpen(false); if (action === 'delete') setConfirmingDelete(true) },
          anchor: h('button', { type: 'button', className: css.headerMore, 'aria-label': '更多世界书操作', 'aria-expanded': headerMenuOpen, onClick: () => setHeaderMenuOpen(value => !value) }, h(IconEllipsisOutline16, { size: 18 })),
        }) : null)),
    actionError ? h('div', { className: css.error, role: 'alert' }, loreBookErrorMessage(actionError)) : null,
    undo ? h('div', { className: css.undoNotice, role: 'status' }, h('span', null, `已删除「${undo.entry.name}」，保存后生效`), h('button', { type: 'button', onClick: restore }, '撤销')) : null,
    h('div', { className: css.entryToolbar },
      h('label', { className: css.search }, h(IconSearchOutline16, { size: 16 }), h('span', { className: css.srOnly }, '搜索当前分类内容'), h('input', { value: query, onChange: event => setQuery(event.target.value), placeholder: '搜索名称、关键词或正文' })),
      h('select', { value: filter, 'aria-label': '筛选内容状态', onChange: event => setFilter(event.target.value) }, h('option', { value: 'all' }, '全部状态'), h('option', { value: 'enabled' }, '已启用'), h('option', { value: 'disabled' }, '已停用')),
      h('button', { type: 'button', className: css.addEntryButton, 'aria-label': `在${activeLevelDefinition.label}中添加内容`, onClick: () => addEntry(activeLevel) }, h(IconPlusOutline16, { size: 15 }), '添加内容')),
    h('div', { className: css.levelTabs, role: 'tablist', 'aria-label': '世界书内容类型' }, ...LEVELS.map(level => h('button', {
      key: level.id,
      id: `lore-tab-${level.id}`,
      type: 'button',
      role: 'tab',
      'aria-selected': activeLevel === level.id,
      'aria-controls': `lore-panel-${level.id}`,
      onClick: () => { setActiveLevel(level.id); setSelectedEntry(null) },
    }, h('span', null, level.label), h('small', null, counts[level.id])))),
    h('section', { key: activeLevel, id: `lore-panel-${activeLevel}`, className: css.levelPanel, role: 'tabpanel', 'aria-labelledby': `lore-tab-${activeLevel}` },
      visibleEntries.length === 0 ? h('div', { className: css.slotEmpty }, h('strong', null, counts[activeLevel] === 0 ? `${activeLevelDefinition.label}还没有内容` : '没有符合当前筛选条件的内容'), h('span', null, counts[activeLevel] === 0 ? '可以从上方添加第一条内容。' : '请尝试更换关键词或状态筛选。')) : h(Reorder.Group, { axis: 'y', values: visibleEntries, onReorder: rows => reorderLevel(activeLevel, rows), className: css.entryList },
        h(AnimatePresence, { initial: false }, ...visibleEntries.map(entry => h(EntryRow, {
          key: entry.id,
          entry,
          onEdit: () => setSelectedEntry(entry.id),
          onMove: direction => moveEntryInLevel(setDraft, entry, direction),
          onToggle: () => setEntryById(setDraft, entry.id, { enabled: entry.enabled === false }),
          onDuplicate: () => duplicateEntry(entry),
          onDelete: () => deleteEntry(entry),
        }))))),
    h(Inspector, { open: current !== null, title: current?.name ?? '编辑内容', description: current ? `${LEVELS.find(level => level.id === current.level)?.label ?? current.level} · ${current.constant ? '始终使用' : '按关键词使用'}` : undefined, onClose: () => setSelectedEntry(null) }, current ? h(EntryInspector, { entry: current, onChange: setEntry }) : null),
    h(DeleteLoreBookDialog, { open: confirmingDelete, detail, saving, onCancel: () => setConfirmingDelete(false), onConfirm: () => void remove() }),
    h(DirtyBar, { dirty, error: actionError ? loreBookErrorMessage(actionError) : null, saving, disabled, message: creating ? '新世界书尚未创建' : '世界书修改尚未保存', onDiscard: () => { setDraft({ name: detail.name, entries: cloneEntries(detail.entries ?? []) }); setUndo(null); setActionError(null) }, onSave: () => void save(), saveLabel: creating ? '创建并使用' : '保存世界书' }))
}

function EntryRow({ entry, onEdit, onMove, onToggle, onDuplicate, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const dragControls = useDragControls()
  const actions = [
    { id: 'move-up', label: '上移' },
    { id: 'move-down', label: '下移' },
    { id: 'toggle', label: entry.enabled === false ? '启用内容' : '停用内容' },
    { id: 'duplicate', label: '复制内容' },
    { id: 'delete', label: '删除内容', danger: true },
  ]
  const selectAction = action => {
    setMenuOpen(false)
    if (action === 'move-up') onMove(-1)
    else if (action === 'move-down') onMove(1)
    else if (action === 'toggle') onToggle()
    else if (action === 'duplicate') onDuplicate()
    else if (action === 'delete') onDelete()
  }
  return h(Reorder.Item, { value: entry, layout: true, className: css.entryRow, dragListener: false, dragControls },
    h('button', { type: 'button', className: css.dragHandle, 'aria-label': `拖动排序 ${entry.name}`, onPointerDown: event => dragControls.start(event) }, h('span', { 'aria-hidden': true })),
    h('button', { type: 'button', className: css.entryMain, onClick: onEdit },
      h('span', { className: css.entryCopy }, h('strong', null, entry.name), h('small', null, entrySummary(entry))),
      h('span', { className: css.entryStatus, 'data-enabled': entry.enabled !== false }, h('i', { 'aria-hidden': true }), entryStatus(entry))),
    h('button', { type: 'button', className: css.editEntryButton, onClick: onEdit }, h(IconEditOutline16, { size: 15 }), h('span', null, '编辑')),
    h(Menu, {
      open: menuOpen,
      items: actions,
      align: 'end', portal: true, compact: true,
      onClose: () => setMenuOpen(false),
      onSelect: selectAction,
      anchor: h('button', { type: 'button', className: css.moreAction, 'aria-label': `${entry.name}的更多操作`, 'aria-expanded': menuOpen, onClick: () => setMenuOpen(value => !value) }, h(IconEllipsisOutline16, { size: 18 })),
    }))
}

function DeleteLoreBookDialog({ open, detail, saving, onCancel, onConfirm }) {
  return h(Modal, {
    open,
    onClose: onCancel,
    closeLabel: '关闭删除世界书确认',
    title: `删除“${detail.name}”？`,
    description: '删除后，这本世界书会从资料库中移除。',
    className: css.deleteDialog,
    footer: h(React.Fragment, null,
      h('button', { type: 'button', className: css.secondaryButton, autoFocus: true, disabled: saving, onClick: onCancel }, '取消'),
      h('button', { type: 'button', className: css.deleteConfirmAction, disabled: saving, onClick: onConfirm }, saving ? '正在删除…' : '删除世界书')),
  }, h('div', { className: css.deleteSummary },
    h('strong', null, '删除后无法恢复'),
    h('span', null, detail.source?.characterName ? `它来自角色卡「${detail.source.characterName}」；删除世界书不会修改该角色卡。` : '已有对话中的历史消息不会改变。')))
}

function emptyLoreDetail() {
  return { id: null, revision: 0, name: '', entries: [], slots: {}, source: { kind: 'created' } }
}

function EntryInspector({ entry, onChange }) {
  const textList = value => value.join('，')
  const parseList = value => value.split(/[,，\n]/).map(item => item.trim()).filter(Boolean)
  return h('form', { className: css.inspectorForm, onSubmit: event => event.preventDefault() },
    h(Field, { label: '名称' }, h('input', { value: entry.name, onChange: event => onChange({ name: event.target.value }) })),
    h(Field, { label: '正文' }, h('textarea', { rows: 12, value: entry.content, onChange: event => onChange({ content: event.target.value }) })),
    h(Field, { label: '内容分类' }, h('select', { value: entry.level, onChange: event => onChange({ level: event.target.value }) }, ...LEVELS.map(level => h('option', { key: level.id, value: level.id }, level.label)))),
    h(Field, { label: '触发关键词' }, h('textarea', { rows: 2, value: textList(entry.keys ?? []), onChange: event => onChange({ keys: parseList(event.target.value) }) })),
    h(Field, { label: '补充关键词' }, h('textarea', { rows: 2, value: textList(entry.secondaryKeys ?? []), onChange: event => onChange({ secondaryKeys: parseList(event.target.value) }) })),
    h(StateConditionEditor, { entryId: entry.id, value: entry.stateCondition, onChange: stateCondition => onChange({ stateCondition }) }),
    h('div', { className: css.toggleGrid }, ...[['enabled','启用'],['constant','始终使用'],['caseSensitive','区分大小写'],['recursive','继续匹配其他内容']].map(([key, label]) => h('label', { key }, h('input', { type: 'checkbox', checked: entry[key] === true, onChange: event => onChange({ [key]: event.target.checked }) }), label))),
    h(Field, { label: '使用概率（1 表示每次使用）' }, h('input', { type: 'number', min: 0, max: 1, step: .01, value: entry.probability, onChange: event => onChange({ probability: Number(event.target.value) }) })),
    h('details', { className: css.advanced }, h('summary', null, '高级设置'),
      h(Field, { label: '放置位置' }, h('input', { value: entry.insertionPosition ?? '', onChange: event => onChange({ insertionPosition: event.target.value }) })),
      h(Field, { label: '参考层级' }, h('input', { type: 'number', value: entry.depth, onChange: event => onChange({ depth: Number(event.target.value) }) })),
      h(Field, { label: '内部标识（可选）' }, h('input', { value: entry.semanticKey ?? '', onChange: event => onChange({ semanticKey: event.target.value || undefined }) })),
      h(Field, { label: '顺序' }, h('input', { type: 'number', value: entry.order, onChange: event => onChange({ order: Number(event.target.value) }) }))))
}

function StateConditionEditor({ entryId, value, onChange }) {
  const initial = parseCommonStateCondition(value)
  const [mode, setMode] = useState(value && initial === null ? 'advanced' : 'common')
  const [draft, setDraft] = useState(initial ?? emptyConditionDraft())
  const lastEntryId = useRef(entryId)
  const lastEmitted = useRef(value)

  useEffect(() => {
    if (lastEntryId.current === entryId) return
    const next = parseCommonStateCondition(value)
    lastEntryId.current = entryId
    lastEmitted.current = value
    setDraft(next ?? emptyConditionDraft())
    setMode(value && next === null ? 'advanced' : 'common')
  }, [entryId, value])

  useEffect(() => {
    if (value === lastEmitted.current) return
    const next = parseCommonStateCondition(value)
    lastEmitted.current = value
    setDraft(next ?? emptyConditionDraft())
    setMode(value && next === null ? 'advanced' : 'common')
  }, [value])

  const emit = next => {
    lastEmitted.current = next
    onChange(next)
  }
  const updateDraft = patch => {
    const next = { ...draft, ...patch }
    setDraft(next)
    emit(serializeCommonStateCondition(next))
  }
  const clear = () => {
    setDraft(emptyConditionDraft())
    setMode('common')
    emit(undefined)
  }
  const parsed = parseCommonStateCondition(value)
  const issue = commonStateConditionIssue(draft)
  const hasDraft = value !== undefined || draft.namespace !== 'story' || draft.path.length > 0 || draft.valueText.length > 0 || draft.operator !== '>='

  return h('fieldset', { className: css.conditionEditor },
    h('legend', { className: css.srOnly }, '会话变量条件'),
    h('div', { className: css.conditionHeading },
      h('div', null, h('strong', null, '会话变量条件'), h('span', null, '引用会话中已经存在的变量；这里只设置使用条件，不会创建变量。')),
      hasDraft ? h('button', { type: 'button', onClick: clear }, '清除条件') : null),
    mode === 'common'
      ? h(React.Fragment, null,
        h('div', { className: css.conditionAddressFields },
          h(Field, { label: '变量分组' }, h('input', {
            value: draft.namespace,
            placeholder: 'story',
            autoCapitalize: 'none',
            spellCheck: false,
            'aria-label': '变量分组',
            'aria-invalid': hasDraft && !/^[a-z0-9][a-z0-9._:-]{0,127}$/u.test(draft.namespace.trim()),
            onChange: event => updateDraft({ namespace: event.target.value }),
          })),
          h(Field, { label: '完整路径' }, h('input', {
            value: draft.path,
            placeholder: '例如：/plot/progress',
            autoCapitalize: 'none',
            spellCheck: false,
            'aria-label': '完整变量路径',
            'aria-invalid': hasDraft && (draft.path.length === 0 || !draft.path.startsWith('/') || /~(?:[^01]|$)/u.test(draft.path)),
            onChange: event => updateDraft({ path: event.target.value }),
          }))),
        h('div', { className: css.conditionCompareFields },
          h(Field, { label: '比较方式' }, h('select', {
            value: draft.operator,
            'aria-label': '变量比较方式',
            onChange: event => updateDraft({ operator: event.target.value }),
          }, ...CONDITION_OPERATORS.map(operator => h('option', { key: operator.value, value: operator.value }, operator.label)))),
          h(Field, { label: '值' }, h('input', {
            value: draft.valueText,
            placeholder: '例如：50',
            'aria-label': '变量比较值',
            'aria-invalid': hasDraft && draft.valueText.trim().length === 0,
            onChange: event => updateDraft({ valueText: event.target.value, valueType: 'auto' }),
          }))),
        hasDraft ? h('p', { className: issue === null ? css.conditionAddressHint : `${css.conditionAddressHint} ${css.conditionIssue}`, role: issue === null ? 'status' : 'alert' },
          issue ?? `当前变量地址：${draft.namespace.trim()} · ${draft.path.trim()}`) : null,
        h('div', { className: css.conditionFooter },
          h('small', null, '格式示例：story · /plot/progress。路径必须以 / 开头并包含完整层级；同名字段可写成 /main/progress、/side/progress。'),
          h('button', { type: 'button', onClick: () => setMode('advanced') }, '高级条件')))
      : h(React.Fragment, null,
        h(Field, { label: '高级条件', hint: '用于组合多个条件。格式示例：state("story", "/plot/progress") >= 50' }, h('textarea', {
          rows: 3,
          value: value ?? '',
          placeholder: '输入条件表达式',
          onChange: event => emit(event.target.value.trim().length === 0 ? undefined : event.target.value),
        })),
        parsed !== null || value === undefined ? h('button', { type: 'button', className: css.conditionReturn, onClick: () => {
          if (parsed !== null) setDraft(parsed)
          setMode('common')
        } }, '返回常用设置') : null))
}

function emptyConditionDraft() { return { namespace: 'story', path: '', operator: '>=', valueText: '', valueType: 'auto' } }

function Field({ label, hint, children }) { return h('label', { className: css.field }, h('span', null, label), children, hint ? h('small', null, hint) : null) }

function cloneEntry(entry) { return JSON.parse(JSON.stringify(entry)) }
function cloneEntries(entries) { return entries.map(cloneEntry) }
function newLoreEntry(level, entries) {
  const order = entries.filter(entry => entry.level === level).reduce((maximum, entry) => Math.max(maximum, Number(entry.order) || 0), -1) + 1
  return {
    id: crypto.randomUUID(), name: '新条目', semanticKey: undefined, level, keys: [], secondaryKeys: [], stateCondition: undefined, content: '',
    enabled: true, constant: false, caseSensitive: false, recursive: true, order, position: 1,
    insertionPosition: 'after_char', depth: 4, probability: 1,
  }
}
function insertAfter(entries, id, value) {
  const index = entries.findIndex(entry => entry.id === id)
  return insertAt(entries, index < 0 ? entries.length : index + 1, value)
}
function insertAt(entries, index, value) { return [...entries.slice(0, index), value, ...entries.slice(index)] }
function setEntryById(setDraft, id, patch) { setDraft(book => ({ ...book, entries: book.entries.map(entry => entry.id === id ? { ...entry, ...patch } : entry) })) }
function moveEntryInLevel(setDraft, entry, direction) {
  setDraft(book => {
    const group = book.entries.filter(item => item.level === entry.level)
    const index = group.findIndex(item => item.id === entry.id)
    const target = index + direction
    if (index < 0 || target < 0 || target >= group.length) return book
    const reordered = [...group]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(target, 0, moved)
    const queue = reordered.map((item, order) => ({ ...item, order }))
    return { ...book, entries: book.entries.map(item => item.level === entry.level ? queue.shift() : item) }
  })
}
function entryMatches(entry, query, filter) {
  if (filter === 'enabled' && entry.enabled === false) return false
  if (filter === 'disabled' && entry.enabled !== false) return false
  const needle = query.trim().toLocaleLowerCase()
  if (!needle) return true
  return [entry.name, entry.content, ...(entry.keys ?? []), ...(entry.secondaryKeys ?? [])].some(value => String(value).toLocaleLowerCase().includes(needle))
}
function entrySummary(entry) {
  if (entry.keys?.length) return `关键词：${entry.keys.slice(0, 3).join('、')}`
  if (entry.secondaryKeys?.length) return `补充关键词：${entry.secondaryKeys.slice(0, 3).join('、')}`
  return entry.constant ? '无需关键词，每次都会使用' : '还没有设置触发关键词'
}
function entryStatus(entry) {
  if (entry.enabled === false) return '已停用'
  if (entry.constant) return '始终使用'
  return entry.keys?.length ? '关键词触发' : '待设置'
}

function loreBookErrorMessage(reason) {
  const code = reason?.code
  if (code === 'INVALID_JSON' || code === 'INVALID_REQUEST') return '世界书内容格式不正确，请检查括号、引号和逗号。'
  if (code === 'DUPLICATE_ASSET') return '这本世界书已经导入过了。'
  if (code === 'UNSUPPORTED_FORMAT') return '请选择 JSON 格式的世界书文件。'
  if (code === 'ASSET_CORRUPT') return '这本世界书的内容无法读取，请重新导入。'
  if (code === 'ASSET_NOT_FOUND') return '这本世界书已不存在，请返回列表后刷新。'
  if (code === 'REVISION_CONFLICT') return '这本世界书刚刚发生了变化，请刷新后再试。'
  if (code === 'LIMIT_EXCEEDED') return '文件太大，请选择不超过 2 MiB 的文件。'
  return '暂时无法更新世界书，请稍后再试。'
}

function State({ text }) { return h('div', { className:css.state }, text) }
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
function slotSummary(slots, total) {
  if (!slots) return `${total} 个条目`
  return LEVELS.map(level => `${level.short} ${slots[level.id] ?? 0}`).join(' · ')
}
async function rpc(connection, endpoint, payload) { return domainValue(await connection.call('/rp-lore-books', endpoint, payload)) }
function bytesToBase64(bytes) { let binary=''; for(let offset=0;offset<bytes.length;offset+=0x8000) binary+=String.fromCharCode(...bytes.subarray(offset,offset+0x8000)); return btoa(binary) }
