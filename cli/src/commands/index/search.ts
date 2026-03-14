import chalk from "chalk";
import type { Command } from "commander";
import { existsSync, mkdirSync } from "fs";
import { relative, resolve } from "path";
import { createInterface } from "readline";
import {
	closeDatabase,
	deleteFileAndSymbols,
	insertFiles,
	insertSymbols,
	openDatabase,
	rebuildFts,
	searchSymbols,
	upsertFolders,
} from "../../indexer/db.js";
import { checkSgInstalled, extractSymbols } from "../../indexer/extractor.js";
import { extractFolderDocs } from "../../indexer/folders.js";
import {
	collectDirectories,
	getLanguageForExtension,
	hashFileContent,
	scanDirectory,
} from "../../indexer/scanner.js";
import { formatSearchJson } from "../../output/index-json.js";
import {
	formatBuildSummary,
	formatSearchText,
} from "../../output/index-text.js";
import type {
	IndexedFile,
	SearchHit,
	SymbolKind,
} from "../../schemas/index.js";

interface SearchCommandOptions {
	format: string;
	color?: boolean;
	limit: string;
	kind?: string;
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

async function autoBuild(workspaceRoot: string, dbPath: string): Promise<void> {
	const dataDir = resolve(workspaceRoot, ".codeforge", "data");
	mkdirSync(dataDir, { recursive: true });

	const sgInstalled = await checkSgInstalled();
	if (!sgInstalled) {
		console.error(
			"Error: ast-grep (sg) is not installed. Install it with: npm i -g @ast-grep/cli",
		);
		process.exit(1);
	}

	console.error(chalk.dim("Building index..."));
	const start = Date.now();
	const db = openDatabase(dbPath);
	const scanned = await scanDirectory(workspaceRoot, db);

	const filesToProcess = [...scanned.newFiles, ...scanned.changedFiles];
	let totalSymbols = 0;

	for (const file of [...scanned.changedFiles, ...scanned.deletedFiles]) {
		deleteFileAndSymbols(db, file);
	}

	// Insert file records first (symbols have FK to files)
	const fileRecords: IndexedFile[] = [];
	for (const relPath of filesToProcess) {
		const absPath = resolve(workspaceRoot, relPath);
		const ext = "." + (relPath.split(".").pop() ?? "");
		const lang = getLanguageForExtension(ext) ?? "unknown";
		const hash = await hashFileContent(absPath);
		const content = await Bun.file(absPath).text();
		const lineCount = content.split("\n").length;
		const size = Buffer.byteLength(content, "utf-8");
		fileRecords.push({
			path: relPath,
			hash,
			size,
			language: lang,
			lineCount,
			lastIndexed: new Date().toISOString().replace("T", " ").substring(0, 19),
		});
	}
	insertFiles(db, fileRecords);

	// Group by language and extract symbols
	const byLang = new Map<string, string[]>();
	for (const relPath of filesToProcess) {
		const ext = "." + (relPath.split(".").pop() ?? "");
		const lang = getLanguageForExtension(ext);
		if (lang) {
			const group = byLang.get(lang) ?? [];
			group.push(relPath);
			byLang.set(lang, group);
		}
	}

	for (const [lang, relPaths] of byLang) {
		const absPaths = relPaths.map((r) => resolve(workspaceRoot, r));
		const symbols = await extractSymbols(absPaths, lang);
		if (symbols.length > 0) {
			const remapped = symbols.map((s: (typeof symbols)[number]) => ({
				...s,
				filePath: relative(workspaceRoot, s.filePath),
			}));
			insertSymbols(db, remapped);
			totalSymbols += symbols.length;
		}
	}

	const directories = await collectDirectories(workspaceRoot);
	const folderDocs = await extractFolderDocs(directories, workspaceRoot);
	upsertFolders(db, folderDocs);
	rebuildFts(db);
	closeDatabase(db);

	const durationMs = Date.now() - start;
	console.error(
		formatBuildSummary({ scanned, symbolCount: totalSymbols, durationMs }),
	);
}

export function registerIndexSearchCommand(parent: Command): void {
	parent
		.command("search")
		.description("Search for symbols in the codebase index")
		.argument("<query>", "Search query (FTS5 syntax)")
		.option("-f, --format <format>", "Output format: text|json", "text")
		.option("--no-color", "Disable colored output")
		.option("-n, --limit <count>", "Maximum number of results", "50")
		.option("-k, --kind <kind>", "Filter by symbol kind")
		.action(async (query: string, options: SearchCommandOptions) => {
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
					const rl = createInterface({
						input: process.stdin,
						output: process.stderr,
					});
					const answer = await new Promise<string>((resolve) =>
						rl.question("No index found. Build one now? (y/n) ", resolve),
					);
					rl.close();

					if (answer.toLowerCase() === "y") {
						await autoBuild(workspaceRoot, dbPath);
					} else {
						console.error(
							"Run `codeforge index build` to create an index first.",
						);
						process.exit(0);
					}
				}

				const db = openDatabase(dbPath);
				const limit = parseInt(options.limit, 10);
				let hits: SearchHit[] = searchSymbols(db, query, limit);

				if (options.kind) {
					const kind = options.kind as SymbolKind;
					hits = hits.filter((h) => h.symbol.kind === kind);
				}

				if (options.format === "json") {
					console.log(formatSearchJson(hits));
				} else {
					console.log(formatSearchText(hits, { noColor: !options.color }));
				}

				closeDatabase(db);
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err);
				console.error(`Error: ${message}`);
				process.exit(1);
			}
		});
}
