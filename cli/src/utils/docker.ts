import { basename } from "path";

export interface DevcontainerInfo {
	id: string;
	name: string;
	status: string;
	workspacePath: string;
	image: string;
	ports: string;
}

/**
 * Check if the docker CLI is available on PATH.
 */
export function isDockerAvailable(): boolean {
	const result = Bun.spawnSync(["which", "docker"], {
		stdout: "pipe",
		stderr: "pipe",
	});
	return result.exitCode === 0;
}

/**
 * Query running devcontainers and parse docker ps JSON output.
 */
export async function listDevcontainers(): Promise<DevcontainerInfo[]> {
	const proc = Bun.spawn(
		[
			"docker",
			"ps",
			"--filter",
			"label=devcontainer.local_folder",
			"--format",
			'{"id":"{{.ID}}","name":"{{.Names}}","status":"{{.Status}}","image":"{{.Image}}","ports":"{{.Ports}}","labels":"{{.Labels}}"}',
		],
		{ stdout: "pipe", stderr: "pipe" },
	);

	const output = await new Response(proc.stdout).text();
	const exitCode = await proc.exited;

	if (exitCode !== 0) {
		throw new Error("Failed to list Docker containers. Is Docker running?");
	}

	const lines = output.trim().split("\n").filter(Boolean);
	const containers: DevcontainerInfo[] = [];

	for (const line of lines) {
		const raw = JSON.parse(line) as {
			id: string;
			name: string;
			status: string;
			image: string;
			ports: string;
			labels: string;
		};

		let workspacePath = "";
		const labelPairs = raw.labels.split(",");
		for (const pair of labelPairs) {
			const [key, ...rest] = pair.split("=");
			if (key === "devcontainer.local_folder") {
				workspacePath = rest.join("=");
				break;
			}
		}

		containers.push({
			id: raw.id,
			name: workspacePath ? basename(workspacePath) : raw.name,
			status: raw.status,
			workspacePath,
			image: raw.image,
			ports: raw.ports,
		});
	}

	return containers;
}

/**
 * Resolve a container by name (workspace basename match).
 * If no name is given with a single container, returns it.
 * If multiple containers exist, shows an interactive picker when running in a TTY.
 */
export async function resolveContainer(
	name?: string,
): Promise<DevcontainerInfo> {
	const containers = await listDevcontainers();

	if (containers.length === 0) {
		throw new Error(
			"No running devcontainers found. Start one with: codeforge up",
		);
	}

	if (name) {
		const match = containers.find(
			(c) => basename(c.workspacePath) === name || c.name === name,
		);
		if (!match) {
			const available = containers
				.map((c) => basename(c.workspacePath))
				.join(", ");
			throw new Error(`Container "${name}" not found. Available: ${available}`);
		}
		return match;
	}

	if (containers.length === 1) {
		return containers[0];
	}

	if (!process.stdin.isTTY) {
		const available = containers
			.map((c) => basename(c.workspacePath))
			.join(", ");
		throw new Error(
			`Multiple containers running. Specify one with --name: ${available}`,
		);
	}

	process.stdout.write("Multiple containers found:\n");
	containers.forEach((c, i) => {
		process.stdout.write(
			`  ${i + 1}) ${basename(c.workspacePath)} (${c.status})\n`,
		);
	});
	process.stdout.write("Select container [1]: ");

	const selection = await new Promise<string>((resolve) => {
		let data = "";
		process.stdin.setEncoding("utf-8");
		process.stdin.once("data", (chunk: string) => {
			data = chunk.trim();
			resolve(data);
		});
	});

	const index = selection === "" ? 0 : parseInt(selection, 10) - 1;
	if (isNaN(index) || index < 0 || index >= containers.length) {
		throw new Error("Invalid selection.");
	}

	return containers[index];
}

/**
 * Execute a command inside a container.
 */
export async function dockerExec(
	containerId: string,
	cmd: string[],
	opts?: { interactive?: boolean },
): Promise<void> {
	const args = ["docker", "exec"];
	if (opts?.interactive) {
		args.push("-it");
	}
	args.push(containerId, ...cmd);

	const proc = Bun.spawn(args, {
		stdout: "inherit",
		stderr: "inherit",
		stdin: opts?.interactive ? "inherit" : undefined,
	});

	const exitCode = await proc.exited;
	if (exitCode !== 0) {
		throw new Error(`Command exited with code ${exitCode}`);
	}
}

/**
 * Stop a running container.
 */
export async function dockerStop(containerId: string): Promise<void> {
	const proc = Bun.spawn(["docker", "stop", containerId], {
		stdout: "pipe",
		stderr: "pipe",
	});

	const exitCode = await proc.exited;
	if (exitCode !== 0) {
		const stderr = await new Response(proc.stderr).text();
		throw new Error(
			`Failed to stop container ${containerId}: ${stderr.trim()}`,
		);
	}
}
