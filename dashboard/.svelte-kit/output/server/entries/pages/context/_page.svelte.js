import "../../../chunks/index-server.js";
import "../../../chunks/environment.js";
import "../../../chunks/shared.js";
import "../../../chunks/exports.js";
import { E as escape_html, a as derived, f as html, n as attr_style, o as ensure_array_like, t as attr_class, u as stringify, w as attr } from "../../../chunks/server.js";
import "../../../chunks/internal.js";
import "../../../chunks/client.js";
import "../../../chunks/navigation.js";
import { t as contextStore } from "../../../chunks/context.svelte.js";
import { a as formatTokens } from "../../../chunks/format.js";
import "../../../chunks/markdown.js";
//#region src/web/lib/components/context/ContextFilesList.svelte
function ContextFilesList($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let highlightedIndex = -1;
		let expandedPath = null;
		let renderedContent = {};
		let scopeFilter = "all";
		function scopeColor(scope) {
			switch (scope) {
				case "user": return "#a78bfa";
				case "project": return "#22d3ee";
				case "auto-memory": return "#4ade80";
				case "user-rules": return "#fbbf24";
				case "project-rules": return "#f59e0b";
				default: return "#a8a29e";
			}
		}
		function scopeBg(scope) {
			switch (scope) {
				case "user": return "rgba(167, 139, 250, 0.15)";
				case "project": return "rgba(34, 211, 238, 0.15)";
				case "auto-memory": return "rgba(74, 222, 128, 0.15)";
				case "user-rules": return "rgba(251, 191, 36, 0.15)";
				case "project-rules": return "rgba(245, 158, 11, 0.15)";
				default: return "rgba(168, 162, 158, 0.15)";
			}
		}
		let filteredFiles = derived(() => scopeFilter === "all" ? contextStore.files : contextStore.files.filter((f) => f.scope === scopeFilter));
		function onScopeChange(e) {
			scopeFilter = e.target.value;
			highlightedIndex = -1;
			expandedPath = null;
		}
		$$renderer.push(`<div class="context-list svelte-uao05t"><div class="filters-bar svelte-uao05t">`);
		$$renderer.select({
			class: "filter-select",
			value: scopeFilter,
			onchange: onScopeChange
		}, ($$renderer) => {
			$$renderer.option({
				value: "all",
				class: ""
			}, ($$renderer) => {
				$$renderer.push(`All Scopes`);
			}, "svelte-uao05t");
			$$renderer.option({
				value: "user",
				class: ""
			}, ($$renderer) => {
				$$renderer.push(`User`);
			}, "svelte-uao05t");
			$$renderer.option({
				value: "project",
				class: ""
			}, ($$renderer) => {
				$$renderer.push(`Project`);
			}, "svelte-uao05t");
			$$renderer.option({
				value: "auto-memory",
				class: ""
			}, ($$renderer) => {
				$$renderer.push(`Auto-memory`);
			}, "svelte-uao05t");
			$$renderer.option({
				value: "user-rules",
				class: ""
			}, ($$renderer) => {
				$$renderer.push(`User Rules`);
			}, "svelte-uao05t");
			$$renderer.option({
				value: "project-rules",
				class: ""
			}, ($$renderer) => {
				$$renderer.push(`Project Rules`);
			}, "svelte-uao05t");
		}, "svelte-uao05t");
		$$renderer.push(`</div> `);
		if (contextStore.error) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="error-banner svelte-uao05t">${escape_html(contextStore.error)}</div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (contextStore.loading) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="loading-state svelte-uao05t">Loading context files...</div>`);
		} else if (filteredFiles().length === 0) {
			$$renderer.push("<!--[1-->");
			$$renderer.push(`<div class="empty-state svelte-uao05t">No context files found.</div>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div class="table-wrap svelte-uao05t"><table class="context-table svelte-uao05t"><thead><tr><th class="svelte-uao05t">Filename</th><th class="svelte-uao05t">Scope</th><th class="svelte-uao05t">Path</th><th class="svelte-uao05t">Projects</th><th class="svelte-uao05t">Sessions</th><th class="svelte-uao05t">Tokens</th></tr></thead><tbody class="svelte-uao05t"><!--[-->`);
			const each_array = ensure_array_like(filteredFiles());
			for (let i = 0, $$length = each_array.length; i < $$length; i++) {
				let file = each_array[i];
				$$renderer.push(`<tr${attr_class("svelte-uao05t", void 0, { "highlighted": i === highlightedIndex })}><td class="td-filename svelte-uao05t">${escape_html(file.filename)}</td><td class="svelte-uao05t"><span class="scope-badge svelte-uao05t"${attr_style(`color:${stringify(scopeColor(file.scope))};background:${stringify(scopeBg(file.scope))}`)}>${escape_html(file.scope)}</span></td><td class="td-path svelte-uao05t"${attr("title", file.path)}>${escape_html(file.path)}</td><td class="td-projects svelte-uao05t"><!--[-->`);
				const each_array_1 = ensure_array_like(file.projects);
				for (let pi = 0, $$length = each_array_1.length; pi < $$length; pi++) {
					let proj = each_array_1[pi];
					$$renderer.push(`<button class="project-link svelte-uao05t">${escape_html(proj.name)}</button>`);
					if (pi < file.projects.length - 1) {
						$$renderer.push("<!--[0-->");
						$$renderer.push(`, `);
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]-->`);
				}
				$$renderer.push(`<!--]--></td><td class="td-mono svelte-uao05t">${escape_html(file.totalSessions)}</td><td class="td-mono svelte-uao05t">~${escape_html(formatTokens(file.estimatedTokens))}</td></tr> `);
				if (expandedPath === file.path) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<tr class="expanded-row svelte-uao05t"><td colspan="6" class="svelte-uao05t"><div class="expanded-content rendered-markdown svelte-uao05t">`);
					if (renderedContent[file.path]) {
						$$renderer.push("<!--[0-->");
						$$renderer.push(`${html(renderedContent[file.path])}`);
					} else {
						$$renderer.push("<!--[-1-->");
						$$renderer.push(`<span class="loading-text svelte-uao05t">Rendering...</span>`);
					}
					$$renderer.push(`<!--]--></div></td></tr>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]-->`);
			}
			$$renderer.push(`<!--]--></tbody></table></div>`);
		}
		$$renderer.push(`<!--]--></div>`);
	});
}
//#endregion
//#region src/web/routes/context/+page.svelte
function _page($$renderer) {
	$$renderer.push(`<h1 class="page-title svelte-1iphacn">Context</h1> `);
	ContextFilesList($$renderer, {});
	$$renderer.push(`<!---->`);
}
//#endregion
export { _page as default };
