<script lang="ts">
import { scaleLinear, scaleTime } from "d3-scale";
import {
	AnnotationLine,
	Area,
	Axis,
	Chart,
	Grid,
	Highlight,
	Html,
	Rule,
	Spline,
	Svg,
	Tooltip,
} from "layerchart";
import { formatCost, formatDate } from "$lib/utils/format.js";
import { formatModelName } from "$lib/utils/pricing.js";

let {
	data = [] as { date: string; cost: number }[],
	costByDayByModel = undefined as
		| Record<string, Record<string, number>>
		| undefined,
	modelFirstSeen = undefined as Record<string, string> | undefined,
	hoverDate = undefined as string | null | undefined,
	onHoverDateChange = undefined as ((date: string | null) => void) | undefined,
	onDateClick = undefined as ((date: string) => void) | undefined,
}: {
	data: { date: string; cost: number }[];
	costByDayByModel?: Record<string, Record<string, number>>;
	modelFirstSeen?: Record<string, string>;
	hoverDate?: string | null;
	onHoverDateChange?: (date: string | null) => void;
	onDateClick?: (date: string) => void;
} = $props();

let mode = $state<"daily" | "weekly">("daily");

const MODEL_COLORS: Record<string, string> = {
	"claude-sonnet-4-20250514": "var(--blue)",
	"claude-opus-4-6": "var(--purple)",
	"claude-haiku-3.5": "var(--cyan)",
	"claude-3-5-sonnet-20241022": "var(--green)",
	"claude-sonnet-4-5-20250929": "var(--amber)",
};

const FALLBACK_COLORS = [
	"var(--accent)",
	"var(--blue)",
	"var(--purple)",
	"var(--cyan)",
	"var(--green)",
	"var(--amber)",
];

// Determine if we should render stacked by model
const hasModelData = $derived(
	costByDayByModel && Object.keys(costByDayByModel).length > 0,
);

// Discover all models across all days
const allModels = $derived.by((): string[] => {
	if (!costByDayByModel) return [];
	const models = new Set<string>();
	for (const dayModels of Object.values(costByDayByModel)) {
		for (const m of Object.keys(dayModels)) models.add(m);
	}
	return [...models].sort();
});

// Build flattened chart data with stacked y0/y1 per model
type StackedRow = {
	date: Date;
	dateStr: string;
	total: number;
	models: Record<string, { y0: number; y1: number; cost: number }>;
};

function aggregateByWeek<T extends { dateStr: string }>(
	rows: T[],
	getValue: (r: T) => Record<string, number>,
): Map<string, Record<string, number>> {
	const weekMap = new Map<string, Record<string, number>>();
	for (const r of rows) {
		const dt = new Date(r.dateStr);
		const ws = new Date(dt);
		ws.setDate(dt.getDate() - dt.getDay());
		const key = ws.toISOString().slice(0, 10);
		const existing = weekMap.get(key) ?? {};
		const vals = getValue(r);
		for (const [k, v] of Object.entries(vals)) {
			existing[k] = (existing[k] ?? 0) + v;
		}
		weekMap.set(key, existing);
	}
	return weekMap;
}

const stackedData = $derived.by((): StackedRow[] => {
	if (!hasModelData || !costByDayByModel) {
		// Fallback: single series
		const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
		let dailyRows = sorted.map((d) => ({
			dateStr: d.date,
			cost: d.cost,
		}));
		if (mode === "weekly") {
			const weekMap = new Map<string, number>();
			for (const d of dailyRows) {
				const dt = new Date(d.dateStr);
				const ws = new Date(dt);
				ws.setDate(dt.getDate() - dt.getDay());
				const key = ws.toISOString().slice(0, 10);
				weekMap.set(key, (weekMap.get(key) ?? 0) + d.cost);
			}
			dailyRows = [...weekMap.entries()]
				.sort((a, b) => a[0].localeCompare(b[0]))
				.map(([dateStr, cost]) => ({ dateStr, cost }));
		}
		return dailyRows.map((d) => ({
			date: new Date(d.dateStr),
			dateStr: d.dateStr,
			total: d.cost,
			models: { _total: { y0: 0, y1: d.cost, cost: d.cost } },
		}));
	}

	// Build daily data first
	const allDates = Object.keys(costByDayByModel).sort();
	let dateModelMap: Map<string, Record<string, number>>;
	if (mode === "weekly") {
		const dailyRows = allDates.map((d) => ({
			dateStr: d,
			vals: costByDayByModel![d],
		}));
		const weekAgg = aggregateByWeek(dailyRows, (r) => r.vals);
		dateModelMap = new Map(
			[...weekAgg.entries()].sort((a, b) => a[0].localeCompare(b[0])),
		);
	} else {
		dateModelMap = new Map(allDates.map((d) => [d, costByDayByModel![d]]));
	}

	const rows: StackedRow[] = [];
	for (const [dateStr, modelCosts] of dateModelMap) {
		let cumulative = 0;
		const models: Record<string, { y0: number; y1: number; cost: number }> = {};
		for (const model of allModels) {
			const cost = modelCosts[model] ?? 0;
			models[model] = { y0: cumulative, y1: cumulative + cost, cost };
			cumulative += cost;
		}
		rows.push({
			date: new Date(dateStr),
			dateStr,
			total: cumulative,
			models,
		});
	}
	return rows;
});

// For each model, build a flat array suitable for Area rendering
const modelSeries = $derived.by(() => {
	if (!hasModelData) {
		return [
			{
				model: "_total",
				color: "var(--accent)",
				label: "Total",
				data: stackedData.map((d) => ({
					date: d.date,
					dateStr: d.dateStr,
					y0: 0,
					y1: d.total,
					cost: d.total,
				})),
			},
		];
	}
	return allModels.map((model, i) => ({
		model,
		color: MODEL_COLORS[model] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
		label: formatModelName(model),
		data: stackedData.map((d) => ({
			date: d.date,
			dateStr: d.dateStr,
			y0: d.models[model]?.y0 ?? 0,
			y1: d.models[model]?.y1 ?? 0,
			cost: d.models[model]?.cost ?? 0,
		})),
	}));
});

const maxY = $derived(Math.max(...stackedData.map((d) => d.total), 0.01));

// Annotations for model first seen
const annotations = $derived.by(() => {
	if (!modelFirstSeen) return [];
	return Object.entries(modelFirstSeen)
		.filter(([_, dateStr]) => {
			const d = new Date(dateStr);
			return (
				stackedData.some((s) => s.date.getTime() <= d.getTime()) ||
				stackedData.some((s) => s.date.getTime() >= d.getTime())
			);
		})
		.map(([model, dateStr]) => ({
			model,
			date: new Date(dateStr),
			label: formatModelName(model),
			color: MODEL_COLORS[model] ?? "var(--text-dim)",
		}));
});

// External hover (shared crosshair)
const externalHoverX = $derived.by(() => {
	if (!hoverDate || stackedData.length === 0) return null;
	const d = new Date(hoverDate);
	return d;
});

function handleTooltipChange(data: any) {
	if (data && data.dateStr) {
		onHoverDateChange?.(data.dateStr);
	} else {
		onHoverDateChange?.(null);
	}
}
</script>

<div class="card">
	<div class="card-header">
		<span class="card-title">Cost Over Time</span>
		<div class="toggle-group">
			<button class="toggle-btn" class:active={mode === "daily"} onclick={() => (mode = "daily")}>Daily</button>
			<button class="toggle-btn" class:active={mode === "weekly"} onclick={() => (mode = "weekly")}>Weekly</button>
		</div>
	</div>
	<div class="cost-chart-area">
		{#if stackedData.length > 0}
			<Chart
				data={stackedData}
				x="date"
				y="total"
				yDomain={[0, maxY]}
				yNice
				xScale={scaleTime()}
				yScale={scaleLinear()}
				padding={{ top: 12, right: 16, bottom: 28, left: 48 }}
				tooltip={{ mode: "bisect-x" }}
			>
				<Svg>
					<Grid y yTicks={4} />
					<Axis placement="left" ticks={4} format={(v) => formatCost(v)} />
					<Axis placement="bottom" format={(v) => {
						const d = v instanceof Date ? v : new Date(v);
						return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`;
					}} />
					{#each modelSeries as series}
						<Area
							data={series.data}
							x="date"
							y0="y0"
							y1="y1"
							fill={series.color}
							fillOpacity={0.35}
							line={{ stroke: series.color, strokeWidth: 1.5, class: "cost-area-line" }}
						/>
					{/each}
					{#each annotations as ann}
						<AnnotationLine
							x={ann.date}
							label={ann.label}
							stroke={ann.color}
							strokeWidth={1}
							class="annotation-dashed"
						/>
					{/each}
					<Highlight
						axis="x"
						lines={{ stroke: "var(--text-dim)", strokeWidth: 1, class: "highlight-rule" }}
						points={{ r: 3, fill: "var(--accent)", stroke: "var(--bg-card)", strokeWidth: 2 }}
						onAreaClick={(e, detail) => {
							if (detail?.data?.dateStr) onDateClick?.(detail.data.dateStr);
						}}
					/>
					{#if externalHoverX}
						<Rule x={externalHoverX} stroke="var(--text-dim)" strokeWidth={1} class="external-hover-rule" />
					{/if}
				</Svg>
				<Html>
					<Tooltip.Root
						x="data"
						y="pointer"
						anchor="top-right"
						variant="none"
					>
						{#snippet children({ data })}
							<div class="chart-tooltip">
								<div class="chart-tooltip-label">{data ? formatDate(data.date) : ""}</div>
								{#if hasModelData && data}
									{#each allModels.filter((m) => (data.models[m]?.cost ?? 0) > 0) as model}
										<div class="chart-tooltip-row">
											<span class="tooltip-model-swatch" style="background:{MODEL_COLORS[model] ?? 'var(--text-dim)'}"></span>
											<span>{formatModelName(model)}</span>
											<span class="chart-tooltip-value">{formatCost(data.models[model]?.cost ?? 0)}</span>
										</div>
									{/each}
								{/if}
								<div class="chart-tooltip-row total-row">
									<span>Total</span>
									<span class="chart-tooltip-value">{data ? formatCost(data.total) : ""}</span>
								</div>
							</div>
						{/snippet}
					</Tooltip.Root>
				</Html>
			</Chart>
		{:else}
			<div class="empty">No cost data available</div>
		{/if}
	</div>
</div>

<style>
	.cost-chart-area {
		position: relative;
		height: 240px;
		margin-top: 8px;
	}
	.empty {
		font-size: 13px;
		color: var(--text-dim);
		text-align: center;
		padding: 40px 20px;
	}
	:global(.annotation-dashed line) {
		stroke-dasharray: 4 3;
	}
	:global(.highlight-rule) {
		stroke-dasharray: 2 2;
	}
	:global(.external-hover-rule line) {
		stroke-dasharray: 3 3;
		opacity: 0.5;
	}
	:global(.cost-area-line) {
		opacity: 0.8;
	}
	.tooltip-model-swatch {
		width: 8px;
		height: 8px;
		border-radius: 2px;
		display: inline-block;
		flex-shrink: 0;
	}
	.chart-tooltip {
		background: var(--bg-deep);
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 8px 10px;
		font-size: 12px;
		min-width: 140px;
	}
	.chart-tooltip-label {
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 4px;
	}
	.chart-tooltip-row {
		display: flex;
		align-items: center;
		gap: 6px;
		color: var(--text-secondary);
		line-height: 1.6;
	}
	.chart-tooltip-row.total-row {
		border-top: 1px solid var(--border-subtle);
		margin-top: 2px;
		padding-top: 2px;
		justify-content: space-between;
	}
	.chart-tooltip-value {
		font-family: var(--font-mono);
		font-weight: 600;
		color: var(--text-primary);
		margin-left: auto;
	}
	.toggle-group {
		display: flex;
		gap: 2px;
		background: var(--bg-deep);
		border-radius: var(--radius-sm);
		padding: 2px;
	}
	.toggle-btn {
		padding: 4px 12px;
		font-size: 11.5px;
		font-weight: 500;
		border: none;
		background: transparent;
		color: var(--text-muted);
		border-radius: 4px;
		cursor: pointer;
		font-family: var(--font-ui);
		transition: background var(--transition), color var(--transition);
	}
	.toggle-btn.active {
		background: var(--accent-dim);
		color: var(--accent);
	}
	.toggle-btn:hover:not(.active) {
		color: var(--text-secondary);
	}
</style>
