import { describe, expect, test } from "bun:test";
import { mkdtempSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import {
	determineSymbolKind,
	extractDocstring,
	extractSignature,
	extractSymbolName,
} from "../src/indexer/extractor.js";
import {
	getPythonRules,
	getRulesForLanguage,
	getTypescriptRules,
} from "../src/indexer/rules.js";
import {
	getLanguageForExtension,
	hashFileContent,
} from "../src/indexer/scanner.js";

describe("extractSignature", () => {
	test("strips function body for TypeScript", () => {
		const text =
			"export function greet(name: string): string {\n  return `Hello ${name}`;\n}";
		expect(extractSignature(text, "typescript")).toBe(
			"export function greet(name: string): string",
		);
	});

	test("returns full text when no braces", () => {
		const text = "export type Foo = string | number";
		expect(extractSignature(text, "typescript")).toBe(
			"export type Foo = string | number",
		);
	});

	test("handles multiline signatures before brace", () => {
		const text =
			"export function foo(\n  x: number,\n  y: string\n): boolean {\n  return true;\n}";
		expect(extractSignature(text, "typescript")).toBe(
			"export function foo(\n  x: number,\n  y: string\n): boolean",
		);
	});

	test("extracts first line for Python without colon", () => {
		const text = "def calculate(x, y):\n    return x + y";
		expect(extractSignature(text, "python")).toBe("def calculate(x, y)");
	});

	test("handles Python class definition", () => {
		const text = "class MyClass(Base):\n    pass";
		expect(extractSignature(text, "python")).toBe("class MyClass(Base)");
	});
});

describe("extractDocstring", () => {
	test("extracts triple-double-quoted Python docstring", () => {
		const text = 'def foo():\n    """This is the docstring."""\n    pass';
		expect(extractDocstring(text, "python")).toBe("This is the docstring.");
	});

	test("extracts multiline Python docstring", () => {
		const text =
			'def foo():\n    """\n    Multi-line\n    docstring.\n    """\n    pass';
		const result = extractDocstring(text, "python");
		expect(result).toContain("Multi-line");
		expect(result).toContain("docstring.");
	});

	test("extracts triple-single-quoted Python docstring", () => {
		const text = "def foo():\n    '''Single quoted docs.'''\n    pass";
		expect(extractDocstring(text, "python")).toBe("Single quoted docs.");
	});

	test("returns null for Python without docstring", () => {
		const text = "def foo():\n    return 42";
		expect(extractDocstring(text, "python")).toBeNull();
	});

	test("returns null for TypeScript", () => {
		expect(extractDocstring("function foo() {}", "typescript")).toBeNull();
	});
});

describe("extractSymbolName", () => {
	test("extracts function name", () => {
		expect(
			extractSymbolName("function greet(name: string) {}", "ts-function"),
		).toBe("greet");
	});

	test("extracts exported function name", () => {
		expect(
			extractSymbolName("export function calculate() {}", "ts-export"),
		).toBe("calculate");
	});

	test("extracts async function name", () => {
		expect(
			extractSymbolName("export async function fetchData() {}", "ts-export"),
		).toBe("fetchData");
	});

	test("extracts class name", () => {
		expect(extractSymbolName("class MyService {}", "ts-class")).toBe(
			"MyService",
		);
	});

	test("extracts interface name", () => {
		expect(
			extractSymbolName("export interface UserConfig {}", "ts-export"),
		).toBe("UserConfig");
	});

	test("extracts type alias name", () => {
		expect(
			extractSymbolName("export type Result = string | Error", "ts-export"),
		).toBe("Result");
	});

	test("extracts const name", () => {
		expect(extractSymbolName("export const MAX_RETRY = 3", "ts-export")).toBe(
			"MAX_RETRY",
		);
	});

	test("extracts enum name", () => {
		expect(
			extractSymbolName("export enum Status { Active, Inactive }", "ts-export"),
		).toBe("Status");
	});

	test("extracts Python def name", () => {
		expect(extractSymbolName("def process_data(input):", "py-function")).toBe(
			"process_data",
		);
	});

	test("extracts Python class name", () => {
		expect(extractSymbolName("class DataProcessor:", "py-class")).toBe(
			"DataProcessor",
		);
	});

	test("returns unknown for unparseable text", () => {
		expect(extractSymbolName("???", "ts-export")).toBe("unknown");
	});
});

describe("determineSymbolKind", () => {
	test("returns function for ts-function rule", () => {
		expect(determineSymbolKind("function foo() {}", "ts-function")).toBe(
			"function",
		);
	});

	test("returns class for ts-class rule", () => {
		expect(determineSymbolKind("class Foo {}", "ts-class")).toBe("class");
	});

	test("returns interface for ts-interface rule", () => {
		expect(determineSymbolKind("interface Foo {}", "ts-interface")).toBe(
			"interface",
		);
	});

	test("returns function for py-function rule", () => {
		expect(determineSymbolKind("def foo():", "py-function")).toBe("function");
	});

	test("returns class for py-class rule", () => {
		expect(determineSymbolKind("class Foo:", "py-class")).toBe("class");
	});

	test("detects function from ts-export text", () => {
		expect(determineSymbolKind("export function foo() {}", "ts-export")).toBe(
			"function",
		);
	});

	test("detects class from ts-export text", () => {
		expect(determineSymbolKind("export class Foo {}", "ts-export")).toBe(
			"class",
		);
	});

	test("detects interface from ts-export text", () => {
		expect(determineSymbolKind("export interface Bar {}", "ts-export")).toBe(
			"interface",
		);
	});

	test("detects type from ts-export text", () => {
		expect(determineSymbolKind("export type Baz = string", "ts-export")).toBe(
			"type",
		);
	});

	test("detects enum from ts-export text", () => {
		expect(
			determineSymbolKind("export enum Dir { Up, Down }", "ts-export"),
		).toBe("enum");
	});

	test("detects const from ts-export text", () => {
		expect(determineSymbolKind("export const FOO = 1", "ts-export")).toBe(
			"const",
		);
	});

	test("defaults to function for unknown", () => {
		expect(determineSymbolKind("???", "unknown-rule")).toBe("function");
	});
});

describe("getLanguageForExtension", () => {
	test("maps .ts to typescript", () => {
		expect(getLanguageForExtension(".ts")).toBe("typescript");
	});

	test("maps .tsx to typescript", () => {
		expect(getLanguageForExtension(".tsx")).toBe("typescript");
	});

	test("maps .js to javascript", () => {
		expect(getLanguageForExtension(".js")).toBe("javascript");
	});

	test("maps .jsx to javascript", () => {
		expect(getLanguageForExtension(".jsx")).toBe("javascript");
	});

	test("maps .py to python", () => {
		expect(getLanguageForExtension(".py")).toBe("python");
	});

	test("returns null for unsupported extension", () => {
		expect(getLanguageForExtension(".rs")).toBeNull();
		expect(getLanguageForExtension(".go")).toBeNull();
		expect(getLanguageForExtension(".md")).toBeNull();
	});
});

describe("hashFileContent", () => {
	test("returns consistent SHA-256 hex digest", async () => {
		const tmpDir = mkdtempSync(join(tmpdir(), "hash-test-"));
		const filePath = join(tmpDir, "test.txt");
		writeFileSync(filePath, "hello world");

		const hash1 = await hashFileContent(filePath);
		const hash2 = await hashFileContent(filePath);

		expect(hash1).toBe(hash2);
		expect(hash1).toHaveLength(64); // SHA-256 hex = 64 chars
	});

	test("produces different hashes for different content", async () => {
		const tmpDir = mkdtempSync(join(tmpdir(), "hash-test-"));
		const file1 = join(tmpDir, "a.txt");
		const file2 = join(tmpDir, "b.txt");
		writeFileSync(file1, "content A");
		writeFileSync(file2, "content B");

		const hash1 = await hashFileContent(file1);
		const hash2 = await hashFileContent(file2);

		expect(hash1).not.toBe(hash2);
	});
});

describe("rules", () => {
	test("getTypescriptRules returns valid YAML with expected rule IDs", () => {
		const rules = getTypescriptRules();
		expect(rules).toContain("id: ts-jsdoc");
		expect(rules).toContain("id: ts-export");
		expect(rules).toContain("id: ts-function");
		expect(rules).toContain("id: ts-class");
		expect(rules).toContain("id: ts-interface");
		expect(rules).toContain("language: TypeScript");
	});

	test("getPythonRules returns valid YAML with expected rule IDs", () => {
		const rules = getPythonRules();
		expect(rules).toContain("id: py-function");
		expect(rules).toContain("id: py-class");
		expect(rules).toContain("id: py-decorated");
		expect(rules).toContain("language: Python");
	});

	test("getRulesForLanguage returns TypeScript rules for typescript", () => {
		expect(getRulesForLanguage("typescript")).toBe(getTypescriptRules());
	});

	test("getRulesForLanguage returns TypeScript rules for javascript", () => {
		expect(getRulesForLanguage("javascript")).toBe(getTypescriptRules());
	});

	test("getRulesForLanguage returns Python rules for python", () => {
		expect(getRulesForLanguage("python")).toBe(getPythonRules());
	});

	test("getRulesForLanguage returns null for unsupported language", () => {
		expect(getRulesForLanguage("rust")).toBeNull();
		expect(getRulesForLanguage("go")).toBeNull();
	});
});
