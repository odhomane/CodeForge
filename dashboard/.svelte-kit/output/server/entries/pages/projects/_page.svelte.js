import { E as escape_html, a as derived, o as ensure_array_like, u as stringify, w as attr } from "../../../chunks/server.js";
import { t as projectStore } from "../../../chunks/projects.svelte.js";
import { a as formatTokens, i as formatRelativeTime } from "../../../chunks/format.js";
//#region src/web/lib/components/projects/ProjectList.svelte
function ProjectList($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const sorted = derived(() => [...projectStore.projects].sort((a, b) => {
			if (!a.lastActivity && !b.lastActivity) return 0;
			if (!a.lastActivity) return 1;
			if (!b.lastActivity) return -1;
			return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
		}));
		$$renderer.push(`<div class="projects-grid svelte-uzzgmb"><!--[-->`);
		const each_array = ensure_array_like(sorted());
		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let project = each_array[$$index];
			$$renderer.push(`<a${attr("href", `/projects/${stringify(encodeURIComponent(project.id))}`)} class="project-card svelte-uzzgmb"><div class="project-card-name svelte-uzzgmb">${escape_html(project.name)}</div> <div class="project-card-path svelte-uzzgmb"${attr("title", project.path)}>${escape_html(project.path)}</div> <div class="project-card-stats svelte-uzzgmb"><div><div class="project-stat-label svelte-uzzgmb">Sessions</div> <div class="project-stat-value svelte-uzzgmb">${escape_html(project.sessionCount)}</div></div> <div><div class="project-stat-label svelte-uzzgmb">Tokens</div> <div class="project-stat-value svelte-uzzgmb">${escape_html(project.totalTokens ? formatTokens(project.totalTokens.input + project.totalTokens.output) : "—")}</div></div> <div><div class="project-stat-label svelte-uzzgmb">Last Active</div> <div class="project-stat-value svelte-uzzgmb">${escape_html(project.lastActivity ? formatRelativeTime(project.lastActivity) : "—")}</div></div></div></a>`);
		}
		$$renderer.push(`<!--]--> `);
		if (!sorted().length && projectStore.loading) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="empty svelte-uzzgmb">Loading projects...</div>`);
		} else if (!sorted().length) {
			$$renderer.push("<!--[1-->");
			$$renderer.push(`<div class="empty svelte-uzzgmb">No projects found</div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div>`);
	});
}
//#endregion
//#region src/web/routes/projects/+page.svelte
function _page($$renderer) {
	$$renderer.push(`<h1 class="page-title svelte-5gybis">Projects</h1> `);
	ProjectList($$renderer, {});
	$$renderer.push(`<!---->`);
}
//#endregion
export { _page as default };
