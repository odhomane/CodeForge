<script lang="ts">
import { goto } from "$app/navigation";
import {
	closeSearch,
	loadMore,
	searchMessages,
	searchStore,
} from "$lib/stores/search.svelte.js";

let inputEl = $state<HTMLInputElement | null>(null);
let highlightedIndex = $state(-1);

$effect(() => {
	if (searchStore.isOpen && inputEl) {
		inputEl.focus();
	}
});

$effect(() => {
	searchStore.results;
	highlightedIndex = -1;
});

function onInput(e: Event) {
	const value = (e.target as HTMLInputElement).value;
	searchMessages(value);
}

function setRoleFilter(role: "" | "user" | "assistant") {
	searchStore.filters.role = role;
	if (searchStore.query.trim()) {
		searchMessages(searchStore.query);
	}
}

function onKeydown(e: KeyboardEvent) {
	if (e.key === "Escape") {
		e.preventDefault();
		closeSearch();
		return;
	}

	if (searchStore.results.length === 0) return;

	if (e.key === "ArrowDown") {
		e.preventDefault();
		highlightedIndex = Math.min(
			highlightedIndex + 1,
			searchStore.results.length - 1,
		);
	} else if (e.key === "ArrowUp") {
		e.preventDefault();
		highlightedIndex = Math.max(highlightedIndex - 1, 0);
	} else if (e.key === "Enter" && highlightedIndex >= 0) {
		e.preventDefault();
		const selected = searchStore.results[highlightedIndex];
		if (selected) {
			selectResult(selected.sessionId);
		}
	}
}

function selectResult(sessionId: string) {
	closeSearch();
	goto(`/sessions/${sessionId}`);
}

function onBackdropClick(e: MouseEvent) {
	if ((e.target as HTMLElement).classList.contains("search-backdrop")) {
		closeSearch();
	}
}
</script>

{#if searchStore.isOpen}
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	class="search-backdrop"
	onclick={onBackdropClick}
	onkeydown={onKeydown}
	role="dialog"
	aria-label="Search messages"
>
	<div class="search-modal">
		<input
			class="search-modal-input"
			type="text"
			placeholder="Search messages..."
			value={searchStore.query}
			oninput={onInput}
			bind:this={inputEl}
		/>

		<div class="search-filters">
			<button
				class="filter-btn"
				class:active={searchStore.filters.role === ""}
				onclick={() => setRoleFilter("")}
			>
				All
			</button>
			<button
				class="filter-btn"
				class:active={searchStore.filters.role === "user"}
				onclick={() => setRoleFilter("user")}
			>
				User
			</button>
			<button
				class="filter-btn"
				class:active={searchStore.filters.role === "assistant"}
				onclick={() => setRoleFilter("assistant")}
			>
				Assistant
			</button>
		</div>

		{#if searchStore.loading}
			<div class="search-status">Searching...</div>
		{/if}

		{#if searchStore.meta.total > 0}
			<div class="search-count">{searchStore.meta.total} results</div>
		{/if}

		<div class="search-results">
			{#each searchStore.results as result, i}
				<button
					class="search-result-item"
					class:highlighted={i === highlightedIndex}
					onclick={() => selectResult(result.sessionId)}
				>
					<div class="result-header">
						<span class="type-badge {result.type}">{result.type}</span>
						<span class="result-meta">
							{result.sessionId.slice(0, 8)}&hellip; &middot; {new Date(result.timestamp).toLocaleDateString()}
						</span>
					</div>
					<div class="result-excerpt">{@html result.excerpt}</div>
				</button>
			{/each}

			{#if searchStore.meta.hasMore}
				<button class="load-more" onclick={loadMore}>Load more</button>
			{/if}

			{#if !searchStore.loading && searchStore.query && searchStore.results.length === 0}
				<div class="search-empty">No results found</div>
			{/if}
		</div>
	</div>
</div>
{/if}

<style>
	.search-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		z-index: 100;
		display: flex;
		justify-content: center;
		padding-top: 15vh;
	}

	.search-modal {
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		width: 600px;
		max-height: 65vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
	}

	.search-modal-input {
		padding: 16px 20px;
		font-size: 16px;
		background: transparent;
		border: none;
		border-bottom: 1px solid var(--border);
		color: var(--text-primary);
		outline: none;
		font-family: var(--font-ui);
	}

	.search-filters {
		display: flex;
		gap: 4px;
		padding: 8px 20px;
		border-bottom: 1px solid var(--border);
	}

	.filter-btn {
		background: transparent;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		padding: 4px 12px;
		font-size: 12px;
		color: var(--text-dim);
		cursor: pointer;
		font-family: var(--font-ui);
		transition:
			background var(--transition),
			color var(--transition);
	}

	.filter-btn:hover {
		color: var(--text-muted);
	}

	.filter-btn.active {
		background: var(--accent);
		border-color: var(--accent);
		color: var(--text-primary);
	}

	.search-status {
		padding: 12px 20px;
		color: var(--text-dim);
		font-size: 13px;
	}

	.search-count {
		padding: 8px 20px;
		color: var(--text-dim);
		font-size: 12px;
		border-bottom: 1px solid var(--border);
	}

	.search-results {
		overflow-y: auto;
		flex: 1;
	}

	.search-result-item {
		display: block;
		width: 100%;
		padding: 10px 20px;
		border: none;
		border-bottom: 1px solid var(--border);
		cursor: pointer;
		transition: background var(--transition);
		background: transparent;
		text-align: left;
		font-family: var(--font-ui);
		color: var(--text-primary);
	}

	.search-result-item:hover,
	.search-result-item.highlighted {
		background: var(--bg-hover);
	}

	.result-header {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 4px;
	}

	.type-badge {
		display: inline-block;
		padding: 2px 8px;
		border-radius: 10px;
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
	}

	.type-badge.user {
		background: rgba(59, 130, 246, 0.2);
		color: #60a5fa;
	}
	.type-badge.assistant {
		background: rgba(168, 85, 247, 0.2);
		color: #c084fc;
	}
	.type-badge.system {
		background: rgba(107, 114, 128, 0.2);
		color: #9ca3af;
	}

	.result-meta {
		font-size: 12px;
		color: var(--text-dim);
	}

	.result-excerpt {
		font-size: 13px;
		color: var(--text-muted);
		line-height: 1.4;
	}

	.search-result-item :global(mark) {
		background: rgba(234, 179, 8, 0.3);
		color: var(--text-primary);
		border-radius: 2px;
		padding: 0 2px;
	}

	.load-more {
		display: block;
		width: 100%;
		padding: 12px;
		background: transparent;
		border: none;
		color: var(--accent);
		font-size: 13px;
		cursor: pointer;
		font-family: var(--font-ui);
		transition: background var(--transition);
	}

	.load-more:hover {
		background: var(--bg-hover);
	}

	.search-empty {
		padding: 24px 20px;
		text-align: center;
		color: var(--text-dim);
		font-size: 14px;
	}
</style>
