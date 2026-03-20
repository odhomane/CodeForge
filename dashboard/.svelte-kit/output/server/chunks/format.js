//#region src/web/lib/utils/format.ts
function formatTokens(n) {
	if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
	if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
	return String(n);
}
function formatCost(n) {
	return `$${n.toFixed(2)}`;
}
function formatDuration(ms) {
	if (ms < 6e4) return "< 1m";
	const totalMinutes = Math.floor(ms / 6e4);
	const hours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;
	if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
	if (hours > 0) return `${hours}h`;
	return `${minutes}m`;
}
function formatRelativeTime(date) {
	const diffMs = Date.now() - (typeof date === "string" ? new Date(date).getTime() : date.getTime());
	if (diffMs < 6e4) return "just now";
	const diffMin = Math.floor(diffMs / 6e4);
	if (diffMin < 60) return `${diffMin}m ago`;
	const diffHours = Math.floor(diffMin / 60);
	if (diffHours < 24) return `${diffHours}h ago`;
	const diffDays = Math.floor(diffHours / 24);
	if (diffDays < 30) return `${diffDays}d ago`;
	return `${Math.floor(diffDays / 30)}mo ago`;
}
function truncateText(text, maxLen) {
	if (text.length <= maxLen) return text;
	return text.slice(0, maxLen - 1) + "…";
}
function formatDate(date) {
	return (typeof date === "string" ? new Date(date) : date).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric"
	});
}
//#endregion
export { formatTokens as a, formatRelativeTime as i, formatDate as n, truncateText as o, formatDuration as r, formatCost as t };
