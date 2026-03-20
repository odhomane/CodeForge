import "../../../../chunks/index-server.js";
import "../../../../chunks/environment.js";
import "../../../../chunks/shared.js";
import "../../../../chunks/exports.js";
import { E as escape_html, a as derived, o as ensure_array_like, u as stringify, w as attr } from "../../../../chunks/server.js";
import "../../../../chunks/internal.js";
import "../../../../chunks/client.js";
import { t as page } from "../../../../chunks/state.js";
import { t as analyticsStore } from "../../../../chunks/analytics.svelte.js";
import { t as projectStore } from "../../../../chunks/projects.svelte.js";
import { a as ModelDistribution, n as ToolUsage, o as CostChart, r as OverviewCards, t as TopFiles, y as ActivityHeatmap } from "../../../../chunks/TopFiles.js";
import { i as formatRelativeTime } from "../../../../chunks/format.js";
//#region src/web/lib/components/projects/ProjectDetail.svelte
function ProjectDetail($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { projectId } = $$props;
		const project = derived(() => projectStore.selectedProject);
		const analytics = derived(() => analyticsStore.projectAnalytics[projectId] ?? null);
		const totalTokens = derived(() => project()?.totalTokens ? project().totalTokens.input + project().totalTokens.output : 0);
		const cacheEff = derived(() => analytics()?.analytics?.cacheEfficiency ?? 0);
		const cost = derived(() => analytics()?.totalCost ?? 0);
		const modelData = derived(() => {
			if (!project()?.models?.length) return [];
			const count = project().models.length;
			const colors = [
				"var(--blue)",
				"var(--purple)",
				"var(--cyan)",
				"var(--green)",
				"var(--amber)"
			];
			return project().models.map((model, i) => ({
				model,
				percentage: 1 / count,
				color: colors[i % colors.length]
			}));
		});
		const projectCostData = derived(() => {
			if (!analytics()?.costOverTime) return [];
			return Object.entries(analytics().costOverTime).sort((a, b) => a[0].localeCompare(b[0])).map(([date, cost]) => ({
				date,
				cost
			}));
		});
		const projectFileData = derived(() => (analytics()?.topFiles ?? []).slice(0, 8).map((f) => ({
			path: f.path,
			reads: f.count,
			edits: 0
		})));
		if (project()) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="project-header svelte-q3i5h0"><h2 class="project-name svelte-q3i5h0">${escape_html(project().name)}</h2> <span class="project-path svelte-q3i5h0">${escape_html(project().path)}</span></div> <div class="dashboard-section svelte-q3i5h0">`);
			OverviewCards($$renderer, {
				totalSessions: project().sessionCount,
				totalTokens: totalTokens(),
				totalCost: cost(),
				cacheEfficiency: cacheEff()
			});
			$$renderer.push(`<!----></div> <div class="dashboard-section grid-2col svelte-q3i5h0"><div class="card"><div class="card-header"><span class="card-title">Sessions</span> <span class="card-subtitle">${escape_html(project().sessions.length)} total</span></div> <div class="session-list svelte-q3i5h0"><!--[-->`);
			const each_array = ensure_array_like(project().sessions.slice(0, 10));
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let session = each_array[$$index];
				$$renderer.push(`<a${attr("href", `/sessions/${stringify(encodeURIComponent(session.sessionId))}`)} class="session-row svelte-q3i5h0"><span class="session-id svelte-q3i5h0">${escape_html(session.sessionId.slice(0, 8))}</span> <span class="session-msgs svelte-q3i5h0">${escape_html(session.messageCount)} msgs</span> <span class="session-models svelte-q3i5h0"${attr("title", session.models.join(", "))}>${escape_html(session.models.join(", "))}</span> `);
				if (session.timeRange) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<span class="session-time svelte-q3i5h0">${escape_html(formatRelativeTime(session.timeRange.start))}</span>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></a>`);
			}
			$$renderer.push(`<!--]--></div></div> `);
			ModelDistribution($$renderer, { data: modelData() });
			$$renderer.push(`<!----></div> `);
			if (analytics()) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div class="dashboard-section grid-2col svelte-q3i5h0">`);
				CostChart($$renderer, { data: projectCostData() });
				$$renderer.push(`<!----> `);
				ToolUsage($$renderer, { data: analytics().toolUsage ?? [] });
				$$renderer.push(`<!----></div> <div class="dashboard-section grid-2col svelte-q3i5h0">`);
				ActivityHeatmap($$renderer, { data: analytics().dailyActivity ?? {} });
				$$renderer.push(`<!----> `);
				TopFiles($$renderer, { data: projectFileData() });
				$$renderer.push(`<!----></div>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]-->`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div class="loading svelte-q3i5h0">Loading project...</div>`);
		}
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
//#region src/web/routes/projects/[project]/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		ProjectDetail($$renderer, { projectId: derived(() => page.params.project)() });
	});
}
//#endregion
export { _page as default };
