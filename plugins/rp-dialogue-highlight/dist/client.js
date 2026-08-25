window.__ModuleLoader__.load({
	id: "dsh-roleplay-rp-dialogue-highlight",
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
		//#region src/dialogue-ranges.js
		const OPEN_TO_CLOSE = /* @__PURE__ */ new Map([
			["“", "”"],
			["‘", "’"],
			["「", "」"],
			["『", "』"],
			["«", "»"],
			["‹", "›"],
			["\"", "\""],
			["＂", "＂"]
		]);
		const CLOSERS = new Set(OPEN_TO_CLOSE.values());
		const BOUNDARY = "\0";
		/**
		* Locate quoted spans in rendered prose. Offsets include both quote marks so
		* punctuation and delimiters receive one continuous treatment.
		*/
		function findDialogueRanges(text, { includeUnclosed = false } = {}) {
			const ranges = [];
			const stack = [];
			for (let index = 0; index < text.length; index += 1) {
				const character = text[index];
				if (character === BOUNDARY) {
					stack.length = 0;
					continue;
				}
				const closing = OPEN_TO_CLOSE.get(character);
				if (closing !== void 0) {
					const top = stack.at(-1);
					if (closing === character && top?.closing === character) {
						stack.pop();
						if (index > top.start) ranges.push({
							start: top.start,
							end: index + 1
						});
					} else stack.push({
						start: index,
						closing
					});
					continue;
				}
				if (!CLOSERS.has(character)) continue;
				const top = stack.at(-1);
				if (top?.closing !== character) continue;
				stack.pop();
				if (index > top.start) ranges.push({
					start: top.start,
					end: index + 1
				});
			}
			if (includeUnclosed) {
				for (const opening of stack) if (text.length > opening.start) ranges.push({
					start: opening.start,
					end: text.length
				});
			}
			return ranges.sort((left, right) => left.start - right.start || right.end - left.end);
		}
		//#endregion
		//#region src/dom-highlight.js
		const HIGHLIGHT_NAME = "rp-dialogue";
		const OVERLAY_ATTRIBUTE = "data-rp-dialogue-overlay";
		const SPAN_ATTRIBUTE = "data-rp-dialogue-span";
		const EXCLUDED = "pre, code, button, textarea, input, select, script, style, svg, [contenteditable=\"true\"], [aria-hidden=\"true\"], [data-variant=\"think\"]";
		const BLOCK_TAGS = /* @__PURE__ */ new Set([
			"ADDRESS",
			"ARTICLE",
			"BLOCKQUOTE",
			"DIV",
			"FIGCAPTION",
			"FIGURE",
			"H1",
			"H2",
			"H3",
			"H4",
			"H5",
			"H6",
			"LI",
			"OL",
			"P",
			"SECTION",
			"TABLE",
			"UL"
		]);
		const nativeEntries = /* @__PURE__ */ new Map();
		/** Mount one non-invasive annotation against the DSH-owned assistant root. */
		function mountDialogueHighlight(root, entry, { streaming = false } = {}) {
			const native = nativeCapability(root);
			if (native !== void 0) try {
				return mountNativeHighlight(root, entry, native, streaming);
			} catch {
				discardNativeEntry(entry, native.registry);
			}
			return mountFallbackOverlay(root, streaming);
		}
		function mountNativeHighlight(root, entry, capability, streaming) {
			const refresh = () => publishNative(entry, capability, rangesForElement(root, streaming));
			refresh();
			const Observer = root.ownerDocument.defaultView?.MutationObserver;
			const observer = typeof Observer === "function" ? new Observer(refresh) : void 0;
			observer?.observe(root, {
				childList: true,
				characterData: true,
				subtree: true
			});
			return () => {
				observer?.disconnect();
				removeNativeEntry(entry);
			};
		}
		function mountFallbackOverlay(root, streaming) {
			const document = root.ownerDocument;
			const view = document.defaultView;
			let overlay;
			let frame;
			let disposed = false;
			const requestFrame = typeof view?.requestAnimationFrame === "function" ? (callback) => view.requestAnimationFrame(callback) : (callback) => view?.setTimeout(callback, 16);
			const cancelFrame = typeof view?.cancelAnimationFrame === "function" ? (value) => view.cancelAnimationFrame(value) : (value) => view?.clearTimeout(value);
			const position = () => {
				if (overlay === void 0) return;
				const rect = root.getBoundingClientRect();
				overlay.hidden = rect.width <= 0 || rect.height <= 0;
				overlay.style.top = `${rect.top}px`;
				overlay.style.left = `${rect.left}px`;
				overlay.style.width = `${rect.width}px`;
				overlay.style.height = `${rect.height}px`;
			};
			const rebuild = () => {
				frame = void 0;
				if (disposed) return;
				overlay?.remove();
				overlay = createFallbackOverlay(root, streaming);
				position();
			};
			const schedule = () => {
				if (disposed || frame !== void 0) return;
				frame = requestFrame(rebuild);
			};
			rebuild();
			const Observer = view?.MutationObserver;
			const observer = typeof Observer === "function" ? new Observer(schedule) : void 0;
			observer?.observe(root, {
				attributes: true,
				childList: true,
				characterData: true,
				subtree: true
			});
			const ResizeObserver = view?.ResizeObserver;
			const resizeObserver = typeof ResizeObserver === "function" ? new ResizeObserver(schedule) : void 0;
			resizeObserver?.observe(root);
			view?.addEventListener("scroll", position, true);
			view?.addEventListener("resize", schedule);
			document.fonts?.ready?.then?.(schedule);
			return () => {
				disposed = true;
				observer?.disconnect();
				resizeObserver?.disconnect();
				view?.removeEventListener("scroll", position, true);
				view?.removeEventListener("resize", schedule);
				if (frame !== void 0) cancelFrame(frame);
				overlay?.remove();
			};
		}
		function createFallbackOverlay(root, streaming) {
			const document = root.ownerDocument;
			if (document.body === null) return void 0;
			const overlay = root.cloneNode(true);
			if (overlay.nodeType !== 1) return void 0;
			overlay.querySelectorAll(`[${OVERLAY_ATTRIBUTE}]`).forEach((node) => node.remove());
			overlay.removeAttribute("id");
			overlay.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
			const segments = textSegments(overlay);
			const ranges = findDialogueRanges(segments.map((segment) => segment.text).join(""), { includeUnclosed: streaming });
			if (ranges.length === 0) return void 0;
			decorateSegments(segments, ranges, document);
			overlay.setAttribute(OVERLAY_ATTRIBUTE, "");
			overlay.setAttribute("aria-hidden", "true");
			overlay.setAttribute("role", "presentation");
			overlay.querySelectorAll("a, button, input, select, textarea, [tabindex]").forEach((node) => {
				node.removeAttribute("href");
				node.setAttribute("tabindex", "-1");
			});
			document.body.append(overlay);
			return overlay;
		}
		function decorateSegments(segments, ranges, document) {
			for (const segment of segments) {
				if (segment.node === null) continue;
				const slices = highlightSlices(segment.start, segment.end, ranges);
				if (!slices.some((slice) => slice.highlighted)) continue;
				const fragment = document.createDocumentFragment();
				for (const slice of slices) {
					const value = segment.text.slice(slice.start - segment.start, slice.end - segment.start);
					if (!slice.highlighted) {
						fragment.append(document.createTextNode(value));
						continue;
					}
					const span = document.createElement("span");
					span.setAttribute(SPAN_ATTRIBUTE, "");
					span.textContent = value;
					fragment.append(span);
				}
				segment.node.replaceWith(fragment);
			}
		}
		/** Return a complete, non-overlapping partition for one text-node interval. */
		function highlightSlices(start, end, ranges) {
			const intersections = ranges.map((range) => ({
				start: Math.max(start, range.start),
				end: Math.min(end, range.end)
			})).filter((range) => range.start < range.end).sort((left, right) => left.start - right.start || left.end - right.end);
			const merged = [];
			for (const range of intersections) {
				const tail = merged.at(-1);
				if (tail !== void 0 && range.start <= tail.end) tail.end = Math.max(tail.end, range.end);
				else merged.push({ ...range });
			}
			const slices = [];
			let cursor = start;
			for (const range of merged) {
				if (cursor < range.start) slices.push({
					start: cursor,
					end: range.start,
					highlighted: false
				});
				slices.push({
					start: range.start,
					end: range.end,
					highlighted: true
				});
				cursor = range.end;
			}
			if (cursor < end) slices.push({
				start: cursor,
				end,
				highlighted: false
			});
			return slices;
		}
		function nativeCapability(root) {
			const view = root.ownerDocument.defaultView;
			const registry = view?.CSS?.highlights;
			const Highlight = view?.Highlight;
			return registry !== void 0 && typeof Highlight === "function" ? {
				registry,
				Highlight
			} : void 0;
		}
		function publishNative(entry, capability, ranges) {
			nativeEntries.set(entry, {
				...capability,
				ranges
			});
			syncNativeRegistry(capability.registry);
		}
		function removeNativeEntry(entry) {
			const current = nativeEntries.get(entry);
			if (current === void 0) return;
			nativeEntries.delete(entry);
			syncNativeRegistry(current.registry);
		}
		function discardNativeEntry(entry, registry) {
			nativeEntries.delete(entry);
			try {
				syncNativeRegistry(registry);
			} catch {
				try {
					registry.delete(HIGHLIGHT_NAME);
				} catch {}
			}
		}
		function syncNativeRegistry(registry) {
			const entries = [...nativeEntries.values()].filter((item) => item.registry === registry);
			const ranges = entries.flatMap((item) => item.ranges);
			if (ranges.length === 0) {
				registry.delete(HIGHLIGHT_NAME);
				return;
			}
			registry.set(HIGHLIGHT_NAME, new entries[0].Highlight(...ranges));
		}
		function rangesForElement(root, streaming = false) {
			if (typeof root.ownerDocument?.createRange !== "function") return [];
			const segments = textSegments(root);
			return findDialogueRanges(segments.map((segment) => segment.text).join(""), { includeUnclosed: streaming }).flatMap((range) => {
				const start = textPosition(segments, range.start);
				const end = textPosition(segments, range.end - 1);
				if (start === null || end === null) return [];
				const domRange = root.ownerDocument.createRange();
				domRange.setStart(start.node, start.offset);
				domRange.setEnd(end.node, end.offset + 1);
				return [domRange];
			});
		}
		function textSegments(root) {
			const segments = [];
			let cursor = 0;
			const append = (text, node = null) => {
				if (text.length === 0) return;
				segments.push({
					text,
					node,
					start: cursor,
					end: cursor + text.length
				});
				cursor += text.length;
			};
			const visit = (node) => {
				if (node.nodeType === 3) {
					append(node.data ?? "", node);
					return;
				}
				if (node.nodeType !== 1) return;
				const element = node;
				if (element !== root && element.matches(EXCLUDED)) {
					append("\0");
					return;
				}
				if (element.tagName === "BR") {
					append("\n");
					return;
				}
				for (const child of element.childNodes) visit(child);
				if (element !== root && BLOCK_TAGS.has(element.tagName)) append("\n");
			};
			visit(root);
			return segments;
		}
		function textPosition(segments, offset) {
			for (const segment of segments) if (segment.node !== null && offset >= segment.start && offset < segment.end) return {
				node: segment.node,
				offset: offset - segment.start
			};
			return null;
		}
		//#endregion
		//#region src/client-styles.generated.js
		const css = { "anchor": "rp-dialogue-highlight-anchor" };
		const STYLE_ID = "dsh-roleplay-rp-dialogue-highlight-styles";
		const STYLE_OWNER = "dsh-roleplay-rp-dialogue-highlight";
		const STYLE_TEXT = ".rp-dialogue-highlight-anchor {\n  display: none;\n}\n\n[data-chat-flow-kind=\"rp-dialogue-highlight\"] {\n  display: none;\n}\n\n::highlight(rp-dialogue) {\n  color: #a94d00;\n}\n\nbody[data-ds-dark-theme] ::highlight(rp-dialogue) {\n  color: #ffbd7a;\n}\n\n/* When CSS Custom Highlight is unavailable, the behavior-only plugin renders a\n   non-interactive clone under the top-level body and makes only matched glyphs\n   visible. It never wraps or replaces React's native assistant DOM. */\n[data-rp-dialogue-overlay] {\n  position: fixed !important;\n  z-index: 1;\n  box-sizing: border-box;\n  overflow: hidden;\n  pointer-events: none !important;\n  user-select: none !important;\n  contain: layout style paint;\n}\n\n[data-rp-dialogue-overlay],\n[data-rp-dialogue-overlay] * {\n  color: transparent !important;\n  border-color: transparent !important;\n  background: transparent !important;\n  box-shadow: none !important;\n  text-decoration-color: transparent !important;\n}\n\n[data-rp-dialogue-overlay] :where(img, picture, svg, canvas, video, button, input, select, textarea) {\n  visibility: hidden !important;\n}\n\n[data-rp-dialogue-overlay] [data-rp-dialogue-span] {\n  color: #a94d00 !important;\n  -webkit-text-stroke: 0.2px currentcolor;\n  text-decoration-color: currentcolor !important;\n}\n\nbody[data-ds-dark-theme] [data-rp-dialogue-overlay] [data-rp-dialogue-span] {\n  color: #ffbd7a !important;\n}\n";
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
		const inject = ["slots", "conversationEvents"];
		const h = react.default.createElement;
		const NODE_KIND = "rp-dialogue-highlight";
		const NODE_OFFSET = .01;
		const dialogueHighlightNodeDefinition = {
			kind: NODE_KIND,
			target: "chat",
			match: (event) => {
				const turn = event?.data?.turn;
				const step = event?.data?.step;
				if (!Number.isSafeInteger(turn) || !Number.isSafeInteger(step)) return null;
				const id = `${turn}:${step}`;
				if (event.type === "step/start") return {
					id,
					role: "start"
				};
				if (event.type === "assistant/chunk" || event.type === "assistant/message" || event.type === "step/end" || event.type === "llm/retry") return {
					id,
					role: "update"
				};
				return null;
			},
			start: (_context, match) => initialHighlightState(match.event),
			update: (context, match) => updateHighlightState(context.state, match.event),
			publication: (match) => match.event.type === "assistant/chunk" ? "animation-frame" : "immediate",
			buildViewNode: (context) => {
				const state = highlightState(context);
				if (!Number.isFinite(state?.anchorSeq)) return null;
				return {
					key: context.key,
					kind: NODE_KIND,
					id: context.id,
					target: "chat",
					anchorSeq: state.anchorSeq + NODE_OFFSET,
					location: context.start?.location ?? context.matches?.[0]?.location ?? { kind: "unresolved" },
					visibility: "visible",
					data: { streaming: state.streaming }
				};
			}
		};
		function apply(ctx) {
			ctx.effect(ensureStyles);
			ctx.conversationEvents.register(dialogueHighlightNodeDefinition);
			ctx.slots.inject("conversation.chat.node", () => ctx.slots.register({
				name: "conversation.chat.node",
				key: NODE_KIND
			}, DialogueHighlightAnchor));
		}
		function initialHighlightState(event) {
			return {
				turn: event.data.turn,
				step: event.data.step,
				anchorSeq: void 0,
				streaming: true
			};
		}
		function updateHighlightState(state, event) {
			const current = state ?? initialHighlightState(event);
			if (event.type === "llm/retry") return {
				...current,
				anchorSeq: void 0,
				streaming: true
			};
			if (event.type === "assistant/chunk") {
				if (current.anchorSeq !== void 0 || !visibleTextChunk(event.data.chunk)) return current;
				return {
					...current,
					anchorSeq: event.seq
				};
			}
			if (event.type === "assistant/message") return {
				...current,
				anchorSeq: event.surfaceOp === "append" || current.anchorSeq === void 0 ? event.seq : current.anchorSeq,
				streaming: false
			};
			if (event.type === "step/end" && current.streaming) return {
				...current,
				anchorSeq: event.seq,
				streaming: false
			};
			return current;
		}
		function highlightState(context) {
			if (context.state !== void 0) return context.state;
			let state;
			for (const match of context.matches ?? []) state = match.event.type === "step/start" ? initialHighlightState(match.event) : updateHighlightState(state, match.event);
			return state;
		}
		function visibleTextChunk(chunk) {
			if (chunk?.type === "text-delta") return chunk.text.trim().length > 0;
			return chunk?.type === "block-end" && chunk.block?.type === "text" && chunk.block.text.trim().length > 0;
		}
		function DialogueHighlightAnchor({ node, sessionId, useSessions }) {
			const anchorRef = (0, react.useRef)(null);
			const entryRef = (0, react.useRef)(Symbol(String(node.id)));
			const roleplay = useSessions((state) => state.byId?.[sessionId]?.agentPreset === "roleplay");
			(0, react.useLayoutEffect)(() => {
				if (!roleplay) return void 0;
				const assistant = findAssistantRow(anchorRef.current);
				if (assistant === null) return void 0;
				return mountDialogueHighlight(assistant, entryRef.current, { streaming: node.data.streaming === true });
			}, [node.data.streaming, roleplay]);
			return h("span", {
				ref: anchorRef,
				className: css.anchor,
				hidden: true,
				"aria-hidden": true,
				"data-rp-dialogue-highlight-anchor": String(node.id)
			});
		}
		/** Resolve the assistant row immediately owned by this projection node. */
		function findAssistantRow(anchor) {
			const host = anchor?.closest?.(`[data-chat-flow-kind="${NODE_KIND}"]`);
			if (typeof HTMLElement !== "undefined" && !(host instanceof HTMLElement)) return null;
			if (host === null || host === void 0) return null;
			for (let row = host.previousElementSibling; row !== null; row = row.previousElementSibling) {
				const kind = row.dataset?.chatFlowKind;
				if (kind === "assistant-step") return row;
				if (kind === "turn-tail" || kind === "user" || kind === "steering") return null;
			}
			return null;
		}
		//#endregion
		exports.apply = apply;
		exports.dialogueHighlightNodeDefinition = dialogueHighlightNodeDefinition;
		exports.findAssistantRow = findAssistantRow;
		exports.inject = inject;
		exports.updateHighlightState = updateHighlightState;
		return module.exports;
	}
});
