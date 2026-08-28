export function routeKey(route) {
  return route?.kind === 'fixed' ? JSON.stringify([route.provider, route.model]) : 'inherit'
}

export function routeFromKey(key) {
  if (key === 'inherit') return { kind: 'inherit' }
  try {
    const value = JSON.parse(key)
    if (!Array.isArray(value) || value.length !== 2 || value.some(item => typeof item !== 'string' || item.length === 0)) throw new Error('invalid')
    return { kind: 'fixed', provider: value[0], model: value[1] }
  } catch {
    return { kind: 'inherit' }
  }
}

export function routeLabel(route, groups = []) {
  if (route?.kind !== 'fixed') return '跟随父代理'
  for (const group of groups) {
    const model = group.models?.find(item => item.id === route.model)
    if (group.id === route.provider && model !== undefined) {
      const effort = model.reasoning?.efforts?.find(item => item.id === route.reasoningEffort)
      return `${group.name} · ${model.name}${route.reasoningEffort === undefined ? '' : ` · ${effort?.name ?? route.reasoningEffort}`}`
    }
  }
  return `${route.provider} · ${route.model}${route.reasoningEffort === undefined ? '' : ` · ${route.reasoningEffort}`}`
}

export function routeAvailable(route, groups = []) {
  if (route?.kind !== 'fixed') return true
  const model = groups.find(group => group.id === route.provider)?.models?.find(item => item.id === route.model)
  if (model === undefined) return false
  return route.reasoningEffort === undefined || model.reasoning?.efforts?.some(effort => effort.id === route.reasoningEffort) === true
}

export function emptySubagentDraft() {
  return { id: null, revision: 0, name: '', description: '', instructions: '', route: { kind: 'inherit' }, tools: [] }
}

export function subagentDraft(value) {
  return {
    id: value.id,
    revision: value.revision,
    name: value.name,
    description: value.description,
    instructions: value.instructions,
    route: value.route,
    tools: [...value.tools],
  }
}

export function validateDraft(draft) {
  if (!draft.name.trim()) return '请填写子代理名称。'
  if (!draft.description.trim()) return '请填写调用契约，说明适用范围、调用顺序、所需输入和结果用途。'
  if (!draft.instructions.trim()) return '请填写工作指令。'
  return null
}

export function modelCatalogValue(response) {
  const domain = response?.result ?? response
  if (domain?.ok !== true) throw Object.assign(new Error(domain?.error?.message ?? '模型目录读取失败'), { code: domain?.error?.code })
  return domain.value
}

export function userMessage(error, action = 'save') {
  if (error?.code === 'REVISION_CONFLICT') return action === 'delete'
    ? '这个子代理刚刚发生了变化，请关闭确认后重新打开。'
    : action === 'toggle'
      ? '启用状态已在其他位置变化，请重新打开子代理管理后再操作。'
      : '配置已在其他位置更新，请返回列表并重新打开后再保存。'
  if (error?.code === 'NAME_CONFLICT') return '已有同名子代理，请换一个名称。'
  if (error?.code === 'LIMIT_EXCEEDED') return '内容或子代理数量已达到上限，请精简后重试。'
  if (error?.code === 'MODEL_UNAVAILABLE') return '所选模型当前不可用，请选择其他模型或改为跟随父代理。'
  if (error?.code === 'SUBAGENT_NOT_FOUND') return action === 'delete' ? '这个子代理已经被删除，请关闭确认并刷新列表。' : '这个子代理已经不存在，请返回列表刷新。'
  if (error?.code === 'ASSET_CORRUPT') return '子代理配置无法读取。请先检查或恢复全局配置文件。'
  if (action === 'load') return '暂时无法读取子代理配置，请稍后重试。'
  if (action === 'models') return '暂时无法读取模型目录。仍可查看配置，稍后重试模型选择。'
  if (action === 'delete') return '暂时无法删除这个子代理，请稍后重试。'
  if (action === 'toggle') return '暂时无法更改启用状态，请稍后重试。'
  return '暂时无法保存配置，请检查填写内容后重试。'
}

export async function rpc(connection, endpoint, payload) {
  const response = await connection.call('/rp-subagents', endpoint, payload)
  const domain = response?.ok === true && response.value?.ok !== undefined ? response.value : response
  if (domain?.ok !== true) throw Object.assign(new Error(domain?.error?.message ?? '请求失败'), { code: domain?.error?.code })
  return domain.value
}
