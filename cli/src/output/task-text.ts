import chalk from "chalk";
import type { TaskWithTeam } from "../loaders/task-loader.js";

export function colorStatus(status: string): string {
	switch (status) {
		case "pending":
			return chalk.yellow(status);
		case "in_progress":
			return chalk.cyan(status);
		case "completed":
			return chalk.green(status);
		default:
			return status;
	}
}

export function formatTaskText(
	tasks: TaskWithTeam[],
	options?: { noColor?: boolean; fullText?: boolean },
): string {
	if (options?.noColor) {
		chalk.level = 0;
	}

	const lines: string[] = [];

	for (const task of tasks) {
		const team = chalk.magenta(`[${task.team}]`);
		const id = `#${task.id}`;
		const status = colorStatus(task.status);
		lines.push(`${team} ${id}  ${status}  ${task.subject}`);

		if (task.description) {
			const desc = options?.fullText
				? task.description
				: task.description.length > 100
					? task.description.slice(0, 100) + "..."
					: task.description;
			lines.push(`  ${desc}`);
		}
	}

	lines.push("");
	lines.push(chalk.dim(`Found ${tasks.length} tasks`));

	return lines.join("\n");
}

export function formatTaskJson(tasks: TaskWithTeam[]): string {
	const output = tasks.map((t) => ({
		id: t.id,
		team: t.team,
		status: t.status,
		subject: t.subject,
		description: t.description,
		blocks: t.blocks,
		blockedBy: t.blockedBy,
	}));

	return JSON.stringify(output, null, 2);
}

export function formatTaskShowText(
	task: TaskWithTeam,
	options?: { noColor?: boolean },
): string {
	if (options?.noColor) {
		chalk.level = 0;
	}

	const lines: string[] = [];

	lines.push(`Team:        ${chalk.magenta(task.team)}`);
	lines.push(`Task:        #${task.id}`);
	lines.push(`Status:      ${colorStatus(task.status)}`);
	lines.push(`Subject:     ${task.subject}`);

	if (task.description) {
		lines.push("");
		lines.push("Description:");
		for (const line of task.description.split("\n")) {
			lines.push(`  ${line}`);
		}
	}

	lines.push("");
	const blocks =
		task.blocks.length > 0
			? task.blocks.map((b) => `#${b}`).join(", ")
			: "\u2014";
	lines.push(`Blocks:      ${blocks}`);

	const blockedBy =
		task.blockedBy.length > 0
			? task.blockedBy.map((b) => `#${b}`).join(", ")
			: "\u2014";
	lines.push(`Blocked by:  ${blockedBy}`);

	return lines.join("\n");
}

export function formatTaskShowJson(task: TaskWithTeam): string {
	return JSON.stringify(
		{
			id: task.id,
			team: task.team,
			status: task.status,
			subject: task.subject,
			description: task.description,
			blocks: task.blocks,
			blockedBy: task.blockedBy,
		},
		null,
		2,
	);
}
