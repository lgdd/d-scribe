---
name: dd-add-product
description: Adds a Datadog product integration to an existing demo project. Use when the user asks to add APM, RUM, Log Management, SIEM, Profiler, DBM, or any other DD product to an already-scaffolded demo.
---

# Add Datadog Product to Demo

## Before You Begin

1. Identify which product the SE wants to add
2. Detect the current project setup:
   - Deployment model (Docker Compose / Kubernetes / AWS)
   - Language/framework of each service
   - Which DD products are already configured

## Supported Products

- **Infrastructure Monitoring** — host/container metrics, live processes
- **Log Management** — structured log collection and correlation
- **Observability Pipelines** — install and configure the OPW worker
- **Application Performance Monitoring** — distributed tracing
- **Real User Monitoring** — browser/mobile SDK (requires a frontend)
- **Database Monitoring** — query-level database insights
- **Continuous Profiler** — code-level performance profiling
- **Data Streams Monitoring** — Kafka/RabbitMQ/SQS pipeline visibility
- **Data Jobs Monitoring** — Spark/Airflow/dbt job observability
- **Feature Flags** — feature flag tracking integration
- **Cloud SIEM** — security event correlation (e.g. K8s Audit Logs, Nginx, Keycloak). If the demo already includes Keycloak (see `dd-auth-sso` rule), configure its log collection as a SIEM source — Keycloak auth events enable detection rules for brute force, impossible travel, and credential stuffing. If Keycloak is not present, consider adding it first via the identity provider topology extension to maximize SIEM demo value
- **Code Security** — static and runtime analysis (SAST/SCA/IAST)
- **Workload Protection** — runtime threat detection
- **Cloud Network Monitoring** — aggregate traffic by meaningful entities

## Workflow

### Step 1: Consult Datadog Documentation

Before making any changes, look up the **current official Datadog documentation** for the requested product. Use web search scoped to `docs.datadoghq.com`, or use the [Datadog docs search](https://docs.datadoghq.com/search/) to determine:

- Which Agent features or environment variables need to be enabled
- Whether application-level changes are required (SDK, library, annotations)
- Whether additional infrastructure is needed (e.g., audit log pipeline for SIEM)
- Which languages/frameworks are supported for this product

Do not rely on memorized or cached configuration snippets — Datadog products evolve frequently.

### Step 2: Assess Compatibility

- Check if the product requires an Agent feature not yet enabled
- Check if the product requires application-level changes (e.g., RUM SDK, profiler init)
- Check if the product requires additional infrastructure (e.g., audit log pipeline for SIEM)

### Step 3: Update Configuration

Apply changes in this order:

1. **Agent configuration** — enable required Agent features (env vars, Helm values, or DaemonSet config)
2. **Application code** — add SDK initialization, annotations, or environment variables
3. **Deployment config** — update docker-compose.yml, K8s manifests, or Terraform as needed
4. **Environment variables** — add any new required variables to `.env.example`
5. **Sync `.env`** — append any variables from `.env.example` that are missing in `.env`, substituting host environment values for secrets. Do not overwrite existing values in `.env`.

### Step 4: Build & Validate

- Rebuild affected services
- Verify the new product telemetry appears in Datadog (use the `dd-validate-telemetry` subagent or manual MCP queries)

## Post-Addition Checklist

- [ ] Agent feature is enabled
- [ ] Application instrumentation is correct
- [ ] `.env.example` updated with new variables (if any)
- [ ] `.env` synced with new variables (if any)
- [ ] Services rebuild successfully
- [ ] New telemetry is visible in Datadog
