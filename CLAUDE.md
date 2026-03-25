# CodeForge Monorepo

This repository contains four packages. Each package manages its own dependencies independently.

## Packages

| Package | Runtime | Package Manager |
|---------|---------|-----------------|
| `container/` | Node.js | npm |
| `cli/` | Bun | bun |
| `docs/` | Node.js | npm |
| `dashboard/` | Bun | npm (frontend) / bun (server) |

## Development Rules

### Branching Strategy

- **`main`** — production/release branch. Only updated via PRs from `staging`.
- **`staging`** — integration branch. All feature/fix branches target `staging` for PRs.
- Feature and fix branches should be created from `staging` and PRed back to `staging`.
- PRs from `staging` to `main` are used for releases.

### Package-Specific Rules

Each package has its own `CLAUDE.md` with package-specific development rules:

- [`container/CLAUDE.md`](container/CLAUDE.md) — changelog, documentation, and configuration rules for the devcontainer package
- `cli/` — Bun/TypeScript CLI; run `bun test` for tests
- `docs/` — Astro/Starlight site; run `npm run build` to verify
- [`dashboard/CLAUDE.md`](dashboard/CLAUDE.md) | [`dashboard/README.md`](dashboard/README.md) — Svelte 5 SPA + Bun backend for session analytics

### Cross-Package Changes

When a change spans multiple packages, make the changes in a single branch and PR.
Group related changes in the commit message by package.

### Testing

Run tests for each affected package before committing:

- **Container**: `cd container && npm test`
- **CLI**: `cd cli && bun test`
- **Docs**: `cd docs && npm run build`
- **Dashboard**: `cd dashboard && bun test`

### Dashboard vs CLI

The `dashboard/` and `cli/` packages serve different audiences:

- **CLI** (`codeforge` command) — terminal-first, text/JSON output, scriptable,
  runs inside or outside the container. Features: session search, task search/list/show,
  plan search, plugin management, index/config commands.
- **Dashboard** (Svelte 5 SPA) — visual analytics, charts, expandable detail views,
  real-time SSE updates. Features: session browsing with conversation replay,
  task/plan/agent/memory views, project analytics, cost tracking.

When adding a new data view:
- If it's browsable/visual (tables, charts, detail drill-down) → dashboard
- If it's scriptable/automatable (piped output, filters, JSON) → CLI
- If it's both → implement in both, but don't import CLI as a dashboard dependency.
  Fork patterns instead.
