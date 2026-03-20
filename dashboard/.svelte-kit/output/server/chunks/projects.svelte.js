//#region src/web/lib/stores/projects.svelte.ts
var projectStore = {
	projects: [],
	selectedProject: null,
	loading: false,
	error: null
};
//#endregion
export { projectStore as t };
