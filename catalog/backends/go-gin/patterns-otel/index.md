# Instrumentation patterns — Go Gin (OTel mode)

| Pattern | Feature | Description |
|---------|---------|-------------|

No OTel-specific patterns are defined for this backend. HTTP traces are captured automatically via `otelgin.Middleware`. Use `otel.Tracer("service")` for custom spans in business logic patterns.
