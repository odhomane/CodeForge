<script lang="ts">
let {
	onSearch,
	matchCount = 0,
	currentIndex = 0,
	onNext,
	onPrev,
}: {
	onSearch: (query: string) => void;
	matchCount?: number;
	currentIndex?: number;
	onNext?: () => void;
	onPrev?: () => void;
} = $props();

let query = $state("");
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function handleInput(e: Event) {
	query = (e.target as HTMLInputElement).value;
	if (debounceTimer) clearTimeout(debounceTimer);
	debounceTimer = setTimeout(() => onSearch(query), 200);
}

function handleKeydown(e: KeyboardEvent) {
	if (e.key === "Escape") {
		query = "";
		onSearch("");
	} else if (e.key === "Enter") {
		if (e.shiftKey) {
			onPrev?.();
		} else {
			onNext?.();
		}
	}
}
</script>

<div class="conv-search">
  <div class="conv-search-input-wrap">
    <svg class="conv-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
    <input
      type="text"
      class="conv-search-input"
      placeholder="Search conversation..."
      value={query}
      oninput={handleInput}
      onkeydown={handleKeydown}
    />
    {#if query}
      <span class="conv-search-count" class:has-matches={matchCount > 0}>
        {matchCount > 0 ? `${currentIndex + 1}/${matchCount}` : '0'}
      </span>
      <button class="conv-search-nav" onclick={() => onPrev?.()} disabled={matchCount === 0} aria-label="Previous match">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="18 15 12 9 6 15"/>
        </svg>
      </button>
      <button class="conv-search-nav" onclick={() => onNext?.()} disabled={matchCount === 0} aria-label="Next match">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
    {/if}
  </div>
</div>

<style>
  .conv-search {
    margin-bottom: 12px;
  }

  .conv-search-input-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 6px 12px;
  }

  .conv-search-icon {
    color: var(--text-dim);
    flex-shrink: 0;
  }

  .conv-search-input {
    flex: 1;
    background: none;
    border: none;
    outline: none;
    font-size: 13px;
    font-family: var(--font-ui);
    color: var(--text-primary);
  }

  .conv-search-input::placeholder {
    color: var(--text-dim);
  }

  .conv-search-count {
    font-size: 11px;
    font-family: var(--font-mono);
    color: var(--text-dim);
    background: var(--bg-elevated);
    padding: 1px 6px;
    border-radius: 4px;
    flex-shrink: 0;
  }

  .conv-search-count.has-matches {
    color: var(--accent);
    background: var(--accent-dim);
  }

  .conv-search-nav {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    background: none;
    border: 1px solid var(--border);
    border-radius: 4px;
    cursor: pointer;
    color: var(--text-muted);
    flex-shrink: 0;
    padding: 0;
  }

  .conv-search-nav:hover:not(:disabled) {
    color: var(--text-primary);
    border-color: var(--text-dim);
  }

  .conv-search-nav:disabled {
    opacity: 0.3;
    cursor: default;
  }
</style>
