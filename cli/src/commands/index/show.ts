import chalk from "chalk";
import type { Command } from "commander";
import { existsSync } from "fs";
import { relative, resolve } from "path";
import {
	closeDatabase,
	getFileSymbols,
	openDatabase,
} from "../../indexer/db.js";
import { formatShowJson } from "../../output/index-json.js";
import { formatShowText } from "../../output/index-text.js";

interface ShowCommandOptions {
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

export function registerIndexShowCommand(parent: Command): void {
	parent
		.command("show")
		.description("Show all symbols in a specific file")
		.argument("<file>", "File path to inspect")
		.option("-f, --format <format>", "Output format: text|json", "text")
		.option("--no-color", "Disable colored output")
		.action(async (file: string, options: ShowCommandOptions) => {
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

				// Resolve file path relative to workspace root
				const absoluteFile = resolve(process.cwd(), file);
				const relativePath = relative(workspaceRoot, absoluteFile);

				const db = openDatabase(dbPath);
				const symbols = getFileSymbols(db, relativePath);

				if (symbols.length === 0) {
					console.log(`No symbols found for ${relativePath}`);
				} else if (options.format === "json") {
					console.log(formatShowJson(relativePath, symbols));
				} else {
					console.log(
						formatShowText(relativePath, symbols, { noColor: !options.color }),
					);
				}

				closeDatabase(db);
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err);
				console.error(`Error: ${message}`);
				process.exit(1);
			}
		});
}
