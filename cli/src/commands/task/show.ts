import chalk from "chalk";
import type { Command } from "commander";
import { loadTasks } from "../../loaders/task-loader.js";
import {
	formatTaskShowJson,
	formatTaskShowText,
} from "../../output/task-text.js";

interface TaskShowOptions {
	team?: string;
	format: string;
	color?: boolean;
}

export function registerTaskShowCommand(parent: Command): void {
	parent
		.command("show")
		.description("Show a single task with full detail")
		.argument("<id>", "Task ID to look up")
		.option("--team <name>", "Filter by team name")
		.option("-f, --format <format>", "Output format: text|json", "text")
		.option("--no-color", "Disable colored output")
		.action(async (id: string, options: TaskShowOptions) => {
			try {
				if (!options.color) {
					chalk.level = 0;
				}

				const tasks = await loadTasks({ team: options.team });
				const task = tasks.find((t) => t.id === id);

				if (!task) {
					console.error(`Error: Task #${id} not found`);
					process.exit(1);
				}

				if (options.format === "json") {
					console.log(formatTaskShowJson(task));
				} else {
					console.log(formatTaskShowText(task, { noColor: !options.color }));
				}
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err);
				console.error(`Error: ${message}`);
				process.exit(1);
			}
		});
}
