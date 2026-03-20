import "../../../chunks/index-server.js";
import "../../../chunks/environment.js";
import "../../../chunks/shared.js";
import "../../../chunks/exports.js";
import { E as escape_html, a as derived, o as ensure_array_like, t as attr_class, u as stringify, w as attr } from "../../../chunks/server.js";
import "../../../chunks/internal.js";
import "../../../chunks/client.js";
import "../../../chunks/state.js";
import "../../../chunks/navigation.js";
import { n as sessionStore, r as setFilters, t as fetchSessions } from "../../../chunks/sessions.svelte.js";
import { a as formatTokens, i as formatRelativeTime, o as truncateText, r as formatDuration, t as formatCost } from "../../../chunks/format.js";
import { t as formatModelName } from "../../../chunks/pricing.js";
//#region src/web/lib/components/sessions/SessionList.svelte
function SessionList($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const PAGE_SIZE = 25;
		let currentPage = 0;
		let highlightedIndex = -1;
		let totalPages = derived(() => Math.max(1, Math.ceil(sessionStore.totalCount / PAGE_SIZE)));
		/** Unique project names from loaded sessions */
		let projectOptions = derived(() => {
			const projects = /* @__PURE__ */ new Set();
			for (const s of sessionStore.sessions) if (s.project) projects.add(s.project);
			return Array.from(projects).sort();
		});
		/** Unique model names from loaded sessions */
		let modelOptions = derived(() => {
			const models = /* @__PURE__ */ new Set();
			for (const s of sessionStore.sessions) if (s.meta?.models) for (const m of s.meta.models) models.add(m);
			return Array.from(models).sort();
		});
		function onProjectChange(e) {
			const val = e.target.value;
			setFilters({ project: val });
			currentPage = 0;
			fetchSessions({
				project: val || void 0,
				model: sessionStore.filters.model || void 0,
				since: sessionStore.filters.since || void 0,
				limit: PAGE_SIZE,
				offset: 0
			});
		}
		function onModelChange(e) {
			const val = e.target.value;
			setFilters({ model: val });
			currentPage = 0;
			fetchSessions({
				project: sessionStore.filters.project || void 0,
				model: val || void 0,
				since: sessionStore.filters.since || void 0,
				limit: PAGE_SIZE,
				offset: 0
			});
		}
		function totalTokensForSession(s) {
			if (!s.meta) return 0;
			const t = s.meta.totalTokens;
			return t.input + t.output + t.cacheRead + t.cacheCreation;
		}
		function durationForSession(s) {
			if (!s.meta?.timeRange) return 0;
			return new Date(s.meta.timeRange.end).getTime() - new Date(s.meta.timeRange.start).getTime();
		}
		$$renderer.push(`<div class="session-list svelte-2u6vel"><div class="filters-bar svelte-2u6vel">`);
		$$renderer.select({
			class: "filter-select",
			value: sessionStore.filters.project,
			onchange: onProjectChange
		}, ($$renderer) => {
			$$renderer.option({
				value: "",
				class: ""
			}, ($$renderer) => {
				$$renderer.push(`All Projects`);
			}, "svelte-2u6vel");
			$$renderer.push(`<!--[-->`);
			const each_array = ensure_array_like(projectOptions());
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let proj = each_array[$$index];
				$$renderer.option({
					value: proj,
					class: ""
				}, ($$renderer) => {
					$$renderer.push(`${escape_html(proj)}`);
				}, "svelte-2u6vel");
			}
			$$renderer.push(`<!--]-->`);
		}, "svelte-2u6vel");
		$$renderer.push(` `);
		$$renderer.select({
			class: "filter-select",
			value: sessionStore.filters.model,
			onchange: onModelChange
		}, ($$renderer) => {
			$$renderer.option({
				value: "",
				class: ""
			}, ($$renderer) => {
				$$renderer.push(`All Models`);
			}, "svelte-2u6vel");
			$$renderer.push(`<!--[-->`);
			const each_array_1 = ensure_array_like(modelOptions());
			for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
				let model = each_array_1[$$index_1];
				$$renderer.option({
					value: model,
					class: ""
				}, ($$renderer) => {
					$$renderer.push(`${escape_html(formatModelName(model))}`);
				}, "svelte-2u6vel");
			}
			$$renderer.push(`<!--]-->`);
		}, "svelte-2u6vel");
		$$renderer.push(` <input class="filter-date svelte-2u6vel" type="date"${attr("value", sessionStore.filters.since)} title="Show sessions since this date"/></div> `);
		if (sessionStore.error) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="error-banner svelte-2u6vel">${escape_html(sessionStore.error)}</div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (sessionStore.loading) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="loading-state svelte-2u6vel">Loading sessions...</div>`);
		} else if (sessionStore.sessions.length === 0) {
			$$renderer.push("<!--[1-->");
			$$renderer.push(`<div class="empty-state svelte-2u6vel">No sessions found.</div>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div class="sessions-table-wrap svelte-2u6vel"><table class="sessions-table svelte-2u6vel"><thead class="svelte-2u6vel"><tr class="svelte-2u6vel"><th class="svelte-2u6vel">Session ID</th><th class="svelte-2u6vel">Project</th><th class="svelte-2u6vel">Last Prompt</th><th class="svelte-2u6vel">Model</th><th class="svelte-2u6vel">Tokens</th><th class="svelte-2u6vel">Cost</th><th class="svelte-2u6vel">Duration</th><th class="svelte-2u6vel">Time</th></tr></thead><tbody class="svelte-2u6vel"><!--[-->`);
			const each_array_2 = ensure_array_like(sessionStore.sessions);
			for (let i = 0, $$length = each_array_2.length; i < $$length; i++) {
				let session = each_array_2[i];
				$$renderer.push(`<tr${attr_class("svelte-2u6vel", void 0, { "highlighted": i === highlightedIndex })}><td class="td-mono svelte-2u6vel">`);
				if (session.isActive) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<span class="active-dot svelte-2u6vel" title="Session is active"></span>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> ${escape_html(session.sessionId.slice(0, 8))} `);
				if (session.hasPlan) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<span class="plan-indicator svelte-2u6vel"${attr("title", `Has plan: ${stringify(session.planSlug ?? "plan")}`)} role="link" tabindex="0"><svg class="plan-icon svelte-2u6vel" viewBox="0 0 14 16" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="0.5" width="12" height="15" rx="1.5" stroke="currentColor" stroke-width="1.5" class="svelte-2u6vel"></rect><line x1="4" y1="4.5" x2="10" y2="4.5" stroke="currentColor" stroke-width="1" class="svelte-2u6vel"></line><line x1="4" y1="7.5" x2="10" y2="7.5" stroke="currentColor" stroke-width="1" class="svelte-2u6vel"></line><line x1="4" y1="10.5" x2="8" y2="10.5" stroke="currentColor" stroke-width="1" class="svelte-2u6vel"></line></svg> <span class="plan-slug-text svelte-2u6vel">${escape_html(session.planSlug ?? "plan")}</span></span>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> `);
				if (session.hasTeam) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<span class="team-indicator svelte-2u6vel"${attr("title", `Team: ${stringify(session.teamName ?? "team")}`)} role="link" tabindex="0"><svg class="team-icon svelte-2u6vel" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="3" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.2" class="svelte-2u6vel"></rect><rect x="9" y="3" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.2" class="svelte-2u6vel"></rect><rect x="5" y="9" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.2" class="svelte-2u6vel"></rect></svg> <span class="team-name-text svelte-2u6vel">${escape_html(session.teamName ?? "team")}</span></span>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></td><td class="svelte-2u6vel">`);
				if (session.project) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<span class="project-tag svelte-2u6vel">${escape_html(session.project)}</span>`);
				} else {
					$$renderer.push("<!--[-1-->");
					$$renderer.push(`<span class="td-muted svelte-2u6vel">-</span>`);
				}
				$$renderer.push(`<!--]--></td><td class="td-prompt svelte-2u6vel"${attr("title", session.lastPrompt ?? "")}>${escape_html(session.lastPrompt ? truncateText(session.lastPrompt, 80) : "-")}</td><td class="td-mono svelte-2u6vel">${escape_html(session.meta?.models?.[0] ? formatModelName(session.meta.models[0]) : "-")}</td><td class="td-mono svelte-2u6vel">${escape_html(formatTokens(totalTokensForSession(session)))}</td><td class="td-cost svelte-2u6vel">${escape_html(session.cost ? formatCost(session.cost.totalCost) : "-")}</td><td class="td-muted svelte-2u6vel">${escape_html(formatDuration(durationForSession(session)))}</td><td class="td-muted svelte-2u6vel">${escape_html(formatRelativeTime(session.timestamps.last))}</td></tr>`);
			}
			$$renderer.push(`<!--]--></tbody></table></div> <div class="pagination svelte-2u6vel"><button class="page-btn svelte-2u6vel"${attr("disabled", currentPage === 0, true)}>Previous</button> <span class="page-info svelte-2u6vel">Page ${escape_html(currentPage + 1)} of ${escape_html(totalPages())} (${escape_html(sessionStore.totalCount)} total)</span> <button class="page-btn svelte-2u6vel"${attr("disabled", currentPage >= totalPages() - 1, true)}>Next</button></div>`);
		}
		$$renderer.push(`<!--]--></div>`);
	});
}
//#endregion
//#region src/web/routes/sessions/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		SessionList($$renderer, {});
	});
}
//#endregion
export { _page as default };
