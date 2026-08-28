import { isRoleplaySessionSummary } from 'dsh-roleplay-rp-ui/session-summary'

export function isRoleplaySummary(listState, sessionId) {
  return listState.current === sessionId && isRoleplaySessionSummary(listState.byId?.[sessionId])
}

export function sessionSurfaceState(roleplay, session, profile) {
  if (!roleplay) return 'hidden'
  const started = session.composerPhase === undefined ? !session.blank : session.composerPhase !== 'blank'
  if (profile != null) return 'active'
  return started ? 'recover' : 'setup'
}

export function sessionBlockReason(surface) {
  if (surface === 'setup') return '请先完成故事设置'
  if (surface === 'recover') return '请先恢复故事设置'
  return undefined
}

export function shouldShowSkippedOpeningNotice(session, profile) {
  const blank = session.composerPhase === undefined ? session.blank : session.composerPhase === 'blank'
  return profile != null && blank && openingModeFromProfile(profile) === 'skip'
}

function roleplayResetError(code) {
  return Object.assign(new Error('roleplay session cannot be reset'), { code })
}

function assertResettableRoleplaySession(sessionId, sessions) {
  const list = sessions.list.getSnapshot()
  const summary = list.byId?.[sessionId]
  const snapshot = sessions.binding(sessionId)?.session.getSnapshot()
  if (list.current !== sessionId || !isRoleplaySessionSummary(summary) || snapshot === undefined) {
    throw roleplayResetError('RP_RESET_UNAVAILABLE')
  }
  if (snapshot.composerPhase !== 'blank' || snapshot.running) {
    throw roleplayResetError('RP_RESET_NOT_BLANK')
  }
  return { list, snapshot }
}

/**
 * Leave an unstarted RP Session and restore the owning Workspace's ordinary
 * blank-session entry point. The RP Session log remains durable but is hidden
 * from grouping surfaces; shared roleplay assets are never mutated.
 */
export async function resetBlankRoleplaySession({ sessionId, sessions, workspaces }) {
  const { list } = assertResettableRoleplaySession(sessionId, sessions)
  const workspaceState = workspaces.list.getSnapshot()
  if (workspaceState.baselinesReady !== true) throw roleplayResetError('RP_RESET_UNAVAILABLE')
  const workspace = workspaceState.items.find(item => item.sessionIds.includes(sessionId))
  let nextSessionId
  if (workspace !== undefined) {
    const archived = new Set(workspaceState.archivedSessionIds)
    nextSessionId = list.ids.find(id => {
      const summary = list.byId[id]
      return id !== sessionId
        && !archived.has(id)
        && workspace.sessionIds.includes(id)
        && summary?.blank === true
        && summary.cwd === workspace.path
    })
    if (nextSessionId === undefined) {
      nextSessionId = await sessions.create({ workspaceId: workspace.workspaceId })
    }
    // Session creation is asynchronous. Re-check immediately before hiding
    // the RP Session so a first message sent meanwhile can never be reset.
    assertResettableRoleplaySession(sessionId, sessions)
  }
  await workspaces.archiveSession(sessionId)
  if (nextSessionId === undefined) sessions.clear()
  else sessions.open(nextSessionId)
  return nextSessionId
}

export function openingModeFromProfile(profile) {
  const source = profile?.scene?.openingSource
  if (source === 'card' || source === 'custom' || source === 'skip') return source
  return profile?.scene?.openingText === undefined ? 'skip' : 'custom'
}

export function userErrorMessage(error, intent = 'load') {
  const code = typeof error?.code === 'string' ? error.code : 'UNKNOWN'
  if (code === 'RP_RESET_NOT_BLANK') return '这个对话已经开始，不能再重置。请新建对话后重新选择。'
  if (code === 'RP_RESET_UNAVAILABLE') return '当前状态已经变化，暂时不能重置。请返回新对话后重新选择。'
  if (code === 'DUPLICATE_CARD' || code === 'DUPLICATE_ASSET') return '这份资料已经在资料库中。'
  if (code === 'UNSUPPORTED_FORMAT') return '文件格式不受支持，请选择 PNG 或 JSON 文件。'
  if (intent === 'import' && (code === 'INVALID_CHARACTER_DATA' || code === 'INVALID_PNG' || code === 'INVALID_PNG_TEXT' || code === 'INVALID_REQUEST')) return '文件内容无法识别，请检查后重试。'
  if (code === 'PROFILE_TOO_LARGE') return '当前对话的资料内容过多，请精简后重试。'
  if (code === 'WORKSPACE_ATTACH_FAILED') return '对话已创建，但未能加入当前工作区。请在“未分组”中打开它。'
  if (code === 'LIMIT_EXCEEDED' || code === 'CARD_TEXT_LIMIT_EXCEEDED') return '文件内容过大，请精简后重试。'
  if (intent === 'context-preview') {
    if (code === 'ASSET_CORRUPT') return '当前回复资料无法完整读取，请检查会话资料后重试。'
    return '暂时无法准备回复资料，请检查会话设置后重试。'
  }
  if (code === 'ASSET_CORRUPT') return '这份资料内容不完整，请重新导入。'
  if (code === 'ASSET_NOT_FOUND') return intent === 'save' ? '所选资料已经不存在，请重新选择。' : '这份资料已经不可用。'
  if (code === 'REVISION_CONFLICT') return '故事资料刚刚发生了变化，请重新确认后再保存。'
  if (code === 'SESSION_RUNNING') return '故事正在生成回复，请结束后再调整。'
  if (code === 'RP_CONTEXT_SOURCE_REQUIRED') return '这个分组必须参与回复，不能放入闲置区。'
  if (code === 'OPENING_LOCKED') return '故事开始后不能更换开场白。角色卡关联仍可继续调整。'
  if (code === 'OPENING_REQUIRES_SEEDED_CREATE') return '开场白只能在创建故事时选择。请新建对话，再通过“开始一段故事”完成设置。'
  if (intent === 'import') return '导入没有完成，请检查文件后重试。'
  if (intent === 'save') return '暂时无法保存更改，请稍后再试。'
  if (intent === 'detail') return '暂时无法读取这份资料，请重新选择。'
  if (intent === 'preview') return '无法准备这个角色的开场，请选择其他角色。'
  if (intent === 'reset') return '暂时无法重置这个对话，请稍后再试。'
  return '暂时无法读取资料库，请稍后重试。'
}

const ASSET_KIND_LABELS = {
  character: '角色卡',
  lorebook: '世界书',
  persona: '我的人设',
  preset: '创作预设',
  writingStyle: '文风',
}

const ASSET_MANAGE_ACTIONS = {
  character: '当前对话',
  lorebook: '“调整使用顺序”',
  persona: '“更换我的人设”',
  preset: '“更换创作预设”',
  writingStyle: '“调整文风与顺序”',
}

export function assetKindLabel(kind) {
  return ASSET_KIND_LABELS[kind]
}

const SESSION_SECTION_CAPABILITIES = Object.freeze({
  character: 'characters',
  lorebooks: 'lorebooks',
  persona: 'personas',
  preset: 'presets',
  writingStyles: 'writingStyles',
  state: 'state',
})

/** Map one session Wiki section id to its Host capability field. @param {string} section @returns {string | undefined} */
export function sessionSectionCapability(section) {
  return SESSION_SECTION_CAPABILITIES[section]
}

/** Return the canonical latest-reply changes for one State namespace. */
export function stateActivityChanges(activity, namespace) {
  if (typeof namespace !== 'string' || activity?.namespaces === null || typeof activity?.namespaces !== 'object') return []
  const changes = activity.namespaces[namespace]
  return Array.isArray(changes) ? changes : []
}

/** Count every latest-reply State change across the current Session. */
export function stateActivityTotalCount(activity) {
  if (activity?.namespaces === null || typeof activity?.namespaces !== 'object') return 0
  return Object.values(activity.namespaces).reduce((total, changes) => total + (Array.isArray(changes) ? changes.length : 0), 0)
}

/** Count terminal State values rendered as rows; objects and arrays are groups. */
export function countStateItems(value) {
  if (value === null || typeof value !== 'object') return 1
  return Object.values(value).reduce((total, child) => total + countStateItems(child), 0)
}

/** Prefer the transient activity view only when the selected namespace changed. */
export function preferredStateDetailView(activity, namespace) {
  return stateActivityChanges(activity, namespace).length > 0 ? 'changes' : 'current'
}

/**
 * Creating a shared asset and binding it to a Session are deliberately two
 * independent mutations. This message makes a partial success explicit so a
 * caller never retries the create mutation and accidentally duplicates data.
 */
export function createdAssetBindingMessage(kind, outcome) {
  const label = assetKindLabel(kind) ?? '资料'
  if (outcome?.applied === true) return `${label}已创建并用于当前对话。`
  const action = ASSET_MANAGE_ACTIONS[kind] ?? '资料选择'
  const code = typeof outcome?.error?.code === 'string' ? outcome.error.code : 'UNKNOWN'
  if (code === 'REVISION_CONFLICT') return `${label}已创建到资料库，但当前对话的资料刚刚发生变化，因此没有自动使用。请在${action}中重新选择。`
  if (code === 'SESSION_RUNNING') return `${label}已创建到资料库，但回复正在生成，因此没有自动使用。回复完成后，请在${action}中重新选择。`
  if (code === 'LIMIT_EXCEEDED' && kind === 'writingStyle') return '文风已创建到资料库，但当前对话已达到文风数量上限。请先移除一项，再选择这项文风。'
  if (code === 'OPENING_LOCKED') return `${label}已创建到资料库。故事已经开始，当前开场白保持不变。`
  return `${label}已创建到资料库，但暂时没有用于当前对话。请在${action}中重新选择。`
}

export function moveItem(ids, from, to) {
  if (!Array.isArray(ids) || from < 0 || to < 0 || from >= ids.length || to >= ids.length || from === to) return ids
  const next = [...ids]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

export function linkedLorebookIds(character, lorebooks) {
  const available = new Set(lorebooks.map(book => book.id))
  return uniqueIds([
    ...(Array.isArray(character?.linkedLorebookIds) ? character.linkedLorebookIds.filter(id => available.has(id)) : []),
    ...lorebooks.filter(book => book.sourceCharacterId === character?.id).map(book => book.id),
  ])
}

export function selectCharacterLore(currentLore, previousAutomaticLore, character, lorebooks) {
  const automaticLore = linkedLorebookIds(character, lorebooks)
  return {
    automaticLore,
    selectedLore: uniqueIds([...currentLore.filter(id => !previousAutomaticLore.includes(id)), ...automaticLore]),
  }
}

export function openingText(detail, openingIndex = 0) {
  const openings = [detail?.character?.firstMessage, ...(Array.isArray(detail?.character?.alternateGreetings) ? detail.character.alternateGreetings : [])]
  const opening = openings[openingIndex]
  if (typeof opening === 'string' && opening.trim().length > 0) return opening.trim()
  return '故事舞台已经准备好。写下你的第一个行动、对白或问题。'
}

export function domainValue(result) {
  if (!result?.ok) throw new Error(result?.error?.message ?? 'RP 资产服务不可用')
  const domain = result.value
  if (!domain?.ok) {
    const error = new Error(domain?.error?.message ?? 'RP 资产请求失败')
    error.code = domain?.error?.code ?? 'UNKNOWN'
    throw error
  }
  return domain.value
}

function uniqueIds(ids) { return [...new Set(ids.filter(id => typeof id === 'string'))] }
