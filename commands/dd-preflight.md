# Pre-demo readiness check

Run a full preflight validation for the demo project.

Preflight also runs **automatically** after Cursor adds, updates, or deletes project files (see the `dd-preflight` rule). This command is available for manual triggering when needed.

Delegate to the `dd-demo-preflight` subagent, which will:

1. Verify `.env` credentials are populated
2. Build all services
3. Deploy the stack locally (Docker Compose or K8s)
4. Wait for health endpoints
5. Run a smoke test (golden path + failure path)
6. Validate telemetry is flowing to Datadog
7. Report an overall READY / NOT READY status
8. **Clean up** — all containers and processes started during preflight are always stopped and removed
