import { Service } from '@deepseek-ai/cordis'
import roleplayRemote from 'dsh-roleplay-rp-remote/remote'

export const inject = ['remote']

const ROUTE_METHOD = Object.freeze({
  '/rp-assets': 'assets',
  '/rp-character-cards': 'characterCards',
  '/rp-features': 'features',
  '/rp-lore-books': 'loreBooks',
  '/rp-message-actions': 'messageActions',
  '/rp-personas': 'personas',
  '/rp-presets': 'presets',
  '/rp-quick-replies': 'quickReplies',
  '/rp-subagents': 'subagents',
  '/rp-writing-styles': 'writingStyles',
})

class RoleplayRemoteClient extends Service {
  constructor(ctx, namespace) {
    super(ctx, 'rpRemote')
    this.namespace = namespace
  }

  async call(route, endpoint, payload = {}, signal) {
    const method = ROUTE_METHOD[route]
    if (method === undefined) throw Object.assign(new Error(`Unknown Roleplay Remote route: ${String(route)}`), { code: 'INVALID_ROUTE' })
    const transport = await this.namespace[method](endpoint, payload, signal)
    if (!transport.ok) {
      throw Object.assign(new Error(transport.error.message), {
        code: transport.error.code,
        details: transport.error.details,
      })
    }
    return transport.value
  }
}

export async function apply(ctx) {
  const dispose = await ctx.remote.$mount(roleplayRemote)
  const namespace = ctx.get('remote.roleplay')
  if (namespace === undefined) {
    await dispose()
    throw new Error('rp-remote: mounted Roleplay Remote namespace is unavailable')
  }
  new RoleplayRemoteClient(ctx, namespace)
  return dispose
}
