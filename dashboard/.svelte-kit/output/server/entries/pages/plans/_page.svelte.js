import "../../../chunks/index-server.js";
import "../../../chunks/environment.js";
import "../../../chunks/shared.js";
import "../../../chunks/exports.js";
import { E as escape_html, f as html, o as ensure_array_like, t as attr_class, w as attr } from "../../../chunks/server.js";
import "../../../chunks/internal.js";
import "../../../chunks/client.js";
import "../../../chunks/navigation.js";
import { t as planStore } from "../../../chunks/plans.svelte.js";
import { a as formatTokens, i as formatRelativeTime } from "../../../chunks/format.js";
import "../../../chunks/markdown.js";
//#region src/web/lib/components/plans/PlansList.svelte
function PlansList($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let highlightedIndex = -1;
		let expandedSlug = null;
		let renderedContent = {};
		let loadingContent = {};
		$$renderer.push(`<div class="plans-list svelte-2yh3jg">`);
		if (planStore.error) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="error-banner svelte-2yh3jg">${escape_html(planStore.error)}</div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (planStore.loading) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="loading-state svelte-2yh3jg">Loading plans...</div>`);
		} else if (planStore.plans.length === 0) {
			$$renderer.push("<!--[1-->");
			$$renderer.push(`<div class="empty-state svelte-2yh3jg">No plans found.</div>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div class="table-wrap svelte-2yh3jg"><table class="plans-table svelte-2yh3jg"><thead><tr><th class="svelte-2yh3jg">Title</th><th class="svelte-2yh3jg">Slug</th><th class="svelte-2yh3jg">Sessions</th><th class="svelte-2yh3jg">Tokens</th><th class="svelte-2yh3jg">Last Used</th></tr></thead><tbody class="svelte-2yh3jg"><!--[-->`);
			const each_array = ensure_array_like(planStore.plans);
			for (let i = 0, $$length = each_array.length; i < $$length; i++) {
				let plan = each_array[i];
				$$renderer.push(`<tr${attr_class("svelte-2yh3jg", void 0, {
					"highlighted": i === highlightedIndex,
					"orphan": plan.sessions.length === 0
				})}><td class="td-title svelte-2yh3jg"${attr("title", plan.title)}>${escape_html(plan.title)}</td><td class="td-mono svelte-2yh3jg">${escape_html(plan.slug)}</td><td class="td-mono svelte-2yh3jg">${escape_html(plan.sessions.length)}</td><td class="td-mono svelte-2yh3jg">~${escape_html(formatTokens(plan.estimatedTokens))}</td><td class="td-muted svelte-2yh3jg">${escape_html(plan.lastUsed ? formatRelativeTime(plan.lastUsed) : "Never")}</td></tr> `);
				if (expandedSlug === plan.slug) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<tr class="expanded-row svelte-2yh3jg"><td colspan="5" class="svelte-2yh3jg"><div class="expanded-content svelte-2yh3jg">`);
					if (plan.sessions.length > 0) {
						$$renderer.push("<!--[0-->");
						$$renderer.push(`<div class="sessions-section"><h4 class="section-label svelte-2yh3jg">Linked Sessions</h4> <div class="session-links svelte-2yh3jg"><!--[-->`);
						const each_array_1 = ensure_array_like(plan.sessions);
						for (let $$index = 0, $$length = each_array_1.length; $$index < $$length; $$index++) {
							let session = each_array_1[$$index];
							$$renderer.push(`<button class="session-link svelte-2yh3jg"><span class="session-id svelte-2yh3jg">${escape_html(session.sessionId.slice(0, 8))}</span> <span class="session-project svelte-2yh3jg">${escape_html(session.project)}</span> <span class="session-time svelte-2yh3jg">${escape_html(formatRelativeTime(session.lastActivity))}</span></button>`);
						}
						$$renderer.push(`<!--]--></div></div>`);
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--> <div class="plan-content svelte-2yh3jg"><h4 class="section-label svelte-2yh3jg">Plan Content</h4> `);
					if (loadingContent[plan.slug]) {
						$$renderer.push("<!--[0-->");
						$$renderer.push(`<span class="loading-text svelte-2yh3jg">Loading content...</span>`);
					} else if (renderedContent[plan.slug]) {
						$$renderer.push("<!--[1-->");
						$$renderer.push(`<div class="rendered-markdown">${html(renderedContent[plan.slug])}</div>`);
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--></div></div></td></tr>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]-->`);
			}
			$$renderer.push(`<!--]--></tbody></table></div>`);
		}
		$$renderer.push(`<!--]--></div>`);
	});
}
//#endregion
//#region src/web/routes/plans/+page.svelte
function _page($$renderer) {
	$$renderer.push(`<h1 class="page-title svelte-cw40vg">Plans</h1> `);
	PlansList($$renderer, {});
	$$renderer.push(`<!---->`);
}
//#endregion
export { _page as default };
