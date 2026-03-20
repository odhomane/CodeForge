<script lang="ts">
import MemoriesPage from "$lib/components/memory/MemoriesPage.svelte";
import {
	fetchMemories,
	fetchMemoryStats,
	fetchObservations,
	fetchRuns,
} from "$lib/stores/memory.svelte.js";

$effect(() => {
	fetchObservations();
	fetchMemories();
	fetchRuns();
	fetchMemoryStats();
});
</script>

<MemoriesPage />
