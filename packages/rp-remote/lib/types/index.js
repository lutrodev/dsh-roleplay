var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
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
];
let RoleplayRemoteHost = (() => {
    let _classSuper = TypertRemoteService;
    let _instanceExtraInitializers = [];
    let _assets_decorators;
    let _characterCards_decorators;
    let _features_decorators;
    let _loreBooks_decorators;
    let _messageActions_decorators;
    let _personas_decorators;
    let _presets_decorators;
    let _quickReplies_decorators;
    let _subagents_decorators;
    let _writingStyles_decorators;
    return class RoleplayRemoteHost extends _classSuper {
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _assets_decorators = [Remote('assets')];
            _characterCards_decorators = [Remote('characterCards')];
            _features_decorators = [Remote('features')];
            _loreBooks_decorators = [Remote('loreBooks')];
            _messageActions_decorators = [Remote('messageActions')];
            _personas_decorators = [Remote('personas')];
            _presets_decorators = [Remote('presets')];
            _quickReplies_decorators = [Remote('quickReplies')];
            _subagents_decorators = [Remote('subagents')];
            _writingStyles_decorators = [Remote('writingStyles')];
            __esDecorate(this, null, _assets_decorators, { kind: "method", name: "assets", static: false, private: false, access: { has: obj => "assets" in obj, get: obj => obj.assets }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _characterCards_decorators, { kind: "method", name: "characterCards", static: false, private: false, access: { has: obj => "characterCards" in obj, get: obj => obj.characterCards }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _features_decorators, { kind: "method", name: "features", static: false, private: false, access: { has: obj => "features" in obj, get: obj => obj.features }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _loreBooks_decorators, { kind: "method", name: "loreBooks", static: false, private: false, access: { has: obj => "loreBooks" in obj, get: obj => obj.loreBooks }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _messageActions_decorators, { kind: "method", name: "messageActions", static: false, private: false, access: { has: obj => "messageActions" in obj, get: obj => obj.messageActions }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _personas_decorators, { kind: "method", name: "personas", static: false, private: false, access: { has: obj => "personas" in obj, get: obj => obj.personas }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _presets_decorators, { kind: "method", name: "presets", static: false, private: false, access: { has: obj => "presets" in obj, get: obj => obj.presets }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _quickReplies_decorators, { kind: "method", name: "quickReplies", static: false, private: false, access: { has: obj => "quickReplies" in obj, get: obj => obj.quickReplies }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _subagents_decorators, { kind: "method", name: "subagents", static: false, private: false, access: { has: obj => "subagents" in obj, get: obj => obj.subagents }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _writingStyles_decorators, { kind: "method", name: "writingStyles", static: false, private: false, access: { has: obj => "writingStyles" in obj, get: obj => obj.writingStyles }, metadata: _metadata }, null, _instanceExtraInitializers);
            if (_metadata) Object.defineProperty(this, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        handlers = (__runInitializers(this, _instanceExtraInitializers), new Map());
        constructor(ctx) {
            super(ctx, 'rpRemote', { namespace: 'roleplay' });
        }
        register(route, handler) {
            if (this.handlers.has(route))
                throw new Error(`rp-remote: duplicate handler for ${route}`);
            this.handlers.set(route, handler);
            return () => {
                if (this.handlers.get(route) === handler)
                    this.handlers.delete(route);
            };
        }
        assets(endpoint, payload, signal) {
            return this.dispatch('/rp-assets', endpoint, payload, signal);
        }
        characterCards(endpoint, payload, signal) {
            return this.dispatch('/rp-character-cards', endpoint, payload, signal);
        }
        features(endpoint, payload, signal) {
            return this.dispatch('/rp-features', endpoint, payload, signal);
        }
        loreBooks(endpoint, payload, signal) {
            return this.dispatch('/rp-lore-books', endpoint, payload, signal);
        }
        messageActions(endpoint, payload, signal) {
            return this.dispatch('/rp-message-actions', endpoint, payload, signal);
        }
        personas(endpoint, payload, signal) {
            return this.dispatch('/rp-personas', endpoint, payload, signal);
        }
        presets(endpoint, payload, signal) {
            return this.dispatch('/rp-presets', endpoint, payload, signal);
        }
        quickReplies(endpoint, payload, signal) {
            return this.dispatch('/rp-quick-replies', endpoint, payload, signal);
        }
        subagents(endpoint, payload, signal) {
            return this.dispatch('/rp-subagents', endpoint, payload, signal);
        }
        writingStyles(endpoint, payload, signal) {
            return this.dispatch('/rp-writing-styles', endpoint, payload, signal);
        }
        async dispatch(route, endpoint, payload, signal) {
            const handler = this.handlers.get(route);
            if (handler === undefined)
                throw new Error(`rp-remote: no handler is registered for ${route}`);
            return await handler(endpoint, payload, signal);
        }
    };
})();
export { RoleplayRemoteHost };
export default RoleplayRemoteHost;
//# sourceMappingURL=index.js.map