import chalk from "chalk";
import type { Command } from "commander";
import { isInsideContainer } from "../../utils/context.js";
import { dockerExec, resolveContainer } from "../../utils/docker.js";

export function registerContainerExecCommand(parent: Command): void {
	parent
		.command("exec [name]")
		.description("Execute a command inside a running devcontainer")
		.allowUnknownOption(true)
		.allowExcessArguments(true)
		.action(
			async (
				name: string | undefined,
				_options: unknown,
				_command: Command,
			) => {
				if (isInsideContainer()) {
					console.error("Already inside a container.");
					process.exit(1);
				}

				const dashDashIndex = process.argv.indexOf("--");
				if (dashDashIndex === -1 || dashDashIndex === process.argv.length - 1) {
					console.error(
						"Usage: codeforge container exec [name] -- <command...>",
					);
					process.exit(1);
				}
				const cmd = process.argv.slice(dashDashIndex + 1);

				try {
					const container = await resolveContainer(name);
					await dockerExec(container.id, cmd);
				} catch (err) {
					const message = err instanceof Error ? err.message : String(err);
					console.error(`${chalk.red("✗")} ${message}`);
					process.exit(1);
				}
			},
		);
}
