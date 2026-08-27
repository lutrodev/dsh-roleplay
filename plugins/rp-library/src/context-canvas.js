import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Reorder, m, useDragControls, useReducedMotion } from 'motion/react'
import { IconPromptSourceOutline16 } from 'dsh-roleplay-rp-ui'
import { domainValue, userErrorMessage } from './client-state.js'
import { css } from './client-styles.generated.js'
import {
  customPromptSource,
  customPromptSourceId,
  hydratePromptSlots,
  isCustomPromptSlot,
  isCustomPromptSource,
  serializePromptContextBuild,
} from './prompt-custom-source.js'
import { previewIncludedSourceIds, selectPreviewSlots, selectWorkbenchSlots } from './prompt-slot-visibility.js'

const h = React.createElement
const RESERVED_PROMPT_TAG_PATTERN = /<\s*\/?\s*(?:section|item)(?=[\s/>])[^>]*>/giu
const layoutTransition = { type: 'spring', stiffness: 420, damping: 34, mass: 0.8 }
const buttonMotion = {
  whileHover: { y: -1 }, whileTap: { scale: 0.98 },
  whileFocus: { boxShadow: '0 0 0 2px var(--dsw-alias-brand-primary)' },
  transition: { duration: 0.18, ease: [0.2, 0, 0, 1] },
}
const PROMPT_TONES = [
  ['character', '角色卡'], ['conversation', '对话内容'],
  ['state', '会话变量'], ['lore', '世界书'], ['persona', '我的人设'],
  ['preset', '创作预设'], ['writing-style', '文风'], ['session', '故事设置'],
]
const PROMPT_TONE_ICONS = Object.freeze({
  character: 'character-card',
  conversation: 'conversation',
  state: 'state',
  lore: 'lore',
  persona: 'persona',
  preset: 'preset',
  'writing-style': 'writing-style',
  session: 'session',
  mixed: 'mixed',
})

function usePromptDragAutoScroll(containerRef, orientation = 'vertical') {
  const reducedMotion = useReducedMotion()
  const state = useRef({ frame: null, point: null })
  const stop = () => {
    state.current.point = null
    if (state.current.frame !== null) cancelAnimationFrame(state.current.frame)
    state.current.frame = null
  }
  const update = (point) => {
    state.current.point = point
    if (state.current.frame !== null) return
    const advance = () => {
      state.current.frame = null
      const container = containerRef.current
      const currentPoint = state.current.point
      if (container === null || currentPoint === null) return
      const horizontal = orientation === 'horizontal'
        || (orientation === 'auto' && getComputedStyle(container).flexDirection.startsWith('row'))
      const bounds = container.getBoundingClientRect()
      const delta = promptDragScrollDelta(
        horizontal ? currentPoint.x : currentPoint.y,
        horizontal ? bounds.left : bounds.top,
        horizontal ? bounds.width : bounds.height,
        reducedMotion,
      )
      if (delta === 0) return
      const before = horizontal ? container.scrollLeft : container.scrollTop
      if (horizontal) container.scrollLeft += delta
      else container.scrollTop += delta
      const after = horizontal ? container.scrollLeft : container.scrollTop
      if (after !== before && state.current.point !== null) state.current.frame = requestAnimationFrame(advance)
    }
    state.current.frame = requestAnimationFrame(advance)
  }
  useEffect(() => stop, [])
  return { stop, update }
}

function promptSlotDropLocation(container, point, draggingId) {
  if (container === null) return { beforeSlotId: null, index: 0 }
  const horizontal = getComputedStyle(container).flexDirection.startsWith('row')
  const coordinate = horizontal ? point.x : point.y
  const items = [...container.children].filter(item => item.dataset?.promptSlotId !== undefined && item.dataset.promptSlotId !== draggingId)
  for (let index = 0; index < items.length; index += 1) {
    const bounds = items[index].getBoundingClientRect()
    const midpoint = horizontal ? bounds.left + bounds.width / 2 : bounds.top + bounds.height / 2
    if (coordinate < midpoint) return { beforeSlotId: items[index].dataset.promptSlotId, index }
  }
  return { beforeSlotId: null, index: items.length }
}

function sameDropLocation(current, area, location) {
  return current?.area === area && current.beforeSlotId === location.beforeSlotId && current.index === location.index
}

export function PromptWorkbench({ open, profile, session, sessionId, connection }) {
  const [preview, setPreview] = useState(null)
  const [previewState, setPreviewState] = useState('idle')
  const [previewError, setPreviewError] = useState(null)
  const refresh = async () => {
    setPreviewState('loading')
    setPreviewError(null)
    try {
      const value = await rpRpc(connection, 'session/context-build-preview', { sessionId })
      setPreview(value)
      setPreviewState('ready')
    } catch (error) {
      setPreviewState('error')
      setPreviewError(userErrorMessage(error, 'context-preview'))
    }
  }
  useEffect(() => { if (open) void refresh() }, [open, profile?.revision, profile?.runtime?.executionMode])
  return h('div', { className: css.promptWorkbenchShell },
    h('main', { className: css.promptWorkbenchBody },
      h(ContextBuildView, { preview, previewState, previewError, profile, session, sessionId, connection })))
}

function ContextBuildView({ preview, previewState, previewError, profile, session, sessionId, connection }) {
  if (previewState === 'loading' && preview === null) return h(CanvasEmpty, { title: '正在准备下次回复', detail: '正在整理角色卡、世界书、会话变量和当前对话内容。' })
  if (previewState === 'error' && preview === null) return h(CanvasEmpty, { title: '暂时无法预览回复资料', detail: previewError, error: true })
  if (preview === null) return h(CanvasEmpty, { title: '还没有回复资料预览', detail: '打开回复资料后会自动准备。' })
  return h(ChatBuilder, { preview, profile, session, sessionId, connection })
}

function ChatBuilder({ preview, profile, session, sessionId, connection }) {
  const previewLayout = preview.layoutSlots ?? preview.slots
  const [slots, setSlots] = useState(() => hydratePromptSlots(previewLayout, preview.customSources))
  const [previewMode, setPreviewMode] = useState('cards')
  const [selectedCustomSlotId, setSelectedCustomSlotId] = useState(null)
  const [dragging, setDragging] = useState(null)
  const [draggingSlotId, setDraggingSlotId] = useState(null)
  const [crossDropLocation, setCrossDropLocation] = useState(null)
  const [dropTarget, setDropTarget] = useState(null)
  const [saveState, setSaveState] = useState('idle')
  const [error, setError] = useState(null)
  const activeListRef = useRef(null)
  const idleListRef = useRef(null)
  const activeAutoScroll = usePromptDragAutoScroll(activeListRef)
  const idleAutoScroll = usePromptDragAutoScroll(idleListRef, 'auto')
  const baseline = useMemo(
    () => JSON.stringify(serializePromptContextBuild(hydratePromptSlots(previewLayout, preview.customSources))),
    [preview.runId],
  )
  const contextBuild = serializePromptContextBuild(slots)
  const dirty = JSON.stringify(contextBuild) !== baseline
  const invalidCustomName = slots.some(slot => isCustomPromptSlot(slot) && slot.label.trim().length === 0)
  useEffect(() => {
    setSlots(hydratePromptSlots(previewLayout, preview.customSources))
    setSelectedCustomSlotId(null)
    setCrossDropLocation(null)
    setSaveState('idle')
    setError(null)
  }, [preview.runId])
  const sources = mergedSources(preview, slots)
  const activeSlots = slots.filter(slot => slot.idle !== true)
  const idleSlots = slots.filter(slot => slot.idle === true)
  const draggingSlot = slots.find(slot => slot.id === draggingSlotId)
  const moveSource = (sourceId, targetSlotId) => {
    setSlots(current => movePromptSource(current, sourceId, targetSlotId, sources))
  }
  const addSlot = () => {
    let index = slots.length + 1
    while (slots.some(slot => slot.id === `custom-${index}`)) index += 1
    const id = `custom-${index}`
    setSlots([
      ...slots.filter(slot => slot.idle !== true),
      { id, label: `自定义 ${index}`, sourceIds: [], locked: false, sectionTag: true, customContent: '' },
      ...slots.filter(slot => slot.idle === true),
    ])
    setSelectedCustomSlotId(id)
  }
  const save = async () => {
    if (!dirty || invalidCustomName || session?.running || saveState === 'saving') return
    setSaveState('saving'); setError(null)
    try {
      await rpRpc(connection, 'session/context-build', {
        sessionId, expectedRevision: profile.revision,
        contextBuild,
      })
      setSaveState('saved')
    } catch (reason) {
      setSaveState('error'); setError(userErrorMessage(reason, 'save'))
    }
  }
  const visibleSlots = selectWorkbenchSlots(activeSlots, sources.values(), dragging !== null)
  const visibleSlotIds = new Set(visibleSlots.map(slot => slot.id))
  const updateCrossDropLocation = (area, location) => {
    setCrossDropLocation(current => sameDropLocation(current, area, location) ? current : { area, ...location })
  }
  const finishSlotDrag = () => {
    activeAutoScroll.stop()
    idleAutoScroll.stop()
    setDraggingSlotId(null)
    setCrossDropLocation(null)
  }
  const slotItems = visibleSlots.map((slot, slotIndex) => {
    return h(PromptSlot, {
      key: slot.id,
      slot,
      slotIndex,
      sources,
      dragging,
      dropTarget,
      previousSlotId: visibleSlots[slotIndex - 1]?.id,
      nextSlotId: visibleSlots[slotIndex + 1]?.id,
      onDragStart: (event, sourceId) => {
        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData('application/x-rp-prompt-source', sourceId)
        event.dataTransfer.setData('text/plain', sourceId)
        setDragging(sourceId)
      },
      onDragEnd: () => { setDragging(null); setDropTarget(null) },
      onDragOver: (event, slotId) => {
        if (!Array.from(event.dataTransfer.types).includes('application/x-rp-prompt-source')) return
        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'
        if (dropTarget !== slotId) setDropTarget(slotId)
      },
      onDrop: (event, slotId) => {
        if (!Array.from(event.dataTransfer.types).includes('application/x-rp-prompt-source')) return
        event.preventDefault()
        const sourceId = event.dataTransfer.getData('application/x-rp-prompt-source')
        moveSource(sourceId, slotId)
        setDragging(null)
        setDropTarget(null)
      },
      selected: selectedCustomSlotId === slot.id,
      crossDropBefore: crossDropLocation?.area === 'active' && crossDropLocation.beforeSlotId === slot.id,
      onSelect: isCustomPromptSlot(slot) ? () => setSelectedCustomSlotId(slot.id) : undefined,
      onDelete: () => {
        setSlots(current => current.filter(item => item.id !== slot.id))
        if (selectedCustomSlotId === slot.id) setSelectedCustomSlotId(null)
      },
      onReorderSlot: direction => setSlots(current => moveUnlockedSlot(current, slot.id, direction, visibleSlotIds)),
      onMoveSource: (sourceId, targetSlotId) => moveSource(sourceId, targetSlotId),
      onReorderSource: (sourceIndex, targetIndex) => setSlots(current => reorderSource(current, slot.id, sourceIndex, targetIndex)),
      canIdle: promptSlotCanIdle(slot, sources),
      disabled: session?.running === true,
      onIdleDragStart: event => {
        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData('application/x-rp-prompt-slot', slot.id)
        event.dataTransfer.setData('text/plain', slot.id)
        setDraggingSlotId(slot.id)
      },
      onIdleDragEnd: finishSlotDrag,
      onSortDragStart: (_event, info) => {
        if (info?.point === undefined) return
        activeAutoScroll.update(info.point)
      },
      onSortDrag: (_event, info) => {
        if (info?.point === undefined) return
        activeAutoScroll.update(info.point)
      },
      onSortDragEnd: () => activeAutoScroll.stop(),
    })
  })
  const idleArea = h(IdleSlotArea, {
    slots: idleSlots,
    sources,
    listRef: idleListRef,
    dropLocation: crossDropLocation?.area === 'idle' ? crossDropLocation : null,
    draggingSlotId,
    canDrop: draggingSlot === undefined || promptSlotCanIdle(draggingSlot, sources),
    disabled: session?.running === true,
    onDropLocation: (location, point) => {
      activeAutoScroll.stop()
      idleAutoScroll.update(point)
      updateCrossDropLocation('idle', location)
    },
    onDrop: (slotId, beforeSlotId) => {
      setSlots(current => movePromptSlotToArea(current, slotId, true, beforeSlotId, sources))
      finishSlotDrag()
    },
    onRestore: slotId => setSlots(current => setPromptSlotIdle(current, slotId, false, sources)),
    onDragStart: (event, slotId) => {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('application/x-rp-prompt-slot', slotId)
      event.dataTransfer.setData('text/plain', slotId)
      setDraggingSlotId(slotId)
    },
    onDragEnd: finishSlotDrag,
  })
  const restoringIdleSlot = draggingSlot?.idle === true
  const workbench = h('section', {
    className: css.slotWorkbench,
    'data-idle-restore-active': restoringIdleSlot ? 'true' : 'false',
    onDragOver: event => {
      if (!restoringIdleSlot || session?.running || !Array.from(event.dataTransfer.types).includes('application/x-rp-prompt-slot')) return
      event.preventDefault()
      event.dataTransfer.dropEffect = 'move'
      idleAutoScroll.stop()
      activeAutoScroll.update({ x: event.clientX, y: event.clientY })
      updateCrossDropLocation('active', promptSlotDropLocation(activeListRef.current, { x: event.clientX, y: event.clientY }, draggingSlotId))
    },
    onDrop: event => {
      if (!restoringIdleSlot || session?.running) return
      event.preventDefault()
      const slotId = event.dataTransfer.getData('application/x-rp-prompt-slot')
      const location = promptSlotDropLocation(activeListRef.current, { x: event.clientX, y: event.clientY }, slotId)
      if (slotId.length > 0) setSlots(current => movePromptSlotToArea(current, slotId, false, location.beforeSlotId, sources))
      finishSlotDrag()
    },
  },
      h('div', { className: css.builderIntro },
        h('div', { className: css.buildSectionHeader }, h('div', null, h('span', { className: css.eyebrow }, '调整顺序'), h('h3', null, '回复资料顺序')), h('button', { type: 'button', onClick: addSlot, disabled: session?.running }, '+ 添加分组')),
        h('p', { className: css.buildExplainer }, '拖动左侧手柄排序，拖动分组名称可移入闲置区；拖动资料可更换分组。会话总结、对话历史和当前输入始终启用。'),
        h(PromptLegend)),
      restoringIdleSlot
        ? h(m.div, { className: css.restoreDropHint, initial: { opacity: 0, y: -4 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -4 } }, '松开放回回复资料')
        : null,
      h(Reorder.Group, {
        ref: activeListRef,
        axis: 'y',
        layoutScroll: true,
        values: visibleSlots,
        onReorder: rows => setSlots(current => preserveVisibleSlots(current, rows)),
        className: css.slotStack,
        'data-cross-drop-end': crossDropLocation?.area === 'active' && crossDropLocation.beforeSlotId === null ? 'true' : 'false',
      }, ...slotItems),
      error ? h('p', { className: css.builderError, role: 'alert' }, error) : null,
      h('footer', { className: css.builderFooter },
        h('span', null, `回复资料 ${preview.usedCharacters ?? 0} 字`, invalidCustomName ? ' · 请填写分组名称' : dirty ? ' · 修改尚未保存' : ' · 已保存'),
        h(m.button, { ...buttonMotion, type: 'button', onClick: () => void save(), disabled: !dirty || invalidCustomName || session?.running || saveState === 'saving' }, session?.running ? '回复生成中' : saveState === 'saving' ? '保存中…' : '保存更改')))
  const selectedCustomSlot = slots.find(slot => slot.id === selectedCustomSlotId)
  return h('div', { className: css.contextBuildGrid }, workbench, idleArea,
    selectedCustomSlot === undefined
      ? h(PromptPreview, {
          preview,
          slots,
          disabled: session?.running === true,
          mode: previewMode,
          onModeChange: setPreviewMode,
          onSlotSectionTagChange: (slotId, sectionTag) => setSlots(current => current.map(slot => slot.id === slotId ? { ...slot, sectionTag } : slot)),
        })
      : h(CustomPromptEditor, {
          slot: selectedCustomSlot,
          disabled: session?.running,
          onClose: () => setSelectedCustomSlotId(null),
          onChangeName: label => setSlots(current => current.map(slot => slot.id === selectedCustomSlot.id ? { ...slot, label } : slot)),
          onChangeContent: customContent => setSlots(current => current.map(slot => slot.id === selectedCustomSlot.id
            ? {
                ...slot,
                customContent,
                sourceIds: customContent.trim().length === 0
                  ? slot.sourceIds.filter(id => id !== customPromptSourceId(slot.id))
                  : [...slot.sourceIds.filter(id => id !== customPromptSourceId(slot.id)), customPromptSourceId(slot.id)],
              }
            : slot)),
        }))
}

function PromptSlot({ slot, slotIndex, sources, dragging, dropTarget, previousSlotId, nextSlotId, selected, crossDropBefore, onSelect, onDragStart, onDragEnd, onDragOver, onDrop, onDelete, onReorderSlot, onMoveSource, onReorderSource, canIdle, disabled, onIdleDragStart, onIdleDragEnd, onSortDragStart, onSortDrag, onSortDragEnd }) {
  const controls = useDragControls()
  const displaySourceIds = slotSourceIdsForDisplay(slot, sources)
  const idleDragProps = canIdle && !disabled
    ? {
        draggable: true,
        'data-idle-draggable': 'true',
        'aria-label': `拖动${slot.label}移入闲置区`,
        title: `拖动${slot.label}移入闲置区`,
        onDragStart: onIdleDragStart,
        onDragEnd: onIdleDragEnd,
      }
    : {}
  const groupHandle = slot.locked
    ? h('span', { className: css.slotHandle, 'data-locked': 'true', 'aria-label': '固定分组', title: '固定分组' }, '◆')
    : h('button', {
        type: 'button', className: css.slotHandle, disabled,
        'aria-label': `拖动${slot.label}；也可用上下方向键调整`,
        title: `拖动${slot.label}调整顺序`,
        onPointerDown: event => { if (!disabled) controls.start(event) },
        onKeyDown: event => {
          if (disabled) return
          if (event.key === 'ArrowUp') { event.preventDefault(); onReorderSlot(-1) }
          else if (event.key === 'ArrowDown') { event.preventDefault(); onReorderSlot(1) }
        },
      }, '⠿')
  const idleAction = canIdle ? null : h('span', { className: css.slotRequiredBadge, title: '这个分组必须参与回复' }, '始终使用')
  if (displaySourceIds.length === 1) {
    const sourceId = displaySourceIds[0]
    const source = sources.get(sourceId) ?? { id: sourceId, label: sourceId }
    const unavailable = source.available === false
    const tone = promptSourceTone(source)
    const draggable = !isCustomPromptSource(source) && !source.defaultSlot?.locked && (!unavailable || source.required === true)
    const title = compactSlotLabel(slot, source)
    const secondary = title === slot.label && source.label !== slot.label ? source.label : null
    const sourceHandle = draggable
      ? h('button', {
          type: 'button', className: css.sourceDragHandle, draggable: true,
          onDragStart: event => onDragStart(event, sourceId), onDragEnd,
          onKeyDown: event => {
            if (event.key === 'ArrowUp' && previousSlotId !== undefined) { event.preventDefault(); onMoveSource(sourceId, previousSlotId) }
            else if (event.key === 'ArrowDown' && nextSlotId !== undefined) { event.preventDefault(); onMoveSource(sourceId, nextSlotId) }
          },
          title: `拖动${source.label ?? source.id}`, 'aria-label': `拖动${source.label ?? source.id}到其他分组；也可用上下方向键移动`,
        }, h(SourceTypeIcon, { tone }), h('i', null, '⠿'))
      : h('span', { className: css.sourceDragHandle, 'aria-hidden': true }, h(SourceTypeIcon, { tone }))
    return h(Reorder.Item, {
      value: slot, layout: true, transition: layoutTransition, dragListener: false, dragControls: controls,
      className: css.slotCard, 'data-tone': slotTone(slot, sources), 'data-single': 'true', 'data-selected': selected ? 'true' : 'false',
      'data-prompt-slot-id': slot.id, 'data-cross-drop-before': crossDropBefore ? 'true' : 'false',
      onDragStart: onSortDragStart, onDrag: onSortDrag, onDragEnd: onSortDragEnd,
    }, h('div', {
      className: css.compactSlotRow,
      'data-dragging': dragging === null ? 'false' : 'true',
      'data-drop-active': dropTarget === slot.id ? 'true' : 'false',
      onDragOver: event => onDragOver(event, slot.id),
      onDrop: event => onDrop(event, slot.id),
    },
    groupHandle,
    sourceHandle,
    onSelect === undefined
      ? h('span', { ...idleDragProps, className: css.compactSlotTitle }, h('strong', null, title), secondary ? h('small', null, secondary) : null)
      : h('button', { ...idleDragProps, type: 'button', className: `${css.compactSlotTitle} ${css.customSlotSelect}`, onClick: onSelect, 'aria-pressed': selected }, h('strong', null, title), secondary ? h('small', null, secondary) : null),
    h('span', { className: css.compactSlotOrder }, `第 ${slotIndex + 1} 组`),
    h('span', { className: css.sourceMeta }, unavailable ? unavailableSourceLabel(source) : sourceMetaLabel(source)),
    idleAction))
  }
  const sourceCards = slot.sourceIds.length === 0
    ? onSelect === undefined
      ? h('span', { className: css.slotPlaceholder }, dragging === null ? '拖入故事资料' : '放到这个分组')
      : h('button', { type: 'button', className: css.slotPlaceholder, onClick: onSelect }, dragging === null ? '在右侧添加资料内容' : '放到这个分组')
    : slot.sourceIds.map((sourceId, sourceIndex) => h(SourceCard, {
        key: sourceId,
        source: sources.get(sourceId) ?? { id: sourceId, label: sourceId },
        dragging: dragging === sourceId,
        onDragStart: event => onDragStart(event, sourceId),
        onDragEnd,
        onHandleKeyDown: event => {
          if (event.key === 'ArrowUp') {
            event.preventDefault()
            if (sourceIndex > 0) onReorderSource(sourceIndex, sourceIndex - 1)
            else if (previousSlotId !== undefined) onMoveSource(sourceId, previousSlotId)
          } else if (event.key === 'ArrowDown') {
            event.preventDefault()
            if (sourceIndex < slot.sourceIds.length - 1) onReorderSource(sourceIndex, sourceIndex + 1)
            else if (nextSlotId !== undefined) onMoveSource(sourceId, nextSlotId)
          }
        },
        actions: h('span', { className: css.sourceActions },
          h('button', { type: 'button', disabled: sourceIndex === 0, 'aria-label': `上移${sources.get(sourceId)?.label ?? '资料'}`, onClick: () => onReorderSource(sourceIndex, sourceIndex - 1) }, '↑'),
          h('button', { type: 'button', disabled: sourceIndex === slot.sourceIds.length - 1, 'aria-label': `下移${sources.get(sourceId)?.label ?? '资料'}`, onClick: () => onReorderSource(sourceIndex, sourceIndex + 1) }, '↓')),
      }))
  return h(Reorder.Item, {
    value: slot,
    layout: true,
    transition: layoutTransition,
    dragListener: false,
    dragControls: controls,
    className: css.slotCard,
    'data-tone': slotTone(slot, sources),
    'data-selected': selected ? 'true' : 'false',
    'data-prompt-slot-id': slot.id,
    'data-cross-drop-before': crossDropBefore ? 'true' : 'false',
    onDragStart: onSortDragStart,
    onDrag: onSortDrag,
    onDragEnd: onSortDragEnd,
  },
  h('header', null,
    groupHandle,
    onSelect === undefined
      ? h('span', { ...idleDragProps, className: css.slotTitleDragTarget }, h('strong', null, slot.label), h('small', null, `第 ${slotIndex + 1} 组 · ${slot.sourceIds.length} 项内容`))
      : h('button', { ...idleDragProps, type: 'button', className: `${css.customSlotSelect} ${css.slotTitleDragTarget}`, onClick: onSelect, 'aria-pressed': selected }, h('strong', null, slot.label), h('small', null, `第 ${slotIndex + 1} 组 · ${slot.sourceIds.length} 项内容`)),
    h('span', { className: css.slotHeaderActions },
      idleAction,
      !slot.locked && slot.sourceIds.length === 0
        ? h('button', { type: 'button', 'aria-label': `删除 ${slot.label}`, onClick: onDelete }, '×')
        : null)),
  h('div', {
    className: css.slotDropzone,
    'data-dragging': dragging === null ? 'false' : 'true',
    'data-drop-active': dropTarget === slot.id ? 'true' : 'false',
    onDragOver: event => onDragOver(event, slot.id),
    onDrop: event => onDrop(event, slot.id),
  }, sourceCards))
}

function IdleSlotArea({ slots, sources, listRef, dropLocation, draggingSlotId, canDrop, disabled, onDropLocation, onDrop, onRestore, onDragStart, onDragEnd }) {
  const cards = slots.map(slot => h(m.article, {
    key: slot.id,
    layout: true,
    transition: layoutTransition,
    className: css.idleSlotCard,
    'data-tone': slotTone(slot, sources),
    'data-dragging': draggingSlotId === slot.id ? 'true' : 'false',
    'data-prompt-slot-id': slot.id,
    'data-cross-drop-before': dropLocation?.beforeSlotId === slot.id ? 'true' : 'false',
    draggable: !disabled,
    tabIndex: disabled ? -1 : 0,
    role: 'listitem',
    'aria-roledescription': '可拖动闲置分组',
    'aria-label': `${slot.label}，闲置；拖动回到回复资料区，或按回车键恢复使用`,
    title: `拖动${slot.label}回到回复资料区`,
    onDragStart: event => onDragStart(event, slot.id),
    onDragEnd,
    onKeyDown: event => {
      if (disabled || (event.key !== 'Enter' && event.key !== ' ')) return
      event.preventDefault()
      onRestore(slot.id)
    },
  },
  h('span', { className: css.idleSlotMark, 'aria-hidden': true }, 'Ⅱ'),
  h('span', { className: css.idleSlotTitle }, h('strong', null, slot.label), h('small', null, `${slot.sourceIds.length} 份 · 不参与回复`))))
  return h(m.section, {
    layout: true,
    className: css.idleSlotArea,
    'data-drop-active': draggingSlotId !== null && canDrop ? 'true' : 'false',
    'data-drop-blocked': draggingSlotId !== null && !canDrop ? 'true' : 'false',
    onDragOver: event => {
      if (!Array.from(event.dataTransfer.types).includes('application/x-rp-prompt-slot') || !canDrop || disabled) return
      event.preventDefault()
      event.dataTransfer.dropEffect = 'move'
      const point = { x: event.clientX, y: event.clientY }
      onDropLocation(promptSlotDropLocation(listRef.current, point, draggingSlotId), point)
    },
    onDrop: event => {
      if (!canDrop || disabled) return
      event.preventDefault()
      const slotId = event.dataTransfer.getData('application/x-rp-prompt-slot')
      const location = promptSlotDropLocation(listRef.current, { x: event.clientX, y: event.clientY }, slotId)
      if (slotId.length > 0) onDrop(slotId, location.beforeSlotId)
    },
  },
  h('header', null,
    h('span', null, h('small', { className: css.eyebrow }, '暂不使用'), h('strong', null, '闲置区')),
    h('span', { className: css.idleSlotCount }, `${slots.length} 组`)),
  h('p', { className: css.idleSlotExplainer }, '拖到这里的分组会保留，但不参与下次回复。'),
  slots.length === 0
    ? h('div', { ref: listRef, className: css.idleSlotEmpty },
        h('strong', null, draggingSlotId === null ? '暂无闲置分组' : canDrop ? '松开放入闲置区' : '这个分组不能闲置'),
        h('span', null, draggingSlotId === null ? '拖动分组名称到这里' : canDrop ? '分组会保留，可拖回中间恢复' : '这个分组始终启用'))
    : h('div', {
        ref: listRef,
        className: css.idleSlotList,
        role: 'list',
        'aria-label': '闲置分组',
        'data-cross-drop-end': dropLocation !== null && dropLocation.beforeSlotId === null ? 'true' : 'false',
      }, ...cards))
}

function PromptPreview({ preview, slots, disabled, mode, onModeChange, onSlotSectionTagChange }) {
  const sources = mergedSources(preview, slots)
  const includedSourceIds = previewIncludedSourceIds(sources.values(), preview.contexts ?? [])
  for (const slot of slots) {
    const customSource = customPromptSource(slot)
    if (customSource !== undefined) includedSourceIds.add(customSource.id)
  }
  const visibleSlots = selectPreviewSlots(slots, includedSourceIds)
  const plainText = renderPlainPromptPreview(visibleSlots, sources)
  return h('aside', { className: css.promptPreview },
    h('div', { className: css.buildSectionHeader },
      h('div', null, h('span', { className: css.eyebrow }, '回复预览'), h('h3', null, '下次回复预览')),
      h(PreviewModeSwitch, { value: mode, onChange: onModeChange })),
    h('p', { className: css.buildExplainer }, mode === 'plain'
      ? '按当前顺序展示实际发送的完整文本；当前输入会在生成时填入。'
      : '展开每个分组可查看实际发送文本，并单独设置是否保留分组标签。'),
    mode === 'plain'
      ? h('pre', { className: css.promptPlainText, 'aria-label': '下次回复的纯文本预览' }, plainText || '还没有可预览的资料正文。')
      : h('div', { className: css.promptDocument },
        ...visibleSlots.map(slot => {
          const text = renderPromptSlotPreview(slot, sources)
          const tone = slotTone(slot, sources)
          const sectionTag = slot.sectionTag !== false
          return h('section', { key: slot.id, 'data-tone': tone },
            h('details', null,
              h('summary', null,
                h(SourceTypeIcon, { tone }),
                h('strong', null, slot.label),
                h('span', null, `${slot.sourceIds.length} 份 · ${formatNumber([...text].length)} 字`)),
              h('div', { className: css.promptSlotPreviewBody },
                h('div', { className: css.promptSlotTagControl },
                  h('span', null,
                    h('strong', null, '分组标签'),
                    h('small', null, sectionTag
                      ? '使用 <section>；多份资料同时使用 <item>。'
                      : '直接拼接这个分组内的资料原文。')),
                  h(SectionTagSwitch, {
                    checked: sectionTag,
                    disabled,
                    label: `为${slot.label}保留分组标签`,
                    onChange: value => onSlotSectionTagChange(slot.id, value),
                  })),
                h('pre', { 'aria-label': `${slot.label}实际发送内容` }, text))))
        })))
}

function PreviewModeSwitch({ value, onChange }) {
  return h('div', { className: css.previewModeSwitch, role: 'group', 'aria-label': '预览方式' },
    ...[['cards', '资料卡片'], ['plain', '纯文本']].map(([mode, label]) => h(m.button, {
      key: mode,
      type: 'button',
      'aria-pressed': value === mode,
      'data-active': value === mode ? 'true' : 'false',
      onClick: () => onChange(mode),
      whileTap: { scale: 0.97 },
      transition: { duration: 0.14, ease: [0.2, 0, 0, 1] },
    }, label)))
}

function SectionTagSwitch({ checked, disabled, label, onChange }) {
  const reducedMotion = useReducedMotion()
  return h(m.button, {
    type: 'button',
    className: css.sectionTagSwitch,
    role: 'switch',
    'aria-checked': checked,
    'aria-label': label,
    disabled,
    onClick: () => onChange(!checked),
    whileTap: reducedMotion || disabled ? undefined : { scale: 0.97 },
  }, h(m.span, {
    'aria-hidden': true,
    animate: { x: checked ? 16 : 0 },
    transition: reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 520, damping: 34 },
  }))
}

function CustomPromptEditor({ slot, disabled, onClose, onChangeName, onChangeContent }) {
  const content = slot.customContent ?? ''
  return h('aside', { className: `${css.promptPreview} ${css.customPromptEditor}` },
    h('div', { className: css.buildSectionHeader },
      h('div', null, h('span', { className: css.eyebrow }, '自定义资料'), h('h3', null, '编辑分组内容')),
      h('button', { type: 'button', onClick: onClose }, '返回预览')),
    h('p', { className: css.buildExplainer }, '这里的内容只属于当前对话，保存后会从下一次回复开始生效。'),
    h('div', { className: css.customPromptForm },
      h('label', null,
        h('span', null, '分组名称'),
        h('input', {
          value: slot.label,
          maxLength: 80,
          disabled,
          autoFocus: true,
          placeholder: '例如：本轮写作要求',
          onChange: event => onChangeName(event.target.value),
        })),
      h('label', { className: css.customPromptContent },
        h('span', null, '资料内容'),
        h('textarea', {
          value: content,
          disabled,
          placeholder: '写下希望下次回复参考的背景、规则或提示…',
          onChange: event => onChangeContent(event.target.value),
        })),
      h('div', { className: css.customPromptStatus },
        h('span', null, slot.label.trim().length === 0 ? '请填写分组名称' : content.trim().length === 0 ? '尚未添加内容，不会用于回复' : '将用于下次回复'),
        h('span', null, `${formatNumber([...content].length)} 字`))))
}

function PromptLegend() {
  return h('div', { className: css.promptLegend, 'aria-label': '回复资料类型说明' }, ...PROMPT_TONES.map(([tone, label]) => h('span', { key: tone, 'data-tone': tone }, h(SourceTypeIcon, { tone }), label)))
}

function SourceCard({ source, onDragStart, onDragEnd, onHandleKeyDown, actions, readonly = false, dragging = false }) {
  const unavailable = source.available === false
  const tone = promptSourceTone(source)
  const draggable = !readonly && !isCustomPromptSource(source) && !source.defaultSlot?.locked && (!unavailable || source.required === true)
  return h(m.article, {
    layout: true, transition: layoutTransition, className: css.sourceIngredient,
    'data-kind': source.kind ?? 'runtime', 'data-tone': tone, 'data-available': unavailable ? 'false' : 'true',
    'data-dragging': dragging ? 'true' : 'false',
  }, draggable
    ? h('button', {
        type: 'button', className: css.sourceDragHandle, draggable: true, onDragStart, onDragEnd, onKeyDown: onHandleKeyDown,
        title: `拖动${source.label ?? source.id}`, 'aria-label': `拖动${source.label ?? source.id}；也可用上下方向键移动`,
      }, h(SourceTypeIcon, { tone }), h('i', null, '⠿'))
    : h('span', { className: css.sourceDragHandle, 'aria-hidden': true }, h(SourceTypeIcon, { tone })),
  h('span', null, h('strong', null, source.label ?? source.id), h('small', null, source.id === 'rp.card' ? '包含角色设定、场景与对话示例' : source.description ?? source.id)),
  h('span', { className: css.sourceMeta }, unavailable ? unavailableSourceLabel(source) : sourceMetaLabel(source)),
  actions)
}

function SourceTypeIcon({ tone }) {
  const iconName = promptToneIconName(tone)
  return h('i', { className: css.sourceTypeIcon, 'data-icon': iconName, 'data-tone': tone, 'aria-hidden': true }, h(IconPromptSourceOutline16, { type: iconName, size: 14 }))
}

function CanvasEmpty({ title, detail, error = false }) {
  return h('div', { className: css.canvasWorkspaceEmpty, 'data-error': error ? 'true' : 'false' }, h('span', { 'aria-hidden': true }, error ? '!' : '◇'), h('strong', null, title), h('p', null, detail))
}

function reorderSource(slots, slotId, from, to) {
  if (to < 0) return slots
  return slots.map(slot => {
    if (slot.id !== slotId || to >= slot.sourceIds.length) return slot
    const sourceIds = [...slot.sourceIds]
    const [item] = sourceIds.splice(from, 1)
    sourceIds.splice(to, 0, item)
    return { ...slot, sourceIds }
  })
}
function preserveVisibleSlots(current, proposed) {
  const visibleIds = new Set(proposed.map(slot => slot.id))
  const unlocked = proposed.filter(slot => !slot.locked)
  return current.map(slot => !visibleIds.has(slot.id) || slot.locked ? slot : unlocked.shift()).filter(Boolean)
}
function moveUnlockedSlot(slots, id, direction, visibleIds) {
  const unlocked = slots.filter(slot => !slot.locked && visibleIds.has(slot.id))
  const index = unlocked.findIndex(slot => slot.id === id)
  const target = index + direction
  if (index < 0 || target < 0 || target >= unlocked.length) return slots
  ;[unlocked[index], unlocked[target]] = [unlocked[target], unlocked[index]]
  return slots.map(slot => slot.locked || !visibleIds.has(slot.id) ? slot : unlocked.shift())
}

/** Return whether a complete Prompt slot may be excluded from assembly. */
export function promptSlotCanIdle(slot, sources) {
  return slot.sourceIds.every(id => id !== 'rp.conversation'
    && id !== 'rp.current-input'
    && sources.get(id)?.idleAllowed !== false)
}

/** Return one frame of edge-driven Prompt list scrolling. */
export function promptDragScrollDelta(pointer, start, length, reducedMotion = false) {
  if (!Number.isFinite(pointer) || !Number.isFinite(start) || !Number.isFinite(length) || length <= 0) return 0
  const edge = Math.min(72, length / 3)
  const maximum = reducedMotion ? 10 : 22
  const leading = start + edge
  const trailing = start + length - edge
  if (pointer < leading) return -Math.round(maximum * Math.min(1, (leading - pointer) / edge))
  if (pointer > trailing) return Math.round(maximum * Math.min(1, (pointer - trailing) / edge))
  return 0
}

/** Move or reorder one Prompt slot at an exact position in the active or idle area. */
export function movePromptSlotToArea(slots, slotId, idle, beforeSlotId, sources) {
  const target = slots.find(slot => slot.id === slotId)
  if (target === undefined || (idle && !promptSlotCanIdle(target, sources))) return slots
  const remaining = slots.filter(slot => slot.id !== slotId)
  const active = remaining.filter(slot => slot.idle !== true)
  const parked = remaining.filter(slot => slot.idle === true)
  const destination = idle ? parked : active
  const insertionIndex = beforeSlotId === null ? destination.length : destination.findIndex(slot => slot.id === beforeSlotId)
  if (insertionIndex < 0) return slots
  let moved
  if (idle) moved = { ...target, idle: true }
  else {
    const { idle: _idle, ...restored } = target
    moved = restored
  }
  destination.splice(insertionIndex, 0, moved)
  return idle ? [...active, ...destination] : [...destination, ...parked]
}

/** Move one complete Prompt slot between the active sequence and the idle area. */
export function setPromptSlotIdle(slots, slotId, idle, sources) {
  const target = slots.find(slot => slot.id === slotId)
  if (target === undefined || (target.idle === true) === idle) return slots
  return movePromptSlotToArea(slots, slotId, idle, null, sources)
}

/** Move one source between active Prompt slots without exposing idle slots as destinations. */
export function movePromptSource(slots, sourceId, targetSlotId, sources) {
  const source = sources.get(sourceId)
  const targetSlot = slots.find(slot => slot.id === targetSlotId)
  if (source === undefined || targetSlot === undefined || targetSlot.idle === true) return slots
  if (source.defaultSlot?.locked && source.defaultSlot.id !== targetSlotId) return slots
  return slots.map(slot => ({
    ...slot,
    sourceIds: slot.id === targetSlotId
      ? slot.sourceIds.includes(sourceId) ? slot.sourceIds : [...slot.sourceIds, sourceId]
      : slot.sourceIds.filter(id => id !== sourceId),
  }))
}

function sourceKindLabel(kind) { return ({ 'session-projection': '当前对话', 'shared-reference': '角色和世界资料', conversation: '对话内容', runtime: '临时资料' })[kind] ?? '临时资料' }
/** Return the stable visual category for one prompt source. */
export function promptSourceTone(source) {
  const id = String(source?.id ?? '')
  if (id === 'rp.card') return 'character'
  if (id === 'rp.state') return 'state'
  if (id === 'rp.persona') return 'persona'
  if (id === 'rp.preset' || id.startsWith('rp.preset:')) return 'preset'
  if (id === 'rp.writing-style' || id.startsWith('rp.writing-style:')) return 'writing-style'
  if (id.startsWith('rp.lore')) return 'lore'
  if (id === 'rp.current-input' || source?.kind === 'conversation' || /conversation|history|message/i.test(id)) return 'conversation'
  return 'other'
}
/** Return the stable icon key for one prompt visual category. */
export function promptToneIconName(tone) {
  return Object.hasOwn(PROMPT_TONE_ICONS, tone) ? PROMPT_TONE_ICONS[tone] : 'attachment'
}
/** Return one visual preview block for a prompt source. */
export function splitPromptPreview(source) {
  const text = source?.id === 'rp.current-input' && typeof source?.text !== 'string'
    ? '本轮用户消息会在开始生成时填入。'
    : String(source?.text ?? '这份资料暂时无法读取。')
  return [{ tone: promptSourceTone(source), label: source?.label ?? '回复资料', text }]
}
/**
 * Render the currently arranged Prompt sources as one selectable text document.
 *
 * @param {readonly Record<string, unknown>[]} slots Visible Prompt slots in their current order.
 * @param {ReadonlyMap<string, Record<string, unknown>>} sources Prompt sources available to the preview.
 * @returns {string} Readable preview text with source content preserved verbatim.
 */
export function renderPlainPromptPreview(slots, sources) {
  const renderedSlots = slots
    .filter(slot => slot.idle !== true && slot.sourceIds.length > 0)
    .map(slot => renderPromptSlotPreview(slot, sources))
  return renderedSlots.join('\n')
}

/** Render one Slot exactly as it will appear in the Writer Prompt. */
export function renderPromptSlotPreview(slot, sources) {
  const fragments = slot.sourceIds.map(sourceId => {
    const source = sources.get(sourceId) ?? { id: sourceId, label: sourceId }
    return {
      label: source.label ?? sourceId,
      text: splitPromptPreview(source).map(part => part.text).join('\n'),
    }
  })
  if (slot.sectionTag === false) return fragments.map(fragment => fragment.text).join('\n')
  const body = fragments.length === 1 && fragments[0].label === slot.label
    ? protectPromptBoundaries(fragments[0].text)
    : fragments.map(fragment => `<item name="${escapePromptAttribute(fragment.label)}">\n${protectPromptBoundaries(fragment.text)}\n</item>`).join('\n')
  return `<section name="${escapePromptAttribute(slot.label)}">\n${body}\n</section>`
}
function mergedSources(preview, slots = []) {
  const contexts = new Map((preview.contexts ?? []).map(source => [source.id, source]))
  const sources = new Map((preview.sources ?? []).map(source => [source.id, { ...source, ...(contexts.get(source.id) ?? {}) }]))
  for (const slot of slots) {
    const source = customPromptSource(slot)
    if (source !== undefined) sources.set(source.id, source)
  }
  return sources
}
function slotTone(slot, sources) {
  const tones = [...new Set(slotSourceIdsForDisplay(slot, sources).map(id => promptSourceTone(sources.get(id))))]
  return tones.length === 1 ? tones[0] : tones.length > 1 ? 'mixed' : 'other'
}
function slotSourceIdsForDisplay(slot, sources) {
  if (slot.sourceIds.length > 0) return slot.sourceIds
  return slot.id === 'rp.state' && sources.has('rp.state') ? ['rp.state'] : []
}
function formatNumber(value) { return new Intl.NumberFormat('zh-CN').format(Number(value) || 0) }
function compactSlotLabel(slot, source) {
  const id = String(source?.id ?? '')
  const category = isCustomPromptSource(source) ? '自定义'
    : id === 'rp.conversation' || id === 'rp.current-input' ? '会话'
    : id === 'rp.card' ? '角色卡'
        : id === 'rp.persona' ? '人设'
          : id === 'rp.state' ? '状态'
              : id === 'rp.writing-style' || id.startsWith('rp.writing-style:') ? '文风'
                : id === 'rp.preset' || id.startsWith('rp.preset:') ? '预设'
                  : id.startsWith('rp.lore') ? '世界书'
                    : sourceKindLabel(source?.kind)
  const styleNames = Array.isArray(source?.diagnostics?.names) ? source.diagnostics.names.filter(name => typeof name === 'string' && name.length > 0) : []
  const detail = id.startsWith('rp.preset:') || id.startsWith('rp.writing-style:') ? source.label ?? slot.label
    : id === 'rp.writing-style' && styleNames.length > 0 ? styleNames.join('、')
      : slot.label
  return `${category} - ${detail}`
}
function sourceMetaLabel(source) {
  if (source?.id === 'rp.conversation') return `${formatNumber(source.diagnostics?.messages)} 条消息`
  return `${formatNumber(source?.characters)} 字符`
}
function unavailableSourceLabel(source) {
  if (source?.id === 'rp.current-input') return '等待输入'
  if (source?.id === 'rp.state') return '尚未初始化'
  return '暂时没有内容'
}
function escapePromptAttribute(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}
function protectPromptBoundaries(value) {
  return String(value).replace(RESERVED_PROMPT_TAG_PATTERN, tag => tag
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;'))
}
async function rpRpc(connection, endpoint, payload) { return domainValue(await connection.rpc.call('/rp-assets', endpoint, payload)) }
