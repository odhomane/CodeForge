import { Marked } from "marked";
//#region src/web/lib/utils/markdown.ts
var DANGEROUS_TAG_RE = /<\/?\s*(script|iframe|object|embed)\b[^>]*>/gi;
var EVENT_HANDLER_RE = /\s+on\w+\s*=\s*["'][^"']*["']/gi;
function sanitize(html) {
	return html.replace(DANGEROUS_TAG_RE, "").replace(EVENT_HANDLER_RE, "");
}
var syncMarked = new Marked();
function renderMarkdownSync(text) {
	if (!text) return "";
	return sanitize(syncMarked.parse(text));
}
//#endregion
export { renderMarkdownSync as t };
