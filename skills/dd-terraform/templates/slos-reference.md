# SLO Reference

Generate SLOs for key services (typically the API gateway and primary backend service).

## Per-Service SLOs

| SLO | Type | Metric |
|-----|------|--------|
| Availability | `metric` | Good events: requests with status < 500; Total: all requests |
| Latency | `metric` | Good events: requests with duration < threshold; Total: all requests |

Each SLO must include:
- `thresholds` block with `timeframe` (e.g., `"7d"`, `"30d"`), `target` (e.g., `99.9`), and `warning` (e.g., `99.95`)
- `tags` aligned with Unified Service Tagging
