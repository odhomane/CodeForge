import type { Database } from "bun:sqlite";
import { readdirSync, readFileSync, statSync } from "fs";
import { extname, join, relative } from "path";
import type { ScanResult } from "../schemas/index.js";
import { getFileByPath } from "./db.js";

const EXTENSION_MAP: Record<string, string> = {
	".ts": "typescript",
	".tsx": "typescript",
	".js": "javascript",
	".jsx": "javascript",
	".py": "python",
};

const IGNORE_DIRS = new Set([
	"node_modules",
	".git",
	"dist",
	"build",
	"__pycache__",
	".next",
	".venv",
	"venv",
	"coverage",
]);

export function getLanguageForExtension(ext: string): string | null {
	return EXTENSION_MAP[ext] ?? null;
}

export async function hashFileContent(filePath: string): Promise<string> {
	const content = readFileSync(filePath);
	const hasher = new Bun.CryptoHasher("sha256");
	hasher.update(content);
	return hasher.digest("hex");
}

function walkDirectory(dir: string, results: string[]): void {
	let entries;
	try {
		entries = readdirSync(dir, { withFileTypes: true });
	} catch {
		return;
	}

	for (const entry of entries) {
		if (entry.isDirectory()) {
			if (!IGNORE_DIRS.has(entry.name)) {
				walkDirectory(join(dir, entry.name), results);
			}
		} else if (entry.isFile()) {
			const ext = extname(entry.name);
			if (EXTENSION_MAP[ext]) {
				results.push(join(dir, entry.name));
			}
		}
	}
}

export async function scanDirectory(
	targetPath: string,
	db: Database,
	rootPath?: string,
): Promise<ScanResult> {
	const baseForRelative = rootPath ?? targetPath;
	const allFiles: string[] = [];
	walkDirectory(targetPath, allFiles);

	const relativePaths = allFiles.map((f) => relative(baseForRelative, f));

	const newFiles: string[] = [];
	const changedFiles: string[] = [];
	const unchangedFiles: string[] = [];

	for (let i = 0; i < relativePaths.length; i++) {
		const relPath = relativePaths[i];
		const absPath = allFiles[i];
		const hash = await hashFileContent(absPath);
		const existing = getFileByPath(db, relPath);

		if (!existing) {
			newFiles.push(relPath);
		} else if (existing.hash !== hash) {
			changedFiles.push(relPath);
		} else {
			unchangedFiles.push(relPath);
		}
	}

	// Find deleted files: in DB but not on disk
	const diskSet = new Set(relativePaths);
	const allDbFiles = db.prepare("SELECT path FROM files").all() as Array<{
		path: string;
	}>;
	const deletedFiles = allDbFiles
		.map((row) => row.path)
		.filter((p) => !diskSet.has(p));

	return { newFiles, changedFiles, unchangedFiles, deletedFiles };
}

export async function collectDirectories(
	targetPath: string,
	rootPath?: string,
): Promise<string[]> {
	const baseForRelative = rootPath ?? targetPath;
	const dirs: string[] = [];

	function walk(dir: string): void {
		let entries;
		try {
			entries = readdirSync(dir, { withFileTypes: true });
		} catch {
			return;
		}

		for (const entry of entries) {
			if (entry.isDirectory() && !IGNORE_DIRS.has(entry.name)) {
				const fullPath = join(dir, entry.name);
				dirs.push(relative(baseForRelative, fullPath));
				walk(fullPath);
			}
		}
	}

	walk(targetPath);
	return dirs;
}
