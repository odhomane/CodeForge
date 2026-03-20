# CodeForge Dashboard (devcontainer feature)

Installs [codeforge-dashboard](https://github.com/AnExiledDev/CodeForge) — the first-party analytics dashboard for Claude Code sessions, built from the monorepo `dashboard/` package.

## What it provides

- `codeforge-dashboard` command to launch the web UI
- Auto-launches on container start via poststart hook (controllable with `autostart` option)
- Session browsing with full-text search and filtering
- Token usage breakdown, cost estimates, and activity heatmaps
- Tool call timeline visualization
- Per-project aggregated analytics
- Dashboard DB persisted at `~/.codeforge/data/dashboard.db` on the bind mount

## Options

| Option | Default | Description |
|--------|---------|-------------|
| `version` | `latest` | npm package version (`latest`, `1.0.0`, or `none` to skip) |
| `port` | `7847` | Default port for the dashboard server |
| `shells` | `both` | Shell configs to add alias to (`bash`, `zsh`, `both`) |
| `username` | `automatic` | Container user to install for |
| `autostart` | `true` | Auto-launch dashboard on container start |

## Usage

```bash
# Start the dashboard (default port 7847)
codeforge-dashboard

# Start on a custom port
codeforge-dashboard -p 8080

# Show help
codeforge-dashboard --help
```

The dashboard reads session data from `~/.claude/projects/`.

## Auto-launch behavior

When `autostart` is enabled (default), a poststart hook starts the dashboard in the background on every container start. It listens on `0.0.0.0:7847` so VS Code port forwarding works automatically. The process writes logs to `/tmp/codeforge-dashboard.log` and tracks its PID at `/tmp/codeforge-dashboard.pid` to avoid duplicate launches.

## Persistence

The dashboard database is stored at `~/.codeforge/data/dashboard.db`, which lives on the Docker named volume backing `~/.claude/`. This survives container rebuilds without any symlink hooks.
