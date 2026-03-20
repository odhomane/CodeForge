<script lang="ts">
import { fetchProjects, projectStore } from "$lib/stores/projects.svelte.js";
import { formatRelativeTime, formatTokens } from "$lib/utils/format.js";

$effect(() => {
	if (!projectStore.projects.length) {
		fetchProjects();
	}
});

const sorted = $derived(
	[...projectStore.projects].sort((a, b) => {
		if (!a.lastActivity && !b.lastActivity) return 0;
		if (!a.lastActivity) return 1;
		if (!b.lastActivity) return -1;
		return (
			new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
		);
	}),
);
</script>

<div class="projects-grid">
	{#each sorted as project}
		<a href="/projects/{encodeURIComponent(project.id)}" class="project-card">
			<div class="project-card-name">{project.name}</div>
			<div class="project-card-path" title={project.path}>{project.path}</div>
			<div class="project-card-stats">
				<div>
					<div class="project-stat-label">Sessions</div>
					<div class="project-stat-value">{project.sessionCount}</div>
				</div>
				<div>
					<div class="project-stat-label">Tokens</div>
					<div class="project-stat-value">
						{project.totalTokens
							? formatTokens(project.totalTokens.input + project.totalTokens.output)
							: "—"}
					</div>
				</div>
				<div>
					<div class="project-stat-label">Last Active</div>
					<div class="project-stat-value">
						{project.lastActivity ? formatRelativeTime(project.lastActivity) : "—"}
					</div>
				</div>
			</div>
		</a>
	{/each}
	{#if !sorted.length && projectStore.loading}
		<div class="empty">Loading projects...</div>
	{:else if !sorted.length}
		<div class="empty">No projects found</div>
	{/if}
</div>

<style>
	.projects-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 16px;
	}
	.project-card {
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		padding: 20px;
		cursor: pointer;
		transition: border-color var(--transition), transform var(--transition);
		text-decoration: none;
		color: inherit;
		display: block;
	}
	.project-card:hover {
		border-color: var(--border-hover);
		transform: translateY(-1px);
	}
	.project-card-name {
		font-size: 15px;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 2px;
	}
	.project-card-path {
		font-size: 11.5px;
		font-family: var(--font-mono);
		color: var(--text-muted);
		margin-bottom: 14px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.project-card-stats {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: 10px;
	}
	.project-stat-label {
		font-size: 10.5px;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.project-stat-value {
		font-family: var(--font-mono);
		font-size: 14px;
		font-weight: 600;
		color: var(--text-primary);
	}
	.empty {
		font-size: 13px;
		color: var(--text-dim);
		text-align: center;
		padding: 40px;
		grid-column: 1 / -1;
	}
</style>
