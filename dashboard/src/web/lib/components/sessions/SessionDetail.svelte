<script lang="ts">
import { memoryStore, startAnalysis } from "$lib/stores/memory.svelte.js";
import type { SessionDetail } from "$lib/stores/sessions.svelte.js";
import {
	fetchSessionContext,
	fetchSessionPlan,
	fetchSessionTasks,
	refreshSessionAgents,
} from "$lib/stores/sessions.svelte.js";
import {
	formatCost,
	formatDuration,
	formatTokens,
	truncateText,
} from "$lib/utils/format.js";
import { formatModelName } from "$lib/utils/pricing.js";
import type {
	SessionMessage,
	ToolResultBlock,
	ToolUseBlock,
} from "../../../../parser/types.js";
import { extractSearchableText } from "../../../../parser/types.js";
import CopyCommand from "../shared/CopyCommand.svelte";
import AgentsView from "./AgentsView.svelte";
import ContextView from "./ContextView.svelte";
import ConversationSearch from "./ConversationSearch.svelte";
import MessageBubble from "./MessageBubble.svelte";
import PlanView from "./PlanView.svelte";
import TasksView from "./TasksView.svelte";

type TabId =
	| "conversation"
	| "plan"
	| "agents"
	| "context"
	| "tasks"
	| "memory";

let { session, initialTab }: { session: SessionDetail; initialTab?: TabId } =
	$props();

let activeTab = $state<TabId>("conversation");
let planLoaded = $state(false);
let contextLoaded = $state(false);
let tasksLoaded = $state(false);
let agentsData = $derived(session._agentsData ?? null);
let memoryLoaded = $state(false);
let memoryRuns = $state<any[]>([]);
let didInit = $state(false);

// Apply initialTab and lazy-load the selected tab's data
$effect(() => {
	if (initialTab && !didInit) {
		activeTab = initialTab;
		didInit = true;
		if (initialTab === "plan" && !planLoaded) {
			fetchSessionPlan(session.sessionId).then(() => {
				planLoaded = true;
			});
		}
		if (initialTab === "context" && !contextLoaded) {
			fetchSessionContext(session.sessionId).then(() => {
				contextLoaded = true;
			});
		}
		if (initialTab === "tasks" && !tasksLoaded) {
			fetchSessionTasks(session.sessionId).then(() => {
				tasksLoaded = true;
			});
		}
		if (initialTab === "agents" && !agentsData) {
			refreshSessionAgents(session.sessionId);
		}
	}
});

async function selectTab(tab: TabId) {
	activeTab = tab;
	if (tab === "plan" && !planLoaded) {
		await fetchSessionPlan(session.sessionId);
		planLoaded = true;
	}
	if (tab === "context" && !contextLoaded) {
		await fetchSessionContext(session.sessionId);
		contextLoaded = true;
	}
	if (tab === "tasks" && !tasksLoaded) {
		await fetchSessionTasks(session.sessionId);
		tasksLoaded = true;
	}
	if (tab === "agents" && !agentsData) {
		await refreshSessionAgents(session.sessionId);
	}
	if (tab === "memory" && !memoryLoaded) {
		try {
			const res = await fetch(
				`/api/memory/runs?sessionId=${encodeURIComponent(session.sessionId)}`,
			);
			if (res.ok) {
				const data = await res.json();
				memoryRuns = data.runs ?? [];
			}
		} catch {
			/* ignore */
		}
		memoryLoaded = true;
	}
}

async function handleAnalyze() {
	await startAnalysis(session.sessionId);
}

let showPlanTab = $derived(session.hasPlan || !!session.plan);
let showAgentsTab = $derived(
	session.hasAgents || (agentsData?.sessions?.length ?? 0) > 0,
);
let showTasksTab = $derived(session.hasTeam || !!session.tasks);

// --- Global tool_use_id → ToolResultBlock map (cross-message pairing) ---
let globalResultMap = $derived.by(() => {
	const map = new Map<string, ToolResultBlock>();
	for (const msg of session.messages) {
		if (msg.type === "user" && Array.isArray(msg.message.content)) {
			for (const block of msg.message.content) {
				if (block.type === "tool_result") {
					map.set(block.tool_use_id, block as ToolResultBlock);
				}
			}
		}
	}
	return map;
});

/** Check if a user message contains only tool_result blocks (API protocol artifact) */
function isToolResultOnly(msg: SessionMessage): boolean {
	if (msg.type !== "user") return false;
	if (typeof msg.message.content === "string") return false;
	return msg.message.content.every((b) => b.type === "tool_result");
}

let totalTokens = $derived.by(() => {
	const meta = session.meta;
	if (!meta) return { input: 0, output: 0, cacheRead: 0, total: 0 };
	const input = meta.totalTokens.input;
	const output = meta.totalTokens.output;
	const cacheRead = meta.totalTokens.cacheRead;
	return { input, output, cacheRead, total: input + output + cacheRead };
});

let tokenBarSegments = $derived.by(() => {
	const total = totalTokens.total || 1;
	return {
		cacheRead: (totalTokens.cacheRead / total) * 100,
		input: (totalTokens.input / total) * 100,
		output: (totalTokens.output / total) * 100,
	};
});

let duration = $derived.by(() => {
	if (!session.meta?.timeRange) return 0;
	const start = new Date(session.meta.timeRange.start).getTime();
	const end = new Date(session.meta.timeRange.end).getTime();
	return end - start;
});

let toolCallCount = $derived.by(() => {
	let count = 0;
	for (const msg of session.messages) {
		if (msg.type === "assistant") {
			for (const block of msg.message.content) {
				if (block.type === "tool_use") count++;
			}
		}
	}
	return count;
});

let toolNames = $derived.by(() => {
	const names = new Set<string>();
	for (const msg of session.messages) {
		if (msg.type === "assistant") {
			for (const block of msg.message.content) {
				if (block.type === "tool_use") names.add((block as ToolUseBlock).name);
			}
		}
	}
	return Array.from(names).slice(0, 3).join(", ");
});

let models = $derived(session.meta?.models ?? []);

let costDisplay = $derived(
	session.cost ? formatCost(session.cost.totalCost) : "$0.00",
);

// --- Conversation Stats (AC-12) ---
let userTurnCount = $derived(
	session.messages.filter((m) => m.type === "user" && !isToolResultOnly(m))
		.length,
);

let thinkingBlockCount = $derived.by(() => {
	let count = 0;
	for (const msg of session.messages) {
		if (msg.type === "assistant") {
			for (const block of msg.message.content) {
				if (block.type === "thinking") count++;
			}
		}
	}
	return count;
});

// --- Conversation Search (AC-10) ---
let searchQuery = $state("");
let currentMatchIndex = $state(0);

let matchingMessageIds = $derived.by(() => {
	if (!searchQuery) return new Set<string>();
	const query = searchQuery.toLowerCase();
	const ids = new Set<string>();
	for (const msg of session.messages) {
		const text = extractSearchableText(msg).toLowerCase();
		if (text.includes(query)) {
			ids.add(msg.uuid);
		}
	}
	return ids;
});

let matchingUuids = $derived.by(() => {
	if (!searchQuery) return [] as string[];
	return session.messages
		.filter((m) => matchingMessageIds.has(m.uuid))
		.map((m) => m.uuid);
});

function handleSearch(query: string) {
	searchQuery = query;
	currentMatchIndex = 0;
	if (query) {
		scrollToCurrentMatch();
	}
}

function scrollToCurrentMatch() {
	if (matchingUuids.length === 0) return;
	const uuid = matchingUuids[currentMatchIndex];
	const el = document.querySelector(`[data-msg-uuid="${uuid}"]`);
	if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
}

function handleNextMatch() {
	if (matchingUuids.length === 0) return;
	currentMatchIndex = (currentMatchIndex + 1) % matchingUuids.length;
	scrollToCurrentMatch();
}

function handlePrevMatch() {
	if (matchingUuids.length === 0) return;
	currentMatchIndex =
		(currentMatchIndex - 1 + matchingUuids.length) % matchingUuids.length;
	scrollToCurrentMatch();
}

// --- Collapsible Tool Call Sequences (AC-11) ---
const TOOL_COLLAPSE_THRESHOLD = 3;

function isToolOnlyMessage(msg: SessionMessage): boolean {
	if (msg.type !== "assistant") return false;
	return (
		msg.message.content.length > 0 &&
		msg.message.content.every(
			(b) => b.type === "tool_use" || b.type === "tool_result",
		)
	);
}

type ConversationItem =
	| { kind: "message"; message: SessionMessage }
	| { kind: "tool-group"; messages: SessionMessage[]; toolSummary: string };

let conversationItems = $derived.by((): ConversationItem[] => {
	const items: ConversationItem[] = [];
	// Filter out user messages that are purely tool_result protocol artifacts
	const msgs = session.messages.filter((m) => !isToolResultOnly(m));
	let i = 0;
	while (i < msgs.length) {
		if (isToolOnlyMessage(msgs[i])) {
			const start = i;
			while (i < msgs.length && isToolOnlyMessage(msgs[i])) i++;
			const group = msgs.slice(start, i);
			if (group.length >= TOOL_COLLAPSE_THRESHOLD) {
				const counts = new Map<string, number>();
				for (const m of group) {
					if (m.type === "assistant") {
						for (const b of m.message.content) {
							if (b.type === "tool_use") {
								const name = (b as ToolUseBlock).name;
								counts.set(name, (counts.get(name) ?? 0) + 1);
							}
						}
					}
				}
				const summary = Array.from(counts.entries())
					.map(([name, count]) => `${name} (${count})`)
					.join(", ");
				items.push({
					kind: "tool-group",
					messages: group,
					toolSummary: summary,
				});
			} else {
				for (const m of group) items.push({ kind: "message", message: m });
			}
		} else {
			items.push({ kind: "message", message: msgs[i] });
			i++;
		}
	}
	return items;
});

let expandedGroups = $state(new Set<number>());

function toggleGroup(index: number) {
	const next = new Set(expandedGroups);
	if (next.has(index)) {
		next.delete(index);
	} else {
		next.add(index);
	}
	expandedGroups = next;
}
</script>

<div class="session-detail">
  <!-- Header -->
  <div class="detail-header">
    <div class="detail-header-left">
      <div class="detail-session-id">{session.sessionId.slice(0, 8)}</div>
      {#if session.meta?.slug}
        <div class="detail-slug">{session.meta.slug}</div>
      {/if}
      {#if session.project}
        <div class="detail-project">{session.project}</div>
      {/if}
      {#if toolCallCount > 0}
        <div class="detail-badge">{toolCallCount} tool calls</div>
      {/if}
    </div>
    <div class="detail-header-right">
      <button class="analyze-btn" onclick={handleAnalyze} disabled={!!memoryStore.analysisInProgress}>
        {#if memoryStore.analysisInProgress}
          Analyzing...
        {:else}
          Analyze
        {/if}
      </button>
      <CopyCommand sessionId={session.sessionId} />
    </div>
  </div>

  <!-- Metadata cards -->
  <div class="meta-cards">
    <div class="meta-card">
      <div class="meta-card-label">Model{models.length > 1 ? 's' : ''}</div>
      <div class="model-tags">
        {#each models as model}
          <span class="model-tag">{formatModelName(model)}</span>
        {/each}
        {#if models.length === 0}
          <span class="meta-card-value">Unknown</span>
        {/if}
      </div>
    </div>
    <div class="meta-card">
      <div class="meta-card-label">Duration</div>
      <div class="meta-card-value">{formatDuration(duration)}</div>
    </div>
    <div class="meta-card">
      <div class="meta-card-label">Total Tokens</div>
      <div class="meta-card-value">{formatTokens(totalTokens.total)}</div>
      <div class="meta-card-sub">In: {formatTokens(totalTokens.input)} / Out: {formatTokens(totalTokens.output)}</div>
    </div>
    <div class="meta-card">
      <div class="meta-card-label">Cost</div>
      <div class="meta-card-value cost-value">{costDisplay}</div>
    </div>
    <div class="meta-card">
      <div class="meta-card-label">Messages</div>
      <div class="meta-card-value">{session.messages.length}</div>
      <div class="meta-card-sub">{session.promptCount} prompts</div>
    </div>
    <div class="meta-card">
      <div class="meta-card-label">Tool Calls</div>
      <div class="meta-card-value">{toolCallCount}</div>
      {#if toolNames}
        <div class="meta-card-sub">{toolNames}</div>
      {/if}
    </div>
  </div>

  <!-- Extra metadata row -->
  {#if session.meta?.gitBranch || session.meta?.cwd}
    <div class="meta-extra">
      {#if session.meta?.gitBranch}
        <span class="meta-extra-item">
          <span class="meta-extra-label">Branch</span>
          <span class="meta-extra-value mono">{session.meta.gitBranch}</span>
        </span>
      {/if}
      {#if session.meta?.cwd}
        <span class="meta-extra-item">
          <span class="meta-extra-label">CWD</span>
          <span class="meta-extra-value mono" title={session.meta.cwd}>{truncateText(session.meta.cwd, 60)}</span>
        </span>
      {/if}
    </div>
  {/if}

  <!-- Token breakdown bar -->
  {#if totalTokens.total > 0}
    <div class="card token-card">
      <div class="card-header">
        <div class="card-title">Token Distribution</div>
      </div>
      <div class="token-breakdown-bar">
        <div
          class="segment"
          style="width:{tokenBarSegments.cacheRead}%;background:var(--green);border-radius:4px 0 0 4px;"
        ></div>
        <div
          class="segment"
          style="width:{tokenBarSegments.input}%;background:var(--blue);"
        ></div>
        <div
          class="segment"
          style="width:{tokenBarSegments.output}%;background:var(--purple);border-radius:0 4px 4px 0;"
        ></div>
      </div>
      <div class="token-breakdown-legend">
        <div class="legend-item">
          <div class="legend-dot" style="background:var(--green)"></div>
          Cache Read ({formatTokens(totalTokens.cacheRead)})
        </div>
        <div class="legend-item">
          <div class="legend-dot" style="background:var(--blue)"></div>
          Input ({formatTokens(totalTokens.input)})
        </div>
        <div class="legend-item">
          <div class="legend-dot" style="background:var(--purple)"></div>
          Output ({formatTokens(totalTokens.output)})
        </div>
      </div>
    </div>
  {/if}

  <!-- Tab Bar -->
  <div class="tab-bar">
    <button
      class="tab-btn"
      class:active={activeTab === 'conversation'}
      onclick={() => selectTab('conversation')}
    >Conversation</button>
    {#if showPlanTab}
      <button
        class="tab-btn"
        class:active={activeTab === 'plan'}
        onclick={() => selectTab('plan')}
      >Plan</button>
    {/if}
    {#if showAgentsTab}
      <button
        class="tab-btn"
        class:active={activeTab === 'agents'}
        onclick={() => selectTab('agents')}
      >Agents ({session.agentCount ?? 0})</button>
    {/if}
    <button
      class="tab-btn"
      class:active={activeTab === 'context'}
      onclick={() => selectTab('context')}
    >Context</button>
    {#if showTasksTab}
      <button
        class="tab-btn"
        class:active={activeTab === 'tasks'}
        onclick={() => selectTab('tasks')}
      >Tasks</button>
    {/if}
    <button
      class="tab-btn"
      class:active={activeTab === 'memory'}
      onclick={() => selectTab('memory')}
    >Memory</button>
  </div>

  <!-- Tab Content -->
  {#if activeTab === 'conversation'}
    <!-- Conversation Stats Bar (AC-12) -->
    <div class="conv-stats-bar">
      <span class="conv-stat"><span class="conv-stat-value">{session.messages.length}</span> messages</span>
      <span class="conv-stat"><span class="conv-stat-value">{userTurnCount}</span> turns</span>
      <span class="conv-stat"><span class="conv-stat-value">{toolCallCount}</span> tool calls</span>
      <span class="conv-stat"><span class="conv-stat-value">{thinkingBlockCount}</span> thinking</span>
    </div>

    <!-- Conversation Search (AC-10) -->
    <ConversationSearch
      onSearch={handleSearch}
      matchCount={matchingUuids.length}
      currentIndex={currentMatchIndex}
      onNext={handleNextMatch}
      onPrev={handlePrevMatch}
    />

    <!-- Conversation (AC-11: collapsible tool groups) -->
    <div class="conversation">
      {#each conversationItems as item, idx}
        {#if item.kind === 'message'}
          <div
            data-msg-uuid={item.message.uuid}
            class:search-match={searchQuery && matchingMessageIds.has(item.message.uuid)}
            class:search-current={searchQuery && matchingUuids[currentMatchIndex] === item.message.uuid}
          >
            <MessageBubble message={item.message} resultMap={globalResultMap} parentSessionId={session.sessionId} />
          </div>
        {:else if item.kind === 'tool-group'}
          {#if expandedGroups.has(idx)}
            <button class="tool-group-toggle expanded" onclick={() => toggleGroup(idx)}>
              <span class="chevron">&#9660;</span>
              <span class="tool-group-label">{item.messages.length} tool calls</span>
              <span class="tool-group-summary">{item.toolSummary}</span>
            </button>
            {#each item.messages as message (message.uuid)}
              <div
                data-msg-uuid={message.uuid}
                class:search-match={searchQuery && matchingMessageIds.has(message.uuid)}
                class:search-current={searchQuery && matchingUuids[currentMatchIndex] === message.uuid}
              >
                <MessageBubble {message} resultMap={globalResultMap} parentSessionId={session.sessionId} />
              </div>
            {/each}
          {:else}
            <button class="tool-group-toggle" onclick={() => toggleGroup(idx)}>
              <span class="chevron">&#9654;</span>
              <span class="tool-group-label">{item.messages.length} tool calls</span>
              <span class="tool-group-summary">{item.toolSummary}</span>
            </button>
          {/if}
        {/if}
      {/each}
    </div>
  {:else if activeTab === 'plan'}
    <PlanView plan={session.plan} loading={!planLoaded && showPlanTab} />
  {:else if activeTab === 'agents'}
    <AgentsView
      agents={agentsData?.sessions ?? []}
      unlinked={agentsData?.unlinked ?? []}
      parentStart={session.meta?.timeRange?.start}
      parentEnd={session.meta?.timeRange?.end}
    />
  {:else if activeTab === 'context'}
    <ContextView context={session.context} loading={!contextLoaded} />
  {:else if activeTab === 'tasks'}
    <TasksView tasks={session.tasks} teamName={session.teamName} loading={!tasksLoaded && showTasksTab} />
  {:else if activeTab === 'memory'}
    {#if !memoryLoaded}
      <div class="loading-state">Loading memory data...</div>
    {:else if memoryRuns.length === 0}
      <div class="empty-memory">No analysis runs for this session. Click "Analyze" to start one.</div>
    {:else}
      <div class="memory-runs">
        {#each memoryRuns as run (run.runId)}
          <div class="memory-run-card">
            <div class="memory-run-header">
              <span class="memory-run-type">{run.runType}</span>
              <span class="memory-run-status {run.status}">{run.status}</span>
              <span class="memory-run-cost">${run.costUsd.toFixed(4)}</span>
              <span class="memory-run-time">{new Date(run.startedAt).toLocaleString()}</span>
            </div>
            {#if run.error}
              <div class="memory-run-error">{run.error}</div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style>
  .session-detail {
    max-width: 100%;
  }

  .detail-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
  }

  .detail-header-left {
    display: flex;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
  }

  .detail-header-right {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }

  .detail-session-id {
    font-family: var(--font-mono);
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .detail-slug {
    font-family: var(--font-mono);
    font-size: 14px;
    color: var(--cyan);
    background: var(--cyan-dim);
    padding: 3px 10px;
    border-radius: var(--radius-sm);
  }

  .detail-project {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--cyan);
    background: var(--cyan-dim);
    padding: 3px 10px;
    border-radius: var(--radius-sm);
  }

  .detail-badge {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--amber);
    background: var(--amber-dim);
    padding: 3px 10px;
    border-radius: var(--radius-sm);
  }

  .meta-cards {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 14px;
    margin-bottom: 20px;
  }

  .meta-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: 16px;
  }

  .meta-card-label {
    font-size: 10.5px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-muted);
    margin-bottom: 6px;
  }

  .meta-card-value {
    font-family: var(--font-mono);
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .cost-value {
    color: var(--green);
  }

  .meta-card-sub {
    font-size: 11px;
    color: var(--text-muted);
    margin-top: 4px;
    font-family: var(--font-mono);
  }

  .model-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .model-tag {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--purple);
    background: rgba(168, 85, 247, 0.12);
    padding: 2px 8px;
    border-radius: 4px;
  }

  .meta-extra {
    display: flex;
    gap: 24px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }

  .meta-extra-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .meta-extra-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-dim);
  }

  .meta-extra-value {
    font-size: 12px;
    color: var(--text-secondary);
  }

  .mono {
    font-family: var(--font-mono);
  }

  .token-card {
    margin-bottom: 24px;
  }

  .token-breakdown-bar {
    height: 8px;
    border-radius: 4px;
    display: flex;
    overflow: hidden;
    margin-top: 8px;
    margin-bottom: 8px;
  }

  .segment {
    height: 100%;
    transition: width 0.4s ease;
  }

  .token-breakdown-legend {
    display: flex;
    gap: 16px;
    font-size: 11px;
    color: var(--text-muted);
    font-family: var(--font-mono);
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .legend-dot {
    width: 8px;
    height: 8px;
    border-radius: 2px;
    flex-shrink: 0;
  }

  .tab-bar {
    display: flex;
    gap: 0;
    border-bottom: 1px solid var(--border);
    margin-bottom: 16px;
  }

  .tab-btn {
    padding: 10px 20px;
    font-family: var(--font-ui);
    font-size: 13px;
    font-weight: 500;
    color: var(--text-muted);
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    transition: color var(--transition), border-color var(--transition);
  }

  .tab-btn:hover {
    color: var(--text-secondary);
  }

  .tab-btn.active {
    color: var(--accent);
    border-bottom-color: var(--accent);
  }

  .conv-stats-bar {
    position: sticky;
    top: 0;
    z-index: 10;
    background: var(--bg-deep);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 8px 16px;
    display: flex;
    gap: 20px;
    margin-bottom: 16px;
    font-size: 12px;
    color: var(--text-muted);
  }

  .conv-stat-value {
    font-family: var(--font-mono);
    font-weight: 600;
    color: var(--text-primary);
    margin-right: 4px;
  }

  .conversation {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .search-match {
    border-radius: var(--radius-md);
    outline: 1px solid var(--accent-dim);
  }

  .search-current {
    outline: 2px solid var(--accent);
  }

  .tool-group-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 10px 16px;
    background: var(--bg-deep);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    cursor: pointer;
    font-family: var(--font-ui);
    color: var(--text-muted);
    font-size: 12px;
    text-align: left;
  }

  .tool-group-toggle:hover {
    border-color: var(--text-dim);
    color: var(--text-secondary);
  }

  .tool-group-toggle .chevron {
    font-size: 10px;
    color: var(--text-dim);
    width: 14px;
    text-align: center;
  }

  .tool-group-label {
    font-family: var(--font-mono);
    font-weight: 600;
    color: var(--amber);
  }

  .tool-group-summary {
    font-family: var(--font-mono);
    color: var(--text-dim);
    font-size: 11px;
  }

  .analyze-btn {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    color: var(--accent);
    font-size: 12px;
    font-weight: 500;
    padding: 5px 12px;
    cursor: pointer;
    transition: all var(--transition);
    font-family: var(--font-ui);
  }

  .analyze-btn:hover:not(:disabled) {
    background: var(--accent-dim);
    border-color: var(--accent);
  }

  .analyze-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .loading-state {
    text-align: center;
    padding: 48px 24px;
    color: var(--text-muted);
    font-size: 13px;
  }

  .empty-memory {
    text-align: center;
    padding: 48px 24px;
    color: var(--text-muted);
    font-size: 13px;
  }

  .memory-runs {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .memory-run-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: 12px 16px;
  }

  .memory-run-header {
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: var(--font-mono);
    font-size: 12px;
  }

  .memory-run-type {
    font-weight: 600;
    color: var(--blue);
    background: rgba(59, 130, 246, 0.12);
    padding: 2px 8px;
    border-radius: 4px;
  }

  .memory-run-status {
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 4px;
  }

  .memory-run-status.completed {
    color: var(--green);
    background: var(--green-dim);
  }

  .memory-run-status.running {
    color: var(--amber);
    background: var(--amber-dim);
  }

  .memory-run-status.failed {
    color: var(--red);
    background: rgba(239, 68, 68, 0.1);
  }

  .memory-run-cost {
    color: var(--green);
  }

  .memory-run-time {
    color: var(--text-dim);
    margin-left: auto;
  }

  .memory-run-error {
    margin-top: 8px;
    font-size: 12px;
    color: var(--red);
    font-family: var(--font-mono);
  }

  @media (max-width: 900px) {
    .meta-cards {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  @media (max-width: 600px) {
    .meta-cards {
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style>
