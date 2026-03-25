<script lang="ts">
import {
	fetchMemories,
	fetchMemoryStats,
	fetchObservations,
	fetchRuns,
	type MemoryTab,
	memoryStore,
} from "$lib/stores/memory.svelte.js";
import MaintenanceModal from "./MaintenanceModal.svelte";
import MemoriesTab from "./MemoriesTab.svelte";
import ObservationsTab from "./ObservationsTab.svelte";
import RunsTab from "./RunsTab.svelte";

let showMaintenanceModal = $state(false);

function selectTab(tab: MemoryTab) {
	memoryStore.activeTab = tab;
}

function handleProjectFilter(e: Event) {
	const value = (e.target as HTMLSelectElement).value || null;
	memoryStore.projectFilter = value;
	const url = new URL(window.location.href);
	if (value) {
		url.searchParams.set("project", value);
	} else {
		url.searchParams.delete("project");
	}
	window.history.replaceState({}, "", url.toString());
	const projectId = value ?? undefined;
	fetchObservations(projectId);
	fetchMemories(projectId);
	fetchRuns(projectId);
	fetchMemoryStats(projectId);
}

let projects = $state<Array<{ id: string; name: string }>>([]);

$effect(() => {
	fetch("/api/projects")
		.then((r) => r.json())
		.then((data) => {
			projects = data ?? [];
		})
		.catch(() => {});
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
			<button class="maintenance-btn" onclick={() => showMaintenanceModal = true}>
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
		<ObservationsTab {projects} onprojectchange={handleProjectFilter} />
	{:else if memoryStore.activeTab === 'memories'}
		<MemoriesTab {projects} onprojectchange={handleProjectFilter} />
	{:else if memoryStore.activeTab === 'runs'}
		<RunsTab {projects} onprojectchange={handleProjectFilter} />
	{/if}
</div>

{#if showMaintenanceModal}
	<MaintenanceModal onclose={() => showMaintenanceModal = false} />
{/if}

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

	.maintenance-btn:hover {
		background: var(--bg-surface);
		color: var(--text-primary);
		border-color: var(--accent);
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
