import Schema from '@deepseek-ai/schemastery'
import {
  convertMvuImport,
  mvuStateNamespace,
  stripMvuControlBlocks,
} from './convert.js'
import { createMvuLoreActivation } from './lore-adapter.js'
import { materializeMvuProfile } from './materialize.js'

export * from './convert.js'
export * from './initial-value.js'
export * from './lore-adapter.js'
export * from './materialize.js'
export * from './native-state.js'
export * from './state-template.js'
export const name = 'rp-compat-mvu'
export const inject = []
export const Config = Schema.object({})

export function apply(ctx) {
  ctx.inject(['rpCharacterCards'], cardsCtx => cardsCtx.rpCharacterCards.registerImportTransformer({
    id: 'compat.mvu',
    transform: convertMvuImport,
  }))

  ctx.inject(['rpSessionBootstrap'], bootstrapCtx =>
    bootstrapCtx.rpSessionBootstrap.registerMaterializer({
      id: 'compat.mvu',
      async prepare({ character, books, profile }) {
        const cards = bootstrapCtx.get('rpCharacterCards')
        if (character !== undefined && cards === undefined) throw new Error('compat.mvu requires rpCharacterCards for the selected character')
        const source = character === undefined ? undefined : await cards.getSource(character.id)
        return materializeMvuProfile({ profile, character, source, books, blank: true })
      },
    }))

  ctx.inject(['rpSessions'], sessionCtx =>
    sessionCtx.rpSessions.registerProfileMaterializer({
      id: 'compat.mvu',
      async prepare({ agent, profile }) {
        const previousProfile = sessionCtx.rpSessions.get(agent)
        const blank = !agent.session.events.some(event => event?.type === 'user/message')
        if (!blank) return undefined
        const characterId = profile.resources.card?.id
        const cards = sessionCtx.get('rpCharacterCards')
        if (characterId !== undefined && cards === undefined) throw new Error('compat.mvu requires rpCharacterCards for the bound character')
        const character = characterId === undefined ? undefined : await liveAsset(cards, 'get', characterId)
        const source = character === undefined ? undefined : await liveAsset(cards, 'getSource', characterId)
        const books = []
        const lorebooks = sessionCtx.get('rpLoreBooks')
        if (profile.resources.lorebooks.length > 0 && lorebooks === undefined) throw new Error('compat.mvu requires rpLoreBooks for bound lorebooks')
        for (const binding of profile.resources.lorebooks) {
          const book = await liveAsset(lorebooks, 'get', binding.id)
          if (book !== undefined) books.push(book)
        }
        return materializeMvuProfile({
          profile,
          previousProfile,
          character,
          source,
          books,
          blank,
        })
      },
    }))

  ctx.inject(['rpLoreBooks'], loreCtx => loreCtx.rpLoreBooks.registerActivationAdapter({
    id: 'compat.mvu',
    prepare({ agent, profile }) {
      return createMvuLoreActivation(
        loreCtx.get('rpState')?.get(agent),
        mvuStateNamespace(),
      )
    },
  }))

  ctx.inject(['rpRuntime'], runtimeCtx => runtimeCtx.rpRuntime.registerTextTransformer({
    id: 'compat.mvu.controls',
    order: -100,
    transform(text, context) {
      if (context.phase === 'opening' || (context.phase === 'context' && context.sourceId === 'rp.card')) {
        return stripMvuControlBlocks(text).text
      }
      return text
    },
  }))
}

async function liveAsset(service, method, id) {
  try {
    return await service[method](id)
  } catch (error) {
    if (error?.code === 'ASSET_NOT_FOUND' || error?.code === 'ASSET_CORRUPT' || error?.code === 'UNSUPPORTED_SCHEMA') return undefined
    throw error
  }
}
