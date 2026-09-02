import React, { useEffect, useState } from 'react'
import { Button, Modal } from '@deepseek-ai/dsh-client-ui-primitives'
import {
  actionError,
  messageActionValue,
  turnSurfaceCommitAttempted,
  turnSurfaceEndReasonKind,
} from './client-state.js'
import { css } from './client-styles.generated.js'

const h = React.createElement
const EMPTY_PRESET_SELECTION = '__rp-message-actions-no-preset__'

/** Diagnose historic pre-model failures so the failed row can offer an explicit rebind. */
export function shouldInspectPresetFailure(matched) {
  return matched?.target?.kind === 'turn'
    && turnSurfaceEndReasonKind(matched.state) === 'error'
    && !turnSurfaceCommitAttempted(matched.state)
}

export function usePresetFailureDiagnostic({ connection, profile, enabled }) {
  const presetId = profile?.resources?.preset?.id
  const [diagnostic, setDiagnostic] = useState(null)
  useEffect(() => {
    if (!enabled || typeof presetId !== 'string' || presetId.length === 0) {
      setDiagnostic(null)
      return undefined
    }
    let live = true
    setDiagnostic({ kind: 'checking-preset', presetId })
    void roleplayRpc(connection, '/rp-presets', 'validate-binding', { id: presetId }).then(
      () => { if (live) setDiagnostic(null) },
      reason => {
        if (!live) return
        const code = typeof reason?.code === 'string' ? reason.code : 'UNKNOWN'
        setDiagnostic(code === 'ASSET_NOT_FOUND' || code === 'ASSET_CORRUPT'
          ? { kind: 'missing-preset', presetId, cause: code }
          : null)
      },
    )
    return () => { live = false }
  }, [connection, enabled, presetId])
  return diagnostic
}

export function PresetRecoveryDialog({ open, connection, sessionId, profile, onClose, onApplied }) {
  const [items, setItems] = useState([])
  const [selectedPreset, setSelectedPreset] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open) return undefined
    let live = true
    setLoading(true)
    setError(null)
    void roleplayRpc(connection, '/rp-presets', 'list', { limit: 100 }).then(
      value => {
        if (!live) return
        const ready = (value.items ?? []).filter(item => item?.status !== 'corrupt')
        setItems(ready)
        setSelectedPreset(ready.some(item => item.id === value.defaultId)
          ? value.defaultId
          : ready[0]?.id ?? null)
        setLoading(false)
      },
      reason => {
        if (!live) return
        setItems([])
        setSelectedPreset(null)
        setError(presetRecoveryErrorMessage(reason, 'load'))
        setLoading(false)
      },
    )
    return () => { live = false }
  }, [connection, open])

  const applyPreset = async () => {
    if (saving || loading || !Number.isSafeInteger(profile?.revision)) return
    setSaving(true)
    setError(null)
    try {
      await roleplayRpc(connection, '/rp-assets', 'session/bind', {
        sessionId,
        expectedRevision: profile.revision,
        presetId: selectedPreset,
      })
      onApplied({ presetId: selectedPreset })
    } catch (reason) {
      setError(presetRecoveryErrorMessage(reason, 'save'))
    } finally {
      setSaving(false)
    }
  }

  const close = () => { if (!saving) onClose() }
  return h(Modal, {
    open,
    onClose: close,
    closeLabel: '关闭重新选择预设',
    title: '重新选择创作预设',
    description: '原来绑定的预设已经不可用。请选择这段对话接下来使用的预设。',
    className: css.presetRecoveryDialog,
    footer: h(React.Fragment, null,
      h(Button, { variant: 'outline', autoFocus: true, disabled: saving, onClick: close }, '取消'),
      h(Button, { variant: 'primary', disabled: loading || saving || !Number.isSafeInteger(profile?.revision), onClick: () => void applyPreset() }, saving ? '正在应用…' : '应用预设')),
  },
  h('div', { className: css.presetRecoveryBody },
    loading
      ? h('p', { className: css.presetRecoveryLoading, role: 'status' }, '正在读取可用预设…')
      : h(React.Fragment, null,
        h('label', { className: css.presetRecoveryField },
          h('span', null, '创作预设'),
          h('select', {
            value: selectedPreset ?? EMPTY_PRESET_SELECTION,
            disabled: saving,
            onChange: event => setSelectedPreset(event.target.value === EMPTY_PRESET_SELECTION ? null : event.target.value),
          },
          h('option', { value: EMPTY_PRESET_SELECTION }, '不使用创作预设'),
          ...items.map(item => h('option', { key: item.id, value: item.id }, `${item.name}${item.isDefault ? '（默认）' : ''}`)))),
        items.length === 0
          ? h('p', { className: css.presetRecoveryHint }, '资料库里没有可用预设，可以先选择“不使用创作预设”继续。')
          : h('p', { className: css.presetRecoveryHint }, '已有消息和会话变量会保留；新预设从下一次生成开始生效。')),
    error === null ? null : h('div', { className: css.error, role: 'alert' }, error)))
}

function presetRecoveryErrorMessage(reason, intent) {
  const code = typeof reason?.code === 'string' ? reason.code : 'UNKNOWN'
  if (code === 'ASSET_NOT_FOUND') return intent === 'save'
    ? '刚刚选择的预设已经不存在，请重新选择。'
    : '暂时无法读取预设列表，请刷新后重试。'
  if (code === 'REVISION_CONFLICT') return '这段对话的资料刚刚发生了变化，请关闭后重新选择。'
  if (code === 'SESSION_RUNNING') return '回复正在生成，请结束后再更换预设。'
  if (code === 'PROFILE_TOO_LARGE') return '当前会话资料过多，暂时无法应用新的预设。'
  return intent === 'save' ? '暂时无法应用预设，请稍后重试。' : '暂时无法读取预设列表，请稍后重试。'
}

async function roleplayRpc(connection, route, endpoint, payload) {
  try {
    return messageActionValue(await connection.call(route, endpoint, payload))
  } catch (reason) {
    if (reason?.code !== undefined) throw reason
    throw actionError('SERVICE_UNAVAILABLE')
  }
}
