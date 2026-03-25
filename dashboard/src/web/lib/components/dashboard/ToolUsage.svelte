<script lang="ts">
import { scaleBand, scaleLinear } from "d3-scale";
import { BarChart, Tooltip } from "layerchart";

let {
	data = [] as { name: string; count: number }[],
	onToolClick,
}: {
	data: { name: string; count: number }[];
	onToolClick?: (toolName: string) => void;
} = $props();

interface ChartItem {
	label: string;
	value: number;
	percentage: number;
}

const totalCount = $derived(data.reduce((s, d) => s + d.count, 0));

const chartData: ChartItem[] = $derived(
	data
		.toSorted((a, b) => b.count - a.count)
		.slice(0, 10)
		.map((item) => ({
			label: item.name,
			value: item.count,
			percentage: totalCount > 0 ? (item.count / totalCount) * 100 : 0,
		})),
);

const chartHeight = $derived(Math.max(180, chartData.length * 28));
</script>

<div class="card">
	<div class="card-header">
		<span class="card-title">Tool Usage</span>
	</div>
	<div class="chart-body" style="height:{chartHeight}px">
		{#if chartData.length > 0}
			<BarChart
				data={chartData}
				x="value"
				y="label"
				orientation="horizontal"
				xScale={scaleLinear()}
				yScale={scaleBand().padding(0.3)}
				bandPadding={0.3}
				padding={{ left: 80, top: 8, right: 16, bottom: 24 }}
				grid={false}
				axis={{ tickLabelProps: { fill: 'var(--text-secondary)', style: 'font-family: var(--font-mono); font-size: 11px;' } }}
				rule={false}
				highlight={false}
				props={{
					bars: {
						radius: 4,
						rounded: 'edge',
						class: 'tool-bar',
					},
				}}
				onBarClick={(e, detail) => {
					if (onToolClick && detail.data?.label) {
						onToolClick(detail.data.label);
					}
				}}
			>
				{#snippet tooltip({ context })}
					<Tooltip.Root {context}>
						{#snippet children({ data })}
							<div class="chart-tooltip">
								<div class="chart-tooltip-label">{data.label}</div>
								<div class="chart-tooltip-row">
									<span>Count</span>
									<span class="chart-tooltip-value">{data.value.toLocaleString()}</span>
								</div>
								<div class="chart-tooltip-row">
									<span>Share</span>
									<span class="chart-tooltip-value">{data.percentage.toFixed(1)}%</span>
								</div>
							</div>
						{/snippet}
					</Tooltip.Root>
				{/snippet}
			</BarChart>
		{:else}
			<div class="empty">No tool usage data</div>
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
	:global(.tool-bar) {
		cursor: pointer;
		fill: var(--accent);
		opacity: 0.8;
	}
	:global(.tool-bar:hover) {
		opacity: 1 !important;
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
