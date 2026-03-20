import { o as on } from "./index-server.js";
import { Ct as run, E as escape_html, K as set, L as render_effect, M as get$1, T as clsx, _ as hasContext, a as derived, g as getContext, i as bind_props, l as spread_props, n as attr_style, o as ensure_array_like, q as state, r as attributes, s as props_id, t as attr_class, tt as snapshot, u as stringify, v as setContext, w as attr, xt as noop, yt as deferred } from "./server.js";
import { n as formatDate, t as formatCost } from "./format.js";
import { t as formatModelName } from "./pricing.js";
import { scaleBand, scaleLinear, scaleOrdinal, scaleSqrt, scaleTime } from "d3-scale";
import { InternSet, bisector, extent, max, min, quantile, range, sum } from "d3-array";
import { DateToken, Duration, Logger, PeriodType, clamp, format, get, greatestAbs, isLiteralObject, localPoint, merge, notNull, sortFunc, unique } from "@layerstack/utils";
import { cls } from "@layerstack/tailwind";
import { arc, area, areaRadial, curveLinearClosed, line, lineRadial, pie, pointRadial, stack, stackOffsetDiverging, stackOffsetExpand, stackOffsetNone } from "d3-shape";
import { interpolatePath } from "d3-interpolate-path";
import memoize from "memoize";
import { objectId } from "@layerstack/utils/object";
import { rgb } from "d3-color";
import { geoPath, geoTransform } from "d3-geo";
import { quadtree } from "d3-quadtree";
import { Delaunay } from "d3-delaunay";
import { geoVoronoi } from "d3-geo-voronoi";
import { path } from "d3-path";
import { interpolate, interpolateRound, quantize } from "d3-interpolate";
import { timeDay, timeHour, timeMillisecond, timeMinute, timeSecond, timeTicks, timeYear } from "d3-time";
import { schemeObservable10 } from "d3-scale-chromatic";
import "@dagrejs/dagre";
import "d3-tile";
import "d3-sankey";
//#region src/web/lib/components/dashboard/ActivityHeatmap.svelte
function ActivityHeatmap($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { data = {} } = $$props;
		let tooltip = {
			visible: false,
			text: "",
			x: 0,
			y: 0
		};
		const DAY_LABELS = [
			"",
			"Mon",
			"",
			"Wed",
			"",
			"Fri",
			""
		];
		const MONTH_NAMES = [
			"Jan",
			"Feb",
			"Mar",
			"Apr",
			"May",
			"Jun",
			"Jul",
			"Aug",
			"Sep",
			"Oct",
			"Nov",
			"Dec"
		];
		const weeks = derived(() => {
			const now = /* @__PURE__ */ new Date();
			const result = [];
			const endDay = new Date(now);
			const dayOfWeek = endDay.getDay();
			endDay.setDate(endDay.getDate() + (6 - dayOfWeek));
			const startDay = new Date(endDay);
			startDay.setDate(startDay.getDate() - 364 + 1);
			let current = new Date(startDay);
			let week = [];
			while (current <= endDay) {
				const dateStr = current.toISOString().slice(0, 10);
				const count = data[dateStr] ?? 0;
				let level = "";
				if (count >= 8) level = "l4";
				else if (count >= 5) level = "l3";
				else if (count >= 3) level = "l2";
				else if (count >= 1) level = "l1";
				week.push({
					date: dateStr,
					count,
					level
				});
				if (current.getDay() === 6) {
					result.push(week);
					week = [];
				}
				current.setDate(current.getDate() + 1);
			}
			if (week.length) result.push(week);
			return result;
		});
		const monthLabels = derived(() => {
			if (!weeks().length) return [];
			const labels = [];
			let lastMonth = -1;
			for (let i = 0; i < weeks().length; i++) {
				const firstCell = weeks()[i][0];
				if (!firstCell) continue;
				const month = new Date(firstCell.date).getMonth();
				if (month !== lastMonth) {
					labels.push({
						text: MONTH_NAMES[month],
						offset: i * 15
					});
					lastMonth = month;
				}
			}
			return labels;
		});
		$$renderer.push(`<div class="card"><div class="card-header"><span class="card-title">Activity</span> <span class="card-subtitle">Last 52 weeks</span></div> <div class="heatmap-wrapper svelte-1iczv"><div class="heatmap-outer svelte-1iczv"><div class="heatmap-day-labels svelte-1iczv"><!--[-->`);
		const each_array = ensure_array_like(DAY_LABELS);
		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let label = each_array[$$index];
			$$renderer.push(`<div class="heatmap-day-label svelte-1iczv">${escape_html(label)}</div>`);
		}
		$$renderer.push(`<!--]--></div> <div class="heatmap-columns-area svelte-1iczv"><div class="heatmap-month-labels svelte-1iczv"><!--[-->`);
		const each_array_1 = ensure_array_like(monthLabels());
		for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
			let ml = each_array_1[$$index_1];
			$$renderer.push(`<span class="heatmap-month-label svelte-1iczv"${attr_style(`position:absolute;left:${stringify(ml.offset)}px`)}>${escape_html(ml.text)}</span>`);
		}
		$$renderer.push(`<!--]--></div> <div class="heatmap-columns svelte-1iczv"><!--[-->`);
		const each_array_2 = ensure_array_like(weeks());
		for (let $$index_3 = 0, $$length = each_array_2.length; $$index_3 < $$length; $$index_3++) {
			let week = each_array_2[$$index_3];
			$$renderer.push(`<div class="heatmap-week svelte-1iczv"><!--[-->`);
			const each_array_3 = ensure_array_like(week);
			for (let $$index_2 = 0, $$length = each_array_3.length; $$index_2 < $$length; $$index_2++) {
				let cell = each_array_3[$$index_2];
				$$renderer.push(`<div${attr_class(`heatmap-cell ${stringify(cell.level)}`, "svelte-1iczv")}></div>`);
			}
			$$renderer.push(`<!--]--></div>`);
		}
		$$renderer.push(`<!--]--></div></div></div> <div class="heatmap-legend svelte-1iczv"><span>Less</span> <div class="heatmap-legend-cell svelte-1iczv" style="background:rgba(255,255,255,0.04)"></div> <div class="heatmap-legend-cell svelte-1iczv" style="background:rgba(249,115,22,0.2)"></div> <div class="heatmap-legend-cell svelte-1iczv" style="background:rgba(249,115,22,0.4)"></div> <div class="heatmap-legend-cell svelte-1iczv" style="background:rgba(249,115,22,0.6)"></div> <div class="heatmap-legend-cell svelte-1iczv" style="background:rgba(249,115,22,0.85)"></div> <span>More</span></div></div></div> `);
		if (tooltip.visible) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="heatmap-tooltip-el visible svelte-1iczv"${attr_style(`left:${stringify(tooltip.x)}px;top:${stringify(tooltip.y)}px`)}>${escape_html(tooltip.text)}</div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
//#region node_modules/layerchart/dist/utils/math.js
/**
* Convert degrees to radians
*/
function degreesToRadians(degrees) {
	return degrees * Math.PI / 180;
}
/**
* Convert radians to degrees
*/
function radiansToDegrees(radians) {
	return radians * (180 / Math.PI);
}
/**
* Convert cartesian to polar coordinate system.  Angle in radians with 0 at the 12 o'clock position
*/
function cartesianToPolar(x, y) {
	let radians = Math.atan2(y, x);
	radians += Math.PI / 2;
	if (radians < 0) radians += 2 * Math.PI;
	return {
		radius: Math.sqrt(x ** 2 + y ** 2),
		radians
	};
}
/**
* Calculate the angle and length between two points
* @param point1 - First point
* @param point2 - Second point
* @returns Angle in degrees and length
*/
function pointsToAngleAndLength(point1, point2) {
	const dx = point2.x - point1.x;
	const dy = point2.y - point1.y;
	const radians = Math.atan2(dy, dx);
	const length = Math.sqrt(dx * dx + dy * dy);
	return {
		radians,
		angle: radiansToDegrees(radians),
		length
	};
}
/** Parse percent string (`50%`) to decimal (`0.5`) */
function parsePercent(percent) {
	if (typeof percent === "number") return percent;
	else return Number(percent.replace("%", "")) / 100;
}
/** Add second value while maintaining `Date` or `number` type */
function add(value1, value2) {
	if (value1 instanceof Date) return new Date(value1.getTime() + value2);
	else return value1 + value2;
}
//#endregion
//#region node_modules/runed/dist/internal/configurable-globals.js
var defaultWindow = void 0;
//#endregion
//#region node_modules/runed/dist/internal/utils/dom.js
/**
* Handles getting the active element in a document or shadow root.
* If the active element is within a shadow root, it will traverse the shadow root
* to find the active element.
* If not, it will return the active element in the document.
*
* @param document A document or shadow root to get the active element from.
* @returns The active element in the document or shadow root.
*/
function getActiveElement(document) {
	let activeElement = document.activeElement;
	while (activeElement?.shadowRoot) {
		const node = activeElement.shadowRoot.activeElement;
		if (node === activeElement) break;
		else activeElement = node;
	}
	return activeElement;
}
globalThis.Date;
var SvelteSet = globalThis.Set;
globalThis.Map;
globalThis.URL;
globalThis.URLSearchParams;
var MediaQuery = class {
	current;
	/**
	* @param {string} query
	* @param {boolean} [matches]
	*/
	constructor(query, matches = false) {
		this.current = matches;
	}
};
/**
* @param {any} _
*/
function createSubscriber(_) {
	return () => {};
}
//#endregion
//#region node_modules/runed/dist/utilities/active-element/active-element.svelte.js
var ActiveElement = class {
	#document;
	#subscribe;
	constructor(options = {}) {
		const { window = defaultWindow, document = window?.document } = options;
		if (window === void 0) return;
		this.#document = document;
		this.#subscribe = createSubscriber((update) => {
			const cleanupFocusIn = on(window, "focusin", update);
			const cleanupFocusOut = on(window, "focusout", update);
			return () => {
				cleanupFocusIn();
				cleanupFocusOut();
			};
		});
	}
	get current() {
		this.#subscribe?.();
		if (!this.#document) return null;
		return getActiveElement(this.#document);
	}
};
new ActiveElement();
//#endregion
//#region node_modules/runed/dist/internal/utils/is.js
function isFunction(value) {
	return typeof value === "function";
}
//#endregion
//#region node_modules/runed/dist/utilities/extract/extract.svelte.js
function extract(value, defaultValue) {
	if (isFunction(value)) {
		const gotten = value();
		if (gotten === void 0) return defaultValue;
		return gotten;
	}
	if (value === void 0) return defaultValue;
	return value;
}
//#endregion
//#region node_modules/runed/dist/utilities/context/context.js
var Context = class {
	#name;
	#key;
	/**
	* @param name The name of the context.
	* This is used for generating the context key and error messages.
	*/
	constructor(name) {
		this.#name = name;
		this.#key = Symbol(name);
	}
	/**
	* The key used to get and set the context.
	*
	* It is not recommended to use this value directly.
	* Instead, use the methods provided by this class.
	*/
	get key() {
		return this.#key;
	}
	/**
	* Checks whether this has been set in the context of a parent component.
	*
	* Must be called during component initialisation.
	*/
	exists() {
		return hasContext(this.#key);
	}
	/**
	* Retrieves the context that belongs to the closest parent component.
	*
	* Must be called during component initialisation.
	*
	* @throws An error if the context does not exist.
	*/
	get() {
		const context = getContext(this.#key);
		if (context === void 0) throw new Error(`Context "${this.#name}" not found`);
		return context;
	}
	/**
	* Retrieves the context that belongs to the closest parent component,
	* or the given fallback value if the context does not exist.
	*
	* Must be called during component initialisation.
	*/
	getOr(fallback) {
		const context = getContext(this.#key);
		if (context === void 0) return fallback;
		return context;
	}
	/**
	* Associates the given value with the current component and returns it.
	*
	* Must be called during component initialisation.
	*/
	set(context) {
		return setContext(this.#key, context);
	}
};
//#endregion
//#region node_modules/runed/dist/utilities/use-debounce/use-debounce.svelte.js
function useDebounce(callback, wait) {
	let context = null;
	const wait$ = derived(() => extract(wait, 250));
	function debounced(...args) {
		if (context) {
			if (context.timeout) clearTimeout(context.timeout);
		} else {
			let resolve;
			let reject;
			context = {
				timeout: null,
				runner: null,
				promise: new Promise((res, rej) => {
					resolve = res;
					reject = rej;
				}),
				resolve,
				reject
			};
		}
		context.runner = async () => {
			if (!context) return;
			const ctx = context;
			context = null;
			try {
				ctx.resolve(await callback.apply(this, args));
			} catch (error) {
				ctx.reject(error);
			}
		};
		context.timeout = setTimeout(context.runner, wait$());
		return context.promise;
	}
	debounced.cancel = async () => {
		if (!context || context.timeout === null) {
			await new Promise((resolve) => setTimeout(resolve, 0));
			if (!context || context.timeout === null) return;
		}
		clearTimeout(context.timeout);
		context.reject("Cancelled");
		context = null;
	};
	debounced.runScheduledNow = async () => {
		if (!context || !context.timeout) {
			await new Promise((resolve) => setTimeout(resolve, 0));
			if (!context || !context.timeout) return;
		}
		clearTimeout(context.timeout);
		context.timeout = null;
		await context.runner?.();
	};
	Object.defineProperty(debounced, "pending", {
		enumerable: true,
		get() {
			return !!context?.timeout;
		}
	});
	return debounced;
}
//#endregion
//#region node_modules/runed/dist/utilities/watch/watch.svelte.js
function runEffect(flush, effect) {
	switch (flush) {
		case "post": break;
		case "pre": break;
	}
}
function runWatcher(sources, flush, effect, options = {}) {
	const { lazy = false } = options;
	let active = !lazy;
	let previousValues = Array.isArray(sources) ? [] : void 0;
	runEffect(flush, () => {
		const values = Array.isArray(sources) ? sources.map((source) => source()) : sources();
		if (!active) {
			active = true;
			previousValues = values;
			return;
		}
		const cleanup = run(() => effect(values, previousValues));
		previousValues = values;
		return cleanup;
	});
}
function runWatcherOnce(sources, flush, effect) {}
function watch(sources, effect, options) {
	runWatcher(sources, "post", effect, options);
}
function watchPre(sources, effect, options) {
	runWatcher(sources, "pre", effect, options);
}
watch.pre = watchPre;
function watchOnce(source, effect) {
	runWatcherOnce(source, "post", effect);
}
function watchOncePre(source, effect) {
	runWatcherOnce(source, "pre", effect);
}
watchOnce.pre = watchOncePre;
//#endregion
//#region node_modules/runed/dist/utilities/use-mutation-observer/use-mutation-observer.svelte.js
function useMutationObserver(target, callback, options = {}) {
	const { window = defaultWindow } = options;
	let observer;
	derived(() => {
		const value = extract(target);
		return new Set(value ? Array.isArray(value) ? value : [value] : []);
	});
	const stop = () => {};
	return {
		stop,
		takeRecords() {
			return observer?.takeRecords();
		}
	};
}
//#endregion
//#region node_modules/runed/dist/utilities/resource/resource.svelte.js
function debounce(fn, delay) {
	let timeoutId;
	let lastResolve = null;
	return (...args) => {
		return new Promise((resolve) => {
			if (lastResolve) lastResolve(void 0);
			lastResolve = resolve;
			clearTimeout(timeoutId);
			timeoutId = setTimeout(async () => {
				const result = await fn(...args);
				if (lastResolve) {
					lastResolve(result);
					lastResolve = null;
				}
			}, delay);
		});
	};
}
function throttle(fn, delay) {
	let lastRun = 0;
	let lastPromise = null;
	return (...args) => {
		const now = Date.now();
		if (lastRun && now - lastRun < delay) return lastPromise ?? Promise.resolve(void 0);
		lastRun = now;
		lastPromise = fn(...args);
		return lastPromise;
	};
}
function runResource(source, fetcher, options = {}, effectFn) {
	const { lazy = false, once = false, initialValue, debounce: debounceTime, throttle: throttleTime } = options;
	let current = initialValue;
	let loading = initialValue === void 0 && !lazy;
	let error = void 0;
	let cleanupFns = [];
	const runCleanup = () => {
		cleanupFns.forEach((fn) => fn());
		cleanupFns = [];
	};
	const onCleanup = (fn) => {
		cleanupFns = [...cleanupFns, fn];
	};
	const baseFetcher = async (value, previousValue, refetching = false) => {
		try {
			loading = true;
			error = void 0;
			runCleanup();
			const controller = new AbortController();
			onCleanup(() => controller.abort());
			const result = await fetcher(value, previousValue, {
				data: current,
				refetching,
				onCleanup,
				signal: controller.signal
			});
			current = result;
			return result;
		} catch (e) {
			if (!(e instanceof DOMException && e.name === "AbortError")) error = e;
			return;
		} finally {
			loading = false;
		}
	};
	const runFetcher = debounceTime ? debounce(baseFetcher, debounceTime) : throttleTime ? throttle(baseFetcher, throttleTime) : baseFetcher;
	const sources = Array.isArray(source) ? source : [source];
	let prevValues;
	effectFn((values, previousValues) => {
		if (once && prevValues) return;
		prevValues = values;
		runFetcher(Array.isArray(source) ? values : values[0], Array.isArray(source) ? previousValues : previousValues?.[0]);
	}, { lazy });
	return {
		get current() {
			return current;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
		mutate: (value) => {
			current = value;
		},
		refetch: (info) => {
			const values = sources.map((s) => s());
			return runFetcher(Array.isArray(source) ? values : values[0], Array.isArray(source) ? values : values[0], info ?? true);
		}
	};
}
function resource(source, fetcher, options) {
	return runResource(source, fetcher, options, (fn, options) => {
		const sources = Array.isArray(source) ? source : [source];
		const getters = () => sources.map((s) => s());
		watch(getters, (values, previousValues) => {
			fn(values, previousValues ?? []);
		}, options);
	});
}
function resourcePre(source, fetcher, options) {
	return runResource(source, fetcher, options, (fn, options) => {
		const sources = Array.isArray(source) ? source : [source];
		const getter = () => sources.map((s) => s());
		watch.pre(getter, (values, previousValues) => {
			fn(values, previousValues ?? []);
		}, options);
	});
}
resource.pre = resourcePre;
//#endregion
//#region node_modules/svelte/src/internal/client/timing.js
/** @import { Raf } from '#client' */
var now = () => Date.now();
/** @type {Raf} */
var raf = {
	tick: (_) => noop(_),
	now: () => now(),
	tasks: /* @__PURE__ */ new Set()
};
//#endregion
//#region node_modules/svelte/src/internal/client/loop.js
/** @import { TaskCallback, Task, TaskEntry } from '#client' */
/**
* @returns {void}
*/
function run_tasks() {
	const now = raf.now();
	raf.tasks.forEach((task) => {
		if (!task.c(now)) {
			raf.tasks.delete(task);
			task.f();
		}
	});
	if (raf.tasks.size !== 0) raf.tick(run_tasks);
}
/**
* Creates a new task that runs on each raf frame
* until it returns a falsy value or is aborted
* @param {TaskCallback} callback
* @returns {Task}
*/
function loop(callback) {
	/** @type {TaskEntry} */
	let task;
	if (raf.tasks.size === 0) raf.tick(run_tasks);
	return {
		promise: new Promise((fulfill) => {
			raf.tasks.add(task = {
				c: callback,
				f: fulfill
			});
		}),
		abort() {
			raf.tasks.delete(task);
		}
	};
}
//#endregion
//#region node_modules/svelte/src/motion/utils.js
/**
* @param {any} obj
* @returns {obj is Date}
*/
function is_date(obj) {
	return Object.prototype.toString.call(obj) === "[object Date]";
}
//#endregion
//#region node_modules/svelte/src/motion/spring.js
/**
* @template T
* @param {TickContext} ctx
* @param {T} last_value
* @param {T} current_value
* @param {T} target_value
* @returns {T}
*/
function tick_spring(ctx, last_value, current_value, target_value) {
	if (typeof current_value === "number" || is_date(current_value)) {
		const delta = target_value - current_value;
		const velocity = (current_value - last_value) / (ctx.dt || 1 / 60);
		const d = (velocity + (ctx.opts.stiffness * delta - ctx.opts.damping * velocity) * ctx.inv_mass) * ctx.dt;
		if (Math.abs(d) < ctx.opts.precision && Math.abs(delta) < ctx.opts.precision) return target_value;
		else {
			ctx.settled = false;
			return is_date(current_value) ? new Date(current_value.getTime() + d) : current_value + d;
		}
	} else if (Array.isArray(current_value)) return current_value.map((_, i) => tick_spring(ctx, last_value[i], current_value[i], target_value[i]));
	else if (typeof current_value === "object") {
		const next_value = {};
		for (const k in current_value) next_value[k] = tick_spring(ctx, last_value[k], current_value[k], target_value[k]);
		return next_value;
	} else throw new Error(`Cannot spring ${typeof current_value} values`);
}
/**
* A wrapper for a value that behaves in a spring-like fashion. Changes to `spring.target` will cause `spring.current` to
* move towards it over time, taking account of the `spring.stiffness` and `spring.damping` parameters.
*
* ```svelte
* <script>
* 	import { Spring } from 'svelte/motion';
*
* 	const spring = new Spring(0);
* <\/script>
*
* <input type="range" bind:value={spring.target} />
* <input type="range" bind:value={spring.current} disabled />
* ```
* @template T
* @since 5.8.0
*/
var Spring = class Spring {
	#stiffness = /* @__PURE__ */ state(.15);
	#damping = /* @__PURE__ */ state(.8);
	#precision = /* @__PURE__ */ state(.01);
	#current;
	#target;
	#last_value = void 0;
	#last_time = 0;
	#inverse_mass = 1;
	#momentum = 0;
	/** @type {import('../internal/client/types').Task | null} */
	#task = null;
	/** @type {ReturnType<typeof deferred> | null} */
	#deferred = null;
	/**
	* @param {T} value
	* @param {SpringOpts} [options]
	*/
	constructor(value, options = {}) {
		this.#current = /* @__PURE__ */ state(value);
		this.#target = /* @__PURE__ */ state(value);
		if (typeof options.stiffness === "number") this.#stiffness.v = clamp$1(options.stiffness, 0, 1);
		if (typeof options.damping === "number") this.#damping.v = clamp$1(options.damping, 0, 1);
		if (typeof options.precision === "number") this.#precision.v = options.precision;
	}
	/**
	* Create a spring whose value is bound to the return value of `fn`. This must be called
	* inside an effect root (for example, during component initialisation).
	*
	* ```svelte
	* <script>
	* 	import { Spring } from 'svelte/motion';
	*
	* 	let { number } = $props();
	*
	* 	const spring = Spring.of(() => number);
	* <\/script>
	* ```
	* @template U
	* @param {() => U} fn
	* @param {SpringOpts} [options]
	*/
	static of(fn, options) {
		const spring = new Spring(fn(), options);
		render_effect(() => {
			spring.set(fn());
		});
		return spring;
	}
	/** @param {T} value */
	#update(value) {
		set(this.#target, value);
		this.#current.v ??= value;
		this.#last_value ??= this.#current.v;
		if (!this.#task) {
			this.#last_time = raf.now();
			var inv_mass_recovery_rate = 1e3 / (this.#momentum * 60);
			this.#task ??= loop((now) => {
				this.#inverse_mass = Math.min(this.#inverse_mass + inv_mass_recovery_rate, 1);
				const elapsed = Math.min(now - this.#last_time, 1e3 / 30);
				/** @type {import('./private').TickContext} */
				const ctx = {
					inv_mass: this.#inverse_mass,
					opts: {
						stiffness: this.#stiffness.v,
						damping: this.#damping.v,
						precision: this.#precision.v
					},
					settled: true,
					dt: elapsed * 60 / 1e3
				};
				var next = tick_spring(ctx, this.#last_value, this.#current.v, this.#target.v);
				this.#last_value = this.#current.v;
				this.#last_time = now;
				set(this.#current, next);
				if (ctx.settled) this.#task = null;
				return !ctx.settled;
			});
		}
		return this.#task.promise;
	}
	/**
	* Sets `spring.target` to `value` and returns a `Promise` that resolves if and when `spring.current` catches up to it.
	*
	* If `options.instant` is `true`, `spring.current` immediately matches `spring.target`.
	*
	* If `options.preserveMomentum` is provided, the spring will continue on its current trajectory for
	* the specified number of milliseconds. This is useful for things like 'fling' gestures.
	*
	* @param {T} value
	* @param {SpringUpdateOpts} [options]
	*/
	set(value, options) {
		this.#deferred?.reject(/* @__PURE__ */ new Error("Aborted"));
		if (options?.instant || this.#current.v === void 0) {
			this.#task?.abort();
			this.#task = null;
			set(this.#current, set(this.#target, value));
			this.#last_value = value;
			return Promise.resolve();
		}
		if (options?.preserveMomentum) {
			this.#inverse_mass = 0;
			this.#momentum = options.preserveMomentum;
		}
		var d = this.#deferred = deferred();
		d.promise.catch(noop);
		this.#update(value).then(() => {
			if (d !== this.#deferred) return;
			d.resolve(void 0);
		});
		return d.promise;
	}
	get current() {
		return get$1(this.#current);
	}
	get damping() {
		return get$1(this.#damping);
	}
	set damping(v) {
		set(this.#damping, clamp$1(v, 0, 1));
	}
	get precision() {
		return get$1(this.#precision);
	}
	set precision(v) {
		set(this.#precision, v);
	}
	get stiffness() {
		return get$1(this.#stiffness);
	}
	set stiffness(v) {
		set(this.#stiffness, clamp$1(v, 0, 1));
	}
	get target() {
		return get$1(this.#target);
	}
	set target(v) {
		this.set(v);
	}
};
/**
* @param {number} n
* @param {number} min
* @param {number} max
*/
function clamp$1(n, min, max) {
	return Math.max(min, Math.min(max, n));
}
//#endregion
//#region node_modules/svelte/src/easing/index.js
/**
* @param {number} t
* @returns {number}
*/
function linear$1(t) {
	return t;
}
/**
* @param {number} t
* @returns {number}
*/
function cubicInOut(t) {
	return t < .5 ? 4 * t * t * t : .5 * Math.pow(2 * t - 2, 3) + 1;
}
/**
* @param {number} t
* @returns {number}
*/
function cubicIn(t) {
	return t * t * t;
}
if (typeof HTMLElement === "function") HTMLElement;
//#endregion
//#region node_modules/svelte/src/motion/tweened.js
/**
* @template T
* @param {T} a
* @param {T} b
* @returns {(t: number) => T}
*/
function get_interpolator(a, b) {
	if (a === b || a !== a) return () => a;
	const type = typeof a;
	if (type !== typeof b || Array.isArray(a) !== Array.isArray(b)) throw new Error("Cannot interpolate values of different type");
	if (Array.isArray(a)) {
		const arr = b.map((bi, i) => {
			return get_interpolator(
				/** @type {Array<any>} */
				a[i],
				bi
			);
		});
		return (t) => arr.map((fn) => fn(t));
	}
	if (type === "object") {
		if (!a || !b) throw new Error("Object cannot be null");
		if (is_date(a) && is_date(b)) {
			const an = a.getTime();
			const delta = b.getTime() - an;
			return (t) => new Date(an + t * delta);
		}
		const keys = Object.keys(b);
		/** @type {Record<string, (t: number) => T>} */
		const interpolators = {};
		keys.forEach((key) => {
			interpolators[key] = get_interpolator(a[key], b[key]);
		});
		return (t) => {
			/** @type {Record<string, any>} */
			const result = {};
			keys.forEach((key) => {
				result[key] = interpolators[key](t);
			});
			return result;
		};
	}
	if (type === "number") {
		const delta = b - a;
		return (t) => a + t * delta;
	}
	return () => b;
}
/**
* A wrapper for a value that tweens smoothly to its target value. Changes to `tween.target` will cause `tween.current` to
* move towards it over time, taking account of the `delay`, `duration` and `easing` options.
*
* ```svelte
* <script>
* 	import { Tween } from 'svelte/motion';
*
* 	const tween = new Tween(0);
* <\/script>
*
* <input type="range" bind:value={tween.target} />
* <input type="range" bind:value={tween.current} disabled />
* ```
* @template T
* @since 5.8.0
*/
var Tween = class Tween {
	#current;
	#target;
	/** @type {TweenedOptions<T>} */
	#defaults;
	/** @type {import('../internal/client/types').Task | null} */
	#task = null;
	/**
	* @param {T} value
	* @param {TweenedOptions<T>} options
	*/
	constructor(value, options = {}) {
		this.#current = /* @__PURE__ */ state(value);
		this.#target = /* @__PURE__ */ state(value);
		this.#defaults = options;
	}
	/**
	* Create a tween whose value is bound to the return value of `fn`. This must be called
	* inside an effect root (for example, during component initialisation).
	*
	* ```svelte
	* <script>
	* 	import { Tween } from 'svelte/motion';
	*
	* 	let { number } = $props();
	*
	* 	const tween = Tween.of(() => number);
	* <\/script>
	* ```
	* @template U
	* @param {() => U} fn
	* @param {TweenedOptions<U>} [options]
	*/
	static of(fn, options) {
		const tween = new Tween(fn(), options);
		render_effect(() => {
			tween.set(fn());
		});
		return tween;
	}
	/**
	* Sets `tween.target` to `value` and returns a `Promise` that resolves if and when `tween.current` catches up to it.
	*
	* If `options` are provided, they will override the tween's defaults.
	* @param {T} value
	* @param {TweenedOptions<T>} [options]
	* @returns
	*/
	set(value, options) {
		set(this.#target, value);
		let { delay = 0, duration = 400, easing = linear$1, interpolate = get_interpolator } = {
			...this.#defaults,
			...options
		};
		if (duration === 0) {
			this.#task?.abort();
			set(this.#current, value);
			return Promise.resolve();
		}
		const start = raf.now() + delay;
		/** @type {(t: number) => T} */
		let fn;
		let started = false;
		let previous_task = this.#task;
		this.#task = loop((now) => {
			if (now < start) return true;
			if (!started) {
				started = true;
				const prev = this.#current.v;
				fn = interpolate(prev, value);
				if (typeof duration === "function") duration = duration(prev, value);
				previous_task?.abort();
			}
			const elapsed = now - start;
			if (elapsed > duration) {
				set(this.#current, value);
				return false;
			}
			set(this.#current, fn(easing(elapsed / duration)));
			return true;
		});
		return this.#task.promise;
	}
	get current() {
		return get$1(this.#current);
	}
	get target() {
		return get$1(this.#target);
	}
	set target(v) {
		this.set(v);
	}
};
//#endregion
//#region node_modules/layerchart/dist/utils/motion.svelte.js
var MotionSpring = class extends Spring {
	type = "spring";
	constructor(value, options) {
		super(value, options);
	}
};
/**
* Extended Tween class that adds a type discriminator to help with
* type narrowing in our motion system
*/
var MotionTween = class extends Tween {
	type = "tween";
	constructor(value, options) {
		super(value, options);
	}
};
/**
* MotionNone is a state container that provides the same interface as
* Spring and Tween but without any animation logic. Values update immediately.
*
* This allows components to use a consistent API regardless of whether
* animations are enabled or not.
*/
var MotionNone = class {
	type = "none";
	#current = null;
	#target = null;
	constructor(value, _options = {}) {
		this.#current = value;
		this.#target = value;
	}
	/**
	* Updates the value immediately and returns a resolved promise
	* to maintain API compatibility with animated motion classes
	*/
	set(value, _options = {}) {
		this.#current = value;
		this.#target = value;
		return Promise.resolve();
	}
	get current() {
		return this.#current;
	}
	get target() {
		return this.#target;
	}
	set target(v) {
		this.set(v);
	}
};
/**
* Sets up automatic tracking between a source value and a motion state.
* When the `controlled` option is `true`, the motion state will not update
* automatically and will only update when explicitly set.
*/
function setupTracking(motion, getValue, options) {
	if (options.controlled) return;
}
function createMotion(initialValue, getValue, motionProp, options = {}) {
	const motion = parseMotionProp(motionProp);
	const motionState = motion.type === "spring" ? new MotionSpring(initialValue, motion.options) : motion.type === "tween" ? new MotionTween(initialValue, motion.options) : new MotionNone(initialValue);
	setupTracking(motionState, getValue, options);
	return motionState;
}
/**
* Creates a controlled motion state that only updates when explicitly set
* rather than automatically tracking changes to the source value
*/
function createControlledMotion(initialValue, motionProp) {
	return createMotion(initialValue, () => initialValue, motionProp, { controlled: true });
}
/**
* Creates a state tracker for animation completion
* This helps track whether any motion transitions are currently in progress
*
* @returns an object with methods to handle animation promises and check current status
*/
function createMotionTracker() {
	let latestIndex = 0;
	let current = false;
	function handle(promise) {
		latestIndex += 1;
		if (!promise) {
			current = false;
			return;
		}
		let currIndex = latestIndex;
		current = true;
		promise.then(() => {
			if (currIndex === latestIndex) current = false;
		}).catch(() => {});
	}
	return {
		handle,
		get current() {
			return current;
		}
	};
}
/**
* Extracts tween configuration from a motion prop
* @returns Resolved tween configuration or undefined if not a tween
*/
function extractTweenConfig(prop) {
	const resolved = parseMotionProp(prop);
	if (resolved.type === "tween") return resolved;
}
/**
* Parses and normalizes a motion configuration into a standard format
*
* @param config - The motion configuration to parse
* @param propertyKey - Optional property key when config is a map of properties
* @returns A standardized motion configuration object
*/
function parseMotionProp(config, accessor) {
	if (typeof config === "object" && "type" in config && "options" in config) {
		if (typeof config.options === "object") return config;
		return {
			type: config.type,
			options: {}
		};
	}
	if (config === void 0) return {
		type: "none",
		options: {}
	};
	if (typeof config === "string") {
		if (config === "spring") return {
			type: "spring",
			options: {}
		};
		else if (config === "tween") return {
			type: "tween",
			options: {}
		};
		return {
			type: "none",
			options: {}
		};
	}
	if (typeof config === "object" && "type" in config) if (config.type === "spring") {
		const { type, ...options } = config;
		return {
			type: "spring",
			options
		};
	} else if (config.type === "tween") {
		const { type, ...options } = config;
		return {
			type: "tween",
			options
		};
	} else return {
		type: "none",
		options: {}
	};
	if (accessor) {
		const propConfig = config[accessor];
		if (propConfig !== void 0) return parseMotionProp(propConfig);
	}
	return {
		type: "none",
		options: {}
	};
}
//#endregion
//#region node_modules/layerchart/dist/utils/common.js
function accessor(prop) {
	if (Array.isArray(prop)) return (d) => prop.map((p) => accessor(p)(d));
	else if (typeof prop === "function") return prop;
	else if (typeof prop === "string" || typeof prop === "number") return (d) => get(d, prop);
	else return (d) => d;
}
/** Guarantee chart data is an array */
function chartDataArray(data) {
	if (data == null) return [];
	else if (Array.isArray(data)) return data;
	else if ("nodes" in data) return data.nodes;
	else if ("descendants" in data) return data.descendants();
	return [];
}
function defaultChartPadding(options = {}) {
	const { axis = true, legend = false, top, left, bottom, right } = options;
	if (axis === false) return;
	return {
		top: top ?? (axis === true || axis === "y" ? 4 : 0),
		left: left ?? (axis === true || axis === "y" ? 20 : 0),
		bottom: (bottom ?? (axis === true || axis === "x" ? 20 : 0)) + (legend ? 32 : 0),
		right: right ?? (axis === true || axis === "x" ? 4 : 0)
	};
}
/**
* Find the first instance within `data` with the same value as `original` using prop accessor.
* Handles complex objects such as `Date` by invoking `.valueOf()`
*/
function findRelatedData(data, original, accessor) {
	return data.find((d) => {
		return accessor(d)?.valueOf() === accessor(original)?.valueOf();
	});
}
/**
* Return the object if the value is an object, otherwise return null.
* Functions (including Snippet types) are treated as non-objects and return null.
*/
function getObjectOrNull(value) {
	if (typeof value === "object") return value;
	if (value === void 0) return void 0;
	return null;
}
/**
* Call with args if function, otherwise return the value.
*/
function resolveMaybeFn(value, ...args) {
	return typeof value === "function" ? value(...args) : value;
}
//#endregion
//#region node_modules/layerchart/dist/utils/scales.svelte.js
function isAnyScale(scale) {
	return typeof scale === "function" && typeof scale.range === "function";
}
function isScaleBand(scale) {
	return typeof scale.bandwidth === "function";
}
function isScaleTime(scale) {
	const domain = scale.domain();
	return domain[0] instanceof Date || domain[1] instanceof Date;
}
function isScaleNumeric(scale) {
	const domain = scale.domain();
	return typeof domain[0] === "number" || typeof domain[1] === "number";
}
function getRange(scale) {
	if (isAnyScale(scale)) return scale.range();
	console.error("[LayerChart] Your scale doesn't have a `.range` method?");
	return [];
}
/**
* Implementation for missing `scaleBand().invert()`
*
*  See: https://stackoverflow.com/questions/38633082/d3-getting-invert-value-of-band-scales
*      https://github.com/d3/d3-scale/pull/64
*      https://github.com/vega/vega-scale/blob/master/src/scaleBand.js#L118
*      https://observablehq.com/@d3/ordinal-brushing
* 			https://github.com/d3/d3-scale/blob/11777dac7d4b0b3e229d658aee3257ea67bd5ffa/src/band.js#L32
* 			https://gist.github.com/LuisSevillano/d53a1dc529eef518780c6df99613e2fd
*/
function scaleBandInvert(scale) {
	const domain = scale.domain();
	const eachBand = scale.step();
	const paddingOuter = eachBand * (scale.paddingOuter?.() ?? scale.padding());
	return function(value) {
		const index = Math.floor((value - paddingOuter / 2) / eachBand);
		return domain[Math.max(0, Math.min(index, domain.length - 1))];
	};
}
/**
*  Generic way to invert a scale value, handling scaleBand and continuous scales (linear, time, etc).
*  Useful to map mouse event location (x,y) to domain value
*/
function scaleInvert(scale, value) {
	if (isScaleBand(scale)) return scaleBandInvert(scale)(value);
	else return scale.invert?.(value);
}
/** Create new copy of scale with domain and range */
function createScale(scale, domain, range, context) {
	const scaleCopy = scale.copy();
	if (domain) scaleCopy.domain(domain);
	if (typeof range === "function") scaleCopy.range(range(context));
	else scaleCopy.range(range);
	return scaleCopy;
}
/**
* Auto-detect scale type based on domain values or data values
*/
function autoScale(domain, data, propAccessor) {
	let values = null;
	if (domain && domain.length > 0 && domain.some((d) => d != null)) values = domain.filter((d) => d != null);
	else if (data && data.length > 0 && propAccessor) {
		const value = accessor(propAccessor)(data[0]);
		if (Array.isArray(value)) values = value;
		else values = [value];
	}
	if (values) {
		if (values.some((v) => v instanceof Date)) return scaleTime();
		else if (values.some((v) => typeof v === "number")) return scaleLinear();
		else if (values.some((v) => typeof v === "string")) return scaleBand();
	}
	return scaleLinear();
}
function canBeZero(val) {
	if (val === 0) return true;
	return val;
}
function makeAccessor(acc) {
	if (!canBeZero(acc)) return null;
	if (Array.isArray(acc)) return (d) => acc.map((k) => {
		return typeof k !== "function" ? d[k] : k(d);
	});
	else if (typeof acc !== "function") return (d) => d[acc];
	return acc;
}
//#endregion
//#region node_modules/layerchart/dist/contexts/chart.js
var _ChartContext = new Context("ChartContext");
function getChartContext() {
	return _ChartContext.getOr({});
}
function setChartContext(context) {
	return _ChartContext.set(context);
}
//#endregion
//#region node_modules/layerchart/dist/utils/attributes.js
function isObjectWithClass(val) {
	return typeof val === "object" && val !== null && typeof val !== "function";
}
/**
* Pulls out the props from an arbitrary object/function/boolean and appends
* a class name to its class property to identify the layer for CSS targeting.
*
* @param props The props to be extracted, can be an object, function or any other type
* @param className The class name to be applied to the layer for targeting styling (e.g. 'lc-layer')
* @param extraClasses Additional classes to be applied to the layer if they don't exist in the props already
* @returns a typed spreadable object with props for the layer
*/
function extractLayerProps(props, className, ...extraClasses) {
	if (isObjectWithClass(props)) return {
		...props,
		class: cls(className, ...extraClasses, props.class)
	};
	return { class: cls(className, ...extraClasses) };
}
//#endregion
//#region node_modules/layerchart/dist/utils/arcText.svelte.js
function extractOutsideArc(arcPath) {
	const matches = arcPath.match(/(^.+?)(L|Z)/);
	if (!matches || !matches[1]) return arcPath;
	return matches[1];
}
function normalizeAngle(angle) {
	return (angle % 360 + 360) % 360;
}
/**
* Calculates and generates a path in the middle/medial line of an arc.
*/
function getArcPathMiddle(props) {
	const centerRadius = derived(() => (props.innerRadius() + props.outerRadius()) / 2);
	const cornerAngleOffset = derived(() => {
		if (props.cornerRadius() <= 0 || centerRadius() <= 0) return 0;
		return Math.min(props.cornerRadius(), centerRadius()) * .5 / centerRadius();
	});
	const effectiveStartAngle = derived(() => {
		if (props.invertCorner()) return props.startAngle() - cornerAngleOffset();
		return props.startAngle() + cornerAngleOffset();
	});
	const effectiveEndAngle = derived(() => {
		if (props.invertCorner()) return props.endAngle() + cornerAngleOffset();
		return props.endAngle() - cornerAngleOffset();
	});
	const path = derived(() => extractOutsideArc(arc().outerRadius(centerRadius()).innerRadius(centerRadius() - .5).startAngle(effectiveStartAngle()).endAngle(effectiveEndAngle())() ?? ""));
	return { get current() {
		return path();
	} };
}
function getArcPathInner(props) {
	const cornerAngleOffset = derived(() => {
		if (props.cornerRadius() <= 0 || props.innerRadius() <= 0) return 0;
		if (props.cornerRadius() >= props.innerRadius()) return Math.PI / 4;
		return props.cornerRadius() * .5 / props.innerRadius();
	});
	const effectiveStartAngle = derived(() => {
		if (props.invertCorner()) return props.startAngle() - cornerAngleOffset();
		return props.startAngle() + cornerAngleOffset();
	});
	const effectiveEndAngle = derived(() => {
		if (props.invertCorner()) return props.endAngle() + cornerAngleOffset();
		return props.endAngle() - cornerAngleOffset();
	});
	const path = derived(() => extractOutsideArc(arc().innerRadius(props.innerRadius()).outerRadius(props.innerRadius() + .5).startAngle(effectiveStartAngle()).endAngle(effectiveEndAngle())() ?? ""));
	return { get current() {
		return path();
	} };
}
function getArcPathOuter(props) {
	const cornerAngleOffset = derived(() => {
		if (props.cornerRadius() <= 0 || props.outerRadius() <= 0) return 0;
		return props.cornerRadius() * .5 / props.outerRadius();
	});
	const effectiveStartAngle = derived(() => {
		if (props.invertCorner()) return props.startAngle() - cornerAngleOffset();
		return props.startAngle() + cornerAngleOffset();
	});
	const effectiveEndAngle = derived(() => {
		if (props.invertCorner()) return props.endAngle() + cornerAngleOffset();
		return props.endAngle() - cornerAngleOffset();
	});
	const path = derived(() => extractOutsideArc(arc().innerRadius(props.outerRadius() - .5).outerRadius(props.outerRadius()).startAngle(effectiveStartAngle()).endAngle(effectiveEndAngle())() ?? ""));
	return { get current() {
		return path();
	} };
}
function pointOnCircle(radius, angle) {
	const adjustedAngle = angle - Math.PI / 2;
	return [radius * Math.cos(adjustedAngle), radius * Math.sin(adjustedAngle)];
}
function createArcTextProps(props, opts = {}, position) {
	const effectiveStartAngleRadians = derived(() => {
		const start = props.startAngle();
		const end = props.endAngle();
		const offset = opts.startOffset;
		if (offset) try {
			const percentage = parseFloat(offset.slice(0, -1)) / 100;
			if (!isNaN(percentage) && percentage >= 0 && percentage <= 1) return start + (end - start) * percentage;
			else console.warn("Invalid percentage for startOffset:", offset);
		} catch (e) {
			console.warn("Could not parse startOffset percentage:", offset, e);
		}
		return start;
	});
	const effectiveStartDegrees = derived(() => radiansToDegrees(effectiveStartAngleRadians()));
	const normalizedStartDegrees = derived(() => normalizeAngle(effectiveStartDegrees()));
	const startDegrees = derived(() => radiansToDegrees(props.startAngle()));
	const endDegrees = derived(() => radiansToDegrees(props.endAngle()));
	const isClockwise = derived(() => startDegrees() < endDegrees());
	const isTopCw = derived(() => isClockwise() && (normalizedStartDegrees() >= 270 || normalizedStartDegrees() <= 90));
	const isTopCcw = derived(() => !isClockwise() && (normalizedStartDegrees() > 270 || normalizedStartDegrees() <= 90));
	const isBottomCw = derived(() => isClockwise() && normalizedStartDegrees() < 270 && normalizedStartDegrees() >= 90);
	const isBottomCcw = derived(() => !isClockwise() && normalizedStartDegrees() <= 270 && normalizedStartDegrees() > 90);
	const reverseText = derived(() => isTopCcw() || isBottomCw());
	const pathGenProps = {
		...props,
		startAngle: () => reverseText() ? props.endAngle() : props.startAngle(),
		endAngle: () => reverseText() ? props.startAngle() : props.endAngle(),
		invertCorner: () => isBottomCw() || isBottomCcw()
	};
	const innerPath = getArcPathInner(pathGenProps);
	const middlePath = getArcPathMiddle(pathGenProps);
	const outerPath = getArcPathOuter(pathGenProps);
	const innerDominantBaseline = derived(() => {
		if (isBottomCw() || isBottomCcw()) return "auto";
		if (isTopCw() || isTopCcw()) return "hanging";
		return "auto";
	});
	const outerDominantBaseline = derived(() => {
		if (isBottomCw() || isBottomCcw()) return "hanging";
	});
	const sharedProps = derived(() => {
		if (reverseText()) return {
			startOffset: opts.startOffset ?? "100%",
			textAnchor: "end"
		};
		return { startOffset: opts.startOffset ?? void 0 };
	});
	const radialPositionProps = derived(() => {
		if (position !== "outer-radial") return {};
		const midAngle = (props.startAngle() + props.endAngle()) / 2;
		const basePadding = opts.radialOffset ?? opts.outerPadding ?? 23;
		const midAngleDegrees = normalizeAngle(radiansToDegrees(midAngle));
		let textAnchor = "middle";
		let effectivePadding = basePadding;
		const isBottomZone = midAngleDegrees > 45 && midAngleDegrees < 135;
		const isTopZone = midAngleDegrees > 225 && midAngleDegrees < 315;
		const isRightZone = midAngleDegrees <= 45 || midAngleDegrees >= 315;
		const isLeftZone = midAngleDegrees >= 135 && midAngleDegrees <= 225;
		const [x, y] = pointOnCircle(props.outerRadius() + effectivePadding, midAngle);
		if (isRightZone) {
			textAnchor = "start";
			if (midAngleDegrees > 350 || midAngleDegrees < 10) textAnchor = "start";
		} else if (isLeftZone) {
			textAnchor = "end";
			if (midAngleDegrees > 170 && midAngleDegrees < 190) textAnchor = "end";
		} else if (isBottomZone) textAnchor = "middle";
		else if (isTopZone) textAnchor = "middle";
		return {
			x,
			y,
			textAnchor,
			dominantBaseline: "middle"
		};
	});
	const current = derived(() => {
		if (position === "inner") return {
			path: innerPath.current,
			...sharedProps(),
			dominantBaseline: innerDominantBaseline()
		};
		else if (position === "outer") return {
			path: outerPath.current,
			...sharedProps(),
			dominantBaseline: outerDominantBaseline()
		};
		else if (position === "middle") return {
			path: middlePath.current,
			...sharedProps(),
			dominantBaseline: "middle"
		};
		else if (position === "centroid") {
			const centroid = props.centroid();
			return {
				x: centroid[0],
				y: centroid[1],
				textAnchor: "middle",
				verticalAnchor: "middle"
			};
		} else return radialPositionProps();
	});
	return { get current() {
		return current();
	} };
}
//#endregion
//#region node_modules/svelte/src/transition/index.js
/** @param {number} x */
var linear = (x) => x;
/**
* @param {number} t
* @returns {number}
*/
function cubic_in_out(t) {
	return t < .5 ? 4 * t * t * t : .5 * Math.pow(2 * t - 2, 3) + 1;
}
/**
* Animates the opacity of an element from 0 to the current opacity for `in` transitions and from the current opacity to 0 for `out` transitions.
*
* @param {Element} node
* @param {FadeParams} [params]
* @returns {TransitionConfig}
*/
function fade(node, { delay = 0, duration = 400, easing = linear } = {}) {
	const o = +getComputedStyle(node).opacity;
	return {
		delay,
		duration,
		easing,
		css: (t) => `opacity: ${t * o}`
	};
}
/**
* Animates the stroke of an SVG element, like a snake in a tube. `in` transitions begin with the path invisible and draw the path to the screen over time. `out` transitions start in a visible state and gradually erase the path. `draw` only works with elements that have a `getTotalLength` method, like `<path>` and `<polyline>`.
*
* @param {SVGElement & { getTotalLength(): number }} node
* @param {DrawParams} [params]
* @returns {TransitionConfig}
*/
function draw(node, { delay = 0, speed, duration, easing = cubic_in_out } = {}) {
	let len = node.getTotalLength();
	const style = getComputedStyle(node);
	if (style.strokeLinecap !== "butt") len += parseInt(style.strokeWidth);
	if (duration === void 0) if (speed === void 0) duration = 800;
	else duration = len / speed;
	else if (typeof duration === "function") duration = duration(len);
	return {
		delay,
		duration,
		easing,
		css: (_, u) => `
			stroke-dasharray: ${len};
			stroke-dashoffset: ${u * len};
		`
	};
}
//#endregion
//#region node_modules/layerchart/dist/contexts/layer.js
var _LayerContext = new Context("LayerContext");
function getLayerContext() {
	return _LayerContext.get();
}
function setLayerContext(context) {
	return _LayerContext.set(context);
}
//#endregion
//#region node_modules/@layerstack/svelte-state/dist/mediaQueryPresets.svelte.js
var MediaQueryPresets = class {
	width(width) {
		return new MediaQuery(`(min-width: ${width}px)`);
	}
	height(height) {
		return new MediaQuery(`(min-height: ${height}px)`);
	}
	smScreen = this.width(640);
	mdScreen = this.width(768);
	lgScreen = this.width(1024);
	xlScreen = this.width(1280);
	xxlScreen = this.width(1536);
	screen = new MediaQuery("screen and (min-width: 0)");
	print = new MediaQuery("print and (min-width: 0)");
	dark = new MediaQuery("(prefers-color-scheme: dark)");
	light = new MediaQuery("(prefers-color-scheme: light)");
	motion = new MediaQuery("(prefers-reduced-motion: no-preference)");
	motionReduce = new MediaQuery("(prefers-reduced-motion: reduce)");
	landscape = new MediaQuery("(orientation: landscape)");
	portrait = new MediaQuery("(orientation: portrait)");
};
//#endregion
//#region node_modules/@layerstack/svelte-state/dist/uniqueState.svelte.js
var UniqueState = class {
	#initial;
	current;
	constructor(initial) {
		this.#initial = initial ?? [];
		this.current = new SvelteSet(initial ?? []);
	}
	/** Clear all values */
	clear() {
		this.current.clear();
	}
	/** Reset to initial values */
	reset() {
		this.clear();
		this.addEach(this.#initial);
	}
	/** Add a value */
	add(value) {
		this.current.add(value);
	}
	/** Add multiple values */
	addEach(values) {
		for (const value of values) this.current.add(value);
	}
	/** Remove a value */
	delete(value) {
		this.current.delete(value);
	}
	/** Toggle a value */
	toggle(value) {
		if (this.current.has(value)) this.current.delete(value);
		else this.current.add(value);
	}
};
//#endregion
//#region node_modules/@layerstack/svelte-state/dist/selectionState.svelte.js
var SelectionState = class {
	#initial;
	#selected;
	all;
	single;
	max;
	constructor(options = {}) {
		this.#initial = options.initial ?? [];
		this.#selected = new UniqueState(this.#initial);
		this.all = options.all ?? [];
		this.single = options.single ?? false;
		this.max = options.max;
	}
	get current() {
		return this.single ? Array.from(this.#selected.current)[0] ?? null : Array.from(this.#selected.current);
	}
	set current(values) {
		if (Array.isArray(values)) if (this.max == null || values.length < this.max) {
			this.#selected.clear();
			this.#selected.addEach(values);
		} else throw new Error(`Too many values selected.  Current: ${values.length}, max: ${this.max}`);
		else if (values != null) {
			this.#selected.clear();
			this.#selected.add(values);
		} else this.#selected.clear();
	}
	/** Check if a value is selected */
	isSelected(value) {
		return this.#selected.current.has(value);
	}
	/** Check if the selection is empty */
	isEmpty() {
		return this.#selected.current.size === 0;
	}
	/** Check if all values in `all` are selected */
	isAllSelected() {
		return this.all.every((v) => this.#selected.current.has(v));
	}
	/** Check if any values in `all` are selected */
	isAnySelected() {
		return this.all.some((v) => this.#selected.current.has(v));
	}
	/** Check if the selection is at the maximum */
	isMaxSelected() {
		return this.max != null ? this.#selected.current.size >= this.max : false;
	}
	/** Check if a value is disabled (max reached) */
	isDisabled(value) {
		return !this.isSelected(value) && this.isMaxSelected();
	}
	/** Clear all selected values */
	clear() {
		this.#selected.clear();
	}
	/** Reset to initial values */
	reset() {
		this.#selected.reset();
	}
	/** Toggle a value */
	toggle(value) {
		if (this.#selected.current.has(value)) {
			const prevSelected = [...this.#selected.current];
			this.#selected.clear();
			this.#selected.addEach(prevSelected.filter((v) => v != value));
		} else if (this.single) {
			this.#selected.clear();
			this.#selected.add(value);
		} else if (this.max == null || this.#selected.current.size < this.max) return this.#selected.add(value);
	}
	/** Toggle all values */
	toggleAll() {
		let values;
		if (this.isAllSelected()) values = [...this.#selected.current].filter((v) => !this.all.includes(v));
		else values = [...this.#selected.current, ...this.all];
		this.#selected.clear();
		this.#selected.addEach(values);
	}
};
//#endregion
//#region node_modules/layerchart/dist/states/transform.svelte.js
var DEFAULT_TRANSLATE = {
	x: 0,
	y: 0
};
function createDefaultTransformContext() {
	let defaultTranslate = DEFAULT_TRANSLATE;
	let defaultScale = 1;
	return {
		mode: "none",
		get scale() {
			return defaultScale;
		},
		setScale: (value) => {
			defaultScale = value;
		},
		get translate() {
			return defaultTranslate;
		},
		setTranslate: (value) => {
			defaultTranslate = value;
		},
		moving: false,
		dragging: false,
		scrollMode: "none",
		setScrollMode: () => {},
		reset: () => {},
		zoomIn: () => {},
		zoomOut: () => {},
		translateCenter: () => {},
		zoomTo: () => {}
	};
}
//#endregion
//#region node_modules/layerchart/dist/components/TransformContext.svelte
function TransformContext($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { mode = "none", motion, processTranslate = (x, y, deltaX, deltaY) => ({
			x: x + deltaX,
			y: y + deltaY
		}), disablePointer = false, initialScrollMode = "none", clickDistance = 10, ondragend = () => {}, ondragstart = () => {}, onTransform = () => {}, initialTranslate, initialScale, onwheel = () => {}, onpointerdown = () => {}, onpointermove = () => {}, ontouchmove = () => {}, onpointerup = () => {}, ondblclick = () => {}, onclickcapture = () => {}, ref: refProp = void 0, children, class: className, transformContext = void 0, $$slots, $$events, ...restProps } = $$props;
		transformContext = {
			get mode() {
				return mode;
			},
			get scale() {
				return scale.current;
			},
			setScale,
			get translate() {
				return translate.current;
			},
			setTranslate,
			get dragging() {
				return dragging;
			},
			get moving() {},
			reset,
			zoomIn,
			zoomOut,
			translateCenter,
			zoomTo,
			get scrollMode() {
				return scrollMode;
			},
			setScrollMode
		};
		const ctx = getChartContext();
		let dragging = false;
		let scrollMode = initialScrollMode;
		const resolvedMotion = parseMotionProp(motion);
		const translate = createControlledMotion(initialTranslate ?? DEFAULT_TRANSLATE, resolvedMotion);
		const scale = createControlledMotion(initialScale ?? 1, resolvedMotion);
		function setScrollMode(mode) {
			scrollMode = mode;
		}
		function reset() {
			translate.target = initialTranslate ?? DEFAULT_TRANSLATE;
			scale.target = initialScale ?? 1;
		}
		function zoomIn() {
			scaleTo(1.25, {
				x: (ctx.width + ctx.padding.left) / 2,
				y: (ctx.height + ctx.padding.top) / 2
			});
		}
		function zoomOut() {
			scaleTo(.8, {
				x: (ctx.width + ctx.padding.left) / 2,
				y: (ctx.height + ctx.padding.top) / 2
			});
		}
		function translateCenter() {
			translate.target = {
				x: 0,
				y: 0
			};
		}
		function zoomTo(center, rect) {
			const newScale = rect ? ctx.width < ctx.height ? ctx.width / rect.width : ctx.height / rect.height : 1;
			translate.target = {
				x: ctx.width / 2 - center.x * newScale,
				y: ctx.height / 2 - center.y * newScale
			};
			if (rect) scale.target = newScale;
		}
		/**
		* Apply scale and translate towards point
		*/
		function scaleTo(value, point, options = void 0) {
			const currentScale = scale.current;
			const newScale = scale.current * value;
			setScale(newScale, options);
			const invertTransformPoint = {
				x: (point.x - ctx.padding.left - translate.current.x) / currentScale,
				y: (point.y - ctx.padding.top - translate.current.y) / currentScale
			};
			setTranslate({
				x: point.x - ctx.padding.left - invertTransformPoint.x * newScale,
				y: point.y - ctx.padding.top - invertTransformPoint.y * newScale
			}, options);
		}
		const translating = createMotionTracker();
		const scaling = createMotionTracker();
		derived(() => translating.current || scaling.current);
		function setTranslate(point, options) {
			translating.handle(translate.set(point, options));
		}
		function setScale(value, options) {
			scaling.handle(scale.set(value, options));
		}
		watch([() => scale.current, () => translate.current], () => {
			onTransform({
				scale: scale.current,
				translate: translate.current
			});
		});
		setTransformContext(transformContext);
		$$renderer.push(`<div${attributes({
			class: clsx(["lc-transform-context", className]),
			...restProps
		}, "svelte-kdqcuo")}>`);
		children?.($$renderer, { transformContext });
		$$renderer.push(`<!----></div>`);
		bind_props($$props, {
			ref: refProp,
			transformContext,
			setScrollMode,
			reset,
			zoomIn,
			zoomOut,
			translateCenter,
			zoomTo,
			setTranslate,
			setScale
		});
	});
}
//#endregion
//#region node_modules/layerchart/dist/contexts/transform.js
var _TransformContext = new Context("TransformContext");
function getTransformContext() {
	return _TransformContext.getOr(createDefaultTransformContext());
}
function setTransformContext(transform) {
	return _TransformContext.set(transform);
}
var CANVAS_STYLES_ELEMENT_ID = "__layerchart_canvas_styles_id";
/**
* Parse an inline CSS style string into a StyleOptions object.
* Converts kebab-case properties to camelCase (e.g., 'stroke-dasharray' -> 'strokeDasharray')
*/
function parseStyleString(styleString) {
	if (!styleString) return {};
	const styles = {};
	const declarations = styleString.split(";").filter((s) => s.trim());
	for (const declaration of declarations) {
		const colonIndex = declaration.indexOf(":");
		if (colonIndex === -1) continue;
		const property = declaration.slice(0, colonIndex).trim();
		const value = declaration.slice(colonIndex + 1).trim();
		if (!property || !value) continue;
		const camelProperty = property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
		styles[camelProperty] = value;
	}
	return styles;
}
var supportedStyles = [
	"fill",
	"fillOpacity",
	"stroke",
	"strokeWidth",
	"strokeDasharray",
	"opacity",
	"fontWeight",
	"fontSize",
	"fontFamily",
	"textAnchor",
	"textAlign",
	"paintOrder"
];
/**
* Appends or reuses `<svg>` element below `<canvas>` to resolve CSS variables and classes (ex. `stroke: var(--color-primary)` => `stroke: rgb(...)` )
*/
function _getComputedStyles(canvas, { styles, classes } = {}) {
	try {
		let svg = document.getElementById(CANVAS_STYLES_ELEMENT_ID);
		if (!svg) {
			svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
			svg.setAttribute("id", CANVAS_STYLES_ELEMENT_ID);
			svg.style.display = "none";
			canvas.after(svg);
		}
		svg = svg;
		svg.removeAttribute("style");
		svg.removeAttribute("class");
		if (styles) Object.assign(svg.style, styles);
		svg.style.display = "none";
		if (classes) svg.setAttribute("class", cls(classes).split(" ").filter((s) => !s.startsWith("transition-")).join(" "));
		return supportedStyles.reduce((acc, style) => {
			acc[style] = window.getComputedStyle(svg)[style];
			return acc;
		}, {});
	} catch (e) {
		console.error("Unable to get computed styles", e);
		return {};
	}
}
function getComputedStylesKey(canvas, { styles, classes } = {}) {
	return JSON.stringify({
		canvasId: canvas.id,
		styles,
		classes
	});
}
var getComputedStyles = memoize(_getComputedStyles, { cacheKey: ([canvas, styleOptions]) => {
	return getComputedStylesKey(canvas, styleOptions);
} });
/** Render onto canvas context.  Supports CSS variables and classes by tranferring to hidden `<svg>` element before retrieval) */
function render(ctx, render, styleOptions = {}, { applyText } = {}) {
	const parsedInlineStyles = parseStyleString(styleOptions.style);
	const mergedStyles = {
		...styleOptions.styles,
		...parsedInlineStyles
	};
	let resolvedStyles;
	if (styleOptions.classes == null && !Object.values(mergedStyles).some((v) => typeof v === "string" && v.includes("var("))) resolvedStyles = mergedStyles;
	else {
		const { constantStyles, variableStyles } = Object.entries(mergedStyles).reduce((acc, [key, value]) => {
			if (typeof value === "number" || typeof value === "string" && !value.includes("var(")) acc.constantStyles[key] = value;
			else if (typeof value === "string" && value.includes("var(")) acc.variableStyles[key] = value;
			return acc;
		}, {
			constantStyles: {},
			variableStyles: {}
		});
		resolvedStyles = {
			...getComputedStyles(ctx.canvas, {
				styles: variableStyles,
				classes: styleOptions.classes
			}),
			...constantStyles
		};
	}
	const paintOrder = resolvedStyles?.paintOrder === "stroke" ? ["stroke", "fill"] : ["fill", "stroke"];
	if (resolvedStyles?.opacity) ctx.globalAlpha = Number(resolvedStyles?.opacity);
	if (applyText) {
		ctx.font = `${resolvedStyles.fontWeight} ${resolvedStyles.fontSize} ${resolvedStyles.fontFamily}`;
		if (resolvedStyles.textAnchor === "middle") ctx.textAlign = "center";
		else if (resolvedStyles.textAnchor === "end") ctx.textAlign = "right";
		else ctx.textAlign = resolvedStyles.textAlign;
	}
	if (resolvedStyles.strokeDasharray && resolvedStyles.strokeDasharray !== "none") {
		const dashArray = resolvedStyles.strokeDasharray.split(/[\s,]+/).filter((s) => s.length > 0).map((s) => Number(s.replace("px", "")));
		if (dashArray.length > 0 && dashArray.every((n) => !isNaN(n))) ctx.setLineDash(dashArray);
	}
	for (const attr of paintOrder) if (attr === "fill") {
		const fill = styleOptions.styles?.fill && (styleOptions.styles?.fill instanceof CanvasGradient || styleOptions.styles?.fill instanceof CanvasPattern || !styleOptions.styles?.fill?.includes("var")) ? styleOptions.styles.fill : resolvedStyles?.fill;
		if (fill && !["none", "rgb(0, 0, 0)"].includes(fill)) {
			const currentGlobalAlpha = ctx.globalAlpha;
			ctx.globalAlpha = Number(resolvedStyles?.fillOpacity) * Number(resolvedStyles?.opacity);
			ctx.fillStyle = fill;
			render.fill(ctx);
			ctx.globalAlpha = currentGlobalAlpha;
		}
	} else if (attr === "stroke") {
		const stroke = styleOptions.styles?.stroke && (styleOptions.styles?.stroke instanceof CanvasGradient || !styleOptions.styles?.stroke?.includes("var")) ? styleOptions.styles?.stroke : resolvedStyles?.stroke;
		if (stroke && !["none"].includes(stroke)) {
			ctx.lineWidth = typeof resolvedStyles?.strokeWidth === "string" ? Number(resolvedStyles?.strokeWidth?.replace("px", "")) : resolvedStyles?.strokeWidth ?? 1;
			ctx.strokeStyle = stroke;
			render.stroke(ctx);
		}
	}
}
/** Render SVG path data onto canvas context.  Supports CSS variables and classes by tranferring to hidden `<svg>` element before retrieval) */
function renderPathData(ctx, pathData, styleOptions = {}) {
	const path = new Path2D(pathData ?? "");
	render(ctx, {
		fill: (ctx) => ctx.fill(path),
		stroke: (ctx) => ctx.stroke(path)
	}, styleOptions);
}
function renderText(ctx, text, coords, styleOptions = {}) {
	if (text) render(ctx, {
		fill: (ctx) => ctx.fillText(text.toString(), coords.x, coords.y),
		stroke: (ctx) => ctx.strokeText(text.toString(), coords.x, coords.y)
	}, styleOptions, { applyText: true });
}
function renderRect(ctx, coords, styleOptions = {}) {
	const { x, y, width, height } = coords;
	const rx = coords.rx ?? 0;
	const ry = coords.ry ?? rx;
	if (rx === 0 && ry === 0) {
		render(ctx, {
			fill: (ctx) => ctx.fillRect(x, y, width, height),
			stroke: (ctx) => ctx.strokeRect(x, y, width, height)
		}, styleOptions);
		return;
	}
	if (typeof ctx.roundRect === "function") {
		ctx.beginPath();
		ctx.roundRect(x, y, width, height, [rx, ry]);
		render(ctx, {
			fill: (ctx) => ctx.fill(),
			stroke: (ctx) => ctx.stroke()
		}, styleOptions);
		ctx.closePath();
		return;
	}
	const clampedRx = Math.min(rx, width / 2);
	const clampedRy = Math.min(ry, height / 2);
	renderPathData(ctx, [
		`M${x + clampedRx},${y}`,
		`h${width - 2 * clampedRx}`,
		`a${clampedRx},${clampedRy} 0 0 1 ${clampedRx},${clampedRy}`,
		`v${height - 2 * clampedRy}`,
		`a${clampedRx},${clampedRy} 0 0 1 ${-clampedRx},${clampedRy}`,
		`h${2 * clampedRx - width}`,
		`a${clampedRx},${clampedRy} 0 0 1 ${-clampedRx},${-clampedRy}`,
		`v${2 * clampedRy - height}`,
		`a${clampedRx},${clampedRy} 0 0 1 ${clampedRx},${-clampedRy}`,
		"z"
	].join(" "), styleOptions);
}
function renderCircle(ctx, coords, styleOptions = {}) {
	ctx.beginPath();
	ctx.arc(coords.cx, coords.cy, coords.r, 0, 2 * Math.PI);
	render(ctx, {
		fill: (ctx) => {
			ctx.fill();
		},
		stroke: (ctx) => {
			ctx.stroke();
		}
	}, styleOptions);
	ctx.closePath();
}
function _createLinearGradient(ctx, x0, y0, x1, y1, stops) {
	const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
	for (const { offset, color } of stops) gradient.addColorStop(offset, color);
	return gradient;
}
/** Create linear gradient and memoize result to fix reactivity */
var createLinearGradient = memoize(_createLinearGradient, { cacheKey: (args) => JSON.stringify(args.slice(1)) });
function _createPattern(ctx, width, height, shapes, background) {
	const patternCanvas = document.createElement("canvas");
	const patternCtx = patternCanvas.getContext("2d");
	ctx.canvas.after(patternCanvas);
	patternCanvas.width = width;
	patternCanvas.height = height;
	if (background) {
		patternCtx.fillStyle = background;
		patternCtx.fillRect(0, 0, width, height);
	}
	for (const shape of shapes) {
		patternCtx.save();
		if (shape.type === "circle") renderCircle(patternCtx, {
			cx: shape.cx,
			cy: shape.cy,
			r: shape.r
		}, { styles: {
			fill: shape.fill,
			opacity: shape.opacity
		} });
		else if (shape.type === "line") renderPathData(patternCtx, shape.path, { styles: {
			stroke: shape.stroke,
			strokeWidth: shape.strokeWidth,
			opacity: shape.opacity
		} });
		patternCtx.restore();
	}
	const pattern = ctx.createPattern(patternCanvas, "repeat");
	ctx.canvas.parentElement?.removeChild(patternCanvas);
	return pattern;
}
/** Create pattern and memoize result to fix reactivity */
var createPattern = memoize(_createPattern, { cacheKey: (args) => JSON.stringify(args.slice(1)) });
//#endregion
//#region node_modules/layerchart/dist/utils/color.js
/** Generator to create a new color on each call */
function* rgbColorGenerator(step = 200) {
	let nextColor = 0;
	while (nextColor < 1 << 21) {
		const r = nextColor & 127;
		const g = nextColor >> 7 & 127;
		const b = nextColor >> 14 & 127;
		nextColor += step;
		yield {
			r: r * 2,
			g: g * 2,
			b: b * 2,
			a: 255
		};
	}
	return {
		r: 0,
		g: 0,
		b: 0,
		a: 255
	};
}
//#endregion
//#region node_modules/layerchart/dist/contexts/canvas.js
var CanvasContext = new Context("CanvasContext");
var defaultCanvasContext = {
	register: (_) => {
		return () => {};
	},
	invalidate: () => {}
};
function getCanvasContext() {
	return CanvasContext.getOr(defaultCanvasContext);
}
function setCanvasContext(context) {
	return CanvasContext.set(context);
}
//#endregion
//#region node_modules/layerchart/dist/components/layers/Canvas.svelte
function registerCanvasComponent(component) {
	getCanvasContext();
}
function Canvas($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { ref: refProp = void 0, canvasContext: canvasContextProp = void 0, willReadFrequently = false, debug = false, zIndex = 0, pointerEvents = true, fallback, center = false, ignoreTransform = false, disableHitCanvas = false, class: className, children, onclick, ondblclick, onpointerenter, onpointermove, onpointerleave, onpointerdown, ontouchmove, $$slots, $$events, ...restProps } = $$props;
		let ref = void 0;
		let context = void 0;
		getChartContext();
		getTransformContext();
		new Logger("Canvas");
		let components = /* @__PURE__ */ new Map();
		let pendingInvalidation = false;
		rgbColorGenerator();
		/**
		* end HitCanvas
		*/
		const { dark } = new MediaQueryPresets();
		watch(() => dark.current, () => {
			canvasContext.invalidate();
		});
		useMutationObserver(() => document.documentElement, () => canvasContext.invalidate(), {
			attributes: true,
			attributeFilter: ["class", "data-theme"]
		});
		function update() {}
		function createCanvasContext() {
			function register(component) {
				const key = Symbol();
				components.set(key, component);
				invalidate();
				const cleanupRoot = () => {};
				return () => {
					components.delete(key);
					cleanupRoot();
					invalidate();
				};
			}
			function invalidate() {
				if (pendingInvalidation) return;
				pendingInvalidation = true;
				requestAnimationFrame(update);
			}
			return {
				register,
				invalidate
			};
		}
		const canvasContext = createCanvasContext();
		setCanvasContext(canvasContext);
		setLayerContext("canvas");
		$$renderer.push(`<canvas${attributes({
			class: clsx(["lc-layout-canvas", className]),
			...restProps
		}, "svelte-110ngnm", { disablePointerEvents: pointerEvents === false }, { "z-index": zIndex })}>`);
		if (fallback) {
			$$renderer.push("<!--[0-->");
			if (typeof fallback === "function") {
				$$renderer.push("<!--[0-->");
				fallback($$renderer);
				$$renderer.push(`<!---->`);
			} else {
				$$renderer.push("<!--[-1-->");
				$$renderer.push(`${escape_html(fallback)}`);
			}
			$$renderer.push(`<!--]-->`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></canvas> <canvas${attr_class("lc-hit-canvas svelte-110ngnm", void 0, { "debug": debug })}></canvas> `);
		children?.($$renderer, {
			ref,
			canvasContext: context
		});
		$$renderer.push(`<!---->`);
		bind_props($$props, {
			ref: refProp,
			canvasContext: canvasContextProp
		});
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/Group.svelte
function Group($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const ctx = getChartContext();
		let { x, initialX: initialXProp, y, initialY: initialYProp, center = false, preventTouchMove = false, opacity = void 0, motion, transitionIn: transitionInProp, transitionInParams: transitionInParamsProp, class: className, children, ref: refProp = void 0, $$slots, $$events, ...restProps } = $$props;
		const initialX = initialXProp ?? x;
		const initialY = initialYProp ?? y;
		const trueX = derived(() => x ?? (center === "x" || center === true ? ctx.width / 2 : 0));
		const trueY = derived(() => y ?? (center === "y" || center === true ? ctx.height / 2 : 0));
		const motionX = createMotion(initialX, () => trueX(), motion);
		const motionY = createMotion(initialY, () => trueY(), motion);
		derived(() => transitionInProp ? transitionInProp : extractTweenConfig(motion)?.options ? fade : () => {});
		derived(() => transitionInParamsProp ? transitionInParamsProp : { easing: cubicIn });
		const transform = derived(() => {
			if (center || x != null || y != null) return `translate(${motionX.current}px, ${motionY.current}px)`;
		});
		const layerCtx = getLayerContext();
		if (layerCtx === "canvas") registerCanvasComponent({
			name: "Group",
			render: (ctx) => {
				const currentGlobalAlpha = ctx.globalAlpha;
				ctx.globalAlpha = opacity ?? 1;
				ctx.translate(motionX.current ?? 0, motionY.current ?? 0);
				ctx.globalAlpha = currentGlobalAlpha;
			},
			retainState: true,
			events: {
				click: restProps.onclick,
				dblclick: restProps.ondblclick,
				pointerenter: restProps.onpointerenter,
				pointermove: restProps.onpointermove,
				pointerleave: restProps.onpointerleave,
				pointerdown: restProps.onpointerdown
			},
			deps: () => [
				motionX.current,
				motionY.current,
				opacity
			]
		});
		if (layerCtx === "canvas") {
			$$renderer.push("<!--[0-->");
			children?.($$renderer);
			$$renderer.push(`<!---->`);
		} else if (layerCtx === "svg") {
			$$renderer.push("<!--[1-->");
			$$renderer.push(`<g${attributes({
				class: clsx(["lc-group-g", className]),
				opacity,
				...restProps
			}, "svelte-nfdibm", void 0, { transform }, 3)}>`);
			children?.($$renderer);
			$$renderer.push(`<!----></g>`);
		} else if (layerCtx === "html") {
			$$renderer.push("<!--[2-->");
			$$renderer.push(`<div${attributes({
				...restProps,
				class: clsx(["lc-group-div", className])
			}, "svelte-nfdibm", void 0, {
				transform,
				opacity
			})}>`);
			children?.($$renderer);
			$$renderer.push(`<!----></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
		bind_props($$props, { ref: refProp });
	});
}
//#endregion
//#region node_modules/layerchart/dist/utils/path.js
/** Flatten all `y` coordinates to `0` */
function flattenPathData(pathData, yOverride = 0) {
	let result = pathData;
	result = result.replace(/([MLTQCSAZ])(-?\d*\.?\d+),(-?\d*\.?\d+)/g, (match, command, x, y) => {
		return `${command}${x},${yOverride}`;
	});
	result = result.replace(/([v])(-?\d*\.?\d+)/g, (match, command, l) => {
		return `${command}0`;
	});
	return result;
}
//#endregion
//#region node_modules/layerchart/dist/utils/createId.js
/**
* Creates a unique ID for a given prefix and uid.
*
* @param prefix - prefix to use for the id
* @param uid - the uid generated by $props.id()
*/
function createId(prefix, uid) {
	return `${prefix}-${uid}`;
}
//#endregion
//#region node_modules/layerchart/dist/components/Marker.svelte
function Marker($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { type, id = createId("marker-", uid), size = 10, markerWidth = size, markerHeight = size, markerUnits = "userSpaceOnUse", orient = "auto-start-reverse", refX = ["arrow", "triangle"].includes(type ?? "") ? 9 : 5, refY = 5, viewBox = "0 0 10 10", class: className, children, $$slots, $$events, ...restProps } = $$props;
		$$renderer.push(`<defs><marker${attributes({
			id,
			markerWidth,
			markerHeight,
			markerUnits,
			orient,
			refX,
			refY,
			viewBox,
			"data-type": type,
			...restProps,
			class: clsx(cls("lc-marker", className))
		}, "svelte-1e1prg5", void 0, void 0, 3)}>`);
		if (children) {
			$$renderer.push("<!--[0-->");
			children($$renderer);
			$$renderer.push(`<!---->`);
		} else if (type === "triangle") {
			$$renderer.push("<!--[1-->");
			$$renderer.push(`<path d="M 0 0 L 10 5 L 0 10 z" class="lc-marker-triangle"></path>`);
		} else if (type === "arrow") {
			$$renderer.push("<!--[2-->");
			$$renderer.push(`<polyline points="0 0, 10 5, 0 10" class="lc-marker-arrow"></polyline>`);
		} else if (type === "circle" || type === "circle-stroke" || type === "dot") {
			$$renderer.push("<!--[3-->");
			$$renderer.push(`<circle${attr("cx", 5)}${attr("cy", 5)}${attr("r", 5)} class="lc-marker-circle"></circle>`);
		} else if (type === "line") {
			$$renderer.push("<!--[4-->");
			$$renderer.push(`<polyline points="5 0, 5 10" class="lc-marker-line"></polyline>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></marker></defs>`);
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/MarkerWrapper.svelte
function MarkerWrapper($$renderer, $$props) {
	let { id, marker } = $$props;
	if (typeof marker === "function") {
		$$renderer.push("<!--[0-->");
		marker($$renderer, { id });
		$$renderer.push(`<!---->`);
	} else if (marker) {
		$$renderer.push("<!--[1-->");
		Marker($$renderer, spread_props([{
			id,
			type: typeof marker === "string" ? marker : void 0
		}, typeof marker === "object" ? marker : null]));
	} else $$renderer.push("<!--[-1-->");
	$$renderer.push(`<!--]-->`);
}
//#endregion
//#region node_modules/layerchart/dist/utils/key.svelte.js
function createKey(getValue) {
	const value = derived(getValue);
	const key = derived(() => value() && typeof value() === "object" ? objectId(value()) : value());
	return { get current() {
		return key();
	} };
}
//#endregion
//#region node_modules/layerchart/dist/components/Path.svelte
function Path($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		const ctx = getChartContext();
		let { pathData, x, y, motion, draw: draw$1, fill, stroke, strokeWidth, fillOpacity, class: className, marker, markerStart: markerStartProp, markerMid: markerMidProp, markerEnd: markerEndProp, startContent, endContent, opacity, pathRef: pathRefProp = void 0, $$slots, $$events, ...restProps } = $$props;
		let pathRef = void 0;
		const markerStart = derived(() => markerStartProp ?? marker);
		const markerMid = derived(() => markerMidProp ?? marker);
		const markerEnd = derived(() => markerEndProp ?? marker);
		const markerStartId = derived(() => markerStart() ? createId("marker-start", uid) : "");
		const markerMidId = derived(() => markerMid() ? createId("marker-mid", uid) : "");
		const markerEndId = derived(() => markerEnd() ? createId("marker-end", uid) : "");
		const extractedTween = extractTweenConfig(motion);
		const tweenedOptions = extractedTween ? {
			type: extractedTween.type,
			options: {
				interpolate: interpolatePath,
				...extractedTween.options
			}
		} : void 0;
		/** Provide initial `0` horizontal baseline and initially hide/untrack scale changes so not reactive (only set on initial mount) */
		function defaultPathData() {
			if (!tweenedOptions) return "";
			else if (pathData) return flattenPathData(pathData, Math.min(ctx.yScale(0) ?? ctx.yRange[0], ctx.yRange[0]));
		}
		const d = derived(() => {
			return pathData;
		});
		const tweenedState = createMotion(defaultPathData(), () => d(), tweenedOptions);
		derived(() => draw$1 ? draw : () => ({}));
		const layerCtx = getLayerContext();
		function render(ctx, styleOverrides) {
			renderPathData(ctx, tweenedState.current, styleOverrides ? merge({ styles: { strokeWidth } }, styleOverrides) : {
				styles: {
					fill,
					fillOpacity,
					stroke,
					strokeWidth,
					opacity
				},
				classes: cls("lc-path", className),
				style: restProps.style
			});
		}
		const fillKey = createKey(() => fill);
		const strokeKey = createKey(() => stroke);
		if (layerCtx === "canvas") registerCanvasComponent({
			name: "Path",
			render,
			events: {
				click: restProps.onclick,
				pointerenter: restProps.onpointerenter,
				pointermove: restProps.onpointermove,
				pointerleave: restProps.onpointerleave,
				pointerdown: restProps.onpointerdown,
				pointerover: restProps.onpointerover,
				pointerout: restProps.onpointerout,
				touchmove: restProps.ontouchmove
			},
			deps: () => [
				fillKey.current,
				fillOpacity,
				strokeKey.current,
				strokeWidth,
				opacity,
				className,
				tweenedState.current,
				restProps.style
			]
		});
		const endPointDuration = derived(() => {
			if (typeof draw$1 === "object" && draw$1.duration !== void 0 && typeof draw$1.duration !== "function") return draw$1.duration;
			return 800;
		});
		const endPoint = createControlledMotion(void 0, draw$1 ? {
			type: "tween",
			duration: () => endPointDuration(),
			easing: typeof draw$1 === "object" && draw$1.easing ? draw$1.easing : cubicInOut,
			interpolate() {
				return (t) => {
					const totalLength = pathRef?.getTotalLength() ?? 0;
					return pathRef?.getPointAtLength(totalLength * t);
				};
			}
		} : { type: "none" });
		if (layerCtx === "svg") {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<!---->`);
			$$renderer.push(`<path${attributes({
				d: tweenedState.current,
				...restProps,
				class: clsx(cls("lc-path", className)),
				fill,
				"fill-opacity": fillOpacity,
				stroke,
				"stroke-width": strokeWidth,
				opacity,
				"marker-start": markerStartId() ? `url(#${markerStartId()})` : void 0,
				"marker-mid": markerMidId() ? `url(#${markerMidId()})` : void 0,
				"marker-end": markerEndId() ? `url(#${markerEndId()})` : void 0
			}, void 0, void 0, void 0, 3)}></path>`);
			MarkerWrapper($$renderer, {
				id: markerStartId(),
				marker: markerStart()
			});
			$$renderer.push(`<!---->`);
			MarkerWrapper($$renderer, {
				id: markerMidId(),
				marker: markerMid()
			});
			$$renderer.push(`<!---->`);
			MarkerWrapper($$renderer, {
				id: markerEndId(),
				marker: markerEnd()
			});
			$$renderer.push(`<!---->`);
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]-->`);
			if (endContent && endPoint.current) {
				$$renderer.push("<!--[0-->");
				Group($$renderer, {
					x: endPoint.current.x,
					y: endPoint.current.y,
					class: "lc-path-g-end",
					children: ($$renderer) => {
						endContent($$renderer, {
							point: endPoint.current,
							value: {
								x: ctx.xScale?.invert?.(endPoint.current.x),
								y: ctx.yScale?.invert?.(endPoint.current.y)
							}
						});
						$$renderer.push(`<!---->`);
					},
					$$slots: { default: true }
				});
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]-->`);
			$$renderer.push(`<!---->`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
		bind_props($$props, { pathRef: pathRefProp });
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/Arc.svelte
function Arc($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { ref: refProp = void 0, trackRef: trackRefProp = void 0, motion, value = 0, initialValue = 0, domain = [0, 100], range = [0, 360], startAngle: startAngleProp, endAngle: endAngleProp, innerRadius: innerRadiusProp, outerRadius: outerRadiusProp, cornerRadius = 0, padAngle = 0, trackStartAngle: trackStartAngleProp, trackEndAngle: trackEndAngleProp, trackInnerRadius: trackInnerRadiusProp, trackOuterRadius: trackOuterRadiusProp, trackCornerRadius: trackCornerRadiusProp, trackPadAngle: trackPadAngleProp, fill, fillOpacity, stroke = "none", strokeWidth, opacity, data, offset = 0, onpointerenter = () => {}, onpointermove = () => {}, onpointerleave = () => {}, ontouchmove = () => {}, tooltipContext, track = false, children, class: className, $$slots, $$events, ...restProps } = $$props;
		let ref = void 0;
		let trackRef = void 0;
		const ctx = getChartContext();
		const endAngle = derived(() => endAngleProp ?? degreesToRadians(ctx.xRange ? max(ctx.xRange) : max(range)));
		const motionEndAngle = createMotion(initialValue, () => value, motion);
		const scale = derived(() => scaleLinear().domain(domain).range(range));
		function getOuterRadius(outerRadius, chartRadius) {
			if (!outerRadius) return chartRadius;
			else if (outerRadius > 1) return outerRadius;
			else if (outerRadius > 0) return chartRadius * outerRadius;
			else if (outerRadius < 0) return chartRadius + outerRadius;
			else return outerRadius;
		}
		const outerRadius = derived(() => getOuterRadius(outerRadiusProp, (Math.min(ctx.xRange[1], ctx.yRange[0]) ?? 0) / 2));
		const trackOuterRadius = derived(() => trackOuterRadiusProp ? getOuterRadius(trackOuterRadiusProp, (Math.min(ctx.xRange[1], ctx.yRange[0]) ?? 0) / 2) : outerRadius());
		function getInnerRadius(innerRadius, outerRadius) {
			if (innerRadius == null) return Math.min(...ctx.yRange);
			else if (innerRadius > 1) return innerRadius;
			else if (innerRadius > 0) return outerRadius * innerRadius;
			else if (innerRadius < 0) return outerRadius + innerRadius;
			else return innerRadius;
		}
		const innerRadius = derived(() => getInnerRadius(innerRadiusProp, outerRadius()));
		const trackInnerRadius = derived(() => trackInnerRadiusProp ? getInnerRadius(trackInnerRadiusProp, trackOuterRadius()) : innerRadius());
		const startAngle = derived(() => startAngleProp ?? degreesToRadians(range[0]));
		const trackStartAngle = derived(() => trackStartAngleProp ?? startAngleProp ?? degreesToRadians(range[0]));
		const trackEndAngle = derived(() => trackEndAngleProp ?? endAngleProp ?? degreesToRadians(range[1]));
		const trackCornerRadius = derived(() => trackCornerRadiusProp ?? cornerRadius);
		const trackPadAngle = derived(() => trackPadAngleProp ?? padAngle);
		const arcEndAngle = derived(() => endAngleProp ?? degreesToRadians(scale()(motionEndAngle.current)));
		const arc$1 = derived(() => arc().innerRadius(innerRadius()).outerRadius(outerRadius()).startAngle(startAngle()).endAngle(arcEndAngle()).cornerRadius(cornerRadius).padAngle(padAngle));
		const trackArc = derived(() => arc().innerRadius(trackInnerRadius()).outerRadius(trackOuterRadius()).startAngle(trackStartAngle()).endAngle(trackEndAngle()).cornerRadius(trackCornerRadius()).padAngle(trackPadAngle()));
		const angle = derived(() => ((startAngle() ?? 0) + (endAngle() ?? 0)) / 2);
		const xOffset = derived(() => Math.sin(angle()) * offset);
		const yOffset = derived(() => -Math.cos(angle()) * offset);
		const trackArcCentroid = derived(() => {
			const centroid = trackArc().centroid();
			return [centroid[0] + xOffset(), centroid[1] + yOffset()];
		});
		const boundingBox = derived(() => trackRef ? trackRef.getBBox() : {});
		const onPointerEnter = (e) => {
			onpointerenter?.(e);
			tooltipContext?.show(e, data);
		};
		const onPointerMove = (e) => {
			onpointermove?.(e);
			tooltipContext?.show(e, data);
		};
		const onPointerLeave = (e) => {
			onpointerleave?.(e);
			tooltipContext?.hide();
		};
		function getTrackTextProps(position, opts = {}) {
			return createArcTextProps({
				startAngle: () => trackStartAngle(),
				endAngle: () => trackEndAngle(),
				outerRadius: () => trackOuterRadius() + (opts.outerPadding ? opts.outerPadding : 0),
				innerRadius: () => trackInnerRadius(),
				cornerRadius: () => trackCornerRadius(),
				centroid: () => trackArcCentroid()
			}, opts, position).current;
		}
		function getArcTextProps(position, opts = {}) {
			return createArcTextProps({
				startAngle: () => startAngle(),
				endAngle: () => arcEndAngle(),
				outerRadius: () => outerRadius() + (opts.outerPadding ? opts.outerPadding : 0),
				innerRadius: () => innerRadius(),
				cornerRadius: () => cornerRadius,
				centroid: () => trackArcCentroid()
			}, opts, position).current;
		}
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			if (track) {
				$$renderer.push("<!--[0-->");
				Path($$renderer, spread_props([
					{
						pathData: trackArc()(),
						stroke: "none"
					},
					extractLayerProps(track, "lc-arc-track"),
					{
						get pathRef() {
							return trackRef;
						},
						set pathRef($$value) {
							trackRef = $$value;
							$$settled = false;
						}
					}
				]));
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			Path($$renderer, spread_props([
				{
					pathData: arc$1()(),
					transform: `translate(${stringify(xOffset())}, ${stringify(yOffset())})`,
					fill,
					fillOpacity,
					stroke,
					strokeWidth,
					opacity
				},
				restProps,
				{
					class: cls("lc-arc-line", className),
					onpointerenter: onPointerEnter,
					onpointermove: onPointerMove,
					onpointerleave: onPointerLeave,
					ontouchmove: (e) => {
						ontouchmove?.(e);
						if (!tooltipContext) return;
						e.preventDefault();
					},
					get pathRef() {
						return ref;
					},
					set pathRef($$value) {
						ref = $$value;
						$$settled = false;
					}
				}
			]));
			$$renderer.push(`<!----> `);
			children?.($$renderer, {
				centroid: trackArcCentroid(),
				boundingBox: boundingBox(),
				value: motionEndAngle.current,
				getTrackTextProps,
				getArcTextProps
			});
			$$renderer.push(`<!---->`);
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, {
			ref: refProp,
			trackRef: trackRefProp
		});
	});
}
//#endregion
//#region node_modules/layerchart/dist/utils/string.js
var MEASUREMENT_ELEMENT_ID = "__text_measurement_id";
function _getStringWidth(str, style) {
	try {
		let textEl = document.getElementById(MEASUREMENT_ELEMENT_ID);
		if (!textEl) {
			const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
			svg.style.width = "0";
			svg.style.height = "0";
			svg.style.position = "absolute";
			svg.style.top = "-100%";
			svg.style.left = "-100%";
			textEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
			textEl.setAttribute("id", MEASUREMENT_ELEMENT_ID);
			svg.appendChild(textEl);
			document.body.appendChild(svg);
		}
		Object.assign(textEl.style, style);
		textEl.textContent = str;
		return textEl.getComputedTextLength();
	} catch (e) {
		return null;
	}
}
var getStringWidth = memoize(_getStringWidth, { cacheKey: ([str, style]) => `${str}_${JSON.stringify(style)}` });
function toTitleCase(str) {
	return str.replace(/^\w/, (d) => d.toUpperCase());
}
var DEFAULT_ELLIPSIS = "…";
/**
* Truncates a string to fit within a specified pixel width or character count.
* If the string's width exceeds the maxWidth, it will be truncated. If the character
* count exceeds maxChars, it will also be truncated.
*
* The ellipsis can be placed at the start, middle, or end of the string.
*/
function truncateText(text, { position = "end", ellipsis = DEFAULT_ELLIPSIS, maxWidth, style, maxChars }) {
	if (!text) return "";
	if (maxWidth === void 0 && maxChars === void 0) return text;
	let workingText = text;
	if (maxChars !== void 0 && text.length > maxChars) if (position === "start") workingText = ellipsis + text.slice(-maxChars);
	else if (position === "middle") {
		const half = Math.floor(maxChars / 2);
		workingText = text.slice(0, half) + ellipsis + text.slice(-half);
	} else workingText = text.slice(0, maxChars) + ellipsis;
	if (maxWidth !== void 0) {
		const fullWidth = getStringWidth(workingText, style);
		if (fullWidth === null || fullWidth <= maxWidth) return workingText;
		let availableWidth = maxWidth - (getStringWidth(ellipsis, style) ?? 0);
		if (position === "start") {
			let truncated = workingText.slice(ellipsis.length);
			let truncatedWidth = getStringWidth(truncated, style);
			while (truncatedWidth !== null && truncatedWidth > availableWidth && truncated.length > 0) {
				truncated = truncated.slice(1);
				truncatedWidth = getStringWidth(truncated, style);
			}
			return ellipsis + truncated;
		} else if (position === "middle") {
			const halfWidth = availableWidth / 2;
			let left = "";
			let right = "";
			let bestLeft = "";
			let bestRight = "";
			for (let i = 0, j = workingText.length - 1; i < workingText.length && j >= 0; i++, j--) {
				const leftTest = workingText.slice(0, i + 1);
				const rightTest = workingText.slice(j);
				const leftWidth = getStringWidth(leftTest, style);
				const rightWidth = getStringWidth(rightTest, style);
				if (leftWidth !== null && leftWidth <= halfWidth) left = leftTest;
				if (rightWidth !== null && rightWidth <= halfWidth) right = rightTest;
				const combinedWidth = getStringWidth(left + ellipsis + right, style);
				if (combinedWidth !== null && combinedWidth <= maxWidth) {
					bestLeft = left;
					bestRight = right;
				} else break;
			}
			return bestLeft + ellipsis + bestRight;
		} else {
			let truncated = workingText.slice(0, -ellipsis.length);
			let truncatedWidth = getStringWidth(truncated + ellipsis, style);
			while (truncatedWidth !== null && truncatedWidth > maxWidth && truncated.length > 0) {
				truncated = truncated.slice(0, -1);
				truncatedWidth = getStringWidth(truncated + ellipsis, style);
			}
			return truncated + ellipsis;
		}
	}
	return workingText;
}
//#endregion
//#region node_modules/layerchart/dist/utils/array.js
/**
* Determine whether two arrays equal one another, order not important.
* This uses includes instead of converting to a set because this is only
* used internally on a small array size and it's not worth the cost
* of making a set
*/
function arraysEqual(arr1, arr2) {
	if (arr1.length !== arr2.length) return false;
	return arr1.every((k) => {
		return arr2.includes(k);
	});
}
//#endregion
//#region node_modules/layerchart/dist/utils/chart.js
/**
* Creates a function to calculate a domain based on extents and a domain directive.
* @param s The key (e.g., 'x', 'y') to look up in the extents object
* @returns A function that computes the final domain from extents and a domain input
*/
function calcDomain(s, extents, domain) {
	return extents ? partialDomain(extents[s], domain) : domain;
}
/**
* If we have a domain from settings (the directive), fill in
* any null values with ones from our measured extents;
* otherwise, return the measured extent.
* @param domain A two-value array of numbers representing the measured extent
* @param directive A two-value array of numbers or nulls that will have any nulls filled in from the `domain` array
* @returns A two-value array of numbers representing the filled-in domain
*/
function partialDomain(domain = [], directive) {
	if (Array.isArray(directive) === true) return directive.map((d, i) => {
		if (d === null) return domain[i];
		return d;
	});
	return domain;
}
function createChartScale(axis, { domain, scale, padding, nice, reverse, width, height, range, percentRange }) {
	const defaultRange = getDefaultRange(axis, width, height, reverse, range, percentRange);
	const trueScale = scale.copy();
	trueScale.domain(domain);
	if (!trueScale.interpolator || typeof trueScale.interpolator === "function" && trueScale.interpolator().name.startsWith("identity")) trueScale.range(defaultRange);
	if (padding) trueScale.domain(padScale(trueScale, padding));
	if (nice === true || typeof nice === "number") if (typeof trueScale.nice === "function") trueScale.nice(typeof nice === "number" ? nice : void 0);
	else console.error(`[Layer Chart] You set \`${axis}Nice: true\` but the ${axis}Scale does not have a \`.nice\` method. Ignoring...`);
	return trueScale;
}
var unpaddable = [
	"scaleThreshold",
	"scaleQuantile",
	"scaleQuantize",
	"scaleSequentialQuantile"
];
function padScale(scale, padding) {
	if (typeof scale.range !== "function") throw new Error("Scale method `range` must be a function");
	if (typeof scale.domain !== "function") throw new Error("Scale method `domain` must be a function");
	if (!Array.isArray(padding) || unpaddable.includes(findScaleName(scale))) return scale.domain();
	if (isOrdinalDomain(scale) === true) return scale.domain();
	const { lift, ground } = getPadFunctions(scale);
	const d0 = scale.domain()[0];
	const isTime = Object.prototype.toString.call(d0) === "[object Date]";
	const [d1, d2] = scale.domain().map((d) => {
		return isTime ? lift(d.getTime()) : lift(d);
	});
	const [r1, r2] = scale.range();
	const paddingLeft = padding[0] || 0;
	const paddingRight = padding[1] || 0;
	const step = (d2 - d1) / (Math.abs(r2 - r1) - paddingLeft - paddingRight);
	return [d1 - paddingLeft * step, paddingRight * step + d2].map((d) => {
		return isTime ? ground(new Date(d).getTime()) : ground(d);
	});
}
function f(name, modifier = "") {
	return `scale${toTitleCase(modifier)}${toTitleCase(name)}`;
}
/**
* Get a D3 scale name
* https://svelte.dev/repl/ec6491055208401ca41120c9c8a67737?version=3.49.0
*/
function findScaleName(scale) {
	/**
	* Ordinal scales
	*/
	if (typeof scale.bandwidth === "function") {
		if (typeof scale.paddingInner === "function") return f("band");
		return f("point");
	}
	if (arraysEqual(Object.keys(scale), [
		"domain",
		"range",
		"unknown",
		"copy"
	])) return f("ordinal");
	/**
	* Sequential versus diverging
	*/
	let modifier = "";
	if (scale.interpolator) if (scale.domain().length === 3) modifier = "diverging";
	else modifier = "sequential";
	/**
	* Continuous scales
	*/
	if (scale.quantiles) return f("quantile", modifier);
	if (scale.thresholds) return f("quantize", modifier);
	if (scale.constant) return f("symlog", modifier);
	if (scale.base) return f("log", modifier);
	if (scale.exponent) {
		if (scale.exponent() === .5) return f("sqrt", modifier);
		return f("pow", modifier);
	}
	if (arraysEqual(Object.keys(scale), [
		"domain",
		"range",
		"invertExtent",
		"unknown",
		"copy"
	])) return f("threshold");
	if (arraysEqual(Object.keys(scale), [
		"invert",
		"range",
		"domain",
		"unknown",
		"copy",
		"ticks",
		"tickFormat",
		"nice"
	])) return f("identity");
	if (arraysEqual(Object.keys(scale), [
		"invert",
		"domain",
		"range",
		"rangeRound",
		"round",
		"clamp",
		"unknown",
		"copy",
		"ticks",
		"tickFormat",
		"nice"
	])) return f("radial");
	if (modifier) return f(modifier);
	/**
	* Test for scaleTime vs scaleUtc
	* https://github.com/d3/d3-scale/pull/274#issuecomment-1462935595
	*/
	if (scale.domain()[0] instanceof Date) {
		const d = /* @__PURE__ */ new Date();
		let s = "";
		d.getDay = () => s = "time";
		d.getUTCDay = () => s = "utc";
		scale.tickFormat(0, "%a")(d);
		return f(s);
	}
	return f("linear");
}
/** Determine whether a scale has an ordinal domain
* https://svelte.dev/repl/ec6491055208401ca41120c9c8a67737?version=3.49.0
* @param  scale A D3 scale
* @returns Whether the scale is an ordinal scale
*/
function isOrdinalDomain(scale) {
	if (typeof scale.bandwidth === "function") return true;
	if (arraysEqual(Object.keys(scale), [
		"domain",
		"range",
		"unknown",
		"copy"
	])) return true;
	return false;
}
/**
* Calculates scale extents for given data and scales
* @template T The type of data objects in the input array
* @param {T[]} flatData Array of data objects
* @param {FieldAccessors<T>} getters Field accessor functions
* @param {ActiveScales} activeScales Object containing scale information
* @returns {Extents} Calculated extents for each scale
*/
function calcScaleExtents(flatData, getters, activeScales) {
	const scaleGroups = Object.entries(activeScales).reduce((groups, [key, scaleInfo]) => {
		const domainType = isOrdinalDomain(scaleInfo.scale) === true ? "ordinal" : "other";
		if (!groups[domainType]) groups[domainType] = {};
		groups[domainType][key] = getters[key];
		return groups;
	}, {
		ordinal: false,
		other: false
	});
	let extents = {};
	if (scaleGroups.ordinal) {
		const sortOptions = Object.fromEntries(Object.entries(activeScales).map(([key, scaleInfo]) => [key, scaleInfo.sort]));
		extents = calcUniques(flatData, scaleGroups.ordinal, sortOptions);
	}
	if (scaleGroups.other) {
		const otherExtents = calcExtents(flatData, scaleGroups.other);
		extents = {
			...extents,
			...otherExtents
		};
	}
	return extents;
}
/**
* Calculate the unique values of desired fields
* For example, data like this: [{ x: 0, y: -10 }, { x: 10, y: 0 }, { x: 5, y: 10 }]
* and a fields object like this: {'x': d => d.x, 'y': d => d.y}
* returns an object like this: { x: [0, 10, 5], y: [-10, 0, 10] }
*
* @template T The type of data objects in the input array
* @param  data A flat array of data objects
* @param  fields An object containing accessor functions for fields
* @param  [sortOptions={}] Sorting options for the results
* @returns  An object with unique values for each specified field
* @throws {TypeError} If data is not an array or fields is not a valid object
*/
function calcUniques(data, fields, sortOptions = {}) {
	if (!Array.isArray(data)) throw new TypeError(`The first argument of calcUniques() must be an array. You passed in a ${typeof data}. If you got this error using the <Chart> component, consider passing a flat array to the \`flatData\` prop`);
	if (Array.isArray(fields) || fields === void 0 || fields === null) throw new TypeError("The second argument of calcUniques() must be an object with field names as keys and accessor functions as values.");
	const uniques = {};
	const keys = Object.keys(fields);
	for (const key of keys) {
		const set = new InternSet();
		const accessor = fields[key];
		if (!accessor) continue;
		for (const item of data) {
			const value = accessor(item);
			if (Array.isArray(value)) for (const val of value) set.add(val);
			else set.add(value);
		}
		const results = Array.from(set);
		if (sortOptions.sort === true || sortOptions[key] === true) results.sort((a, b) => {
			if (typeof a === "number" && typeof b === "number") return a - b;
			return String(a).localeCompare(String(b));
		});
		uniques[key] = results;
	}
	return uniques;
}
function calcBaseRange(s, width, height, reverse, percentRange) {
	let min;
	let max;
	if (percentRange === true) {
		min = 0;
		max = 100;
	} else {
		min = s === "r" ? 1 : 0;
		max = s === "y" ? height : s === "r" ? 25 : width;
	}
	return reverse === true ? [max, min] : [min, max];
}
function getDefaultRange(s, width, height, reverse, range, percentRange = false) {
	return !range ? calcBaseRange(s, width, height, reverse, percentRange) : typeof range === "function" ? range({
		width,
		height
	}) : range;
}
function identity(d) {
	return d;
}
function findScaleType(scale) {
	if (scale.constant) return "symlog";
	if (scale.base) return "log";
	if (typeof scale.exponent === "function") {
		if (scale.exponent() === .5) return "sqrt";
		return "pow";
	}
	return "other";
}
function log(sign) {
	return (x) => Math.log(sign * x);
}
function exp(sign) {
	return (x) => sign * Math.exp(x);
}
function symlog(c) {
	return (x) => Math.sign(x) * Math.log1p(Math.abs(x / c));
}
function symexp(c) {
	return (x) => Math.sign(x) * Math.expm1(Math.abs(x)) * c;
}
function pow(exponent) {
	return function powFn(x) {
		return x < 0 ? -Math.pow(-x, exponent) : Math.pow(x, exponent);
	};
}
function getPadFunctions(scale) {
	const scaleType = findScaleType(scale);
	switch (scaleType) {
		case "log": {
			const domain = scale.domain();
			const sign = Math.sign(domain[0]);
			return {
				lift: log(sign),
				ground: exp(sign),
				scaleType
			};
		}
		case "pow": {
			const exponent = 1;
			return {
				lift: pow(exponent),
				ground: pow(1 / exponent),
				scaleType
			};
		}
		case "sqrt": {
			const exponent = .5;
			return {
				lift: pow(exponent),
				ground: pow(1 / exponent),
				scaleType
			};
		}
		case "symlog": {
			const constant = 1;
			return {
				lift: symlog(constant),
				ground: symexp(constant),
				scaleType
			};
		}
		default: return {
			lift: identity,
			ground: identity,
			scaleType
		};
	}
}
function createGetter(accessor, scale) {
	return (d) => {
		const val = accessor(d);
		if (!scale) return void 0;
		if (Array.isArray(val)) return val.map((v) => scale(v));
		return scale(val);
	};
}
/**
* Calculate the extents of desired fields, skipping `false`, `undefined`, `null` and `NaN` values
* For example, data like this:
* [{ x: 0, y: -10 }, { x: 10, y: 0 }, { x: 5, y: 10 }]
* and a fields object like this:
* `{'x': d => d.x, 'y': d => d.y}`
* returns an object like this:
* `{ x: [0, 10], y: [-10, 10] }`
* @param data A flat array of objects.
* @param fields An object containing `x`, `y`, `r` or `z` keys that equal an accessor function.
* @returns An object with the same structure as `fields` but with min/max arrays.
*/
function calcExtents(data, fields) {
	if (!Array.isArray(data)) throw new TypeError(`The first argument of calcExtents() must be an array. You passed in a ${typeof data}. If you got this error using the <Chart> component, consider passing a flat array to the \`flatData\` prop.`);
	if (Array.isArray(fields) || fields === void 0 || fields === null) throw new TypeError("The second argument of calcExtents() must be an object with field names as keys as accessor functions as values.");
	const extents = {};
	const keys = Object.keys(fields);
	const kl = keys.length;
	let i;
	let j;
	let k;
	let s;
	let min;
	let max;
	let acc;
	let val;
	const dl = data.length;
	for (i = 0; i < kl; i += 1) {
		s = keys[i];
		acc = fields[s];
		min = null;
		max = null;
		if (!acc) continue;
		for (j = 0; j < dl; j += 1) {
			val = acc(data[j]);
			if (Array.isArray(val)) {
				const vl = val.length;
				for (k = 0; k < vl; k += 1) if (val[k] !== void 0 && val[k] !== null && (typeof val[k] === "string" || Number.isNaN(val[k]) === false)) {
					if (min === null || val[k] < min) min = val[k];
					if (max === null || val[k] > max) max = val[k];
				}
			} else if (val !== void 0 && val !== null && (typeof val === "string" || Number.isNaN(val) === false)) {
				if (min === null || val < min) min = val;
				if (max === null || val > max) max = val;
			}
		}
		extents[s] = [min, max];
	}
	return extents;
}
/**
* Move an element to the last child of its parent.
* Adapted from d3-selection `.raise`
*/
function raise(node) {
	if (node.nextSibling) node.parentNode?.appendChild(node);
}
//#endregion
//#region node_modules/layerchart/dist/utils/debug.js
var indent = "    ";
function printObject(obj) {
	Object.entries(obj).forEach(([key, value]) => {
		console.log(`${indent}${key}:`, value);
	});
}
function getRgb(clr) {
	const { r, g, b, opacity: o } = rgb(clr);
	if (![
		r,
		g,
		b
	].every((c) => c >= 0 && c <= 255)) return false;
	return {
		r,
		g,
		b,
		o
	};
}
function printValues(scale, method, extraSpace = "") {
	const values = scale[method]();
	const colorValues = colorizeArray(values);
	if (colorValues) printColorArray(colorValues, method, values);
	else console.log(`${indent}${indent}${toTitleCase(method)}:${extraSpace}`, values);
}
function printColorArray(colorValues, method, values) {
	console.log(`${indent}${indent}${toTitleCase(method)}:    %cArray%c(${values.length}) ` + colorValues[0] + "%c ]", "color: #1377e4", "color: #737373", "color: #1478e4", ...colorValues[1], "color: #1478e4");
}
function colorizeArray(arr) {
	const colors = [];
	const a = arr.map((d, i) => {
		const rgbo = getRgb(d);
		if (rgbo !== false) {
			colors.push(rgbo);
			return `%c ${d}${i === arr.length - 1 ? " " : ""}`;
		}
		return d;
	});
	if (colors.length) return [`%c[ ${a.join(", ")}`, colors.map((d) => `background-color: rgba(${d.r}, ${d.g}, ${d.b}, ${d.o}); color:${contrast(d)};`)];
	return null;
}
function printScale(s, scale, acc) {
	const scaleName = findScaleName(scale);
	console.log(`${indent}${s}:`);
	console.log(`${indent}${indent}Accessor: "${acc.toString()}"`);
	console.log(`${indent}${indent}Type: ${scaleName}`);
	printValues(scale, "domain");
	printValues(scale, "range", " ");
}
/**
* Calculate human-perceived lightness from RGB
* This doesn't take opacity into account
* https://stackoverflow.com/a/596243
*/
function contrast({ r, g, b }) {
	return (.2126 * r + .7152 * g + .0722 * b) / 255 > .6 ? "black" : "white";
}
function printDebug(obj) {
	console.log("/********* LayerChart Debug ************/");
	console.log("Bounding box:");
	printObject(obj.boundingBox);
	console.log("Data:");
	console.log(indent, obj.data);
	if (obj.flatData) {
		console.log("flatData:");
		console.log(indent, obj.flatData);
	}
	console.log("Scales:");
	Object.keys(obj.activeGetters).forEach((g) => {
		printScale(g, obj[`${g}Scale`], obj[g]);
	});
	console.log("/************ End LayerChart Debug ***************/\n");
}
//#endregion
//#region node_modules/layerchart/dist/utils/filterObject.js
/**
* Remove undefined fields from an object
* @param obj The object to filter
* @param comparisonObk An object that, for any key, if the key is not present on that object, the
* key will be filtered out. Note, this ignores the value on that object
*/
function filterObject(obj, comparisonObj = {}) {
	return Object.fromEntries(Object.entries(obj).filter(([key, value]) => {
		return value !== void 0 && comparisonObj[key] === void 0;
	}));
}
//#endregion
//#region node_modules/layerchart/dist/contexts/geo.js
/**
* Access or set the current GeoContext.
*/
var _GeoContext = new Context("GeoContext");
function getGeoContext() {
	return _GeoContext.getOr({ projection: void 0 });
}
function setGeoContext(geo) {
	return _GeoContext.set(geo);
}
//#endregion
//#region node_modules/layerchart/dist/components/GeoContext.svelte
function GeoContext($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { projection: projectionProp, fitGeojson, fixedAspectRatio, clipAngle, clipExtent, rotate, scale, translate, center, applyTransform = [], reflectX, reflectY, geoContext: geoContextProp = void 0, children } = $$props;
		const ctx = getChartContext();
		getTransformContext();
		let projection = void 0;
		const geoContext = {
			get projection() {
				return projection;
			},
			set projection(v) {
				projection = v;
			}
		};
		geoContextProp = geoContext;
		setGeoContext(geoContext);
		derived(() => fixedAspectRatio ? [100, 100 / fixedAspectRatio] : [ctx.width, ctx.height]);
		children($$renderer, { geoContext });
		$$renderer.push(`<!---->`);
		bind_props($$props, { geoContext: geoContextProp });
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/layers/Svg.svelte
function Svg($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { ref: refProp = void 0, innerRef: innerRefProp = void 0, zIndex = 0, pointerEvents, viewBox, ignoreTransform = false, center = false, clip = false, class: className, title, defs, children, $$slots, $$events, ...restProps } = $$props;
		let ref = void 0;
		const ctx = getChartContext();
		const transformCtx = getTransformContext();
		const transform = derived(() => {
			if (transformCtx.mode === "canvas" && !ignoreTransform) return `translate(${transformCtx.translate.x},${transformCtx.translate.y}) scale(${transformCtx.scale})`;
			else if (center) return `translate(${center === "x" || center === true ? ctx.width / 2 : 0}, ${center === "y" || center === true ? ctx.height / 2 : 0})`;
		});
		setLayerContext("svg");
		$$renderer.push(`<svg${attributes({
			viewBox,
			width: ctx.containerWidth,
			height: ctx.containerHeight,
			class: clsx(["lc-layout-svg", className]),
			role: "figure",
			...restProps
		}, "svelte-6boec", {
			disablePointerEvents: pointerEvents === false,
			clip
		}, { "z-index": zIndex }, 3)}>`);
		if (typeof title === "function") {
			$$renderer.push("<!--[0-->");
			title($$renderer);
			$$renderer.push(`<!---->`);
		} else if (title) {
			$$renderer.push("<!--[1-->");
			$$renderer.push(`<title class="lc-layout-svg-title">${escape_html(title)}</title>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--><defs>`);
		defs?.($$renderer);
		$$renderer.push(`<!----></defs><g class="lc-layout-svg-g"${attr("transform", `translate(${stringify(ctx.padding.left)}, ${stringify(ctx.padding.top)})`)}>`);
		if (transform()) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<g${attr("transform", transform())} class="lc-layout-svg-g-transform">`);
			children?.($$renderer, { ref });
			$$renderer.push(`<!----></g>`);
		} else {
			$$renderer.push("<!--[-1-->");
			children?.($$renderer, { ref });
			$$renderer.push(`<!---->`);
		}
		$$renderer.push(`<!--]--></g></svg>`);
		bind_props($$props, {
			ref: refProp,
			innerRef: innerRefProp
		});
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/ClipPath.svelte
function ClipPath($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { id = createId("clipPath-", uid), useId, disabled = false, children, clip, $$slots, $$events, ...restProps } = $$props;
		const url = derived(() => `url(#${id})`);
		const layerCtx = getLayerContext();
		if (layerCtx === "svg") {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<defs><clipPath${attributes({
				id,
				...restProps
			}, void 0, void 0, void 0, 3)}>`);
			clip?.($$renderer, { id });
			$$renderer.push(`<!---->`);
			if (useId) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<use${attr("href", `#${stringify(useId)}`)}></use>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></clipPath></defs>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
		if (children) {
			$$renderer.push("<!--[0-->");
			if (disabled || layerCtx !== "svg") {
				$$renderer.push("<!--[0-->");
				children($$renderer, {
					id,
					url: url(),
					useId
				});
				$$renderer.push(`<!---->`);
			} else {
				$$renderer.push("<!--[-1-->");
				$$renderer.push(`<g class="lc-clip-path-g"${attr_style("", { "clip-path": url() })}>`);
				children($$renderer, {
					id,
					url: url(),
					useId
				});
				$$renderer.push(`<!----></g>`);
			}
			$$renderer.push(`<!--]-->`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/Rect.svelte
function Rect($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { height, width, x = 0, y = 0, initialX = x, initialY = y, fill, fillOpacity, stroke, initialHeight = height, initialWidth = width, strokeWidth, opacity, rx: rxProp, ry: ryProp, ref: refProp = void 0, motion, class: className, onclick, ondblclick, onpointerenter, onpointermove, onpointerleave, onpointerover, onpointerout, children, $$slots, $$events, ...restProps } = $$props;
		const rx = derived(() => Number(rxProp ?? ryProp) || 0);
		const ry = derived(() => Number(ryProp ?? rxProp) || 0);
		const motionX = createMotion(initialX, () => x, parseMotionProp(motion, "x"));
		const motionY = createMotion(initialY, () => y, parseMotionProp(motion, "y"));
		const motionWidth = createMotion(initialWidth, () => width, parseMotionProp(motion, "width"));
		const motionHeight = createMotion(initialHeight, () => height, parseMotionProp(motion, "height"));
		const layerCtx = getLayerContext();
		function render(ctx, styleOverrides) {
			renderRect(ctx, {
				x: motionX.current,
				y: motionY.current,
				width: motionWidth.current,
				height: motionHeight.current,
				rx: rx(),
				ry: ry()
			}, styleOverrides ? merge({ styles: { strokeWidth } }, styleOverrides) : {
				styles: {
					fill,
					fillOpacity,
					stroke,
					strokeWidth,
					opacity
				},
				classes: cls("lc-rect", className),
				style: restProps.style
			});
		}
		const fillKey = createKey(() => fill);
		const strokeKey = createKey(() => stroke);
		if (layerCtx === "canvas") registerCanvasComponent({
			name: "Rect",
			render,
			events: {
				click: onclick,
				dblclick: ondblclick,
				pointerenter: onpointerenter,
				pointermove: onpointermove,
				pointerleave: onpointerleave,
				pointerover: onpointerover,
				pointerout: onpointerout
			},
			deps: () => [
				motionX.current,
				motionY.current,
				motionWidth.current,
				motionHeight.current,
				fillKey.current,
				strokeKey.current,
				strokeWidth,
				opacity,
				className,
				restProps.style,
				rx(),
				ry()
			]
		});
		if (layerCtx === "svg") {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<rect${attributes({
				x: motionX.current,
				y: motionY.current,
				width: motionWidth.current,
				height: motionHeight.current,
				fill,
				"fill-opacity": fillOpacity,
				stroke,
				"stroke-width": strokeWidth,
				opacity,
				rx: rx(),
				ry: ry(),
				class: clsx(cls("lc-rect", className)),
				...restProps
			}, void 0, void 0, void 0, 3)}></rect>`);
		} else if (layerCtx === "html") {
			$$renderer.push("<!--[1-->");
			$$renderer.push(`<div${attributes({
				class: clsx(cls("lc-rect", className)),
				...restProps
			}, void 0, void 0, {
				position: "absolute",
				left: `${stringify(motionX.current)}px`,
				top: `${stringify(motionY.current)}px`,
				width: `${stringify(motionWidth.current)}px`,
				height: `${stringify(motionHeight.current)}px`,
				background: fill,
				"background-opacity": opacity,
				"border-width": `${stringify(strokeWidth)}px`,
				"border-style": "solid",
				"border-color": stroke,
				"border-radius": `${stringify(rx())}px`
			})}>`);
			children?.($$renderer);
			$$renderer.push(`<!----></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
		bind_props($$props, { ref: refProp });
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/RectClipPath.svelte
function RectClipPath($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { id = createId("clipPath-", uid), x = 0, y = 0, disabled = false, children: childrenProp, $$slots, $$events, ...restProps } = $$props;
		{
			function clip($$renderer) {
				Rect($$renderer, spread_props([{
					x,
					y
				}, extractLayerProps(restProps, "lc-clip-path-rect")]));
			}
			function children($$renderer, { url }) {
				childrenProp?.($$renderer, {
					id,
					url
				});
				$$renderer.push(`<!---->`);
			}
			ClipPath($$renderer, {
				id,
				disabled,
				clip,
				children,
				$$slots: {
					clip: true,
					default: true
				}
			});
		}
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/ChartClipPath.svelte
function ChartClipPath($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { full = false, disabled = false, $$slots, $$events, ...restProps } = $$props;
		const ctx = getChartContext();
		RectClipPath($$renderer, spread_props([{
			x: full && ctx.padding.left ? -ctx.padding.left : 0,
			y: full && ctx.padding.top ? -ctx.padding.top : 0,
			disabled,
			height: ctx.height + (full ? (ctx.padding?.top ?? 0) + (ctx.padding?.bottom ?? 0) : 0),
			width: ctx.width + (full ? (ctx.padding?.left ?? 0) + (ctx.padding?.right ?? 0) : 0)
		}, extractLayerProps(restProps, "lc-chart-clip-path")]));
	});
}
//#endregion
//#region node_modules/layerchart/dist/utils/geo.js
/**
* Render a geoPath() using curve factory
* @see {@link https://observablehq.com/@d3/context-to-curve}
*/
function geoCurvePath(projection, curve, context) {
	const pathContext = context === void 0 ? path() : context;
	const geoPath$2 = geoPath(projection, curveContext(curve(pathContext)));
	const fn = (object) => {
		geoPath$2(object);
		return context === void 0 ? pathContext + "" : void 0;
	};
	Object.setPrototypeOf(fn, geoPath$2);
	return fn;
}
/**
* Translate Curve to GeoContext interface
*/
function curveContext(curve) {
	return {
		beginPath() {},
		moveTo(x, y) {
			curve.lineStart();
			curve.point(x, y);
		},
		arc(x, y, radius, startAngle, endAngle, anticlockwise) {},
		lineTo(x, y) {
			curve.point(x, y);
		},
		closePath() {
			curve.lineEnd();
		}
	};
}
function geoFitObjectTransform(projection, size, object) {
	const newProjection = projection.fitSize(size, object);
	const translate = newProjection.translate();
	return {
		translate: {
			x: translate[0],
			y: translate[1]
		},
		scale: newProjection.scale()
	};
}
//#endregion
//#region node_modules/layerchart/dist/components/GeoPath.svelte
function GeoPath($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { geoTransform: geoTransform$1, geojson, tooltipContext, curve = curveLinearClosed, onclick, onpointerenter, onpointermove, onpointerleave, class: className, ref: refProp = void 0, children, $$slots, $$events, ...restProps } = $$props;
		const geo = getGeoContext();
		const projection = derived(() => geoTransform$1 && geo.projection ? geoTransform(geoTransform$1(geo.projection)) : geo.projection);
		const geoPath$1 = derived(() => {
			if (!projection()) return;
			if (curve === curveLinearClosed) return geoPath(projection());
			return geoCurvePath(projection(), curve);
		});
		const pathData = derived(() => geojson ? geoPath$1()?.(geojson) : "");
		function _onClick(e) {
			onclick?.(e, geoPath$1());
		}
		function _onPointerEnter(e) {
			onpointerenter?.(e);
			tooltipContext?.show(e, geojson);
		}
		function _onPointerMove(e) {
			onpointermove?.(e);
			tooltipContext?.show(e, geojson);
		}
		function _onPointerLeave(e) {
			onpointerleave?.(e);
			tooltipContext?.hide();
		}
		if (children) {
			$$renderer.push("<!--[0-->");
			children($$renderer, { geoPath: geoPath$1() });
			$$renderer.push(`<!---->`);
		} else {
			$$renderer.push("<!--[-1-->");
			Path($$renderer, spread_props([
				{ pathData: pathData() },
				restProps,
				{
					onclick: _onClick,
					onpointerenter: tooltipContext || onpointerenter ? _onPointerEnter : void 0,
					onpointermove: tooltipContext || onpointermove ? _onPointerMove : void 0,
					onpointerleave: tooltipContext || onpointerleave ? _onPointerLeave : void 0,
					class: cls("lc-geo-path", className),
					pathRef: refProp
				}
			]));
		}
		$$renderer.push(`<!--]-->`);
		bind_props($$props, { ref: refProp });
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/Circle.svelte
function Circle($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { cx = 0, initialCx: initialCxProp, cy = 0, initialCy: initialCyProp, r = 1, initialR: initialRProp, motion, fill, fillOpacity, stroke, strokeWidth, opacity, class: className, ref: refProp = void 0, children, $$slots, $$events, ...restProps } = $$props;
		const initialCx = initialCxProp ?? cx;
		const initialCy = initialCyProp ?? cy;
		const initialR = initialRProp ?? r;
		const layerCtx = getLayerContext();
		const motionCx = createMotion(initialCx, () => cx, motion);
		const motionCy = createMotion(initialCy, () => cy, motion);
		const motionR = createMotion(initialR, () => r, motion);
		function render(ctx, styleOverrides) {
			renderCircle(ctx, {
				cx: motionCx.current,
				cy: motionCy.current,
				r: motionR.current
			}, styleOverrides ? merge({ styles: { strokeWidth } }, styleOverrides) : {
				styles: {
					fill,
					fillOpacity,
					stroke,
					strokeWidth,
					opacity
				},
				classes: cls("lc-circle", className),
				style: restProps.style
			});
		}
		const fillKey = createKey(() => fill);
		const strokeKey = createKey(() => stroke);
		if (layerCtx === "canvas") registerCanvasComponent({
			name: "Circle",
			render,
			events: {
				click: restProps.onclick,
				pointerdown: restProps.onpointerdown,
				pointerenter: restProps.onpointerenter,
				pointermove: restProps.onpointermove,
				pointerleave: restProps.onpointerleave
			},
			deps: () => [
				motionCx.current,
				motionCy.current,
				motionR.current,
				fillKey.current,
				fillOpacity,
				strokeKey.current,
				strokeWidth,
				opacity,
				className,
				restProps.style
			]
		});
		if (layerCtx === "svg") {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<circle${attributes({
				cx: motionCx.current,
				cy: motionCy.current,
				r: motionR.current,
				fill,
				"fill-opacity": fillOpacity,
				stroke,
				"stroke-width": strokeWidth,
				opacity,
				class: clsx(cls("lc-circle", className)),
				...restProps
			}, void 0, void 0, void 0, 3)}></circle>`);
		} else if (layerCtx === "html") {
			$$renderer.push("<!--[1-->");
			$$renderer.push(`<div${attributes({
				class: clsx(cls("lc-circle", className)),
				...restProps
			}, void 0, void 0, {
				position: "absolute",
				left: `${stringify(motionCx.current)}px`,
				top: `${stringify(motionCy.current)}px`,
				width: `${stringify(motionR.current * 2)}px`,
				height: `${stringify(motionR.current * 2)}px`,
				"border-radius": "50%",
				"background-color": fill,
				opacity,
				"border-width": strokeWidth,
				"border-color": stroke,
				"border-style": "solid",
				transform: "translate(-50%, -50%)"
			})}>`);
			children?.($$renderer);
			$$renderer.push(`<!----></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
		bind_props($$props, { ref: refProp });
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/CircleClipPath.svelte
function CircleClipPath($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { id = createId("clipPath-", uid), cx = 0, cy = 0, r, motion, disabled = false, ref: refProp = void 0, children, $$slots, $$events, ...restProps } = $$props;
		let ref = void 0;
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			{
				function clip($$renderer) {
					Circle($$renderer, spread_props([
						{
							cx,
							cy,
							r,
							motion
						},
						extractLayerProps(restProps, "lc-clip-path-circle"),
						{
							get ref() {
								return ref;
							},
							set ref($$value) {
								ref = $$value;
								$$settled = false;
							}
						}
					]));
				}
				ClipPath($$renderer, {
					id,
					disabled,
					children,
					clip,
					$$slots: { clip: true }
				});
			}
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { ref: refProp });
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/Voronoi.svelte
function Voronoi($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { data, r, classes = {}, onclick, onpointerenter, onpointerdown, onpointermove, class: className, $$slots, $$events, ...restProps } = $$props;
		const ctx = getChartContext();
		const geo = getGeoContext();
		const points = derived(() => (data ?? ctx.flatData).map((d) => {
			const xValue = geo.projection ? ctx.x(d) : ctx.xGet(d);
			const yValue = geo.projection ? ctx.y(d) : ctx.yGet(d);
			const x = Array.isArray(xValue) ? min(xValue) : xValue;
			const y = Array.isArray(yValue) ? min(yValue) : yValue;
			let point;
			if (ctx.radial) {
				const radialPoint = pointRadial(x, y);
				point = [radialPoint[0] + ctx.width / 2, radialPoint[1] + ctx.height / 2];
			} else point = [x, y];
			point.data = d;
			return point;
		}));
		const boundWidth = derived(() => Math.max(ctx.width, 0));
		const boundHeight = derived(() => Math.max(ctx.height, 0));
		const disableClip = derived(() => r === 0 || r == null || r === Infinity);
		Group($$renderer, spread_props([restProps, {
			class: cls("lc-voronoi-g", classes.root, className),
			children: ($$renderer) => {
				if (geo.projection) {
					$$renderer.push("<!--[0-->");
					const polygons = geoVoronoi().polygons(points());
					$$renderer.push(`<!--[-->`);
					const each_array = ensure_array_like(polygons.features);
					for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
						let feature = each_array[$$index];
						const point = r ? geo.projection?.(feature.properties.sitecoordinates) : null;
						CircleClipPath($$renderer, {
							cx: point?.[0],
							cy: point?.[1],
							r: r ?? 0,
							disabled: point == null || disableClip(),
							children: ($$renderer) => {
								GeoPath($$renderer, {
									geojson: feature,
									class: ["lc-voronoi-geo-path", classes.path],
									onclick: (e) => onclick?.(e, {
										data: feature.properties.site.data,
										feature
									}),
									onpointerenter: (e) => onpointerenter?.(e, {
										data: feature.properties.site.data,
										feature
									}),
									onpointermove: (e) => onpointermove?.(e, {
										data: feature.properties.site.data,
										feature
									}),
									onpointerdown: (e) => onpointerdown?.(e, {
										data: feature.properties.site.data,
										feature
									}),
									onpointerleave,
									ontouchmove: (e) => {
										e.preventDefault();
									}
								});
							},
							$$slots: { default: true }
						});
					}
					$$renderer.push(`<!--]-->`);
				} else {
					$$renderer.push("<!--[-1-->");
					const voronoi = Delaunay.from(points()).voronoi([
						0,
						0,
						boundWidth(),
						boundHeight()
					]);
					$$renderer.push(`<!--[-->`);
					const each_array_1 = ensure_array_like(points());
					for (let i = 0, $$length = each_array_1.length; i < $$length; i++) {
						let point = each_array_1[i];
						const pathData = voronoi.renderCell(i);
						if (pathData) {
							$$renderer.push("<!--[0-->");
							CircleClipPath($$renderer, {
								cx: point[0],
								cy: point[1],
								r: r ?? 0,
								disabled: disableClip(),
								children: ($$renderer) => {
									Path($$renderer, {
										pathData,
										class: ["lc-voronoi-path", classes.path],
										onclick: (e) => onclick?.(e, {
											data: point.data,
											point
										}),
										onpointerenter: (e) => onpointerenter?.(e, {
											data: point.data,
											point
										}),
										onpointermove: (e) => onpointermove?.(e, {
											data: point.data,
											point
										}),
										onpointerleave,
										onpointerdown: (e) => onpointerdown?.(e, {
											data: point.data,
											point
										}),
										ontouchmove: (e) => {
											e.preventDefault();
										}
									});
								},
								$$slots: { default: true }
							});
						} else $$renderer.push("<!--[-1-->");
						$$renderer.push(`<!--]-->`);
					}
					$$renderer.push(`<!--]-->`);
				}
				$$renderer.push(`<!--]-->`);
			},
			$$slots: { default: true }
		}]));
	});
}
//#endregion
//#region node_modules/layerchart/dist/utils/quadtree.js
/**
* Transverse quadtree and generate rect dimensions
*/
function quadtreeRects(quadtree, showLeaves = true) {
	const rects = [];
	quadtree.visit((node, x0, y0, x1, y1) => {
		if (showLeaves || Array.isArray(node)) rects.push({
			x: x0,
			y: y0,
			width: x1 - x0,
			height: y1 - y0
		});
	});
	return rects;
}
//#endregion
//#region node_modules/layerchart/dist/utils/types.js
/**
* Useful to workaround Svelte 3/4 markup type issues
* TODO: Remove usage after migrating to Svelte 5
*/
function asAny(x) {
	return x;
}
//#endregion
//#region node_modules/layerchart/dist/components/tooltip/tooltipMetaContext.js
function handleBarTooltipPayload({ ctx, data, metaCtx }) {
	return (metaCtx.stackSeries ? [...metaCtx.visibleSeries].reverse() : metaCtx.visibleSeries).map((s) => {
		const seriesTooltipData = s.data ? findRelatedData(s.data, data, ctx.x) : data;
		const valueAccessor = accessor(s.value ?? (s.data ? ctx.y : s.key));
		const label = metaCtx.orientation === "vertical" ? ctx.x(data) : ctx.y(data);
		const name = s.label ?? (s.key !== "default" ? s.key : "value");
		const value = seriesTooltipData ? valueAccessor(seriesTooltipData) : void 0;
		const color = s.color ?? ctx.cScale?.(ctx.c(data));
		return {
			...s.data,
			chartType: "bar",
			color,
			label,
			name,
			value,
			valueAccessor,
			key: s.key,
			payload: data,
			rawSeriesData: s,
			formatter: format
		};
	});
}
function handleAreaTooltipPayload({ ctx, data, metaCtx }) {
	return (metaCtx.stackSeries ? [...metaCtx.visibleSeries].reverse() : metaCtx.visibleSeries).map((s) => {
		const seriesTooltipData = s.data ? findRelatedData(s.data, data, ctx.x) : data;
		const valueAccessor = accessor(s.value ?? (s.data ? asAny(ctx.y) : s.key));
		const label = ctx.x(data);
		const name = s.label ?? (s.key !== "default" ? s.key : "value");
		const value = seriesTooltipData ? valueAccessor(seriesTooltipData) : void 0;
		const color = s.color ?? ctx.cScale?.(ctx.c(data));
		return {
			...s.data,
			chartType: "area",
			color,
			label,
			name,
			value,
			valueAccessor,
			key: s.key,
			payload: data,
			rawSeriesData: s,
			formatter: format
		};
	});
}
function handleLineTooltipPayload({ ctx, data, metaCtx }) {
	return metaCtx.visibleSeries.map((s) => {
		const seriesTooltipData = s.data ? findRelatedData(s.data, data, ctx.x) : data;
		const label = ctx.x(data);
		const valueAccessor = accessor(s.value ?? (s.data ? asAny(ctx.y) : s.key));
		const name = s.label ?? (s.key !== "default" ? s.key : "value");
		const value = seriesTooltipData ? valueAccessor(seriesTooltipData) : void 0;
		const color = s.color ?? ctx.cScale?.(ctx.c(data));
		return {
			...s.data,
			chartType: "line",
			color,
			label,
			name,
			value,
			valueAccessor,
			key: s.key,
			payload: data,
			rawSeriesData: s,
			formatter: format
		};
	});
}
function handlePieOrArcTooltipPayload({ ctx, data, metaCtx }) {
	const keyAccessor = accessor(metaCtx.key);
	const labelAccessor = accessor(metaCtx.label);
	const valueAccessor = accessor(metaCtx.value);
	const colorAccessor = accessor(metaCtx.color);
	return [{
		key: keyAccessor(data),
		label: labelAccessor(data) || keyAccessor(data),
		value: valueAccessor(data),
		color: colorAccessor(data) ?? ctx.cScale?.(ctx.c(data)),
		payload: data,
		chartType: "pie",
		labelAccessor,
		keyAccessor,
		valueAccessor,
		colorAccessor
	}];
}
function handleScatterTooltipPayload({ ctx, data, metaCtx }) {
	return [{
		payload: data,
		key: ""
	}];
}
var _TooltipMetaContext = new Context("TooltipMetaContext");
/**
* Retrieves the current tooltip meta context value, or null if not set.
*/
function getTooltipMetaContext() {
	return _TooltipMetaContext.getOr(null);
}
/**
* Sets the tooltip meta context value, used to provide additional payload data to the tooltip.
* This is typically set by the various simplified chart components, such as BarChart, AreaChart,
* etc.
*/
function setTooltipMetaContext(v) {
	return _TooltipMetaContext.set(v);
}
function getTooltipPayload({ ctx, tooltipData, metaCtx }) {
	if (!metaCtx) return [{
		payload: tooltipData,
		key: ""
	}];
	switch (metaCtx.type) {
		case "bar": return handleBarTooltipPayload({
			ctx,
			data: tooltipData,
			metaCtx
		});
		case "area": return handleAreaTooltipPayload({
			ctx,
			data: tooltipData,
			metaCtx
		});
		case "line": return handleLineTooltipPayload({
			ctx,
			data: tooltipData,
			metaCtx
		});
		case "pie":
		case "arc": return handlePieOrArcTooltipPayload({
			ctx,
			data: tooltipData,
			metaCtx
		});
		case "scatter": return handleScatterTooltipPayload({
			ctx,
			data: tooltipData,
			metaCtx
		});
	}
}
//#endregion
//#region node_modules/layerchart/dist/contexts/tooltip.js
var _TooltipContext = new Context("TooltipContext");
function getTooltipContext() {
	return _TooltipContext.get();
}
function setTooltipContext(tooltip) {
	return _TooltipContext.set(tooltip);
}
//#endregion
//#region node_modules/layerchart/dist/components/tooltip/TooltipContext.svelte
function TooltipContext($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const ctx = getChartContext();
		const geoCtx = getGeoContext();
		let { ref: refProp = void 0, debug = false, findTooltipData = "closest", hideDelay = 0, locked = false, touchEvents = "pan-y", mode = "manual", onclick = () => {}, radius = Infinity, raiseTarget = false, tooltipContext: tooltipContextProp = void 0, children } = $$props;
		let ref = void 0;
		let x = 0;
		let y = 0;
		let data = null;
		let payload = [];
		/**
		* If we're hovering the tooltip area on the chart
		*/
		let isHoveringTooltipArea = false;
		/**
		* If we're hovering the tooltip content container
		*/
		let isHoveringTooltipContent = false;
		const metaCtx = getTooltipMetaContext();
		const tooltipContext = {
			get x() {
				return x;
			},
			get y() {
				return y;
			},
			get data() {
				return data;
			},
			get payload() {
				return payload;
			},
			show: showTooltip,
			hide: hideTooltip,
			get mode() {
				return mode;
			},
			get isHoveringTooltipArea() {
				return isHoveringTooltipArea;
			},
			get isHoveringTooltipContent() {
				return isHoveringTooltipContent;
			},
			set isHoveringTooltipContent(value) {
				isHoveringTooltipContent = value;
			}
		};
		tooltipContextProp = tooltipContext;
		setTooltipContext(tooltipContext);
		let hideTimeoutId;
		const bisectX = bisector((d) => {
			const value = ctx.x(d);
			if (Array.isArray(value)) return value[0];
			else return value;
		}).left;
		const bisectY = bisector((d) => {
			const value = ctx.y(d);
			if (Array.isArray(value)) return value[0];
			else return value;
		}).left;
		function findData(previousValue, currentValue, valueAtPoint, accessor) {
			switch (findTooltipData) {
				case "closest": if (currentValue === void 0) return previousValue;
				else if (previousValue === void 0) return currentValue;
				else return Number(valueAtPoint) - Number(accessor(previousValue)) > Number(accessor(currentValue)) - Number(valueAtPoint) ? currentValue : previousValue;
				case "left": return previousValue;
				default: return currentValue;
			}
		}
		function showTooltip(e, tooltipData) {
			if (hideTimeoutId) clearTimeout(hideTimeoutId);
			if (locked) return;
			const point = localPoint(e, e.target.closest(".lc-root-container"));
			if (ref !== void 0 && tooltipData == null && (point.x < ref.offsetLeft || point.x > ref.offsetLeft + ref.offsetWidth || point.y < ref.offsetTop || point.y > ref.offsetTop + ref.offsetHeight)) {
				hideTooltip();
				return;
			}
			if (tooltipData == null) switch (mode) {
				case "bisect-x": {
					let xValueAtPoint;
					if (ctx.radial) {
						const { radians } = cartesianToPolar(point.x - ctx.width / 2, point.y - ctx.height / 2);
						xValueAtPoint = scaleInvert(ctx.xScale, radians);
					} else xValueAtPoint = scaleInvert(ctx.xScale, point.x - ctx.padding.left);
					const index = bisectX(ctx.flatData, xValueAtPoint, 1);
					const previousValue = ctx.flatData[index - 1];
					const currentValue = ctx.flatData[index];
					tooltipData = findData(previousValue, currentValue, xValueAtPoint, ctx.x);
					break;
				}
				case "bisect-y": {
					const yValueAtPoint = scaleInvert(ctx.yScale, point.y - ctx.padding.top);
					const index = bisectY(ctx.flatData, yValueAtPoint, 1);
					const previousValue = ctx.flatData[index - 1];
					const currentValue = ctx.flatData[index];
					tooltipData = findData(previousValue, currentValue, yValueAtPoint, ctx.y);
					break;
				}
				case "bisect-band": {
					const xValueAtPoint = scaleInvert(ctx.xScale, point.x);
					const yValueAtPoint = scaleInvert(ctx.yScale, point.y);
					if (isScaleBand(ctx.xScale)) {
						const bandData = ctx.flatData.filter((d) => ctx.x(d) === xValueAtPoint).sort(sortFunc(ctx.y));
						const index = bisectY(bandData, yValueAtPoint, 1);
						const previousValue = bandData[index - 1];
						const currentValue = bandData[index];
						tooltipData = findData(previousValue, currentValue, yValueAtPoint, ctx.y);
					} else if (isScaleBand(ctx.yScale)) {
						const bandData = ctx.flatData.filter((d) => ctx.y(d) === yValueAtPoint).sort(sortFunc(ctx.x));
						const index = bisectX(bandData, xValueAtPoint, 1);
						const previousValue = bandData[index - 1];
						const currentValue = bandData[index];
						tooltipData = findData(previousValue, currentValue, xValueAtPoint, ctx.x);
					}
					break;
				}
				case "quadtree-x":
				case "quadtree-y":
				case "quadtree":
					tooltipData = quadtree$1()?.find(point.x - ctx.padding.left, point.y - ctx.padding.top, radius);
					break;
			}
			if (tooltipData) {
				if (raiseTarget) raise(e.target);
				const payloadData = getTooltipPayload({
					ctx,
					tooltipData,
					metaCtx
				});
				x = point.x;
				y = point.y;
				data = tooltipData;
				payload = payloadData;
			} else hideTooltip();
		}
		function hideTooltip() {
			if (locked) return;
			isHoveringTooltipArea = false;
			hideTimeoutId = setTimeout(() => {
				if (!isHoveringTooltipArea && !isHoveringTooltipContent) {
					data = null;
					payload = [];
				}
			}, hideDelay);
		}
		const quadtree$1 = derived(() => {
			if ([
				"quadtree",
				"quadtree-x",
				"quadtree-y"
			].includes(mode)) return quadtree().x((d) => {
				if (mode === "quadtree-y") return 0;
				if (geoCtx.projection) {
					const lat = ctx.x(d);
					const long = ctx.y(d);
					return (geoCtx.projection([lat, long]) ?? [0, 0])[0];
				}
				const value = ctx.xGet(d);
				if (Array.isArray(value)) return min(value);
				else return value;
			}).y((d) => {
				if (mode === "quadtree-x") return 0;
				if (geoCtx.projection) {
					const lat = ctx.x(d);
					const long = ctx.y(d);
					return (geoCtx.projection([lat, long]) ?? [0, 0])[1];
				}
				const value = ctx.yGet(d);
				if (Array.isArray(value)) return min(value);
				else return value;
			}).addAll(ctx.flatData);
		});
		const rects = derived(() => {
			if (mode === "bounds" || mode === "band") return ctx.flatData.map((d) => {
				const xValue = ctx.xGet(d);
				const yValue = ctx.yGet(d);
				const x = Array.isArray(xValue) ? xValue[0] : xValue;
				const y = Array.isArray(yValue) ? yValue[0] : yValue;
				const xOffset = isScaleBand(ctx.xScale) ? ctx.xScale.padding() * ctx.xScale.step() / 2 : 0;
				const yOffset = isScaleBand(ctx.yScale) ? ctx.yScale.padding() * ctx.yScale.step() / 2 : 0;
				const fullWidth = max(ctx.xRange) - min(ctx.xRange);
				const fullHeight = max(ctx.yRange) - min(ctx.yRange);
				if (mode === "band") if (isScaleBand(ctx.xScale)) return {
					x: x - xOffset,
					y: isScaleBand(ctx.yScale) ? y - yOffset : min(ctx.yRange),
					width: ctx.xScale.step(),
					height: isScaleBand(ctx.yScale) ? ctx.yScale.step() : fullHeight,
					data: d
				};
				else if (isScaleBand(ctx.yScale)) return {
					x: isScaleBand(ctx.xScale) ? x - xOffset : min(ctx.xRange),
					y: y - yOffset,
					width: isScaleBand(ctx.xScale) ? ctx.xScale.step() : fullWidth,
					height: ctx.yScale.step(),
					data: d
				};
				else if (ctx.xInterval) {
					const xVal = ctx.x(d);
					const start = ctx.xInterval.floor(xVal);
					const end = ctx.xInterval.offset(start);
					const xStart = ctx.xScale(start);
					const xEnd = ctx.xScale(end);
					return {
						x: Math.min(xStart, xEnd),
						y: isScaleBand(ctx.yScale) ? y - yOffset : min(ctx.yRange),
						width: Math.abs(xEnd - xStart),
						height: isScaleBand(ctx.yScale) ? ctx.yScale.step() : fullHeight,
						data: d
					};
				} else if (ctx.yInterval) {
					const yVal = ctx.y(d);
					const start = ctx.yInterval.floor(yVal);
					const end = ctx.yInterval.offset(start);
					const yStart = ctx.yScale(start);
					const yEnd = ctx.yScale(end);
					return {
						x: isScaleBand(ctx.xScale) ? x - xOffset : min(ctx.xRange),
						y: Math.min(yStart, yEnd),
						width: isScaleBand(ctx.xScale) ? ctx.xScale.step() : fullWidth,
						height: Math.abs(yEnd - yStart),
						data: d
					};
				} else if (isScaleTime(ctx.xScale)) {
					const index = ctx.flatData.findIndex((d2) => Number(ctx.x(d2)) === Number(ctx.x(d)));
					const nextDataPoint = index + 1 === ctx.flatData.length ? max(ctx.xDomain) : ctx.x(ctx.flatData[index + 1]);
					return {
						x: x - xOffset,
						y: isScaleBand(ctx.yScale) ? y - yOffset : min(ctx.yRange),
						width: (ctx.xScale(nextDataPoint) ?? 0) - (xValue ?? 0),
						height: isScaleBand(ctx.yScale) ? ctx.yScale.step() : fullHeight,
						data: d
					};
				} else if (isScaleTime(ctx.yScale)) {
					const index = ctx.flatData.findIndex((d2) => Number(ctx.y(d2)) === Number(ctx.y(d)));
					const nextDataPoint = index + 1 === ctx.flatData.length ? max(ctx.yDomain) : ctx.y(ctx.flatData[index + 1]);
					return {
						x: isScaleBand(ctx.xScale) ? x - xOffset : min(ctx.xRange),
						y: y - yOffset,
						width: isScaleBand(ctx.xScale) ? ctx.xScale.step() : fullWidth,
						height: (ctx.yScale(nextDataPoint) ?? 0) - (yValue ?? 0),
						data: d
					};
				} else {
					console.warn("[layerchart] TooltipContext band mode requires at least one scale to be band or time.");
					return;
				}
				else if (mode === "bounds") return {
					x: isScaleBand(ctx.xScale) || Array.isArray(xValue) ? x - xOffset : min(ctx.xRange),
					y: y - yOffset,
					width: Array.isArray(xValue) ? xValue[1] - xValue[0] : isScaleBand(ctx.xScale) ? ctx.xScale.step() : min(ctx.xRange) + x,
					height: Array.isArray(yValue) ? yValue[1] - yValue[0] : isScaleBand(ctx.yScale) ? ctx.yScale.step() : max(ctx.yRange) - y,
					data: d
				};
			}).filter((x) => x !== void 0).sort(sortFunc("x"));
			return [];
		});
		const triggerPointerEvents = derived(() => [
			"bisect-x",
			"bisect-y",
			"bisect-band",
			"quadtree",
			"quadtree-x",
			"quadtree-y"
		].includes(mode));
		$$renderer.push(`<div${attr_class("lc-tooltip-context svelte-mdxi5d", void 0, { "debug": debug && triggerPointerEvents() })}${attr_style("", {
			top: `${stringify(ctx.padding.top)}px`,
			left: `${stringify(ctx.padding.left)}px`,
			width: `${stringify(ctx.width)}px`,
			height: `${stringify(ctx.height)}px`,
			"--touch-action": touchEvents
		})}><div class="lc-tooltip-context-container svelte-mdxi5d"${attr_style("", {
			top: `-${stringify(ctx.padding.top ?? 0)}px`,
			left: `-${stringify(ctx.padding.left ?? 0)}px`,
			width: `${stringify(ctx.containerWidth)}px`,
			height: `${stringify(ctx.containerHeight)}px`
		})}>`);
		children?.($$renderer, { tooltipContext });
		$$renderer.push(`<!----> `);
		if (mode === "voronoi") {
			$$renderer.push("<!--[0-->");
			Svg($$renderer, {
				children: ($$renderer) => {
					Voronoi($$renderer, {
						r: radius,
						onpointerenter: (e, { data }) => {
							showTooltip(e, data);
						},
						onpointermove: (e, { data }) => {
							showTooltip(e, data);
						},
						onpointerleave: () => hideTooltip(),
						onpointerdown: (e) => {
							if (e.target?.hasPointerCapture(e.pointerId)) e.target.releasePointerCapture(e.pointerId);
						},
						onclick: (e, { data }) => {
							onclick(e, { data });
						},
						classes: { path: cls("lc-tooltip-voronoi-path", debug && "debug") }
					});
				},
				$$slots: { default: true }
			});
		} else if (mode === "bounds" || mode === "band") {
			$$renderer.push("<!--[1-->");
			Svg($$renderer, {
				center: ctx.radial,
				children: ($$renderer) => {
					$$renderer.push(`<g class="lc-tooltip-rects-g"><!--[-->`);
					const each_array = ensure_array_like(rects());
					for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
						let rect = each_array[$$index];
						if (ctx.radial) {
							$$renderer.push("<!--[0-->");
							Arc($$renderer, {
								innerRadius: rect.y,
								outerRadius: rect.y + rect.height,
								startAngle: rect.x,
								endAngle: rect.x + rect.width,
								class: cls("lc-tooltip-rect", debug && "debug"),
								onpointerenter: (e) => showTooltip(e, rect?.data),
								onpointermove: (e) => showTooltip(e, rect?.data),
								onpointerleave: () => hideTooltip(),
								onpointerdown: (e) => {
									const target = e.target;
									if (target?.hasPointerCapture(e.pointerId)) target.releasePointerCapture(e.pointerId);
								},
								onclick: (e) => {
									onclick(e, { data: rect?.data });
								}
							});
						} else {
							$$renderer.push("<!--[-1-->");
							$$renderer.push(`<rect${attr("x", rect?.x)}${attr("y", rect?.y)}${attr("width", rect?.width)}${attr("height", rect?.height)}${attr_class(clsx(cls("lc-tooltip-rect", debug && "debug")), "svelte-mdxi5d")}></rect>`);
						}
						$$renderer.push(`<!--]-->`);
					}
					$$renderer.push(`<!--]--></g>`);
				},
				$$slots: { default: true }
			});
		} else if ([
			"quadtree",
			"quadtree-x",
			"quadtree-y"
		].includes(mode) && debug) {
			$$renderer.push("<!--[2-->");
			Svg($$renderer, {
				pointerEvents: false,
				children: ($$renderer) => {
					ChartClipPath($$renderer, {
						children: ($$renderer) => {
							$$renderer.push(`<g class="lc-tooltip-quadtree-g">`);
							if (quadtree$1()) {
								$$renderer.push("<!--[0-->");
								$$renderer.push(`<!--[-->`);
								const each_array_1 = ensure_array_like(quadtreeRects(quadtree$1(), false));
								for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
									let rect = each_array_1[$$index_1];
									$$renderer.push(`<rect${attr("x", rect.x)}${attr("y", rect.y)}${attr("width", rect.width)}${attr("height", rect.height)}${attr_class(clsx(cls("lc-tooltip-quadtree-rect", debug && "debug")), "svelte-mdxi5d")}></rect>`);
								}
								$$renderer.push(`<!--]-->`);
							} else $$renderer.push("<!--[-1-->");
							$$renderer.push(`<!--]--></g>`);
						},
						$$slots: { default: true }
					});
				},
				$$slots: { default: true }
			});
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div></div>`);
		bind_props($$props, {
			ref: refProp,
			tooltipContext: tooltipContextProp
		});
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/BrushContext.svelte
var _BrushContext = new Context("BrushContext");
function setBrushContext(brush) {
	return _BrushContext.set(brush);
}
function BrushContext($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const ctx = getChartContext();
		let { brushContext: brushContextProp = void 0, axis = "x", handleSize = 5, resetOnEnd = false, ignoreResetClick = false, xDomain, yDomain, mode = "integrated", disabled = false, range = {}, handle = {}, classes = {}, onBrushEnd = () => {}, onBrushStart = () => {}, onChange = () => {}, onReset = () => {}, children } = $$props;
		let rootEl = void 0;
		if (xDomain === void 0) xDomain = ctx.xScale.domain();
		if (yDomain === void 0) yDomain = ctx.yScale.domain();
		const ogXDomain = xDomain;
		const ogYDomain = yDomain;
		ctx.config.xDomain;
		ctx.config.yDomain;
		const xDomainMinMax = derived(() => extent(ctx.xScale.domain()));
		const xDomainMin = derived(() => xDomainMinMax()[0]);
		const xDomainMax = derived(() => xDomainMinMax()[1]);
		const yDomainMinMax = derived(() => extent(ctx.yScale.domain()));
		const yDomainMin = derived(() => yDomainMinMax()[0]);
		const yDomainMax = derived(() => yDomainMinMax()[1]);
		const top = derived(() => ctx.yScale(yDomain?.[1]));
		const bottom = derived(() => ctx.yScale(yDomain?.[0]));
		const left = derived(() => ctx.xScale(xDomain?.[0]));
		const right = derived(() => ctx.xScale(xDomain?.[1]));
		const _range = derived(() => ({
			x: axis === "both" || axis === "x" ? left() : 0,
			y: axis === "both" || axis === "y" ? top() : 0,
			width: axis === "both" || axis === "x" ? right() - left() : ctx.width,
			height: axis === "both" || axis === "y" ? bottom() - top() : ctx.height
		}));
		let isActive = false;
		const brushContext = {
			get xDomain() {
				return xDomain;
			},
			set xDomain(v) {
				xDomain = v;
			},
			get yDomain() {
				return yDomain;
			},
			set yDomain(v) {
				yDomain = v;
			},
			get isActive() {
				return isActive;
			},
			set isActive(v) {
				isActive = v;
			},
			get range() {
				return _range();
			},
			get handleSize() {
				return handleSize;
			}
		};
		brushContextProp = brushContext;
		setBrushContext(brushContext);
		const logger = new Logger("BrushContext");
		const RESET_THRESHOLD = 1;
		function handler(fn) {
			return (e) => {
				logger.debug("drag start");
				e.stopPropagation();
				const startPoint = localPoint(e, rootEl);
				if (startPoint && (startPoint.x < 0 || startPoint.x > ctx.width || startPoint.y < 0 || startPoint.y > ctx.height)) {
					logger.debug("ignoring click as outside of chart bounds", {
						startPoint,
						width: ctx.width,
						height: ctx.height
					});
					return;
				}
				const start = {
					xDomain: [xDomain?.[0] ?? xDomainMin(), xDomain?.[1] ?? xDomainMax()],
					yDomain: [yDomain?.[0] ?? yDomainMin(), yDomain?.[1] ?? yDomainMax()],
					value: {
						x: scaleInvert(ctx.xScale, startPoint?.x ?? 0),
						y: scaleInvert(ctx.yScale, startPoint?.y ?? 0)
					}
				};
				onBrushStart({
					xDomain,
					yDomain
				});
				const onPointerMove = (e) => {
					const currentPoint = localPoint(e, rootEl);
					fn(start, {
						x: scaleInvert(ctx.xScale, currentPoint?.x ?? 0),
						y: scaleInvert(ctx.yScale, currentPoint?.y ?? 0)
					});
					onChange({
						xDomain,
						yDomain
					});
				};
				const onPointerUp = (e) => {
					const currentPoint = localPoint(e, rootEl);
					const xPointDelta = Math.abs((startPoint?.x ?? 0) - (currentPoint?.x ?? 0));
					const yPointDelta = Math.abs((startPoint?.y ?? 0) - (currentPoint?.y ?? 0));
					if (!Array.from(e.target.classList).some((cls) => ["range", "handle"].includes(cls)) && xPointDelta < RESET_THRESHOLD && yPointDelta < RESET_THRESHOLD || _range().width < RESET_THRESHOLD || _range().height < RESET_THRESHOLD) if (ignoreResetClick) logger.debug("ignoring frame click reset");
					else {
						logger.debug("resetting due to frame click");
						reset();
						onChange({
							xDomain,
							yDomain
						});
					}
					else logger.debug("drag end", {
						target: e.target,
						xPointDelta,
						yPointDelta,
						rangeWidth: _range().width,
						rangeHeight: _range().height
					});
					onBrushEnd({
						xDomain,
						yDomain
					});
					if (resetOnEnd) if (ignoreResetClick) brushContext.isActive = false;
					else reset();
					window.removeEventListener("pointermove", onPointerMove);
					window.removeEventListener("pointerup", onPointerUp);
				};
				window.addEventListener("pointermove", onPointerMove);
				window.addEventListener("pointerup", onPointerUp);
			};
		}
		handler((start, value) => {
			logger.debug("createRange");
			brushContext.isActive = true;
			xDomain = [clamp(min([start.value.x, value.x]), xDomainMin(), xDomainMax()), clamp(max([start.value.x, value.x]), xDomainMin(), xDomainMax())];
			yDomain = [clamp(min([start.value.y, value.y]), yDomainMin(), yDomainMax()), clamp(max([start.value.y, value.y]), yDomainMin(), yDomainMax())];
		});
		handler((start, value) => {
			logger.debug("adjustRange");
			const dx = clamp(value.x - start.value.x, xDomainMin() - start.xDomain[0], xDomainMax() - start.xDomain[1]);
			xDomain = [add(start.xDomain[0], dx), add(start.xDomain[1], dx)];
			const dy = clamp(value.y - start.value.y, yDomainMin() - start.yDomain[0], yDomainMax() - start.yDomain[1]);
			yDomain = [add(start.yDomain[0], dy), add(start.yDomain[1], dy)];
		});
		handler((start, value) => {
			logger.debug("adjustTop");
			yDomain = [clamp(value.y < start.yDomain[0] ? value.y : start.yDomain[0], yDomainMin(), yDomainMax()), clamp(value.y < start.yDomain[0] ? start.yDomain[0] : value.y, yDomainMin(), yDomainMax())];
		});
		handler((start, value) => {
			logger.debug("adjustBottom");
			yDomain = [clamp(value.y > start.yDomain[1] ? start.yDomain[1] : value.y, yDomainMin(), yDomainMax()), clamp(value.y > start.yDomain[1] ? value.y : start.yDomain[1], yDomainMin(), yDomainMax())];
		});
		handler((start, value) => {
			logger.debug("adjustLeft");
			xDomain = [clamp(value.x > start.xDomain[1] ? start.xDomain[1] : value.x, xDomainMin(), xDomainMax()), clamp(value.x > start.xDomain[1] ? value.x : start.xDomain[1], xDomainMin(), xDomainMax())];
		});
		handler((start, value) => {
			logger.debug("adjustRight");
			xDomain = [clamp(value.x < start.xDomain[0] ? value.x : start.xDomain[0], xDomainMin(), xDomainMax()), clamp(value.x < start.xDomain[0] ? start.xDomain[0] : value.x, xDomainMin(), xDomainMax())];
		});
		function reset() {
			logger.debug("reset");
			brushContext.isActive = false;
			onReset({
				xDomain,
				yDomain
			});
			xDomain = ogXDomain;
			yDomain = ogYDomain;
		}
		if (disabled) {
			$$renderer.push("<!--[0-->");
			children?.($$renderer, { brushContext });
			$$renderer.push(`<!---->`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div${attr_class(clsx(cls("lc-brush-context")), "svelte-1ewn9ow")}${attr_style("", {
				top: `${stringify(ctx.padding.top)}px`,
				left: `${stringify(ctx.padding.left)}px`,
				width: `${stringify(ctx.width)}px`,
				height: `${stringify(ctx.height)}px`
			})}><div${attr_class(clsx(cls("lc-brush-container")), "svelte-1ewn9ow")}${attr_style("", {
				top: `-${stringify(ctx.padding.top ?? 0)}px`,
				left: `-${stringify(ctx.padding.left ?? 0)}px`,
				width: `${stringify(ctx.containerWidth)}px`,
				height: `${stringify(ctx.containerHeight)}px`
			})}>`);
			children?.($$renderer, { brushContext });
			$$renderer.push(`<!----></div> `);
			if (brushContext.isActive) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div${attributes({
					...range,
					class: clsx(cls("lc-brush-range", classes.range, range?.class))
				}, "svelte-1ewn9ow", void 0, {
					left: `${stringify(_range().x)}px`,
					top: `${stringify(_range().y)}px`,
					width: `${stringify(_range().width)}px`,
					height: `${stringify(_range().height)}px`
				})}></div> `);
				if (axis === "both" || axis === "y") {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<div${attributes({
						...handle,
						"data-position": "top",
						class: clsx(cls("lc-brush-handle", classes.handle, handle?.class))
					}, "svelte-1ewn9ow", void 0, {
						left: `${stringify(_range().x)}px`,
						top: `${stringify(_range().y)}px`,
						width: `${stringify(_range().width)}px`,
						height: `${stringify(handleSize)}px`
					})}></div> <div${attributes({
						...handle,
						"data-position": "bottom",
						class: clsx(cls("lc-brush-handle", classes.handle, handle?.class))
					}, "svelte-1ewn9ow", void 0, {
						left: `${stringify(_range().x)}px`,
						top: `${stringify(bottom() - handleSize)}px`,
						width: `${stringify(_range().width)}px`,
						height: `${stringify(handleSize)}px`
					})}></div>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> `);
				if (axis === "both" || axis === "x") {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<div${attributes({
						...handle,
						"data-position": "left",
						class: clsx(cls("lc-brush-handle", classes.handle, handle?.class))
					}, "svelte-1ewn9ow", void 0, {
						left: `${stringify(_range().x)}px`,
						top: `${stringify(_range().y)}px`,
						width: `${stringify(handleSize)}px`,
						height: `${stringify(_range().height)}px`
					})}></div> <div${attributes({
						...handle,
						"data-position": "right",
						class: clsx(cls("lc-brush-handle", classes.handle, handle?.class))
					}, "svelte-1ewn9ow", void 0, {
						left: `${stringify(right() - handleSize + 1)}px`,
						top: `${stringify(_range().y)}px`,
						width: `${stringify(handleSize)}px`,
						height: `${stringify(_range().height)}px`
					})}></div>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]-->`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div>`);
		}
		$$renderer.push(`<!--]-->`);
		bind_props($$props, { brushContext: brushContextProp });
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/Chart.svelte
var defaultPadding = {
	top: 0,
	right: 0,
	bottom: 0,
	left: 0
};
function Chart($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { ssr = false, pointerEvents = true, width: widthProp, height: heightProp, position = "relative", percentRange = false, ref: refProp = void 0, x: xProp, y: yProp, z: zProp, r: rProp, data = [], flatData: flatDataProp, xDomain: xDomainProp, yDomain: yDomainProp, zDomain: zDomainProp, rDomain: rDomainProp, xNice = false, yNice = false, zNice = false, rNice = false, xPadding, yPadding, zPadding, rPadding, xScale: xScaleProp = autoScale(xDomainProp, flatDataProp ?? data, xProp), yScale: yScaleProp = autoScale(yDomainProp, flatDataProp ?? data, yProp), zScale: zScaleProp = autoScale(zDomainProp, flatDataProp ?? data, zProp), rScale: rScaleProp = scaleSqrt(), padding: paddingProp = {}, verbose = true, debug = false, extents: extentsProp = {}, xDomainSort = false, yDomainSort = false, zDomainSort = false, rDomainSort = false, xReverse = false, zReverse = false, rReverse = false, yRange: _yRangeProp, zRange: zRangeProp, rRange: rRangeProp, xBaseline = null, yBaseline = null, xInterval = null, yInterval = null, meta = {}, children: _children, radial = false, xRange: _xRangeProp, x1: x1Prop, x1Domain: x1DomainProp, x1Range: x1RangeProp, x1Scale: x1ScaleProp, y1: y1Prop, y1Domain: y1DomainProp, y1Range: y1RangeProp, y1Scale: y1ScaleProp, c: cProp, cScale: cScaleProp, cDomain: cDomainProp, cRange: cRangeProp, onResize, geo, context: contextProp = void 0, tooltip, transform, onTransform, ondragend, ondragstart, brush, clip = false, class: className, $$slots, $$events, ...restProps } = $$props;
		let ref = void 0;
		const xRangeProp = derived(() => _xRangeProp ? _xRangeProp : radial ? [0, 2 * Math.PI] : void 0);
		let _containerWidth = 100;
		let _containerHeight = 100;
		let containerWidth = derived(() => widthProp ?? _containerWidth);
		let containerHeight = derived(() => heightProp ?? _containerHeight);
		useDebounce(printDebug, 200);
		const _xDomain = derived(() => {
			if (xDomainProp !== void 0) return xDomainProp;
			if (xInterval != null && Array.isArray(data) && data.length > 0) {
				const lastXValue = accessor(xProp)(data[data.length - 1]);
				return [null, xInterval.offset(lastXValue)];
			}
			if (xBaseline != null && Array.isArray(data)) {
				const xValues = data.flatMap(accessor(xProp));
				return [min([xBaseline, ...xValues]), max([xBaseline, ...xValues])];
			}
		});
		const _yDomain = derived(() => {
			if (yDomainProp !== void 0) return yDomainProp;
			if (yInterval != null && Array.isArray(data) && data.length > 0) {
				const lastYValue = accessor(yProp)(data[data.length - 1]);
				return [null, yInterval.offset(lastYValue)];
			}
			if (yBaseline != null && Array.isArray(data)) {
				const yValues = data.flatMap(accessor(yProp));
				return [min([yBaseline, ...yValues]), max([yBaseline, ...yValues])];
			}
		});
		const yRangeProp = derived(() => _yRangeProp ?? (radial ? ({ height }) => [0, height / 2] : void 0));
		const yReverse = derived(() => yScaleProp ? !isScaleBand(yScaleProp) && !isScaleTime(yScaleProp) : true);
		const x = derived(() => makeAccessor(xProp));
		const y = derived(() => makeAccessor(yProp));
		const z = derived(() => makeAccessor(zProp));
		const r = derived(() => makeAccessor(rProp));
		const c = derived(() => accessor(cProp));
		const x1 = derived(() => accessor(x1Prop));
		const y1 = derived(() => accessor(y1Prop));
		const flatData = derived(() => flatDataProp ?? data);
		const filteredExtents = derived(() => filterObject(snapshot(extentsProp)));
		const activeGetters = derived(() => ({
			x: x(),
			y: y(),
			z: z(),
			r: r()
		}));
		const padding = derived(() => {
			if (typeof paddingProp === "number") return {
				...defaultPadding,
				top: paddingProp,
				right: paddingProp,
				bottom: paddingProp,
				left: paddingProp
			};
			return {
				...defaultPadding,
				...paddingProp
			};
		});
		let isMounted = false;
		const box = derived(() => {
			const top = padding().top;
			const right = containerWidth() - padding().right;
			const bottom = containerHeight() - padding().bottom;
			const left = padding().left;
			const width = right - left;
			const height = bottom - top;
			if (verbose === true) {
				if (width <= 0 && isMounted === true) console.warn(`[LayerChart] Target div has zero or negative width (${width}). Did you forget to set an explicit width in CSS on the container?`);
				if (height <= 0 && isMounted === true) console.warn(`[LayerChart] Target div has zero or negative height (${height}). Did you forget to set an explicit height in CSS on the container?`);
			}
			return {
				top,
				left,
				bottom,
				right,
				width,
				height
			};
		});
		const width = derived(() => box().width);
		const height = derived(() => box().height);
		const extents = derived(() => {
			const scaleLookup = {
				x: {
					scale: xScaleProp,
					sort: xDomainSort
				},
				y: {
					scale: yScaleProp,
					sort: yDomainSort
				},
				z: {
					scale: zScaleProp,
					sort: zDomainSort
				},
				r: {
					scale: rScaleProp,
					sort: rDomainSort
				}
			};
			const getters = filterObject(activeGetters(), filteredExtents());
			const activeScales = Object.fromEntries(Object.keys(getters).map((k) => [k, scaleLookup[k]]));
			if (Object.keys(getters).length > 0) return {
				...calcScaleExtents(flatData(), getters, activeScales),
				...filteredExtents()
			};
			else return {};
		});
		const xDomain = derived(() => calcDomain("x", extents(), _xDomain()));
		const yDomain = derived(() => calcDomain("y", extents(), _yDomain()));
		const zDomain = derived(() => calcDomain("z", extents(), zDomainProp));
		const rDomain = derived(() => calcDomain("r", extents(), rDomainProp));
		const x1Domain = derived(() => x1DomainProp ?? extent(chartDataArray(data), x1()));
		const y1Domain = derived(() => y1DomainProp ?? extent(chartDataArray(data), y1()));
		const cDomain = derived(() => cDomainProp ?? unique(chartDataArray(data).map(c())));
		const snappedPadding = derived(() => snapshot(xPadding));
		const snappedExtents = derived(() => snapshot(extents()));
		const xScale = derived(() => createChartScale("x", {
			scale: xScaleProp,
			domain: xDomain(),
			padding: snappedPadding(),
			nice: xNice,
			reverse: xReverse,
			percentRange,
			range: xRangeProp(),
			height: height(),
			width: width(),
			extents: snappedExtents()
		}));
		const xGet = derived(() => createGetter(x(), xScale()));
		const yScale = derived(() => createChartScale("y", {
			scale: yScaleProp,
			domain: yDomain(),
			padding: yPadding,
			nice: yNice,
			reverse: yReverse(),
			percentRange,
			range: yRangeProp(),
			height: height(),
			width: width(),
			extents: filteredExtents()
		}));
		const yGet = derived(() => createGetter(y(), yScale()));
		const zScale = derived(() => createChartScale("z", {
			scale: zScaleProp,
			domain: zDomain(),
			padding: zPadding,
			nice: zNice,
			reverse: zReverse,
			percentRange,
			range: zRangeProp,
			height: height(),
			width: width(),
			extents: filteredExtents()
		}));
		const zGet = derived(() => createGetter(z(), zScale()));
		const rScale = derived(() => createChartScale("r", {
			scale: rScaleProp,
			domain: rDomain(),
			padding: rPadding,
			nice: rNice,
			reverse: rReverse,
			percentRange,
			range: rRangeProp,
			height: height(),
			width: width(),
			extents: filteredExtents()
		}));
		const rGet = derived(() => createGetter(r(), rScale()));
		const x1Scale = derived(() => x1RangeProp ? createScale(x1ScaleProp ?? autoScale(x1DomainProp, flatDataProp ?? data, x1Prop), x1Domain(), x1RangeProp, {
			xScale: xScale(),
			width: width(),
			height: height()
		}) : null);
		const x1Get = derived(() => createGetter(x1(), x1Scale()));
		const y1Scale = derived(() => y1RangeProp ? createScale(y1ScaleProp ?? autoScale(y1DomainProp, flatDataProp ?? data, y1Prop), y1Domain(), y1RangeProp, {
			yScale: yScale(),
			width: width(),
			height: height()
		}) : null);
		const y1Get = derived(() => createGetter(y1(), y1Scale()));
		const cScale = derived(() => cRangeProp ? createScale(cScaleProp ?? scaleOrdinal(), cDomain(), cRangeProp, {
			width: width(),
			height: height()
		}) : null);
		const cGet = derived(() => (d) => cScale()?.(c()(d)));
		const xDomainPossiblyNice = derived(() => xScale().domain());
		const yDomainPossiblyNice = derived(() => yScale().domain());
		const zDomainPossiblyNice = derived(() => zScale().domain());
		const rDomainPossiblyNice = derived(() => rScale().domain());
		const xRange = derived(() => getRange(xScale()));
		const yRange = derived(() => getRange(yScale()));
		const zRange = derived(() => getRange(zScale()));
		const rRange = derived(() => getRange(rScale()));
		const aspectRatio = derived(() => width() / height());
		const config = derived(() => ({
			x: xProp,
			y: yProp,
			z: zProp,
			r: rProp,
			c: cProp,
			x1: x1Prop,
			y1: y1Prop,
			xDomain: _xDomain(),
			yDomain: _yDomain(),
			zDomain: zDomainProp,
			rDomain: rDomainProp,
			x1Domain: x1DomainProp,
			y1Domain: y1DomainProp,
			cDomain: cDomainProp,
			xRange: _xRangeProp,
			yRange: _yRangeProp,
			zRange: zRangeProp,
			rRange: rRangeProp,
			cRange: cRangeProp,
			x1Range: x1RangeProp,
			y1Range: y1RangeProp
		}));
		let geoContext = null;
		let transformContext = null;
		let tooltipContext = null;
		let brushContext = null;
		const context = {
			get activeGetters() {
				return activeGetters();
			},
			get config() {
				return config();
			},
			get width() {
				return width();
			},
			get height() {
				return height();
			},
			get percentRange() {
				return percentRange;
			},
			get aspectRatio() {
				return aspectRatio();
			},
			get containerWidth() {
				return containerWidth();
			},
			get containerHeight() {
				return containerHeight();
			},
			get x() {
				return x();
			},
			get y() {
				return y();
			},
			get z() {
				return z();
			},
			get r() {
				return r();
			},
			get c() {
				return c();
			},
			get x1() {
				return x1();
			},
			get y1() {
				return y1();
			},
			get data() {
				return data;
			},
			get xNice() {
				return xNice;
			},
			get yNice() {
				return yNice;
			},
			get zNice() {
				return zNice;
			},
			get rNice() {
				return rNice;
			},
			get xDomainSort() {
				return xDomainSort;
			},
			get yDomainSort() {
				return yDomainSort;
			},
			get zDomainSort() {
				return zDomainSort;
			},
			get rDomainSort() {
				return rDomainSort;
			},
			get xReverse() {
				return xReverse;
			},
			get yReverse() {
				return yReverse();
			},
			get zReverse() {
				return zReverse;
			},
			get rReverse() {
				return rReverse;
			},
			get xPadding() {
				return xPadding;
			},
			get yPadding() {
				return yPadding;
			},
			get zPadding() {
				return zPadding;
			},
			get rPadding() {
				return rPadding;
			},
			get padding() {
				return padding();
			},
			get flatData() {
				return flatData();
			},
			get extents() {
				return extents();
			},
			get xDomain() {
				return xDomainPossiblyNice();
			},
			get yDomain() {
				return yDomainPossiblyNice();
			},
			get zDomain() {
				return zDomainPossiblyNice();
			},
			get rDomain() {
				return rDomainPossiblyNice();
			},
			get cDomain() {
				return cDomain();
			},
			get x1Domain() {
				return x1Domain();
			},
			get y1Domain() {
				return y1Domain();
			},
			get xRange() {
				return xRange();
			},
			get yRange() {
				return yRange();
			},
			get zRange() {
				return zRange();
			},
			get rRange() {
				return rRange();
			},
			get cRange() {
				return cRangeProp;
			},
			get x1Range() {
				return x1RangeProp;
			},
			get y1Range() {
				return y1RangeProp;
			},
			get meta() {
				return meta;
			},
			set meta(v) {
				meta = v;
			},
			get xScale() {
				return xScale();
			},
			get yScale() {
				return yScale();
			},
			get zScale() {
				return zScale();
			},
			get rScale() {
				return rScale();
			},
			get yGet() {
				return yGet();
			},
			get xGet() {
				return xGet();
			},
			get zGet() {
				return zGet();
			},
			get rGet() {
				return rGet();
			},
			get cGet() {
				return cGet();
			},
			get x1Get() {
				return x1Get();
			},
			get y1Get() {
				return y1Get();
			},
			get cScale() {
				return cScale();
			},
			get x1Scale() {
				return x1Scale();
			},
			get y1Scale() {
				return y1Scale();
			},
			get xInterval() {
				return xInterval;
			},
			get yInterval() {
				return yInterval;
			},
			get radial() {
				return radial;
			},
			get containerRef() {
				return ref;
			},
			get geo() {
				return geoContext;
			},
			get transform() {
				return transformContext;
			},
			get tooltip() {
				return tooltipContext;
			},
			get brush() {
				return brushContext;
			}
		};
		contextProp = context;
		setChartContext(context);
		const initialTransform = derived(() => geo?.applyTransform?.includes("translate") && geo?.fitGeojson && geo?.projection ? geoFitObjectTransform(geo.projection(), [width(), height()], geo.fitGeojson) : void 0);
		const processTranslate = derived(() => {
			if (!geo) return void 0;
			return (x, y, deltaX, deltaY) => {
				if (geo.applyTransform?.includes("rotate") && geoContext?.projection) {
					const projectionScale = geoContext.projection.scale() ?? 0;
					const sensitivity = 75;
					return {
						x: x + deltaX * (sensitivity / projectionScale),
						y: y + deltaY * (sensitivity / projectionScale) * -1
					};
				} else return {
					x: x + deltaX,
					y: y + deltaY
				};
			};
		});
		const brushProps = derived(() => typeof brush === "object" ? brush : { disabled: !brush });
		const tooltipProps = derived(() => typeof tooltip === "object" ? tooltip : {});
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			if (ssr === true || typeof window !== "undefined") {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div${attributes({
					class: clsx(["lc-root-container", className]),
					...restProps
				}, "svelte-2ex2wv", void 0, {
					position,
					top: position === "absolute" ? 0 : null,
					right: position === "absolute" ? 0 : null,
					bottom: position === "absolute" ? 0 : null,
					left: position === "absolute" ? 0 : null,
					"pointer-events": pointerEvents === false ? "none" : null,
					overflow: clip ? "hidden" : null,
					width: widthProp ? `${widthProp}px` : "100%",
					height: heightProp ? `${heightProp}px` : "100%"
				})}><!---->`);
				TransformContext($$renderer, spread_props([
					{
						mode: transform?.mode ?? geo?.applyTransform?.length ? "manual" : "none",
						initialTranslate: initialTransform()?.translate,
						initialScale: initialTransform()?.scale,
						processTranslate: processTranslate()
					},
					transform,
					{
						ondragstart,
						onTransform,
						ondragend,
						get transformContext() {
							return transformContext;
						},
						set transformContext($$value) {
							transformContext = $$value;
							$$settled = false;
						},
						children: ($$renderer) => {
							GeoContext($$renderer, spread_props([geo, {
								get geoContext() {
									return geoContext;
								},
								set geoContext($$value) {
									geoContext = $$value;
									$$settled = false;
								},
								children: ($$renderer) => {
									BrushContext($$renderer, spread_props([brushProps(), {
										get brushContext() {
											return brushContext;
										},
										set brushContext($$value) {
											brushContext = $$value;
											$$settled = false;
										},
										children: ($$renderer) => {
											TooltipContext($$renderer, spread_props([tooltipProps(), {
												get tooltipContext() {
													return tooltipContext;
												},
												set tooltipContext($$value) {
													tooltipContext = $$value;
													$$settled = false;
												},
												children: ($$renderer) => {
													_children?.($$renderer, { context });
													$$renderer.push(`<!---->`);
												},
												$$slots: { default: true }
											}]));
										},
										$$slots: { default: true }
									}]));
								},
								$$slots: { default: true }
							}]));
						},
						$$slots: { default: true }
					}
				]));
				$$renderer.push(`<!----></div>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]-->`);
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, {
			ref: refProp,
			context: contextProp
		});
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/layers/Html.svelte
function Html($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { ref: refProp = void 0, zIndex = 0, pointerEvents = true, role, "aria-label": label, "aria-labelledby": labelledBy, "aria-describedby": describedBy, center = false, ignoreTransform = false, clip = false, class: className, children, $$slots, $$events, ...restProps } = $$props;
		let ref = void 0;
		const roleVal = derived(() => role || (label || labelledBy || describedBy ? "figure" : void 0));
		const ctx = getChartContext();
		const transformCtx = getTransformContext();
		const transform = derived(() => {
			if (transformCtx.mode === "canvas" && !ignoreTransform) return `translate(${transformCtx.translate.x}px,${transformCtx.translate.y}px) scale(${transformCtx.scale})`;
			else if (center) return `translate(${center === "x" || center === true ? ctx.width / 2 : 0}px, ${center === "y" || center === true ? ctx.height / 2 : 0}px)`;
		});
		setLayerContext("html");
		$$renderer.push(`<div${attributes({
			class: clsx(["lc-layout-html", className]),
			role: roleVal(),
			"aria-label": label,
			"aria-labelledby": labelledBy,
			"aria-describedby": describedBy,
			...restProps
		}, "svelte-1pwiuy1", {
			disablePointerEvents: pointerEvents === false,
			clip
		}, {
			transform,
			"transform-origin": "top left",
			"z-index": zIndex,
			top: `${stringify(ctx.padding.top)}px`,
			bottom: `${stringify(ctx.padding.bottom)}px`,
			left: `${stringify(ctx.padding.left)}px`,
			right: `${stringify(ctx.padding.right)}px`
		})}>`);
		children?.($$renderer, { ref });
		$$renderer.push(`<!----></div>`);
		bind_props($$props, { ref: refProp });
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/Frame.svelte
function Frame($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { ref: refProp = void 0, full = false, $$slots, $$events, ...restProps } = $$props;
		let ref = void 0;
		const ctx = getChartContext();
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			Rect($$renderer, spread_props([
				{
					x: full && ctx.padding?.left ? -ctx.padding.left : 0,
					y: full && ctx.padding?.top ? -ctx.padding.top : 0,
					width: ctx.width + (full ? (ctx.padding?.left ?? 0) + (ctx.padding?.right ?? 0) : 0),
					height: ctx.height + (full ? (ctx.padding?.top ?? 0) + (ctx.padding?.bottom ?? 0) : 0)
				},
				extractLayerProps(restProps, "lc-frame"),
				{
					get ref() {
						return ref;
					},
					set ref($$value) {
						ref = $$value;
						$$settled = false;
					}
				}
			]));
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { ref: refProp });
	});
}
//#endregion
//#region node_modules/layerchart/dist/states/settings.svelte.js
var Settings = class {
	layer;
	debug;
	constructor(options = {}) {
		this.layer = options.layer ?? "svg";
		this.debug = options.debug ?? false;
	}
};
var defaultSettings = new Settings();
//#endregion
//#region node_modules/layerchart/dist/contexts/settings.js
var _SettingsContext = new Context("Settings");
/** Get the current settings context, or default if not set */
function getSettings() {
	return _SettingsContext.getOr(defaultSettings);
}
//#endregion
//#region node_modules/layerchart/dist/components/layers/Layer.svelte
function Layer($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { type, children, $$slots, $$events, ...restProps } = $$props;
		let settings = getSettings();
		let layer = derived(() => type ?? settings.layer);
		if (layer() === "canvas") {
			$$renderer.push("<!--[0-->");
			{
				function children($$renderer, props) {
					if (settings.debug) {
						$$renderer.push("<!--[0-->");
						Frame($$renderer, { class: "lc-debug-frame" });
						$$renderer.push(`<!----> `);
						Frame($$renderer, {
							class: "lc-debug-frame",
							full: true
						});
						$$renderer.push(`<!---->`);
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--> `);
					children?.($$renderer, props);
					$$renderer.push(`<!---->`);
				}
				Canvas($$renderer, spread_props([restProps, {
					children,
					$$slots: { default: true }
				}]));
			}
		} else if (layer() === "svg") {
			$$renderer.push("<!--[1-->");
			{
				function children($$renderer, props) {
					if (settings.debug) {
						$$renderer.push("<!--[0-->");
						Frame($$renderer, { class: "lc-debug-frame" });
						$$renderer.push(`<!----> `);
						Frame($$renderer, {
							class: "lc-debug-frame",
							full: true
						});
						$$renderer.push(`<!---->`);
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--> `);
					children?.($$renderer, props);
					$$renderer.push(`<!---->`);
				}
				Svg($$renderer, spread_props([restProps, {
					children,
					$$slots: { default: true }
				}]));
			}
		} else if (layer() === "html") {
			$$renderer.push("<!--[2-->");
			{
				function children($$renderer, props) {
					if (settings.debug) {
						$$renderer.push("<!--[0-->");
						Frame($$renderer, { class: "lc-debug-frame" });
						$$renderer.push(`<!----> `);
						Frame($$renderer, {
							class: "lc-debug-frame",
							full: true
						});
						$$renderer.push(`<!---->`);
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--> `);
					children?.($$renderer, props);
					$$renderer.push(`<!---->`);
				}
				Html($$renderer, spread_props([restProps, {
					children,
					$$slots: { default: true }
				}]));
			}
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/ColorRamp.svelte
function ColorRamp($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { interpolator, steps = 10, height = "20px", width = "100%", ref: refProp = void 0, $$slots, $$events, ...restProps } = $$props;
		$$renderer.push(`<image${attributes({
			href: "",
			preserveAspectRatio: "none",
			height,
			width,
			...extractLayerProps(restProps, "lc-color-ramp")
		}, void 0, void 0, void 0, 3)}></image>`);
		bind_props($$props, { ref: refProp });
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/Legend.svelte
function Legend($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { scale: scaleProp, title = "", width = 320, height = 10, ticks = width / 64, tickFormat: tickFormatProp, tickValues: tickValuesProp, tickFontSize = 10, tickLength: tickLengthProp = 4, placement, orientation = "horizontal", onclick, onpointerenter, onpointerleave, variant = "ramp", selected = [], classes = {}, ref: refProp = void 0, class: className, children, $$slots, $$events, ...restProps } = $$props;
		const ctx = getChartContext();
		const scale = derived(() => scaleProp ?? ctx.cScale);
		const scaleConfig = derived(() => {
			if (!scale()) return {
				xScale: void 0,
				interpolator: void 0,
				swatches: void 0,
				tickLabelOffset: 0,
				tickLine: true,
				tickLength: tickLengthProp,
				tickFormat: tickFormatProp,
				tickValues: tickValuesProp
			};
			else if (scale().interpolate) {
				const n = Math.min(scale().domain().length, scale().range().length);
				const xScale = scale().copy().rangeRound?.(quantize(interpolate(0, width), n));
				return {
					xScale,
					interpolator: scale().copy().domain(quantize(interpolate(0, 1), n)),
					tickFormat: tickFormatProp ?? xScale?.tickFormat?.(),
					tickLabelOffset: 0,
					tickLine: true,
					tickValues: tickValuesProp,
					tickLength: tickLengthProp,
					swatches: void 0
				};
			} else if (scale().interpolator) {
				const xScale = Object.assign(scale().copy().interpolator(interpolateRound(0, width)), { range() {
					return [0, width];
				} });
				const interpolator = scale().interpolator();
				let tickValues = tickValuesProp;
				if (!xScale.ticks) {
					if (tickValues === void 0) {
						const n = Math.round(ticks + 1);
						tickValues = range(n).map((i) => quantile(scale().domain(), i / (n - 1)));
					}
				}
				const tickFormat = tickFormatProp ?? xScale.tickFormat?.();
				return {
					interpolator,
					tickValues,
					tickFormat,
					swatches: void 0,
					tickLabelOffset: 0,
					tickLine: true,
					tickLength: tickLengthProp,
					xScale
				};
			} else if (scale().invertExtent) {
				const thresholds = scale().thresholds ? scale().thresholds() : scale().quantiles ? scale().quantiles() : scale().domain();
				const xScale = scaleLinear().domain([-1, scale().range().length - 1]).rangeRound([0, width]);
				const swatches = scale().range().map((d, i) => {
					return {
						x: xScale(i - 1),
						y: 0,
						width: xScale(i) - xScale(i - 1),
						height,
						fill: d
					};
				});
				const tickValues = range(thresholds.length);
				const tickFormat = (i) => {
					const value = thresholds[i];
					return tickFormatProp ? format(value, tickFormatProp) : value;
				};
				return {
					xScale,
					swatches,
					tickValues,
					tickFormat,
					tickLabelOffset: 0,
					tickLine: true,
					tickLength: tickLengthProp,
					interpolator: void 0
				};
			} else {
				const xScale = scaleBand().domain(scale().domain()).rangeRound([0, width]);
				const swatches = scale().domain().map((d) => {
					return {
						x: xScale(d),
						y: 0,
						width: Math.max(0, xScale.bandwidth() - 1),
						height,
						fill: scale()(d)
					};
				});
				const tickValues = scale().domain();
				return {
					xScale,
					tickFormat: tickFormatProp,
					tickLabelOffset: xScale.bandwidth() / 2,
					tickLine: false,
					tickLength: 0,
					tickValues,
					swatches,
					interpolator: void 0
				};
			}
		});
		$$renderer.push(`<div${attributes({
			...restProps,
			"data-placement": placement,
			class: clsx(cls("lc-legend-container", className, classes.root))
		}, "svelte-1odwfni")}><div${attr_class(clsx(cls("lc-legend-title", classes.title)), "svelte-1odwfni")}>${escape_html(title)}</div> `);
		if (children) {
			$$renderer.push("<!--[0-->");
			children($$renderer, {
				values: scaleConfig().tickValues ?? scaleConfig().xScale?.ticks?.(ticks) ?? [],
				scale: scale()
			});
			$$renderer.push(`<!---->`);
		} else if (variant === "ramp") {
			$$renderer.push("<!--[1-->");
			$$renderer.push(`<svg${attr("width", width)}${attr("height", height + tickLengthProp + tickFontSize)}${attr("viewBox", `0 0 ${stringify(width)} ${stringify(height + tickLengthProp + tickFontSize)}`)}${attr_class(clsx(cls("lc-legend-ramp-svg")), "svelte-1odwfni")}><g class="lc-legend-ramp-g">`);
			if (scaleConfig().interpolator) {
				$$renderer.push("<!--[0-->");
				ColorRamp($$renderer, {
					width,
					height,
					interpolator: scaleConfig().interpolator,
					class: "lc-legend-color-ramp"
				});
			} else if (scaleConfig().swatches) {
				$$renderer.push("<!--[1-->");
				$$renderer.push(`<!--[-->`);
				const each_array = ensure_array_like(scaleConfig().swatches);
				for (let i = 0, $$length = each_array.length; i < $$length; i++) {
					let swatch = each_array[i];
					$$renderer.push(`<rect${attributes({ ...extractLayerProps(swatch, "lc-legend-ramp-swatch") }, "svelte-1odwfni", void 0, void 0, 3)}></rect>`);
				}
				$$renderer.push(`<!--]-->`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></g><g class="lc-legend-tick-group"><!--[-->`);
			const each_array_1 = ensure_array_like(tickValuesProp ?? scaleConfig().xScale?.ticks?.(ticks) ?? []);
			for (let i = 0, $$length = each_array_1.length; i < $$length; i++) {
				let tick = each_array_1[i];
				$$renderer.push(`<text text-anchor="middle"${attr("x", scaleConfig().xScale?.(tick) + scaleConfig().tickLabelOffset)}${attr("y", height + tickLengthProp + tickFontSize)}${attr_class(clsx(cls("lc-legend-tick-text", classes.label)), "svelte-1odwfni")}${attr_style("", { "font-size": tickFontSize })}>${escape_html(tickFormatProp ? format(tick, asAny(tickFormatProp)) : tick)}</text>`);
				if (scaleConfig().tickLine) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<line${attr("x1", scaleConfig().xScale?.(tick))}${attr("y1", 0)}${attr("x2", scaleConfig().xScale?.(tick))}${attr("y2", height + tickLengthProp)}${attr_class(clsx(cls("lc-legend-tick-line", classes.tick)), "svelte-1odwfni")}></line>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]-->`);
			}
			$$renderer.push(`<!--]--></g></svg>`);
		} else if (variant === "swatches") {
			$$renderer.push("<!--[2-->");
			$$renderer.push(`<div${attr_class(clsx(cls("lc-legend-swatch-group", classes.items)), "svelte-1odwfni")}${attr("data-orientation", orientation)}><!--[-->`);
			const each_array_2 = ensure_array_like(scaleConfig().tickValues ?? scaleConfig().xScale?.ticks?.(ticks) ?? []);
			for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
				let tick = each_array_2[$$index_2];
				const color = scale()?.(tick) ?? "";
				const item = {
					value: tick,
					color
				};
				$$renderer.push(`<button${attr_class(clsx(cls("lc-legend-swatch-button", resolveMaybeFn(classes?.item, item))), "svelte-1odwfni")}${attr_style("", { opacity: selected.length === 0 || selected.includes(tick) ? 1 : .3 })}><div${attr_class(clsx(cls("lc-legend-swatch", classes.swatch)), "svelte-1odwfni")}${attr_style("", { "background-color": color })}></div> <div${attr_class(clsx(cls("lc-legend-swatch-label", classes.label)), "svelte-1odwfni")}>${escape_html(tickFormatProp ? format(tick, asAny(tickFormatProp)) : tick)}</div></button>`);
			}
			$$renderer.push(`<!--]--></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div>`);
		bind_props($$props, { ref: refProp });
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/tooltip/TooltipHeader.svelte
function TooltipHeader($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { ref: refProp = void 0, colorRef: colorRefProp = void 0, value, format: format$3, color, classes = {
			root: "",
			color: ""
		}, props = {
			root: {},
			color: {}
		}, class: className, children, $$slots, $$events, ...restProps } = $$props;
		$$renderer.push(`<div${attributes({
			class: clsx(cls("lc-tooltip-header", classes.root, props.root?.class, className)),
			...restProps
		}, "svelte-1d44xgt")}>`);
		if (color) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div${attr_class(clsx(cls("lc-tooltip-header-color", classes.color)), "svelte-1d44xgt")}${attr_style("", { "--color": color })}></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (children) {
			$$renderer.push("<!--[0-->");
			children?.($$renderer);
			$$renderer.push(`<!---->`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`${escape_html(format$3 ? format(value, asAny(format$3)) : value)}`);
		}
		$$renderer.push(`<!--]--></div>`);
		bind_props($$props, {
			ref: refProp,
			colorRef: colorRefProp
		});
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/tooltip/TooltipItem.svelte
function TooltipItem($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { ref: refProp = void 0, labelRef: labelRefProp = void 0, valueRef: valueRefProp = void 0, colorRef: colorRefProp = void 0, label, value, format: format$2, valueAlign = "left", color, classes = {
			root: "",
			label: "",
			value: "",
			color: ""
		}, props = {
			root: {},
			label: {},
			value: {},
			color: {}
		}, class: className, children, $$slots, $$events, ...restProps } = $$props;
		$$renderer.push(`<div${attributes({
			...props.root,
			class: clsx(cls("lc-tooltip-item-root", classes.root, className, props.root?.class)),
			...restProps
		}, "svelte-ytd3mj")}><div${attributes({
			...props.label,
			class: clsx(cls("lc-tooltip-item-label", "label", classes.label, props.label?.class))
		}, "svelte-ytd3mj")}>`);
		if (color) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div${attributes({
				...props.color,
				class: clsx(cls("lc-tooltip-item-color", "color", classes.color, props.color?.class))
			}, "svelte-ytd3mj", void 0, { "--color": color })}></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (typeof label === "function") {
			$$renderer.push("<!--[0-->");
			label($$renderer);
			$$renderer.push(`<!---->`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`${escape_html(label)}`);
		}
		$$renderer.push(`<!--]--></div> <div${attributes({
			...props.value,
			class: clsx(cls("lc-tooltip-item-value", "value", classes.value, props.value?.class)),
			"data-align": valueAlign
		}, "svelte-ytd3mj")}>`);
		if (children) {
			$$renderer.push("<!--[0-->");
			children($$renderer);
			$$renderer.push(`<!---->`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`${escape_html(format$2 ? format(value, asAny(format$2)) : value)}`);
		}
		$$renderer.push(`<!--]--></div></div>`);
		bind_props($$props, {
			ref: refProp,
			labelRef: labelRefProp,
			valueRef: valueRefProp,
			colorRef: colorRefProp
		});
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/tooltip/TooltipList.svelte
function TooltipList($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { ref: refProp = void 0, class: className, children, $$slots, $$events, ...restProps } = $$props;
		$$renderer.push(`<div${attributes({
			class: clsx(cls("lc-tooltip-list", className)),
			...restProps
		}, "svelte-10s3jfe")}>`);
		children?.($$renderer);
		$$renderer.push(`<!----></div>`);
		bind_props($$props, { ref: refProp });
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/tooltip/TooltipSeparator.svelte
function TooltipSeparator($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { ref: refProp = void 0, class: className, children, $$slots, $$events, ...restProps } = $$props;
		$$renderer.push(`<div${attributes({
			class: clsx(cls("lc-tooltip-separator", className)),
			...restProps
		}, "svelte-rriep1")}>`);
		children?.($$renderer);
		$$renderer.push(`<!----></div>`);
		bind_props($$props, { ref: refProp });
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/tooltip/Tooltip.svelte
function Tooltip($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { anchor = "top-left", classes = {}, contained = "container", motion = "spring", pointerEvents = false, variant = "default", x = "pointer", xOffset = x === "pointer" ? 10 : 0, y = "pointer", yOffset = y === "pointer" ? 10 : 0, children, rootRef: rootRefProp = void 0, props = {
			root: {},
			container: {},
			content: {}
		}, class: className } = $$props;
		let rootRef = void 0;
		const ctx = getChartContext();
		const tooltipCtx = getTooltipContext();
		let tooltipWidth = null;
		let tooltipHeight = null;
		function alignValue(value, align, additionalOffset, tooltipSize) {
			const alignOffset = align === "center" ? tooltipSize / 2 : align === "end" ? tooltipSize : 0;
			return value + (align === "end" ? -additionalOffset : additionalOffset) - alignOffset;
		}
		const positions = derived(() => {
			if (!tooltipCtx.data || tooltipWidth === null || tooltipHeight === null) return {
				x: null,
				y: null
			};
			const xBandOffset = isScaleBand(ctx.xScale) ? ctx.xScale.step() / 2 - ctx.xScale.padding() * ctx.xScale.step() / 2 : 0;
			const xValue = typeof x === "number" ? x : x === "data" ? ctx.xGet(tooltipCtx.data) + ctx.padding.left + xBandOffset : tooltipCtx.x;
			let xAlign = "start";
			switch (anchor) {
				case "top-left":
				case "left":
				case "bottom-left":
					xAlign = "start";
					break;
				case "top":
				case "center":
				case "bottom":
					xAlign = "center";
					break;
				case "top-right":
				case "right":
				case "bottom-right":
					xAlign = "end";
					break;
			}
			const yBandOffset = isScaleBand(ctx.yScale) ? ctx.yScale.step() / 2 - ctx.yScale.padding() * ctx.yScale.step() / 2 : 0;
			const yValue = typeof y === "number" ? y : y === "data" ? ctx.yGet(tooltipCtx.data) + ctx.padding.top + yBandOffset : tooltipCtx.y;
			let yAlign = "start";
			switch (anchor) {
				case "top-left":
				case "top":
				case "top-right":
					yAlign = "start";
					break;
				case "left":
				case "center":
				case "right":
					yAlign = "center";
					break;
				case "bottom-left":
				case "bottom":
				case "bottom-right":
					yAlign = "end";
					break;
			}
			const rect = {
				top: alignValue(yValue, yAlign, yOffset, tooltipHeight),
				left: alignValue(xValue, xAlign, xOffset, tooltipWidth),
				bottom: 0,
				right: 0
			};
			rect.bottom = rect.top + tooltipHeight;
			rect.right = rect.left + tooltipWidth;
			if (contained === "container") {
				if (typeof x !== "number") {
					if ((xAlign === "start" || xAlign === "center") && rect.right > ctx.containerWidth) rect.left = alignValue(xValue, "end", xOffset, tooltipWidth);
					if ((xAlign === "end" || xAlign === "center") && rect.left < ctx.padding.left) rect.left = alignValue(xValue, "start", xOffset, tooltipWidth);
				}
				rect.right = rect.left + tooltipWidth;
				if (typeof y !== "number") {
					if ((yAlign === "start" || yAlign === "center") && rect.bottom > ctx.containerHeight) rect.top = alignValue(yValue, "end", yOffset, tooltipHeight);
					if ((yAlign === "end" || yAlign === "center") && rect.top < ctx.padding.top) rect.top = alignValue(yValue, "start", yOffset, tooltipHeight);
				}
				rect.bottom = rect.top + tooltipHeight;
			} else if (contained === "window") {
				if (rootRef?.parentElement) {
					const parentViewportRect = rootRef.parentElement.getBoundingClientRect();
					if (typeof x !== "number") {
						if ((xAlign === "start" || xAlign === "center") && parentViewportRect.left + rect.right > window.innerWidth) rect.left = alignValue(xValue, "end", xOffset, tooltipWidth);
						if ((xAlign === "end" || xAlign === "center") && parentViewportRect.left + rect.left < 0) rect.left = alignValue(xValue, "start", xOffset, tooltipWidth);
					}
					rect.right = rect.left + tooltipWidth;
					if (typeof y !== "number") {
						if ((yAlign === "start" || yAlign === "center") && parentViewportRect.top + rect.bottom > window.innerHeight) rect.top = alignValue(yValue, "end", yOffset, tooltipHeight);
						if ((yAlign === "end" || yAlign === "center") && parentViewportRect.top + rect.top < 0) rect.top = alignValue(yValue, "start", yOffset, tooltipHeight);
					}
					rect.bottom = rect.top + tooltipHeight;
				}
			}
			return {
				x: rect.left,
				y: rect.top
			};
		});
		const motionX = createMotion(null, () => positions().x, motion);
		const motionY = createMotion(null, () => positions().y, motion);
		if (tooltipCtx.data) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div${attributes({
				...props.root,
				class: clsx(cls("lc-tooltip-root", classes.root, props.root?.class))
			}, "svelte-crp5m6", { disablePointerEvents: pointerEvents === false }, {
				top: `${stringify(motionY.current)}px`,
				left: `${stringify(motionX.current)}px`
			})}><div${attributes({
				...props.container,
				class: clsx(cls("lc-tooltip-container", classes.container, props.container?.class, className)),
				"data-variant": variant
			}, "svelte-crp5m6")}>`);
			if (children) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div${attributes({
					...props.content,
					class: clsx(cls("lc-tooltip-content", classes.content))
				}, "svelte-crp5m6")}>`);
				children($$renderer, {
					data: tooltipCtx.data,
					payload: tooltipCtx.payload
				});
				$$renderer.push(`<!----></div>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
		bind_props($$props, { rootRef: rootRefProp });
	});
}
//#endregion
//#region node_modules/layerchart/dist/states/series.svelte.js
var HighlightKey = class {
	current = null;
	set = (seriesKey) => {
		this.current = seriesKey;
	};
};
var SeriesState = class {
	#series = [];
	selectedKeys = new SelectionState();
	highlightKey = new HighlightKey();
	constructor(getSeries) {
		this.#series = getSeries();
	}
	get series() {
		return this.#series;
	}
	get isDefaultSeries() {
		return this.#series.length === 1 && this.#series[0].key === "default";
	}
	get visibleSeries() {
		return this.#series.filter((s) => this.isVisible(s.key));
	}
	/**
	* Check if series is visible
	*/
	isVisible(seriesKey) {
		return this.selectedKeys.isEmpty() || this.selectedKeys.isSelected(seriesKey);
	}
	/**
	* Check if series is highlighted
	* Changing default to `true` is useful to determine if series should be faded
	*/
	isHighlighted(seriesKey, defaultValue = false) {
		if (this.highlightKey.current === null) return defaultValue;
		else return this.highlightKey.current === seriesKey;
	}
	get allSeriesData() {
		return this.#series.flatMap((s) => s.data?.map((d) => ({
			seriesKey: s.key,
			...d
		}))).filter((d) => d);
	}
	get allSeriesColors() {
		return this.#series.map((s) => s.color).filter((c) => c != null);
	}
};
//#endregion
//#region node_modules/layerchart/dist/components/charts/utils.svelte.js
function createLegendProps(opts) {
	return {
		scale: opts.seriesState.isDefaultSeries ? void 0 : scaleOrdinal(opts.seriesState.series.map((s) => s.key), opts.seriesState.series.map((s) => s.color)),
		tickFormat: (key) => opts.seriesState.series.find((s) => s.key === key)?.label ?? key,
		placement: "bottom",
		variant: "swatches",
		selected: opts.seriesState.selectedKeys.current,
		onclick: (_, item) => opts.seriesState.selectedKeys.toggle(item.value),
		onpointerenter: (_, item) => opts.seriesState.highlightKey.current = item.value,
		onpointerleave: () => opts.seriesState.highlightKey.current = null,
		...opts.props,
		classes: {
			item: (item) => {
				return cls(resolveMaybeFn(opts.props?.classes?.item, item));
			},
			...opts.props?.classes
		}
	};
}
//#endregion
//#region node_modules/layerchart/dist/components/Spline.svelte
function Spline($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const ctx = getChartContext();
		let { data, x, y, defined, curve, $$slots, $$events, ...restProps } = $$props;
		function getScaleValue(data, scale, accessor) {
			let value = accessor(data);
			if (Array.isArray(value)) value = max(value);
			if (scale.domain().length) return scale(value);
			else return value;
		}
		const xAccessor = derived(() => x ? accessor(x) : ctx.x);
		const yAccessor = derived(() => y ? accessor(y) : ctx.y);
		const xOffset = derived(() => isScaleBand(ctx.xScale) ? ctx.xScale.bandwidth() / 2 : 0);
		const yOffset = derived(() => isScaleBand(ctx.yScale) ? ctx.yScale.bandwidth() / 2 : 0);
		Path($$renderer, spread_props([{ pathData: derived(() => {
			const path = ctx.radial ? lineRadial().angle((d) => getScaleValue(d, ctx.xScale, xAccessor()) + 0).radius((d) => getScaleValue(d, ctx.yScale, yAccessor()) + yOffset()) : line().x((d) => getScaleValue(d, ctx.xScale, xAccessor()) + xOffset()).y((d) => getScaleValue(d, ctx.yScale, yAccessor()) + yOffset());
			path.defined(defined ?? ((d) => xAccessor()(d) != null && yAccessor()(d) != null));
			if (curve) path.curve(curve);
			return path(data ?? ctx.data) ?? "";
		})() }, restProps]));
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/Area.svelte
function Area($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const ctx = getChartContext();
		const layerCtx = getLayerContext();
		let { clipPath, curve, data, defined, fill, fillOpacity, line = false, opacity, pathData, stroke, strokeWidth, motion, x, y0, y1, $$slots, $$events, ...restProps } = $$props;
		const xAccessor = derived(() => x ? accessor(x) : ctx.x);
		const y0Accessor = derived(() => y0 ? accessor(y0) : (d) => min(ctx.yDomain));
		const y1Accessor = derived(() => y1 ? accessor(y1) : ctx.y);
		const xOffset = derived(() => isScaleBand(ctx.xScale) ? ctx.xScale.bandwidth() / 2 : 0);
		const yOffset = derived(() => isScaleBand(ctx.yScale) ? ctx.yScale.bandwidth() / 2 : 0);
		const extractedTween = extractTweenConfig(motion);
		const tweenOptions = extractedTween ? {
			type: extractedTween.type,
			options: {
				interpolate: interpolatePath,
				...extractedTween.options
			}
		} : void 0;
		/**
		* Provide initial `0` horizontal baseline and initially hide/untrack scale changes so not
		* reactive (only set on initial mount)
		*/
		function defaultPathData() {
			if (!tweenOptions) return "";
			else if (pathData) return flattenPathData(pathData, Math.min(ctx.yScale(0), ctx.yRange[0]));
			else if (ctx.config.x) {
				const path = ctx.radial ? areaRadial().angle((d) => ctx.xScale(xAccessor()(d))).innerRadius(() => Math.min(ctx.yScale(0), ctx.yRange[0])).outerRadius(() => Math.min(ctx.yScale(0), ctx.yRange[0])) : area().x((d) => ctx.xScale(xAccessor()(d)) + xOffset()).y0(() => Math.min(ctx.yScale(0), ctx.yRange[0])).y1(() => Math.min(ctx.yScale(0), ctx.yRange[0]));
				path.defined(defined ?? ((d) => xAccessor()(d) != null && y1Accessor()(d) != null));
				if (curve) path.curve(curve);
				return path(data ?? ctx.data);
			}
		}
		const d = derived(() => {
			const _path = ctx.radial ? areaRadial().angle((d) => ctx.xScale(xAccessor()(d))).innerRadius((d) => ctx.yScale(y0Accessor()(d))).outerRadius((d) => ctx.yScale(y1Accessor()(d))) : area().x((d) => {
				const v = xAccessor()(d);
				return ctx.xScale(v) + xOffset();
			}).y0((d) => {
				let value = max(ctx.yRange);
				if (y0) value = ctx.yScale(y0Accessor()(d));
				else if (Array.isArray(ctx.config.y) && ctx.config.y[0] === 0) value = ctx.yScale(ctx.y(d)[0]);
				return value + yOffset();
			}).y1((d) => {
				let value = max(ctx.yRange);
				if (y1) value = ctx.yScale(y1Accessor()(d));
				else if (Array.isArray(ctx.config.y) && ctx.config.y[1] === 1) value = ctx.yScale(ctx.y(d)[1]);
				else value = ctx.yScale(ctx.y(d));
				return value + yOffset();
			});
			_path.defined(defined ?? ((d) => xAccessor()(d) != null && y1Accessor()(d) != null));
			if (curve) _path.curve(curve);
			return pathData ?? _path(data ?? ctx.data) ?? defaultPathData();
		});
		const tweenState = createMotion(defaultPathData(), () => d(), tweenOptions);
		function render(ctx, styleOverrides) {
			renderPathData(ctx, tweenState.current, styleOverrides ? merge({ styles: { strokeWidth } }, styleOverrides) : {
				styles: {
					fill,
					fillOpacity,
					stroke,
					strokeWidth,
					opacity
				},
				classes: restProps.class ?? "",
				style: restProps.style
			});
		}
		const fillKey = createKey(() => fill);
		const strokeKey = createKey(() => stroke);
		if (layerCtx === "canvas") registerCanvasComponent({
			name: "Area",
			render,
			events: {
				click: restProps.onclick,
				pointerenter: restProps.onpointerenter,
				pointermove: restProps.onpointermove,
				pointerleave: restProps.onpointerleave
			},
			deps: () => [
				fillKey.current,
				fillOpacity,
				strokeKey.current,
				strokeWidth,
				opacity,
				restProps.class,
				restProps.style,
				tweenState.current
			]
		});
		if (line) {
			$$renderer.push("<!--[0-->");
			Spline($$renderer, spread_props([{
				data,
				x,
				y: y1,
				curve,
				defined,
				motion
			}, extractLayerProps(line, "lc-area-line")]));
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
		if (layerCtx === "svg") {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<path${attributes({
				d: tweenState.current,
				"clip-path": clipPath,
				fill,
				"fill-opacity": fillOpacity,
				stroke,
				"stroke-width": strokeWidth,
				opacity,
				...extractLayerProps(restProps, "lc-area-path")
			}, void 0, void 0, void 0, 3)}></path>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/Line.svelte
function Line($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { x1, initialX1 = x1, y1, initialY1 = y1, x2, initialX2 = x2, y2, initialY2 = y2, class: className, strokeWidth, opacity, fill, stroke, marker, markerEnd, markerStart, markerMid, motion, fillOpacity, $$slots, $$events, ...restProps } = $$props;
		const markerStartId = derived(() => markerStart || marker ? createId("marker-start", uid) : "");
		const markerMidId = derived(() => markerMid || marker ? createId("marker-mid", uid) : "");
		const markerEndId = derived(() => markerEnd || marker ? createId("marker-end", uid) : "");
		const motionX1 = createMotion(initialX1, () => x1, motion);
		const motionY1 = createMotion(initialY1, () => y1, motion);
		const motionX2 = createMotion(initialX2, () => x2, motion);
		const motionY2 = createMotion(initialY2, () => y2, motion);
		const layerCtx = getLayerContext();
		function render(ctx, styleOverrides) {
			renderPathData(ctx, `M ${motionX1.current},${motionY1.current} L ${motionX2.current},${motionY2.current}`, styleOverrides ? merge({ styles: { strokeWidth } }, styleOverrides) : {
				styles: {
					fill,
					stroke,
					strokeWidth,
					opacity
				},
				classes: cls("lc-line", className),
				style: restProps.style
			});
		}
		const fillKey = createKey(() => fill);
		const strokeKey = createKey(() => stroke);
		if (layerCtx === "canvas") registerCanvasComponent({
			name: "Line",
			render,
			events: {
				click: restProps.onclick,
				pointerenter: restProps.onpointerenter,
				pointermove: restProps.onpointermove,
				pointerleave: restProps.onpointerleave
			},
			deps: () => [
				motionX1.current,
				motionY1.current,
				motionX2.current,
				motionY2.current,
				fillKey.current,
				strokeKey.current,
				strokeWidth,
				opacity,
				className,
				restProps.style
			]
		});
		if (layerCtx === "svg") {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<line${attributes({
				x1: motionX1.current,
				y1: motionY1.current,
				x2: motionX2.current,
				y2: motionY2.current,
				fill,
				stroke,
				"fill-opacity": fillOpacity,
				"stroke-width": strokeWidth,
				opacity,
				"marker-start": markerStartId() ? `url(#${markerStartId()})` : void 0,
				"marker-mid": markerMidId() ? `url(#${markerMidId()})` : void 0,
				"marker-end": markerEndId() ? `url(#${markerEndId()})` : void 0,
				class: clsx(cls("lc-line", className)),
				...restProps
			}, void 0, void 0, void 0, 3)}></line>`);
			MarkerWrapper($$renderer, {
				id: markerStartId(),
				marker: markerStart ?? marker
			});
			$$renderer.push(`<!---->`);
			MarkerWrapper($$renderer, {
				id: markerMidId(),
				marker: markerMid ?? marker
			});
			$$renderer.push(`<!---->`);
			MarkerWrapper($$renderer, {
				id: markerEndId(),
				marker: markerEnd ?? marker
			});
			$$renderer.push(`<!---->`);
		} else if (layerCtx === "html") {
			$$renderer.push("<!--[1-->");
			const { angle, length } = pointsToAngleAndLength({
				x: motionX1.current,
				y: motionY1.current
			}, {
				x: motionX2.current,
				y: motionY2.current
			});
			$$renderer.push(`<div${attr_class(clsx(cls("lc-line", className)))}${attr_style(restProps.style, {
				position: "absolute",
				left: `${stringify(motionX1.current)}px`,
				top: `${stringify(motionY1.current)}px`,
				width: `${stringify(length)}px`,
				height: `${stringify(strokeWidth ?? 1)}px`,
				transform: `translateY(-50%) rotate(${stringify(angle)}deg)`,
				"transform-origin": "0 50%",
				opacity,
				"background-color": stroke
			})}></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/Rule.svelte
function Rule($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { data: dataProp, x = false, xOffset = 0, y = false, yOffset = 0, stroke: strokeProp, class: className, children, $$slots, $$events, ...restProps } = $$props;
		const ctx = getChartContext();
		const data = derived(() => chartDataArray(dataProp ?? ctx.data));
		const singleX = derived(() => typeof x === "number" || x instanceof Date || x === true || x === "$left" || x === "$right" || isScaleBand(ctx.xScale) && ctx.xDomain.includes(x));
		const singleY = derived(() => typeof y === "number" || y instanceof Date || y === true || y === "$bottom" || y === "$top" || isScaleBand(ctx.yScale) && ctx.yDomain.includes(y));
		const xRangeMinMax = derived(() => extent(ctx.xRange));
		const yRangeMinMax = derived(() => extent(ctx.yRange));
		const lines = derived(() => {
			const result = [];
			if (singleX()) {
				const _x = x === true || x === "$left" ? xRangeMinMax()[0] : x === "$right" ? xRangeMinMax()[1] : ctx.xScale(x) + xOffset;
				result.push({
					x1: _x,
					y1: ctx.yRange[0] || 0,
					x2: _x,
					y2: ctx.yRange[1] || 0,
					axis: "x"
				});
			}
			if (singleY()) {
				const _y = y === true || y === "$bottom" ? yRangeMinMax()[1] : y === "$top" ? yRangeMinMax()[0] : ctx.yScale(y) + yOffset;
				result.push({
					x1: ctx.xRange[0] || 0,
					y1: _y,
					x2: ctx.xRange[1] || 0,
					y2: _y,
					axis: "y"
				});
			}
			if (!singleX() && !singleY()) {
				const xAccessor = x !== false ? accessor(x) : ctx.x;
				const yAccessor = y !== false ? accessor(y) : ctx.y;
				const xBandOffset = isScaleBand(ctx.xScale) ? ctx.xScale.bandwidth() / 2 : 0;
				const yBandOffset = isScaleBand(ctx.yScale) ? ctx.yScale.bandwidth() / 2 : 0;
				for (const d of data()) {
					const xValue = xAccessor(d);
					const yValue = yAccessor(d);
					const x1Value = Array.isArray(xValue) ? xValue[0] : isScaleNumeric(ctx.xScale) ? 0 : xValue;
					const x2Value = Array.isArray(xValue) ? xValue[1] : xValue;
					const y1Value = Array.isArray(yValue) ? yValue[0] : isScaleNumeric(ctx.yScale) ? 0 : yValue;
					const y2Value = Array.isArray(yValue) ? yValue[1] : yValue;
					result.push({
						x1: ctx.xScale(x1Value) + xBandOffset + xOffset,
						y1: ctx.yScale(y1Value) + yBandOffset + yOffset,
						x2: ctx.xScale(x2Value) + xBandOffset + xOffset,
						y2: ctx.yScale(y2Value) + yBandOffset + yOffset,
						axis: Array.isArray(yValue) || isScaleBand(ctx.xScale) ? "x" : "y",
						stroke: strokeProp ?? ctx.config.c ? ctx.cGet(d) : null
					});
				}
			}
			return result.filter((line) => {
				return line.x1 >= xRangeMinMax()[0] && line.x2 <= xRangeMinMax()[1] && line.y1 >= yRangeMinMax()[0] && line.y2 <= yRangeMinMax()[1];
			});
		});
		Group($$renderer, {
			class: "lc-rule-g",
			children: ($$renderer) => {
				$$renderer.push(`<!--[-->`);
				const each_array = ensure_array_like(lines());
				for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
					let line = each_array[$$index];
					const stroke = line.stroke ?? strokeProp;
					if (ctx.radial) {
						$$renderer.push("<!--[0-->");
						if (line.axis === "x") {
							$$renderer.push("<!--[0-->");
							const [x1, y1] = pointRadial(line.x1, line.y1);
							const [x2, y2] = pointRadial(line.x2, line.y2);
							Line($$renderer, spread_props([restProps, {
								x1,
								y1,
								x2,
								y2,
								stroke,
								class: cls("lc-rule-x-radial-line", className)
							}]));
						} else if (line.axis === "y") {
							$$renderer.push("<!--[1-->");
							Circle($$renderer, {
								r: line.y1,
								stroke,
								class: cls("lc-rule-y-radial-circle", className)
							});
						} else $$renderer.push("<!--[-1-->");
						$$renderer.push(`<!--]-->`);
					} else {
						$$renderer.push("<!--[-1-->");
						Line($$renderer, spread_props([restProps, {
							x1: line.x1,
							y1: line.y1,
							x2: line.x2,
							y2: line.y2,
							stroke,
							class: cls(line.axis === "x" ? "lc-rule-x-line" : "lc-rule-y-line", className)
						}]));
					}
					$$renderer.push(`<!--]-->`);
				}
				$$renderer.push(`<!--]-->`);
			},
			$$slots: { default: true }
		});
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/Text.svelte
function getPathLength(pathRef) {
	if (pathRef && typeof pathRef.getTotalLength === "function") try {
		return pathRef.getTotalLength();
	} catch (e) {
		console.error("Error getting path length:", e);
		return 0;
	}
	return 0;
}
function Text($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { value, x = 0, initialX = x, y = 0, initialY = y, dx = 0, dy = 0, lineHeight = "1em", capHeight = "0.71em", width, scaleToFit = false, textAnchor = "start", verticalAnchor = "end", dominantBaseline = "auto", rotate, opacity = 1, strokeWidth = 0, stroke, fill, fillOpacity, motion, svgRef: svgRefProp = void 0, ref: refProp = void 0, class: className, svgProps = {}, truncate = false, path, pathId = createId("text-path", uid), startOffset = "0%", transform: transformProp, $$slots, $$events, ...restProps } = $$props;
		const layerCtx = getLayerContext();
		let pathRef = void 0;
		let style = void 0;
		const resolvedWidth = derived(() => path ? getPathLength(pathRef) : width);
		const defaultTruncateOptions = derived(() => ({
			maxChars: void 0,
			position: "end",
			maxWidth: resolvedWidth()
		}));
		const truncateConfig = derived(() => {
			if (typeof truncate === "boolean") {
				if (truncate) return defaultTruncateOptions();
				return false;
			}
			return {
				...defaultTruncateOptions(),
				...truncate
			};
		});
		const rawText = derived(() => value != null ? value.toString().replace(/\\n/g, "\n") : "");
		const textValue = derived(() => {
			if (!truncateConfig()) return rawText();
			return truncateText(rawText(), truncateConfig());
		});
		const spaceWidth = derived(() => getStringWidth("\xA0", style) || 0);
		const wordsByLines = derived(() => {
			return textValue().split("\n").flatMap((line) => {
				const words = line.split(/(?:(?!\u00A0+)\s+)/);
				if (width == null) return [{ words }];
				else return words.reduce((result, item) => {
					const currentLine = result[result.length - 1];
					const itemWidth = getStringWidth(item, style) || 0;
					if (currentLine && (width == null || scaleToFit || (currentLine.width || 0) + itemWidth + spaceWidth() < width)) {
						currentLine.words.push(item);
						currentLine.width = currentLine.width || 0;
						currentLine.width += itemWidth + spaceWidth();
					} else {
						const newLine = {
							words: [item],
							width: itemWidth
						};
						result.push(newLine);
					}
					return result;
				}, []);
			});
		});
		const lineCount = derived(() => wordsByLines().length);
		/**
		* Convert css value to pixel value (ex. 0.71em => 11.36)
		*/
		function getPixelValue(cssValue) {
			if (typeof cssValue === "number") return cssValue;
			const result = cssValue.match(/([\d.]+)(\D+)/);
			const number = Number(result?.[1]);
			switch (result?.[2]) {
				case "px": return number;
				case "em":
				case "rem": return number * 16;
				default: return 0;
			}
		}
		const startDy = derived(() => {
			if (verticalAnchor === "start") return getPixelValue(lineHeight);
			else if (verticalAnchor === "middle") return (lineCount() - 1) / 2 * -getPixelValue(lineHeight) + getPixelValue(capHeight) / 2;
			else return (lineCount() - 1) * -getPixelValue(lineHeight) - getPixelValue(capHeight) / 2;
		});
		const scaleTransform = derived(() => {
			if (scaleToFit && lineCount() > 0 && typeof x == "number" && typeof y == "number" && typeof width == "number") {
				const sx = width / (wordsByLines()[0].width || 1);
				const sy = sx;
				return `matrix(${sx}, 0, 0, ${sy}, ${x - sx * x}, ${y - sy * y})`;
			} else return "";
		});
		const rotateTransform = derived(() => rotate ? `rotate(${rotate}, ${x}, ${y})` : "");
		const transform = derived(() => transformProp ?? `${scaleTransform()} ${rotateTransform()}`);
		function isValidXOrY(xOrY) {
			return typeof xOrY === "number" && Number.isFinite(xOrY) || typeof xOrY === "string";
		}
		const motionX = createMotion(initialX, () => x, motion);
		const motionY = createMotion(initialY, () => y, motion);
		function render(ctx, styleOverrides) {
			const effectiveLineHeight = getPixelValue(lineHeight);
			const baseY = getPixelValue(motionY.current) + getPixelValue(dy) + getPixelValue(startDy());
			const baseX = getPixelValue(motionX.current) + getPixelValue(dx);
			ctx.save();
			if (rotate !== void 0) {
				const centerX = getPixelValue(x);
				const centerY = getPixelValue(y);
				const radians = degreesToRadians(rotate);
				ctx.translate(centerX, centerY);
				ctx.rotate(radians);
				ctx.translate(-centerX, -centerY);
			}
			const styles = styleOverrides ? merge({ styles: { strokeWidth } }, styleOverrides) : {
				styles: {
					fill,
					fillOpacity,
					stroke,
					strokeWidth,
					opacity,
					paintOrder: "stroke",
					textAnchor
				},
				classes: cls("lc-text", className)
			};
			const computedStyles = getComputedStyles(ctx.canvas, styles);
			ctx.font = `${computedStyles.fontSize} ${computedStyles.fontFamily}`;
			ctx.textAlign = textAnchor === "middle" ? "center" : textAnchor === "end" ? "end" : "start";
			for (let index = 0; index < wordsByLines().length; index++) renderText(ctx, wordsByLines()[index].words.join(" "), {
				x: baseX,
				y: baseY + index * effectiveLineHeight
			}, styles);
			ctx.restore();
		}
		const fillKey = createKey(() => fill);
		const strokeKey = createKey(() => stroke);
		if (layerCtx === "canvas") registerCanvasComponent({
			name: "Text",
			render,
			deps: () => [
				value,
				motionX.current,
				motionY.current,
				fillKey.current,
				strokeKey.current,
				strokeWidth,
				opacity,
				className,
				truncateConfig(),
				rotate,
				lineHeight,
				textAnchor,
				verticalAnchor
			]
		});
		if (layerCtx === "svg") {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<svg${attributes({
				x: dx,
				y: dy,
				...svgProps,
				class: clsx(["lc-text-svg", svgProps?.class])
			}, void 0, void 0, void 0, 3)}>`);
			if (path) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<defs><!---->`);
				$$renderer.push(`<path${attr("id", pathId)}${attr("d", path)}></path>`);
				$$renderer.push(`<!----></defs><text${attributes({
					dy,
					...restProps,
					fill,
					"fill-opacity": fillOpacity,
					stroke,
					"stroke-width": strokeWidth,
					opacity,
					transform: transformProp,
					class: clsx(["lc-text", className])
				}, void 0, void 0, void 0, 3)}><textPath${attr_style(`text-anchor: ${stringify(textAnchor)};`)}${attr("dominant-baseline", dominantBaseline)}${attr("href", `#${stringify(pathId)}`)}${attr("startOffset", startOffset)} class="lc-text-path">${escape_html(wordsByLines().map((line) => line.words.join(" ")).join())}</textPath></text>`);
			} else if (isValidXOrY(x) && isValidXOrY(y)) {
				$$renderer.push("<!--[1-->");
				$$renderer.push(`<text${attributes({
					x: motionX.current,
					y: motionY.current,
					transform: transform(),
					"text-anchor": textAnchor,
					"dominant-baseline": dominantBaseline,
					...restProps,
					fill,
					"fill-opacity": fillOpacity,
					stroke,
					"stroke-width": strokeWidth,
					opacity,
					class: clsx(["lc-text", className])
				}, void 0, void 0, void 0, 3)}><!--[-->`);
				const each_array = ensure_array_like(wordsByLines());
				for (let index = 0, $$length = each_array.length; index < $$length; index++) {
					let line = each_array[index];
					$$renderer.push(`<tspan${attr("x", motionX.current)}${attr("dy", index === 0 ? startDy() : getPixelValue(lineHeight))} class="lc-text-tspan">${escape_html(line.words.join(" "))}</tspan>`);
				}
				$$renderer.push(`<!--]--></text>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></svg>`);
		} else if (layerCtx === "html") {
			$$renderer.push("<!--[1-->");
			const translateX = textAnchor === "middle" ? "-50%" : textAnchor === "end" ? "-100%" : "0%";
			const translateY = verticalAnchor === "middle" ? "-50%" : verticalAnchor === "end" ? "-100%" : "0%";
			$$renderer.push(`<div${attr_class(clsx(["lc-text", className]))}${attr_style("", {
				position: "absolute",
				left: `${stringify(dx + motionX.current)}px`,
				top: `${stringify(dy + motionY.current)}px`,
				transform: `translate(${stringify(translateX)}, ${stringify(translateY)}) rotate(${stringify(rotate ?? 0)}deg)`,
				"transform-origin": `${stringify(verticalAnchor === "middle" ? "center" : verticalAnchor === "end" ? "bottom" : "top")} ${stringify(textAnchor === "middle" ? "center" : textAnchor === "end" ? "right" : "left")}`,
				"white-space": "pre-wrap",
				"line-height": lineHeight
			})}>${escape_html(textValue())}</div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
		bind_props($$props, {
			svgRef: svgRefProp,
			ref: refProp
		});
	});
}
//#endregion
//#region node_modules/layerchart/dist/utils/ticks.js
function getDurationFormat(duration, options = { multiline: false }) {
	const { multiline = false, placement = "bottom" } = options;
	return function(date, i) {
		let result = "";
		if (+duration >= +new Duration({ duration: { years: 1 } })) result = format(date, "year");
		else if (+duration >= +new Duration({ duration: { days: 28 } })) {
			const isFirst = i === 0 || +timeYear.floor(date) === +date;
			if (multiline) result = [format(date, "month", { variant: "short" }), isFirst && format(date, "year")];
			else result = format(date, "month", { variant: "short" }) + (isFirst ? ` '${format(date, "year", { variant: "short" })}` : "");
		} else if (+duration >= +new Duration({ duration: { days: 1 } })) {
			const isFirst = i === 0 || date.getDate() <= duration.days;
			if (multiline) result = [format(date, "custom", { custom: DateToken.DayOfMonth_numeric }), isFirst && format(date, "month", { variant: "short" })];
			else result = format(date, "day", { variant: "short" });
		} else if (+duration >= +new Duration({ duration: { hours: 1 } })) {
			const isFirst = i === 0 || +timeDay.floor(date) === +date;
			if (multiline) result = [format(date, "custom", { custom: DateToken.Hour_numeric }), isFirst && format(date, "day", { variant: "short" })];
			else result = isFirst ? format(date, "day", { variant: "short" }) : format(date, "custom", { custom: DateToken.Hour_numeric });
		} else if (+duration >= +new Duration({ duration: { minutes: 1 } })) {
			const isFirst = i === 0 || +timeDay.floor(date) === +date;
			if (multiline) result = [format(date, "time", { variant: "short" }), isFirst && format(date, "day", { variant: "short" })];
			else result = format(date, "time", { variant: "short" });
		} else if (+duration >= +new Duration({ duration: { seconds: 1 } })) {
			const isFirst = i === 0 || +timeDay.floor(date) === +date;
			result = [format(date, "time"), multiline && isFirst && format(date, "day", { variant: "short" })];
		} else if (+duration >= +new Duration({ duration: { milliseconds: 1 } })) {
			const isFirst = i === 0 || +timeDay.floor(date) === +date;
			result = [format(date, "custom", { custom: [
				DateToken.Hour_2Digit,
				DateToken.Minute_2Digit,
				DateToken.Second_2Digit,
				DateToken.MiliSecond_3,
				DateToken.Hour_woAMPM
			] }), multiline && isFirst && format(date, "day", { variant: "short" })];
		} else result = date.toString();
		if (Array.isArray(result)) switch (placement) {
			case "top": return result.filter(Boolean).reverse().join("\n");
			case "bottom": return result.filter(Boolean).join("\n");
			case "left": return result.filter(Boolean).reverse().join(" ");
			case "right": return result.filter(Boolean).join(" ");
			default: return result.filter(Boolean).join("\n");
		}
		else return result;
	};
}
function autoTickVals(scale, ticks, count) {
	if (Array.isArray(ticks)) return ticks;
	if (typeof ticks === "function") return ticks(scale) ?? [];
	if (isLiteralObject(ticks) && "interval" in ticks) {
		if (ticks.interval === null || !("ticks" in scale) || typeof scale.ticks !== "function") return [];
		return scale.ticks(ticks.interval);
	}
	if (isScaleBand(scale)) return ticks && typeof ticks === "number" ? scale.domain().filter((_, i) => i % ticks === 0) : scale.domain();
	if (scale.ticks && typeof scale.ticks === "function") return scale.ticks(count ?? (typeof ticks === "number" ? ticks : void 0));
	return [];
}
function autoTickFormat(options) {
	const { scale, ticks, count, formatType, multiline, placement } = options;
	if (formatType) return (tick) => format(tick, formatType);
	if (isScaleTime(scale) && count) if (isLiteralObject(ticks) && "interval" in ticks && ticks.interval != null) return getDurationFormat(new Duration({
		start: ticks.interval.floor(/* @__PURE__ */ new Date()),
		end: ticks.interval.ceil(/* @__PURE__ */ new Date())
	}), {
		multiline,
		placement
	});
	else {
		const [start, end] = timeTicks(scale.domain()[0], scale.domain()[1], count);
		return getDurationFormat(new Duration({
			start,
			end
		}), {
			multiline,
			placement
		});
	}
	if (scale.tickFormat) return scale.tickFormat(count);
	return (tick) => `${tick}`;
}
//#endregion
//#region node_modules/layerchart/dist/components/Axis.svelte
function Axis($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { placement, label = "", labelPlacement = "middle", labelProps, rule = false, grid = false, ticks, tickSpacing = [
			"top",
			"bottom",
			"angle"
		].includes(placement) ? 80 : [
			"left",
			"right",
			"radius"
		].includes(placement) ? 50 : void 0, tickMultiline = false, tickLength = 4, tickMarks = true, format, tickLabelProps, motion, transitionIn, transitionInParams, scale: scaleProp, classes = {}, class: className, tickLabel, $$slots, $$events, ...restProps } = $$props;
		const ctx = getChartContext();
		const orientation = derived(() => placement === "angle" ? "angle" : placement === "radius" ? "radius" : ["top", "bottom"].includes(placement) ? "horizontal" : "vertical");
		const scale = derived(() => scaleProp ?? (["horizontal", "angle"].includes(orientation()) ? ctx.xScale : ctx.yScale));
		const interval = derived(() => ["horizontal", "angle"].includes(orientation()) ? ctx.xInterval : ctx.yInterval);
		const xRangeMinMax = derived(() => extent(ctx.xRange));
		const yRangeMinMax = derived(() => extent(ctx.yRange));
		const ctxSize = derived(() => orientation() === "vertical" ? ctx.height : orientation() === "horizontal" ? ctx.width : orientation() === "radius" ? ctx.height / 2 : orientation() === "angle" ? ctx.width : null);
		const tickCount = derived(() => typeof ticks === "number" ? ticks : tickSpacing && ctxSize() ? Math.round(ctxSize() / tickSpacing) : void 0);
		const tickVals = derived(() => {
			let tickVals = autoTickVals(scale(), ticks, tickCount());
			if (interval() != null) tickVals.pop();
			const formatType = typeof format === "object" ? format?.type : format;
			if (formatType === "integer") tickVals = tickVals.filter(Number.isInteger);
			else if (formatType === "year" || formatType === PeriodType.CalendarYear) tickVals = tickVals.filter((val) => +timeYear.floor(val) === +val);
			else if (formatType === "month" || formatType === PeriodType.Month || formatType === PeriodType.MonthYear) tickVals = tickVals.filter((val) => val.getDate() < 7);
			else if (formatType === "day" || formatType === PeriodType.Day) tickVals = tickVals.filter((val) => +timeDay.floor(val) === +val);
			else if (formatType === "hour" || formatType === PeriodType.Hour) tickVals = tickVals.filter((val) => +timeHour.floor(val) === +val);
			else if (formatType === "minute" || formatType === PeriodType.Minute) tickVals = tickVals.filter((val) => +timeMinute.floor(val) === +val);
			else if (formatType === "second" || formatType === PeriodType.Second) tickVals = tickVals.filter((val) => +timeSecond.floor(val) === +val);
			else if (formatType === "millisecond" || formatType === PeriodType.Millisecond) tickVals = tickVals.filter((val) => +timeMillisecond.floor(val) === +val);
			return unique(tickVals);
		});
		const tickFormat = derived(() => autoTickFormat({
			scale: scale(),
			ticks,
			count: tickCount(),
			formatType: format,
			multiline: tickMultiline,
			placement
		}));
		function getCoords(tick) {
			switch (placement) {
				case "top":
				case "bottom": return {
					x: scale()(tick) + (isScaleBand(scale()) ? scale().bandwidth() / 2 : ctx.xInterval ? (scale()(ctx.xInterval.offset(tick)) - scale()(tick)) / 2 : 0),
					y: placement === "top" ? yRangeMinMax()[0] : yRangeMinMax()[1]
				};
				case "left":
				case "right": return {
					x: placement === "left" ? xRangeMinMax()[0] : xRangeMinMax()[1],
					y: scale()(tick) + (isScaleBand(scale()) ? scale().bandwidth() / 2 : ctx.yInterval ? (scale()(ctx.yInterval.offset(tick)) - scale()(tick)) / 2 : 0)
				};
				case "angle": return {
					x: scale()(tick),
					y: yRangeMinMax()[1]
				};
				case "radius": return {
					x: xRangeMinMax()[0],
					y: scale()(tick) + (isScaleBand(scale()) ? scale().bandwidth() / 2 : 0)
				};
			}
		}
		function getDefaultTickLabelProps(tick) {
			switch (placement) {
				case "top": return {
					textAnchor: "middle",
					verticalAnchor: "end",
					dy: -tickLength
				};
				case "bottom": return {
					textAnchor: "middle",
					verticalAnchor: "start",
					dy: tickLength
				};
				case "left": return {
					textAnchor: "end",
					verticalAnchor: "middle",
					dx: -tickLength
				};
				case "right": return {
					textAnchor: "start",
					verticalAnchor: "middle",
					dx: tickLength
				};
				case "angle":
					const xValue = scale()(tick);
					return {
						textAnchor: xValue === 0 || Math.abs(xValue - Math.PI) < .01 || Math.abs(xValue - Math.PI * 2) < .01 ? "middle" : xValue > Math.PI ? "end" : "start",
						verticalAnchor: "middle",
						dx: Math.sin(xValue) * tickLength,
						dy: -Math.cos(xValue) * (tickLength + 4)
					};
				case "radius": return {
					textAnchor: "middle",
					verticalAnchor: "middle",
					dx: 2
				};
			}
		}
		const resolvedLabelX = derived(() => {
			if (placement === "left" || orientation() === "horizontal" && labelPlacement === "start") return -ctx.padding.left;
			else if (placement === "right" || orientation() === "horizontal" && labelPlacement === "end") return ctx.width + ctx.padding.right;
			return ctx.width / 2;
		});
		const resolvedLabelY = derived(() => {
			if (placement === "top" || orientation() === "vertical" && labelPlacement === "start") return -ctx.padding.top;
			else if (orientation() === "vertical" && labelPlacement === "middle") return ctx.height / 2;
			else if (placement === "bottom" || labelPlacement === "end") return ctx.height + ctx.padding.bottom;
			return "0";
		});
		const resolvedLabelTextAnchor = derived(() => {
			if (labelPlacement === "middle") return "middle";
			else if (placement === "right" || orientation() === "horizontal" && labelPlacement === "end") return "end";
			return "start";
		});
		const resolvedLabelVerticalAnchor = derived(() => {
			if (placement === "top" || orientation() === "vertical" && labelPlacement === "start" || placement === "left" && labelPlacement === "middle") return "start";
			return "end";
		});
		const resolvedLabelProps = derived(() => ({
			value: typeof label === "function" ? "" : label,
			x: resolvedLabelX(),
			y: resolvedLabelY(),
			textAnchor: resolvedLabelTextAnchor(),
			verticalAnchor: resolvedLabelVerticalAnchor(),
			rotate: orientation() === "vertical" && labelPlacement === "middle" ? -90 : 0,
			capHeight: "7px",
			lineHeight: "11px",
			...labelProps,
			class: cls("lc-axis-label", classes.label, labelProps?.class)
		}));
		Group($$renderer, spread_props([restProps, {
			"data-placement": placement,
			class: cls("lc-axis", `placement-${placement}`, classes.root, className),
			children: ($$renderer) => {
				if (rule !== false) {
					$$renderer.push("<!--[0-->");
					Rule($$renderer, spread_props([{
						x: placement === "left" ? "$left" : placement === "right" ? "$right" : placement === "angle",
						y: placement === "top" ? "$top" : placement === "bottom" ? "$bottom" : placement === "radius",
						motion
					}, extractLayerProps(rule, "lc-axis-rule", classes.rule ?? "")]));
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> `);
				if (typeof label === "function") {
					$$renderer.push("<!--[0-->");
					label($$renderer, { props: resolvedLabelProps() });
					$$renderer.push(`<!---->`);
				} else if (label) {
					$$renderer.push("<!--[1-->");
					Text($$renderer, spread_props([resolvedLabelProps()]));
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> <!--[-->`);
				const each_array = ensure_array_like(tickVals());
				for (let index = 0, $$length = each_array.length; index < $$length; index++) {
					let tick = each_array[index];
					const tickCoords = getCoords(tick);
					const [radialTickCoordsX, radialTickCoordsY] = pointRadial(tickCoords.x, tickCoords.y);
					const [radialTickMarkCoordsX, radialTickMarkCoordsY] = pointRadial(tickCoords.x, tickCoords.y + tickLength);
					const resolvedTickLabelProps = {
						x: orientation() === "angle" ? radialTickCoordsX : tickCoords.x,
						y: orientation() === "angle" ? radialTickCoordsY : tickCoords.y,
						value: tickFormat()(tick, index),
						...getDefaultTickLabelProps(tick),
						motion,
						capHeight: "7px",
						lineHeight: "11px",
						...tickLabelProps,
						class: cls("lc-axis-tick-label", classes.tickLabel, tickLabelProps?.class)
					};
					Group($$renderer, {
						transitionIn,
						transitionInParams,
						class: "lc-axis-tick-group",
						children: ($$renderer) => {
							if (grid !== false) {
								$$renderer.push("<!--[0-->");
								Rule($$renderer, spread_props([{
									x: orientation() === "horizontal" || orientation() === "angle" ? tick : false,
									y: orientation() === "vertical" || orientation() === "radius" ? tick : false,
									motion
								}, extractLayerProps(grid, "lc-axis-grid", classes.rule ?? "")]));
							} else $$renderer.push("<!--[-1-->");
							$$renderer.push(`<!--]--> `);
							if (tickMarks) {
								$$renderer.push("<!--[0-->");
								const tickClasses = cls("lc-axis-tick", classes.tick);
								if (orientation() === "horizontal") {
									$$renderer.push("<!--[0-->");
									Line($$renderer, {
										x1: tickCoords.x,
										y1: tickCoords.y,
										x2: tickCoords.x,
										y2: tickCoords.y + (placement === "top" ? -tickLength : tickLength),
										motion,
										class: tickClasses
									});
								} else if (orientation() === "vertical") {
									$$renderer.push("<!--[1-->");
									Line($$renderer, {
										x1: tickCoords.x,
										y1: tickCoords.y,
										x2: tickCoords.x + (placement === "left" ? -tickLength : tickLength),
										y2: tickCoords.y,
										motion,
										class: tickClasses
									});
								} else if (orientation() === "angle") {
									$$renderer.push("<!--[2-->");
									Line($$renderer, {
										x1: radialTickCoordsX,
										y1: radialTickCoordsY,
										x2: radialTickMarkCoordsX,
										y2: radialTickMarkCoordsY,
										motion,
										class: tickClasses
									});
								} else $$renderer.push("<!--[-1-->");
								$$renderer.push(`<!--]-->`);
							} else $$renderer.push("<!--[-1-->");
							$$renderer.push(`<!--]--> `);
							if (tickLabel) {
								$$renderer.push("<!--[0-->");
								tickLabel($$renderer, {
									props: resolvedTickLabelProps,
									index
								});
								$$renderer.push(`<!---->`);
							} else {
								$$renderer.push("<!--[-1-->");
								Text($$renderer, spread_props([resolvedTickLabelProps]));
							}
							$$renderer.push(`<!--]-->`);
						},
						$$slots: { default: true }
					});
				}
				$$renderer.push(`<!--]-->`);
			},
			$$slots: { default: true }
		}]));
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/Grid.svelte
function Grid($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const ctx = getChartContext();
		let { x = false, y = false, xTicks, yTicks: yTicksProp, bandAlign = "center", radialY = "circle", motion, transitionIn: transitionInProp, transitionInParams = { easing: cubicIn }, classes = {}, class: className, ref: refProp = void 0, $$slots, $$events, ...restProps } = $$props;
		let ref = void 0;
		const yTicks = derived(() => yTicksProp ?? (!isScaleBand(ctx.yScale) ? 4 : void 0));
		const tweenConfig = derived(() => extractTweenConfig(motion));
		const transitionIn = derived(() => transitionInProp ?? tweenConfig()?.options ? fade : () => ({}));
		const xTickVals = derived(() => autoTickVals(ctx.xScale, xTicks));
		const yTickVals = derived(() => autoTickVals(ctx.yScale, yTicks()));
		const xBandOffset = derived(() => isScaleBand(ctx.xScale) ? bandAlign === "between" ? -(ctx.xScale.padding() * ctx.xScale.step()) / 2 : ctx.xScale.step() / 2 - ctx.xScale.padding() * ctx.xScale.step() / 2 : 0);
		const yBandOffset = derived(() => isScaleBand(ctx.yScale) ? bandAlign === "between" ? -(ctx.yScale.padding() * ctx.yScale.step()) / 2 : ctx.yScale.step() / 2 - ctx.yScale.padding() * ctx.yScale.step() / 2 : 0);
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			Group($$renderer, spread_props([
				{ class: cls("lc-grid", classes.root, className) },
				restProps,
				{
					get ref() {
						return ref;
					},
					set ref($$value) {
						ref = $$value;
						$$settled = false;
					},
					children: ($$renderer) => {
						if (x) {
							$$renderer.push("<!--[0-->");
							const splineProps = extractLayerProps(x, "lc-grid-x-line");
							Group($$renderer, {
								transitionIn: transitionIn(),
								transitionInParams,
								class: "lc-grid-x",
								children: ($$renderer) => {
									$$renderer.push(`<!--[-->`);
									const each_array = ensure_array_like(xTickVals());
									for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
										let x = each_array[$$index];
										if (ctx.radial) {
											$$renderer.push("<!--[0-->");
											const [x1, y1] = pointRadial(ctx.xScale(x), ctx.yRange[0]);
											const [x2, y2] = pointRadial(ctx.xScale(x), ctx.yRange[1]);
											Line($$renderer, spread_props([
												{
													x1,
													y1,
													x2,
													y2,
													motion: tweenConfig()
												},
												splineProps,
												{ class: cls("lc-grid-x-radial-line", classes.line, splineProps?.class) }
											]));
										} else {
											$$renderer.push("<!--[-1-->");
											Rule($$renderer, spread_props([
												{
													x,
													xOffset: xBandOffset(),
													motion
												},
												splineProps,
												{ class: cls("lc-grid-x-rule", classes.line, splineProps?.class) }
											]));
										}
										$$renderer.push(`<!--]-->`);
									}
									$$renderer.push(`<!--]--> `);
									if (isScaleBand(ctx.xScale) && bandAlign === "between" && !ctx.radial && xTickVals().length) {
										$$renderer.push("<!--[0-->");
										ctx.xScale(xTickVals()[xTickVals().length - 1]) + ctx.xScale.step() + xBandOffset();
										Rule($$renderer, spread_props([
											{
												x: xTickVals()[xTickVals().length - 1],
												xOffset: ctx.xScale.step() + xBandOffset(),
												motion
											},
											splineProps,
											{ class: cls("lc-grid-x-end-rule", classes.line, splineProps?.class) }
										]));
									} else $$renderer.push("<!--[-1-->");
									$$renderer.push(`<!--]-->`);
								},
								$$slots: { default: true }
							});
						} else $$renderer.push("<!--[-1-->");
						$$renderer.push(`<!--]--> `);
						if (y) {
							$$renderer.push("<!--[0-->");
							const splineProps = extractLayerProps(y, "lc-grid-y-line");
							Group($$renderer, {
								transitionIn: transitionIn(),
								transitionInParams,
								class: "lc-grid-y",
								children: ($$renderer) => {
									$$renderer.push(`<!--[-->`);
									const each_array_1 = ensure_array_like(yTickVals());
									for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
										let y = each_array_1[$$index_1];
										if (ctx.radial) {
											$$renderer.push("<!--[0-->");
											if (radialY === "circle") {
												$$renderer.push("<!--[0-->");
												Circle($$renderer, spread_props([
													{
														r: ctx.yScale(y) + yBandOffset(),
														motion
													},
													splineProps,
													{ class: cls("lc-grid-y-radial-circle", classes.line, splineProps?.class) }
												]));
											} else {
												$$renderer.push("<!--[-1-->");
												Spline($$renderer, spread_props([
													{
														data: xTickVals().map((x) => ({
															x,
															y
														})),
														x: "x",
														y: "y",
														motion: tweenConfig(),
														curve: curveLinearClosed
													},
													splineProps,
													{ class: cls("lc-grid-y-radial-line", classes.line, splineProps?.class) }
												]));
											}
											$$renderer.push(`<!--]-->`);
										} else {
											$$renderer.push("<!--[-1-->");
											Line($$renderer, spread_props([
												{
													x1: ctx.xRange[0],
													y1: ctx.yScale(y) + yBandOffset(),
													x2: ctx.xRange[1],
													y2: ctx.yScale(y) + yBandOffset(),
													motion
												},
												splineProps,
												{ class: cls("lc-grid-y-rule", classes.line, splineProps?.class) }
											]));
										}
										$$renderer.push(`<!--]-->`);
									}
									$$renderer.push(`<!--]--> `);
									if (isScaleBand(ctx.yScale) && bandAlign === "between" && yTickVals().length) {
										$$renderer.push("<!--[0-->");
										if (ctx.radial) {
											$$renderer.push("<!--[0-->");
											Circle($$renderer, spread_props([
												{
													r: ctx.yScale(yTickVals()[yTickVals().length - 1]) + ctx.yScale.step() + yBandOffset(),
													motion
												},
												splineProps,
												{ class: cls("lc-grid-y-radial-circle", classes.line, splineProps?.class) }
											]));
										} else {
											$$renderer.push("<!--[-1-->");
											const y = ctx.yScale(yTickVals()[yTickVals().length - 1]) + ctx.yScale.step() + yBandOffset();
											Line($$renderer, spread_props([
												{
													x1: ctx.xRange[0],
													y1: y,
													x2: ctx.xRange[1],
													y2: y,
													motion
												},
												splineProps,
												{ class: cls("lc-grid-y-end-rule", classes.line, splineProps?.class) }
											]));
										}
										$$renderer.push(`<!--]-->`);
									} else $$renderer.push("<!--[-1-->");
									$$renderer.push(`<!--]-->`);
								},
								$$slots: { default: true }
							});
						} else $$renderer.push("<!--[-1-->");
						$$renderer.push(`<!--]-->`);
					},
					$$slots: { default: true }
				}
			]));
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { ref: refProp });
	});
}
//#endregion
//#region node_modules/layerchart/dist/utils/rect.svelte.js
function resolveInsets(insets) {
	const all = insets?.all ?? 0;
	const x = insets?.x ?? all;
	const y = insets?.y ?? all;
	const left = insets?.left ?? x;
	const right = insets?.right ?? x;
	const top = insets?.top ?? y;
	return {
		left,
		right,
		bottom: insets?.bottom ?? y,
		top
	};
}
function createDimensionGetter(ctx, getOptions) {
	const options = derived(() => getOptions?.());
	return (item) => {
		const insets = resolveInsets(options()?.insets);
		const xDomainMinMax = ctx.xScale.domain();
		const yDomainMinMax = ctx.yScale.domain();
		const _x = accessor(options()?.x ?? ctx.x);
		const _y = accessor(options()?.y ?? ctx.y);
		const _x1 = accessor(options()?.x1 ?? ctx.x1);
		const _y1 = accessor(options()?.y1 ?? ctx.y1);
		const hasX1 = (options()?.x1 ?? ctx.config.x1) != null;
		const hasY1 = (options()?.y1 ?? ctx.config.y1) != null;
		if (isScaleBand(ctx.yScale)) {
			const y = firstValue(ctx.yScale(_y(item)) ?? 0) + (hasY1 && ctx.y1Scale ? ctx.y1Scale(_y1(item)) : 0) + insets.top;
			const height = Math.max(0, ctx.yScale.bandwidth ? (hasY1 && ctx.y1Scale ? ctx.y1Scale.bandwidth?.() ?? 0 : ctx.yScale.bandwidth()) - insets.bottom - insets.top : 0);
			const xValue = _x(item);
			let left = 0;
			let right = 0;
			if (Array.isArray(xValue)) {
				left = min(xValue);
				right = max(xValue);
			} else if (xValue == null) {
				left = 0;
				right = 0;
			} else if (xValue > 0) {
				left = max([0, xDomainMinMax[0]]);
				right = xValue;
			} else {
				left = xValue;
				right = min([0, xDomainMinMax[1]]);
			}
			return {
				x: ctx.xScale(left) + insets.left,
				y,
				width: Math.max(0, ctx.xScale(right) - ctx.xScale(left) - insets.left - insets.right),
				height
			};
		} else if (isScaleBand(ctx.xScale)) {
			const x = firstValue(ctx.xScale(_x(item))) + (hasX1 && ctx.x1Scale ? ctx.x1Scale(_x1(item)) : 0) + insets.left;
			const width = Math.max(0, ctx.xScale.bandwidth ? (hasX1 && ctx.x1Scale ? ctx.x1Scale.bandwidth?.() ?? 0 : ctx.xScale.bandwidth()) - insets.left - insets.right : 0);
			const yValue = _y(item);
			let top = 0;
			let bottom = 0;
			if (Array.isArray(yValue)) {
				top = max(yValue);
				bottom = min(yValue);
			} else if (yValue == null) {
				top = 0;
				bottom = 0;
			} else if (yValue > 0) {
				top = yValue;
				bottom = max([0, yDomainMinMax[0]]);
			} else {
				top = min([0, yDomainMinMax[1]]);
				bottom = yValue;
			}
			if (ctx.yRange[0] < ctx.yRange[1]) [top, bottom] = [bottom, top];
			return {
				x,
				y: ctx.yScale(top) + insets.top,
				width,
				height: ctx.yScale(bottom) - ctx.yScale(top) - insets.bottom - insets.top
			};
		} else if (ctx.xInterval) {
			const xValue = _x(item);
			const start = ctx.xInterval.floor(xValue);
			const end = ctx.xInterval.offset(start);
			const xStart = ctx.xScale(start);
			const xEnd = ctx.xScale(end);
			const x = Math.min(xStart, xEnd) + insets.left;
			const width = Math.abs(xEnd - xStart) - insets.left - insets.right;
			const yValue = _y(item);
			let top = 0;
			let bottom = 0;
			if (Array.isArray(yValue)) {
				top = max(yValue);
				bottom = min(yValue);
			} else if (yValue == null) {
				top = 0;
				bottom = 0;
			} else if (yValue > 0) {
				top = yValue;
				bottom = max([0, yDomainMinMax[0]]);
			} else {
				top = min([0, yDomainMinMax[1]]);
				bottom = yValue;
			}
			return {
				x,
				y: ctx.yScale(top) + insets.top,
				width,
				height: ctx.yScale(bottom) - ctx.yScale(top) - insets.bottom - insets.top
			};
		} else if (ctx.yInterval) {
			const yValue = _y(item);
			const start = ctx.yInterval.floor(yValue);
			const end = ctx.yInterval.offset(start);
			const yStart = ctx.yScale(start);
			const yEnd = ctx.yScale(end);
			const y = Math.min(yStart, yEnd) + insets.top;
			const height = Math.abs(yEnd - yStart) - insets.top - insets.bottom;
			const xValue = _x(item);
			let left = 0;
			let right = 0;
			if (Array.isArray(xValue)) {
				left = min(xValue);
				right = max(xValue);
			} else if (xValue == null) {
				left = 0;
				right = 0;
			} else if (xValue > 0) {
				left = max([0, xDomainMinMax[0]]);
				right = xValue;
			} else {
				left = xValue;
				right = min([0, xDomainMinMax[1]]);
			}
			const x = ctx.xScale(left) + insets.left;
			return {
				x,
				y,
				width: ctx.xScale(right) - x - insets.right,
				height
			};
		}
	};
}
/**
* If value is an array, returns first item, else returns original value
* Useful when x/y getters for band scale are an array (such as for histograms)
*/
function firstValue(value) {
	return Array.isArray(value) ? value[0] : value;
}
//#endregion
//#region node_modules/layerchart/dist/components/Bar.svelte
function Bar($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const ctx = getChartContext();
		let { data, x = ctx.x, y = ctx.y, x1, y1, fill, fillOpacity, stroke: strokeProp = "black", strokeWidth = 0, opacity, radius = 0, rounded: roundedProp = "all", motion, insets, initialX, initialY, initialHeight, initialWidth, $$slots, $$events, ...restProps } = $$props;
		const stroke = derived(() => strokeProp === null || strokeProp === void 0 ? "black" : strokeProp);
		const getDimensions = derived(() => createDimensionGetter(ctx, () => ({
			x,
			y,
			x1,
			y1,
			insets
		})));
		const dimensions = derived(() => getDimensions()(data) ?? {
			x: 0,
			y: 0,
			width: 0,
			height: 0
		});
		const isVertical = derived(() => isScaleBand(ctx.xScale) || isScaleTime(ctx.xScale));
		const valueAccessor = derived(() => accessor(isVertical() ? y : x));
		const value = derived(() => valueAccessor()(data));
		const resolvedValue = derived(() => Array.isArray(value()) ? greatestAbs(value()) : value());
		const rounded = derived(() => roundedProp === "edge" ? isVertical() ? resolvedValue() >= 0 && ctx.yRange[0] > ctx.yRange[1] ? "top" : "bottom" : resolvedValue() >= 0 && ctx.xRange[0] < ctx.xRange[1] ? "right" : "left" : roundedProp);
		const topLeft = derived(() => [
			"all",
			"top",
			"left",
			"top-left"
		].includes(rounded()));
		const topRight = derived(() => [
			"all",
			"top",
			"right",
			"top-right"
		].includes(rounded()));
		const bottomLeft = derived(() => [
			"all",
			"bottom",
			"left",
			"bottom-left"
		].includes(rounded()));
		const bottomRight = derived(() => [
			"all",
			"bottom",
			"right",
			"bottom-right"
		].includes(rounded()));
		const width = derived(() => dimensions().width);
		const height = derived(() => dimensions().height);
		const r = derived(() => Math.min(radius, width() / 2, height() / 2));
		const diameter = derived(() => 2 * r());
		const pathData = derived(() => `M${dimensions().x + r()},${dimensions().y} h${width() - diameter()}
      ${topRight() ? `a${r()},${r()} 0 0 1 ${r()},${r()}` : `h${r()}v${r()}`}
      v${height() - diameter()}
      ${bottomRight() ? `a${r()},${r()} 0 0 1 ${-r()},${r()}` : `v${r()}h${-r()}`}
      h${diameter() - width()}
      ${bottomLeft() ? `a${r()},${r()} 0 0 1 ${-r()},${-r()}` : `h${-r()}v${-r()}`}
      v${diameter() - height()}
      ${topLeft() ? `a${r()},${r()} 0 0 1 ${r()},${-r()}` : `v${-r()}h${r()}`}
      z`.split("\n").join(""));
		if (ctx.radial) {
			$$renderer.push("<!--[0-->");
			Arc($$renderer, spread_props([{
				innerRadius: dimensions().y,
				outerRadius: dimensions().y + dimensions().height,
				startAngle: dimensions().x,
				endAngle: dimensions().x + dimensions().width,
				fill,
				fillOpacity,
				stroke: stroke(),
				strokeWidth,
				opacity,
				cornerRadius: radius
			}, extractLayerProps(restProps, "lc-bar")]));
		} else if (rounded() === "all" || rounded() === "none" || radius === 0) {
			$$renderer.push("<!--[1-->");
			Rect($$renderer, spread_props([
				{
					fill,
					fillOpacity,
					stroke: stroke(),
					strokeWidth,
					opacity,
					rx: rounded() === "none" ? 0 : radius,
					motion,
					initialX,
					initialY,
					initialHeight,
					initialWidth
				},
				dimensions(),
				extractLayerProps(restProps, "lc-bar")
			]));
		} else {
			$$renderer.push("<!--[-1-->");
			const tweenMotion = extractTweenConfig(motion);
			Path($$renderer, spread_props([{
				pathData: pathData(),
				fill,
				fillOpacity,
				stroke: stroke(),
				strokeWidth,
				opacity,
				motion: tweenMotion
			}, extractLayerProps(restProps, "lc-bar")]));
		}
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/Highlight.svelte
function Highlight($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const ctx = getChartContext();
		const tooltipCtx = getTooltipContext();
		let { data, x: xProp = ctx.x, y: yProp = ctx.y, axis: axisProp, points = false, lines: linesProp = false, area = false, bar = false, opacity, motion = "spring", onAreaClick, onBarClick, onPointClick, onPointEnter, onPointLeave } = $$props;
		const x = derived(() => accessor(xProp));
		const y = derived(() => accessor(yProp));
		const highlightData = derived(() => data ?? tooltipCtx.data);
		const xValue = derived(() => x()(highlightData()));
		const xCoord = derived(() => Array.isArray(xValue()) ? xValue().map((v) => ctx.xScale(v)) : ctx.xScale(xValue()));
		const xOffset = derived(() => isScaleBand(ctx.xScale) && !ctx.radial ? ctx.xScale.bandwidth() / 2 : 0);
		const yValue = derived(() => y()(highlightData()));
		const yCoord = derived(() => Array.isArray(yValue()) ? yValue().map((v) => ctx.yScale(v)) : ctx.yScale(yValue()));
		const yOffset = derived(() => isScaleBand(ctx.yScale) && !ctx.radial ? ctx.yScale.bandwidth() / 2 : 0);
		const axis = derived(() => axisProp == null ? isScaleBand(ctx.yScale) || isScaleTime(ctx.yScale) ? "y" : "x" : axisProp);
		const _lines = derived(() => {
			let tmpLines = [];
			if (!highlightData()) return tmpLines;
			if (axis() === "x" || axis() === "both") {
				if (Array.isArray(xCoord())) tmpLines = [...tmpLines, ...xCoord().filter(notNull).map((xItem, i) => ({
					x1: xItem + xOffset(),
					y1: min(ctx.yRange),
					x2: xItem + xOffset(),
					y2: max(ctx.yRange)
				}))];
				else if (xCoord() != null) tmpLines = [...tmpLines, {
					x1: xCoord() + xOffset(),
					y1: min(ctx.yRange),
					x2: xCoord() + xOffset(),
					y2: max(ctx.yRange)
				}];
			}
			if (axis() === "y" || axis() === "both") {
				if (Array.isArray(yCoord())) tmpLines = [...tmpLines, ...yCoord().filter(notNull).map((yItem, i) => ({
					x1: min(ctx.xRange),
					y1: yItem + yOffset(),
					x2: max(ctx.xRange),
					y2: yItem + yOffset()
				}))];
				else if (yCoord() != null) tmpLines = [...tmpLines, {
					x1: min(ctx.xRange),
					y1: yCoord() + yOffset(),
					x2: max(ctx.xRange),
					y2: yCoord() + yOffset()
				}];
			}
			if (ctx.radial) tmpLines = tmpLines.map((l) => {
				const [x1, y1] = pointRadial(l.x1, l.y1);
				const [x2, y2] = pointRadial(l.x2, l.y2);
				return {
					...l,
					x1,
					y1,
					x2,
					y2
				};
			});
			return tmpLines;
		});
		const _area = derived(() => {
			const tmpArea = {
				x: 0,
				y: 0,
				width: 0,
				height: 0
			};
			if (!highlightData()) return tmpArea;
			if (axis() === "x" || axis() === "both") {
				if (Array.isArray(xCoord())) {
					tmpArea.x = min(xCoord());
					tmpArea.width = max(xCoord()) - min(xCoord());
				} else if (isScaleBand(ctx.xScale)) {
					tmpArea.x = xCoord() - ctx.xScale.padding() * ctx.xScale.step() / 2;
					tmpArea.width = ctx.xScale.step();
				} else if (ctx.xInterval) {
					const start = ctx.xInterval.floor(xValue());
					const end = ctx.xInterval.offset(start);
					const xStart = ctx.xScale(start);
					const xEnd = ctx.xScale(end);
					tmpArea.x = Math.min(xStart, xEnd);
					tmpArea.width = Math.abs(xEnd - xStart);
				} else {
					const index = ctx.flatData.findIndex((d) => Number(x()(d)) === Number(x()(highlightData())));
					const nextDataPoint = index + 1 === ctx.flatData.length ? max(ctx.xDomain) : x()(ctx.flatData[index + 1]);
					tmpArea.x = xCoord();
					tmpArea.width = (ctx.xScale(nextDataPoint) ?? 0) - (xCoord() ?? 0);
				}
				if (axis() === "x") {
					tmpArea.y = min(ctx.yRange);
					tmpArea.height = max(ctx.yRange) - min(ctx.yRange);
				}
			}
			if (axis() === "y" || axis() === "both") {
				if (Array.isArray(yCoord())) {
					tmpArea.y = min(yCoord());
					tmpArea.height = max(yCoord()) - min(yCoord());
				} else if (isScaleBand(ctx.yScale)) {
					tmpArea.y = yCoord() - ctx.yScale.padding() * ctx.yScale.step() / 2;
					tmpArea.height = ctx.yScale.step();
				} else if (ctx.yInterval) {
					const start = ctx.yInterval.floor(yValue());
					const end = ctx.yInterval.offset(start);
					const yStart = ctx.yScale(start);
					const yEnd = ctx.yScale(end);
					tmpArea.y = Math.min(yStart, yEnd);
					tmpArea.height = Math.abs(yEnd - yStart);
				} else {
					const index = ctx.flatData.findIndex((d) => Number(y()(d)) === Number(y()(highlightData())));
					const nextDataPoint = index + 1 === ctx.flatData.length ? max(ctx.yDomain) : y()(ctx.flatData[index + 1]);
					tmpArea.y = yCoord();
					tmpArea.height = (ctx.yScale(nextDataPoint) ?? 0) - (yCoord() ?? 0);
				}
				if (axis() === "y") tmpArea.width = max(ctx.xRange);
			}
			return tmpArea;
		});
		const _points = derived(() => {
			let tmpPoints = [];
			if (!highlightData()) return tmpPoints;
			if (Array.isArray(xCoord())) if (Array.isArray(highlightData())) {
				const highlightSeriesPoint = highlightData();
				if (Array.isArray(ctx.data)) tmpPoints = ctx.data.map((series) => {
					return {
						series,
						point: series.find((d) => y()(d) === y()(highlightSeriesPoint))
					};
				}).filter((d) => d.point).map((seriesPoint, i) => {
					return {
						x: ctx.xScale(seriesPoint.point[1]) + xOffset(),
						y: yCoord() + yOffset(),
						fill: ctx.config.c ? ctx.cGet(seriesPoint.series) : null,
						data: {
							x: seriesPoint.point[1],
							y: yValue()
						}
					};
				});
			} else tmpPoints = xCoord().filter(notNull).map((xItem, i) => {
				const _key = ctx.config.x?.[i];
				return {
					x: xItem + xOffset(),
					y: yCoord() + yOffset(),
					fill: ctx.config.c ? ctx.cGet({
						...highlightData(),
						$key: _key
					}) : null,
					data: {
						x: xValue(),
						y: yValue()
					}
				};
			});
			else if (Array.isArray(yCoord())) if (Array.isArray(highlightData())) {
				const highlightSeriesPoint = highlightData();
				if (Array.isArray(ctx.data)) tmpPoints = ctx.data.map((series) => {
					return {
						series,
						point: series.find((d) => x()(d) === x()(highlightSeriesPoint))
					};
				}).filter((d) => d.point).map((seriesPoint, i) => ({
					x: xCoord() + xOffset(),
					y: ctx.yScale(seriesPoint.point[1]) + yOffset(),
					fill: ctx.config.c ? ctx.cGet(seriesPoint.series) : null,
					data: {
						x: xValue(),
						y: seriesPoint.point[1]
					}
				}));
			} else tmpPoints = yCoord().filter(notNull).map((yItem, i) => {
				const _key = ctx.config.y[i];
				return {
					x: xCoord() + xOffset(),
					y: yItem + yOffset(),
					fill: ctx.config.c ? ctx.cGet({
						...highlightData(),
						$key: _key
					}) : null,
					data: {
						x: xValue(),
						y: yValue()
					}
				};
			});
			else if (xCoord() != null && yCoord() != null) tmpPoints = [{
				x: xCoord() + xOffset(),
				y: yCoord() + yOffset(),
				fill: ctx.config.c ? ctx.cGet(highlightData()) : null,
				data: {
					x: xValue(),
					y: yValue()
				}
			}];
			else tmpPoints = [];
			if (ctx.radial) tmpPoints = tmpPoints.map((p) => {
				const [x, y] = pointRadial(p.x, p.y);
				return {
					...p,
					x,
					y
				};
			});
			return tmpPoints;
		});
		if (highlightData()) {
			$$renderer.push("<!--[0-->");
			if (area) {
				$$renderer.push("<!--[0-->");
				if (typeof area === "function") {
					$$renderer.push("<!--[0-->");
					area($$renderer, { area: _area() });
					$$renderer.push(`<!---->`);
				} else if (ctx.radial) {
					$$renderer.push("<!--[1-->");
					Arc($$renderer, {
						motion: motion === "spring" ? "spring" : void 0,
						startAngle: _area().x,
						endAngle: _area().x + _area().width,
						innerRadius: _area().y,
						outerRadius: _area().y + _area().height,
						opacity,
						class: "lc-highlight-area",
						onclick: onAreaClick && ((e) => onAreaClick(e, { data: highlightData() }))
					});
				} else {
					$$renderer.push("<!--[-1-->");
					Rect($$renderer, spread_props([
						{
							motion: motion === "spring" ? "spring" : void 0,
							opacity
						},
						_area(),
						extractLayerProps(area, "lc-highlight-area"),
						{ onclick: onAreaClick && ((e) => onAreaClick(e, { data: highlightData() })) }
					]));
				}
				$$renderer.push(`<!--]-->`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if (bar) {
				$$renderer.push("<!--[0-->");
				if (typeof bar === "function") {
					$$renderer.push("<!--[0-->");
					bar($$renderer);
					$$renderer.push(`<!---->`);
				} else {
					$$renderer.push("<!--[-1-->");
					Bar($$renderer, spread_props([
						{
							motion: motion === "spring" ? "spring" : void 0,
							data: highlightData(),
							opacity
						},
						extractLayerProps(bar, "lc-highlight-bar"),
						{ onclick: onBarClick && ((e) => onBarClick(e, { data: highlightData() })) }
					]));
				}
				$$renderer.push(`<!--]-->`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if (linesProp) {
				$$renderer.push("<!--[0-->");
				if (typeof linesProp === "function") {
					$$renderer.push("<!--[0-->");
					linesProp($$renderer, { lines: _lines() });
					$$renderer.push(`<!---->`);
				} else {
					$$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--[-->`);
					const each_array = ensure_array_like(_lines());
					for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
						let line = each_array[$$index];
						Line($$renderer, spread_props([{
							motion: motion === "spring" ? "spring" : void 0,
							x1: line.x1,
							y1: line.y1,
							x2: line.x2,
							y2: line.y2,
							opacity
						}, extractLayerProps(linesProp, "lc-highlight-line")]));
					}
					$$renderer.push(`<!--]-->`);
				}
				$$renderer.push(`<!--]-->`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if (points) {
				$$renderer.push("<!--[0-->");
				if (typeof points === "function") {
					$$renderer.push("<!--[0-->");
					points($$renderer, { points: _points() });
					$$renderer.push(`<!---->`);
				} else {
					$$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--[-->`);
					const each_array_1 = ensure_array_like(_points());
					for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
						let point = each_array_1[$$index_1];
						Circle($$renderer, spread_props([
							{
								motion: motion === "spring" ? "spring" : void 0,
								cx: point.x,
								cy: point.y,
								fill: point.fill,
								r: 4,
								strokeWidth: 6,
								opacity
							},
							extractLayerProps(points, "lc-highlight-point"),
							{
								onpointerdown: onPointClick && ((e) => {
									e.stopPropagation();
								}),
								onclick: onPointClick && ((e) => onPointClick(e, {
									point,
									data: highlightData()
								})),
								onpointerenter: onPointEnter && ((e) => {
									if (onPointClick) asAny(e.target).style.cursor = "pointer";
									onPointEnter(e, {
										point,
										data: highlightData()
									});
								}),
								onpointerleave: onPointLeave && ((e) => {
									if (onPointClick) asAny(e.target).style.cursor = "default";
									onPointLeave(e, {
										point,
										data: highlightData()
									});
								})
							}
						]));
					}
					$$renderer.push(`<!--]-->`);
				}
				$$renderer.push(`<!--]-->`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]-->`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/Points.svelte
function Points($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const ctx = getChartContext();
		let { data, x, y, r = 5, offsetX, offsetY, fill, fillOpacity, stroke, strokeWidth, opacity, children, $$slots, $$events, ...restProps } = $$props;
		function getOffset(value, offset, scale) {
			if (typeof offset === "function") return offset(value, ctx);
			else if (offset != null) return offset;
			else if (isScaleBand(scale) && !ctx.radial) return scale.bandwidth() / 2;
			else return 0;
		}
		const xAccessor = derived(() => x ? accessor(x) : ctx.x);
		const yAccessor = derived(() => y ? accessor(y) : ctx.y);
		const pointsData = derived(() => data ?? ctx.data);
		const getPointObject = (xVal, yVal, d) => {
			const scaledX = ctx.xScale(xVal);
			const scaledY = ctx.yScale(yVal);
			const x = scaledX + getOffset(scaledX, offsetX, ctx.xScale);
			const y = scaledY + getOffset(scaledY, offsetY, ctx.yScale);
			const radialPoint = pointRadial(x, y);
			return {
				x: ctx.radial ? radialPoint[0] : x,
				y: ctx.radial ? radialPoint[1] : y,
				r: ctx.config.r ? ctx.rGet(d) : r,
				xValue: xVal,
				yValue: yVal,
				data: d
			};
		};
		const points = derived(() => pointsData().flatMap((d) => {
			const xValue = xAccessor()(d);
			const yValue = yAccessor()(d);
			if (Array.isArray(xValue)) return xValue.filter(Boolean).map((xVal) => getPointObject(xVal, yValue, d));
			else if (Array.isArray(yValue)) return yValue.filter(Boolean).map((yVal) => getPointObject(xValue, yVal, d));
			else if (xValue != null && yValue != null) return getPointObject(xValue, yValue, d);
			return [];
		}));
		if (children) {
			$$renderer.push("<!--[0-->");
			children($$renderer, { points: points() });
			$$renderer.push(`<!---->`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--[-->`);
			const each_array = ensure_array_like(points());
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let point = each_array[$$index];
				Circle($$renderer, spread_props([{
					cx: point.x,
					cy: point.y,
					r: point.r,
					fill: fill ?? (ctx.config.c ? ctx.cGet(point.data) : null),
					fillOpacity,
					stroke,
					strokeWidth,
					opacity
				}, extractLayerProps(restProps, "lc-point")]));
			}
			$$renderer.push(`<!--]-->`);
		}
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/Labels.svelte
function Labels($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const ctx = getChartContext();
		let { data, value, x, y, placement = "outside", offset = placement === "center" ? 0 : 4, format: format$1, key = (_, i) => i, children: childrenProp, class: className, fill, $$slots, $$events, ...restProps } = $$props;
		function getTextProps(point) {
			const pointValue = isScaleBand(ctx.yScale) ? point.xValue : point.yValue;
			const fillValue = typeof fill === "function" ? accessor(fill)(point.data) : fill;
			const formattedValue = format(value ? accessor(value)(point.data) : isScaleBand(ctx.yScale) ? point.xValue : point.yValue, format$1 ?? (value ? void 0 : isScaleBand(ctx.yScale) ? ctx.xScale.tickFormat?.() : ctx.yScale.tickFormat?.()));
			if (isScaleBand(ctx.yScale)) if (pointValue < 0) return {
				value: formattedValue,
				fill: fillValue,
				x: point.x + (placement === "outside" ? -offset : offset),
				y: point.y,
				textAnchor: placement === "outside" ? "end" : "start",
				verticalAnchor: "middle",
				capHeight: ".6rem"
			};
			else return {
				value: formattedValue,
				fill: fillValue,
				x: point.x + (placement === "outside" ? offset : -offset),
				y: point.y,
				textAnchor: placement === "outside" ? "start" : "end",
				verticalAnchor: "middle",
				capHeight: ".6rem"
			};
			else if (pointValue < 0) return {
				value: formattedValue,
				fill: fillValue,
				x: point.x,
				y: point.y + (placement === "outside" ? offset : -offset),
				capHeight: ".6rem",
				textAnchor: "middle",
				verticalAnchor: placement === "center" ? "middle" : placement === "outside" ? "start" : "end"
			};
			else return {
				value: formattedValue,
				fill: fillValue,
				x: point.x,
				y: point.y + (placement === "outside" ? -offset : offset),
				capHeight: ".6rem",
				textAnchor: "middle",
				verticalAnchor: placement === "center" ? "middle" : placement === "outside" ? "end" : "start"
			};
		}
		Group($$renderer, {
			class: "lc-labels-g",
			children: ($$renderer) => {
				{
					function children($$renderer, { points }) {
						$$renderer.push(`<!--[-->`);
						const each_array = ensure_array_like(points);
						for (let i = 0, $$length = each_array.length; i < $$length; i++) {
							let point = each_array[i];
							const textProps = extractLayerProps(getTextProps(point), "lc-labels-text");
							if (childrenProp) {
								$$renderer.push("<!--[0-->");
								childrenProp($$renderer, {
									data: point,
									textProps
								});
								$$renderer.push(`<!---->`);
							} else {
								$$renderer.push("<!--[-1-->");
								Text($$renderer, spread_props([
									{ "data-placement": placement },
									textProps,
									restProps,
									extractLayerProps(getTextProps(point), "lc-labels-text", className ?? "")
								]));
							}
							$$renderer.push(`<!--]-->`);
						}
						$$renderer.push(`<!--]-->`);
					}
					Points($$renderer, {
						data,
						x,
						y,
						children,
						$$slots: { default: true }
					});
				}
			},
			$$slots: { default: true }
		});
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/charts/DefaultTooltip.svelte
function DefaultTooltip($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { tooltipProps, seriesState, canHaveTotal = false } = $$props;
		const context = getChartContext();
		{
			function children($$renderer, { data, payload }) {
				if (TooltipHeader) {
					$$renderer.push("<!--[-->");
					TooltipHeader($$renderer, spread_props([{
						value: payload[0].label,
						format
					}, tooltipProps?.header]));
					$$renderer.push("<!--]-->");
				} else {
					$$renderer.push("<!--[!-->");
					$$renderer.push("<!--]-->");
				}
				$$renderer.push(` `);
				if (TooltipList) {
					$$renderer.push("<!--[-->");
					TooltipList($$renderer, spread_props([tooltipProps?.list, {
						children: ($$renderer) => {
							$$renderer.push(`<!--[-->`);
							const each_array = ensure_array_like(payload);
							for (let i = 0, $$length = each_array.length; i < $$length; i++) {
								let p = each_array[i];
								if (TooltipItem) {
									$$renderer.push("<!--[-->");
									TooltipItem($$renderer, spread_props([{
										label: p.name,
										value: p.value,
										color: p.color,
										format,
										valueAlign: "right",
										onpointerenter: () => seriesState.highlightKey.current = p.key,
										onpointerleave: () => seriesState.highlightKey.current = null
									}, tooltipProps?.item]));
									$$renderer.push("<!--]-->");
								} else {
									$$renderer.push("<!--[!-->");
									$$renderer.push("<!--]-->");
								}
							}
							$$renderer.push(`<!--]--> `);
							if (canHaveTotal && payload.length > 1 && !tooltipProps?.hideTotal) {
								$$renderer.push("<!--[0-->");
								if (TooltipSeparator) {
									$$renderer.push("<!--[-->");
									TooltipSeparator($$renderer, spread_props([tooltipProps?.separator, { children: void 0 }]));
									$$renderer.push("<!--]-->");
								} else {
									$$renderer.push("<!--[!-->");
									$$renderer.push("<!--]-->");
								}
								$$renderer.push(` `);
								if (TooltipItem) {
									$$renderer.push("<!--[-->");
									TooltipItem($$renderer, spread_props([{
										label: "total",
										value: sum(seriesState.visibleSeries, (s) => {
											const seriesTooltipData = s.data ? findRelatedData(s.data, data, context.x) : data;
											const valueAccessor = accessor(s.value ?? (s.data ? context.y : s.key));
											return seriesTooltipData ? valueAccessor(seriesTooltipData) : 0;
										}),
										format: "integer",
										valueAlign: "right"
									}, tooltipProps?.item]));
									$$renderer.push("<!--]-->");
								} else {
									$$renderer.push("<!--[!-->");
									$$renderer.push("<!--]-->");
								}
							} else $$renderer.push("<!--[-1-->");
							$$renderer.push(`<!--]-->`);
						},
						$$slots: { default: true }
					}]));
					$$renderer.push("<!--]-->");
				} else {
					$$renderer.push("<!--[!-->");
					$$renderer.push("<!--]-->");
				}
			}
			if (Tooltip) {
				$$renderer.push("<!--[-->");
				Tooltip($$renderer, spread_props([
					{ context },
					tooltipProps?.root,
					{
						children,
						$$slots: { default: true }
					}
				]));
				$$renderer.push("<!--]-->");
			} else {
				$$renderer.push("<!--[!-->");
				$$renderer.push("<!--]-->");
			}
		}
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/AnnotationLine.svelte
function AnnotationLine($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const { x, y, label, labelPlacement = "top-right", labelXOffset = 0, labelYOffset = 0, props } = $$props;
		const ctx = getChartContext();
		const isVertical = derived(() => x != null);
		const line = derived(() => ({
			x1: x ? ctx.xScale(x) : ctx.xRange[0],
			y1: y && !x ? ctx.yScale(y) : ctx.yRange[0],
			x2: x ? ctx.xScale(x) : ctx.xRange[1],
			y2: y ? ctx.yScale(y) : ctx.yRange[1]
		}));
		const labelProps = derived(() => isVertical() ? {
			x: line().x1 + (labelPlacement.includes("left") ? -labelXOffset : labelXOffset),
			y: (labelPlacement.includes("top") ? line().y2 : labelPlacement.includes("bottom") ? line().y1 : (line().y1 - line().y2) / 2) + ([
				"top",
				"bottom-left",
				"bottom-right"
			].includes(labelPlacement) ? -labelYOffset : labelYOffset),
			dy: -2,
			textAnchor: labelPlacement.includes("left") ? "end" : labelPlacement.includes("right") ? "start" : "middle",
			verticalAnchor: labelPlacement === "top" ? "end" : labelPlacement === "bottom" ? "start" : labelPlacement.includes("top") ? "start" : labelPlacement.includes("bottom") ? "end" : "middle"
		} : {
			x: (labelPlacement.includes("left") ? line().x1 : labelPlacement.includes("right") ? line().x2 : (line().x2 - line().x1) / 2) + ([
				"left",
				"top-right",
				"bottom-right"
			].includes(labelPlacement) ? -labelXOffset : labelXOffset),
			y: line().y1 + (labelPlacement.includes("top") ? -labelYOffset : labelYOffset),
			dy: -2,
			textAnchor: labelPlacement === "left" ? "end" : labelPlacement === "right" ? "start" : labelPlacement.includes("left") ? "start" : labelPlacement.includes("right") ? "end" : "middle",
			verticalAnchor: labelPlacement.includes("top") ? "end" : labelPlacement.includes("bottom") ? "start" : "middle"
		});
		Line($$renderer, spread_props([
			{
				x1: line().x1,
				y1: line().y1,
				x2: line().x2,
				y2: line().y2
			},
			props?.line,
			{ class: cls("lc-annotation-line", props?.line?.class) }
		]));
		$$renderer.push(`<!----> `);
		if (label) {
			$$renderer.push("<!--[0-->");
			Text($$renderer, spread_props([
				{ value: label },
				labelProps(),
				props?.label,
				{ class: cls("lc-annotation-line-label", props?.label?.class) }
			]));
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/AnnotationPoint.svelte
function AnnotationPoint($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const { x, y, r = 4, label, labelPlacement = "center", labelXOffset = 0, labelYOffset = 0, details, props } = $$props;
		const ctx = getChartContext();
		const point = derived(() => ({
			x: x ? ctx.xScale(x) + (isScaleBand(ctx.xScale) ? ctx.xScale.bandwidth() / 2 : 0) : 0,
			y: y ? ctx.yScale(y) + (isScaleBand(ctx.yScale) ? ctx.yScale.bandwidth() / 2 : 0) : ctx.height
		}));
		const labelProps = derived(() => ({
			x: point().x + (([
				"top",
				"center",
				"bottom"
			].includes(labelPlacement) ? 0 : r) + labelXOffset) * (labelPlacement.includes("left") ? -1 : 1),
			y: point().y + (([
				"left",
				"center",
				"right"
			].includes(labelPlacement) ? 0 : r) + labelYOffset) * (labelPlacement.includes("top") ? -1 : 1),
			dy: -2,
			textAnchor: labelPlacement.includes("left") ? "end" : labelPlacement.includes("right") ? "start" : "middle",
			verticalAnchor: labelPlacement.includes("top") ? "end" : labelPlacement.includes("bottom") ? "start" : "middle"
		}));
		function onPointerMove(e) {
			if (details) {
				e.stopPropagation();
				ctx.tooltip.show(e, { annotation: {
					label,
					details
				} });
			}
		}
		function onPointerLeave(e) {
			if (details) {
				e.stopPropagation();
				ctx.tooltip.hide();
			}
		}
		Circle($$renderer, spread_props([
			{
				cx: point().x,
				cy: point().y,
				r,
				onpointermove: onPointerMove,
				onmousemove: onPointerMove,
				ontouchmove: onPointerMove,
				onpointerleave: onPointerLeave,
				onmouseleave: onPointerLeave,
				ontouchend: onPointerLeave
			},
			props?.circle,
			{ class: cls("lc-annotation-point", props?.circle?.class) }
		]));
		$$renderer.push(`<!----> `);
		if (label) {
			$$renderer.push("<!--[0-->");
			Text($$renderer, spread_props([
				{ value: label },
				labelProps(),
				props?.label,
				{ class: cls("lc-annotation-point-label", props?.label?.class) }
			]));
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/LinearGradient.svelte
function LinearGradient($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { id = createId("linearGradient-", uid), stops = ["var(--tw-gradient-from)", "var(--tw-gradient-to)"], vertical = false, x1 = "0%", y1 = "0%", x2 = vertical ? "0%" : "100%", y2 = vertical ? "100%" : "0%", rotate, units = "objectBoundingBox", ref: refProp = void 0, class: className, stopsContent, children, $$slots, $$events, ...restProps } = $$props;
		const ctx = getChartContext();
		const layerCtx = getLayerContext();
		let canvasGradient = void 0;
		function createCSSGradient() {
			if (!stops?.length) return "";
			let direction;
			if (rotate !== void 0) direction = `${(vertical ? 180 : 90) + rotate}deg`;
			else direction = vertical ? "to bottom" : "to right";
			const cssStops = stops.map((stop, i) => {
				if (Array.isArray(stop)) return `${stop[1]} ${stop[0]}`;
				else return `${stop} ${i * (100 / (stops.length - 1))}%`;
			}).join(", ");
			return `linear-gradient(${direction}, ${cssStops})`;
		}
		function render(_ctx) {
			const _stops = stops.map((stop, i) => {
				if (Array.isArray(stop)) {
					const { fill } = getComputedStyles(_ctx.canvas, {
						styles: { fill: stop[1] },
						classes: className
					});
					return {
						offset: parsePercent(stop[0]),
						color: fill
					};
				} else {
					const { fill } = getComputedStyles(_ctx.canvas, {
						styles: { fill: stop },
						classes: className
					});
					return {
						offset: i / (stops.length - 1),
						color: fill
					};
				}
			});
			canvasGradient = createLinearGradient(_ctx, ctx.padding.left, ctx.padding.top, vertical ? ctx.padding.left : ctx.width - ctx.padding.right, vertical ? ctx.height + ctx.padding.bottom : ctx.padding.top, _stops);
		}
		if (layerCtx === "canvas") registerCanvasComponent({
			name: "Gradient",
			render,
			deps: () => [
				x1,
				y1,
				x2,
				y2,
				stops,
				className
			]
		});
		if (layerCtx === "canvas") {
			$$renderer.push("<!--[0-->");
			children?.($$renderer, {
				id,
				gradient: asAny(canvasGradient)
			});
			$$renderer.push(`<!---->`);
		} else if (layerCtx === "svg") {
			$$renderer.push("<!--[1-->");
			$$renderer.push(`<defs><linearGradient${attributes({
				id,
				x1,
				y1,
				x2,
				y2,
				gradientTransform: rotate ? `rotate(${rotate})` : "",
				gradientUnits: units,
				...extractLayerProps(restProps, "lc-linear-gradient")
			}, void 0, void 0, void 0, 3)}>`);
			if (stopsContent) {
				$$renderer.push("<!--[0-->");
				stopsContent?.($$renderer);
				$$renderer.push(`<!---->`);
			} else if (stops) {
				$$renderer.push("<!--[1-->");
				$$renderer.push(`<!--[-->`);
				const each_array = ensure_array_like(stops);
				for (let i = 0, $$length = each_array.length; i < $$length; i++) {
					let stop = each_array[i];
					if (Array.isArray(stop)) {
						$$renderer.push("<!--[0-->");
						$$renderer.push(`<stop${attr("offset", stop[0])}${attr("stop-color", stop[1])}${attr_class(clsx(cls("lc-linear-gradient-stop", className)))}></stop>`);
					} else {
						$$renderer.push("<!--[-1-->");
						$$renderer.push(`<stop${attr("offset", `${stringify(i * (100 / (stops.length - 1)))}%`)}${attr("stop-color", stop)}${attr_class(clsx(cls("lc-linear-gradient-stop", className)))}></stop>`);
					}
					$$renderer.push(`<!--]-->`);
				}
				$$renderer.push(`<!--]-->`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></linearGradient></defs>`);
			children?.($$renderer, {
				id,
				gradient: `url(#${id})`
			});
			$$renderer.push(`<!---->`);
		} else if (layerCtx === "html") {
			$$renderer.push("<!--[2-->");
			children?.($$renderer, {
				id,
				gradient: createCSSGradient()
			});
			$$renderer.push(`<!---->`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
		bind_props($$props, { ref: refProp });
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/Pattern.svelte
function Pattern($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const uid = props_id($$renderer);
		let { id = createId("pattern-", uid), size = 4, width = size, height = size, lines: linesProp, circles: circlesProp, background, patternContent, children, $$slots, $$events, ...restProps } = $$props;
		const layerCtx = getLayerContext();
		let canvasPattern = null;
		let shapes = [];
		if (linesProp) {
			const lineDefs = Array.isArray(linesProp) ? linesProp : linesProp === true ? [{}] : [linesProp];
			for (const line of lineDefs) {
				const stroke = line.color ?? "var(--color-surface-content, currentColor)";
				const strokeWidth = line.width ?? 1;
				const opacity = line.opacity ?? 1;
				let rotate = Math.round(line.rotate ?? 0) % 360;
				if (rotate > 180) rotate = rotate - 360;
				else if (rotate > 90) rotate = rotate - 180;
				else if (rotate < -180) rotate = rotate + 360;
				else if (rotate < -90) rotate = rotate + 180;
				let path = "";
				if (rotate === 0) path = `
        M 0 0 L ${width} 0
        M 0 ${height} L ${width} ${height}
    `;
				else if (rotate === 90) path = `
        M 0 0 L 0 ${height}
        M ${width} 0 L ${width} ${height}
    `;
				else if (rotate > 0) path = `
          M 0 ${-height} L ${width * 2} ${height}
          M ${-width} ${-height} L ${width} ${height}
          M ${-width} 0 L ${width} ${height * 2}
      `;
				else path = `
          M ${-width} ${height} L ${width} ${-height}
          M ${-width} ${height * 2} L ${width * 2} ${-height}
          M 0 ${height * 2} L ${width * 2} 0
      `;
				shapes.push({
					type: "line",
					path,
					stroke,
					strokeWidth,
					opacity
				});
			}
		}
		if (circlesProp) {
			const circleDefs = Array.isArray(circlesProp) ? circlesProp : circlesProp === true ? [{}] : [circlesProp];
			for (const circle of circleDefs) if (circle.stagger) shapes.push({
				type: "circle",
				cx: size / 4,
				cy: size / 4,
				r: circle.radius ?? 1,
				fill: circle.color ?? "var(--color-surface-content, currentColor)",
				opacity: circle.opacity ?? 1
			}, {
				type: "circle",
				cx: size * 3 / 4,
				cy: size * 3 / 4,
				r: circle.radius ?? 1,
				fill: circle.color ?? "var(--color-surface-content, currentColor)",
				opacity: circle.opacity ?? 1
			});
			else shapes.push({
				type: "circle",
				cx: size / 2,
				cy: size / 2,
				r: circle.radius ?? 1,
				fill: circle.color ?? "var(--color-surface-content, currentColor)",
				opacity: circle.opacity ?? 1
			});
		}
		function render(_ctx) {
			canvasPattern = createPattern(_ctx, width, height, shapes, background);
		}
		if (layerCtx === "canvas") registerCanvasComponent({
			name: "Pattern",
			render,
			deps: () => [
				width,
				height,
				shapes,
				background
			]
		});
		if (layerCtx === "canvas") {
			$$renderer.push("<!--[0-->");
			children?.($$renderer, {
				id,
				pattern: asAny(canvasPattern)
			});
			$$renderer.push(`<!---->`);
		} else if (layerCtx === "svg") {
			$$renderer.push("<!--[1-->");
			$$renderer.push(`<defs><pattern${attributes({
				id,
				width,
				height,
				patternUnits: "userSpaceOnUse",
				...extractLayerProps(restProps, "lc-pattern")
			}, void 0, void 0, void 0, 3)}>`);
			if (patternContent) {
				$$renderer.push("<!--[0-->");
				patternContent?.($$renderer);
				$$renderer.push(`<!---->`);
			} else {
				$$renderer.push("<!--[-1-->");
				if (background) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<rect${attr("width", width)}${attr("height", height)}${attr("fill", background)}></rect>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--><!--[-->`);
				const each_array = ensure_array_like(shapes.filter((shape) => shape.type === "line"));
				for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
					let line = each_array[$$index];
					$$renderer.push(`<path${attr("d", line.path)}${attr("stroke", line.stroke)}${attr("stroke-width", line.strokeWidth)} fill="none"${attr("opacity", line.opacity)}></path>`);
				}
				$$renderer.push(`<!--]--><!--[-->`);
				const each_array_1 = ensure_array_like(shapes.filter((shape) => shape.type === "circle"));
				for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
					let circle = each_array_1[$$index_1];
					$$renderer.push(`<circle${attr("cx", circle.cx)}${attr("cy", circle.cy)}${attr("r", circle.r)}${attr("fill", circle.fill)}${attr("opacity", circle.opacity)}></circle>`);
				}
				$$renderer.push(`<!--]-->`);
			}
			$$renderer.push(`<!--]--></pattern></defs>`);
			children?.($$renderer, {
				id,
				pattern: `url(#${id})`
			});
			$$renderer.push(`<!---->`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/AnnotationRange.svelte
function AnnotationRange($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const { x, y, fill, class: className, gradient, pattern, label, labelPlacement = "center", labelXOffset = 0, labelYOffset = 0, props } = $$props;
		const ctx = getChartContext();
		const rect = derived(() => {
			const x0 = x ? ctx.xScale(x[0] ?? ctx.xDomain[0]) : ctx.xRange[0];
			const x1 = x ? ctx.xScale(x[1] ?? ctx.xDomain[1]) : ctx.xRange[1];
			const y0 = y ? ctx.yScale(y[0] ?? ctx.yDomain[0]) : ctx.yRange[0];
			const y1 = y ? ctx.yScale(y[1] ?? ctx.yDomain[1]) : ctx.yRange[1];
			const bandPadding = isScaleBand(ctx.xScale) ? ctx.xScale.padding() * ctx.xScale.step() / 2 : 0;
			const bandStep = isScaleBand(ctx.xScale) ? ctx.xScale.step() : 0;
			return {
				x: Math.min(x0, x1) - bandPadding,
				y: Math.min(y0, y1),
				width: Math.abs(x1 - x0) + bandStep,
				height: Math.abs(y1 - y0)
			};
		});
		const labelProps = derived(() => ({
			x: ((labelPlacement.includes("left") ? rect().x : labelPlacement.includes("right") ? (rect().x ?? 0) + rect().width : (rect().x ?? 0) + rect().width / 2) ?? 0) + (labelPlacement.includes("right") ? -labelXOffset : labelXOffset),
			y: ((labelPlacement.includes("top") ? rect().y : labelPlacement.includes("bottom") ? (rect().y ?? 0) + rect().height : (rect().y ?? 0) + rect().height / 2) ?? 0) + (labelPlacement.includes("bottom") ? -labelYOffset : labelYOffset),
			dy: -2,
			textAnchor: labelPlacement.includes("left") ? "start" : labelPlacement.includes("right") ? "end" : "middle",
			verticalAnchor: labelPlacement.includes("top") ? "start" : labelPlacement.includes("bottom") ? "end" : "middle"
		}));
		if (fill || className) {
			$$renderer.push("<!--[0-->");
			Rect($$renderer, spread_props([
				rect(),
				props?.rect,
				{
					fill,
					class: cls("lc-annotation-range", props?.rect?.class, className)
				}
			]));
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (gradient) {
			$$renderer.push("<!--[0-->");
			{
				function children($$renderer, { gradient }) {
					Rect($$renderer, spread_props([
						rect(),
						props?.rect,
						{ fill: gradient }
					]));
				}
				LinearGradient($$renderer, spread_props([gradient, {
					children,
					$$slots: { default: true }
				}]));
			}
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (pattern) {
			$$renderer.push("<!--[0-->");
			{
				function children($$renderer, { pattern }) {
					Rect($$renderer, spread_props([
						rect(),
						props?.rect,
						{ fill: pattern }
					]));
				}
				Pattern($$renderer, spread_props([pattern, {
					children,
					$$slots: { default: true }
				}]));
			}
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (label) {
			$$renderer.push("<!--[0-->");
			Text($$renderer, spread_props([
				{ value: label },
				labelProps(),
				props?.label,
				{ class: cls("lc-annotation-range-label", props?.label?.class) }
			]));
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/charts/ChartAnnotations.svelte
function ChartAnnotations($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { annotations, layer, highlightKey, visibleSeries } = $$props;
		let visibleAnnotations = derived(() => annotations.filter((a) => (a.layer === layer || a.layer == null && layer === "above") && (highlightKey == null || a.seriesKey == null || a.seriesKey === highlightKey) && visibleSeries.some((s) => a.seriesKey == null || a.seriesKey === s.key)));
		$$renderer.push(`<!--[-->`);
		const each_array = ensure_array_like(visibleAnnotations());
		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let annotation = each_array[$$index];
			if (annotation.type === "point") {
				$$renderer.push("<!--[0-->");
				AnnotationPoint($$renderer, spread_props([annotation]));
			} else if (annotation.type === "line") {
				$$renderer.push("<!--[1-->");
				AnnotationLine($$renderer, spread_props([annotation]));
			} else if (annotation.type === "range") {
				$$renderer.push("<!--[2-->");
				AnnotationRange($$renderer, spread_props([annotation]));
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]-->`);
		}
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/Bars.svelte
function Bars($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { fill, key = (_, i) => i, data: dataProp, onBarClick = () => {}, children, radius = 0, strokeWidth = 0, stroke = "black", $$slots, $$events, ...restProps } = $$props;
		const ctx = getChartContext();
		const data = derived(() => chartDataArray(dataProp ?? ctx.data));
		Group($$renderer, {
			class: "lc-bars",
			children: ($$renderer) => {
				if (children) {
					$$renderer.push("<!--[0-->");
					children($$renderer);
					$$renderer.push(`<!---->`);
				} else {
					$$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--[-->`);
					const each_array = ensure_array_like(data());
					for (let i = 0, $$length = each_array.length; i < $$length; i++) {
						let d = each_array[i];
						Bar($$renderer, spread_props([{
							data: d,
							radius,
							strokeWidth,
							stroke,
							fill: fill ?? (ctx.config.c ? ctx.cGet(d) : null),
							onclick: (e) => onBarClick(e, { data: d })
						}, extractLayerProps(restProps, "lc-bars-bar")]));
					}
					$$renderer.push(`<!--]-->`);
				}
				$$renderer.push(`<!--]-->`);
			},
			$$slots: { default: true }
		});
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/charts/BarChart.svelte
function BarChart($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const settings = getSettings();
		let { data = [], x: xProp, y: yProp, xDomain, radial = false, orientation = "vertical", series: seriesProp, seriesLayout = "overlap", axis = true, brush = false, grid = true, labels = false, legend = false, points = false, rule = true, onTooltipClick = () => {}, onBarClick = () => {}, props = {}, layer: layerProp, profile = false, debug: debugProp, xScale: xScaleProp, yScale: yScaleProp, bandPadding = radial ? 0 : .4, groupPadding = 0, stackPadding = 0, xInterval, yInterval, tooltip = true, children: childrenProp, aboveContext, belowContext, belowMarks, aboveMarks, marks, highlight = true, annotations = [], context = void 0, $$slots, $$events, ...restProps } = $$props;
		const layer = derived(() => layerProp ?? settings.layer);
		const debug = derived(() => debugProp ?? settings.debug);
		const series = derived(() => seriesProp === void 0 ? [{
			key: "default",
			label: orientation === "vertical" ? typeof yProp === "string" ? yProp : "value" : typeof xProp === "string" ? xProp : "value",
			value: orientation === "vertical" ? yProp : xProp
		}] : seriesProp);
		const seriesState = new SeriesState(() => series());
		const isVertical = derived(() => orientation === "vertical");
		const isStackSeries = derived(() => seriesLayout.startsWith("stack"));
		const isGroupSeries = derived(() => seriesLayout === "group");
		const chartData = derived(() => {
			let _chartData = seriesState.allSeriesData.length ? seriesState.allSeriesData : chartDataArray(data);
			if (isStackSeries()) {
				const seriesKeys = seriesState.visibleSeries.map((s) => s.key);
				const offset = seriesLayout === "stackExpand" ? stackOffsetExpand : seriesLayout === "stackDiverging" ? stackOffsetDiverging : stackOffsetNone;
				const stackData = stack().keys(seriesKeys).value((d, key) => {
					const s = series().find((d) => d.key === key);
					return accessor(s.value ?? s.key)(d);
				}).offset(offset)(chartDataArray(data));
				_chartData = _chartData.map((d, i) => {
					return {
						...d,
						stackData: stackData.map((sd) => sd[i])
					};
				});
			}
			return _chartData;
		});
		const xScale = derived(() => xScaleProp ?? (xInterval ? scaleTime() : isVertical() ? scaleBand().padding(bandPadding) : accessor(xProp)(chartData()[0]) instanceof Date ? scaleTime() : scaleLinear()));
		const xBaseline = derived(() => isVertical() || isScaleTime(xScale()) ? void 0 : 0);
		const yScale = derived(() => yScaleProp ?? (yInterval ? scaleTime() : isVertical() ? accessor(yProp)(chartData()[0]) instanceof Date ? scaleTime() : scaleLinear() : scaleBand().padding(bandPadding)));
		const yBaseline = derived(() => isVertical() || isScaleTime(yScale()) ? 0 : void 0);
		const x1Scale = derived(() => isGroupSeries() && isVertical() ? scaleBand().padding(groupPadding) : void 0);
		const x1Domain = derived(() => isGroupSeries() && isVertical() ? seriesState.visibleSeries.map((s) => s.key) : void 0);
		const x1Range = derived(() => isGroupSeries() && isVertical() ? ({ xScale }) => [0, xScale.bandwidth()] : void 0);
		const y1Scale = derived(() => isGroupSeries() && !isVertical() ? scaleBand().padding(groupPadding) : void 0);
		const y1Domain = derived(() => isGroupSeries() && !isVertical() ? seriesState.visibleSeries.map((s) => s.key) : void 0);
		const y1Range = derived(() => isGroupSeries() && !isVertical() ? ({ yScale }) => [0, yScale.bandwidth()] : void 0);
		function isStackData(d) {
			return d && typeof d === "object" && "stackData" in d;
		}
		function getBarsProps(s, i) {
			const isFirst = i == 0;
			const isLast = i == seriesState.visibleSeries.length - 1;
			const isStackLayout = seriesLayout.startsWith("stack");
			let stackInsets = void 0;
			if (isStackLayout) {
				const stackInset = stackPadding / 2;
				if (isVertical()) stackInsets = {
					bottom: isFirst ? void 0 : stackInset,
					top: isLast ? void 0 : stackInset
				};
				else stackInsets = {
					left: isFirst ? void 0 : stackInset,
					right: isLast ? void 0 : stackInset
				};
			}
			const valueAccessor = isStackSeries() ? (d) => d.stackData[i] : s.value ?? (s.data ? void 0 : s.key);
			return {
				data: s.data,
				x: !isVertical() ? valueAccessor : void 0,
				y: isVertical() ? valueAccessor : void 0,
				x1: isVertical() && isGroupSeries() ? (d) => s.value ?? s.key : void 0,
				y1: !isVertical() && isGroupSeries() ? (d) => s.value ?? s.key : void 0,
				rounded: isStackLayout && i !== seriesState.visibleSeries.length - 1 ? "none" : Array.isArray(xProp) || Array.isArray(yProp) ? "all" : "edge",
				radius: 4,
				strokeWidth: 1,
				insets: stackInsets,
				fill: s.color,
				opacity: seriesState.isHighlighted(s.key, true) ? 1 : .1,
				onBarClick: (e, detail) => onBarClick(e, {
					...detail,
					series: s
				}),
				...props.bars,
				...s.props,
				class: cls(props.bars?.class, s.props?.class)
			};
		}
		function getLabelsProps(s, i) {
			return {
				opacity: seriesState.isHighlighted(s.key, true) ? 1 : .1,
				...props.labels,
				...typeof labels === "object" ? labels : null,
				class: cls(props.labels?.class, typeof labels === "object" && labels.class)
			};
		}
		const brushProps = derived(() => ({
			...typeof brush === "object" ? brush : null,
			...props.brush
		}));
		function getLegendProps() {
			return createLegendProps({
				seriesState,
				props: {
					...props.legend,
					...typeof legend === "object" ? legend : null
				}
			});
		}
		function getGridProps() {
			return {
				x: !isVertical() || radial,
				y: isVertical() || radial,
				...typeof grid === "object" ? grid : null,
				...props.grid
			};
		}
		function getHighlightProps() {
			return {
				area: true,
				...props.highlight
			};
		}
		function getAxisProps(axisDirection) {
			if (axisDirection === "y") return {
				placement: radial ? "radius" : "left",
				format: isVertical() && seriesLayout === "stackExpand" ? "percentRound" : void 0,
				...typeof axis === "object" ? axis : null,
				...props.yAxis
			};
			return {
				placement: radial ? "angle" : "bottom",
				format: !isVertical() && seriesLayout === "stackExpand" ? "percentRound" : void 0,
				...typeof axis === "object" ? axis : null,
				...props.xAxis
			};
		}
		function getRuleProps() {
			return {
				x: isVertical() ? false : 0,
				y: isVertical() ? 0 : false,
				...typeof rule === "object" ? rule : null,
				...props.rule
			};
		}
		if (profile) console.time("BarChart render");
		setTooltipMetaContext({
			type: "bar",
			get orientation() {
				return orientation;
			},
			get stackSeries() {
				return isStackSeries();
			},
			get visibleSeries() {
				return seriesState.visibleSeries;
			}
		});
		function resolveAccessor(acc) {
			if (acc) return acc;
			if (isStackSeries()) return (d) => isStackData(d) ? seriesState.visibleSeries.flatMap((s, i) => d.stackData[i]) : void 0;
			return seriesState.visibleSeries.map((s) => s.value ?? s.key);
		}
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			{
				function children($$renderer, { context }) {
					const snippetProps = {
						context,
						series: series(),
						visibleSeries: seriesState.visibleSeries,
						getBarsProps,
						getLabelsProps,
						getLegendProps,
						getGridProps,
						getHighlightProps,
						getAxisProps,
						getRuleProps,
						highlightKey: seriesState.highlightKey.current,
						setHighlightKey: seriesState.highlightKey.set
					};
					if (childrenProp) {
						$$renderer.push("<!--[0-->");
						childrenProp($$renderer, snippetProps);
						$$renderer.push(`<!---->`);
					} else {
						$$renderer.push("<!--[-1-->");
						belowContext?.($$renderer, snippetProps);
						$$renderer.push(`<!----> `);
						Layer($$renderer, spread_props([
							{ type: layer() },
							asAny(layer() === "canvas" ? props.canvas : props.svg),
							{
								center: radial,
								debug: debug(),
								children: ($$renderer) => {
									if (typeof grid === "function") {
										$$renderer.push("<!--[0-->");
										grid($$renderer, snippetProps);
										$$renderer.push(`<!---->`);
									} else if (grid) {
										$$renderer.push("<!--[1-->");
										Grid($$renderer, spread_props([getGridProps()]));
									} else $$renderer.push("<!--[-1-->");
									$$renderer.push(`<!--]--> `);
									ChartClipPath($$renderer, {
										disabled: !brush,
										children: ($$renderer) => {
											ChartAnnotations($$renderer, {
												annotations,
												layer: "below",
												highlightKey: seriesState.highlightKey.current,
												visibleSeries: seriesState.visibleSeries
											});
											$$renderer.push(`<!----> `);
											belowMarks?.($$renderer, snippetProps);
											$$renderer.push(`<!----> `);
											if (typeof marks === "function") {
												$$renderer.push("<!--[0-->");
												marks($$renderer, snippetProps);
												$$renderer.push(`<!---->`);
											} else {
												$$renderer.push("<!--[-1-->");
												$$renderer.push(`<!--[-->`);
												const each_array = ensure_array_like(seriesState.visibleSeries);
												for (let i = 0, $$length = each_array.length; i < $$length; i++) {
													let s = each_array[i];
													Bars($$renderer, spread_props([getBarsProps(s, i)]));
												}
												$$renderer.push(`<!--]-->`);
											}
											$$renderer.push(`<!--]-->`);
										},
										$$slots: { default: true }
									});
									$$renderer.push(`<!----> `);
									aboveMarks?.($$renderer, snippetProps);
									$$renderer.push(`<!----> `);
									if (typeof axis === "function") {
										$$renderer.push("<!--[0-->");
										axis($$renderer, snippetProps);
										$$renderer.push(`<!----> `);
										if (typeof rule === "function") {
											$$renderer.push("<!--[0-->");
											rule($$renderer, snippetProps);
											$$renderer.push(`<!---->`);
										} else if (rule) {
											$$renderer.push("<!--[1-->");
											Rule($$renderer, spread_props([getRuleProps()]));
										} else $$renderer.push("<!--[-1-->");
										$$renderer.push(`<!--]-->`);
									} else if (axis) {
										$$renderer.push("<!--[1-->");
										if (axis !== "x") {
											$$renderer.push("<!--[0-->");
											Axis($$renderer, spread_props([getAxisProps("y")]));
										} else $$renderer.push("<!--[-1-->");
										$$renderer.push(`<!--]--> `);
										if (axis !== "y") {
											$$renderer.push("<!--[0-->");
											Axis($$renderer, spread_props([getAxisProps("x")]));
										} else $$renderer.push("<!--[-1-->");
										$$renderer.push(`<!--]--> `);
										if (typeof rule === "function") {
											$$renderer.push("<!--[0-->");
											rule($$renderer, snippetProps);
											$$renderer.push(`<!---->`);
										} else if (rule) {
											$$renderer.push("<!--[1-->");
											Rule($$renderer, spread_props([getRuleProps()]));
										} else $$renderer.push("<!--[-1-->");
										$$renderer.push(`<!--]-->`);
									} else $$renderer.push("<!--[-1-->");
									$$renderer.push(`<!--]--> `);
									ChartClipPath($$renderer, {
										disabled: !brush,
										full: true,
										children: ($$renderer) => {
											if (typeof highlight === "function") {
												$$renderer.push("<!--[0-->");
												highlight($$renderer, snippetProps);
												$$renderer.push(`<!---->`);
											} else if (highlight) {
												$$renderer.push("<!--[1-->");
												Highlight($$renderer, spread_props([getHighlightProps()]));
											} else $$renderer.push("<!--[-1-->");
											$$renderer.push(`<!--]--> `);
											if (typeof labels === "function") {
												$$renderer.push("<!--[0-->");
												labels($$renderer, snippetProps);
												$$renderer.push(`<!---->`);
											} else if (labels) {
												$$renderer.push("<!--[1-->");
												$$renderer.push(`<!--[-->`);
												const each_array_1 = ensure_array_like(seriesState.visibleSeries);
												for (let i = 0, $$length = each_array_1.length; i < $$length; i++) {
													let s = each_array_1[i];
													Labels($$renderer, spread_props([getLabelsProps(s, i)]));
												}
												$$renderer.push(`<!--]-->`);
											} else $$renderer.push("<!--[-1-->");
											$$renderer.push(`<!--]--> `);
											ChartAnnotations($$renderer, {
												annotations,
												layer: "above",
												highlightKey: seriesState.highlightKey.current,
												visibleSeries: seriesState.visibleSeries
											});
											$$renderer.push(`<!---->`);
										},
										$$slots: { default: true }
									});
									$$renderer.push(`<!---->`);
								},
								$$slots: { default: true }
							}
						]));
						$$renderer.push(`<!----> `);
						aboveContext?.($$renderer, snippetProps);
						$$renderer.push(`<!----> `);
						if (typeof legend === "function") {
							$$renderer.push("<!--[0-->");
							legend($$renderer, snippetProps);
							$$renderer.push(`<!---->`);
						} else if (legend) {
							$$renderer.push("<!--[1-->");
							Legend($$renderer, spread_props([getLegendProps()]));
						} else $$renderer.push("<!--[-1-->");
						$$renderer.push(`<!--]--> `);
						if (typeof tooltip === "function") {
							$$renderer.push("<!--[0-->");
							tooltip($$renderer, snippetProps);
							$$renderer.push(`<!---->`);
						} else if (tooltip) {
							$$renderer.push("<!--[1-->");
							DefaultTooltip($$renderer, {
								tooltipProps: props.tooltip,
								canHaveTotal: isStackSeries() || isGroupSeries(),
								seriesState
							});
						} else $$renderer.push("<!--[-1-->");
						$$renderer.push(`<!--]-->`);
					}
					$$renderer.push(`<!--]-->`);
				}
				Chart($$renderer, spread_props([
					{
						data: chartData(),
						x: resolveAccessor(xProp),
						xDomain,
						xScale: xScale(),
						xBaseline: xBaseline(),
						xNice: orientation === "horizontal",
						x1Scale: x1Scale(),
						x1Domain: x1Domain(),
						x1Range: x1Range(),
						xInterval,
						y: resolveAccessor(yProp),
						yScale: yScale(),
						yBaseline: yBaseline(),
						yNice: orientation === "vertical",
						y1Scale: y1Scale(),
						y1Domain: y1Domain(),
						y1Range: y1Range(),
						yInterval,
						c: isVertical() ? yProp : xProp,
						cRange: ["var(--color-primary, currentColor)"],
						radial,
						padding: radial ? void 0 : defaultChartPadding({
							axis,
							legend
						})
					},
					restProps,
					{
						tooltip: tooltip === false ? false : {
							mode: "band",
							onclick: onTooltipClick,
							debug: debug(),
							...props.tooltip?.context,
							...typeof tooltip === "object" ? tooltip : null
						},
						brush: brush && (brush === true || brush.mode == void 0 || brush.mode === "integrated") ? {
							axis: "x",
							resetOnEnd: true,
							xDomain,
							...brushProps(),
							onBrushEnd: (e) => {
								xDomain = e.xDomain;
								brushProps().onBrushEnd?.(e);
							}
						} : false,
						get context() {
							return context;
						},
						set context($$value) {
							context = $$value;
							$$settled = false;
						},
						children,
						$$slots: { default: true }
					}
				]));
			}
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { context });
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/Pie.svelte
function Pie($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { data, range = [0, 360], startAngle: startAngleProp, endAngle: endAngleProp, innerRadius, outerRadius, cornerRadius = 0, padAngle = 0, motion, offset = 0, tooltipContext, sort, children } = $$props;
		const ctx = getChartContext();
		const endAngle = derived(() => endAngleProp ?? degreesToRadians(ctx.config.xRange ? max(ctx.xRange) : max(range)));
		const motionEndAngle = createMotion(0, () => endAngle(), motion);
		const pie$1 = derived(() => {
			let _pie = pie().startAngle(startAngleProp ?? degreesToRadians(ctx.config.xRange ? min(ctx.xRange) : min(range))).endAngle(motionEndAngle.current).padAngle(padAngle).value(ctx.x);
			if (sort === null) _pie = _pie.sort(null);
			else if (sort) _pie = _pie.sort(sort);
			return _pie;
		});
		const arcs = derived(() => pie$1()(data ?? (Array.isArray(ctx.data) ? ctx.data : [])));
		if (children) {
			$$renderer.push("<!--[0-->");
			children($$renderer, { arcs: arcs() });
			$$renderer.push(`<!---->`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--[-->`);
			const each_array = ensure_array_like(arcs());
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let arc = each_array[$$index];
				Arc($$renderer, {
					class: "lc-pie-arc",
					startAngle: arc.startAngle,
					endAngle: arc.endAngle,
					padAngle: arc.padAngle,
					innerRadius,
					outerRadius,
					cornerRadius,
					offset,
					fill: ctx.config.c ? ctx.cScale?.(ctx.c(arc.data)) : null,
					data: arc.data,
					tooltipContext
				});
			}
			$$renderer.push(`<!--]-->`);
		}
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/charts/PieChart.svelte
function PieChart($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const settings = getSettings();
		let { data = [], key = "key", label = "label", value = "value", range = [0, 360], c = key, innerRadius, outerRadius, cornerRadius = 0, padAngle = 0, placement = "center", maxValue, center = placement === "center", series: seriesProp, legend = false, onArcClick = () => {}, onTooltipClick = () => {}, props = {}, layer: layerProp, profile = false, debug: debugProp, tooltip = true, children: childrenProp, aboveContext, belowContext, belowMarks, aboveMarks, marks, pie, arc, context = void 0, $$slots, $$events, ...restProps } = $$props;
		const layer = derived(() => layerProp ?? settings.layer);
		const debug = derived(() => debugProp ?? settings.debug);
		const series = derived(() => seriesProp === void 0 ? [{
			key: "default",
			value
		}] : seriesProp);
		const seriesState = new SeriesState(() => series());
		const keyAccessor = derived(() => accessor(key));
		const labelAccessor = derived(() => accessor(label));
		const valueAccessor = derived(() => accessor(value));
		const cAccessor = derived(() => accessor(c));
		const chartData = derived(() => seriesState.allSeriesData.length ? seriesState.allSeriesData : chartDataArray(data));
		const visibleData = derived(() => chartData().filter((d) => {
			const dataKey = keyAccessor()(d);
			return seriesState.selectedKeys.isEmpty() || seriesState.selectedKeys.isSelected(dataKey);
		}));
		function getLegendProps() {
			return createLegendProps({
				seriesState,
				props: {
					tickFormat: (tick) => {
						const item = chartData().find((d) => keyAccessor()(d) === tick);
						return item ? labelAccessor()(item) ?? tick : tick;
					},
					...props.legend,
					...getObjectOrNull(legend)
				}
			});
		}
		function getGroupProps() {
			if (!context) return {};
			return {
				x: placement === "left" ? context.height / 2 : placement === "right" ? context.width - context.height / 2 : void 0,
				center: ["left", "right"].includes(placement) ? "y" : void 0,
				...props.group
			};
		}
		function getPieProps(s, i) {
			return {
				data: s.data,
				range,
				innerRadius,
				outerRadius,
				cornerRadius,
				padAngle,
				...props.pie
			};
		}
		function getArcProps(s, seriesIndex, arc, arcIndex) {
			if (!context) return {};
			const arcDataProps = "props" in arc.data && typeof arc.data.props === "object" ? arc.data.props : {};
			return {
				startAngle: arc.startAngle,
				endAngle: arc.endAngle,
				outerRadius: seriesState.visibleSeries.length > 1 ? seriesIndex * (outerRadius ?? 0) : outerRadius,
				innerRadius,
				cornerRadius,
				padAngle,
				fill: context.cScale?.(context.c(arc.data)),
				data: arc.data,
				tooltipContext: context.tooltip,
				onclick: (e) => {
					onArcClick(e, {
						data: arc.data,
						series: s
					});
					onTooltipClick(e, { data: arc.data });
				},
				opacity: seriesState.isHighlighted(keyAccessor()(arc.data), true) ? 1 : .5,
				...props.arc,
				...s.props,
				...arcDataProps
			};
		}
		if (profile) console.time("PieChart render");
		setTooltipMetaContext({
			type: "pie",
			get color() {
				return c;
			},
			get value() {
				return value;
			},
			get label() {
				return label;
			},
			get key() {
				return key;
			},
			get visibleSeries() {
				return seriesState.visibleSeries;
			}
		});
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			{
				function children($$renderer, { context }) {
					const snippetProps = {
						label: labelAccessor(),
						key: keyAccessor(),
						value: valueAccessor(),
						color: cAccessor(),
						context,
						series: series(),
						visibleSeries: seriesState.visibleSeries,
						visibleData: visibleData(),
						highlightKey: seriesState.highlightKey.current,
						setHighlightKey: seriesState.highlightKey.set,
						getLegendProps,
						getGroupProps
					};
					if (childrenProp) {
						$$renderer.push("<!--[0-->");
						childrenProp($$renderer, snippetProps);
						$$renderer.push(`<!---->`);
					} else {
						$$renderer.push("<!--[-1-->");
						belowContext?.($$renderer, snippetProps);
						$$renderer.push(`<!----> `);
						Layer($$renderer, spread_props([
							{ type: layer() },
							asAny(layer() === "canvas" ? props.canvas : props.svg),
							{
								center,
								debug: debug(),
								children: ($$renderer) => {
									belowMarks?.($$renderer, snippetProps);
									$$renderer.push(`<!----> `);
									if (typeof marks === "function") {
										$$renderer.push("<!--[0-->");
										marks($$renderer, snippetProps);
										$$renderer.push(`<!---->`);
									} else {
										$$renderer.push("<!--[-1-->");
										Group($$renderer, spread_props([getGroupProps(), {
											children: ($$renderer) => {
												$$renderer.push(`<!--[-->`);
												const each_array = ensure_array_like(series());
												for (let seriesIdx = 0, $$length = each_array.length; seriesIdx < $$length; seriesIdx++) {
													let s = each_array[seriesIdx];
													if (typeof pie === "function") {
														$$renderer.push("<!--[0-->");
														pie($$renderer, {
															...snippetProps,
															props: getPieProps(s, seriesIdx),
															index: seriesIdx
														});
														$$renderer.push(`<!---->`);
													} else {
														$$renderer.push("<!--[-1-->");
														{
															function children($$renderer, { arcs }) {
																$$renderer.push(`<!--[-->`);
																const each_array_1 = ensure_array_like(arcs);
																for (let arcIdx = 0, $$length = each_array_1.length; arcIdx < $$length; arcIdx++) {
																	let arcData = each_array_1[arcIdx];
																	const arcProps = getArcProps(s, seriesIdx, arcData, arcIdx);
																	if (typeof arc === "function") {
																		$$renderer.push("<!--[0-->");
																		arc($$renderer, {
																			...snippetProps,
																			props: arcProps,
																			index: arcIdx,
																			seriesIndex: seriesIdx
																		});
																		$$renderer.push(`<!---->`);
																	} else {
																		$$renderer.push("<!--[-1-->");
																		Arc($$renderer, spread_props([arcProps]));
																	}
																	$$renderer.push(`<!--]-->`);
																}
																$$renderer.push(`<!--]-->`);
															}
															Pie($$renderer, spread_props([getPieProps(s, seriesIdx), {
																children,
																$$slots: { default: true }
															}]));
														}
													}
													$$renderer.push(`<!--]-->`);
												}
												$$renderer.push(`<!--]-->`);
											},
											$$slots: { default: true }
										}]));
									}
									$$renderer.push(`<!--]--> `);
									aboveMarks?.($$renderer, snippetProps);
									$$renderer.push(`<!---->`);
								},
								$$slots: { default: true }
							}
						]));
						$$renderer.push(`<!----> `);
						aboveContext?.($$renderer, snippetProps);
						$$renderer.push(`<!----> `);
						if (typeof legend === "function") {
							$$renderer.push("<!--[0-->");
							legend($$renderer, snippetProps);
							$$renderer.push(`<!---->`);
						} else if (legend) {
							$$renderer.push("<!--[1-->");
							Legend($$renderer, spread_props([getLegendProps()]));
						} else $$renderer.push("<!--[-1-->");
						$$renderer.push(`<!--]--> `);
						if (typeof tooltip === "function") {
							$$renderer.push("<!--[0-->");
							tooltip($$renderer, snippetProps);
							$$renderer.push(`<!---->`);
						} else if (tooltip) {
							$$renderer.push("<!--[1-->");
							{
								function children($$renderer, { data }) {
									if (TooltipList) {
										$$renderer.push("<!--[-->");
										TooltipList($$renderer, spread_props([props.tooltip?.list, {
											children: ($$renderer) => {
												if (TooltipItem) {
													$$renderer.push("<!--[-->");
													TooltipItem($$renderer, spread_props([{
														label: labelAccessor()(data) || keyAccessor()(data),
														value: valueAccessor()(data),
														color: context.cScale?.(context.c(data)),
														format,
														onpointerenter: () => seriesState.highlightKey.current = keyAccessor()(data),
														onpointerleave: () => seriesState.highlightKey.current = null
													}, props.tooltip?.item]));
													$$renderer.push("<!--]-->");
												} else {
													$$renderer.push("<!--[!-->");
													$$renderer.push("<!--]-->");
												}
											},
											$$slots: { default: true }
										}]));
										$$renderer.push("<!--]-->");
									} else {
										$$renderer.push("<!--[!-->");
										$$renderer.push("<!--]-->");
									}
								}
								if (Tooltip) {
									$$renderer.push("<!--[-->");
									Tooltip($$renderer, spread_props([
										{ context },
										props.tooltip?.root,
										{
											children,
											$$slots: { default: true }
										}
									]));
									$$renderer.push("<!--]-->");
								} else {
									$$renderer.push("<!--[!-->");
									$$renderer.push("<!--]-->");
								}
							}
						} else $$renderer.push("<!--[-1-->");
						$$renderer.push(`<!--]-->`);
					}
					$$renderer.push(`<!--]-->`);
				}
				Chart($$renderer, spread_props([
					{
						data: visibleData(),
						x: value,
						c: key,
						cDomain: chartData().map(keyAccessor()),
						cRange: seriesState.allSeriesColors.length ? seriesState.allSeriesColors : c !== key ? chartData().map((d) => cAccessor()(d)) : [
							`var(--color-primary, ${schemeObservable10[0]})`,
							`var(--color-secondary, ${schemeObservable10[1]})`,
							`var(--color-info, ${schemeObservable10[2]})`,
							`var(--color-success, ${schemeObservable10[3]})`,
							`var(--color-warning, ${schemeObservable10[4]})`,
							`var(--color-danger, ${schemeObservable10[5]})`
						],
						padding: { bottom: legend === true || getObjectOrNull(legend)?.placement?.includes("bottom") ? 32 : 0 }
					},
					restProps,
					{
						tooltip: tooltip === false ? false : {
							...props.tooltip?.context,
							...typeof tooltip === "object" ? tooltip : null
						},
						get context() {
							return context;
						},
						set context($$value) {
							context = $$value;
							$$settled = false;
						},
						children,
						$$slots: { default: true }
					}
				]));
			}
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { context });
	});
}
//#endregion
//#region node_modules/layerchart/dist/components/charts/ScatterChart.svelte
function ScatterChart($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const settings = getSettings();
		let { data = [], x: xProp, y: yProp, xDomain, yDomain, series: seriesProp, seriesLayout = "overlap", axis = true, brush = false, grid = true, labels = false, legend = false, points = false, rule = true, tooltip = true, context = void 0, onTooltipClick = () => {}, props = {}, layer: layerProp, profile = false, debug: debugProp, children: childrenProp, aboveContext, belowContext, belowMarks, aboveMarks, marks, highlight = true, annotations = [], $$slots, $$events, ...restProps } = $$props;
		const layer = derived(() => layerProp ?? settings.layer);
		const debug = derived(() => debugProp ?? settings.debug);
		const series = derived(() => seriesProp === void 0 ? [{
			key: "default",
			data: chartDataArray(data)
		}] : seriesProp);
		const seriesState = new SeriesState(() => series());
		const chartData = derived(() => seriesState.visibleSeries.flatMap((s) => s.data?.map((d) => ({
			seriesKey: s.key,
			...d
		}))).filter((d) => d));
		function getPointsProps(s, i) {
			return {
				data: s.data,
				fill: s.color,
				opacity: seriesState.isHighlighted(s.key, true) ? 1 : .1,
				...props.points,
				...s.props,
				class: cls(props.points?.class, s.props?.class)
			};
		}
		function getLabelsProps(s, i) {
			return {
				data: s.data,
				opacity: seriesState.isHighlighted(s.key, true) ? 1 : .1,
				...props.labels,
				...typeof labels === "object" ? labels : null,
				class: cls(props.labels?.class, typeof labels === "object" && labels.class)
			};
		}
		function getLegendProps() {
			return createLegendProps({
				seriesState,
				props: {
					...props.legend,
					...typeof legend === "object" ? legend : null
				}
			});
		}
		function getGridProps() {
			return {
				x: true,
				y: true,
				...typeof grid === "object" ? grid : null,
				...props.grid
			};
		}
		const activeSeries = derived(() => {
			if (!context?.tooltip?.data) return null;
			return series().find((s) => s.key === context?.tooltip.data?.seriesKey) ?? series()[0];
		});
		function getHighlightProps() {
			return {
				lines: true,
				axis: "both",
				...props.highlight,
				points: {
					...activeSeries()?.color && { fill: activeSeries().color },
					...typeof props.highlight?.points === "object" ? props.highlight.points : null
				}
			};
		}
		function getAxisProps(axisDirection) {
			if (axisDirection === "y") return {
				placement: "left",
				...typeof axis === "object" ? axis : null,
				...props.yAxis
			};
			return {
				placement: "bottom",
				...typeof axis === "object" ? axis : null,
				...props.xAxis
			};
		}
		function getRuleProps() {
			return {
				x: 0,
				y: 0,
				...typeof rule === "object" ? rule : null,
				...props.rule
			};
		}
		const brushProps = derived(() => ({
			...typeof brush === "object" ? brush : null,
			...props.brush
		}));
		if (profile) console.time("ScatterChart render");
		let $$settled = true;
		let $$inner_renderer;
		function $$render_inner($$renderer) {
			{
				function children($$renderer, { context }) {
					const snippetProps = {
						context,
						series: series(),
						visibleSeries: seriesState.visibleSeries,
						getLabelsProps,
						getPointsProps,
						getLegendProps,
						getHighlightProps,
						getAxisProps,
						getRuleProps,
						highlightKey: seriesState.highlightKey.current,
						setHighlightKey: seriesState.highlightKey.set
					};
					if (childrenProp) {
						$$renderer.push("<!--[0-->");
						childrenProp($$renderer, snippetProps);
						$$renderer.push(`<!---->`);
					} else {
						$$renderer.push("<!--[-1-->");
						belowContext?.($$renderer, snippetProps);
						$$renderer.push(`<!----> `);
						Layer($$renderer, spread_props([
							{ type: layer() },
							asAny(layer() === "canvas" ? props.canvas : props.svg),
							{
								debug: debug(),
								children: ($$renderer) => {
									if (typeof grid === "function") {
										$$renderer.push("<!--[0-->");
										grid($$renderer, snippetProps);
										$$renderer.push(`<!---->`);
									} else if (grid) {
										$$renderer.push("<!--[1-->");
										Grid($$renderer, spread_props([getGridProps()]));
									} else $$renderer.push("<!--[-1-->");
									$$renderer.push(`<!--]--> `);
									ChartClipPath($$renderer, {
										disabled: !brush,
										children: ($$renderer) => {
											ChartAnnotations($$renderer, {
												annotations,
												layer: "below",
												highlightKey: seriesState.highlightKey.current,
												visibleSeries: seriesState.visibleSeries
											});
											$$renderer.push(`<!----> `);
											belowMarks?.($$renderer, snippetProps);
											$$renderer.push(`<!----> `);
											if (typeof marks === "function") {
												$$renderer.push("<!--[0-->");
												marks($$renderer, snippetProps);
												$$renderer.push(`<!---->`);
											} else {
												$$renderer.push("<!--[-1-->");
												$$renderer.push(`<!--[-->`);
												const each_array = ensure_array_like(seriesState.visibleSeries);
												for (let i = 0, $$length = each_array.length; i < $$length; i++) {
													let s = each_array[i];
													Points($$renderer, spread_props([getPointsProps(s, i)]));
												}
												$$renderer.push(`<!--]-->`);
											}
											$$renderer.push(`<!--]--> `);
											aboveMarks?.($$renderer, snippetProps);
											$$renderer.push(`<!---->`);
										},
										$$slots: { default: true }
									});
									$$renderer.push(`<!----> `);
									if (typeof axis === "function") {
										$$renderer.push("<!--[0-->");
										axis($$renderer, snippetProps);
										$$renderer.push(`<!----> `);
										if (typeof rule === "function") {
											$$renderer.push("<!--[0-->");
											rule($$renderer, snippetProps);
											$$renderer.push(`<!---->`);
										} else if (rule) {
											$$renderer.push("<!--[1-->");
											Rule($$renderer, spread_props([getRuleProps()]));
										} else $$renderer.push("<!--[-1-->");
										$$renderer.push(`<!--]-->`);
									} else if (axis) {
										$$renderer.push("<!--[1-->");
										if (axis !== "x") {
											$$renderer.push("<!--[0-->");
											Axis($$renderer, spread_props([getAxisProps("y")]));
										} else $$renderer.push("<!--[-1-->");
										$$renderer.push(`<!--]--> `);
										if (axis !== "y") {
											$$renderer.push("<!--[0-->");
											Axis($$renderer, spread_props([getAxisProps("x")]));
										} else $$renderer.push("<!--[-1-->");
										$$renderer.push(`<!--]--> `);
										if (typeof rule === "function") {
											$$renderer.push("<!--[0-->");
											rule($$renderer, snippetProps);
											$$renderer.push(`<!---->`);
										} else if (rule) {
											$$renderer.push("<!--[1-->");
											Rule($$renderer, spread_props([getRuleProps()]));
										} else $$renderer.push("<!--[-1-->");
										$$renderer.push(`<!--]-->`);
									} else $$renderer.push("<!--[-1-->");
									$$renderer.push(`<!--]--> `);
									ChartClipPath($$renderer, {
										disabled: !brush,
										full: true,
										children: ($$renderer) => {
											if (typeof highlight === "function") {
												$$renderer.push("<!--[0-->");
												highlight($$renderer, snippetProps);
												$$renderer.push(`<!---->`);
											} else if (highlight) {
												$$renderer.push("<!--[1-->");
												Highlight($$renderer, spread_props([getHighlightProps()]));
											} else $$renderer.push("<!--[-1-->");
											$$renderer.push(`<!--]--> `);
											if (typeof labels === "function") {
												$$renderer.push("<!--[0-->");
												labels($$renderer, snippetProps);
												$$renderer.push(`<!---->`);
											} else if (labels) {
												$$renderer.push("<!--[1-->");
												$$renderer.push(`<!--[-->`);
												const each_array_1 = ensure_array_like(seriesState.visibleSeries);
												for (let i = 0, $$length = each_array_1.length; i < $$length; i++) {
													let s = each_array_1[i];
													Labels($$renderer, spread_props([getLabelsProps(s, i)]));
												}
												$$renderer.push(`<!--]-->`);
											} else $$renderer.push("<!--[-1-->");
											$$renderer.push(`<!--]--> `);
											ChartAnnotations($$renderer, {
												annotations,
												layer: "above",
												highlightKey: seriesState.highlightKey.current,
												visibleSeries: seriesState.visibleSeries
											});
											$$renderer.push(`<!---->`);
										},
										$$slots: { default: true }
									});
									$$renderer.push(`<!---->`);
								},
								$$slots: { default: true }
							}
						]));
						$$renderer.push(`<!----> `);
						aboveContext?.($$renderer, snippetProps);
						$$renderer.push(`<!----> `);
						if (typeof legend === "function") {
							$$renderer.push("<!--[0-->");
							legend($$renderer, snippetProps);
							$$renderer.push(`<!---->`);
						} else if (legend) {
							$$renderer.push("<!--[1-->");
							Legend($$renderer, spread_props([getLegendProps()]));
						} else $$renderer.push("<!--[-1-->");
						$$renderer.push(`<!--]--> `);
						if (typeof tooltip === "function") {
							$$renderer.push("<!--[0-->");
							tooltip($$renderer, snippetProps);
							$$renderer.push(`<!---->`);
						} else if (tooltip) {
							$$renderer.push("<!--[1-->");
							{
								function children($$renderer, { data }) {
									if (activeSeries()?.key !== "default") {
										$$renderer.push("<!--[0-->");
										if (TooltipHeader) {
											$$renderer.push("<!--[-->");
											TooltipHeader($$renderer, spread_props([{
												value: activeSeries()?.label ?? activeSeries()?.key,
												color: activeSeries()?.color
											}, props.tooltip?.header]));
											$$renderer.push("<!--]-->");
										} else {
											$$renderer.push("<!--[!-->");
											$$renderer.push("<!--]-->");
										}
									} else $$renderer.push("<!--[-1-->");
									$$renderer.push(`<!--]--> `);
									if (TooltipList) {
										$$renderer.push("<!--[-->");
										TooltipList($$renderer, spread_props([props.tooltip?.list, {
											children: ($$renderer) => {
												if (TooltipItem) {
													$$renderer.push("<!--[-->");
													TooltipItem($$renderer, spread_props([{
														label: typeof context.config.x === "string" ? context.config.x : "x",
														value: context.x(data),
														format,
														onpointerenter: () => seriesState.highlightKey.current = activeSeries()?.key ?? null,
														onpointerleave: () => seriesState.highlightKey.current = null
													}, props.tooltip?.item]));
													$$renderer.push("<!--]-->");
												} else {
													$$renderer.push("<!--[!-->");
													$$renderer.push("<!--]-->");
												}
												$$renderer.push(` `);
												if (TooltipItem) {
													$$renderer.push("<!--[-->");
													TooltipItem($$renderer, spread_props([{
														label: typeof context.config.y === "string" ? context.config.y : "y",
														value: context.y(data),
														format,
														onpointerenter: () => seriesState.highlightKey.current = activeSeries()?.key ?? null,
														onpointerleave: () => seriesState.highlightKey.current = null
													}, props.tooltip?.item]));
													$$renderer.push("<!--]-->");
												} else {
													$$renderer.push("<!--[!-->");
													$$renderer.push("<!--]-->");
												}
												$$renderer.push(` `);
												if (context.config.r) {
													$$renderer.push("<!--[0-->");
													if (TooltipItem) {
														$$renderer.push("<!--[-->");
														TooltipItem($$renderer, spread_props([{
															label: typeof context.config.r === "string" ? context.config.r : "r",
															value: context.r(data),
															format,
															onpointerenter: () => seriesState.highlightKey.current = activeSeries()?.key ?? null,
															onpointerleave: () => seriesState.highlightKey.current = null
														}, props.tooltip?.item]));
														$$renderer.push("<!--]-->");
													} else {
														$$renderer.push("<!--[!-->");
														$$renderer.push("<!--]-->");
													}
												} else $$renderer.push("<!--[-1-->");
												$$renderer.push(`<!--]-->`);
											},
											$$slots: { default: true }
										}]));
										$$renderer.push("<!--]-->");
									} else {
										$$renderer.push("<!--[!-->");
										$$renderer.push("<!--]-->");
									}
								}
								if (Tooltip) {
									$$renderer.push("<!--[-->");
									Tooltip($$renderer, spread_props([
										{ context },
										props.tooltip?.root,
										{
											children,
											$$slots: { default: true }
										}
									]));
									$$renderer.push("<!--]-->");
								} else {
									$$renderer.push("<!--[!-->");
									$$renderer.push("<!--]-->");
								}
							}
						} else $$renderer.push("<!--[-1-->");
						$$renderer.push(`<!--]-->`);
					}
					$$renderer.push(`<!--]-->`);
				}
				Chart($$renderer, spread_props([
					{
						data: chartData(),
						x: xProp,
						xDomain,
						y: yProp,
						yDomain,
						yNice: true,
						c: yProp,
						cRange: ["var(--color-primary, currentColor)"],
						padding: defaultChartPadding({
							axis,
							legend
						})
					},
					restProps,
					{
						tooltip: tooltip === false ? false : {
							mode: "quadtree",
							onclick: onTooltipClick,
							debug: debug(),
							...props.tooltip?.context,
							...typeof tooltip === "object" ? tooltip : null
						},
						brush: brush && (brush === true || brush.mode == void 0 || brush.mode === "integrated") ? {
							axis: "both",
							resetOnEnd: true,
							xDomain,
							yDomain,
							...brushProps(),
							onBrushEnd: (e) => {
								xDomain = e.xDomain;
								yDomain = e.yDomain;
								brushProps().onBrushEnd?.(e);
							}
						} : false,
						get context() {
							return context;
						},
						set context($$value) {
							context = $$value;
							$$settled = false;
						},
						children,
						$$slots: { default: true }
					}
				]));
			}
		}
		do {
			$$settled = true;
			$$inner_renderer = $$renderer.copy();
			$$render_inner($$inner_renderer);
		} while (!$$settled);
		$$renderer.subsume($$inner_renderer);
		bind_props($$props, { context });
	});
}
1 - Math.pow(.001, 1 / 300);
new Context("WebGL");
new Context("LegendContext");
//#endregion
//#region src/web/lib/components/dashboard/CostChart.svelte
function CostChart($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { data = [], costByDayByModel = void 0, modelFirstSeen = void 0, hoverDate = void 0, onHoverDateChange = void 0, onDateClick = void 0 } = $$props;
		let mode = "daily";
		const MODEL_COLORS = {
			"claude-sonnet-4-20250514": "var(--blue)",
			"claude-opus-4-6": "var(--purple)",
			"claude-haiku-3.5": "var(--cyan)",
			"claude-3-5-sonnet-20241022": "var(--green)",
			"claude-sonnet-4-5-20250929": "var(--amber)"
		};
		const FALLBACK_COLORS = [
			"var(--accent)",
			"var(--blue)",
			"var(--purple)",
			"var(--cyan)",
			"var(--green)",
			"var(--amber)"
		];
		const hasModelData = derived(() => costByDayByModel && Object.keys(costByDayByModel).length > 0);
		const allModels = derived(() => {
			if (!costByDayByModel) return [];
			const models = /* @__PURE__ */ new Set();
			for (const dayModels of Object.values(costByDayByModel)) for (const m of Object.keys(dayModels)) models.add(m);
			return [...models].sort();
		});
		function aggregateByWeek(rows, getValue) {
			const weekMap = /* @__PURE__ */ new Map();
			for (const r of rows) {
				const dt = new Date(r.dateStr);
				const ws = new Date(dt);
				ws.setDate(dt.getDate() - dt.getDay());
				const key = ws.toISOString().slice(0, 10);
				const existing = weekMap.get(key) ?? {};
				const vals = getValue(r);
				for (const [k, v] of Object.entries(vals)) existing[k] = (existing[k] ?? 0) + v;
				weekMap.set(key, existing);
			}
			return weekMap;
		}
		const stackedData = derived(() => {
			if (!hasModelData() || !costByDayByModel) {
				let dailyRows = [...data].sort((a, b) => a.date.localeCompare(b.date)).map((d) => ({
					dateStr: d.date,
					cost: d.cost
				}));
				if (mode === "weekly") {
					const weekMap = /* @__PURE__ */ new Map();
					for (const d of dailyRows) {
						const dt = new Date(d.dateStr);
						const ws = new Date(dt);
						ws.setDate(dt.getDate() - dt.getDay());
						const key = ws.toISOString().slice(0, 10);
						weekMap.set(key, (weekMap.get(key) ?? 0) + d.cost);
					}
					dailyRows = [...weekMap.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([dateStr, cost]) => ({
						dateStr,
						cost
					}));
				}
				return dailyRows.map((d) => ({
					date: new Date(d.dateStr),
					dateStr: d.dateStr,
					total: d.cost,
					models: { _total: {
						y0: 0,
						y1: d.cost,
						cost: d.cost
					} }
				}));
			}
			const allDates = Object.keys(costByDayByModel).sort();
			let dateModelMap;
			if (mode === "weekly") {
				const weekAgg = aggregateByWeek(allDates.map((d) => ({
					dateStr: d,
					vals: costByDayByModel[d]
				})), (r) => r.vals);
				dateModelMap = new Map([...weekAgg.entries()].sort((a, b) => a[0].localeCompare(b[0])));
			} else dateModelMap = new Map(allDates.map((d) => [d, costByDayByModel[d]]));
			const rows = [];
			for (const [dateStr, modelCosts] of dateModelMap) {
				let cumulative = 0;
				const models = {};
				for (const model of allModels()) {
					const cost = modelCosts[model] ?? 0;
					models[model] = {
						y0: cumulative,
						y1: cumulative + cost,
						cost
					};
					cumulative += cost;
				}
				rows.push({
					date: new Date(dateStr),
					dateStr,
					total: cumulative,
					models
				});
			}
			return rows;
		});
		const modelSeries = derived(() => {
			if (!hasModelData()) return [{
				model: "_total",
				color: "var(--accent)",
				label: "Total",
				data: stackedData().map((d) => ({
					date: d.date,
					dateStr: d.dateStr,
					y0: 0,
					y1: d.total,
					cost: d.total
				}))
			}];
			return allModels().map((model, i) => ({
				model,
				color: MODEL_COLORS[model] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
				label: formatModelName(model),
				data: stackedData().map((d) => ({
					date: d.date,
					dateStr: d.dateStr,
					y0: d.models[model]?.y0 ?? 0,
					y1: d.models[model]?.y1 ?? 0,
					cost: d.models[model]?.cost ?? 0
				}))
			}));
		});
		const maxY = derived(() => Math.max(...stackedData().map((d) => d.total), .01));
		const annotations = derived(() => {
			if (!modelFirstSeen) return [];
			return Object.entries(modelFirstSeen).filter(([_, dateStr]) => {
				const d = new Date(dateStr);
				return stackedData().some((s) => s.date.getTime() <= d.getTime()) || stackedData().some((s) => s.date.getTime() >= d.getTime());
			}).map(([model, dateStr]) => ({
				model,
				date: new Date(dateStr),
				label: formatModelName(model),
				color: MODEL_COLORS[model] ?? "var(--text-dim)"
			}));
		});
		const externalHoverX = derived(() => {
			if (!hoverDate || stackedData().length === 0) return null;
			return new Date(hoverDate);
		});
		$$renderer.push(`<div class="card"><div class="card-header"><span class="card-title">Cost Over Time</span> <div class="toggle-group svelte-v5uf1r"><button${attr_class("toggle-btn svelte-v5uf1r", void 0, { "active": mode === "daily" })}>Daily</button> <button${attr_class("toggle-btn svelte-v5uf1r", void 0, { "active": mode === "weekly" })}>Weekly</button></div></div> <div class="cost-chart-area svelte-v5uf1r">`);
		if (stackedData().length > 0) {
			$$renderer.push("<!--[0-->");
			Chart($$renderer, {
				data: stackedData(),
				x: "date",
				y: "total",
				yDomain: [0, maxY()],
				yNice: true,
				xScale: scaleTime(),
				yScale: scaleLinear(),
				padding: {
					top: 12,
					right: 16,
					bottom: 28,
					left: 48
				},
				tooltip: { mode: "bisect-x" },
				children: ($$renderer) => {
					Svg($$renderer, {
						children: ($$renderer) => {
							Grid($$renderer, {
								y: true,
								yTicks: 4
							});
							$$renderer.push(`<!----> `);
							Axis($$renderer, {
								placement: "left",
								ticks: 4,
								format: (v) => formatCost(v)
							});
							$$renderer.push(`<!----> `);
							Axis($$renderer, {
								placement: "bottom",
								format: (v) => {
									const d = v instanceof Date ? v : new Date(v);
									return `${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getDate().toString().padStart(2, "0")}`;
								}
							});
							$$renderer.push(`<!----> <!--[-->`);
							const each_array = ensure_array_like(modelSeries());
							for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
								let series = each_array[$$index];
								Area($$renderer, {
									data: series.data,
									x: "date",
									y0: "y0",
									y1: "y1",
									fill: series.color,
									fillOpacity: .35,
									line: {
										stroke: series.color,
										strokeWidth: 1.5,
										class: "cost-area-line"
									}
								});
							}
							$$renderer.push(`<!--]--> <!--[-->`);
							const each_array_1 = ensure_array_like(annotations());
							for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
								let ann = each_array_1[$$index_1];
								AnnotationLine($$renderer, {
									x: ann.date,
									label: ann.label,
									stroke: ann.color,
									strokeWidth: 1,
									class: "annotation-dashed"
								});
							}
							$$renderer.push(`<!--]--> `);
							Highlight($$renderer, {
								axis: "x",
								lines: {
									stroke: "var(--text-dim)",
									strokeWidth: 1,
									class: "highlight-rule"
								},
								points: {
									r: 3,
									fill: "var(--accent)",
									stroke: "var(--bg-card)",
									strokeWidth: 2
								},
								onAreaClick: (e, detail) => {
									if (detail?.data?.dateStr) onDateClick?.(detail.data.dateStr);
								}
							});
							$$renderer.push(`<!----> `);
							if (externalHoverX()) {
								$$renderer.push("<!--[0-->");
								Rule($$renderer, {
									x: externalHoverX(),
									stroke: "var(--text-dim)",
									strokeWidth: 1,
									class: "external-hover-rule"
								});
							} else $$renderer.push("<!--[-1-->");
							$$renderer.push(`<!--]-->`);
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----> `);
					Html($$renderer, {
						children: ($$renderer) => {
							{
								function children($$renderer, { data }) {
									$$renderer.push(`<div class="chart-tooltip svelte-v5uf1r"><div class="chart-tooltip-label svelte-v5uf1r">${escape_html(data ? formatDate(data.date) : "")}</div> `);
									if (hasModelData() && data) {
										$$renderer.push("<!--[0-->");
										$$renderer.push(`<!--[-->`);
										const each_array_2 = ensure_array_like(allModels().filter((m) => (data.models[m]?.cost ?? 0) > 0));
										for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
											let model = each_array_2[$$index_2];
											$$renderer.push(`<div class="chart-tooltip-row svelte-v5uf1r"><span class="tooltip-model-swatch svelte-v5uf1r"${attr_style(`background:${stringify(MODEL_COLORS[model] ?? "var(--text-dim)")}`)}></span> <span>${escape_html(formatModelName(model))}</span> <span class="chart-tooltip-value svelte-v5uf1r">${escape_html(formatCost(data.models[model]?.cost ?? 0))}</span></div>`);
										}
										$$renderer.push(`<!--]-->`);
									} else $$renderer.push("<!--[-1-->");
									$$renderer.push(`<!--]--> <div class="chart-tooltip-row total-row svelte-v5uf1r"><span>Total</span> <span class="chart-tooltip-value svelte-v5uf1r">${escape_html(data ? formatCost(data.total) : "")}</span></div></div>`);
								}
								if (Tooltip) {
									$$renderer.push("<!--[-->");
									Tooltip($$renderer, {
										x: "data",
										y: "pointer",
										anchor: "top-right",
										variant: "none",
										children,
										$$slots: { default: true }
									});
									$$renderer.push("<!--]-->");
								} else {
									$$renderer.push("<!--[!-->");
									$$renderer.push("<!--]-->");
								}
							}
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!---->`);
				},
				$$slots: { default: true }
			});
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div class="empty svelte-v5uf1r">No cost data available</div>`);
		}
		$$renderer.push(`<!--]--></div></div>`);
	});
}
//#endregion
//#region src/web/lib/components/dashboard/ModelDistribution.svelte
function ModelDistribution($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { data = [], onModelClick } = $$props;
		const MODEL_COLORS = {
			"claude-sonnet-4-20250514": "var(--blue)",
			"claude-opus-4-6": "var(--purple)",
			"claude-haiku-3.5": "var(--cyan)",
			"claude-3-5-sonnet-20241022": "var(--green)"
		};
		const chartData = derived(() => data.map((item) => ({
			label: formatModelName(item.model),
			model: item.model,
			value: item.percentage * 100,
			color: MODEL_COLORS[item.model] ?? item.color
		})));
		$$renderer.push(`<div class="card"><div class="card-header"><span class="card-title">Model Distribution</span></div> <div class="chart-body svelte-l7vuub">`);
		if (chartData().length > 0) {
			$$renderer.push("<!--[0-->");
			{
				function tooltip($$renderer, { context }) {
					{
						function children($$renderer, { data }) {
							$$renderer.push(`<div class="chart-tooltip svelte-l7vuub"><div class="chart-tooltip-label svelte-l7vuub">${escape_html(data.label)}</div> <div class="chart-tooltip-row svelte-l7vuub"><span>Usage</span> <span class="chart-tooltip-value svelte-l7vuub">${escape_html(data.value.toFixed(1))}%</span></div></div>`);
						}
						if (Tooltip) {
							$$renderer.push("<!--[-->");
							Tooltip($$renderer, {
								context,
								children,
								$$slots: { default: true }
							});
							$$renderer.push("<!--]-->");
						} else {
							$$renderer.push("<!--[!-->");
							$$renderer.push("<!--]-->");
						}
					}
				}
				BarChart($$renderer, {
					data: chartData(),
					x: "value",
					y: "label",
					orientation: "horizontal",
					xScale: scaleLinear(),
					yScale: scaleBand().padding(.35),
					bandPadding: .35,
					grid: false,
					axis: { tickLabelProps: {
						fill: "var(--text-secondary)",
						style: "font-family: var(--font-mono); font-size: 12px;"
					} },
					rule: false,
					highlight: false,
					props: { bars: {
						radius: 4,
						rounded: "edge",
						class: "model-bar"
					} },
					onBarClick: (e, detail) => {
						if (onModelClick && detail.data?.model) onModelClick(detail.data.model);
					},
					tooltip,
					$$slots: { tooltip: true }
				});
			}
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div class="empty svelte-l7vuub">No model data available</div>`);
		}
		$$renderer.push(`<!--]--></div></div>`);
	});
}
//#endregion
//#region src/web/lib/components/shared/Skeleton.svelte
function Skeleton($$renderer, $$props) {
	let { width = "100%", height = "20px", borderRadius = "var(--radius-sm)" } = $$props;
	$$renderer.push(`<div class="skeleton svelte-hwbici"${attr_style(`width:${stringify(width)};height:${stringify(height)};border-radius:${stringify(borderRadius)}`)}></div>`);
}
//#endregion
//#region src/web/lib/components/dashboard/OverviewCards.svelte
function OverviewCards($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { totalSessions = 0, totalTokens = 0, totalCost = 0, cacheEfficiency = 0, avgCostPerSession = void 0, cacheSavingsAmount = void 0, sparklineData = [], weekOverWeek = void 0, loading = false } = $$props;
		const cards = derived(() => [
			{
				label: "Sessions",
				value: String(totalSessions),
				delta: weekOverWeek?.sessions
			},
			{
				label: "Avg Cost/Session",
				value: formatCost(avgCostPerSession ?? (totalSessions > 0 ? totalCost / totalSessions : 0)),
				delta: weekOverWeek?.tokens
			},
			{
				label: "Total Cost",
				value: formatCost(totalCost),
				delta: weekOverWeek?.cost
			},
			{
				label: "Cache Savings",
				value: cacheSavingsAmount != null ? formatCost(cacheSavingsAmount) : formatCost(0),
				delta: weekOverWeek?.cacheEfficiency
			}
		]);
		function formatDelta(d) {
			if (d === void 0 || d === null) return {
				text: "—",
				cls: "neutral"
			};
			if (d === 0) return {
				text: "—",
				cls: "neutral"
			};
			const pct = (Math.abs(d) * 100).toFixed(1);
			if (d > 0) return {
				text: `↑ ${pct}%`,
				cls: "positive"
			};
			return {
				text: `↓ ${pct}%`,
				cls: "negative"
			};
		}
		function sparklinePath(data) {
			if (!data.length) return "";
			const max = Math.max(...data, 1);
			const w = 120;
			const h = 40;
			const step = w / Math.max(data.length - 1, 1);
			return data.map((v, i) => {
				const x = i * step;
				const y = h - v / max * h * .8;
				return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
			}).join(" ");
		}
		function sparklineAreaPath(data) {
			if (!data.length) return "";
			const line = sparklinePath(data);
			const w = 120;
			const h = 40;
			const step = w / Math.max(data.length - 1, 1);
			return `${line} L${((data.length - 1) * step).toFixed(1)},${h} L0,${h} Z`;
		}
		$$renderer.push(`<div class="kpi-row"><!--[-->`);
		const each_array = ensure_array_like(cards());
		for (let i = 0, $$length = each_array.length; i < $$length; i++) {
			let card = each_array[i];
			$$renderer.push(`<div class="kpi-card svelte-5ru012">`);
			if (loading) {
				$$renderer.push("<!--[0-->");
				Skeleton($$renderer, {
					width: "80px",
					height: "14px"
				});
				$$renderer.push(`<!----> <div style="margin-top:12px">`);
				Skeleton($$renderer, {
					width: "120px",
					height: "32px"
				});
				$$renderer.push(`<!----></div>`);
			} else {
				$$renderer.push("<!--[-1-->");
				const delta = formatDelta(card.delta);
				$$renderer.push(`<div class="kpi-label svelte-5ru012">${escape_html(card.label)}</div> <div class="kpi-value svelte-5ru012">${escape_html(card.value)}</div> <div${attr_class(`kpi-trend ${stringify(delta.cls)}`, "svelte-5ru012")}>${escape_html(delta.text)}</div> `);
				if (sparklineData[i]?.length) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<svg class="kpi-sparkline svelte-5ru012" viewBox="0 0 120 40" preserveAspectRatio="none"><path${attr("d", sparklineAreaPath(sparklineData[i]))} fill="var(--accent)" opacity="0.15"></path><path${attr("d", sparklinePath(sparklineData[i]))} fill="none" stroke="var(--accent)" stroke-width="1.5"></path></svg>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]-->`);
			}
			$$renderer.push(`<!--]--></div>`);
		}
		$$renderer.push(`<!--]--></div>`);
	});
}
//#endregion
//#region src/web/lib/components/dashboard/ToolUsage.svelte
function ToolUsage($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { data = [], onToolClick } = $$props;
		const totalCount = derived(() => data.reduce((s, d) => s + d.count, 0));
		const chartData = derived(() => data.map((item) => ({
			label: item.name,
			value: item.count,
			percentage: totalCount() > 0 ? item.count / totalCount() * 100 : 0
		})));
		$$renderer.push(`<div class="card"><div class="card-header"><span class="card-title">Tool Usage</span></div> <div class="chart-body svelte-1hslk19">`);
		if (chartData().length > 0) {
			$$renderer.push("<!--[0-->");
			{
				function tooltip($$renderer, { context }) {
					{
						function children($$renderer, { data }) {
							$$renderer.push(`<div class="chart-tooltip svelte-1hslk19"><div class="chart-tooltip-label svelte-1hslk19">${escape_html(data.label)}</div> <div class="chart-tooltip-row svelte-1hslk19"><span>Count</span> <span class="chart-tooltip-value svelte-1hslk19">${escape_html(data.value.toLocaleString())}</span></div> <div class="chart-tooltip-row svelte-1hslk19"><span>Share</span> <span class="chart-tooltip-value svelte-1hslk19">${escape_html(data.percentage.toFixed(1))}%</span></div></div>`);
						}
						if (Tooltip) {
							$$renderer.push("<!--[-->");
							Tooltip($$renderer, {
								context,
								children,
								$$slots: { default: true }
							});
							$$renderer.push("<!--]-->");
						} else {
							$$renderer.push("<!--[!-->");
							$$renderer.push("<!--]-->");
						}
					}
				}
				BarChart($$renderer, {
					data: chartData(),
					x: "value",
					y: "label",
					orientation: "horizontal",
					xScale: scaleLinear(),
					yScale: scaleBand().padding(.3),
					bandPadding: .3,
					grid: false,
					axis: { tickLabelProps: {
						fill: "var(--text-secondary)",
						style: "font-family: var(--font-mono); font-size: 11px;"
					} },
					rule: false,
					highlight: false,
					props: { bars: {
						radius: 4,
						rounded: "edge",
						class: "tool-bar"
					} },
					onBarClick: (e, detail) => {
						if (onToolClick && detail.data?.label) onToolClick(detail.data.label);
					},
					tooltip,
					$$slots: { tooltip: true }
				});
			}
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div class="empty svelte-1hslk19">No tool usage data</div>`);
		}
		$$renderer.push(`<!--]--></div></div>`);
	});
}
//#endregion
//#region src/web/lib/components/dashboard/TopFiles.svelte
function TopFiles($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { data = [] } = $$props;
		const topEntries = derived(() => data.slice(0, 8));
		$$renderer.push(`<div class="card"><div class="card-header"><span class="card-title">Top Files</span> <span class="card-subtitle">By operations</span></div> <div class="file-list svelte-1aub12q"><!--[-->`);
		const each_array = ensure_array_like(topEntries());
		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let file = each_array[$$index];
			$$renderer.push(`<div class="top-file-row svelte-1aub12q"><span class="top-file-path svelte-1aub12q"${attr("title", file.path)}>${escape_html(file.path)}</span> <div class="top-file-stats svelte-1aub12q"><span class="top-file-reads svelte-1aub12q">${escape_html(file.reads)}R</span> <span class="top-file-edits svelte-1aub12q">${escape_html(file.edits)}E</span></div></div>`);
		}
		$$renderer.push(`<!--]--> `);
		if (!topEntries().length) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="empty svelte-1aub12q">No file data available</div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div></div>`);
	});
}
//#endregion
export { Chart as _, ModelDistribution as a, PieChart as c, Grid as d, Axis as f, Html as g, Tooltip as h, Skeleton as i, BarChart as l, Area as m, ToolUsage as n, CostChart as o, Rule as p, OverviewCards as r, ScatterChart as s, TopFiles as t, Highlight as u, Svg as v, ActivityHeatmap as y };
