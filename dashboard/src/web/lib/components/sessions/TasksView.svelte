<script lang="ts">
import type { TaskItem } from "$lib/stores/tasks.svelte.js";

let {
	tasks,
	teamName,
	loading,
}: {
	tasks: TaskItem[] | null | undefined;
	teamName?: string | null;
	loading?: boolean;
} = $props();

let expandedItems = $state(new Set<string>());

function toggleItem(id: string) {
	const next = new Set(expandedItems);
	if (next.has(id)) {
		next.delete(id);
	} else {
		next.add(id);
	}
	expandedItems = next;
}

function statusIcon(status: string, blockedBy: string[]): string {
	if (blockedBy.length > 0 && status !== "completed") return "\u2298";
	switch (status) {
		case "completed":
			return "\u2713";
		case "in_progress":
			return "\u25CE";
		default:
			return "\u25CB";
	}
}

function statusClass(status: string, blockedBy: string[]): string {
	if (blockedBy.length > 0 && status !== "completed") return "status-blocked";
	switch (status) {
		case "completed":
			return "status-completed";
		case "in_progress":
			return "status-in-progress";
		default:
			return "status-pending";
	}
}

let completedCount = $derived(
	(tasks ?? []).filter((t) => t.status === "completed").length,
);
let totalCount = $derived((tasks ?? []).length);
</script>

{#if loading}
	<div class="tasks-empty">
		<span class="loading-dot"></span>
		<span class="loading-text">Loading tasks...</span>
	</div>
{:else if !tasks || tasks.length === 0}
	<div class="tasks-empty">No tasks available for this session.</div>
{:else}
	<div class="tasks-view">
		<div class="tasks-header">
			{#if teamName}
				<span class="team-badge">{teamName}</span>
			{/if}
			<span class="tasks-progress">{completedCount}/{totalCount} completed</span>
		</div>

		<div class="tasks-cards">
			{#each tasks as task (task.id)}
				<div class="task-card" class:expanded={expandedItems.has(task.id)}>
					<button class="task-card-header" onclick={() => toggleItem(task.id)}>
						<span class="chevron">{expandedItems.has(task.id) ? '\u25BC' : '\u25B6'}</span>
						<span class="task-status-icon {statusClass(task.status, task.blockedBy)}">{statusIcon(task.status, task.blockedBy)}</span>
						<span class="task-subject">{task.subject}</span>
						{#if task.owner}
							<span class="task-owner">{task.owner}</span>
						{/if}
						{#if task.blockedBy.length > 0 && task.status !== "completed"}
							<span class="task-blocked">blocked by {task.blockedBy.join(', ')}</span>
						{/if}
					</button>
					{#if expandedItems.has(task.id)}
						<div class="task-card-body">
							{#if task.description}
								<div class="task-description">{task.description}</div>
							{/if}
							<div class="task-meta">
								<span class="task-meta-item">
									<span class="task-meta-label">ID</span>
									<span class="task-meta-value">{task.id}</span>
								</span>
								<span class="task-meta-item">
									<span class="task-meta-label">Status</span>
									<span class="task-meta-value">{task.status}</span>
								</span>
								{#if task.owner}
									<span class="task-meta-item">
										<span class="task-meta-label">Owner</span>
										<span class="task-meta-value">{task.owner}</span>
									</span>
								{/if}
								{#if task.blocks.length > 0}
									<span class="task-meta-item">
										<span class="task-meta-label">Blocks</span>
										<span class="task-meta-value">{task.blocks.join(', ')}</span>
									</span>
								{/if}
								{#if task.blockedBy.length > 0}
									<span class="task-meta-item">
										<span class="task-meta-label">Blocked By</span>
										<span class="task-meta-value">{task.blockedBy.join(', ')}</span>
									</span>
								{/if}
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
{/if}

<style>
	.tasks-empty {
		text-align: center;
		padding: 48px 24px;
		color: var(--text-muted);
		font-size: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
	}

	.loading-dot {
		display: inline-block;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--accent);
		animation: pulse 1.2s ease-in-out infinite;
	}

	.loading-text {
		color: var(--text-dim);
		font-size: 13px;
		font-style: italic;
	}

	@keyframes pulse {
		0%, 100% { opacity: 0.3; }
		50% { opacity: 1; }
	}

	.tasks-view {
		padding: 4px 0;
	}

	.tasks-header {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 16px;
	}

	.team-badge {
		font-family: var(--font-mono);
		font-size: 14px;
		color: var(--amber);
		background: var(--amber-dim);
		padding: 3px 10px;
		border-radius: var(--radius-sm);
		font-weight: 600;
	}

	.tasks-progress {
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--text-dim);
	}

	.tasks-cards {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.task-card {
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		overflow: hidden;
		transition: border-color var(--transition);
	}

	.task-card:hover {
		border-color: var(--border-hover);
	}

	.task-card-header {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		padding: 10px 14px;
		background: none;
		border: none;
		cursor: pointer;
		font-family: var(--font-ui);
		color: var(--text-secondary);
		font-size: 13px;
		text-align: left;
	}

	.task-card-header:hover {
		background: rgba(255, 255, 255, 0.02);
	}

	.chevron {
		font-size: 10px;
		color: var(--text-dim);
		width: 14px;
		text-align: center;
		flex-shrink: 0;
	}

	.task-status-icon {
		font-size: 14px;
		width: 18px;
		text-align: center;
		flex-shrink: 0;
	}

	.status-completed { color: var(--green); }
	.status-in-progress { color: var(--amber); }
	.status-pending { color: var(--text-muted); }
	.status-blocked { color: var(--red); }

	.task-subject {
		color: var(--text-primary);
		flex: 1;
		font-weight: 500;
	}

	.task-owner {
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--purple);
		background: rgba(168, 85, 247, 0.12);
		padding: 2px 8px;
		border-radius: 4px;
		flex-shrink: 0;
	}

	.task-blocked {
		font-family: var(--font-mono);
		font-size: 10px;
		color: var(--red);
		background: rgba(239, 68, 68, 0.12);
		padding: 2px 8px;
		border-radius: 4px;
		flex-shrink: 0;
	}

	.task-card-body {
		padding: 14px 16px;
		border-top: 1px solid var(--border);
	}

	.task-description {
		font-size: 13px;
		line-height: 1.6;
		color: var(--text-secondary);
		margin-bottom: 12px;
		white-space: pre-wrap;
	}

	.task-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 16px;
	}

	.task-meta-item {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.task-meta-label {
		font-size: 10px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-dim);
	}

	.task-meta-value {
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--text-secondary);
	}
</style>
