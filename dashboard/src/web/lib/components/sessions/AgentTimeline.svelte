<script lang="ts">
import { scaleTime } from "d3-scale";
import type { SubagentSession } from "$lib/stores/agents.svelte.js";

interface Props {
	agents: SubagentSession[];
	parentStart: string;
	parentEnd: string;
}

let { agents, parentStart, parentEnd }: Props = $props();

const WIDTH = 800;
const BAR_HEIGHT = 22;
const BAR_GAP = 4;
const PADDING = { top: 28, left: 140, right: 16, bottom: 28 };

function barColor(agent: SubagentSession): string {
	if (!agent.time_end) return "var(--amber)";
	const typeColors: Record<string, string> = {
		implementer: "var(--green)",
		explorer: "var(--cyan)",
		researcher: "var(--blue)",
		architect: "var(--purple)",
		"test-writer": "var(--amber)",
		refactorer: "var(--green)",
		documenter: "var(--cyan)",
		generalist: "var(--purple)",
	};
	return typeColors[agent.agent_type ?? ""] ?? "var(--purple)";
}

function formatDuration(start: string, end: string | null): string {
	const s = new Date(start).getTime();
	const e = end ? new Date(end).getTime() : Date.now();
	const sec = Math.round((e - s) / 1000);
	if (sec < 60) return `${sec}s`;
	const min = Math.floor(sec / 60);
	if (min < 60) return `${min}m ${sec % 60}s`;
	return `${Math.floor(min / 60)}h ${min % 60}m`;
}

function formatTokens(n: number): string {
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
	if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
	return String(n);
}

let filteredAgents = $derived(agents.filter((a) => a.time_start));

let xScale = $derived(
	scaleTime()
		.domain([new Date(parentStart), new Date(parentEnd)])
		.range([PADDING.left, WIDTH - PADDING.right]),
);

let bars = $derived(
	filteredAgents.map((a, i) => {
		const start = new Date(a.time_start!);
		const end = new Date(a.time_end ?? parentEnd);
		return {
			...a,
			x: xScale(start),
			width: Math.max(2, xScale(end) - xScale(start)),
			y: PADDING.top + i * (BAR_HEIGHT + BAR_GAP),
			label: a.agent_name ?? a.session_id.slice(0, 8),
		};
	}),
);

let height = $derived(
	PADDING.top + filteredAgents.length * (BAR_HEIGHT + BAR_GAP) + PADDING.bottom,
);

let ticks = $derived(xScale.ticks(6));

function formatTick(d: Date): string {
	const h = d.getHours().toString().padStart(2, "0");
	const m = d.getMinutes().toString().padStart(2, "0");
	const s = d.getSeconds().toString().padStart(2, "0");
	return `${h}:${m}:${s}`;
}

let hoveredIndex = $state<number | null>(null);
</script>

<div class="timeline-container">
    <div class="timeline-header">
        <h4>Agent Timeline</h4>
        <span class="timeline-count">{filteredAgents.length} agents</span>
    </div>
    <div class="timeline-scroll">
        <svg viewBox="0 0 {WIDTH} {height}" class="timeline-svg" role="img" aria-label="Agent execution timeline">
            <!-- Grid lines -->
            {#each ticks as tick}
                <line
                    x1={xScale(tick)}
                    y1={PADDING.top - 4}
                    x2={xScale(tick)}
                    y2={height - PADDING.bottom}
                    stroke="var(--border)"
                    stroke-dasharray="2,4"
                />
                <text
                    x={xScale(tick)}
                    y={PADDING.top - 10}
                    text-anchor="middle"
                    fill="var(--text-dim)"
                    font-size="10"
                    font-family="var(--font-mono)"
                >{formatTick(tick)}</text>
            {/each}

            <!-- Bars -->
            {#each bars as bar, i (bar.session_id)}
                <!-- Label -->
                <text
                    x={PADDING.left - 8}
                    y={bar.y + BAR_HEIGHT / 2 + 4}
                    text-anchor="end"
                    fill="var(--text-muted)"
                    font-size="11"
                    font-family="var(--font-mono)"
                >
                    {bar.label.length > 16 ? bar.label.slice(0, 15) + "\u2026" : bar.label}
                </text>

                <!-- Depth indicator -->
                {#if (bar.depth ?? 1) > 1}
                    <text
                        x={PADDING.left - 8}
                        y={bar.y + BAR_HEIGHT / 2 + 4}
                        text-anchor="end"
                        fill="var(--cyan)"
                        font-size="9"
                        font-family="var(--font-mono)"
                        dx="-{bar.label.length > 16 ? 100 : bar.label.length * 6.5 + 8}"
                    >L{bar.depth}</text>
                {/if}

                <!-- Bar -->
                <rect
                    x={bar.x}
                    y={bar.y}
                    width={bar.width}
                    height={BAR_HEIGHT}
                    rx="3"
                    fill={barColor(bar)}
                    opacity={hoveredIndex === i ? 1 : 0.75}
                    role="presentation"
                    onmouseenter={() => (hoveredIndex = i)}
                    onmouseleave={() => (hoveredIndex = null)}
                />

                <!-- Type label on bar (if wide enough) -->
                {#if bar.width > 60}
                    <text
                        x={bar.x + 6}
                        y={bar.y + BAR_HEIGHT / 2 + 4}
                        fill="var(--bg-deep)"
                        font-size="10"
                        font-weight="600"
                        font-family="var(--font-mono)"
                        pointer-events="none"
                    >{bar.agent_type ?? ""}</text>
                {/if}
            {/each}

            <!-- Tooltip -->
            {#if hoveredIndex !== null && bars[hoveredIndex]}
                {@const bar = bars[hoveredIndex]}
                {@const tooltipX = Math.min(bar.x + bar.width / 2, WIDTH - 140)}
                {@const tooltipY = bar.y + BAR_HEIGHT + 8}
                <g pointer-events="none">
                    <rect
                        x={tooltipX - 70}
                        y={tooltipY}
                        width="140"
                        height="52"
                        rx="4"
                        fill="var(--bg-card)"
                        stroke="var(--border)"
                    />
                    <text x={tooltipX} y={tooltipY + 14} text-anchor="middle" fill="var(--text-primary)" font-size="11" font-family="var(--font-mono)" font-weight="600">
                        {bar.label}
                    </text>
                    <text x={tooltipX} y={tooltipY + 28} text-anchor="middle" fill="var(--text-muted)" font-size="10" font-family="var(--font-mono)">
                        {bar.agent_type ?? "agent"} · {formatDuration(bar.time_start!, bar.time_end)}
                    </text>
                    <text x={tooltipX} y={tooltipY + 42} text-anchor="middle" fill="var(--text-dim)" font-size="10" font-family="var(--font-mono)">
                        {formatTokens((bar.input_tokens ?? 0) + (bar.output_tokens ?? 0))} tokens
                    </text>
                </g>
            {/if}
        </svg>
    </div>
</div>

<style>
    .timeline-container {
        background: var(--bg-deep);
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        margin-bottom: 16px;
        overflow: hidden;
    }
    .timeline-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 14px;
        border-bottom: 1px solid var(--border);
    }
    .timeline-header h4 {
        font-size: 13px;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
    }
    .timeline-count {
        font-family: var(--font-mono);
        font-size: 11px;
        color: var(--text-dim);
    }
    .timeline-scroll {
        max-height: 400px;
        overflow-y: auto;
        padding: 8px;
    }
    .timeline-svg {
        width: 100%;
        height: auto;
    }
</style>
