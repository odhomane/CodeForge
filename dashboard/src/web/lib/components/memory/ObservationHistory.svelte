<script lang="ts">
import DiffView from "$lib/components/shared/DiffView.svelte";
import {
	fetchObservationHistory,
	type ObservationHistoryEvent,
} from "$lib/stores/memory.svelte.js";
import { formatRelativeTime } from "$lib/utils/format.js";

interface Props {
	observationId: number;
}

let { observationId }: Props = $props();

let events = $state<ObservationHistoryEvent[]>([]);
let loading = $state(true);
let error = $state<string | null>(null);

$effect(() => {
	loading = true;
	error = null;
	fetchObservationHistory(observationId)
		.then((data) => {
			events = data;
		})
		.catch((e) => {
			error = e instanceof Error ? e.message : String(e);
		})
		.finally(() => {
			loading = false;
		});
});

function actionColor(action: string): string {
	switch (action) {
		case "created":
			return "action-created";
		case "reinforced":
			return "action-reinforced";
		case "consolidated":
			return "action-consolidated";
		case "status_changed":
			return "action-status-changed";
		default:
			return "";
	}
}

function parseMetadata(meta: string | null): Record<string, unknown> | null {
	if (!meta) return null;
	try {
		return JSON.parse(meta);
	} catch {
		return null;
	}
}
</script>

<div class="obs-history">
	{#if loading}
		<div class="history-loading">Loading history...</div>
	{:else if error}
		<div class="history-error">{error}</div>
	{:else if events.length === 0}
		<div class="history-empty">No history recorded for this observation</div>
	{:else}
		<div class="timeline">
			{#each events as event (event.id)}
				{@const meta = parseMetadata(event.metadata)}
				<div class="timeline-event">
					<div class="timeline-dot {actionColor(event.action)}"></div>
					<div class="event-content">
						<div class="event-header">
							<span class="action-badge {actionColor(event.action)}">{event.action.replace("_", " ")}</span>
							<span class="event-time">{formatRelativeTime(event.changedAt)}</span>
						</div>

						{#if event.action === "created" && event.newContent}
							<div class="event-detail">
								<span class="detail-label">Content:</span>
								<span class="detail-text">{event.newContent.length > 200 ? event.newContent.slice(0, 200) + "\u2026" : event.newContent}</span>
							</div>
						{/if}

						{#if event.action === "reinforced" && meta?.reason}
							<div class="event-detail">
								<span class="detail-label">Reason:</span>
								<span class="detail-text">{meta.reason}</span>
							</div>
						{/if}

						{#if event.action === "consolidated" && event.oldContent && event.newContent}
							<div class="event-diff">
								<DiffView
									oldText={event.oldContent}
									newText={event.newContent}
									oldLabel="Before"
									newLabel="After"
									maxHeight="200px"
								/>
							</div>
						{/if}

						{#if event.action === "status_changed"}
							<div class="event-detail">
								{#if event.oldStatus}
									<span class="status-tag old-status">{event.oldStatus}</span>
								{/if}
								<span class="status-arrow">&rarr;</span>
								{#if event.newStatus}
									<span class="status-tag new-status">{event.newStatus}</span>
								{/if}
							</div>
						{/if}

						<div class="event-ids">
							{#if event.runId}
								<span class="event-id">Run: {event.runId.slice(0, 8)}</span>
							{/if}
							{#if event.sessionId}
								<span class="event-id">Session: {event.sessionId.slice(0, 8)}</span>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.obs-history {
		padding: 12px 0 4px 0;
	}

	.history-loading,
	.history-empty,
	.history-error {
		font-size: 12px;
		color: var(--text-muted);
		padding: 12px 16px;
		text-align: center;
	}

	.history-error {
		color: var(--red);
	}

	.timeline {
		display: flex;
		flex-direction: column;
		gap: 0;
		padding-left: 12px;
		border-left: 2px solid var(--border);
		margin-left: 8px;
	}

	.timeline-event {
		position: relative;
		padding: 8px 0 8px 16px;
	}

	.timeline-dot {
		position: absolute;
		left: -7px;
		top: 14px;
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: var(--bg-card);
		border: 2px solid var(--border);
	}

	.timeline-dot.action-created {
		border-color: var(--green);
		background: var(--green-dim);
	}

	.timeline-dot.action-reinforced {
		border-color: var(--blue);
		background: rgba(59, 130, 246, 0.12);
	}

	.timeline-dot.action-consolidated {
		border-color: var(--purple);
		background: rgba(168, 85, 247, 0.12);
	}

	.timeline-dot.action-status-changed {
		border-color: var(--amber);
		background: var(--amber-dim);
	}

	.event-content {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.event-header {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.action-badge {
		font-size: 11px;
		font-weight: 600;
		padding: 1px 8px;
		border-radius: 4px;
		text-transform: capitalize;
	}

	.action-badge.action-created {
		color: var(--green);
		background: var(--green-dim);
	}

	.action-badge.action-reinforced {
		color: var(--blue);
		background: rgba(59, 130, 246, 0.12);
	}

	.action-badge.action-consolidated {
		color: var(--purple);
		background: rgba(168, 85, 247, 0.12);
	}

	.action-badge.action-status-changed {
		color: var(--amber);
		background: var(--amber-dim);
	}

	.event-time {
		font-size: 11px;
		color: var(--text-dim);
		font-family: var(--font-mono);
	}

	.event-detail {
		font-size: 12px;
		color: var(--text-secondary);
		display: flex;
		align-items: baseline;
		gap: 6px;
	}

	.detail-label {
		font-size: 11px;
		color: var(--text-dim);
		font-weight: 500;
		flex-shrink: 0;
	}

	.detail-text {
		font-size: 12px;
		color: var(--text-secondary);
		line-height: 1.4;
	}

	.event-diff {
		margin-top: 4px;
	}

	.status-tag {
		font-size: 11px;
		font-weight: 500;
		padding: 1px 6px;
		border-radius: 4px;
	}

	.old-status {
		color: var(--text-muted);
		background: var(--bg-surface);
	}

	.new-status {
		color: var(--amber);
		background: var(--amber-dim);
	}

	.status-arrow {
		color: var(--text-dim);
		font-size: 11px;
	}

	.event-ids {
		display: flex;
		gap: 8px;
	}

	.event-id {
		font-size: 10px;
		font-family: var(--font-mono);
		color: var(--text-dim);
	}
</style>
