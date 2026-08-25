import { randomUUID } from 'node:crypto'
import { mkdir, rename, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

/**
 * Persist one parsed card as an atomic character-library entry.
 *
 * @param {{
 *   format: string,
 *   specVersion?: string,
 *   sourceHash: string,
 *   sourcePayload: Record<string, unknown>,
 *   quarantinedPrompts: unknown[],
 *   character: Record<string, unknown>,
 *   avatarBytes?: Uint8Array,
 *   lorebookEntries: number,
 * }} parsed Parsed character card.
 * @param {{ libraryDir: string, sourcePath: string, signal?: AbortSignal, id?: string }} options Persistence options.
 * @returns {Promise<{
 *   id: string,
 *   name: string,
 *   revision: number,
 *   format: string,
 *   specVersion?: string,
 *   sourceHash: string,
 *   characterDirectory: string,
 *   avatarPath?: string,
 *   sourcePath: string,
 *   characterPath: string,
 *   tags: string[],
 *   lorebookEntries: number,
 *   quarantinedPrompts: number,
 * }>} Durable import summary.
 */
export async function persistCharacterCard(parsed, options) {
  const libraryDir = resolve(options.libraryDir)
  await mkdir(libraryDir, { recursive: true })
  throwIfAborted(options.signal)

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const id = options.id ?? randomUUID()
    const finalDirectory = resolve(libraryDir, id)
    const temporaryDirectory = resolve(libraryDir, `.${id}.tmp-${randomUUID()}`)
    let temporaryCreated = false
    try {
      await mkdir(temporaryDirectory)
      temporaryCreated = true
      const avatarPath = parsed.avatarBytes === undefined ? undefined : resolve(finalDirectory, 'avatar.png')
      const sourcePath = resolve(finalDirectory, 'source.json')
      const characterPath = resolve(finalDirectory, 'character.json')
      const quarantinePath = parsed.quarantinedPrompts.length === 0 ? undefined : resolve(finalDirectory, 'quarantine.json')
      const character = {
        ...parsed.character,
        id,
        revision: 1,
        sourceHash: parsed.sourceHash,
        ...(avatarPath === undefined ? {} : { avatarPath }),
        quarantinedPromptCount: parsed.quarantinedPrompts.length,
      }
      const manifest = {
        schemaVersion: 1,
        id,
        importedAt: new Date().toISOString(),
        format: parsed.format,
        ...(parsed.specVersion === undefined ? {} : { specVersion: parsed.specVersion }),
        sourceHash: parsed.sourceHash,
        originalPath: options.sourcePath,
        ...(avatarPath === undefined ? {} : { avatarPath }),
        sourcePath,
        characterPath,
        ...(quarantinePath === undefined ? {} : { quarantinePath }),
        lorebookEntries: parsed.lorebookEntries,
      }
      await writeJson(resolve(temporaryDirectory, 'source.json'), parsed.sourcePayload, options.signal)
      await writeJson(resolve(temporaryDirectory, 'character.json'), character, options.signal)
      await writeJson(resolve(temporaryDirectory, 'manifest.json'), manifest, options.signal)
      if (quarantinePath !== undefined) await writeJson(resolve(temporaryDirectory, 'quarantine.json'), parsed.quarantinedPrompts, options.signal)
      if (parsed.avatarBytes !== undefined) await writeFile(resolve(temporaryDirectory, 'avatar.png'), parsed.avatarBytes, { signal: options.signal })
      throwIfAborted(options.signal)
      await rename(temporaryDirectory, finalDirectory)
      return {
        id,
        name: typeof character.name === 'string' ? character.name : 'Unknown',
        revision: 1,
        format: parsed.format,
        ...(parsed.specVersion === undefined ? {} : { specVersion: parsed.specVersion }),
        sourceHash: parsed.sourceHash,
        characterDirectory: finalDirectory,
        ...(avatarPath === undefined ? {} : { avatarPath }),
        sourcePath,
        characterPath,
        ...(quarantinePath === undefined ? {} : { quarantinePath }),
        tags: Array.isArray(character.tags)
          ? character.tags.filter((tag) => typeof tag === 'string')
          : [],
        lorebookEntries: parsed.lorebookEntries,
        quarantinedPrompts: parsed.quarantinedPrompts.length,
      }
    } catch (error) {
      if (temporaryCreated) await rm(temporaryDirectory, { recursive: true, force: true })
      if (/** @type {NodeJS.ErrnoException} */ (error).code === 'EEXIST' && attempt < 2) continue
      throw error
    }
  }
  throw new Error('failed to allocate a unique character-card directory')
}

/** @param {string} path @param {unknown} value @param {AbortSignal | undefined} signal */
function writeJson(path, value, signal) {
  return writeFile(path, `${JSON.stringify(value, null, 2)}\n`, { encoding: 'utf8', signal })
}

/** @param {AbortSignal | undefined} signal */
function throwIfAborted(signal) {
  if (signal?.aborted) throw signal.reason ?? new DOMException('The operation was aborted.', 'AbortError')
}
