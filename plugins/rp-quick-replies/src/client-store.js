import {
  MAX_QUICK_REPLIES,
  MAX_QUICK_REPLY_CONTENT_CHARACTERS,
  MAX_QUICK_REPLY_LABEL_CHARACTERS,
  MAX_QUICK_REPLY_TOTAL_CHARACTERS,
  QUICK_REPLIES_RPC_PATH,
  normalizeQuickReplies,
} from './protocol.js'

export const DEFAULT_QUICK_REPLY_LIMITS = Object.freeze({
  replies: MAX_QUICK_REPLIES,
  labelCharacters: MAX_QUICK_REPLY_LABEL_CHARACTERS,
  contentCharacters: MAX_QUICK_REPLY_CONTENT_CHARACTERS,
  totalCharacters: MAX_QUICK_REPLY_TOTAL_CHARACTERS,
})

/** Shared browser store used by the composer and the Roleplay settings surface. */
export function createQuickReplyStore(connection) {
  let snapshot = Object.freeze({
    phase: 'idle', replies: [], writable: false, revision: null, limits: DEFAULT_QUICK_REPLY_LIMITS, error: null,
  })
  let request = null
  const listeners = new Set()
  const publish = next => {
    snapshot = Object.freeze(next)
    for (const listener of listeners) listener()
  }
  const adopt = value => ({
    phase: 'ready',
    replies: normalizeQuickReplies(value.replies),
    writable: value.writable === true,
    revision: Number.isSafeInteger(value.revision) ? value.revision : null,
    limits: { ...DEFAULT_QUICK_REPLY_LIMITS, ...(value.limits ?? {}) },
    error: null,
  })
  const load = async () => {
    if (request !== null) return request
    publish({ ...snapshot, phase: 'loading', error: null })
    request = quickReplyRequest(connection, 'list')
      .then(value => { publish(adopt(value)); return snapshot })
      .catch(error => {
        publish({ ...snapshot, phase: 'error', replies: [], error: friendlyQuickReplyRequestError(error, 'load') })
        throw error
      })
      .finally(() => { request = null })
    return request
  }
  const replace = async replies => {
    if (!Number.isSafeInteger(snapshot.revision)) {
      throw Object.assign(new Error('快捷回复设置暂时不能保存。'), { code: 'SETTINGS_UNAVAILABLE' })
    }
    const previous = snapshot
    publish({ ...snapshot, phase: 'saving', error: null })
    try {
      const value = await quickReplyRequest(connection, 'replace', { replies, expectedRevision: previous.revision })
      publish(adopt(value))
      return snapshot
    } catch (error) {
      publish({ ...previous, phase: 'ready', error: null })
      throw error
    }
  }
  return {
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener) },
    getSnapshot() { return snapshot },
    load,
    replace,
  }
}

export function friendlyQuickReplyRequestError(error, intent) {
  if (error?.code === 'REVISION_CONFLICT') return '快捷回复刚刚在其他页面更新。请关闭设置界面，重新打开后再修改。'
  if (error?.code === 'SETTINGS_UNAVAILABLE') return '当前环境不能保存快捷回复设置。'
  if (intent === 'save') return error instanceof Error && error.message ? error.message : '快捷回复没有保存，请稍后重试。'
  return '暂时无法读取快捷回复，请稍后重试。'
}

async function quickReplyRequest(connection, endpoint, payload = {}) {
  const response = await connection.call(QUICK_REPLIES_RPC_PATH, endpoint, payload)
  const domain = response?.ok === true && response.value?.ok !== undefined ? response.value : response
  if (domain?.ok !== true) {
    throw Object.assign(new Error(domain?.error?.message ?? '快捷回复请求失败'), { code: domain?.error?.code })
  }
  return domain.value
}
