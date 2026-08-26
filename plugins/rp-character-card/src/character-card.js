import { createHash } from 'node:crypto'
import { deflateSync, inflateSync } from 'node:zlib'

const PNG_SIGNATURE = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
const PNG_SIGNATURE_LENGTH = PNG_SIGNATURE.length
const PNG_CHUNK_OVERHEAD = 12
const PRIVATE_METADATA_CHUNKS = new Set(['tEXt', 'iTXt', 'zTXt', 'eXIf'])
const CHARACTER_KEYWORDS = ['ccv3', 'chara']
const CHARACTER_V3_KEYWORD = CHARACTER_KEYWORDS[0]
const EMPTY_TAG_TOKEN = /<\s*(\/?)\s*([A-Za-z][\w:.-]*)\s*(\/?)\s*>/g

/** Error raised for an invalid or unsupported external character card. */
export class CharacterCardImportError extends Error {
  /**
   * @param {string} code Stable import failure code.
   * @param {string} message Human-readable diagnostic.
   * @param {{ cause?: unknown }} [options] Optional cause chain.
   */
  constructor(code, message, options) {
    super(message, options)
    this.name = 'CharacterCardImportError'
    this.code = code
  }
}

/**
 * Parse and sanitize one SillyTavern PNG character card.
 *
 * @param {Uint8Array} bytes Complete PNG bytes.
 * @param {{ maxTextCharacters: number }} limits Import limits.
 * @returns {{
 *   format: 'character_card_v1' | 'character_card_v2' | 'character_card_v3',
 *   specVersion?: string,
 *   sourceHash: string,
 *   sourcePayload: Record<string, unknown>,
 *   character: Record<string, unknown>,
 *   avatarBytes: Uint8Array,
 *   lorebookEntries: number,
 * }} Parsed import data.
 */
export function parseCharacterCard(bytes, limits) {
  if (!(bytes instanceof Uint8Array)) {
    throw new TypeError('character card bytes must be a Uint8Array')
  }
  assertPositiveInteger('maxTextCharacters', limits.maxTextCharacters)
  const chunks = readPngChunks(bytes)
  const rawSource = extractCharacterPayload(bytes, chunks)
  const { sourcePayload, quarantinedPrompts } = sanitizeSource(rawSource)
  const textCharacters = countTextCharacters(sourcePayload) + countTextCharacters(quarantinedPrompts)
  if (textCharacters > limits.maxTextCharacters) {
    throw new CharacterCardImportError(
      'CARD_TEXT_LIMIT_EXCEEDED',
      `Character card contains ${textCharacters} text characters; maximum is ${limits.maxTextCharacters}.`,
    )
  }

  const format = formatOf(sourcePayload)
  const character = normalizeCharacter(sourcePayload, format)
  const sourceJson = JSON.stringify({ sourcePayload, quarantinedPrompts })
  return {
    format,
    ...(typeof sourcePayload.spec_version === 'string'
      ? { specVersion: sourcePayload.spec_version }
      : {}),
    sourceHash: createHash('sha256').update(sourceJson, 'utf8').digest('hex'),
    sourcePayload,
    quarantinedPrompts,
    character,
    avatarBytes: stripPrivateMetadata(bytes, chunks),
    lorebookEntries: countLorebookEntries(sourcePayload),
  }
}

/**
 * Parse a PNG or standalone JSON community character card.
 *
 * @param {Uint8Array} bytes Complete file bytes.
 * @param {string} path Source path used for format selection.
 * @param {{ maxTextCharacters: number }} limits Import limits.
 * @returns {ReturnType<typeof parseCharacterCard>} Parsed card.
 */
export function parseCharacterCardFile(bytes, path, limits) {
  assertCardPath(path)
  if (path.toLowerCase().endsWith('.png')) return parseCharacterCard(bytes, limits)
  let source
  try {
    source = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes))
  } catch (error) {
    throw new CharacterCardImportError('INVALID_CHARACTER_DATA', `Failed to parse character-card JSON: ${error instanceof Error ? error.message : String(error)}`)
  }
  if (!isRecord(source)) throw new CharacterCardImportError('INVALID_CHARACTER_DATA', 'Character-card JSON must be an object.')
  const { sourcePayload, quarantinedPrompts } = sanitizeSource(source)
  const textCharacters = countTextCharacters(sourcePayload) + countTextCharacters(quarantinedPrompts)
  if (textCharacters > limits.maxTextCharacters) {
    throw new CharacterCardImportError('CARD_TEXT_LIMIT_EXCEEDED', `Character card contains ${textCharacters} text characters; maximum is ${limits.maxTextCharacters}.`)
  }
  const format = formatOf(sourcePayload)
  const sourceJson = JSON.stringify({ sourcePayload, quarantinedPrompts })
  return {
    format,
    ...(typeof sourcePayload.spec_version === 'string' ? { specVersion: sourcePayload.spec_version } : {}),
    sourceHash: createHash('sha256').update(sourceJson, 'utf8').digest('hex'),
    sourcePayload,
    quarantinedPrompts,
    character: normalizeCharacter(sourcePayload, format),
    avatarBytes: undefined,
    lorebookEntries: countLorebookEntries(sourcePayload),
  }
}

/**
 * Serialize the current editable character entity as a safe Character Card V3 object.
 * Preserved community fields remain available, while quarantined executable prompts
 * are deliberately exported as empty required fields.
 *
 * @param {Record<string, unknown>} character Current normalized character entity.
 * @param {{
 *   sourcePayload?: Record<string, unknown>,
 *   characterBook?: Record<string, unknown>,
 *   modificationDate?: number,
 *   maxTextCharacters?: number,
 * }} [options] Export inputs.
 */
export function serializeCharacterCardV3(character, options = {}) {
  if (!isRecord(character)) throw new TypeError('character must be an object')
  if (typeof character.name !== 'string' || character.name.trim().length === 0) {
    throw new CharacterCardImportError('INVALID_CHARACTER_DATA', 'Character name is required for export.')
  }
  const sourcePayload = isRecord(options.sourcePayload) ? options.sourcePayload : {}
  const sourceData = isRecord(sourcePayload.data) ? sourcePayload.data : {}
  const modificationDate = options.modificationDate ?? Math.floor(Date.now() / 1000)
  if (!Number.isSafeInteger(modificationDate) || modificationDate < 0) {
    throw new TypeError('modificationDate must be a non-negative integer')
  }

  const data = {
    ...sourceData,
    name: character.name,
    description: exportText(character.description),
    tags: exportStrings(character.tags),
    creator: exportText(character.creator),
    character_version: exportText(character.characterVersion) || '1.0',
    mes_example: exportText(character.messageExample),
    extensions: isRecord(character.extensions)
      ? character.extensions
      : isRecord(sourceData.extensions) ? sourceData.extensions : {},
    system_prompt: '',
    post_history_instructions: '',
    first_mes: exportText(character.firstMessage),
    alternate_greetings: exportStrings(character.alternateGreetings),
    personality: exportText(character.personality),
    scenario: exportText(character.scenario),
    creator_notes: exportText(character.creatorNotes),
    group_only_greetings: exportStrings(character.groupOnlyGreetings),
    modification_date: modificationDate,
  }

  if (typeof character.nickname === 'string' && character.nickname.length > 0) data.nickname = character.nickname
  else delete data.nickname
  if (isRecord(options.characterBook)) data.character_book = options.characterBook
  else delete data.character_book
  if (data.assets !== undefined && !Array.isArray(data.assets)) delete data.assets
  if (data.source !== undefined && (!Array.isArray(data.source) || data.source.some(value => typeof value !== 'string'))) delete data.source
  if (data.creator_notes_multilingual !== undefined
    && (!isRecord(data.creator_notes_multilingual) || Object.values(data.creator_notes_multilingual).some(value => typeof value !== 'string'))) {
    delete data.creator_notes_multilingual
  }
  if (data.creation_date !== undefined && (!Number.isSafeInteger(data.creation_date) || data.creation_date < 0)) delete data.creation_date

  const payload = { spec: 'chara_card_v3', spec_version: '3.0', data }
  if (options.maxTextCharacters !== undefined) {
    assertPositiveInteger('maxTextCharacters', options.maxTextCharacters)
    const textCharacters = countTextCharacters(payload)
    if (textCharacters > options.maxTextCharacters) {
      throw new CharacterCardImportError(
        'CARD_TEXT_LIMIT_EXCEEDED',
        `Exported character card contains ${textCharacters} text characters; maximum is ${options.maxTextCharacters}.`,
      )
    }
  }
  return payload
}

/**
 * Embed one Character Card V3 object into a clean PNG `ccv3` tEXt chunk.
 * A transparent one-pixel PNG is used when the character has no avatar.
 *
 * @param {Record<string, unknown>} payload Character Card V3 object.
 * @param {Uint8Array | undefined} avatarBytes Sanitized avatar PNG bytes.
 */
export function encodeCharacterCardV3Png(payload, avatarBytes) {
  if (!isRecord(payload) || payload.spec !== 'chara_card_v3' || payload.spec_version !== '3.0' || !isRecord(payload.data)) {
    throw new TypeError('payload must be a Character Card V3 object')
  }
  if (avatarBytes !== undefined && !(avatarBytes instanceof Uint8Array)) throw new TypeError('avatarBytes must be a Uint8Array')
  const png = avatarBytes ?? transparentPng()
  const chunks = readPngChunks(png)
  const json = JSON.stringify(payload)
  const encoded = Buffer.from(json, 'utf8').toString('base64')
  const characterChunk = pngChunk('tEXt', Buffer.from(`${CHARACTER_V3_KEYWORD}\0${encoded}`, 'latin1'))
  const retained = [png.subarray(0, PNG_SIGNATURE_LENGTH)]
  for (const chunk of chunks) {
    if (chunk.type === 'IEND') {
      retained.push(characterChunk, png.subarray(chunk.start, chunk.end))
      break
    }
    if (!PRIVATE_METADATA_CHUNKS.has(chunk.type)) retained.push(png.subarray(chunk.start, chunk.end))
  }
  return concatenateBytes(retained)
}

/**
 * Reject non-PNG names before reading or parsing bytes.
 *
 * @param {string} path Model/plugin supplied path.
 */
export function assertPngPath(path) {
  assertCardPath(path)
  if (!path.toLowerCase().endsWith('.png')) {
    throw new CharacterCardImportError('UNSUPPORTED_FORMAT', 'Unsupported character-card file. Expected .png.')
  }
}

/** @param {string} path */
export function assertCardPath(path) {
  if (typeof path !== 'string' || path.trim().length === 0) {
    throw new CharacterCardImportError('INVALID_PATH', '`path` must be a non-empty string.')
  }
  if (!path.toLowerCase().endsWith('.png') && !path.toLowerCase().endsWith('.json')) {
    throw new CharacterCardImportError(
      'UNSUPPORTED_FORMAT',
      'Unsupported character-card file. Community PNG and JSON cards are accepted.',
    )
  }
}

/** @param {Uint8Array} bytes */
function readPngChunks(bytes) {
  if (bytes.byteLength < PNG_SIGNATURE_LENGTH + PNG_CHUNK_OVERHEAD) {
    throw new CharacterCardImportError(
      'INVALID_PNG',
      'The file is too small to be a valid character card PNG.',
    )
  }
  for (let index = 0; index < PNG_SIGNATURE_LENGTH; index += 1) {
    if (bytes[index] !== PNG_SIGNATURE[index]) {
      throw new CharacterCardImportError('INVALID_PNG', 'The file is not a valid PNG.')
    }
  }

  /** @type {{ type: string, start: number, dataStart: number, dataEnd: number, end: number }[]} */
  const chunks = []
  let offset = PNG_SIGNATURE_LENGTH
  let foundEnd = false
  while (offset + PNG_CHUNK_OVERHEAD <= bytes.byteLength) {
    const length = readUint32(bytes, offset)
    const dataStart = offset + 8
    const dataEnd = dataStart + length
    const end = dataEnd + 4
    if (length > bytes.byteLength - offset - PNG_CHUNK_OVERHEAD || end > bytes.byteLength) {
      throw new CharacterCardImportError('INVALID_PNG', `Invalid PNG chunk length: ${length}.`)
    }
    const type = decodeLatin1(bytes.subarray(offset + 4, offset + 8))
    chunks.push({ type, start: offset, dataStart, dataEnd, end })
    offset = end
    if (type === 'IEND') {
      foundEnd = true
      break
    }
  }
  if (!foundEnd) {
    throw new CharacterCardImportError('INVALID_PNG', 'The PNG is missing its IEND chunk.')
  }
  return chunks
}

/**
 * @param {Uint8Array} bytes
 * @param {ReturnType<typeof readPngChunks>} chunks
 */
function extractCharacterPayload(bytes, chunks) {
  for (const keyword of CHARACTER_KEYWORDS) {
    for (const chunk of chunks) {
      if (chunk.type !== 'tEXt' && chunk.type !== 'iTXt' && chunk.type !== 'zTXt') continue
      const data = bytes.subarray(chunk.dataStart, chunk.dataEnd)
      const payload = chunk.type === 'tEXt'
        ? extractTextPayload(data, keyword)
        : chunk.type === 'iTXt'
          ? extractInternationalTextPayload(data, keyword)
          : extractCompressedTextPayload(data, keyword)
      if (payload !== undefined) return decodeCharacterPayload(payload)
    }
  }
  throw new CharacterCardImportError(
    'CHARACTER_DATA_NOT_FOUND',
    'No Character Card `ccv3` or `chara` payload was found in the PNG.',
  )
}

/** @param {Uint8Array} data @param {string} keyword */
function extractTextPayload(data, keyword) {
  const separator = data.indexOf(0)
  if (separator === -1) return undefined
  if (decodeLatin1(data.subarray(0, separator)) !== keyword) return undefined
  return decodeLatin1(data.subarray(separator + 1))
}

/** @param {Uint8Array} data @param {string} keyword */
function extractInternationalTextPayload(data, keyword) {
  const keywordEnd = data.indexOf(0)
  if (keywordEnd === -1) return undefined
  if (decodeLatin1(data.subarray(0, keywordEnd)) !== keyword) return undefined
  if (keywordEnd + 2 >= data.byteLength) {
    throw new CharacterCardImportError('INVALID_PNG_TEXT', 'The iTXt character data is incomplete.')
  }
  const compressionFlag = data[keywordEnd + 1]
  const compressionMethod = data[keywordEnd + 2]
  if ((compressionFlag !== 0 && compressionFlag !== 1) || compressionMethod !== 0) {
    throw new CharacterCardImportError(
      'UNSUPPORTED_ITXT_COMPRESSION',
      'Unsupported iTXt compression settings.',
    )
  }
  let textStart = skipNullTerminated(data, keywordEnd + 3, 'language tag')
  textStart = skipNullTerminated(data, textStart, 'translated keyword')
  const text = data.subarray(textStart)
  return compressionFlag === 1 ? inflatePayload(text, 'iTXt') : decodeLatin1(text)
}

/** @param {Uint8Array} data @param {string} keyword */
function extractCompressedTextPayload(data, keyword) {
  const separator = data.indexOf(0)
  if (separator === -1) return undefined
  if (decodeLatin1(data.subarray(0, separator)) !== keyword) return undefined
  if (separator + 1 >= data.byteLength) throw new CharacterCardImportError('INVALID_PNG_TEXT', 'The zTXt chunk is incomplete.')
  if (data[separator + 1] !== 0) throw new CharacterCardImportError('INVALID_PNG_TEXT', 'Unsupported zTXt compression method.')
  return inflatePayload(data.subarray(separator + 2), 'zTXt')
}

/** @param {Uint8Array} bytes @param {string} kind */
function inflatePayload(bytes, kind) {
  try {
    return inflateSync(bytes).toString('latin1')
  } catch (error) {
    throw new CharacterCardImportError('INVALID_PNG_TEXT', `Failed to decompress ${kind} character data: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/** @param {Uint8Array} data @param {number} offset @param {string} field */
function skipNullTerminated(data, offset, field) {
  const end = data.indexOf(0, offset)
  if (end === -1) {
    throw new CharacterCardImportError('INVALID_PNG_TEXT', `The iTXt chunk has no ${field} terminator.`)
  }
  return end + 1
}

/** @param {string} payload */
function decodeCharacterPayload(payload) {
  const compact = payload.trim()
  if (compact.length === 0 || compact.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(compact)) {
    throw new CharacterCardImportError('INVALID_CHARACTER_DATA', 'The `chara` payload is not valid base64.')
  }
  try {
    const decoded = Buffer.from(compact, 'base64')
    const json = new TextDecoder('utf-8', { fatal: true }).decode(decoded)
    const value = JSON.parse(json)
    if (!isRecord(value)) {
      throw new CharacterCardImportError('INVALID_CHARACTER_DATA', 'Character-card JSON must be an object.')
    }
    return value
  } catch (error) {
    if (error instanceof CharacterCardImportError) throw error
    throw new CharacterCardImportError(
      'INVALID_CHARACTER_DATA',
      `Failed to decode character-card data: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    )
  }
}

/** @param {unknown} value @returns {unknown} */
function sanitizeValue(value, path, quarantined) {
  if (Array.isArray(value)) return value.map((item, index) => sanitizeValue(item, `${path}/${index}`, quarantined))
  if (!isRecord(value)) return value
  const output = {}
  for (const [key, nested] of Object.entries(value)) {
    if (key === 'system_prompt' || key === 'post_history_instructions') {
      quarantined.push({ path: `${path}/${escapePointer(key)}`, key, value: nested })
      continue
    }
    output[key] = sanitizeValue(nested, `${path}/${escapePointer(key)}`, quarantined)
  }
  return output
}

/** @param {Record<string, unknown>} source */
function sanitizeSource(source) {
  const quarantinedPrompts = []
  return {
    sourcePayload: /** @type {Record<string, unknown>} */ (sanitizeValue(source, '', quarantinedPrompts)),
    quarantinedPrompts,
  }
}

/** @param {string} value */
function escapePointer(value) {
  return value.replaceAll('~', '~0').replaceAll('/', '~1')
}

/** @param {unknown} value */
function countTextCharacters(value) {
  if (typeof value === 'string') return [...value].length
  if (Array.isArray(value)) return value.reduce((total, item) => total + countTextCharacters(item), 0)
  if (isRecord(value)) {
    return Object.values(value).reduce((total, item) => total + countTextCharacters(item), 0)
  }
  return 0
}

/** @param {Record<string, unknown>} source */
function formatOf(source) {
  if (source.spec === 'chara_card_v3') return /** @type {const} */ ('character_card_v3')
  if (source.spec === 'chara_card_v2') return /** @type {const} */ ('character_card_v2')
  return /** @type {const} */ ('character_card_v1')
}

/**
 * @param {Record<string, unknown>} source
 * @param {'character_card_v1' | 'character_card_v2' | 'character_card_v3'} format
 */
function normalizeCharacter(source, format) {
  const data = isRecord(source.data) ? source.data : {}
  const getValue = (key) => data[key] ?? source[key]
  const getString = (key, alternateKey) => {
    const candidates = [data[key], source[key]]
    if (alternateKey !== undefined) candidates.push(data[alternateKey], source[alternateKey])
    for (const candidate of candidates) {
      const value = safeString(candidate)
      if (value.length > 0) return value
    }
    return ''
  }
  const getOptionalString = (key, alternateKey) => {
    const value = getString(key, alternateKey)
    return value.length === 0 ? undefined : value
  }
  const getStringList = (key) => stringList(getValue(key))
  const openings = normalizeOpenings(getString('first_mes', 'char_greeting'), getStringList('alternate_greetings'))
  const rawExtensions = getValue('extensions')
  const characterBook = getValue('character_book')

  return {
    schemaVersion: 1,
    source: 'imported',
    format,
    name: getString('name', 'char_name') || 'Unknown',
    description: getString('description'),
    personality: getString('personality'),
    scenario: getString('scenario', 'world_scenario'),
    firstMessage: openings.firstMessage,
    messageExample: getString('mes_example'),
    alternateGreetings: openings.alternateGreetings,
    tags: getStringList('tags'),
    ...(getOptionalString('creator_notes', 'creatorcomment') === undefined
      ? {}
      : { creatorNotes: getOptionalString('creator_notes', 'creatorcomment') }),
    ...(getOptionalString('creator') === undefined ? {} : { creator: getOptionalString('creator') }),
    characterVersion: getOptionalString('character_version')
      ?? (typeof source.spec_version === 'string' ? source.spec_version : '1.0'),
    ...(getOptionalString('nickname') === undefined ? {} : { nickname: getOptionalString('nickname') }),
    groupOnlyGreetings: getStringList('group_only_greetings'),
    ...(isRecord(rawExtensions) ? { extensions: rawExtensions } : {}),
    ...(isRecord(characterBook) ? { characterBook } : {}),
    externalAssetsImported: false,
  }
}

/** @param {unknown} value */
function safeString(value) {
  if (value === undefined || value === null) return ''
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map(safeString).join('\n')
  return String(value)
}

/** @param {unknown} value */
function stringList(value) {
  if (Array.isArray(value)) return value.map(safeString).filter((item) => item.length > 0)
  if (typeof value !== 'string' || value.length === 0) return []
  return value.includes(',')
    ? value.split(',').map((item) => item.trim()).filter(Boolean)
    : [value]
}

/** @param {string} firstMessage @param {string[]} alternates */
function normalizeOpenings(firstMessage, alternates) {
  const openings = [firstMessage, ...alternates].filter((opening) => opening.trim().length > 0)
  if (openings.length <= 1) {
    return { firstMessage: openings[0] ?? '', alternateGreetings: [] }
  }
  const meaningful = openings.filter((opening) => !isEmptyTagOnlyOpening(opening))
  return { firstMessage: meaningful[0] ?? '', alternateGreetings: meaningful.slice(1) }
}

/** @param {string} value */
function isEmptyTagOnlyOpening(value) {
  const openTags = []
  let cursor = 0
  let sawTag = false
  EMPTY_TAG_TOKEN.lastIndex = 0
  for (const match of value.matchAll(EMPTY_TAG_TOKEN)) {
    if (value.slice(cursor, match.index).trim().length > 0) return false
    sawTag = true
    const closing = match[1] === '/'
    const tagName = match[2].toLowerCase()
    const selfClosing = match[3] === '/'
    if (closing) {
      if (selfClosing || openTags.length === 0 || openTags.pop() !== tagName) return false
    } else if (!selfClosing) {
      openTags.push(tagName)
    }
    cursor = match.index + match[0].length
  }
  return sawTag && openTags.length === 0 && value.slice(cursor).trim().length === 0
}

/** @param {Record<string, unknown>} source */
function countLorebookEntries(source) {
  const data = isRecord(source.data) ? source.data : source
  const book = data.character_book
  if (!isRecord(book)) return 0
  if (Array.isArray(book.entries)) return book.entries.length
  if (isRecord(book.entries)) return Object.keys(book.entries).length
  return 0
}

/**
 * @param {Uint8Array} bytes
 * @param {ReturnType<typeof readPngChunks>} chunks
 */
function stripPrivateMetadata(bytes, chunks) {
  const retained = [bytes.subarray(0, PNG_SIGNATURE_LENGTH)]
  for (const chunk of chunks) {
    if (!PRIVATE_METADATA_CHUNKS.has(chunk.type)) retained.push(bytes.subarray(chunk.start, chunk.end))
    if (chunk.type === 'IEND') break
  }
  const length = retained.reduce((total, part) => total + part.byteLength, 0)
  const output = new Uint8Array(length)
  let offset = 0
  for (const part of retained) {
    output.set(part, offset)
    offset += part.byteLength
  }
  return output
}

function transparentPng() {
  const header = Buffer.alloc(13)
  header.writeUInt32BE(1, 0)
  header.writeUInt32BE(1, 4)
  header[8] = 8
  header[9] = 6
  return concatenateBytes([
    PNG_SIGNATURE,
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(Buffer.from([0, 0, 0, 0, 0]))),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

/** @param {string} type @param {Uint8Array} data */
function pngChunk(type, data) {
  if (!/^[A-Za-z]{4}$/.test(type)) throw new TypeError('PNG chunk type must contain four ASCII letters')
  const output = Buffer.alloc(PNG_CHUNK_OVERHEAD + data.byteLength)
  output.writeUInt32BE(data.byteLength, 0)
  output.write(type, 4, 4, 'ascii')
  output.set(data, 8)
  const checksumInput = output.subarray(4, 8 + data.byteLength)
  output.writeUInt32BE(crc32(checksumInput), 8 + data.byteLength)
  return output
}

/** @param {Uint8Array} bytes */
function crc32(bytes) {
  let value = 0xffffffff
  for (const byte of bytes) {
    value ^= byte
    for (let bit = 0; bit < 8; bit += 1) value = (value >>> 1) ^ (value & 1 ? 0xedb88320 : 0)
  }
  return (value ^ 0xffffffff) >>> 0
}

/** @param {Uint8Array[]} parts */
function concatenateBytes(parts) {
  const length = parts.reduce((total, part) => total + part.byteLength, 0)
  const output = new Uint8Array(length)
  let offset = 0
  for (const part of parts) {
    output.set(part, offset)
    offset += part.byteLength
  }
  return output
}

function exportText(value) { return typeof value === 'string' ? value : '' }
function exportStrings(value) { return Array.isArray(value) ? value.filter(item => typeof item === 'string') : [] }

/** @param {Uint8Array} bytes @param {number} offset */
function readUint32(bytes, offset) {
  return ((bytes[offset] * 0x1000000)
    + (bytes[offset + 1] << 16)
    + (bytes[offset + 2] << 8)
    + bytes[offset + 3]) >>> 0
}

/** @param {Uint8Array} bytes */
function decodeLatin1(bytes) {
  return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString('latin1')
}

/** @param {unknown} value @returns {value is Record<string, unknown>} */
function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** @param {string} name @param {number} value */
function assertPositiveInteger(name, value) {
  if (!Number.isInteger(value) || value < 1) throw new TypeError(`${name} must be a positive integer`)
}
