window.__ModuleLoader__.load({
	id: "dsh-roleplay-rp-message-avatar",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		//#region \0rolldown/runtime.js
		var __create = Object.create;
		var __defProp = Object.defineProperty;
		var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
		var __getOwnPropNames = Object.getOwnPropertyNames;
		var __getProtoOf = Object.getPrototypeOf;
		var __hasOwnProp = Object.prototype.hasOwnProperty;
		var __copyProps = (to, from, except, desc) => {
			if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
				key = keys[i];
				if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
					get: ((k) => from[k]).bind(null, key),
					enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
				});
			}
			return to;
		};
		var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
			value: mod,
			enumerable: true
		}) : target, mod));
		//#endregion
		let react = require("react");
		react = __toESM(react, 1);
		let react_dom = require("react-dom");
		//#region src/client-state.js
		const OPENING_PROVIDER = "rp-session";
		const OPENING_MODEL = "selected-opening";
		/** Keep a materialized avatar key and withdraw it through hidden visibility. */
		function avatarNodeVisibility(context) {
			if (context.state?.visible === true) return "visible";
			const current = context.current?.get?.("chat");
			return current === void 0 || current === null ? void 0 : "hidden";
		}
		/** Match one visible user message while preserving its original transcript anchor. */
		function userAvatarMatch(event) {
			const action = messageAction(event);
			if (action !== void 0) {
				const target = action.targets.find((candidate) => candidate?.kind === "message" && candidate.role === "user");
				return target === void 0 ? null : {
					id: String(target.messageId),
					role: "update",
					target
				};
			}
			if (event?.type === "user/message" && event.data?.source?.kind === "user") return {
				id: String(event.data.id ?? event.seq),
				role: event.surfaceOp === "append" ? "start" : "update"
			};
			return null;
		}
		/** Match the host-selected opening independently from model turn output. */
		function openingAvatarMatch(event) {
			if (isOpening(event)) return {
				id: String(event.data.message.id ?? event.seq),
				role: event.surfaceOp === "append" ? "start" : "update"
			};
			return null;
		}
		/** Start one assistant-avatar projection per native turn. */
		function assistantAvatarStart(event) {
			return {
				turn: event.data.turn,
				side: "assistant",
				seq: void 0,
				messageId: void 0,
				visible: false,
				closed: false
			};
		}
		/** Attach identity to the last readable prose once its turn closes. */
		function assistantAvatarUpdate(state, event) {
			const action = messageAction(event);
			if (action !== void 0) {
				if (action.targets.find((candidate) => candidate?.kind === "message" && candidate.role === "assistant" && candidate.messageId === state.messageId) === void 0) return state;
				return {
					...state,
					visible: action.operation === "edit" && state.closed === true && hasVisibleContent(event.data?.message?.content)
				};
			}
			if (event?.type === "assistant/message" && event.data?.message?.source?.kind === "model" && !isOpening(event) && messageText(event.data.message).trim().length > 0) return {
				...state,
				seq: event.seq,
				messageId: event.data.message.id,
				visible: false
			};
			if (event?.type === "turn/end") return {
				...state,
				closed: true,
				visible: Number.isSafeInteger(state.seq)
			};
			return state;
		}
		/** Fold a message replacement without moving its avatar away from the original row. */
		function updateMessageAvatarState(state, event) {
			const action = messageAction(event);
			if (action !== void 0) return {
				...state,
				visible: action.operation === "edit" && hasVisibleContent(messageContent(event))
			};
			const content = state.side === "assistant" ? event?.data?.message?.content : event?.data?.content;
			return {
				...state,
				visible: hasVisibleContent(content)
			};
		}
		/** Find the resident transcript row immediately owned by an avatar projection. */
		function messageAvatarTarget(host, side) {
			const accepted = side === "user" ? /* @__PURE__ */ new Set(["user"]) : /* @__PURE__ */ new Set(["assistant-step", "rp-opening"]);
			for (let row = host?.previousElementSibling ?? null; row !== null; row = row.previousElementSibling) {
				const kind = row?.dataset?.chatFlowKind;
				if (accepted.has(kind)) return row;
				if (kind === "user" || kind === "steering") return null;
			}
			return null;
		}
		function messageAction(event) {
			const action = event?.type === "user/message" ? event.data?.source?.rpMessageAction : event?.type === "assistant/message" ? event.data?.message?.source?.rpMessageAction : void 0;
			return action?.kind === "rp-agent/message-action" && action.version === 1 && [
				"edit",
				"delete",
				"reroll"
			].includes(action.operation) && Array.isArray(action.targets) ? action : void 0;
		}
		function isOpening(event) {
			return event?.type === "assistant/message" && event.data?.message?.source?.provider === OPENING_PROVIDER && event.data?.message?.source?.model === OPENING_MODEL;
		}
		function messageText(message) {
			return Array.isArray(message?.content) ? message.content.filter((block) => block?.type === "text" && typeof block.text === "string").map((block) => block.text).join("") : "";
		}
		function messageContent(event) {
			return event?.type === "assistant/message" ? event.data?.message?.content : event?.data?.content;
		}
		function hasVisibleContent(content) {
			return Array.isArray(content) && content.some((block) => block?.type === "text" && typeof block.text === "string" && block.text.trim().length > 0);
		}
		//#endregion
		//#region src/client-styles.generated.js
		const css = {
			"assistantAvatar": "rp-message-avatar-assistantAvatar",
			"messageAvatar": "rp-message-avatar-messageAvatar",
			"portalAnchor": "rp-message-avatar-portalAnchor",
			"userAvatar": "rp-message-avatar-userAvatar"
		};
		const STYLE_ID = "dsh-roleplay-rp-message-avatar-styles";
		const STYLE_OWNER = "dsh-roleplay-rp-message-avatar";
		const STYLE_TEXT = ".rp-message-avatar-portalAnchor { display: none; }\n\n[data-chat-flow-kind=\"rp-message-avatar-user\"],\n[data-chat-flow-kind=\"rp-message-avatar-assistant\"],\n[data-chat-flow-kind=\"rp-message-avatar-opening\"] {\n  display: none;\n}\n\n[data-rp-message-avatar-host] { position: relative; }\n\n.rp-message-avatar-messageAvatar {\n  position: absolute;\n  top: 0;\n  z-index: 1;\n  display: flex;\n  width: 36px;\n  height: 36px;\n  overflow: hidden;\n  align-items: center;\n  justify-content: center;\n  border-radius: 50%;\n  background: var(--dsw-specific-bubble);\n  color: var(--dsw-alias-label-secondary);\n  font-size: 11px;\n  font-weight: 600;\n}\n\n.rp-message-avatar-userAvatar { left: calc(100% + 12px); }\n.rp-message-avatar-assistantAvatar { right: calc(100% + 11px); }\n[data-chat-flow-kind=\"rp-opening\"] > .rp-message-avatar-assistantAvatar { top: 2px; }\n\n.rp-message-avatar-messageAvatar img {\n  display: block;\n  width: 100%;\n  height: 100%;\n  object-fit: cover;\n}\n\n[data-conversation-scroll] { container: rp-conversation / inline-size; }\n@container rp-conversation (max-width: 843px) {\n  .rp-message-avatar-messageAvatar { display: none; }\n}\n";
		function ensureStyles() {
			document.getElementById(STYLE_ID)?.remove();
			const style = document.createElement("style");
			style.id = STYLE_ID;
			style.dataset.plugin = STYLE_OWNER;
			style.textContent = STYLE_TEXT;
			document.head.append(style);
			return () => style.remove();
		}
		//#endregion
		//#region src/client.js
		const inject = [
			"slots",
			"conversationEvents",
			"connection"
		];
		const h = react.default.createElement;
		const fallbackUser = Object.freeze({
			id: null,
			name: "我",
			hasAvatar: false
		});
		const fallbackAssistant = Object.freeze({
			id: null,
			name: "角色",
			hasAvatar: false
		});
		const detailRequests = /* @__PURE__ */ new WeakMap();
		const avatarRequests = /* @__PURE__ */ new WeakMap();
		const userAvatarNodeDefinition = {
			kind: "rp-message-avatar-user",
			target: "chat",
			match: userAvatarMatch,
			start: (_context, match) => ({
				seq: match.event.seq,
				messageId: match.id,
				side: "user",
				visible: Array.isArray(match.event.data?.content) && match.event.data.content.length > 0
			}),
			update: (context, match) => updateMessageAvatarState(context.state, match.event),
			buildViewNode: (context) => avatarNode(context, "rp-message-avatar-user")
		};
		function avatarNode(context, kind) {
			const visibility = avatarNodeVisibility(context);
			if (visibility === void 0 || !Number.isSafeInteger(context.state?.seq)) return null;
			return {
				key: context.key,
				kind,
				id: context.id,
				target: "chat",
				anchorSeq: context.state.seq + .025,
				location: context.start?.location ?? { kind: "unresolved" },
				visibility,
				data: context.state
			};
		}
		const assistantAvatarNodeDefinition = {
			kind: "rp-message-avatar-assistant",
			target: "chat",
			match: (event) => {
				const action = event?.type === "assistant/message" ? event.data?.message?.source?.rpMessageAction : event?.type === "user/message" ? event.data?.source?.rpMessageAction : void 0;
				const target = action?.kind === "rp-agent/message-action" && action.version === 1 ? action.targets?.find?.((candidate) => candidate?.kind === "message" && candidate.role === "assistant" && Number.isSafeInteger(candidate.turn)) : void 0;
				if (target !== void 0) return {
					id: String(target.turn),
					role: "update"
				};
				if (event?.type === "turn/start") return {
					id: String(event.data.turn),
					role: "start"
				};
				if (event?.type === "assistant/message" || event?.type === "turn/end") return Number.isSafeInteger(event.data?.turn) ? {
					id: String(event.data.turn),
					role: "update"
				} : null;
				return null;
			},
			start: (_context, match) => assistantAvatarStart(match.event),
			update: (context, match) => assistantAvatarUpdate(context.state, match.event),
			buildViewNode: (context) => avatarNode(context, "rp-message-avatar-assistant")
		};
		const openingAvatarNodeDefinition = {
			kind: "rp-message-avatar-opening",
			target: "chat",
			match: openingAvatarMatch,
			start: (_context, match) => ({
				seq: match.event.seq,
				messageId: match.id,
				side: "assistant",
				visible: true
			}),
			update: (context, match) => updateMessageAvatarState(context.state, match.event),
			buildViewNode: (context) => avatarNode(context, "rp-message-avatar-opening")
		};
		function apply(ctx) {
			ctx.effect(ensureStyles);
			ctx.conversationEvents.register(userAvatarNodeDefinition);
			ctx.conversationEvents.register(assistantAvatarNodeDefinition);
			ctx.conversationEvents.register(openingAvatarNodeDefinition);
			const injectUi = () => ({ connection: ctx.connection });
			for (const key of [
				"rp-message-avatar-user",
				"rp-message-avatar-assistant",
				"rp-message-avatar-opening"
			]) ctx.slots.inject("conversation.chat.node", () => ctx.slots.register({
				name: "conversation.chat.node",
				key,
				inject: injectUi
			}, MessageAvatarPortal));
		}
		function MessageAvatarPortal({ node, sessionId, useProjection, useSessions, connection }) {
			const roleplay = useSessions((state) => state.byId?.[sessionId]?.agentPreset === "roleplay");
			const profile = useProjection("rp/session");
			const anchorRef = (0, react.useRef)(null);
			const [target, setTarget] = (0, react.useState)(null);
			const side = node.data.side;
			(0, react.useLayoutEffect)(() => {
				if (!roleplay) {
					setTarget(null);
					return;
				}
				const host = anchorRef.current?.closest(`[data-chat-flow-kind="${node.kind}"]`);
				const row = messageAvatarTarget(host, side);
				if (!(row instanceof HTMLElement)) {
					setTarget(null);
					return;
				}
				row.setAttribute("data-rp-message-avatar-host", side);
				setTarget(row);
				return () => {
					if (row.getAttribute("data-rp-message-avatar-host") === side) row.removeAttribute("data-rp-message-avatar-host");
					setTarget(null);
				};
			}, [
				node.kind,
				roleplay,
				side
			]);
			return h(react.default.Fragment, null, h("span", {
				ref: anchorRef,
				className: css.portalAnchor,
				"aria-hidden": true
			}), roleplay && target !== null ? (0, react_dom.createPortal)(h(MessageAvatar, {
				connection,
				profile,
				side
			}), target) : null);
		}
		function MessageAvatar({ connection, profile, side }) {
			const bindingId = side === "assistant" ? profile?.resources?.card?.id : profile?.resources?.persona?.id;
			const [identity, setIdentity] = (0, react.useState)(side === "assistant" ? fallbackAssistant : fallbackUser);
			const [source, setSource] = (0, react.useState)(null);
			(0, react.useEffect)(() => {
				let live = true;
				setIdentity(side === "assistant" ? fallbackAssistant : fallbackUser);
				setSource(null);
				resolveIdentity(connection, side, bindingId).then((value) => {
					if (live) setIdentity(value);
				});
				return () => {
					live = false;
				};
			}, [
				bindingId,
				connection,
				side
			]);
			(0, react.useEffect)(() => {
				if (typeof identity.id !== "string" || identity.hasAvatar !== true) {
					setSource(null);
					return;
				}
				let live = true;
				cachedAvatar(connection, side, identity.id).then((value) => {
					if (live) setSource(value);
				});
				return () => {
					live = false;
				};
			}, [
				connection,
				identity.hasAvatar,
				identity.id,
				side
			]);
			const initial = identity.name?.trim()?.[0]?.toLocaleUpperCase() ?? (side === "assistant" ? "角" : "我");
			return h("span", {
				className: `${css.messageAvatar} ${side === "user" ? css.userAvatar : css.assistantAvatar}`,
				title: identity.name,
				"aria-hidden": true
			}, source === null ? initial : h("img", {
				src: source,
				alt: ""
			}));
		}
		async function resolveIdentity(connection, side, bindingId) {
			const fallback = side === "assistant" ? fallbackAssistant : fallbackUser;
			const route = side === "assistant" ? "/rp-character-cards" : "/rp-personas";
			if (typeof bindingId === "string") return cachedDetail(connection, `${route}:get:${bindingId}`, () => rpc(connection, route, "get", { id: bindingId })).catch(() => fallback);
			if (side === "assistant") return fallback;
			return cachedDetail(connection, `${route}:default`, async () => {
				const page = await rpc(connection, route, "list", { limit: 100 });
				return page.items.find((item) => item.id === page.defaultId) ?? fallback;
			}).catch(() => fallback);
		}
		function cachedDetail(connection, key, load) {
			let requests = detailRequests.get(connection);
			if (requests === void 0) {
				requests = /* @__PURE__ */ new Map();
				detailRequests.set(connection, requests);
			}
			let request = requests.get(key);
			if (request === void 0) {
				request = load();
				requests.set(key, request);
			}
			return request;
		}
		function cachedAvatar(connection, side, id) {
			let requests = avatarRequests.get(connection);
			if (requests === void 0) {
				requests = /* @__PURE__ */ new Map();
				avatarRequests.set(connection, requests);
			}
			const route = side === "assistant" ? "/rp-character-cards" : "/rp-personas";
			const key = `${route}:${id}`;
			let request = requests.get(key);
			if (request === void 0) {
				request = rpc(connection, route, "avatar", { id }).then((value) => `data:${value.mimeType};base64,${value.base64}`).catch(() => null);
				requests.set(key, request);
			}
			return request;
		}
		async function rpc(connection, route, endpoint, payload) {
			const transport = await connection.rpc.call(route, endpoint, payload);
			if (!transport?.ok || !transport.value?.ok) throw new Error("ROLEPLAY_ASSET_UNAVAILABLE");
			return transport.value.value;
		}
		//#endregion
		exports.apply = apply;
		exports.assistantAvatarNodeDefinition = assistantAvatarNodeDefinition;
		exports.inject = inject;
		exports.openingAvatarNodeDefinition = openingAvatarNodeDefinition;
		exports.userAvatarNodeDefinition = userAvatarNodeDefinition;
		return module.exports;
	}
});
