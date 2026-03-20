<script lang="ts">
import { goto } from "$app/navigation";
import { contextStore, fetchContextFiles } from "$lib/stores/context.svelte.js";
import { formatTokens } from "$lib/utils/format.js";
import { renderMarkdown } from "$lib/utils/markdown.js";

let highlightedIndex = $state(-1);
let expandedPath = $state<string | null>(null);
let renderedContent = $state<Record<string, string>>({});
let scopeFilter = $state("all");

function scopeColor(scope: string): string {
	switch (scope) {
		case "user":
			return "#a78bfa";
		case "project":
			return "#22d3ee";
		case "auto-memory":
			return "#4ade80";
		case "user-rules":
			return "#fbbf24";
		case "project-rules":
			return "#f59e0b";
		default:
			return "#a8a29e";
	}
}

function scopeBg(scope: string): string {
	switch (scope) {
		case "user":
			return "rgba(167, 139, 250, 0.15)";
		case "project":
			return "rgba(34, 211, 238, 0.15)";
		case "auto-memory":
			return "rgba(74, 222, 128, 0.15)";
		case "user-rules":
			return "rgba(251, 191, 36, 0.15)";
		case "project-rules":
			return "rgba(245, 158, 11, 0.15)";
		default:
			return "rgba(168, 162, 158, 0.15)";
	}
}

let filteredFiles = $derived(
	scopeFilter === "all"
		? contextStore.files
		: contextStore.files.filter((f) => f.scope === scopeFilter),
);

$effect(() => {
	fetchContextFiles();
});

function toggleExpand(path: string) {
	if (expandedPath === path) {
		expandedPath = null;
	} else {
		expandedPath = path;
		if (!renderedContent[path]) {
			const file = contextStore.files.find((f) => f.path === path);
			if (file) {
				renderMarkdown(file.content).then((html) => {
					renderedContent = { ...renderedContent, [path]: html };
				});
			}
		}
	}
}

function onScopeChange(e: Event) {
	scopeFilter = (e.target as HTMLSelectElement).value;
	highlightedIndex = -1;
	expandedPath = null;
}

function isInputFocused(): boolean {
	const el = document.activeElement;
	if (!el) return false;
	const tag = el.tagName;
	if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
	if ((el as HTMLElement).isContentEditable) return true;
	return false;
}

function onKeydown(e: KeyboardEvent) {
	if (isInputFocused()) return;
	const files = filteredFiles;
	if (files.length === 0) return;

	switch (e.key) {
		case "j":
			e.preventDefault();
			highlightedIndex = Math.min(highlightedIndex + 1, files.length - 1);
			break;
		case "k":
			e.preventDefault();
			highlightedIndex = Math.max(highlightedIndex - 1, 0);
			break;
		case "Enter":
			if (highlightedIndex >= 0 && highlightedIndex < files.length) {
				e.preventDefault();
				toggleExpand(files[highlightedIndex].path);
			}
			break;
		case "Escape":
			if (expandedPath) {
				e.preventDefault();
				expandedPath = null;
			} else if (highlightedIndex >= 0) {
				e.preventDefault();
				highlightedIndex = -1;
			}
			break;
	}
}

$effect(() => {
	if (highlightedIndex >= 0) {
		const row = document.querySelector(
			`.context-table tbody tr:nth-child(${highlightedIndex + 1})`,
		);
		row?.scrollIntoView({ block: "nearest" });
	}
});
</script>

<svelte:window onkeydown={onKeydown} />

<div class="context-list">
	<div class="filters-bar">
		<select class="filter-select" value={scopeFilter} onchange={onScopeChange}>
			<option value="all">All Scopes</option>
			<option value="user">User</option>
			<option value="project">Project</option>
			<option value="auto-memory">Auto-memory</option>
			<option value="user-rules">User Rules</option>
			<option value="project-rules">Project Rules</option>
		</select>
	</div>

	{#if contextStore.error}
		<div class="error-banner">{contextStore.error}</div>
	{/if}

	{#if contextStore.loading}
		<div class="loading-state">Loading context files...</div>
	{:else if filteredFiles.length === 0}
		<div class="empty-state">No context files found.</div>
	{:else}
		<div class="table-wrap">
			<table class="context-table">
				<thead>
					<tr>
						<th>Filename</th>
						<th>Scope</th>
						<th>Path</th>
						<th>Projects</th>
						<th>Sessions</th>
						<th>Tokens</th>
					</tr>
				</thead>
				<tbody>
					{#each filteredFiles as file, i (file.path)}
						<tr
							class:highlighted={i === highlightedIndex}
							onclick={() => toggleExpand(file.path)}
						>
							<td class="td-filename">{file.filename}</td>
							<td>
								<span
									class="scope-badge"
									style="color:{scopeColor(file.scope)};background:{scopeBg(file.scope)}"
								>{file.scope}</span>
							</td>
							<td class="td-path" title={file.path}>{file.path}</td>
							<td class="td-projects">
								{#each file.projects as proj, pi}
									<button
										class="project-link"
										onclick={(e) => { e.stopPropagation(); goto(`/projects/${proj.id}`); }}
									>{proj.name}</button>{#if pi < file.projects.length - 1},{' '}{/if}
								{/each}
							</td>
							<td class="td-mono">{file.totalSessions}</td>
							<td class="td-mono">~{formatTokens(file.estimatedTokens)}</td>
						</tr>
						{#if expandedPath === file.path}
							<tr class="expanded-row">
								<td colspan="6">
									<div class="expanded-content rendered-markdown">
										{#if renderedContent[file.path]}
											{@html renderedContent[file.path]}
										{:else}
											<span class="loading-text">Rendering...</span>
										{/if}
									</div>
								</td>
							</tr>
						{/if}
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<style>
	.context-list {
		width: 100%;
	}

	.filters-bar {
		display: flex;
		gap: 12px;
		margin-bottom: 20px;
		flex-wrap: wrap;
	}

	.filter-select {
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		padding: 7px 12px;
		color: var(--text-primary);
		font-family: var(--font-ui);
		font-size: 13px;
		outline: none;
		cursor: pointer;
		min-width: 150px;
		appearance: none;
		-webkit-appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 5l3 3 3-3' stroke='%2378716c' stroke-width='1.5' fill='none'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 10px center;
		padding-right: 30px;
	}

	.filter-select:focus {
		border-color: var(--accent);
	}

	.filter-select option {
		background: var(--bg-card);
		color: var(--text-primary);
	}

	.table-wrap {
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		overflow: hidden;
	}

	.context-table {
		width: 100%;
		border-collapse: collapse;
	}

	.context-table th {
		text-align: left;
		padding: 12px 14px;
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-muted);
		border-bottom: 1px solid var(--border);
		background: var(--bg-deep);
	}

	.context-table td {
		padding: 11px 14px;
		font-size: 13px;
		color: var(--text-secondary);
		border-bottom: 1px solid var(--border-subtle);
	}

	.context-table tbody tr {
		transition: background var(--transition);
		cursor: pointer;
	}

	.context-table tbody tr:hover,
	.context-table tbody tr.highlighted {
		background: var(--accent-dim);
	}

	.context-table tbody tr.highlighted {
		border-left: 2px solid var(--accent);
	}

	.context-table tbody tr:last-child td {
		border-bottom: none;
	}

	.td-filename {
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--text-primary);
		font-weight: 500;
	}

	.scope-badge {
		font-family: var(--font-mono);
		font-size: 11px;
		padding: 2px 8px;
		border-radius: 4px;
		font-weight: 500;
		white-space: nowrap;
	}

	.td-path {
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--text-dim);
		max-width: 250px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.td-projects {
		font-size: 12px;
	}

	.project-link {
		background: none;
		border: none;
		color: var(--cyan);
		cursor: pointer;
		font-family: var(--font-mono);
		font-size: 11px;
		padding: 0;
		text-decoration: none;
	}

	.project-link:hover {
		text-decoration: underline;
	}

	.td-mono {
		font-family: var(--font-mono);
		font-size: 12px;
	}

	.expanded-row {
		cursor: default !important;
	}

	.expanded-row:hover {
		background: none !important;
	}

	.expanded-content {
		padding: 16px;
		max-height: 400px;
		overflow-y: auto;
		font-size: 13px;
		line-height: 1.6;
		color: var(--text-secondary);
	}

	.loading-text {
		color: var(--text-dim);
		font-size: 12px;
		font-style: italic;
	}

	.loading-state,
	.empty-state {
		text-align: center;
		padding: 48px 24px;
		color: var(--text-muted);
		font-size: 14px;
	}

	.error-banner {
		background: var(--red-dim);
		color: var(--red);
		padding: 10px 16px;
		border-radius: var(--radius-sm);
		margin-bottom: 16px;
		font-size: 13px;
	}
</style>
