import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import {
	getFileSize,
	readLines,
	readSessionMessages,
} from "../../src/parser/session-reader.js";

let tempDir: string;

beforeEach(() => {
	tempDir = mkdtempSync(join(tmpdir(), "parser-test-"));
});

afterEach(() => {
	rmSync(tempDir, { recursive: true, force: true });
});

function writeTempFile(name: string, content: string): string {
	const filePath = join(tempDir, name);
	writeFileSync(filePath, content);
	return filePath;
}

describe("readLines", () => {
	test("reads valid multi-line JSONL", async () => {
		const fp = writeTempFile("test.jsonl", '{"a":1}\n{"b":2}\n{"c":3}\n');
		const lines: string[] = [];
		for await (const line of readLines(fp)) {
			lines.push(line);
		}
		expect(lines).toEqual(['{"a":1}', '{"b":2}', '{"c":3}']);
	});

	test("skips empty lines", async () => {
		const fp = writeTempFile("test.jsonl", '{"a":1}\n\n\n{"b":2}\n');
		const lines: string[] = [];
		for await (const line of readLines(fp)) {
			lines.push(line);
		}
		expect(lines).toEqual(['{"a":1}', '{"b":2}']);
	});

	test("handles CRLF line endings", async () => {
		const fp = writeTempFile("test.jsonl", '{"a":1}\r\n{"b":2}\r\n');
		const lines: string[] = [];
		for await (const line of readLines(fp)) {
			lines.push(line);
		}
		expect(lines).toEqual(['{"a":1}', '{"b":2}']);
	});

	test("handles file without trailing newline", async () => {
		const fp = writeTempFile("test.jsonl", '{"a":1}\n{"b":2}');
		const lines: string[] = [];
		for await (const line of readLines(fp)) {
			lines.push(line);
		}
		expect(lines).toEqual(['{"a":1}', '{"b":2}']);
	});

	test("reads from byte offset", async () => {
		const content = '{"a":1}\n{"b":2}\n{"c":3}\n';
		const fp = writeTempFile("test.jsonl", content);
		// Offset past first line (8 bytes for '{"a":1}\n')
		const offset = Buffer.byteLength('{"a":1}\n');
		const lines: string[] = [];
		for await (const line of readLines(fp, offset)) {
			lines.push(line);
		}
		expect(lines).toEqual(['{"b":2}', '{"c":3}']);
	});
});

describe("readSessionMessages", () => {
	test("parses valid session messages", async () => {
		const msgs = [
			JSON.stringify({
				type: "user",
				sessionId: "s1",
				uuid: "u1",
				timestamp: "2025-01-01T00:00:00Z",
				message: { role: "user", content: "hello" },
			}),
			JSON.stringify({
				type: "assistant",
				sessionId: "s1",
				uuid: "u2",
				timestamp: "2025-01-01T00:01:00Z",
				message: {
					role: "assistant",
					content: [{ type: "text", text: "hi" }],
				},
			}),
		].join("\n");

		const fp = writeTempFile("test.jsonl", msgs + "\n");
		const result: unknown[] = [];
		for await (const msg of readSessionMessages(fp)) {
			result.push(msg);
		}
		expect(result).toHaveLength(2);
		expect(result[0]).toMatchObject({ type: "user", sessionId: "s1" });
		expect(result[1]).toMatchObject({ type: "assistant", sessionId: "s1" });
	});

	test("skips non-searchable types", async () => {
		const msgs = [
			JSON.stringify({
				type: "user",
				sessionId: "s1",
				uuid: "u1",
				timestamp: "2025-01-01T00:00:00Z",
				message: { role: "user", content: "hello" },
			}),
			JSON.stringify({
				type: "progress",
				sessionId: "s1",
				uuid: "u2",
				timestamp: "2025-01-01T00:01:00Z",
			}),
			JSON.stringify({
				type: "queue-operation",
				sessionId: "s1",
				uuid: "u3",
				timestamp: "2025-01-01T00:01:00Z",
			}),
		].join("\n");

		const fp = writeTempFile("test.jsonl", msgs + "\n");
		const result: unknown[] = [];
		for await (const msg of readSessionMessages(fp)) {
			result.push(msg);
		}
		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({ type: "user" });
	});

	test("skips malformed JSON lines", async () => {
		const content = [
			'{"type":"user","sessionId":"s1","uuid":"u1","timestamp":"2025-01-01T00:00:00Z","message":{"role":"user","content":"hello"}}',
			"not valid json",
			'{"type":"assistant","sessionId":"s1","uuid":"u2","timestamp":"2025-01-01T00:01:00Z","message":{"role":"assistant","content":[{"type":"text","text":"hi"}]}}',
		].join("\n");

		const fp = writeTempFile("test.jsonl", content + "\n");
		const result: unknown[] = [];
		for await (const msg of readSessionMessages(fp)) {
			result.push(msg);
		}
		expect(result).toHaveLength(2);
	});

	test("skips messages missing required fields", async () => {
		const msgs = [
			JSON.stringify({ type: "user", sessionId: "s1" }), // missing uuid and timestamp
			JSON.stringify({
				type: "user",
				sessionId: "s1",
				uuid: "u1",
				timestamp: "2025-01-01T00:00:00Z",
				message: { role: "user", content: "valid" },
			}),
		].join("\n");

		const fp = writeTempFile("test.jsonl", msgs + "\n");
		const result: unknown[] = [];
		for await (const msg of readSessionMessages(fp)) {
			result.push(msg);
		}
		expect(result).toHaveLength(1);
	});

	test("offset-based reading skips earlier messages", async () => {
		const line1 = JSON.stringify({
			type: "user",
			sessionId: "s1",
			uuid: "u1",
			timestamp: "2025-01-01T00:00:00Z",
			message: { role: "user", content: "first" },
		});
		const line2 = JSON.stringify({
			type: "user",
			sessionId: "s1",
			uuid: "u2",
			timestamp: "2025-01-01T00:01:00Z",
			message: { role: "user", content: "second" },
		});
		const content = line1 + "\n" + line2 + "\n";
		const fp = writeTempFile("test.jsonl", content);

		const offset = Buffer.byteLength(line1 + "\n");
		const result: unknown[] = [];
		for await (const msg of readSessionMessages(fp, offset)) {
			result.push(msg);
		}
		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({ uuid: "u2" });
	});
});

describe("getFileSize", () => {
	test("returns correct file size", async () => {
		const content = '{"a":1}\n{"b":2}\n';
		const fp = writeTempFile("test.jsonl", content);
		const size = await getFileSize(fp);
		expect(size).toBe(Buffer.byteLength(content));
	});
});
