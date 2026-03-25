<script lang="ts">
let {
	data = [] as { path: string; reads: number; edits: number }[],
}: {
	data: { path: string; reads: number; edits: number }[];
} = $props();

const topEntries = $derived(data.slice(0, 8));
</script>

<div class="card">
	<div class="card-header">
		<span class="card-title">Top Files</span>
		<span class="card-subtitle">By operations</span>
	</div>
	<div class="file-list">
		{#each topEntries as file}
			<div class="top-file-row">
				<span class="top-file-path" title={file.path}>{file.path}</span>
				<div class="top-file-stats">
					<span class="top-file-reads">{file.reads}R</span>
					<span class="top-file-edits">{file.edits}E</span>
				</div>
			</div>
		{/each}
		{#if !topEntries.length}
			<div class="empty">No file data available</div>
		{/if}
	</div>
</div>

<style>
	.file-list {
		display: flex;
		flex-direction: column;
	}
	.top-file-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 7px 0;
		border-bottom: 1px solid var(--border-subtle);
	}
	.top-file-row:last-child {
		border-bottom: none;
	}
	.top-file-path {
		font-family: var(--font-mono);
		font-size: 11.5px;
		color: var(--text-secondary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		flex: 1;
		margin-right: 12px;
	}
	.top-file-stats {
		display: flex;
		gap: 10px;
		flex-shrink: 0;
		font-family: var(--font-mono);
		font-size: 11px;
	}
	.top-file-reads {
		color: var(--cyan);
	}
	.top-file-edits {
		color: var(--amber);
	}
	.empty {
		font-size: 13px;
		color: var(--text-dim);
		text-align: center;
		padding: 20px;
	}
</style>
