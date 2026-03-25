<script lang="ts">
import type {
	ToolResultBlock,
	ToolUseBlock,
} from "../../../../parser/types.js";
import { computeDiff, type DiffLine } from "../../utils/diff.js";
import { detectLanguage, highlightCode } from "../../utils/markdown.js";
import MessageBubble from "./MessageBubble.svelte";

let {
	block,
	result,
	parentSessionId,
}: { block: ToolUseBlock; result?: ToolResultBlock; parentSessionId?: string } =
	$props();
let expanded = $state(false);
let showRawJson = $state(false);
let showFullCode = $state(false);
let showAgentPrompt = $state(false);
let highlightedHtml = $state("");
let showAgentConversation = $state(false);
let agentConvoMessages = $state<any[]>([]);
let agentConvoLoading = $state(false);

let input = $derived(block.input as Record<string, unknown> | undefined);
let toolName = $derived(block.name);

let isFileBasedTool = $derived(
	["Read", "read", "Write", "write", "Edit", "edit"].includes(toolName),
);
let filePath = $derived(
	isFileBasedTool && input && typeof input.file_path === "string"
		? input.file_path
		: "",
);
let fileBasename = $derived(filePath ? (filePath.split("/").at(-1) ?? "") : "");
let isEditTool = $derived(["Edit", "edit"].includes(toolName));
let isReadTool = $derived(["Read", "read"].includes(toolName));
let isWriteTool = $derived(["Write", "write"].includes(toolName));
let isBashTool = $derived(["Bash", "bash"].includes(toolName));
let isGrepTool = $derived(["Grep", "grep"].includes(toolName));
let isGlobTool = $derived(["Glob", "glob"].includes(toolName));
let isAgentTool = $derived(["Agent", "agent"].includes(toolName));
let isTaskCreateTool = $derived(["TaskCreate"].includes(toolName));
let isTaskUpdateTool = $derived(["TaskUpdate"].includes(toolName));
let isSendMessageTool = $derived(["SendMessage"].includes(toolName));
let isAskUserTool = $derived(["AskUserQuestion"].includes(toolName));
let isWebSearchTool = $derived(["WebSearch"].includes(toolName));
let isWebFetchTool = $derived(["WebFetch"].includes(toolName));
let isLSPTool = $derived(["LSP"].includes(toolName));
let isSkillTool = $derived(["Skill"].includes(toolName));
let isTaskListTool = $derived(["TaskList"].includes(toolName));
let isTaskGetTool = $derived(["TaskGet"].includes(toolName));
let isTaskOutputTool = $derived(["TaskOutput"].includes(toolName));
let isCronCreateTool = $derived(["CronCreate"].includes(toolName));

let diffLines = $derived.by((): DiffLine[] => {
	if (!isEditTool || !input) return [];
	const oldStr = typeof input.old_string === "string" ? input.old_string : "";
	const newStr = typeof input.new_string === "string" ? input.new_string : "";
	if (!oldStr && !newStr) return [];
	return computeDiff(oldStr, newStr);
});

let summary = $derived.by(() => {
	if (!input) return "";
	switch (toolName) {
		case "Read":
		case "read":
		case "Edit":
		case "edit":
		case "Write":
		case "write":
			return fileBasename;
		case "Bash":
		case "bash": {
			const desc =
				typeof input.description === "string" ? input.description : "";
			if (desc) return desc.length > 80 ? desc.slice(0, 80) + "\u2026" : desc;
			const cmd = typeof input.command === "string" ? input.command : "";
			return cmd.length > 80 ? cmd.slice(0, 80) + "\u2026" : cmd;
		}
		case "Grep":
		case "grep":
			return typeof input.pattern === "string" ? input.pattern : "";
		case "Glob":
		case "glob":
			return typeof input.pattern === "string" ? input.pattern : "";
		case "Agent":
		case "agent":
			return typeof input.description === "string"
				? input.description
				: typeof input.name === "string"
					? input.name
					: "";
		case "TaskCreate":
			return typeof input.subject === "string" ? input.subject : "";
		case "TaskUpdate": {
			const id = typeof input.taskId === "string" ? input.taskId : "";
			const status =
				typeof input.status === "string" ? " \u2192 " + input.status : "";
			return id ? "#" + id + status : "";
		}
		case "TaskList":
		case "TaskGet":
			return typeof input.taskId === "string" ? "#" + input.taskId : "";
		case "SendMessage":
			return typeof input.to === "string" ? "\u2192 " + input.to : "";
		case "AskUserQuestion": {
			const questions = Array.isArray(input.questions) ? input.questions : [];
			const first = questions[0];
			if (first && typeof first === "object" && "question" in first) {
				const q = String((first as Record<string, unknown>).question);
				return q.length > 60 ? q.slice(0, 60) + "\u2026" : q;
			}
			return "";
		}
		case "WebSearch":
			return typeof input.query === "string"
				? input.query.length > 60
					? input.query.slice(0, 60) + "\u2026"
					: input.query
				: "";
		case "WebFetch": {
			try {
				const url = typeof input.url === "string" ? new URL(input.url) : null;
				return url?.hostname ?? "";
			} catch {
				return "";
			}
		}
		case "LSP": {
			const op = typeof input.operation === "string" ? input.operation : "";
			const fp =
				typeof input.filePath === "string"
					? (input.filePath.split("/").at(-1) ?? "")
					: "";
			return op + (fp ? " " + fp : "");
		}
		case "Skill":
			return typeof input.skill === "string" ? input.skill : "";
		case "CronCreate":
			return typeof input.cron === "string" ? input.cron : "";
		case "TaskOutput":
			return typeof input.task_id === "string" ? input.task_id : "";
		default: {
			if (input) {
				for (const val of Object.values(input)) {
					if (typeof val === "string" && val.length > 0 && val.length < 80) {
						return val.length > 60 ? val.slice(0, 60) + "\u2026" : val;
					}
				}
			}
			return "";
		}
	}
});

let inputJson = $derived(JSON.stringify(block.input, null, 2));

let resultText = $derived.by(() => {
	if (!result) return "";
	if (typeof result.content === "string") return result.content;
	return JSON.stringify(result.content, null, 2);
});

let isError = $derived(
	!!result &&
		((result as Record<string, unknown>).is_error === true ||
			(typeof result.content === "string" &&
				result.content.startsWith("Error:"))),
);

let resultLines = $derived(resultText ? resultText.split("\n") : []);

function stripReadLineNumbers(text: string): string {
	return text.replace(/^ *\d+\t/gm, "");
}

function parsePersistedOutput(text: string): {
	isLarge: boolean;
	size: string;
	preview: string;
	fullPath: string | null;
} {
	const match = text.match(
		/<persisted-output>\nOutput too large \(([^)]+)\)\. Full output saved to: ([^\n]+)\n\nPreview[^:]*:\n([\s\S]*?)(?:\n<\/persisted-output>|$)/,
	);
	if (match)
		return {
			isLarge: true,
			size: match[1],
			preview: match[3],
			fullPath: match[2],
		};
	return { isLarge: false, size: "", preview: text, fullPath: null };
}

function diffSummary(lines: DiffLine[]): string {
	const added = lines.filter((l) => l.type === "added").length;
	const removed = lines.filter((l) => l.type === "removed").length;
	return `+${added} -${removed} lines`;
}

function countResultLines(text: string): number {
	return text.split("\n").filter((l) => l.trim()).length;
}

function getStatusColor(status: string): string {
	switch (status) {
		case "completed":
			return "var(--green)";
		case "in_progress":
			return "var(--amber)";
		default:
			return "var(--text-dim)";
	}
}

function getStatusBg(status: string): string {
	switch (status) {
		case "completed":
			return "var(--green-dim)";
		case "in_progress":
			return "var(--amber-dim)";
		default:
			return "rgba(120,113,108,0.15)";
	}
}

function getLabeledFields(
	obj: Record<string, unknown>,
): Array<{ key: string; value: string; isLong: boolean; isComplex: boolean }> {
	return Object.entries(obj)
		.map(([key, value]) => {
			if (value === undefined || value === null) return null;
			if (typeof value === "string") {
				return { key, value, isLong: value.length >= 200, isComplex: false };
			}
			if (typeof value === "boolean" || typeof value === "number") {
				return { key, value: String(value), isLong: false, isComplex: false };
			}
			return {
				key,
				value: JSON.stringify(value, null, 2),
				isLong: true,
				isComplex: true,
			};
		})
		.filter((f): f is NonNullable<typeof f> => f !== null);
}

$effect(() => {
	if (!expanded) return;
	if (isReadTool && resultText) {
		const stripped = stripReadLineNumbers(resultText);
		const fp = typeof input?.file_path === "string" ? input.file_path : "";
		const lang = detectLanguage(fp);
		highlightCode(stripped, lang).then((html) => {
			highlightedHtml = html;
		});
	} else if (isWriteTool && input) {
		const content =
			typeof input.content === "string"
				? input.content
				: typeof input.file_content === "string"
					? input.file_content
					: "";
		if (content) {
			const fp = typeof input.file_path === "string" ? input.file_path : "";
			const lang = detectLanguage(fp);
			highlightCode(content, lang).then((html) => {
				highlightedHtml = html;
			});
		}
	} else if (isBashTool && input) {
		const cmd = typeof input.command === "string" ? input.command : "";
		if (cmd) {
			highlightCode(cmd, "shell").then((html) => {
				highlightedHtml = html;
			});
		}
	}
});
</script>

<div class="tool-call" class:expanded class:tool-error={isError}>
  <!-- HEADER -->
  <button class="tool-call-header" onclick={() => expanded = !expanded}>
    <span class="tool-call-chevron">{expanded ? '\u25BC' : '\u25B6'}</span>
    <span class="tool-call-name">{toolName}</span>
    {#if summary}
      <span class="tool-call-summary" title={filePath || undefined}>{summary}</span>
    {/if}
  </button>

  <!-- COLLAPSED PREVIEW -->
  {#if !expanded && result && resultText}
    <div class="result-preview" class:result-error={isError}>
      {#if isReadTool}
        <div class="preview-lines">{stripReadLineNumbers(resultText).split('\n').slice(0, 5).join('\n')}</div>
        {#if filePath}<div class="preview-subtitle">{filePath}</div>{/if}
      {:else if isWriteTool}
        {#if filePath}<div class="preview-subtitle">{filePath}</div>{/if}
        <div class="preview-lines">{resultText.split('\n').slice(0, 3).join('\n')}</div>
      {:else if isEditTool && diffLines.length > 0}
        <div class="preview-lines">{diffSummary(diffLines)} · {filePath}</div>
      {:else if isBashTool}
        {@const parsed = parsePersistedOutput(resultText)}
        <div class="preview-lines">{parsed.preview.split('\n').slice(0, 5).join('\n')}</div>
        {#if parsed.isLarge}<div class="preview-subtitle">Output too large ({parsed.size})</div>{/if}
      {:else if isGrepTool || isGlobTool}
        {@const count = countResultLines(resultText)}
        <div class="preview-lines">{count} {isGrepTool ? (count === 1 ? 'match' : 'matches') : (count === 1 ? 'file' : 'files')}</div>
        <div class="preview-lines">{resultText.split('\n').filter(l => l.trim()).slice(0, 3).join('\n')}</div>
      {:else if isAgentTool}
        {#if input?.subagent_type}<span class="inline-badge">{input.subagent_type}</span>{/if}
        <div class="preview-lines">{resultText.split('\n').slice(0, 3).join('\n')}</div>
      {:else}
        <div class="preview-lines">{resultText.split('\n').slice(0, 3).join('\n')}</div>
      {/if}
    </div>
    {#if resultLines.length > 5}
      <button class="result-more" onclick={() => expanded = true}>
        ... ({resultLines.length - 5} more lines)
      </button>
    {/if}
  {/if}

  <!-- EXPANDED BODY -->
  {#if expanded}
    <div class="tool-call-body">

      <!-- ===== READ ===== -->
      {#if isReadTool}
        <div class="field-row">
          <span class="field-value mono">{typeof input?.file_path === 'string' ? input.file_path : ''}</span>
          {#if input?.offset}<span class="inline-badge">offset: {input.offset}</span>{/if}
          {#if input?.limit}<span class="inline-badge">limit: {input.limit}</span>{/if}
        </div>
        {#if result}
          <div class="tool-result-label">Result</div>
          {#if highlightedHtml}
            <div class="highlighted-code">{@html highlightedHtml}</div>
          {:else}
            <pre class="tool-result">{resultText}</pre>
          {/if}
        {/if}

      <!-- ===== WRITE ===== -->
      {:else if isWriteTool}
        <div class="field-row">
          <span class="field-value mono">{typeof input?.file_path === 'string' ? input.file_path : ''}</span>
        </div>
        {#if input}
          {@const content = typeof input.content === 'string' ? input.content : typeof input.file_content === 'string' ? input.file_content : ''}
          {#if content}
            {@const lines = content.split('\n')}
            {@const displayContent = showFullCode ? content : lines.slice(0, 100).join('\n')}
            <div class="tool-input-label">Content</div>
            {#if highlightedHtml}
              <div class="highlighted-code">{@html highlightedHtml}</div>
            {:else}
              <pre class="tool-input">{displayContent}</pre>
            {/if}
            {#if lines.length > 100 && !showFullCode}
              <button class="raw-toggle" onclick={() => showFullCode = true}>
                Show all ({lines.length} lines)
              </button>
            {/if}
          {/if}
        {/if}
        {#if result}
          <div class="tool-result-label">Result</div>
          <pre class="tool-result">{resultText}</pre>
        {/if}

      <!-- ===== EDIT ===== -->
      {:else if isEditTool && diffLines.length > 0}
        <div class="diff-container">
          <div class="diff-file-path" title={filePath}>
            {filePath}
            {#if input?.replace_all}<span class="inline-badge" style="margin-left: 8px;">replace_all</span>{/if}
          </div>
          {#each diffLines as line}
            <div class="diff-line" class:diff-line-added={line.type === 'added'} class:diff-line-removed={line.type === 'removed'} class:diff-line-context={line.type === 'context'}>
              <span class="diff-prefix">{line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}</span>{line.text}
            </div>
          {/each}
        </div>
        {#if result}
          <div class="tool-result-label">Result</div>
          <pre class="tool-result">{resultText}</pre>
        {/if}

      <!-- ===== BASH ===== -->
      {:else if isBashTool}
        {#if input?.description}
          <div class="field-subtitle">{input.description}</div>
        {/if}
        <div class="tool-input-label">Command</div>
        {#if highlightedHtml}
          <div class="highlighted-code">{@html highlightedHtml}</div>
        {:else}
          <pre class="tool-input">{typeof input?.command === 'string' ? input.command : ''}</pre>
        {/if}
        {#if input?.timeout}
          <span class="inline-badge">timeout: {input.timeout}ms</span>
        {/if}
        {#if result}
          {@const parsed = parsePersistedOutput(resultText)}
          <div class="tool-result-label">Output</div>
          <pre class="tool-result terminal-output">{parsed.preview}</pre>
          {#if parsed.isLarge && parsed.fullPath}
            <div class="field-subtitle">Full output: {parsed.fullPath} ({parsed.size})</div>
          {/if}
        {/if}

      <!-- ===== GREP ===== -->
      {:else if isGrepTool}
        {#if input}
          <div class="labeled-fields">
            {#if input.pattern}<div class="field-row"><span class="field-label">pattern</span><span class="field-value mono">{input.pattern}</span></div>{/if}
            {#if input.path}<div class="field-row"><span class="field-label">path</span><span class="field-value mono">{input.path}</span></div>{/if}
            {#if input.output_mode}<div class="field-row"><span class="field-label">mode</span><span class="field-value">{input.output_mode}</span></div>{/if}
            {#if input.glob}<div class="field-row"><span class="field-label">glob</span><span class="field-value mono">{input.glob}</span></div>{/if}
            {#if input.type}<div class="field-row"><span class="field-label">type</span><span class="field-value">{input.type}</span></div>{/if}
            {#if input.context}<div class="field-row"><span class="field-label">context</span><span class="field-value">{input.context}</span></div>{/if}
          </div>
        {/if}
        {#if result}
          <div class="tool-result-label">Result</div>
          <pre class="tool-result mono-list">{resultText}</pre>
        {/if}

      <!-- ===== GLOB ===== -->
      {:else if isGlobTool}
        {#if input}
          <div class="labeled-fields">
            {#if input.pattern}<div class="field-row"><span class="field-label">pattern</span><span class="field-value mono">{input.pattern}</span></div>{/if}
            {#if input.path}<div class="field-row"><span class="field-label">path</span><span class="field-value mono">{input.path}</span></div>{/if}
          </div>
        {/if}
        {#if result}
          <div class="tool-result-label">Result</div>
          {#if resultText.trim()}
            <pre class="tool-result mono-list">{resultText}</pre>
          {:else}
            <div class="field-subtitle">No files found</div>
          {/if}
        {/if}

      <!-- ===== AGENT ===== -->
      {:else if isAgentTool}
        {#if input}
          <div class="labeled-fields">
            {#if input.name}<div class="field-row"><span class="field-label">name</span><span class="field-value">{input.name}</span></div>{/if}
            {#if input.subagent_type}<div class="field-row"><span class="field-label">type</span><span class="inline-badge">{input.subagent_type}</span></div>{/if}
            {#if input.mode}<div class="field-row"><span class="field-label">mode</span><span class="field-value">{input.mode}</span></div>{/if}
            {#if input.description}<div class="field-row"><span class="field-label">description</span><span class="field-value">{input.description}</span></div>{/if}
          </div>
          {#if typeof input.prompt === 'string'}
            <button class="raw-toggle" style="margin-top: 8px;" onclick={() => showAgentPrompt = !showAgentPrompt}>
              {showAgentPrompt ? 'Hide' : 'Show'} prompt ({input.prompt.length.toLocaleString()} chars)
            </button>
            {#if showAgentPrompt}
              <pre class="tool-input" style="margin-top: 6px;">{input.prompt}</pre>
            {/if}
          {/if}
        {/if}
        {#if result}
          <div class="tool-result-label">Result</div>
          <pre class="tool-result">{resultText}</pre>
        {/if}
        {#if parentSessionId}
          <button
            class="agent-convo-toggle"
            onclick={async () => {
              showAgentConversation = !showAgentConversation;
              if (showAgentConversation && agentConvoMessages.length === 0) {
                agentConvoLoading = true;
                try {
                  const agentsRes = await fetch(`/api/sessions/${encodeURIComponent(parentSessionId)}/agents`);
                  if (agentsRes.ok) {
                    const agentsData = await agentsRes.json();
                    const match = agentsData.sessions?.find((a: any) => a.tool_use_id === block.id);
                    if (match?.session_id) {
                      const msgRes = await fetch(`/api/sessions/${encodeURIComponent(match.session_id)}/messages`);
                      if (msgRes.ok) {
                        const msgData = await msgRes.json();
                        agentConvoMessages = msgData.messages ?? [];
                      }
                    }
                  }
                } catch { /* ignore */ }
                agentConvoLoading = false;
              }
            }}
          >
            {showAgentConversation ? 'Hide' : 'Show'} agent conversation
          </button>
          {#if showAgentConversation}
            <div class="agent-inline-convo">
              {#if agentConvoLoading}
                <div class="agent-convo-loading">Loading...</div>
              {:else if agentConvoMessages.length > 0}
                {#each agentConvoMessages as msg (msg.uuid)}
                  <MessageBubble message={msg} />
                {/each}
              {:else}
                <div class="agent-convo-empty">No conversation available</div>
              {/if}
            </div>
          {/if}
        {/if}

      <!-- ===== TASK CREATE ===== -->
      {:else if isTaskCreateTool}
        {#if input}
          <div class="field-value" style="font-weight: 500; margin-bottom: 6px;">{typeof input.subject === 'string' ? input.subject : ''}</div>
          {#if typeof input.description === 'string'}
            <pre class="tool-input" style="font-style: italic; color: var(--text-muted);">{input.description}</pre>
          {/if}
          {#if input.activeForm}<div class="field-subtitle">Active: {input.activeForm}</div>{/if}
        {/if}
        {#if result}
          <div class="tool-result-label">Result</div>
          <pre class="tool-result">{resultText}</pre>
        {/if}

      <!-- ===== TASK UPDATE ===== -->
      {:else if isTaskUpdateTool}
        {#if input}
          <div class="labeled-fields">
            {#if input.taskId}<div class="field-row"><span class="field-label">task</span><span class="field-value">#{input.taskId}</span></div>{/if}
            {#if input.status}
              <div class="field-row">
                <span class="field-label">status</span>
                <span class="inline-badge" style="color: {getStatusColor(String(input.status))}; background: {getStatusBg(String(input.status))};">{input.status}</span>
              </div>
            {/if}
            {#if input.owner}<div class="field-row"><span class="field-label">owner</span><span class="field-value">{input.owner}</span></div>{/if}
            {#if input.subject}<div class="field-row"><span class="field-label">subject</span><span class="field-value">{input.subject}</span></div>{/if}
          </div>
        {/if}
        {#if result}
          <div class="tool-result-label">Result</div>
          <pre class="tool-result">{resultText}</pre>
        {/if}

      <!-- ===== SEND MESSAGE ===== -->
      {:else if isSendMessageTool}
        {#if input}
          <div class="labeled-fields">
            {#if input.to}<div class="field-row"><span class="field-label">to</span><span class="inline-badge">{input.to}</span></div>{/if}
            {#if typeof input.message === 'string'}
              <div class="field-row"><span class="field-label">message</span><span class="field-value">{input.message}</span></div>
            {:else if input.message && typeof input.message === 'object'}
              {@const msg = input.message as Record<string, unknown>}
              {#if msg.type}<span class="inline-badge" style="margin-bottom: 4px;">{msg.type}</span>{/if}
              {#if msg.reason}<div class="field-row"><span class="field-label">reason</span><span class="field-value">{msg.reason}</span></div>{/if}
            {/if}
            {#if input.summary}<div class="field-subtitle">{input.summary}</div>{/if}
          </div>
        {/if}
        {#if result}
          <div class="tool-result-label">Result</div>
          <pre class="tool-result">{resultText}</pre>
        {/if}

      <!-- ===== ASK USER QUESTION ===== -->
      {:else if isAskUserTool}
        {#if input && Array.isArray(input.questions)}
          {#each input.questions as q}
            {#if typeof q === 'object' && q !== null}
              {@const question = q as Record<string, unknown>}
              <div class="ask-question">
                <div class="field-value" style="font-weight: 500;">{question.question ?? ''}</div>
                {#if Array.isArray(question.options)}
                  <ul class="ask-options">
                    {#each question.options as opt}
                      {#if typeof opt === 'object' && opt !== null}
                        {@const option = opt as Record<string, unknown>}
                        <li><strong>{option.label ?? ''}</strong>{#if option.description} — <span class="text-muted">{option.description}</span>{/if}</li>
                      {/if}
                    {/each}
                  </ul>
                {/if}
              </div>
            {/if}
          {/each}
        {/if}
        {#if result}
          <div class="tool-result-label">Answer</div>
          <pre class="tool-result">{resultText}</pre>
        {/if}

      <!-- ===== WEB SEARCH ===== -->
      {:else if isWebSearchTool}
        {#if input?.query}
          <div class="field-value mono" style="font-weight: 500;">{input.query}</div>
        {/if}
        {#if result}
          <div class="tool-result-label">Result</div>
          <pre class="tool-result">{resultText}</pre>
        {/if}

      <!-- ===== WEB FETCH ===== -->
      {:else if isWebFetchTool}
        {#if input}
          {#if input.url}<div class="field-value mono link-style">{input.url}</div>{/if}
          {#if input.prompt}<div class="field-subtitle">{input.prompt}</div>{/if}
        {/if}
        {#if result}
          <div class="tool-result-label">Result</div>
          <pre class="tool-result">{resultText}</pre>
        {/if}

      <!-- ===== LSP ===== -->
      {:else if isLSPTool}
        {#if input}
          <div class="labeled-fields">
            {#if input.operation}<div class="field-row"><span class="field-label">operation</span><span class="field-value">{input.operation}</span></div>{/if}
            {#if input.filePath}<div class="field-row"><span class="field-label">file</span><span class="field-value mono">{(typeof input.filePath === 'string' ? input.filePath.split('/').at(-1) : '') ?? ''}</span></div>{/if}
            {#if input.line}<div class="field-row"><span class="field-label">line</span><span class="field-value">{input.line}</span></div>{/if}
            {#if input.character}<div class="field-row"><span class="field-label">char</span><span class="field-value">{input.character}</span></div>{/if}
          </div>
        {/if}
        {#if result}
          <div class="tool-result-label">Result</div>
          <pre class="tool-result">{resultText}</pre>
        {/if}

      <!-- ===== SKILL ===== -->
      {:else if isSkillTool}
        {#if input}
          <span class="inline-badge">{typeof input.skill === 'string' ? input.skill : ''}</span>
          {#if input.args}<span class="field-value mono" style="margin-left: 8px;">{input.args}</span>{/if}
        {/if}
        {#if result}
          <div class="tool-result-label">Result</div>
          <pre class="tool-result">{resultText}</pre>
        {/if}

      <!-- ===== GENERIC FALLBACK ===== -->
      {:else}
        {#if input}
          <div class="labeled-fields">
            {#each getLabeledFields(input) as field}
              <div class="field-row">
                <span class="field-label">{field.key}</span>
                {#if field.isLong || field.isComplex}
                  <pre class="tool-input" style="margin-top: 2px;">{field.value}</pre>
                {:else}
                  <span class="field-value">{field.value}</span>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
        {#if result}
          <div class="tool-result-label">Result</div>
          <pre class="tool-result">{resultText}</pre>
        {/if}
      {/if}

      <!-- RAW JSON TOGGLE (all tools) -->
      <button class="raw-toggle" onclick={() => showRawJson = !showRawJson}>
        {showRawJson ? 'Hide' : 'Show'} raw JSON
      </button>
      {#if showRawJson}
        <div class="tool-input-label" style="margin-top: 8px;">Input</div>
        <pre class="tool-input">{inputJson}</pre>
        {#if result}
          <div class="tool-result-label">Full Result</div>
          <pre class="tool-result">{resultText}</pre>
        {/if}
      {/if}
    </div>
  {/if}
</div>

<style>
  .tool-call {
    background: var(--bg-deepest);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    overflow: hidden;
  }

  .tool-error {
    border-left: 3px solid var(--red) !important;
  }

  .tool-call-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    cursor: pointer;
    transition: background var(--transition);
    user-select: none;
    border: none;
    background: transparent;
    width: 100%;
    text-align: left;
    font-family: var(--font-ui);
  }

  .tool-call-header:hover {
    background: rgba(255, 255, 255, 0.03);
  }

  .tool-call-chevron {
    font-size: 10px;
    color: var(--text-muted);
    width: 14px;
    text-align: center;
    flex-shrink: 0;
  }

  .tool-call-name {
    font-family: var(--font-mono);
    font-size: 12.5px;
    font-weight: 500;
    color: var(--amber);
    background: var(--amber-dim);
    padding: 1px 8px;
    border-radius: 4px;
    flex-shrink: 0;
  }

  .tool-call-summary {
    font-size: 12px;
    color: var(--text-muted);
    margin-left: auto;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: var(--font-mono);
  }

  .tool-call-body {
    padding: 12px 16px;
    border-top: 1px solid var(--border);
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--text-secondary);
    line-height: 1.6;
    background: rgba(0, 0, 0, 0.15);
  }

  .tool-input-label,
  .tool-result-label {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-dim);
    margin-bottom: 4px;
  }

  .tool-result-label {
    margin-top: 12px;
    color: var(--cyan);
  }

  .tool-input,
  .tool-result {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
    font-family: var(--font-mono);
    font-size: 12px;
    line-height: 1.6;
    max-height: 300px;
    overflow-y: auto;
  }

  .tool-result {
    color: var(--text-muted);
    font-style: italic;
  }

  .result-error {
    color: var(--red) !important;
    background: var(--red-dim);
  }

  /* Diff view */
  .diff-container {
    font-family: var(--font-mono);
    font-size: 12px;
    line-height: 1.6;
    margin-top: 0;
  }

  .diff-file-path {
    font-size: 11px;
    color: var(--text-muted);
    margin-bottom: 6px;
  }

  .diff-line {
    padding: 1px 8px;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .diff-prefix {
    display: inline-block;
    width: 16px;
    flex-shrink: 0;
    user-select: none;
  }

  .diff-line-added {
    background: rgba(34, 197, 94, 0.12);
    color: var(--green);
  }

  .diff-line-removed {
    background: rgba(239, 68, 68, 0.12);
    color: var(--red);
  }

  .diff-line-context {
    color: var(--text-dim);
  }

  .raw-toggle {
    display: inline-block;
    margin-top: 8px;
    padding: 2px 8px;
    font-size: 11px;
    color: var(--text-dim);
    background: none;
    border: 1px solid var(--border-subtle);
    border-radius: 4px;
    cursor: pointer;
    font-family: var(--font-mono);
  }

  .raw-toggle:hover {
    color: var(--text-muted);
    border-color: var(--border);
  }

  /* Result preview */
  .result-preview {
    font-family: var(--font-mono);
    font-size: 11.5px;
    color: var(--text-muted);
    padding: 6px 12px;
    max-height: 100px;
    overflow: hidden;
    white-space: pre-wrap;
    word-break: break-word;
    border-top: 1px solid var(--border-subtle);
  }

  .result-more {
    display: block;
    width: 100%;
    font-size: 11px;
    color: var(--text-dim);
    padding: 4px 12px;
    cursor: pointer;
    background: none;
    border: none;
    border-top: 1px solid var(--border-subtle);
    text-align: left;
    font-family: var(--font-mono);
  }

  .result-more:hover {
    color: var(--text-muted);
    background: rgba(255, 255, 255, 0.02);
  }

  /* Labeled fields */
  .labeled-fields {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 8px;
  }

  .field-row {
    display: flex;
    align-items: baseline;
    gap: 8px;
    flex-wrap: wrap;
  }

  .field-label {
    font-size: 11px;
    color: var(--text-dim);
    min-width: 60px;
    flex-shrink: 0;
  }

  .field-value {
    font-size: 12px;
    color: var(--text-secondary);
    word-break: break-word;
  }

  .field-value.mono {
    font-family: var(--font-mono);
  }

  .field-subtitle {
    font-size: 11px;
    color: var(--text-dim);
    font-style: italic;
    margin: 4px 0;
  }

  /* Inline badges */
  .inline-badge {
    display: inline-block;
    font-family: var(--font-mono);
    font-size: 11px;
    padding: 1px 6px;
    border-radius: 4px;
    background: var(--bg-elevated);
    color: var(--text-muted);
  }

  /* Terminal-styled output for Bash */
  .terminal-output {
    background: #1a1a2e !important;
    color: var(--text-muted) !important;
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: var(--radius-sm);
    padding: 10px 12px;
    font-style: normal !important;
  }

  /* Syntax highlighted code container */
  .highlighted-code {
    max-height: 400px;
    overflow-y: auto;
    border-radius: var(--radius-sm);
    font-size: 12px;
    line-height: 1.6;
  }

  .highlighted-code :global(pre) {
    margin: 0;
    padding: 10px 12px;
    border-radius: var(--radius-sm);
  }

  .highlighted-code :global(code) {
    font-family: var(--font-mono);
    font-size: 12px;
  }

  /* Mono file list for Grep/Glob */
  .mono-list {
    font-style: normal !important;
    color: var(--text-secondary) !important;
  }

  /* Link-styled for URLs */
  .link-style {
    color: var(--blue) !important;
  }

  /* Preview subtitle */
  .preview-subtitle {
    font-size: 10.5px;
    color: var(--text-dim);
    margin-top: 2px;
    font-family: var(--font-mono);
  }

  .preview-lines {
    white-space: pre-wrap;
    word-break: break-word;
  }

  /* AskUserQuestion styles */
  .ask-question {
    margin-bottom: 8px;
  }

  .ask-options {
    list-style: disc;
    padding-left: 20px;
    margin: 4px 0;
    font-size: 12px;
    color: var(--text-secondary);
  }

  .ask-options li {
    margin: 2px 0;
  }

  .text-muted {
    color: var(--text-muted);
  }

  .agent-convo-toggle {
    display: inline-block;
    margin-top: 8px;
    padding: 2px 8px;
    font-size: 11px;
    color: var(--purple);
    background: var(--purple-dim);
    border: 1px solid transparent;
    border-radius: 4px;
    cursor: pointer;
    font-family: var(--font-mono);
  }
  .agent-convo-toggle:hover {
    border-color: var(--purple);
  }
  .agent-inline-convo {
    margin-top: 8px;
    border-top: 1px solid var(--border);
    padding-top: 8px;
    max-height: 50vh;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .agent-convo-loading,
  .agent-convo-empty {
    color: var(--text-muted);
    font-size: 12px;
    padding: 8px;
  }
</style>
