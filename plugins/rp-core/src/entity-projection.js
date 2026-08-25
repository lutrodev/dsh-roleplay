import { decodeRpCommitEvent, rpReplacedEntitySeqs } from './protocol.js'
import { decodeRpMessageActionEvent } from './conversation.js'

/**
 * Fold one Session event into a list of active entities owned by native
 * Session surface nodes.
 *
 * Every returned entity keeps the business event's immutable sequence as
 * `rootSeq`, its currently active owner node as `currentSeq`, and the
 * projection-specific value selected from that event. The business event may
 * be later than its surface owner (for example a command/done owned by the
 * assistant message that invoked it). A normal surface rewrite moves
 * `currentSeq` without re-applying the value. Only a Roleplay native message
 * delete or reroll carrier removes cited entities.
 *
 * @param {readonly { rootSeq: number, currentSeq: number, value: unknown }[]} entities Active entities.
 * @param {unknown} event Next Session event.
 * @param {{
 *   select(event: unknown): { currentSeq: number, value: unknown } | undefined,
 * }} options Projection-specific selector.
 * @returns {{
 *   entities: readonly { rootSeq: number, currentSeq: number, value: unknown }[],
 *   appended?: { rootSeq: number, currentSeq: number, value: unknown },
 *   removed: readonly { rootSeq: number, currentSeq: number, value: unknown }[],
 *   changed: boolean,
 *   valueChanged: boolean,
 * }} Fold result. `undefined` from `select` means this event owns no entity for the projection.
 */
export function foldSurfaceOwnedEntities(entities, event, options) {
  if (!Array.isArray(entities)) throw new TypeError('surface-owned entities must be an array')
  if (typeof options?.select !== 'function') throw new TypeError('surface-owned entity projection requires select()')

  const replaced = new Set(rpReplacedEntitySeqs(event, entities))
  const action = decodeRpMessageActionEvent(event)
  const retracts = action?.operation === 'delete' || action?.operation === 'reroll'
  const removed = !retracts || replaced.size === 0
    ? []
    : entities.filter(entity => replaced.has(entity?.currentSeq))
  let next = removed.length === 0
    ? entities
    : entities.filter(entity => !replaced.has(entity?.currentSeq))
  let moved = false
  if (!retracts && replaced.size > 0 && Number.isSafeInteger(event?.seq)) {
    next = entities.map(entity => {
      if (!replaced.has(entity?.currentSeq)) return entity
      moved = true
      return { ...entity, currentSeq: event.seq }
    })
  }

  const selected = options.select(event)
  if (selected === undefined) return {
    entities: next,
    removed,
    changed: removed.length > 0 || moved,
    valueChanged: removed.length > 0,
  }
  if (!Number.isSafeInteger(event?.seq) || event.seq < 0) throw new TypeError('surface-owned entity root event requires a non-negative safe sequence')
  if (!Number.isSafeInteger(selected?.currentSeq) || selected.currentSeq < 0 || selected.currentSeq > event.seq) {
    throw new TypeError('surface-owned entity requires an existing non-negative owner sequence')
  }

  const appended = { rootSeq: event.seq, currentSeq: selected.currentSeq, value: selected.value }
  next = [...next, appended]
  return { entities: next, appended, removed, changed: true, valueChanged: true }
}

/**
 * Fold entities selected from successful `rp_commit_turn` results.
 *
 * Kept as the stable projection helper for existing extension plugins; commit
 * results own themselves on the native surface while sharing all replacement
 * and retraction semantics with other surface-owned entities.
 */
export function foldCommitBackedEntities(entities, event, options) {
  if (typeof options?.select !== 'function') throw new TypeError('commit-backed entity projection requires select()')
  const decode = options.decodeCommitEvent ?? decodeRpCommitEvent
  if (typeof decode !== 'function') throw new TypeError('decodeCommitEvent must be a function')
  return foldSurfaceOwnedEntities(entities, event, {
    select(candidate) {
      if (candidate?.type !== 'tool/result' || candidate.surfaceOp !== 'append') return undefined
      const commit = decode(candidate)
      if (commit === undefined) return undefined
      const value = options.select(commit, candidate)
      return value === undefined ? undefined : { currentSeq: candidate.seq, value }
    },
  })
}
