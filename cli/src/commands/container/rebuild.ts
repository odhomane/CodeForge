import chalk from "chalk";
import type { Command } from "commander";
import { isInsideContainer } from "../../utils/context.js";
import {
	devcontainerRebuild,
	findWorkspacePath,
} from "../../utils/devcontainer.js";

export function registerContainerRebuildCommand(parent: Command): void {
	parent
		.command("rebuild [workspace-path]")
		.description("Rebuild a CodeForge devcontainer")
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
					"Provide a workspace path: codeforge container rebuild <path>",
				);
				process.exit(1);
			}

			try {
				console.log(
					`${chalk.blue("▶")} Rebuilding devcontainer at ${resolved}...`,
				);
				await devcontainerRebuild(resolved);
				console.log(`${chalk.green("✓")} Devcontainer rebuilt`);
			} catch (err) {
				const message = err instanceof Error ? err.message : String(err);
				console.error(`${chalk.red("✗")} Failed to rebuild: ${message}`);
				process.exit(1);
			}
		});
}
