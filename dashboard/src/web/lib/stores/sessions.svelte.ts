import type {
	CostEstimate,
	SessionMessage,
	SessionMeta,
} from "../../../parser/types.js";
import type { SubagentSession, UnlinkedAgent } from "./agents.svelte.js";
import type { TaskItem } from "./tasks.svelte.js";

export interface PlanMeta {
	slug: string;
	title: string;
	content: string;
}

export interface ContextFile {
	scope: "user" | "project" | "auto-memory" | "user-rules" | "project-rules";
	path: string;
	filename: string;
	content: string;
}

export interface SessionContext {
	memories: ContextFile[];
	rules: ContextFile[];
}

export interface SessionSummary {
	sessionId: string;
	project?: string;
	lastPrompt?: string;
	isActive?: boolean;
	promptCount: number;
	timestamps: { first: string; last: string };
	meta?: SessionMeta;
	cost?: CostEstimate;
	hasPlan?: boolean;
	planSlug?: string;
	hasTeam?: boolean;
	teamName?: string;
	taskProgress?: { completed: number; total: number };
	isAnalyzed?: boolean;
}

export interface SessionDetail extends SessionSummary {
	messages: SessionMessage[];
	messageOffset?: number;
	plan?: PlanMeta | null;
	context?: SessionContext | null;
	tasks?: TaskItem[] | null;
	hasAgents?: boolean;
	agentCount?: number;
	_agentsData?: {
		sessions: SubagentSession[];
		unlinked: UnlinkedAgent[];
	} | null;
}

interface SessionFilters {
	project: string;
	model: string;
	since: string;
}

export const sessionStore = $state({
	sessions: [] as SessionSummary[],
	selectedSession: null as SessionDetail | null,
	loading: false,
	error: null as string | null,
	filters: { project: "", model: "", since: "" } as SessionFilters,
	totalCount: 0,
});

export async function fetchSessions(params?: {
	project?: string;
	model?: string;
	since?: string;
	limit?: number;
	offset?: number;
}): Promise<void> {
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
		sessionStore.sessions = (data.sessions ?? []).map(
			(s: Record<string, unknown>) => ({
				...s,
				hasPlan: s.hasPlan ?? false,
				planSlug: s.planSlug ?? undefined,
				hasTeam: s.hasTeam ?? false,
				teamName: s.teamName ?? undefined,
				taskProgress: s.taskProgress ?? undefined,
				isAnalyzed: !!s.isAnalyzed,
			}),
		) as SessionSummary[];
		sessionStore.totalCount = data.total ?? 0;
	} catch (e) {
		sessionStore.error = e instanceof Error ? e.message : String(e);
	} finally {
		sessionStore.loading = false;
	}
}

export async function fetchSessionDetail(id: string): Promise<void> {
	sessionStore.loading = true;
	sessionStore.error = null;
	try {
		const res = await fetch(`/api/sessions/${encodeURIComponent(id)}`);
		if (!res.ok) throw new Error(`Failed to fetch session: ${res.status}`);
		const data = await res.json();

		// Merge if same session (preserve messages + offset)
		const existing = sessionStore.selectedSession;
		const isSameSession =
			existing && existing.sessionId === data.meta.sessionId;

		sessionStore.selectedSession = {
			sessionId: data.meta.sessionId,
			meta: data.meta,
			cost: data.cost,
			project: data.projectPath,
			hasPlan: data.hasPlan ?? false,
			planSlug: data.planSlug ?? undefined,
			hasTeam: data.hasTeam ?? false,
			teamName: data.teamName ?? undefined,
			hasAgents: data.hasAgents ?? false,
			agentCount: data.agentCount ?? 0,
			promptCount: 0,
			timestamps: data.meta.timeRange
				? {
						first: data.meta.timeRange.start,
						last: data.meta.timeRange.end,
					}
				: { first: "", last: "" },
			messages: isSameSession ? existing.messages : [],
			messageOffset: isSameSession ? existing.messageOffset : undefined,
			plan: isSameSession ? existing.plan : undefined,
			context: isSameSession ? existing.context : undefined,
			tasks: isSameSession ? existing.tasks : undefined,
			_agentsData: isSameSession ? existing._agentsData : undefined,
		};
	} catch (e) {
		sessionStore.error = e instanceof Error ? e.message : String(e);
	} finally {
		sessionStore.loading = false;
	}
}

export async function fetchSessionMessages(id: string): Promise<void> {
	try {
		const res = await fetch(`/api/sessions/${encodeURIComponent(id)}/messages`);
		if (!res.ok) throw new Error(`Failed to fetch messages: ${res.status}`);
		const data = await res.json();
		if (
			sessionStore.selectedSession &&
			sessionStore.selectedSession.sessionId === id
		) {
			sessionStore.selectedSession = {
				...sessionStore.selectedSession,
				messages: data.messages ?? [],
				messageOffset: data.fileSize,
			};
		}
	} catch (e) {
		sessionStore.error = e instanceof Error ? e.message : String(e);
	}
}

export async function fetchNewMessages(id: string): Promise<void> {
	const offset = sessionStore.selectedSession?.messageOffset;
	if (offset === undefined) return;

	try {
		const res = await fetch(
			`/api/sessions/${encodeURIComponent(id)}/messages?offset=${offset}`,
		);
		if (!res.ok) throw new Error(`Failed to fetch new messages: ${res.status}`);
		const data = await res.json();
		if (
			sessionStore.selectedSession &&
			sessionStore.selectedSession.sessionId === id
		) {
			const newMessages = data.messages ?? [];
			if (newMessages.length > 0) {
				sessionStore.selectedSession = {
					...sessionStore.selectedSession,
					messages: [...sessionStore.selectedSession.messages, ...newMessages],
					messageOffset: data.fileSize,
				};
			} else {
				sessionStore.selectedSession = {
					...sessionStore.selectedSession,
					messageOffset: data.fileSize,
				};
			}
		}
	} catch {
		// Silent fail for incremental updates
	}
}

export async function fetchSessionPlan(id: string): Promise<void> {
	try {
		const res = await fetch(`/api/sessions/${encodeURIComponent(id)}/plan`);
		if (!res.ok) throw new Error(`Failed to fetch plan: ${res.status}`);
		const data = await res.json();
		if (
			sessionStore.selectedSession &&
			sessionStore.selectedSession.sessionId === id
		) {
			sessionStore.selectedSession = {
				...sessionStore.selectedSession,
				plan: data.plan ?? null,
				hasPlan: !!data.plan,
				planSlug: data.plan?.slug,
			};
		}
	} catch (e) {
		sessionStore.error = e instanceof Error ? e.message : String(e);
	}
}

export async function fetchSessionContext(id: string): Promise<void> {
	try {
		const res = await fetch(`/api/sessions/${encodeURIComponent(id)}/context`);
		if (!res.ok) throw new Error(`Failed to fetch context: ${res.status}`);
		const data = await res.json();
		if (
			sessionStore.selectedSession &&
			sessionStore.selectedSession.sessionId === id
		) {
			sessionStore.selectedSession = {
				...sessionStore.selectedSession,
				context: {
					memories: data.memories ?? [],
					rules: data.rules ?? [],
				},
			};
		}
	} catch (e) {
		sessionStore.error = e instanceof Error ? e.message : String(e);
	}
}

export async function fetchSessionTasks(id: string): Promise<void> {
	try {
		const res = await fetch(`/api/sessions/${encodeURIComponent(id)}/tasks`);
		if (!res.ok) throw new Error(`Failed to fetch tasks: ${res.status}`);
		const data = await res.json();
		if (
			sessionStore.selectedSession &&
			sessionStore.selectedSession.sessionId === id
		) {
			sessionStore.selectedSession = {
				...sessionStore.selectedSession,
				tasks: data.tasks ?? null,
				hasTeam: !!data.teamName,
				teamName: data.teamName ?? undefined,
			};
		}
	} catch (e) {
		sessionStore.error = e instanceof Error ? e.message : String(e);
	}
}

export function updateSession(
	sessionId: string,
	data: Partial<SessionSummary>,
): void {
	sessionStore.sessions = sessionStore.sessions.map((s) =>
		s.sessionId === sessionId ? { ...s, ...data } : s,
	);
	if (sessionStore.selectedSession?.sessionId === sessionId) {
		sessionStore.selectedSession = { ...sessionStore.selectedSession, ...data };
	}
}

export function addSession(session: SessionSummary): void {
	sessionStore.sessions = [session, ...sessionStore.sessions];
}

export async function fetchSessionAgents(
	id: string,
): Promise<{ sessions: SubagentSession[]; unlinked: any[] } | null> {
	try {
		const res = await fetch(`/api/sessions/${encodeURIComponent(id)}/agents`);
		if (!res.ok) return null;
		const data = await res.json();
		return { sessions: data.sessions ?? [], unlinked: data.unlinked ?? [] };
	} catch {
		return null;
	}
}

export async function refreshSessionAgents(id: string): Promise<void> {
	try {
		const res = await fetch(`/api/sessions/${encodeURIComponent(id)}/agents`);
		if (!res.ok) return;
		const data = await res.json();
		if (sessionStore.selectedSession?.sessionId === id) {
			sessionStore.selectedSession = {
				...sessionStore.selectedSession,
				_agentsData: {
					sessions: data.sessions ?? [],
					unlinked: data.unlinked ?? [],
				},
			};
		}
	} catch {
		/* ignore */
	}
}

export function setFilters(newFilters: Partial<SessionFilters>): void {
	sessionStore.filters = { ...sessionStore.filters, ...newFilters };
}
