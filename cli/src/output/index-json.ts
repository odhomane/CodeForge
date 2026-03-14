import type {
	IndexedSymbol,
	IndexStats,
	ScanResult,
	SearchHit,
	TreeEntry,
} from "../schemas/index.js";

export function formatSearchJson(hits: SearchHit[]): string {
	return JSON.stringify({ results: hits, total: hits.length }, null, 2);
}

export function formatShowJson(
	filePath: string,
	symbols: IndexedSymbol[],
): string {
	return JSON.stringify(
		{ file: filePath, symbols, total: symbols.length },
		null,
		2,
	);
}

export function formatStatsJson(stats: IndexStats): string {
	return JSON.stringify(stats, null, 2);
}

export function formatTreeJson(entries: TreeEntry[]): string {
	return JSON.stringify({ tree: entries }, null, 2);
}

export function formatBuildJson(result: {
	scanned: ScanResult;
	symbolCount: number;
	durationMs: number;
}): string {
	return JSON.stringify(
		{
			scanned: {
				newFiles: result.scanned.newFiles.length,
				changedFiles: result.scanned.changedFiles.length,
				unchangedFiles: result.scanned.unchangedFiles.length,
				deletedFiles: result.scanned.deletedFiles.length,
			},
			totalSymbols: result.symbolCount,
			durationMs: result.durationMs,
		},
		null,
		2,
	);
}
