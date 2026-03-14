import { existsSync, readdirSync, readFileSync } from "fs";
import { extname, join } from "path";
import type { IndexedFolder } from "../schemas/index.js";

const RECOGNIZED_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".py"]);

function extractFirstParagraph(markdown: string): string | null {
	const lines = markdown.split("\n");
	const paragraphLines: string[] = [];
	let inParagraph = false;

	for (const line of lines) {
		const trimmed = line.trim();

		// Skip headings, badges (images), and empty lines before paragraph
		if (!inParagraph) {
			if (
				trimmed === "" ||
				trimmed.startsWith("#") ||
				trimmed.startsWith("![") ||
				trimmed.startsWith("[![") ||
				trimmed.startsWith("---") ||
				trimmed.startsWith("===")
			) {
				continue;
			}
			// Start of paragraph
			inParagraph = true;
			paragraphLines.push(trimmed);
		} else {
			// End of paragraph on empty line
			if (trimmed === "") break;
			paragraphLines.push(trimmed);
		}
	}

	if (paragraphLines.length === 0) return null;
	return paragraphLines.join(" ");
}

function loadFolderOverrides(workspaceRoot: string): Map<string, string> {
	const overrides = new Map<string, string>();
	const overridePath = join(
		workspaceRoot,
		".codeforge",
		"data",
		"folders.yaml",
	);

	if (!existsSync(overridePath)) return overrides;

	try {
		const content = readFileSync(overridePath, "utf-8");
		for (const line of content.split("\n")) {
			const trimmed = line.trim();
			if (trimmed === "" || trimmed.startsWith("#")) continue;

			const colonIndex = trimmed.indexOf(": ");
			if (colonIndex === -1) continue;

			const key = trimmed.substring(0, colonIndex).trim();
			const value = trimmed.substring(colonIndex + 2).trim();
			// Remove optional surrounding quotes
			overrides.set(key, value.replace(/^["']|["']$/g, ""));
		}
	} catch {
		// If file can't be read, return empty overrides
	}

	return overrides;
}

function countRecognizedFiles(dirPath: string): number {
	try {
		const entries = readdirSync(dirPath, { withFileTypes: true });
		let count = 0;
		for (const entry of entries) {
			if (entry.isFile() && RECOGNIZED_EXTENSIONS.has(extname(entry.name))) {
				count++;
			}
		}
		return count;
	} catch {
		return 0;
	}
}

export async function extractFolderDocs(
	directories: string[],
	workspaceRoot: string,
): Promise<IndexedFolder[]> {
	const overrides = loadFolderOverrides(workspaceRoot);
	const now = new Date().toISOString().replace("T", " ").substring(0, 19);
	const folders: IndexedFolder[] = [];

	for (const relDir of directories) {
		const absDir = join(workspaceRoot, relDir);
		let description: string | null = null;

		// Check for manual override first
		if (overrides.has(relDir)) {
			description = overrides.get(relDir)!;
		} else {
			// Try README.md
			const readmePath = join(absDir, "README.md");
			if (existsSync(readmePath)) {
				try {
					const content = readFileSync(readmePath, "utf-8");
					description = extractFirstParagraph(content);
				} catch {
					// Ignore read errors
				}
			}
		}

		const fileCount = countRecognizedFiles(absDir);

		folders.push({
			path: relDir,
			description,
			fileCount,
			lastIndexed: now,
		});
	}

	return folders;
}
