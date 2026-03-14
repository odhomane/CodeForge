---
group: D
name: Delivery Logs & Debugging
criteria: [AC-12, AC-13, AC-14]
status: pending
owner: null
depends_on:
  - b-delivery
files_owned:
  - src/jobs/webhook_log_retention_job.py
---

Note: Group D adds delivery log query methods to `src/repos/webhook_repo.py` (owned by Group A): `list_deliveries()`, `get_delivery()`, `delete_old_deliveries()`. Also adds delivery log + replay endpoints to `src/api/webhooks.py` (owned by Group A). Coordinate with Group A on shared files.

## AC-12: Delivery Log Storage

The system shall store a delivery log for each attempt including: timestamp, HTTP status, response time, delivery ID, event type, attempt number, and response body (first 1KB).

→ Given any delivery attempt (success or failure),
  when GET /webhooks/:id/deliveries,
  then paginated list with full attempt details

Example:
→ `GET /api/v1/projects/proj_abc/webhooks/whk_a1b2c3d4/deliveries?limit=20`
→ `200 OK`
  ```json
  {
    "deliveries": [
      {
        "id": "wdl_log1",
        "delivery_id": "del_x1y2z3",
        "event_type": "task.created",
        "attempt_number": 1,
        "status": "failed",
        "http_status": 500,
        "response_time_ms": 342,
        "response_body": "{\"error\": \"internal server error\"}",
        "created_at": "2026-03-13T12:05:01Z"
      },
      {
        "id": "wdl_log2",
        "delivery_id": "del_x1y2z3",
        "event_type": "task.created",
        "attempt_number": 2,
        "status": "success",
        "http_status": 200,
        "response_time_ms": 89,
        "response_body": "OK",
        "created_at": "2026-03-13T12:06:01Z"
      }
    ],
    "next_cursor": "wdl_log0",
    "has_more": true
  }
  ```

## AC-13: Delivery Replay

When a project owner requests a delivery replay, the system shall re-send the original payload with a new delivery ID and fresh signature.

→ Given past delivery del_x1y2z3,
  when POST /webhooks/:id/deliveries/del_x1y2z3/replay,
  then new delivery with original event data, new del_ ID, fresh signature

Example:
→ `POST /api/v1/projects/proj_abc/webhooks/whk_a1b2c3d4/deliveries/del_x1y2z3/replay`
→ `202 Accepted`
  ```json
  {
    "delivery_id": "del_replay_n3w",
    "original_delivery_id": "del_x1y2z3",
    "status": "pending",
    "message": "Replay enqueued. Original payload re-sent with new delivery ID."
  }
  ```

## AC-14: 30-Day Log Retention

The system shall retain delivery logs for 30 days, then delete them.

→ Given delivery log entries older than 30 days,
  when the daily retention job runs,
  then entries with created_at < (now - 30 days) are deleted

Testing note: No API example — background job. Verify:
- Create log with created_at = 31 days ago → deleted after job
- Create log with created_at = 29 days ago → NOT deleted

---

## AI Decisions

| # | Decision | Choice | Reasoning |
|---|----------|--------|-----------|
