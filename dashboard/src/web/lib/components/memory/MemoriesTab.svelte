<script lang="ts">
import { memoryStore, revokeMemory } from "$lib/stores/memory.svelte.js";
import { formatRelativeTime } from "$lib/utils/format.js";

let filtered = $derived(memoryStore.memories);
</script>

<div class="memories-tab">
	{#if filtered.length === 0}
		<div class="empty-state">No memories found.</div>
	{:else}
		<div class="mem-list">
			{#each filtered as mem (mem.id)}
				<div class="mem-card">
					<div class="mem-header">
						<span class="category-badge">{mem.category}</span>
						<span class="confidence-badge">
							{(mem.confidence * 100).toFixed(0)}% confidence
						</span>
						<span class="source-count">{mem.sourceObservationIds.length} source{mem.sourceObservationIds.length !== 1 ? 's' : ''}</span>
						{#if mem.status === 'approved'}
							<span class="status-badge status-approved">approved</span>
						{:else}
							<span class="status-badge status-revoked">revoked</span>
						{/if}
					</div>
					<div class="mem-content">{mem.content}</div>
					<div class="mem-footer">
						<span class="mem-meta">Approved: {formatRelativeTime(mem.approvedAt)}</span>
						<span class="mem-meta">Created: {formatRelativeTime(mem.createdAt)}</span>
						<div class="mem-actions">
							{#if mem.status === 'approved'}
								<button class="action-btn revoke-btn" onclick={() => revokeMemory(mem.id)}>Revoke</button>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.memories-tab {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.mem-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.mem-card {
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		padding: 14px 16px;
	}

	.mem-header {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 8px;
	}

	.category-badge {
		font-family: var(--font-mono);
		font-size: 11px;
		font-weight: 600;
		color: var(--purple);
		background: rgba(168, 85, 247, 0.12);
		padding: 2px 8px;
		border-radius: 4px;
	}

	.confidence-badge {
		font-family: var(--font-mono);
		font-size: 11px;
		font-weight: 600;
		color: var(--cyan);
		background: var(--cyan-dim);
		padding: 2px 8px;
		border-radius: 4px;
	}

	.source-count {
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--text-muted);
	}

	.status-badge {
		font-size: 11px;
		font-weight: 500;
		padding: 2px 8px;
		border-radius: 4px;
		margin-left: auto;
	}

	.status-approved {
		color: var(--green);
		background: var(--green-dim);
	}

	.status-revoked {
		color: var(--red);
		background: rgba(239, 68, 68, 0.1);
	}

	.mem-content {
		font-size: 13px;
		color: var(--text-primary);
		line-height: 1.5;
		margin-bottom: 8px;
	}

	.mem-footer {
		display: flex;
		align-items: center;
		gap: 12px;
		flex-wrap: wrap;
	}

	.mem-meta {
		font-size: 11px;
		color: var(--text-dim);
		font-family: var(--font-mono);
	}

	.mem-actions {
		display: flex;
		gap: 6px;
		margin-left: auto;
	}

	.action-btn {
		font-size: 11px;
		font-weight: 500;
		padding: 3px 10px;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border);
		cursor: pointer;
		transition: all var(--transition);
		background: var(--bg-surface);
	}

	.revoke-btn {
		color: var(--text-muted);
	}

	.revoke-btn:hover {
		background: rgba(239, 68, 68, 0.1);
		border-color: var(--red);
		color: var(--red);
	}

	.empty-state {
		text-align: center;
		padding: 48px 24px;
		color: var(--text-muted);
		font-size: 13px;
	}
</style>
