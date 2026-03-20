<script lang="ts">
import { scaleLinear } from "d3-scale";
import { ScatterChart, Tooltip } from "layerchart";
import { formatCost } from "$lib/utils/format.js";
import { formatModelName } from "$lib/utils/pricing.js";

let {
	data = [],
	onSessionClick,
}: {
	data?: {
		sessionId: string;
		slug?: string;
		project: string;
		model: string;
		cost: number;
		durationMin: number;
		filesEdited: number;
		cacheHitRate: number;
	}[];
	onSessionClick?: (sessionId: string) => void;
} = $props();

const MODEL_COLORS: Record<string, string> = {
	"claude-sonnet-4-20250514": "var(--blue)",
	"claude-opus-4-6": "var(--purple)",
	"claude-haiku-3.5": "var(--cyan)",
	"claude-3-5-sonnet-20241022": "var(--green)",
	"claude-sonnet-4-5-20250929": "var(--amber)",
};

interface ScatterPoint {
	sessionId: string;
	slug?: string;
	project: string;
	model: string;
	cost: number;
	durationMin: number;
	filesEdited: number;
	cacheHitRate: number;
	color: string;
}

const chartData: ScatterPoint[] = $derived(
	data.map((d) => ({
		...d,
		color: MODEL_COLORS[d.model] ?? "var(--text-dim)",
	})),
);

const medianDuration = $derived.by(() => {
	if (chartData.length === 0) return 0;
	const sorted = [...chartData].sort((a, b) => a.durationMin - b.durationMin);
	const mid = Math.floor(sorted.length / 2);
	return sorted.length % 2 !== 0
		? sorted[mid].durationMin
		: (sorted[mid - 1].durationMin + sorted[mid].durationMin) / 2;
});

const medianCost = $derived.by(() => {
	if (chartData.length === 0) return 0;
	const sorted = [...chartData].sort((a, b) => a.cost - b.cost);
	const mid = Math.floor(sorted.length / 2);
	return sorted.length % 2 !== 0
		? sorted[mid].cost
		: (sorted[mid - 1].cost + sorted[mid].cost) / 2;
});
</script>

<div class="card">
	<div class="card-header">
		<span class="card-title">Session Cost vs Duration</span>
	</div>
	<div class="scatter-body">
		{#if chartData.length > 0}
			<div class="scatter-chart-wrap">
				<ScatterChart
					data={chartData}
					x="durationMin"
					y="cost"
					xScale={scaleLinear()}
					axis={{
						tickLabelProps: {
							fill: "var(--text-secondary)",
							style: "font-family: var(--font-mono); font-size: 11px;",
						},
					}}
					grid={{ x: true, y: true }}
					rule={false}
					highlight={{ points: { r: 6 }, lines: false, axis: "both" }}
					onTooltipClick={(e, detail) => {
						if (onSessionClick && detail?.data?.sessionId) {
							onSessionClick(detail.data.sessionId);
						}
					}}
					props={{
						points: {
							r: 4,
							class: "scatter-point",
						},
						xAxis: {
							label: "Duration (min)",
							labelProps: {
								fill: "var(--text-dim)",
								style: "font-size: 11px;",
							},
						},
						yAxis: {
							label: "Cost ($)",
							labelProps: {
								fill: "var(--text-dim)",
								style: "font-size: 11px;",
							},
						},
					}}
				>
					{#snippet tooltip({ context })}
						<Tooltip.Root {context} variant="none">
							{#snippet children({ data })}
								<div class="chart-tooltip">
									<div class="chart-tooltip-label">
										{data.slug ?? data.sessionId.slice(0, 8)}
									</div>
									<div class="chart-tooltip-row">
										<span>Model</span>
										<span class="chart-tooltip-value">{formatModelName(data.model)}</span>
									</div>
									<div class="chart-tooltip-row">
										<span>Cost</span>
										<span class="chart-tooltip-value">{formatCost(data.cost)}</span>
									</div>
									<div class="chart-tooltip-row">
										<span>Duration</span>
										<span class="chart-tooltip-value">{data.durationMin.toFixed(1)}m</span>
									</div>
									<div class="chart-tooltip-row">
										<span>Files edited</span>
										<span class="chart-tooltip-value">{data.filesEdited}</span>
									</div>
									<div class="chart-tooltip-row">
										<span>Cache hit</span>
										<span class="chart-tooltip-value">{(data.cacheHitRate * 100).toFixed(1)}%</span>
									</div>
								</div>
							{/snippet}
						</Tooltip.Root>
					{/snippet}
				</ScatterChart>

				<!-- Quadrant labels -->
				<div class="quadrant-label top-left">Quick &amp; Expensive</div>
				<div class="quadrant-label top-right">Long &amp; Expensive</div>
				<div class="quadrant-label bottom-left">Quick &amp; Cheap</div>
				<div class="quadrant-label bottom-right">Long &amp; Cheap</div>
			</div>
		{:else}
			<div class="empty">No session data available</div>
		{/if}
	</div>
</div>

<style>
	.scatter-body {
		padding: 4px 0;
	}
	.scatter-chart-wrap {
		position: relative;
		height: 320px;
	}
	.quadrant-label {
		position: absolute;
		font-size: 10px;
		color: var(--text-dim);
		opacity: 0.5;
		pointer-events: none;
		font-style: italic;
	}
	.top-left {
		top: 12px;
		left: 56px;
	}
	.top-right {
		top: 12px;
		right: 12px;
	}
	.bottom-left {
		bottom: 32px;
		left: 56px;
	}
	.bottom-right {
		bottom: 32px;
		right: 12px;
	}
	:global(.scatter-point) {
		cursor: pointer;
		opacity: 0.75;
		transition: opacity 0.15s;
	}
	:global(.scatter-point:hover) {
		opacity: 1;
	}
	.empty {
		font-size: 13px;
		color: var(--text-dim);
		text-align: center;
		padding: 20px;
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
