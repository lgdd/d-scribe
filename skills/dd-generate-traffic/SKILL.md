---
name: dd-generate-traffic
description: Creates configurable traffic simulators for Datadog demo projects. Use when generating synthetic traffic, creating load generators, adding traffic simulation, or configuring request patterns for demos.
---

# Generate Traffic Simulator

## Before You Begin

### Step 0: Auto-Update Toolkit

Follow the procedure in [_auto-update.md](../_auto-update.md).

### Step 1: Assess the Project

1. Detect the project's services and their exposed endpoints
2. Determine if a frontend exists (prefer routing traffic through it for RUM + APM correlation)
3. Check the deployment model (Docker Compose or Kubernetes) to decide how to define the traffic service

## Traffic Generator Workflow

### Step 2: Create the Locustfile

Use [templates/locustfile.py](templates/locustfile.py) as the starting point. Adapt the endpoints and scenarios to match the project's actual API surface.

### Step 3: Define Scenarios

Every traffic generator must include at minimum:

**Golden path** — successful end-to-end request:

- Hits the API gateway (or frontend)
- Propagates through all downstream services
- Returns 2xx
- Produces a complete distributed trace

**Named failure scenarios** — deterministic errors triggered by magic values:

- Each scenario uses a specific business input (product ID, coupon code, email) that deterministically causes a named failure — never random probability or debug headers
- The magic values are the same ones a demoer uses manually during a live presentation
- Each scenario gets its own Locust task with a descriptive name tag (e.g., `[retry-storm]`, `[timeout]`)
- Failure frequency is controlled by task weights, not an error-rate coin flip

Consult the [failure scenarios catalog](../../skills/dd-scaffold-demo/failure-scenarios.md) for the per-topology list of named scenarios, trigger values, and naming patterns. Adapt the scenarios to match the project's actual topology and endpoints.

### Step 4: Configure Parameters

All parameters must be configurable via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `TRAFFIC_RATE` | `10` | Requests per second |
| `TRAFFIC_LATENCY_MS` | `0` | Additional latency injected per request (ms) |
| `TRAFFIC_DURATION` | `0` | Duration in seconds (0 = run forever) |
| `TRAFFIC_TARGET` | (auto-detect) | Base URL of the entry point |

Failure scenario frequency is controlled by Locust task weights in the locustfile, not by an environment variable. Adjust the `@task(N)` weight on each scenario task to control how often it fires relative to the golden path.

### Step 5: Traffic Patterns

When applicable, implement patterns that produce interesting Datadog visualizations:

- **Periodic ramp** — traffic increases over 5 minutes, holds, then drops. Produces clear trends.
- **Seasonal wave** — sinusoidal request rate. Supports Watchdog anomaly detection.
- **Burst spike** — sudden 10x traffic increase for 30 seconds. Demonstrates auto-scaling or saturation.

### Step 6: Deploy as a Service

The traffic generator must be deployed as a service alongside the application stack so it produces consistent traffic for the entire lifetime of the deployment.

**Docker Compose** — add a `traffic` service to `docker-compose.yml`. See [templates/docker-compose-traffic.yml](templates/docker-compose-traffic.yml) for the reference snippet.

**Kubernetes** — add a `traffic` Deployment to the K8s manifests. See [templates/k8s-traffic.yml](templates/k8s-traffic.yml) for the reference manifest.

### Step 7: Exclude from Datadog Monitoring

The traffic service must be explicitly excluded from Datadog monitoring so it does not add noise to demo telemetry.

**Docker Compose:**

- Do **not** add Unified Service Tagging labels (`com.datadoghq.tags.*`)
- Add the label `com.datadoghq.ad.logs` with a rule that excludes all logs from collection
- See the template for the exact label syntax

**Kubernetes:**

- Do **not** add UST pod labels (`tags.datadoghq.com/*`)
- Add the annotation `admission.datadoghq.com/enabled: "false"` to prevent automatic library injection
- Add a log exclusion annotation to suppress log collection
- See the template for the exact annotation syntax

### Step 8: Makefile & Documentation

- Add `make traffic-up` and `make traffic-down` targets to the Makefile (or include the traffic service in the default `make up` / `make down` targets)
- Update the project README:
  - **Demo Scenarios — Failure Paths** — if the traffic generator introduces failure scenarios not already listed (e.g., burst spike causing saturation, error rate triggering alerts), add them as rows in the Failure Paths table with Trigger, Expected Behavior, and Datadog Signal
  - **Makefile Targets** — add the new traffic targets to the Makefile Targets table

### Step 9: Preflight

After all changes are applied, run the `dd-demo-preflight` subagent to validate the project end-to-end (build, deploy, health checks, smoke test, telemetry validation, and teardown). Do not consider the traffic generator complete until preflight passes or the SE acknowledges the failures.

## Important

- All traffic must be **fully synthetic** — no real user data or PII
- Label generated data clearly (e.g., user agents like `dd-demo-traffic/1.0`)
- Traffic should be **safe to run repeatedly** without side effects (idempotent endpoints or cleanup logic)
- The traffic service must **never** be instrumented with Datadog tracing or logging
