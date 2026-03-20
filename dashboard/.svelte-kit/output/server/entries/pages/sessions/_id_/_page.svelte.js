import "../../../../chunks/index-server.js";
import "../../../../chunks/environment.js";
import "../../../../chunks/shared.js";
import "../../../../chunks/exports.js";
import { E as escape_html, a as derived, f as html, n as attr_style, o as ensure_array_like, t as attr_class, u as stringify, w as attr } from "../../../../chunks/server.js";
import "../../../../chunks/internal.js";
import "../../../../chunks/client.js";
import { t as page } from "../../../../chunks/state.js";
import { a as memoryStore } from "../../../../chunks/memory.svelte.js";
import { n as sessionStore } from "../../../../chunks/sessions.svelte.js";
import { a as formatTokens, o as truncateText, r as formatDuration, t as formatCost } from "../../../../chunks/format.js";
import { t as formatModelName } from "../../../../chunks/pricing.js";
import "../../../../chunks/markdown.js";
import { t as MessageBubble } from "../../../../chunks/MessageBubble.js";
//#region src/parser/types.ts
function extractContentBlockText(block) {
	switch (block.type) {
		case "text": return block.text;
		case "tool_use": return typeof block.input === "string" ? block.input : JSON.stringify(block.input);
		case "tool_result": return typeof block.content === "string" ? block.content : JSON.stringify(block.content);
		case "thinking": return block.thinking;
		default: return "";
	}
}
function extractSearchableText(msg) {
	switch (msg.type) {
		case "summary": return msg.summary ?? "";
		case "system": return msg.subtype ?? "";
		case "user": {
			const content = msg.message?.content;
			if (typeof content === "string") return content;
			if (Array.isArray(content)) return content.map(extractContentBlockText).filter(Boolean).join("\n");
			return "";
		}
		case "assistant": {
			const blocks = msg.message?.content;
			if (!Array.isArray(blocks)) return "";
			return blocks.map(extractContentBlockText).filter(Boolean).join("\n");
		}
		default: return "";
	}
}
//#endregion
//#region src/web/lib/components/shared/CopyCommand.svelte
function CopyCommand($$renderer, $$props) {
	let { sessionId } = $$props;
	$$renderer.push(`<button class="resume-btn svelte-le2jz7">`);
	$$renderer.push("<!--[-1-->");
	$$renderer.push(`<!--]--> <svg class="resume-icon svelte-le2jz7" viewBox="0 0 16 16" fill="none"><path d="M5 2H3a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V3a1 1 0 00-1-1h-2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" class="svelte-le2jz7"></path><rect x="5" y="1" width="6" height="3" rx="1" stroke="currentColor" stroke-width="1.3" class="svelte-le2jz7"></rect></svg> Resume Session</button>`);
}
//#endregion
//#region src/web/lib/components/sessions/AgentsView.svelte
function AgentsView($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { agents, unlinked } = $$props;
		let expandedId = null;
		let agentMessages = {};
		let loadingMessages = {};
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
		function formatTokens(n) {
			if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
			if (n >= 1e3) return `${(n / 1e3).toFixed(1)}k`;
			return String(n);
		}
		let completedCount = derived(() => agents.filter((a) => a.time_end).length);
		$$renderer.push(`<div class="agents-view svelte-hmvcem"><div class="agents-header svelte-hmvcem"><h3 class="svelte-hmvcem">Agent Sessions</h3> <span class="agent-count svelte-hmvcem">${escape_html(completedCount())}/${escape_html(agents.length + unlinked.length)} completed</span></div> `);
		if (agents.length === 0 && unlinked.length === 0) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="empty-state svelte-hmvcem">No agent sessions found</div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <div class="agent-cards svelte-hmvcem"><!--[-->`);
		const each_array = ensure_array_like(agents);
		for (let $$index_1 = 0, $$length = each_array.length; $$index_1 < $$length; $$index_1++) {
			let agent = each_array[$$index_1];
			const isExpanded = expandedId === agent.session_id;
			$$renderer.push(`<div${attr_class("agent-card svelte-hmvcem", void 0, { "expanded": isExpanded })}><button class="agent-card-header svelte-hmvcem"><div class="agent-info svelte-hmvcem"><span class="agent-name svelte-hmvcem">${escape_html(agent.agent_name ?? agent.session_id.slice(0, 8))}</span> `);
			if (agent.agent_type) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<span class="agent-type-badge svelte-hmvcem">${escape_html(agent.agent_type)}</span>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if (agent.description) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<span class="agent-desc svelte-hmvcem"${attr("title", agent.description)}>${escape_html(agent.description)}</span>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div> <div class="agent-stats svelte-hmvcem"><span class="stat svelte-hmvcem" title="Messages">${escape_html(agent.message_count ?? 0)} msgs</span> <span class="stat svelte-hmvcem" title="Tokens">${escape_html(formatTokens((agent.input_tokens ?? 0) + (agent.output_tokens ?? 0)))} tok</span> <span class="stat svelte-hmvcem" title="Duration">${escape_html(formatDuration(agent.time_start, agent.time_end))}</span> <span${attr_class("status-dot svelte-hmvcem", void 0, {
				"active": !agent.time_end,
				"done": !!agent.time_end
			})}></span></div> <span class="expand-arrow svelte-hmvcem">${escape_html(isExpanded ? "▼" : "▶")}</span></button> `);
			if (isExpanded) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div class="agent-conversation svelte-hmvcem">`);
				if (loadingMessages[agent.session_id]) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<div class="loading svelte-hmvcem">Loading conversation...</div>`);
				} else if (agentMessages[agent.session_id]?.length) {
					$$renderer.push("<!--[1-->");
					$$renderer.push(`<!--[-->`);
					const each_array_1 = ensure_array_like(agentMessages[agent.session_id]);
					for (let $$index = 0, $$length = each_array_1.length; $$index < $$length; $$index++) {
						let msg = each_array_1[$$index];
						MessageBubble($$renderer, { message: msg });
					}
					$$renderer.push(`<!--]-->`);
				} else {
					$$renderer.push("<!--[-1-->");
					$$renderer.push(`<div class="empty-state svelte-hmvcem">No messages available</div>`);
				}
				$$renderer.push(`<!--]--></div>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div>`);
		}
		$$renderer.push(`<!--]--> <!--[-->`);
		const each_array_2 = ensure_array_like(unlinked);
		for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
			let agent = each_array_2[$$index_2];
			$$renderer.push(`<div class="agent-card pending svelte-hmvcem"><div class="agent-card-header svelte-hmvcem"><div class="agent-info svelte-hmvcem"><span class="agent-name svelte-hmvcem">${escape_html(agent.agent_name ?? "Pending agent")}</span> `);
			if (agent.agent_type) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<span class="agent-type-badge svelte-hmvcem">${escape_html(agent.agent_type)}</span>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if (agent.description) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<span class="agent-desc svelte-hmvcem"${attr("title", agent.description)}>${escape_html(agent.description)}</span>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div> <div class="agent-stats svelte-hmvcem"><span class="status-dot pending svelte-hmvcem"></span> <span class="stat svelte-hmvcem">Awaiting session...</span></div></div></div>`);
		}
		$$renderer.push(`<!--]--></div></div>`);
	});
}
//#endregion
//#region src/web/lib/components/sessions/ContextView.svelte
function ContextView($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { context, loading } = $$props;
		let expandedItems = /* @__PURE__ */ new Set();
		let renderedContent = {};
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
		function estimateItemTokens(content) {
			return Math.ceil(content.length / 4);
		}
		let memoryTokens = derived(() => (context?.memories ?? []).reduce((sum, m) => sum + estimateItemTokens(m.content), 0));
		let rulesTokens = derived(() => (context?.rules ?? []).reduce((sum, r) => sum + estimateItemTokens(r.content), 0));
		let totalContextTokens = derived(() => memoryTokens() + rulesTokens());
		if (loading) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="context-empty svelte-olmwf3"><span class="loading-dot svelte-olmwf3"></span> <span class="loading-text svelte-olmwf3">Loading context...</span></div>`);
		} else if (!context) {
			$$renderer.push("<!--[1-->");
			$$renderer.push(`<div class="context-empty svelte-olmwf3">No context available for this session.</div>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div class="context-view svelte-olmwf3">`);
			if (totalContextTokens() > 0) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div class="context-total-tokens svelte-olmwf3">~${escape_html(formatTokens(totalContextTokens()))} estimated tokens</div>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> <div class="context-section svelte-olmwf3"><h3 class="section-title svelte-olmwf3">Memories <span class="section-tokens svelte-olmwf3">~${escape_html(formatTokens(memoryTokens()))} tokens</span></h3> `);
			if (context.memories.length === 0) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div class="section-empty svelte-olmwf3">No memory files found for this session's project.</div>`);
			} else {
				$$renderer.push("<!--[-1-->");
				$$renderer.push(`<div class="context-cards svelte-olmwf3"><!--[-->`);
				const each_array = ensure_array_like(context.memories);
				for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
					let item = each_array[$$index];
					$$renderer.push(`<div${attr_class("context-card svelte-olmwf3", void 0, { "expanded": expandedItems.has(item.path) })}><button class="context-card-header svelte-olmwf3"><span class="chevron svelte-olmwf3">${escape_html(expandedItems.has(item.path) ? "▼" : "▶")}</span> <span class="scope-badge svelte-olmwf3"${attr_style(`color:${stringify(scopeColor(item.scope))};background:${stringify(scopeBg(item.scope))}`)}>${escape_html(item.scope)}</span> <span class="ctx-filename svelte-olmwf3">${escape_html(item.filename)}</span> <span class="ctx-path svelte-olmwf3"${attr("title", item.path)}>${escape_html(item.path)}</span> <span class="ctx-tokens svelte-olmwf3">~${escape_html(formatTokens(estimateItemTokens(item.content)))}</span></button> `);
					if (expandedItems.has(item.path)) {
						$$renderer.push("<!--[0-->");
						$$renderer.push(`<div class="context-card-body rendered-markdown svelte-olmwf3">`);
						if (renderedContent[item.path]) {
							$$renderer.push("<!--[0-->");
							$$renderer.push(`${html(renderedContent[item.path])}`);
						} else {
							$$renderer.push("<!--[-1-->");
							$$renderer.push(`<span class="loading-text svelte-olmwf3">Rendering...</span>`);
						}
						$$renderer.push(`<!--]--></div>`);
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--></div>`);
				}
				$$renderer.push(`<!--]--></div>`);
			}
			$$renderer.push(`<!--]--></div> <div class="context-section svelte-olmwf3"><h3 class="section-title svelte-olmwf3">Rules <span class="section-tokens svelte-olmwf3">~${escape_html(formatTokens(rulesTokens()))} tokens</span></h3> `);
			if (context.rules.length === 0) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div class="section-empty svelte-olmwf3">No rules found for this session's project.</div>`);
			} else {
				$$renderer.push("<!--[-1-->");
				$$renderer.push(`<div class="context-cards svelte-olmwf3"><!--[-->`);
				const each_array_1 = ensure_array_like(context.rules);
				for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
					let item = each_array_1[$$index_1];
					$$renderer.push(`<div${attr_class("context-card svelte-olmwf3", void 0, { "expanded": expandedItems.has(item.path) })}><button class="context-card-header svelte-olmwf3"><span class="chevron svelte-olmwf3">${escape_html(expandedItems.has(item.path) ? "▼" : "▶")}</span> <span class="scope-badge svelte-olmwf3"${attr_style(`color:${stringify(scopeColor(item.scope))};background:${stringify(scopeBg(item.scope))}`)}>${escape_html(item.scope)}</span> <span class="ctx-filename svelte-olmwf3">${escape_html(item.filename)}</span> <span class="ctx-path svelte-olmwf3"${attr("title", item.path)}>${escape_html(item.path)}</span> <span class="ctx-tokens svelte-olmwf3">~${escape_html(formatTokens(estimateItemTokens(item.content)))}</span></button> `);
					if (expandedItems.has(item.path)) {
						$$renderer.push("<!--[0-->");
						$$renderer.push(`<div class="context-card-body rendered-markdown svelte-olmwf3">`);
						if (renderedContent[item.path]) {
							$$renderer.push("<!--[0-->");
							$$renderer.push(`${html(renderedContent[item.path])}`);
						} else {
							$$renderer.push("<!--[-1-->");
							$$renderer.push(`<span class="loading-text svelte-olmwf3">Rendering...</span>`);
						}
						$$renderer.push(`<!--]--></div>`);
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--></div>`);
				}
				$$renderer.push(`<!--]--></div>`);
			}
			$$renderer.push(`<!--]--></div></div>`);
		}
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
//#region src/web/lib/components/sessions/ConversationSearch.svelte
function ConversationSearch($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { onSearch, matchCount = 0, currentIndex = 0, onNext, onPrev } = $$props;
		$$renderer.push(`<div class="conv-search svelte-1cqf3xu"><div class="conv-search-input-wrap svelte-1cqf3xu"><svg class="conv-search-icon svelte-1cqf3xu" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg> <input type="text" class="conv-search-input svelte-1cqf3xu" placeholder="Search conversation..."${attr("value", "")}/> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div></div>`);
	});
}
//#endregion
//#region src/web/lib/components/sessions/PlanView.svelte
function PlanView($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { plan, loading } = $$props;
		let renderedContent = "";
		let estimatedTokens = derived(() => plan?.content ? Math.ceil(plan.content.length / 4) : 0);
		if (loading) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="plan-empty svelte-702ukb"><span class="loading-dot svelte-702ukb"></span> <span class="loading-text svelte-702ukb">Loading plan...</span></div>`);
		} else if (!plan) {
			$$renderer.push("<!--[1-->");
			$$renderer.push(`<div class="plan-empty svelte-702ukb">No plan available for this session.</div>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div class="plan-view svelte-702ukb"><div class="plan-header svelte-702ukb"><h2 class="plan-title svelte-702ukb">${escape_html(plan.title)}</h2> <span class="plan-slug svelte-702ukb">${escape_html(plan.slug)}</span> `);
			if (estimatedTokens() > 0) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<span class="plan-tokens svelte-702ukb">~${escape_html(formatTokens(estimatedTokens()))} tokens</span>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div> <div class="plan-content rendered-markdown svelte-702ukb">${html(renderedContent)}</div></div>`);
		}
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
//#region src/web/lib/components/sessions/TasksView.svelte
function TasksView($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { tasks, teamName, loading } = $$props;
		let expandedItems = /* @__PURE__ */ new Set();
		function statusIcon(status, blockedBy) {
			if (blockedBy.length > 0 && status !== "completed") return "⊘";
			switch (status) {
				case "completed": return "✓";
				case "in_progress": return "◎";
				default: return "○";
			}
		}
		function statusClass(status, blockedBy) {
			if (blockedBy.length > 0 && status !== "completed") return "status-blocked";
			switch (status) {
				case "completed": return "status-completed";
				case "in_progress": return "status-in-progress";
				default: return "status-pending";
			}
		}
		let completedCount = derived(() => (tasks ?? []).filter((t) => t.status === "completed").length);
		let totalCount = derived(() => (tasks ?? []).length);
		if (loading) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="tasks-empty svelte-vyiun0"><span class="loading-dot svelte-vyiun0"></span> <span class="loading-text svelte-vyiun0">Loading tasks...</span></div>`);
		} else if (!tasks || tasks.length === 0) {
			$$renderer.push("<!--[1-->");
			$$renderer.push(`<div class="tasks-empty svelte-vyiun0">No tasks available for this session.</div>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div class="tasks-view svelte-vyiun0"><div class="tasks-header svelte-vyiun0">`);
			if (teamName) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<span class="team-badge svelte-vyiun0">${escape_html(teamName)}</span>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> <span class="tasks-progress svelte-vyiun0">${escape_html(completedCount())}/${escape_html(totalCount())} completed</span></div> <div class="tasks-cards svelte-vyiun0"><!--[-->`);
			const each_array = ensure_array_like(tasks);
			for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
				let task = each_array[$$index];
				$$renderer.push(`<div${attr_class("task-card svelte-vyiun0", void 0, { "expanded": expandedItems.has(task.id) })}><button class="task-card-header svelte-vyiun0"><span class="chevron svelte-vyiun0">${escape_html(expandedItems.has(task.id) ? "▼" : "▶")}</span> <span${attr_class(`task-status-icon ${stringify(statusClass(task.status, task.blockedBy))}`, "svelte-vyiun0")}>${escape_html(statusIcon(task.status, task.blockedBy))}</span> <span class="task-subject svelte-vyiun0">${escape_html(task.subject)}</span> `);
				if (task.owner) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<span class="task-owner svelte-vyiun0">${escape_html(task.owner)}</span>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> `);
				if (task.blockedBy.length > 0 && task.status !== "completed") {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<span class="task-blocked svelte-vyiun0">blocked by ${escape_html(task.blockedBy.join(", "))}</span>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></button> `);
				if (expandedItems.has(task.id)) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<div class="task-card-body svelte-vyiun0">`);
					if (task.description) {
						$$renderer.push("<!--[0-->");
						$$renderer.push(`<div class="task-description svelte-vyiun0">${escape_html(task.description)}</div>`);
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--> <div class="task-meta svelte-vyiun0"><span class="task-meta-item svelte-vyiun0"><span class="task-meta-label svelte-vyiun0">ID</span> <span class="task-meta-value svelte-vyiun0">${escape_html(task.id)}</span></span> <span class="task-meta-item svelte-vyiun0"><span class="task-meta-label svelte-vyiun0">Status</span> <span class="task-meta-value svelte-vyiun0">${escape_html(task.status)}</span></span> `);
					if (task.owner) {
						$$renderer.push("<!--[0-->");
						$$renderer.push(`<span class="task-meta-item svelte-vyiun0"><span class="task-meta-label svelte-vyiun0">Owner</span> <span class="task-meta-value svelte-vyiun0">${escape_html(task.owner)}</span></span>`);
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--> `);
					if (task.blocks.length > 0) {
						$$renderer.push("<!--[0-->");
						$$renderer.push(`<span class="task-meta-item svelte-vyiun0"><span class="task-meta-label svelte-vyiun0">Blocks</span> <span class="task-meta-value svelte-vyiun0">${escape_html(task.blocks.join(", "))}</span></span>`);
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--> `);
					if (task.blockedBy.length > 0) {
						$$renderer.push("<!--[0-->");
						$$renderer.push(`<span class="task-meta-item svelte-vyiun0"><span class="task-meta-label svelte-vyiun0">Blocked By</span> <span class="task-meta-value svelte-vyiun0">${escape_html(task.blockedBy.join(", "))}</span></span>`);
					} else $$renderer.push("<!--[-1-->");
					$$renderer.push(`<!--]--></div></div>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--></div>`);
			}
			$$renderer.push(`<!--]--></div></div>`);
		}
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
//#region src/web/lib/components/sessions/SessionDetail.svelte
function SessionDetail($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { session, initialTab } = $$props;
		let activeTab = "conversation";
		let agentsData = null;
		let showPlanTab = derived(() => session.hasPlan || !!session.plan);
		let showAgentsTab = derived(() => session.hasAgents || (agentsData?.sessions?.length ?? 0) > 0);
		let showTasksTab = derived(() => session.hasTeam || !!session.tasks);
		let globalResultMap = derived(() => {
			const map = /* @__PURE__ */ new Map();
			for (const msg of session.messages) if (msg.type === "user" && Array.isArray(msg.message.content)) {
				for (const block of msg.message.content) if (block.type === "tool_result") map.set(block.tool_use_id, block);
			}
			return map;
		});
		/** Check if a user message contains only tool_result blocks (API protocol artifact) */
		function isToolResultOnly(msg) {
			if (msg.type !== "user") return false;
			if (typeof msg.message.content === "string") return false;
			return msg.message.content.every((b) => b.type === "tool_result");
		}
		let totalTokens = derived(() => {
			const meta = session.meta;
			if (!meta) return {
				input: 0,
				output: 0,
				cacheRead: 0,
				total: 0
			};
			const input = meta.totalTokens.input;
			const output = meta.totalTokens.output;
			const cacheRead = meta.totalTokens.cacheRead;
			return {
				input,
				output,
				cacheRead,
				total: input + output + cacheRead
			};
		});
		let tokenBarSegments = derived(() => {
			const total = totalTokens().total || 1;
			return {
				cacheRead: totalTokens().cacheRead / total * 100,
				input: totalTokens().input / total * 100,
				output: totalTokens().output / total * 100
			};
		});
		let duration = derived(() => {
			if (!session.meta?.timeRange) return 0;
			const start = new Date(session.meta.timeRange.start).getTime();
			return new Date(session.meta.timeRange.end).getTime() - start;
		});
		let toolCallCount = derived(() => {
			let count = 0;
			for (const msg of session.messages) if (msg.type === "assistant") {
				for (const block of msg.message.content) if (block.type === "tool_use") count++;
			}
			return count;
		});
		let toolNames = derived(() => {
			const names = /* @__PURE__ */ new Set();
			for (const msg of session.messages) if (msg.type === "assistant") {
				for (const block of msg.message.content) if (block.type === "tool_use") names.add(block.name);
			}
			return Array.from(names).slice(0, 3).join(", ");
		});
		let models = derived(() => session.meta?.models ?? []);
		let costDisplay = derived(() => session.cost ? formatCost(session.cost.totalCost) : "$0.00");
		let userTurnCount = derived(() => session.messages.filter((m) => m.type === "user" && !isToolResultOnly(m)).length);
		let thinkingBlockCount = derived(() => {
			let count = 0;
			for (const msg of session.messages) if (msg.type === "assistant") {
				for (const block of msg.message.content) if (block.type === "thinking") count++;
			}
			return count;
		});
		let searchQuery = "";
		let currentMatchIndex = 0;
		let matchingMessageIds = derived(() => {
			if (!searchQuery) return /* @__PURE__ */ new Set();
			const query = searchQuery.toLowerCase();
			const ids = /* @__PURE__ */ new Set();
			for (const msg of session.messages) if (extractSearchableText(msg).toLowerCase().includes(query)) ids.add(msg.uuid);
			return ids;
		});
		let matchingUuids = derived(() => {
			if (!searchQuery) return [];
			return session.messages.filter((m) => matchingMessageIds().has(m.uuid)).map((m) => m.uuid);
		});
		function handleSearch(query) {
			searchQuery = query;
			currentMatchIndex = 0;
			if (query) scrollToCurrentMatch();
		}
		function scrollToCurrentMatch() {
			if (matchingUuids().length === 0) return;
			const uuid = matchingUuids()[currentMatchIndex];
			const el = document.querySelector(`[data-msg-uuid="${uuid}"]`);
			if (el) el.scrollIntoView({
				behavior: "smooth",
				block: "center"
			});
		}
		function handleNextMatch() {
			if (matchingUuids().length === 0) return;
			currentMatchIndex = (currentMatchIndex + 1) % matchingUuids().length;
			scrollToCurrentMatch();
		}
		function handlePrevMatch() {
			if (matchingUuids().length === 0) return;
			currentMatchIndex = (currentMatchIndex - 1 + matchingUuids().length) % matchingUuids().length;
			scrollToCurrentMatch();
		}
		const TOOL_COLLAPSE_THRESHOLD = 3;
		function isToolOnlyMessage(msg) {
			if (msg.type !== "assistant") return false;
			return msg.message.content.length > 0 && msg.message.content.every((b) => b.type === "tool_use" || b.type === "tool_result");
		}
		let conversationItems = derived(() => {
			const items = [];
			const msgs = session.messages.filter((m) => !isToolResultOnly(m));
			let i = 0;
			while (i < msgs.length) if (isToolOnlyMessage(msgs[i])) {
				const start = i;
				while (i < msgs.length && isToolOnlyMessage(msgs[i])) i++;
				const group = msgs.slice(start, i);
				if (group.length >= TOOL_COLLAPSE_THRESHOLD) {
					const counts = /* @__PURE__ */ new Map();
					for (const m of group) if (m.type === "assistant") {
						for (const b of m.message.content) if (b.type === "tool_use") {
							const name = b.name;
							counts.set(name, (counts.get(name) ?? 0) + 1);
						}
					}
					const summary = Array.from(counts.entries()).map(([name, count]) => `${name} (${count})`).join(", ");
					items.push({
						kind: "tool-group",
						messages: group,
						toolSummary: summary
					});
				} else for (const m of group) items.push({
					kind: "message",
					message: m
				});
			} else {
				items.push({
					kind: "message",
					message: msgs[i]
				});
				i++;
			}
			return items;
		});
		let expandedGroups = /* @__PURE__ */ new Set();
		$$renderer.push(`<div class="session-detail svelte-1w5cyhq"><div class="detail-header svelte-1w5cyhq"><div class="detail-header-left svelte-1w5cyhq"><div class="detail-session-id svelte-1w5cyhq">${escape_html(session.sessionId.slice(0, 8))}</div> `);
		if (session.meta?.slug) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="detail-slug svelte-1w5cyhq">${escape_html(session.meta.slug)}</div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (session.project) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="detail-project svelte-1w5cyhq">${escape_html(session.project)}</div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (toolCallCount() > 0) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="detail-badge svelte-1w5cyhq">${escape_html(toolCallCount())} tool calls</div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div> <div class="detail-header-right svelte-1w5cyhq"><button class="analyze-btn svelte-1w5cyhq"${attr("disabled", !!memoryStore.analysisInProgress, true)}>`);
		if (memoryStore.analysisInProgress) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`Analyzing...`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`Analyze`);
		}
		$$renderer.push(`<!--]--></button> `);
		CopyCommand($$renderer, { sessionId: session.sessionId });
		$$renderer.push(`<!----></div></div> <div class="meta-cards svelte-1w5cyhq"><div class="meta-card svelte-1w5cyhq"><div class="meta-card-label svelte-1w5cyhq">Model${escape_html(models().length > 1 ? "s" : "")}</div> <div class="model-tags svelte-1w5cyhq"><!--[-->`);
		const each_array = ensure_array_like(models());
		for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
			let model = each_array[$$index];
			$$renderer.push(`<span class="model-tag svelte-1w5cyhq">${escape_html(formatModelName(model))}</span>`);
		}
		$$renderer.push(`<!--]--> `);
		if (models().length === 0) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<span class="meta-card-value svelte-1w5cyhq">Unknown</span>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div></div> <div class="meta-card svelte-1w5cyhq"><div class="meta-card-label svelte-1w5cyhq">Duration</div> <div class="meta-card-value svelte-1w5cyhq">${escape_html(formatDuration(duration()))}</div></div> <div class="meta-card svelte-1w5cyhq"><div class="meta-card-label svelte-1w5cyhq">Total Tokens</div> <div class="meta-card-value svelte-1w5cyhq">${escape_html(formatTokens(totalTokens().total))}</div> <div class="meta-card-sub svelte-1w5cyhq">In: ${escape_html(formatTokens(totalTokens().input))} / Out: ${escape_html(formatTokens(totalTokens().output))}</div></div> <div class="meta-card svelte-1w5cyhq"><div class="meta-card-label svelte-1w5cyhq">Cost</div> <div class="meta-card-value cost-value svelte-1w5cyhq">${escape_html(costDisplay())}</div></div> <div class="meta-card svelte-1w5cyhq"><div class="meta-card-label svelte-1w5cyhq">Messages</div> <div class="meta-card-value svelte-1w5cyhq">${escape_html(session.messages.length)}</div> <div class="meta-card-sub svelte-1w5cyhq">${escape_html(session.promptCount)} prompts</div></div> <div class="meta-card svelte-1w5cyhq"><div class="meta-card-label svelte-1w5cyhq">Tool Calls</div> <div class="meta-card-value svelte-1w5cyhq">${escape_html(toolCallCount())}</div> `);
		if (toolNames()) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="meta-card-sub svelte-1w5cyhq">${escape_html(toolNames())}</div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div></div> `);
		if (session.meta?.gitBranch || session.meta?.cwd) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="meta-extra svelte-1w5cyhq">`);
			if (session.meta?.gitBranch) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<span class="meta-extra-item svelte-1w5cyhq"><span class="meta-extra-label svelte-1w5cyhq">Branch</span> <span class="meta-extra-value mono svelte-1w5cyhq">${escape_html(session.meta.gitBranch)}</span></span>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--> `);
			if (session.meta?.cwd) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<span class="meta-extra-item svelte-1w5cyhq"><span class="meta-extra-label svelte-1w5cyhq">CWD</span> <span class="meta-extra-value mono svelte-1w5cyhq"${attr("title", session.meta.cwd)}>${escape_html(truncateText(session.meta.cwd, 60))}</span></span>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (totalTokens().total > 0) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="card token-card svelte-1w5cyhq"><div class="card-header"><div class="card-title">Token Distribution</div></div> <div class="token-breakdown-bar svelte-1w5cyhq"><div class="segment svelte-1w5cyhq"${attr_style(`width:${stringify(tokenBarSegments().cacheRead)}%;background:var(--green);border-radius:4px 0 0 4px;`)}></div> <div class="segment svelte-1w5cyhq"${attr_style(`width:${stringify(tokenBarSegments().input)}%;background:var(--blue);`)}></div> <div class="segment svelte-1w5cyhq"${attr_style(`width:${stringify(tokenBarSegments().output)}%;background:var(--purple);border-radius:0 4px 4px 0;`)}></div></div> <div class="token-breakdown-legend svelte-1w5cyhq"><div class="legend-item svelte-1w5cyhq"><div class="legend-dot svelte-1w5cyhq" style="background:var(--green)"></div> Cache Read (${escape_html(formatTokens(totalTokens().cacheRead))})</div> <div class="legend-item svelte-1w5cyhq"><div class="legend-dot svelte-1w5cyhq" style="background:var(--blue)"></div> Input (${escape_html(formatTokens(totalTokens().input))})</div> <div class="legend-item svelte-1w5cyhq"><div class="legend-dot svelte-1w5cyhq" style="background:var(--purple)"></div> Output (${escape_html(formatTokens(totalTokens().output))})</div></div></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <div class="tab-bar svelte-1w5cyhq"><button${attr_class("tab-btn svelte-1w5cyhq", void 0, { "active": activeTab === "conversation" })}>Conversation</button> `);
		if (showPlanTab()) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<button${attr_class("tab-btn svelte-1w5cyhq", void 0, { "active": activeTab === "plan" })}>Plan</button>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (showAgentsTab()) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<button${attr_class("tab-btn svelte-1w5cyhq", void 0, { "active": activeTab === "agents" })}>Agents (${escape_html(session.agentCount ?? 0)})</button>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <button${attr_class("tab-btn svelte-1w5cyhq", void 0, { "active": activeTab === "context" })}>Context</button> `);
		if (showTasksTab()) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<button${attr_class("tab-btn svelte-1w5cyhq", void 0, { "active": activeTab === "tasks" })}>Tasks</button>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> <button${attr_class("tab-btn svelte-1w5cyhq", void 0, { "active": activeTab === "memory" })}>Memory</button></div> `);
		if (activeTab === "conversation") {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="conv-stats-bar svelte-1w5cyhq"><span class="conv-stat"><span class="conv-stat-value svelte-1w5cyhq">${escape_html(session.messages.length)}</span> messages</span> <span class="conv-stat"><span class="conv-stat-value svelte-1w5cyhq">${escape_html(userTurnCount())}</span> turns</span> <span class="conv-stat"><span class="conv-stat-value svelte-1w5cyhq">${escape_html(toolCallCount())}</span> tool calls</span> <span class="conv-stat"><span class="conv-stat-value svelte-1w5cyhq">${escape_html(thinkingBlockCount())}</span> thinking</span></div> `);
			ConversationSearch($$renderer, {
				onSearch: handleSearch,
				matchCount: matchingUuids().length,
				currentIndex: currentMatchIndex,
				onNext: handleNextMatch,
				onPrev: handlePrevMatch
			});
			$$renderer.push(`<!----> <div class="conversation svelte-1w5cyhq"><!--[-->`);
			const each_array_1 = ensure_array_like(conversationItems());
			for (let idx = 0, $$length = each_array_1.length; idx < $$length; idx++) {
				let item = each_array_1[idx];
				if (item.kind === "message") {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<div${attr("data-msg-uuid", item.message.uuid)}${attr_class("svelte-1w5cyhq", void 0, {
						"search-match": searchQuery && matchingMessageIds().has(item.message.uuid),
						"search-current": searchQuery && matchingUuids()[currentMatchIndex] === item.message.uuid
					})}>`);
					MessageBubble($$renderer, {
						message: item.message,
						resultMap: globalResultMap(),
						parentSessionId: session.sessionId
					});
					$$renderer.push(`<!----></div>`);
				} else if (item.kind === "tool-group") {
					$$renderer.push("<!--[1-->");
					if (expandedGroups.has(idx)) {
						$$renderer.push("<!--[0-->");
						$$renderer.push(`<button class="tool-group-toggle expanded svelte-1w5cyhq"><span class="chevron svelte-1w5cyhq">▼</span> <span class="tool-group-label svelte-1w5cyhq">${escape_html(item.messages.length)} tool calls</span> <span class="tool-group-summary svelte-1w5cyhq">${escape_html(item.toolSummary)}</span></button> <!--[-->`);
						const each_array_2 = ensure_array_like(item.messages);
						for (let $$index_1 = 0, $$length = each_array_2.length; $$index_1 < $$length; $$index_1++) {
							let message = each_array_2[$$index_1];
							$$renderer.push(`<div${attr("data-msg-uuid", message.uuid)}${attr_class("svelte-1w5cyhq", void 0, {
								"search-match": searchQuery && matchingMessageIds().has(message.uuid),
								"search-current": searchQuery && matchingUuids()[currentMatchIndex] === message.uuid
							})}>`);
							MessageBubble($$renderer, {
								message,
								resultMap: globalResultMap(),
								parentSessionId: session.sessionId
							});
							$$renderer.push(`<!----></div>`);
						}
						$$renderer.push(`<!--]-->`);
					} else {
						$$renderer.push("<!--[-1-->");
						$$renderer.push(`<button class="tool-group-toggle svelte-1w5cyhq"><span class="chevron svelte-1w5cyhq">▶</span> <span class="tool-group-label svelte-1w5cyhq">${escape_html(item.messages.length)} tool calls</span> <span class="tool-group-summary svelte-1w5cyhq">${escape_html(item.toolSummary)}</span></button>`);
					}
					$$renderer.push(`<!--]-->`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]-->`);
			}
			$$renderer.push(`<!--]--></div>`);
		} else if (activeTab === "plan") {
			$$renderer.push("<!--[1-->");
			PlanView($$renderer, {
				plan: session.plan,
				loading: showPlanTab()
			});
		} else if (activeTab === "agents") {
			$$renderer.push("<!--[2-->");
			AgentsView($$renderer, {
				agents: agentsData?.sessions ?? [],
				unlinked: agentsData?.unlinked ?? []
			});
		} else if (activeTab === "context") {
			$$renderer.push("<!--[3-->");
			ContextView($$renderer, {
				context: session.context,
				loading: true
			});
		} else if (activeTab === "tasks") {
			$$renderer.push("<!--[4-->");
			TasksView($$renderer, {
				tasks: session.tasks,
				teamName: session.teamName,
				loading: showTasksTab()
			});
		} else if (activeTab === "memory") {
			$$renderer.push("<!--[5-->");
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="loading-state svelte-1w5cyhq">Loading memory data...</div>`);
			$$renderer.push(`<!--]-->`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div>`);
	});
}
//#endregion
//#region src/web/routes/sessions/[id]/+page.svelte
function _page($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let sessionId = derived(() => page.params.id);
		let initialTab = derived(() => {
			const tab = page.url.searchParams.get("tab");
			if (tab === "plan" || tab === "context") return tab;
		});
		if (sessionStore.loading && !sessionStore.selectedSession) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="loading-state svelte-orgeil">Loading session...</div>`);
		} else if (sessionStore.error) {
			$$renderer.push("<!--[1-->");
			$$renderer.push(`<div class="error-state svelte-orgeil"><div class="error-title svelte-orgeil">Error loading session</div> <div class="error-message svelte-orgeil">${escape_html(sessionStore.error)}</div></div>`);
		} else if (sessionStore.selectedSession && sessionStore.selectedSession.sessionId === sessionId()) {
			$$renderer.push("<!--[2-->");
			SessionDetail($$renderer, {
				session: sessionStore.selectedSession,
				initialTab: initialTab()
			});
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div class="not-found svelte-orgeil">Session not found.</div>`);
		}
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
export { _page as default };
