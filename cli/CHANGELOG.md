# CodeForge CLI Changelog

## v0.1.0 — 2026-03-14 (Experimental)

Initial release. Ships with CodeForge v2.1.0.

### Command Groups

- **`codeforge session`** — search, list, and show Claude Code session history
- **`codeforge task`** — search tasks
- **`codeforge plan`** — search plans
- **`codeforge plugin`** — manage plugins (list, show, enable, disable, hooks, agents, skills)
- **`codeforge config`** — show and apply configuration (`apply` deploys config to `~/.claude/`)
- **`codeforge index`** — build and search a codebase symbol index (build, search, show, stats, tree, clean)
- **`codeforge container`** — manage CodeForge devcontainers (up, down, rebuild, exec, ls, shell)

### Features

- Container proxy — commands auto-proxy into the running devcontainer when run from the host; use `--local` to bypass
- `--container <name>` flag to target a specific container
