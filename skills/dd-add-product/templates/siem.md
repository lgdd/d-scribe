# Cloud SIEM

## Prerequisites

- **Keycloak** is strongly recommended as the primary SIEM event source — it provides structured auth event logs (login, logout, failed attempts) that map directly to SIEM detection rules. If Keycloak is not already in the project, consider adding it first via the identity provider topology (see `dd-auth-sso` rule)
- Alternatively, Nginx access logs, application auth logs, or K8s audit logs can serve as SIEM sources

## Agent Configuration

Enable log collection (should already be set in the standard Agent config):

```yaml
environment:
  - DD_LOGS_ENABLED=true
  - DD_LOGS_CONFIG_CONTAINER_COLLECT_ALL=true
```

For K8s audit logs, enable the audit log pipeline on the Agent:

```yaml
- DD_LOGS_CONFIG_AUDIT_ENABLED=true
```

## Application Changes

### Keycloak as SIEM Source (recommended)

Keycloak must emit structured JSON logs with event logging enabled:

```yaml
keycloak:
  environment:
    - KC_LOG_CONSOLE_OUTPUT=json
  # Realm export must include:
  #   eventsEnabled: true
  #   adminEventsEnabled: true
```

The `dd-auth-sso` rule provides the full Keycloak service definition, realm bootstrap, and Autodiscovery labels.

### Application Auth Logs

If the project has custom auth logic (not Keycloak), ensure auth events are logged as structured JSON with:

- `evt.name` — event type (e.g., `authentication.success`, `authentication.failure`)
- `usr.id` — user identifier
- `network.client.ip` — client IP (for impossible travel detection)
- `evt.outcome` — `success` or `failure`

## Deployment Config — Docker Compose

Ensure log source labels are set on the SIEM event source container so logs are correctly tagged:

```yaml
labels:
  com.datadoghq.ad.logs: '[{"source":"keycloak","service":"keycloak"}]'
```

## Cross-Product Wiring

- **Log Management**: SIEM consumes logs — all SIEM sources must have log collection enabled
- **APM**: Auth middleware spans show token validation latency alongside SIEM events
- **RUM**: When `datadogRum.setUser()` is configured, SIEM events and RUM sessions share the same user identity

## Detection Rules

With Keycloak auth events flowing, these out-of-the-box SIEM detection rules become demonstrable:

| Detection Rule | Trigger |
|---|---|
| Brute force login | Burst of `LOGIN_ERROR` events from a single IP |
| Impossible travel | Successful logins from geographically distant IPs in a short window |
| Credential stuffing | High volume of failed logins across many usernames from few IPs |

## Traffic Generator — Auth Flows

The Locust traffic generator should include tasks that produce SIEM-detectable events:

- Authenticate via Keycloak's direct access grant to generate successful login events
- Periodically send requests with expired/missing tokens to generate 401 errors
- Attempt logins with invalid credentials to produce `LOGIN_ERROR` events

## Failure Scenarios

| Scenario | Datadog Signal |
|---|---|
| Brute force attempt | Burst of failed-auth events → SIEM detection rule fires |
| Token expired | 401 cascade in APM traces and logs |
| IdP latency spike | Auth middleware span duration increases in APM |
| Credential stuffing | Cross-user failed logins → SIEM detection |

## References

- [Cloud SIEM](https://docs.datadoghq.com/security/cloud_siem/)
- [Log Detection Rules](https://docs.datadoghq.com/security/detection_rules/)
- [Keycloak Integration](https://docs.datadoghq.com/integrations/keycloak/)
