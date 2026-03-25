export interface TaskItem {
	id: string;
	subject: string;
	description: string;
	activeForm?: string;
	owner?: string;
	status: string;
	blocks: string[];
	blockedBy: string[];
}

export interface TaskTeamSummary {
	teamName: string;
	tasks: TaskItem[];
	sessions: { sessionId: string; project: string; lastActivity: string }[];
	taskCount: number;
	completedCount: number;
	lastUsed: string | null;
}

export const taskStore = $state({
	teams: [] as TaskTeamSummary[],
	loading: false,
	error: null as string | null,
});

export async function fetchTasks(): Promise<void> {
	taskStore.loading = true;
	taskStore.error = null;
	try {
		const res = await fetch("/api/tasks");
		if (!res.ok) throw new Error(`Failed to fetch tasks: ${res.status}`);
		const data = await res.json();
		taskStore.teams = data.teams;
	} catch (e) {
		taskStore.error = e instanceof Error ? e.message : String(e);
	} finally {
		taskStore.loading = false;
	}
}
