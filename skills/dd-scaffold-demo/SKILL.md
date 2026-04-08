---
name: dd-scaffold-demo
description: Create a Datadog demo project — scaffold infrastructure, build domain-specific microservices, and generate demo scenarios. Use when the user asks to create a demo, scaffold a project, set up a Datadog environment, or build a sample application.
tools:
  - terminal
  - file_read
  - file_write
  - ask_user
---

# Scaffold Demo

Create a Datadog demo project using the `d-scribe` CLI and domain-specific code generation. The CLI produces deterministic infrastructure (Docker, agent, instrumentation). You produce the business logic, guided by instrumentation patterns.

## Tool Mapping (if available)

| Capability | Tool | Fallback |
|------------|------|----------|
| Structured questions | `AskUserQuestion` | Ask as numbered text options, wait for response |
| Progress tracking | `TaskCreate` / `TaskUpdate` | Output checklist as text, update with checkmarks |
| Plan approval | `AskUserQuestion` (single-select: approve/adjust) | Ask as text, wait for response |

If these tools are available, use them for ALL interactive steps below.
Each `<ASK_USER>` block contains the question, options, and type needed to construct a tool call.

## Progress Tracking

At the start of this workflow, create the following tasks.
Mark each as in_progress when starting, completed when done.

1. Gather prospect context
2. Choose features
3. Choose app stack
4. Choose deployment target
5. Review architecture proposal
6. Build demo
7. Validate and present summary

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
- For K8s targets: minikube (or kind) and kubectl installed
- For AWS targets: Terraform and AWS CLI configured

## Workflow

### Step 1: Discover available options

Run `d-scribe init demo --help` and `d-scribe list deploy` to see all available backends, frontends, features, deploy targets, and options. Do NOT hardcode these — always discover dynamically.

### Step 2: Confirm domain

Infer the domain from the user's trigger message.

If the trigger message is too vague to infer a domain (e.g., "create a demo"), ask directly: "What kind of application should this demo simulate?"

<ASK_USER>
Call the `ask_user` tool with a single-select question confirming the inferred domain.

Question: "I'll build the demo around this domain — does this sound right?"
Options:
- [inferred domain, e.g., "Online banking / fintech application"] (Recommended) — "I'll tailor services, scenarios, and failure modes around this domain"
- "Something else" — "I'd like a different domain focus"

Do not proceed to Step 3 until you receive the user's response.
</ASK_USER>

### Step 3: Prospect context

Gather prospect context in three focused sub-steps. All sub-steps use selectable options inferred from the confirmed domain and available CLI options (discovered in Step 1). Each `ask_user` call is **multi-select** so the SE can pick all that apply. All sub-steps are optional — if the SE skips or gives minimal input, proceed with reasonable defaults.

#### Step 3a: Tech stack

Based on the backends and frontends discovered in Step 1, infer which stacks are most likely for the confirmed domain and present them as options.

<ASK_USER>
Call the `ask_user` tool with a **multi-select** question.

Question: "What's the prospect's tech stack? (select all that apply)"
Options — infer 4-6 options that are realistic for the domain, drawn from the backends/frontends discovered in Step 1. Always include a "Skip" option. Examples for a fintech domain:
- "Java / Spring (Recommended)" — "Common in financial services backends"
- "Python / Flask or Django" — "Used for data processing, ML, APIs"
- "Go" — "High-performance services, payment processing"
- "React frontend" — "Customer-facing web portal"
- "Not sure / Skip" — "I'll use defaults (Java + Python + React)"

Mark the most likely options for the domain with "(Recommended)".
Do not proceed to Step 3b until you receive the user's response.
</ASK_USER>

#### Step 3b: Pain points

Based on the confirmed domain and the Datadog features available, infer the most common pain points and present them as options.

<ASK_USER>
Call the `ask_user` tool with a **multi-select** question.

Question: "What's driving the eval? What's not working today? (select all that apply)"
Options — infer 5-7 pain points that are realistic for the domain and map to Datadog capabilities. Always include a "Skip" option. Examples for a fintech domain:
- "Slow incident response / high MTTR" — "Takes too long to find root cause during outages"
- "No correlation between logs and traces" — "Jumping between tools to debug issues"
- "Database performance blind spots" — "Slow queries, no visibility into PostgreSQL/MySQL"
- "Security / compliance concerns" — "Need vulnerability detection, audit trails"
- "Migrating off another tool (Splunk, ELK, etc.)" — "Consolidating onto a single platform"
- "No proactive alerting" — "Reactive firefighting instead of catching issues early"
- "Not sure / Skip" — "I'll pick features in the next step"

Mark the most likely pain points for the domain with "(Recommended)".
Do not proceed to Step 3c until you receive the user's response.
</ASK_USER>

#### Step 3c: Future state

Based on the domain and selected pain points from Step 3b, infer the most relevant goals and present them as options.

<ASK_USER>
Call the `ask_user` tool with a **multi-select** question.

Question: "Where does the prospect want to be? (select all that apply)"
Options — infer 4-6 goals that logically follow from the selected pain points. Always include a "Skip" option. Examples for a fintech domain with MTTR + database pain points:
- "Full observability across all microservices" — "End-to-end visibility from frontend to database"
- "Unified platform replacing multiple tools" — "Single pane of glass for logs, traces, metrics"
- "Proactive alerting and anomaly detection" — "Catch issues before customers are impacted"
- "Faster incident resolution (MTTR < 15 min)" — "Quick root cause analysis with correlated telemetry"
- "Security and compliance visibility" — "Runtime threat detection, vulnerability scanning"
- "Not sure / Skip" — "I'll proceed with what we have"

Mark the goals most aligned with the selected pain points with "(Recommended)".
Do not proceed to Step 4 until you receive the user's response.
</ASK_USER>

### Step 4: Infer features

Based on the prospect's pain points and context from Step 3, infer which Datadog features to showcase. Map pain points to features:
- "slow MTTR" / "incident response" / "bottlenecks" → `profiling`
- "database performance" / "slow queries" → `dbm:postgresql`
- "security" / "compliance" / "vulnerabilities" → `security:code`
- "SIEM migration" / "security operations" / "threat detection" → `siem`
- If no pain points were provided, recommend `dbm:postgresql` as the default — it produces the most visually compelling Datadog demo with minimal setup

**Worked examples:**

> Prospect says: "Java shop migrating from Splunk, slow incident resolution, no visibility into PostgreSQL performance."
> → Check: `dbm:postgresql` (no DB visibility), `profiling` (slow incident resolution / MTTR)
> → Uncheck: `security:code`, `siem`
> → Note in `siem` line: "Splunk migration may indicate future SIEM interest — worth flagging"

> Prospect says: "Python/React on K8s, worried about security compliance."
> → Check: `security:code` (security/compliance concern)
> → Uncheck: `dbm:postgresql`, `profiling`, `siem`

Before calling `ask_user`, output a short text message listing the baseline: "**Baseline** (always active, not configurable): APM with distributed tracing, Log Management with trace correlation, Infrastructure Monitoring [+ RUM if a frontend is likely]."

Then use `ask_user` for the additional features.

<ASK_USER>
Call the `ask_user` tool with a **multi-select** question. Do NOT present the features as text.

Question: "Which additional features should this demo showcase? (Baseline: APM, Logs, Infra, RUM are always included)"
Options (all 4, with descriptions that include your reasoning tied to the prospect's context):
- Database Monitoring (dbm:postgresql) — [reason tied to prospect context]
- Continuous Profiling (profiling) — [reason tied to prospect context]
- Code Security / IAST (security:code) — [reason tied to prospect context]
- Cloud SIEM (siem) — [reason tied to prospect context]

Mark recommended options with "(Recommended)" in the label.
Do not proceed to Step 5 until you receive the user's response.
</ASK_USER>

### Step 5: Infer app stack

Based on the prospect's tech stack from Step 3, infer backends, frontend, and service count. Use the options discovered in Step 1.

Inference guidelines:
- If the prospect runs a specific language/framework, use the matching backend (e.g., Java Spring → `java:spring`)
- Always include at least 2 different backend languages to demonstrate cross-language distributed tracing
- If the prospect has a web app/portal, include a frontend matching their stack (React → `react:vite`, Angular → `angular:esbuild`, Vue → `vue:vite`)
- If the prospect's tech stack is unknown, default to `java:spring` + `python:flask` (best cross-language tracing story) and `react:vite`
- Service count: 3 for simple domains, 4 for moderate, 5+ for complex

**Worked examples:**

> Prospect runs: "Java Spring monolith, migrating to microservices, React frontend"
> → Backends: `java:spring` (matches their primary stack) + `python:flask` (cross-language tracing)
> → Frontend: `react:vite` (matches their React stack, enables RUM)
> → Services: 4 (moderate complexity for a migration story)

> Prospect runs: "Go + Python data pipeline, no frontend"
> → Backends: `go:gin` (matches Go stack) + `python:flask` (matches Python stack)
> → Frontend: none (backend-only pipeline)
> → Services: 3 (pipeline is inherently linear)

> Unknown tech stack or too vague:
> → Default to `java:spring` + `python:flask` + `react:vite` with 4 services — the most battle-tested combination for cross-language tracing demos.

Based on the domain (Step 2) and tech stack (Step 3a), infer concrete service names and assign each a backend framework. Also infer whether a frontend is needed.

Output the recommended stack as a text message. Example for a fintech domain:

"Here's what I'd build:

**Backends:** `java:spring` + `python:flask` (cross-language distributed tracing)
**Frontend:** `react:vite` (RUM for browser monitoring)"

Then use `ask_user` with a **multi-select** question listing the proposed services. The user selects the ones they want to keep.

<ASK_USER>
Call the `ask_user` tool with a **multi-select** question.

Question: "Select the services to include in the demo (minimum 2 with a dependency between them):"
Options (all proposed services, each with its framework and role):
- "[service-name] ([framework]) (Recommended)" — "[domain role + dependency info, e.g., 'Routes requests to account-service and transaction-service']"
- (repeat for each proposed service)

Mark all recommended services with "(Recommended)" in the label. Always propose at least 3 services.

**Validation after user responds:**
- If fewer than 2 services are selected: stop and tell the user "At least 2 services with a dependency between them are required for distributed tracing. Please select more services." Then re-ask.
- If the selected services have no inter-service dependency (e.g., two completely independent services): stop and tell the user which services call which, and ask them to include at least one caller-callee pair.

Do not proceed to Step 6 until you receive a valid selection.
</ASK_USER>

### Step 6: Deploy stack

Ask how to package the demo. Use the deploy targets discovered in Step 1 via `d-scribe list deploy`.

<ASK_USER>
Call the `ask_user` tool with a single-select question.

Question: "How should we package the demo?"
Options:
- "Docker Compose (Recommended)" — "Simplest setup, runs with `docker compose up`" [If prospect runs K8s, swap recommendation to Kubernetes instead]
- "Kubernetes" — "Runs on Minikube, closer to production K8s environments"

Do not proceed to Step 7 until you receive the user's response.
</ASK_USER>

### Step 7: Deploy location

Based on the stack chosen in Step 6, ask where it should run. Show only the relevant subset from `d-scribe list deploy`.

<ASK_USER>
Call the `ask_user` tool with a single-select question. Show only the options relevant to the deploy stack chosen in Step 6.

If Docker Compose was chosen:
  Question: "Where should the demo run? (Output directory: [. if CWD is empty, or ./suggested-name])"
  Options:
  - "Local (compose:local) (Recommended)" — "Runs on your laptop with Docker"
  - "AWS EC2 (compose:aws:ec2)" — "Provisions an EC2 instance with Terraform"

If Kubernetes was chosen:
  Question: "Where should the Kubernetes cluster run? (Namespace: [default to project dir name]. Output directory: [. if CWD is empty, or ./suggested-name])"
  Options:
  - "Local Minikube (k8s:local:minikube) (Recommended)" — "Runs on your laptop"
  - "AWS EC2 (k8s:aws:ec2)" — "Minikube on an EC2 instance"
  - "AWS EKS (k8s:aws:eks)" — "Managed EKS cluster (coming soon)"

Do not proceed to Step 8 until you receive the user's response.
</ASK_USER>

### Step 8: Review architecture (PLAN GATE)

Based on all confirmed choices from Steps 2-7, present a structured architecture summary. This is a hard gate — no execution begins until the user approves.

#### Summary template

Present the following sections as a text message:

**Domain:** [confirmed domain from Step 2]
**Prospect context:** [pain points from 3b, goals from 3c — if gathered]

**Stack:**
- Backends: [list with frameworks]
- Frontend: [framework or "none"]
- Services: [count]
- Deploy: [target from Steps 6-7]

**Services:**
| Name | Framework | Domain Role |
|------|-----------|-------------|
| [service-name] | [framework] | [role + dependencies] |

**Features:**
- Baseline (always active): APM, Logs, Infra [+ RUM if frontend]
- Configured: [selected features from Step 4 with brief rationale]

**Demo scenarios:**
- Golden path: [description]
- Failure scenarios: [list, each mapped to a feature]

**Tailored to prospect:** [how scenarios map to pain points — only if Step 3 context was gathered]

#### Gate rule

**HARD GATE:** Do NOT run `d-scribe init`, generate code, or modify any files until the user explicitly approves this summary. If the user says "adjust," loop back to the relevant gathering step (2-7).

<ASK_USER>
Output the full architecture summary as a text message using the template above, then immediately call the `ask_user` tool with a single-select question.

Question: "Does this architecture look right?"
Options:
- "Looks good, let's build it (Recommended)" — "Proceed to scaffolding and code generation"
- "Adjust something" — "I want to change services, scenarios, or focus areas"

If the user selects "Adjust something," ask which section they want to change (domain, stack, services, features, deploy, or scenarios) and loop back to the corresponding step.

Do not proceed to Step 9 until you receive the user's confirmation.
</ASK_USER>

### Step 9: Execute the CLI

Map the confirmed choices from Steps 2-8 to CLI arguments and run:

    d-scribe init demo --backend java:spring,python:flask --frontend react:vite --features dbm:postgresql,security:code,profiling --services 4 --deploy k8s --dest .

### Step 10: Read the generated context

Read the generated `AGENTS.md` to understand the project structure, available patterns, and features configured.

### Step 11: Build the application

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

After all services are built, update `docker-compose.yml` (or the K8s manifests in `k8s/` if using a K8s deploy target) to reflect the renamed services.

### Step 12: Create demo scenarios (if available)

Read `skills/dd-create-scenarios/SKILL.md`. If it contains actual instructions, follow them to create golden paths and failure scenarios.

If the skill is a stub (contains "coming in a future release"), skip this step.

### Step 13: Validate the demo

1. Read and follow `skills/dd-check-preflight/SKILL.md` but SKIP the teardown step — leave the stack running.

2. If preflight passed:
   Check if `DD_API_KEY` is set in `.env` (not a placeholder).
   - If yes and Datadog MCP is available: read and follow `skills/dd-check-telemetry/SKILL.md`
   - If not: skip telemetry verification, mention it in the summary

3. If preflight failed: attempt to fix, re-run. After 2 failed attempts, stop and present the errors to the user instead of continuing.

### Step 14: Present the summary

Tell the user:
1. What was created: list each service with its domain role and which Datadog features it demonstrates
2. The demo scenarios created (or note that the skill was skipped)
3. Preflight result: passed or failed (with details)
4. Telemetry verification result: passed, skipped (with reason), or issues found
5. How to launch: refer to the Launch section in AGENTS.md (stack is already running if preflight passed)
6. Available skills they can run manually:
   - `dd-create-runbook` — produce DEMO-RUNBOOK.md with talking points
   - `dd-check-telemetry` — if it was skipped: explain what's needed (configure MCP, set DD_API_KEY in .env)
   - `dd-check-preflight` — to re-run the full validation cycle
   - Datadog-as-Code: `dd-add-monitor` → `dd-add-slo` → `dd-add-dashboard` — generate Terraform for monitors, SLOs, and dashboards
7. Key talking points tailored to the prospect's pain points

## Notes

- Step 1 executes automatically
- Steps 2-8 are a progressive conversation — each step (and sub-step) uses `ask_user` and waits for a response before continuing
- Step 3 has three sub-steps (3a, 3b, 3c) — each with its own `ask_user` stop
- Step 8 is a formal plan gate — no execution until the user approves the architecture summary
- Steps 9-13 execute automatically after the architecture is confirmed in Step 8
- Step 14 hands control back to the user
- Steps 4-5 use inference: the agent proposes based on prospect context, the user confirms or adjusts
- If the SE gives minimal input, the agent makes reasonable assumptions, states them explicitly, and asks for confirmation
- The prospect context in Step 3 is optional but significantly improves demo relevance
- The CLI handles all infrastructure deterministically — this skill adds AI judgment for domain modeling, code generation, and scenario design
- The CLI auto-populates `.env` from host environment variables ($DD_API_KEY, $DD_SITE, $DD_APP_KEY) — most SEs already have these set on their machine
