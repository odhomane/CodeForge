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
	queryUnanalyzedSessions,
	updateMemoryRun,
	updateObservationReinforcement,
	updateObservationStatus,
} from "../parser/queries.js";
import { type EventPayload, getEventBus } from "./event-bus.js";
import { syncMemoriesToFile } from "./memory-sync.js";

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
					suggested_memory: { type: "string" as const },
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
					suggested_memory: { type: "string" as const },
				},
				required: [
					"category",
					"key",
					"content",
					"evidence",
					"suggested_memory",
				],
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

	return `You are a memory analyzer for a coding assistant. Your job is to extract behavioral PATTERNS from a Claude Code session — patterns about HOW THE USER WORKS, not what happened in the session.

## CRITICAL: Understanding the Data

You will query session data using tools. The data has different roles that you MUST understand:

### Message Roles

- **"human"** = What the user actually typed. This is the **PRIMARY signal**. User corrections, preferences, rejections, explicit instructions — this is the gold.
- **"human" with tag "submitted-plan"** = The user submitted this content, but it was **AI-generated** in a previous session. The user approved and submitted a plan/spec, but an AI wrote it. Do NOT attribute the plan's writing style, structure, or technical decisions to the user. The behavioral signal is that the user USES a plan-first workflow, not the plan's content.
- **"assistant"** = What Claude said or did. Use for **CONTEXT ONLY** — to understand what the user reacted to. Do NOT create observations about Claude's behavior.
- Tool names like "[Used tool: Read]" in assistant messages show workflow patterns but are Claude's actions, not the user's.

### What is NOT user behavior

- **Plans, specs, and proposals** in assistant messages or submitted-plan messages are AI-generated. "User creates detailed plans with root cause analysis" is WRONG if Claude wrote the plan.
- **System reminders, hooks, diagnostics** are infrastructure. They are already filtered out of the conversation data, but if any slip through, ignore them.
- **Tool results** (file contents, command output) are plumbing. They are already filtered out.
- **Claude's coding style, tool choices, and approach** are Claude's behavior, not the user's.

## ANTI-PATTERNS: Do NOT produce these observations

- ❌ "User creates detailed multi-section plans" — WRONG if Claude wrote the plan
- ❌ "User prefers to read files before editing" — WRONG, that's Claude's standard behavior
- ❌ "User uses Bash for debugging" — WRONG, Claude decides which tools to use
- ❌ "User follows a plan-first workflow with root cause analysis" — WRONG if this describes the plan's content, not the user's explicit instruction
- ❌ "User is thorough in their approach" — TOO VAGUE, no specific evidence
- ❌ "User worked on memory system improvements" — SUMMARY, not a behavioral pattern
- ❌ Anything derived from system-reminder, CLAUDE.md, or configuration content

## GOOD PATTERNS: What to actually look for

Focus EXCLUSIVELY on human messages. Look for:

1. **User corrections** — When the user says "No, do it this way" or rejects Claude's approach
   - Example: User says "Did I not say allow parallel analysis?" → User expects instructions to be followed precisely

2. **Explicit preferences** — Direct statements about how things should be done
   - Example: User says "The button should track per-session state" → User prefers granular state over global flags

3. **Rejections** — When the user rejects a suggestion or approach
   - Example: User says "Don't truncate" → User wants full data, not summaries

4. **Frustration patterns** — Repeated corrections signal strong preferences
   - Example: User has to ask the same thing 3 times → Something isn't being followed

5. **Verification habits** — What the user checks after work is done
   - Example: User asks "Did you rebuild?" → User values build verification

6. **Stated requirements** — Direct instructions about quality or approach
   - Example: User says "Diagnostics should always be resolved" → User expects zero-warning builds

## Categories (with signals to look for)

**workflow**: How the user approaches tasks
- Corrections to Claude's approach, explicit process preferences, whether they review before committing, how they handle failures, whether they require plans
- Signal: User SAYS "always do X first" or CORRECTS Claude's order of operations

**preference**: Coding style and communication
- Style corrections, rejected suggestions, stated preferences, naming/structure requirements
- Signal: User REJECTS a specific approach in favor of another, or STATES a preference directly

**project**: Project-specific conventions
- Project structure corrections, convention enforcement, architectural boundaries
- Signal: User CORRECTS assumptions about project structure or conventions

**pain_point**: Frustrations and blockers
- Repeated corrections, frustration language, things that keep going wrong
- Signal: User expresses frustration about the SAME issue multiple times

**expertise**: Knowledge areas
- Where user teaches Claude, corrections of technical assumptions, advanced domain knowledge
- Signal: User EXPLAINS how something works because Claude got it wrong

## Context
- Session ID: ${sessionId}
- Project ID: ${projectId}
- Script path for querying the dashboard DB: ${SCRIPT_PATH}

## Existing observations for this project (do NOT create duplicates):
${obsBlock}

## Exploration Strategy

Use the query tools to explore the session data. Do NOT stop after one query.

1. **First**: Run \`bun run ${SCRIPT_PATH} session-overview ${sessionId}\` to understand the session shape — how many human messages, what tools were used, duration, etc.

2. **Second**: Run \`bun run ${SCRIPT_PATH} conversation ${sessionId} --role human\` to read ALL human messages. These are the primary signal. Read every single one carefully. Note:
   - Direct corrections ("No, do X instead")
   - Explicit preferences ("always do Y")
   - Rejections ("don't do Z")
   - Frustration signals (repeated requests, strong language)
   - Verification requests ("did you do X?")

3. **Third**: Run \`bun run ${SCRIPT_PATH} conversation ${sessionId}\` to see the full conversation with assistant context. This helps you understand WHAT Claude proposed that the user then corrected or rejected. Focus on the messages around human corrections.

4. **Fourth**: Synthesize patterns. Ask yourself for each potential observation:
   - Is this based on what the USER said/did, or what CLAUDE said/did?
   - Would this pattern likely repeat in the user's next session?
   - Can I cite a specific human message as evidence?
   - Is this a behavioral pattern or just a description of what happened?

## Output Requirements

For reinforced_observations:
- Include observation id and reason citing specific human messages from this session

For new_observations:
- **category**: One of: workflow, preference, project, pain_point, expertise
- **key**: Format "category:short-descriptor" (e.g., "preference:per-item-state", "workflow:verify-builds")
- **content**: Specific behavioral pattern description. Must describe what the USER does, not what Claude does.
- **evidence**: MUST quote or cite specific human messages. "User said: '...'" format. Do NOT cite assistant messages, plans, or system content as evidence.
- **suggested_memory**: Imperative instruction for a future coding assistant. "When X, do Y" format.

## Quality Gates

- Every observation MUST cite evidence from human messages (not assistant, not plans, not system)
- Maximum 5 new observations per session — focus on the strongest signals
- One observation per distinct pattern — don't combine unrelated behaviors
- If the session has fewer than 3 human messages, or the human barely interacted beyond approving, return empty arrays. That is perfectly fine.
- If a session is mostly the user submitting a plan and Claude executing it with no corrections, there may be NO observations to extract. Return empty arrays.

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
   - Only merge observations that truly describe the same behavior
   - The surviving observation should have the most evidence/highest count
   - The new_content should combine the best specifics from both

2. **Promotions**: Observations seen 3+ times with low staleness (0-1) are strong promotion candidates. Only promote high-confidence patterns.

   **CRITICAL**: memory_content must be written as a **directive for a coding assistant**, not a description of user behavior. Use imperative voice.

   **GOOD memory_content examples:**
   - "When starting non-trivial work, always create a plan with root cause analysis and affected files before writing code."
   - "Never add abstraction layers for one-time operations. Three similar lines are better than a premature helper function."
   - "Always read the target file before proposing edits. Never assume file contents or directory structure."
   - "When debugging failures, use iterative Bash loops: run the failing command, read output, adjust code, repeat. Do not skip to writing tests."

   **BAD memory_content examples (do NOT produce these):**
   - "The user prefers planning before implementation" (descriptive, not imperative)
   - "User likes clean code" (vague, not actionable)
   - "The user is experienced with TypeScript" (not a rule)
   - "Remember to follow user preferences" (meta, not specific)

   **Promotion thresholds:**
   - 3+ occurrences with 0-1 staleness = strong candidate (confidence 0.8-0.9)
   - 5+ occurrences with 0-1 staleness = very strong candidate (confidence 0.9-1.0)
   - 2 occurrences = too early, leave as observation
   - High staleness (3+) even with high count = pattern may be fading, skip

3. **Stale removals**: Observations with high sessions_since_last_seen (5+) and low count (1-2) are likely one-off patterns. Mark them for removal.
   - Don't remove stale observations with high count (3+) — they might be seasonal patterns
   - Don't remove observations with count 1 if staleness is under 3 — they're just new

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
	let totalCostFromResult: number | undefined;

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
				"--verbose",
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

		// Collect all stdout after process exits — streaming via getReader()
		// is unreliable inside Bun.serve's event loop for long-running subprocesses
		const exitCode = await proc.exited;
		const stdout = await new Response(proc.stdout).text();

		for (const line of stdout.split("\n")) {
			const trimmed = line.trim();
			if (!trimmed) continue;

			try {
				const event = JSON.parse(trimmed) as StreamJsonEvent;
				events.push(event);

				// Track model and usage from assistant message events
				// stream-json nests these under event.message
				if (event.type === "assistant") {
					numTurns++;
					const msg = event.message as
						| {
								model?: string;
								usage?: {
									input_tokens?: number;
									output_tokens?: number;
									cache_read_input_tokens?: number;
									cache_creation_input_tokens?: number;
								};
						  }
						| undefined;
					if (msg?.model) model = msg.model;
					if (msg?.usage) {
						if (msg.usage.input_tokens) inputTokens += msg.usage.input_tokens;
						if (msg.usage.output_tokens)
							outputTokens += msg.usage.output_tokens;
					}
				}

				// Capture result — structured_output and cost from result event
				if (event.type === "result") {
					const resultEvent = event as {
						structured_output?: unknown;
						total_cost_usd?: number;
					};
					resultOutput = resultEvent.structured_output;
					if (resultEvent.total_cost_usd != null) {
						totalCostFromResult = resultEvent.total_cost_usd;
					}
				}
			} catch {
				// Skip non-JSON lines
			}
		}

		// Emit final SSE progress event
		eventBus.emit("memory:run_event", {
			timestamp: new Date().toISOString(),
			runId,
			runType,
			runStatus: "running",
			projectId,
		});
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
				sessionId: sessionId ?? undefined,
			});
			return;
		}

		// Process results
		if (resultOutput && runType === "analysis" && sessionId) {
			processAnalysisResult(db, runId, projectId, sessionId, resultOutput);
		} else if (resultOutput && runType === "maintenance") {
			processMaintenanceResult(db, runId, projectId, resultOutput);
		}

		// Use actual cost from CLI result event, fall back to estimate
		const costUsd =
			totalCostFromResult ??
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
			sessionId: sessionId ?? undefined,
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
			sessionId: sessionId ?? undefined,
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
		reinforced_observations?: Array<{
			id: number;
			reason: string;
			suggested_memory?: string;
		}>;
		new_observations?: Array<{
			category: string;
			key: string;
			content: string;
			evidence?: string;
			suggested_memory?: string;
		}>;
	};

	const touchedIds: number[] = [];

	// Reinforce existing observations
	if (data.reinforced_observations) {
		for (const obs of data.reinforced_observations) {
			updateObservationReinforcement(
				db,
				obs.id,
				runId,
				sessionId,
				obs.suggested_memory ?? undefined,
			);
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
				suggestedMemory: obs.suggested_memory ?? null,
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
			// Look up the source observation's real category
			const sourceObs = db
				.prepare("SELECT category FROM observations WHERE id = ?")
				.get(p.observation_id) as { category: string } | null;
			const memoryId = insertMemory(db, {
				projectId,
				category: sourceObs?.category ?? "promoted",
				content: p.memory_content,
				sourceObservationIds: [p.observation_id],
				confidence: p.confidence,
			});
			updateObservationStatus(db, p.observation_id, "promoted", memoryId);
			insertRunObservation(db, runId, p.observation_id, "promoted");
		}
	}

	// Sync promoted memories to MEMORY.md
	if (data.promotions && data.promotions.length > 0) {
		syncMemoriesToFile(projectId).catch(() => {});
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

export function startProjectAnalysis(
	projectId: string,
	budgetUsd = 3.0,
): { queued: number; totalSessions: number } {
	const db = getDb();
	const unanalyzed = queryUnanalyzedSessions(db, projectId);

	if (unanalyzed.length === 0) {
		return { queued: 0, totalSessions: 0 };
	}

	// Start first batch of 3
	const BATCH_SIZE = 3;
	const queue = [...unanalyzed];
	let running = 0;

	function startNext() {
		while (running < BATCH_SIZE && queue.length > 0) {
			const sessionId = queue.shift()!;
			running++;
			startAnalysis(sessionId, projectId, budgetUsd);
		}
	}

	// Listen for completions to start next batch
	const eventBus = getEventBus();
	const handler = (data: EventPayload) => {
		if (data.runType === "analysis" && data.projectId === projectId) {
			running--;
			if (queue.length > 0) {
				startNext();
			} else if (running === 0) {
				// All done, remove listener
				eventBus.off("memory:run_complete", handler);
			}
		}
	};
	eventBus.on("memory:run_complete", handler);

	startNext();

	return { queued: unanalyzed.length, totalSessions: unanalyzed.length };
}
