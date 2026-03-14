---
group: C
name: Retry & Failure Handling
criteria: [AC-8, AC-9, AC-10, AC-11]
status: pending
owner: null
depends_on:
  - b-delivery
files_owned:
  - src/jobs/webhook_health_check_job.py
---

Note: Group C adds retry methods to `src/services/webhook_delivery_service.py` (owned by Group B). Coordinate: Group B implements `deliver()`, `sign_payload()`, `build_envelope()`. Group C adds `schedule_retry()`, `record_failure()`, `check_failure_streak()`, `handle_re_enable()`.

## AC-8: Exponential Backoff Retry

If an endpoint returns a non-2xx status or the request times out (>10s), then the system shall retry with exponential backoff: 1min, 5min, 30min, 2hr, 12hr.

→ Given endpoint returns 500 on first attempt at T,
  when retry schedule executes,
  then attempts at T+1m, T+6m, T+36m, T+2h36m, T+14h36m

Example (delivery log progression):
```
Attempt 1: T+0s      → 500 Internal Server Error    (42ms)
Attempt 2: T+1m      → 503 Service Unavailable       (108ms)
Attempt 3: T+6m      → timeout                       (10,001ms)
Attempt 4: T+36m     → 200 OK ✓                      (89ms)
```

## AC-9: Exhausted Retries

If all 5 retries fail for a delivery, the system shall mark it as "failed" and store the last error response (status code + first 1KB of body).

→ Given 6 total attempts (initial + 5 retries) all fail for del_x1y2z3,
  when last retry fails,
  then delivery status = "failed", error details stored

Example (delivery record after exhausting retries):
```json
{
  "delivery_id": "del_x1y2z3",
  "status": "failed",
  "attempts": 6,
  "last_http_status": 503,
  "last_response_body": "Service Temporarily Unavailable...",
  "error_message": "All 6 attempts failed. Last: timeout after 10001ms"
}
```

## AC-10: Auto-Disable After 14-Day Failure

If an endpoint has failed every delivery for 14 consecutive days, the system shall disable the endpoint and send a notification email to the project owner.

→ Given endpoint whk_a1b2c3d4 with failure_streak_start 14+ days ago
  and zero successful deliveries in that window,
  when the daily health check job runs,
  then endpoint status = "disabled", disabled_at set, email sent

Example (email):
```
Subject: Webhook endpoint disabled — partner.example.com

Your webhook endpoint "Sync tasks to Partner CRM" has been automatically
disabled after 14 consecutive days of delivery failures.

Endpoint: https://partner.example.com/taskforge-hook
Last error: 503 Service Unavailable
Failed deliveries in last 14 days: 47

To re-enable: PATCH /api/v1/projects/proj_abc/webhooks/whk_a1b2c3d4
{ "status": "active" }
```

## AC-11: Ping Test on Re-Enable

When a disabled endpoint is re-enabled by the owner, the system shall send a test ping event before resuming normal delivery.

→ Given disabled endpoint whk_a1b2c3d4,
  when owner PATCH /webhooks/whk_a1b2c3d4 { "status": "active" },
  then system sends "ping" event, waits for 2xx, then resumes delivery

Example (success):
→ System sends ping:
  ```json
  {
    "event": "ping",
    "timestamp": "2026-03-27T09:00:00Z",
    "delivery_id": "del_ping_abc",
    "project_id": "proj_abc",
    "data": { "message": "Webhook re-enabled. This is a test delivery." }
  }
  ```
→ Ping gets 200 → endpoint re-enabled, delivery resumes

Example (failure):
→ Ping gets 503 → endpoint stays disabled:
  ```json
  {
    "type": "taskforge/webhook-ping-failed",
    "title": "Endpoint did not respond to test ping",
    "status": 409,
    "detail": "Sent test ping but received 503. Fix the endpoint and try again."
  }
  ```

---

## AI Decisions

| # | Decision | Choice | Reasoning |
|---|----------|--------|-----------|
