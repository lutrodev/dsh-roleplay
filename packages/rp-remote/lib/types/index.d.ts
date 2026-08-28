import type { Context } from '@deepseek-ai/cordis';
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import type { RoleplayRemotePayload, RoleplayTransportResponse } from './types.ts';
export type { RoleplayDomainError, RoleplayDomainResult, RoleplayJsonValue, RoleplayRemotePayload, RoleplayTransportResponse, } from './types.ts';
export declare const ROLEPLAY_REMOTE_ROUTES: readonly ["/rp-assets", "/rp-character-cards", "/rp-features", "/rp-lore-books", "/rp-message-actions", "/rp-personas", "/rp-presets", "/rp-quick-replies", "/rp-subagents", "/rp-writing-styles"];
export type RoleplayRemoteRoute = typeof ROLEPLAY_REMOTE_ROUTES[number];
export type RoleplayRemoteHandler = (endpoint: string, payload: RoleplayRemotePayload, signal: AbortSignal) => RoleplayTransportResponse | Promise<RoleplayTransportResponse>;
declare module '@deepseek-ai/cordis' {
    interface Context {
        rpRemote: RoleplayRemoteHost;
    }
}
export declare class RoleplayRemoteHost extends TypertRemoteService {
    private readonly handlers;
    constructor(ctx: Context);
    register(route: RoleplayRemoteRoute, handler: RoleplayRemoteHandler): () => void;
    assets(endpoint: string, payload: RoleplayRemotePayload, signal: AbortSignal): Promise<RoleplayTransportResponse>;
    characterCards(endpoint: string, payload: RoleplayRemotePayload, signal: AbortSignal): Promise<RoleplayTransportResponse>;
    features(endpoint: string, payload: RoleplayRemotePayload, signal: AbortSignal): Promise<RoleplayTransportResponse>;
    loreBooks(endpoint: string, payload: RoleplayRemotePayload, signal: AbortSignal): Promise<RoleplayTransportResponse>;
    messageActions(endpoint: string, payload: RoleplayRemotePayload, signal: AbortSignal): Promise<RoleplayTransportResponse>;
    personas(endpoint: string, payload: RoleplayRemotePayload, signal: AbortSignal): Promise<RoleplayTransportResponse>;
    presets(endpoint: string, payload: RoleplayRemotePayload, signal: AbortSignal): Promise<RoleplayTransportResponse>;
    quickReplies(endpoint: string, payload: RoleplayRemotePayload, signal: AbortSignal): Promise<RoleplayTransportResponse>;
    subagents(endpoint: string, payload: RoleplayRemotePayload, signal: AbortSignal): Promise<RoleplayTransportResponse>;
    writingStyles(endpoint: string, payload: RoleplayRemotePayload, signal: AbortSignal): Promise<RoleplayTransportResponse>;
    private dispatch;
}
export default RoleplayRemoteHost;
//# sourceMappingURL=index.d.ts.map