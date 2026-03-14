# EARS Patterns for Acceptance Criteria

EARS (Easy Approach to Requirements Syntax) provides five structured patterns for writing unambiguous requirements. Use these in AC criterion text within group files.

---

## The Five EARS Patterns

### 1. Ubiquitous (always true)

**Pattern:** The system shall [action].

```
The system shall log all authentication events with timestamp and user ID.
The system shall encrypt data at rest using AES-256.
```

**Use for:** System-wide behaviors, security invariants, logging requirements. Often better placed in Constitution or Invariants than individual ACs.

### 2. Event-Driven (when something happens)

**Pattern:** When [event], the system shall [action].

```
When a user submits valid login credentials, the system shall return a JWT token.
When a webhook endpoint returns a non-2xx status, the system shall schedule a retry.
```

**Use for:** Most acceptance criteria. Triggered behaviors with clear cause and effect.

### 3. State-Driven (while a condition holds)

**Pattern:** While [condition], the system shall [action].

```
While the endpoint has two active secrets, the system shall include both signatures.
While the user session is active, the system shall refresh the token automatically.
```

**Use for:** Behaviors that depend on ongoing state, not a one-time trigger.

### 4. Unwanted Behavior (if bad thing, then protection)

**Pattern:** If [unwanted condition], then the system shall [response].

```
If a webhook URL points to a private IP range, then the system shall reject registration.
If the request body exceeds 10MB, then the system shall return 413 Payload Too Large.
```

**Use for:** Error handling, validation, security boundaries, edge cases.

### 5. Optional Feature (where configured)

**Pattern:** Where [feature is configured], the system shall [action].

```
Where event filtering is enabled on an endpoint, the system shall deliver only matching events.
Where rate limiting is configured, the system shall enforce the configured threshold.
```

**Use for:** Configurable behaviors, feature flags, per-tenant settings.

---

## Combining EARS with Given/When/Then

Each AC should have:
1. **EARS criterion** — the requirement (what the system SHALL do)
2. **Given/When/Then** — the test scenario (how to verify it)
3. **Example** — concrete I/O (what it looks like in practice)

```markdown
## AC-3: Private IP Rejection

If a webhook URL points to a private IP range (10.0.0.0/8, 172.16.0.0/12,
192.168.0.0/16, 127.0.0.0/8, ::1), then the system shall reject registration
with a clear error message.

→ Given URL "https://192.168.1.1/hook",
  when POST /api/v1/projects/proj_abc/webhooks,
  then 422 with RFC 7807 error

Example:
→ `POST /api/v1/projects/proj_abc/webhooks`
  ```json
  { "url": "https://192.168.1.1/hook", "events": ["task.created"] }
  ```
→ `422 Unprocessable Entity`
  ```json
  {
    "type": "taskforge/invalid-webhook-url",
    "title": "URL must not point to a private network",
    "status": 422,
    "detail": "192.168.1.1 is in a private range (192.168.0.0/16)."
  }
  ```
```

---

## Compound Patterns

Combine patterns when needed:

```
When [event] AND while [condition], the system shall [action].
When [event], if [guard], then the system shall [action].
```

Example:
```
When a delivery attempt fails AND while the retry count is below 5,
the system shall schedule the next retry with exponential backoff.
```

---

## Common Mistakes

- **Vague verbs:** "handle", "manage", "process" — replace with specific actions: "return", "store", "enqueue", "reject"
- **Missing actor:** "The endpoint should be validated" — by whom? "The system shall validate the endpoint URL"
- **Untestable criteria:** "The system shall be fast" — replace with measurable: "The system shall respond within 200ms at the 95th percentile"
- **Implementation details:** "The system shall use a Redis sorted set" — that's a decision, not a requirement. Put it in the Decisions table.
