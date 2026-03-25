<script lang="ts">
import { formatTokens } from "$lib/utils/format.js";
import { renderMarkdown } from "$lib/utils/markdown.js";

let {
	plan,
	loading,
}: {
	plan: { slug: string; title: string; content: string } | null | undefined;
	loading?: boolean;
} = $props();

let renderedContent = $state("");

$effect(() => {
	if (plan?.content) {
		renderMarkdown(plan.content).then((html) => {
			renderedContent = html;
		});
	} else {
		renderedContent = "";
	}
});

let estimatedTokens = $derived(
	plan?.content ? Math.ceil(plan.content.length / 4) : 0,
);
</script>

{#if loading}
  <div class="plan-empty">
    <span class="loading-dot"></span>
    <span class="loading-text">Loading plan...</span>
  </div>
{:else if !plan}
  <div class="plan-empty">No plan available for this session.</div>
{:else}
  <div class="plan-view">
    <div class="plan-header">
      <h2 class="plan-title">{plan.title}</h2>
      <span class="plan-slug">{plan.slug}</span>
      {#if estimatedTokens > 0}
        <span class="plan-tokens">~{formatTokens(estimatedTokens)} tokens</span>
      {/if}
    </div>
    <div class="plan-content rendered-markdown">
      {@html renderedContent}
    </div>
  </div>
{/if}

<style>
  .plan-empty {
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

  .loading-text {
    color: var(--text-dim);
    font-size: 13px;
    font-style: italic;
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 1; }
  }

  .plan-view {
    padding: 4px 0;
  }

  .plan-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }

  .plan-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }

  .plan-slug {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--cyan);
    background: var(--cyan-dim);
    padding: 3px 10px;
    border-radius: var(--radius-sm);
  }

  .plan-tokens {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-dim);
  }

  .plan-content {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: 20px 24px;
    max-height: calc(100vh - 360px);
    overflow-y: auto;
    font-size: 13.5px;
    line-height: 1.65;
    color: var(--text-secondary);
  }
</style>
