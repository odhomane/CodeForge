import "../../../chunks/index-server.js";
import "../../../chunks/environment.js";
import "../../../chunks/shared.js";
import "../../../chunks/exports.js";
import { E as escape_html, o as ensure_array_like, t as attr_class } from "../../../chunks/server.js";
import "../../../chunks/internal.js";
import "../../../chunks/client.js";
import "../../../chunks/navigation.js";
//#region src/web/lib/stores/agents.svelte.ts
var agentStore = {
	byType: [],
	recent: [],
	totalCount: 0,
	loading: false,
	error: null
};
//#endregion
//#region src/web/lib/components/agents/AgentsList.svelte
function AgentsList($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let selectedIndex = 0;
		function formatTokens(n) {
			if (!n) return "0";
			if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
			if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
			return String(n);
		}
		function formatDuration(start, end) {
			if (!start) return "—";
			const s = new Date(start).getTime();
			const e = end ? new Date(end).getTime() : Date.now();
			const sec = Math.round((e - s) / 1e3);
			if (sec < 60) return `${sec}s`;
			const min = Math.floor(sec / 60);
			if (min < 60) return `${min}m ${sec % 60}s`;
			return `${Math.floor(min / 60)}h ${min % 60}m`;
		}
		function timeAgo(ts) {
			if (!ts) return "—";
			const diff = Date.now() - new Date(ts).getTime();
			const mins = Math.floor(diff / 6e4);
			if (mins < 60) return `${mins}m ago`;
			const hrs = Math.floor(mins / 60);
			if (hrs < 24) return `${hrs}h ago`;
			return `${Math.floor(hrs / 24)}d ago`;
		}
		$$renderer.push(`<div class="agents-page svelte-uz3ii2">`);
		if (agentStore.loading) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="loading-state svelte-uz3ii2">Loading agents...</div>`);
		} else if (agentStore.error) {
			$$renderer.push("<!--[1-->");
			$$renderer.push(`<div class="error-banner svelte-uz3ii2">${escape_html(agentStore.error)}</div>`);
		} else {
			$$renderer.push("<!--[-1-->");
			if (agentStore.byType.length > 0) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div class="type-breakdown svelte-uz3ii2"><h2 class="svelte-uz3ii2">By Type</h2> <div class="type-cards svelte-uz3ii2"><!--[-->`);
				const each_array = ensure_array_like(agentStore.byType);
				for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
					let t = each_array[$$index];
					$$renderer.push(`<div class="type-card svelte-uz3ii2"><span class="type-badge svelte-uz3ii2">${escape_html(t.agent_type ?? "unknown")}</span> <div class="type-stats svelte-uz3ii2"><span class="type-count svelte-uz3ii2">${escape_html(t.count)}</span> <span class="type-label svelte-uz3ii2">sessions</span></div> <div class="type-tokens svelte-uz3ii2"><span>${escape_html(formatTokens(t.total_input + t.total_output))} tokens</span></div></div>`);
				}
				$$renderer.push(`<!--]--></div></div>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> <div class="recent-section svelte-uz3ii2"><h2 class="svelte-uz3ii2">Recent Agents</h2> <span class="total-count svelte-uz3ii2">${escape_html(agentStore.totalCount)} total agent sessions</span> `);
			if (agentStore.recent.length === 0) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div class="empty-state svelte-uz3ii2">No agent sessions found</div>`);
			} else {
				$$renderer.push("<!--[-1-->");
				$$renderer.push(`<div class="table-wrapper svelte-uz3ii2"><table class="agents-table svelte-uz3ii2"><thead><tr><th class="svelte-uz3ii2">Agent</th><th class="svelte-uz3ii2">Type</th><th class="svelte-uz3ii2">Project</th><th class="svelte-uz3ii2">Tokens</th><th class="svelte-uz3ii2">Messages</th><th class="svelte-uz3ii2">Duration</th><th class="svelte-uz3ii2">Time</th></tr></thead><tbody class="svelte-uz3ii2"><!--[-->`);
				const each_array_1 = ensure_array_like(agentStore.recent);
				for (let i = 0, $$length = each_array_1.length; i < $$length; i++) {
					let agent = each_array_1[i];
					const row = agent;
					$$renderer.push(`<tr${attr_class("svelte-uz3ii2", void 0, { "highlighted": i === selectedIndex })}><td class="agent-name-cell svelte-uz3ii2">${escape_html(agent.agent_name ?? agent.session_id.slice(0, 8))}</td><td class="svelte-uz3ii2">`);
					if (agent.agent_type) {
						$$renderer.push("<!--[0-->");
						$$renderer.push(`<span class="type-badge-sm svelte-uz3ii2">${escape_html(agent.agent_type)}</span>`);
					} else {
						$$renderer.push("<!--[-1-->");
						$$renderer.push(`<span class="td-muted svelte-uz3ii2">—</span>`);
					}
					$$renderer.push(`<!--]--></td><td class="td-muted svelte-uz3ii2">${escape_html(row.project_name ?? "—")}</td><td class="svelte-uz3ii2">${escape_html(formatTokens((agent.input_tokens ?? 0) + (agent.output_tokens ?? 0)))}</td><td class="svelte-uz3ii2">${escape_html(agent.message_count ?? 0)}</td><td class="svelte-uz3ii2">${escape_html(formatDuration(agent.time_start, agent.time_end))}</td><td class="td-muted svelte-uz3ii2">${escape_html(timeAgo(agent.time_start))}</td></tr>`);
				}
				$$renderer.push(`<!--]--></tbody></table></div>`);
			}
			$$renderer.push(`<!--]--></div>`);
		}
		$$renderer.push(`<!--]--></div>`);
	});
}
//#endregion
//#region src/web/routes/agents/+page.svelte
function _page($$renderer) {
	$$renderer.push(`<h1 class="page-title svelte-tknjrw">Agents</h1> `);
	AgentsList($$renderer, {});
	$$renderer.push(`<!---->`);
}
//#endregion
export { _page as default };
