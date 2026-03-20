<script lang="ts">
import { scaleBand, scaleLinear } from "d3-scale";
import { BarChart, Tooltip } from "layerchart";

let {
	data = [] as { label: string; count: number }[],
	onBucketClick,
}: {
	data: { label: string; count: number }[];
	onBucketClick?: (bucket: string) => void;
} = $props();

interface ChartItem {
	label: string;
	value: number;
	percentage: number;
}

const totalCount = $derived(data.reduce((s, d) => s + d.count, 0));

const chartData: ChartItem[] = $derived(
	data.map((item) => ({
		label: item.label,
		value: item.count,
		percentage: totalCount > 0 ? (item.count / totalCount) * 100 : 0,
	})),
);
</script>

<div class="card">
	<div class="card-header">
		<span class="card-title">Session Duration</span>
	</div>
	<div class="chart-body">
		{#if chartData.length > 0}
			<BarChart
				data={chartData}
				x="value"
				y="label"
				orientation="horizontal"
				xScale={scaleLinear()}
				yScale={scaleBand().padding(0.3)}
				bandPadding={0.3}
				grid={false}
				axis={{ tickLabelProps: { fill: 'var(--text-dim)', style: 'font-family: var(--font-mono); font-size: 11px;' } }}
				rule={false}
				highlight={false}
				props={{
					bars: {
						radius: 3,
						rounded: 'edge',
						class: 'duration-bar',
					},
				}}
				onBarClick={(e, detail) => {
					if (onBucketClick && detail.data?.label) {
						onBucketClick(detail.data.label);
					}
				}}
			>
				{#snippet tooltip({ context })}
					<Tooltip.Root {context}>
						{#snippet children({ data })}
							<div class="chart-tooltip">
								<div class="chart-tooltip-label">{data.label}</div>
								<div class="chart-tooltip-row">
									<span>Sessions</span>
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
			<div class="empty">No duration data</div>
		{/if}
	</div>
</div>

<style>
	.chart-body {
		height: 200px;
		padding: 4px 0;
	}
	.empty {
		font-size: 13px;
		color: var(--text-dim);
		text-align: center;
		padding: 20px;
	}
	:global(.duration-bar) {
		cursor: pointer;
		fill: var(--purple);
		opacity: 0.7;
	}
	:global(.duration-bar:hover) {
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
