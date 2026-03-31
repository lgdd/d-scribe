---
name: dd-customize-domain
description: Adapt the todo app domain to a specific business context by renaming entities, services, and endpoints
tools:
  - terminal
  - file_read
  - file_write
---

# Customize Domain

Adapt a scaffolded demo project from the generic todo-app domain to the user's business context. This skill only renames — it never adds or removes services or features.

## When to Use

- Called automatically by `scaffold-demo` (step 6) when a business domain was specified
- Called manually when a SE wants to re-theme an existing demo project

## Workflow

### Step 1: Read project context

Read `AGENTS.md` to understand:
- Which backends are used (Java Spring, Python Flask, or both)
- Service names and ports
- Active features and dependencies
- Current entity names (default: User, Project, Task)

Read `docker-compose.yml` for service names, port mappings, and build contexts.

### Step 2: Determine domain mapping

From the user's description (industry, business domain), build a mapping. If no domain was specified, ask the user before proceeding.

Build a table like this and present it for confirmation:

| Current | New (example: e-commerce) |
|---------|--------------------------|
| User → | Customer |
| Project → | Order |
| Task → | OrderItem |
| user-service → | customer-service |
| project-service → | order-service |
| task-service → | inventory-service |
| /api/users → | /api/customers |
| /api/projects → | /api/orders |
| /api/tasks → | /api/items |

**Wait for user confirmation before proceeding.**

### Step 3: Rename domain entities in service code

For each backend service in `services/`:

**Java Spring** (if applicable):
- Rename model classes and fields (e.g., `User.java` → `Customer.java`, `name` stays generic)
- Rename controller classes and endpoint paths
- Rename repository/store variable names
- Update inter-service call URLs (e.g., `SERVICE_USER_URL` → `SERVICE_CUSTOMER_URL`, default values like `http://user-service:8081` → `http://customer-service:8081`)
- Rename Java files to match new class names

**Python Flask** (if applicable):
- Rename dict keys and variable names in `app.py`
- Rename route paths (e.g., `/api/users` → `/api/customers`)
- Update inter-service call URLs and env var names

**Both languages:**
- Rename the `api-gateway` proxy routes to match new service paths
- Update `application.properties` or env defaults with new service names

### Step 4: Rename service directories and infrastructure

- Rename `services/<old-name>/` directories to `services/<new-name>/` using `mv`
- Update `docker-compose.yml`:
  - Service names
  - `DD_SERVICE` values
  - `build:` context paths
  - `container_name` values
  - `depends_on` references
  - Inter-service URL env vars and defaults

### Step 5: Update magic values

Replace generic failure triggers with domain-prefixed versions:
- In service code: `*-fail-500` → `<domain-entity>-fail-500` (e.g., `order-fail-500`)
- In service code: `*-fail-timeout` → `<domain-entity>-fail-timeout`
- In `traffic/locustfile.py`: update magic values in all task methods

### Step 6: Update documentation

Rewrite the following sections to reflect the new domain:
- `AGENTS.md`: Stack section (service names), Architecture table (endpoints, calls), entity descriptions
- `README.md`: Stack section, Quick Start curl examples
- `CLAUDE.md` can be left as-is (it includes AGENTS.md)

## Constraints

- **Never add or remove services** — only rename existing ones
- **Keep Datadog instrumentation intact** — DD_SERVICE must match the new service names
- **Present mapping for confirmation** before making any changes
- **After renaming, the project must still build** — test with `docker compose build` if in doubt
