# Dashboard Package

Session analytics dashboard for Claude Code. Svelte 5 SPA + Bun backend.

## Development

- **Runtime**: Bun
- **Frontend**: Svelte 5 + Vite (port 5173)
- **Backend**: Bun.serve
- **Charts**: LayerChart @next
- **Tests**: `bun test`

## Architecture

```
src/
  server/           # Bun HTTP server, API routes, SSE, file watcher
  parser/           # Session file parsing, analytics, project detection
  web/              # Svelte 5 SPA (components, stores, routes)
tests/
  parser/           # Parser unit tests
  server/           # API route tests
mockups/            # Static HTML mockups for design validation
```

## Key Rules

- Read-only access to `~/.claude/` — never write to session files
- Dark mode only
- All timestamps in ISO 8601 UTC
- Fork patterns from CLI (`cli/src/`) — don't import CLI as dependency
- Use Svelte 5 runes ($state, $derived, $effect), NOT Svelte stores
- Do NOT set global `runes: true` in svelte.config.js (LayerCake incompatible)
