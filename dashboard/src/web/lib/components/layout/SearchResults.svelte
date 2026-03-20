<script lang="ts">
import { goto } from "$app/navigation";
import { truncateText } from "$lib/utils/format.js";

interface SearchResult {
	sessionId: string;
	project?: string;
	firstPrompt?: string;
}

let {
	results,
	visible,
	onclose,
	highlightedIndex = -1,
}: {
	results: SearchResult[];
	visible: boolean;
	onclose: () => void;
	highlightedIndex?: number;
} = $props();

function selectResult(sessionId: string) {
	onclose();
	goto(`/sessions/${sessionId}`);
}
</script>

{#if visible && results.length > 0}
	<div class="search-results">
		{#each results as result, i (result.sessionId)}
			<button
				class="search-result-item"
				class:highlighted={i === highlightedIndex}
				onclick={() => selectResult(result.sessionId)}
				type="button"
			>
				<span class="search-result-id">{result.sessionId.slice(0, 8)}</span>
				{#if result.project}
					<span class="search-result-project">{result.project}</span>
				{/if}
				<span class="search-result-prompt" title={result.firstPrompt ?? ""}>{result.firstPrompt ? truncateText(result.firstPrompt, 60) : '-'}</span>
			</button>
		{/each}
	</div>
{/if}

<style>
	.search-results {
		position: absolute;
		top: 100%;
		right: 0;
		width: 400px;
		max-height: 400px;
		overflow-y: auto;
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
		z-index: 100;
	}
	.search-result-item {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 14px;
		cursor: pointer;
		border: none;
		border-bottom: 1px solid var(--border-subtle);
		transition: background var(--transition);
		background: transparent;
		width: 100%;
		text-align: left;
		font-family: var(--font-ui);
	}
	.search-result-item:hover,
	.search-result-item.highlighted {
		background: var(--accent-dim);
	}
	.search-result-id {
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--text-muted);
		flex-shrink: 0;
	}
	.search-result-project {
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--cyan);
		background: var(--cyan-dim);
		padding: 1px 6px;
		border-radius: 4px;
		flex-shrink: 0;
	}
	.search-result-prompt {
		font-size: 12px;
		color: var(--text-secondary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		flex: 1;
	}
</style>
