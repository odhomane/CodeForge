<script lang="ts">
import type { Observation } from "$lib/stores/memory.svelte.js";

interface Props {
	observation: Observation;
	onconfirm: (content: string, tags?: string) => void;
	oncancel: () => void;
}

let { observation, onconfirm, oncancel }: Props = $props();

const needsRewrite = !observation.suggestedMemory;
let memoryText = $state(observation.suggestedMemory ?? observation.content);
let tags = $state(observation.category);
let charCount = $derived(memoryText.length);
let isVerbatim = $derived(memoryText.trim() === observation.content.trim());
let isValid = $derived(
	memoryText.trim().length > 0 && charCount <= 500 && !isVerbatim,
);

function handleKeydown(e: KeyboardEvent) {
	if (e.key === "Escape") oncancel();
}

function handleBackdropClick(e: MouseEvent) {
	if (e.target === e.currentTarget) oncancel();
}

function handleConfirm() {
	if (isValid) onconfirm(memoryText.trim(), tags.trim() || undefined);
}
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="modal-backdrop" onclick={handleBackdropClick}>
	<div class="modal-container">
		<div class="modal-header">
			<h2 class="modal-title">Approve Observation as Memory</h2>
		</div>
		<div class="modal-body">
			<div class="panel observation-panel">
				<h3 class="panel-label">Observation</h3>
				<div class="obs-card-readonly">
					<div class="obs-meta-row">
						<span class="category-badge">{observation.category}</span>
						<span class="count-badge">{observation.count}x seen</span>
						<span class="key-badge">{observation.key}</span>
					</div>
					<div class="obs-content">{observation.content}</div>
					{#if observation.evidence}
						<div class="obs-evidence">{observation.evidence}</div>
					{/if}
				</div>
			</div>
			<div class="panel memory-panel">
				<h3 class="panel-label">Memory Rule</h3>
				{#if needsRewrite || isVerbatim}
					<div class="rewrite-warning">
						⚠ Rewrite as an instruction — {needsRewrite ? "this is the raw observation text" : "memory cannot be identical to the observation"}
					</div>
				{/if}
				<p class="guidance-text">Write as an instruction: "When X, do Y" or "Always/Never X"</p>
				<textarea
					class="memory-textarea"
					class:verbatim={isVerbatim}
					bind:value={memoryText}
					placeholder="Write an actionable rule for future sessions..."
					rows="6"
				></textarea>
				<div class="char-row">
					<div class="char-count" class:over-limit={charCount > 500}>
						{charCount} / 500
					</div>
				</div>
				<div class="tag-editor">
					<label class="tag-label" for="tag-input">Tag</label>
					<input
						id="tag-input"
						class="tag-input"
						type="text"
						bind:value={tags}
						placeholder="workflow, preference, project..."
					/>
				</div>
			</div>
		</div>
		<div class="modal-footer">
			<button class="btn btn-cancel" onclick={oncancel}>Cancel</button>
			<button class="btn btn-approve" onclick={handleConfirm} disabled={!isValid}>Approve</button>
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
		max-width: 720px;
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
		display: grid;
		grid-template-columns: 2fr 3fr;
		gap: 16px;
		padding: 20px 24px;
	}

	.panel {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.panel-label {
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
		margin: 0;
	}

	.obs-card-readonly {
		background: var(--bg-surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		padding: 12px;
	}

	.obs-meta-row {
		display: flex;
		align-items: center;
		gap: 6px;
		flex-wrap: wrap;
		margin-bottom: 8px;
	}

	.category-badge {
		font-family: var(--font-mono);
		font-size: 10px;
		font-weight: 600;
		color: var(--purple);
		background: rgba(168, 85, 247, 0.12);
		padding: 2px 6px;
		border-radius: 4px;
	}

	.count-badge {
		font-family: var(--font-mono);
		font-size: 10px;
		font-weight: 600;
		color: var(--blue);
		background: rgba(59, 130, 246, 0.12);
		padding: 2px 6px;
		border-radius: 4px;
	}

	.key-badge {
		font-family: var(--font-mono);
		font-size: 10px;
		color: var(--text-dim);
		background: var(--bg-card);
		padding: 2px 6px;
		border-radius: 4px;
	}

	.obs-content {
		font-size: 13px;
		color: var(--text-primary);
		line-height: 1.5;
	}

	.obs-evidence {
		font-size: 12px;
		color: var(--text-muted);
		font-style: italic;
		margin-top: 8px;
		padding-left: 10px;
		border-left: 2px solid var(--border);
	}

	.guidance-text {
		font-size: 12px;
		color: var(--text-muted);
		margin: 0;
	}

	.memory-textarea {
		width: 100%;
		background: var(--bg-surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		color: var(--text-primary);
		font-family: var(--font-ui);
		font-size: 13px;
		line-height: 1.5;
		padding: 10px 12px;
		resize: vertical;
		box-sizing: border-box;
	}

	.memory-textarea:focus {
		outline: none;
		border-color: var(--accent);
	}

	.memory-textarea.verbatim {
		border-color: var(--amber);
	}

	.rewrite-warning {
		background: rgba(234, 179, 8, 0.12);
		border: 1px solid rgba(234, 179, 8, 0.3);
		border-radius: var(--radius-sm);
		padding: 8px 12px;
		font-size: 12px;
		color: var(--amber);
		font-weight: 500;
	}

	.char-row {
		display: flex;
		justify-content: flex-end;
	}

	.char-count {
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--text-dim);
		text-align: right;
	}

	.char-count.over-limit {
		color: var(--red);
		font-weight: 600;
	}

	.tag-editor {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-top: 4px;
	}

	.tag-label {
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-dim);
		flex-shrink: 0;
	}

	.tag-input {
		flex: 1;
		background: var(--bg-surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		color: var(--text-primary);
		font-family: var(--font-mono);
		font-size: 12px;
		padding: 5px 8px;
		box-sizing: border-box;
	}

	.tag-input:focus {
		outline: none;
		border-color: var(--accent);
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
	}

	.btn-cancel {
		background: var(--bg-surface);
		color: var(--text-secondary);
	}

	.btn-cancel:hover {
		background: var(--bg-card);
		color: var(--text-primary);
	}

	.btn-approve {
		background: var(--green);
		border-color: var(--green);
		color: #fff;
	}

	.btn-approve:hover:not(:disabled) {
		filter: brightness(1.1);
	}

	.btn-approve:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	@media (max-width: 600px) {
		.modal-body {
			grid-template-columns: 1fr;
		}
	}
</style>
