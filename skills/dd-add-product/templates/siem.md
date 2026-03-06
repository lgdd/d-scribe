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

### Keycloak Syslog Listener

When using Keycloak as the SIEM source, the Agent must receive Keycloak logs via syslog — not Docker container logs. Mount a `keycloak.d/conf.yaml` into the Agent (see the `dd-docker-compose` rule for the volume mount):

```yaml
logs:
  - type: tcp
    port: 5140
    source: keycloak
    service: keycloak
```

Minimum Agent version: **7.64.0**.

## Application Changes

### Keycloak as SIEM Source (recommended)

Keycloak must forward structured JSON event logs to the Agent via syslog. The Keycloak `command` must include:

```
--log=console,syslog
--log-level=org.keycloak.events:debug
--log-syslog-endpoint=datadog-agent:5140
--log-syslog-output=json
```

- `--log-level=org.keycloak.events:debug` is critical — without it, Keycloak suppresses user-event and admin-event logs that the SIEM Content Pack relies on
- The realm export must include `eventsEnabled: true` and `adminEventsEnabled: true`

The `dd-auth-sso` rule provides the full Keycloak service definition, realm bootstrap, and syslog configuration.

### Application Auth Logs

If the project has custom auth logic (not Keycloak), ensure auth events are logged as structured JSON with:

- `evt.name` — event type (e.g., `authentication.success`, `authentication.failure`)
- `usr.id` — user identifier
- `network.client.ip` — client IP (for impossible travel detection)
- `evt.outcome` — `success` or `failure`

## Deployment Config — Docker Compose

For Keycloak, log collection is handled by the Agent's syslog listener, not Docker Autodiscovery labels. Only Unified Service Tagging labels are needed on the Keycloak container. See the `dd-docker-compose` rule for the full Agent and Keycloak configuration.

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
