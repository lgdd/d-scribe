# {{PROJECT_NAME}}

{{DESCRIPTION}}

## Architecture

```mermaid
graph LR
    Client([Client]) --> GW[api-gateway]
    GW --> A[service-a]
    A --> B[service-b]
    B --> DB[(PostgreSQL)]
    B --> Cache[(Redis)]
```

<!-- Replace the diagram above with the actual topology. Add frontend, worker,
     or additional dependencies as needed. Use the topologies in topologies.md
     as a reference. -->

## Services

| Service | Language / Framework | Address |
| ------- | -------------------- | ------- |
| api-gateway | {{LANG}} | `http://localhost:8080` |
| service-a | {{LANG}} | `http://localhost:8081` |
| service-b | {{LANG}} | `http://localhost:8082` |

<!-- Add or remove rows to match the actual services. Include datastores and
     other infrastructure only if they expose a port to the host. -->

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) v2+
- A [Datadog](https://www.datadoghq.com/) account with a valid API key
- The following environment variables exported in your shell:

| Variable | Description |
| -------- | ----------- |
| `DD_API_KEY` | Your Datadog API key |
| `DD_SITE` | Datadog site (e.g. `datadoghq.com`, `datadoghq.eu`) |

## Getting Started

```bash
# 1. Copy the example env file and fill in your values
cp .env.example .env

# 2. Build and start all services (including the Datadog Agent)
make up

# 3. Tail logs to verify everything is running
make logs
```

The application will be available at `http://localhost:8080`.

## Makefile Targets

| Target | Description |
| ------ | ----------- |
| `make build` | Build all service images |
| `make up` | Build and start the full stack |
| `make down` | Stop all services |
| `make logs` | Tail logs from all services |
| `make smoke-test` | Run the smoke-test script |
| `make traffic` | Start only the traffic generator |
| `make clean` | Stop services, remove volumes and images |
