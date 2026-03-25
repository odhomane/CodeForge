<script lang="ts">
import { page } from "$app/state";
import SessionList from "$lib/components/sessions/SessionList.svelte";
import { fetchSessions, setFilters } from "$lib/stores/sessions.svelte.js";

$effect(() => {
	const params = page.url.searchParams;
	const project = params.get("project") ?? "";
	const model = params.get("model") ?? "";
	const since = params.get("since") ?? "";

	if (project || model || since) {
		setFilters({ project, model, since });
	}

	fetchSessions({
		project: project || undefined,
		model: model || undefined,
		since: since || undefined,
		limit: 25,
		offset: 0,
	});
});
</script>

<SessionList />
