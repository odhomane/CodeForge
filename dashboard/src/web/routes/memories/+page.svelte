<script lang="ts">
import MemoriesPage from "$lib/components/memory/MemoriesPage.svelte";
import {
	fetchMemories,
	fetchMemoryStats,
	fetchObservations,
	fetchRuns,
	memoryStore,
} from "$lib/stores/memory.svelte.js";

$effect(() => {
	const url = new URL(window.location.href);
	const projectParam = url.searchParams.get("project");

	if (projectParam) {
		memoryStore.projectFilter = projectParam;
		fetchObservations(projectParam);
		fetchMemories(projectParam);
		fetchRuns(projectParam);
		fetchMemoryStats(projectParam);
	} else {
		fetch("/api/sessions?limit=1")
			.then((r) => r.json())
			.then((data) => {
				const sessions = data.sessions ?? [];
				if (sessions.length > 0 && sessions[0].projectId) {
					const projectId = sessions[0].projectId;
					memoryStore.projectFilter = projectId;
					const newUrl = new URL(window.location.href);
					newUrl.searchParams.set("project", projectId);
					window.history.replaceState({}, "", newUrl.toString());
					fetchObservations(projectId);
					fetchMemories(projectId);
					fetchRuns(projectId);
					fetchMemoryStats(projectId);
				} else {
					fetchObservations();
					fetchMemories();
					fetchRuns();
					fetchMemoryStats();
				}
			})
			.catch(() => {
				fetchObservations();
				fetchMemories();
				fetchRuns();
				fetchMemoryStats();
			});
	}
});
</script>

<MemoriesPage />
