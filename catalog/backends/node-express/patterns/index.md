# Instrumentation patterns — Node.js Express

| Pattern | Feature | Description |
|---------|---------|-------------|
| slow_query_repository.js | dbm:postgresql | Slow SELECT with artificial delay |
| n_plus_one_route.js | dbm:postgresql | N+1 query on related entities |
| unsafe_search_route.js | security:code | SQL injection via string concat |
| ssrf_example_route.js | security:code | SSRF via unvalidated URL param |
| cpu_intensive_service.js | profiling | Nested loop aggregation |
| memory_leak_service.js | profiling | Gradual allocation in a cache |
| audit_log_middleware.js | siem | Structured audit log for auth events |
| inter_service_client.js | (base) | HTTP call with tracing headers propagated |
