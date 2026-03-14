import chalk from "chalk";
import type { Command } from "commander";
import { existsSync } from "fs";
import { resolve } from "path";
import {
	closeDatabase,
	getAllFolders,
	openDatabase,
} from "../../indexer/db.js";
import { formatTreeJson } from "../../output/index-json.js";
import { formatTreeText } from "../../output/index-text.js";
import type { IndexedFolder, TreeEntry } from "../../schemas/index.js";

interface TreeCommandOptions {
	format: string;
	color?: boolean;
	depth?: string;
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

function buildTree(
	folders: IndexedFolder[],
	symbolCounts: Map<string, number>,
	pathFilter?: string,
	maxDepth?: number,
): TreeEntry[] {
	// Filter folders by path prefix if specified
	let filtered = folders;
	if (pathFilter) {
		filtered = folders.filter(
			(f) => f.path === pathFilter || f.path.startsWith(pathFilter + "/"),
		);
	}

	// Build nested tree from flat folder list
	const root: TreeEntry[] = [];
	const nodeMap = new Map<string, TreeEntry>();

	// Sort folders so parents come before children
	const sorted = [...filtered].sort((a, b) => a.path.localeCompare(b.path));

	for (const folder of sorted) {
		const entry: TreeEntry = {
			path: folder.path.split("/").pop() ?? folder.path,
			type: "folder",
			description: folder.description ?? undefined,
			symbolCount: symbolCounts.get(folder.path) ?? 0,
			children: [],
		};

		nodeMap.set(folder.path, entry);

		// Find parent
		const parts = folder.path.split("/");
		if (parts.length > 1) {
			const parentPath = parts.slice(0, -1).join("/");
			const parent = nodeMap.get(parentPath);
			if (parent) {
				parent.children!.push(entry);
				continue;
			}
		}

		root.push(entry);
	}

	// Apply depth limit
	if (maxDepth !== undefined) {
		pruneDepth(root, 0, maxDepth);
	}

	return root;
}

function pruneDepth(entries: TreeEntry[], current: number, max: number): void {
	for (const entry of entries) {
		if (current >= max) {
			entry.children = undefined;
		} else if (entry.children) {
			pruneDepth(entry.children, current + 1, max);
		}
	}
}

export function registerIndexTreeCommand(parent: Command): void {
	parent
		.command("tree")
		.description("Show directory tree with symbol counts")
		.argument("[path]", "Subtree path to display")
		.option("-f, --format <format>", "Output format: text|json", "text")
		.option("--no-color", "Disable colored output")
		.option("-d, --depth <n>", "Maximum tree depth")
		.action(async (path: string | undefined, options: TreeCommandOptions) => {
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
				const folders = getAllFolders(db);

				// Count symbols per folder by prefix-matching file paths
				const symbolCounts = new Map<string, number>();
				for (const folder of folders) {
					const prefix = folder.path.endsWith("/")
						? folder.path
						: folder.path + "/";
					const rows = db
						.prepare(
							"SELECT COUNT(*) as cnt FROM symbols WHERE file_path LIKE ? || '%'",
						)
						.get(prefix) as { cnt: number };
					symbolCounts.set(folder.path, rows.cnt);
				}

				const maxDepth = options.depth
					? parseInt(options.depth, 10)
					: undefined;
				const tree = buildTree(folders, symbolCounts, path, maxDepth);

				if (options.format === "json") {
					console.log(formatTreeJson(tree));
				} else {
					console.log(formatTreeText(tree, { noColor: !options.color }));
				}

				closeDatabase(db);
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err);
				console.error(`Error: ${message}`);
				process.exit(1);
			}
		});
}
