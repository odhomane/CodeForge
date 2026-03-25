<script lang="ts">
let {
	value = "all",
	onChange,
}: {
	value?: string;
	onChange?: (value: string) => void;
} = $props();

const presets = [
	{ key: "7d", label: "7 days" },
	{ key: "30d", label: "30 days" },
	{ key: "90d", label: "90 days" },
	{ key: "all", label: "All time" },
];
</script>

<div class="toggle-group">
	{#each presets as preset}
		<button
			class="toggle-btn"
			class:active={value === preset.key}
			onclick={() => onChange?.(preset.key)}
			type="button"
		>
			{preset.label}
		</button>
	{/each}
</div>

<style>
	.toggle-group {
		display: flex;
		gap: 2px;
		background: var(--bg-deep);
		border-radius: var(--radius-sm);
		padding: 2px;
	}
	.toggle-btn {
		padding: 4px 12px;
		font-size: 11.5px;
		font-weight: 500;
		border: none;
		background: transparent;
		color: var(--text-muted);
		border-radius: 4px;
		cursor: pointer;
		font-family: var(--font-ui);
		transition: background var(--transition), color var(--transition);
	}
	.toggle-btn.active {
		background: var(--accent-dim);
		color: var(--accent);
	}
	.toggle-btn:hover:not(.active) {
		color: var(--text-secondary);
	}
</style>
