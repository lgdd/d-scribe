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
3. **Datadog products** to include (default: APM, Logs, Infrastructure Monitoring, Database Monitoring, Redis integration). When the user mentions an AI app, LLM-powered service, or chatbot, include **LLM Observability**
4. **Optional**: narrative context, audience, or specific use case

### Step 1.5: Present Plan

Before generating any files, present the SE with a summary of what will be scaffolded:

- Project name and directory structure
- Services (name, language/framework, role in topology)
- Datadog products to configure (baseline + add-ons)
- Deployment model (Docker Compose / Kubernetes / AWS)
- Failure scenarios to include (magic values and triggers)
- Optional components: Keycloak (auth/SIEM), LLM service, frontend

**Wait for the SE to confirm before proceeding to Step 2.** This is a checkpoint — do not generate any files until the plan is approved. If the SE requests changes, update the plan and re-present.

## Scaffolding Workflow

### Step 2: Project Structure

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

### Step 3: Copy Rule Templates

Copy all `.mdc` files from the toolkit's `rules/` directory into the new project's `.cursor/rules/`. The toolkit is located at the path stored in the skill's installation source (the symlink target of `~/.cursor/skills/dd-scaffold-demo/`). Navigate up two levels from the SKILL.md location to find the `rules/` directory.

### Step 4: Generate Core Files

Generate these files in order:

1. `.gitignore` including `.env`, `node_modules/`, `__pycache__/`, `.venv/`, etc. — **must be created first**
2. `.env.example` with placeholder values and comments explaining each variable — **must be created before `.env`** so it serves as the canonical variable manifest. Generate `DD_ENV` using the `{project}-{YYMMDD}` convention: slugify the project directory name to kebab-case and append today's date as `YYMMDD`. Example:
   ```
   # Unique demo environment — format: {project}-{YYMMDD}
   DD_ENV=ecommerce-260310
   ```
3. `.env` — generated from `.env.example` using a shell command (see [dd-secrets-env rule](../../rules/dd-secrets-env.mdc)). Use `.env.example` as the template so every declared variable is present. Substitute host environment values for secrets; keep defaults for non-secret vars. Validate that `DD_API_KEY` and `DD_SITE` are non-empty; if missing, ask the SE to export them and re-run.
4. `Makefile` — use the [Makefile template](templates/Makefile) as the starting point. It contains all canonical targets: `build`, `up`, `down`, `logs`, `smoke-test`, `traffic`, `clean`
5. `README.md` — use the [README template](templates/README.md) as the starting point and fill in all `{{PLACEHOLDER}}` values. The README must include: project description, architecture diagram (Mermaid), services table (name, language/framework, address), **demo scenarios** (golden path steps and failure paths with triggers and Datadog signals), prerequisites, getting-started snippet, and Makefile targets table. When Keycloak is present, include the **Authentication** section with credentials, auth endpoints, and persona mappings; otherwise remove the `AUTH:START`/`AUTH:END` block

### Step 5: Scaffold Services

For each service, generate:

1. Application code with a health endpoint (`/health` or `/healthz`)
2. DD tracer initialization (language-appropriate)
3. JSON-formatted logging to stdout (see the `dd-logging` rule)
4. At least one business-logic endpoint
5. Dockerfile with multi-stage build

**When to consult Datadog documentation**: Follow the [documentation lookup procedure](../_doc-lookup.md) for version-sensitive content — tracing library names, SDK initialization, API parameters, environment variables, and configuration for newer/less-stable products (LLM Observability, Data Streams Monitoring). Look up:

- The correct tracing library and initialization for the chosen language (start from the [Tracing Setup](https://docs.datadoghq.com/tracing/trace_collection/) page)
- JSON logging setup with trace-log correlation (see `dd-logging` rule for format requirements; see also [Correlate Logs and Traces](https://docs.datadoghq.com/tracing/other_telemetry/connect_logs_and_traces/))
- Any required environment variables or Agent configuration for the selected DD products

**Skip doc lookup** for structural patterns (docker-compose shape, Makefile targets, Dockerfile structure, Locust boilerplate), d-scribe conventions (topology, failure scenarios, naming), and glue code (health endpoints, service wiring).

### Step 6: Wire Service Topology

Use the reference topology from [topologies.md](topologies.md):

- `api-gateway` routes to `service-a`
- `service-a` calls `service-b`
- `service-b` reads/writes **PostgreSQL** and uses **Redis** as a cache
- **Database Monitoring** and the **Redis integration** are always enabled — see the `dd-docker-compose` rule for Agent and container configuration
- When the SE requests authentication, user sessions, or Cloud SIEM: add **Keycloak** as the identity provider — see the `dd-auth-sso` rule and the identity provider topology in [topologies.md](topologies.md)
- When the SE requests an AI app, LLM-powered service, or chatbot: add an **LLM service** calling an LLM provider — see the AI/LLM topology in [topologies.md](topologies.md)
- Include one **golden path** (successful end-to-end request)
- Include at least one **failure scenario** using a deterministic magic-value trigger from the [failure scenarios catalog](failure-scenarios.md). Each failure must be activated by a specific business input (product ID, coupon code, email) — never random probability or debug headers. When a frontend exists, magic products or coupons must appear in the UI so the demoer can trigger failures by clicking or typing

### Step 7: Deployment Configuration

Generate deployment config for the chosen model:

- **Docker Compose**: follow the `dd-docker-compose` rule
- **Kubernetes**: follow the `dd-kubernetes` rule
- **AWS**: generate Terraform or CloudFormation with project-managed Agent

### Step 8: Traffic & Smoke Test

- Generate a Locust traffic generator in `traffic/locustfile.py` using the `dd-generate-traffic` skill
- Add a `traffic` service to the deployment config (Docker Compose or K8s) that runs Locust in headless mode alongside the application stack — the traffic service must be excluded from Datadog monitoring (see the `dd-generate-traffic` skill templates for the exact configuration)
- Generate `scripts/smoke-test.sh` that starts services, waits for health, makes one request, verifies success
- Make traffic parameters configurable via environment variables (rate, latency) and task weights (failure scenario frequency)

### Step 9: Preflight (Optional)

After all files are generated, ask the SE if they want to run preflight validation. If they agree, run the `dd-demo-preflight` subagent to validate the project end-to-end (build, deploy, health checks, smoke test, telemetry validation, and teardown). If the SE declines, proceed to the post-scaffold checklist.

## Post-Scaffold Checklist

- [ ] All services have distinct `service` tags
- [ ] `.env.example` contains all required DD variables
- [ ] `.env` is in `.gitignore`
- [ ] At least one golden path and one failure path exist
- [ ] Each failure scenario uses a deterministic trigger (magic value), not random probability
- [ ] README documents demo scenarios (golden path steps, failure paths with triggers, reproduction steps, and Datadog signals)
- [ ] If Keycloak is present: README includes credentials, auth endpoints, and persona mappings
- [ ] All services build successfully
- [ ] `make up` starts the full stack including DD Agent
- [ ] Traffic generator is functional
- [ ] DBM is enabled for PostgreSQL
- [ ] Redis integration is enabled
- [ ] README contains architecture diagram, services table, demo scenarios, and Makefile targets
