# CodeForge CLI (codeforge-cli)

> **Warning: Experimental** — The CodeForge CLI is under active development. Commands and interfaces may change between releases.

Installs a self-bootstrapping wrapper for the [CodeForge CLI](https://github.com/AnExiledDev/CodeForge/tree/main/cli). The `codeforge` command runs directly from workspace source (`/workspaces/cli`) — no npm publish required.

On first invocation the wrapper auto-runs `bun install` if `node_modules/` is missing, then execs `bun src/index.ts` with all arguments forwarded.

Requires Bun (declared as an `installsAfter` dependency).

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `version` | string | `latest` | Use `'none'` to skip installation entirely. |

## Usage

```jsonc
// devcontainer.json
"features": {
    "./features/codeforge-cli": {}
}
```
