import { resolve } from "path";
import { getDb } from "../parser/db.js";
import {
	incrementStaleness,
	insertMemory,
	insertMemoryRun,
	insertObservation,
	insertObservationHistory,
	insertRunObservation,
	queryMemoryRunDetail,
	queryObservationsForProject,
	updateMemoryRun,
	updateObservationReinforcement,
	updateObservationStatus,
} from "../parser/queries.js";
import { getEventBus } from "./event-bus.js";

const SCRIPT_PATH = resolve(import.meta.dir, "../../scripts/query-db.ts");

function resolveClaude(): string {
	return Bun.which("claude") ?? "/home/vscode/.local/bin/claude";
}

const ANALYSIS_SCHEMA = {
	type: "object" as const,
	properties: {
		reinforced_observations: {
			type: "array" as const,
			items: {
				type: "object" as const,
				properties: {
					id: { type: "number" as const },
					reason: { type: "string" as const },
				},
				required: ["id", "reason"],
			},
		},
		new_observations: {
			type: "array" as const,
			items: {
				type: "object" as const,
				properties: {
					category: { type: "string" as const },
					key: { type: "string" as const },
					content: { type: "string" as const },
					evidence: { type: "string" as const },
				},
				required: ["category", "key", "content"],
			},
		},
		summary: { type: "string" as const },
	},
	required: ["reinforced_observations", "new_observations", "summary"],
};

const MAINTENANCE_SCHEMA = {
	type: "object" as const,
	properties: {
		consolidations: {
			type: "array" as const,
			items: {
				type: "object" as const,
				properties: {
					merge_ids: {
						type: "array" as const,
						items: { type: "number" as const },
					},
					surviving_id: { type: "number" as const },
					new_content: { type: "string" as const },
					reason: { type: "string" as const },
				},
				required: ["merge_ids", "surviving_id", "new_content", "reason"],
			},
		},
		promotions: {
			type: "array" as const,
			items: {
				type: "object" as const,
				properties: {
					observation_id: { type: "number" as const },
					memory_content: { type: "string" as const },
					confidence: { type: "number" as const },
					reason: { type: "string" as const },
				},
				required: ["observation_id", "memory_content", "confidence", "reason"],
			},
		},
		stale_removals: {
			type: "array" as const,
			items: {
				type: "object" as const,
				properties: {
					observation_id: { type: "number" as const },
					reason: { type: "string" as const },
				},
				required: ["observation_id", "reason"],
			},
		},
		summary: { type: "string" as const },
	},
	required: ["consolidations", "promotions", "stale_removals", "summary"],
};

function buildAnalysisPrompt(
	sessionId: string,
	projectId: string,
	existingObservations: Array<{
		id: number;
		category: string;
		content: string;
		key: string;
		count: number;
		sessionsSinceLastSeen: number;
	}>,
): string {
	const obsBlock =
		existingObservations.length > 0
			? existingObservations
					.map(
						(o) =>
							`  - [id=${o.id}] (${o.category}) "${o.content}" [key=${o.key}, seen=${o.count}x, stale=${o.sessionsSinceLastSeen}]`,
					)
					.join("\n")
			: "  (none yet)";

	return `You are a memory analyzer for a coding assistant dashboard. Your job is to analyze a Claude Code session and extract behavioral observations about the user and project.

## Context
- Session ID: ${sessionId}
- Project ID: ${projectId}
- Script path for querying the dashboard DB: ${SCRIPT_PATH}

## Existing observations for this project:
${obsBlock}

## Instructions

1. Use the script at ${SCRIPT_PATH} to query session data:
   - \`bun run ${SCRIPT_PATH} messages ${sessionId}\` — get session messages
   - \`bun run ${SCRIPT_PATH} session ${sessionId}\` — get session metadata
   - \`bun run ${SCRIPT_PATH} tools ${sessionId}\` — get tool usage

2. Analyze the session for patterns in these categories:
   - **workflow**: How the user works (e.g., test-first, iterative, planning-heavy)
   - **preference**: User preferences (e.g., coding style, framework choices, communication style)
   - **project**: Project-specific patterns (e.g., architecture decisions, conventions)
   - **pain_point**: Recurring issues or frustrations
   - **expertise**: User's skill areas and knowledge level

3. For each existing observation that this session reinforces, include it in reinforced_observations with the observation id.

4. For genuinely new observations not covered by existing ones, add them to new_observations. Use a descriptive key in the format "category:short-descriptor" (e.g., "workflow:test-first", "preference:typescript-strict").

5. Be selective — only create observations with clear evidence from the session. Quality over quantity.

Return your analysis as structured JSON.`;
}

function buildMaintenancePrompt(
	projectId: string,
	existingObservations: Array<{
		id: number;
		category: string;
		content: string;
		key: string;
		count: number;
		sessionsSinceLastSeen: number;
	}>,
): string {
	const obsBlock =
		existingObservations.length > 0
			? existingObservations
					.map(
						(o) =>
							`  - [id=${o.id}] (${o.category}) "${o.content}" [key=${o.key}, seen=${o.count}x, stale=${o.sessionsSinceLastSeen}]`,
					)
					.join("\n")
			: "  (none)";

	return `You are a memory maintenance agent for a coding assistant dashboard. Your job is to consolidate, promote, and clean up observations for a project.

## Context
- Project ID: ${projectId}

## Current observations:
${obsBlock}

## Instructions

1. **Consolidations**: Find observations that overlap or describe the same underlying pattern. Merge them by specifying which ids to merge, which id survives, and what the new combined content should be.

2. **Promotions**: Observations seen 3+ times with low staleness are candidates for promotion to permanent memories. Only promote high-confidence patterns.

3. **Stale removals**: Observations with high sessions_since_last_seen (5+) and low count (1-2) are likely one-off patterns. Mark them for removal.

4. Be conservative — only act on clear cases. It's better to leave observations alone than to incorrectly consolidate or remove them.

Return your maintenance plan as structured JSON.`;
}

interface StreamJsonEvent {
	type: string;
	[key: string]: unknown;
}

async function runClaude(
	runId: string,
	runType: string,
	projectId: string,
	sessionId: string | null,
	prompt: string,
	schema: object,
	budget: number,
): Promise<void> {
	const db = getDb();
	const eventBus = getEventBus();
	const claudeBin = resolveClaude();
	const startTime = Date.now();
	const events: StreamJsonEvent[] = [];
	let resultOutput: unknown = null;
	let model: string | undefined;
	let inputTokens = 0;
	let outputTokens = 0;
	let numTurns = 0;

	// Look up project path for CWD
	let cwd: string | undefined;
	const projRow = db
		.prepare("SELECT path FROM projects WHERE encoded_name = ?")
		.get(projectId) as { path: string } | null;
	if (projRow) cwd = projRow.path;

	try {
		const proc = Bun.spawn(
			[
				claudeBin,
				"-p",
				prompt,
				"--output-format",
				"stream-json",
				"--json-schema",
				JSON.stringify(schema),
				"--model",
				"sonnet",
				"--no-session-persistence",
				"--max-budget-usd",
				String(budget),
				"--allowedTools",
				"Bash(bun run *)",
				"Read",
				"Glob",
				"Grep",
				"--disallowedTools",
				"Write",
				"Edit",
				"NotebookEdit",
				"Agent",
				"WebFetch",
				"WebSearch",
			],
			{
				cwd: cwd || undefined,
				stdout: "pipe",
				stderr: "pipe",
			},
		);

		const reader = proc.stdout.getReader();
		const decoder = new TextDecoder();
		let buffer = "";

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });
			const lines = buffer.split("\n");
			buffer = lines.pop() ?? "";

			for (const line of lines) {
				const trimmed = line.trim();
				if (!trimmed) continue;

				try {
					const event = JSON.parse(trimmed) as StreamJsonEvent;
					events.push(event);

					// Track model from message events
					if (event.type === "assistant" && event.model) {
						model = event.model as string;
					}

					// Track usage from usage events
					if (event.type === "usage") {
						const usage = event as {
							type: string;
							input_tokens?: number;
							output_tokens?: number;
						};
						if (usage.input_tokens) inputTokens += usage.input_tokens;
						if (usage.output_tokens) outputTokens += usage.output_tokens;
					}

					// Track turns
					if (event.type === "assistant") {
						numTurns++;
					}

					// Capture result
					if (event.type === "result") {
						resultOutput = (event as { structured_output?: unknown })
							.structured_output;
					}

					// Emit SSE event for progress
					eventBus.emit("memory:run_event", {
						timestamp: new Date().toISOString(),
						runId,
						runType,
						runStatus: "running",
						projectId,
					});
				} catch {
					// Skip non-JSON lines
				}
			}
		}

		// Process remaining buffer
		if (buffer.trim()) {
			try {
				const event = JSON.parse(buffer.trim()) as StreamJsonEvent;
				events.push(event);
				if (event.type === "result") {
					resultOutput = (event as { structured_output?: unknown })
						.structured_output;
				}
			} catch {
				// ignore
			}
		}

		const exitCode = await proc.exited;
		const durationMs = Date.now() - startTime;

		if (exitCode !== 0) {
			const stderr = await new Response(proc.stderr).text();
			updateMemoryRun(db, runId, {
				status: "error",
				model,
				costUsd: 0,
				inputTokens,
				outputTokens,
				numTurns,
				durationMs,
				eventsJson: JSON.stringify(events),
				error: stderr || `Process exited with code ${exitCode}`,
				completedAt: new Date().toISOString(),
			});

			eventBus.emit("memory:run_complete", {
				timestamp: new Date().toISOString(),
				runId,
				runType,
				runStatus: "error",
				projectId,
			});
			return;
		}

		// Process results
		if (resultOutput && runType === "analysis" && sessionId) {
			processAnalysisResult(db, runId, projectId, sessionId, resultOutput);
		} else if (resultOutput && runType === "maintenance") {
			processMaintenanceResult(db, runId, projectId, resultOutput);
		}

		// Calculate cost estimate from tokens
		// Sonnet pricing: ~$3/MTok input, ~$15/MTok output
		const costUsd =
			(inputTokens / 1_000_000) * 3 + (outputTokens / 1_000_000) * 15;

		updateMemoryRun(db, runId, {
			status: "completed",
			model,
			costUsd,
			inputTokens,
			outputTokens,
			numTurns,
			durationMs,
			eventsJson: JSON.stringify(events),
			resultJson: resultOutput ? JSON.stringify(resultOutput) : undefined,
			completedAt: new Date().toISOString(),
		});

		eventBus.emit("memory:run_complete", {
			timestamp: new Date().toISOString(),
			runId,
			runType,
			runStatus: "completed",
			projectId,
		});
	} catch (err) {
		const durationMs = Date.now() - startTime;
		const errorMsg = err instanceof Error ? err.message : String(err);

		updateMemoryRun(db, runId, {
			status: "error",
			durationMs,
			eventsJson: JSON.stringify(events),
			error: errorMsg,
			completedAt: new Date().toISOString(),
		});

		eventBus.emit("memory:run_complete", {
			timestamp: new Date().toISOString(),
			runId,
			runType,
			runStatus: "error",
			projectId,
		});
	}
}

function processAnalysisResult(
	db: Database,
	runId: string,
	projectId: string,
	sessionId: string,
	result: unknown,
): void {
	const data = result as {
		reinforced_observations?: Array<{ id: number; reason: string }>;
		new_observations?: Array<{
			category: string;
			key: string;
			content: string;
			evidence?: string;
		}>;
	};

	const touchedIds: number[] = [];

	// Reinforce existing observations
	if (data.reinforced_observations) {
		for (const obs of data.reinforced_observations) {
			updateObservationReinforcement(db, obs.id, runId, sessionId);
			insertObservationHistory(db, {
				observationId: obs.id,
				runId,
				sessionId,
				action: "reinforced",
				metadata: JSON.stringify({ reason: obs.reason }),
			});
			insertRunObservation(db, runId, obs.id, "reinforced");
			touchedIds.push(obs.id);
		}
	}

	// Create new observations
	if (data.new_observations) {
		for (const obs of data.new_observations) {
			const obsId = insertObservation(db, {
				projectId,
				category: obs.category,
				content: obs.content,
				key: obs.key,
				evidence: obs.evidence ?? null,
				runId,
				sessionId,
			});
			insertRunObservation(db, runId, obsId, "created");
			insertObservationHistory(db, {
				observationId: obsId,
				runId,
				sessionId,
				action: "created",
				newContent: obs.content,
				newEvidence: obs.evidence ?? null,
				newStatus: "active",
			});
			touchedIds.push(obsId);
		}
	}

	// Increment staleness for unreferenced active observations
	incrementStaleness(db, projectId, touchedIds);
}

function processMaintenanceResult(
	db: Database,
	runId: string,
	projectId: string,
	result: unknown,
): void {
	const data = result as {
		consolidations?: Array<{
			merge_ids: number[];
			surviving_id: number;
			new_content: string;
		}>;
		promotions?: Array<{
			observation_id: number;
			memory_content: string;
			confidence: number;
		}>;
		stale_removals?: Array<{ observation_id: number }>;
	};

	// Process consolidations
	if (data.consolidations) {
		for (const c of data.consolidations) {
			// Capture current content before update
			const currentObs = db
				.prepare("SELECT content FROM observations WHERE id = ?")
				.get(c.surviving_id) as { content: string } | null;

			// Update surviving observation content
			const now = new Date().toISOString();
			const dbInst = db;
			dbInst
				.prepare(
					"UPDATE observations SET content = ?, updated_at = ? WHERE id = ?",
				)
				.run(c.new_content, now, c.surviving_id);

			insertObservationHistory(db, {
				observationId: c.surviving_id,
				runId,
				action: "consolidated",
				oldContent: currentObs?.content ?? null,
				newContent: c.new_content,
				metadata: JSON.stringify({ merged_ids: c.merge_ids }),
			});

			// Mark merged observations as consolidated
			for (const id of c.merge_ids) {
				if (id !== c.surviving_id) {
					updateObservationStatus(db, id, "consolidated");
					insertObservationHistory(db, {
						observationId: id,
						runId,
						action: "status_changed",
						oldStatus: "active",
						newStatus: "consolidated",
						metadata: JSON.stringify({ surviving_id: c.surviving_id }),
					});
					insertRunObservation(db, runId, id, "consolidated");
				}
			}
			insertRunObservation(db, runId, c.surviving_id, "consolidation_target");
		}
	}

	// Process promotions
	if (data.promotions) {
		for (const p of data.promotions) {
			const memoryId = insertMemory(db, {
				projectId,
				category: "promoted",
				content: p.memory_content,
				sourceObservationIds: [p.observation_id],
				confidence: p.confidence,
			});
			updateObservationStatus(db, p.observation_id, "promoted", memoryId);
			insertRunObservation(db, runId, p.observation_id, "promoted");
		}
	}

	// Process stale removals
	if (data.stale_removals) {
		for (const s of data.stale_removals) {
			updateObservationStatus(db, s.observation_id, "stale");
			insertRunObservation(db, runId, s.observation_id, "stale_removed");
		}
	}
}

// Need Database type for processAnalysisResult/processMaintenanceResult
import type { Database } from "bun:sqlite";

export function startAnalysis(
	sessionId: string,
	projectId: string,
	budgetUsd = 3.0,
): string {
	const db = getDb();
	const runId = crypto.randomUUID();
	const now = new Date().toISOString();

	const existingObs = queryObservationsForProject(db, projectId);
	const prompt = buildAnalysisPrompt(sessionId, projectId, existingObs);

	insertMemoryRun(db, {
		runId,
		sessionId,
		projectId,
		runType: "analysis",
		prompt,
		budgetUsd,
		startedAt: now,
	});

	// Fire and forget — processing happens in background
	runClaude(
		runId,
		"analysis",
		projectId,
		sessionId,
		prompt,
		ANALYSIS_SCHEMA,
		budgetUsd,
	);

	return runId;
}

export function startMaintenance(projectId: string, budgetUsd = 1.0): string {
	const db = getDb();
	const runId = crypto.randomUUID();
	const now = new Date().toISOString();

	const existingObs = queryObservationsForProject(db, projectId);
	const prompt = buildMaintenancePrompt(projectId, existingObs);

	insertMemoryRun(db, {
		runId,
		projectId,
		runType: "maintenance",
		prompt,
		budgetUsd,
		startedAt: now,
	});

	// Fire and forget — processing happens in background
	runClaude(
		runId,
		"maintenance",
		projectId,
		null,
		prompt,
		MAINTENANCE_SCHEMA,
		budgetUsd,
	);

	return runId;
}

export function getRunStatus(runId: string) {
	const db = getDb();
	return queryMemoryRunDetail(db, runId);
}
