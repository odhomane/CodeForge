# index.md Template

Standard template for the human-facing entry point of a spec package.

---

```markdown
---
feature: [Feature Name]
domain: [domain-folder-name]
status: planned
approval: draft
size: S | M | L
last_updated: YYYY-MM-DD
groups:
  - a-[group-name]
  - b-[group-name]
---

# [Feature Name]

## Intent

[2-3 sentences: What problem does this solve? Who has this problem? Why solve it now?]

## Decisions

### Needs Your Input

[Genuine trade-offs where the human's judgment matters. Only decisions with multiple viable options.]

| # | Question | Options | AI Recommendation |
|---|----------|---------|-------------------|
| D-1 | [what needs deciding] | [option A] / [option B] / [option C] | [recommended + why] |

### Already Decided

[Decisions the AI made because only one sane option exists, the Constitution specifies it, or the codebase establishes a clear pattern. Human can override any of these.]

| # | Decision | Choice | Why |
|---|----------|--------|-----|
| D-N | [what was decided] | [chosen option] | [rationale] |

## Acceptance Criteria

[One-liner per AC. Enough for the human to check completeness, not detail.]

| AC | Group | Summary |
|----|-------|---------|
| AC-1 | [group name] | [one-line description of what's tested] |

## Out of Scope

- [Non-goal 1 — prevents scope creep]
- [Non-goal 2]

## Resolved Questions

[Decision trail from refinement. Populated during /spec refinement rounds.]

1. **[Decision topic]** — [Chosen option] (approved, YYYY-MM-DD)
   Considered: [alternatives]. Rationale: [why].
```

---

## Frontmatter Schema

| Field | Type | Required | Values |
|-------|------|----------|--------|
| `feature` | string | yes | Human-readable feature name |
| `domain` | string | yes | Domain folder name (kebab-case) |
| `status` | enum | yes | `planned` \| `partial` \| `implemented` |
| `approval` | enum | yes | `draft` \| `approved` |
| `size` | enum | yes | `S` (hours) \| `M` (1-2 days) \| `L` (3-5 days) |
| `last_updated` | date | yes | YYYY-MM-DD format |
| `groups` | list | yes | Ordered list of group file stems (without .md) |

## Section Guidelines

| Section | Human Reviews? | Guidelines |
|---------|---------------|------------|
| Intent | Yes | 2-3 sentences. Problem + audience + urgency. |
| Decisions — Needs Input | Yes (primary focus) | Only genuine trade-offs. 2-4 options per decision. |
| Decisions — Already Decided | Glances | AI explains choices. Human overrides if needed. |
| AC Summary | Yes (completeness check) | One-liners only. No examples, no Given/When/Then. |
| Out of Scope | Yes | Explicit non-goals. Prevents scope creep during build. |
| Resolved Questions | No (reference) | Auto-populated from refinement session. |
