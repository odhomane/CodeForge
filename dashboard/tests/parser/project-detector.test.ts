import { describe, expect, test } from "bun:test";
import { decodeProjectPath } from "../../src/parser/project-detector.js";

describe("decodeProjectPath", () => {
	test("decodes standard project path", () => {
		expect(decodeProjectPath("-workspaces-projects-CodeForge")).toBe(
			"/workspaces/projects/CodeForge",
		);
	});

	test("decodes root-level project path", () => {
		expect(decodeProjectPath("-home-user-project")).toBe("/home/user/project");
	});

	test("handles worktree path — strips worktree suffix", () => {
		expect(
			decodeProjectPath(
				"-workspaces-projects-CodeForge--claude-worktrees-feature-x",
			),
		).toBe("/workspaces/projects/CodeForge");
	});

	test("handles worktree path with nested worktree name", () => {
		expect(
			decodeProjectPath("-home-user-repo--claude-worktrees-fix-auth-bug"),
		).toBe("/home/user/repo");
	});

	test("handles path without leading dash", () => {
		expect(decodeProjectPath("home-user-project")).toBe("/home/user/project");
	});

	test("handles single-segment path", () => {
		expect(decodeProjectPath("-project")).toBe("/project");
	});
});
