## Invariants

- `delivery_id` is globally unique — UUID4, prefixed `del_`. Generated once per event-endpoint pair, reused across retries.
- No HTTP requests to private IP ranges, ever — defense in depth even if URL validation was bypassed.
- All webhook endpoint URLs are HTTPS — no HTTP, no exceptions, no fallback.
- Signing secrets (`whsec_*`) are NEVER logged, NEVER in API error responses, NEVER in delivery logs, NEVER returned after initial creation.
- Event `timestamp` = time the event occurred in the source system, NOT delivery/retry time.
- Response bodies in delivery logs are truncated to 1,024 bytes. Never store more.
- The `ping` event type is reserved for system use (AC-11) and cannot be subscribed to.
- All IDs use prefixed UUIDs per Constitution: `whk_` (endpoints), `del_` (deliveries), `wdl_` (log entries).
- Endpoints in `disabled` status receive zero deliveries. Check before enqueue, not after.

## Anti-Patterns

- **Do NOT retry on 4xx client errors** — 4xx means consumer rejected it. Only retry on 5xx and timeouts.
- **Do NOT block event producers on delivery** — task creation completes immediately. Delivery is async via job queue.
- **Do NOT store signing secrets in delivery logs** — log delivery_id, status, timing — never secrets or outbound headers.
- **Do NOT use sequential integer IDs** — prefixed UUIDs per Constitution.
- **Do NOT send deliveries to disabled endpoints** — check status BEFORE enqueuing.
- **Do NOT deliver events the endpoint didn't subscribe to** — filter BEFORE enqueuing.
- **Do NOT include signing secret in any API response except initial creation (AC-1).**
- **Do NOT implement delivery synchronously in API handlers** — always via job queue.
- **Do NOT use `requests` library** — use `httpx` (async) per Constitution.

## Integration Context

**Auth Middleware** (`src/middleware/auth.py`):
- Extracts JWT from `Authorization: Bearer <token>` header
- Sets `request.state.user` with: `id: str`, `email: str`, `projects: list[ProjectRole]`
- `ProjectRole`: `{"project_id": "proj_abc", "role": "owner"}`
- Role check for webhooks: `role == "owner"` for the target project
- Returns 401 (no token), 403 (wrong role)

**Email Service** (`src/services/email.py`):
- `await email_service.send(to: str, subject: str, body: str) -> str`
- Returns email delivery ID. Handles retries internally.
- Raises `EmailDeliveryError` on permanent failure. Plain text only.

**Job Runner** (`src/jobs/base.py`):
- Subclass `BaseJob`, implement `async def execute(self, payload: dict) -> None`
- Enqueue: `await job_queue.enqueue(job_name, payload, run_at=None)`
- `run_at` supports future scheduling (use for retry backoff delays)
- Failed jobs logged but NOT auto-retried by runner. Retry logic is explicit.

**Event System** (`src/services/event_bus.py` — NEW, part of this feature):
- `event_bus.emit(event_type: str, project_id: str, data: dict)`
- `event_bus.subscribe("*", handler)` or `event_bus.subscribe("task.created", handler)`
- Synchronous in-process dispatch. Subscribers must be fast (just enqueue a job).

## Schema Intent

**webhook_endpoints:**

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | text | PK | `whk_` + UUID4 |
| project_id | text | FK → projects.id, NOT NULL | |
| url | text | NOT NULL | Validated: HTTPS, no private IPs |
| description | text | nullable | Human-readable label |
| events | jsonb | NOT NULL | Array of event type strings |
| secret_current | text | NOT NULL | `whsec_` + 32-byte base64url |
| secret_previous | text | nullable | During rotation window |
| status | text | NOT NULL, CHECK IN ('active','disabled') | Default: 'active' |
| disabled_at | timestamptz | nullable | Set by health check |
| failure_streak_start | timestamptz | nullable | Reset on success |
| created_at | timestamptz | NOT NULL, default now() | |
| updated_at | timestamptz | NOT NULL, default now() | |

Indexes: `(project_id)`, `(project_id, status)`

**webhook_deliveries:**

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | text | PK | `wdl_` + UUID4 |
| endpoint_id | text | FK → webhook_endpoints.id, NOT NULL | |
| delivery_id | text | NOT NULL | `del_` + UUID4, same across retries |
| event_type | text | NOT NULL | |
| attempt_number | integer | NOT NULL | 1-based, max 6 |
| status | text | NOT NULL, CHECK IN ('pending','success','failed') | |
| http_status | integer | nullable | Null if timeout/connection error |
| response_body | text | nullable | Truncated to 1024 chars |
| response_time_ms | integer | nullable | |
| error_message | text | nullable | |
| payload_snapshot | jsonb | NOT NULL | Full envelope for replay |
| created_at | timestamptz | NOT NULL, default now() | |

Indexes: `(endpoint_id, created_at DESC)`, `(delivery_id)`, `(created_at)`
Unique constraint: `(delivery_id, attempt_number)`

## Constraints

**Files (by area):**

*Models & Schemas:*
- `src/models/webhook.py` — SQLAlchemy: WebhookEndpoint, WebhookDelivery
- `src/schemas/webhook.py` — Pydantic schemas for all request/response types

*Data Access:*
- `src/repos/webhook_repo.py` — WebhookRepo: endpoint CRUD, delivery log queries, retention

*Business Logic:*
- `src/services/webhook_service.py` — Registration, URL validation, secret management
- `src/services/webhook_delivery_service.py` — Delivery, signing, retry, failure tracking
- `src/services/event_bus.py` — NEW: pub/sub event system

*API Layer:*
- `src/api/webhooks.py` — All webhook endpoints

*Background Jobs:*
- `src/jobs/webhook_delivery_job.py` — Async delivery worker
- `src/jobs/webhook_health_check_job.py` — Daily 14-day failure check
- `src/jobs/webhook_log_retention_job.py` — Daily log cleanup

*Database:*
- `alembic/versions/xxx_add_webhooks.py` — Migration

**Patterns:**
- Service class: follow `src/services/project_service.py`
- Job class: follow `src/jobs/base.py` (BaseJob subclass)
- Repository: follow `src/repos/project_repo.py`
- URL validation: `ipaddress` stdlib for private range checks

**Must NOT:**
- Add new infrastructure dependencies (no Redis, RabbitMQ, Celery)
- Store response bodies > 1KB
- Allow delivery to non-HTTPS URLs or private IPs
- Expose signing secrets after initial creation
- Block API handlers on webhook delivery

**Depends on:**
- Auth middleware (`src/middleware/auth.py`) — existing
- Email service (`src/services/email.py`) — existing
- Job runner (`src/jobs/base.py`) — existing
- Projects model (`src/models/project.py`) — FK target
