import { describe, expect, test } from "bun:test";
import { computeAnalytics } from "../../src/parser/analytics.js";
import type {
	AssistantMessage,
	SessionMessage,
	UserMessage,
} from "../../src/parser/types.js";

function makeUserMsg(overrides: Partial<UserMessage> = {}): UserMessage {
	return {
		type: "user",
		sessionId: "s1",
		uuid: "u-" + Math.random().toString(36).slice(2),
		timestamp: "2025-01-01T00:00:00Z",
		message: { role: "user", content: "hello" },
		...overrides,
	};
}

function makeAssistantMsg(
	overrides: Partial<AssistantMessage> & {
		message?: Partial<AssistantMessage["message"]>;
	} = {},
): AssistantMessage {
	const { message: msgOverrides, ...rest } = overrides;
	return {
		type: "assistant",
		sessionId: "s1",
		uuid: "a-" + Math.random().toString(36).slice(2),
		timestamp: "2025-01-01T00:01:00Z",
		message: {
			role: "assistant",
			content: [{ type: "text", text: "hi" }],
			...msgOverrides,
		},
		...rest,
	};
}

describe("computeAnalytics", () => {
	test("counts messages by type", () => {
		const messages: SessionMessage[] = [
			makeUserMsg(),
			makeAssistantMsg(),
			makeUserMsg(),
			makeAssistantMsg(),
		];
		const result = computeAnalytics(messages);
		expect(result.messagesByType).toEqual({ user: 2, assistant: 2 });
	});

	test("computes duration from timestamps", () => {
		const messages: SessionMessage[] = [
			makeUserMsg({ timestamp: "2025-01-01T00:00:00Z" }),
			makeAssistantMsg({ timestamp: "2025-01-01T00:05:00Z" }),
		];
		const result = computeAnalytics(messages);
		expect(result.duration).toBe(5 * 60 * 1000); // 5 minutes in ms
	});

	test("returns zero duration for single message", () => {
		const result = computeAnalytics([makeUserMsg()]);
		expect(result.duration).toBe(0);
	});

	test("aggregates token usage", () => {
		const messages: SessionMessage[] = [
			makeAssistantMsg({
				message: {
					role: "assistant",
					content: [{ type: "text", text: "hi" }],
					usage: {
						input_tokens: 100,
						output_tokens: 50,
						cache_creation_input_tokens: 20,
						cache_read_input_tokens: 30,
					},
				},
			}),
			makeAssistantMsg({
				message: {
					role: "assistant",
					content: [{ type: "text", text: "hi" }],
					usage: {
						input_tokens: 200,
						output_tokens: 100,
						cache_creation_input_tokens: 0,
						cache_read_input_tokens: 70,
					},
				},
			}),
		];
		const result = computeAnalytics(messages);
		expect(result.tokenBreakdown).toEqual({
			input: 300,
			output: 150,
			cacheCreation: 20,
			cacheRead: 100,
		});
	});

	test("cache efficiency 70%", () => {
		const messages: SessionMessage[] = [
			makeAssistantMsg({
				message: {
					role: "assistant",
					content: [{ type: "text", text: "hi" }],
					usage: {
						input_tokens: 300,
						output_tokens: 100,
						cache_read_input_tokens: 700,
					},
				},
			}),
		];
		const result = computeAnalytics(messages);
		expect(result.cacheEfficiency).toBe(0.7);
	});

	test("cache efficiency 0% when no cache reads", () => {
		const messages: SessionMessage[] = [
			makeAssistantMsg({
				message: {
					role: "assistant",
					content: [{ type: "text", text: "hi" }],
					usage: { input_tokens: 100, output_tokens: 50 },
				},
			}),
		];
		const result = computeAnalytics(messages);
		expect(result.cacheEfficiency).toBe(0);
	});

	test("cache efficiency 0 when no usage data", () => {
		const result = computeAnalytics([makeUserMsg()]);
		expect(result.cacheEfficiency).toBe(0);
	});

	test("counts tool calls by name", () => {
		const messages: SessionMessage[] = [
			makeAssistantMsg({
				message: {
					role: "assistant",
					content: [
						{
							type: "tool_use",
							id: "t1",
							name: "Read",
							input: { file_path: "/foo" },
						},
						{
							type: "tool_use",
							id: "t2",
							name: "Read",
							input: { file_path: "/bar" },
						},
						{
							type: "tool_use",
							id: "t3",
							name: "Edit",
							input: { file_path: "/baz" },
						},
					],
				},
			}),
		];
		const result = computeAnalytics(messages);
		expect(result.toolCallsByName).toEqual({ Read: 2, Edit: 1 });
	});

	test("counts stop reasons", () => {
		const messages: SessionMessage[] = [
			makeAssistantMsg({
				message: {
					role: "assistant",
					content: [{ type: "text", text: "hi" }],
					stop_reason: "end_turn",
				},
			}),
			makeAssistantMsg({
				message: {
					role: "assistant",
					content: [{ type: "text", text: "hi" }],
					stop_reason: "end_turn",
				},
			}),
			makeAssistantMsg({
				message: {
					role: "assistant",
					content: [{ type: "text", text: "hi" }],
					stop_reason: "tool_use",
				},
			}),
		];
		const result = computeAnalytics(messages);
		expect(result.stopReasons).toEqual({ end_turn: 2, tool_use: 1 });
	});

	test("handles empty message array", () => {
		const result = computeAnalytics([]);
		expect(result.duration).toBe(0);
		expect(result.messagesByType).toEqual({});
		expect(result.cacheEfficiency).toBe(0);
	});
});
