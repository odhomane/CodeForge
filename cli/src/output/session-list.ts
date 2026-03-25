import chalk from "chalk";
import type { SessionSummary } from "../loaders/history-loader.js";
import type { SessionMeta } from "../loaders/session-meta.js";

export interface TaskSummary {
	total: number;
	completed: number;
	inProgress: number;
	pending: number;
}

export interface SessionListEntry {
	summary: SessionSummary;
	meta?: SessionMeta;
	planSlug?: string;
	taskSummary?: TaskSummary;
}

function formatTaskBar(ts: TaskSummary): string {
	const filled = ts.completed;
	const total = ts.total;
	const bar = "\u2588".repeat(filled) + "\u2591".repeat(total - filled);
	return `[${bar}] ${filled}/${total} tasks`;
}

function formatTimestamp(iso: string): string {
	const d = new Date(iso);
	if (isNaN(d.getTime())) return iso;

	const year = d.getFullYear();
	const month = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	const hours = String(d.getHours()).padStart(2, "0");
	const minutes = String(d.getMinutes()).padStart(2, "0");

	return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export function formatSessionListText(
	entries: SessionListEntry[],
	options?: { noColor?: boolean },
): string {
	if (options?.noColor) {
		chalk.level = 0;
	}

	const lines: string[] = [];

	for (const entry of entries) {
		const { summary, meta } = entry;
		const idShort = chalk.dim(summary.sessionId.slice(0, 8));
		const slug = meta?.slug ? chalk.cyan(meta.slug) : "\u2014";
		const project = chalk.dim(summary.project ?? "unknown");

		lines.push(`${idShort}  ${slug}  ${project}`);

		if (summary.firstPrompt) {
			const truncated =
				summary.firstPrompt.length > 80
					? summary.firstPrompt.slice(0, 80) + "..."
					: summary.firstPrompt;
			lines.push(`  ${truncated}`);
		}

		const start = formatTimestamp(summary.timestamps.first);
		const end = formatTimestamp(summary.timestamps.last);
		const msgPart = meta ? `  (${meta.messageCount} messages)` : "";
		lines.push(`  ${start} \u2192 ${end}${msgPart}`);

		const indicators: string[] = [];
		if (entry.planSlug) {
			indicators.push(chalk.cyan(`plan: ${entry.planSlug}`));
		}
		if (entry.taskSummary && entry.taskSummary.total > 0) {
			indicators.push(formatTaskBar(entry.taskSummary));
		}
		if (indicators.length > 0) {
			lines.push(`  ${indicators.join("  ")}`);
		}
		lines.push("---");
	}

	lines.push(chalk.dim(`${entries.length} sessions listed`));

	return lines.join("\n");
}

export function formatSessionListJson(entries: SessionListEntry[]): string {
	const output = entries.map((entry) => {
		const { summary, meta } = entry;
		return {
			sessionId: summary.sessionId,
			slug: meta?.slug ?? null,
			project: summary.project ?? null,
			firstPrompt: summary.firstPrompt ?? null,
			messageCount: meta?.messageCount ?? summary.promptCount,
			timeRange: {
				start: summary.timestamps.first,
				end: summary.timestamps.last,
			},
			plan: entry.planSlug ?? null,
			taskSummary: entry.taskSummary ?? null,
		};
	});

	return JSON.stringify(output, null, 2);
}
