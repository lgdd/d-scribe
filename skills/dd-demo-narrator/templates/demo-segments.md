# Demo Segments

## Core Segments (always included)

- **Service Map** — auto-discovered topology from trace data
- **Distributed Traces** — end-to-end request flow across services
- **Log Correlation** — logs linked to traces via `dd.trace_id`

## Conditional Segments

Include only when the corresponding component is detected.

| Segment | Detection Signal |
|---|---|
| RUM | Frontend service exists and `DD_APPLICATION_ID` is in `.env.example` |
| Database Monitoring | PostgreSQL, MySQL, or MongoDB service with `dbm: true` in Autodiscovery labels |
| Cloud SIEM | Keycloak service present |
| LLM Observability | LLM service calling an external LLM provider |
| Continuous Profiler | `DD_PROFILING_ENABLED=true` in service environments |
| Async Traces | Worker service or message queue (Kafka, NATS, SQS, RabbitMQ) present |

## Act Guidance per Segment

When a conditional segment is detected, add one act for it after the three core acts. Use the guidance below for each:

| Segment | Act Title | Key Actions |
|---|---|---|
| RUM | User Experience | Show RUM session, session replay (if enabled), resource waterfall linked to backend trace |
| DBM | Database Insights | Show DBM query list, slow query detail, link from database span to query explain plan |
| Cloud SIEM | Security Events | Trigger a failed login via Keycloak, show the SIEM signal, show the detection rule that fired |
| LLM Observability | AI Operations | Trigger an LLM request, show LLM Obs trace with input/output, token usage, latency |
| Continuous Profiler | Code Performance | Show the flame graph for a service, link from a slow trace to the corresponding profile |
| Async Traces | Async Processing | Show a trace that spans the queue, point out the producer-consumer handoff |
