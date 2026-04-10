# Instrumentation patterns — Go Gin

| Pattern | Feature | Description |
|---------|---------|-------------|
| slow_query_repository.go | dbm:postgresql | Slow SELECT with artificial delay |
| n_plus_one_handler.go | dbm:postgresql | N+1 query on related entities |
| unsafe_search_handler.go | security:code | SQL injection via string concat |
| ssrf_example_handler.go | security:code | SSRF via unvalidated URL param |
| cpu_intensive_service.go | profiling | Nested loop aggregation |
| memory_leak_service.go | profiling | Gradual allocation in a cache |
| audit_log_middleware.go | siem | Structured audit log for auth events |
| inter_service_client.go | (base) | HTTP call with tracing headers propagated |
| kafka_producer_handler.go | dsm:kafka | Kafka producer for pipeline monitoring |
| kafka_consumer_service.go | dsm:kafka | Kafka consumer with optional lag simulation |
| slow_query_mysql_repository.go | dbm:mysql | Slow SELECT with artificial delay (MySQL) |
| n_plus_one_mysql_handler.go | dbm:mysql | N+1 query on related entities (MySQL) |
| slow_aggregation_mongo_repository.go | dbm:mongodb | Expensive aggregation pipeline (MongoDB) |
| unindexed_query_mongo_repository.go | dbm:mongodb | Collection scan on unindexed field (MongoDB) |
