import { homedir } from "node:os";
import { basename, join, resolve } from "node:path";
import type { ContextFile, SessionContext } from "./types.js";

async function tryReadFile(
	path: string,
	scope: ContextFile["scope"],
): Promise<ContextFile | null> {
	try {
		const content = await Bun.file(path).text();
		return { scope, path, filename: basename(path), content };
	} catch {
		return null;
	}
}

async function globFiles(
	dir: string,
	scope: ContextFile["scope"],
): Promise<ContextFile[]> {
	const results: ContextFile[] = [];
	try {
		const glob = new Bun.Glob("*.md");
		for await (const entry of glob.scan({
			cwd: dir,
			absolute: true,
		})) {
			try {
				const content = await Bun.file(entry).text();
				results.push({
					scope,
					path: entry,
					filename: basename(entry),
					content,
				});
			} catch {
				// Skip unreadable files
			}
		}
	} catch {
		// Directory doesn't exist — skip
	}
	return results;
}

export async function loadSessionContext(
	projectPath: string,
	encodedName: string,
): Promise<SessionContext> {
	const home = homedir();
	const memories: ContextFile[] = [];
	const rules: ContextFile[] = [];

	// User-level CLAUDE.md
	const userClaude = await tryReadFile(
		resolve(home, ".claude/CLAUDE.md"),
		"user",
	);
	if (userClaude) memories.push(userClaude);

	// Project-level CLAUDE.md (root)
	const projectClaude = await tryReadFile(
		join(projectPath, "CLAUDE.md"),
		"project",
	);
	if (projectClaude) memories.push(projectClaude);

	// Project-level CLAUDE.md (.claude subdirectory)
	const projectDotClaude = await tryReadFile(
		join(projectPath, ".claude/CLAUDE.md"),
		"project",
	);
	if (projectDotClaude) memories.push(projectDotClaude);

	// Auto-memory MEMORY.md — project-local first (autoMemoryDirectory), then home-dir default
	const localMemory = await tryReadFile(
		join(projectPath, ".claude/memory/MEMORY.md"),
		"auto-memory",
	);
	if (localMemory) memories.push(localMemory);

	const homeMemory = await tryReadFile(
		resolve(home, ".claude/projects", encodedName, "memory/MEMORY.md"),
		"auto-memory",
	);
	if (homeMemory) memories.push(homeMemory);

	// User-level rules
	const userRules = await globFiles(
		resolve(home, ".claude/rules"),
		"user-rules",
	);
	rules.push(...userRules);

	// Project-level rules
	const projectRules = await globFiles(
		join(projectPath, ".claude/rules"),
		"project-rules",
	);
	rules.push(...projectRules);

	return { memories, rules };
}
