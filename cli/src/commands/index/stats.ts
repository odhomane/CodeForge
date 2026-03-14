import chalk from "chalk";
import type { Command } from "commander";
import { existsSync } from "fs";
import { resolve } from "path";
import { closeDatabase, getStats, openDatabase } from "../../indexer/db.js";
import { formatStatsJson } from "../../output/index-json.js";
import { formatStatsText } from "../../output/index-text.js";

interface StatsCommandOptions {
	format: string;
	color?: boolean;
}

function findWorkspaceRoot(): string | null {
	let dir = process.cwd();
	while (true) {
		if (existsSync(resolve(dir, ".codeforge"))) return dir;
		const parent = resolve(dir, "..");
		if (parent === dir) return null;
		dir = parent;
	}
}

export function registerIndexStatsCommand(parent: Command): void {
	parent
		.command("stats")
		.description("Show codebase index statistics")
		.option("-f, --format <format>", "Output format: text|json", "text")
		.option("--no-color", "Disable colored output")
		.action(async (options: StatsCommandOptions) => {
			try {
				if (!options.color) chalk.level = 0;

				const workspaceRoot = findWorkspaceRoot();
				if (!workspaceRoot) {
					console.error(
						"Error: No .codeforge directory found. Are you in a CodeForge workspace?",
					);
					process.exit(1);
				}

				const dbPath = resolve(
					workspaceRoot,
					".codeforge",
					"data",
					"code-index.db",
				);
				if (!existsSync(dbPath)) {
					console.error("No index found. Run `codeforge index build` first.");
					process.exit(1);
				}

				const db = openDatabase(dbPath);
				const stats = getStats(db, dbPath);

				if (options.format === "json") {
					console.log(formatStatsJson(stats));
				} else {
					console.log(formatStatsText(stats, { noColor: !options.color }));
				}

				closeDatabase(db);
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err);
				console.error(`Error: ${message}`);
				process.exit(1);
			}
		});
}
