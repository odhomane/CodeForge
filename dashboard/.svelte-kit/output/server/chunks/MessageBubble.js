import { E as escape_html, a as derived, f as html, o as ensure_array_like, t as attr_class, w as attr } from "./server.js";
import { i as formatRelativeTime } from "./format.js";
import { t as formatModelName } from "./pricing.js";
import { t as renderMarkdownSync } from "./markdown.js";
//#region src/web/lib/components/shared/TimeAgo.svelte
function TimeAgo($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { date } = $$props;
		let display = derived(() => {
			return formatRelativeTime(date);
		});
		let isoString = derived(() => typeof date === "string" ? new Date(date).toISOString() : date.toISOString());
		$$renderer.push(`<time class="time-ago svelte-s8y28f"${attr("datetime", isoString())}${attr("title", isoString())}>${escape_html(display())}</time>`);
	});
}
//#endregion
//#region src/web/lib/components/sessions/ThinkingBlock.svelte
function ThinkingBlock($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { block } = $$props;
		let expanded = false;
		let isRedacted = derived(() => !block.thinking && !!block.signature);
		if (!derived(() => !block.thinking && !block.signature)()) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div${attr_class("thinking-block svelte-18lzrju", void 0, { "expanded": expanded })}>`);
			if (isRedacted()) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div class="thinking-redacted svelte-18lzrju"><span class="thinking-icon svelte-18lzrju">🔒</span> <em>Extended thinking (content redacted)</em></div>`);
			} else {
				$$renderer.push("<!--[-1-->");
				$$renderer.push(`<button class="thinking-toggle svelte-18lzrju"><span class="chevron svelte-18lzrju">${escape_html("▶")}</span> Thinking...</button> `);
				$$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]-->`);
			}
			$$renderer.push(`<!--]--></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
//#region src/web/lib/utils/diff.ts
/**
* Compute a simple line-by-line diff between two strings.
* Uses longest common subsequence to produce minimal, ordered diffs.
*/
function computeDiff(oldText, newText) {
	const oldLines = oldText.split("\n");
	const newLines = newText.split("\n");
	const m = oldLines.length;
	const n = newLines.length;
	const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
	for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) if (oldLines[i - 1] === newLines[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
	else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
	const result = [];
	let i = m;
	let j = n;
	while (i > 0 || j > 0) if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
		result.push({
			type: "context",
			text: oldLines[i - 1]
		});
		i--;
		j--;
	} else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
		result.push({
			type: "added",
			text: newLines[j - 1]
		});
		j--;
	} else {
		result.push({
			type: "removed",
			text: oldLines[i - 1]
		});
		i--;
	}
	return result.reverse();
}
//#endregion
//#region src/web/lib/components/sessions/ToolCallBlock.svelte
function ToolCallBlock($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { block, result, parentSessionId } = $$props;
		let expanded = false;
		let input = derived(() => block.input);
		let toolName = derived(() => block.name);
		let isFileBasedTool = derived(() => [
			"Read",
			"read",
			"Write",
			"write",
			"Edit",
			"edit"
		].includes(toolName()));
		let filePath = derived(() => isFileBasedTool() && input() && typeof input().file_path === "string" ? input().file_path : "");
		let fileBasename = derived(() => filePath() ? filePath().split("/").at(-1) ?? "" : "");
		let isEditTool = derived(() => ["Edit", "edit"].includes(toolName()));
		let isReadTool = derived(() => ["Read", "read"].includes(toolName()));
		let isWriteTool = derived(() => ["Write", "write"].includes(toolName()));
		let isBashTool = derived(() => ["Bash", "bash"].includes(toolName()));
		let isGrepTool = derived(() => ["Grep", "grep"].includes(toolName()));
		let isGlobTool = derived(() => ["Glob", "glob"].includes(toolName()));
		let isAgentTool = derived(() => ["Agent", "agent"].includes(toolName()));
		derived(() => ["TaskCreate"].includes(toolName()));
		derived(() => ["TaskUpdate"].includes(toolName()));
		derived(() => ["SendMessage"].includes(toolName()));
		derived(() => ["AskUserQuestion"].includes(toolName()));
		derived(() => ["WebSearch"].includes(toolName()));
		derived(() => ["WebFetch"].includes(toolName()));
		derived(() => ["LSP"].includes(toolName()));
		derived(() => ["Skill"].includes(toolName()));
		derived(() => ["TaskList"].includes(toolName()));
		derived(() => ["TaskGet"].includes(toolName()));
		derived(() => ["TaskOutput"].includes(toolName()));
		derived(() => ["CronCreate"].includes(toolName()));
		let diffLines = derived(() => {
			if (!isEditTool() || !input()) return [];
			const oldStr = typeof input().old_string === "string" ? input().old_string : "";
			const newStr = typeof input().new_string === "string" ? input().new_string : "";
			if (!oldStr && !newStr) return [];
			return computeDiff(oldStr, newStr);
		});
		let summary = derived(() => {
			if (!input()) return "";
			switch (toolName()) {
				case "Read":
				case "read":
				case "Edit":
				case "edit":
				case "Write":
				case "write": return fileBasename();
				case "Bash":
				case "bash": {
					const desc = typeof input().description === "string" ? input().description : "";
					if (desc) return desc.length > 80 ? desc.slice(0, 80) + "…" : desc;
					const cmd = typeof input().command === "string" ? input().command : "";
					return cmd.length > 80 ? cmd.slice(0, 80) + "…" : cmd;
				}
				case "Grep":
				case "grep": return typeof input().pattern === "string" ? input().pattern : "";
				case "Glob":
				case "glob": return typeof input().pattern === "string" ? input().pattern : "";
				case "Agent":
				case "agent": return typeof input().description === "string" ? input().description : typeof input().name === "string" ? input().name : "";
				case "TaskCreate": return typeof input().subject === "string" ? input().subject : "";
				case "TaskUpdate": {
					const id = typeof input().taskId === "string" ? input().taskId : "";
					const status = typeof input().status === "string" ? " → " + input().status : "";
					return id ? "#" + id + status : "";
				}
				case "TaskList":
				case "TaskGet": return typeof input().taskId === "string" ? "#" + input().taskId : "";
				case "SendMessage": return typeof input().to === "string" ? "→ " + input().to : "";
				case "AskUserQuestion": {
					const first = (Array.isArray(input().questions) ? input().questions : [])[0];
					if (first && typeof first === "object" && "question" in first) {
						const q = String(first.question);
						return q.length > 60 ? q.slice(0, 60) + "…" : q;
					}
					return "";
				}
				case "WebSearch": return typeof input().query === "string" ? input().query.length > 60 ? input().query.slice(0, 60) + "…" : input().query : "";
				case "WebFetch": try {
					return (typeof input().url === "string" ? new URL(input().url) : null)?.hostname ?? "";
				} catch {
					return "";
				}
				case "LSP": {
					const op = typeof input().operation === "string" ? input().operation : "";
					const fp = typeof input().filePath === "string" ? input().filePath.split("/").at(-1) ?? "" : "";
					return op + (fp ? " " + fp : "");
				}
				case "Skill": return typeof input().skill === "string" ? input().skill : "";
				case "CronCreate": return typeof input().cron === "string" ? input().cron : "";
				case "TaskOutput": return typeof input().task_id === "string" ? input().task_id : "";
				default:
					if (input()) {
						for (const val of Object.values(input())) if (typeof val === "string" && val.length > 0 && val.length < 80) return val.length > 60 ? val.slice(0, 60) + "…" : val;
					}
					return "";
			}
		});
		derived(() => JSON.stringify(block.input, null, 2));
		let resultText = derived(() => {
			if (!result) return "";
			if (typeof result.content === "string") return result.content;
			return JSON.stringify(result.content, null, 2);
		});
		let isError = derived(() => !!result && (result.is_error === true || typeof result.content === "string" && result.content.startsWith("Error:")));
		let resultLines = derived(() => resultText() ? resultText().split("\n") : []);
		function stripReadLineNumbers(text) {
			return text.replace(/^ *\d+\t/gm, "");
		}
		function parsePersistedOutput(text) {
			const match = text.match(/<persisted-output>\nOutput too large \(([^)]+)\)\. Full output saved to: ([^\n]+)\n\nPreview[^:]*:\n([\s\S]*?)(?:\n<\/persisted-output>|$)/);
			if (match) return {
				isLarge: true,
				size: match[1],
				preview: match[3],
				fullPath: match[2]
			};
			return {
				isLarge: false,
				size: "",
				preview: text,
				fullPath: null
			};
		}
		function diffSummary(lines) {
			return `+${lines.filter((l) => l.type === "added").length} -${lines.filter((l) => l.type === "removed").length} lines`;
		}
		function countResultLines(text) {
			return text.split("\n").filter((l) => l.trim()).length;
		}
		$$renderer.push(`<div${attr_class("tool-call svelte-1jk7v44", void 0, {
			"expanded": expanded,
			"tool-error": isError()
		})}><button class="tool-call-header svelte-1jk7v44"><span class="tool-call-chevron svelte-1jk7v44">${escape_html("▶")}</span> <span class="tool-call-name svelte-1jk7v44">${escape_html(toolName())}</span> `);
		if (summary()) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<span class="tool-call-summary svelte-1jk7v44"${attr("title", filePath() || void 0)}>${escape_html(summary())}</span>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></button> `);
		if (result && resultText()) {
			$$renderer.push("<!--[0-->");
			$$renderer.push(`<div${attr_class("result-preview svelte-1jk7v44", void 0, { "result-error": isError() })}>`);
			if (isReadTool()) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div class="preview-lines svelte-1jk7v44">${escape_html(stripReadLineNumbers(resultText()).split("\n").slice(0, 5).join("\n"))}</div> `);
				if (filePath()) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<div class="preview-subtitle svelte-1jk7v44">${escape_html(filePath())}</div>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]-->`);
			} else if (isWriteTool()) {
				$$renderer.push("<!--[1-->");
				if (filePath()) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<div class="preview-subtitle svelte-1jk7v44">${escape_html(filePath())}</div>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> <div class="preview-lines svelte-1jk7v44">${escape_html(resultText().split("\n").slice(0, 3).join("\n"))}</div>`);
			} else if (isEditTool() && diffLines().length > 0) {
				$$renderer.push("<!--[2-->");
				$$renderer.push(`<div class="preview-lines svelte-1jk7v44">${escape_html(diffSummary(diffLines()))} · ${escape_html(filePath())}</div>`);
			} else if (isBashTool()) {
				$$renderer.push("<!--[3-->");
				const parsed = parsePersistedOutput(resultText());
				$$renderer.push(`<div class="preview-lines svelte-1jk7v44">${escape_html(parsed.preview.split("\n").slice(0, 5).join("\n"))}</div> `);
				if (parsed.isLarge) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<div class="preview-subtitle svelte-1jk7v44">Output too large (${escape_html(parsed.size)})</div>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]-->`);
			} else if (isGrepTool() || isGlobTool()) {
				$$renderer.push("<!--[4-->");
				const count = countResultLines(resultText());
				$$renderer.push(`<div class="preview-lines svelte-1jk7v44">${escape_html(count)} ${escape_html(isGrepTool() ? count === 1 ? "match" : "matches" : count === 1 ? "file" : "files")}</div> <div class="preview-lines svelte-1jk7v44">${escape_html(resultText().split("\n").filter((l) => l.trim()).slice(0, 3).join("\n"))}</div>`);
			} else if (isAgentTool()) {
				$$renderer.push("<!--[5-->");
				if (input()?.subagent_type) {
					$$renderer.push("<!--[0-->");
					$$renderer.push(`<span class="inline-badge svelte-1jk7v44">${escape_html(input().subagent_type)}</span>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]--> <div class="preview-lines svelte-1jk7v44">${escape_html(resultText().split("\n").slice(0, 3).join("\n"))}</div>`);
			} else {
				$$renderer.push("<!--[-1-->");
				$$renderer.push(`<div class="preview-lines svelte-1jk7v44">${escape_html(resultText().split("\n").slice(0, 3).join("\n"))}</div>`);
			}
			$$renderer.push(`<!--]--></div> `);
			if (resultLines().length > 5) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<button class="result-more svelte-1jk7v44">... (${escape_html(resultLines().length - 5)} more lines)</button>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]-->`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--> `);
		$$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]--></div>`);
	});
}
//#endregion
//#region src/web/lib/components/sessions/MessageBubble.svelte
function MessageBubble($$renderer, $$props) {
	$$renderer.component(($$renderer) => {
		let { message, resultMap, parentSessionId } = $$props;
		/** Map from block index to rendered HTML for assistant text blocks */
		let renderedBlocks = {};
		/** Extract plain text from user content that may be string or ContentBlock[] */
		function getUserText(content) {
			if (typeof content === "string") return content;
			return content.filter((b) => b.type === "text").map((b) => b.text).join("\n");
		}
		if (message.type === "user") {
			$$renderer.push("<!--[0-->");
			const userText = getUserText(message.message.content);
			$$renderer.push(`<div class="msg user svelte-yg9jlm"><div class="msg-header svelte-yg9jlm"><span class="msg-role user-role svelte-yg9jlm">User</span> `);
			TimeAgo($$renderer, { date: message.timestamp });
			$$renderer.push(`<!----></div> `);
			if (userText) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<div class="msg-text svelte-yg9jlm">${escape_html(userText)}</div>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div>`);
		} else if (message.type === "assistant") {
			$$renderer.push("<!--[1-->");
			const pairedResults = resultMap ?? /* @__PURE__ */ new Map();
			$$renderer.push(`<div class="msg assistant svelte-yg9jlm"><div class="msg-header svelte-yg9jlm"><span class="msg-header-left svelte-yg9jlm"><span class="msg-role assistant-role svelte-yg9jlm">Assistant</span> `);
			if (message.message.model) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<span class="msg-model-badge svelte-yg9jlm">${escape_html(formatModelName(message.message.model))}</span>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></span> `);
			TimeAgo($$renderer, { date: message.timestamp });
			$$renderer.push(`<!----></div> <!--[-->`);
			const each_array = ensure_array_like(message.message.content);
			for (let i = 0, $$length = each_array.length; i < $$length; i++) {
				let block = each_array[i];
				if (block.type === "thinking") {
					$$renderer.push("<!--[0-->");
					ThinkingBlock($$renderer, { block });
				} else if (block.type === "text") {
					$$renderer.push("<!--[1-->");
					if (renderedBlocks[i]) {
						$$renderer.push("<!--[0-->");
						$$renderer.push(`<div class="msg-text rendered-markdown svelte-yg9jlm">${html(renderedBlocks[i])}</div>`);
					} else {
						$$renderer.push("<!--[-1-->");
						$$renderer.push(`<div class="msg-text rendered-markdown svelte-yg9jlm">${html(renderMarkdownSync(block.text))}</div>`);
					}
					$$renderer.push(`<!--]-->`);
				} else if (block.type === "tool_use") {
					$$renderer.push("<!--[2-->");
					$$renderer.push(`<div class="tool-calls-area svelte-yg9jlm">`);
					ToolCallBlock($$renderer, {
						block,
						result: pairedResults.get(block.id),
						parentSessionId
					});
					$$renderer.push(`<!----></div>`);
				} else $$renderer.push("<!--[-1-->");
				$$renderer.push(`<!--]-->`);
			}
			$$renderer.push(`<!--]--></div>`);
		} else if (message.type === "system") {
			$$renderer.push("<!--[2-->");
			$$renderer.push(`<div${attr_class("msg system svelte-yg9jlm", void 0, { "collapsed": true })}><button class="system-toggle svelte-yg9jlm"><span class="chevron svelte-yg9jlm">${escape_html("▶")}</span> <span class="msg-role system-role svelte-yg9jlm">System</span> `);
			if (message.subtype) {
				$$renderer.push("<!--[0-->");
				$$renderer.push(`<span class="system-subtype svelte-yg9jlm">${escape_html(message.subtype)}</span>`);
			} else $$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></button> `);
			$$renderer.push("<!--[-1-->");
			$$renderer.push(`<!--]--></div>`);
		} else if (message.type === "summary") {
			$$renderer.push("<!--[3-->");
			$$renderer.push(`<div class="msg summary svelte-yg9jlm"><div class="msg-header svelte-yg9jlm"><span class="msg-role summary-role svelte-yg9jlm">Summary</span> `);
			TimeAgo($$renderer, { date: message.timestamp });
			$$renderer.push(`<!----></div> <div class="summary-text svelte-yg9jlm">${escape_html(message.summary)}</div></div>`);
		} else $$renderer.push("<!--[-1-->");
		$$renderer.push(`<!--]-->`);
	});
}
//#endregion
export { MessageBubble as t };
