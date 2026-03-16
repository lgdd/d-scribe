# Cloud Network Monitoring

## Prerequisites

- Datadog Agent v7.23.0+ with system-probe enabled
- Linux hosts or Kubernetes nodes (not supported on macOS/Windows containers)
- For Docker Compose demos: the Agent container needs elevated privileges

## Agent Configuration

Enable Network Performance Monitoring on the Agent:

```yaml
environment:
  - DD_SYSTEM_PROBE_ENABLED=true
  - DD_SYSTEM_PROBE_NETWORK_ENABLED=true
```

The Agent container requires additional capabilities and volumes:

```yaml
services:
  datadog-agent:
    cap_add:
      - SYS_ADMIN
      - SYS_RESOURCE
      - SYS_PTRACE
      - NET_ADMIN
      - NET_BROADCAST
      - NET_RAW
      - IPC_LOCK
      - CHOWN
    security_opt:
      - apparmor:unconfined
    volumes:
      - /sys/kernel/debug:/sys/kernel/debug
      - /proc:/host/proc:ro
      - /sys/fs/cgroup:/host/sys/fs/cgroup:ro
```

### Kubernetes

For Kubernetes, enable network monitoring in the Helm chart:

```yaml
datadog:
  networkMonitoring:
    enabled: true
```

## Application Changes

No application code changes required. Network monitoring is entirely Agent-side — it uses eBPF to observe network connections at the kernel level.

## Deployment Config

The Agent container needs the elevated privileges listed above. For Docker Compose, update the `datadog-agent` service. For Kubernetes, the Helm chart handles this when `networkMonitoring.enabled: true`.

## Cross-Product Wiring

- **APM**: Network flows are correlated with service-level traces — the Network Map shows the same services visible in the Service Map, but at the network layer
- **Infrastructure**: Network metrics (bytes sent/received, retransmits, TCP latency) appear alongside host/container metrics
- **DNS Monitoring**: Automatically enabled with NPM — shows DNS query volume, latency, and errors per service

## Failure Scenarios

| Scenario | Datadog Signal |
|---|---|
| Network partition between services | Retransmit spike and connection errors in Network Map |
| DNS resolution failure | DNS error count increase, service connectivity loss |
| High TCP retransmit rate | Retransmit metrics in Network Performance view |
| Unexpected external traffic | Outbound connections to unknown endpoints in Network Map |

## References

- [Network Performance Monitoring Setup](https://docs.datadoghq.com/network_monitoring/performance/setup/)
- [Network Map](https://docs.datadoghq.com/network_monitoring/performance/network_map/)
- [DNS Monitoring](https://docs.datadoghq.com/network_monitoring/dns/)
