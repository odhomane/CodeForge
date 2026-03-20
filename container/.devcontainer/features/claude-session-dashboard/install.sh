#!/bin/bash
# SPDX-License-Identifier: GPL-3.0-only
# Copyright (c) 2026 Marcus Krueger
set -euo pipefail

# ==============================
# CodeForge Dashboard
# DevContainer Feature Installer
# ==============================

# === IMPORT OPTIONS ===
DASHBOARD_VERSION="${VERSION:-latest}"
PORT="${PORT:-7847}"
SHELLS="${SHELLS:-both}"
USERNAME="${USERNAME:-automatic}"
AUTOSTART="${AUTOSTART:-true}"

# === SKIP IF DISABLED ===
if [ "${DASHBOARD_VERSION}" = "none" ]; then
    echo "[codeforge-dashboard] Skipping installation (version=none)"
    exit 0
fi

echo "[codeforge-dashboard] Starting installation..."

# === VALIDATE DEPENDENCIES ===
if ! command -v bun &>/dev/null; then
    echo "[codeforge-dashboard] ERROR: bun is not available"
    echo "  Ensure the bun feature is installed first"
    exit 1
fi

# === VALIDATE INPUT ===
if [[ ! "${SHELLS}" =~ ^(bash|zsh|both)$ ]]; then
    echo "[codeforge-dashboard] ERROR: shells must be 'bash', 'zsh', or 'both'"
    exit 1
fi

if [[ ! "${DASHBOARD_VERSION}" =~ ^[a-zA-Z0-9._-]+$ ]]; then
    echo "[codeforge-dashboard] ERROR: version contains invalid characters"
    exit 1
fi

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

USER_HOME=$(eval echo "~${USERNAME}")
if [ ! -d "${USER_HOME}" ]; then
    echo "[codeforge-dashboard] ERROR: Home directory not found for user ${USERNAME}"
    exit 1
fi

echo "[codeforge-dashboard] Installing for user: ${USERNAME}"

# === INSTALL VIA BUN ===
echo "[codeforge-dashboard] Installing codeforge-dashboard@${DASHBOARD_VERSION} globally..."
bun install -g "codeforge-dashboard@${DASHBOARD_VERSION}"

# === AUTOSTART POSTSTART HOOK ===
if [ "${AUTOSTART}" != "false" ]; then
    POSTSTART_DIR="/usr/local/devcontainer-poststart.d"
    HOOK_SCRIPT="${POSTSTART_DIR}/codeforge-dashboard-start.sh"

    mkdir -p "${POSTSTART_DIR}"
    cat > "${HOOK_SCRIPT}" << HOOKEOF
#!/bin/bash
# Auto-launch codeforge-dashboard on container start
PID_FILE="/tmp/codeforge-dashboard.pid"

# If already running, skip
if [ -f "\${PID_FILE}" ]; then
    PID=\$(cat "\${PID_FILE}")
    if kill -0 "\${PID}" 2>/dev/null; then
        echo "[codeforge-dashboard] Already running (PID \${PID}), skipping"
        exit 0
    fi
    rm -f "\${PID_FILE}"
fi

# Start in background
nohup codeforge-dashboard --host 0.0.0.0 --port ${PORT} > /tmp/codeforge-dashboard.log 2>&1 &
echo \$! > "\${PID_FILE}"
echo "[codeforge-dashboard] Started on port ${PORT} (PID \$!)"
HOOKEOF
    chmod +x "${HOOK_SCRIPT}"
    echo "[codeforge-dashboard] Created autostart poststart hook"
fi

# === SHELL ALIASES ===
ALIAS_CMD="alias codeforge-dashboard=\"codeforge-dashboard --host 0.0.0.0 --port ${PORT}\""

configure_shell() {
    local shell_rc="$1"
    local shell_name="$2"

    if [ ! -f "${shell_rc}" ]; then
        echo "[codeforge-dashboard] Creating ${shell_name} config: ${shell_rc}"
        sudo -u "${USERNAME}" touch "${shell_rc}"
    fi

    # Remove old alias if present
    if grep -q "alias claude-dashboard=" "${shell_rc}"; then
        sed -i '/alias claude-dashboard=/d' "${shell_rc}"
        echo "[codeforge-dashboard] Removed old claude-dashboard alias from ${shell_name}"
    fi

    if grep -q "alias codeforge-dashboard=" "${shell_rc}"; then
        echo "[codeforge-dashboard] ${shell_name} alias already configured. Skipping..."
    else
        echo "[codeforge-dashboard] Adding alias to ${shell_name}"
        echo "${ALIAS_CMD}" >> "${shell_rc}"
        chown "${USERNAME}:${USERNAME}" "${shell_rc}" 2>/dev/null || true
    fi
}

if [ "${SHELLS}" = "bash" ] || [ "${SHELLS}" = "both" ]; then
    configure_shell "${USER_HOME}/.bashrc" "bash"
fi

if [ "${SHELLS}" = "zsh" ] || [ "${SHELLS}" = "both" ]; then
    configure_shell "${USER_HOME}/.zshrc" "zsh"
fi

# === VERIFICATION ===
echo "[codeforge-dashboard] Verifying installation..."
if command -v codeforge-dashboard &>/dev/null; then
    INSTALLED_VERSION="$(codeforge-dashboard --version 2>/dev/null || echo "unknown")"
    echo "[codeforge-dashboard] codeforge-dashboard installed (${INSTALLED_VERSION})"
else
    echo "[codeforge-dashboard] WARNING: codeforge-dashboard not found in PATH"
    echo "  The global bun install may need PATH adjustment"
fi

# === SUMMARY ===
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  CodeForge Dashboard Installation Complete"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Configuration:"
echo "  • User: ${USERNAME}"
echo "  • Version: ${DASHBOARD_VERSION}"
echo "  • Default port: ${PORT}"
echo "  • Shells: ${SHELLS}"
echo "  • Autostart: ${AUTOSTART}"
echo "  • Data: ~/.codeforge/data/dashboard.db"
echo ""
echo "Usage:"
echo "  codeforge-dashboard           # Start on port ${PORT}"
echo "  codeforge-dashboard -p 8080   # Start on custom port"
echo "  codeforge-dashboard --help    # Full options"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
