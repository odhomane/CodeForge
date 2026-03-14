import { unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import type { IndexedSymbol, SymbolKind } from "../schemas/index.js";
import { getRulesForLanguage } from "./rules.js";

interface SgMatch {
	text: string;
	range: {
		byteOffset: { start: number; end: number };
		start: { line: number; column: number };
		end: { line: number; column: number };
	};
	file: string;
	lines: string;
	ruleId: string;
	language: string;
	message?: string;
}

export async function checkSgInstalled(): Promise<boolean> {
	try {
		const proc = Bun.spawn(["sg", "--version"], {
			stdout: "pipe",
			stderr: "pipe",
		});
		await proc.exited;
		return proc.exitCode === 0;
	} catch {
		return false;
	}
}

export function extractSignature(text: string, language: string): string {
	if (language === "python") {
		const firstLine = text.split("\n")[0];
		return firstLine.replace(/:$/, "").trim();
	}

	// TypeScript/JavaScript: strip body (everything from first { to end)
	const braceIndex = text.indexOf("{");
	if (braceIndex !== -1) {
		return text.substring(0, braceIndex).trim();
	}
	// For type aliases, interfaces without body braces on same match, return as-is
	return text.split("\n")[0].trim();
}

export function extractDocstring(
	text: string,
	language: string,
): string | null {
	if (language === "python") {
		// Look for triple-quoted docstring at start of function/class body
		const bodyMatch = text.match(/:\s*\n\s*("""[\s\S]*?"""|'''[\s\S]*?''')/);
		if (bodyMatch) {
			return bodyMatch[1]
				.replace(/^"""|"""$/g, "")
				.replace(/^'''|'''$/g, "")
				.trim();
		}
		return null;
	}
	// TypeScript docstrings are handled via JSDoc correlation
	return null;
}

export function extractSymbolName(text: string, ruleId: string): string {
	// Handle different declaration patterns
	const patterns: RegExp[] = [
		/(?:export\s+)?(?:async\s+)?function\s+(\w+)/,
		/(?:export\s+)?class\s+(\w+)/,
		/(?:export\s+)?interface\s+(\w+)/,
		/(?:export\s+)?type\s+(\w+)/,
		/(?:export\s+)?enum\s+(\w+)/,
		/(?:export\s+)?(?:const|let|var)\s+(\w+)/,
		// Python patterns
		/def\s+(\w+)/,
		/class\s+(\w+)/,
	];

	for (const pattern of patterns) {
		const match = text.match(pattern);
		if (match) {
			return match[1];
		}
	}

	// Fallback: first word-like token after common keywords
	const fallback = text.match(
		/(?:function|class|interface|type|enum|const|let|var|def)\s+(\w+)/,
	);
	if (fallback) return fallback[1];

	return "unknown";
}

export function determineSymbolKind(text: string, ruleId: string): SymbolKind {
	// Rule ID gives strong hints
	if (ruleId === "ts-function" || ruleId === "py-function") return "function";
	if (ruleId === "ts-class" || ruleId === "py-class") return "class";
	if (ruleId === "ts-interface") return "interface";

	// For ts-export, inspect the text
	if (ruleId === "ts-export" || ruleId === "py-decorated") {
		if (/\bfunction\s/.test(text)) return "function";
		if (/\bclass\s/.test(text)) return "class";
		if (/\binterface\s/.test(text)) return "interface";
		if (/\btype\s/.test(text)) return "type";
		if (/\benum\s/.test(text)) return "enum";
		if (/\bconst\s/.test(text)) return "const";
		if (/\bdef\s/.test(text)) return "function";
	}

	return "function";
}

export async function extractSymbols(
	filePaths: string[],
	language: string,
): Promise<Omit<IndexedSymbol, "id">[]> {
	if (filePaths.length === 0) return [];

	const rulesYaml = getRulesForLanguage(language);
	if (!rulesYaml) return [];

	const installed = await checkSgInstalled();
	if (!installed) {
		throw new Error(
			"ast-grep (sg) is required but not found. Install it:\n" +
				"  npm install -g @ast-grep/cli\n" +
				"  # or: brew install ast-grep",
		);
	}

	const tmpFile = join(tmpdir(), `codeforge-sg-rules-${Date.now()}.yml`);
	await Bun.write(tmpFile, rulesYaml);

	try {
		const args = ["sg", "scan", "--rule", tmpFile, "--json", ...filePaths];
		const proc = Bun.spawn(args, {
			stdout: "pipe",
			stderr: "pipe",
		});

		const stdout = await new Response(proc.stdout).text();
		await proc.exited;

		if (!stdout.trim()) return [];

		let matches: SgMatch[];
		try {
			matches = JSON.parse(stdout);
		} catch {
			return [];
		}

		if (!Array.isArray(matches)) return [];

		// Separate JSDoc comments from other matches (for TypeScript)
		const jsdocMatches = matches.filter((m) => m.ruleId === "ts-jsdoc");
		const symbolMatches = matches.filter((m) => m.ruleId !== "ts-jsdoc");

		// Build a lookup for JSDoc by file and end line
		const jsdocByFileAndLine = new Map<string, Map<number, string>>();
		for (const jsdoc of jsdocMatches) {
			if (!jsdocByFileAndLine.has(jsdoc.file)) {
				jsdocByFileAndLine.set(jsdoc.file, new Map());
			}
			jsdocByFileAndLine.get(jsdoc.file)!.set(
				jsdoc.range.end.line,
				jsdoc.text
					.replace(/^\/\*\*/, "")
					.replace(/\*\/$/, "")
					.replace(/^\s*\* ?/gm, "")
					.trim(),
			);
		}

		const symbols: Omit<IndexedSymbol, "id">[] = [];

		for (const match of symbolMatches) {
			const name = extractSymbolName(match.text, match.ruleId);
			const kind = determineSymbolKind(match.text, match.ruleId);
			const signature = extractSignature(match.text, language);
			const exported =
				match.ruleId === "ts-export" || /^export\s/.test(match.text);

			// Find associated JSDoc (line just before this symbol)
			let docstring: string | null = null;
			if (language === "typescript" || language === "javascript") {
				const fileJsdocs = jsdocByFileAndLine.get(match.file);
				if (fileJsdocs) {
					// JSDoc ends on the line just before the symbol starts
					docstring = fileJsdocs.get(match.range.start.line - 1) ?? null;
				}
			} else if (language === "python") {
				docstring = extractDocstring(match.text, language);
			}

			symbols.push({
				name,
				kind,
				filePath: match.file,
				lineStart: match.range.start.line,
				lineEnd: match.range.end.line,
				signature,
				docstring,
				parentName: null,
				exported,
				language,
			});
		}

		// Deduplicate: when a declaration is matched by both ts-export and
		// ts-function/ts-class/ts-interface, keep only the exported version.
		const seen = new Map<string, (typeof symbols)[number]>();
		for (const sym of symbols) {
			const key = `${sym.filePath}:${sym.name}:${sym.lineStart}`;
			const existing = seen.get(key);
			if (!existing || (sym.exported && !existing.exported)) {
				seen.set(key, sym);
			}
		}
		return [...seen.values()];
	} finally {
		try {
			unlinkSync(tmpFile);
		} catch {
			// Temp file cleanup is best-effort
		}
	}
}
