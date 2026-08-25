import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { Context } from '@deepseek-ai/cordis'
import SessionStore, { SessionId } from '@deepseek-ai/dsh-session'
import SqliteSessionPersistence from '@deepseek-ai/dsh-session-persistence-sqlite'
import Storage from '@deepseek-ai/dsh-storage'
import { JsonStorageBackend } from '@deepseek-ai/dsh-storage-json'
import { DomainFacility } from '@deepseek-ai/dsh-storage-domain'
import WorkspaceRegistry from '@deepseek-ai/dsh-workspace'
import { dispatch } from 'dsh-roleplay-rp-library'
import { encodeSessionCommand, profileFromEvents } from 'dsh-roleplay-rp-session/protocol'

test('character deletion leaves real Harness live/cold Session logs intact and removes the shared assets', async () => {
  const root = await mkdtemp(join(tmpdir(), 'rp-archive-cascade-'))
  const ctx = new Context()
  const storageBackend = new JsonStorageBackend(join(root, 'storage'))
  const storageDomain = new DomainFacility(ctx, { backend: 'json', routes: {} })
  const cardId = '00000000-0000-0000-0000-000000000070'
  const lorebookId = '00000000-0000-0000-0000-000000000071'
  const deleted = []

  try {
    await ctx.plugin(Storage)
    ctx.storage.backend.register('json', storageBackend)
    ctx.storage.mount('domain', storageDomain)
    ctx.provide('storageDomain', storageDomain)
    await ctx.plugin(SessionStore)
    await ctx.plugin(SqliteSessionPersistence, {
      path: join(root, 'sessions.db'),
      journalMode: 'delete',
      writeBatchMaxDelayMs: 1,
    })
    await ctx.plugin(WorkspaceRegistry)

    const liveOwner = await sessionOwner(ctx)
    const coldOwner = await sessionOwner(ctx)
    const live = liveOwner.ctx.sessions.create(SessionId('rp-live-reference'))
    const cold = coldOwner.ctx.sessions.create(SessionId('rp-cold-reference'))
    appendProfile(live, cardId)
    appendProfile(cold, cardId)
    await ctx.sessions.flush(live)
    await ctx.sessions.flush(cold)
    await coldOwner.fiber.dispose()

    assert.equal(ctx.sessions.get(cold.id), undefined)
    assert.deepEqual((await ctx.sessionPersistence.list()).map(header => header.id).sort(), [cold.id, live.id])

    const rpCharacterCards = {
      detail: async () => ({
        id: cardId,
        name: 'Detached Integration Hero',
        revision: 1,
        linkedLorebookIds: [lorebookId],
        embeddedLorebooks: [{ id: lorebookId, name: 'Archive Integration Lore' }],
      }),
      delete: async id => {
        deleted.push(`card:${id}`)
        return { id, name: 'Detached Integration Hero' }
      },
    }
    const rpLoreBooks = {
      listDeletionCandidates: async () => [{ id: lorebookId, name: 'Retained Integration Lore' }],
      delete: async id => { deleted.push(`lore:${id}`) },
    }
    const deletionCtx = { rpCharacterCards, rpLoreBooks }

    const result = await dispatch(deletionCtx, 'character/delete', {
      id: cardId,
      deleteLinkedLorebooks: true,
    })

    assert.equal(Object.hasOwn(result, 'detachedSessionIds'), false)
    assert.deepEqual(ctx.workspaceRegistry.archivedSessionIds, [])
    assert.deepEqual(deleted, [`card:${cardId}`, `lore:${lorebookId}`])

    const coldSnapshot = await ctx.sessionPersistence.inspect(cold.id)
    const liveSnapshot = await ctx.sessionPersistence.inspect(live.id)
    assert.deepEqual(profileFromEvents(coldSnapshot.events).resources.card, { id: cardId })
    assert.deepEqual(profileFromEvents(liveSnapshot.events).resources.card, { id: cardId })
    assert.ok(ctx.sessions.get(live.id), 'deleting the card must not hide or dispose the live session')

    await liveOwner.fiber.dispose()
  } finally {
    await ctx.fiber.dispose()
    await storageDomain.closeAll()
    await storageBackend.close()
    await rm(root, { recursive: true, force: true })
  }
})

async function sessionOwner(ctx) {
  let ownerContext
  const fiber = await ctx.plugin(Object.assign((inner) => { ownerContext = inner }, { inject: ['sessions'] }))
  return { ctx: ownerContext, fiber }
}

function appendProfile(session, cardId) {
  const commandId = `bind-${session.id}`
  session.append('command/run', {
    commandId,
    name: 'rp-session-apply',
    args: encodeSessionCommand(0, {
      revision: 1,
      mode: 'adaptive',
      cast: [],
      resources: { card: { id: cardId }, lorebooks: [] },
    }),
    source: { kind: 'user' },
  })
  session.append('command/done', { commandId, kind: 'success' })
}
