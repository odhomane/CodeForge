import type { Database } from "bun:sqlite";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtempSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import {
	closeDatabase,
	deleteFileAndSymbols,
	getAllFolders,
	getFileByPath,
	getFileSymbols,
	getStats,
	insertFiles,
	insertSymbols,
	openDatabase,
	rebuildFts,
	searchSymbols,
	upsertFolders,
} from "../src/indexer/db.js";
import type {
	IndexedFile,
	IndexedFolder,
	IndexedSymbol,
} from "../src/schemas/index.js";

let db: Database;
let tmpDir: string;
let dbPath: string;

beforeEach(() => {
	tmpDir = mkdtempSync(join(tmpdir(), "codeforge-test-"));
	dbPath = join(tmpDir, "test-index.db");
	db = openDatabase(dbPath);
});

afterEach(() => {
	closeDatabase(db);
});

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

function makeSymbol(
	overrides: Partial<Omit<IndexedSymbol, "id">> = {},
): Omit<IndexedSymbol, "id"> {
	return {
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

describe("openDatabase", () => {
	test("creates database with tables", () => {
		const tables = db
			.prepare(
				"SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
			)
			.all() as Array<{ name: string }>;
		const names = tables.map((t) => t.name);
		expect(names).toContain("files");
		expect(names).toContain("folders");
		expect(names).toContain("symbols");
	});

	test("enables WAL mode", () => {
		const result = db.prepare("PRAGMA journal_mode").get() as {
			journal_mode: string;
		};
		expect(result.journal_mode).toBe("wal");
	});

	test("enables foreign keys", () => {
		const result = db.prepare("PRAGMA foreign_keys").get() as {
			foreign_keys: number;
		};
		expect(result.foreign_keys).toBe(1);
	});
});

describe("insertFiles and getFileByPath", () => {
	test("inserts and retrieves a file", () => {
		const file = makeFile();
		insertFiles(db, [file]);

		const retrieved = getFileByPath(db, "src/main.ts");
		expect(retrieved).not.toBeNull();
		expect(retrieved!.path).toBe("src/main.ts");
		expect(retrieved!.hash).toBe("abc123");
		expect(retrieved!.size).toBe(1024);
		expect(retrieved!.language).toBe("typescript");
		expect(retrieved!.lineCount).toBe(50);
	});

	test("returns null for nonexistent file", () => {
		expect(getFileByPath(db, "nope.ts")).toBeNull();
	});

	test("upserts on duplicate path", () => {
		insertFiles(db, [makeFile({ hash: "first" })]);
		insertFiles(db, [makeFile({ hash: "second" })]);

		const retrieved = getFileByPath(db, "src/main.ts");
		expect(retrieved!.hash).toBe("second");
	});

	test("inserts multiple files in batch", () => {
		const files = [
			makeFile({ path: "a.ts", hash: "h1" }),
			makeFile({ path: "b.ts", hash: "h2" }),
			makeFile({ path: "c.ts", hash: "h3" }),
		];
		insertFiles(db, files);

		expect(getFileByPath(db, "a.ts")).not.toBeNull();
		expect(getFileByPath(db, "b.ts")).not.toBeNull();
		expect(getFileByPath(db, "c.ts")).not.toBeNull();
	});
});

describe("insertSymbols and getFileSymbols", () => {
	test("inserts and retrieves symbols for a file", () => {
		insertFiles(db, [makeFile()]);
		insertSymbols(db, [
			makeSymbol(),
			makeSymbol({ name: "anotherFn", lineStart: 25, lineEnd: 30 }),
		]);

		const symbols = getFileSymbols(db, "src/main.ts");
		expect(symbols).toHaveLength(2);
		expect(symbols[0].name).toBe("myFunction");
		expect(symbols[1].name).toBe("anotherFn");
	});

	test("returns symbols ordered by line_start", () => {
		insertFiles(db, [makeFile()]);
		insertSymbols(db, [
			makeSymbol({ name: "last", lineStart: 100, lineEnd: 110 }),
			makeSymbol({ name: "first", lineStart: 1, lineEnd: 5 }),
			makeSymbol({ name: "middle", lineStart: 50, lineEnd: 60 }),
		]);

		const symbols = getFileSymbols(db, "src/main.ts");
		expect(symbols[0].name).toBe("first");
		expect(symbols[1].name).toBe("middle");
		expect(symbols[2].name).toBe("last");
	});

	test("maps exported boolean correctly", () => {
		insertFiles(db, [makeFile()]);
		insertSymbols(db, [
			makeSymbol({ name: "exp", exported: true }),
			makeSymbol({
				name: "local",
				exported: false,
				lineStart: 30,
				lineEnd: 40,
			}),
		]);

		const symbols = getFileSymbols(db, "src/main.ts");
		const exp = symbols.find((s) => s.name === "exp");
		const local = symbols.find((s) => s.name === "local");
		expect(exp!.exported).toBe(true);
		expect(local!.exported).toBe(false);
	});
});

describe("deleteFileAndSymbols", () => {
	test("removes file and its symbols", () => {
		insertFiles(db, [makeFile()]);
		insertSymbols(db, [makeSymbol()]);

		deleteFileAndSymbols(db, "src/main.ts");

		expect(getFileByPath(db, "src/main.ts")).toBeNull();
		expect(getFileSymbols(db, "src/main.ts")).toHaveLength(0);
	});

	test("does not affect other files", () => {
		insertFiles(db, [makeFile({ path: "a.ts" }), makeFile({ path: "b.ts" })]);
		insertSymbols(db, [
			makeSymbol({ filePath: "a.ts", name: "fnA" }),
			makeSymbol({ filePath: "b.ts", name: "fnB" }),
		]);

		deleteFileAndSymbols(db, "a.ts");

		expect(getFileByPath(db, "a.ts")).toBeNull();
		expect(getFileByPath(db, "b.ts")).not.toBeNull();
		expect(getFileSymbols(db, "b.ts")).toHaveLength(1);
	});
});

describe("upsertFolders and getAllFolders", () => {
	test("inserts and retrieves folders", () => {
		const folders: IndexedFolder[] = [
			{
				path: "src",
				description: "Source code",
				fileCount: 10,
				lastIndexed: "2026-03-08 12:00:00",
			},
			{
				path: "tests",
				description: null,
				fileCount: 5,
				lastIndexed: "2026-03-08 12:00:00",
			},
		];
		upsertFolders(db, folders);

		const all = getAllFolders(db);
		expect(all).toHaveLength(2);
		expect(all[0].path).toBe("src");
		expect(all[0].description).toBe("Source code");
		expect(all[0].fileCount).toBe(10);
		expect(all[1].path).toBe("tests");
		expect(all[1].description).toBeNull();
	});

	test("upserts on duplicate path", () => {
		upsertFolders(db, [
			{
				path: "src",
				description: "Old",
				fileCount: 5,
				lastIndexed: "2026-03-01",
			},
		]);
		upsertFolders(db, [
			{
				path: "src",
				description: "New",
				fileCount: 15,
				lastIndexed: "2026-03-08",
			},
		]);

		const all = getAllFolders(db);
		expect(all).toHaveLength(1);
		expect(all[0].description).toBe("New");
		expect(all[0].fileCount).toBe(15);
	});
});

describe("searchSymbols (FTS5)", () => {
	test("finds symbols by name", () => {
		insertFiles(db, [makeFile()]);
		insertSymbols(db, [
			makeSymbol({ name: "calculateTotal" }),
			makeSymbol({ name: "formatOutput", lineStart: 30, lineEnd: 40 }),
		]);

		const hits = searchSymbols(db, "calculateTotal");
		expect(hits.length).toBeGreaterThan(0);
		expect(hits[0].symbol.name).toBe("calculateTotal");
		expect(typeof hits[0].rank).toBe("number");
	});

	test("finds symbols by signature content", () => {
		insertFiles(db, [makeFile()]);
		insertSymbols(db, [
			makeSymbol({
				name: "parse",
				signature: "function parse(input: string): AST",
			}),
		]);

		const hits = searchSymbols(db, "AST");
		expect(hits.length).toBeGreaterThan(0);
		expect(hits[0].symbol.name).toBe("parse");
	});

	test("finds symbols by docstring content", () => {
		insertFiles(db, [makeFile()]);
		insertSymbols(db, [
			makeSymbol({
				name: "validate",
				docstring: "Validates user authentication tokens",
			}),
		]);

		const hits = searchSymbols(db, "authentication");
		expect(hits.length).toBeGreaterThan(0);
		expect(hits[0].symbol.name).toBe("validate");
	});

	test("respects limit parameter", () => {
		insertFiles(db, [makeFile()]);
		const symbols = Array.from({ length: 10 }, (_, i) =>
			makeSymbol({
				name: `fn${i}`,
				lineStart: i * 10,
				lineEnd: i * 10 + 5,
				signature: `function fn${i}(): void`,
			}),
		);
		insertSymbols(db, symbols);

		const hits = searchSymbols(db, "fn", 3);
		expect(hits.length).toBeLessThanOrEqual(3);
	});

	test("returns empty for no matches", () => {
		insertFiles(db, [makeFile()]);
		insertSymbols(db, [makeSymbol()]);

		const hits = searchSymbols(db, "zzzznonexistent");
		expect(hits).toHaveLength(0);
	});
});

describe("getStats", () => {
	test("returns correct counts", () => {
		insertFiles(db, [
			makeFile({ path: "a.ts", language: "typescript" }),
			makeFile({ path: "b.py", language: "python" }),
		]);
		insertSymbols(db, [
			makeSymbol({ filePath: "a.ts", name: "fn1" }),
			makeSymbol({ filePath: "a.ts", name: "fn2", lineStart: 30, lineEnd: 40 }),
			makeSymbol({ filePath: "b.py", name: "fn3", language: "python" }),
		]);
		upsertFolders(db, [
			{
				path: "src",
				description: null,
				fileCount: 2,
				lastIndexed: "2026-03-08",
			},
		]);

		const stats = getStats(db, dbPath);
		expect(stats.totalFiles).toBe(2);
		expect(stats.totalSymbols).toBe(3);
		expect(stats.totalFolders).toBe(1);
		expect(stats.byLanguage.typescript.files).toBe(1);
		expect(stats.byLanguage.typescript.symbols).toBe(2);
		expect(stats.byLanguage.python.files).toBe(1);
		expect(stats.byLanguage.python.symbols).toBe(1);
		expect(stats.dbSizeBytes).toBeGreaterThan(0);
		expect(stats.lastBuildTime).not.toBeNull();
	});

	test("returns zeros for empty database", () => {
		const stats = getStats(db, dbPath);
		expect(stats.totalFiles).toBe(0);
		expect(stats.totalSymbols).toBe(0);
		expect(stats.totalFolders).toBe(0);
		expect(Object.keys(stats.byLanguage)).toHaveLength(0);
	});
});

describe("rebuildFts", () => {
	test("rebuilds FTS index without error", () => {
		insertFiles(db, [makeFile()]);
		insertSymbols(db, [makeSymbol()]);

		expect(() => rebuildFts(db)).not.toThrow();

		const hits = searchSymbols(db, "myFunction");
		expect(hits.length).toBeGreaterThan(0);
	});
});
