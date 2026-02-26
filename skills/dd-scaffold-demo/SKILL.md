---
name: dd-scaffold-demo
description: Scaffolds a new Datadog demo project with microservice architecture, instrumentation, and deployment configuration. Use when creating a new demo project, scaffolding services, or setting up a DD demo from scratch.
---

# Scaffold Datadog Demo Project

## Before You Begin

Gather the following from the SE (ask if not provided):

1. **Language/framework** for services (e.g., Python/Flask, Go/Gin, Node/Express, Java/Spring Boot)
2. **Deployment model**: Docker Compose (default), Kubernetes, or AWS
3. **Datadog products** to include (default: APM, Logs, Infrastructure Monitoring, Database Monitoring, Redis integration)
4. **Optional**: narrative context, audience, or specific use case

## Scaffolding Workflow

### Step 1: Project Structure

Create the project root with:

```
<project-name>/
├── .cursor/rules/          # Copy rule templates from toolkit
├── .env.example
├── .gitignore
├── docker-compose.yml      # Or k8s/ directory
├── Makefile
├── README.md
├── services/
│   ├── api-gateway/
│   ├── service-a/
│   ├── service-b/
│   └── worker/             # Optional
├── frontend/               # Optional
├── keycloak/               # Optional — OIDC identity provider
│   └── realm-export.json
├── traffic/
│   └── locustfile.py       # Locust traffic generator
└── scripts/
    └── smoke-test.sh
```

### Step 2: Copy Rule Templates

Copy all `.mdc` files from the toolkit's `rules/` directory into the new project's `.cursor/rules/`. The toolkit is located at the path stored in the skill's installation source (the symlink target of `~/.cursor/skills/dd-scaffold-demo/`). Navigate up two levels from the SKILL.md location to find the `rules/` directory.

### Step 3: Generate Core Files

Generate these files in order:

1. `.gitignore` including `.env`, `node_modules/`, `__pycache__/`, `.venv/`, etc. — **must be created first**
2. `.env.example` with placeholder values and comments explaining each variable — **must be created before `.env`** so it serves as the canonical variable manifest
3. `.env` — generated from `.env.example` using a shell command (see [dd-secrets-env rule](../../rules/dd-secrets-env.mdc)). Use `.env.example` as the template so every declared variable is present. Substitute host environment values for secrets; keep defaults for non-secret vars. Validate that `DD_API_KEY` and `DD_SITE` are non-empty; if missing, ask the SE to export them and re-run.
4. `Makefile` — use the [Makefile template](templates/Makefile) as the starting point. It contains all canonical targets: `build`, `up`, `down`, `logs`, `smoke-test`, `traffic`, `clean`
5. `README.md` — use the [README template](templates/README.md) as the starting point and fill in all `{{PLACEHOLDER}}` values. The README must include: project description, architecture diagram (Mermaid), services table (name, language/framework, address), prerequisites, getting-started snippet, and Makefile targets table

### Step 4: Scaffold Services

For each service, generate:

1. Application code with a health endpoint (`/health` or `/healthz`)
2. DD tracer initialization (language-appropriate)
3. JSON-formatted logging to stdout (see the `dd-logging` rule)
4. At least one business-logic endpoint
5. Dockerfile with multi-stage build

**Important**: Do not rely on memorized or cached instrumentation snippets. Before generating DD instrumentation code for any language/framework, consult the **current official Datadog documentation** to ensure library names, APIs, and configuration options are up to date. Use web search scoped to `docs.datadoghq.com`, or use the [Datadog docs search](https://docs.datadoghq.com/search/) to look up:

- The correct tracing library and initialization for the chosen language (start from the [Tracing Setup](https://docs.datadoghq.com/tracing/trace_collection/) page)
- JSON logging setup with trace-log correlation (see `dd-logging` rule for format requirements; see also [Correlate Logs and Traces](https://docs.datadoghq.com/tracing/other_telemetry/connect_logs_and_traces/))
- Any required environment variables or Agent configuration for the selected DD products

### Step 5: Wire Service Topology

Use the reference topology from [topologies.md](topologies.md):

- `api-gateway` routes to `service-a`
- `service-a` calls `service-b`
- `service-b` reads/writes **PostgreSQL** and uses **Redis** as a cache
- **Database Monitoring** and the **Redis integration** are always enabled — see the `dd-docker-compose` rule for Agent and container configuration
- When the SE requests authentication, user sessions, or Cloud SIEM: add **Keycloak** as the identity provider — see the `dd-auth-sso` rule and the identity provider topology in [topologies.md](topologies.md)
- Include one **golden path** (successful end-to-end request)
- Include one **failure path** (inter-service failure with clear root cause)

### Step 6: Deployment Configuration

Generate deployment config for the chosen model:

- **Docker Compose**: follow the `dd-docker-compose` rule
- **Kubernetes**: follow the `dd-kubernetes` rule
- **AWS**: generate Terraform or CloudFormation with project-managed Agent

### Step 7: Traffic & Smoke Test

- Generate a Locust traffic generator in `traffic/locustfile.py` using the `dd-generate-traffic` skill
- Add a `traffic` service to the deployment config (Docker Compose or K8s) that runs Locust in headless mode alongside the application stack — the traffic service must be excluded from Datadog monitoring (see the `dd-generate-traffic` skill templates for the exact configuration)
- Generate `scripts/smoke-test.sh` that starts services, waits for health, makes one request, verifies success
- Make traffic parameters configurable via environment variables (rate, error %, latency)

### Step 8: Build & Validate

- Run the build/compile step for every service
- Surface any failures with actionable fixes
- Do not consider scaffolding complete until all services build successfully

## Post-Scaffold Checklist

- [ ] All services have distinct `service` tags
- [ ] `.env.example` contains all required DD variables
- [ ] `.env` is in `.gitignore`
- [ ] At least one golden path and one failure path exist
- [ ] All services build successfully
- [ ] `make up` starts the full stack including DD Agent
- [ ] Traffic generator is functional
- [ ] DBM is enabled for PostgreSQL
- [ ] Redis integration is enabled
- [ ] README contains architecture diagram, services table, and Makefile targets
