<script lang="ts">
import { formatTokens } from "$lib/utils/format.js";

let { tokens, size = "sm" }: { tokens: number; size?: "sm" | "md" } = $props();

let display = $derived(formatTokens(tokens));
</script>

<span class="token-badge" class:md={size === 'md'}>
  <svg class="token-icon" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.5" />
    <path d="M8 5v6M6 7l2-2 2 2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
  {display} tokens
</span>

<style>
  .token-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-muted);
  }

  .token-badge.md {
    font-size: 12.5px;
  }

  .token-icon {
    width: 12px;
    height: 12px;
    flex-shrink: 0;
  }

  .md .token-icon {
    width: 14px;
    height: 14px;
  }
</style>
