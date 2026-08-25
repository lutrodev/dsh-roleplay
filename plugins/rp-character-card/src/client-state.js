export function domainValue(result) {
  if (!result?.ok) throw new Error(result?.error?.message ?? '角色卡服务不可用')
  const domain = result.value
  if (!domain?.ok) {
    const error = new Error(domain?.error?.message ?? '角色卡请求失败')
    error.code = domain?.error?.code ?? 'UNKNOWN'
    throw error
  }
  return domain.value
}

export function normalizedMime(file) {
  return file.type === 'image/png' || file.name.toLocaleLowerCase().endsWith('.png') ? 'image/png' : 'application/json'
}

export function relatedLorebookNames(detail) {
  const relationships = detail?.embeddedLorebooks
  if (Array.isArray(relationships)) {
    return relationships
      .filter(item => item?.status !== 'deleted' && typeof item?.name === 'string' && item.name.trim().length > 0)
      .map(item => item.name.trim())
  }
  const sourceName = detail?.character?.characterBook?.name
  return typeof sourceName === 'string' && sourceName.trim().length > 0 ? [sourceName.trim()] : []
}
