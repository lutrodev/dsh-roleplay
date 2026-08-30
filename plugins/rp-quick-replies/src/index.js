import Schema from '@deepseek-ai/schemastery'
import {
  DEFAULT_QUICK_REPLIES,
  MAX_QUICK_REPLIES,
  MAX_QUICK_REPLY_CONTENT_CHARACTERS,
  MAX_QUICK_REPLY_LABEL_CHARACTERS,
  MAX_QUICK_REPLY_TOTAL_CHARACTERS,
  QUICK_REPLY_CURSOR_POSITION_END,
  QUICK_REPLY_CURSOR_POSITION_MIDDLE,
  QUICK_REPLIES_RPC_PATH,
  QUICK_REPLIES_SETTINGS_NAMESPACE,
  normalizeQuickReplies,
} from './protocol.js'

const QUICK_REPLIES_NAMESPACE = QUICK_REPLIES_SETTINGS_NAMESPACE
const QUICK_REPLY_CONFIG = Schema.object({
  id: Schema.string().required(),
  label: Schema.string().required(),
  content: Schema.string().required(),
  cursorPosition: Schema.union([QUICK_REPLY_CURSOR_POSITION_MIDDLE, QUICK_REPLY_CURSOR_POSITION_END]),
})

export const name = 'rp-quick-replies'
export const inject = ['rpRemote']
export const Config = Schema.object({
  replies: Schema.array(QUICK_REPLY_CONFIG).default(DEFAULT_QUICK_REPLIES),
})

/** Global, settings-backed quick replies. They affect the model only after insertion into an ordinary draft. */
export class RpQuickReplies {
  constructor(ctx, config) {
    this.ctx = ctx
    this.entry = { replies: normalizeQuickReplies(config.replies) }
    this.source = () => this.entry
    ctx.inject(['settings'], settingsCtx => {
      settingsCtx.settings.installSection(ctx, QUICK_REPLIES_NAMESPACE, Config, this.entry, {
        setSource: source => { this.source = source },
        validate: value => { normalizeQuickReplies(value.replies) },
        onChange: () => {},
      })
    })
  }

  snapshot() {
    const settings = this.ctx.get('settings')
    const descriptor = settings?.describe().find(item => item.ns === QUICK_REPLIES_SETTINGS_NAMESPACE)
    const resolved = settings?.get(QUICK_REPLIES_NAMESPACE) ?? this.source()
    return {
      replies: normalizeQuickReplies(resolved.replies),
      writable: settings?.writable === true && descriptor !== undefined,
      revision: descriptor?.revision ?? null,
      limits: {
        replies: MAX_QUICK_REPLIES,
        labelCharacters: MAX_QUICK_REPLY_LABEL_CHARACTERS,
        contentCharacters: MAX_QUICK_REPLY_CONTENT_CHARACTERS,
        totalCharacters: MAX_QUICK_REPLY_TOTAL_CHARACTERS,
      },
    }
  }

  async replace(payload) {
    const input = object(payload)
    if (!Number.isSafeInteger(input.expectedRevision) || input.expectedRevision < 0) {
      throw coded('INVALID_REQUEST', 'expectedRevision must be a non-negative integer')
    }
    const replies = normalizeQuickReplies(input.replies)
    const settings = this.ctx.get('settings')
    const registered = settings?.describe().some(item => item.ns === QUICK_REPLIES_SETTINGS_NAMESPACE) === true
    if (settings?.writable !== true || !registered) {
      throw coded('SETTINGS_UNAVAILABLE', 'Quick reply settings are not writable.')
    }
    await settings.update(QUICK_REPLIES_NAMESPACE, { replies }, input.expectedRevision)
    return this.snapshot()
  }
}

export function apply(ctx, config) {
  const quickReplies = new RpQuickReplies(ctx, config)
  registerBrowser(ctx, quickReplies)
}

function registerBrowser(ctx, quickReplies) {
  const dispose = ctx.rpRemote.register(QUICK_REPLIES_RPC_PATH, async (endpoint, payload) => {
    try {
      if (endpoint === 'list') return transportSuccess(success(quickReplies.snapshot()))
      if (endpoint === 'replace') return transportSuccess(success(await quickReplies.replace(payload)))
      return transportSuccess(failure('INVALID_REQUEST', '未知的快捷回复请求。'))
    } catch (error) {
      const code = codeFor(error)
      return transportSuccess(failure(code, userMessage(code)))
    }
  })
  ctx.effect(() => dispose, 'rp-quick-replies: typed Remote')
}

export async function dispatchBrowser(quickReplies, endpoint, payload) {
  if (endpoint === 'list') return quickReplies.snapshot()
  if (endpoint === 'replace') return quickReplies.replace(payload)
  throw coded('INVALID_REQUEST', 'Unknown quick reply endpoint.')
}

function codeFor(error) {
  if (error?.code === 'SETTINGS_CONFLICT') return 'REVISION_CONFLICT'
  if (['INVALID_REQUEST', 'LIMIT_EXCEEDED', 'DUPLICATE_REPLY', 'DUPLICATE_LABEL', 'SETTINGS_UNAVAILABLE'].includes(error?.code)) return error.code
  return 'QUICK_REPLIES_UNAVAILABLE'
}

function userMessage(code) {
  if (code === 'REVISION_CONFLICT') return '快捷回复刚刚在其他页面更新，请重新打开后再保存。'
  if (code === 'SETTINGS_UNAVAILABLE') return '当前环境不能保存快捷回复设置。'
  if (code === 'LIMIT_EXCEEDED') return '快捷回复数量或内容超过上限，请精简后再保存。'
  if (code === 'DUPLICATE_REPLY' || code === 'DUPLICATE_LABEL') return '快捷回复名称不能重复。'
  if (code === 'INVALID_REQUEST') return '快捷回复内容不完整，请检查后再保存。'
  return '暂时无法读取或保存快捷回复，请稍后重试。'
}

function object(value) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw coded('INVALID_REQUEST', 'request payload must be an object')
  return value
}
function success(value) { return { ok: true, value } }
function failure(code, message) { return { ok: false, error: { code, message } } }
function transportSuccess(value) { return { ok: true, value } }
function coded(code, message) { return Object.assign(new Error(message), { code }) }
