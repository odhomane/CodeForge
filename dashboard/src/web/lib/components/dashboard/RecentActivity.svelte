<script lang="ts">
import {
	formatDuration,
	formatRelativeTime,
	formatTokens,
	truncateText,
} from "$lib/utils/format.js";

let {
	data = [] as {
		sessionId: string;
		project?: string;
		prompt?: string;
		duration: number;
		tokens: number;
		timestamp?: string;
	}[],
}: {
	data: {
		sessionId: string;
		project?: string;
		prompt?: string;
		duration: number;
		tokens: number;
		timestamp?: string;
	}[];
} = $props();
</script>

<div class="card">
	<div class="card-header">
		<span class="card-title">Recent Activity</span>
	</div>
	<div class="activity-feed">
		{#each data as item}
			<div class="activity-item">
				<div class="activity-time">{item.timestamp ? formatRelativeTime(item.timestamp) : ""}</div>
				<div class="activity-dot-line">
					<div class="activity-dot"></div>
				</div>
				<div class="activity-body">
					{#if item.project}
						<div class="activity-project">{item.project}</div>
					{/if}
					<div class="activity-prompt" title={item.prompt ?? ""}>{item.prompt ? truncateText(item.prompt, 50) : "No prompt"}</div>
					<div class="activity-meta">
						<span>{formatDuration(item.duration)}</span>
						<span>{formatTokens(item.tokens)} tokens</span>
					</div>
				</div>
			</div>
		{/each}
		{#if !data.length}
			<div class="empty">No recent activity</div>
		{/if}
	</div>
</div>

<style>
	.activity-feed {
		display: flex;
		flex-direction: column;
		gap: 0;
	}
	.activity-item {
		display: flex;
		align-items: flex-start;
		gap: 14px;
		padding: 14px 0;
		border-bottom: 1px solid var(--border-subtle);
	}
	.activity-item:last-child {
		border-bottom: none;
	}
	.activity-time {
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--text-dim);
		width: 60px;
		flex-shrink: 0;
		padding-top: 2px;
	}
	.activity-dot-line {
		display: flex;
		flex-direction: column;
		align-items: center;
		flex-shrink: 0;
		padding-top: 4px;
	}
	.activity-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--accent);
		flex-shrink: 0;
	}
	.activity-body {
		flex: 1;
		min-width: 0;
	}
	.activity-project {
		font-size: 12px;
		font-weight: 600;
		color: var(--accent);
		margin-bottom: 2px;
	}
	.activity-prompt {
		font-size: 13px;
		color: var(--text-primary);
		margin-bottom: 4px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.activity-meta {
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--text-dim);
		display: flex;
		gap: 12px;
	}
	.empty {
		font-size: 13px;
		color: var(--text-dim);
		text-align: center;
		padding: 20px;
	}
</style>
