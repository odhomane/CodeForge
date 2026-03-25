import { readLines } from "./session-reader.js";
import type {
	SessionAnalytics,
	SessionMessage,
	SessionMeta,
	ToolUseBlock,
	UsageData,
} from "./types.js";
import { isSearchableType } from "./types.js";

const MAX_FILE_PATHS = 500;

export async function extractSessionMeta(
	filePath: string,
): Promise<SessionMeta> {
	let sessionId = "";
	let slug: string | undefined;
	let teamName: string | undefined;
	let cwd: string | undefined;
	let gitBranch: string | undefined;
	const models = new Set<string>();
	const totalTokens = { input: 0, output: 0, cacheCreation: 0, cacheRead: 0 };
	const filesRead = new Set<string>();
	const filesWritten = new Set<string>();
	const filesEdited = new Set<string>();
	let messageCount = 0;
	let earliest: string | null = null;
	let latest: string | null = null;

	for await (const line of readLines(filePath)) {
		let raw: Record<string, unknown>;
		try {
			raw = JSON.parse(line) as Record<string, unknown>;
		} catch {
			continue;
		}

		if (!sessionId && typeof raw.sessionId === "string") {
			sessionId = raw.sessionId;
		}
		if (!slug && typeof raw.slug === "string") {
			slug = raw.slug;
		}
		if (!teamName && typeof raw.teamName === "string") {
			teamName = raw.teamName;
		}
		if (!cwd && typeof raw.cwd === "string") {
			cwd = raw.cwd;
		}
		if (!gitBranch && typeof raw.gitBranch === "string") {
			gitBranch = raw.gitBranch;
		}

		if (typeof raw.timestamp === "string") {
			if (!earliest || raw.timestamp < earliest) {
				earliest = raw.timestamp;
			}
			if (!latest || raw.timestamp > latest) {
				latest = raw.timestamp;
			}
		}

		if (typeof raw.type === "string" && isSearchableType(raw.type)) {
			messageCount++;
		}

		// Extract model and usage from assistant messages
		if (raw.type === "assistant") {
			const message = raw.message as Record<string, unknown> | undefined;
			if (message) {
				if (typeof message.model === "string") {
					models.add(message.model);
				}

				const usage = message.usage as UsageData | undefined;
				if (usage) {
					totalTokens.input += usage.input_tokens || 0;
					totalTokens.output += usage.output_tokens || 0;
					totalTokens.cacheCreation += usage.cache_creation_input_tokens || 0;
					totalTokens.cacheRead += usage.cache_read_input_tokens || 0;
				}

				// Extract file paths from tool_use blocks
				const content = message.content;
				if (Array.isArray(content)) {
					for (const block of content) {
						const b = block as Record<string, unknown>;
						if (b.type !== "tool_use") continue;
						const toolBlock = b as unknown as ToolUseBlock;
						const input = toolBlock.input as Record<string, unknown> | null;
						if (!input || typeof input.file_path !== "string") continue;
						const fp = input.file_path;

						if (toolBlock.name === "Read" && filesRead.size < MAX_FILE_PATHS) {
							filesRead.add(fp);
						} else if (
							toolBlock.name === "Write" &&
							filesWritten.size < MAX_FILE_PATHS
						) {
							filesWritten.add(fp);
						} else if (
							toolBlock.name === "Edit" &&
							filesEdited.size < MAX_FILE_PATHS
						) {
							filesEdited.add(fp);
						}
					}
				}
			}
		}
	}

	return {
		sessionId,
		slug,
		teamName,
		cwd,
		gitBranch,
		models: [...models],
		totalTokens,
		filesRead: [...filesRead],
		filesWritten: [...filesWritten],
		filesEdited: [...filesEdited],
		messageCount,
		timeRange: earliest && latest ? { start: earliest, end: latest } : null,
	};
}

export function computeAnalytics(messages: SessionMessage[]): SessionAnalytics {
	const messagesByType: Record<string, number> = {};
	const tokenBreakdown = {
		input: 0,
		output: 0,
		cacheCreation: 0,
		cacheRead: 0,
	};
	const toolCallsByName: Record<string, number> = {};
	const stopReasons: Record<string, number> = {};

	let earliest: number | null = null;
	let latest: number | null = null;

	for (const msg of messages) {
		messagesByType[msg.type] = (messagesByType[msg.type] || 0) + 1;

		const ts = new Date(msg.timestamp).getTime();
		if (!isNaN(ts)) {
			if (earliest === null || ts < earliest) earliest = ts;
			if (latest === null || ts > latest) latest = ts;
		}

		if (msg.type === "assistant") {
			const message = msg.message;

			// Aggregate usage
			const usage = message.usage as UsageData | undefined;
			if (usage) {
				tokenBreakdown.input += usage.input_tokens || 0;
				tokenBreakdown.output += usage.output_tokens || 0;
				tokenBreakdown.cacheCreation += usage.cache_creation_input_tokens || 0;
				tokenBreakdown.cacheRead += usage.cache_read_input_tokens || 0;
			}

			// Count tool calls
			if (Array.isArray(message.content)) {
				for (const block of message.content) {
					if (block.type === "tool_use") {
						const tb = block as ToolUseBlock;
						toolCallsByName[tb.name] = (toolCallsByName[tb.name] || 0) + 1;
					}
				}
			}

			// Count stop reasons
			const stopReason = message.stop_reason;
			if (typeof stopReason === "string") {
				stopReasons[stopReason] = (stopReasons[stopReason] || 0) + 1;
			}
		}
	}

	const duration = earliest !== null && latest !== null ? latest - earliest : 0;

	const totalReadable = tokenBreakdown.cacheRead + tokenBreakdown.input;
	const cacheEfficiency =
		totalReadable > 0 ? tokenBreakdown.cacheRead / totalReadable : 0;

	return {
		duration,
		messagesByType,
		tokenBreakdown,
		toolCallsByName,
		stopReasons,
		cacheEfficiency,
	};
}
