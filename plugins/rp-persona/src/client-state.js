export function domainValue(result) {
  if (!result?.ok) throw new Error(result?.error?.message ?? '我的人设服务不可用')
  const domain = result.value
  if (!domain?.ok) { const error = new Error(domain?.error?.message ?? '我的人设请求失败'); error.code = domain?.error?.code ?? 'UNKNOWN'; throw error }
  return domain.value
}

export function descriptionLabelInsertion(description, label, start, end = start) {
  const prefix = start > 0 && description[start - 1] !== '\n' ? '\n' : ''
  const insertion = `${prefix}${label}：`
  return {
    value: `${description.slice(0, start)}${insertion}${description.slice(end)}`,
    caret: start + insertion.length,
  }
}
