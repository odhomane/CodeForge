<script lang="ts">
import { page } from "$app/state";
import { openSearch } from "$lib/stores/search.svelte.js";
import SearchModal from "../SearchModal.svelte";

$effect(() => {
	function handleKeydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key === "k") {
			e.preventDefault();
			openSearch();
		}
	}
	document.addEventListener("keydown", handleKeydown);
	return () => document.removeEventListener("keydown", handleKeydown);
});

let breadcrumbs = $derived(() => {
	const path = page.url.pathname;
	if (path === "/") return [{ label: "Dashboard", href: "/" }];
	const segments = path.split("/").filter(Boolean);
	const crumbs = [{ label: "Dashboard", href: "/" }];
	let href = "";
	for (const seg of segments) {
		href += `/${seg}`;
		crumbs.push({ label: seg.charAt(0).toUpperCase() + seg.slice(1), href });
	}
	return crumbs;
});
</script>

<header class="topbar">
	<nav class="breadcrumbs">
		{#each breadcrumbs() as crumb, i}
			{#if i > 0}
				<span class="separator">/</span>
			{/if}
			<a href={crumb.href} class="crumb" class:current={i === breadcrumbs().length - 1}>
				{crumb.label}
			</a>
		{/each}
	</nav>

	<button class="search-trigger" onclick={openSearch}>
		Search messages... <kbd>⌘K</kbd>
	</button>
</header>

<SearchModal />

<style>
	.topbar {
		grid-area: topbar;
		background: var(--bg-deep);
		border-bottom: 1px solid var(--border);
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 24px;
	}
	.breadcrumbs {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.separator {
		color: var(--text-dim);
		font-size: 12px;
	}
	.crumb {
		color: var(--text-muted);
		text-decoration: none;
		font-size: 13px;
		font-weight: 500;
		transition: color var(--transition);
	}
	.crumb:hover {
		color: var(--text-primary);
	}
	.crumb.current {
		color: var(--text-primary);
	}
	.search-trigger {
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		padding: 6px 12px;
		color: var(--text-dim);
		font-size: 13px;
		font-family: var(--font-ui);
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 8px;
		transition: border-color var(--transition);
	}
	.search-trigger:hover {
		border-color: var(--accent);
		color: var(--text-muted);
	}
	.search-trigger kbd {
		background: var(--bg-deep);
		padding: 2px 6px;
		border-radius: 4px;
		font-size: 11px;
		color: var(--text-dim);
	}
</style>
