<script lang="ts">
import ActivityHeatmap from "$lib/components/dashboard/ActivityHeatmap.svelte";
import CacheEfficiency from "$lib/components/dashboard/CacheEfficiency.svelte";
import CostChart from "$lib/components/dashboard/CostChart.svelte";
import DurationDistribution from "$lib/components/dashboard/DurationDistribution.svelte";
import DurationTrendChart from "$lib/components/dashboard/DurationTrendChart.svelte";
import HourlyHeatmap from "$lib/components/dashboard/HourlyHeatmap.svelte";
import InsightsBar from "$lib/components/dashboard/InsightsBar.svelte";
import ModelComparisonTable from "$lib/components/dashboard/ModelComparisonTable.svelte";
import ModelDistribution from "$lib/components/dashboard/ModelDistribution.svelte";
import OverviewCards from "$lib/components/dashboard/OverviewCards.svelte";
import ProjectCostChart from "$lib/components/dashboard/ProjectCostChart.svelte";
import RecentActivity from "$lib/components/dashboard/RecentActivity.svelte";
import SessionScatterPlot from "$lib/components/dashboard/SessionScatterPlot.svelte";
import TimeRangeSelector from "$lib/components/dashboard/TimeRangeSelector.svelte";
import TokenTrendChart from "$lib/components/dashboard/TokenTrendChart.svelte";
import ToolUsage from "$lib/components/dashboard/ToolUsage.svelte";
import TopFiles from "$lib/components/dashboard/TopFiles.svelte";
import Skeleton from "$lib/components/shared/Skeleton.svelte";
import {
	analyticsStore,
	fetchGlobalAnalytics,
} from "$lib/stores/analytics.svelte.js";
import { fetchProjects } from "$lib/stores/projects.svelte.js";

let hoverDate = $state<string | null>(null);
let timeRange = $state<string>("all");

function computeSinceDate(range: string): string | undefined {
	const days: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };
	const d = days[range];
	if (!d) return undefined;
	const date = new Date();
	date.setDate(date.getDate() - d);
	return date.toISOString();
}

$effect(() => {
	const since = computeSinceDate(timeRange);
	fetchGlobalAnalytics(since ? { since } : undefined);
	fetchProjects();
});

const ga = $derived(analyticsStore.globalAnalytics);
const isLoading = $derived(analyticsStore.loading);

const totalTokenCount = $derived(
	ga ? ga.totalTokens.input + ga.totalTokens.output : 0,
);

const costData = $derived.by(() => {
	if (!ga?.costByDay) return [];
	return Object.entries(ga.costByDay)
		.sort((a, b) => a[0].localeCompare(b[0]))
		.map(([date, cost]) => ({ date, cost }));
});

const modelData = $derived.by(() => {
	if (!ga?.modelDistribution) return [];
	const colors = [
		"var(--blue)",
		"var(--purple)",
		"var(--cyan)",
		"var(--green)",
		"var(--amber)",
	];
	return Object.entries(ga.modelDistribution).map(([model, percentage], i) => ({
		model,
		percentage,
		color: colors[i % colors.length],
	}));
});

const fileData = $derived(
	(ga?.topFiles ?? [])
		.slice(0, 8)
		.map((f) => ({ path: f.path, reads: f.count, edits: 0 })),
);

const durationData = $derived(
	Object.entries(ga?.durationBuckets ?? {}).map(([label, count]) => ({
		label,
		count,
	})),
);

const activityData = $derived(
	(ga?.recentActivity ?? []).map((r) => ({
		sessionId: r.sessionId,
		project: r.project,
		prompt: r.lastPrompt,
		duration: r.duration,
		tokens: r.tokens,
		timestamp: r.timestamp,
	})),
);

const cacheTokens = $derived({
	cacheRead: ga?.totalTokens.cacheRead ?? 0,
	cacheCreation: ga?.totalTokens.cacheCreation ?? 0,
	rawInput: ga?.totalTokens.input ?? 0,
});

const cacheSavingsEstimate = $derived(
	(ga?.totalTokens.cacheRead ?? 0) * 0.000003 * 0.9,
);

const sparklineData = $derived(
	ga?.sparklines
		? [
				ga.sparklines.sessions,
				ga.sparklines.cost,
				ga.sparklines.cost,
				ga.sparklines.cacheEfficiency,
			]
		: [],
);

// Derived data for new components
const avgCostPerSession = $derived(
	ga && ga.totalSessions > 0 ? ga.totalCost / ga.totalSessions : 0,
);

const cacheSavingsData = $derived(ga?.cacheSavings);

const insightsData = $derived(ga?.insights ?? []);

const scatterData = $derived(ga?.sessionScatter ?? []);

// Click-to-drill handlers
function handleDateClick(date: string) {
	window.location.href = `/sessions?since=${date}`;
}
function handleModelClick(model: string) {
	window.location.href = `/sessions?model=${model}`;
}
function handleProjectClick(projectId: string) {
	window.location.href = `/projects/${projectId}`;
}
function handleSessionClick(sessionId: string) {
	window.location.href = `/sessions/${sessionId}`;
}
function handleToolClick(tool: string) {
	window.location.href = `/sessions?tool=${tool}`;
}
function handleBucketClick(bucket: string) {
	window.location.href = `/sessions?duration=${bucket}`;
}
</script>

<!-- Row 0: InsightsBar -->
<div class="dashboard-section">
	<InsightsBar insights={insightsData} />
</div>

<!-- Row 1: TimeRangeSelector + KPI Cards -->
<div class="dashboard-section">
	<div class="time-range-row">
		<TimeRangeSelector value={timeRange} onChange={(v) => { timeRange = v; }} />
	</div>
	<OverviewCards
		totalSessions={ga?.totalSessions ?? 0}
		totalTokens={totalTokenCount}
		totalCost={ga?.totalCost ?? 0}
		cacheEfficiency={ga?.cacheEfficiency ?? 0}
		{avgCostPerSession}
		cacheSavingsAmount={cacheSavingsData?.savings}
		{sparklineData}
		weekOverWeek={ga?.weekOverWeek}
		loading={isLoading && !ga}
	/>
</div>

<!-- Row 2: Activity heatmap -->
<div class="dashboard-section">
	{#if isLoading && !ga}
		<div class="card"><Skeleton width="100%" height="180px" /></div>
	{:else}
		<ActivityHeatmap data={ga?.dailyActivity ?? {}} />
	{/if}
</div>

<!-- Row 3: Cost chart + Token trend chart (shared crosshair) -->
<div class="dashboard-section grid-2col">
	{#if isLoading && !ga}
		<div class="card"><Skeleton width="100%" height="220px" /></div>
		<div class="card"><Skeleton width="100%" height="220px" /></div>
	{:else}
		<CostChart
			data={costData}
			costByDayByModel={ga?.costByDayByModel}
			modelFirstSeen={ga?.modelFirstSeen}
			{hoverDate}
			onHoverDateChange={(d) => { hoverDate = d; }}
			onDateClick={handleDateClick}
		/>
		<TokenTrendChart
			data={ga?.dailyTokenBreakdown ?? {}}
			{hoverDate}
			onHoverDateChange={(d) => { hoverDate = d; }}
			onDateClick={handleDateClick}
		/>
	{/if}
</div>

<!-- Row 4: ModelComparisonTable + SessionScatterPlot -->
<div class="dashboard-section grid-2col">
	{#if isLoading && !ga}
		<div class="card"><Skeleton width="100%" height="320px" /></div>
		<div class="card"><Skeleton width="100%" height="320px" /></div>
	{:else}
		<ModelComparisonTable
			costByModel={ga?.costByModel ?? {}}
			cacheEfficiencyByModel={ga?.cacheEfficiencyByModel ?? {}}
			modelSessionCount={ga?.modelSessionCount ?? {}}
			totalCost={ga?.totalCost ?? 0}
		/>
		<SessionScatterPlot
			data={scatterData}
			onSessionClick={handleSessionClick}
		/>
	{/if}
</div>

<!-- Row 5: Project cost donut + Model distribution -->
<div class="dashboard-section grid-2col-sidebar">
	{#if isLoading && !ga}
		<div class="card"><Skeleton width="100%" height="200px" /></div>
		<div class="card"><Skeleton width="100%" height="200px" /></div>
	{:else}
		<ProjectCostChart data={ga?.costByProject ?? {}} onProjectClick={handleProjectClick} />
		<ModelDistribution data={modelData} onModelClick={handleModelClick} />
	{/if}
</div>

<!-- Row 6: Tool usage + Top files + Duration distribution -->
<div class="dashboard-section grid-3col">
	{#if isLoading && !ga}
		<div class="card"><Skeleton width="100%" height="200px" /></div>
		<div class="card"><Skeleton width="100%" height="200px" /></div>
		<div class="card"><Skeleton width="100%" height="200px" /></div>
	{:else}
		<ToolUsage data={ga?.toolUsage ?? []} onToolClick={handleToolClick} />
		<TopFiles data={fileData} />
		<DurationDistribution data={durationData} onBucketClick={handleBucketClick} />
	{/if}
</div>

<!-- Row 7: Cache efficiency + Hourly heatmap -->
<div class="dashboard-section grid-2col">
	{#if isLoading && !ga}
		<div class="card"><Skeleton width="100%" height="200px" /></div>
		<div class="card"><Skeleton width="100%" height="200px" /></div>
	{:else}
		<CacheEfficiency
			hitRate={ga?.cacheEfficiency ?? 0}
			tokens={cacheTokens}
			savings={cacheSavingsEstimate}
			dailyEfficiency={ga?.dailyCacheEfficiency}
			cacheSavings={cacheSavingsData}
		/>
		<HourlyHeatmap data={ga?.hourlyActivity ?? {}} />
	{/if}
</div>

<!-- Row 8: Duration trend + Recent activity -->
<div class="dashboard-section grid-2col">
	{#if isLoading && !ga}
		<div class="card"><Skeleton width="100%" height="220px" /></div>
		<div class="card"><Skeleton width="100%" height="220px" /></div>
	{:else}
		<DurationTrendChart data={ga?.dailyAvgDuration ?? {}} onDateClick={handleDateClick} />
		<RecentActivity data={activityData} />
	{/if}
</div>

<style>
	.dashboard-section {
		margin-bottom: 20px;
	}
	.time-range-row {
		margin-bottom: 12px;
	}
</style>
