import { existsSync, statSync } from "fs";
import { homedir } from "os";
import { extname, resolve } from "path";
import { getDb } from "../parser/db.js";
import { getEventBus } from "./event-bus.js";
import { runInitialSync } from "./ingestion.js";
import { runRetention } from "./retention.js";
import { handleApiRequest } from "./routes/api.js";
import { handleSSE } from "./routes/sse.js";
import { createWatcher } from "./watcher.js";

const PORT = parseInt(process.env.PORT || "5173", 10);
const HOST = process.env.HOST || "127.0.0.1";
const DIST_DIR = resolve(import.meta.dir, "../../build");

const eventBus = getEventBus();
const db = getDb();

// Start background ingestion (fire and forget)
runInitialSync(db, eventBus)
	.then(() => {
		runRetention(db);
	})
	.catch((err) => console.error("Ingestion error:", err));

// Start file watcher
const claudeDir = resolve(homedir(), ".claude");
if (existsSync(claudeDir)) {
	createWatcher(claudeDir, eventBus, db);
}

const server = Bun.serve({
	port: PORT,
	hostname: HOST,
	async fetch(req) {
		const url = new URL(req.url);
		const path = url.pathname;

		// CORS headers for dev
		const corsHeaders = {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type",
		};

		if (req.method === "OPTIONS") {
			return new Response(null, { status: 204, headers: corsHeaders });
		}

		// SSE endpoint
		if (path === "/api/events") {
			const response = handleSSE(req, eventBus);
			// Add CORS headers to SSE response
			for (const [key, value] of Object.entries(corsHeaders)) {
				response.headers.set(key, value);
			}
			return response;
		}

		// API routes
		if (path.startsWith("/api/")) {
			const response = await handleApiRequest(req);
			for (const [key, value] of Object.entries(corsHeaders)) {
				response.headers.set(key, value);
			}
			return response;
		}

		// Static file serving with SPA fallback
		const safePath = path === "/" ? "" : path.slice(1);
		const filePath = resolve(DIST_DIR, safePath);
		if (filePath.startsWith(DIST_DIR) && existsSync(filePath)) {
			try {
				const stat = statSync(filePath);
				if (stat.isFile()) {
					const file = Bun.file(filePath);
					const mimeTypes: Record<string, string> = {
						".js": "application/javascript",
						".css": "text/css",
						".html": "text/html",
						".json": "application/json",
						".svg": "image/svg+xml",
						".png": "image/png",
						".ico": "image/x-icon",
						".woff": "font/woff",
						".woff2": "font/woff2",
					};
					const ext = extname(filePath);
					const contentType =
						mimeTypes[ext] || file.type || "application/octet-stream";
					return new Response(file, {
						headers: { "Content-Type": contentType },
					});
				}
			} catch {
				// Fall through to SPA fallback
			}
		}

		// SPA fallback
		const indexPath = resolve(DIST_DIR, "index.html");
		if (existsSync(indexPath)) {
			return new Response(Bun.file(indexPath), {
				headers: { "Content-Type": "text/html" },
			});
		}

		return new Response("Not Found", { status: 404 });
	},
});

console.log(
	`Dashboard server running on http://${server.hostname}:${server.port}`,
);
