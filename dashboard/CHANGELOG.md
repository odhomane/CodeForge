# Dashboard Changelog

## v0.1.0

Initial release of `codeforge-dashboard` — session analytics for Claude Code.

- Svelte 5 SPA with dark mode, TailwindCSS 4, LayerChart
- Bun backend with SQLite (bun:sqlite), SSE live updates, file watcher
- Session browsing with conversation replay and full-text search
- Token usage breakdown, cost estimates, activity heatmaps
- Tool call timeline visualization
- Per-project aggregated analytics
- CLI bin wrapper (`codeforge-dashboard`) with `--port`/`--host` flags
- Container integration: auto-launches on devcontainer start (port 7847)
