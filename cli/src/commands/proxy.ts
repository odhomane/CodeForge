import chalk from "chalk";
import type { Command } from "commander";
import { isInsideContainer } from "../utils/context.js";
import {
	ensureCaCert,
	findMitmproxy,
	installCaToSystem,
	installMitmproxy,
	isCaInstalled,
	isPortInUse,
	launchClaude,
	startMitmdump,
	startMitmweb,
} from "../utils/mitmproxy.js";

export function registerProxyCommand(parent: Command): void {
	parent
		.command("proxy")
		.description("Launch Claude Code through mitmproxy for traffic inspection")
		.option("--proxy-port <port>", "mitmproxy listen port", "8080")
		.option("--web-port <port>", "mitmweb UI port", "8081")
		.option("--web-host <host>", "mitmweb bind address", "0.0.0.0")
		.option("--setup", "Install mitmproxy and CA certificate only")
		.option("--no-web", "Use mitmdump instead of mitmweb (headless)")
		.allowUnknownOption(true)
		.allowExcessArguments(true)
		.action(async (options) => {
			try {
				if (!isInsideContainer()) {
					console.error(
						`${chalk.red("✗")} codeforge proxy must be run inside a devcontainer.`,
					);
					console.error(
						"  Use `codeforge container shell` to enter a container first.",
					);
					process.exit(1);
				}

				if (!findMitmproxy()) {
					console.error(
						`${chalk.yellow("⚡")} mitmproxy not found. Installing via pipx...`,
					);
					await installMitmproxy();
					if (!findMitmproxy()) {
						console.error(`${chalk.red("✗")} Failed to install mitmproxy.`);
						process.exit(1);
					}
				}

				const caCertPath = await ensureCaCert();
				if (!isCaInstalled()) {
					console.error(
						`${chalk.yellow("⚡")} Installing CA certificate to system trust store...`,
					);
					await installCaToSystem(caCertPath);
				}

				if (options.setup) {
					console.error(
						`${chalk.green("✓")} mitmproxy and CA certificate are ready.`,
					);
					process.exit(0);
				}

				const proxyPort = parseInt(options.proxyPort, 10);
				const webPort = parseInt(options.webPort, 10);
				const webHost: string = options.webHost;

				if (isNaN(proxyPort) || isNaN(webPort)) {
					console.error(`${chalk.red("✗")} Invalid port number.`);
					process.exit(1);
				}

				if (await isPortInUse(proxyPort)) {
					console.error(
						`${chalk.red("✗")} Port ${proxyPort} is already in use.`,
					);
					process.exit(1);
				}
				if (options.web && (await isPortInUse(webPort))) {
					console.error(`${chalk.red("✗")} Port ${webPort} is already in use.`);
					process.exit(1);
				}

				const dashDashIndex = process.argv.indexOf("--");
				const claudeArgs =
					dashDashIndex !== -1 ? process.argv.slice(dashDashIndex + 1) : [];

				let proxyProc;
				if (options.web) {
					proxyProc = startMitmweb({ proxyPort, webPort, webHost });
					console.error(
						`${chalk.green("✓")} mitmweb UI: http://localhost:${webPort}`,
					);
				} else {
					proxyProc = startMitmdump({ proxyPort });
					console.error(
						`${chalk.green("✓")} mitmdump running (traffic logged to terminal)`,
					);
				}
				console.error(
					`${chalk.green("✓")} Proxy listening on port ${proxyPort}`,
				);

				const cleanup = () => {
					try {
						proxyProc.kill();
					} catch {}
				};
				process.on("SIGINT", () => {
					cleanup();
					process.exit(130);
				});
				process.on("SIGTERM", () => {
					cleanup();
					process.exit(143);
				});

				console.error(
					`${chalk.blue("→")} Launching Claude Code through proxy...\n`,
				);
				const exitCode = await launchClaude(claudeArgs, proxyPort, caCertPath);

				cleanup();
				process.exit(exitCode);
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err);
				console.error(`${chalk.red("✗")} ${message}`);
				process.exit(1);
			}
		});
}
