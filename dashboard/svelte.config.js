import adapter from "@sveltejs/adapter-static";

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			fallback: "index.html",
		}),
		files: {
			routes: "src/web/routes",
			lib: "src/web/lib",
			appTemplate: "src/web/app.html",
		},
	},
};

export default config;
