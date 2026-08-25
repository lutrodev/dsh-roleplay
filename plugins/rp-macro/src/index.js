import Schema from '@deepseek-ai/schemastery'
import { createRoleplayMacroStream, expandRoleplayMacros } from './syntax.js'

export const name = 'rp-macro'
export const inject = ['rpRuntime', 'rpSessions']
export const Config = Schema.object({})

export function apply(ctx) {
  ctx.rpRuntime.registerTextTransformer({
    id: 'rp.macro.identities',
    order: -100,
    async prepare({ agent, profile }) {
      const selectedProfile = profile ?? ctx.rpSessions.get(agent)
      const personaBinding = selectedProfile?.resources?.persona
      const cardBinding = selectedProfile?.resources?.card
      const personas = ctx.get?.('rpPersonas') ?? ctx.rpPersonas
      const characterCards = ctx.get?.('rpCharacterCards') ?? ctx.rpCharacterCards
      const [persona, character] = await Promise.all([
        resolveLiveAsset(personas, personaBinding),
        resolveLiveAsset(characterCards, cardBinding),
      ])
      return {
        revision: [
          character === undefined ? 'card:unbound' : `card:${character.id}:${character.revision}`,
          persona === undefined ? 'persona:unbound' : `persona:${persona.id}:${persona.revision}`,
        ].join('|'),
        userName: persona?.name,
        characterName: character?.name,
        public: {
          cardId: character?.id ?? null,
          cardRevision: character?.revision ?? null,
          characterName: character?.name ?? null,
          personaId: persona?.id ?? null,
          personaRevision: persona?.revision ?? null,
          userName: persona?.name ?? null,
        },
      }
    },
    transform(text, { prepared }) {
      return expandRoleplayMacros(text, prepared)
    },
    createStream({ prepared }) {
      return createRoleplayMacroStream(prepared)
    },
  })
}

async function resolveLiveAsset(service, binding) {
  if (service === undefined || binding === undefined) return undefined
  try {
    return await service.get(binding.id)
  } catch (error) {
    if (error?.code === 'ASSET_NOT_FOUND') return undefined
    throw error
  }
}
