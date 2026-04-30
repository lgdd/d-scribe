# Instrumentation patterns — Ruby on Rails (OTel mode)

| Pattern | Feature | Description |
|---------|---------|-------------|

No OTel-specific patterns are defined for this backend. HTTP traces are captured automatically via `opentelemetry-instrumentation-all`. Use `OpenTelemetry::Trace.current_span` or custom tracers for additional spans in business logic patterns.
