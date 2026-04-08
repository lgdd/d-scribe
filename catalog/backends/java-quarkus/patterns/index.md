# Instrumentation patterns — Java Quarkus

| Pattern | Feature | Description |
|---------|---------|-------------|
| SlowQueryRepository.java | dbm:postgresql | Slow SELECT with artificial delay |
| NplusOneResource.java | dbm:postgresql | N+1 query on related entities |
| UnsafeSearchResource.java | security:code | SQL injection via string concat |
| SsrfExampleResource.java | security:code | SSRF via unvalidated URL param |
| CpuIntensiveResource.java | profiling | Nested loop aggregation |
| MemoryLeakResource.java | profiling | Gradual allocation in a cache |
| AuditLogFilter.java | siem | Structured audit log for auth events |
| InterServiceClient.java | (base) | HTTP call with tracing headers propagated |
