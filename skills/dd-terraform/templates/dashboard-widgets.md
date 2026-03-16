# Dashboard Widget Reference

Each dashboard must include at minimum:

- **Request rate** — timeseries widget showing `trace.http.request.hits` by service
- **Error rate** — timeseries widget showing `trace.http.request.errors` / `trace.http.request.hits` by service
- **Latency (p95)** — timeseries widget showing `trace.http.request.duration.by.service.95p`
- **Log stream** — filtered to `env:$var.env`

When specific products are detected, add product-specific widgets:

| Product | Widget |
|---------|--------|
| Database Monitoring | Query metrics widget (`postgresql.queries.*`) |
| RUM | RUM performance widget (page load time, core web vitals) |
| Profiler | Top endpoints by CPU/wall time |
| LLM Observability | LLM request duration and token usage |

Use `ordered` layout. Group widgets by service or concern using `group_definition`.
