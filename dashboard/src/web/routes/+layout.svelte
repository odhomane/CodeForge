<script>
import "../app.css";
import Sidebar from "$lib/components/layout/Sidebar.svelte";
import TopBar from "$lib/components/layout/TopBar.svelte";
import { createSSEConnection } from "$lib/stores/sse.svelte.js";

let { children } = $props();
let topbar = $state(null);

$effect(() => {
	const disconnect = createSSEConnection();
	return disconnect;
});

function isInputFocused() {
	const el = document.activeElement;
	if (!el) return false;
	const tag = el.tagName;
	if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
	if (/** @type {HTMLElement} */ (el).isContentEditable) return true;
	return false;
}

function onKeydown(e) {
	if (e.key === "/" && !isInputFocused()) {
		e.preventDefault();
		topbar?.focusSearch();
	}
}
</script>

<svelte:window onkeydown={onKeydown} />

<div class="app">
	<Sidebar />
	<TopBar bind:this={topbar} />
	<main class="main">
		{@render children()}
	</main>
</div>

<style>
	.app {
		display: grid;
		grid-template-columns: 220px 1fr;
		grid-template-rows: 54px 1fr;
		grid-template-areas:
			"sidebar topbar"
			"sidebar main";
		height: 100vh;
		overflow: hidden;
	}
	.main {
		grid-area: main;
		overflow-y: auto;
		padding: 24px;
		background: var(--bg-deepest);
	}
</style>
