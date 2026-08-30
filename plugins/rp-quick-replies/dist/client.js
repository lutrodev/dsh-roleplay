window.__ModuleLoader__.load({
	id: "dsh-roleplay-rp-quick-replies",
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
		//#region ../../node_modules/.pnpm/motion@12.43.0_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/motion/dist/es/react.mjs
		const m = m$1;
		//#endregion
		//#region ../../packages/rp-ui/src/session-summary.js
		/**
		* Read the Roleplay identity from the public DSH SessionSummary contract.
		* Projection-backed summary fields live under projectionValues in DSH 0.1.2.
		*/
		function isRoleplaySessionSummary(summary) {
			return summary?.projectionValues?.agentPreset === "roleplay";
		}
		//#endregion
		//#region src/protocol.js
		const QUICK_REPLIES_RPC_PATH = "/rp-quick-replies";
		const MAX_QUICK_REPLY_CONTENT_CHARACTERS = 2e3;
		const MAX_QUICK_REPLY_TOTAL_CHARACTERS = 8e3;
		const QUICK_REPLY_CURSOR_POSITION_MIDDLE = "middle";
		Object.freeze([
			Object.freeze({
				id: "double-quote",
				label: "“”",
				content: "“”",
				cursorPosition: QUICK_REPLY_CURSOR_POSITION_MIDDLE
			}),
			Object.freeze({
				id: "parentheses",
				label: "（）",
				content: "（）",
				cursorPosition: QUICK_REPLY_CURSOR_POSITION_MIDDLE
			}),
			Object.freeze({
				id: "continue",
				label: "继续",
				content: "继续",
				cursorPosition: "end"
			})
		]);
		const PAIRS = /* @__PURE__ */ new Map([
			["\"\"", ["\"", "\""]],
			["''", ["'", "'"]],
			["“”", ["“", "”"]],
			["‘’", ["‘", "’"]],
			["()", ["(", ")"]],
			["（）", ["（", "）"]],
			["[]", ["[", "]"]],
			["【】", ["【", "】"]],
			["{}", ["{", "}"]]
		]);
		/** Validate and detach the complete global quick-reply list. */
		function normalizeQuickReplies(value) {
			if (!Array.isArray(value)) throw coded("INVALID_REQUEST", "Quick replies must be an array.");
			if (value.length > 12) throw coded("LIMIT_EXCEEDED", `At most 12 quick replies can be stored.`);
			const ids = /* @__PURE__ */ new Set();
			const labels = /* @__PURE__ */ new Set();
			let totalCharacters = 0;
			const replies = value.map((item, index) => {
				if (!record(item)) throw coded("INVALID_REQUEST", `Quick reply ${index + 1} must be an object.`);
				const id = text(item.id)?.trim();
				const label = text(item.label)?.trim();
				const content = text(item.content)?.replace(/\r\n?/g, "\n");
				if (id === void 0 || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(id)) throw coded("INVALID_REQUEST", `Quick reply ${index + 1} has an invalid id.`);
				if (ids.has(id)) throw coded("DUPLICATE_REPLY", "Quick reply ids must be unique.");
				ids.add(id);
				if (label === void 0 || label.length === 0) throw coded("INVALID_REQUEST", `Quick reply ${index + 1} needs a label.`);
				if (characters(label) > 12) throw coded("LIMIT_EXCEEDED", `Quick reply labels cannot exceed 12 characters.`);
				const normalizedLabel = label.toLocaleLowerCase();
				if (labels.has(normalizedLabel)) throw coded("DUPLICATE_LABEL", "Quick reply labels must be unique.");
				labels.add(normalizedLabel);
				if (content === void 0 || content.trim().length === 0) throw coded("INVALID_REQUEST", `Quick reply ${index + 1} needs content.`);
				const contentCharacters = characters(content);
				if (contentCharacters > 2e3) throw coded("LIMIT_EXCEEDED", `Quick reply content cannot exceed ${MAX_QUICK_REPLY_CONTENT_CHARACTERS} characters.`);
				const cursorPosition = item.cursorPosition === void 0 ? legacyCursorPosition(content) : text(item.cursorPosition);
				if (cursorPosition !== "middle" && cursorPosition !== "end") throw coded("INVALID_REQUEST", `Quick reply ${index + 1} has an invalid cursor position.`);
				totalCharacters += contentCharacters;
				return {
					id,
					label,
					content,
					cursorPosition
				};
			});
			if (totalCharacters > 8e3) throw coded("LIMIT_EXCEEDED", `Quick replies cannot exceed ${MAX_QUICK_REPLY_TOTAL_CHARACTERS} total characters.`);
			return replies;
		}
		/** Build the ordered editor edits that insert one reply and leave a collapsed caret at the requested position. */
		function planQuickReplyEdits(content, selection, cursorPosition) {
			const insertion = typeof content === "string" ? content : "";
			const start = nonNegativeCoordinate(selection?.start);
			const end = Math.max(start, nonNegativeCoordinate(selection?.end));
			if ((cursorPosition === void 0 ? legacyCursorPosition(insertion) : cursorPosition) === "end") return [{
				start,
				end,
				text: insertion
			}];
			const pair = PAIRS.get(insertion);
			if (pair !== void 0 && start < end) {
				const [open, close] = pair;
				return [{
					start: end,
					end,
					text: close
				}, {
					start,
					end: start,
					text: open
				}];
			}
			const middle = pair?.[0].length ?? middleOffset(insertion);
			return [{
				start,
				end,
				text: insertion
			}, {
				start: start + middle,
				end: start + middle,
				text: ""
			}];
		}
		/** Insert one reply at the current plain-text selection and return its requested caret placement. */
		function insertQuickReply(draft, content, selection, cursorPosition) {
			const source = typeof draft === "string" ? draft : "";
			const start = coordinate(selection?.start, source.length);
			const edits = planQuickReplyEdits(content, {
				start,
				end: Math.max(start, coordinate(selection?.end, source.length))
			}, cursorPosition);
			let text = source;
			let caret = start;
			for (const edit of edits) {
				text = `${text.slice(0, edit.start)}${edit.text}${text.slice(edit.end)}`;
				caret = edit.start + edit.text.length;
			}
			return {
				text,
				selection: {
					start: caret,
					end: caret
				}
			};
		}
		function legacyCursorPosition(content) {
			return PAIRS.has(content) ? QUICK_REPLY_CURSOR_POSITION_MIDDLE : "end";
		}
		function middleOffset(value) {
			const characters = [...value];
			return characters.slice(0, Math.floor(characters.length / 2)).join("").length;
		}
		function coordinate(value, maximum) {
			if (!Number.isSafeInteger(value)) return maximum;
			return Math.min(Math.max(value, 0), maximum);
		}
		function nonNegativeCoordinate(value) {
			return Number.isSafeInteger(value) ? Math.max(value, 0) : 0;
		}
		function characters(value) {
			return [...value].length;
		}
		function text(value) {
			return typeof value === "string" ? value : void 0;
		}
		function record(value) {
			return typeof value === "object" && value !== null && !Array.isArray(value);
		}
		function coded(code, message) {
			return Object.assign(new Error(message), { code });
		}
		//#endregion
		//#region src/client-store.js
		const DEFAULT_QUICK_REPLY_LIMITS = Object.freeze({
			replies: 12,
			labelCharacters: 12,
			contentCharacters: MAX_QUICK_REPLY_CONTENT_CHARACTERS,
			totalCharacters: MAX_QUICK_REPLY_TOTAL_CHARACTERS
		});
		/** Shared browser store used by the composer and the Roleplay settings surface. */
		function createQuickReplyStore(connection) {
			let snapshot = Object.freeze({
				phase: "idle",
				replies: [],
				writable: false,
				revision: null,
				limits: DEFAULT_QUICK_REPLY_LIMITS,
				error: null
			});
			let request = null;
			const listeners = /* @__PURE__ */ new Set();
			const publish = (next) => {
				snapshot = Object.freeze(next);
				for (const listener of listeners) listener();
			};
			const adopt = (value) => ({
				phase: "ready",
				replies: normalizeQuickReplies(value.replies),
				writable: value.writable === true,
				revision: Number.isSafeInteger(value.revision) ? value.revision : null,
				limits: {
					...DEFAULT_QUICK_REPLY_LIMITS,
					...value.limits ?? {}
				},
				error: null
			});
			const load = async () => {
				if (request !== null) return request;
				publish({
					...snapshot,
					phase: "loading",
					error: null
				});
				request = quickReplyRequest(connection, "list").then((value) => {
					publish(adopt(value));
					return snapshot;
				}).catch((error) => {
					publish({
						...snapshot,
						phase: "error",
						replies: [],
						error: friendlyQuickReplyRequestError(error, "load")
					});
					throw error;
				}).finally(() => {
					request = null;
				});
				return request;
			};
			const replace = async (replies) => {
				if (!Number.isSafeInteger(snapshot.revision)) throw Object.assign(/* @__PURE__ */ new Error("快捷回复设置暂时不能保存。"), { code: "SETTINGS_UNAVAILABLE" });
				const previous = snapshot;
				publish({
					...snapshot,
					phase: "saving",
					error: null
				});
				try {
					const value = await quickReplyRequest(connection, "replace", {
						replies,
						expectedRevision: previous.revision
					});
					publish(adopt(value));
					return snapshot;
				} catch (error) {
					publish({
						...previous,
						phase: "ready",
						error: null
					});
					throw error;
				}
			};
			return {
				subscribe(listener) {
					listeners.add(listener);
					return () => listeners.delete(listener);
				},
				getSnapshot() {
					return snapshot;
				},
				load,
				replace
			};
		}
		function friendlyQuickReplyRequestError(error, intent) {
			if (error?.code === "REVISION_CONFLICT") return "快捷回复刚刚在其他页面更新。请关闭设置界面，重新打开后再修改。";
			if (error?.code === "SETTINGS_UNAVAILABLE") return "当前环境不能保存快捷回复设置。";
			if (intent === "save") return error instanceof Error && error.message ? error.message : "快捷回复没有保存，请稍后重试。";
			return "暂时无法读取快捷回复，请稍后重试。";
		}
		async function quickReplyRequest(connection, endpoint, payload = {}) {
			const response = await connection.call(QUICK_REPLIES_RPC_PATH, endpoint, payload);
			const domain = response?.ok === true && response.value?.ok !== void 0 ? response.value : response;
			if (domain?.ok !== true) throw Object.assign(new Error(domain?.error?.message ?? "快捷回复请求失败"), { code: domain?.error?.code });
			return domain.value;
		}
		//#endregion
		//#region src/client-styles.generated.js
		const css = {
			"compactOnly": "rp-quick-replies-compactOnly",
			"control": "rp-quick-replies-control",
			"menu": "rp-quick-replies-menu",
			"menuCopy": "rp-quick-replies-menuCopy",
			"menuTrigger": "rp-quick-replies-menuTrigger",
			"quickButton": "rp-quick-replies-quickButton"
		};
		const STYLE_ID = "dsh-roleplay-rp-quick-replies-styles";
		const STYLE_OWNER = "dsh-roleplay-rp-quick-replies";
		const STYLE_TEXT = ".rp-quick-replies-control {\n  display: flex;\n  min-width: 0;\n  align-items: center;\n  gap: 4px;\n  font-family: var(--dsw-font-family);\n}\n\n.rp-quick-replies-quickButton,\n.rp-quick-replies-menuTrigger {\n  display: inline-flex;\n  height: 28px;\n  flex: none;\n  align-items: center;\n  justify-content: center;\n  box-sizing: border-box;\n  border: 0;\n  border-radius: 8px;\n  background: transparent;\n  color: var(--dsw-alias-label-secondary);\n  cursor: pointer;\n  font: 500 13px/20px var(--dsw-font-family);\n}\n\n.rp-quick-replies-quickButton {\n  min-width: 28px;\n  max-width: 80px;\n  padding: 0 8px;\n}\n\n.rp-quick-replies-quickButton > span {\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.rp-quick-replies-menuTrigger {\n  width: 28px;\n  padding: 0;\n}\n\n.rp-quick-replies-compactOnly {\n  display: none;\n}\n\n.rp-quick-replies-quickButton:hover:not(:disabled),\n.rp-quick-replies-menuTrigger:hover:not(:disabled) {\n  background: var(--dsw-alias-interactive-bg-hover);\n  color: var(--dsw-alias-label-primary);\n}\n\n.rp-quick-replies-quickButton:focus-visible,\n.rp-quick-replies-menuTrigger:focus-visible {\n  outline: 2px solid var(--dsw-alias-state-business-primary);\n  outline-offset: 2px;\n}\n\n.rp-quick-replies-quickButton:disabled,\n.rp-quick-replies-menuTrigger:disabled {\n  cursor: default;\n  opacity: .45;\n}\n\n.rp-quick-replies-menu {\n  --dsh-scrollbar-thumb: var(--dsw-alias-scrollbar-bg-l2);\n  --dsh-scrollbar-thumb-hover: var(--dsw-alias-scrollbar-hover-l2);\n}\n\n.rp-quick-replies-menuCopy {\n  display: flex;\n  min-width: 0;\n  max-width: min(220px, 60vw);\n  flex-direction: column;\n  align-items: flex-start;\n  gap: 1px;\n}\n\n.rp-quick-replies-menuCopy strong,\n.rp-quick-replies-menuCopy small {\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.rp-quick-replies-menuCopy strong {\n  color: var(--dsw-alias-label-primary);\n  font-weight: 600;\n}\n\n.rp-quick-replies-menuCopy small {\n  max-width: 100%;\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 11px;\n}\n\n@container (max-width: 560px) {\n  .rp-quick-replies-quickButton {\n    display: none;\n  }\n\n  .rp-quick-replies-menuTrigger.rp-quick-replies-compactOnly {\n    display: inline-flex;\n  }\n}\n";
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
			"rpRemote",
			"sessions",
			"conversation"
		];
		const h = react.default.createElement;
		function apply(ctx) {
			ctx.effect(ensureStyles);
			const store = createQuickReplyStore(ctx.rpRemote);
			const applyTextEdits = createScopedTextEditor(ctx.sessions, ctx.conversation);
			ctx.slots.inject("conversation.input.right", () => ctx.slots.register({
				name: "conversation.input.right",
				id: "rp-quick-replies",
				order: 70,
				inject: () => ({
					store,
					applyTextEdits
				})
			}, QuickReplyControl));
		}
		function QuickReplyControl(props) {
			const { input, inputActions, sessionId, useSession, useSessions, store, applyTextEdits } = props;
			const roleplay = useSessions((state) => {
				const summary = state.byId?.[sessionId];
				return isRoleplaySessionSummary(summary) && summary.origin !== "subagent";
			});
			const removed = useSession((state) => state.removed === true);
			const state = (0, react.useSyncExternalStore)(store.subscribe, store.getSnapshot);
			const controlRef = (0, react.useRef)(null);
			const selectionRef = (0, react.useRef)(null);
			const [menuOpen, setMenuOpen] = (0, react.useState)(false);
			const busy = removed || input.phase === "adjudicating" || input.phase === "submitting";
			(0, react.useEffect)(() => {
				if (!roleplay || state.phase !== "idle") return;
				store.load().catch(() => {});
			}, [
				roleplay,
				state.phase,
				store
			]);
			if (!roleplay) return null;
			const ready = state.phase === "ready" || state.phase === "saving";
			const inlineReplies = ready ? state.replies.slice(0, 3) : [];
			const selectReply = (reply, target) => {
				if (busy) return;
				applyReplyToComposer(inputActions, input.draft, reply.content, target, reply.cursorPosition, {
					applyTextEdits,
					inputState: input,
					selection: selectionRef.current,
					sessionId
				});
				selectionRef.current = null;
				setMenuOpen(false);
			};
			const menuItems = ready ? state.replies.map((reply) => ({
				id: `reply:${reply.id}`,
				label: renderMenuReply(reply),
				disabled: busy
			})) : state.phase === "error" ? [{
				id: "load-error",
				label: "快捷回复暂时无法读取",
				disabled: true
			}] : [{
				id: "loading",
				label: "正在读取快捷回复…",
				disabled: true
			}];
			const menuFooter = state.phase === "error" ? [{
				id: "retry",
				label: "重新加载",
				icon: h(_deepseek_ai_dsh_client_ui_primitives.IconRefreshOutline14, { size: 14 })
			}] : [];
			const onMenuSelect = (id) => {
				if (id === "retry") {
					setMenuOpen(false);
					store.load().catch(() => {});
					return;
				}
				const reply = state.replies.find((item) => `reply:${item.id}` === id);
				if (reply !== void 0) selectReply(reply, controlRef.current);
			};
			const menuVisibleOnWideScreens = ready && state.replies.length > 3;
			const hasMenu = state.phase === "error" || ready && state.replies.length > 0;
			const triggerLabel = state.phase === "error" ? "重新加载快捷回复" : "更多快捷回复";
			const triggerClass = menuVisibleOnWideScreens || state.phase === "error" ? css.menuTrigger : `${css.menuTrigger} ${css.compactOnly}`;
			const trigger = h(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
				key: "quick-reply-menu-trigger",
				label: triggerLabel,
				side: "top",
				delayMs: 500
			}, h(m.button, {
				key: "quick-reply-menu-trigger-button",
				type: "button",
				className: triggerClass,
				"aria-label": triggerLabel,
				"aria-haspopup": "menu",
				"aria-expanded": menuOpen,
				disabled: removed,
				whileTap: { scale: .94 },
				onMouseDown: (event) => keepComposerFocus(event, input, selectionRef),
				onClick: () => setMenuOpen((open) => !open)
			}, h(_deepseek_ai_dsh_client_ui_primitives.IconEllipsisOutline16, { size: 16 })));
			return h(MotionConfig, { reducedMotion: "user" }, h(LazyMotion, {
				features: domAnimation,
				strict: true
			}, h("div", {
				ref: controlRef,
				className: css.control,
				"data-rp-quick-replies": true
			}, ...inlineReplies.map((reply) => h(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
				key: reply.id,
				label: `插入快捷回复：${reply.label}`,
				side: "top",
				delayMs: 500
			}, h(m.button, {
				key: `quick-reply-button:${reply.id}`,
				type: "button",
				className: css.quickButton,
				disabled: busy,
				"aria-label": `插入快捷回复：${reply.label}`,
				whileHover: { y: -1 },
				whileTap: { scale: .96 },
				onMouseDown: (event) => keepComposerFocus(event, input, selectionRef),
				onClick: (event) => selectReply(reply, event.currentTarget)
			}, h("span", null, reply.label)))), hasMenu ? h(_deepseek_ai_dsh_client_ui_primitives.Menu, {
				key: "quick-reply-menu",
				open: menuOpen,
				anchor: trigger,
				items: menuItems,
				footer: menuFooter,
				onSelect: onMenuSelect,
				onClose: () => setMenuOpen(false),
				align: "end",
				side: "top",
				portal: true,
				compact: true,
				className: css.menu
			}) : null)));
		}
		function renderMenuReply(reply) {
			const label = reply.label.replace(/\s+/g, " ").trim();
			const content = reply.content.replace(/\s+/g, " ").trim();
			const hasPreview = content !== label;
			return h("span", {
				className: css.menuCopy,
				"data-has-preview": hasPreview ? "true" : "false"
			}, h("strong", null, reply.label), hasPreview ? h("small", null, content) : null);
		}
		function applyReplyToComposer(inputActions, draft, content, target, cursorPosition, options = {}) {
			const inputState = options.inputState ?? {
				draft,
				draftRev: 0,
				occurrences: []
			};
			let selection = options.selection ?? captureComposerSelection(target, inputState);
			if (selection.kind === "detect" && selection.draftRev !== inputState.draftRev) {
				const end = detectLength(inputState);
				selection = {
					kind: "detect",
					start: end,
					end,
					draftRev: inputState.draftRev
				};
			}
			const next = insertQuickReply(draft, content, selection.kind === "detect" ? {
				start: detectToClipboardOffset(selection.start, inputState.occurrences),
				end: detectToClipboardOffset(selection.end, inputState.occurrences)
			} : {
				start: selection.start,
				end: selection.end
			}, cursorPosition);
			if (selection.kind === "detect" && typeof options.applyTextEdits === "function") {
				const edits = planQuickReplyEdits(content, selection, cursorPosition);
				if (options.applyTextEdits(options.sessionId, edits, selection.draftRev, next) === true) return next;
			}
			inputActions.setDraft(next.text);
			const textarea = findComposerTextarea(target);
			if (textarea !== null) requestAnimationFrame(() => {
				textarea.focus({ preventScroll: true });
				textarea.setSelectionRange(next.selection.start, next.selection.end);
			});
			return next;
		}
		/** Apply an ordered edit plan through the scoped public input event, preserving Lexical nodes around the span. */
		function createScopedTextEditor(sessions, conversation) {
			return (sessionId, edits, expectedRevision, fallback) => {
				const actx = sessions.scope(sessionId);
				if (actx === void 0) return false;
				const input = conversation.input.for(actx);
				let applied = 0;
				for (const edit of edits) {
					const state = input.state.getSnapshot();
					if (applied === 0 && state.draftRev !== expectedRevision) return false;
					if (!(actx.bail(actx, "slash/input-insert-text", {
						text: edit.text,
						span: {
							start: edit.start,
							end: edit.end,
							draftRev: state.draftRev
						}
					}) === true)) {
						if (applied === 0) return false;
						input.setDraft(fallback.text);
						const recovered = input.state.getSnapshot();
						actx.bail(actx, "slash/input-insert-text", {
							text: "",
							span: {
								start: fallback.selection.start,
								end: fallback.selection.start,
								draftRev: recovered.draftRev
							}
						});
						return true;
					}
					applied += 1;
				}
				return true;
			};
		}
		/** Capture the native composer selection in the Lexical detect-coordinate plane. */
		function captureComposerSelection(target, inputState) {
			const end = detectLength(inputState);
			const textarea = findComposerTextarea(target);
			if (textarea !== null) return {
				kind: "clipboard",
				start: textarea.selectionStart ?? inputState.draft.length,
				end: textarea.selectionEnd ?? inputState.draft.length
			};
			const editor = findComposerEditor(target);
			const nativeSelection = document.getSelection();
			if (editor === null || nativeSelection === null || nativeSelection.anchorNode === null || nativeSelection.focusNode === null || !editor.contains(nativeSelection.anchorNode) || !editor.contains(nativeSelection.focusNode)) return {
				kind: "detect",
				start: end,
				end,
				draftRev: inputState.draftRev
			};
			const anchor = detectOffsetOfDomPoint(editor, nativeSelection.anchorNode, nativeSelection.anchorOffset, end);
			const focus = detectOffsetOfDomPoint(editor, nativeSelection.focusNode, nativeSelection.focusOffset, end);
			return {
				kind: "detect",
				start: Math.min(anchor, focus),
				end: Math.max(anchor, focus),
				draftRev: inputState.draftRev
			};
		}
		function findComposerTextarea(target) {
			if (!(target instanceof Element)) return null;
			const textarea = target.closest("[data-composer-card]")?.querySelector("textarea");
			return textarea instanceof HTMLTextAreaElement ? textarea : null;
		}
		function findComposerEditor(target) {
			if (!(target instanceof Element)) return null;
			const editor = target.closest("[data-composer-card]")?.querySelector("[data-composer-input][contenteditable=\"true\"]");
			return editor instanceof HTMLElement ? editor : null;
		}
		function keepComposerFocus(event, inputState, selectionRef) {
			event.preventDefault();
			const textarea = findComposerTextarea(event.currentTarget);
			if (textarea !== null && document.activeElement !== textarea && textarea.selectionStart === 0 && textarea.selectionEnd === 0 && inputState.draft.length > 0) textarea.setSelectionRange(inputState.draft.length, inputState.draft.length);
			selectionRef.current = captureComposerSelection(event.currentTarget, inputState);
		}
		function detectLength(inputState) {
			const draft = typeof inputState?.draft === "string" ? inputState.draft : "";
			const occurrences = Array.isArray(inputState?.occurrences) ? inputState.occurrences : [];
			return Math.max(0, draft.length - occurrences.reduce((total, occurrence) => total + Math.max(0, safeLength(occurrence?.length) - 1), 0));
		}
		function detectToClipboardOffset(offset, occurrences) {
			let expansion = 0;
			for (const occurrence of Array.isArray(occurrences) ? occurrences : []) {
				const length = safeLength(occurrence?.length);
				if (offset <= safeLength(occurrence?.offset) - expansion) break;
				expansion += Math.max(0, length - 1);
			}
			return offset + expansion;
		}
		function detectOffsetOfDomPoint(editor, node, offset, expectedLength) {
			try {
				const range = document.createRange();
				range.setStart(editor, 0);
				range.setEnd(node, offset);
				const complete = domMetrics(editor);
				const actualBreaks = Math.min(complete.breaks, Math.max(0, expectedLength - complete.base));
				const partial = domMetrics(range.cloneContents());
				let result = partial.base + Math.min(partial.breaks, actualBreaks);
				if (node === editor && offset > 0 && offset < editor.childNodes.length) {
					const before = [...editor.childNodes].slice(0, offset).some((child) => child instanceof Element);
					const after = [...editor.childNodes].slice(offset).some((child) => child instanceof Element);
					if (before && after) result += 1;
				}
				return Math.min(Math.max(result, 0), expectedLength);
			} catch {
				return expectedLength;
			}
		}
		function domMetrics(root) {
			let base = 0;
			let breaks = 0;
			const topLevelElements = [...root.childNodes].filter((child) => child instanceof Element).length;
			base += Math.max(0, topLevelElements - 1);
			const visit = (node) => {
				if (node.nodeType === Node.TEXT_NODE) {
					base += node.textContent?.length ?? 0;
					return;
				}
				if (!(node instanceof Element)) return;
				if (node.matches("[data-composer-chip]")) {
					base += 1;
					return;
				}
				if (node.tagName === "BR") {
					breaks += 1;
					return;
				}
				for (const child of node.childNodes) visit(child);
			};
			for (const child of root.childNodes) visit(child);
			return {
				base,
				breaks
			};
		}
		function safeLength(value) {
			return Number.isSafeInteger(value) && value > 0 ? value : 0;
		}
		//#endregion
		exports.QuickReplyControl = QuickReplyControl;
		exports.apply = apply;
		exports.applyReplyToComposer = applyReplyToComposer;
		exports.captureComposerSelection = captureComposerSelection;
		exports.createQuickReplyStore = createQuickReplyStore;
		exports.createScopedTextEditor = createScopedTextEditor;
		exports.inject = inject;
		return module.exports;
	}
});
