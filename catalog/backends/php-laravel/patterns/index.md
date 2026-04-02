# Instrumentation patterns — PHP Laravel

| Pattern | Feature | Description |
|---------|---------|-------------|
| SlowQueryRepository.php | dbm:postgresql | Slow SELECT with artificial delay |
| NplusOneController.php | dbm:postgresql | N+1 query on related entities |
| UnsafeSearchController.php | security:code | SQL injection via string concat |
| SsrfExampleController.php | security:code | SSRF via unvalidated URL param |
| CpuIntensiveService.php | profiling | Nested loop aggregation |
| MemoryLeakService.php | profiling | Gradual allocation in a cache |
| AuditLogMiddleware.php | siem | Structured audit log for auth events |
| InterServiceClient.php | (base) | HTTP call with tracing headers propagated |
