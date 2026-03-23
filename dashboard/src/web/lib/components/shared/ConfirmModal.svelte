<script lang="ts">
import type { Snippet } from "svelte";

interface Props {
	title: string;
	confirmLabel?: string;
	cancelLabel?: string;
	confirmVariant?: "accent" | "danger" | "green";
	confirmDisabled?: boolean;
	onconfirm: () => void;
	oncancel: () => void;
	children: Snippet;
}

let {
	title,
	confirmLabel = "Confirm",
	cancelLabel = "Cancel",
	confirmVariant = "accent",
	confirmDisabled = false,
	onconfirm,
	oncancel,
	children,
}: Props = $props();

function handleKeydown(e: KeyboardEvent) {
	if (e.key === "Escape") oncancel();
}

function handleBackdropClick(e: MouseEvent) {
	if (e.target === e.currentTarget) oncancel();
}
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="modal-backdrop" onclick={handleBackdropClick}>
	<div class="modal-container">
		<div class="modal-header">
			<h2 class="modal-title">{title}</h2>
		</div>
		<div class="modal-body">
			{@render children()}
		</div>
		<div class="modal-footer">
			<button class="btn btn-cancel" onclick={oncancel}>{cancelLabel}</button>
			<button
				class="btn btn-confirm {confirmVariant}"
				onclick={onconfirm}
				disabled={confirmDisabled}
			>{confirmLabel}</button>
		</div>
	</div>
</div>

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 24px;
	}

	.modal-container {
		background: var(--bg-card);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		max-width: 520px;
		width: 100%;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
	}

	.modal-header {
		padding: 20px 24px 0;
	}

	.modal-title {
		font-size: 16px;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
	}

	.modal-body {
		padding: 16px 24px;
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
		padding: 0 24px 20px;
	}

	.btn {
		font-size: 13px;
		font-weight: 500;
		padding: 7px 18px;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border);
		cursor: pointer;
		transition: all var(--transition);
		font-family: var(--font-ui);
	}

	.btn-cancel {
		background: var(--bg-surface);
		color: var(--text-secondary);
	}

	.btn-cancel:hover {
		background: var(--bg-card);
		color: var(--text-primary);
	}

	.btn-confirm.accent {
		background: var(--accent);
		border-color: var(--accent);
		color: #fff;
	}

	.btn-confirm.danger {
		background: var(--red);
		border-color: var(--red);
		color: #fff;
	}

	.btn-confirm.green {
		background: var(--green);
		border-color: var(--green);
		color: #fff;
	}

	.btn-confirm:hover:not(:disabled) {
		filter: brightness(1.1);
	}

	.btn-confirm:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
</style>
