# Instrumentation patterns — Java Spring

| Pattern | Feature | Description |
|---------|---------|-------------|
| SlowQueryRepository.java | dbm:postgresql | Slow SELECT with artificial delay |
| NplusOneController.java | dbm:postgresql | N+1 query on related entities |
| UnsafeSearchController.java | security:code | SQL injection via string concat |
| SsrfExampleService.java | security:code | SSRF via unvalidated URL param |
| CpuIntensiveService.java | profiling | Nested loop aggregation |
| MemoryLeakService.java | profiling | Gradual allocation in a cache |
| CustomMetricsService.java | metrics:custom | DogStatsD gauge and counter |
| AuditLogFilter.java | siem | Structured audit log for auth events |
| InterServiceClient.java | (base) | HTTP call with tracing headers propagated |
