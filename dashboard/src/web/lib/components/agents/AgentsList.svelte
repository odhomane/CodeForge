<script lang="ts">
import { goto } from "$app/navigation";
import {
	type AgentTypeSummary,
	agentStore,
	fetchAgents,
	type SubagentSession,
} from "$lib/stores/agents.svelte.js";

let selectedIndex = $state(0);
let loaded = $state(false);

$effect(() => {
	if (!loaded) {
		fetchAgents();
		loaded = true;
	}
});

function formatTokens(n: number): string {
	if (!n) return "0";
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
	if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
	return String(n);
}

function formatDuration(start: string | null, end: string | null): string {
	if (!start) return "\u2014";
	const s = new Date(start).getTime();
	const e = end ? new Date(end).getTime() : Date.now();
	const sec = Math.round((e - s) / 1000);
	if (sec < 60) return `${sec}s`;
	const min = Math.floor(sec / 60);
	if (min < 60) return `${min}m ${sec % 60}s`;
	return `${Math.floor(min / 60)}h ${min % 60}m`;
}

function timeAgo(ts: string | null): string {
	if (!ts) return "\u2014";
	const diff = Date.now() - new Date(ts).getTime();
	const mins = Math.floor(diff / 60000);
	if (mins < 60) return `${mins}m ago`;
	const hrs = Math.floor(mins / 60);
	if (hrs < 24) return `${hrs}h ago`;
	return `${Math.floor(hrs / 24)}d ago`;
}

function isInputFocused(): boolean {
	const el = document.activeElement;
	if (!el) return false;
	const tag = el.tagName;
	if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
	if ((el as HTMLElement).isContentEditable) return true;
	return false;
}

function handleKeydown(e: KeyboardEvent) {
	if (isInputFocused()) return;
	const items = agentStore.recent;
	if (!items.length) return;
	if (e.key === "j" || e.key === "ArrowDown") {
		e.preventDefault();
		selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
	} else if (e.key === "k" || e.key === "ArrowUp") {
		e.preventDefault();
		selectedIndex = Math.max(selectedIndex - 1, 0);
	} else if (e.key === "Enter") {
		e.preventDefault();
		const item = items[selectedIndex] as any;
		if (item?.parent_session_id) {
			goto(`/sessions/${item.parent_session_id}?tab=agents`);
		}
	}
}

function navigateToParent(parentId: string) {
	goto(`/sessions/${parentId}?tab=agents`);
}

$effect(() => {
	if (selectedIndex >= 0) {
		const row = document.querySelector(
			`.agents-table tbody tr:nth-child(${selectedIndex + 1})`,
		);
		row?.scrollIntoView({ block: "nearest" });
	}
});
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="agents-page">
	{#if agentStore.loading}
		<div class="loading-state">Loading agents...</div>
	{:else if agentStore.error}
		<div class="error-banner">{agentStore.error}</div>
	{:else}
		<!-- Type breakdown -->
		{#if agentStore.byType.length > 0}
			<div class="type-breakdown">
				<h2>By Type</h2>
				<div class="type-cards">
					{#each agentStore.byType as t (t.agent_type)}
						<div class="type-card">
							<span class="type-badge"
								>{t.agent_type ?? "unknown"}</span
							>
							<div class="type-stats">
								<span class="type-count">{t.count}</span>
								<span class="type-label">sessions</span>
							</div>
							<div class="type-tokens">
								<span
									>{formatTokens(
										t.total_input + t.total_output,
									)} tokens</span
								>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Recent agents table -->
		<div class="recent-section">
			<h2>Recent Agents</h2>
			<span class="total-count"
				>{agentStore.totalCount} total agent sessions</span
			>
			{#if agentStore.recent.length === 0}
				<div class="empty-state">No agent sessions found</div>
			{:else}
				<div class="table-wrapper">
					<table class="agents-table">
						<thead>
							<tr>
								<th>Agent</th>
								<th>Type</th>
								<th>Project</th>
								<th>Tokens</th>
								<th>Messages</th>
								<th>Duration</th>
								<th>Time</th>
							</tr>
						</thead>
						<tbody>
							{#each agentStore.recent as agent, i (agent.session_id)}
								{@const row = agent as any}
								<tr
									class:highlighted={i === selectedIndex}
									onclick={() =>
										navigateToParent(
											agent.parent_session_id,
										)}
									onmouseenter={() =>
										(selectedIndex = i)}
								>
									<td class="agent-name-cell">
										{agent.agent_name ??
											agent.session_id.slice(0, 8)}
									</td>
									<td>
										{#if agent.agent_type}
											<span class="type-badge-sm"
												>{agent.agent_type}</span
											>
										{:else}
											<span class="td-muted"
												>&mdash;</span
											>
										{/if}
									</td>
									<td class="td-muted"
										>{row.project_name ?? "\u2014"}</td
									>
									<td
										>{formatTokens(
											(agent.input_tokens ?? 0) +
												(agent.output_tokens ?? 0),
										)}</td
									>
									<td>{agent.message_count ?? 0}</td>
									<td
										>{formatDuration(
											agent.time_start,
											agent.time_end,
										)}</td
									>
									<td class="td-muted"
										>{timeAgo(agent.time_start)}</td
									>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.agents-page {
		width: 100%;
	}

	.total-count {
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--text-dim);
		margin-left: 8px;
	}

	h2 {
		font-size: 14px;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0 0 12px;
		display: inline;
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

	/* Type breakdown */
	.type-breakdown {
		margin-bottom: 24px;
	}
	.type-cards {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		margin-top: 12px;
	}
	.type-card {
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		padding: 12px 16px;
		min-width: 140px;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.type-badge {
		font-family: var(--font-mono);
		font-size: 11px;
		padding: 1px 6px;
		border-radius: 4px;
		background: var(--purple-dim);
		color: var(--purple);
		align-self: flex-start;
	}
	.type-stats {
		display: flex;
		align-items: baseline;
		gap: 4px;
	}
	.type-count {
		font-family: var(--font-mono);
		font-size: 20px;
		font-weight: 600;
		color: var(--text-primary);
	}
	.type-label {
		font-size: 12px;
		color: var(--text-muted);
	}
	.type-tokens {
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--text-dim);
	}

	/* Table */
	.recent-section {
		margin-bottom: 24px;
	}
	.table-wrapper {
		margin-top: 12px;
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		overflow: hidden;
	}
	.agents-table {
		width: 100%;
		border-collapse: collapse;
	}
	.agents-table th {
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
	.agents-table td {
		padding: 11px 14px;
		font-size: 13px;
		color: var(--text-secondary);
		border-bottom: 1px solid var(--border-subtle);
	}
	.agents-table tbody tr {
		transition: background var(--transition);
		cursor: pointer;
	}
	.agents-table tbody tr:hover,
	.agents-table tbody tr.highlighted {
		background: var(--accent-dim);
	}
	.agents-table tbody tr.highlighted {
		border-left: 2px solid var(--accent);
	}
	.agent-name-cell {
		font-weight: 500;
		font-family: var(--font-mono);
		font-size: 12px;
	}
	.type-badge-sm {
		font-family: var(--font-mono);
		font-size: 10px;
		padding: 1px 5px;
		border-radius: 3px;
		background: var(--purple-dim);
		color: var(--purple);
	}
	.td-muted {
		color: var(--text-muted);
		font-size: 12px;
	}
</style>
