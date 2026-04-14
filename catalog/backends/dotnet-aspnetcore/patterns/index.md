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
| KafkaProducerEndpoint.cs | dsm:kafka | Kafka producer for pipeline monitoring |
| KafkaConsumerService.cs | dsm:kafka | Kafka consumer with optional lag simulation |
| SlowQueryMysqlRepository.cs | dbm:mysql | Slow SELECT with artificial delay (MySQL) |
| NplusOneMysqlEndpoint.cs | dbm:mysql | N+1 query on related entities (MySQL) |
| SlowAggregationMongoRepository.cs | dbm:mongodb | Expensive aggregation pipeline (MongoDB) |
| UnindexedQueryMongoRepository.cs | dbm:mongodb | Collection scan on unindexed field (MongoDB) |
| FeatureFlagBooleanGate.cs | delivery:feature-flags | OpenFeature boolean gate with user targeting context |
| FeatureFlagStringVariant.cs | delivery:feature-flags | OpenFeature string variant for A/B branching |
