<script lang="ts">
import { PieChart, Tooltip } from "layerchart";
import { formatCost } from "$lib/utils/format.js";

let {
	data = {} as Record<string, number>,
	onProjectClick,
}: {
	data: Record<string, number>;
	onProjectClick?: (projectId: string) => void;
} = $props();

const COLORS = [
	"var(--blue)",
	"var(--purple)",
	"var(--cyan)",
	"var(--green)",
	"var(--amber)",
	"var(--accent)",
];

interface Segment {
	key: string;
	label: string;
	value: number;
	color: string;
	percentage: number;
}

const segments: Segment[] = $derived.by(() => {
	let entries = Object.entries(data)
		.map(([name, cost]) => ({ name, cost }))
		.sort((a, b) => b.cost - a.cost);
	if (entries.length === 0) return [];

	if (entries.length >= 6) {
		const top = entries.slice(0, 5);
		const rest = entries.slice(5);
		const otherCost = rest.reduce((s, e) => s + e.cost, 0);
		entries = [...top, { name: "Other", cost: otherCost }];
	}

	const total = entries.reduce((s, e) => s + e.cost, 0);
	if (total === 0) return [];

	return entries.map((e, i) => ({
		key: e.name,
		label: e.name,
		value: e.cost,
		color: COLORS[i % COLORS.length],
		percentage: (e.cost / total) * 100,
	}));
});

const totalCost = $derived(segments.reduce((s, seg) => s + seg.value, 0));
</script>

<div class="card">
	<div class="card-header">
		<span class="card-title">Cost by Project</span>
	</div>
	<div class="donut-layout">
		<div class="donut-chart-wrap">
			{#if segments.length > 0}
				<PieChart
					data={segments}
					key="key"
					label="label"
					value="value"
					c="color"
					cRange={segments.map((s) => s.color)}
					innerRadius={0.65}
					padAngle={0.02}
					onArcClick={(e, detail) => {
						if (onProjectClick && detail.data?.key) {
							onProjectClick(detail.data.key);
						}
					}}
					>
					{#snippet tooltip({ context })}
						<Tooltip.Root {context}>
							{#snippet children({ data })}
								<div class="chart-tooltip">
									<div class="chart-tooltip-label">{data.label}</div>
									<div class="chart-tooltip-row">
										<span>Cost</span>
										<span class="chart-tooltip-value">{formatCost(data.value)}</span>
									</div>
									<div class="chart-tooltip-row">
										<span>Share</span>
										<span class="chart-tooltip-value">{data.percentage.toFixed(1)}%</span>
									</div>
								</div>
							{/snippet}
						</Tooltip.Root>
					{/snippet}
				</PieChart>
			{/if}
			<div class="donut-center">
				<div class="donut-center-amount">{formatCost(totalCost)}</div>
				<div class="donut-center-label">total</div>
			</div>
		</div>
		<div class="donut-legend">
			{#each segments as seg}
				<button
					class="donut-legend-item"
					onclick={() => onProjectClick?.(seg.key)}
					type="button"
				>
					<span class="donut-legend-swatch" style="background:{seg.color}"></span>
					<span class="donut-legend-name" title={seg.label}>{seg.label}</span>
					<span class="donut-legend-cost">{formatCost(seg.value)}</span>
					<span class="donut-legend-pct">{seg.percentage.toFixed(0)}%</span>
				</button>
			{/each}
		</div>
	</div>
</div>

<style>
	.donut-layout {
		display: flex;
		align-items: center;
		gap: 24px;
		padding: 8px 0;
	}
	.donut-chart-wrap {
		position: relative;
		width: 160px;
		height: 160px;
		flex-shrink: 0;
	}
	.donut-center {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		text-align: center;
		pointer-events: none;
	}
	.donut-center-amount {
		font-family: var(--font-mono);
		font-size: 16px;
		font-weight: 700;
		color: var(--text-primary);
	}
	.donut-center-label {
		font-size: 10px;
		color: var(--text-dim);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.donut-legend {
		display: flex;
		flex-direction: column;
		gap: 6px;
		flex: 1;
		min-width: 0;
	}
	.donut-legend-item {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 11.5px;
		color: var(--text-secondary);
		background: none;
		border: none;
		padding: 2px 0;
		cursor: pointer;
		text-align: left;
		width: 100%;
		border-radius: 4px;
		transition: background 0.15s ease;
	}
	.donut-legend-item:hover {
		background: rgba(255, 255, 255, 0.04);
	}
	.donut-legend-swatch {
		width: 10px;
		height: 10px;
		border-radius: 2px;
		flex-shrink: 0;
	}
	.donut-legend-name {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.donut-legend-cost {
		font-family: var(--font-mono);
		font-weight: 600;
		color: var(--text-primary);
		font-size: 11px;
	}
	.donut-legend-pct {
		font-family: var(--font-mono);
		font-size: 10px;
		color: var(--text-dim);
		min-width: 28px;
		text-align: right;
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
