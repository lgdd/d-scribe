# Instrumentation patterns — Python Django

| Pattern | Feature | Description |
|---------|---------|-------------|
| slow_query_repository.py | dbm:postgresql | Slow SELECT with artificial delay |
| n_plus_one_route.py | dbm:postgresql | N+1 query on related entities |
| unsafe_search_route.py | security:code | SQL injection via string format |
| ssrf_example_route.py | security:code | SSRF via unvalidated URL param |
| cpu_intensive_service.py | profiling | Nested loop aggregation |
| memory_leak_service.py | profiling | Gradual allocation in a cache |
| audit_log_middleware.py | siem | Structured audit log for auth events |
| inter_service_client.py | (base) | HTTP call with tracing headers propagated |
