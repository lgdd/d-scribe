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

- `service-b` returns 500 → `service-a` retries 3x → visible retry storm in traces
- `service-b` latency spikes to 5s → `api-gateway` times out → cascading failure

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

- Frontend JS error → visible in RUM Error Tracking
- Slow API response → visible in RUM Resource timing + APM trace waterfall

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

- Queue backlog → worker falls behind → visible in queue lag metrics
- Worker crashes on poison message → DLQ accumulation → alert trigger

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
- **Quick proof-of-concept**: Minimal (2 services)
- **Full platform showcase**: Extended with frontend + worker (all components)
