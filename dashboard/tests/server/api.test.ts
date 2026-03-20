import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs";
import { homedir, tmpdir } from "os";
import { join } from "path";
import { handleApiRequest } from "../../src/server/routes/api.js";

// Helper to create a Request object for testing
function makeRequest(path: string, method = "GET"): Request {
	return new Request(`http://localhost:5173${path}`, { method });
}

async function jsonBody(res: Response): Promise<unknown> {
	return res.json();
}

describe("API routes", () => {
	test("returns 404 for unknown routes", async () => {
		const res = await handleApiRequest(makeRequest("/api/nonexistent"));
		expect(res.status).toBe(404);
		const body = (await jsonBody(res)) as { error: string };
		expect(body.error).toBe("Not found");
	});

	test("returns 405 for non-GET methods", async () => {
		const res = await handleApiRequest(makeRequest("/api/projects", "POST"));
		expect(res.status).toBe(405);
	});

	test("GET /api/projects returns JSON array", async () => {
		const res = await handleApiRequest(makeRequest("/api/projects"));
		expect(res.status).toBe(200);
		expect(res.headers.get("Content-Type")).toBe("application/json");
		const body = await jsonBody(res);
		expect(Array.isArray(body)).toBe(true);
	});

	test("GET /api/projects/:id returns 404 for missing project", async () => {
		const res = await handleApiRequest(
			makeRequest("/api/projects/nonexistent-project-id"),
		);
		expect(res.status).toBe(404);
	});

	test("GET /api/sessions returns paginated response", async () => {
		const res = await handleApiRequest(
			makeRequest("/api/sessions?limit=10&offset=0"),
		);
		expect(res.status).toBe(200);
		const body = (await jsonBody(res)) as {
			sessions: unknown[];
			limit: number;
			offset: number;
		};
		expect(body).toHaveProperty("sessions");
		expect(body).toHaveProperty("limit");
		expect(body).toHaveProperty("offset");
		expect(body.limit).toBe(10);
		expect(body.offset).toBe(0);
	});

	test("GET /api/sessions/:id returns 404 for missing session", async () => {
		const res = await handleApiRequest(
			makeRequest("/api/sessions/nonexistent-session-id"),
		);
		expect(res.status).toBe(404);
	});

	test("GET /api/sessions/:id/messages returns 404 for missing session", async () => {
		const res = await handleApiRequest(
			makeRequest("/api/sessions/nonexistent-session-id/messages"),
		);
		expect(res.status).toBe(404);
	});

	test("GET /api/analytics/global returns metrics object", async () => {
		const res = await handleApiRequest(makeRequest("/api/analytics/global"));
		expect(res.status).toBe(200);
		const body = (await jsonBody(res)) as {
			projectCount: number;
			totalSessions: number;
			costByModel: Record<string, number>;
			cacheSavings: {
				uncachedCost: number;
				actualCost: number;
				savings: number;
				savingsPercent: number;
			};
			insights: string[];
			modelSessionCount: Record<string, number>;
		};
		expect(body).toHaveProperty("projectCount");
		expect(body).toHaveProperty("totalSessions");
		expect(body).toHaveProperty("totalTokens");
		expect(body).toHaveProperty("cacheEfficiency");
		// New fields
		expect(body).toHaveProperty("costByModel");
		expect(body).toHaveProperty("cacheEfficiencyByModel");
		expect(body).toHaveProperty("costByDayByModel");
		expect(body).toHaveProperty("sessionScatter");
		expect(body).toHaveProperty("cacheSavings");
		expect(body).toHaveProperty("dailyCostPerEdit");
		expect(body).toHaveProperty("dailyOutputInputRatio");
		expect(body).toHaveProperty("modelFirstSeen");
		expect(body).toHaveProperty("insights");
		expect(body).toHaveProperty("modelSessionCount");
		expect(Array.isArray(body.insights)).toBe(true);
		expect(typeof body.cacheSavings.savings).toBe("number");
	}, 30_000);

	test("GET /api/analytics/project/:id returns 404 for missing project", async () => {
		const res = await handleApiRequest(
			makeRequest("/api/analytics/project/nonexistent"),
		);
		expect(res.status).toBe(404);
	});

	test("limit is capped at 200", async () => {
		const res = await handleApiRequest(makeRequest("/api/sessions?limit=500"));
		expect(res.status).toBe(200);
		const body = (await jsonBody(res)) as { limit: number };
		expect(body.limit).toBe(200);
	});
});
