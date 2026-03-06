# Reference Topologies

All topologies include **PostgreSQL** (database — enables DBM) and **Redis** (cache — enables the Redis integration) as backing dependencies.

## Default: API Gateway + 2 Services

The standard topology for most demos. Produces a clear service map with trace propagation across 3 services.

```
[Client] → [api-gateway] → [service-a] → [service-b] → [PostgreSQL]
                                                ↓
                                             [Redis]
```

- **api-gateway**: HTTP routing, auth simulation, trace root
- **service-a**: Core business logic (e.g., order processing, user management)
- **service-b**: Downstream data service (e.g., inventory lookup, notification dispatch)
- **PostgreSQL**: Primary database — visible in traces and Database Monitoring
- **Redis**: Cache layer — visible in traces via the Redis integration

### Failure Scenarios

- **Retry Storm**: `service-b` returns 500 → `service-a` retries 3× → visible retry storm in traces
  - **Trigger**: primary endpoint with entity ID `<prefix>-fail-500` (e.g., `sku-fail-500`, `shipment-fail-500`, `txn-fail-500`)
- **Cascading Timeout**: `service-b` latency spikes to 30 s → `service-a` times out → `api-gateway` returns 504
  - **Trigger**: primary endpoint with parameter value `TIMEOUT_30S` in any free-text field

---

## Extended: With Frontend (RUM + APM)

Adds browser-based RUM telemetry. Use when demonstrating end-to-end user experience monitoring.

```
[Browser/RUM] → [frontend] → [api-gateway] → [service-a] → [service-b] → [PostgreSQL]
                                                                  ↓
                                                               [Redis]
```

- **frontend**: Static SPA or SSR app instrumented with DD RUM SDK
- Traffic should flow through the frontend for end-to-end trace correlation (RUM → APM)

### Additional Failure Scenarios

- **Frontend JS Error**: unhandled exception on detail page → visible in RUM Error Tracking
  - **Trigger**: navigate to entity with ID `<prefix>-fail-js` (e.g., click *Glitch Gadget*, *Broken Parcel*, *Error Invoice*)
- **Slow API Degradation**: slow API response → visible in RUM Resource timing + APM trace waterfall
  - **Trigger**: filter or search with a slow-path parameter (e.g., `category=slow`, `region=slow`)

---

## Extended: With Worker (Async Traces)

Adds asynchronous processing. Use when demonstrating queue-based architectures, background jobs, or async trace propagation.

```
[api-gateway] → [service-a] → [Kafka/NATS/SQS] → [worker] → [PostgreSQL]
                     ↓
               [service-b] → [PostgreSQL]
                     ↓
                  [Redis]
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
                               [Keycloak]                         [Redis]
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
  - **Trigger**: log in as `expired@demo.test` (token TTL set to 1 s in realm export), or send `Authorization: Bearer EXPIRED_TOKEN_DEMO`
- **Brute-Force Login**: burst of failed-auth events → detectable via SIEM detection rules
  - **Trigger**: attempt login as `brute@demo.test` with wrong password 10× in a row
- IdP latency spike → auth middleware slows all downstream requests

---

## Extended: With LLM Service (AI / LLM Observability)

Adds an LLM-powered service. Use when demonstrating AI applications, chatbots, or any service that calls an LLM provider.

```
[Client] → [api-gateway] → [llm-service] → [LLM Provider (OpenAI / Bedrock / Anthropic)]
                                 ↓
                            [PostgreSQL]
                                 ↓
                              [Redis]
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
  - **Trigger**: `POST /api/chat` with `message: "RATELIMIT_TEST"`
- **LLM Provider Timeout**: LLM provider timeout → cascading latency visible in APM trace waterfall
  - **Trigger**: `POST /api/chat` with `message: "TIMEOUT_TEST"`

---

## Minimal: 2 Services

Use for quick, focused demos where a smaller topology is sufficient.

```
[service-a] → [service-b] → [PostgreSQL]
                    ↓
                 [Redis]
```

- Omit `api-gateway` — `service-a` acts as both entry point and business logic
- Still meets the minimum architecture requirement (2 services + PostgreSQL + Redis)

---

## Topology Selection Guide

- **Standard demo**: Default (gateway + 2 services)
- **RUM / frontend focus**: Extended with frontend
- **Event-driven / async**: Extended with worker
- **Auth / SIEM / user identity**: Extended with identity provider (Keycloak)
- **AI / LLM focus**: Extended with LLM service
- **Quick proof-of-concept**: Minimal (2 services)
- **Full platform showcase**: Extended with frontend + identity provider + worker (all components)
