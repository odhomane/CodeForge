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
install -m 0755 "$tmp" /usr/local/bin/devpod

/usr/local/bin/devpod version
