// --- Content Block types ---

export interface TextBlock {
	type: "text";
	text: string;
}

export interface ToolUseBlock {
	type: "tool_use";
	id: string;
	name: string;
	input: unknown;
}

export interface ToolResultBlock {
	type: "tool_result";
	tool_use_id: string;
	content: string | unknown[];
}

export interface ThinkingBlock {
	type: "thinking";
	thinking: string;
	signature?: string;
}

export type ContentBlock =
	| TextBlock
	| ToolUseBlock
	| ToolResultBlock
	| ThinkingBlock;

// --- Raw JSONL message shape (as stored by Claude Code) ---

export interface MessageBase {
	parentUuid?: string | null;
	sessionId: string;
	uuid: string;
	timestamp: string;
	cwd?: string;
	userType?: string;
	version?: string | number;
	isSidechain?: boolean;
	type: string;
}

export interface UserMessage extends MessageBase {
	type: "user";
	message: {
		role: "user";
		content: string | ContentBlock[];
	};
}

export interface AssistantMessage extends MessageBase {
	type: "assistant";
	message: {
		role: "assistant";
		model?: string;
		content: ContentBlock[];
		stop_reason?: string;
		usage?: UsageData;
		[key: string]: unknown;
	};
}

export interface SystemMessage extends MessageBase {
	type: "system";
	subtype?: string;
	isMeta?: boolean;
	[key: string]: unknown;
}

export interface SummaryMessage extends MessageBase {
	type: "summary";
	summary: string;
	leafUuid: string;
}

export type SessionMessage =
	| UserMessage
	| AssistantMessage
	| SystemMessage
	| SummaryMessage;

// --- Dashboard-specific types ---

export interface UsageData {
	input_tokens: number;
	output_tokens: number;
	cache_creation_input_tokens?: number;
	cache_read_input_tokens?: number;
	cache_creation?: {
		ephemeral_5m_input_tokens?: number;
		ephemeral_1h_input_tokens?: number;
	};
	server_tool_use?: {
		web_search_requests?: number;
		web_fetch_requests?: number;
	};
	service_tier?: string;
	speed?: string;
}

export interface SessionMeta {
	sessionId: string;
	slug?: string;
	teamName?: string;
	cwd?: string;
	gitBranch?: string;
	models: string[];
	totalTokens: {
		input: number;
		output: number;
		cacheCreation: number;
		cacheRead: number;
	};
	filesRead: string[];
	filesWritten: string[];
	filesEdited: string[];
	messageCount: number;
	timeRange: { start: string; end: string } | null;
}

export interface SessionAnalytics {
	duration: number;
	messagesByType: Record<string, number>;
	tokenBreakdown: {
		input: number;
		output: number;
		cacheCreation: number;
		cacheRead: number;
	};
	toolCallsByName: Record<string, number>;
	stopReasons: Record<string, number>;
	cacheEfficiency: number;
}

export interface CostEstimate {
	totalCost: number;
	breakdown: {
		model: string;
		inputCost: number;
		outputCost: number;
		cacheCreationCost: number;
		cacheReadCost: number;
	}[];
	warnings: string[];
}

export interface HistoryEntry {
	display: string;
	sessionId: string;
	project: string;
	timestamp: number;
	pastedContents?: unknown;
}

export interface SubagentFileInfo {
	filePath: string;
	parentSessionId: string;
	agentFileId: string;
}

export interface ProjectInfo {
	path: string;
	encodedName: string;
	sessionFiles: string[];
	subagentFiles: SubagentFileInfo[];
}

export interface SessionSummary {
	sessionId: string;
	project?: string;
	lastPrompt?: string;
	promptCount: number;
	timestamps: { first: string; last: string };
	meta?: SessionMeta;
	hasAgents?: boolean;
	agentCount?: number;
}

export interface PlanMeta {
	slug: string;
	title: string;
	content: string;
}

export interface ContextFile {
	scope: "user" | "project" | "auto-memory" | "user-rules" | "project-rules";
	path: string;
	filename: string;
	content: string;
}

export interface SessionContext {
	memories: ContextFile[];
	rules: ContextFile[];
}

// --- Text extraction ---

function extractContentBlockText(block: ContentBlock): string {
	switch (block.type) {
		case "text":
			return block.text;
		case "tool_use":
			return typeof block.input === "string"
				? block.input
				: JSON.stringify(block.input);
		case "tool_result":
			return typeof block.content === "string"
				? block.content
				: JSON.stringify(block.content);
		case "thinking":
			return block.thinking;
		default:
			return "";
	}
}

const SEARCHABLE_TYPES = new Set(["user", "assistant", "system", "summary"]);

export function isSearchableType(type: string): boolean {
	return SEARCHABLE_TYPES.has(type);
}

export function extractSearchableText(msg: SessionMessage): string {
	switch (msg.type) {
		case "summary":
			return msg.summary ?? "";
		case "system":
			return msg.subtype ?? "";
		case "user": {
			const content = msg.message?.content;
			if (typeof content === "string") return content;
			if (Array.isArray(content))
				return content.map(extractContentBlockText).filter(Boolean).join("\n");
			return "";
		}
		case "assistant": {
			const blocks = msg.message?.content;
			if (!Array.isArray(blocks)) return "";
			return blocks.map(extractContentBlockText).filter(Boolean).join("\n");
		}
		default:
			return "";
	}
}
