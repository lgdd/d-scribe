---
name: dd-scaffold-demo
description: Create a Datadog demo project — scaffold infrastructure, build domain-specific microservices, and generate demo scenarios. Use when the user asks to create a demo, scaffold a project, set up a Datadog environment, or build a sample application.
tools:
  - terminal
  - file_read
  - file_write
---

# Scaffold Demo

Create a Datadog demo project using the `d-scribe` CLI and domain-specific code generation. The CLI produces deterministic infrastructure (Docker, agent, instrumentation). You produce the business logic, guided by instrumentation patterns.

## IMPORTANT — What This Skill Does NOT Do

- Do NOT ask about visual design, color schemes, or styling
- Do NOT brainstorm UI concepts or mockups
- Do NOT ask open-ended creative questions beyond what's needed to build the demo
- Do NOT treat this as a frontend design project
- Do NOT generate infrastructure code — the CLI handles that deterministically

This skill runs `d-scribe init demo` to generate pre-instrumented service scaffolds, then YOU write domain-specific code into those scaffolds using instrumentation patterns as reference.

## Prerequisites

- `d-scribe` CLI installed (`npx d-scribe` or globally via `npm install -g d-scribe`)
- Docker and Docker Compose V2 installed

## Workflow

### Step 1: Discover available options

Run `d-scribe init demo --help` to see all available backends, frontends, features, and options. Do NOT hardcode these — always discover dynamically.

### Step 2: Gather requirements

After running `--help`, immediately present this to the user in a single message. Fill in what you can infer from their request, and ask about the rest:

    Here's what I'm thinking based on your description:

    **Domain**: [what you understood, e.g., "Online banking application"]
    **Backend**: [suggest one or more, e.g., "java:spring" — or ask if no clue]
    **Frontend**: [yes/no — suggest yes if they mentioned UI/portal/app]
    **Services** (number of microservices): [suggest 3-4 based on domain complexity]
    **Datadog features** (beyond the baseline APM + Logs + Infra):
      - [ ] Database Monitoring (dbm:postgresql)
      - [ ] Code Security / IAST (security:code)
      - [ ] Continuous Profiling (profiling)
      - [ ] Cloud SIEM (siem)
      - [ ] Custom Metrics (metrics:custom)

    **Prospect context** (helps tailor the demo scenarios):
      - Current monitoring: [if mentioned, e.g., "migrating from Splunk" — otherwise "not specified"]
      - Pain points: [if mentioned, e.g., "slow incident response" — otherwise "not specified"]

    **Output directory**: [. if CWD is empty, or ./suggested-name otherwise]

    Which features do you want, and does the rest look right?

Do NOT skip this step. Do NOT silently default. Wait for the user's response before proceeding. The prospect context fields are optional — if the SE doesn't provide them, proceed without them.

### Step 3: Propose architecture

Based on the requirements, propose a concrete architecture:

    Here's the architecture I propose:

    **Services:**
    1. `api-gateway` (java:spring) — Routes requests, entry point
    2. `account-service` (java:spring) — Manages accounts and balances
    3. `transaction-service` (python:flask) — Processes transfers, showcases distributed tracing cross-language
    4. `fraud-detection-service` (python:flask) — Analyzes transactions, showcases Code Security + Profiling

    **Demo scenarios I'll create:**
    - Golden path: Customer logs in → checks balance → transfers funds → receives confirmation
    - Failure: Slow query on transaction history (DBM)
    - Failure: SQL injection attempt on search (Code Security)
    - Failure: CPU spike during batch fraud analysis (Profiling)

    [If prospect context was provided:]
    **Tailored to your prospect:**
    - Since they're migrating from Splunk, I'll emphasize log correlation with traces
    - The slow query scenario directly addresses their MTTR pain point

    Does this look right, or should I adjust anything?

Wait for the user's confirmation before proceeding.

### Step 4: Execute the CLI

Map the architecture to CLI arguments and run:

    d-scribe init demo --backend java:spring,python:flask --frontend react:vite --features dbm:postgresql,security:code,profiling --services 4 --output .

### Step 5: Read the generated context

Read the generated `AGENTS.md` to understand the project structure, available patterns, and features configured.

### Step 6: Build the application

Read `references/patterns/index.md` to see available instrumentation patterns.

For each service, one at a time:
1. Rename the service directory to its domain name (e.g., `service-1/` → `account-service/`)
2. Create domain entities, endpoints, and business logic appropriate to the service's role
3. For each Datadog feature in scope, load the relevant pattern from `references/patterns/` and adapt it to the domain context:
   - A slow query pattern becomes a slow query on the `transactions` table, not a generic example
   - A SQL injection pattern targets a domain-relevant search endpoint
   - A profiling pattern simulates a domain-relevant computation
4. Ensure inter-service calls use HTTP with proper service naming (DD_SERVICE env var matches the service name)
5. Run the build command (`docker compose build <service-name>` or framework-specific build) to verify compilation
6. Fix any errors before moving to the next service

**Do NOT start the next service until the current one compiles.**

After all services are built, update `docker-compose.yml` to reflect the renamed services.

### Step 7: Create demo scenarios (if available)

Read `skills/dd-create-demo-scenarios/SKILL.md`. If it contains actual instructions, follow them to create golden paths and failure scenarios.

If the skill is a stub (contains "coming in a future release"), skip this step.

### Step 8: Validate the demo

1. Read and follow `skills/dd-preflight-check/SKILL.md` but SKIP the teardown step — leave the stack running.

2. If preflight passed:
   Check if `DD_API_KEY` is set in `.env` (not a placeholder).
   - If yes and Datadog MCP is available: read and follow `skills/dd-verify-telemetry/SKILL.md`
   - If not: skip telemetry verification, mention it in the summary

3. If preflight failed: attempt to fix, re-run. After 2 failed attempts, stop and present the errors to the user instead of continuing.

### Step 9: Present the summary

Tell the user:
1. What was created: list each service with its domain role and which Datadog features it demonstrates
2. The demo scenarios created (or note that the skill was skipped)
3. Preflight result: passed or failed (with details)
4. Telemetry verification result: passed, skipped (with reason), or issues found
5. How to launch: refer to the Launch section in AGENTS.md (stack is already running if preflight passed)
6. Available skills they can run manually:
   - `dd-generate-runbook` — produce DEMO-RUNBOOK.md with talking points
   - `dd-verify-telemetry` — if it was skipped: explain what's needed (configure MCP, set DD_API_KEY in .env)
   - `dd-preflight-check` — to re-run the full validation cycle
7. If prospect context was provided: key talking points tailored to their pain points

## Notes

- Steps 1-8 execute automatically in sequence
- Step 9 hands control back to the user
- The CLI handles all infrastructure deterministically — this skill adds AI judgment for domain modeling, code generation, and scenario design
- If the SE gives minimal input ("banking demo, APM + DBM"), infer the rest and state assumptions in Step 3
- The prospect context in Step 2 is optional but improves demo relevance when available
- The CLI auto-populates `.env` from host environment variables ($DD_API_KEY, $DD_SITE, $DD_APP_KEY) — most SEs already have these set on their machine
