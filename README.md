<p align="center">
  <img src="https://github.com/lgdd/doc-assets/blob/main/d-scribe/d-scribe.png?raw=true" alt="d-scribe" width="400">
</p>

<h1 align="center">Datadog Sales Engineer Cursor Toolkit</h1>

Provides rules, skills, subagents, and commands to rapidly scaffold, validate, and present demo projects that send telemetry to a Datadog sandbox organization.

## Prerequisites

- [Cursor](https://cursor.com/) with the [Datadog Extension](https://marketplace.visualstudio.com/items?itemName=Datadog.datadog-vscode) installed
- Access to the [Datadog MCP Server](https://docs.datadoghq.com/bits_ai/mcp_server/) for your sandbox organization
- [Docker](https://docs.docker.com/get-started/get-docker/) installed

## Quick Start

```bash
git clone https://github.com/lgdd/d-scribe.git
cd d-scribe
chmod +x install.sh
./install.sh
```

The installer symlinks skills, subagents, and commands into `~/.cursor/` so they are available across all Cursor projects.

## What's Included

### Rules (15 templates)

Project-scoped guardrails copied into each demo project by the scaffold skill. Not installed globally.

| Rule | Scope | Purpose |
|------|-------|---------|
| `dd-demo-architecture` | Always apply | Microservice topology, prohibited patterns, deterministic failure triggers |
| `dd-unified-tagging` | Always apply | Unified Service Tagging (env, service, version) |
| `dd-secrets-env` | Always apply | .env handling, credential safety, DD_SITE awareness |
| `dd-deployment` | Always apply | Deployment model selection, Agent ownership |
| `dd-cursor-guidelines` | Always apply | Cursor interaction behavior, incremental scaffolding, build-after-change |
| `dd-preflight` | docker-compose + k8s + services + Makefile | Preflight validation rules (on-demand via `/dd-preflight`) |
| `dd-telemetry-correlation` | docker-compose + service source | Correlation wiring for all signal pairs (Logs+Traces, DBM+Traces, RUM+Traces, Profiles+Traces) |
| `dd-auth-sso` | docker-compose + api-gateway + keycloak | Keycloak OIDC identity provider, auth event logs for Cloud SIEM, RUM user identity |
| `dd-docker-compose` | docker-compose files | Agent container config, service labels, networking, exclusions |
| `dd-docker-compose-postgres` | docker-compose files | PostgreSQL DBM setup (user, extensions, Autodiscovery labels) |
| `dd-docker-compose-mysql` | docker-compose files | MySQL DBM setup (Performance Schema, user, Autodiscovery labels) |
| `dd-docker-compose-mongo` | docker-compose files | MongoDB DBM setup (monitoring user, Autodiscovery labels) |
| `dd-kubernetes` | K8s manifests | DaemonSet/Helm Agent, pod annotations, audit logs, exclusions |
| `dd-logging` | Services and source files | JSON-formatted application logging for Datadog log collection and trace correlation |
| `dd-terraform` | `terraform/**` | Terraform conventions for Datadog dashboards, monitors, and SLOs |

### Skills (5)

Domain knowledge with supporting reference files. Installed to `~/.cursor/skills/`.

| Skill | Trigger | Description |
|-------|---------|-------------|
| `dd-scaffold-demo` | "scaffold a demo" | Creates a full demo project from scratch |
| `dd-add-product` | "add RUM", "add SIEM" | Adds a DD product to an existing demo |
| `dd-generate-traffic` | "generate traffic" | Creates Locust traffic service with named failure scenarios (excluded from DD monitoring) |
| `dd-terraform` | "add Terraform" | Generates Terraform HCL for Datadog dashboards, monitors, and SLOs |
| `dd-demo-narrator` | "generate runbook" | Generates a DEMO-RUNBOOK.md with talking points, DD UI nav, and failure playbooks |

### Subagents (2)

Context-isolated workflows. Installed to `~/.cursor/agents/`.

| Subagent | Trigger | Description |
|----------|---------|-------------|
| `dd-validate-telemetry` | "validate telemetry" | Readonly check that telemetry is flowing — use on an already-running stack |
| `dd-demo-preflight` | "preflight check" | Full build/deploy/test/validate cycle that always tears down after |

### Commands (7)

Discoverable `/` entry points. Installed to `~/.cursor/commands/`.

| Command | Usage |
|---------|-------|
| `/dd-scaffold` | Scaffold a new demo project |
| `/dd-validate` | Validate telemetry is flowing |
| `/dd-preflight` | Run pre-demo readiness check |
| `/dd-add-product` | Add a DD product to the demo |
| `/dd-traffic` | Configure the Locust traffic service |
| `/dd-narrator` | Generate demo runbook |
| `/dd-terraform` | Generate Terraform for DD dashboards, monitors, and SLOs |

## Usage

### Create a new demo

Type `/dd-scaffold` in Cursor chat (or just say "scaffold a new Datadog demo"). The agent will ask for your language, deployment model, and product preferences, then generate a complete project.

### Validate your setup

With the stack already running, type `/dd-validate` to check that all services are sending telemetry to Datadog. This is readonly and non-destructive — it queries the Datadog API without starting or stopping anything. Requires the Datadog MCP Server (Datadog Cursor Extension) to be enabled.

### Pre-demo check

Preflight runs automatically at the end of each skill workflow (scaffolding, product addition, traffic generation). It builds, deploys, smoke-tests, validates telemetry, and **always cleans up** all containers and processes it started. It does not run after individual file edits — only when a skill completes its work. Type `/dd-preflight` to trigger it manually at any time.

### Maintaining the toolkit

When working in the **d-scribe repo**, Cursor also loads repo-local agents and commands from `.cursor/agents/` and `.cursor/commands/`. These include `review-templates` — use it (or type `/review-templates`) to review and optionally fix the rules and skill templates for Datadog config correctness and doc alignment. This agent is not installed globally; it only runs in this repository.

## Uninstall

```bash
cd d-scribe
./uninstall.sh
```
