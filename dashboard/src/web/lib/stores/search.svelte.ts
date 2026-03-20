interface SearchResult {
	uuid: string;
	sessionId: string;
	type: string;
	timestamp: string;
	excerpt: string;
	rank: number;
}

export const searchStore = $state({
	query: "",
	results: [] as SearchResult[],
	loading: false,
	error: null as string | null,
	filters: {
		project: "",
		role: "" as "" | "user" | "assistant",
		since: "",
	},
	meta: { total: 0, limit: 20, offset: 0, hasMore: false },
	isOpen: false,
});

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function openSearch(): void {
	searchStore.isOpen = true;
}

export function closeSearch(): void {
	searchStore.isOpen = false;
	searchStore.query = "";
	searchStore.results = [];
	searchStore.error = null;
	searchStore.meta = { total: 0, limit: 20, offset: 0, hasMore: false };
}

export function searchMessages(query: string): void {
	searchStore.query = query;
	if (debounceTimer) clearTimeout(debounceTimer);

	if (!query.trim()) {
		searchStore.results = [];
		searchStore.meta = { total: 0, limit: 20, offset: 0, hasMore: false };
		return;
	}

	debounceTimer = setTimeout(() => {
		doSearch(query, 0);
	}, 300);
}

export async function loadMore(): Promise<void> {
	if (!searchStore.meta.hasMore || searchStore.loading) return;
	const nextOffset = searchStore.meta.offset + searchStore.meta.limit;
	await doSearch(searchStore.query, nextOffset, true);
}

async function doSearch(
	query: string,
	offset: number,
	append = false,
): Promise<void> {
	searchStore.loading = true;
	searchStore.error = null;
	try {
		const params = new URLSearchParams({
			q: query,
			limit: "20",
			offset: String(offset),
		});
		if (searchStore.filters.project)
			params.set("project", searchStore.filters.project);
		if (searchStore.filters.role) params.set("role", searchStore.filters.role);
		if (searchStore.filters.since)
			params.set("since", searchStore.filters.since);

		const res = await fetch(`/api/search?${params}`);
		if (!res.ok) throw new Error(`Search failed: ${res.status}`);
		const data = await res.json();

		searchStore.results = append
			? [...searchStore.results, ...data.data]
			: data.data;
		searchStore.meta = data.meta;
	} catch (e) {
		searchStore.error = e instanceof Error ? e.message : String(e);
	} finally {
		searchStore.loading = false;
	}
}

export function clearSearch(): void {
	searchStore.query = "";
	searchStore.results = [];
	searchStore.error = null;
	searchStore.filters = { project: "", role: "", since: "" };
	searchStore.meta = { total: 0, limit: 20, offset: 0, hasMore: false };
}
