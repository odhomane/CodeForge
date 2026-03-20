interface ModelPricing {
	input: number;
	output: number;
	cacheCreation: number;
	cacheRead: number;
}

export const MODEL_PRICING: Record<string, ModelPricing> = {
	"claude-sonnet-4-20250514": {
		input: 3,
		output: 15,
		cacheCreation: 3.75,
		cacheRead: 0.3,
	},
	"claude-opus-4-6": {
		input: 15,
		output: 75,
		cacheCreation: 18.75,
		cacheRead: 1.5,
	},
	"claude-sonnet-4-5-20250929": {
		input: 3,
		output: 15,
		cacheCreation: 3.75,
		cacheRead: 0.3,
	},
	"claude-haiku-3.5": {
		input: 0.8,
		output: 4,
		cacheCreation: 1,
		cacheRead: 0.08,
	},
	"claude-3-5-sonnet-20241022": {
		input: 3,
		output: 15,
		cacheCreation: 3.75,
		cacheRead: 0.3,
	},
};

const MODEL_DISPLAY_NAMES: Record<string, string> = {
	"claude-sonnet-4-20250514": "Sonnet 4",
	"claude-opus-4-6": "Opus 4.6",
	"claude-sonnet-4-5-20250929": "Sonnet 4.5",
	"claude-haiku-3.5": "Haiku 3.5",
	"claude-3-5-sonnet-20241022": "Sonnet 3.5",
};

export function formatModelName(model: string): string {
	return MODEL_DISPLAY_NAMES[model] ?? model;
}
