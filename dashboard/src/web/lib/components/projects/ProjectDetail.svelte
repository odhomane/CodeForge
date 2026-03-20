<script lang="ts">
import ActivityHeatmap from "$lib/components/dashboard/ActivityHeatmap.svelte";
import CostChart from "$lib/components/dashboard/CostChart.svelte";
import ModelDistribution from "$lib/components/dashboard/ModelDistribution.svelte";
import OverviewCards from "$lib/components/dashboard/OverviewCards.svelte";
import ToolUsage from "$lib/components/dashboard/ToolUsage.svelte";
import TopFiles from "$lib/components/dashboard/TopFiles.svelte";
import {
	analyticsStore,
	fetchProjectAnalytics,
} from "$lib/stores/analytics.svelte.js";
import {
	fetchProjectDetail,
	projectStore,
} from "$lib/stores/projects.svelte.js";
import { formatRelativeTime } from "$lib/utils/format.js";

let { projectId }: { projectId: string } = $props();

$effect(() => {
	if (projectId) {
		fetchProjectDetail(projectId);
		fetchProjectAnalytics(projectId);
	}
});

const project = $derived(projectStore.selectedProject);
const analytics = $derived(analyticsStore.projectAnalytics[projectId] ?? null);

const totalTokens = $derived(
	project?.totalTokens
		? project.totalTokens.input + project.totalTokens.output
		: 0,
);

const cacheEff = $derived(analytics?.analytics?.cacheEfficiency ?? 0);
const cost = $derived(analytics?.totalCost ?? 0);

const modelData = $derived.by(() => {
	if (!project?.models?.length) return [];
	const count = project.models.length;
	const colors = [
		"var(--blue)",
		"var(--purple)",
		"var(--cyan)",
		"var(--green)",
		"var(--amber)",
	];
	return project.models.map((model, i) => ({
		model,
		percentage: 1 / count,
		color: colors[i % colors.length],
	}));
});

const projectCostData = $derived.by(() => {
	if (!analytics?.costOverTime) return [];
	return Object.entries(analytics.costOverTime)
		.sort((a, b) => a[0].localeCompare(b[0]))
		.map(([date, cost]) => ({ date, cost }));
});

const projectFileData = $derived(
	(analytics?.topFiles ?? [])
		.slice(0, 8)
		.map((f) => ({ path: f.path, reads: f.count, edits: 0 })),
);
</script>

{#if project}
	<div class="project-header">
		<h2 class="project-name">{project.name}</h2>
		<span class="project-path">{project.path}</span>
	</div>

	<div class="dashboard-section">
		<OverviewCards
			totalSessions={project.sessionCount}
			{totalTokens}
			totalCost={cost}
			cacheEfficiency={cacheEff}
		/>
	</div>

	<div class="dashboard-section grid-2col">
		<div class="card">
			<div class="card-header">
				<span class="card-title">Sessions</span>
				<span class="card-subtitle">{project.sessions.length} total</span>
			</div>
			<div class="session-list">
				{#each project.sessions.slice(0, 10) as session}
					<a href="/sessions/{encodeURIComponent(session.sessionId)}" class="session-row">
						<span class="session-id">{session.sessionId.slice(0, 8)}</span>
						<span class="session-msgs">{session.messageCount} msgs</span>
						<span class="session-models" title={session.models.join(", ")}>{session.models.join(", ")}</span>
						{#if session.timeRange}
							<span class="session-time">{formatRelativeTime(session.timeRange.start)}</span>
						{/if}
					</a>
				{/each}
			</div>
		</div>
		<ModelDistribution data={modelData} />
	</div>

	{#if analytics}
		<div class="dashboard-section grid-2col">
			<CostChart data={projectCostData} />
			<ToolUsage data={analytics.toolUsage ?? []} />
		</div>

		<div class="dashboard-section grid-2col">
			<ActivityHeatmap data={analytics.dailyActivity ?? {}} />
			<TopFiles data={projectFileData} />
		</div>
	{/if}

{:else}
	<div class="loading">Loading project...</div>
{/if}

<style>
	.project-header {
		margin-bottom: 24px;
	}
	.project-name {
		font-size: 22px;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 4px;
	}
	.project-path {
		font-family: var(--font-mono);
		font-size: 13px;
		color: var(--text-muted);
	}
	.dashboard-section {
		margin-bottom: 20px;
	}
	.session-list {
		display: flex;
		flex-direction: column;
	}
	.session-row {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 8px 0;
		border-bottom: 1px solid var(--border-subtle);
		text-decoration: none;
		color: inherit;
		transition: background var(--transition);
	}
	.session-row:last-child {
		border-bottom: none;
	}
	.session-row:hover {
		background: var(--accent-dim);
	}
	.session-id {
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--cyan);
		width: 70px;
		flex-shrink: 0;
	}
	.session-msgs {
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--text-muted);
		width: 60px;
		flex-shrink: 0;
	}
	.session-models {
		font-size: 12px;
		color: var(--text-secondary);
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.session-time {
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--text-dim);
		flex-shrink: 0;
	}
	.loading {
		font-size: 14px;
		color: var(--text-muted);
		padding: 40px;
		text-align: center;
	}
</style>
