<script lang="ts">
import { formatModelName } from "$lib/utils/pricing.js";
import type {
	ContentBlock,
	SessionMessage,
	ToolResultBlock,
	ToolUseBlock,
} from "../../../../parser/types.js";
import { renderMarkdown, renderMarkdownSync } from "../../utils/markdown.js";
import TimeAgo from "../shared/TimeAgo.svelte";
import ThinkingBlockComponent from "./ThinkingBlock.svelte";
import ToolCallBlock from "./ToolCallBlock.svelte";

let {
	message,
	resultMap,
	parentSessionId,
}: {
	message: SessionMessage;
	resultMap?: Map<string, ToolResultBlock>;
	parentSessionId?: string;
} = $props();

/** Map from block index to rendered HTML for assistant text blocks */
let renderedBlocks = $state<Record<number, string>>({});

$effect(() => {
	if (message.type !== "assistant") return;
	const blocks = message.message.content;
	for (let i = 0; i < blocks.length; i++) {
		const block = blocks[i];
		if (block.type === "text" && block.text) {
			const idx = i;
			renderMarkdown(block.text).then((html) => {
				renderedBlocks[idx] = html;
			});
		}
	}
});

let systemExpanded = $state(false);

/** Extract plain text from user content that may be string or ContentBlock[] */
function getUserText(content: string | ContentBlock[]): string {
	if (typeof content === "string") return content;
	return content
		.filter((b): b is { type: "text"; text: string } => b.type === "text")
		.map((b) => b.text)
		.join("\n");
}
</script>

{#if message.type === 'user'}
  {@const userText = getUserText(message.message.content)}
  <div class="msg user">
    <div class="msg-header">
      <span class="msg-role user-role">User</span>
      <TimeAgo date={message.timestamp} />
    </div>
    {#if userText}
      <div class="msg-text">{userText}</div>
    {/if}
  </div>

{:else if message.type === 'assistant'}
  {@const pairedResults = resultMap ?? new Map()}
  <div class="msg assistant">
    <div class="msg-header">
      <span class="msg-header-left">
        <span class="msg-role assistant-role">Assistant</span>
        {#if message.message.model}
          <span class="msg-model-badge">{formatModelName(message.message.model)}</span>
        {/if}
      </span>
      <TimeAgo date={message.timestamp} />
    </div>
    {#each message.message.content as block, i}
      {#if block.type === 'thinking'}
        <ThinkingBlockComponent {block} />
      {:else if block.type === 'text'}
        {#if renderedBlocks[i]}
          <div class="msg-text rendered-markdown">{@html renderedBlocks[i]}</div>
        {:else}
          <div class="msg-text rendered-markdown">{@html renderMarkdownSync(block.text)}</div>
        {/if}
      {:else if block.type === 'tool_use'}
        <div class="tool-calls-area">
          <ToolCallBlock block={block as ToolUseBlock} result={pairedResults.get(block.id)} {parentSessionId} />
        </div>
      {/if}
    {/each}
  </div>

{:else if message.type === 'system'}
  <div class="msg system" class:collapsed={!systemExpanded}>
    <button class="system-toggle" onclick={() => systemExpanded = !systemExpanded}>
      <span class="chevron">{systemExpanded ? '\u25BC' : '\u25B6'}</span>
      <span class="msg-role system-role">System</span>
      {#if message.subtype}
        <span class="system-subtype">{message.subtype}</span>
      {/if}
    </button>
    {#if systemExpanded}
      <div class="system-content">
        <pre class="system-json">{JSON.stringify(
          Object.fromEntries(
            Object.entries(message).filter(([k]) =>
              !['message', 'parentUuid', 'uuid', 'sessionId', 'version', 'cwd', 'userType'].includes(k)
            )
          ), null, 2
        )}</pre>
      </div>
    {/if}
  </div>

{:else if message.type === 'summary'}
  <div class="msg summary">
    <div class="msg-header">
      <span class="msg-role summary-role">Summary</span>
      <TimeAgo date={message.timestamp} />
    </div>
    <div class="summary-text">{message.summary}</div>
  </div>
{/if}

<style>
  .msg {
    border-radius: var(--radius-md);
    padding: 16px 20px;
    border: 1px solid var(--border);
    border-bottom: 1px solid var(--border-subtle);
  }

  .msg.user {
    background: var(--bg-card);
    border-left: 3px solid var(--accent);
  }

  .msg.assistant {
    background: var(--bg-deep);
    border-left: 3px solid var(--purple);
  }

  .msg.system {
    background: var(--bg-deep);
    border-left: 3px solid var(--text-dim);
    padding: 10px 16px;
  }

  .msg.summary {
    background: var(--bg-card);
    border-left: 3px solid var(--cyan);
  }

  .msg-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .msg-role {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .msg-header-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .msg-model-badge {
    font-size: 11px;
    font-family: var(--font-mono);
    color: var(--purple);
    background: var(--purple-dim);
    padding: 1px 6px;
    border-radius: 4px;
  }

  .user-role { color: var(--accent); }
  .assistant-role { color: var(--purple); }
  .system-role { color: var(--text-dim); }
  .summary-role { color: var(--cyan); }

  .msg-text {
    font-size: 13.5px;
    line-height: 1.65;
    color: var(--text-primary);
    white-space: pre-wrap;
    word-break: break-word;
  }

  .tool-calls-area {
    margin-top: 8px;
  }

  .system-toggle {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    font-family: var(--font-ui);
  }

  .chevron {
    font-size: 10px;
    color: var(--text-muted);
    width: 14px;
    text-align: center;
  }

  .system-subtype {
    font-size: 11px;
    color: var(--text-dim);
    font-family: var(--font-mono);
  }

  .system-content {
    margin-top: 8px;
    font-size: 12px;
    color: var(--text-dim);
  }

  .summary-text {
    font-size: 13px;
    line-height: 1.6;
    color: var(--text-secondary);
    padding: 8px 12px;
    background: var(--cyan-dim);
    border-radius: var(--radius-sm);
    white-space: pre-wrap;
  }

  .system-json {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-dim);
    white-space: pre-wrap;
    word-break: break-all;
    margin: 0;
    padding: 8px;
    background: rgba(0, 0, 0, 0.1);
    border-radius: var(--radius-sm);
    max-height: 200px;
    overflow-y: auto;
  }
</style>
