import { describe, expect, test } from "bun:test";
import { Command } from "commander";
import { registerProxyCommand } from "../src/commands/proxy.js";
import {
	buildClaudeEnv,
	findMitmproxy,
	generatePassword,
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
	test("returns boolean based on cert existence", () => {
		expect(typeof isCaInstalled()).toBe("boolean");
	});
});

describe("isPortInUse", () => {
	test("returns false for a known-free port", async () => {
		// Use an ephemeral port unlikely to be in use
		const result = await isPortInUse(59123);
		expect(result).toBe(false);
	});

	test("returns true for an occupied port", async () => {
		const server = Bun.listen({
			port: 0,
			hostname: "127.0.0.1",
			socket: {
				data() {},
				open() {},
				close() {},
				error() {},
			},
		});
		try {
			const result = await isPortInUse(server.port);
			expect(result).toBe(true);
		} finally {
			server.stop();
		}
	});
});

describe("buildClaudeEnv", () => {
	test("sets HTTPS_PROXY with correct port", () => {
		const env = buildClaudeEnv(8080, "/path/to/cert.pem");
		expect(env.HTTPS_PROXY).toBe("http://127.0.0.1:8080");
	});

	test("sets NODE_EXTRA_CA_CERTS to cert path", () => {
		const env = buildClaudeEnv(8080, "/path/to/cert.pem");
		expect(env.NODE_EXTRA_CA_CERTS).toBe("/path/to/cert.pem");
	});

	test("appends --use-system-ca to NODE_OPTIONS", () => {
		const env = buildClaudeEnv(8080, "/path/to/cert.pem");
		expect(env.NODE_OPTIONS).toContain("--use-system-ca");
	});

	test("preserves existing NODE_OPTIONS", () => {
		const original = process.env.NODE_OPTIONS;
		process.env.NODE_OPTIONS = "--max-old-space-size=4096";
		try {
			const env = buildClaudeEnv(8080, "/path/to/cert.pem");
			expect(env.NODE_OPTIONS).toContain("--max-old-space-size=4096");
			expect(env.NODE_OPTIONS).toContain("--use-system-ca");
		} finally {
			if (original === undefined) {
				delete process.env.NODE_OPTIONS;
			} else {
				process.env.NODE_OPTIONS = original;
			}
		}
	});
});

describe("generatePassword", () => {
	test("returns a non-empty string", () => {
		const pw = generatePassword();
		expect(typeof pw).toBe("string");
		expect(pw.length).toBeGreaterThan(0);
	});

	test("generates unique values", () => {
		const a = generatePassword();
		const b = generatePassword();
		expect(a).not.toBe(b);
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
