# Monitor Reference

## Per-Service Monitors

| Monitor | Type | Query pattern |
|---------|------|---------------|
| High error rate | `metric alert` | `sum(last_5m):sum:trace.http.request.errors{service:<name>,env:<env>}.as_count() / sum:trace.http.request.hits{service:<name>,env:<env>}.as_count() > 0.05` |
| High p95 latency | `metric alert` | `avg(last_5m):avg:trace.http.request.duration.by.service.95p{service:<name>,env:<env>} > 1` |
| Low throughput | `metric alert` | `sum(last_10m):sum:trace.http.request.hits{service:<name>,env:<env>}.as_count() < 1` |

## Cross-Service Monitors

| Monitor | Type | Description |
|---------|------|-------------|
| Composite health | `composite` | Triggers when error rate AND latency monitors fire simultaneously |

## Monitor Requirements

Every monitor must include:
- `tags` with `env`, `service`, and `team`
- `message` with notification placeholders (`@slack-channel` or `@pagerduty`)
- `monitor_thresholds` with `warning` and `critical` values
- `include_tags = true`
