import { Marked } from "marked";
import type { HighlighterGeneric } from "shiki";

const DANGEROUS_TAG_RE = /<\/?\s*(script|iframe|object|embed)\b[^>]*>/gi;
const EVENT_HANDLER_RE = /\s+on\w+\s*=\s*["'][^"']*["']/gi;

function sanitize(html: string): string {
	return html.replace(DANGEROUS_TAG_RE, "").replace(EVENT_HANDLER_RE, "");
}

type Highlighter = HighlighterGeneric<string, string>;

let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter(): Promise<Highlighter> {
	if (!highlighterPromise) {
		highlighterPromise = import("shiki").then(
			(shiki) =>
				shiki.createHighlighter({
					themes: ["github-dark"],
					langs: [
						"javascript",
						"typescript",
						"python",
						"bash",
						"json",
						"html",
						"css",
						"markdown",
						"yaml",
						"toml",
						"rust",
						"go",
						"sql",
						"diff",
						"shell",
						"svelte",
					],
				}) as Promise<Highlighter>,
		);
	}
	return highlighterPromise!;
}

const syncMarked = new Marked();

export function renderMarkdownSync(text: string): string {
	if (!text) return "";
	const raw = syncMarked.parse(text) as string;
	return sanitize(raw);
}

export async function renderMarkdown(text: string): Promise<string> {
	if (!text) return "";

	const highlighter = await getHighlighter();
	const loadedLangs = highlighter.getLoadedLanguages();

	const asyncMarked = new Marked();
	asyncMarked.use({
		renderer: {
			code({ text: code, lang }) {
				const language = lang && loadedLangs.includes(lang) ? lang : "text";
				if (language === "text") {
					return `<pre><code>${escapeHtml(code)}</code></pre>`;
				}
				return highlighter.codeToHtml(code, {
					lang: language,
					theme: "github-dark",
				});
			},
		},
	});

	const raw = asyncMarked.parse(text) as string;
	return sanitize(raw);
}

export async function highlightCode(
	code: string,
	lang: string,
): Promise<string> {
	if (!code) return "";
	const highlighter = await getHighlighter();
	const loadedLangs = highlighter.getLoadedLanguages();
	const language = lang && loadedLangs.includes(lang) ? lang : "text";
	if (language === "text") {
		return `<pre><code>${escapeHtml(code)}</code></pre>`;
	}
	return highlighter.codeToHtml(code, { lang: language, theme: "github-dark" });
}

export function detectLanguage(filepath: string): string {
	if (!filepath) return "text";
	const ext = filepath.split(".").pop()?.toLowerCase() ?? "";
	const map: Record<string, string> = {
		ts: "typescript",
		tsx: "typescript",
		js: "javascript",
		jsx: "javascript",
		mjs: "javascript",
		py: "python",
		sh: "bash",
		json: "json",
		md: "markdown",
		html: "html",
		css: "css",
		svelte: "svelte",
		yaml: "yaml",
		yml: "yaml",
		toml: "toml",
		rs: "rust",
		go: "go",
		sql: "sql",
		diff: "diff",
		patch: "diff",
	};
	return map[ext] ?? "text";
}

function escapeHtml(str: string): string {
	return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
