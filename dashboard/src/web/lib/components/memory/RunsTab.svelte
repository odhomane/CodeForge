<script lang="ts">
import {
	fetchRunDetail,
	type MemoryRun,
	memoryStore,
} from "$lib/stores/memory.svelte.js";
import {
	formatCost,
	formatDuration,
	formatRelativeTime,
	formatTokens,
} from "$lib/utils/format.js";
import RunDetail from "./RunDetail.svelte";

let expandedRunId = $state<string | null>(null);

async function toggleRun(run: MemoryRun) {
	if (expandedRunId === run.runId) {
		expandedRunId = null;
		memoryStore.selectedRun = null;
		return;
	}
	expandedRunId = run.runId;
	await fetchRunDetail(run.runId);
}

function statusClass(status: MemoryRun["status"]): string {
	switch (status) {
		case "running":
			return "status-running";
		case "completed":
			return "status-completed";
		case "failed":
			return "status-failed";
		default:
			return "";
	}
}

function typeClass(runType: MemoryRun["runType"]): string {
	return runType === "analysis" ? "type-analysis" : "type-maintenance";
}
</script>

<div class="runs-tab">
	{#if memoryStore.runs.length === 0}
		<div class="empty-state">No runs found.</div>
	{:else}
		<div class="runs-list">
			{#each memoryStore.runs as run (run.runId)}
				<button class="run-row" class:expanded={expandedRunId === run.runId} onclick={() => toggleRun(run)}>
					<span class="run-type {typeClass(run.runType)}">{run.runType}</span>
					<span class="run-project">{run.projectId}</span>
					<span class="run-status {statusClass(run.status)}">{run.status}</span>
					<span class="run-cost">{formatCost(run.costUsd)}</span>
					<span class="run-tokens">{formatTokens(run.inputTokens + run.outputTokens)}</span>
					<span class="run-duration">{formatDuration(run.durationMs)}</span>
					<span class="run-time">{formatRelativeTime(run.startedAt)}</span>
				</button>
				{#if expandedRunId === run.runId && memoryStore.selectedRun}
					<div class="run-detail-wrapper">
						<RunDetail run={memoryStore.selectedRun} />
					</div>
				{/if}
			{/each}
		</div>
	{/if}
</div>

<style>
	.runs-tab {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.runs-list {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.run-row {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 10px 16px;
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all var(--transition);
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--text-secondary);
		width: 100%;
		text-align: left;
	}

	.run-row:hover {
		border-color: var(--accent-dim);
	}

	.run-row.expanded {
		border-color: var(--accent);
		border-bottom-left-radius: 0;
		border-bottom-right-radius: 0;
	}

	.run-type {
		font-weight: 600;
		padding: 2px 8px;
		border-radius: 4px;
		font-size: 11px;
		flex-shrink: 0;
	}

	.type-analysis {
		color: var(--blue);
		background: rgba(59, 130, 246, 0.12);
	}

	.type-maintenance {
		color: var(--purple);
		background: rgba(168, 85, 247, 0.12);
	}

	.run-project {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: var(--text-primary);
	}

	.run-status {
		font-weight: 600;
		font-size: 11px;
		padding: 2px 8px;
		border-radius: 4px;
		flex-shrink: 0;
	}

	.status-running {
		color: var(--amber);
		background: var(--amber-dim);
		animation: pulse 2s ease-in-out infinite;
	}

	.status-completed {
		color: var(--green);
		background: var(--green-dim);
	}

	.status-failed {
		color: var(--red);
		background: rgba(239, 68, 68, 0.1);
	}

	.run-cost {
		color: var(--green);
		flex-shrink: 0;
		min-width: 60px;
		text-align: right;
	}

	.run-tokens {
		color: var(--text-muted);
		flex-shrink: 0;
		min-width: 60px;
		text-align: right;
	}

	.run-duration {
		color: var(--text-muted);
		flex-shrink: 0;
		min-width: 50px;
		text-align: right;
	}

	.run-time {
		color: var(--text-dim);
		flex-shrink: 0;
		min-width: 70px;
		text-align: right;
	}

	.run-detail-wrapper {
		border: 1px solid var(--accent);
		border-top: none;
		border-radius: 0 0 var(--radius-md) var(--radius-md);
		background: var(--bg-deep);
		padding: 16px;
	}

	.empty-state {
		text-align: center;
		padding: 48px 24px;
		color: var(--text-muted);
		font-size: 13px;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.6; }
	}
</style>
