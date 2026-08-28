const SPECS = Object.freeze({
  character: Object.freeze({
    label: '角色卡', listEndpoint: 'characters/list', requestField: 'cardId', multi: false,
    emptyTitle: '资料库里还没有角色卡', emptyDescription: '请先在侧栏角色卡资料库中创建或导入，再回到这里绑定。',
  }),
  lorebooks: Object.freeze({
    label: '世界书', listEndpoint: 'lorebooks/list', requestField: 'lorebookIds', multi: true,
    emptyTitle: '资料库里还没有世界书', emptyDescription: '请先在侧栏世界书资料库中创建或导入，再回到这里绑定。',
  }),
  persona: Object.freeze({
    label: '我的人设', listEndpoint: 'personas/list', requestField: 'personaId', multi: false,
    emptyTitle: '资料库里还没有人设', emptyDescription: '请先在侧栏人设资料库中创建，再回到这里绑定。',
  }),
  preset: Object.freeze({
    label: '创作预设', listEndpoint: 'presets/list', requestField: 'presetId', multi: false,
    emptyTitle: '资料库里还没有创作预设', emptyDescription: '请先在侧栏创作预设资料库中创建，再回到这里绑定。',
  }),
  writingStyles: Object.freeze({
    label: '文风', listEndpoint: 'writing-styles/list', requestField: 'writingStyleIds', multi: true,
    emptyTitle: '资料库里还没有文风', emptyDescription: '请先在侧栏文风资料库中创建，再回到这里绑定。',
  }),
})

export function sessionBindingSpec(kind) {
  const spec = SPECS[kind]
  if (spec === undefined) throw new Error(`unsupported Session Wiki binding kind: ${String(kind)}`)
  return spec
}

export function currentSessionBindingIds(profile, kind) {
  const resources = profile?.resources
  if (kind === 'character') return resources?.card?.id === undefined ? [] : [resources.card.id]
  if (kind === 'lorebooks') return (resources?.lorebooks ?? []).map(binding => binding.id)
  if (kind === 'persona') return resources?.persona?.id === undefined ? [] : [resources.persona.id]
  if (kind === 'preset') return resources?.preset?.id === undefined ? [] : [resources.preset.id]
  if (kind === 'writingStyles') return (resources?.writingStyles ?? []).map(binding => binding.id)
  sessionBindingSpec(kind)
}

export function sessionBindingRequest(kind, selectedIds) {
  const spec = sessionBindingSpec(kind)
  if (!Array.isArray(selectedIds) || selectedIds.some(id => typeof id !== 'string' || id.length === 0)) {
    throw new Error('Session Wiki binding selection must be an asset id array')
  }
  if (new Set(selectedIds).size !== selectedIds.length) throw new Error('Session Wiki binding selection contains duplicate ids')
  if (spec.multi) return { [spec.requestField]: selectedIds }
  if (selectedIds.length !== 1) throw new Error(`${spec.label} binding requires exactly one selection`)
  return { [spec.requestField]: selectedIds[0] }
}

export function readyBindingItems(items) {
  if (!Array.isArray(items)) return []
  return items.filter(item => item !== null && typeof item === 'object'
    && typeof item.id === 'string' && item.id.length > 0
    && item.status !== 'corrupt')
}
