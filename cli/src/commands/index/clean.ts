import chalk from "chalk";
import type { Command } from "commander";
import { existsSync, unlinkSync } from "fs";
import { resolve } from "path";

function findWorkspaceRoot(): string | null {
	let dir = process.cwd();
	while (true) {
		if (existsSync(resolve(dir, ".codeforge"))) return dir;
		const parent = resolve(dir, "..");
		if (parent === dir) return null;
		dir = parent;
	}
}

export function registerIndexCleanCommand(parent: Command): void {
	parent
		.command("clean")
		.description("Remove the codebase index database")
		.option("--no-color", "Disable colored output")
		.action(async (options: { color?: boolean }) => {
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
					console.log("No index database found.");
					return;
				}

				// Remove main DB and WAL/SHM files
				unlinkSync(dbPath);
				const walPath = dbPath + "-wal";
				const shmPath = dbPath + "-shm";
				if (existsSync(walPath)) unlinkSync(walPath);
				if (existsSync(shmPath)) unlinkSync(shmPath);

				console.log("Index database removed.");
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err);
				console.error(`Error: ${message}`);
				process.exit(1);
			}
		});
}
