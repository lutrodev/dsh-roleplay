export function domainValue(result) {
  if (!result?.ok) throw new Error(result?.error?.message ?? '世界书服务不可用')
  const domain = result.value
  if (!domain?.ok) { const error = new Error(domain?.error?.message ?? '世界书请求失败'); error.code = domain?.error?.code ?? 'UNKNOWN'; throw error }
  return domain.value
}
