---
name: scaffold-demo
description: Create a complete Datadog demo project with pre-instrumented microservices, configured traffic generation, and full observability stack
tools:
  - terminal
  - file_read
  - file_write
---

# Scaffold Demo

Create a Datadog demo project from scratch. This skill orchestrates the full scaffolding workflow: CLI execution, domain customization, and scenario creation.

## Prerequisites

- `d-scribe` CLI installed (`npx d-scribe` or globally via `npm install -g d-scribe`)
- Docker and Docker Compose V2 installed

## Workflow

### Step 1: Discover available options

Run `d-scribe init demo --help` to see all available backends, frontends, features, and options. Do NOT hardcode these — always discover dynamically.

### Step 2: Analyze the user's request

Extract from the user's description:
- **Industry/domain** (e.g., e-commerce, banking, healthcare, SaaS)
- **Backend language(s)** (if specified, or infer from industry: banking → java:spring, ML/data → python:flask)
- **Frontend** (if the user mentions a UI, web app, or dashboard → react:vite)
- **Datadog features** (if the user mentions security, database monitoring, profiling, etc.)
- **Stack preferences** (compose is the only option in Phase 1)

Make reasonable defaults for anything not specified:
- No language preference → java:spring (most common in enterprise demos)
- No features mentioned → none (baseline APM+Logs+Infra is already included)
- Always use --stack compose --deploy local

### Step 3: Confirm the plan

Present the mapped CLI command to the user for confirmation before executing:

```
I'll create a demo with:
- Backend: java:spring
- Frontend: react:vite
- Features: dbm:postgresql, security:code
- Output: ./demo-project

Command: d-scribe init demo --backend java:spring --frontend react:vite --features dbm:postgresql,security:code --output ./demo-project

Does this look right?
```

### Step 4: Execute the CLI

Run the confirmed `d-scribe init demo` command.

### Step 5: Read the generated context

Read the generated `AGENTS.md` to understand the project structure and available skills.

### Step 6: Customize the domain (if available)

Read `skills/customize-domain/SKILL.md`. If it contains actual instructions (not a stub), follow them to:
- Rename entities from the todo app domain to the user's business domain
- Remove code blocks for features not included in the scaffold
- Adapt service names if the user specified them

If the skill is a stub (contains "coming in a future release"), skip this step.

### Step 7: Create demo scenarios (if available)

Read `skills/create-demo-scenarios/SKILL.md`. If it contains actual instructions, follow them to create golden paths and failure scenarios.

If the skill is a stub, skip this step.

### Step 8: Present the summary

Tell the user:
1. What was created (services, frontend, features)
2. How to launch: refer to the Launch section in AGENTS.md
3. Available skills they can run manually:
   - `preflight-check` — build, deploy, smoke test, validate, cleanup
   - `verify-telemetry` — confirm data arrives in Datadog (requires running stack + Datadog MCP)
   - `generate-runbook` — produce DEMO-RUNBOOK.md with talking points

## Notes

- Steps 1-7 execute automatically in sequence
- Step 8 hands control back to the user
- The CLI handles all file generation deterministically — this skill adds AI judgment for domain mapping and customization only
