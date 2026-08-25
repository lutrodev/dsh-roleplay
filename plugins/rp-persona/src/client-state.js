export function domainValue(result) {
  if (!result?.ok) throw new Error(result?.error?.message ?? '我的人设服务不可用')
  const domain = result.value
  if (!domain?.ok) { const error = new Error(domain?.error?.message ?? '我的人设请求失败'); error.code = domain?.error?.code ?? 'UNKNOWN'; throw error }
  return domain.value
}
