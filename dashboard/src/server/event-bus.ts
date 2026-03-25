export interface EventPayload {
	sessionId?: string;
	projectId?: string;
	parentSessionId?: string;
	filePath?: string;
	fileType?: string;
	timestamp: string;
	processed?: number;
	total?: number;
	runId?: string;
	runType?: string;
	runStatus?: string;
}

export type EventType =
	| "session:updated"
	| "session:created"
	| "project:updated"
	| "ingestion:progress"
	| "ingestion:complete"
	| "file:changed"
	| "memory:run_event"
	| "memory:run_complete";

type Handler = (data: EventPayload) => void;

export class EventBus {
	private handlers = new Map<EventType, Set<Handler>>();

	on(event: EventType, handler: Handler): void {
		let set = this.handlers.get(event);
		if (!set) {
			set = new Set();
			this.handlers.set(event, set);
		}
		set.add(handler);
	}

	off(event: EventType, handler: Handler): void {
		const set = this.handlers.get(event);
		if (set) {
			set.delete(handler);
			if (set.size === 0) this.handlers.delete(event);
		}
	}

	emit(event: EventType, data: EventPayload): void {
		const set = this.handlers.get(event);
		if (!set) return;
		for (const handler of set) {
			handler(data);
		}
	}
}

let _eventBus: EventBus | null = null;

export function getEventBus(): EventBus {
	if (!_eventBus) _eventBus = new EventBus();
	return _eventBus;
}
