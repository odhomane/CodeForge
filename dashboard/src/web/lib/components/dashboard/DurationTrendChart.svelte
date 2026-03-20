<script lang="ts">
import { scaleLinear, scaleTime } from "d3-scale";
import {
	Area,
	Axis,
	Chart,
	Grid,
	Highlight,
	Html,
	Points,
	Spline,
	Svg,
	Tooltip,
} from "layerchart";
import { formatDate, formatDuration } from "$lib/utils/format.js";

let {
	data = {} as Record<string, number>,
	onDateClick = undefined as ((date: string) => void) | undefined,
}: {
	data: Record<string, number>;
	onDateClick?: (date: string) => void;
} = $props();

type ChartRow = {
	date: Date;
	dateStr: string;
	ms: number;
};

const chartData = $derived.by((): ChartRow[] => {
	return Object.entries(data)
		.sort((a, b) => a[0].localeCompare(b[0]))
		.map(([dateStr, ms]) => ({
			date: new Date(dateStr),
			dateStr,
			ms,
		}));
});

const maxMs = $derived(Math.max(...chartData.map((d) => d.ms), 60_000));
</script>

<div class="card">
	<div class="card-header">
		<span class="card-title">Avg Session Duration</span>
		<span class="card-subtitle">Daily average</span>
	</div>
	<div class="duration-chart-area">
		{#if chartData.length > 0}
			<Chart
				data={chartData}
				x="date"
				y="ms"
				yDomain={[0, maxMs]}
				yNice
				xScale={scaleTime()}
				yScale={scaleLinear()}
				padding={{ top: 12, right: 16, bottom: 28, left: 52 }}
				tooltip={{ mode: "bisect-x" }}
			>
				<Svg>
					<Grid y yTicks={4} />
					<Axis placement="left" ticks={4} format={(v) => formatDuration(v)} />
					<Axis placement="bottom" format={(v) => {
						const d = v instanceof Date ? v : new Date(v);
						return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`;
					}} />
					<Area
						fill="var(--cyan)"
						fillOpacity={0.12}
						line={{ stroke: "var(--cyan)", strokeWidth: 2 }}
					/>
					<Highlight
						axis="x"
						lines={{ stroke: "var(--text-dim)", strokeWidth: 1, class: "highlight-rule" }}
						points={{ r: 4, fill: "var(--cyan)", stroke: "var(--bg-card)", strokeWidth: 2 }}
						onAreaClick={(e, detail) => {
							if (detail?.data?.dateStr) onDateClick?.(detail.data.dateStr);
						}}
					/>
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
										<span>Duration</span>
										<span class="chart-tooltip-value">{formatDuration(data.ms)}</span>
									</div>
								{/if}
							</div>
						{/snippet}
					</Tooltip.Root>
				</Html>
			</Chart>
		{:else}
			<div class="empty">No duration data available</div>
		{/if}
	</div>
</div>

<style>
	.duration-chart-area {
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
	.chart-tooltip {
		background: var(--bg-deep);
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 8px 10px;
		font-size: 12px;
		min-width: 120px;
	}
	.chart-tooltip-label {
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 4px;
	}
	.chart-tooltip-row {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		color: var(--text-secondary);
		line-height: 1.6;
	}
	.chart-tooltip-value {
		font-family: var(--font-mono);
		font-weight: 600;
		color: var(--text-primary);
	}
</style>
