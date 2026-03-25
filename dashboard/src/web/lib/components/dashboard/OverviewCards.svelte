<script lang="ts">
import Skeleton from "$lib/components/shared/Skeleton.svelte";
import { formatCost, formatTokens } from "$lib/utils/format.js";

let {
	totalSessions = 0,
	totalTokens = 0,
	totalCost = 0,
	cacheEfficiency = 0,
	avgCostPerSession = undefined,
	cacheSavingsAmount = undefined,
	sparklineData = [] as number[][],
	weekOverWeek = undefined,
	loading = false,
}: {
	totalSessions: number;
	totalTokens: number;
	totalCost: number;
	cacheEfficiency: number;
	avgCostPerSession?: number;
	cacheSavingsAmount?: number;
	sparklineData?: number[][];
	weekOverWeek?: {
		sessions: number;
		tokens: number;
		cost: number;
		cacheEfficiency: number;
	};
	loading?: boolean;
} = $props();

const cards = $derived([
	{
		label: "Total Tokens",
		value: formatTokens(totalTokens),
		delta: weekOverWeek?.tokens,
	},
	{
		label: "Total Cost",
		value: formatCost(totalCost),
		delta: weekOverWeek?.cost,
	},
	{
		label: "Avg Cost/Session",
		value: formatCost(
			avgCostPerSession ?? (totalSessions > 0 ? totalCost / totalSessions : 0),
		),
		delta: weekOverWeek?.tokens,
	},
	{
		label: "Cache Savings",
		value:
			cacheSavingsAmount != null
				? formatCost(cacheSavingsAmount)
				: formatCost(0),
		delta: weekOverWeek?.cacheEfficiency,
	},
]);

function formatDelta(d: number | undefined): { text: string; cls: string } {
	if (d === undefined || d === null) return { text: "—", cls: "neutral" };
	if (d === 0) return { text: "—", cls: "neutral" };
	const pct = (Math.abs(d) * 100).toFixed(1);
	if (d > 0) return { text: `↑ ${pct}%`, cls: "positive" };
	return { text: `↓ ${pct}%`, cls: "negative" };
}

function sparklinePath(data: number[]): string {
	if (!data.length) return "";
	const max = Math.max(...data, 1);
	const w = 120;
	const h = 40;
	const step = w / Math.max(data.length - 1, 1);
	return data
		.map((v, i) => {
			const x = i * step;
			const y = h - (v / max) * h * 0.8;
			return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
		})
		.join(" ");
}

function sparklineAreaPath(data: number[]): string {
	if (!data.length) return "";
	const line = sparklinePath(data);
	const w = 120;
	const h = 40;
	const step = w / Math.max(data.length - 1, 1);
	const lastX = (data.length - 1) * step;
	return `${line} L${lastX.toFixed(1)},${h} L0,${h} Z`;
}
</script>

<div class="kpi-row">
	{#each cards as card, i}
		<div class="kpi-card">
			{#if loading}
				<Skeleton width="80px" height="14px" />
				<div style="margin-top:12px">
					<Skeleton width="120px" height="32px" />
				</div>
			{:else}
				<div class="kpi-label">{card.label}</div>
				<div class="kpi-value">{card.value}</div>
				{@const delta = formatDelta(card.delta)}
				<div class="kpi-trend {delta.cls}">{delta.text}</div>
				{#if sparklineData[i]?.length}
					<svg class="kpi-sparkline" viewBox="0 0 120 40" preserveAspectRatio="none">
						<path d={sparklineAreaPath(sparklineData[i])} fill="var(--accent)" opacity="0.15" />
						<path d={sparklinePath(sparklineData[i])} fill="none" stroke="var(--accent)" stroke-width="1.5" />
					</svg>
				{/if}
			{/if}
		</div>
	{/each}
</div>

<style>
	.kpi-card {
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		padding: 20px;
		position: relative;
		overflow: hidden;
		transition: border-color var(--transition);
	}
	.kpi-card:hover {
		border-color: var(--border-hover);
	}
	.kpi-label {
		font-size: 12px;
		font-weight: 500;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 8px;
	}
	.kpi-value {
		font-size: 28px;
		font-weight: 700;
		font-family: var(--font-mono);
		color: var(--text-primary);
	}
	.kpi-trend {
		font-family: var(--font-mono);
		font-size: 11px;
		font-weight: 500;
		margin-top: 4px;
	}
	.kpi-trend.positive {
		color: var(--green);
	}
	.kpi-trend.negative {
		color: var(--red);
	}
	.kpi-trend.neutral {
		color: var(--text-dim);
	}
	.kpi-sparkline {
		position: absolute;
		bottom: 0;
		right: 0;
		width: 120px;
		height: 40px;
		opacity: 0.5;
	}
</style>
