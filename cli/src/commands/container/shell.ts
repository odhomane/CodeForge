import chalk from "chalk";
import type { Command } from "commander";
import { isInsideContainer } from "../../utils/context.js";
import { dockerExec, resolveContainer } from "../../utils/docker.js";

export function registerContainerShellCommand(parent: Command): void {
	parent
		.command("shell [name]")
		.description("Open an interactive shell in a running devcontainer")
		.action(async (name?: string) => {
			if (isInsideContainer()) {
				console.error("Already inside a container.");
				process.exit(1);
			}

			try {
				const container = await resolveContainer(name);
				try {
					await dockerExec(container.id, ["/bin/zsh"], { interactive: true });
				} catch {
					await dockerExec(container.id, ["/bin/bash"], { interactive: true });
				}
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err);
				console.error(`${chalk.red("✗")} ${message}`);
				process.exit(1);
			}
		});
}
