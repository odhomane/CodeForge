import type { Database } from "bun:sqlite";
import { MODEL_PRICING } from "./cost.js";
import type { TaskItem } from "./task-reader.js";

// --- Types ---

export interface PaginatedResponse<T> {
	data: T[];
	meta: { total: number; limit: number; offset: number; hasMore: boolean };
}

export interface SessionListItem {
	sessionId: string;
	projectId: string;
	projectName: string;
	slug: string | null;
	teamName: string | null;
	cwd: string | null;
	gitBranch: string | null;
	models: string[];
	inputTokens: number;
	outputTokens: number;
	cacheCreationTokens: number;
	cacheReadTokens: number;
	messageCount: number;
	timeStart: string | null;
	timeEnd: string | null;
	fileSize: number;
	agentCount: number;
}

export interface SearchResult {
	uuid: string;
	sessionId: string;
	type: string;
	timestamp: string;
	excerpt: string;
	rank: number;
}

export interface GlobalAnalyticsResult {
	projectCount: number;
	totalSessions: number;
	totalMessages: number;
	totalTokens: {
		input: number;
		output: number;
		cacheCreation: number;
		cacheRead: number;
	};
	models: string[];
	totalCost: number;
	cacheEfficiency: number;
	costByDay: Record<string, number>;
	dailyActivity: Record<string, number>;
	toolUsage: { name: string; count: number }[];
	modelDistribution: Record<string, number>;
	topFiles: { path: string; count: number }[];
	durationBuckets: Record<string, number>;
	recentActivity: {
		sessionId: string;
		project?: string;
		lastPrompt?: string;
		duration: number;
		tokens: number;
		timestamp: string;
	}[];
	sparklines: {
		sessions: number[];
		tokens: number[];
		cost: number[];
		cacheEfficiency: number[];
	};
	dailyTokenBreakdown: Record<
		string,
		{ input: number; output: number; cacheRead: number; cacheCreation: number }
	>;
	costByProject: Record<string, number>;
	hourlyActivity: Record<string, number>;
	dailyCacheEfficiency: Record<string, number>;
	dailyAvgDuration: Record<string, number>;
	weekOverWeek: {
		sessions: number;
		tokens: number;
		cost: number;
		cacheEfficiency: number;
	};
	costByModel: Record<string, number>;
	cacheEfficiencyByModel: Record<string, number>;
	costByDayByModel: Record<string, Record<string, number>>;
	sessionScatter: {
		sessionId: string;
		slug?: string;
		project: string;
		model: string;
		cost: number;
		durationMin: number;
		filesEdited: number;
		cacheHitRate: number;
	}[];
	cacheSavings: {
		uncachedCost: number;
		actualCost: number;
		savings: number;
		savingsPercent: number;
	};
	dailyCostPerEdit: Record<string, number>;
	dailyOutputInputRatio: Record<string, number>;
	modelFirstSeen: Record<string, string>;
	insights: string[];
	modelSessionCount: Record<string, number>;
}

export interface ProjectAnalyticsResult {
	projectId: string;
	projectPath: string;
	sessionCount: number;
	analytics: {
		duration: number;
		messagesByType: Record<string, number>;
		tokenBreakdown: {
			input: number;
			output: number;
			cacheCreation: number;
			cacheRead: number;
		};
		toolCallsByName: Record<string, number>;
		stopReasons: Record<string, number>;
		cacheEfficiency: number;
	};
	totalCost: number;
	costOverTime: Record<string, number>;
	toolUsage: { name: string; count: number }[];
	hourlyActivity: Record<string, number>;
	topFiles: { path: string; count: number }[];
	dailyActivity: Record<string, number>;
}

// --- Helpers ---

function costForTokens(tokens: number, ratePerMillion: number): number {
	return (tokens / 1_000_000) * ratePerMillion;
}

function computeModelCost(
	model: string,
	tokens: {
		input: number;
		output: number;
		cacheCreation: number;
		cacheRead: number;
	},
): number {
	const pricing = MODEL_PRICING[model];
	if (!pricing) return 0;
	return (
		costForTokens(tokens.input, pricing.input) +
		costForTokens(tokens.output, pricing.output) +
		costForTokens(tokens.cacheCreation, pricing.cacheCreation) +
		costForTokens(tokens.cacheRead, pricing.cacheRead)
	);
}

function parseModels(modelsStr: string | null): string[] {
	if (!modelsStr) return [];
	try {
		return JSON.parse(modelsStr) as string[];
	} catch {
		return modelsStr ? [modelsStr] : [];
	}
}

// fillDays is available if needed for gap-filling daily data
// function fillDays(data: Map<string, number>, days: number): Map<string, number> { ... }

// --- Projects ---

export function queryProjects(db: Database): Array<{
	id: string;
	path: string;
	name: string;
	sessionCount: number;
	totalTokens: {
		input: number;
		output: number;
		cacheCreation: number;
		cacheRead: number;
	};
	lastActivity: string | null;
}> {
	const rows = db
		.prepare(`
		SELECT
			p.encoded_name,
			p.path,
			p.name,
			COUNT(s.session_id) as session_count,
			COALESCE(SUM(s.input_tokens), 0) as input_tokens,
			COALESCE(SUM(s.output_tokens), 0) as output_tokens,
			COALESCE(SUM(s.cache_creation_tokens), 0) as cache_creation_tokens,
			COALESCE(SUM(s.cache_read_tokens), 0) as cache_read_tokens,
			MAX(s.time_end) as last_activity
		FROM projects p
		LEFT JOIN sessions s ON s.project_id = p.encoded_name AND (s.parent_session_id IS NULL OR s.parent_session_id = s.session_id)
		GROUP BY p.encoded_name
		ORDER BY last_activity DESC NULLS LAST
	`)
		.all() as Array<{
		encoded_name: string;
		path: string;
		name: string;
		session_count: number;
		input_tokens: number;
		output_tokens: number;
		cache_creation_tokens: number;
		cache_read_tokens: number;
		last_activity: string | null;
	}>;

	return rows.map((row) => ({
		id: row.encoded_name,
		path: row.path,
		name: row.name,
		sessionCount: row.session_count,
		totalTokens: {
			input: row.input_tokens,
			output: row.output_tokens,
			cacheCreation: row.cache_creation_tokens,
			cacheRead: row.cache_read_tokens,
		},
		lastActivity: row.last_activity,
	}));
}

export function queryProjectDetail(
	db: Database,
	projectId: string,
): {
	id: string;
	path: string;
	sessionCount: number;
	totalTokens: {
		input: number;
		output: number;
		cacheCreation: number;
		cacheRead: number;
	};
	models: string[];
	totalMessages: number;
	sessions: {
		sessionId: string;
		messageCount: number;
		timeRange: { start: string; end: string } | null;
		models: string[];
	}[];
} | null {
	const project = db
		.prepare(
			"SELECT encoded_name, path, name FROM projects WHERE encoded_name = ?",
		)
		.get(projectId) as {
		encoded_name: string;
		path: string;
		name: string;
	} | null;

	if (!project) return null;

	const sessions = db
		.prepare(`
		SELECT session_id, models, input_tokens, output_tokens,
			cache_creation_tokens, cache_read_tokens,
			message_count, time_start, time_end
		FROM sessions WHERE project_id = ? AND (parent_session_id IS NULL OR parent_session_id = session_id)
	`)
		.all(projectId) as Array<{
		session_id: string;
		models: string | null;
		input_tokens: number;
		output_tokens: number;
		cache_creation_tokens: number;
		cache_read_tokens: number;
		message_count: number;
		time_start: string | null;
		time_end: string | null;
	}>;

	let totalInput = 0;
	let totalOutput = 0;
	let totalCacheCreation = 0;
	let totalCacheRead = 0;
	let totalMessages = 0;
	const allModels = new Set<string>();

	const sessionList = sessions.map((s) => {
		totalInput += s.input_tokens;
		totalOutput += s.output_tokens;
		totalCacheCreation += s.cache_creation_tokens;
		totalCacheRead += s.cache_read_tokens;
		totalMessages += s.message_count;
		const models = parseModels(s.models);
		for (const m of models) allModels.add(m);

		return {
			sessionId: s.session_id,
			messageCount: s.message_count,
			timeRange:
				s.time_start && s.time_end
					? { start: s.time_start, end: s.time_end }
					: null,
			models,
		};
	});

	return {
		id: project.encoded_name,
		path: project.path,
		sessionCount: sessions.length,
		totalTokens: {
			input: totalInput,
			output: totalOutput,
			cacheCreation: totalCacheCreation,
			cacheRead: totalCacheRead,
		},
		models: [...allModels],
		totalMessages,
		sessions: sessionList,
	};
}

// --- Sessions ---

export function querySessions(
	db: Database,
	filters: {
		project?: string;
		model?: string;
		since?: string;
		limit?: number;
		offset?: number;
	},
): PaginatedResponse<SessionListItem> {
	const conditions: string[] = [];
	const params: (string | number)[] = [];

	conditions.push(
		"(s.parent_session_id IS NULL OR s.parent_session_id = s.session_id)",
	);

	if (filters.project) {
		conditions.push("s.project_id = ?");
		params.push(filters.project);
	}
	if (filters.since) {
		conditions.push("s.time_end >= ?");
		params.push(filters.since);
	}
	if (filters.model) {
		conditions.push("s.models LIKE ?");
		params.push(`%${filters.model}%`);
	}

	const where =
		conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
	const limit = Math.min(filters.limit ?? 50, 200);
	const offset = filters.offset ?? 0;

	const countRow = db
		.prepare(`SELECT COUNT(*) as cnt FROM sessions s ${where}`)
		.get(...params) as { cnt: number };
	const total = countRow.cnt;

	const rows = db
		.prepare(`
		SELECT s.session_id, s.project_id, p.name as project_name,
			s.slug, s.team_name, s.cwd, s.git_branch, s.models,
			s.input_tokens, s.output_tokens,
			s.cache_creation_tokens, s.cache_read_tokens,
			s.message_count, s.time_start, s.time_end, s.file_size,
			(SELECT COUNT(*) FROM subagents sa WHERE sa.parent_session_id = s.session_id) as agent_count
		FROM sessions s
		JOIN projects p ON p.encoded_name = s.project_id
		${where}
		ORDER BY s.time_end DESC NULLS LAST
		LIMIT ? OFFSET ?
	`)
		.all(...params, limit, offset) as Array<{
		session_id: string;
		project_id: string;
		project_name: string;
		slug: string | null;
		team_name: string | null;
		cwd: string | null;
		git_branch: string | null;
		models: string | null;
		input_tokens: number;
		output_tokens: number;
		cache_creation_tokens: number;
		cache_read_tokens: number;
		message_count: number;
		time_start: string | null;
		time_end: string | null;
		file_size: number;
		agent_count: number;
	}>;

	return {
		data: rows.map((row) => ({
			sessionId: row.session_id,
			projectId: row.project_id,
			projectName: row.project_name,
			slug: row.slug,
			teamName: row.team_name,
			cwd: row.cwd,
			gitBranch: row.git_branch,
			models: parseModels(row.models),
			inputTokens: row.input_tokens,
			outputTokens: row.output_tokens,
			cacheCreationTokens: row.cache_creation_tokens,
			cacheReadTokens: row.cache_read_tokens,
			messageCount: row.message_count,
			timeStart: row.time_start,
			timeEnd: row.time_end,
			fileSize: row.file_size,
			agentCount: row.agent_count,
		})),
		meta: { total, limit, offset, hasMore: offset + limit < total },
	};
}

export function querySessionDetail(
	db: Database,
	sessionId: string,
): {
	sessionId: string;
	projectId: string;
	projectPath: string;
	slug: string | null;
	teamName: string | null;
	cwd: string | null;
	gitBranch: string | null;
	models: string[];
	totalTokens: {
		input: number;
		output: number;
		cacheCreation: number;
		cacheRead: number;
	};
	messageCount: number;
	timeStart: string | null;
	timeEnd: string | null;
	fileSize: number;
	cost: number;
} | null {
	const row = db
		.prepare(`
		SELECT s.session_id, s.project_id, p.path as project_path,
			s.slug, s.team_name, s.cwd, s.git_branch, s.models,
			s.input_tokens, s.output_tokens,
			s.cache_creation_tokens, s.cache_read_tokens,
			s.message_count, s.time_start, s.time_end, s.file_size
		FROM sessions s
		JOIN projects p ON p.encoded_name = s.project_id
		WHERE s.session_id = ?
	`)
		.get(sessionId) as {
		session_id: string;
		project_id: string;
		project_path: string;
		slug: string | null;
		team_name: string | null;
		cwd: string | null;
		git_branch: string | null;
		models: string | null;
		input_tokens: number;
		output_tokens: number;
		cache_creation_tokens: number;
		cache_read_tokens: number;
		message_count: number;
		time_start: string | null;
		time_end: string | null;
		file_size: number;
	} | null;

	if (!row) return null;

	const models = parseModels(row.models);

	// Compute cost from message-level per-model tokens
	const modelRows = db
		.prepare(`
		SELECT model,
			SUM(input_tokens) as input,
			SUM(output_tokens) as output,
			SUM(cache_creation_tokens) as cache_creation,
			SUM(cache_read_tokens) as cache_read
		FROM messages WHERE session_id = ? AND model IS NOT NULL
		GROUP BY model
	`)
		.all(sessionId) as Array<{
		model: string;
		input: number;
		output: number;
		cache_creation: number;
		cache_read: number;
	}>;

	let cost = 0;
	for (const mr of modelRows) {
		cost += computeModelCost(mr.model, {
			input: mr.input,
			output: mr.output,
			cacheCreation: mr.cache_creation,
			cacheRead: mr.cache_read,
		});
	}

	return {
		sessionId: row.session_id,
		projectId: row.project_id,
		projectPath: row.project_path,
		slug: row.slug,
		teamName: row.team_name,
		cwd: row.cwd,
		gitBranch: row.git_branch,
		models,
		totalTokens: {
			input: row.input_tokens,
			output: row.output_tokens,
			cacheCreation: row.cache_creation_tokens,
			cacheRead: row.cache_read_tokens,
		},
		messageCount: row.message_count,
		timeStart: row.time_start,
		timeEnd: row.time_end,
		fileSize: row.file_size,
		cost,
	};
}

export function queryAnalyzedSessionIds(
	db: Database,
	sessionIds: string[],
): Set<string> {
	if (sessionIds.length === 0) return new Set();
	const placeholders = sessionIds.map(() => "?").join(", ");
	const rows = db
		.prepare(
			`SELECT DISTINCT session_id FROM memory_runs WHERE session_id IN (${placeholders}) AND run_type = 'analysis'`,
		)
		.all(...sessionIds) as Array<{ session_id: string }>;
	return new Set(rows.map((r) => r.session_id));
}

export function querySessionMessages(
	db: Database,
	sessionId: string,
	options?: {
		afterId?: number;
		limit?: number;
	},
): { messages: unknown[]; count: number } {
	const limit = options?.limit ?? 500;
	const afterId = options?.afterId ?? 0;

	const rows = db
		.prepare(`
		SELECT raw_json FROM messages
		WHERE session_id = ? AND id > ?
		ORDER BY id ASC
		LIMIT ?
	`)
		.all(sessionId, afterId, limit) as Array<{ raw_json: string }>;

	const messages = rows
		.map((r) => {
			try {
				return JSON.parse(r.raw_json);
			} catch {
				return null;
			}
		})
		.filter(Boolean);

	const countRow = db
		.prepare("SELECT COUNT(*) as cnt FROM messages WHERE session_id = ?")
		.get(sessionId) as { cnt: number };

	return { messages, count: countRow.cnt };
}

// --- Analytics ---

export function queryGlobalAnalytics(
	db: Database,
	filters?: {
		since?: string;
		until?: string;
	},
): GlobalAnalyticsResult {
	// Build WHERE clause for session-level time filtering
	const conditions: string[] = [];
	const params: (string | number)[] = [];
	if (filters?.since) {
		conditions.push("s.time_end >= ?");
		params.push(filters.since);
	}
	if (filters?.until) {
		conditions.push("s.time_start <= ?");
		params.push(filters.until);
	}
	const sessionWhere =
		conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

	// --- Totals ---
	const totals = db
		.prepare(`
		SELECT
			COUNT(*) as session_count,
			COALESCE(SUM(s.input_tokens), 0) as input,
			COALESCE(SUM(s.output_tokens), 0) as output,
			COALESCE(SUM(s.cache_creation_tokens), 0) as cache_creation,
			COALESCE(SUM(s.cache_read_tokens), 0) as cache_read,
			COALESCE(SUM(s.message_count), 0) as message_count
		FROM sessions s ${sessionWhere}
	`)
		.get(...params) as {
		session_count: number;
		input: number;
		output: number;
		cache_creation: number;
		cache_read: number;
		message_count: number;
	};

	const projectCount = (
		db.prepare("SELECT COUNT(*) as cnt FROM projects").get() as { cnt: number }
	).cnt;

	// --- All models ---
	const modelRows = db
		.prepare(`
		SELECT DISTINCT s.models FROM sessions s ${sessionWhere}
	`)
		.all(...params) as Array<{ models: string | null }>;
	const allModels = new Set<string>();
	for (const row of modelRows) {
		for (const m of parseModels(row.models)) allModels.add(m);
	}

	// --- Per-model tokens from messages ---
	const perModelRows = db
		.prepare(`
		SELECT m.model,
			SUM(m.input_tokens) as input,
			SUM(m.output_tokens) as output,
			SUM(m.cache_creation_tokens) as cache_creation,
			SUM(m.cache_read_tokens) as cache_read,
			MIN(m.timestamp) as first_seen
		FROM messages m
		JOIN sessions s ON s.session_id = m.session_id
		${sessionWhere}
		${sessionWhere ? "AND" : "WHERE"} m.model IS NOT NULL
		GROUP BY m.model
	`)
		.all(...params) as Array<{
		model: string;
		input: number;
		output: number;
		cache_creation: number;
		cache_read: number;
		first_seen: string;
	}>;

	const perModelTokens = new Map<
		string,
		{ input: number; output: number; cacheCreation: number; cacheRead: number }
	>();
	const modelFirstSeen: Record<string, string> = {};
	for (const row of perModelRows) {
		perModelTokens.set(row.model, {
			input: row.input,
			output: row.output,
			cacheCreation: row.cache_creation,
			cacheRead: row.cache_read,
		});
		modelFirstSeen[row.model] = row.first_seen;
	}

	// --- Cost by model ---
	let totalCost = 0;
	const costByModel: Record<string, number> = {};
	for (const [model, tok] of perModelTokens) {
		const c = computeModelCost(model, tok);
		costByModel[model] = c;
		totalCost += c;
	}

	// --- Cache efficiency ---
	const totalReadable = totals.cache_read + totals.input;
	const cacheEfficiency =
		totalReadable > 0 ? totals.cache_read / totalReadable : 0;

	// --- Cache efficiency by model ---
	const cacheEfficiencyByModel: Record<string, number> = {};
	for (const [model, tok] of perModelTokens) {
		const readable = tok.cacheRead + tok.input;
		cacheEfficiencyByModel[model] = readable > 0 ? tok.cacheRead / readable : 0;
	}

	// --- Daily aggregations from sessions ---
	const dailyRows = db
		.prepare(`
		SELECT substr(s.time_end, 1, 10) as day,
			COUNT(*) as session_count,
			SUM(s.input_tokens) as input,
			SUM(s.output_tokens) as output,
			SUM(s.cache_creation_tokens) as cache_creation,
			SUM(s.cache_read_tokens) as cache_read
		FROM sessions s
		${sessionWhere}
		${sessionWhere ? "AND" : "WHERE"} s.time_end IS NOT NULL
		GROUP BY day ORDER BY day
	`)
		.all(...params) as Array<{
		day: string;
		session_count: number;
		input: number;
		output: number;
		cache_creation: number;
		cache_read: number;
	}>;

	const costByDay: Record<string, number> = {};
	const dailyActivity: Record<string, number> = {};
	const dailyTokenBreakdown: Record<
		string,
		{ input: number; output: number; cacheRead: number; cacheCreation: number }
	> = {};
	const dailyCacheEfficiency: Record<string, number> = {};
	const dailyInputMap = new Map<string, number>();
	const dailyOutputMap = new Map<string, number>();

	for (const row of dailyRows) {
		dailyActivity[row.day] = row.input + row.output + row.cache_read;
		dailyTokenBreakdown[row.day] = {
			input: row.input,
			output: row.output,
			cacheRead: row.cache_read,
			cacheCreation: row.cache_creation,
		};
		dailyInputMap.set(row.day, row.input);
		dailyOutputMap.set(row.day, row.output);

		const dayReadable = row.cache_read + row.input;
		if (dayReadable > 0) {
			dailyCacheEfficiency[row.day] = row.cache_read / dayReadable;
		}
	}

	// Compute costByDay from per-day per-model message tokens
	const dailyModelRows = db
		.prepare(`
		SELECT substr(m.timestamp, 1, 10) as day, m.model,
			SUM(m.input_tokens) as input,
			SUM(m.output_tokens) as output,
			SUM(m.cache_creation_tokens) as cache_creation,
			SUM(m.cache_read_tokens) as cache_read
		FROM messages m
		JOIN sessions s ON s.session_id = m.session_id
		${sessionWhere}
		${sessionWhere ? "AND" : "WHERE"} m.model IS NOT NULL
		GROUP BY day, m.model ORDER BY day
	`)
		.all(...params) as Array<{
		day: string;
		model: string;
		input: number;
		output: number;
		cache_creation: number;
		cache_read: number;
	}>;

	const costByDayByModel: Record<string, Record<string, number>> = {};
	for (const row of dailyModelRows) {
		const c = computeModelCost(row.model, {
			input: row.input,
			output: row.output,
			cacheCreation: row.cache_creation,
			cacheRead: row.cache_read,
		});
		costByDay[row.day] = (costByDay[row.day] ?? 0) + c;

		if (!costByDayByModel[row.day]) {
			costByDayByModel[row.day] = {};
		}
		costByDayByModel[row.day][row.model] =
			(costByDayByModel[row.day][row.model] ?? 0) + c;
	}

	// --- Duration-based aggregations ---
	const durationRows = db
		.prepare(`
		SELECT s.time_start, s.time_end, substr(s.time_end, 1, 10) as day
		FROM sessions s
		${sessionWhere}
		${sessionWhere ? "AND" : "WHERE"} s.time_start IS NOT NULL AND s.time_end IS NOT NULL
	`)
		.all(...params) as Array<{
		time_start: string;
		time_end: string;
		day: string;
	}>;

	const durationBuckets: Record<string, number> = {
		"< 15m": 0,
		"15-30m": 0,
		"30m-1h": 0,
		"1-2h": 0,
		"2-4h": 0,
		"> 4h": 0,
	};
	const dailyDurationSum = new Map<string, number>();
	const dailyDurationCount = new Map<string, number>();

	for (const row of durationRows) {
		const durationMs =
			new Date(row.time_end).getTime() - new Date(row.time_start).getTime();
		const durationMin = durationMs / 60_000;

		if (durationMin < 15) durationBuckets["< 15m"]++;
		else if (durationMin < 30) durationBuckets["15-30m"]++;
		else if (durationMin < 60) durationBuckets["30m-1h"]++;
		else if (durationMin < 120) durationBuckets["1-2h"]++;
		else if (durationMin < 240) durationBuckets["2-4h"]++;
		else durationBuckets["> 4h"]++;

		dailyDurationSum.set(
			row.day,
			(dailyDurationSum.get(row.day) ?? 0) + durationMs,
		);
		dailyDurationCount.set(row.day, (dailyDurationCount.get(row.day) ?? 0) + 1);
	}

	const dailyAvgDuration: Record<string, number> = {};
	for (const [d, sum] of dailyDurationSum) {
		const count = dailyDurationCount.get(d) ?? 1;
		dailyAvgDuration[d] = sum / count;
	}

	// --- Hourly activity ---
	const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
	const hourlyRows = db
		.prepare(`
		SELECT s.time_start, (s.input_tokens + s.output_tokens + s.cache_read_tokens) as total_tokens
		FROM sessions s
		${sessionWhere}
		${sessionWhere ? "AND" : "WHERE"} s.time_start IS NOT NULL
	`)
		.all(...params) as Array<{ time_start: string; total_tokens: number }>;

	const hourlyActivity: Record<string, number> = {};
	for (const row of hourlyRows) {
		const d = new Date(row.time_start);
		const dayName = dayNames[d.getDay()];
		const hour = String(d.getHours()).padStart(2, "0");
		const key = `${dayName}-${hour}`;
		hourlyActivity[key] = (hourlyActivity[key] ?? 0) + row.total_tokens;
	}

	// --- Tool usage ---
	const toolRows = db
		.prepare(`
		SELECT tc.tool_name, COUNT(*) as count
		FROM tool_calls tc
		JOIN sessions s ON s.session_id = tc.session_id
		${sessionWhere}
		GROUP BY tc.tool_name ORDER BY count DESC
	`)
		.all(...params) as Array<{ tool_name: string; count: number }>;
	const toolUsage = toolRows.map((r) => ({
		name: r.tool_name,
		count: r.count,
	}));

	// --- Model distribution ---
	const totalModelTokens = [...perModelTokens.values()].reduce(
		(acc, tok) => acc + tok.input + tok.output,
		0,
	);
	const modelDistribution: Record<string, number> = {};
	for (const [model, tok] of perModelTokens) {
		modelDistribution[model] =
			totalModelTokens > 0 ? (tok.input + tok.output) / totalModelTokens : 0;
	}

	// --- Top files ---
	const fileRows = db
		.prepare(`
		SELECT ft.file_path, COUNT(*) as count
		FROM files_touched ft
		JOIN sessions s ON s.session_id = ft.session_id
		${sessionWhere}
		GROUP BY ft.file_path ORDER BY count DESC LIMIT 20
	`)
		.all(...params) as Array<{ file_path: string; count: number }>;
	const topFiles = fileRows.map((r) => ({ path: r.file_path, count: r.count }));

	// --- Cost by project ---
	const costByProjectRows = db
		.prepare(`
		SELECT p.name as project_name, m.model,
			SUM(m.input_tokens) as input,
			SUM(m.output_tokens) as output,
			SUM(m.cache_creation_tokens) as cache_creation,
			SUM(m.cache_read_tokens) as cache_read
		FROM messages m
		JOIN sessions s ON s.session_id = m.session_id
		JOIN projects p ON p.encoded_name = s.project_id
		${sessionWhere}
		${sessionWhere ? "AND" : "WHERE"} m.model IS NOT NULL
		GROUP BY p.name, m.model
	`)
		.all(...params) as Array<{
		project_name: string;
		model: string;
		input: number;
		output: number;
		cache_creation: number;
		cache_read: number;
	}>;

	const costByProject: Record<string, number> = {};
	for (const row of costByProjectRows) {
		const c = computeModelCost(row.model, {
			input: row.input,
			output: row.output,
			cacheCreation: row.cache_creation,
			cacheRead: row.cache_read,
		});
		costByProject[row.project_name] =
			(costByProject[row.project_name] ?? 0) + c;
	}

	// --- Recent activity ---
	const recentRows = db
		.prepare(`
		SELECT s.session_id, p.name as project_name,
			s.time_start, s.time_end,
			s.input_tokens, s.output_tokens
		FROM sessions s
		JOIN projects p ON p.encoded_name = s.project_id
		${sessionWhere}
		ORDER BY s.time_end DESC NULLS LAST
		LIMIT 8
	`)
		.all(...params) as Array<{
		session_id: string;
		project_name: string;
		time_start: string | null;
		time_end: string | null;
		input_tokens: number;
		output_tokens: number;
	}>;

	// Get last prompt from history_entries for each recent session
	const recentActivity = recentRows.map((row) => {
		const histRow = db
			.prepare(
				"SELECT display FROM history_entries WHERE session_id = ? ORDER BY timestamp DESC LIMIT 1",
			)
			.get(row.session_id) as { display: string | null } | null;

		const duration =
			row.time_start && row.time_end
				? new Date(row.time_end).getTime() - new Date(row.time_start).getTime()
				: 0;

		return {
			sessionId: row.session_id,
			project: row.project_name,
			lastPrompt: histRow?.display ?? undefined,
			duration,
			tokens: row.input_tokens + row.output_tokens,
			timestamp: row.time_end ?? row.time_start ?? "",
		};
	});

	// --- Daily files edited for costPerEdit ---
	const dailyEditRows = db
		.prepare(`
		SELECT substr(s.time_end, 1, 10) as day,
			COUNT(DISTINCT ft.file_path) as edit_count
		FROM files_touched ft
		JOIN sessions s ON s.session_id = ft.session_id
		${sessionWhere}
		${sessionWhere ? "AND" : "WHERE"} s.time_end IS NOT NULL AND ft.action IN ('write', 'edit')
		GROUP BY day
	`)
		.all(...params) as Array<{ day: string; edit_count: number }>;

	const dailyCostPerEdit: Record<string, number> = {};
	for (const row of dailyEditRows) {
		const dayCost = costByDay[row.day] ?? 0;
		if (row.edit_count > 0) {
			dailyCostPerEdit[row.day] = dayCost / row.edit_count;
		}
	}

	// --- Daily output/input ratio ---
	const dailyOutputInputRatio: Record<string, number> = {};
	for (const [d, inputTok] of dailyInputMap) {
		if (inputTok > 0) {
			dailyOutputInputRatio[d] = (dailyOutputMap.get(d) ?? 0) / inputTok;
		}
	}

	// --- Model session count ---
	const modelSessionRows = db
		.prepare(`
		SELECT m.model, COUNT(DISTINCT m.session_id) as session_count
		FROM messages m
		JOIN sessions s ON s.session_id = m.session_id
		${sessionWhere}
		${sessionWhere ? "AND" : "WHERE"} m.model IS NOT NULL
		GROUP BY m.model
	`)
		.all(...params) as Array<{ model: string; session_count: number }>;

	const modelSessionCount: Record<string, number> = {};
	for (const row of modelSessionRows) {
		modelSessionCount[row.model] = row.session_count;
	}

	// --- Session scatter ---
	const scatterRows = db
		.prepare(`
		SELECT s.session_id, s.slug, p.name as project_name,
			s.time_start, s.time_end
		FROM sessions s
		JOIN projects p ON p.encoded_name = s.project_id
		${sessionWhere}
		${sessionWhere ? "AND" : "WHERE"} s.time_start IS NOT NULL AND s.time_end IS NOT NULL
		ORDER BY s.time_end DESC
		LIMIT 200
	`)
		.all(...params) as Array<{
		session_id: string;
		slug: string | null;
		project_name: string;
		time_start: string;
		time_end: string;
	}>;

	const sessionScatter = scatterRows.map((row) => {
		const durationMs =
			new Date(row.time_end).getTime() - new Date(row.time_start).getTime();

		// Per-session per-model tokens
		const smRows = db
			.prepare(`
			SELECT model,
				SUM(input_tokens) as input,
				SUM(output_tokens) as output,
				SUM(cache_creation_tokens) as cache_creation,
				SUM(cache_read_tokens) as cache_read
			FROM messages WHERE session_id = ? AND model IS NOT NULL
			GROUP BY model
		`)
			.all(row.session_id) as Array<{
			model: string;
			input: number;
			output: number;
			cache_creation: number;
			cache_read: number;
		}>;

		let sessionCost = 0;
		let primaryModel = "";
		let maxTokens = 0;
		let sessionCacheRead = 0;
		let sessionTotalReadable = 0;

		for (const sm of smRows) {
			sessionCost += computeModelCost(sm.model, {
				input: sm.input,
				output: sm.output,
				cacheCreation: sm.cache_creation,
				cacheRead: sm.cache_read,
			});
			const total = sm.input + sm.output;
			if (total > maxTokens) {
				maxTokens = total;
				primaryModel = sm.model;
			}
			sessionCacheRead += sm.cache_read;
			sessionTotalReadable += sm.cache_read + sm.input;
		}

		const filesEdited = (
			db
				.prepare(
					"SELECT COUNT(DISTINCT file_path) as cnt FROM files_touched WHERE session_id = ? AND action IN ('write', 'edit')",
				)
				.get(row.session_id) as { cnt: number }
		).cnt;

		const result: {
			sessionId: string;
			slug?: string;
			project: string;
			model: string;
			cost: number;
			durationMin: number;
			filesEdited: number;
			cacheHitRate: number;
		} = {
			sessionId: row.session_id,
			project: row.project_name,
			model: primaryModel || "unknown",
			cost: sessionCost,
			durationMin: durationMs / 60_000,
			filesEdited,
			cacheHitRate:
				sessionTotalReadable > 0 ? sessionCacheRead / sessionTotalReadable : 0,
		};
		if (row.slug) result.slug = row.slug;
		return result;
	});

	// --- Sparklines (last 7 days) ---
	const now = new Date();
	const sparklineSessions: number[] = [];
	const sparklineTokens: number[] = [];
	const sparklineCost: number[] = [];
	const sparklineCacheEfficiency: number[] = [];

	const dailyTokensMap = new Map<string, number>();
	for (const row of dailyRows) {
		dailyTokensMap.set(row.day, row.input + row.output);
	}

	for (let i = 6; i >= 0; i--) {
		const d = new Date(now);
		d.setDate(d.getDate() - i);
		const dayStr = d.toISOString().slice(0, 10);
		sparklineSessions.push(dailyActivity[dayStr] ?? 0);
		sparklineTokens.push(dailyTokensMap.get(dayStr) ?? 0);
		sparklineCost.push(costByDay[dayStr] ?? 0);
		sparklineCacheEfficiency.push(dailyCacheEfficiency[dayStr] ?? 0);
	}

	// --- Week-over-week ---
	let thisWeekSessions = 0,
		lastWeekSessions = 0;
	let thisWeekTokens = 0,
		lastWeekTokens = 0;
	let thisWeekCost = 0,
		lastWeekCost = 0;
	let thisWeekCacheRead = 0,
		lastWeekCacheRead = 0;
	let thisWeekReadable = 0,
		lastWeekReadable = 0;

	for (let i = 0; i < 14; i++) {
		const d = new Date(now);
		d.setDate(d.getDate() - i);
		const dayStr = d.toISOString().slice(0, 10);
		const dayData = dailyRows.find((r) => r.day === dayStr);
		if (i < 7) {
			thisWeekSessions += dailyActivity[dayStr] ?? 0;
			thisWeekTokens += dailyTokensMap.get(dayStr) ?? 0;
			thisWeekCost += costByDay[dayStr] ?? 0;
			thisWeekCacheRead += dayData?.cache_read ?? 0;
			thisWeekReadable += (dayData?.cache_read ?? 0) + (dayData?.input ?? 0);
		} else {
			lastWeekSessions += dailyActivity[dayStr] ?? 0;
			lastWeekTokens += dailyTokensMap.get(dayStr) ?? 0;
			lastWeekCost += costByDay[dayStr] ?? 0;
			lastWeekCacheRead += dayData?.cache_read ?? 0;
			lastWeekReadable += (dayData?.cache_read ?? 0) + (dayData?.input ?? 0);
		}
	}

	const delta = (current: number, previous: number) =>
		previous > 0 ? (current - previous) / previous : 0;

	const thisWeekCacheEff =
		thisWeekReadable > 0 ? thisWeekCacheRead / thisWeekReadable : 0;
	const lastWeekCacheEff =
		lastWeekReadable > 0 ? lastWeekCacheRead / lastWeekReadable : 0;

	const weekOverWeek = {
		sessions: delta(thisWeekSessions, lastWeekSessions),
		tokens: delta(thisWeekTokens, lastWeekTokens),
		cost: delta(thisWeekCost, lastWeekCost),
		cacheEfficiency: delta(thisWeekCacheEff, lastWeekCacheEff),
	};

	// --- Cache savings ---
	let uncachedCost = 0;
	let actualCacheReadCost = 0;
	for (const [model, tok] of perModelTokens) {
		const pricing = MODEL_PRICING[model];
		if (pricing && tok.cacheRead > 0) {
			uncachedCost += costForTokens(tok.cacheRead, pricing.input);
			actualCacheReadCost += costForTokens(tok.cacheRead, pricing.cacheRead);
		}
	}
	const cacheSavingsAmount = uncachedCost - actualCacheReadCost;
	const cacheSavings = {
		uncachedCost,
		actualCost: actualCacheReadCost,
		savings: cacheSavingsAmount,
		savingsPercent: uncachedCost > 0 ? cacheSavingsAmount / uncachedCost : 0,
	};

	// --- Insights ---
	const insights: string[] = [];
	if (cacheSavings.savings > 0) {
		insights.push(
			`Cache saved $${cacheSavings.savings.toFixed(2)} (${(cacheSavings.savingsPercent * 100).toFixed(0)}% of potential cache cost)`,
		);
	}
	const modelCostEntries = Object.entries(costByModel).sort(
		(a, b) => b[1] - a[1],
	);
	if (modelCostEntries.length > 0 && totalCost > 0) {
		const [topModel, topModelCost] = modelCostEntries[0];
		const pct = ((topModelCost / totalCost) * 100).toFixed(0);
		const cacheRate = cacheEfficiencyByModel[topModel] ?? 0;
		const shortName = topModel.replace("claude-", "").split("-20")[0];
		insights.push(
			`${shortName} accounts for ${pct}% of spend ($${topModelCost.toFixed(2)}) with ${(cacheRate * 100).toFixed(0)}% cache hit rate`,
		);
	}
	if (sessionScatter.length > 0) {
		const mostExpensive = sessionScatter.reduce((a, b) =>
			a.cost > b.cost ? a : b,
		);
		if (mostExpensive.cost > 0) {
			insights.push(
				`Most expensive session: $${mostExpensive.cost.toFixed(2)} (${mostExpensive.durationMin.toFixed(0)}min, ${mostExpensive.project})`,
			);
		}
	}
	const thisWeekEditDays: number[] = [];
	for (let i = 0; i < 7; i++) {
		const d = new Date(now);
		d.setDate(d.getDate() - i);
		const dayStr = d.toISOString().slice(0, 10);
		const cpe = dailyCostPerEdit[dayStr];
		if (cpe !== undefined) thisWeekEditDays.push(cpe);
	}
	if (thisWeekEditDays.length > 0) {
		const avgCpe =
			thisWeekEditDays.reduce((a, b) => a + b, 0) / thisWeekEditDays.length;
		insights.push(`Average cost per edit this week: $${avgCpe.toFixed(3)}`);
	}

	return {
		projectCount,
		totalSessions: totals.session_count,
		totalMessages: totals.message_count,
		totalTokens: {
			input: totals.input,
			output: totals.output,
			cacheCreation: totals.cache_creation,
			cacheRead: totals.cache_read,
		},
		models: [...allModels],
		totalCost,
		cacheEfficiency,
		costByDay,
		dailyActivity,
		toolUsage,
		modelDistribution,
		topFiles,
		durationBuckets,
		recentActivity,
		sparklines: {
			sessions: sparklineSessions,
			tokens: sparklineTokens,
			cost: sparklineCost,
			cacheEfficiency: sparklineCacheEfficiency,
		},
		dailyTokenBreakdown,
		costByProject,
		hourlyActivity,
		dailyCacheEfficiency,
		dailyAvgDuration,
		weekOverWeek,
		costByModel,
		cacheEfficiencyByModel,
		costByDayByModel,
		sessionScatter,
		cacheSavings,
		dailyCostPerEdit,
		dailyOutputInputRatio,
		modelFirstSeen,
		insights,
		modelSessionCount,
	};
}

// --- Project Analytics ---

export function queryProjectAnalytics(
	db: Database,
	projectId: string,
): ProjectAnalyticsResult | null {
	const project = db
		.prepare("SELECT encoded_name, path FROM projects WHERE encoded_name = ?")
		.get(projectId) as { encoded_name: string; path: string } | null;

	if (!project) return null;

	const sessionCount = (
		db
			.prepare("SELECT COUNT(*) as cnt FROM sessions WHERE project_id = ?")
			.get(projectId) as { cnt: number }
	).cnt;

	// Message-level analytics
	const msgStats = db
		.prepare(`
		SELECT
			m.type, COUNT(*) as count,
			SUM(m.input_tokens) as input,
			SUM(m.output_tokens) as output,
			SUM(m.cache_creation_tokens) as cache_creation,
			SUM(m.cache_read_tokens) as cache_read
		FROM messages m
		JOIN sessions s ON s.session_id = m.session_id
		WHERE s.project_id = ?
		GROUP BY m.type
	`)
		.all(projectId) as Array<{
		type: string;
		count: number;
		input: number;
		output: number;
		cache_creation: number;
		cache_read: number;
	}>;

	const messagesByType: Record<string, number> = {};
	const tokenBreakdown = {
		input: 0,
		output: 0,
		cacheCreation: 0,
		cacheRead: 0,
	};
	for (const row of msgStats) {
		messagesByType[row.type] = row.count;
		tokenBreakdown.input += row.input;
		tokenBreakdown.output += row.output;
		tokenBreakdown.cacheCreation += row.cache_creation;
		tokenBreakdown.cacheRead += row.cache_read;
	}

	const totalReadable = tokenBreakdown.cacheRead + tokenBreakdown.input;
	const projCacheEfficiency =
		totalReadable > 0 ? tokenBreakdown.cacheRead / totalReadable : 0;

	// Stop reasons
	const stopRows = db
		.prepare(`
		SELECT m.stop_reason, COUNT(*) as count
		FROM messages m
		JOIN sessions s ON s.session_id = m.session_id
		WHERE s.project_id = ? AND m.stop_reason IS NOT NULL
		GROUP BY m.stop_reason
	`)
		.all(projectId) as Array<{ stop_reason: string; count: number }>;

	const stopReasons: Record<string, number> = {};
	for (const row of stopRows) {
		stopReasons[row.stop_reason] = row.count;
	}

	// Duration
	const durationRow = db
		.prepare(`
		SELECT MIN(s.time_start) as earliest, MAX(s.time_end) as latest
		FROM sessions s WHERE s.project_id = ?
	`)
		.get(projectId) as { earliest: string | null; latest: string | null };

	const duration =
		durationRow.earliest && durationRow.latest
			? new Date(durationRow.latest).getTime() -
				new Date(durationRow.earliest).getTime()
			: 0;

	// Tool usage
	const projToolRows = db
		.prepare(`
		SELECT tc.tool_name, COUNT(*) as count
		FROM tool_calls tc
		JOIN sessions s ON s.session_id = tc.session_id
		WHERE s.project_id = ?
		GROUP BY tc.tool_name ORDER BY count DESC
	`)
		.all(projectId) as Array<{ tool_name: string; count: number }>;

	const toolCallsByName: Record<string, number> = {};
	const projToolUsage = projToolRows.map((r) => {
		toolCallsByName[r.tool_name] = r.count;
		return { name: r.tool_name, count: r.count };
	});

	// Cost over time
	const projModelRows = db
		.prepare(`
		SELECT substr(m.timestamp, 1, 10) as day, m.model,
			SUM(m.input_tokens) as input,
			SUM(m.output_tokens) as output,
			SUM(m.cache_creation_tokens) as cache_creation,
			SUM(m.cache_read_tokens) as cache_read
		FROM messages m
		JOIN sessions s ON s.session_id = m.session_id
		WHERE s.project_id = ? AND m.model IS NOT NULL
		GROUP BY day, m.model ORDER BY day
	`)
		.all(projectId) as Array<{
		day: string;
		model: string;
		input: number;
		output: number;
		cache_creation: number;
		cache_read: number;
	}>;

	const costOverTime: Record<string, number> = {};
	let totalCost = 0;
	for (const row of projModelRows) {
		const c = computeModelCost(row.model, {
			input: row.input,
			output: row.output,
			cacheCreation: row.cache_creation,
			cacheRead: row.cache_read,
		});
		costOverTime[row.day] = (costOverTime[row.day] ?? 0) + c;
		totalCost += c;
	}

	// Hourly activity
	const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
	const projHourlyRows = db
		.prepare(`
		SELECT s.time_start FROM sessions s
		WHERE s.project_id = ? AND s.time_start IS NOT NULL
	`)
		.all(projectId) as Array<{ time_start: string }>;

	const projHourlyActivity: Record<string, number> = {};
	for (const row of projHourlyRows) {
		const d = new Date(row.time_start);
		const dayName = dayNames[d.getDay()];
		const hour = String(d.getHours()).padStart(2, "0");
		const key = `${dayName}-${hour}`;
		projHourlyActivity[key] = (projHourlyActivity[key] ?? 0) + 1;
	}

	// Top files
	const projFileRows = db
		.prepare(`
		SELECT ft.file_path, COUNT(*) as count
		FROM files_touched ft
		JOIN sessions s ON s.session_id = ft.session_id
		WHERE s.project_id = ?
		GROUP BY ft.file_path ORDER BY count DESC LIMIT 20
	`)
		.all(projectId) as Array<{ file_path: string; count: number }>;

	const projTopFiles = projFileRows.map((r) => ({
		path: r.file_path,
		count: r.count,
	}));

	// Daily activity
	const projDailyRows = db
		.prepare(`
		SELECT substr(s.time_end, 1, 10) as day, COUNT(*) as count
		FROM sessions s
		WHERE s.project_id = ? AND s.time_end IS NOT NULL
		GROUP BY day ORDER BY day
	`)
		.all(projectId) as Array<{ day: string; count: number }>;

	const projDailyActivity: Record<string, number> = {};
	for (const row of projDailyRows) {
		projDailyActivity[row.day] = row.count;
	}

	return {
		projectId,
		projectPath: project.path,
		sessionCount,
		analytics: {
			duration,
			messagesByType,
			tokenBreakdown,
			toolCallsByName,
			stopReasons,
			cacheEfficiency: projCacheEfficiency,
		},
		totalCost,
		costOverTime,
		toolUsage: projToolUsage,
		hourlyActivity: projHourlyActivity,
		topFiles: projTopFiles,
		dailyActivity: projDailyActivity,
	};
}

// --- Plans ---

export function queryPlans(db: Database): Array<{
	slug: string;
	title: string;
	sessions: { sessionId: string; project: string; lastActivity: string }[];
	lastUsed: string | null;
}> {
	const slugRows = db
		.prepare("SELECT DISTINCT slug FROM plan_snapshots ORDER BY slug")
		.all() as Array<{ slug: string }>;

	const plans = slugRows.map((row) => {
		const latestPlan = db
			.prepare(
				"SELECT content FROM plan_snapshots WHERE slug = ? ORDER BY captured_at DESC LIMIT 1",
			)
			.get(row.slug) as { content: string } | null;

		// Extract title from first markdown heading or slug
		const content = latestPlan?.content ?? "";
		const titleMatch = content.match(/^#\s+(.+)/m);
		const title = titleMatch ? titleMatch[1] : row.slug;

		// Find sessions using this slug
		const sessionRows = db
			.prepare(`
			SELECT s.session_id, p.name as project_name, s.time_end
			FROM sessions s
			JOIN projects p ON p.encoded_name = s.project_id
			WHERE s.slug = ?
			ORDER BY s.time_end DESC NULLS LAST
		`)
			.all(row.slug) as Array<{
			session_id: string;
			project_name: string;
			time_end: string | null;
		}>;

		const sessions = sessionRows.map((sr) => ({
			sessionId: sr.session_id,
			project: sr.project_name,
			lastActivity: sr.time_end ?? "",
		}));

		const lastUsed =
			sessions.length > 0 && sessions[0].lastActivity
				? sessions.reduce(
						(latest, s) => (s.lastActivity > latest ? s.lastActivity : latest),
						sessions[0].lastActivity,
					)
				: null;

		return { slug: row.slug, title, sessions, lastUsed };
	});

	// Sort: recently used first, orphans last
	plans.sort((a, b) => {
		if (a.lastUsed && b.lastUsed) return b.lastUsed.localeCompare(a.lastUsed);
		if (a.lastUsed) return -1;
		if (b.lastUsed) return 1;
		return a.slug.localeCompare(b.slug);
	});

	return plans;
}

export function queryPlanBySlug(
	db: Database,
	slug: string,
): { slug: string; title: string; content: string } | null {
	const row = db
		.prepare(
			"SELECT slug, content FROM plan_snapshots WHERE slug = ? ORDER BY captured_at DESC LIMIT 1",
		)
		.get(slug) as { slug: string; content: string } | null;
	if (!row) return null;
	const titleMatch = row.content.match(/^#\s+(.+)/m);
	return {
		slug: row.slug,
		title: titleMatch?.[1] ?? slug,
		content: row.content,
	};
}

export function queryPlanHistory(
	db: Database,
	slug: string,
): Array<{
	id: number;
	content: string;
	captured_at: string;
	session_id: string | null;
}> {
	return db
		.prepare(
			"SELECT id, content, captured_at, session_id FROM plan_snapshots WHERE slug = ? ORDER BY captured_at DESC",
		)
		.all(slug) as Array<{
		id: number;
		content: string;
		captured_at: string;
		session_id: string | null;
	}>;
}

// --- Context ---

export function queryContextForSession(
	db: Database,
	sessionId: string,
): {
	memories: Array<{
		scope: string;
		path: string;
		filename: string;
		content: string;
	}>;
	rules: Array<{
		scope: string;
		path: string;
		filename: string;
		content: string;
	}>;
} {
	const session = db
		.prepare("SELECT project_id FROM sessions WHERE session_id = ?")
		.get(sessionId) as { project_id: string } | null;

	if (!session) return { memories: [], rules: [] };

	const rows = db
		.prepare(
			`
		SELECT cs.scope, cs.path, cs.content
		FROM context_snapshots cs
		INNER JOIN (
			SELECT path, MAX(id) as max_id
			FROM context_snapshots
			WHERE project_id = ? OR project_id IS NULL
			GROUP BY path
		) latest ON cs.id = latest.max_id
		ORDER BY cs.scope, cs.path
	`,
		)
		.all(session.project_id) as Array<{
		scope: string;
		path: string;
		content: string;
	}>;

	const memories: Array<{
		scope: string;
		path: string;
		filename: string;
		content: string;
	}> = [];
	const rules: Array<{
		scope: string;
		path: string;
		filename: string;
		content: string;
	}> = [];

	for (const row of rows) {
		const filename = row.path.split("/").pop() ?? row.path;
		const item = {
			scope: row.scope,
			path: row.path,
			filename,
			content: row.content,
		};
		if (row.scope.includes("rules")) {
			rules.push(item);
		} else {
			memories.push(item);
		}
	}

	return { memories, rules };
}

export function queryAllContext(db: Database): Array<{
	path: string;
	filename: string;
	scope: string;
	content: string;
	estimatedTokens: number;
	projects: Array<{ name: string; id: string; sessionCount: number }>;
	totalSessions: number;
}> {
	const rows = db
		.prepare(
			`
		SELECT cs.scope, cs.path, cs.content, cs.project_id
		FROM context_snapshots cs
		INNER JOIN (
			SELECT path, MAX(id) as max_id
			FROM context_snapshots
			GROUP BY path
		) latest ON cs.id = latest.max_id
		ORDER BY cs.scope, cs.path
	`,
		)
		.all() as Array<{
		scope: string;
		path: string;
		content: string;
		project_id: string | null;
	}>;

	const fileMap = new Map<
		string,
		{
			path: string;
			filename: string;
			scope: string;
			content: string;
			projectIds: Set<string>;
		}
	>();

	for (const row of rows) {
		const existing = fileMap.get(row.path);
		if (existing) {
			if (row.project_id) existing.projectIds.add(row.project_id);
		} else {
			const projectIds = new Set<string>();
			if (row.project_id) projectIds.add(row.project_id);
			fileMap.set(row.path, {
				path: row.path,
				filename: row.path.split("/").pop() ?? row.path,
				scope: row.scope,
				content: row.content,
				projectIds,
			});
		}
	}

	return [...fileMap.values()].map((f) => {
		const projects: Array<{
			name: string;
			id: string;
			sessionCount: number;
		}> = [];
		for (const pid of f.projectIds) {
			const proj = db
				.prepare(
					"SELECT name, encoded_name, (SELECT COUNT(*) FROM sessions WHERE project_id = ?) as session_count FROM projects WHERE encoded_name = ?",
				)
				.get(pid, pid) as {
				name: string;
				encoded_name: string;
				session_count: number;
			} | null;
			if (proj) {
				projects.push({
					name: proj.name,
					id: proj.encoded_name,
					sessionCount: proj.session_count,
				});
			}
		}
		if (f.projectIds.size === 0) {
			const allProjects = db
				.prepare(
					"SELECT name, encoded_name, (SELECT COUNT(*) FROM sessions WHERE project_id = p.encoded_name) as session_count FROM projects p",
				)
				.all() as Array<{
				name: string;
				encoded_name: string;
				session_count: number;
			}>;
			for (const p of allProjects) {
				projects.push({
					name: p.name,
					id: p.encoded_name,
					sessionCount: p.session_count,
				});
			}
		}
		return {
			path: f.path,
			filename: f.filename,
			scope: f.scope,
			content: f.content,
			estimatedTokens: Math.ceil(f.content.length / 4),
			projects,
			totalSessions: projects.reduce((sum, p) => sum + p.sessionCount, 0),
		};
	});
}

// --- Tasks ---

export function queryTasksForTeam(db: Database, teamName: string): TaskItem[] {
	const rows = db
		.prepare(
			`
		SELECT file_path, content
		FROM file_snapshots
		WHERE file_type = 'task'
		AND file_path LIKE '%/tasks/' || ? || '/%'
		ORDER BY id DESC
	`,
		)
		.all(teamName) as Array<{ file_path: string; content: string }>;

	const seen = new Set<string>();
	const tasks: TaskItem[] = [];
	for (const row of rows) {
		if (seen.has(row.file_path)) continue;
		seen.add(row.file_path);
		try {
			tasks.push(JSON.parse(row.content) as TaskItem);
		} catch {
			/* skip invalid JSON */
		}
	}
	return tasks;
}

export function queryTasks(db: Database): Array<{
	teamName: string;
	tasks: TaskItem[];
	sessions: { sessionId: string; project: string; lastActivity: string }[];
	taskCount: number;
	completedCount: number;
	lastUsed: string | null;
}> {
	// Get latest task snapshots per file_path
	const taskRows = db
		.prepare(
			`
		SELECT fs.file_path, fs.content
		FROM file_snapshots fs
		INNER JOIN (
			SELECT file_path, MAX(id) as max_id
			FROM file_snapshots
			WHERE file_type = 'task'
			GROUP BY file_path
		) latest ON fs.id = latest.max_id
	`,
		)
		.all() as Array<{ file_path: string; content: string }>;

	const teamMap = new Map<string, TaskItem[]>();
	for (const row of taskRows) {
		const match = row.file_path.match(/\/tasks\/([^/]+)\//);
		if (!match) continue;
		const teamName = match[1];
		try {
			const task = JSON.parse(row.content) as TaskItem;
			if (!teamMap.has(teamName)) teamMap.set(teamName, []);
			teamMap.get(teamName)!.push(task);
		} catch {
			/* skip */
		}
	}

	// Also include teams from sessions that don't have file_snapshots
	const dbTeamRows = db
		.prepare(
			"SELECT DISTINCT team_name FROM sessions WHERE team_name IS NOT NULL",
		)
		.all() as Array<{ team_name: string }>;
	for (const r of dbTeamRows) {
		if (!teamMap.has(r.team_name)) teamMap.set(r.team_name, []);
	}

	const teams = [...teamMap.entries()].map(([teamName, tasks]) => {
		const sessionRows = db
			.prepare(
				`
			SELECT s.session_id, p.name as project_name, s.time_end
			FROM sessions s
			JOIN projects p ON p.encoded_name = s.project_id
			WHERE s.team_name = ?
			ORDER BY s.time_end DESC NULLS LAST
		`,
			)
			.all(teamName) as Array<{
			session_id: string;
			project_name: string;
			time_end: string | null;
		}>;

		const sessions = sessionRows.map((sr) => ({
			sessionId: sr.session_id,
			project: sr.project_name,
			lastActivity: sr.time_end ?? "",
		}));

		const lastUsed =
			sessions.length > 0 && sessions[0].lastActivity
				? sessions.reduce(
						(latest, s) => (s.lastActivity > latest ? s.lastActivity : latest),
						sessions[0].lastActivity,
					)
				: null;

		return {
			teamName,
			tasks,
			sessions,
			taskCount: tasks.length,
			completedCount: tasks.filter((t) => t.status === "completed").length,
			lastUsed,
		};
	});

	// Sort: recently used first, orphans last
	teams.sort((a, b) => {
		if (a.lastUsed && b.lastUsed) return b.lastUsed.localeCompare(a.lastUsed);
		if (a.lastUsed) return -1;
		if (b.lastUsed) return 1;
		return a.teamName.localeCompare(b.teamName);
	});

	return teams;
}

// --- Search (FTS5) ---

export function querySearch(
	db: Database,
	params: {
		q: string;
		project?: string;
		role?: string;
		since?: string;
		limit?: number;
		offset?: number;
	},
): PaginatedResponse<SearchResult> {
	const limit = Math.min(params.limit ?? 20, 100);
	const offset = params.offset ?? 0;

	const conditions: string[] = ["messages_fts MATCH ?"];
	const queryParams: (string | number)[] = [params.q];

	if (params.project) {
		conditions.push("s.project_id = ?");
		queryParams.push(params.project);
	}
	if (params.role) {
		conditions.push("m.type = ?");
		queryParams.push(params.role);
	}
	if (params.since) {
		conditions.push("m.timestamp >= ?");
		queryParams.push(params.since);
	}

	const where = conditions.join(" AND ");

	const countRow = db
		.prepare(`
		SELECT COUNT(*) as cnt
		FROM messages_fts
		JOIN messages m ON m.id = messages_fts.rowid
		JOIN sessions s ON s.session_id = m.session_id
		WHERE ${where}
	`)
		.get(...queryParams) as { cnt: number };
	const total = countRow.cnt;

	const rows = db
		.prepare(`
		SELECT m.uuid, m.session_id, m.type, m.timestamp,
			snippet(messages_fts, 0, '<mark>', '</mark>', '...', 40) as excerpt,
			rank
		FROM messages_fts
		JOIN messages m ON m.id = messages_fts.rowid
		JOIN sessions s ON s.session_id = m.session_id
		WHERE ${where}
		ORDER BY rank
		LIMIT ? OFFSET ?
	`)
		.all(...queryParams, limit, offset) as Array<{
		uuid: string;
		session_id: string;
		type: string;
		timestamp: string;
		excerpt: string;
		rank: number;
	}>;

	return {
		data: rows.map((r) => ({
			uuid: r.uuid,
			sessionId: r.session_id,
			type: r.type,
			timestamp: r.timestamp,
			excerpt: r.excerpt,
			rank: r.rank,
		})),
		meta: { total, limit, offset, hasMore: offset + limit < total },
	};
}

// --- Ingestion status ---

export function queryIngestionStatus(db: Database): {
	totalSessions: number;
	totalMessages: number;
	isComplete: boolean;
	lastSynced: string | null;
} {
	const sessionRow = db
		.prepare("SELECT COUNT(*) as cnt FROM sessions")
		.get() as { cnt: number };

	const messageRow = db
		.prepare("SELECT COUNT(*) as cnt FROM messages")
		.get() as { cnt: number };

	const lastSyncedRow = db
		.prepare("SELECT MAX(last_synced) as last_synced FROM sessions")
		.get() as { last_synced: string | null };

	return {
		totalSessions: sessionRow.cnt,
		totalMessages: messageRow.cnt,
		isComplete: sessionRow.cnt > 0,
		lastSynced: lastSyncedRow.last_synced,
	};
}

// --- History ---

export function queryHistoryEntries(
	db: Database,
	filters?: {
		project?: string;
		after?: string;
		limit?: number;
	},
): Array<{
	sessionId: string;
	display: string;
	project: string;
	timestamp: number;
}> {
	const conditions: string[] = [];
	const params: (string | number)[] = [];

	if (filters?.project) {
		conditions.push("project = ?");
		params.push(filters.project);
	}
	if (filters?.after) {
		conditions.push("timestamp > ?");
		params.push(new Date(filters.after).getTime());
	}

	const where =
		conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
	const limit = filters?.limit ?? 50;

	const rows = db
		.prepare(`
		SELECT session_id, display, project, timestamp
		FROM history_entries
		${where}
		ORDER BY timestamp DESC
		LIMIT ?
	`)
		.all(...params, limit) as Array<{
		session_id: string;
		display: string | null;
		project: string | null;
		timestamp: number;
	}>;

	return rows.map((r) => ({
		sessionId: r.session_id,
		display: r.display ?? "",
		project: r.project ?? "",
		timestamp: r.timestamp,
	}));
}

// --- File Snapshots ---

export interface FileSnapshotRow {
	id: number;
	filePath: string;
	fileType: string;
	content: string;
	contentHash: string;
	sessionId: string | null;
	capturedAt: string;
}

export function queryFileSnapshots(
	db: Database,
	filePath: string,
	options?: { limit?: number },
): FileSnapshotRow[] {
	const limit = options?.limit ?? 10;
	const rows = db
		.prepare(
			`SELECT id, file_path, file_type, content, content_hash, session_id, captured_at
			FROM file_snapshots
			WHERE file_path = ?
			ORDER BY captured_at DESC, id DESC
			LIMIT ?`,
		)
		.all(filePath, limit) as Array<{
		id: number;
		file_path: string;
		file_type: string;
		content: string;
		content_hash: string;
		session_id: string | null;
		captured_at: string;
	}>;

	return rows.map((r) => ({
		id: r.id,
		filePath: r.file_path,
		fileType: r.file_type,
		content: r.content,
		contentHash: r.content_hash,
		sessionId: r.session_id,
		capturedAt: r.captured_at,
	}));
}

export function queryFileSnapshotsByType(
	db: Database,
	fileType: string,
	options?: { limit?: number; offset?: number },
): PaginatedResponse<Omit<FileSnapshotRow, "content">> {
	const limit = Math.min(options?.limit ?? 50, 200);
	const offset = options?.offset ?? 0;

	const countRow = db
		.prepare(
			"SELECT COUNT(DISTINCT file_path) as cnt FROM file_snapshots WHERE file_type = ?",
		)
		.get(fileType) as { cnt: number };

	const rows = db
		.prepare(
			`SELECT fs.id, fs.file_path, fs.file_type, fs.content_hash, fs.session_id, fs.captured_at
			FROM file_snapshots fs
			INNER JOIN (
				SELECT file_path, MAX(id) as latest_id
				FROM file_snapshots
				WHERE file_type = ?
				GROUP BY file_path
			) latest ON fs.id = latest.latest_id
			ORDER BY fs.captured_at DESC
			LIMIT ? OFFSET ?`,
		)
		.all(fileType, limit, offset) as Array<{
		id: number;
		file_path: string;
		file_type: string;
		content_hash: string;
		session_id: string | null;
		captured_at: string;
	}>;

	return {
		data: rows.map((r) => ({
			id: r.id,
			filePath: r.file_path,
			fileType: r.file_type,
			contentHash: r.content_hash,
			sessionId: r.session_id,
			capturedAt: r.captured_at,
		})),
		meta: {
			total: countRow.cnt,
			limit,
			offset,
			hasMore: offset + limit < countRow.cnt,
		},
	};
}

export function queryFileSnapshotDiff(
	db: Database,
	filePath: string,
): { before: string | null; after: string } | null {
	const rows = db
		.prepare(
			`SELECT content FROM file_snapshots
			WHERE file_path = ?
			ORDER BY captured_at DESC, id DESC
			LIMIT 2`,
		)
		.all(filePath) as Array<{ content: string }>;

	if (rows.length === 0) return null;
	return {
		before: rows.length > 1 ? rows[1].content : null,
		after: rows[0].content,
	};
}

// --- Subagents ---

export function querySubagentsForSession(db: Database, sessionId: string) {
	const sessions = db
		.prepare(`
		WITH RECURSIVE descendants AS (
			SELECT session_id, parent_session_id, 1 as depth
			FROM sessions
			WHERE parent_session_id = ?

			UNION ALL

			SELECT s.session_id, s.parent_session_id, d.depth + 1
			FROM sessions s
			INNER JOIN descendants d ON s.parent_session_id = d.session_id
			WHERE d.depth < 10
		)
		SELECT
			s.session_id, s.parent_session_id, s.agent_name, s.agent_type,
			s.input_tokens, s.output_tokens, s.cache_read_tokens,
			s.message_count, s.time_start, s.time_end, s.models,
			sa.description, sa.mode, sa.tool_use_id, sa.time_spawned,
			d.depth
		FROM descendants d
		JOIN sessions s ON s.session_id = d.session_id
		LEFT JOIN subagents sa ON sa.session_id = s.session_id
		ORDER BY d.depth ASC, s.time_start ASC
	`)
		.all(sessionId);

	const unlinked = db
		.prepare(`
		SELECT * FROM subagents
		WHERE parent_session_id = ? AND session_id IS NULL
	`)
		.all(sessionId);

	return { sessions, unlinked };
}

export function queryAllAgents(db: Database) {
	const byType = db
		.prepare(`
		SELECT agent_type, COUNT(*) as count,
		       SUM(input_tokens) as total_input,
		       SUM(output_tokens) as total_output,
		       MAX(time_start) as last_used
		FROM sessions WHERE parent_session_id IS NOT NULL
		GROUP BY agent_type ORDER BY count DESC
	`)
		.all();

	const recent = db
		.prepare(`
		SELECT s.session_id, s.parent_session_id, s.agent_name, s.agent_type,
		       s.input_tokens, s.output_tokens, s.message_count,
		       s.time_start, s.time_end, s.models,
		       p.name as project_name
		FROM sessions s
		LEFT JOIN sessions ps ON ps.session_id = s.parent_session_id
		LEFT JOIN projects p ON p.encoded_name = ps.project_id
		WHERE s.parent_session_id IS NOT NULL
		ORDER BY s.time_start DESC LIMIT 100
	`)
		.all();

	const totalCount = db
		.prepare(
			"SELECT COUNT(*) as cnt FROM sessions WHERE parent_session_id IS NOT NULL",
		)
		.get() as { cnt: number } | null;

	return { byType, recent, totalCount: totalCount?.cnt ?? 0 };
}

export function querySessionHasAgents(
	db: Database,
	sessionId: string,
): boolean {
	const row = db
		.prepare("SELECT 1 FROM sessions WHERE parent_session_id = ? LIMIT 1")
		.get(sessionId);
	return !!row;
}

// --- Memory System ---

export function queryMemoryRuns(
	db: Database,
	filters?: {
		projectId?: string;
		runType?: string;
		sessionId?: string;
		limit?: number;
		offset?: number;
	},
): PaginatedResponse<{
	runId: string;
	sessionId: string | null;
	projectId: string;
	runType: string;
	status: string;
	model: string | null;
	budgetUsd: number;
	costUsd: number;
	inputTokens: number;
	outputTokens: number;
	numTurns: number;
	durationMs: number;
	error: string | null;
	startedAt: string;
	completedAt: string | null;
}> {
	const conditions: string[] = [];
	const params: (string | number)[] = [];

	if (filters?.projectId) {
		conditions.push("project_id = ?");
		params.push(filters.projectId);
	}
	if (filters?.runType) {
		conditions.push("run_type = ?");
		params.push(filters.runType);
	}
	if (filters?.sessionId) {
		conditions.push("session_id = ?");
		params.push(filters.sessionId);
	}

	const where =
		conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
	const limit = Math.min(filters?.limit ?? 50, 200);
	const offset = filters?.offset ?? 0;

	const countRow = db
		.prepare(`SELECT COUNT(*) as cnt FROM memory_runs ${where}`)
		.get(...params) as { cnt: number };

	const rows = db
		.prepare(
			`SELECT run_id, session_id, project_id, run_type, status, model,
				budget_usd, cost_usd, input_tokens, output_tokens, num_turns,
				duration_ms, error, started_at, completed_at
			FROM memory_runs ${where}
			ORDER BY started_at DESC
			LIMIT ? OFFSET ?`,
		)
		.all(...params, limit, offset) as Array<{
		run_id: string;
		session_id: string | null;
		project_id: string;
		run_type: string;
		status: string;
		model: string | null;
		budget_usd: number;
		cost_usd: number;
		input_tokens: number;
		output_tokens: number;
		num_turns: number;
		duration_ms: number;
		error: string | null;
		started_at: string;
		completed_at: string | null;
	}>;

	return {
		data: rows.map((r) => ({
			runId: r.run_id,
			sessionId: r.session_id,
			projectId: r.project_id,
			runType: r.run_type,
			status: r.status,
			model: r.model,
			budgetUsd: r.budget_usd,
			costUsd: r.cost_usd,
			inputTokens: r.input_tokens,
			outputTokens: r.output_tokens,
			numTurns: r.num_turns,
			durationMs: r.duration_ms,
			error: r.error,
			startedAt: r.started_at,
			completedAt: r.completed_at,
		})),
		meta: {
			total: countRow.cnt,
			limit,
			offset,
			hasMore: offset + limit < countRow.cnt,
		},
	};
}

export function queryMemoryRunDetail(
	db: Database,
	runId: string,
): {
	runId: string;
	sessionId: string | null;
	projectId: string;
	runType: string;
	status: string;
	model: string | null;
	prompt: string;
	budgetUsd: number;
	costUsd: number;
	inputTokens: number;
	outputTokens: number;
	numTurns: number;
	durationMs: number;
	eventsJson: unknown[] | null;
	resultJson: unknown | null;
	error: string | null;
	startedAt: string;
	completedAt: string | null;
} | null {
	const row = db
		.prepare(
			`SELECT run_id, session_id, project_id, run_type, status, model, prompt,
				budget_usd, cost_usd, input_tokens, output_tokens, num_turns,
				duration_ms, events_json, result_json, error, started_at, completed_at
			FROM memory_runs WHERE run_id = ?`,
		)
		.get(runId) as {
		run_id: string;
		session_id: string | null;
		project_id: string;
		run_type: string;
		status: string;
		model: string | null;
		prompt: string;
		budget_usd: number;
		cost_usd: number;
		input_tokens: number;
		output_tokens: number;
		num_turns: number;
		duration_ms: number;
		events_json: string | null;
		result_json: string | null;
		error: string | null;
		started_at: string;
		completed_at: string | null;
	} | null;

	if (!row) return null;

	let eventsJson: unknown[] | null = null;
	let resultJson: unknown | null = null;
	try {
		if (row.events_json) eventsJson = JSON.parse(row.events_json);
	} catch {
		/* ignore */
	}
	try {
		if (row.result_json) resultJson = JSON.parse(row.result_json);
	} catch {
		/* ignore */
	}

	return {
		runId: row.run_id,
		sessionId: row.session_id,
		projectId: row.project_id,
		runType: row.run_type,
		status: row.status,
		model: row.model,
		prompt: row.prompt,
		budgetUsd: row.budget_usd,
		costUsd: row.cost_usd,
		inputTokens: row.input_tokens,
		outputTokens: row.output_tokens,
		numTurns: row.num_turns,
		durationMs: row.duration_ms,
		eventsJson,
		resultJson,
		error: row.error,
		startedAt: row.started_at,
		completedAt: row.completed_at,
	};
}

export function queryObservations(
	db: Database,
	filters?: {
		projectId?: string;
		category?: string;
		status?: string;
		limit?: number;
		offset?: number;
	},
): PaginatedResponse<{
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
	status: string;
	promotedToMemoryId: number | null;
	createdAt: string;
	updatedAt: string;
}> {
	const conditions: string[] = [];
	const params: (string | number)[] = [];

	if (filters?.projectId) {
		conditions.push("project_id = ?");
		params.push(filters.projectId);
	}
	if (filters?.category) {
		conditions.push("category = ?");
		params.push(filters.category);
	}
	if (filters?.status) {
		conditions.push("status = ?");
		params.push(filters.status);
	}

	const where =
		conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
	const limit = Math.min(filters?.limit ?? 50, 200);
	const offset = filters?.offset ?? 0;

	const countRow = db
		.prepare(`SELECT COUNT(*) as cnt FROM observations ${where}`)
		.get(...params) as { cnt: number };

	const rows = db
		.prepare(
			`SELECT id, project_id, category, content, key, evidence, suggested_memory, count,
				first_seen_run_id, last_seen_run_id, first_seen_session_id,
				last_seen_session_id, sessions_since_last_seen, status,
				promoted_to_memory_id, created_at, updated_at
			FROM observations ${where}
			ORDER BY updated_at DESC
			LIMIT ? OFFSET ?`,
		)
		.all(...params, limit, offset) as Array<{
		id: number;
		project_id: string;
		category: string;
		content: string;
		key: string;
		evidence: string | null;
		count: number;
		first_seen_run_id: string;
		last_seen_run_id: string;
		first_seen_session_id: string | null;
		last_seen_session_id: string | null;
		sessions_since_last_seen: number;
		status: string;
		promoted_to_memory_id: number | null;
		created_at: string;
		updated_at: string;
		suggested_memory: string | null;
	}>;

	return {
		data: rows.map((r) => ({
			id: r.id,
			projectId: r.project_id,
			category: r.category,
			content: r.content,
			key: r.key,
			evidence: r.evidence,
			suggestedMemory: r.suggested_memory,
			count: r.count,
			firstSeenRunId: r.first_seen_run_id,
			lastSeenRunId: r.last_seen_run_id,
			firstSeenSessionId: r.first_seen_session_id,
			lastSeenSessionId: r.last_seen_session_id,
			sessionsSinceLastSeen: r.sessions_since_last_seen,
			status: r.status,
			promotedToMemoryId: r.promoted_to_memory_id,
			createdAt: r.created_at,
			updatedAt: r.updated_at,
		})),
		meta: {
			total: countRow.cnt,
			limit,
			offset,
			hasMore: offset + limit < countRow.cnt,
		},
	};
}

export function queryMemories(
	db: Database,
	filters?: {
		projectId?: string;
		limit?: number;
		offset?: number;
	},
): PaginatedResponse<{
	id: number;
	projectId: string;
	category: string;
	content: string;
	sourceObservationIds: number[] | null;
	confidence: number;
	status: string;
	approvedAt: string;
	createdAt: string;
}> {
	const conditions: string[] = [];
	const params: (string | number)[] = [];

	if (filters?.projectId) {
		conditions.push("project_id = ?");
		params.push(filters.projectId);
	}

	const where =
		conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
	const limit = Math.min(filters?.limit ?? 50, 200);
	const offset = filters?.offset ?? 0;

	const countRow = db
		.prepare(`SELECT COUNT(*) as cnt FROM memories ${where}`)
		.get(...params) as { cnt: number };

	const rows = db
		.prepare(
			`SELECT id, project_id, category, content, source_observation_ids,
				confidence, status, approved_at, created_at
			FROM memories ${where}
			ORDER BY created_at DESC
			LIMIT ? OFFSET ?`,
		)
		.all(...params, limit, offset) as Array<{
		id: number;
		project_id: string;
		category: string;
		content: string;
		source_observation_ids: string | null;
		confidence: number;
		status: string;
		approved_at: string;
		created_at: string;
	}>;

	return {
		data: rows.map((r) => {
			let sourceObservationIds: number[] | null = null;
			try {
				if (r.source_observation_ids)
					sourceObservationIds = JSON.parse(r.source_observation_ids);
			} catch {
				/* ignore */
			}
			return {
				id: r.id,
				projectId: r.project_id,
				category: r.category,
				content: r.content,
				sourceObservationIds,
				confidence: r.confidence,
				status: r.status,
				approvedAt: r.approved_at,
				createdAt: r.created_at,
			};
		}),
		meta: {
			total: countRow.cnt,
			limit,
			offset,
			hasMore: offset + limit < countRow.cnt,
		},
	};
}

export function queryMemoryStats(
	db: Database,
	projectId?: string,
): {
	totalObservations: number;
	activeObservations: number;
	totalMemories: number;
	totalRuns: number;
} {
	const where = projectId ? "WHERE project_id = ?" : "";
	const params = projectId ? [projectId] : [];

	const obsTotal = db
		.prepare(`SELECT COUNT(*) as cnt FROM observations ${where}`)
		.get(...params) as { cnt: number };

	const obsActive = db
		.prepare(
			`SELECT COUNT(*) as cnt FROM observations ${where ? where + " AND" : "WHERE"} status = 'active'`,
		)
		.get(...params) as { cnt: number };

	const memTotal = db
		.prepare(`SELECT COUNT(*) as cnt FROM memories ${where}`)
		.get(...params) as { cnt: number };

	const runsTotal = db
		.prepare(`SELECT COUNT(*) as cnt FROM memory_runs ${where}`)
		.get(...params) as { cnt: number };

	return {
		totalObservations: obsTotal.cnt,
		activeObservations: obsActive.cnt,
		totalMemories: memTotal.cnt,
		totalRuns: runsTotal.cnt,
	};
}

export function insertMemoryRun(
	db: Database,
	run: {
		runId: string;
		sessionId?: string | null;
		projectId: string;
		runType: string;
		status?: string;
		model?: string | null;
		prompt: string;
		budgetUsd?: number;
		startedAt: string;
	},
): void {
	db.prepare(
		`INSERT INTO memory_runs (run_id, session_id, project_id, run_type, status, model, prompt, budget_usd, started_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
	).run(
		run.runId,
		run.sessionId ?? null,
		run.projectId,
		run.runType,
		run.status ?? "running",
		run.model ?? null,
		run.prompt,
		run.budgetUsd ?? 3.0,
		run.startedAt,
	);
}

export function updateMemoryRun(
	db: Database,
	runId: string,
	updates: {
		status?: string;
		model?: string;
		costUsd?: number;
		inputTokens?: number;
		outputTokens?: number;
		numTurns?: number;
		durationMs?: number;
		eventsJson?: string;
		resultJson?: string;
		error?: string;
		completedAt?: string;
	},
): void {
	const sets: string[] = [];
	const params: (string | number | null)[] = [];

	if (updates.status !== undefined) {
		sets.push("status = ?");
		params.push(updates.status);
	}
	if (updates.model !== undefined) {
		sets.push("model = ?");
		params.push(updates.model);
	}
	if (updates.costUsd !== undefined) {
		sets.push("cost_usd = ?");
		params.push(updates.costUsd);
	}
	if (updates.inputTokens !== undefined) {
		sets.push("input_tokens = ?");
		params.push(updates.inputTokens);
	}
	if (updates.outputTokens !== undefined) {
		sets.push("output_tokens = ?");
		params.push(updates.outputTokens);
	}
	if (updates.numTurns !== undefined) {
		sets.push("num_turns = ?");
		params.push(updates.numTurns);
	}
	if (updates.durationMs !== undefined) {
		sets.push("duration_ms = ?");
		params.push(updates.durationMs);
	}
	if (updates.eventsJson !== undefined) {
		sets.push("events_json = ?");
		params.push(updates.eventsJson);
	}
	if (updates.resultJson !== undefined) {
		sets.push("result_json = ?");
		params.push(updates.resultJson);
	}
	if (updates.error !== undefined) {
		sets.push("error = ?");
		params.push(updates.error);
	}
	if (updates.completedAt !== undefined) {
		sets.push("completed_at = ?");
		params.push(updates.completedAt);
	}

	if (sets.length === 0) return;

	db.prepare(`UPDATE memory_runs SET ${sets.join(", ")} WHERE run_id = ?`).run(
		...params,
		runId,
	);
}

export function insertObservation(
	db: Database,
	obs: {
		projectId: string;
		category: string;
		content: string;
		key: string;
		evidence?: string | null;
		suggestedMemory?: string | null;
		runId: string;
		sessionId?: string | null;
	},
): number {
	const now = new Date().toISOString();
	db.prepare(
		`INSERT INTO observations (project_id, category, content, key, evidence, suggested_memory, count, first_seen_run_id, last_seen_run_id, first_seen_session_id, last_seen_session_id, status, created_at, updated_at)
			VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, 'active', ?, ?)
			ON CONFLICT(project_id, key) DO UPDATE SET
				count = count + 1,
				content = excluded.content,
				suggested_memory = excluded.suggested_memory,
				last_seen_run_id = excluded.last_seen_run_id,
				last_seen_session_id = excluded.last_seen_session_id,
				sessions_since_last_seen = 0,
				updated_at = excluded.updated_at`,
	).run(
		obs.projectId,
		obs.category,
		obs.content,
		obs.key,
		obs.evidence ?? null,
		obs.suggestedMemory ?? null,
		obs.runId,
		obs.runId,
		obs.sessionId ?? null,
		obs.sessionId ?? null,
		now,
		now,
	);
	// Return the id of the inserted/updated row
	const row = db
		.prepare("SELECT id FROM observations WHERE project_id = ? AND key = ?")
		.get(obs.projectId, obs.key) as { id: number };
	return row.id;
}

export function updateObservationReinforcement(
	db: Database,
	id: number,
	runId: string,
	sessionId?: string | null,
	suggestedMemory?: string | null,
): void {
	const now = new Date().toISOString();
	if (suggestedMemory !== undefined) {
		db.prepare(
			`UPDATE observations SET
				count = count + 1,
				last_seen_run_id = ?,
				last_seen_session_id = COALESCE(?, last_seen_session_id),
				sessions_since_last_seen = 0,
				suggested_memory = ?,
				updated_at = ?
			WHERE id = ?`,
		).run(runId, sessionId ?? null, suggestedMemory, now, id);
	} else {
		db.prepare(
			`UPDATE observations SET
				count = count + 1,
				last_seen_run_id = ?,
				last_seen_session_id = COALESCE(?, last_seen_session_id),
				sessions_since_last_seen = 0,
				updated_at = ?
			WHERE id = ?`,
		).run(runId, sessionId ?? null, now, id);
	}
}

export function incrementStaleness(
	db: Database,
	projectId: string,
	excludeIds: number[],
): void {
	if (excludeIds.length === 0) {
		db.prepare(
			`UPDATE observations SET sessions_since_last_seen = sessions_since_last_seen + 1
			WHERE project_id = ? AND status = 'active'`,
		).run(projectId);
	} else {
		const placeholders = excludeIds.map(() => "?").join(",");
		db.prepare(
			`UPDATE observations SET sessions_since_last_seen = sessions_since_last_seen + 1
			WHERE project_id = ? AND status = 'active' AND id NOT IN (${placeholders})`,
		).run(projectId, ...excludeIds);
	}
}

export function updateObservationStatus(
	db: Database,
	id: number,
	status: string,
	promotedToMemoryId?: number,
): void {
	const now = new Date().toISOString();
	if (promotedToMemoryId !== undefined) {
		db.prepare(
			"UPDATE observations SET status = ?, promoted_to_memory_id = ?, updated_at = ? WHERE id = ?",
		).run(status, promotedToMemoryId, now, id);
	} else {
		db.prepare(
			"UPDATE observations SET status = ?, updated_at = ? WHERE id = ?",
		).run(status, now, id);
	}
}

export function insertMemory(
	db: Database,
	memory: {
		projectId: string;
		category: string | string[];
		content: string;
		sourceObservationIds?: number[];
		confidence?: number;
		status?: string;
	},
): number {
	const categoryStr = Array.isArray(memory.category)
		? [...new Set(memory.category)].join(",")
		: memory.category;
	const now = new Date().toISOString();
	const result = db
		.prepare(
			`INSERT INTO memories (project_id, category, content, source_observation_ids, confidence, status, approved_at, created_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		)
		.run(
			memory.projectId,
			categoryStr,
			memory.content,
			memory.sourceObservationIds
				? JSON.stringify(memory.sourceObservationIds)
				: null,
			memory.confidence ?? 0,
			memory.status ?? "approved",
			now,
			now,
		);
	return Number(result.lastInsertRowid);
}

export function updateMemoryStatus(
	db: Database,
	id: number,
	status: string,
): void {
	db.prepare("UPDATE memories SET status = ? WHERE id = ?").run(status, id);
}

export function insertRunObservation(
	db: Database,
	runId: string,
	observationId: number,
	action: string,
): void {
	db.prepare(
		`INSERT OR IGNORE INTO run_observations (run_id, observation_id, action)
		VALUES (?, ?, ?)`,
	).run(runId, observationId, action);
}

export function insertObservationHistory(
	db: Database,
	params: {
		observationId: number;
		runId?: string | null;
		sessionId?: string | null;
		action: string;
		oldContent?: string | null;
		newContent?: string | null;
		oldEvidence?: string | null;
		newEvidence?: string | null;
		oldStatus?: string | null;
		newStatus?: string | null;
		metadata?: string | null;
	},
): void {
	const now = new Date().toISOString();
	db.prepare(
		`INSERT INTO observation_history (observation_id, run_id, session_id, action, old_content, new_content, old_evidence, new_evidence, old_status, new_status, metadata, changed_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
	).run(
		params.observationId,
		params.runId ?? null,
		params.sessionId ?? null,
		params.action,
		params.oldContent ?? null,
		params.newContent ?? null,
		params.oldEvidence ?? null,
		params.newEvidence ?? null,
		params.oldStatus ?? null,
		params.newStatus ?? null,
		params.metadata ?? null,
		now,
	);
}

export function queryObservationHistory(
	db: Database,
	observationId: number,
): Array<{
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
}> {
	const rows = db
		.prepare(
			"SELECT * FROM observation_history WHERE observation_id = ? ORDER BY changed_at DESC",
		)
		.all(observationId) as Array<Record<string, unknown>>;
	return rows.map((r) => ({
		id: r.id as number,
		observationId: r.observation_id as number,
		runId: r.run_id as string | null,
		sessionId: r.session_id as string | null,
		action: r.action as string,
		oldContent: r.old_content as string | null,
		newContent: r.new_content as string | null,
		oldEvidence: r.old_evidence as string | null,
		newEvidence: r.new_evidence as string | null,
		oldStatus: r.old_status as string | null,
		newStatus: r.new_status as string | null,
		metadata: r.metadata as string | null,
		changedAt: r.changed_at as string,
	}));
}

export function queryObservationsForProject(
	db: Database,
	projectId: string,
): Array<{
	id: number;
	category: string;
	content: string;
	key: string;
	count: number;
	sessionsSinceLastSeen: number;
	status: string;
	suggestedMemory: string | null;
}> {
	const rows = db
		.prepare(
			`SELECT id, category, content, key, count, sessions_since_last_seen, status, suggested_memory
			FROM observations
			WHERE project_id = ? AND status = 'active'
			ORDER BY count DESC`,
		)
		.all(projectId) as Array<{
		id: number;
		category: string;
		content: string;
		key: string;
		count: number;
		sessions_since_last_seen: number;
		status: string;
		suggested_memory: string | null;
	}>;

	return rows.map((r) => ({
		id: r.id,
		category: r.category,
		content: r.content,
		key: r.key,
		count: r.count,
		sessionsSinceLastSeen: r.sessions_since_last_seen,
		status: r.status,
		suggestedMemory: r.suggested_memory,
	}));
}

export function queryApprovedMemoriesForProject(
	db: Database,
	projectId: string,
): Array<{
	id: number;
	category: string;
	content: string;
}> {
	return db
		.prepare(
			`SELECT id, category, content FROM memories
			WHERE project_id = ? AND status = 'approved'
			ORDER BY category, id`,
		)
		.all(projectId) as Array<{
		id: number;
		category: string;
		content: string;
	}>;
}

export function queryObservationStatsByProject(db: Database): Array<{
	projectId: string;
	projectName: string;
	activeObservations: number;
}> {
	const rows = db
		.prepare(`
		SELECT o.project_id, p.name, COUNT(*) as cnt
		FROM observations o
		JOIN projects p ON p.encoded_name = o.project_id
		WHERE o.status = 'active'
		GROUP BY o.project_id
	`)
		.all() as Array<{ project_id: string; name: string; cnt: number }>;

	return rows.map((r) => ({
		projectId: r.project_id,
		projectName: r.name,
		activeObservations: r.cnt,
	}));
}

export function queryUnanalyzedSessions(
	db: Database,
	projectId: string,
): string[] {
	const rows = db
		.prepare(`
		SELECT s.session_id FROM sessions s
		WHERE s.project_id = ? AND (s.parent_session_id IS NULL OR s.parent_session_id = s.session_id)
		AND s.session_id NOT IN (
			SELECT DISTINCT session_id FROM memory_runs
			WHERE session_id IS NOT NULL AND run_type = 'analysis'
		)
		ORDER BY s.time_end DESC
	`)
		.all(projectId) as Array<{ session_id: string }>;
	return rows.map((r) => r.session_id);
}
