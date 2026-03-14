---
group: A
name: Registration & Configuration
criteria: [AC-1, AC-2, AC-3]
status: pending
owner: null
depends_on: []
files_owned:
  - src/models/webhook.py
  - src/schemas/webhook.py
  - src/repos/webhook_repo.py
  - src/services/webhook_service.py
  - src/api/webhooks.py
  - alembic/versions/xxx_add_webhooks.py
  - tests/unit/services/test_webhook_service.py
  - tests/integration/test_webhooks_api.py
---

## AC-1: Webhook Endpoint Registration

When a project owner registers a webhook endpoint, the system shall validate the URL (HTTPS required, no private IPs), generate a signing secret, and return the endpoint ID and secret.

→ Given authenticated owner of project proj_abc,
  when POST /api/v1/projects/proj_abc/webhooks with valid HTTPS URL,
  then 201 with endpoint object including id and secret

Example:
→ `POST /api/v1/projects/proj_abc/webhooks`
  ```json
  {
    "url": "https://partner.example.com/taskforge-hook",
    "events": ["task.created", "task.status_changed"],
    "description": "Sync tasks to Partner CRM"
  }
  ```
→ `201 Created`
  ```json
  {
    "id": "whk_a1b2c3d4",
    "url": "https://partner.example.com/taskforge-hook",
    "events": ["task.created", "task.status_changed"],
    "description": "Sync tasks to Partner CRM",
    "secret": "whsec_dGhpcyBpcyBhIDMyLWJ5dGUgcmFuZG9tIHZhbHVl",
    "status": "active",
    "created_at": "2026-03-13T12:00:00Z"
  }
  ```

Note: The secret is ONLY returned on creation. Subsequent GET requests omit it.

## AC-2: Event Filter Configuration

When a project owner configures event filters on an endpoint, the system shall deliver only matching event types to that endpoint.

→ Given endpoint whk_a1b2c3d4 subscribed to ["task.created"],
  when a task.completed event fires for the same project,
  then no delivery attempt is made to that endpoint

Example:
→ `PATCH /api/v1/projects/proj_abc/webhooks/whk_a1b2c3d4`
  ```json
  { "events": ["task.created", "task.completed"] }
  ```
→ `200 OK`
  ```json
  {
    "id": "whk_a1b2c3d4",
    "events": ["task.created", "task.completed"],
    "status": "active"
  }
  ```

## AC-3: Private IP Rejection

If a webhook URL points to a private IP range (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 127.0.0.0/8, ::1), then the system shall reject registration with a clear error message.

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
    "detail": "192.168.1.1 is in a private range (192.168.0.0/16). Webhook URLs must resolve to public IP addresses."
  }
  ```

---

## AI Decisions

| # | Decision | Choice | Reasoning |
|---|----------|--------|-----------|
