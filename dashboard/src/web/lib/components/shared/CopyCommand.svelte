<script lang="ts">
let { sessionId }: { sessionId: string } = $props();

let copied = $state(false);

async function copyResume() {
	try {
		await navigator.clipboard.writeText(`claude --resume ${sessionId}`);
		copied = true;
		setTimeout(() => {
			copied = false;
		}, 2000);
	} catch {
		// Clipboard API may not be available
	}
}
</script>

<button class="resume-btn" onclick={copyResume}>
  {#if copied}
    <span class="copied-tooltip">Copied!</span>
  {/if}
  <svg class="resume-icon" viewBox="0 0 16 16" fill="none">
    <path d="M5 2H3a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V3a1 1 0 00-1-1h-2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" />
    <rect x="5" y="1" width="6" height="3" rx="1" stroke="currentColor" stroke-width="1.3" />
  </svg>
  Resume Session
</button>

<style>
  .resume-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--accent-dim);
    border: 1px solid rgba(249, 115, 22, 0.3);
    color: var(--accent);
    padding: 8px 16px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-family: var(--font-ui);
    font-size: 13px;
    font-weight: 500;
    transition: background var(--transition);
    position: relative;
  }

  .resume-btn:hover {
    background: var(--accent-glow);
  }

  .resume-icon {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
  }

  .copied-tooltip {
    position: absolute;
    top: -32px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--green);
    color: #fff;
    padding: 3px 10px;
    border-radius: var(--radius-sm);
    font-size: 11.5px;
    font-weight: 600;
    white-space: nowrap;
    animation: fadeOut 1.8s forwards;
  }

  @keyframes fadeOut {
    0%, 60% { opacity: 1; }
    100% { opacity: 0; }
  }
</style>
