# d-scribe

CLI toolkit for assembling Datadog demo projects. Generates pre-instrumented microservice architectures with full observability — APM, Logs, Infrastructure Monitoring, and optional features like Database Monitoring, Code Security, and Continuous Profiling.

Designed for Datadog Sales Engineers who need to spin up realistic demo environments quickly.

## Quick Start

```bash
# Create a Java Spring demo with 3 services
npx d-scribe init demo --backend java:spring --services 3 --output ./my-demo

# Create a polyglot demo (Java + Python) with frontend
npx d-scribe init demo --backend java:spring,python:flask --frontend react:vite --services 4 --output ./my-demo

# Add Database Monitoring and Code Security
npx d-scribe init demo --backend java:spring --features dbm:postgresql,security:code --services 3 --output ./my-demo
```

Then:

```bash
cd my-demo
# .env is auto-populated from $DD_API_KEY, $DD_SITE, $DD_APP_KEY if set on your host
# Otherwise, edit .env with your Datadog API key
docker compose up -d
```

## Commands

| Command | Description |
|---------|-------------|
| `d-scribe init demo` | Create a complete demo project |
| `d-scribe init skills` | Install skills globally (coming soon) |
| `d-scribe list backends` | List available backend frameworks |
| `d-scribe list frontends` | List available frontend frameworks |
| `d-scribe list features` | List available Datadog features |
| `d-scribe list deps` | List available infrastructure dependencies |
| `d-scribe add feature` | Add a feature to existing project (coming soon) |
| `d-scribe add dep` | Add a dependency to existing project (coming soon) |

## What Gets Generated

A scaffolded project includes:

- **N minimal microservices** (configurable via `--services`, default 4) — each compiles, starts, exposes `/health`, logs JSON, and is instrumented for APM, but has no business logic. AI generates domain-specific code guided by instrumentation patterns.
- **Instrumentation patterns** in `references/patterns/` — compact reference files (~30 lines each) for DBM, Code Security, Profiling, SIEM, Custom Metrics, and inter-service calls
- **Datadog Agent** pre-configured for APM, Logs, and Infrastructure Monitoring
- **Traffic generator** (Locust) with golden paths and failure scenarios
- **docker-compose.yml** with all services wired together
- **AGENTS.md** with project context, architecture, and pattern references for AI coding agents
- **Skills** for domain customization, preflight checks, traffic generation, telemetry verification, and runbook generation

## Available Backends

| Key | Framework |
|-----|-----------|
| `java:spring` | Java Spring Boot 3.4.x |
| `python:flask` | Python Flask 3.x |

## Available Features

| Key | Description | Requires |
|-----|-------------|----------|
| `dbm:postgresql` | Database Monitoring | PostgreSQL |
| `security:code` | Code Security / IAST | — |
| `profiling` | Continuous Profiling | — |
| `siem` | Cloud SIEM | Keycloak |
| `metrics:custom` | Custom Metrics (DogStatsD) | — |

## Architecture

d-scribe is a monorepo with three components:

- **`cli/`** — TypeScript CLI that reads a manifest, resolves dependencies, copies service templates N times, and renders Handlebars templates. Deterministic — no LLM code generation.
- **`catalog/`** — Minimal service templates (`service-template/`), instrumentation patterns (`patterns/`), infrastructure configs, and a traffic generator.
- **`skills/`** — Portable AI agent workflows (agentskills.io format) for scaffolding, domain customization, validation, and runbook generation.

## License

MIT
