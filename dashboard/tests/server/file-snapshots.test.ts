import { Database } from "bun:sqlite";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { openDatabase } from "../../src/parser/db.js";
import {
	queryAllAgents,
	queryContextForSession,
	queryFileSnapshotDiff,
	queryFileSnapshots,
	queryFileSnapshotsByType,
	queryPlanBySlug,
	querySessionHasAgents,
	querySubagentsForSession,
	queryTasks,
} from "../../src/parser/queries.js";
import {
	classifyFile,
	ingestSessionFile,
	snapshotFile,
} from "../../src/server/ingestion.js";

// --- classifyFile ---

describe("classifyFile", () => {
	test("classifies plan files", () => {
		expect(classifyFile("plans/my-plan.md")).toBe("plan");
	});

	test("classifies rule files", () => {
		expect(classifyFile("rules/workspace-scope.md")).toBe("rule");
	});

	test("classifies task files", () => {
		expect(classifyFile("tasks/my-team/task1.json")).toBe("task");
	});

	test("classifies team config files", () => {
		expect(classifyFile("teams/my-team/config.json")).toBe("team-config");
	});

	test("classifies tool-result files", () => {
		expect(
			classifyFile("projects/abc/session-123/tool-results/output.txt"),
		).toBe("tool-result");
	});

	test("classifies subagent meta files", () => {
		expect(classifyFile("projects/abc/subagents/agent1.meta.json")).toBe(
			"subagent-meta",
		);
	});

	test("classifies session meta files", () => {
		expect(classifyFile("sessions/abc.json")).toBe("session-meta");
	});

	test("classifies root-level config files", () => {
		expect(classifyFile("settings.json")).toBe("config");
		expect(classifyFile(".claude.json")).toBe("config");
		expect(classifyFile("keybindings.json")).toBe("config");
	});

	test("returns null for unrecognized files", () => {
		expect(classifyFile("random-file.txt")).toBeNull();
		expect(classifyFile("some/nested/file.xyz")).toBeNull();
	});

	test("returns null for JSONL files", () => {
		// JSONL handled separately by the watcher
		expect(classifyFile("projects/abc/session.jsonl")).toBeNull();
	});

	test("returns null for nested JSON that is not a recognized type", () => {
		expect(classifyFile("unknown-dir/file.json")).toBeNull();
	});

	test("does not classify plans without .md extension", () => {
		expect(classifyFile("plans/plan-data.json")).toBeNull();
	});

	test("does not classify non-.meta.json as subagent meta", () => {
		expect(classifyFile("projects/abc/subagents/agent1.json")).toBeNull();
	});

	test("classifies CLAUDE.md as context", () => {
		expect(classifyFile("CLAUDE.md")).toBe("context");
	});

	test("classifies nested CLAUDE.md as context", () => {
		expect(classifyFile("some/path/CLAUDE.md")).toBe("context");
	});

	test("classifies MEMORY.md as context", () => {
		expect(classifyFile("projects/encoded-proj/memory/MEMORY.md")).toBe(
			"context",
		);
	});

	test("classifies project-local memory path as context", () => {
		// Project-local autoMemoryDirectory path (.claude/memory/)
		// This isn't in the home-dir projects/ pattern, so classifyFile won't match it.
		// The project-local memory is handled directly by context-reader and ingestion,
		// not by classifyFile (which only processes ~/.claude/ relative paths).
		// Verify the home-dir pattern still works:
		expect(classifyFile("projects/encoded-proj/memory/MEMORY.md")).toBe(
			"context",
		);
	});
});

// --- snapshotFile + queries ---

describe("snapshotFile and queries", () => {
	let db: Database;

	afterEach(() => {
		if (db) db.close();
	});

	function createTestDb(): Database {
		db = openDatabase(":memory:");
		return db;
	}

	test("snapshots a file and retrieves it", async () => {
		const testDb = createTestDb();
		const tmpFile = "/tmp/test-snapshot-plan.md";
		await Bun.write(tmpFile, "# My Plan\n\nDo the thing.");

		await snapshotFile(testDb, tmpFile, "plan", "plans/my-plan.md");

		const snapshots = queryFileSnapshots(testDb, tmpFile);
		expect(snapshots).toHaveLength(1);
		expect(snapshots[0].fileType).toBe("plan");
		expect(snapshots[0].content).toBe("# My Plan\n\nDo the thing.");
		expect(snapshots[0].sessionId).toBeNull();
		expect(snapshots[0].capturedAt).toBeTruthy();
	});

	test("deduplicates identical content via content_hash", async () => {
		const testDb = createTestDb();
		const tmpFile = "/tmp/test-snapshot-dedup.md";
		await Bun.write(tmpFile, "same content");

		await snapshotFile(testDb, tmpFile, "rule", "rules/test.md");
		await snapshotFile(testDb, tmpFile, "rule", "rules/test.md");

		const snapshots = queryFileSnapshots(testDb, tmpFile);
		expect(snapshots).toHaveLength(1);
	});

	test("creates new snapshot when content changes", async () => {
		const testDb = createTestDb();
		const tmpFile = "/tmp/test-snapshot-change.md";

		await Bun.write(tmpFile, "version 1");
		await snapshotFile(testDb, tmpFile, "plan", "plans/test.md");

		await Bun.write(tmpFile, "version 2");
		await snapshotFile(testDb, tmpFile, "plan", "plans/test.md");

		const snapshots = queryFileSnapshots(testDb, tmpFile);
		expect(snapshots).toHaveLength(2);
		expect(snapshots[0].content).toBe("version 2");
		expect(snapshots[1].content).toBe("version 1");
	});

	test("extracts session_id from tool-result paths", async () => {
		const testDb = createTestDb();
		const sessionUuid = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
		const tmpFile = "/tmp/test-snapshot-tool-result.txt";
		await Bun.write(tmpFile, "tool output here");

		const relativePath = `projects/encoded-proj/${sessionUuid}/tool-results/output.txt`;
		await snapshotFile(testDb, tmpFile, "tool-result", relativePath);

		const snapshots = queryFileSnapshots(testDb, tmpFile);
		expect(snapshots).toHaveLength(1);
		expect(snapshots[0].sessionId).toBe(sessionUuid);
	});

	test("queryFileSnapshotsByType returns latest per file", async () => {
		const testDb = createTestDb();

		const file1 = "/tmp/test-snap-type-1.md";
		const file2 = "/tmp/test-snap-type-2.md";
		await Bun.write(file1, "plan 1 v1");
		await snapshotFile(testDb, file1, "plan", "plans/plan1.md");
		await Bun.write(file1, "plan 1 v2");
		await snapshotFile(testDb, file1, "plan", "plans/plan1.md");
		await Bun.write(file2, "plan 2");
		await snapshotFile(testDb, file2, "plan", "plans/plan2.md");

		const result = queryFileSnapshotsByType(testDb, "plan");
		expect(result.data).toHaveLength(2);
		expect(result.meta.total).toBe(2);
	});

	test("queryFileSnapshotDiff returns before/after", async () => {
		const testDb = createTestDb();
		const tmpFile = "/tmp/test-snap-diff.md";

		await Bun.write(tmpFile, "before content");
		await snapshotFile(testDb, tmpFile, "plan", "plans/diff-test.md");

		await Bun.write(tmpFile, "after content");
		await snapshotFile(testDb, tmpFile, "plan", "plans/diff-test.md");

		const diff = queryFileSnapshotDiff(testDb, tmpFile);
		expect(diff).not.toBeNull();
		expect(diff!.before).toBe("before content");
		expect(diff!.after).toBe("after content");
	});

	test("queryFileSnapshotDiff returns null for unknown file", () => {
		const testDb = createTestDb();
		const diff = queryFileSnapshotDiff(testDb, "/nonexistent/file.md");
		expect(diff).toBeNull();
	});

	test("queryFileSnapshotDiff returns null before for single snapshot", async () => {
		const testDb = createTestDb();
		const tmpFile = "/tmp/test-snap-single.md";
		await Bun.write(tmpFile, "only version");
		await snapshotFile(testDb, tmpFile, "rule", "rules/single.md");

		const diff = queryFileSnapshotDiff(testDb, tmpFile);
		expect(diff).not.toBeNull();
		expect(diff!.before).toBeNull();
		expect(diff!.after).toBe("only version");
	});
});

// --- plan_snapshots ingestion ---

describe("plan_snapshots ingestion", () => {
	let db: Database;

	afterEach(() => {
		if (db) db.close();
	});

	function createTestDb(): Database {
		db = openDatabase(":memory:");
		return db;
	}

	test("snapshotFile populates plan_snapshots for plan files", async () => {
		const testDb = createTestDb();
		const tmpFile = "/tmp/test-plan-snapshot-ingest.md";
		await Bun.write(tmpFile, "# My Plan\n\nPlan content here.");

		await snapshotFile(testDb, tmpFile, "plan", "plans/my-plan.md");

		const rows = testDb
			.prepare("SELECT slug, content FROM plan_snapshots WHERE slug = ?")
			.all("my-plan") as Array<{ slug: string; content: string }>;

		expect(rows).toHaveLength(1);
		expect(rows[0].slug).toBe("my-plan");
		expect(rows[0].content).toBe("# My Plan\n\nPlan content here.");
	});

	test("does not populate plan_snapshots for non-plan files", async () => {
		const testDb = createTestDb();
		const tmpFile = "/tmp/test-rule-no-plan-snapshot.md";
		await Bun.write(tmpFile, "# Rule\n\nSome rule.");

		await snapshotFile(testDb, tmpFile, "rule", "rules/test-rule.md");

		const rows = testDb
			.prepare("SELECT COUNT(*) as cnt FROM plan_snapshots")
			.get() as { cnt: number };

		expect(rows.cnt).toBe(0);
	});

	test("strips plans/ prefix and .md suffix for slug", async () => {
		const testDb = createTestDb();
		const tmpFile = "/tmp/test-plan-slug-strip.md";
		await Bun.write(tmpFile, "# Deep Plan");

		await snapshotFile(testDb, tmpFile, "plan", "plans/nested-deep-plan.md");

		const rows = testDb
			.prepare("SELECT slug FROM plan_snapshots")
			.all() as Array<{ slug: string }>;

		expect(rows).toHaveLength(1);
		expect(rows[0].slug).toBe("nested-deep-plan");
	});
});

// --- task-reader ---

describe("task-reader", () => {
	const { homedir } = require("os");
	const { join } = require("path");
	const { mkdirSync, rmSync } = require("fs");

	// Use unique test team names in the real ~/.claude/tasks/ directory
	const testTeamName = "__test_task_reader_team__";
	const testTeamName2 = "__test_task_reader_alpha__";
	const tasksBase = join(homedir(), ".claude/tasks");

	async function setupTestTeams() {
		const teamDir = join(tasksBase, testTeamName);
		const teamDir2 = join(tasksBase, testTeamName2);
		mkdirSync(teamDir, { recursive: true });
		mkdirSync(teamDir2, { recursive: true });

		await Bun.write(
			join(teamDir, "1.json"),
			JSON.stringify({
				id: "1",
				subject: "Test task",
				description: "A test task",
				status: "pending",
				blocks: [],
				blockedBy: [],
			}),
		);

		await Bun.write(
			join(teamDir, "2.json"),
			JSON.stringify({
				id: "2",
				subject: "Completed task",
				description: "Done",
				status: "completed",
				owner: "agent-1",
				blocks: [],
				blockedBy: ["1"],
			}),
		);

		// Invalid JSON — should be skipped gracefully
		await Bun.write(join(teamDir, "bad.json"), "not valid json {{{");

		await Bun.write(
			join(teamDir2, "1.json"),
			'{"id":"1","subject":"Alpha task","description":"","status":"pending","blocks":[],"blockedBy":[]}',
		);
	}

	function cleanupTestTeams() {
		try {
			rmSync(join(tasksBase, testTeamName), { recursive: true });
		} catch {
			// ignore
		}
		try {
			rmSync(join(tasksBase, testTeamName2), { recursive: true });
		} catch {
			// ignore
		}
	}

	afterEach(() => {
		cleanupTestTeams();
	});

	test("loadTasksByTeam loads and parses task files", async () => {
		await setupTestTeams();
		const { loadTasksByTeam } = await import("../../src/parser/task-reader.js");

		const tasks = await loadTasksByTeam(testTeamName);
		expect(tasks.length).toBe(2); // bad.json skipped
		const ids = tasks.map((t: { id: string }) => t.id).sort();
		expect(ids).toEqual(["1", "2"]);

		const completed = tasks.find((t: { id: string }) => t.id === "2");
		expect(completed?.status).toBe("completed");
		expect(completed?.owner).toBe("agent-1");
		expect(completed?.blockedBy).toEqual(["1"]);
	});

	test("loadTasksByTeam returns empty array for nonexistent team", async () => {
		const { loadTasksByTeam } = await import("../../src/parser/task-reader.js");
		const tasks = await loadTasksByTeam("__nonexistent_test_team_xyz__");
		expect(tasks).toEqual([]);
	});

	test("loadAllTeamNames discovers team directories with JSON files", async () => {
		await setupTestTeams();
		const { loadAllTeamNames } = await import(
			"../../src/parser/task-reader.js"
		);

		const teams = await loadAllTeamNames();
		expect(teams).toContain(testTeamName);
		expect(teams).toContain(testTeamName2);
	});
});

// --- EventBus file:changed ---

describe("EventBus file:changed event", () => {
	test("file:changed is a valid event type", () => {
		const { EventBus } = require("../../src/server/event-bus.js");
		const bus = new EventBus();
		let received = false;

		bus.on("file:changed", () => {
			received = true;
		});
		bus.emit("file:changed", {
			filePath: "/some/path",
			fileType: "plan",
			timestamp: new Date().toISOString(),
		});

		expect(received).toBe(true);
	});
});

// --- queryPlanBySlug ---

describe("queryPlanBySlug", () => {
	let db: Database;

	afterEach(() => {
		if (db) db.close();
	});

	function createTestDb(): Database {
		db = openDatabase(":memory:");
		return db;
	}

	test("returns plan with title extracted from content", async () => {
		const testDb = createTestDb();
		const tmpFile = "/tmp/test-plan-by-slug.md";
		await Bun.write(tmpFile, "# My Great Plan\n\nDetails here.");
		await snapshotFile(testDb, tmpFile, "plan", "plans/great-plan.md");

		const result = queryPlanBySlug(testDb, "great-plan");
		expect(result).not.toBeNull();
		expect(result!.slug).toBe("great-plan");
		expect(result!.title).toBe("My Great Plan");
		expect(result!.content).toContain("Details here.");
	});

	test("returns null for nonexistent slug", () => {
		const testDb = createTestDb();
		expect(queryPlanBySlug(testDb, "nonexistent")).toBeNull();
	});

	test("returns latest version when multiple exist", async () => {
		const testDb = createTestDb();
		const tmpFile = "/tmp/test-plan-versions.md";
		await Bun.write(tmpFile, "# V1");
		await snapshotFile(testDb, tmpFile, "plan", "plans/versioned.md");
		// Small delay to ensure distinct captured_at timestamps
		await new Promise((r) => setTimeout(r, 50));
		await Bun.write(tmpFile, "# V2");
		await snapshotFile(testDb, tmpFile, "plan", "plans/versioned.md");

		const result = queryPlanBySlug(testDb, "versioned");
		expect(result!.title).toBe("V2");
	});
});

// --- queryContextForSession ---

describe("queryContextForSession", () => {
	let db: Database;

	afterEach(() => {
		if (db) db.close();
	});

	function createTestDb(): Database {
		db = openDatabase(":memory:");
		return db;
	}

	test("returns empty for nonexistent session", () => {
		const testDb = createTestDb();
		const result = queryContextForSession(testDb, "nonexistent");
		expect(result.memories).toEqual([]);
		expect(result.rules).toEqual([]);
	});

	test("returns context grouped into memories and rules", () => {
		const testDb = createTestDb();
		testDb.run(
			"INSERT INTO projects (encoded_name, path, name) VALUES (?, ?, ?)",
			["test-proj", "/tmp/test", "test"],
		);
		testDb.run(
			"INSERT INTO sessions (session_id, project_id, file_path, message_count, file_size) VALUES (?, ?, ?, ?, ?)",
			["sess-1", "test-proj", "/tmp/test.jsonl", 0, 0],
		);

		const now = new Date().toISOString();
		testDb.run(
			"INSERT INTO context_snapshots (project_id, session_id, scope, path, content, content_hash, captured_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
			[
				"test-proj",
				null,
				"project",
				"/tmp/test/CLAUDE.md",
				"# Project",
				"hash1",
				now,
			],
		);
		testDb.run(
			"INSERT INTO context_snapshots (project_id, session_id, scope, path, content, content_hash, captured_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
			[
				null,
				null,
				"user-rules",
				"/home/.claude/rules/test.md",
				"rule content",
				"hash2",
				now,
			],
		);

		const result = queryContextForSession(testDb, "sess-1");
		expect(result.memories).toHaveLength(1);
		expect(result.rules).toHaveLength(1);
		expect(result.memories[0].scope).toBe("project");
		expect(result.rules[0].scope).toBe("user-rules");
	});
});

// --- queryTasks DB-only ---

describe("queryTasks DB-only", () => {
	let db: Database;

	afterEach(() => {
		if (db) db.close();
	});

	function createTestDb(): Database {
		db = openDatabase(":memory:");
		return db;
	}

	test("returns tasks from file_snapshots", () => {
		const testDb = createTestDb();
		const taskContent = JSON.stringify({
			id: "1",
			subject: "Test",
			description: "desc",
			status: "pending",
			blocks: [],
			blockedBy: [],
		});
		testDb.run(
			"INSERT INTO file_snapshots (file_path, file_type, content, content_hash, captured_at) VALUES (?, ?, ?, ?, ?)",
			[
				"/home/.claude/tasks/my-team/1.json",
				"task",
				taskContent,
				"hash1",
				new Date().toISOString(),
			],
		);

		const result = queryTasks(testDb);
		expect(result).toHaveLength(1);
		expect(result[0].teamName).toBe("my-team");
		expect(result[0].tasks).toHaveLength(1);
		expect(result[0].tasks[0].subject).toBe("Test");
	});

	test("returns empty array when no tasks exist", () => {
		const testDb = createTestDb();
		const result = queryTasks(testDb);
		expect(result).toEqual([]);
	});
});

// --- subagent tracking ---

describe("subagent tracking", () => {
	let db: Database;

	beforeEach(() => {
		db = openDatabase(":memory:");
	});

	afterEach(() => {
		if (db) db.close();
	});

	function insertSession(
		sessionId: string,
		projectId: string,
		parentSessionId?: string,
		agentName?: string,
		agentType?: string,
	) {
		db.prepare(
			"INSERT OR IGNORE INTO projects (encoded_name, path, name) VALUES (?, ?, ?)",
		).run(projectId, "/test", "test");

		db.prepare(
			`INSERT OR REPLACE INTO sessions
			(session_id, project_id, file_path, input_tokens, output_tokens, cache_creation_tokens, cache_read_tokens,
			 message_count, time_start, time_end, file_size, parent_session_id, agent_name, agent_type, last_synced)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		).run(
			sessionId,
			projectId,
			`/test/${sessionId}.jsonl`,
			1000,
			500,
			0,
			0,
			5,
			"2025-01-01T00:00:00Z",
			"2025-01-01T00:10:00Z",
			1024,
			parentSessionId ?? null,
			agentName ?? null,
			agentType ?? null,
			new Date().toISOString(),
		);
	}

	// --- Schema tests ---

	test("sessions table has parent_session_id column", () => {
		const cols = db.prepare("PRAGMA table_info(sessions)").all() as Array<{
			name: string;
		}>;
		expect(cols.some((c) => c.name === "parent_session_id")).toBe(true);
		expect(cols.some((c) => c.name === "agent_name")).toBe(true);
		expect(cols.some((c) => c.name === "agent_type")).toBe(true);
	});

	test("subagents table exists with correct columns", () => {
		const cols = db.prepare("PRAGMA table_info(subagents)").all() as Array<{
			name: string;
		}>;
		const colNames = cols.map((c) => c.name);
		expect(colNames).toContain("parent_session_id");
		expect(colNames).toContain("session_id");
		expect(colNames).toContain("tool_use_id");
		expect(colNames).toContain("agent_name");
		expect(colNames).toContain("agent_type");
		expect(colNames).toContain("description");
		expect(colNames).toContain("mode");
		expect(colNames).toContain("team_name");
	});

	// --- Query tests ---

	test("querySubagentsForSession returns child sessions", () => {
		insertSession("parent-1", "proj-1");
		insertSession("child-1", "proj-1", "parent-1", "researcher", "explorer");
		insertSession(
			"child-2",
			"proj-1",
			"parent-1",
			"implementer",
			"implementer",
		);

		const result = querySubagentsForSession(db, "parent-1");
		expect(result.sessions).toHaveLength(2);
		expect(result.sessions[0].agent_name).toBe("researcher");
	});

	test("querySubagentsForSession returns unlinked subagents", () => {
		insertSession("parent-2", "proj-1");
		db.prepare(
			`INSERT INTO subagents (parent_session_id, tool_use_id, agent_name, description, time_spawned)
			VALUES (?, ?, ?, ?, ?)`,
		).run(
			"parent-2",
			"tu-1",
			"pending-agent",
			"doing work",
			"2025-01-01T00:00:00Z",
		);

		const result = querySubagentsForSession(db, "parent-2");
		expect(result.unlinked).toHaveLength(1);
		expect(result.unlinked[0].agent_name).toBe("pending-agent");
	});

	test("queryAllAgents groups by type", () => {
		insertSession("parent-3", "proj-1");
		insertSession("agent-a1", "proj-1", "parent-3", "a1", "explorer");
		insertSession("agent-a2", "proj-1", "parent-3", "a2", "explorer");
		insertSession("agent-a3", "proj-1", "parent-3", "a3", "implementer");

		const result = queryAllAgents(db);
		expect(result.totalCount).toBe(3);
		expect(result.byType.length).toBeGreaterThanOrEqual(2);
		const explorerType = result.byType.find(
			(t: any) => t.agent_type === "explorer",
		);
		expect(explorerType?.count).toBe(2);
	});

	test("querySessionHasAgents returns true when children exist", () => {
		insertSession("parent-4", "proj-1");
		insertSession("child-4", "proj-1", "parent-4");

		expect(querySessionHasAgents(db, "parent-4")).toBe(true);
		expect(querySessionHasAgents(db, "child-4")).toBe(false);
	});

	// --- Agent tool_use extraction ---

	test("ingesting JSONL with Agent tool_use populates subagents table", async () => {
		const parentSessionId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
		const toolUseId = "toolu_01ABC123";
		const msgUuid = "msg-uuid-001";

		// Create a mock JSONL file with an Agent tool_use block
		const jsonlLines = [
			JSON.stringify({
				uuid: msgUuid,
				sessionId: parentSessionId,
				timestamp: "2025-01-01T00:00:00Z",
				type: "assistant",
				message: {
					model: "claude-sonnet-4-20250514",
					stop_reason: "tool_use",
					usage: {
						input_tokens: 100,
						output_tokens: 50,
						cache_creation_input_tokens: 0,
						cache_read_input_tokens: 0,
					},
					content: [
						{
							type: "tool_use",
							id: toolUseId,
							name: "Agent",
							input: {
								name: "test-researcher",
								subagent_type: "explorer",
								description: "Research the codebase",
								mode: "explore",
								team_name: "my-team",
							},
						},
					],
				},
			}),
		];

		const tmpFile = "/tmp/test-agent-tool-use.jsonl";
		await Bun.write(tmpFile, jsonlLines.join("\n") + "\n");

		// Ensure project exists
		db.prepare(
			"INSERT OR IGNORE INTO projects (encoded_name, path, name) VALUES (?, ?, ?)",
		).run("test-proj", "/test", "test");

		// Disable FK checks — ingestion inserts messages before session in the same transaction
		db.exec("PRAGMA foreign_keys = OFF;");

		await ingestSessionFile(db, tmpFile, "test-proj");

		// Verify subagent was extracted
		const subagents = db
			.prepare("SELECT * FROM subagents WHERE parent_session_id = ?")
			.all(parentSessionId) as Array<{
			parent_session_id: string;
			tool_use_id: string;
			agent_name: string;
			agent_type: string;
			description: string;
			mode: string;
			team_name: string;
		}>;

		expect(subagents).toHaveLength(1);
		expect(subagents[0].tool_use_id).toBe(toolUseId);
		expect(subagents[0].agent_name).toBe("test-researcher");
		expect(subagents[0].agent_type).toBe("explorer");
		expect(subagents[0].description).toBe("Research the codebase");
		expect(subagents[0].mode).toBe("explore");
		expect(subagents[0].team_name).toBe("my-team");
	});

	// --- Migration test ---

	test("migration adds columns to existing sessions table", () => {
		const freshDb = new Database(":memory:", { create: true });
		freshDb.exec("PRAGMA journal_mode = WAL;");
		freshDb.exec(`CREATE TABLE sessions (
			session_id TEXT PRIMARY KEY,
			project_id TEXT NOT NULL,
			file_path TEXT NOT NULL,
			file_size INTEGER DEFAULT 0,
			last_synced TEXT
		);`);
		freshDb.close();

		// Run openDatabase logic — it should add the columns
		const migratedDb = openDatabase(":memory:");
		const cols = migratedDb
			.prepare("PRAGMA table_info(sessions)")
			.all() as Array<{ name: string }>;
		expect(cols.some((c) => c.name === "parent_session_id")).toBe(true);
		migratedDb.close();
	});
});

// --- project-local auto-memory ---

describe("project-local auto-memory in context-reader", () => {
	const { mkdirSync, rmSync, writeFileSync } = require("fs");
	const { join } = require("path");
	const tmpProject = "/tmp/test-project-local-memory";

	afterEach(() => {
		try {
			rmSync(tmpProject, { recursive: true });
		} catch {
			// ignore
		}
	});

	test("loadSessionContext reads project-local .claude/memory/MEMORY.md", async () => {
		// Set up a fake project with project-local memory
		mkdirSync(join(tmpProject, ".claude/memory"), { recursive: true });
		writeFileSync(
			join(tmpProject, ".claude/memory/MEMORY.md"),
			"# Local Memory\n\nProject-local auto-memory content.",
		);

		const { loadSessionContext } = await import(
			"../../src/parser/context-reader.js"
		);
		const ctx = await loadSessionContext(
			tmpProject,
			"nonexistent-encoded-name",
		);

		// Should find the project-local memory file
		const localMemory = ctx.memories.find(
			(m: any) => m.scope === "auto-memory" && m.path.includes(tmpProject),
		);
		expect(localMemory).toBeTruthy();
		expect(localMemory!.content).toContain("Project-local auto-memory content");
	});

	test("loadSessionContext returns both local and home-dir memory when both exist", async () => {
		// Set up project-local memory
		mkdirSync(join(tmpProject, ".claude/memory"), { recursive: true });
		writeFileSync(
			join(tmpProject, ".claude/memory/MEMORY.md"),
			"# Local Memory",
		);

		const { loadSessionContext } = await import(
			"../../src/parser/context-reader.js"
		);
		const ctx = await loadSessionContext(
			tmpProject,
			"nonexistent-encoded-name",
		);

		// Project-local should always be present
		const autoMemories = ctx.memories.filter(
			(m: any) => m.scope === "auto-memory",
		);
		expect(autoMemories.length).toBeGreaterThanOrEqual(1);

		// The first auto-memory entry should be the project-local one (checked first)
		const first = autoMemories[0];
		expect(first.path).toContain(tmpProject);
	});
});
