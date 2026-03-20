import { homedir } from "node:os";
import { resolve } from "node:path";

export interface TaskItem {
	id: string;
	subject: string;
	description: string;
	activeForm?: string;
	owner?: string;
	status: string;
	blocks: string[];
	blockedBy: string[];
}

export async function loadTasksByTeam(teamName: string): Promise<TaskItem[]> {
	const basePath = resolve(homedir(), ".claude/tasks", teamName);
	const tasks: TaskItem[] = [];

	try {
		const glob = new Bun.Glob("*.json");
		for await (const entry of glob.scan({ cwd: basePath, absolute: false })) {
			const filePath = resolve(basePath, entry);
			try {
				const content = await Bun.file(filePath).text();
				const parsed = JSON.parse(content) as TaskItem;
				tasks.push(parsed);
			} catch {
				// Skip files that can't be read or parsed
			}
		}
	} catch {
		return [];
	}

	return tasks;
}

export async function loadAllTeamNames(): Promise<string[]> {
	const basePath = resolve(homedir(), ".claude/tasks");
	const teams: string[] = [];

	try {
		const glob = new Bun.Glob("*/*.json");
		const seen = new Set<string>();
		for await (const entry of glob.scan({ cwd: basePath, absolute: false })) {
			const teamDir = entry.split("/")[0];
			if (teamDir && !seen.has(teamDir)) {
				seen.add(teamDir);
				teams.push(teamDir);
			}
		}
	} catch {
		return [];
	}

	return teams;
}
