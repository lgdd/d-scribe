---
name: dd-customize-domain
description: Adapt the scaffolded todo app to a specific business domain — rename entities, add services, customize the frontend, and make the demo resonate with the target audience
tools:
  - terminal
  - file_read
  - file_write
---

# Customize Domain

Transform a scaffolded demo project from the generic todo-app into a domain-specific application that resonates with the target audience. Go beyond renaming — be creative with the domain to make the demo compelling.

## When to Use

- Called automatically by `dd-scaffold-demo` (step 6) when a business domain was specified
- Called manually when a SE wants to re-theme an existing demo project

## Workflow

### Step 1: Read project context

Read `AGENTS.md` to understand:
- Which backends are used (Java Spring, Python Flask, or both)
- Service names and ports
- Active features and dependencies
- Current entity names (default: User, Project, Task)

Read `docker-compose.yml` for service names, port mappings, and build contexts.

### Step 2: Design the domain mapping

From the user's business domain, design a compelling adaptation. Think beyond 1:1 renaming — consider what makes this domain interesting for a demo.

**Entity mapping** — Map the 3 base entities to domain concepts:
- User → domain actor (Customer, Patient, Trader, Driver, etc.)
- Project → domain container (Order, Case, Portfolio, Route, etc.)
- Task → domain item (OrderItem, Prescription, Trade, Delivery, etc.)

**Service mapping** — Rename services AND consider adding 1-2 domain-specific services:
- user-service → customer-service (or patient-service, etc.)
- project-service → order-service (or case-service, etc.)
- task-service → inventory-service (or pharmacy-service, etc.)
- Optional new service: notification-service, recommendation-service, pricing-service, etc.

**Frontend customization** — If a frontend exists, think about:
- Page titles and labels that match the domain
- Domain-appropriate entity fields (e.g., Order has "shipping address", Patient has "date of birth")
- A color scheme or branding hint if relevant

**API paths** — Rename to match domain:
- /api/users → /api/customers
- /api/projects → /api/orders
- /api/tasks → /api/items

**Magic values** — Domain-prefixed failure triggers:
- order-fail-500, customer-fail-timeout, etc.

Present the complete mapping to the user for confirmation before proceeding.

### Step 3: Rename and adapt service code

For each backend service in `services/`:

**Java Spring** (if applicable):
- Rename model classes, fields, controller endpoints, repository names
- Add domain-specific fields to entities (e.g., Order gets `shippingAddress`, `totalAmount`)
- Add domain-specific endpoints where they make the demo more interesting
- Update inter-service call URLs
- Rename Java files to match new class names

**Python Flask** (if applicable):
- Rename dict keys, variable names, route paths in `app.py`
- Add domain-specific fields and endpoints
- Update inter-service call URLs and env var names

### Step 4: Add new services (if designed in Step 2)

If the domain mapping includes new services:
1. Copy an existing service as a starting point (pick the closest match)
2. Adapt it to the new domain purpose
3. Add it to `docker-compose.yml` with proper DD_SERVICE, ports, depends_on
4. Wire it into the api-gateway proxy routes
5. Ensure it follows the same instrumentation pattern (APM, JSON logs)

### Step 5: Customize the frontend (if present)

If a frontend exists in `frontend/`:
- Update page titles, labels, and navigation to match the domain
- Add domain-specific form fields
- Update API calls to match renamed endpoints
- Make the UI feel domain-appropriate (terminology, layout, field labels)

### Step 6: Rename service directories and update infrastructure

- Rename `services/<old-name>/` directories using `mv`
- Update `docker-compose.yml`: service names, DD_SERVICE values, build contexts, container names, depends_on, inter-service URL env vars
- Add new services to docker-compose if created in Step 4

### Step 7: Update magic values

Replace generic failure triggers with domain-prefixed versions:
- In service code: `*-fail-500` → `<domain-entity>-fail-500`
- In `traffic/locustfile.py`: update magic values in all task methods

### Step 8: Update documentation

Rewrite to reflect the new domain:
- `AGENTS.md`: Stack section, Architecture table, entity descriptions, endpoint paths
- `README.md`: Stack section, Quick Start examples

## Constraints

- **Keep Datadog instrumentation intact** — DD_SERVICE must match service names, APM/Logs/Infra must stay functional
- **Present mapping for confirmation** before making any changes
- **New services must follow existing patterns** — same Dockerfile structure, same logging format, same DD env vars
- **After customization, the project must still build** — verify with `docker compose build` if in doubt
