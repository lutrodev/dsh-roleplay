import { resolve } from 'node:path'
import Schema from '@deepseek-ai/schemastery'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { assertCardPath } from './character-card.js'
import { RpCharacterCards } from './service.js'

export { RpCharacterCards } from './service.js'
export * from './character-card.js'

export const name = 'rp-character-card'
export const inject = []

export const Config = Schema.object({
  libraryDir: Schema.string().required(),
  maxInputBytes: Schema.number().default(8 * 1024 * 1024),
  maxTextCharacters: Schema.number().default(1000000),
  registerTool: Schema.boolean().default(true),
  exposeBrowser: Schema.boolean().default(false),
})

/**
 * Register the model-facing SillyTavern PNG importer.
 *
 * @param {import('@deepseek-ai/cordis').Context} ctx Harness context.
 * @param {{ libraryDir: string, maxInputBytes: number, maxTextCharacters: number }} config Plugin config.
 */
export function apply(ctx, config) {
  assertPositiveInteger('maxInputBytes', config.maxInputBytes)
  assertPositiveInteger('maxTextCharacters', config.maxTextCharacters)
  const libraryDir = resolve(config.libraryDir)
  const cards = new RpCharacterCards(ctx, { ...config, libraryDir })

  if (config.exposeBrowser) ctx.inject(['connection'], browserCtx => registerBrowserLibrary(browserCtx, cards))
  if (config.registerTool === false) return
  ctx.inject(['tools', 'fs'], toolCtx => registerImportTool(toolCtx, cards, config))
}

function registerImportTool(ctx, cards, config) {
  ctx.tools.register(defineTool({
    name: 'import_character_card',
    description: 'Import one local community character-card file. Call with {"path":"/absolute/or/workspace/card.png"}; .png and .json V1/V2/V3 cards are accepted. This creates a shared character asset but does not bind it to the current conversation; if the user also asked to apply it, call rp_asset with action:"bind" and changes:{cardId:<returned id>} after import succeeds. Executable prompts are quarantined and PNG private metadata is removed.',
    parameters: {
      path: {
        type: 'string',
        required: true,
        description: 'Required local .png or .json path in the active filesystem execution world. Pass only the path string, not file contents or an asset id.',
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          id: { type: 'string', required: true },
          name: { type: 'string', required: true },
          revision: { type: 'integer', required: true },
          format: { type: 'string', required: true },
          specVersion: { type: 'string' },
          sourceHash: { type: 'string', required: true },
          characterDirectory: { type: 'string', required: true },
          avatarPath: { type: 'string' },
          sourcePath: { type: 'string', required: true },
          characterPath: { type: 'string', required: true },
          quarantinePath: { type: 'string' },
          tags: { type: 'array', required: true, items: { type: 'string' } },
          lorebookEntries: { type: 'integer', required: true },
          quarantinedPrompts: { type: 'integer', required: true },
        },
      },
      render: (_args, value) => [{
        type: 'text',
        text: `Imported ${value.name} (${value.format}) as character ${value.id}. Stored ${value.lorebookEntries} lorebook entries and quarantined ${value.quarantinedPrompts} executable prompts.`,
      }],
    },
    async execute(args, exec) {
      assertCardPath(args.path)
      const target = await ctx.fs.resolve(args.path, { signal: exec.signal })
      const bytes = await ctx.fs.readBytes(target, exec.signal, config.maxInputBytes)
      return cards.import(bytes, { path: target.displayPath, signal: exec.signal })
    },
    presentCall: args => ({
      card: 'generic',
      title: 'Import character card',
      kind: 'read',
      rawInput: args.path,
      locations: [{ path: args.path }],
    }),
  }))
}

const BROWSER_ENDPOINTS = new Set(['list', 'get', 'avatar', 'import', 'export', 'create', 'update'])

/** Register the browser API behind the active DSH trusted-host boundary. */
function registerBrowserLibrary(ctx, cards) {
  const connection = ctx.get('connection')
  if (connection === undefined) throw new Error('rp-character-card: injected connection is unavailable')
  const dispose = connection.rpc.handle('/rp-character-cards', async (endpoint, payload, signal) => {
    if (!BROWSER_ENDPOINTS.has(endpoint)) return transportSuccess(failure('INVALID_REQUEST', `Unknown character-card endpoint: ${endpoint}`))
    try {
      return transportSuccess(success(await dispatchBrowser(cards, endpoint, payload, signal)))
    } catch (error) {
      return transportSuccess(failure(codeFor(error), error instanceof Error ? error.message : String(error)))
    }
  }, { authority: 'trusted-host' })
  ctx.effect(() => dispose, 'rp-character-card: /rp-character-cards RPC')
}

/** Dispatch one validated browser library request. */
export async function dispatchBrowser(cards, endpoint, payload, signal) {
  const input = object(payload)
  switch (endpoint) {
    case 'list': return cards.list(listRequest(input))
    case 'get': return cards.detail(requiredId(input.id))
    case 'avatar': {
      const id = requiredId(input.id)
      const bytes = await cards.avatar(id)
      return { id, mimeType: 'image/png', base64: Buffer.from(bytes).toString('base64') }
    }
    case 'import': {
      const file = decodeUpload(input, cards.maxInputBytes)
      const imported = await cards.import(file.bytes, { path: file.name, signal })
      return { imported, detail: await cards.detail(imported.id) }
    }
    case 'export': {
      const exported = await cards.exportV3Png(requiredId(input.id))
      return {
        fileName: exported.fileName,
        mimeType: exported.mimeType,
        format: exported.format,
        specVersion: exported.specVersion,
        lorebooks: exported.lorebooks,
        lorebookEntries: exported.lorebookEntries,
        base64: Buffer.from(exported.bytes).toString('base64'),
      }
    }
    case 'create': return cards.create(object(input.character))
    case 'update': return cards.update(requiredId(input.id), editablePatch(input.patch), optionalRevision(input.expectedRevision))
    default: throw coded('INVALID_REQUEST', `Unknown character-card endpoint: ${endpoint}`)
  }
}

function decodeUpload(input, maxBytes) {
  if (typeof input.name !== 'string' || input.name.trim().length === 0 || input.name.length > 255) throw coded('INVALID_REQUEST', 'upload name is invalid')
  if (input.name.includes('/') || input.name.includes('\\')) throw coded('INVALID_REQUEST', 'upload name must not contain a path')
  const mime = typeof input.mimeType === 'string' ? input.mimeType.toLocaleLowerCase() : ''
  if (!['image/png', 'application/json'].includes(mime)) throw coded('UNSUPPORTED_FORMAT', `Unsupported MIME type: ${String(input.mimeType)}`)
  if (!['.png', '.json'].some(extension => input.name.toLocaleLowerCase().endsWith(extension))) throw coded('UNSUPPORTED_FORMAT', `Unsupported file name: ${input.name}`)
  if (typeof input.base64 !== 'string' || input.base64.length === 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(input.base64) || input.base64.length % 4 !== 0) throw coded('INVALID_REQUEST', 'base64 is invalid')
  if (input.base64.length > Math.ceil(maxBytes / 3) * 4) throw coded('LIMIT_EXCEEDED', `File exceeds the ${maxBytes} byte limit.`)
  const bytes = Buffer.from(input.base64, 'base64')
  if (bytes.byteLength > maxBytes) throw coded('LIMIT_EXCEEDED', `File exceeds the ${maxBytes} byte limit.`)
  if (bytes.toString('base64') !== input.base64) throw coded('INVALID_REQUEST', 'base64 is not canonical')
  return { name: input.name, bytes: new Uint8Array(bytes) }
}

function listRequest(input) { return { query: input.query ?? '', cursor: input.cursor, limit: input.limit ?? 50 } }
function editablePatch(value) { return object(value) }
function optionalRevision(value) { if (value === undefined) return undefined; if (!Number.isSafeInteger(value) || value < 1) throw coded('INVALID_REQUEST', 'expectedRevision must be a positive integer'); return value }
function object(value) { if (typeof value !== 'object' || value === null || Array.isArray(value)) throw coded('INVALID_REQUEST', 'request payload must be an object'); return value }
function requiredId(value) { if (typeof value !== 'string' || !/^[0-9a-f-]{36}$/.test(value)) throw coded('INVALID_REQUEST', 'asset id is invalid'); return value }
function success(value) { return { ok: true, value } }
function failure(code, message) { return { ok: false, error: { code, message } } }
function transportSuccess(value) { return { ok: true, value } }
function coded(code, message, cause) { const error = new Error(message, { cause }); error.code = code; return error }
function codeFor(error) {
  if (error?.code === 'DUPLICATE_CARD') return 'DUPLICATE_ASSET'
  if (error?.code === 'CARD_TEXT_LIMIT_EXCEEDED') return 'LIMIT_EXCEEDED'
  if (['UNSUPPORTED_FORMAT', 'INVALID_PATH'].includes(error?.code)) return 'UNSUPPORTED_FORMAT'
  if (['INVALID_REQUEST', 'LIMIT_EXCEEDED', 'DUPLICATE_ASSET', 'ASSET_CORRUPT', 'ASSET_NOT_FOUND', 'ASSET_SERVICE_UNAVAILABLE', 'REVISION_CONFLICT'].includes(error?.code)) return error.code
  if (typeof error?.code === 'string' && (error.code.startsWith('INVALID_') || error.code.endsWith('_NOT_FOUND'))) return 'ASSET_CORRUPT'
  return 'ASSET_CORRUPT'
}

/** @param {string} key @param {number} value */
function assertPositiveInteger(key, value) {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`rp-character-card: ${key} must be a positive integer`)
  }
}
