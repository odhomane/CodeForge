#!/bin/bash
# SPDX-License-Identifier: GPL-3.0-only
# Copyright (c) 2026 Marcus Krueger
set -euo pipefail

VERSION="${VERSION:-latest}"

# Skip installation if version is "none"
if [ "${VERSION}" = "none" ]; then
    echo "[codeforge-cli] Skipping installation (version=none)"
    exit 0
fi

echo "[codeforge-cli] Installing self-bootstrapping wrapper..."

# Write the wrapper script that runs the CLI from workspace source.
# The workspace is not mounted during feature install (Docker build),
# so the wrapper defers bun install to first invocation.
cat > /usr/local/bin/codeforge <<'WRAPPER'
#!/bin/bash
set -euo pipefail

CLI_DIR="${WORKSPACE_ROOT:-/workspaces}/cli"
BUN="${BUN:-$(command -v bun 2>/dev/null || echo "$HOME/.bun/bin/bun")}"

if [ ! -d "$CLI_DIR" ]; then
    echo "codeforge: CLI source not found at $CLI_DIR" >&2
    echo "Ensure the workspace is mounted and contains the cli/ directory." >&2
    exit 1
fi

if [ ! -d "$CLI_DIR/node_modules" ]; then
    echo "codeforge: bootstrapping dependencies..." >&2
    "$BUN" install --cwd "$CLI_DIR" --frozen-lockfile >/dev/null 2>&1 || \
    "$BUN" install --cwd "$CLI_DIR" >/dev/null 2>&1
fi

exec "$BUN" "$CLI_DIR/src/index.ts" "$@"
WRAPPER

chmod +x /usr/local/bin/codeforge

echo "[codeforge-cli] Wrapper installed at /usr/local/bin/codeforge"
echo "[codeforge-cli] CLI will bootstrap from workspace source on first use"
