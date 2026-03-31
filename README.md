# d-scribe

CLI toolkit for assembling Datadog demo projects. Generates pre-instrumented microservice architectures with full observability — APM, Logs, Infrastructure Monitoring, and optional features like Database Monitoring, Code Security, and Continuous Profiling.

Designed for Datadog Sales Engineers who need to spin up realistic demo environments quickly.

## Quick Start

```bash
# Create a Java Spring demo with React frontend
npx d-scribe init demo --backend java:spring --frontend react:vite --output ./my-demo

# Create a polyglot demo (Java + Python)
npx d-scribe init demo --backend java:spring,python:flask --output ./my-demo

# Add Database Monitoring
npx d-scribe init demo --backend java:spring --features dbm:postgresql --output ./my-demo
```

Then:

```bash
cd my-demo
cp .env.example .env  # Edit with your Datadog API key
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

- **4 microservices** implementing a distributed todo app (api-gateway, user-service, project-service, task-service)
- **Datadog Agent** pre-configured for APM, Logs, and Infrastructure Monitoring
- **Traffic generator** (Locust) with golden paths and failure scenarios
- **docker-compose.yml** with all services wired together
- **AGENTS.md** with project context and rules for AI coding agents
- **Skills** for domain customization, telemetry verification, and runbook generation

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

- **`cli/`** — TypeScript CLI that reads a manifest, resolves dependencies, copies pre-written skeletons, and renders templates. No LLM code generation.
- **`catalog/`** — Pre-instrumented backend/frontend skeletons, infrastructure configs, and a traffic generator.
- **`skills/`** — Portable AI agent workflows (agentskills.io format) for customization and verification.

## License

MIT
