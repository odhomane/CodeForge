<script lang="ts">
import { formatCost } from "$lib/utils/format.js";
import { formatModelName } from "$lib/utils/pricing.js";

let {
	costByModel = {},
	cacheEfficiencyByModel = {},
	modelSessionCount = {},
	totalCost = 0,
}: {
	costByModel?: Record<string, number>;
	cacheEfficiencyByModel?: Record<string, number>;
	modelSessionCount?: Record<string, number>;
	totalCost?: number;
} = $props();

const MODEL_COLORS: Record<string, string> = {
	"claude-sonnet-4-20250514": "var(--blue)",
	"claude-opus-4-6": "var(--purple)",
	"claude-haiku-3.5": "var(--cyan)",
	"claude-3-5-sonnet-20241022": "var(--green)",
	"claude-sonnet-4-5-20250929": "var(--amber)",
};

type SortKey =
	| "model"
	| "sessions"
	| "cost"
	| "cacheRate"
	| "avgCost"
	| "pctSpend";

let sortKey = $state<SortKey>("cost");
let sortAsc = $state(false);

interface ModelRow {
	model: string;
	sessions: number;
	cost: number;
	cacheRate: number;
	avgCost: number;
	pctSpend: number;
	color: string;
}

const rows: ModelRow[] = $derived.by(() => {
	const models = new Set([
		...Object.keys(costByModel),
		...Object.keys(modelSessionCount),
	]);
	return [...models].map((model) => {
		const cost = costByModel[model] ?? 0;
		const sessions = modelSessionCount[model] ?? 0;
		return {
			model,
			sessions,
			cost,
			cacheRate: cacheEfficiencyByModel[model] ?? 0,
			avgCost: sessions > 0 ? cost / sessions : 0,
			pctSpend: totalCost > 0 ? (cost / totalCost) * 100 : 0,
			color: MODEL_COLORS[model] ?? "var(--text-dim)",
		};
	});
});

const sortedRows: ModelRow[] = $derived.by(() => {
	const sorted = [...rows].sort((a, b) => {
		let cmp: number;
		if (sortKey === "model") {
			cmp = formatModelName(a.model).localeCompare(formatModelName(b.model));
		} else {
			cmp = a[sortKey] - b[sortKey];
		}
		return sortAsc ? cmp : -cmp;
	});
	return sorted;
});

function toggleSort(key: SortKey) {
	if (sortKey === key) {
		sortAsc = !sortAsc;
	} else {
		sortKey = key;
		sortAsc = key === "model";
	}
}

const columns: { key: SortKey; label: string; align: "left" | "right" }[] = [
	{ key: "model", label: "Model", align: "left" },
	{ key: "sessions", label: "Sessions", align: "right" },
	{ key: "cost", label: "Total Cost", align: "right" },
	{ key: "cacheRate", label: "Cache Hit Rate", align: "right" },
	{ key: "avgCost", label: "Avg Cost/Session", align: "right" },
	{ key: "pctSpend", label: "% of Total", align: "right" },
];
</script>

<div class="card">
	<div class="card-header">
		<span class="card-title">Model Comparison</span>
	</div>
	<div class="table-wrap">
		{#if sortedRows.length > 0}
			<table class="comparison-table">
				<thead>
					<tr>
						{#each columns as col}
							<th
								class="th-{col.align}"
								class:sorted={sortKey === col.key}
								onclick={() => toggleSort(col.key)}
							>
								{col.label}
								{#if sortKey === col.key}
									<span class="sort-arrow">{sortAsc ? "\u25B2" : "\u25BC"}</span>
								{/if}
							</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each sortedRows as row}
						<tr>
							<td class="td-model">
								<span class="model-dot" style="background:{row.color}"></span>
								{formatModelName(row.model)}
							</td>
							<td class="td-num">{row.sessions.toLocaleString()}</td>
							<td class="td-num">{formatCost(row.cost)}</td>
							<td class="td-num">{(row.cacheRate * 100).toFixed(1)}%</td>
							<td class="td-num">{formatCost(row.avgCost)}</td>
							<td class="td-num">{row.pctSpend.toFixed(1)}%</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{:else}
			<div class="empty">No model data available</div>
		{/if}
	</div>
</div>

<style>
	.table-wrap {
		overflow-x: auto;
		padding: 0 0 4px;
	}
	.comparison-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 12.5px;
	}
	.comparison-table th {
		padding: 8px 12px;
		font-weight: 600;
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--text-dim);
		border-bottom: 1px solid var(--border);
		cursor: pointer;
		user-select: none;
		white-space: nowrap;
		transition: color var(--transition);
	}
	.comparison-table th:hover {
		color: var(--text-secondary);
	}
	.comparison-table th.sorted {
		color: var(--accent);
	}
	.th-left {
		text-align: left;
	}
	.th-right {
		text-align: right;
	}
	.sort-arrow {
		font-size: 8px;
		margin-left: 4px;
		vertical-align: middle;
	}
	.comparison-table td {
		padding: 8px 12px;
		border-bottom: 1px solid var(--border-subtle);
	}
	.comparison-table tr:last-child td {
		border-bottom: none;
	}
	.comparison-table tr:hover td {
		background: rgba(255, 255, 255, 0.02);
	}
	.td-model {
		display: flex;
		align-items: center;
		gap: 8px;
		font-weight: 500;
		color: var(--text-primary);
		white-space: nowrap;
	}
	.model-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}
	.td-num {
		text-align: right;
		font-family: var(--font-mono);
		color: var(--text-secondary);
		white-space: nowrap;
	}
	.empty {
		font-size: 13px;
		color: var(--text-dim);
		text-align: center;
		padding: 20px;
	}
</style>
