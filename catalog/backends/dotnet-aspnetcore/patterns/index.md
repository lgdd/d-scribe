# Instrumentation patterns — .NET ASP.NET Core

| Pattern | Feature | Description |
|---------|---------|-------------|
| SlowQueryRepository.cs | dbm:postgresql | Slow SELECT with artificial delay |
| NplusOneEndpoint.cs | dbm:postgresql | N+1 query on related entities |
| UnsafeSearchEndpoint.cs | security:code | SQL injection via string concat |
| SsrfExampleService.cs | security:code | SSRF via unvalidated URL param |
| CpuIntensiveService.cs | profiling | Nested loop aggregation |
| MemoryLeakService.cs | profiling | Gradual allocation in a cache |
| AuditLogMiddleware.cs | siem | Structured audit log for auth events |
| InterServiceClient.cs | (base) | HTTP call with tracing headers propagated |
