
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	type MatcherParam<M> = M extends (param : string) => param is (infer U extends string) ? U : string;

	export interface AppTypes {
		RouteId(): "/" | "/agents" | "/context" | "/memories" | "/plans" | "/projects" | "/projects/[project]" | "/sessions" | "/sessions/[id]" | "/tasks";
		RouteParams(): {
			"/projects/[project]": { project: string };
			"/sessions/[id]": { id: string }
		};
		LayoutParams(): {
			"/": { project?: string; id?: string };
			"/agents": Record<string, never>;
			"/context": Record<string, never>;
			"/memories": Record<string, never>;
			"/plans": Record<string, never>;
			"/projects": { project?: string };
			"/projects/[project]": { project: string };
			"/sessions": { id?: string };
			"/sessions/[id]": { id: string };
			"/tasks": Record<string, never>
		};
		Pathname(): "/" | "/agents" | "/context" | "/memories" | "/plans" | "/projects" | `/projects/${string}` & {} | "/sessions" | `/sessions/${string}` & {} | "/tasks";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): string & {};
	}
}