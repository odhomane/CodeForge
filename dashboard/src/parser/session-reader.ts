import type { SessionMessage } from "./types.js";
import { isSearchableType } from "./types.js";

export async function* readLines(
	filePath: string,
	startOffset?: number,
): AsyncGenerator<string> {
	const file = Bun.file(filePath);
	const source = startOffset ? file.slice(startOffset) : file;
	const stream = source.stream();
	const decoder = new TextDecoder();
	let buffer = "";

	for await (const chunk of stream) {
		buffer += decoder.decode(chunk, { stream: true });
		const lines = buffer.split("\n");
		buffer = lines.pop() || "";
		for (const line of lines) {
			if (line.trim()) yield line.replace(/\r$/, "");
		}
	}

	const remaining = buffer + decoder.decode();
	if (remaining.trim()) {
		yield remaining.replace(/\r$/, "");
	}
}

export async function* readSessionMessages(
	filePath: string,
	startOffset?: number,
): AsyncGenerator<SessionMessage> {
	for await (const line of readLines(filePath, startOffset)) {
		let raw: Record<string, unknown>;
		try {
			raw = JSON.parse(line) as Record<string, unknown>;
		} catch {
			continue;
		}

		if (!raw.type || !raw.sessionId || !raw.uuid || !raw.timestamp) {
			continue;
		}

		if (!isSearchableType(raw.type as string)) {
			continue;
		}

		yield raw as unknown as SessionMessage;
	}
}

export async function getFileSize(filePath: string): Promise<number> {
	const file = Bun.file(filePath);
	return file.size;
}
