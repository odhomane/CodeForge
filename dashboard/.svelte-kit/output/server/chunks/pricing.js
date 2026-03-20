//#region src/web/lib/utils/pricing.ts
var MODEL_DISPLAY_NAMES = {
	"claude-sonnet-4-20250514": "Sonnet 4",
	"claude-opus-4-6": "Opus 4.6",
	"claude-sonnet-4-5-20250929": "Sonnet 4.5",
	"claude-haiku-3.5": "Haiku 3.5",
	"claude-3-5-sonnet-20241022": "Sonnet 3.5"
};
function formatModelName(model) {
	return MODEL_DISPLAY_NAMES[model] ?? model;
}
//#endregion
export { formatModelName as t };
