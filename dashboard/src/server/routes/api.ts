import { getDb } from "../../parser/db.js";
import {
	insertMemory,
	queryAllAgents,
	queryAllContext,
	queryContextForSession,
	queryGlobalAnalytics,
	queryIngestionStatus,
	queryMemories,
	queryMemoryRunDetail,
	queryMemoryRuns,
	queryMemoryStats,
	queryObservationHistory,
	queryObservations,
	queryPlanBySlug,
	queryPlanHistory,
	queryPlans,
	queryProjectAnalytics,
	queryProjectDetail,
	queryProjects,
	querySearch,
	querySessionDetail,
	querySessionHasAgents,
	querySessionMessages,
	querySessions,
	querySubagentsForSession,
	queryTasks,
	queryTasksForTeam,
	updateMemoryStatus,
	updateObservationStatus,
} from "../../parser/queries.js";
import { startAnalysis, startMaintenance } from "../memory-analyzer.js";

function json(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

function errorResponse(
	error: string,
	status = 400,
	details?: unknown,
): Response {
	return json({ error, details }, status);
}

function parseUrl(req: Request): URL {
	return new URL(req.url);
}

function handleGetProjects(): Response {
	const db = getDb();
	const projects = queryProjects(db);
	return json(projects);
}

function handleGetProjectDetail(projectId: string): Response {
	const db = getDb();
	const detail = queryProjectDetail(db, projectId);
	if (!detail) return errorResponse("Project not found", 404);
	return json(detail);
}

function handleGetSessions(url: URL): Response {
	const db = getDb();
	const result = querySessions(db, {
		project: url.searchParams.get("project") || undefined,
		model: url.searchParams.get("model") || undefined,
		since: url.searchParams.get("since") || undefined,
		limit: parseInt(url.searchParams.get("limit") || "50", 10) || 50,
		offset: parseInt(url.searchParams.get("offset") || "0", 10) || 0,
	});

	// Batch task progress for all teams
	const teamNames = new Set(result.data.map((s) => s.teamName).filter(Boolean));
	const taskProgressMap = new Map<
		string,
		{ completed: number; total: number }
	>();
	if (teamNames.size > 0) {
		const allTeams = queryTasks(db);
		for (const team of allTeams) {
			if (teamNames.has(team.teamName)) {
				taskProgressMap.set(team.teamName, {
					completed: team.completedCount,
					total: team.taskCount,
				});
			}
		}
	}

	// Transform into the shape the frontend expects
	const sessions = result.data.map((s) => ({
		sessionId: s.sessionId,
		project: s.projectName,
		lastPrompt: undefined,
		isActive: false,
		promptCount: 0,
		timestamps: {
			first: s.timeStart ?? "",
			last: s.timeEnd ?? "",
		},
		meta: {
			sessionId: s.sessionId,
			slug: s.slug,
			teamName: s.teamName,
			cwd: s.cwd,
			gitBranch: s.gitBranch,
			models: s.models,
			totalTokens: {
				input: s.inputTokens,
				output: s.outputTokens,
				cacheCreation: s.cacheCreationTokens,
				cacheRead: s.cacheReadTokens,
			},
			messageCount: s.messageCount,
			timeRange:
				s.timeStart && s.timeEnd
					? { start: s.timeStart, end: s.timeEnd }
					: null,
		},
		cost: { totalCost: 0, breakdown: [], warnings: [] },
		hasPlan: !!s.slug,
		planSlug: s.slug,
		hasTeam: !!s.teamName,
		teamName: s.teamName ?? null,
		taskProgress: s.teamName ? (taskProgressMap.get(s.teamName) ?? null) : null,
	}));

	return json({
		sessions,
		total: result.meta.total,
		limit: result.meta.limit,
		offset: result.meta.offset,
	});
}

async function handleGetSessionDetail(sessionId: string): Promise<Response> {
	const db = getDb();
	const detail = querySessionDetail(db, sessionId);
	if (!detail) return errorResponse("Session not found", 404);

	// Check if session is active (file modified in last 2 minutes)
	let isActive = false;
	const sessionRow = db
		.prepare("SELECT file_path FROM sessions WHERE session_id = ?")
		.get(sessionId) as { file_path: string } | null;
	if (sessionRow) {
		try {
			const fileStat = await Bun.file(sessionRow.file_path).stat();
			isActive = Date.now() - fileStat.mtime.getTime() < 120_000;
		} catch {
			// Ignore stat errors
		}
	}

	// Check for plan
	const hasPlan = detail.slug ? !!queryPlanBySlug(db, detail.slug) : false;

	// Query files touched for this session
	const filesRead = (
		db
			.prepare(
				"SELECT file_path FROM files_touched WHERE session_id = ? AND action = 'read'",
			)
			.all(sessionId) as Array<{ file_path: string }>
	).map((r) => r.file_path);

	const filesWritten = (
		db
			.prepare(
				"SELECT file_path FROM files_touched WHERE session_id = ? AND action = 'write'",
			)
			.all(sessionId) as Array<{ file_path: string }>
	).map((r) => r.file_path);

	const filesEdited = (
		db
			.prepare(
				"SELECT file_path FROM files_touched WHERE session_id = ? AND action = 'edit'",
			)
			.all(sessionId) as Array<{ file_path: string }>
	).map((r) => r.file_path);

	// Check for subagents
	const hasAgents = querySessionHasAgents(db, sessionId);
	const agentCount = hasAgents
		? ((
				db
					.prepare(
						"SELECT COUNT(*) as cnt FROM sessions WHERE parent_session_id = ?",
					)
					.get(sessionId) as { cnt: number } | null
			)?.cnt ?? 0)
		: 0;

	// Build response matching what the frontend expects
	return json({
		meta: {
			sessionId: detail.sessionId,
			slug: detail.slug,
			teamName: detail.teamName,
			cwd: detail.cwd,
			gitBranch: detail.gitBranch,
			models: detail.models,
			totalTokens: detail.totalTokens,
			filesRead,
			filesWritten,
			filesEdited,
			messageCount: detail.messageCount,
			timeRange:
				detail.timeStart && detail.timeEnd
					? { start: detail.timeStart, end: detail.timeEnd }
					: null,
		},
		cost: { totalCost: detail.cost, breakdown: [], warnings: [] },
		isActive,
		hasPlan,
		planSlug: detail.slug ?? null,
		hasTeam: !!detail.teamName,
		teamName: detail.teamName ?? null,
		hasAgents,
		agentCount,
		projectId: detail.projectId,
		projectPath: detail.projectPath,
	});
}

function handleGetSessionMessages(sessionId: string, url: URL): Response {
	const db = getDb();

	// Verify session exists
	const exists = db
		.prepare("SELECT 1 FROM sessions WHERE session_id = ?")
		.get(sessionId);
	if (!exists) return errorResponse("Session not found", 404);

	// Support both afterId (new DB approach) and offset (legacy byte-offset approach)
	const afterIdParam = url.searchParams.get("afterId");
	const offsetParam = url.searchParams.get("offset");
	let afterId = 0;

	if (afterIdParam) {
		afterId = parseInt(afterIdParam, 10) || 0;
	} else if (offsetParam) {
		// Legacy: treat offset as afterId for backward compat
		afterId = parseInt(offsetParam, 10) || 0;
	}

	const result = querySessionMessages(db, sessionId, { afterId });

	// Get max message ID for incremental fetch
	const maxIdRow = db
		.prepare("SELECT MAX(id) as max_id FROM messages WHERE session_id = ?")
		.get(sessionId) as { max_id: number | null };

	// For full fetches (no offset), reverse to match existing behavior
	if (!afterId || afterId <= 0) {
		result.messages.reverse();
	}

	return json({
		messages: result.messages,
		count: result.count,
		fileSize: maxIdRow?.max_id ?? 0,
	});
}

function handleGetGlobalAnalytics(url: URL): Response {
	const db = getDb();
	const result = queryGlobalAnalytics(db, {
		since: url.searchParams.get("since") || undefined,
		until: url.searchParams.get("until") || undefined,
	});
	return json(result);
}

function handleGetProjectAnalytics(projectId: string): Response {
	const db = getDb();
	const result = queryProjectAnalytics(db, projectId);
	if (!result) return errorResponse("Project not found", 404);
	return json(result);
}

function handleGetPlans(): Response {
	const db = getDb();
	const dbPlans = queryPlans(db);
	return json({ plans: dbPlans });
}

function handleGetSessionPlan(sessionId: string): Response {
	const db = getDb();
	const detail = querySessionDetail(db, sessionId);
	if (!detail) return errorResponse("Session not found", 404);
	if (!detail.slug) return json({ plan: null });
	const plan = queryPlanBySlug(db, detail.slug);
	return json({ plan: plan ?? null });
}

function handleGetPlanHistory(slug: string): Response {
	const db = getDb();
	const versions = queryPlanHistory(db, slug);
	return json({ versions });
}

function handleGetSessionContext(sessionId: string): Response {
	const db = getDb();
	const context = queryContextForSession(db, sessionId);
	return json({ memories: context.memories, rules: context.rules });
}

function handleGetTasks(): Response {
	const db = getDb();
	const teams = queryTasks(db);
	return json({ teams });
}

function handleGetSessionTasks(sessionId: string): Response {
	const db = getDb();
	const detail = querySessionDetail(db, sessionId);
	if (!detail) return errorResponse("Session not found", 404);
	if (!detail.teamName) return json({ tasks: null, teamName: null });
	const tasks = queryTasksForTeam(db, detail.teamName);
	return json({ tasks, teamName: detail.teamName });
}

function handleGetSessionAgents(sessionId: string): Response {
	const db = getDb();
	const result = querySubagentsForSession(db, sessionId);
	return json(result);
}

function handleGetAgents(): Response {
	const db = getDb();
	const result = queryAllAgents(db);
	return json(result);
}

function handleGetContext(): Response {
	const db = getDb();
	const files = queryAllContext(db);
	return json({ files });
}

function handleSearch(url: URL): Response {
	const q = url.searchParams.get("q");
	if (!q) return errorResponse("Query parameter 'q' is required", 400);

	const db = getDb();
	const result = querySearch(db, {
		q,
		project: url.searchParams.get("project") || undefined,
		role: url.searchParams.get("role") || undefined,
		since: url.searchParams.get("since") || undefined,
		limit: parseInt(url.searchParams.get("limit") || "20", 10) || 20,
		offset: parseInt(url.searchParams.get("offset") || "0", 10) || 0,
	});
	return json(result);
}

function handleIngestionStatus(): Response {
	const db = getDb();
	const status = queryIngestionStatus(db);
	return json(status);
}

export async function handleApiRequest(req: Request): Promise<Response> {
	const url = parseUrl(req);
	const path = url.pathname;

	// --- POST routes (memory system) ---
	if (req.method === "POST") {
		if (path === "/api/memory/analyze") {
			try {
				const body = (await req.json()) as {
					sessionId?: string;
					projectId?: string;
					budgetUsd?: number;
				};
				if (!body.sessionId) {
					return errorResponse("sessionId is required", 400);
				}
				// Look up projectId from session if not provided
				let projectId = body.projectId;
				if (!projectId) {
					const db = getDb();
					const session = db
						.prepare("SELECT project_id FROM sessions WHERE session_id = ?")
						.get(body.sessionId) as { project_id: string } | null;
					if (!session) return errorResponse("Session not found", 404);
					projectId = session.project_id;
				}
				const runId = startAnalysis(body.sessionId, projectId, body.budgetUsd);
				return json({ runId });
			} catch (err) {
				return errorResponse(
					err instanceof Error ? err.message : "Invalid request",
					400,
				);
			}
		}

		if (path === "/api/memory/maintain") {
			try {
				const body = (await req.json()) as {
					projectId?: string;
					budgetUsd?: number;
				};
				if (!body.projectId) {
					return errorResponse("projectId is required", 400);
				}
				const runId = startMaintenance(body.projectId, body.budgetUsd);
				return json({ runId });
			} catch (err) {
				return errorResponse(
					err instanceof Error ? err.message : "Invalid request",
					400,
				);
			}
		}

		const obsApproveMatch = path.match(
			/^\/api\/memory\/observations\/(\d+)\/approve$/,
		);
		if (obsApproveMatch) {
			const db = getDb();
			const obsId = parseInt(obsApproveMatch[1], 10);
			const obs = db
				.prepare("SELECT * FROM observations WHERE id = ?")
				.get(obsId) as {
				id: number;
				project_id: string;
				category: string;
				content: string;
			} | null;
			if (!obs) return errorResponse("Observation not found", 404);
			const memoryId = insertMemory(db, {
				projectId: obs.project_id,
				category: obs.category,
				content: obs.content,
				sourceObservationIds: [obs.id],
				confidence: 1.0,
			});
			updateObservationStatus(db, obsId, "promoted", memoryId);
			return json({ memoryId });
		}

		const obsDismissMatch = path.match(
			/^\/api\/memory\/observations\/(\d+)\/dismiss$/,
		);
		if (obsDismissMatch) {
			const db = getDb();
			const obsId = parseInt(obsDismissMatch[1], 10);
			const obs = db
				.prepare("SELECT 1 FROM observations WHERE id = ?")
				.get(obsId);
			if (!obs) return errorResponse("Observation not found", 404);
			updateObservationStatus(db, obsId, "stale");
			return json({ success: true });
		}

		const memRevokeMatch = path.match(
			/^\/api\/memory\/memories\/(\d+)\/revoke$/,
		);
		if (memRevokeMatch) {
			const db = getDb();
			const memId = parseInt(memRevokeMatch[1], 10);
			const mem = db.prepare("SELECT 1 FROM memories WHERE id = ?").get(memId);
			if (!mem) return errorResponse("Memory not found", 404);
			updateMemoryStatus(db, memId, "revoked");
			return json({ success: true });
		}

		return errorResponse("Method not allowed", 405);
	}

	if (req.method !== "GET") {
		return errorResponse("Method not allowed", 405);
	}

	// Route matching
	if (path === "/api/projects") {
		return handleGetProjects();
	}

	const projectDetailMatch = path.match(/^\/api\/projects\/([^/]+)$/);
	if (projectDetailMatch) {
		return handleGetProjectDetail(decodeURIComponent(projectDetailMatch[1]));
	}

	if (path === "/api/sessions") {
		return handleGetSessions(url);
	}

	const sessionAgentsMatch = path.match(/^\/api\/sessions\/([^/]+)\/agents$/);
	if (sessionAgentsMatch) {
		return handleGetSessionAgents(decodeURIComponent(sessionAgentsMatch[1]));
	}

	const sessionDetailMatch = path.match(/^\/api\/sessions\/([^/]+)$/);
	if (sessionDetailMatch) {
		return handleGetSessionDetail(decodeURIComponent(sessionDetailMatch[1]));
	}

	const sessionPlanMatch = path.match(/^\/api\/sessions\/([^/]+)\/plan$/);
	if (sessionPlanMatch) {
		return handleGetSessionPlan(decodeURIComponent(sessionPlanMatch[1]));
	}

	const sessionContextMatch = path.match(/^\/api\/sessions\/([^/]+)\/context$/);
	if (sessionContextMatch) {
		return handleGetSessionContext(decodeURIComponent(sessionContextMatch[1]));
	}

	const sessionMessagesMatch = path.match(
		/^\/api\/sessions\/([^/]+)\/messages$/,
	);
	if (sessionMessagesMatch) {
		return handleGetSessionMessages(
			decodeURIComponent(sessionMessagesMatch[1]),
			url,
		);
	}

	if (path === "/api/analytics/global") {
		return handleGetGlobalAnalytics(url);
	}

	const projectAnalyticsMatch = path.match(
		/^\/api\/analytics\/project\/([^/]+)$/,
	);
	if (projectAnalyticsMatch) {
		return handleGetProjectAnalytics(
			decodeURIComponent(projectAnalyticsMatch[1]),
		);
	}

	const planHistoryMatch = path.match(/^\/api\/plans\/([^/]+)\/history$/);
	if (planHistoryMatch) {
		return handleGetPlanHistory(decodeURIComponent(planHistoryMatch[1]));
	}

	if (path === "/api/plans") {
		return handleGetPlans();
	}

	if (path === "/api/tasks") {
		return handleGetTasks();
	}

	const sessionTasksMatch = path.match(/^\/api\/sessions\/([^/]+)\/tasks$/);
	if (sessionTasksMatch) {
		return handleGetSessionTasks(decodeURIComponent(sessionTasksMatch[1]));
	}

	if (path === "/api/agents") {
		return handleGetAgents();
	}

	if (path === "/api/context") {
		return handleGetContext();
	}

	if (path === "/api/search") {
		return handleSearch(url);
	}

	if (path === "/api/ingestion/status") {
		return handleIngestionStatus();
	}

	// --- Memory GET routes ---

	if (path === "/api/memory/runs") {
		const db = getDb();
		const result = queryMemoryRuns(db, {
			projectId: url.searchParams.get("project") || undefined,
			runType: url.searchParams.get("type") || undefined,
			sessionId: url.searchParams.get("session") || undefined,
			limit: parseInt(url.searchParams.get("limit") || "50", 10) || 50,
			offset: parseInt(url.searchParams.get("offset") || "0", 10) || 0,
		});
		return json(result);
	}

	const memoryRunDetailMatch = path.match(/^\/api\/memory\/runs\/([^/]+)$/);
	if (memoryRunDetailMatch) {
		const db = getDb();
		const detail = queryMemoryRunDetail(
			db,
			decodeURIComponent(memoryRunDetailMatch[1]),
		);
		if (!detail) return errorResponse("Run not found", 404);
		return json(detail);
	}

	const obsHistoryMatch = path.match(
		/^\/api\/memory\/observations\/(\d+)\/history$/,
	);
	if (obsHistoryMatch) {
		const db = getDb();
		const obsId = parseInt(obsHistoryMatch[1], 10);
		const events = queryObservationHistory(db, obsId);
		return json({ events });
	}

	if (path === "/api/memory/observations") {
		const db = getDb();
		const result = queryObservations(db, {
			projectId: url.searchParams.get("project") || undefined,
			category: url.searchParams.get("category") || undefined,
			status: url.searchParams.get("status") || undefined,
			limit: parseInt(url.searchParams.get("limit") || "50", 10) || 50,
			offset: parseInt(url.searchParams.get("offset") || "0", 10) || 0,
		});
		return json(result);
	}

	if (path === "/api/memory/memories") {
		const db = getDb();
		const result = queryMemories(db, {
			projectId: url.searchParams.get("project") || undefined,
			limit: parseInt(url.searchParams.get("limit") || "50", 10) || 50,
			offset: parseInt(url.searchParams.get("offset") || "0", 10) || 0,
		});
		return json(result);
	}

	if (path === "/api/memory/stats") {
		const db = getDb();
		const stats = queryMemoryStats(
			db,
			url.searchParams.get("project") || undefined,
		);
		return json(stats);
	}

	return errorResponse("Not found", 404);
}
