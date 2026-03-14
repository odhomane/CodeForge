export type SymbolKind =
	| "function"
	| "class"
	| "interface"
	| "type"
	| "const"
	| "method"
	| "enum";

export interface IndexedFile {
	path: string;
	hash: string;
	size: number;
	language: string;
	lineCount: number;
	lastIndexed: string;
}

export interface IndexedFolder {
	path: string;
	description: string | null;
	fileCount: number;
	lastIndexed: string;
}

export interface IndexedSymbol {
	id: number;
	name: string;
	kind: SymbolKind;
	filePath: string;
	lineStart: number;
	lineEnd: number;
	signature: string | null;
	docstring: string | null;
	parentName: string | null;
	exported: boolean;
	language: string;
}

export interface ScanResult {
	newFiles: string[];
	changedFiles: string[];
	unchangedFiles: string[];
	deletedFiles: string[];
}

export interface IndexStats {
	totalFiles: number;
	totalSymbols: number;
	totalFolders: number;
	byLanguage: Record<string, { files: number; symbols: number }>;
	lastBuildTime: string | null;
	dbSizeBytes: number;
}

export interface SearchHit {
	symbol: IndexedSymbol;
	rank: number;
}

export interface TreeEntry {
	path: string;
	type: "file" | "folder";
	description?: string;
	symbolCount: number;
	children?: TreeEntry[];
}

export type BuildProgressCallback = (
	phase: string,
	current: number,
	total: number,
) => void;
