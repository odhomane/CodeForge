# Group File Template

AC group files are the unit of work for parallel agents. Each group contains related acceptance criteria with full detail: EARS criterion text, Given/When/Then clarity, and inline examples.

---

```markdown
---
group: [A]
name: [Human-Readable Group Name]
criteria: [AC-1, AC-2, AC-3]
status: pending
owner: null
depends_on: []
files_owned:
  - [src/path/to/file.py]
  - [src/path/to/other.py]
---

## AC-1: [Short Title]

[EARS-format criterion: When/If/While/Where pattern]

→ Given [setup],
  when [trigger],
  then [expected result]

Example:
→ `[METHOD] [path]`
  ```json
  [request body]
  ```
→ `[STATUS]`
  ```json
  [response body]
  ```

[Additional notes if needed — edge cases, behavioral clarifications]

## AC-2: [Short Title]

[Next criterion with same structure...]

---

## AI Decisions

[Post-implementation only. Filled by /build when the AI encounters decisions
not covered by Constitution or spec.]

| # | Decision | Choice | Reasoning |
|---|----------|--------|-----------|
```

---

## Frontmatter Schema

| Field | Type | Required | Values |
|-------|------|----------|--------|
| `group` | string | yes | Letter identifier: A, B, C... |
| `name` | string | yes | Human-readable group name |
| `criteria` | list | yes | AC IDs in this group (e.g., `[AC-1, AC-2]`) |
| `status` | enum | yes | `pending` \| `in_progress` \| `verified` |
| `owner` | string/null | yes | Agent name during build, null when unassigned |
| `depends_on` | list | yes | Group file stems this group depends on (e.g., `[a-registration]`) |
| `files_owned` | list | yes | File paths this group exclusively owns |

## File Ownership Rules

- **One owner per file.** No two groups should list the same file in `files_owned`.
- **Read vs write:** A group may READ files owned by other groups but must NOT MODIFY them.
- **Shared file coordination:** If two groups genuinely need to modify the same file, either:
  - Split responsibilities (Group A creates the file, Group B adds methods later)
  - Note the coordination in both group files with clear method boundaries
  - Assign the file to one group and have the other depend on it via `depends_on`

## AC Writing Guidelines

Each AC should include:

1. **Title** — short, descriptive (`## AC-1: Webhook Endpoint Registration`)
2. **EARS criterion** — structured requirement text using When/If/While/Where
3. **Given/When/Then** — test-friendly format below the criterion
4. **Example** — concrete I/O showing request and response (for API features) or input/output (for logic)
5. **Notes** — edge cases or behavioral clarifications (optional)

Use `references/ears-patterns.md` for EARS format guidance.
