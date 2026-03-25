import type { Database } from "bun:sqlite";
import { createHash } from "crypto";
import { homedir } from "os";
import { join, resolve } from "path";
import { detectProjects } from "../parser/project-detector.js";
import { getFileSize, readLines } from "../parser/session-reader.js";
import type { HistoryEntry, ToolUseBlock, UsageData } from "../parser/types.js";
import { extractSearchableText, isSearchableType } from "../parser/types.js";
import type { EventBus } from "./event-bus.js";

// --- File Classification ---

export function classifyFile(relativePath: string): string | null {
	if (relativePath.startsWith("plans/") && relativePath.endsWith(".md"))
		return "plan";
	if (relativePath.startsWith("rules/") && relativePath.endsWith(".md"))
		return "rule";
	if (relativePath.startsWith("tasks/") && relativePath.endsWith(".json"))
		return "task";
	if (relativePath.startsWith("teams/") && relativePath.endsWith(".json"))
		return "team-config";
	if (relativePath.includes("/tool-results/") && relativePath.endsWith(".txt"))
		return "tool-result";
	if (
		relativePath.includes("/subagents/") &&
		relativePath.endsWith(".meta.json")
	)
		return "subagent-meta";
	if (relativePath.startsWith("sessions/") && relativePath.endsWith(".json"))
		return "session-meta";
	if (relativePath.endsWith(".json") && !relativePath.includes("/"))
		return "config";
	if (relativePath === "CLAUDE.md" || relativePath.endsWith("/CLAUDE.md"))
		return "context";
	if (/^projects\/[^/]+\/memory\/MEMORY\.md$/.test(relativePath))
		return "context";
	return null;
}

// --- File Snapshots ---

export async function snapshotFile(
	db: Database,
	filePath: string,
	fileType: string,
	relativePath: string,
): Promise<void> {
	const content = await Bun.file(filePath).text();
	const hash = createHash("sha256").update(content).digest("hex");

	// Derive session_id from path if possible
	let sessionId: string | null = null;
	const sessionMatch = relativePath.match(
		/^projects\/[^/]+\/([0-9a-f-]{36})\//,
	);
	if (sessionMatch) sessionId = sessionMatch[1];

	const capturedAt = new Date().toISOString();

	db.prepare(
		`INSERT OR IGNORE INTO file_snapshots
		(file_path, file_type, content, content_hash, session_id, captured_at)
		VALUES (?, ?, ?, ?, ?, ?)`,
	).run(filePath, fileType, content, hash, sessionId, capturedAt);

	// Also populate plan_snapshots for plan files
	if (fileType === "plan") {
		const slug = relativePath.replace(/^plans\//, "").replace(/\.md$/, "");
		db.prepare(
			`INSERT OR IGNORE INTO plan_snapshots
			(slug, session_id, content, captured_at)
			VALUES (?, ?, ?, ?)`,
		).run(slug, sessionId, content, capturedAt);
	}

	// Update session metadata from subagent meta files
	if (fileType === "subagent-meta") {
		try {
			const meta = JSON.parse(content) as Record<string, unknown>;
			const metaMatch = relativePath.match(
				/projects\/[^/]+\/([0-9a-f-]{36})\/subagents\/(.+)\.meta\.json$/,
			);
			if (metaMatch) {
				const parentSid = metaMatch[1];
				const agentName =
					(meta.name as string) ?? (meta.agentName as string) ?? null;
				const agentType =
					(meta.type as string) ?? (meta.subagent_type as string) ?? null;
				db.prepare(`
					UPDATE sessions SET agent_name = COALESCE(?, agent_name),
					                   agent_type = COALESCE(?, agent_type)
					WHERE parent_session_id = ? AND agent_name IS NULL
				`).run(agentName, agentType, parentSid);
			}
		} catch {
			/* ignore parse errors */
		}
	}

	// Also populate context_snapshots for context files
	if (fileType === "context") {
		let scope = "project";
		let ctxProjectId: string | null = null;
		if (relativePath === "CLAUDE.md") {
			scope = "user";
		} else if (/^projects\/([^/]+)\/memory\//.test(relativePath)) {
			scope = "auto-memory";
			ctxProjectId = relativePath.match(/^projects\/([^/]+)\//)?.[1] ?? null;
		}
		db.prepare(
			`INSERT OR IGNORE INTO context_snapshots
			(project_id, session_id, scope, path, content, content_hash, captured_at)
			VALUES (?, ?, ?, ?, ?, ?, ?)`,
		).run(ctxProjectId, sessionId, scope, filePath, content, hash, capturedAt);
	}
}

export async function snapshotExistingFiles(
	db: Database,
	claudeDir: string,
): Promise<void> {
	const glob = new Bun.Glob("**/*");
	const ignoreSet = new Set([
		"session-env",
		"plugins",
		"file-history",
		"cache",
		"debug",
		"telemetry",
		"downloads",
		"paste-cache",
		"shell-snapshots",
		"backups",
		"ide",
		"node_modules",
	]);

	for await (const relativePath of glob.scan({ cwd: claudeDir })) {
		const topDir = relativePath.split("/")[0];
		if (ignoreSet.has(topDir)) continue;
		if (relativePath.endsWith(".jsonl")) continue;

		const fileType = classifyFile(relativePath);
		if (!fileType) continue;

		const fullPath = join(claudeDir, relativePath);
		try {
			await snapshotFile(db, fullPath, fileType, relativePath);
		} catch {
			// File may not be readable
		}
	}
}

// --- Context Snapshots ---

export async function snapshotContextForProject(
	db: Database,
	projectPath: string,
	encodedProjectId: string,
): Promise<void> {
	const home = homedir();
	const capturedAt = new Date().toISOString();

	const insert = db.prepare(
		`INSERT OR IGNORE INTO context_snapshots
		(project_id, session_id, scope, path, content, content_hash, captured_at)
		VALUES (?, ?, ?, ?, ?, ?, ?)`,
	);

	async function snap(filePath: string, scope: string, projId: string | null) {
		try {
			const content = await Bun.file(filePath).text();
			const hash = createHash("sha256").update(content).digest("hex");
			insert.run(projId, null, scope, filePath, content, hash, capturedAt);
		} catch {
			/* file doesn't exist */
		}
	}

	// User-level CLAUDE.md (no project_id)
	await snap(resolve(home, ".claude/CLAUDE.md"), "user", null);

	// Project-level CLAUDE.md
	await snap(join(projectPath, "CLAUDE.md"), "project", encodedProjectId);
	await snap(
		join(projectPath, ".claude/CLAUDE.md"),
		"project",
		encodedProjectId,
	);

	// Auto-memory — project-local first (autoMemoryDirectory), then home-dir default
	await snap(
		join(projectPath, ".claude/memory/MEMORY.md"),
		"auto-memory",
		encodedProjectId,
	);
	await snap(
		resolve(home, ".claude/projects", encodedProjectId, "memory/MEMORY.md"),
		"auto-memory",
		encodedProjectId,
	);

	// User rules (no project_id)
	try {
		const glob = new Bun.Glob("*.md");
		for await (const entry of glob.scan({
			cwd: resolve(home, ".claude/rules"),
			absolute: true,
		})) {
			await snap(entry, "user-rules", null);
		}
	} catch {
		/* dir doesn't exist */
	}

	// Project rules
	try {
		const glob = new Bun.Glob("*.md");
		for await (const entry of glob.scan({
			cwd: join(projectPath, ".claude/rules"),
			absolute: true,
		})) {
			await snap(entry, "project-rules", encodedProjectId);
		}
	} catch {
		/* dir doesn't exist */
	}
}

// --- Session File Ingestion ---

export async function ingestSessionFile(
	db: Database,
	filePath: string,
	projectId: string,
): Promise<void> {
	let currentSize: number;
	try {
		currentSize = await getFileSize(filePath);
	} catch {
		return; // File may have been deleted
	}

	// Check if session already exists
	const existing = db
		.query<
			{
				file_size: number;
				session_id: string;
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
			},
			[string]
		>(
			`SELECT file_size, session_id, slug, team_name, cwd, git_branch, models,
			 input_tokens, output_tokens, cache_creation_tokens, cache_read_tokens,
			 message_count, time_start, time_end
			 FROM sessions WHERE file_path = ?`,
		)
		.get(filePath);

	if (existing && existing.file_size >= currentSize) {
		return; // Already up to date
	}

	const isIncremental = !!existing && existing.file_size > 0;
	const startOffset = isIncremental ? existing.file_size : undefined;

	// Accumulators — seed from existing record for incremental updates
	let sessionId = existing?.session_id ?? "";
	let slug: string | undefined = existing?.slug ?? undefined;
	let teamName: string | undefined = existing?.team_name ?? undefined;
	let cwd: string | undefined = existing?.cwd ?? undefined;
	let gitBranch: string | undefined = existing?.git_branch ?? undefined;
	const models = new Set<string>(
		existing?.models ? (JSON.parse(existing.models) as string[]) : [],
	);
	const totalTokens = {
		input: existing?.input_tokens ?? 0,
		output: existing?.output_tokens ?? 0,
		cacheCreation: existing?.cache_creation_tokens ?? 0,
		cacheRead: existing?.cache_read_tokens ?? 0,
	};
	let messageCount = existing?.message_count ?? 0;
	let earliest: string | null = existing?.time_start ?? null;
	let latest: string | null = existing?.time_end ?? null;

	let parentSessionId: string | null = null;
	let agentNameFromPath: string | null = null;
	const subagentMatch = filePath.match(
		/\/([0-9a-f-]{36})\/subagents\/(.+)\.jsonl$/,
	);
	if (subagentMatch) {
		parentSessionId = subagentMatch[1];
		agentNameFromPath = subagentMatch[2];
	}

	// Prepared statements
	const insertMessage = db.prepare(
		`INSERT OR IGNORE INTO messages
		(uuid, session_id, parent_uuid, type, timestamp, model, stop_reason,
		 input_tokens, output_tokens, cache_creation_tokens, cache_read_tokens,
		 is_sidechain, raw_json, searchable_text)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
	);

	const insertToolCall = db.prepare(
		`INSERT OR IGNORE INTO tool_calls
		(message_uuid, session_id, tool_name, file_path, timestamp)
		VALUES (?, ?, ?, ?, ?)`,
	);

	const insertFileTouched = db.prepare(
		`INSERT OR IGNORE INTO files_touched
		(session_id, file_path, action)
		VALUES (?, ?, ?)`,
	);

	const insertFileChange = db.prepare(
		`INSERT INTO file_changes
		(session_id, message_uuid, file_path, action, content, old_string, new_string, timestamp)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
	);

	const insertSubagent = db.prepare(`
		INSERT OR IGNORE INTO subagents
		(parent_session_id, session_id, tool_use_id, message_uuid, agent_name, agent_type, description, mode, team_name, file_path, time_spawned)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`);

	// Collect all operations to run in a single transaction
	interface PendingOp {
		stmt:
			| typeof insertMessage
			| typeof insertToolCall
			| typeof insertFileTouched
			| typeof insertFileChange
			| typeof insertSubagent;
		params: (string | number | null)[];
	}
	const pendingOps: PendingOp[] = [];

	try {
		for await (const line of readLines(filePath, startOffset)) {
			let raw: Record<string, unknown>;
			try {
				raw = JSON.parse(line) as Record<string, unknown>;
			} catch {
				continue;
			}

			const uuid = raw.uuid as string | undefined;
			const rawSessionId = raw.sessionId as string | undefined;
			const timestamp = raw.timestamp as string | undefined;

			if (!uuid || !rawSessionId || !timestamp) continue;

			if (!sessionId) sessionId = rawSessionId;
			if (!slug && typeof raw.slug === "string") slug = raw.slug;
			if (!teamName && typeof raw.teamName === "string")
				teamName = raw.teamName;
			if (!cwd && typeof raw.cwd === "string") cwd = raw.cwd;
			if (!gitBranch && typeof raw.gitBranch === "string")
				gitBranch = raw.gitBranch;

			if (!earliest || timestamp < earliest) earliest = timestamp;
			if (!latest || timestamp > latest) latest = timestamp;

			const type = raw.type as string;
			if (!type) continue;

			if (isSearchableType(type)) {
				messageCount++;
			}

			// Extract assistant-specific fields
			let model: string | null = null;
			let stopReason: string | null = null;
			let inputTokens = 0;
			let outputTokens = 0;
			let cacheCreationTokens = 0;
			let cacheReadTokens = 0;

			if (type === "assistant") {
				const message = raw.message as Record<string, unknown> | undefined;
				if (message) {
					if (typeof message.model === "string") {
						model = message.model;
						models.add(model);
					}
					if (typeof message.stop_reason === "string") {
						stopReason = message.stop_reason;
					}
					const usage = message.usage as UsageData | undefined;
					if (usage) {
						inputTokens = usage.input_tokens || 0;
						outputTokens = usage.output_tokens || 0;
						cacheCreationTokens = usage.cache_creation_input_tokens || 0;
						cacheReadTokens = usage.cache_read_input_tokens || 0;
						totalTokens.input += inputTokens;
						totalTokens.output += outputTokens;
						totalTokens.cacheCreation += cacheCreationTokens;
						totalTokens.cacheRead += cacheReadTokens;
					}
				}
			}

			// Generate searchable text
			const searchableText = extractSearchableText(
				raw as unknown as Parameters<typeof extractSearchableText>[0],
			);

			pendingOps.push({
				stmt: insertMessage,
				params: [
					uuid,
					rawSessionId,
					(raw.parentUuid as string) ?? null,
					type,
					timestamp,
					model,
					stopReason,
					inputTokens,
					outputTokens,
					cacheCreationTokens,
					cacheReadTokens,
					raw.isSidechain ? 1 : 0,
					JSON.stringify(raw),
					searchableText || null,
				],
			});

			// Extract tool_use blocks from assistant messages
			if (type === "assistant") {
				const message = raw.message as Record<string, unknown> | undefined;
				if (message && Array.isArray(message.content)) {
					for (const block of message.content) {
						const b = block as Record<string, unknown>;
						if (b.type !== "tool_use") continue;
						const toolBlock = b as unknown as ToolUseBlock;
						const input = toolBlock.input as Record<string, unknown> | null;
						const toolFilePath =
							input && typeof input.file_path === "string"
								? input.file_path
								: null;

						pendingOps.push({
							stmt: insertToolCall,
							params: [
								uuid,
								rawSessionId,
								toolBlock.name,
								toolFilePath,
								timestamp,
							],
						});

						if (toolBlock.name === "Agent") {
							const agentInput = toolBlock.input as Record<
								string,
								unknown
							> | null;
							pendingOps.push({
								stmt: insertSubagent,
								params: [
									rawSessionId, // parent_session_id
									null, // session_id (linked later)
									toolBlock.id, // tool_use_id
									uuid, // message_uuid
									(agentInput?.name as string) ?? null, // agent_name
									(agentInput?.subagent_type as string) ?? null, // agent_type
									(agentInput?.description as string) ?? null, // description
									(agentInput?.mode as string) ?? null, // mode
									(agentInput?.team_name as string) ?? null, // team_name
									null, // file_path
									timestamp, // time_spawned
								],
							});
						}

						// Track files touched
						if (toolFilePath) {
							let action: string | null = null;
							if (toolBlock.name === "Read") action = "read";
							else if (toolBlock.name === "Write") action = "write";
							else if (toolBlock.name === "Edit") action = "edit";

							if (action) {
								pendingOps.push({
									stmt: insertFileTouched,
									params: [rawSessionId, toolFilePath, action],
								});
							}

							// File changes with content
							if (
								toolBlock.name === "Write" &&
								input &&
								typeof input.content === "string"
							) {
								pendingOps.push({
									stmt: insertFileChange,
									params: [
										rawSessionId,
										uuid,
										toolFilePath,
										"write",
										input.content,
										null,
										null,
										timestamp,
									],
								});
							} else if (toolBlock.name === "Edit" && input) {
								pendingOps.push({
									stmt: insertFileChange,
									params: [
										rawSessionId,
										uuid,
										toolFilePath,
										"edit",
										null,
										typeof input.old_string === "string"
											? input.old_string
											: null,
										typeof input.new_string === "string"
											? input.new_string
											: null,
										timestamp,
									],
								});
							}
						}
					}
				}
			}
		}
	} catch {
		// File read error — process what we have
	}

	if (!sessionId) return;

	// Run everything in a single transaction
	const tx = db.transaction(() => {
		// Upsert session — use ON CONFLICT to avoid DELETE cascade that
		// INSERT OR REPLACE triggers (which would wipe all FK-linked messages).
		db.run(
			`INSERT INTO sessions
			(session_id, project_id, file_path, slug, team_name, cwd, git_branch,
			 models, input_tokens, output_tokens, cache_creation_tokens, cache_read_tokens,
			 message_count, time_start, time_end, file_size, last_synced,
			 parent_session_id, agent_name, agent_type)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
			ON CONFLICT(session_id) DO UPDATE SET
			 project_id = excluded.project_id,
			 file_path = excluded.file_path,
			 slug = COALESCE(excluded.slug, sessions.slug),
			 team_name = COALESCE(excluded.team_name, sessions.team_name),
			 cwd = COALESCE(excluded.cwd, sessions.cwd),
			 git_branch = COALESCE(excluded.git_branch, sessions.git_branch),
			 models = excluded.models,
			 input_tokens = excluded.input_tokens,
			 output_tokens = excluded.output_tokens,
			 cache_creation_tokens = excluded.cache_creation_tokens,
			 cache_read_tokens = excluded.cache_read_tokens,
			 message_count = excluded.message_count,
			 time_start = excluded.time_start,
			 time_end = excluded.time_end,
			 file_size = excluded.file_size,
			 last_synced = excluded.last_synced,
			 parent_session_id = COALESCE(excluded.parent_session_id, sessions.parent_session_id),
			 agent_name = COALESCE(excluded.agent_name, sessions.agent_name),
			 agent_type = COALESCE(excluded.agent_type, sessions.agent_type)`,
			[
				sessionId,
				projectId,
				filePath,
				slug ?? null,
				teamName ?? null,
				cwd ?? null,
				gitBranch ?? null,
				JSON.stringify([...models]),
				totalTokens.input,
				totalTokens.output,
				totalTokens.cacheCreation,
				totalTokens.cacheRead,
				messageCount,
				earliest,
				latest,
				currentSize,
				new Date().toISOString(),
				parentSessionId,
				agentNameFromPath,
				null,
			],
		);

		for (const op of pendingOps) {
			op.stmt.run(...op.params);
		}
	});
	tx();

	if (parentSessionId && sessionId) {
		db.prepare(`
			UPDATE subagents SET session_id = ?, file_path = ?
			WHERE parent_session_id = ? AND session_id IS NULL
			AND id = (
				SELECT id FROM subagents
				WHERE parent_session_id = ? AND session_id IS NULL
				ORDER BY time_spawned DESC LIMIT 1
			)
		`).run(sessionId, filePath, parentSessionId, parentSessionId);
	}
}

// --- History File Ingestion ---

export async function ingestHistoryFile(db: Database): Promise<void> {
	const historyPath = resolve(homedir(), ".claude/history.jsonl");

	const lines: string[] = [];
	try {
		for await (const line of readLines(historyPath)) {
			lines.push(line);
		}
	} catch {
		return; // No history file
	}

	if (lines.length === 0) return;

	const insertHistory = db.prepare(
		`INSERT OR IGNORE INTO history_entries
		(session_id, display, project, timestamp)
		VALUES (?, ?, ?, ?)`,
	);

	const tx = db.transaction(() => {
		for (const line of lines) {
			let entry: HistoryEntry;
			try {
				entry = JSON.parse(line) as HistoryEntry;
			} catch {
				continue;
			}
			if (!entry.sessionId || !entry.timestamp) continue;
			insertHistory.run(
				entry.sessionId,
				entry.display ?? null,
				entry.project ?? null,
				entry.timestamp,
			);
		}
	});
	tx();
}

// --- Initial Sync ---

export async function runInitialSync(
	db: Database,
	eventBus: EventBus,
): Promise<void> {
	// Check if already synced
	const count = db
		.query<{ cnt: number }, []>("SELECT COUNT(*) as cnt FROM sessions")
		.get();
	if (count && count.cnt > 0) {
		console.log("Database already populated, skipping full ingestion.");
		return;
	}

	console.log("Starting initial database ingestion...");

	const projects = await detectProjects();
	if (projects.length === 0) {
		console.log("No projects found.");
		eventBus.emit("ingestion:complete", {
			timestamp: new Date().toISOString(),
			processed: 0,
			total: 0,
		});
		return;
	}

	// Insert all projects
	const insertProject = db.prepare(
		`INSERT OR REPLACE INTO projects (encoded_name, path, name, last_synced)
		VALUES (?, ?, ?, ?)`,
	);
	const txProjects = db.transaction(() => {
		for (const project of projects) {
			const name =
				project.path.split("/").filter(Boolean).pop() || project.encodedName;
			insertProject.run(
				project.encodedName,
				project.path,
				name,
				new Date().toISOString(),
			);
		}
	});
	txProjects();

	// Count total files for progress
	let totalFiles = 0;
	for (const project of projects) {
		totalFiles += project.sessionFiles.length + project.subagentFiles.length;
	}

	let processed = 0;
	for (const project of projects) {
		for (const sessionFile of project.sessionFiles) {
			try {
				await ingestSessionFile(db, sessionFile, project.encodedName);
			} catch (err) {
				console.error(`Error ingesting ${sessionFile}:`, err);
			}
			processed++;
			if (processed % 10 === 0) {
				console.log(`Ingesting session ${processed}/${totalFiles}...`);
				eventBus.emit("ingestion:progress", {
					timestamp: new Date().toISOString(),
					processed,
					total: totalFiles,
				});
			}
		}
	}

	// Ingest subagent files
	for (const project of projects) {
		for (const subagentFile of project.subagentFiles) {
			try {
				await ingestSessionFile(db, subagentFile.filePath, project.encodedName);
			} catch (err) {
				console.error(
					`Error ingesting subagent ${subagentFile.filePath}:`,
					err,
				);
			}
			processed++;
		}
	}

	// Ingest history
	try {
		await ingestHistoryFile(db);
	} catch (err) {
		console.error("Error ingesting history:", err);
	}

	// Snapshot all existing non-JSONL tracked files
	const claudeDir = resolve(homedir(), ".claude");
	try {
		await snapshotExistingFiles(db, claudeDir);
		console.log("Snapshotted existing tracked files.");
	} catch (err) {
		console.error("Error snapshotting existing files:", err);
	}

	// Snapshot context for all projects
	for (const project of projects) {
		try {
			await snapshotContextForProject(db, project.path, project.encodedName);
		} catch (err) {
			console.error(`Error snapshotting context for ${project.path}:`, err);
		}
	}
	console.log("Snapshotted project context files.");

	console.log(`Ingestion complete. Processed ${processed} session files.`);
	eventBus.emit("ingestion:complete", {
		timestamp: new Date().toISOString(),
		processed,
		total: totalFiles,
	});
}

// --- Status ---

export function getIngestionStatus(db: Database): {
	totalSessions: number;
	totalMessages: number;
	isComplete: boolean;
} {
	const sessions = db
		.query<{ cnt: number }, []>("SELECT COUNT(*) as cnt FROM sessions")
		.get();
	const messages = db
		.query<{ cnt: number }, []>("SELECT COUNT(*) as cnt FROM messages")
		.get();
	return {
		totalSessions: sessions?.cnt ?? 0,
		totalMessages: messages?.cnt ?? 0,
		isComplete: (sessions?.cnt ?? 0) > 0,
	};
}
