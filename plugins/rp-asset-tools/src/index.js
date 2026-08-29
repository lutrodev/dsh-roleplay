import { defineTool } from '@deepseek-ai/dsh-tools'
import Schema from '@deepseek-ai/schemastery'
import { rpAssetBindingIds, RP_ASSET_READ_TOOL, RP_ASSET_TOOL } from 'dsh-roleplay-rp-core'
import { assetService, createAsset as createThroughAdapter, updateAsset as updateThroughAdapter } from './asset-adapter.js'

export const name = 'rp-asset-tools'
export const inject = ['tools', 'rpRuntime', 'rpSessions']
export const Config = Schema.object({})

const READ_ACTIONS = new Set(['list', 'get'])
const MUTATION_ACTIONS = new Set(['create', 'update', 'bind'])
const KINDS = new Set(['character', 'lorebook', 'persona', 'preset', 'writingStyle'])

export function apply(ctx) {
  ctx.tools.register(assetReadTool(ctx))
  ctx.tools.register(assetMutationTool(ctx))
}

function assetReadTool(ctx) {
  return defineTool({
    name: RP_ASSET_READ_TOOL,
    description: 'Read Roleplay material for discussion without changing it. In Chat mode, the current_asset_bindings manifest is authoritative: action list returns only assets bound to this conversation and action get accepts only those bound ids. In Agent mode, list/get may inspect the full shared library. Kinds are character, lorebook, persona, preset, and writingStyle. This tool never creates, edits, binds, reorders, imports, or persists anything. In Chat mode, if the user asks for any such change, clearly ask them to switch to Agent mode and repeat or confirm the request there.',
    parameters: {
      action: { type: 'string', required: true, description: 'Exactly one of list or get.' },
      kind: { type: 'string', required: true, description: 'Exactly one of character, lorebook, persona, preset, or writingStyle.' },
      id: { type: 'string', description: 'For get only: in Chat use an exact id from current_asset_bindings or this tool\'s scoped list; in Agent use an exact id returned by library list. Omit for list.' },
      query: { type: 'string', description: 'Optional list search.' },
      cursor: { type: 'string', description: 'Optional list cursor.' },
      limit: { type: 'integer', description: 'Optional list page size.' },
    },
    output: assetOutput(),
    async execute(args, exec) {
      if (exec.agent === undefined) throw coded('RP_AGENT_REQUIRED', 'rp_asset_read requires an active Roleplay agent.')
      const action = requiredChoice(args.action, READ_ACTIONS, 'action')
      const kind = requiredChoice(args.kind, KINDS, 'kind')
      const profile = ctx.rpSessions.get(exec.agent)
      const executionMode = profile?.runtime?.executionMode === 'agent' ? 'agent' : 'chat'
      if (executionMode === 'agent') {
        if (action === 'list') return { action, kind, scope: 'library', page: await assetService(ctx, kind).list(listInput(args)) }
        return { action, kind, scope: 'library', asset: modelReadableAsset(kind, await assetService(ctx, kind).detail(requiredId(args.id))) }
      }
      if (action === 'list') return { action, kind, scope: 'current_session', page: await currentSessionAssetPage(ctx, profile, kind, args) }
      const id = requiredId(args.id)
      if (!rpAssetBindingIds(profile, kind).includes(id)) {
        throw coded('RP_ASSET_NOT_BOUND', 'This material is not bound to the current conversation. In Chat mode, use only ids from current_asset_bindings or switch to Agent mode to inspect the shared library.')
      }
      return { action, kind, scope: 'current_session', asset: modelReadableAsset(kind, await assetService(ctx, kind).detail(id)) }
    },
    presentCall: args => ({
      card: 'generic', title: '读取角色扮演资料', kind: 'read', rawInput: JSON.stringify(args),
    }),
    presentResult: (_args, result) => ({
      card: 'generic',
      title: result.isError ? '资料读取未完成' : '角色扮演资料已读取',
      kind: 'read',
      rawOutput: result.content,
    }),
  })
}

function assetMutationTool(ctx) {
  return defineTool({
    name: RP_ASSET_TOOL,
    description: 'Agent mode only. Explicitly create, edit, or bind shared Roleplay material after loading the matching roleplay guidance skill. Use one action at a time: create requires kind+value and may set bindToCurrentSession; update requires kind+id+expectedRevision+value; bind requires changes and does not use kind. Inspect assets and obtain current revisions with rp_asset_read first. Omit fields that do not belong to the chosen action. A successful create/update can remain saved even if later binding or context refresh fails, so inspect the structured result before retrying a write.',
    parameters: {
      action: { type: 'string', required: true, description: 'Exactly one of create, update, or bind.' },
      kind: { type: 'string', description: 'For create/update: character, lorebook, persona, preset, or writingStyle. Omit for bind.' },
      id: { type: 'string', description: 'For update: exact asset id returned by rp_asset_read or a successful create/import.' },
      expectedRevision: { type: 'integer', description: 'For update only: exact positive revision returned by the latest rp_asset_read get. Omit for other actions.' },
      value: {
        type: 'json',
        description: 'For create/update only; use no unlisted fields. character: {name,description?,personality?,scenario?,firstMessage?,messageExample?,alternateGreetings?,creatorNotes?,tags?}. lorebook create: {name,entries:[{id,name,level,content,constant?|keys?,secondaryKeys?,enabled?,caseSensitive?,recursive?,order?,position?,insertionPosition?,depth?,probability?,semanticKey?,stateCondition?}]}; every entry requires a non-empty human-readable name, explicit level, non-empty content, and—while enabled—constant:true or primary keys. lorebook update: {name?,entries?}; entries replaces the complete ordered list, so preserve all returned canonical entry fields. persona: complete {name,description?,personality?,scenario?,firstMessage?,tags?}. preset create: {name,description?,fields?:[{id?,name,description?,content?,position,sectionTag?}]}; preset update: exact {name,description,fields:[{id,name,description,content,position,sectionTag}]}, preserving stable field UUIDs and explicit booleans. writingStyle: exact {name,description?,content}.',
      },
      bindToCurrentSession: { type: 'boolean', description: 'For create only. true also applies the new asset to this conversation; omit or false to create without binding.' },
      changes: { type: 'json', description: 'For bind only. Partial fields: cardId, lorebookIds, personaId, presetId, writingStyleIds. Null clears a singleton; arrays replace ordered bindings. Omitted fields stay unchanged.' },
    },
    output: assetOutput(),
    async execute(args, exec) {
      if (exec.agent === undefined) throw coded('RP_AGENT_REQUIRED', 'rp_asset requires an active Roleplay agent.')
      const action = requiredChoice(args.action, MUTATION_ACTIONS, 'action')
      const kind = action === 'bind' && args.kind === undefined ? undefined : requiredChoice(args.kind, KINDS, 'kind')
      let result
      try {
        result = action === 'create'
          ? await createAsset(ctx, exec.agent, kind, args)
          : action === 'update'
            ? await updateAsset(ctx, exec.agent, kind, args)
            : await bindAssets(ctx, exec.agent, args.changes)
      } catch (error) {
        ctx.rpRuntime.recordAssetMutationOutcome(exec.agent, failedMutation(action, kind, error))
        throw error
      }
      ctx.rpRuntime.recordAssetMutationOutcome(exec.agent, result)
      return result
    },
    presentCall: args => ({
      card: 'generic', title: '更新角色扮演资料', kind: 'write', rawInput: JSON.stringify(args),
    }),
    presentResult: (_args, result) => ({
      card: 'generic',
      title: result.isError ? '资料更新未完成' : '角色扮演资料已更新',
      kind: 'read',
      rawOutput: result.content,
    }),
  })
}

function assetOutput() {
  return {
    schema: { type: 'json' },
    render: (_args, value) => [{ type: 'text', text: JSON.stringify(stripMeta(value)) }],
    // DSH snapshots every top-level presentation projection as lossless JSON.
    // Read-only results intentionally have no business metadata, but the
    // projector itself must still return a JSON value rather than undefined.
    presentationMeta: (_args, value) => value.meta ?? {},
  }
}

async function createAsset(ctx, agent, kind, args) {
  const value = requiredRecord(args.value, 'value')
  const created = await createThroughAdapter(assetService(ctx, kind), value)
  const assetWrite = succeededWrite(created)
  let binding = { requested: args.bindToCurrentSession === true, applied: false }
  let bindingPhase = { status: binding.requested ? 'pending' : 'not-requested', durable: false }
  if (binding.requested) {
    try {
      const changes = createBindingChanges(ctx.rpSessions.get(agent), kind, created.id)
      const profile = await ctx.rpSessions.bindAssetChangesDuringRun(agent, { changes })
      binding = { requested: true, applied: true, profileRevision: profile.revision, resources: profile.resources }
      bindingPhase = { status: 'succeeded', durable: true, profileRevision: profile.revision }
    } catch (error) {
      binding = { requested: true, applied: false, error: publicError(error) }
      bindingPhase = { status: 'failed', durable: false, error: binding.error }
    }
  }
  const refreshed = await refreshOutcome(ctx, agent)
  return mutationResult('create', kind, {
    asset: created,
    binding,
    ...(refreshed.value === undefined ? {} : { runContext: refreshed.value }),
    phases: { assetWrite, binding: bindingPhase, contextRefresh: refreshed.phase },
  })
}

async function updateAsset(ctx, agent, kind, args) {
  const id = requiredId(args.id)
  if (!Number.isSafeInteger(args.expectedRevision) || args.expectedRevision < 1) {
    throw coded('INVALID_REQUEST', 'expectedRevision must be a positive integer.')
  }
  const value = requiredRecord(args.value, 'value')
  const updated = await updateThroughAdapter(assetService(ctx, kind), id, value, args.expectedRevision)
  const refreshed = await refreshOutcome(ctx, agent)
  return mutationResult('update', kind, {
    asset: updated,
    ...(refreshed.value === undefined ? {} : { runContext: refreshed.value }),
    phases: {
      assetWrite: succeededWrite(updated),
      binding: { status: 'not-requested', durable: false },
      contextRefresh: refreshed.phase,
    },
  })
}

async function bindAssets(ctx, agent, changes) {
  const normalized = normalizeChanges(changes)
  let profile
  try {
    profile = await ctx.rpSessions.bindAssetChangesDuringRun(agent, { changes: normalized })
  } catch (error) {
    const binding = { requested: true, applied: false, error: publicError(error) }
    return mutationResult('bind', undefined, {
      binding,
      phases: {
        assetWrite: { status: 'not-requested', durable: false },
        binding: { status: 'failed', durable: false, error: binding.error },
        contextRefresh: { status: 'skipped', durable: false },
      },
    })
  }
  const refreshed = await refreshOutcome(ctx, agent)
  return mutationResult('bind', undefined, {
    binding: { requested: true, applied: true, profileRevision: profile.revision, resources: profile.resources },
    ...(refreshed.value === undefined ? {} : { runContext: refreshed.value }),
    phases: {
      assetWrite: { status: 'not-requested', durable: false },
      binding: { status: 'succeeded', durable: true, profileRevision: profile.revision },
      contextRefresh: refreshed.phase,
    },
  })
}

function createBindingChanges(profile, kind, id) {
  if (kind === 'character') return { cardId: id }
  if (kind === 'persona') return { personaId: id }
  if (kind === 'preset') return { presetId: id }
  if (kind === 'lorebook') return { lorebookIds: [...new Set([...profile.resources.lorebooks.map(item => item.id), id])] }
  return { writingStyleIds: [...new Set([...profile.resources.writingStyles.map(item => item.id), id])] }
}

function normalizeChanges(value) {
  const input = requiredRecord(value, 'changes')
  const allowed = new Set(['cardId', 'lorebookIds', 'personaId', 'presetId', 'writingStyleIds'])
  if (Object.keys(input).length === 0 || Object.keys(input).some(key => !allowed.has(key))) throw coded('INVALID_REQUEST', 'changes contains no supported binding field or an unknown field.')
  const output = {}
  for (const key of ['cardId', 'personaId', 'presetId']) {
    if (!has(input, key)) continue
    output[key] = input[key] === null ? null : requiredId(input[key])
  }
  for (const key of ['lorebookIds', 'writingStyleIds']) {
    if (!has(input, key)) continue
    output[key] = idArray(input[key], key)
  }
  return output
}

function mutationResult(operation, kind, value) {
  const ok = Object.values(value.phases).every(phase => phase.status !== 'failed')
  const durable = Object.values(value.phases).some(phase => phase.durable === true)
  const assetId = value.asset?.id
  return {
    operation,
    ...(kind === undefined ? {} : { kind }),
    ok,
    ...value,
    ...(durable ? { meta: {
      kind: 'rp-agent/asset-mutation', version: 2, operation,
      ...(kind === undefined ? {} : { assetKind: kind }),
      ...(typeof assetId === 'string' ? { assetId } : {}),
    } } : {}),
  }
}

async function refreshOutcome(ctx, agent) {
  try {
    const value = await ctx.rpRuntime.refreshRunContext(agent)
    return { value, phase: { status: 'succeeded', durable: false, contextEpoch: value.contextEpoch } }
  } catch (error) {
    return { value: undefined, phase: { status: 'failed', durable: false, error: publicError(error) } }
  }
}

function succeededWrite(asset) {
  return {
    status: 'succeeded',
    durable: true,
    id: asset.id,
    ...(Number.isSafeInteger(asset.revision) ? { revision: asset.revision } : {}),
  }
}

function failedMutation(operation, kind, error) {
  return {
    operation,
    ...(kind === undefined ? {} : { kind }),
    ok: false,
    phases: {
      assetWrite: { status: operation === 'bind' ? 'not-requested' : 'failed', durable: false, ...(operation === 'bind' ? {} : { error: publicError(error) }) },
      binding: { status: operation === 'bind' ? 'failed' : 'skipped', durable: false, ...(operation === 'bind' ? { error: publicError(error) } : {}) },
      contextRefresh: { status: 'skipped', durable: false },
    },
  }
}

function stripMeta(value) { const { meta: _meta, ...rest } = value; return rest }
function modelReadableAsset(kind, asset) {
  if (kind !== 'character' || !Array.isArray(asset?.quarantinedPrompts)) return asset
  return {
    ...asset,
    quarantinedPrompts: asset.quarantinedPrompts.map(item => ({
      path: typeof item?.path === 'string' ? item.path : 'unknown',
      status: 'quarantined',
    })),
  }
}

async function currentSessionAssetPage(ctx, profile, kind, args) {
  const page = readPageInput(args)
  const items = []
  for (const id of rpAssetBindingIds(profile, kind)) {
    try {
      items.push(assetSummary(kind, await assetService(ctx, kind).detail(id)))
    } catch (error) {
      if (error?.code !== 'ASSET_NOT_FOUND') throw error
      items.push({ id, status: 'missing' })
    }
  }
  const filtered = items.filter(item => page.query.length === 0 || `${item.id} ${item.name ?? ''}`.toLocaleLowerCase().includes(page.query))
  const selected = filtered.slice(page.offset, page.offset + page.limit)
  return {
    items: selected,
    nextCursor: page.offset + selected.length < filtered.length ? String(page.offset + selected.length) : null,
    total: filtered.length,
  }
}

function assetSummary(kind, asset) {
  return {
    id: asset.id,
    ...(typeof asset.name === 'string' ? { name: asset.name } : {}),
    ...(Number.isSafeInteger(asset.revision) ? { revision: asset.revision } : {}),
    status: typeof asset.status === 'string' ? asset.status : 'ready',
    ...(kind === 'character' && typeof asset.hash === 'string' ? { hash: asset.hash } : {}),
  }
}
function readPageInput(args) {
  if (args.query !== undefined && typeof args.query !== 'string') throw coded('INVALID_REQUEST', 'query must be a string.')
  const query = typeof args.query === 'string' ? args.query.trim().toLocaleLowerCase() : ''
  const limit = args.limit === undefined ? 50 : args.limit
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) throw coded('INVALID_REQUEST', 'limit must be between 1 and 100.')
  const offset = args.cursor === undefined ? 0 : Number(args.cursor)
  if (!Number.isSafeInteger(offset) || offset < 0 || (args.cursor !== undefined && String(offset) !== String(args.cursor))) throw coded('INVALID_REQUEST', 'cursor is invalid.')
  return { query, limit, offset }
}
function listInput(args) { return { ...(typeof args.query === 'string' ? { query: args.query } : {}), ...(typeof args.cursor === 'string' ? { cursor: args.cursor } : {}), ...(Number.isSafeInteger(args.limit) ? { limit: args.limit } : {}) } }
function requiredChoice(value, choices, field) { if (typeof value !== 'string' || !choices.has(value)) throw coded('INVALID_REQUEST', `${field} is invalid.`); return value }
function requiredId(value) { if (typeof value !== 'string' || value.trim().length === 0) throw coded('INVALID_REQUEST', 'A non-empty asset id is required.'); return value }
function requiredRecord(value, field) { if (typeof value !== 'object' || value === null || Array.isArray(value)) throw coded('INVALID_REQUEST', `${field} must be an object.`); return value }
function idArray(value, field) { if (!Array.isArray(value) || value.some(id => typeof id !== 'string' || id.length === 0)) throw coded('INVALID_REQUEST', `${field} must be an array of asset ids.`); return [...new Set(value)] }
function has(value, key) { return Object.prototype.hasOwnProperty.call(value, key) }
function publicError(error) { return { code: typeof error?.code === 'string' ? error.code : 'BIND_FAILED', message: error instanceof Error ? error.message : String(error) } }
function coded(code, message) { const error = new Error(message); error.code = code; return error }
