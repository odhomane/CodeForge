export interface GlobalAnalytics {
	projectCount: number;
	totalSessions: number;
	totalMessages: number;
	totalTokens: {
		input: number;
		output: number;
		cacheCreation: number;
		cacheRead: number;
	};
	models: string[];
	totalCost: number;
	cacheEfficiency: number;
	costByDay: Record<string, number>;
	dailyActivity: Record<string, number>;
	toolUsage: { name: string; count: number }[];
	modelDistribution: Record<string, number>;
	topFiles: { path: string; count: number }[];
	durationBuckets: Record<string, number>;
	recentActivity: {
		sessionId: string;
		project?: string;
		firstPrompt?: string;
		duration: number;
		tokens: number;
		timestamp: string;
	}[];
	sparklines: {
		sessions: number[];
		tokens: number[];
		cost: number[];
		cacheEfficiency: number[];
	};
	dailyTokenBreakdown: Record<
		string,
		{ input: number; output: number; cacheRead: number; cacheCreation: number }
	>;
	costByProject: Record<string, number>;
	hourlyActivity: Record<string, number>;
	dailyCacheEfficiency: Record<string, number>;
	dailyAvgDuration: Record<string, number>;
	weekOverWeek: {
		sessions: number;
		tokens: number;
		cost: number;
		cacheEfficiency: number;
	};
	costByModel: Record<string, number>;
	cacheEfficiencyByModel: Record<string, number>;
	costByDayByModel: Record<string, Record<string, number>>;
	sessionScatter: {
		sessionId: string;
		slug?: string;
		project: string;
		model: string;
		cost: number;
		durationMin: number;
		filesEdited: number;
		cacheHitRate: number;
	}[];
	cacheSavings: {
		uncachedCost: number;
		actualCost: number;
		savings: number;
		savingsPercent: number;
	};
	dailyCostPerEdit: Record<string, number>;
	dailyOutputInputRatio: Record<string, number>;
	modelFirstSeen: Record<string, string>;
	insights: string[];
	modelSessionCount: Record<string, number>;
}

export interface ProjectAnalytics {
	projectId: string;
	projectPath: string;
	sessionCount: number;
	analytics: {
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
	};
	totalCost: number;
	costOverTime: Record<string, number>;
	toolUsage: { name: string; count: number }[];
	hourlyActivity: Record<string, number>;
	topFiles: { path: string; count: number }[];
	dailyActivity: Record<string, number>;
}

export const analyticsStore = $state({
	globalAnalytics: null as GlobalAnalytics | null,
	projectAnalytics: {} as Record<string, ProjectAnalytics>,
	loading: false,
	error: null as string | null,
});

export async function fetchGlobalAnalytics(params?: {
	since?: string;
	until?: string;
}): Promise<void> {
	analyticsStore.loading = true;
	analyticsStore.error = null;
	try {
		const url = new URL("/api/analytics/global", window.location.origin);
		if (params?.since) url.searchParams.set("since", params.since);
		if (params?.until) url.searchParams.set("until", params.until);
		const res = await fetch(url.toString());
		if (!res.ok)
			throw new Error(`Failed to fetch global analytics: ${res.status}`);
		analyticsStore.globalAnalytics = await res.json();
	} catch (e) {
		analyticsStore.error = e instanceof Error ? e.message : String(e);
	} finally {
		analyticsStore.loading = false;
	}
}

export const ingestionStore = $state({
	isComplete: false,
	totalSessions: 0,
	totalMessages: 0,
});

export async function fetchIngestionStatus(): Promise<void> {
	try {
		const res = await fetch("/api/ingestion/status");
		if (!res.ok) return;
		const data = await res.json();
		ingestionStore.isComplete = data.isComplete;
		ingestionStore.totalSessions = data.totalSessions;
		ingestionStore.totalMessages = data.totalMessages;
	} catch {
		// Silent fail
	}
}

export async function fetchProjectAnalytics(id: string): Promise<void> {
	try {
		const res = await fetch(`/api/analytics/project/${encodeURIComponent(id)}`);
		if (!res.ok)
			throw new Error(`Failed to fetch project analytics: ${res.status}`);
		const data: ProjectAnalytics = await res.json();
		analyticsStore.projectAnalytics = {
			...analyticsStore.projectAnalytics,
			[id]: data,
		};
	} catch (e) {
		analyticsStore.error = e instanceof Error ? e.message : String(e);
	}
}
