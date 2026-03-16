---
name: dd-demo-narrator
description: Generates a presentation-ready DEMO-RUNBOOK.md with talking points, Datadog UI navigation, and failure playbooks. Use after scaffolding or before a demo to prepare delivery notes.
---

# Generate Demo Runbook

## Before You Begin

### Step 0: Auto-Update Toolkit

Follow the procedure in [_auto-update.md](../_auto-update.md).

## Workflow

### Step 1: Discover Project

Read the project to build a complete picture of its architecture, services, and enabled Datadog products.

1. **README.md** — extract the architecture diagram, services table, demo scenarios (golden path steps and failure paths), and authentication section (if present)
2. **Deployment config** — read `docker-compose.yml` or K8s manifests to enumerate all services, their ports, environment variables, and dependencies. Note which databases, caches, queues, and identity providers are present
3. **`.env.example`** — identify which DD products are configured by looking for product-specific variables:
   - `DD_API_KEY`, `DD_SITE` → core Agent
   - `DD_APPLICATION_ID`, `DD_CLIENT_TOKEN` → RUM
   - `DD_DBM_PROPAGATION_MODE` → DBM
   - `DD_PROFILING_ENABLED` → Continuous Profiler
   - LLM provider keys (e.g., `OPENAI_API_KEY`) → LLM Observability
4. **`traffic/locustfile.py`** — read the traffic generator to understand available request patterns, error rate controls, and configurable parameters
5. **`Makefile`** — note available targets (`up`, `down`, `traffic`, `smoke-test`, etc.)
6. **Service source code** — scan each service's main application file to catalog HTTP endpoints (method, path, purpose) and identify failure-path triggers. Look for **magic-value constants** (product IDs like `sku-fail-*`, coupon codes like `TIMEOUT_*`, emails like `*@demo.test`) that deterministically activate named failure scenarios. Map each magic value to its scenario name, the human-friendly action that triggers it (e.g., "add product *Phantom Widget* to cart"), and the expected failure behavior

### Step 2: Identify Demo Segments

Load [templates/demo-segments.md](templates/demo-segments.md) for the detection signals and act guidance per segment. From the discovered topology and products, determine which core and conditional segments to include.

### Step 3: Query Datadog for Live Links

Load [templates/datadog-views.md](templates/datadog-views.md) for site-to-URL mappings and URL patterns.

Use MCP tools and the `DD_SITE` value from `.env.example` to build direct URLs to Datadog views. Read `DD_ENV` from `.env.example` (or fall back to the `DD_ENV` default in docker-compose/K8s) to scope all URLs to the correct environment.

Verify the links are live:

1. Use `search_datadog_services` to confirm at least one service is registered — this validates that the `DD_ENV` is correct and telemetry has been received
2. If MCP tools are unavailable or return errors, keep the constructed URLs but add a note in the runbook: `<!-- MCP verification skipped — confirm these links load correctly before the demo -->`

### Step 4: Generate DEMO-RUNBOOK.md

Load [templates/runbook-structure.md](templates/runbook-structure.md) for the full runbook format specification.

Write the runbook following that structure, using the project name from `README.md` as the title. Organize the demo into numbered acts — always start with Act 1 (Topology), Act 2 (Golden Path), Act 3 (Failure), then add one act per conditional segment detected in Step 2.

### Step 5: Write the File

Write the generated runbook to `DEMO-RUNBOOK.md` at the project root. If the file already exists, overwrite it — the runbook is always regenerated from the current project state.

### Step 6: Report

After writing the file, present a brief summary:

```
Demo Runbook Generated
=======================
File:       DEMO-RUNBOOK.md
Acts:       N (Act 1: The Topology, Act 2: The Golden Path, ...)
Segments:   Core + [list of conditional segments included]
Endpoints:  N endpoints cataloged
DD Links:   Populated / Placeholders only (MCP unavailable)
```
