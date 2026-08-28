window.__ModuleLoader__.load({
	id: "dsh-roleplay-rp-lore-book",
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
		let react_jsx_runtime = require("react/jsx-runtime");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/context/LayoutGroupContext.mjs
		const LayoutGroupContext = (0, react.createContext)({});
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/utils/use-constant.mjs
		/**
		* Creates a constant value over the lifecycle of a component.
		*
		* Even if `useMemo` is provided an empty array as its final argument, it doesn't offer
		* a guarantee that it won't re-run for performance reasons later on. By using `useConstant`
		* you can ensure that initialisers don't execute twice or more.
		*/
		function useConstant(init) {
			const ref = (0, react.useRef)(null);
			if (ref.current === null) ref.current = init();
			return ref.current;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/utils/use-isomorphic-effect.mjs
		const useIsomorphicLayoutEffect = typeof window !== "undefined" ? react.useLayoutEffect : react.useEffect;
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/context/PresenceContext.mjs
		/**
		* @public
		*/
		const PresenceContext = /* @__PURE__ */ (0, react.createContext)(null);
		//#endregion
		//#region ../../node_modules/.pnpm/motion-utils@12.39.0/node_modules/motion-utils/dist/es/array.mjs
		function addUniqueItem(arr, item) {
			if (arr.indexOf(item) === -1) arr.push(item);
		}
		function removeItem(arr, item) {
			const index = arr.indexOf(item);
			if (index > -1) arr.splice(index, 1);
		}
		function moveItem([ ...arr], fromIndex, toIndex) {
			const startIndex = fromIndex < 0 ? arr.length + fromIndex : fromIndex;
			if (startIndex >= 0 && startIndex < arr.length) {
				const endIndex = toIndex < 0 ? arr.length + toIndex : toIndex;
				const [item] = arr.splice(fromIndex, 1);
				arr.splice(endIndex, 0, item);
			}
			return arr;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-utils@12.39.0/node_modules/motion-utils/dist/es/clamp.mjs
		const clamp = (min, max, v) => {
			if (v > max) return max;
			if (v < min) return min;
			return v;
		};
		//#endregion
		//#region ../../node_modules/.pnpm/motion-utils@12.39.0/node_modules/motion-utils/dist/es/global-config.mjs
		const MotionGlobalConfig = {};
		//#endregion
		//#region ../../node_modules/.pnpm/motion-utils@12.39.0/node_modules/motion-utils/dist/es/is-numerical-string.mjs
		/**
		* Check if value is a numerical string, ie a string that is purely a number eg "100" or "-100.1"
		*/
		const isNumericalString = (v) => /^-?(?:\d+(?:\.\d+)?|\.\d+)$/u.test(v);
		//#endregion
		//#region ../../node_modules/.pnpm/motion-utils@12.39.0/node_modules/motion-utils/dist/es/is-object.mjs
		const isObject = (value) => typeof value === "object" && value !== null;
		//#endregion
		//#region ../../node_modules/.pnpm/motion-utils@12.39.0/node_modules/motion-utils/dist/es/is-zero-value-string.mjs
		/**
		* Check if the value is a zero value string like "0px" or "0%"
		*/
		const isZeroValueString = (v) => /^0[^.\s]+$/u.test(v);
		//#endregion
		//#region ../../node_modules/.pnpm/motion-utils@12.39.0/node_modules/motion-utils/dist/es/memo.mjs
		/*#__NO_SIDE_EFFECTS__*/
		function memo(callback) {
			let result;
			return () => {
				if (result === void 0) result = callback();
				return result;
			};
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-utils@12.39.0/node_modules/motion-utils/dist/es/noop.mjs
		const noop = /* @__NO_SIDE_EFFECTS__ */ (any) => any;
		//#endregion
		//#region ../../node_modules/.pnpm/motion-utils@12.39.0/node_modules/motion-utils/dist/es/pipe.mjs
		/**
		* Pipe
		* Compose other transformers to run linearily
		* pipe(min(20), max(40))
		* @param  {...functions} transformers
		* @return {function}
		*/
		const pipe = (...transformers) => transformers.reduce((a, b) => (v) => b(a(v)));
		//#endregion
		//#region ../../node_modules/.pnpm/motion-utils@12.39.0/node_modules/motion-utils/dist/es/progress.mjs
		const progress = /* @__NO_SIDE_EFFECTS__ */ (from, to, value) => {
			const range = to - from;
			return range ? (value - from) / range : 1;
		};
		//#endregion
		//#region ../../node_modules/.pnpm/motion-utils@12.39.0/node_modules/motion-utils/dist/es/subscription-manager.mjs
		var SubscriptionManager = class {
			constructor() {
				this.subscriptions = [];
			}
			add(handler) {
				addUniqueItem(this.subscriptions, handler);
				return () => removeItem(this.subscriptions, handler);
			}
			notify(a, b, c) {
				const numSubscriptions = this.subscriptions.length;
				if (!numSubscriptions) return;
				if (numSubscriptions === 1)
 /**
				* If there's only a single handler we can just call it without invoking a loop.
				*/
				this.subscriptions[0](a, b, c);
				else for (let i = 0; i < numSubscriptions; i++) {
					/**
					* Check whether the handler exists before firing as it's possible
					* the subscriptions were modified during this loop running.
					*/
					const handler = this.subscriptions[i];
					handler && handler(a, b, c);
				}
			}
			getSize() {
				return this.subscriptions.length;
			}
			clear() {
				this.subscriptions.length = 0;
			}
		};
		//#endregion
		//#region ../../node_modules/.pnpm/motion-utils@12.39.0/node_modules/motion-utils/dist/es/time-conversion.mjs
		/**
		* Converts seconds to milliseconds
		*
		* @param seconds - Time in seconds.
		* @return milliseconds - Converted time in milliseconds.
		*/
		const secondsToMilliseconds = /* @__NO_SIDE_EFFECTS__ */ (seconds) => seconds * 1e3;
		const millisecondsToSeconds = /* @__NO_SIDE_EFFECTS__ */ (milliseconds) => milliseconds / 1e3;
		//#endregion
		//#region ../../node_modules/.pnpm/motion-utils@12.39.0/node_modules/motion-utils/dist/es/velocity-per-second.mjs
		const velocityPerSecond = /* @__NO_SIDE_EFFECTS__ */ (velocity, frameDuration) => frameDuration ? velocity * (1e3 / frameDuration) : 0;
		//#endregion
		//#region ../../node_modules/.pnpm/motion-utils@12.39.0/node_modules/motion-utils/dist/es/easing/cubic-bezier.mjs
		const calcBezier = (t, a1, a2) => (((1 - 3 * a2 + 3 * a1) * t + (3 * a2 - 6 * a1)) * t + 3 * a1) * t;
		const subdivisionPrecision = 1e-7;
		const subdivisionMaxIterations = 12;
		function binarySubdivide(x, lowerBound, upperBound, mX1, mX2) {
			let currentX;
			let currentT;
			let i = 0;
			do {
				currentT = lowerBound + (upperBound - lowerBound) / 2;
				currentX = calcBezier(currentT, mX1, mX2) - x;
				if (currentX > 0) upperBound = currentT;
				else lowerBound = currentT;
			} while (Math.abs(currentX) > subdivisionPrecision && ++i < subdivisionMaxIterations);
			return currentT;
		}
		/*#__NO_SIDE_EFFECTS__*/
		function cubicBezier(mX1, mY1, mX2, mY2) {
			if (mX1 === mY1 && mX2 === mY2) return noop;
			const getTForX = (aX) => binarySubdivide(aX, 0, 1, mX1, mX2);
			return (t) => t === 0 || t === 1 ? t : calcBezier(getTForX(t), mY1, mY2);
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-utils@12.39.0/node_modules/motion-utils/dist/es/easing/modifiers/mirror.mjs
		const mirrorEasing = /* @__NO_SIDE_EFFECTS__ */ (easing) => (p) => p <= .5 ? easing(2 * p) / 2 : (2 - easing(2 * (1 - p))) / 2;
		//#endregion
		//#region ../../node_modules/.pnpm/motion-utils@12.39.0/node_modules/motion-utils/dist/es/easing/modifiers/reverse.mjs
		const reverseEasing = /* @__NO_SIDE_EFFECTS__ */ (easing) => (p) => 1 - easing(1 - p);
		//#endregion
		//#region ../../node_modules/.pnpm/motion-utils@12.39.0/node_modules/motion-utils/dist/es/easing/back.mjs
		const backOut = /*@__PURE__*/ cubicBezier(.33, 1.53, .69, .99);
		const backIn = /*@__PURE__*/ reverseEasing(backOut);
		const backInOut = /*@__PURE__*/ mirrorEasing(backIn);
		//#endregion
		//#region ../../node_modules/.pnpm/motion-utils@12.39.0/node_modules/motion-utils/dist/es/easing/anticipate.mjs
		const anticipate = (p) => p >= 1 ? 1 : (p *= 2) < 1 ? .5 * backIn(p) : .5 * (2 - Math.pow(2, -10 * (p - 1)));
		//#endregion
		//#region ../../node_modules/.pnpm/motion-utils@12.39.0/node_modules/motion-utils/dist/es/easing/circ.mjs
		const circIn = (p) => 1 - Math.sin(Math.acos(p));
		const circOut = /* @__PURE__ */ reverseEasing(circIn);
		const circInOut = /* @__PURE__ */ mirrorEasing(circIn);
		//#endregion
		//#region ../../node_modules/.pnpm/motion-utils@12.39.0/node_modules/motion-utils/dist/es/easing/ease.mjs
		const easeIn = /*@__PURE__*/ cubicBezier(.42, 0, 1, 1);
		const easeOut = /*@__PURE__*/ cubicBezier(0, 0, .58, 1);
		const easeInOut = /*@__PURE__*/ cubicBezier(.42, 0, .58, 1);
		//#endregion
		//#region ../../node_modules/.pnpm/motion-utils@12.39.0/node_modules/motion-utils/dist/es/easing/utils/is-easing-array.mjs
		const isEasingArray = /* @__NO_SIDE_EFFECTS__ */ (ease) => {
			return Array.isArray(ease) && typeof ease[0] !== "number";
		};
		//#endregion
		//#region ../../node_modules/.pnpm/motion-utils@12.39.0/node_modules/motion-utils/dist/es/easing/utils/is-bezier-definition.mjs
		const isBezierDefinition = /* @__NO_SIDE_EFFECTS__ */ (easing) => Array.isArray(easing) && typeof easing[0] === "number";
		//#endregion
		//#region ../../node_modules/.pnpm/motion-utils@12.39.0/node_modules/motion-utils/dist/es/easing/utils/map.mjs
		const easingLookup = {
			linear: noop,
			easeIn,
			easeInOut,
			easeOut,
			circIn,
			circInOut,
			circOut,
			backIn,
			backInOut,
			backOut,
			anticipate
		};
		const isValidEasing = (easing) => {
			return typeof easing === "string";
		};
		const easingDefinitionToFunction = (definition) => {
			if (/* @__PURE__ */ isBezierDefinition(definition)) {
				definition.length;
				const [x1, y1, x2, y2] = definition;
				return /* @__PURE__ */ cubicBezier(x1, y1, x2, y2);
			} else if (isValidEasing(definition)) {
				easingLookup[definition], `${definition}`;
				return easingLookup[definition];
			}
			return definition;
		};
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/frameloop/order.mjs
		const stepsOrder = [
			"setup",
			"read",
			"resolveKeyframes",
			"preUpdate",
			"update",
			"preRender",
			"render",
			"postRender"
		];
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/frameloop/render-step.mjs
		function createRenderStep(runNextFrame) {
			/**
			* We create and reuse two queues, one to queue jobs for the current frame
			* and one for the next. We reuse to avoid triggering GC after x frames.
			*/
			let thisFrame = /* @__PURE__ */ new Set();
			let nextFrame = /* @__PURE__ */ new Set();
			/**
			* Track whether we're currently processing jobs in this step. This way
			* we can decide whether to schedule new jobs for this frame or next.
			*/
			let isProcessing = false;
			let flushNextFrame = false;
			/**
			* A set of processes which were marked keepAlive when scheduled.
			*/
			const toKeepAlive = /* @__PURE__ */ new WeakSet();
			let latestFrameData = {
				delta: 0,
				timestamp: 0,
				isProcessing: false
			};
			function triggerCallback(callback) {
				if (toKeepAlive.has(callback)) {
					step.schedule(callback);
					runNextFrame();
				}
				callback(latestFrameData);
			}
			const step = {
				/**
				* Schedule a process to run on the next frame.
				*/
				schedule: (callback, keepAlive = false, immediate = false) => {
					const queue = immediate && isProcessing ? thisFrame : nextFrame;
					if (keepAlive) toKeepAlive.add(callback);
					queue.add(callback);
					return callback;
				},
				/**
				* Cancel the provided callback from running on the next frame.
				*/
				cancel: (callback) => {
					nextFrame.delete(callback);
					toKeepAlive.delete(callback);
				},
				/**
				* Execute all schedule callbacks.
				*/
				process: (frameData) => {
					latestFrameData = frameData;
					/**
					* If we're already processing we've probably been triggered by a flushSync
					* inside an existing process. Instead of executing, mark flushNextFrame
					* as true and ensure we flush the following frame at the end of this one.
					*/
					if (isProcessing) {
						flushNextFrame = true;
						return;
					}
					isProcessing = true;
					const prevFrame = thisFrame;
					thisFrame = nextFrame;
					nextFrame = prevFrame;
					thisFrame.forEach(triggerCallback);
					thisFrame.clear();
					isProcessing = false;
					if (flushNextFrame) {
						flushNextFrame = false;
						step.process(frameData);
					}
				}
			};
			return step;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/frameloop/batcher.mjs
		const maxElapsed = 40;
		function createRenderBatcher(scheduleNextBatch, allowKeepAlive) {
			let runNextFrame = false;
			let useDefaultElapsed = true;
			const state = {
				delta: 0,
				timestamp: 0,
				isProcessing: false
			};
			const flagRunNextFrame = () => runNextFrame = true;
			const steps = stepsOrder.reduce((acc, key) => {
				acc[key] = createRenderStep(flagRunNextFrame);
				return acc;
			}, {});
			const { setup, read, resolveKeyframes, preUpdate, update, preRender, render, postRender } = steps;
			const processBatch = () => {
				const useManualTiming = MotionGlobalConfig.useManualTiming;
				const timestamp = useManualTiming ? state.timestamp : performance.now();
				runNextFrame = false;
				if (!useManualTiming) state.delta = useDefaultElapsed ? 1e3 / 60 : Math.max(Math.min(timestamp - state.timestamp, maxElapsed), 1);
				state.timestamp = timestamp;
				state.isProcessing = true;
				setup.process(state);
				read.process(state);
				resolveKeyframes.process(state);
				preUpdate.process(state);
				update.process(state);
				preRender.process(state);
				render.process(state);
				postRender.process(state);
				state.isProcessing = false;
				if (runNextFrame && allowKeepAlive) {
					useDefaultElapsed = false;
					scheduleNextBatch(processBatch);
				}
			};
			const wake = () => {
				runNextFrame = true;
				useDefaultElapsed = true;
				if (!state.isProcessing) scheduleNextBatch(processBatch);
			};
			const schedule = stepsOrder.reduce((acc, key) => {
				const step = steps[key];
				acc[key] = (process, keepAlive = false, immediate = false) => {
					if (!runNextFrame) wake();
					return step.schedule(process, keepAlive, immediate);
				};
				return acc;
			}, {});
			const cancel = (process) => {
				for (let i = 0; i < stepsOrder.length; i++) steps[stepsOrder[i]].cancel(process);
			};
			return {
				schedule,
				cancel,
				state,
				steps
			};
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/frameloop/frame.mjs
		const { schedule: frame, cancel: cancelFrame, state: frameData, steps: frameSteps } = /* @__PURE__ */ createRenderBatcher(typeof requestAnimationFrame !== "undefined" ? requestAnimationFrame : noop, true);
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/frameloop/sync-time.mjs
		let now;
		function clearTime() {
			now = void 0;
		}
		/**
		* An eventloop-synchronous alternative to performance.now().
		*
		* Ensures that time measurements remain consistent within a synchronous context.
		* Usually calling performance.now() twice within the same synchronous context
		* will return different values which isn't useful for animations when we're usually
		* trying to sync animations to the same frame.
		*/
		const time = {
			now: () => {
				if (now === void 0) time.set(frameData.isProcessing || MotionGlobalConfig.useManualTiming ? frameData.timestamp : performance.now());
				return now;
			},
			set: (newTime) => {
				now = newTime;
				queueMicrotask(clearTime);
			}
		};
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/animation/utils/is-css-variable.mjs
		const checkStringStartsWith = (token) => (key) => typeof key === "string" && key.startsWith(token);
		const isCSSVariableName = /*@__PURE__*/ checkStringStartsWith("--");
		const startsAsVariableToken = /*@__PURE__*/ checkStringStartsWith("var(--");
		const isCSSVariableToken = (value) => {
			if (!startsAsVariableToken(value)) return false;
			return singleCssVariableRegex.test(value.split("/*")[0].trim());
		};
		const singleCssVariableRegex = /var\(--(?:[\w-]+\s*|[\w-]+\s*,(?:\s*[^)(\s]|\s*\((?:[^)(]|\([^)(]*\))*\))+\s*)\)$/iu;
		/**
		* Check if a value contains a CSS variable anywhere (e.g. inside calc()).
		* Unlike isCSSVariableToken which checks if the value IS a var() token,
		* this checks if the value CONTAINS var() somewhere in the string.
		*/
		function containsCSSVariable(value) {
			if (typeof value !== "string") return false;
			return value.split("/*")[0].includes("var(--");
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/value/types/numbers/index.mjs
		const number = {
			test: (v) => typeof v === "number",
			parse: parseFloat,
			transform: (v) => v
		};
		const alpha = {
			...number,
			transform: (v) => clamp(0, 1, v)
		};
		const scale = {
			...number,
			default: 1
		};
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/value/types/utils/sanitize.mjs
		const sanitize = (v) => Math.round(v * 1e5) / 1e5;
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/value/types/utils/float-regex.mjs
		const floatRegex = /-?(?:\d+(?:\.\d+)?|\.\d+)/gu;
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/value/types/utils/is-nullish.mjs
		function isNullish(v) {
			return v == null;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/value/types/utils/single-color-regex.mjs
		const singleColorRegex = /^(?:#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\))$/iu;
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/value/types/color/utils.mjs
		/**
		* Returns true if the provided string is a color, ie rgba(0,0,0,0) or #000,
		* but false if a number or multiple colors
		*/
		const isColorString = (type, testProp) => (v) => {
			return Boolean(typeof v === "string" && singleColorRegex.test(v) && v.startsWith(type) || testProp && !isNullish(v) && Object.prototype.hasOwnProperty.call(v, testProp));
		};
		const splitColor = (aName, bName, cName) => (v) => {
			if (typeof v !== "string") return v;
			const [a, b, c, alpha] = v.match(floatRegex);
			return {
				[aName]: parseFloat(a),
				[bName]: parseFloat(b),
				[cName]: parseFloat(c),
				alpha: alpha !== void 0 ? parseFloat(alpha) : 1
			};
		};
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/value/types/color/rgba.mjs
		const clampRgbUnit = (v) => clamp(0, 255, v);
		const rgbUnit = {
			...number,
			transform: (v) => Math.round(clampRgbUnit(v))
		};
		const rgba = {
			test: /*@__PURE__*/ isColorString("rgb", "red"),
			parse: /*@__PURE__*/ splitColor("red", "green", "blue"),
			transform: ({ red, green, blue, alpha: alpha$1 = 1 }) => "rgba(" + rgbUnit.transform(red) + ", " + rgbUnit.transform(green) + ", " + rgbUnit.transform(blue) + ", " + sanitize(alpha.transform(alpha$1)) + ")"
		};
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/value/types/color/hex.mjs
		function parseHex(v) {
			let r = "";
			let g = "";
			let b = "";
			let a = "";
			if (v.length > 5) {
				r = v.substring(1, 3);
				g = v.substring(3, 5);
				b = v.substring(5, 7);
				a = v.substring(7, 9);
			} else {
				r = v.substring(1, 2);
				g = v.substring(2, 3);
				b = v.substring(3, 4);
				a = v.substring(4, 5);
				r += r;
				g += g;
				b += b;
				a += a;
			}
			return {
				red: parseInt(r, 16),
				green: parseInt(g, 16),
				blue: parseInt(b, 16),
				alpha: a ? parseInt(a, 16) / 255 : 1
			};
		}
		const hex = {
			test: /*@__PURE__*/ isColorString("#"),
			parse: parseHex,
			transform: rgba.transform
		};
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/value/types/numbers/units.mjs
		const createUnitType = /* @__NO_SIDE_EFFECTS__ */ (unit) => ({
			test: (v) => typeof v === "string" && v.endsWith(unit) && v.split(" ").length === 1,
			parse: parseFloat,
			transform: (v) => `${v}${unit}`
		});
		const degrees = /*@__PURE__*/ createUnitType("deg");
		const percent = /*@__PURE__*/ createUnitType("%");
		const px = /*@__PURE__*/ createUnitType("px");
		const vh = /*@__PURE__*/ createUnitType("vh");
		const vw = /*@__PURE__*/ createUnitType("vw");
		const progressPercentage = /*@__PURE__*/ (() => ({
			...percent,
			parse: (v) => percent.parse(v) / 100,
			transform: (v) => percent.transform(v * 100)
		}))();
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/value/types/color/hsla.mjs
		const hsla = {
			test: /*@__PURE__*/ isColorString("hsl", "hue"),
			parse: /*@__PURE__*/ splitColor("hue", "saturation", "lightness"),
			transform: ({ hue, saturation, lightness, alpha: alpha$1 = 1 }) => {
				return "hsla(" + Math.round(hue) + ", " + percent.transform(sanitize(saturation)) + ", " + percent.transform(sanitize(lightness)) + ", " + sanitize(alpha.transform(alpha$1)) + ")";
			}
		};
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/value/types/color/index.mjs
		const color = {
			test: (v) => rgba.test(v) || hex.test(v) || hsla.test(v),
			parse: (v) => {
				if (rgba.test(v)) return rgba.parse(v);
				else if (hsla.test(v)) return hsla.parse(v);
				else return hex.parse(v);
			},
			transform: (v) => {
				return typeof v === "string" ? v : v.hasOwnProperty("red") ? rgba.transform(v) : hsla.transform(v);
			},
			getAnimatableNone: (v) => {
				const parsed = color.parse(v);
				parsed.alpha = 0;
				return color.transform(parsed);
			}
		};
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/value/types/utils/color-regex.mjs
		const colorRegex = /(?:#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\))/giu;
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/value/types/complex/index.mjs
		function test(v) {
			return isNaN(v) && typeof v === "string" && (v.match(floatRegex)?.length || 0) + (v.match(colorRegex)?.length || 0) > 0;
		}
		const NUMBER_TOKEN = "number";
		const COLOR_TOKEN = "color";
		const VAR_TOKEN = "var";
		const VAR_FUNCTION_TOKEN = "var(";
		const SPLIT_TOKEN = "${}";
		const complexRegex = /var\s*\(\s*--(?:[\w-]+\s*|[\w-]+\s*,(?:\s*[^)(\s]|\s*\((?:[^)(]|\([^)(]*\))*\))+\s*)\)|#[\da-f]{3,8}|(?:rgb|hsl)a?\((?:-?[\d.]+%?[,\s]+){2}-?[\d.]+%?\s*(?:[,/]\s*)?(?:\b\d+(?:\.\d+)?|\.\d+)?%?\)|-?(?:\d+(?:\.\d+)?|\.\d+)/giu;
		function analyseComplexValue(value) {
			const originalValue = value.toString();
			const values = [];
			const indexes = {
				color: [],
				number: [],
				var: []
			};
			const types = [];
			let i = 0;
			return {
				values,
				split: originalValue.replace(complexRegex, (parsedValue) => {
					if (color.test(parsedValue)) {
						indexes.color.push(i);
						types.push(COLOR_TOKEN);
						values.push(color.parse(parsedValue));
					} else if (parsedValue.startsWith(VAR_FUNCTION_TOKEN)) {
						indexes.var.push(i);
						types.push(VAR_TOKEN);
						values.push(parsedValue);
					} else {
						indexes.number.push(i);
						types.push(NUMBER_TOKEN);
						values.push(parseFloat(parsedValue));
					}
					++i;
					return SPLIT_TOKEN;
				}).split(SPLIT_TOKEN),
				indexes,
				types
			};
		}
		function parseComplexValue(v) {
			return analyseComplexValue(v).values;
		}
		function buildTransformer({ split, types }) {
			const numSections = split.length;
			return (v) => {
				let output = "";
				for (let i = 0; i < numSections; i++) {
					output += split[i];
					if (v[i] !== void 0) {
						const type = types[i];
						if (type === NUMBER_TOKEN) output += sanitize(v[i]);
						else if (type === COLOR_TOKEN) output += color.transform(v[i]);
						else output += v[i];
					}
				}
				return output;
			};
		}
		function createTransformer(source) {
			return buildTransformer(analyseComplexValue(source));
		}
		const convertNumbersToZero = (v) => typeof v === "number" ? 0 : color.test(v) ? color.getAnimatableNone(v) : v;
		/**
		* Convert a parsed value to its zero equivalent, but preserve numbers
		* that act as divisors in CSS calc() expressions.
		*
		* analyseComplexValue extracts numbers from CSS strings and puts the
		* surrounding text into a `split` template array. For example:
		*   "calc(var(--gap) / 5)"  →  values: [var(--gap), 5]
		*                               split:  ["calc(", " / ", ")"]
		*
		* When building a zero-equivalent for animation, naively zeroing all
		* numbers turns the divisor into 0 → "calc(var(--gap) / 0)" → NaN.
		* We detect this by checking whether the text preceding a number
		* (split[i]) ends with "/" — the CSS calc division operator.
		*/
		const convertToZero = (value, splitBefore) => {
			if (typeof value === "number") return splitBefore?.trim().endsWith("/") ? value : 0;
			return convertNumbersToZero(value);
		};
		function getAnimatableNone$1(v) {
			const info = analyseComplexValue(v);
			return buildTransformer(info)(info.values.map((value, i) => convertToZero(value, info.split[i])));
		}
		const complex = {
			test,
			parse: parseComplexValue,
			createTransformer,
			getAnimatableNone: getAnimatableNone$1
		};
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/value/types/color/hsla-to-rgba.mjs
		function hueToRgb(p, q, t) {
			if (t < 0) t += 1;
			if (t > 1) t -= 1;
			if (t < 1 / 6) return p + (q - p) * 6 * t;
			if (t < 1 / 2) return q;
			if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
			return p;
		}
		function hslaToRgba({ hue, saturation, lightness, alpha }) {
			hue /= 360;
			saturation /= 100;
			lightness /= 100;
			let red = 0;
			let green = 0;
			let blue = 0;
			if (!saturation) red = green = blue = lightness;
			else {
				const q = lightness < .5 ? lightness * (1 + saturation) : lightness + saturation - lightness * saturation;
				const p = 2 * lightness - q;
				red = hueToRgb(p, q, hue + 1 / 3);
				green = hueToRgb(p, q, hue);
				blue = hueToRgb(p, q, hue - 1 / 3);
			}
			return {
				red: Math.round(red * 255),
				green: Math.round(green * 255),
				blue: Math.round(blue * 255),
				alpha
			};
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/utils/mix/immediate.mjs
		function mixImmediate(a, b) {
			return (p) => p > 0 ? b : a;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/utils/mix/number.mjs
		const mixNumber$1 = (from, to, progress) => {
			return from + (to - from) * progress;
		};
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/utils/mix/color.mjs
		const mixLinearColor = (from, to, v) => {
			const fromExpo = from * from;
			const expo = v * (to * to - fromExpo) + fromExpo;
			return expo < 0 ? 0 : Math.sqrt(expo);
		};
		const colorTypes = [
			hex,
			rgba,
			hsla
		];
		const getColorType = (v) => colorTypes.find((type) => type.test(v));
		function asRGBA(color) {
			const type = getColorType(color);
			`${color}`;
			if (!Boolean(type)) return false;
			let model = type.parse(color);
			if (type === hsla) model = hslaToRgba(model);
			return model;
		}
		const mixColor = (from, to) => {
			const fromRGBA = asRGBA(from);
			const toRGBA = asRGBA(to);
			if (!fromRGBA || !toRGBA) return mixImmediate(from, to);
			const blended = { ...fromRGBA };
			return (v) => {
				blended.red = mixLinearColor(fromRGBA.red, toRGBA.red, v);
				blended.green = mixLinearColor(fromRGBA.green, toRGBA.green, v);
				blended.blue = mixLinearColor(fromRGBA.blue, toRGBA.blue, v);
				blended.alpha = mixNumber$1(fromRGBA.alpha, toRGBA.alpha, v);
				return rgba.transform(blended);
			};
		};
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/utils/mix/visibility.mjs
		const invisibleValues = /* @__PURE__ */ new Set(["none", "hidden"]);
		/**
		* Returns a function that, when provided a progress value between 0 and 1,
		* will return the "none" or "hidden" string only when the progress is that of
		* the origin or target.
		*/
		function mixVisibility(origin, target) {
			if (invisibleValues.has(origin)) return (p) => p <= 0 ? origin : target;
			else return (p) => p >= 1 ? target : origin;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/utils/mix/complex.mjs
		function mixNumber(a, b) {
			return (p) => mixNumber$1(a, b, p);
		}
		function getMixer(a) {
			if (typeof a === "number") return mixNumber;
			else if (typeof a === "string") return isCSSVariableToken(a) ? mixImmediate : color.test(a) ? mixColor : mixComplex;
			else if (Array.isArray(a)) return mixArray;
			else if (typeof a === "object") return color.test(a) ? mixColor : mixObject;
			return mixImmediate;
		}
		function mixArray(a, b) {
			const output = [...a];
			const numValues = output.length;
			const blendValue = a.map((v, i) => getMixer(v)(v, b[i]));
			return (p) => {
				for (let i = 0; i < numValues; i++) output[i] = blendValue[i](p);
				return output;
			};
		}
		function mixObject(a, b) {
			const output = {
				...a,
				...b
			};
			const blendValue = {};
			for (const key in output) if (a[key] !== void 0 && b[key] !== void 0) blendValue[key] = getMixer(a[key])(a[key], b[key]);
			return (v) => {
				for (const key in blendValue) output[key] = blendValue[key](v);
				return output;
			};
		}
		function matchOrder(origin, target) {
			const orderedOrigin = [];
			const pointers = {
				color: 0,
				var: 0,
				number: 0
			};
			for (let i = 0; i < target.values.length; i++) {
				const type = target.types[i];
				const originIndex = origin.indexes[type][pointers[type]];
				orderedOrigin[i] = origin.values[originIndex] ?? 0;
				pointers[type]++;
			}
			return orderedOrigin;
		}
		const mixComplex = (origin, target) => {
			const template = complex.createTransformer(target);
			const originStats = analyseComplexValue(origin);
			const targetStats = analyseComplexValue(target);
			if (originStats.indexes.var.length === targetStats.indexes.var.length && originStats.indexes.color.length === targetStats.indexes.color.length && originStats.indexes.number.length >= targetStats.indexes.number.length) {
				if (invisibleValues.has(origin) && !targetStats.values.length || invisibleValues.has(target) && !originStats.values.length) return mixVisibility(origin, target);
				return pipe(mixArray(matchOrder(originStats, targetStats), targetStats.values), template);
			} else {
				`${origin}${target}`;
				return mixImmediate(origin, target);
			}
		};
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/utils/mix/index.mjs
		function mix(from, to, p) {
			if (typeof from === "number" && typeof to === "number" && typeof p === "number") return mixNumber$1(from, to, p);
			return getMixer(from)(from, to);
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/animation/drivers/frame.mjs
		const frameloopDriver = (update) => {
			const passTimestamp = ({ timestamp }) => update(timestamp);
			return {
				start: (keepAlive = true) => frame.update(passTimestamp, keepAlive),
				stop: () => cancelFrame(passTimestamp),
				/**
				* If we're processing this frame we can use the
				* framelocked timestamp to keep things in sync.
				*/
				now: () => frameData.isProcessing ? frameData.timestamp : time.now()
			};
		};
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/animation/waapi/utils/linear.mjs
		const generateLinearEasing = (easing, duration, resolution = 10) => {
			let points = "";
			const numPoints = Math.max(Math.round(duration / resolution), 2);
			for (let i = 0; i < numPoints; i++) points += Math.round(easing(i / (numPoints - 1)) * 1e4) / 1e4 + ", ";
			return `linear(${points.substring(0, points.length - 2)})`;
		};
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/animation/generators/utils/calc-duration.mjs
		/**
		* Implement a practical max duration for keyframe generation
		* to prevent infinite loops
		*/
		const maxGeneratorDuration = 2e4;
		function calcGeneratorDuration(generator) {
			let duration = 0;
			const timeStep = 50;
			let state = generator.next(duration);
			while (!state.done && duration < 2e4) {
				duration += timeStep;
				state = generator.next(duration);
			}
			return duration >= 2e4 ? Infinity : duration;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/animation/generators/utils/create-generator-easing.mjs
		/**
		* Create a progress => progress easing function from a generator.
		*/
		function createGeneratorEasing(options, scale = 100, createGenerator) {
			const generator = createGenerator({
				...options,
				keyframes: [0, scale]
			});
			const duration = Math.min(calcGeneratorDuration(generator), maxGeneratorDuration);
			return {
				type: "keyframes",
				ease: (progress) => {
					return generator.next(duration * progress).value / scale;
				},
				duration: /* @__PURE__ */ millisecondsToSeconds(duration)
			};
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/animation/generators/spring.mjs
		const springDefaults = {
			stiffness: 100,
			damping: 10,
			mass: 1,
			velocity: 0,
			duration: 800,
			bounce: .3,
			visualDuration: .3,
			restSpeed: {
				granular: .01,
				default: 2
			},
			restDelta: {
				granular: .005,
				default: .5
			},
			minDuration: .01,
			maxDuration: 10,
			minDamping: .05,
			maxDamping: 1
		};
		function calcAngularFreq(undampedFreq, dampingRatio) {
			return undampedFreq * Math.sqrt(1 - dampingRatio * dampingRatio);
		}
		const rootIterations = 12;
		function approximateRoot(envelope, derivative, initialGuess) {
			let result = initialGuess;
			for (let i = 1; i < rootIterations; i++) result = result - envelope(result) / derivative(result);
			return result;
		}
		/**
		* This is ported from the Framer implementation of duration-based spring resolution.
		*/
		const safeMin = .001;
		function findSpring({ duration = springDefaults.duration, bounce = springDefaults.bounce, velocity = springDefaults.velocity, mass = springDefaults.mass }) {
			let envelope;
			let derivative;
			springDefaults.maxDuration;
			let dampingRatio = 1 - bounce;
			/**
			* Restrict dampingRatio and duration to within acceptable ranges.
			*/
			dampingRatio = clamp(springDefaults.minDamping, springDefaults.maxDamping, dampingRatio);
			duration = clamp(springDefaults.minDuration, springDefaults.maxDuration, /* @__PURE__ */ millisecondsToSeconds(duration));
			if (dampingRatio < 1) {
				/**
				* Underdamped spring
				*/
				envelope = (undampedFreq) => {
					const exponentialDecay = undampedFreq * dampingRatio;
					const delta = exponentialDecay * duration;
					const a = exponentialDecay - velocity;
					const b = calcAngularFreq(undampedFreq, dampingRatio);
					const c = Math.exp(-delta);
					return safeMin - a / b * c;
				};
				derivative = (undampedFreq) => {
					const delta = undampedFreq * dampingRatio * duration;
					const d = delta * velocity + velocity;
					const e = Math.pow(dampingRatio, 2) * Math.pow(undampedFreq, 2) * duration;
					const f = Math.exp(-delta);
					const g = calcAngularFreq(Math.pow(undampedFreq, 2), dampingRatio);
					return (-envelope(undampedFreq) + safeMin > 0 ? -1 : 1) * ((d - e) * f) / g;
				};
			} else {
				/**
				* Critically-damped spring
				*/
				envelope = (undampedFreq) => {
					return -.001 + Math.exp(-undampedFreq * duration) * ((undampedFreq - velocity) * duration + 1);
				};
				derivative = (undampedFreq) => {
					return Math.exp(-undampedFreq * duration) * ((velocity - undampedFreq) * (duration * duration));
				};
			}
			const initialGuess = 5 / duration;
			const undampedFreq = approximateRoot(envelope, derivative, initialGuess);
			duration = /* @__PURE__ */ secondsToMilliseconds(duration);
			if (isNaN(undampedFreq)) return {
				stiffness: springDefaults.stiffness,
				damping: springDefaults.damping,
				duration
			};
			else {
				const stiffness = Math.pow(undampedFreq, 2) * mass;
				return {
					stiffness,
					damping: dampingRatio * 2 * Math.sqrt(mass * stiffness),
					duration
				};
			}
		}
		const durationKeys = ["duration", "bounce"];
		const physicsKeys = [
			"stiffness",
			"damping",
			"mass"
		];
		function isSpringType(options, keys) {
			return keys.some((key) => options[key] !== void 0);
		}
		function getSpringOptions(options) {
			let springOptions = {
				velocity: springDefaults.velocity,
				stiffness: springDefaults.stiffness,
				damping: springDefaults.damping,
				mass: springDefaults.mass,
				isResolvedFromDuration: false,
				...options
			};
			if (!isSpringType(options, physicsKeys) && isSpringType(options, durationKeys)) {
				springOptions.velocity = 0;
				if (options.visualDuration) {
					const visualDuration = options.visualDuration;
					const root = 2 * Math.PI / (visualDuration * 1.2);
					const stiffness = root * root;
					const damping = 2 * clamp(.05, 1, 1 - (options.bounce || 0)) * Math.sqrt(stiffness);
					springOptions = {
						...springOptions,
						mass: springDefaults.mass,
						stiffness,
						damping
					};
				} else {
					const derived = findSpring({
						...options,
						velocity: 0
					});
					springOptions = {
						...springOptions,
						...derived,
						mass: springDefaults.mass
					};
					springOptions.isResolvedFromDuration = true;
				}
			}
			return springOptions;
		}
		function spring(optionsOrVisualDuration = springDefaults.visualDuration, bounce = springDefaults.bounce) {
			const options = typeof optionsOrVisualDuration !== "object" ? {
				visualDuration: optionsOrVisualDuration,
				keyframes: [0, 1],
				bounce
			} : optionsOrVisualDuration;
			let { restSpeed, restDelta } = options;
			const origin = options.keyframes[0];
			const target = options.keyframes[options.keyframes.length - 1];
			/**
			* This is the Iterator-spec return value. We ensure it's mutable rather than using a generator
			* to reduce GC during animation.
			*/
			const state = {
				done: false,
				value: origin
			};
			const { stiffness, damping, mass, duration, velocity, isResolvedFromDuration } = getSpringOptions({
				...options,
				velocity: -/* @__PURE__ */ millisecondsToSeconds(options.velocity || 0)
			});
			const initialVelocity = velocity || 0;
			const dampingRatio = damping / (2 * Math.sqrt(stiffness * mass));
			const initialDelta = target - origin;
			const undampedAngularFreq = /* @__PURE__ */ millisecondsToSeconds(Math.sqrt(stiffness / mass));
			/**
			* If we're working on a granular scale, use smaller defaults for determining
			* when the spring is finished.
			*
			* These defaults have been selected emprically based on what strikes a good
			* ratio between feeling good and finishing as soon as changes are imperceptible.
			*/
			const isGranularScale = Math.abs(initialDelta) < 5;
			restSpeed || (restSpeed = isGranularScale ? springDefaults.restSpeed.granular : springDefaults.restSpeed.default);
			restDelta || (restDelta = isGranularScale ? springDefaults.restDelta.granular : springDefaults.restDelta.default);
			let resolveSpring;
			let resolveVelocity;
			let angularFreq;
			let A;
			let sinCoeff;
			let cosCoeff;
			if (dampingRatio < 1) {
				angularFreq = calcAngularFreq(undampedAngularFreq, dampingRatio);
				A = (initialVelocity + dampingRatio * undampedAngularFreq * initialDelta) / angularFreq;
				resolveSpring = (t) => {
					const envelope = Math.exp(-dampingRatio * undampedAngularFreq * t);
					return target - envelope * (A * Math.sin(angularFreq * t) + initialDelta * Math.cos(angularFreq * t));
				};
				sinCoeff = dampingRatio * undampedAngularFreq * A + initialDelta * angularFreq;
				cosCoeff = dampingRatio * undampedAngularFreq * initialDelta - A * angularFreq;
				resolveVelocity = (t) => {
					return Math.exp(-dampingRatio * undampedAngularFreq * t) * (sinCoeff * Math.sin(angularFreq * t) + cosCoeff * Math.cos(angularFreq * t));
				};
			} else if (dampingRatio === 1) {
				resolveSpring = (t) => target - Math.exp(-undampedAngularFreq * t) * (initialDelta + (initialVelocity + undampedAngularFreq * initialDelta) * t);
				const C = initialVelocity + undampedAngularFreq * initialDelta;
				resolveVelocity = (t) => Math.exp(-undampedAngularFreq * t) * (undampedAngularFreq * C * t - initialVelocity);
			} else {
				const dampedAngularFreq = undampedAngularFreq * Math.sqrt(dampingRatio * dampingRatio - 1);
				resolveSpring = (t) => {
					const envelope = Math.exp(-dampingRatio * undampedAngularFreq * t);
					const freqForT = Math.min(dampedAngularFreq * t, 300);
					return target - envelope * ((initialVelocity + dampingRatio * undampedAngularFreq * initialDelta) * Math.sinh(freqForT) + dampedAngularFreq * initialDelta * Math.cosh(freqForT)) / dampedAngularFreq;
				};
				const P = (initialVelocity + dampingRatio * undampedAngularFreq * initialDelta) / dampedAngularFreq;
				const sinhCoeff = dampingRatio * undampedAngularFreq * P - initialDelta * dampedAngularFreq;
				const coshCoeff = dampingRatio * undampedAngularFreq * initialDelta - P * dampedAngularFreq;
				resolveVelocity = (t) => {
					const envelope = Math.exp(-dampingRatio * undampedAngularFreq * t);
					const freqForT = Math.min(dampedAngularFreq * t, 300);
					return envelope * (sinhCoeff * Math.sinh(freqForT) + coshCoeff * Math.cosh(freqForT));
				};
			}
			const generator = {
				calculatedDuration: isResolvedFromDuration ? duration || null : null,
				velocity: (t) => /* @__PURE__ */ secondsToMilliseconds(resolveVelocity(t)),
				next: (t) => {
					/**
					* For underdamped physics springs we need both position and
					* velocity each tick. Compute shared trig values once to avoid
					* duplicate Math.exp/sin/cos calls on the hot path.
					*/
					if (!isResolvedFromDuration && dampingRatio < 1) {
						const envelope = Math.exp(-dampingRatio * undampedAngularFreq * t);
						const sin = Math.sin(angularFreq * t);
						const cos = Math.cos(angularFreq * t);
						const current = target - envelope * (A * sin + initialDelta * cos);
						const currentVelocity = /* @__PURE__ */ secondsToMilliseconds(envelope * (sinCoeff * sin + cosCoeff * cos));
						state.done = Math.abs(currentVelocity) <= restSpeed && Math.abs(target - current) <= restDelta;
						state.value = state.done ? target : current;
						return state;
					}
					const current = resolveSpring(t);
					if (!isResolvedFromDuration) {
						const currentVelocity = /* @__PURE__ */ secondsToMilliseconds(resolveVelocity(t));
						state.done = Math.abs(currentVelocity) <= restSpeed && Math.abs(target - current) <= restDelta;
					} else state.done = t >= duration;
					state.value = state.done ? target : current;
					return state;
				},
				toString: () => {
					const calculatedDuration = Math.min(calcGeneratorDuration(generator), maxGeneratorDuration);
					const easing = generateLinearEasing((progress) => generator.next(calculatedDuration * progress).value, calculatedDuration, 30);
					return calculatedDuration + "ms " + easing;
				},
				toTransition: () => {}
			};
			return generator;
		}
		spring.applyToOptions = (options) => {
			const generatorOptions = createGeneratorEasing(options, 100, spring);
			options.ease = generatorOptions.ease;
			options.duration = /* @__PURE__ */ secondsToMilliseconds(generatorOptions.duration);
			options.type = "keyframes";
			return options;
		};
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/animation/generators/utils/velocity.mjs
		const velocitySampleDuration = 5;
		function getGeneratorVelocity(resolveValue, t, current) {
			const prevT = Math.max(t - velocitySampleDuration, 0);
			return /* @__PURE__ */ velocityPerSecond(current - resolveValue(prevT), t - prevT);
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/animation/generators/inertia.mjs
		function inertia({ keyframes, velocity = 0, power = .8, timeConstant = 325, bounceDamping = 10, bounceStiffness = 500, modifyTarget, min, max, restDelta = .5, restSpeed }) {
			const origin = keyframes[0];
			const state = {
				done: false,
				value: origin
			};
			const isOutOfBounds = (v) => min !== void 0 && v < min || max !== void 0 && v > max;
			const nearestBoundary = (v) => {
				if (min === void 0) return max;
				if (max === void 0) return min;
				return Math.abs(min - v) < Math.abs(max - v) ? min : max;
			};
			let amplitude = power * velocity;
			const ideal = origin + amplitude;
			const target = modifyTarget === void 0 ? ideal : modifyTarget(ideal);
			/**
			* If the target has changed we need to re-calculate the amplitude, otherwise
			* the animation will start from the wrong position.
			*/
			if (target !== ideal) amplitude = target - origin;
			const calcDelta = (t) => -amplitude * Math.exp(-t / timeConstant);
			const calcLatest = (t) => target + calcDelta(t);
			const applyFriction = (t) => {
				const delta = calcDelta(t);
				const latest = calcLatest(t);
				state.done = Math.abs(delta) <= restDelta;
				state.value = state.done ? target : latest;
			};
			/**
			* Ideally this would resolve for t in a stateless way, we could
			* do that by always precalculating the animation but as we know
			* this will be done anyway we can assume that spring will
			* be discovered during that.
			*/
			let timeReachedBoundary;
			let spring$1;
			const checkCatchBoundary = (t) => {
				if (!isOutOfBounds(state.value)) return;
				timeReachedBoundary = t;
				spring$1 = spring({
					keyframes: [state.value, nearestBoundary(state.value)],
					velocity: getGeneratorVelocity(calcLatest, t, state.value),
					damping: bounceDamping,
					stiffness: bounceStiffness,
					restDelta,
					restSpeed
				});
			};
			checkCatchBoundary(0);
			return {
				calculatedDuration: null,
				next: (t) => {
					/**
					* We need to resolve the friction to figure out if we need a
					* spring but we don't want to do this twice per frame. So here
					* we flag if we updated for this frame and later if we did
					* we can skip doing it again.
					*/
					let hasUpdatedFrame = false;
					if (!spring$1 && timeReachedBoundary === void 0) {
						hasUpdatedFrame = true;
						applyFriction(t);
						checkCatchBoundary(t);
					}
					/**
					* If we have a spring and the provided t is beyond the moment the friction
					* animation crossed the min/max boundary, use the spring.
					*/
					if (timeReachedBoundary !== void 0 && t >= timeReachedBoundary) return spring$1.next(t - timeReachedBoundary);
					else {
						!hasUpdatedFrame && applyFriction(t);
						return state;
					}
				}
			};
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/utils/interpolate.mjs
		function createMixers(output, ease, customMixer) {
			const mixers = [];
			const mixerFactory = customMixer || MotionGlobalConfig.mix || mix;
			const numMixers = output.length - 1;
			for (let i = 0; i < numMixers; i++) {
				let mixer = mixerFactory(output[i], output[i + 1]);
				if (ease) mixer = pipe(Array.isArray(ease) ? ease[i] || noop : ease, mixer);
				mixers.push(mixer);
			}
			return mixers;
		}
		/**
		* Create a function that maps from a numerical input array to a generic output array.
		*
		* Accepts:
		*   - Numbers
		*   - Colors (hex, hsl, hsla, rgb, rgba)
		*   - Complex (combinations of one or more numbers or strings)
		*
		* ```jsx
		* const mixColor = interpolate([0, 1], ['#fff', '#000'])
		*
		* mixColor(0.5) // 'rgba(128, 128, 128, 1)'
		* ```
		*
		* TODO Revisit this approach once we've moved to data models for values,
		* probably not needed to pregenerate mixer functions.
		*
		* @public
		*/
		function interpolate(input, output, { clamp: isClamp = true, ease, mixer } = {}) {
			const inputLength = input.length;
			output.length;
			/**
			* If we're only provided a single input, we can just make a function
			* that returns the output.
			*/
			if (inputLength === 1) return () => output[0];
			if (inputLength === 2 && output[0] === output[1]) return () => output[1];
			const isZeroDeltaRange = input[0] === input[1];
			if (input[0] > input[inputLength - 1]) {
				input = [...input].reverse();
				output = [...output].reverse();
			}
			const mixers = createMixers(output, ease, mixer);
			const numMixers = mixers.length;
			const interpolator = (v) => {
				if (isZeroDeltaRange && v < input[0]) return output[0];
				let i = 0;
				if (numMixers > 1) {
					for (; i < input.length - 2; i++) if (v < input[i + 1]) break;
				}
				const progressInRange = /* @__PURE__ */ progress(input[i], input[i + 1], v);
				return mixers[i](progressInRange);
			};
			return isClamp ? (v) => interpolator(clamp(input[0], input[inputLength - 1], v)) : interpolator;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/animation/keyframes/offsets/fill.mjs
		function fillOffset(offset, remaining) {
			const min = offset[offset.length - 1];
			for (let i = 1; i <= remaining; i++) {
				const offsetProgress = /* @__PURE__ */ progress(0, remaining, i);
				offset.push(mixNumber$1(min, 1, offsetProgress));
			}
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/animation/keyframes/offsets/default.mjs
		function defaultOffset(arr) {
			const offset = [0];
			fillOffset(offset, arr.length - 1);
			return offset;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/animation/keyframes/offsets/time.mjs
		function convertOffsetToTimes(offset, duration) {
			return offset.map((o) => o * duration);
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/animation/generators/keyframes.mjs
		function defaultEasing(values, easing) {
			return values.map(() => easing || easeInOut).splice(0, values.length - 1);
		}
		function keyframes({ duration = 300, keyframes: keyframeValues, times, ease = "easeInOut" }) {
			/**
			* Easing functions can be externally defined as strings. Here we convert them
			* into actual functions.
			*/
			const easingFunctions = /* @__PURE__ */ isEasingArray(ease) ? ease.map(easingDefinitionToFunction) : easingDefinitionToFunction(ease);
			/**
			* This is the Iterator-spec return value. We ensure it's mutable rather than using a generator
			* to reduce GC during animation.
			*/
			const state = {
				done: false,
				value: keyframeValues[0]
			};
			const mapTimeToKeyframe = interpolate(convertOffsetToTimes(times && times.length === keyframeValues.length ? times : defaultOffset(keyframeValues), duration), keyframeValues, { ease: Array.isArray(easingFunctions) ? easingFunctions : defaultEasing(keyframeValues, easingFunctions) });
			return {
				calculatedDuration: duration,
				next: (t) => {
					state.value = mapTimeToKeyframe(t);
					state.done = t >= duration;
					return state;
				}
			};
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/animation/keyframes/get-final.mjs
		const isNotNull = (value) => value !== null;
		function getFinalKeyframe(keyframes, { repeat, repeatType = "loop" }, finalKeyframe, speed = 1) {
			const resolvedKeyframes = keyframes.filter(isNotNull);
			const index = speed < 0 || repeat && repeatType !== "loop" && repeat % 2 === 1 ? 0 : resolvedKeyframes.length - 1;
			return !index || finalKeyframe === void 0 ? resolvedKeyframes[index] : finalKeyframe;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/animation/utils/replace-transition-type.mjs
		const transitionTypeMap = {
			decay: inertia,
			inertia,
			tween: keyframes,
			keyframes,
			spring
		};
		function replaceTransitionType(transition) {
			if (typeof transition.type === "string") transition.type = transitionTypeMap[transition.type];
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/animation/utils/WithPromise.mjs
		var WithPromise = class {
			constructor() {
				this.updateFinished();
			}
			get finished() {
				return this._finished;
			}
			updateFinished() {
				this._finished = new Promise((resolve) => {
					this.resolve = resolve;
				});
			}
			notifyFinished() {
				this.resolve();
			}
			/**
			* Allows the animation to be awaited.
			*
			* @deprecated Use `finished` instead.
			*/
			then(onResolve, onReject) {
				return this.finished.then(onResolve, onReject);
			}
		};
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/animation/JSAnimation.mjs
		const percentToProgress = (percent) => percent / 100;
		var JSAnimation = class extends WithPromise {
			constructor(options) {
				super();
				this.state = "idle";
				this.startTime = null;
				this.isStopped = false;
				/**
				* The current time of the animation.
				*/
				this.currentTime = 0;
				/**
				* The time at which the animation was paused.
				*/
				this.holdTime = null;
				/**
				* Playback speed as a factor. 0 would be stopped, -1 reverse and 2 double speed.
				*/
				this.playbackSpeed = 1;
				/**
				* Reusable state object for the delay phase to avoid
				* allocating a new object every frame.
				*/
				this.delayState = {
					done: false,
					value: void 0
				};
				/**
				* This method is bound to the instance to fix a pattern where
				* animation.stop is returned as a reference from a useEffect.
				*/
				this.stop = () => {
					const { motionValue } = this.options;
					if (motionValue && motionValue.updatedAt !== time.now()) this.tick(time.now());
					this.isStopped = true;
					if (this.state === "idle") return;
					this.teardown();
					this.options.onStop?.();
				};
				this.options = options;
				this.initAnimation();
				this.play();
				if (options.autoplay === false) this.pause();
			}
			initAnimation() {
				const { options } = this;
				replaceTransitionType(options);
				const { type = keyframes, repeat = 0, repeatDelay = 0, repeatType, velocity = 0 } = options;
				let { keyframes: keyframes$1 } = options;
				const generatorFactory = type || keyframes;
				if (generatorFactory !== keyframes && typeof keyframes$1[0] !== "number") {
					this.mixKeyframes = pipe(percentToProgress, mix(keyframes$1[0], keyframes$1[1]));
					keyframes$1 = [0, 100];
				}
				const generator = generatorFactory({
					...options,
					keyframes: keyframes$1
				});
				/**
				* If we have a mirror repeat type we need to create a second generator that outputs the
				* mirrored (not reversed) animation and later ping pong between the two generators.
				*/
				if (repeatType === "mirror") this.mirroredGenerator = generatorFactory({
					...options,
					keyframes: [...keyframes$1].reverse(),
					velocity: -velocity
				});
				/**
				* If duration is undefined and we have repeat options,
				* we need to calculate a duration from the generator.
				*
				* We set it to the generator itself to cache the duration.
				* Any timeline resolver will need to have already precalculated
				* the duration by this step.
				*/
				if (generator.calculatedDuration === null) generator.calculatedDuration = calcGeneratorDuration(generator);
				const { calculatedDuration } = generator;
				this.calculatedDuration = calculatedDuration;
				this.resolvedDuration = calculatedDuration + repeatDelay;
				this.totalDuration = this.resolvedDuration * (repeat + 1) - repeatDelay;
				this.generator = generator;
			}
			updateTime(timestamp) {
				const animationTime = Math.round(timestamp - this.startTime) * this.playbackSpeed;
				if (this.holdTime !== null) this.currentTime = this.holdTime;
				else this.currentTime = animationTime;
			}
			tick(timestamp, sample = false) {
				const { generator, totalDuration, mixKeyframes, mirroredGenerator, resolvedDuration, calculatedDuration } = this;
				if (this.startTime === null) return generator.next(0);
				const { delay = 0, keyframes, repeat, repeatType, repeatDelay, type, onUpdate, finalKeyframe } = this.options;
				/**
				* requestAnimationFrame timestamps can come through as lower than
				* the startTime as set by performance.now(). Here we prevent this,
				* though in the future it could be possible to make setting startTime
				* a pending operation that gets resolved here.
				*/
				if (this.speed > 0) this.startTime = Math.min(this.startTime, timestamp);
				else if (this.speed < 0) this.startTime = Math.min(timestamp - totalDuration / this.speed, this.startTime);
				if (sample) this.currentTime = timestamp;
				else this.updateTime(timestamp);
				const timeWithoutDelay = this.currentTime - delay * (this.playbackSpeed >= 0 ? 1 : -1);
				const isInDelayPhase = this.playbackSpeed >= 0 ? timeWithoutDelay < 0 : timeWithoutDelay > totalDuration;
				this.currentTime = Math.max(timeWithoutDelay, 0);
				if (this.state === "finished" && this.holdTime === null) this.currentTime = totalDuration;
				let elapsed = this.currentTime;
				let frameGenerator = generator;
				if (repeat) {
					/**
					* Get the current progress (0-1) of the animation. If t is >
					* than duration we'll get values like 2.5 (midway through the
					* third iteration)
					*/
					const progress = Math.min(this.currentTime, totalDuration) / resolvedDuration;
					/**
					* Get the current iteration (0 indexed). For instance the floor of
					* 2.5 is 2.
					*/
					let currentIteration = Math.floor(progress);
					/**
					* Get the current progress of the iteration by taking the remainder
					* so 2.5 is 0.5 through iteration 2
					*/
					let iterationProgress = progress % 1;
					/**
					* If iteration progress is 1 we count that as the end
					* of the previous iteration.
					*/
					if (!iterationProgress && progress >= 1) iterationProgress = 1;
					iterationProgress === 1 && currentIteration--;
					currentIteration = Math.min(currentIteration, repeat + 1);
					if (Boolean(currentIteration % 2)) {
						if (repeatType === "reverse") {
							iterationProgress = 1 - iterationProgress;
							if (repeatDelay) iterationProgress -= repeatDelay / resolvedDuration;
						} else if (repeatType === "mirror") frameGenerator = mirroredGenerator;
					}
					elapsed = clamp(0, 1, iterationProgress) * resolvedDuration;
				}
				/**
				* If we're in negative time, set state as the initial keyframe.
				* This prevents delay: x, duration: 0 animations from finishing
				* instantly.
				*/
				let state;
				if (isInDelayPhase) {
					this.delayState.value = keyframes[0];
					state = this.delayState;
				} else state = frameGenerator.next(elapsed);
				if (mixKeyframes && !isInDelayPhase) state.value = mixKeyframes(state.value);
				let { done } = state;
				if (!isInDelayPhase && calculatedDuration !== null) done = this.playbackSpeed >= 0 ? this.currentTime >= totalDuration : this.currentTime <= 0;
				const isAnimationFinished = this.holdTime === null && (this.state === "finished" || this.state === "running" && done);
				if (isAnimationFinished && type !== inertia) state.value = getFinalKeyframe(keyframes, this.options, finalKeyframe, this.speed);
				if (onUpdate) onUpdate(state.value);
				if (isAnimationFinished) this.finish();
				return state;
			}
			/**
			* Allows the returned animation to be awaited or promise-chained. Currently
			* resolves when the animation finishes at all but in a future update could/should
			* reject if its cancels.
			*/
			then(resolve, reject) {
				return this.finished.then(resolve, reject);
			}
			get duration() {
				return /* @__PURE__ */ millisecondsToSeconds(this.calculatedDuration);
			}
			get iterationDuration() {
				const { delay = 0 } = this.options || {};
				return this.duration + /* @__PURE__ */ millisecondsToSeconds(delay);
			}
			get time() {
				return /* @__PURE__ */ millisecondsToSeconds(this.currentTime);
			}
			set time(newTime) {
				newTime = /* @__PURE__ */ secondsToMilliseconds(newTime);
				this.currentTime = newTime;
				if (this.startTime === null || this.holdTime !== null || this.playbackSpeed === 0) this.holdTime = newTime;
				else if (this.driver) this.startTime = this.driver.now() - newTime / this.playbackSpeed;
				if (this.driver) this.driver.start(false);
				else {
					this.startTime = 0;
					this.state = "paused";
					this.holdTime = newTime;
					this.tick(newTime);
				}
			}
			/**
			* Returns the generator's velocity at the current time in units/second.
			* Uses the analytical derivative when available (springs), avoiding
			* the MotionValue's frame-dependent velocity estimation.
			*/
			getGeneratorVelocity() {
				const t = this.currentTime;
				if (t <= 0) return this.options.velocity || 0;
				if (this.generator.velocity) return this.generator.velocity(t);
				const current = this.generator.next(t).value;
				return getGeneratorVelocity((s) => this.generator.next(s).value, t, current);
			}
			get speed() {
				return this.playbackSpeed;
			}
			set speed(newSpeed) {
				const hasChanged = this.playbackSpeed !== newSpeed;
				if (hasChanged && this.driver) this.updateTime(time.now());
				this.playbackSpeed = newSpeed;
				if (hasChanged && this.driver) this.time = /* @__PURE__ */ millisecondsToSeconds(this.currentTime);
			}
			play() {
				if (this.isStopped) return;
				const { driver = frameloopDriver, startTime } = this.options;
				if (!this.driver) this.driver = driver((timestamp) => this.tick(timestamp));
				this.options.onPlay?.();
				const now = this.driver.now();
				if (this.state === "finished") {
					this.updateFinished();
					this.startTime = now;
				} else if (this.holdTime !== null) this.startTime = now - this.holdTime;
				else if (!this.startTime) this.startTime = startTime ?? now;
				if (this.state === "finished" && this.speed < 0) this.startTime += this.calculatedDuration;
				this.holdTime = null;
				/**
				* Set playState to running only after we've used it in
				* the previous logic.
				*/
				this.state = "running";
				this.driver.start();
			}
			pause() {
				this.state = "paused";
				this.updateTime(time.now());
				this.holdTime = this.currentTime;
			}
			complete() {
				if (this.state !== "running") this.play();
				this.state = "finished";
				this.holdTime = null;
			}
			finish() {
				this.notifyFinished();
				this.teardown();
				this.state = "finished";
				this.options.onComplete?.();
			}
			cancel() {
				this.holdTime = null;
				this.startTime = 0;
				this.tick(0);
				this.teardown();
				this.options.onCancel?.();
			}
			teardown() {
				this.state = "idle";
				this.stopDriver();
				this.startTime = this.holdTime = null;
			}
			stopDriver() {
				if (!this.driver) return;
				this.driver.stop();
				this.driver = void 0;
			}
			sample(sampleTime) {
				this.startTime = 0;
				return this.tick(sampleTime, true);
			}
			attachTimeline(timeline) {
				if (this.options.allowFlatten) {
					this.options.type = "keyframes";
					this.options.ease = "linear";
					this.initAnimation();
				}
				this.driver?.stop();
				return timeline.observe(this);
			}
		};
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/animation/keyframes/utils/fill-wildcards.mjs
		function fillWildcards(keyframes) {
			for (let i = 1; i < keyframes.length; i++) keyframes[i] ?? (keyframes[i] = keyframes[i - 1]);
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/render/dom/parse-transform.mjs
		const radToDeg = (rad) => rad * 180 / Math.PI;
		const rotate = (v) => {
			const angle = radToDeg(Math.atan2(v[1], v[0]));
			return rebaseAngle(angle);
		};
		const matrix2dParsers = {
			x: 4,
			y: 5,
			translateX: 4,
			translateY: 5,
			scaleX: 0,
			scaleY: 3,
			scale: (v) => (Math.abs(v[0]) + Math.abs(v[3])) / 2,
			rotate,
			rotateZ: rotate,
			skewX: (v) => radToDeg(Math.atan(v[1])),
			skewY: (v) => radToDeg(Math.atan(v[2])),
			skew: (v) => (Math.abs(v[1]) + Math.abs(v[2])) / 2
		};
		const rebaseAngle = (angle) => {
			angle = angle % 360;
			if (angle < 0) angle += 360;
			return angle;
		};
		const rotateZ = rotate;
		const scaleX = (v) => Math.sqrt(v[0] * v[0] + v[1] * v[1]);
		const scaleY = (v) => Math.sqrt(v[4] * v[4] + v[5] * v[5]);
		const matrix3dParsers = {
			x: 12,
			y: 13,
			z: 14,
			translateX: 12,
			translateY: 13,
			translateZ: 14,
			scaleX,
			scaleY,
			scale: (v) => (scaleX(v) + scaleY(v)) / 2,
			rotateX: (v) => rebaseAngle(radToDeg(Math.atan2(v[6], v[5]))),
			rotateY: (v) => rebaseAngle(radToDeg(Math.atan2(-v[2], v[0]))),
			rotateZ,
			rotate: rotateZ,
			skewX: (v) => radToDeg(Math.atan(v[4])),
			skewY: (v) => radToDeg(Math.atan(v[1])),
			skew: (v) => (Math.abs(v[1]) + Math.abs(v[4])) / 2
		};
		function defaultTransformValue(name) {
			return name.includes("scale") ? 1 : 0;
		}
		function parseValueFromTransform(transform, name) {
			if (!transform || transform === "none") return defaultTransformValue(name);
			const matrix3dMatch = transform.match(/^matrix3d\(([-\d.e\s,]+)\)$/u);
			let parsers;
			let match;
			if (matrix3dMatch) {
				parsers = matrix3dParsers;
				match = matrix3dMatch;
			} else {
				const matrix2dMatch = transform.match(/^matrix\(([-\d.e\s,]+)\)$/u);
				parsers = matrix2dParsers;
				match = matrix2dMatch;
			}
			if (!match) return defaultTransformValue(name);
			const valueParser = parsers[name];
			const values = match[1].split(",").map(convertTransformToNumber);
			return typeof valueParser === "function" ? valueParser(values) : values[valueParser];
		}
		const readTransformValue = (instance, name) => {
			const { transform = "none" } = getComputedStyle(instance);
			return parseValueFromTransform(transform, name);
		};
		function convertTransformToNumber(value) {
			return parseFloat(value.trim());
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/render/utils/keys-transform.mjs
		/**
		* Generate a list of every possible transform key.
		*/
		const transformPropOrder = [
			"transformPerspective",
			"x",
			"y",
			"z",
			"translateX",
			"translateY",
			"translateZ",
			"scale",
			"scaleX",
			"scaleY",
			"rotate",
			"rotateX",
			"rotateY",
			"rotateZ",
			"skew",
			"skewX",
			"skewY"
		];
		/**
		* A quick lookup for transform props.
		*
		* `pathRotation` is a transform for routing purposes (skipped from raw
		* style application, wired to the transform composite, flags transform
		* dirty) but is intentionally NOT in `transformPropOrder` — it is
		* composed onto `rotate` at the build sites, not serialized in its own
		* slot, and must stay out of the order-array consumers (parse-transform,
		* unit-conversion, keys-position).
		*/
		const transformProps = /*@__PURE__*/ (() => /* @__PURE__ */ new Set([...transformPropOrder, "pathRotation"]))();
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/animation/keyframes/utils/unit-conversion.mjs
		const isNumOrPxType = (v) => v === number || v === px;
		const transformKeys = /* @__PURE__ */ new Set([
			"x",
			"y",
			"z"
		]);
		const nonTranslationalTransformKeys = transformPropOrder.filter((key) => !transformKeys.has(key));
		function removeNonTranslationalTransform(visualElement) {
			const removedTransforms = [];
			nonTranslationalTransformKeys.forEach((key) => {
				const value = visualElement.getValue(key);
				if (value !== void 0) {
					removedTransforms.push([key, value.get()]);
					value.set(key.startsWith("scale") ? 1 : 0);
				}
			});
			return removedTransforms;
		}
		const positionalValues = {
			width: ({ x }, { paddingLeft = "0", paddingRight = "0", boxSizing }) => {
				const width = x.max - x.min;
				return boxSizing === "border-box" ? width : width - parseFloat(paddingLeft) - parseFloat(paddingRight);
			},
			height: ({ y }, { paddingTop = "0", paddingBottom = "0", boxSizing }) => {
				const height = y.max - y.min;
				return boxSizing === "border-box" ? height : height - parseFloat(paddingTop) - parseFloat(paddingBottom);
			},
			top: (_bbox, { top }) => parseFloat(top),
			left: (_bbox, { left }) => parseFloat(left),
			bottom: ({ y }, { top }) => parseFloat(top) + (y.max - y.min),
			right: ({ x }, { left }) => parseFloat(left) + (x.max - x.min),
			x: (_bbox, { transform }) => parseValueFromTransform(transform, "x"),
			y: (_bbox, { transform }) => parseValueFromTransform(transform, "y")
		};
		positionalValues.translateX = positionalValues.x;
		positionalValues.translateY = positionalValues.y;
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/animation/keyframes/KeyframesResolver.mjs
		const toResolve = /* @__PURE__ */ new Set();
		let isScheduled = false;
		let anyNeedsMeasurement = false;
		let isForced = false;
		function measureAllKeyframes() {
			if (anyNeedsMeasurement) {
				const resolversToMeasure = Array.from(toResolve).filter((resolver) => resolver.needsMeasurement);
				const elementsToMeasure = new Set(resolversToMeasure.map((resolver) => resolver.element));
				const transformsToRestore = /* @__PURE__ */ new Map();
				/**
				* Write pass
				* If we're measuring elements we want to remove bounding box-changing transforms.
				*/
				elementsToMeasure.forEach((element) => {
					const removedTransforms = removeNonTranslationalTransform(element);
					if (!removedTransforms.length) return;
					transformsToRestore.set(element, removedTransforms);
					element.render();
				});
				resolversToMeasure.forEach((resolver) => resolver.measureInitialState());
				elementsToMeasure.forEach((element) => {
					element.render();
					const restore = transformsToRestore.get(element);
					if (restore) restore.forEach(([key, value]) => {
						element.getValue(key)?.set(value);
					});
				});
				resolversToMeasure.forEach((resolver) => resolver.measureEndState());
				resolversToMeasure.forEach((resolver) => {
					if (resolver.suspendedScrollY !== void 0) window.scrollTo(0, resolver.suspendedScrollY);
				});
			}
			anyNeedsMeasurement = false;
			isScheduled = false;
			toResolve.forEach((resolver) => resolver.complete(isForced));
			toResolve.clear();
		}
		function readAllKeyframes() {
			toResolve.forEach((resolver) => {
				resolver.readKeyframes();
				if (resolver.needsMeasurement) anyNeedsMeasurement = true;
			});
		}
		function flushKeyframeResolvers() {
			isForced = true;
			readAllKeyframes();
			measureAllKeyframes();
			isForced = false;
		}
		var KeyframeResolver = class {
			constructor(unresolvedKeyframes, onComplete, name, motionValue, element, isAsync = false) {
				this.state = "pending";
				/**
				* Track whether this resolver is async. If it is, it'll be added to the
				* resolver queue and flushed in the next frame. Resolvers that aren't going
				* to trigger read/write thrashing don't need to be async.
				*/
				this.isAsync = false;
				/**
				* Track whether this resolver needs to perform a measurement
				* to resolve its keyframes.
				*/
				this.needsMeasurement = false;
				this.unresolvedKeyframes = [...unresolvedKeyframes];
				this.onComplete = onComplete;
				this.name = name;
				this.motionValue = motionValue;
				this.element = element;
				this.isAsync = isAsync;
			}
			scheduleResolve() {
				this.state = "scheduled";
				if (this.isAsync) {
					toResolve.add(this);
					if (!isScheduled) {
						isScheduled = true;
						frame.read(readAllKeyframes);
						frame.resolveKeyframes(measureAllKeyframes);
					}
				} else {
					this.readKeyframes();
					this.complete();
				}
			}
			readKeyframes() {
				const { unresolvedKeyframes, name, element, motionValue } = this;
				if (unresolvedKeyframes[0] === null) {
					const currentValue = motionValue?.get();
					const finalKeyframe = unresolvedKeyframes[unresolvedKeyframes.length - 1];
					if (currentValue !== void 0) unresolvedKeyframes[0] = currentValue;
					else if (element && name) {
						const valueAsRead = element.readValue(name, finalKeyframe);
						if (valueAsRead !== void 0 && valueAsRead !== null) unresolvedKeyframes[0] = valueAsRead;
					}
					if (unresolvedKeyframes[0] === void 0) unresolvedKeyframes[0] = finalKeyframe;
					if (motionValue && currentValue === void 0) motionValue.set(unresolvedKeyframes[0]);
				}
				fillWildcards(unresolvedKeyframes);
			}
			setFinalKeyframe() {}
			measureInitialState() {}
			renderEndStyles() {}
			measureEndState() {}
			complete(isForcedComplete = false) {
				this.state = "complete";
				this.onComplete(this.unresolvedKeyframes, this.finalKeyframe, isForcedComplete);
				toResolve.delete(this);
			}
			cancel() {
				if (this.state === "scheduled") {
					toResolve.delete(this);
					this.state = "pending";
				}
			}
			resume() {
				if (this.state === "pending") this.scheduleResolve();
			}
		};
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/render/dom/is-css-var.mjs
		const isCSSVar = (name) => name.startsWith("--");
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/render/dom/style-set.mjs
		function setStyle(element, name, value) {
			isCSSVar(name) ? element.style.setProperty(name, value) : element.style[name] = value;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/utils/supports/flags.mjs
		/**
		* Add the ability for test suites to manually set support flags
		* to better test more environments.
		*/
		const supportsFlags = {};
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/utils/supports/memo.mjs
		function memoSupports(callback, supportsFlag) {
			const memoized = /* @__PURE__ */ memo(callback);
			return () => supportsFlags[supportsFlag] ?? memoized();
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/utils/supports/scroll-timeline.mjs
		const supportsScrollTimeline = /* @__PURE__ */ memoSupports(() => window.ScrollTimeline !== void 0, "scrollTimeline");
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/utils/supports/linear-easing.mjs
		const supportsLinearEasing = /*@__PURE__*/ memoSupports(() => {
			try {
				document.createElement("div").animate({ opacity: 0 }, { easing: "linear(0, 1)" });
			} catch (e) {
				return false;
			}
			return true;
		}, "linearEasing");
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/animation/waapi/easing/cubic-bezier.mjs
		const cubicBezierAsString = ([a, b, c, d]) => `cubic-bezier(${a}, ${b}, ${c}, ${d})`;
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/animation/waapi/easing/supported.mjs
		const supportedWaapiEasing = {
			linear: "linear",
			ease: "ease",
			easeIn: "ease-in",
			easeOut: "ease-out",
			easeInOut: "ease-in-out",
			circIn: /*@__PURE__*/ cubicBezierAsString([
				0,
				.65,
				.55,
				1
			]),
			circOut: /*@__PURE__*/ cubicBezierAsString([
				.55,
				0,
				1,
				.45
			]),
			backIn: /*@__PURE__*/ cubicBezierAsString([
				.31,
				.01,
				.66,
				-.59
			]),
			backOut: /*@__PURE__*/ cubicBezierAsString([
				.33,
				1.53,
				.69,
				.99
			])
		};
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/animation/waapi/easing/map-easing.mjs
		function mapEasingToNativeEasing(easing, duration) {
			if (!easing) return;
			else if (typeof easing === "function") return supportsLinearEasing() ? generateLinearEasing(easing, duration) : "ease-out";
			else if (/* @__PURE__ */ isBezierDefinition(easing)) return cubicBezierAsString(easing);
			else if (Array.isArray(easing)) return easing.map((segmentEasing) => mapEasingToNativeEasing(segmentEasing, duration) || supportedWaapiEasing.easeOut);
			else return supportedWaapiEasing[easing];
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/animation/waapi/start-waapi-animation.mjs
		function startWaapiAnimation(element, valueName, keyframes, { delay = 0, duration = 300, repeat = 0, repeatType = "loop", ease = "easeOut", times } = {}, pseudoElement = void 0) {
			const keyframeOptions = { [valueName]: keyframes };
			if (times) keyframeOptions.offset = times;
			const easing = mapEasingToNativeEasing(ease, duration);
			/**
			* If this is an easing array, apply to keyframes, not animation as a whole
			*/
			if (Array.isArray(easing)) keyframeOptions.easing = easing;
			const options = {
				delay,
				duration,
				easing: !Array.isArray(easing) ? easing : "linear",
				fill: "both",
				iterations: repeat + 1,
				direction: repeatType === "reverse" ? "alternate" : "normal"
			};
			if (pseudoElement) options.pseudoElement = pseudoElement;
			return element.animate(keyframeOptions, options);
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/animation/generators/utils/is-generator.mjs
		function isGenerator(type) {
			return typeof type === "function" && "applyToOptions" in type;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/animation/waapi/utils/apply-generator.mjs
		function applyGeneratorOptions({ type, ...options }) {
			if (isGenerator(type) && supportsLinearEasing()) return type.applyToOptions(options);
			else {
				options.duration ?? (options.duration = 300);
				options.ease ?? (options.ease = "easeOut");
			}
			return options;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/animation/NativeAnimation.mjs
		/**
		* NativeAnimation implements AnimationPlaybackControls for the browser's Web Animations API.
		*/
		var NativeAnimation = class extends WithPromise {
			constructor(options) {
				super();
				this.finishedTime = null;
				this.isStopped = false;
				/**
				* Tracks a manually-set start time that takes precedence over WAAPI's
				* dynamic startTime. This is cleared when play() or time setter is called,
				* allowing WAAPI to take over timing.
				*/
				this.manualStartTime = null;
				if (!options) return;
				const { element, name, keyframes, pseudoElement, allowFlatten = false, finalKeyframe, onComplete } = options;
				this.isPseudoElement = Boolean(pseudoElement);
				this.allowFlatten = allowFlatten;
				this.options = options;
				options.type;
				const transition = applyGeneratorOptions(options);
				this.animation = startWaapiAnimation(element, name, keyframes, transition, pseudoElement);
				if (transition.autoplay === false) this.animation.pause();
				this.animation.onfinish = () => {
					this.finishedTime = this.time;
					if (!pseudoElement) {
						const keyframe = getFinalKeyframe(keyframes, this.options, finalKeyframe, this.speed);
						if (this.updateMotionValue) this.updateMotionValue(keyframe);
						/**
						* If we can, we want to commit the final style as set by the user,
						* rather than the computed keyframe value supplied by the animation.
						* We always do this, even when a motion value is present, to prevent
						* a visual flash in Firefox where the WAAPI animation's fill is removed
						* during cancel() before the scheduled render can apply the correct value.
						*/
						setStyle(element, name, keyframe);
						this.animation.cancel();
					}
					onComplete?.();
					this.notifyFinished();
				};
			}
			play() {
				if (this.isStopped) return;
				this.manualStartTime = null;
				this.animation.play();
				if (this.state === "finished") this.updateFinished();
			}
			pause() {
				this.animation.pause();
			}
			complete() {
				this.animation.finish?.();
			}
			cancel() {
				try {
					this.animation.cancel();
				} catch (e) {}
			}
			stop() {
				if (this.isStopped) return;
				this.isStopped = true;
				const { state } = this;
				if (state === "idle" || state === "finished") return;
				if (this.updateMotionValue) this.updateMotionValue();
				else this.commitStyles();
				if (!this.isPseudoElement) this.cancel();
			}
			/**
			* WAAPI doesn't natively have any interruption capabilities.
			*
			* In this method, we commit styles back to the DOM before cancelling
			* the animation.
			*
			* This is designed to be overridden by NativeAnimationExtended, which
			* will create a renderless JS animation and sample it twice to calculate
			* its current value, "previous" value, and therefore allow
			* Motion to also correctly calculate velocity for any subsequent animation
			* while deferring the commit until the next animation frame.
			*/
			commitStyles() {
				const element = this.options?.element;
				if (!this.isPseudoElement && element?.isConnected) this.animation.commitStyles?.();
			}
			get duration() {
				const duration = this.animation.effect?.getComputedTiming?.().duration || 0;
				return /* @__PURE__ */ millisecondsToSeconds(Number(duration));
			}
			get iterationDuration() {
				const { delay = 0 } = this.options || {};
				return this.duration + /* @__PURE__ */ millisecondsToSeconds(delay);
			}
			get time() {
				return /* @__PURE__ */ millisecondsToSeconds(Number(this.animation.currentTime) || 0);
			}
			set time(newTime) {
				const wasFinished = this.finishedTime !== null;
				this.manualStartTime = null;
				this.finishedTime = null;
				this.animation.currentTime = /* @__PURE__ */ secondsToMilliseconds(newTime);
				if (wasFinished) this.animation.pause();
			}
			/**
			* The playback speed of the animation.
			* 1 = normal speed, 2 = double speed, 0.5 = half speed.
			*/
			get speed() {
				return this.animation.playbackRate;
			}
			set speed(newSpeed) {
				if (newSpeed < 0) this.finishedTime = null;
				this.animation.playbackRate = newSpeed;
			}
			get state() {
				return this.finishedTime !== null ? "finished" : this.animation.playState;
			}
			get startTime() {
				return this.manualStartTime ?? Number(this.animation.startTime);
			}
			set startTime(newStartTime) {
				this.manualStartTime = this.animation.startTime = newStartTime;
			}
			/**
			* Attaches a timeline to the animation, for instance the `ScrollTimeline`.
			*/
			attachTimeline({ timeline, rangeStart, rangeEnd, observe }) {
				if (this.allowFlatten) this.animation.effect?.updateTiming({ easing: "linear" });
				this.animation.onfinish = null;
				if (timeline && supportsScrollTimeline()) {
					this.animation.timeline = timeline;
					if (rangeStart) this.animation.rangeStart = rangeStart;
					if (rangeEnd) this.animation.rangeEnd = rangeEnd;
					return noop;
				} else return observe(this);
			}
		};
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/animation/waapi/utils/unsupported-easing.mjs
		const unsupportedEasingFunctions = {
			anticipate,
			backInOut,
			circInOut
		};
		function isUnsupportedEase(key) {
			return key in unsupportedEasingFunctions;
		}
		function replaceStringEasing(transition) {
			if (typeof transition.ease === "string" && isUnsupportedEase(transition.ease)) transition.ease = unsupportedEasingFunctions[transition.ease];
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/animation/NativeAnimationExtended.mjs
		/**
		* 10ms is chosen here as it strikes a balance between smooth
		* results (more than one keyframe per frame at 60fps) and
		* keyframe quantity.
		*/
		const sampleDelta = 10;
		var NativeAnimationExtended = class extends NativeAnimation {
			constructor(options) {
				/**
				* The base NativeAnimation function only supports a subset
				* of Motion easings, and WAAPI also only supports some
				* easing functions via string/cubic-bezier definitions.
				*
				* This function replaces those unsupported easing functions
				* with a JS easing function. This will later get compiled
				* to a linear() easing function.
				*/
				replaceStringEasing(options);
				/**
				* Ensure we replace the transition type with a generator function
				* before passing to WAAPI.
				*
				* TODO: Does this have a better home? It could be shared with
				* JSAnimation.
				*/
				replaceTransitionType(options);
				super(options);
				/**
				* Only set startTime when the animation should autoplay.
				* Setting startTime on a paused WAAPI animation unpauses it
				* (per the WAAPI spec), which breaks autoplay: false.
				*/
				if (options.startTime !== void 0 && options.autoplay !== false) this.startTime = options.startTime;
				this.options = options;
			}
			/**
			* WAAPI doesn't natively have any interruption capabilities.
			*
			* Rather than read committed styles back out of the DOM, we can
			* create a renderless JS animation and sample it twice to calculate
			* its current value, "previous" value, and therefore allow
			* Motion to calculate velocity for any subsequent animation.
			*/
			updateMotionValue(value) {
				const { motionValue, onUpdate, onComplete, element, ...options } = this.options;
				if (!motionValue) return;
				if (value !== void 0) {
					motionValue.set(value);
					return;
				}
				const sampleAnimation = new JSAnimation({
					...options,
					autoplay: false
				});
				/**
				* Use wall-clock elapsed time for sampling.
				* Under CPU load, WAAPI's currentTime may not reflect actual
				* elapsed time, causing incorrect sampling and visual jumps.
				*/
				const sampleTime = Math.max(sampleDelta, time.now() - this.startTime);
				const delta = clamp(0, sampleDelta, sampleTime - sampleDelta);
				const current = sampleAnimation.sample(sampleTime).value;
				/**
				* Write the estimated value to inline style so it persists
				* after cancel(), covering the async gap before the next
				* animation starts.
				*/
				const { name } = this.options;
				if (element && name) setStyle(element, name, current);
				motionValue.setWithVelocity(sampleAnimation.sample(Math.max(0, sampleTime - delta)).value, current, delta);
				sampleAnimation.stop();
			}
		};
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/animation/utils/is-animatable.mjs
		/**
		* Check if a value is animatable. Examples:
		*
		* ✅: 100, "100px", "#fff"
		* ❌: "block", "url(2.jpg)"
		* @param value
		*
		* @internal
		*/
		const isAnimatable = (value, name) => {
			if (name === "zIndex") return false;
			if (typeof value === "number" || Array.isArray(value)) return true;
			if (typeof value === "string" && (complex.test(value) || value === "0") && !value.startsWith("url(")) return true;
			return false;
		};
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/animation/utils/can-animate.mjs
		function hasKeyframesChanged(keyframes) {
			const current = keyframes[0];
			if (keyframes.length === 1) return true;
			for (let i = 0; i < keyframes.length; i++) if (keyframes[i] !== current) return true;
		}
		function canAnimate(keyframes, name, type, velocity) {
			/**
			* Check if we're able to animate between the start and end keyframes,
			* and throw a warning if we're attempting to animate between one that's
			* animatable and another that isn't.
			*/
			const originKeyframe = keyframes[0];
			if (originKeyframe === null) return false;
			/**
			* These aren't traditionally animatable but we do support them.
			* In future we could look into making this more generic or replacing
			* this function with mix() === mixImmediate
			*/
			if (name === "display" || name === "visibility") return true;
			const targetKeyframe = keyframes[keyframes.length - 1];
			const isOriginAnimatable = isAnimatable(originKeyframe, name);
			const isTargetAnimatable = isAnimatable(targetKeyframe, name);
			`${name}${originKeyframe}${targetKeyframe}${isOriginAnimatable ? targetKeyframe : originKeyframe}`;
			if (!isOriginAnimatable || !isTargetAnimatable) return false;
			return hasKeyframesChanged(keyframes) || (type === "spring" || isGenerator(type)) && velocity;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/animation/utils/make-animation-instant.mjs
		function makeAnimationInstant(options) {
			options.duration = 0;
			options.type = "keyframes";
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/animation/waapi/utils/accelerated-values.mjs
		/**
		* A list of values that can be hardware-accelerated.
		*/
		const acceleratedValues = /* @__PURE__ */ new Set([
			"opacity",
			"clipPath",
			"filter",
			"transform",
			"backgroundColor"
		]);
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/animation/waapi/utils/is-browser-color.mjs
		const browserColorFunctions = /^(?:oklch|oklab|lab|lch|color|color-mix|light-dark)\(/;
		function hasBrowserOnlyColors(keyframes) {
			for (let i = 0; i < keyframes.length; i++) if (typeof keyframes[i] === "string" && browserColorFunctions.test(keyframes[i])) return true;
			return false;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/animation/waapi/supports/waapi.mjs
		const colorProperties = /* @__PURE__ */ new Set([
			"color",
			"backgroundColor",
			"outlineColor",
			"fill",
			"stroke",
			"borderColor",
			"borderTopColor",
			"borderRightColor",
			"borderBottomColor",
			"borderLeftColor"
		]);
		const supportsWaapi = /*@__PURE__*/ memo(() => Object.hasOwnProperty.call(Element.prototype, "animate"));
		function supportsBrowserAnimation(options) {
			const { motionValue, name, repeatDelay, repeatType, damping, type, keyframes } = options;
			const subject = motionValue?.owner?.current;
			/**
			* We use instanceof checks instead of isHTMLElement()/isSVGElement()
			* because we explicitly **don't** want elements in different timing
			* contexts (i.e. popups) to be accelerated, as it's not possible to sync
			* these animations properly with those driven from the main window
			* frameloop.
			*/
			if (!(subject instanceof HTMLElement) && !(subject instanceof SVGElement)) return false;
			const { onUpdate, transformTemplate } = motionValue.owner.getProps();
			return supportsWaapi() && name && (acceleratedValues.has(name) || colorProperties.has(name) && hasBrowserOnlyColors(keyframes)) && (name !== "transform" || !transformTemplate) && !onUpdate && !repeatDelay && repeatType !== "mirror" && damping !== 0 && type !== "inertia";
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/animation/AsyncMotionValueAnimation.mjs
		/**
		* Maximum time allowed between an animation being created and it being
		* resolved for us to use the latter as the start time.
		*
		* This is to ensure that while we prefer to "start" an animation as soon
		* as it's triggered, we also want to avoid a visual jump if there's a big delay
		* between these two moments.
		*/
		const MAX_RESOLVE_DELAY = 40;
		var AsyncMotionValueAnimation = class extends WithPromise {
			constructor({ autoplay = true, delay = 0, type = "keyframes", repeat = 0, repeatDelay = 0, repeatType = "loop", keyframes, name, motionValue, element, ...options }) {
				super();
				/**
				* Bound to support return animation.stop pattern
				*/
				this.stop = () => {
					if (this._animation) {
						this._animation.stop();
						this.stopTimeline?.();
					}
					this.keyframeResolver?.cancel();
				};
				this.createdAt = time.now();
				const optionsWithDefaults = {
					autoplay,
					delay,
					type,
					repeat,
					repeatDelay,
					repeatType,
					name,
					motionValue,
					element,
					...options
				};
				const KeyframeResolver$1 = element?.KeyframeResolver || KeyframeResolver;
				this.keyframeResolver = new KeyframeResolver$1(keyframes, (resolvedKeyframes, finalKeyframe, forced) => this.onKeyframesResolved(resolvedKeyframes, finalKeyframe, optionsWithDefaults, !forced), name, motionValue, element);
				this.keyframeResolver?.scheduleResolve();
			}
			onKeyframesResolved(keyframes, finalKeyframe, options, sync) {
				this.keyframeResolver = void 0;
				const { name, type, velocity, delay, isHandoff, onUpdate } = options;
				this.resolvedAt = time.now();
				/**
				* If we can't animate this value with the resolved keyframes
				* then we should complete it immediately.
				*/
				let canAnimateValue = true;
				if (!canAnimate(keyframes, name, type, velocity)) {
					canAnimateValue = false;
					if (MotionGlobalConfig.instantAnimations || !delay) onUpdate?.(getFinalKeyframe(keyframes, options, finalKeyframe));
					keyframes[0] = keyframes[keyframes.length - 1];
					makeAnimationInstant(options);
					options.repeat = 0;
				}
				const resolvedOptions = {
					startTime: sync ? !this.resolvedAt ? this.createdAt : this.resolvedAt - this.createdAt > MAX_RESOLVE_DELAY ? this.resolvedAt : this.createdAt : void 0,
					finalKeyframe,
					...options,
					keyframes
				};
				/**
				* Animate via WAAPI if possible. If this is a handoff animation, the optimised animation will be running via
				* WAAPI. Therefore, this animation must be JS to ensure it runs "under" the
				* optimised animation.
				*
				* Also skip WAAPI when keyframes aren't animatable, as the resolved
				* values may not be valid CSS and would trigger browser warnings.
				*/
				const useWaapi = canAnimateValue && !isHandoff && supportsBrowserAnimation(resolvedOptions);
				const element = resolvedOptions.motionValue?.owner?.current;
				let animation;
				if (useWaapi) try {
					animation = new NativeAnimationExtended({
						...resolvedOptions,
						element
					});
				} catch {
					animation = new JSAnimation(resolvedOptions);
				}
				else animation = new JSAnimation(resolvedOptions);
				animation.finished.then(() => {
					this.notifyFinished();
				}).catch(noop);
				if (this.pendingTimeline) {
					this.stopTimeline = animation.attachTimeline(this.pendingTimeline);
					this.pendingTimeline = void 0;
				}
				this._animation = animation;
			}
			get finished() {
				if (!this._animation) return this._finished;
				else return this.animation.finished;
			}
			then(onResolve, _onReject) {
				return this.finished.finally(onResolve).then(() => {});
			}
			get animation() {
				if (!this._animation) {
					this.keyframeResolver?.resume();
					flushKeyframeResolvers();
				}
				return this._animation;
			}
			get duration() {
				return this.animation.duration;
			}
			get iterationDuration() {
				return this.animation.iterationDuration;
			}
			get time() {
				return this.animation.time;
			}
			set time(newTime) {
				this.animation.time = newTime;
			}
			get speed() {
				return this.animation.speed;
			}
			get state() {
				return this.animation.state;
			}
			set speed(newSpeed) {
				this.animation.speed = newSpeed;
			}
			get startTime() {
				return this.animation.startTime;
			}
			attachTimeline(timeline) {
				if (this._animation) this.stopTimeline = this.animation.attachTimeline(timeline);
				else this.pendingTimeline = timeline;
				return () => this.stop();
			}
			play() {
				this.animation.play();
			}
			pause() {
				this.animation.pause();
			}
			complete() {
				this.animation.complete();
			}
			cancel() {
				if (this._animation) this.animation.cancel();
				this.keyframeResolver?.cancel();
			}
		};
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/animation/utils/calc-child-stagger.mjs
		function calcChildStagger(children, child, delayChildren, staggerChildren = 0, staggerDirection = 1) {
			const index = Array.from(children).sort((a, b) => a.sortNodePosition(b)).indexOf(child);
			const numChildren = children.size;
			const maxStaggerDuration = (numChildren - 1) * staggerChildren;
			return typeof delayChildren === "function" ? delayChildren(index, numChildren) : staggerDirection === 1 ? index * staggerChildren : maxStaggerDuration - index * staggerChildren;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/value/index.mjs
		/**
		* Maximum time between the value of two frames, beyond which we
		* assume the velocity has since been 0.
		*/
		const MAX_VELOCITY_DELTA = 30;
		const isFloat = (value) => {
			return !isNaN(parseFloat(value));
		};
		const collectMotionValues = { current: void 0 };
		/**
		* `MotionValue` is used to track the state and velocity of motion values.
		*
		* @public
		*/
		var MotionValue = class {
			/**
			* @param init - The initiating value
			* @param config - Optional configuration options
			*
			* -  `transformer`: A function to transform incoming values with.
			*/
			constructor(init, options = {}) {
				/**
				* Tracks whether this value can output a velocity. Currently this is only true
				* if the value is numerical, but we might be able to widen the scope here and support
				* other value types.
				*
				* @internal
				*/
				this.canTrackVelocity = null;
				/**
				* An object containing a SubscriptionManager for each active event.
				*/
				this.events = {};
				this.updateAndNotify = (v) => {
					const currentTime = time.now();
					/**
					* If we're updating the value during another frame or eventloop
					* than the previous frame, then the we set the previous frame value
					* to current.
					*/
					if (this.updatedAt !== currentTime) this.setPrevFrameValue();
					this.prev = this.current;
					this.setCurrent(v);
					if (this.current !== this.prev) {
						this.events.change?.notify(this.current);
						if (this.dependents) for (const dependent of this.dependents) dependent.dirty();
					}
				};
				this.hasAnimated = false;
				this.setCurrent(init);
				this.owner = options.owner;
			}
			setCurrent(current) {
				this.current = current;
				this.updatedAt = time.now();
				if (this.canTrackVelocity === null && current !== void 0) this.canTrackVelocity = isFloat(this.current);
			}
			setPrevFrameValue(prevFrameValue = this.current) {
				this.prevFrameValue = prevFrameValue;
				this.prevUpdatedAt = this.updatedAt;
			}
			/**
			* Adds a function that will be notified when the `MotionValue` is updated.
			*
			* It returns a function that, when called, will cancel the subscription.
			*
			* When calling `onChange` inside a React component, it should be wrapped with the
			* `useEffect` hook. As it returns an unsubscribe function, this should be returned
			* from the `useEffect` function to ensure you don't add duplicate subscribers..
			*
			* ```jsx
			* export const MyComponent = () => {
			*   const x = useMotionValue(0)
			*   const y = useMotionValue(0)
			*   const opacity = useMotionValue(1)
			*
			*   useEffect(() => {
			*     function updateOpacity() {
			*       const maxXY = Math.max(x.get(), y.get())
			*       const newOpacity = transform(maxXY, [0, 100], [1, 0])
			*       opacity.set(newOpacity)
			*     }
			*
			*     const unsubscribeX = x.on("change", updateOpacity)
			*     const unsubscribeY = y.on("change", updateOpacity)
			*
			*     return () => {
			*       unsubscribeX()
			*       unsubscribeY()
			*     }
			*   }, [])
			*
			*   return <motion.div style={{ x }} />
			* }
			* ```
			*
			* @param subscriber - A function that receives the latest value.
			* @returns A function that, when called, will cancel this subscription.
			*
			* @deprecated
			*/
			onChange(subscription) {
				return this.on("change", subscription);
			}
			on(eventName, callback) {
				if (!this.events[eventName]) this.events[eventName] = new SubscriptionManager();
				const unsubscribe = this.events[eventName].add(callback);
				if (eventName === "change") return () => {
					unsubscribe();
					/**
					* If we have no more change listeners by the start
					* of the next frame, stop active animations.
					*/
					frame.read(() => {
						if (!this.events.change.getSize()) this.stop();
					});
				};
				return unsubscribe;
			}
			clearListeners() {
				for (const eventManagers in this.events) this.events[eventManagers].clear();
			}
			/**
			* Attaches a passive effect to the `MotionValue`.
			*/
			attach(passiveEffect, stopPassiveEffect) {
				this.passiveEffect = passiveEffect;
				this.stopPassiveEffect = stopPassiveEffect;
			}
			/**
			* Sets the state of the `MotionValue`.
			*
			* @remarks
			*
			* ```jsx
			* const x = useMotionValue(0)
			* x.set(10)
			* ```
			*
			* @param latest - Latest value to set.
			* @param render - Whether to notify render subscribers. Defaults to `true`
			*
			* @public
			*/
			set(v) {
				if (!this.passiveEffect) this.updateAndNotify(v);
				else this.passiveEffect(v, this.updateAndNotify);
			}
			setWithVelocity(prev, current, delta) {
				this.set(current);
				this.prev = void 0;
				this.prevFrameValue = prev;
				this.prevUpdatedAt = this.updatedAt - delta;
			}
			/**
			* Set the state of the `MotionValue`, stopping any active animations,
			* effects, and resets velocity to `0`.
			*/
			jump(v, endAnimation = true) {
				this.updateAndNotify(v);
				this.prev = v;
				this.prevUpdatedAt = this.prevFrameValue = void 0;
				endAnimation && this.stop();
				if (this.stopPassiveEffect) this.stopPassiveEffect();
			}
			dirty() {
				this.events.change?.notify(this.current);
			}
			addDependent(dependent) {
				if (!this.dependents) this.dependents = /* @__PURE__ */ new Set();
				this.dependents.add(dependent);
			}
			removeDependent(dependent) {
				if (this.dependents) this.dependents.delete(dependent);
			}
			/**
			* Returns the latest state of `MotionValue`
			*
			* @returns - The latest state of `MotionValue`
			*
			* @public
			*/
			get() {
				if (collectMotionValues.current) collectMotionValues.current.push(this);
				return this.current;
			}
			/**
			* @public
			*/
			getPrevious() {
				return this.prev;
			}
			/**
			* Returns the latest velocity of `MotionValue`
			*
			* @returns - The latest velocity of `MotionValue`. Returns `0` if the state is non-numerical.
			*
			* @public
			*/
			getVelocity() {
				const currentTime = time.now();
				if (!this.canTrackVelocity || this.prevFrameValue === void 0 || currentTime - this.updatedAt > MAX_VELOCITY_DELTA) return 0;
				const delta = Math.min(this.updatedAt - this.prevUpdatedAt, MAX_VELOCITY_DELTA);
				return /* @__PURE__ */ velocityPerSecond(parseFloat(this.current) - parseFloat(this.prevFrameValue), delta);
			}
			/**
			* Registers a new animation to control this `MotionValue`. Only one
			* animation can drive a `MotionValue` at one time.
			*
			* ```jsx
			* value.start()
			* ```
			*
			* @param animation - A function that starts the provided animation
			*/
			start(startAnimation) {
				this.stop();
				return new Promise((resolve) => {
					this.hasAnimated = true;
					this.animation = startAnimation(resolve);
					if (this.events.animationStart) this.events.animationStart.notify();
				}).then(() => {
					if (this.events.animationComplete) this.events.animationComplete.notify();
					this.clearAnimation();
				});
			}
			/**
			* Stop the currently active animation.
			*
			* @public
			*/
			stop() {
				if (this.animation) {
					this.animation.stop();
					if (this.events.animationCancel) this.events.animationCancel.notify();
				}
				this.clearAnimation();
			}
			/**
			* Returns `true` if this value is currently animating.
			*
			* @public
			*/
			isAnimating() {
				return !!this.animation;
			}
			clearAnimation() {
				delete this.animation;
			}
			/**
			* Destroy and clean up subscribers to this `MotionValue`.
			*
			* The `MotionValue` hooks like `useMotionValue` and `useTransform` automatically
			* handle the lifecycle of the returned `MotionValue`, so this method is only necessary if you've manually
			* created a `MotionValue` via the `motionValue` function.
			*
			* @public
			*/
			destroy() {
				this.dependents?.clear();
				this.events.destroy?.notify();
				this.clearListeners();
				this.stop();
				if (this.stopPassiveEffect) this.stopPassiveEffect();
			}
		};
		function motionValue(init, options) {
			return new MotionValue(init, options);
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/animation/utils/resolve-transition.mjs
		/**
		* If `transition` has `inherit: true`, shallow-merge it with
		* `parentTransition` (child keys win) and strip the `inherit` key.
		* Otherwise return `transition` unchanged.
		*/
		function resolveTransition(transition, parentTransition) {
			if (transition?.inherit && parentTransition) {
				const { inherit: _, ...rest } = transition;
				return {
					...parentTransition,
					...rest
				};
			}
			return transition;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/animation/utils/get-value-transition.mjs
		function getValueTransition(transition, key) {
			const valueTransition = transition?.[key] ?? transition?.["default"] ?? transition;
			if (valueTransition !== transition) return resolveTransition(valueTransition, transition);
			return valueTransition;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/animation/utils/default-transitions.mjs
		const underDampedSpring = {
			type: "spring",
			stiffness: 500,
			damping: 25,
			restSpeed: 10
		};
		const criticallyDampedSpring = (target) => ({
			type: "spring",
			stiffness: 550,
			damping: target === 0 ? 2 * Math.sqrt(550) : 30,
			restSpeed: 10
		});
		const keyframesTransition = {
			type: "keyframes",
			duration: .8
		};
		/**
		* Default easing curve is a slightly shallower version of
		* the default browser easing curve.
		*/
		const ease = {
			type: "keyframes",
			ease: [
				.25,
				.1,
				.35,
				1
			],
			duration: .3
		};
		const getDefaultTransition = (valueKey, { keyframes }) => {
			if (keyframes.length > 2) return keyframesTransition;
			else if (transformProps.has(valueKey)) return valueKey.startsWith("scale") ? criticallyDampedSpring(keyframes[1]) : underDampedSpring;
			return ease;
		};
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/animation/utils/is-transition-defined.mjs
		const orchestrationKeys = /* @__PURE__ */ new Set([
			"when",
			"delay",
			"delayChildren",
			"staggerChildren",
			"staggerDirection",
			"repeat",
			"repeatType",
			"repeatDelay",
			"from",
			"elapsed"
		]);
		/**
		* Decide whether a transition is defined on a given Transition.
		* This filters out orchestration options and returns true
		* if any options are left.
		*/
		function isTransitionDefined(transition) {
			for (const key in transition) if (!orchestrationKeys.has(key)) return true;
			return false;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/animation/interfaces/motion-value.mjs
		const animateMotionValue = (name, value, target, transition = {}, element, isHandoff) => (onComplete) => {
			const valueTransition = getValueTransition(transition, name) || {};
			/**
			* Most transition values are currently completely overwritten by value-specific
			* transitions. In the future it'd be nicer to blend these transitions. But for now
			* delay actually does inherit from the root transition if not value-specific.
			*/
			const delay = valueTransition.delay || transition.delay || 0;
			/**
			* Elapsed isn't a public transition option but can be passed through from
			* optimized appear effects in milliseconds.
			*/
			let { elapsed = 0 } = transition;
			elapsed = elapsed - /* @__PURE__ */ secondsToMilliseconds(delay);
			const options = {
				keyframes: Array.isArray(target) ? target : [null, target],
				ease: "easeOut",
				velocity: value.getVelocity(),
				...valueTransition,
				delay: -elapsed,
				onUpdate: (v) => {
					value.set(v);
					valueTransition.onUpdate && valueTransition.onUpdate(v);
				},
				onComplete: () => {
					onComplete();
					valueTransition.onComplete && valueTransition.onComplete();
				},
				name,
				motionValue: value,
				element: isHandoff ? void 0 : element
			};
			/**
			* If there's no transition defined for this value, we can generate
			* unique transition settings for this value.
			*/
			if (!isTransitionDefined(valueTransition)) Object.assign(options, getDefaultTransition(name, options));
			/**
			* Both WAAPI and our internal animation functions use durations
			* as defined by milliseconds, while our external API defines them
			* as seconds.
			*/
			options.duration && (options.duration = /* @__PURE__ */ secondsToMilliseconds(options.duration));
			options.repeatDelay && (options.repeatDelay = /* @__PURE__ */ secondsToMilliseconds(options.repeatDelay));
			/**
			* Support deprecated way to set initial value. Prefer keyframe syntax.
			*/
			if (options.from !== void 0) options.keyframes[0] = options.from;
			let shouldSkip = false;
			if (options.type === false || options.duration === 0 && !options.repeatDelay) {
				makeAnimationInstant(options);
				if (options.delay === 0) shouldSkip = true;
			}
			if (MotionGlobalConfig.instantAnimations || MotionGlobalConfig.skipAnimations || element?.shouldSkipAnimations || valueTransition.skipAnimations) {
				shouldSkip = true;
				makeAnimationInstant(options);
				options.delay = 0;
			}
			/**
			* If the transition type or easing has been explicitly set by the user
			* then we don't want to allow flattening the animation.
			*/
			options.allowFlatten = !valueTransition.type && !valueTransition.ease;
			/**
			* If we can or must skip creating the animation, and apply only
			* the final keyframe, do so. We also check once keyframes are resolved but
			* this early check prevents the need to create an animation at all.
			*/
			if (shouldSkip && !isHandoff && value.get() !== void 0) {
				const finalKeyframe = getFinalKeyframe(options.keyframes, valueTransition);
				if (finalKeyframe !== void 0) {
					frame.update(() => {
						options.onUpdate(finalKeyframe);
						options.onComplete();
					});
					return;
				}
			}
			return valueTransition.isSync ? new JSAnimation(options) : new AsyncMotionValueAnimation(options);
		};
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/animation/utils/css-variables-conversion.mjs
		/**
		* Parse Framer's special CSS variable format into a CSS token and a fallback.
		*
		* ```
		* `var(--foo, #fff)` => [`--foo`, '#fff']
		* ```
		*
		* @param current
		*/
		const splitCSSVariableRegex = /^var\(--(?:([\w-]+)|([\w-]+), ?([a-zA-Z\d ()%#.,-]+))\)/u;
		function parseCSSVariable(current) {
			const match = splitCSSVariableRegex.exec(current);
			if (!match) return [,];
			const [, token1, token2, fallback] = match;
			return [`--${token1 ?? token2}`, fallback];
		}
		function getVariableValue(current, element, depth = 1) {
			`${current}`;
			const [token, fallback] = parseCSSVariable(current);
			if (!token) return;
			const resolved = window.getComputedStyle(element).getPropertyValue(token);
			if (resolved) {
				const trimmed = resolved.trim();
				return isNumericalString(trimmed) ? parseFloat(trimmed) : trimmed;
			}
			return isCSSVariableToken(fallback) ? getVariableValue(fallback, element, depth + 1) : fallback;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/render/utils/resolve-variants.mjs
		function getValueState(visualElement) {
			const state = [{}, {}];
			visualElement?.values.forEach((value, key) => {
				state[0][key] = value.get();
				state[1][key] = value.getVelocity();
			});
			return state;
		}
		function resolveVariantFromProps(props, definition, custom, visualElement) {
			/**
			* If the variant definition is a function, resolve.
			*/
			if (typeof definition === "function") {
				const [current, velocity] = getValueState(visualElement);
				definition = definition(custom !== void 0 ? custom : props.custom, current, velocity);
			}
			/**
			* If the variant definition is a variant label, or
			* the function returned a variant label, resolve.
			*/
			if (typeof definition === "string") definition = props.variants && props.variants[definition];
			/**
			* At this point we've resolved both functions and variant labels,
			* but the resolved variant label might itself have been a function.
			* If so, resolve. This can only have returned a valid target object.
			*/
			if (typeof definition === "function") {
				const [current, velocity] = getValueState(visualElement);
				definition = definition(custom !== void 0 ? custom : props.custom, current, velocity);
			}
			return definition;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/render/utils/resolve-dynamic-variants.mjs
		function resolveVariant(visualElement, definition, custom) {
			const props = visualElement.getProps();
			return resolveVariantFromProps(props, definition, custom !== void 0 ? custom : props.custom, visualElement);
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/render/utils/keys-position.mjs
		const positionalKeys = /* @__PURE__ */ new Set([
			"width",
			"height",
			"top",
			"left",
			"right",
			"bottom",
			...transformPropOrder
		]);
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/render/utils/is-keyframes-target.mjs
		const isKeyframesTarget = (v) => {
			return Array.isArray(v);
		};
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/render/utils/setters.mjs
		/**
		* Set VisualElement's MotionValue, creating a new MotionValue for it if
		* it doesn't exist.
		*/
		function setMotionValue(visualElement, key, value) {
			if (visualElement.hasValue(key)) visualElement.getValue(key).set(value);
			else visualElement.addValue(key, motionValue(value));
		}
		function resolveFinalValueInKeyframes(v) {
			return isKeyframesTarget(v) ? v[v.length - 1] || 0 : v;
		}
		function setTarget(visualElement, definition) {
			let { transitionEnd = {}, transition = {}, ...target } = resolveVariant(visualElement, definition) || {};
			target = {
				...target,
				...transitionEnd
			};
			for (const key in target) setMotionValue(visualElement, key, resolveFinalValueInKeyframes(target[key]));
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/value/utils/is-motion-value.mjs
		const isMotionValue = (value) => Boolean(value && value.getVelocity);
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/value/will-change/is.mjs
		function isWillChangeMotionValue(value) {
			return Boolean(isMotionValue(value) && value.add);
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/value/will-change/add-will-change.mjs
		function addValueToWillChange(visualElement, key) {
			const willChange = visualElement.getValue("willChange");
			/**
			* It could be that a user has set willChange to a regular MotionValue,
			* in which case we can't add the value to it.
			*/
			if (isWillChangeMotionValue(willChange)) return willChange.add(key);
			else if (!willChange && MotionGlobalConfig.WillChange) {
				const newWillChange = new MotionGlobalConfig.WillChange("auto");
				visualElement.addValue("willChange", newWillChange);
				newWillChange.add(key);
			}
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/render/dom/utils/camel-to-dash.mjs
		function camelToDash(str) {
			return str.replace(/([A-Z])/g, (match) => `-${match.toLowerCase()}`);
		}
		const optimizedAppearDataAttribute = "data-" + camelToDash("framerAppearId");
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/animation/optimized-appear/get-appear-id.mjs
		function getOptimisedAppearId(visualElement) {
			return visualElement.props[optimizedAppearDataAttribute];
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/animation/interfaces/visual-element-target.mjs
		/**
		* Decide whether we should block this animation. Previously, we achieved this
		* just by checking whether the key was listed in protectedKeys, but this
		* posed problems if an animation was triggered by afterChildren and protectedKeys
		* had been set to true in the meantime.
		*/
		function shouldBlockAnimation({ protectedKeys, needsAnimating }, key) {
			const shouldBlock = protectedKeys.hasOwnProperty(key) && needsAnimating[key] !== true;
			needsAnimating[key] = false;
			return shouldBlock;
		}
		function animateTarget(visualElement, targetAndTransition, { delay = 0, transitionOverride, type } = {}) {
			let { transition, transitionEnd, ...target } = targetAndTransition;
			const defaultTransition = visualElement.getDefaultTransition();
			transition = transition ? resolveTransition(transition, defaultTransition) : defaultTransition;
			const reduceMotion = transition?.reduceMotion;
			const skipAnimations = transition?.skipAnimations;
			if (transitionOverride) transition = transitionOverride;
			const animations = [];
			const animationTypeState = type && visualElement.animationState && visualElement.animationState.getState()[type];
			const path = transition?.path;
			if (path) path.animateVisualElement(visualElement, target, transition, delay, animations);
			for (const key in target) {
				const value = visualElement.getValue(key, visualElement.latestValues[key] ?? null);
				const valueTarget = target[key];
				if (valueTarget === void 0 || animationTypeState && shouldBlockAnimation(animationTypeState, key)) continue;
				const valueTransition = {
					delay,
					...getValueTransition(transition || {}, key)
				};
				if (skipAnimations) valueTransition.skipAnimations = true;
				/**
				* If the value is already at the defined target, skip the animation.
				* We still re-assert the value via frame.update to take precedence
				* over any stale transitionEnd callbacks from previous animations.
				*/
				const currentValue = value.get();
				if (currentValue !== void 0 && !value.isAnimating() && !Array.isArray(valueTarget) && valueTarget === currentValue && !valueTransition.velocity) {
					frame.update(() => value.set(valueTarget));
					continue;
				}
				/**
				* If this is the first time a value is being animated, check
				* to see if we're handling off from an existing animation.
				*/
				let isHandoff = false;
				if (window.MotionHandoffAnimation) {
					const appearId = getOptimisedAppearId(visualElement);
					if (appearId) {
						const startTime = window.MotionHandoffAnimation(appearId, key, frame);
						if (startTime !== null) {
							valueTransition.startTime = startTime;
							isHandoff = true;
						}
					}
				}
				addValueToWillChange(visualElement, key);
				const shouldReduceMotion = reduceMotion ?? visualElement.shouldReduceMotion;
				value.start(animateMotionValue(key, value, valueTarget, shouldReduceMotion && positionalKeys.has(key) ? { type: false } : valueTransition, visualElement, isHandoff));
				const animation = value.animation;
				if (animation) animations.push(animation);
			}
			if (transitionEnd) {
				const applyTransitionEnd = () => frame.update(() => {
					transitionEnd && setTarget(visualElement, transitionEnd);
				});
				if (animations.length) Promise.all(animations).then(applyTransitionEnd);
				else applyTransitionEnd();
			}
			return animations;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/animation/interfaces/visual-element-variant.mjs
		function animateVariant(visualElement, variant, options = {}) {
			const resolved = resolveVariant(visualElement, variant, options.type === "exit" ? visualElement.presenceContext?.custom : void 0);
			let { transition = visualElement.getDefaultTransition() || {} } = resolved || {};
			if (options.transitionOverride) transition = options.transitionOverride;
			/**
			* If we have a variant, create a callback that runs it as an animation.
			* Otherwise, we resolve a Promise immediately for a composable no-op.
			*/
			const getAnimation = resolved ? () => Promise.all(animateTarget(visualElement, resolved, options)) : () => Promise.resolve();
			/**
			* If we have children, create a callback that runs all their animations.
			* Otherwise, we resolve a Promise immediately for a composable no-op.
			*/
			const getChildAnimations = visualElement.variantChildren && visualElement.variantChildren.size ? (forwardDelay = 0) => {
				const { delayChildren = 0, staggerChildren, staggerDirection } = transition;
				return animateChildren(visualElement, variant, forwardDelay, delayChildren, staggerChildren, staggerDirection, options);
			} : () => Promise.resolve();
			/**
			* If the transition explicitly defines a "when" option, we need to resolve either
			* this animation or all children animations before playing the other.
			*/
			const { when } = transition;
			if (when) {
				const [first, last] = when === "beforeChildren" ? [getAnimation, getChildAnimations] : [getChildAnimations, getAnimation];
				return first().then(() => last());
			} else return Promise.all([getAnimation(), getChildAnimations(options.delay)]);
		}
		function animateChildren(visualElement, variant, delay = 0, delayChildren = 0, staggerChildren = 0, staggerDirection = 1, options) {
			const animations = [];
			for (const child of visualElement.variantChildren) {
				child.notify("AnimationStart", variant);
				animations.push(animateVariant(child, variant, {
					...options,
					delay: delay + (typeof delayChildren === "function" ? 0 : delayChildren) + calcChildStagger(visualElement.variantChildren, child, delayChildren, staggerChildren, staggerDirection)
				}).then(() => child.notify("AnimationComplete", variant)));
			}
			return Promise.all(animations);
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/animation/interfaces/visual-element.mjs
		function animateVisualElement(visualElement, definition, options = {}) {
			visualElement.notify("AnimationStart", definition);
			let animation;
			if (Array.isArray(definition)) {
				const animations = definition.map((variant) => animateVariant(visualElement, variant, options));
				animation = Promise.all(animations);
			} else if (typeof definition === "string") animation = animateVariant(visualElement, definition, options);
			else {
				const resolvedDefinition = typeof definition === "function" ? resolveVariant(visualElement, definition, options.custom) : definition;
				animation = Promise.all(animateTarget(visualElement, resolvedDefinition, options));
			}
			return animation.then(() => {
				visualElement.notify("AnimationComplete", definition);
			});
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/value/types/auto.mjs
		/**
		* ValueType for "auto"
		*/
		const auto = {
			test: (v) => v === "auto",
			parse: (v) => v
		};
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/value/types/test.mjs
		/**
		* Tests a provided value against a ValueType
		*/
		const testValueType = (v) => (type) => type.test(v);
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/value/types/dimensions.mjs
		/**
		* A list of value types commonly used for dimensions
		*/
		const dimensionValueTypes = [
			number,
			px,
			percent,
			degrees,
			vw,
			vh,
			auto
		];
		/**
		* Tests a dimensional value against the list of dimension ValueTypes
		*/
		const findDimensionValueType = (v) => dimensionValueTypes.find(testValueType(v));
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/animation/keyframes/utils/is-none.mjs
		function isNone(value) {
			if (typeof value === "number") return value === 0;
			else if (value !== null) return value === "none" || value === "0" || isZeroValueString(value);
			else return true;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/value/types/complex/filter.mjs
		/**
		* Properties that should default to 1 or 100%
		*/
		const maxDefaults = /* @__PURE__ */ new Set([
			"brightness",
			"contrast",
			"saturate",
			"opacity"
		]);
		function applyDefaultFilter(v) {
			const [name, value] = v.slice(0, -1).split("(");
			if (name === "drop-shadow") return v;
			const [number] = value.match(floatRegex) || [];
			if (!number) return v;
			const unit = value.replace(number, "");
			let defaultValue = maxDefaults.has(name) ? 1 : 0;
			if (number !== value) defaultValue *= 100;
			return name + "(" + defaultValue + unit + ")";
		}
		const functionRegex = /\b([a-z-]*)\(.*?\)/gu;
		const filter = {
			...complex,
			getAnimatableNone: (v) => {
				const functions = v.match(functionRegex);
				return functions ? functions.map(applyDefaultFilter).join(" ") : v;
			}
		};
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/value/types/complex/mask.mjs
		const mask = {
			...complex,
			getAnimatableNone: (v) => {
				const parsed = complex.parse(v);
				return complex.createTransformer(v)(parsed.map((v) => typeof v === "number" ? 0 : typeof v === "object" ? {
					...v,
					alpha: 1
				} : v));
			}
		};
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/value/types/int.mjs
		const int = {
			...number,
			transform: Math.round
		};
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/value/types/maps/number.mjs
		const numberValueTypes = {
			borderWidth: px,
			borderTopWidth: px,
			borderRightWidth: px,
			borderBottomWidth: px,
			borderLeftWidth: px,
			borderRadius: px,
			borderTopLeftRadius: px,
			borderTopRightRadius: px,
			borderBottomRightRadius: px,
			borderBottomLeftRadius: px,
			width: px,
			maxWidth: px,
			height: px,
			maxHeight: px,
			top: px,
			right: px,
			bottom: px,
			left: px,
			inset: px,
			insetBlock: px,
			insetBlockStart: px,
			insetBlockEnd: px,
			insetInline: px,
			insetInlineStart: px,
			insetInlineEnd: px,
			padding: px,
			paddingTop: px,
			paddingRight: px,
			paddingBottom: px,
			paddingLeft: px,
			paddingBlock: px,
			paddingBlockStart: px,
			paddingBlockEnd: px,
			paddingInline: px,
			paddingInlineStart: px,
			paddingInlineEnd: px,
			margin: px,
			marginTop: px,
			marginRight: px,
			marginBottom: px,
			marginLeft: px,
			marginBlock: px,
			marginBlockStart: px,
			marginBlockEnd: px,
			marginInline: px,
			marginInlineStart: px,
			marginInlineEnd: px,
			fontSize: px,
			backgroundPositionX: px,
			backgroundPositionY: px,
			rotate: degrees,
			/**
			* Internal channel for `transition.path` orientToPath. Composed onto
			* `rotate` at the transform-build sites so the user's `rotate` is
			* never read or overwritten. Not part of `transformPropOrder`.
			*/
			pathRotation: degrees,
			rotateX: degrees,
			rotateY: degrees,
			rotateZ: degrees,
			scale,
			scaleX: scale,
			scaleY: scale,
			scaleZ: scale,
			skew: degrees,
			skewX: degrees,
			skewY: degrees,
			distance: px,
			translateX: px,
			translateY: px,
			translateZ: px,
			x: px,
			y: px,
			z: px,
			perspective: px,
			transformPerspective: px,
			opacity: alpha,
			originX: progressPercentage,
			originY: progressPercentage,
			originZ: px,
			zIndex: int,
			fillOpacity: alpha,
			strokeOpacity: alpha,
			numOctaves: int
		};
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/value/types/maps/defaults.mjs
		/**
		* A map of default value types for common values
		*/
		const defaultValueTypes = {
			...numberValueTypes,
			color,
			backgroundColor: color,
			outlineColor: color,
			fill: color,
			stroke: color,
			borderColor: color,
			borderTopColor: color,
			borderRightColor: color,
			borderBottomColor: color,
			borderLeftColor: color,
			filter,
			WebkitFilter: filter,
			mask,
			WebkitMask: mask
		};
		/**
		* Gets the default ValueType for the provided value key
		*/
		const getDefaultValueType = (key) => defaultValueTypes[key];
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/value/types/utils/animatable-none.mjs
		const customTypes = /*@__PURE__*/ new Set([filter, mask]);
		function getAnimatableNone(key, value) {
			let defaultValueType = getDefaultValueType(key);
			if (!customTypes.has(defaultValueType)) defaultValueType = complex;
			return defaultValueType.getAnimatableNone ? defaultValueType.getAnimatableNone(value) : void 0;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/animation/keyframes/utils/make-none-animatable.mjs
		/**
		* If we encounter keyframes like "none" or "0" and we also have keyframes like
		* "#fff" or "200px 200px" we want to find a keyframe to serve as a template for
		* the "none" keyframes. In this case "#fff" or "200px 200px" - then these get turned into
		* zero equivalents, i.e. "#fff0" or "0px 0px".
		*/
		const invalidTemplates = /* @__PURE__ */ new Set([
			"auto",
			"none",
			"0"
		]);
		function makeNoneKeyframesAnimatable(unresolvedKeyframes, noneKeyframeIndexes, name) {
			let i = 0;
			let animatableTemplate = void 0;
			while (i < unresolvedKeyframes.length && !animatableTemplate) {
				const keyframe = unresolvedKeyframes[i];
				if (typeof keyframe === "string" && !invalidTemplates.has(keyframe) && analyseComplexValue(keyframe).values.length) animatableTemplate = unresolvedKeyframes[i];
				i++;
			}
			if (animatableTemplate && name) for (const noneIndex of noneKeyframeIndexes) unresolvedKeyframes[noneIndex] = getAnimatableNone(name, animatableTemplate);
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/animation/keyframes/DOMKeyframesResolver.mjs
		var DOMKeyframesResolver = class extends KeyframeResolver {
			constructor(unresolvedKeyframes, onComplete, name, motionValue, element) {
				super(unresolvedKeyframes, onComplete, name, motionValue, element, true);
			}
			readKeyframes() {
				const { unresolvedKeyframes, element, name } = this;
				if (!element || !element.current) return;
				super.readKeyframes();
				/**
				* If any keyframe is a CSS variable, we need to find its value by sampling the element
				*/
				for (let i = 0; i < unresolvedKeyframes.length; i++) {
					let keyframe = unresolvedKeyframes[i];
					if (typeof keyframe === "string") {
						keyframe = keyframe.trim();
						if (isCSSVariableToken(keyframe)) {
							const resolved = getVariableValue(keyframe, element.current);
							if (resolved !== void 0) unresolvedKeyframes[i] = resolved;
							if (i === unresolvedKeyframes.length - 1) this.finalKeyframe = keyframe;
						}
					}
				}
				/**
				* Resolve "none" values. We do this potentially twice - once before and once after measuring keyframes.
				* This could be seen as inefficient but it's a trade-off to avoid measurements in more situations, which
				* have a far bigger performance impact.
				*/
				this.resolveNoneKeyframes();
				/**
				* Check to see if unit type has changed. If so schedule jobs that will
				* temporarily set styles to the destination keyframes.
				* Skip if we have more than two keyframes or this isn't a positional value.
				* TODO: We can throw if there are multiple keyframes and the value type changes.
				*/
				if (!positionalKeys.has(name) || unresolvedKeyframes.length !== 2) return;
				const [origin, target] = unresolvedKeyframes;
				const originType = findDimensionValueType(origin);
				const targetType = findDimensionValueType(target);
				if (containsCSSVariable(origin) !== containsCSSVariable(target) && positionalValues[name]) {
					this.needsMeasurement = true;
					return;
				}
				/**
				* Either we don't recognise these value types or we can animate between them.
				*/
				if (originType === targetType) return;
				/**
				* If both values are numbers or pixels, we can animate between them by
				* converting them to numbers.
				*/
				if (isNumOrPxType(originType) && isNumOrPxType(targetType)) for (let i = 0; i < unresolvedKeyframes.length; i++) {
					const value = unresolvedKeyframes[i];
					if (typeof value === "string") unresolvedKeyframes[i] = parseFloat(value);
				}
				else if (positionalValues[name])
 /**
				* Else, the only way to resolve this is by measuring the element.
				*/
				this.needsMeasurement = true;
			}
			resolveNoneKeyframes() {
				const { unresolvedKeyframes, name } = this;
				const noneKeyframeIndexes = [];
				for (let i = 0; i < unresolvedKeyframes.length; i++) if (unresolvedKeyframes[i] === null || isNone(unresolvedKeyframes[i])) noneKeyframeIndexes.push(i);
				if (noneKeyframeIndexes.length) makeNoneKeyframesAnimatable(unresolvedKeyframes, noneKeyframeIndexes, name);
			}
			measureInitialState() {
				const { element, unresolvedKeyframes, name } = this;
				if (!element || !element.current) return;
				if (name === "height") this.suspendedScrollY = window.pageYOffset;
				this.measuredOrigin = positionalValues[name](element.measureViewportBox(), window.getComputedStyle(element.current));
				unresolvedKeyframes[0] = this.measuredOrigin;
				const measureKeyframe = unresolvedKeyframes[unresolvedKeyframes.length - 1];
				if (measureKeyframe !== void 0) element.getValue(name, measureKeyframe).jump(measureKeyframe, false);
			}
			measureEndState() {
				const { element, name, unresolvedKeyframes } = this;
				if (!element || !element.current) return;
				const value = element.getValue(name);
				value && value.jump(this.measuredOrigin, false);
				const finalKeyframeIndex = unresolvedKeyframes.length - 1;
				const finalKeyframe = unresolvedKeyframes[finalKeyframeIndex];
				unresolvedKeyframes[finalKeyframeIndex] = positionalValues[name](element.measureViewportBox(), window.getComputedStyle(element.current));
				if (finalKeyframe !== null && this.finalKeyframe === void 0) this.finalKeyframe = finalKeyframe;
				if (this.removedTransforms?.length) this.removedTransforms.forEach(([unsetTransformName, unsetTransformValue]) => {
					element.getValue(unsetTransformName).set(unsetTransformValue);
				});
				this.resolveNoneKeyframes();
			}
		};
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/utils/border-radius.mjs
		/**
		* The four corner-radius longhands. Shared so the projection mixer, scale
		* corrector, WAAPI px-value set and view-transition crop pass don't each carry
		* their own copy. Order is irrelevant - every consumer mixes/corrects/animates
		* each corner independently.
		*/
		const cornerRadiusProps = [
			"borderTopLeftRadius",
			"borderTopRightRadius",
			"borderBottomRightRadius",
			"borderBottomLeftRadius"
		];
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/utils/resolve-elements.mjs
		function resolveElements(elementOrSelector, scope, selectorCache) {
			if (elementOrSelector == null) return [];
			if (elementOrSelector instanceof EventTarget) return [elementOrSelector];
			else if (typeof elementOrSelector === "string") {
				let root = document;
				if (scope) root = scope.current;
				const elements = selectorCache?.[elementOrSelector] ?? root.querySelectorAll(elementOrSelector);
				return elements ? Array.from(elements) : [];
			}
			return Array.from(elementOrSelector).filter((element) => element != null);
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/value/types/utils/get-as-type.mjs
		/**
		* Provided a value and a ValueType, returns the value as that value type.
		*/
		const getValueAsType = (value, type) => {
			return type && typeof value === "number" ? type.transform(value) : value;
		};
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/utils/is-html-element.mjs
		/**
		* Checks if an element is an HTML element in a way
		* that works across iframes
		*/
		function isHTMLElement(element) {
			return isObject(element) && "offsetHeight" in element && !("ownerSVGElement" in element);
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/frameloop/microtask.mjs
		const { schedule: microtask, cancel: cancelMicrotask } = /* @__PURE__ */ createRenderBatcher(queueMicrotask, false);
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/gestures/drag/state/is-active.mjs
		const isDragging = {
			x: false,
			y: false
		};
		function isDragActive() {
			return isDragging.x || isDragging.y;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/gestures/drag/state/set-active.mjs
		function setDragLock(axis) {
			if (axis === "x" || axis === "y") if (isDragging[axis]) return null;
			else {
				isDragging[axis] = true;
				return () => {
					isDragging[axis] = false;
				};
			}
			else if (isDragging.x || isDragging.y) return null;
			else {
				isDragging.x = isDragging.y = true;
				return () => {
					isDragging.x = isDragging.y = false;
				};
			}
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/gestures/utils/setup.mjs
		function setupGesture(elementOrSelector, options) {
			const elements = resolveElements(elementOrSelector);
			const gestureAbortController = new AbortController();
			const eventOptions = {
				passive: true,
				...options,
				signal: gestureAbortController.signal
			};
			const cancel = () => gestureAbortController.abort();
			return [
				elements,
				eventOptions,
				cancel
			];
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/gestures/hover.mjs
		function isValidHover(event) {
			return !(event.pointerType === "touch" || isDragActive());
		}
		/**
		* Create a hover gesture. hover() is different to .addEventListener("pointerenter")
		* in that it has an easier syntax, filters out polyfilled touch events, interoperates
		* with drag gestures, and automatically removes the "pointerennd" event listener when the hover ends.
		*
		* @public
		*/
		function hover(elementOrSelector, onHoverStart, options = {}) {
			const [elements, eventOptions, cancel] = setupGesture(elementOrSelector, options);
			elements.forEach((element) => {
				let isPressed = false;
				let deferredHoverEnd = false;
				let hoverEndCallback;
				const removePointerLeave = () => {
					element.removeEventListener("pointerleave", onPointerLeave);
				};
				const endHover = (event) => {
					if (hoverEndCallback) {
						hoverEndCallback(event);
						hoverEndCallback = void 0;
					}
					removePointerLeave();
				};
				const onPointerUp = (event) => {
					isPressed = false;
					window.removeEventListener("pointerup", onPointerUp);
					window.removeEventListener("pointercancel", onPointerUp);
					if (deferredHoverEnd) {
						deferredHoverEnd = false;
						endHover(event);
					}
				};
				const onPointerDown = () => {
					isPressed = true;
					window.addEventListener("pointerup", onPointerUp, eventOptions);
					window.addEventListener("pointercancel", onPointerUp, eventOptions);
				};
				const onPointerLeave = (leaveEvent) => {
					if (leaveEvent.pointerType === "touch") return;
					if (isPressed) {
						deferredHoverEnd = true;
						return;
					}
					endHover(leaveEvent);
				};
				const onPointerEnter = (enterEvent) => {
					if (!isValidHover(enterEvent)) return;
					deferredHoverEnd = false;
					const onHoverEnd = onHoverStart(element, enterEvent);
					if (typeof onHoverEnd !== "function") return;
					hoverEndCallback = onHoverEnd;
					element.addEventListener("pointerleave", onPointerLeave, eventOptions);
				};
				element.addEventListener("pointerenter", onPointerEnter, eventOptions);
				element.addEventListener("pointerdown", onPointerDown, eventOptions);
			});
			return cancel;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/gestures/utils/is-node-or-child.mjs
		/**
		* Recursively traverse up the tree to check whether the provided child node
		* is the parent or a descendant of it.
		*
		* @param parent - Element to find
		* @param child - Element to test against parent
		*/
		const isNodeOrChild = (parent, child) => {
			if (!child) return false;
			else if (parent === child) return true;
			else return isNodeOrChild(parent, child.parentElement);
		};
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/gestures/utils/is-primary-pointer.mjs
		const isPrimaryPointer = (event) => {
			if (event.pointerType === "mouse") return typeof event.button !== "number" || event.button <= 0;
			else
 /**
			* isPrimary is true for all mice buttons, whereas every touch point
			* is regarded as its own input. So subsequent concurrent touch points
			* will be false.
			*
			* Specifically match against false here as incomplete versions of
			* PointerEvents in very old browser might have it set as undefined.
			*/
			return event.isPrimary !== false;
		};
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/gestures/press/utils/is-keyboard-accessible.mjs
		const keyboardAccessibleElements = /* @__PURE__ */ new Set([
			"BUTTON",
			"INPUT",
			"SELECT",
			"TEXTAREA",
			"A"
		]);
		/**
		* Checks if an element is natively keyboard accessible (focusable).
		* Used by the press gesture to determine if we need to add tabIndex.
		*/
		function isElementKeyboardAccessible(element) {
			return keyboardAccessibleElements.has(element.tagName) || element.isContentEditable === true;
		}
		const textInputElements = /* @__PURE__ */ new Set([
			"INPUT",
			"SELECT",
			"TEXTAREA"
		]);
		/**
		* Checks if an element has text selection or direct interaction behavior
		* that should block drag gestures from starting.
		*
		* This specifically targets form controls where the user might want to select
		* text or interact with the control (e.g., sliders, dropdowns).
		*
		* Buttons and links are NOT included because they don't have click-and-move
		* actions of their own - they only respond to click events, so dragging
		* should still work when initiated from these elements.
		*/
		function isElementTextInput(element) {
			return textInputElements.has(element.tagName) || element.isContentEditable === true;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/gestures/press/utils/state.mjs
		const isPressing = /* @__PURE__ */ new WeakSet();
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/gestures/press/utils/keyboard.mjs
		/**
		* Filter out events that are not "Enter" keys.
		*/
		function filterEvents(callback) {
			return (event) => {
				if (event.key !== "Enter") return;
				callback(event);
			};
		}
		function firePointerEvent(target, type) {
			target.dispatchEvent(new PointerEvent("pointer" + type, {
				isPrimary: true,
				bubbles: true
			}));
		}
		const enableKeyboardPress = (focusEvent, eventOptions) => {
			const element = focusEvent.currentTarget;
			if (!element) return;
			const handleKeydown = filterEvents(() => {
				if (isPressing.has(element)) return;
				firePointerEvent(element, "down");
				const handleKeyup = filterEvents(() => {
					firePointerEvent(element, "up");
				});
				const handleBlur = () => firePointerEvent(element, "cancel");
				element.addEventListener("keyup", handleKeyup, eventOptions);
				element.addEventListener("blur", handleBlur, eventOptions);
			});
			element.addEventListener("keydown", handleKeydown, eventOptions);
			/**
			* Add an event listener that fires on blur to remove the keydown events.
			*/
			element.addEventListener("blur", () => element.removeEventListener("keydown", handleKeydown), eventOptions);
		};
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/gestures/press/index.mjs
		/**
		* Filter out events that are not primary pointer events, or are triggering
		* while a Motion gesture is active.
		*/
		function isValidPressEvent(event) {
			return isPrimaryPointer(event) && !isDragActive();
		}
		const claimedPointerDownEvents = /* @__PURE__ */ new WeakSet();
		/**
		* Create a press gesture.
		*
		* Press is different to `"pointerdown"`, `"pointerup"` in that it
		* automatically filters out secondary pointer events like right
		* click and multitouch.
		*
		* It also adds accessibility support for keyboards, where
		* an element with a press gesture will receive focus and
		*  trigger on Enter `"keydown"` and `"keyup"` events.
		*
		* This is different to a browser's `"click"` event, which does
		* respond to keyboards but only for the `"click"` itself, rather
		* than the press start and end/cancel. The element also needs
		* to be focusable for this to work, whereas a press gesture will
		* make an element focusable by default.
		*
		* @public
		*/
		function press(targetOrSelector, onPressStart, options = {}) {
			const [targets, eventOptions, cancelEvents] = setupGesture(targetOrSelector, options);
			const startPress = (startEvent) => {
				const target = startEvent.currentTarget;
				if (!isValidPressEvent(startEvent)) return;
				if (claimedPointerDownEvents.has(startEvent)) return;
				isPressing.add(target);
				if (options.stopPropagation) claimedPointerDownEvents.add(startEvent);
				const onPressEnd = onPressStart(target, startEvent);
				/**
				* End listeners run in the capture phase so a descendant calling
				* stopPropagation() in its own pointerup handler can't prevent the
				* press gesture from ending. This also keeps the gesture-end
				* ordering consistent with the drag gesture. See #2794.
				*/
				const endEventOptions = {
					...eventOptions,
					capture: true
				};
				const onPointerEnd = (endEvent, success) => {
					window.removeEventListener("pointerup", onPointerUp, endEventOptions);
					window.removeEventListener("pointercancel", onPointerCancel, endEventOptions);
					if (isPressing.has(target)) isPressing.delete(target);
					if (!isValidPressEvent(endEvent)) return;
					if (typeof onPressEnd === "function") onPressEnd(endEvent, { success });
				};
				const onPointerUp = (upEvent) => {
					onPointerEnd(upEvent, target === window || target === document || options.useGlobalTarget || isNodeOrChild(target, upEvent.target));
				};
				const onPointerCancel = (cancelEvent) => {
					onPointerEnd(cancelEvent, false);
				};
				window.addEventListener("pointerup", onPointerUp, endEventOptions);
				window.addEventListener("pointercancel", onPointerCancel, endEventOptions);
			};
			targets.forEach((target) => {
				(options.useGlobalTarget ? window : target).addEventListener("pointerdown", startPress, eventOptions);
				if (isHTMLElement(target)) {
					target.addEventListener("focus", (event) => enableKeyboardPress(event, eventOptions));
					if (!isElementKeyboardAccessible(target) && !target.hasAttribute("tabindex")) target.tabIndex = 0;
				}
			});
			return cancelEvents;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/utils/is-svg-element.mjs
		/**
		* Checks if an element is an SVG element in a way
		* that works across iframes
		*/
		function isSVGElement(element) {
			return isObject(element) && "ownerSVGElement" in element;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/resize/handle-element.mjs
		const resizeHandlers = /* @__PURE__ */ new WeakMap();
		let observer;
		const getSize = (borderBoxAxis, svgAxis, htmlAxis) => (target, borderBoxSize) => {
			if (borderBoxSize && borderBoxSize[0]) return borderBoxSize[0][borderBoxAxis + "Size"];
			else if (isSVGElement(target) && "getBBox" in target) return target.getBBox()[svgAxis];
			else return target[htmlAxis];
		};
		const getWidth = /*@__PURE__*/ getSize("inline", "width", "offsetWidth");
		const getHeight = /*@__PURE__*/ getSize("block", "height", "offsetHeight");
		function notifyTarget({ target, borderBoxSize }) {
			resizeHandlers.get(target)?.forEach((handler) => {
				handler(target, {
					get width() {
						return getWidth(target, borderBoxSize);
					},
					get height() {
						return getHeight(target, borderBoxSize);
					}
				});
			});
		}
		function notifyAll(entries) {
			entries.forEach(notifyTarget);
		}
		function createResizeObserver() {
			if (typeof ResizeObserver === "undefined") return;
			observer = new ResizeObserver(notifyAll);
		}
		function resizeElement(target, handler) {
			if (!observer) createResizeObserver();
			const elements = resolveElements(target);
			elements.forEach((element) => {
				let elementHandlers = resizeHandlers.get(element);
				if (!elementHandlers) {
					elementHandlers = /* @__PURE__ */ new Set();
					resizeHandlers.set(element, elementHandlers);
				}
				elementHandlers.add(handler);
				observer?.observe(element);
			});
			return () => {
				elements.forEach((element) => {
					const elementHandlers = resizeHandlers.get(element);
					elementHandlers?.delete(handler);
					if (!elementHandlers?.size) observer?.unobserve(element);
				});
			};
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/resize/handle-window.mjs
		const windowCallbacks = /* @__PURE__ */ new Set();
		let windowResizeHandler;
		function createWindowResizeHandler() {
			windowResizeHandler = () => {
				const info = {
					get width() {
						return window.innerWidth;
					},
					get height() {
						return window.innerHeight;
					}
				};
				windowCallbacks.forEach((callback) => callback(info));
			};
			window.addEventListener("resize", windowResizeHandler);
		}
		function resizeWindow(callback) {
			windowCallbacks.add(callback);
			if (!windowResizeHandler) createWindowResizeHandler();
			return () => {
				windowCallbacks.delete(callback);
				if (!windowCallbacks.size && typeof windowResizeHandler === "function") {
					window.removeEventListener("resize", windowResizeHandler);
					windowResizeHandler = void 0;
				}
			};
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/resize/index.mjs
		function resize(a, b) {
			return typeof a === "function" ? resizeWindow(a) : resizeElement(a, b);
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/stats/buffer.mjs
		const statsBuffer = {
			value: null,
			addProjectionMetrics: null
		};
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/utils/is-svg-svg-element.mjs
		/**
		* Checks if an element is specifically an SVGSVGElement (the root SVG element)
		* in a way that works across iframes
		*/
		function isSVGSVGElement(element) {
			return isSVGElement(element) && element.tagName === "svg";
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/utils/transform.mjs
		function transform(...args) {
			const useImmediate = !Array.isArray(args[0]);
			const argOffset = useImmediate ? 0 : -1;
			const inputValue = args[0 + argOffset];
			const inputRange = args[1 + argOffset];
			const outputRange = args[2 + argOffset];
			const options = args[3 + argOffset];
			const interpolator = interpolate(inputRange, outputRange, options);
			return useImmediate ? interpolator(inputValue) : interpolator;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/value/types/utils/find.mjs
		/**
		* A list of all ValueTypes
		*/
		const valueTypes = [
			...dimensionValueTypes,
			color,
			complex
		];
		/**
		* Tests a value against the list of ValueTypes
		*/
		const findValueType = (v) => valueTypes.find(testValueType(v));
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/projection/geometry/models.mjs
		const createAxisDelta = () => ({
			translate: 0,
			scale: 1,
			origin: 0,
			originPoint: 0
		});
		const createDelta = () => ({
			x: createAxisDelta(),
			y: createAxisDelta()
		});
		const createAxis = () => ({
			min: 0,
			max: 0
		});
		const createBox = () => ({
			x: createAxis(),
			y: createAxis()
		});
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/render/store.mjs
		const visualElementStore = /* @__PURE__ */ new WeakMap();
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/render/utils/is-animation-controls.mjs
		function isAnimationControls(v) {
			return v !== null && typeof v === "object" && typeof v.start === "function";
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/render/utils/is-variant-label.mjs
		/**
		* Decides if the supplied variable is variant label
		*/
		function isVariantLabel(v) {
			return typeof v === "string" || Array.isArray(v);
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/render/utils/variant-props.mjs
		const variantPriorityOrder = [
			"animate",
			"whileInView",
			"whileFocus",
			"whileHover",
			"whileTap",
			"whileDrag",
			"exit"
		];
		const variantProps = ["initial", ...variantPriorityOrder];
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/render/utils/is-controlling-variants.mjs
		function isControllingVariants(props) {
			return isAnimationControls(props.animate) || variantProps.some((name) => isVariantLabel(props[name]));
		}
		function isVariantNode(props) {
			return Boolean(isControllingVariants(props) || props.variants);
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/render/utils/motion-values.mjs
		/**
		* Updates motion values from props changes.
		* Uses `any` type for element to avoid circular dependencies with VisualElement.
		*/
		function updateMotionValuesFromProps(element, next, prev) {
			for (const key in next) {
				const nextValue = next[key];
				const prevValue = prev[key];
				if (isMotionValue(nextValue))
 /**
				* If this is a motion value found in props or style, we want to add it
				* to our visual element's motion value map.
				*/
				element.addValue(key, nextValue);
				else if (isMotionValue(prevValue))
 /**
				* If we're swapping from a motion value to a static value,
				* create a new motion value from that
				*/
				element.addValue(key, motionValue(nextValue, { owner: element }));
				else if (prevValue !== nextValue)
 /**
				* If this is a flat value that has changed, update the motion value
				* or create one if it doesn't exist. We only want to do this if we're
				* not handling the value with our animation state.
				*/
				if (element.hasValue(key)) {
					const existingValue = element.getValue(key);
					if (existingValue.liveStyle === true) existingValue.jump(nextValue);
					else if (!existingValue.hasAnimated) existingValue.set(nextValue);
				} else {
					const latestValue = element.getStaticValue(key);
					element.addValue(key, motionValue(latestValue !== void 0 ? latestValue : nextValue, { owner: element }));
				}
			}
			for (const key in prev) if (next[key] === void 0) element.removeValue(key);
			return next;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/render/utils/reduced-motion/state.mjs
		const prefersReducedMotion = { current: null };
		const hasReducedMotionListener = { current: false };
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/render/utils/reduced-motion/index.mjs
		const isBrowser = typeof window !== "undefined";
		function initPrefersReducedMotion() {
			hasReducedMotionListener.current = true;
			if (!isBrowser) return;
			if (window.matchMedia) {
				const motionMediaQuery = window.matchMedia("(prefers-reduced-motion)");
				const setReducedMotionPreferences = () => prefersReducedMotion.current = motionMediaQuery.matches;
				motionMediaQuery.addEventListener("change", setReducedMotionPreferences);
				setReducedMotionPreferences();
			} else prefersReducedMotion.current = false;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/render/VisualElement.mjs
		const propEventHandlers = [
			"AnimationStart",
			"AnimationComplete",
			"Update",
			"BeforeLayoutMeasure",
			"LayoutMeasure",
			"LayoutAnimationStart",
			"LayoutAnimationComplete"
		];
		/**
		* Static feature definitions - can be injected by framework layer
		*/
		let featureDefinitions = {};
		/**
		* Set feature definitions for all VisualElements.
		* This should be called by the framework layer (e.g., framer-motion) during initialization.
		*/
		function setFeatureDefinitions(definitions) {
			featureDefinitions = definitions;
		}
		/**
		* Get the current feature definitions
		*/
		function getFeatureDefinitions() {
			return featureDefinitions;
		}
		/**
		* A VisualElement is an imperative abstraction around UI elements such as
		* HTMLElement, SVGElement, Three.Object3D etc.
		*/
		var VisualElement = class {
			/**
			* This method takes React props and returns found MotionValues. For example, HTML
			* MotionValues will be found within the style prop, whereas for Three.js within attribute arrays.
			*
			* This isn't an abstract method as it needs calling in the constructor, but it is
			* intended to be one.
			*/
			scrapeMotionValuesFromProps(_props, _prevProps, _visualElement) {
				return {};
			}
			constructor({ parent, props, presenceContext, reducedMotionConfig, skipAnimations, blockInitialAnimation, visualState }, options = {}) {
				/**
				* A reference to the current underlying Instance, e.g. a HTMLElement
				* or Three.Mesh etc.
				*/
				this.current = null;
				/**
				* A set containing references to this VisualElement's children.
				*/
				this.children = /* @__PURE__ */ new Set();
				/**
				* Determine what role this visual element should take in the variant tree.
				*/
				this.isVariantNode = false;
				this.isControllingVariants = false;
				/**
				* Decides whether this VisualElement should animate in reduced motion
				* mode.
				*
				* TODO: This is currently set on every individual VisualElement but feels
				* like it could be set globally.
				*/
				this.shouldReduceMotion = null;
				/**
				* Decides whether animations should be skipped for this VisualElement.
				* Useful for E2E tests and visual regression testing.
				*/
				this.shouldSkipAnimations = false;
				/**
				* A map of all motion values attached to this visual element. Motion
				* values are source of truth for any given animated value. A motion
				* value might be provided externally by the component via props.
				*/
				this.values = /* @__PURE__ */ new Map();
				this.KeyframeResolver = KeyframeResolver;
				/**
				* Cleanup functions for active features (hover/tap/exit etc)
				*/
				this.features = {};
				/**
				* A map of every subscription that binds the provided or generated
				* motion values onChange listeners to this visual element.
				*/
				this.valueSubscriptions = /* @__PURE__ */ new Map();
				/**
				* A reference to the previously-provided motion values as returned
				* from scrapeMotionValuesFromProps. We use the keys in here to determine
				* if any motion values need to be removed after props are updated.
				*/
				this.prevMotionValues = {};
				/**
				* Track whether this element has been mounted before, to detect
				* remounts after Suspense unmount/remount cycles.
				*/
				this.hasBeenMounted = false;
				/**
				* An object containing a SubscriptionManager for each active event.
				*/
				this.events = {};
				/**
				* An object containing an unsubscribe function for each prop event subscription.
				* For example, every "Update" event can have multiple subscribers via
				* VisualElement.on(), but only one of those can be defined via the onUpdate prop.
				*/
				this.propEventSubscriptions = {};
				this.notifyUpdate = () => this.notify("Update", this.latestValues);
				this.render = () => {
					if (!this.current) return;
					this.triggerBuild();
					this.renderInstance(this.current, this.renderState, this.props.style, this.projection);
				};
				this.renderScheduledAt = 0;
				this.scheduleRender = () => {
					const now = time.now();
					if (this.renderScheduledAt < now) {
						this.renderScheduledAt = now;
						frame.render(this.render, false, true);
					}
				};
				const { latestValues, renderState } = visualState;
				this.latestValues = latestValues;
				this.baseTarget = { ...latestValues };
				this.initialValues = props.initial ? { ...latestValues } : {};
				this.renderState = renderState;
				this.parent = parent;
				this.props = props;
				this.presenceContext = presenceContext;
				this.depth = parent ? parent.depth + 1 : 0;
				this.reducedMotionConfig = reducedMotionConfig;
				this.skipAnimationsConfig = skipAnimations;
				this.options = options;
				this.blockInitialAnimation = Boolean(blockInitialAnimation);
				this.isControllingVariants = isControllingVariants(props);
				this.isVariantNode = isVariantNode(props);
				if (this.isVariantNode) this.variantChildren = /* @__PURE__ */ new Set();
				this.manuallyAnimateOnMount = Boolean(parent && parent.current);
				/**
				* Any motion values that are provided to the element when created
				* aren't yet bound to the element, as this would technically be impure.
				* However, we iterate through the motion values and set them to the
				* initial values for this component.
				*
				* TODO: This is impure and we should look at changing this to run on mount.
				* Doing so will break some tests but this isn't necessarily a breaking change,
				* more a reflection of the test.
				*/
				const { willChange, ...initialMotionValues } = this.scrapeMotionValuesFromProps(props, {}, this);
				for (const key in initialMotionValues) {
					const value = initialMotionValues[key];
					if (latestValues[key] !== void 0 && isMotionValue(value)) value.set(latestValues[key]);
				}
			}
			mount(instance) {
				/**
				* If this element has been mounted before (e.g. after a Suspense
				* unmount/remount), reset motion values to their initial state
				* so animations replay correctly from initial → animate.
				*/
				if (this.hasBeenMounted) for (const key in this.initialValues) {
					this.values.get(key)?.jump(this.initialValues[key]);
					this.latestValues[key] = this.initialValues[key];
				}
				this.current = instance;
				visualElementStore.set(instance, this);
				if (this.projection && !this.projection.instance) this.projection.mount(instance);
				if (this.parent && this.isVariantNode && !this.isControllingVariants) this.removeFromVariantTree = this.parent.addVariantChild(this);
				this.values.forEach((value, key) => this.bindToMotionValue(key, value));
				/**
				* Determine reduced motion preference. Only initialize the matchMedia
				* listener if we actually need the dynamic value (i.e., when config
				* is neither "never" nor "always").
				*/
				if (this.reducedMotionConfig === "never") this.shouldReduceMotion = false;
				else if (this.reducedMotionConfig === "always") this.shouldReduceMotion = true;
				else {
					if (!hasReducedMotionListener.current) initPrefersReducedMotion();
					this.shouldReduceMotion = prefersReducedMotion.current;
				}
				/**
				* Set whether animations should be skipped based on the config.
				*/
				this.shouldSkipAnimations = this.skipAnimationsConfig ?? false;
				this.parent?.addChild(this);
				this.update(this.props, this.presenceContext);
				this.hasBeenMounted = true;
			}
			unmount() {
				this.projection && this.projection.unmount();
				cancelFrame(this.notifyUpdate);
				cancelFrame(this.render);
				this.valueSubscriptions.forEach((remove) => remove());
				this.valueSubscriptions.clear();
				this.removeFromVariantTree && this.removeFromVariantTree();
				this.parent?.removeChild(this);
				for (const key in this.events) this.events[key].clear();
				for (const key in this.features) {
					const feature = this.features[key];
					if (feature) {
						feature.unmount();
						feature.isMounted = false;
					}
				}
				this.current = null;
			}
			addChild(child) {
				this.children.add(child);
				this.enteringChildren ?? (this.enteringChildren = /* @__PURE__ */ new Set());
				this.enteringChildren.add(child);
			}
			removeChild(child) {
				this.children.delete(child);
				this.enteringChildren && this.enteringChildren.delete(child);
			}
			bindToMotionValue(key, value) {
				if (this.valueSubscriptions.has(key)) this.valueSubscriptions.get(key)();
				if (value.accelerate && acceleratedValues.has(key) && this.current instanceof HTMLElement) {
					const { factory, keyframes, times, ease, duration } = value.accelerate;
					const animation = new NativeAnimation({
						element: this.current,
						name: key,
						keyframes,
						times,
						ease,
						duration: /* @__PURE__ */ secondsToMilliseconds(duration)
					});
					const cleanup = factory(animation);
					this.valueSubscriptions.set(key, () => {
						cleanup();
						animation.cancel();
					});
					return;
				}
				const valueIsTransform = transformProps.has(key);
				if (valueIsTransform && this.onBindTransform) this.onBindTransform();
				const removeOnChange = value.on("change", (latestValue) => {
					this.latestValues[key] = latestValue;
					this.props.onUpdate && frame.preRender(this.notifyUpdate);
					if (valueIsTransform && this.projection) this.projection.isTransformDirty = true;
					this.scheduleRender();
				});
				let removeSyncCheck;
				if (typeof window !== "undefined" && window.MotionCheckAppearSync) removeSyncCheck = window.MotionCheckAppearSync(this, key, value);
				this.valueSubscriptions.set(key, () => {
					removeOnChange();
					if (removeSyncCheck) removeSyncCheck();
				});
			}
			sortNodePosition(other) {
				/**
				* If these nodes aren't even of the same type we can't compare their depth.
				*/
				if (!this.current || !this.sortInstanceNodePosition || this.type !== other.type) return 0;
				return this.sortInstanceNodePosition(this.current, other.current);
			}
			updateFeatures() {
				let key = "animation";
				for (key in featureDefinitions) {
					const featureDefinition = featureDefinitions[key];
					if (!featureDefinition) continue;
					const { isEnabled, Feature: FeatureConstructor } = featureDefinition;
					/**
					* If this feature is enabled but not active, make a new instance.
					*/
					if (!this.features[key] && FeatureConstructor && isEnabled(this.props)) this.features[key] = new FeatureConstructor(this);
					/**
					* If we have a feature, mount or update it.
					*/
					if (this.features[key]) {
						const feature = this.features[key];
						if (feature.isMounted) feature.update();
						else {
							feature.mount();
							feature.isMounted = true;
						}
					}
				}
			}
			triggerBuild() {
				this.build(this.renderState, this.latestValues, this.props);
			}
			/**
			* Measure the current viewport box with or without transforms.
			* Only measures axis-aligned boxes, rotate and skew must be manually
			* removed with a re-render to work.
			*/
			measureViewportBox() {
				return this.current ? this.measureInstanceViewportBox(this.current, this.props) : createBox();
			}
			getStaticValue(key) {
				return this.latestValues[key];
			}
			setStaticValue(key, value) {
				this.latestValues[key] = value;
			}
			/**
			* Update the provided props. Ensure any newly-added motion values are
			* added to our map, old ones removed, and listeners updated.
			*/
			update(props, presenceContext) {
				if (props.transformTemplate || this.props.transformTemplate) this.scheduleRender();
				this.prevProps = this.props;
				this.props = props;
				this.prevPresenceContext = this.presenceContext;
				this.presenceContext = presenceContext;
				/**
				* Update prop event handlers ie onAnimationStart, onAnimationComplete
				*/
				for (let i = 0; i < propEventHandlers.length; i++) {
					const key = propEventHandlers[i];
					if (this.propEventSubscriptions[key]) {
						this.propEventSubscriptions[key]();
						delete this.propEventSubscriptions[key];
					}
					const listener = props["on" + key];
					if (listener) this.propEventSubscriptions[key] = this.on(key, listener);
				}
				this.prevMotionValues = updateMotionValuesFromProps(this, this.scrapeMotionValuesFromProps(props, this.prevProps || {}, this), this.prevMotionValues);
				if (this.handleChildMotionValue) this.handleChildMotionValue();
			}
			getProps() {
				return this.props;
			}
			/**
			* Returns the variant definition with a given name.
			*/
			getVariant(name) {
				return this.props.variants ? this.props.variants[name] : void 0;
			}
			/**
			* Returns the defined default transition on this component.
			*/
			getDefaultTransition() {
				return this.props.transition;
			}
			getTransformPagePoint() {
				return this.props.transformPagePoint;
			}
			getClosestVariantNode() {
				return this.isVariantNode ? this : this.parent ? this.parent.getClosestVariantNode() : void 0;
			}
			/**
			* Add a child visual element to our set of children.
			*/
			addVariantChild(child) {
				const closestVariantNode = this.getClosestVariantNode();
				if (closestVariantNode) {
					closestVariantNode.variantChildren && closestVariantNode.variantChildren.add(child);
					return () => closestVariantNode.variantChildren.delete(child);
				}
			}
			/**
			* Add a motion value and bind it to this visual element.
			*/
			addValue(key, value) {
				const existingValue = this.values.get(key);
				if (value !== existingValue) {
					if (existingValue) this.removeValue(key);
					this.bindToMotionValue(key, value);
					this.values.set(key, value);
					this.latestValues[key] = value.get();
				}
			}
			/**
			* Remove a motion value and unbind any active subscriptions.
			*/
			removeValue(key) {
				this.values.delete(key);
				const unsubscribe = this.valueSubscriptions.get(key);
				if (unsubscribe) {
					unsubscribe();
					this.valueSubscriptions.delete(key);
				}
				delete this.latestValues[key];
				this.removeValueFromRenderState(key, this.renderState);
			}
			/**
			* Check whether we have a motion value for this key
			*/
			hasValue(key) {
				return this.values.has(key);
			}
			getValue(key, defaultValue) {
				if (this.props.values && this.props.values[key]) return this.props.values[key];
				let value = this.values.get(key);
				if (value === void 0 && defaultValue !== void 0) {
					value = motionValue(defaultValue === null ? void 0 : defaultValue, { owner: this });
					this.addValue(key, value);
				}
				return value;
			}
			/**
			* If we're trying to animate to a previously unencountered value,
			* we need to check for it in our state and as a last resort read it
			* directly from the instance (which might have performance implications).
			*/
			readValue(key, target) {
				let value = this.latestValues[key] !== void 0 || !this.current ? this.latestValues[key] : this.getBaseTargetFromProps(this.props, key) ?? this.readValueFromInstance(this.current, key, this.options);
				if (value !== void 0 && value !== null) {
					if (typeof value === "string" && (isNumericalString(value) || isZeroValueString(value))) value = parseFloat(value);
					else if (!findValueType(value) && complex.test(target)) value = getAnimatableNone(key, target);
					this.setBaseTarget(key, isMotionValue(value) ? value.get() : value);
				}
				return isMotionValue(value) ? value.get() : value;
			}
			/**
			* Set the base target to later animate back to. This is currently
			* only hydrated on creation and when we first read a value.
			*/
			setBaseTarget(key, value) {
				this.baseTarget[key] = value;
			}
			/**
			* Find the base target for a value thats been removed from all animation
			* props.
			*/
			getBaseTarget(key) {
				const { initial } = this.props;
				let valueFromInitial;
				if (typeof initial === "string" || typeof initial === "object") {
					const variant = resolveVariantFromProps(this.props, initial, this.presenceContext?.custom);
					if (variant) valueFromInitial = variant[key];
				}
				/**
				* If this value still exists in the current initial variant, read that.
				*/
				if (initial && valueFromInitial !== void 0) return valueFromInitial;
				/**
				* Alternatively, if this VisualElement config has defined a getBaseTarget
				* so we can read the value from an alternative source, try that.
				*/
				const target = this.getBaseTargetFromProps(this.props, key);
				if (target !== void 0 && !isMotionValue(target)) return target;
				/**
				* If the value was initially defined on initial, but it doesn't any more,
				* return undefined. Otherwise return the value as initially read from the DOM.
				*/
				return this.initialValues[key] !== void 0 && valueFromInitial === void 0 ? void 0 : this.baseTarget[key];
			}
			on(eventName, callback) {
				if (!this.events[eventName]) this.events[eventName] = new SubscriptionManager();
				return this.events[eventName].add(callback);
			}
			notify(eventName, ...args) {
				if (this.events[eventName]) this.events[eventName].notify(...args);
			}
			scheduleRenderMicrotask() {
				microtask.render(this.render);
			}
		};
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/render/dom/DOMVisualElement.mjs
		var DOMVisualElement = class extends VisualElement {
			constructor() {
				super(...arguments);
				this.KeyframeResolver = DOMKeyframesResolver;
			}
			sortInstanceNodePosition(a, b) {
				/**
				* compareDocumentPosition returns a bitmask, by using the bitwise &
				* we're returning true if 2 in that bitmask is set to true. 2 is set
				* to true if b preceeds a.
				*/
				return a.compareDocumentPosition(b) & 2 ? 1 : -1;
			}
			getBaseTargetFromProps(props, key) {
				const style = props.style;
				return style ? style[key] : void 0;
			}
			removeValueFromRenderState(key, { vars, style }) {
				delete vars[key];
				delete style[key];
			}
			handleChildMotionValue() {
				if (this.childSubscription) {
					this.childSubscription();
					delete this.childSubscription;
				}
				const { children } = this.props;
				if (isMotionValue(children)) this.childSubscription = children.on("change", (latest) => {
					if (this.current) this.current.textContent = `${latest}`;
				});
			}
		};
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/render/Feature.mjs
		/**
		* Feature base class for extending VisualElement functionality.
		* Features are plugins that can be mounted/unmounted to add behavior
		* like gestures, animations, or layout tracking.
		*/
		var Feature = class {
			constructor(node) {
				this.isMounted = false;
				this.node = node;
			}
			update() {}
		};
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/projection/geometry/conversion.mjs
		/**
		* Bounding boxes tend to be defined as top, left, right, bottom. For various operations
		* it's easier to consider each axis individually. This function returns a bounding box
		* as a map of single-axis min/max values.
		*/
		function convertBoundingBoxToBox({ top, left, right, bottom }) {
			return {
				x: {
					min: left,
					max: right
				},
				y: {
					min: top,
					max: bottom
				}
			};
		}
		function convertBoxToBoundingBox({ x, y }) {
			return {
				top: y.min,
				right: x.max,
				bottom: y.max,
				left: x.min
			};
		}
		/**
		* Applies a TransformPoint function to a bounding box. TransformPoint is usually a function
		* provided by Framer to allow measured points to be corrected for device scaling. This is used
		* when measuring DOM elements and DOM event points.
		*/
		function transformBoxPoints(point, transformPoint) {
			if (!transformPoint) return point;
			const topLeft = transformPoint({
				x: point.left,
				y: point.top
			});
			const bottomRight = transformPoint({
				x: point.right,
				y: point.bottom
			});
			return {
				top: topLeft.y,
				left: topLeft.x,
				bottom: bottomRight.y,
				right: bottomRight.x
			};
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/projection/utils/has-transform.mjs
		function isIdentityScale(scale) {
			return scale === void 0 || scale === 1;
		}
		function hasScale({ scale, scaleX, scaleY }) {
			return !isIdentityScale(scale) || !isIdentityScale(scaleX) || !isIdentityScale(scaleY);
		}
		function hasTransform(values) {
			return hasScale(values) || has2DTranslate(values) || values.z || values.rotate || values.rotateX || values.rotateY || values.skewX || values.skewY;
		}
		function has2DTranslate(values) {
			return is2DTranslate(values.x) || is2DTranslate(values.y);
		}
		function is2DTranslate(value) {
			return value && value !== "0%";
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/projection/geometry/delta-apply.mjs
		/**
		* Scales a point based on a factor and an originPoint
		*/
		function scalePoint(point, scale, originPoint) {
			return originPoint + scale * (point - originPoint);
		}
		/**
		* Applies a translate/scale delta to a point
		*/
		function applyPointDelta(point, translate, scale, originPoint, boxScale) {
			if (boxScale !== void 0) point = scalePoint(point, boxScale, originPoint);
			return scalePoint(point, scale, originPoint) + translate;
		}
		/**
		* Applies a translate/scale delta to an axis
		*/
		function applyAxisDelta(axis, translate = 0, scale = 1, originPoint, boxScale) {
			axis.min = applyPointDelta(axis.min, translate, scale, originPoint, boxScale);
			axis.max = applyPointDelta(axis.max, translate, scale, originPoint, boxScale);
		}
		/**
		* Applies a translate/scale delta to a box
		*/
		function applyBoxDelta(box, { x, y }) {
			applyAxisDelta(box.x, x.translate, x.scale, x.originPoint);
			applyAxisDelta(box.y, y.translate, y.scale, y.originPoint);
		}
		const TREE_SCALE_SNAP_MIN = .999999999999;
		const TREE_SCALE_SNAP_MAX = 1.0000000000001;
		/**
		* Apply a tree of deltas to a box. We do this to calculate the effect of all the transforms
		* in a tree upon our box before then calculating how to project it into our desired viewport-relative box
		*
		* This is the final nested loop within updateLayoutDelta for future refactoring
		*/
		function applyTreeDeltas(box, treeScale, treePath, isSharedTransition = false) {
			const treeLength = treePath.length;
			if (!treeLength) return;
			treeScale.x = treeScale.y = 1;
			let node;
			let delta;
			for (let i = 0; i < treeLength; i++) {
				node = treePath[i];
				delta = node.projectionDelta;
				/**
				* TODO: Prefer to remove this, but currently we have motion components with
				* display: contents in Framer.
				*/
				const { visualElement } = node.options;
				if (visualElement && visualElement.props.style && visualElement.props.style.display === "contents") continue;
				if (isSharedTransition && node.options.layoutScroll && node.scroll && node !== node.root) {
					translateAxis(box.x, -node.scroll.offset.x);
					translateAxis(box.y, -node.scroll.offset.y);
				}
				if (delta) {
					treeScale.x *= delta.x.scale;
					treeScale.y *= delta.y.scale;
					applyBoxDelta(box, delta);
				}
				if (isSharedTransition && hasTransform(node.latestValues)) transformBox(box, node.latestValues, node.layout?.layoutBox);
			}
			/**
			* Snap tree scale back to 1 if it's within a non-perceivable threshold.
			* This will help reduce useless scales getting rendered.
			*/
			if (treeScale.x < TREE_SCALE_SNAP_MAX && treeScale.x > TREE_SCALE_SNAP_MIN) treeScale.x = 1;
			if (treeScale.y < TREE_SCALE_SNAP_MAX && treeScale.y > TREE_SCALE_SNAP_MIN) treeScale.y = 1;
		}
		function translateAxis(axis, distance) {
			axis.min += distance;
			axis.max += distance;
		}
		/**
		* Apply a transform to an axis from the latest resolved motion values.
		* This function basically acts as a bridge between a flat motion value map
		* and applyAxisDelta
		*/
		function transformAxis(axis, axisTranslate, axisScale, boxScale, axisOrigin = .5) {
			applyAxisDelta(axis, axisTranslate, axisScale, mixNumber$1(axis.min, axis.max, axisOrigin), boxScale);
		}
		function resolveAxisTranslate(value, axis) {
			if (typeof value === "string") return parseFloat(value) / 100 * (axis.max - axis.min);
			return value;
		}
		/**
		* Apply a transform to a box from the latest resolved motion values.
		*/
		function transformBox(box, transform, sourceBox) {
			const resolveBox = sourceBox ?? box;
			transformAxis(box.x, resolveAxisTranslate(transform.x, resolveBox.x), transform.scaleX, transform.scale, transform.originX);
			transformAxis(box.y, resolveAxisTranslate(transform.y, resolveBox.y), transform.scaleY, transform.scale, transform.originY);
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/projection/utils/measure.mjs
		function measureViewportBox(instance, transformPoint) {
			return convertBoundingBoxToBox(transformBoxPoints(instance.getBoundingClientRect(), transformPoint));
		}
		function measurePageBox(element, rootProjectionNode, transformPagePoint) {
			const viewportBox = measureViewportBox(element, transformPagePoint);
			const { scroll } = rootProjectionNode;
			if (scroll) {
				translateAxis(viewportBox.x, scroll.offset.x);
				translateAxis(viewportBox.y, scroll.offset.y);
			}
			return viewportBox;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/render/html/utils/build-transform.mjs
		const translateAlias = {
			x: "translateX",
			y: "translateY",
			z: "translateZ",
			transformPerspective: "perspective"
		};
		const numTransforms = transformPropOrder.length;
		/**
		* Build a CSS transform style from individual x/y/scale etc properties.
		*
		* This outputs with a default order of transforms/scales/rotations, this can be customised by
		* providing a transformTemplate function.
		*/
		function buildTransform(latestValues, transform, transformTemplate) {
			let transformString = "";
			let transformIsDefault = true;
			/**
			* Loop over all possible transforms in order, adding the ones that
			* are present to the transform string.
			*/
			for (let i = 0; i < numTransforms; i++) {
				const key = transformPropOrder[i];
				const value = latestValues[key];
				if (value === void 0) continue;
				let valueIsDefault = true;
				if (typeof value === "number") valueIsDefault = value === (key.startsWith("scale") ? 1 : 0);
				else {
					const parsed = parseFloat(value);
					valueIsDefault = key.startsWith("scale") ? parsed === 1 : parsed === 0;
				}
				if (!valueIsDefault || transformTemplate) {
					const valueAsType = getValueAsType(value, numberValueTypes[key]);
					if (!valueIsDefault) {
						transformIsDefault = false;
						const transformName = translateAlias[key] || key;
						transformString += `${transformName}(${valueAsType}) `;
					}
					if (transformTemplate) transform[key] = valueAsType;
				}
			}
			const pathRotation = latestValues.pathRotation;
			if (pathRotation) {
				transformIsDefault = false;
				transformString += `rotate(${getValueAsType(pathRotation, numberValueTypes.pathRotation)}) `;
			}
			transformString = transformString.trim();
			if (transformTemplate) transformString = transformTemplate(transform, transformIsDefault ? "" : transformString);
			else if (transformIsDefault) transformString = "none";
			return transformString;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/render/html/utils/build-styles.mjs
		function buildHTMLStyles(state, latestValues, transformTemplate) {
			const { style, vars, transformOrigin } = state;
			let hasTransform = false;
			let hasTransformOrigin = false;
			/**
			* Loop over all our latest animated values and decide whether to handle them
			* as a style or CSS variable.
			*
			* Transforms and transform origins are kept separately for further processing.
			*/
			for (const key in latestValues) {
				const value = latestValues[key];
				if (transformProps.has(key)) {
					hasTransform = true;
					continue;
				} else if (isCSSVariableName(key)) {
					vars[key] = value;
					continue;
				} else {
					const valueAsType = getValueAsType(value, numberValueTypes[key]);
					if (key.startsWith("origin")) {
						hasTransformOrigin = true;
						transformOrigin[key] = valueAsType;
					} else style[key] = valueAsType;
				}
			}
			if (!latestValues.transform) {
				if (hasTransform || transformTemplate) style.transform = buildTransform(latestValues, state.transform, transformTemplate);
				else if (style.transform)
 /**
				* If we have previously created a transform but currently don't have any,
				* reset transform style to none.
				*/
				style.transform = "none";
			}
			/**
			* Build a transformOrigin style. Uses the same defaults as the browser for
			* undefined origins.
			*/
			if (hasTransformOrigin) {
				const { originX = "50%", originY = "50%", originZ = 0 } = transformOrigin;
				style.transformOrigin = `${originX} ${originY} ${originZ}`;
			}
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/render/html/utils/render.mjs
		function renderHTML(element, { style, vars }, styleProp, projection) {
			const elementStyle = element.style;
			let key;
			for (key in style) elementStyle[key] = style[key];
			projection?.applyProjectionStyles(elementStyle, styleProp);
			for (key in vars) elementStyle.setProperty(key, vars[key]);
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/projection/styles/scale-border-radius.mjs
		function pixelsToPercent(pixels, axis) {
			if (axis.max === axis.min) return 0;
			return pixels / (axis.max - axis.min) * 100;
		}
		/**
		* We always correct borderRadius as a percentage rather than pixels to reduce paints.
		* For example, if you are projecting a box that is 100px wide with a 10px borderRadius
		* into a box that is 200px wide with a 20px borderRadius, that is actually a 10%
		* borderRadius in both states. If we animate between the two in pixels that will trigger
		* a paint each time. If we animate between the two in percentage we'll avoid a paint.
		*/
		const correctBorderRadius = { correct: (latest, node) => {
			if (!node.target) return latest;
			/**
			* If latest is a string, if it's a percentage we can return immediately as it's
			* going to be stretched appropriately. Otherwise, if it's a pixel, convert it to a number.
			*/
			if (typeof latest === "string") if (px.test(latest)) latest = parseFloat(latest);
			else return latest;
			return `${pixelsToPercent(latest, node.target.x)}% ${pixelsToPercent(latest, node.target.y)}%`;
		} };
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/projection/styles/scale-box-shadow.mjs
		const correctBoxShadow = { correct: (latest, { treeScale, projectionDelta }) => {
			const original = latest;
			const shadow = complex.parse(latest);
			if (shadow.length > 5) return original;
			const template = complex.createTransformer(latest);
			const offset = typeof shadow[0] !== "number" ? 1 : 0;
			const xScale = projectionDelta.x.scale * treeScale.x;
			const yScale = projectionDelta.y.scale * treeScale.y;
			shadow[0 + offset] /= xScale;
			shadow[1 + offset] /= yScale;
			/**
			* Ideally we'd correct x and y scales individually, but because blur and
			* spread apply to both we have to take a scale average and apply that instead.
			* We could potentially improve the outcome of this by incorporating the ratio between
			* the two scales.
			*/
			const averageScale = mixNumber$1(xScale, yScale, .5);
			if (typeof shadow[2 + offset] === "number") shadow[2 + offset] /= averageScale;
			if (typeof shadow[3 + offset] === "number") shadow[3 + offset] /= averageScale;
			return template(shadow);
		} };
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/projection/styles/scale-correction.mjs
		const scaleCorrectors = {
			borderRadius: {
				...correctBorderRadius,
				applyTo: [...cornerRadiusProps]
			},
			borderTopLeftRadius: correctBorderRadius,
			borderTopRightRadius: correctBorderRadius,
			borderBottomLeftRadius: correctBorderRadius,
			borderBottomRightRadius: correctBorderRadius,
			boxShadow: correctBoxShadow
		};
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/render/utils/is-forced-motion-value.mjs
		function isForcedMotionValue(key, { layout, layoutId }) {
			return transformProps.has(key) || key.startsWith("origin") || (layout || layoutId !== void 0) && (!!scaleCorrectors[key] || key === "opacity");
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/render/html/utils/scrape-motion-values.mjs
		function scrapeMotionValuesFromProps$1(props, prevProps, visualElement) {
			const style = props.style;
			const prevStyle = prevProps?.style;
			const newValues = {};
			if (!style) return newValues;
			for (const key in style) if (isMotionValue(style[key]) || prevStyle && isMotionValue(prevStyle[key]) || isForcedMotionValue(key, props) || visualElement?.getValue(key)?.liveStyle !== void 0) newValues[key] = style[key];
			return newValues;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/render/html/HTMLVisualElement.mjs
		function getComputedStyle$1(element) {
			return window.getComputedStyle(element);
		}
		var HTMLVisualElement = class extends DOMVisualElement {
			constructor() {
				super(...arguments);
				this.type = "html";
				this.renderInstance = renderHTML;
			}
			mount(instance) {
				/**
				* If a custom component forwards its ref to something other than a
				* HTML/SVG element (a class instance, an imperative handle) there's
				* nothing for Motion to style, measure or attach gestures to. #2777
				*/
				Boolean(instance.style);
				super.mount(instance);
			}
			readValueFromInstance(instance, key) {
				if (transformProps.has(key)) return this.projection?.isProjecting ? defaultTransformValue(key) : readTransformValue(instance, key);
				else {
					const computedStyle = getComputedStyle$1(instance);
					const value = (isCSSVariableName(key) ? computedStyle.getPropertyValue(key) : computedStyle[key]) || 0;
					return typeof value === "string" ? value.trim() : value;
				}
			}
			measureInstanceViewportBox(instance, { transformPagePoint }) {
				return measureViewportBox(instance, transformPagePoint);
			}
			build(renderState, latestValues, props) {
				buildHTMLStyles(renderState, latestValues, props.transformTemplate);
			}
			scrapeMotionValuesFromProps(props, prevProps, visualElement) {
				return scrapeMotionValuesFromProps$1(props, prevProps, visualElement);
			}
		};
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/render/svg/utils/path.mjs
		const dashKeys = {
			offset: "stroke-dashoffset",
			array: "stroke-dasharray"
		};
		const camelKeys = {
			offset: "strokeDashoffset",
			array: "strokeDasharray"
		};
		/**
		* Build SVG path properties. Uses the path's measured length to convert
		* our custom pathLength, pathSpacing and pathOffset into stroke-dashoffset
		* and stroke-dasharray attributes.
		*
		* This function is mutative to reduce per-frame GC.
		*
		* Note: We use unitless values for stroke-dasharray and stroke-dashoffset
		* because Safari incorrectly scales px values when the page is zoomed.
		*/
		function buildSVGPath(attrs, length, spacing = 1, offset = 0, useDashCase = true) {
			attrs.pathLength = 1;
			const keys = useDashCase ? dashKeys : camelKeys;
			attrs[keys.offset] = `${-offset}`;
			attrs[keys.array] = `${length} ${spacing}`;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/render/svg/utils/build-attrs.mjs
		/**
		* CSS Motion Path properties that should remain as CSS styles on SVG elements.
		*/
		const cssMotionPathProperties = [
			"offsetDistance",
			"offsetPath",
			"offsetRotate",
			"offsetAnchor"
		];
		/**
		* Build SVG visual attributes, like cx and style.transform
		*/
		function buildSVGAttrs(state, { attrX, attrY, attrScale, pathLength, pathSpacing = 1, pathOffset = 0, ...latest }, isSVGTag, transformTemplate, styleProp) {
			buildHTMLStyles(state, latest, transformTemplate);
			/**
			* For svg tags we just want to make sure viewBox is animatable and treat all the styles
			* as normal HTML tags.
			*/
			if (isSVGTag) {
				if (state.style.viewBox) state.attrs.viewBox = state.style.viewBox;
				return;
			}
			state.attrs = state.style;
			state.style = {};
			const { attrs, style } = state;
			/**
			* However, we apply transforms as CSS transforms.
			* So if we detect a transform, transformOrigin we take it from attrs and copy it into style.
			*/
			if (attrs.transform) {
				style.transform = attrs.transform;
				delete attrs.transform;
			}
			if (style.transform || attrs.transformOrigin) {
				style.transformOrigin = attrs.transformOrigin ?? "50% 50%";
				delete attrs.transformOrigin;
			}
			if (style.transform) {
				/**
				* SVG's element transform-origin uses its own median as a reference.
				* Therefore, transformBox becomes a fill-box
				*/
				style.transformBox = styleProp?.transformBox ?? "fill-box";
				delete attrs.transformBox;
			}
			for (const key of cssMotionPathProperties) if (attrs[key] !== void 0) {
				style[key] = attrs[key];
				delete attrs[key];
			}
			if (attrX !== void 0) attrs.x = attrX;
			if (attrY !== void 0) attrs.y = attrY;
			if (attrScale !== void 0) attrs.scale = attrScale;
			if (pathLength !== void 0) buildSVGPath(attrs, pathLength, pathSpacing, pathOffset, false);
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/render/svg/utils/camel-case-attrs.mjs
		/**
		* A set of attribute names that are always read/written as camel case.
		*/
		const camelCaseAttributes = /* @__PURE__ */ new Set([
			"baseFrequency",
			"diffuseConstant",
			"kernelMatrix",
			"kernelUnitLength",
			"keySplines",
			"keyTimes",
			"limitingConeAngle",
			"markerHeight",
			"markerWidth",
			"numOctaves",
			"targetX",
			"targetY",
			"surfaceScale",
			"specularConstant",
			"specularExponent",
			"stdDeviation",
			"tableValues",
			"viewBox",
			"gradientTransform",
			"pathLength",
			"startOffset",
			"textLength",
			"lengthAdjust"
		]);
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/render/svg/utils/is-svg-tag.mjs
		const isSVGTag = (tag) => typeof tag === "string" && tag.toLowerCase() === "svg";
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/render/svg/utils/render.mjs
		function renderSVG(element, renderState, _styleProp, projection) {
			renderHTML(element, renderState, void 0, projection);
			for (const key in renderState.attrs) element.setAttribute(!camelCaseAttributes.has(key) ? camelToDash(key) : key, renderState.attrs[key]);
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/render/svg/utils/scrape-motion-values.mjs
		function scrapeMotionValuesFromProps(props, prevProps, visualElement) {
			const newValues = scrapeMotionValuesFromProps$1(props, prevProps, visualElement);
			for (const key in props) if (isMotionValue(props[key]) || isMotionValue(prevProps[key])) {
				const targetKey = transformPropOrder.indexOf(key) !== -1 ? "attr" + key.charAt(0).toUpperCase() + key.substring(1) : key;
				newValues[targetKey] = props[key];
			}
			return newValues;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/render/svg/SVGVisualElement.mjs
		var SVGVisualElement = class extends DOMVisualElement {
			constructor() {
				super(...arguments);
				this.type = "svg";
				this.isSVGTag = false;
				this.measureInstanceViewportBox = createBox;
			}
			getBaseTargetFromProps(props, key) {
				return props[key];
			}
			readValueFromInstance(instance, key) {
				if (transformProps.has(key)) {
					const defaultType = getDefaultValueType(key);
					return defaultType ? defaultType.default || 0 : 0;
				}
				key = !camelCaseAttributes.has(key) ? camelToDash(key) : key;
				return instance.getAttribute(key);
			}
			scrapeMotionValuesFromProps(props, prevProps, visualElement) {
				return scrapeMotionValuesFromProps(props, prevProps, visualElement);
			}
			build(renderState, latestValues, props) {
				buildSVGAttrs(renderState, latestValues, this.isSVGTag, props.transformTemplate, props.style);
			}
			renderInstance(instance, renderState, styleProp, projection) {
				renderSVG(instance, renderState, styleProp, projection);
			}
			mount(instance) {
				this.isSVGTag = isSVGTag(instance.tagName);
				super.mount(instance);
			}
		};
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/render/utils/get-variant-context.mjs
		const numVariantProps = variantProps.length;
		/**
		* Get variant context from a visual element's parent chain.
		* Uses `any` type for visualElement to avoid circular dependencies.
		*/
		function getVariantContext(visualElement) {
			if (!visualElement) return void 0;
			if (!visualElement.isControllingVariants) {
				const context = visualElement.parent ? getVariantContext(visualElement.parent) || {} : {};
				if (visualElement.props.initial !== void 0) context.initial = visualElement.props.initial;
				return context;
			}
			const context = {};
			for (let i = 0; i < numVariantProps; i++) {
				const name = variantProps[i];
				const prop = visualElement.props[name];
				if (isVariantLabel(prop) || prop === false) context[name] = prop;
			}
			return context;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/render/utils/shallow-compare.mjs
		function shallowCompare(next, prev) {
			if (!Array.isArray(prev)) return false;
			const prevLength = prev.length;
			if (prevLength !== next.length) return false;
			for (let i = 0; i < prevLength; i++) if (prev[i] !== next[i]) return false;
			return true;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/render/utils/animation-state.mjs
		const reversePriorityOrder = [...variantPriorityOrder].reverse();
		const numAnimationTypes = variantPriorityOrder.length;
		function createAnimateFunction(visualElement) {
			return (animations) => {
				return Promise.all(animations.map(({ animation, options }) => animateVisualElement(visualElement, animation, options)));
			};
		}
		function createAnimationState(visualElement) {
			let animate = createAnimateFunction(visualElement);
			let state = createState();
			let isInitialRender = true;
			/**
			* Track whether the animation state has been reset (e.g. via StrictMode
			* double-invocation or Suspense unmount/remount). On the first
			* animateChanges() call after a reset we need to behave like the initial
			* render for variant-inheritance checks, even though isInitialRender is
			* already false.
			*/
			let wasReset = false;
			/**
			* This function will be used to reduce the animation definitions for
			* each active animation type into an object of resolved values for it.
			*/
			const buildResolvedTypeValues = (type) => (acc, definition) => {
				const resolved = resolveVariant(visualElement, definition, type === "exit" ? visualElement.presenceContext?.custom : void 0);
				if (resolved) {
					const { transition, transitionEnd, ...target } = resolved;
					acc = {
						...acc,
						...target,
						...transitionEnd
					};
				}
				return acc;
			};
			/**
			* This just allows us to inject mocked animation functions
			* @internal
			*/
			function setAnimateFunction(makeAnimator) {
				animate = makeAnimator(visualElement);
			}
			/**
			* When we receive new props, we need to:
			* 1. Create a list of protected keys for each type. This is a directory of
			*    value keys that are currently being "handled" by types of a higher priority
			*    so that whenever an animation is played of a given type, these values are
			*    protected from being animated.
			* 2. Determine if an animation type needs animating.
			* 3. Determine if any values have been removed from a type and figure out
			*    what to animate those to.
			*/
			function animateChanges(changedActiveType) {
				const { props } = visualElement;
				const context = getVariantContext(visualElement.parent) || {};
				/**
				* A list of animations that we'll build into as we iterate through the animation
				* types. This will get executed at the end of the function.
				*/
				const animations = [];
				/**
				* Keep track of which values have been removed. Then, as we hit lower priority
				* animation types, we can check if they contain removed values and animate to that.
				*/
				const removedKeys = /* @__PURE__ */ new Set();
				/**
				* A dictionary of all encountered keys. This is an object to let us build into and
				* copy it without iteration. Each time we hit an animation type we set its protected
				* keys - the keys its not allowed to animate - to the latest version of this object.
				*/
				let encounteredKeys = {};
				/**
				* If a variant has been removed at a given index, and this component is controlling
				* variant animations, we want to ensure lower-priority variants are forced to animate.
				*/
				let removedVariantIndex = Infinity;
				/**
				* Iterate through all animation types in reverse priority order. For each, we want to
				* detect which values it's handling and whether or not they've changed (and therefore
				* need to be animated). If any values have been removed, we want to detect those in
				* lower priority props and flag for animation.
				*/
				for (let i = 0; i < numAnimationTypes; i++) {
					const type = reversePriorityOrder[i];
					const typeState = state[type];
					const prop = props[type] !== void 0 ? props[type] : context[type];
					const propIsVariant = isVariantLabel(prop);
					/**
					* If this type has *just* changed isActive status, set activeDelta
					* to that status. Otherwise set to null.
					*/
					const activeDelta = type === changedActiveType ? typeState.isActive : null;
					if (activeDelta === false) removedVariantIndex = i;
					/**
					* If this prop is an inherited variant, rather than been set directly on the
					* component itself, we want to make sure we allow the parent to trigger animations.
					*
					* TODO: Can probably change this to a !isControllingVariants check
					*/
					let isInherited = prop === context[type] && prop !== props[type] && propIsVariant;
					if (isInherited && (isInitialRender || wasReset) && visualElement.manuallyAnimateOnMount) isInherited = false;
					/**
					* Set all encountered keys so far as the protected keys for this type. This will
					* be any key that has been animated or otherwise handled by active, higher-priortiy types.
					*/
					typeState.protectedKeys = { ...encounteredKeys };
					if (!typeState.isActive && activeDelta === null || !prop && !typeState.prevProp || isAnimationControls(prop) || typeof prop === "boolean") continue;
					/**
					* If exit is already active and wasn't just activated, skip
					* re-processing to prevent interrupting running exit animations.
					* Re-resolving exit with a changed custom value can start new
					* value animations that stop the originals, leaving the exit
					* animation promise unresolved and the component stuck in the DOM.
					*/
					if (type === "exit" && typeState.isActive && activeDelta !== true) {
						if (typeState.prevResolvedValues) encounteredKeys = {
							...encounteredKeys,
							...typeState.prevResolvedValues
						};
						continue;
					}
					/**
					* As we go look through the values defined on this type, if we detect
					* a changed value or a value that was removed in a higher priority, we set
					* this to true and add this prop to the animation list.
					*/
					const variantDidChange = checkVariantsDidChange(typeState.prevProp, prop);
					let shouldAnimateType = variantDidChange || type === changedActiveType && typeState.isActive && !isInherited && propIsVariant || i > removedVariantIndex && propIsVariant;
					let handledRemovedValues = false;
					/**
					* As animations can be set as variant lists, variants or target objects, we
					* coerce everything to an array if it isn't one already
					*/
					const definitionList = Array.isArray(prop) ? prop : [prop];
					/**
					* Build an object of all the resolved values. We'll use this in the subsequent
					* animateChanges calls to determine whether a value has changed.
					*/
					let resolvedValues = definitionList.reduce(buildResolvedTypeValues(type), {});
					if (activeDelta === false) resolvedValues = {};
					/**
					* Now we need to loop through all the keys in the prev prop and this prop,
					* and decide:
					* 1. If the value has changed, and needs animating
					* 2. If it has been removed, and needs adding to the removedKeys set
					* 3. If it has been removed in a higher priority type and needs animating
					* 4. If it hasn't been removed in a higher priority but hasn't changed, and
					*    needs adding to the type's protectedKeys list.
					*/
					const { prevResolvedValues = {} } = typeState;
					const allKeys = {
						...prevResolvedValues,
						...resolvedValues
					};
					const markToAnimate = (key) => {
						shouldAnimateType = true;
						if (removedKeys.has(key)) {
							handledRemovedValues = true;
							removedKeys.delete(key);
						}
						typeState.needsAnimating[key] = true;
						const motionValue = visualElement.getValue(key);
						if (motionValue) motionValue.liveStyle = false;
					};
					for (const key in allKeys) {
						const next = resolvedValues[key];
						const prev = prevResolvedValues[key];
						if (encounteredKeys.hasOwnProperty(key)) continue;
						/**
						* If the value has changed, we probably want to animate it.
						*/
						let valueHasChanged = false;
						if (isKeyframesTarget(next) && isKeyframesTarget(prev)) valueHasChanged = !shallowCompare(next, prev) || variantDidChange;
						else valueHasChanged = next !== prev;
						if (valueHasChanged) if (next !== void 0 && next !== null) markToAnimate(key);
						else removedKeys.add(key);
						else if (next !== void 0 && removedKeys.has(key))
 /**
						* If next hasn't changed and it isn't undefined, we want to check if it's
						* been removed by a higher priority
						*/
						markToAnimate(key);
						else
 /**
						* If it hasn't changed, we add it to the list of protected values
						* to ensure it doesn't get animated.
						*/
						typeState.protectedKeys[key] = true;
					}
					/**
					* Update the typeState so next time animateChanges is called we can compare the
					* latest prop and resolvedValues to these.
					*/
					typeState.prevProp = prop;
					typeState.prevResolvedValues = resolvedValues;
					if (typeState.isActive) encounteredKeys = {
						...encounteredKeys,
						...resolvedValues
					};
					if ((isInitialRender || wasReset) && visualElement.blockInitialAnimation) shouldAnimateType = false;
					/**
					* If this is an inherited prop we want to skip this animation
					* unless the inherited variants haven't changed on this render.
					*/
					const willAnimateViaParent = isInherited && variantDidChange;
					if (shouldAnimateType && (!willAnimateViaParent || handledRemovedValues)) animations.push(...definitionList.map((animation) => {
						const options = { type };
						/**
						* If we're performing the initial animation, but we're not
						* rendering at the same time as the variant-controlling parent,
						* we want to use the parent's transition to calculate the stagger.
						*/
						if (typeof animation === "string" && (isInitialRender || wasReset) && !willAnimateViaParent && visualElement.manuallyAnimateOnMount && visualElement.parent) {
							const { parent } = visualElement;
							const parentVariant = resolveVariant(parent, animation);
							if (parent.enteringChildren && parentVariant) {
								const { delayChildren } = parentVariant.transition || {};
								options.delay = calcChildStagger(parent.enteringChildren, visualElement, delayChildren);
							}
						}
						return {
							animation,
							options
						};
					}));
				}
				/**
				* If there are some removed value that haven't been dealt with,
				* we need to create a new animation that falls back either to the value
				* defined in the style prop, or the last read value.
				*/
				if (removedKeys.size) {
					const fallbackAnimation = {};
					/**
					* If the initial prop contains a transition we can use that, otherwise
					* allow the animation function to use the visual element's default.
					*/
					if (typeof props.initial !== "boolean") {
						const initialTransition = resolveVariant(visualElement, Array.isArray(props.initial) ? props.initial[0] : props.initial);
						if (initialTransition && initialTransition.transition) fallbackAnimation.transition = initialTransition.transition;
					}
					removedKeys.forEach((key) => {
						const fallbackTarget = visualElement.getBaseTarget(key);
						const motionValue = visualElement.getValue(key);
						if (motionValue) motionValue.liveStyle = true;
						fallbackAnimation[key] = fallbackTarget ?? null;
					});
					animations.push({ animation: fallbackAnimation });
				}
				let shouldAnimate = Boolean(animations.length);
				if (isInitialRender && (props.initial === false || props.initial === props.animate) && !visualElement.manuallyAnimateOnMount) shouldAnimate = false;
				isInitialRender = false;
				wasReset = false;
				return shouldAnimate ? animate(animations) : Promise.resolve();
			}
			/**
			* Change whether a certain animation type is active.
			*/
			function setActive(type, isActive) {
				if (state[type].isActive === isActive) return Promise.resolve();
				visualElement.variantChildren?.forEach((child) => child.animationState?.setActive(type, isActive));
				state[type].isActive = isActive;
				const animations = animateChanges(type);
				for (const key in state) state[key].protectedKeys = {};
				return animations;
			}
			return {
				animateChanges,
				setActive,
				setAnimateFunction,
				getState: () => state,
				reset: () => {
					state = createState();
					wasReset = true;
				}
			};
		}
		function checkVariantsDidChange(prev, next) {
			if (typeof next === "string") return next !== prev;
			else if (Array.isArray(next)) return !shallowCompare(next, prev);
			return false;
		}
		function createTypeState(isActive = false) {
			return {
				isActive,
				protectedKeys: {},
				needsAnimating: {},
				prevResolvedValues: {}
			};
		}
		function createState() {
			return {
				animate: createTypeState(true),
				whileInView: createTypeState(),
				whileHover: createTypeState(),
				whileTap: createTypeState(),
				whileDrag: createTypeState(),
				whileFocus: createTypeState(),
				exit: createTypeState()
			};
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/projection/geometry/copy.mjs
		/**
		* Reset an axis to the provided origin box.
		*
		* This is a mutative operation.
		*/
		function copyAxisInto(axis, originAxis) {
			axis.min = originAxis.min;
			axis.max = originAxis.max;
		}
		/**
		* Reset a box to the provided origin box.
		*
		* This is a mutative operation.
		*/
		function copyBoxInto(box, originBox) {
			copyAxisInto(box.x, originBox.x);
			copyAxisInto(box.y, originBox.y);
		}
		/**
		* Reset a delta to the provided origin box.
		*
		* This is a mutative operation.
		*/
		function copyAxisDeltaInto(delta, originDelta) {
			delta.translate = originDelta.translate;
			delta.scale = originDelta.scale;
			delta.originPoint = originDelta.originPoint;
			delta.origin = originDelta.origin;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/projection/geometry/delta-calc.mjs
		const SCALE_MIN = .9999;
		const SCALE_MAX = 1.0001;
		const TRANSLATE_MIN = -.01;
		const TRANSLATE_MAX = .01;
		function calcLength(axis) {
			return axis.max - axis.min;
		}
		function isNear(value, target, maxDistance) {
			return Math.abs(value - target) <= maxDistance;
		}
		function calcAxisDelta(delta, source, target, origin = .5) {
			delta.origin = origin;
			delta.originPoint = mixNumber$1(source.min, source.max, delta.origin);
			delta.scale = calcLength(target) / calcLength(source);
			delta.translate = mixNumber$1(target.min, target.max, delta.origin) - delta.originPoint;
			if (delta.scale >= SCALE_MIN && delta.scale <= SCALE_MAX || isNaN(delta.scale)) delta.scale = 1;
			if (delta.translate >= TRANSLATE_MIN && delta.translate <= TRANSLATE_MAX || isNaN(delta.translate)) delta.translate = 0;
		}
		function calcBoxDelta(delta, source, target, origin) {
			calcAxisDelta(delta.x, source.x, target.x, origin ? origin.originX : void 0);
			calcAxisDelta(delta.y, source.y, target.y, origin ? origin.originY : void 0);
		}
		function calcRelativeAxis(target, relative, parent, anchor = 0) {
			target.min = (anchor ? mixNumber$1(parent.min, parent.max, anchor) : parent.min) + relative.min;
			target.max = target.min + calcLength(relative);
		}
		function calcRelativeBox(target, relative, parent, anchor) {
			calcRelativeAxis(target.x, relative.x, parent.x, anchor?.x);
			calcRelativeAxis(target.y, relative.y, parent.y, anchor?.y);
		}
		function calcRelativeAxisPosition(target, layout, parent, anchor = 0) {
			const anchorPoint = anchor ? mixNumber$1(parent.min, parent.max, anchor) : parent.min;
			target.min = layout.min - anchorPoint;
			target.max = target.min + calcLength(layout);
		}
		function calcRelativePosition(target, layout, parent, anchor) {
			calcRelativeAxisPosition(target.x, layout.x, parent.x, anchor?.x);
			calcRelativeAxisPosition(target.y, layout.y, parent.y, anchor?.y);
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/projection/geometry/delta-remove.mjs
		/**
		* Remove a delta from a point. This is essentially the steps of applyPointDelta in reverse
		*/
		function removePointDelta(point, translate, scale, originPoint, boxScale) {
			point -= translate;
			point = scalePoint(point, 1 / scale, originPoint);
			if (boxScale !== void 0) point = scalePoint(point, 1 / boxScale, originPoint);
			return point;
		}
		/**
		* Remove a delta from an axis. This is essentially the steps of applyAxisDelta in reverse
		*/
		function removeAxisDelta(axis, translate = 0, scale = 1, origin = .5, boxScale, originAxis = axis, sourceAxis = axis) {
			if (percent.test(translate)) {
				translate = parseFloat(translate);
				translate = mixNumber$1(sourceAxis.min, sourceAxis.max, translate / 100) - sourceAxis.min;
			}
			if (typeof translate !== "number") return;
			let originPoint = mixNumber$1(originAxis.min, originAxis.max, origin);
			if (axis === originAxis) originPoint -= translate;
			axis.min = removePointDelta(axis.min, translate, scale, originPoint, boxScale);
			axis.max = removePointDelta(axis.max, translate, scale, originPoint, boxScale);
		}
		/**
		* Remove a transforms from an axis. This is essentially the steps of applyAxisTransforms in reverse
		* and acts as a bridge between motion values and removeAxisDelta
		*/
		function removeAxisTransforms(axis, transforms, [key, scaleKey, originKey], origin, sourceAxis) {
			removeAxisDelta(axis, transforms[key], transforms[scaleKey], transforms[originKey], transforms.scale, origin, sourceAxis);
		}
		/**
		* The names of the motion values we want to apply as translation, scale and origin.
		*/
		const xKeys = [
			"x",
			"scaleX",
			"originX"
		];
		const yKeys = [
			"y",
			"scaleY",
			"originY"
		];
		/**
		* Remove a transforms from an box. This is essentially the steps of applyAxisBox in reverse
		* and acts as a bridge between motion values and removeAxisDelta
		*/
		function removeBoxTransforms(box, transforms, originBox, sourceBox) {
			removeAxisTransforms(box.x, transforms, xKeys, originBox ? originBox.x : void 0, sourceBox ? sourceBox.x : void 0);
			removeAxisTransforms(box.y, transforms, yKeys, originBox ? originBox.y : void 0, sourceBox ? sourceBox.y : void 0);
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/projection/geometry/utils.mjs
		function isAxisDeltaZero(delta) {
			return delta.translate === 0 && delta.scale === 1;
		}
		function isDeltaZero(delta) {
			return isAxisDeltaZero(delta.x) && isAxisDeltaZero(delta.y);
		}
		function axisEquals(a, b) {
			return a.min === b.min && a.max === b.max;
		}
		function boxEquals(a, b) {
			return axisEquals(a.x, b.x) && axisEquals(a.y, b.y);
		}
		function axisEqualsRounded(a, b) {
			return Math.round(a.min) === Math.round(b.min) && Math.round(a.max) === Math.round(b.max);
		}
		function boxEqualsRounded(a, b) {
			return axisEqualsRounded(a.x, b.x) && axisEqualsRounded(a.y, b.y);
		}
		function aspectRatio(box) {
			return calcLength(box.x) / calcLength(box.y);
		}
		function axisDeltaEquals(a, b) {
			return a.translate === b.translate && a.scale === b.scale && a.originPoint === b.originPoint;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/projection/utils/each-axis.mjs
		function eachAxis(callback) {
			return [callback("x"), callback("y")];
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/projection/styles/transform.mjs
		function buildProjectionTransform(delta, treeScale, latestTransform) {
			let transform = "";
			/**
			* The translations we use to calculate are always relative to the viewport coordinate space.
			* But when we apply scales, we also scale the coordinate space of an element and its children.
			* For instance if we have a treeScale (the culmination of all parent scales) of 0.5 and we need
			* to move an element 100 pixels, we actually need to move it 200 in within that scaled space.
			*/
			const xTranslate = delta.x.translate / treeScale.x;
			const yTranslate = delta.y.translate / treeScale.y;
			const zTranslate = latestTransform?.z || 0;
			if (xTranslate || yTranslate || zTranslate) transform = `translate3d(${xTranslate}px, ${yTranslate}px, ${zTranslate}px) `;
			/**
			* Apply scale correction for the tree transform.
			* This will apply scale to the screen-orientated axes.
			*/
			if (treeScale.x !== 1 || treeScale.y !== 1) transform += `scale(${1 / treeScale.x}, ${1 / treeScale.y}) `;
			if (latestTransform) {
				const { transformPerspective, rotate, pathRotation, rotateX, rotateY, skewX, skewY } = latestTransform;
				if (transformPerspective) transform = `perspective(${transformPerspective}px) ${transform}`;
				if (rotate) transform += `rotate(${rotate}deg) `;
				if (pathRotation) transform += `rotate(${pathRotation}deg) `;
				if (rotateX) transform += `rotateX(${rotateX}deg) `;
				if (rotateY) transform += `rotateY(${rotateY}deg) `;
				if (skewX) transform += `skewX(${skewX}deg) `;
				if (skewY) transform += `skewY(${skewY}deg) `;
			}
			/**
			* Apply scale to match the size of the element to the size we want it.
			* This will apply scale to the element-orientated axes.
			*/
			const elementScaleX = delta.x.scale * treeScale.x;
			const elementScaleY = delta.y.scale * treeScale.y;
			if (elementScaleX !== 1 || elementScaleY !== 1) transform += `scale(${elementScaleX}, ${elementScaleY})`;
			return transform || "none";
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/projection/animation/mix-values.mjs
		const numBorders = cornerRadiusProps.length;
		const asNumber = (value) => typeof value === "string" ? parseFloat(value) : value;
		const isPx = (value) => typeof value === "number" || px.test(value);
		function mixValues(target, follow, lead, progress, shouldCrossfadeOpacity, isOnlyMember) {
			if (shouldCrossfadeOpacity) {
				target.opacity = mixNumber$1(0, lead.opacity ?? 1, easeCrossfadeIn(progress));
				target.opacityExit = mixNumber$1(follow.opacity ?? 1, 0, easeCrossfadeOut(progress));
			} else if (isOnlyMember) target.opacity = mixNumber$1(follow.opacity ?? 1, lead.opacity ?? 1, progress);
			/**
			* Mix border radius
			*/
			for (let i = 0; i < numBorders; i++) {
				const borderLabel = cornerRadiusProps[i];
				let followRadius = getRadius(follow, borderLabel);
				let leadRadius = getRadius(lead, borderLabel);
				if (followRadius === void 0 && leadRadius === void 0) continue;
				followRadius || (followRadius = 0);
				leadRadius || (leadRadius = 0);
				if (followRadius === 0 || leadRadius === 0 || isPx(followRadius) === isPx(leadRadius)) {
					target[borderLabel] = Math.max(mixNumber$1(asNumber(followRadius), asNumber(leadRadius), progress), 0);
					if (percent.test(leadRadius) || percent.test(followRadius)) target[borderLabel] += "%";
				} else target[borderLabel] = leadRadius;
			}
			/**
			* Mix rotation
			*/
			if (follow.rotate || lead.rotate) target.rotate = mixNumber$1(follow.rotate || 0, lead.rotate || 0, progress);
		}
		function getRadius(values, radiusName) {
			return values[radiusName] !== void 0 ? values[radiusName] : values.borderRadius;
		}
		const easeCrossfadeIn = /*@__PURE__*/ compress(0, .5, circOut);
		const easeCrossfadeOut = /*@__PURE__*/ compress(.5, .95, noop);
		function compress(min, max, easing) {
			return (p) => {
				if (p < min) return 0;
				if (p > max) return 1;
				return easing(/* @__PURE__ */ progress(min, max, p));
			};
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/animation/animate/single-value.mjs
		function animateSingleValue(value, keyframes, options) {
			const motionValue$1 = isMotionValue(value) ? value : motionValue(value);
			motionValue$1.start(animateMotionValue("", motionValue$1, keyframes, options));
			return motionValue$1.animation;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/events/add-dom-event.mjs
		function addDomEvent(target, eventName, handler, options = { passive: true }) {
			target.addEventListener(eventName, handler, options);
			return () => target.removeEventListener(eventName, handler, options);
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/projection/utils/compare-by-depth.mjs
		const compareByDepth = (a, b) => a.depth - b.depth;
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/projection/utils/flat-tree.mjs
		var FlatTree = class {
			constructor() {
				this.children = [];
				this.isDirty = false;
			}
			add(child) {
				addUniqueItem(this.children, child);
				this.isDirty = true;
			}
			remove(child) {
				removeItem(this.children, child);
				this.isDirty = true;
			}
			forEach(callback) {
				this.isDirty && this.children.sort(compareByDepth);
				this.isDirty = false;
				this.children.forEach(callback);
			}
		};
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/utils/delay.mjs
		/**
		* Timeout defined in ms
		*/
		function delay(callback, timeout) {
			const start = time.now();
			const checkElapsed = ({ timestamp }) => {
				const elapsed = timestamp - start;
				if (elapsed >= timeout) {
					cancelFrame(checkElapsed);
					callback(elapsed - timeout);
				}
			};
			frame.setup(checkElapsed, true);
			return () => cancelFrame(checkElapsed);
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/value/utils/resolve-motion-value.mjs
		/**
		* If the provided value is a MotionValue, this returns the actual value, otherwise just the value itself
		*/
		function resolveMotionValue(value) {
			return isMotionValue(value) ? value.get() : value;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/projection/shared/stack.mjs
		var NodeStack = class {
			constructor() {
				this.members = [];
			}
			add(node) {
				addUniqueItem(this.members, node);
				for (let i = this.members.length - 1; i >= 0; i--) {
					const member = this.members[i];
					if (member === node || member === this.lead || member === this.prevLead) continue;
					const inst = member.instance;
					if ((!inst || inst.isConnected === false) && !member.snapshot) {
						removeItem(this.members, member);
						member.unmount();
					}
				}
				node.scheduleRender();
			}
			remove(node) {
				removeItem(this.members, node);
				if (node === this.prevLead) this.prevLead = void 0;
				if (node === this.lead) {
					const prevLead = this.members[this.members.length - 1];
					if (prevLead) this.promote(prevLead);
				}
			}
			relegate(node) {
				for (let i = this.members.indexOf(node) - 1; i >= 0; i--) {
					const member = this.members[i];
					if (member.isPresent !== false && member.instance?.isConnected !== false) {
						this.promote(member);
						return true;
					}
				}
				return false;
			}
			promote(node, preserveFollowOpacity) {
				const prevLead = this.lead;
				if (node === prevLead) return;
				this.prevLead = prevLead;
				this.lead = node;
				node.show();
				if (prevLead) {
					prevLead.updateSnapshot();
					node.scheduleRender();
					const { layoutDependency: prevDep } = prevLead.options;
					const { layoutDependency: nextDep } = node.options;
					if (prevDep === void 0 || prevDep !== nextDep) {
						node.resumeFrom = prevLead;
						if (preserveFollowOpacity) prevLead.preserveOpacity = true;
						if (prevLead.snapshot) {
							node.snapshot = prevLead.snapshot;
							node.snapshot.latestValues = prevLead.animationValues || prevLead.latestValues;
						}
						if (node.root?.isUpdating) node.isLayoutDirty = true;
					}
					if (node.options.crossfade === false) prevLead.hide();
				}
			}
			exitAnimationComplete() {
				this.members.forEach((member) => {
					member.options.onExitComplete?.();
					member.resumingFrom?.options.onExitComplete?.();
				});
			}
			scheduleRender() {
				this.members.forEach((member) => member.instance && member.scheduleRender(false));
			}
			removeLeadSnapshot() {
				if (this.lead?.snapshot) this.lead.snapshot = void 0;
			}
		};
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/projection/node/state.mjs
		/**
		* This should only ever be modified on the client otherwise it'll
		* persist through server requests. If we need instanced states we
		* could lazy-init via root.
		*/
		const globalProjectionState = {
			/**
			* Global flag as to whether the tree has animated since the last time
			* we resized the window
			*/
			hasAnimatedSinceResize: true,
			/**
			* We set this to true once, on the first update. Any nodes added to the tree beyond that
			* update will be given a `data-projection-id` attribute.
			*/
			hasEverUpdated: false
		};
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/projection/node/create-projection-node.mjs
		const metrics = {
			nodes: 0,
			calculatedTargetDeltas: 0,
			calculatedProjections: 0
		};
		const transformAxes = [
			"",
			"X",
			"Y",
			"Z"
		];
		/**
		* We use 1000 as the animation target as 0-1000 maps better to pixels than 0-1
		* which has a noticeable difference in spring animations
		*/
		const animationTarget = 1e3;
		let id$1 = 0;
		function resetDistortingTransform(key, visualElement, values, sharedAnimationValues) {
			const { latestValues } = visualElement;
			if (latestValues[key]) {
				values[key] = latestValues[key];
				visualElement.setStaticValue(key, 0);
				if (sharedAnimationValues) sharedAnimationValues[key] = 0;
			}
		}
		function cancelTreeOptimisedTransformAnimations(projectionNode) {
			projectionNode.hasCheckedOptimisedAppear = true;
			if (projectionNode.root === projectionNode) return;
			const { visualElement } = projectionNode.options;
			if (!visualElement) return;
			const appearId = getOptimisedAppearId(visualElement);
			if (window.MotionHasOptimisedAnimation(appearId, "transform")) {
				const { layout, layoutId } = projectionNode.options;
				window.MotionCancelOptimisedAnimation(appearId, "transform", frame, !(layout || layoutId));
			}
			const { parent } = projectionNode;
			if (parent && !parent.hasCheckedOptimisedAppear) cancelTreeOptimisedTransformAnimations(parent);
		}
		function createProjectionNode$1({ attachResizeListener, defaultParent, measureScroll, checkIsScrollRoot, resetTransform }) {
			return class ProjectionNode {
				constructor(latestValues = {}, parent = defaultParent?.()) {
					/**
					* A unique ID generated for every projection node.
					*/
					this.id = id$1++;
					/**
					* An id that represents a unique session instigated by startUpdate.
					*/
					this.animationId = 0;
					this.animationCommitId = 0;
					/**
					* A Set containing all this component's children. This is used to iterate
					* through the children.
					*
					* TODO: This could be faster to iterate as a flat array stored on the root node.
					*/
					this.children = /* @__PURE__ */ new Set();
					/**
					* Options for the node. We use this to configure what kind of layout animations
					* we should perform (if any).
					*/
					this.options = {};
					/**
					* We use this to detect when its safe to shut down part of a projection tree.
					* We have to keep projecting children for scale correction and relative projection
					* until all their parents stop performing layout animations.
					*/
					this.isTreeAnimating = false;
					this.isAnimationBlocked = false;
					/**
					* Flag to true if we think this layout has been changed. We can't always know this,
					* currently we set it to true every time a component renders, or if it has a layoutDependency
					* if that has changed between renders. Additionally, components can be grouped by LayoutGroup
					* and if one node is dirtied, they all are.
					*/
					this.isLayoutDirty = false;
					/**
					* Flag to true if we think the projection calculations for this node needs
					* recalculating as a result of an updated transform or layout animation.
					*/
					this.isProjectionDirty = false;
					/**
					* Flag to true if the layout *or* transform has changed. This then gets propagated
					* throughout the projection tree, forcing any element below to recalculate on the next frame.
					*/
					this.isSharedProjectionDirty = false;
					/**
					* Flag transform dirty. This gets propagated throughout the whole tree but is only
					* respected by shared nodes.
					*/
					this.isTransformDirty = false;
					/**
					* Block layout updates for instant layout transitions throughout the tree.
					*/
					this.updateManuallyBlocked = false;
					this.updateBlockedByResize = false;
					/**
					* Set to true between the start of the first `willUpdate` call and the end of the `didUpdate`
					* call.
					*/
					this.isUpdating = false;
					/**
					* If this is an SVG element we currently disable projection transforms
					*/
					this.isSVG = false;
					/**
					* Flag to true (during promotion) if a node doing an instant layout transition needs to reset
					* its projection styles.
					*/
					this.needsReset = false;
					/**
					* Flags whether this node should have its transform reset prior to measuring.
					*/
					this.shouldResetTransform = false;
					/**
					* Store whether this node has been checked for optimised appear animations. As
					* effects fire bottom-up, and we want to look up the tree for appear animations,
					* this makes sure we only check each path once, stopping at nodes that
					* have already been checked.
					*/
					this.hasCheckedOptimisedAppear = false;
					/**
					* An object representing the calculated contextual/accumulated/tree scale.
					* This will be used to scale calculcated projection transforms, as these are
					* calculated in screen-space but need to be scaled for elements to layoutly
					* make it to their calculated destinations.
					*
					* TODO: Lazy-init
					*/
					this.treeScale = {
						x: 1,
						y: 1
					};
					/**
					*
					*/
					this.eventHandlers = /* @__PURE__ */ new Map();
					this.hasTreeAnimated = false;
					this.layoutVersion = 0;
					this.updateScheduled = false;
					this.scheduleUpdate = () => this.update();
					this.projectionUpdateScheduled = false;
					this.checkUpdateFailed = () => {
						if (this.isUpdating) {
							this.isUpdating = false;
							this.clearAllSnapshots();
						}
					};
					/**
					* This is a multi-step process as shared nodes might be of different depths. Nodes
					* are sorted by depth order, so we need to resolve the entire tree before moving to
					* the next step.
					*/
					this.updateProjection = () => {
						this.projectionUpdateScheduled = false;
						/**
						* Reset debug counts. Manually resetting rather than creating a new
						* object each frame.
						*/
						if (statsBuffer.value) metrics.nodes = metrics.calculatedTargetDeltas = metrics.calculatedProjections = 0;
						this.nodes.forEach(propagateDirtyNodes);
						this.nodes.forEach(resolveTargetDelta);
						this.nodes.forEach(calcProjection);
						this.nodes.forEach(cleanDirtyNodes);
						if (statsBuffer.addProjectionMetrics) statsBuffer.addProjectionMetrics(metrics);
					};
					/**
					* Frame calculations
					*/
					this.resolvedRelativeTargetAt = 0;
					this.linkedParentVersion = 0;
					this.hasProjected = false;
					this.isVisible = true;
					this.animationProgress = 0;
					/**
					* Shared layout
					*/
					this.sharedNodes = /* @__PURE__ */ new Map();
					this.latestValues = latestValues;
					this.root = parent ? parent.root || parent : this;
					this.path = parent ? [...parent.path, parent] : [];
					this.parent = parent;
					this.depth = parent ? parent.depth + 1 : 0;
					for (let i = 0; i < this.path.length; i++) this.path[i].shouldResetTransform = true;
					if (this.root === this) this.nodes = new FlatTree();
				}
				addEventListener(name, handler) {
					if (!this.eventHandlers.has(name)) this.eventHandlers.set(name, new SubscriptionManager());
					return this.eventHandlers.get(name).add(handler);
				}
				notifyListeners(name, ...args) {
					const subscriptionManager = this.eventHandlers.get(name);
					subscriptionManager && subscriptionManager.notify(...args);
				}
				hasListeners(name) {
					return this.eventHandlers.has(name);
				}
				/**
				* Lifecycles
				*/
				mount(instance) {
					if (this.instance) return;
					this.isSVG = isSVGElement(instance) && !isSVGSVGElement(instance);
					this.instance = instance;
					const { layoutId, layout, visualElement } = this.options;
					if (visualElement && !visualElement.current) visualElement.mount(instance);
					this.root.nodes.add(this);
					this.parent && this.parent.children.add(this);
					if (this.root.hasTreeAnimated && (layout || layoutId)) this.isLayoutDirty = true;
					if (attachResizeListener) {
						let cancelDelay;
						let innerWidth = 0;
						const resizeUnblockUpdate = () => this.root.updateBlockedByResize = false;
						frame.read(() => {
							innerWidth = window.innerWidth;
						});
						attachResizeListener(instance, () => {
							const newInnerWidth = window.innerWidth;
							if (newInnerWidth === innerWidth) return;
							innerWidth = newInnerWidth;
							this.root.updateBlockedByResize = true;
							cancelDelay && cancelDelay();
							cancelDelay = delay(resizeUnblockUpdate, 250);
							if (globalProjectionState.hasAnimatedSinceResize) {
								globalProjectionState.hasAnimatedSinceResize = false;
								this.nodes.forEach(finishAnimation);
							}
						});
					}
					if (layoutId) this.root.registerSharedNode(layoutId, this);
					if (this.options.animate !== false && visualElement && (layoutId || layout)) this.addEventListener("didUpdate", ({ delta, hasLayoutChanged, hasRelativeLayoutChanged, layout: newLayout }) => {
						if (this.isTreeAnimationBlocked()) {
							this.target = void 0;
							this.relativeTarget = void 0;
							return;
						}
						const layoutTransition = this.options.transition || visualElement.getDefaultTransition() || defaultLayoutTransition;
						const { onLayoutAnimationStart, onLayoutAnimationComplete } = visualElement.getProps();
						/**
						* The target layout of the element might stay the same,
						* but its position relative to its parent has changed.
						*/
						const hasTargetChanged = !this.targetLayout || !boxEqualsRounded(this.targetLayout, newLayout);
						/**
						* If the layout hasn't seemed to have changed, it might be that the
						* element is visually in the same place in the document but its position
						* relative to its parent has indeed changed. So here we check for that.
						*/
						const hasOnlyRelativeTargetChanged = !hasLayoutChanged && hasRelativeLayoutChanged;
						if (this.options.layoutRoot || this.resumeFrom || hasOnlyRelativeTargetChanged || hasLayoutChanged && (hasTargetChanged || !this.currentAnimation)) {
							if (this.resumeFrom) {
								this.resumingFrom = this.resumeFrom;
								this.resumingFrom.resumingFrom = void 0;
							}
							const animationOptions = {
								...getValueTransition(layoutTransition, "layout"),
								onPlay: onLayoutAnimationStart,
								onComplete: onLayoutAnimationComplete
							};
							if (visualElement.shouldReduceMotion || this.options.layoutRoot) {
								animationOptions.delay = 0;
								animationOptions.type = false;
							}
							this.startAnimation(animationOptions);
							/**
							* Set animation origin after starting animation to avoid layout jump
							* caused by stopping previous layout animation
							*/
							this.setAnimationOrigin(delta, hasOnlyRelativeTargetChanged, animationOptions.path);
						} else {
							/**
							* If the layout hasn't changed and we have an animation that hasn't started yet,
							* finish it immediately. Otherwise it will be animating from a location
							* that was probably never committed to screen and look like a jumpy box.
							*/
							if (!hasLayoutChanged) finishAnimation(this);
							if (this.isLead() && this.options.onExitComplete) this.options.onExitComplete();
						}
						this.targetLayout = newLayout;
					});
				}
				unmount() {
					this.options.layoutId && this.willUpdate();
					this.root.nodes.remove(this);
					const stack = this.getStack();
					stack && stack.remove(this);
					this.parent && this.parent.children.delete(this);
					this.instance = void 0;
					this.eventHandlers.clear();
					cancelFrame(this.updateProjection);
				}
				blockUpdate() {
					this.updateManuallyBlocked = true;
				}
				unblockUpdate() {
					this.updateManuallyBlocked = false;
				}
				isUpdateBlocked() {
					return this.updateManuallyBlocked || this.updateBlockedByResize;
				}
				isTreeAnimationBlocked() {
					return this.isAnimationBlocked || this.parent && this.parent.isTreeAnimationBlocked() || false;
				}
				startUpdate() {
					if (this.isUpdateBlocked()) return;
					this.isUpdating = true;
					this.nodes && this.nodes.forEach(resetSkewAndRotation);
					this.animationId++;
				}
				getTransformTemplate() {
					const { visualElement } = this.options;
					return visualElement && visualElement.getProps().transformTemplate;
				}
				willUpdate(shouldNotifyListeners = true) {
					this.root.hasTreeAnimated = true;
					if (this.root.isUpdateBlocked()) {
						this.options.onExitComplete && this.options.onExitComplete();
						return;
					}
					/**
					* If we're running optimised appear animations then these must be
					* cancelled before measuring the DOM. This is so we can measure
					* the true layout of the element rather than the WAAPI animation
					* which will be unaffected by the resetSkewAndRotate step.
					*
					* Note: This is a DOM write. Worst case scenario is this is sandwiched
					* between other snapshot reads which will cause unnecessary style recalculations.
					* This has to happen here though, as we don't yet know which nodes will need
					* snapshots in startUpdate(), but we only want to cancel optimised animations
					* if a layout animation measurement is actually going to be affected by them.
					*/
					if (window.MotionCancelOptimisedAnimation && !this.hasCheckedOptimisedAppear) cancelTreeOptimisedTransformAnimations(this);
					!this.root.isUpdating && this.root.startUpdate();
					if (this.isLayoutDirty) return;
					this.isLayoutDirty = true;
					for (let i = 0; i < this.path.length; i++) {
						const node = this.path[i];
						node.shouldResetTransform = true;
						/**
						* Percentage translates resolve against layoutBox dimensions,
						* so ancestors with them must be re-measured after transform reset.
						*/
						if (typeof node.latestValues.x === "string" || typeof node.latestValues.y === "string") node.isLayoutDirty = true;
						node.updateScroll("snapshot");
						if (node.options.layoutRoot) node.willUpdate(false);
					}
					const { layoutId, layout } = this.options;
					if (layoutId === void 0 && !layout) return;
					const transformTemplate = this.getTransformTemplate();
					this.prevTransformTemplateValue = transformTemplate ? transformTemplate(this.latestValues, "") : void 0;
					this.updateSnapshot();
					shouldNotifyListeners && this.notifyListeners("willUpdate");
				}
				update() {
					this.updateScheduled = false;
					if (this.isUpdateBlocked()) {
						const wasBlockedByResize = this.updateBlockedByResize;
						this.unblockUpdate();
						this.updateBlockedByResize = false;
						this.clearAllSnapshots();
						/**
						* When blocked by resize, still measure layouts so
						* callbacks like onLayoutMeasure fire (e.g. Reorder).
						* Skip notifyLayoutUpdate to prevent animations.
						*/
						if (wasBlockedByResize) this.nodes.forEach(forceLayoutMeasure);
						this.nodes.forEach(clearMeasurements);
						return;
					}
					/**
					* If this is a repeat of didUpdate then ignore the animation.
					*/
					if (this.animationId <= this.animationCommitId) {
						this.nodes.forEach(clearIsLayoutDirty);
						return;
					}
					this.animationCommitId = this.animationId;
					if (!this.isUpdating) this.nodes.forEach(clearIsLayoutDirty);
					else {
						this.isUpdating = false;
						/**
						* Ensure animation-blocked nodes (e.g. during drag)
						* get measured even when memoized (willUpdate skipped).
						*/
						this.nodes.forEach(ensureDraggedNodesSnapshotted);
						/**
						* Write
						*/
						this.nodes.forEach(resetTransformStyle);
						/**
						* Read ==================
						*/
						this.nodes.forEach(updateLayout);
						/**
						* Write
						*/
						this.nodes.forEach(notifyLayoutUpdate);
					}
					this.clearAllSnapshots();
					/**
					* Manually flush any pending updates. Ideally
					* we could leave this to the following requestAnimationFrame but this seems
					* to leave a flash of incorrectly styled content.
					*/
					const now = time.now();
					frameData.delta = clamp(0, 1e3 / 60, now - frameData.timestamp);
					frameData.timestamp = now;
					frameData.isProcessing = true;
					frameSteps.update.process(frameData);
					frameSteps.preRender.process(frameData);
					frameSteps.render.process(frameData);
					frameData.isProcessing = false;
				}
				didUpdate() {
					if (!this.updateScheduled) {
						this.updateScheduled = true;
						microtask.read(this.scheduleUpdate);
					}
				}
				clearAllSnapshots() {
					this.nodes.forEach(clearSnapshot);
					this.sharedNodes.forEach(removeLeadSnapshots);
				}
				scheduleUpdateProjection() {
					if (!this.projectionUpdateScheduled) {
						this.projectionUpdateScheduled = true;
						frame.preRender(this.updateProjection, false, true);
					}
				}
				scheduleCheckAfterUnmount() {
					/**
					* If the unmounting node is in a layoutGroup and did trigger a willUpdate,
					* we manually call didUpdate to give a chance to the siblings to animate.
					* Otherwise, cleanup all snapshots to prevents future nodes from reusing them.
					*/
					frame.postRender(() => {
						if (this.isLayoutDirty) this.root.didUpdate();
						else this.root.checkUpdateFailed();
					});
				}
				/**
				* Update measurements
				*/
				updateSnapshot() {
					if (this.snapshot || !this.instance) return;
					this.snapshot = this.measure();
					if (this.snapshot && !calcLength(this.snapshot.measuredBox.x) && !calcLength(this.snapshot.measuredBox.y)) this.snapshot = void 0;
				}
				updateLayout() {
					if (!this.instance) return;
					this.updateScroll();
					if (!(this.options.alwaysMeasureLayout && this.isLead()) && !this.isLayoutDirty) return;
					/**
					* When a node is mounted, it simply resumes from the prevLead's
					* snapshot instead of taking a new one, but the ancestors scroll
					* might have updated while the prevLead is unmounted. We need to
					* update the scroll again to make sure the layout we measure is
					* up to date.
					*/
					if (this.resumeFrom && !this.resumeFrom.instance) for (let i = 0; i < this.path.length; i++) this.path[i].updateScroll();
					const prevLayout = this.layout;
					this.layout = this.measure(false);
					this.layoutVersion++;
					if (!this.layoutCorrected) this.layoutCorrected = createBox();
					this.isLayoutDirty = false;
					this.projectionDelta = void 0;
					this.notifyListeners("measure", this.layout.layoutBox);
					const { visualElement } = this.options;
					visualElement && visualElement.notify("LayoutMeasure", this.layout.layoutBox, prevLayout ? prevLayout.layoutBox : void 0);
				}
				updateScroll(phase = "measure") {
					let needsMeasurement = Boolean(this.options.layoutScroll && this.instance);
					if (this.scroll && this.scroll.animationId === this.root.animationId && this.scroll.phase === phase) needsMeasurement = false;
					if (needsMeasurement && this.instance) {
						const isRoot = checkIsScrollRoot(this.instance);
						this.scroll = {
							animationId: this.root.animationId,
							phase,
							isRoot,
							offset: measureScroll(this.instance),
							wasRoot: this.scroll ? this.scroll.isRoot : isRoot
						};
					}
				}
				resetTransform() {
					if (!resetTransform) return;
					const isResetRequested = this.isLayoutDirty || this.shouldResetTransform || this.options.alwaysMeasureLayout;
					const hasProjection = this.projectionDelta && !isDeltaZero(this.projectionDelta);
					const transformTemplate = this.getTransformTemplate();
					const transformTemplateValue = transformTemplate ? transformTemplate(this.latestValues, "") : void 0;
					const transformTemplateHasChanged = transformTemplateValue !== this.prevTransformTemplateValue;
					if (isResetRequested && this.instance && (hasProjection || hasTransform(this.latestValues) || transformTemplateHasChanged)) {
						resetTransform(this.instance, transformTemplateValue);
						this.shouldResetTransform = false;
						this.scheduleRender();
					}
				}
				measure(removeTransform = true) {
					const pageBox = this.measurePageBox();
					let layoutBox = this.removeElementScroll(pageBox);
					/**
					* Measurements taken during the pre-render stage
					* still have transforms applied so we remove them
					* via calculation.
					*/
					if (removeTransform) layoutBox = this.removeTransform(layoutBox);
					roundBox(layoutBox);
					return {
						animationId: this.root.animationId,
						measuredBox: pageBox,
						layoutBox,
						latestValues: {},
						source: this.id
					};
				}
				measurePageBox() {
					const { visualElement } = this.options;
					if (!visualElement) return createBox();
					const box = visualElement.measureViewportBox();
					if (!(this.scroll?.wasRoot || this.path.some(checkNodeWasScrollRoot))) {
						const { scroll } = this.root;
						if (scroll) {
							translateAxis(box.x, scroll.offset.x);
							translateAxis(box.y, scroll.offset.y);
						}
					}
					return box;
				}
				removeElementScroll(box) {
					const boxWithoutScroll = createBox();
					copyBoxInto(boxWithoutScroll, box);
					if (this.scroll?.wasRoot) return boxWithoutScroll;
					/**
					* Performance TODO: Keep a cumulative scroll offset down the tree
					* rather than loop back up the path.
					*/
					for (let i = 0; i < this.path.length; i++) {
						const node = this.path[i];
						const { scroll, options } = node;
						if (node !== this.root && scroll && options.layoutScroll) {
							/**
							* If this is a new scroll root, we want to remove all previous scrolls
							* from the viewport box.
							*/
							if (scroll.wasRoot) copyBoxInto(boxWithoutScroll, box);
							translateAxis(boxWithoutScroll.x, scroll.offset.x);
							translateAxis(boxWithoutScroll.y, scroll.offset.y);
						}
					}
					return boxWithoutScroll;
				}
				applyTransform(box, transformOnly = false, output) {
					const withTransforms = output || createBox();
					copyBoxInto(withTransforms, box);
					for (let i = 0; i < this.path.length; i++) {
						const node = this.path[i];
						if (!transformOnly && node.options.layoutScroll && node.scroll && node !== node.root) {
							translateAxis(withTransforms.x, -node.scroll.offset.x);
							translateAxis(withTransforms.y, -node.scroll.offset.y);
						}
						if (!hasTransform(node.latestValues)) continue;
						transformBox(withTransforms, node.latestValues, node.layout?.layoutBox);
					}
					if (hasTransform(this.latestValues)) transformBox(withTransforms, this.latestValues, this.layout?.layoutBox);
					return withTransforms;
				}
				removeTransform(box) {
					const boxWithoutTransform = createBox();
					copyBoxInto(boxWithoutTransform, box);
					for (let i = 0; i < this.path.length; i++) {
						const node = this.path[i];
						if (!hasTransform(node.latestValues)) continue;
						let sourceBox;
						if (node.instance) {
							hasScale(node.latestValues) && node.updateSnapshot();
							sourceBox = createBox();
							copyBoxInto(sourceBox, node.measurePageBox());
						}
						removeBoxTransforms(boxWithoutTransform, node.latestValues, node.snapshot?.layoutBox, sourceBox);
					}
					if (hasTransform(this.latestValues)) removeBoxTransforms(boxWithoutTransform, this.latestValues);
					return boxWithoutTransform;
				}
				setTargetDelta(delta) {
					this.targetDelta = delta;
					this.root.scheduleUpdateProjection();
					this.isProjectionDirty = true;
				}
				setOptions(options) {
					this.options = {
						...this.options,
						...options,
						crossfade: options.crossfade !== void 0 ? options.crossfade : true
					};
				}
				clearMeasurements() {
					this.scroll = void 0;
					this.layout = void 0;
					this.snapshot = void 0;
					this.prevTransformTemplateValue = void 0;
					this.targetDelta = void 0;
					this.target = void 0;
					this.isLayoutDirty = false;
				}
				forceRelativeParentToResolveTarget() {
					if (!this.relativeParent) return;
					/**
					* If the parent target isn't up-to-date, force it to update.
					* This is an unfortunate de-optimisation as it means any updating relative
					* projection will cause all the relative parents to recalculate back
					* up the tree.
					*/
					if (this.relativeParent.resolvedRelativeTargetAt !== frameData.timestamp) this.relativeParent.resolveTargetDelta(true);
				}
				resolveTargetDelta(forceRecalculation = false) {
					/**
					* Once the dirty status of nodes has been spread through the tree, we also
					* need to check if we have a shared node of a different depth that has itself
					* been dirtied.
					*/
					const lead = this.getLead();
					this.isProjectionDirty || (this.isProjectionDirty = lead.isProjectionDirty);
					this.isTransformDirty || (this.isTransformDirty = lead.isTransformDirty);
					this.isSharedProjectionDirty || (this.isSharedProjectionDirty = lead.isSharedProjectionDirty);
					const isShared = Boolean(this.resumingFrom) || this !== lead;
					if (!(forceRecalculation || isShared && this.isSharedProjectionDirty || this.isProjectionDirty || this.parent?.isProjectionDirty || this.attemptToResolveRelativeTarget || this.root.updateBlockedByResize)) return;
					const { layout, layoutId } = this.options;
					/**
					* If we have no layout, we can't perform projection, so early return
					*/
					if (!this.layout || !(layout || layoutId)) return;
					this.resolvedRelativeTargetAt = frameData.timestamp;
					const relativeParent = this.getClosestProjectingParent();
					if (relativeParent && this.linkedParentVersion !== relativeParent.layoutVersion && !relativeParent.options.layoutRoot) this.removeRelativeTarget();
					/**
					* If we don't have a targetDelta but do have a layout, we can attempt to resolve
					* a relativeParent. This will allow a component to perform scale correction
					* even if no animation has started.
					*/
					if (!this.targetDelta && !this.relativeTarget) if (this.options.layoutAnchor !== false && relativeParent && relativeParent.layout) this.createRelativeTarget(relativeParent, this.layout.layoutBox, relativeParent.layout.layoutBox);
					else this.removeRelativeTarget();
					/**
					* If we have no relative target or no target delta our target isn't valid
					* for this frame.
					*/
					if (!this.relativeTarget && !this.targetDelta) return;
					/**
					* Lazy-init target data structure
					*/
					if (!this.target) {
						this.target = createBox();
						this.targetWithTransforms = createBox();
					}
					/**
					* If we've got a relative box for this component, resolve it into a target relative to the parent.
					*/
					if (this.relativeTarget && this.relativeTargetOrigin && this.relativeParent && this.relativeParent.target) {
						this.forceRelativeParentToResolveTarget();
						calcRelativeBox(this.target, this.relativeTarget, this.relativeParent.target, this.options.layoutAnchor || void 0);
					} else if (this.targetDelta) {
						if (Boolean(this.resumingFrom)) this.applyTransform(this.layout.layoutBox, false, this.target);
						else copyBoxInto(this.target, this.layout.layoutBox);
						applyBoxDelta(this.target, this.targetDelta);
					} else
 /**
					* If no target, use own layout as target
					*/
					copyBoxInto(this.target, this.layout.layoutBox);
					/**
					* If we've been told to attempt to resolve a relative target, do so.
					*/
					if (this.attemptToResolveRelativeTarget) {
						this.attemptToResolveRelativeTarget = false;
						if (this.options.layoutAnchor !== false && relativeParent && Boolean(relativeParent.resumingFrom) === Boolean(this.resumingFrom) && !relativeParent.options.layoutScroll && relativeParent.target && this.animationProgress !== 1) this.createRelativeTarget(relativeParent, this.target, relativeParent.target);
						else this.relativeParent = this.relativeTarget = void 0;
					}
					/**
					* Increase debug counter for resolved target deltas
					*/
					if (statsBuffer.value) metrics.calculatedTargetDeltas++;
				}
				getClosestProjectingParent() {
					if (!this.parent || hasScale(this.parent.latestValues) || has2DTranslate(this.parent.latestValues)) return;
					if (this.parent.isProjecting()) return this.parent;
					else return this.parent.getClosestProjectingParent();
				}
				isProjecting() {
					return Boolean((this.relativeTarget || this.targetDelta || this.options.layoutRoot) && this.layout);
				}
				createRelativeTarget(relativeParent, layout, parentLayout) {
					this.relativeParent = relativeParent;
					this.linkedParentVersion = relativeParent.layoutVersion;
					this.forceRelativeParentToResolveTarget();
					this.relativeTarget = createBox();
					this.relativeTargetOrigin = createBox();
					calcRelativePosition(this.relativeTargetOrigin, layout, parentLayout, this.options.layoutAnchor || void 0);
					copyBoxInto(this.relativeTarget, this.relativeTargetOrigin);
				}
				removeRelativeTarget() {
					this.relativeParent = this.relativeTarget = void 0;
				}
				calcProjection() {
					const lead = this.getLead();
					const isShared = Boolean(this.resumingFrom) || this !== lead;
					let canSkip = true;
					/**
					* If this is a normal layout animation and neither this node nor its nearest projecting
					* is dirty then we can't skip.
					*/
					if (this.isProjectionDirty || this.parent?.isProjectionDirty) canSkip = false;
					/**
					* If this is a shared layout animation and this node's shared projection is dirty then
					* we can't skip.
					*/
					if (isShared && (this.isSharedProjectionDirty || this.isTransformDirty)) canSkip = false;
					/**
					* If we have resolved the target this frame we must recalculate the
					* projection to ensure it visually represents the internal calculations.
					*/
					if (this.resolvedRelativeTargetAt === frameData.timestamp) canSkip = false;
					if (canSkip) return;
					const { layout, layoutId } = this.options;
					/**
					* If this section of the tree isn't animating we can
					* delete our target sources for the following frame.
					*/
					this.isTreeAnimating = Boolean(this.parent && this.parent.isTreeAnimating || this.currentAnimation || this.pendingAnimation);
					if (!this.isTreeAnimating) this.targetDelta = this.relativeTarget = void 0;
					if (!this.layout || !(layout || layoutId)) return;
					/**
					* Reset the corrected box with the latest values from box, as we're then going
					* to perform mutative operations on it.
					*/
					copyBoxInto(this.layoutCorrected, this.layout.layoutBox);
					/**
					* Record previous tree scales before updating.
					*/
					const prevTreeScaleX = this.treeScale.x;
					const prevTreeScaleY = this.treeScale.y;
					/**
					* Apply all the parent deltas to this box to produce the corrected box. This
					* is the layout box, as it will appear on screen as a result of the transforms of its parents.
					*/
					applyTreeDeltas(this.layoutCorrected, this.treeScale, this.path, isShared);
					/**
					* If this layer needs to perform scale correction but doesn't have a target,
					* use the layout as the target.
					*/
					if (lead.layout && !lead.target && (this.treeScale.x !== 1 || this.treeScale.y !== 1)) {
						lead.target = lead.layout.layoutBox;
						lead.targetWithTransforms = createBox();
					}
					const { target } = lead;
					if (!target) {
						/**
						* If we don't have a target to project into, but we were previously
						* projecting, we want to remove the stored transform and schedule
						* a render to ensure the elements reflect the removed transform.
						*/
						if (this.prevProjectionDelta) {
							this.createProjectionDeltas();
							this.scheduleRender();
						}
						return;
					}
					if (!this.projectionDelta || !this.prevProjectionDelta) this.createProjectionDeltas();
					else {
						copyAxisDeltaInto(this.prevProjectionDelta.x, this.projectionDelta.x);
						copyAxisDeltaInto(this.prevProjectionDelta.y, this.projectionDelta.y);
					}
					/**
					* Update the delta between the corrected box and the target box before user-set transforms were applied.
					* This will allow us to calculate the corrected borderRadius and boxShadow to compensate
					* for our layout reprojection, but still allow them to be scaled correctly by the user.
					* It might be that to simplify this we may want to accept that user-set scale is also corrected
					* and we wouldn't have to keep and calc both deltas, OR we could support a user setting
					* to allow people to choose whether these styles are corrected based on just the
					* layout reprojection or the final bounding box.
					*/
					calcBoxDelta(this.projectionDelta, this.layoutCorrected, target, this.latestValues);
					if (this.treeScale.x !== prevTreeScaleX || this.treeScale.y !== prevTreeScaleY || !axisDeltaEquals(this.projectionDelta.x, this.prevProjectionDelta.x) || !axisDeltaEquals(this.projectionDelta.y, this.prevProjectionDelta.y)) {
						this.hasProjected = true;
						this.scheduleRender();
						this.notifyListeners("projectionUpdate", target);
					}
					/**
					* Increase debug counter for recalculated projections
					*/
					if (statsBuffer.value) metrics.calculatedProjections++;
				}
				hide() {
					this.isVisible = false;
				}
				show() {
					this.isVisible = true;
				}
				scheduleRender(notifyAll = true) {
					this.options.visualElement?.scheduleRender();
					if (notifyAll) {
						const stack = this.getStack();
						stack && stack.scheduleRender();
					}
					if (this.resumingFrom && !this.resumingFrom.instance) this.resumingFrom = void 0;
				}
				createProjectionDeltas() {
					this.prevProjectionDelta = createDelta();
					this.projectionDelta = createDelta();
					this.projectionDeltaWithTransform = createDelta();
				}
				setAnimationOrigin(delta, hasOnlyRelativeTargetChanged = false, pathFn) {
					const snapshot = this.snapshot;
					const snapshotLatestValues = snapshot ? snapshot.latestValues : {};
					const mixedValues = { ...this.latestValues };
					const targetDelta = createDelta();
					if (!this.relativeParent || !this.relativeParent.options.layoutRoot) this.relativeTarget = this.relativeTargetOrigin = void 0;
					this.attemptToResolveRelativeTarget = !hasOnlyRelativeTargetChanged;
					const relativeLayout = createBox();
					const isSharedLayoutAnimation = (snapshot ? snapshot.source : void 0) !== (this.layout ? this.layout.source : void 0);
					const stack = this.getStack();
					const isOnlyMember = !stack || stack.members.length <= 1;
					const shouldCrossfadeOpacity = Boolean(isSharedLayoutAnimation && !isOnlyMember && this.options.crossfade === true && !this.path.some(hasOpacityCrossfade));
					this.animationProgress = 0;
					let prevRelativeTarget;
					const interpolate = pathFn?.interpolateProjection(delta);
					this.mixTargetDelta = (latest) => {
						const progress = latest / 1e3;
						const point = interpolate?.(progress);
						if (point) {
							targetDelta.x.translate = point.x;
							targetDelta.x.scale = mixNumber$1(delta.x.scale, 1, progress);
							targetDelta.x.origin = delta.x.origin;
							targetDelta.x.originPoint = delta.x.originPoint;
							targetDelta.y.translate = point.y;
							targetDelta.y.scale = mixNumber$1(delta.y.scale, 1, progress);
							targetDelta.y.origin = delta.y.origin;
							targetDelta.y.originPoint = delta.y.originPoint;
						} else {
							mixAxisDeltaLinear(targetDelta.x, delta.x, progress);
							mixAxisDeltaLinear(targetDelta.y, delta.y, progress);
						}
						this.setTargetDelta(targetDelta);
						if (this.relativeTarget && this.relativeTargetOrigin && this.layout && this.relativeParent && this.relativeParent.layout) {
							calcRelativePosition(relativeLayout, this.layout.layoutBox, this.relativeParent.layout.layoutBox, this.options.layoutAnchor || void 0);
							mixBox(this.relativeTarget, this.relativeTargetOrigin, relativeLayout, progress);
							/**
							* If this is an unchanged relative target we can consider the
							* projection not dirty.
							*/
							if (prevRelativeTarget && boxEquals(this.relativeTarget, prevRelativeTarget)) this.isProjectionDirty = false;
							if (!prevRelativeTarget) prevRelativeTarget = createBox();
							copyBoxInto(prevRelativeTarget, this.relativeTarget);
						}
						if (isSharedLayoutAnimation) {
							this.animationValues = mixedValues;
							mixValues(mixedValues, snapshotLatestValues, this.latestValues, progress, shouldCrossfadeOpacity, isOnlyMember);
						}
						if (point && point.rotate !== void 0) {
							if (!this.animationValues) this.animationValues = mixedValues;
							this.animationValues.pathRotation = point.rotate;
						}
						this.root.scheduleUpdateProjection();
						this.scheduleRender();
						this.animationProgress = progress;
					};
					this.mixTargetDelta(this.options.layoutRoot ? 1e3 : 0);
				}
				startAnimation(options) {
					this.notifyListeners("animationStart");
					this.currentAnimation?.stop();
					this.resumingFrom?.currentAnimation?.stop();
					if (this.pendingAnimation) {
						cancelFrame(this.pendingAnimation);
						this.pendingAnimation = void 0;
					}
					/**
					* Start the animation in the next frame to have a frame with progress 0,
					* where the target is the same as when the animation started, so we can
					* calculate the relative positions correctly for instant transitions.
					*/
					this.pendingAnimation = frame.update(() => {
						globalProjectionState.hasAnimatedSinceResize = true;
						this.motionValue || (this.motionValue = motionValue(0));
						this.motionValue.jump(0, false);
						this.currentAnimation = animateSingleValue(this.motionValue, [0, 1e3], {
							...options,
							velocity: 0,
							isSync: true,
							onUpdate: (latest) => {
								this.mixTargetDelta(latest);
								options.onUpdate && options.onUpdate(latest);
							},
							onComplete: () => {
								options.onComplete && options.onComplete();
								this.completeAnimation();
							}
						});
						if (this.resumingFrom) this.resumingFrom.currentAnimation = this.currentAnimation;
						this.pendingAnimation = void 0;
					});
				}
				completeAnimation() {
					if (this.resumingFrom) {
						this.resumingFrom.currentAnimation = void 0;
						this.resumingFrom.preserveOpacity = void 0;
					}
					const stack = this.getStack();
					stack && stack.exitAnimationComplete();
					this.resumingFrom = this.currentAnimation = this.animationValues = void 0;
					this.notifyListeners("animationComplete");
				}
				finishAnimation() {
					if (this.currentAnimation) {
						this.mixTargetDelta && this.mixTargetDelta(animationTarget);
						this.currentAnimation.stop();
					}
					this.completeAnimation();
				}
				applyTransformsToTarget() {
					const lead = this.getLead();
					let { targetWithTransforms, target, layout, latestValues } = lead;
					if (!targetWithTransforms || !target || !layout) return;
					/**
					* If we're only animating position, and this element isn't the lead element,
					* then instead of projecting into the lead box we instead want to calculate
					* a new target that aligns the two boxes but maintains the layout shape.
					*/
					if (this !== lead && this.layout && layout && shouldAnimatePositionOnly(this.options.animationType, this.layout.layoutBox, layout.layoutBox)) {
						target = this.target || createBox();
						const xLength = calcLength(this.layout.layoutBox.x);
						target.x.min = lead.target.x.min;
						target.x.max = target.x.min + xLength;
						const yLength = calcLength(this.layout.layoutBox.y);
						target.y.min = lead.target.y.min;
						target.y.max = target.y.min + yLength;
					}
					copyBoxInto(targetWithTransforms, target);
					/**
					* Apply the latest user-set transforms to the targetBox to produce the targetBoxFinal.
					* This is the final box that we will then project into by calculating a transform delta and
					* applying it to the corrected box.
					*/
					transformBox(targetWithTransforms, latestValues);
					/**
					* Update the delta between the corrected box and the final target box, after
					* user-set transforms are applied to it. This will be used by the renderer to
					* create a transform style that will reproject the element from its layout layout
					* into the desired bounding box.
					*/
					calcBoxDelta(this.projectionDeltaWithTransform, this.layoutCorrected, targetWithTransforms, latestValues);
				}
				registerSharedNode(layoutId, node) {
					if (!this.sharedNodes.has(layoutId)) this.sharedNodes.set(layoutId, new NodeStack());
					this.sharedNodes.get(layoutId).add(node);
					const config = node.options.initialPromotionConfig;
					node.promote({
						transition: config ? config.transition : void 0,
						preserveFollowOpacity: config && config.shouldPreserveFollowOpacity ? config.shouldPreserveFollowOpacity(node) : void 0
					});
				}
				isLead() {
					const stack = this.getStack();
					return stack ? stack.lead === this : true;
				}
				getLead() {
					const { layoutId } = this.options;
					return layoutId ? this.getStack()?.lead || this : this;
				}
				getPrevLead() {
					const { layoutId } = this.options;
					return layoutId ? this.getStack()?.prevLead : void 0;
				}
				getStack() {
					const { layoutId } = this.options;
					if (layoutId) return this.root.sharedNodes.get(layoutId);
				}
				promote({ needsReset, transition, preserveFollowOpacity } = {}) {
					const stack = this.getStack();
					if (stack) stack.promote(this, preserveFollowOpacity);
					if (needsReset) {
						this.projectionDelta = void 0;
						this.needsReset = true;
					}
					if (transition) this.setOptions({ transition });
				}
				relegate() {
					const stack = this.getStack();
					if (stack) return stack.relegate(this);
					else return false;
				}
				resetSkewAndRotation() {
					const { visualElement } = this.options;
					if (!visualElement) return;
					let hasDistortingTransform = false;
					/**
					* An unrolled check for rotation values. Most elements don't have any rotation and
					* skipping the nested loop and new object creation is 50% faster.
					*/
					const { latestValues } = visualElement;
					if (latestValues.z || latestValues.rotate || latestValues.rotateX || latestValues.rotateY || latestValues.rotateZ || latestValues.skewX || latestValues.skewY) hasDistortingTransform = true;
					if (!hasDistortingTransform) return;
					const resetValues = {};
					if (latestValues.z) resetDistortingTransform("z", visualElement, resetValues, this.animationValues);
					for (let i = 0; i < transformAxes.length; i++) {
						resetDistortingTransform(`rotate${transformAxes[i]}`, visualElement, resetValues, this.animationValues);
						resetDistortingTransform(`skew${transformAxes[i]}`, visualElement, resetValues, this.animationValues);
					}
					visualElement.render();
					for (const key in resetValues) {
						visualElement.setStaticValue(key, resetValues[key]);
						if (this.animationValues) this.animationValues[key] = resetValues[key];
					}
					visualElement.scheduleRender();
				}
				applyProjectionStyles(targetStyle, styleProp) {
					if (!this.instance || this.isSVG) return;
					if (!this.isVisible) {
						targetStyle.visibility = "hidden";
						return;
					}
					const transformTemplate = this.getTransformTemplate();
					if (this.needsReset) {
						this.needsReset = false;
						targetStyle.visibility = "";
						targetStyle.opacity = "";
						targetStyle.pointerEvents = resolveMotionValue(styleProp?.pointerEvents) || "";
						targetStyle.transform = transformTemplate ? transformTemplate(this.latestValues, "") : "none";
						return;
					}
					const lead = this.getLead();
					if (!this.projectionDelta || !this.layout || !lead.target) {
						if (this.options.layoutId) {
							targetStyle.opacity = this.latestValues.opacity !== void 0 ? this.latestValues.opacity : 1;
							targetStyle.pointerEvents = resolveMotionValue(styleProp?.pointerEvents) || "";
						}
						if (this.hasProjected && !hasTransform(this.latestValues)) {
							targetStyle.transform = transformTemplate ? transformTemplate({}, "") : "none";
							this.hasProjected = false;
						}
						return;
					}
					targetStyle.visibility = "";
					const valuesToRender = lead.animationValues || lead.latestValues;
					this.applyTransformsToTarget();
					let transform = buildProjectionTransform(this.projectionDeltaWithTransform, this.treeScale, valuesToRender);
					if (transformTemplate) transform = transformTemplate(valuesToRender, transform);
					targetStyle.transform = transform;
					const { x, y } = this.projectionDelta;
					targetStyle.transformOrigin = `${x.origin * 100}% ${y.origin * 100}% 0`;
					if (lead.animationValues)
 /**
					* If the lead component is animating, assign this either the entering/leaving
					* opacity
					*/
					targetStyle.opacity = lead === this ? valuesToRender.opacity ?? this.latestValues.opacity ?? 1 : this.preserveOpacity ? this.latestValues.opacity : valuesToRender.opacityExit;
					else
 /**
					* Or we're not animating at all, set the lead component to its layout
					* opacity and other components to hidden.
					*/
					targetStyle.opacity = lead === this ? valuesToRender.opacity !== void 0 ? valuesToRender.opacity : "" : valuesToRender.opacityExit !== void 0 ? valuesToRender.opacityExit : 0;
					/**
					* Apply scale correction
					*/
					for (const key in scaleCorrectors) {
						if (valuesToRender[key] === void 0) continue;
						const { correct, applyTo, isCSSVariable } = scaleCorrectors[key];
						/**
						* Only apply scale correction to the value if we have an
						* active projection transform. Otherwise these values become
						* vulnerable to distortion if the element changes size without
						* a corresponding layout animation.
						*/
						const corrected = transform === "none" ? valuesToRender[key] : correct(valuesToRender[key], lead);
						if (applyTo) {
							const num = applyTo.length;
							for (let i = 0; i < num; i++) targetStyle[applyTo[i]] = corrected;
						} else if (isCSSVariable) this.options.visualElement.renderState.vars[key] = corrected;
						else targetStyle[key] = corrected;
					}
					/**
					* Disable pointer events on follow components. This is to ensure
					* that if a follow component covers a lead component it doesn't block
					* pointer events on the lead.
					*/
					if (this.options.layoutId) targetStyle.pointerEvents = lead === this ? resolveMotionValue(styleProp?.pointerEvents) || "" : "none";
				}
				clearSnapshot() {
					this.resumeFrom = this.snapshot = void 0;
				}
				resetTree() {
					this.root.nodes.forEach((node) => node.currentAnimation?.stop());
					this.root.nodes.forEach(clearMeasurements);
					this.root.sharedNodes.clear();
				}
			};
		}
		function updateLayout(node) {
			node.updateLayout();
		}
		function notifyLayoutUpdate(node) {
			const snapshot = node.resumeFrom?.snapshot || node.snapshot;
			if (node.isLead() && node.layout && snapshot && node.hasListeners("didUpdate")) {
				const { layoutBox: layout, measuredBox: measuredLayout } = node.layout;
				const { animationType } = node.options;
				const isShared = snapshot.source !== node.layout.source;
				if (animationType === "size") eachAxis((axis) => {
					const axisSnapshot = isShared ? snapshot.measuredBox[axis] : snapshot.layoutBox[axis];
					const length = calcLength(axisSnapshot);
					axisSnapshot.min = layout[axis].min;
					axisSnapshot.max = axisSnapshot.min + length;
				});
				else if (animationType === "x" || animationType === "y") {
					const snapAxis = animationType === "x" ? "y" : "x";
					copyAxisInto(isShared ? snapshot.measuredBox[snapAxis] : snapshot.layoutBox[snapAxis], layout[snapAxis]);
				} else if (shouldAnimatePositionOnly(animationType, snapshot.layoutBox, layout)) eachAxis((axis) => {
					const axisSnapshot = isShared ? snapshot.measuredBox[axis] : snapshot.layoutBox[axis];
					const length = calcLength(layout[axis]);
					axisSnapshot.max = axisSnapshot.min + length;
					/**
					* Ensure relative target gets resized and rerendererd
					*/
					if (node.relativeTarget && !node.currentAnimation) {
						node.isProjectionDirty = true;
						node.relativeTarget[axis].max = node.relativeTarget[axis].min + length;
					}
				});
				const layoutDelta = createDelta();
				calcBoxDelta(layoutDelta, layout, snapshot.layoutBox);
				const visualDelta = createDelta();
				if (isShared) calcBoxDelta(visualDelta, node.applyTransform(measuredLayout, true), snapshot.measuredBox);
				else calcBoxDelta(visualDelta, layout, snapshot.layoutBox);
				const hasLayoutChanged = !isDeltaZero(layoutDelta);
				let hasRelativeLayoutChanged = false;
				if (!node.resumeFrom) {
					const relativeParent = node.getClosestProjectingParent();
					/**
					* If the relativeParent is itself resuming from a different element then
					* the relative snapshot is not relavent
					*/
					if (relativeParent && !relativeParent.resumeFrom) {
						const { snapshot: parentSnapshot, layout: parentLayout } = relativeParent;
						if (parentSnapshot && parentLayout) {
							const anchor = node.options.layoutAnchor || void 0;
							const relativeSnapshot = createBox();
							calcRelativePosition(relativeSnapshot, snapshot.layoutBox, parentSnapshot.layoutBox, anchor);
							const relativeLayout = createBox();
							calcRelativePosition(relativeLayout, layout, parentLayout.layoutBox, anchor);
							if (!boxEqualsRounded(relativeSnapshot, relativeLayout)) hasRelativeLayoutChanged = true;
							if (relativeParent.options.layoutRoot) {
								node.relativeTarget = relativeLayout;
								node.relativeTargetOrigin = relativeSnapshot;
								node.relativeParent = relativeParent;
							}
						}
					}
				}
				node.notifyListeners("didUpdate", {
					layout,
					snapshot,
					delta: visualDelta,
					layoutDelta,
					hasLayoutChanged,
					hasRelativeLayoutChanged
				});
			} else if (node.isLead()) {
				const { onExitComplete } = node.options;
				onExitComplete && onExitComplete();
			}
			/**
			* Clearing transition
			* TODO: Investigate why this transition is being passed in as {type: false } from Framer
			* and why we need it at all
			*/
			node.options.transition = void 0;
		}
		function propagateDirtyNodes(node) {
			/**
			* Increase debug counter for nodes encountered this frame
			*/
			if (statsBuffer.value) metrics.nodes++;
			if (!node.parent) return;
			/**
			* If this node isn't projecting, propagate isProjectionDirty. It will have
			* no performance impact but it will allow the next child that *is* projecting
			* but *isn't* dirty to just check its parent to see if *any* ancestor needs
			* correcting.
			*/
			if (!node.isProjecting()) node.isProjectionDirty = node.parent.isProjectionDirty;
			/**
			* Propagate isSharedProjectionDirty and isTransformDirty
			* throughout the whole tree. A future revision can take another look at
			* this but for safety we still recalcualte shared nodes.
			*/
			node.isSharedProjectionDirty || (node.isSharedProjectionDirty = Boolean(node.isProjectionDirty || node.parent.isProjectionDirty || node.parent.isSharedProjectionDirty));
			node.isTransformDirty || (node.isTransformDirty = node.parent.isTransformDirty);
		}
		function cleanDirtyNodes(node) {
			node.isProjectionDirty = node.isSharedProjectionDirty = node.isTransformDirty = false;
		}
		function clearSnapshot(node) {
			node.clearSnapshot();
		}
		function clearMeasurements(node) {
			node.clearMeasurements();
		}
		function forceLayoutMeasure(node) {
			node.isLayoutDirty = true;
			node.updateLayout();
		}
		function clearIsLayoutDirty(node) {
			node.isLayoutDirty = false;
		}
		/**
		* When a node is animation-blocked (e.g. during drag) and its component
		* didn't re-render (memoized), willUpdate() is never called so there's
		* no snapshot. Use the previous layout as a snapshot and mark dirty so
		* resetTransform/updateLayout/notifyLayoutUpdate process it normally.
		*/
		function ensureDraggedNodesSnapshotted(node) {
			if (node.isAnimationBlocked && node.layout && !node.isLayoutDirty) {
				node.snapshot = node.layout;
				node.isLayoutDirty = true;
			}
		}
		function resetTransformStyle(node) {
			const { visualElement } = node.options;
			if (visualElement && visualElement.getProps().onBeforeLayoutMeasure) visualElement.notify("BeforeLayoutMeasure");
			node.resetTransform();
		}
		function finishAnimation(node) {
			node.finishAnimation();
			node.targetDelta = node.relativeTarget = node.target = void 0;
			node.isProjectionDirty = true;
		}
		function resolveTargetDelta(node) {
			node.resolveTargetDelta();
		}
		function calcProjection(node) {
			node.calcProjection();
		}
		function resetSkewAndRotation(node) {
			node.resetSkewAndRotation();
		}
		function removeLeadSnapshots(stack) {
			stack.removeLeadSnapshot();
		}
		function mixAxisDeltaLinear(output, delta, p) {
			output.translate = mixNumber$1(delta.translate, 0, p);
			output.scale = mixNumber$1(delta.scale, 1, p);
			output.origin = delta.origin;
			output.originPoint = delta.originPoint;
		}
		function mixAxis(output, from, to, p) {
			output.min = mixNumber$1(from.min, to.min, p);
			output.max = mixNumber$1(from.max, to.max, p);
		}
		function mixBox(output, from, to, p) {
			mixAxis(output.x, from.x, to.x, p);
			mixAxis(output.y, from.y, to.y, p);
		}
		function hasOpacityCrossfade(node) {
			return node.animationValues && node.animationValues.opacityExit !== void 0;
		}
		const defaultLayoutTransition = {
			duration: .45,
			ease: [
				.4,
				0,
				.1,
				1
			]
		};
		const userAgentContains = (string) => typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().includes(string);
		/**
		* Measured bounding boxes must be rounded in Safari and
		* left untouched in Chrome, otherwise non-integer layouts within scaled-up elements
		* can appear to jump.
		*/
		const roundPoint = userAgentContains("applewebkit/") && !userAgentContains("chrome/") ? Math.round : noop;
		function roundAxis(axis) {
			axis.min = roundPoint(axis.min);
			axis.max = roundPoint(axis.max);
		}
		function roundBox(box) {
			roundAxis(box.x);
			roundAxis(box.y);
		}
		function shouldAnimatePositionOnly(animationType, snapshot, layout) {
			return animationType === "position" || animationType === "preserve-aspect" && !isNear(aspectRatio(snapshot), aspectRatio(layout), .2);
		}
		function checkNodeWasScrollRoot(node) {
			return node !== node.root && node.scroll?.wasRoot;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/projection/node/DocumentProjectionNode.mjs
		const DocumentProjectionNode = createProjectionNode$1({
			attachResizeListener: (ref, notify) => addDomEvent(ref, "resize", notify),
			measureScroll: () => ({
				x: document.documentElement.scrollLeft || document.body?.scrollLeft || 0,
				y: document.documentElement.scrollTop || document.body?.scrollTop || 0
			}),
			checkIsScrollRoot: () => true
		});
		//#endregion
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/projection/node/HTMLProjectionNode.mjs
		const rootProjectionNode = { current: void 0 };
		const HTMLProjectionNode = createProjectionNode$1({
			measureScroll: (instance) => ({
				x: instance.scrollLeft,
				y: instance.scrollTop
			}),
			defaultParent: () => {
				if (!rootProjectionNode.current) {
					const documentNode = new DocumentProjectionNode({});
					documentNode.mount(window);
					documentNode.setOptions({ layoutScroll: true });
					rootProjectionNode.current = documentNode;
				}
				return rootProjectionNode.current;
			},
			resetTransform: (instance, value) => {
				instance.style.transform = value !== void 0 ? value : "none";
			},
			checkIsScrollRoot: (instance) => Boolean(window.getComputedStyle(instance).position === "fixed")
		});
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/context/MotionConfigContext.mjs
		/**
		* @public
		*/
		const MotionConfigContext = (0, react.createContext)({
			transformPagePoint: (p) => p,
			isStatic: false,
			reducedMotion: "never"
		});
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/utils/use-composed-ref.mjs
		/**
		* Taken from https://github.com/radix-ui/primitives/blob/main/packages/react/compose-refs/src/compose-refs.tsx
		*/
		/**
		* Set a given ref to a given value
		* This utility takes care of different types of refs: callback refs and RefObject(s)
		*/
		function setRef(ref, value) {
			if (typeof ref === "function") return ref(value);
			else if (ref !== null && ref !== void 0) ref.current = value;
		}
		/**
		* A utility to compose multiple refs together
		* Accepts callback refs and RefObject(s)
		*/
		function composeRefs(...refs) {
			return (node) => {
				let hasCleanup = false;
				const cleanups = refs.map((ref) => {
					const cleanup = setRef(ref, node);
					if (!hasCleanup && typeof cleanup === "function") hasCleanup = true;
					return cleanup;
				});
				if (hasCleanup) return () => {
					for (let i = 0; i < cleanups.length; i++) {
						const cleanup = cleanups[i];
						if (typeof cleanup === "function") cleanup();
						else setRef(refs[i], null);
					}
				};
			};
		}
		/**
		* A custom hook that composes multiple refs
		* Accepts callback refs and RefObject(s)
		*/
		function useComposedRefs(...refs) {
			return react.useCallback(composeRefs(...refs), refs);
		}
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/components/AnimatePresence/PopChild.mjs
		/**
		* Measurement functionality has to be within a separate component
		* to leverage snapshot lifecycle.
		*/
		var PopChildMeasure = class extends react.Component {
			getSnapshotBeforeUpdate(prevProps) {
				const element = this.props.childRef.current;
				if (isHTMLElement(element) && prevProps.isPresent && !this.props.isPresent && this.props.pop !== false) {
					const parent = element.offsetParent;
					const parentWidth = isHTMLElement(parent) ? parent.offsetWidth || 0 : 0;
					const parentHeight = isHTMLElement(parent) ? parent.offsetHeight || 0 : 0;
					const computedStyle = getComputedStyle(element);
					const size = this.props.sizeRef.current;
					size.height = parseFloat(computedStyle.height);
					size.width = parseFloat(computedStyle.width);
					size.top = element.offsetTop;
					size.left = element.offsetLeft;
					size.right = parentWidth - size.width - size.left;
					size.bottom = parentHeight - size.height - size.top;
					size.direction = computedStyle.direction;
				}
				return null;
			}
			/**
			* Required with getSnapshotBeforeUpdate to stop React complaining.
			*/
			componentDidUpdate() {}
			render() {
				return this.props.children;
			}
		};
		function PopChild({ children, isPresent, anchorX, anchorY, root, pop }) {
			const id = (0, react.useId)();
			const ref = (0, react.useRef)(null);
			const size = (0, react.useRef)({
				width: 0,
				height: 0,
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				direction: "ltr"
			});
			const { nonce } = (0, react.useContext)(MotionConfigContext);
			const composedRef = useComposedRefs(ref, pop !== false ? children.props?.ref ?? children?.ref : void 0);
			/**
			* We create and inject a style block so we can apply this explicit
			* sizing in a non-destructive manner by just deleting the style block.
			*
			* We can't apply size via render as the measurement happens
			* in getSnapshotBeforeUpdate (post-render), likewise if we apply the
			* styles directly on the DOM node, we might be overwriting
			* styles set via the style prop.
			*/
			(0, react.useInsertionEffect)(() => {
				const { width, height, top, left, right, bottom, direction } = size.current;
				if (isPresent || pop === false || !ref.current || !width || !height) return;
				const isRTL = direction === "rtl";
				const x = anchorX === "left" ? isRTL ? `right: ${right}` : `left: ${left}` : isRTL ? `left: ${left}` : `right: ${right}`;
				const y = anchorY === "bottom" ? `bottom: ${bottom}` : `top: ${top}`;
				ref.current.dataset.motionPopId = id;
				const style = document.createElement("style");
				if (nonce) style.nonce = nonce;
				const parent = root ?? document.head;
				parent.appendChild(style);
				if (style.sheet) style.sheet.insertRule(`
          [data-motion-pop-id="${id}"] {
            position: absolute !important;
            width: ${width}px !important;
            height: ${height}px !important;
            ${x}px !important;
            ${y}px !important;
          }
        `);
				return () => {
					ref.current?.removeAttribute("data-motion-pop-id");
					if (parent.contains(style)) parent.removeChild(style);
				};
			}, [isPresent]);
			return (0, react_jsx_runtime.jsx)(PopChildMeasure, {
				isPresent,
				childRef: ref,
				sizeRef: size,
				pop,
				children: pop === false ? children : react.cloneElement(children, { ref: composedRef })
			});
		}
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/components/AnimatePresence/PresenceChild.mjs
		const PresenceChild = ({ children, initial, isPresent, onExitComplete, custom, presenceAffectsLayout, mode, anchorX, anchorY, root }) => {
			const presenceChildren = useConstant(newChildrenMap);
			const id = (0, react.useId)();
			const isPresentRef = (0, react.useRef)(isPresent);
			const onExitCompleteRef = (0, react.useRef)(onExitComplete);
			useIsomorphicLayoutEffect(() => {
				isPresentRef.current = isPresent;
				onExitCompleteRef.current = onExitComplete;
			});
			let isReusedContext = true;
			let context = (0, react.useMemo)(() => {
				isReusedContext = false;
				return {
					id,
					initial,
					isPresent,
					custom,
					onExitComplete: (childId) => {
						presenceChildren.set(childId, true);
						for (const isComplete of presenceChildren.values()) if (!isComplete) return;
						onExitComplete && onExitComplete();
					},
					register: (childId) => {
						presenceChildren.set(childId, false);
						return () => {
							presenceChildren.delete(childId);
							!isPresentRef.current && !presenceChildren.size && onExitCompleteRef.current?.();
						};
					}
				};
			}, [
				isPresent,
				presenceChildren,
				onExitComplete
			]);
			/**
			* If the presence of a child affects the layout of the components around it,
			* we want to make a new context value to ensure they get re-rendered
			* so they can detect that layout change.
			*/
			if (presenceAffectsLayout && isReusedContext) context = { ...context };
			(0, react.useMemo)(() => {
				presenceChildren.forEach((_, key) => presenceChildren.set(key, false));
			}, [isPresent]);
			/**
			* If there's no `motion` components to fire exit animations, we want to remove this
			* component immediately.
			*/
			react.useEffect(() => {
				!isPresent && !presenceChildren.size && onExitComplete && onExitComplete();
			}, [isPresent]);
			children = (0, react_jsx_runtime.jsx)(PopChild, {
				pop: mode === "popLayout",
				isPresent,
				anchorX,
				anchorY,
				root,
				children
			});
			return (0, react_jsx_runtime.jsx)(PresenceContext.Provider, {
				value: context,
				children
			});
		};
		function newChildrenMap() {
			return /* @__PURE__ */ new Map();
		}
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/components/AnimatePresence/use-presence.mjs
		/**
		* When a component is the child of `AnimatePresence`, it can use `usePresence`
		* to access information about whether it's still present in the React tree.
		*
		* ```jsx
		* import { usePresence } from "framer-motion"
		*
		* export const Component = () => {
		*   const [isPresent, safeToRemove] = usePresence()
		*
		*   useEffect(() => {
		*     !isPresent && setTimeout(safeToRemove, 1000)
		*   }, [isPresent])
		*
		*   return <div />
		* }
		* ```
		*
		* If `isPresent` is `false`, it means that a component has been removed from the tree,
		* but `AnimatePresence` won't really remove it until `safeToRemove` has been called.
		*
		* @public
		*/
		function usePresence(subscribe = true) {
			const context = (0, react.useContext)(PresenceContext);
			if (context === null) return [true, null];
			const { isPresent, onExitComplete, register } = context;
			const id = (0, react.useId)();
			(0, react.useEffect)(() => {
				if (subscribe) return register(id);
			}, [subscribe]);
			const safeToRemove = (0, react.useCallback)(() => subscribe && onExitComplete && onExitComplete(id), [
				id,
				onExitComplete,
				subscribe
			]);
			return !isPresent && onExitComplete ? [false, safeToRemove] : [true];
		}
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/components/AnimatePresence/utils.mjs
		const getChildKey = (child) => child.key || "";
		function onlyElements(children) {
			const filtered = [];
			react.Children.forEach(children, (child) => {
				if ((0, react.isValidElement)(child)) filtered.push(child);
			});
			return filtered;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/components/AnimatePresence/index.mjs
		/**
		* `AnimatePresence` enables the animation of components that have been removed from the tree.
		*
		* When adding/removing more than a single child, every child **must** be given a unique `key` prop.
		*
		* Any `motion` components that have an `exit` property defined will animate out when removed from
		* the tree.
		*
		* ```jsx
		* import { motion, AnimatePresence } from 'framer-motion'
		*
		* export const Items = ({ items }) => (
		*   <AnimatePresence>
		*     {items.map(item => (
		*       <motion.div
		*         key={item.id}
		*         initial={{ opacity: 0 }}
		*         animate={{ opacity: 1 }}
		*         exit={{ opacity: 0 }}
		*       />
		*     ))}
		*   </AnimatePresence>
		* )
		* ```
		*
		* You can sequence exit animations throughout a tree using variants.
		*
		* If a child contains multiple `motion` components with `exit` props, it will only unmount the child
		* once all `motion` components have finished animating out. Likewise, any components using
		* `usePresence` all need to call `safeToRemove`.
		*
		* @public
		*/
		const AnimatePresence = ({ children, custom, initial = true, onExitComplete, presenceAffectsLayout = true, mode = "sync", propagate = false, anchorX = "left", anchorY = "top", root }) => {
			const [isParentPresent, safeToRemove] = usePresence(propagate);
			/**
			* Filter any children that aren't ReactElements. We can only track components
			* between renders with a props.key.
			*/
			const presentChildren = (0, react.useMemo)(() => onlyElements(children), [children]);
			/**
			* Track the keys of the currently rendered children. This is used to
			* determine which children are exiting.
			*/
			const presentKeys = propagate && !isParentPresent ? [] : presentChildren.map(getChildKey);
			/**
			* If `initial={false}` we only want to pass this to components in the first render.
			*/
			const isInitialRender = (0, react.useRef)(true);
			/**
			* A ref containing the currently present children. When all exit animations
			* are complete, we use this to re-render the component with the latest children
			* *committed* rather than the latest children *rendered*.
			*/
			const pendingPresentChildren = (0, react.useRef)(presentChildren);
			/**
			* Track which exiting children have finished animating out.
			*/
			const exitComplete = useConstant(() => /* @__PURE__ */ new Map());
			/**
			* Track which components are currently processing exit to prevent duplicate processing.
			*/
			const exitingComponents = (0, react.useRef)(/* @__PURE__ */ new Set());
			/**
			* Save children to render as React state. To ensure this component is concurrent-safe,
			* we check for exiting children via an effect.
			*/
			const [diffedChildren, setDiffedChildren] = (0, react.useState)(presentChildren);
			const [renderedChildren, setRenderedChildren] = (0, react.useState)(presentChildren);
			useIsomorphicLayoutEffect(() => {
				isInitialRender.current = false;
				pendingPresentChildren.current = presentChildren;
				/**
				* Update complete status of exiting children.
				*/
				for (let i = 0; i < renderedChildren.length; i++) {
					const key = getChildKey(renderedChildren[i]);
					if (!presentKeys.includes(key)) {
						if (exitComplete.get(key) !== true) exitComplete.set(key, false);
					} else {
						exitComplete.delete(key);
						exitingComponents.current.delete(key);
					}
				}
			}, [
				renderedChildren,
				presentKeys.length,
				presentKeys.join("-")
			]);
			const exitingChildren = [];
			if (presentChildren !== diffedChildren) {
				let nextChildren = [...presentChildren];
				/**
				* Loop through all the currently rendered components and decide which
				* are exiting.
				*/
				for (let i = 0; i < renderedChildren.length; i++) {
					const child = renderedChildren[i];
					const key = getChildKey(child);
					if (!presentKeys.includes(key)) {
						nextChildren.splice(i, 0, child);
						exitingChildren.push(child);
					}
				}
				/**
				* If we're in "wait" mode, and we have exiting children, we want to
				* only render these until they've all exited.
				*/
				if (mode === "wait" && exitingChildren.length) nextChildren = exitingChildren;
				setRenderedChildren(onlyElements(nextChildren));
				setDiffedChildren(presentChildren);
				/**
				* Early return to ensure once we've set state with the latest diffed
				* children, we can immediately re-render.
				*/
				return null;
			}
			/**
			* If we've been provided a forceRender function by the LayoutGroupContext,
			* we can use it to force a re-render amongst all surrounding components once
			* all components have finished animating out.
			*/
			const { forceRender } = (0, react.useContext)(LayoutGroupContext);
			return (0, react_jsx_runtime.jsx)(react_jsx_runtime.Fragment, { children: renderedChildren.map((child) => {
				const key = getChildKey(child);
				const isPresent = propagate && !isParentPresent ? false : presentChildren === renderedChildren || presentKeys.includes(key);
				const onExit = () => {
					if (exitingComponents.current.has(key)) return;
					if (exitComplete.has(key)) {
						exitingComponents.current.add(key);
						exitComplete.set(key, true);
					} else return;
					let isEveryExitComplete = true;
					exitComplete.forEach((isExitComplete) => {
						if (!isExitComplete) isEveryExitComplete = false;
					});
					if (isEveryExitComplete) {
						forceRender?.();
						setRenderedChildren(pendingPresentChildren.current);
						propagate && safeToRemove?.();
						onExitComplete && onExitComplete();
					}
				};
				return (0, react_jsx_runtime.jsx)(PresenceChild, {
					isPresent,
					initial: !isInitialRender.current || initial ? void 0 : false,
					custom,
					presenceAffectsLayout,
					mode,
					root,
					onExitComplete: isPresent ? void 0 : onExit,
					anchorX,
					anchorY,
					children: child
				}, key);
			}) });
		};
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/context/LazyContext.mjs
		const LazyContext = (0, react.createContext)({ strict: false });
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/motion/features/definitions.mjs
		const featureProps = {
			animation: [
				"animate",
				"variants",
				"whileHover",
				"whileTap",
				"exit",
				"whileInView",
				"whileFocus",
				"whileDrag"
			],
			exit: ["exit"],
			drag: ["drag", "dragControls"],
			focus: ["whileFocus"],
			hover: [
				"whileHover",
				"onHoverStart",
				"onHoverEnd"
			],
			tap: [
				"whileTap",
				"onTap",
				"onTapStart",
				"onTapCancel"
			],
			pan: [
				"onPan",
				"onPanStart",
				"onPanSessionStart",
				"onPanEnd"
			],
			inView: [
				"whileInView",
				"onViewportEnter",
				"onViewportLeave"
			],
			layout: ["layout", "layoutId"]
		};
		let isInitialized = false;
		/**
		* Initialize feature definitions with isEnabled checks.
		* This must be called before any motion components are rendered.
		*/
		function initFeatureDefinitions() {
			if (isInitialized) return;
			const initialFeatureDefinitions = {};
			for (const key in featureProps) initialFeatureDefinitions[key] = { isEnabled: (props) => featureProps[key].some((name) => !!props[name]) };
			setFeatureDefinitions(initialFeatureDefinitions);
			isInitialized = true;
		}
		/**
		* Get the current feature definitions, initializing if needed.
		*/
		function getInitializedFeatureDefinitions() {
			initFeatureDefinitions();
			return getFeatureDefinitions();
		}
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/motion/features/load-features.mjs
		function loadFeatures(features) {
			const featureDefinitions = getInitializedFeatureDefinitions();
			for (const key in features) featureDefinitions[key] = {
				...featureDefinitions[key],
				...features[key]
			};
			setFeatureDefinitions(featureDefinitions);
		}
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/components/LazyMotion/index.mjs
		/**
		* Used in conjunction with the `m` component to reduce bundle size.
		*
		* `m` is a version of the `motion` component that only loads functionality
		* critical for the initial render.
		*
		* `LazyMotion` can then be used to either synchronously or asynchronously
		* load animation and gesture support.
		*
		* ```jsx
		* // Synchronous loading
		* import { LazyMotion, m, domAnimation } from "framer-motion"
		*
		* function App() {
		*   return (
		*     <LazyMotion features={domAnimation}>
		*       <m.div animate={{ scale: 2 }} />
		*     </LazyMotion>
		*   )
		* }
		*
		* // Asynchronous loading
		* import { LazyMotion, m } from "framer-motion"
		*
		* function App() {
		*   return (
		*     <LazyMotion features={() => import('./path/to/domAnimation')}>
		*       <m.div animate={{ scale: 2 }} />
		*     </LazyMotion>
		*   )
		* }
		* ```
		*
		* @public
		*/
		function LazyMotion({ children, features, strict = false }) {
			const [, setIsLoaded] = (0, react.useState)(!isLazyBundle(features));
			const loadedRenderer = (0, react.useRef)(void 0);
			/**
			* If this is a synchronous load, load features immediately
			*/
			if (!isLazyBundle(features)) {
				const { renderer, ...loadedFeatures } = features;
				loadedRenderer.current = renderer;
				loadFeatures(loadedFeatures);
			}
			(0, react.useEffect)(() => {
				if (isLazyBundle(features)) features().then(({ renderer, ...loadedFeatures }) => {
					loadFeatures(loadedFeatures);
					loadedRenderer.current = renderer;
					setIsLoaded(true);
				});
			}, []);
			return (0, react_jsx_runtime.jsx)(LazyContext.Provider, {
				value: {
					renderer: loadedRenderer.current,
					strict
				},
				children
			});
		}
		function isLazyBundle(features) {
			return typeof features === "function";
		}
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/motion/utils/valid-prop.mjs
		/**
		* A list of all valid MotionProps.
		*
		* @privateRemarks
		* This doesn't throw if a `MotionProp` name is missing - it should.
		*/
		const validMotionProps = /* @__PURE__ */ new Set([
			"animate",
			"exit",
			"variants",
			"initial",
			"style",
			"values",
			"variants",
			"transition",
			"transformTemplate",
			"custom",
			"inherit",
			"onBeforeLayoutMeasure",
			"onAnimationStart",
			"onAnimationComplete",
			"onUpdate",
			"onDragStart",
			"onDrag",
			"onDragEnd",
			"onMeasureDragConstraints",
			"onDirectionLock",
			"onDragTransitionEnd",
			"_dragX",
			"_dragY",
			"onHoverStart",
			"onHoverEnd",
			"onViewportEnter",
			"onViewportLeave",
			"globalTapTarget",
			"propagate",
			"ignoreStrict",
			"viewport"
		]);
		/**
		* Check whether a prop name is a valid `MotionProp` key.
		*
		* @param key - Name of the property to check
		* @returns `true` is key is a valid `MotionProp`.
		*
		* @public
		*/
		function isValidMotionProp(key) {
			return key.startsWith("while") || key.startsWith("drag") && key !== "draggable" || key.startsWith("layout") || key.startsWith("onTap") || key.startsWith("onPan") || key.startsWith("onLayout") || validMotionProps.has(key);
		}
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/render/dom/utils/filter-props.mjs
		let shouldForward = (key) => !isValidMotionProp(key);
		function loadExternalIsValidProp(isValidProp) {
			if (typeof isValidProp !== "function") return;
			shouldForward = (key) => key.startsWith("on") ? !isValidMotionProp(key) : isValidProp(key);
		}
		/**
		* Emotion and Styled Components both allow users to pass through arbitrary props to their components
		* to dynamically generate CSS. They both use the `@emotion/is-prop-valid` package to determine which
		* of these should be passed to the underlying DOM node.
		*
		* However, when styling a Motion component `styled(motion.div)`, both packages pass through *all* props
		* as it's seen as an arbitrary component rather than a DOM node. Motion only allows arbitrary props
		* passed through the `custom` prop so it doesn't *need* the payload or computational overhead of
		* `@emotion/is-prop-valid`, however to fix this problem we need to use it.
		*
		* By making it an optionalDependency we can offer this functionality only in the situations where it's
		* actually required.
		*/
		try {
			loadExternalIsValidProp(require("@emotion/is-prop-valid").default);
		} catch {}
		function filterProps(props, isDom, forwardMotionProps) {
			const filteredProps = {};
			for (const key in props) {
				/**
				* values is considered a valid prop by Emotion, so if it's present
				* this will be rendered out to the DOM unless explicitly filtered.
				*
				* We check the type as it could be used with the `feColorMatrix`
				* element, which we support.
				*/
				if (key === "values" && typeof props.values === "object") continue;
				if (isMotionValue(props[key])) continue;
				if (shouldForward(key) || forwardMotionProps === true && isValidMotionProp(key) || !isDom && !isValidMotionProp(key) || props["draggable"] && key.startsWith("onDrag")) filteredProps[key] = props[key];
			}
			return filteredProps;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/components/MotionConfig/index.mjs
		/**
		* `MotionConfig` is used to set configuration options for all children `motion` components.
		*
		* ```jsx
		* import { motion, MotionConfig } from "framer-motion"
		*
		* export function App() {
		*   return (
		*     <MotionConfig transition={{ type: "spring" }}>
		*       <motion.div animate={{ x: 100 }} />
		*     </MotionConfig>
		*   )
		* }
		* ```
		*
		* @public
		*/
		function MotionConfig({ children, isValidProp, ...config }) {
			isValidProp && loadExternalIsValidProp(isValidProp);
			/**
			* Inherit props from any parent MotionConfig components
			*/
			const parentConfig = (0, react.useContext)(MotionConfigContext);
			config = {
				...parentConfig,
				...config
			};
			config.transition = resolveTransition(config.transition, parentConfig.transition);
			/**
			* Don't allow isStatic to change between renders as it affects how many hooks
			* motion components fire.
			*/
			config.isStatic = useConstant(() => config.isStatic);
			/**
			* Creating a new config context object will re-render every `motion` component
			* every time it renders. So we only want to create a new one sparingly.
			*/
			const context = (0, react.useMemo)(() => config, [
				JSON.stringify(config.transition),
				config.transformPagePoint,
				config.reducedMotion,
				config.skipAnimations
			]);
			return (0, react_jsx_runtime.jsx)(MotionConfigContext.Provider, {
				value: context,
				children
			});
		}
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/context/MotionContext/index.mjs
		const MotionContext = /* @__PURE__ */ (0, react.createContext)({});
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/context/MotionContext/utils.mjs
		function getCurrentTreeVariants(props, context) {
			if (isControllingVariants(props)) {
				const { initial, animate } = props;
				return {
					initial: initial === false || isVariantLabel(initial) ? initial : void 0,
					animate: isVariantLabel(animate) ? animate : void 0
				};
			}
			return props.inherit !== false ? context : {};
		}
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/context/MotionContext/create.mjs
		function useCreateMotionContext(props) {
			const { initial, animate } = getCurrentTreeVariants(props, (0, react.useContext)(MotionContext));
			return (0, react.useMemo)(() => ({
				initial,
				animate
			}), [variantLabelsAsDependency(initial), variantLabelsAsDependency(animate)]);
		}
		function variantLabelsAsDependency(prop) {
			return Array.isArray(prop) ? prop.join(" ") : prop;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/render/html/utils/create-render-state.mjs
		const createHtmlRenderState = () => ({
			style: {},
			transform: {},
			transformOrigin: {},
			vars: {}
		});
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/render/html/use-props.mjs
		function copyRawValuesOnly(target, source, props) {
			for (const key in source) if (!isMotionValue(source[key]) && !isForcedMotionValue(key, props)) target[key] = source[key];
		}
		function useInitialMotionValues({ transformTemplate }, visualState) {
			return (0, react.useMemo)(() => {
				const state = createHtmlRenderState();
				buildHTMLStyles(state, visualState, transformTemplate);
				return Object.assign({}, state.vars, state.style);
			}, [visualState]);
		}
		function useStyle(props, visualState) {
			const styleProp = props.style || {};
			const style = {};
			/**
			* Copy non-Motion Values straight into style
			*/
			copyRawValuesOnly(style, styleProp, props);
			Object.assign(style, useInitialMotionValues(props, visualState));
			return style;
		}
		function useHTMLProps(props, visualState) {
			const htmlProps = {};
			const style = useStyle(props, visualState);
			if (props.drag && props.dragListener !== false) {
				htmlProps.draggable = false;
				style.userSelect = style.WebkitUserSelect = style.WebkitTouchCallout = "none";
				style.touchAction = props.drag === true ? "none" : `pan-${props.drag === "x" ? "y" : "x"}`;
			}
			if (props.tabIndex === void 0 && (props.onTap || props.onTapStart || props.whileTap)) htmlProps.tabIndex = 0;
			htmlProps.style = style;
			return htmlProps;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/render/svg/utils/create-render-state.mjs
		const createSvgRenderState = () => ({
			...createHtmlRenderState(),
			attrs: {}
		});
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/render/svg/use-props.mjs
		function useSVGProps(props, visualState, _isStatic, Component) {
			const visualProps = (0, react.useMemo)(() => {
				const state = createSvgRenderState();
				buildSVGAttrs(state, visualState, isSVGTag(Component), props.transformTemplate, props.style);
				return {
					...state.attrs,
					style: { ...state.style }
				};
			}, [visualState]);
			if (props.style) {
				const rawStyles = {};
				copyRawValuesOnly(rawStyles, props.style, props);
				visualProps.style = {
					...rawStyles,
					...visualProps.style
				};
			}
			return visualProps;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/render/svg/lowercase-elements.mjs
		/**
		* We keep these listed separately as we use the lowercase tag names as part
		* of the runtime bundle to detect SVG components
		*/
		const lowercaseSVGElements = [
			"animate",
			"circle",
			"defs",
			"desc",
			"ellipse",
			"g",
			"image",
			"line",
			"filter",
			"marker",
			"mask",
			"metadata",
			"path",
			"pattern",
			"polygon",
			"polyline",
			"rect",
			"stop",
			"switch",
			"symbol",
			"svg",
			"text",
			"tspan",
			"use",
			"view"
		];
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/render/dom/utils/is-svg-component.mjs
		function isSVGComponent(Component) {
			if (typeof Component !== "string" || Component.includes("-")) return false;
			else if (lowercaseSVGElements.indexOf(Component) > -1 || /[A-Z]/u.test(Component)) return true;
			return false;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/render/dom/use-render.mjs
		function useRender(Component, props, ref, { latestValues }, isStatic, forwardMotionProps = false, isSVG) {
			const visualProps = (isSVG ?? isSVGComponent(Component) ? useSVGProps : useHTMLProps)(props, latestValues, isStatic, Component);
			const filteredProps = filterProps(props, typeof Component === "string", forwardMotionProps);
			const elementProps = Component !== react.Fragment ? {
				...filteredProps,
				...visualProps,
				ref
			} : {};
			/**
			* If component has been handed a motion value as its child,
			* memoise its initial value and render that. Subsequent updates
			* will be handled by the onChange handler
			*/
			const { children } = props;
			const renderedChildren = (0, react.useMemo)(() => isMotionValue(children) ? children.get() : children, [children]);
			return (0, react.createElement)(Component, {
				...elementProps,
				children: renderedChildren
			});
		}
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/motion/utils/use-visual-state.mjs
		function makeState({ scrapeMotionValuesFromProps, createRenderState }, props, context, presenceContext) {
			return {
				latestValues: makeLatestValues(props, context, presenceContext, scrapeMotionValuesFromProps),
				renderState: createRenderState()
			};
		}
		function makeLatestValues(props, context, presenceContext, scrapeMotionValues) {
			const values = {};
			const motionValues = scrapeMotionValues(props, {});
			for (const key in motionValues) values[key] = resolveMotionValue(motionValues[key]);
			let { initial, animate } = props;
			const isControllingVariants$1 = isControllingVariants(props);
			const isVariantNode$1 = isVariantNode(props);
			if (context && isVariantNode$1 && !isControllingVariants$1 && props.inherit !== false) {
				if (initial === void 0) initial = context.initial;
				if (animate === void 0) animate = context.animate;
			}
			let isInitialAnimationBlocked = presenceContext ? presenceContext.initial === false : false;
			isInitialAnimationBlocked = isInitialAnimationBlocked || initial === false;
			const variantToSet = isInitialAnimationBlocked ? animate : initial;
			if (variantToSet && typeof variantToSet !== "boolean" && !isAnimationControls(variantToSet)) {
				const list = Array.isArray(variantToSet) ? variantToSet : [variantToSet];
				for (let i = 0; i < list.length; i++) {
					const resolved = resolveVariantFromProps(props, list[i]);
					if (resolved) {
						const { transitionEnd, transition, ...target } = resolved;
						for (const key in target) {
							let valueTarget = target[key];
							if (Array.isArray(valueTarget)) {
								/**
								* Take final keyframe if the initial animation is blocked because
								* we want to initialise at the end of that blocked animation.
								*/
								const index = isInitialAnimationBlocked ? valueTarget.length - 1 : 0;
								valueTarget = valueTarget[index];
							}
							if (valueTarget !== null) values[key] = valueTarget;
						}
						for (const key in transitionEnd) values[key] = transitionEnd[key];
					}
				}
			}
			return values;
		}
		const makeUseVisualState = (config) => (props, isStatic) => {
			const context = (0, react.useContext)(MotionContext);
			const presenceContext = (0, react.useContext)(PresenceContext);
			const make = () => makeState(config, props, context, presenceContext);
			return isStatic ? make() : useConstant(make);
		};
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/render/html/use-html-visual-state.mjs
		const useHTMLVisualState = /*@__PURE__*/ makeUseVisualState({
			scrapeMotionValuesFromProps: scrapeMotionValuesFromProps$1,
			createRenderState: createHtmlRenderState
		});
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/render/svg/use-svg-visual-state.mjs
		const useSVGVisualState = /*@__PURE__*/ makeUseVisualState({
			scrapeMotionValuesFromProps,
			createRenderState: createSvgRenderState
		});
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/motion/utils/symbol.mjs
		const motionComponentSymbol = Symbol.for("motionComponentSymbol");
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/motion/utils/use-motion-ref.mjs
		/**
		* Creates a ref function that, when called, hydrates the provided
		* external ref and VisualElement.
		*/
		function useMotionRef(visualState, visualElement, externalRef) {
			/**
			* Store externalRef in a ref to avoid including it in the useCallback
			* dependency array. Including externalRef in dependencies causes issues
			* with libraries like Radix UI that create new callback refs on each render
			* when using asChild - this would cause the callback to be recreated,
			* triggering element remounts and breaking AnimatePresence exit animations.
			*/
			const externalRefContainer = (0, react.useRef)(externalRef);
			(0, react.useInsertionEffect)(() => {
				externalRefContainer.current = externalRef;
			});
			const refCleanup = (0, react.useRef)(null);
			return (0, react.useCallback)((instance) => {
				if (instance) visualState.onMount?.(instance);
				if (visualElement) instance ? visualElement.mount(instance) : visualElement.unmount();
				const ref = externalRefContainer.current;
				if (typeof ref === "function") if (instance) {
					const cleanup = ref(instance);
					if (typeof cleanup === "function") refCleanup.current = cleanup;
				} else if (refCleanup.current) {
					refCleanup.current();
					refCleanup.current = null;
				} else ref(instance);
				else if (ref) ref.current = instance;
			}, [visualElement]);
		}
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/context/SwitchLayoutGroupContext.mjs
		/**
		* Internal, exported only for usage in Framer
		*/
		const SwitchLayoutGroupContext = (0, react.createContext)({});
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/utils/is-ref-object.mjs
		function isRefObject(ref) {
			return ref && typeof ref === "object" && Object.prototype.hasOwnProperty.call(ref, "current");
		}
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/motion/utils/use-visual-element.mjs
		function useVisualElement(Component, visualState, props, createVisualElement, ProjectionNodeConstructor, isSVG) {
			const { visualElement: parent } = (0, react.useContext)(MotionContext);
			const lazyContext = (0, react.useContext)(LazyContext);
			const presenceContext = (0, react.useContext)(PresenceContext);
			const motionConfig = (0, react.useContext)(MotionConfigContext);
			const reducedMotionConfig = motionConfig.reducedMotion;
			const skipAnimations = motionConfig.skipAnimations;
			const visualElementRef = (0, react.useRef)(null);
			/**
			* Track whether the component has been through React's commit phase.
			* Used to detect when LazyMotion features load after the component has mounted.
			*/
			const hasMountedOnce = (0, react.useRef)(false);
			/**
			* If we haven't preloaded a renderer, check to see if we have one lazy-loaded
			*/
			createVisualElement = createVisualElement || lazyContext.renderer;
			if (!visualElementRef.current && createVisualElement) {
				visualElementRef.current = createVisualElement(Component, {
					visualState,
					parent,
					props,
					presenceContext,
					blockInitialAnimation: presenceContext ? presenceContext.initial === false : false,
					reducedMotionConfig,
					skipAnimations,
					isSVG
				});
				/**
				* If the component has already mounted before features loaded (e.g. via
				* LazyMotion with async feature loading), we need to force the initial
				* animation to run. Otherwise state changes that occurred before features
				* loaded will be lost and the element will snap to its final state.
				*/
				if (hasMountedOnce.current && visualElementRef.current) visualElementRef.current.manuallyAnimateOnMount = true;
			}
			const visualElement = visualElementRef.current;
			/**
			* Load Motion gesture and animation features. These are rendered as renderless
			* components so each feature can optionally make use of React lifecycle methods.
			*/
			const initialLayoutGroupConfig = (0, react.useContext)(SwitchLayoutGroupContext);
			if (visualElement && !visualElement.projection && ProjectionNodeConstructor && (visualElement.type === "html" || visualElement.type === "svg")) createProjectionNode(visualElementRef.current, props, ProjectionNodeConstructor, initialLayoutGroupConfig);
			const isMounted = (0, react.useRef)(false);
			(0, react.useInsertionEffect)(() => {
				/**
				* Check the component has already mounted before calling
				* `update` unnecessarily. This ensures we skip the initial update.
				*/
				if (visualElement && isMounted.current) visualElement.update(props, presenceContext);
			});
			/**
			* Cache this value as we want to know whether HandoffAppearAnimations
			* was present on initial render - it will be deleted after this.
			*/
			const optimisedAppearId = props[optimizedAppearDataAttribute];
			const wantsHandoff = (0, react.useRef)(Boolean(optimisedAppearId) && typeof window !== "undefined" && !window.MotionHandoffIsComplete?.(optimisedAppearId) && window.MotionHasOptimisedAnimation?.(optimisedAppearId));
			useIsomorphicLayoutEffect(() => {
				/**
				* Track that this component has mounted. This is used to detect when
				* LazyMotion features load after the component has already committed.
				*/
				hasMountedOnce.current = true;
				if (!visualElement) return;
				isMounted.current = true;
				window.MotionIsMounted = true;
				visualElement.updateFeatures();
				visualElement.scheduleRenderMicrotask();
				/**
				* Ideally this function would always run in a useEffect.
				*
				* However, if we have optimised appear animations to handoff from,
				* it needs to happen synchronously to ensure there's no flash of
				* incorrect styles in the event of a hydration error.
				*
				* So if we detect a situtation where optimised appear animations
				* are running, we use useLayoutEffect to trigger animations.
				*/
				if (wantsHandoff.current && visualElement.animationState) visualElement.animationState.animateChanges();
			});
			(0, react.useEffect)(() => {
				if (!visualElement) return;
				if (!wantsHandoff.current && visualElement.animationState) visualElement.animationState.animateChanges();
				if (wantsHandoff.current) {
					queueMicrotask(() => {
						window.MotionHandoffMarkAsComplete?.(optimisedAppearId);
					});
					wantsHandoff.current = false;
				}
				/**
				* Now we've finished triggering animations for this element we
				* can wipe the enteringChildren set for the next render.
				*/
				visualElement.enteringChildren = void 0;
			});
			return visualElement;
		}
		function createProjectionNode(visualElement, props, ProjectionNodeConstructor, initialPromotionConfig) {
			const { layoutId, layout, drag, dragConstraints, layoutScroll, layoutRoot, layoutAnchor, layoutCrossfade } = props;
			visualElement.projection = new ProjectionNodeConstructor(visualElement.latestValues, props["data-framer-portal-id"] ? void 0 : getClosestProjectingNode(visualElement.parent));
			visualElement.projection.setOptions({
				layoutId,
				layout,
				alwaysMeasureLayout: Boolean(drag) || dragConstraints && isRefObject(dragConstraints),
				visualElement,
				/**
				* TODO: Update options in an effect. This could be tricky as it'll be too late
				* to update by the time layout animations run.
				* We also need to fix this safeToRemove by linking it up to the one returned by usePresence,
				* ensuring it gets called if there's no potential layout animations.
				*
				*/
				animationType: typeof layout === "string" ? layout : "both",
				initialPromotionConfig,
				crossfade: layoutCrossfade,
				layoutScroll,
				layoutRoot,
				layoutAnchor
			});
		}
		function getClosestProjectingNode(visualElement) {
			if (!visualElement) return void 0;
			return visualElement.options.allowProjection !== false ? visualElement.projection : getClosestProjectingNode(visualElement.parent);
		}
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/motion/index.mjs
		/**
		* Create a `motion` component.
		*
		* This function accepts a Component argument, which can be either a string (ie "div"
		* for `motion.div`), or an actual React component.
		*
		* Alongside this is a config option which provides a way of rendering the provided
		* component "offline", or outside the React render cycle.
		*/
		function createMotionComponent(Component, { forwardMotionProps = false, type } = {}, preloadedFeatures, createVisualElement) {
			preloadedFeatures && loadFeatures(preloadedFeatures);
			/**
			* Determine whether to use SVG or HTML rendering based on:
			* 1. Explicit `type` option (highest priority)
			* 2. Auto-detection via `isSVGComponent`
			*/
			const isSVG = type ? type === "svg" : isSVGComponent(Component);
			const useVisualState = isSVG ? useSVGVisualState : useHTMLVisualState;
			function MotionDOMComponent(props, externalRef) {
				/**
				* If we need to measure the element we load this functionality in a
				* separate class component in order to gain access to getSnapshotBeforeUpdate.
				*/
				let MeasureLayout;
				const configAndProps = {
					...(0, react.useContext)(MotionConfigContext),
					...props,
					layoutId: useLayoutId(props)
				};
				const { isStatic } = configAndProps;
				const context = useCreateMotionContext(props);
				const visualState = useVisualState(props, isStatic);
				if (!isStatic && typeof window !== "undefined") {
					useStrictMode(configAndProps, preloadedFeatures);
					const layoutProjection = getProjectionFunctionality(configAndProps);
					MeasureLayout = layoutProjection.MeasureLayout;
					/**
					* Create a VisualElement for this component. A VisualElement provides a common
					* interface to renderer-specific APIs (ie DOM/Three.js etc) as well as
					* providing a way of rendering to these APIs outside of the React render loop
					* for more performant animations and interactions
					*/
					context.visualElement = useVisualElement(Component, visualState, configAndProps, createVisualElement, layoutProjection.ProjectionNode, isSVG);
				}
				/**
				* The mount order and hierarchy is specific to ensure our element ref
				* is hydrated by the time features fire their effects.
				*/
				return (0, react_jsx_runtime.jsxs)(MotionContext.Provider, {
					value: context,
					children: [MeasureLayout && context.visualElement ? (0, react_jsx_runtime.jsx)(MeasureLayout, {
						visualElement: context.visualElement,
						...configAndProps
					}) : null, useRender(Component, props, useMotionRef(visualState, context.visualElement, externalRef), visualState, isStatic, forwardMotionProps, isSVG)]
				});
			}
			MotionDOMComponent.displayName = `motion.${typeof Component === "string" ? Component : `create(${Component.displayName ?? Component.name ?? ""})`}`;
			const ForwardRefMotionComponent = (0, react.forwardRef)(MotionDOMComponent);
			ForwardRefMotionComponent[motionComponentSymbol] = Component;
			return ForwardRefMotionComponent;
		}
		function useLayoutId({ layoutId }) {
			const layoutGroupId = (0, react.useContext)(LayoutGroupContext).id;
			return layoutGroupId && layoutId !== void 0 ? layoutGroupId + "-" + layoutId : layoutId;
		}
		function useStrictMode(configAndProps, preloadedFeatures) {
			(0, react.useContext)(LazyContext).strict;
		}
		function getProjectionFunctionality(props) {
			const { drag, layout } = getInitializedFeatureDefinitions();
			if (!drag && !layout) return {};
			const combined = {
				...drag,
				...layout
			};
			return {
				MeasureLayout: drag?.isEnabled(props) || layout?.isEnabled(props) ? combined.MeasureLayout : void 0,
				ProjectionNode: combined.ProjectionNode
			};
		}
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/render/components/create-proxy.mjs
		function createMotionProxy(preloadedFeatures, createVisualElement) {
			if (typeof Proxy === "undefined") return createMotionComponent;
			/**
			* A cache of generated `motion` components, e.g `motion.div`, `motion.input` etc.
			* Rather than generating them anew every render.
			*/
			const componentCache = /* @__PURE__ */ new Map();
			const factory = (Component, options) => {
				return createMotionComponent(Component, options, preloadedFeatures, createVisualElement);
			};
			/**
			* Support for deprecated`motion(Component)` pattern
			*/
			const deprecatedFactoryFunction = (Component, options) => {
				return factory(Component, options);
			};
			return new Proxy(deprecatedFactoryFunction, { 
			/**
			* Called when `motion` is referenced with a prop: `motion.div`, `motion.input` etc.
			* The prop name is passed through as `key` and we can use that to generate a `motion`
			* DOM component with that name.
			*/
get: (_target, key) => {
				if (key === "create") return factory;
				/**
				* If this element doesn't exist in the component cache, create it and cache.
				*/
				if (!componentCache.has(key)) componentCache.set(key, createMotionComponent(key, void 0, preloadedFeatures, createVisualElement));
				return componentCache.get(key);
			} });
		}
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/render/components/m/proxy.mjs
		const m$1 = /*@__PURE__*/ createMotionProxy();
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/render/dom/create-visual-element.mjs
		const createDomVisualElement = (Component, options) => {
			return options.isSVG ?? isSVGComponent(Component) ? new SVGVisualElement(options) : new HTMLVisualElement(options, { allowProjection: Component !== react.Fragment });
		};
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/motion/features/animation/index.mjs
		var AnimationFeature = class extends Feature {
			/**
			* We dynamically generate the AnimationState manager as it contains a reference
			* to the underlying animation library. We only want to load that if we load this,
			* so people can optionally code split it out using the `m` component.
			*/
			constructor(node) {
				super(node);
				node.animationState || (node.animationState = createAnimationState(node));
			}
			updateAnimationControlsSubscription() {
				const { animate } = this.node.getProps();
				if (isAnimationControls(animate)) this.unmountControls = animate.subscribe(this.node);
			}
			/**
			* Subscribe any provided AnimationControls to the component's VisualElement
			*/
			mount() {
				this.updateAnimationControlsSubscription();
			}
			update() {
				const { animate } = this.node.getProps();
				const { animate: prevAnimate } = this.node.prevProps || {};
				if (animate !== prevAnimate) this.updateAnimationControlsSubscription();
			}
			unmount() {
				this.node.animationState.reset();
				this.unmountControls?.();
			}
		};
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/motion/features/animation/exit.mjs
		let id = 0;
		var ExitAnimationFeature = class extends Feature {
			constructor() {
				super(...arguments);
				this.id = id++;
				this.isExitComplete = false;
			}
			update() {
				if (!this.node.presenceContext) return;
				const { isPresent, onExitComplete } = this.node.presenceContext;
				const { isPresent: prevIsPresent } = this.node.prevPresenceContext || {};
				if (!this.node.animationState || isPresent === prevIsPresent) return;
				if (isPresent && prevIsPresent === false) {
					/**
					* When re-entering, if the exit animation already completed
					* (element is at rest), reset to initial values so the enter
					* animation replays from the correct position.
					*/
					if (this.isExitComplete) {
						const { initial, custom } = this.node.getProps();
						if (typeof initial === "string" || typeof initial === "object" && initial !== null && !Array.isArray(initial)) {
							const resolved = resolveVariant(this.node, initial, custom);
							if (resolved) {
								const { transition, transitionEnd, ...target } = resolved;
								for (const key in target) this.node.getValue(key)?.jump(target[key]);
							}
						}
						this.node.animationState.reset();
						this.node.animationState.animateChanges();
					} else this.node.animationState.setActive("exit", false);
					this.isExitComplete = false;
					return;
				}
				const exitAnimation = this.node.animationState.setActive("exit", !isPresent);
				if (onExitComplete && !isPresent) exitAnimation.then(() => {
					this.isExitComplete = true;
					onExitComplete(this.id);
				});
			}
			mount() {
				const { register, onExitComplete } = this.node.presenceContext || {};
				if (onExitComplete) onExitComplete(this.id);
				if (register) this.unmount = register(this.id);
			}
			unmount() {}
		};
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/motion/features/animations.mjs
		const animations = {
			animation: { Feature: AnimationFeature },
			exit: { Feature: ExitAnimationFeature }
		};
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/events/event-info.mjs
		function extractEventInfo(event) {
			return { point: {
				x: event.pageX,
				y: event.pageY
			} };
		}
		const addPointerInfo = (handler) => (event) => isPrimaryPointer(event) && handler(event, extractEventInfo(event));
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/events/add-pointer-event.mjs
		function addPointerEvent(target, eventName, handler, options) {
			return addDomEvent(target, eventName, addPointerInfo(handler), options);
		}
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/utils/get-context-window.mjs
		const getContextWindow = ({ current }) => {
			return current ? current.ownerDocument.defaultView : null;
		};
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/utils/distance.mjs
		const distance = (a, b) => Math.abs(a - b);
		function distance2D(a, b) {
			const xDelta = distance(a.x, b.x);
			const yDelta = distance(a.y, b.y);
			return Math.sqrt(xDelta ** 2 + yDelta ** 2);
		}
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/gestures/pan/PanSession.mjs
		const overflowStyles$1 = /*#__PURE__*/ new Set(["auto", "scroll"]);
		/**
		* @internal
		*/
		var PanSession = class {
			constructor(event, handlers, { transformPagePoint, contextWindow = window, dragSnapToOrigin = false, distanceThreshold = 3, element } = {}) {
				/**
				* @internal
				*/
				this.startEvent = null;
				/**
				* @internal
				*/
				this.lastMoveEvent = null;
				/**
				* @internal
				*/
				this.lastMoveEventInfo = null;
				/**
				* Raw (untransformed) event info, re-transformed each frame
				* so transformPagePoint sees the current parent matrix.
				* @internal
				*/
				this.lastRawMoveEventInfo = null;
				/**
				* @internal
				*/
				this.handlers = {};
				/**
				* @internal
				*/
				this.contextWindow = window;
				/**
				* Scroll positions of scrollable ancestors and window.
				* @internal
				*/
				this.scrollPositions = /* @__PURE__ */ new Map();
				/**
				* Cleanup function for scroll listeners.
				* @internal
				*/
				this.removeScrollListeners = null;
				this.onElementScroll = (event) => {
					this.handleScroll(event.target);
				};
				this.onWindowScroll = () => {
					this.handleScroll(window);
				};
				this.updatePoint = () => {
					if (!(this.lastMoveEvent && this.lastMoveEventInfo)) return;
					if (this.lastRawMoveEventInfo) this.lastMoveEventInfo = transformPoint(this.lastRawMoveEventInfo, this.transformPagePoint);
					const info = getPanInfo(this.lastMoveEventInfo, this.history);
					const isPanStarted = this.startEvent !== null;
					const isDistancePastThreshold = distance2D(info.offset, {
						x: 0,
						y: 0
					}) >= this.distanceThreshold;
					if (!isPanStarted && !isDistancePastThreshold) return;
					const { point } = info;
					const { timestamp } = frameData;
					this.history.push({
						...point,
						timestamp
					});
					const { onStart, onMove } = this.handlers;
					if (!isPanStarted) {
						onStart && onStart(this.lastMoveEvent, info);
						this.startEvent = this.lastMoveEvent;
					}
					onMove && onMove(this.lastMoveEvent, info);
				};
				this.handlePointerMove = (event, info) => {
					this.lastMoveEvent = event;
					this.lastRawMoveEventInfo = info;
					this.lastMoveEventInfo = transformPoint(info, this.transformPagePoint);
					frame.update(this.updatePoint, true);
				};
				this.handlePointerUp = (event, info) => {
					this.end();
					const { onEnd, onSessionEnd, resumeAnimation } = this.handlers;
					if (this.dragSnapToOrigin || !this.startEvent) resumeAnimation && resumeAnimation();
					if (!(this.lastMoveEvent && this.lastMoveEventInfo)) return;
					const panInfo = getPanInfo(event.type === "pointercancel" ? this.lastMoveEventInfo : transformPoint(info, this.transformPagePoint), this.history);
					if (this.startEvent && onEnd) onEnd(event, panInfo);
					onSessionEnd && onSessionEnd(event, panInfo);
				};
				if (!isPrimaryPointer(event)) return;
				this.dragSnapToOrigin = dragSnapToOrigin;
				this.handlers = handlers;
				this.transformPagePoint = transformPagePoint;
				this.distanceThreshold = distanceThreshold;
				this.contextWindow = contextWindow || window;
				const initialInfo = transformPoint(extractEventInfo(event), this.transformPagePoint);
				const { point } = initialInfo;
				const { timestamp } = frameData;
				this.history = [{
					...point,
					timestamp
				}];
				const { onSessionStart } = handlers;
				onSessionStart && onSessionStart(event, getPanInfo(initialInfo, this.history));
				const eventOptions = {
					passive: true,
					capture: true
				};
				this.removeListeners = pipe(addPointerEvent(this.contextWindow, "pointermove", this.handlePointerMove, eventOptions), addPointerEvent(this.contextWindow, "pointerup", this.handlePointerUp, eventOptions), addPointerEvent(this.contextWindow, "pointercancel", this.handlePointerUp, eventOptions));
				if (element) this.startScrollTracking(element);
			}
			/**
			* Start tracking scroll on ancestors and window.
			*/
			startScrollTracking(element) {
				let current = element.parentElement;
				while (current) {
					const style = getComputedStyle(current);
					if (overflowStyles$1.has(style.overflowX) || overflowStyles$1.has(style.overflowY)) this.scrollPositions.set(current, {
						x: current.scrollLeft,
						y: current.scrollTop
					});
					current = current.parentElement;
				}
				this.scrollPositions.set(window, {
					x: window.scrollX,
					y: window.scrollY
				});
				window.addEventListener("scroll", this.onElementScroll, { capture: true });
				window.addEventListener("scroll", this.onWindowScroll);
				this.removeScrollListeners = () => {
					window.removeEventListener("scroll", this.onElementScroll, { capture: true });
					window.removeEventListener("scroll", this.onWindowScroll);
				};
			}
			/**
			* Handle scroll compensation during drag.
			*
			* For element scroll: adjusts history origin since pageX/pageY doesn't change.
			* For window scroll: adjusts lastMoveEventInfo since pageX/pageY would change.
			*/
			handleScroll(target) {
				const initial = this.scrollPositions.get(target);
				if (!initial) return;
				const isWindow = target === window;
				const current = isWindow ? {
					x: window.scrollX,
					y: window.scrollY
				} : {
					x: target.scrollLeft,
					y: target.scrollTop
				};
				const delta = {
					x: current.x - initial.x,
					y: current.y - initial.y
				};
				if (delta.x === 0 && delta.y === 0) return;
				if (isWindow) {
					if (this.lastMoveEventInfo) {
						this.lastMoveEventInfo.point.x += delta.x;
						this.lastMoveEventInfo.point.y += delta.y;
					}
				} else if (this.history.length > 0) {
					this.history[0].x -= delta.x;
					this.history[0].y -= delta.y;
				}
				this.scrollPositions.set(target, current);
				frame.update(this.updatePoint, true);
			}
			updateHandlers(handlers) {
				this.handlers = handlers;
			}
			end() {
				this.removeListeners && this.removeListeners();
				this.removeScrollListeners && this.removeScrollListeners();
				this.scrollPositions.clear();
				cancelFrame(this.updatePoint);
			}
		};
		function transformPoint(info, transformPagePoint) {
			return transformPagePoint ? { point: transformPagePoint(info.point) } : info;
		}
		function subtractPoint(a, b) {
			return {
				x: a.x - b.x,
				y: a.y - b.y
			};
		}
		function getPanInfo({ point }, history) {
			return {
				point,
				delta: subtractPoint(point, lastDevicePoint(history)),
				offset: subtractPoint(point, startDevicePoint(history)),
				velocity: getVelocity(history, .1)
			};
		}
		function startDevicePoint(history) {
			return history[0];
		}
		function lastDevicePoint(history) {
			return history[history.length - 1];
		}
		function getVelocity(history, timeDelta) {
			if (history.length < 2) return {
				x: 0,
				y: 0
			};
			let i = history.length - 1;
			let timestampedPoint = null;
			const lastPoint = lastDevicePoint(history);
			while (i >= 0) {
				timestampedPoint = history[i];
				if (lastPoint.timestamp - timestampedPoint.timestamp > /* @__PURE__ */ secondsToMilliseconds(timeDelta)) break;
				i--;
			}
			if (!timestampedPoint) return {
				x: 0,
				y: 0
			};
			/**
			* If the selected point is the pointer-down origin (history[0]),
			* there are better movement points available, and the time gap
			* is suspiciously large (>2x timeDelta), use the next point instead.
			* This prevents stale pointer-down points from diluting velocity
			* in hold-then-flick gestures.
			*/
			if (timestampedPoint === history[0] && history.length > 2 && lastPoint.timestamp - timestampedPoint.timestamp > /* @__PURE__ */ secondsToMilliseconds(timeDelta) * 2) timestampedPoint = history[1];
			const time = /* @__PURE__ */ millisecondsToSeconds(lastPoint.timestamp - timestampedPoint.timestamp);
			if (time === 0) return {
				x: 0,
				y: 0
			};
			const currentVelocity = {
				x: (lastPoint.x - timestampedPoint.x) / time,
				y: (lastPoint.y - timestampedPoint.y) / time
			};
			if (currentVelocity.x === Infinity) currentVelocity.x = 0;
			if (currentVelocity.y === Infinity) currentVelocity.y = 0;
			return currentVelocity;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/gestures/drag/utils/constraints.mjs
		/**
		* Apply constraints to a point. These constraints are both physical along an
		* axis, and an elastic factor that determines how much to constrain the point
		* by if it does lie outside the defined parameters.
		*/
		function applyConstraints(point, { min, max }, elastic) {
			if (min !== void 0 && point < min) point = elastic ? mixNumber$1(min, point, elastic.min) : Math.max(point, min);
			else if (max !== void 0 && point > max) point = elastic ? mixNumber$1(max, point, elastic.max) : Math.min(point, max);
			return point;
		}
		/**
		* Calculate constraints in terms of the viewport when defined relatively to the
		* measured axis. This is measured from the nearest edge, so a max constraint of 200
		* on an axis with a max value of 300 would return a constraint of 500 - axis length
		*/
		function calcRelativeAxisConstraints(axis, min, max) {
			return {
				min: min !== void 0 ? axis.min + min : void 0,
				max: max !== void 0 ? axis.max + max - (axis.max - axis.min) : void 0
			};
		}
		/**
		* Calculate constraints in terms of the viewport when
		* defined relatively to the measured bounding box.
		*/
		function calcRelativeConstraints(layoutBox, { top, left, bottom, right }) {
			return {
				x: calcRelativeAxisConstraints(layoutBox.x, left, right),
				y: calcRelativeAxisConstraints(layoutBox.y, top, bottom)
			};
		}
		/**
		* Calculate viewport constraints when defined as another viewport-relative axis
		*/
		function calcViewportAxisConstraints(layoutAxis, constraintsAxis) {
			let min = constraintsAxis.min - layoutAxis.min;
			let max = constraintsAxis.max - layoutAxis.max;
			if (constraintsAxis.max - constraintsAxis.min < layoutAxis.max - layoutAxis.min) [min, max] = [max, min];
			return {
				min,
				max
			};
		}
		/**
		* Calculate viewport constraints when defined as another viewport-relative box
		*/
		function calcViewportConstraints(layoutBox, constraintsBox) {
			return {
				x: calcViewportAxisConstraints(layoutBox.x, constraintsBox.x),
				y: calcViewportAxisConstraints(layoutBox.y, constraintsBox.y)
			};
		}
		/**
		* Calculate a transform origin relative to the source axis, between 0-1, that results
		* in an asthetically pleasing scale/transform needed to project from source to target.
		*/
		function calcOrigin(source, target) {
			let origin = .5;
			const sourceLength = calcLength(source);
			const targetLength = calcLength(target);
			if (targetLength > sourceLength) origin = /* @__PURE__ */ progress(target.min, target.max - sourceLength, source.min);
			else if (sourceLength > targetLength) origin = /* @__PURE__ */ progress(source.min, source.max - targetLength, target.min);
			return clamp(0, 1, origin);
		}
		/**
		* Rebase the calculated viewport constraints relative to the layout.min point.
		*/
		function rebaseAxisConstraints(layout, constraints) {
			const relativeConstraints = {};
			if (constraints.min !== void 0) relativeConstraints.min = constraints.min - layout.min;
			if (constraints.max !== void 0) relativeConstraints.max = constraints.max - layout.min;
			return relativeConstraints;
		}
		const defaultElastic = .35;
		/**
		* Accepts a dragElastic prop and returns resolved elastic values for each axis.
		*/
		function resolveDragElastic(dragElastic = defaultElastic) {
			if (dragElastic === false) dragElastic = 0;
			else if (dragElastic === true) dragElastic = defaultElastic;
			return {
				x: resolveAxisElastic(dragElastic, "left", "right"),
				y: resolveAxisElastic(dragElastic, "top", "bottom")
			};
		}
		function resolveAxisElastic(dragElastic, minLabel, maxLabel) {
			return {
				min: resolvePointElastic(dragElastic, minLabel),
				max: resolvePointElastic(dragElastic, maxLabel)
			};
		}
		function resolvePointElastic(dragElastic, label) {
			return typeof dragElastic === "number" ? dragElastic : dragElastic[label] || 0;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/gestures/drag/VisualElementDragControls.mjs
		const elementDragControls = /* @__PURE__ */ new WeakMap();
		var VisualElementDragControls = class {
			constructor(visualElement) {
				this.openDragLock = null;
				this.isDragging = false;
				this.currentDirection = null;
				this.originPoint = {
					x: 0,
					y: 0
				};
				/**
				* The permitted boundaries of travel, in pixels.
				*/
				this.constraints = false;
				this.hasMutatedConstraints = false;
				/**
				* The per-axis resolved elastic values.
				*/
				this.elastic = createBox();
				/**
				* The latest pointer event. Used as fallback when the `cancel` and `stop` functions are called without arguments.
				*/
				this.latestPointerEvent = null;
				/**
				* The latest pan info. Used as fallback when the `cancel` and `stop` functions are called without arguments.
				*/
				this.latestPanInfo = null;
				this.visualElement = visualElement;
			}
			start(originEvent, { snapToCursor = false, distanceThreshold } = {}) {
				/**
				* Don't start dragging if this component is exiting
				*/
				const { presenceContext } = this.visualElement;
				if (presenceContext && presenceContext.isPresent === false) return;
				const onSessionStart = (event) => {
					if (snapToCursor) this.snapToCursor(extractEventInfo(event).point);
					this.stopAnimation();
				};
				const onStart = (event, info) => {
					const { drag, dragPropagation, onDragStart } = this.getProps();
					if (drag && !dragPropagation) {
						if (this.openDragLock) this.openDragLock();
						this.openDragLock = setDragLock(drag);
						if (!this.openDragLock) return;
					}
					this.latestPointerEvent = event;
					this.latestPanInfo = info;
					this.isDragging = true;
					this.currentDirection = null;
					this.resolveConstraints();
					if (this.visualElement.projection) {
						this.visualElement.projection.isAnimationBlocked = true;
						this.visualElement.projection.target = void 0;
					}
					/**
					* Record gesture origin and pointer offset
					*/
					eachAxis((axis) => {
						let current = this.getAxisMotionValue(axis).get() || 0;
						/**
						* If the MotionValue is a percentage value convert to px
						*/
						if (percent.test(current)) {
							const { projection } = this.visualElement;
							if (projection && projection.layout) {
								const measuredAxis = projection.layout.layoutBox[axis];
								if (measuredAxis) current = calcLength(measuredAxis) * (parseFloat(current) / 100);
							}
						}
						this.originPoint[axis] = current;
					});
					if (onDragStart) frame.update(() => onDragStart(event, info), false, true);
					addValueToWillChange(this.visualElement, "transform");
					const { animationState } = this.visualElement;
					animationState && animationState.setActive("whileDrag", true);
				};
				const onMove = (event, info) => {
					this.latestPointerEvent = event;
					this.latestPanInfo = info;
					const { dragPropagation, dragDirectionLock, onDirectionLock, onDrag } = this.getProps();
					if (!dragPropagation && !this.openDragLock) return;
					const { offset } = info;
					if (dragDirectionLock && this.currentDirection === null) {
						this.currentDirection = getCurrentDirection(offset);
						if (this.currentDirection !== null) onDirectionLock && onDirectionLock(this.currentDirection);
						return;
					}
					this.updateAxis("x", info.point, offset);
					this.updateAxis("y", info.point, offset);
					/**
					* Ideally we would leave the renderer to fire naturally at the end of
					* this frame but if the element is about to change layout as the result
					* of a re-render we want to ensure the browser can read the latest
					* bounding box to ensure the pointer and element don't fall out of sync.
					*/
					this.visualElement.render();
					/**
					* This must fire after the render call as it might trigger a state
					* change which itself might trigger a layout update.
					*/
					if (onDrag) frame.update(() => onDrag(event, info), false, true);
				};
				const onSessionEnd = (event, info) => {
					this.latestPointerEvent = event;
					this.latestPanInfo = info;
					this.stop(event, info);
					this.latestPointerEvent = null;
					this.latestPanInfo = null;
				};
				const resumeAnimation = () => {
					const { dragSnapToOrigin: snap } = this.getProps();
					if (snap || this.constraints) this.startAnimation({
						x: 0,
						y: 0
					});
				};
				const { dragSnapToOrigin } = this.getProps();
				this.panSession = new PanSession(originEvent, {
					onSessionStart,
					onStart,
					onMove,
					onSessionEnd,
					resumeAnimation
				}, {
					transformPagePoint: this.visualElement.getTransformPagePoint(),
					dragSnapToOrigin,
					distanceThreshold,
					contextWindow: getContextWindow(this.visualElement),
					element: this.visualElement.current
				});
			}
			/**
			* @internal
			*/
			stop(event, panInfo) {
				const finalEvent = event || this.latestPointerEvent;
				const finalPanInfo = panInfo || this.latestPanInfo;
				const isDragging = this.isDragging;
				this.cancel();
				if (!isDragging || !finalPanInfo || !finalEvent) return;
				const { velocity } = finalPanInfo;
				this.startAnimation(velocity);
				const { onDragEnd } = this.getProps();
				if (onDragEnd) frame.postRender(() => onDragEnd(finalEvent, finalPanInfo));
			}
			/**
			* @internal
			*/
			cancel() {
				this.isDragging = false;
				const { projection, animationState } = this.visualElement;
				if (projection) projection.isAnimationBlocked = false;
				this.endPanSession();
				const { dragPropagation } = this.getProps();
				if (!dragPropagation && this.openDragLock) {
					this.openDragLock();
					this.openDragLock = null;
				}
				animationState && animationState.setActive("whileDrag", false);
			}
			/**
			* Clean up the pan session without modifying other drag state.
			* This is used during unmount to ensure event listeners are removed
			* without affecting projection animations or drag locks.
			* @internal
			*/
			endPanSession() {
				this.panSession && this.panSession.end();
				this.panSession = void 0;
			}
			updateAxis(axis, _point, offset) {
				const { drag } = this.getProps();
				if (!offset || !shouldDrag(axis, drag, this.currentDirection)) return;
				const axisValue = this.getAxisMotionValue(axis);
				let next = this.originPoint[axis] + offset[axis];
				if (this.constraints && this.constraints[axis]) next = applyConstraints(next, this.constraints[axis], this.elastic[axis]);
				axisValue.set(next);
			}
			resolveConstraints() {
				const { dragConstraints, dragElastic } = this.getProps();
				const layout = this.visualElement.projection && !this.visualElement.projection.layout ? this.visualElement.projection.measure(false) : this.visualElement.projection?.layout;
				const prevConstraints = this.constraints;
				if (dragConstraints && isRefObject(dragConstraints)) {
					if (!this.constraints) this.constraints = this.resolveRefConstraints();
				} else if (dragConstraints && layout) this.constraints = calcRelativeConstraints(layout.layoutBox, dragConstraints);
				else this.constraints = false;
				this.elastic = resolveDragElastic(dragElastic);
				/**
				* If we're outputting to external MotionValues, we want to rebase the measured constraints
				* from viewport-relative to component-relative. This only applies to relative (non-ref)
				* constraints, as ref-based constraints from calcViewportConstraints are already in the
				* correct coordinate space for the motion value transform offset.
				*/
				if (prevConstraints !== this.constraints && !isRefObject(dragConstraints) && layout && this.constraints && !this.hasMutatedConstraints) eachAxis((axis) => {
					if (this.constraints !== false && this.getAxisMotionValue(axis)) this.constraints[axis] = rebaseAxisConstraints(layout.layoutBox[axis], this.constraints[axis]);
				});
			}
			resolveRefConstraints() {
				const { dragConstraints: constraints, onMeasureDragConstraints } = this.getProps();
				if (!constraints || !isRefObject(constraints)) return false;
				const constraintsElement = constraints.current;
				const { projection } = this.visualElement;
				if (!projection || !projection.layout) return false;
				/**
				* Refresh the root scroll offset so the constraint's viewport box
				* translates to correct page coordinates. The scroll captured at
				* drag mount can be stale if the document was scrolled afterwards —
				* e.g. via the browser restoring scroll on refresh, or an ancestor
				* layout effect running after this element's mount (#2829).
				*
				* Clear the cached scroll first so `updateScroll` bypasses its
				* per-animationId cache and re-reads the live value.
				*/
				if (projection.root) {
					projection.root.scroll = void 0;
					projection.root.updateScroll();
				}
				const constraintsBox = measurePageBox(constraintsElement, projection.root, this.visualElement.getTransformPagePoint());
				let measuredConstraints = calcViewportConstraints(projection.layout.layoutBox, constraintsBox);
				/**
				* If there's an onMeasureDragConstraints listener we call it and
				* if different constraints are returned, set constraints to that
				*/
				if (onMeasureDragConstraints) {
					const userConstraints = onMeasureDragConstraints(convertBoxToBoundingBox(measuredConstraints));
					this.hasMutatedConstraints = !!userConstraints;
					if (userConstraints) measuredConstraints = convertBoundingBoxToBox(userConstraints);
				}
				return measuredConstraints;
			}
			startAnimation(velocity) {
				const { drag, dragMomentum, dragElastic, dragTransition, dragSnapToOrigin, onDragTransitionEnd } = this.getProps();
				const constraints = this.constraints || {};
				const momentumAnimations = eachAxis((axis) => {
					if (!shouldDrag(axis, drag, this.currentDirection)) return;
					let transition = constraints && constraints[axis] || {};
					if (dragSnapToOrigin === true || dragSnapToOrigin === axis) transition = {
						min: 0,
						max: 0
					};
					/**
					* Overdamp the boundary spring if `dragElastic` is disabled. There's still a frame
					* of spring animations so we should look into adding a disable spring option to `inertia`.
					* We could do something here where we affect the `bounceStiffness` and `bounceDamping`
					* using the value of `dragElastic`.
					*/
					const bounceStiffness = dragElastic ? 200 : 1e6;
					const bounceDamping = dragElastic ? 40 : 1e7;
					const inertia = {
						type: "inertia",
						velocity: dragMomentum ? velocity[axis] : 0,
						bounceStiffness,
						bounceDamping,
						timeConstant: 750,
						restDelta: 1,
						restSpeed: 10,
						...dragTransition,
						...transition
					};
					return this.startAxisValueAnimation(axis, inertia);
				});
				return Promise.all(momentumAnimations).then(onDragTransitionEnd);
			}
			startAxisValueAnimation(axis, transition) {
				const axisValue = this.getAxisMotionValue(axis);
				addValueToWillChange(this.visualElement, axis);
				return axisValue.start(animateMotionValue(axis, axisValue, 0, transition, this.visualElement, false));
			}
			stopAnimation() {
				eachAxis((axis) => this.getAxisMotionValue(axis).stop());
			}
			/**
			* Drag works differently depending on which props are provided.
			*
			* - If _dragX and _dragY are provided, we output the gesture delta directly to those motion values.
			* - Otherwise, we apply the delta to the x/y motion values.
			*/
			getAxisMotionValue(axis) {
				const dragKey = `_drag${axis.toUpperCase()}`;
				const externalMotionValue = this.visualElement.getProps()[dragKey];
				return externalMotionValue ? externalMotionValue : this.visualElement.getValue(axis, this.visualElement.latestValues[axis] ?? 0);
			}
			snapToCursor(point) {
				eachAxis((axis) => {
					const { drag } = this.getProps();
					if (!shouldDrag(axis, drag, this.currentDirection)) return;
					const { projection } = this.visualElement;
					const axisValue = this.getAxisMotionValue(axis);
					if (projection && projection.layout) {
						const { min, max } = projection.layout.layoutBox[axis];
						/**
						* The layout measurement includes the current transform value,
						* so we need to add it back to get the correct snap position.
						* This fixes an issue where elements with initial coordinates
						* would snap to the wrong position on the first drag.
						*/
						const current = axisValue.get() || 0;
						axisValue.set(point[axis] - mixNumber$1(min, max, .5) + current);
					}
				});
			}
			/**
			* When the viewport resizes we want to check if the measured constraints
			* have changed and, if so, reposition the element within those new constraints
			* relative to where it was before the resize.
			*/
			scalePositionWithinConstraints() {
				if (!this.visualElement.current) return;
				const { drag, dragConstraints } = this.getProps();
				const { projection } = this.visualElement;
				if (!isRefObject(dragConstraints) || !projection || !this.constraints) return;
				/**
				* Stop current animations as there can be visual glitching if we try to do
				* this mid-animation
				*/
				this.stopAnimation();
				/**
				* Record the relative position of the dragged element relative to the
				* constraints box and save as a progress value.
				*/
				const boxProgress = {
					x: 0,
					y: 0
				};
				eachAxis((axis) => {
					const axisValue = this.getAxisMotionValue(axis);
					if (axisValue && this.constraints !== false) {
						const latest = axisValue.get();
						boxProgress[axis] = calcOrigin({
							min: latest,
							max: latest
						}, this.constraints[axis]);
					}
				});
				/**
				* Update the layout of this element and resolve the latest drag constraints
				*/
				const { transformTemplate } = this.visualElement.getProps();
				this.visualElement.current.style.transform = transformTemplate ? transformTemplate({}, "") : "none";
				projection.root && projection.root.updateScroll();
				projection.updateLayout();
				/**
				* Reset constraints so resolveConstraints() will recalculate them
				* with the freshly measured layout rather than returning the cached value.
				*/
				this.constraints = false;
				this.resolveConstraints();
				/**
				* For each axis, calculate the current progress of the layout axis
				* within the new constraints.
				*/
				eachAxis((axis) => {
					if (!shouldDrag(axis, drag, null)) return;
					/**
					* Calculate a new transform based on the previous box progress
					*/
					const axisValue = this.getAxisMotionValue(axis);
					const { min, max } = this.constraints[axis];
					axisValue.set(mixNumber$1(min, max, boxProgress[axis]));
				});
				/**
				* Flush the updated transform to the DOM synchronously to prevent
				* a visual flash at the element's CSS layout position (0,0) when
				* the transform was stripped for measurement.
				*/
				this.visualElement.render();
			}
			addListeners() {
				if (!this.visualElement.current) return;
				elementDragControls.set(this.visualElement, this);
				const element = this.visualElement.current;
				/**
				* Attach a pointerdown event listener on this DOM element to initiate drag tracking.
				*/
				const stopPointerListener = addPointerEvent(element, "pointerdown", (event) => {
					const { drag, dragListener = true } = this.getProps();
					const target = event.target;
					/**
					* Only block drag if clicking on a text input child element
					* (input, textarea, select, contenteditable) where users might
					* want to select text or interact with the control.
					*
					* Buttons and links don't block drag since they don't have
					* click-and-move actions of their own.
					*/
					const isClickingTextInputChild = target !== element && isElementTextInput(target);
					if (drag && dragListener && !isClickingTextInputChild) this.start(event);
				});
				/**
				* If using ref-based constraints, observe both the draggable element
				* and the constraint container for size changes via ResizeObserver.
				* Setup is deferred because dragConstraints.current is null when
				* addListeners first runs (React hasn't committed the ref yet).
				*/
				let stopResizeObservers;
				const measureDragConstraints = () => {
					const { dragConstraints } = this.getProps();
					if (isRefObject(dragConstraints) && dragConstraints.current) {
						this.constraints = this.resolveRefConstraints();
						if (!stopResizeObservers) stopResizeObservers = startResizeObservers(element, dragConstraints.current, () => this.scalePositionWithinConstraints());
					}
				};
				const { projection } = this.visualElement;
				const stopMeasureLayoutListener = projection.addEventListener("measure", measureDragConstraints);
				if (projection && !projection.layout) {
					projection.root && projection.root.updateScroll();
					projection.updateLayout();
				}
				frame.read(measureDragConstraints);
				/**
				* Attach a window resize listener to scale the draggable target within its defined
				* constraints as the window resizes.
				*/
				const stopResizeListener = addDomEvent(window, "resize", () => this.scalePositionWithinConstraints());
				/**
				* If the element's layout changes, calculate the delta and apply that to
				* the drag gesture's origin point.
				*/
				const stopLayoutUpdateListener = projection.addEventListener("didUpdate", (({ delta, hasLayoutChanged }) => {
					if (this.isDragging && hasLayoutChanged) {
						eachAxis((axis) => {
							const motionValue = this.getAxisMotionValue(axis);
							if (!motionValue) return;
							this.originPoint[axis] += delta[axis].translate;
							motionValue.set(motionValue.get() + delta[axis].translate);
						});
						this.visualElement.render();
					}
				}));
				return () => {
					stopResizeListener();
					stopPointerListener();
					stopMeasureLayoutListener();
					stopLayoutUpdateListener && stopLayoutUpdateListener();
					stopResizeObservers && stopResizeObservers();
				};
			}
			getProps() {
				const props = this.visualElement.getProps();
				const { drag = false, dragDirectionLock = false, dragPropagation = false, dragConstraints = false, dragElastic = defaultElastic, dragMomentum = true } = props;
				return {
					...props,
					drag,
					dragDirectionLock,
					dragPropagation,
					dragConstraints,
					dragElastic,
					dragMomentum
				};
			}
		};
		function skipFirstCall(callback) {
			let isFirst = true;
			return () => {
				if (isFirst) {
					isFirst = false;
					return;
				}
				callback();
			};
		}
		function startResizeObservers(element, constraintsElement, onResize) {
			const stopElement = resize(element, skipFirstCall(onResize));
			const stopContainer = resize(constraintsElement, skipFirstCall(onResize));
			return () => {
				stopElement();
				stopContainer();
			};
		}
		function shouldDrag(direction, drag, currentDirection) {
			return (drag === true || drag === direction) && (currentDirection === null || currentDirection === direction);
		}
		/**
		* Based on an x/y offset determine the current drag direction. If both axis' offsets are lower
		* than the provided threshold, return `null`.
		*
		* @param offset - The x/y offset from origin.
		* @param lockThreshold - (Optional) - the minimum absolute offset before we can determine a drag direction.
		*/
		function getCurrentDirection(offset, lockThreshold = 10) {
			let direction = null;
			if (Math.abs(offset.y) > lockThreshold) direction = "y";
			else if (Math.abs(offset.x) > lockThreshold) direction = "x";
			return direction;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/gestures/drag/index.mjs
		var DragGesture = class extends Feature {
			constructor(node) {
				super(node);
				this.removeGroupControls = noop;
				this.removeListeners = noop;
				this.controls = new VisualElementDragControls(node);
			}
			mount() {
				const { dragControls } = this.node.getProps();
				if (dragControls) this.removeGroupControls = dragControls.subscribe(this.controls);
				this.removeListeners = this.controls.addListeners() || noop;
			}
			update() {
				const { dragControls } = this.node.getProps();
				const { dragControls: prevDragControls } = this.node.prevProps || {};
				if (dragControls !== prevDragControls) {
					this.removeGroupControls();
					if (dragControls) this.removeGroupControls = dragControls.subscribe(this.controls);
				}
			}
			unmount() {
				this.removeGroupControls();
				this.removeListeners();
				/**
				* In React 19, during list reorder reconciliation, components may
				* briefly unmount and remount while the drag is still active. If we're
				* actively dragging, we should NOT end the pan session - it will
				* continue tracking pointer events via its window-level listeners.
				*
				* The pan session will be properly cleaned up when:
				* 1. The drag ends naturally (pointerup/pointercancel)
				* 2. The component is truly removed from the DOM
				*/
				if (!this.controls.isDragging) this.controls.endPanSession();
			}
		};
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/gestures/pan/index.mjs
		const asyncHandler = (handler) => (event, info) => {
			if (handler) frame.update(() => handler(event, info), false, true);
		};
		var PanGesture = class extends Feature {
			constructor() {
				super(...arguments);
				this.removePointerDownListener = noop;
			}
			onPointerDown(pointerDownEvent) {
				this.session = new PanSession(pointerDownEvent, this.createPanHandlers(), {
					transformPagePoint: this.node.getTransformPagePoint(),
					contextWindow: getContextWindow(this.node)
				});
			}
			createPanHandlers() {
				const { onPanSessionStart, onPanStart, onPan, onPanEnd } = this.node.getProps();
				return {
					onSessionStart: asyncHandler(onPanSessionStart),
					onStart: asyncHandler(onPanStart),
					onMove: asyncHandler(onPan),
					onEnd: (event, info) => {
						delete this.session;
						if (onPanEnd) frame.postRender(() => onPanEnd(event, info));
					}
				};
			}
			mount() {
				this.removePointerDownListener = addPointerEvent(this.node.current, "pointerdown", (event) => this.onPointerDown(event));
			}
			update() {
				this.session && this.session.updateHandlers(this.createPanHandlers());
			}
			unmount() {
				this.removePointerDownListener();
				this.session && this.session.end();
			}
		};
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/motion/features/layout/MeasureLayout.mjs
		/**
		* Track whether we've taken any snapshots yet. If not,
		* we can safely skip notification of didUpdate.
		*
		* Difficult to capture in a test but to prevent flickering
		* we must set this to true either on update or unmount.
		* Running `next-env/layout-id` in Safari will show this behaviour if broken.
		*/
		let hasTakenAnySnapshot = false;
		var MeasureLayoutWithContext = class extends react.Component {
			/**
			* This only mounts projection nodes for components that
			* need measuring, we might want to do it for all components
			* in order to incorporate transforms
			*/
			componentDidMount() {
				const { visualElement, layoutGroup, switchLayoutGroup, layoutId } = this.props;
				const { projection } = visualElement;
				if (projection) {
					if (layoutGroup.group) layoutGroup.group.add(projection);
					if (switchLayoutGroup && switchLayoutGroup.register && layoutId) switchLayoutGroup.register(projection);
					if (hasTakenAnySnapshot) projection.root.didUpdate();
					projection.addEventListener("animationComplete", () => {
						this.safeToRemove();
					});
					projection.setOptions({
						...projection.options,
						layoutDependency: this.props.layoutDependency,
						onExitComplete: () => this.safeToRemove()
					});
				}
				globalProjectionState.hasEverUpdated = true;
			}
			getSnapshotBeforeUpdate(prevProps) {
				const { layoutDependency, visualElement, drag, isPresent } = this.props;
				const { projection } = visualElement;
				if (!projection) return null;
				/**
				* TODO: We use this data in relegate to determine whether to
				* promote a previous element. There's no guarantee its presence data
				* will have updated by this point - if a bug like this arises it will
				* have to be that we markForRelegation and then find a new lead some other way,
				* perhaps in didUpdate
				*/
				projection.isPresent = isPresent;
				if (prevProps.layoutDependency !== layoutDependency) projection.setOptions({
					...projection.options,
					layoutDependency
				});
				hasTakenAnySnapshot = true;
				if (drag || prevProps.layoutDependency !== layoutDependency || layoutDependency === void 0 || prevProps.isPresent !== isPresent) projection.willUpdate();
				else this.safeToRemove();
				if (prevProps.isPresent !== isPresent) {
					if (isPresent) projection.promote();
					else if (!projection.relegate())
 /**
					* If there's another stack member taking over from this one,
					* it's in charge of the exit animation and therefore should
					* be in charge of the safe to remove. Otherwise we call it here.
					*/
					frame.postRender(() => {
						const stack = projection.getStack();
						if (!stack || !stack.members.length) this.safeToRemove();
					});
				}
				return null;
			}
			componentDidUpdate() {
				const { visualElement, layoutAnchor } = this.props;
				const { projection } = visualElement;
				if (projection) {
					projection.options.layoutAnchor = layoutAnchor;
					projection.root.didUpdate();
					microtask.postRender(() => {
						if (!projection.currentAnimation && projection.isLead()) this.safeToRemove();
					});
				}
			}
			componentWillUnmount() {
				const { visualElement, layoutGroup, switchLayoutGroup: promoteContext } = this.props;
				const { projection } = visualElement;
				hasTakenAnySnapshot = true;
				if (projection) {
					projection.scheduleCheckAfterUnmount();
					if (layoutGroup && layoutGroup.group) layoutGroup.group.remove(projection);
					if (promoteContext && promoteContext.deregister) promoteContext.deregister(projection);
				}
			}
			safeToRemove() {
				const { safeToRemove } = this.props;
				safeToRemove && safeToRemove();
			}
			render() {
				return null;
			}
		};
		function MeasureLayout(props) {
			const [isPresent, safeToRemove] = usePresence();
			const layoutGroup = (0, react.useContext)(LayoutGroupContext);
			return (0, react_jsx_runtime.jsx)(MeasureLayoutWithContext, {
				...props,
				layoutGroup,
				switchLayoutGroup: (0, react.useContext)(SwitchLayoutGroupContext),
				isPresent,
				safeToRemove
			});
		}
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/motion/features/drag.mjs
		const drag = {
			pan: { Feature: PanGesture },
			drag: {
				Feature: DragGesture,
				ProjectionNode: HTMLProjectionNode,
				MeasureLayout
			}
		};
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/gestures/hover.mjs
		function handleHoverEvent(node, event, lifecycle) {
			const { props } = node;
			if (node.animationState && props.whileHover) node.animationState.setActive("whileHover", lifecycle === "Start");
			const callback = props["onHover" + lifecycle];
			if (callback) frame.postRender(() => callback(event, extractEventInfo(event)));
		}
		var HoverGesture = class extends Feature {
			mount() {
				const { current } = this.node;
				if (!current) return;
				this.unmount = hover(current, (_element, startEvent) => {
					handleHoverEvent(this.node, startEvent, "Start");
					return (endEvent) => handleHoverEvent(this.node, endEvent, "End");
				});
			}
			unmount() {}
		};
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/gestures/focus.mjs
		var FocusGesture = class extends Feature {
			constructor() {
				super(...arguments);
				this.isActive = false;
			}
			onFocus() {
				let isFocusVisible = false;
				/**
				* If this element doesn't match focus-visible then don't
				* apply whileHover. But, if matches throws that focus-visible
				* is not a valid selector then in that browser outline styles will be applied
				* to the element by default and we want to match that behaviour with whileFocus.
				*/
				try {
					isFocusVisible = this.node.current.matches(":focus-visible");
				} catch (e) {
					isFocusVisible = true;
				}
				if (!isFocusVisible || !this.node.animationState) return;
				this.node.animationState.setActive("whileFocus", true);
				this.isActive = true;
			}
			onBlur() {
				if (!this.isActive || !this.node.animationState) return;
				this.node.animationState.setActive("whileFocus", false);
				this.isActive = false;
			}
			mount() {
				this.unmount = pipe(addDomEvent(this.node.current, "focus", () => this.onFocus()), addDomEvent(this.node.current, "blur", () => this.onBlur()));
			}
			unmount() {}
		};
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/gestures/press.mjs
		function handlePressEvent(node, event, lifecycle) {
			const { props } = node;
			if (node.current instanceof HTMLButtonElement && node.current.disabled) return;
			if (node.animationState && props.whileTap) node.animationState.setActive("whileTap", lifecycle === "Start");
			const callback = props["onTap" + (lifecycle === "End" ? "" : lifecycle)];
			if (callback) frame.postRender(() => callback(event, extractEventInfo(event)));
		}
		var PressGesture = class extends Feature {
			mount() {
				const { current } = this.node;
				if (!current) return;
				const { globalTapTarget, propagate } = this.node.props;
				this.unmount = press(current, (_element, startEvent) => {
					handlePressEvent(this.node, startEvent, "Start");
					return (endEvent, { success }) => handlePressEvent(this.node, endEvent, success ? "End" : "Cancel");
				}, {
					useGlobalTarget: globalTapTarget,
					stopPropagation: propagate?.tap === false
				});
			}
			unmount() {}
		};
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/motion/features/viewport/observers.mjs
		/**
		* Map an IntersectionHandler callback to an element. We only ever make one handler for one
		* element, so even though these handlers might all be triggered by different
		* observers, we can keep them in the same map.
		*/
		const observerCallbacks = /* @__PURE__ */ new WeakMap();
		/**
		* Multiple observers can be created for multiple element/document roots. Each with
		* different settings. So here we store dictionaries of observers to each root,
		* using serialised settings (threshold/margin) as lookup keys.
		*/
		const observers = /* @__PURE__ */ new WeakMap();
		const fireObserverCallback = (entry) => {
			const callback = observerCallbacks.get(entry.target);
			callback && callback(entry);
		};
		const fireAllObserverCallbacks = (entries) => {
			entries.forEach(fireObserverCallback);
		};
		function initIntersectionObserver({ root, ...options }) {
			const lookupRoot = root || document;
			/**
			* If we don't have an observer lookup map for this root, create one.
			*/
			if (!observers.has(lookupRoot)) observers.set(lookupRoot, {});
			const rootObservers = observers.get(lookupRoot);
			const key = JSON.stringify(options);
			/**
			* If we don't have an observer for this combination of root and settings,
			* create one.
			*/
			if (!rootObservers[key]) rootObservers[key] = new IntersectionObserver(fireAllObserverCallbacks, {
				root,
				...options
			});
			return rootObservers[key];
		}
		function observeIntersection(element, options, callback) {
			const rootInteresectionObserver = initIntersectionObserver(options);
			observerCallbacks.set(element, callback);
			rootInteresectionObserver.observe(element);
			return () => {
				observerCallbacks.delete(element);
				rootInteresectionObserver.unobserve(element);
			};
		}
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/motion/features/viewport/index.mjs
		const thresholdNames = {
			some: 0,
			all: 1
		};
		var InViewFeature = class extends Feature {
			constructor() {
				super(...arguments);
				this.hasEnteredView = false;
				this.isInView = false;
			}
			startObserver() {
				this.stopObserver?.();
				const { viewport = {} } = this.node.getProps();
				const { root, margin: rootMargin, amount = "some", once } = viewport;
				const options = {
					root: root ? root.current : void 0,
					rootMargin,
					threshold: typeof amount === "number" ? amount : thresholdNames[amount]
				};
				const onIntersectionUpdate = (entry) => {
					const { isIntersecting } = entry;
					/**
					* If there's been no change in the viewport state, early return.
					*/
					if (this.isInView === isIntersecting) return;
					this.isInView = isIntersecting;
					/**
					* Handle hasEnteredView. If this is only meant to run once, and
					* element isn't visible, early return. Otherwise set hasEnteredView to true.
					*/
					if (once && !isIntersecting && this.hasEnteredView) return;
					else if (isIntersecting) this.hasEnteredView = true;
					if (this.node.animationState) this.node.animationState.setActive("whileInView", isIntersecting);
					/**
					* Use the latest committed props rather than the ones in scope
					* when this observer is created
					*/
					const { onViewportEnter, onViewportLeave } = this.node.getProps();
					const callback = isIntersecting ? onViewportEnter : onViewportLeave;
					callback && callback(entry);
				};
				this.stopObserver = observeIntersection(this.node.current, options, onIntersectionUpdate);
			}
			mount() {
				this.startObserver();
			}
			update() {
				if (typeof IntersectionObserver === "undefined") return;
				const { props, prevProps } = this.node;
				if ([
					"amount",
					"margin",
					"root"
				].some(hasViewportOptionChanged(props, prevProps))) this.startObserver();
			}
			unmount() {
				this.stopObserver?.();
				this.hasEnteredView = false;
				this.isInView = false;
			}
		};
		function hasViewportOptionChanged({ viewport = {} }, { viewport: prevViewport = {} } = {}) {
			return (name) => viewport[name] !== prevViewport[name];
		}
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/motion/features/gestures.mjs
		const gestureAnimations = {
			inView: { Feature: InViewFeature },
			tap: { Feature: PressGesture },
			focus: { Feature: FocusGesture },
			hover: { Feature: HoverGesture }
		};
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/motion/features/layout.mjs
		const layout = { layout: {
			ProjectionNode: HTMLProjectionNode,
			MeasureLayout
		} };
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs
		const motion = /*@__PURE__*/ createMotionProxy({
			...animations,
			...gestureAnimations,
			...drag,
			...layout
		}, createDomVisualElement);
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/render/dom/features-max.mjs
		/**
		* @public
		*/
		const domMax = {
			renderer: createDomVisualElement,
			...animations,
			...gestureAnimations,
			...drag,
			...layout
		};
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/value/use-motion-value.mjs
		/**
		* Creates a `MotionValue` to track the state and velocity of a value.
		*
		* Usually, these are created automatically. For advanced use-cases, like use with `useTransform`, you can create `MotionValue`s externally and pass them into the animated component via the `style` prop.
		*
		* ```jsx
		* export const MyComponent = () => {
		*   const scale = useMotionValue(1)
		*
		*   return <motion.div style={{ scale }} />
		* }
		* ```
		*
		* @param initial - The initial state.
		*
		* @public
		*/
		function useMotionValue(initial) {
			const value = useConstant(() => motionValue(initial));
			/**
			* If this motion value is being used in static mode, like on
			* the Framer canvas, force components to rerender when the motion
			* value is updated.
			*/
			const { isStatic } = (0, react.useContext)(MotionConfigContext);
			if (isStatic) {
				const [, setLatest] = (0, react.useState)(initial);
				(0, react.useEffect)(() => value.on("change", setLatest), []);
			}
			return value;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/value/use-combine-values.mjs
		function useCombineMotionValues(values, combineValues) {
			/**
			* Initialise the returned motion value. This remains the same between renders.
			*/
			const value = useMotionValue(combineValues());
			/**
			* Create a function that will update the template motion value with the latest values.
			* This is pre-bound so whenever a motion value updates it can schedule its
			* execution in Framesync. If it's already been scheduled it won't be fired twice
			* in a single frame.
			*/
			const updateValue = () => value.set(combineValues());
			/**
			* Synchronously update the motion value with the latest values during the render.
			* This ensures that within a React render, the styles applied to the DOM are up-to-date.
			*/
			updateValue();
			/**
			* Subscribe to all motion values found within the template. Whenever any of them change,
			* schedule an update.
			*/
			useIsomorphicLayoutEffect(() => {
				const scheduleUpdate = () => frame.preRender(updateValue, false, true);
				const subscriptions = values.map((v) => v.on("change", scheduleUpdate));
				return () => {
					subscriptions.forEach((unsubscribe) => unsubscribe());
					cancelFrame(updateValue);
				};
			});
			return value;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/value/use-computed.mjs
		function useComputed(compute) {
			/**
			* Open session of collectMotionValues. Any MotionValue that calls get()
			* will be saved into this array.
			*/
			collectMotionValues.current = [];
			compute();
			const value = useCombineMotionValues(collectMotionValues.current, compute);
			/**
			* Synchronously close session of collectMotionValues.
			*/
			collectMotionValues.current = void 0;
			return value;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/value/use-transform.mjs
		function useTransform(input, inputRangeOrTransformer, outputRangeOrMap, options) {
			if (typeof input === "function") return useComputed(input);
			if (outputRangeOrMap !== void 0 && !Array.isArray(outputRangeOrMap) && typeof inputRangeOrTransformer !== "function") return useMapTransform(input, inputRangeOrTransformer, outputRangeOrMap, options);
			const transformer = typeof inputRangeOrTransformer === "function" ? inputRangeOrTransformer : transform(inputRangeOrTransformer, outputRangeOrMap, options);
			const result = Array.isArray(input) ? useListTransform(input, transformer) : useListTransform([input], ([latest]) => transformer(latest));
			const inputAccelerate = !Array.isArray(input) ? input.accelerate : void 0;
			if (inputAccelerate && !inputAccelerate.isTransformed && typeof inputRangeOrTransformer !== "function" && Array.isArray(outputRangeOrMap) && options?.clamp !== false) result.accelerate = {
				...inputAccelerate,
				times: inputRangeOrTransformer,
				keyframes: outputRangeOrMap,
				isTransformed: true,
				...options?.ease ? { ease: options.ease } : {}
			};
			return result;
		}
		function useListTransform(values, transformer) {
			const latest = useConstant(() => []);
			return useCombineMotionValues(values, () => {
				latest.length = 0;
				const numValues = values.length;
				for (let i = 0; i < numValues; i++) latest[i] = values[i].get();
				return transformer(latest);
			});
		}
		function useMapTransform(inputValue, inputRange, outputMap, options) {
			/**
			* Capture keys once to ensure hooks are called in consistent order.
			*/
			const keys = useConstant(() => Object.keys(outputMap));
			const output = useConstant(() => ({}));
			for (const key of keys) output[key] = useTransform(inputValue, inputRange, outputMap[key], options);
			return output;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/utils/reduced-motion/use-reduced-motion.mjs
		/**
		* A hook that returns `true` if we should be using reduced motion based on the current device's Reduced Motion setting.
		*
		* This can be used to implement changes to your UI based on Reduced Motion. For instance, replacing motion-sickness inducing
		* `x`/`y` animations with `opacity`, disabling the autoplay of background videos, or turning off parallax motion.
		*
		* It will actively respond to changes and re-render your components with the latest setting.
		*
		* ```jsx
		* export function Sidebar({ isOpen }) {
		*   const shouldReduceMotion = useReducedMotion()
		*   const closedX = shouldReduceMotion ? 0 : "-100%"
		*
		*   return (
		*     <motion.div animate={{
		*       opacity: isOpen ? 1 : 0,
		*       x: isOpen ? 0 : closedX
		*     }} />
		*   )
		* }
		* ```
		*
		* @return boolean
		*
		* @public
		*/
		function useReducedMotion() {
			/**
			* Lazy initialisation of prefersReducedMotion
			*/
			!hasReducedMotionListener.current && initPrefersReducedMotion();
			const [shouldReduceMotion] = (0, react.useState)(prefersReducedMotion.current);
			/**
			* TODO See if people miss automatically updating shouldReduceMotion setting
			*/
			return shouldReduceMotion;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/gestures/drag/use-drag-controls.mjs
		/**
		* Can manually trigger a drag gesture on one or more `drag`-enabled `motion` components.
		*
		* ```jsx
		* const dragControls = useDragControls()
		*
		* function startDrag(event) {
		*   dragControls.start(event, { snapToCursor: true })
		* }
		*
		* return (
		*   <>
		*     <div onPointerDown={startDrag} />
		*     <motion.div drag="x" dragControls={dragControls} />
		*   </>
		* )
		* ```
		*
		* @public
		*/
		var DragControls = class {
			constructor() {
				this.componentControls = /* @__PURE__ */ new Set();
			}
			/**
			* Subscribe a component's internal `VisualElementDragControls` to the user-facing API.
			*
			* @internal
			*/
			subscribe(controls) {
				this.componentControls.add(controls);
				return () => this.componentControls.delete(controls);
			}
			/**
			* Start a drag gesture on every `motion` component that has this set of drag controls
			* passed into it via the `dragControls` prop.
			*
			* ```jsx
			* dragControls.start(e, {
			*   snapToCursor: true
			* })
			* ```
			*
			* @param event - PointerEvent
			* @param options - Options
			*
			* @public
			*/
			start(event, options) {
				this.componentControls.forEach((controls) => {
					controls.start(event.nativeEvent || event, options);
				});
			}
			/**
			* Cancels a drag gesture.
			*
			* ```jsx
			* dragControls.cancel()
			* ```
			*
			* @public
			*/
			cancel() {
				this.componentControls.forEach((controls) => {
					controls.cancel();
				});
			}
			/**
			* Stops a drag gesture.
			*
			* ```jsx
			* dragControls.stop()
			* ```
			*
			* @public
			*/
			stop() {
				this.componentControls.forEach((controls) => {
					controls.stop();
				});
			}
		};
		const createDragControls = () => new DragControls();
		/**
		* Usually, dragging is initiated by pressing down on a `motion` component with a `drag` prop
		* and moving it. For some use-cases, for instance clicking at an arbitrary point on a video scrubber, we
		* might want to initiate that dragging from a different component than the draggable one.
		*
		* By creating a `dragControls` using the `useDragControls` hook, we can pass this into
		* the draggable component's `dragControls` prop. It exposes a `start` method
		* that can start dragging from pointer events on other components.
		*
		* ```jsx
		* const dragControls = useDragControls()
		*
		* function startDrag(event) {
		*   dragControls.start(event, { snapToCursor: true })
		* }
		*
		* return (
		*   <>
		*     <div onPointerDown={startDrag} />
		*     <motion.div drag="x" dragControls={dragControls} />
		*   </>
		* )
		* ```
		*
		* @public
		*/
		function useDragControls() {
			return useConstant(createDragControls);
		}
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/context/ReorderContext.mjs
		const ReorderContext = (0, react.createContext)(null);
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/components/Reorder/utils/check-reorder.mjs
		function checkReorder(order, value, offset, velocity) {
			if (!velocity) return order;
			const index = order.findIndex((item) => item.value === value);
			if (index === -1) return order;
			const nextOffset = velocity > 0 ? 1 : -1;
			const nextItem = order[index + nextOffset];
			if (!nextItem) return order;
			const item = order[index];
			const nextLayout = nextItem.layout;
			const nextItemCenter = mixNumber$1(nextLayout.min, nextLayout.max, .5);
			if (nextOffset === 1 && item.layout.max + offset > nextItemCenter || nextOffset === -1 && item.layout.min + offset < nextItemCenter) return moveItem(order, index, index + nextOffset);
			return order;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/components/Reorder/Group.mjs
		function ReorderGroupComponent({ children, as = "ul", axis = "y", onReorder, values, ...props }, externalRef) {
			const Component = useConstant(() => motion[as]);
			const order = [];
			const isReordering = (0, react.useRef)(false);
			const groupRef = (0, react.useRef)(null);
			const context = {
				axis,
				groupRef,
				registerItem: (value, layout) => {
					const idx = order.findIndex((entry) => value === entry.value);
					if (idx !== -1) order[idx].layout = layout[axis];
					else order.push({
						value,
						layout: layout[axis]
					});
					order.sort(compareMin);
				},
				updateOrder: (item, offset, velocity) => {
					if (isReordering.current) return;
					const newOrder = checkReorder(order, item, offset, velocity);
					if (order !== newOrder) {
						isReordering.current = true;
						const newValues = [...values];
						for (let i = 0; i < newOrder.length; i++) if (order[i].value !== newOrder[i].value) {
							const a = values.indexOf(order[i].value);
							const b = values.indexOf(newOrder[i].value);
							if (a !== -1 && b !== -1) [newValues[a], newValues[b]] = [newValues[b], newValues[a]];
							break;
						}
						onReorder(newValues);
					}
				}
			};
			(0, react.useEffect)(() => {
				isReordering.current = false;
			});
			const setRef = (element) => {
				groupRef.current = element;
				if (typeof externalRef === "function") externalRef(element);
				else if (externalRef) externalRef.current = element;
			};
			/**
			* Disable browser scroll anchoring on the group container.
			* When items reorder, scroll anchoring can cause the browser to adjust
			* the scroll position, which interferes with drag position calculations.
			*/
			const groupStyle = {
				overflowAnchor: "none",
				...props.style
			};
			return (0, react_jsx_runtime.jsx)(Component, {
				...props,
				style: groupStyle,
				ref: setRef,
				ignoreStrict: true,
				children: (0, react_jsx_runtime.jsx)(ReorderContext.Provider, {
					value: context,
					children
				})
			});
		}
		const ReorderGroup = /*@__PURE__*/ (0, react.forwardRef)(ReorderGroupComponent);
		function compareMin(a, b) {
			return a.layout.min - b.layout.min;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/components/Reorder/utils/auto-scroll.mjs
		const threshold = 50;
		const maxSpeed = 25;
		const overflowStyles = /* @__PURE__ */ new Set(["auto", "scroll"]);
		const initialScrollLimits = /* @__PURE__ */ new WeakMap();
		const activeScrollEdge = /* @__PURE__ */ new WeakMap();
		let currentGroupElement = null;
		function resetAutoScrollState() {
			if (currentGroupElement) {
				const scrollableAncestor = findScrollableAncestor(currentGroupElement, "y");
				if (scrollableAncestor) {
					activeScrollEdge.delete(scrollableAncestor);
					initialScrollLimits.delete(scrollableAncestor);
				}
				const scrollableAncestorX = findScrollableAncestor(currentGroupElement, "x");
				if (scrollableAncestorX && scrollableAncestorX !== scrollableAncestor) {
					activeScrollEdge.delete(scrollableAncestorX);
					initialScrollLimits.delete(scrollableAncestorX);
				}
				currentGroupElement = null;
			}
		}
		function isScrollableElement(element, axis) {
			const style = getComputedStyle(element);
			const overflow = axis === "x" ? style.overflowX : style.overflowY;
			const isDocumentScroll = element === document.body || element === document.documentElement;
			return overflowStyles.has(overflow) || isDocumentScroll;
		}
		function findScrollableAncestor(element, axis) {
			let current = element?.parentElement;
			while (current) {
				if (isScrollableElement(current, axis)) return current;
				current = current.parentElement;
			}
			return null;
		}
		function getScrollAmount(pointerPosition, scrollElement, axis) {
			const rect = scrollElement.getBoundingClientRect();
			const start = axis === "x" ? Math.max(0, rect.left) : Math.max(0, rect.top);
			const end = axis === "x" ? Math.min(window.innerWidth, rect.right) : Math.min(window.innerHeight, rect.bottom);
			const distanceFromStart = pointerPosition - start;
			const distanceFromEnd = end - pointerPosition;
			if (distanceFromStart < threshold) {
				const intensity = 1 - distanceFromStart / threshold;
				return {
					amount: -25 * intensity * intensity,
					edge: "start"
				};
			} else if (distanceFromEnd < threshold) {
				const intensity = 1 - distanceFromEnd / threshold;
				return {
					amount: maxSpeed * intensity * intensity,
					edge: "end"
				};
			}
			return {
				amount: 0,
				edge: null
			};
		}
		function autoScrollIfNeeded(groupElement, pointerPosition, axis, velocity) {
			if (!groupElement) return;
			currentGroupElement = groupElement;
			const scrollableAncestor = findScrollableAncestor(groupElement, axis);
			if (!scrollableAncestor) return;
			const { amount: scrollAmount, edge } = getScrollAmount(pointerPosition - (axis === "x" ? window.scrollX : window.scrollY), scrollableAncestor, axis);
			if (edge === null) {
				activeScrollEdge.delete(scrollableAncestor);
				initialScrollLimits.delete(scrollableAncestor);
				return;
			}
			const currentActiveEdge = activeScrollEdge.get(scrollableAncestor);
			const isDocumentScroll = scrollableAncestor === document.body || scrollableAncestor === document.documentElement;
			if (currentActiveEdge !== edge) {
				if (!(edge === "start" && velocity < 0 || edge === "end" && velocity > 0)) return;
				activeScrollEdge.set(scrollableAncestor, edge);
				const maxScroll = axis === "x" ? scrollableAncestor.scrollWidth - (isDocumentScroll ? window.innerWidth : scrollableAncestor.clientWidth) : scrollableAncestor.scrollHeight - (isDocumentScroll ? window.innerHeight : scrollableAncestor.clientHeight);
				initialScrollLimits.set(scrollableAncestor, maxScroll);
			}
			if (scrollAmount > 0) {
				const initialLimit = initialScrollLimits.get(scrollableAncestor);
				if ((axis === "x" ? isDocumentScroll ? window.scrollX : scrollableAncestor.scrollLeft : isDocumentScroll ? window.scrollY : scrollableAncestor.scrollTop) >= initialLimit) return;
			}
			if (axis === "x") if (isDocumentScroll) window.scrollBy({ left: scrollAmount });
			else scrollableAncestor.scrollLeft += scrollAmount;
			else if (isDocumentScroll) window.scrollBy({ top: scrollAmount });
			else scrollableAncestor.scrollTop += scrollAmount;
		}
		//#endregion
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/components/Reorder/Item.mjs
		function useDefaultMotionValue(value, defaultValue = 0) {
			return isMotionValue(value) ? value : useMotionValue(defaultValue);
		}
		function ReorderItemComponent({ children, style = {}, value, as = "li", onDrag, onDragEnd, layout = true, ...props }, externalRef) {
			const Component = useConstant(() => motion[as]);
			const context = (0, react.useContext)(ReorderContext);
			const point = {
				x: useDefaultMotionValue(style.x),
				y: useDefaultMotionValue(style.y)
			};
			const zIndex = useTransform([point.x, point.y], ([latestX, latestY]) => latestX || latestY ? 1 : "unset");
			const { axis, registerItem, updateOrder, groupRef } = context;
			return (0, react_jsx_runtime.jsx)(Component, {
				drag: axis,
				...props,
				dragSnapToOrigin: true,
				style: {
					...style,
					x: point.x,
					y: point.y,
					zIndex
				},
				layout,
				onDrag: (event, gesturePoint) => {
					const { velocity, point: pointerPoint } = gesturePoint;
					const offset = point[axis].get();
					updateOrder(value, offset, velocity[axis]);
					autoScrollIfNeeded(groupRef.current, pointerPoint[axis], axis, velocity[axis]);
					onDrag && onDrag(event, gesturePoint);
				},
				onDragEnd: (event, gesturePoint) => {
					resetAutoScrollState();
					onDragEnd && onDragEnd(event, gesturePoint);
				},
				onLayoutMeasure: (measured) => {
					registerItem(value, measured);
				},
				ref: externalRef,
				ignoreStrict: true,
				children
			});
		}
		const ReorderItem = /*@__PURE__*/ (0, react.forwardRef)(ReorderItemComponent);
		//#endregion
		//#region ../../node_modules/.pnpm/motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/motion/dist/es/react.mjs
		const m = m$1;
		//#endregion
		//#region src/client-state.js
		function domainValue(result) {
			if (!result?.ok) throw new Error(result?.error?.message ?? "世界书服务不可用");
			const domain = result.value;
			if (!domain?.ok) {
				const error = new Error(domain?.error?.message ?? "世界书请求失败");
				error.code = domain?.error?.code ?? "UNKNOWN";
				throw error;
			}
			return domain.value;
		}
		//#endregion
		//#region src/client-styles.generated.js
		const css = {
			"addEntryButton": "rp-lore-addEntryButton",
			"advanced": "rp-lore-advanced",
			"backButton": "rp-lore-backButton",
			"book": "rp-lore-book",
			"bookIdentity": "rp-lore-bookIdentity",
			"content": "rp-lore-content",
			"deleteConfirmAction": "rp-lore-deleteConfirmAction",
			"deleteDialog": "rp-lore-deleteDialog",
			"deleteSummary": "rp-lore-deleteSummary",
			"detail": "rp-lore-detail",
			"detailNavigation": "rp-lore-detailNavigation",
			"dialog": "rp-lore-dialog",
			"dragHandle": "rp-lore-dragHandle",
			"editEntryButton": "rp-lore-editEntryButton",
			"entryCopy": "rp-lore-entryCopy",
			"entryList": "rp-lore-entryList",
			"entryMain": "rp-lore-entryMain",
			"entryRow": "rp-lore-entryRow",
			"entryStatus": "rp-lore-entryStatus",
			"entryToolbar": "rp-lore-entryToolbar",
			"error": "rp-lore-error",
			"field": "rp-lore-field",
			"fileInput": "rp-lore-fileInput",
			"headerActions": "rp-lore-headerActions",
			"headerMore": "rp-lore-headerMore",
			"importButton": "rp-lore-importButton",
			"importContent": "rp-lore-importContent",
			"inspectorForm": "rp-lore-inspectorForm",
			"levelPanel": "rp-lore-levelPanel",
			"levelTabs": "rp-lore-levelTabs",
			"list": "rp-lore-list",
			"moreAction": "rp-lore-moreAction",
			"rail": "rp-lore-rail",
			"row": "rp-lore-row",
			"rowText": "rp-lore-rowText",
			"search": "rp-lore-search",
			"secondaryButton": "rp-lore-secondaryButton",
			"shell": "rp-lore-shell",
			"slotEmpty": "rp-lore-slotEmpty",
			"srOnly": "rp-lore-srOnly",
			"state": "rp-lore-state",
			"toggleGrid": "rp-lore-toggleGrid",
			"toolbar": "rp-lore-toolbar",
			"trigger": "rp-lore-trigger",
			"undoNotice": "rp-lore-undoNotice",
			"view": "rp-lore-view",
			"viewTransition": "rp-lore-viewTransition"
		};
		const STYLE_ID = "dsh-roleplay-rp-lore-book-styles";
		const STYLE_OWNER = "dsh-roleplay-rp-lore-book";
		const STYLE_TEXT = ".rp-lore-trigger {\n  display:flex;\n  align-items:center;\n  gap:8px;\n  width:calc(100% + 8px);\n  height:34px;\n  box-sizing:border-box;\n  overflow:hidden;\n  margin:4px -4px;\n  padding:6px 2px 6px 10px;\n  border:0;\n  border-radius:12px;\n  background:transparent;\n  color:var(--dsw-alias-label-primary);\n  cursor:pointer;\n  font:14px/22px var(--dsw-font-family);\n  text-align:left;\n}\n.rp-lore-trigger:hover { background:var(--dsw-alias-interactive-bg-hover); }\n.rp-lore-trigger:focus-visible { outline:2px solid var(--dsw-alias-brand-primary); outline-offset:2px; }\n.rp-lore-trigger.rp-lore-rail { justify-content:center; width:36px; height:36px; margin:8px 0 10px; padding:0; border-radius:50%; }\n\n.rp-lore-dialog {\n  width:min(1180px,calc(100vw - 48px));\n  height:min(780px,calc(100dvh - 48px));\n  box-sizing:border-box;\n}\n.rp-lore-content { flex:1; height:100%; min-height:0; overflow:hidden; padding:0!important; }\n.rp-lore-content>:first-child { min-height:48px; box-sizing:border-box; padding:10px 14px 8px 24px; border-bottom:1px solid var(--dsw-alias-separator-primary); }\n.rp-lore-content>:last-child { flex:1; min-width:0; min-height:0; overflow:hidden; margin-top:0; padding:0; }\n.rp-lore-shell { display:flex; height:100%; min-height:0; flex-direction:column; overflow:hidden; overscroll-behavior:contain; }\n.rp-lore-view { flex:1; min-height:0; overflow:hidden; }\n.rp-lore-viewTransition { height:100%; overflow:hidden; }\n\n.rp-lore-toolbar {\n  display:grid;\n  grid-template-columns:minmax(0,1fr) auto;\n  gap:10px;\n  padding:14px 16px;\n  border-bottom:1px solid var(--dsw-alias-separator-primary);\n}\n.rp-lore-search {\n  display:flex;\n  min-height:40px;\n  align-items:center;\n  gap:9px;\n  box-sizing:border-box;\n  padding:0 12px;\n  border:1px solid var(--dsw-alias-border-l2);\n  border-radius:10px;\n  background:var(--dsw-alias-bg-layer-2);\n  color:var(--dsw-alias-label-tertiary);\n}\n.rp-lore-search:focus-within { border-color:var(--dsw-alias-brand-primary); box-shadow:0 0 0 2px color-mix(in srgb,var(--dsw-alias-brand-primary) 14%,transparent); }\n.rp-lore-search input { width:100%; min-width:0; border:0; outline:0; background:transparent; color:var(--dsw-alias-label-primary); font:13px/20px var(--dsw-font-family); }\n.rp-lore-search input::placeholder { color:var(--dsw-alias-label-tertiary); }\n.rp-lore-importButton {\n  position:relative;\n  display:flex;\n  min-height:40px;\n  align-items:center;\n  overflow:hidden;\n  padding:0 14px;\n  border-radius:10px;\n  background:var(--dsw-alias-button-primary-fill);\n  color:var(--dsw-alias-label-primary-foreground);\n  cursor:pointer;\n  font:600 12px/20px var(--dsw-font-family);\n}\n.rp-lore-importButton:focus-within { outline:2px solid var(--dsw-alias-brand-primary); outline-offset:2px; }\n.rp-lore-importButton[aria-disabled=\"true\"] { cursor:wait; }\n.rp-lore-importContent { display:inline-flex; align-items:center; justify-content:center; gap:7px; white-space:nowrap; }\n.rp-lore-fileInput { position:absolute; inset:0; width:100%; height:100%; opacity:0; cursor:pointer; }\n.rp-lore-fileInput:disabled { cursor:wait; }\n\n.rp-lore-error { margin:10px 18px 0; padding:9px 11px; border-radius:9px; background:var(--dsw-alias-state-error-tertiary); color:var(--dsw-alias-state-error-primary); font-size:12px; line-height:18px; }\n.rp-lore-state { display:flex; min-height:180px; align-items:center; justify-content:center; padding:24px; color:var(--dsw-alias-label-tertiary); text-align:center; font-size:12px; }\n.rp-lore-srOnly { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); clip-path:inset(50%); white-space:nowrap; }\n\n.rp-lore-list {\n  display:grid;\n  height:100%;\n  box-sizing:border-box;\n  grid-template-columns:repeat(auto-fill,minmax(280px,1fr));\n  align-content:start;\n  gap:8px;\n  overflow-y:auto;\n  overscroll-behavior:contain;\n  padding:14px 16px;\n}\n.rp-lore-row {\n  display:grid;\n  grid-template-columns:42px minmax(0,1fr);\n  align-items:center;\n  gap:10px;\n  width:100%;\n  padding:10px;\n  border:1px solid transparent;\n  border-radius:11px;\n  background:transparent;\n  color:var(--dsw-alias-label-primary);\n  cursor:pointer;\n  text-align:left;\n}\n.rp-lore-row:hover { border-color:var(--dsw-alias-border-l2); background:var(--dsw-alias-interactive-bg-hover); }\n.rp-lore-row:focus-visible { outline:2px solid var(--dsw-alias-brand-primary); outline-offset:2px; }\n.rp-lore-row:disabled { opacity:.55; cursor:not-allowed; }\n.rp-lore-book { display:flex; width:42px; height:42px; align-items:center; justify-content:center; border-radius:10px; background:var(--dsw-specific-tip); color:var(--dsw-alias-brand-primary); font-weight:600; }\n.rp-lore-rowText { display:flex; min-width:0; flex-direction:column; gap:2px; }\n.rp-lore-rowText strong,.rp-lore-rowText small { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }\n.rp-lore-rowText strong { font-size:13px; font-weight:550; }\n.rp-lore-rowText small { color:var(--dsw-alias-label-tertiary); font-size:11px; }\n\n.rp-lore-detailNavigation { display:flex; min-height:54px; align-items:center; padding:0 16px; border-bottom:1px solid var(--dsw-alias-separator-primary); }\n.rp-lore-backButton { display:flex; min-height:36px; align-items:center; gap:4px; padding:0 10px 0 6px; border:0; border-radius:9px; background:transparent; color:var(--dsw-alias-label-secondary); cursor:pointer; font:12px/20px var(--dsw-font-family); }\n.rp-lore-backButton:hover { background:var(--dsw-alias-interactive-bg-hover); color:var(--dsw-alias-label-primary); }\n.rp-lore-backButton:focus-visible { outline:2px solid var(--dsw-alias-brand-primary); outline-offset:2px; }\n\n.rp-lore-detail {\n  position:relative;\n  width:min(980px,100%);\n  height:100%;\n  min-height:0;\n  box-sizing:border-box;\n  overflow-y:auto;\n  overscroll-behavior:contain;\n  margin:0 auto;\n  padding:0 28px 90px;\n}\n.rp-lore-detail>header { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; padding:22px 0 14px; }\n.rp-lore-bookIdentity { min-width:0; }\n.rp-lore-bookIdentity input { width:min(620px,70vw); border:0; border-bottom:1px solid transparent; outline:0; background:transparent; color:var(--dsw-alias-label-primary); font:600 22px/30px var(--dsw-font-family); }\n.rp-lore-bookIdentity input:hover { border-color:var(--dsw-alias-border-l2); }\n.rp-lore-bookIdentity input:focus { border-color:var(--dsw-alias-brand-primary); }\n.rp-lore-detail header p { margin:3px 0 0; color:var(--dsw-alias-label-tertiary); font-size:12px; line-height:18px; }\n.rp-lore-headerActions { display:flex; align-items:center; gap:6px; }\n.rp-lore-headerActions>button,.rp-lore-headerActions>span>button,.rp-lore-headerMore { display:inline-flex; min-width:36px; min-height:36px; align-items:center; justify-content:center; padding:0 9px; border:0; border-radius:9px; background:transparent; color:var(--dsw-alias-label-secondary); cursor:pointer; font:12px/18px var(--dsw-font-family); }\n.rp-lore-headerActions button:hover { background:var(--dsw-alias-interactive-bg-hover); color:var(--dsw-alias-label-primary); }\n.rp-lore-headerActions button:focus-visible { outline:2px solid var(--dsw-alias-brand-primary); outline-offset:1px; }\n\n.rp-lore-undoNotice { display:flex; align-items:center; justify-content:space-between; gap:12px; margin:8px 0 0; padding:9px 11px; border-radius:9px; background:var(--dsw-alias-bg-layer-1); color:var(--dsw-alias-label-secondary); font-size:12px; }\n.rp-lore-undoNotice button { min-height:30px; padding:0 9px; border:1px solid var(--dsw-alias-border-l2); border-radius:8px; background:transparent; color:var(--dsw-alias-label-primary); cursor:pointer; font:12px/18px var(--dsw-font-family); }\n\n.rp-lore-entryToolbar { display:grid; grid-template-columns:minmax(0,1fr) 132px auto; gap:8px; margin-top:14px; }\n.rp-lore-entryToolbar select { min-height:40px; padding:0 34px 0 11px; border:1px solid var(--dsw-alias-border-l2); border-radius:10px; outline:0; background:var(--dsw-alias-bg-layer-2); color:var(--dsw-alias-label-primary); font:12px/20px var(--dsw-font-family); }\n.rp-lore-entryToolbar select:focus-visible { border-color:var(--dsw-alias-brand-primary); box-shadow:0 0 0 2px color-mix(in srgb,var(--dsw-alias-brand-primary) 14%,transparent); }\n.rp-lore-addEntryButton { display:inline-flex; min-height:40px; align-items:center; justify-content:center; gap:6px; padding:0 14px; border:1px solid var(--dsw-alias-button-primary-fill); border-radius:10px; background:var(--dsw-alias-button-primary-fill); color:var(--dsw-alias-label-primary-foreground); cursor:pointer; white-space:nowrap; font:600 12px/20px var(--dsw-font-family); }\n.rp-lore-addEntryButton:hover { filter:brightness(.98); }\n.rp-lore-addEntryButton:focus-visible { outline:2px solid var(--dsw-alias-brand-primary); outline-offset:2px; }\n\n.rp-lore-levelTabs { position:sticky; z-index:10; top:0; display:flex; min-width:0; gap:24px; overflow-x:auto; isolation:isolate; margin:14px -2px 0; padding:0 2px; border-bottom:1px solid var(--dsw-alias-separator-primary); background:var(--dsw-alias-bg-base); scrollbar-width:none; }\n.rp-lore-levelTabs::-webkit-scrollbar { display:none; }\n.rp-lore-levelTabs button { position:relative; display:inline-flex; min-height:44px; flex:0 0 auto; align-items:center; gap:7px; padding:0 2px; border:0; background:transparent; color:var(--dsw-alias-label-tertiary); cursor:pointer; font:550 13px/20px var(--dsw-font-family); }\n.rp-lore-levelTabs button:hover { color:var(--dsw-alias-label-primary); }\n.rp-lore-levelTabs button[aria-selected=\"true\"] { color:var(--dsw-alias-label-primary); font-weight:650; }\n.rp-lore-levelTabs button[aria-selected=\"true\"]::after { position:absolute; right:0; bottom:-1px; left:0; height:2px; border-radius:2px 2px 0 0; background:var(--dsw-alias-brand-primary); content:\"\"; }\n.rp-lore-levelTabs button:focus-visible { outline:2px solid var(--dsw-alias-brand-primary); outline-offset:-3px; border-radius:7px; }\n.rp-lore-levelTabs small { display:inline-flex; min-width:20px; height:20px; align-items:center; justify-content:center; box-sizing:border-box; padding:0 6px; border-radius:999px; background:var(--dsw-alias-bg-layer-1); color:var(--dsw-alias-label-tertiary); font-size:10px; font-variant-numeric:tabular-nums; }\n.rp-lore-levelTabs button[aria-selected=\"true\"] small { background:var(--dsw-specific-tip); color:var(--dsw-alias-label-primary); }\n\n.rp-lore-levelPanel { min-height:220px; padding:6px 0 12px; outline:0; }\n.rp-lore-entryList { display:flex; flex-direction:column; margin:0; padding:0; list-style:none; }\n.rp-lore-entryRow { display:grid; grid-template-columns:30px minmax(0,1fr) auto 36px; align-items:center; gap:6px; min-height:70px; border-bottom:1px solid var(--dsw-alias-separator-primary); }\n.rp-lore-entryRow:last-child { border-bottom-color:transparent; }\n.rp-lore-entryRow:hover { background:color-mix(in srgb,var(--dsw-alias-interactive-bg-hover) 72%,transparent); }\n.rp-lore-dragHandle { display:flex; width:30px; height:40px; align-items:center; justify-content:center; padding:0; border:0; border-radius:8px; background:transparent; color:var(--dsw-alias-label-dimmed); cursor:grab; touch-action:none; }\n.rp-lore-dragHandle:active { cursor:grabbing; }\n.rp-lore-dragHandle:hover { background:var(--dsw-alias-interactive-bg-hover); }\n.rp-lore-dragHandle:focus-visible { outline:2px solid var(--dsw-alias-brand-primary); outline-offset:-2px; }\n.rp-lore-dragHandle span { width:12px; height:18px; opacity:.7; background:radial-gradient(circle,var(--dsw-alias-label-tertiary) 1.3px,transparent 1.5px) 0 0/6px 6px; }\n.rp-lore-entryMain { display:grid; grid-template-columns:minmax(0,1fr) auto; align-items:center; gap:14px; min-width:0; min-height:54px; padding:7px 8px; border:0; border-radius:9px; background:transparent; color:var(--dsw-alias-label-primary); text-align:left; cursor:pointer; }\n.rp-lore-entryMain:hover { background:var(--dsw-alias-interactive-bg-hover); }\n.rp-lore-entryMain:focus-visible { outline:2px solid var(--dsw-alias-brand-primary); outline-offset:-2px; }\n.rp-lore-entryCopy { display:flex; min-width:0; flex-direction:column; gap:4px; }\n.rp-lore-entryCopy strong,.rp-lore-entryCopy small { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }\n.rp-lore-entryCopy strong { font-size:14px; line-height:20px; font-weight:600; }\n.rp-lore-entryCopy small { color:var(--dsw-alias-label-tertiary); font-size:12px; line-height:18px; }\n.rp-lore-entryStatus { display:inline-flex; align-items:center; gap:6px; padding:4px 8px; border-radius:999px; background:var(--dsw-alias-bg-layer-1); color:var(--dsw-alias-label-secondary); font-size:11px; line-height:16px; white-space:nowrap; }\n.rp-lore-entryStatus i { width:7px; height:7px; border-radius:50%; background:var(--dsw-alias-label-dimmed); }\n.rp-lore-entryStatus[data-enabled=\"true\"] i { background:var(--dsw-alias-state-success-primary); }\n.rp-lore-editEntryButton,.rp-lore-moreAction { display:inline-flex; height:36px; align-items:center; justify-content:center; border:0; border-radius:9px; background:transparent; color:var(--dsw-alias-label-tertiary); cursor:pointer; }\n.rp-lore-editEntryButton { gap:5px; padding:0 9px; font:12px/18px var(--dsw-font-family); }\n.rp-lore-moreAction { width:36px; padding:0; }\n.rp-lore-editEntryButton:hover,.rp-lore-moreAction:hover { background:var(--dsw-alias-interactive-bg-hover); color:var(--dsw-alias-label-primary); }\n.rp-lore-editEntryButton:focus-visible,.rp-lore-moreAction:focus-visible { outline:2px solid var(--dsw-alias-brand-primary); outline-offset:-2px; }\n.rp-lore-slotEmpty { display:flex; min-height:190px; flex-direction:column; align-items:center; justify-content:center; gap:5px; margin:10px 0 0; color:var(--dsw-alias-label-tertiary); text-align:center; }\n.rp-lore-slotEmpty strong { color:var(--dsw-alias-label-secondary); font-size:13px; line-height:20px; font-weight:600; }\n.rp-lore-slotEmpty span { font-size:12px; line-height:18px; }\n\n.rp-lore-inspectorForm { display:flex; flex-direction:column; gap:16px; }\n.rp-lore-field { display:flex; flex-direction:column; gap:6px; color:var(--dsw-alias-label-secondary); font-size:12px; font-weight:550; }\n.rp-lore-field input,.rp-lore-field textarea,.rp-lore-field select { width:100%; box-sizing:border-box; padding:9px 10px; resize:vertical; border:1px solid var(--dsw-alias-border-l2); border-radius:9px; outline:0; background:var(--dsw-alias-bg-layer-2); color:var(--dsw-alias-label-primary); font:13px/20px var(--dsw-font-family); }\n.rp-lore-field input:focus,.rp-lore-field textarea:focus,.rp-lore-field select:focus { border-color:var(--dsw-alias-brand-primary); box-shadow:0 0 0 2px color-mix(in srgb,var(--dsw-alias-brand-primary) 14%,transparent); }\n.rp-lore-toggleGrid { display:grid; grid-template-columns:1fr 1fr; gap:9px; }\n.rp-lore-toggleGrid label { display:flex; min-height:32px; align-items:center; gap:8px; font-size:12px; }\n.rp-lore-toggleGrid input { width:16px; height:16px; accent-color:var(--dsw-alias-brand-primary); }\n.rp-lore-advanced { padding-top:10px; border-top:1px solid var(--dsw-alias-separator-primary); }\n.rp-lore-advanced summary { margin-bottom:12px; cursor:pointer; font-size:12px; font-weight:550; }\n\n.rp-lore-deleteDialog { width:min(460px,calc(100vw - 32px)); }\n.rp-lore-deleteSummary { display:flex; flex-direction:column; gap:5px; padding:13px 14px; border:1px solid color-mix(in srgb,var(--dsw-alias-state-error-primary) 18%,var(--dsw-alias-border-l2)); border-radius:12px; background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 4%,var(--dsw-alias-bg-layer-1)); color:var(--dsw-alias-label-secondary); }\n.rp-lore-deleteSummary strong { color:var(--dsw-alias-label-primary); font-size:13px; line-height:20px; font-weight:600; }\n.rp-lore-deleteSummary span { font-size:12px; line-height:19px; }\n.rp-lore-secondaryButton,.rp-lore-deleteConfirmAction { display:inline-flex; min-height:36px; align-items:center; justify-content:center; padding:0 14px; border:1px solid var(--dsw-alias-border-l2); border-radius:10px; background:transparent; cursor:pointer; font:600 12px/20px var(--dsw-font-family); }\n.rp-lore-secondaryButton { color:var(--dsw-alias-label-secondary); }\n.rp-lore-deleteConfirmAction { border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary) 46%,var(--dsw-alias-border-l2)); color:var(--dsw-alias-state-error-primary); }\n.rp-lore-secondaryButton:hover,.rp-lore-deleteConfirmAction:hover { background:var(--dsw-alias-interactive-bg-hover); }\n.rp-lore-secondaryButton:focus-visible,.rp-lore-deleteConfirmAction:focus-visible { outline:2px solid var(--dsw-alias-brand-primary); outline-offset:2px; }\n.rp-lore-secondaryButton:disabled,.rp-lore-deleteConfirmAction:disabled { opacity:.5; cursor:not-allowed; }\n\n@media(max-width:720px) {\n  .rp-lore-dialog { width:calc(100vw - 16px); height:calc(100dvh - 16px); }\n  .rp-lore-list { grid-template-columns:1fr; padding:12px; }\n  .rp-lore-toolbar { grid-template-columns:1fr; }\n  .rp-lore-importButton { justify-content:center; }\n  .rp-lore-detail { padding:18px 14px 88px; }\n  .rp-lore-detail>header { align-items:center; }\n  .rp-lore-bookIdentity input { width:100%; font-size:20px; }\n  .rp-lore-entryToolbar { grid-template-columns:minmax(0,1fr) auto; }\n  .rp-lore-entryToolbar .rp-lore-search { grid-column:1/-1; }\n  .rp-lore-entryToolbar select { min-width:0; }\n  .rp-lore-levelTabs { gap:20px; }\n  .rp-lore-entryRow { grid-template-columns:28px minmax(0,1fr) 36px; gap:4px; }\n  .rp-lore-editEntryButton { display:none; }\n  .rp-lore-entryMain { grid-template-columns:minmax(0,1fr); gap:5px; }\n  .rp-lore-entryStatus { width:max-content; padding:2px 0; background:transparent; }\n  .rp-lore-toggleGrid { grid-template-columns:1fr; }\n}\n";
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
		//#region ../../packages/rp-ui/src/index.js
		const h$1 = react.default.createElement;
		Object.freeze({
			fill: "none",
			stroke: "currentColor",
			strokeWidth: 1.25,
			strokeLinecap: "round",
			strokeLinejoin: "round"
		});
		Object.freeze({
			conversation: [["path", { d: "M2 2.75h12v8.5H7.1l-3.35 2.5v-2.5H2z" }], ["path", { d: "M5 6h6M5 8.5h4" }]],
			state: [["ellipse", {
				cx: 8,
				cy: 3.5,
				rx: 5.25,
				ry: 1.75
			}], ["path", { d: "M2.75 3.5v4c0 .97 2.35 1.75 5.25 1.75s5.25-.78 5.25-1.75v-4M2.75 7.5v4c0 .97 2.35 1.75 5.25 1.75s5.25-.78 5.25-1.75v-4" }]],
			lore: [["circle", {
				cx: 8,
				cy: 8,
				r: 5.75
			}], ["path", { d: "M2.5 8h11M8 2.25c1.65 1.55 2.5 3.47 2.5 5.75S9.65 12.2 8 13.75C6.35 12.2 5.5 10.28 5.5 8S6.35 3.8 8 2.25z" }]],
			persona: [["circle", {
				cx: 8,
				cy: 5.15,
				r: 2.6
			}], ["path", { d: "M2.75 13.25c.7-2.65 2.45-4 5.25-4s4.55 1.35 5.25 4" }]],
			preset: [["rect", {
				x: 2.5,
				y: 2.25,
				width: 11,
				height: 11.5,
				rx: 1.6
			}], ["path", { d: "m4.5 6 .8.8 1.45-1.65M8.5 6h2.75M4.5 10l.8.8 1.45-1.65M8.5 10h2.75" }]],
			"writing-style": [["path", { d: "M3 2.25h8.5v5.5M3 5h5M3 7.5h3.75M3 10h2" }], ["path", { d: "m7 12.75.45-2.15 4.85-4.85 1.95 1.95-4.85 4.85z" }]],
			session: [
				["path", { d: "M2.5 4h3M8.5 4h5M2.5 8h6M11.5 8h2M2.5 12h2M7.5 12h6" }],
				["circle", {
					cx: 7,
					cy: 4,
					r: 1.5
				}],
				["circle", {
					cx: 10,
					cy: 8,
					r: 1.5
				}],
				["circle", {
					cx: 6,
					cy: 12,
					r: 1.5
				}]
			],
			mixed: [["path", { d: "m8 2 5.5 3L8 8 2.5 5z" }], ["path", { d: "m2.5 8 5.5 3 5.5-3M2.5 11l5.5 3 5.5-3" }]],
			attachment: [["path", { d: "m6 8.75 4.35-4.35a2.2 2.2 0 0 1 3.1 3.1L8 12.95a3.25 3.25 0 0 1-4.6-4.6l5.1-5.1M5.75 10.5l4.9-4.9" }]]
		});
		const workbenchTransition = {
			duration: .16,
			ease: [
				.2,
				0,
				0,
				1
			]
		};
		const inspectorTransition = {
			duration: .22,
			ease: [
				.2,
				0,
				0,
				1
			]
		};
		function LoadingSpinner({ size = 14, className = "" }) {
			ensureWorkbenchStyles();
			const reduced = useReducedMotion();
			return h$1(m.span, {
				className: `rpui-loadingSpinner ${className}`.trim(),
				style: { "--rpui-loading-spinner-size": `${size}px` },
				initial: false,
				animate: reduced ? void 0 : { rotate: 360 },
				transition: reduced ? void 0 : {
					duration: .8,
					repeat: Infinity,
					ease: "linear"
				},
				"aria-hidden": true
			});
		}
		function RpMotionProvider({ children }) {
			ensureWorkbenchStyles();
			return h$1(MotionConfig, {
				reducedMotion: "user",
				transition: workbenchTransition
			}, h$1(LazyMotion, {
				features: domMax,
				strict: true
			}, children));
		}
		function ContentTransition({ viewKey, children, className = "" }) {
			return h$1(m.div, {
				key: viewKey,
				className: `rpui-content ${className}`.trim(),
				initial: false,
				animate: {
					opacity: 1,
					y: 0
				},
				transition: workbenchTransition
			}, children);
		}
		function DirtyBar({ dirty, message = "有未保存的修改", error, saving, disabled = false, onDiscard, onSave, saveLabel = "保存" }) {
			const reduced = useReducedMotion();
			return h$1(AnimatePresence, null, dirty || error ? h$1(m.div, {
				className: "rpui-dirtybar",
				role: error ? "alert" : "status",
				initial: {
					opacity: 0,
					...reduced ? {} : { y: 8 }
				},
				animate: {
					opacity: 1,
					y: 0
				},
				exit: {
					opacity: 0,
					...reduced ? {} : { y: 8 }
				}
			}, h$1("span", null, h$1("strong", null, error ? "没有保存成功" : message), error ? h$1("small", null, error) : null), dirty && onDiscard ? h$1("button", {
				type: "button",
				onClick: onDiscard,
				disabled: saving || disabled
			}, "撤销修改") : null, dirty && onSave ? h$1("button", {
				type: "button",
				className: "rpui-primary",
				onClick: onSave,
				disabled: saving || disabled
			}, saving ? "正在保存…" : saveLabel) : null) : null);
		}
		function Inspector({ open, title, description, onClose, children, footer }) {
			const reduced = useReducedMotion();
			const panelRef = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				if (!open) return;
				const previous = document.activeElement;
				panelRef.current?.focus();
				return () => {
					if (previous instanceof HTMLElement) previous.focus();
				};
			}, [open]);
			return h$1(AnimatePresence, null, open ? h$1(react.default.Fragment, null, h$1(m.button, {
				className: "rpui-inspector-scrim",
				type: "button",
				"aria-label": "关闭编辑面板",
				onClick: onClose,
				initial: { opacity: 0 },
				animate: { opacity: 1 },
				exit: { opacity: 0 }
			}), h$1(m.aside, {
				ref: panelRef,
				tabIndex: -1,
				className: "rpui-inspector",
				role: "dialog",
				"aria-modal": true,
				"aria-label": title,
				initial: {
					opacity: 0,
					...reduced ? {} : { x: 24 }
				},
				animate: {
					opacity: 1,
					x: 0
				},
				exit: {
					opacity: 0,
					...reduced ? {} : { x: 24 }
				},
				transition: inspectorTransition
			}, h$1("header", null, h$1("span", null, h$1("h3", null, title), description ? h$1("p", null, description) : null), h$1("button", {
				type: "button",
				onClick: onClose,
				"aria-label": "关闭"
			}, "×")), h$1("div", { className: "rpui-inspector-body" }, children), footer ? h$1("footer", null, footer) : null)) : null);
		}
		let styleMounted = false;
		function ensureWorkbenchStyles() {
			if (styleMounted || typeof document === "undefined") return;
			styleMounted = true;
			const style = document.createElement("style");
			style.dataset.rpAgentUi = "true";
			style.textContent = `
.rpui-loadingSpinner{display:inline-block;width:var(--rpui-loading-spinner-size,14px);height:var(--rpui-loading-spinner-size,14px);box-sizing:border-box;flex:0 0 auto;border:2px solid currentColor;border-top-color:transparent;border-radius:50%}.rpui-tabs{display:flex;gap:3px;padding:3px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-1,#f5f5f5) 82%,transparent);border-radius:13px;width:max-content;max-width:100%;overflow:auto;overscroll-behavior-inline:contain;scroll-snap-type:x proximity;scrollbar-width:none}.rpui-tabs::-webkit-scrollbar{display:none}.rpui-tab{position:relative;isolation:isolate;display:grid;grid-template-columns:16px minmax(0,auto);grid-template-areas:"icon label" "icon meta";align-items:center;gap:0 7px;min-width:104px;padding:6px 10px;border:0;background:transparent;color:var(--dsw-alias-label-secondary,#666);border-radius:10px;cursor:pointer;text-align:left;scroll-snap-align:center}.rpui-tab[aria-selected="true"]{color:var(--dsw-alias-label-primary,#111)}.rpui-tab>span:not(.rpui-tab-indicator):not(.rpui-tab-icon){grid-area:label;font-size:12px;line-height:17px;font-weight:600}.rpui-tab>span.rpui-tab-icon:not(.rpui-tab-indicator){display:grid;grid-area:icon;place-items:center}.rpui-tab small{grid-area:meta;color:var(--dsw-alias-label-tertiary,#8a8a8a);font-size:10px;line-height:14px}.rpui-tab-indicator{position:absolute;z-index:-1;inset:0;border-radius:10px;background:var(--dsw-alias-bg-base,#fff);box-shadow:0 1px 5px rgba(0,0,0,.08)}.rpui-content{display:flex;min-height:0;flex:1;flex-direction:column}.rpui-outline{display:flex;flex-direction:column;gap:2px;position:sticky;top:0}.rpui-outline button{border:0;border-left:2px solid transparent;background:transparent;padding:8px 10px;color:var(--dsw-alias-text-secondary,#666);text-align:left;cursor:pointer}.rpui-outline button.is-active{border-color:var(--dsw-alias-brand-primary,#111);color:var(--dsw-alias-text-primary,#111);font-weight:650}.rpui-dirtybar{position:absolute;z-index:20;left:50%;bottom:18px;transform:translateX(-50%);display:flex;align-items:center;gap:10px;max-width:min(720px,calc(100% - 32px));padding:9px 10px 9px 14px;border:1px solid var(--dsw-alias-border-secondary,#ddd);border-radius:14px;background:var(--dsw-alias-bg-base,#fff);box-shadow:0 12px 36px rgba(0,0,0,.14)}.rpui-dirtybar>span{display:flex;flex-direction:column;min-width:180px;margin-right:auto}.rpui-dirtybar small{color:var(--dsw-alias-text-error,#b42318)}.rpui-dirtybar button,.rpui-inspector button{border:1px solid var(--dsw-alias-border-secondary,#ddd);border-radius:9px;background:transparent;padding:7px 11px;cursor:pointer}.rpui-dirtybar .rpui-primary{border-color:#111;background:#111;color:#fff}.rpui-inspector-scrim{position:fixed;z-index:90;inset:0;border:0;background:rgba(0,0,0,.16)}.rpui-inspector{position:fixed;z-index:91;inset:0 0 0 auto;width:min(480px,100%);display:flex;flex-direction:column;background:var(--dsw-alias-bg-base,#fff);box-shadow:-16px 0 42px rgba(0,0,0,.16);outline:0}.rpui-inspector>header{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:20px 22px;border-bottom:1px solid var(--dsw-alias-border-secondary,#e5e5e5)}.rpui-inspector h3,.rpui-inspector p{margin:0}.rpui-inspector p{margin-top:4px;color:var(--dsw-alias-text-secondary,#666);font-size:13px}.rpui-inspector>header button{border:0;font-size:23px;padding:0 5px}.rpui-inspector-body{overflow:auto;flex:1;padding:22px}.rpui-inspector>footer{display:flex;justify-content:flex-end;gap:8px;padding:14px 22px;border-top:1px solid var(--dsw-alias-border-secondary,#e5e5e5)}
@media(max-width:720px){.rpui-tabs{width:100%}.rpui-tab{min-width:96px;flex:1}.rpui-inspector{width:100%}.rpui-outline{position:static;flex-direction:row;overflow:auto}.rpui-dirtybar{bottom:10px}.rpui-dirtybar>span{min-width:0}}
@media(prefers-reduced-motion:reduce){.rpui-tab,.rpui-outline button{scroll-behavior:auto}}
`;
			document.head.append(style);
		}
		//#endregion
		//#region src/client.js
		const inject = [
			"slots",
			"rpRemote",
			"rpAssetEditors"
		];
		const h = react.default.createElement;
		const MODAL_SCROLL_LOCK = Symbol.for("dsh-roleplay.asset-modal-scroll-lock");
		const LEVELS = [
			{
				id: "worldDescription",
				label: "世界设定",
				short: "世界"
			},
			{
				id: "roleplayGuide",
				label: "扮演指导",
				short: "指导"
			},
			{
				id: "importantRules",
				label: "重要规则",
				short: "规则"
			}
		];
		function apply(ctx) {
			ctx.effect(ensureStyles);
			ctx.effect(() => ctx.rpAssetEditors.register("lorebook", LoreSessionEditor), "rp-lore-book: canonical session editor");
			ctx.slots.inject("rp-assets.lore-entry", () => ctx.slots.register({
				name: "rp-assets.lore-entry",
				inject: () => ({ connection: ctx.rpRemote })
			}, LoreLibraryEntry));
		}
		function LoreLibraryEntry({ wide, connection }) {
			const [open, setOpen] = (0, react.useState)(false);
			return h(RpMotionProvider, null, h("button", {
				type: "button",
				className: wide ? css.trigger : `${css.trigger} ${css.rail}`,
				onClick: () => setOpen(true),
				"aria-label": "世界书"
			}, h(_deepseek_ai_dsh_client_ui_primitives.IconBrowseOutline16, { size: wide ? 16 : 18 }), wide ? h("span", null, "世界书") : null), h(LoreLibrary, {
				open,
				onClose: () => setOpen(false),
				connection
			}));
		}
		function LoreLibrary({ open, onClose, connection }) {
			const [query, setQuery] = (0, react.useState)("");
			const [items, setItems] = (0, react.useState)([]);
			const [selected, setSelected] = (0, react.useState)(null);
			const [detail, setDetail] = (0, react.useState)(null);
			const [status, setStatus] = (0, react.useState)("idle");
			const [error, setError] = (0, react.useState)(null);
			const [refresh, setRefresh] = (0, react.useState)(0);
			const [detailDirty, setDetailDirty] = (0, react.useState)(false);
			const [importing, setImporting] = (0, react.useState)(false);
			useModalScrollLock(open);
			(0, react.useEffect)(() => {
				if (!open) {
					setSelected(null);
					setDetail(null);
					setError(null);
					setDetailDirty(false);
				}
			}, [open]);
			(0, react.useEffect)(() => {
				if (!open) return;
				const timer = setTimeout(() => {
					setStatus("loading");
					setError(null);
					rpc(connection, "list", {
						query,
						limit: 100
					}).then((page) => {
						setItems(page.items);
						setSelected((current) => current === null || page.items.some((item) => item.id === current) ? current : null);
						setStatus("ready");
					}).catch((reason) => {
						setError(reason);
						setStatus("error");
					});
				}, 160);
				return () => clearTimeout(timer);
			}, [
				connection,
				open,
				query,
				refresh
			]);
			(0, react.useEffect)(() => {
				if (!open || selected === null) {
					setDetail(null);
					return;
				}
				let live = true;
				setDetail(null);
				rpc(connection, "get", { id: selected }).then((value) => {
					if (live) setDetail(value);
				}).catch((reason) => {
					if (live) setError(reason);
				});
				return () => {
					live = false;
				};
			}, [
				connection,
				open,
				selected
			]);
			const importFiles = async (files) => {
				if (importing || files.length === 0) return;
				setImporting(true);
				setError(null);
				let lastImportedId = null;
				try {
					for (const file of files) {
						if (file.size > 2 * 1024 * 1024) throw Object.assign(/* @__PURE__ */ new Error("文件超过 2 MiB"), { code: "LIMIT_EXCEEDED" });
						lastImportedId = (await rpc(connection, "import", {
							name: file.name,
							mimeType: "application/json",
							base64: bytesToBase64(new Uint8Array(await file.arrayBuffer()))
						})).imported.id;
						setRefresh((value) => value + 1);
					}
				} catch (reason) {
					setError(reason);
				} finally {
					setImporting(false);
					if (lastImportedId !== null) setSelected(lastImportedId);
				}
			};
			const guardedClose = () => {
				if (!detailDirty || window.confirm("修改还没有保存，要放弃这些修改吗？")) onClose();
			};
			const back = () => {
				if (detailDirty && !window.confirm("修改还没有保存，要放弃并返回列表吗？")) return;
				setDetailDirty(false);
				setSelected(null);
				setDetail(null);
				setError(null);
			};
			return h(_deepseek_ai_dsh_client_ui_primitives.Modal, {
				open,
				onClose: guardedClose,
				title: "世界书",
				closeLabel: "关闭世界书",
				className: css.dialog,
				contentClassName: css.content
			}, h("div", {
				className: css.shell,
				"aria-busy": importing
			}, selected === null ? h("div", { className: css.toolbar }, h("label", { className: css.search }, h(_deepseek_ai_dsh_client_ui_primitives.IconSearchOutline16, { size: 15 }), h("span", { className: css.srOnly }, "搜索世界书"), h("input", {
				value: query,
				onChange: (event) => setQuery(event.target.value),
				placeholder: "搜索世界书"
			})), h("label", {
				className: css.importButton,
				"aria-disabled": importing,
				"aria-busy": importing
			}, h("span", {
				className: css.importContent,
				"aria-hidden": true
			}, importing ? h(LoadingSpinner, { size: 13 }) : null, importing ? "导入中…" : "导入 JSON"), h("span", {
				className: css.srOnly,
				role: "status",
				"aria-live": "polite"
			}, importing ? "正在导入世界书，请稍候。" : ""), h("input", {
				className: css.fileInput,
				type: "file",
				multiple: true,
				disabled: importing,
				accept: ".json,application/json",
				"aria-label": "导入世界书 JSON",
				onChange: (event) => {
					const files = [...event.target.files ?? []];
					event.target.value = "";
					importFiles(files);
				}
			}))) : h(DetailNavigation, {
				label: "返回世界书列表",
				onBack: back
			}), error ? h("div", {
				className: css.error,
				role: "alert"
			}, loreBookErrorMessage(error)) : null, h("div", { className: css.view }, h(ContentTransition, {
				viewKey: selected ?? "list",
				className: css.viewTransition
			}, selected === null ? h(LoreList, {
				items,
				status,
				onSelect: setSelected
			}) : h(LoreDetail, {
				detail,
				connection,
				onDirtyChange: setDetailDirty,
				onChanged: (value) => {
					setDetail(value);
					setRefresh((current) => current + 1);
				},
				onDeleted: () => {
					setSelected(null);
					setDetail(null);
					setRefresh((current) => current + 1);
				}
			})))));
		}
		function LoreSessionEditor({ mode, id, connection, disabled, onCancel, onSaved }) {
			const [detail, setDetail] = (0, react.useState)(() => mode === "create" ? emptyLoreDetail() : null);
			const [error, setError] = (0, react.useState)(null);
			(0, react.useEffect)(() => {
				if (mode !== "edit") return;
				let live = true;
				setDetail(null);
				setError(null);
				rpc(connection, "get", { id }).then((value) => {
					if (live) setDetail(value);
				}).catch((reason) => {
					if (live) setError(reason);
				});
				return () => {
					live = false;
				};
			}, [
				connection,
				id,
				mode
			]);
			if (detail === null) return h(State, { text: error === null ? "正在加载世界书…" : loreBookErrorMessage(error) });
			return h(LoreDetail, {
				key: `${mode}:${detail.id ?? "new"}`,
				detail,
				mode,
				connection,
				disabled,
				allowDelete: false,
				onCancel,
				onChanged: onSaved
			});
		}
		function DetailNavigation({ label, onBack }) {
			return h("div", { className: css.detailNavigation }, h("button", {
				type: "button",
				className: css.backButton,
				onClick: onBack
			}, h(_deepseek_ai_dsh_client_ui_primitives.IconChevronLeftOutline14, { size: 16 }), h("span", null, label)));
		}
		function LoreList({ items, status, onSelect }) {
			if (status === "loading" && items.length === 0) return h(State, { text: "正在加载世界书…" });
			if (status === "error" && items.length === 0) return h(State, { text: "暂时无法加载世界书，请稍后重试。" });
			if (items.length === 0) return h(State, { text: "还没有世界书，可从上方导入 JSON。" });
			return h("div", {
				className: css.list,
				role: "navigation",
				"aria-label": "世界书列表"
			}, ...items.map((item) => h("button", {
				key: item.id,
				type: "button",
				disabled: item.status === "corrupt",
				className: css.row,
				onClick: () => onSelect(item.id)
			}, h("span", { className: css.book }, "文"), h("span", { className: css.rowText }, h("strong", null, item.name), h("small", null, item.status === "corrupt" ? "内容无法读取" : slotSummary(item.slots, item.entries))))));
		}
		function LoreDetail({ detail, mode = "edit", connection, disabled = false, allowDelete = true, onCancel, onChanged, onDeleted, onDirtyChange }) {
			const creating = mode === "create";
			const [draft, setDraft] = (0, react.useState)(null);
			const [selectedEntry, setSelectedEntry] = (0, react.useState)(null);
			const [query, setQuery] = (0, react.useState)("");
			const [filter, setFilter] = (0, react.useState)("all");
			const [activeLevel, setActiveLevel] = (0, react.useState)(LEVELS[0].id);
			const [headerMenuOpen, setHeaderMenuOpen] = (0, react.useState)(false);
			const [confirmingDelete, setConfirmingDelete] = (0, react.useState)(false);
			const [saving, setSaving] = (0, react.useState)(false);
			const [actionError, setActionError] = (0, react.useState)(null);
			const [undo, setUndo] = (0, react.useState)(null);
			(0, react.useEffect)(() => {
				if (!detail) return;
				setDraft({
					name: detail.name,
					entries: cloneEntries(detail.entries ?? [])
				});
				setSelectedEntry(null);
				setHeaderMenuOpen(false);
				setConfirmingDelete(false);
				setActionError(null);
				setUndo(null);
				onDirtyChange?.(false);
			}, [detail?.id, detail?.revision]);
			(0, react.useEffect)(() => {
				setActiveLevel(LEVELS[0].id);
			}, [detail?.id]);
			const dirty = detail !== null && draft !== null && JSON.stringify(draft) !== JSON.stringify({
				name: detail.name,
				entries: detail.entries ?? []
			});
			(0, react.useEffect)(() => {
				onDirtyChange?.(dirty);
			}, [dirty, onDirtyChange]);
			const counts = (0, react.useMemo)(() => Object.fromEntries(LEVELS.map((level) => [level.id, draft?.entries.filter((entry) => entry.level === level.id).length ?? 0])), [draft]);
			if (detail === null || draft === null) return h(State, { text: "正在加载详情…" });
			const current = draft.entries.find((entry) => entry.id === selectedEntry) ?? null;
			const setEntry = (patch) => {
				setDraft((book) => ({
					...book,
					entries: book.entries.map((entry) => entry.id === selectedEntry ? {
						...entry,
						...patch
					} : entry)
				}));
				if (patch.level && LEVELS.some((level) => level.id === patch.level)) setActiveLevel(patch.level);
			};
			const addEntry = (level) => {
				const entry = newLoreEntry(level, draft.entries);
				setDraft((book) => ({
					...book,
					entries: [...book.entries, entry]
				}));
				setSelectedEntry(entry.id);
				setUndo(null);
			};
			const duplicateEntry = (entry) => {
				const copy = {
					...cloneEntry(entry),
					id: crypto.randomUUID(),
					name: `${entry.name} 副本`,
					order: entry.order + 1
				};
				setDraft((book) => ({
					...book,
					entries: insertAfter(book.entries, entry.id, copy)
				}));
				setSelectedEntry(copy.id);
				setUndo(null);
			};
			const deleteEntry = (entry) => {
				const index = draft.entries.findIndex((item) => item.id === entry.id);
				setUndo({
					entry,
					index
				});
				setDraft((book) => ({
					...book,
					entries: book.entries.filter((item) => item.id !== entry.id)
				}));
				setSelectedEntry(null);
			};
			const restore = () => {
				if (undo) {
					setDraft((book) => ({
						...book,
						entries: insertAt(book.entries, undo.index, undo.entry)
					}));
					setUndo(null);
				}
			};
			const reorderLevel = (level, entries) => setDraft((book) => {
				const visible = new Set(entries.map((entry) => entry.id));
				const orders = book.entries.filter((entry) => entry.level === level && visible.has(entry.id)).map((entry) => entry.order);
				const queue = entries.map((entry, index) => ({
					...entry,
					order: orders[index] ?? index
				}));
				return {
					...book,
					entries: book.entries.map((entry) => entry.level === level && visible.has(entry.id) ? queue.shift() : entry)
				};
			});
			const save = async () => {
				if (disabled || !draft.name.trim() || draft.entries.some((entry) => !entry.content.trim())) {
					setActionError({ code: "INVALID_REQUEST" });
					return;
				}
				setSaving(true);
				setActionError(null);
				try {
					await onChanged(await rpc(connection, creating ? "create" : "update", creating ? { book: draft } : {
						id: detail.id,
						expectedRevision: detail.revision,
						patch: draft
					}));
					onDirtyChange?.(false);
				} catch (reason) {
					setActionError(reason);
				} finally {
					setSaving(false);
				}
			};
			const remove = async () => {
				setSaving(true);
				setActionError(null);
				try {
					await rpc(connection, "delete", { id: detail.id });
					onDeleted();
				} catch (reason) {
					setActionError(reason);
				} finally {
					setSaving(false);
				}
			};
			const activeLevelDefinition = LEVELS.find((level) => level.id === activeLevel) ?? LEVELS[0];
			const visibleEntries = draft.entries.filter((entry) => entry.level === activeLevel).filter((entry) => entryMatches(entry, query, filter));
			return h("article", { className: css.detail }, h("header", null, h("div", { className: css.bookIdentity }, h("input", {
				value: draft.name,
				"aria-label": "世界书名称",
				onChange: (event) => setDraft((book) => ({
					...book,
					name: event.target.value
				}))
			}), h("p", null, `${draft.entries.length} 条内容`)), h("div", { className: css.headerActions }, onCancel ? h("button", {
				type: "button",
				disabled: saving,
				onClick: onCancel
			}, "取消") : null, allowDelete ? h(_deepseek_ai_dsh_client_ui_primitives.Menu, {
				open: headerMenuOpen,
				items: [{
					id: "delete",
					label: "删除世界书",
					danger: true
				}],
				align: "end",
				portal: true,
				compact: true,
				onClose: () => setHeaderMenuOpen(false),
				onSelect: (action) => {
					setHeaderMenuOpen(false);
					if (action === "delete") setConfirmingDelete(true);
				},
				anchor: h("button", {
					type: "button",
					className: css.headerMore,
					"aria-label": "更多世界书操作",
					"aria-expanded": headerMenuOpen,
					onClick: () => setHeaderMenuOpen((value) => !value)
				}, h(_deepseek_ai_dsh_client_ui_primitives.IconEllipsisOutline16, { size: 18 }))
			}) : null)), actionError ? h("div", {
				className: css.error,
				role: "alert"
			}, loreBookErrorMessage(actionError)) : null, undo ? h("div", {
				className: css.undoNotice,
				role: "status"
			}, h("span", null, `已删除「${undo.entry.name}」，保存后生效`), h("button", {
				type: "button",
				onClick: restore
			}, "撤销")) : null, h("div", { className: css.entryToolbar }, h("label", { className: css.search }, h(_deepseek_ai_dsh_client_ui_primitives.IconSearchOutline16, { size: 16 }), h("span", { className: css.srOnly }, "搜索当前分类内容"), h("input", {
				value: query,
				onChange: (event) => setQuery(event.target.value),
				placeholder: "搜索名称、关键词或正文"
			})), h("select", {
				value: filter,
				"aria-label": "筛选内容状态",
				onChange: (event) => setFilter(event.target.value)
			}, h("option", { value: "all" }, "全部状态"), h("option", { value: "enabled" }, "已启用"), h("option", { value: "disabled" }, "已停用")), h("button", {
				type: "button",
				className: css.addEntryButton,
				"aria-label": `在${activeLevelDefinition.label}中添加内容`,
				onClick: () => addEntry(activeLevel)
			}, h(_deepseek_ai_dsh_client_ui_primitives.IconPlusOutline16, { size: 15 }), "添加内容")), h("div", {
				className: css.levelTabs,
				role: "tablist",
				"aria-label": "世界书内容类型"
			}, ...LEVELS.map((level) => h("button", {
				key: level.id,
				id: `lore-tab-${level.id}`,
				type: "button",
				role: "tab",
				"aria-selected": activeLevel === level.id,
				"aria-controls": `lore-panel-${level.id}`,
				onClick: () => {
					setActiveLevel(level.id);
					setSelectedEntry(null);
				}
			}, h("span", null, level.label), h("small", null, counts[level.id])))), h("section", {
				key: activeLevel,
				id: `lore-panel-${activeLevel}`,
				className: css.levelPanel,
				role: "tabpanel",
				"aria-labelledby": `lore-tab-${activeLevel}`
			}, visibleEntries.length === 0 ? h("div", { className: css.slotEmpty }, h("strong", null, counts[activeLevel] === 0 ? `${activeLevelDefinition.label}还没有内容` : "没有符合当前筛选条件的内容"), h("span", null, counts[activeLevel] === 0 ? "可以从上方添加第一条内容。" : "请尝试更换关键词或状态筛选。")) : h(ReorderGroup, {
				axis: "y",
				values: visibleEntries,
				onReorder: (rows) => reorderLevel(activeLevel, rows),
				className: css.entryList
			}, h(AnimatePresence, { initial: false }, ...visibleEntries.map((entry) => h(EntryRow, {
				key: entry.id,
				entry,
				onEdit: () => setSelectedEntry(entry.id),
				onMove: (direction) => moveEntryInLevel(setDraft, entry, direction),
				onToggle: () => setEntryById(setDraft, entry.id, { enabled: entry.enabled === false }),
				onDuplicate: () => duplicateEntry(entry),
				onDelete: () => deleteEntry(entry)
			}))))), h(Inspector, {
				open: current !== null,
				title: current?.name ?? "编辑内容",
				description: current ? `${LEVELS.find((level) => level.id === current.level)?.label ?? current.level} · ${current.constant ? "始终使用" : "按关键词使用"}` : void 0,
				onClose: () => setSelectedEntry(null)
			}, current ? h(EntryInspector, {
				entry: current,
				onChange: setEntry
			}) : null), h(DeleteLoreBookDialog, {
				open: confirmingDelete,
				detail,
				saving,
				onCancel: () => setConfirmingDelete(false),
				onConfirm: () => void remove()
			}), h(DirtyBar, {
				dirty,
				error: actionError ? loreBookErrorMessage(actionError) : null,
				saving,
				disabled,
				message: creating ? "新世界书尚未创建" : "世界书修改尚未保存",
				onDiscard: () => {
					setDraft({
						name: detail.name,
						entries: cloneEntries(detail.entries ?? [])
					});
					setUndo(null);
					setActionError(null);
				},
				onSave: () => void save(),
				saveLabel: creating ? "创建并使用" : "保存世界书"
			}));
		}
		function EntryRow({ entry, onEdit, onMove, onToggle, onDuplicate, onDelete }) {
			const [menuOpen, setMenuOpen] = (0, react.useState)(false);
			const dragControls = useDragControls();
			const actions = [
				{
					id: "move-up",
					label: "上移"
				},
				{
					id: "move-down",
					label: "下移"
				},
				{
					id: "toggle",
					label: entry.enabled === false ? "启用内容" : "停用内容"
				},
				{
					id: "duplicate",
					label: "复制内容"
				},
				{
					id: "delete",
					label: "删除内容",
					danger: true
				}
			];
			const selectAction = (action) => {
				setMenuOpen(false);
				if (action === "move-up") onMove(-1);
				else if (action === "move-down") onMove(1);
				else if (action === "toggle") onToggle();
				else if (action === "duplicate") onDuplicate();
				else if (action === "delete") onDelete();
			};
			return h(ReorderItem, {
				value: entry,
				layout: true,
				className: css.entryRow,
				dragListener: false,
				dragControls
			}, h("button", {
				type: "button",
				className: css.dragHandle,
				"aria-label": `拖动排序 ${entry.name}`,
				onPointerDown: (event) => dragControls.start(event)
			}, h("span", { "aria-hidden": true })), h("button", {
				type: "button",
				className: css.entryMain,
				onClick: onEdit
			}, h("span", { className: css.entryCopy }, h("strong", null, entry.name), h("small", null, entrySummary(entry))), h("span", {
				className: css.entryStatus,
				"data-enabled": entry.enabled !== false
			}, h("i", { "aria-hidden": true }), entryStatus(entry))), h("button", {
				type: "button",
				className: css.editEntryButton,
				onClick: onEdit
			}, h(_deepseek_ai_dsh_client_ui_primitives.IconEditOutline16, { size: 15 }), h("span", null, "编辑")), h(_deepseek_ai_dsh_client_ui_primitives.Menu, {
				open: menuOpen,
				items: actions,
				align: "end",
				portal: true,
				compact: true,
				onClose: () => setMenuOpen(false),
				onSelect: selectAction,
				anchor: h("button", {
					type: "button",
					className: css.moreAction,
					"aria-label": `${entry.name}的更多操作`,
					"aria-expanded": menuOpen,
					onClick: () => setMenuOpen((value) => !value)
				}, h(_deepseek_ai_dsh_client_ui_primitives.IconEllipsisOutline16, { size: 18 }))
			}));
		}
		function DeleteLoreBookDialog({ open, detail, saving, onCancel, onConfirm }) {
			return h(_deepseek_ai_dsh_client_ui_primitives.Modal, {
				open,
				onClose: onCancel,
				closeLabel: "关闭删除世界书确认",
				title: `删除“${detail.name}”？`,
				description: "删除后，这本世界书会从资料库中移除。",
				className: css.deleteDialog,
				footer: h(react.default.Fragment, null, h("button", {
					type: "button",
					className: css.secondaryButton,
					autoFocus: true,
					disabled: saving,
					onClick: onCancel
				}, "取消"), h("button", {
					type: "button",
					className: css.deleteConfirmAction,
					disabled: saving,
					onClick: onConfirm
				}, saving ? "正在删除…" : "删除世界书"))
			}, h("div", { className: css.deleteSummary }, h("strong", null, "删除后无法恢复"), h("span", null, detail.source?.characterName ? `它来自角色卡「${detail.source.characterName}」；删除世界书不会修改该角色卡。` : "已有对话中的历史消息不会改变。")));
		}
		function emptyLoreDetail() {
			return {
				id: null,
				revision: 0,
				name: "",
				entries: [],
				slots: {},
				source: { kind: "created" }
			};
		}
		function EntryInspector({ entry, onChange }) {
			const textList = (value) => value.join("，");
			const parseList = (value) => value.split(/[,，\n]/).map((item) => item.trim()).filter(Boolean);
			return h("form", {
				className: css.inspectorForm,
				onSubmit: (event) => event.preventDefault()
			}, h(Field, { label: "名称" }, h("input", {
				value: entry.name,
				onChange: (event) => onChange({ name: event.target.value })
			})), h(Field, { label: "正文" }, h("textarea", {
				rows: 12,
				value: entry.content,
				onChange: (event) => onChange({ content: event.target.value })
			})), h(Field, { label: "内容分类" }, h("select", {
				value: entry.level,
				onChange: (event) => onChange({ level: event.target.value })
			}, ...LEVELS.map((level) => h("option", {
				key: level.id,
				value: level.id
			}, level.label)))), h(Field, { label: "触发关键词" }, h("textarea", {
				rows: 2,
				value: textList(entry.keys ?? []),
				onChange: (event) => onChange({ keys: parseList(event.target.value) })
			})), h(Field, { label: "补充关键词" }, h("textarea", {
				rows: 2,
				value: textList(entry.secondaryKeys ?? []),
				onChange: (event) => onChange({ secondaryKeys: parseList(event.target.value) })
			})), h(Field, {
				label: "变量启用条件",
				hint: "可留空。示例：state(\"story\", \"/characters/李钰/好感度\") > 50"
			}, h("textarea", {
				rows: 2,
				value: entry.stateCondition ?? "",
				placeholder: "仅在当前故事状态满足条件时使用这条设定",
				onChange: (event) => onChange({ stateCondition: event.target.value.trim().length === 0 ? void 0 : event.target.value })
			})), h("div", { className: css.toggleGrid }, ...[
				["enabled", "启用"],
				["constant", "始终使用"],
				["caseSensitive", "区分大小写"],
				["recursive", "继续匹配其他内容"]
			].map(([key, label]) => h("label", { key }, h("input", {
				type: "checkbox",
				checked: entry[key] === true,
				onChange: (event) => onChange({ [key]: event.target.checked })
			}), label))), h(Field, { label: "使用概率（1 表示每次使用）" }, h("input", {
				type: "number",
				min: 0,
				max: 1,
				step: .01,
				value: entry.probability,
				onChange: (event) => onChange({ probability: Number(event.target.value) })
			})), h("details", { className: css.advanced }, h("summary", null, "高级设置"), h(Field, { label: "放置位置" }, h("input", {
				value: entry.insertionPosition ?? "",
				onChange: (event) => onChange({ insertionPosition: event.target.value })
			})), h(Field, { label: "参考层级" }, h("input", {
				type: "number",
				value: entry.depth,
				onChange: (event) => onChange({ depth: Number(event.target.value) })
			})), h(Field, { label: "内部标识（可选）" }, h("input", {
				value: entry.semanticKey ?? "",
				onChange: (event) => onChange({ semanticKey: event.target.value || void 0 })
			})), h(Field, { label: "顺序" }, h("input", {
				type: "number",
				value: entry.order,
				onChange: (event) => onChange({ order: Number(event.target.value) })
			}))));
		}
		function Field({ label, hint, children }) {
			return h("label", { className: css.field }, h("span", null, label), children, hint ? h("small", null, hint) : null);
		}
		function cloneEntry(entry) {
			return JSON.parse(JSON.stringify(entry));
		}
		function cloneEntries(entries) {
			return entries.map(cloneEntry);
		}
		function newLoreEntry(level, entries) {
			const order = entries.filter((entry) => entry.level === level).reduce((maximum, entry) => Math.max(maximum, Number(entry.order) || 0), -1) + 1;
			return {
				id: crypto.randomUUID(),
				name: "新条目",
				semanticKey: void 0,
				level,
				keys: [],
				secondaryKeys: [],
				stateCondition: void 0,
				content: "",
				enabled: true,
				constant: false,
				caseSensitive: false,
				recursive: true,
				order,
				position: 1,
				insertionPosition: "after_char",
				depth: 4,
				probability: 1
			};
		}
		function insertAfter(entries, id, value) {
			const index = entries.findIndex((entry) => entry.id === id);
			return insertAt(entries, index < 0 ? entries.length : index + 1, value);
		}
		function insertAt(entries, index, value) {
			return [
				...entries.slice(0, index),
				value,
				...entries.slice(index)
			];
		}
		function setEntryById(setDraft, id, patch) {
			setDraft((book) => ({
				...book,
				entries: book.entries.map((entry) => entry.id === id ? {
					...entry,
					...patch
				} : entry)
			}));
		}
		function moveEntryInLevel(setDraft, entry, direction) {
			setDraft((book) => {
				const group = book.entries.filter((item) => item.level === entry.level);
				const index = group.findIndex((item) => item.id === entry.id);
				const target = index + direction;
				if (index < 0 || target < 0 || target >= group.length) return book;
				const reordered = [...group];
				const [moved] = reordered.splice(index, 1);
				reordered.splice(target, 0, moved);
				const queue = reordered.map((item, order) => ({
					...item,
					order
				}));
				return {
					...book,
					entries: book.entries.map((item) => item.level === entry.level ? queue.shift() : item)
				};
			});
		}
		function entryMatches(entry, query, filter) {
			if (filter === "enabled" && entry.enabled === false) return false;
			if (filter === "disabled" && entry.enabled !== false) return false;
			const needle = query.trim().toLocaleLowerCase();
			if (!needle) return true;
			return [
				entry.name,
				entry.content,
				...entry.keys ?? [],
				...entry.secondaryKeys ?? []
			].some((value) => String(value).toLocaleLowerCase().includes(needle));
		}
		function entrySummary(entry) {
			if (entry.keys?.length) return `关键词：${entry.keys.slice(0, 3).join("、")}`;
			if (entry.secondaryKeys?.length) return `补充关键词：${entry.secondaryKeys.slice(0, 3).join("、")}`;
			return entry.constant ? "无需关键词，每次都会使用" : "还没有设置触发关键词";
		}
		function entryStatus(entry) {
			if (entry.enabled === false) return "已停用";
			if (entry.constant) return "始终使用";
			return entry.keys?.length ? "关键词触发" : "待设置";
		}
		function loreBookErrorMessage(reason) {
			const code = reason?.code;
			if (code === "INVALID_JSON" || code === "INVALID_REQUEST") return "世界书内容格式不正确，请检查括号、引号和逗号。";
			if (code === "DUPLICATE_ASSET") return "这本世界书已经导入过了。";
			if (code === "UNSUPPORTED_FORMAT") return "请选择 JSON 格式的世界书文件。";
			if (code === "ASSET_CORRUPT") return "这本世界书的内容无法读取，请重新导入。";
			if (code === "ASSET_NOT_FOUND") return "这本世界书已不存在，请返回列表后刷新。";
			if (code === "REVISION_CONFLICT") return "这本世界书刚刚发生了变化，请刷新后再试。";
			if (code === "LIMIT_EXCEEDED") return "文件太大，请选择不超过 2 MiB 的文件。";
			return "暂时无法更新世界书，请稍后再试。";
		}
		function State({ text }) {
			return h("div", { className: css.state }, text);
		}
		function useModalScrollLock(open) {
			(0, react.useEffect)(() => {
				if (!open) return;
				let state = globalThis[MODAL_SCROLL_LOCK];
				if (state === void 0) {
					const root = document.documentElement;
					const body = document.body;
					state = {
						count: 0,
						root,
						body,
						rootOverflow: root.style.overflow,
						bodyOverflow: body.style.overflow,
						bodyOverscroll: body.style.overscrollBehavior
					};
					globalThis[MODAL_SCROLL_LOCK] = state;
					root.style.overflow = "hidden";
					body.style.overflow = "hidden";
					body.style.overscrollBehavior = "none";
				}
				state.count += 1;
				return () => {
					state.count -= 1;
					if (state.count !== 0) return;
					state.root.style.overflow = state.rootOverflow;
					state.body.style.overflow = state.bodyOverflow;
					state.body.style.overscrollBehavior = state.bodyOverscroll;
					delete globalThis[MODAL_SCROLL_LOCK];
				};
			}, [open]);
		}
		function slotSummary(slots, total) {
			if (!slots) return `${total} 个条目`;
			return LEVELS.map((level) => `${level.short} ${slots[level.id] ?? 0}`).join(" · ");
		}
		async function rpc(connection, endpoint, payload) {
			return domainValue(await connection.call("/rp-lore-books", endpoint, payload));
		}
		function bytesToBase64(bytes) {
			let binary = "";
			for (let offset = 0; offset < bytes.length; offset += 32768) binary += String.fromCharCode(...bytes.subarray(offset, offset + 32768));
			return btoa(binary);
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
