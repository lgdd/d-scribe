---
name: dd-scaffold-demo
description: Create a Datadog demo project — scaffold microservices, customize the domain, and generate demo scenarios. Use when the user asks to create a demo, scaffold a project, set up a Datadog environment, or build a sample application.
tools:
  - terminal
  - file_read
  - file_write
---

# Scaffold Demo

Create a Datadog demo project from scratch using the `d-scribe` CLI. This is NOT a design exercise — it is a structured CLI workflow. Follow the steps below exactly.

## IMPORTANT — What This Skill Does NOT Do

- Do NOT ask about visual design, color schemes, or styling
- Do NOT brainstorm UI concepts or mockups
- Do NOT ask open-ended creative questions about the domain
- Do NOT treat this as a frontend design project

This skill runs a CLI command (`d-scribe init demo`) that generates a pre-built microservice project, then customizes it for the user's domain. The questions you ask are strictly about **technical choices** (backend language, Datadog features) — not about aesthetics.

## Prerequisites

- `d-scribe` CLI installed (`npx d-scribe` or globally via `npm install -g d-scribe`)
- Docker and Docker Compose V2 installed

## Workflow

### Step 1: Discover available options

Run `d-scribe init demo --help` to see all available backends, frontends, features, and options. Do NOT hardcode these — always discover dynamically.

### Step 2: Gather requirements

After running `--help`, immediately present this to the user in a single message. Fill in what you can infer from their request, and ask about the rest:

```
Here's what I'm thinking based on your description:

**Domain**: [what you understood, e.g., "Online sports store"]
**Backend**: [suggest one, e.g., "java:spring" — or ask if no clue]
**Frontend**: [yes/no — suggest yes if they mentioned UI/store/app]
**Datadog features** (beyond the baseline APM + Logs + Infra):
  - [ ] Database Monitoring (dbm:postgresql)
  - [ ] Code Security / IAST (security:code)
  - [ ] Continuous Profiling (profiling)
  - [ ] Cloud SIEM (siem)
  - [ ] Custom Metrics (metrics:custom)
**Output directory**: [. if CWD is empty, or ./suggested-name otherwise]

Which features do you want, and does the rest look right?
```

Do NOT skip this step. Do NOT silently default. Do NOT ask about visual mockups or design — this is a CLI scaffolding step, not a design session. Wait for the user's response before proceeding.

### Step 3: Confirm the plan

Present the mapped CLI command to the user for confirmation before executing:

```
I'll create a demo with:
- Domain: Online sports store
- Backend: java:spring
- Frontend: react:vite
- Features: dbm:postgresql, security:code
- Output: . (current directory)

Command: d-scribe init demo --backend java:spring --frontend react:vite --features dbm:postgresql,security:code --output .

Does this look right?
```

### Step 4: Execute the CLI

Run the confirmed `d-scribe init demo` command.

### Step 5: Read the generated context

Read the generated `AGENTS.md` to understand the project structure and available skills.

### Step 6: Customize the domain

Read `skills/dd-customize-domain/SKILL.md`. If it contains actual instructions (not a stub), follow them to:
- Adapt the generic todo app to the user's business domain
- Rename entities, services, and endpoints to match the domain
- Add domain-specific services, logic, and frontend customizations
- Update magic value prefixes for failure scenarios

If the skill is a stub (contains "coming in a future release"), skip this step.

### Step 7: Create demo scenarios (if available)

Read `skills/dd-create-demo-scenarios/SKILL.md`. If it contains actual instructions, follow them to create golden paths and failure scenarios.

If the skill is a stub, skip this step.

### Step 8: Present the summary

Tell the user:
1. What was created (services, frontend, features)
2. If customize-domain ran: the domain mapping that was applied
3. If create-demo-scenarios ran: `DEMO-SCENARIOS.md` was created — use it as a demo script
4. How to launch: refer to the Launch section in AGENTS.md
5. Available skills they can run manually:
   - `dd-preflight-check` — build, deploy, smoke test, validate, cleanup
   - `dd-verify-telemetry` — confirm data arrives in Datadog (requires running stack + Datadog MCP)
   - `dd-generate-runbook` — produce DEMO-RUNBOOK.md with talking points

## Notes

- Steps 1-7 execute automatically in sequence
- Step 8 hands control back to the user
- The CLI handles all file generation deterministically — this skill adds AI judgment for domain mapping and customization only
