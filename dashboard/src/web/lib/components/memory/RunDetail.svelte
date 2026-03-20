<script lang="ts">
import type { MemoryRun } from "$lib/stores/memory.svelte.js";
import { formatCost, formatDuration, formatTokens } from "$lib/utils/format.js";
import type {
	SessionMessage,
	ToolResultBlock,
} from "../../../../parser/types.js";
import MessageBubble from "../sessions/MessageBubble.svelte";

let { run }: { run: MemoryRun & { events: unknown[] } } = $props();

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
</style>
