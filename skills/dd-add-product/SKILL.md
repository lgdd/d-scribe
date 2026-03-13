---
name: dd-add-product
description: Adds a Datadog product integration to an existing demo project. Use when the user asks to add RUM, SIEM, Profiler, LLM Observability, or any other add-on DD product to an already-scaffolded demo.
---

# Add Datadog Product to Demo

## Before You Begin

### Step 0: Auto-Update Toolkit

Follow the procedure in [_auto-update.md](../_auto-update.md).

### Step 1: Assess the Project

1. Identify which product the SE wants to add
2. Detect the current project setup:
   - Deployment model (Docker Compose / Kubernetes / AWS)
   - Language/framework of each service
   - Which DD products are already configured

## Products

### Baseline (included by default)

The following products are configured automatically by the deployment rules (`dd-docker-compose`, `dd-kubernetes`) when a demo is scaffolded. If an SE asks to "add" one of these, verify it is already present before making changes — it almost certainly is.

- **Infrastructure Monitoring** — host/container metrics, live processes
- **Application Performance Monitoring** — distributed tracing
- **Log Management** — structured log collection and correlation
- **Database Monitoring** — query-level database insights (Postgres, MySQL, MongoDB)
- **Workload Protection** — runtime threat detection

### Add-on (use this skill)

These products require additional Agent features, application-level changes, or new infrastructure beyond the baseline. Use this skill to layer them onto an existing demo.

- **Observability Pipelines** — install and configure the OPW worker
- **Real User Monitoring** — browser/mobile SDK (requires a frontend)
- **Continuous Profiler** — code-level performance profiling
- **Data Streams Monitoring** — Kafka/RabbitMQ/SQS pipeline visibility
- **Data Jobs Monitoring** — Spark/Airflow/dbt job observability
- **Feature Flags** — feature flag tracking integration
- **Cloud SIEM** — security event correlation (e.g. K8s Audit Logs, Nginx, Keycloak). If the demo already includes Keycloak (see `dd-auth-sso` rule), configure its log collection as a SIEM source — Keycloak auth events enable detection rules for brute force, impossible travel, and credential stuffing. If Keycloak is not present, consider adding it first via the identity provider topology extension to maximize SIEM demo value
- **Code Security** — static and runtime analysis (SAST/SCA/IAST)
- **Cloud Network Monitoring** — aggregate traffic by meaningful entities
- **LLM Observability** — automatic tracing of LLM calls (Python/Node.js: OpenAI, Anthropic, Bedrock, LangChain; Java: OpenAI). Requires `ddtrace` (Python), `dd-trace` (Node.js), or `dd-trace-java` (Java) with `LLMObs.enable()` or equivalent SDK setup. Auto-instrumentation alone produces flat LLM spans — add custom span kinds (workflow, agent, task, tool, retrieval) for the execution graph and flame graph

## Workflow

### Step 2: Load Product Template

Check if a product-specific template exists in [templates/](templates/) (e.g., `templates/apm.md`, `templates/rum.md`). If one exists, read it — it contains prerequisites, Agent configuration, application changes, deployment fragments, and failure scenarios specific to that product.

If no template exists for the requested product, proceed directly to Step 3.

### Step 3: Consult Datadog Documentation (When Needed)

Follow the [documentation lookup procedure](../_doc-lookup.md) for version-sensitive content — SDK versions, library names, API parameters, environment variables, and configuration for newer/less-stable products (LLM Observability, Data Streams Monitoring). When a doc lookup is needed, verify and supplement the template (if one was loaded) or determine from scratch:

- Which Agent features or environment variables need to be enabled
- Whether application-level changes are required (SDK, library, annotations)
- Whether additional infrastructure is needed (e.g., audit log pipeline for SIEM)
- Which languages/frameworks are supported for this product

**Skip doc lookup** for structural patterns (docker-compose shape, Makefile targets, Dockerfile structure), d-scribe conventions (topology, naming), and glue code (health endpoints, service wiring).

### Step 4: Assess Compatibility

- Check if the product requires an Agent feature not yet enabled
- Check if the product requires application-level changes (e.g., RUM SDK, profiler init)
- Check if the product requires additional infrastructure (e.g., audit log pipeline for SIEM)

### Step 5: Update Configuration

Apply changes in this order:

1. **Agent configuration** — enable required Agent features (env vars, Helm values, or DaemonSet config)
2. **Application code** — add SDK initialization, annotations, or environment variables
3. **Deployment config** — update docker-compose.yml, K8s manifests, or Terraform as needed
4. **Environment variables** — add any new required variables to `.env.example`
5. **Sync `.env`** — append any variables from `.env.example` that are missing in `.env`, substituting host environment values for secrets. Do not overwrite existing values in `.env`.

### Step 6: Update README

After updating configuration, bring the project `README.md` in sync with the changes just made. Only modify sections affected by the product addition — leave the rest untouched.

1. **Architecture diagram** — if new services were added to the stack (e.g., Keycloak for SIEM, a frontend for RUM, an LLM service), add them to the Mermaid diagram and their connections
2. **Services table** — add a row for each new service introduced (service name, language/framework, address)
3. **Demo Scenarios — Failure Paths** — append rows for failure scenarios introduced by the product. The product template (Step 2) and the Datadog documentation (Step 3) describe product-specific failure scenarios — translate them into Trigger / Expected Behavior / Datadog Signal rows
4. **Authentication section** — if Keycloak was just added, insert the Authentication section (credentials, auth endpoints, persona mappings) using the `AUTH:START`/`AUTH:END` block from the README template as a reference. If Keycloak was already present, leave the section unchanged
5. **Prerequisites** — if the product requires new environment variables that the SE must export (e.g., `DD_APPLICATION_ID` for RUM, `OPENAI_API_KEY` for LLM Obs), add them to the Prerequisites variables table

### Step 7: Preflight (Optional)

After all changes are applied, ask the SE if they want to run preflight validation. If they agree, run the `dd-demo-preflight` subagent to validate the project end-to-end (build, deploy, health checks, smoke test, telemetry validation, and teardown). If the SE declines, proceed to the post-addition checklist.

## Post-Addition Checklist

- [ ] Agent feature is enabled
- [ ] Application instrumentation is correct
- [ ] `.env.example` updated with new variables (if any)
- [ ] `.env` synced with new variables (if any)
- [ ] Services rebuild successfully
- [ ] New telemetry is visible in Datadog
- [ ] README updated (architecture diagram, services table, demo scenarios, auth section as applicable)
