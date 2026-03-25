import { homedir } from "node:os";
import { basename, resolve } from "node:path";
import type { PlanMeta } from "./types.js";

export async function loadPlanBySlug(slug: string): Promise<PlanMeta | null> {
	const filePath = resolve(homedir(), ".claude/plans", `${slug}.md`);
	try {
		const content = await Bun.file(filePath).text();
		let title = slug;
		for (const line of content.split(/\r?\n/)) {
			if (line.startsWith("# ")) {
				title = line.slice(2).trim();
				break;
			}
		}
		return { slug, title, content };
	} catch {
		return null;
	}
}

export async function loadAllPlanSlugs(): Promise<string[]> {
	const basePath = resolve(homedir(), ".claude/plans");
	const slugs: string[] = [];

	try {
		const glob = new Bun.Glob("*.md");
		for await (const entry of glob.scan({
			cwd: basePath,
			absolute: false,
		})) {
			slugs.push(basename(entry, ".md"));
		}
	} catch {
		return [];
	}

	return slugs;
}
