---
group: B
name: Delivery & Signing
criteria: [AC-4, AC-5, AC-6, AC-7, AC-15]
status: pending
owner: null
depends_on:
  - a-registration
files_owned:
  - src/services/webhook_delivery_service.py
  - src/services/event_bus.py
  - src/jobs/webhook_delivery_job.py
  - tests/unit/services/test_webhook_delivery_service.py
  - tests/unit/services/test_event_bus.py
---

## AC-4: Signed Payload Delivery

When an event occurs that matches an active endpoint's subscription, the system shall deliver a signed payload within 30 seconds of the event.

→ Given active endpoint subscribed to task.created,
  when a task is created in the project,
  then POST to endpoint URL within 30s with signed envelope payload

Example (what the consumer's server receives):
```
POST https://partner.example.com/taskforge-hook
Content-Type: application/json
X-TaskForge-Signature: sha256=a1b2c3d4e5f6...
X-TaskForge-Delivery-ID: del_x1y2z3
X-TaskForge-Event: task.created
```
```json
{
  "event": "task.created",
  "timestamp": "2026-03-13T12:05:00Z",
  "delivery_id": "del_x1y2z3",
  "project_id": "proj_abc",
  "data": {
    "id": "tsk_789",
    "title": "Implement webhook system",
    "status": "in_progress",
    "assignee_id": "usr_456",
    "created_at": "2026-03-13T12:05:00Z"
  }
}
```

Consumer responds `200 OK` → delivery marked successful.

## AC-5: HMAC-SHA256 Signature

The system shall sign every delivery with HMAC-SHA256 using the endpoint's current secret, included in the X-TaskForge-Signature header as `sha256=<hex>`.

→ Given delivery payload body as bytes,
  when signature computed,
  then header value = "sha256=" + hex(hmac_sha256(secret_bytes, body_bytes))

Example (consumer verification pseudocode):
```python
import hmac, hashlib
expected = hmac.new(secret.encode(), request.body, hashlib.sha256).hexdigest()
received = request.headers["X-TaskForge-Signature"].removeprefix("sha256=")
is_valid = hmac.compare_digest(expected, received)
```

## AC-6: Idempotency Key

The system shall include an idempotency key (X-TaskForge-Delivery-ID) in every delivery. Retries of the same event to the same endpoint shall use the same delivery ID.

→ Given a failed delivery del_x1y2z3 being retried,
  when the retry is sent,
  then X-TaskForge-Delivery-ID = "del_x1y2z3" (unchanged)

Example:
```
Attempt 1: X-TaskForge-Delivery-ID: del_x1y2z3
Attempt 2: X-TaskForge-Delivery-ID: del_x1y2z3  (same)
Attempt 3: X-TaskForge-Delivery-ID: del_x1y2z3  (same)
```

## AC-7: Dual-Signature During Rotation

While an endpoint has two active secrets (rotation window), the system shall sign with the newer secret and include both signatures comma-separated.

→ Given endpoint with secret_current (v2) and secret_previous (v1),
  when delivery sent,
  then X-TaskForge-Signature = "sha256=<v2_sig>,sha256=<v1_sig>"

Example:
```
X-TaskForge-Signature: sha256=abc123...,sha256=def456...
```
Consumer verifies against their known secret. If EITHER matches, accept.

## AC-15: Envelope Payload Format

Every webhook payload shall follow the envelope format with event, timestamp, delivery_id, project_id, and data fields.

→ Given any event type,
  when delivered to any endpoint,
  then payload matches the envelope schema exactly

Example (task.status_changed):
```json
{
  "event": "task.status_changed",
  "timestamp": "2026-03-13T14:30:00Z",
  "delivery_id": "del_sts_456",
  "project_id": "proj_abc",
  "data": {
    "id": "tsk_789",
    "previous_status": "in_progress",
    "new_status": "completed",
    "changed_by": "usr_456"
  }
}
```

Example (comment.created):
```json
{
  "event": "comment.created",
  "timestamp": "2026-03-13T15:00:00Z",
  "delivery_id": "del_cmt_789",
  "project_id": "proj_abc",
  "data": {
    "id": "cmt_321",
    "task_id": "tsk_789",
    "author_id": "usr_456",
    "body": "Looks good, shipping tomorrow."
  }
}
```

---

## AI Decisions

| # | Decision | Choice | Reasoning |
|---|----------|--------|-----------|
