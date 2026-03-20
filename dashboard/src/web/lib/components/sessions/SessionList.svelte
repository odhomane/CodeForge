<script lang="ts">
import { goto } from "$app/navigation";
import {
	fetchSessions,
	sessionStore,
	setFilters,
} from "$lib/stores/sessions.svelte.js";
import {
	formatCost,
	formatDuration,
	formatRelativeTime,
	formatTokens,
	truncateText,
} from "$lib/utils/format.js";
import { formatModelName } from "$lib/utils/pricing.js";

const PAGE_SIZE = 25;
let currentPage = $state(0);
let highlightedIndex = $state(-1);

let totalPages = $derived(
	Math.max(1, Math.ceil(sessionStore.totalCount / PAGE_SIZE)),
);

/** Unique project names from loaded sessions */
let projectOptions = $derived.by(() => {
	const projects = new Set<string>();
	for (const s of sessionStore.sessions) {
		if (s.project) projects.add(s.project);
	}
	return Array.from(projects).sort();
});

/** Unique model names from loaded sessions */
let modelOptions = $derived.by(() => {
	const models = new Set<string>();
	for (const s of sessionStore.sessions) {
		if (s.meta?.models) {
			for (const m of s.meta.models) models.add(m);
		}
	}
	return Array.from(models).sort();
});

function changePage(newPage: number) {
	currentPage = newPage;
	highlightedIndex = -1;
	fetchSessions({
		project: sessionStore.filters.project || undefined,
		model: sessionStore.filters.model || undefined,
		since: sessionStore.filters.since || undefined,
		limit: PAGE_SIZE,
		offset: newPage * PAGE_SIZE,
	});
}

function onProjectChange(e: Event) {
	const val = (e.target as HTMLSelectElement).value;
	setFilters({ project: val });
	currentPage = 0;
	fetchSessions({
		project: val || undefined,
		model: sessionStore.filters.model || undefined,
		since: sessionStore.filters.since || undefined,
		limit: PAGE_SIZE,
		offset: 0,
	});
}

function onModelChange(e: Event) {
	const val = (e.target as HTMLSelectElement).value;
	setFilters({ model: val });
	currentPage = 0;
	fetchSessions({
		project: sessionStore.filters.project || undefined,
		model: val || undefined,
		since: sessionStore.filters.since || undefined,
		limit: PAGE_SIZE,
		offset: 0,
	});
}

function onSinceChange(e: Event) {
	const val = (e.target as HTMLInputElement).value;
	setFilters({ since: val });
	currentPage = 0;
	fetchSessions({
		project: sessionStore.filters.project || undefined,
		model: sessionStore.filters.model || undefined,
		since: val || undefined,
		limit: PAGE_SIZE,
		offset: 0,
	});
}

function navigateToSession(id: string) {
	goto(`/sessions/${id}`);
}

function totalTokensForSession(s: (typeof sessionStore.sessions)[0]): number {
	if (!s.meta) return 0;
	const t = s.meta.totalTokens;
	return t.input + t.output + t.cacheRead + t.cacheCreation;
}

function durationForSession(s: (typeof sessionStore.sessions)[0]): number {
	if (!s.meta?.timeRange) return 0;
	return (
		new Date(s.meta.timeRange.end).getTime() -
		new Date(s.meta.timeRange.start).getTime()
	);
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
	const sessions = sessionStore.sessions;
	if (sessions.length === 0) return;

	switch (e.key) {
		case "j":
			e.preventDefault();
			highlightedIndex = Math.min(highlightedIndex + 1, sessions.length - 1);
			break;
		case "k":
			e.preventDefault();
			highlightedIndex = Math.max(highlightedIndex - 1, 0);
			break;
		case "Enter":
			if (highlightedIndex >= 0 && highlightedIndex < sessions.length) {
				e.preventDefault();
				navigateToSession(sessions[highlightedIndex].sessionId);
			}
			break;
		case "[":
			if (currentPage > 0) {
				e.preventDefault();
				changePage(currentPage - 1);
			}
			break;
		case "]":
			if (currentPage < totalPages - 1) {
				e.preventDefault();
				changePage(currentPage + 1);
			}
			break;
		case "Escape":
			if (highlightedIndex >= 0) {
				e.preventDefault();
				highlightedIndex = -1;
			}
			break;
	}
}

// Scroll highlighted row into view
$effect(() => {
	if (highlightedIndex >= 0) {
		const row = document.querySelector(
			`.sessions-table tbody tr:nth-child(${highlightedIndex + 1})`,
		);
		row?.scrollIntoView({ block: "nearest" });
	}
});

// Reset highlight when filters change
$effect(() => {
	sessionStore.filters;
	highlightedIndex = -1;
});
</script>

<svelte:window onkeydown={onKeydown} />

<div class="session-list">
  <!-- Filters bar -->
  <div class="filters-bar">
    <select class="filter-select" value={sessionStore.filters.project} onchange={onProjectChange}>
      <option value="">All Projects</option>
      {#each projectOptions as proj}
        <option value={proj}>{proj}</option>
      {/each}
    </select>

    <select class="filter-select" value={sessionStore.filters.model} onchange={onModelChange}>
      <option value="">All Models</option>
      {#each modelOptions as model}
        <option value={model}>{formatModelName(model)}</option>
      {/each}
    </select>

    <input
      class="filter-date"
      type="date"
      value={sessionStore.filters.since}
      onchange={onSinceChange}
      title="Show sessions since this date"
    />
  </div>

  <!-- Error state -->
  {#if sessionStore.error}
    <div class="error-banner">{sessionStore.error}</div>
  {/if}

  <!-- Loading state -->
  {#if sessionStore.loading}
    <div class="loading-state">Loading sessions...</div>
  {:else if sessionStore.sessions.length === 0}
    <div class="empty-state">No sessions found.</div>
  {:else}
    <!-- Sessions table -->
    <div class="sessions-table-wrap">
      <table class="sessions-table">
        <thead>
          <tr>
            <th>Session ID</th>
            <th>Project</th>
            <th>Last Prompt</th>
            <th>Model</th>
            <th>Tokens</th>
            <th>Cost</th>
            <th>Duration</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {#each sessionStore.sessions as session, i (session.sessionId)}
            <tr onclick={() => navigateToSession(session.sessionId)} class:highlighted={i === highlightedIndex}>
              <td class="td-mono">
                {#if session.isActive}<span class="active-dot" title="Session is active"></span>{/if}
                {session.sessionId.slice(0, 8)}
                {#if session.hasPlan}
                  <span
                    class="plan-indicator"
                    title="Has plan: {session.planSlug ?? 'plan'}"
                    onclick={(e) => { e.stopPropagation(); goto(`/sessions/${session.sessionId}?tab=plan`); }}
                    onkeydown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); goto(`/sessions/${session.sessionId}?tab=plan`); } }}
                    role="link"
                    tabindex="0"
                  >
                    <svg class="plan-icon" viewBox="0 0 14 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="1" y="0.5" width="12" height="15" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
                      <line x1="4" y1="4.5" x2="10" y2="4.5" stroke="currentColor" stroke-width="1"/>
                      <line x1="4" y1="7.5" x2="10" y2="7.5" stroke="currentColor" stroke-width="1"/>
                      <line x1="4" y1="10.5" x2="8" y2="10.5" stroke="currentColor" stroke-width="1"/>
                    </svg>
                    <span class="plan-slug-text">{session.planSlug ?? 'plan'}</span>
                  </span>
                {/if}
                {#if session.hasTeam}
                  <span
                    class="team-indicator"
                    title="Team: {session.teamName ?? 'team'}"
                    onclick={(e) => { e.stopPropagation(); goto(`/sessions/${session.sessionId}?tab=tasks`); }}
                    onkeydown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); goto(`/sessions/${session.sessionId}?tab=tasks`); } }}
                    role="link"
                    tabindex="0"
                  >
                    <svg class="team-icon" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="1" y="3" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.2"/>
                      <rect x="9" y="3" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.2"/>
                      <rect x="5" y="9" width="6" height="6" rx="1" stroke="currentColor" stroke-width="1.2"/>
                    </svg>
                    <span class="team-name-text">{session.teamName ?? 'team'}</span>
                    {#if session.taskProgress}
                      <span class="task-progress-mini">
                        <span class="task-progress-mini-count">{session.taskProgress.completed}</span>
                        <span class="task-progress-mini-sep">/</span>
                        <span class="task-progress-mini-total">{session.taskProgress.total}</span>
                      </span>
                    {/if}
                  </span>
                {/if}
              </td>
              <td>
                {#if session.project}
                  <span class="project-tag">{session.project}</span>
                {:else}
                  <span class="td-muted">-</span>
                {/if}
              </td>
              <td class="td-prompt" title={session.lastPrompt ?? ""}>{session.lastPrompt ? truncateText(session.lastPrompt, 80) : '-'}</td>
              <td class="td-mono">{session.meta?.models?.[0] ? formatModelName(session.meta.models[0]) : '-'}</td>
              <td class="td-mono">{formatTokens(totalTokensForSession(session))}</td>
              <td class="td-cost">{session.cost ? formatCost(session.cost.totalCost) : '-'}</td>
              <td class="td-muted">{formatDuration(durationForSession(session))}</td>
              <td class="td-muted">{formatRelativeTime(session.timestamps.last)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="pagination">
      <button class="page-btn" disabled={currentPage === 0} onclick={() => changePage(currentPage - 1)}>Previous</button>
      <span class="page-info">Page {currentPage + 1} of {totalPages} ({sessionStore.totalCount} total)</span>
      <button class="page-btn" disabled={currentPage >= totalPages - 1} onclick={() => changePage(currentPage + 1)}>Next</button>
    </div>
  {/if}
</div>

<style>
  .session-list {
    width: 100%;
  }

  .filters-bar {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }

  .filter-select,
  .filter-date {
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
  }

  .filter-select {
    appearance: none;
    -webkit-appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 5l3 3 3-3' stroke='%2378716c' stroke-width='1.5' fill='none'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
    padding-right: 30px;
  }

  .filter-select:focus,
  .filter-date:focus {
    border-color: var(--accent);
  }

  .filter-select option {
    background: var(--bg-card);
    color: var(--text-primary);
  }

  .sessions-table-wrap {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    overflow: hidden;
  }

  .sessions-table {
    width: 100%;
    border-collapse: collapse;
  }

  .sessions-table th {
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

  .sessions-table td {
    padding: 11px 14px;
    font-size: 13px;
    color: var(--text-secondary);
    border-bottom: 1px solid var(--border-subtle);
  }

  .sessions-table tbody tr {
    transition: background var(--transition);
    cursor: pointer;
  }

  .sessions-table tbody tr:hover,
  .sessions-table tbody tr.highlighted {
    background: var(--accent-dim);
  }

  .sessions-table tbody tr.highlighted {
    border-left: 2px solid var(--accent);
  }

  .sessions-table tbody tr:last-child td {
    border-bottom: none;
  }

  .active-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--green);
    margin-right: 6px;
    vertical-align: middle;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  .td-mono {
    font-family: var(--font-mono);
    font-size: 12px;
  }

  .plan-indicator {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-left: 6px;
    cursor: pointer;
    color: var(--text-dim);
    vertical-align: middle;
  }

  .plan-indicator:hover {
    color: var(--accent);
  }

  .plan-icon {
    width: 12px;
    height: 14px;
    flex-shrink: 0;
  }

  .plan-slug-text {
    font-size: 10px;
    color: var(--text-dim);
    max-width: 80px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .plan-indicator:hover .plan-slug-text {
    color: var(--accent);
  }

  .team-indicator {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-left: 6px;
    cursor: pointer;
    color: var(--text-dim);
    vertical-align: middle;
  }

  .team-indicator:hover {
    color: var(--amber);
  }

  .team-icon {
    width: 12px;
    height: 14px;
    flex-shrink: 0;
  }

  .team-name-text {
    font-size: 10px;
    color: var(--text-dim);
    max-width: 80px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .team-indicator:hover .team-name-text {
    color: var(--amber);
  }

  .task-progress-mini {
    font-family: var(--font-mono);
    font-size: 10px;
    margin-left: 4px;
  }

  .task-progress-mini-count {
    color: var(--green);
    font-weight: 600;
  }

  .task-progress-mini-sep {
    color: var(--text-dim);
    margin: 0 1px;
  }

  .task-progress-mini-total {
    color: var(--text-secondary);
  }

  .td-prompt {
    color: var(--text-primary);
    max-width: 280px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .td-muted {
    color: var(--text-muted);
    font-size: 12px;
  }

  .td-cost {
    color: var(--green);
    font-family: var(--font-mono);
    font-size: 12px;
  }

  .project-tag {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--cyan);
    background: var(--cyan-dim);
    padding: 2px 8px;
    border-radius: 4px;
  }

  .pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin-top: 16px;
    padding: 12px 0;
  }

  .page-btn {
    background: var(--bg-card);
    border: 1px solid var(--border);
    color: var(--text-secondary);
    padding: 6px 16px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-family: var(--font-ui);
    font-size: 13px;
    transition: background var(--transition), border-color var(--transition);
  }

  .page-btn:hover:not(:disabled) {
    background: var(--accent-dim);
    border-color: var(--accent);
    color: var(--accent);
  }

  .page-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .page-info {
    font-size: 12px;
    color: var(--text-muted);
    font-family: var(--font-mono);
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
