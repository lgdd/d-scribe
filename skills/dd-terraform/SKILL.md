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

### Step 2: Consult Datadog Documentation (When Needed)

Follow the [documentation lookup procedure](../_doc-lookup.md) for Terraform provider resource schemas, argument names, and version-sensitive configuration. Use these starting points when a lookup is needed:

- [Terraform Integration](https://docs.datadoghq.com/integrations/terraform/)
- [Terraform Provider Registry](https://registry.terraform.io/providers/DataDog/datadog/latest/docs)

**Skip doc lookup** for structural patterns (directory layout, variable definitions, output wiring) and d-scribe conventions (UST variable naming, Makefile targets).

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

Use [templates/dashboard.tf](templates/dashboard.tf) as the starting point. Generate a `datadog_dashboard` resource for each logical grouping (typically one overview dashboard per project). Load [templates/dashboard-widgets.md](templates/dashboard-widgets.md) for widget specs and product-specific widgets.

### Step 5: Generate Monitors

Use [templates/monitor.tf](templates/monitor.tf) as the starting point. Generate monitors for each service detected in the project. Load [templates/monitors-reference.md](templates/monitors-reference.md) for query patterns and requirements.

### Step 6: Generate SLOs

Use [templates/slo.tf](templates/slo.tf) as the starting point. Load [templates/slos-reference.md](templates/slos-reference.md) for SLO types, metrics, and threshold requirements.

### Step 7: Wire into the Project

Load [templates/project-wiring.md](templates/project-wiring.md) for environment variables, Makefile targets, README updates, .gitignore entries, and the post-generation checklist.

### Step 8: Validate

1. Run `terraform init` in the `terraform/` directory to verify provider downloads correctly
2. Run `terraform validate` to confirm HCL is syntactically correct
3. Do **not** run `terraform apply` — the SE decides when to provision resources
