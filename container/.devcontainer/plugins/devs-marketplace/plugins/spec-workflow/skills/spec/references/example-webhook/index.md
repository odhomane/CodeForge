---
feature: Webhook Delivery System
domain: integrations
status: planned
approval: approved
size: L
last_updated: 2026-03-13
groups:
  - a-registration
  - b-delivery
  - c-retry
  - d-logs
---

# Webhook Delivery System

## Intent

Third-party integrations need real-time notifications when events occur in TaskForge (task created, status changed, comment added). Currently integrations must poll the API, which wastes resources and introduces latency. Webhooks are the #1 partner request and a blocker for the Zapier partnership.

## Decisions

### Needs Your Input

| # | Question | Options | AI Recommendation |
|---|----------|---------|-------------------|
| D-1 | Delivery guarantee | At-least-once with idempotency keys / Exactly-once / At-most-once | At-least-once (industry standard — Stripe, GitHub, Shopify) |
| D-2 | Retry policy | Exponential backoff (1m,5m,30m,2h,12h) / Fixed 5min interval / No retries | Exponential backoff over ~15hr |
| D-3 | Queue backend | Existing PG job queue / Add Redis+Bull | PG job queue (no new infra, handles our scale) |

### Already Decided

| # | Decision | Choice | Why |
|---|----------|--------|-----|
| D-4 | Signature mechanism | HMAC-SHA256 per endpoint | Industry standard, no real alternative |
| D-5 | Payload format | JSON envelope (event, timestamp, delivery_id, project_id, data) | Only sane choice for typed event routing |
| D-6 | Secret format | `whsec_` + 32-byte base64url | Follows project's prefix convention |
| D-7 | Delivery timeout | 10 seconds | Fast enough for queue, generous for consumers |
| D-8 | Event filtering | Per-endpoint subscription list | Partners care about 2-3 event types, not firehose |
| D-9 | Secret rotation | Dual-secret window with both signatures | Zero-downtime (Stripe pattern) |
| D-10 | Delivery log retention | 30 days | Enough for debugging, within storage budget |
| D-11 | Failure threshold | Disable after 14 days of 100% failure | Long enough for outages, short enough to stop waste |

## Acceptance Criteria

| AC | Group | Summary |
|----|-------|---------|
| AC-1 | Registration | Endpoint registration with URL validation and secret generation |
| AC-2 | Registration | Event filter configuration per endpoint |
| AC-3 | Registration | Private IP rejection (SSRF prevention) |
| AC-4 | Delivery | Signed payload delivery within 30s of event |
| AC-5 | Delivery | HMAC-SHA256 signature in X-TaskForge-Signature header |
| AC-6 | Delivery | Idempotency key (delivery ID) stable across retries |
| AC-7 | Delivery | Dual-signature during secret rotation window |
| AC-8 | Retry | Exponential backoff on non-2xx / timeout |
| AC-9 | Retry | Mark failed after exhausting 5 retries, store last error |
| AC-10 | Retry | Auto-disable endpoint after 14-day failure streak |
| AC-11 | Retry | Ping test on re-enable before resuming delivery |
| AC-12 | Logs | Delivery log with full attempt details |
| AC-13 | Logs | Delivery replay with new ID and fresh signature |
| AC-14 | Logs | 30-day log retention cleanup |
| AC-15 | Delivery | Envelope payload format for all event types |

## Out of Scope

- Webhook management UI (separate spec)
- GraphQL subscriptions (different pattern, backlog)
- Payload transformation per endpoint (v2 feature)
- Rate limiting deliveries (future if abuse occurs)
- Custom HTTP headers per endpoint (not requested)

## Resolved Questions

1. **Delivery guarantee** — At-least-once with idempotency keys (approved, 2026-03-13)
   Considered: exactly-once (requires client tracking), at-most-once (data loss risk).

2. **Queue backend** — PostgreSQL job queue (approved, 2026-03-13)
   Considered: Redis+Bull (new dependency), RabbitMQ (overkill), SQS (vendor lock-in).

3. **SSRF prevention** — URL validation at registration time (approved, 2026-03-13)
   Considered: runtime DNS check (race condition), egress proxy (infra complexity).

4. **Secret rotation** — Dual-secret window (approved, 2026-03-13)
   Considered: single secret with downtime, versioned signatures (consumer complexity).
