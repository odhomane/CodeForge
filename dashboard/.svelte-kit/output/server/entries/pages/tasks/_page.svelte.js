import "../../../chunks/index-server.js";
import "../../../chunks/environment.js";
import "../../../chunks/shared.js";
import "../../../chunks/exports.js";
import { E as escape_html, o as ensure_array_like, t as attr_class, u as stringify } from "../../../chunks/server.js";
import "../../../chunks/internal.js";
import "../../../chunks/client.js";
import "../../../chunks/navigation.js";
import { t as taskStore } from "../../../chunks/tasks.svelte.js";
import { i as formatRelativeTime } from "../../../chunks/format.js";
//#region src/web/lib/components/tasks/TasksList.svelte
function TasksList($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let highlightedIndex = -1;
		let expandedTeam = null;
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
		$$renderer.push(`<div class="tasks-list svelte-x28pc">`);
		if (taskStore.error) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="error-banner svelte-x28pc">${escape_html(taskStore.error)}</div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		if (taskStore.loading) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div class="loading-state svelte-x28pc">Loading tasks...</div>`);
		} else if (taskStore.teams.length === 0) {
			$$renderer.push("<!--[1-->");
			$$renderer.push(`<div class="empty-state svelte-x28pc">No task teams found.</div>`);
		} else {
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<div class="tasks-table-wrap svelte-x28pc"><table class="tasks-table svelte-x28pc"><thead><tr><th class="svelte-x28pc">Team</th><th class="svelte-x28pc">Tasks</th><th class="svelte-x28pc">Sessions</th><th class="svelte-x28pc">Last Used</th></tr></thead><tbody class="svelte-x28pc"><!--[-->`);
			const each_array = ensure_array_like(taskStore.teams);
			for (let i = 0, $$length = each_array.length; i < $$length; i++) {
				let team = each_array[i];
				$$renderer.push(`<tr${attr_class("svelte-x28pc", void 0, { "highlighted": i === highlightedIndex })}><td class="td-mono svelte-x28pc"><span class="chevron svelte-x28pc">${escape_html(expandedTeam === team.teamName ? "▼" : "▶")}</span> ${escape_html(team.teamName)}</td><td class="svelte-x28pc"><span class="task-progress svelte-x28pc"><span class="task-progress-count svelte-x28pc">${escape_html(team.completedCount)}</span> <span class="task-progress-sep svelte-x28pc">/</span> <span class="task-progress-total svelte-x28pc">${escape_html(team.taskCount)}</span></span></td><td class="td-muted svelte-x28pc">${escape_html(team.sessions.length)}</td><td class="td-muted svelte-x28pc">${escape_html(team.lastUsed ? formatRelativeTime(team.lastUsed) : "-")}</td></tr> `);
				if (expandedTeam === team.teamName) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<tr class="expanded-row svelte-x28pc"><td colspan="4" class="svelte-x28pc"><div class="expanded-content svelte-x28pc"><div class="expanded-section"><h4 class="expanded-section-title svelte-x28pc">Tasks</h4> <div class="task-items svelte-x28pc"><!--[-->`);
					const each_array_1 = ensure_array_like(team.tasks);
					for (let $$index = 0, $$length = each_array_1.length; $$index < $$length; $$index++) {
						let task = each_array_1[$$index];
						$$renderer.push(`<div class="task-item svelte-x28pc"><span${attr_class(`task-status ${stringify(statusClass(task.status, task.blockedBy))}`, "svelte-x28pc")}>${escape_html(statusIcon(task.status, task.blockedBy))}</span> <span class="task-subject svelte-x28pc">${escape_html(task.subject)}</span> `);
						if (task.owner) {
							$$renderer.push("<!--[0-->");
							$$renderer.push(`<span class="task-owner svelte-x28pc">${escape_html(task.owner)}</span>`);
						} else $$renderer.push("<!--[-1-->");
						$$renderer.push(`<!--]--> `);
						if (task.blockedBy.length > 0 && task.status !== "completed") {
							$$renderer.push("<!--[0-->");
							$$renderer.push(`<span class="task-blocked-by svelte-x28pc">blocked by ${escape_html(task.blockedBy.join(", "))}</span>`);
						} else $$renderer.push("<!--[-1-->");
						$$renderer.push(`<!--]--></div>`);
					}
					$$renderer.push(`<!--]--></div></div> `);
					if (team.sessions.length > 0) {
						$$renderer.push("<!--[0-->");
						$$renderer.push(`<div class="expanded-section"><h4 class="expanded-section-title svelte-x28pc">Linked Sessions</h4> <div class="linked-sessions svelte-x28pc"><!--[-->`);
						const each_array_2 = ensure_array_like(team.sessions);
						for (let $$index_1 = 0, $$length = each_array_2.length; $$index_1 < $$length; $$index_1++) {
							let session = each_array_2[$$index_1];
							$$renderer.push(`<button class="linked-session svelte-x28pc"><span class="linked-session-id svelte-x28pc">${escape_html(session.sessionId.slice(0, 8))}</span> <span class="linked-session-project svelte-x28pc">${escape_html(session.project)}</span> `);
							if (session.lastActivity) {
								$$renderer.push("<!--[0-->");
								$$renderer.push(`<span class="linked-session-time svelte-x28pc">${escape_html(formatRelativeTime(session.lastActivity))}</span>`);
							} else $$renderer.push("<!--[-1-->");
							$$renderer.push(`<!--]--></button>`);
						}
						$$renderer.push(`<!--]--></div></div>`);
					} else $$renderer.push("<!--[-1-->");
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
//#region src/web/routes/tasks/+page.svelte
function _page($$renderer) {
	$$renderer.push(`<h1 class="page-title svelte-32xrhq">Tasks</h1> `);
	TasksList($$renderer, {});
	$$renderer.push(`<!---->`);
}
//#endregion
export { _page as default };
