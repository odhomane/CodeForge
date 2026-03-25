<script lang="ts">
import { formatCost, formatTokens } from "$lib/utils/format.js";

let {
	hitRate = 0,
	tokens = { cacheRead: 0, cacheCreation: 0, rawInput: 0 },
	savings = 0,
	dailyEfficiency = undefined,
	cacheSavings = undefined,
}: {
	hitRate: number;
	tokens: { cacheRead: number; cacheCreation: number; rawInput: number };
	savings: number;
	dailyEfficiency?: Record<string, number>;
	cacheSavings?: {
		uncachedCost: number;
		actualCost: number;
		savings: number;
		savingsPercent: number;
	};
} = $props();

const radius = 45;
const circumference = 2 * Math.PI * radius;
const dashOffset = $derived(circumference - hitRate * circumference);

const trendData = $derived.by(() => {
	if (!dailyEfficiency) return [];
	return Object.entries(dailyEfficiency)
		.sort((a, b) => a[0].localeCompare(b[0]))
		.map(([date, rate]) => ({ date, rate }));
});

const trendW = 280;
const trendH = 80;
const trendPad = { top: 8, right: 8, bottom: 16, left: 32 };
const trendInnerW = trendW - trendPad.left - trendPad.right;
const trendInnerH = trendH - trendPad.top - trendPad.bottom;

function trendX(i: number): number {
	if (trendData.length <= 1) return trendPad.left + trendInnerW / 2;
	return trendPad.left + (i / (trendData.length - 1)) * trendInnerW;
}

function trendY(rate: number): number {
	return trendPad.top + trendInnerH - rate * trendInnerH;
}

const trendLinePath = $derived(
	trendData
		.map(
			(d, i) =>
				`${i === 0 ? "M" : "L"}${trendX(i).toFixed(1)},${trendY(d.rate).toFixed(1)}`,
		)
		.join(" "),
);
</script>

<div class="card">
	<div class="card-header">
		<span class="card-title">Cache Efficiency</span>
	</div>
	<div class="cache-panel">
		<div class="cache-ring-wrap">
			<svg class="cache-ring-svg" viewBox="0 0 120 120">
				<circle cx="60" cy="60" r={radius} class="cache-ring-bg" />
				<circle
					cx="60"
					cy="60"
					r={radius}
					class="cache-ring-fill"
					stroke-dasharray={circumference}
					stroke-dashoffset={dashOffset}
				/>
			</svg>
			<div class="cache-ring-label">
				<div class="cache-ring-pct">{(hitRate * 100).toFixed(1)}%</div>
				<div class="cache-ring-sub">hit rate</div>
			</div>
		</div>

		<div class="cache-savings">
			{#if cacheSavings}
				<div class="cache-savings-headline">
					Cache saved you <span class="cache-savings-amount-lg">{formatCost(cacheSavings.savings)}</span>
					<span class="cache-savings-pct">({cacheSavings.savingsPercent.toFixed(0)}% savings)</span>
				</div>
				<div class="cache-savings-detail">
					Without caching: {formatCost(cacheSavings.uncachedCost)} &nbsp;|&nbsp; With caching: {formatCost(cacheSavings.actualCost)}
				</div>
			{:else}
				<div class="cache-savings-amount">{formatCost(savings)}</div>
				<div class="cache-savings-label">Estimated savings</div>
			{/if}
		</div>

		<div class="cache-breakdown">
			<div class="cache-breakdown-item">
				<span class="cache-breakdown-val">{formatTokens(tokens.cacheRead)}</span>
				<span class="cache-breakdown-label">Cache Read</span>
			</div>
			<div class="cache-breakdown-item">
				<span class="cache-breakdown-val">{formatTokens(tokens.cacheCreation)}</span>
				<span class="cache-breakdown-label">Cache Create</span>
			</div>
			<div class="cache-breakdown-item">
				<span class="cache-breakdown-val">{formatTokens(tokens.rawInput)}</span>
				<span class="cache-breakdown-label">Raw Input</span>
			</div>
		</div>

		{#if trendData.length > 1}
			<div class="cache-trend">
				<div class="cache-trend-label">30-Day Trend</div>
				<svg class="cache-trend-svg" viewBox="0 0 {trendW} {trendH}" preserveAspectRatio="xMidYMid meet">
					<!-- 0% and 100% reference lines -->
					<line x1={trendPad.left} y1={trendY(0)} x2={trendW - trendPad.right} y2={trendY(0)} class="trend-grid" />
					<line x1={trendPad.left} y1={trendY(1)} x2={trendW - trendPad.right} y2={trendY(1)} class="trend-grid" />
					<text x={trendPad.left - 4} y={trendY(0) + 3} text-anchor="end" class="trend-axis-label">0%</text>
					<text x={trendPad.left - 4} y={trendY(1) + 3} text-anchor="end" class="trend-axis-label">100%</text>
					<path d={trendLinePath} fill="none" stroke="var(--green)" stroke-width="1.5" />
				</svg>
			</div>
		{/if}
	</div>
</div>

<style>
	.cache-panel {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
	}
	.cache-ring-wrap {
		position: relative;
		width: 120px;
		height: 120px;
	}
	.cache-ring-svg {
		width: 120px;
		height: 120px;
		transform: rotate(-90deg);
	}
	.cache-ring-bg {
		fill: none;
		stroke: rgba(255, 255, 255, 0.06);
		stroke-width: 10;
	}
	.cache-ring-fill {
		fill: none;
		stroke: var(--accent);
		stroke-width: 10;
		stroke-linecap: round;
		transition: stroke-dashoffset 1s ease;
	}
	.cache-ring-label {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		text-align: center;
	}
	.cache-ring-pct {
		font-family: var(--font-mono);
		font-size: 24px;
		font-weight: 700;
		color: var(--accent);
	}
	.cache-ring-sub {
		font-size: 10px;
		color: var(--text-dim);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.cache-savings {
		text-align: center;
	}
	.cache-savings-headline {
		font-size: 13px;
		color: var(--text-secondary);
		line-height: 1.5;
	}
	.cache-savings-amount-lg {
		font-family: var(--font-mono);
		font-size: 20px;
		font-weight: 700;
		color: var(--green);
	}
	.cache-savings-pct {
		font-family: var(--font-mono);
		font-size: 13px;
		font-weight: 600;
		color: var(--green);
	}
	.cache-savings-detail {
		font-size: 11px;
		color: var(--text-dim);
		margin-top: 4px;
		font-family: var(--font-mono);
	}
	.cache-savings-amount {
		font-family: var(--font-mono);
		font-size: 14px;
		font-weight: 600;
		color: var(--green);
	}
	.cache-savings-label {
		font-size: 11px;
		color: var(--text-dim);
	}
	.cache-breakdown {
		display: flex;
		gap: 16px;
		font-size: 11px;
		color: var(--text-muted);
		font-family: var(--font-mono);
		text-align: center;
	}
	.cache-breakdown-item {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.cache-breakdown-val {
		font-weight: 600;
		color: var(--text-secondary);
		font-size: 12px;
	}
	.cache-breakdown-label {
		font-size: 9.5px;
		color: var(--text-dim);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}
	.cache-trend {
		width: 100%;
		margin-top: 4px;
		padding-top: 12px;
		border-top: 1px solid var(--border-subtle);
	}
	.cache-trend-label {
		font-size: 10px;
		color: var(--text-dim);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		margin-bottom: 4px;
		text-align: center;
	}
	.cache-trend-svg {
		width: 100%;
		height: 80px;
	}
	:global(.trend-grid) {
		stroke: var(--border-subtle);
		stroke-width: 0.5;
		stroke-dasharray: 3 3;
	}
	:global(.trend-axis-label) {
		fill: var(--text-dim);
		font-family: var(--font-mono);
		font-size: 8px;
	}
</style>
