#!/usr/bin/env bash
set -euo pipefail

VERSION="${VERSION:-v0.7.0-alpha.34}"

case "$(uname -m)" in
	x86_64 | amd64) arch="amd64" ;;
	aarch64 | arm64) arch="arm64" ;;
	*)
		echo "Unsupported architecture: $(uname -m)" >&2
		exit 1
		;;
esac

url="https://github.com/loft-sh/devpod/releases/download/${VERSION}/devpod-linux-${arch}"

tmp="$(mktemp)"
cleanup() {
	rm -f "$tmp"
}
trap cleanup EXIT

echo "Installing DevPod ${VERSION} (${arch})..."
curl -fsSL "$url" -o "$tmp"
install -m 0755 "$tmp" /usr/local/bin/devpod-real

cat >/usr/local/bin/devpod <<'WRAPPER'
#!/usr/bin/env bash
set -euo pipefail

if [ "${1:-}" = "agent" ] && [ "${2:-}" = "container" ] && [ "${3:-}" = "daemon" ]; then
	setup_script=""
	if [ -f /workspaces/.devcontainer/scripts/setup.sh ]; then
		setup_script="/workspaces/.devcontainer/scripts/setup.sh"
	elif [ -f /workspaces/container/.devcontainer/scripts/setup.sh ]; then
		setup_script="/workspaces/container/.devcontainer/scripts/setup.sh"
	fi

	if [ -n "$setup_script" ] && [ ! -f /tmp/codeforge-setup-ran ]; then
		echo "[devpod-agent] Running CodeForge setup before starting DevPod daemon..."
		if bash "$setup_script"; then
			touch /tmp/codeforge-setup-ran
		else
			echo "[devpod-agent] WARNING: CodeForge setup failed; continuing with DevPod daemon" >&2
		fi
	fi
fi

exec /usr/local/bin/devpod-real "$@"
WRAPPER
chmod 0755 /usr/local/bin/devpod

/usr/local/bin/devpod-real version
