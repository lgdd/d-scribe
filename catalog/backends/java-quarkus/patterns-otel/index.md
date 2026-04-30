# Instrumentation patterns — Java Quarkus (OTel mode)

| Pattern | Feature | Description |
|---------|---------|-------------|
| RagSeedResource.java | ai:llmobs | Embed and store documents in pgvector using OTel GenAI semconv spans |
| RagChatResource.java | ai:llmobs | RAG chat using OTel GenAI semconv spans (retrieval + LLM) |

All patterns use `io.opentelemetry.api.trace.Tracer` obtained from `GlobalOpenTelemetry` and emit spans with the GenAI semantic conventions (`gen_ai.*` attributes). The javaagent provides the SDK at runtime; add `opentelemetry-api` as a compile dependency for custom spans.
