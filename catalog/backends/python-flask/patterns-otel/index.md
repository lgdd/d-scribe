# Instrumentation patterns — Python Flask (OTel mode)

| Pattern | Feature | Description |
|---------|---------|-------------|
| rag_seed_route.py | ai:llmobs | Embed and store documents in pgvector using OTel GenAI semconv spans |
| rag_chat_route.py | ai:llmobs | RAG chat using OTel GenAI semconv spans (retrieval + LLM) |

All patterns use `opentelemetry.trace` and emit spans with the GenAI semantic conventions (`gen_ai.*` attributes). Datadog ingests and displays these via LLM Observability when the OTel collector ships them through the `datadog` exporter.
