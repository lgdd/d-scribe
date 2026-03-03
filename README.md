<p align="center">
  <img src="https://github.com/lgdd/doc-assets/blob/main/d-sect/d-sect.png?raw=true" alt="d-sect" width="400">
</p>

<h1 align="center">Datadog Sales Engineer Cursor Toolkit</h1>

Cursor toolkit for Datadog Sales Engineers. Provides rules, skills, subagents, and commands to rapidly scaffold, validate, and present demo projects that send telemetry to a Datadog sandbox organization.

## Prerequisites

- [Cursor](https://cursor.com/) with the [Datadog Extension](https://marketplace.visualstudio.com/items?itemName=Datadog.datadog-vscode) installed
- Access to the [Datadog MCP Server](https://docs.datadoghq.com/bits_ai/mcp_server/) for your sandbox organization
- [Docker](https://docs.docker.com/get-started/get-docker/) installed

## Quick Start

```bash
git clone https://github.com/lgdd/d-sect.git
cd d-sect
chmod +x install.sh
./install.sh
```

The installer symlinks skills, subagents, and commands into `~/.cursor/` so they are available across all Cursor projects.

## What's Included

### Rules (10 templates)

Project-scoped guardrails copied into each demo project by the scaffold skill. Not installed globally.

| Rule | Scope | Purpose |
|------|-------|---------|
| `dd-demo-architecture` | Always apply | Microservice topology, prohibited patterns, failure paths |
| `dd-unified-tagging` | Always apply | Unified Service Tagging (env, service, version) |
| `dd-secrets-env` | Always apply | .env handling, credential safety, DD_SITE awareness |
| `dd-deployment` | Always apply | Deployment model selection, Agent ownership |
| `dd-cursor-guidelines` | Always apply | Cursor interaction behavior, incremental scaffolding, build-after-change |
| `dd-preflight` | docker-compose + k8s + services + Makefile | Preflight validation rules (on-demand via `/dd-preflight`) |
| `dd-telemetry-correlation` | docker-compose + service source | Correlation wiring for all signal pairs (Logs+Traces, DBM+Traces, RUM+Traces, Profiles+Traces) |
| `dd-auth-sso` | docker-compose + api-gateway + keycloak | Keycloak OIDC identity provider, auth event logs for Cloud SIEM, RUM user identity |
| `dd-docker-compose` | docker-compose files | Agent container config, service labels, networking, exclusions |
| `dd-kubernetes` | K8s manifests | DaemonSet/Helm Agent, pod annotations, audit logs, exclusions |

### Skills (3)

Domain knowledge with supporting reference files. Installed to `~/.cursor/skills/`.

| Skill | Trigger | Description |
|-------|---------|-------------|
| `dd-scaffold-demo` | "scaffold a demo" | Creates a full demo project from scratch |
| `dd-add-product` | "add RUM", "add SIEM" | Adds a DD product to an existing demo |
| `dd-generate-traffic` | "generate traffic" | Creates Locust traffic service (excluded from DD monitoring) |

### Subagents (2)

Context-isolated workflows. Installed to `~/.cursor/agents/`.

| Subagent | Trigger | Description |
|----------|---------|-------------|
| `dd-validate-telemetry` | "validate telemetry" | Readonly check that telemetry is flowing — use on an already-running stack |
| `dd-demo-preflight` | "preflight check" | Full build/deploy/test/validate cycle that always tears down after |

### Commands (5)

Discoverable `/` entry points. Installed to `~/.cursor/commands/`.

| Command | Usage |
|---------|-------|
| `/dd-scaffold` | Scaffold a new demo project |
| `/dd-validate` | Validate telemetry is flowing |
| `/dd-preflight` | Run pre-demo readiness check |
| `/dd-add-product` | Add a DD product to the demo |
| `/dd-traffic` | Configure the Locust traffic service |

## Usage

### Create a new demo

Type `/dd-scaffold` in Cursor chat (or just say "scaffold a new Datadog demo"). The agent will ask for your language, deployment model, and product preferences, then generate a complete project.

### Validate your setup

With the stack already running, type `/dd-validate` to check that all services are sending telemetry to Datadog. This is readonly and non-destructive — it queries the Datadog API without starting or stopping anything. Requires the Datadog MCP Server (Datadog Cursor Extension) to be enabled.

### Pre-demo check

Preflight runs automatically at the end of each skill workflow (scaffolding, product addition, traffic generation). It builds, deploys, smoke-tests, validates telemetry, and **always cleans up** all containers and processes it started. It does not run after individual file edits — only when a skill completes its work. Type `/dd-preflight` to trigger it manually at any time.

## Repository Structure

```
d-sect/
├── README.md
├── install.sh
├── uninstall.sh
├── rules/              # Rule templates (copied into demo projects)
├── skills/             # Skills (symlinked to ~/.cursor/skills/)
│   ├── _auto-update.md # Shared auto-update procedure
│   ├── _doc-lookup.md  # Shared documentation lookup procedure
│   ├── dd-scaffold-demo/
│   ├── dd-add-product/
│   │   └── templates/  # Per-product reference templates
│   └── dd-generate-traffic/
├── agents/             # Subagents (symlinked to ~/.cursor/agents/)
│   ├── dd-validate-telemetry.md
│   └── dd-demo-preflight.md
└── commands/           # Commands (symlinked to ~/.cursor/commands/)
    ├── dd-scaffold.md
    ├── dd-validate.md
    ├── dd-preflight.md
    ├── dd-add-product.md
    └── dd-traffic.md
```

## Uninstall

```bash
cd d-sect
./uninstall.sh
```
