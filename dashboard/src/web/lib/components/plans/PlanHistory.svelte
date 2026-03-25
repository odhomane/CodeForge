<script lang="ts">
import DiffView from "$lib/components/shared/DiffView.svelte";
import {
	fetchPlanHistory,
	type PlanVersion,
} from "$lib/stores/plans.svelte.js";
import { formatRelativeTime } from "$lib/utils/format.js";

interface Props {
	slug: string;
}

let { slug }: Props = $props();

let versions = $state<PlanVersion[]>([]);
let loading = $state(true);
let error = $state<string | null>(null);
let selectedIndex = $state<number | null>(null);
let showDiff = $state(false);

interface Deduped {
	version: PlanVersion;
	skippedCount: number;
}

let dedupedVersions: Deduped[] = $derived.by(() => {
	if (versions.length === 0) return [];
	const result: Deduped[] = [];
	let current = versions[0];
	let skipped = 0;
	for (let i = 1; i < versions.length; i++) {
		if (versions[i].content === current.content) {
			skipped++;
		} else {
			result.push({ version: current, skippedCount: skipped });
			current = versions[i];
			skipped = 0;
		}
	}
	result.push({ version: current, skippedCount: skipped });
	return result;
});

let selected = $derived(
	selectedIndex !== null ? (dedupedVersions[selectedIndex] ?? null) : null,
);
let predecessor = $derived(
	selectedIndex !== null && selectedIndex < dedupedVersions.length - 1
		? dedupedVersions[selectedIndex + 1]
		: null,
);

$effect(() => {
	loading = true;
	error = null;
	selectedIndex = null;
	showDiff = false;
	fetchPlanHistory(slug)
		.then((v) => {
			versions = v;
		})
		.catch((e) => {
			error = e instanceof Error ? e.message : String(e);
		})
		.finally(() => {
			loading = false;
		});
});
</script>

<div class="plan-history">
	{#if loading}
		<span class="loading-text">Loading history...</span>
	{:else if error}
		<span class="error-text">{error}</span>
	{:else if dedupedVersions.length === 0}
		<span class="empty-text">No history available.</span>
	{:else if dedupedVersions.length === 1}
		<span class="empty-text">No previous versions to compare.</span>
	{:else}
		<div class="version-list">
			{#each dedupedVersions as entry, i (entry.version.id)}
				<button
					class="version-item"
					class:active={selectedIndex === i}
					onclick={() => {
						selectedIndex = selectedIndex === i ? null : i;
						showDiff = false;
					}}
				>
					<span class="version-time"
						>{formatRelativeTime(entry.version.capturedAt)}</span
					>
					{#if entry.version.sessionId}
						<span class="version-session"
							>{entry.version.sessionId.slice(0, 8)}</span
						>
					{/if}
					{#if entry.skippedCount > 0}
						<span class="skipped-badge"
							>{entry.skippedCount} identical</span
						>
					{/if}
				</button>
			{/each}
		</div>

		{#if selected && predecessor}
			<div class="diff-controls">
				<button
					class="diff-toggle"
					onclick={() => (showDiff = !showDiff)}
				>
					{showDiff ? "Hide Diff" : "Show Diff"}
				</button>
			</div>
			{#if showDiff}
				<DiffView
					oldText={predecessor.version.content}
					newText={selected.version.content}
					oldLabel={formatRelativeTime(
						predecessor.version.capturedAt,
					)}
					newLabel={formatRelativeTime(selected.version.capturedAt)}
					maxHeight="400px"
				/>
			{/if}
		{/if}
	{/if}
</div>

<style>
	.plan-history {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.loading-text,
	.empty-text {
		color: var(--text-dim);
		font-size: 12px;
		font-style: italic;
	}

	.error-text {
		color: var(--red);
		font-size: 12px;
	}

	.version-list {
		display: flex;
		flex-direction: column;
		gap: 3px;
		max-height: 200px;
		overflow-y: auto;
	}

	.version-item {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 5px 10px;
		background: var(--bg-deep);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		cursor: pointer;
		font-family: var(--font-ui);
		font-size: 12px;
		color: var(--text-secondary);
		text-align: left;
		transition: border-color var(--transition);
	}

	.version-item:hover {
		border-color: var(--accent);
	}

	.version-item.active {
		border-color: var(--accent);
		background: var(--accent-dim);
	}

	.version-time {
		color: var(--text-muted);
		font-family: var(--font-mono);
		font-size: 11px;
	}

	.version-session {
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--accent);
	}

	.skipped-badge {
		font-size: 10px;
		color: var(--text-dim);
		background: rgba(255, 255, 255, 0.06);
		padding: 1px 6px;
		border-radius: 3px;
		margin-left: auto;
	}

	.diff-controls {
		display: flex;
		gap: 8px;
	}

	.diff-toggle {
		padding: 4px 12px;
		background: var(--bg-deep);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		color: var(--text-secondary);
		font-family: var(--font-ui);
		font-size: 12px;
		cursor: pointer;
		transition: border-color var(--transition);
	}

	.diff-toggle:hover {
		border-color: var(--accent);
	}
</style>
