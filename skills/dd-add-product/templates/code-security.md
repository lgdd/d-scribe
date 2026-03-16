# Code Security (Application Security Management)

## Prerequisites

- Application service already instrumented with the Datadog tracer (`ddtrace`, `dd-trace`, `dd-java-agent`)
- Datadog Agent v7.41.0+ with APM enabled

## Agent Configuration

No special Agent changes required — ASM data flows through the standard APM pipeline. Ensure `DD_APM_ENABLED=true` is set (default).

## Application Changes

### Environment Variables

Add to each service that should be protected:

```yaml
environment:
  - DD_APPSEC_ENABLED=true           # Runtime threat detection (IAST/RASP)
  - DD_IAST_ENABLED=true             # Interactive Application Security Testing
  - DD_APPSEC_SCA_ENABLED=true       # Software Composition Analysis
```

### Language Support


| Language | Library           | IAST | SCA | Threat Detection |
| -------- | ----------------- | ---- | --- | ---------------- |
| Python   | `ddtrace`         | Yes  | Yes | Yes              |
| Node.js  | `dd-trace`        | Yes  | Yes | Yes              |
| Java     | `dd-java-agent`   | Yes  | Yes | Yes              |
| Go       | `dd-trace-go`     | No   | Yes | Yes              |
| .NET     | `dd-trace-dotnet` | Yes  | Yes | Yes              |
| Ruby     | `datadog`         | No   | Yes | Yes              |


### IAST — Vulnerability Detection

IAST detects vulnerabilities at runtime by tracking tainted data through the application. It identifies:

- SQL injection
- Command injection
- Path traversal
- SSRF (Server-Side Request Forgery)
- LDAP injection
- XSS (reflected)
- Insecure cookie / header configuration
- Weak hashing / cipher usage

No code changes required — IAST instruments automatically when `DD_IAST_ENABLED=true`.

### SCA — Dependency Vulnerabilities

Software Composition Analysis scans application dependencies for known vulnerabilities. It runs automatically when `DD_APPSEC_SCA_ENABLED=true` and reports findings in the Datadog Vulnerability Management view.

### Threat Detection & Protection

Runtime threat detection identifies attacks in progress (SQLi attempts, shell injection, path traversal probes). With `DD_APPSEC_ENABLED=true`, the tracer:

1. Monitors incoming requests for attack patterns
2. Reports security traces to Datadog ASM
3. Can block malicious requests when protection mode is enabled

To enable blocking (optional):

```yaml
environment:
  - DD_APPSEC_ENABLED=true
  - DD_APPSEC_RULES=/path/to/custom-rules.json  # Optional: custom WAF rules
```

Blocking rules are managed in the Datadog UI under ASM > Protection.

## Deployment Config

No additional containers needed. ASM runs inside the application process.

## Cross-Product Wiring

- **APM**: Security traces appear alongside regular APM traces — click a security event to see the full request trace
- **Log Management**: ASM events are correlated to logs via trace ID
- **Threat Intelligence**: Known-malicious IPs are flagged automatically in ASM traces

## Failure Scenarios


| Scenario                             | Datadog Signal                                            |
| ------------------------------------ | --------------------------------------------------------- |
| SQL injection attempt                | ASM threat event with attack payload, security trace      |
| Path traversal probe                 | ASM threat event, request blocked (if protection enabled) |
| Vulnerable dependency detected       | SCA finding in Vulnerability Management                   |
| IAST: tainted data reaches SQL query | IAST vulnerability finding with code location             |


## References

- [Application Security Management](https://docs.datadoghq.com/security/application_security/)
- [ASM Setup](https://docs.datadoghq.com/security/application_security/setup/)
- [Software Composition Analysis](https://docs.datadoghq.com/security/application_security/software_composition_analysis/)
- [Code Security (IAST)](https://docs.datadoghq.com/security/application_security/code_security/)

