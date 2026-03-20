import "../../chunks/index-server.js";
import { E as escape_html, a as derived, f as html, n as attr_style, o as ensure_array_like, t as attr_class, u as stringify, w as attr } from "../../chunks/server.js";
import { t as analyticsStore } from "../../chunks/analytics.svelte.js";
import "../../chunks/projects.svelte.js";
import { _ as Chart, a as ModelDistribution, c as PieChart, d as Grid, f as Axis, g as Html, h as Tooltip, i as Skeleton, l as BarChart, m as Area, n as ToolUsage, o as CostChart, p as Rule, r as OverviewCards, s as ScatterChart, t as TopFiles, u as Highlight, v as Svg, y as ActivityHeatmap } from "../../chunks/TopFiles.js";
import { a as formatTokens, i as formatRelativeTime, n as formatDate, o as truncateText, r as formatDuration, t as formatCost } from "../../chunks/format.js";
import { t as formatModelName } from "../../chunks/pricing.js";
import { scaleBand, scaleLinear, scaleTime } from "d3-scale";
//#region src/web/lib/components/dashboard/CacheEfficiency.svelte
function CacheEfficiency($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { hitRate = 0, tokens = {
			cacheRead: 0,
			cacheCreation: 0,
			rawInput: 0
		}, savings = 0, dailyEfficiency = void 0, cacheSavings = void 0 } = $$props;
		const radius = 45;
		const circumference = 2 * Math.PI * radius;
		const dashOffset = derived(() => circumference - hitRate * circumference);
		const trendData = derived(() => {
			if (!dailyEfficiency) return [];
			return Object.entries(dailyEfficiency).sort((a, b) => a[0].localeCompare(b[0])).map(([date, rate]) => ({
				date,
				rate
			}));
		});
		const trendW = 280;
		const trendH = 80;
		const trendPad = {
			top: 8,
			right: 8,
			bottom: 16,
			left: 32
		};
		const trendInnerW = trendW - trendPad.left - trendPad.right;
		const trendInnerH = trendH - trendPad.top - trendPad.bottom;
		function trendX(i) {
			if (trendData().length <= 1) return trendPad.left + trendInnerW / 2;
			return trendPad.left + i / (trendData().length - 1) * trendInnerW;
		}
		function trendY(rate) {
			return trendPad.top + trendInnerH - rate * trendInnerH;
		}
		const trendLinePath = derived(() => trendData().map((d, i) => `${i === 0 ? "M" : "L"}${trendX(i).toFixed(1)},${trendY(d.rate).toFixed(1)}`).join(" "));
		$$renderer.push(`<div class="card"><div class="card-header"><span class="card-title">Cache Efficiency</span></div> <div class="cache-panel svelte-7w6jgn"><div class="cache-ring-wrap svelte-7w6jgn"><svg class="cache-ring-svg svelte-7w6jgn" viewBox="0 0 120 120"><circle cx="60" cy="60"${attr("r", radius)} class="cache-ring-bg svelte-7w6jgn"></circle><circle cx="60" cy="60"${attr("r", radius)} class="cache-ring-fill svelte-7w6jgn"${attr("stroke-dasharray", circumference)}${attr("stroke-dashoffset", dashOffset())}></circle></svg> <div class="cache-ring-label svelte-7w6jgn"><div class="cache-ring-pct svelte-7w6jgn">${escape_html((hitRate * 100).toFixed(1))}%</div> <div class="cache-ring-sub svelte-7w6jgn">hit rate</div></div></div> <div class="cache-savings svelte-7w6jgn">`);
		if (cacheSavings) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="cache-savings-headline svelte-7w6jgn">Cache saved you <span class="cache-savings-amount-lg svelte-7w6jgn">${escape_html(formatCost(cacheSavings.savings))}</span> <span class="cache-savings-pct svelte-7w6jgn">(${escape_html(cacheSavings.savingsPercent.toFixed(0))}% savings)</span></div> <div class="cache-savings-detail svelte-7w6jgn">Without caching: ${escape_html(formatCost(cacheSavings.uncachedCost))}  |  With caching: ${escape_html(formatCost(cacheSavings.actualCost))}</div>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div class="cache-savings-amount svelte-7w6jgn">${escape_html(formatCost(savings))}</div> <div class="cache-savings-label svelte-7w6jgn">Estimated savings</div>`);
		}
		$$renderer.push(`<!--]--></div> <div class="cache-breakdown svelte-7w6jgn"><div class="cache-breakdown-item svelte-7w6jgn"><span class="cache-breakdown-val svelte-7w6jgn">${escape_html(formatTokens(tokens.cacheRead))}</span> <span class="cache-breakdown-label svelte-7w6jgn">Cache Read</span></div> <div class="cache-breakdown-item svelte-7w6jgn"><span class="cache-breakdown-val svelte-7w6jgn">${escape_html(formatTokens(tokens.cacheCreation))}</span> <span class="cache-breakdown-label svelte-7w6jgn">Cache Create</span></div> <div class="cache-breakdown-item svelte-7w6jgn"><span class="cache-breakdown-val svelte-7w6jgn">${escape_html(formatTokens(tokens.rawInput))}</span> <span class="cache-breakdown-label svelte-7w6jgn">Raw Input</span></div></div> `);
		if (trendData().length > 1) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="cache-trend svelte-7w6jgn"><div class="cache-trend-label svelte-7w6jgn">30-Day Trend</div> <svg class="cache-trend-svg svelte-7w6jgn"${attr("viewBox", `0 0 ${stringify(trendW)} ${stringify(trendH)}`)} preserveAspectRatio="xMidYMid meet"><line${attr("x1", trendPad.left)}${attr("y1", trendY(0))}${attr("x2", trendW - trendPad.right)}${attr("y2", trendY(0))} class="trend-grid"></line><line${attr("x1", trendPad.left)}${attr("y1", trendY(1))}${attr("x2", trendW - trendPad.right)}${attr("y2", trendY(1))} class="trend-grid"></line><text${attr("x", trendPad.left - 4)}${attr("y", trendY(0) + 3)} text-anchor="end" class="trend-axis-label">0%</text><text${attr("x", trendPad.left - 4)}${attr("y", trendY(1) + 3)} text-anchor="end" class="trend-axis-label">100%</text><path${attr("d", trendLinePath())} fill="none" stroke="var(--green)" stroke-width="1.5"></path></svg></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div></div>`);
	});
}
//#endregion
//#region src/web/lib/components/dashboard/DurationDistribution.svelte
function DurationDistribution($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { data = [], onBucketClick } = $$props;
		const totalCount = derived(() => data.reduce((s, d) => s + d.count, 0));
		const chartData = derived(() => data.map((item) => ({
			label: item.label,
			value: item.count,
			percentage: totalCount() > 0 ? item.count / totalCount() * 100 : 0
		})));
		$$renderer.push(`<div class="card"><div class="card-header"><span class="card-title">Session Duration</span></div> <div class="chart-body svelte-tnbkje">`);
		if (chartData().length > 0) {
			$$renderer.push("<!--[0-->");
			{
				function tooltip($$renderer, { context }) {
					{
						function children($$renderer, { data }) {
							$$renderer.push(`<div class="chart-tooltip svelte-tnbkje"><div class="chart-tooltip-label svelte-tnbkje">${escape_html(data.label)}</div> <div class="chart-tooltip-row svelte-tnbkje"><span>Sessions</span> <span class="chart-tooltip-value svelte-tnbkje">${escape_html(data.value.toLocaleString())}</span></div> <div class="chart-tooltip-row svelte-tnbkje"><span>Share</span> <span class="chart-tooltip-value svelte-tnbkje">${escape_html(data.percentage.toFixed(1))}%</span></div></div>`);
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
						fill: "var(--text-dim)",
						style: "font-family: var(--font-mono); font-size: 11px;"
					} },
					rule: false,
					highlight: false,
					props: { bars: {
						radius: 3,
						rounded: "edge",
						class: "duration-bar"
					} },
					onBarClick: (e, detail) => {
						if (onBucketClick && detail.data?.label) onBucketClick(detail.data.label);
					},
					tooltip,
					$$slots: { tooltip: true }
				});
			}
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div class="empty svelte-tnbkje">No duration data</div>`);
		}
		$$renderer.push(`<!--]--></div></div>`);
	});
}
//#endregion
//#region src/web/lib/components/dashboard/DurationTrendChart.svelte
function DurationTrendChart($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { data = {}, onDateClick = void 0 } = $$props;
		const chartData = derived(() => {
			return Object.entries(data).sort((a, b) => a[0].localeCompare(b[0])).map(([dateStr, ms]) => ({
				date: new Date(dateStr),
				dateStr,
				ms
			}));
		});
		const maxMs = derived(() => Math.max(...chartData().map((d) => d.ms), 6e4));
		$$renderer.push(`<div class="card"><div class="card-header"><span class="card-title">Avg Session Duration</span> <span class="card-subtitle">Daily average</span></div> <div class="duration-chart-area svelte-dby1d3">`);
		if (chartData().length > 0) {
			$$renderer.push("<!--[0-->");
			Chart($$renderer, {
				data: chartData(),
				x: "date",
				y: "ms",
				yDomain: [0, maxMs()],
				yNice: true,
				xScale: scaleTime(),
				yScale: scaleLinear(),
				padding: {
					top: 12,
					right: 16,
					bottom: 28,
					left: 52
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
								format: (v) => formatDuration(v)
							});
							$$renderer.push(`<!----> `);
							Axis($$renderer, {
								placement: "bottom",
								format: (v) => {
									const d = v instanceof Date ? v : new Date(v);
									return `${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getDate().toString().padStart(2, "0")}`;
								}
							});
							$$renderer.push(`<!----> `);
							Area($$renderer, {
								fill: "var(--cyan)",
								fillOpacity: .12,
								line: {
									stroke: "var(--cyan)",
									strokeWidth: 2
								}
							});
							$$renderer.push(`<!----> `);
							Highlight($$renderer, {
								axis: "x",
								lines: {
									stroke: "var(--text-dim)",
									strokeWidth: 1,
									class: "highlight-rule"
								},
								points: {
									r: 4,
									fill: "var(--cyan)",
									stroke: "var(--bg-card)",
									strokeWidth: 2
								},
								onAreaClick: (e, detail) => {
									if (detail?.data?.dateStr) onDateClick?.(detail.data.dateStr);
								}
							});
							$$renderer.push(`<!---->`);
						},
						$$slots: { default: true }
					});
					$$renderer.push(`<!----> `);
					Html($$renderer, {
						children: ($$renderer) => {
							{
								function children($$renderer, { data }) {
									$$renderer.push(`<div class="chart-tooltip svelte-dby1d3"><div class="chart-tooltip-label svelte-dby1d3">${escape_html(data ? formatDate(data.date) : "")}</div> `);
									if (data) {
										$$renderer.push("<!--[0-->");
										$$renderer.push(`<div class="chart-tooltip-row svelte-dby1d3"><span>Duration</span> <span class="chart-tooltip-value svelte-dby1d3">${escape_html(formatDuration(data.ms))}</span></div>`);
									} else $$renderer.push("<!--[-1-->");
									$$renderer.push(`<!--]--></div>`);
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
			$$renderer.push(`<div class="empty svelte-dby1d3">No duration data available</div>`);
		}
		$$renderer.push(`<!--]--></div></div>`);
	});
}
//#endregion
//#region src/web/lib/components/dashboard/HourlyHeatmap.svelte
function HourlyHeatmap($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { data = {} } = $$props;
		let tooltip = {
			visible: false,
			text: "",
			x: 0,
			y: 0
		};
		const DAYS = [
			"Mon",
			"Tue",
			"Wed",
			"Thu",
			"Fri",
			"Sat",
			"Sun"
		];
		const HOURS = Array.from({ length: 24 }, (_, i) => i);
		const HOUR_LABELS = [
			0,
			3,
			6,
			9,
			12,
			15,
			18,
			21
		];
		const maxCount = derived(() => Math.max(...Object.values(data), 1));
		function level(count) {
			if (count === 0) return "";
			const ratio = count / maxCount();
			if (ratio > .75) return "l4";
			if (ratio > .5) return "l3";
			if (ratio > .25) return "l2";
			return "l1";
		}
		$$renderer.push(`<div class="card"><div class="card-header"><span class="card-title">Coding Rhythm</span> <span class="card-subtitle">Sessions by day and hour</span></div> <div class="hourly-grid-wrapper svelte-1owwcfr"><div class="hourly-grid svelte-1owwcfr"><div class="hourly-corner svelte-1owwcfr"></div> <!--[-->`);
		const each_array = ensure_array_like(HOURS);
		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let h = each_array[$$index];
			$$renderer.push(`<div class="hourly-col-label svelte-1owwcfr">`);
			if (HOUR_LABELS.includes(h)) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`${escape_html(h)}`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div>`);
		}
		$$renderer.push(`<!--]--> <!--[-->`);
		const each_array_1 = ensure_array_like(DAYS);
		for (let $$index_2 = 0, $$length = each_array_1.length; $$index_2 < $$length; $$index_2++) {
			let day = each_array_1[$$index_2];
			$$renderer.push(`<div class="hourly-row-label svelte-1owwcfr">${escape_html(day)}</div> <!--[-->`);
			const each_array_2 = ensure_array_like(HOURS);
			for (let $$index_1 = 0, $$length = each_array_2.length; $$index_1 < $$length; $$index_1++) {
				let h = each_array_2[$$index_1];
				const count = data[`${day}-${String(h).padStart(2, "0")}`] ?? 0;
				$$renderer.push(`<div${attr_class(`hourly-cell ${stringify(level(count))}`, "svelte-1owwcfr")}></div>`);
			}
			$$renderer.push(`<!--]-->`);
		}
		$$renderer.push(`<!--]--></div></div></div> `);
		if (tooltip.visible) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="hourly-tooltip visible svelte-1owwcfr"${attr_style(`left:${stringify(tooltip.x)}px;top:${stringify(tooltip.y)}px`)}>${escape_html(tooltip.text)}</div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
//#region src/web/lib/components/dashboard/InsightsBar.svelte
function InsightsBar($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { insights = [] } = $$props;
		function highlightValues(text) {
			return text.replace(/(\$[\d,.]+)/g, "<span class=\"highlight-value\">$1</span>").replace(/([\d.]+%)/g, "<span class=\"highlight-value\">$1</span>");
		}
		if (insights.length > 0) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="insights-bar svelte-wa2yzq"><!--[-->`);
			const each_array = ensure_array_like(insights);
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let insight = each_array[$$index];
				$$renderer.push(`<div class="insight-card svelte-wa2yzq"><svg class="insight-icon svelte-wa2yzq" viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd"></path></svg> <span class="insight-text svelte-wa2yzq">${html(highlightValues(insight))}</span></div>`);
			}
			$$renderer.push(`<!--]--></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
//#region src/web/lib/components/dashboard/ModelComparisonTable.svelte
function ModelComparisonTable($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { costByModel = {}, cacheEfficiencyByModel = {}, modelSessionCount = {}, totalCost = 0 } = $$props;
		const MODEL_COLORS = {
			"claude-sonnet-4-20250514": "var(--blue)",
			"claude-opus-4-6": "var(--purple)",
			"claude-haiku-3.5": "var(--cyan)",
			"claude-3-5-sonnet-20241022": "var(--green)",
			"claude-sonnet-4-5-20250929": "var(--amber)"
		};
		let sortKey = "cost";
		const rows = derived(() => {
			return [...new Set([...Object.keys(costByModel), ...Object.keys(modelSessionCount)])].map((model) => {
				const cost = costByModel[model] ?? 0;
				const sessions = modelSessionCount[model] ?? 0;
				return {
					model,
					sessions,
					cost,
					cacheRate: cacheEfficiencyByModel[model] ?? 0,
					avgCost: sessions > 0 ? cost / sessions : 0,
					pctSpend: totalCost > 0 ? cost / totalCost * 100 : 0,
					color: MODEL_COLORS[model] ?? "var(--text-dim)"
				};
			});
		});
		const sortedRows = derived(() => {
			return [...rows()].sort((a, b) => {
				let cmp;
				if (sortKey === "model") cmp = formatModelName(a.model).localeCompare(formatModelName(b.model));
				else cmp = a[sortKey] - b[sortKey];
				return -cmp;
			});
		});
		const columns = [
			{
				key: "model",
				label: "Model",
				align: "left"
			},
			{
				key: "sessions",
				label: "Sessions",
				align: "right"
			},
			{
				key: "cost",
				label: "Total Cost",
				align: "right"
			},
			{
				key: "cacheRate",
				label: "Cache Hit Rate",
				align: "right"
			},
			{
				key: "avgCost",
				label: "Avg Cost/Session",
				align: "right"
			},
			{
				key: "pctSpend",
				label: "% of Total",
				align: "right"
			}
		];
		$$renderer.push(`<div class="card"><div class="card-header"><span class="card-title">Model Comparison</span></div> <div class="table-wrap svelte-1f2iphk">`);
		if (sortedRows().length > 0) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<table class="comparison-table svelte-1f2iphk"><thead><tr><!--[-->`);
			const each_array = ensure_array_like(columns);
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let col = each_array[$$index];
				$$renderer.push(`<th${attr_class(`th-${stringify(col.align)}`, "svelte-1f2iphk", { "sorted": sortKey === col.key })}>${escape_html(col.label)} `);
				if (sortKey === col.key) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<span class="sort-arrow svelte-1f2iphk">${escape_html("▼")}</span>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></th>`);
			}
			$$renderer.push(`<!--]--></tr></thead><tbody><!--[-->`);
			const each_array_1 = ensure_array_like(sortedRows());
			for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
				let row = each_array_1[$$index_1];
				$$renderer.push(`<tr class="svelte-1f2iphk"><td class="td-model svelte-1f2iphk"><span class="model-dot svelte-1f2iphk"${attr_style(`background:${stringify(row.color)}`)}></span> ${escape_html(formatModelName(row.model))}</td><td class="td-num svelte-1f2iphk">${escape_html(row.sessions.toLocaleString())}</td><td class="td-num svelte-1f2iphk">${escape_html(formatCost(row.cost))}</td><td class="td-num svelte-1f2iphk">${escape_html((row.cacheRate * 100).toFixed(1))}%</td><td class="td-num svelte-1f2iphk">${escape_html(formatCost(row.avgCost))}</td><td class="td-num svelte-1f2iphk">${escape_html(row.pctSpend.toFixed(1))}%</td></tr>`);
			}
			$$renderer.push(`<!--]--></tbody></table>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div class="empty svelte-1f2iphk">No model data available</div>`);
		}
		$$renderer.push(`<!--]--></div></div>`);
	});
}
//#endregion
//#region src/web/lib/components/dashboard/ProjectCostChart.svelte
function ProjectCostChart($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { data = {}, onProjectClick } = $$props;
		const COLORS = [
			"var(--blue)",
			"var(--purple)",
			"var(--cyan)",
			"var(--green)",
			"var(--amber)",
			"var(--accent)"
		];
		const segments = derived(() => {
			let entries = Object.entries(data).map(([name, cost]) => ({
				name,
				cost
			})).sort((a, b) => b.cost - a.cost);
			if (entries.length === 0) return [];
			if (entries.length >= 6) {
				const top = entries.slice(0, 5);
				const otherCost = entries.slice(5).reduce((s, e) => s + e.cost, 0);
				entries = [...top, {
					name: "Other",
					cost: otherCost
				}];
			}
			const total = entries.reduce((s, e) => s + e.cost, 0);
			if (total === 0) return [];
			return entries.map((e, i) => ({
				key: e.name,
				label: e.name,
				value: e.cost,
				color: COLORS[i % COLORS.length],
				percentage: e.cost / total * 100
			}));
		});
		const totalCost = derived(() => segments().reduce((s, seg) => s + seg.value, 0));
		$$renderer.push(`<div class="card"><div class="card-header"><span class="card-title">Cost by Project</span></div> <div class="donut-layout svelte-10ugej0"><div class="donut-chart-wrap svelte-10ugej0">`);
		if (segments().length > 0) {
			$$renderer.push("<!--[0-->");
			{
				function tooltip($$renderer, { context }) {
					{
						function children($$renderer, { data }) {
							$$renderer.push(`<div class="chart-tooltip svelte-10ugej0"><div class="chart-tooltip-label svelte-10ugej0">${escape_html(data.label)}</div> <div class="chart-tooltip-row svelte-10ugej0"><span>Cost</span> <span class="chart-tooltip-value svelte-10ugej0">${escape_html(formatCost(data.value))}</span></div> <div class="chart-tooltip-row svelte-10ugej0"><span>Share</span> <span class="chart-tooltip-value svelte-10ugej0">${escape_html(data.percentage.toFixed(1))}%</span></div></div>`);
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
				PieChart($$renderer, {
					data: segments(),
					key: "key",
					label: "label",
					value: "value",
					c: "color",
					cRange: segments().map((s) => s.color),
					innerRadius: .65,
					padAngle: .02,
					onArcClick: (e, detail) => {
						if (onProjectClick && detail.data?.key) onProjectClick(detail.data.key);
					},
					tooltip,
					$$slots: { tooltip: true }
				});
			}
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <div class="donut-center svelte-10ugej0"><div class="donut-center-amount svelte-10ugej0">${escape_html(formatCost(totalCost()))}</div> <div class="donut-center-label svelte-10ugej0">total</div></div></div> <div class="donut-legend svelte-10ugej0"><!--[-->`);
		const each_array = ensure_array_like(segments());
		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let seg = each_array[$$index];
			$$renderer.push(`<button class="donut-legend-item svelte-10ugej0" type="button"><span class="donut-legend-swatch svelte-10ugej0"${attr_style(`background:${stringify(seg.color)}`)}></span> <span class="donut-legend-name svelte-10ugej0"${attr("title", seg.label)}>${escape_html(seg.label)}</span> <span class="donut-legend-cost svelte-10ugej0">${escape_html(formatCost(seg.value))}</span> <span class="donut-legend-pct svelte-10ugej0">${escape_html(seg.percentage.toFixed(0))}%</span></button>`);
		}
		$$renderer.push(`<!--]--></div></div></div>`);
	});
}
//#endregion
//#region src/web/lib/components/dashboard/RecentActivity.svelte
function RecentActivity($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { data = [] } = $$props;
		$$renderer.push(`<div class="card"><div class="card-header"><span class="card-title">Recent Activity</span></div> <div class="activity-feed svelte-5ulczu"><!--[-->`);
		const each_array = ensure_array_like(data);
		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let item = each_array[$$index];
			$$renderer.push(`<div class="activity-item svelte-5ulczu"><div class="activity-time svelte-5ulczu">${escape_html(item.timestamp ? formatRelativeTime(item.timestamp) : "")}</div> <div class="activity-dot-line svelte-5ulczu"><div class="activity-dot svelte-5ulczu"></div></div> <div class="activity-body svelte-5ulczu">`);
			if (item.project) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div class="activity-project svelte-5ulczu">${escape_html(item.project)}</div>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> <div class="activity-prompt svelte-5ulczu"${attr("title", item.prompt ?? "")}>${escape_html(item.prompt ? truncateText(item.prompt, 50) : "No prompt")}</div> <div class="activity-meta svelte-5ulczu"><span>${escape_html(formatDuration(item.duration))}</span> <span>${escape_html(formatTokens(item.tokens))} tokens</span></div></div></div>`);
		}
		$$renderer.push(`<!--]--> `);
		if (!data.length) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="empty svelte-5ulczu">No recent activity</div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div></div>`);
	});
}
//#endregion
//#region src/web/lib/components/dashboard/SessionScatterPlot.svelte
function SessionScatterPlot($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { data = [], onSessionClick } = $$props;
		const MODEL_COLORS = {
			"claude-sonnet-4-20250514": "var(--blue)",
			"claude-opus-4-6": "var(--purple)",
			"claude-haiku-3.5": "var(--cyan)",
			"claude-3-5-sonnet-20241022": "var(--green)",
			"claude-sonnet-4-5-20250929": "var(--amber)"
		};
		const chartData = derived(() => data.map((d) => ({
			...d,
			color: MODEL_COLORS[d.model] ?? "var(--text-dim)"
		})));
		derived(() => {
			if (chartData().length === 0) return 0;
			const sorted = [...chartData()].sort((a, b) => a.durationMin - b.durationMin);
			const mid = Math.floor(sorted.length / 2);
			return sorted.length % 2 !== 0 ? sorted[mid].durationMin : (sorted[mid - 1].durationMin + sorted[mid].durationMin) / 2;
		});
		derived(() => {
			if (chartData().length === 0) return 0;
			const sorted = [...chartData()].sort((a, b) => a.cost - b.cost);
			const mid = Math.floor(sorted.length / 2);
			return sorted.length % 2 !== 0 ? sorted[mid].cost : (sorted[mid - 1].cost + sorted[mid].cost) / 2;
		});
		$$renderer.push(`<div class="card"><div class="card-header"><span class="card-title">Session Cost vs Duration</span></div> <div class="scatter-body svelte-1x4u35f">`);
		if (chartData().length > 0) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="scatter-chart-wrap svelte-1x4u35f">`);
			{
				function tooltip($$renderer, { context }) {
					{
						function children($$renderer, { data }) {
							$$renderer.push(`<div class="chart-tooltip svelte-1x4u35f"><div class="chart-tooltip-label svelte-1x4u35f">${escape_html(data.slug ?? data.sessionId.slice(0, 8))}</div> <div class="chart-tooltip-row svelte-1x4u35f"><span>Model</span> <span class="chart-tooltip-value svelte-1x4u35f">${escape_html(formatModelName(data.model))}</span></div> <div class="chart-tooltip-row svelte-1x4u35f"><span>Cost</span> <span class="chart-tooltip-value svelte-1x4u35f">${escape_html(formatCost(data.cost))}</span></div> <div class="chart-tooltip-row svelte-1x4u35f"><span>Duration</span> <span class="chart-tooltip-value svelte-1x4u35f">${escape_html(data.durationMin.toFixed(1))}m</span></div> <div class="chart-tooltip-row svelte-1x4u35f"><span>Files edited</span> <span class="chart-tooltip-value svelte-1x4u35f">${escape_html(data.filesEdited)}</span></div> <div class="chart-tooltip-row svelte-1x4u35f"><span>Cache hit</span> <span class="chart-tooltip-value svelte-1x4u35f">${escape_html((data.cacheHitRate * 100).toFixed(1))}%</span></div></div>`);
						}
						if (Tooltip) {
							$$renderer.push("<!--[-->");
							Tooltip($$renderer, {
								context,
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
				}
				ScatterChart($$renderer, {
					data: chartData(),
					x: "durationMin",
					y: "cost",
					xScale: scaleLinear(),
					axis: { tickLabelProps: {
						fill: "var(--text-secondary)",
						style: "font-family: var(--font-mono); font-size: 11px;"
					} },
					grid: {
						x: true,
						y: true
					},
					rule: false,
					highlight: {
						points: { r: 6 },
						lines: false,
						axis: "both"
					},
					onTooltipClick: (e, detail) => {
						if (onSessionClick && detail?.data?.sessionId) onSessionClick(detail.data.sessionId);
					},
					props: {
						points: {
							r: 4,
							class: "scatter-point"
						},
						xAxis: {
							label: "Duration (min)",
							labelProps: {
								fill: "var(--text-dim)",
								style: "font-size: 11px;"
							}
						},
						yAxis: {
							label: "Cost ($)",
							labelProps: {
								fill: "var(--text-dim)",
								style: "font-size: 11px;"
							}
						}
					},
					tooltip,
					$$slots: { tooltip: true }
				});
			}
			$$renderer.push(`<!----> <div class="quadrant-label top-left svelte-1x4u35f">Quick &amp; Expensive</div> <div class="quadrant-label top-right svelte-1x4u35f">Long &amp; Expensive</div> <div class="quadrant-label bottom-left svelte-1x4u35f">Quick &amp; Cheap</div> <div class="quadrant-label bottom-right svelte-1x4u35f">Long &amp; Cheap</div></div>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div class="empty svelte-1x4u35f">No session data available</div>`);
		}
		$$renderer.push(`<!--]--></div></div>`);
	});
}
//#endregion
//#region src/web/lib/components/dashboard/TimeRangeSelector.svelte
function TimeRangeSelector($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { value = "all", onChange } = $$props;
		const presets = [
			{
				key: "7d",
				label: "7 days"
			},
			{
				key: "30d",
				label: "30 days"
			},
			{
				key: "90d",
				label: "90 days"
			},
			{
				key: "all",
				label: "All time"
			}
		];
		$$renderer.push(`<div class="toggle-group svelte-1jkekrb"><!--[-->`);
		const each_array = ensure_array_like(presets);
		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let preset = each_array[$$index];
			$$renderer.push(`<button${attr_class("toggle-btn svelte-1jkekrb", void 0, { "active": value === preset.key })} type="button">${escape_html(preset.label)}</button>`);
		}
		$$renderer.push(`<!--]--></div>`);
	});
}
//#endregion
//#region src/web/lib/components/dashboard/TokenTrendChart.svelte
function TokenTrendChart($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { data = {}, hoverDate = void 0, onHoverDateChange = void 0, onDateClick = void 0 } = $$props;
		let mode = "daily";
		const layers = [
			{
				key: "input",
				label: "Input",
				color: "var(--blue)"
			},
			{
				key: "output",
				label: "Output",
				color: "var(--purple)"
			},
			{
				key: "cacheRead",
				label: "Cache Read",
				color: "var(--green)"
			},
			{
				key: "cacheCreation",
				label: "Cache Create",
				color: "var(--amber)"
			}
		];
		const chartData = derived(() => {
			const sorted = Object.entries(data).sort((a, b) => a[0].localeCompare(b[0])).map(([date, v]) => ({
				dateStr: date,
				...v
			}));
			let rows;
			if (mode === "weekly") {
				const weekMap = /* @__PURE__ */ new Map();
				for (const d of sorted) {
					const dt = new Date(d.dateStr);
					const ws = new Date(dt);
					ws.setDate(dt.getDate() - dt.getDay());
					const key = ws.toISOString().slice(0, 10);
					const existing = weekMap.get(key) ?? {
						dateStr: key,
						input: 0,
						output: 0,
						cacheRead: 0,
						cacheCreation: 0
					};
					existing.input += d.input;
					existing.output += d.output;
					existing.cacheRead += d.cacheRead;
					existing.cacheCreation += d.cacheCreation;
					weekMap.set(key, existing);
				}
				rows = [...weekMap.values()].sort((a, b) => a.dateStr.localeCompare(b.dateStr));
			} else rows = sorted;
			return rows.map((d) => {
				const inputY0 = 0;
				const inputY1 = d.input;
				const outputY0 = inputY1;
				const outputY1 = outputY0 + d.output;
				const cacheReadY0 = outputY1;
				const cacheReadY1 = cacheReadY0 + d.cacheRead;
				const cacheCreationY0 = cacheReadY1;
				const cacheCreationY1 = cacheCreationY0 + d.cacheCreation;
				return {
					date: new Date(d.dateStr),
					dateStr: d.dateStr,
					input: d.input,
					output: d.output,
					cacheRead: d.cacheRead,
					cacheCreation: d.cacheCreation,
					total: d.input + d.output + d.cacheRead + d.cacheCreation,
					inputY0,
					inputY1,
					outputY0,
					outputY1,
					cacheReadY0,
					cacheReadY1,
					cacheCreationY0,
					cacheCreationY1
				};
			});
		});
		const maxTotal = derived(() => Math.max(...chartData().map((d) => d.total), 1));
		const layerDefs = derived(() => [
			{
				key: "input",
				color: "var(--blue)",
				y0: "inputY0",
				y1: "inputY1"
			},
			{
				key: "output",
				color: "var(--purple)",
				y0: "outputY0",
				y1: "outputY1"
			},
			{
				key: "cacheRead",
				color: "var(--green)",
				y0: "cacheReadY0",
				y1: "cacheReadY1"
			},
			{
				key: "cacheCreation",
				color: "var(--amber)",
				y0: "cacheCreationY0",
				y1: "cacheCreationY1"
			}
		]);
		const externalHoverX = derived(() => {
			if (!hoverDate || chartData().length === 0) return null;
			return new Date(hoverDate);
		});
		$$renderer.push(`<div class="card"><div class="card-header"><span class="card-title">Token Usage</span> <div class="toggle-group svelte-181s044"><button${attr_class("toggle-btn svelte-181s044", void 0, { "active": mode === "daily" })}>Daily</button> <button${attr_class("toggle-btn svelte-181s044", void 0, { "active": mode === "weekly" })}>Weekly</button></div></div> <div class="token-chart-area svelte-181s044">`);
		if (chartData().length > 0) {
			$$renderer.push("<!--[0-->");
			Chart($$renderer, {
				data: chartData(),
				x: "date",
				y: "total",
				yDomain: [0, maxTotal()],
				yNice: true,
				xScale: scaleTime(),
				yScale: scaleLinear(),
				padding: {
					top: 12,
					right: 16,
					bottom: 28,
					left: 52
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
								format: (v) => formatTokens(v)
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
							const each_array = ensure_array_like(layerDefs());
							for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
								let layer = each_array[$$index];
								Area($$renderer, {
									data: chartData(),
									x: "date",
									y0: layer.y0,
									y1: layer.y1,
									fill: layer.color,
									fillOpacity: .35,
									line: {
										stroke: layer.color,
										strokeWidth: 1,
										class: "token-area-line"
									}
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
									$$renderer.push(`<div class="chart-tooltip svelte-181s044"><div class="chart-tooltip-label svelte-181s044">${escape_html(data ? formatDate(data.date) : "")}</div> `);
									if (data) {
										$$renderer.push("<!--[0-->");
										$$renderer.push(`<div class="chart-tooltip-row svelte-181s044"><span class="tooltip-swatch svelte-181s044" style="background:var(--blue)"></span> <span>Input</span> <span class="chart-tooltip-value svelte-181s044">${escape_html(formatTokens(data.input))}</span></div> <div class="chart-tooltip-row svelte-181s044"><span class="tooltip-swatch svelte-181s044" style="background:var(--purple)"></span> <span>Output</span> <span class="chart-tooltip-value svelte-181s044">${escape_html(formatTokens(data.output))}</span></div> <div class="chart-tooltip-row svelte-181s044"><span class="tooltip-swatch svelte-181s044" style="background:var(--green)"></span> <span>Cache Read</span> <span class="chart-tooltip-value svelte-181s044">${escape_html(formatTokens(data.cacheRead))}</span></div> <div class="chart-tooltip-row svelte-181s044"><span class="tooltip-swatch svelte-181s044" style="background:var(--amber)"></span> <span>Cache Create</span> <span class="chart-tooltip-value svelte-181s044">${escape_html(formatTokens(data.cacheCreation))}</span></div> <div class="chart-tooltip-row total-row svelte-181s044"><span>Total</span> <span class="chart-tooltip-value svelte-181s044">${escape_html(formatTokens(data.total))}</span></div>`);
									} else $$renderer.push("<!--[-1-->");
									$$renderer.push(`<!--]--></div>`);
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
			$$renderer.push(`<div class="empty svelte-181s044">No token data available</div>`);
		}
		$$renderer.push(`<!--]--></div> <div class="token-legend svelte-181s044"><!--[-->`);
		const each_array_1 = ensure_array_like(layers);
		for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
			let l = each_array_1[$$index_1];
			$$renderer.push(`<div class="token-legend-item svelte-181s044"><span class="token-legend-swatch svelte-181s044"${attr_style(`background:${stringify(l.color)}`)}></span> <span>${escape_html(l.label)}</span></div>`);
		}
		$$renderer.push(`<!--]--></div></div>`);
	});
}
//#endregion
//#region src/web/routes/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let hoverDate = null;
		let timeRange = "all";
		const ga = derived(() => analyticsStore.globalAnalytics);
		const isLoading = derived(() => analyticsStore.loading);
		const totalTokenCount = derived(() => ga() ? ga().totalTokens.input + ga().totalTokens.output : 0);
		const costData = derived(() => {
			if (!ga()?.costByDay) return [];
			return Object.entries(ga().costByDay).sort((a, b) => a[0].localeCompare(b[0])).map(([date, cost]) => ({
				date,
				cost
			}));
		});
		const modelData = derived(() => {
			if (!ga()?.modelDistribution) return [];
			const colors = [
				"var(--blue)",
				"var(--purple)",
				"var(--cyan)",
				"var(--green)",
				"var(--amber)"
			];
			return Object.entries(ga().modelDistribution).map(([model, percentage], i) => ({
				model,
				percentage,
				color: colors[i % colors.length]
			}));
		});
		const fileData = derived(() => (ga()?.topFiles ?? []).slice(0, 8).map((f) => ({
			path: f.path,
			reads: f.count,
			edits: 0
		})));
		const durationData = derived(() => Object.entries(ga()?.durationBuckets ?? {}).map(([label, count]) => ({
			label,
			count
		})));
		const activityData = derived(() => (ga()?.recentActivity ?? []).map((r) => ({
			sessionId: r.sessionId,
			project: r.project,
			prompt: r.lastPrompt,
			duration: r.duration,
			tokens: r.tokens,
			timestamp: r.timestamp
		})));
		const cacheTokens = derived(() => ({
			cacheRead: ga()?.totalTokens.cacheRead ?? 0,
			cacheCreation: ga()?.totalTokens.cacheCreation ?? 0,
			rawInput: ga()?.totalTokens.input ?? 0
		}));
		const cacheSavingsEstimate = derived(() => (ga()?.totalTokens.cacheRead ?? 0) * 3e-6 * .9);
		const sparklineData = derived(() => ga()?.sparklines ? [
			ga().sparklines.sessions,
			ga().sparklines.cost,
			ga().sparklines.cost,
			ga().sparklines.cacheEfficiency
		] : []);
		const avgCostPerSession = derived(() => ga() && ga().totalSessions > 0 ? ga().totalCost / ga().totalSessions : 0);
		const cacheSavingsData = derived(() => ga()?.cacheSavings);
		const insightsData = derived(() => ga()?.insights ?? []);
		const scatterData = derived(() => ga()?.sessionScatter ?? []);
		function handleDateClick(date) {
			window.location.href = `/sessions?since=${date}`;
		}
		function handleModelClick(model) {
			window.location.href = `/sessions?model=${model}`;
		}
		function handleProjectClick(projectId) {
			window.location.href = `/projects/${projectId}`;
		}
		function handleSessionClick(sessionId) {
			window.location.href = `/sessions/${sessionId}`;
		}
		function handleToolClick(tool) {
			window.location.href = `/sessions?tool=${tool}`;
		}
		function handleBucketClick(bucket) {
			window.location.href = `/sessions?duration=${bucket}`;
		}
		$$renderer.push(`<div class="dashboard-section svelte-dzwqab">`);
		InsightsBar($$renderer, { insights: insightsData() });
		$$renderer.push(`<!----></div> <div class="dashboard-section svelte-dzwqab"><div class="time-range-row svelte-dzwqab">`);
		TimeRangeSelector($$renderer, {
			value: timeRange,
			onChange: (v) => {
				timeRange = v;
			}
		});
		$$renderer.push(`<!----></div> `);
		OverviewCards($$renderer, {
			totalSessions: ga()?.totalSessions ?? 0,
			totalTokens: totalTokenCount(),
			totalCost: ga()?.totalCost ?? 0,
			cacheEfficiency: ga()?.cacheEfficiency ?? 0,
			avgCostPerSession: avgCostPerSession(),
			cacheSavingsAmount: cacheSavingsData()?.savings,
			sparklineData: sparklineData(),
			weekOverWeek: ga()?.weekOverWeek,
			loading: isLoading() && !ga()
		});
		$$renderer.push(`<!----></div> <div class="dashboard-section svelte-dzwqab">`);
		if (isLoading() && !ga()) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="card">`);
			Skeleton($$renderer, {
				width: "100%",
				height: "180px"
			});
			$$renderer.push(`<!----></div>`);
		} else {
			$$renderer.push("<!--[-1-->");
			ActivityHeatmap($$renderer, { data: ga()?.dailyActivity ?? {} });
		}
		$$renderer.push(`<!--]--></div> <div class="dashboard-section grid-2col svelte-dzwqab">`);
		if (isLoading() && !ga()) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="card">`);
			Skeleton($$renderer, {
				width: "100%",
				height: "220px"
			});
			$$renderer.push(`<!----></div> <div class="card">`);
			Skeleton($$renderer, {
				width: "100%",
				height: "220px"
			});
			$$renderer.push(`<!----></div>`);
		} else {
			$$renderer.push("<!--[-1-->");
			CostChart($$renderer, {
				data: costData(),
				costByDayByModel: ga()?.costByDayByModel,
				modelFirstSeen: ga()?.modelFirstSeen,
				hoverDate,
				onHoverDateChange: (d) => {
					hoverDate = d;
				},
				onDateClick: handleDateClick
			});
			$$renderer.push(`<!----> `);
			TokenTrendChart($$renderer, {
				data: ga()?.dailyTokenBreakdown ?? {},
				hoverDate,
				onHoverDateChange: (d) => {
					hoverDate = d;
				},
				onDateClick: handleDateClick
			});
			$$renderer.push(`<!---->`);
		}
		$$renderer.push(`<!--]--></div> <div class="dashboard-section grid-2col svelte-dzwqab">`);
		if (isLoading() && !ga()) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="card">`);
			Skeleton($$renderer, {
				width: "100%",
				height: "320px"
			});
			$$renderer.push(`<!----></div> <div class="card">`);
			Skeleton($$renderer, {
				width: "100%",
				height: "320px"
			});
			$$renderer.push(`<!----></div>`);
		} else {
			$$renderer.push("<!--[-1-->");
			ModelComparisonTable($$renderer, {
				costByModel: ga()?.costByModel ?? {},
				cacheEfficiencyByModel: ga()?.cacheEfficiencyByModel ?? {},
				modelSessionCount: ga()?.modelSessionCount ?? {},
				totalCost: ga()?.totalCost ?? 0
			});
			$$renderer.push(`<!----> `);
			SessionScatterPlot($$renderer, {
				data: scatterData(),
				onSessionClick: handleSessionClick
			});
			$$renderer.push(`<!---->`);
		}
		$$renderer.push(`<!--]--></div> <div class="dashboard-section grid-2col-sidebar svelte-dzwqab">`);
		if (isLoading() && !ga()) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="card">`);
			Skeleton($$renderer, {
				width: "100%",
				height: "200px"
			});
			$$renderer.push(`<!----></div> <div class="card">`);
			Skeleton($$renderer, {
				width: "100%",
				height: "200px"
			});
			$$renderer.push(`<!----></div>`);
		} else {
			$$renderer.push("<!--[-1-->");
			ProjectCostChart($$renderer, {
				data: ga()?.costByProject ?? {},
				onProjectClick: handleProjectClick
			});
			$$renderer.push(`<!----> `);
			ModelDistribution($$renderer, {
				data: modelData(),
				onModelClick: handleModelClick
			});
			$$renderer.push(`<!---->`);
		}
		$$renderer.push(`<!--]--></div> <div class="dashboard-section grid-3col svelte-dzwqab">`);
		if (isLoading() && !ga()) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="card">`);
			Skeleton($$renderer, {
				width: "100%",
				height: "200px"
			});
			$$renderer.push(`<!----></div> <div class="card">`);
			Skeleton($$renderer, {
				width: "100%",
				height: "200px"
			});
			$$renderer.push(`<!----></div> <div class="card">`);
			Skeleton($$renderer, {
				width: "100%",
				height: "200px"
			});
			$$renderer.push(`<!----></div>`);
		} else {
			$$renderer.push("<!--[-1-->");
			ToolUsage($$renderer, {
				data: ga()?.toolUsage ?? [],
				onToolClick: handleToolClick
			});
			$$renderer.push(`<!----> `);
			TopFiles($$renderer, { data: fileData() });
			$$renderer.push(`<!----> `);
			DurationDistribution($$renderer, {
				data: durationData(),
				onBucketClick: handleBucketClick
			});
			$$renderer.push(`<!---->`);
		}
		$$renderer.push(`<!--]--></div> <div class="dashboard-section grid-2col svelte-dzwqab">`);
		if (isLoading() && !ga()) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="card">`);
			Skeleton($$renderer, {
				width: "100%",
				height: "200px"
			});
			$$renderer.push(`<!----></div> <div class="card">`);
			Skeleton($$renderer, {
				width: "100%",
				height: "200px"
			});
			$$renderer.push(`<!----></div>`);
		} else {
			$$renderer.push("<!--[-1-->");
			CacheEfficiency($$renderer, {
				hitRate: ga()?.cacheEfficiency ?? 0,
				tokens: cacheTokens(),
				savings: cacheSavingsEstimate(),
				dailyEfficiency: ga()?.dailyCacheEfficiency,
				cacheSavings: cacheSavingsData()
			});
			$$renderer.push(`<!----> `);
			HourlyHeatmap($$renderer, { data: ga()?.hourlyActivity ?? {} });
			$$renderer.push(`<!---->`);
		}
		$$renderer.push(`<!--]--></div> <div class="dashboard-section grid-2col svelte-dzwqab">`);
		if (isLoading() && !ga()) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="card">`);
			Skeleton($$renderer, {
				width: "100%",
				height: "220px"
			});
			$$renderer.push(`<!----></div> <div class="card">`);
			Skeleton($$renderer, {
				width: "100%",
				height: "220px"
			});
			$$renderer.push(`<!----></div>`);
		} else {
			$$renderer.push("<!--[-1-->");
			DurationTrendChart($$renderer, {
				data: ga()?.dailyAvgDuration ?? {},
				onDateClick: handleDateClick
			});
			$$renderer.push(`<!----> `);
			RecentActivity($$renderer, { data: activityData() });
			$$renderer.push(`<!---->`);
		}
		$$renderer.push(`<!--]--></div>`);
	});
}
//#endregion
export { _page as default };
