import type { Database } from "bun:sqlite";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import {
	closeDatabase,
	insertFiles,
	insertSymbols,
	openDatabase,
	upsertFolders,
} from "../src/indexer/db.js";
import { extractFolderDocs } from "../src/indexer/folders.js";
import { collectDirectories } from "../src/indexer/scanner.js";
import {
	formatBuildJson,
	formatSearchJson,
	formatShowJson,
	formatStatsJson,
	formatTreeJson,
} from "../src/output/index-json.js";
import {
	formatBuildSummary,
	formatSearchText,
	formatShowText,
	formatStatsText,
	formatTreeText,
} from "../src/output/index-text.js";
import type {
	IndexedFile,
	IndexedFolder,
	IndexedSymbol,
	IndexStats,
	ScanResult,
	SearchHit,
	TreeEntry,
} from "../src/schemas/index.js";

// --- Helpers ---

function makeFile(overrides: Partial<IndexedFile> = {}): IndexedFile {
	return {
		path: "src/main.ts",
		hash: "abc123",
		size: 1024,
		language: "typescript",
		lineCount: 50,
		lastIndexed: "2026-03-08 12:00:00",
		...overrides,
	};
}

function makeSymbol(overrides: Partial<IndexedSymbol> = {}): IndexedSymbol {
	return {
		id: 1,
		name: "myFunction",
		kind: "function",
		filePath: "src/main.ts",
		lineStart: 10,
		lineEnd: 20,
		signature: "function myFunction(x: number): string",
		docstring: "Does something useful",
		parentName: null,
		exported: true,
		language: "typescript",
		...overrides,
	};
}

function makeHit(overrides: Partial<SearchHit> = {}): SearchHit {
	return {
		symbol: makeSymbol(),
		rank: -1.5,
		...overrides,
	};
}

// --- Output formatters: text ---

describe("formatSearchText", () => {
	test("formats search hits grouped by file", () => {
		const hits = [
			makeHit({ symbol: makeSymbol({ filePath: "a.ts", name: "foo" }) }),
			makeHit({
				symbol: makeSymbol({
					filePath: "a.ts",
					name: "bar",
					id: 2,
					lineStart: 30,
					lineEnd: 40,
				}),
			}),
			makeHit({ symbol: makeSymbol({ filePath: "b.ts", name: "baz", id: 3 }) }),
		];
		const output = formatSearchText(hits, { noColor: true });
		expect(output).toContain("a.ts");
		expect(output).toContain("b.ts");
		expect(output).toContain("foo");
		expect(output).toContain("bar");
		expect(output).toContain("baz");
		expect(output).toContain("3 results");
	});

	test("shows no results message for empty hits", () => {
		const output = formatSearchText([], { noColor: true });
		expect(output).toContain("No results");
	});

	test("truncates long docstrings", () => {
		const longDoc = "A".repeat(150);
		const hits = [makeHit({ symbol: makeSymbol({ docstring: longDoc }) })];
		const output = formatSearchText(hits, { noColor: true });
		expect(output).toContain("...");
	});
});

describe("formatShowText", () => {
	test("formats symbols for a file", () => {
		const symbols = [
			makeSymbol({ name: "alpha", exported: true }),
			makeSymbol({
				name: "beta",
				exported: false,
				id: 2,
				lineStart: 25,
				lineEnd: 35,
			}),
		];
		const output = formatShowText("src/main.ts", symbols, { noColor: true });
		expect(output).toContain("src/main.ts");
		expect(output).toContain("alpha");
		expect(output).toContain("beta");
		expect(output).toContain("exported");
		expect(output).toContain("local");
		expect(output).toContain("2 symbols");
	});

	test("shows no symbols message for empty list", () => {
		const output = formatShowText("src/empty.ts", [], { noColor: true });
		expect(output).toContain("No symbols");
	});
});

describe("formatStatsText", () => {
	test("formats stats with language breakdown", () => {
		const stats: IndexStats = {
			totalFiles: 42,
			totalSymbols: 150,
			totalFolders: 8,
			byLanguage: {
				typescript: { files: 30, symbols: 120 },
				python: { files: 12, symbols: 30 },
			},
			lastBuildTime: "2026-03-08 12:00:00",
			dbSizeBytes: 2048,
		};
		const output = formatStatsText(stats, { noColor: true });
		expect(output).toContain("42");
		expect(output).toContain("150");
		expect(output).toContain("8");
		expect(output).toContain("typescript");
		expect(output).toContain("python");
		expect(output).toContain("2026-03-08");
	});
});

describe("formatTreeText", () => {
	test("renders tree with hierarchy", () => {
		const entries: TreeEntry[] = [
			{
				path: "src",
				type: "folder",
				description: "Source code",
				symbolCount: 50,
				children: [{ path: "main.ts", type: "file", symbolCount: 10 }],
			},
		];
		const output = formatTreeText(entries, { noColor: true });
		expect(output).toContain("src");
		expect(output).toContain("main.ts");
		expect(output).toContain("Source code");
	});

	test("shows no entries message for empty list", () => {
		const output = formatTreeText([], { noColor: true });
		expect(output).toContain("No entries");
	});
});

describe("formatBuildSummary", () => {
	test("formats build results", () => {
		const result = {
			scanned: {
				newFiles: ["a.ts", "b.ts"],
				changedFiles: ["c.ts"],
				unchangedFiles: ["d.ts", "e.ts", "f.ts"],
				deletedFiles: [],
			},
			symbolCount: 42,
			durationMs: 1234,
		};
		const output = formatBuildSummary(result, { noColor: true });
		expect(output).toContain("2");
		expect(output).toContain("1");
		expect(output).toContain("3");
		expect(output).toContain("0");
		expect(output).toContain("42");
		expect(output).toContain("1234");
	});
});

// --- Output formatters: JSON ---

describe("formatSearchJson", () => {
	test("returns valid JSON with results array", () => {
		const hits = [makeHit()];
		const json = JSON.parse(formatSearchJson(hits));
		expect(json.results).toHaveLength(1);
		expect(json.total).toBe(1);
		expect(json.results[0].symbol.name).toBe("myFunction");
	});

	test("returns empty results for no hits", () => {
		const json = JSON.parse(formatSearchJson([]));
		expect(json.results).toHaveLength(0);
		expect(json.total).toBe(0);
	});
});

describe("formatShowJson", () => {
	test("returns valid JSON with file and symbols", () => {
		const symbols = [makeSymbol()];
		const json = JSON.parse(formatShowJson("src/main.ts", symbols));
		expect(json.file).toBe("src/main.ts");
		expect(json.symbols).toHaveLength(1);
		expect(json.total).toBe(1);
	});
});

describe("formatStatsJson", () => {
	test("returns valid JSON with all stats fields", () => {
		const stats: IndexStats = {
			totalFiles: 10,
			totalSymbols: 50,
			totalFolders: 3,
			byLanguage: { typescript: { files: 10, symbols: 50 } },
			lastBuildTime: "2026-03-08",
			dbSizeBytes: 4096,
		};
		const json = JSON.parse(formatStatsJson(stats));
		expect(json.totalFiles).toBe(10);
		expect(json.totalSymbols).toBe(50);
		expect(json.byLanguage.typescript.files).toBe(10);
	});
});

describe("formatTreeJson", () => {
	test("returns valid JSON with tree array", () => {
		const entries: TreeEntry[] = [
			{ path: "src", type: "folder", symbolCount: 5 },
		];
		const json = JSON.parse(formatTreeJson(entries));
		expect(json.tree).toHaveLength(1);
		expect(json.tree[0].path).toBe("src");
	});
});

describe("formatBuildJson", () => {
	test("returns valid JSON with counts", () => {
		const result = {
			scanned: {
				newFiles: ["a.ts"],
				changedFiles: [],
				unchangedFiles: ["b.ts"],
				deletedFiles: [],
			},
			symbolCount: 20,
			durationMs: 500,
		};
		const json = JSON.parse(formatBuildJson(result));
		expect(json.scanned.newFiles).toBe(1);
		expect(json.scanned.changedFiles).toBe(0);
		expect(json.totalSymbols).toBe(20);
		expect(json.durationMs).toBe(500);
	});
});

// --- Scanner: collectDirectories ---

describe("collectDirectories", () => {
	test("finds subdirectories recursively", async () => {
		const tmpDir = mkdtempSync(join(tmpdir(), "scan-test-"));
		mkdirSync(join(tmpDir, "src"), { recursive: true });
		mkdirSync(join(tmpDir, "src", "utils"), { recursive: true });
		mkdirSync(join(tmpDir, "tests"), { recursive: true });

		const dirs = await collectDirectories(tmpDir);
		expect(dirs).toContain("src");
		expect(dirs).toContain(join("src", "utils"));
		expect(dirs).toContain("tests");
	});

	test("ignores node_modules and .git", async () => {
		const tmpDir = mkdtempSync(join(tmpdir(), "scan-test-"));
		mkdirSync(join(tmpDir, "src"), { recursive: true });
		mkdirSync(join(tmpDir, "node_modules", "pkg"), { recursive: true });
		mkdirSync(join(tmpDir, ".git", "refs"), { recursive: true });
		mkdirSync(join(tmpDir, "dist"), { recursive: true });

		const dirs = await collectDirectories(tmpDir);
		expect(dirs).toContain("src");
		expect(dirs).not.toContain("node_modules");
		expect(dirs).not.toContain(".git");
		expect(dirs).not.toContain("dist");
	});
});

// --- Folders: extractFolderDocs ---

describe("extractFolderDocs", () => {
	test("extracts description from README.md", async () => {
		const tmpDir = mkdtempSync(join(tmpdir(), "folder-test-"));
		mkdirSync(join(tmpDir, "src"), { recursive: true });
		writeFileSync(
			join(tmpDir, "src", "README.md"),
			"# Source\n\nThis contains the main source code.\n\n## Details\nMore info here.",
		);

		const folders = await extractFolderDocs(["src"], tmpDir);
		expect(folders).toHaveLength(1);
		expect(folders[0].path).toBe("src");
		expect(folders[0].description).toBe("This contains the main source code.");
	});

	test("skips headings and badges to find first paragraph", async () => {
		const tmpDir = mkdtempSync(join(tmpdir(), "folder-test-"));
		mkdirSync(join(tmpDir, "lib"), { recursive: true });
		writeFileSync(
			join(tmpDir, "lib", "README.md"),
			"# Library\n\n![badge](url)\n\n[![badge2](url2)](link)\n\nActual description here.\n",
		);

		const folders = await extractFolderDocs(["lib"], tmpDir);
		expect(folders[0].description).toBe("Actual description here.");
	});

	test("returns null description when no README exists", async () => {
		const tmpDir = mkdtempSync(join(tmpdir(), "folder-test-"));
		mkdirSync(join(tmpDir, "empty"), { recursive: true });

		const folders = await extractFolderDocs(["empty"], tmpDir);
		expect(folders[0].description).toBeNull();
	});

	test("uses YAML overrides when available", async () => {
		const tmpDir = mkdtempSync(join(tmpdir(), "folder-test-"));
		mkdirSync(join(tmpDir, "src"), { recursive: true });
		mkdirSync(join(tmpDir, ".codeforge", "data"), { recursive: true });
		writeFileSync(
			join(tmpDir, "src", "README.md"),
			"# Source\n\nREADME description.\n",
		);
		writeFileSync(
			join(tmpDir, ".codeforge", "data", "folders.yaml"),
			'src: "Override description from YAML"\n',
		);

		const folders = await extractFolderDocs(["src"], tmpDir);
		expect(folders[0].description).toBe("Override description from YAML");
	});

	test("counts recognized files in directory", async () => {
		const tmpDir = mkdtempSync(join(tmpdir(), "folder-test-"));
		mkdirSync(join(tmpDir, "src"), { recursive: true });
		writeFileSync(join(tmpDir, "src", "a.ts"), "");
		writeFileSync(join(tmpDir, "src", "b.js"), "");
		writeFileSync(join(tmpDir, "src", "c.py"), "");
		writeFileSync(join(tmpDir, "src", "d.md"), ""); // not recognized

		const folders = await extractFolderDocs(["src"], tmpDir);
		expect(folders[0].fileCount).toBe(3);
	});
});
