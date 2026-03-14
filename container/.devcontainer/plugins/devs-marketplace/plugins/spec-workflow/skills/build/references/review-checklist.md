# Phase 4 Review Checklist

Use this checklist during `/build` Phase 4 (Review & Fix Loop). Walk every item. Fix issues before proceeding to Phase 5.

---

## 1. Acceptance Criteria Coverage

For each AC in every group file:

- [ ] Implementation exists (code written)
- [ ] Test exists with traceability comment (`Verifies: AC-N`)
- [ ] Test passes
- [ ] Test is derived from spec (Given/When/Then), not from implementation
- [ ] Marker upgraded from `[~]` to `[x]` after test passes

**Flag:** Any AC without a passing test cannot be marked `[x]`.

## 2. Invariant Compliance

For each invariant in `context.md`:

- [ ] Invariant holds across ALL implemented code (not just the AC that seems related)
- [ ] No code path violates the invariant under any condition
- [ ] Edge cases don't create invariant violations

**Flag:** Invariant violations are high-priority fixes.

## 3. Anti-Pattern Check

For each anti-pattern in `context.md`:

- [ ] No code matches the described anti-pattern
- [ ] No "clever" workarounds that technically avoid the anti-pattern but violate its intent

**Flag:** Anti-pattern matches indicate specification gaming.

## 4. Schema Verification

Compare implemented models/migrations against `context.md` Schema Intent:

- [ ] All tables created with correct column names and types
- [ ] Constraints match (PKs, FKs, NOT NULL, CHECK, UNIQUE)
- [ ] Indexes created as specified
- [ ] No extra columns or tables added beyond spec

## 5. Integration Correctness

Compare code against `context.md` Integration Context:

- [ ] Dependencies used with correct method signatures
- [ ] Error handling matches documented behavior (e.g., catches expected exceptions)
- [ ] No undocumented dependencies introduced

## 6. Constraint Compliance

From `context.md` Constraints:

- [ ] Files created in specified locations
- [ ] Patterns followed (referenced files used as templates)
- [ ] "Must NOT" prohibitions respected
- [ ] No files created outside the spec's file ownership

## 7. Decision Compliance

From `index.md` Decisions:

- [ ] Every "Needs Your Input" decision implemented as the user chose
- [ ] Every "Already Decided" decision implemented as specified
- [ ] Any deviations documented as AI Decisions with reasoning

## 8. Scope Check

From `index.md` Out of Scope:

- [ ] No code implements out-of-scope features
- [ ] No "helpful" additions beyond the spec
- [ ] No functionality that serves a different feature

## 9. Code Quality

- [ ] Error handling at appropriate boundaries
- [ ] No hardcoded values that should be configurable
- [ ] Functions are short and single-purpose
- [ ] Type hints on all function signatures
- [ ] No regressions in existing tests (run full suite)

## 10. AI Decision Audit

For each AI Decision recorded in group files:

- [ ] Decision was genuinely not covered by Constitution or spec
- [ ] Reasoning is clear and defensible
- [ ] A different reasonable choice wouldn't have been better
