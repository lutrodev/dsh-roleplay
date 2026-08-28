import type { Context } from '@deepseek-ai/cordis'
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import type { RoleplayRemotePayload, RoleplayTransportResponse } from './types.ts'

export type {
  RoleplayDomainError,
  RoleplayDomainResult,
  RoleplayJsonValue,
  RoleplayRemotePayload,
  RoleplayTransportResponse,
} from './types.ts'

export const ROLEPLAY_REMOTE_ROUTES = [
  '/rp-assets',
  '/rp-character-cards',
  '/rp-features',
  '/rp-lore-books',
  '/rp-message-actions',
  '/rp-personas',
  '/rp-presets',
  '/rp-quick-replies',
  '/rp-subagents',
  '/rp-writing-styles',
] as const

export type RoleplayRemoteRoute = typeof ROLEPLAY_REMOTE_ROUTES[number]

export type RoleplayRemoteHandler = (
  endpoint: string,
  payload: RoleplayRemotePayload,
  signal: AbortSignal,
) => RoleplayTransportResponse | Promise<RoleplayTransportResponse>

declare module '@deepseek-ai/cordis' {
  interface Context {
    rpRemote: RoleplayRemoteHost
  }
}

export class RoleplayRemoteHost extends TypertRemoteService {
  private readonly handlers = new Map<RoleplayRemoteRoute, RoleplayRemoteHandler>()

  constructor(ctx: Context) {
    super(ctx, 'rpRemote', { namespace: 'roleplay' })
  }

  register(route: RoleplayRemoteRoute, handler: RoleplayRemoteHandler): () => void {
    if (this.handlers.has(route)) throw new Error(`rp-remote: duplicate handler for ${route}`)
    this.handlers.set(route, handler)
    return () => {
      if (this.handlers.get(route) === handler) this.handlers.delete(route)
    }
  }

  @Remote('assets')
  assets(endpoint: string, payload: RoleplayRemotePayload, signal: AbortSignal): Promise<RoleplayTransportResponse> {
    return this.dispatch('/rp-assets', endpoint, payload, signal)
  }

  @Remote('characterCards')
  characterCards(endpoint: string, payload: RoleplayRemotePayload, signal: AbortSignal): Promise<RoleplayTransportResponse> {
    return this.dispatch('/rp-character-cards', endpoint, payload, signal)
  }

  @Remote('features')
  features(endpoint: string, payload: RoleplayRemotePayload, signal: AbortSignal): Promise<RoleplayTransportResponse> {
    return this.dispatch('/rp-features', endpoint, payload, signal)
  }

  @Remote('loreBooks')
  loreBooks(endpoint: string, payload: RoleplayRemotePayload, signal: AbortSignal): Promise<RoleplayTransportResponse> {
    return this.dispatch('/rp-lore-books', endpoint, payload, signal)
  }

  @Remote('messageActions')
  messageActions(endpoint: string, payload: RoleplayRemotePayload, signal: AbortSignal): Promise<RoleplayTransportResponse> {
    return this.dispatch('/rp-message-actions', endpoint, payload, signal)
  }

  @Remote('personas')
  personas(endpoint: string, payload: RoleplayRemotePayload, signal: AbortSignal): Promise<RoleplayTransportResponse> {
    return this.dispatch('/rp-personas', endpoint, payload, signal)
  }

  @Remote('presets')
  presets(endpoint: string, payload: RoleplayRemotePayload, signal: AbortSignal): Promise<RoleplayTransportResponse> {
    return this.dispatch('/rp-presets', endpoint, payload, signal)
  }

  @Remote('quickReplies')
  quickReplies(endpoint: string, payload: RoleplayRemotePayload, signal: AbortSignal): Promise<RoleplayTransportResponse> {
    return this.dispatch('/rp-quick-replies', endpoint, payload, signal)
  }

  @Remote('subagents')
  subagents(endpoint: string, payload: RoleplayRemotePayload, signal: AbortSignal): Promise<RoleplayTransportResponse> {
    return this.dispatch('/rp-subagents', endpoint, payload, signal)
  }

  @Remote('writingStyles')
  writingStyles(endpoint: string, payload: RoleplayRemotePayload, signal: AbortSignal): Promise<RoleplayTransportResponse> {
    return this.dispatch('/rp-writing-styles', endpoint, payload, signal)
  }

  private async dispatch(
    route: RoleplayRemoteRoute,
    endpoint: string,
    payload: RoleplayRemotePayload,
    signal: AbortSignal,
  ): Promise<RoleplayTransportResponse> {
    const handler = this.handlers.get(route)
    if (handler === undefined) throw new Error(`rp-remote: no handler is registered for ${route}`)
    return await handler(endpoint, payload, signal)
  }
}

export default RoleplayRemoteHost
