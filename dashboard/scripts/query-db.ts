#!/usr/bin/env bun
import { Database } from "bun:sqlite";
import { existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";

// --- Arg parsing helpers ---

function getFlag(
	args: string[],
	flag: string,
	defaultValue?: string,
): string | undefined {
	const idx = args.indexOf(flag);
	if (idx === -1) return defaultValue;
	return args[idx + 1] ?? defaultValue;
}

function hasFlag(args: string[], flag: string): boolean {
	return args.includes(flag);
}

// --- Output helpers ---

function output(data: object): void {
	console.log(JSON.stringify(data, null, 2));
	process.exit(0);
}

function error(message: string): never {
	console.log(JSON.stringify({ error: message }, null, 2));
	process.exit(1);
}

function usage(): never {
	error(
		"Usage: query-db.ts <command> [args]\n" +
			"Commands:\n" +
			"  messages <session_id> [--limit 50] [--offset 0] [--raw]\n" +
			"  session <session_id>\n" +
			"  observations <project_id> [--status active]\n" +
			"  tool-calls <session_id>\n" +
			"  session-stats <session_id>",
	);
}

// --- Open database ---

const dbPath = join(homedir(), ".codeforge", "data", "dashboard.db");

if (!existsSync(dbPath)) {
	error(`Database not found at ${dbPath}`);
}

const db = new Database(dbPath, { readonly: true, create: false });

// --- Commands ---

const args = process.argv.slice(2);
const command = args[0];
const commandArgs = args.slice(1);

if (!command) {
	usage();
}

switch (command) {
	case "messages": {
		const sessionId = commandArgs[0];
		if (!sessionId) error("Missing required argument: session_id");

		const limit = parseInt(getFlag(commandArgs, "--limit", "50")!, 10);
		const offset = parseInt(getFlag(commandArgs, "--offset", "0")!, 10);
		const raw = hasFlag(commandArgs, "--raw");

		const totalRow = db
			.query("SELECT COUNT(*) as count FROM messages WHERE session_id = ?")
			.get(sessionId) as { count: number } | null;
		const total = totalRow?.count ?? 0;

		const columns = raw
			? "uuid, type, timestamp, model, searchable_text, raw_json"
			: "uuid, type, timestamp, model, searchable_text";

		const rows = db
			.query(
				`SELECT ${columns} FROM messages WHERE session_id = ? ORDER BY timestamp ASC LIMIT ? OFFSET ?`,
			)
			.all(sessionId, limit, offset) as Record<string, unknown>[];

		const messages = rows.map((row) => {
			const msg: Record<string, unknown> = {
				uuid: row.uuid,
				type: row.type,
				timestamp: row.timestamp,
				model: row.model,
				content: row.searchable_text,
			};
			if (raw && row.raw_json !== undefined) {
				msg.raw_json = row.raw_json;
			}
			return msg;
		});

		output({ messages, total, returned: messages.length });
		break;
	}

	case "session": {
		const sessionId = commandArgs[0];
		if (!sessionId) error("Missing required argument: session_id");

		const row = db
			.query(
				`SELECT s.session_id, s.project_id, p.name as project_name, s.cwd, s.git_branch,
                s.models, s.input_tokens, s.output_tokens, s.message_count,
                s.time_start, s.time_end
         FROM sessions s
         LEFT JOIN projects p ON s.project_id = p.project_id
         WHERE s.session_id = ?`,
			)
			.get(sessionId) as Record<string, unknown> | null;

		if (!row) {
			output({ session: null });
			break;
		}

		output({
			session: {
				sessionId: row.session_id,
				projectId: row.project_id,
				projectName: row.project_name,
				cwd: row.cwd,
				gitBranch: row.git_branch,
				models: row.models,
				inputTokens: row.input_tokens,
				outputTokens: row.output_tokens,
				messageCount: row.message_count,
				timeStart: row.time_start,
				timeEnd: row.time_end,
			},
		});
		break;
	}

	case "observations": {
		const projectId = commandArgs[0];
		if (!projectId) error("Missing required argument: project_id");

		const status = getFlag(commandArgs, "--status");

		let query =
			"SELECT id, project_id, category, content, key, evidence, count, status, sessions_since_last_seen, created_at, updated_at FROM observations WHERE project_id = ?";
		const params: unknown[] = [projectId];

		if (status) {
			query += " AND status = ?";
			params.push(status);
		}

		const rows = db.query(query).all(...params) as Record<string, unknown>[];

		const observations = rows.map((row) => ({
			id: row.id,
			projectId: row.project_id,
			category: row.category,
			content: row.content,
			key: row.key,
			evidence: row.evidence,
			count: row.count,
			status: row.status,
			sessionsSinceLastSeen: row.sessions_since_last_seen,
			createdAt: row.created_at,
			updatedAt: row.updated_at,
		}));

		output({ observations, total: observations.length });
		break;
	}

	case "tool-calls": {
		const sessionId = commandArgs[0];
		if (!sessionId) error("Missing required argument: session_id");

		const rows = db
			.query(
				"SELECT tool_name, file_path, timestamp FROM tool_calls WHERE session_id = ? ORDER BY timestamp ASC",
			)
			.all(sessionId) as Record<string, unknown>[];

		const toolCalls = rows.map((row) => ({
			toolName: row.tool_name,
			filePath: row.file_path,
			timestamp: row.timestamp,
		}));

		output({ toolCalls, total: toolCalls.length });
		break;
	}

	case "session-stats": {
		const sessionId = commandArgs[0];
		if (!sessionId) error("Missing required argument: session_id");

		const msgStats = db
			.query(
				`SELECT COUNT(*) as message_count,
                SUM(CASE WHEN type = 'human' THEN 0 ELSE 0 END) as placeholder
         FROM messages WHERE session_id = ?`,
			)
			.get(sessionId) as Record<string, unknown> | null;

		const sessionRow = db
			.query(
				"SELECT input_tokens, output_tokens, time_start, time_end FROM sessions WHERE session_id = ?",
			)
			.get(sessionId) as Record<string, unknown> | null;

		const toolStats = db
			.query(
				`SELECT COUNT(*) as tool_call_count FROM tool_calls WHERE session_id = ?`,
			)
			.get(sessionId) as Record<string, unknown> | null;

		const uniqueToolRows = db
			.query("SELECT DISTINCT tool_name FROM tool_calls WHERE session_id = ?")
			.all(sessionId) as Record<string, unknown>[];

		const messageCount = (msgStats?.message_count as number) ?? 0;
		const inputTokens = (sessionRow?.input_tokens as number) ?? 0;
		const outputTokens = (sessionRow?.output_tokens as number) ?? 0;
		const toolCallCount = (toolStats?.tool_call_count as number) ?? 0;
		const uniqueTools = uniqueToolRows.map((r) => r.tool_name as string);

		const timeStart = sessionRow?.time_start as string | null;
		const timeEnd = sessionRow?.time_end as string | null;
		let durationMs: number | null = null;
		if (timeStart && timeEnd) {
			durationMs = new Date(timeEnd).getTime() - new Date(timeStart).getTime();
		}

		output({
			stats: {
				messageCount,
				inputTokens,
				outputTokens,
				toolCallCount,
				uniqueTools,
				durationMs,
			},
		});
		break;
	}

	default:
		usage();
}

db.close();
