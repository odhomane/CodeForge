//#region src/web/lib/stores/sessions.svelte.ts
var sessionStore = {
	sessions: [],
	selectedSession: null,
	loading: false,
	error: null,
	filters: {
		project: "",
		model: "",
		since: ""
	},
	totalCount: 0
};
async function fetchSessions(params) {
	sessionStore.loading = true;
	sessionStore.error = null;
	try {
		const searchParams = new URLSearchParams();
		if (params?.project) searchParams.set("project", params.project);
		if (params?.model) searchParams.set("model", params.model);
		if (params?.since) searchParams.set("since", params.since);
		if (params?.limit) searchParams.set("limit", String(params.limit));
		if (params?.offset) searchParams.set("offset", String(params.offset));
		const qs = searchParams.toString();
		const res = await fetch(`/api/sessions${qs ? `?${qs}` : ""}`);
		if (!res.ok) throw new Error(`Failed to fetch sessions: ${res.status}`);
		const data = await res.json();
		sessionStore.sessions = (data.sessions ?? []).map((s) => ({
			...s,
			hasPlan: s.hasPlan ?? false,
			planSlug: s.planSlug ?? void 0,
			hasTeam: s.hasTeam ?? false,
			teamName: s.teamName ?? void 0
		}));
		sessionStore.totalCount = data.total ?? 0;
	} catch (e) {
		sessionStore.error = e instanceof Error ? e.message : String(e);
	} finally {
		sessionStore.loading = false;
	}
}
function setFilters(newFilters) {
	sessionStore.filters = {
		...sessionStore.filters,
		...newFilters
	};
}
//#endregion
export { sessionStore as n, setFilters as r, fetchSessions as t };
