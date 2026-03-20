<script lang="ts">
import { page } from "$app/state";
import SessionDetail from "$lib/components/sessions/SessionDetail.svelte";
import {
	fetchSessionDetail,
	fetchSessionMessages,
	sessionStore,
} from "$lib/stores/sessions.svelte.js";

let sessionId = $derived(page.params.id);

let initialTab = $derived.by(() => {
	const tab = page.url.searchParams.get("tab");
	if (tab === "plan" || tab === "context") return tab;
	return undefined;
});

$effect(() => {
	if (sessionId) {
		fetchSessionDetail(sessionId).then(() => {
			fetchSessionMessages(sessionId);
		});
	}
});
</script>

{#if sessionStore.loading && !sessionStore.selectedSession}
  <div class="loading-state">Loading session...</div>
{:else if sessionStore.error}
  <div class="error-state">
    <div class="error-title">Error loading session</div>
    <div class="error-message">{sessionStore.error}</div>
  </div>
{:else if sessionStore.selectedSession && sessionStore.selectedSession.sessionId === sessionId}
  <SessionDetail session={sessionStore.selectedSession} {initialTab} />
{:else}
  <div class="not-found">Session not found.</div>
{/if}

<style>
  .loading-state {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 64px 24px;
    color: var(--text-muted);
    font-size: 14px;
  }

  .error-state {
    text-align: center;
    padding: 64px 24px;
  }

  .error-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--red);
    margin-bottom: 8px;
  }

  .error-message {
    font-size: 13px;
    color: var(--text-muted);
  }

  .not-found {
    text-align: center;
    padding: 64px 24px;
    color: var(--text-muted);
    font-size: 14px;
  }
</style>
