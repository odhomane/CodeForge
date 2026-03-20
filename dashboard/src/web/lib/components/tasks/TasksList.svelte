<script lang="ts">
import { goto } from "$app/navigation";
import { fetchTasks, taskStore } from "$lib/stores/tasks.svelte.js";
import { formatRelativeTime } from "$lib/utils/format.js";

let highlightedIndex = $state(-1);
let expandedTeam = $state<string | null>(null);
let statusFilter = $state<string>("all");

let filteredTeams = $derived.by(() => {
	if (statusFilter === "all") return taskStore.teams;
	return taskStore.teams
		.map((team) => {
			const filtered = team.tasks.filter((task) => {
				if (statusFilter === "blocked") {
					return task.blockedBy.length > 0 && task.status !== "completed";
				}
				return task.status === statusFilter;
			});
			return {
				...team,
				tasks: filtered,
				taskCount: filtered.length,
				completedCount: filtered.filter((t) => t.status === "completed").length,
			};
		})
		.filter((team) => team.tasks.length > 0);
});

$effect(() => {
	fetchTasks();
});

function toggleExpand(teamName: string) {
	expandedTeam = expandedTeam === teamName ? null : teamName;
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

function isInputFocused(): boolean {
	const el = document.activeElement;
	if (!el) return false;
	const tag = el.tagName;
	if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
	if ((el as HTMLElement).isContentEditable) return true;
	return false;
}

function onKeydown(e: KeyboardEvent) {
	if (isInputFocused()) return;
	const teams = filteredTeams;
	if (teams.length === 0) return;

	switch (e.key) {
		case "j":
			e.preventDefault();
			highlightedIndex = Math.min(highlightedIndex + 1, teams.length - 1);
			break;
		case "k":
			e.preventDefault();
			highlightedIndex = Math.max(highlightedIndex - 1, 0);
			break;
		case "Enter":
			if (highlightedIndex >= 0 && highlightedIndex < teams.length) {
				e.preventDefault();
				toggleExpand(teams[highlightedIndex].teamName);
			}
			break;
		case "Escape":
			if (expandedTeam) {
				e.preventDefault();
				expandedTeam = null;
			} else if (highlightedIndex >= 0) {
				e.preventDefault();
				highlightedIndex = -1;
			}
			break;
	}
}

$effect(() => {
	if (highlightedIndex >= 0) {
		const row = document.querySelector(
			`.tasks-table tbody tr:nth-child(${highlightedIndex + 1})`,
		);
		row?.scrollIntoView({ block: "nearest" });
	}
});
</script>

<svelte:window onkeydown={onKeydown} />

<div class="tasks-list">
	{#if taskStore.error}
		<div class="error-banner">{taskStore.error}</div>
	{/if}

	<div class="filters-bar">
		<select class="filter-select" bind:value={statusFilter}>
			<option value="all">All Statuses</option>
			<option value="pending">Pending</option>
			<option value="in_progress">In Progress</option>
			<option value="completed">Completed</option>
			<option value="blocked">Blocked</option>
		</select>
	</div>

	{#if taskStore.loading}
		<div class="loading-state">Loading tasks...</div>
	{:else if filteredTeams.length === 0}
		<div class="empty-state">No task teams found.</div>
	{:else}
		<div class="tasks-table-wrap">
			<table class="tasks-table">
				<thead>
					<tr>
						<th>Team</th>
						<th>Tasks</th>
						<th>Sessions</th>
						<th>Last Used</th>
					</tr>
				</thead>
				<tbody>
					{#each filteredTeams as team, i (team.teamName)}
						<tr
							onclick={() => toggleExpand(team.teamName)}
							class:highlighted={i === highlightedIndex}
						>
							<td class="td-mono">
								<span class="chevron">{expandedTeam === team.teamName ? '\u25BC' : '\u25B6'}</span>
								{team.teamName}
							</td>
							<td>
								<span class="task-progress">
									<span class="task-progress-count">{team.completedCount}</span>
									<span class="task-progress-sep">/</span>
									<span class="task-progress-total">{team.taskCount}</span>
								</span>
							</td>
							<td class="td-muted">{team.sessions.length}</td>
							<td class="td-muted">{team.lastUsed ? formatRelativeTime(team.lastUsed) : '-'}</td>
						</tr>
						{#if expandedTeam === team.teamName}
							<tr class="expanded-row">
								<td colspan="4">
									<div class="expanded-content">
										<!-- Tasks -->
										<div class="expanded-section">
											<h4 class="expanded-section-title">Tasks</h4>
											<div class="task-items">
												{#each team.tasks as task (task.id)}
													<div class="task-item">
														<div class="task-item-header">
															<span class="task-status {statusClass(task.status, task.blockedBy)}">{statusIcon(task.status, task.blockedBy)}</span>
															<span class="task-subject">{task.subject}</span>
															{#if task.owner}
																<span class="task-owner">{task.owner}</span>
															{/if}
															{#if task.blockedBy.length > 0 && task.status !== "completed"}
																<span class="task-blocked-by">blocked by {task.blockedBy.join(', ')}</span>
															{/if}
														</div>
														{#if task.description}
															<p class="task-description">{task.description}</p>
														{/if}
													</div>
												{/each}
											</div>
										</div>

										<!-- Linked Sessions -->
										{#if team.sessions.length > 0}
											<div class="expanded-section">
												<h4 class="expanded-section-title">Linked Sessions</h4>
												<div class="linked-sessions">
													{#each team.sessions as session}
														<button
															class="linked-session"
															onclick={(e) => { e.stopPropagation(); goto(`/sessions/${session.sessionId}?tab=tasks`); }}
														>
															<span class="linked-session-id">{session.sessionId.slice(0, 8)}</span>
															<span class="linked-session-project">{session.project}</span>
															{#if session.lastActivity}
																<span class="linked-session-time">{formatRelativeTime(session.lastActivity)}</span>
															{/if}
														</button>
													{/each}
												</div>
											</div>
										{/if}
									</div>
								</td>
							</tr>
						{/if}
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<style>
	.tasks-list {
		width: 100%;
	}

	.tasks-table-wrap {
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		overflow: hidden;
	}

	.tasks-table {
		width: 100%;
		border-collapse: collapse;
	}

	.tasks-table th {
		text-align: left;
		padding: 12px 14px;
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-muted);
		border-bottom: 1px solid var(--border);
		background: var(--bg-deep);
	}

	.tasks-table td {
		padding: 11px 14px;
		font-size: 13px;
		color: var(--text-secondary);
		border-bottom: 1px solid var(--border-subtle);
	}

	.tasks-table tbody tr {
		transition: background var(--transition);
		cursor: pointer;
	}

	.tasks-table tbody tr:hover:not(.expanded-row),
	.tasks-table tbody tr.highlighted:not(.expanded-row) {
		background: var(--accent-dim);
	}

	.tasks-table tbody tr.highlighted:not(.expanded-row) {
		border-left: 2px solid var(--accent);
	}

	.td-mono {
		font-family: var(--font-mono);
		font-size: 12px;
	}

	.td-muted {
		color: var(--text-muted);
		font-size: 12px;
	}

	.chevron {
		font-size: 10px;
		color: var(--text-dim);
		margin-right: 6px;
	}

	.task-progress {
		font-family: var(--font-mono);
		font-size: 12px;
	}

	.task-progress-count {
		color: var(--green);
		font-weight: 600;
	}

	.task-progress-sep {
		color: var(--text-dim);
		margin: 0 2px;
	}

	.task-progress-total {
		color: var(--text-secondary);
	}

	.expanded-row {
		background: var(--bg-deep);
		cursor: default;
	}

	.expanded-row td {
		padding: 0;
	}

	.expanded-content {
		padding: 16px 20px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.expanded-section-title {
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-muted);
		margin: 0 0 8px;
	}

	.task-items {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.task-item {
		display: flex;
		flex-direction: column;
		padding: 6px 10px;
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		font-size: 13px;
	}

	.task-item-header {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.task-description {
		font-size: 12px;
		color: var(--text-muted);
		margin: 4px 0 0 26px;
		line-height: 1.4;
	}

	.task-status {
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
	}

	.task-owner {
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--purple);
		background: rgba(168, 85, 247, 0.12);
		padding: 2px 8px;
		border-radius: 4px;
	}

	.task-blocked-by {
		font-family: var(--font-mono);
		font-size: 10px;
		color: var(--red);
		background: rgba(239, 68, 68, 0.12);
		padding: 2px 8px;
		border-radius: 4px;
	}

	.linked-sessions {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.linked-session {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 6px 10px;
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		cursor: pointer;
		font-family: var(--font-ui);
		color: var(--text-secondary);
		font-size: 12px;
		text-align: left;
		width: 100%;
	}

	.linked-session:hover {
		border-color: var(--accent);
		background: var(--accent-dim);
	}

	.linked-session-id {
		font-family: var(--font-mono);
		font-weight: 600;
		color: var(--text-primary);
	}

	.linked-session-project {
		color: var(--cyan);
	}

	.linked-session-time {
		color: var(--text-dim);
		margin-left: auto;
	}

	.filters-bar {
		display: flex;
		gap: 12px;
		margin-bottom: 20px;
		flex-wrap: wrap;
	}

	.filter-select {
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		padding: 7px 12px;
		color: var(--text-primary);
		font-family: var(--font-ui);
		font-size: 13px;
		outline: none;
		cursor: pointer;
		min-width: 150px;
		appearance: none;
		-webkit-appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 5l3 3 3-3' stroke='%2378716c' stroke-width='1.5' fill='none'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 10px center;
		padding-right: 30px;
	}

	.filter-select:focus {
		border-color: var(--accent);
	}

	.filter-select option {
		background: var(--bg-card);
		color: var(--text-primary);
	}

	.loading-state,
	.empty-state {
		text-align: center;
		padding: 48px 24px;
		color: var(--text-muted);
		font-size: 14px;
	}

	.error-banner {
		background: var(--red-dim);
		color: var(--red);
		padding: 10px 16px;
		border-radius: var(--radius-sm);
		margin-bottom: 16px;
		font-size: 13px;
	}
</style>
