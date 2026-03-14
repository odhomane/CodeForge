import { existsSync } from "fs";
import { resolve } from "path";

/**
 * Find the devcontainer CLI binary.
 * Checks PATH first, then falls back to npx.
 */
export async function findDevcontainerCli(): Promise<string> {
	const devcontainerCheck = Bun.spawnSync(["which", "devcontainer"], {
		stdout: "pipe",
		stderr: "pipe",
	});

	if (devcontainerCheck.exitCode === 0) {
		return "devcontainer";
	}

	const npxCheck = Bun.spawnSync(["which", "npx"], {
		stdout: "pipe",
		stderr: "pipe",
	});

	if (npxCheck.exitCode === 0) {
		return "npx @devcontainers/cli";
	}

	throw new Error(
		"devcontainer CLI not found. Install it via:\n  npm install -g @devcontainers/cli\n  Or install the VS Code Dev Containers extension",
	);
}

/**
 * Run devcontainer up to start or rebuild a devcontainer.
 */
export async function devcontainerUp(
	workspacePath: string,
	opts?: { rebuild?: boolean },
): Promise<void> {
	const cliBin = await findDevcontainerCli();
	const args = cliBin.split(" ");
	args.push("up", "--workspace-folder", workspacePath);

	if (opts?.rebuild) {
		args.push("--rebuild");
	}

	const proc = Bun.spawn(args, {
		stdout: "inherit",
		stderr: "inherit",
	});

	const exitCode = await proc.exited;
	if (exitCode !== 0) {
		throw new Error(`devcontainer up failed with exit code ${exitCode}`);
	}
}

/**
 * Rebuild a devcontainer (convenience wrapper).
 */
export async function devcontainerRebuild(
	workspacePath: string,
): Promise<void> {
	await devcontainerUp(workspacePath, { rebuild: true });
}

/**
 * Walk upward from startDir looking for .devcontainer/devcontainer.json.
 * Returns the directory containing .devcontainer/, or null if not found.
 */
export function findWorkspacePath(startDir?: string): string | null {
	let dir = resolve(startDir || process.cwd());

	while (true) {
		const candidate = resolve(dir, ".devcontainer", "devcontainer.json");
		if (existsSync(candidate)) {
			return dir;
		}

		const parent = resolve(dir, "..");
		if (parent === dir) {
			return null;
		}
		dir = parent;
	}
}
