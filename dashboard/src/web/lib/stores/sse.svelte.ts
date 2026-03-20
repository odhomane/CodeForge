import { fetchGlobalAnalytics } from "./analytics.svelte.js";
import { fetchContextFiles } from "./context.svelte.js";
import {
	fetchMemoryStats,
	fetchObservations,
	fetchRuns,
	memoryStore,
} from "./memory.svelte.js";
import { fetchPlans } from "./plans.svelte.js";
import { fetchProjects } from "./projects.svelte.js";
import {
	fetchNewMessages,
	fetchSessionContext,
	fetchSessionDetail,
	fetchSessionPlan,
	fetchSessions,
	fetchSessionTasks,
	refreshSessionAgents,
	sessionStore,
} from "./sessions.svelte.js";
import { fetchTasks } from "./tasks.svelte.js";

export const sseStore = $state({ connected: false });
let eventSource: EventSource | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let listRefreshTimer: ReturnType<typeof setTimeout> | null = null;

const LIST_REFRESH_DEBOUNCE_MS = 2000;

function debouncedListRefresh() {
	if (listRefreshTimer) return;
	listRefreshTimer = setTimeout(() => {
		listRefreshTimer = null;
		fetchSessions({
			project: sessionStore.filters.project || undefined,
			model: sessionStore.filters.model || undefined,
			since: sessionStore.filters.since || undefined,
		});
	}, LIST_REFRESH_DEBOUNCE_MS);
}

function handleSessionUpdated(event: MessageEvent) {
	try {
		const data = JSON.parse(event.data);
		if (
			data.sessionId &&
			sessionStore.selectedSession?.sessionId === data.sessionId
		) {
			// User is viewing this session — do targeted updates
			fetchSessionDetail(data.sessionId);
			fetchNewMessages(data.sessionId);
			// Re-check plan if not yet loaded
			if (
				sessionStore.selectedSession.hasPlan &&
				!sessionStore.selectedSession.plan
			) {
				fetchSessionPlan(data.sessionId);
			}
		}
		// If this is a subagent update and we're viewing the parent session, refresh
		if (
			data.parentSessionId &&
			sessionStore.selectedSession?.sessionId === data.parentSessionId
		) {
			debouncedListRefresh();
			refreshSessionAgents(data.parentSessionId);
		}
		// Always debounce-refresh the session list for updated stats
		debouncedListRefresh();
	} catch {
		// Ignore malformed events
	}
}

function handleSessionCreated(event: MessageEvent) {
	try {
		const data = JSON.parse(event.data);
		// Immediately refresh session list to show new session
		fetchSessions({
			project: sessionStore.filters.project || undefined,
			model: sessionStore.filters.model || undefined,
			since: sessionStore.filters.since || undefined,
		});
		// If this is a new subagent and we're viewing the parent session
		if (
			data.parentSessionId &&
			sessionStore.selectedSession?.sessionId === data.parentSessionId
		) {
			refreshSessionAgents(data.parentSessionId);
		}
	} catch {
		// Ignore malformed events
	}
}

function handleProjectUpdated(_event: MessageEvent) {
	fetchProjects();
}

function handleFileChanged(event: MessageEvent) {
	try {
		const data = JSON.parse(event.data);
		switch (data.fileType) {
			case "plan":
				fetchPlans();
				if (sessionStore.selectedSession?.hasPlan) {
					fetchSessionPlan(sessionStore.selectedSession.sessionId);
				}
				break;
			case "task":
				fetchTasks();
				if (sessionStore.selectedSession?.hasTeam) {
					fetchSessionTasks(sessionStore.selectedSession.sessionId);
				}
				break;
			case "rule":
			case "context":
				fetchContextFiles();
				if (sessionStore.selectedSession) {
					fetchSessionContext(sessionStore.selectedSession.sessionId);
				}
				break;
			case "subagent-meta":
				debouncedListRefresh();
				break;
		}
	} catch {
		/* ignore malformed */
	}
}

function handleMemoryRunEvent(_event: MessageEvent) {
	// Partial update during run — could trigger UI refresh
}

function handleMemoryRunComplete(event: MessageEvent) {
	try {
		JSON.parse(event.data);
		memoryStore.analysisInProgress = null;
		fetchObservations(memoryStore.projectFilter ?? undefined);
		fetchRuns(memoryStore.projectFilter ?? undefined);
		fetchMemoryStats(memoryStore.projectFilter ?? undefined);
	} catch {
		/* ignore */
	}
}

export function createSSEConnection(): () => void {
	if (eventSource) {
		eventSource.close();
	}

	function connect() {
		eventSource = new EventSource("/api/events");

		eventSource.onopen = () => {
			sseStore.connected = true;
			if (reconnectTimer) {
				clearTimeout(reconnectTimer);
				reconnectTimer = null;
			}
		};

		eventSource.onerror = () => {
			sseStore.connected = false;
			eventSource?.close();
			eventSource = null;
			if (!reconnectTimer) {
				reconnectTimer = setTimeout(() => {
					reconnectTimer = null;
					connect();
				}, 3000);
			}
		};

		eventSource.addEventListener("session:updated", handleSessionUpdated);
		eventSource.addEventListener("session:created", handleSessionCreated);
		eventSource.addEventListener("project:updated", handleProjectUpdated);
		eventSource.addEventListener("ingestion:progress", () => {
			// Progress events available for future UI indicators
		});
		eventSource.addEventListener("ingestion:complete", () => {
			fetchGlobalAnalytics();
		});
		eventSource.addEventListener("file:changed", handleFileChanged);
		eventSource.addEventListener("memory:run_event", handleMemoryRunEvent);
		eventSource.addEventListener(
			"memory:run_complete",
			handleMemoryRunComplete,
		);
	}

	connect();

	return () => {
		if (reconnectTimer) {
			clearTimeout(reconnectTimer);
			reconnectTimer = null;
		}
		if (listRefreshTimer) {
			clearTimeout(listRefreshTimer);
			listRefreshTimer = null;
		}
		if (eventSource) {
			eventSource.close();
			eventSource = null;
		}
		sseStore.connected = false;
	};
}
