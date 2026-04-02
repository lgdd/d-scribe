# Instrumentation patterns — Ruby on Rails

| Pattern | Feature | Description |
|---------|---------|-------------|
| slow_query_repository.rb | dbm:postgresql | Slow SELECT with artificial delay |
| n_plus_one_concern.rb | dbm:postgresql | N+1 query on related entities |
| unsafe_search_controller.rb | security:code | SQL injection via string interpolation |
| ssrf_example_controller.rb | security:code | SSRF via unvalidated URL param |
| cpu_intensive_service.rb | profiling | Nested loop aggregation |
| memory_leak_service.rb | profiling | Gradual allocation in a cache |
| audit_log_middleware.rb | siem | Structured audit log for auth events |
| inter_service_client.rb | (base) | HTTP call with tracing headers propagated |
