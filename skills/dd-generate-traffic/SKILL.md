---
name: dd-generate-traffic
description: Creates configurable traffic simulators for Datadog demo projects. Use when generating synthetic traffic, creating load generators, adding traffic simulation, or configuring request patterns for demos.
---

# Generate Traffic Simulator

## Before You Begin

1. Detect the project's services and their exposed endpoints
2. Determine if a frontend exists (prefer routing traffic through it for RUM + APM correlation)
3. Check the deployment model (Docker Compose or Kubernetes) to decide how to define the traffic service

## Traffic Generator Workflow

### Step 1: Create the Locustfile

Use [templates/locustfile.py](templates/locustfile.py) as the starting point. Adapt the endpoints and scenarios to match the project's actual API surface.

### Step 2: Define Scenarios

Every traffic generator must include at minimum:

**Golden path** — successful end-to-end request:

- Hits the API gateway (or frontend)
- Propagates through all downstream services
- Returns 2xx
- Produces a complete distributed trace

**Failure path** — intentional error with clear root cause:

- Triggers the inter-service failure scenario defined in the architecture
- Produces error spans, error logs, and potentially alerts
- Must be explainable in a demo narrative

### Step 3: Configure Parameters

All parameters must be configurable via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `TRAFFIC_RATE` | `10` | Requests per second |
| `TRAFFIC_ERROR_RATE` | `0.1` | Fraction of requests that trigger failure path (0.0-1.0) |
| `TRAFFIC_LATENCY_MS` | `0` | Additional latency injected per request (ms) |
| `TRAFFIC_DURATION` | `0` | Duration in seconds (0 = run forever) |
| `TRAFFIC_TARGET` | (auto-detect) | Base URL of the entry point |

### Step 4: Traffic Patterns

When applicable, implement patterns that produce interesting Datadog visualizations:

- **Periodic ramp** — traffic increases over 5 minutes, holds, then drops. Produces clear trends.
- **Seasonal wave** — sinusoidal request rate. Supports Watchdog anomaly detection.
- **Burst spike** — sudden 10x traffic increase for 30 seconds. Demonstrates auto-scaling or saturation.

### Step 5: Deploy as a Service

The traffic generator must be deployed as a service alongside the application stack so it produces consistent traffic for the entire lifetime of the deployment.

**Docker Compose** — add a `traffic` service to `docker-compose.yml`. See [templates/docker-compose-traffic.yml](templates/docker-compose-traffic.yml) for the reference snippet.

**Kubernetes** — add a `traffic` Deployment to the K8s manifests. See [templates/k8s-traffic.yml](templates/k8s-traffic.yml) for the reference manifest.

### Step 6: Exclude from Datadog Monitoring

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

### Step 7: Makefile & Documentation

- Add `make traffic-up` and `make traffic-down` targets to the Makefile (or include the traffic service in the default `make up` / `make down` targets)
- Document traffic configuration in the project README

## Important

- All traffic must be **fully synthetic** — no real user data or PII
- Label generated data clearly (e.g., user agents like `dd-demo-traffic/1.0`)
- Traffic should be **safe to run repeatedly** without side effects (idempotent endpoints or cleanup logic)
- The traffic service must **never** be instrumented with Datadog tracing or logging
