# ccburn - Visual Token Burn Rate Tracker

> **Note:** This feature is disabled by default in the CodeForge devcontainer. Session and weekly usage tracking is now handled by native `session-usage` and `weekly-usage` ccstatusline widgets. To re-enable ccburn, uncomment its entry in `devcontainer.json`.

Real-time burn-up charts and pace tracking for Claude Code usage limits.

## Quick Start

```bash
# Full TUI dashboard (auto-detects active limit)
ccburn

# 5-hour rolling session limit
ccburn session

# 7-day weekly limit
ccburn weekly

# Single-line output for status bars
ccburn --compact --once

# JSON output for scripting
ccburn --json --once
```

## Features

- **Burn-up charts** — Live-updating terminal graphics showing usage over time
- **Pace indicators** — 🧊 Cool (behind pace) | 🔥 On pace | 🚨 Too hot (ahead)
- **Burn rate** — %/hour via linear regression, with trend classification
- **Predictions** — Time-to-100% estimates and projection lines
- **Multiple limits** — Session (5h), Weekly (7d), Weekly Sonnet, Monthly
- **SQLite history** — 7-day retention at `~/.ccburn/history.db`
- **Compact mode** — Single-line output for embedding in statuslines

## Display Modes

| Mode | Flag | Description |
|------|------|-------------|
| Full TUI | (default) | Interactive dashboard with charts and gauges |
| Compact | `--compact` | Single line: `Session: 🧊 45% (2h14m) \| Weekly: 🔥 12%` |
| JSON | `--json` | Structured output with all metrics |
| Once | `--once` | Single snapshot, no live updates |

## Statusline Integration

This feature installs a wrapper at `/usr/local/bin/ccburn-statusline` for use with
ccstatusline's `custom-command` widget. The wrapper handles:

- Missing OAuth credentials (shows "awaiting auth")
- First-run npx caching (shows "unavailable" if download fails)
- API errors (graceful fallback messages)

## Requirements

- Node.js (via devcontainer node feature)
- Claude Code OAuth credentials at `~/.claude/.credentials.json`

## Documentation

- [GitHub Repository](https://github.com/JuanjoFuchs/ccburn)
- [ccburn Specification](https://github.com/JuanjoFuchs/ccburn/blob/main/docs/ccburn-spec.md)
