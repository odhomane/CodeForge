// Agent store for subagent tracking

export interface SubagentSession {
	session_id: string;
	parent_session_id: string;
	agent_name: string | null;
	agent_type: string | null;
	description: string | null;
	mode: string | null;
	input_tokens: number;
	output_tokens: number;
	cache_read_tokens: number;
	message_count: number;
	time_start: string | null;
	time_end: string | null;
	models: string;
	tool_use_id: string | null;
	time_spawned: string | null;
	depth: number;
}

export interface UnlinkedAgent {
	id: number;
	parent_session_id: string;
	tool_use_id: string | null;
	message_uuid: string | null;
	agent_name: string | null;
	agent_type: string | null;
	description: string | null;
	mode: string | null;
	team_name: string | null;
	time_spawned: string | null;
}

export interface AgentTypeSummary {
	agent_type: string;
	count: number;
	total_input: number;
	total_output: number;
	last_used: string | null;
}

export const agentStore = $state({
	byType: [] as AgentTypeSummary[],
	recent: [] as SubagentSession[],
	totalCount: 0,
	loading: false,
	error: null as string | null,
});

export async function fetchAgents(): Promise<void> {
	agentStore.loading = true;
	agentStore.error = null;
	try {
		const res = await fetch("/api/agents");
		if (!res.ok) throw new Error(`Failed to fetch agents: ${res.status}`);
		const data = await res.json();
		agentStore.byType = data.byType ?? [];
		agentStore.recent = data.recent ?? [];
		agentStore.totalCount = data.totalCount ?? 0;
	} catch (err) {
		agentStore.error = err instanceof Error ? err.message : "Unknown error";
	} finally {
		agentStore.loading = false;
	}
}
