export interface ContextFileSummary {
	path: string;
	filename: string;
	scope: string;
	content: string;
	estimatedTokens: number;
	projects: { name: string; id: string; sessionCount: number }[];
	totalSessions: number;
}

export const contextStore = $state({
	files: [] as ContextFileSummary[],
	loading: false,
	error: null as string | null,
});

export async function fetchContextFiles(): Promise<void> {
	contextStore.loading = true;
	contextStore.error = null;
	try {
		const res = await fetch("/api/context");
		if (!res.ok)
			throw new Error(`Failed to fetch context files: ${res.status}`);
		const data = await res.json();
		contextStore.files = data.files;
	} catch (e) {
		contextStore.error = e instanceof Error ? e.message : String(e);
	} finally {
		contextStore.loading = false;
	}
}
