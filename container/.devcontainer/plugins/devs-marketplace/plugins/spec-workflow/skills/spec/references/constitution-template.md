# Constitution Template

The Constitution captures project-level cross-cutting decisions that every feature spec inherits. Written once, evolved as the project grows. Every section should contain concrete decisions, not placeholders.

When running `/spec constitution`, the AI analyzes the codebase and fills in as much as possible, then presents to the human for review.

---

```markdown
# Project Constitution

**Project:** [name]
**Last Updated:** YYYY-MM-DD

## Tech Stack

- **Language:** [e.g., Python 3.12]
- **Framework:** [e.g., FastAPI 0.115]
- **Database:** [e.g., PostgreSQL 16 via SQLAlchemy 2.0 async]
- **Key Libraries:** [e.g., Pydantic 2.x, structlog, httpx, alembic]
- **Package Manager:** [e.g., uv, npm, bun]

## Architecture

- **File Structure:**
  ```
  src/
    api/          # Route handlers
    models/       # SQLAlchemy models
    schemas/      # Pydantic request/response schemas
    services/     # Business logic
    repos/        # Data access (repository pattern)
    jobs/         # Background jobs
  tests/
    unit/         # Unit tests mirroring src/ structure
    integration/  # API-level tests
  ```
- **Module Boundaries:** [what can import what]
- **Data Access Pattern:** [repository pattern, direct ORM, raw SQL]

## API Conventions

- **Format:** [REST, GraphQL, RPC]
- **Error Responses:** [RFC 7807, custom format, include example]
- **Pagination:** [cursor-based, offset-based, keyset]
- **Versioning:** [URL prefix /v1, header, none]
- **ID Format:** [prefixed UUIDs like usr_, tsk_, sequential integers]
- **Timestamps:** [ISO 8601, UTC always]

## Auth & Security

- **Mechanism:** [JWT with refresh tokens, session cookies, OAuth2]
- **Token Lifecycle:** [access expiry, refresh expiry, rotation policy]
- **Password Hashing:** [bcrypt cost 12, argon2id]
- **Input Validation:** [where and how — Pydantic at handler boundary, etc.]
- **CORS:** [policy per environment]

## Testing

- **Framework:** [pytest + httpx, vitest, jest]
- **Directory:** [tests/ mirroring src/, flat, colocated]
- **Naming:** [test_{module}_{scenario}_{expected}, describe/it blocks]
- **Coverage Target:** [80% ideal, 60% minimum]
- **Test Database:** [SQLite in-memory for unit, PostgreSQL for integration]
- **Fixtures:** [shared in conftest.py, factory pattern]

## Code Patterns

- **Error Handling:** [domain exceptions in services, handler catches and converts]
- **Logging:** [structlog JSON, log at service boundaries]
- **Configuration:** [env vars via Pydantic Settings, no hardcoded values]
- **Naming:** [snake_case functions, PascalCase classes, UPPER_SNAKE constants]
- **Async:** [all I/O async, asyncio]

## Boundaries

### Always
- [Run full test suite before declaring work complete]
- [Include type hints on all function signatures]
- [Handle errors at appropriate boundaries]
- [Use existing utilities before creating new ones]

### Never
- [Add new dependencies without justification in the spec]
- [Hardcode secrets, URLs, or environment-specific values]
- [Modify database schema without a migration file]
- [Skip writing tests for new code paths]
- [Use type: ignore or noqa without explaining why]
```

---

## Usage Notes

- **Sizing:** As detailed as needed. 200-400 lines is normal for a mature project. Context is free in a 1M token window.
- **Evolution:** When `/build` produces `[ai-decided]` items that reveal gaps (e.g., "AI chose cursor pagination because Constitution doesn't specify"), promote those to Constitution entries.
- **Override:** Feature specs can override Constitution decisions by noting it explicitly in their Decisions table: "D-N: Override Constitution — using X instead of Y because [reason]"
- **Not a style guide:** The Constitution captures architectural decisions, not coding style preferences. Use linters and formatters for style.
