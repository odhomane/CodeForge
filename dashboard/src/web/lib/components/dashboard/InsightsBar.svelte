<script lang="ts">
let {
	insights = [],
}: {
	insights?: string[];
} = $props();

function highlightValues(text: string): string {
	return text
		.replace(/(\$[\d,.]+)/g, '<span class="highlight-value">$1</span>')
		.replace(/([\d.]+%)/g, '<span class="highlight-value">$1</span>');
}
</script>

{#if insights.length > 0}
	<div class="insights-bar">
		{#each insights as insight}
			<div class="insight-card">
				<svg class="insight-icon" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
					<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />
				</svg>
				<span class="insight-text">{@html highlightValues(insight)}</span>
			</div>
		{/each}
	</div>
{/if}

<style>
	.insights-bar {
		display: flex;
		gap: 12px;
		flex-wrap: wrap;
	}
	.insight-card {
		display: flex;
		align-items: flex-start;
		gap: 8px;
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 10px 14px;
		flex: 1 1 220px;
		min-width: 200px;
	}
	.insight-icon {
		flex-shrink: 0;
		color: var(--accent);
		margin-top: 1px;
	}
	.insight-text {
		font-size: 12.5px;
		color: var(--text-secondary);
		line-height: 1.5;
	}
	.insight-text :global(.highlight-value) {
		font-family: var(--font-mono);
		font-weight: 600;
		color: var(--text-primary);
	}
</style>
