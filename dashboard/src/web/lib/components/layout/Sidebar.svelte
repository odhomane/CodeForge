<script>
import { page } from "$app/state";

const navItems = [
	{ label: "Dashboard", href: "/", icon: "home" },
	{ label: "Sessions", href: "/sessions", icon: "list" },
	{ label: "Plans", href: "/plans", icon: "plan" },
	{ label: "Tasks", href: "/tasks", icon: "tasks" },
	{ label: "Agents", href: "/agents", icon: "agents" },
	{ label: "Context", href: "/context", icon: "context" },
	{ label: "Memories", href: "/memories", icon: "memory" },
	{ label: "Projects", href: "/projects", icon: "folder" },
];
</script>

<aside class="sidebar">
	<div class="logo">
		<span class="logo-mark">CF</span>
		<span class="logo-text">CodeForge</span>
	</div>

	<nav class="nav">
		{#each navItems as item}
			<a
				href={item.href}
				class="nav-item"
				class:active={page.url.pathname === item.href || (item.href !== '/' && page.url.pathname.startsWith(item.href))}
			>
				{item.label}
			</a>
		{/each}
	</nav>

	<div class="footer">
		<div class="status">
			<span class="status-dot"></span>
			<span class="status-text">Connected</span>
		</div>
	</div>
</aside>

<style>
	.sidebar {
		grid-area: sidebar;
		background: var(--bg-deep);
		border-right: 1px solid var(--border);
		display: flex;
		flex-direction: column;
		padding: 16px 12px;
		overflow-y: auto;
	}
	.logo {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 0 8px 16px;
		border-bottom: 1px solid var(--border-subtle);
		margin-bottom: 16px;
	}
	.logo-mark {
		font-family: var(--font-mono);
		font-weight: 700;
		font-size: 18px;
		color: var(--accent);
	}
	.logo-text {
		font-weight: 600;
		font-size: 15px;
		color: var(--text-primary);
	}
	.nav {
		display: flex;
		flex-direction: column;
		gap: 2px;
		flex: 1;
	}
	.nav-item {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 12px;
		border-radius: var(--radius-sm);
		color: var(--text-secondary);
		text-decoration: none;
		font-size: 13px;
		font-weight: 500;
		transition: all var(--transition);
	}
	.nav-item:hover {
		background: var(--bg-card);
		color: var(--text-primary);
	}
	.nav-item.active {
		background: var(--accent-dim);
		color: var(--accent);
	}
	.footer {
		padding-top: 16px;
		border-top: 1px solid var(--border-subtle);
	}
	.status {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 4px 8px;
	}
	.status-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--green);
	}
	.status-text {
		font-size: 12px;
		color: var(--text-muted);
	}
</style>
