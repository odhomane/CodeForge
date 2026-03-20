import { readSessionMessages } from "./session-reader.js";
import type { CostEstimate, SessionMeta } from "./types.js";

export interface ModelCostBreakdown {
	inputCost: number;
	outputCost: number;
	cacheCreationCost: number;
	cacheReadCost: number;
	totalCost: number;
	tokens: {
		input: number;
		output: number;
		cacheCreation: number;
		cacheRead: number;
	};
}

interface ModelPricing {
	input: number;
	output: number;
	cacheCreation: number;
	cacheRead: number;
}

// Pricing per million tokens (USD)
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
	"claude-sonnet-4-5-20250929": {
		input: 3,
		output: 15,
		cacheCreation: 3.75,
		cacheRead: 0.3,
	},
};

function costForTokens(tokens: number, ratePerMillion: number): number {
	return (tokens / 1_000_000) * ratePerMillion;
}

export function calculateCost(meta: SessionMeta): CostEstimate {
	const warnings: string[] = [];
	const breakdown: CostEstimate["breakdown"] = [];

	if (meta.models.length === 0) {
		// No model info — try to attribute all tokens to a default
		warnings.push("No model information found; cannot estimate cost.");
		return { totalCost: 0, breakdown, warnings };
	}

	// If single model, attribute all tokens to it
	if (meta.models.length === 1) {
		const model = meta.models[0];
		const pricing = MODEL_PRICING[model];

		if (!pricing) {
			warnings.push(`Unknown model "${model}"; cost may be inaccurate.`);
			return { totalCost: 0, breakdown, warnings };
		}

		const inputCost = costForTokens(meta.totalTokens.input, pricing.input);
		const outputCost = costForTokens(meta.totalTokens.output, pricing.output);
		const cacheCreationCost = costForTokens(
			meta.totalTokens.cacheCreation,
			pricing.cacheCreation,
		);
		const cacheReadCost = costForTokens(
			meta.totalTokens.cacheRead,
			pricing.cacheRead,
		);

		const entry = {
			model,
			inputCost,
			outputCost,
			cacheCreationCost,
			cacheReadCost,
		};
		breakdown.push(entry);

		return {
			totalCost: inputCost + outputCost + cacheCreationCost + cacheReadCost,
			breakdown,
			warnings,
		};
	}

	// Multiple models — split tokens evenly (best approximation without
	// per-message model attribution, which requires full re-parse)
	const knownModels: string[] = [];
	for (const model of meta.models) {
		if (MODEL_PRICING[model]) {
			knownModels.push(model);
		} else {
			warnings.push(
				`Unknown model "${model}"; its share of tokens excluded from cost.`,
			);
		}
	}

	if (knownModels.length === 0) {
		return { totalCost: 0, breakdown, warnings };
	}

	const share = 1 / knownModels.length;
	let totalCost = 0;

	for (const model of knownModels) {
		const pricing = MODEL_PRICING[model];
		const inputCost = costForTokens(
			meta.totalTokens.input * share,
			pricing.input,
		);
		const outputCost = costForTokens(
			meta.totalTokens.output * share,
			pricing.output,
		);
		const cacheCreationCost = costForTokens(
			meta.totalTokens.cacheCreation * share,
			pricing.cacheCreation,
		);
		const cacheReadCost = costForTokens(
			meta.totalTokens.cacheRead * share,
			pricing.cacheRead,
		);

		const entry = {
			model,
			inputCost,
			outputCost,
			cacheCreationCost,
			cacheReadCost,
		};
		breakdown.push(entry);
		totalCost += inputCost + outputCost + cacheCreationCost + cacheReadCost;
	}

	return { totalCost, breakdown, warnings };
}

export async function calculateCostPerModel(
	filePath: string,
): Promise<Record<string, ModelCostBreakdown>> {
	const perModel: Record<
		string,
		{ input: number; output: number; cacheCreation: number; cacheRead: number }
	> = {};

	for await (const msg of readSessionMessages(filePath)) {
		if (msg.type !== "assistant") continue;
		const model = msg.message.model;
		const usage = msg.message.usage;
		if (!model || !usage) continue;

		if (!perModel[model]) {
			perModel[model] = { input: 0, output: 0, cacheCreation: 0, cacheRead: 0 };
		}
		const acc = perModel[model];
		acc.input += usage.input_tokens ?? 0;
		acc.output += usage.output_tokens ?? 0;
		acc.cacheCreation += usage.cache_creation_input_tokens ?? 0;
		acc.cacheRead += usage.cache_read_input_tokens ?? 0;
	}

	const result: Record<string, ModelCostBreakdown> = {};
	for (const [model, tokens] of Object.entries(perModel)) {
		const pricing = MODEL_PRICING[model];
		if (!pricing) {
			result[model] = {
				inputCost: 0,
				outputCost: 0,
				cacheCreationCost: 0,
				cacheReadCost: 0,
				totalCost: 0,
				tokens,
			};
			continue;
		}
		const inputCost = costForTokens(tokens.input, pricing.input);
		const outputCost = costForTokens(tokens.output, pricing.output);
		const cacheCreationCost = costForTokens(
			tokens.cacheCreation,
			pricing.cacheCreation,
		);
		const cacheReadCost = costForTokens(tokens.cacheRead, pricing.cacheRead);
		result[model] = {
			inputCost,
			outputCost,
			cacheCreationCost,
			cacheReadCost,
			totalCost: inputCost + outputCost + cacheCreationCost + cacheReadCost,
			tokens,
		};
	}
	return result;
}
