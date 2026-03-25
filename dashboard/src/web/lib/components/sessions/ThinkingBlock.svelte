<script lang="ts">
import type { ThinkingBlock } from "../../../../parser/types.js";

let { block }: { block: ThinkingBlock } = $props();
let expanded = $state(false);

// Determine display mode
let isRedacted = $derived(!block.thinking && !!block.signature);
let isEmpty = $derived(!block.thinking && !block.signature);
</script>

{#if !isEmpty}
  <div class="thinking-block" class:expanded>
    {#if isRedacted}
      <div class="thinking-redacted">
        <span class="thinking-icon">&#x1f512;</span>
        <em>Extended thinking (content redacted)</em>
      </div>
    {:else}
      <button class="thinking-toggle" onclick={() => expanded = !expanded}>
        <span class="chevron">{expanded ? '\u25BC' : '\u25B6'}</span>
        Thinking...
      </button>
      {#if expanded}
        <div class="thinking-content">{block.thinking}</div>
      {/if}
    {/if}
  </div>
{/if}

<style>
  .thinking-block {
    margin-top: 10px;
    margin-bottom: 10px;
  }

  .thinking-toggle {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--text-muted);
    cursor: pointer;
    padding: 4px 8px;
    border-radius: var(--radius-sm);
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid var(--border);
    user-select: none;
    transition: background var(--transition);
    font-family: var(--font-ui);
  }

  .thinking-toggle:hover {
    background: rgba(255, 255, 255, 0.06);
  }

  .chevron {
    font-size: 10px;
    width: 14px;
    text-align: center;
  }

  .thinking-content {
    margin-top: 8px;
    padding: 12px 16px;
    background: rgba(0, 0, 0, 0.15);
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    font-size: 12.5px;
    font-style: italic;
    color: var(--text-muted);
    line-height: 1.65;
    font-family: var(--font-mono);
    max-height: 300px;
    overflow-y: auto;
    white-space: pre-wrap;
  }

  .thinking-redacted {
    font-size: 12px;
    color: var(--text-dim);
    font-style: italic;
    padding: 4px 8px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .thinking-icon {
    font-style: normal;
  }
</style>
