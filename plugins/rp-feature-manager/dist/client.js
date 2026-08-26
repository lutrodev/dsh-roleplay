window.__ModuleLoader__.load({
	id: "dsh-roleplay-rp-feature-manager",
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
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/projection/utils/measure.mjs
		function measureViewportBox(instance, transformPoint) {
			return convertBoundingBoxToBox(transformBoxPoints(instance.getBoundingClientRect(), transformPoint));
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
		//#region ../../node_modules/.pnpm/motion-dom@12.43.0/node_modules/motion-dom/dist/es/events/add-dom-event.mjs
		function addDomEvent(target, eventName, handler, options = { passive: true }) {
			target.addEventListener(eventName, handler, options);
			return () => target.removeEventListener(eventName, handler, options);
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
		//#region ../../node_modules/.pnpm/framer-motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/framer-motion/dist/es/render/dom/features-animation.mjs
		/**
		* @public
		*/
		const domAnimation = {
			renderer: createDomVisualElement,
			...animations,
			...gestureAnimations
		};
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
		//#region ../../node_modules/.pnpm/motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/motion/dist/es/react.mjs
		const m = m$1;
		//#endregion
		//#region src/catalog.js
		const SETTINGS_NAMESPACE = "roleplay-features";
		Object.freeze([
			Object.freeze({
				packageName: "dsh-roleplay-rp-feature-manager",
				label: "功能管理"
			}),
			Object.freeze({
				packageName: "dsh-roleplay-rp-standard",
				label: "Roleplay 模式"
			}),
			Object.freeze({
				packageName: "dsh-roleplay-rp-core",
				label: "回复运行时"
			}),
			Object.freeze({
				packageName: "dsh-roleplay-rp-session",
				label: "对话配置"
			}),
			Object.freeze({
				packageName: "dsh-roleplay-rp-macro",
				label: "名称宏"
			}),
			Object.freeze({
				packageName: "dsh-roleplay-rp-asset-tools",
				label: "资料工具"
			}),
			Object.freeze({
				packageName: "dsh-roleplay-rp-library",
				label: "故事设置"
			})
		]);
		const FEATURE_CATALOG = Object.freeze([
			feature({
				id: "character-card",
				category: "materials",
				label: "角色卡",
				description: "管理角色设定、开场白和角色卡导入。",
				packageName: "dsh-roleplay-rp-character-card",
				hostEntryIds: ["rp-character-library"],
				runtimeKey: "characterCard",
				recommends: ["lore-book"],
				skillName: "rp-guide-character-card",
				skillLabel: "角色卡指南",
				skillDescription: "在应用、检查或按明确要求修改角色卡时，提供安全边界与操作步骤。"
			}),
			feature({
				id: "lore-book",
				category: "materials",
				label: "世界书",
				description: "按当前对话激活世界设定、人物知识和重要规则。",
				packageName: "dsh-roleplay-rp-lore-book",
				hostEntryIds: ["rp-lore-library"],
				runtimeKey: "loreBook",
				skillName: "rp-guide-lorebook",
				skillLabel: "世界书指南",
				skillDescription: "在使用、检查或按明确要求修改世界书时，维护连续性、激活规则与用户控制权。"
			}),
			feature({
				id: "persona",
				category: "materials",
				label: "我的人设",
				description: "保存用户在故事中的身份，并可作为当前对话的人设。",
				packageName: "dsh-roleplay-rp-persona",
				hostEntryIds: ["rp-persona"],
				runtimeKey: "persona",
				skillName: "rp-guide-persona",
				skillLabel: "我的人设指南",
				skillDescription: "在使用或按明确要求修改“我的人设”时，保持身份内容由用户决定。"
			}),
			feature({
				id: "preset",
				category: "materials",
				label: "创作预设",
				description: "组合任务说明、写作指导和输出要求。",
				packageName: "dsh-roleplay-rp-preset",
				hostEntryIds: ["rp-preset"],
				runtimeKey: "preset",
				skillName: "rp-guide-preset",
				skillLabel: "创作预设指南",
				skillDescription: "在应用、修改或从 SillyTavern 迁移创作预设时，解释栏位作用与叙事优先级。",
				supportingSkillNames: ["rp-guide-preset-sillytavern"]
			}),
			feature({
				id: "writing-style",
				category: "materials",
				label: "文风",
				description: "为当前对话叠加有序的叙事语言与节奏要求。",
				packageName: "dsh-roleplay-rp-writing-style",
				hostEntryIds: ["rp-writing-style"],
				runtimeKey: "writingStyle",
				skillName: "rp-guide-writing-style",
				skillLabel: "文风指南",
				skillDescription: "在应用或按明确要求修改文风时，协调多项文风的顺序、语言与节奏。"
			}),
			feature({
				id: "state",
				category: "creation",
				label: "会话变量",
				description: "在当前对话中维护可回放的数值、关系和故事状态。",
				packageName: "dsh-roleplay-rp-state",
				runtimeKey: "state",
				skillName: "rp-guide-state",
				skillLabel: "会话变量指南",
				skillDescription: "在用户明确要求变量工作时，设计、检查、配置或诊断会话变量。"
			}),
			feature({
				id: "compat-mvu",
				category: "creation",
				label: "MVU 兼容",
				description: "转换受支持的社区 MVU 变量与条件规则安全子集。",
				packageName: "dsh-roleplay-rp-compat-mvu",
				hostEntryIds: ["rp-mvu-import"],
				runtimeKey: "compatMvu",
				requires: [
					"character-card",
					"lore-book",
					"state"
				]
			}),
			feature({
				id: "subagent-manager",
				category: "creation",
				label: "子代理",
				description: "配置固定 Writer，以及按各自调用契约运行的可插拔独立任务子代理。",
				packageName: "dsh-roleplay-rp-subagent-manager",
				hostEntryIds: ["rp-subagent-manager"],
				runtimeKey: "subagentManager"
			}),
			feature({
				id: "message-actions",
				category: "conversation",
				label: "消息操作",
				description: "提供编辑、删除、重新生成和失败恢复等消息能力。",
				packageName: "dsh-roleplay-rp-message-actions",
				hostEntryIds: ["rp-message-actions"]
			}),
			feature({
				id: "message-avatar",
				category: "conversation",
				label: "消息头像",
				description: "在用户、开场和最终回复旁显示相应角色头像。",
				packageName: "dsh-roleplay-rp-message-avatar",
				hostEntryIds: ["rp-message-avatar"],
				recommends: ["character-card", "persona"]
			}),
			feature({
				id: "dialogue-highlight",
				category: "conversation",
				label: "对白高亮",
				description: "在助手正文中突出显示成对引号内的对白。",
				packageName: "dsh-roleplay-rp-dialogue-highlight",
				hostEntryIds: ["rp-dialogue-highlight"]
			})
		]);
		const DEFAULT_ENABLED_FEATURES = Object.freeze(FEATURE_CATALOG.map((item) => item.id));
		/** Roleplay-owned Skills that can be selected independently from their plugin. */
		const ROLEPLAY_SKILL_CATALOG = Object.freeze(FEATURE_CATALOG.flatMap((item) => item.skillName === void 0 ? [] : [Object.freeze({
			id: item.skillName,
			label: item.skillLabel,
			description: item.skillDescription,
			featureId: item.id,
			featureLabel: item.label,
			packageName: item.packageName,
			skillName: item.skillName
		})]));
		const SKILL_IDS = Object.freeze(ROLEPLAY_SKILL_CATALOG.map((item) => item.id));
		const byId = new Map(FEATURE_CATALOG.map((item) => [item.id, item]));
		new Map(ROLEPLAY_SKILL_CATALOG.map((item) => [item.id, item]));
		/** Resolve one known feature definition. */
		function featureById(id) {
			return byId.get(id);
		}
		function feature(input) {
			return Object.freeze({
				...input,
				requires: Object.freeze([...input.requires ?? []]),
				recommends: Object.freeze([...input.recommends ?? []]),
				hostEntryIds: Object.freeze([...input.hostEntryIds ?? []]),
				supportingSkillNames: Object.freeze([...input.supportingSkillNames ?? []])
			});
		}
		//#endregion
		//#region src/selection.js
		const KNOWN_IDS = new Set(DEFAULT_ENABLED_FEATURES);
		const KNOWN_SKILL_IDS = new Set(SKILL_IDS);
		/** Normalize, close over hard prerequisites, and return catalog order. */
		function normalizeFeatureSelection(value) {
			if (!Array.isArray(value)) throw new TypeError("enabledFeatures must be an array");
			const enabled = /* @__PURE__ */ new Set();
			for (const id of value) {
				if (typeof id !== "string" || !KNOWN_IDS.has(id)) throw new TypeError(`enabledFeatures contains an unknown feature: ${String(id)}`);
				enabled.add(id);
			}
			let changed = true;
			while (changed) {
				changed = false;
				for (const id of [...enabled]) for (const required of featureById(id).requires) {
					if (enabled.has(required)) continue;
					enabled.add(required);
					changed = true;
				}
			}
			return FEATURE_CATALOG.filter((item) => enabled.has(item.id)).map((item) => item.id);
		}
		/** Plan one reversible UI toggle, enabling prerequisites or disabling dependants. */
		function toggleFeature(current, id, enabled) {
			if (!KNOWN_IDS.has(id)) throw new TypeError(`unknown Roleplay feature: ${String(id)}`);
			const selected = new Set(normalizeFeatureSelection(current));
			if (enabled) {
				selected.add(id);
				return normalizeFeatureSelection([...selected]);
			}
			selected.delete(id);
			let changed = true;
			while (changed) {
				changed = false;
				for (const feature of FEATURE_CATALOG) {
					if (!selected.has(feature.id)) continue;
					if (feature.requires.some((required) => !selected.has(required))) {
						selected.delete(feature.id);
						changed = true;
					}
				}
			}
			return FEATURE_CATALOG.filter((item) => selected.has(item.id)).map((item) => item.id);
		}
		/** Features changed indirectly by a requested toggle. */
		function toggleSideEffects(current, id, enabled) {
			const before = new Set(normalizeFeatureSelection(current));
			const next = toggleFeature(current, id, enabled);
			return next.filter((item) => item !== id && !before.has(item)).concat([...before].filter((item) => item !== id && !next.includes(item)));
		}
		/** Validate and return a Roleplay Skill selection in catalog order. */
		function normalizeSkillSelection(value) {
			if (!Array.isArray(value)) throw new TypeError("enabledSkills must be an array");
			const enabled = /* @__PURE__ */ new Set();
			for (const id of value) {
				if (typeof id !== "string" || !KNOWN_SKILL_IDS.has(id)) throw new TypeError(`enabledSkills contains an unknown Skill: ${String(id)}`);
				enabled.add(id);
			}
			return ROLEPLAY_SKILL_CATALOG.filter((item) => enabled.has(item.id)).map((item) => item.id);
		}
		/** Plan one independent Roleplay Skill selection change. */
		function toggleSkill(current, id, enabled) {
			if (!KNOWN_SKILL_IDS.has(id)) throw new TypeError(`unknown Roleplay Skill: ${String(id)}`);
			const selected = new Set(normalizeSkillSelection(current));
			if (enabled) selected.add(id);
			else selected.delete(id);
			return ROLEPLAY_SKILL_CATALOG.filter((item) => selected.has(item.id)).map((item) => item.id);
		}
		//#endregion
		//#region src/client-state.js
		const CATEGORY_ORDER = Object.freeze([
			"materials",
			"creation",
			"conversation"
		]);
		function groupedFeatures() {
			return CATEGORY_ORDER.map((category) => ({
				category,
				features: FEATURE_CATALOG.filter((item) => item.category === category)
			}));
		}
		function planFeatureToggle(current, id, enabled) {
			return {
				enabledFeatures: toggleFeature(current, id, enabled),
				sideEffects: toggleSideEffects(current, id, enabled)
			};
		}
		function dependencyLabels(feature, relation = "requires") {
			return feature[relation].map((id) => featureById(id).label);
		}
		function toggleAnnouncement(feature, enabled, sideEffects) {
			const action = enabled ? "启用" : "停用";
			if (sideEffects.length === 0) return `已${action}${feature.label}。`;
			const related = sideEffects.map((id) => featureById(id).label).join("、");
			return enabled ? `已启用${feature.label}，并同时启用${related}。` : `已停用${feature.label}，并同时停用依赖它的${related}。`;
		}
		function planSkillToggle(current, id, enabled) {
			return toggleSkill(current, id, enabled);
		}
		function skillToggleAnnouncement(skill, enabled) {
			return `已${enabled ? "启用" : "停用"}${skill.label}。`;
		}
		async function featureStatus(connection) {
			return roleplayFeatureRequest(connection, "status", "Roleplay 功能状态读取失败");
		}
		async function promptPreview(connection) {
			return roleplayFeatureRequest(connection, "prompts", "代理提示词预览读取失败");
		}
		async function setRoleplaySetting(connection, field, value, expectedRevision) {
			return roleplayFeatureRequest(connection, "settings/set", "Roleplay 设置保存失败", {
				field,
				value,
				expectedRevision
			});
		}
		async function unsetRoleplaySetting(connection, field, expectedRevision) {
			return roleplayFeatureRequest(connection, "settings/unset", "Roleplay 设置重置失败", {
				field,
				expectedRevision
			});
		}
		async function roleplayFeatureRequest(connection, endpoint, fallbackMessage, payload = {}) {
			const response = await connection.rpc.call("/rp-features", endpoint, payload);
			const domain = response?.ok === true && response.value?.ok !== void 0 ? response.value : response;
			if (domain?.ok !== true) throw Object.assign(new Error(domain?.error?.message ?? fallbackMessage), { code: domain?.error?.code });
			return domain.value;
		}
		//#endregion
		//#region src/client-styles.generated.js
		const css = {
			"applies": "rp-features-applies",
			"core": "rp-features-core",
			"coreCopy": "rp-features-coreCopy",
			"coreIcon": "rp-features-coreIcon",
			"coreTitle": "rp-features-coreTitle",
			"coreVersions": "rp-features-coreVersions",
			"dependencies": "rp-features-dependencies",
			"failure": "rp-features-failure",
			"feature": "rp-features-feature",
			"featureCopy": "rp-features-featureCopy",
			"featureList": "rp-features-featureList",
			"featureTitle": "rp-features-featureTitle",
			"featureVersion": "rp-features-featureVersion",
			"header": "rp-features-header",
			"identityCancel": "rp-features-identityCancel",
			"identityDescription": "rp-features-identityDescription",
			"identityEdit": "rp-features-identityEdit",
			"identityEditor": "rp-features-identityEditor",
			"identityEditorActions": "rp-features-identityEditorActions",
			"identityError": "rp-features-identityError",
			"identityField": "rp-features-identityField",
			"identityHeader": "rp-features-identityHeader",
			"identityMeta": "rp-features-identityMeta",
			"identityPanel": "rp-features-identityPanel",
			"identityPreview": "rp-features-identityPreview",
			"identityReset": "rp-features-identityReset",
			"identitySave": "rp-features-identitySave",
			"identityTitle": "rp-features-identityTitle",
			"liveNotice": "rp-features-liveNotice",
			"page": "rp-features-page",
			"panelIntro": "rp-features-panelIntro",
			"promptDetail": "rp-features-promptDetail",
			"promptEmpty": "rp-features-promptEmpty",
			"promptKind": "rp-features-promptKind",
			"promptLayer": "rp-features-promptLayer",
			"promptLayerBody": "rp-features-promptLayerBody",
			"promptLayerIndex": "rp-features-promptLayerIndex",
			"promptLayerList": "rp-features-promptLayerList",
			"promptLayerTitle": "rp-features-promptLayerTitle",
			"promptNoTools": "rp-features-promptNoTools",
			"promptNotes": "rp-features-promptNotes",
			"promptOrderHeading": "rp-features-promptOrderHeading",
			"promptProfile": "rp-features-promptProfile",
			"promptProfileHeader": "rp-features-promptProfileHeader",
			"promptRole": "rp-features-promptRole",
			"promptRoleButton": "rp-features-promptRoleButton",
			"promptRoleNav": "rp-features-promptRoleNav",
			"promptRoute": "rp-features-promptRoute",
			"promptScope": "rp-features-promptScope",
			"promptScopeIcon": "rp-features-promptScopeIcon",
			"promptSelect": "rp-features-promptSelect",
			"promptToolBlock": "rp-features-promptToolBlock",
			"promptTools": "rp-features-promptTools",
			"promptWorkspace": "rp-features-promptWorkspace",
			"section": "rp-features-section",
			"sectionHeading": "rp-features-sectionHeading",
			"skill": "rp-features-skill",
			"skillCopy": "rp-features-skillCopy",
			"skillList": "rp-features-skillList",
			"skillMark": "rp-features-skillMark",
			"skillMeta": "rp-features-skillMeta",
			"skillScope": "rp-features-skillScope",
			"skillVisibility": "rp-features-skillVisibility",
			"state": "rp-features-state",
			"switch": "rp-features-switch",
			"tabIndicator": "rp-features-tabIndicator",
			"tabPanel": "rp-features-tabPanel",
			"tabs": "rp-features-tabs",
			"versionState": "rp-features-versionState",
			"versionSummary": "rp-features-versionSummary",
			"versionWarning": "rp-features-versionWarning",
			"visibility": "rp-features-visibility",
			"visibilityBody": "rp-features-visibilityBody",
			"visibilityIcon": "rp-features-visibilityIcon"
		};
		const STYLE_ID = "dsh-roleplay-rp-feature-manager-styles";
		const STYLE_OWNER = "dsh-roleplay-rp-feature-manager";
		const STYLE_TEXT = ".rp-features-page {\n  display: flex;\n  flex-direction: column;\n  gap: 18px;\n  width: 100%;\n  max-width: 820px;\n  color: var(--dsw-alias-label-primary);\n}\n\n.rp-features-header {\n  display: flex;\n  align-items: flex-start;\n  justify-content: space-between;\n  gap: 24px;\n}\n\n.rp-features-header h2,\n.rp-features-header p,\n.rp-features-panelIntro h3,\n.rp-features-panelIntro p,\n.rp-features-sectionHeading h3,\n.rp-features-sectionHeading p,\n.rp-features-core h3,\n.rp-features-core p,\n.rp-features-feature p,\n.rp-features-applies,\n.rp-features-failure p {\n  margin: 0;\n}\n\n.rp-features-header h2 {\n  font-size: 18px;\n  line-height: 26px;\n  font-weight: 650;\n}\n\n.rp-features-header p {\n  max-width: 560px;\n  margin-top: 4px;\n  color: var(--dsw-alias-label-secondary);\n  font-size: 13px;\n  line-height: 20px;\n}\n\n.rp-features-tabs {\n  display: flex;\n  gap: 24px;\n  border-bottom: 1px solid var(--dsw-alias-separator-primary);\n}\n\n.rp-features-tabs button {\n  position: relative;\n  min-height: 40px;\n  border: 0;\n  padding: 0 2px;\n  background: transparent;\n  color: var(--dsw-alias-label-tertiary);\n  cursor: pointer;\n  font: 13px/20px var(--dsw-font-family);\n}\n\n.rp-features-tabs button[aria-selected='true'] {\n  color: var(--dsw-alias-label-primary);\n  font-weight: 600;\n}\n\n.rp-features-tabs button:focus-visible {\n  border-radius: 4px;\n  outline: 2px solid var(--dsw-alias-state-business-primary);\n  outline-offset: 2px;\n}\n\n.rp-features-tabIndicator {\n  position: absolute;\n  right: 0;\n  bottom: -1px;\n  left: 0;\n  height: 2px;\n  border-radius: 2px 2px 0 0;\n  background: var(--dsw-alias-label-primary);\n}\n\n.rp-features-tabPanel {\n  display: flex;\n  flex-direction: column;\n  gap: 18px;\n}\n\n.rp-features-panelIntro h3 {\n  font-size: 16px;\n  line-height: 24px;\n  font-weight: 650;\n}\n\n.rp-features-panelIntro p {\n  max-width: 620px;\n  margin-top: 3px;\n  color: var(--dsw-alias-label-secondary);\n  font-size: 12px;\n  line-height: 19px;\n}\n\n.rp-features-versionSummary {\n  display: grid;\n  flex: none;\n  grid-template-columns: auto auto;\n  gap: 2px 12px;\n  border-radius: 8px;\n  padding: 8px 10px;\n  background: var(--dsw-alias-bg-layer-1);\n  color: var(--dsw-alias-label-secondary);\n  font-size: 11px;\n  line-height: 17px;\n  font-variant-numeric: tabular-nums;\n}\n\n.rp-features-versionState {\n  grid-column: 1 / -1;\n  color: var(--dsw-alias-state-success-primary);\n  font-weight: 600;\n}\n\n.rp-features-versionSummary[data-compatible='false'] .rp-features-versionState {\n  color: var(--dsw-alias-state-error-primary);\n}\n\n.rp-features-versionWarning {\n  border-radius: 8px;\n  padding: 10px 12px;\n  background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 9%, transparent);\n  color: var(--dsw-alias-state-error-primary);\n  font-size: 13px;\n  line-height: 20px;\n}\n\n.rp-features-applies {\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 12px;\n  line-height: 18px;\n}\n\n.rp-features-core {\n  display: grid;\n  grid-template-columns: 38px minmax(0, 1fr);\n  gap: 12px;\n  border: 1px solid var(--dsw-alias-border-l2);\n  border-radius: 10px;\n  padding: 14px;\n  background: var(--dsw-alias-bg-layer-3);\n}\n\n.rp-features-coreIcon {\n  display: grid;\n  width: 38px;\n  height: 38px;\n  place-items: center;\n  border-radius: 9px;\n  background: color-mix(in srgb, var(--dsw-alias-state-business-primary) 10%, transparent);\n  color: var(--dsw-alias-state-business-primary);\n}\n\n.rp-features-coreCopy {\n  min-width: 0;\n}\n\n.rp-features-coreTitle {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 12px;\n}\n\n.rp-features-coreTitle h3 {\n  font-size: 14px;\n  line-height: 20px;\n}\n\n.rp-features-coreTitle > span {\n  display: inline-flex;\n  align-items: center;\n  gap: 4px;\n  color: var(--dsw-alias-state-success-primary);\n  font-size: 11px;\n  white-space: nowrap;\n}\n\n.rp-features-core p {\n  margin-top: 3px;\n  color: var(--dsw-alias-label-secondary);\n  font-size: 12px;\n  line-height: 18px;\n}\n\n.rp-features-coreVersions {\n  margin-top: 8px;\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 11px;\n}\n\n.rp-features-coreVersions summary {\n  display: inline-flex;\n  align-items: center;\n  gap: 5px;\n  cursor: pointer;\n}\n\n.rp-features-coreVersions[open] summary svg {\n  transform: rotate(180deg);\n}\n\n.rp-features-coreVersions ul {\n  display: grid;\n  grid-template-columns: repeat(2, minmax(0, 1fr));\n  gap: 4px 16px;\n  margin: 8px 0 0;\n  padding: 0;\n  list-style: none;\n}\n\n.rp-features-coreVersions li {\n  display: flex;\n  justify-content: space-between;\n  gap: 8px;\n}\n\n.rp-features-coreVersions code,\n.rp-features-featureVersion,\n.rp-features-skillMeta code {\n  color: var(--dsw-alias-label-tertiary);\n  font-family: var(--ds-font-family-code);\n}\n\n.rp-features-skillScope {\n  margin: -8px 0 0;\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 11px;\n  line-height: 17px;\n}\n\n.rp-features-visibility {\n  display: grid;\n  grid-template-columns: 38px minmax(0, 1fr);\n  gap: 12px;\n  border: 1px solid var(--dsw-alias-border-l2);\n  border-radius: 10px;\n  padding: 14px;\n  background: var(--dsw-alias-bg-layer-3);\n}\n\n.rp-features-visibilityIcon,\n.rp-features-skillMark {\n  display: grid;\n  place-items: center;\n  background: color-mix(in srgb, var(--dsw-alias-state-business-primary) 10%, transparent);\n  color: var(--dsw-alias-state-business-primary);\n}\n\n.rp-features-visibilityIcon {\n  width: 38px;\n  height: 38px;\n  border-radius: 9px;\n}\n\n.rp-features-visibilityBody h3 {\n  margin: 0;\n  font-size: 13px;\n  line-height: 20px;\n}\n\n.rp-features-visibilityBody dl {\n  display: grid;\n  gap: 4px;\n  margin: 7px 0 0;\n}\n\n.rp-features-visibilityBody dl > div {\n  display: grid;\n  grid-template-columns: 110px minmax(0, 1fr);\n  gap: 8px;\n}\n\n.rp-features-visibilityBody dt,\n.rp-features-visibilityBody dd {\n  margin: 0;\n  font-size: 11px;\n  line-height: 17px;\n}\n\n.rp-features-visibilityBody dt {\n  color: var(--dsw-alias-label-primary);\n  font-weight: 600;\n}\n\n.rp-features-visibilityBody dd {\n  color: var(--dsw-alias-label-secondary);\n}\n\n.rp-features-skillList {\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n\n.rp-features-skill {\n  display: grid;\n  grid-template-columns: 32px minmax(0, 1fr) 38px;\n  align-items: start;\n  gap: 11px;\n  border: 1px solid var(--dsw-alias-border-l2);\n  border-radius: 10px;\n  padding: 12px 13px;\n  background: var(--dsw-alias-bg-layer-3);\n}\n\n.rp-features-skill[data-available='false'] {\n  background: var(--dsw-alias-bg-layer-2);\n}\n\n.rp-features-skillMark {\n  width: 32px;\n  height: 32px;\n  border-radius: 8px;\n}\n\n.rp-features-skill[data-available='false'] .rp-features-skillMark {\n  background: var(--dsw-alias-bg-layer-1);\n  color: var(--dsw-alias-label-tertiary);\n}\n\n.rp-features-skillCopy {\n  min-width: 0;\n}\n\n.rp-features-skillCopy > p {\n  margin: 4px 0 0;\n  color: var(--dsw-alias-label-secondary);\n  font-size: 12px;\n  line-height: 18px;\n}\n\n.rp-features-skillMeta {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 3px 10px;\n  margin-top: 6px;\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 10px;\n  line-height: 15px;\n}\n\n.rp-features-skillVisibility {\n  color: var(--dsw-alias-label-tertiary) !important;\n  font-size: 10px !important;\n  line-height: 16px !important;\n}\n\n.rp-features-section {\n  display: flex;\n  flex-direction: column;\n  gap: 9px;\n}\n\n.rp-features-sectionHeading {\n  padding: 0 2px;\n}\n\n.rp-features-sectionHeading h3 {\n  font-size: 13px;\n  line-height: 20px;\n  font-weight: 650;\n}\n\n.rp-features-sectionHeading p {\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 12px;\n  line-height: 18px;\n}\n\n.rp-features-featureList {\n  display: grid;\n  grid-template-columns: repeat(2, minmax(0, 1fr));\n  gap: 8px;\n  margin: 0;\n  padding: 0;\n  list-style: none;\n}\n\n.rp-features-feature {\n  display: flex;\n  min-width: 0;\n  align-items: flex-start;\n  justify-content: space-between;\n  gap: 14px;\n  border: 1px solid var(--dsw-alias-border-l2);\n  border-radius: 10px;\n  padding: 12px 13px;\n  background: var(--dsw-alias-bg-layer-3);\n}\n\n.rp-features-featureCopy {\n  min-width: 0;\n}\n\n.rp-features-featureTitle {\n  display: flex;\n  align-items: center;\n  gap: 7px;\n}\n\n.rp-features-featureTitle strong {\n  min-width: 0;\n  overflow: hidden;\n  font-size: 13px;\n  line-height: 19px;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.rp-features-featureTitle span {\n  flex: none;\n  border-radius: 5px;\n  padding: 1px 5px;\n  background: var(--dsw-alias-bg-layer-1);\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 10px;\n  line-height: 15px;\n}\n\n.rp-features-featureTitle span[data-enabled='true'] {\n  background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 9%, transparent);\n  color: var(--dsw-alias-state-success-primary);\n}\n\n.rp-features-feature p {\n  margin-top: 4px;\n  color: var(--dsw-alias-label-secondary);\n  font-size: 12px;\n  line-height: 18px;\n}\n\n.rp-features-dependencies {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 2px 9px;\n  margin-top: 5px;\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 10px;\n  line-height: 15px;\n}\n\n.rp-features-featureVersion {\n  display: block;\n  margin-top: 6px;\n  font-size: 10px;\n  line-height: 15px;\n}\n\n.rp-features-switch {\n  position: relative;\n  width: 38px;\n  height: 22px;\n  flex: none;\n  border: 0;\n  border-radius: 999px;\n  padding: 0;\n  background: var(--dsw-alias-border-l1);\n  cursor: pointer;\n}\n\n.rp-features-switch[aria-checked='true'] {\n  background: var(--dsw-alias-state-business-primary);\n}\n\n.rp-features-switch:focus-visible {\n  outline: 2px solid var(--dsw-alias-state-business-primary);\n  outline-offset: 2px;\n}\n\n.rp-features-switch:disabled {\n  cursor: not-allowed;\n  opacity: 0.55;\n}\n\n.rp-features-switch span {\n  position: absolute;\n  top: 2px;\n  left: 0;\n  width: 18px;\n  height: 18px;\n  border-radius: 50%;\n  background: white;\n  box-shadow: 0 1px 2px rgb(0 0 0 / 18%);\n}\n\n.rp-features-promptScope {\n  display: grid;\n  grid-template-columns: 38px minmax(0, 1fr);\n  gap: 12px;\n  border: 1px solid var(--dsw-alias-border-l2);\n  border-radius: 10px;\n  padding: 13px 14px;\n  background: var(--dsw-alias-bg-layer-3);\n}\n\n.rp-features-promptScope p {\n  align-self: center;\n  margin: 0;\n  color: var(--dsw-alias-label-secondary);\n  font-size: 11px;\n  line-height: 18px;\n}\n\n.rp-features-promptScopeIcon {\n  display: grid;\n  width: 38px;\n  height: 38px;\n  place-items: center;\n  border-radius: 9px;\n  background: color-mix(in srgb, var(--dsw-alias-state-business-primary) 10%, transparent);\n  color: var(--dsw-alias-state-business-primary);\n}\n\n.rp-features-identityPanel {\n  display: flex;\n  flex-direction: column;\n  gap: 9px;\n  border: 1px solid color-mix(in srgb, var(--dsw-alias-state-business-primary) 24%, var(--dsw-alias-border-l2));\n  border-radius: 10px;\n  padding: 13px 14px;\n  background: color-mix(in srgb, var(--dsw-alias-state-business-primary) 5%, var(--dsw-alias-bg-layer-3));\n}\n\n.rp-features-identityHeader {\n  display: flex;\n  align-items: flex-start;\n  justify-content: space-between;\n  gap: 14px;\n}\n\n.rp-features-identityTitle {\n  display: flex;\n  min-width: 0;\n  flex-wrap: wrap;\n  align-items: center;\n  gap: 7px;\n}\n\n.rp-features-identityTitle > div {\n  display: flex;\n  min-width: 0;\n  align-items: baseline;\n  gap: 7px;\n}\n\n.rp-features-identityTitle h4 {\n  margin: 0;\n  font-size: 13px;\n  line-height: 20px;\n}\n\n.rp-features-identityTitle code {\n  color: var(--dsw-alias-label-tertiary);\n  font: 9px/14px var(--ds-font-family-code);\n}\n\n.rp-features-identityTitle > span {\n  border-radius: 5px;\n  padding: 1px 5px;\n  background: var(--dsw-alias-bg-layer-1);\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 9px;\n  line-height: 14px;\n}\n\n.rp-features-identityTitle > span[data-customized='true'] {\n  background: color-mix(in srgb, var(--dsw-alias-state-business-primary) 10%, transparent);\n  color: var(--dsw-alias-state-business-primary);\n}\n\n.rp-features-identityDescription {\n  max-width: 660px;\n  margin: 0;\n  color: var(--dsw-alias-label-secondary);\n  font-size: 11px;\n  line-height: 18px;\n}\n\n.rp-features-identityEdit,\n.rp-features-identityReset,\n.rp-features-identityCancel,\n.rp-features-identitySave {\n  display: inline-flex;\n  min-height: 30px;\n  align-items: center;\n  justify-content: center;\n  gap: 5px;\n  border-radius: 7px;\n  padding: 5px 10px;\n  cursor: pointer;\n  font: 11px/18px var(--dsw-font-family);\n}\n\n.rp-features-identityEdit,\n.rp-features-identityReset,\n.rp-features-identityCancel {\n  border: 1px solid var(--dsw-alias-border-l2);\n  background: var(--dsw-alias-bg-layer-3);\n  color: var(--dsw-alias-label-secondary);\n}\n\n.rp-features-identitySave {\n  border: 1px solid var(--dsw-alias-state-business-primary);\n  background: var(--dsw-alias-state-business-primary);\n  color: white;\n}\n\n.rp-features-identityEdit:disabled,\n.rp-features-identityReset:disabled,\n.rp-features-identityCancel:disabled,\n.rp-features-identitySave:disabled {\n  cursor: not-allowed;\n  opacity: 0.5;\n}\n\n.rp-features-identityPreview {\n  border-radius: 8px;\n  padding: 9px 11px;\n  background: var(--dsw-alias-markdown-code-block);\n}\n\n.rp-features-identityPreview pre {\n  max-height: 140px;\n  overflow: auto;\n  margin: 0;\n  white-space: pre-wrap;\n  overflow-wrap: anywhere;\n}\n\n.rp-features-identityPreview code {\n  color: var(--dsw-alias-label-secondary);\n  font: 10px/17px var(--ds-font-family-code);\n}\n\n.rp-features-identityEditor {\n  display: flex;\n  flex-direction: column;\n  gap: 7px;\n}\n\n.rp-features-identityField {\n  display: flex;\n  flex-direction: column;\n  gap: 5px;\n  color: var(--dsw-alias-label-primary);\n  font-size: 11px;\n  line-height: 17px;\n  font-weight: 600;\n}\n\n.rp-features-identityField textarea {\n  width: 100%;\n  min-height: 108px;\n  resize: vertical;\n  box-sizing: border-box;\n  border: 1px solid var(--dsw-alias-border-l2);\n  border-radius: 8px;\n  padding: 9px 10px;\n  background: var(--dsw-alias-bg-layer-3);\n  color: var(--dsw-alias-label-primary);\n  font: 11px/18px var(--ds-font-family-code);\n}\n\n.rp-features-identityMeta {\n  display: flex;\n  align-items: flex-start;\n  justify-content: space-between;\n  gap: 12px;\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 9px;\n  line-height: 15px;\n}\n\n.rp-features-identityMeta > span:first-child {\n  max-width: 570px;\n}\n\n.rp-features-identityMeta > span:last-child {\n  flex: none;\n  font-variant-numeric: tabular-nums;\n}\n\n.rp-features-identityMeta > span[data-invalid='true'],\n.rp-features-identityError {\n  color: var(--dsw-alias-state-error-primary);\n}\n\n.rp-features-identityError {\n  min-height: 15px;\n  font-size: 9px;\n  line-height: 15px;\n}\n\n.rp-features-identityEditorActions {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 12px;\n}\n\n.rp-features-identityEditorActions > span:last-child {\n  display: flex;\n  gap: 7px;\n}\n\n.rp-features-promptWorkspace {\n  display: grid;\n  grid-template-columns: 164px minmax(0, 1fr);\n  align-items: start;\n  gap: 16px;\n}\n\n.rp-features-promptRoleNav {\n  display: flex;\n  flex-direction: column;\n  gap: 4px;\n}\n\n.rp-features-promptRoleButton {\n  display: flex;\n  min-width: 0;\n  flex-direction: column;\n  gap: 1px;\n  border: 1px solid transparent;\n  border-radius: 8px;\n  padding: 9px 10px;\n  background: transparent;\n  color: var(--dsw-alias-label-secondary);\n  text-align: left;\n  cursor: pointer;\n}\n\n.rp-features-promptRoleButton strong {\n  font: 600 12px/18px var(--dsw-font-family);\n}\n\n.rp-features-promptRoleButton span {\n  overflow: hidden;\n  color: var(--dsw-alias-label-tertiary);\n  font: 10px/16px var(--dsw-font-family);\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.rp-features-promptRoleButton:hover {\n  background: var(--dsw-alias-bg-layer-2);\n}\n\n.rp-features-promptRoleButton[data-selected='true'] {\n  border-color: color-mix(in srgb, var(--dsw-alias-state-business-primary) 24%, var(--dsw-alias-border-l2));\n  background: color-mix(in srgb, var(--dsw-alias-state-business-primary) 8%, transparent);\n  color: var(--dsw-alias-label-primary);\n}\n\n.rp-features-promptRoleButton:focus-visible,\n.rp-features-promptLayer summary:focus-visible,\n.rp-features-promptSelect select:focus-visible,\n.rp-features-identityEdit:focus-visible,\n.rp-features-identityReset:focus-visible,\n.rp-features-identityCancel:focus-visible,\n.rp-features-identitySave:focus-visible,\n.rp-features-identityField textarea:focus-visible {\n  outline: 2px solid var(--dsw-alias-state-business-primary);\n  outline-offset: 2px;\n}\n\n.rp-features-promptDetail,\n.rp-features-promptProfile,\n.rp-features-promptProfileHeader > div:first-child {\n  min-width: 0;\n}\n\n.rp-features-promptSelect {\n  display: grid;\n  grid-template-columns: auto minmax(0, 220px);\n  align-items: center;\n  justify-content: space-between;\n  gap: 12px;\n  margin-bottom: 12px;\n  color: var(--dsw-alias-label-secondary);\n  font-size: 11px;\n  line-height: 17px;\n}\n\n.rp-features-promptSelect select {\n  min-width: 0;\n  border: 1px solid var(--dsw-alias-border-l2);\n  border-radius: 7px;\n  padding: 6px 28px 6px 9px;\n  background: var(--dsw-alias-bg-layer-3);\n  color: var(--dsw-alias-label-primary);\n  font: 12px/18px var(--dsw-font-family);\n}\n\n.rp-features-promptEmpty {\n  border: 1px dashed var(--dsw-alias-border-l2);\n  border-radius: 10px;\n  padding: 28px 24px;\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 12px;\n  line-height: 19px;\n  text-align: center;\n}\n\n.rp-features-promptProfile {\n  display: flex;\n  flex-direction: column;\n  gap: 11px;\n}\n\n.rp-features-promptProfileHeader {\n  display: flex;\n  align-items: flex-start;\n  justify-content: space-between;\n  gap: 16px;\n}\n\n.rp-features-promptProfileHeader h4,\n.rp-features-promptProfileHeader p {\n  margin: 0;\n}\n\n.rp-features-promptProfileHeader h4 {\n  font-size: 14px;\n  line-height: 21px;\n}\n\n.rp-features-promptProfileHeader p {\n  margin-top: 2px;\n  color: var(--dsw-alias-label-secondary);\n  font-size: 11px;\n  line-height: 17px;\n}\n\n.rp-features-promptRoute {\n  display: flex;\n  flex: none;\n  align-items: center;\n  gap: 6px;\n  border-radius: 6px;\n  padding: 4px 7px;\n  background: var(--dsw-alias-bg-layer-1);\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 10px;\n  line-height: 16px;\n}\n\n.rp-features-promptRoute strong {\n  color: var(--dsw-alias-label-secondary);\n  font-weight: 600;\n}\n\n.rp-features-promptNotes {\n  display: grid;\n  gap: 3px;\n  margin: 0;\n  padding: 9px 12px 9px 26px;\n  border-left: 2px solid color-mix(in srgb, var(--dsw-alias-state-business-primary) 45%, transparent);\n  background: color-mix(in srgb, var(--dsw-alias-state-business-primary) 5%, transparent);\n  color: var(--dsw-alias-label-secondary);\n  font-size: 10px;\n  line-height: 16px;\n}\n\n.rp-features-promptOrderHeading {\n  color: var(--dsw-alias-label-primary);\n  font-size: 11px;\n  line-height: 17px;\n  font-weight: 650;\n}\n\n.rp-features-promptLayerList {\n  overflow: hidden;\n  margin: -3px 0 0;\n  border: 1px solid var(--dsw-alias-border-l2);\n  border-radius: 10px;\n  padding: 0;\n  background: var(--dsw-alias-bg-layer-3);\n  list-style: none;\n}\n\n.rp-features-promptLayerList > li:not(:last-child) {\n  border-bottom: 1px solid var(--dsw-alias-separator-primary);\n}\n\n.rp-features-promptLayer summary {\n  display: grid;\n  grid-template-columns: 22px minmax(130px, 1fr) auto auto 12px;\n  align-items: center;\n  gap: 8px;\n  padding: 10px 11px;\n  cursor: pointer;\n  list-style: none;\n}\n\n.rp-features-promptLayer summary::-webkit-details-marker {\n  display: none;\n}\n\n.rp-features-promptLayer summary > svg {\n  color: var(--dsw-alias-label-tertiary);\n  transition: transform 140ms ease;\n}\n\n.rp-features-promptLayer[open] summary > svg {\n  transform: rotate(180deg);\n}\n\n.rp-features-promptLayerIndex {\n  display: grid;\n  width: 20px;\n  height: 20px;\n  place-items: center;\n  border-radius: 50%;\n  background: var(--dsw-alias-bg-layer-1);\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 9px;\n  font-variant-numeric: tabular-nums;\n}\n\n.rp-features-promptLayerTitle {\n  display: flex;\n  min-width: 0;\n  flex-direction: column;\n}\n\n.rp-features-promptLayerTitle strong {\n  overflow: hidden;\n  font-size: 11px;\n  line-height: 17px;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.rp-features-promptLayerTitle small {\n  display: flex;\n  min-width: 0;\n  overflow: hidden;\n  align-items: center;\n  gap: 5px;\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 9px;\n  line-height: 14px;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.rp-features-promptLayerTitle small span {\n  overflow: hidden;\n  text-overflow: ellipsis;\n}\n\n.rp-features-promptLayerTitle small code {\n  flex: none;\n  color: inherit;\n  font: inherit;\n}\n\n.rp-features-promptRole,\n.rp-features-promptKind {\n  border-radius: 5px;\n  padding: 2px 6px;\n  font-size: 9px;\n  line-height: 14px;\n  white-space: nowrap;\n}\n\n.rp-features-promptRole {\n  background: color-mix(in srgb, var(--dsw-alias-state-business-primary) 9%, transparent);\n  color: var(--dsw-alias-state-business-primary);\n  font-family: var(--ds-font-family-code);\n}\n\n.rp-features-promptRole[data-role='user'] {\n  background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 9%, transparent);\n  color: var(--dsw-alias-state-success-primary);\n}\n\n.rp-features-promptRole[data-role='tools'] {\n  background: var(--dsw-alias-bg-layer-1);\n  color: var(--dsw-alias-label-secondary);\n}\n\n.rp-features-promptKind {\n  background: var(--dsw-alias-bg-layer-1);\n  color: var(--dsw-alias-label-tertiary);\n}\n\n.rp-features-promptLayerBody {\n  border-top: 1px solid var(--dsw-alias-separator-primary);\n  padding: 10px 12px 12px 41px;\n  background: var(--dsw-alias-bg-layer-2);\n}\n\n.rp-features-promptLayerBody p {\n  margin: 0;\n  color: var(--dsw-alias-label-secondary);\n  font-size: 10px;\n  line-height: 17px;\n}\n\n.rp-features-promptLayerBody pre {\n  max-height: 360px;\n  overflow: auto;\n  margin: 0;\n  white-space: pre-wrap;\n  overflow-wrap: anywhere;\n}\n\n.rp-features-promptLayerBody pre code {\n  color: var(--dsw-alias-label-secondary);\n  font: 10px/17px var(--ds-font-family-code);\n}\n\n.rp-features-promptToolBlock {\n  display: grid;\n  gap: 6px;\n  margin-top: 9px;\n}\n\n.rp-features-promptToolBlock > span,\n.rp-features-promptNoTools {\n  color: var(--dsw-alias-label-tertiary) !important;\n  font-size: 9px !important;\n  line-height: 14px !important;\n}\n\n.rp-features-promptTools {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 5px;\n}\n\n.rp-features-promptTools code {\n  border: 1px solid var(--dsw-alias-border-l2);\n  border-radius: 5px;\n  padding: 2px 6px;\n  background: var(--dsw-alias-bg-layer-3);\n  color: var(--dsw-alias-label-secondary);\n  font: 9px/14px var(--ds-font-family-code);\n}\n\n.rp-features-state,\n.rp-features-failure {\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 13px;\n  line-height: 20px;\n}\n\n.rp-features-failure {\n  display: flex;\n  align-items: center;\n  gap: 10px;\n  color: var(--dsw-alias-state-error-primary);\n}\n\n.rp-features-failure button {\n  border: 1px solid var(--dsw-alias-border-l2);\n  border-radius: 6px;\n  padding: 4px 10px;\n  background: transparent;\n  color: var(--dsw-alias-label-primary);\n  font: inherit;\n  cursor: pointer;\n}\n\n@media (prefers-reduced-motion: reduce) {\n  .rp-features-promptLayer summary > svg {\n    transition: none;\n  }\n}\n\n.rp-features-liveNotice {\n  min-height: 18px;\n  color: var(--dsw-alias-label-secondary);\n  font-size: 12px;\n  line-height: 18px;\n}\n\n@media (max-width: 720px) {\n  .rp-features-header {\n    flex-direction: column;\n    gap: 12px;\n  }\n\n  .rp-features-versionSummary,\n  .rp-features-featureList {\n    width: 100%;\n    grid-template-columns: minmax(0, 1fr);\n  }\n\n  .rp-features-coreVersions ul {\n    grid-template-columns: minmax(0, 1fr);\n  }\n\n  .rp-features-visibilityBody dl > div {\n    grid-template-columns: minmax(0, 1fr);\n    gap: 0;\n  }\n\n  .rp-features-skill {\n    grid-template-columns: 32px minmax(0, 1fr) 38px;\n  }\n\n  .rp-features-promptWorkspace {\n    grid-template-columns: minmax(0, 1fr);\n  }\n\n  .rp-features-promptRoleNav {\n    display: grid;\n    grid-template-columns: repeat(2, minmax(0, 1fr));\n  }\n\n  .rp-features-promptProfileHeader,\n  .rp-features-promptSelect {\n    grid-template-columns: minmax(0, 1fr);\n    flex-direction: column;\n    align-items: stretch;\n  }\n\n  .rp-features-identityHeader,\n  .rp-features-identityMeta,\n  .rp-features-identityEditorActions {\n    align-items: stretch;\n    flex-direction: column;\n  }\n\n  .rp-features-identityEdit {\n    align-self: flex-start;\n  }\n\n  .rp-features-identityEditorActions > span:last-child {\n    justify-content: flex-end;\n  }\n\n  .rp-features-promptLayer summary {\n    grid-template-columns: 22px minmax(0, 1fr) auto 12px;\n  }\n\n  .rp-features-promptKind {\n    display: none;\n  }\n\n  .rp-features-promptLayerBody {\n    padding-left: 12px;\n  }\n}\n";
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
			"locale",
			"connection",
			"settingsScope"
		];
		const h = react.default.createElement;
		const NS = "settings.roleplayFeatures";
		const TAB_IDS = Object.freeze([
			"features",
			"skills",
			"prompts"
		]);
		const CATEGORY_COPY = {
			materials: ["资料", "选择故事使用的共享资料类型。停用后资料文件和已有对话绑定仍会保留。"],
			creation: ["创作能力", "管理会话变量、兼容转换和 Agent 写作增强。"],
			conversation: ["对话体验", "控制消息区域中的附加交互与呈现。"]
		};
		const zh = {
			nav: "Roleplay",
			title: "Roleplay",
			description: "管理 Roleplay 功能、Skills 与代理提示词。",
			featuresTab: "功能",
			skillsTab: "Skills",
			promptsTab: "系统提示词",
			featuresTitle: "Roleplay 功能",
			featuresDescription: "这些功能已随 Roleplay 组合提供。启用只控制是否加载，不会改变已提供的代码，也不会删除资料。",
			coreTitle: "核心运行时",
			coreDescription: "回复运行、对话配置、名称宏和故事设置始终启用。",
			alwaysEnabled: "始终启用",
			enabled: "已启用",
			disabled: "未启用",
			enabling: "正在更新…",
			loading: "正在读取 Roleplay 设置…",
			loadError: "暂时无法读取 Roleplay 设置。",
			retry: "重试",
			compatible: "版本兼容",
			incompatible: "版本不兼容",
			versionProblem: "当前版本组合不兼容。请先对齐 Roleplay 与 DSH 版本，再调整功能或 Skills。",
			roleplayVersion: "Roleplay",
			dshVersion: "DSH",
			versionDetails: "查看核心组件版本",
			applies: "资料入口会立即调整；Roleplay 运行能力从下一次新建或重新打开对话开始生效。",
			saveError: "启用状态没有保存，请稍后重试。",
			skillsTitle: "Roleplay Skills",
			skillsDescription: "逐项选择 Roleplay 插件向 Agent 提供的工作指南。停用 Skill 不会停用插件，也不会删除资料。",
			skillsScope: "这里只管理 Roleplay 插件贡献的 Skills；项目目录和用户目录中的其他 Skills 不受影响。",
			visibilityTitle: "可见性预览",
			parentAgent: "Agent 模式父代理",
			parentAgentVisibility: "可以看到当前已启用的 Roleplay Skills。",
			customSubagents: "自定义子代理",
			customSubagentsVisibility: "仅当“子代理”功能已启用，且该子代理允许使用 Skills 时可见。",
			writer: "Writer",
			writerVisibility: "始终不可见。启用或停用“子代理”功能都不会改变 Writer。",
			pluginDisabled: "插件未启用",
			waitingForPlugin: "等待插件启用",
			sourcePlugin: "来自",
			visibleParent: "当前可见：Agent 模式父代理",
			visibleSubagents: "、允许 Skills 的自定义子代理",
			subagentsUnavailable: "；“子代理”功能当前未启用",
			invisibleSkill: "当前不可见：此 Skill 未启用。",
			invisiblePlugin: "当前不可见：请先在“功能”中启用对应插件。",
			promptsTitle: "代理提示词",
			promptsDescription: "查看主对话、Writer 与自定义子代理最终接收哪些指令，以及它们按什么顺序进入模型。",
			promptsScope: "Harness 身份、源码位置和 Web 运行环境会从当前版本读取并分别展示；Roleplay 规则与实际运行共用同一套渲染器。当前对话、资料、Skills 和工具清单仍按每次请求生成，因此这里只展示模板或来源，不读取某次对话的私有内容。",
			promptsLoading: "正在读取代理提示词…",
			promptsLoadError: "暂时无法读取代理提示词。",
			identityTitle: "Roleplay 统一身份",
			identityDescription: "覆盖所有 Roleplay 预设中 Chat、Agent、Writer 和自定义子代理的 harness:identity；其他 Agent 预设继续使用 Harness 默认身份。",
			identityDefault: "使用 Harness 默认值",
			identityCustomized: "已自定义",
			identityEdit: "编辑统一身份",
			identityField: "统一身份 System 提示词",
			identityHelper: "保存后，从下一次模型请求开始统一生效。Harness 源码位置和 Web 运行环境不会被修改。",
			identityCharacters: "字符",
			identityRequired: "统一身份不能为空。",
			identityTooLong: "统一身份超过允许的最大长度。",
			identityCancel: "取消",
			identitySave: "保存统一身份",
			identitySaving: "正在保存…",
			identityReset: "恢复 Harness 默认值",
			identitySaved: "已更新 Roleplay 统一身份；下一次模型请求开始使用。",
			identityResetDone: "已恢复 Harness 默认身份。",
			identitySaveError: "统一身份没有保存，请稍后重试。",
			promptRoles: "选择代理",
			parentChatPrompt: "Chat 父代理",
			parentChatHint: "Writer 直接交付正文",
			parentAgentPrompt: "Agent 父代理",
			parentAgentHint: "规划并审阅正文",
			writerPrompt: "Writer",
			writerPromptHint: "只负责本轮正文",
			customPrompt: "自定义子代理",
			customPromptHint: "独立完成一个任务",
			customPromptSelect: "选择自定义子代理",
			noCustomPrompts: "当前没有可预览的自定义子代理。启用“子代理”功能并创建一个子代理后，这里会显示它的实际工作指令。",
			promptOrder: "模型接收顺序",
			modelRoute: "模型",
			sessionModel: "当前对话模型",
			inheritedModel: "继承父代理模型",
			systemRole: "System",
			userRole: "User",
			toolsRole: "Tools",
			exactPrompt: "完整内容",
			templatePrompt: "动态模板",
			dynamicPrompt: "运行时生成",
			externalPrompt: "Harness 提供",
			derivedPrompt: "按权限筛选",
			promptSource: "来源",
			externalPromptBody: "当前设置上下文无法展开这部分 Harness 内容；实际模型请求仍由 Harness 按运行配置生成。",
			dynamicPromptBody: "从当前对话的消息与实时资料生成；预览不会读取或展示某次对话的内容。",
			derivedPromptBody: "只保留这个代理在当前模式下真正可见、可调用的工具说明。",
			noTools: "不向这个代理提供工具。",
			promptTools: "可见工具",
			promptLayerHarness: "Harness 身份",
			promptLayerHarnessSource: "Harness 源码环境",
			promptLayerWebSurface: "Web 运行环境",
			promptLayerParentPersona: "Roleplay 通用规则",
			promptLayerRuntime: "当前模式工作流",
			promptLayerToolGuidance: "可用工具规则",
			promptLayerConversation: "当前对话输入",
			promptLayerWriterReady: "Roleplay 运行上下文",
			promptLayerToolSchema: "工具清单",
			promptLayerWriterPersona: "正文写作规则",
			promptLayerWriterSlots: "Writer 写作材料",
			promptLayerTaskPersona: "自定义工作指令",
			promptLayerTaskCall: "本次独立任务",
			sourceHarness: "Harness",
			sourceHarnessBoot: "Harness App Boot",
			sourceHarnessWeb: "Harness Web",
			sourceParent: "Roleplay 通用模板",
			sourceRuntime: "Roleplay 运行时",
			sourceTools: "当前可用工具",
			sourceConversation: "当前对话",
			sourceSubagent: "自定义子代理设置",
			noteChatRelay: "生成的正文会直接接入当前回复；之后只提交本轮效果。",
			noteAgentRevision: "生成的正文作为初稿，可在提交前审阅和修改。",
			noteFreshChild: "每次调用都使用独立上下文。",
			notePersonaShadowed: "这里只注入本项写作或工作规则，不叠加主对话的 Roleplay 通用规则。",
			noteRuntimeSkipped: "Chat／Agent 的模式工作流不会注入这里。",
			noteNoTools: "Writer 不接收任何工具。",
			noteExplicitInput: "只接收本次任务和明确传入的资料。"
		};
		const en = {
			...zh,
			nav: "Roleplay",
			title: "Roleplay",
			description: "Manage Roleplay features, Skills, and agent prompts.",
			featuresTab: "Features",
			skillsTab: "Skills",
			promptsTab: "System prompts",
			featuresTitle: "Roleplay features",
			featuresDescription: "These features are already included. Enabling only controls loading; it never changes the provided code or deletes data.",
			coreTitle: "Core runtime",
			coreDescription: "Reply runtime, conversation configuration, name macros, and story setup stay enabled.",
			alwaysEnabled: "Always enabled",
			enabled: "Enabled",
			disabled: "Not enabled",
			enabling: "Updating…",
			loading: "Reading Roleplay settings…",
			loadError: "Roleplay settings are temporarily unavailable.",
			retry: "Retry",
			compatible: "Versions compatible",
			incompatible: "Versions incompatible",
			versionProblem: "This version set is incompatible. Align Roleplay and DSH versions before changing features or Skills.",
			roleplayVersion: "Roleplay",
			dshVersion: "DSH",
			versionDetails: "View core component versions",
			applies: "Material entries update immediately. Runtime changes apply to newly created or reopened conversations.",
			saveError: "The enabled state was not saved. Try again.",
			skillsTitle: "Roleplay Skills",
			skillsDescription: "Select the guides Roleplay plugins expose to agents. Disabling a Skill does not disable its plugin or delete data.",
			skillsScope: "This page only manages Skills contributed by Roleplay plugins. Project and user Skills are unaffected.",
			visibilityTitle: "Visibility preview",
			parentAgent: "Agent-mode parent",
			parentAgentVisibility: "Can see the currently enabled Roleplay Skills.",
			customSubagents: "Custom subagents",
			customSubagentsVisibility: "Visible only when Subagents is enabled and that subagent is allowed to use Skills.",
			writer: "Writer",
			writerVisibility: "Never visible. Enabling or disabling Subagents does not change Writer.",
			pluginDisabled: "Plugin not enabled",
			waitingForPlugin: "Waiting for plugin",
			sourcePlugin: "From",
			visibleParent: "Currently visible: Agent-mode parent",
			visibleSubagents: ", custom subagents allowed to use Skills",
			subagentsUnavailable: "; Subagents is not enabled",
			invisibleSkill: "Currently hidden: this Skill is not enabled.",
			invisiblePlugin: "Currently hidden: enable the matching plugin under Features first.",
			promptsTitle: "Agent prompts",
			promptsDescription: "See which instructions reach the main conversation, Writer, and each custom subagent, in model input order.",
			promptsScope: "Harness identity, source-checkout context, and Web runtime context are read from the running version and shown separately. Roleplay rules share their renderers with the live runtime. Conversation content, materials, Skills, and tool schemas are generated per request, so private conversation content appears only as a labeled source or template.",
			promptsLoading: "Reading agent prompts…",
			promptsLoadError: "Agent prompts are temporarily unavailable.",
			identityTitle: "Shared Roleplay identity",
			identityDescription: "Overrides harness:identity for Chat, Agent, Writer, and custom subagents in every Roleplay preset. Other agent presets keep the Harness default.",
			identityDefault: "Using Harness default",
			identityCustomized: "Customized",
			identityEdit: "Edit shared identity",
			identityField: "Shared identity System prompt",
			identityHelper: "After saving, every Roleplay agent uses it from the next model request. Harness source and Web runtime context are unchanged.",
			identityCharacters: "characters",
			identityRequired: "The shared identity cannot be empty.",
			identityTooLong: "The shared identity exceeds the maximum length.",
			identityCancel: "Cancel",
			identitySave: "Save shared identity",
			identitySaving: "Saving…",
			identityReset: "Restore Harness default",
			identitySaved: "The shared Roleplay identity is updated for the next model request.",
			identityResetDone: "The Harness default identity is restored.",
			identitySaveError: "The shared identity was not saved. Try again.",
			promptRoles: "Choose an agent",
			parentChatPrompt: "Chat parent",
			parentChatHint: "Writer delivers prose directly",
			parentAgentPrompt: "Agent parent",
			parentAgentHint: "Plans and reviews prose",
			writerPrompt: "Writer",
			writerPromptHint: "Writes this turn only",
			customPrompt: "Custom subagent",
			customPromptHint: "Runs one isolated task",
			customPromptSelect: "Choose a custom subagent",
			noCustomPrompts: "No custom subagent is available to preview. Enable Subagents and create one to see its actual work instructions here.",
			promptOrder: "Model input order",
			modelRoute: "Model",
			sessionModel: "Current conversation model",
			inheritedModel: "Inherit parent model",
			systemRole: "System",
			userRole: "User",
			toolsRole: "Tools",
			exactPrompt: "Full content",
			templatePrompt: "Dynamic template",
			dynamicPrompt: "Generated at runtime",
			externalPrompt: "Provided by Harness",
			derivedPrompt: "Permission-filtered",
			promptSource: "Source",
			externalPromptBody: "This Harness content cannot be expanded from the current settings context; the actual model request is still generated by Harness.",
			dynamicPromptBody: "Generated from live conversation messages and materials; this preview does not read or reveal a conversation.",
			derivedPromptBody: "Only guidance for tools that this agent can actually see and call in the current mode is retained.",
			noTools: "No tools are exposed to this agent.",
			promptTools: "Visible tools",
			promptLayerHarness: "Harness identity",
			promptLayerHarnessSource: "Harness source context",
			promptLayerWebSurface: "Web runtime context",
			promptLayerParentPersona: "Shared Roleplay rules",
			promptLayerRuntime: "Current mode workflow",
			promptLayerToolGuidance: "Visible-tool guidance",
			promptLayerConversation: "Conversation input",
			promptLayerWriterReady: "Roleplay run context",
			promptLayerToolSchema: "Tool schemas",
			promptLayerWriterPersona: "Narrative writing rules",
			promptLayerWriterSlots: "Writer material",
			promptLayerTaskPersona: "Custom work instructions",
			promptLayerTaskCall: "Isolated task input",
			sourceHarness: "Harness",
			sourceHarnessBoot: "Harness App Boot",
			sourceHarnessWeb: "Harness Web",
			sourceParent: "Shared Roleplay template",
			sourceRuntime: "Roleplay runtime",
			sourceTools: "Visible tools",
			sourceConversation: "Current conversation",
			sourceSubagent: "Custom subagent settings",
			noteChatRelay: "Generated prose is inserted into the current reply; only this turn’s effects are committed afterward.",
			noteAgentRevision: "Generated prose is a draft that can be reviewed and revised before commit.",
			noteFreshChild: "Every call uses an isolated context.",
			notePersonaShadowed: "Only these writing or work rules are injected; the main conversation’s shared Roleplay rules are not added.",
			noteRuntimeSkipped: "Chat and Agent mode workflows are not injected here.",
			noteNoTools: "Writer receives no tools.",
			noteExplicitInput: "Only this task and its explicitly supplied material are visible."
		};
		function apply(ctx) {
			ctx.effect(ensureStyles);
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "rp-feature-manager: dictionaries");
			const scope = ctx.settingsScope.bind({ namespace: SETTINGS_NAMESPACE });
			const t = ctx.locale.bind(NS);
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "roleplay",
				order: 25,
				label: () => t("nav"),
				locale: NS,
				inject: () => ({
					scope,
					connection: ctx.connection
				})
			}, RoleplaySettingsSection));
		}
		function RoleplaySettingsSection({ scope, connection, t }) {
			const reduced = useReducedMotion();
			const settings = (0, react.useSyncExternalStore)((listener) => scope.subscribe(listener), () => scope.getSnapshot());
			const [status, setStatus] = (0, react.useState)({ phase: "loading" });
			const [activeTab, setActiveTab] = (0, react.useState)("features");
			const [pending, setPending] = (0, react.useState)(null);
			const [notice, setNotice] = (0, react.useState)("");
			const [request, setRequest] = (0, react.useState)(0);
			const [promptStatus, setPromptStatus] = (0, react.useState)({ phase: "idle" });
			const [promptRequest, setPromptRequest] = (0, react.useState)(0);
			(0, react.useEffect)(() => {
				let live = true;
				setStatus({ phase: "loading" });
				featureStatus(connection).then((value) => {
					if (live) setStatus({
						phase: "ready",
						value
					});
				}, () => {
					if (live) setStatus({ phase: "error" });
				});
				return () => {
					live = false;
				};
			}, [
				connection,
				request,
				settings.revision
			]);
			(0, react.useEffect)(() => {
				if (activeTab !== "prompts") return void 0;
				let live = true;
				setPromptStatus({ phase: "loading" });
				promptPreview(connection).then((value) => {
					if (live) setPromptStatus({
						phase: "ready",
						value
					});
				}, () => {
					if (live) setPromptStatus({ phase: "error" });
				});
				return () => {
					live = false;
				};
			}, [
				activeTab,
				connection,
				promptRequest,
				settings.revision
			]);
			const enabledFeatures = status.phase === "ready" && Array.isArray(status.value.enabledFeatures) ? status.value.enabledFeatures : [];
			const enabledSkills = status.phase === "ready" && Array.isArray(status.value.enabledSkills) ? status.value.enabledSkills : [];
			const enabled = (0, react.useMemo)(() => new Set(enabledFeatures), [enabledFeatures]);
			const selectedSkills = (0, react.useMemo)(() => new Set(enabledSkills), [enabledSkills]);
			const compatible = status.phase === "ready" && status.value.compatible === true;
			const settingsRevision = status.phase === "ready" ? status.value.settings?.revision : null;
			const canWrite = status.phase === "ready" && status.value.settings?.writable === true && Number.isSafeInteger(settingsRevision) && compatible && pending === null;
			const toggleFeature = async (feature) => {
				if (!canWrite) return;
				const nextEnabled = !enabled.has(feature.id);
				const plan = planFeatureToggle(enabledFeatures, feature.id, nextEnabled);
				setPending(`feature:${feature.id}`);
				setNotice("");
				try {
					const nextStatus = await setRoleplaySetting(connection, "enabledFeatures", plan.enabledFeatures, settingsRevision);
					if (!sameSelection(nextStatus.enabledFeatures, plan.enabledFeatures)) throw new Error("Roleplay feature selection was not applied");
					setStatus({
						phase: "ready",
						value: nextStatus
					});
					setNotice(toggleAnnouncement(feature, nextEnabled, plan.sideEffects));
				} catch {
					setNotice(t("saveError"));
				} finally {
					setPending(null);
					setRequest((value) => value + 1);
				}
			};
			const toggleSkill = async (skill) => {
				if (!canWrite || !skill.featureEnabled) return;
				const nextEnabled = !selectedSkills.has(skill.id);
				const nextSkills = planSkillToggle(enabledSkills, skill.id, nextEnabled);
				setPending(`skill:${skill.id}`);
				setNotice("");
				try {
					const nextStatus = await setRoleplaySetting(connection, "enabledSkills", nextSkills, settingsRevision);
					if (!sameSelection(nextStatus.enabledSkills, nextSkills)) throw new Error("Roleplay Skill selection was not applied");
					setStatus({
						phase: "ready",
						value: nextStatus
					});
					setNotice(skillToggleAnnouncement(skill, nextEnabled));
				} catch {
					setNotice(t("saveError"));
				} finally {
					setPending(null);
					setRequest((value) => value + 1);
				}
			};
			const updateHarnessIdentity = async (value, reset = false) => {
				if (!canWrite) return false;
				const normalized = typeof value === "string" ? value.trim() : void 0;
				setPending("harness-identity");
				setNotice("");
				try {
					const nextStatus = reset ? await unsetRoleplaySetting(connection, "harnessIdentity", settingsRevision) : await setRoleplaySetting(connection, "harnessIdentity", normalized, settingsRevision);
					setStatus({
						phase: "ready",
						value: nextStatus
					});
					const nextPreview = await promptPreview(connection);
					if (reset) {
						if (nextPreview.harnessIdentity?.customized !== false) throw new Error("Roleplay identity reset was not applied");
					} else if (nextPreview.harnessIdentity?.value !== normalized || nextPreview.harnessIdentity?.customized !== true) throw new Error("Roleplay identity update was not applied");
					setPromptStatus({
						phase: "ready",
						value: nextPreview
					});
					setNotice(t(reset ? "identityResetDone" : "identitySaved"));
					return true;
				} catch {
					setNotice(t("identitySaveError"));
					return false;
				} finally {
					setPending(null);
				}
			};
			if (status.phase === "loading") return h("div", {
				className: css.state,
				role: "status"
			}, t("loading"));
			if (status.phase === "error") return h("div", { className: css.failure }, h("p", { role: "alert" }, t("loadError")), h("button", {
				type: "button",
				onClick: () => setRequest((value) => value + 1)
			}, t("retry")));
			const tabLabel = (id) => t({
				features: "featuresTab",
				skills: "skillsTab",
				prompts: "promptsTab"
			}[id]);
			return h(MotionConfig, { reducedMotion: "user" }, h(LazyMotion, {
				features: domAnimation,
				strict: true
			}, h("div", { className: css.page }, h("header", { className: css.header }, h("div", null, h("h2", null, t("title")), h("p", null, t("description"))), h(VersionSummary, {
				status: status.value,
				t
			})), h("div", {
				className: css.tabs,
				role: "tablist",
				"aria-label": t("title")
			}, ...TAB_IDS.map((id) => h("button", {
				key: id,
				id: `rp-settings-tab-${id}`,
				type: "button",
				role: "tab",
				"aria-selected": activeTab === id,
				"aria-controls": `rp-settings-panel-${id}`,
				tabIndex: activeTab === id ? 0 : -1,
				onClick: () => setActiveTab(id),
				onKeyDown: (event) => moveTabFocus(event, id, setActiveTab)
			}, h("span", null, tabLabel(id)), activeTab === id ? h(m.span, {
				className: css.tabIndicator,
				layoutId: "rp-settings-tab-indicator"
			}) : null))), compatible ? null : h("div", {
				className: css.versionWarning,
				role: "alert"
			}, t("versionProblem")), h(AnimatePresence, {
				mode: "wait",
				initial: false
			}, h(m.div, {
				key: activeTab,
				id: `rp-settings-panel-${activeTab}`,
				className: css.tabPanel,
				role: "tabpanel",
				"aria-labelledby": `rp-settings-tab-${activeTab}`,
				initial: reduced ? false : {
					opacity: 0,
					y: 4
				},
				animate: {
					opacity: 1,
					y: 0
				},
				exit: reduced ? { opacity: 1 } : {
					opacity: 0,
					y: -4
				},
				transition: { duration: reduced ? 0 : .16 }
			}, activeTab === "features" ? h(FeaturesPanel, {
				status: status.value,
				enabled,
				pending,
				canWrite,
				reduced,
				onToggle: (feature) => {
					toggleFeature(feature);
				},
				t
			}) : activeTab === "skills" ? h(SkillsPanel, {
				skills: status.value.skills,
				subagentsEnabled: enabled.has("subagent-manager"),
				pending,
				canWrite,
				reduced,
				onToggle: (skill) => {
					toggleSkill(skill);
				},
				t
			}) : h(PromptsPanel, {
				status: promptStatus,
				reduced,
				canWrite,
				identitySaving: pending === "harness-identity",
				onSaveIdentity: (value) => updateHarnessIdentity(value),
				onResetIdentity: () => updateHarnessIdentity(void 0, true),
				onRetry: () => setPromptRequest((value) => value + 1),
				t
			}))), h("div", {
				className: css.liveNotice,
				"aria-live": "polite"
			}, notice))));
		}
		function FeaturesPanel({ status, enabled, pending, canWrite, reduced, onToggle, t }) {
			return h(react.default.Fragment, null, h("div", { className: css.panelIntro }, h("h3", null, t("featuresTitle")), h("p", null, t("featuresDescription"))), h("p", { className: css.applies }, t("applies")), h(CoreSummary, {
				status,
				t
			}), ...groupedFeatures().map((group) => h("section", {
				className: css.section,
				key: group.category,
				"aria-labelledby": `rp-features-${group.category}`
			}, h("div", { className: css.sectionHeading }, h("h3", { id: `rp-features-${group.category}` }, CATEGORY_COPY[group.category][0]), h("p", null, CATEGORY_COPY[group.category][1])), h("ul", { className: css.featureList }, ...group.features.map((feature) => h(FeatureRow, {
				key: feature.id,
				feature,
				checked: enabled.has(feature.id),
				pending: pending === `feature:${feature.id}`,
				disabled: !canWrite,
				status: status.features.find((item) => item.id === feature.id),
				reduced,
				onToggle: () => onToggle(feature),
				t
			}))))));
		}
		function SkillsPanel({ skills, subagentsEnabled, pending, canWrite, reduced, onToggle, t }) {
			return h(react.default.Fragment, null, h("div", { className: css.panelIntro }, h("h3", null, t("skillsTitle")), h("p", null, t("skillsDescription"))), h("p", { className: css.skillScope }, t("skillsScope")), h("section", {
				className: css.visibility,
				"aria-labelledby": "rp-skills-visibility"
			}, h("div", { className: css.visibilityIcon }, h(_deepseek_ai_dsh_client_ui_primitives.IconSkillOutline16, {
				size: 18,
				"aria-hidden": true
			})), h("div", { className: css.visibilityBody }, h("h3", { id: "rp-skills-visibility" }, t("visibilityTitle")), h("dl", null, h("div", null, h("dt", null, t("parentAgent")), h("dd", null, t("parentAgentVisibility"))), h("div", null, h("dt", null, t("customSubagents")), h("dd", null, t("customSubagentsVisibility"))), h("div", null, h("dt", null, t("writer")), h("dd", null, t("writerVisibility")))))), h("ul", { className: css.skillList }, ...skills.map((skill) => h(SkillRow, {
				key: skill.id,
				skill,
				subagentsEnabled,
				pending: pending === `skill:${skill.id}`,
				disabled: !canWrite || !skill.featureEnabled,
				reduced,
				onToggle: () => onToggle(skill),
				t
			}))));
		}
		function PromptsPanel({ status, reduced, canWrite, identitySaving, onSaveIdentity, onResetIdentity, onRetry, t }) {
			const [selectedKind, setSelectedKind] = (0, react.useState)("parent-chat");
			const [selectedTaskId, setSelectedTaskId] = (0, react.useState)("");
			const preview = status.phase === "ready" ? status.value : void 0;
			const taskProfiles = Array.isArray(preview?.taskSubagents) ? preview.taskSubagents : [];
			(0, react.useEffect)(() => {
				if (taskProfiles.length === 0) {
					setSelectedTaskId("");
					return;
				}
				if (!taskProfiles.some((profile) => profile.taskId === selectedTaskId)) setSelectedTaskId(taskProfiles[0].taskId);
			}, [selectedTaskId, taskProfiles]);
			const roles = [
				{
					id: "parent-chat",
					label: t("parentChatPrompt"),
					hint: t("parentChatHint")
				},
				{
					id: "parent-agent",
					label: t("parentAgentPrompt"),
					hint: t("parentAgentHint")
				},
				{
					id: "writer",
					label: t("writerPrompt"),
					hint: t("writerPromptHint")
				},
				{
					id: "task-subagent",
					label: t("customPrompt"),
					hint: t("customPromptHint")
				}
			];
			const selectedProfile = selectedKind === "task-subagent" ? taskProfiles.find((profile) => profile.taskId === selectedTaskId) : preview?.profiles?.find((profile) => profile.kind === selectedKind);
			return h(react.default.Fragment, null, h("div", { className: css.panelIntro }, h("h3", null, t("promptsTitle")), h("p", null, t("promptsDescription"))), h("div", { className: css.promptScope }, h("div", { className: css.promptScopeIcon }, h(_deepseek_ai_dsh_client_ui_primitives.IconCodeOutline16, {
				size: 18,
				"aria-hidden": true
			})), h("p", null, t("promptsScope"))), status.phase === "loading" || status.phase === "idle" ? h("div", {
				className: css.state,
				role: "status"
			}, t("promptsLoading")) : status.phase === "error" ? h("div", { className: css.failure }, h("p", { role: "alert" }, t("promptsLoadError")), h("button", {
				type: "button",
				onClick: onRetry
			}, t("retry"))) : h(react.default.Fragment, null, h(HarnessIdentitySetting, {
				setting: preview.harnessIdentity,
				canWrite,
				saving: identitySaving,
				reduced,
				onSave: onSaveIdentity,
				onReset: onResetIdentity,
				t
			}), h("div", { className: css.promptWorkspace }, h("nav", {
				className: css.promptRoleNav,
				"aria-label": t("promptRoles")
			}, ...roles.map((role) => h("button", {
				key: role.id,
				type: "button",
				className: css.promptRoleButton,
				"data-selected": selectedKind === role.id ? "true" : "false",
				"aria-pressed": selectedKind === role.id,
				onClick: () => setSelectedKind(role.id)
			}, h("strong", null, role.label), h("span", null, role.hint)))), h("section", {
				className: css.promptDetail,
				"aria-live": "polite"
			}, selectedKind === "task-subagent" && taskProfiles.length === 0 ? h("div", { className: css.promptEmpty }, t("noCustomPrompts")) : h(react.default.Fragment, null, selectedKind === "task-subagent" ? h("label", { className: css.promptSelect }, h("span", null, t("customPromptSelect")), h("select", {
				value: selectedTaskId,
				onChange: (event) => setSelectedTaskId(event.target.value)
			}, ...taskProfiles.map((profile) => h("option", {
				key: profile.taskId,
				value: profile.taskId
			}, profile.label)))) : null, selectedProfile === void 0 ? null : h(PromptProfile, {
				key: selectedProfile.id,
				profile: selectedProfile,
				reduced,
				t
			}))))));
		}
		function HarnessIdentitySetting({ setting, canWrite, saving, reduced, onSave, onReset, t }) {
			const [editing, setEditing] = (0, react.useState)(false);
			const [draft, setDraft] = (0, react.useState)(setting?.value ?? "");
			const value = setting?.value ?? "";
			const maximum = setting?.maxCharacters ?? 4e3;
			const normalized = draft.trim();
			const characters = [...normalized].length;
			const invalid = normalized.length === 0 ? t("identityRequired") : characters > maximum ? t("identityTooLong") : "";
			const changed = normalized !== value;
			(0, react.useEffect)(() => {
				if (!editing) setDraft(value);
			}, [editing, value]);
			const cancel = () => {
				setDraft(value);
				setEditing(false);
			};
			const save = async (event) => {
				event.preventDefault();
				if (!canWrite || saving || invalid.length > 0 || !changed) return;
				if (await onSave(normalized)) setEditing(false);
			};
			const reset = async () => {
				if (!canWrite || saving) return;
				if (await onReset()) setEditing(false);
			};
			return h("section", {
				className: css.identityPanel,
				"aria-labelledby": "rp-prompts-identity-title"
			}, h("header", { className: css.identityHeader }, h("div", { className: css.identityTitle }, h("div", null, h("h4", { id: "rp-prompts-identity-title" }, t("identityTitle")), h("code", null, setting?.sectionName ?? "harness:identity")), h("span", { "data-customized": setting?.customized === true ? "true" : "false" }, t(setting?.customized === true ? "identityCustomized" : "identityDefault"))), editing ? null : h("button", {
				type: "button",
				className: css.identityEdit,
				disabled: !canWrite,
				onClick: () => setEditing(true)
			}, h(_deepseek_ai_dsh_client_ui_primitives.IconEditOutline16, {
				size: 14,
				"aria-hidden": true
			}), t("identityEdit"))), h("p", { className: css.identityDescription }, t("identityDescription")), h(AnimatePresence, {
				mode: "wait",
				initial: false
			}, editing ? h(m.form, {
				key: "identity-editor",
				className: css.identityEditor,
				onSubmit: (event) => {
					save(event);
				},
				initial: reduced ? false : {
					opacity: 0,
					y: 4
				},
				animate: {
					opacity: 1,
					y: 0
				},
				exit: reduced ? { opacity: 1 } : {
					opacity: 0,
					y: -4
				},
				transition: { duration: reduced ? 0 : .14 }
			}, h("label", { className: css.identityField }, h("span", null, t("identityField")), h("textarea", {
				value: draft,
				autoFocus: true,
				rows: 5,
				disabled: saving,
				"aria-invalid": invalid.length > 0,
				"aria-describedby": "rp-prompts-identity-help rp-prompts-identity-error",
				onChange: (event) => setDraft(event.target.value)
			})), h("div", { className: css.identityMeta }, h("span", { id: "rp-prompts-identity-help" }, t("identityHelper")), h("span", { "data-invalid": characters > maximum ? "true" : "false" }, `${characters} / ${maximum} ${t("identityCharacters")}`)), h("div", {
				id: "rp-prompts-identity-error",
				className: css.identityError,
				role: invalid.length > 0 ? "alert" : void 0
			}, invalid), h("div", { className: css.identityEditorActions }, setting?.customized === true ? h("button", {
				type: "button",
				className: css.identityReset,
				disabled: !canWrite || saving,
				onClick: () => {
					reset();
				}
			}, h(_deepseek_ai_dsh_client_ui_primitives.IconRefreshOutline16, {
				size: 14,
				"aria-hidden": true
			}), t("identityReset")) : h("span", null), h("span", null, h("button", {
				type: "button",
				className: css.identityCancel,
				disabled: saving,
				onClick: cancel
			}, t("identityCancel")), h("button", {
				type: "submit",
				className: css.identitySave,
				disabled: !canWrite || saving || invalid.length > 0 || !changed
			}, saving ? t("identitySaving") : t("identitySave"))))) : h(m.div, {
				key: "identity-preview",
				className: css.identityPreview,
				initial: reduced ? false : { opacity: 0 },
				animate: { opacity: 1 },
				exit: { opacity: 0 },
				transition: { duration: reduced ? 0 : .12 }
			}, h("pre", null, h("code", null, value)))));
		}
		function PromptProfile({ profile, reduced, t }) {
			const title = promptProfileTitle(profile, t);
			return h(AnimatePresence, {
				mode: "wait",
				initial: false
			}, h(m.div, {
				key: profile.id,
				className: css.promptProfile,
				initial: reduced ? false : {
					opacity: 0,
					x: 5
				},
				animate: {
					opacity: 1,
					x: 0
				},
				exit: reduced ? { opacity: 1 } : {
					opacity: 0,
					x: -5
				},
				transition: { duration: reduced ? 0 : .14 }
			}, h("header", { className: css.promptProfileHeader }, h("div", null, h("h4", null, title), profile.description === void 0 ? null : h("p", null, profile.description)), h("div", { className: css.promptRoute }, h("span", null, t("modelRoute")), h("strong", null, routeLabel(profile.route, t)))), h("ul", { className: css.promptNotes }, ...profile.notes.map((note) => h("li", { key: note }, promptNote(note, t)))), h("div", { className: css.promptOrderHeading }, t("promptOrder")), h("ol", { className: css.promptLayerList }, ...profile.layers.map((layer, index) => h(PromptLayer, {
				key: layer.id,
				layer,
				index,
				t
			})))));
		}
		function PromptLayer({ layer, index, t }) {
			const hasText = typeof layer.text === "string" && layer.text.length > 0;
			const tools = Array.isArray(layer.tools) ? layer.tools : [];
			return h("li", null, h("details", { className: css.promptLayer }, h("summary", null, h("span", { className: css.promptLayerIndex }, index + 1), h("span", { className: css.promptLayerTitle }, h("strong", null, promptLayerLabel(layer.id, t)), h("small", null, h("span", null, `${t("promptSource")}：${promptSourceLabel(layer.source, t)}`), layer.sectionName === void 0 ? null : h("code", null, layer.sectionName))), h("span", {
				className: css.promptRole,
				"data-role": layer.role
			}, t(`${layer.role}Role`)), h("span", { className: css.promptKind }, t(`${layer.contentKind}Prompt`)), h(_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutline14, {
				size: 12,
				"aria-hidden": true
			})), h("div", { className: css.promptLayerBody }, hasText ? h("pre", null, h("code", null, layer.text)) : layer.role === "tools" ? null : h("p", null, promptLayerPlaceholder(layer.contentKind, t)), tools.length > 0 ? h("div", { className: css.promptToolBlock }, h("span", null, t("promptTools")), h("div", { className: css.promptTools }, ...tools.map((tool) => h("code", { key: tool }, tool)))) : layer.role === "tools" ? h("p", { className: css.promptNoTools }, t("noTools")) : null)));
		}
		function promptProfileTitle(profile, t) {
			if (profile.kind === "parent-chat") return t("parentChatPrompt");
			if (profile.kind === "parent-agent") return t("parentAgentPrompt");
			if (profile.kind === "writer") return t("writerPrompt");
			return profile.label ?? t("customPrompt");
		}
		function routeLabel(route, t) {
			if (route?.kind === "session") return t("sessionModel");
			if (route?.kind === "fixed") return `${route.provider} / ${route.model}`;
			return t("inheritedModel");
		}
		function promptLayerLabel(id, t) {
			return t({
				"harness-identity": "promptLayerHarness",
				"harness-source": "promptLayerHarnessSource",
				"app-web-surface": "promptLayerWebSurface",
				"roleplay-rules": "promptLayerParentPersona",
				"runtime-contract": "promptLayerRuntime",
				"tool-guidance": "promptLayerToolGuidance",
				"conversation-input": "promptLayerConversation",
				"writer-ready": "promptLayerWriterReady",
				"tool-schema": "promptLayerToolSchema",
				"writer-persona": "promptLayerWriterPersona",
				"writer-slot-prompt": "promptLayerWriterSlots",
				"task-persona": "promptLayerTaskPersona",
				"task-call-prompt": "promptLayerTaskCall"
			}[id] ?? id);
		}
		function promptSourceLabel(source, t) {
			return t({
				"dsh-system-prompt": "sourceHarness",
				"dsh-app-boot": "sourceHarnessBoot",
				"dsh-web-app": "sourceHarnessWeb",
				"rp-standard": "sourceParent",
				"rp-core": "sourceRuntime",
				"visible tool plugins": "sourceTools",
				"Harness Session Log": "sourceConversation",
				"dsh-tools": "sourceTools",
				"rp-subagent-manager": "sourceSubagent"
			}[source] ?? "sourceHarness");
		}
		function promptLayerPlaceholder(kind, t) {
			if (kind === "external") return t("externalPromptBody");
			if (kind === "derived") return t("derivedPromptBody");
			return t("dynamicPromptBody");
		}
		function promptNote(note, t) {
			return t({
				"chat-direct-delivery": "noteChatRelay",
				"agent-editable-draft": "noteAgentRevision",
				"isolated-context": "noteFreshChild",
				"shared-rules-omitted": "notePersonaShadowed",
				"mode-workflow-omitted": "noteRuntimeSkipped",
				"no-tools": "noteNoTools",
				"explicit-task-input": "noteExplicitInput"
			}[note] ?? note);
		}
		function moveTabFocus(event, currentId, setActiveTab) {
			const current = TAB_IDS.indexOf(currentId);
			let next;
			if (event.key === "ArrowRight") next = (current + 1) % TAB_IDS.length;
			else if (event.key === "ArrowLeft") next = (current - 1 + TAB_IDS.length) % TAB_IDS.length;
			else if (event.key === "Home") next = 0;
			else if (event.key === "End") next = TAB_IDS.length - 1;
			else return;
			event.preventDefault();
			const id = TAB_IDS[next];
			setActiveTab(id);
			queueMicrotask(() => document.getElementById(`rp-settings-tab-${id}`)?.focus());
		}
		function sameSelection(left, right) {
			return Array.isArray(left) && left.length === right.length && left.every((value, index) => value === right[index]);
		}
		function VersionSummary({ status, t }) {
			return h("div", {
				className: css.versionSummary,
				"data-compatible": status.compatible ? "true" : "false"
			}, h("span", { className: css.versionState }, status.compatible ? t("compatible") : t("incompatible")), h("span", null, `${t("roleplayVersion")} ${status.roleplay.version}`), h("span", null, `${t("dshVersion")} ${status.dsh.version ?? "—"}`));
		}
		function CoreSummary({ status, t }) {
			return h("section", {
				className: css.core,
				"aria-labelledby": "rp-features-core"
			}, h("div", { className: css.coreIcon }, h(_deepseek_ai_dsh_client_ui_primitives.IconDataOutline16, {
				size: 18,
				"aria-hidden": true
			})), h("div", { className: css.coreCopy }, h("div", { className: css.coreTitle }, h("h3", { id: "rp-features-core" }, t("coreTitle")), h("span", null, h(_deepseek_ai_dsh_client_ui_primitives.IconCheckOutline16, { size: 13 }), t("alwaysEnabled"))), h("p", null, t("coreDescription")), h("details", { className: css.coreVersions }, h("summary", null, t("versionDetails"), h(_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutline14, {
				size: 12,
				"aria-hidden": true
			})), h("ul", null, ...status.core.map((item) => h("li", { key: item.label }, h("span", null, item.label), h("code", null, item.packageVersion ?? "—")))))));
		}
		function FeatureRow({ feature, checked, pending, disabled, status, reduced, onToggle, t }) {
			const requires = dependencyLabels(feature);
			const recommends = dependencyLabels(feature, "recommends");
			return h(m.li, {
				className: css.feature,
				layout: !reduced
			}, h("div", { className: css.featureCopy }, h("div", { className: css.featureTitle }, h("strong", null, feature.label), h("span", { "data-enabled": checked ? "true" : "false" }, pending ? t("enabling") : checked ? t("enabled") : t("disabled"))), h("p", null, feature.description), requires.length === 0 && recommends.length === 0 ? null : h("div", { className: css.dependencies }, requires.length === 0 ? null : h("span", null, `需要：${requires.join("、")}`), recommends.length === 0 ? null : h("span", null, `建议搭配：${recommends.join("、")}`)), h("code", { className: css.featureVersion }, `v${status?.packageVersion ?? "—"}`)), h(Switch, {
				checked,
				disabled,
				reduced,
				label: `${checked ? "停用" : "启用"}${feature.label}`,
				onClick: onToggle
			}));
		}
		function SkillRow({ skill, subagentsEnabled, pending, disabled, reduced, onToggle, t }) {
			const selected = skill.selected === true;
			const status = pending ? t("enabling") : !skill.featureEnabled ? selected ? t("waitingForPlugin") : t("pluginDisabled") : selected ? t("enabled") : t("disabled");
			const visibility = !skill.featureEnabled ? t("invisiblePlugin") : !selected ? t("invisibleSkill") : `${t("visibleParent")}${subagentsEnabled ? t("visibleSubagents") : t("subagentsUnavailable")}。`;
			return h(m.li, {
				className: css.skill,
				layout: !reduced,
				"data-available": skill.featureEnabled ? "true" : "false"
			}, h("div", { className: css.skillMark }, h(_deepseek_ai_dsh_client_ui_primitives.IconSkillOutline16, {
				size: 16,
				"aria-hidden": true
			})), h("div", { className: css.skillCopy }, h("div", { className: css.featureTitle }, h("strong", null, skill.label), h("span", { "data-enabled": skill.enabled ? "true" : "false" }, status)), h("p", null, skill.description), h("div", { className: css.skillMeta }, h("span", null, `${t("sourcePlugin")}：${skill.featureLabel}`), h("code", null, skill.id)), h("p", { className: css.skillVisibility }, visibility)), h(Switch, {
				checked: selected,
				disabled,
				reduced,
				label: `${selected ? "停用" : "启用"}${skill.label} Skill`,
				onClick: onToggle
			}));
		}
		function Switch({ checked, disabled, reduced, label, onClick }) {
			return h("button", {
				type: "button",
				className: css.switch,
				role: "switch",
				"aria-checked": checked,
				"aria-label": label,
				disabled,
				onClick
			}, h(m.span, {
				animate: { x: checked ? 18 : 2 },
				transition: reduced ? { duration: 0 } : {
					type: "spring",
					stiffness: 560,
					damping: 38,
					mass: .6
				}
			}));
		}
		//#endregion
		exports.RoleplaySettingsSection = RoleplaySettingsSection;
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
