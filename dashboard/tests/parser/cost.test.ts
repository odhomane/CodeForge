import { describe, expect, test } from "bun:test";
import { calculateCost } from "../../src/parser/cost.js";
import type { SessionMeta } from "../../src/parser/types.js";

function makeMeta(overrides: Partial<SessionMeta> = {}): SessionMeta {
	return {
		sessionId: "s1",
		models: ["claude-sonnet-4-20250514"],
		totalTokens: { input: 0, output: 0, cacheCreation: 0, cacheRead: 0 },
		filesRead: [],
		filesWritten: [],
		filesEdited: [],
		messageCount: 0,
		timeRange: null,
		...overrides,
	};
}

describe("calculateCost", () => {
	test("calculates cost for known Sonnet model", () => {
		const meta = makeMeta({
			models: ["claude-sonnet-4-20250514"],
			totalTokens: {
				input: 1_000_000,
				output: 100_000,
				cacheCreation: 50_000,
				cacheRead: 500_000,
			},
		});
		const result = calculateCost(meta);

		// input:  1M * $3/MTok   = $3.00
		// output: 0.1M * $15/MTok = $1.50
		// cacheCreation: 0.05M * $3.75/MTok = $0.1875
		// cacheRead: 0.5M * $0.30/MTok = $0.15
		// Total = $4.8375

		expect(result.warnings).toHaveLength(0);
		expect(result.breakdown).toHaveLength(1);
		expect(result.breakdown[0].model).toBe("claude-sonnet-4-20250514");
		expect(result.totalCost).toBeCloseTo(4.8375, 4);
		expect(result.breakdown[0].inputCost).toBeCloseTo(3.0, 4);
		expect(result.breakdown[0].outputCost).toBeCloseTo(1.5, 4);
		expect(result.breakdown[0].cacheCreationCost).toBeCloseTo(0.1875, 4);
		expect(result.breakdown[0].cacheReadCost).toBeCloseTo(0.15, 4);
	});

	test("returns warning for unknown model", () => {
		const meta = makeMeta({
			models: ["claude-unknown-model"],
			totalTokens: {
				input: 1_000_000,
				output: 100_000,
				cacheCreation: 0,
				cacheRead: 0,
			},
		});
		const result = calculateCost(meta);

		expect(result.warnings.length).toBeGreaterThan(0);
		expect(result.warnings[0]).toContain("Unknown model");
		expect(result.totalCost).toBe(0);
	});

	test("handles multi-model session", () => {
		const meta = makeMeta({
			models: ["claude-sonnet-4-20250514", "claude-opus-4-6"],
			totalTokens: {
				input: 2_000_000,
				output: 200_000,
				cacheCreation: 0,
				cacheRead: 0,
			},
		});
		const result = calculateCost(meta);

		// Each model gets 50% of tokens
		// Sonnet:  input 1M * $3   = $3,  output 0.1M * $15  = $1.5  → $4.5
		// Opus:    input 1M * $15  = $15, output 0.1M * $75  = $7.5  → $22.5
		// Total = $27.0

		expect(result.warnings).toHaveLength(0);
		expect(result.breakdown).toHaveLength(2);
		expect(result.totalCost).toBeCloseTo(27.0, 4);
	});

	test("returns zero cost for no models", () => {
		const meta = makeMeta({ models: [] });
		const result = calculateCost(meta);
		expect(result.totalCost).toBe(0);
		expect(result.warnings.length).toBeGreaterThan(0);
	});

	test("handles mix of known and unknown models", () => {
		const meta = makeMeta({
			models: ["claude-sonnet-4-20250514", "unknown-model-xyz"],
			totalTokens: {
				input: 1_000_000,
				output: 100_000,
				cacheCreation: 0,
				cacheRead: 0,
			},
		});
		const result = calculateCost(meta);

		// Only sonnet is known, gets 100% of tokens
		expect(result.warnings.length).toBeGreaterThan(0);
		expect(result.breakdown).toHaveLength(1);
		expect(result.breakdown[0].model).toBe("claude-sonnet-4-20250514");
	});
});
