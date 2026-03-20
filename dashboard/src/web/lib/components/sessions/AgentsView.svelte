<script lang="ts">
import type {
	SubagentSession,
	UnlinkedAgent,
} from "$lib/stores/agents.svelte.js";
import AgentTimeline from "./AgentTimeline.svelte";
import MessageBubble from "./MessageBubble.svelte";

interface Props {
	agents: SubagentSession[];
	unlinked: UnlinkedAgent[];
	parentStart?: string;
	parentEnd?: string;
}

let { agents, unlinked, parentStart, parentEnd }: Props = $props();

let expandedId = $state<string | null>(null);
let agentMessages = $state<Record<string, any[]>>({});
let loadingMessages = $state<Record<string, boolean>>({});

function formatDuration(start: string | null, end: string | null): string {
	if (!start) return "\u2014";
	const s = new Date(start).getTime();
	const e = end ? new Date(end).getTime() : Date.now();
	const sec = Math.round((e - s) / 1000);
	if (sec < 60) return `${sec}s`;
	const min = Math.floor(sec / 60);
	if (min < 60) return `${min}m ${sec % 60}s`;
	return `${Math.floor(min / 60)}h ${min % 60}m`;
}

function formatTokens(n: number): string {
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
	if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
	return String(n);
}

async function toggleExpand(sessionId: string) {
	if (expandedId === sessionId) {
		expandedId = null;
		return;
	}
	expandedId = sessionId;
	if (!agentMessages[sessionId]) {
		loadingMessages[sessionId] = true;
		try {
			const res = await fetch(
				`/api/sessions/${encodeURIComponent(sessionId)}/messages`,
			);
			if (res.ok) {
				const data = await res.json();
				agentMessages[sessionId] = data.messages ?? [];
			}
		} catch {
			/* ignore */
		}
		loadingMessages[sessionId] = false;
	}
}

let completedCount = $derived(agents.filter((a) => a.time_end).length);
</script>

<div class="agents-view">
	<div class="agents-header">
		<h3>Agent Sessions</h3>
		<span class="agent-count"
			>{completedCount}/{agents.length + unlinked.length} completed</span
		>
	</div>

	{#if agents.filter(a => a.time_start).length >= 2 && parentStart && parentEnd}
		<AgentTimeline {agents} {parentStart} {parentEnd} />
	{/if}

	{#if agents.length === 0 && unlinked.length === 0}
		<div class="empty-state">No agent sessions found</div>
	{/if}

	<div class="agent-cards">
		{#each agents as agent (agent.session_id)}
			{@const isExpanded = expandedId === agent.session_id}
			<div class="agent-card" class:expanded={isExpanded} style="margin-left: {((agent.depth ?? 1) - 1) * 24}px">
				<button
					class="agent-card-header"
					onclick={() => toggleExpand(agent.session_id)}
				>
					<div class="agent-info">
						<span class="agent-name"
							>{agent.agent_name ??
								agent.session_id.slice(0, 8)}</span
						>
						{#if agent.agent_type}
							<span class="agent-type-badge"
								>{agent.agent_type}</span
							>
						{/if}
						{#if (agent.depth ?? 1) > 1}
							<span class="depth-badge">L{agent.depth}</span>
						{/if}
						{#if agent.description}
							<span class="agent-desc" title={agent.description}>{agent.description}</span>
						{/if}
					</div>
					<div class="agent-stats">
						<span class="stat" title="Messages"
							>{agent.message_count ?? 0} msgs</span
						>
						<span class="stat" title="Tokens"
							>{formatTokens(
								(agent.input_tokens ?? 0) +
									(agent.output_tokens ?? 0),
							)} tok</span
						>
						<span class="stat" title="Duration"
							>{formatDuration(
								agent.time_start,
								agent.time_end,
							)}</span
						>
						<span
							class="status-dot"
							class:active={!agent.time_end}
							class:done={!!agent.time_end}
						></span>
					</div>
					<span class="expand-arrow"
						>{isExpanded ? "\u25BC" : "\u25B6"}</span
					>
				</button>

				{#if isExpanded}
					<div class="agent-conversation">
						{#if loadingMessages[agent.session_id]}
							<div class="loading">Loading conversation...</div>
						{:else if agentMessages[agent.session_id]?.length}
							{#each agentMessages[agent.session_id] as msg (msg.uuid)}
								<MessageBubble message={msg} />
							{/each}
						{:else}
							<div class="empty-state">
								No messages available
							</div>
						{/if}
					</div>
				{/if}
			</div>
		{/each}

		{#each unlinked as agent (agent.id)}
			<div class="agent-card pending">
				<div class="agent-card-header">
					<div class="agent-info">
						<span class="agent-name"
							>{agent.agent_name ?? "Pending agent"}</span
						>
						{#if agent.agent_type}
							<span class="agent-type-badge"
								>{agent.agent_type}</span
							>
						{/if}
						{#if agent.description}
							<span class="agent-desc" title={agent.description}>{agent.description}</span>
						{/if}
					</div>
					<div class="agent-stats">
						<span class="status-dot pending"></span>
						<span class="stat">Awaiting session...</span>
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.agents-view {
		padding: 4px 0;
	}
	.agents-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 16px;
	}
	.agents-header h3 {
		font-size: 14px;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
	}
	.agent-count {
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--text-dim);
	}
	.empty-state {
		color: var(--text-muted);
		font-size: 14px;
		padding: 48px 24px;
		text-align: center;
	}

	.agent-cards {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.agent-card {
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		overflow: hidden;
		transition: border-color var(--transition);
	}
	.agent-card:hover {
		border-color: var(--border-hover);
	}
	.agent-card.expanded {
		border-color: var(--accent);
	}
	.agent-card.pending {
		opacity: 0.6;
	}

	.agent-card-header {
		display: flex;
		align-items: center;
		gap: 12px;
		width: 100%;
		padding: 10px 14px;
		background: none;
		border: none;
		color: var(--text-secondary);
		cursor: pointer;
		text-align: left;
		font-family: var(--font-ui);
		font-size: 13px;
	}
	.agent-card-header:hover {
		background: rgba(255, 255, 255, 0.02);
	}

	.agent-info {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 8px;
		min-width: 0;
	}
	.agent-name {
		font-weight: 500;
		white-space: nowrap;
		color: var(--text-primary);
	}
	.agent-type-badge {
		font-family: var(--font-mono);
		font-size: 11px;
		padding: 1px 6px;
		border-radius: 4px;
		background: var(--purple-dim);
		color: var(--purple);
		white-space: nowrap;
	}
	.agent-desc {
		color: var(--text-muted);
		font-size: 12px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.depth-badge {
		font-family: var(--font-mono);
		font-size: 10px;
		padding: 1px 5px;
		border-radius: 3px;
		background: var(--cyan-dim);
		color: var(--cyan);
		white-space: nowrap;
	}

	.agent-stats {
		display: flex;
		align-items: center;
		gap: 12px;
		flex-shrink: 0;
	}
	.stat {
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--text-muted);
		white-space: nowrap;
	}

	.status-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}
	.status-dot.done {
		background: var(--green);
	}
	.status-dot.active {
		background: var(--amber);
		animation: pulse 2s infinite;
	}
	.status-dot.pending {
		background: var(--text-dim);
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.4;
		}
	}

	.expand-arrow {
		font-size: 10px;
		color: var(--text-dim);
		flex-shrink: 0;
	}

	.agent-conversation {
		border-top: 1px solid var(--border);
		padding: 16px;
		max-height: 60vh;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	.loading {
		color: var(--text-muted);
		font-size: 13px;
		padding: 16px;
		text-align: center;
	}
</style>
