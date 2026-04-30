# Instrumentation patterns — PHP Laravel (OTel mode)

| Pattern | Feature | Description |
|---------|---------|-------------|

No OTel-specific patterns are defined for this backend. HTTP traces are captured automatically via `opentelemetry-auto-laravel` with `OTEL_PHP_AUTOLOAD_ENABLED=true`. Use `OpenTelemetry\API\Globals::tracerProvider()` for custom spans in business logic patterns.
