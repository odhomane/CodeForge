export interface MemoryRun {
	id: number;
	runId: string;
	sessionId: string | null;
	projectId: string;
	runType: "analysis" | "maintenance";
	status: "running" | "completed" | "failed";
	model: string | null;
	budgetUsd: number;
	costUsd: number;
	inputTokens: number;
	outputTokens: number;
	numTurns: number;
	durationMs: number;
	resultJson: unknown | null;
	error: string | null;
	startedAt: string;
	completedAt: string | null;
}

export interface Observation {
	id: number;
	projectId: string;
	category: string;
	content: string;
	key: string;
	evidence: string | null;
	suggestedMemory: string | null;
	count: number;
	firstSeenRunId: string;
	lastSeenRunId: string;
	firstSeenSessionId: string | null;
	lastSeenSessionId: string | null;
	sessionsSinceLastSeen: number;
	status: "active" | "stale" | "promoted" | "consolidated";
	promotedToMemoryId: number | null;
	createdAt: string;
	updatedAt: string;
}

export interface Memory {
	id: number;
	projectId: string;
	category: string;
	content: string;
	sourceObservationIds: number[];
	confidence: number;
	status: "approved" | "revoked";
	approvedAt: string;
	createdAt: string;
}

export type MemoryTab = "observations" | "memories" | "runs";

export const memoryStore = $state({
	observations: [] as Observation[],
	memories: [] as Memory[],
	runs: [] as MemoryRun[],
	selectedRun: null as
		| (MemoryRun & { events?: unknown[]; result?: unknown })
		| null,
	activeTab: "observations" as MemoryTab,
	projectFilter: null as string | null,
	loading: false,
	error: null as string | null,
	stats: {
		totalObservations: 0,
		activeObservations: 0,
		totalMemories: 0,
		totalRuns: 0,
	},
	activeAnalyses: {} as Record<string, true>,
	activeMaintenance: {} as Record<string, true>,
	activeProjectAnalysis: {} as Record<
		string,
		{ queued: number; completed: number }
	>,
});

export async function fetchObservations(projectId?: string): Promise<void> {
	memoryStore.loading = true;
	memoryStore.error = null;
	try {
		const params = new URLSearchParams();
		if (projectId) params.set("project", projectId);
		const qs = params.toString();
		const res = await fetch(`/api/memory/observations${qs ? `?${qs}` : ""}`);
		if (!res.ok) throw new Error(`Failed to fetch observations: ${res.status}`);
		const data = await res.json();
		memoryStore.observations = data.data ?? [];
	} catch (e) {
		memoryStore.error = e instanceof Error ? e.message : String(e);
	} finally {
		memoryStore.loading = false;
	}
}

export async function fetchMemories(projectId?: string): Promise<void> {
	memoryStore.loading = true;
	memoryStore.error = null;
	try {
		const params = new URLSearchParams();
		if (projectId) params.set("project", projectId);
		const qs = params.toString();
		const res = await fetch(`/api/memory/memories${qs ? `?${qs}` : ""}`);
		if (!res.ok) throw new Error(`Failed to fetch memories: ${res.status}`);
		const data = await res.json();
		memoryStore.memories = data.data ?? [];
	} catch (e) {
		memoryStore.error = e instanceof Error ? e.message : String(e);
	} finally {
		memoryStore.loading = false;
	}
}

export async function fetchRuns(projectId?: string): Promise<void> {
	memoryStore.loading = true;
	memoryStore.error = null;
	try {
		const params = new URLSearchParams();
		if (projectId) params.set("project", projectId);
		const qs = params.toString();
		const res = await fetch(`/api/memory/runs${qs ? `?${qs}` : ""}`);
		if (!res.ok) throw new Error(`Failed to fetch runs: ${res.status}`);
		const data = await res.json();
		memoryStore.runs = data.data ?? [];
	} catch (e) {
		memoryStore.error = e instanceof Error ? e.message : String(e);
	} finally {
		memoryStore.loading = false;
	}
}

export async function fetchRunDetail(runId: string): Promise<void> {
	memoryStore.error = null;
	try {
		const res = await fetch(`/api/memory/runs/${encodeURIComponent(runId)}`);
		if (!res.ok) throw new Error(`Failed to fetch run detail: ${res.status}`);
		const data = await res.json();
		memoryStore.selectedRun = data ?? null;
	} catch (e) {
		memoryStore.error = e instanceof Error ? e.message : String(e);
	}
}

export async function fetchMemoryStats(projectId?: string): Promise<void> {
	try {
		const params = new URLSearchParams();
		if (projectId) params.set("project", projectId);
		const qs = params.toString();
		const res = await fetch(`/api/memory/stats${qs ? `?${qs}` : ""}`);
		if (!res.ok) throw new Error(`Failed to fetch stats: ${res.status}`);
		const data = await res.json();
		memoryStore.stats = {
			totalObservations: data.totalObservations ?? 0,
			activeObservations: data.activeObservations ?? 0,
			totalMemories: data.totalMemories ?? 0,
			totalRuns: data.totalRuns ?? 0,
		};
	} catch {
		// Silent fail for stats
	}
}

export async function startAnalysis(
	sessionId: string,
	budgetUsd?: number,
): Promise<void> {
	memoryStore.activeAnalyses[sessionId] = true;
	memoryStore.error = null;
	try {
		const res = await fetch("/api/memory/analyze", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ sessionId, budgetUsd }),
		});
		if (!res.ok) {
			delete memoryStore.activeAnalyses[sessionId];
			throw new Error(`Failed to start analysis: ${res.status}`);
		}
	} catch (e) {
		delete memoryStore.activeAnalyses[sessionId];
		memoryStore.error = e instanceof Error ? e.message : String(e);
	}
}

export async function startMaintenance(
	projectId: string,
	budgetUsd?: number,
): Promise<void> {
	memoryStore.activeMaintenance[projectId] = true;
	memoryStore.error = null;
	try {
		const res = await fetch("/api/memory/maintain", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ projectId, budgetUsd }),
		});
		if (!res.ok) {
			delete memoryStore.activeMaintenance[projectId];
			throw new Error(`Failed to start maintenance: ${res.status}`);
		}
	} catch (e) {
		delete memoryStore.activeMaintenance[projectId];
		memoryStore.error = e instanceof Error ? e.message : String(e);
	}
}

export async function startProjectAnalysis(
	projectId: string,
	budgetUsd?: number,
): Promise<void> {
	memoryStore.error = null;
	try {
		const res = await fetch("/api/memory/analyze-project", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ projectId, budgetUsd }),
		});
		if (!res.ok)
			throw new Error(`Failed to start project analysis: ${res.status}`);
		const data = await res.json();
		if (data.queued > 0) {
			memoryStore.activeProjectAnalysis[projectId] = {
				queued: data.queued,
				completed: 0,
			};
		}
	} catch (e) {
		memoryStore.error = e instanceof Error ? e.message : String(e);
	}
}

export async function approveObservation(
	id: number,
	content: string,
	tags?: string,
): Promise<void> {
	memoryStore.error = null;
	try {
		const body: { content: string; tags?: string } = { content };
		if (tags) body.tags = tags;
		const res = await fetch(`/api/memory/observations/${id}/approve`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		});
		if (!res.ok) {
			const data = await res.json().catch(() => ({}));
			throw new Error(
				(data as { error?: string }).error ||
					`Failed to approve observation: ${res.status}`,
			);
		}
		await Promise.all([
			fetchObservations(memoryStore.projectFilter ?? undefined),
			fetchMemories(memoryStore.projectFilter ?? undefined),
			fetchMemoryStats(memoryStore.projectFilter ?? undefined),
		]);
	} catch (e) {
		memoryStore.error = e instanceof Error ? e.message : String(e);
	}
}

export async function dismissObservation(id: number): Promise<void> {
	memoryStore.error = null;
	try {
		const res = await fetch(`/api/memory/observations/${id}/dismiss`, {
			method: "POST",
		});
		if (!res.ok)
			throw new Error(`Failed to dismiss observation: ${res.status}`);
		// Refresh observations after dismissal
		await Promise.all([
			fetchObservations(memoryStore.projectFilter ?? undefined),
			fetchMemoryStats(memoryStore.projectFilter ?? undefined),
		]);
	} catch (e) {
		memoryStore.error = e instanceof Error ? e.message : String(e);
	}
}

export interface ObservationHistoryEvent {
	id: number;
	observationId: number;
	runId: string | null;
	sessionId: string | null;
	action: string;
	oldContent: string | null;
	newContent: string | null;
	oldEvidence: string | null;
	newEvidence: string | null;
	oldStatus: string | null;
	newStatus: string | null;
	metadata: string | null;
	changedAt: string;
}

export async function fetchObservationHistory(
	id: number,
): Promise<ObservationHistoryEvent[]> {
	const res = await fetch(`/api/memory/observations/${id}/history`);
	if (!res.ok)
		throw new Error(`Failed to fetch observation history: ${res.status}`);
	const data = await res.json();
	return data.events ?? [];
}

export async function revokeMemory(id: number): Promise<void> {
	memoryStore.error = null;
	try {
		const res = await fetch(`/api/memory/memories/${id}/revoke`, {
			method: "POST",
		});
		if (!res.ok) throw new Error(`Failed to revoke memory: ${res.status}`);
		// Refresh memories after revocation
		await Promise.all([
			fetchMemories(memoryStore.projectFilter ?? undefined),
			fetchMemoryStats(memoryStore.projectFilter ?? undefined),
		]);
	} catch (e) {
		memoryStore.error = e instanceof Error ? e.message : String(e);
	}
}
