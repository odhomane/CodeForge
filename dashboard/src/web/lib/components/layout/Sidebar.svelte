<script>
import { page } from "$app/state";

const navGroups = [
	{
		section: null,
		items: [
			{ label: "Dashboard", href: "/", icon: "dashboard" },
		],
	},
	{
		section: "DATA",
		items: [
			{ label: "Projects", href: "/projects", icon: "projects" },
			{ label: "Sessions", href: "/sessions", icon: "sessions" },
			{ label: "Agents", href: "/agents", icon: "agents" },
		],
	},
	{
		section: "WORKFLOW",
		items: [
			{ label: "Plans", href: "/plans", icon: "plans" },
			{ label: "Tasks", href: "/tasks", icon: "tasks" },
		],
	},
	{
		section: "KNOWLEDGE",
		items: [
			{ label: "Context", href: "/context", icon: "context" },
			{ label: "Memories", href: "/memories", icon: "memories" },
		],
	},
];

function isActive(href) {
	return page.url.pathname === href || (href !== '/' && page.url.pathname.startsWith(href));
}
</script>

<aside class="sidebar">
	<div class="logo">
		<span class="logo-mark">CF</span>
		<span class="logo-text">CodeForge</span>
	</div>

	<nav class="nav">
		{#each navGroups as group}
			{#if group.section}
				<div class="section-header">{group.section}</div>
			{/if}
			{#each group.items as item}
				<a
					href={item.href}
					class="nav-item"
					class:active={isActive(item.href)}
				>
					<svg class="nav-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						{#if item.icon === "dashboard"}
							<rect x="1.5" y="1.5" width="5" height="5" rx="1" />
							<rect x="9.5" y="1.5" width="5" height="5" rx="1" />
							<rect x="1.5" y="9.5" width="5" height="5" rx="1" />
							<rect x="9.5" y="9.5" width="5" height="5" rx="1" />
						{:else if item.icon === "projects"}
							<path d="M2 4.5V12.5C2 13.05 2.45 13.5 3 13.5H13C13.55 13.5 14 13.05 14 12.5V5.5C14 4.95 13.55 4.5 13 4.5H8L6.5 2.5H3C2.45 2.5 2 2.95 2 3.5V4.5Z" />
						{:else if item.icon === "sessions"}
							<path d="M2 3.5C2 2.95 2.45 2.5 3 2.5H13C13.55 2.5 14 2.95 14 3.5V10.5C14 11.05 13.55 11.5 13 11.5H4L2 13.5V3.5Z" />
							<line x1="5" y1="5.5" x2="11" y2="5.5" />
							<line x1="5" y1="8" x2="9" y2="8" />
						{:else if item.icon === "agents"}
							<rect x="4" y="2" width="8" height="7" rx="2" />
							<circle cx="6.5" cy="5.5" r="1" fill="currentColor" stroke="none" />
							<circle cx="9.5" cy="5.5" r="1" fill="currentColor" stroke="none" />
							<path d="M5 9V11C5 12.1 5.9 13 7 13H9C10.1 13 11 12.1 11 11V9" />
							<line x1="8" y1="1" x2="8" y2="2" />
							<circle cx="8" cy="0.5" r="0.5" fill="currentColor" stroke="none" />
						{:else if item.icon === "plans"}
							<rect x="2.5" y="1.5" width="11" height="13" rx="1.5" />
							<line x1="5" y1="4.5" x2="11" y2="4.5" />
							<line x1="5" y1="7" x2="11" y2="7" />
							<line x1="5" y1="9.5" x2="9" y2="9.5" />
						{:else if item.icon === "tasks"}
							<rect x="1.5" y="2" width="4" height="3.5" rx="0.75" />
							<line x1="7.5" y1="3.75" x2="14" y2="3.75" />
							<rect x="1.5" y="8" width="4" height="3.5" rx="0.75" />
							<polyline points="2.5,9.75 3.25,10.5 4.5,9" />
							<line x1="7.5" y1="9.75" x2="14" y2="9.75" />
						{:else if item.icon === "context"}
							<path d="M4 1.5H10.5L13.5 4.5V13C13.5 13.55 13.05 14 12.5 14H4C3.45 14 3 13.55 3 13V2.5C3 1.95 3.45 1.5 4 1.5Z" />
							<polyline points="10.5,1.5 10.5,4.5 13.5,4.5" />
							<line x1="5.5" y1="7.5" x2="11" y2="7.5" />
							<line x1="5.5" y1="10" x2="9" y2="10" />
						{:else if item.icon === "memories"}
							<path d="M8 2C5.5 2 3.5 3.8 3.5 6C3.5 7.4 4.3 8.6 5.5 9.3V10.5C5.5 10.8 5.7 11 6 11H10C10.3 11 10.5 10.8 10.5 10.5V9.3C11.7 8.6 12.5 7.4 12.5 6C12.5 3.8 10.5 2 8 2Z" />
							<line x1="6" y1="12.5" x2="10" y2="12.5" />
							<line x1="6.5" y1="14" x2="9.5" y2="14" />
							<path d="M8 6V4.5" />
							<path d="M6 7L8 6L10 7" />
						{/if}
					</svg>
					{item.label}
				</a>
			{/each}
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
	.section-header {
		font-size: 10px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-dim);
		padding: 16px 12px 6px 12px;
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
	.nav-icon {
		flex-shrink: 0;
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
