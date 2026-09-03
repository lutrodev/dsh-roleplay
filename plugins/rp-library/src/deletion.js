import { profileFromEvents } from 'dsh-roleplay-rp-session/protocol'

const characterLifecycles = new Map()

/** Serialize card binding and deletion so a session cannot acquire a card while its deletion plan commits. */
export async function withCharacterLifecycle(cardId, operation) {
  const previous = characterLifecycles.get(cardId) ?? Promise.resolve()
  let release
  const current = new Promise(resolve => { release = resolve })
  characterLifecycles.set(cardId, current)
  await previous
  try {
    return await operation()
  } finally {
    release()
    if (characterLifecycles.get(cardId) === current) characterLifecycles.delete(cardId)
  }
}

/** Resolve user-facing deletion information without making Session inspection a deletion prerequisite. */
export async function previewCharacterDeletion(ctx, cardId, signal) {
  const plan = await buildCharacterDeletionPlan(cardId, signal, deletionAssetServices(ctx))
  try {
    return { ...plan, sessions: await sessionsReferencingCard(ctx, cardId, signal), sessionScanComplete: true }
  } catch {
    return { ...plan, sessions: [], sessionScanComplete: false }
  }
}

async function buildCharacterDeletionPlan(cardId, signal, services) {
  signal?.throwIfAborted()
  const card = await cardForDeletion(services.cards, cardId)
  const lorebooks = services.lorebooks === undefined ? [] : await lorebooksForCharacter(services.lorebooks, card, signal)
  return {
    card: { id: card.id, name: card.name, revision: card.revision },
    lorebooks,
  }
}

/** Delete the shared card independently; Sessions resolve a missing live reference as unbound. */
export function deleteCharacter(ctx, cardId, deleteLinkedLorebooks, signal) {
  return withCharacterLifecycle(cardId, async () => {
    const services = deletionAssetServices(ctx)
    const plan = await buildCharacterDeletionPlan(cardId, signal, services)
    signal?.throwIfAborted()
    const deletedCard = await services.cards.delete(cardId)

    const deletedLorebookIds = []
    const retainedLorebookIds = []
    if (deleteLinkedLorebooks && services.lorebooks !== undefined) {
      for (const lorebook of plan.lorebooks) {
        try {
          await services.lorebooks.delete(lorebook.id)
          deletedLorebookIds.push(lorebook.id)
        } catch (error) {
          if (error?.code !== 'ASSET_NOT_FOUND') retainedLorebookIds.push(lorebook.id)
        }
      }
    }

    return {
      deletedCard: { id: deletedCard.id, name: deletedCard.name },
      deletedLorebookIds,
      retainedLorebookIds,
    }
  })
}

async function sessionsReferencingCard(ctx, cardId, signal) {
  const sessions = new Map()
  for (const session of ctx.sessions.list()) sessions.set(session.id, session)

  let persisted
  try {
    persisted = await ctx.sessionPersistence.list(signalOptions(signal))
  } catch (cause) {
    throw lifecycleError('SESSION_SCAN_FAILED', 'Could not list persisted sessions before character deletion.', cause)
  }

  const matches = []
  for (const session of sessions.values()) {
    signal?.throwIfAborted()
    if (profileCardId(session.snapshotEvents()) !== cardId) continue
    matches.push(sessionReference(ctx, session.id, true))
  }
  for (const snapshot of persisted) {
    signal?.throwIfAborted()
    const { id } = snapshot.header
    if (sessions.has(id)) continue
    let events
    try {
      events = await readPersistedSessionEvents(ctx.sessionPersistence, id, signal)
    } catch (cause) {
      throw lifecycleError('SESSION_SCAN_FAILED', `Could not read persisted session ${id} before character deletion.`, cause)
    }
    if (profileCardId(events) !== cardId) continue
    matches.push(sessionReference(ctx, id, false))
  }
  return matches.sort((left, right) => left.id.localeCompare(right.id))
}

async function readPersistedSessionEvents(persistence, id, signal) {
  const options = signalOptions(signal)
  const handle = await persistence.open(id, 'read', options)
  try {
    return await handle.read(0, undefined, options)
  } finally {
    await handle.close()
  }
}

function signalOptions(signal) {
  return signal === undefined ? undefined : { signal }
}

function sessionReference(ctx, id, live) {
  return { id, live, running: ctx.agents.get(id)?.status === 'running' }
}

function profileCardId(events) {
  const profile = profileFromEvents(events ?? [])
  return profile?.resources?.card?.id
}

async function lorebooksForCharacter(lorebooks, card, signal) {
  const linkedIds = new Set(Array.isArray(card.linkedLorebookIds) ? card.linkedLorebookIds : [])
  const linkedNames = new Map()
  for (const relation of Array.isArray(card.embeddedLorebooks) ? card.embeddedLorebooks : []) {
    if (typeof relation?.id !== 'string') continue
    linkedIds.add(relation.id)
    linkedNames.set(relation.id, relation.name)
  }
  const matches = new Map()
  for (const id of linkedIds) {
    matches.set(id, { id, name: linkedNames.get(id) ?? '关联世界书' })
  }
  try {
    for (const lorebook of await lorebooks.listDeletionCandidates(card.id, signal)) {
      if (!matches.has(lorebook.id)) matches.set(lorebook.id, lorebook)
    }
  } catch {
    // Recorded forward links remain sufficient to delete the card. A reverse
    // metadata scan is cleanup information and must never become a delete lock.
  }
  return [...matches.values()].sort((left, right) => left.name.localeCompare(right.name) || left.id.localeCompare(right.id))
}

async function cardForDeletion(cards, cardId) {
  try {
    return await cards.detail(cardId)
  } catch (error) {
    if (error?.code !== 'ASSET_CORRUPT') throw error
    return { id: cardId, name: '角色卡', revision: null, linkedLorebookIds: [], embeddedLorebooks: [] }
  }
}

function deletionAssetServices(ctx) {
  const cards = optionalService(ctx, 'rpCharacterCards')
  if (cards === undefined) throw lifecycleError('ASSET_SERVICE_UNAVAILABLE', 'Character card materials are not enabled.')
  return { cards, lorebooks: optionalService(ctx, 'rpLoreBooks') }
}

function optionalService(ctx, name) {
  return typeof ctx.get === 'function' ? ctx.get(name) : ctx[name]
}

function lifecycleError(code, message, cause) {
  const error = new Error(message, cause === undefined ? undefined : { cause })
  error.code = code
  return error
}
