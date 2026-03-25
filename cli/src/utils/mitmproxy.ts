import type { Subprocess } from "bun";
import { existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";

/**
 * Check if mitmweb is available on PATH.
 * Returns the path if found, null otherwise.
 */
export function findMitmproxy(): string | null {
	const result = Bun.spawnSync(["which", "mitmweb"], {
		stdout: "pipe",
		stderr: "pipe",
	});
	if (result.exitCode === 0) {
		return new TextDecoder().decode(result.stdout).trim();
	}
	return null;
}

/**
 * Install mitmproxy via pipx.
 */
export async function installMitmproxy(): Promise<void> {
	const proc = Bun.spawn(["pipx", "install", "mitmproxy"], {
		stdout: "inherit",
		stderr: "inherit",
	});
	const exitCode = await proc.exited;
	if (exitCode !== 0) {
		throw new Error("Failed to install mitmproxy via pipx.");
	}
}

/**
 * Ensure the mitmproxy CA certificate exists.
 * If it doesn't, briefly run mitmdump to trigger generation.
 * Returns the absolute path to the CA cert PEM.
 */
export async function ensureCaCert(): Promise<string> {
	const certPath = join(homedir(), ".mitmproxy", "mitmproxy-ca-cert.pem");
	if (existsSync(certPath)) {
		return certPath;
	}

	const proc = Bun.spawn(["mitmdump", "-q"], {
		stdout: "pipe",
		stderr: "pipe",
	});
	await new Promise((resolve) => setTimeout(resolve, 2000));
	proc.kill();

	if (!existsSync(certPath)) {
		throw new Error(
			`CA certificate was not generated at ${certPath}. Is mitmproxy installed correctly?`,
		);
	}
	return certPath;
}

/**
 * Check if the mitmproxy CA is installed in the system trust store.
 */
export function isCaInstalled(): boolean {
	return existsSync("/usr/local/share/ca-certificates/mitmproxy.crt");
}

/**
 * Install the mitmproxy CA cert to the system trust store.
 * Prints a warning instead of throwing if update-ca-certificates fails.
 */
export async function installCaToSystem(certPath: string): Promise<void> {
	const cp = Bun.spawn(
		["sudo", "cp", certPath, "/usr/local/share/ca-certificates/mitmproxy.crt"],
		{ stdout: "pipe", stderr: "pipe" },
	);
	if ((await cp.exited) !== 0) {
		console.error(
			"Warning: failed to copy CA cert. Run manually:\n  sudo cp " +
				certPath +
				" /usr/local/share/ca-certificates/mitmproxy.crt && sudo update-ca-certificates",
		);
		return;
	}

	const update = Bun.spawn(["sudo", "update-ca-certificates"], {
		stdout: "pipe",
		stderr: "pipe",
	});
	if ((await update.exited) !== 0) {
		console.error(
			"Warning: update-ca-certificates failed. Run manually:\n  sudo update-ca-certificates",
		);
	}
}

/**
 * Start mitmweb as a background process.
 */
export function startMitmweb(opts: {
	proxyPort: number;
	webPort: number;
	webHost: string;
}): Subprocess {
	return Bun.spawn(
		[
			"mitmweb",
			"--mode",
			"regular",
			"--listen-port",
			String(opts.proxyPort),
			"--web-host",
			opts.webHost,
			"--web-port",
			String(opts.webPort),
			"--set",
			"connection_strategy=lazy",
			"--set",
			"web_password=123",
		],
		{ stdout: "pipe", stderr: "pipe" },
	);
}

/**
 * Start mitmdump with output to the terminal.
 */
export function startMitmdump(opts: { proxyPort: number }): Subprocess {
	return Bun.spawn(
		[
			"mitmdump",
			"--mode",
			"regular",
			"--listen-port",
			String(opts.proxyPort),
			"--set",
			"connection_strategy=lazy",
		],
		{ stdout: "inherit", stderr: "inherit" },
	);
}

/**
 * Launch claude with proxy env vars. Returns the exit code.
 */
export async function launchClaude(
	args: string[],
	proxyPort: number,
	caCertPath: string,
): Promise<number> {
	const existingNodeOptions = process.env.NODE_OPTIONS ?? "";
	const nodeOptions = existingNodeOptions
		? `${existingNodeOptions} --use-system-ca`
		: "--use-system-ca";

	const cmd = args.length > 0 ? ["claude", ...args] : ["claude"];
	const proc = Bun.spawn(cmd, {
		stdout: "inherit",
		stderr: "inherit",
		stdin: "inherit",
		env: {
			...process.env,
			HTTPS_PROXY: `http://127.0.0.1:${proxyPort}`,
			NODE_EXTRA_CA_CERTS: caCertPath,
			NODE_OPTIONS: nodeOptions,
		},
	});
	return proc.exited;
}

/**
 * Check if a port is currently in use.
 */
export async function isPortInUse(port: number): Promise<boolean> {
	const proc = Bun.spawn(["lsof", "-i", `:${port}`], {
		stdout: "pipe",
		stderr: "pipe",
	});
	const exitCode = await proc.exited;
	return exitCode === 0;
}
