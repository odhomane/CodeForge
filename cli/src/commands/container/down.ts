import chalk from "chalk";
import type { Command } from "commander";
import { isInsideContainer } from "../../utils/context.js";
import { dockerStop, resolveContainer } from "../../utils/docker.js";

export function registerContainerDownCommand(parent: Command): void {
	parent
		.command("down [name]")
		.description("Stop a running CodeForge devcontainer")
		.action(async (name?: string) => {
			if (isInsideContainer()) {
				console.error(
					"Already inside a container. This command runs on the host.",
				);
				process.exit(1);
			}

			try {
				const container = await resolveContainer(name);
				console.log(
					`${chalk.blue("▶")} Stopping container ${container.name}...`,
				);
				await dockerStop(container.id);
				console.log(`${chalk.green("✓")} Stopped ${container.name}`);
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err);
				console.error(`${chalk.red("✗")} ${message}`);
				process.exit(1);
			}
		});
}
