---
name: dd-scaffold-demo
description: Scaffolds a new Datadog demo project with microservice architecture, instrumentation, and deployment configuration. Use when creating a new demo project, scaffolding services, or setting up a DD demo from scratch.
---

# Scaffold Datadog Demo Project

## Before You Begin

### Step 0: Auto-Update Toolkit

Follow the procedure in [_auto-update.md](../_auto-update.md).

### Step 1: Gather Requirements

Gather the following from the SE (ask if not provided):

1. **Language/framework** for services (e.g., Python/Flask, Go/Gin, Node/Express, Java/Spring Boot)
2. **Deployment model**: Docker Compose (default), Kubernetes, or AWS
3. **Datadog products** to include (default: RUM, APM, Logs, Infrastructure Monitoring, Database Monitoring). Optional add-ons: Redis integration, LLM Observability (when the user mentions an AI app, LLM-powered service, or chatbot), Cloud SIEM (when the user mentions authentication or security)
4. **Topology**: Frontend + 2 backend services (default), backend-only, or minimal — see [templates/topologies.md](templates/topologies.md)
5. **Optional**: narrative context, audience, or specific use case

### Step 1.5: Present Plan

Before generating any files, present the SE with a summary of what will be scaffolded:

- Project name and directory structure
- Services (name, language/framework, role in topology)
- Datadog products to configure (baseline + add-ons)
- Deployment model (Docker Compose / Kubernetes / AWS)
- Failure scenarios to include (magic values and triggers)
- Optional components: Redis cache, Keycloak (auth/SIEM), LLM service, worker

**Wait for the SE to confirm before proceeding.** Do not generate any files until the plan is approved.

## Scaffolding Workflow

### Step 2: Load Reference Documents

Load the documents needed for this scaffold:

1. **Always**: [templates/topologies.md](templates/topologies.md) — topology diagrams, service roles, wiring rules
2. **Always**: [templates/failure-scenarios.md](templates/failure-scenarios.md) — magic-value triggers and Locust task specs
3. **If Docker Compose**: the `dd-docker-compose` rule
4. **If Kubernetes**: the `dd-kubernetes` rule

### Step 3: Project Structure

Create the project root — the default topology includes a `frontend/` directory:

```
<project-name>/
├── .cursor/rules/          # Copied from toolkit
├── .env.example / .env / .gitignore
├── docker-compose.yml      # Or k8s/ directory
├── Makefile / README.md
├── frontend/               # RUM-instrumented SPA (default topology)
├── services/
│   ├── api-gateway/
│   ├── service-a/
│   └── service-b/
├── traffic/
│   └── locustfile.py
└── scripts/
    └── smoke-test.sh
```

Add optional directories per topology: `keycloak/` (auth/SIEM), `worker/` (async), `llm-service/` (AI).

### Step 4: Copy Rule Templates

Copy all `.mdc` files from the toolkit's `rules/` directory into `.cursor/rules/`. Navigate up two levels from this SKILL.md to find `rules/`.

### Step 5: Generate Core Files

Generate in order:

1. `.gitignore` — **must be created first**
2. `.env.example` with `DD_ENV` using `{project}-{YYMMDD}` convention (see `dd-secrets-env` rule)
3. `.env` — from `.env.example` via shell command (see `dd-secrets-env` rule). Validate `DD_API_KEY` and `DD_SITE` are non-empty
4. `Makefile` — from [templates/Makefile](templates/Makefile)
5. `README.md` — from [templates/README.md](templates/README.md), fill all `{{PLACEHOLDER}}` values. Include architecture diagram, services table, demo scenarios, prerequisites, getting-started, Makefile targets. Include/remove the `AUTH:START`/`AUTH:END` block based on Keycloak presence

### Step 6: Scaffold Services

For each service, generate: application code with `/health` endpoint, DD tracer init, JSON logging to stdout (see `dd-logging` rule), business-logic endpoints, and Dockerfile with multi-stage build.

**Consult Datadog documentation** via [_doc-lookup.md](../_doc-lookup.md) for version-sensitive content: tracing library names/init, JSON logging with trace-log correlation, environment variables for selected DD products. **Skip doc lookup** for structural patterns, d-scribe conventions, and glue code.

### Step 7: Wire Topology & Failure Scenarios

Wire services per the topology loaded in Step 2. Include one **golden path** and at least one **failure scenario** using deterministic magic-value triggers from the failure scenarios catalog. When a frontend exists, magic entities must appear in the UI.

### Step 8: Deployment Configuration

- **Docker Compose**: follow the `dd-docker-compose` rule
- **Kubernetes**: follow the `dd-kubernetes` rule
- **AWS**: generate Terraform or CloudFormation with project-managed Agent

### Step 9: Traffic & Smoke Test

Generate a Locust traffic generator using the `dd-generate-traffic` skill. Add a `traffic` service excluded from DD monitoring. Generate `scripts/smoke-test.sh`.

### Step 10: Preflight (Optional)

Ask the SE if they want to run preflight validation via the `dd-demo-preflight` subagent.

## Post-Scaffold Checklist

- [ ] All services have distinct `service` tags
- [ ] `.env.example` contains all required DD variables
- [ ] `.env` is in `.gitignore`
- [ ] At least one golden path and one failure path exist
- [ ] Each failure scenario uses a deterministic trigger (magic value)
- [ ] README documents demo scenarios with triggers and Datadog signals
- [ ] If Keycloak: README includes credentials and auth endpoints
- [ ] All services build successfully
- [ ] `make up` starts the full stack including DD Agent
- [ ] Traffic generator is functional
- [ ] DBM is enabled for PostgreSQL
- [ ] If Redis included: Redis integration is enabled
- [ ] README contains architecture diagram, services table, and Makefile targets
