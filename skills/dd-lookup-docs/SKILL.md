---
name: dd-lookup-docs
description: Look up current Datadog documentation via the llms.txt index
tools:
  - file_read
  - web_fetch
---

# Datadog Documentation Lookup

Look up current Datadog documentation using the LLM-optimized index.

## When to Use

- Invoke directly when you need to check Datadog docs (e.g., "how do I configure DBM for MySQL?")
- Referenced by other dd- skills when they need version-sensitive documentation

## Procedure

### Step 1: Fetch the documentation index

Fetch `https://docs.datadoghq.com/llms.txt`. This is a text file listing all Datadog documentation pages with URLs and descriptions.

### Step 2: Search for your topic

Grep the index for keywords related to your topic. For example, to find Database Monitoring docs:
- Search for: `database monitoring`, `dbm`, `pg_stat_statements`
- Each matching line contains a URL and a brief description

### Step 3: Fetch the documentation page

For each relevant URL found, fetch the Markdown version by appending `.md` to the URL:
- Doc URL: `https://docs.datadoghq.com/database_monitoring/setup_postgres/selfhosted/`
- Markdown: `https://docs.datadoghq.com/database_monitoring/setup_postgres/selfhosted/.md`

### Step 4: Fallback

If `llms.txt` is unavailable or the topic is not found:
- Try direct documentation URLs at `https://docs.datadoghq.com/<topic>/`
- Check the Datadog API reference at `https://docs.datadoghq.com/api/`

## Notes

- Always prefer this procedure over relying on training data for Datadog-specific configuration — docs change frequently
- The `.md` suffix trick works for most Datadog documentation pages
