export interface ProjectSummary {
	id: string;
	name: string;
	path: string;
	sessionCount: number;
	totalTokens?: {
		input: number;
		output: number;
		cacheCreation: number;
		cacheRead: number;
	};
	lastActivity?: string;
	color?: string;
}

export interface ProjectDetail extends ProjectSummary {
	models: string[];
	totalMessages: number;
	sessions: {
		sessionId: string;
		messageCount: number;
		timeRange: { start: string; end: string } | null;
		models: string[];
	}[];
}

export const projectStore = $state({
	projects: [] as ProjectSummary[],
	selectedProject: null as ProjectDetail | null,
	loading: false,
	error: null as string | null,
});

export async function fetchProjects(): Promise<void> {
	projectStore.loading = true;
	projectStore.error = null;
	try {
		const res = await fetch("/api/projects");
		if (!res.ok) throw new Error(`Failed to fetch projects: ${res.status}`);
		const data = await res.json();
		projectStore.projects = (
			data as {
				id: string;
				path: string;
				name: string;
				sessionCount: number;
				totalTokens?: {
					input: number;
					output: number;
					cacheCreation: number;
					cacheRead: number;
				};
				lastActivity?: string;
			}[]
		).map((p) => ({
			id: p.id,
			name: p.name ?? p.path.split("/").pop() ?? p.id,
			path: p.path,
			sessionCount: p.sessionCount,
			totalTokens: p.totalTokens,
			lastActivity: p.lastActivity,
		}));
	} catch (e) {
		projectStore.error = e instanceof Error ? e.message : String(e);
	} finally {
		projectStore.loading = false;
	}
}

export async function fetchProjectDetail(id: string): Promise<void> {
	projectStore.loading = true;
	projectStore.error = null;
	try {
		const res = await fetch(`/api/projects/${encodeURIComponent(id)}`);
		if (!res.ok) throw new Error(`Failed to fetch project: ${res.status}`);
		const data = await res.json();
		projectStore.selectedProject = {
			id: data.id,
			name: data.path.split("/").pop() ?? data.id,
			path: data.path,
			sessionCount: data.sessionCount,
			totalTokens: data.totalTokens,
			models: data.models ?? [],
			totalMessages: data.totalMessages ?? 0,
			sessions: data.sessions ?? [],
		};
	} catch (e) {
		projectStore.error = e instanceof Error ? e.message : String(e);
	} finally {
		projectStore.loading = false;
	}
}

// Re-export getter references for backward compatibility
// Consumers in .svelte files should use projectStore.projects etc. for reactivity
export function getProjects() {
	return projectStore.projects;
}
export function getSelectedProject() {
	return projectStore.selectedProject;
}
