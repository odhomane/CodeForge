export interface PlanSummary {
	slug: string;
	title: string;
	contentLength: number;
	estimatedTokens: number;
	sessions: { sessionId: string; project: string; lastActivity: string }[];
	lastUsed: string | null;
}

export const planStore = $state({
	plans: [] as PlanSummary[],
	loading: false,
	error: null as string | null,
});

export interface PlanVersion {
	id: number;
	content: string;
	capturedAt: string;
	sessionId: string | null;
}

export async function fetchPlanHistory(slug: string): Promise<PlanVersion[]> {
	const res = await fetch(`/api/plans/${encodeURIComponent(slug)}/history`);
	if (!res.ok) throw new Error(`Failed to fetch plan history: ${res.status}`);
	const data = await res.json();
	return (data.versions ?? []).map((v: Record<string, unknown>) => ({
		id: v.id as number,
		content: v.content as string,
		capturedAt: v.captured_at as string,
		sessionId: v.session_id as string | null,
	}));
}

export async function fetchPlans(): Promise<void> {
	planStore.loading = true;
	planStore.error = null;
	try {
		const res = await fetch("/api/plans");
		if (!res.ok) throw new Error(`Failed to fetch plans: ${res.status}`);
		const data = await res.json();
		planStore.plans = data.plans;
	} catch (e) {
		planStore.error = e instanceof Error ? e.message : String(e);
	} finally {
		planStore.loading = false;
	}
}
