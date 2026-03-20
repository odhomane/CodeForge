<script lang="ts">
import { computeDiff, type DiffLine } from "$lib/utils/diff.js";

interface Props {
	oldText: string;
	newText: string;
	oldLabel?: string;
	newLabel?: string;
	maxHeight?: string;
}

let {
	oldText,
	newText,
	oldLabel,
	newLabel,
	maxHeight = "400px",
}: Props = $props();

let lines: DiffLine[] = $derived(computeDiff(oldText, newText));

let stats = $derived.by(() => {
	let added = 0;
	let removed = 0;
	for (const line of lines) {
		if (line.type === "added") added++;
		else if (line.type === "removed") removed++;
	}
	return { added, removed };
});

const prefixMap: Record<DiffLine["type"], string> = {
	added: "+",
	removed: "-",
	context: " ",
};
</script>

<div class="diff-view">
	<div class="diff-header">
		<span class="diff-stats">
			<span class="stat-added">+{stats.added}</span>
			<span class="stat-removed">-{stats.removed}</span>
		</span>
		{#if oldLabel || newLabel}
			<span class="diff-labels">
				{#if oldLabel}<span class="diff-label-old">{oldLabel}</span>{/if}
				{#if oldLabel && newLabel}<span class="diff-label-sep">&rarr;</span>{/if}
				{#if newLabel}<span class="diff-label-new">{newLabel}</span>{/if}
			</span>
		{/if}
	</div>
	<div class="diff-scroll" style:max-height={maxHeight}>
		{#each lines as line}
			<div class="diff-line diff-line-{line.type}">
				<span class="diff-prefix">{prefixMap[line.type]}</span>{line.text}
			</div>
		{/each}
	</div>
</div>

<style>
	.diff-view {
		font-family: var(--font-mono);
		font-size: 12px;
		line-height: 1.6;
		border-radius: 6px;
		overflow: hidden;
	}

	.diff-header {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 6px 10px;
		background: rgba(255, 255, 255, 0.04);
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
	}

	.diff-stats {
		display: flex;
		gap: 8px;
		font-weight: 600;
	}

	.stat-added {
		color: var(--green);
	}

	.stat-removed {
		color: var(--red);
	}

	.diff-labels {
		display: flex;
		align-items: center;
		gap: 6px;
		color: var(--text-dim);
		font-size: 11px;
	}

	.diff-label-sep {
		opacity: 0.5;
	}

	.diff-scroll {
		overflow-y: auto;
	}

	.diff-line {
		padding: 1px 8px;
		white-space: pre-wrap;
		word-break: break-word;
	}

	.diff-prefix {
		display: inline-block;
		width: 16px;
		flex-shrink: 0;
		user-select: none;
	}

	.diff-line-added {
		background: rgba(34, 197, 94, 0.12);
		color: var(--green);
	}

	.diff-line-removed {
		background: rgba(239, 68, 68, 0.12);
		color: var(--red);
	}

	.diff-line-context {
		color: var(--text-dim);
	}
</style>
