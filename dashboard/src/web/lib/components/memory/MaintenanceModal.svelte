<script lang="ts">
import { memoryStore, startMaintenance } from "$lib/stores/memory.svelte.js";
import ConfirmModal from "../shared/ConfirmModal.svelte";

interface Props {
	onclose: () => void;
}

let { onclose }: Props = $props();

let projects = $state<
	Array<{ projectId: string; projectName: string; activeObservations: number }>
>([]);
let selectedProject = $state("");
let loading = $state(true);

$effect(() => {
	fetch("/api/memory/stats-by-project")
		.then((r) => r.json())
		.then((data) => {
			projects = data ?? [];
			loading = false;
		})
		.catch(() => {
			loading = false;
		});
});

async function handleConfirm() {
	if (!selectedProject) return;
	await startMaintenance(selectedProject);
	onclose();
}

let confirmDisabled = $derived(
	!selectedProject || !!memoryStore.activeMaintenance[selectedProject],
);
</script>

{#snippet body()}
	{#if loading}
		<p class="loading-text">Loading projects...</p>
	{:else if projects.length === 0}
		<p class="empty-text">No projects with active observations found.</p>
	{:else}
		<label class="select-label" for="maint-project">Select a project to run maintenance on:</label>
		<select id="maint-project" class="project-select" bind:value={selectedProject}>
			<option value="">Choose a project...</option>
			{#each projects as p}
				<option value={p.projectId}>
					{p.projectName} ({p.activeObservations} active observations)
				</option>
			{/each}
		</select>
	{/if}
{/snippet}

<ConfirmModal
	title="Run Maintenance"
	confirmLabel={memoryStore.activeMaintenance[selectedProject] ? "Running..." : "Run Maintenance"}
	confirmVariant="accent"
	{confirmDisabled}
	onconfirm={handleConfirm}
	oncancel={onclose}
	children={body}
/>

<style>
	.loading-text, .empty-text {
		color: var(--text-muted);
		font-size: 13px;
		margin: 8px 0;
	}

	.select-label {
		display: block;
		font-size: 13px;
		color: var(--text-secondary);
		margin-bottom: 8px;
	}

	.project-select {
		width: 100%;
		background: var(--bg-surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		color: var(--text-primary);
		font-family: var(--font-ui);
		font-size: 13px;
		padding: 8px 12px;
	}

	.project-select:focus {
		outline: none;
		border-color: var(--accent);
	}

	.project-select option {
		background: var(--bg-card);
		color: var(--text-primary);
	}
</style>
