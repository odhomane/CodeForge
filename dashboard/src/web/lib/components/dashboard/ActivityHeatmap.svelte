<script lang="ts">
let { data = {} as Record<string, number> }: { data: Record<string, number> } =
	$props();

let tooltip = $state({ visible: false, text: "", x: 0, y: 0 });

const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];
const MONTH_NAMES = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
];

interface CellData {
	date: string;
	count: number;
	level: string;
}

const weeks = $derived.by(() => {
	const now = new Date();
	const result: CellData[][] = [];

	// Go back 52 weeks from the current week's Saturday
	const endDay = new Date(now);
	const dayOfWeek = endDay.getDay();
	endDay.setDate(endDay.getDate() + (6 - dayOfWeek)); // move to Saturday

	const startDay = new Date(endDay);
	startDay.setDate(startDay.getDate() - 52 * 7 + 1); // 52 weeks back, start on Sunday

	let current = new Date(startDay);
	let week: CellData[] = [];

	while (current <= endDay) {
		const dateStr = current.toISOString().slice(0, 10);
		const count = data[dateStr] ?? 0;
		let level = "";
		if (count >= 8) level = "l4";
		else if (count >= 5) level = "l3";
		else if (count >= 3) level = "l2";
		else if (count >= 1) level = "l1";

		week.push({ date: dateStr, count, level });

		if (current.getDay() === 6) {
			result.push(week);
			week = [];
		}
		current.setDate(current.getDate() + 1);
	}
	if (week.length) result.push(week);
	return result;
});

const monthLabels = $derived.by(() => {
	if (!weeks.length) return [];
	const labels: { text: string; offset: number }[] = [];
	let lastMonth = -1;
	for (let i = 0; i < weeks.length; i++) {
		const firstCell = weeks[i][0];
		if (!firstCell) continue;
		const month = new Date(firstCell.date).getMonth();
		if (month !== lastMonth) {
			labels.push({ text: MONTH_NAMES[month], offset: i * 15 });
			lastMonth = month;
		}
	}
	return labels;
});

function showTooltip(e: MouseEvent, cell: CellData) {
	tooltip = {
		visible: true,
		text: `${cell.date}: ${cell.count} session${cell.count !== 1 ? "s" : ""}`,
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
		<span class="card-title">Activity</span>
		<span class="card-subtitle">Last 52 weeks</span>
	</div>
	<div class="heatmap-wrapper">
		<div class="heatmap-outer">
			<div class="heatmap-day-labels">
				{#each DAY_LABELS as label}
					<div class="heatmap-day-label">{label}</div>
				{/each}
			</div>
			<div class="heatmap-columns-area">
				<div class="heatmap-month-labels">
					{#each monthLabels as ml}
						<span class="heatmap-month-label" style="position:absolute;left:{ml.offset}px">{ml.text}</span>
					{/each}
				</div>
				<div class="heatmap-columns">
					{#each weeks as week}
						<div class="heatmap-week">
							{#each week as cell}
								<!-- svelte-ignore a11y_no_static_element_interactions -->
								<div
									class="heatmap-cell {cell.level}"
									onmouseenter={(e) => showTooltip(e, cell)}
									onmouseleave={hideTooltip}
								></div>
							{/each}
						</div>
					{/each}
				</div>
			</div>
		</div>
		<div class="heatmap-legend">
			<span>Less</span>
			<div class="heatmap-legend-cell" style="background:rgba(255,255,255,0.04)"></div>
			<div class="heatmap-legend-cell" style="background:rgba(249,115,22,0.2)"></div>
			<div class="heatmap-legend-cell" style="background:rgba(249,115,22,0.4)"></div>
			<div class="heatmap-legend-cell" style="background:rgba(249,115,22,0.6)"></div>
			<div class="heatmap-legend-cell" style="background:rgba(249,115,22,0.85)"></div>
			<span>More</span>
		</div>
	</div>
</div>

{#if tooltip.visible}
	<div class="heatmap-tooltip-el visible" style="left:{tooltip.x}px;top:{tooltip.y}px">
		{tooltip.text}
	</div>
{/if}

<style>
	.heatmap-wrapper {
		overflow-x: auto;
	}
	.heatmap-outer {
		display: flex;
		gap: 0;
		min-width: fit-content;
	}
	.heatmap-day-labels {
		display: flex;
		flex-direction: column;
		padding-top: 22px;
		margin-right: 6px;
		flex-shrink: 0;
	}
	.heatmap-day-label {
		height: 13px;
		font-size: 10px;
		color: var(--text-dim);
		font-family: var(--font-mono);
		line-height: 13px;
		margin-bottom: 2px;
	}
	.heatmap-columns-area {
		display: flex;
		flex-direction: column;
	}
	.heatmap-month-labels {
		display: flex;
		height: 18px;
		margin-bottom: 4px;
		position: relative;
	}
	.heatmap-month-label {
		font-size: 10px;
		color: var(--text-dim);
		font-family: var(--font-mono);
	}
	.heatmap-columns {
		display: flex;
		gap: 2px;
	}
	.heatmap-week {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.heatmap-cell {
		width: 13px;
		height: 13px;
		border-radius: 2px;
		background: rgba(255, 255, 255, 0.04);
		cursor: pointer;
		transition: outline var(--transition);
	}
	.heatmap-cell:hover {
		outline: 1px solid var(--text-muted);
	}
	.heatmap-cell.l1 { background: rgba(249, 115, 22, 0.2); }
	.heatmap-cell.l2 { background: rgba(249, 115, 22, 0.4); }
	.heatmap-cell.l3 { background: rgba(249, 115, 22, 0.6); }
	.heatmap-cell.l4 { background: rgba(249, 115, 22, 0.85); }
	.heatmap-legend {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-top: 12px;
		font-size: 11px;
		color: var(--text-muted);
		justify-content: flex-end;
	}
	.heatmap-legend-cell {
		width: 13px;
		height: 13px;
		border-radius: 2px;
	}
	.heatmap-tooltip-el {
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
