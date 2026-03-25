import chalk from "chalk";
import type { Command } from "commander";
import { loadTasks } from "../../loaders/task-loader.js";
import { formatTaskJson, formatTaskText } from "../../output/task-text.js";

interface TaskListOptions {
	team?: string;
	status?: string;
	limit: string;
	format: string;
	color?: boolean;
	fullText?: boolean;
}

export function registerTaskListCommand(parent: Command): void {
	parent
		.command("list")
		.description("List all tasks")
		.option("--team <name>", "Filter by team name")
		.option("--status <status>", "Filter by task status")
		.option("-n, --limit <count>", "Maximum number of results", "50")
		.option("-f, --format <format>", "Output format: text|json", "text")
		.option("--no-color", "Disable colored output")
		.option("--full-text", "Disable description truncation")
		.action(async (options: TaskListOptions) => {
			try {
				if (!options.color) {
					chalk.level = 0;
				}

				let tasks = await loadTasks({
					team: options.team,
					status: options.status,
				});

				// Apply limit
				const limit = parseInt(options.limit, 10);
				tasks = tasks.slice(0, limit);

				if (options.format === "json") {
					console.log(formatTaskJson(tasks));
				} else {
					console.log(
						formatTaskText(tasks, {
							noColor: !options.color,
							fullText: options.fullText,
						}),
					);
				}
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err);
				console.error(`Error: ${message}`);
				process.exit(1);
			}
		});
}
