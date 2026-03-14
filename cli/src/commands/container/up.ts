import chalk from "chalk";
import type { Command } from "commander";
import { isInsideContainer } from "../../utils/context.js";
import { devcontainerUp, findWorkspacePath } from "../../utils/devcontainer.js";

export function registerContainerUpCommand(parent: Command): void {
	parent
		.command("up [workspace-path]")
		.description("Start a CodeForge devcontainer")
		.action(async (workspacePath?: string) => {
			if (isInsideContainer()) {
				console.error(
					"Already inside a container. This command runs on the host.",
				);
				process.exit(1);
			}

			const resolved = workspacePath || findWorkspacePath();
			if (!resolved) {
				console.error(
					"Could not find a .devcontainer/devcontainer.json in the current directory tree.",
				);
				console.error(
					"Provide a workspace path: codeforge container up <path>",
				);
				process.exit(1);
			}

			try {
				console.log(
					`${chalk.blue("▶")} Starting devcontainer at ${resolved}...`,
				);
				await devcontainerUp(resolved);
				console.log(`${chalk.green("✓")} Devcontainer started`);
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err);
				console.error(`${chalk.red("✗")} Failed to start: ${message}`);
				process.exit(1);
			}
		});
}
