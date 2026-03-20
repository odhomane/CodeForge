<script lang="ts">
import { goto } from "$app/navigation";
import { fetchPlans, planStore } from "$lib/stores/plans.svelte.js";
import { formatRelativeTime, formatTokens } from "$lib/utils/format.js";
import { renderMarkdown } from "$lib/utils/markdown.js";
import PlanHistory from "./PlanHistory.svelte";

let highlightedIndex = $state(-1);
let expandedSlug = $state<string | null>(null);
let historySlug = $state<string | null>(null);
let renderedContent = $state<Record<string, string>>({});
let loadingContent = $state<Record<string, boolean>>({});

$effect(() => {
	fetchPlans();
});

function toggleHistory(slug: string) {
	historySlug = historySlug === slug ? null : slug;
}

function toggleExpand(slug: string) {
	if (expandedSlug === slug) {
		expandedSlug = null;
	} else {
		expandedSlug = slug;
		if (!renderedContent[slug]) {
			loadPlanContent(slug);
		}
	}
}

async function loadPlanContent(slug: string) {
	const plan = planStore.plans.find((p) => p.slug === slug);
	if (!plan) return;

	loadingContent = { ...loadingContent, [slug]: true };

	if (plan.sessions.length > 0) {
		try {
			const res = await fetch(
				`/api/sessions/${plan.sessions[0].sessionId}/plan`,
			);
			const data = await res.json();
			if (data.plan?.content) {
				const html = await renderMarkdown(data.plan.content);
				renderedContent = { ...renderedContent, [slug]: html };
			}
		} catch {
			renderedContent = {
				...renderedContent,
				[slug]: "<p class='td-muted'>Failed to load content.</p>",
			};
		}
	} else {
		renderedContent = {
			...renderedContent,
			[slug]: "<p class='td-muted'>Orphan plan — no linked sessions.</p>",
		};
	}

	loadingContent = { ...loadingContent, [slug]: false };
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
	const plans = planStore.plans;
	if (plans.length === 0) return;

	switch (e.key) {
		case "j":
			e.preventDefault();
			highlightedIndex = Math.min(highlightedIndex + 1, plans.length - 1);
			break;
		case "k":
			e.preventDefault();
			highlightedIndex = Math.max(highlightedIndex - 1, 0);
			break;
		case "Enter":
			if (highlightedIndex >= 0 && highlightedIndex < plans.length) {
				e.preventDefault();
				toggleExpand(plans[highlightedIndex].slug);
			}
			break;
		case "Escape":
			if (expandedSlug) {
				e.preventDefault();
				expandedSlug = null;
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
			`.plans-table tbody tr:nth-child(${highlightedIndex + 1})`,
		);
		row?.scrollIntoView({ block: "nearest" });
	}
});
</script>

<svelte:window onkeydown={onKeydown} />

<div class="plans-list">
	{#if planStore.error}
		<div class="error-banner">{planStore.error}</div>
	{/if}

	{#if planStore.loading}
		<div class="loading-state">Loading plans...</div>
	{:else if planStore.plans.length === 0}
		<div class="empty-state">No plans found.</div>
	{:else}
		<div class="table-wrap">
			<table class="plans-table">
				<thead>
					<tr>
						<th>Title</th>
						<th>Slug</th>
						<th>Sessions</th>
						<th>Tokens</th>
						<th>Last Used</th>
					</tr>
				</thead>
				<tbody>
					{#each planStore.plans as plan, i (plan.slug)}
						<tr
							class:highlighted={i === highlightedIndex}
							class:orphan={plan.sessions.length === 0}
							onclick={() => toggleExpand(plan.slug)}
						>
							<td class="td-title" title={plan.title}>{plan.title}</td>
							<td class="td-mono">{plan.slug}</td>
							<td class="td-mono">{plan.sessions.length}</td>
							<td class="td-mono">~{formatTokens(plan.estimatedTokens)}</td>
							<td class="td-muted"
								>{plan.lastUsed
									? formatRelativeTime(plan.lastUsed)
									: "Never"}</td
							>
						</tr>
						{#if expandedSlug === plan.slug}
							<tr class="expanded-row">
								<td colspan="5">
									<div class="expanded-content">
										{#if plan.sessions.length > 0}
											<div class="sessions-section">
												<h4 class="section-label">Linked Sessions</h4>
												<div class="session-links">
													{#each plan.sessions as session}
														<button
															class="session-link"
															onclick={(e) => {
																e.stopPropagation();
																goto(
																	`/sessions/${session.sessionId}?tab=plan`,
																);
															}}
														>
															<span class="session-id"
																>{session.sessionId.slice(0, 8)}</span
															>
															<span class="session-project"
																>{session.project}</span
															>
															<span class="session-time"
																>{formatRelativeTime(
																	session.lastActivity,
																)}</span
															>
														</button>
													{/each}
												</div>
											</div>
										{/if}
										<div class="history-section">
											<button
												class="history-toggle"
												onclick={(e) => {
													e.stopPropagation();
													toggleHistory(plan.slug);
												}}
											>
												{historySlug === plan.slug
													? "Hide History"
													: "History"}
											</button>
											{#if historySlug === plan.slug}
												<PlanHistory slug={plan.slug} />
											{/if}
										</div>
										<div class="plan-content">
											<h4 class="section-label">Plan Content</h4>
											{#if loadingContent[plan.slug]}
												<span class="loading-text">Loading content...</span>
											{:else if renderedContent[plan.slug]}
												<div class="rendered-markdown">
													{@html renderedContent[plan.slug]}
												</div>
											{/if}
										</div>
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
	.plans-list {
		width: 100%;
	}

	.table-wrap {
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		overflow: hidden;
	}

	.plans-table {
		width: 100%;
		border-collapse: collapse;
	}

	.plans-table th {
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

	.plans-table td {
		padding: 11px 14px;
		font-size: 13px;
		color: var(--text-secondary);
		border-bottom: 1px solid var(--border-subtle);
	}

	.plans-table tbody tr {
		transition: background var(--transition);
		cursor: pointer;
	}

	.plans-table tbody tr:hover,
	.plans-table tbody tr.highlighted {
		background: var(--accent-dim);
	}

	.plans-table tbody tr.highlighted {
		border-left: 2px solid var(--accent);
	}

	.plans-table tbody tr:last-child td {
		border-bottom: none;
	}

	.plans-table tbody tr.orphan {
		opacity: 0.6;
	}

	.td-title {
		color: var(--text-primary);
		font-weight: 500;
		max-width: 300px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.td-mono {
		font-family: var(--font-mono);
		font-size: 12px;
	}

	.td-muted {
		color: var(--text-muted);
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
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.section-label {
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-muted);
		margin-bottom: 8px;
	}

	.session-links {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.session-link {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 6px 10px;
		background: var(--bg-deep);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		cursor: pointer;
		font-family: var(--font-ui);
		color: var(--text-secondary);
		font-size: 12px;
		text-align: left;
		transition: border-color var(--transition);
	}

	.session-link:hover {
		border-color: var(--accent);
	}

	.session-id {
		font-family: var(--font-mono);
		color: var(--accent);
	}

	.session-project {
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--cyan);
		background: var(--cyan-dim);
		padding: 1px 6px;
		border-radius: 3px;
	}

	.session-time {
		color: var(--text-dim);
		margin-left: auto;
	}

	.plan-content {
		max-height: 500px;
		overflow-y: auto;
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

	.history-section {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.history-toggle {
		align-self: flex-start;
		padding: 4px 12px;
		background: var(--bg-deep);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		color: var(--text-secondary);
		font-family: var(--font-ui);
		font-size: 12px;
		cursor: pointer;
		transition: border-color var(--transition);
	}

	.history-toggle:hover {
		border-color: var(--accent);
	}
</style>
