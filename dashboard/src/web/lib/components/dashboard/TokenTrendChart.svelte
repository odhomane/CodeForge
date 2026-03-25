<script lang="ts">
import { scaleLinear, scaleTime } from "d3-scale";
import {
	Area,
	Axis,
	Chart,
	Grid,
	Highlight,
	Html,
	Rule,
	Svg,
	Tooltip,
} from "layerchart";
import { formatDate, formatTokens } from "$lib/utils/format.js";

let {
	data = {} as Record<
		string,
		{ input: number; output: number; cacheRead: number; cacheCreation: number }
	>,
	hoverDate = undefined as string | null | undefined,
	onHoverDateChange = undefined as ((date: string | null) => void) | undefined,
	onDateClick = undefined as ((date: string) => void) | undefined,
}: {
	data: Record<
		string,
		{ input: number; output: number; cacheRead: number; cacheCreation: number }
	>;
	hoverDate?: string | null;
	onHoverDateChange?: (date: string | null) => void;
	onDateClick?: (date: string) => void;
} = $props();

let mode = $state<"daily" | "weekly">("daily");

const layers = [
	{ key: "input" as const, label: "Input", color: "var(--blue)" },
	{ key: "output" as const, label: "Output", color: "var(--purple)" },
	{ key: "cacheRead" as const, label: "Cache Read", color: "var(--green)" },
	{
		key: "cacheCreation" as const,
		label: "Cache Create",
		color: "var(--amber)",
	},
];

type StackedRow = {
	date: Date;
	dateStr: string;
	input: number;
	output: number;
	cacheRead: number;
	cacheCreation: number;
	total: number;
	// Stacked y0/y1 per layer
	inputY0: number;
	inputY1: number;
	outputY0: number;
	outputY1: number;
	cacheReadY0: number;
	cacheReadY1: number;
	cacheCreationY0: number;
	cacheCreationY1: number;
};

const chartData = $derived.by((): StackedRow[] => {
	const sorted = Object.entries(data)
		.sort((a, b) => a[0].localeCompare(b[0]))
		.map(([date, v]) => ({ dateStr: date, ...v }));

	let rows: typeof sorted;
	if (mode === "weekly") {
		const weekMap = new Map<
			string,
			{
				dateStr: string;
				input: number;
				output: number;
				cacheRead: number;
				cacheCreation: number;
			}
		>();
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
				cacheCreation: 0,
			};
			existing.input += d.input;
			existing.output += d.output;
			existing.cacheRead += d.cacheRead;
			existing.cacheCreation += d.cacheCreation;
			weekMap.set(key, existing);
		}
		rows = [...weekMap.values()].sort((a, b) =>
			a.dateStr.localeCompare(b.dateStr),
		);
	} else {
		rows = sorted;
	}

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
			cacheCreationY1,
		};
	});
});

const maxTotal = $derived(Math.max(...chartData.map((d) => d.total), 1));

const layerDefs = $derived([
	{ key: "input", color: "var(--blue)", y0: "inputY0", y1: "inputY1" },
	{ key: "output", color: "var(--purple)", y0: "outputY0", y1: "outputY1" },
	{
		key: "cacheRead",
		color: "var(--green)",
		y0: "cacheReadY0",
		y1: "cacheReadY1",
	},
	{
		key: "cacheCreation",
		color: "var(--amber)",
		y0: "cacheCreationY0",
		y1: "cacheCreationY1",
	},
]);

const externalHoverX = $derived.by(() => {
	if (!hoverDate || chartData.length === 0) return null;
	return new Date(hoverDate);
});
</script>

<div class="card">
	<div class="card-header">
		<span class="card-title">Token Usage</span>
		<div class="toggle-group">
			<button class="toggle-btn" class:active={mode === "daily"} onclick={() => (mode = "daily")}>Daily</button>
			<button class="toggle-btn" class:active={mode === "weekly"} onclick={() => (mode = "weekly")}>Weekly</button>
		</div>
	</div>
	<div class="token-chart-area">
		{#if chartData.length > 0}
			<Chart
				data={chartData}
				x="date"
				y="total"
				yDomain={[0, maxTotal]}
				yNice
				xScale={scaleTime()}
				yScale={scaleLinear()}
				padding={{ top: 12, right: 16, bottom: 28, left: 52 }}
				tooltip={{ mode: "bisect-x" }}
			>
				<Svg>
					<Grid y yTicks={4} />
					<Axis placement="left" ticks={4} format={(v) => formatTokens(v)} />
					<Axis placement="bottom" format={(v) => {
						const d = v instanceof Date ? v : new Date(v);
						return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`;
					}} />
					{#each layerDefs as layer}
						<Area
							data={chartData}
							x="date"
							y0={layer.y0}
							y1={layer.y1}
							fill={layer.color}
							fillOpacity={0.35}
							line={{ stroke: layer.color, strokeWidth: 1, class: "token-area-line" }}
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
								{#if data}
									<div class="chart-tooltip-row">
										<span class="tooltip-swatch" style="background:var(--blue)"></span>
										<span>Input</span>
										<span class="chart-tooltip-value">{formatTokens(data.input)}</span>
									</div>
									<div class="chart-tooltip-row">
										<span class="tooltip-swatch" style="background:var(--purple)"></span>
										<span>Output</span>
										<span class="chart-tooltip-value">{formatTokens(data.output)}</span>
									</div>
									<div class="chart-tooltip-row">
										<span class="tooltip-swatch" style="background:var(--green)"></span>
										<span>Cache Read</span>
										<span class="chart-tooltip-value">{formatTokens(data.cacheRead)}</span>
									</div>
									<div class="chart-tooltip-row">
										<span class="tooltip-swatch" style="background:var(--amber)"></span>
										<span>Cache Create</span>
										<span class="chart-tooltip-value">{formatTokens(data.cacheCreation)}</span>
									</div>
									<div class="chart-tooltip-row total-row">
										<span>Total</span>
										<span class="chart-tooltip-value">{formatTokens(data.total)}</span>
									</div>
								{/if}
							</div>
						{/snippet}
					</Tooltip.Root>
				</Html>
			</Chart>
		{:else}
			<div class="empty">No token data available</div>
		{/if}
	</div>
	<div class="token-legend">
		{#each layers as l}
			<div class="token-legend-item">
				<span class="token-legend-swatch" style="background:{l.color}"></span>
				<span>{l.label}</span>
			</div>
		{/each}
	</div>
</div>

<style>
	.token-chart-area {
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
	:global(.highlight-rule) {
		stroke-dasharray: 2 2;
	}
	:global(.external-hover-rule line) {
		stroke-dasharray: 3 3;
		opacity: 0.5;
	}
	:global(.token-area-line) {
		opacity: 0.6;
	}
	.tooltip-swatch {
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
		min-width: 150px;
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
	.token-legend {
		display: flex;
		gap: 16px;
		justify-content: center;
		margin-top: 8px;
		font-size: 11px;
		color: var(--text-muted);
	}
	.token-legend-item {
		display: flex;
		align-items: center;
		gap: 5px;
	}
	.token-legend-swatch {
		width: 10px;
		height: 10px;
		border-radius: 2px;
		display: inline-block;
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
