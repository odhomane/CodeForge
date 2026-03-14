import { existsSync } from "fs";
import { resolveContainer } from "./docker.js";

/**
 * Detect if the current process is running inside a container.
 */
export function isInsideContainer(): boolean {
	return (
		existsSync("/.dockerenv") ||
		!!process.env.REMOTE_CONTAINERS ||
		existsSync("/run/.containerenv")
	);
}

/**
 * Resolve the target container ID for proxy mode.
 */
export async function getProxyTarget(containerName?: string): Promise<string> {
	const container = await resolveContainer(containerName);
	return container.id;
}

/**
 * Proxy a CLI command into a running container.
 */
export async function proxyCommand(
	containerId: string,
	args: string[],
): Promise<void> {
	const proc = Bun.spawn(
		["docker", "exec", containerId, "codeforge", ...args],
		{
			stdout: "inherit",
			stderr: "inherit",
			stdin: "inherit",
		},
	);

	const exitCode = await proc.exited;
	process.exit(exitCode);
}
