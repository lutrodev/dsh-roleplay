const SERVICE_NAMES = Object.freeze({
  character: 'rpCharacterCards',
  lorebook: 'rpLoreBooks',
  persona: 'rpPersonas',
  preset: 'rpPresets',
  writingStyle: 'rpWritingStyles',
})

/** Resolve one owning asset service without duplicating its persistence. */
export function assetService(ctx, kind) {
  const serviceName = SERVICE_NAMES[kind]
  const value = ctx.get?.(serviceName) ?? ctx[serviceName]
  if (value === undefined) {
    throw coded('ASSET_SERVICE_UNAVAILABLE', `The ${kind} capability is not enabled.`)
  }
  return value
}

/**
 * Normalize the five owning services' create return values to one model-facing
 * asset value. Character cards and lorebooks return `{ created, detail }`,
 * while the other services return a flat summary.
 */
export async function createAsset(service, value) {
  return normalizeWriteResult(await service.create(value))
}

/** Normalize one owning service's update return value. */
export async function updateAsset(service, id, value, expectedRevision) {
  return normalizeWriteResult(await service.update(id, value, expectedRevision), id)
}

function normalizeWriteResult(result, requestedId) {
  if (!record(result)) throw coded('ASSET_RESULT_INVALID', 'The asset service returned no persisted asset.')
  const value = record(result.detail)
    ? result.detail
    : record(result.created)
      ? result.created
      : result
  const id = firstId(value.id, result.created?.id, result.detail?.id, requestedId)
  if (id === undefined) throw coded('ASSET_RESULT_INVALID', 'The asset service did not return the persisted asset id.')
  return { ...value, id }
}

function firstId(...values) {
  return values.find(value => typeof value === 'string' && value.length > 0)
}

function record(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function coded(code, message) {
  const error = new Error(message)
  error.code = code
  return error
}
