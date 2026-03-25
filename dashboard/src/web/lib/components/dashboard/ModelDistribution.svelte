<script lang="ts">
import { scaleBand, scaleLinear } from "d3-scale";
import { BarChart, Tooltip } from "layerchart";
import { formatModelName } from "$lib/utils/pricing.js";

let {
	data = [] as { model: string; percentage: number; color: string }[],
	onModelClick,
}: {
	data: { model: string; percentage: number; color: string }[];
	onModelClick?: (model: string) => void;
} = $props();

const MODEL_COLORS: Record<string, string> = {
	"claude-sonnet-4-20250514": "var(--blue)",
	"claude-opus-4-6": "var(--purple)",
	"claude-haiku-3.5": "var(--cyan)",
	"claude-3-5-sonnet-20241022": "var(--green)",
};

interface ChartItem {
	label: string;
	model: string;
	value: number;
	color: string;
}

const chartData: ChartItem[] = $derived(
	data.map((item) => ({
		label: formatModelName(item.model),
		model: item.model,
		value: item.percentage * 100,
		color: MODEL_COLORS[item.model] ?? item.color,
	})),
);

const chartHeight = $derived(Math.max(140, chartData.length * 36));
</script>

<div class="card">
	<div class="card-header">
		<span class="card-title">Model Distribution</span>
	</div>
	<div class="chart-body" style="height:{chartHeight}px">
		{#if chartData.length > 0}
			<BarChart
				data={chartData}
				x="value"
				y="label"
				orientation="horizontal"
				xScale={scaleLinear()}
				yScale={scaleBand().padding(0.35)}
				bandPadding={0.35}
				padding={{ left: 100, top: 8, right: 16, bottom: 24 }}
				grid={false}
				axis={{ tickLabelProps: { fill: 'var(--text-secondary)', style: 'font-family: var(--font-mono); font-size: 12px;' } }}
				rule={false}
				highlight={false}
				props={{
					bars: {
						radius: 4,
						rounded: 'edge',
						class: 'model-bar',
					},
				}}
				onBarClick={(e, detail) => {
					if (onModelClick && detail.data?.model) {
						onModelClick(detail.data.model);
					}
				}}
			>
				{#snippet tooltip({ context })}
					<Tooltip.Root {context}>
						{#snippet children({ data })}
							<div class="chart-tooltip">
								<div class="chart-tooltip-label">{data.label}</div>
								<div class="chart-tooltip-row">
									<span>Usage</span>
									<span class="chart-tooltip-value">{data.value.toFixed(1)}%</span>
								</div>
							</div>
						{/snippet}
					</Tooltip.Root>
				{/snippet}
			</BarChart>
		{:else}
			<div class="empty">No model data available</div>
		{/if}
	</div>
</div>

<style>
	.chart-body {
		padding: 4px 0;
	}
	.empty {
		font-size: 13px;
		color: var(--text-dim);
		text-align: center;
		padding: 20px;
	}
	:global(.model-bar) {
		cursor: pointer;
	}
	:global(.model-bar:hover) {
		opacity: 0.9 !important;
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
