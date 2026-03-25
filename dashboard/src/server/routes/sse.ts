import type { EventBus, EventPayload, EventType } from "../event-bus.js";

const KEEPALIVE_INTERVAL_MS = 30_000;

export function handleSSE(req: Request, eventBus: EventBus): Response {
	let cleanup: (() => void) | null = null;

	const stream = new ReadableStream({
		start(controller) {
			const encoder = new TextEncoder();

			function send(event: string, data: unknown) {
				try {
					controller.enqueue(
						encoder.encode(
							`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
						),
					);
				} catch {
					// Client disconnected
					doCleanup();
				}
			}

			const events: EventType[] = [
				"session:updated",
				"session:created",
				"project:updated",
				"ingestion:progress",
				"ingestion:complete",
				"file:changed",
				"memory:run_event",
				"memory:run_complete",
			];
			const handlers: Array<[EventType, (data: EventPayload) => void]> = [];
			for (const event of events) {
				const eventHandler = (data: EventPayload) => send(event, data);
				eventBus.on(event, eventHandler);
				handlers.push([event, eventHandler]);
			}

			// Keep-alive ping
			const pingInterval = setInterval(() => {
				try {
					controller.enqueue(encoder.encode(":ping\n\n"));
				} catch {
					doCleanup();
				}
			}, KEEPALIVE_INTERVAL_MS);

			function doCleanup() {
				if (!cleanup) return;
				cleanup = null;
				clearInterval(pingInterval);
				for (const [event, eventHandler] of handlers) {
					eventBus.off(event, eventHandler);
				}
				try {
					controller.close();
				} catch {
					// Already closed
				}
			}

			cleanup = doCleanup;

			// Handle abort signal
			req.signal.addEventListener("abort", () => {
				doCleanup();
			});
		},
		cancel() {
			if (cleanup) cleanup();
		},
	});

	return new Response(stream, {
		headers: {
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache",
			Connection: "keep-alive",
		},
	});
}
