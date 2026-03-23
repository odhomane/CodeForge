<script lang="ts">
import type { MemoryRun } from "$lib/stores/memory.svelte.js";
import { formatCost, formatDuration, formatTokens } from "$lib/utils/format.js";
import type {
	SessionMessage,
	ToolResultBlock,
} from "../../../../parser/types.js";
import MessageBubble from "../sessions/MessageBubble.svelte";

let { run }: { run: MemoryRun & { events?: unknown[]; result?: unknown } } =
	$props();

function eventsToMessages(events: unknown[]): SessionMessage[] {
	return (events as any[])
		.filter((e: any) => e.type === "assistant" || e.type === "user")
		.map((e: any) => ({
			uuid: crypto.randomUUID(),
			type: e.type,
			timestamp: new Date().toISOString(),
			sessionId: "",
			message: e.message,
		}));
}

let messages = $derived(eventsToMessages(run.events ?? []));
let resultExpanded = $state(true);

let resultMap = $derived.by(() => {
	const map = new Map<string, ToolResultBlock>();
	for (const msg of messages) {
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

function statusClass(status: MemoryRun["status"]): string {
	switch (status) {
		case "running":
			return "status-running";
		case "completed":
			return "status-completed";
		case "failed":
			return "status-failed";
		default:
			return "";
	}
}
</script>

<div class="run-detail">
	<div class="run-meta">
		<div class="meta-row">
			<span class="meta-label">Run ID</span>
			<span class="meta-value mono">{run.runId}</span>
		</div>
		{#if run.sessionId}
			<div class="meta-row">
				<span class="meta-label">Session</span>
				<a href="/sessions/{run.sessionId}" class="meta-link">{run.sessionId.slice(0, 8)}</a>
			</div>
		{/if}
		<div class="meta-row">
			<span class="meta-label">Project</span>
			<span class="meta-value mono">{run.projectId}</span>
		</div>
		{#if run.model}
			<div class="meta-row">
				<span class="meta-label">Model</span>
				<span class="meta-value mono">{run.model}</span>
			</div>
		{/if}
		<div class="meta-row">
			<span class="meta-label">Status</span>
			<span class="meta-value {statusClass(run.status)}">{run.status}</span>
		</div>
		<div class="meta-row">
			<span class="meta-label">Cost</span>
			<span class="meta-value cost">{formatCost(run.costUsd)}</span>
		</div>
		<div class="meta-row">
			<span class="meta-label">Tokens</span>
			<span class="meta-value">{formatTokens(run.inputTokens)} in / {formatTokens(run.outputTokens)} out</span>
		</div>
		<div class="meta-row">
			<span class="meta-label">Duration</span>
			<span class="meta-value">{formatDuration(run.durationMs)}</span>
		</div>
		<div class="meta-row">
			<span class="meta-label">Turns</span>
			<span class="meta-value">{run.numTurns}</span>
		</div>
	</div>

	{#if run.error}
		<div class="run-error">{run.error}</div>
	{/if}

	{#if messages.length > 0}
		<div class="run-conversation">
			<div class="conversation-header">Conversation ({messages.length} messages)</div>
			<div class="conversation-list">
				{#each messages as message (message.uuid)}
					<MessageBubble {message} {resultMap} />
				{/each}
			</div>
		</div>
	{:else}
		<div class="no-events">No conversation events recorded.</div>
	{/if}

	{#if run.result}
		{@const resultData = run.result as Record<string, unknown>}
		<div class="result-section">
			<button class="result-toggle" onclick={() => resultExpanded = !resultExpanded}>
				<span class="toggle-icon">{resultExpanded ? '▼' : '▶'}</span>
				Analysis Results
			</button>
			{#if resultExpanded}
				<div class="result-content">
					{#if run.runType === 'analysis'}
						{#if Array.isArray(resultData.new_observations) && resultData.new_observations.length > 0}
							<div class="result-group">
								<div class="result-group-title">New Observations ({resultData.new_observations.length})</div>
								{#each resultData.new_observations as obs}
									<div class="result-card">
										<div class="result-card-header">
											<span class="result-badge">{obs.category}</span>
											<span class="result-key">{obs.key}</span>
										</div>
										<div class="result-card-body">{obs.content}</div>
										{#if obs.evidence}
											<div class="result-card-evidence">{obs.evidence}</div>
										{/if}
										{#if obs.suggested_memory}
											<div class="result-card-memory">→ {obs.suggested_memory}</div>
										{/if}
									</div>
								{/each}
							</div>
						{/if}
						{#if Array.isArray(resultData.reinforced_observations) && resultData.reinforced_observations.length > 0}
							<div class="result-group">
								<div class="result-group-title">Reinforced ({resultData.reinforced_observations.length})</div>
								{#each resultData.reinforced_observations as obs}
									<div class="result-card reinforced">
										<div class="result-card-header">
											<span class="result-badge reinforced">ID {obs.id}</span>
										</div>
										<div class="result-card-body">{obs.reason}</div>
										{#if obs.suggested_memory}
											<div class="result-card-memory">→ {obs.suggested_memory}</div>
										{/if}
									</div>
								{/each}
							</div>
						{/if}
					{:else if run.runType === 'maintenance'}
						{#if Array.isArray(resultData.consolidations) && resultData.consolidations.length > 0}
							<div class="result-group">
								<div class="result-group-title">Consolidations ({resultData.consolidations.length})</div>
								{#each resultData.consolidations as c}
									<div class="result-card">
										<div class="result-card-header">
											<span class="result-badge">Merge IDs: {c.merge_ids?.join(', ')}</span>
											<span class="result-key">→ #{c.surviving_id}</span>
										</div>
										<div class="result-card-body">{c.new_content}</div>
										{#if c.reason}
											<div class="result-card-evidence">{c.reason}</div>
										{/if}
									</div>
								{/each}
							</div>
						{/if}
						{#if Array.isArray(resultData.promotions) && resultData.promotions.length > 0}
							<div class="result-group">
								<div class="result-group-title">Promotions ({resultData.promotions.length})</div>
								{#each resultData.promotions as p}
									<div class="result-card promoted">
										<div class="result-card-header">
											<span class="result-badge promoted">Obs #{p.observation_id}</span>
											{#if p.confidence}
												<span class="result-key">Confidence: {(p.confidence * 100).toFixed(0)}%</span>
											{/if}
										</div>
										<div class="result-card-body">{p.memory_content}</div>
										{#if p.reason}
											<div class="result-card-evidence">{p.reason}</div>
										{/if}
									</div>
								{/each}
							</div>
						{/if}
						{#if Array.isArray(resultData.stale_removals) && resultData.stale_removals.length > 0}
							<div class="result-group">
								<div class="result-group-title">Stale Removals ({resultData.stale_removals.length})</div>
								{#each resultData.stale_removals as s}
									<div class="result-card stale">
										<div class="result-card-header">
											<span class="result-badge stale">Obs #{s.observation_id}</span>
										</div>
										{#if s.reason}
											<div class="result-card-body">{s.reason}</div>
										{/if}
									</div>
								{/each}
							</div>
						{/if}
					{/if}
					{#if resultData.summary}
						<div class="result-summary">{resultData.summary}</div>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.run-detail {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.run-meta {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 8px;
	}

	.meta-row {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.meta-label {
		font-size: 10.5px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-muted);
	}

	.meta-value {
		font-size: 13px;
		color: var(--text-primary);
	}

	.mono {
		font-family: var(--font-mono);
	}

	.cost {
		color: var(--green);
		font-family: var(--font-mono);
	}

	.meta-link {
		font-family: var(--font-mono);
		font-size: 13px;
		color: var(--accent);
		text-decoration: none;
	}

	.meta-link:hover {
		text-decoration: underline;
	}

	.status-running {
		color: var(--amber);
	}

	.status-completed {
		color: var(--green);
	}

	.status-failed {
		color: var(--red);
	}

	.run-error {
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid var(--red);
		border-radius: var(--radius-sm);
		padding: 10px 14px;
		color: var(--red);
		font-size: 13px;
		font-family: var(--font-mono);
	}

	.run-conversation {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.conversation-header {
		font-size: 12px;
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	.conversation-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.no-events {
		text-align: center;
		padding: 24px;
		color: var(--text-muted);
		font-size: 13px;
	}

	.result-section {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.result-toggle {
		display: flex;
		align-items: center;
		gap: 8px;
		background: none;
		border: none;
		color: var(--text-muted);
		font-size: 12px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		cursor: pointer;
		padding: 0;
	}

	.result-toggle:hover {
		color: var(--text-primary);
	}

	.toggle-icon {
		font-size: 10px;
		width: 12px;
	}

	.result-content {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.result-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.result-group-title {
		font-size: 12px;
		font-weight: 600;
		color: var(--text-secondary);
	}

	.result-card {
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		padding: 10px 14px;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.result-card.reinforced {
		border-left: 3px solid var(--accent);
	}

	.result-card.promoted {
		border-left: 3px solid var(--green);
	}

	.result-card.stale {
		border-left: 3px solid var(--text-muted);
		opacity: 0.7;
	}

	.result-card-header {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.result-badge {
		font-size: 11px;
		font-family: var(--font-mono);
		font-weight: 600;
		padding: 1px 6px;
		border-radius: 3px;
		background: rgba(255, 255, 255, 0.06);
		color: var(--text-secondary);
	}

	.result-badge.reinforced {
		background: rgba(99, 102, 241, 0.15);
		color: var(--accent);
	}

	.result-badge.promoted {
		background: rgba(34, 197, 94, 0.15);
		color: var(--green);
	}

	.result-badge.stale {
		background: rgba(255, 255, 255, 0.04);
		color: var(--text-muted);
	}

	.result-key {
		font-size: 11px;
		font-family: var(--font-mono);
		color: var(--text-muted);
	}

	.result-card-body {
		font-size: 13px;
		color: var(--text-primary);
		line-height: 1.5;
	}

	.result-card-evidence {
		font-size: 12px;
		color: var(--text-muted);
		font-style: italic;
		line-height: 1.4;
	}

	.result-card-memory {
		font-size: 12px;
		color: var(--accent);
		font-family: var(--font-mono);
		line-height: 1.4;
	}

	.result-summary {
		font-size: 13px;
		color: var(--text-secondary);
		line-height: 1.5;
		padding: 10px 14px;
		background: var(--bg-surface);
		border-radius: var(--radius-sm);
	}
</style>
