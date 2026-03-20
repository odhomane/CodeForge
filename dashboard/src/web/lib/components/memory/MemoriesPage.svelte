<script lang="ts">
import {
	fetchMemories,
	fetchMemoryStats,
	fetchObservations,
	fetchRuns,
	type MemoryTab,
	memoryStore,
	startMaintenance,
} from "$lib/stores/memory.svelte.js";
import MemoriesTab from "./MemoriesTab.svelte";
import ObservationsTab from "./ObservationsTab.svelte";
import RunsTab from "./RunsTab.svelte";

function selectTab(tab: MemoryTab) {
	memoryStore.activeTab = tab;
}

function handleProjectFilter(e: Event) {
	const value = (e.target as HTMLSelectElement).value || null;
	memoryStore.projectFilter = value;
	const projectId = value ?? undefined;
	fetchObservations(projectId);
	fetchMemories(projectId);
	fetchRuns(projectId);
	fetchMemoryStats(projectId);
}

async function handleMaintenance() {
	const projectId = memoryStore.projectFilter;
	if (!projectId) return;
	await startMaintenance(projectId);
}

let projects = $derived.by(() => {
	const set = new Set<string>();
	for (const obs of memoryStore.observations) set.add(obs.projectId);
	for (const mem of memoryStore.memories) set.add(mem.projectId);
	for (const run of memoryStore.runs) set.add(run.projectId);
	return Array.from(set).sort();
});
</script>

<div class="memories-page">
	<div class="page-header">
		<div class="page-header-left">
			<h1 class="page-title">Memories</h1>
			<div class="stats-row">
				<span class="stat"><span class="stat-value">{memoryStore.stats.activeObservations}</span> active observations</span>
				<span class="stat"><span class="stat-value">{memoryStore.stats.totalMemories}</span> memories</span>
				<span class="stat"><span class="stat-value">{memoryStore.stats.totalRuns}</span> runs</span>
			</div>
		</div>
		<div class="page-header-right">
			<select class="project-filter" onchange={handleProjectFilter} value={memoryStore.projectFilter ?? ""}>
				<option value="">All Projects</option>
				{#each projects as project}
					<option value={project}>{project}</option>
				{/each}
			</select>
			<button class="maintenance-btn" onclick={handleMaintenance} disabled={!memoryStore.projectFilter}>
				Run Maintenance
			</button>
		</div>
	</div>

	<div class="tab-bar">
		<button class="tab-btn" class:active={memoryStore.activeTab === 'observations'} onclick={() => selectTab('observations')}>
			Observations ({memoryStore.observations.length})
		</button>
		<button class="tab-btn" class:active={memoryStore.activeTab === 'memories'} onclick={() => selectTab('memories')}>
			Memories ({memoryStore.memories.length})
		</button>
		<button class="tab-btn" class:active={memoryStore.activeTab === 'runs'} onclick={() => selectTab('runs')}>
			Runs ({memoryStore.runs.length})
		</button>
	</div>

	{#if memoryStore.error}
		<div class="error-banner">{memoryStore.error}</div>
	{/if}

	{#if memoryStore.loading}
		<div class="loading-state">Loading...</div>
	{:else if memoryStore.activeTab === 'observations'}
		<ObservationsTab />
	{:else if memoryStore.activeTab === 'memories'}
		<MemoriesTab />
	{:else if memoryStore.activeTab === 'runs'}
		<RunsTab />
	{/if}
</div>

<style>
	.memories-page {
		max-width: 100%;
	}

	.page-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		margin-bottom: 24px;
		gap: 16px;
		flex-wrap: wrap;
	}

	.page-header-left {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.page-title {
		font-size: 20px;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
	}

	.stats-row {
		display: flex;
		gap: 16px;
		font-size: 12px;
		color: var(--text-muted);
	}

	.stat-value {
		font-family: var(--font-mono);
		font-weight: 600;
		color: var(--text-primary);
		margin-right: 4px;
	}

	.page-header-right {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.project-filter {
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		color: var(--text-primary);
		font-size: 13px;
		padding: 6px 10px;
		font-family: var(--font-mono);
	}

	.maintenance-btn {
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		color: var(--text-secondary);
		font-size: 13px;
		font-weight: 500;
		padding: 6px 14px;
		cursor: pointer;
		transition: all var(--transition);
	}

	.maintenance-btn:hover:not(:disabled) {
		background: var(--bg-surface);
		color: var(--text-primary);
		border-color: var(--accent);
	}

	.maintenance-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.tab-bar {
		display: flex;
		gap: 0;
		border-bottom: 1px solid var(--border);
		margin-bottom: 16px;
	}

	.tab-btn {
		padding: 10px 20px;
		font-family: var(--font-ui);
		font-size: 13px;
		font-weight: 500;
		color: var(--text-muted);
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		cursor: pointer;
		transition: color var(--transition), border-color var(--transition);
	}

	.tab-btn:hover {
		color: var(--text-secondary);
	}

	.tab-btn.active {
		color: var(--accent);
		border-bottom-color: var(--accent);
	}

	.error-banner {
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid var(--red);
		border-radius: var(--radius-sm);
		padding: 10px 16px;
		color: var(--red);
		font-size: 13px;
		margin-bottom: 16px;
	}

	.loading-state {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 64px 24px;
		color: var(--text-muted);
		font-size: 14px;
	}
</style>
