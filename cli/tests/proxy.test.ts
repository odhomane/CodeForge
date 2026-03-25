import { describe, expect, test } from "bun:test";
import { Command } from "commander";
import { registerProxyCommand } from "../src/commands/proxy.js";
import {
	findMitmproxy,
	isCaInstalled,
	isPortInUse,
} from "../src/utils/mitmproxy.js";

describe("findMitmproxy", () => {
	test("returns null or string", () => {
		const result = findMitmproxy();
		expect(result === null || typeof result === "string").toBe(true);
	});
});

describe("isCaInstalled", () => {
	test("returns false when cert does not exist at system path", () => {
		expect(isCaInstalled()).toBe(false);
	});
});

describe("isPortInUse", () => {
	test("returns false for a known-free port", async () => {
		// Use an ephemeral port unlikely to be in use
		const result = await isPortInUse(59123);
		expect(result).toBe(false);
	});
});

describe("argv -- separator parsing", () => {
	test("extracts args after --", () => {
		const argv = [
			"node",
			"codeforge",
			"proxy",
			"--proxy-port",
			"8080",
			"--",
			"-p",
			"analyze this",
		];
		const dashDashIndex = argv.indexOf("--");
		const claudeArgs =
			dashDashIndex !== -1 ? argv.slice(dashDashIndex + 1) : [];
		expect(claudeArgs).toEqual(["-p", "analyze this"]);
	});

	test("returns empty array when no -- present", () => {
		const argv = ["node", "codeforge", "proxy", "--proxy-port", "8080"];
		const dashDashIndex = argv.indexOf("--");
		const claudeArgs =
			dashDashIndex !== -1 ? argv.slice(dashDashIndex + 1) : [];
		expect(claudeArgs).toEqual([]);
	});

	test("returns empty array when -- is the last element", () => {
		const argv = ["node", "codeforge", "proxy", "--"];
		const dashDashIndex = argv.indexOf("--");
		const claudeArgs =
			dashDashIndex !== -1 ? argv.slice(dashDashIndex + 1) : [];
		expect(claudeArgs).toEqual([]);
	});
});

describe("registerProxyCommand", () => {
	test("registers proxy command on a Commander instance", () => {
		const program = new Command();
		registerProxyCommand(program);
		const proxyCmd = program.commands.find((c) => c.name() === "proxy");
		expect(proxyCmd).toBeDefined();
	});

	test("proxy command has expected options", () => {
		const program = new Command();
		registerProxyCommand(program);
		const proxyCmd = program.commands.find((c) => c.name() === "proxy")!;
		const optionNames = proxyCmd.options.map((o) => o.long);
		expect(optionNames).toContain("--proxy-port");
		expect(optionNames).toContain("--web-port");
		expect(optionNames).toContain("--web-host");
		expect(optionNames).toContain("--setup");
		expect(optionNames).toContain("--no-web");
	});

	test("proxy command has correct description", () => {
		const program = new Command();
		registerProxyCommand(program);
		const proxyCmd = program.commands.find((c) => c.name() === "proxy")!;
		expect(proxyCmd.description()).toContain("mitmproxy");
	});
});
