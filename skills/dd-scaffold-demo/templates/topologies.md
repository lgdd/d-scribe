# Reference Topologies

All topologies include **PostgreSQL** (database — enables DBM). **Redis** (cache) is optional — include it when the SE requests caching, the Redis integration, or cache-failure demo scenarios.

## Default: Frontend + API Gateway + 2 Services

The standard topology for most demos. Produces end-to-end RUM-to-APM correlation with trace propagation across a frontend and 3 backend services.

```
[Browser/RUM] → [frontend] → [api-gateway] → [service-a] → [service-b] → [PostgreSQL]
                                                                  ↓
                                                               [Redis]  ← optional
```

- **frontend**: Static SPA or SSR app instrumented with DD RUM SDK — traffic flows through the frontend for end-to-end trace correlation (RUM → APM)
- **api-gateway**: HTTP routing, auth simulation, trace root
- **service-a**: Core business logic (e.g., order processing, user management)
- **service-b**: Downstream data service (e.g., inventory lookup, notification dispatch)
- **PostgreSQL**: Primary database — visible in traces and Database Monitoring
- **Redis** (optional): Cache layer — visible in traces via the Redis integration

### Failure Scenarios

Inherits all backend-only scenarios (retry storm, cascading timeout, slow query, cache failure if Redis present), plus:

- **Frontend JS Error**: unhandled exception on detail page → visible in RUM Error Tracking
  - **Trigger**: navigate to entity with ID `<prefix>-fail-js` (e.g., click *Glitch Gadget*, *Broken Parcel*, *Error Invoice*)
- **Slow API Degradation**: slow API response → visible in RUM Resource timing + APM trace waterfall
  - **Trigger**: filter or search with parameter value `SLOW_3S` (e.g., `category=SLOW_3S`, `region=SLOW_3S`)

---

## Backend-Only: API Gateway + 2 Services

Use when a frontend is not needed. Produces a clear service map with trace propagation across 3 services.

```
[Client] → [api-gateway] → [service-a] → [service-b] → [PostgreSQL]
                                                ↓
                                             [Redis]  ← optional
```

- **api-gateway**: HTTP routing, auth simulation, trace root
- **service-a**: Core business logic (e.g., order processing, user management)
- **service-b**: Downstream data service (e.g., inventory lookup, notification dispatch)
- **PostgreSQL**: Primary database — visible in traces and Database Monitoring
- **Redis** (optional): Cache layer — visible in traces via the Redis integration

### Failure Scenarios

- **Retry Storm**: `service-b` returns 500 → `service-a` retries 3× → visible retry storm in traces
  - **Trigger**: primary endpoint with entity ID `<prefix>-fail-500` (e.g., `sku-fail-500`, `shipment-fail-500`, `txn-fail-500`)
- **Cascading Timeout**: `service-b` latency spikes to 30 s → `service-a` times out → `api-gateway` returns 504
  - **Trigger**: primary endpoint with parameter value `TIMEOUT_30S` in any free-text field
- **Slow Query (Database)**: `service-b` executes a slow PostgreSQL query → elevated P99 latency visible in DBM and APM
  - **Trigger**: primary read endpoint with entity ID `<prefix>-fail-dbslow`
- **Cache Failure** (requires Redis): `service-b` Redis connection fails → fallback to direct DB lookup → degraded latency
  - **Trigger**: primary read endpoint with entity ID `<prefix>-fail-cache`

---

## Extended: With Worker (Async Traces)

Adds asynchronous processing. Use when demonstrating queue-based architectures, background jobs, or async trace propagation.

```
[api-gateway] → [service-a] → [Kafka/NATS/SQS] → [worker] → [PostgreSQL]
                     ↓
               [service-b] → [PostgreSQL]
                     ↓
                  [Redis]  ← optional
```

- **worker**: Consumes messages from the queue, processes asynchronously
- Trace context must propagate through the queue (inject/extract headers)

### Additional Failure Scenarios

- **Poison Message**: worker crashes on unprocessable message → DLQ accumulation → alert trigger
  - **Trigger**: primary endpoint with entity ID `<prefix>-fail-poison` (e.g., *Cursed Crate*, *Toxic Parcel*, *Bad Payload*)
- **Queue Backlog**: worker falls behind → visible in queue lag metrics
  - **Trigger**: primary endpoint with quantity/count `9999`

---

## Extended: With Identity Provider (Auth + SIEM)

Adds Keycloak as an OIDC identity provider. Use when demonstrating Cloud SIEM, authenticated user flows, or RUM with real user identity.

```
[Browser/RUM] → [frontend] → [api-gateway] → [service-a] → [service-b] → [PostgreSQL]
                                    ↕                                ↓
                               [Keycloak]                         [Redis]  ← optional
```

- **Keycloak**: OIDC provider — issues JWTs, produces structured security event logs (login, logout, failed attempts)
- **api-gateway**: validates tokens via OIDC middleware, extracts user identity from JWT claims, creates auth-enriched trace roots
- Composable with all other extensions (frontend, worker)
- Keycloak bootstraps from a realm export file (`keycloak/realm-export.json`) with a pre-configured demo realm, client, and test users

### Datadog Products Enabled

- **Cloud SIEM**: Keycloak auth event logs — failed logins, brute force, credential stuffing, impossible travel
- **RUM**: Real user identity on sessions (`usr.id`, `usr.email`) from OIDC claims
- **APM**: Auth middleware spans (token validation latency), 401/403 error traces
- **Log Management**: Structured auth event logs correlated to traces

### Additional Failure Scenarios

- **Expired Token Cascade**: token expired → 401 cascade visible in traces and logs
  - **Trigger**: log in as `expired@demo.test` (token TTL set to 1 s in realm export)
- **Brute-Force Login**: burst of failed-auth events → detectable via SIEM detection rules
  - **Trigger**: attempt login as `brute@demo.test` with wrong password 10× in a row
- **IdP Latency Spike**: auth middleware blocks on slow token validation → all downstream requests delayed
  - **Trigger**: log in as `slowauth@demo.test`

---

## Extended: With LLM Service (AI / LLM Observability)

Adds an LLM-powered service. Use when demonstrating AI applications, chatbots, or any service that calls an LLM provider.

```
[Client] → [api-gateway] → [llm-service] → [LLM Provider (OpenAI / Bedrock / Anthropic)]
                                 ↓
                            [PostgreSQL]
                                 ↓
                              [Redis]  ← optional
```

- **llm-service**: Application that calls an LLM provider (via OpenAI SDK, Anthropic SDK, Bedrock SDK, or LangChain). Instrumented with `ddtrace` LLM Observability (`LLMObs.enable()` or equivalent)
- LLM provider is an external API call — no container needed in the stack
- Composable with all other extensions (frontend for RUM, worker for async, Keycloak for auth)

### Datadog Products Enabled

- **LLM Observability**: LLM call traces — input/output messages, token usage, latency, model parameters
- **APM**: Distributed traces include LLM spans alongside HTTP and database spans
- **Log Management**: LLM call logs correlated to traces

### Additional Failure Scenarios

- **LLM Rate Limit**: LLM provider returns 429 → visible in LLM Obs traces and error tracking
  - **Trigger**: `POST /api/chat` with `message: "RATELIMIT_429"`
- **LLM Provider Timeout**: LLM provider timeout → cascading latency visible in APM trace waterfall
  - **Trigger**: `POST /api/chat` with `message: "TIMEOUT_60S"`

---

## Minimal: 2 Services

Use for quick, focused demos where a smaller topology is sufficient.

```
[service-a] → [service-b] → [PostgreSQL]
                    ↓
                 [Redis]  ← optional
```

- Omit `api-gateway` — `service-a` acts as both entry point and business logic
- Still meets the minimum architecture requirement (2 services + PostgreSQL)

---

## Topology Selection Guide

- **Standard demo**: Default (frontend + gateway + 2 services)
- **No frontend needed**: Backend-only (gateway + 2 services)
- **Event-driven / async**: Extended with worker
- **Auth / SIEM / user identity**: Extended with identity provider (Keycloak)
- **AI / LLM focus**: Extended with LLM service
- **Quick proof-of-concept**: Minimal (2 services)
- **Full platform showcase**: Default + identity provider + worker (all components)
