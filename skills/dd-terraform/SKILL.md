---
name: dd-terraform
description: Generates Terraform HCL for Datadog dashboards, monitors, and SLOs in an existing demo project. Use when the user asks to add Terraform, create dashboards as code, define monitors as code, or set up SLOs for a demo.
---

# Generate Terraform for Datadog Resources

## Before You Begin

### Step 0: Auto-Update Toolkit

Follow the procedure in [_auto-update.md](../_auto-update.md).

### Step 1: Assess the Project

1. Identify the services in the project (names, languages, endpoints)
2. Detect which Datadog products are already configured (APM, Logs, RUM, DBM, etc.)
3. Determine the deployment model (Docker Compose / Kubernetes / AWS)
4. Check if a `terraform/` directory already exists — if so, extend rather than overwrite

### Step 2: Consult Datadog Documentation

Look up the **current Datadog Terraform provider documentation** to verify resource schemas, argument names, and version compatibility. Follow the [documentation lookup procedure](../_doc-lookup.md) using these starting points:

- [Terraform Integration](https://docs.datadoghq.com/integrations/terraform/)
- [Terraform Provider Registry](https://registry.terraform.io/providers/DataDog/datadog/latest/docs)

Do not rely on memorized HCL snippets — the provider evolves frequently.

## Terraform Workflow

### Step 3: Scaffold Terraform Directory

Create the `terraform/` directory in the project root using the templates as a starting point:

- [templates/provider.tf](templates/provider.tf) — provider configuration and site-to-URL mapping
- [templates/variables.tf](templates/variables.tf) — shared input variables aligned with Unified Service Tagging
- [templates/outputs.tf](templates/outputs.tf) — resource URLs and IDs exposed after apply

```
terraform/
├── main.tf          # Provider configuration
├── variables.tf     # Shared variables (env, service names, tags)
├── outputs.tf       # Dashboard URLs, monitor IDs
├── dashboards.tf    # Dashboard resources
├── monitors.tf      # Monitor resources
└── slos.tf          # SLO resources
```

`main.tf` must:
- Pin the `DataDog/datadog` provider to `~> 4.0`
- Read `DD_API_KEY` and `DD_APP_KEY` from environment variables (never hardcode)
- Derive `api_url` from `DD_SITE` (default `datadoghq.com`)
- Use local backend only — demos are ephemeral

`variables.tf` must:
- Define `env`, `service_names` (list), `team`, `dd_site` (e.g. default `"datadoghq.com"` for provider `api_url`), and `project_name` (for dashboard/monitor/SLO display names)
- Align values with Unified Service Tagging (`DD_ENV`, `DD_SERVICE`, `DD_VERSION`)

### Step 4: Generate Dashboards

Use [templates/dashboard.tf](templates/dashboard.tf) as the starting point. Generate a `datadog_dashboard` resource for each logical grouping (typically one overview dashboard per project).

Each dashboard must include at minimum:

- **Request rate** — timeseries widget showing `trace.http.request.hits` by service
- **Error rate** — timeseries widget showing `trace.http.request.errors` / `trace.http.request.hits` by service
- **Latency (p95)** — timeseries widget showing `trace.http.request.duration.by.service.95p`
- **Log stream** — filtered to `env:$var.env`

When specific products are detected, add product-specific widgets:

| Product | Widget |
|---------|--------|
| Database Monitoring | Query metrics widget (`postgresql.queries.*`) |
| RUM | RUM performance widget (page load time, core web vitals) |
| Profiler | Top endpoints by CPU/wall time |
| LLM Observability | LLM request duration and token usage |

Use `ordered` layout. Group widgets by service or concern using `group_definition`.

### Step 5: Generate Monitors

Use [templates/monitor.tf](templates/monitor.tf) as the starting point. Generate monitors for each service detected in the project.

**Per-service monitors:**

| Monitor | Type | Query pattern |
|---------|------|---------------|
| High error rate | `metric alert` | `sum(last_5m):sum:trace.http.request.errors{service:<name>,env:<env>}.as_count() / sum:trace.http.request.hits{service:<name>,env:<env>}.as_count() > 0.05` |
| High p95 latency | `metric alert` | `avg(last_5m):avg:trace.http.request.duration.by.service.95p{service:<name>,env:<env>} > 1` |
| Low throughput | `metric alert` | `sum(last_10m):sum:trace.http.request.hits{service:<name>,env:<env>}.as_count() < 1` |

**Cross-service monitors:**

| Monitor | Type | Description |
|---------|------|-------------|
| Composite health | `composite` | Triggers when error rate AND latency monitors fire simultaneously |

Every monitor must include:
- `tags` with `env`, `service`, and `team`
- `message` with notification placeholders (`@slack-channel` or `@pagerduty`)
- `monitor_thresholds` with `warning` and `critical` values
- `include_tags = true`

### Step 6: Generate SLOs

Use [templates/slo.tf](templates/slo.tf) as the starting point. Generate SLOs for key services (typically the API gateway and primary backend service).

**Per-service SLOs:**

| SLO | Type | Metric |
|-----|------|--------|
| Availability | `metric` | Good events: requests with status < 500; Total: all requests |
| Latency | `metric` | Good events: requests with duration < threshold; Total: all requests |

Each SLO must include:
- `thresholds` block with `timeframe` (e.g., `"7d"`, `"30d"`), `target` (e.g., `99.9`), and `warning` (e.g., `99.95`)
- `tags` aligned with Unified Service Tagging

### Step 7: Wire into the Project

1. **Environment variables** — add `DD_APP_KEY` to `.env.example` with a comment explaining it is required for Terraform. Sync to `.env` using host environment value.
2. **Makefile** — add these targets:

```makefile
tf-init:
	cd terraform && terraform init

tf-plan:
	cd terraform && terraform plan

tf-apply:
	cd terraform && terraform apply -auto-approve

tf-destroy:
	cd terraform && terraform destroy -auto-approve
```

3. **README** — update the project README:
   - Add a **Terraform** section describing the dashboards, monitors, and SLOs that are managed
   - Add the `tf-*` targets to the Makefile Targets table
   - Add `DD_APP_KEY` to the Prerequisites variables table

4. **.gitignore** — append Terraform entries if not already present:
   ```
   terraform/.terraform/
   terraform/*.tfstate
   terraform/*.tfstate.backup
   terraform/.terraform.lock.hcl
   ```

### Step 8: Validate

1. Run `terraform init` in the `terraform/` directory to verify provider downloads correctly
2. Run `terraform validate` to confirm HCL is syntactically correct
3. Do **not** run `terraform apply` — the SE decides when to provision resources
4. Run the `dd-demo-preflight` subagent for full project validation

## Post-Generation Checklist

- [ ] `terraform/main.tf` reads credentials from environment (no hardcoded keys)
- [ ] Provider version is pinned with `~>` constraint
- [ ] All resources use tags aligned with Unified Service Tagging
- [ ] Dashboard widgets match the services and products in the project
- [ ] Monitors cover error rate, latency, and throughput per service
- [ ] SLOs have realistic targets and timeframes
- [ ] `.env.example` includes `DD_APP_KEY`
- [ ] `.env` synced with `DD_APP_KEY` from host environment
- [ ] Makefile has `tf-init`, `tf-plan`, `tf-apply`, `tf-destroy` targets
- [ ] `.gitignore` excludes Terraform state and provider cache
- [ ] `terraform validate` passes
- [ ] README updated with Terraform section and Makefile targets
