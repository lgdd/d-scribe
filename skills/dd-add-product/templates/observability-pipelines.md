# Observability Pipelines

## Prerequisites

- An existing log pipeline (services sending logs to the Datadog Agent or directly to Datadog)
- Docker Compose or Kubernetes deployment

## Agent Configuration

When using the Observability Pipelines Worker (OPW), application services send logs to the OPW instead of directly to the Agent. The Agent can still collect infrastructure metrics and APM data independently.

Redirect log output from the Agent to the OPW by pointing `DD_LOGS_CONFIG_LOGS_DD_URL` at the OPW:

```yaml
environment:
  - DD_LOGS_CONFIG_LOGS_DD_URL=opw:8282  # OPW intake address
```

Or, send application logs directly to the OPW via syslog/HTTP and bypass the Agent for logs entirely.

## Application Changes

No application code changes required. The OPW sits between log sources and Datadog as a processing layer. Applications continue to emit logs in the same format.

If routing logs directly to the OPW (bypassing the Agent for logs), update each service's log destination:

```yaml
environment:
  - DD_AGENT_HOST=opw        # For log forwarding via OPW
```

## OPW Deployment

### Docker Compose

Add the OPW as a service:

```yaml
services:
  opw:
    image: datadog/observability-pipelines-worker:latest
    environment:
      - DD_API_KEY=${DD_API_KEY}
      - DD_SITE=${DD_SITE:-datadoghq.com}
      - DD_OP_PIPELINE_ID=${DD_OP_PIPELINE_ID}
      - DD_OP_SOURCE_DATADOG_AGENT_ADDRESS=0.0.0.0:8282
    ports:
      - "8282:8282"
    volumes:
      - opw-data:/var/lib/observability-pipelines-worker
```

### Kubernetes

Deploy via the OPW Helm chart:

```bash
helm install opw datadog/observability-pipelines-worker \
  --set datadog.apiKey=${DD_API_KEY} \
  --set datadog.pipelineId=${DD_OP_PIPELINE_ID} \
  --set env[0].name=DD_SITE,env[0].value=${DD_SITE}
```

## Environment Variables

Add to `.env.example`:

```bash
# Observability Pipelines
DD_OP_PIPELINE_ID=<your-pipeline-id>
```

The pipeline ID is obtained from the Datadog UI under Observability Pipelines > Pipelines after creating a pipeline configuration.

## Pipeline Configuration

Pipeline configurations are managed in the Datadog UI (Observability Pipelines > Pipelines). Common transforms for demos:

- **Filter**: Drop noisy logs (health checks, traffic generator)
- **Remap**: Enrich logs with additional fields or normalize formats
- **Sample**: Reduce log volume by sampling high-frequency events
- **Sensitive Data Scanner**: Redact PII before logs leave the infrastructure

## Cross-Product Wiring

- **Log Management**: OPW processes logs before they reach Datadog — transforms, filters, and routing visible in the Pipelines UI
- **SIEM**: OPW can route security-relevant logs to SIEM while filtering noise
- **Compliance**: Sensitive data redaction happens before logs leave the network

## Failure Scenarios

| Scenario | Datadog Signal |
|---|---|
| OPW overloaded | Log delivery delay, OPW buffer metrics spike |
| Pipeline misconfiguration | Logs dropped or malformed, gap in Log Explorer |
| OPW down | Logs buffer at source, delivery resumes when OPW recovers |

## References

- [Observability Pipelines Setup](https://docs.datadoghq.com/observability_pipelines/setup/)
- [Observability Pipelines Architecture](https://docs.datadoghq.com/observability_pipelines/architecture/)
- [OPW Configuration](https://docs.datadoghq.com/observability_pipelines/configurations/)
