import chalk from "chalk";
import type {
	IndexedSymbol,
	IndexStats,
	ScanResult,
	SearchHit,
	SymbolKind,
	TreeEntry,
} from "../schemas/index.js";

const KIND_ICONS: Record<
	SymbolKind,
	{ icon: string; color: (s: string) => string }
> = {
	function: { icon: "\u0192", color: chalk.cyan },
	class: { icon: "C", color: chalk.yellow },
	interface: { icon: "I", color: chalk.green },
	type: { icon: "T", color: chalk.magenta },
	const: { icon: "c", color: chalk.blue },
	method: { icon: "m", color: (s: string) => chalk.cyan(chalk.dim(s)) },
	enum: { icon: "E", color: chalk.yellow },
};

function kindLabel(kind: SymbolKind): string {
	const k = KIND_ICONS[kind];
	return k ? k.color(`${k.icon} ${kind}`) : kind;
}

export function formatSearchText(
	hits: SearchHit[],
	options: { noColor?: boolean } = {},
): string {
	if (options.noColor) chalk.level = 0;

	if (hits.length === 0) return chalk.dim("No results found.");

	const lines: string[] = [];

	// Group by file
	const byFile = new Map<string, SearchHit[]>();
	for (const hit of hits) {
		const group = byFile.get(hit.symbol.filePath) ?? [];
		group.push(hit);
		byFile.set(hit.symbol.filePath, group);
	}

	for (const [filePath, fileHits] of byFile) {
		lines.push(chalk.bold.underline(filePath));
		for (const hit of fileHits) {
			const { symbol } = hit;
			const loc = chalk.dim(`:${symbol.lineStart}-${symbol.lineEnd}`);
			const sig = symbol.signature ? chalk.dim(` ${symbol.signature}`) : "";
			lines.push(
				`  ${kindLabel(symbol.kind)}  ${chalk.bold(symbol.name)}${loc}${sig}`,
			);
			if (symbol.docstring) {
				const preview =
					symbol.docstring.length > 100
						? symbol.docstring.slice(0, 100) + "..."
						: symbol.docstring;
				lines.push(`    ${chalk.dim(preview)}`);
			}
		}
		lines.push("");
	}

	lines.push(chalk.dim(`${hits.length} result${hits.length === 1 ? "" : "s"}`));
	return lines.join("\n");
}

export function formatShowText(
	filePath: string,
	symbols: IndexedSymbol[],
	options: { noColor?: boolean } = {},
): string {
	if (options.noColor) chalk.level = 0;

	const lines: string[] = [];
	lines.push(chalk.bold.underline(filePath));

	if (symbols.length === 0) {
		lines.push(chalk.dim("  No symbols found."));
		return lines.join("\n");
	}

	for (const sym of symbols) {
		const exported = sym.exported
			? chalk.green("exported")
			: chalk.dim("local");
		const loc = chalk.dim(`L${sym.lineStart}-${sym.lineEnd}`);
		const parent = sym.parentName ? chalk.dim(` (${sym.parentName})`) : "";
		lines.push(
			`  ${kindLabel(sym.kind)}  ${chalk.bold(sym.name)}  ${loc}  ${exported}${parent}`,
		);
		if (sym.signature) {
			lines.push(`    ${chalk.dim(sym.signature)}`);
		}
	}

	lines.push("");
	lines.push(
		chalk.dim(`${symbols.length} symbol${symbols.length === 1 ? "" : "s"}`),
	);
	return lines.join("\n");
}

export function formatStatsText(
	stats: IndexStats,
	options: { noColor?: boolean } = {},
): string {
	if (options.noColor) chalk.level = 0;

	const lines: string[] = [];

	lines.push(chalk.bold("Codebase Index Statistics"));
	lines.push("\u2550".repeat(27));
	lines.push(`Total files:      ${stats.totalFiles}`);
	lines.push(`Total symbols:    ${stats.totalSymbols}`);
	lines.push(`Total folders:    ${stats.totalFolders}`);
	lines.push(`Database size:    ${formatBytes(stats.dbSizeBytes)}`);
	if (stats.lastBuildTime) {
		lines.push(`Last build:       ${stats.lastBuildTime}`);
	}

	if (Object.keys(stats.byLanguage).length > 0) {
		lines.push("");
		lines.push(chalk.bold("By language:"));
		const sorted = Object.entries(stats.byLanguage).sort(
			([, a], [, b]) => b.symbols - a.symbols,
		);
		for (const [lang, counts] of sorted) {
			lines.push(
				`  ${lang.padEnd(14)} ${String(counts.files).padStart(5)} files  ${String(counts.symbols).padStart(6)} symbols`,
			);
		}
	}

	return lines.join("\n");
}

function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatTreeText(
	entries: TreeEntry[],
	options: { noColor?: boolean } = {},
): string {
	if (options.noColor) chalk.level = 0;

	if (entries.length === 0) return chalk.dim("No entries found.");

	const lines: string[] = [];
	renderTreeEntries(entries, lines, "");
	return lines.join("\n");
}

function renderTreeEntries(
	entries: TreeEntry[],
	lines: string[],
	prefix: string,
): void {
	for (let i = 0; i < entries.length; i++) {
		const entry = entries[i];
		const isLast = i === entries.length - 1;
		const connector = isLast ? "\u2514\u2500\u2500" : "\u251C\u2500\u2500";
		const childPrefix = isLast ? "    " : "\u2502   ";

		const icon =
			entry.type === "folder" ? chalk.blue("\u25B8") : chalk.dim("\u25AA");
		const name = entry.type === "folder" ? chalk.bold(entry.path) : entry.path;
		const count = chalk.dim(` (${entry.symbolCount})`);
		const desc = entry.description ? chalk.dim(` - ${entry.description}`) : "";

		lines.push(`${prefix}${connector} ${icon} ${name}${count}${desc}`);

		if (entry.children && entry.children.length > 0) {
			renderTreeEntries(entry.children, lines, prefix + childPrefix);
		}
	}
}

export function formatBuildSummary(
	result: { scanned: ScanResult; symbolCount: number; durationMs: number },
	options: { noColor?: boolean } = {},
): string {
	if (options.noColor) chalk.level = 0;

	const { scanned, symbolCount, durationMs } = result;
	const lines: string[] = [];

	lines.push(chalk.bold("Index Build Complete"));
	lines.push("\u2550".repeat(21));
	lines.push(
		`New files:        ${chalk.green(String(scanned.newFiles.length))}`,
	);
	lines.push(
		`Changed files:    ${chalk.yellow(String(scanned.changedFiles.length))}`,
	);
	lines.push(
		`Unchanged files:  ${chalk.dim(String(scanned.unchangedFiles.length))}`,
	);
	lines.push(
		`Deleted files:    ${chalk.red(String(scanned.deletedFiles.length))}`,
	);
	lines.push(`Total symbols:    ${symbolCount}`);
	lines.push(`Duration:         ${durationMs}ms`);

	return lines.join("\n");
}
