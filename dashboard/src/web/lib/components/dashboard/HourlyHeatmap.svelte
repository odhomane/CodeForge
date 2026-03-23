<script lang="ts">
import { formatTokens } from "$lib/utils/format.js";

let {
	data = {} as Record<string, number>,
}: {
	data: Record<string, number>;
} = $props();

let tooltip = $state({ visible: false, text: "", x: 0, y: 0 });

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_FULL = [
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
	"Sunday",
];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_LABELS = [0, 3, 6, 9, 12, 15, 18, 21];

const maxCount = $derived(Math.max(...Object.values(data), 1));

function level(count: number): string {
	if (count === 0) return "";
	const ratio = count / maxCount;
	if (ratio > 0.75) return "l4";
	if (ratio > 0.5) return "l3";
	if (ratio > 0.25) return "l2";
	return "l1";
}

function showTooltip(e: MouseEvent, day: string, hour: number) {
	const key = `${day}-${String(hour).padStart(2, "0")}`;
	const count = data[key] ?? 0;
	const dayFull = DAY_FULL[DAYS.indexOf(day)];
	tooltip = {
		visible: true,
		text: `${dayFull} ${String(hour).padStart(2, "0")}:00 — ${formatTokens(count)} tokens`,
		x: e.clientX + 10,
		y: e.clientY - 30,
	};
}

function hideTooltip() {
	tooltip = { ...tooltip, visible: false };
}
</script>

<div class="card">
	<div class="card-header">
		<span class="card-title">Coding Rhythm</span>
		<span class="card-subtitle">Token usage by day and hour</span>
	</div>
	<div class="hourly-grid-wrapper">
		<div class="hourly-grid">
			<!-- Hour labels row -->
			<div class="hourly-corner"></div>
			{#each HOURS as h}
				<div class="hourly-col-label">
					{#if HOUR_LABELS.includes(h)}
						{h}
					{/if}
				</div>
			{/each}

			<!-- Data rows -->
			{#each DAYS as day}
				<div class="hourly-row-label">{day}</div>
				{#each HOURS as h}
					{@const key = `${day}-${String(h).padStart(2, "0")}`}
					{@const count = data[key] ?? 0}
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="hourly-cell {level(count)}"
						onmouseenter={(e) => showTooltip(e, day, h)}
						onmouseleave={hideTooltip}
					></div>
				{/each}
			{/each}
		</div>
	</div>
</div>

{#if tooltip.visible}
	<div class="hourly-tooltip visible" style="left:{tooltip.x}px;top:{tooltip.y}px">
		{tooltip.text}
	</div>
{/if}

<style>
	.hourly-grid-wrapper {
		overflow-x: auto;
		margin-top: 8px;
	}
	.hourly-grid {
		display: grid;
		grid-template-columns: 32px repeat(24, 1fr);
		gap: 2px;
		min-width: 400px;
	}
	.hourly-corner {
		/* empty top-left corner */
	}
	.hourly-col-label {
		font-size: 9px;
		color: var(--text-dim);
		font-family: var(--font-mono);
		text-align: center;
		padding-bottom: 4px;
	}
	.hourly-row-label {
		font-size: 10px;
		color: var(--text-dim);
		font-family: var(--font-mono);
		display: flex;
		align-items: center;
		justify-content: flex-end;
		padding-right: 6px;
	}
	.hourly-cell {
		aspect-ratio: 1;
		border-radius: 2px;
		background: rgba(255, 255, 255, 0.04);
		cursor: pointer;
		transition: outline var(--transition);
		min-height: 14px;
	}
	.hourly-cell:hover {
		outline: 1px solid var(--text-muted);
	}
	.hourly-cell.l1 { background: rgba(249, 115, 22, 0.2); }
	.hourly-cell.l2 { background: rgba(249, 115, 22, 0.4); }
	.hourly-cell.l3 { background: rgba(249, 115, 22, 0.6); }
	.hourly-cell.l4 { background: rgba(249, 115, 22, 0.85); }
	.hourly-tooltip {
		position: fixed;
		background: var(--bg-deep);
		border: 1px solid var(--border-hover);
		padding: 6px 10px;
		border-radius: var(--radius-sm);
		font-size: 11px;
		color: var(--text-primary);
		white-space: nowrap;
		z-index: 100;
		pointer-events: none;
		font-family: var(--font-mono);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
	}
</style>
