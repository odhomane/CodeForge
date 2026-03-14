# spec-workflow

Claude Code plugin for specification-driven development. Manages the full spec lifecycle with directory-based "spec packages" designed for AI-first implementation with 1M+ token context windows and team-based parallel execution.

## What It Does

Two capabilities:

1. **Spec lifecycle skills** — 3 commands covering creation, implementation, and health monitoring. Specs are directory packages with human-facing and AI-facing content separated by audience.

2. **Spec reminder hook** — A `Stop` hook that fires when source code was modified but no `.specs/` files were updated.

### Commands

| Command | Purpose |
|---------|---------|
| `/spec <feature>` | Create, refine, and approve a spec package |
| `/spec constitution` | Create or update the project Constitution |
| `/build <feature>` | Implement an approved spec — plan, build, review, close |
| `/specs` | Dashboard: spec health across all specs |

### Spec Lifecycle

```
/spec <feature>     Create spec package, refine decisions with user, approve
     |
/build <feature>    Full implementation lifecycle:
     |                Phase 1: Discovery & gate check
     |                Phase 2: Planning & task decomposition
     |                Phase 3: Build ([ ] -> [~]) with spec-first testing
     |                Phase 4: Self-healing review loop ([~] -> [x])
     |                Phase 5: Closure & summary report
     |
/specs              Health dashboard across all specs
```

### Spec Package Structure

Every spec is a directory with separated human and AI content:

```
.specs/{domain}/{feature}/
  index.md      # Human reviews this (~50-80 lines)
  context.md    # AI reads this (invariants, schema, constraints)
  groups/
    a-*.md      # AC groups with frontmatter for parallel agents
    b-*.md
```

### Key Design Principles

- **Human reviews only decisions + scope.** `index.md` is ~50-80 lines. Everything else is for the AI.
- **AI makes obvious decisions.** Only genuine trade-offs are presented to the human.
- **Spec-level approval.** No per-requirement `[assumed]`/`[user-approved]` tagging. The spec is either `draft` or `approved`.
- **Directory-based always.** No single-file format. Consistent structure regardless of spec size.
- **Constitution captures cross-cutting decisions.** Project-level patterns, conventions, and boundaries live in `.specs/CONSTITUTION.md`.
- **Group frontmatter drives parallelism.** `depends_on` and `files_owned` enable automatic task decomposition for team builds.

### Acceptance Criteria Markers

| Marker | Meaning |
|--------|---------|
| `[ ]` | Not started |
| `[~]` | Implemented, not yet verified |
| `[x]` | Verified — tests pass, behavior confirmed |

### `[ai-decided]` Workflow

During `/build`, when the AI encounters a decision not covered by the spec or Constitution:
1. Makes its best choice (Constitution → codebase patterns → best practice)
2. Records in the group file's AI Decisions table
3. Continues building (does NOT stop)
4. Summary Report presents all AI decisions for user review
5. User approves, overrides, or promotes to Constitution

## How It Works

### Hook Lifecycle

```
Claude stops responding (Stop event)
  |
  +-> spec-reminder.py
        |
        +-> .specs/ exists? No -> silent exit
        +-> Code modified?  No -> silent exit
        +-> Specs modified? Yes -> silent exit (already updated)
        +-> Inject advisory: "Run /build or /spec"
```

### Monitored Source Directories

`src/`, `lib/`, `app/`, `pkg/`, `internal/`, `cmd/`, `tests/`, `api/`, `frontend/`, `backend/`, `packages/`, `services/`, `components/`, `pages/`, `routes/`

## Installation

### CodeForge DevContainer

Pre-installed and activated automatically — no setup needed.

### From GitHub

1. Clone the [CodeForge](https://github.com/AnExiledDev/CodeForge) repository
2. Enable in `.claude/settings.json`:
   ```json
   {
     "enabledPlugins": {
       "spec-workflow@<clone-path>/.devcontainer/plugins/devs-marketplace": true
     }
   }
   ```

## Plugin Structure

```
spec-workflow/
+-- .claude-plugin/
|   +-- plugin.json
+-- hooks/
|   +-- hooks.json
+-- scripts/
|   +-- spec-reminder.py           # Stop hook: spec update advisory
+-- skills/
|   +-- spec/                      # /spec — create, refine, approve
|   |   +-- SKILL.md
|   |   +-- references/
|   |       +-- index-template.md
|   |       +-- context-template.md
|   |       +-- group-template.md
|   |       +-- constitution-template.md
|   |       +-- backlog-template.md
|   |       +-- ears-patterns.md
|   |       +-- example-webhook/   # Complete example spec package
|   +-- build/                     # /build — implement, review, close
|   |   +-- SKILL.md
|   |   +-- references/
|   |       +-- review-checklist.md
|   |       +-- summary-report-template.md
|   +-- specs/                     # /specs — health dashboard
|       +-- SKILL.md
+-- README.md
```

## Requirements

- Python 3.11+
- Git (for detecting file changes)
- Claude Code with plugin hook support
