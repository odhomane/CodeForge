import "../../chunks/index-server.js";
import "../../chunks/environment.js";
import "../../chunks/shared.js";
import "../../chunks/exports.js";
import { E as escape_html, a as derived, f as html, o as ensure_array_like, t as attr_class, u as stringify, w as attr } from "../../chunks/server.js";
import "../../chunks/internal.js";
import "../../chunks/client.js";
import { t as page } from "../../chunks/state.js";
import "../../chunks/navigation.js";
import "../../chunks/analytics.svelte.js";
import "../../chunks/context.svelte.js";
import "../../chunks/memory.svelte.js";
import "../../chunks/plans.svelte.js";
import "../../chunks/projects.svelte.js";
import "../../chunks/sessions.svelte.js";
import "../../chunks/tasks.svelte.js";
//#region src/web/lib/components/layout/Sidebar.svelte
function Sidebar($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		const navItems = [
			{
				label: "Dashboard",
				href: "/",
				icon: "home"
			},
			{
				label: "Sessions",
				href: "/sessions",
				icon: "list"
			},
			{
				label: "Plans",
				href: "/plans",
				icon: "plan"
			},
			{
				label: "Tasks",
				href: "/tasks",
				icon: "tasks"
			},
			{
				label: "Agents",
				href: "/agents",
				icon: "agents"
			},
			{
				label: "Context",
				href: "/context",
				icon: "context"
			},
			{
				label: "Memories",
				href: "/memories",
				icon: "memory"
			},
			{
				label: "Projects",
				href: "/projects",
				icon: "folder"
			}
		];
		$$renderer.push(`<aside class="sidebar svelte-pklxzk"><div class="logo svelte-pklxzk"><span class="logo-mark svelte-pklxzk">CF</span> <span class="logo-text svelte-pklxzk">CodeForge</span></div> <nav class="nav svelte-pklxzk"><!--[-->`);
		const each_array = ensure_array_like(navItems);
		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let item = each_array[$$index];
			$$renderer.push(`<a${attr("href", item.href)}${attr_class("nav-item svelte-pklxzk", void 0, { "active": page.url.pathname === item.href || item.href !== "/" && page.url.pathname.startsWith(item.href) })}>${escape_html(item.label)}</a>`);
		}
		$$renderer.push(`<!--]--></nav> <div class="footer svelte-pklxzk"><div class="status svelte-pklxzk"><span class="status-dot svelte-pklxzk"></span> <span class="status-text svelte-pklxzk">Connected</span></div></div></aside>`);
	});
}
//#endregion
//#region src/web/lib/stores/search.svelte.ts
var searchStore = {
	query: "",
	results: [],
	loading: false,
	error: null,
	filters: {
		project: "",
		role: "",
		since: ""
	},
	meta: {
		total: 0,
		limit: 20,
		offset: 0,
		hasMore: false
	},
	isOpen: false
};
//#endregion
//#region src/web/lib/components/SearchModal.svelte
function SearchModal($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let highlightedIndex = -1;
		if (searchStore.isOpen) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="search-backdrop svelte-12z409m" role="dialog" aria-label="Search messages"><div class="search-modal svelte-12z409m"><input class="search-modal-input svelte-12z409m" type="text" placeholder="Search messages..."${attr("value", searchStore.query)}/> <div class="search-filters svelte-12z409m"><button${attr_class("filter-btn svelte-12z409m", void 0, { "active": searchStore.filters.role === "" })}>All</button> <button${attr_class("filter-btn svelte-12z409m", void 0, { "active": searchStore.filters.role === "user" })}>User</button> <button${attr_class("filter-btn svelte-12z409m", void 0, { "active": searchStore.filters.role === "assistant" })}>Assistant</button></div> `);
			if (searchStore.loading) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div class="search-status svelte-12z409m">Searching...</div>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if (searchStore.meta.total > 0) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div class="search-count svelte-12z409m">${escape_html(searchStore.meta.total)} results</div>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> <div class="search-results svelte-12z409m"><!--[-->`);
			const each_array = ensure_array_like(searchStore.results);
			for (let i = 0, $$length = each_array.length; i < $$length; i++) {
				let result = each_array[i];
				$$renderer.push(`<button${attr_class("search-result-item svelte-12z409m", void 0, { "highlighted": i === highlightedIndex })}><div class="result-header svelte-12z409m"><span${attr_class(`type-badge ${stringify(result.type)}`, "svelte-12z409m")}>${escape_html(result.type)}</span> <span class="result-meta svelte-12z409m">${escape_html(result.sessionId.slice(0, 8))}… · ${escape_html(new Date(result.timestamp).toLocaleDateString())}</span></div> <div class="result-excerpt svelte-12z409m">${html(result.excerpt)}</div></button>`);
			}
			$$renderer.push(`<!--]--> `);
			if (searchStore.meta.hasMore) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<button class="load-more svelte-12z409m">Load more</button>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if (!searchStore.loading && searchStore.query && searchStore.results.length === 0) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div class="search-empty svelte-12z409m">No results found</div>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div></div></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
//#region src/web/lib/components/layout/TopBar.svelte
function TopBar($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let breadcrumbs = derived(() => () => {
			const path = page.url.pathname;
			if (path === "/") return [{
				label: "Dashboard",
				href: "/"
			}];
			const segments = path.split("/").filter(Boolean);
			const crumbs = [{
				label: "Dashboard",
				href: "/"
			}];
			let href = "";
			for (const seg of segments) {
				href += `/${seg}`;
				crumbs.push({
					label: seg.charAt(0).toUpperCase() + seg.slice(1),
					href
				});
			}
			return crumbs;
		});
		$$renderer.push(`<header class="topbar svelte-sacl9c"><nav class="breadcrumbs svelte-sacl9c"><!--[-->`);
		const each_array = ensure_array_like(breadcrumbs()());
		for (let i = 0, $$length = each_array.length; i < $$length; i++) {
			let crumb = each_array[i];
			if (i > 0) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<span class="separator svelte-sacl9c">/</span>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> <a${attr("href", crumb.href)}${attr_class("crumb svelte-sacl9c", void 0, { "current": i === breadcrumbs()().length - 1 })}>${escape_html(crumb.label)}</a>`);
		}
		$$renderer.push(`<!--]--></nav> <button class="search-trigger svelte-sacl9c">Search messages... <kbd class="svelte-sacl9c">⌘K</kbd></button></header> `);
		SearchModal($$renderer, {});
		$$renderer.push(`<!---->`);
	});
}
//#endregion
//#region src/web/routes/+layout.svelte
function _layout($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { children } = $$props;
		$$renderer.push(`<div class="app svelte-1luapna">`);
		Sidebar($$renderer, {});
		$$renderer.push(`<!----> `);
		TopBar($$renderer, {});
		$$renderer.push(`<!----> <main class="main svelte-1luapna">`);
		children($$renderer);
		$$renderer.push(`<!----></main></div>`);
	});
}
//#endregion
export { _layout as default };
