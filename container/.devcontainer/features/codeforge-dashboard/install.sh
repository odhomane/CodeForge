#!/bin/bash
# SPDX-License-Identifier: GPL-3.0-only
# Copyright (c) 2026 Marcus Krueger
set -euo pipefail

# === IMPORT OPTIONS ===
DASH_VERSION="${VERSION:-latest}"
PORT="${PORT:-7847}"
AUTOSTART="${AUTOSTART:-true}"
USERNAME="${USERNAME:-automatic}"

# Skip installation if version is "none"
if [ "${DASH_VERSION}" = "none" ]; then
    echo "[codeforge-dashboard] Skipping installation (version=none)"
    exit 0
fi

echo "[codeforge-dashboard] Installing @coredirective/cf-dash..."

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
    echo "[codeforge-dashboard] ERROR: bun is not available"
    echo "  Checked:"
    echo "    - PATH"
    echo "    - /usr/local/bin/bun"
    echo "    - /root/.bun/bin/bun"
    echo "    - /home/vscode/.bun/bin/bun"
    exit 1
fi

# Ensure downstream commands work
export PATH="$(dirname "$BUN"):$PATH"

echo "[codeforge-dashboard] Using bun at: $BUN"

# === DETECT USER ===
if [ "${USERNAME}" = "auto" ] || [ "${USERNAME}" = "automatic" ]; then
    USERNAME=""
    for CURRENT_USER in vscode node codespace; do
        if id -u "${CURRENT_USER}" >/dev/null 2>&1; then
            USERNAME=${CURRENT_USER}
            break
        fi
    done
    [ -z "${USERNAME}" ] && USERNAME=root
elif [ "${USERNAME}" = "none" ] || ! id -u "${USERNAME}" >/dev/null 2>&1; then
    USERNAME=root
fi

echo "[codeforge-dashboard] Installing for user: ${USERNAME}"

# === INSTALL FROM NPM ===
# Install globally — this runs as root during Docker build
if [ "${DASH_VERSION}" = "latest" ]; then
    "$BUN" install -g @coredirective/cf-dash
else
    "$BUN" install -g "@coredirective/cf-dash@${DASH_VERSION}"
fi

# === SYMLINK TO SYSTEM PATH ===
# bun install -g puts binaries in the current user's global bin (e.g. /root/.bun/bin/).
# During Docker build this is root's dir, but at runtime the user is vscode.
# Create a wrapper at /usr/local/bin/ so the binary is on everyone's PATH.
BUN_GLOBAL_BIN="$("$BUN" pm bin -g 2>/dev/null || echo "$HOME/.bun/bin")"
INSTALLED_BIN="${BUN_GLOBAL_BIN}/codeforge-dashboard"

if [ ! -x "$INSTALLED_BIN" ]; then
    echo "[codeforge-dashboard] WARNING: Expected binary not found at $INSTALLED_BIN"
    echo "  Searching for it..."
    INSTALLED_BIN="$(find /root/.bun "$HOME/.bun" /usr/local -name codeforge-dashboard -type f 2>/dev/null | head -1 || true)"
    if [ -z "$INSTALLED_BIN" ]; then
        echo "[codeforge-dashboard] ERROR: Could not find installed codeforge-dashboard binary"
        exit 1
    fi
fi

echo "[codeforge-dashboard] Installed binary found at: $INSTALLED_BIN"

# Create a system-wide wrapper that resolves the real binary at runtime
cat > /usr/local/bin/codeforge-dashboard <<'WRAPPER'
#!/bin/bash
set -euo pipefail

BUN="${BUN:-$(command -v bun 2>/dev/null || echo "$HOME/.bun/bin/bun")}"

# Dev mode: find dashboard source in workspace
DASH_DIR=""
for candidate in \
    "${WORKSPACE_ROOT:-/workspaces}/dashboard" \
    "${WORKSPACE_ROOT:-/workspaces}/projects/CodeForge/dashboard"; do
    if [ -d "$candidate/src" ]; then
        DASH_DIR="$candidate"
        break
    fi
done

if [ -n "$DASH_DIR" ]; then
    if [ ! -d "$DASH_DIR/node_modules" ]; then
        echo "codeforge-dashboard: bootstrapping dev dependencies..." >&2
        "$BUN" install --cwd "$DASH_DIR" --frozen-lockfile >/dev/null 2>&1 || \
        "$BUN" install --cwd "$DASH_DIR" >/dev/null 2>&1
    fi
    exec "$DASH_DIR/bin/codeforge-dashboard" "$@"
fi

# Check runtime user's global bin first
GLOBAL_BIN="$("$BUN" pm bin -g 2>/dev/null || echo "$HOME/.bun/bin")"
if [ -x "$GLOBAL_BIN/codeforge-dashboard" ] && [ "$GLOBAL_BIN/codeforge-dashboard" != "$0" ]; then
    exec "$GLOBAL_BIN/codeforge-dashboard" "$@"
fi

# Fallback: check root's global bin (installed during Docker build)
for candidate in /root/.bun/bin/codeforge-dashboard /home/*/.bun/bin/codeforge-dashboard; do
    if [ -x "$candidate" ] && [ "$candidate" != "$0" ]; then
        exec "$candidate" "$@"
    fi
done

echo "codeforge-dashboard: not found. Install with: bun install -g @coredirective/cf-dash" >&2
exit 1
WRAPPER

chmod +x /usr/local/bin/codeforge-dashboard

# === VERIFY ===
echo "[codeforge-dashboard] Verifying installation..."
if "$INSTALLED_BIN" --version &>/dev/null; then
    echo "[codeforge-dashboard] ✓ codeforge-dashboard command is working"
else
    echo "[codeforge-dashboard] WARNING: Could not verify (may need bun in PATH)"
fi

# === AUTOSTART HOOK ===
if [ "${AUTOSTART}" = "true" ]; then
    HOOK_DIR="/usr/local/devcontainer-poststart.d"
    mkdir -p "$HOOK_DIR"

    cat > "${HOOK_DIR}/50-codeforge-dashboard.sh" <<HOOK
#!/bin/bash
# Auto-start CodeForge Dashboard
PORT="\${CODEFORGE_DASHBOARD_PORT:-${PORT}}"

# Check if already running on the target port
if command -v lsof &>/dev/null && lsof -i ":\$PORT" &>/dev/null; then
    echo "Dashboard already running on port \$PORT"
    exit 0
fi

if ! command -v codeforge-dashboard &>/dev/null; then
    echo "codeforge-dashboard not found in PATH, skipping auto-start"
    exit 0
fi

nohup codeforge-dashboard --port "\$PORT" --host 0.0.0.0 > /tmp/codeforge-dashboard.log 2>&1 &
echo \$! > /tmp/codeforge-dashboard.pid
echo "Dashboard started on port \$PORT (PID: \$!)"
HOOK

    chmod +x "${HOOK_DIR}/50-codeforge-dashboard.sh"
    echo "[codeforge-dashboard] Poststart hook installed (auto-launch on port ${PORT})"
else
    echo "[codeforge-dashboard] Autostart disabled — run manually: codeforge-dashboard --port ${PORT}"
fi

# === SUMMARY ===
echo ""
echo "[codeforge-dashboard] Installation complete"
echo "  Package: @coredirective/cf-dash@${DASH_VERSION}"
echo "  Command: codeforge-dashboard"
echo "  Port: ${PORT}"
echo "  Autostart: ${AUTOSTART}"
