# Continuous Profiler

## Prerequisites

- Application service already instrumented with the Datadog tracer (`ddtrace`, `dd-trace`, `dd-trace-go`, `dd-java-agent`)
- Datadog Agent running with APM enabled

## Agent Configuration

No special Agent changes required — profiling data flows through the standard APM pipeline. Ensure `DD_APM_ENABLED=true` is set (default).

## Application Changes

### Environment Variables (all languages)

Add to each service that should be profiled:

```yaml
environment:
  - DD_PROFILING_ENABLED=true
```

### Language-Specific Setup

| Language | Library | Setup |
|---|---|---|
| Python | `ddtrace` | `DD_PROFILING_ENABLED=true` with `ddtrace-run`, or `ddtrace.profiling.Profiler().start()` |
| Node.js | `dd-trace` | `DD_PROFILING_ENABLED=true` — automatic when tracer is initialized |
| Go | `gopkg.in/DataDog/dd-trace-go.v1/profiler` | `profiler.Start(profiler.WithProfileTypes(...))` / `defer profiler.Stop()` |
| Java | `dd-java-agent` | `DD_PROFILING_ENABLED=true` — automatic with the Java agent |
| .NET | `Datadog.Trace` | `DD_PROFILING_ENABLED=1` — automatic with `dd-trace-dotnet` |
| Ruby | `datadog` | `DD_PROFILING_ENABLED=true` — automatic with `ddtracerb` |

### Go — Explicit Profile Types

Go requires explicit opt-in to profile types:

```go
import "gopkg.in/DataDog/dd-trace-go.v1/profiler"

err := profiler.Start(
    profiler.WithService("my-service"),
    profiler.WithEnv("demo"),
    profiler.WithVersion("1.0.0"),
    profiler.WithProfileTypes(
        profiler.CPUProfile,
        profiler.HeapProfile,
        profiler.GoroutineProfile,
        profiler.MutexProfile,
        profiler.BlockProfile,
    ),
)
defer profiler.Stop()
```

## Deployment Config

No additional containers needed. The profiler runs inside the application process and sends data to the Agent via the existing APM connection.

## Cross-Product Wiring

- **APM**: Profiles are linked to traces — click "Code Hotspots" on a trace span to see the profiling data for that endpoint
- **Log Management**: No direct wiring, but profiling helps explain latency issues surfaced in logs

## Failure Scenarios

| Scenario | Datadog Signal |
|---|---|
| CPU-intensive endpoint | Code Hotspots shows hot function in flame graph |
| Memory leak | Heap profile growth over time in Profiler |
| Lock contention | Mutex/block profile shows goroutine/thread contention |

## References

- [Continuous Profiler Setup](https://docs.datadoghq.com/profiler/enabling/)
- [Connect Traces and Profiles](https://docs.datadoghq.com/profiler/connect_traces_and_profiles/)
- [Profile Types](https://docs.datadoghq.com/profiler/profile_types/)
