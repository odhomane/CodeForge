import { statSync } from "fs";
import { homedir } from "os";
import { basename, resolve } from "path";
import type { ProjectInfo, SubagentFileInfo } from "./types.js";

export function decodeProjectPath(dirName: string): string {
	// Strip leading dash
	const stripped = dirName.startsWith("-") ? dirName.slice(1) : dirName;

	// Handle worktree paths: double-dash separates project from worktree
	const worktreeIdx = stripped.indexOf("--claude-worktrees-");
	const projectPart =
		worktreeIdx >= 0 ? stripped.slice(0, worktreeIdx) : stripped;

	// Replace remaining single dashes with /
	return "/" + projectPart.replace(/-/g, "/");
}

export async function detectProjects(): Promise<ProjectInfo[]> {
	const projectsDir = resolve(homedir(), ".claude/projects");
	const projects: ProjectInfo[] = [];

	const glob = new Bun.Glob("*");
	const dirs: string[] = [];

	try {
		for await (const entry of glob.scan({
			cwd: projectsDir,
			onlyFiles: false,
		})) {
			dirs.push(entry);
		}
	} catch {
		return [];
	}

	for (const dirName of dirs) {
		const dirPath = resolve(projectsDir, dirName);
		try {
			const stat = statSync(dirPath);
			if (!stat.isDirectory()) continue;
		} catch {
			continue;
		}

		const decodedPath = decodeProjectPath(dirName);
		const sessionFiles: string[] = [];

		const jsonlGlob = new Bun.Glob("*.jsonl");
		try {
			for await (const file of jsonlGlob.scan({
				cwd: dirPath,
				absolute: true,
			})) {
				sessionFiles.push(file);
			}
		} catch {
			// Skip unreadable directories
		}

		const subagentGlob = new Bun.Glob("*/subagents/*.jsonl");
		const subagentFiles: SubagentFileInfo[] = [];
		try {
			for await (const file of subagentGlob.scan({
				cwd: dirPath,
				absolute: true,
			})) {
				const rel = file.slice(dirPath.length + 1);
				const parts = rel.split("/");
				if (parts.length >= 3) {
					subagentFiles.push({
						filePath: file,
						parentSessionId: parts[0],
						agentFileId: basename(parts[2], ".jsonl"),
					});
				}
			}
		} catch {
			// Skip unreadable directories
		}

		// Sort by mtime descending
		sessionFiles.sort((a, b) => {
			try {
				return statSync(b).mtimeMs - statSync(a).mtimeMs;
			} catch {
				return 0;
			}
		});

		projects.push({
			path: decodedPath,
			encodedName: dirName,
			sessionFiles,
			subagentFiles,
		});
	}

	return projects;
}
