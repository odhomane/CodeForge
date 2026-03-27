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

echo "[codeforge-cli] Installing @coredirective/cf-cli..."

# === FIND BUN ===
BUN=""

for candidate in \
    "$(command -v bun 2>/dev/null || true)" \
    "/usr/local/bin/bun" \
    "/root/.bun/bin/bun" \
    "/home/vscode/.bun/bin/bun"; do
    if [ -n "$candidate" ] && [ -x "$candidate" ]; then
        BUN="$candidate"
        break
    fi
done

if [ -z "$BUN" ]; then
    echo "[codeforge-cli] ERROR: bun is not available"
    echo "  Checked:"
    echo "    - PATH"
    echo "    - /usr/local/bin/bun"
    echo "    - /root/.bun/bin/bun"
    echo "    - /home/vscode/.bun/bin/bun"
    exit 1
fi

# Ensure downstream commands work
export PATH="$(dirname "$BUN"):$PATH"

echo "[codeforge-cli] Using bun at: $BUN"

# === INSTALL FROM NPM ===
# Install globally — this runs as root during Docker build
if [ "${VERSION}" = "latest" ]; then
    "$BUN" install -g @coredirective/cf-cli
else
    "$BUN" install -g "@coredirective/cf-cli@${VERSION}"
fi

# === SYMLINK TO SYSTEM PATH ===
# bun install -g puts binaries in the current user's global bin (e.g. /root/.bun/bin/).
# During Docker build this is root's dir, but at runtime the user is vscode.
# Symlink to /usr/local/bin/ so the binary is on everyone's PATH.
BUN_GLOBAL_BIN="$("$BUN" pm bin -g 2>/dev/null || echo "$HOME/.bun/bin")"
INSTALLED_BIN="${BUN_GLOBAL_BIN}/codeforge"

if [ -x "$INSTALLED_BIN" ]; then
    echo "[codeforge-cli] Installed binary found at: $INSTALLED_BIN"
else
    echo "[codeforge-cli] WARNING: Expected binary not found at $INSTALLED_BIN"
    echo "  Searching for it..."
    INSTALLED_BIN="$(find /root/.bun "$HOME/.bun" /usr/local -name codeforge -type f 2>/dev/null | head -1 || true)"
    if [ -z "$INSTALLED_BIN" ]; then
        echo "[codeforge-cli] ERROR: Could not find installed codeforge binary"
        exit 1
    fi
    echo "[codeforge-cli] Found at: $INSTALLED_BIN"
fi

# === WRITE DEV-FALLBACK WRAPPER ===
# When the CodeForge monorepo is mounted (developers), run from source.
# Otherwise, use the globally installed NPM package via symlink.
cat > /usr/local/bin/codeforge <<'WRAPPER'
#!/bin/bash
set -euo pipefail

BUN="${BUN:-$(command -v bun 2>/dev/null || echo "$HOME/.bun/bin/bun")}"

# Dev mode: find CLI source in workspace
CLI_DIR=""
for candidate in \
    "${WORKSPACE_ROOT:-/workspaces}/cli" \
    "${WORKSPACE_ROOT:-/workspaces}/projects/CodeForge/cli"; do
    if [ -d "$candidate/src" ]; then
        CLI_DIR="$candidate"
        break
    fi
done

if [ -n "$CLI_DIR" ]; then
    if [ ! -d "$CLI_DIR/node_modules" ]; then
        echo "codeforge: bootstrapping dev dependencies..." >&2
        "$BUN" install --cwd "$CLI_DIR" --frozen-lockfile >/dev/null 2>&1 || \
        "$BUN" install --cwd "$CLI_DIR" >/dev/null 2>&1
    fi
    exec "$BUN" "$CLI_DIR/src/index.ts" "$@"
fi

# Production mode: use globally installed package
# Resolve bun global bin at runtime (not build time) for correct user context
GLOBAL_BIN="$("$BUN" pm bin -g 2>/dev/null || echo "$HOME/.bun/bin")"
if [ -x "$GLOBAL_BIN/codeforge" ] && [ "$GLOBAL_BIN/codeforge" != "$0" ]; then
    exec "$GLOBAL_BIN/codeforge" "$@"
fi

# Fallback: search common locations
for candidate in /root/.bun/bin/codeforge /home/*/.bun/bin/codeforge; do
    if [ -x "$candidate" ] && [ "$candidate" != "$0" ]; then
        exec "$candidate" "$@"
    fi
done

echo "codeforge: CLI package not found. Install with: bun install -g @coredirective/cf-cli" >&2
exit 1
WRAPPER

chmod +x /usr/local/bin/codeforge

# === VERIFY ===
echo "[codeforge-cli] Verifying installation..."
if "$INSTALLED_BIN" --help &>/dev/null; then
    echo "[codeforge-cli] ✓ codeforge command is working"
else
    echo "[codeforge-cli] WARNING: Could not verify (may work once workspace is mounted)"
fi

echo ""
echo "[codeforge-cli] Installation complete"
echo "  Package: @coredirective/cf-cli@${VERSION}"
echo "  Command: codeforge"
echo "  Dev mode: auto-enabled when /workspaces/cli/ exists"
