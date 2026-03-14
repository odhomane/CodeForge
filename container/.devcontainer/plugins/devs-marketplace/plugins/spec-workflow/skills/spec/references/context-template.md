# context.md Template

Shared AI context read by every implementing agent. Contains cross-cutting concerns for THIS feature — not project-level concerns (those live in the Constitution).

No frontmatter needed. Pure content.

---

```markdown
## Invariants

[Things that must ALWAYS be true, regardless of which AC is being implemented.
Every agent should verify their work against this list. These are defensive
assertions that catch specification gaming and cross-agent inconsistencies.]

- [invariant 1]
- [invariant 2]

## Anti-Patterns

[Explicit "do NOT" examples. Prevent the AI from satisfying literal spec
requirements while violating the design intent.]

- **Do NOT [thing]** — because [why]
- **Do NOT [thing]** — because [why]

## Integration Context

[Dependency details inline so implementing agents don't need to read other files.
Include method signatures, object shapes, and behavioral notes for every
dependency the feature interacts with.]

**[Dependency Name]** (`path/to/file`):
- `method_name(params) -> return_type` — [behavioral notes]
- Object shape: [key fields and their types]
- [Important behavioral note, e.g., "raises XError on failure"]

## Schema Intent

[Data model design — specific enough to build models and migrations without
guessing, but NOT raw DDL. Column names, types, constraints, indexes.]

**[table_name]:**

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | text | PK | Prefixed UUID, e.g. `whk_` + UUID4 |
| [col] | [type] | [constraints] | [notes] |

Indexes: [list]
Unique constraints: [list]

## Constraints

[Architectural boundaries, file locations, patterns, and prohibitions.]

**Files (by area):**

*[Area 1]:*
- `src/path/to/file.py` — [purpose]

*[Area 2]:*
- `src/path/to/file.py` — [purpose]

**Patterns:**
- Follow `src/path/to/reference.py` for [pattern type]

**Must NOT:**
- [prohibition 1]
- [prohibition 2]

**Depends on:**
- [spec, feature, or system this depends on]
```

---

## Section Guidelines

| Section | Purpose | When to Include |
|---------|---------|----------------|
| Invariants | Global assertions all agents must respect | Always — even simple features have invariants |
| Anti-Patterns | Prevent specification gaming | When there are non-obvious "wrong" implementations |
| Integration Context | Inline dependency details | When agents interact with existing code |
| Schema Intent | Data model design | When the feature creates or modifies tables |
| Constraints | File paths, patterns, prohibitions | Always — every feature has file locations |
