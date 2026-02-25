# Scaffold a new Datadog demo project

Create a new microservice demo project instrumented with Datadog. Before generating code, gather:

1. **Language/framework** — e.g., Python/Flask, Go/Gin, Node/Express, Java/Spring Boot
2. **Deployment model** — Docker Compose (default), Kubernetes, or AWS
3. **Datadog products** — APM, Logs, Infrastructure Monitoring (defaults), plus optionally: RUM, SIEM, Workload Protection, Profiler
4. **Demo narrative** (optional) — any specific use case or audience context

Then use the `dd-scaffold-demo` skill to generate the full project with correct architecture, instrumentation, deployment config, traffic generator, and rule templates.
