# Application Performance Monitoring (APM)

## Prerequisites

- Datadog Agent running with `DD_APM_ENABLED=true` (default in the `dd-docker-compose` rule)
- Application service with a supported language/framework

## Agent Configuration

APM is enabled by default in the standard Agent config. Verify these are set:

```yaml
environment:
  - DD_APM_ENABLED=true
  - DD_APM_NON_LOCAL_TRAFFIC=true
```

## Application Changes

Each service needs the Datadog tracing library installed and initialized. The correct library and initialization method vary by language — always verify against the [Tracing Setup](https://docs.datadoghq.com/tracing/trace_collection/) docs.

### Environment Variables (all languages)

```yaml
environment:
  - DD_AGENT_HOST=datadog-agent
  - DD_SERVICE=<service-name>
  - DD_ENV=${DD_ENV:-demo}
  - DD_VERSION=${DD_VERSION:-1.0.0}
  - DD_LOGS_INJECTION=true
  - DD_PROFILING_ENABLED=true
  - DD_DBM_PROPAGATION_MODE=full
```

### Language Quick Reference

| Language | Library | Initialization |
|---|---|---|
| Python | `ddtrace` | `ddtrace-run python app.py` or `ddtrace.patch_all()` |
| Node.js | `dd-trace` | `require('dd-trace').init()` (must be first import) |
| Go | `gopkg.in/DataDog/dd-trace-go.v1` | `tracer.Start()` / `defer tracer.Stop()` |
| Java | `dd-java-agent.jar` | `-javaagent:/path/to/dd-java-agent.jar` JVM flag |
| .NET | `Datadog.Trace` | Automatic with `dd-trace-dotnet` installed |
| Ruby | `datadog` | `Datadog.configure { |c| c.tracing.enabled = true }` |

## Deployment Config

Ensure the application service can reach the Agent:

```yaml
services:
  my-service:
    environment:
      - DD_AGENT_HOST=datadog-agent
    depends_on:
      datadog-agent:
        condition: service_healthy
```

## Cross-Product Wiring

- **Logs**: Set `DD_LOGS_INJECTION=true` for automatic trace-log correlation (see `dd-telemetry-correlation` rule)
- **Profiler**: Set `DD_PROFILING_ENABLED=true` for code-level profiling linked to traces
- **DBM**: Set `DD_DBM_PROPAGATION_MODE=full` for database query correlation
- **RUM**: Configure `allowedTracingUrls` in the RUM SDK to link browser sessions to backend traces

## Failure Scenarios

| Scenario | Datadog Signal |
|---|---|
| Downstream service returns 500 | Error spans with stack traces in APM |
| Inter-service timeout | Long-duration spans, timeout errors in trace waterfall |
| Retry storm | Repeated child spans visible in flame graph |
| Missing trace propagation | Fragmented traces (each service has isolated trace roots) |

## References

- [Tracing Setup](https://docs.datadoghq.com/tracing/trace_collection/)
- [Correlate Logs and Traces](https://docs.datadoghq.com/tracing/other_telemetry/connect_logs_and_traces/)
- [Correlate Traces and Profiles](https://docs.datadoghq.com/profiler/connect_traces_and_profiles/)
