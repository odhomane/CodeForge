import { homedir } from "os";
import { resolve } from "path";
import { readLines } from "./session-reader.js";
import type { HistoryEntry, SessionSummary } from "./types.js";

export async function loadHistory(options?: {
	project?: string;
	after?: Date;
	before?: Date;
	limit?: number;
}): Promise<SessionSummary[]> {
	const historyPath = resolve(homedir(), ".claude/history.jsonl");
	const limit = options?.limit ?? 20;

	const groups = new Map<string, HistoryEntry[]>();

	try {
		for await (const line of readLines(historyPath)) {
			let entry: HistoryEntry;
			try {
				entry = JSON.parse(line) as HistoryEntry;
			} catch {
				continue;
			}

			if (!entry.sessionId) continue;

			let list = groups.get(entry.sessionId);
			if (!list) {
				list = [];
				groups.set(entry.sessionId, list);
			}
			list.push(entry);
		}
	} catch {
		return [];
	}

	const summaries: SessionSummary[] = [];

	for (const [sessionId, entries] of groups) {
		const first = entries[0];
		const last = entries[entries.length - 1];

		const project = first.project || undefined;

		if (
			options?.project &&
			(!project || !project.startsWith(options.project))
		) {
			continue;
		}

		// Timestamps are Unix ms integers — convert to ISO strings
		const timestamps = {
			first: new Date(first.timestamp).toISOString(),
			last: new Date(last.timestamp).toISOString(),
		};

		if (options?.after && new Date(timestamps.last) < options.after) {
			continue;
		}
		if (options?.before && new Date(timestamps.last) > options.before) {
			continue;
		}

		const lastPrompt = last.display
			? last.display.length > 200
				? last.display.slice(0, 200)
				: last.display
			: undefined;

		summaries.push({
			sessionId,
			project,
			lastPrompt,
			promptCount: entries.length,
			timestamps,
		});
	}

	summaries.sort((a, b) => {
		const ta = new Date(a.timestamps.last).getTime();
		const tb = new Date(b.timestamps.last).getTime();
		return tb - ta;
	});

	return summaries.slice(0, limit);
}
