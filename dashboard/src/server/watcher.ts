import type { Database } from "bun:sqlite";
import { type FSWatcher, watch } from "fs";
import { basename, extname, resolve } from "path";
import { getFileSize } from "../parser/session-reader.js";
import type { EventBus } from "./event-bus.js";
import {
	classifyFile,
	ingestHistoryFile,
	ingestSessionFile,
	snapshotContextForProject,
	snapshotFile,
} from "./ingestion.js";

const THROTTLE_MS = 250;

const IGNORE_DIRS = new Set([
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

interface FileOffset {
	size: number;
}

export function createWatcher(
	claudeDir: string,
	eventBus: EventBus,
	db: Database,
): FSWatcher {
	const offsets = new Map<string, FileOffset>();
	let pendingEvents = new Map<string, string>(); // path -> event type
	let throttleTimer: ReturnType<typeof setTimeout> | null = null;

	function scheduleFlush() {
		if (throttleTimer) return;
		throttleTimer = setTimeout(async () => {
			throttleTimer = null;
			const batch = pendingEvents;
			pendingEvents = new Map();
			for (const [filePath, _eventType] of batch) {
				await processChange(filePath);
			}
		}, THROTTLE_MS);
	}

	async function processJsonlChange(filePath: string) {
		const isHistory = basename(filePath) === "history.jsonl";

		const currentSize = await getFileSize(filePath);
		const prev = offsets.get(filePath);
		const prevSize = prev?.size ?? 0;

		if (currentSize < prevSize) {
			// File shrank (likely session compaction) — reset DB offset so
			// the next growth triggers a full re-ingest from byte 0.
			offsets.set(filePath, { size: 0 });
			const sessionId = basename(filePath, ".jsonl");
			db.prepare("UPDATE sessions SET file_size = 0 WHERE session_id = ?").run(
				sessionId,
			);
			return;
		}

		if (currentSize === prevSize) {
			return;
		}

		offsets.set(filePath, { size: currentSize });

		const now = new Date().toISOString();

		if (isHistory) {
			await ingestHistoryFile(db);
			eventBus.emit("session:created", { timestamp: now });
		} else {
			const projectsIdx = filePath.indexOf("/projects/");
			let projectId: string | undefined;
			if (projectsIdx >= 0) {
				const afterProjects = filePath.slice(projectsIdx + "/projects/".length);
				projectId = afterProjects.split("/")[0];
			}

			if (projectId) {
				await ingestSessionFile(db, filePath, projectId);
				// Re-snapshot context for this project
				const projectRow = db
					.prepare(
						"SELECT path, encoded_name FROM projects WHERE encoded_name = ?",
					)
					.get(projectId) as {
					path: string;
					encoded_name: string;
				} | null;
				if (projectRow) {
					await snapshotContextForProject(
						db,
						projectRow.path,
						projectRow.encoded_name,
					);
				}
			}

			const sessionId = basename(filePath, ".jsonl");
			const subagentMatch = filePath.match(/\/([0-9a-f-]{36})\/subagents\//);
			if (subagentMatch) {
				eventBus.emit(prevSize === 0 ? "session:created" : "session:updated", {
					timestamp: now,
					projectId,
					sessionId,
					parentSessionId: subagentMatch[1],
				});
			} else {
				eventBus.emit("session:updated", {
					timestamp: now,
					projectId,
					sessionId,
				});
			}
		}
	}

	async function processChange(filePath: string) {
		const ext = extname(filePath);
		const relativePath = filePath.slice(claudeDir.length + 1);

		try {
			if (ext === ".jsonl") {
				await processJsonlChange(filePath);
				return;
			}

			const fileType = classifyFile(relativePath);
			if (!fileType) return;

			await snapshotFile(db, filePath, fileType, relativePath);
			eventBus.emit("file:changed", {
				filePath,
				fileType,
				timestamp: new Date().toISOString(),
			});
		} catch {
			// File may have been deleted between event and read
		}
	}

	const watcher = watch(
		claudeDir,
		{ recursive: true },
		(_eventType, filename) => {
			if (!filename) return;

			// Skip ignored directories
			const topDir = filename.split("/")[0];
			if (IGNORE_DIRS.has(topDir)) return;

			const fullPath = resolve(claudeDir, filename);
			pendingEvents.set(fullPath, _eventType ?? "change");
			scheduleFlush();
		},
	);

	return watcher;
}
