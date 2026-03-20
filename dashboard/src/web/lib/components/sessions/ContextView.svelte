<script lang="ts">
import { formatTokens } from "$lib/utils/format.js";
import { renderMarkdown } from "$lib/utils/markdown.js";

interface CtxFile {
	scope: string;
	path: string;
	filename: string;
	content: string;
}

let {
	context,
	loading,
}: {
	context: { memories: CtxFile[]; rules: CtxFile[] } | null | undefined;
	loading?: boolean;
} = $props();

let expandedItems = $state(new Set<string>());
let renderedContent = $state<Record<string, string>>({});

function toggleItem(path: string) {
	const next = new Set(expandedItems);
	if (next.has(path)) {
		next.delete(path);
	} else {
		next.add(path);
	}
	expandedItems = next;
}

$effect(() => {
	const allItems = [...(context?.memories ?? []), ...(context?.rules ?? [])];
	for (const item of allItems) {
		if (expandedItems.has(item.path) && !renderedContent[item.path]) {
			renderMarkdown(item.content).then((html) => {
				renderedContent = { ...renderedContent, [item.path]: html };
			});
		}
	}
});

function scopeColor(scope: string): string {
	switch (scope) {
		case "user":
			return "#a78bfa";
		case "project":
			return "#22d3ee";
		case "auto-memory":
			return "#4ade80";
		case "user-rules":
			return "#fbbf24";
		case "project-rules":
			return "#f59e0b";
		default:
			return "#a8a29e";
	}
}

function scopeBg(scope: string): string {
	switch (scope) {
		case "user":
			return "rgba(167, 139, 250, 0.15)";
		case "project":
			return "rgba(34, 211, 238, 0.15)";
		case "auto-memory":
			return "rgba(74, 222, 128, 0.15)";
		case "user-rules":
			return "rgba(251, 191, 36, 0.15)";
		case "project-rules":
			return "rgba(245, 158, 11, 0.15)";
		default:
			return "rgba(168, 162, 158, 0.15)";
	}
}

function estimateItemTokens(content: string): number {
	return Math.ceil(content.length / 4);
}

let memoryTokens = $derived(
	(context?.memories ?? []).reduce(
		(sum, m) => sum + estimateItemTokens(m.content),
		0,
	),
);
let rulesTokens = $derived(
	(context?.rules ?? []).reduce(
		(sum, r) => sum + estimateItemTokens(r.content),
		0,
	),
);
let totalContextTokens = $derived(memoryTokens + rulesTokens);
</script>

{#if loading}
  <div class="context-empty">
    <span class="loading-dot"></span>
    <span class="loading-text">Loading context...</span>
  </div>
{:else if !context}
  <div class="context-empty">No context available for this session.</div>
{:else}
  <div class="context-view">
    {#if totalContextTokens > 0}
      <div class="context-total-tokens">~{formatTokens(totalContextTokens)} estimated tokens</div>
    {/if}
    <!-- Memories Section -->
    <div class="context-section">
      <h3 class="section-title">Memories <span class="section-tokens">~{formatTokens(memoryTokens)} tokens</span></h3>
      {#if context.memories.length === 0}
        <div class="section-empty">No memory files found for this session's project.</div>
      {:else}
        <div class="context-cards">
          {#each context.memories as item (item.path)}
            <div class="context-card" class:expanded={expandedItems.has(item.path)}>
              <button class="context-card-header" onclick={() => toggleItem(item.path)}>
                <span class="chevron">{expandedItems.has(item.path) ? '\u25BC' : '\u25B6'}</span>
                <span class="scope-badge" style="color:{scopeColor(item.scope)};background:{scopeBg(item.scope)}">{item.scope}</span>
                <span class="ctx-filename">{item.filename}</span>
                <span class="ctx-path" title={item.path}>{item.path}</span>
                <span class="ctx-tokens">~{formatTokens(estimateItemTokens(item.content))}</span>
              </button>
              {#if expandedItems.has(item.path)}
                <div class="context-card-body rendered-markdown">
                  {#if renderedContent[item.path]}
                    {@html renderedContent[item.path]}
                  {:else}
                    <span class="loading-text">Rendering...</span>
                  {/if}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Rules Section -->
    <div class="context-section">
      <h3 class="section-title">Rules <span class="section-tokens">~{formatTokens(rulesTokens)} tokens</span></h3>
      {#if context.rules.length === 0}
        <div class="section-empty">No rules found for this session's project.</div>
      {:else}
        <div class="context-cards">
          {#each context.rules as item (item.path)}
            <div class="context-card" class:expanded={expandedItems.has(item.path)}>
              <button class="context-card-header" onclick={() => toggleItem(item.path)}>
                <span class="chevron">{expandedItems.has(item.path) ? '\u25BC' : '\u25B6'}</span>
                <span class="scope-badge" style="color:{scopeColor(item.scope)};background:{scopeBg(item.scope)}">{item.scope}</span>
                <span class="ctx-filename">{item.filename}</span>
                <span class="ctx-path" title={item.path}>{item.path}</span>
                <span class="ctx-tokens">~{formatTokens(estimateItemTokens(item.content))}</span>
              </button>
              {#if expandedItems.has(item.path)}
                <div class="context-card-body rendered-markdown">
                  {#if renderedContent[item.path]}
                    {@html renderedContent[item.path]}
                  {:else}
                    <span class="loading-text">Rendering...</span>
                  {/if}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .context-empty {
    text-align: center;
    padding: 48px 24px;
    color: var(--text-muted);
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .loading-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--accent);
    animation: pulse 1.2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 1; }
  }

  .context-total-tokens {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--text-dim);
    margin-bottom: 8px;
  }

  .context-view {
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 4px 0;
  }

  .section-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 12px;
    display: flex;
    align-items: baseline;
    gap: 8px;
  }

  .section-tokens {
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 400;
    color: var(--text-dim);
    text-transform: none;
    letter-spacing: normal;
  }

  .section-empty {
    padding: 24px 16px;
    color: var(--text-muted);
    font-size: 13px;
    text-align: center;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
  }

  .context-cards {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .context-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    overflow: hidden;
    transition: border-color var(--transition);
  }

  .context-card:hover {
    border-color: var(--border-hover);
  }

  .context-card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 10px 14px;
    background: none;
    border: none;
    cursor: pointer;
    font-family: var(--font-ui);
    color: var(--text-secondary);
    font-size: 13px;
    text-align: left;
  }

  .context-card-header:hover {
    background: rgba(255, 255, 255, 0.02);
  }

  .chevron {
    font-size: 10px;
    color: var(--text-dim);
    width: 14px;
    text-align: center;
    flex-shrink: 0;
  }

  .scope-badge {
    font-family: var(--font-mono);
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 4px;
    flex-shrink: 0;
    font-weight: 500;
  }

  .ctx-filename {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--text-primary);
    font-weight: 500;
  }

  .ctx-path {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-dim);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
  }

  .ctx-tokens {
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-dim);
    flex-shrink: 0;
    margin-left: auto;
  }

  .context-card-body {
    padding: 14px 16px;
    border-top: 1px solid var(--border);
    font-size: 13px;
    line-height: 1.6;
    color: var(--text-secondary);
    max-height: 400px;
    overflow-y: auto;
  }

  .loading-text {
    color: var(--text-dim);
    font-size: 12px;
    font-style: italic;
  }
</style>
