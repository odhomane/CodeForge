import { E as escape_html, a as derived, o as ensure_array_like, t as attr_class, u as stringify, w as attr } from "../../../chunks/server.js";
import { a as memoryStore, i as fetchRuns, n as fetchMemoryStats, r as fetchObservations, t as fetchMemories } from "../../../chunks/memory.svelte.js";
import { a as formatTokens, i as formatRelativeTime, r as formatDuration, t as formatCost } from "../../../chunks/format.js";
import "../../../chunks/markdown.js";
import { t as MessageBubble } from "../../../chunks/MessageBubble.js";
//#region src/web/lib/components/memory/MemoriesTab.svelte
function MemoriesTab($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let filtered = derived(() => memoryStore.memories);
		$$renderer.push(`<div class="memories-tab svelte-1p28njh">`);
		if (filtered().length === 0) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="empty-state svelte-1p28njh">No memories found.</div>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div class="mem-list svelte-1p28njh"><!--[-->`);
			const each_array = ensure_array_like(filtered());
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let mem = each_array[$$index];
				$$renderer.push(`<div class="mem-card svelte-1p28njh"><div class="mem-header svelte-1p28njh"><span class="category-badge svelte-1p28njh">${escape_html(mem.category)}</span> <span class="confidence-badge svelte-1p28njh">${escape_html((mem.confidence * 100).toFixed(0))}% confidence</span> <span class="source-count svelte-1p28njh">${escape_html(mem.sourceObservationIds.length)} source${escape_html(mem.sourceObservationIds.length !== 1 ? "s" : "")}</span> `);
				if (mem.status === "approved") {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<span class="status-badge status-approved svelte-1p28njh">approved</span>`);
				} else {
					$$renderer.push("<!--[-1-->");
					$$renderer.push(`<span class="status-badge status-revoked svelte-1p28njh">revoked</span>`);
				}
				$$renderer.push(`<!--]--></div> <div class="mem-content svelte-1p28njh">${escape_html(mem.content)}</div> <div class="mem-footer svelte-1p28njh"><span class="mem-meta svelte-1p28njh">Approved: ${escape_html(formatRelativeTime(mem.approvedAt))}</span> <span class="mem-meta svelte-1p28njh">Created: ${escape_html(formatRelativeTime(mem.createdAt))}</span> <div class="mem-actions svelte-1p28njh">`);
				if (mem.status === "approved") {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<button class="action-btn revoke-btn svelte-1p28njh">Revoke</button>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></div></div></div>`);
			}
			$$renderer.push(`<!--]--></div>`);
		}
		$$renderer.push(`<!--]--></div>`);
	});
}
//#endregion
//#region src/web/lib/components/memory/ObservationsTab.svelte
function ObservationsTab($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let categoryFilter = "";
		let statusFilter = "";
		let categories = derived(() => {
			const set = /* @__PURE__ */ new Set();
			for (const obs of memoryStore.observations) set.add(obs.category);
			return Array.from(set).sort();
		});
		let filtered = derived(() => {
			return memoryStore.observations;
		});
		function countClass(count) {
			if (count >= 5) return "count-high";
			if (count >= 3) return "count-mid";
			return "count-low";
		}
		function statusClass(status) {
			switch (status) {
				case "active": return "status-active";
				case "stale": return "status-stale";
				case "promoted": return "status-promoted";
				case "consolidated": return "status-consolidated";
				default: return "";
			}
		}
		$$renderer.push(`<div class="observations-tab svelte-e4a3hp"><div class="filters-row svelte-e4a3hp">`);
		$$renderer.select({
			class: "filter-select",
			value: categoryFilter
		}, ($$renderer) => {
			$$renderer.option({ value: "" }, ($$renderer) => {
				$$renderer.push(`All Categories`);
			});
			$$renderer.push(`<!--[-->`);
			const each_array = ensure_array_like(categories());
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let cat = each_array[$$index];
				$$renderer.option({ value: cat }, ($$renderer) => {
					$$renderer.push(`${escape_html(cat)}`);
				});
			}
			$$renderer.push(`<!--]-->`);
		}, "svelte-e4a3hp");
		$$renderer.push(` `);
		$$renderer.select({
			class: "filter-select",
			value: statusFilter
		}, ($$renderer) => {
			$$renderer.option({ value: "" }, ($$renderer) => {
				$$renderer.push(`All Statuses`);
			});
			$$renderer.option({ value: "active" }, ($$renderer) => {
				$$renderer.push(`Active`);
			});
			$$renderer.option({ value: "stale" }, ($$renderer) => {
				$$renderer.push(`Stale`);
			});
			$$renderer.option({ value: "promoted" }, ($$renderer) => {
				$$renderer.push(`Promoted`);
			});
			$$renderer.option({ value: "consolidated" }, ($$renderer) => {
				$$renderer.push(`Consolidated`);
			});
		}, "svelte-e4a3hp");
		$$renderer.push(`</div> `);
		if (filtered().length === 0) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="empty-state svelte-e4a3hp">No observations found.</div>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div class="obs-list svelte-e4a3hp"><!--[-->`);
			const each_array_1 = ensure_array_like(filtered());
			for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
				let obs = each_array_1[$$index_1];
				$$renderer.push(`<div class="obs-card svelte-e4a3hp"><div class="obs-header svelte-e4a3hp"><span class="category-badge svelte-e4a3hp">${escape_html(obs.category)}</span> <span${attr_class(`count-badge ${stringify(countClass(obs.count))}`, "svelte-e4a3hp")}>${escape_html(obs.count)}x</span> <span${attr_class(`status-badge ${stringify(statusClass(obs.status))}`, "svelte-e4a3hp")}>${escape_html(obs.status)}</span></div> <div class="obs-content svelte-e4a3hp">${escape_html(obs.content)}</div> `);
				if (obs.evidence) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<div class="obs-evidence svelte-e4a3hp">${escape_html(obs.evidence)}</div>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> <div class="obs-footer svelte-e4a3hp"><span class="obs-meta svelte-e4a3hp">First: ${escape_html(formatRelativeTime(obs.createdAt))}</span> <span class="obs-meta svelte-e4a3hp">Last: ${escape_html(formatRelativeTime(obs.updatedAt))}</span> `);
				if (obs.sessionsSinceLastSeen > 0) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<span class="obs-meta svelte-e4a3hp">${escape_html(obs.sessionsSinceLastSeen)} sessions since</span>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> <div class="obs-actions svelte-e4a3hp">`);
				if (obs.status === "active") {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<button class="action-btn approve-btn svelte-e4a3hp">Approve</button> <button class="action-btn dismiss-btn svelte-e4a3hp">Dismiss</button>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></div></div></div>`);
			}
			$$renderer.push(`<!--]--></div>`);
		}
		$$renderer.push(`<!--]--></div>`);
	});
}
//#endregion
//#region src/web/lib/components/memory/RunDetail.svelte
function RunDetail($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { run } = $$props;
		function eventsToMessages(events) {
			return events.filter((e) => e.type === "assistant" || e.type === "user").map((e) => ({
				uuid: crypto.randomUUID(),
				type: e.type,
				timestamp: (/* @__PURE__ */ new Date()).toISOString(),
				sessionId: "",
				message: e.message
			}));
		}
		let messages = derived(() => eventsToMessages(run.events ?? []));
		let resultMap = derived(() => {
			const map = /* @__PURE__ */ new Map();
			for (const msg of messages()) if (msg.type === "user" && Array.isArray(msg.message.content)) {
				for (const block of msg.message.content) if (block.type === "tool_result") map.set(block.tool_use_id, block);
			}
			return map;
		});
		function statusClass(status) {
			switch (status) {
				case "running": return "status-running";
				case "completed": return "status-completed";
				case "failed": return "status-failed";
				default: return "";
			}
		}
		$$renderer.push(`<div class="run-detail svelte-dpzo87"><div class="run-meta svelte-dpzo87"><div class="meta-row svelte-dpzo87"><span class="meta-label svelte-dpzo87">Run ID</span> <span class="meta-value mono svelte-dpzo87">${escape_html(run.runId)}</span></div> `);
		if (run.sessionId) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="meta-row svelte-dpzo87"><span class="meta-label svelte-dpzo87">Session</span> <a${attr("href", `/sessions/${stringify(run.sessionId)}`)} class="meta-link svelte-dpzo87">${escape_html(run.sessionId.slice(0, 8))}</a></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <div class="meta-row svelte-dpzo87"><span class="meta-label svelte-dpzo87">Project</span> <span class="meta-value mono svelte-dpzo87">${escape_html(run.projectId)}</span></div> `);
		if (run.model) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="meta-row svelte-dpzo87"><span class="meta-label svelte-dpzo87">Model</span> <span class="meta-value mono svelte-dpzo87">${escape_html(run.model)}</span></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <div class="meta-row svelte-dpzo87"><span class="meta-label svelte-dpzo87">Status</span> <span${attr_class(`meta-value ${stringify(statusClass(run.status))}`, "svelte-dpzo87")}>${escape_html(run.status)}</span></div> <div class="meta-row svelte-dpzo87"><span class="meta-label svelte-dpzo87">Cost</span> <span class="meta-value cost svelte-dpzo87">${escape_html(formatCost(run.costUsd))}</span></div> <div class="meta-row svelte-dpzo87"><span class="meta-label svelte-dpzo87">Tokens</span> <span class="meta-value svelte-dpzo87">${escape_html(formatTokens(run.inputTokens))} in / ${escape_html(formatTokens(run.outputTokens))} out</span></div> <div class="meta-row svelte-dpzo87"><span class="meta-label svelte-dpzo87">Duration</span> <span class="meta-value svelte-dpzo87">${escape_html(formatDuration(run.durationMs))}</span></div> <div class="meta-row svelte-dpzo87"><span class="meta-label svelte-dpzo87">Turns</span> <span class="meta-value svelte-dpzo87">${escape_html(run.numTurns)}</span></div></div> `);
		if (run.error) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="run-error svelte-dpzo87">${escape_html(run.error)}</div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (messages().length > 0) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="run-conversation svelte-dpzo87"><div class="conversation-header svelte-dpzo87">Conversation (${escape_html(messages().length)} messages)</div> <div class="conversation-list svelte-dpzo87"><!--[-->`);
			const each_array = ensure_array_like(messages());
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let message = each_array[$$index];
				MessageBubble($$renderer, {
					message,
					resultMap: resultMap()
				});
			}
			$$renderer.push(`<!--]--></div></div>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div class="no-events svelte-dpzo87">No conversation events recorded.</div>`);
		}
		$$renderer.push(`<!--]--></div>`);
	});
}
//#endregion
//#region src/web/lib/components/memory/RunsTab.svelte
function RunsTab($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let expandedRunId = null;
		function statusClass(status) {
			switch (status) {
				case "running": return "status-running";
				case "completed": return "status-completed";
				case "failed": return "status-failed";
				default: return "";
			}
		}
		function typeClass(runType) {
			return runType === "analysis" ? "type-analysis" : "type-maintenance";
		}
		$$renderer.push(`<div class="runs-tab svelte-169rbbs">`);
		if (memoryStore.runs.length === 0) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="empty-state svelte-169rbbs">No runs found.</div>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div class="runs-list svelte-169rbbs"><!--[-->`);
			const each_array = ensure_array_like(memoryStore.runs);
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let run = each_array[$$index];
				$$renderer.push(`<button${attr_class("run-row svelte-169rbbs", void 0, { "expanded": expandedRunId === run.runId })}><span${attr_class(`run-type ${stringify(typeClass(run.runType))}`, "svelte-169rbbs")}>${escape_html(run.runType)}</span> <span class="run-project svelte-169rbbs">${escape_html(run.projectId)}</span> <span${attr_class(`run-status ${stringify(statusClass(run.status))}`, "svelte-169rbbs")}>${escape_html(run.status)}</span> <span class="run-cost svelte-169rbbs">${escape_html(formatCost(run.costUsd))}</span> <span class="run-tokens svelte-169rbbs">${escape_html(formatTokens(run.inputTokens + run.outputTokens))}</span> <span class="run-duration svelte-169rbbs">${escape_html(formatDuration(run.durationMs))}</span> <span class="run-time svelte-169rbbs">${escape_html(formatRelativeTime(run.startedAt))}</span></button> `);
				if (expandedRunId === run.runId && memoryStore.selectedRun) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<div class="run-detail-wrapper svelte-169rbbs">`);
					RunDetail($$renderer, { run: memoryStore.selectedRun });
					$$renderer.push(`<!----></div>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]-->`);
			}
			$$renderer.push(`<!--]--></div>`);
		}
		$$renderer.push(`<!--]--></div>`);
	});
}
//#endregion
//#region src/web/lib/components/memory/MemoriesPage.svelte
function MemoriesPage($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		function handleProjectFilter(e) {
			const value = e.target.value || null;
			memoryStore.projectFilter = value;
			const projectId = value ?? void 0;
			fetchObservations(projectId);
			fetchMemories(projectId);
			fetchRuns(projectId);
			fetchMemoryStats(projectId);
		}
		let projects = derived(() => {
			const set = /* @__PURE__ */ new Set();
			for (const obs of memoryStore.observations) set.add(obs.projectId);
			for (const mem of memoryStore.memories) set.add(mem.projectId);
			for (const run of memoryStore.runs) set.add(run.projectId);
			return Array.from(set).sort();
		});
		$$renderer.push(`<div class="memories-page svelte-kauulv"><div class="page-header svelte-kauulv"><div class="page-header-left svelte-kauulv"><h1 class="page-title svelte-kauulv">Memories</h1> <div class="stats-row svelte-kauulv"><span class="stat"><span class="stat-value svelte-kauulv">${escape_html(memoryStore.stats.activeObservations)}</span> active observations</span> <span class="stat"><span class="stat-value svelte-kauulv">${escape_html(memoryStore.stats.totalMemories)}</span> memories</span> <span class="stat"><span class="stat-value svelte-kauulv">${escape_html(memoryStore.stats.totalRuns)}</span> runs</span></div></div> <div class="page-header-right svelte-kauulv">`);
		$$renderer.select({
			class: "project-filter",
			onchange: handleProjectFilter,
			value: memoryStore.projectFilter ?? ""
		}, ($$renderer) => {
			$$renderer.option({ value: "" }, ($$renderer) => {
				$$renderer.push(`All Projects`);
			});
			$$renderer.push(`<!--[-->`);
			const each_array = ensure_array_like(projects());
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let project = each_array[$$index];
				$$renderer.option({ value: project }, ($$renderer) => {
					$$renderer.push(`${escape_html(project)}`);
				});
			}
			$$renderer.push(`<!--]-->`);
		}, "svelte-kauulv");
		$$renderer.push(` <button class="maintenance-btn svelte-kauulv"${attr("disabled", !memoryStore.projectFilter, true)}>Run Maintenance</button></div></div> <div class="tab-bar svelte-kauulv"><button${attr_class("tab-btn svelte-kauulv", void 0, { "active": memoryStore.activeTab === "observations" })}>Observations (${escape_html(memoryStore.observations.length)})</button> <button${attr_class("tab-btn svelte-kauulv", void 0, { "active": memoryStore.activeTab === "memories" })}>Memories (${escape_html(memoryStore.memories.length)})</button> <button${attr_class("tab-btn svelte-kauulv", void 0, { "active": memoryStore.activeTab === "runs" })}>Runs (${escape_html(memoryStore.runs.length)})</button></div> `);
		if (memoryStore.error) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="error-banner svelte-kauulv">${escape_html(memoryStore.error)}</div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (memoryStore.loading) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="loading-state svelte-kauulv">Loading...</div>`);
		} else if (memoryStore.activeTab === "observations") {
			$$renderer.push("<!--[1-->");
			ObservationsTab($$renderer, {});
		} else if (memoryStore.activeTab === "memories") {
			$$renderer.push("<!--[2-->");
			MemoriesTab($$renderer, {});
		} else if (memoryStore.activeTab === "runs") {
			$$renderer.push("<!--[3-->");
			RunsTab($$renderer, {});
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div>`);
	});
}
//#endregion
//#region src/web/routes/memories/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		MemoriesPage($$renderer, {});
	});
}
//#endregion
export { _page as default };
