import chalk from "chalk";
import type { Command } from "commander";
import { basename } from "path";
import { isDockerAvailable, listDevcontainers } from "../../utils/docker.js";

export function registerContainerLsCommand(parent: Command): void {
	parent
		.command("ls")
		.description("List running CodeForge devcontainers")
		.action(async () => {
			if (!isDockerAvailable()) {
				console.error(
					"Docker is not available. Install Docker Desktop to manage containers.",
				);
				process.exit(1);
			}

			try {
				const containers = await listDevcontainers();
				if (containers.length === 0) {
					console.log("No running CodeForge devcontainers found.");
					return;
				}

				console.log(
					chalk.bold("NAME".padEnd(25)) +
						chalk.bold("STATUS".padEnd(15)) +
						chalk.bold("WORKSPACE".padEnd(40)) +
						chalk.bold("PORTS"),
				);
				console.log("─".repeat(90));

				for (const c of containers) {
					const name = basename(c.workspacePath);
					const statusColor = c.status.includes("Up")
						? chalk.green
						: chalk.yellow;
					console.log(
						name.padEnd(25) +
							statusColor(c.status.padEnd(15)) +
							c.workspacePath.padEnd(40) +
							(c.ports || "—"),
					);
				}
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err);
				console.error(`${chalk.red("✗")} ${message}`);
				process.exit(1);
			}
		});
}
