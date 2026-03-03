# Documentation Lookup

Look up Datadog documentation using the LLM-optimized index at `docs.datadoghq.com/llms.txt`:

1. Fetch `https://docs.datadoghq.com/llms.txt`
2. Grep the index for the topic keyword(s) to find matching page URLs and descriptions
3. Fetch the raw Markdown of the best-matching page by appending `.md` to its URL (e.g., `https://docs.datadoghq.com/tracing/trace_collection/.md`)
4. If `llms.txt` is unreachable, fall back to the direct documentation link provided in the calling file

Prefer this procedure whenever you need to verify or discover Datadog documentation.
