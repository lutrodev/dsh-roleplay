import React, { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, LazyMotion, MotionConfig, Reorder, domMax, m, useReducedMotion } from 'motion/react'
import {
  Button,
  IconAgentPresetOutline16,
  IconChevronDownOutline14,
  IconDataOutline16,
  IconEditOutline16,
  IconListPenOutline16,
  IconLinkOutline16,
  Menu,
  Modal,
  Pill,
} from '@deepseek-ai/dsh-client-ui-primitives'
import { assetKindLabel, countStateItems, domainValue, isRoleplaySummary, moveItem, openingModeFromProfile, openingText, preferredStateDetailView, resetBlankRoleplaySession, selectCharacterLore, sessionBlockReason, sessionSectionCapability, sessionSurfaceState, shouldShowSkippedOpeningNotice, stateActivityChanges, stateActivityTotalCount, userErrorMessage } from './client-state.js'
import { css, ensureStyles } from './client-styles.generated.js'
import { PromptWorkbench } from './context-canvas.js'
import { AssetEditorRegistry } from './asset-editor-registry.js'
import { LoreWikiDetail, PresetWikiDetail, SessionDocumentBrowser, WikiDetailSection, WikiDocumentHeader } from './session-wiki.js'
import { currentSessionBindingIds, readyBindingItems, sessionBindingRequest, sessionBindingSpec } from './session-binding.js'
import { ContentTransition, IconCharacterCardOutline16, useWorkbenchModal, WorkbenchTabs } from 'dsh-roleplay-rp-ui'
import { MAX_OPENING_CHARACTERS, RP_SESSION_APPLY_COMMAND } from 'dsh-roleplay-rp-session/protocol'
import { roleplayRunMarkerDefinition, RpRunMarker } from './run-marker.js'

export const inject = ['slots', 'rpRemote', 'conversation', 'uiConversation', 'sessions', 'workspaces']
const h = React.createElement
const motionTransition = { duration: 0.18, ease: [0.2, 0, 0, 1] }
const exitTransition = { duration: 0.14, ease: [0.4, 0, 1, 1] }
const layoutTransition = { type: 'spring', stiffness: 420, damping: 34, mass: 0.8 }
const gestures = { whileHover: { y: -1 }, whileTap: { scale: 0.98 }, whileFocus: { boxShadow: '0 0 0 2px var(--dsw-alias-brand-primary)' }, transition: motionTransition }
const EMPTY_CAPABILITIES = Object.freeze({ characters: false, lorebooks: false, personas: false, presets: false, writingStyles: false, state: false })
const EMPTY_RESOURCE_SELECTION = '__rp-empty-resource-selection__'
const FINISH_RESOURCE_SELECTION = '__rp-finish-resource-selection__'
const STATE_ACTIVITY_PROJECTION_KEY = 'rp/state/activity'
export function apply(ctx) {
  ctx.effect(ensureStyles)
  ctx.uiConversation.events.register(roleplayRunMarkerDefinition)
  const assetEditors = new AssetEditorRegistry()
  ctx.effect(() => {
    const dispose = ctx.reflect.provide('rpAssetEditors', assetEditors)
    return () => { void dispose() }
  }, 'rp-library: canonical asset editor registry')
  const injectUi = () => ({ connection: ctx.rpRemote, blocks: ctx.conversation.blocks, sessions: ctx.sessions, workspaces: ctx.workspaces })
  ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
    name: 'sidebar.footer.action', id: 'rp-assets-navigation', order: 10,
    children: {
      'rp-assets.character-entry': { kind: 'single', scope: 'root' },
      'rp-assets.lore-entry': { kind: 'single', scope: 'root' },
      'rp-assets.persona-entry': { kind: 'single', scope: 'root' },
      'rp-assets.preset-entry': { kind: 'single', scope: 'root' },
      'rp-assets.writing-style-entry': { kind: 'single', scope: 'root' },
    },
  }, RpAssetsNavigation))
  ctx.slots.inject('conversation.input.left', () => ctx.slots.register({
    name: 'conversation.input.left', id: 'rp-session-context', order: 20, inject: injectUi,
  }, RpSessionContextControl))
  ctx.slots.inject('conversation.session.header.utilities', () => ctx.slots.register({
    name: 'conversation.session.header.utilities', id: 'rp-story-library', order: 0, inject: injectUi,
  }, RpStoryLibraryControl))
  ctx.slots.inject('conversation.input.dock', () => ctx.slots.register({
    name: 'conversation.input.dock', id: 'rp-library-guide', order: 20, inject: injectUi,
  }, RpLibraryGuide))
  ctx.slots.inject('conversation.chat.commandview', () => ctx.slots.register({
    name: 'conversation.chat.commandview', key: RP_SESSION_APPLY_COMMAND,
  }, HiddenSessionProfileCommand))
  ctx.slots.inject('conversation.chat.node', () => ctx.slots.register({
    name: 'conversation.chat.node', key: 'rp-run-marker',
  }, RpRunMarker))
  ctx.slots.inject('conversation.input.dock', () => ctx.slots.register({
    name: 'conversation.input.dock', id: 'rp-workbench-mobile', order: 30, inject: injectUi,
  }, RpMobileWorkbenchControl))
}

function HiddenSessionProfileCommand() {
  return null
}

function RpAssetsNavigation({ wide, renderSlot }) {
  return h('nav', { className: wide ? css.assetNavigation : `${css.assetNavigation} ${css.assetNavigationRail}`, 'aria-label': '角色扮演资料' },
    renderSlot('rp-assets.preset-entry', { wide }),
    renderSlot('rp-assets.writing-style-entry', { wide }),
    renderSlot('rp-assets.character-entry', { wide }),
    renderSlot('rp-assets.lore-entry', { wide }),
    renderSlot('rp-assets.persona-entry', { wide }))
}

function useCharacterDetail(connection, cardId, refreshKey = 0) {
  const [result, setResult] = useState({ status: 'idle', detail: null })
  const [reloadKey, setReloadKey] = useState(0)
  useEffect(() => {
    if (typeof cardId !== 'string') { setResult({ status: 'idle', detail: null }); return }
    let live = true
    setResult({ status: 'loading', detail: null })
    rpc(connection, 'characters/get', { id: cardId })
      .then(detail => { if (live) setResult({ status: 'ready', detail }) })
      .catch(error => { if (live) setResult({ status: 'error', detail: null, error }) })
    return () => { live = false }
  }, [cardId, connection, refreshKey, reloadKey])
  return { ...result, retry: () => setReloadKey(value => value + 1) }
}

function RpLibraryGuide(props) {
  const { sessionId, useSession, useSessions, useProjection, connection, blocks, sessions, workspaces } = props
  const roleplay = useSessions(state => isRoleplaySummary(state, sessionId))
  const session = useSession(state => ({ blank: state.blank, composerPhase: state.composerPhase, running: state.running }))
  const profile = useProjection('rp/session')
  const state = useProjection('rp/state')
  const stateActivity = useProjection(STATE_ACTIVITY_PROJECTION_KEY)
  const surface = sessionSurfaceState(roleplay, session, profile)
  const blockReason = sessionBlockReason(surface)
  const showSkippedOpeningNotice = surface === 'active' && shouldShowSkippedOpeningNotice(session, profile)
  const [open, setOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [resetError, setResetError] = useState(null)
  useEffect(() => {
    if (!roleplay) return
    blocks.set(sessionId, blockReason === undefined ? undefined : { reason: blockReason })
    return () => { blocks.set(sessionId, undefined) }
  }, [blockReason, blocks, roleplay, sessionId])
  if (surface === 'hidden' || (surface === 'active' && !showSkippedOpeningNotice)) return null
  const closeReset = () => {
    if (resetting) return
    setResetOpen(false)
    setResetError(null)
  }
  const confirmReset = async () => {
    if (resetting) return
    setResetting(true)
    setResetError(null)
    try {
      await resetBlankRoleplaySession({ sessionId, sessions, workspaces })
    } catch (reason) {
      setResetError(userErrorMessage(reason, 'reset'))
      setResetting(false)
    }
  }
  return h(RpMotionProvider, null,
    showSkippedOpeningNotice
      ? h(SkippedOpeningNotice, {
        onView: () => setOpen(true),
        onReset: () => { setResetError(null); setResetOpen(true) },
        profile,
      })
      : surface === 'setup'
      ? h(SetupPrompt, { onClick: () => setOpen(true), mode: 'setup' })
      : h(SetupPrompt, { onClick: () => setOpen(true), mode: 'recover' }),
    h(LibraryModal, {
      open,
      onClose: () => setOpen(false),
      connection,
      sessionId,
      session,
      profile,
      state,
      stateActivity,
      intent: surface === 'setup' ? 'create' : showSkippedOpeningNotice ? 'wiki' : 'settings',
      onCreated: async createdId => {
        await waitForListedSession(sessions, createdId)
        setOpen(false)
        sessions.open(createdId)
      },
    }),
    h(ResetSkippedSessionDialog, {
      open: resetOpen,
      pending: resetting,
      error: resetError,
      onCancel: closeReset,
      onConfirm: () => void confirmReset(),
    }))
}

export function RpMotionProvider({ children }) {
  return h(MotionConfig, { reducedMotion: 'user', transition: motionTransition }, h(LazyMotion, { features: domMax, strict: true }, children))
}

function SetupPrompt({ onClick, mode }) {
  const recover = mode === 'recover'
  const title = recover ? '恢复故事设置' : '开始一段故事'
  const description = recover
    ? '这个对话还没有故事设置，确认后即可继续。'
    : '资料不用一次备齐，开始后也能随时补充。'
  const action = recover ? '继续设置' : '设置并开始'
  return h(m.button, {
    ...gestures,
    type: 'button',
    className: css.setupPrompt,
    onClick,
    'data-tone': recover ? 'recovery' : 'setup',
  },
  h('span', { className: css.setupPromptIcon }, h(IconCharacterCardOutline16, { size: 18 })),
  h('span', { className: css.setupPromptCopy },
    h('strong', null, title),
    h('small', null, description)),
  h('span', { className: css.setupPromptAction }, action, h('span', { 'aria-hidden': true }, '→')))
}

function SkippedOpeningNotice({ onView, onReset, profile }) {
  const resources = profile?.resources
  const references = (resources?.card ? 1 : 0)
    + (resources?.lorebooks?.length ?? 0)
    + (resources?.persona ? 1 : 0)
    + (resources?.preset ? 1 : 0)
    + (resources?.writingStyles?.length ?? 0)
  const detail = references === 0 ? '未选择额外资料' : `已启用 ${references} 项资料`
  return h(m.section, {
    className: css.skippedOpeningNotice,
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    'aria-label': `会话已准备好，已跳过开场白，${detail}`,
  },
  h('span', { className: css.skippedOpeningIcon, 'aria-hidden': true }, '✓'),
  h('span', { className: css.skippedOpeningCopy },
    h('small', null, '会话已准备好'),
    h('strong', null, '已跳过开场白'),
    h('span', null, `${detail}，直接发送第一条消息即可开始。`)),
  h('span', { className: css.skippedOpeningActions },
    h(m.button, { ...gestures, type: 'button', className: css.skippedOpeningAction, onClick: onView }, '查看资料', h('span', { 'aria-hidden': true }, '→')),
    h(m.button, { ...gestures, type: 'button', className: css.skippedOpeningReset, onClick: onReset, 'aria-label': '重置这个空白对话' }, '重置')))
}

function ResetSkippedSessionDialog({ open, pending, error, onCancel, onConfirm }) {
  return h(Modal, {
    open,
    onClose: onCancel,
    closeLabel: '关闭重置对话确认',
    title: '重置这个空白对话？',
    description: '退出当前故事设置，回到新对话的初始状态。',
    className: css.resetDialog,
    footer: h(React.Fragment, null,
      h(Button, { variant: 'outline', autoFocus: true, disabled: pending, onClick: onCancel }, '取消'),
      h(Button, { variant: 'outline', className: css.resetConfirmAction, disabled: pending, onClick: onConfirm }, pending ? '正在重置…' : '重置对话')),
  },
  h('div', { className: css.resetSummary },
    h('strong', null, '当前空白对话会从列表中收起'),
    h('span', null, '重置后可以重新选择模式或角色卡。'),
    h('span', null, '角色卡、世界书、人设、预设和文风不会从资料库删除。')),
  error === null ? null : h('div', { className: css.resetError, role: 'alert' }, error))
}

function RpSessionContextControl(props) {
  const { sessionId, useSession, useSessions, useProjection, connection } = props
  const roleplay = useSessions(state => isRoleplaySummary(state, sessionId))
  const session = useSession(state => ({ blank: state.blank, composerPhase: state.composerPhase, running: state.running }))
  const profile = useProjection('rp/session')
  const surface = sessionSurfaceState(roleplay, session, profile)
  if (surface !== 'active') return null
  return h(RpMotionProvider, null,
    h('div', { className: css.contextControls },
      h(ExecutionModeSwitch, { connection, sessionId, session, profile })))
}

// Keep session tools in the session header; the input row only owns reply mode.
function RpStoryLibraryControl(props) {
  const { sessionId, useSession, useSessions, useProjection, connection } = props
  const roleplay = useSessions(state => isRoleplaySummary(state, sessionId))
  const session = useSession(state => ({ blank: state.blank, composerPhase: state.composerPhase, running: state.running }))
  const profile = useProjection('rp/session')
  const state = useProjection('rp/state')
  const stateActivity = useProjection(STATE_ACTIVITY_PROJECTION_KEY)
  const surface = sessionSurfaceState(roleplay, session, profile)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [promptOpen, setPromptOpen] = useState(false)
  if (surface !== 'active') return null
  return h(RpMotionProvider, null,
    h('div', { className: css.headerContextControls },
      h(PromptTrigger, { onClick: () => setPromptOpen(true) }),
      h(SessionWikiTrigger, { onClick: () => setLibraryOpen(true) })),
    h(PromptModal, {
      open: promptOpen,
      onClose: () => setPromptOpen(false),
      profile, session, sessionId, connection,
    }),
    h(LibraryModal, { open: libraryOpen, onClose: () => setLibraryOpen(false), connection, sessionId, session, profile, state, stateActivity }))
}

function RpMobileWorkbenchControl(props) {
  const { sessionId, useSession, useSessions, useProjection, connection } = props
  const roleplay = useSessions(state => isRoleplaySummary(state, sessionId))
  const session = useSession(state => ({ blank: state.blank, composerPhase: state.composerPhase, running: state.running }))
  const profile = useProjection('rp/session')
  const state = useProjection('rp/state')
  const stateActivity = useProjection(STATE_ACTIVITY_PROJECTION_KEY)
  const surface = sessionSurfaceState(roleplay, session, profile)
  const [promptOpen, setPromptOpen] = useState(false)
  const [libraryOpen, setLibraryOpen] = useState(false)
  if (surface !== 'active') return null
  return h(RpMotionProvider, null,
    h('div', { className: css.workbenchMobileControls },
      h(ExecutionModeSwitch, { connection, sessionId, session, profile, compact: true }),
      h(PromptTrigger, { mobile: true, onClick: () => setPromptOpen(true) }),
      h(SessionWikiTrigger, { mobile: true, onClick: () => setLibraryOpen(true) })),
    h(PromptModal, {
      open: promptOpen,
      onClose: () => setPromptOpen(false),
      profile, session, sessionId, connection,
    }),
    h(LibraryModal, { open: libraryOpen, onClose: () => setLibraryOpen(false), connection, sessionId, session, profile, state, stateActivity }))
}

function ExecutionModeSwitch({ connection, sessionId, session, profile, compact = false }) {
  const current = profile?.runtime?.executionMode === 'agent' ? 'agent' : 'chat'
  const disabled = session.running || profile == null
  const [pending, setPending] = useState(null)
  const [error, setError] = useState(null)
  useEffect(() => { setPending(null); setError(null) }, [current])
  const toggle = async () => {
    const executionMode = current === 'chat' ? 'agent' : 'chat'
    if (disabled || pending !== null || executionMode === current) return
    setPending(executionMode); setError(null)
    try {
      await rpc(connection, 'session/execution-mode', { sessionId, expectedRevision: profile.revision, executionMode })
    } catch (reason) {
      setPending(null); setError(userErrorMessage(reason, 'save'))
    }
  }
  return h('div', { className: css.modeSwitchWrap },
    h(m.button, {
      ...gestures,
      type: 'button',
      role: 'switch',
      className: css.modeSwitch,
      disabled: disabled || pending !== null,
      'aria-checked': current === 'agent',
      'aria-label': `切换回复方式，当前为${current === 'chat' ? 'Chat，速度更快' : 'Agent，能力更强但消耗更多额度'}`,
      'data-mode': current,
      'data-compact': compact ? 'true' : 'false',
      'data-pending': pending !== null ? 'true' : 'false',
      onClick: () => void toggle(),
      title: current === 'chat' ? 'Chat：更快地根据你的消息继续故事；点击切换为 Agent' : 'Agent：能力更强，会规划多步故事进展，但消耗更多额度；点击切换为 Chat',
    },
    h('span', { className: css.modeLabel, 'data-active': current === 'chat' ? 'true' : 'false' }, 'Chat'),
    h('span', { className: css.modeLabel, 'data-active': current === 'agent' ? 'true' : 'false' }, 'Agent'),
    h(m.span, {
      className: css.modeThumb,
      'data-mode': current,
      animate: { x: current === 'agent' ? '100%' : '0%' },
      transition: layoutTransition,
      'aria-hidden': true,
    }, h(ModeEnergy, { key: current, mode: current }))),
    error ? h('span', { className: css.modeError, role: 'alert', title: error }, '!') : null)
}

function ModeEnergy({ mode }) {
  const reduced = useReducedMotion()
  if (mode === 'chat' || reduced) return h('span', { className: css.modeEnergy, 'data-mode': mode })
  return h('span', { className: css.modeEnergy, 'data-mode': 'agent' },
      h(m.span, {
        className: css.modeFireAura,
        animate: { rotate: [0, -360], opacity: [0.2, 0.38, 0.26, 0.2] },
        transition: { rotate: { duration: 8.4, ease: 'linear', repeat: Infinity }, opacity: { duration: 1.18, ease: 'easeInOut', repeat: Infinity } },
      }),
      h(m.span, {
        className: css.modeFireSweep,
        animate: { rotate: [0, 360] },
        transition: { duration: 5.6, ease: 'linear', repeat: Infinity },
      }),
      h('span', { className: css.modeFireSurface }))
}

function LibraryModal({ open, onClose, connection, sessionId, session, profile, state, stateActivity, intent = 'wiki', onCreated }) {
  const creating = intent === 'create'
  const surface = sessionSurfaceState(true, session, profile)
  const setup = surface === 'setup'
  const recovery = surface === 'recover'
  const guided = creating || setup || recovery
  const includesOpening = creating || setup
  const [step, setStep] = useState('assets')
  const [section, setSection] = useState('character')
  const [bindingKind, setBindingKind] = useState(null)
  const [tab, setTab] = useState('characters')
  const [query, setQuery] = useState('')
  const [lists, setLists] = useState({ characters: [], lorebooks: [], personas: [], presets: [], writingStyles: [], defaultPersonaId: null, defaultPresetId: null, defaultWritingStyleId: null })
  const [capabilities, setCapabilities] = useState(null)
  const [stylesAvailable, setStylesAvailable] = useState(false)
  const [maxWritingStyles, setMaxWritingStyles] = useState(16)
  const [loading, setLoading] = useState(false)
  const [selectedCard, setSelectedCard] = useState(null)
  const [selectedLore, setSelectedLore] = useState([])
  const [selectedPersona, setSelectedPersona] = useState(null)
  const [selectedPreset, setSelectedPreset] = useState(null)
  const [selectedWritingStyles, setSelectedWritingStyles] = useState([])
  const [openingIndex, setOpeningIndex] = useState(0)
  const [openingMode, setOpeningMode] = useState('skip')
  const [customOpening, setCustomOpening] = useState('')
  const [autoLore, setAutoLore] = useState([])
  const [inspected, setInspected] = useState(null)
  const [mobileDetail, setMobileDetail] = useState(false)
  const [detail, setDetail] = useState(null)
  const [detailState, setDetailState] = useState('idle')
  const [cardPreview, setCardPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [pendingRevision, setPendingRevision] = useState(null)
  const defaultsApplied = useRef(false)
  const dialogRef = useWorkbenchModal(open)

  useEffect(() => {
    if (!open) return
    setActionError(null)
    setPendingRevision(null)
    defaultsApplied.current = false
    setStep('assets')
    setSection('character')
    setBindingKind(null)
    setSelectedCard(profile?.resources?.card?.id ?? null)
    setSelectedLore((profile?.resources?.lorebooks ?? []).map(binding => binding.id))
    setSelectedPersona(profile?.resources?.persona?.id ?? null)
    setSelectedPreset(profile?.resources?.preset?.id ?? null)
    setSelectedWritingStyles((profile?.resources?.writingStyles ?? []).map(binding => binding.id))
    setOpeningIndex(profile?.scene?.openingIndex ?? 0)
    setOpeningMode(openingModeFromProfile(profile))
    setCustomOpening(profile?.scene?.openingText ?? '')
    setAutoLore([])
    setInspected(null); setMobileDetail(false)
    setCardPreview(null); setLoadError(null)
  }, [open])
  useEffect(() => {
    if (!open) return
    let live = true
    setCapabilities(null)
    void rpc(connection, 'capabilities', {}).then(
      value => {
        if (!live) return
        const next = { ...EMPTY_CAPABILITIES, ...value }
        setCapabilities(next)
        setStylesAvailable(next.writingStyles)
        if (!next.characters && includesOpening) setOpeningMode('skip')
      },
      reason => {
        if (!live) return
        setCapabilities(EMPTY_CAPABILITIES)
        setLoadError(reason)
      },
    )
    return () => { live = false }
  }, [connection, includesOpening, open, reloadKey])
  useEffect(() => {
    if (!open || pendingRevision === null || Number(profile?.revision) < pendingRevision) return
    // Consume the acknowledgement before closing. Leaving it behind would make
    // the next manual open observe the previous successful revision and close
    // the workbench again in the same effect flush.
    setPendingRevision(null)
    onClose()
  }, [onClose, open, pendingRevision, profile?.revision])
  useEffect(() => {
    if (!open || !guided || capabilities === null) return
    const timer = setTimeout(() => { void loadLists() }, 180)
    return () => clearTimeout(timer)
    async function loadLists() {
      setLoading(true); setLoadError(null)
      try {
        const [characters, lorebooks, personas, presets, writingStyles] = await Promise.all([
          capabilities.characters ? rpc(connection, 'characters/list', { query: tab === 'characters' ? query : '', limit: 100 }) : Promise.resolve({ items: [] }),
          capabilities.lorebooks ? rpc(connection, 'lorebooks/list', { query: tab === 'lorebooks' ? query : '', limit: 100 }) : Promise.resolve({ items: [] }),
          capabilities.personas ? rpc(connection, 'personas/list', { limit: 100 }) : Promise.resolve({ items: [] }),
          capabilities.presets ? rpc(connection, 'presets/list', { limit: 100 }) : Promise.resolve({ items: [] }),
          capabilities.writingStyles ? rpc(connection, 'writing-styles/list', { limit: 100 }) : Promise.resolve({ items: [] }),
        ])
        setLists({ characters: characters.items, lorebooks: lorebooks.items, personas: personas.items, presets: presets.items, writingStyles: writingStyles.items, defaultPersonaId: personas.defaultId ?? null, defaultPresetId: presets.defaultId ?? null, defaultWritingStyleId: writingStyles.defaultId ?? null })
        if ((creating || setup || recovery) && !defaultsApplied.current) {
          setSelectedPersona(personas.defaultId ?? null)
          setSelectedPreset(presets.defaultId ?? null)
          setSelectedWritingStyles(writingStyles.defaultId == null ? [] : [writingStyles.defaultId])
          defaultsApplied.current = true
        }
        setStylesAvailable(capabilities.writingStyles)
        if (Number.isSafeInteger(writingStyles.maxStylesPerSession)) setMaxWritingStyles(writingStyles.maxStylesPerSession)
      } catch (reason) { setLoadError(reason) } finally { setLoading(false) }
    }
  }, [capabilities, connection, creating, guided, open, query, recovery, reloadKey, setup, tab])

  const availableAssetTabs = capabilities === null ? [] : ['characters', 'lorebooks'].filter(key => capabilities[key])
  useEffect(() => {
    if (availableAssetTabs.length > 0 && !availableAssetTabs.includes(tab)) setTab(availableAssetTabs[0])
  }, [availableAssetTabs.join('\u0000'), tab])

  const activeId = inspected ?? (tab === 'characters' ? selectedCard : selectedLore.at(-1))
  useEffect(() => {
    if (!open || !guided || !activeId || capabilities?.[tab] !== true) { setDetail(null); setDetailState('idle'); return }
    let live = true
    setDetailState('loading')
    rpc(connection, tab === 'characters' ? 'characters/get' : 'lorebooks/get', { id: activeId })
      .then(value => { if (live) { setDetail(value); setDetailState('ready') } })
      .catch(reason => { if (live) { setDetail(reason); setDetailState('error') } })
    return () => { live = false }
  }, [activeId, capabilities, connection, guided, open, tab])

  useEffect(() => {
    if (!open || !includesOpening || selectedCard === null || capabilities?.characters !== true) { setCardPreview(null); return }
    let live = true
    setActionError(null)
    rpc(connection, 'characters/get', { id: selectedCard })
      .then(value => { if (live) setCardPreview(value) })
      .catch(reason => { if (live) { setCardPreview(null); setActionError({ reason, intent: 'preview' }) } })
    return () => { live = false }
  }, [capabilities, connection, includesOpening, open, selectedCard])

  useEffect(() => {
    if (openingMode !== 'card' || cardPreview === null) return
    const options = cardOpeningOptions(cardPreview)
    if (options.length > 0 && !options.some(option => option.index === openingIndex)) setOpeningIndex(options[0].index)
  }, [cardPreview, openingIndex, openingMode])

  const save = async () => {
    setSaving(true); setActionError(null)
    try {
      const selectedOpening = openingMode === 'skip'
        ? null
        : openingMode === 'custom'
          ? customOpening
          : cardPreview === null ? null : openingText(cardPreview, openingIndex)
      const request = {
        ...(capabilities?.characters ? { cardId: selectedCard } : {}),
        ...(capabilities?.lorebooks ? { lorebookIds: selectedLore } : {}),
        ...(capabilities?.personas ? { personaId: selectedPersona } : {}),
        ...(capabilities?.presets ? { presetId: selectedPreset } : {}),
        ...(capabilities?.writingStyles ? { writingStyleIds: selectedWritingStyles } : {}),
        ...(includesOpening ? {
          openingIndex,
          openingSource: openingMode,
          openingText: selectedOpening,
        } : {}),
      }
      if (creating) {
        const next = await rpc(connection, 'session/create', { sourceSessionId: sessionId, ...request })
        await onCreated?.(next.sessionId)
      } else {
        const next = await rpc(connection, 'session/bind', {
          sessionId,
          expectedRevision: profile?.revision ?? 0,
          ...request,
        })
        setPendingRevision(next.revision)
      }
    } catch (reason) { setActionError({ reason, intent: 'save' }) } finally { setSaving(false) }
  }
  const selectCharacter = (character, lorebooks = lists.lorebooks) => {
    const next = selectCharacterLore(selectedLore, autoLore, character, lorebooks)
    setSelectedCard(character.id)
    setOpeningIndex(0)
    setOpeningMode('card')
    setSelectedLore(next.selectedLore)
    setAutoLore(next.automaticLore)
  }
  const clearCharacter = () => {
    setSelectedCard(null)
    setOpeningIndex(0)
    setOpeningMode('skip')
    setSelectedLore(ids => ids.filter(id => !autoLore.includes(id)))
    setAutoLore([])
    setInspected(null)
    setMobileDetail(false)
  }
  const selectedNames = useMemo(() => selectedLore.map(id => lists.lorebooks.find(item => item.id === id)?.name ?? '已选择的世界书'), [lists.lorebooks, selectedLore])
  const customOpeningCharacters = [...customOpening.trim()].length
  const openingInvalid = openingMode === 'custom'
    ? customOpeningCharacters === 0 || customOpeningCharacters > MAX_OPENING_CHARACTERS
    : openingMode === 'card' && (selectedCard === null || cardPreview === null || !cardOpeningOptions(cardPreview).some(option => option.index === openingIndex))
  const footer = guided
    ? h(SetupFooter, {
      step, onClose,
      onBack: () => setStep('assets'),
      onNext: () => setStep('opening'),
      onSave: () => void save(), invalid: step === 'assets' ? loading : openingInvalid, saving, pendingRevision,
      selectionSummary: h(BindingSummary, { selectedCard, lists, selectedNames, selectedPersona, selectedPreset, selectedWritingStyles }),
      openingMode,
      customOpeningCharacters,
      includesOpening,
      saveLabel: creating ? '创建并开始' : recovery ? '保存并继续' : '保存并开始',
    })
    : undefined

  return h(Modal, { open, onClose, title: creating ? '开始一段故事' : recovery ? '恢复会话设置' : '会话 Wiki', closeLabel: creating ? '关闭故事创建' : recovery ? '关闭恢复设置' : '关闭会话 Wiki', className: css.libraryDialog, contentClassName: css.libraryContent, footer },
    h('div', { className: css.libraryShell, ref: dialogRef, tabIndex: -1 },
      includesOpening ? h(SetupSteps, { step }) : null,
      !guided ? h(SessionWikiOverview, { profile, state }) : null,
      !guided ? h(SessionContextNav, { section, onSection: next => { setSection(next); setBindingKind(null) }, state, activity: stateActivity, profile, capabilities: capabilities ?? EMPTY_CAPABILITIES }) : null,
      actionError ? h(InlineNotice, { message: userErrorMessage(actionError.reason, actionError.intent) }) : null,
      !guided && bindingKind !== null
        ? h(ContentTransition, { viewKey: `${bindingKind}-binding` }, h(SessionWikiBindingPanel, {
          kind: bindingKind,
          profile,
          connection,
          sessionId,
          onCancel: () => setBindingKind(null),
          onBound: () => setBindingKind(null),
        }))
      : !guided && section === 'state'
          ? h(ContentTransition, { viewKey: 'state' }, h(SessionStatePanel, { state, activity: stateActivity, available: capabilities?.state === true }))
          : !guided && section === 'character'
            ? h(ContentTransition, { viewKey: 'character' }, h(SessionCharacterPanel, { profile, connection, available: capabilities?.characters === true, onBind: () => setBindingKind('character') }))
          : !guided && section === 'lorebooks'
            ? h(ContentTransition, { viewKey: 'lorebooks' }, h(SessionLorebooksPanel, { profile, connection, available: capabilities?.lorebooks === true, onBind: () => setBindingKind('lorebooks') }))
          : !guided && ['persona', 'preset', 'writingStyles'].includes(section)
            ? h(ContentTransition, { viewKey: section }, h(SessionSharedAssetPanel, { kind: section === 'writingStyles' ? 'writingStyle' : section, profile, connection, available: capabilities?.[sessionSectionCapability(section)] === true, onBind: () => setBindingKind(section) }))
          : includesOpening && step === 'opening'
          ? h(OpeningStep, { card: cardPreview, selectedCard, connection, openingIndex, onOpeningIndex: setOpeningIndex, mode: openingMode, onMode: setOpeningMode, customOpening, onCustomOpening: setCustomOpening })
          : guided ? h(React.Fragment, null,
            h('div', { className: css.libraryToolbar, 'data-selection-only': 'true' },
              h('div', { className: css.tabs, role: 'tablist', 'aria-label': '资料类型' },
                ...availableAssetTabs.map(key => h(m.button, { ...gestures, key, type: 'button', role: 'tab', 'aria-selected': tab === key, className: tab === key ? css.tabActive : css.tab, onClick: () => { setTab(key); setQuery(''); setInspected(null); setMobileDetail(false) } }, key === 'characters' ? '角色卡' : '世界书'))),
              h('label', { className: css.search }, h('span', { className: css.srOnly }, '搜索资料'), h('input', { value: query, onChange: event => setQuery(event.target.value), placeholder: tab === 'characters' ? '按名称搜索角色卡' : '按名称搜索世界书' }))),
            loadError && (lists.characters.length > 0 || lists.lorebooks.length > 0) ? h(InlineNotice, { message: userErrorMessage(loadError), action: '重新加载', onAction: () => setReloadKey(value => value + 1) }) : null,
            availableAssetTabs.length === 0 ? h(StateMessage, { title: '没有启用可选资料', description: '可以直接继续，或到设置中的 Roleplay 功能启用需要的资料类型。' }) : h('div', { className: css.libraryGrid, 'data-mobile-detail': mobileDetail ? 'true' : 'false', 'data-selection-only': 'true' },
              h(AssetList, { tab, items: tab === 'characters' ? lists.characters : lists.lorebooks, loading, error: loadError, onRetry: () => setReloadKey(value => value + 1), selectedCard, selectedLore, connection, selectionOnly: true, onCard: selectCharacter, onClearCard: clearCharacter, onLore: id => setSelectedLore(ids => ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id]), onInspect: id => { setInspected(id); setMobileDetail(true) } }),
              h(AssetDetail, { tab, detail, state: detailState, onBack: () => setMobileDetail(false) })),
            tab === 'lorebooks' && selectedLore.length ? h(LoreOrder, { items: selectedLore.map(id => lists.lorebooks.find(item => item.id === id) ?? { id, name: id }), onChange: rows => setSelectedLore(rows.map(row => row.id)), onMove: (from, to) => setSelectedLore(ids => moveItem(ids, from, to)) }) : null,
            h(SessionResourceSelectors, { lists, capabilities: capabilities ?? EMPTY_CAPABILITIES, selectedPersona, selectedPreset, selectedWritingStyles, stylesAvailable, maxWritingStyles, onPersona: setSelectedPersona, onPreset: setSelectedPreset, onWritingStyles: setSelectedWritingStyles, onDefaults: () => { setSelectedPersona(lists.defaultPersonaId); setSelectedPreset(lists.defaultPresetId); setSelectedWritingStyles(lists.defaultWritingStyleId === null ? [] : [lists.defaultWritingStyleId]) } })) : null))
}

function SessionWikiOverview({ profile, state }) {
  const resources = profile?.resources
  const references = (resources?.card ? 1 : 0) + (resources?.lorebooks?.length ?? 0) + (resources?.persona ? 1 : 0) + (resources?.preset ? 1 : 0) + (resources?.writingStyles?.length ?? 0)
  const live = Object.keys(state?.namespaces ?? {}).length > 0
  return h('div', { className: css.sessionWikiOverview },
    h('span', { className: css.sessionWikiOverviewIcon }, h(IconDataOutline16, { size: 18 })),
    h('span', null,
      h('strong', null, '当前对话正在使用的资料'),
      h('small', null, `${references} 项资料${live ? '，以及已形成的状态' : ''}。资料空缺或失效时可在这里重新绑定，内容编辑仍在侧栏资料库中完成。`)))
}

function SessionContextNav({ section, onSection, state, activity, profile, capabilities }) {
  const counts = {
    character: profile?.resources?.card === undefined ? 0 : 1,
    lorebooks: profile?.resources?.lorebooks?.length ?? 0,
    persona: profile?.resources?.persona === undefined ? 0 : 1,
    preset: profile?.resources?.preset === undefined ? 0 : 1,
    writingStyles: profile?.resources?.writingStyles?.length ?? 0,
    state: Object.keys(state?.namespaces ?? {}).length,
  }
  const stateChanges = stateActivityTotalCount(activity)
  const items = [
    { id: 'character', label: '角色卡', icon: h(IconCharacterCardOutline16, { size: 16 }), meta: counts.character === 0 ? '未设置' : '1 张' },
    { id: 'lorebooks', label: '世界书', icon: h(IconLinkOutline16, { size: 16 }), meta: counts.lorebooks === 0 ? '未启用' : `${counts.lorebooks} 本` },
    { id: 'persona', label: '我的人设', icon: h(IconAgentPresetOutline16, { size: 16 }), meta: counts.persona === 0 ? '未使用' : '1 个' },
    { id: 'preset', label: '创作预设', icon: h(IconListPenOutline16, { size: 16 }), meta: counts.preset === 0 ? '未使用' : '1 个' },
    { id: 'writingStyles', label: '文风', icon: h(IconEditOutline16, { size: 16 }), meta: counts.writingStyles === 0 ? '未使用' : `${counts.writingStyles} 种` },
    { id: 'state', label: '状态', icon: h(IconDataOutline16, { size: 16 }), meta: counts.state === 0 ? '空' : stateChanges > 0 ? `${counts.state} 组 · 本轮 ${stateChanges}` : `${counts.state} 组` },
  ].map(item => ({ ...item, capability: sessionSectionCapability(item.id) }))
    .filter(item => capabilities[item.capability] || counts[item.id] > 0)
  return h('header', { className: css.contextNav }, h(WorkbenchTabs, { items, value: section, onChange: onSection, label: '会话 Wiki 内容', layoutId: 'rp-session-context-tab' }))
}

function SessionCharacterPanel({ profile, connection, available, onBind }) {
  const cardId = profile?.resources?.card?.id
  const card = useCharacterDetail(connection, available ? cardId : undefined)
  if (!available) return h(DisabledCapability, { label: '角色卡' })
  if (card.status === 'loading') return h(StateMessage, { title: '正在加载角色卡', description: '正在准备当前角色的资料。' })
  if (card.status === 'error') return isUnavailableWikiBinding(card.error)
    ? h(ContextEmpty, { quiet: true, icon: IconCharacterCardOutline16, title: '当前角色卡已不可用', description: '它会从后续回复资料中跳过；已有消息和故事状态不会受影响。', action: '重新选择角色卡', onAction: onBind })
    : h(StateMessage, { title: '暂时无法读取角色卡', description: userErrorMessage(card.error, 'detail') })
  return h('section', { className: `${css.contextPanel} ${css.referenceWorkbench}`, 'aria-label': '当前故事设定' },
    card.detail ? h('article', { className: css.referenceDocument },
      h('div', { className: css.documentHero },
        h(Avatar, { item: card.detail, connection }),
        h('span', null, h('small', { className: css.eyebrow }, '角色卡'), h('h3', null, card.detail.name))),
      h(CharacterDetail, { detail: card.detail, compact: false }))
      : h(ContextEmpty, { quiet: true, icon: IconCharacterCardOutline16, title: '当前对话没有使用角色卡', description: '可以直接继续对话，也可以为后续回复选择一张角色卡。', action: '选择并绑定', onAction: onBind }))
}

function SessionLorebooksPanel({ profile, connection, available, onBind }) {
  const loreIds = (profile?.resources?.lorebooks ?? []).map(binding => binding.id)
  const [data, setData] = useState({ lorebooks: [], unavailable: 0, loading: true, error: null })
  const [selectedId, setSelectedId] = useState(loreIds[0] ?? null)
  useEffect(() => {
    if (!available) { setData({ lorebooks: [], unavailable: 0, loading: false, error: null }); return }
    let live = true
    setData(current => ({ ...current, loading: true, error: null }))
    Promise.all(loreIds.map(async id => {
      try { return await rpc(connection, 'lorebooks/get', { id }) } catch (error) {
        if (isUnavailableWikiBinding(error)) return undefined
        throw error
      }
    }))
      .then(lorebooks => { if (live) setData({ lorebooks: lorebooks.filter(Boolean), unavailable: lorebooks.filter(item => item === undefined).length, loading: false, error: null }) })
      .catch(error => { if (live) setData({ lorebooks: [], unavailable: 0, loading: false, error }) })
    return () => { live = false }
  }, [available, connection, loreIds.join('\u0000')])
  if (!available) return h(DisabledCapability, { label: '世界书' })
  if (data.loading) return h(StateMessage, { title: '正在加载世界书', description: '正在准备当前会话使用的世界书。' })
  if (data.error) return h(StateMessage, { title: '有些世界书已经找不到了', description: userErrorMessage(data.error, 'detail') })
  return h('section', { className: `${css.contextPanel} ${css.referenceWorkbench} ${css.sessionDocumentWorkbench}`, 'aria-label': '当前会话的世界书' },
    data.unavailable > 0 && data.lorebooks.length > 0
      ? h(InlineNotice, { message: `${data.unavailable} 本已绑定世界书不可用，后续回复会跳过。`, action: '重新选择', onAction: onBind })
      : null,
    data.lorebooks.length
      ? h(SessionDocumentBrowser, {
        items: data.lorebooks,
        selectedId,
        onSelect: setSelectedId,
        indexTitle: '世界书目录',
        countLabel: `${data.lorebooks.length} 本`,
        itemMeta: book => `${book.entries?.length ?? 0} 条设定`,
        renderDocument: book => h('article', { className: css.referenceDocument },
          h(WikiDocumentHeader, {
            eyebrow: '世界书',
            title: book.name,
            description: `世界描述 ${book.slots?.worldDescription ?? 0} · 扮演指导 ${book.slots?.roleplayGuide ?? 0} · 重要规则 ${book.slots?.importantRules ?? 0}`,
            badge: `${book.entries?.length ?? 0} 条设定`,
          }),
          h(LoreWikiDetail, { detail: book })),
      })
      : h(ContextEmpty, { quiet: true, icon: IconLinkOutline16, title: loreIds.length > 0 ? '已绑定的世界书不可用' : '当前对话没有使用世界书', description: loreIds.length > 0 ? '不可用的世界书会从后续回复资料中跳过，不会阻止继续对话。' : '可以直接继续对话，也可以为后续回复选择一本或多本世界书。', action: loreIds.length > 0 ? '重新选择世界书' : '选择并绑定', onAction: onBind }))
}

function SessionSharedAssetPanel({ kind, profile, connection, available, onBind }) {
  const ids = kind === 'writingStyle'
    ? (profile?.resources?.writingStyles ?? []).map(binding => binding.id)
    : [kind === 'persona' ? profile?.resources?.persona?.id : profile?.resources?.preset?.id].filter(Boolean)
  const [data, setData] = useState({ items: [], unavailable: 0, loading: true, error: null })
  const [selectedId, setSelectedId] = useState(ids[0] ?? null)
  useEffect(() => {
    if (!available) { setData({ items: [], unavailable: 0, loading: false, error: null }); return }
    let live = true
    setData(current => ({ ...current, loading: true, error: null }))
    Promise.all(ids.map(async id => {
      try { return await rpc(connection, `${assetRoutePrefix(kind)}/get`, { id }) } catch (error) {
        if (isUnavailableWikiBinding(error)) return undefined
        throw error
      }
    }))
      .then(items => { if (live) setData({ items: items.filter(Boolean), unavailable: items.filter(item => item === undefined).length, loading: false, error: null }) })
      .catch(error => { if (live) setData({ items: [], unavailable: 0, loading: false, error }) })
    return () => { live = false }
  }, [available, connection, ids.join('\u0000'), kind])
  const label = assetKindLabel(kind)
  if (!available) return h(DisabledCapability, { label })
  if (data.loading) return h(StateMessage, { title: `正在加载${label}`, description: '正在准备当前对话使用的资料。' })
  if (data.error) return h(StateMessage, { title: `当前${label}已经找不到了`, description: userErrorMessage(data.error, 'detail') })
  return h('section', { className: `${css.contextPanel} ${css.referenceWorkbench} ${css.sessionDocumentWorkbench}`, 'aria-label': `当前对话的${label}` },
    data.unavailable > 0 && data.items.length > 0
      ? h(InlineNotice, { message: `${data.unavailable} 项已绑定${label}不可用，后续回复会跳过。`, action: '重新选择', onAction: onBind })
      : null,
    data.items.length
      ? h(SessionDocumentBrowser, {
        items: data.items,
        selectedId,
        onSelect: setSelectedId,
        indexTitle: kind === 'writingStyle' ? '文风目录' : `${label}目录`,
        countLabel: kind === 'writingStyle' ? `${data.items.length} 种` : `${data.items.length} 个`,
        itemMeta: item => item.description || (kind === 'writingStyle' ? '当前使用的文风' : `当前使用的${label}`),
        renderDocument: (item, index) => h('article', { className: css.referenceDocument },
          h(WikiDocumentHeader, {
            eyebrow: label,
            title: item.name,
            description: item.description,
            badge: sharedAssetBadge(kind, item, index, data.items.length),
          }),
          h(SharedAssetDetail, { kind, detail: item })),
      })
      : h(ContextEmpty, { quiet: true, icon: kind === 'writingStyle' ? IconEditOutline16 : IconAgentPresetOutline16, title: ids.length > 0 ? `当前${label}已不可用` : `当前对话没有使用${label}`, description: ids.length > 0 ? `它会从后续回复资料中跳过，不会阻止继续对话。` : `可以直接继续对话，也可以为后续回复选择${label}。`, action: ids.length > 0 ? `重新选择${label}` : '选择并绑定', onAction: onBind }))
}

function SessionWikiBindingPanel({ kind, profile, connection, sessionId, onCancel, onBound }) {
  const spec = sessionBindingSpec(kind)
  const [items, setItems] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedRevision, setSavedRevision] = useState(null)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  useEffect(() => {
    let live = true
    setLoading(true)
    setError(null)
    setItems([])
    setSelectedIds([])
    void rpc(connection, spec.listEndpoint, { limit: 100 }).then(value => {
      if (!live) return
      const ready = readyBindingItems(value?.items)
      const availableIds = new Set(ready.map(item => item.id))
      setItems(ready)
      setSelectedIds(currentSessionBindingIds(profile, kind).filter(id => availableIds.has(id)))
      setLoading(false)
    }, reason => {
      if (!live) return
      setError({ reason, intent: 'load' })
      setLoading(false)
    })
    return () => { live = false }
  }, [connection, kind, reloadKey, spec.listEndpoint])
  useEffect(() => {
    if (savedRevision === null || Number(profile?.revision) < savedRevision) return
    onBound()
  }, [onBound, profile?.revision, savedRevision])
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const visibleItems = normalizedQuery.length === 0
    ? items
    : items.filter(item => `${item.name ?? ''}\n${item.description ?? ''}`.toLocaleLowerCase().includes(normalizedQuery))
  const toggle = id => {
    if (saving || savedRevision !== null) return
    if (!spec.multi) { setSelectedIds([id]); return }
    setSelectedIds(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id])
  }
  const save = async () => {
    if (selectedIds.length === 0 || saving || savedRevision !== null) return
    setSaving(true)
    setError(null)
    try {
      const next = await rpc(connection, 'session/bind', {
        sessionId,
        expectedRevision: profile?.revision ?? 0,
        ...sessionBindingRequest(kind, selectedIds),
      })
      if (!Number.isSafeInteger(next?.revision)) onBound()
      else setSavedRevision(next.revision)
    } catch (reason) {
      setError({ reason, intent: 'save' })
      setSaving(false)
    }
  }
  return h('section', { className: css.sessionBindingPanel, 'aria-label': `绑定${spec.label}` },
    h('header', { className: css.sessionBindingHeader },
      h(m.button, { ...gestures, type: 'button', className: css.sessionBindingBack, disabled: saving || savedRevision !== null, onClick: onCancel }, '← 返回'),
      h('span', null,
        h('small', { className: css.eyebrow }, '会话 Wiki'),
        h('h3', null, `选择并绑定${spec.label}`),
        h('p', null, spec.multi ? '可选择多项；保存后仅更新这一类资料，其他会话资料保持不变。' : '保存后仅更新这项资料，其他会话资料保持不变。'))),
    error ? h(InlineNotice, { message: userErrorMessage(error.reason, error.intent), action: error.intent === 'load' ? '重新加载' : undefined, onAction: error.intent === 'load' ? () => setReloadKey(value => value + 1) : undefined }) : null,
    loading
      ? h(StateMessage, { title: `正在加载${spec.label}`, description: '正在读取资料库中的可用内容。' })
      : error?.intent === 'load'
        ? h(ContextEmpty, { quiet: true, icon: bindingIcon(kind), title: `暂时无法读取${spec.label}`, description: '当前对话仍可继续；重新加载后再选择资料。' })
      : items.length === 0
        ? h(ContextEmpty, { quiet: true, icon: bindingIcon(kind), title: spec.emptyTitle, description: spec.emptyDescription })
        : h(React.Fragment, null,
          h('label', { className: css.sessionBindingSearch },
            h('span', { className: css.srOnly }, `搜索${spec.label}`),
            h('input', { value: query, disabled: saving || savedRevision !== null, onChange: event => setQuery(event.target.value), placeholder: `搜索${spec.label}` })),
          visibleItems.length === 0
            ? h(ContextEmpty, { quiet: true, icon: bindingIcon(kind), title: '没有匹配的资料', description: '换一个名称或关键词再试。' })
            : h('div', { className: css.sessionBindingList, role: 'listbox', 'aria-label': `可绑定的${spec.label}`, 'aria-multiselectable': spec.multi ? 'true' : undefined },
              ...visibleItems.map(item => {
                const selected = selectedIds.includes(item.id)
                return h(m.button, {
                  ...gestures,
                  key: item.id,
                  type: 'button',
                  role: 'option',
                  className: css.sessionBindingOption,
                  'aria-selected': selected,
                  disabled: saving || savedRevision !== null,
                  onClick: () => toggle(item.id),
                },
                h('span', { className: css.sessionBindingMark, 'data-selected': selected ? 'true' : 'false', 'aria-hidden': true }, selected ? '✓' : ''),
                h('span', { className: css.sessionBindingCopy },
                  h('strong', null, item.name ?? `未命名${spec.label}`),
                  h('small', null, item.description || bindingItemMeta(kind, item))))
              }))),
    items.length > 0 ? h('footer', { className: css.sessionBindingFooter },
      h('span', null, selectedIds.length > 0 ? `已选择 ${selectedIds.length} 项` : `请选择${spec.label}`),
      h('span', { className: css.sessionBindingActions },
        h(Button, { variant: 'outline', disabled: saving || savedRevision !== null, onClick: onCancel }, '取消'),
        h(Button, { disabled: selectedIds.length === 0 || saving || savedRevision !== null, onClick: () => void save() }, savedRevision !== null ? '已保存，正在更新…' : saving ? '正在绑定…' : `绑定${spec.label}`))) : null)
}

function bindingIcon(kind) {
  if (kind === 'character') return IconCharacterCardOutline16
  if (kind === 'lorebooks') return IconLinkOutline16
  if (kind === 'preset') return IconListPenOutline16
  if (kind === 'writingStyles') return IconEditOutline16
  return IconAgentPresetOutline16
}

function bindingItemMeta(kind, item) {
  if (kind === 'character') return item.tags?.length ? item.tags.join(' · ') : '角色卡'
  if (kind === 'lorebooks') return `${item.entries ?? 0} 条设定`
  if (kind === 'preset') return `${item.fields ?? 0} 个栏位`
  return kind === 'writingStyles' ? '文风要求' : '我的人设'
}

function isUnavailableWikiBinding(error) {
  return ['ASSET_NOT_FOUND', 'ASSET_CORRUPT', 'UNSUPPORTED_FORMAT', 'UNSUPPORTED_SCHEMA', 'LIMIT_EXCEEDED'].includes(error?.code)
}

function SharedAssetDetail({ kind, detail }) {
  if (kind === 'persona') return h(React.Fragment, null,
    detail.tags?.length ? h('div', { className: css.tags }, ...detail.tags.map(tag => h('span', { key: tag }, tag))) : null,
    ...[['性格', detail.personality], ['场景中的身份', detail.scenario], ['表达示例', detail.firstMessage]].filter(([, value]) => value).map(([label, value]) => h(WikiDetailSection, { key: label, label, value })))
  if (kind === 'preset') return h(PresetWikiDetail, { detail })
  return h(React.Fragment, null,
    h(WikiDetailSection, { label: '文风要求', value: detail.content }))
}

function sharedAssetBadge(kind, item, index, total) {
  if (kind === 'preset') return `${item.fields?.length ?? 0} 个栏位`
  if (kind === 'writingStyle') return total > 1 ? `${index + 1} / ${total}` : '已使用'
  return item.tags?.length ? `${item.tags.length} 个标签` : '已使用'
}

function assetRoutePrefix(kind) { return ({ character: 'characters', lorebook: 'lorebooks', persona: 'personas', preset: 'presets', writingStyle: 'writing-styles' })[kind] }
function DisabledCapability({ label }) {
  return h(StateMessage, {
    title: `${label}功能未启用`,
    description: '已有对话关联仍会保留。启用该功能后，可以继续读取和调整这项资料。',
  })
}
function SessionStatePanel({ state, activity, available }) {
  const namespaces = Object.entries(state?.namespaces ?? {})
  const initialNamespace = namespaces[0]?.[0] ?? null
  const [selected, setSelected] = useState(initialNamespace)
  const [view, setView] = useState(() => preferredStateDetailView(activity, initialNamespace))
  useEffect(() => {
    if (namespaces.length === 0) { setSelected(null); return }
    if (!namespaces.some(([id]) => id === selected)) setSelected(namespaces[0][0])
  }, [namespaces.map(([id]) => id).join('\u0000'), selected])
  useEffect(() => {
    if (selected !== null) setView(preferredStateDetailView(activity, selected))
  }, [activity, selected])
  const active = namespaces.find(([id]) => id === selected)
  return h(React.Fragment, null,
    available ? null : h(DisabledCapability, { label: '会话变量' }),
    h('section', { className: css.contextPanel, 'aria-label': '故事状态' },
    namespaces.length === 0
      ? h(ContextEmpty, { quiet: true, icon: IconDataOutline16, title: '还没有故事状态', description: '角色或世界发生变化后，会按分组显示在这里。' })
      : h('div', { className: css.stateBrowser },
        h('nav', { className: css.namespaceList, 'aria-label': '状态分组' }, ...namespaces.map(([id, value]) => {
          const changeCount = stateActivityChanges(activity, id).length
          return h('button', {
            key: id,
            type: 'button',
            'aria-current': selected === id ? 'true' : undefined,
            'data-has-changes': changeCount > 0 ? 'true' : undefined,
            onClick: () => { setSelected(id); setView(preferredStateDetailView(activity, id)) },
          }, h('span', null,
            h('strong', null, stateNamespaceTitle(id, value)),
            h('small', null, `版本 ${value.revision ?? '—'}${changeCount > 0 ? ` · 本轮 ${changeCount} 项` : ''}`)),
          h(Pill, { className: css.statePill }, `${countStateItems(value.value)} 项`))
        })),
        active ? h('article', { className: css.namespaceDetail },
          h('header', null,
            h('div', null,
              h('h4', null, stateNamespaceTitle(active[0], active[1])),
              h('p', null, active[1].definition?.description ?? `${countStateItems(active[1].value)} 项当前状态`)),
            h('div', { className: css.stateNamespaceMeta },
              h(Pill, { className: css.statePill }, stateUpdateModeLabel(active[1].definition?.updateMode)),
              h(Pill, { className: css.statePill }, `版本 ${active[1].revision ?? '—'}`))),
          h(StateViewTabs, {
            value: view,
            onChange: setView,
            currentCount: countStateItems(active[1].value),
            changeCount: stateActivityChanges(activity, active[0]).length,
          }),
          view === 'changes'
            ? h(ContentTransition, { viewKey: `${active[0]}-changes`, className: css.stateSubviewTransition },
                h('div', { className: `${css.stateViewPane} ${css.stateChangePane}`, role: 'tabpanel', 'aria-label': '本轮变化' },
                  h(StateChangeSummary, { namespace: active[0], snapshot: active[1], activity })))
            : h(ContentTransition, { viewKey: `${active[0]}-current`, className: css.stateSubviewTransition },
                h('div', { className: `${css.semanticStateTree} ${css.stateViewPane}`, role: 'tabpanel', 'aria-label': '当前状态' },
                  h(StateValueView, {
                    value: active[1].value,
                    label: stateNamespaceTitle(active[0], active[1]),
                    schema: active[1].definition?.schema,
                    rules: active[1].definition?.rules ?? [],
                    root: true,
                  }),
                  h(StateRuleCatalog, { rules: active[1].definition?.rules ?? [] }),
                  h(StateDiagnostics, { diagnostics: active[1].diagnostics })))) : null)))
}

function StateViewTabs({ value, onChange, currentCount, changeCount }) {
  const refs = useRef([])
  const tabs = [
    { id: 'changes', label: '本轮变化', meta: changeCount > 0 ? `${changeCount} 项` : '无变化' },
    { id: 'current', label: '当前状态', meta: `${currentCount} 项` },
  ]
  const selectByKeyboard = (event, index) => {
    const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length
      : event.key === 'ArrowLeft' ? (index - 1 + tabs.length) % tabs.length
        : event.key === 'Home' ? 0
          : event.key === 'End' ? tabs.length - 1
            : null
    if (next === null) return
    event.preventDefault()
    onChange(tabs[next].id)
    refs.current[next]?.focus()
  }
  return h('div', { className: css.stateViewTabs, role: 'tablist', 'aria-label': '状态详情' }, ...tabs.map((tab, index) => h('button', {
    key: tab.id,
    ref: node => { refs.current[index] = node },
    type: 'button',
    role: 'tab',
    tabIndex: value === tab.id ? 0 : -1,
    'aria-selected': value === tab.id,
    'data-has-changes': tab.id === 'changes' && changeCount > 0 ? 'true' : undefined,
    className: css.stateViewTab,
    onClick: () => onChange(tab.id),
    onKeyDown: event => selectByKeyboard(event, index),
  }, h('span', null, tab.label), h('small', null, tab.meta))))
}

function StateChangeSummary({ namespace, snapshot, activity }) {
  const changes = stateActivityChanges(activity, namespace)
  const total = stateActivityTotalCount(activity)
  const empty = activity?.available !== true
    ? '还没有回复提交过变量变化。'
    : total === 0
      ? '本轮没有变量变化。'
      : '本轮变化发生在其他状态分组。'
  return h('section', { className: css.stateChangeView, 'aria-label': '本轮变量变化', 'aria-live': 'polite' },
    h('header', { className: css.stateChangeIntro },
      h('span', null,
        h('h5', null, '最近一次成功回复'),
        h('p', null, changes.length > 0 ? `共更新 ${changes.length} 项变量，以下为变化内容与提交理由。` : empty)),
      h(Pill, { className: css.statePill }, changes.length > 0 ? `${changes.length} 项` : '无变化')),
    changes.length > 0
      ? h('div', { className: css.stateChangeList }, ...changes.map((change, index) => h(StateChangeItem, {
          key: `${change.path}-${index}`,
          change,
          schema: snapshot?.definition?.schema,
        })))
      : null)
}

function StateChangeItem({ change, schema }) {
  const values = stateChangeValues(change)
  return h('article', { className: css.stateChangeItem },
    h('header', null,
      h('strong', null, stateChangePathLabel(change.path, schema)),
      h(Pill, { className: css.statePill }, stateChangeOperationLabel(change))),
    h('dl', { className: css.stateChangeValues, 'data-single': values.length === 1 ? 'true' : 'false' },
      ...values.map(item => h('div', { key: item.label },
        h('dt', null, item.label),
        h('dd', { 'data-empty': item.state.exists ? undefined : 'true' }, formatStateActivityValue(item.state))))),
    h('p', { className: css.stateChangeReason }, h('span', null, '原因'), change.reason))
}

function stateChangeValues(change) {
  if (change.op === 'append') {
    const appended = change.after?.exists && Array.isArray(change.after.value) && change.after.value.length > 0
      ? { exists: true, value: change.after.value.at(-1) }
      : { exists: false }
    return [{ label: '新增内容', state: appended }, { label: '更新后', state: change.after }]
  }
  if (change.op === 'remove') return [{ label: '移除内容', state: change.before }]
  return [{ label: '之前', state: change.before }, { label: '现在', state: change.after }]
}

function stateChangeOperationLabel(change) {
  if (change.op === 'increment'
    && change.before?.exists && typeof change.before.value === 'number'
    && change.after?.exists && typeof change.after.value === 'number') {
    const delta = change.after.value - change.before.value
    if (delta > 0) return `增加 ${delta}`
    if (delta < 0) return `减少 ${Math.abs(delta)}`
  }
  return ({ increment: '数值调整', set: '设为新值', append: '追加一项', remove: '移除' })[change.op] ?? '更新'
}

function stateChangePathLabel(path, schema) {
  if (path === '') return '整个状态分组'
  const segments = String(path).slice(1).split('/').map(segment => segment.replaceAll('~1', '/').replaceAll('~0', '~'))
  const labels = []
  let current = schema
  for (const segment of segments) {
    if (current?.type === 'array') {
      labels.push(/^(?:0|[1-9][0-9]*)$/u.test(segment) ? `第 ${Number(segment) + 1} 项` : segment)
      current = current.items
      continue
    }
    const child = current?.properties?.[segment]
    labels.push(typeof child?.title === 'string' && child.title.trim().length > 0 ? child.title : segment)
    current = child
  }
  return labels.join(' / ')
}

function formatStateActivityValue(state) {
  if (state?.exists !== true) return '未设置'
  if (state.value !== null && typeof state.value === 'object') return JSON.stringify(state.value)
  return formatStateValue(state.value)
}

function StateValueView({ value, label, schema, rules = [], path = '', root = false, trail = [] }) {
  const matchingRules = rules.filter(rule => rule.target === path)
  if (!isComplex(value)) return h('div', { className: css.semanticStateRow },
    h('strong', null, label),
    h('div', { className: css.stateValueDetails },
      h('span', { className: css.semanticStateValue }, formatStateValue(value)),
      schema?.description ? h('p', null, schema.description) : null,
      schemaFacts(schema).length > 0 ? h('small', null, schemaFacts(schema).join(' · ')) : null,
      matchingRules.length > 0 ? h('ul', { className: css.stateInlineRules }, ...matchingRules.map(rule => h('li', { key: rule.id }, stateRuleSentence(rule)))) : null))
  const entries = Array.isArray(value) ? value.map((item, index) => [String(index), item]) : Object.entries(value ?? {})
  const currentTrail = root ? trail : [...trail, label]
  const childElement = ([key, child]) => {
    const array = Array.isArray(value)
    return h(StateValueView, {
      key,
      value: child,
      label: array ? `第 ${Number(key) + 1} 项` : schema?.properties?.[key]?.title ?? key,
      schema: array ? schema?.items : schema?.properties?.[key],
      rules,
      path: `${path}/${escapeStatePointer(key)}`,
      trail: currentTrail,
    })
  }
  if (entries.length === 0) return h(StateValueGroup, {
    root,
    segments: currentTrail,
    description: schema?.description,
    empty: true,
  })
  if (!root && schema?.description) return h(StateValueGroup, {
    segments: currentTrail,
    description: schema.description,
  }, ...entries.map(childElement))
  const blocks = []
  let directFields = []
  const flushDirectFields = () => {
    if (directFields.length === 0) return
    blocks.push(h(StateValueGroup, {
      key: `fields-${directFields[0][0]}`,
      root,
      segments: currentTrail,
    }, ...directFields.map(childElement)))
    directFields = []
  }
  for (const entry of entries) {
    if (!isComplex(entry[1])) {
      directFields.push(entry)
      continue
    }
    flushDirectFields()
    blocks.push(childElement(entry))
  }
  flushDirectFields()
  return h(React.Fragment, null, ...blocks)
}

function StateValueGroup({ root = false, segments, description, empty = false, children }) {
  return h('section', { className: css.semanticStateGroup, 'data-root': root ? 'true' : undefined },
    root ? null : h('header', null,
      h(StateGroupPath, { segments }),
      description ? h('small', null, description) : null),
    empty ? h('span', { className: css.semanticStateEmpty }, '空') : null,
    children)
}

function StateGroupPath({ segments }) {
  const label = segments.join(' / ')
  return h('h5', { className: css.stateGroupPath, 'aria-label': `分组：${segments.join('，')}`, title: label },
    ...segments.map((segment, index) => h('span', { key: `${index}-${segment}`, 'aria-hidden': 'true' }, segment)))
}

function StateRuleCatalog({ rules }) {
  if (!Array.isArray(rules) || rules.length === 0) return null
  return h('section', { className: css.stateReferenceSection, 'aria-label': '变量更新规则' },
    h('h5', null, '更新规则'),
    h('div', { className: css.stateRuleList }, ...rules.map(rule => h('article', { key: rule.id },
      h('header', null, h('strong', null, rule.when), h(Pill, { className: css.statePill }, rule.cadence === 'every-turn' ? '每轮检查' : '适用时')),
      h('p', null, stateRuleSentence(rule)),
      rule.condition ? h('code', null, rule.condition) : null,
      ...(rule.guidance ?? []).map((item, index) => h('small', { key: `${rule.id}-${index}` }, item))))))
}

function StateDiagnostics({ diagnostics }) {
  const setup = Array.isArray(diagnostics?.setup) ? diagnostics.setup : []
  const lastCommit = Array.isArray(diagnostics?.lastCommit) ? diagnostics.lastCommit : []
  if (setup.length === 0 && lastCommit.length === 0) return null
  return h('section', { className: css.stateReferenceSection, 'aria-label': '状态诊断' },
    h('h5', null, '检查提示'),
    setup.length > 0 ? h('div', null, h('strong', null, '初始化'), h('ul', null, ...setup.map((item, index) => h('li', { key: `setup-${index}` }, stateDiagnosticText(item))))) : null,
    lastCommit.length > 0 ? h('div', null, h('strong', null, '最近一次回复'), h('ul', null, ...lastCommit.map((item, index) => h('li', { key: `commit-${index}` }, stateDiagnosticText(item))))) : null)
}

function stateNamespaceTitle(id, snapshot) {
  return typeof snapshot?.definition?.title === 'string' && snapshot.definition.title.trim().length > 0
    ? snapshot.definition.title
    : namespaceLabel(id)
}

function stateUpdateModeLabel(mode) {
  return ({ 'rules-required': '按规则更新', 'schema-only': '按结构更新', disabled: '只读' })[mode] ?? '更新方式未知'
}

function stateRuleSentence(rule) {
  const effect = rule?.effect ?? {}
  const operation = effect.op === 'increment'
    ? `增减 ${effect.minimum ?? '不限'}～${effect.maximum ?? '不限'}`
    : ({ set: '设为新值', append: '追加一项', remove: '删除字段' })[effect.op] ?? '更新'
  return `${rule.target ?? '变量'}：${operation}${rule.when ? `；${rule.when}` : ''}`
}

function stateDiagnosticText(item) {
  const message = typeof item?.message === 'string' && item.message.length > 0 ? item.message : '状态检查发现一项需要留意的内容。'
  return item?.path ? `${message}（${item.path}）` : message
}

function schemaFacts(schema) {
  if (!schema || typeof schema !== 'object') return []
  const facts = []
  const types = Array.isArray(schema.type) ? schema.type : schema.type ? [schema.type] : []
  if (types.length > 0) facts.push(`类型：${types.map(stateTypeLabel).join(' / ')}`)
  if (schema.minimum !== undefined || schema.maximum !== undefined) facts.push(`范围：${schema.minimum ?? '不限'} ～ ${schema.maximum ?? '不限'}`)
  if (schema.minLength !== undefined || schema.maxLength !== undefined) facts.push(`长度：${schema.minLength ?? 0} ～ ${schema.maxLength ?? '不限'}`)
  if (schema.minItems !== undefined || schema.maxItems !== undefined) facts.push(`条目数：${schema.minItems ?? 0} ～ ${schema.maxItems ?? '不限'}`)
  if (Array.isArray(schema.enum)) facts.push(`可选：${schema.enum.map(formatStateValue).join('、')}`)
  if (Object.prototype.hasOwnProperty.call(schema, 'const')) facts.push(`固定值：${formatStateValue(schema.const)}`)
  return facts
}

function stateTypeLabel(type) {
  return ({ object: '对象', array: '列表', string: '文本', integer: '整数', number: '数值', boolean: '是/否', null: '空值' })[type] ?? String(type)
}

function escapeStatePointer(segment) {
  return String(segment).replaceAll('~', '~0').replaceAll('/', '~1')
}

function formatStateValue(value) {
  if (value === null || value === undefined || value === '') return '空'
  if (typeof value === 'boolean') return value ? '是' : '否'
  return String(value)
}

function ContextEmpty({ icon: Icon, title, description, quiet = false, action, onAction }) {
  return h('div', { className: quiet ? `${css.contextEmpty} ${css.contextEmptyQuiet}` : css.contextEmpty },
    h('span', null, h(Icon, { size: 22 })),
    h('strong', null, title),
    h('p', null, description),
    action ? h(m.button, { ...gestures, type: 'button', className: css.contextEmptyAction, onClick: onAction }, action) : null)
}

function LoadingGlyph() {
  return h(m.span, { className: css.spinner, animate: { rotate: 360 }, transition: { duration: 0.8, repeat: Infinity, ease: 'linear' }, 'aria-hidden': true })
}

function InlineNotice({ message, action, onAction }) {
  return h('div', { className: css.inlineNotice, role: 'alert' },
    h('span', null, message),
    action ? h(m.button, { ...gestures, type: 'button', onClick: onAction }, action) : null)
}

function namespaceLabel(id) {
  const known = { variables: '故事变量', world: '世界状态', relationship: '关系状态' }
  if (known[id] !== undefined) return known[id]
  if (String(id).includes('relationship')) return '关系状态'
  if (String(id).includes('world')) return '世界状态'
  if (String(id).includes('character')) return '角色状态'
  if (String(id).includes('variable')) return '故事变量'
  const tail = String(id).split(/[./:]/).filter(Boolean).at(-1) ?? String(id)
  return tail.replaceAll(/[-_]+/g, ' ').replace(/^./u, character => character.toLocaleUpperCase())
}

function SetupSteps({ step }) {
  const steps = [['assets', '1', '设置'], ['opening', '2', '开场白']]
  const active = steps.findIndex(([id]) => id === step)
  return h('ol', { className: css.setupSteps, 'aria-label': '会话设置进度' }, ...steps.map(([id, number, label], index) => h('li', {
    key: id,
    className: index <= active ? css.setupStepActive : '',
    'aria-current': index === active ? 'step' : undefined,
  }, h('span', null, index < active ? '✓' : number), h('strong', null, label))))
}

function cardOpeningOptions(card) {
  if (card === null) return []
  const values = [card.character?.firstMessage, ...(Array.isArray(card.character?.alternateGreetings) ? card.character.alternateGreetings : [])]
  return values.flatMap((value, index) => typeof value === 'string' && value.trim().length > 0 ? [{ index, text: value.trim() }] : [])
}

function OpeningStep({ card, selectedCard, connection, openingIndex, onOpeningIndex, mode, onMode, customOpening, onCustomOpening }) {
  const openings = cardOpeningOptions(card)
  const cardStatus = selectedCard === null
    ? '需要先在上一步选择角色卡'
    : card === null
      ? '正在读取角色卡…'
      : openings.length > 0
        ? `${openings.length} 个开场可选`
        : '这张角色卡没有可用的开场白'
  const modes = [
    { id: 'card', title: '从角色卡选择', detail: cardStatus, disabled: selectedCard === null },
    { id: 'custom', title: '自定义', detail: '自己写下对话中显示的第一段正文' },
    { id: 'skip', title: '跳过', detail: '不添加开场白，直接进入对话' },
  ]
  const characters = [...customOpening].length
  return h('section', { className: css.openingWizard, 'aria-label': '选择开场白' },
    h('header', { className: css.openingWizardIntro },
      h('span', { className: css.openingWizardIntroIcon }, h(IconListPenOutline16, { size: 18 })),
      h('span', null, h('strong', null, '选择如何开始这段对话'), h('small', null, '开场白会作为第一段正文出现。你也可以不添加，直接发送自己的第一条消息。'))),
    h('div', { className: css.openingModeTabs, role: 'radiogroup', 'aria-label': '开场白来源' }, ...modes.map(option => h(m.button, {
      ...gestures,
      key: option.id,
      type: 'button',
      role: 'radio',
      disabled: option.disabled,
      'aria-checked': mode === option.id,
      'data-active': mode === option.id ? 'true' : 'false',
      className: css.openingModeButton,
      onClick: () => onMode(option.id),
    }, h('span', { className: css.openingModeIndicator, 'aria-hidden': true }, mode === option.id ? '✓' : ''), h('span', null, h('strong', null, option.title), h('small', null, option.detail))))),
    h(ContentTransition, { viewKey: `opening:${mode}` },
      mode === 'card'
        ? h('div', { className: css.openingModePanel },
          selectedCard !== null && card === null
            ? h('div', { className: css.reviewLoading }, h(LoadingGlyph), '正在准备角色卡中的开场白…')
            : openings.length === 0
              ? h('div', { className: css.openingEmpty }, h('strong', null, '没有可选择的角色卡开场白'), h('p', null, '返回上一步选择其他角色卡，或改用自定义或跳过。'))
              : h(React.Fragment, null,
                h('div', { className: css.openingCardMeta },
                  h(Avatar, { item: card, connection }),
                  h('span', null, h('small', null, '角色卡'), h('strong', null, card.name))),
                openings.length > 1 ? h('div', { className: css.openingChoiceList, role: 'radiogroup', 'aria-label': '角色卡开场白' }, ...openings.map(option => h(m.button, {
                  ...gestures,
                  key: option.index,
                  type: 'button',
                  role: 'radio',
                  'aria-checked': openingIndex === option.index,
                  'data-active': openingIndex === option.index ? 'true' : 'false',
                  className: css.openingChoice,
                  onClick: () => onOpeningIndex(option.index),
                }, option.index === 0 ? '默认开场' : `备用开场 ${option.index}`))) : null,
                h('blockquote', { className: css.openingPreview }, openings.find(option => option.index === openingIndex)?.text ?? openings[0].text)))
        : mode === 'custom'
          ? h('div', { className: css.openingModePanel },
            h('label', { className: css.customOpeningEditor },
              h('span', null, h('strong', null, '自定义开场白'), h('small', null, '可以是旁白、对白、场景描述，或任何你希望作为第一段显示的内容。')),
              h('textarea', {
                value: customOpening,
                onChange: event => onCustomOpening(event.target.value),
                placeholder: '例如：雨停后的车站只剩下你和远处的钟声……',
                'aria-describedby': 'rp-custom-opening-count',
              }),
              h('small', { id: 'rp-custom-opening-count', className: css.openingCounter, 'data-over': characters > MAX_OPENING_CHARACTERS ? 'true' : 'false' }, `${formatNumber(characters)} / ${formatNumber(MAX_OPENING_CHARACTERS)} 字`)))
          : h('div', { className: `${css.openingModePanel} ${css.openingSkip}` },
            h('span', { 'aria-hidden': true }, '→'),
            h('strong', null, '不添加开场白'),
            h('p', null, '完成设置后直接进入对话。你发送的第一条消息会成为故事的起点。'))),
    selectedCard !== null ? h('p', { className: css.openingLockHint }, '开场白发送后会保留在历史中；角色卡关联仍可在之后的对话中调整。') : null)
}

function SetupFooter({ step, onClose, onBack, onNext, onSave, invalid, saving, pendingRevision, selectionSummary, openingMode, customOpeningCharacters, includesOpening, saveLabel }) {
  const openingLabel = openingMode === 'card'
    ? '使用角色卡开场白'
    : openingMode === 'custom'
      ? `使用自定义开场 · ${formatNumber(customOpeningCharacters)} 字`
      : '不添加开场白'
  return h('div', { className: css.footerContent },
    h('div', { className: css.setupFooterCopy }, step === 'assets' ? selectionSummary : h(React.Fragment, null, h('strong', null, openingLabel), h('span', null, '返回上一步仍可调整会话资料'))),
    step === 'assets' ? h(Button, { variant: 'outline', onClick: onClose }, '取消') : h(Button, { variant: 'outline', onClick: onBack }, '上一步'),
    h(Button, {
      variant: 'primary',
      disabled: invalid || saving || pendingRevision !== null,
      onClick: includesOpening && step !== 'opening' ? onNext : onSave,
    }, pendingRevision !== null ? '正在应用…' : saving ? '正在保存…' : includesOpening && step !== 'opening' ? '下一步：开场白' : saveLabel))
}

function BindingSummary({ selectedCard, lists, selectedNames, selectedPersona, selectedPreset, selectedWritingStyles }) {
  return h('div', { className: css.bindingSummary },
    h('strong', null, selectedCard ? lists.characters.find(item => item.id === selectedCard)?.name ?? '已选角色卡' : '未选择角色卡'),
    h('span', null, [selectedNames.length ? `${selectedNames.length} 本世界书` : '无世界书', lists.personas.find(item => item.id === selectedPersona)?.name ?? '无人设', lists.presets.find(item => item.id === selectedPreset)?.name ?? '无预设', selectedWritingStyles.length ? `${selectedWritingStyles.length} 种文风` : '无文风'].join(' · ')))
}

function SessionResourceSelectors({ lists, capabilities, selectedPersona, selectedPreset, selectedWritingStyles, stylesAvailable, maxWritingStyles, onPersona, onPreset, onWritingStyles, onDefaults }) {
  const visible = capabilities.personas || capabilities.presets || capabilities.writingStyles
  if (!visible) return null
  const hasDefaults = (capabilities.personas && lists.defaultPersonaId !== null)
    || (capabilities.presets && lists.defaultPresetId !== null)
    || (capabilities.writingStyles && lists.defaultWritingStyleId !== null)
  const personas = lists.personas.filter(item => item.status !== 'corrupt')
  const presets = lists.presets.filter(item => item.status !== 'corrupt')
  const writingStyles = lists.writingStyles.filter(item => item.status !== 'corrupt')
  const unavailableWritingStyles = selectedWritingStyles.filter(id => !writingStyles.some(item => item.id === id)).map(id => ({ id, name: '已失效的文风' }))
  const writingStyleOptions = [...writingStyles, ...unavailableWritingStyles]
  const persona = personas.find(item => item.id === selectedPersona)
  const preset = presets.find(item => item.id === selectedPreset)
  const selectedStyles = selectedWritingStyles.map(id => writingStyleOptions.find(item => item.id === id))
  const personaSummary = persona === undefined ? '不使用人设' : `${persona.name}${persona.isDefault ? '（默认）' : ''}`
  const presetSummary = preset === undefined ? '不使用预设' : `${preset.name}${preset.isDefault ? '（默认）' : ''} · ${preset.fields} 项`
  const writingStyleSummary = selectedStyles.length === 0
    ? '不使用文风'
    : selectedStyles.length === 1
      ? `${selectedStyles[0].name}${selectedStyles[0].isDefault ? '（默认）' : ''}`
      : `已选 ${selectedStyles.length} 种文风`
  return h('section', { className: css.sessionResourceSelectors, 'data-selection-only': 'true', 'aria-label': '选择人设、预设和文风' },
    h('header', { className: css.sessionResourceHeader }, h('strong', null, '回复偏好'),
      hasDefaults ? h(m.button, { ...gestures, type: 'button', className: css.sessionResourceDefault, onClick: onDefaults, title: '恢复资料库中的默认人设、预设和文风' }, '恢复默认') : null),
    h('div', { className: css.sessionResourceFields },
      capabilities.personas ? h(SessionResourcePicker, {
        label: '我的人设', icon: IconAgentPresetOutline16, summary: personaSummary,
        items: [{ id: EMPTY_RESOURCE_SELECTION, label: '不使用人设' }, ...personas.map(item => ({ id: item.id, label: `${item.name}${item.isDefault ? '（默认）' : ''}` }))],
        selectedId: selectedPersona ?? EMPTY_RESOURCE_SELECTION,
        onSelect: id => onPersona(id === EMPTY_RESOURCE_SELECTION ? null : id),
      }) : null,
      capabilities.presets ? h(SessionResourcePicker, {
        label: '预设', icon: IconListPenOutline16, summary: presetSummary,
        items: [{ id: EMPTY_RESOURCE_SELECTION, label: '不使用预设' }, ...presets.map(item => ({ id: item.id, label: `${item.name}${item.isDefault ? '（默认）' : ''} · ${item.fields} 项` }))],
        selectedId: selectedPreset ?? EMPTY_RESOURCE_SELECTION,
        onSelect: id => onPreset(id === EMPTY_RESOURCE_SELECTION ? null : id),
      }) : null,
      stylesAvailable ? h(SessionResourcePicker, {
        label: '文风', icon: IconEditOutline16, summary: writingStyleSummary, multiple: true,
        items: [{ id: EMPTY_RESOURCE_SELECTION, label: '不使用文风' }, ...writingStyleOptions.map(item => ({ id: item.id, label: `${item.name}${item.isDefault ? '（默认）' : ''}`, disabled: !selectedWritingStyles.includes(item.id) && selectedWritingStyles.length >= maxWritingStyles }))],
        selectedId: selectedWritingStyles.length === 0 ? EMPTY_RESOURCE_SELECTION : undefined,
        selectedIds: selectedWritingStyles,
        onSelect: id => onWritingStyles(ids => id === EMPTY_RESOURCE_SELECTION ? [] : ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id]),
      }) : null),
    selectedStyles.length > 1 ? h(WritingStyleOrder, { items: selectedStyles, onSelected: onWritingStyles }) : null)
}

function SessionResourcePicker({ label, icon: Icon, summary, items, selectedId, selectedIds, multiple = false, onSelect }) {
  const [open, setOpen] = useState(false)
  return h(Menu, {
    open,
    portal: true,
    dense: true,
    className: css.sessionResourceMenu,
    items,
    selectedId,
    selectedIds,
    footer: multiple ? [{ id: FINISH_RESOURCE_SELECTION, label: '完成' }] : undefined,
    onClose: () => setOpen(false),
    onSelect: id => {
      if (id === FINISH_RESOURCE_SELECTION) { setOpen(false); return }
      onSelect(id)
      if (!multiple) setOpen(false)
    },
    anchor: h(m.button, {
      ...gestures,
      type: 'button',
      className: css.sessionResourcePicker,
      'data-open': open ? 'true' : 'false',
      'aria-label': `${label}，当前：${summary}`,
      'aria-haspopup': 'menu',
      'aria-expanded': open,
      onClick: () => setOpen(value => !value),
    },
    h('span', { className: css.sessionResourcePickerIcon }, h(Icon, { size: 16 })),
    h('span', { className: css.sessionResourcePickerCopy }, h('small', null, label), h('strong', null, summary)),
    h(IconChevronDownOutline14, { size: 14, className: css.sessionResourcePickerChevron })),
  })
}

function WritingStyleOrder({ items, onSelected }) {
  return h('section', { className: `${css.orderPanel} ${css.writingStyleOrder}`, 'aria-label': '文风应用顺序' }, h('h3', null, '文风顺序'), h('p', null, '所选文风按顺序排列'),
    h(Reorder.Group, { axis: 'x', values: items, onReorder: rows => onSelected(rows.map(item => item.id)), className: css.orderList }, ...items.map((item, index) => h(Reorder.Item, { key: item.id, value: item, className: css.orderItem, layout: true, transition: layoutTransition }, h('span', { className: css.dragHandle, 'aria-hidden': true }, '⠿'), h('span', null, item.name), h('span', { className: css.orderActions }, h('button', { type: 'button', disabled: index === 0, 'aria-label': `上移文风 ${item.name}`, onClick: () => onSelected(ids => moveItem(ids, index, index - 1)) }, '↑'), h('button', { type: 'button', disabled: index === items.length - 1, 'aria-label': `下移文风 ${item.name}`, onClick: () => onSelected(ids => moveItem(ids, index, index + 1)) }, '↓'))))))
}

function AssetList({ tab, items, loading, error, onRetry, selectedCard, selectedLore, connection, selectionOnly = false, onCard, onClearCard, onLore, onInspect }) {
  if (loading && items.length === 0) return h(StateMessage, { title: '正在加载资料', description: '请稍候…' })
  if (error !== null && items.length === 0) return h(StateMessage, { title: '暂时无法读取资料库', description: '你的资料不会丢失，可以重新加载。', action: '重新加载', onAction: onRetry })
  if (!loading && items.length === 0) return h(StateMessage, {
    title: tab === 'characters' ? '还没有角色卡' : '还没有世界书',
    description: selectionOnly
      ? tab === 'characters' ? '当前没有可选择的角色卡，你可以跳过这一项。' : '当前没有可选择的世界书，你可以跳过这一项。'
      : tab === 'characters' ? '角色卡是可选的，可以直接开始，或进入对话后再创建。' : '世界书是可选的，也可以进入故事后再添加。',
  })
  return h('div', { className: css.assetList, role: tab === 'characters' ? 'radiogroup' : 'group' },
    tab === 'characters' ? h(m.button, { ...gestures, layout: true, transition: layoutTransition, type: 'button', role: 'radio', 'aria-checked': selectedCard === null, className: selectedCard === null ? css.assetSelected : css.assetRow, onClick: onClearCard },
      h('span', { className: css.avatarFallback }, '—'),
      h('span', { className: css.assetText }, h('strong', null, '暂不使用角色卡'), h('small', null, selectionOnly ? '不绑定角色资料，之后仍可返回调整' : '可以进入对话后再创建或选择')),
      h('span', { className: selectedCard === null ? css.checkOn : css.checkOff, 'aria-hidden': true }, '●')) : null,
    h(AnimatePresence, { initial: false }, ...items.map(item => {
      const selected = tab === 'characters' ? selectedCard === item.id : selectedLore.includes(item.id)
      return h(m.button, { ...gestures, layout: true, transition: layoutTransition, initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0, transition: exitTransition }, key: item.id, type: 'button', role: tab === 'characters' ? 'radio' : 'checkbox', 'aria-checked': selected, disabled: item.status === 'corrupt', className: selected ? css.assetSelected : css.assetRow, onClick: () => { onInspect(item.id); if (tab === 'characters') onCard(item); else onLore(item.id) } },
        tab === 'characters' ? h(Avatar, { item, connection }) : h('span', { className: css.bookAvatar }, '文'),
        h('span', { className: css.assetText }, h('strong', null, item.name), h('small', null, item.status === 'corrupt' ? '内容无法读取' : tab === 'characters' ? item.lorebookEntries > 0 ? `关联世界书 · ${item.lorebookEntries} 条设定` : '未关联世界书' : item.sourceCharacterId === selectedCard ? `当前角色卡关联 · ${item.entries} 条设定` : `${item.entries} 条设定`)),
        h('span', { className: selected ? css.checkOn : css.checkOff, 'aria-hidden': true }, tab === 'characters' ? '●' : '✓'))
    })))
}

function Avatar({ item, connection, sourceDisabled = false }) {
  const [source, setSource] = useState(null)
  useEffect(() => {
    if (!item.hasAvatar || sourceDisabled) return
    let live = true
    rpc(connection, 'characters/avatar', { id: item.id }).then(value => { if (live) setSource(`data:${value.mimeType};base64,${value.base64}`) }).catch(() => {})
    return () => { live = false }
  }, [connection, item.hasAvatar, item.id, sourceDisabled])
  return source ? h('img', { className: css.avatar, src: source, alt: '' }) : h('span', { className: css.avatarFallback }, (item.name?.trim()?.[0] ?? '卡').toLocaleUpperCase())
}

function AssetDetail({ tab, detail, state, onBack }) {
  const back = h('button', { type: 'button', className: css.mobileBack, onClick: onBack }, '← 返回列表')
  if (state === 'idle') return h('div', { className: css.detailEmpty }, back,
    h('span', { className: css.detailEmptyIcon }, tab === 'characters' ? h(IconCharacterCardOutline16, { size: 20 }) : h(IconLinkOutline16, { size: 20 })),
    h('strong', null, tab === 'characters' ? '查看角色卡详情' : '查看世界书详情'),
    h('p', null, tab === 'characters' ? '选择左侧角色卡，确认角色设定和关联世界书。' : '选择左侧世界书，查看其中的设定和启用状态。'))
  if (state === 'loading') return h('div', { className: css.detailEmpty }, back, h('span', { className: css.detailEmptyStatus }, h(LoadingGlyph), '正在加载详情…'))
  if (state === 'error') return h('div', { className: css.detailEmpty, role: 'alert' }, back, userErrorMessage(detail, 'detail'))
  return h('article', { className: css.detail },
    back,
    h('header', null, h('div', null, h('h3', null, detail.name)), h(Pill, null, tab === 'characters' ? '角色卡' : `${detail.entries?.length ?? 0} 条设定`)),
    tab === 'characters' ? h(CharacterDetail, { detail }) : h(LoreWikiDetail, { detail }))
}

function StateMessage({ title, description, action, onAction }) {
  return h('div', { className: css.statePanel },
    h('span', { className: css.statePanelIcon }, h(IconAgentPresetOutline16, { size: 19 })),
    h('strong', null, title),
    h('p', null, description),
    action ? h(m.button, { ...gestures, type: 'button', onClick: onAction }, action) : null)
}

function CharacterDetail({ detail }) {
  const character = detail.character ?? {}
  const fields = [
    ['角色设定', character.description], ['性格', character.personality], ['场景', character.scenario],
    ['默认开场', character.firstMessage],
    ...((character.alternateGreetings ?? []).map((value, index) => [`备用开场 ${index + 1}`, value])),
    ['消息示例', character.messageExample], ['作者备注', character.creatorNotes],
  ]
  return h(React.Fragment, null,
    detail.tags?.length ? h('div', { className: css.tags }, ...detail.tags.map(tag => h('span', { key: tag }, tag))) : null,
    h('dl', { className: css.characterFacts },
      character.nickname ? h(React.Fragment, null, h('dt', null, '昵称'), h('dd', null, character.nickname)) : null,
      character.creator ? h(React.Fragment, null, h('dt', null, '作者'), h('dd', null, character.creator)) : null,
      character.characterVersion ? h(React.Fragment, null, h('dt', null, '版本'), h('dd', null, character.characterVersion)) : null),
    ...fields.filter(([, value]) => typeof value === 'string' && value.length).map(([label, value]) => h(WikiDetailSection, { key: label, label, value, normalizeLeadingHeading: label === '角色设定' })),
    character.groupOnlyGreetings?.length ? h(WikiDetailSection, { label: '群聊开场（只读）', value: character.groupOnlyGreetings.join('\n\n') }) : null,
    character.extensions ? h('details', { className: css.advancedData }, h('summary', null, '附加数据（只读）'), h('pre', null, JSON.stringify(character.extensions, null, 2))) : null,
    character.characterBook ? h('details', { className: css.advancedData }, h('summary', null, '角色卡内世界书（只读）'), h('pre', null, JSON.stringify(character.characterBook, null, 2))) : null,
    detail.quarantinedPrompts?.length ? h('section', { className: css.quarantine }, h('h4', null, `未启用的提示内容 · ${detail.quarantinedPrompts.length}`), h('p', null, '为了安全，这些内容不会用于生成回复。'), ...detail.quarantinedPrompts.map(item => h('details', { key: item.path }, h('summary', null, '查看原文'), h('pre', null, String(item.value))))) : null)
}

function PromptTrigger({ onClick, mobile = false }) {
  return h(m.button, {
    ...gestures,
    type: 'button',
    className: mobile ? css.mobileWorkbenchDock : css.workbenchDock,
    'data-kind': 'prompt',
    onClick,
    'aria-label': '打开写作 prompt',
    title: '调整下次回复会参考的资料并查看预览',
  },
  h(IconListPenOutline16, { size: 16 }),
  h('strong', null, '写作 prompt'),
  h('span', { className: css.dockArrow, 'aria-hidden': true }, '↗'))
}

function SessionWikiTrigger({ onClick, mobile = false }) {
  return h(m.button, {
    ...gestures,
    type: 'button',
    className: mobile ? css.mobileWorkbenchDock : css.workbenchDock,
    'data-kind': 'wiki',
    onClick,
    'aria-label': '打开会话 Wiki',
    title: '查看当前对话的角色卡、世界书、我的人设、预设、文风与状态',
  },
  h(IconDataOutline16, { size: 16 }),
  h('strong', null, '会话 Wiki'),
  h('span', { className: css.dockArrow, 'aria-hidden': true }, '↗'))
}

function PromptModal({ open, onClose, profile, session, sessionId, connection }) {
  const dialogRef = useWorkbenchModal(open)
  return h(Modal, { open, onClose, title: '写作 prompt', closeLabel: '关闭写作 prompt', className: css.workbenchDialog, contentClassName: css.workbenchContent },
    h('div', { ref: dialogRef, tabIndex: -1, className: css.workbenchFocusRoot }, h(PromptWorkbench, { open, profile, session, sessionId, connection })))
}

function LoreOrder({ items, onChange, onMove }) {
  return h('section', { className: css.orderPanel }, h('h3', null, '世界书使用顺序'), h('p', null, '生成回复时会从上到下参考。你可以拖动，也可以用按钮调整。'),
    h(Reorder.Group, { axis: 'y', values: items, onReorder: onChange, className: css.orderList }, ...items.map((item, index) => h(Reorder.Item, { key: item.id, value: item, className: css.orderItem, layout: true, transition: layoutTransition }, h('span', { className: css.dragHandle, 'aria-hidden': true }, '⠿'), h('span', null, item.name), h('span', { className: css.orderActions }, h('button', { type: 'button', disabled: index === 0, 'aria-label': `上移 ${item.name}`, onClick: () => onMove(index, index - 1) }, '↑'), h('button', { type: 'button', disabled: index === items.length - 1, 'aria-label': `下移 ${item.name}`, onClick: () => onMove(index, index + 1) }, '↓'))))))
}

async function rpc(connection, endpoint, payload) {
  const route = endpoint.startsWith('characters/') ? '/rp-character-cards'
    : endpoint.startsWith('lorebooks/') ? '/rp-lore-books'
      : endpoint.startsWith('personas/') ? '/rp-personas'
      : endpoint.startsWith('presets/') ? '/rp-presets'
        : endpoint.startsWith('writing-styles/') ? '/rp-writing-styles' : '/rp-assets'
  const operation = endpoint.includes('/') && route !== '/rp-assets' ? endpoint.slice(endpoint.indexOf('/') + 1) : endpoint
  return domainValue(await connection.call(route, operation, payload))
}
async function waitForListedSession(sessions, sessionId) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (sessions.list.getSnapshot().byId[sessionId] !== undefined) return
    await new Promise(resolve => setTimeout(resolve, 50))
  }
  throw new Error('新故事已经创建，但会话列表尚未同步。请刷新页面后重试。')
}
function formatNumber(value) { return new Intl.NumberFormat('zh-CN').format(value) }
function isComplex(value) { return typeof value === 'object' && value !== null }
