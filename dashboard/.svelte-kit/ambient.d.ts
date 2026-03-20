
// this file is generated — do not edit it


/// <reference types="@sveltejs/kit" />

/**
 * This module provides access to environment variables that are injected _statically_ into your bundle at build time and are limited to _private_ access.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Static environment variables are [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env` at build time and then statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * **_Private_ access:**
 * 
 * - This module cannot be imported into client-side code
 * - This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured)
 * 
 * For example, given the following build time environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://site.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { ENVIRONMENT, PUBLIC_BASE_URL } from '$env/static/private';
 * 
 * console.log(ENVIRONMENT); // => "production"
 * console.log(PUBLIC_BASE_URL); // => throws error during build
 * ```
 * 
 * The above values will be the same _even if_ different values for `ENVIRONMENT` or `PUBLIC_BASE_URL` are set at runtime, as they are statically replaced in your code with their build time values.
 */
declare module '$env/static/private' {
	export const ANTHROPIC_MODEL: string;
	export const USER: string;
	export const CLAUDE_CODE_ENTRYPOINT: string;
	export const npm_config_user_agent: string;
	export const GIT_EDITOR: string;
	export const HOSTNAME: string;
	export const PIPX_HOME: string;
	export const npm_node_execpath: string;
	export const SHLVL: string;
	export const npm_config_noproxy: string;
	export const HOME: string;
	export const OLDPWD: string;
	export const LESS: string;
	export const CLAUDE_CODE_MAX_OUTPUT_TOKENS: string;
	export const NVM_BIN: string;
	export const npm_package_json: string;
	export const NVM_SYMLINK_CURRENT: string;
	export const PIPX_BIN_DIR: string;
	export const NVM_INC: string;
	export const ZSH: string;
	export const LSCOLORS: string;
	export const ANTHROPIC_DEFAULT_SONNET_MODEL: string;
	export const BASH_DEFAULT_TIMEOUT_MS: string;
	export const PAGER: string;
	export const npm_config_userconfig: string;
	export const npm_config_local_prefix: string;
	export const PYTHON_SHA256: string;
	export const MAX_MCP_OUTPUT_TOKENS: string;
	export const COLORTERM: string;
	export const CLAUDE_CODE_PLAN_MODE_REQUIRED: string;
	export const COLOR: string;
	export const NVM_DIR: string;
	export const PYTHON_PATH: string;
	export const CLAUDE_CONFIG_DIR: string;
	export const CLAUDE_CODE_EFFORT_LEVEL: string;
	export const LOGNAME: string;
	export const _: string;
	export const ENABLE_TOOL_SEARCH: string;
	export const npm_config_prefix: string;
	export const npm_config_npm_version: string;
	export const TERM: string;
	export const OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE: string;
	export const npm_config_cache: string;
	export const MCP_TOOL_TIMEOUT: string;
	export const CLAUDE_CODE_DISABLE_AUTO_MEMORY: string;
	export const ANTHROPIC_DEFAULT_OPUS_MODEL: string;
	export const npm_config_node_gyp: string;
	export const PATH: string;
	export const NODE: string;
	export const npm_package_name: string;
	export const COREPACK_ENABLE_AUTO_PIN: string;
	export const CLAUDE_CODE_PLAN_MODE_INTERVIEW_PHASE: string;
	export const FORCE_AUTOUPDATE_PLUGINS: string;
	export const ENABLE_CLAUDE_CODE_SM_COMPACT: string;
	export const CLAUDE_CODE_PLAN_V2_AGENT_COUNT: string;
	export const GH_CONFIG_DIR: string;
	export const LANG: string;
	export const NoDefaultCurrentDirectoryInExePath: string;
	export const ANTHROPIC_DEFAULT_HAIKU_MODEL: string;
	export const LS_COLORS: string;
	export const CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD: string;
	export const CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR: string;
	export const npm_lifecycle_script: string;
	export const CLAUDE_AUTOCOMPACT_PCT_OVERRIDE: string;
	export const CLAUDE_CODE_MAX_TOOL_USE_CONCURRENCY: string;
	export const SHELL: string;
	export const npm_package_version: string;
	export const npm_lifecycle_event: string;
	export const PYTHON_VERSION: string;
	export const CLAUDE_CODE_FORCE_GLOBAL_CACHE: string;
	export const CLAUDECODE: string;
	export const TASK_MAX_OUTPUT_LENGTH: string;
	export const npm_config_globalconfig: string;
	export const npm_config_init_module: string;
	export const PWD: string;
	export const LC_ALL: string;
	export const BASH_MAX_TIMEOUT_MS: string;
	export const MAX_THINKING_TOKENS: string;
	export const npm_execpath: string;
	export const NVM_CD_FLAGS: string;
	export const CLAUDE_CODE_MAX_RETRIES: string;
	export const npm_config_global_prefix: string;
	export const MCP_TIMEOUT: string;
	export const BASH_MAX_OUTPUT_LENGTH: string;
	export const npm_command: string;
	export const CLAUDE_CODE_ENABLE_TASKS: string;
	export const CLAUDE_CODE_AUTO_COMPACT_WINDOW: string;
	export const CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: string;
	export const INIT_CWD: string;
	export const EDITOR: string;
	export const NODE_ENV: string;
}

/**
 * This module provides access to environment variables that are injected _statically_ into your bundle at build time and are _publicly_ accessible.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Static environment variables are [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env` at build time and then statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * **_Public_ access:**
 * 
 * - This module _can_ be imported into client-side code
 * - **Only** variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`) are included
 * 
 * For example, given the following build time environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://site.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { ENVIRONMENT, PUBLIC_BASE_URL } from '$env/static/public';
 * 
 * console.log(ENVIRONMENT); // => throws error during build
 * console.log(PUBLIC_BASE_URL); // => "http://site.com"
 * ```
 * 
 * The above values will be the same _even if_ different values for `ENVIRONMENT` or `PUBLIC_BASE_URL` are set at runtime, as they are statically replaced in your code with their build time values.
 */
declare module '$env/static/public' {
	
}

/**
 * This module provides access to environment variables set _dynamically_ at runtime and that are limited to _private_ access.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Dynamic environment variables are defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`.
 * 
 * **_Private_ access:**
 * 
 * - This module cannot be imported into client-side code
 * - This module includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured)
 * 
 * > [!NOTE] In `dev`, `$env/dynamic` includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 * 
 * > [!NOTE] To get correct types, environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * >
 * > ```env
 * > MY_FEATURE_FLAG=
 * > ```
 * >
 * > You can override `.env` values from the command line like so:
 * >
 * > ```sh
 * > MY_FEATURE_FLAG="enabled" npm run dev
 * > ```
 * 
 * For example, given the following runtime environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://site.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { env } from '$env/dynamic/private';
 * 
 * console.log(env.ENVIRONMENT); // => "production"
 * console.log(env.PUBLIC_BASE_URL); // => undefined
 * ```
 */
declare module '$env/dynamic/private' {
	export const env: {
		ANTHROPIC_MODEL: string;
		USER: string;
		CLAUDE_CODE_ENTRYPOINT: string;
		npm_config_user_agent: string;
		GIT_EDITOR: string;
		HOSTNAME: string;
		PIPX_HOME: string;
		npm_node_execpath: string;
		SHLVL: string;
		npm_config_noproxy: string;
		HOME: string;
		OLDPWD: string;
		LESS: string;
		CLAUDE_CODE_MAX_OUTPUT_TOKENS: string;
		NVM_BIN: string;
		npm_package_json: string;
		NVM_SYMLINK_CURRENT: string;
		PIPX_BIN_DIR: string;
		NVM_INC: string;
		ZSH: string;
		LSCOLORS: string;
		ANTHROPIC_DEFAULT_SONNET_MODEL: string;
		BASH_DEFAULT_TIMEOUT_MS: string;
		PAGER: string;
		npm_config_userconfig: string;
		npm_config_local_prefix: string;
		PYTHON_SHA256: string;
		MAX_MCP_OUTPUT_TOKENS: string;
		COLORTERM: string;
		CLAUDE_CODE_PLAN_MODE_REQUIRED: string;
		COLOR: string;
		NVM_DIR: string;
		PYTHON_PATH: string;
		CLAUDE_CONFIG_DIR: string;
		CLAUDE_CODE_EFFORT_LEVEL: string;
		LOGNAME: string;
		_: string;
		ENABLE_TOOL_SEARCH: string;
		npm_config_prefix: string;
		npm_config_npm_version: string;
		TERM: string;
		OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE: string;
		npm_config_cache: string;
		MCP_TOOL_TIMEOUT: string;
		CLAUDE_CODE_DISABLE_AUTO_MEMORY: string;
		ANTHROPIC_DEFAULT_OPUS_MODEL: string;
		npm_config_node_gyp: string;
		PATH: string;
		NODE: string;
		npm_package_name: string;
		COREPACK_ENABLE_AUTO_PIN: string;
		CLAUDE_CODE_PLAN_MODE_INTERVIEW_PHASE: string;
		FORCE_AUTOUPDATE_PLUGINS: string;
		ENABLE_CLAUDE_CODE_SM_COMPACT: string;
		CLAUDE_CODE_PLAN_V2_AGENT_COUNT: string;
		GH_CONFIG_DIR: string;
		LANG: string;
		NoDefaultCurrentDirectoryInExePath: string;
		ANTHROPIC_DEFAULT_HAIKU_MODEL: string;
		LS_COLORS: string;
		CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD: string;
		CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR: string;
		npm_lifecycle_script: string;
		CLAUDE_AUTOCOMPACT_PCT_OVERRIDE: string;
		CLAUDE_CODE_MAX_TOOL_USE_CONCURRENCY: string;
		SHELL: string;
		npm_package_version: string;
		npm_lifecycle_event: string;
		PYTHON_VERSION: string;
		CLAUDE_CODE_FORCE_GLOBAL_CACHE: string;
		CLAUDECODE: string;
		TASK_MAX_OUTPUT_LENGTH: string;
		npm_config_globalconfig: string;
		npm_config_init_module: string;
		PWD: string;
		LC_ALL: string;
		BASH_MAX_TIMEOUT_MS: string;
		MAX_THINKING_TOKENS: string;
		npm_execpath: string;
		NVM_CD_FLAGS: string;
		CLAUDE_CODE_MAX_RETRIES: string;
		npm_config_global_prefix: string;
		MCP_TIMEOUT: string;
		BASH_MAX_OUTPUT_LENGTH: string;
		npm_command: string;
		CLAUDE_CODE_ENABLE_TASKS: string;
		CLAUDE_CODE_AUTO_COMPACT_WINDOW: string;
		CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS: string;
		INIT_CWD: string;
		EDITOR: string;
		NODE_ENV: string;
		[key: `PUBLIC_${string}`]: undefined;
		[key: `${string}`]: string | undefined;
	}
}

/**
 * This module provides access to environment variables set _dynamically_ at runtime and that are _publicly_ accessible.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Dynamic environment variables are defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`.
 * 
 * **_Public_ access:**
 * 
 * - This module _can_ be imported into client-side code
 * - **Only** variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`) are included
 * 
 * > [!NOTE] In `dev`, `$env/dynamic` includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 * 
 * > [!NOTE] To get correct types, environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * >
 * > ```env
 * > MY_FEATURE_FLAG=
 * > ```
 * >
 * > You can override `.env` values from the command line like so:
 * >
 * > ```sh
 * > MY_FEATURE_FLAG="enabled" npm run dev
 * > ```
 * 
 * For example, given the following runtime environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://example.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { env } from '$env/dynamic/public';
 * console.log(env.ENVIRONMENT); // => undefined, not public
 * console.log(env.PUBLIC_BASE_URL); // => "http://example.com"
 * ```
 * 
 * ```
 * 
 * ```
 */
declare module '$env/dynamic/public' {
	export const env: {
		[key: `PUBLIC_${string}`]: string | undefined;
	}
}
