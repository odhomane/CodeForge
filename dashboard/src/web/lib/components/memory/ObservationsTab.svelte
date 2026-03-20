<script lang="ts">
import {
	approveObservation,
	dismissObservation,
	memoryStore,
	type Observation,
} from "$lib/stores/memory.svelte.js";
import { formatRelativeTime } from "$lib/utils/format.js";
import ObservationHistory from "./ObservationHistory.svelte";

let categoryFilter = $state("");
let expandedHistoryId = $state<number | null>(null);

function toggleHistory(id: number) {
	expandedHistoryId = expandedHistoryId === id ? null : id;
}
let statusFilter = $state("");

let categories = $derived.by(() => {
	const set = new Set<string>();
	for (const obs of memoryStore.observations) set.add(obs.category);
	return Array.from(set).sort();
});

let filtered = $derived.by(() => {
	let list = memoryStore.observations;
	if (categoryFilter) list = list.filter((o) => o.category === categoryFilter);
	if (statusFilter) list = list.filter((o) => o.status === statusFilter);
	return list;
});

function countClass(count: number): string {
	if (count >= 5) return "count-high";
	if (count >= 3) return "count-mid";
	return "count-low";
}

function statusClass(status: Observation["status"]): string {
	switch (status) {
		case "active":
			return "status-active";
		case "stale":
			return "status-stale";
		case "promoted":
			return "status-promoted";
		case "consolidated":
			return "status-consolidated";
		default:
			return "";
	}
}
</script>

<div class="observations-tab">
	<div class="filters-row">
		<select class="filter-select" bind:value={categoryFilter}>
			<option value="">All Categories</option>
			{#each categories as cat}
				<option value={cat}>{cat}</option>
			{/each}
		</select>
		<select class="filter-select" bind:value={statusFilter}>
			<option value="">All Statuses</option>
			<option value="active">Active</option>
			<option value="stale">Stale</option>
			<option value="promoted">Promoted</option>
			<option value="consolidated">Consolidated</option>
		</select>
	</div>

	{#if filtered.length === 0}
		<div class="empty-state">No observations found.</div>
	{:else}
		<div class="obs-list">
			{#each filtered as obs (obs.id)}
				<div class="obs-card">
					<div class="obs-header">
						<span class="category-badge">{obs.category}</span>
						<span class="count-badge {countClass(obs.count)}">{obs.count}x</span>
						<span class="status-badge {statusClass(obs.status)}">{obs.status}</span>
					</div>
					<div class="obs-content">{obs.content}</div>
					{#if obs.evidence}
						<div class="obs-evidence">{obs.evidence}</div>
					{/if}
					<div class="obs-footer">
						<span class="obs-meta">First: {formatRelativeTime(obs.createdAt)}</span>
						<span class="obs-meta">Last: {formatRelativeTime(obs.updatedAt)}</span>
						{#if obs.sessionsSinceLastSeen > 0}
							<span class="obs-meta">{obs.sessionsSinceLastSeen} sessions since</span>
						{/if}
						<div class="obs-actions">
							{#if obs.status === "active"}
								<button class="action-btn approve-btn" onclick={() => approveObservation(obs.id)}>Approve</button>
								<button class="action-btn dismiss-btn" onclick={() => dismissObservation(obs.id)}>Dismiss</button>
							{/if}
							<button class="action-btn history-btn" onclick={(e) => { e.stopPropagation(); toggleHistory(obs.id); }}>
								History
							</button>
						</div>
					</div>
					{#if expandedHistoryId === obs.id}
						<ObservationHistory observationId={obs.id} />
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.observations-tab {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.filters-row {
		display: flex;
		gap: 10px;
	}

	.filter-select {
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		color: var(--text-primary);
		font-size: 12px;
		padding: 5px 8px;
		font-family: var(--font-mono);
	}

	.obs-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.obs-card {
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		padding: 14px 16px;
	}

	.obs-header {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 8px;
	}

	.category-badge {
		font-family: var(--font-mono);
		font-size: 11px;
		font-weight: 600;
		color: var(--purple);
		background: rgba(168, 85, 247, 0.12);
		padding: 2px 8px;
		border-radius: 4px;
	}

	.count-badge {
		font-family: var(--font-mono);
		font-size: 11px;
		font-weight: 600;
		padding: 2px 6px;
		border-radius: 4px;
	}

	.count-low {
		color: var(--text-muted);
		background: var(--bg-surface);
	}

	.count-mid {
		color: var(--blue);
		background: rgba(59, 130, 246, 0.12);
	}

	.count-high {
		color: var(--green);
		background: var(--green-dim);
	}

	.status-badge {
		font-size: 11px;
		font-weight: 500;
		padding: 2px 8px;
		border-radius: 4px;
		margin-left: auto;
	}

	.status-active {
		color: var(--green);
		background: var(--green-dim);
	}

	.status-stale {
		color: var(--amber);
		background: var(--amber-dim);
	}

	.status-promoted {
		color: var(--blue);
		background: rgba(59, 130, 246, 0.12);
	}

	.status-consolidated {
		color: var(--text-muted);
		background: var(--bg-surface);
	}

	.obs-content {
		font-size: 13px;
		color: var(--text-primary);
		line-height: 1.5;
		margin-bottom: 8px;
	}

	.obs-evidence {
		font-size: 12px;
		color: var(--text-muted);
		font-style: italic;
		margin-bottom: 8px;
		padding-left: 12px;
		border-left: 2px solid var(--border);
	}

	.obs-footer {
		display: flex;
		align-items: center;
		gap: 12px;
		flex-wrap: wrap;
	}

	.obs-meta {
		font-size: 11px;
		color: var(--text-dim);
		font-family: var(--font-mono);
	}

	.obs-actions {
		display: flex;
		gap: 6px;
		margin-left: auto;
	}

	.action-btn {
		font-size: 11px;
		font-weight: 500;
		padding: 3px 10px;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border);
		cursor: pointer;
		transition: all var(--transition);
		background: var(--bg-surface);
	}

	.approve-btn {
		color: var(--green);
	}

	.approve-btn:hover {
		background: var(--green-dim);
		border-color: var(--green);
	}

	.dismiss-btn {
		color: var(--text-muted);
	}

	.dismiss-btn:hover {
		background: rgba(239, 68, 68, 0.1);
		border-color: var(--red);
		color: var(--red);
	}

	.history-btn {
		color: var(--purple);
	}

	.history-btn:hover {
		background: rgba(168, 85, 247, 0.1);
		border-color: var(--purple);
	}

	.empty-state {
		text-align: center;
		padding: 48px 24px;
		color: var(--text-muted);
		font-size: 13px;
	}
</style>
