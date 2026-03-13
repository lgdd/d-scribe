# Failure Scenarios

Every demo project must include deterministic failure scenarios that a demoer can trigger on demand during a live presentation. Failures are activated by **magic values** — specific business inputs (entity IDs, parameter values, user emails, quantities) that look like normal data but deterministically cause a named failure every time.

## Trigger Convention

### Principles

1. **Business inputs, not debug plumbing** — triggers use normal-looking request fields (entity IDs, config values, emails), never debug headers (`X-Force-Error`) or query flags (`?fail=true`).
2. **Deterministic** — same input produces the same failure, every time, with no randomness.
3. **Human-memorable** — the demoer can recall the trigger without checking notes. Magic values use descriptive names that hint at the failure.
4. **Discoverable from the UI** — when a frontend exists, magic entities appear in the UI alongside normal items so the demoer can trigger failures by clicking or typing, not by crafting curl commands.
5. **Traffic-generator compatible** — the Locust traffic generator uses the same magic values in its scenario tasks, producing a steady stream of recognizable failures in the background.
6. **Domain-adaptive** — the trigger mechanism is domain-agnostic. The scaffold skill maps magic values to whatever business domain the demo uses (e-commerce, logistics, fintech, DevOps, etc.).

### Naming Patterns

Magic values follow a `<prefix>-fail-<failure>` pattern for entity IDs, `UPPERCASE_FAILURE` for parameter values, and `<failure>@demo.test` for user identities. The prefix adapts to the demo's domain:

| Trigger Type     | Pattern                   | E-commerce            | Logistics              | Fintech                | SaaS / DevOps           |
| ---------------- | ------------------------- | --------------------- | ---------------------- | ---------------------- | ----------------------- |
| Entity ID        | `<prefix>-fail-<failure>` | `sku-fail-500`        | `shipment-fail-500`    | `txn-fail-500`         | `job-fail-500`          |
| Parameter value  | `UPPERCASE_FAILURE`       | `TIMEOUT_30S`         | `TIMEOUT_30S`          | `TIMEOUT_30S`          | `TIMEOUT_30S`           |
| User email       | `<failure>@demo.test`     | `latency@demo.test`   | `latency@demo.test`    | `latency@demo.test`    | `latency@demo.test`     |
| Quantity / count | Absurd numeric value      | `9999` (out of stock) | `9999` (over capacity) | `9999` (exceeds limit) | `9999` (quota exceeded) |

Magic values must never collide with realistic inputs. Use the `-fail-` infix, `@demo.test` domain, and all-caps parameter values to keep them obviously synthetic.

### Implementation Guidance

When the scaffold skill generates service code, each service must:

1. **Map magic values to the demo's domain** — choose an entity-ID prefix that fits the narrative (e.g., `sku-` for e-commerce, `shipment-` for logistics, `txn-` for fintech, `job-` for DevOps).
2. **Check incoming requests for magic values** before executing business logic.
3. **Produce the named failure deterministically** when a magic value is detected — return the correct error status, inject the intended latency, or trigger the cascade.
4. **Log the scenario name** in the structured log entry (e.g., `"scenario": "retry-storm"`) so the failure is easy to find in Datadog Log Management.
5. **Propagate context normally** — magic-value requests must flow through the same tracing and logging pipeline as golden-path requests so they produce full distributed traces, correlated logs, and error tracking issues.

---

## Scenarios by Topology

The scenarios below use generic endpoint names (`/api/<resource>`) and entity-ID placeholders (`<id>-fail-*`). The scaffold skill adapts these to the demo's domain — for example, `/api/orders` with `product_id` for e-commerce, `/api/shipments` with `shipment_id` for logistics, `/api/transactions` with `txn_id` for fintech.

### Default: API Gateway + 2 Services

#### Retry Storm

- **Trigger**: primary create/process endpoint with entity ID `<prefix>-fail-500`
- **Human action**: select or submit the item whose name hints at the failure (e.g., *Phantom Widget*, *Ghost Shipment*, *Null Transaction*)
- **Behavior**: `service-b` returns **500** on downstream lookup for this entity; `service-a` retries 3×; all retries fail; caller receives **500**
- **Datadog signals**: Error Tracking issue on `service-b`, retry spans visible in the trace waterfall, elevated error rate on the `service-a` → `service-b` edge in Service Map
- **Locust task**: `retry_storm` · default weight **2**
- **Domain examples**:
  - E-commerce: `POST /api/orders` with `product_id: "sku-fail-500"` — add *Phantom Widget* to cart
  - Logistics: `POST /api/shipments` with `shipment_id: "shipment-fail-500"` — dispatch *Ghost Shipment*
  - Fintech: `POST /api/transactions` with `txn_id: "txn-fail-500"` — submit *Null Transaction*

#### Cascading Timeout

- **Trigger**: include parameter value `TIMEOUT_30S` on the primary endpoint
- **Human action**: enter `TIMEOUT_30S` in any free-text field that maps to a downstream lookup (coupon code, reference number, note, config key)
- **Behavior**: `service-b` sleeps 30 s on validation; `service-a` times out at 5 s; `api-gateway` returns **504**
- **Datadog signals**: Long span on `service-b`, timeout error on `service-a`, 504 on `api-gateway` in traces; latency spike visible on Service Map
- **Locust task**: `cascading_timeout` · default weight **1**
- **Domain examples**:
  - E-commerce: `coupon: "TIMEOUT_30S"` — apply coupon code at checkout
  - Logistics: `reference: "TIMEOUT_30S"` — enter a tracking reference
  - Fintech: `memo: "TIMEOUT_30S"` — add a transfer memo

#### Slow Query (Database)

- **Trigger**: primary read/list endpoint with entity ID `<prefix>-fail-dbslow`
- **Human action**: view or search for the item whose name hints at sluggishness (e.g., *Laggy Listing*, *Slow Shipment*, *Heavy Ledger*)
- **Behavior**: `service-b` executes an intentionally slow query (e.g., `pg_sleep(5)` or an unindexed full-table scan); caller receives **200** with delayed response
- **Datadog signals**: long PostgreSQL span in APM trace waterfall, slow query visible in Database Monitoring (DBM), elevated P99 latency on `service-b`
- **Locust task**: `slow_query` · default weight **1**

#### Cache Failure

- **Trigger**: primary read endpoint with entity ID `<prefix>-fail-cache`
- **Human action**: view the item whose name hints at a cache problem (e.g., *Uncached Widget*, *Cold Parcel*, *Miss Record*)
- **Behavior**: `service-b` encounters a Redis connection error or timeout; falls back to a direct PostgreSQL lookup, adding latency; caller receives **200** with degraded performance
- **Datadog signals**: Redis error span in APM trace, fallback DB span visible in the same trace, Redis integration shows connection error in Infrastructure, latency increase on `service-b`
- **Locust task**: `cache_failure` · default weight **1**

---

### Extended: With Frontend (RUM + APM)

Inherits all Default scenarios, plus:

#### Frontend JavaScript Error

- **Trigger**: navigate to the detail view for entity ID `<prefix>-fail-js`
- **Human action**: click on the item whose name hints at a frontend glitch (e.g., *Glitch Gadget*, *Broken Parcel*, *Error Invoice*)
- **Behavior**: frontend JavaScript throws an unhandled exception when rendering the detail page; no HTTP error (client-side only)
- **Datadog signals**: RUM Error Tracking issue, error visible in Session Replay, no backend impact
- **Locust task**: N/A (browser-only; not replicable from Locust)

#### Slow API Degradation

- **Trigger**: filter or search with parameter value `SLOW_3S` (e.g., `category=SLOW_3S`, `region=SLOW_3S`, `status=SLOW_3S`)
- **Human action**: select the filter/category whose label hints at degradation (e.g., *Legacy*, *Archive*, *Overseas*)
- **Behavior**: `api-gateway` injects 3 s latency on this lookup; frontend shows spinner; caller receives **200** with delayed response
- **Datadog signals**: RUM Resource timing shows slow XHR; correlated APM trace shows latency in `api-gateway` span; Core Web Vitals degradation in RUM
- **Locust task**: `slow_api_degradation` · default weight **1**

---

### Extended: With Worker (Async Traces)

Inherits all Default scenarios, plus:

#### Poison Message

- **Trigger**: primary create/process endpoint with entity ID `<prefix>-fail-poison`
- **Human action**: select or submit the item whose name hints at corruption (e.g., *Cursed Crate*, *Toxic Parcel*, *Bad Payload*)
- **Behavior**: entity is published to the queue; worker consumes the message but fails to process it; message is sent to the dead-letter queue (DLQ) after 3 attempts; caller receives **202** (accepted) — the failure is asynchronous
- **Datadog signals**: async trace shows producer span on `service-a`, consumer error spans on `worker`, DLQ accumulation visible in queue lag metrics
- **Locust task**: `poison_message` · default weight **1**

#### Queue Backlog

- **Trigger**: primary create/process endpoint with quantity/count `9999`
- **Human action**: submit with an absurd quantity (9,999 units, messages, or iterations)
- **Behavior**: `service-a` publishes 9,999 individual messages to the queue; worker falls behind processing them; caller receives **202**
- **Datadog signals**: queue lag metric spikes in Infrastructure dashboard, worker throughput saturation visible in APM service page
- **Locust task**: `queue_backlog` · default weight **1** (use sparingly — each invocation generates high load)

---

### Extended: With Identity Provider (Auth + SIEM)

Inherits all Default scenarios, plus:

#### Expired Token Cascade

- **Trigger**: log in as user `expired@demo.test` (whose token TTL is set to 1 s in the Keycloak realm export)
- **Human action**: Log in as `expired@demo.test`; any subsequent API call uses the already-expired token
- **Behavior**: `api-gateway` validates token, Keycloak returns token-expired; gateway returns **401** to all downstream calls; cascade of 401s visible across services
- **Datadog signals**: 401 error spike in APM, auth failure events in Cloud SIEM, SIEM detection rule fires
- **Locust task**: `expired_token` · default weight **1**

#### Brute-Force Login

- **Trigger**: `POST /realms/{realm}/protocol/openid-connect/token` with `username: "brute@demo.test"` and any wrong password, repeated 10×
- **Human action**: Attempt to log in as `brute@demo.test` with wrong password 10 times in a row
- **Behavior**: Keycloak logs 10 consecutive failed-login events; account is temporarily locked; returns **401** on each attempt, then **403** after lockout
- **Datadog signals**: Burst of `LOGIN_ERROR` events in Cloud SIEM, brute-force detection rule fires, SIEM Security Signal created
- **Locust task**: `brute_force_login` · default weight **1**

#### IdP Latency Spike

- **Trigger**: any authenticated request while user `slowauth@demo.test` is logged in
- **Human action**: Log in as `slowauth@demo.test`; navigate normally — all requests are slow
- **Behavior**: Keycloak's token introspection endpoint is configured (via realm export) to inject 5 s latency for this user's tokens; `api-gateway` auth middleware blocks on token validation, delaying all downstream calls; caller receives **200** with degraded latency
- **Datadog signals**: long auth middleware span on `api-gateway` in APM trace waterfall, elevated P99 latency across all services in Service Map, Keycloak token-validation latency visible in Infrastructure metrics
- **Locust task**: `idp_latency_spike` · default weight **1**

---

### Extended: With LLM Service (AI / LLM Observability)

Inherits all Default scenarios, plus:

#### LLM Rate Limit

- **Trigger**: `POST /api/chat` with `message: "RATELIMIT_429"`
- **Human action**: Type `RATELIMIT_429` in the chat interface
- **Behavior**: `llm-service` simulates a 429 response from the LLM provider; returns **429** to the caller
- **Datadog signals**: LLM Obs trace shows 429 on the LLM provider span, Error Tracking issue on `llm-service`
- **Locust task**: `llm_rate_limit` · default weight **1**

#### LLM Provider Timeout

- **Trigger**: `POST /api/chat` with `message: "TIMEOUT_60S"`
- **Human action**: Type `TIMEOUT_60S` in the chat interface
- **Behavior**: `llm-service` simulates a 60 s timeout from the LLM provider; request times out at 30 s; caller receives **504**
- **Datadog signals**: LLM Obs trace shows timeout span, cascading latency visible in APM trace waterfall
- **Locust task**: `llm_provider_timeout` · default weight **1**

---

## Locust Task Guidance

The golden-path task should carry the highest weight so that normal traffic dominates and failures appear as clear anomalies. A recommended starting ratio is **golden path 10, each failure scenario 1–2**. Adjust weights per demo needs — increase a scenario's weight to make it more visible in dashboards, or decrease it to keep it subtle.

Each failure scenario's Locust task should:

1. Use the task name listed above (e.g., `@task(2)` with `name="[retry-storm]"`)
2. Send the exact magic value documented in the scenario
3. Assert the expected HTTP status so Locust reports genuine regressions, not intentional failures

---

## Quick Reference

| Scenario              | Topology     | Trigger Value              | Expected Status | Locust Task              |
| --------------------- | ------------ | -------------------------- | --------------- | ------------------------ |
| Retry Storm           | Default      | `<prefix>-fail-500`        | 500             | `retry_storm`            |
| Cascading Timeout     | Default      | `TIMEOUT_30S`              | 504             | `cascading_timeout`      |
| Slow Query (Database) | Default      | `<prefix>-fail-dbslow`     | 200 (slow)      | `slow_query`             |
| Cache Failure         | Default      | `<prefix>-fail-cache`      | 200 (slow)      | `cache_failure`          |
| Frontend JS Error     | Frontend     | `<prefix>-fail-js`         | N/A (client)    | N/A                      |
| Slow API Degradation  | Frontend     | `SLOW_3S`                  | 200 (slow)      | `slow_api_degradation`   |
| Poison Message        | Worker       | `<prefix>-fail-poison`     | 202             | `poison_message`         |
| Queue Backlog         | Worker       | `9999`                     | 202             | `queue_backlog`          |
| Expired Token Cascade | Auth + SIEM  | `expired@demo.test`        | 401             | `expired_token`          |
| Brute-Force Login     | Auth + SIEM  | `brute@demo.test`          | 401 → 403       | `brute_force_login`      |
| IdP Latency Spike     | Auth + SIEM  | `slowauth@demo.test`       | 200 (slow)      | `idp_latency_spike`      |
| LLM Rate Limit        | LLM          | `RATELIMIT_429`            | 429             | `llm_rate_limit`         |
| LLM Provider Timeout  | LLM          | `TIMEOUT_60S`              | 504             | `llm_provider_timeout`   |
