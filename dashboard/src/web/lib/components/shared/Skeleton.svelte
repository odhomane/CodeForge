<script lang="ts">
let {
	width = "100%",
	height = "20px",
	borderRadius = "var(--radius-sm)",
}: {
	width?: string;
	height?: string;
	borderRadius?: string;
} = $props();
</script>

<div
	class="skeleton"
	style="width:{width};height:{height};border-radius:{borderRadius}"
></div>

<style>
	@keyframes skeleton-pulse {
		0%, 100% { opacity: 0.4; }
		50% { opacity: 1.0; }
	}
	.skeleton {
		background: var(--bg-elevated);
		animation: skeleton-pulse 1.5s ease-in-out infinite;
	}
</style>
