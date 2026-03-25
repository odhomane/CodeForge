import { describe, expect, test } from "bun:test";
import type { EventPayload } from "../../src/server/event-bus.js";
import { EventBus } from "../../src/server/event-bus.js";

describe("EventBus", () => {
	test("emits events to registered handlers", () => {
		const bus = new EventBus();
		const received: EventPayload[] = [];

		bus.on("session:updated", (data) => received.push(data));

		const payload: EventPayload = {
			sessionId: "s1",
			timestamp: "2025-01-01T00:00:00Z",
		};
		bus.emit("session:updated", payload);

		expect(received).toHaveLength(1);
		expect(received[0]).toEqual(payload);
	});

	test("does not emit to unregistered event types", () => {
		const bus = new EventBus();
		const received: EventPayload[] = [];

		bus.on("session:updated", (data) => received.push(data));

		bus.emit("session:created", {
			timestamp: "2025-01-01T00:00:00Z",
		});

		expect(received).toHaveLength(0);
	});

	test("supports multiple handlers for same event", () => {
		const bus = new EventBus();
		let count1 = 0;
		let count2 = 0;

		bus.on("session:updated", () => count1++);
		bus.on("session:updated", () => count2++);

		bus.emit("session:updated", {
			timestamp: "2025-01-01T00:00:00Z",
		});

		expect(count1).toBe(1);
		expect(count2).toBe(1);
	});

	test("off removes a specific handler", () => {
		const bus = new EventBus();
		let count = 0;
		const handler = () => count++;

		bus.on("session:updated", handler);
		bus.emit("session:updated", {
			timestamp: "2025-01-01T00:00:00Z",
		});
		expect(count).toBe(1);

		bus.off("session:updated", handler);
		bus.emit("session:updated", {
			timestamp: "2025-01-01T00:00:00Z",
		});
		expect(count).toBe(1); // Not incremented
	});

	test("off does not affect other handlers", () => {
		const bus = new EventBus();
		let count1 = 0;
		let count2 = 0;
		const handler1 = () => count1++;
		const handler2 = () => count2++;

		bus.on("session:updated", handler1);
		bus.on("session:updated", handler2);

		bus.off("session:updated", handler1);
		bus.emit("session:updated", {
			timestamp: "2025-01-01T00:00:00Z",
		});

		expect(count1).toBe(0);
		expect(count2).toBe(1);
	});

	test("emit with no handlers does not throw", () => {
		const bus = new EventBus();
		expect(() => {
			bus.emit("session:updated", {
				timestamp: "2025-01-01T00:00:00Z",
			});
		}).not.toThrow();
	});

	test("off with non-registered handler does not throw", () => {
		const bus = new EventBus();
		expect(() => {
			bus.off("session:updated", () => {});
		}).not.toThrow();
	});
});
