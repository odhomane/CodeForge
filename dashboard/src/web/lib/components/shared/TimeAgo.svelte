<script lang="ts">
import { formatRelativeTime } from "$lib/utils/format.js";

let { date }: { date: string | Date } = $props();

let tick = $state(0);

let display = $derived.by(() => {
	// Reference tick to trigger re-computation on interval
	void tick;
	return formatRelativeTime(date);
});

let isoString = $derived(
	typeof date === "string" ? new Date(date).toISOString() : date.toISOString(),
);

$effect(() => {
	const interval = setInterval(() => {
		tick++;
	}, 60_000);
	return () => clearInterval(interval);
});
</script>

<time class="time-ago" datetime={isoString} title={isoString}>
  {display}
</time>

<style>
  .time-ago {
    font-size: 12px;
    color: var(--text-muted);
    cursor: default;
  }
</style>
