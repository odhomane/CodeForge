//#region src/web/lib/stores/memory.svelte.ts
var memoryStore = {
	observations: [],
	memories: [],
	runs: [],
	selectedRun: null,
	activeTab: "observations",
	projectFilter: null,
	loading: false,
	error: null,
	stats: {
		totalObservations: 0,
		activeObservations: 0,
		totalMemories: 0,
		totalRuns: 0
	},
	analysisInProgress: null
};
async function fetchObservations(projectId) {
	memoryStore.loading = true;
	memoryStore.error = null;
	try {
		const params = new URLSearchParams();
		if (projectId) params.set("projectId", projectId);
		const qs = params.toString();
		const res = await fetch(`/api/memory/observations${qs ? `?${qs}` : ""}`);
		if (!res.ok) throw new Error(`Failed to fetch observations: ${res.status}`);
		memoryStore.observations = (await res.json()).observations ?? [];
	} catch (e) {
		memoryStore.error = e instanceof Error ? e.message : String(e);
	} finally {
		memoryStore.loading = false;
	}
}
async function fetchMemories(projectId) {
	memoryStore.loading = true;
	memoryStore.error = null;
	try {
		const params = new URLSearchParams();
		if (projectId) params.set("projectId", projectId);
		const qs = params.toString();
		const res = await fetch(`/api/memory/memories${qs ? `?${qs}` : ""}`);
		if (!res.ok) throw new Error(`Failed to fetch memories: ${res.status}`);
		memoryStore.memories = (await res.json()).memories ?? [];
	} catch (e) {
		memoryStore.error = e instanceof Error ? e.message : String(e);
	} finally {
		memoryStore.loading = false;
	}
}
async function fetchRuns(projectId) {
	memoryStore.loading = true;
	memoryStore.error = null;
	try {
		const params = new URLSearchParams();
		if (projectId) params.set("projectId", projectId);
		const qs = params.toString();
		const res = await fetch(`/api/memory/runs${qs ? `?${qs}` : ""}`);
		if (!res.ok) throw new Error(`Failed to fetch runs: ${res.status}`);
		memoryStore.runs = (await res.json()).runs ?? [];
	} catch (e) {
		memoryStore.error = e instanceof Error ? e.message : String(e);
	} finally {
		memoryStore.loading = false;
	}
}
async function fetchMemoryStats(projectId) {
	try {
		const params = new URLSearchParams();
		if (projectId) params.set("projectId", projectId);
		const qs = params.toString();
		const res = await fetch(`/api/memory/stats${qs ? `?${qs}` : ""}`);
		if (!res.ok) throw new Error(`Failed to fetch stats: ${res.status}`);
		const data = await res.json();
		memoryStore.stats = {
			totalObservations: data.totalObservations ?? 0,
			activeObservations: data.activeObservations ?? 0,
			totalMemories: data.totalMemories ?? 0,
			totalRuns: data.totalRuns ?? 0
		};
	} catch {}
}
//#endregion
export { memoryStore as a, fetchRuns as i, fetchMemoryStats as n, fetchObservations as r, fetchMemories as t };
